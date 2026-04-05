import { TILE, T } from '../constants.js';

/**
 * Market Interior — Walkable trading hall with stalls.
 *
 * Layout (22 cols × 14 rows = 1408×896 px):
 *
 *   Row 0:     North wall
 *   Row 1-3:   Harvest stall (left) + General store (right)
 *   Row 4-5:   Open aisle between stalls
 *   Row 6-8:   Storage crates + barter post (center)
 *   Row 9-10:  Open floor (browsing area)
 *   Row 11:    Display shelves (south wall decor)
 *   Row 12:    South wall
 *   Row 13:    Door / exit
 *
 *   Col 0:     West wall
 *   Col 1-7:   Harvest stall area
 *   Col 8-13:  Central aisle + barter
 *   Col 14-20: General store area
 *   Col 21:    East wall
 */

const COLS = 22;
const ROWS = 14;

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

  // 1. Walkable floor
  grid.fill(FLOOR);

  // 2. Walls
  rect(0, 0, COLS - 1, 0, WALL);
  rect(0, ROWS - 1, COLS - 1, ROWS - 1, WALL);
  rect(0, 0, 0, ROWS - 1, WALL);
  rect(COLS - 1, 0, COLS - 1, ROWS - 1, WALL);

  // 3. Harvest stall counter (left side)
  rect(1, 1, 6, 2, FURNITURE);  // long counter with produce

  // 4. General store counter (right side)
  rect(15, 1, 20, 2, FURNITURE); // long counter with goods

  // 5. Storage crates (center-left)
  rect(2, 7, 4, 8, FURNITURE);

  // 6. Barter post table (center)
  rect(9, 6, 12, 7, FURNITURE);

  // 7. Display shelf (right wall)
  rect(17, 7, 20, 8, FURNITURE);

  // 8. Display barrels (south area)
  rect(2, 11, 3, 11, FURNITURE);  // left barrels
  rect(18, 11, 19, 11, FURNITURE); // right barrels

  // 9. Door (wide exit)
  set(9, ROWS - 1, T.DOOR);
  set(10, ROWS - 1, T.DOOR);
  set(11, ROWS - 1, T.DOOR);
  set(12, ROWS - 1, T.DOOR);

  return grid;
}

export default {
  id: 'market-interior',
  cols: COLS,
  rows: ROWS,
  mapImages: ['/market.webp'],
  mapScale: 1,
  camZoom: 0.78,

  buildGrid,

  zones: [
    {
      id: 'harvest-stall',
      label: 'Sell Crops',
      description: 'Sell your harvest for coins',
      screen: 'interact:harvest',
      cx: 4 * TILE,
      cy: 3.5 * TILE,
      radius: 96,
    },
    {
      id: 'general-store',
      label: 'Buy Supplies',
      description: 'Seeds, ingredients, and goods',
      screen: 'interact:general',
      cx: 17.5 * TILE,
      cy: 3.5 * TILE,
      radius: 96,
    },
    {
      id: 'barter-post',
      label: 'Trade',
      description: 'Barter with other villagers',
      screen: 'interact:barter',
      cx: 10.5 * TILE,
      cy: 8.5 * TILE,
      radius: 96,
    },
    {
      id: 'display-shelf',
      label: 'Room Shop',
      description: 'Furniture and decor for your cabin',
      screen: 'shop',
      cx: 18.5 * TILE,
      cy: 9 * TILE,
      radius: 80,
    },
  ],

  transitions: [
    {
      id: 'exit-door',
      cx: 10.5 * TILE + TILE / 2,
      cy: (ROWS - 1) * TILE + TILE / 2,
      radius: 72,
      targetMap: 'cabin-exterior',
      spawnId: 'from-market',
    },
  ],

  spawnPoints: {
    default: { x: 10.5 * TILE + TILE / 2, y: 10 * TILE + TILE / 2 },
    'from-exterior': { x: 10.5 * TILE + TILE / 2, y: 10 * TILE + TILE / 2 },
  },

  objects: [
    // Harvest stall counter (left — long with produce)
    { src: '/assets/objects/harvest-counter.png', x: 1*TILE, y: 0.5*TILE, w: 6*TILE, h: 2.5*TILE, zBase: 3*TILE },
    // General store counter (right — long with goods)
    { src: '/assets/objects/general-counter.png', x: 15*TILE, y: 0.5*TILE, w: 6*TILE, h: 2.5*TILE, zBase: 3*TILE },
    // Storage crates (center-left)
    { src: '/assets/objects/storage-crates.png', x: 2*TILE, y: 6.5*TILE, w: 3*TILE, h: 2.5*TILE, zBase: 9*TILE },
    // Barter post table (center)
    { src: '/assets/objects/barter-table.png', x: 9*TILE, y: 5.5*TILE, w: 4*TILE, h: 2.5*TILE, zBase: 8*TILE },
    // Display shelf (right wall area)
    { src: '/assets/objects/display-shelf.png', x: 17*TILE, y: 6.5*TILE, w: 4*TILE, h: 2.5*TILE, zBase: 9*TILE },
    // Left barrels
    { src: '/assets/objects/barrels.png', x: 2*TILE, y: 10.5*TILE, w: 2*TILE, h: 1.5*TILE, zBase: 12*TILE },
    // Right barrels
    { src: '/assets/objects/barrels.png', x: 18*TILE, y: 10.5*TILE, w: 2*TILE, h: 1.5*TILE, zBase: 12*TILE },
  ],
};
