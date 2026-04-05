import { TILE, T } from '../constants.js';

/**
 * Aquarium Room — Attached conservatory with large fish tank.
 *
 * Layout (14 cols × 10 rows = 896×640 px):
 *
 *   Row 0:     North wall
 *   Row 1-3:   Aquarium tank (spans most of north wall)
 *   Row 4-5:   Open viewing area + plant shelves (west)
 *   Row 6-7:   Seating area (bench + cushions)
 *   Row 8:     South wall
 *   Row 9:     Passage back east → cabin main room
 *
 *   Col 0:     West wall
 *   Col 1-3:   Plant shelves / terrariums
 *   Col 4-10:  Open floor / tank viewing
 *   Col 11-12: Passage to cabin (east)
 *   Col 13:    East wall
 */

const COLS = 14;
const ROWS = 10;

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

  // Aquarium tank (north wall — wide glass tank)
  rect(2, 1, 11, 2, FURNITURE);

  // Plant shelf (west wall)
  rect(1, 4, 2, 5, FURNITURE);

  // Viewing bench (center south)
  rect(5, 7, 8, 7, FURNITURE);

  // Small side table (east area)
  rect(11, 5, 12, 5, FURNITURE);

  // East passage back to cabin
  set(COLS - 1, 4, T.DOOR);
  set(COLS - 1, 5, T.DOOR);

  return grid;
}

export default {
  id: 'aquarium-room',
  cols: COLS,
  rows: ROWS,
  mapImages: ['/cabin-interior.webp'], // reuse cabin bg as placeholder until aquarium art is ready
  mapScale: 1,
  camZoom: 0.88,

  buildGrid,

  zones: [
    {
      id: 'aquarium-tank',
      label: 'Watch the Fish',
      description: 'A peaceful view',
      screen: 'interact:aquarium',
      cx: 7 * TILE,
      cy: 3.5 * TILE,
      radius: 110,
    },
    {
      id: 'plant-shelf',
      label: 'Plants',
      description: 'Tend the terrariums',
      screen: 'garden',
      cx: 1.5 * TILE + TILE / 2,
      cy: 5.5 * TILE,
      radius: 80,
    },
  ],

  transitions: [
    {
      id: 'east-passage',
      cx: (COLS - 1) * TILE + TILE / 2,
      cy: 4.5 * TILE + TILE / 2,
      radius: 56,
      targetMap: 'cabin-interior',
      spawnId: 'from-aquarium',
    },
  ],

  spawnPoints: {
    default: { x: 7 * TILE, y: 6 * TILE + TILE / 2 },
    'from-cabin': { x: 11.5 * TILE + TILE / 2, y: 4.5 * TILE + TILE / 2 },
  },

  objects: [
    // Aquarium tank — large glass tank along north wall
    { src: '/assets/objects/aquarium-tank.png', x: 2*TILE, y: 0.3*TILE, w: 10*TILE, h: 2.8*TILE, zBase: 3*TILE },
    // Plant shelf (west)
    { src: '/assets/objects/plant-shelf.png', x: 1*TILE, y: 3.5*TILE, w: 2*TILE, h: 2.5*TILE, zBase: 6*TILE },
    // Viewing bench
    { src: '/assets/objects/bench.png', x: 5*TILE, y: 6.5*TILE, w: 4*TILE, h: 1.5*TILE, zBase: 8*TILE },
    // Side table
    { src: '/assets/objects/candle-table.png', x: 11*TILE, y: 4.5*TILE, w: 2*TILE, h: 1.5*TILE, zBase: 6*TILE },
  ],
};
