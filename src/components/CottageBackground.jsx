import { useEffect, useRef } from 'react';

/**
 * CottageBackground — full-bleed rainy-cottage scene with two flickering
 * candle glows anchored to the lanterns in the painting, plus canvas
 * rain falling outside the arched window.
 *
 * Used as the atmospheric background for the Word Search and Diamond Art
 * screens. Renders fixed-position layers behind everything (zIndex 0), so
 * pages need their own content above it.
 *
 * The two candle positions (9% / 18% for the left copper lantern, 78% / 65%
 * for the right windowsill lantern) were calibrated to land on the actual
 * flame pixels in wordsearchbackgroundone.png.
 *
 * WINDOW_RAIN box (viewport %) frames just the glass of the arched window so
 * the rain only falls there, not on the cozy interior.
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
      `}</style>
      <div style={{
        position: 'fixed', inset: 0, zIndex: -1,
        backgroundImage: 'url(/wordsearchbackgroundone.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        pointerEvents: 'none',
      }} />
      {/* Rain falling outside the window glass (behind the darken veil) */}
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
 * WindowRain — canvas particle rain, clipped to the arched window region.
 *
 * Streaks fall fast on a slight diagonal. Three depth layers give parallax:
 * the near layer is long / bright / fast, the far layer is short / faint /
 * slow. Each streak is a tapered line (bright head, fading tail) so it reads
 * as motion blur rather than a static dash. Recycled to the top once it
 * passes the bottom of the window.
 */
function WindowRain() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Slight diagonal: wind blows streaks to the left as they fall.
    const ANGLE = -0.22; // radians from vertical
    const SIN = Math.sin(ANGLE);
    const COS = Math.cos(ANGLE);

    // Three depth layers — [count factor, speed px/s, length px, width, alpha]
    const LAYERS = [
      { speed: 1500, len: 34, width: 1.8, alpha: 0.55 }, // near
      { speed: 1050, len: 24, width: 1.3, alpha: 0.40 }, // mid
      { speed: 720,  len: 16, width: 0.9, alpha: 0.26 }, // far
    ];

    let w = 0, h = 0, dpr = 1;
    let drops = [];
    let raf = 0;
    let last = performance.now();

    function rand(a, b) { return a + Math.random() * (b - a); }

    function spawn(d, atTop) {
      const layer = LAYERS[(Math.random() * LAYERS.length) | 0];
      d.x = rand(-h * 0.3, w);          // start wide so the diagonal still fills the left edge
      d.y = atTop ? rand(-h, 0) : rand(0, h);
      d.speed = layer.speed * rand(0.85, 1.15);
      d.len = layer.len * rand(0.8, 1.2);
      d.width = layer.width;
      d.alpha = layer.alpha * rand(0.7, 1.1);
      return d;
    }

    function resize() {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width; h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Density scales with area (~1 streak per 1100 px²), capped for perf.
      const count = Math.min(360, Math.max(80, Math.round((w * h) / 1100)));
      drops = Array.from({ length: count }, () => spawn({}, false));
    }

    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      ctx.clearRect(0, 0, w, h);
      ctx.lineCap = 'round';
      for (const d of drops) {
        // advance along the fall direction
        d.x += d.speed * SIN * dt;
        d.y += d.speed * COS * dt;
        if (d.y - d.len > h || d.x + d.len < 0) { spawn(d, true); continue; }
        const tailX = d.x - SIN * d.len;
        const tailY = d.y - COS * d.len;
        const g = ctx.createLinearGradient(tailX, tailY, d.x, d.y);
        g.addColorStop(0, 'rgba(200,220,255,0)');
        g.addColorStop(1, `rgba(210,228,255,${d.alpha})`);
        ctx.strokeStyle = g;
        ctx.lineWidth = d.width;
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(d.x, d.y);
        ctx.stroke();
      }
      raf = requestAnimationFrame(frame);
    }

    resize();
    window.addEventListener('resize', resize);
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

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
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
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
