import { TILE } from './constants.js';
import { loadMapImages } from './Renderer.js';

/**
 * MapManager — Handles loading, switching, and transitioning between maps.
 *
 * Each map definition has:
 *   id, cols, rows, mapImages, mapScale, camZoom,
 *   buildGrid(), zones[], transitions[], spawnPoints{}
 */
export class MapManager {
  constructor() {
    this.maps = {};        // registry: { id → mapDef }
    this.current = null;   // active map definition
    this.grid = null;      // active collision grid (Uint8Array)
  }

  /** Register a map definition. */
  register(mapDef) {
    this.maps[mapDef.id] = mapDef;
  }

  /** Register multiple map definitions. */
  registerAll(mapDefs) {
    for (const def of mapDefs) this.register(def);
  }

  /**
   * Load a map by ID.
   * Builds the grid, loads map images, returns spawn position.
   * @param {string} mapId
   * @param {string} [spawnId] — named spawn point (defaults to 'default')
   * @returns {{ x, y }} spawn position in world pixels
   */
  load(mapId, spawnId = 'default') {
    const def = this.maps[mapId];
    if (!def) {
      console.error(`[MapManager] Unknown map: ${mapId}`);
      return { x: 0, y: 0 };
    }

    this.current = def;
    this.grid = def.buildGrid();

    // Load background images
    if (def.mapImages?.length > 0) {
      loadMapImages(def.mapImages, def.mapScale);
    }

    // Resolve spawn point
    const spawn = def.spawnPoints?.[spawnId] || def.spawnPoints?.default || { x: def.cols * TILE / 2, y: def.rows * TILE / 2 };
    console.log(`[MapManager] Loaded map "${mapId}" (${def.cols}x${def.rows}), spawn "${spawnId}" at (${spawn.x}, ${spawn.y})`);
    return spawn;
  }

  /**
   * Check if the player has stepped into a transition zone.
   * Returns { targetMap, spawnId } if triggered, or null.
   */
  checkTransitions(playerX, playerY) {
    if (!this.current?.transitions) return null;
    for (const t of this.current.transitions) {
      const dx = playerX - t.cx;
      const dy = playerY - t.cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < (t.radius || 48)) {
        return { targetMap: t.targetMap, spawnId: t.spawnId };
      }
    }
    return null;
  }

  /** Get the current map's interaction zones (for InteractionZones class). */
  getZones() {
    return this.current?.zones || [];
  }

  /** Get current world dimensions in pixels. */
  getWorldSize() {
    if (!this.current) return { w: 3072, h: 9216 };
    return {
      w: this.current.cols * TILE,
      h: this.current.rows * TILE,
    };
  }

  /** Get current map's camera zoom (or default). */
  getCamZoom() {
    return this.current?.camZoom ?? 0.38;
  }
}
