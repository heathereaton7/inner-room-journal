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
    // Dynamic world size (can be updated when switching maps)
    this.worldW = WORLD_COLS * TILE;
    this.worldH = WORLD_ROWS * TILE;
  }

  /** Set the world bounds for the current map. */
  setWorldSize(w, h) {
    this.worldW = w;
    this.worldH = h;
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

    // Clamp to world edges. When the viewport is BIGGER than the world
    // (common on wide desktop monitors), `worldW - viewW` is negative —
    // in that case we center the world inside the viewport instead of
    // pinning it to the corner, so no empty void shows on the side.
    if (this.viewW >= this.worldW) {
      desiredX = (this.worldW - this.viewW) / 2; // negative → centers world
    } else {
      desiredX = Math.max(0, Math.min(this.worldW - this.viewW, desiredX));
    }
    if (this.viewH >= this.worldH) {
      desiredY = (this.worldH - this.viewH) / 2;
    } else {
      desiredY = Math.max(0, Math.min(this.worldH - this.viewH, desiredY));
    }

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
    // Same centering logic as follow() — center the world when the
    // viewport is bigger than it, otherwise clamp to world edges.
    if (this.viewW >= this.worldW) {
      this.x = (this.worldW - this.viewW) / 2;
    } else {
      this.x = Math.max(0, Math.min(
        this.worldW - this.viewW,
        targetX - this.viewW / 2
      ));
    }
    if (this.viewH >= this.worldH) {
      this.y = (this.worldH - this.viewH) / 2;
    } else {
      this.y = Math.max(0, Math.min(
        this.worldH - this.viewH,
        targetY - this.viewH / 2
      ));
    }
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
