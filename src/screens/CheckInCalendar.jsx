import { useState, useMemo } from 'react';
import { B, SERIF, SANS, DISPLAY, GFONTS } from '../constants.js';
import { CSS } from '../styles.js';

const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const INTENSITY_COLORS = {
  light:    { bg: "rgba(90,138,106,0.25)",  border: "rgba(90,138,106,0.45)",  dot: "#6AAA6A" },
  moderate: { bg: "rgba(201,169,110,0.25)", border: "rgba(201,169,110,0.45)", dot: "#C9A96E" },
  heavy:    { bg: "rgba(180,100,100,0.20)", border: "rgba(180,100,100,0.40)", dot: "#CC8888" },
};

function fmtTime(iso) {
  try {
    const d = new Date(iso);
    return `${d.getHours() % 12 || 12}:${String(d.getMinutes()).padStart(2,"0")} ${d.getHours() >= 12 ? "pm" : "am"}`;
  } catch (e) { return ""; }
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year, month) {
  return new Date(year, month, 1).getDay();
}

// Load all check-in entries from localStorage
function loadAllEntries() {
  const all = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("irj-checkins-")) {
        const date = key.replace("irj-checkins-", "");
        const arr = JSON.parse(localStorage.getItem(key) || "[]");
        if (Array.isArray(arr) && arr.length > 0) all[date] = arr;
      }
    }
  } catch (e) {}
  return all;
}

// Find the dominant intensity for a day's entries
function dominantIntensity(entries) {
  if (!entries || !entries.length) return null;
  const weights = { heavy: 3, moderate: 2, light: 1 };
  let max = 0, result = "light";
  for (const e of entries) {
    const w = weights[e.intensity] || 0;
    if (w > max) { max = w; result = e.intensity; }
  }
  return result;
}

export default function CheckInCalendar({ onBack, onEditEntry }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showExport, setShowExport] = useState(false);

  const allEntries = useMemo(() => loadAllEntries(), [viewMonth, viewYear]);

  // Calendar grid
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth);
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  // Selected day entries
  const selectedKey = selectedDate ? `${viewYear}-${String(viewMonth + 1).padStart(2,"0")}-${String(selectedDate).padStart(2,"0")}` : null;
  const selectedEntries = selectedKey ? (allEntries[selectedKey] || []) : [];

  // Summary stats
  const stats = useMemo(() => {
    const allFlat = Object.values(allEntries).flat();
    if (!allFlat.length) return { total: 0, topMood: null, topSymptom: null, daysTracked: 0 };

    const moodCounts = {};
    const symptomCounts = {};
    for (const e of allFlat) {
      for (const m of (e.mood || [])) moodCounts[m] = (moodCounts[m] || 0) + 1;
      for (const s of (e.symptoms || [])) symptomCounts[s] = (symptomCounts[s] || 0) + 1;
    }
    const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    const topSymptom = Object.entries(symptomCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    return { total: allFlat.length, topMood, topSymptom, daysTracked: Object.keys(allEntries).length };
  }, [allEntries]);

  // Pattern observations
  const patterns = useMemo(() => {
    const obs = [];
    if (stats.daysTracked >= 3 && stats.topMood) obs.push(`You've felt "${stats.topMood}" most often.`);
    if (stats.daysTracked >= 3 && stats.topSymptom) obs.push(`"${stats.topSymptom}" has been your most common body signal.`);

    const heavyDays = Object.entries(allEntries).filter(([, arr]) => dominantIntensity(arr) === "heavy").length;
    const lightDays = Object.entries(allEntries).filter(([, arr]) => dominantIntensity(arr) === "light").length;
    if (heavyDays > 2) obs.push(`You've had ${heavyDays} heavier days. Be patient with yourself.`);
    if (lightDays > heavyDays && stats.daysTracked >= 5) obs.push("More light days than heavy ones. That's something.");

    if (stats.daysTracked >= 7) obs.push(`You've checked in ${stats.daysTracked} days. Consistency is its own kind of courage.`);
    return obs;
  }, [allEntries, stats]);

  // Export as text
  const exportText = () => {
    const lines = [`Body & Mind Check-In Summary`, `${MONTH_NAMES[viewMonth]} ${viewYear}`, `---`, `Total entries: ${stats.total}`, `Days tracked: ${stats.daysTracked}`];
    if (stats.topMood) lines.push(`Most common mood: ${stats.topMood}`);
    if (stats.topSymptom) lines.push(`Most common symptom: ${stats.topSymptom}`);
    lines.push(``, `--- Daily Details ---`);
    for (const [date, entries] of Object.entries(allEntries).sort()) {
      for (const e of entries) {
        lines.push(``, `${date} ${fmtTime(e.time)}`);
        if (e.mood?.length) lines.push(`  Heart: ${e.mood.join(", ")}`);
        if (e.symptoms?.length) lines.push(`  Body: ${e.symptoms.join(", ")}`);
        lines.push(`  Intensity: ${e.intensity || "light"}`);
        if (e.reflection) lines.push(`  Reflection: ${e.reflection}`);
      }
    }
    return lines.join("\n");
  };

  const handleExport = () => {
    const text = exportText();
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `checkin-summary-${MONTH_NAMES[viewMonth].toLowerCase()}-${viewYear}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExport(false);
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
    setSelectedDate(null);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
    setSelectedDate(null);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: B.night, fontFamily: SANS, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
      <style>{GFONTS}{CSS}</style>
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "28px 22px 100px" }}>

        {/* Back */}
        <button onClick={onBack} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(201,169,110,0.12)", borderRadius: 999, padding: "8px 20px", cursor: "pointer", color: "rgba(255,248,232,0.45)", fontFamily: SANS, fontSize: "0.78rem", marginBottom: 28, display: "inline-flex", alignItems: "center", gap: 6 }}>
          Back
        </button>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 24, animation: "fadeUp .6s ease both" }}>
          <h1 style={{ fontFamily: DISPLAY, fontSize: "1.4rem", fontWeight: 700, color: B.goldL, margin: "0 0 6px" }}>Check-In History</h1>
          <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: "0.82rem", color: "rgba(255,248,232,0.3)", margin: 0 }}>See your patterns over time</p>
        </div>

        {/* Summary cards */}
        {stats.total > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 20, animation: "fadeUp .5s .1s ease both", opacity: 0 }}>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,169,110,0.08)", borderRadius: 12, padding: "12px 10px", textAlign: "center" }}>
              <div style={{ fontFamily: DISPLAY, fontSize: "1.3rem", color: B.goldL }}>{stats.total}</div>
              <div style={{ fontFamily: SANS, fontSize: "0.6rem", color: "rgba(255,248,232,0.25)", marginTop: 2 }}>entries</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,169,110,0.08)", borderRadius: 12, padding: "12px 10px", textAlign: "center" }}>
              <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: "0.78rem", color: B.sage, lineHeight: 1.3 }}>{stats.topMood || "..."}</div>
              <div style={{ fontFamily: SANS, fontSize: "0.6rem", color: "rgba(255,248,232,0.25)", marginTop: 4 }}>top mood</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,169,110,0.08)", borderRadius: 12, padding: "12px 10px", textAlign: "center" }}>
              <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: "0.78rem", color: "rgba(220,160,160,0.7)", lineHeight: 1.3 }}>{stats.topSymptom || "..."}</div>
              <div style={{ fontFamily: SANS, fontSize: "0.6rem", color: "rgba(255,248,232,0.25)", marginTop: 4 }}>top signal</div>
            </div>
          </div>
        )}

        {/* Month nav */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, animation: "fadeUp .5s .15s ease both", opacity: 0 }}>
          <button onClick={prevMonth} style={{ background: "transparent", border: "none", cursor: "pointer", color: "rgba(255,248,232,0.35)", fontSize: "1.2rem", padding: "4px 12px" }}>&lsaquo;</button>
          <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: "1rem", color: B.goldL }}>{MONTH_NAMES[viewMonth]} {viewYear}</span>
          <button onClick={nextMonth} style={{ background: "transparent", border: "none", cursor: "pointer", color: "rgba(255,248,232,0.35)", fontSize: "1.2rem", padding: "4px 12px" }}>&rsaquo;</button>
        </div>

        {/* Day names */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 4 }}>
          {DAY_NAMES.map(d => (
            <div key={d} style={{ textAlign: "center", fontFamily: SANS, fontSize: "0.58rem", color: "rgba(255,248,232,0.2)", padding: "4px 0", letterSpacing: "0.06em" }}>{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3, marginBottom: 20, animation: "fadeUp .5s .2s ease both", opacity: 0 }}>
          {cells.map((day, i) => {
            if (day === null) return <div key={`e${i}`} />;
            const dateKey = `${viewYear}-${String(viewMonth + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
            const dayEntries = allEntries[dateKey];
            const intensity = dominantIntensity(dayEntries);
            const colors = intensity ? INTENSITY_COLORS[intensity] : null;
            const isToday = day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
            const isSelected = day === selectedDate;

            return (
              <button key={day} onClick={() => setSelectedDate(day === selectedDate ? null : day)} style={{
                aspectRatio: "1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                background: isSelected ? "rgba(201,169,110,0.15)" : colors ? colors.bg : "rgba(255,255,255,0.02)",
                border: `1.5px solid ${isSelected ? "rgba(201,169,110,0.5)" : isToday ? "rgba(201,169,110,0.3)" : colors ? colors.border : "rgba(255,255,255,0.04)"}`,
                borderRadius: 10, cursor: "pointer", transition: "all 0.15s", padding: 0,
              }}>
                <span style={{ fontFamily: SANS, fontSize: "0.72rem", fontWeight: isToday ? 700 : 400, color: colors ? "#FFF8E8" : isToday ? B.goldL : "rgba(255,248,232,0.3)" }}>{day}</span>
                {dayEntries && (
                  <div style={{ width: 4, height: 4, borderRadius: 2, background: colors?.dot || "rgba(255,248,232,0.2)", marginTop: 2 }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 24 }}>
          {[["Light","#6AAA6A"],["Moderate","#C9A96E"],["Heavy","#CC8888"]].map(([label, color]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: 4, background: color, opacity: 0.7 }} />
              <span style={{ fontFamily: SANS, fontSize: "0.6rem", color: "rgba(255,248,232,0.25)" }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Selected day detail */}
        {selectedDate && (
          <div style={{ marginBottom: 24, animation: "fadeUp .4s ease both" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <h3 style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: "0.95rem", color: B.goldL, margin: 0, flex: 1 }}>
                {MONTH_NAMES[viewMonth]} {selectedDate}
              </h3>
              <span style={{ fontFamily: SANS, fontSize: "0.65rem", color: "rgba(255,248,232,0.2)" }}>
                {selectedEntries.length} {selectedEntries.length === 1 ? "entry" : "entries"}
              </span>
            </div>
            {selectedEntries.length === 0 && (
              <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: "0.82rem", color: "rgba(255,248,232,0.2)", margin: 0 }}>No check-ins this day</p>
            )}
            {selectedEntries.map((e, idx) => (
              <div key={e.id || idx} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,169,110,0.08)", borderRadius: 12, padding: "14px 16px", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontFamily: SANS, fontSize: "0.65rem", color: "rgba(255,248,232,0.3)" }}>{fmtTime(e.time)}</span>
                  {e.intensity && (
                    <span style={{ fontFamily: SANS, fontSize: "0.6rem", color: INTENSITY_COLORS[e.intensity]?.dot || "rgba(255,248,232,0.3)", background: INTENSITY_COLORS[e.intensity]?.bg || "transparent", border: `1px solid ${INTENSITY_COLORS[e.intensity]?.border || "transparent"}`, borderRadius: 99, padding: "2px 8px" }}>{e.intensity}</span>
                  )}
                </div>
                {e.mood?.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
                    {e.mood.map(m => <span key={m} style={{ fontFamily: SANS, fontSize: "0.65rem", color: B.goldL, background: "rgba(201,169,110,0.08)", border: "1px solid rgba(201,169,110,0.15)", borderRadius: 99, padding: "2px 8px" }}>{m}</span>)}
                  </div>
                )}
                {e.symptoms?.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
                    {e.symptoms.map(s => <span key={s} style={{ fontFamily: SANS, fontSize: "0.65rem", color: B.sage, background: "rgba(190,211,196,0.06)", border: "1px solid rgba(190,211,196,0.15)", borderRadius: 99, padding: "2px 8px" }}>{s}</span>)}
                  </div>
                )}
                {e.trigger && <p style={{ fontFamily: SANS, fontSize: "0.72rem", color: "rgba(201,169,110,0.4)", margin: "4px 0 0", lineHeight: 1.5 }}>Trigger: {e.trigger}</p>}
                {e.reflection && <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: "0.8rem", color: "rgba(255,248,232,0.4)", margin: "4px 0 0", lineHeight: 1.6 }}>{e.reflection}</p>}
                {onEditEntry && (
                  <button onClick={() => onEditEntry(e)} style={{ marginTop: 8, background: "rgba(201,169,110,0.06)", border: "1px solid rgba(201,169,110,0.12)", borderRadius: 8, padding: "4px 12px", cursor: "pointer", color: "rgba(201,169,110,0.45)", fontFamily: SANS, fontSize: "0.62rem", fontWeight: 600, transition: "all 0.2s" }}>
                    Edit entry
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Patterns */}
        {patterns.length > 0 && (
          <div style={{ marginBottom: 24, animation: "fadeUp .5s .3s ease both", opacity: 0 }}>
            <p style={{ fontFamily: SANS, fontSize: "0.62rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,248,232,0.2)", margin: "0 0 10px" }}>Patterns</p>
            {patterns.map((p, i) => (
              <p key={i} style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: "0.82rem", color: "rgba(255,248,232,0.35)", margin: "0 0 8px", lineHeight: 1.55 }}>{p}</p>
            ))}
          </div>
        )}

        {/* Export */}
        {stats.total > 0 && (
          <div style={{ textAlign: "center" }}>
            <button onClick={handleExport} style={{
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,169,110,0.12)",
              borderRadius: 12, padding: "10px 24px", cursor: "pointer",
              color: "rgba(255,248,232,0.35)", fontFamily: SANS, fontSize: "0.74rem",
              transition: "all 0.2s",
            }} onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(201,169,110,0.3)"; e.currentTarget.style.color = "rgba(255,248,232,0.55)"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(201,169,110,0.12)"; e.currentTarget.style.color = "rgba(255,248,232,0.35)"; }}>
              Export summary
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
