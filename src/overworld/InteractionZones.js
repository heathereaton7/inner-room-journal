import { INTERACT_RADIUS, INTERACT_TAP_RADIUS } from './constants.js';
import { INTERACTION_ZONES } from './worldMap.js';

/**
 * InteractionZones — Proximity detection for enterable locations.
 * Checks player distance to zone centers each frame.
 */
export class InteractionZones {
  constructor() {
    this.nearbyZone = null; // closest zone within prompt range, or null
  }

  /**
   * Called each frame with player position. Updates nearbyZone.
   * @param {number} playerX  world x
   * @param {number} playerY  world y
   */
  update(playerX, playerY) {
    let closest = null;
    let closestDist = Infinity;

    for (const zone of INTERACTION_ZONES) {
      const dx = playerX - zone.cx;
      const dy = playerY - zone.cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < INTERACT_RADIUS && dist < closestDist) {
        closest = zone;
        closestDist = dist;
      }
    }

    this.nearbyZone = closest;
  }

  /**
   * Returns the zone the player can enter (within tap radius), or null.
   * @param {number} playerX  world x
   * @param {number} playerY  world y
   */
  getEnterable(playerX, playerY) {
    if (!this.nearbyZone) return null;
    const dx = playerX - this.nearbyZone.cx;
    const dy = playerY - this.nearbyZone.cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < INTERACT_TAP_RADIUS ? this.nearbyZone : null;
  }
}
