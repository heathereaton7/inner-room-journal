/**
 * InteractionZones — Proximity detection for enterable locations.
 * Checks player distance to zone centers each frame.
 * Zones can be swapped when maps change.
 */
export class InteractionZones {
  constructor(zones) {
    this.zones = zones || [];
    this.nearbyZone = null; // closest zone within prompt range, or null
  }

  /** Replace zones (called when map changes). */
  setZones(zones) {
    this.zones = zones || [];
    this.nearbyZone = null;
  }

  /**
   * Called each frame with player position. Updates nearbyZone.
   * @param {number} playerX  world x
   * @param {number} playerY  world y
   */
  update(playerX, playerY) {
    let closest = null;
    let closestDist = Infinity;

    for (const zone of this.zones) {
      const dx = playerX - zone.cx;
      const dy = playerY - zone.cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < zone.radius && dist < closestDist) {
        closest = zone;
        closestDist = dist;
      }
    }

    this.nearbyZone = closest;
  }

  /**
   * Returns the zone the player can enter (within zone radius), or null.
   * @param {number} playerX  world x
   * @param {number} playerY  world y
   */
  getEnterable(playerX, playerY) {
    if (!this.nearbyZone) return null;
    const dx = playerX - this.nearbyZone.cx;
    const dy = playerY - this.nearbyZone.cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < this.nearbyZone.radius ? this.nearbyZone : null;
  }
}
