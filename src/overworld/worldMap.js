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
  // 1. CLEARINGS — Open walkable areas around each building
  // ══════════════════════════════════════════════════════════════════

  // Cabin clearing (large area around the cabin)
  rect(grid, 8, 46, 22, 60, T.GRASS);

  // Prayer Garden clearing
  rect(grid, 3, 18, 14, 30, T.GRASS);

  // Market clearing (wide area for the market village)
  rect(grid, 18, 26, 35, 38, T.GRASS);

  // Upper Room clearing
  rect(grid, 26, 3, 38, 16, T.GRASS);

  // Southern clearing (beyond the river, for the bridge exit)
  rect(grid, 10, 64, 20, 69, T.GRASS);

  // ══════════════════════════════════════════════════════════════════
  // 2. PATH CORRIDORS — Connect clearings with walkable paths
  //    (3-4 tiles wide for comfortable movement)
  // ══════════════════════════════════════════════════════════════════

  // Cabin north to junction area (vertical corridor)
  rect(grid, 12, 36, 17, 46, T.GRASS);

  // Junction east to market clearing (horizontal connector)
  rect(grid, 17, 33, 20, 37, T.GRASS);

  // Prayer Garden east to junction corridor
  rect(grid, 13, 25, 17, 30, T.GRASS);
  // Extend slightly to ensure connection
  rect(grid, 14, 30, 16, 36, T.GRASS);

  // Market north to Upper Room (vertical corridor)
  rect(grid, 29, 16, 33, 26, T.GRASS);

  // Cabin south to river bridge (vertical corridor)
  rect(grid, 13, 58, 17, 64, T.GRASS);

  // ══════════════════════════════════════════════════════════════════
  // 3. MARK PATH TILES — Distinguish paths from open grass
  //    (Both are walkable; paths just mark the intended route)
  // ══════════════════════════════════════════════════════════════════

  // Main north-south spine from cabin
  for (let r = 37; r <= 58; r++) {
    set(grid, 14, r, T.PATH);
    set(grid, 15, r, T.PATH);
  }

  // East-west path from spine to market
  for (let c = 15; c <= 24; c++) {
    set(grid, c, 35, T.PATH);
    set(grid, c, 36, T.PATH);
  }

  // Path from spine to prayer garden
  for (let c = 8; c <= 15; c++) {
    set(grid, c, 27, T.PATH);
    set(grid, c, 28, T.PATH);
  }

  // Path from market area north to upper room
  for (let r = 12; r <= 27; r++) {
    set(grid, 31, r, T.PATH);
    set(grid, 32, r, T.PATH);
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
  // Porch area (dirt in front of cabin door)
  rect(grid, 12, 56, 16, 57, T.DIRT);

  // Prayer Garden (4x4 building, center ~8,24, door on south face)
  building(grid, 6, 22, 4, 4, T.GARDEN_INT, 0);
  // Flower borders around prayer garden
  rect(grid, 4, 22, 5, 25, T.FLOWER);
  rect(grid, 10, 22, 11, 25, T.FLOWER);

  // Market (main stall 5x4 + secondary stall, door on west face)
  building(grid, 23, 30, 5, 4, T.MARKET_INT, 2);
  building(grid, 28, 30, 4, 3, T.MARKET_INT, 2);
  // Market square (dirt plaza)
  rect(grid, 20, 30, 22, 35, T.DIRT);

  // Upper Room (5x5 building, center ~32,9, door on south face)
  building(grid, 30, 7, 5, 5, T.UPPER_INT, 0);
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

  const extraTrees = [
    // Near cabin clearing edges
    [9, 47], [10, 48], [21, 47], [20, 48],
    // Near prayer garden
    [4, 19], [5, 20], [13, 19], [12, 20],
    // Near market
    [19, 27], [34, 27], [34, 37],
    // Near upper room
    [27, 4], [37, 4], [37, 15],
    // Along path corridors (sparse)
    [12, 40], [17, 42],
  ];
  for (const [c, r] of extraTrees) {
    set(grid, c, r, T.TREE);
  }

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
  // Walkable corridor from the bridge exit into the farm
  rect(grid, 10, 68, 20, 78, T.GRASS);
  for (let r = 68; r <= 77; r++) {
    set(grid, 14, r, T.PATH);
    set(grid, 15, r, T.PATH);
  }

  // ── 2. FARM CLEARINGS ──

  // Main farm valley (large open area where buildings and fields are)
  rect(grid, 5, 78, 40, 110, T.GRASS);

  // Orchard area (above the main buildings)
  rect(grid, 18, 80, 32, 88, T.GRASS);

  // Lower path corridor toward water wheel
  rect(grid, 12, 110, 25, 130, T.GRASS);

  // Water wheel clearing
  rect(grid, 14, 118, 24, 130, T.GRASS);

  // Bottom exit area (south of water wheel)
  rect(grid, 14, 130, 22, 138, T.GRASS);

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

  // ── 10. SCATTERED FARM TREES ──
  const farmTrees = [
    // Forest edges around farm clearing
    [5, 80], [6, 82], [5, 85], [6, 88],
    [40, 80], [39, 83], [40, 86], [39, 89],
    [40, 95], [39, 98], [40, 102],
    // Near lower path
    [12, 115], [25, 115], [13, 120], [24, 120],
    // Bottom forest
    [10, 132], [14, 135], [22, 132], [26, 135],
  ];
  for (const [c, r] of farmTrees) {
    set(grid, c, r, T.TREE);
  }
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
// On the path just south of the cabin
export const SPAWN_X = 14 * TILE + TILE / 2;   // col 14 center
export const SPAWN_Y = 57 * TILE + TILE / 2;   // row 57, south of cabin porch
