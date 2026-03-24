import { useState, useEffect, useRef } from 'react';

/**
 * DoveCompanion — A soft, cozy dove that perches on the window ledge or desk.
 * Uses a PNG sprite with warm cabin-lit styling.
 *
 * Props:
 *   intensity  — "light"|"moderate"|"heavy"|null
 *   active     — boolean — user has been interacting
 *   screen     — "cabin"|"garden"|"check-in"
 */

// Grounded perch positions — window ledge, desk edge (not floating)
const PERCHES = {
  cabin: [
    { bottom: "42%", right: "18%"  }, // window ledge right side
    { bottom: "46%", right: "32%"  }, // window ledge left side
  ],
  garden: [
    { top: "20%", left: "16%" },
  ],
  "check-in": [
    { top: "8%", right: "16%" },
  ],
};

const MESSAGES = [
  "I'm here.",
  "You're not alone in this.",
  "I'll stay with you.",
  "Rest when you need to.",
  "You are seen.",
];

export default function DoveCompanion({ intensity, active, screen }) {
  const [visible, setVisible] = useState(false);
  const [perchIdx, setPerchIdx] = useState(0);
  const [message, setMessage] = useState(null);
  const timerRef = useRef(null);
  const msgRef = useRef(null);

  const perches = PERCHES[screen] || PERCHES.cabin;
  const perch = perches[perchIdx % perches.length];

  // Intensity affects warmth and animation
  const warmth = intensity === "heavy" ? 0.7 : intensity === "moderate" ? 0.85 : 1;
  const breathSpeed = intensity === "heavy" ? "5s" : intensity === "moderate" ? "3.5s" : "2.8s";

  // Appear naturally after a delay
  useEffect(() => {
    const delay = active ? 1200 + Math.random() * 1500 : 3500 + Math.random() * 4000;
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [active, screen]);

  // Hop to a new perch occasionally
  useEffect(() => {
    if (!visible || perches.length <= 1) return;
    timerRef.current = setInterval(() => {
      setPerchIdx(p => (p + 1) % perches.length);
    }, 16000 + Math.random() * 10000);
    return () => clearInterval(timerRef.current);
  }, [visible, perches.length]);

  // Rare comforting message
  useEffect(() => {
    if (!visible) return;
    const shouldMsg = intensity === "heavy" || (active && Math.random() < 0.2);
    if (!shouldMsg) return;
    msgRef.current = setTimeout(() => {
      setMessage(MESSAGES[Math.floor(Math.random() * MESSAGES.length)]);
      setTimeout(() => setMessage(null), 4500);
    }, 7000 + Math.random() * 5000);
    return () => clearTimeout(msgRef.current);
  }, [visible, intensity, active]);

  if (!visible) return null;

  return (
    <div style={{
      position: "fixed", ...perch, zIndex: 50, pointerEvents: "none",
      transition: "all 2.5s cubic-bezier(0.25,0.46,0.45,0.94)",
    }}>
      {/* Dove image — warm-lit PNG sprite */}
      <div style={{
        position: "relative",
        width: 72, height: 72,
        animation: `doveBreath ${breathSpeed} ease-in-out infinite`,
      }}>
        <img
          src="/dove-companion.png"
          alt=""
          width="72" height="72"
          style={{
            display: "block",
            opacity: warmth,
            filter: `drop-shadow(0 2px 4px rgba(0,0,0,0.2))`,
            transition: "opacity 1.5s ease",
            imageRendering: "auto",
          }}
        />
      </div>

      {/* Message */}
      {message && (
        <div style={{
          position: "absolute", top: -16, left: "50%", transform: "translateX(-50%)",
          whiteSpace: "nowrap",
          fontFamily: "'Cormorant Garamond','Georgia',serif",
          fontStyle: "italic", fontSize: "0.66rem",
          color: "rgba(255,248,232,0.4)",
          textShadow: "0 1px 8px rgba(0,0,0,0.6)",
          animation: "fadeUp .8s ease both",
          letterSpacing: "0.03em",
        }}>
          {message}
        </div>
      )}

      <style>{`
        @keyframes doveBreath {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-1.5px) scale(1.015); }
        }
      `}</style>
    </div>
  );
}
