import { TILE, T } from '../constants.js';

/**
 * Cabin Kitchen — Downstairs cooking and pantry space.
 *
 * Layout (16 cols × 12 rows = 1024×768 px):
 *
 *   Row 0:     North wall
 *   Row 1-2:   Counter + stove (north wall)
 *   Row 3-4:   Open floor
 *   Row 5-7:   Dining table (center), pantry shelves (east)
 *   Row 8-9:   Open floor
 *   Row 10:    South wall
 *   Row 11:    Stairs back up (east side)
 *
 *   Col 0:     West wall
 *   Col 1-5:   Stove / counter area
 *   Col 6-10:  Open floor / dining
 *   Col 11-14: Pantry / shelves
 *   Col 15:    East wall
 */

const COLS = 16;
const ROWS = 12;

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

  grid.fill(FLOOR);

  // Walls
  rect(0, 0, COLS - 1, 0, WALL);
  rect(0, ROWS - 1, COLS - 1, ROWS - 1, WALL);
  rect(0, 0, 0, ROWS - 1, WALL);
  rect(COLS - 1, 0, COLS - 1, ROWS - 1, WALL);

  // Kitchen counter (north wall, left side)
  rect(1, 1, 4, 1, FURNITURE);

  // Stove (north wall, center-left)
  rect(5, 1, 7, 2, FURNITURE);

  // Sink area (north wall, right of stove)
  rect(9, 1, 10, 1, FURNITURE);

  // Dining table (center)
  rect(5, 5, 9, 7, FURNITURE);

  // Pantry shelves (east wall)
  rect(12, 2, 14, 4, FURNITURE);

  // Barrel / storage (southwest corner)
  rect(1, 8, 2, 9, FURNITURE);

  // Stairs back up (east side, bottom)
  set(14, ROWS - 1, T.DOOR);
  set(13, ROWS - 1, T.DOOR);

  return grid;
}

export default {
  id: 'cabin-kitchen',
  cols: COLS,
  rows: ROWS,
  mapImages: ['/kitchen.webp'],
  mapScale: 1,
  camZoom: 0.82,

  buildGrid,

  zones: [
    {
      id: 'stove',
      label: 'Cook',
      description: 'Prepare a meal',
      screen: 'stove',
      cx: 6 * TILE + TILE / 2,
      cy: 3 * TILE,
      radius: 96,
    },
    {
      id: 'pantry',
      label: 'Pantry',
      description: 'Check your supplies',
      screen: 'kitchen',
      cx: 13 * TILE + TILE / 2,
      cy: 4 * TILE + TILE / 2,
      radius: 80,
    },
    {
      id: 'counter',
      label: 'Kitchen Counter',
      description: 'Prep ingredients',
      screen: 'kitchen',
      cx: 3 * TILE,
      cy: 2.5 * TILE,
      radius: 80,
    },
  ],

  transitions: [
    {
      id: 'stairs-up',
      cx: 13.5 * TILE + TILE / 2,
      cy: (ROWS - 1) * TILE + TILE / 2,
      radius: 64,
      targetMap: 'cabin-interior',
      spawnId: 'from-kitchen',
    },
  ],

  spawnPoints: {
    default: { x: 8 * TILE, y: 8 * TILE + TILE / 2 },
    'from-upstairs': { x: 12 * TILE + TILE / 2, y: 9 * TILE + TILE / 2 },
  },

  objects: [
    // Kitchen counter (left)
    { src: '/assets/objects/kitchen-counter.png', x: 1*TILE, y: 0.5*TILE, w: 4*TILE, h: 1.5*TILE, zBase: 2*TILE },
    // Stove
    { src: '/assets/objects/stove-obj.png', x: 5*TILE, y: 0.5*TILE, w: 3*TILE, h: 2.5*TILE, zBase: 3*TILE },
    // Sink
    { src: '/assets/objects/sink.png', x: 9*TILE, y: 0.5*TILE, w: 2*TILE, h: 1.5*TILE, zBase: 2*TILE },
    // Dining table
    { src: '/assets/objects/dining-table.png', x: 5*TILE, y: 4.5*TILE, w: 5*TILE, h: 3.5*TILE, zBase: 8*TILE },
    // Pantry shelves
    { src: '/assets/objects/pantry.png', x: 12*TILE, y: 1.5*TILE, w: 3*TILE, h: 3.5*TILE, zBase: 5*TILE },
    // Storage barrel
    { src: '/assets/objects/barrels.png', x: 1*TILE, y: 7.5*TILE, w: 2*TILE, h: 2.5*TILE, zBase: 10*TILE },
  ],
};
