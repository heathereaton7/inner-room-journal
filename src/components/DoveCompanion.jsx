import { useState, useEffect, useRef } from 'react';

/**
 * DoveCompanion — A warm, painted dove that perches on cabin surfaces.
 * Uses a hand-painted PNG asset, color-graded to match the cabin scene.
 *
 * Props:
 *   intensity  — "light"|"moderate"|"heavy"|null
 *   active     — boolean
 *   screen     — "cabin"|"garden"|"check-in"
 */

// Grounded on real surfaces in the cabin scene
const PERCHES = {
  cabin: [
    { bottom: "36%", right: "10%" }, // desk edge near lamp
    { bottom: "50%", right: "4%"  }, // window sill
  ],
  garden: [
    { top: "20%", left: "12%" },
  ],
  "check-in": [
    { top: "6%", right: "10%" },
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

  const warmth = intensity === "heavy" ? 0.75 : intensity === "moderate" ? 0.88 : 1;
  const breathSpeed = intensity === "heavy" ? "5s" : intensity === "moderate" ? "3.5s" : "2.8s";

  // Appear naturally
  useEffect(() => {
    const delay = active ? 1200 + Math.random() * 1500 : 3500 + Math.random() * 4000;
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [active, screen]);

  // Hop to new perch
  useEffect(() => {
    if (!visible || perches.length <= 1) return;
    timerRef.current = setInterval(() => {
      setPerchIdx(p => (p + 1) % perches.length);
    }, 18000 + Math.random() * 12000);
    return () => clearInterval(timerRef.current);
  }, [visible, perches.length]);

  // Rare message
  useEffect(() => {
    if (!visible) return;
    const shouldMsg = intensity === "heavy" || (active && Math.random() < 0.2);
    if (!shouldMsg) return;
    msgRef.current = setTimeout(() => {
      setMessage(MESSAGES[Math.floor(Math.random() * MESSAGES.length)]);
      setTimeout(() => setMessage(null), 4500);
    }, 8000 + Math.random() * 6000);
    return () => clearTimeout(msgRef.current);
  }, [visible, intensity, active]);

  if (!visible) return null;

  return (
    <div style={{
      position: "fixed", ...perch, zIndex: 50, pointerEvents: "none",
      transition: "all 3s cubic-bezier(0.25,0.46,0.45,0.94)",
    }}>
      <div style={{
        position: "relative", width: 120, height: 120,
        animation: `doveBreath ${breathSpeed} ease-in-out infinite`,
      }}>
        {/* The dove — painted asset, color-graded to match cabin */}
        <img
          src="/dove-companion.png"
          alt=""
          width="120" height="120"
          style={{
            display: "block",
            opacity: warmth,
            filter: [
              "sepia(0.12)",
              "saturate(0.8)",
              `brightness(${0.7 + warmth * 0.18})`,
              "hue-rotate(-4deg)",
              "contrast(0.95)",
              "drop-shadow(0 4px 8px rgba(8,4,0,0.4))",
            ].join(" "),
            transition: "opacity 2s ease, filter 2s ease",
          }}
        />

        {/* Ground shadow — soft ellipse beneath the bird */}
        <div style={{
          position: "absolute",
          bottom: 2, left: "50%", transform: "translateX(-50%)",
          width: 70, height: 10,
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(8,4,0,0.25) 0%, transparent 70%)",
          filter: "blur(3px)",
          pointerEvents: "none",
        }} />
      </div>

      {/* Message */}
      {message && (
        <div style={{
          position: "absolute", top: -18, left: "50%", transform: "translateX(-50%)",
          whiteSpace: "nowrap",
          fontFamily: "'Cormorant Garamond','Georgia',serif",
          fontStyle: "italic", fontSize: "0.66rem",
          color: "rgba(255,248,232,0.35)",
          textShadow: "0 1px 8px rgba(0,0,0,0.7)",
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
