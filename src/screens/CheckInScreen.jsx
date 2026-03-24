import { useState, useEffect, useRef, useCallback } from 'react';
import { B, SERIF, SANS, DISPLAY, GFONTS } from '../constants.js';
import { CSS } from '../styles.js';
import DoveCompanion from '../components/DoveCompanion.jsx';

const MOODS = ["Peaceful","Anxious","Overwhelmed","Hopeful","Tired","Grateful","Heavy","Restless"];
const SYMPTOMS = ["Headache","Migraine","Fatigue","Nausea","Pain","Brain fog","Dizziness","Tension","Weakness","Restless"];
const INTENSITY_STOPS = [
  { value: 0, label: "Light", icon: "\ud83c\udf3f" },
  { value: 1, label: "Moderate", icon: "\ud83c\udf3e" },
  { value: 2, label: "Heavy", icon: "\ud83c\udf27\ufe0f" },
];

const GROWTH_MESSAGES = {
  light: ["Something small is growing today.", "A quiet day. That matters.", "Light finds its way in."],
  moderate: ["You're carrying something. You don't have to carry it alone.", "Middle ground is still holy ground.", "Steady days build steady roots."],
  heavy: ["Even on heavy days, something is growing.", "The deepest roots grow in the hardest soil.", "This weight won't last forever. You're still here."],
};

const RETURN_MESSAGE = "Welcome back. You can begin again today.";

function fmtTime(iso) {
  try {
    const d = new Date(iso);
    const h = d.getHours(), m = d.getMinutes();
    const ampm = h >= 12 ? "pm" : "am";
    return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
  } catch (e) { return ""; }
}

export default function CheckInScreen({ onBack, onSave, onPrayWith, todayEntries, onViewHistory, editEntry, clearEditEntry, onCheckinComplete, lastCheckinDate }) {
  // Always start with a blank form
  const [moods, setMoods] = useState([]);
  const [symptoms, setSymptoms] = useState([]);
  const [customSymptom, setCustomSymptom] = useState("");
  const [customMood, setCustomMood] = useState("");
  const [intensity, setIntensity] = useState(0);
  const [reflection, setReflection] = useState("");
  const [trigger, setTrigger] = useState("");
  const [saveMsg, setSaveMsg] = useState("");
  const [showedUp, setShowedUp] = useState(false);
  const [growthMsg, setGrowthMsg] = useState(null);
  const [companionGlow, setCompanionGlow] = useState(0); // 0-3 brightness based on interaction
  const [editingEntry, setEditingEntry] = useState(null); // id of entry being edited
  const debounceRef = useRef(null);
  const entryIdRef = useRef(null); // unique id for this check-in

  const todayKey = new Date().toISOString().slice(0, 10);
  const entries = Array.isArray(todayEntries) ? todayEntries : [];

  // Count meaningful interactions
  const sectionsUsed = (moods.length > 0 ? 1 : 0) + (symptoms.length > 0 ? 1 : 0) + (reflection.length > 10 ? 1 : 0);

  // Generate a unique entry id on first interaction
  const getEntryId = () => {
    if (!entryIdRef.current) entryIdRef.current = todayKey + "_" + Date.now();
    return entryIdRef.current;
  };

  // Debounced auto-save
  const triggerSave = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const data = {
        id: getEntryId(),
        date: todayKey,
        time: new Date().toISOString(),
        mood: moods,
        symptoms: symptoms,
        intensity: INTENSITY_STOPS[intensity].label.toLowerCase(),
        reflection: reflection,
        trigger: trigger,
      };
      if (onSave) onSave(data);
      setSaveMsg("Saved just now");
      setTimeout(() => setSaveMsg(""), 2500);
    }, 600);
  }, [moods, symptoms, intensity, reflection, trigger, onSave, todayKey]);

  // Auto-save on any change (only if there's data)
  useEffect(() => {
    if (moods.length || symptoms.length || reflection || trigger) triggerSave();
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [moods, symptoms, intensity, reflection, trigger, triggerSave]);

  // Companion glow responds to interaction depth
  useEffect(() => { setCompanionGlow(Math.min(3, sectionsUsed)); }, [sectionsUsed]);

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

  // Load a previous entry for editing
  const loadEntry = (entry) => {
    setMoods(entry.mood || []);
    setSymptoms(entry.symptoms || []);
    const v = entry.intensity;
    if (typeof v === "number" && v >= 0 && v <= 2) setIntensity(v);
    else if (typeof v === "string") {
      const idx = INTENSITY_STOPS.findIndex(s => s.label.toLowerCase() === v);
      setIntensity(idx >= 0 ? idx : 0);
    }
    setReflection(entry.reflection || "");
    setTrigger(entry.trigger || "");
    entryIdRef.current = entry.id || todayKey + "_" + Date.now();
    setEditingEntry(entry.id);
    setShowedUp(false);
  };

  // Load entry from calendar edit on mount
  useEffect(() => {
    if (editEntry) {
      loadEntry(editEntry);
      if (clearEditEntry) clearEditEntry();
    }
  }, []);

  const hasData = moods.length > 0 || symptoms.length > 0 || reflection.length > 0 || trigger.length > 0;
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
        <div style={{ textAlign: "center", marginBottom: 24, animation: "fadeUp .6s ease both" }}>
          <h1 style={{ fontFamily: DISPLAY, fontSize: "1.5rem", fontWeight: 700, color: B.goldL, margin: "0 0 8px" }}>Body & Mind Check-In</h1>
          <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: "0.88rem", color: "rgba(255,248,232,0.35)", margin: 0 }}>Take a moment to notice what you're carrying today</p>
          <div style={{ width: 50, height: 1, background: "rgba(201,169,110,0.25)", margin: "14px auto 0" }} />
          {onViewHistory && (
            <button onClick={onViewHistory} style={{ marginTop: 12, background: "transparent", border: "none", cursor: "pointer", color: "rgba(201,169,110,0.35)", fontFamily: SANS, fontSize: "0.7rem", letterSpacing: "0.04em", transition: "color 0.2s" }} onMouseEnter={e => e.target.style.color = "rgba(201,169,110,0.6)"} onMouseLeave={e => e.target.style.color = "rgba(201,169,110,0.35)"}>
              View history
            </button>
          )}
        </div>

        {/* ── PREVIOUS ENTRIES TODAY ── */}
        {entries.length > 0 && !editingEntry && (
          <div style={{ marginBottom: 24, animation: "fadeUp .5s ease both" }}>
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(201,169,110,0.08)", borderRadius: 12, padding: "12px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: entries.length > 1 ? 8 : 0 }}>
                <p style={{ fontFamily: SANS, fontSize: "0.7rem", color: "rgba(255,248,232,0.3)", margin: 0, letterSpacing: "0.04em" }}>
                  {entries.length === 1 ? "1 check-in today" : `${entries.length} check-ins today`}
                </p>
                <p style={{ fontFamily: SANS, fontSize: "0.65rem", color: "rgba(255,248,232,0.2)", margin: 0 }}>
                  Last: {fmtTime(entries[entries.length - 1]?.time)}
                </p>
              </div>
              {entries.slice(-3).map((e, i) => (
                <div key={e.id || i} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <p style={{ fontFamily: SANS, fontSize: "0.68rem", color: "rgba(255,248,232,0.3)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {[...(e.mood || []), ...(e.symptoms || [])].slice(0, 4).join(", ") || "Check-in"}
                    </p>
                  </div>
                  <button onClick={() => loadEntry(e)} style={{ background: "rgba(201,169,110,0.06)", border: "1px solid rgba(201,169,110,0.12)", borderRadius: 8, padding: "4px 10px", cursor: "pointer", color: "rgba(201,169,110,0.5)", fontFamily: SANS, fontSize: "0.62rem", fontWeight: 600, transition: "all 0.2s", flexShrink: 0 }}>
                    Edit
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Editing indicator */}
        {editingEntry && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <p style={{ fontFamily: SANS, fontSize: "0.7rem", color: "rgba(201,169,110,0.45)", margin: 0, flex: 1 }}>Editing previous entry</p>
            <button onClick={() => { setEditingEntry(null); setMoods([]); setSymptoms([]); setIntensity(0); setReflection(""); setTrigger(""); entryIdRef.current = null; }} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,169,110,0.1)", borderRadius: 8, padding: "4px 12px", cursor: "pointer", color: "rgba(255,248,232,0.35)", fontFamily: SANS, fontSize: "0.65rem", transition: "all 0.2s" }}>
              New entry
            </button>
          </div>
        )}

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
            {moods.filter(m => !MOODS.includes(m)).map(m => (
              <button key={m} onClick={() => toggleMood(m)} style={{
                background: "rgba(201,169,110,0.15)", border: "1px solid rgba(201,169,110,0.45)",
                borderRadius: 20, padding: "8px 16px", cursor: "pointer",
                color: B.goldL, fontFamily: SANS, fontSize: "0.78rem", fontWeight: 500,
                transition: "all 0.2s",
              }}>
                {m}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <input value={customMood} onChange={e => setCustomMood(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { const v = customMood.trim(); if (v && !moods.includes(v)) { setMoods(prev => [...prev, v]); setCustomMood(""); } } }} placeholder="Something else..." style={{
              flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,169,110,0.10)",
              borderRadius: 12, padding: "8px 14px", color: B.goldL, fontFamily: SANS, fontSize: "0.78rem",
              outline: "none", transition: "border-color 0.2s",
            }} onFocus={e => e.target.style.borderColor = "rgba(201,169,110,0.3)"} onBlur={e => e.target.style.borderColor = "rgba(201,169,110,0.10)"} />
            {customMood.trim() && (
              <button onClick={() => { const v = customMood.trim(); if (v && !moods.includes(v)) { setMoods(prev => [...prev, v]); setCustomMood(""); } }} style={{
                background: "rgba(201,169,110,0.1)", border: "1px solid rgba(201,169,110,0.25)",
                borderRadius: 12, padding: "8px 14px", cursor: "pointer", color: B.gold,
                fontFamily: SANS, fontSize: "0.74rem", fontWeight: 600, transition: "all 0.2s",
              }}>Add</button>
            )}
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

        {/* ── TRIGGER ── */}
        <div style={{ marginBottom: 28, animation: "fadeUp .6s .5s ease both", opacity: 0 }}>
          <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: "0.92rem", color: "rgba(255,248,232,0.55)", margin: "0 0 12px" }}>
            Is there a trigger you can identify?
          </p>
          <textarea value={trigger} onChange={e => setTrigger(e.target.value)} placeholder="A situation, thought, memory, conversation..." style={{
            width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(201,169,110,0.10)", borderRadius: 14,
            padding: "14px 16px", color: B.goldL, fontFamily: SERIF, fontSize: "0.9rem",
            minHeight: 70, resize: "vertical", outline: "none", lineHeight: 1.7,
            transition: "border-color 0.2s",
          }} onFocus={e => e.target.style.borderColor = "rgba(201,169,110,0.3)"} onBlur={e => e.target.style.borderColor = "rgba(201,169,110,0.10)"} />
        </div>

        {/* ── SAVE + PRAYER ACTIONS ── */}
        {hasData && (
          <div style={{ marginBottom: 28, animation: "fadeUp .5s ease both" }}>
            {/* Primary: Save Entry */}
            <button onClick={() => {
              triggerSave();
              setSaveMsg("Entry saved");
              setTimeout(() => setSaveMsg(""), 2500);
              // Growth message based on intensity
              const msgs = GROWTH_MESSAGES[INTENSITY_STOPS[intensity].label.toLowerCase()] || GROWTH_MESSAGES.light;
              setGrowthMsg(msgs[Math.floor(Math.random() * msgs.length)]);
              setTimeout(() => setGrowthMsg(null), 4000);
              // Notify parent for candle reward + mission tracking
              if (onCheckinComplete) onCheckinComplete(INTENSITY_STOPS[intensity].label.toLowerCase());
            }} style={{
              width: "100%", background: "linear-gradient(135deg,rgba(201,169,110,0.18),rgba(201,169,110,0.06))",
              border: "1px solid rgba(201,169,110,0.35)", borderRadius: 14, padding: "14px 0",
              cursor: "pointer", color: B.goldL, fontFamily: SERIF, fontStyle: "italic",
              fontSize: "0.92rem", fontWeight: 600, transition: "all 0.3s", letterSpacing: "0.04em",
              boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
            }}>
              Save Entry
            </button>
            {/* Secondary: Turn into a prayer */}
            <div style={{ textAlign: "center", marginTop: 14 }}>
              <button onClick={() => {
                const text = [
                  moods.length ? `Feeling: ${moods.join(", ")}` : "",
                  symptoms.length ? `Body: ${symptoms.join(", ")}` : "",
                  reflection ? `"${reflection.slice(0, 120)}"` : "",
                ].filter(Boolean).join(" — ");
                if (onPrayWith) onPrayWith(text);
              }} style={{
                background: "transparent", border: "none", cursor: "pointer",
                color: "rgba(190,211,196,0.45)", fontFamily: SERIF, fontStyle: "italic",
                fontSize: "0.78rem", letterSpacing: "0.03em", transition: "color 0.2s",
                padding: "4px 0",
              }} onMouseEnter={e => e.target.style.color = "rgba(190,211,196,0.7)"} onMouseLeave={e => e.target.style.color = "rgba(190,211,196,0.45)"}>
                Turn this into a prayer
              </button>
            </div>
          </div>
        )}

        {/* ── GROWTH MESSAGE (after save) ── */}
        {growthMsg && (
          <div style={{ textAlign: "center", padding: "16px 20px", margin: "0 0 16px", background: "rgba(90,138,106,0.06)", border: "1px solid rgba(90,138,106,0.12)", borderRadius: 14, animation: "fadeUp .6s ease both" }}>
            <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: "0.85rem", color: B.sage, margin: 0, lineHeight: 1.55 }}>
              {growthMsg}
            </p>
          </div>
        )}

        {/* ── MICRO-FEEDBACK ── */}
        {showedUp && !growthMsg && (
          <div style={{ textAlign: "center", padding: "16px 0", animation: "fadeUp .8s ease both" }}>
            <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: "0.85rem", color: "rgba(255,248,232,0.25)", margin: 0 }}>
              You've been showing up. That matters.
            </p>
          </div>
        )}

        {/* ── RETURN MESSAGE (after inactivity) ── */}
        {lastCheckinDate && (() => {
          const daysSince = Math.floor((Date.now() - new Date(lastCheckinDate).getTime()) / 86400000);
          if (daysSince >= 3 && !hasData) return (
            <div style={{ textAlign: "center", padding: "16px 0", animation: "fadeUp .8s .6s ease both", opacity: 0 }}>
              <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: "0.85rem", color: "rgba(201,169,110,0.35)", margin: 0, lineHeight: 1.55 }}>
                {RETURN_MESSAGE}
              </p>
            </div>
          );
          return null;
        })()}

        {/* ── SAVE FEEDBACK ── */}
        {saveMsg && (
          <div style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", zIndex: 100, animation: "fadeUp .3s ease both" }}>
            <span style={{ fontFamily: SANS, fontSize: "0.68rem", color: "rgba(255,248,232,0.25)", letterSpacing: "0.04em" }}>{saveMsg}</span>
          </div>
        )}

        {/* ── DOVE COMPANION ── */}
        <DoveCompanion intensity={INTENSITY_STOPS[intensity].label.toLowerCase()} active={hasData} screen="check-in"/>
      </div>
    </div>
  );
}
