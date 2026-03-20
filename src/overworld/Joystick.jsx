import { useRef, useCallback, useEffect } from 'react';
import { JOY_RADIUS, JOY_KNOB, JOY_DEADZONE } from './constants.js';

/**
 * Virtual joystick thumb-stick overlay.
 * Positioned in the bottom-left corner.
 * Feeds direction input to the Input system via inputRef.
 *
 * Props:
 *   inputRef  — React ref whose .current is an Input instance
 */
export default function Joystick({ inputRef }) {
  const containerRef = useRef(null);
  const knobRef = useRef(null);
  const touchId = useRef(null);
  const originRef = useRef({ x: 0, y: 0 });

  const updateKnob = useCallback((clientX, clientY) => {
    const ox = originRef.current.x;
    const oy = originRef.current.y;
    let dx = clientX - ox;
    let dy = clientY - oy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Clamp knob to ring radius
    if (dist > JOY_RADIUS) {
      dx = (dx / dist) * JOY_RADIUS;
      dy = (dy / dist) * JOY_RADIUS;
    }

    // Move the visual knob
    if (knobRef.current) {
      knobRef.current.style.transform = `translate(${dx}px, ${dy}px)`;
    }

    // Normalize to -1..1 and apply deadzone
    const normDist = dist / JOY_RADIUS;
    if (normDist < JOY_DEADZONE / JOY_RADIUS) {
      inputRef.current?.setJoystick(0, 0, true);
    } else {
      inputRef.current?.setJoystick(dx / JOY_RADIUS, dy / JOY_RADIUS, true);
    }
  }, [inputRef]);

  const handleTouchStart = useCallback((e) => {
    if (touchId.current !== null) return;
    const touch = e.changedTouches[0];
    touchId.current = touch.identifier;
    const rect = containerRef.current.getBoundingClientRect();
    originRef.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
    updateKnob(touch.clientX, touch.clientY);
  }, [updateKnob]);

  const handleTouchMove = useCallback((e) => {
    for (const touch of e.changedTouches) {
      if (touch.identifier === touchId.current) {
        updateKnob(touch.clientX, touch.clientY);
        break;
      }
    }
  }, [updateKnob]);

  const handleTouchEnd = useCallback((e) => {
    for (const touch of e.changedTouches) {
      if (touch.identifier === touchId.current) {
        touchId.current = null;
        if (knobRef.current) {
          knobRef.current.style.transform = 'translate(0px, 0px)';
        }
        inputRef.current?.setJoystick(0, 0, false);
        break;
      }
    }
  }, [inputRef]);

  // Global touch listeners so dragging outside the joystick still works
  useEffect(() => {
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);
    return () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [handleTouchMove, handleTouchEnd]);

  const R = JOY_RADIUS;
  const K = JOY_KNOB;

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      style={{
        position: 'fixed',
        bottom: 36,
        left: 36,
        width: R * 2,
        height: R * 2,
        borderRadius: '50%',
        background: 'rgba(255,248,232,0.06)',
        border: '1.5px solid rgba(201,169,110,0.15)',
        zIndex: 60,
        touchAction: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'auto',
      }}
    >
      <div
        ref={knobRef}
        style={{
          width: K * 2,
          height: K * 2,
          borderRadius: '50%',
          background: 'rgba(201,169,110,0.25)',
          border: '1px solid rgba(201,169,110,0.35)',
          willChange: 'transform',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
