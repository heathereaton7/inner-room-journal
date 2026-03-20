// ─── Map Images ───────────────────────────────────────────────────
// Illustrated map artwork stacked vertically as the world background.
// The tile grid is invisible — used only for collision and positioning.
export const MAP_IMAGES = ['/newmap.png', '/farmmap.png'];
export const MAP_SCALE = 3;  // each image (1024x1536) scaled 3x

// ─── Tile & World Dimensions ──────────────────────────────────────
export const TILE = 64;
export const WORLD_COLS = 48;    // 1024 * 3 / 64
export const WORLD_ROWS = 144;   // 2 images * 72 rows each
export const WORLD_W = TILE * WORLD_COLS;   // 3072
export const WORLD_H = TILE * WORLD_ROWS;   // 9216

// ─── Player ───────────────────────────────────────────────────────
export const PLAYER_SPEED = 200;   // px per second
export const PLAYER_SIZE = 32;     // bounding box for collision
export const PLAYER_SPRITE_W = 40; // draw width
export const PLAYER_SPRITE_H = 40; // draw height

// ─── Camera ───────────────────────────────────────────────────────
export const CAM_ZOOM = 0.38;        // <1 = zoom out (0.38 = ~62% wider view)
export const CAM_LERP = 0.08;       // interpolation factor (0-1)
export const CAM_DEADZONE = 2;      // px — snap below this delta

// ─── Interaction ──────────────────────────────────────────────────
export const INTERACT_RADIUS = 128;     // px — show prompt
export const INTERACT_TAP_RADIUS = 160; // px — allow entry

// ─── Joystick ─────────────────────────────────────────────────────
export const JOY_RADIUS = 60;   // outer ring
export const JOY_KNOB = 28;     // inner knob
export const JOY_DEADZONE = 8;  // ignore input below this (px)

// ─── Tile Type Enum ───────────────────────────────────────────────
// Used for the invisible collision grid, not for visual rendering.
export const T = {
  GRASS:     0,   // walkable
  PATH:      1,   // walkable
  WATER:     2,   // solid
  DIRT:      3,   // walkable
  TREE:      4,   // solid (forest)
  BUILDING:  5,   // solid (walls)
  FARMLAND:  6,   // walkable
  FENCE:     7,   // solid
  BRIDGE:    8,   // walkable
  FLOWER:    9,   // walkable
  DOOR:      10,  // walkable entry point
  // Building interior markers (walkable)
  CABIN_INT:    20,
  GARDEN_INT:   21,
  MARKET_INT:   22,
  UPPER_INT:    23,
  // Farm building interiors (walkable)
  BARN_INT:     24,
  FARM_INT:     25,
};

// ─── Solid Tiles (block movement) ─────────────────────────────────
export const SOLID = new Set([T.TREE, T.BUILDING, T.FENCE, T.WATER]);
