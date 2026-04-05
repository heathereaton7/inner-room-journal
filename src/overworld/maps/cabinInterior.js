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

  // 3. Fireplace (northwest corner — player can walk in front)
  rect(1, 1, 3, 2, FURNITURE);  // stone fireplace (shorter collision)

  // 4. Bookshelf (north wall, beside fireplace)
  rect(4, 1, 6, 1, FURNITURE);  // bookshelf (1 row deep, player walks in front)

  // 5. Window bench (north center — narrow collision)
  rect(7, 1, 13, 1, FURNITURE);

  // 6. Desk + open book (northeast area)
  rect(15, 2, 17, 3, FURNITURE);

  // 7. Stairs railing (east wall — rows 6-8 solid, rows 4-5 walkable for transition)
  rect(18, 6, 18, 8, FURNITURE);
  set(18, 4, T.DOOR);  // stairs entry → kitchen
  set(18, 5, T.DOOR);

  // 8. Sofa (L-shaped — left arm thinner for better flow)
  rect(2, 7, 3, 9, FURNITURE);   // sofa back (starts at row 7 not 6)
  rect(4, 9, 7, 10, FURNITURE);  // sofa seat (1 tile narrower)

  // 9. Map table (bottom center — slight gap from walls)
  rect(8, 11, 11, 12, FURNITURE);

  // 10. Candle table (west wall)
  rect(1, 5, 2, 5, FURNITURE);

  // 11. Front door opening (wider for easier exit)
  set(8, ROWS - 1, T.DOOR);
  set(9, ROWS - 1, T.DOOR);
  set(10, ROWS - 1, T.DOOR);
  set(11, ROWS - 1, T.DOOR);

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
      label: 'Write in Journal',
      description: 'Open your journal',
      screen: 'interact:journal',
      cx: 16 * TILE + TILE / 2,
      cy: 4 * TILE,
      radius: 96,
    },
    {
      id: 'bookshelf',
      label: 'Read',
      description: 'Browse the bookshelf',
      screen: 'interact:bookshelf',
      cx: 5 * TILE + TILE / 2,
      cy: 2 * TILE + TILE / 2,
      radius: 96,
    },
    {
      id: 'candle-table',
      label: 'Body and Mind Check-In',
      description: 'How are you feeling?',
      screen: 'check-in',
      cx: 1.5 * TILE + TILE / 2,
      cy: 6 * TILE,
      radius: 80,
    },
    {
      id: 'fireplace',
      label: 'Sit by the Fire',
      description: 'Rest and reflect',
      screen: 'interact:fireplace',
      cx: 2 * TILE + TILE / 2,
      cy: 4 * TILE,
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
      cx: 18 * TILE + TILE / 2,
      cy: 4.5 * TILE + TILE / 2,
      radius: 56,
      targetMap: 'cabin-downstairs',
      spawnId: 'from-upstairs',
    },
  ],

  spawnPoints: {
    default: { x: 9.5 * TILE + TILE / 2, y: 12 * TILE + TILE / 2 },
    'from-exterior': { x: 9.5 * TILE + TILE / 2, y: 12 * TILE + TILE / 2 },
    'from-kitchen': { x: 17 * TILE + TILE / 2, y: 6 * TILE + TILE / 2 },
  },

  /**
   * Objects — furniture sprites rendered with z-sorting.
   * zBase = bottom edge of the object (y + h). When player.y < zBase,
   * the object draws AFTER the player (player is behind it).
   *
   * Positions are in world pixels (col * TILE, row * TILE).
   */
  objects: [
    // Fireplace — tall, player walks in front of it
    { src: '/assets/objects/fireplace.png', x: 1*TILE, y: 0.5*TILE, w: 3*TILE, h: 3*TILE, zBase: 3.5*TILE },
    // Bookshelf — against north wall, player walks in front
    { src: '/assets/objects/bookshelf.png', x: 4*TILE, y: 0.5*TILE, w: 3*TILE, h: 2*TILE, zBase: 2.5*TILE },
    // Window — north wall center
    { src: '/assets/objects/window-bench.png', x: 7*TILE, y: 0.8*TILE, w: 7*TILE, h: 1*TILE, zBase: 1.8*TILE },
    // Desk — player can walk behind (zBase at desk bottom)
    { src: '/assets/objects/desk.png', x: 15*TILE, y: 1.5*TILE, w: 3*TILE, h: 2.5*TILE, zBase: 4*TILE },
    // Stairs railing — shortened (rows 6-8 only, rows 4-5 are walkable entry)
    { src: '/assets/objects/stairs.png', x: 18*TILE, y: 5.5*TILE, w: 1*TILE, h: 3.5*TILE, zBase: 9*TILE },
    // (Archway removed — aquarium accessed from downstairs hallway)
    // Sofa back arm — player walks behind
    { src: '/assets/objects/sofa-back.png', x: 2*TILE, y: 6.5*TILE, w: 2*TILE, h: 3.5*TILE, zBase: 10*TILE },
    // Sofa seat — bottom of L
    { src: '/assets/objects/sofa-bottom.png', x: 4*TILE, y: 8.5*TILE, w: 4*TILE, h: 2.5*TILE, zBase: 11*TILE },
    // Map table — player walks behind
    { src: '/assets/objects/map-table.png', x: 7.5*TILE, y: 10.5*TILE, w: 5*TILE, h: 2.5*TILE, zBase: 13*TILE },
    // Candle table — small, player walks behind
    { src: '/assets/objects/candle-table.png', x: 1*TILE, y: 4.5*TILE, w: 2*TILE, h: 1.5*TILE, zBase: 6*TILE },
  ],
};
