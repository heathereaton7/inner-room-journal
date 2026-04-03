import { useState } from 'react';
import { B, SERIF, SANS, DISPLAY, GFONTS } from '../constants.js';
import { CSS } from '../styles.js';
import { GATHERING_SPACES, POST_TYPES } from '../gatherings.js';

export default function CreateGatheringPost({ onBack, onSubmit, spaceId, anonName }) {
  const [selectedSpace, setSelectedSpace] = useState(spaceId || "");
  const [postType, setPostType] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = selectedSpace && postType && title.trim().length >= 3 && body.trim().length >= 10 && !submitting;
  const space = GATHERING_SPACES.find(s => s.id === selectedSpace);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    const tagArr = tags.split(",").map(t => t.trim().toLowerCase()).filter(t => t.length > 1);
    await onSubmit({
      spaceId: selectedSpace,
      postType,
      title: title.trim(),
      body: body.trim(),
      tags: tagArr,
    });
    setSubmitting(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "#0E0B14", fontFamily: SANS, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
      <style>{GFONTS}{CSS}</style>
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "28px 22px 100px" }}>

        <button onClick={onBack} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(180,160,210,0.12)", borderRadius: 999, padding: "8px 20px", cursor: "pointer", color: "rgba(230,220,248,0.45)", fontFamily: SANS, fontSize: "0.78rem", marginBottom: 28, display: "inline-flex", alignItems: "center", gap: 6 }}>
          Back
        </button>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28, animation: "fadeUp .3s ease both" }}>
          <h1 style={{ fontFamily: DISPLAY, fontSize: "1.3rem", fontWeight: 700, color: "#D8C8F0", margin: "0 0 6px" }}>Share what's on your heart</h1>
          <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: "0.82rem", color: "rgba(200,190,230,0.35)", margin: 0 }}>You'll appear as <span style={{ color: "rgba(200,190,230,0.55)" }}>{anonName || "Anonymous"}</span></p>
        </div>

        {/* Space selector */}
        <div style={{ marginBottom: 20, animation: "fadeUp .3s .04s ease both", opacity: 0 }}>
          <label style={{ fontFamily: SANS, fontSize: "0.68rem", letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(200,190,230,0.3)", display: "block", marginBottom: 8 }}>Gathering</label>
          <select value={selectedSpace} onChange={e => setSelectedSpace(e.target.value)} style={{
            width: "100%", boxSizing: "border-box",
            background: "rgba(180,160,210,0.06)", border: "1px solid rgba(180,160,210,0.12)",
            borderRadius: 12, padding: "11px 14px",
            color: selectedSpace ? "#D8C8F0" : "rgba(200,190,230,0.35)",
            fontFamily: SANS, fontSize: "0.85rem", outline: "none",
          }}>
            <option value="">Choose a gathering...</option>
            {GATHERING_SPACES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        {/* Sensitive space warning */}
        {space?.isSensitive && (
          <div style={{ marginBottom: 16, padding: "10px 14px", background: "rgba(180,160,210,0.04)", border: "1px solid rgba(180,160,210,0.1)", borderRadius: 10 }}>
            <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: "0.74rem", color: "rgba(200,190,230,0.35)", margin: 0, lineHeight: 1.5 }}>This is a sensitive gathering. Please be gentle with yourself and others.</p>
          </div>
        )}

        {/* Post type */}
        <div style={{ marginBottom: 20, animation: "fadeUp .3s .06s ease both", opacity: 0 }}>
          <label style={{ fontFamily: SANS, fontSize: "0.68rem", letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(200,190,230,0.3)", display: "block", marginBottom: 8 }}>What kind of post?</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {POST_TYPES.map(pt => (
              <button key={pt.id} onClick={() => setPostType(pt.id)} style={{
                background: postType === pt.id ? "rgba(180,160,210,0.12)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${postType === pt.id ? "rgba(180,160,210,0.35)" : "rgba(180,160,210,0.08)"}`,
                borderRadius: 20, padding: "6px 14px", cursor: "pointer",
                color: postType === pt.id ? "#D8C8F0" : "rgba(200,190,230,0.35)",
                fontFamily: SANS, fontSize: "0.74rem", fontWeight: 500, transition: "all 0.15s",
              }}>
                {pt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div style={{ marginBottom: 20, animation: "fadeUp .3s .06s ease both", opacity: 0 }}>
          <label style={{ fontFamily: SANS, fontSize: "0.68rem", letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(200,190,230,0.3)", display: "block", marginBottom: 8 }}>Title</label>
          <input value={title} onChange={e => setTitle(e.target.value.slice(0, 120))} placeholder="What's this about?" style={{
            width: "100%", boxSizing: "border-box",
            background: "rgba(180,160,210,0.06)", border: "1px solid rgba(180,160,210,0.12)",
            borderRadius: 12, padding: "11px 14px",
            color: "#E8E0F0", fontFamily: SERIF, fontStyle: "italic", fontSize: "0.95rem",
            outline: "none", transition: "border-color 0.2s",
          }} onFocus={e => e.target.style.borderColor = "rgba(180,160,210,0.3)"} onBlur={e => e.target.style.borderColor = "rgba(180,160,210,0.12)"} />
        </div>

        {/* Body */}
        <div style={{ marginBottom: 20, animation: "fadeUp .5s .25s ease both", opacity: 0 }}>
          <label style={{ fontFamily: SANS, fontSize: "0.68rem", letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(200,190,230,0.3)", display: "block", marginBottom: 8 }}>Your words</label>
          <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Say what you need to say..." style={{
            width: "100%", boxSizing: "border-box",
            background: "rgba(180,160,210,0.06)", border: "1px solid rgba(180,160,210,0.12)",
            borderRadius: 12, padding: "14px",
            color: "#E8E0F0", fontFamily: SERIF, fontSize: "0.9rem",
            minHeight: 120, resize: "vertical", outline: "none", lineHeight: 1.7,
            transition: "border-color 0.2s",
          }} onFocus={e => e.target.style.borderColor = "rgba(180,160,210,0.3)"} onBlur={e => e.target.style.borderColor = "rgba(180,160,210,0.12)"} />
        </div>

        {/* Tags */}
        <div style={{ marginBottom: 28, animation: "fadeUp .3s .08s ease both", opacity: 0 }}>
          <label style={{ fontFamily: SANS, fontSize: "0.68rem", letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(200,190,230,0.3)", display: "block", marginBottom: 8 }}>Tags <span style={{ textTransform: "none", fontWeight: 400 }}>(optional, comma-separated)</span></label>
          <input value={tags} onChange={e => setTags(e.target.value)} placeholder="healing, boundaries, faith" style={{
            width: "100%", boxSizing: "border-box",
            background: "rgba(180,160,210,0.06)", border: "1px solid rgba(180,160,210,0.12)",
            borderRadius: 12, padding: "11px 14px",
            color: "#E8E0F0", fontFamily: SANS, fontSize: "0.82rem",
            outline: "none", transition: "border-color 0.2s",
          }} onFocus={e => e.target.style.borderColor = "rgba(180,160,210,0.3)"} onBlur={e => e.target.style.borderColor = "rgba(180,160,210,0.12)"} />
        </div>

        {/* Submit */}
        <button onClick={handleSubmit} disabled={!canSubmit} style={{
          width: "100%",
          background: canSubmit ? "linear-gradient(135deg,rgba(180,160,210,0.2),rgba(180,160,210,0.06))" : "rgba(180,160,210,0.03)",
          border: `1px solid ${canSubmit ? "rgba(180,160,210,0.35)" : "rgba(180,160,210,0.08)"}`,
          borderRadius: 14, padding: "14px 0", cursor: canSubmit ? "pointer" : "default",
          color: canSubmit ? "#E8E0F0" : "rgba(200,190,230,0.2)",
          fontFamily: SERIF, fontStyle: "italic", fontSize: "0.92rem", fontWeight: 600,
          transition: "all 0.3s", letterSpacing: "0.04em",
        }}>
          {submitting ? "Sharing..." : "Share with the gathering"}
        </button>
      </div>
    </div>
  );
}
