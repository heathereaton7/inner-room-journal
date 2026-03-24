import { useState, useEffect, useRef, useCallback } from 'react';
import { B, SERIF, SANS, DISPLAY, GFONTS } from '../constants.js';
import { CSS } from '../styles.js';

const MOODS = ["Peaceful","Anxious","Overwhelmed","Hopeful","Tired","Grateful","Heavy","Restless"];
const SYMPTOMS = ["Headache","Migraine","Fatigue","Nausea","Pain","Brain fog","Dizziness","Tension","Weakness","Restless"];
const INTENSITY_STOPS = [
  { value: 0, label: "Light", icon: "\ud83c\udf3f" },
  { value: 1, label: "Moderate", icon: "\ud83c\udf3e" },
  { value: 2, label: "Heavy", icon: "\ud83c\udf27\ufe0f" },
];

export default function CheckInScreen({ onBack, onSave, onPrayWith, initialData }) {
  const [moods, setMoods] = useState(initialData?.mood || []);
  const [symptoms, setSymptoms] = useState(initialData?.symptoms || []);
  const [customSymptom, setCustomSymptom] = useState("");
  const [intensity, setIntensity] = useState(initialData?.intensity ?? 0);
  const [reflection, setReflection] = useState(initialData?.reflection || "");
  const [saveMsg, setSaveMsg] = useState("");
  const [showedUp, setShowedUp] = useState(false);
  const debounceRef = useRef(null);
  const interactionCount = useRef(0);

  const todayKey = new Date().toISOString().slice(0, 10);

  // Count meaningful interactions
  const sectionsUsed = (moods.length > 0 ? 1 : 0) + (symptoms.length > 0 ? 1 : 0) + (reflection.length > 10 ? 1 : 0);

  // Debounced auto-save
  const triggerSave = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const data = {
        date: todayKey,
        mood: moods,
        symptoms: symptoms,
        intensity: INTENSITY_STOPS[intensity].label.toLowerCase(),
        reflection: reflection,
      };
      if (onSave) onSave(data);
      setSaveMsg("Saved just now");
      setTimeout(() => setSaveMsg(""), 2500);
    }, 600);
  }, [moods, symptoms, intensity, reflection, onSave, todayKey]);

  // Auto-save on any change
  useEffect(() => {
    if (moods.length || symptoms.length || reflection) triggerSave();
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [moods, symptoms, intensity, reflection, triggerSave]);

  // "You showed up" micro-feedback
  useEffect(() => {
    if (sectionsUsed >= 2 && !showedUp) {
      setTimeout(() => setShowedUp(true), 800);
    }
  }, [sectionsUsed, showedUp]);

  const toggleMood = (m) => setMoods(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
  const toggleSymptom = (s) => setSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  const addCustomSymptom = () => {
    const s = customSymptom.trim();
    if (s && !symptoms.includes(s)) { setSymptoms(prev => [...prev, s]); setCustomSymptom(""); }
  };

  const hasData = moods.length > 0 || symptoms.length > 0 || reflection.length > 0;
  const isHeavy = INTENSITY_STOPS[intensity].label === "Heavy";

  return (
    <div style={{ position: "fixed", inset: 0, background: B.night, fontFamily: SANS, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
      <style>{GFONTS}{CSS}</style>
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "28px 22px 100px" }}>

        {/* Back button */}
        <button onClick={onBack} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(201,169,110,0.12)", borderRadius: 999, padding: "8px 20px", cursor: "pointer", color: "rgba(255,248,232,0.45)", fontFamily: SANS, fontSize: "0.78rem", marginBottom: 28, display: "inline-flex", alignItems: "center", gap: 6, transition: "all 0.2s" }}>
          Back
        </button>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32, animation: "fadeUp .6s ease both" }}>
          <h1 style={{ fontFamily: DISPLAY, fontSize: "1.5rem", fontWeight: 700, color: B.goldL, margin: "0 0 8px" }}>Body & Mind Check-In</h1>
          <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: "0.88rem", color: "rgba(255,248,232,0.35)", margin: 0 }}>Take a moment to notice what you're carrying today</p>
          <div style={{ width: 50, height: 1, background: "rgba(201,169,110,0.25)", margin: "14px auto 0" }} />
        </div>

        {/* ── MOOD SECTION ── */}
        <div style={{ marginBottom: 28, animation: "fadeUp .6s .1s ease both", opacity: 0 }}>
          <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: "0.92rem", color: "rgba(255,248,232,0.55)", margin: "0 0 12px" }}>
            How does your heart feel today?
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {MOODS.map(m => {
              const sel = moods.includes(m);
              return (
                <button key={m} onClick={() => toggleMood(m)} style={{
                  background: sel ? "rgba(201,169,110,0.15)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${sel ? "rgba(201,169,110,0.45)" : "rgba(201,169,110,0.10)"}`,
                  borderRadius: 20, padding: "8px 16px", cursor: "pointer",
                  color: sel ? B.goldL : "rgba(255,248,232,0.4)",
                  fontFamily: SANS, fontSize: "0.78rem", fontWeight: 500,
                  transition: "all 0.2s",
                  boxShadow: sel ? "0 0 14px rgba(201,169,110,0.12)" : "none",
                }}>
                  {m}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── BODY SECTION ── */}
        <div style={{ marginBottom: 28, animation: "fadeUp .6s .2s ease both", opacity: 0 }}>
          <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: "0.92rem", color: "rgba(255,248,232,0.55)", margin: "0 0 12px" }}>
            What is your body feeling?
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {SYMPTOMS.map(s => {
              const sel = symptoms.includes(s);
              return (
                <button key={s} onClick={() => toggleSymptom(s)} style={{
                  background: sel ? "rgba(190,211,196,0.12)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${sel ? "rgba(190,211,196,0.35)" : "rgba(201,169,110,0.10)"}`,
                  borderRadius: 20, padding: "8px 16px", cursor: "pointer",
                  color: sel ? B.sage : "rgba(255,248,232,0.4)",
                  fontFamily: SANS, fontSize: "0.78rem", fontWeight: 500,
                  transition: "all 0.2s",
                  boxShadow: sel ? "0 0 14px rgba(190,211,196,0.08)" : "none",
                }}>
                  {s}
                </button>
              );
            })}
            {/* Custom symptoms already added */}
            {symptoms.filter(s => !SYMPTOMS.includes(s)).map(s => (
              <button key={s} onClick={() => toggleSymptom(s)} style={{
                background: "rgba(190,211,196,0.12)", border: "1px solid rgba(190,211,196,0.35)",
                borderRadius: 20, padding: "8px 16px", cursor: "pointer",
                color: B.sage, fontFamily: SANS, fontSize: "0.78rem", fontWeight: 500,
                transition: "all 0.2s",
              }}>
                {s}
              </button>
            ))}
          </div>
          {/* Something else input */}
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <input value={customSymptom} onChange={e => setCustomSymptom(e.target.value)} onKeyDown={e => { if (e.key === "Enter") addCustomSymptom(); }} placeholder="Something else..." style={{
              flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,169,110,0.10)",
              borderRadius: 12, padding: "8px 14px", color: B.goldL, fontFamily: SANS, fontSize: "0.78rem",
              outline: "none", transition: "border-color 0.2s",
            }} onFocus={e => e.target.style.borderColor = "rgba(201,169,110,0.3)"} onBlur={e => e.target.style.borderColor = "rgba(201,169,110,0.10)"} />
            {customSymptom.trim() && (
              <button onClick={addCustomSymptom} style={{
                background: "rgba(201,169,110,0.1)", border: "1px solid rgba(201,169,110,0.25)",
                borderRadius: 12, padding: "8px 14px", cursor: "pointer", color: B.gold,
                fontFamily: SANS, fontSize: "0.74rem", fontWeight: 600, transition: "all 0.2s",
              }}>Add</button>
            )}
          </div>
        </div>

        {/* ── INTENSITY ── */}
        <div style={{ marginBottom: 28, animation: "fadeUp .6s .3s ease both", opacity: 0 }}>
          <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: "0.92rem", color: "rgba(255,248,232,0.55)", margin: "0 0 14px" }}>
            How heavy does it feel today?
          </p>
          <div style={{ display: "flex", gap: 0, borderRadius: 14, overflow: "hidden", border: "1px solid rgba(201,169,110,0.12)" }}>
            {INTENSITY_STOPS.map((stop, i) => (
              <button key={stop.value} onClick={() => setIntensity(i)} style={{
                flex: 1, padding: "14px 0", cursor: "pointer", border: "none",
                background: intensity === i ? "rgba(201,169,110,0.12)" : "rgba(255,255,255,0.02)",
                color: intensity === i ? B.goldL : "rgba(255,248,232,0.3)",
                fontFamily: SANS, fontSize: "0.76rem", fontWeight: 600,
                transition: "all 0.2s", textAlign: "center",
                borderRight: i < 2 ? "1px solid rgba(201,169,110,0.08)" : "none",
              }}>
                <span style={{ display: "block", fontSize: "1.1rem", marginBottom: 4 }}>{stop.icon}</span>
                {stop.label}
              </button>
            ))}
          </div>
          {/* Heavy day message */}
          {isHeavy && hasData && (
            <div style={{ marginTop: 12, padding: "12px 16px", background: "rgba(201,169,110,0.06)", border: "1px solid rgba(201,169,110,0.12)", borderRadius: 12, animation: "fadeUp .4s ease both" }}>
              <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: "0.82rem", color: "rgba(255,248,232,0.45)", margin: 0, lineHeight: 1.6 }}>
                Today may be a heavier day. Be gentle with yourself.
              </p>
            </div>
          )}
        </div>

        {/* ── REFLECTION ── */}
        <div style={{ marginBottom: 28, animation: "fadeUp .6s .4s ease both", opacity: 0 }}>
          <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: "0.92rem", color: "rgba(255,248,232,0.55)", margin: "0 0 12px" }}>
            Would you like to put words to this?
          </p>
          <textarea value={reflection} onChange={e => setReflection(e.target.value)} placeholder="You can write freely here..." style={{
            width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(201,169,110,0.10)", borderRadius: 14,
            padding: "14px 16px", color: B.goldL, fontFamily: SERIF, fontSize: "0.9rem",
            minHeight: 90, resize: "vertical", outline: "none", lineHeight: 1.7,
            transition: "border-color 0.2s",
          }} onFocus={e => e.target.style.borderColor = "rgba(201,169,110,0.3)"} onBlur={e => e.target.style.borderColor = "rgba(201,169,110,0.10)"} />
        </div>

        {/* ── PRAYER OPTION ── */}
        {hasData && (
          <div style={{ marginBottom: 28, animation: "fadeUp .5s ease both" }}>
            <div style={{ textAlign: "center", marginBottom: 10 }}>
              <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: "0.85rem", color: "rgba(255,248,232,0.35)", margin: 0 }}>
                Would you like to bring this to God?
              </p>
            </div>
            <button onClick={() => {
              const text = [
                moods.length ? `Feeling: ${moods.join(", ")}` : "",
                symptoms.length ? `Body: ${symptoms.join(", ")}` : "",
                reflection ? `"${reflection.slice(0, 120)}"` : "",
              ].filter(Boolean).join(" — ");
              if (onPrayWith) onPrayWith(text);
            }} style={{
              width: "100%", background: "rgba(90,138,106,0.1)", border: "1px solid rgba(90,138,106,0.25)",
              borderRadius: 14, padding: "14px 0", cursor: "pointer", color: B.sage,
              fontFamily: SERIF, fontStyle: "italic", fontSize: "0.88rem", fontWeight: 600,
              transition: "all 0.2s", letterSpacing: "0.03em",
            }} onMouseEnter={e => e.currentTarget.style.background = "rgba(90,138,106,0.2)"} onMouseLeave={e => e.currentTarget.style.background = "rgba(90,138,106,0.1)"}>
              Pray with this
            </button>
          </div>
        )}

        {/* ── MICRO-FEEDBACK ── */}
        {showedUp && (
          <div style={{ textAlign: "center", padding: "16px 0", animation: "fadeUp .8s ease both" }}>
            <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: "0.85rem", color: "rgba(255,248,232,0.25)", margin: 0 }}>
              You showed up today
            </p>
          </div>
        )}

        {/* ── SAVE FEEDBACK ── */}
        {saveMsg && (
          <div style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", zIndex: 100, animation: "fadeUp .3s ease both" }}>
            <span style={{ fontFamily: SANS, fontSize: "0.68rem", color: "rgba(255,248,232,0.25)", letterSpacing: "0.04em" }}>{saveMsg}</span>
          </div>
        )}
      </div>
    </div>
  );
}
