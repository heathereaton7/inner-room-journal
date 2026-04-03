/**
 * ROOM_ITEMS — data-driven room decor configuration.
 *
 * Each key is a unique item ID. `defaultPos` is where the item
 * first appears when placed. Users can drag to reposition.
 *
 * To add a new item:
 *   1. Add a transparent PNG to /public/decor/
 *   2. Add an entry here
 *   3. Add unlock logic wherever appropriate
 */
export const ROOM_ITEMS = {
  candle: {
    id: 'candle',
    src: '/decor/candle.png',
    label: 'A quiet flame',
    width: '18%',
    filter: 'brightness(1.15) saturate(1.2)',
    defaultPos: { left: 12, top: 28 },
    glow: { size: '28%', color: 'rgba(255,200,100,0.18)' },
  },
};

/**
 * Room state shape:
 *   { placed: [{ id, left, top }], bag: [id, id, ...] }
 *
 * "placed" = visible in the room with custom position
 * "bag"    = unlocked but stored away
 */
export const DEFAULT_ROOM = { placed: [], bag: [] };

/**
 * Migrate from old format { items: [...] } → new { placed, bag }.
 */
export function migrateRoom(room) {
  if (!room) return DEFAULT_ROOM;
  // Already new format
  if (Array.isArray(room.placed)) return room;
  // Old format: { items: ["candle", ...] }
  if (Array.isArray(room.items)) {
    return {
      placed: room.items.map(id => {
        const config = ROOM_ITEMS[id];
        return { id, left: config?.defaultPos?.left ?? 50, top: config?.defaultPos?.top ?? 50 };
      }),
      bag: [],
    };
  }
  return DEFAULT_ROOM;
}

/** Check if an item is unlocked (placed OR in bag). */
export function hasItem(room, itemId) {
  const r = migrateRoom(room);
  return r.placed.some(p => p.id === itemId) || r.bag.includes(itemId);
}

/** Unlock a new item and place it in the room. Returns null if already owned. */
export function unlockItem(room, itemId) {
  const r = migrateRoom(room);
  if (hasItem(r, itemId)) return null;
  const config = ROOM_ITEMS[itemId];
  const pos = config?.defaultPos || { left: 50, top: 50 };
  return { ...r, placed: [...r.placed, { id: itemId, left: pos.left, top: pos.top }] };
}

/** Move a placed item to new coordinates. */
export function moveItem(room, itemId, left, top) {
  const r = migrateRoom(room);
  return {
    ...r,
    placed: r.placed.map(p => p.id === itemId ? { ...p, left, top } : p),
  };
}

/** Put a placed item into the bag. */
export function stowItem(room, itemId) {
  const r = migrateRoom(room);
  return {
    placed: r.placed.filter(p => p.id !== itemId),
    bag: [...r.bag, itemId],
  };
}

/** Take an item from the bag and place it in the room. */
export function placeFromBag(room, itemId) {
  const r = migrateRoom(room);
  if (!r.bag.includes(itemId)) return null;
  const config = ROOM_ITEMS[itemId];
  const pos = config?.defaultPos || { left: 50, top: 50 };
  return {
    placed: [...r.placed, { id: itemId, left: pos.left, top: pos.top }],
    bag: r.bag.filter(id => id !== itemId),
  };
}
