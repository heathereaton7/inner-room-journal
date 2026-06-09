import { useEffect, useRef, useState } from 'react';
import { ROOM_THEMES, DEFAULT_ROOM_THEME, ROOM_THEME_KEY, ROOM_THEME_EVENT, getRoomTheme } from '../systems/roomThemes.js';

/**
 * CottageBackground — full-bleed cozy scene used as the atmospheric backdrop
 * for the Word Search, Diamond Art and meditation screens.
 *
 * The active scene is driven by the selected "Room Style" (see roomThemes.js).
 * Each theme supplies the scene image plus weather over the window glass and
 * flickering candle glows anchored to the lanterns in the painting.
 *
 * Renders fixed-position layers behind everything (zIndex -1), so pages need
 * their own content above it. Listens for the ROOM_THEME_EVENT so swapping the
 * room in the menu re-renders the backdrop live.
 */
function useRoomTheme() {
  const read = () => {
    try {
      const raw = localStorage.getItem(ROOM_THEME_KEY);
      const id = raw ? JSON.parse(raw) : DEFAULT_ROOM_THEME;
      return getRoomTheme(id);
    } catch {
      return getRoomTheme(DEFAULT_ROOM_THEME);
    }
  };
  const [theme, setTheme] = useState(read);
  useEffect(() => {
    const h = () => setTheme(read());
    window.addEventListener(ROOM_THEME_EVENT, h);
    window.addEventListener('storage', h);
    return () => {
      window.removeEventListener(ROOM_THEME_EVENT, h);
      window.removeEventListener('storage', h);
    };
  }, []);
  return theme;
}

export default function CottageBackground() {
  const theme = useRoomTheme();
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
        backgroundImage: `url(${theme.src})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        pointerEvents: 'none',
      }} />
      {/* Weather falling outside the window glass (behind the darken veil) */}
      {theme.weather && theme.weather !== 'none' && theme.window && (
        <WindowWeather mode={theme.weather} window={theme.window} />
      )}
      {/* Darken layer so foreground UI stays readable on top */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: -1,
        background: 'linear-gradient(180deg, rgba(10,8,6,0.55) 0%, rgba(10,8,6,0.72) 60%, rgba(10,8,6,0.82) 100%)',
        pointerEvents: 'none',
      }} />
      {(theme.candles || []).map((c, i) => (
        <CandleGlow key={i} {...c} keyframe={i % 2 ? 'cottage-flicker-b' : 'cottage-flicker-a'} />
      ))}
    </>
  );
}

/**
 * WindowWeather — canvas particle weather, clipped to the arched window region.
 *
 * mode='rain': fast diagonal streaks with motion-blur tails, three depth layers.
 * mode='snow': slow round flakes drifting on a gentle sine sway, three depth
 *              layers (near flakes large / bright / fast, far flakes tiny / faint).
 * Particles recycle to the top once they leave the window.
 */
function WindowWeather({ mode, window: win }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const isSnow = mode === 'snow';
    const isPetals = mode === 'petals';
    const isLeaves = mode === 'leaves';
    const isFalling = isPetals || isLeaves; // rotating ellipse particles (petals/leaves)
    const isDrift = isSnow || isFalling; // gravity-light particles that sway/drift

    // Rain: slight wind to the left. Drift: nearly straight down (leaves drift more).
    const ANGLE = isLeaves ? -0.12 : isDrift ? -0.05 : -0.22;
    const SIN = Math.sin(ANGLE);
    const COS = Math.cos(ANGLE);

    // Soft blossom tints for petals (pinks + cream)
    const PETAL_COLORS = ['255,214,224', '255,228,236', '250,240,245', '255,205,220'];
    // Warm autumn tints for falling leaves
    const LEAF_COLORS = ['198,93,38', '214,128,46', '166,68,38', '184,108,42', '150,86,44'];
    const PALETTE = isLeaves ? LEAF_COLORS : PETAL_COLORS;

    // Three depth layers — [speed px/s, size px, alpha]
    const LAYERS = isLeaves
      ? [
          { speed: 110, len: 8.0, width: 0, alpha: 0.9 }, // near leaf
          { speed: 74,  len: 5.5, width: 0, alpha: 0.7 }, // mid
          { speed: 46,  len: 3.6, width: 0, alpha: 0.5 }, // far
        ]
      : isPetals
      ? [
          { speed: 95, len: 5.5, width: 0, alpha: 0.85 }, // near petal
          { speed: 62, len: 3.8, width: 0, alpha: 0.6 },  // mid
          { speed: 38, len: 2.4, width: 0, alpha: 0.4 },  // far
        ]
      : isSnow
      ? [
          { speed: 70,  len: 3.4, width: 0, alpha: 0.85 }, // near flake
          { speed: 48,  len: 2.3, width: 0, alpha: 0.6 },  // mid
          { speed: 30,  len: 1.4, width: 0, alpha: 0.4 },  // far
        ]
      : [
          { speed: 1500, len: 34, width: 1.8, alpha: 0.55 }, // near
          { speed: 1050, len: 24, width: 1.3, alpha: 0.40 }, // mid
          { speed: 720,  len: 16, width: 0.9, alpha: 0.26 }, // far
        ];

    let w = 0, h = 0, dpr = 1;
    let parts = [];
    let raf = 0;
    let last = performance.now();

    function rand(a, b) { return a + Math.random() * (b - a); }

    function spawn(d, atTop) {
      const layer = LAYERS[(Math.random() * LAYERS.length) | 0];
      d.x = rand(-h * 0.3, w);
      d.y = atTop ? rand(-h * 0.2, 0) : rand(0, h);
      d.speed = layer.speed * rand(0.85, 1.15);
      d.len = layer.len * rand(0.8, 1.2);
      d.width = layer.width;
      d.alpha = layer.alpha * rand(0.7, 1.1);
      // drift sway (snow + petals + leaves)
      d.sway = rand(0.3, 1.0) * (isLeaves ? 2.2 : isPetals ? 1.6 : 1);
      d.swaySpeed = rand(0.6, 1.6);
      d.phase = rand(0, Math.PI * 2);
      // falling-particle rotation + shape
      d.spin = rand(-1.4, 1.4) * (isLeaves ? 1.5 : 1);
      d.rot = rand(0, Math.PI * 2);
      d.color = PALETTE[(Math.random() * PALETTE.length) | 0];
      return d;
    }

    function resize() {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width; h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const density = isLeaves ? 9000 : isPetals ? 6000 : isSnow ? 4200 : 1100;
      const cap = isLeaves ? 90 : isPetals ? 150 : isSnow ? 220 : 360;
      const count = Math.min(cap, Math.max(60, Math.round((w * h) / density)));
      parts = Array.from({ length: count }, () => spawn({}, false));
    }

    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      ctx.clearRect(0, 0, w, h);
      ctx.lineCap = 'round';
      for (const d of parts) {
        d.y += d.speed * COS * dt;
        if (isDrift) {
          d.phase += d.swaySpeed * dt;
          d.x += (Math.sin(d.phase) * d.sway + d.speed * SIN * 0.02) * dt * 30;
          if (isFalling) d.rot += d.spin * dt;
        } else {
          d.x += d.speed * SIN * dt;
        }
        if (d.y - d.len > h || d.x + d.len < 0 || d.x - d.len > w) { spawn(d, true); continue; }
        if (isFalling) {
          ctx.save();
          ctx.translate(d.x, d.y);
          ctx.rotate(d.rot);
          ctx.beginPath();
          ctx.ellipse(0, 0, d.len, d.len * (isLeaves ? 0.42 : 0.55), 0, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${d.color},${d.alpha})`;
          ctx.fill();
          ctx.restore();
        } else if (isSnow) {
          ctx.beginPath();
          ctx.arc(d.x, d.y, d.len, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(245,250,255,${d.alpha})`;
          ctx.fill();
        } else {
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
  }, [mode]);

  return (
    <div style={{
      position: 'fixed',
      left: win.left, top: win.top,
      width: win.width, height: win.height,
      overflow: 'hidden',
      borderRadius: win.radius,
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
