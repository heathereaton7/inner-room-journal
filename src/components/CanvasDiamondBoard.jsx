import { useEffect, useRef, useMemo, useState, useCallback } from 'react';

// Normalize cell data (Array | Uint16Array | object-with-numeric-keys) to Uint16Array
function toUint16(cells, expectedSize) {
  if (!cells) return new Uint16Array(expectedSize);
  if (cells instanceof Uint16Array && cells.length === expectedSize) return cells;
  const out = new Uint16Array(expectedSize);
  if (Array.isArray(cells) || cells instanceof Uint16Array || cells instanceof Uint8Array) {
    for (let i = 0; i < Math.min(cells.length, expectedSize); i++) out[i] = cells[i] || 0;
    return out;
  }
  if (typeof cells === 'object') {
    for (const k in cells) {
      const n = parseInt(k, 10);
      if (Number.isFinite(n) && n >= 0 && n < expectedSize) out[n] = cells[k] || 0;
    }
  }
  return out;
}

/**
 * CanvasDiamondBoard — Canvas-based diamond-art renderer with zoom + pan.
 *
 * Replaces the SVG-DOM renderer so we can support grids from 40×40 up to
 * 320×320 (≈100,000 drills) without choking the DOM.
 *
 * Props:
 *   progress       — { cells: number[]|Uint16Array, cols, rows, palette, mode }
 *   template       — original template (guided mode); null for freestyle
 *   selectedColor  — currently chosen palette id
 *   onCellTap      — (idx) => void
 *   maxHeightVh    — optional cap on board height (default 70)
 */
export default function CanvasDiamondBoard({
  progress, template, selectedColor, onCellTap, maxHeightVh = 70,
}) {
  const { cols, rows, palette, cells, mode } = progress;
  const wrapperRef = useRef(null);
  const canvasRef = useRef(null);
  const spritesRef = useRef(null);            // { regular: Map, pearl: Map, sparkle: Map, empty: Map }
  const spriteSizeRef = useRef(0);
  const viewRef = useRef({ scale: 1, panX: 0, panY: 0 });
  const lastDrawRef = useRef(0);
  const rafRef = useRef(null);
  const flashRef = useRef({ idx: -1, t: 0 });
  const [hudPos, setHudPos] = useState({ idx: -1, x: 0, y: 0 }); // optional hover indicator

  // Fast palette lookup
  const paletteMap = useMemo(() => {
    const m = new Map();
    palette.forEach(p => m.set(p.id, p));
    return m;
  }, [palette]);

  // Convert cells to a typed array once for fast access (Uint16Array if not already).
  // Handles plain Array, Uint16Array, and JSON-deserialized typed-array objects
  // (which appear as {0: ..., 1: ..., length: undefined}).
  const cellArr = useMemo(() => toUint16(cells, cols * rows), [cells, cols, rows]);

  const templateCells = useMemo(() => {
    if (!template) return null;
    return toUint16(template.cells, (template.grid?.cols || cols) * (template.grid?.rows || rows));
  }, [template, cols, rows]);

  // ── Build gem sprite atlas (one offscreen canvas per palette color × style) ──
  const buildSprites = useCallback((spriteSize) => {
    const reg = new Map();
    const sparkle = new Map();
    const pearl = new Map();
    const emptyTarget = new Map();   // ghost outlines for unfilled cells

    for (const p of palette) {
      reg.set(p.id, buildGem(spriteSize, p.hex, 'regular'));
      if (p.sparkle) sparkle.set(p.id, buildGem(spriteSize, p.hex, 'sparkle'));
      if (p.pearl) pearl.set(p.id, buildGem(spriteSize, p.hex, 'pearl'));
      emptyTarget.set(p.id, buildEmptyTarget(spriteSize, p.hex));
    }
    spritesRef.current = { reg, sparkle, pearl, emptyTarget };
    spriteSizeRef.current = spriteSize;
  }, [palette]);

  // ── Render loop ──
  // requestDraw must always call the LATEST draw function (which captures
  // current selectedColor, cells, etc.) so we route through a ref.
  const drawFnRef = useRef(() => {});
  const requestDraw = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      drawFnRef.current();
    });
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !spritesRef.current) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    const { scale, panX, panY } = viewRef.current;
    const cellSizePx = cellPixelSize() * scale;
    const spriteSize = spriteSizeRef.current;

    // Background
    ctx.fillStyle = '#0A0805';
    ctx.fillRect(0, 0, W, H);

    if (cellSizePx <= 0) return;

    // Viewport in grid coordinates
    const c0 = Math.max(0, Math.floor((-panX) / cellSizePx) - 1);
    const r0 = Math.max(0, Math.floor((-panY) / cellSizePx) - 1);
    const c1 = Math.min(cols, Math.ceil((W - panX) / cellSizePx) + 1);
    const r1 = Math.min(rows, Math.ceil((H - panY) / cellSizePx) + 1);

    const sprites = spritesRef.current;
    const flashIdx = flashRef.current.idx;
    const flashT = flashRef.current.t;

    // Show numbers when cells are big enough on screen (>=10px)
    const showNumbers = cellSizePx >= 10;
    const fontSize = Math.max(6, Math.min(14, cellSizePx * 0.55));
    if (showNumbers) {
      ctx.font = `600 ${fontSize}px ui-sans-serif, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
    }

    for (let r = r0; r < r1; r++) {
      for (let c = c0; c < c1; c++) {
        const i = r * cols + c;
        const filled = cellArr[i];
        const targetId = templateCells ? templateCells[i] : 0;
        const dx = c * cellSizePx + panX;
        const dy = r * cellSizePx + panY;
        let sprite;
        let scaleFactor = 1;
        if (filled) {
          const p = paletteMap.get(filled);
          if (p?.sparkle) sprite = sprites.sparkle.get(filled);
          else if (p?.pearl) sprite = sprites.pearl.get(filled);
          else sprite = sprites.reg.get(filled);
          if (flashIdx === i) {
            const pulse = 1 + (1 - flashT) * 0.2;
            scaleFactor = pulse;
          }
        } else if (mode === 'guided' && targetId > 0) {
          sprite = sprites.emptyTarget.get(targetId);
        }
        if (sprite) {
          if (scaleFactor !== 1) {
            const ds = cellSizePx * scaleFactor;
            const dxC = dx + (cellSizePx - ds) / 2;
            const dyC = dy + (cellSizePx - ds) / 2;
            ctx.drawImage(sprite, dxC, dyC, ds, ds);
          } else {
            ctx.drawImage(sprite, dx, dy, cellSizePx, cellSizePx);
          }
        }

        // Highlight glow on empty cells whose target matches the selected color
        if (!filled && mode === 'guided' && targetId > 0 && targetId === selectedColor) {
          ctx.save();
          ctx.lineWidth = Math.max(1.2, cellSizePx * 0.14);
          ctx.strokeStyle = 'rgba(255, 240, 180, 0.95)';
          ctx.shadowColor = 'rgba(255, 220, 120, 0.9)';
          ctx.shadowBlur = Math.max(2, cellSizePx * 0.7);
          const pad = cellSizePx * 0.08;
          ctx.strokeRect(dx + pad, dy + pad, cellSizePx - pad * 2, cellSizePx - pad * 2);
          ctx.restore();
        }

        // Draw target number on empty cells (guided mode)
        if (showNumbers && !filled && mode === 'guided' && targetId > 0) {
          const p = paletteMap.get(targetId);
          if (p) {
            // Use the target color but force readable contrast
            const luma = lumaOf(p.hex);
            ctx.fillStyle = luma > 140
              ? 'rgba(40,30,20,0.85)'
              : 'rgba(245,235,210,0.92)';
            const text = String(targetId);
            ctx.fillText(text, dx + cellSizePx / 2, dy + cellSizePx / 2 + fontSize * 0.05);
          }
        }
      }
    }


    // If flash is animating, queue another frame
    if (flashIdx >= 0) {
      flashRef.current.t = Math.min(1, flashT + 0.12);
      if (flashRef.current.t >= 1) {
        flashRef.current.idx = -1;
      } else {
        requestDraw();
      }
    }
    lastDrawRef.current = performance.now();
  }, [cellArr, templateCells, cols, rows, paletteMap, mode, selectedColor, requestDraw]);

  // Sync the drawFnRef to the latest draw closure so requestDraw always uses fresh state
  useEffect(() => {
    drawFnRef.current = draw;
  }, [draw]);

  // ── Compute base cell size in CSS px (at scale=1) so the board fits its container ──
  const cellPixelSize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return 1;
    return canvas.width / cols;
  }, [cols]);

  // ── Resize observer to fit container ──
  useEffect(() => {
    const wrap = wrapperRef.current;
    if (!wrap) return;
    const ro = new ResizeObserver(() => {
      sizeCanvas();
      buildSpritesForCurrentSize();
      // Re-center after resize
      autoFit();
      requestDraw();
    });
    ro.observe(wrap);
    sizeCanvas();
    buildSpritesForCurrentSize();
    autoFit();
    requestDraw();
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cols, rows]);

  // Re-build sprites whenever palette changes
  useEffect(() => {
    buildSpritesForCurrentSize();
    requestDraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [palette]);

  // Re-draw whenever cells/template change
  useEffect(() => {
    requestDraw();
  }, [cellArr, templateCells, selectedColor, requestDraw]);

  function sizeCanvas() {
    const wrap = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const rect = wrap.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
  }

  function buildSpritesForCurrentSize() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Sprite resolution: at least 18px, capped at 36
    const baseSize = canvas.width / cols;
    const spritePx = Math.max(18, Math.min(36, Math.ceil(baseSize * 2)));
    buildSprites(spritePx);
  }

  function autoFit() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const baseSize = canvas.width / cols;
    const gridHeightPx = baseSize * rows;
    const gridWidthPx = baseSize * cols;
    viewRef.current = {
      scale: 1,
      panX: (canvas.width - gridWidthPx) / 2,
      panY: Math.max(0, (canvas.height - gridHeightPx) / 2),
    };
  }

  // ── Pointer gestures ──
  const dragRef = useRef(null);
  const pinchRef = useRef(null);
  const tappedRef = useRef({ x: 0, y: 0, t: 0, moved: false });

  function pointerToGrid(clientX, clientY) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const dpr = canvas.width / rect.width;
    const x = (clientX - rect.left) * dpr;
    const y = (clientY - rect.top) * dpr;
    const cellSizePx = cellPixelSize() * viewRef.current.scale;
    const c = Math.floor((x - viewRef.current.panX) / cellSizePx);
    const r = Math.floor((y - viewRef.current.panY) / cellSizePx);
    return { c, r };
  }

  function clampPan() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cellSizePx = cellPixelSize() * viewRef.current.scale;
    const gridW = cellSizePx * cols;
    const gridH = cellSizePx * rows;
    const margin = 80;
    viewRef.current.panX = Math.min(canvas.width - margin, Math.max(-(gridW - margin), viewRef.current.panX));
    viewRef.current.panY = Math.min(canvas.height - margin, Math.max(-(gridH - margin), viewRef.current.panY));
  }

  const activePointers = useRef(new Map());

  function onPointerDown(e) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture?.(e.pointerId);
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointers.current.size === 1) {
      dragRef.current = {
        startX: e.clientX, startY: e.clientY,
        origPanX: viewRef.current.panX, origPanY: viewRef.current.panY,
        moved: false,
      };
      tappedRef.current = { x: e.clientX, y: e.clientY, t: Date.now(), moved: false };
    } else if (activePointers.current.size === 2) {
      const pts = [...activePointers.current.values()];
      const dx = pts[0].x - pts[1].x;
      const dy = pts[0].y - pts[1].y;
      pinchRef.current = {
        startDist: Math.sqrt(dx * dx + dy * dy),
        startScale: viewRef.current.scale,
        centerX: (pts[0].x + pts[1].x) / 2,
        centerY: (pts[0].y + pts[1].y) / 2,
      };
      dragRef.current = null;
    }
  }

  function onPointerMove(e) {
    if (!activePointers.current.has(e.pointerId)) return;
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointers.current.size === 2 && pinchRef.current) {
      const pts = [...activePointers.current.values()];
      const dx = pts[0].x - pts[1].x;
      const dy = pts[0].y - pts[1].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const ratio = dist / pinchRef.current.startDist;
      const newScale = Math.max(0.5, Math.min(8, pinchRef.current.startScale * ratio));
      applyZoom(newScale, pinchRef.current.centerX, pinchRef.current.centerY);
    } else if (dragRef.current) {
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      const canvas = canvasRef.current;
      const dpr = canvas.width / canvas.getBoundingClientRect().width;
      viewRef.current.panX = dragRef.current.origPanX + dx * dpr;
      viewRef.current.panY = dragRef.current.origPanY + dy * dpr;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        dragRef.current.moved = true;
        tappedRef.current.moved = true;
      }
      clampPan();
      requestDraw();
    }
  }

  function onPointerUp(e) {
    activePointers.current.delete(e.pointerId);
    canvasRef.current?.releasePointerCapture?.(e.pointerId);

    if (activePointers.current.size === 0) {
      // Maybe register a tap
      const t = tappedRef.current;
      const duration = Date.now() - t.t;
      if (!t.moved && duration < 350) {
        const { c, r } = pointerToGrid(t.x, t.y);
        if (c >= 0 && c < cols && r >= 0 && r < rows) {
          const idx = r * cols + c;
          // Trigger flash
          flashRef.current = { idx, t: 0 };
          onCellTap?.(idx);
          requestDraw();
        }
      }
      dragRef.current = null;
      pinchRef.current = null;
    } else if (activePointers.current.size === 1) {
      // Resume single-finger drag
      const remaining = [...activePointers.current.values()][0];
      dragRef.current = {
        startX: remaining.x, startY: remaining.y,
        origPanX: viewRef.current.panX, origPanY: viewRef.current.panY,
        moved: true,
      };
      pinchRef.current = null;
    }
  }

  function applyZoom(newScale, anchorClientX, anchorClientY) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = canvas.width / rect.width;
    const ax = (anchorClientX - rect.left) * dpr;
    const ay = (anchorClientY - rect.top) * dpr;
    const oldScale = viewRef.current.scale;
    const cellSizePx = cellPixelSize();
    const oldX = (ax - viewRef.current.panX) / (cellSizePx * oldScale);
    const oldY = (ay - viewRef.current.panY) / (cellSizePx * oldScale);
    viewRef.current.scale = newScale;
    viewRef.current.panX = ax - oldX * cellSizePx * newScale;
    viewRef.current.panY = ay - oldY * cellSizePx * newScale;
    clampPan();
    requestDraw();
  }

  function onWheel(e) {
    e.preventDefault();
    const delta = -e.deltaY * 0.0018;
    const newScale = Math.max(0.5, Math.min(8, viewRef.current.scale * Math.exp(delta)));
    applyZoom(newScale, e.clientX, e.clientY);
  }

  return (
    <div
      ref={wrapperRef}
      style={{
        width: '100%',
        maxWidth: 720,
        margin: '0 auto',
        height: `${maxHeightVh}vh`,
        background: 'rgba(10,8,6,0.7)',
        borderRadius: 14,
        overflow: 'hidden',
        boxShadow: 'inset 0 0 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(201,169,110,0.15)',
        touchAction: 'none',
        position: 'relative',
      }}
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <canvas ref={canvasRef} style={{ display: 'block' }} />
      {/* Zoom controls */}
      <div style={{
        position: 'absolute', right: 10, bottom: 10,
        display: 'flex', gap: 6, fontFamily: 'Inter, sans-serif',
      }}>
        <ZoomBtn label="−" onClick={() => {
          const c = canvasRef.current;
          const cx = c.width / 2, cy = c.height / 2;
          const rect = c.getBoundingClientRect();
          const dpr = c.width / rect.width;
          applyZoom(Math.max(0.5, viewRef.current.scale * 0.8), rect.left + cx / dpr, rect.top + cy / dpr);
        }} />
        <ZoomBtn label="⌂" onClick={() => { autoFit(); requestDraw(); }} />
        <ZoomBtn label="+" onClick={() => {
          const c = canvasRef.current;
          const cx = c.width / 2, cy = c.height / 2;
          const rect = c.getBoundingClientRect();
          const dpr = c.width / rect.width;
          applyZoom(Math.min(8, viewRef.current.scale * 1.25), rect.left + cx / dpr, rect.top + cy / dpr);
        }} />
      </div>
    </div>
  );
}

function ZoomBtn({ label, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: 32, height: 32,
      background: 'rgba(20,16,12,0.85)',
      border: '1px solid rgba(201,169,110,0.3)',
      color: 'rgba(232,212,160,0.9)',
      borderRadius: 6, cursor: 'pointer',
      fontSize: '1rem', lineHeight: 1, padding: 0,
      backdropFilter: 'blur(4px)',
    }}>{label}</button>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Sprite builders — pre-render diamond gems to small offscreen canvases.
// ────────────────────────────────────────────────────────────────────────────
function buildGem(size, hex, kind) {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  const cx = size / 2, cy = size / 2;
  const half = size * 0.42; // diamond half-diagonal

  // Rotate so it's diamond-shaped (45deg)
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(Math.PI / 4);

  // Outer gem body — radial gradient
  const grad = ctx.createRadialGradient(-half * 0.3, -half * 0.4, 0, 0, 0, half * 1.2);
  if (kind === 'pearl') {
    grad.addColorStop(0, '#FFFFFF');
    grad.addColorStop(0.20, lighten(hex, 0.25));
    grad.addColorStop(0.55, hex);
    grad.addColorStop(0.80, pearlShift(hex));
    grad.addColorStop(1, darken(hex, 0.18));
  } else if (kind === 'sparkle') {
    grad.addColorStop(0, '#FFFFFF');
    grad.addColorStop(0.18, '#FFFFFF');
    grad.addColorStop(0.45, hex);
    grad.addColorStop(1, darken(hex, 0.3));
  } else {
    grad.addColorStop(0, 'rgba(255,255,255,0.85)');
    grad.addColorStop(0.35, hex);
    grad.addColorStop(1, darken(hex, 0.4));
  }
  ctx.fillStyle = grad;
  ctx.strokeStyle = darken(hex, 0.35);
  ctx.lineWidth = Math.max(0.4, size * 0.025);
  roundedRect(ctx, -half * 0.9, -half * 0.9, half * 1.8, half * 1.8, size * 0.08);
  ctx.fill();
  ctx.stroke();

  // Highlights
  if (kind === 'pearl') {
    ctx.beginPath();
    ctx.ellipse(-half * 0.28, -half * 0.38, half * 0.42, half * 0.28, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.rect(-half * 0.55, -half * 0.7, half * 0.5, half * 0.22);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fill();
  }

  // Sparkle star
  if (kind === 'sparkle') {
    ctx.save();
    ctx.rotate(-Math.PI / 4);
    ctx.beginPath();
    ctx.moveTo(0, -half * 0.6);
    ctx.lineTo(half * 0.13, 0);
    ctx.lineTo(0, half * 0.6);
    ctx.lineTo(-half * 0.13, 0);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-half * 0.6, 0);
    ctx.lineTo(0, half * 0.13);
    ctx.lineTo(half * 0.6, 0);
    ctx.lineTo(0, -half * 0.13);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
  return c;
}

function buildEmptyTarget(size, hex) {
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  const ctx = c.getContext('2d');
  // Soft tinted square showing the target color
  const inset = size * 0.12;
  ctx.fillStyle = hexWithAlpha(hex, 0.22);
  roundedRect(ctx, inset, inset, size - inset * 2, size - inset * 2, size * 0.10);
  ctx.fill();
  ctx.strokeStyle = hexWithAlpha(hex, 0.55);
  ctx.lineWidth = Math.max(0.4, size * 0.04);
  ctx.stroke();
  return c;
}

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ── color helpers ──
function darken(hex, amount) {
  const { r, g, b } = hexToRgb(hex);
  const f = 1 - amount;
  return rgbToHex(r * f, g * f, b * f);
}
function lighten(hex, amount) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount);
}
function pearlShift(hex) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(g * 0.4 + r * 0.6, b * 0.4 + g * 0.6, r * 0.3 + b * 0.7);
}
function hexWithAlpha(hex, a) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}
function hexToRgb(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const n = parseInt(h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function lumaOf(hex) {
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function rgbToHex(r, g, b) {
  const to = v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}
