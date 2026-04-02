import { useState } from 'react';
import { B, SERIF, SANS, DISPLAY, GFONTS } from '../constants.js';
import { CSS } from '../styles.js';
import { GATHERING_SPACES } from '../gatherings.js';

// Simple SVG icons for each space
function SpaceIcon({ icon, size = 22, color = "rgba(201,169,110,0.55)" }) {
  const s = { width: size, height: size, flexShrink: 0 };
  const p = { fill: "none", stroke: color, strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" };
  switch (icon) {
    case "pray":     return <svg viewBox="0 0 24 24" style={s} {...p}><path d="M12 2v4M8 6l1 6-3 4h12l-3-4 1-6M9 22h6"/></svg>;
    case "heart":    return <svg viewBox="0 0 24 24" style={s} {...p}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg>;
    case "home":     return <svg viewBox="0 0 24 24" style={s} {...p}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
    case "cloud":    return <svg viewBox="0 0 24 24" style={s} {...p}><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>;
    case "book":     return <svg viewBox="0 0 24 24" style={s} {...p}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>;
    case "seedling": return <svg viewBox="0 0 24 24" style={s} {...p}><path d="M12 22V12M12 12C12 12 7 10 7 5c3 0 5 2 5 7M12 12c0-5 2-7 5-7 0 5-5 7-5 7"/></svg>;
    case "leaf":     return <svg viewBox="0 0 24 24" style={s} {...p}><path d="M17 8C8 10 5.9 16.17 3.82 21.34M17 8c2-1 5-1 5 3-2 5-8 6-14 6M17 8l-4 4"/></svg>;
    case "feather":  return <svg viewBox="0 0 24 24" style={s} {...p}><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><line x1="16" y1="8" x2="2" y2="22"/><line x1="17.5" y1="15" x2="9" y2="15"/></svg>;
    case "flame":    return <svg viewBox="0 0 24 24" style={s} {...p}><path d="M12 22c-4 0-7-3-7-7 0-3 2-5 4-8 1 2 3 3 3 6 1-1 2-3 2-5 3 3 5 5 5 7 0 4-3 7-7 7z"/></svg>;
    default:         return <svg viewBox="0 0 24 24" style={s} {...p}><circle cx="12" cy="12" r="10"/></svg>;
  }
}

export default function UpperRoomGatherings({ onBack, onOpenSpace, onSearch, spaceCounts, recentPosts, onOpenPost, savedPosts }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sensitiveGate, setSensitiveGate] = useState(null);
  const counts = spaceCounts || {};
  const recent = (recentPosts || []).slice(0, 3);

  const handleOpenSpace = (space) => {
    if (space.isSensitive) { setSensitiveGate(space.id); return; }
    if (onOpenSpace) onOpenSpace(space.id);
  };
  const confirmSensitive = () => { if (onOpenSpace) onOpenSpace(sensitiveGate); setSensitiveGate(null); };

  const filtered = searchQuery
    ? GATHERING_SPACES.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : GATHERING_SPACES;

  return (
    <div style={{ position: "fixed", inset: 0, background: "#0E0B14", fontFamily: SANS, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
      <style>{GFONTS}{CSS}</style>
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "28px 22px 100px" }}>

        {/* Back */}
        <button onClick={onBack} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(180,160,210,0.12)", borderRadius: 999, padding: "8px 20px", cursor: "pointer", color: "rgba(230,220,248,0.45)", fontFamily: SANS, fontSize: "0.78rem", marginBottom: 28, display: "inline-flex", alignItems: "center", gap: 6 }}>
          Back to Upper Room
        </button>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28, animation: "fadeUp .6s ease both" }}>
          <h1 style={{ fontFamily: DISPLAY, fontSize: "1.6rem", fontWeight: 700, color: "#D8C8F0", margin: "0 0 8px", textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}>Gatherings</h1>
          <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: "0.88rem", color: "rgba(200,190,230,0.4)", margin: "0 0 6px" }}>A place to be heard, without being seen.</p>
          <div style={{ width: 50, height: 1, background: "rgba(180,160,210,0.25)", margin: "12px auto 0" }} />
        </div>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: 24, animation: "fadeUp .6s .1s ease both", opacity: 0 }}>
          <svg style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", opacity: 0.3 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D8C8F0" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && searchQuery.trim() && onSearch) onSearch(searchQuery.trim()); }}
            placeholder="Search by need, not category..."
            style={{
              width: "100%", boxSizing: "border-box",
              background: "rgba(180,160,210,0.06)", border: "1px solid rgba(180,160,210,0.12)",
              borderRadius: 14, padding: "12px 16px 12px 40px",
              color: "#E8E0F0", fontFamily: SANS, fontSize: "0.85rem",
              outline: "none", transition: "border-color 0.2s",
            }}
            onFocus={e => e.target.style.borderColor = "rgba(180,160,210,0.3)"}
            onBlur={e => e.target.style.borderColor = "rgba(180,160,210,0.12)"}
          />
        </div>

        {/* Space Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((space, idx) => (
            <button
              key={space.id}
              onClick={() => handleOpenSpace(space)}
              style={{
                display: "flex", alignItems: "center", gap: 14,
                background: "rgba(20,18,32,0.55)",
                backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
                border: "1px solid rgba(180,160,210,0.10)",
                borderRadius: 16, padding: "16px 18px",
                cursor: "pointer", textAlign: "left",
                transition: "all 0.2s",
                animation: `fadeUp .5s ${0.15 + idx * 0.04}s ease both`, opacity: 0,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(180,160,210,0.25)"; e.currentTarget.style.background = "rgba(20,18,32,0.7)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(180,160,210,0.10)"; e.currentTarget.style.background = "rgba(20,18,32,0.55)"; }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(180,160,210,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <SpaceIcon icon={space.icon} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                  <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: "0.92rem", color: "#D8C8F0" }}>{space.name}</span>
                  {space.isSensitive && (
                    <span style={{ fontFamily: SANS, fontSize: "0.52rem", color: "rgba(200,190,230,0.35)", background: "rgba(180,160,210,0.08)", border: "1px solid rgba(180,160,210,0.12)", borderRadius: 99, padding: "1px 6px", letterSpacing: "0.04em" }}>sensitive</span>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <p style={{ fontFamily: SANS, fontSize: "0.72rem", color: "rgba(200,190,230,0.35)", margin: 0, lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{space.description}</p>
                  {counts[space.id] > 0 && (
                    <span style={{ fontFamily: SANS, fontSize: "0.58rem", color: "rgba(200,190,230,0.2)", flexShrink: 0 }}>{counts[space.id]} posts</span>
                  )}
                </div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(180,160,210,0.25)" strokeWidth="2" style={{ flexShrink: 0 }}><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          ))}
        </div>

        {/* Empty state for search */}
        {filtered.length === 0 && searchQuery && (
          <div style={{ textAlign: "center", padding: "32px 0", animation: "fadeUp .4s ease both" }}>
            <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: "0.88rem", color: "rgba(200,190,230,0.3)", margin: "0 0 12px" }}>No gatherings match "{searchQuery}"</p>
            <p style={{ fontFamily: SANS, fontSize: "0.72rem", color: "rgba(200,190,230,0.2)", margin: 0 }}>Try searching across all posts instead</p>
            {onSearch && (
              <button onClick={() => onSearch(searchQuery)} style={{ marginTop: 12, background: "rgba(180,160,210,0.08)", border: "1px solid rgba(180,160,210,0.15)", borderRadius: 12, padding: "8px 20px", cursor: "pointer", color: "rgba(200,190,230,0.5)", fontFamily: SANS, fontSize: "0.74rem" }}>
                Search all posts
              </button>
            )}
          </div>
        )}

        {/* Saved posts */}
        {(savedPosts||[]).length > 0 && !searchQuery && (
          <div style={{ marginTop: 20, animation: "fadeUp .5s .35s ease both", opacity: 0 }}>
            <p style={{ fontFamily: SANS, fontSize: "0.62rem", letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(200,190,230,0.2)", margin: "0 0 10px" }}>Saved</p>
            {(savedPosts||[]).slice(0, 3).map((post, idx) => {
              const space = GATHERING_SPACES.find(s => s.id === post.spaceId);
              return (
                <button key={post.id} onClick={() => onOpenPost && onOpenPost(post)} style={{
                  display: "block", width: "100%", textAlign: "left",
                  background: "rgba(201,169,110,0.04)", border: "1px solid rgba(201,169,110,0.08)",
                  borderRadius: 12, padding: "12px 14px", marginBottom: 6, cursor: "pointer",
                  transition: "all 0.15s",
                }} onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(201,169,110,0.2)"} onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(201,169,110,0.08)"}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                    <span style={{ fontFamily: SANS, fontSize: "0.62rem", color: "rgba(201,169,110,0.35)" }}>{post.anonymousName}</span>
                    {space && <span style={{ fontFamily: SANS, fontSize: "0.55rem", color: "rgba(200,190,230,0.18)" }}>in {space.name}</span>}
                  </div>
                  <p style={{ fontFamily: SERIF, fontSize: "0.82rem", color: "rgba(200,190,230,0.5)", margin: 0, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{post.title}</p>
                </button>
              );
            })}
          </div>
        )}

        {/* Recent activity */}
        {recent.length > 0 && !searchQuery && (
          <div style={{ marginTop: 24, animation: "fadeUp .5s .4s ease both", opacity: 0 }}>
            <p style={{ fontFamily: SANS, fontSize: "0.62rem", letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(200,190,230,0.2)", margin: "0 0 10px" }}>Recent voices</p>
            {recent.map((post, idx) => {
              const space = GATHERING_SPACES.find(s => s.id === post.spaceId);
              return (
                <button key={post.id} onClick={() => onOpenPost && onOpenPost(post)} style={{
                  display: "block", width: "100%", textAlign: "left",
                  background: "rgba(20,18,32,0.35)", border: "1px solid rgba(180,160,210,0.06)",
                  borderRadius: 12, padding: "12px 14px", marginBottom: 6, cursor: "pointer",
                  transition: "all 0.15s",
                }} onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(180,160,210,0.15)"} onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(180,160,210,0.06)"}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                    <span style={{ fontFamily: SANS, fontSize: "0.62rem", color: "rgba(180,160,210,0.35)" }}>{post.anonymousName}</span>
                    {space && <span style={{ fontFamily: SANS, fontSize: "0.55rem", color: "rgba(200,190,230,0.18)" }}>in {space.name}</span>}
                  </div>
                  <p style={{ fontFamily: SERIF, fontSize: "0.82rem", color: "rgba(200,190,230,0.5)", margin: 0, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{post.title}</p>
                </button>
              );
            })}
          </div>
        )}

        {/* Footer note */}
        <div style={{ textAlign: "center", marginTop: 24, animation: "fadeUp .5s .5s ease both", opacity: 0 }}>
          <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: "0.72rem", color: "rgba(200,190,230,0.18)", margin: 0, lineHeight: 1.5 }}>
            Everything shared here is anonymous. You are known by a name given to you, not the one you carry outside.
          </p>
        </div>
      </div>

      {/* Sensitive space content warning */}
      {sensitiveGate && (
        <div onClick={() => setSensitiveGate(null)} style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(6,4,12,0.85)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", animation: "fadeUp .2s ease both" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#14111E", border: "1px solid rgba(180,160,210,0.15)", borderRadius: 18, padding: "28px 24px", maxWidth: 360, width: "88%", textAlign: "center" }}>
            <div style={{ width: 40, height: 1, background: "rgba(180,160,210,0.2)", margin: "0 auto 16px" }} />
            <h2 style={{ fontFamily: DISPLAY, fontSize: "1.1rem", fontWeight: 700, color: "#D8C8F0", margin: "0 0 10px" }}>A gentle notice</h2>
            <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: "0.85rem", color: "rgba(200,190,230,0.45)", margin: "0 0 8px", lineHeight: 1.6 }}>
              This gathering may contain sensitive topics including pain, illness, grief, or emotional struggle.
            </p>
            <p style={{ fontFamily: SANS, fontSize: "0.72rem", color: "rgba(200,190,230,0.3)", margin: "0 0 20px", lineHeight: 1.5 }}>
              Please be gentle with yourself and others.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setSensitiveGate(null)} style={{ flex: 1, background: "transparent", border: "1px solid rgba(180,160,210,0.12)", borderRadius: 12, padding: "11px 0", cursor: "pointer", color: "rgba(200,190,230,0.4)", fontFamily: SANS, fontSize: "0.78rem" }}>
                Go back
              </button>
              <button onClick={confirmSensitive} style={{ flex: 1, background: "rgba(180,160,210,0.1)", border: "1px solid rgba(180,160,210,0.25)", borderRadius: 12, padding: "11px 0", cursor: "pointer", color: "#D8C8F0", fontFamily: SANS, fontSize: "0.78rem", fontWeight: 600 }}>
                I understand
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
