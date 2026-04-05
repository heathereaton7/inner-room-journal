import { TILE, T } from '../constants.js';

/**
 * Upper Room — Walkable worship / gathering hall.
 *
 * Layout (18 cols × 14 rows = 1152×896 px):
 *
 *   Row 0-1:   North wall (scripture stand, candle altar)
 *   Row 2-3:   Altar / worship area
 *   Row 4-5:   Open center (gathering space)
 *   Row 6-8:   Seating area (benches / cushions)
 *   Row 9-10:  Open floor
 *   Row 11:    Communion table / fellowship area
 *   Row 12:    South wall
 *   Row 13:    Door / exit
 *
 *   Col 0:     West wall
 *   Col 1-4:   Candle altar / prayer wall
 *   Col 5-12:  Main hall floor
 *   Col 13-16: Scripture stand / reading nook
 *   Col 17:    East wall
 */

const COLS = 18;
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

  // 3. Candle altar (northwest — prayer wall)
  rect(1, 1, 3, 2, FURNITURE);

  // 4. Scripture reading stand (northeast)
  rect(14, 1, 16, 2, FURNITURE);

  // 5. Wooden benches (center seating area)
  rect(4, 6, 6, 6, FURNITURE);   // left bench
  rect(11, 6, 13, 6, FURNITURE); // right bench
  rect(4, 8, 6, 8, FURNITURE);   // left bench row 2
  rect(11, 8, 13, 8, FURNITURE); // right bench row 2

  // 6. Communion table (bottom center)
  rect(7, 11, 10, 11, FURNITURE);

  // 7. Door (wide exit)
  set(7, ROWS - 1, T.DOOR);
  set(8, ROWS - 1, T.DOOR);
  set(9, ROWS - 1, T.DOOR);
  set(10, ROWS - 1, T.DOOR);

  return grid;
}

export default {
  id: 'upper-room',
  cols: COLS,
  rows: ROWS,
  mapImages: ['/upper-room-hall.webp'],
  mapScale: 1,
  camZoom: 0.82,

  buildGrid,

  zones: [
    {
      id: 'candle-altar',
      label: 'Prayer Wall',
      description: 'Light a candle and pray',
      screen: 'interact:prayer-wall',
      cx: 2 * TILE + TILE / 2,
      cy: 3 * TILE,
      radius: 96,
    },
    {
      id: 'scripture-stand',
      label: 'Read Scripture',
      description: 'Open the Word',
      screen: 'interact:bible',
      cx: 15 * TILE + TILE / 2,
      cy: 3 * TILE,
      radius: 96,
    },
    {
      id: 'communion-table',
      label: 'Gatherings',
      description: 'Join the community',
      screen: 'gatherings',
      cx: 8.5 * TILE + TILE / 2,
      cy: 10 * TILE + TILE / 2,
      radius: 96,
    },
    {
      id: 'center-altar',
      label: 'Feed',
      description: 'See what others are sharing',
      screen: 'interact:feed',
      cx: 8.5 * TILE + TILE / 2,
      cy: 4.5 * TILE + TILE / 2,
      radius: 80,
    },
  ],

  transitions: [
    {
      id: 'exit-door',
      cx: 8.5 * TILE + TILE / 2,
      cy: (ROWS - 1) * TILE + TILE / 2,
      radius: 72,
      targetMap: 'cabin-exterior',
      spawnId: 'from-upper-room',
    },
  ],

  spawnPoints: {
    default: { x: 8.5 * TILE + TILE / 2, y: 10 * TILE + TILE / 2 },
    'from-exterior': { x: 8.5 * TILE + TILE / 2, y: 10 * TILE + TILE / 2 },
  },

  objects: [
    // Candle altar — prayer wall with candles
    { src: '/assets/objects/candle-altar.png', x: 1*TILE, y: 0.5*TILE, w: 3*TILE, h: 2.5*TILE, zBase: 3*TILE },
    // Scripture reading stand
    { src: '/assets/objects/scripture-stand.png', x: 14*TILE, y: 0.5*TILE, w: 3*TILE, h: 2.5*TILE, zBase: 3*TILE },
    // Left bench row 1
    { src: '/assets/objects/bench.png', x: 4*TILE, y: 5.5*TILE, w: 3*TILE, h: 1.5*TILE, zBase: 7*TILE },
    // Right bench row 1
    { src: '/assets/objects/bench.png', x: 11*TILE, y: 5.5*TILE, w: 3*TILE, h: 1.5*TILE, zBase: 7*TILE },
    // Left bench row 2
    { src: '/assets/objects/bench.png', x: 4*TILE, y: 7.5*TILE, w: 3*TILE, h: 1.5*TILE, zBase: 9*TILE },
    // Right bench row 2
    { src: '/assets/objects/bench.png', x: 11*TILE, y: 7.5*TILE, w: 3*TILE, h: 1.5*TILE, zBase: 9*TILE },
    // Communion table
    { src: '/assets/objects/communion-table.png', x: 7*TILE, y: 10.5*TILE, w: 4*TILE, h: 1.5*TILE, zBase: 12*TILE },
  ],
};
