import { useState } from 'react';
import { GFONTS } from '../constants.js';
import { isBlogOwner } from '../constants.js';
import {
  formatPostDate, deletePost,
  BLOG, BLOG_SERIF, BLOG_SANS,
} from '../systems/blog.js';

/**
 * BLOG POST READER — public.
 *
 * A sage frame around a cream "paper sheet": title, date, full body.
 * If the post has a video link, a dusty-rose "Watch this on Faith-Full"
 * button opens it in a new tab. The owner gets Edit / Delete controls.
 */
export default function BlogPostScreen({ post, user, onBack, onEdit, onDeleted }) {
  const owner = isBlogOwner(user);
  const [confirmDel, setConfirmDel] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!post) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: BLOG.sage, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <style>{GFONTS}</style>
        <button onClick={onBack} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 999, padding: '8px 18px', color: BLOG.cream, fontFamily: BLOG_SANS, cursor: 'pointer' }}>← Back to the porch</button>
      </div>
    );
  }

  const hasVideo = !!(post.videoUrl && post.videoUrl.trim());

  const doDelete = async () => {
    setBusy(true);
    try {
      await deletePost(post.id);
      onDeleted && onDeleted();
    } catch (e) {
      console.warn('[blog] delete failed:', e?.message || e);
      setBusy(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', fontFamily: BLOG_SANS, background: BLOG.sage }}>
      <style>{GFONTS}</style>
      <style>{`@keyframes blogPaperIn { from { opacity:0; transform: translateY(14px);} to {opacity:1; transform:none;} }`}</style>

      <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '18px 16px 60px' }}>
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, maxWidth: 640, margin: '0 auto 16px' }}>
          <button onClick={onBack} style={{
            background: 'rgba(250,248,244,0.16)', border: '1px solid rgba(250,248,244,0.35)', borderRadius: 999,
            padding: '8px 16px', cursor: 'pointer', color: BLOG.cream, fontFamily: BLOG_SANS, fontSize: '0.76rem',
          }}>← Back to the porch</button>
          {owner && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => onEdit && onEdit(post)} style={{
                background: 'rgba(250,248,244,0.16)', border: '1px solid rgba(250,248,244,0.35)', borderRadius: 999,
                padding: '8px 14px', cursor: 'pointer', color: BLOG.cream, fontFamily: BLOG_SANS, fontSize: '0.74rem',
              }}>Edit</button>
              <button onClick={() => setConfirmDel(true)} style={{
                background: 'rgba(192,65,59,0.85)', border: 'none', borderRadius: 999,
                padding: '8px 14px', cursor: 'pointer', color: '#fff', fontFamily: BLOG_SANS, fontSize: '0.74rem',
              }}>Delete</button>
            </div>
          )}
        </div>

        {/* Paper sheet */}
        <article style={{
          maxWidth: 640, margin: '0 auto', background: BLOG.cream, borderRadius: 10,
          border: `1px solid ${BLOG.sageDk}`,
          boxShadow: '0 18px 50px rgba(0,0,0,0.4)', padding: '38px 30px 44px',
          animation: 'blogPaperIn .45s ease both',
        }}>
          {post.status === 'draft' && (
            <div style={{ fontFamily: BLOG_SANS, fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: BLOG.roseDk, marginBottom: 12, fontWeight: 700 }}>Draft — only you can see this</div>
          )}
          <h1 style={{
            fontFamily: BLOG_SERIF, fontWeight: 700, fontSize: '2.1rem', lineHeight: 1.15,
            color: BLOG.sage, margin: '0 0 8px',
          }}>{post.title || 'Untitled'}</h1>
          <div style={{
            fontFamily: BLOG_SANS, fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase',
            color: BLOG.taupe, marginBottom: 22,
          }}>{formatPostDate(post.createdAt || post.createdAtMs)}</div>

          {/* dusty-rose quote bar accent */}
          <div style={{ width: 56, height: 4, borderRadius: 4, background: BLOG.rose, marginBottom: 24 }} />

          <div style={{
            fontFamily: BLOG_SERIF, fontSize: '1.18rem', lineHeight: 1.7, color: BLOG.charcoal,
            whiteSpace: 'pre-wrap',
          }}>{post.body || post.teaser || ''}</div>

          {hasVideo && (
            <a href={post.videoUrl} target="_blank" rel="noopener noreferrer" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 30,
              background: BLOG.rose, color: '#fff', textDecoration: 'none',
              fontFamily: BLOG_SANS, fontSize: '0.82rem', fontWeight: 600,
              padding: '12px 22px', borderRadius: 999, boxShadow: '0 6px 18px rgba(200,163,155,0.5)',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z" /></svg>
              Watch this on Faith-Full
            </a>
          )}
        </article>
      </div>

      {/* Delete confirm */}
      {confirmDel && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(10,8,6,0.55)' }}>
          <div style={{ background: BLOG.cream, borderRadius: 14, padding: '24px 22px', maxWidth: 320, margin: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            <p style={{ fontFamily: BLOG_SERIF, fontSize: '1.1rem', color: BLOG.charcoal, margin: '0 0 18px', lineHeight: 1.4 }}>
              Take this note down for good?
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button disabled={busy} onClick={() => setConfirmDel(false)} style={{ background: 'transparent', border: `1px solid ${BLOG.taupe}`, borderRadius: 999, padding: '8px 16px', cursor: 'pointer', color: BLOG.charcoal, fontFamily: BLOG_SANS, fontSize: '0.76rem' }}>Keep it</button>
              <button disabled={busy} onClick={doDelete} style={{ background: '#C0413B', border: 'none', borderRadius: 999, padding: '8px 16px', cursor: 'pointer', color: '#fff', fontFamily: BLOG_SANS, fontSize: '0.76rem', fontWeight: 600, opacity: busy ? 0.6 : 1 }}>{busy ? 'Removing…' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
