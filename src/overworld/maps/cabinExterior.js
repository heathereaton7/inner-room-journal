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

  zones: INTERACTION_ZONES.map(z => ({
    ...z,
    // Override cabin zone to use door transition instead of screen switch
  })).filter(z => z.id !== 'cabin'),

  // Cabin uses a door transition instead of a zone prompt
  transitions: [
    {
      id: 'cabin-door',
      cx: 14 * TILE + TILE / 2,    // center of cabin building
      cy: 56 * TILE + TILE / 2,    // porch area (south of cabin)
      radius: 80,
      targetMap: 'cabin-interior',
      spawnId: 'from-exterior',
    },
  ],

  spawnPoints: {
    default: { x: SPAWN_X, y: SPAWN_Y },
    'from-cabin': { x: 14 * TILE + TILE / 2, y: 57 * TILE + TILE / 2 },
  },
};
