import { useMemo } from 'react';

/**
 * CottageBackground — full-bleed rainy-cottage scene with two flickering
 * candle glows anchored to the lanterns in the painting, plus animated
 * rain falling on the arched window.
 *
 * Used as the atmospheric background for the Word Search and Diamond Art
 * screens. Renders fixed-position layers behind everything (zIndex 0), so
 * pages need their own content above it.
 *
 * The two candle positions (9% / 18% for the left copper lantern, 78% / 65%
 * for the right windowsill lantern) were calibrated to land on the actual
 * flame pixels in wordsearchbackgroundone.png.
 *
 * WINDOW_RAIN box is calibrated (viewport %) to sit over just the glass of
 * the arched window so raindrops only fall there, not on the cozy interior.
 */
const WINDOW_RAIN = { left: '17%', top: '2%', width: '82%', height: '66%' };

export default function CottageBackground() {
  return (
    <>
      <style>{`
        @keyframes cottage-flicker-a {
          0%, 100% { opacity: 0.85; transform: translate(-50%, -50%) scale(1); }
          22%      { opacity: 0.74; transform: translate(-50%, -50%) scale(0.98); }
          42%      { opacity: 0.92; transform: translate(-50%, -50%) scale(1.03); }
          63%      { opacity: 0.78; transform: translate(-50%, -50%) scale(0.99); }
          84%      { opacity: 0.88; transform: translate(-50%, -50%) scale(1.02); }
        }
        @keyframes cottage-flicker-b {
          0%, 100% { opacity: 0.78; transform: translate(-50%, -50%) scale(1); }
          19%      { opacity: 0.92; transform: translate(-50%, -50%) scale(1.04); }
          38%      { opacity: 0.68; transform: translate(-50%, -50%) scale(0.97); }
          57%      { opacity: 0.86; transform: translate(-50%, -50%) scale(1.02); }
          78%      { opacity: 0.72; transform: translate(-50%, -50%) scale(0.99); }
        }
        @keyframes window-rain-fall {
          0%   { transform: translateY(-18vh) rotate(9deg); }
          100% { transform: translateY(82vh) rotate(9deg); }
        }
        @keyframes window-glass-drip {
          0%   { transform: translateY(-6%); opacity: 0; }
          12%  { opacity: 0.85; }
          100% { transform: translateY(116%); opacity: 0; }
        }
      `}</style>
      <div style={{
        position: 'fixed', inset: 0, zIndex: -1,
        backgroundImage: 'url(/wordsearchbackgroundone.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        pointerEvents: 'none',
      }} />
      {/* Rain falling on the window glass (between the scene and the darken veil) */}
      <WindowRain />
      {/* Darken layer so foreground UI stays readable on top */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: -1,
        background: 'linear-gradient(180deg, rgba(10,8,6,0.55) 0%, rgba(10,8,6,0.72) 60%, rgba(10,8,6,0.82) 100%)',
        pointerEvents: 'none',
      }} />
      {/* Left-wall copper lantern */}
      <CandleGlow left="9%" top="18%" color="#FFB36A" size={170} keyframe="cottage-flicker-a" duration={6.5} />
      {/* Right windowsill lantern */}
      <CandleGlow left="78%" top="65%" color="#FFC07A" size={180} keyframe="cottage-flicker-b" duration={8.0} />
    </>
  );
}

/**
 * WindowRain — fine sheet of falling rain streaks plus a few slow glass
 * droplets, clipped (overflow:hidden + arched border-radius) to the window
 * region so the effect only appears on the glass.
 */
function WindowRain() {
  const streaks = useMemo(() => Array.from({ length: 70 }, () => ({
    left: Math.random() * 100,
    delay: -(Math.random() * 1.8),
    dur: 0.55 + Math.random() * 0.85,
    len: 9 + Math.random() * 26,
    opacity: 0.12 + Math.random() * 0.34,
  })), []);
  const drips = useMemo(() => Array.from({ length: 7 }, () => ({
    left: 6 + Math.random() * 88,
    delay: -(Math.random() * 7),
    dur: 5 + Math.random() * 5,
    size: 3 + Math.random() * 3,
  })), []);
  return (
    <div style={{
      position: 'fixed',
      left: WINDOW_RAIN.left, top: WINDOW_RAIN.top,
      width: WINDOW_RAIN.width, height: WINDOW_RAIN.height,
      overflow: 'hidden',
      borderRadius: '48% 48% 5% 5% / 30% 30% 4% 4%',
      pointerEvents: 'none',
      zIndex: -1,
    }}>
      {streaks.map((d, i) => (
        <span key={i} style={{
          position: 'absolute',
          left: `${d.left}%`,
          top: 0,
          width: 1.4,
          height: d.len,
          background: 'linear-gradient(to bottom, rgba(205,222,255,0), rgba(205,222,255,0.75))',
          opacity: d.opacity,
          animation: `window-rain-fall ${d.dur}s linear ${d.delay}s infinite`,
          willChange: 'transform',
        }} />
      ))}
      {drips.map((d, i) => (
        <span key={`g${i}`} style={{
          position: 'absolute',
          left: `${d.left}%`,
          top: 0,
          width: d.size,
          height: d.size * 1.5,
          borderRadius: '50% 50% 55% 55%',
          background: 'radial-gradient(circle at 35% 30%, rgba(235,243,255,0.55), rgba(180,200,235,0.25) 60%, transparent 75%)',
          boxShadow: '0 1px 2px rgba(255,255,255,0.18)',
          animation: `window-glass-drip ${d.dur}s ease-in ${d.delay}s infinite`,
          willChange: 'transform, opacity',
        }} />
      ))}
    </div>
  );
}

function CandleGlow({ left, top, color, size, keyframe, duration }) {
  return (
    <div style={{
      position: 'fixed', left, top,
      width: size, height: size,
      transform: 'translate(-50%, -50%)',
      background: `radial-gradient(circle, ${color} 0%, rgba(255,180,90,0.4) 22%, rgba(255,150,60,0.15) 50%, transparent 75%)`,
      mixBlendMode: 'screen',
      pointerEvents: 'none',
      zIndex: -1,
      filter: 'blur(2px)',
      animation: `${keyframe} ${duration}s ease-in-out infinite`,
    }} />
  );
}
