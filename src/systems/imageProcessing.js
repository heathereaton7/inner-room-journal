/**
 * Image Processing — converts an uploaded image into a diamond-art template.
 *
 * Pipeline:
 *   File → HTMLImageElement → canvas (max 1024 longest side)
 *     → unsharp-mask sharpening
 *     → palette extraction (image-q MMCQ / wuquant)
 *     → downscale to grid (cols × rows)
 *     → Floyd–Steinberg dithering against palette
 *     → Uint16Array of palette indices
 *     → sparkle detection (brightest 3% palette entries)
 *
 * No React dependencies — pure helpers usable from a worker if we ever move
 * the work off the main thread.
 */

import {
  utils,
  buildPaletteSync,
  applyPaletteSync,
} from 'image-q';

const { PointContainer } = utils;

import { nameColor } from '../data/diamondNamedColors.js';

// ────────────────────────────────────────────────────────────────────────────
// Quality presets — user-facing labels mapped to grid dimensions.
// ────────────────────────────────────────────────────────────────────────────
export const QUALITY_PRESETS = [
  { id: 'quick',       label: 'Quick',       cols: 80,  rows: 80 },
  { id: 'standard',    label: 'Standard',    cols: 120, rows: 120 },
  { id: 'detailed',    label: 'Detailed',    cols: 150, rows: 150 },
  { id: 'premium',     label: 'Premium',     cols: 200, rows: 200 },
  { id: 'masterpiece', label: 'Masterpiece', cols: 320, rows: 320 },
];

export function presetById(id) {
  return QUALITY_PRESETS.find(p => p.id === id) || QUALITY_PRESETS[2];
}

export function drillCount(preset) {
  return preset.cols * preset.rows;
}

// ────────────────────────────────────────────────────────────────────────────
// Step 1: File → canvas
// ────────────────────────────────────────────────────────────────────────────
/**
 * Load a File / Blob into an HTMLCanvasElement, downscaled so its longest
 * side is at most `maxSide` pixels. EXIF orientation is honored if the
 * browser supports `createImageBitmap` with imageOrientation.
 */
export async function loadImageToCanvas(file, maxSide = 1024) {
  // Try createImageBitmap first (faster + handles orientation)
  let bitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    // Fallback to HTMLImageElement
    bitmap = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  const sw = bitmap.width || bitmap.naturalWidth;
  const sh = bitmap.height || bitmap.naturalHeight;
  const scale = Math.min(1, maxSide / Math.max(sw, sh));
  const w = Math.max(1, Math.round(sw * scale));
  const h = Math.max(1, Math.round(sh * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, w, h);
  return canvas;
}

// ────────────────────────────────────────────────────────────────────────────
// Step 2: Unsharp mask sharpening (3×3 kernel)
// ────────────────────────────────────────────────────────────────────────────
/**
 * Returns a NEW canvas with unsharp-mask applied. Strength is the amount
 * added back; 0.4 is gentle, 1.0 is strong. Edges are clamped.
 */
export function sharpenCanvas(srcCanvas, strength = 0.4) {
  const w = srcCanvas.width, h = srcCanvas.height;
  const sctx = srcCanvas.getContext('2d');
  const src = sctx.getImageData(0, 0, w, h);
  const out = sctx.createImageData(w, h);
  const sp = src.data, op = out.data;
  const amount = strength;
  // 3×3 sharpen kernel (high-pass)
  // [ 0,        -amount,  0      ]
  // [-amount,  1+4*amt,  -amount ]
  // [ 0,        -amount,  0      ]
  const k0 = -amount;
  const k1 = 1 + 4 * amount;

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = (y * w + x) * 4;
      for (let c = 0; c < 3; c++) {
        const top    = sp[((y - 1) * w + x) * 4 + c];
        const left   = sp[(y * w + (x - 1)) * 4 + c];
        const center = sp[i + c];
        const right  = sp[(y * w + (x + 1)) * 4 + c];
        const bottom = sp[((y + 1) * w + x) * 4 + c];
        const v = top * k0 + left * k0 + center * k1 + right * k0 + bottom * k0;
        op[i + c] = Math.max(0, Math.min(255, v));
      }
      op[i + 3] = 255;
    }
  }
  // Copy 1-px border untouched
  for (let x = 0; x < w; x++) {
    for (const y of [0, h - 1]) {
      const i = (y * w + x) * 4;
      op[i] = sp[i]; op[i + 1] = sp[i + 1]; op[i + 2] = sp[i + 2]; op[i + 3] = 255;
    }
  }
  for (let y = 0; y < h; y++) {
    for (const x of [0, w - 1]) {
      const i = (y * w + x) * 4;
      op[i] = sp[i]; op[i + 1] = sp[i + 1]; op[i + 2] = sp[i + 2]; op[i + 3] = 255;
    }
  }

  const dstCanvas = document.createElement('canvas');
  dstCanvas.width = w; dstCanvas.height = h;
  dstCanvas.getContext('2d').putImageData(out, 0, 0);
  return dstCanvas;
}

// ────────────────────────────────────────────────────────────────────────────
// Step 3: Downscale to target grid (nearest-neighbor sampling)
// ────────────────────────────────────────────────────────────────────────────
/**
 * Produces a small canvas of size (cols × rows) by box-averaging the source.
 * Box averaging preserves color richness much better than nearest-neighbor
 * for diamond-art-sized downscales.
 */
export function downscaleToGrid(srcCanvas, cols, rows) {
  const dst = document.createElement('canvas');
  dst.width = cols; dst.height = rows;
  const dctx = dst.getContext('2d');
  dctx.imageSmoothingEnabled = true;
  dctx.imageSmoothingQuality = 'high';
  dctx.drawImage(srcCanvas, 0, 0, cols, rows);
  return dst;
}

// ────────────────────────────────────────────────────────────────────────────
// Step 4: Palette extraction (image-q MMCQ)
// ────────────────────────────────────────────────────────────────────────────
/**
 * Build a palette of N colors from the canvas. Returns an array of
 * { id, hex, label } entries (1-indexed; id 0 reserved for empty).
 */
export function extractPalette(canvas, numColors = 80) {
  const pc = PointContainer.fromHTMLCanvasElement(canvas);
  const pal = buildPaletteSync([pc], {
    colors: numColors,
    paletteQuantization: 'wuquant',
    colorDistanceFormula: 'euclidean-bt709',
  });
  pal.sort();

  // Extract sorted hex entries
  const points = pal.getPointContainer().getPointArray();
  const entries = [];
  const seen = new Set();
  for (const p of points) {
    const hex = rgbToHex(p.r, p.g, p.b);
    if (seen.has(hex)) continue;
    seen.add(hex);
    entries.push(hex);
  }
  // Build labeled palette
  return entries.map((hex, i) => ({
    id: i + 1,
    hex,
    label: `${nameColor(hex)} #${i + 1}`,
  }));
}

// ────────────────────────────────────────────────────────────────────────────
// Step 5: Quantize + dither canvas against palette → Uint16Array of indices
// ────────────────────────────────────────────────────────────────────────────
/**
 * Applies Floyd–Steinberg dithering against the given palette.
 * Returns:
 *   { cells: Uint16Array(cols*rows) — values 1..N (no 0), reference palette IDs }
 *
 * `palette` is the array returned from `extractPalette`.
 */
export function ditherToPaletteIndices(srcCanvas, palette, ditherMode = 'floyd-steinberg') {
  const cols = srcCanvas.width, rows = srcCanvas.height;
  const pc = PointContainer.fromHTMLCanvasElement(srcCanvas);

  // Rebuild image-q Palette from our extracted entries
  const iqPal = paletteToImageQPalette(palette);
  const dithered = applyPaletteSync(pc, iqPal, {
    imageQuantization: ditherMode,
    colorDistanceFormula: 'euclidean-bt709',
  });

  // Build hex→id map for lookup
  const hexToId = new Map();
  for (const p of palette) hexToId.set(p.hex.toLowerCase(), p.id);

  // Convert each pixel back to an id
  const ditherPts = dithered.getPointArray();
  const cells = new Uint16Array(cols * rows);
  for (let i = 0; i < ditherPts.length; i++) {
    const p = ditherPts[i];
    const hex = rgbToHex(p.r, p.g, p.b);
    const id = hexToId.get(hex.toLowerCase());
    if (id !== undefined) {
      cells[i] = id;
    } else {
      // Find nearest palette color by simple Euclidean
      let best = 0, bestDist = Infinity;
      for (const pe of palette) {
        const { r, g, b } = hexToRgb(pe.hex);
        const dr = r - p.r, dg = g - p.g, db = b - p.b;
        const d = dr * dr + dg * dg + db * db;
        if (d < bestDist) { bestDist = d; best = pe.id; }
      }
      cells[i] = best;
    }
  }
  return cells;
}

/**
 * Convert our palette objects to an image-q Palette.
 */
function paletteToImageQPalette(palette) {
  // image-q Palette accepts Points: we need to use the internal API but
  // there's a simpler trick — fromUint8Array to seed a PointContainer with
  // the palette colors, then buildPaletteSync on it.
  const u8 = new Uint8ClampedArray(palette.length * 4);
  for (let i = 0; i < palette.length; i++) {
    const { r, g, b } = hexToRgb(palette[i].hex);
    u8[i * 4]     = r;
    u8[i * 4 + 1] = g;
    u8[i * 4 + 2] = b;
    u8[i * 4 + 3] = 255;
  }
  const pc = PointContainer.fromUint8Array(u8, palette.length, 1);
  return buildPaletteSync([pc], {
    colors: palette.length,
    paletteQuantization: 'wuquant',
    colorDistanceFormula: 'euclidean-bt709',
  });
}

// ────────────────────────────────────────────────────────────────────────────
// Step 6: Sparkle detection
// ────────────────────────────────────────────────────────────────────────────
/**
 * Marks the brightest 3% of palette entries as sparkle: true, capped so
 * sparkle drills total no more than `maxSparklePct` of cells (default 6%).
 *
 * Mutates and returns the palette array.
 */
export function detectSparkles(palette, cells, thresholdPercentile = 0.97, maxSparklePct = 0.06) {
  // Brightness via perceptual luma
  const withBrightness = palette.map(p => {
    const { r, g, b } = hexToRgb(p.hex);
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return { ...p, luma };
  });

  // Find brightness threshold at desired percentile
  const sortedLuma = withBrightness.map(p => p.luma).sort((a, b) => a - b);
  const cutoffIdx = Math.floor(sortedLuma.length * thresholdPercentile);
  const cutoff = sortedLuma[cutoffIdx] ?? 240;

  // Identify candidate sparkle ids — those above cutoff
  let candidates = withBrightness.filter(p => p.luma >= cutoff && p.luma >= 220);
  // Cap by count of cells using those ids
  const counts = new Map();
  for (let i = 0; i < cells.length; i++) {
    counts.set(cells[i], (counts.get(cells[i]) || 0) + 1);
  }
  // Sort candidates by luma desc and add until we hit maxSparklePct of cells
  candidates.sort((a, b) => b.luma - a.luma);
  const maxCells = cells.length * maxSparklePct;
  let usedCells = 0;
  const sparkleIds = new Set();
  for (const c of candidates) {
    const cnt = counts.get(c.id) || 0;
    if (cnt === 0) continue;
    if (usedCells + cnt > maxCells) break;
    sparkleIds.add(c.id);
    usedCells += cnt;
  }
  // Apply flag
  return palette.map(p => sparkleIds.has(p.id) ? { ...p, sparkle: true } : p);
}

// ────────────────────────────────────────────────────────────────────────────
// Top-level: process file → template object (no metadata yet)
// ────────────────────────────────────────────────────────────────────────────
/**
 * Processes an uploaded file into a complete imported template payload.
 *
 *   file                — File or Blob
 *   presetId            — one of QUALITY_PRESETS ids
 *   options.numColors   — palette size (default 80)
 *   options.sharpen     — boolean (default true)
 *   options.sparkles    — boolean (default true)
 *   options.onProgress  — (stepLabel, fraction) callback
 *
 * Returns { cols, rows, palette, cells, thumbnail, sparkleCount }
 */
export async function processImageToTemplate(file, presetId, options = {}) {
  const {
    numColors = 80,
    sharpen = true,
    sparkles = true,
    onProgress = () => {},
  } = options;
  const preset = presetById(presetId);

  onProgress('Loading image', 0.1);
  let canvas = await loadImageToCanvas(file, 1024);

  if (sharpen) {
    onProgress('Sharpening', 0.25);
    canvas = sharpenCanvas(canvas, 0.4);
  }

  onProgress('Extracting palette', 0.45);
  // Build palette from full-res sharpened canvas for color accuracy
  let palette = extractPalette(canvas, numColors);

  onProgress('Downscaling', 0.65);
  const small = downscaleToGrid(canvas, preset.cols, preset.rows);

  onProgress('Dithering drills', 0.85);
  const cells = ditherToPaletteIndices(small, palette, 'floyd-steinberg');

  let sparkleCount = 0;
  if (sparkles) {
    palette = detectSparkles(palette, cells);
    for (let i = 0; i < cells.length; i++) {
      const p = palette.find(pp => pp.id === cells[i]);
      if (p?.sparkle) sparkleCount++;
    }
  }

  // Build thumbnail from the downscaled+dithered grid for picker
  const thumbnail = await canvasToThumbnail(small, palette, cells, preset.cols, preset.rows, 96);

  onProgress('Done', 1);
  return {
    cols: preset.cols,
    rows: preset.rows,
    palette,
    cells,
    thumbnail,
    sparkleCount,
  };
}

/**
 * Render a small JPEG thumbnail of the diamond grid (final post-dither look).
 */
export function canvasToThumbnail(downCanvas, palette, cells, cols, rows, size = 96) {
  // Render each cell's hex onto a `size` × `size` proportional canvas
  const aspect = cols / rows;
  const w = aspect >= 1 ? size : Math.round(size * aspect);
  const h = aspect >= 1 ? Math.round(size / aspect) : size;
  const thumb = document.createElement('canvas');
  thumb.width = cols; thumb.height = rows;
  const ctx = thumb.getContext('2d');
  const img = ctx.createImageData(cols, rows);
  const data = img.data;
  for (let i = 0; i < cells.length; i++) {
    const id = cells[i];
    const p = palette.find(pp => pp.id === id);
    const { r, g, b } = p ? hexToRgb(p.hex) : { r: 0, g: 0, b: 0 };
    data[i * 4]     = r;
    data[i * 4 + 1] = g;
    data[i * 4 + 2] = b;
    data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);

  // Scale to thumbnail size
  const out = document.createElement('canvas');
  out.width = w; out.height = h;
  const outCtx = out.getContext('2d');
  outCtx.imageSmoothingEnabled = true;
  outCtx.imageSmoothingQuality = 'high';
  outCtx.drawImage(thumb, 0, 0, w, h);
  return out.toDataURL('image/jpeg', 0.78);
}

/**
 * Recommend a preset id based on the source image aspect ratio.
 */
export function recommendedPreset(srcCanvas) {
  if (!srcCanvas) return 'detailed';
  const ar = srcCanvas.width / srcCanvas.height;
  if (ar < 0.9) return 'premium';       // portrait
  if (ar > 1.6) return 'detailed';      // wide landscape
  return 'detailed';
}

// ── color helpers ─────────────────────────────────────────────────────────
export function hexToRgb(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const n = parseInt(h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
export function rgbToHex(r, g, b) {
  const to = v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}
