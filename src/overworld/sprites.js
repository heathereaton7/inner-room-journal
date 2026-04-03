/**
 * SPRITES — data-driven sprite configuration.
 *
 * Keys are `${base}-${outfit}`. Each entry has the spritesheet path
 * and grid layout. To add a new outfit:
 *   1. Add a PNG to /public/
 *   2. Add an entry here
 *   3. Everything else picks it up automatically
 */
export const SPRITES = {
  'male-default': {
    src: '/character-sprite.png',
    cols: 4,
    rows: 4,
    dirRow: { down: 0, left: 2, right: 1, up: 3 },
  },
  'female-default': {
    src: '/female-sprite.png',
    cols: 4,
    rows: 4,
    dirRow: { down: 0, left: 2, right: 1, up: 3 },
  },
};

/** Default appearance when nothing is stored */
export const DEFAULT_APPEARANCE = { base: 'male', outfit: 'default' };

/**
 * Resolve an appearance object to a sprite config entry.
 * Always returns a valid config (falls back to male-default).
 */
export function resolveSprite(appearance) {
  const key = `${appearance?.base || 'male'}-${appearance?.outfit || 'default'}`;
  return SPRITES[key] || SPRITES['male-default'];
}
