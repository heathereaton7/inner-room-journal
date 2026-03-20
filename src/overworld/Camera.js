import { CAM_LERP, CAM_DEADZONE, TILE, WORLD_COLS, WORLD_ROWS } from './constants.js';

/**
 * Camera — Viewport tracking with smooth follow and tile culling.
 * Pure logic class, no React or DOM.
 */
export class Camera {
  constructor(viewW, viewH) {
    this.x = 0;         // top-left of viewport in world-space (px)
    this.y = 0;
    this.viewW = viewW; // viewport width (canvas pixel size)
    this.viewH = viewH;
  }

  /** Update viewport dimensions (on window resize). */
  resize(viewW, viewH) {
    this.viewW = viewW;
    this.viewH = viewH;
  }

  /**
   * Smooth follow toward the player's position.
   * @param {number} targetX  player world x
   * @param {number} targetY  player world y
   */
  follow(targetX, targetY) {
    let desiredX = targetX - this.viewW / 2;
    let desiredY = targetY - this.viewH / 2;

    // Clamp to world edges
    const maxX = WORLD_COLS * TILE - this.viewW;
    const maxY = WORLD_ROWS * TILE - this.viewH;
    desiredX = Math.max(0, Math.min(maxX, desiredX));
    desiredY = Math.max(0, Math.min(maxY, desiredY));

    // Smooth interpolation
    const dx = desiredX - this.x;
    const dy = desiredY - this.y;
    if (Math.abs(dx) > CAM_DEADZONE) this.x += dx * CAM_LERP;
    else this.x = desiredX;
    if (Math.abs(dy) > CAM_DEADZONE) this.y += dy * CAM_LERP;
    else this.y = desiredY;
  }

  /** Snap camera instantly (used on first frame or teleport). */
  snapTo(targetX, targetY) {
    this.x = Math.max(0, Math.min(
      WORLD_COLS * TILE - this.viewW,
      targetX - this.viewW / 2
    ));
    this.y = Math.max(0, Math.min(
      WORLD_ROWS * TILE - this.viewH,
      targetY - this.viewH / 2
    ));
  }

  /**
   * Returns the visible tile range (inclusive) with a 2-tile buffer.
   * Only these tiles need to be drawn each frame.
   */
  getVisibleTileRange() {
    const buffer = 2;
    return {
      startCol: Math.max(0, Math.floor(this.x / TILE) - buffer),
      startRow: Math.max(0, Math.floor(this.y / TILE) - buffer),
      endCol: Math.min(WORLD_COLS - 1, Math.floor((this.x + this.viewW) / TILE) + buffer),
      endRow: Math.min(WORLD_ROWS - 1, Math.floor((this.y + this.viewH) / TILE) + buffer),
    };
  }

  /** Convert world coordinates to screen (canvas) coordinates. */
  worldToScreen(wx, wy) {
    return { sx: wx - this.x, sy: wy - this.y };
  }

  /** Convert screen (canvas) coordinates to world coordinates. */
  screenToWorld(sx, sy) {
    return { wx: sx + this.x, wy: sy + this.y };
  }
}
