import { useState } from 'react';
import { GFONTS } from '../constants.js';
import { isBlogOwner } from '../constants.js';
import {
  createPost, updatePost, formatPostDate,
  BLOG, BLOG_SERIF, BLOG_SANS,
} from '../systems/blog.js';

/**
 * WRITE / EDIT POST — OWNER ONLY.
 *
 * Fields: Title, one-line teaser, reflection body, optional Faith-Full link.
 * A live "pin preview" shows how the note will look on the board.
 * Actions: "Pin to the porch" (publish) and "Save as draft".
 *
 * Non-owners never reach this (guarded in app.jsx + here as a backstop).
 */
export default function WriteBlogScreen({ user, editingPost, onDone, onBack }) {
  const owner = isBlogOwner(user);
  const editing = editingPost || null;

  const [title, setTitle] = useState(editing?.title || '');
  const [teaser, setTeaser] = useState(editing?.teaser || '');
  const [body, setBody] = useState(editing?.body || '');
  const [videoUrl, setVideoUrl] = useState(editing?.videoUrl || '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  if (!owner) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: BLOG.sage, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, padding: 24 }}>
        <style>{GFONTS}</style>
        <p style={{ fontFamily: BLOG_SERIF, fontStyle: 'italic', fontSize: '1.1rem', color: BLOG.cream, textAlign: 'center', maxWidth: 300 }}>
          Only the porch keeper can pin new notes.
        </p>
        <button onClick={onBack} style={{ background: 'rgba(250,248,244,0.16)', border: '1px solid rgba(250,248,244,0.4)', borderRadius: 999, padding: '9px 20px', color: BLOG.cream, fontFamily: BLOG_SANS, cursor: 'pointer' }}>← Back to the porch</button>
      </div>
    );
  }

  const save = async (status) => {
    if (!title.trim()) { setErr('Give your note a title first.'); return; }
    setBusy(true); setErr('');
    try {
      const payload = { title, teaser, body, videoUrl, status, authorUid: user.uid };
      if (editing) await updatePost(editing.id, payload);
      else await createPost(payload);
      onDone && onDone();
    } catch (e) {
      console.warn('[blog] save failed:', e?.message || e);
      setErr('Something went wrong saving. Please try again.');
      setBusy(false);
    }
  };

  const labelStyle = { fontFamily: BLOG_SANS, fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: BLOG.cream, display: 'block', marginBottom: 6 };
  const fieldStyle = {
    width: '100%', boxSizing: 'border-box', background: BLOG.cream, color: BLOG.charcoal,
    border: 'none', borderRadius: 8, padding: '12px 14px', fontFamily: BLOG_SANS, fontSize: '0.95rem',
    outline: 'none', marginBottom: 18,
  };

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', fontFamily: BLOG_SANS, background: BLOG.sage }}>
      <style>{GFONTS}</style>
      <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '18px 16px 60px' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          {/* Top bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <button onClick={onBack} style={{ background: 'rgba(250,248,244,0.16)', border: '1px solid rgba(250,248,244,0.35)', borderRadius: 999, padding: '8px 16px', cursor: 'pointer', color: BLOG.cream, fontFamily: BLOG_SANS, fontSize: '0.76rem' }}>← Cancel</button>
            <h1 style={{ fontFamily: BLOG_SERIF, fontWeight: 700, fontSize: '1.4rem', color: BLOG.cream, margin: 0 }}>{editing ? 'Edit note' : 'New note'}</h1>
            <span style={{ width: 64 }} />
          </div>

          {/* Live pin preview */}
          <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'center' }}>
            <div style={{
              position: 'relative', width: 260, background: BLOG.paper, borderRadius: 6,
              padding: '20px 16px 16px', transform: 'rotate(-1.5deg)',
              boxShadow: '0 8px 20px rgba(40,30,20,0.4)', fontFamily: BLOG_SERIF,
            }}>
              <span style={{ position: 'absolute', top: -9, left: '50%', transform: 'translateX(-50%)', width: 18, height: 18, borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, #fff 0%, #C0413B 55%, rgba(0,0,0,0.4) 100%)', boxShadow: '0 3px 6px rgba(0,0,0,0.4)' }} />
              <div style={{ fontSize: '1.15rem', fontWeight: 700, lineHeight: 1.15, color: BLOG.sage }}>{title.trim() || 'Your title'}</div>
              <div style={{ fontFamily: BLOG_SANS, fontSize: '0.64rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: BLOG.taupe, margin: '5px 0 8px' }}>{formatPostDate(editing?.createdAt || Date.now())}</div>
              <div style={{ fontSize: '0.95rem', fontStyle: 'italic', lineHeight: 1.35, color: BLOG.charcoal }}>{teaser.trim() || 'A one-line teaser appears here…'}</div>
            </div>
          </div>

          {/* Form */}
          <label style={labelStyle}>Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="A title for your reflection" style={fieldStyle} />

          <label style={labelStyle}>One-line teaser</label>
          <input value={teaser} onChange={(e) => setTeaser(e.target.value)} placeholder="The single line shown on the pin" style={fieldStyle} />

          <label style={labelStyle}>Your reflection</label>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write the full reflection…" rows={10} style={{ ...fieldStyle, resize: 'vertical', fontFamily: BLOG_SERIF, fontSize: '1.05rem', lineHeight: 1.6 }} />

          <label style={labelStyle}>Faith-Full video link (optional)</label>
          <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://youtube.com/…" style={fieldStyle} inputMode="url" />

          {err && <p style={{ fontFamily: BLOG_SANS, fontSize: '0.78rem', color: '#FCE2DE', background: 'rgba(192,65,59,0.4)', borderRadius: 8, padding: '8px 12px', margin: '0 0 14px' }}>{err}</p>}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
            <button disabled={busy} onClick={() => save('published')} style={{
              flex: 1, background: BLOG.cream, color: BLOG.sage, border: 'none', borderRadius: 999,
              padding: '14px 0', cursor: 'pointer', fontFamily: BLOG_SANS, fontSize: '0.86rem', fontWeight: 700,
              boxShadow: '0 6px 18px rgba(0,0,0,0.3)', opacity: busy ? 0.6 : 1,
            }}>{busy ? 'Pinning…' : 'Pin to the porch'}</button>
            <button disabled={busy} onClick={() => save('draft')} style={{
              flex: 1, background: 'transparent', color: BLOG.cream, border: '1px solid rgba(250,248,244,0.5)', borderRadius: 999,
              padding: '14px 0', cursor: 'pointer', fontFamily: BLOG_SANS, fontSize: '0.86rem', fontWeight: 600, opacity: busy ? 0.6 : 1,
            }}>Save as draft</button>
          </div>
        </div>
      </div>
    </div>
  );
}
