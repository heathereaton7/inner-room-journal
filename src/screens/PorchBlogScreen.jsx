import { useState, useEffect, useCallback } from 'react';
import { GFONTS } from '../constants.js';
import { isBlogOwner } from '../constants.js';
import {
  fetchPublishedPosts, fetchAllPosts, formatPostDate,
  BLOG, BLOG_SERIF, BLOG_SANS,
} from '../systems/blog.js';

/**
 * PORCH BLOG BOARD — the public landing for the blog.
 *
 * A cabin-porch scene (frontporch.png) sets the mood; published posts are
 * pinned to a cork board as little paper notes. Tapping a note opens the
 * full post. The owner sees a "Pin a new note" button + any drafts.
 *
 * Reading is public (works signed-out); writing is owner-only.
 */

// Gentle, deterministic tilt per pin so the board feels hand-pinned (no jitter
// on re-render). Index-based so it's stable.
const TILTS = [-2.5, 1.8, -1.2, 2.4, -2.0, 1.4];
const PINS = ['#C0413B', '#5E7560', '#A99779', '#C8A39B', '#7E6B97', '#C9A96E'];

const VISIBLE_LIMIT = 4; // pins shown on the board; the rest collapse to a list

export default function PorchBlogScreen({ user, onOpenPost, onWrite, onBack }) {
  const [posts, setPosts] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showOlder, setShowOlder] = useState(false);
  const owner = isBlogOwner(user);

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

  const pinned = posts.slice(0, VISIBLE_LIMIT);
  const older = posts.slice(VISIBLE_LIMIT);

  // A single pinned note card.
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
        padding: '20px 16px 16px',
        cursor: 'pointer',
        transform: `rotate(${TILTS[idx % TILTS.length]}deg)`,
        boxShadow: '0 6px 16px rgba(40,30,20,0.35), 0 1px 0 rgba(255,255,255,0.4) inset',
        fontFamily: BLOG_SERIF,
        transition: 'transform .18s ease, box-shadow .18s ease',
        animation: `blogNoteIn .4s ${idx * 0.06}s ease both`,
      }}
    >
      {/* push-pin dot */}
      <span style={{
        position: 'absolute', top: -9, left: '50%', transform: 'translateX(-50%)',
        width: 18, height: 18, borderRadius: '50%',
        background: `radial-gradient(circle at 35% 30%, #fff 0%, ${PINS[idx % PINS.length]} 55%, rgba(0,0,0,0.4) 100%)`,
        boxShadow: '0 3px 6px rgba(0,0,0,0.4)',
      }} />
      {newest && (
        <span style={{
          position: 'absolute', top: 10, right: 10,
          fontFamily: BLOG_SANS, fontSize: '0.58rem', fontWeight: 700,
          letterSpacing: '0.08em', textTransform: 'uppercase',
          color: BLOG.cream, background: BLOG.sage,
          padding: '3px 8px', borderRadius: 999,
        }}>Newest</span>
      )}
      <div style={{
        fontSize: '1.18rem', fontWeight: 700, lineHeight: 1.15,
        color: BLOG.sage, marginRight: newest ? 56 : 0,
      }}>{post.title || 'Untitled'}</div>
      <div style={{
        fontFamily: BLOG_SANS, fontSize: '0.66rem', letterSpacing: '0.06em',
        textTransform: 'uppercase', color: BLOG.taupe, margin: '5px 0 8px',
      }}>{formatPostDate(post.createdAt || post.createdAtMs)}</div>
      {post.teaser && (
        <div style={{
          fontSize: '0.98rem', fontStyle: 'italic', lineHeight: 1.35,
          color: BLOG.charcoal,
        }}>{post.teaser}</div>
      )}
    </button>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', fontFamily: BLOG_SANS }}>
      <style>{GFONTS}</style>
      <style>{`
        @keyframes blogNoteIn { from { opacity:0; transform: translateY(10px) rotate(0deg); } }
        @keyframes blogFadeIn { from { opacity:0; } to { opacity:1; } }
      `}</style>

      {/* Porch photo backdrop */}
      <img src="/frontporch.png" alt="" draggable={false} style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        objectFit: 'cover', objectPosition: 'center', userSelect: 'none', pointerEvents: 'none',
      }} />
      {/* Dim + warm vignette so the board reads clearly */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'linear-gradient(to bottom, rgba(10,8,6,0.55) 0%, rgba(10,8,6,0.2) 30%, rgba(10,8,6,0.35) 70%, rgba(10,8,6,0.7) 100%)',
      }} />

      {/* Scroll container */}
      <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {/* Header */}
        <div style={{ padding: '20px 20px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={onBack} style={{
            background: 'rgba(250,248,244,0.16)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(250,248,244,0.25)', borderRadius: 999, padding: '7px 16px',
            cursor: 'pointer', color: BLOG.cream, fontFamily: BLOG_SANS, fontSize: '0.74rem',
          }}>← Back inside</button>
          {owner && (
            <button onClick={onWrite} style={{
              background: BLOG.sage, border: 'none', borderRadius: 999, padding: '8px 16px',
              cursor: 'pointer', color: BLOG.cream, fontFamily: BLOG_SANS, fontSize: '0.74rem', fontWeight: 600,
              boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
            }}>+ Pin a new note</button>
          )}
        </div>

        {/* Title plaque */}
        <div style={{ textAlign: 'center', padding: '4px 20px 18px', animation: 'blogFadeIn .6s ease both' }}>
          <h1 style={{
            fontFamily: BLOG_SERIF, fontWeight: 700, fontSize: '1.9rem', color: BLOG.cream,
            margin: 0, textShadow: '0 2px 10px rgba(0,0,0,0.6)',
          }}>The Porch</h1>
          <p style={{
            fontFamily: BLOG_SERIF, fontStyle: 'italic', fontSize: '0.92rem',
            color: 'rgba(250,248,244,0.85)', margin: '4px 0 0', textShadow: '0 1px 6px rgba(0,0,0,0.6)',
          }}>Reflections, pinned up for you</p>
        </div>

        {/* Cork board with the pinned notes */}
        <div style={{ padding: '0 16px 40px', display: 'flex', justifyContent: 'center' }}>
          <div style={{
            width: '100%', maxWidth: 560,
            background: `${BLOG.cork} url('/blogboard.png') center/cover`,
            borderRadius: 14,
            border: '10px solid #6B4A28',
            boxShadow: '0 16px 48px rgba(0,0,0,0.55), inset 0 0 60px rgba(0,0,0,0.35)',
            padding: '26px 20px',
            minHeight: 240,
          }}>
            {loading ? (
              <p style={{ textAlign: 'center', fontFamily: BLOG_SERIF, fontStyle: 'italic', color: BLOG.cream, padding: '40px 0' }}>
                Bringing in the notes…
              </p>
            ) : pinned.length === 0 ? (
              <p style={{ textAlign: 'center', fontFamily: BLOG_SERIF, fontStyle: 'italic', color: 'rgba(250,248,244,0.9)', padding: '40px 0', lineHeight: 1.5 }}>
                The board is quiet for now.<br />
                {owner ? 'Pin your first reflection.' : 'Check back soon for a new note.'}
              </p>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: 22,
              }}>
                {pinned.map((p, i) => (
                  <Note key={p.id} post={p} idx={i} newest={i === 0} />
                ))}
              </div>
            )}

            {/* Older posts — collapsed list */}
            {older.length > 0 && (
              <div style={{ marginTop: 26 }}>
                <button onClick={() => setShowOlder((v) => !v)} style={{
                  background: 'rgba(250,248,244,0.12)', border: '1px solid rgba(250,248,244,0.3)',
                  borderRadius: 999, padding: '7px 16px', cursor: 'pointer',
                  color: BLOG.cream, fontFamily: BLOG_SANS, fontSize: '0.72rem',
                  display: 'block', margin: '0 auto',
                }}>
                  {showOlder ? 'Hide older posts' : `Older posts (${older.length})`}
                </button>
                {showOlder && (
                  <div style={{
                    marginTop: 14, background: 'rgba(250,248,244,0.94)', borderRadius: 10,
                    overflow: 'hidden', boxShadow: '0 6px 16px rgba(0,0,0,0.3)',
                  }}>
                    {older.map((p) => (
                      <button key={p.id} onClick={() => onOpenPost(p)} style={{
                        display: 'flex', width: '100%', alignItems: 'baseline', justifyContent: 'space-between',
                        gap: 12, padding: '13px 16px', background: 'transparent', border: 'none',
                        borderBottom: '1px solid rgba(60,60,60,0.1)', cursor: 'pointer', textAlign: 'left',
                      }}>
                        <span style={{ fontFamily: BLOG_SERIF, fontSize: '1rem', color: BLOG.sage, fontWeight: 600 }}>{p.title || 'Untitled'}</span>
                        <span style={{ fontFamily: BLOG_SANS, fontSize: '0.62rem', letterSpacing: '0.05em', textTransform: 'uppercase', color: BLOG.taupe, whiteSpace: 'nowrap' }}>{formatPostDate(p.createdAt || p.createdAtMs)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Owner-only drafts shelf */}
        {owner && drafts.length > 0 && (
          <div style={{ padding: '0 20px 48px', maxWidth: 560, margin: '0 auto' }}>
            <h2 style={{ fontFamily: BLOG_SANS, fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(250,248,244,0.7)', margin: '0 0 10px' }}>
              Your drafts (only you can see these)
            </h2>
            <div style={{ background: 'rgba(250,248,244,0.9)', borderRadius: 10, overflow: 'hidden' }}>
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
          </div>
        )}
      </div>
    </div>
  );
}
