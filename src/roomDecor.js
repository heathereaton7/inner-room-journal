/**
 * ROOM_ITEMS — data-driven room decor configuration.
 *
 * Each key is a unique item ID. Positions use percentages so they
 * scale across screen sizes. To add a new item:
 *   1. Add a transparent PNG to /public/decor/
 *   2. Add an entry here with positioning
 *   3. Add unlock logic wherever appropriate
 */
export const ROOM_ITEMS = {
  candle: {
    id: 'candle',
    src: '/decor/candle.png',
    label: 'A quiet flame',
    style: {
      position: 'absolute',
      left: '12%',
      top: '28%',
      width: '8%',
      transform: 'translate(-50%, -50%)',
      pointerEvents: 'none',
      zIndex: 6,
      filter: 'brightness(1.15) saturate(1.2)',
    },
    // Optional glow effect behind the item
    glow: {
      size: '14%',
      color: 'rgba(255,200,100,0.18)',
    },
  },
};

/** Default room state */
export const DEFAULT_ROOM = { items: [] };

/**
 * Check if a room has a specific item unlocked.
 */
export function hasItem(room, itemId) {
  return room?.items?.includes(itemId) ?? false;
}

/**
 * Add an item to the room (returns new room object, does not mutate).
 * Returns null if item already exists (no change needed).
 */
export function addItem(room, itemId) {
  const current = room || DEFAULT_ROOM;
  if (current.items.includes(itemId)) return null;
  return { ...current, items: [...current.items, itemId] };
}
