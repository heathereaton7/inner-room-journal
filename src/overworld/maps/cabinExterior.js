import { TILE, T } from '../constants.js';
import { buildWorldGrid, INTERACTION_ZONES, SPAWN_X, SPAWN_Y } from '../worldMap.js';

/**
 * Cabin Exterior — The main overworld village + farm map.
 * Uses the existing worldMap.js grid builder and zone definitions.
 */
export default {
  id: 'cabin-exterior',
  cols: 48,
  rows: 144,
  mapImages: ['/newmap.webp', '/farmmap.webp'],
  mapScale: 3,
  camZoom: 0.38,

  buildGrid: buildWorldGrid,

  // Filter out buildings that now have walkable interiors (use door transitions instead)
  // Cabin uses the immersive CabinScreen, so it gets a zone (not a map transition)
  zones: [
    ...INTERACTION_ZONES.filter(z => z.id !== 'cabin' && z.id !== 'upper-room' && z.id !== 'market'),
    {
      id: 'cabin-door',
      label: 'Cabin',
      description: 'Your quiet place',
      screen: 'cabin',
      // Centered ON the cabin building so the zone catches players
      // walking past on the N-S path (cols 14-15). Building (cols 12-16,
      // rows 51-55) is solid — player walks alongside on cols 11 or 17.
      // At col 11, row 53: distance to center = ~200px → inside 280.
      cx: 14 * TILE,              // col 14 — cabin center
      cy: 53 * TILE,              // row 53 — cabin midpoint
      radius: 280,                // catches path alongside + porch area
    },
  ],

  transitions: [
    {
      id: 'upper-room-door',
      cx: 32 * TILE + TILE / 2,
      cy: 12 * TILE,
      radius: 100,
      targetMap: 'upper-room',
      spawnId: 'from-exterior',
    },
    {
      id: 'market-door',
      cx: 22 * TILE + TILE / 2,
      cy: 32 * TILE,
      radius: 100,
      targetMap: 'market-interior',
      spawnId: 'from-exterior',
    },
  ],

  spawnPoints: {
    default: { x: SPAWN_X, y: SPAWN_Y },
    // Spawn 2 rows south of the porch so player doesn't immediately re-trigger
    'from-cabin': { x: 14 * TILE + TILE / 2, y: 59 * TILE + TILE / 2 },
    'from-upper-room': { x: 32 * TILE + TILE / 2, y: 14 * TILE + TILE / 2 },
    'from-market': { x: 21 * TILE + TILE / 2, y: 34 * TILE + TILE / 2 },
  },
};
