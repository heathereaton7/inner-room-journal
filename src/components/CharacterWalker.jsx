import { useRef, useEffect, useState, useCallback } from 'react';
import { resolveSprite } from '../overworld/sprites.js';

/**
 * CharacterWalker — lightweight walkable character overlay for immersive screens.
 *
 * Renders a spritesheet-animated character on top of any background.
 * Uses percentage-based positioning (0-100) so it works on any screen size.
 * Includes its own virtual joystick.
 *
 * Props:
 *   appearance   — { base: "male"|"female", outfit: "default" }
 *   spawnX       — initial X position (% from left, 0-100)
 *   spawnY       — initial Y position (% from top, 0-100)
 *   speed        — movement speed in % per second (default 12)
 *   scale        — sprite render scale (default 1.8)
 *   zIndex       — z-index for the character layer (default 20)
 */
export default function CharacterWalker({
  appearance,
  spawnX = 50,
  spawnY = 80,
  speed = 12,
  scale = 1.8,
  zIndex = 20,
}) {
  const sprite = resolveSprite(appearance);
  const posRef = useRef({ x: spawnX, y: spawnY });
  const dirRef = useRef('down');       // current facing direction
  const movingRef = useRef(false);
  const frameRef = useRef(0);
  const frameTimer = useRef(0);
  const joyRef = useRef({ dx: 0, dy: 0, active: false });
  const charRef = useRef(null);
  const animRef = useRef(null);
  const lastTime = useRef(0);
  const imgLoaded = useRef(false);

  // Joystick refs
  const joyContainerRef = useRef(null);
  const joyKnobRef = useRef(null);
  const joyTouchId = useRef(null);
  const joyOrigin = useRef({ x: 0, y: 0 });

  const JOY_RADIUS = 56;
  const JOY_KNOB = 24;
  const JOY_DEADZONE = 8;
  const FRAME_DURATION = 150; // ms per animation frame
  const SPRITE_W = 40;
  const SPRITE_H = 40;

  // ── Joystick handlers ──
  const updateJoystick = useCallback((clientX, clientY) => {
    const ox = joyOrigin.current.x;
    const oy = joyOrigin.current.y;
    let dx = clientX - ox;
    let dy = clientY - oy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > JOY_RADIUS) {
      dx = (dx / dist) * JOY_RADIUS;
      dy = (dy / dist) * JOY_RADIUS;
    }
    if (joyKnobRef.current) {
      joyKnobRef.current.style.transform = `translate(${dx}px, ${dy}px)`;
    }
    const normDist = dist / JOY_RADIUS;
    if (normDist < JOY_DEADZONE / JOY_RADIUS) {
      joyRef.current = { dx: 0, dy: 0, active: false };
    } else {
      joyRef.current = { dx: dx / JOY_RADIUS, dy: dy / JOY_RADIUS, active: true };
    }
  }, []);

  const onJoyStart = useCallback((e) => {
    if (joyTouchId.current !== null) return;
    const t = e.changedTouches[0];
    joyTouchId.current = t.identifier;
    const rect = joyContainerRef.current.getBoundingClientRect();
    joyOrigin.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    updateJoystick(t.clientX, t.clientY);
  }, [updateJoystick]);

  const onJoyMove = useCallback((e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === joyTouchId.current) {
        updateJoystick(t.clientX, t.clientY);
        break;
      }
    }
  }, [updateJoystick]);

  const onJoyEnd = useCallback((e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === joyTouchId.current) {
        joyTouchId.current = null;
        if (joyKnobRef.current) joyKnobRef.current.style.transform = 'translate(0,0)';
        joyRef.current = { dx: 0, dy: 0, active: false };
        break;
      }
    }
  }, []);

  // Global touch listeners for joystick drag
  useEffect(() => {
    window.addEventListener('touchmove', onJoyMove, { passive: true });
    window.addEventListener('touchend', onJoyEnd);
    window.addEventListener('touchcancel', onJoyEnd);
    return () => {
      window.removeEventListener('touchmove', onJoyMove);
      window.removeEventListener('touchend', onJoyEnd);
      window.removeEventListener('touchcancel', onJoyEnd);
    };
  }, [onJoyMove, onJoyEnd]);

  // Keyboard support (arrow keys / WASD)
  useEffect(() => {
    const keys = new Set();
    const down = (e) => { keys.add(e.key.toLowerCase()); updateKeys(); };
    const up = (e) => { keys.delete(e.key.toLowerCase()); updateKeys(); };
    const updateKeys = () => {
      let dx = 0, dy = 0;
      if (keys.has('arrowleft') || keys.has('a')) dx -= 1;
      if (keys.has('arrowright') || keys.has('d')) dx += 1;
      if (keys.has('arrowup') || keys.has('w')) dy -= 1;
      if (keys.has('arrowdown') || keys.has('s')) dy += 1;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len > 0) {
        joyRef.current = { dx: dx / len, dy: dy / len, active: true };
      } else {
        joyRef.current = { dx: 0, dy: 0, active: false };
      }
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  // ── Game loop — move + animate ──
  useEffect(() => {
    const loop = (ts) => {
      if (!lastTime.current) lastTime.current = ts;
      const dt = Math.min((ts - lastTime.current) / 1000, 0.05); // cap at 50ms
      lastTime.current = ts;

      const { dx, dy, active } = joyRef.current;
      movingRef.current = active;

      if (active) {
        // Determine direction
        if (Math.abs(dx) > Math.abs(dy)) {
          dirRef.current = dx > 0 ? 'right' : 'left';
        } else {
          dirRef.current = dy > 0 ? 'down' : 'up';
        }
        // Move (percentage-based)
        posRef.current.x = Math.max(2, Math.min(98, posRef.current.x + dx * speed * dt));
        posRef.current.y = Math.max(2, Math.min(98, posRef.current.y + dy * speed * dt));
      }

      // Animate frames
      frameTimer.current += dt * 1000;
      if (active && frameTimer.current >= FRAME_DURATION) {
        frameTimer.current = 0;
        frameRef.current = (frameRef.current + 1) % sprite.cols;
      }
      if (!active) {
        frameRef.current = 0;
        frameTimer.current = 0;
      }

      // Update DOM
      if (charRef.current) {
        charRef.current.style.left = `${posRef.current.x}%`;
        charRef.current.style.top = `${posRef.current.y}%`;
        // Sprite background position
        const row = sprite.dirRow[dirRef.current] || 0;
        const col = frameRef.current;
        const bgX = -(col * SPRITE_W * scale);
        const bgY = -(row * SPRITE_H * scale);
        charRef.current.style.backgroundPosition = `${bgX}px ${bgY}px`;
      }

      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [sprite, speed, scale]);

  const sw = SPRITE_W * scale;
  const sh = SPRITE_H * scale;

  return (
    <>
      {/* Character sprite */}
      <div
        ref={charRef}
        style={{
          position: 'absolute',
          left: `${spawnX}%`,
          top: `${spawnY}%`,
          width: sw,
          height: sh,
          transform: 'translate(-50%, -80%)', // anchor at feet
          zIndex,
          backgroundImage: `url(${sprite.src})`,
          backgroundSize: `${sprite.cols * sw}px ${sprite.rows * sh}px`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: '0px 0px',
          imageRendering: 'pixelated',
          pointerEvents: 'none',
          filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.5))',
        }}
      />

      {/* Virtual joystick */}
      <div
        ref={joyContainerRef}
        onTouchStart={onJoyStart}
        style={{
          position: 'fixed',
          bottom: 32,
          left: 32,
          width: JOY_RADIUS * 2,
          height: JOY_RADIUS * 2,
          borderRadius: '50%',
          background: 'rgba(255,248,232,0.06)',
          border: '1.5px solid rgba(201,169,110,0.18)',
          zIndex: 60,
          touchAction: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'auto',
        }}
      >
        <div
          ref={joyKnobRef}
          style={{
            width: JOY_KNOB * 2,
            height: JOY_KNOB * 2,
            borderRadius: '50%',
            background: 'rgba(201,169,110,0.25)',
            border: '1px solid rgba(201,169,110,0.35)',
            willChange: 'transform',
            pointerEvents: 'none',
          }}
        />
      </div>
    </>
  );
}
