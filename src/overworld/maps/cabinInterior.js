import { TILE, T } from '../constants.js';

/**
 * Cabin Interior — Walkable cozy cabin room.
 *
 * Layout (20 cols × 15 rows = 1280×960 px):
 *
 *   Row 0-1:   North wall (bookshelf, fireplace)
 *   Row 2:     Shelf/mantle level
 *   Row 3-4:   Window area + desk
 *   Row 5-10:  Open floor (rug, sofa, candle table)
 *   Row 11-12: Map table / lower area
 *   Row 13:    South wall
 *   Row 14:    Door area (exit)
 *
 *   Col 0-2:   West wall (fireplace)
 *   Col 3-5:   Bookshelf area
 *   Col 6-13:  Main open floor / window
 *   Col 14-17: Desk / stairs area
 *   Col 18-19: East wall
 */

const COLS = 20;
const ROWS = 15;

// Interior tile types (reuse existing + add specifics)
const WALL = T.BUILDING;
const FLOOR = T.GRASS;       // walkable floor
const FURNITURE = T.BUILDING; // solid furniture (can't walk through)

function buildGrid() {
  const grid = new Uint8Array(COLS * ROWS);

  // Helper to set tiles
  const set = (c, r, type) => {
    if (r >= 0 && r < ROWS && c >= 0 && c < COLS)
      grid[r * COLS + c] = type;
  };
  const rect = (c1, r1, c2, r2, type) => {
    for (let r = r1; r <= r2; r++)
      for (let c = c1; c <= c2; c++)
        set(c, r, type);
  };

  // 1. Fill entire room with walkable floor
  grid.fill(FLOOR);

  // 2. Walls (room border)
  rect(0, 0, COLS - 1, 0, WALL);      // north wall
  rect(0, ROWS - 1, COLS - 1, ROWS - 1, WALL); // south wall
  rect(0, 0, 0, ROWS - 1, WALL);      // west wall
  rect(COLS - 1, 0, COLS - 1, ROWS - 1, WALL); // east wall

  // 3. Fireplace (northwest corner)
  rect(1, 1, 3, 3, FURNITURE);  // stone fireplace

  // 4. Bookshelf (north wall, behind fireplace)
  rect(4, 1, 6, 1, FURNITURE);  // bookshelf along wall

  // 5. Window seat area (north center — can't walk on windowsill)
  rect(7, 1, 13, 1, FURNITURE); // window/bench area

  // 6. Desk + chair (northeast area)
  rect(15, 2, 17, 3, FURNITURE); // desk with journal
  // Chair is walkable (player sits by approaching)

  // 7. Stairs (east wall)
  rect(18, 4, 18, 8, FURNITURE); // stairs railing

  // 8. Sofa (center-left — large L-shaped)
  rect(2, 6, 3, 9, FURNITURE);   // sofa left arm
  rect(4, 9, 8, 10, FURNITURE);  // sofa bottom

  // 9. Map table (bottom center)
  rect(7, 11, 12, 12, FURNITURE); // map/crafting table

  // 10. Candle table (left side of room)
  rect(1, 5, 2, 5, FURNITURE);

  // 11. Door opening (south wall center)
  set(9, ROWS - 1, T.DOOR);
  set(10, ROWS - 1, T.DOOR);

  return grid;
}

export default {
  id: 'cabin-interior',
  cols: COLS,
  rows: ROWS,
  mapImages: ['/cabin-interior.webp'],
  mapScale: 1,      // interior image maps 1:1 to world pixels
  camZoom: 0.85,    // zoomed in closer for interior

  buildGrid,

  zones: [
    {
      id: 'desk',
      label: 'Journal',
      description: 'Write in your journal',
      screen: 'journal',
      cx: 16 * TILE + TILE / 2,
      cy: 3 * TILE + TILE / 2,
      radius: 80,
    },
    {
      id: 'bookshelf',
      label: 'Bookshelf',
      description: 'Read and reflect',
      screen: 'cabin-bookshelf',
      cx: 5 * TILE + TILE / 2,
      cy: 2 * TILE + TILE / 2,
      radius: 80,
    },
    {
      id: 'candle-table',
      label: 'Candle',
      description: 'Light a candle',
      screen: 'cabin-candle',
      cx: 1.5 * TILE + TILE / 2,
      cy: 5 * TILE + TILE / 2,
      radius: 72,
    },
    {
      id: 'fireplace',
      label: 'Fireplace',
      description: 'Warmth and rest',
      screen: 'cabin-fireplace',
      cx: 2 * TILE + TILE / 2,
      cy: 3 * TILE + TILE / 2,
      radius: 72,
    },
  ],

  transitions: [
    {
      id: 'front-door',
      cx: 9.5 * TILE + TILE / 2,
      cy: (ROWS - 1) * TILE + TILE / 2,
      radius: 56,
      targetMap: 'cabin-exterior',
      spawnId: 'from-cabin',
    },
  ],

  spawnPoints: {
    default: { x: 9.5 * TILE + TILE / 2, y: 12 * TILE + TILE / 2 },
    'from-exterior': { x: 9.5 * TILE + TILE / 2, y: 12 * TILE + TILE / 2 },
  },
};
