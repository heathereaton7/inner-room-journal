import { useState } from 'react';
import { B, SERIF, SANS, DISPLAY, GFONTS } from '../constants.js';
import { CSS } from '../styles.js';
import { POST_TYPES, REACTIONS, GATHERING_SPACES } from '../gatherings.js';

function fmtAgo(ts) {
  if (!ts) return "";
  const sec = Math.floor((Date.now() - (ts.toDate ? ts.toDate().getTime() : new Date(ts).getTime())) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  if (sec < 604800) return `${Math.floor(sec / 86400)}d ago`;
  return `${Math.floor(sec / 604800)}w ago`;
}

function ReactionBar({ counts, userReaction, onReact }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
      {REACTIONS.map(r => {
        const c = (counts || {})[r.id] || 0;
        const active = userReaction === r.id;
        return (
          <button key={r.id} onClick={() => onReact(r.id)} style={{
            background: active ? "rgba(180,160,210,0.12)" : "rgba(255,255,255,0.02)",
            border: `1px solid ${active ? "rgba(180,160,210,0.3)" : "rgba(180,160,210,0.06)"}`,
            borderRadius: 20, padding: "5px 12px", cursor: "pointer",
            color: active ? "#D8C8F0" : "rgba(200,190,230,0.3)",
            fontFamily: SANS, fontSize: "0.65rem", fontWeight: 500, transition: "all 0.15s",
            display: "flex", alignItems: "center", gap: 4,
          }}>
            <span>{r.label}</span>
            {c > 0 && <span style={{ opacity: 0.6 }}>{c}</span>}
          </button>
        );
      })}
    </div>
  );
}

export default function GatheringPost({
  post, replies, loading, userReaction,
  onBack, onReact, onReply, onReport,
  replyText, setReplyText, replySubmitting, anonName,
}) {
  const [showReportMenu, setShowReportMenu] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null); // reply id for nested reply
  const space = GATHERING_SPACES.find(s => s.id === post?.spaceId);
  const pt = POST_TYPES.find(p => p.id === post?.postType);

  // Blocked names (localStorage)
  const [blocked, setBlocked] = useState(() => {
    try { return JSON.parse(localStorage.getItem("irj-blocked-anon") || "[]"); } catch (e) { return []; }
  });
  const blockName = (name) => {
    const next = [...new Set([...blocked, name])];
    setBlocked(next);
    try { localStorage.setItem("irj-blocked-anon", JSON.stringify(next)); } catch (e) {}
  };

  // Filter blocked replies
  const visibleReplies = (replies || []).filter(r => !blocked.includes(r.anonymousName));

  // Organize into top-level + nested
  const topLevel = visibleReplies.filter(r => !r.parentReplyId);
  const nested = visibleReplies.filter(r => r.parentReplyId);

  if (!post) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "#0E0B14", fontFamily: SANS, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
      <style>{GFONTS}{CSS}</style>
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "28px 22px 100px" }}>

        <button onClick={onBack} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(180,160,210,0.12)", borderRadius: 999, padding: "8px 20px", cursor: "pointer", color: "rgba(230,220,248,0.45)", fontFamily: SANS, fontSize: "0.78rem", marginBottom: 24, display: "inline-flex", alignItems: "center", gap: 6 }}>
          Back
        </button>

        {/* Post */}
        <div style={{ animation: "fadeUp .5s ease both" }}>
          {/* Meta */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
            <span style={{ fontFamily: SANS, fontSize: "0.72rem", color: "rgba(180,160,210,0.45)", fontWeight: 500 }}>{post.anonymousName || "Anonymous"}</span>
            {pt && <span style={{ fontFamily: SANS, fontSize: "0.58rem", color: "rgba(180,160,210,0.35)", background: "rgba(180,160,210,0.06)", border: "1px solid rgba(180,160,210,0.1)", borderRadius: 99, padding: "1px 8px" }}>{pt.label}</span>}
            {space && <span style={{ fontFamily: SANS, fontSize: "0.58rem", color: "rgba(200,190,230,0.2)" }}>in {space.name}</span>}
            <span style={{ fontFamily: SANS, fontSize: "0.6rem", color: "rgba(200,190,230,0.2)", marginLeft: "auto" }}>{fmtAgo(post.createdAt)}</span>
          </div>

          {/* Title */}
          <h1 style={{ fontFamily: SERIF, fontSize: "1.15rem", fontWeight: 600, color: "#D8C8F0", margin: "0 0 12px", lineHeight: 1.4 }}>{post.title}</h1>

          {/* Body */}
          <p style={{ fontFamily: SANS, fontSize: "0.85rem", color: "rgba(220,210,240,0.55)", margin: "0 0 8px", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{post.body}</p>

          {/* Tags */}
          {post.tags?.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
              {post.tags.map(t => <span key={t} style={{ fontFamily: SANS, fontSize: "0.6rem", color: "rgba(200,190,230,0.25)", background: "rgba(180,160,210,0.04)", borderRadius: 99, padding: "2px 8px" }}>{t}</span>)}
            </div>
          )}

          {/* Reactions */}
          <ReactionBar counts={post.reactionCounts} userReaction={userReaction} onReact={onReact} />

          {/* Report */}
          <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
            <button onClick={() => setShowReportMenu(!showReportMenu)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "rgba(200,190,230,0.15)", fontFamily: SANS, fontSize: "0.6rem", transition: "color 0.15s" }} onMouseEnter={e => e.target.style.color = "rgba(200,190,230,0.35)"} onMouseLeave={e => e.target.style.color = "rgba(200,190,230,0.15)"}>
              Report
            </button>
          </div>
          {showReportMenu && (
            <div style={{ background: "rgba(20,18,32,0.8)", border: "1px solid rgba(180,160,210,0.12)", borderRadius: 10, padding: 12, marginTop: 6, animation: "fadeUp .3s ease both" }}>
              <p style={{ fontFamily: SANS, fontSize: "0.7rem", color: "rgba(200,190,230,0.4)", margin: "0 0 8px" }}>Why are you reporting this?</p>
              {["Harmful content", "Spam", "Inappropriate", "Other"].map(reason => (
                <button key={reason} onClick={() => { if (onReport) onReport(post.id, "post", reason); setShowReportMenu(false); }} style={{ display: "block", width: "100%", textAlign: "left", background: "rgba(180,160,210,0.04)", border: "1px solid rgba(180,160,210,0.06)", borderRadius: 8, padding: "7px 12px", cursor: "pointer", color: "rgba(200,190,230,0.35)", fontFamily: SANS, fontSize: "0.72rem", marginBottom: 4, transition: "all 0.15s" }} onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(180,160,210,0.2)"} onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(180,160,210,0.06)"}>
                  {reason}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "rgba(180,160,210,0.08)", margin: "24px 0 20px" }} />

        {/* Reply input */}
        <div style={{ marginBottom: 20, animation: "fadeUp .5s .1s ease both", opacity: 0 }}>
          <p style={{ fontFamily: SANS, fontSize: "0.65rem", color: "rgba(200,190,230,0.25)", margin: "0 0 8px" }}>
            Replying as <span style={{ color: "rgba(200,190,230,0.4)" }}>{anonName || "Anonymous"}</span>
            {replyingTo && <span> to a reply <button onClick={() => setReplyingTo(null)} style={{ background: "none", border: "none", color: "rgba(200,190,230,0.3)", cursor: "pointer", fontSize: "0.6rem", fontFamily: SANS }}>(cancel)</button></span>}
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <textarea value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Say something gentle..." style={{
              flex: 1, background: "rgba(180,160,210,0.06)", border: "1px solid rgba(180,160,210,0.1)",
              borderRadius: 12, padding: "10px 14px", color: "#E8E0F0", fontFamily: SANS, fontSize: "0.82rem",
              minHeight: 50, resize: "vertical", outline: "none", lineHeight: 1.6,
              transition: "border-color 0.2s",
            }} onFocus={e => e.target.style.borderColor = "rgba(180,160,210,0.25)"} onBlur={e => e.target.style.borderColor = "rgba(180,160,210,0.1)"} />
          </div>
          {replyText.trim() && (
            <button onClick={() => { if (onReply) onReply(replyingTo); setReplyingTo(null); }} disabled={replySubmitting || !replyText.trim()} style={{
              marginTop: 8, background: "rgba(180,160,210,0.1)", border: "1px solid rgba(180,160,210,0.2)",
              borderRadius: 10, padding: "8px 20px", cursor: "pointer", color: "#D8C8F0",
              fontFamily: SANS, fontSize: "0.74rem", fontWeight: 600, transition: "all 0.2s",
            }}>{replySubmitting ? "..." : "Reply"}</button>
          )}
        </div>

        {/* Replies */}
        <div style={{ animation: "fadeUp .5s .15s ease both", opacity: 0 }}>
          <p style={{ fontFamily: SANS, fontSize: "0.62rem", letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(200,190,230,0.2)", margin: "0 0 12px" }}>
            {visibleReplies.length} {visibleReplies.length === 1 ? "reply" : "replies"}
          </p>

          {loading && <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: "0.82rem", color: "rgba(200,190,230,0.25)" }}>Loading...</p>}

          {!loading && visibleReplies.length === 0 && (
            <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: "0.82rem", color: "rgba(200,190,230,0.2)" }}>No replies yet. Be the first to respond.</p>
          )}

          {topLevel.map((reply, idx) => (
            <div key={reply.id || idx}>
              <div style={{
                background: "rgba(20,18,32,0.4)", border: "1px solid rgba(180,160,210,0.06)",
                borderRadius: 12, padding: "12px 16px", marginBottom: 4,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <span style={{ fontFamily: SANS, fontSize: "0.68rem", color: "rgba(180,160,210,0.4)", fontWeight: 500 }}>{reply.anonymousName || "Anonymous"}</span>
                  <span style={{ fontFamily: SANS, fontSize: "0.58rem", color: "rgba(200,190,230,0.18)", marginLeft: "auto" }}>{fmtAgo(reply.createdAt)}</span>
                </div>
                <p style={{ fontFamily: SANS, fontSize: "0.8rem", color: "rgba(220,210,240,0.5)", margin: "0 0 6px", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{reply.body}</p>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setReplyingTo(reply.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(200,190,230,0.2)", fontFamily: SANS, fontSize: "0.6rem" }}>Reply</button>
                  {reply.anonymousName !== anonName && (
                    <button onClick={() => blockName(reply.anonymousName)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(200,190,230,0.12)", fontFamily: SANS, fontSize: "0.6rem" }}>Block</button>
                  )}
                </div>
              </div>
              {/* Nested replies (one level) */}
              {nested.filter(n => n.parentReplyId === reply.id).map((nr, ni) => (
                <div key={nr.id || ni} style={{
                  background: "rgba(20,18,32,0.3)", border: "1px solid rgba(180,160,210,0.04)",
                  borderLeft: "2px solid rgba(180,160,210,0.1)",
                  borderRadius: "0 12px 12px 0", padding: "10px 14px", marginLeft: 20, marginBottom: 4,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <span style={{ fontFamily: SANS, fontSize: "0.64rem", color: "rgba(180,160,210,0.35)" }}>{nr.anonymousName || "Anonymous"}</span>
                    <span style={{ fontFamily: SANS, fontSize: "0.55rem", color: "rgba(200,190,230,0.15)", marginLeft: "auto" }}>{fmtAgo(nr.createdAt)}</span>
                  </div>
                  <p style={{ fontFamily: SANS, fontSize: "0.76rem", color: "rgba(220,210,240,0.45)", margin: 0, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{nr.body}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
