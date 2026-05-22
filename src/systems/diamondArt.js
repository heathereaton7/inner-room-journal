/**
 * Diamond Art — pure helpers for grid state, painting, completion, serialization.
 *
 * Progress shape (stored in `irj-diamond-art` keyed by templateId or "free_<ts>"):
 *   {
 *     mode: 'guided' | 'free',
 *     templateId: 'lilies' | null,
 *     cols, rows,
 *     palette: [...],
 *     cells: Int8Array-like [colorId|0, ...]  // length cols*rows
 *     startedAt, lastSavedAt
 *   }
 */

import { getTemplate, FREESTYLE_PALETTE, FREESTYLE_SIZE } from '../data/diamondArtTemplates.js';

// Registry of imported templates injected at runtime by DiamondArtScreen.
// Lets templateFor() resolve imported templates without circular imports.
let importedTemplateLookup = () => null;
export function setImportedTemplateLookup(fn) {
  importedTemplateLookup = typeof fn === 'function' ? fn : (() => null);
}

export function makeGuidedProgress(template) {
  const size = template.grid.cols * template.grid.rows;
  return {
    mode: 'guided',
    templateId: template.id,
    cols: template.grid.cols,
    rows: template.grid.rows,
    palette: template.palette,
    // Always use plain Array so JSON serialization round-trips correctly.
    // The Canvas renderer converts to Uint16Array internally for fast access.
    cells: new Array(size).fill(0),
    startedAt: Date.now(),
    lastSavedAt: Date.now(),
  };
}

/**
 * cellsToArray — convert any cell collection (Uint16Array, plain Array, or
 * JSON-deserialized object like {0: ..., 1: ...}) to a plain number[].
 */
export function cellsToArray(cells) {
  if (!cells) return [];
  if (Array.isArray(cells)) return cells;
  if (cells instanceof Uint16Array || cells instanceof Uint8Array || cells instanceof Int32Array) {
    return Array.from(cells);
  }
  // Object with numeric keys (post-JSON deserialization of typed array)
  if (typeof cells === 'object') {
    const keys = Object.keys(cells);
    if (keys.length === 0) return [];
    let max = 0;
    for (const k of keys) {
      const n = parseInt(k, 10);
      if (Number.isFinite(n) && n > max) max = n;
    }
    const out = new Array(max + 1).fill(0);
    for (const k of keys) {
      const n = parseInt(k, 10);
      if (Number.isFinite(n)) out[n] = cells[k] || 0;
    }
    return out;
  }
  return [];
}

/**
 * cellsFromArray — normalize loaded cells back to a plain number[] of the
 * expected size. Handles legacy object form ({0:..., 1:...}) too.
 */
export function cellsFromArray(cells, size) {
  if (!cells) return new Array(size).fill(0);
  const arr = cellsToArray(cells);
  if (arr.length === size) return arr;
  // Pad or truncate to expected size
  const out = new Array(size).fill(0);
  for (let i = 0; i < Math.min(arr.length, size); i++) out[i] = arr[i] || 0;
  return out;
}

export function makeFreeProgress() {
  return {
    mode: 'free',
    templateId: null,
    cols: FREESTYLE_SIZE.cols,
    rows: FREESTYLE_SIZE.rows,
    palette: FREESTYLE_PALETTE,
    cells: new Array(FREESTYLE_SIZE.cols * FREESTYLE_SIZE.rows).fill(0),
    startedAt: Date.now(),
    lastSavedAt: Date.now(),
  };
}

export function freeKey(progress) {
  return `free_${progress.startedAt}`;
}

/**
 * paintCell — pure function returning a new progress object.
 *
 * Guided mode: only fills if the selected colorId matches the template's
 *   target for that cell.
 * Free mode: paints the cell with colorId; tapping a cell that already
 *   holds the same colorId clears it (toggle erase).
 */
export function paintCell(progress, template, idx, colorId) {
  if (idx < 0 || idx >= progress.cells.length) return progress;
  const next = { ...progress, cells: progress.cells.slice(), lastSavedAt: Date.now() };

  if (progress.mode === 'guided') {
    if (!template) return progress;
    const target = template.cells[idx];
    // Cells that are background (0) in the template stay unfilled
    if (target === 0) return progress;
    // Wrong color selected: no fill
    if (target !== colorId) return progress;
    // Already filled correctly: no-op
    if (next.cells[idx] === colorId) return progress;
    next.cells[idx] = colorId;
  } else {
    // Free mode: toggle if same color, otherwise paint
    if (next.cells[idx] === colorId) next.cells[idx] = 0;
    else next.cells[idx] = colorId;
  }
  return next;
}

export function isComplete(progress, template) {
  if (!progress) return false;
  if (progress.mode === 'guided') {
    if (!template) return false;
    // Every non-zero cell in template must match in progress
    for (let i = 0; i < template.cells.length; i++) {
      const target = template.cells[i];
      if (target === 0) continue;
      if (progress.cells[i] !== target) return false;
    }
    return true;
  }
  // Freestyle: complete when at least 10% of cells are painted (player decides to "finish")
  return progressFilled(progress) >= 0.10;
}

export function progressFilled(progress) {
  if (!progress) return 0;
  let painted = 0;
  for (let i = 0; i < progress.cells.length; i++) {
    if (progress.cells[i] !== 0) painted++;
  }
  return painted / progress.cells.length;
}

/** progressPercent — for guided mode, % of template cells correctly filled. */
export function progressPercent(progress, template) {
  if (!progress) return 0;
  if (progress.mode === 'guided') {
    if (!template) return 0;
    let total = 0, done = 0;
    for (let i = 0; i < template.cells.length; i++) {
      if (template.cells[i] === 0) continue;
      total++;
      if (progress.cells[i] === template.cells[i]) done++;
    }
    return total === 0 ? 0 : done / total;
  }
  return progressFilled(progress);
}

/** Build a gallery entry from a finished progress object. */
export function serializeArtwork(progress, template) {
  const ts = Date.now();
  const baseId = progress.mode === 'guided' ? progress.templateId : 'free';
  return {
    id: `art_${baseId}_${ts}`,
    templateId: progress.templateId,
    title: template ? template.title : 'Freestyle Canvas',
    verse: template ? template.verse : '',
    reference: template ? template.reference : '',
    cols: progress.cols,
    rows: progress.rows,
    palette: progress.palette,
    cells: progress.cells.slice(),
    completedAt: ts,
    mode: progress.mode,
  };
}

/** Lookup palette hex by colorId. */
export function colorHex(palette, colorId) {
  if (colorId === 0) return null;
  const c = palette.find(p => p.id === colorId);
  return c ? c.hex : null;
}

/** Resolve template for a progress object (handles freestyle gracefully). */
export function templateFor(progress) {
  if (!progress) return null;
  if (progress.mode === 'guided') {
    const id = progress.templateId;
    if (!id) return null;
    const builtIn = getTemplate(id);
    if (builtIn) return builtIn;
    // Try imported templates
    return importedTemplateLookup(id);
  }
  return null;
}
