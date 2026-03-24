import { useState, useEffect, useRef } from 'react';

/**
 * DoveCompanion — A soft, cute dove that sits on the window ledge or desk.
 * Not a pet. Not gamified. Just a quiet companion.
 *
 * Props:
 *   intensity  — "light"|"moderate"|"heavy"|null — affects glow + animation
 *   active     — boolean — user has been interacting recently
 *   screen     — "cabin"|"garden"|"check-in" — determines placement
 */

// Fixed perching spots — window ledge, desk edge, shelf
const PERCHES = {
  cabin:      [
    { bottom: "44%", right: "12%"  }, // window ledge right
    { bottom: "48%", right: "28%"  }, // window ledge center
    { bottom: "36%", left: "6%"    }, // near fireplace mantel
  ],
  garden:     [
    { top: "18%", left: "14%"  },
    { top: "24%", right: "10%" },
  ],
  "check-in": [
    { top: "10%", right: "14%" },
  ],
};

const MESSAGES = [
  "I'm here.",
  "You're not alone in this.",
  "I'll stay with you.",
  "Rest when you need to.",
  "You are seen.",
];

// Warm ivory + golden glow palette
const IVORY  = "#FFF6E5";
const BELLY  = "#F5EDD8";
const WING   = "#E8DCC8";
const BEAK   = "#E8A860";
const EYE    = "#3D2B18";
const CHEEK  = "#FFDCA8";
const GLOW   = "#FFDCA8";

export default function DoveCompanion({ intensity, active, screen }) {
  const [visible, setVisible] = useState(false);
  const [perchIdx, setPerchIdx] = useState(0);
  const [message, setMessage] = useState(null);
  const timerRef = useRef(null);
  const msgRef = useRef(null);

  const perches = PERCHES[screen] || PERCHES.cabin;
  const perch = perches[perchIdx % perches.length];

  // Intensity affects glow strength and animation speed
  const glowStrength = intensity === "heavy" ? 0.3 : intensity === "moderate" ? 0.5 : 0.7;
  const bobSpeed = intensity === "heavy" ? "5s" : intensity === "moderate" ? "3.5s" : "2.5s";
  const scale = intensity === "heavy" ? 0.92 : 1;

  // Appear after a natural delay
  useEffect(() => {
    const delay = active ? 1200 + Math.random() * 1500 : 3000 + Math.random() * 5000;
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [active, screen]);

  // Occasionally hop to a new perch
  useEffect(() => {
    if (!visible || perches.length <= 1) return;
    timerRef.current = setInterval(() => {
      setPerchIdx(p => (p + 1) % perches.length);
    }, 14000 + Math.random() * 10000);
    return () => clearInterval(timerRef.current);
  }, [visible, perches.length]);

  // Rare message on heavy days
  useEffect(() => {
    if (!visible) return;
    const shouldMsg = intensity === "heavy" || (active && Math.random() < 0.25);
    if (!shouldMsg) return;
    msgRef.current = setTimeout(() => {
      setMessage(MESSAGES[Math.floor(Math.random() * MESSAGES.length)]);
      setTimeout(() => setMessage(null), 4000);
    }, 6000 + Math.random() * 5000);
    return () => clearTimeout(msgRef.current);
  }, [visible, intensity, active]);

  if (!visible) return null;

  return (
    <div style={{
      position: "fixed", ...perch, zIndex: 50, pointerEvents: "none",
      transition: "all 2s cubic-bezier(0.25,0.46,0.45,0.94)",
      transform: `scale(${scale})`,
    }}>
      {/* Dove SVG — cute round bird with clear silhouette */}
      <div style={{
        position: "relative", width: 36, height: 36,
        animation: `doveIdle ${bobSpeed} ease-in-out infinite`,
        filter: `drop-shadow(0 2px 8px rgba(255,220,168,${glowStrength * 0.5}))`,
      }}>
        <svg viewBox="0 0 48 48" width="36" height="36">
          {/* Outer glow halo */}
          <circle cx="24" cy="24" r="22" fill="none" stroke={GLOW} strokeWidth="0.3" opacity={glowStrength * 0.3} />

          {/* Body — round, soft, slightly bottom-heavy */}
          <ellipse cx="24" cy="26" rx="12" ry="11" fill={IVORY} />

          {/* Belly shading */}
          <ellipse cx="24" cy="29" rx="9" ry="7" fill={BELLY} opacity="0.6" />

          {/* Head — smaller circle overlapping body top */}
          <circle cx="24" cy="16" r="8" fill={IVORY} />

          {/* Cheek blush */}
          <circle cx="20" cy="17.5" r="2.5" fill={CHEEK} opacity="0.35" />
          <circle cx="28" cy="17.5" r="2.5" fill={CHEEK} opacity="0.35" />

          {/* Eye — tiny, warm, expressive */}
          <circle cx="21.5" cy="15" r="1.3" fill={EYE} />
          <circle cx="21.8" cy="14.5" r="0.4" fill="#FFF8E8" /> {/* eye highlight */}

          {/* Beak — small orange triangle */}
          <path d="M25 16.5 L27.5 17.5 L25 18.5 Z" fill={BEAK} />

          {/* Left wing — curved, tucked against body */}
          <path d="M12 24 C8 22, 7 27, 10 30 C12 32, 14 30, 14 28"
            fill={WING} stroke={BELLY} strokeWidth="0.3" />

          {/* Right wing — slightly raised */}
          <path d="M36 24 C40 22, 41 27, 38 30 C36 32, 34 30, 34 28"
            fill={WING} stroke={BELLY} strokeWidth="0.3" />

          {/* Tail — small, upward */}
          <path d="M20 36 C18 40, 22 42, 24 38 C26 42, 30 40, 28 36"
            fill={WING} stroke={BELLY} strokeWidth="0.3" />

          {/* Tiny feet */}
          <line x1="21" y1="37" x2="20" y2="40" stroke="#C4A882" strokeWidth="0.8" strokeLinecap="round" />
          <line x1="27" y1="37" x2="28" y2="40" stroke="#C4A882" strokeWidth="0.8" strokeLinecap="round" />

          {/* Head tuft — tiny feather wisps */}
          <path d="M22 9 C22 7, 24 6, 24 8" fill="none" stroke={IVORY} strokeWidth="0.6" strokeLinecap="round" />
          <path d="M25 9 C25 6.5, 27 7, 26 9" fill="none" stroke={IVORY} strokeWidth="0.5" strokeLinecap="round" />
        </svg>

        {/* Soft ambient glow behind dove */}
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%,-50%)",
          width: 50, height: 50, borderRadius: "50%",
          background: `radial-gradient(circle, rgba(255,220,168,${0.05 + glowStrength * 0.06}) 0%, transparent 70%)`,
          animation: `candleGlowPulse ${bobSpeed} ease-in-out infinite`,
          pointerEvents: "none",
        }} />
      </div>

      {/* Rare message */}
      {message && (
        <div style={{
          position: "absolute", top: -18, left: "50%", transform: "translateX(-50%)",
          whiteSpace: "nowrap",
          fontFamily: "'Cormorant Garamond','Georgia',serif",
          fontStyle: "italic", fontSize: "0.64rem",
          color: "rgba(255,248,232,0.35)",
          textShadow: "0 1px 6px rgba(0,0,0,0.5)",
          animation: "fadeUp .8s ease both",
          letterSpacing: "0.03em",
        }}>
          {message}
        </div>
      )}

      <style>{`
        @keyframes doveIdle {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-2px) rotate(0.5deg); }
          50% { transform: translateY(0px) rotate(0deg); }
          75% { transform: translateY(1px) rotate(-0.3deg); }
        }
      `}</style>
    </div>
  );
}
