import { T } from './constants.js';

/**
 * TileAssets — Image-based tile loader with preloading and fallback.
 *
 * Design:
 *   - Maps each tile type enum (T.GRASS, T.PATH, ...) to an image path
 *   - Preloads all images at startup
 *   - getImage(tileType) returns a loaded Image or null (renderer falls back to color)
 *   - Supports seasonal variants via setSeason()
 *   - Supports animated tiles via frame arrays (future)
 *   - New tiles can be added by editing TILE_IMAGE_MAP only — no engine changes needed
 */

// ─── Base path for all tile images ─────────────────────────────────
const TILE_BASE_PATH = '/assets/tiles/';

// ─── Tile type → image filename mapping ────────────────────────────
// To add a new tile: just add an entry here and drop a PNG in public/assets/tiles/
const TILE_IMAGE_MAP = {
  [T.GRASS]:      'grass.png',
  [T.PATH]:       'path.png',
  [T.WATER]:      'water.png',
  [T.DIRT]:       'dirt.png',
  [T.TREE]:       'tree.png',
  [T.BUILDING]:   'building.png',
  [T.FARMLAND]:   'farmland.png',
  [T.FENCE]:      'fence.png',
  [T.BRIDGE]:     'bridge.png',
  [T.FLOWER]:     'flower.png',
  [T.DOOR]:       'door.png',
  [T.CABIN_INT]:  'cabin.png',
  [T.GARDEN_INT]: 'garden_int.png',
  [T.MARKET_INT]: 'market_int.png',
  [T.UPPER_INT]:  'upper_int.png',
  // Farm-specific tiles (new)
  [T.TILLED_SOIL]:  'tilled_soil.png',
  [T.CROP_1]:       'crop_stage1.png',
  [T.CROP_2]:       'crop_stage2.png',
  [T.CROP_3]:       'crop_stage3.png',
  [T.ANIMAL_PEN]:   'animal_pen.png',
  [T.HAY_BALE]:     'hay_bale.png',
  [T.BARN]:         'barn.png',
  [T.FENCE_GATE]:   'fence_gate.png',
};

// ─── Internal state ────────────────────────────────────────────────
const _images = {};       // tileType → Image (loaded)
let _loaded = false;
let _season = 'default';  // future: 'spring', 'summer', 'fall', 'winter'

// ─── Seasonal variant support ──────────────────────────────────────
// When a season is set, the loader checks for e.g. "grass_winter.png" first,
// falling back to "grass.png" if the seasonal variant doesn't exist.
const SEASON_SUFFIXES = {
  default: '',
  spring: '_spring',
  summer: '_summer',
  fall: '_fall',
  winter: '_winter',
};

// ─── Animated tile support (future) ────────────────────────────────
// Tile types listed here will load multiple frames.
// Frame files: water_f0.png, water_f1.png, water_f2.png, ...
// For now this is a placeholder structure — no animated tiles are loaded yet.
const ANIMATED_TILES = {
  // [T.WATER]: { frames: 4, fps: 3 },  // uncomment when animated water tiles exist
};

const _animFrames = {};   // tileType → Image[] (for animated tiles)
let _animTime = 0;

// ─── Public API ────────────────────────────────────────────────────

/**
 * Preload all tile images. Call once at startup.
 * Returns a Promise that resolves when all images are loaded (or failed gracefully).
 */
export function preloadTileAssets() {
  if (_loaded) return Promise.resolve();

  const promises = [];

  for (const [tileTypeStr, filename] of Object.entries(TILE_IMAGE_MAP)) {
    const tileType = Number(tileTypeStr);
    const baseName = filename.replace('.png', '');
    const suffix = SEASON_SUFFIXES[_season] || '';

    // Try seasonal variant first, fall back to default
    const paths = suffix
      ? [`${TILE_BASE_PATH}${baseName}${suffix}.png`, `${TILE_BASE_PATH}${filename}`]
      : [`${TILE_BASE_PATH}${filename}`];

    const p = _loadImageWithFallback(paths).then(img => {
      if (img) _images[tileType] = img;
    });
    promises.push(p);

    // Load animated frames if configured
    const anim = ANIMATED_TILES[tileType];
    if (anim) {
      _animFrames[tileType] = [];
      for (let f = 0; f < anim.frames; f++) {
        const framePath = `${TILE_BASE_PATH}${baseName}_f${f}.png`;
        const fp = _loadImage(framePath).then(img => {
          if (img) _animFrames[tileType][f] = img;
        });
        promises.push(fp);
      }
    }
  }

  return Promise.all(promises).then(() => {
    _loaded = true;
    const count = Object.keys(_images).length;
    console.log(`[TileAssets] Loaded ${count}/${Object.keys(TILE_IMAGE_MAP).length} tile images`);
  });
}

/**
 * Get the image for a tile type.
 * Returns a loaded HTMLImageElement, or null if not available (renderer should fall back).
 */
export function getImage(tileType) {
  return _images[tileType] || null;
}

/**
 * Get the current animation frame image for an animated tile.
 * Returns a loaded HTMLImageElement, or the static image, or null.
 */
export function getAnimatedImage(tileType, time) {
  const anim = ANIMATED_TILES[tileType];
  const frames = _animFrames[tileType];
  if (!anim || !frames || frames.length === 0) return getImage(tileType);

  const frameIdx = Math.floor(time * anim.fps) % anim.frames;
  return frames[frameIdx] || getImage(tileType);
}

/**
 * Set the season. Call this then call preloadTileAssets() again to reload.
 * @param {'default'|'spring'|'summer'|'fall'|'winter'} season
 */
export function setSeason(season) {
  if (_season === season) return;
  _season = season;
  _loaded = false;
  // Clear cached images so they reload with seasonal variants
  for (const key of Object.keys(_images)) delete _images[key];
}

/**
 * Check if assets are loaded.
 */
export function isLoaded() {
  return _loaded;
}

// ─── Internal helpers ──────────────────────────────────────────────

function _loadImage(src) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function _loadImageWithFallback(paths) {
  if (paths.length === 0) return Promise.resolve(null);
  return _loadImage(paths[0]).then(img => {
    if (img) return img;
    return _loadImageWithFallback(paths.slice(1));
  });
}
