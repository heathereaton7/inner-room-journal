import { useState, useEffect, useCallback, useRef } from 'react';
import { GFONTS } from '../constants.js';
import { isBlogOwner } from '../constants.js';
import {
  fetchPublishedPosts, fetchAllPosts, formatPostDate,
  BLOG, BLOG_SERIF, BLOG_SANS,
} from '../systems/blog.js';

/**
 * PORCH BLOG BOARD — the public landing for the blog.
 *
 * The whole porch photo (frontporch.png) is shown un-cropped; published posts
 * are pinned as little paper notes onto the lamp-lit wooden frame that is part
 * of the photo (upper-left wall). Tapping a note opens the full post. The owner
 * sees a "Pin a new note" button + any drafts.
 *
 * Reading is public (works signed-out); writing is owner-only.
 */

// Gentle, deterministic tilt per pin so the board feels hand-pinned (no jitter
// on re-render). Index-based so it's stable.
const TILTS = [-2.5, 1.8, -1.2, 2.4, -2.0, 1.4];
const PINS = ['#C0413B', '#5E7560', '#A99779', '#C8A39B', '#7E6B97', '#C9A96E'];

// The wooden frame inside frontporch.png, as fractions of the displayed image.
// Notes are pinned within this rectangle so they sit on the real board.
const FRAME = { left: 0.115, top: 0.165, width: 0.275, height: 0.355 };

// Where rain falls in the photo — only the open-air view beyond the porch
// (the covered left side stays dry). Fractions of the displayed image.
const RAIN_BOX = { left: 0.45, top: 0.04, width: 0.55, height: 0.47 };

// Flame sources in the photo (hanging lantern, table candle, floor lantern, and
// the steadier wall lamp over the board). Fractions of the displayed image.
const CANDLES = [
  { x: 0.585, y: 0.330, r: 0.070, base: 0.62, amp: 0.34 }, // hanging lantern (center)
  { x: 0.905, y: 0.675, r: 0.055, base: 0.60, amp: 0.34 }, // candle on the side table
  { x: 0.095, y: 0.860, r: 0.060, base: 0.55, amp: 0.32 }, // lantern on the floor
  { x: 0.235, y: 0.155, r: 0.075, base: 0.50, amp: 0.12 }, // wall lamp over the board
];

export default function PorchBlogScreen({ user, onOpenPost, onWrite, onBack }) {
  const [posts, setPosts] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDrafts, setShowDrafts] = useState(false);
  const owner = isBlogOwner(user);

  const wrapRef = useRef(null);
  const imgRef = useRef(null);
  const canvasRef = useRef(null);
  const rainRef = useRef([]);
  const candleRef = useRef([]);
  const [frameBox, setFrameBox] = useState(null); // {left,top,width,height} px
  const [imgRect, setImgRect] = useState(null);    // displayed photo rect, px

  // Map fractions onto the on-screen rectangle of the contained image.
  const recompute = useCallback(() => {
    const wrap = wrapRef.current;
    const img = imgRef.current;
    if (!wrap) return;
    const cw = wrap.clientWidth, ch = wrap.clientHeight;
    const natW = img?.naturalWidth || 450;
    const natH = img?.naturalHeight || 600;
    const ratio = natW / natH;
    let dispW, dispH, offX, offY;
    if (cw / ch > ratio) { dispH = ch; dispW = ch * ratio; offX = (cw - dispW) / 2; offY = 0; }
    else { dispW = cw; dispH = cw / ratio; offX = 0; offY = (ch - dispH) / 2; }
    setImgRect({ left: offX, top: offY, width: dispW, height: dispH });
    setFrameBox({
      left: offX + FRAME.left * dispW,
      top: offY + FRAME.top * dispH,
      width: FRAME.width * dispW,
      height: FRAME.height * dispH,
    });
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
  }, [imgRect]);

  const load = useCallback(async () => {
    setLoading(true);
    if (owner) {
      const all = await fetchAllPosts();
      setPosts(all.filter((p) => p.status === 'published'));
      setDrafts(all.filter((p) => p.status === 'draft'));
    } else {
      const pub = await fetchPublishedPosts();
      setPosts(pub);
      setDrafts([]);
    }
    setLoading(false);
  }, [owner]);

  useEffect(() => { load(); }, [load]);

  // A single pinned note card (compact, to sit on the photo's frame).
  const Note = ({ post, idx, newest }) => (
    <button
      onClick={() => onOpenPost(post)}
      style={{
        position: 'relative',
        width: '100%',
        textAlign: 'left',
        background: BLOG.paper,
        border: 'none',
        borderRadius: 5,
        padding: '13px 9px 9px',
        cursor: 'pointer',
        transform: `rotate(${TILTS[idx % TILTS.length]}deg)`,
        boxShadow: '0 5px 12px rgba(20,14,8,0.5), 0 1px 0 rgba(255,255,255,0.4) inset',
        fontFamily: BLOG_SERIF,
        animation: `blogNoteIn .4s ${idx * 0.06}s ease both`,
      }}
    >
      {/* push-pin dot */}
      <span style={{
        position: 'absolute', top: -7, left: '50%', transform: 'translateX(-50%)',
        width: 14, height: 14, borderRadius: '50%',
        background: `radial-gradient(circle at 35% 30%, #fff 0%, ${PINS[idx % PINS.length]} 55%, rgba(0,0,0,0.4) 100%)`,
        boxShadow: '0 2px 5px rgba(0,0,0,0.5)',
      }} />
      {newest && (
        <span style={{
          position: 'absolute', top: 6, right: 6,
          fontFamily: BLOG_SANS, fontSize: '0.46rem', fontWeight: 700,
          letterSpacing: '0.06em', textTransform: 'uppercase',
          color: BLOG.cream, background: BLOG.sage,
          padding: '2px 5px', borderRadius: 999,
        }}>New</span>
      )}
      <div style={{
        fontSize: '0.82rem', fontWeight: 700, lineHeight: 1.12,
        color: BLOG.sage,
      }}>{post.title || 'Untitled'}</div>
      <div style={{
        fontFamily: BLOG_SANS, fontSize: '0.5rem', letterSpacing: '0.05em',
        textTransform: 'uppercase', color: BLOG.taupe, marginTop: 4,
      }}>{formatPostDate(post.createdAt || post.createdAtMs)}</div>
    </button>
  );

  return (
    <div ref={wrapRef} style={{ position: 'fixed', inset: 0, overflow: 'hidden', fontFamily: BLOG_SANS, background: '#15110d' }}>
      <style>{GFONTS}</style>
      <style>{`
        @keyframes blogNoteIn { from { opacity:0; transform: translateY(8px) rotate(0deg); } }
        @keyframes blogFadeIn { from { opacity:0; } to { opacity:1; } }
      `}</style>

      {/* Blurred fill so any letterbox bars read as part of the scene */}
      <img src="/frontporch.png" alt="" draggable={false} style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        objectFit: 'cover', filter: 'blur(22px) brightness(0.45)',
        transform: 'scale(1.1)', userSelect: 'none', pointerEvents: 'none',
      }} />

      {/* The whole porch photo, un-cropped */}
      <img ref={imgRef} src="/frontporch.png" alt="A cozy cabin porch with a bulletin board" draggable={false}
        onLoad={recompute}
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: 'contain', objectPosition: 'center', userSelect: 'none', pointerEvents: 'none',
          filter: 'brightness(1.2) contrast(1.02)',
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

      {/* Header controls */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, padding: '16px 16px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={onBack} style={{
          background: 'rgba(250,248,244,0.16)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
          border: '1px solid rgba(250,248,244,0.25)', borderRadius: 999, padding: '7px 16px',
          cursor: 'pointer', color: BLOG.cream, fontFamily: BLOG_SANS, fontSize: '0.74rem',
        }}>← Back inside</button>
        {owner && (
          <button onClick={onWrite} style={{
            background: BLOG.sage, border: 'none', borderRadius: 999, padding: '8px 16px',
            cursor: 'pointer', color: BLOG.cream, fontFamily: BLOG_SANS, fontSize: '0.74rem', fontWeight: 600,
            boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
          }}>+ Pin a new note</button>
        )}
      </div>

      {/* Pinned notes — overlaid onto the photo's wooden frame */}
      {frameBox && (
        <div style={{
          position: 'absolute',
          left: frameBox.left, top: frameBox.top, width: frameBox.width, height: frameBox.height,
          zIndex: 12, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
          padding: '12px 6px 8px', boxSizing: 'border-box',
          display: 'flex', flexDirection: 'column', gap: 16,
        }}>
          {loading ? (
            <p style={{ textAlign: 'center', fontFamily: BLOG_SERIF, fontStyle: 'italic', fontSize: '0.78rem', color: BLOG.cream, margin: 'auto 0' }}>
              Bringing in the notes…
            </p>
          ) : posts.length === 0 ? (
            <p style={{ textAlign: 'center', fontFamily: BLOG_SERIF, fontStyle: 'italic', fontSize: '0.78rem', color: 'rgba(250,248,244,0.92)', margin: 'auto 0', lineHeight: 1.4 }}>
              The board is quiet.<br />{owner ? 'Pin your first note.' : 'Check back soon.'}
            </p>
          ) : (
            posts.map((p, i) => <Note key={p.id} post={p} idx={i} newest={i === 0} />)
          )}
        </div>
      )}

      {/* Owner-only drafts — tucked into the bottom of the scene */}
      {owner && drafts.length > 0 && (
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 20, padding: '0 16px 64px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <button onClick={() => setShowDrafts((v) => !v)} style={{
            background: 'rgba(20,16,12,0.6)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(250,248,244,0.3)', borderRadius: 999, padding: '7px 16px',
            cursor: 'pointer', color: BLOG.cream, fontFamily: BLOG_SANS, fontSize: '0.72rem',
          }}>
            {showDrafts ? 'Hide drafts' : `Your drafts (${drafts.length})`}
          </button>
          {showDrafts && (
            <div style={{ width: '100%', maxWidth: 460, background: 'rgba(250,248,244,0.95)', borderRadius: 10, overflow: 'hidden', boxShadow: '0 8px 22px rgba(0,0,0,0.5)' }}>
              {drafts.map((p) => (
                <button key={p.id} onClick={() => onOpenPost(p)} style={{
                  display: 'flex', width: '100%', alignItems: 'baseline', justifyContent: 'space-between',
                  gap: 12, padding: '13px 16px', background: 'transparent', border: 'none',
                  borderBottom: '1px solid rgba(60,60,60,0.1)', cursor: 'pointer', textAlign: 'left',
                }}>
                  <span style={{ fontFamily: BLOG_SERIF, fontSize: '1rem', color: BLOG.charcoal, fontWeight: 600 }}>{p.title || 'Untitled draft'}</span>
                  <span style={{ fontFamily: BLOG_SANS, fontSize: '0.6rem', letterSpacing: '0.05em', textTransform: 'uppercase', color: BLOG.roseDk }}>Draft</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
