import { TILE, T } from '../constants.js';

/**
 * Cabin Interior — Walkable cozy cabin room.
 *
 * Background: cabin-interior.webp (1024×1536 portrait)
 * All furniture is painted into the background image — NO object sprites needed.
 * The collision grid defines where the player can/can't walk.
 *
 * At mapScale=1.25: image fills 1280×1920 px. Grid is 20×15 = 1280×960.
 * The image's top 50% (ceiling + main room) maps to the grid.
 *
 * Image layout (approximate % from top):
 *   0-20%:   Ceiling / skylight / string lights (not walkable)
 *   20-35%:  Upper wall — fireplace, window, bookshelf, desk (not walkable)
 *   35-55%:  Floor — rug area between sofa and furniture (WALKABLE)
 *   55-70%:  Sofa + lower floor (partially walkable)
 *   70-85%:  Map table + ledge (collision)
 *   85-100%: Below grid — not visible
 *
 * Grid mapping (20 cols × 15 rows):
 *   Row 0-3:   Ceiling + upper walls (blocked)
 *   Row 4-5:   Fireplace/window/desk edge (blocked, furniture collision)
 *   Row 6-10:  Main floor — rug area (WALKABLE)
 *   Row 11:    Sofa bottom edge (blocked)
 *   Row 12:    Map table / ledge (blocked)
 *   Row 13:    South wall
 *   Row 14:    Door exit
 */

const COLS = 20;
const ROWS = 15;

const WALL = T.BUILDING;
const FLOOR = T.GRASS;
const FURNITURE = T.BUILDING;

function buildGrid() {
  const grid = new Uint8Array(COLS * ROWS);

  const set = (c, r, type) => {
    if (r >= 0 && r < ROWS && c >= 0 && c < COLS)
      grid[r * COLS + c] = type;
  };
  const rect = (c1, r1, c2, r2, type) => {
    for (let r = r1; r <= r2; r++)
      for (let c = c1; c <= c2; c++)
        set(c, r, type);
  };

  // Start with everything walkable
  grid.fill(FLOOR);

  // === WALLS (room border) ===
  rect(0, 0, COLS - 1, 0, WALL);      // north
  rect(0, ROWS - 1, COLS - 1, ROWS - 1, WALL); // south
  rect(0, 0, 0, ROWS - 1, WALL);      // west
  rect(COLS - 1, 0, COLS - 1, ROWS - 1, WALL); // east

  // === CEILING + UPPER WALLS (rows 1-4) — can't walk up here ===
  rect(1, 1, COLS - 2, 4, WALL);

  // === FURNITURE EDGES (row 5) — thin collision along furniture ===
  // Fireplace base
  rect(1, 5, 3, 5, FURNITURE);
  // Desk area (right side)
  rect(15, 5, 17, 5, FURNITURE);

  // === OPEN FLOOR (rows 6-10) — the rug area, fully walkable ===
  // (already FLOOR from the fill)

  // === SOFA (left side, rows 7-10) — player walks around ===
  rect(1, 7, 2, 10, FURNITURE);   // sofa back
  rect(3, 10, 6, 11, FURNITURE);  // sofa seat bottom

  // === MAP TABLE / LEDGE (row 12) ===
  rect(5, 12, 14, 12, FURNITURE);

  // === STAIRS — walkable entry at east wall (rows 6-7) ===
  // The stairs are visible on the right side of the background image
  set(COLS - 1, 6, T.DOOR);  // open east wall for stairs
  set(COLS - 1, 7, T.DOOR);

  // === FRONT DOOR (south wall, center) ===
  set(7, ROWS - 1, T.DOOR);
  set(8, ROWS - 1, T.DOOR);
  set(9, ROWS - 1, T.DOOR);
  set(10, ROWS - 1, T.DOOR);
  set(11, ROWS - 1, T.DOOR);
  set(12, ROWS - 1, T.DOOR);

  return grid;
}

export default {
  id: 'cabin-interior',
  cols: COLS,
  rows: ROWS,
  mapImages: ['/cabin-interior.webp'],
  mapScale: 1.25,    // 1024 * 1.25 = 1280 = 20 * 64 (matches grid width)
  camZoom: 0.75,     // wider view to see more of the room

  buildGrid,

  zones: [
    {
      id: 'desk',
      label: 'Write in Journal',
      description: 'Open your journal',
      screen: 'interact:journal',
      cx: 16 * TILE + TILE / 2,
      cy: 6 * TILE,
      radius: 96,
    },
    {
      id: 'bookshelf',
      label: 'Read',
      description: 'Browse the bookshelf',
      screen: 'interact:bookshelf',
      cx: 2 * TILE,
      cy: 6 * TILE,
      radius: 80,
    },
    {
      id: 'fireplace',
      label: 'Sit by the Fire',
      description: 'Rest and reflect',
      screen: 'interact:fireplace',
      cx: 2 * TILE + TILE / 2,
      cy: 6 * TILE,
      radius: 80,
    },
    {
      id: 'candle-table',
      label: 'Body and Mind Check-In',
      description: 'How are you feeling?',
      screen: 'check-in',
      cx: 10 * TILE,
      cy: 8 * TILE,
      radius: 80,
    },
  ],

  transitions: [
    {
      id: 'front-door',
      cx: 9.5 * TILE + TILE / 2,
      cy: (ROWS - 1) * TILE + TILE / 2,
      radius: 72,
      targetMap: 'cabin-exterior',
      spawnId: 'from-cabin',
    },
    {
      id: 'stairs-down',
      cx: (COLS - 1) * TILE + TILE / 2,
      cy: 6.5 * TILE + TILE / 2,
      radius: 56,
      targetMap: 'cabin-downstairs',
      spawnId: 'from-upstairs',
    },
  ],

  spawnPoints: {
    default: { x: 10 * TILE, y: 9 * TILE },
    'from-exterior': { x: 10 * TILE, y: 12 * TILE },
    'from-kitchen': { x: 17 * TILE, y: 7 * TILE },
  },

  // NO objects — the background image has all furniture painted in.
  // Collision grid handles gameplay; the art handles visuals.
  objects: [],
};
