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
  zones: INTERACTION_ZONES.filter(z => z.id !== 'cabin' && z.id !== 'upper-room' && z.id !== 'market'),

  transitions: [
    {
      id: 'cabin-door',
      // Centered on the porch door steps (col 14, row 56).
      // Radius 72px = ~1 tile. Player must walk ONTO the porch to trigger.
      // The walkable path alongside the cabin (cols 11-17, rows 58+) is
      // 128+ px away, so walking past the cabin won't trigger entry.
      cx: 14 * TILE + TILE / 2,   // col 14 center = 928
      cy: 56 * TILE + TILE / 2,   // row 56 center = 3616
      radius: 72,
      targetMap: 'cabin-interior',
      spawnId: 'from-exterior',
    },
    {
      id: 'upper-room-door',
      cx: 32 * TILE + TILE / 2,
      cy: 12 * TILE,
      radius: 72,
      targetMap: 'upper-room',
      spawnId: 'from-exterior',
    },
    {
      id: 'market-door',
      cx: 22 * TILE + TILE / 2,
      cy: 32 * TILE,
      radius: 72,
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
