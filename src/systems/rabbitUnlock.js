/**
 * Rabbit Unlock — checks whether the player meets requirements
 * to unlock a rabbit companion in the garden.
 *
 * Phase 5: simple inventory-based check.
 * Future phases may add: water source, sleeping area, bonding, breeding.
 */

/** Requirements to unlock the first rabbit */
export const RABBIT_REQUIREMENTS = {
  timothy_hay: 1,
  cilantro_herb: 1,
};

/**
 * Check if the player's inventory meets rabbit unlock requirements.
 * @param {Object} inventory — { itemId: qty }
 * @returns {boolean}
 */
export function canUnlockRabbit(inventory) {
  if (!inventory) return false;
  return Object.entries(RABBIT_REQUIREMENTS).every(
    ([itemId, qty]) => (inventory[itemId] || 0) >= qty
  );
}
