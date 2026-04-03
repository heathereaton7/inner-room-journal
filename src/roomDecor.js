/**
 * Room placement helpers.
 *
 * The room state shape is: { placed: [{ id, left, top }] }
 * Item configs live in items.js. Inventory is the "bag."
 */
import { ITEMS } from './items.js';

/** Default room state */
export const DEFAULT_ROOM = { placed: [] };

/**
 * Migrate from old formats:
 *   { items: ["candle"] }           → { placed: [{id,left,top}] }
 *   { placed: [...], bag: [...] }   → { placed: [...] } (bag items go to inventory)
 */
export function migrateRoom(room, addToInv) {
  if (!room) return DEFAULT_ROOM;
  // Already new format (no bag)
  if (Array.isArray(room.placed) && !room.bag) return room;
  // Has bag → merge bag into inventory, keep placed
  if (Array.isArray(room.placed) && Array.isArray(room.bag)) {
    if (addToInv && room.bag.length > 0) {
      room.bag.forEach(id => addToInv(id, 1));
    }
    return { placed: room.placed };
  }
  // Old format: { items: ["candle", ...] }
  if (Array.isArray(room.items)) {
    return {
      placed: room.items.map(id => {
        const config = ITEMS[id];
        const pos = config?.decor?.defaultPos || { left: 50, top: 50 };
        return { id, left: pos.left, top: pos.top };
      }),
    };
  }
  return DEFAULT_ROOM;
}

/** Check if an item is placed in the room. */
export function isPlacedInRoom(room, itemId) {
  return room?.placed?.some(p => p.id === itemId) ?? false;
}

/** Place an item in the room at its default position. */
export function placeItem(room, itemId) {
  const r = room || DEFAULT_ROOM;
  const config = ITEMS[itemId];
  const pos = config?.decor?.defaultPos || { left: 50, top: 50 };
  return { placed: [...r.placed, { id: itemId, left: pos.left, top: pos.top }] };
}

/** Move a placed item to new coordinates. */
export function moveItem(room, itemId, left, top) {
  const r = room || DEFAULT_ROOM;
  return {
    placed: r.placed.map(p => p.id === itemId ? { ...p, left, top } : p),
  };
}

/** Remove a placed item from the room (returns to inventory). */
export function removeFromRoom(room, itemId) {
  const r = room || DEFAULT_ROOM;
  return { placed: r.placed.filter(p => p.id !== itemId) };
}
