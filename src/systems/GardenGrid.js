/**
 * GardenGrid — core data model for the tile-based garden system.
 *
 * Grid is a flat array of cell objects, addressed by (row, col).
 * Each cell tracks what's in it: empty stone, placed soil, or a planted seed.
 *
 * This module is pure data — no React, no rendering.
 * Any screen that needs a grid imports these helpers.
 */

// ── Grid configuration ──────────────────────────────────────────
// These define the default rooftop garden grid.
// Other gardens can pass different configs later.
export const DEFAULT_GRID_CONFIG = {
  cols: 6,
  rows: 4,
  // Grid is positioned as a percentage box within the screen.
  // This keeps it centered on the stone floor area of the garden.
  offsetX: 14,   // % from left edge
  offsetY: 38,   // % from top edge
  gridW: 72,     // % width of screen
  gridH: 40,     // % height of screen
};

// ── Cell types ──────────────────────────────────────────────────
export const CELL_EMPTY   = 'empty';   // bare stone floor
export const CELL_SOIL    = 'soil';    // tilled soil placed
export const CELL_PLANTED = 'planted'; // seed in the soil

// ── Create a fresh empty grid ───────────────────────────────────
export function createEmptyGrid(config = DEFAULT_GRID_CONFIG) {
  const cells = [];
  for (let r = 0; r < config.rows; r++) {
    for (let c = 0; c < config.cols; c++) {
      cells.push({
        row: r,
        col: c,
        type: CELL_EMPTY,
        plantId: null,    // which plant seed was placed (e.g. 'timothy-hay')
        plantedAt: null,  // timestamp when seed was planted
        wateredAt: null,  // timestamp when last watered
      });
    }
  }
  return { config, cells };
}

// ── Cell access helpers ─────────────────────────────────────────
export function getCell(grid, row, col) {
  return grid.cells[row * grid.config.cols + col];
}

export function updateCell(grid, row, col, updates) {
  const idx = row * grid.config.cols + col;
  const newCells = [...grid.cells];
  newCells[idx] = { ...newCells[idx], ...updates };
  return { ...grid, cells: newCells };
}

// ── Actions ─────────────────────────────────────────────────────

/** Place soil on an empty cell. Returns new grid or null if invalid. */
export function placeSoil(grid, row, col) {
  const cell = getCell(grid, row, col);
  if (!cell || cell.type !== CELL_EMPTY) return null;
  return updateCell(grid, row, col, { type: CELL_SOIL });
}

/** Plant a seed on a soil cell. Returns new grid or null if invalid. */
export function plantSeed(grid, row, col, plantId) {
  const cell = getCell(grid, row, col);
  if (!cell || cell.type !== CELL_SOIL) return null;
  return updateCell(grid, row, col, {
    type: CELL_PLANTED,
    plantId,
    plantedAt: Date.now(),
    wateredAt: null,
  });
}

/** Water a planted cell. Returns new grid or null if invalid. */
export function waterCell(grid, row, col) {
  const cell = getCell(grid, row, col);
  if (!cell || cell.type !== CELL_PLANTED) return null;
  return updateCell(grid, row, col, { wateredAt: Date.now() });
}

/** Remove a plant (harvest or clear). Returns cell to soil. */
export function clearPlant(grid, row, col) {
  const cell = getCell(grid, row, col);
  if (!cell || cell.type !== CELL_PLANTED) return null;
  return updateCell(grid, row, col, {
    type: CELL_SOIL,
    plantId: null,
    plantedAt: null,
    wateredAt: null,
  });
}

// ── Serialization ───────────────────────────────────────────────
// Grid saves as a compact JSON-safe object.
// On load, we reconstruct the full grid from saved cells.

export function serializeGrid(grid) {
  // Only save cells that aren't empty (saves space)
  const saved = grid.cells
    .filter(c => c.type !== CELL_EMPTY)
    .map(c => ({
      r: c.row, c: c.col, t: c.type,
      ...(c.plantId ? { p: c.plantId } : {}),
      ...(c.plantedAt ? { pa: c.plantedAt } : {}),
      ...(c.wateredAt ? { wa: c.wateredAt } : {}),
    }));
  return { v: 1, rows: grid.config.rows, cols: grid.config.cols, cells: saved };
}

export function deserializeGrid(data, config = DEFAULT_GRID_CONFIG) {
  if (!data || data.v !== 1) return createEmptyGrid(config);
  const grid = createEmptyGrid(config);
  data.cells.forEach(s => {
    const idx = s.r * config.cols + s.c;
    if (idx >= 0 && idx < grid.cells.length) {
      grid.cells[idx] = {
        ...grid.cells[idx],
        type: s.t,
        plantId: s.p || null,
        plantedAt: s.pa || null,
        wateredAt: s.wa || null,
      };
    }
  });
  return grid;
}
