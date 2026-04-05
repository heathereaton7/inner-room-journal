import { TILE, T } from '../constants.js';

/**
 * Cabin Downstairs — Combined hallway + kitchen as one continuous space.
 *
 * Background: downstairs.webp (two reference images cropped and stacked)
 *   Top half = kitchen (fireplace, counters, island, waterfall view)
 *   Bottom half = hallway (front door, stairs archway, aquarium window)
 *
 * Layout (16 cols × 27 rows = 1024×1728 px):
 *
 *   KITCHEN ZONE (rows 0-13):
 *     Row 0-1:   North wall (window/balcony view)
 *     Row 2-3:   Counter/stove (left), shelves (right)
 *     Row 4-5:   Open kitchen floor
 *     Row 6-8:   Prep island (center), fireplace (left)
 *     Row 9-10:  Open kitchen floor
 *     Row 11:    Kitchen/hallway threshold
 *     Row 12-13: Doorframe area
 *
 *   HALLWAY ZONE (rows 14-26):
 *     Row 14-15: Entry from kitchen
 *     Row 16-17: Side tables flanking front door
 *     Row 18-19: Front door (center), stairs arch (left), aquarium arch (right)
 *     Row 20-21: Open hallway floor
 *     Row 22-23: Baskets (left), plant (right)
 *     Row 24-25: South wall
 *     Row 26:    (edge buffer)
 */

const COLS = 16;
const ROWS = 27;

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

  // ═══ WALLS ═══
  rect(0, 0, COLS - 1, 0, WALL);      // north
  rect(0, ROWS - 1, COLS - 1, ROWS - 1, WALL); // south
  rect(0, 0, 0, ROWS - 1, WALL);      // west
  rect(COLS - 1, 0, COLS - 1, ROWS - 1, WALL); // east

  // ═══ KITCHEN ZONE (rows 1-13) ═══

  // Balcony/window view (north wall)
  rect(4, 1, 11, 1, FURNITURE);

  // Kitchen counter + hanging pots (left side)
  rect(1, 2, 3, 4, FURNITURE);

  // Stove / range (center-left)
  rect(4, 2, 6, 3, FURNITURE);

  // Counter / sink (right side)
  rect(11, 2, 14, 3, FURNITURE);

  // Fireplace (far left)
  rect(1, 6, 2, 8, FURNITURE);

  // Prep island table (center)
  rect(5, 7, 9, 8, FURNITURE);

  // ═══ DOORFRAME / THRESHOLD (rows 12-13) ═══
  // Walls on sides with wide opening in center
  rect(0, 12, 3, 13, WALL);
  rect(12, 12, COLS - 1, 13, WALL);
  // Opening (cols 4-11) stays FLOOR — player walks through

  // ═══ HALLWAY ZONE (rows 14-25) ═══

  // Side table (left of front door)
  rect(4, 17, 5, 18, FURNITURE);

  // Side table (right of front door)
  rect(10, 17, 11, 18, FURNITURE);

  // Front door (center of south-ish wall — decorative, not an exit)
  rect(6, 19, 9, 19, FURNITURE);

  // Basket/bench (lower left)
  rect(1, 21, 2, 22, FURNITURE);

  // Plant pot (lower right)
  rect(13, 21, 14, 22, FURNITURE);

  // ═══ TRANSITION DOORS ═══

  // Stairs archway (west wall, hallway zone) → back up to cabin main
  set(0, 16, T.DOOR);
  set(0, 17, T.DOOR);

  // Aquarium archway (east wall, hallway zone)
  set(COLS - 1, 16, T.DOOR);
  set(COLS - 1, 17, T.DOOR);

  return grid;
}

export default {
  id: 'cabin-downstairs',
  cols: COLS,
  rows: ROWS,
  mapImages: ['/downstairs.webp'],
  mapScale: 1,
  camZoom: 0.75,

  buildGrid,

  zones: [
    {
      id: 'stove',
      label: 'Cook',
      description: 'Prepare a meal at the stove',
      screen: 'stove',
      cx: 5 * TILE + TILE / 2,
      cy: 4 * TILE,
      radius: 96,
    },
    {
      id: 'counter',
      label: 'Kitchen Counter',
      description: 'Prep ingredients',
      screen: 'kitchen',
      cx: 12.5 * TILE,
      cy: 4 * TILE,
      radius: 80,
    },
    {
      id: 'island',
      label: 'Prep Table',
      description: 'Check your supplies',
      screen: 'kitchen',
      cx: 7 * TILE + TILE / 2,
      cy: 9.5 * TILE,
      radius: 96,
    },
    {
      id: 'fireplace-kitchen',
      label: 'Sit by the Fire',
      description: 'Warm yourself',
      screen: 'interact:fireplace',
      cx: 1.5 * TILE + TILE / 2,
      cy: 9 * TILE,
      radius: 80,
    },
    {
      id: 'front-door',
      label: 'Front Door',
      description: 'Step outside',
      screen: 'interact:front-door-view',
      cx: 7.5 * TILE + TILE / 2,
      cy: 18 * TILE,
      radius: 72,
    },
  ],

  transitions: [
    {
      id: 'stairs-up',
      cx: 0.3 * TILE,
      cy: 16.5 * TILE + TILE / 2,
      radius: 56,
      targetMap: 'cabin-interior',
      spawnId: 'from-kitchen',
    },
    {
      id: 'aquarium-arch',
      cx: (COLS - 1) * TILE + TILE / 2,
      cy: 16.5 * TILE + TILE / 2,
      radius: 56,
      targetMap: 'aquarium-room',
      spawnId: 'from-cabin',
    },
  ],

  spawnPoints: {
    default: { x: 7.5 * TILE + TILE / 2, y: 15 * TILE + TILE / 2 },
    'from-upstairs': { x: 1.5 * TILE + TILE / 2, y: 16.5 * TILE + TILE / 2 },
    'from-aquarium': { x: 13.5 * TILE + TILE / 2, y: 16.5 * TILE + TILE / 2 },
  },

  objects: [
    // ═══ KITCHEN OBJECTS ═══
    // Balcony/window view (north wall)
    { src: '/assets/objects/window-bench.png', x: 4*TILE, y: 0.5*TILE, w: 8*TILE, h: 1.5*TILE, zBase: 2*TILE },
    // Counter + pots (left)
    { src: '/assets/objects/kitchen-counter.png', x: 1*TILE, y: 1.5*TILE, w: 3*TILE, h: 3.5*TILE, zBase: 5*TILE },
    // Stove (center-left)
    { src: '/assets/objects/stove-obj.png', x: 4*TILE, y: 1.5*TILE, w: 3*TILE, h: 2.5*TILE, zBase: 4*TILE },
    // Counter/sink (right)
    { src: '/assets/objects/general-counter.png', x: 11*TILE, y: 1.5*TILE, w: 4*TILE, h: 2.5*TILE, zBase: 4*TILE },
    // Kitchen fireplace (far left)
    { src: '/assets/objects/fireplace.png', x: 1*TILE, y: 5.5*TILE, w: 2*TILE, h: 3*TILE, zBase: 9*TILE },
    // Prep island (center table with food)
    { src: '/assets/objects/dining-table.png', x: 5*TILE, y: 6.5*TILE, w: 5*TILE, h: 2.5*TILE, zBase: 9*TILE },

    // ═══ HALLWAY OBJECTS ═══
    // Left side table (candles + flowers)
    { src: '/assets/objects/candle-table.png', x: 4*TILE, y: 16.5*TILE, w: 2*TILE, h: 2*TILE, zBase: 19*TILE },
    // Right side table (candles + bottles)
    { src: '/assets/objects/candle-table.png', x: 10*TILE, y: 16.5*TILE, w: 2*TILE, h: 2*TILE, zBase: 19*TILE },
    // Front door (decorative — large arched door)
    { src: '/assets/objects/archway.png', x: 6*TILE, y: 17.5*TILE, w: 4*TILE, h: 3*TILE, zBase: 20*TILE },
    // Stairs archway (left wall)
    { src: '/assets/objects/archway.png', x: -0.2*TILE, y: 15*TILE, w: 1.5*TILE, h: 3*TILE, zBase: 18*TILE },
    // Aquarium archway (right wall)
    { src: '/assets/objects/archway.png', x: 14.7*TILE, y: 15*TILE, w: 1.5*TILE, h: 3*TILE, zBase: 18*TILE },
    // Basket/bench (lower left)
    { src: '/assets/objects/barrels.png', x: 1*TILE, y: 20.5*TILE, w: 2*TILE, h: 2.5*TILE, zBase: 23*TILE },
    // Plant (lower right)
    { src: '/assets/objects/plant-shelf.png', x: 13*TILE, y: 20.5*TILE, w: 2*TILE, h: 2.5*TILE, zBase: 23*TILE },
  ],
};
