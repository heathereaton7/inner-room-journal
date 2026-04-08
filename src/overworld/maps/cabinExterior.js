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
      cx: 14 * TILE,
      cy: 53 * TILE,
      radius: 280,
    },
    {
      id: 'upper-room-zone',
      label: 'Upper Room',
      description: 'Worship & encounter',
      screen: 'upper-room',
      // Centered on upper room building (cols 30-34, rows 7-11)
      // Large radius so prompt appears when walking near the plaza
      cx: 32 * TILE + TILE / 2,
      cy: 9 * TILE + TILE / 2,
      radius: 380,
    },
  ],

  transitions: [
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
