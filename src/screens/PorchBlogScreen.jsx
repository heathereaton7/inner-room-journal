import { useState, useEffect, useCallback, useRef } from 'react';
import { GFONTS } from '../constants.js';
import { BLOG, BLOG_SERIF, BLOG_SANS } from '../systems/blog.js';

/**
 * PORCH — the atmospheric blog landing (screen A of 3).
 *
 * The whole porch photo (porchforreal.png) is shown un-cropped with live rain in
 * the open-air window view and flickering candle/lantern glow. There are TWO tap
 * targets, each marked by a soft pulsing glow + floating label:
 *   • the cabin DOOR on the left  → "step inside" (sign-in gate / cabin)
 *   • the "My Blog" BOOK on the table → opens the readable bulletin board (B)
 *
 *   porch (A) → board close-up (B) → post (C)
 *
 * Fixed image so the door/book hotspots stay aligned (no seasonal swap here).
 */

const PORCH_IMG = '/porchforreal.png';

// Hotspot boxes as fractions of the displayed (contained) photo.
const DOOR = { left: 0.045, top: 0.125, width: 0.275, height: 0.470 };
const BOOK = { left: 0.520, top: 0.700, width: 0.300, height: 0.140 };

// Rain falls only in the open-air window view on the right. Fractions of photo.
const RAIN_BOX = { left: 0.55, top: 0.115, width: 0.45, height: 0.42 };

// Flame sources in porchforreal.png. Fractions of the displayed image.
const CANDLES = [
  { x: 0.600, y: 0.345, r: 0.060, base: 0.60, amp: 0.34 }, // hanging lantern (center)
  { x: 0.275, y: 0.135, r: 0.055, base: 0.50, amp: 0.14 }, // wall lamp over the door
  { x: 0.135, y: 0.420, r: 0.045, base: 0.55, amp: 0.30 }, // candle in the door window
  { x: 0.775, y: 0.715, r: 0.045, base: 0.60, amp: 0.32 }, // candle on the coffee table
  { x: 0.075, y: 0.875, r: 0.050, base: 0.55, amp: 0.30 }, // lantern on the floor
];

export default function PorchBlogScreen({ onOpenBoard, onEnter }) {
  const weather = 'rain'; // rainy-night porch scene
  const wrapRef = useRef(null);
  const imgRef = useRef(null);
  const canvasRef = useRef(null);
  const rainRef = useRef([]);
  const candleRef = useRef([]);
  const [imgRect, setImgRect] = useState(null); // displayed photo rect, px

  // Map fractions onto the on-screen rectangle of the contained image.
  const recompute = useCallback(() => {
    const wrap = wrapRef.current;
    const img = imgRef.current;
    if (!wrap) return;
    const cw = wrap.clientWidth, ch = wrap.clientHeight;
    const natW = img?.naturalWidth || 1083;
    const natH = img?.naturalHeight || 1445;
    const ratio = natW / natH;
    let dispW, dispH, offX, offY;
    if (cw / ch > ratio) { dispH = ch; dispW = ch * ratio; offX = (cw - dispW) / 2; offY = 0; }
    else { dispW = cw; dispH = cw / ratio; offX = 0; offY = (ch - dispH) / 2; }
    setImgRect({ left: offX, top: offY, width: dispW, height: dispH });
  }, []);

  useEffect(() => {
    recompute();
    window.addEventListener('resize', recompute);
    return () => window.removeEventListener('resize', recompute);
  }, [recompute]);

  // Rain in the open-air view + flickering flames, painted over the photo.
  useEffect(() => {
    if (!imgRect) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = imgRect.width, H = imgRect.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (!rainRef.current.length) {
      rainRef.current = Array.from({ length: 95 }, () => ({
        x: Math.random(), y: Math.random(),
        len: 0.03 + Math.random() * 0.05,
        sp: 0.010 + Math.random() * 0.016,
        w: Math.random() < 0.5 ? 1 : 1.4,
      }));
    }
    if (!candleRef.current.length) {
      candleRef.current = CANDLES.map(() => ({ phase: Math.random() * Math.PI * 2, speed: 4 + Math.random() * 3 }));
    }

    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf;
    const draw = (t) => {
      ctx.clearRect(0, 0, W, H);
      // rain (only within the open-air box)
      const rb = { x: RAIN_BOX.left * W, y: RAIN_BOX.top * H, w: RAIN_BOX.width * W, h: RAIN_BOX.height * H };
      ctx.strokeStyle = 'rgba(190,205,225,0.32)';
      ctx.lineCap = 'round';
      for (const d of rainRef.current) {
        if (!reduce) { d.y += d.sp; if (d.y > 1) { d.y = -d.len; d.x = Math.random(); } }
        const px = rb.x + d.x * rb.w;
        const py = rb.y + d.y * rb.h;
        const ll = d.len * rb.h;
        ctx.lineWidth = d.w;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px - ll * 0.16, py + ll);
        ctx.stroke();
      }
      // flames (additive warm glow)
      ctx.globalCompositeOperation = 'lighter';
      const tt = t / 1000;
      CANDLES.forEach((c, i) => {
        const s = candleRef.current[i];
        let flick = c.base + Math.sin(tt * s.speed + s.phase) * c.amp * 0.5 + (reduce ? 0 : (Math.random() - 0.5) * c.amp * 0.5);
        flick = Math.max(0.15, Math.min(1, flick));
        const cx = c.x * W, cy = c.y * H, rad = c.r * Math.min(W, H) * 2.2;
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
        g.addColorStop(0, `rgba(255,205,120,${0.55 * flick})`);
        g.addColorStop(0.45, `rgba(255,160,70,${0.20 * flick})`);
        g.addColorStop(1, 'rgba(255,140,50,0)');
        ctx.fillStyle = g;
        ctx.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);
      });
      ctx.globalCompositeOperation = 'source-over';
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [imgRect, weather]);

  const box = (f) => imgRect && ({
    left: imgRect.left + f.left * imgRect.width,
    top: imgRect.top + f.top * imgRect.height,
    width: f.width * imgRect.width,
    height: f.height * imgRect.height,
  });
  const doorBox = box(DOOR);
  const bookBox = box(BOOK);

  return (
    <div ref={wrapRef} style={{ position: 'fixed', inset: 0, overflow: 'hidden', fontFamily: BLOG_SANS, background: '#15110d' }}>
      <style>{GFONTS}</style>
      <style>{`
        @keyframes blogFadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes porchHotspotPulse {
          0%,100% { box-shadow: 0 0 0 1px rgba(255,221,150,0.30), 0 0 22px 4px rgba(255,196,110,0.16); }
          50%     { box-shadow: 0 0 0 1px rgba(255,221,150,0.55), 0 0 34px 10px rgba(255,196,110,0.36); }
        }
        @keyframes porchPillFloat { 0%,100% { transform: translate(-50%,0); } 50% { transform: translate(-50%,-3px); } }
      `}</style>

      {/* Blurred fill so any letterbox bars read as part of the scene */}
      <img src={PORCH_IMG} alt="" draggable={false} style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        objectFit: 'cover', filter: 'blur(22px) brightness(0.45)',
        transform: 'scale(1.1)', userSelect: 'none', pointerEvents: 'none',
      }} />

      {/* The whole porch photo, un-cropped */}
      <img ref={imgRef} src={PORCH_IMG} alt="A cozy cabin porch on a rainy night, with a door on the left and a journal on the table" draggable={false}
        onLoad={recompute}
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: 'contain', objectPosition: 'center', userSelect: 'none', pointerEvents: 'none',
          filter: 'brightness(1.18) contrast(1.02)',
        }} />

      {/* Light vignette only at top + bottom for control legibility */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'linear-gradient(to bottom, rgba(10,8,6,0.55) 0%, rgba(10,8,6,0) 16%, rgba(10,8,6,0) 82%, rgba(10,8,6,0.55) 100%)',
      }} />

      {/* Live rain + candle flicker, aligned to the photo */}
      {imgRect && (
        <canvas ref={canvasRef} style={{
          position: 'absolute', left: imgRect.left, top: imgRect.top,
          width: imgRect.width, height: imgRect.height,
          zIndex: 4, pointerEvents: 'none',
        }} />
      )}

      {/* DOOR → step inside (sign-in gate / cabin) */}
      {doorBox && (
        <button
          onClick={onEnter}
          aria-label="Step inside the cabin"
          style={{
            position: 'absolute',
            left: doorBox.left, top: doorBox.top, width: doorBox.width, height: doorBox.height,
            zIndex: 12, cursor: 'pointer', background: 'transparent', borderRadius: 10,
            border: '1px solid rgba(255,221,150,0.0)',
            animation: 'porchHotspotPulse 3.4s ease-in-out infinite',
            padding: 0,
          }}
        >
          <span style={{
            position: 'absolute', left: '50%', bottom: -14, transform: 'translateX(-50%)',
            whiteSpace: 'nowrap', animation: 'porchPillFloat 3.4s ease-in-out infinite',
            background: 'rgba(20,16,12,0.62)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
            border: '1px solid rgba(250,248,244,0.28)', borderRadius: 999,
            padding: '5px 12px', color: BLOG.cream, fontFamily: BLOG_SANS,
            fontSize: '0.64rem', letterSpacing: '0.04em', boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          }}>Step inside →</span>
        </button>
      )}

      {/* BOOK → open the readable blog board */}
      {bookBox && (
        <button
          onClick={onOpenBoard}
          aria-label="Read my blog"
          style={{
            position: 'absolute',
            left: bookBox.left, top: bookBox.top, width: bookBox.width, height: bookBox.height,
            zIndex: 12, cursor: 'pointer', background: 'transparent', borderRadius: 8,
            border: '1px solid rgba(255,221,150,0.0)',
            animation: 'porchHotspotPulse 3.0s ease-in-out infinite',
            padding: 0,
          }}
        >
          <span style={{
            position: 'absolute', left: '50%', top: -16, transform: 'translateX(-50%)',
            whiteSpace: 'nowrap', animation: 'porchPillFloat 3.0s ease-in-out infinite',
            background: 'rgba(20,16,12,0.62)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
            border: '1px solid rgba(250,248,244,0.28)', borderRadius: 999,
            padding: '5px 12px', color: BLOG.cream, fontFamily: BLOG_SANS,
            fontSize: '0.64rem', letterSpacing: '0.04em', boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          }}>Read my blog →</span>
        </button>
      )}
    </div>
  );
}
