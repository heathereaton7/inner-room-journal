import { useState, useEffect, useCallback, useRef } from 'react';
import { GFONTS } from '../constants.js';
import { isBlogOwner } from '../constants.js';
import {
  fetchPublishedPosts, fetchAllPosts, formatPostDate,
  BLOG, BLOG_SERIF, BLOG_SANS,
} from '../systems/blog.js';

/**
 * THE PORCH BOARD — the readable bulletin-board close-up (screen B of 3).
 *
 *   porch (A) → board close-up (B) → post (C)
 *
 * Published posts are rendered as paper notes pinned to a cork board, newest
 * first. The newest carries a "Newest" tag. The first few show; the rest tuck
 * into an "Older posts" reveal. Tapping a note opens the full post. Reading is
 * public; the owner also sees "+ Pin a new note" and any drafts.
 */

// Deterministic, gentle tilt per pin so the board feels hand-pinned.
const TILTS = [-2.4, 1.8, -1.4, 2.2, -2.0, 1.3, -1.7, 2.0];
const PINS = ['#C0413B', '#5E7560', '#A99779', '#C8A39B', '#7E6B97', '#C9A96E'];
const VISIBLE = 5; // newest posts shown before the "Older posts" reveal

// Same backdrop as the porch landing (porchforreal.png), shown objectFit:cover
// under a heavy dark veil so the blog notes read clearly. Rain falls ONLY in the
// open-air window view on the right. Values are fractions of the natural image;
// the cover crop is undone each frame.
const BG_W = 1083, BG_H = 1445;
const RAIN_BOX = { left: 0.55, top: 0.115, width: 0.45, height: 0.42 };

export default function BlogBoardScreen({ user, onOpenPost, onWrite, onBack, onJoin }) {
  const [posts, setPosts] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showOlder, setShowOlder] = useState(false);
  const [showDrafts, setShowDrafts] = useState(false);
  const owner = isBlogOwner(user);
  const boardSrc = '/porchforreal.png';
  const weather = 'rain';
  const rainCanvasRef = useRef(null);
  const rainRef = useRef([]);

  // Soft rain confined to the open-air view (sky / trees / lake), never the porch.
  useEffect(() => {
    const canvas = rainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    if (!rainRef.current.length || rainRef.current.type !== weather) {
      const arr = weather === 'snow'
        ? Array.from({ length: 60 }, () => ({
            x: Math.random(), y: Math.random(),
            r: 0.004 + Math.random() * 0.007,
            sp: 0.003 + Math.random() * 0.0045,
            sway: 0.4 + Math.random() * 0.8,
            phase: Math.random() * Math.PI * 2,
          }))
        : Array.from({ length: 70 }, () => ({
            x: Math.random(), y: Math.random(),
            len: 0.04 + Math.random() * 0.06,
            sp: 0.012 + Math.random() * 0.018,
            w: Math.random() < 0.5 ? 1 : 1.4,
          }));
      arr.type = weather;
      rainRef.current = arr;
    }

    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf;
    const draw = (t) => {
      const W = window.innerWidth, H = window.innerHeight;
      ctx.clearRect(0, 0, W, H);
      // Undo the cover crop to find where the open-air view sits on screen.
      const scale = Math.max(W / BG_W, H / BG_H);
      const dispW = BG_W * scale, dispH = BG_H * scale;
      const offX = (W - dispW) / 2, offY = (H - dispH) / 2;
      const bx = offX + RAIN_BOX.left * dispW;
      const by = offY + RAIN_BOX.top * dispH;
      const bw = RAIN_BOX.width * dispW;
      const bh = RAIN_BOX.height * dispH;
      ctx.save();
      ctx.beginPath();
      ctx.rect(bx, by, bw, bh);
      ctx.clip();
      if (weather === 'snow') {
        const tw = (t || 0) / 1000;
        ctx.fillStyle = 'rgba(244,248,255,0.85)';
        for (const d of rainRef.current) {
          if (!reduce) { d.y += d.sp; if (d.y > 1) { d.y = -0.02; d.x = Math.random(); } }
          const drift = Math.sin(tw * d.sway + d.phase) * 0.02;
          const px = bx + (d.x + drift) * bw, py = by + d.y * bh;
          ctx.beginPath();
          ctx.arc(px, py, d.r * Math.min(bw, bh), 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        ctx.strokeStyle = 'rgba(190,205,225,0.32)';
        ctx.lineCap = 'round';
        for (const d of rainRef.current) {
          if (!reduce) { d.y += d.sp; if (d.y > 1) { d.y = -d.len; d.x = Math.random(); } }
          const px = bx + d.x * bw, py = by + d.y * bh, ll = d.len * bh;
          ctx.lineWidth = d.w;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px - ll * 0.16, py + ll);
          ctx.stroke();
        }
      }
      ctx.restore();
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, [weather]);

  const load = useCallback(async () => {
    setLoading(true);
    if (owner) {
      const all = await fetchAllPosts();
      setPosts(all.filter((p) => p.status === 'published'));
      setDrafts(all.filter((p) => p.status === 'draft'));
    } else {
      setPosts(await fetchPublishedPosts());
      setDrafts([]);
    }
    setLoading(false);
  }, [owner]);

  useEffect(() => { load(); }, [load]);

  const recent = posts.slice(0, VISIBLE);
  const older = posts.slice(VISIBLE);

  // A single pinned paper note (full, readable).
  const Note = ({ post, idx, newest }) => (
    <button
      onClick={() => onOpenPost(post)}
      style={{
        position: 'relative',
        width: '100%',
        textAlign: 'left',
        background: BLOG.paper,
        border: 'none',
        borderRadius: 6,
        padding: '22px 18px 18px',
        cursor: 'pointer',
        transform: `rotate(${TILTS[idx % TILTS.length]}deg)`,
        boxShadow: '0 9px 20px rgba(20,14,8,0.42), 0 1px 0 rgba(255,255,255,0.5) inset',
        fontFamily: BLOG_SERIF,
        animation: `blogNoteIn .45s ${idx * 0.07}s ease both`,
      }}
    >
      {/* push-pin dot */}
      <span style={{
        position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)',
        width: 16, height: 16, borderRadius: '50%',
        background: `radial-gradient(circle at 35% 30%, #fff 0%, ${PINS[idx % PINS.length]} 55%, rgba(0,0,0,0.4) 100%)`,
        boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
      }} />
      {newest && (
        <span style={{
          position: 'absolute', top: 8, right: 8,
          fontFamily: BLOG_SANS, fontSize: '0.5rem', fontWeight: 700,
          letterSpacing: '0.07em', textTransform: 'uppercase',
          color: BLOG.cream, background: BLOG.sage,
          padding: '3px 7px', borderRadius: 999,
        }}>Newest</span>
      )}
      <div style={{
        fontSize: '1.3rem', fontWeight: 700, lineHeight: 1.15, color: BLOG.sage,
        paddingRight: newest ? 54 : 0,
      }}>{post.title || 'Untitled'}</div>
      <div style={{
        fontFamily: BLOG_SANS, fontSize: '0.56rem', letterSpacing: '0.06em',
        textTransform: 'uppercase', color: BLOG.taupe, marginTop: 6,
      }}>{formatPostDate(post.createdAt || post.createdAtMs)}</div>
      {post.teaser && (
        <div style={{
          fontStyle: 'italic', fontSize: '1rem', lineHeight: 1.4,
          color: BLOG.charcoal, marginTop: 10,
        }}>{post.teaser}</div>
      )}
    </button>
  );

  return (
    <div style={{
      position: 'fixed', inset: 0, overflow: 'hidden', fontFamily: BLOG_SANS,
      animation: 'blogFadeIn .35s ease both', background: '#15110d',
    }}>
      <style>{GFONTS}</style>
      <style>{`
        @keyframes blogNoteIn { from { opacity:0; transform: translateY(10px) rotate(0deg); } }
        @keyframes blogFadeIn { from { opacity:0; } to { opacity:1; } }
      `}</style>

      {/* moody cabin-porch photo backdrop */}
      <img src={boardSrc} alt="" draggable={false} style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        objectFit: 'cover', objectPosition: 'center', userSelect: 'none', pointerEvents: 'none',
      }} />
      {/* heavy dark veil so the blog notes read clearly over the porch photo */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background:
          'linear-gradient(to bottom, rgba(6,5,4,0.84) 0%, rgba(6,5,4,0.72) 28%, rgba(6,5,4,0.72) 70%, rgba(6,5,4,0.88) 100%)',
      }} />
      {/* live rain over the scene */}
      <canvas ref={rainCanvasRef} style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        zIndex: 5, pointerEvents: 'none',
      }} />

      {/* Header */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
        padding: '16px 16px 10px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
        background: 'linear-gradient(to bottom, rgba(40,26,12,0.55), rgba(40,26,12,0))',
      }}>
        <button onClick={onBack} style={{
          background: 'rgba(250,248,244,0.18)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
          border: '1px solid rgba(250,248,244,0.3)', borderRadius: 999, padding: '7px 14px',
          cursor: 'pointer', color: BLOG.cream, fontFamily: BLOG_SANS, fontSize: '0.72rem',
        }}>{user ? '← Back to the porch' : '← Step inside'}</button>
        {owner && (
          <button onClick={onWrite} style={{
            background: BLOG.sage, border: 'none', borderRadius: 999, padding: '8px 15px',
            cursor: 'pointer', color: BLOG.cream, fontFamily: BLOG_SANS, fontSize: '0.72rem', fontWeight: 600,
            boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
          }}>+ Pin a new note</button>
        )}
      </div>

      {/* Title plaque */}
      <div style={{
        position: 'absolute', top: 58, left: 0, right: 0, zIndex: 15,
        textAlign: 'center', pointerEvents: 'none',
      }}>
        <div style={{
          fontFamily: BLOG_SERIF, fontSize: '1.7rem', fontWeight: 700,
          color: BLOG.cream, textShadow: '0 2px 6px rgba(0,0,0,0.5)', letterSpacing: '0.01em',
        }}>The Porch Board</div>
      </div>

      {/* Notes (scrollable) */}
      <div style={{
        position: 'absolute', inset: 0, top: 104, zIndex: 10,
        overflowY: 'auto', WebkitOverflowScrolling: 'touch',
        padding: '14px 26px 96px', boxSizing: 'border-box',
      }}>
        <div style={{ maxWidth: 520, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 26 }}>
          {/* Signup invitation — only for signed-out visitors landing here */}
          {!user && onJoin && (
            <div style={{
              background: BLOG.paper, borderRadius: 10, padding: '24px 22px 22px',
              transform: 'rotate(-0.6deg)', boxShadow: '0 12px 28px rgba(20,14,8,0.5)',
              position: 'relative',
            }}>
              {/* pushpin */}
              <div style={{
                position: 'absolute', top: -9, left: '50%', transform: 'translateX(-50%)',
                width: 16, height: 16, borderRadius: '50%', background: PINS[3],
                boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
              }} />
              <div style={{
                fontFamily: BLOG_SERIF, fontSize: '1.5rem', fontWeight: 700,
                color: BLOG.charcoal, textAlign: 'center', lineHeight: 1.25,
              }}>Pull up a chair</div>
              <p style={{
                fontFamily: BLOG_SERIF, fontSize: '1rem', color: BLOG.charcoal,
                lineHeight: 1.55, textAlign: 'center', margin: '10px 0 16px', fontStyle: 'italic',
              }}>
                Make a free account and the whole cabin is yours.
              </p>
              <ul style={{
                listStyle: 'none', padding: 0, margin: '0 0 18px',
                fontFamily: BLOG_SANS, fontSize: '0.82rem', color: BLOG.charcoal, lineHeight: 1.9,
              }}>
                {[
                  'Your journal, saved to your account',
                  'Cozy games & coloring',
                  'Gentle sounds to sleep to',
                  'Customize your own cabin',
                  'A profile others can visit',
                ].map((t) => (
                  <li key={t} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <span style={{ color: BLOG.sage, fontWeight: 700 }}>✦</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
              <button onClick={() => onJoin()} style={{
                display: 'block', width: '100%', background: BLOG.sage, border: 'none',
                borderRadius: 999, padding: '13px 18px', cursor: 'pointer',
                color: BLOG.cream, fontFamily: BLOG_SANS, fontSize: '0.92rem', fontWeight: 600,
                boxShadow: '0 5px 16px rgba(0,0,0,0.32)',
              }}>Create your free account</button>
              <button onClick={() => onJoin('login')} style={{
                display: 'block', width: '100%', background: 'transparent', border: 'none',
                marginTop: 12, cursor: 'pointer', color: BLOG.roseDk,
                fontFamily: BLOG_SANS, fontSize: '0.78rem',
              }}>Already have an account? Log in</button>
            </div>
          )}
          {loading ? (
            <p style={{ textAlign: 'center', fontFamily: BLOG_SERIF, fontStyle: 'italic', fontSize: '1.05rem', color: BLOG.cream, marginTop: 40 }}>
              Bringing in the notes…
            </p>
          ) : posts.length === 0 ? (
            <div style={{
              background: BLOG.paper, borderRadius: 8, padding: '28px 22px', textAlign: 'center',
              transform: 'rotate(-1.2deg)', boxShadow: '0 9px 20px rgba(20,14,8,0.42)',
              fontFamily: BLOG_SERIF, color: BLOG.charcoal, fontStyle: 'italic', fontSize: '1.05rem', lineHeight: 1.5,
            }}>
              The board is quiet.<br />{owner ? 'Pin your first note.' : 'Check back soon.'}
            </div>
          ) : (
            <>
              {recent.map((p, i) => <Note key={p.id} post={p} idx={i} newest={i === 0} />)}

              {older.length > 0 && (
                <>
                  <button onClick={() => setShowOlder((v) => !v)} style={{
                    alignSelf: 'center', background: 'rgba(20,16,12,0.5)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
                    border: '1px solid rgba(250,248,244,0.3)', borderRadius: 999, padding: '8px 18px',
                    cursor: 'pointer', color: BLOG.cream, fontFamily: BLOG_SANS, fontSize: '0.72rem',
                  }}>
                    {showOlder ? 'Hide older posts' : `Older posts (${older.length})`}
                  </button>
                  {showOlder && older.map((p, i) => <Note key={p.id} post={p} idx={VISIBLE + i} newest={false} />)}
                </>
              )}
            </>
          )}

          {/* Owner-only drafts */}
          {owner && drafts.length > 0 && (
            <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <button onClick={() => setShowDrafts((v) => !v)} style={{
                background: 'rgba(20,16,12,0.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
                border: '1px solid rgba(250,248,244,0.3)', borderRadius: 999, padding: '8px 18px',
                cursor: 'pointer', color: BLOG.cream, fontFamily: BLOG_SANS, fontSize: '0.72rem',
              }}>
                {showDrafts ? 'Hide drafts' : `Your drafts (${drafts.length})`}
              </button>
              {showDrafts && (
                <div style={{ width: '100%', background: 'rgba(250,248,244,0.96)', borderRadius: 10, overflow: 'hidden', boxShadow: '0 8px 22px rgba(0,0,0,0.5)' }}>
                  {drafts.map((p) => (
                    <button key={p.id} onClick={() => onOpenPost(p)} style={{
                      display: 'flex', width: '100%', alignItems: 'baseline', justifyContent: 'space-between',
                      gap: 12, padding: '14px 16px', background: 'transparent', border: 'none',
                      borderBottom: '1px solid rgba(60,60,60,0.1)', cursor: 'pointer', textAlign: 'left',
                    }}>
                      <span style={{ fontFamily: BLOG_SERIF, fontSize: '1.05rem', color: BLOG.charcoal, fontWeight: 600 }}>{p.title || 'Untitled draft'}</span>
                      <span style={{ fontFamily: BLOG_SANS, fontSize: '0.6rem', letterSpacing: '0.05em', textTransform: 'uppercase', color: BLOG.roseDk }}>Draft</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
