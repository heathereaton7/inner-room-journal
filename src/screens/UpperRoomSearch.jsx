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
  return `${Math.floor(sec / 86400)}d ago`;
}

const FILTERS = [
  { id: "all", label: "All" },
  { id: "question", label: "Questions" },
  { id: "prayer", label: "Prayer Requests" },
  { id: "advice", label: "Advice" },
  { id: "vent", label: "Vents" },
];

export default function UpperRoomSearch({ onBack, onOpenPost, onOpenSpace, results, loading, onSearch, initialQuery }) {
  const [query, setQuery] = useState(initialQuery || "");
  const [filter, setFilter] = useState("all");

  const filtered = filter === "all" ? results : (results || []).filter(p => p.postType === filter);

  // Find matching spaces
  const matchingSpaces = query.length >= 2
    ? GATHERING_SPACES.filter(s => s.name.toLowerCase().includes(query.toLowerCase()) || s.description.toLowerCase().includes(query.toLowerCase()))
    : [];

  return (
    <div style={{ position: "fixed", inset: 0, background: "#0E0B14", fontFamily: SANS, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
      <style>{GFONTS}{CSS}</style>
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "28px 22px 100px" }}>

        <button onClick={onBack} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(180,160,210,0.12)", borderRadius: 999, padding: "8px 20px", cursor: "pointer", color: "rgba(230,220,248,0.45)", fontFamily: SANS, fontSize: "0.78rem", marginBottom: 24, display: "inline-flex", alignItems: "center", gap: 6 }}>
          Back to Gatherings
        </button>

        {/* Search bar */}
        <div style={{ position: "relative", marginBottom: 16, animation: "fadeUp .5s ease both" }}>
          <svg style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", opacity: 0.3 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D8C8F0" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && query.trim()) onSearch(query.trim()); }}
            placeholder="Search by need, not category..."
            autoFocus
            style={{
              width: "100%", boxSizing: "border-box",
              background: "rgba(180,160,210,0.06)", border: "1px solid rgba(180,160,210,0.15)",
              borderRadius: 14, padding: "12px 16px 12px 40px",
              color: "#E8E0F0", fontFamily: SANS, fontSize: "0.85rem", outline: "none",
            }}
          />
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 4, marginBottom: 18, flexWrap: "wrap", animation: "fadeUp .5s .05s ease both", opacity: 0 }}>
          {FILTERS.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} style={{
              background: filter === f.id ? "rgba(180,160,210,0.1)" : "transparent",
              border: `1px solid ${filter === f.id ? "rgba(180,160,210,0.25)" : "rgba(180,160,210,0.06)"}`,
              borderRadius: 99, padding: "4px 10px", cursor: "pointer",
              color: filter === f.id ? "#D8C8F0" : "rgba(200,190,230,0.3)",
              fontFamily: SANS, fontSize: "0.62rem", fontWeight: 600, transition: "all 0.15s",
            }}>{f.label}</button>
          ))}
        </div>

        {/* Matching spaces */}
        {matchingSpaces.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <p style={{ fontFamily: SANS, fontSize: "0.6rem", letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(200,190,230,0.2)", margin: "0 0 8px" }}>Related gatherings</p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {matchingSpaces.map(s => (
                <button key={s.id} onClick={() => onOpenSpace && onOpenSpace(s.id)} style={{
                  background: "rgba(180,160,210,0.06)", border: "1px solid rgba(180,160,210,0.1)",
                  borderRadius: 10, padding: "6px 12px", cursor: "pointer",
                  color: "rgba(200,190,230,0.45)", fontFamily: SERIF, fontStyle: "italic", fontSize: "0.76rem",
                  transition: "all 0.15s",
                }} onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(180,160,210,0.25)"} onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(180,160,210,0.1)"}>
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: "0.85rem", color: "rgba(200,190,230,0.3)", textAlign: "center", padding: "24px 0" }}>Searching...</p>}

        {/* Results */}
        {!loading && filtered.length > 0 && (
          <div>
            <p style={{ fontFamily: SANS, fontSize: "0.6rem", letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(200,190,230,0.2)", margin: "0 0 10px" }}>{filtered.length} {filtered.length === 1 ? "result" : "results"}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {filtered.map((post, idx) => {
                const space = GATHERING_SPACES.find(s => s.id === post.spaceId);
                const pt = POST_TYPES.find(p => p.id === post.postType);
                return (
                  <button key={post.id} onClick={() => onOpenPost && onOpenPost(post)} style={{
                    display: "block", width: "100%", textAlign: "left",
                    background: "rgba(20,18,32,0.55)", border: "1px solid rgba(180,160,210,0.08)",
                    borderRadius: 14, padding: "14px 16px", cursor: "pointer", transition: "all 0.15s",
                    animation: `fadeUp .4s ${idx * 0.03}s ease both`, opacity: 0,
                  }} onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(180,160,210,0.2)"} onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(180,160,210,0.08)"}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
                      <span style={{ fontFamily: SANS, fontSize: "0.62rem", color: "rgba(180,160,210,0.35)" }}>{post.anonymousName}</span>
                      {pt && <span style={{ fontFamily: SANS, fontSize: "0.55rem", color: "rgba(180,160,210,0.3)", background: "rgba(180,160,210,0.05)", borderRadius: 99, padding: "1px 6px" }}>{pt.label}</span>}
                      {space && <span style={{ fontFamily: SANS, fontSize: "0.55rem", color: "rgba(200,190,230,0.18)", marginLeft: "auto" }}>in {space.name}</span>}
                    </div>
                    <h3 style={{ fontFamily: SERIF, fontSize: "0.88rem", fontWeight: 600, color: "#D8C8F0", margin: "0 0 4px", lineHeight: 1.3 }}>{post.title}</h3>
                    <p style={{ fontFamily: SANS, fontSize: "0.72rem", color: "rgba(200,190,230,0.3)", margin: 0, lineHeight: 1.45, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{post.body}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* No results */}
        {!loading && query && filtered.length === 0 && results !== null && (
          <div style={{ textAlign: "center", padding: "32px 0", animation: "fadeUp .4s ease both" }}>
            <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: "0.88rem", color: "rgba(200,190,230,0.3)", margin: "0 0 8px" }}>Nothing found for "{query}"</p>
            <p style={{ fontFamily: SANS, fontSize: "0.72rem", color: "rgba(200,190,230,0.2)", margin: "0 0 16px" }}>Try different words, or start the conversation yourself.</p>
            {matchingSpaces.length === 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
                <p style={{ fontFamily: SANS, fontSize: "0.6rem", color: "rgba(200,190,230,0.2)", width: "100%", margin: "0 0 6px" }}>Related gatherings you might try:</p>
                {GATHERING_SPACES.slice(0, 4).map(s => (
                  <button key={s.id} onClick={() => onOpenSpace && onOpenSpace(s.id)} style={{
                    background: "rgba(180,160,210,0.05)", border: "1px solid rgba(180,160,210,0.08)",
                    borderRadius: 10, padding: "5px 12px", cursor: "pointer",
                    color: "rgba(200,190,230,0.35)", fontFamily: SANS, fontSize: "0.68rem",
                  }}>{s.name}</button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Initial state */}
        {!loading && !query && (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: "0.88rem", color: "rgba(200,190,230,0.25)" }}>Search by what you're feeling, not what you're looking for.</p>
            <p style={{ fontFamily: SANS, fontSize: "0.68rem", color: "rgba(200,190,230,0.15)", marginTop: 8, lineHeight: 1.5 }}>Try things like: "panic attack in church" or "too sick to work guilt"</p>
          </div>
        )}
      </div>
    </div>
  );
}
