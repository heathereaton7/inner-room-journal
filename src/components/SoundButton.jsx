import { useEffect, useState } from "react";
import {
  SOUND_LIBRARY,
  ambientPlay,
  ambientStop,
  ambientIsPlaying,
  ambientCurrentId,
} from "../systems/ambientSound.js";

const SERIF = "'Cormorant Garamond', Georgia, serif";
const SANS = "'Inter', system-ui, sans-serif";
const GOLD_L = "rgba(255,240,200,0.7)";

/**
 * Floating ambient sound picker.
 * Tap the speaker icon to open a small drawer with the SOUND_LIBRARY.
 * Position defaults to bottom-right; can be moved via `position` prop.
 */
export default function SoundButton({ position = { bottom: 18, right: 18 } }) {
  const [open, setOpen] = useState(false);
  const [, force] = useState(0);

  // Tick every 600ms to keep "currently playing" indicator fresh
  useEffect(() => {
    const t = setInterval(() => force(n => n + 1), 600);
    return () => clearInterval(t);
  }, []);

  const playingId = ambientCurrentId();
  const anyPlaying = !!playingId;
  const playingName = SOUND_LIBRARY.find(s => s.id === playingId)?.name;

  return (
    <>
      {/* Floating speaker button */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Ambient sounds"
        style={{
          position: "fixed",
          ...position,
          zIndex: 70,
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: "rgba(26,22,18,0.85)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          border: "1px solid rgba(201,169,110,0.3)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 16px rgba(0,0,0,0.35)",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
             stroke={anyPlaying ? "rgba(190,211,196,0.85)" : "rgba(201,169,110,0.65)"}
             strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        </svg>
        {anyPlaying && (
          <span style={{
            position: "absolute", top: 4, right: 4,
            width: 8, height: 8, borderRadius: "50%",
            background: "rgba(90,138,106,0.85)",
            animation: "gentlePulse 1.5s infinite",
          }} />
        )}
      </button>

      {/* Backdrop */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: "fixed", inset: 0, zIndex: 68, background: "rgba(10,8,6,0.4)" }}
        />
      )}

      {/* Drawer panel */}
      {open && (
        <div style={{
          position: "fixed",
          bottom: (position.bottom ?? 18) + 56,
          right: position.right ?? 18,
          left: position.left,
          zIndex: 71,
          width: "min(320px, calc(100vw - 32px))",
          background: "rgba(26,22,18,0.96)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(201,169,110,0.2)",
          borderRadius: 14,
          padding: 14,
          boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
        }}>
          <div style={{
            fontFamily: SERIF, fontStyle: "italic", fontSize: "0.85rem",
            color: GOLD_L, marginBottom: 10, letterSpacing: "0.02em",
          }}>
            Ambient Sounds
          </div>

          {anyPlaying && (
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              marginBottom: 10, padding: "7px 11px",
              background: "rgba(90,138,106,0.08)",
              border: "1px solid rgba(90,138,106,0.18)",
              borderRadius: 8,
            }}>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 11 }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: 2.5, borderRadius: 1, background: "rgba(90,138,106,0.65)",
                    animation: `soundBar 0.${6 + i * 2}s ease-in-out infinite alternate`,
                    animationDelay: `${i * 0.15}s`,
                    height: i === 1 ? "100%" : "60%",
                  }} />
                ))}
              </div>
              <span style={{
                fontFamily: SANS, fontSize: "0.7rem",
                color: "rgba(190,211,196,0.65)", flex: 1,
              }}>{playingName || "Playing"}</span>
              <button
                onClick={() => { ambientStop(800); force(n => n + 1); }}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(255,100,100,0.18)",
                  borderRadius: 6, padding: "3px 8px", cursor: "pointer",
                  color: "rgba(255,150,150,0.6)", fontSize: "0.62rem",
                  fontFamily: SANS, fontWeight: 600,
                }}
              >Stop</button>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {SOUND_LIBRARY.map(sound => {
              const active = ambientIsPlaying(sound.id);
              return (
                <button
                  key={sound.id}
                  onClick={() => {
                    if (active) ambientStop(800);
                    else ambientPlay(sound.src, { volume: sound.volume, fadeMs: 1200, id: sound.id });
                    force(n => n + 1);
                  }}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    background: active ? "rgba(90,138,106,0.1)" : "rgba(255,255,255,0.03)",
                    border: "1px solid " + (active ? "rgba(90,138,106,0.25)" : "rgba(201,169,110,0.1)"),
                    borderRadius: 10, padding: "9px 12px", cursor: "pointer",
                    width: "100%", textAlign: "left",
                  }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: active ? "rgba(90,138,106,0.22)" : "rgba(201,169,110,0.1)",
                    border: "1px solid " + (active ? "rgba(90,138,106,0.35)" : "rgba(201,169,110,0.18)"),
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    {active
                      ? <svg width="11" height="11" viewBox="0 0 24 24" fill="rgba(190,211,196,0.85)" stroke="none"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
                      : <svg width="11" height="11" viewBox="0 0 24 24" fill="rgba(201,169,110,0.75)" stroke="none"><polygon points="6,3 20,12 6,21" /></svg>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: SERIF, fontSize: "0.82rem",
                      color: active ? "rgba(190,211,196,0.95)" : GOLD_L, fontWeight: 500,
                    }}>{sound.name}</div>
                    <div style={{
                      fontFamily: SANS, fontSize: "0.65rem",
                      color: "rgba(255,248,232,0.3)", lineHeight: 1.3,
                    }}>{sound.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
