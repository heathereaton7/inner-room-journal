/**
 * Input — Unified input state merging virtual joystick + keyboard.
 * Pure logic, no React or DOM rendering.
 */
export class Input {
  constructor() {
    // Joystick state (set externally by Joystick.jsx)
    this.joyDx = 0;
    this.joyDy = 0;
    this.joyActive = false;

    // Keyboard state
    this._keys = {};
    this._onKeyDown = (e) => { this._keys[e.code] = true; };
    this._onKeyUp = (e) => { this._keys[e.code] = false; };
  }

  /** Attach keyboard listeners. Call once on mount. */
  attach() {
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
  }

  /** Detach keyboard listeners. Call on unmount. */
  detach() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    this._keys = {};
  }

  /**
   * Called by Joystick.jsx when the user drags the knob.
   * @param {number} dx  -1 to 1
   * @param {number} dy  -1 to 1
   * @param {boolean} active  whether touch is active
   */
  setJoystick(dx, dy, active) {
    this.joyDx = dx;
    this.joyDy = dy;
    this.joyActive = active;
  }

  /**
   * Returns merged direction. Joystick takes priority when active.
   * @returns {{ dx: number, dy: number }}
   */
  getDirection() {
    if (this.joyActive) {
      return { dx: this.joyDx, dy: this.joyDy };
    }

    let dx = 0, dy = 0;
    const k = this._keys;
    if (k['ArrowLeft'] || k['KeyA']) dx -= 1;
    if (k['ArrowRight'] || k['KeyD']) dx += 1;
    if (k['ArrowUp'] || k['KeyW']) dy -= 1;
    if (k['ArrowDown'] || k['KeyS']) dy += 1;
    return { dx, dy };
  }
}
