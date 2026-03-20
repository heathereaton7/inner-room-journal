/**
 * GameLoop — requestAnimationFrame manager.
 * Calls onUpdate(dt) then onRender() each frame.
 * Caps dt to prevent spiral-of-death after tab switches.
 */
export class GameLoop {
  constructor() {
    this._rafId = null;
    this._lastTime = 0;
    this._running = false;
    this.onUpdate = null;  // (dt: number) => void  — dt in seconds
    this.onRender = null;  // () => void
    this._tick = this._tick.bind(this);
  }

  start() {
    if (this._running) return;
    this._running = true;
    this._lastTime = performance.now();
    this._rafId = requestAnimationFrame(this._tick);
  }

  stop() {
    this._running = false;
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }

  _tick(now) {
    if (!this._running) return;

    let dt = (now - this._lastTime) / 1000;
    this._lastTime = now;

    // Clamp dt to prevent huge jumps (e.g., after tab switch)
    if (dt > 0.1) dt = 0.016;

    if (this.onUpdate) this.onUpdate(dt);
    if (this.onRender) this.onRender();

    this._rafId = requestAnimationFrame(this._tick);
  }
}
