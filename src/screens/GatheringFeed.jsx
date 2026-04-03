import { useState } from 'react';
import { B, SERIF, SANS, DISPLAY, GFONTS } from '../constants.js';
import { CSS } from '../styles.js';
import { GATHERING_SPACES, POST_TYPES } from '../gatherings.js';

function fmtAgo(ts) {
  if (!ts) return "";
  const sec = Math.floor((Date.now() - (ts.toDate ? ts.toDate().getTime() : new Date(ts).getTime())) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  if (sec < 604800) return `${Math.floor(sec / 86400)}d ago`;
  return `${Math.floor(sec / 604800)}w ago`;
}

function PostTypeLabel({ type }) {
  const pt = POST_TYPES.find(p => p.id === type);
  if (!pt) return null;
  const colors = {
    question: "rgba(100,180,220,0.5)", vent: "rgba(220,160,160,0.5)",
    testimony: "rgba(200,180,100,0.5)", advice: "rgba(180,200,160,0.5)",
    prayer: "rgba(160,140,200,0.5)", discussion: "rgba(180,180,180,0.4)",
  };
  return (
    <span style={{ fontFamily: SANS, fontSize: "0.58rem", color: colors[type] || "rgba(200,190,230,0.4)", background: "rgba(180,160,210,0.06)", border: "1px solid rgba(180,160,210,0.1)", borderRadius: 99, padding: "1px 8px", letterSpacing: "0.04em" }}>
      {pt.label}
    </span>
  );
}

export default function GatheringFeed({ spaceId, posts, loading, onBack, onOpenPost, onCreatePost }) {
  const [sort, setSort] = useState("newest");
  const space = GATHERING_SPACES.find(s => s.id === spaceId);

  const sorted = [...(posts || [])].sort((a, b) => {
    if (sort === "newest") return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
    if (sort === "helpful") return (b.reactionCounts?.helpful || 0) - (a.reactionCounts?.helpful || 0);
    if (sort === "unanswered") return (a.replyCount || 0) - (b.replyCount || 0);
    return 0;
  });

  return (
    <div style={{ position: "fixed", inset: 0, background: "#0E0B14", fontFamily: SANS, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
      <style>{GFONTS}{CSS}</style>
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "28px 22px 100px" }}>

        <button onClick={onBack} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(180,160,210,0.12)", borderRadius: 999, padding: "8px 20px", cursor: "pointer", color: "rgba(230,220,248,0.45)", fontFamily: SANS, fontSize: "0.78rem", marginBottom: 28, display: "inline-flex", alignItems: "center", gap: 6 }}>
          Back to Gatherings
        </button>

        {/* Space header */}
        <div style={{ textAlign: "center", marginBottom: 24, animation: "fadeUp .3s ease both" }}>
          <h1 style={{ fontFamily: DISPLAY, fontSize: "1.4rem", fontWeight: 700, color: "#D8C8F0", margin: "0 0 6px" }}>{space?.name || "Gathering"}</h1>
          <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: "0.82rem", color: "rgba(200,190,230,0.35)", margin: 0 }}>{space?.description || ""}</p>
          {space?.rules && (
            <div style={{ marginTop: 10, padding: "8px 14px", background: "rgba(180,160,210,0.03)", border: "1px solid rgba(180,160,210,0.06)", borderRadius: 10, display: "inline-block" }}>
              <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: "0.7rem", color: "rgba(200,190,230,0.25)", margin: 0, lineHeight: 1.5 }}>{space.rules}</p>
            </div>
          )}
          {space?.isSensitive && (
            <div style={{ marginTop: 6, padding: "6px 14px", background: "rgba(180,160,210,0.04)", border: "1px solid rgba(180,160,210,0.08)", borderRadius: 10, display: "inline-block" }}>
              <p style={{ fontFamily: SANS, fontSize: "0.65rem", color: "rgba(200,190,230,0.3)", margin: 0 }}>This is a sensitive space. Please be gentle.</p>
            </div>
          )}
        </div>

        {/* Sort + Create */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18, animation: "fadeUp .3s .04s ease both", opacity: 0 }}>
          <div style={{ display: "flex", gap: 4, flex: 1 }}>
            {[["newest", "Newest"], ["helpful", "Most Helpful"], ["unanswered", "Unanswered"]].map(([k, label]) => (
              <button key={k} onClick={() => setSort(k)} style={{
                background: sort === k ? "rgba(180,160,210,0.1)" : "transparent",
                border: `1px solid ${sort === k ? "rgba(180,160,210,0.25)" : "rgba(180,160,210,0.06)"}`,
                borderRadius: 99, padding: "4px 10px", cursor: "pointer",
                color: sort === k ? "#D8C8F0" : "rgba(200,190,230,0.3)",
                fontFamily: SANS, fontSize: "0.62rem", fontWeight: 600, transition: "all 0.15s",
              }}>{label}</button>
            ))}
          </div>
          <button onClick={onCreatePost} style={{
            background: "rgba(180,160,210,0.1)", border: "1px solid rgba(180,160,210,0.2)",
            borderRadius: 10, padding: "6px 14px", cursor: "pointer",
            color: "#D8C8F0", fontFamily: SANS, fontSize: "0.7rem", fontWeight: 600,
            transition: "all 0.2s",
          }}>
            + Post
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: "0.85rem", color: "rgba(200,190,230,0.3)" }}>Loading...</p>
          </div>
        )}

        {/* Posts */}
        {!loading && sorted.length === 0 && (
          <div style={{ textAlign: "center", padding: "32px 0", animation: "fadeUp .25s ease both" }}>
            <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: "0.88rem", color: "rgba(200,190,230,0.3)", margin: "0 0 12px" }}>This gathering is waiting for its first voice.</p>
            <button onClick={onCreatePost} style={{
              background: "rgba(180,160,210,0.08)", border: "1px solid rgba(180,160,210,0.15)",
              borderRadius: 12, padding: "10px 24px", cursor: "pointer",
              color: "rgba(200,190,230,0.5)", fontFamily: SERIF, fontStyle: "italic", fontSize: "0.82rem",
            }}>Be the first to share</button>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {sorted.map((post, idx) => {
            const totalReactions = Object.values(post.reactionCounts || {}).reduce((s, v) => s + v, 0);
            return (
              <button key={post.id} onClick={() => onOpenPost && onOpenPost(post.id)} style={{
                display: "block", width: "100%", textAlign: "left",
                background: "rgba(20,18,32,0.55)", backdropFilter: "blur(10px)",
                border: "1px solid rgba(180,160,210,0.08)", borderRadius: 14,
                padding: "16px 18px", cursor: "pointer", transition: "all 0.2s",
                animation: `fadeUp .4s ${0.15 + idx * 0.03}s ease both`, opacity: 0,
              }} onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(180,160,210,0.2)"} onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(180,160,210,0.08)"}>
                {/* Meta row */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
                  <span style={{ fontFamily: SANS, fontSize: "0.68rem", color: "rgba(180,160,210,0.4)", fontWeight: 500 }}>{post.anonymousName || "Anonymous"}</span>
                  <PostTypeLabel type={post.postType} />
                  <span style={{ fontFamily: SANS, fontSize: "0.6rem", color: "rgba(200,190,230,0.2)", marginLeft: "auto" }}>{fmtAgo(post.createdAt)}</span>
                </div>
                {/* Title */}
                <h3 style={{ fontFamily: SERIF, fontSize: "0.92rem", fontWeight: 600, color: "#D8C8F0", margin: "0 0 4px", lineHeight: 1.35 }}>{post.title}</h3>
                {/* Body preview */}
                <p style={{ fontFamily: SANS, fontSize: "0.76rem", color: "rgba(200,190,230,0.35)", margin: "0 0 10px", lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                  {post.body}
                </p>
                {/* Footer */}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {totalReactions > 0 && (
                    <span style={{ fontFamily: SANS, fontSize: "0.62rem", color: "rgba(200,190,230,0.25)" }}>{totalReactions} {totalReactions === 1 ? "response" : "responses"}</span>
                  )}
                  {(post.replyCount || 0) > 0 && (
                    <span style={{ fontFamily: SANS, fontSize: "0.62rem", color: "rgba(200,190,230,0.25)" }}>{post.replyCount} {post.replyCount === 1 ? "reply" : "replies"}</span>
                  )}
                  {/* Tags */}
                  {post.tags?.slice(0, 3).map(t => (
                    <span key={t} style={{ fontFamily: SANS, fontSize: "0.58rem", color: "rgba(200,190,230,0.2)", background: "rgba(180,160,210,0.04)", borderRadius: 99, padding: "1px 6px" }}>{t}</span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
