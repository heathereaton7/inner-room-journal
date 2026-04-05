import { PLAYER_SPEED, PLAYER_SIZE, TILE, WORLD_COLS, WORLD_ROWS, SOLID } from './constants.js';

/**
 * Player — Avatar position, velocity, collision, and walk animation.
 * Pure logic class, no React or DOM.
 */
export class Player {
  constructor(x, y) {
    this.x = x;           // world-space center x (px)
    this.y = y;           // world-space center y (px)
    this.vx = 0;
    this.vy = 0;
    this.facing = 'down'; // 'up' | 'down' | 'left' | 'right'
    this.moving = false;
    this.animTimer = 0;   // accumulates dt for walk cycle
    this.animFrame = 0;   // 0-3 (four-frame walk cycle)
    // Dynamic world dimensions (can be updated when switching maps)
    this.worldCols = WORLD_COLS;
    this.worldRows = WORLD_ROWS;
  }

  /** Set world dimensions for the current map. */
  setWorldSize(cols, rows) {
    this.worldCols = cols;
    this.worldRows = rows;
  }

  /** Teleport player to a specific position. */
  teleport(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.moving = false;
    this.animFrame = 0;
    this.animTimer = 0;
  }

  /**
   * Update player each frame.
   * @param {number} dx  horizontal input (-1 to 1)
   * @param {number} dy  vertical input (-1 to 1)
   * @param {number} dt  delta time in seconds
   * @param {Uint8Array} grid  the world tile grid
   */
  update(dx, dy, dt, grid) {
    // Normalize diagonal speed
    const mag = Math.sqrt(dx * dx + dy * dy);
    if (mag > 0.01) {
      const nx = dx / mag;
      const ny = dy / mag;
      this.vx = nx * PLAYER_SPEED;
      this.vy = ny * PLAYER_SPEED;
      this.moving = true;

      // Determine facing from dominant axis
      if (Math.abs(dx) > Math.abs(dy)) {
        this.facing = dx > 0 ? 'right' : 'left';
      } else {
        this.facing = dy > 0 ? 'down' : 'up';
      }
    } else {
      this.vx = 0;
      this.vy = 0;
      this.moving = false;
    }

    // Axis-separated collision: try X, then Y independently
    const nextX = this.x + this.vx * dt;
    if (!this._collides(nextX, this.y, grid)) {
      this.x = nextX;
    }

    const nextY = this.y + this.vy * dt;
    if (!this._collides(this.x, nextY, grid)) {
      this.y = nextY;
    }

    // Clamp to world bounds
    const half = PLAYER_SIZE / 2;
    this.x = Math.max(half, Math.min(this.worldCols * TILE - half, this.x));
    this.y = Math.max(half, Math.min(this.worldRows * TILE - half, this.y));

    // Walk animation — 4-frame cycle (0→1→2→3→0…)
    if (this.moving) {
      this.animTimer += dt;
      if (this.animTimer > 0.15) {
        this.animFrame = (this.animFrame + 1) % 4;
        this.animTimer = 0;
      }
    } else {
      this.animFrame = 0;
      this.animTimer = 0;
    }
  }

  /**
   * AABB collision check: tests all four corners of the player bounding box
   * against solid tiles in the grid.
   */
  _collides(cx, cy, grid) {
    const half = PLAYER_SIZE / 2 - 4; // slight inset for forgiving collision
    const corners = [
      [cx - half, cy - half],
      [cx + half, cy - half],
      [cx - half, cy + half],
      [cx + half, cy + half],
    ];
    for (const [px, py] of corners) {
      const col = Math.floor(px / TILE);
      const row = Math.floor(py / TILE);
      if (col < 0 || col >= this.worldCols || row < 0 || row >= this.worldRows) return true;
      const tileType = grid[row * this.worldCols + col];
      if (SOLID.has(tileType)) return true;
    }
    return false;
  }
}
