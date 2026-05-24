/**
 * CottageBackground — full-bleed rainy-cottage scene with two flickering
 * candle glows anchored to the lanterns in the painting.
 *
 * Used as the atmospheric background for the Word Search and Diamond Art
 * screens. Renders fixed-position layers behind everything (zIndex 0), so
 * pages need their own content above it.
 *
 * The two candle positions (9% / 18% for the left copper lantern, 78% / 65%
 * for the right windowsill lantern) were calibrated to land on the actual
 * flame pixels in wordsearchbackgroundone.png.
 */
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
      `}</style>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        backgroundImage: 'url(/wordsearchbackgroundone.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        pointerEvents: 'none',
      }} />
      {/* Darken layer so foreground UI stays readable on top */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
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

function CandleGlow({ left, top, color, size, keyframe, duration }) {
  return (
    <div style={{
      position: 'fixed', left, top,
      width: size, height: size,
      transform: 'translate(-50%, -50%)',
      background: `radial-gradient(circle, ${color} 0%, rgba(255,180,90,0.4) 22%, rgba(255,150,60,0.15) 50%, transparent 75%)`,
      mixBlendMode: 'screen',
      pointerEvents: 'none',
      zIndex: 0,
      filter: 'blur(2px)',
      animation: `${keyframe} ${duration}s ease-in-out infinite`,
    }} />
  );
}
