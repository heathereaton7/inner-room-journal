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
  zones: INTERACTION_ZONES.filter(z => z.id !== 'cabin' && z.id !== 'upper-room'),

  transitions: [
    {
      id: 'cabin-door',
      cx: 14 * TILE + TILE / 2,
      cy: 56 * TILE + TILE / 2,
      radius: 80,
      targetMap: 'cabin-interior',
      spawnId: 'from-exterior',
    },
    {
      id: 'upper-room-door',
      cx: 32 * TILE + TILE / 2,   // center of upper room building
      cy: 12 * TILE + TILE / 2,   // south porch area
      radius: 80,
      targetMap: 'upper-room',
      spawnId: 'from-exterior',
    },
  ],

  spawnPoints: {
    default: { x: SPAWN_X, y: SPAWN_Y },
    'from-cabin': { x: 14 * TILE + TILE / 2, y: 57 * TILE + TILE / 2 },
    'from-upper-room': { x: 32 * TILE + TILE / 2, y: 13 * TILE + TILE / 2 },
  },
};
