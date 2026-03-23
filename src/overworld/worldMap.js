import { WORLD_COLS, WORLD_ROWS, TILE, T } from './constants.js';

// ─── Helpers ───────────────────────────────────────────────────────

/** Set a rectangular region of tiles. */
function rect(grid, c1, r1, c2, r2, type) {
  for (let r = r1; r <= r2; r++)
    for (let c = c1; c <= c2; c++)
      if (r >= 0 && r < WORLD_ROWS && c >= 0 && c < WORLD_COLS)
        grid[r * WORLD_COLS + c] = type;
}

/** Set a single tile. */
function set(grid, c, r, type) {
  if (r >= 0 && r < WORLD_ROWS && c >= 0 && c < WORLD_COLS)
    grid[r * WORLD_COLS + c] = type;
}

/**
 * Place a building footprint: outer walls with interior + door(s).
 * @param {string} intType - interior tile type from T
 * @param {number} doorSide - 0=south, 1=north, 2=west, 3=east
 */
function building(grid, left, top, w, h, intType, doorSide = 0) {
  // Outer walls
  rect(grid, left, top, left + w - 1, top + h - 1, T.BUILDING);
  // Interior (inset by 1)
  if (w > 2 && h > 2) {
    rect(grid, left + 1, top + 1, left + w - 2, top + h - 2, intType);
  }
  // Door tile
  const midC = left + Math.floor(w / 2);
  const midR = top + Math.floor(h / 2);
  if (doorSide === 0) { // south
    set(grid, midC, top + h - 1, T.DOOR);
    if (w > 3) set(grid, midC - 1, top + h - 1, T.DOOR);
  } else if (doorSide === 1) { // north
    set(grid, midC, top, T.DOOR);
  } else if (doorSide === 2) { // west
    set(grid, left, midR, T.DOOR);
  } else { // east
    set(grid, left + w - 1, midR, T.DOOR);
  }
}

// ─── Build the World Grid ──────────────────────────────────────────

/**
 * Constructs the 48x144 invisible collision grid.
 * Two stacked map images: village (rows 0-71) + farm (rows 72-143).
 *
 * Village buildings (from newmap.png):
 *   Cabin         — center (14, 53)  ~30%, 74%
 *   Prayer Garden — center (8, 24)   ~17%, 33%
 *   Market        — center (25, 32)  ~52%, 44%
 *   Upper Room    — center (32, 9)   ~67%, 13%
 *
 * Farm buildings (from farmmap.png, offset +72 rows):
 *   Barn          — center (10, 89)  ~20%, 23%
 *   Farmhouse     — center (35, 89)  ~73%, 23%
 *   Crop Fields   — center (24, 97)  ~50%, 35%
 *   Windmill      — center (37, 81)  ~78%, 13%
 *   Water Wheel   — center (19, 124) ~39%, 72%
 */
export function buildWorldGrid() {
  const grid = new Uint8Array(WORLD_COLS * WORLD_ROWS);

  // ── Fill entire world with forest (solid) ──
  grid.fill(T.TREE);

  // ══════════════════════════════════════════════════════════════════
  // 1. BUILDING PLAZAS — Walkable areas around each building
  // ══════════════════════════════════════════════════════════════════

  // Cabin plaza (wraps building 12-16,51-55 + porch area)
  rect(grid, 11, 50, 17, 59, T.GRASS);

  // Prayer Garden plaza (wraps building 6-9,22-25 + flower edges)
  rect(grid, 4, 21, 11, 28, T.GRASS);

  // Market plaza (wraps both stalls 23-31,30-33 + dirt square)
  rect(grid, 19, 29, 33, 37, T.GRASS);

  // Upper Room plaza (wraps building 30-34,7-11 + courtyard)
  rect(grid, 28, 5, 36, 14, T.GRASS);

  // Bridge exit area (south of river)
  rect(grid, 12, 64, 18, 69, T.GRASS);

  // ══════════════════════════════════════════════════════════════════
  // 2. PATH CORRIDORS — Follow the painted paths on the map
  //    Upper Room sweeps diagonally down-left → Market → Junction
  //    Junction branches left to Garden and south to Cabin
  // ══════════════════════════════════════════════════════════════════

  // ── Upper Room diagonal path (sweeps down-left to Market area) ──
  rect(grid, 28, 14, 32, 18, T.GRASS);   // just below Upper Room plaza
  rect(grid, 25, 18, 29, 22, T.GRASS);   // diagonal segment 1
  rect(grid, 22, 22, 26, 26, T.GRASS);   // diagonal segment 2
  rect(grid, 19, 26, 23, 29, T.GRASS);   // connects into Market plaza top

  // ── Junction area (where Market, Garden, and Cabin paths meet) ──
  rect(grid, 14, 26, 19, 30, T.GRASS);   // junction hub left of market

  // ── Garden connector (junction west to garden plaza) ──
  rect(grid, 11, 24, 14, 28, T.GRASS);   // connects junction to garden

  // ── Cabin N-S corridor (junction south to cabin) ──
  // Wide enough (cols 11-17) so the character can walk AROUND the cabin
  // building (cols 12-16, rows 51-55) on the left or right side
  rect(grid, 11, 30, 17, 50, T.GRASS);   // wide vertical spine past cabin

  // ── Cabin south to river bridge ──
  rect(grid, 13, 59, 17, 64, T.GRASS);

  // ══════════════════════════════════════════════════════════════════
  // 3. MARK PATH TILES — Painted path markers (cosmetic, all walkable)
  // ══════════════════════════════════════════════════════════════════

  // Diagonal from Upper Room down to Market area
  for (let i = 0; i <= 16; i++) {
    const c = 30 - i;   // cols 30 → 14
    const r = 14 + i;   // rows 14 → 30
    if (c >= 0 && r < WORLD_ROWS) {
      set(grid, c, r, T.PATH);
      set(grid, c + 1, r, T.PATH);
    }
  }

  // E-W path from junction to garden
  for (let c = 8; c <= 15; c++) {
    set(grid, c, 26, T.PATH);
    set(grid, c, 27, T.PATH);
  }

  // N-S spine from junction down to cabin
  for (let r = 30; r <= 58; r++) {
    set(grid, 14, r, T.PATH);
    set(grid, 15, r, T.PATH);
  }

  // Path south from cabin to river bridge
  for (let r = 56; r <= 63; r++) {
    set(grid, 14, r, T.PATH);
    set(grid, 15, r, T.PATH);
  }

  // ══════════════════════════════════════════════════════════════════
  // 4. BUILDINGS — Solid walls with walkable interiors and doors
  // ══════════════════════════════════════════════════════════════════

  // Cabin (5x5 building, center ~14,53, door on south face)
  building(grid, 12, 51, 5, 5, T.CABIN_INT, 0);
  // Seal cabin — make entire footprint solid so player walks AROUND it
  // (entry is via interaction zone prompt, not by walking through the door)
  rect(grid, 12, 51, 16, 55, T.BUILDING);
  // Porch area (dirt in front of cabin door)
  rect(grid, 12, 56, 16, 57, T.DIRT);

  // Prayer Garden (4x4 building, center ~8,24, door on south face)
  building(grid, 6, 22, 4, 4, T.GARDEN_INT, 0);
  rect(grid, 6, 22, 9, 25, T.BUILDING);  // seal garden building
  // Flower borders around prayer garden
  rect(grid, 4, 22, 5, 25, T.FLOWER);
  rect(grid, 10, 22, 11, 25, T.FLOWER);

  // Market (main stall 5x4 + secondary stall, door on west face)
  building(grid, 23, 30, 5, 4, T.MARKET_INT, 2);
  building(grid, 28, 30, 4, 3, T.MARKET_INT, 2);
  rect(grid, 23, 30, 27, 33, T.BUILDING);  // seal market stall 1
  rect(grid, 28, 30, 31, 32, T.BUILDING);  // seal market stall 2
  // Market square (dirt plaza)
  rect(grid, 20, 30, 22, 35, T.DIRT);

  // Upper Room (5x5 building, center ~32,9, door on south face)
  building(grid, 30, 7, 5, 5, T.UPPER_INT, 0);
  rect(grid, 30, 7, 34, 11, T.BUILDING);  // seal upper room
  // Decorative flowers beside upper room
  rect(grid, 29, 7, 29, 11, T.FLOWER);

  // ══════════════════════════════════════════════════════════════════
  // 5. RIVER / STREAM
  // ══════════════════════════════════════════════════════════════════

  // Meandering stream near bottom of map (rows 61-62)
  for (let c = 8; c < 38; c++) {
    const offset = Math.floor(Math.sin(c * 0.35) * 1);
    set(grid, c, 61 + offset, T.WATER);
    set(grid, c, 62 + offset, T.WATER);
  }

  // ══════════════════════════════════════════════════════════════════
  // 6. BRIDGE over the stream
  // ══════════════════════════════════════════════════════════════════

  for (let r = 60; r <= 63; r++) {
    set(grid, 14, r, T.BRIDGE);
    set(grid, 15, r, T.BRIDGE);
    set(grid, 16, r, T.BRIDGE);
  }

  // ══════════════════════════════════════════════════════════════════
  // 7. SCATTERED DECORATIVE TREES within clearings
  //    (adds visual variety to the collision grid)
  // ══════════════════════════════════════════════════════════════════

  // (Decorative trees removed — with tighter clearings, the forest
  //  already provides natural borders along the paths.)

  // ══════════════════════════════════════════════════════════════════
  // FARM AREA (rows 72-143) — continues below the bridge
  // Mapped from farmmap.png (1024x1536), offset +72 rows
  // ══════════════════════════════════════════════════════════════════
  buildFarmArea(grid);

  return grid;
}

// ─── Farm Area Grid Builder ────────────────────────────────────────

/**
 * Builds the farm section of the collision grid (rows 72-143).
 * Called by buildWorldGrid after the village section is complete.
 *
 * Farm image positions (as % of farmmap.png → tile coordinates):
 *   Bridge entrance    ~30%, 3%   → (14, 74)
 *   Barn               ~20%, 23%  → (10, 89)
 *   Farmhouse          ~73%, 23%  → (35, 89)
 *   Crop Fields        ~50%, 35%  → (24, 97)
 *   Orchard            ~54%, 16%  → (26, 84)
 *   Windmill           ~78%, 13%  → (37, 81)
 *   Water Wheel        ~39%, 72%  → (19, 124)
 */
function buildFarmArea(grid) {
  // Rows 72-143 are already T.TREE from the fill above.

  // ── 1. BRIDGE CONNECTION (transition from village) ──
  // Narrow corridor from bridge exit into the farm
  rect(grid, 13, 68, 17, 78, T.GRASS);
  for (let r = 68; r <= 77; r++) {
    set(grid, 14, r, T.PATH);
    set(grid, 15, r, T.PATH);
  }

  // ── 2. FARM PLAZAS & CORRIDORS ──
  // (tight paths instead of one giant clearing)

  // Bridge transition into farm center (widens slightly toward N-S spine)
  rect(grid, 14, 77, 20, 84, T.GRASS);

  // Main N-S farm spine (4 tiles wide, center of farm)
  rect(grid, 17, 78, 20, 110, T.GRASS);

  // Barn plaza (around barn building 8-12, 87-90)
  rect(grid, 6, 85, 15, 93, T.GRASS);

  // E-W crossroad from barn to farmhouse (connects through spine)
  rect(grid, 15, 89, 34, 93, T.GRASS);

  // Farmhouse plaza (around farmhouse 33-37, 87-90)
  rect(grid, 31, 85, 38, 93, T.GRASS);

  // Windmill approach (from farmhouse area)
  rect(grid, 34, 80, 38, 85, T.GRASS);

  // Orchard path (narrower area between spine and buildings)
  rect(grid, 20, 82, 30, 88, T.GRASS);

  // Crop field area (includes fields + approach paths)
  rect(grid, 14, 93, 34, 103, T.GRASS);

  // South from spine toward water wheel (wider corridor)
  rect(grid, 14, 110, 22, 120, T.GRASS);

  // Water wheel plaza (wide area around waterfall + wheel)
  rect(grid, 10, 118, 26, 132, T.GRASS);

  // Bottom exit area
  rect(grid, 14, 132, 22, 138, T.GRASS);

  // ── 3. FARM PATHS ──

  // Main stone path from bridge south through farm center
  for (let r = 77; r <= 130; r++) {
    set(grid, 18, r, T.PATH);
    set(grid, 19, r, T.PATH);
  }

  // East-west path to barn (left)
  for (let c = 8; c <= 18; c++) {
    set(grid, c, 91, T.PATH);
    set(grid, c, 92, T.PATH);
  }

  // East-west path to farmhouse (right)
  for (let c = 19; c <= 37; c++) {
    set(grid, c, 91, T.PATH);
    set(grid, c, 92, T.PATH);
  }

  // Path through crop fields
  for (let r = 93; r <= 103; r++) {
    set(grid, 24, r, T.PATH);
    set(grid, 25, r, T.PATH);
  }

  // ── 4. FARM STREAM ──
  // Stream flows from the bridge area down the left side
  for (let r = 74; r <= 130; r++) {
    const wobble = Math.floor(Math.sin(r * 0.25) * 1.5);
    const baseC = r < 90 ? 8 : (r < 110 ? 9 : 10);
    set(grid, baseC + wobble, r, T.WATER);
    set(grid, baseC + wobble + 1, r, T.WATER);
  }

  // ── 5. FARM BUILDINGS ──

  // Barn (left side, ~20% x, ~23% y → col 10, row 87)
  building(grid, 8, 87, 5, 4, T.BARN_INT, 3); // door on east
  // Barn yard (dirt area around barn)
  rect(grid, 6, 86, 7, 91, T.DIRT);
  rect(grid, 13, 87, 14, 90, T.DIRT);

  // Farmhouse (right side, ~73% x, ~23% y → col 35, row 87)
  building(grid, 33, 87, 5, 4, T.FARM_INT, 2); // door on west
  // Farmhouse porch
  rect(grid, 31, 88, 32, 90, T.DIRT);

  // Windmill (right side, ~78% x, ~13% y → col 37, row 80)
  building(grid, 36, 80, 3, 3, T.BUILDING, 0); // solid structure, no entry
  rect(grid, 35, 80, 35, 82, T.GRASS); // clearance around windmill

  // ── 6. CROP FIELDS ──
  // Rows of farmland tiles in the center
  rect(grid, 16, 94, 22, 100, T.FARMLAND);
  rect(grid, 26, 94, 32, 100, T.FARMLAND);
  // Small flower/herb beds beside crops
  rect(grid, 14, 94, 15, 97, T.FLOWER);
  rect(grid, 33, 94, 34, 97, T.FLOWER);

  // ── 7. ORCHARD ──
  // Fruit trees scattered in the orchard clearing
  // (These are walkable GRASS with some decorative tree obstacles)
  const orchardTrees = [
    [20, 82], [23, 83], [26, 82], [29, 83],
    [21, 85], [24, 86], [27, 85], [30, 86],
  ];
  for (const [c, r] of orchardTrees) {
    set(grid, c, r, T.TREE);
  }

  // ── 8. FENCES ──
  // Fence around crop fields (north and south edges)
  for (let c = 15; c <= 33; c++) {
    set(grid, c, 93, T.FENCE);
    set(grid, c, 101, T.FENCE);
  }
  // Gate openings in fence (walkable)
  set(grid, 24, 93, T.DOOR);
  set(grid, 25, 93, T.DOOR);
  set(grid, 24, 101, T.DOOR);
  set(grid, 25, 101, T.DOOR);

  // ── 9. WATER WHEEL AREA ──
  // Water wheel structure near stream (bottom area)
  rect(grid, 16, 122, 19, 125, T.BUILDING); // water wheel housing
  set(grid, 17, 125, T.DOOR); // south door
  set(grid, 18, 125, T.DOOR);
  rect(grid, 17, 123, 18, 124, T.FARM_INT); // interior

  // ── 10. SCATTERED FARM TREES (inside plazas for visual variety) ──
  set(grid, 6, 88, T.TREE);   // tree in barn yard
}

// ─── Interaction Zones ─────────────────────────────────────────────
// Positions matched to the illustrated map artwork.
// cx/cy are in world pixels (tile * TILE + offset).

export const INTERACTION_ZONES = [
  {
    id: 'cabin',
    label: 'Cabin',
    description: 'Your quiet place',
    screen: 'cabin',
    // Door at south face of cabin → row 55
    cx: 14 * TILE + TILE / 2,
    cy: 55 * TILE + TILE / 2,
    radius: 96,
  },
  {
    id: 'garden',
    label: 'Prayer Garden',
    description: 'Grow your prayers',
    screen: 'garden',
    // Door at south face → row 25
    cx: 8 * TILE + TILE / 2,
    cy: 25 * TILE + TILE / 2,
    radius: 96,
  },
  {
    id: 'market',
    label: 'Market',
    description: 'Trade & provision',
    screen: 'market',
    // Door on west face → col 23
    cx: 23 * TILE,
    cy: 32 * TILE + TILE / 2,
    radius: 96,
  },
  {
    id: 'upper-room',
    label: 'Upper Room',
    description: 'Worship & encounter',
    screen: 'upper-room',
    // Door at south face → row 11
    cx: 32 * TILE + TILE / 2,
    cy: 11 * TILE + TILE / 2,
    radius: 96,
  },

  // ── Farm area zones (rows 72+) ──
  {
    id: 'barn',
    label: 'Barn',
    description: 'Tools & animals',
    screen: 'farm',
    // Door on east face of barn → col 12, row 89
    cx: 13 * TILE,
    cy: 89 * TILE + TILE / 2,
    radius: 96,
  },
  {
    id: 'crops',
    label: 'Crop Fields',
    description: 'Plant & harvest',
    screen: 'farm',
    // Center of crop field area
    cx: 24 * TILE + TILE / 2,
    cy: 97 * TILE + TILE / 2,
    radius: 128,
  },
  {
    id: 'farmhouse',
    label: 'Farmhouse',
    description: 'Rest & provision',
    screen: 'farm',
    // Door on west face of farmhouse → col 33, row 89
    cx: 32 * TILE + TILE / 2,
    cy: 89 * TILE + TILE / 2,
    radius: 96,
  },
];

// ─── Player Spawn ──────────────────────────────────────────────────
// On the road to the left of the cabin (col 11, row 53)
export const SPAWN_X = 11 * TILE + TILE / 2;   // col 11, left side of road
export const SPAWN_Y = 53 * TILE + TILE / 2;   // row 53, beside cabin
