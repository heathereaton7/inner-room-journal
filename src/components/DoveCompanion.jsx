import { useState, useEffect, useRef } from 'react';

/**
 * DoveCompanion — A soft glowing dove that appears as a gentle presence.
 * Not a pet. Not gamified. Just a quiet companion.
 *
 * Props:
 *   intensity  — "light"|"moderate"|"heavy"|null — affects glow + movement
 *   active     — boolean — user has been interacting recently
 *   screen     — "cabin"|"garden"|"check-in" — determines placement
 */

const POSITIONS = {
  cabin:     [{ top: "18%", right: "22%" }, { top: "32%", left: "8%" }, { top: "14%", right: "34%" }],
  garden:    [{ top: "12%", left: "20%" }, { top: "22%", right: "15%" }, { top: "8%", left: "40%" }],
  "check-in": [{ top: "6%", right: "18%" }],
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
  const [posIdx, setPosIdx] = useState(0);
  const [message, setMessage] = useState(null);
  const timerRef = useRef(null);
  const msgTimerRef = useRef(null);

  const positions = POSITIONS[screen] || POSITIONS.cabin;
  const pos = positions[posIdx % positions.length];

  // Decide glow and speed based on intensity
  const glow = intensity === "heavy" ? 0.25 : intensity === "moderate" ? 0.45 : 0.65;
  const animSpeed = intensity === "heavy" ? "6s" : intensity === "moderate" ? "4s" : "3s";
  const doveScale = intensity === "heavy" ? 0.9 : 1;

  // Appear/disappear based on activity
  useEffect(() => {
    // Show after a short delay (feels like it arrives naturally)
    const delay = active ? 1500 + Math.random() * 2000 : 4000 + Math.random() * 6000;
    const showTimer = setTimeout(() => setVisible(true), delay);

    return () => clearTimeout(showTimer);
  }, [active, screen]);

  // Occasionally reposition (gentle movement)
  useEffect(() => {
    if (!visible || positions.length <= 1) return;
    timerRef.current = setInterval(() => {
      setPosIdx(prev => (prev + 1) % positions.length);
    }, 12000 + Math.random() * 8000);
    return () => clearInterval(timerRef.current);
  }, [visible, positions.length]);

  // Rare message (only after check-in or when intensity is heavy)
  useEffect(() => {
    if (!visible) return;
    const shouldMsg = intensity === "heavy" || (active && Math.random() < 0.3);
    if (!shouldMsg) return;

    msgTimerRef.current = setTimeout(() => {
      setMessage(MESSAGES[Math.floor(Math.random() * MESSAGES.length)]);
      setTimeout(() => setMessage(null), 4000);
    }, 5000 + Math.random() * 5000);

    return () => clearTimeout(msgTimerRef.current);
  }, [visible, intensity, active]);

  if (!visible) return null;

  return (
    <div style={{
      position: "fixed",
      ...pos,
      zIndex: 50,
      pointerEvents: "none",
      transition: "all 2.5s cubic-bezier(0.25,0.46,0.45,0.94)",
      opacity: glow,
      transform: `scale(${doveScale})`,
    }}>
      {/* Dove body — simple SVG silhouette with glow */}
      <div style={{
        position: "relative",
        width: 28,
        height: 28,
        animation: `doveFloat ${animSpeed} ease-in-out infinite`,
      }}>
        <svg viewBox="0 0 32 32" width="28" height="28" fill="none" style={{ filter: `drop-shadow(0 0 8px rgba(255,240,200,${glow * 0.6}))` }}>
          {/* Simplified dove shape */}
          <path d="M16 4c-2 0-4 1-5 3-1 2-1 4 0 6l-5 4c-1 1-1 2 0 2l6-1c1 2 3 3 5 3s4-1 5-3l6 1c1 0 1-1 0-2l-5-4c1-2 1-4 0-6-1-2-3-3-5-3z"
            fill={`rgba(255,248,232,${0.4 + glow * 0.4})`}
            stroke={`rgba(255,240,200,${0.15 + glow * 0.2})`}
            strokeWidth="0.5"
          />
          {/* Wing hint */}
          <path d="M10 13c-2-1-3 0-3 1s2 2 4 2"
            fill="none" stroke={`rgba(255,248,232,${0.2 + glow * 0.2})`} strokeWidth="0.5"
          />
          <path d="M22 13c2-1 3 0 3 1s-2 2-4 2"
            fill="none" stroke={`rgba(255,248,232,${0.2 + glow * 0.2})`} strokeWidth="0.5"
          />
        </svg>

        {/* Soft ambient glow behind the dove */}
        <div style={{
          position: "absolute",
          top: "50%", left: "50%",
          transform: "translate(-50%,-50%)",
          width: 40 + glow * 20,
          height: 40 + glow * 20,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(255,240,200,${0.06 + glow * 0.08}) 0%, transparent 70%)`,
          animation: `candleGlowPulse ${animSpeed} ease-in-out infinite`,
          pointerEvents: "none",
        }} />
      </div>

      {/* Rare message */}
      {message && (
        <div style={{
          position: "absolute",
          top: -20,
          left: "50%",
          transform: "translateX(-50%)",
          whiteSpace: "nowrap",
          fontFamily: "'Cormorant Garamond','Georgia',serif",
          fontStyle: "italic",
          fontSize: "0.62rem",
          color: "rgba(255,248,232,0.3)",
          textShadow: "0 1px 6px rgba(0,0,0,0.5)",
          animation: "fadeUp .8s ease both",
          letterSpacing: "0.03em",
        }}>
          {message}
        </div>
      )}

      {/* Float animation keyframes */}
      <style>{`
        @keyframes doveFloat {
          0%, 100% { transform: translateY(0px); }
          30% { transform: translateY(-3px) rotate(1deg); }
          70% { transform: translateY(2px) rotate(-0.5deg); }
        }
      `}</style>
    </div>
  );
}
