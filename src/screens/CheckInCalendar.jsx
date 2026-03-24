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

  // Export — generate printable HTML for a date range
  const handleExport = (rangeDays) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - rangeDays);
    const cutoffStr = cutoff.toISOString().slice(0, 10);

    // Filter entries in range
    const rangeEntries = {};
    for (const [date, arr] of Object.entries(allEntries)) {
      if (date >= cutoffStr) rangeEntries[date] = arr;
    }
    const flat = Object.values(rangeEntries).flat();
    if (!flat.length) return;

    // Compute stats for range
    const moodCounts = {}, symptomCounts = {};
    let heavyCount = 0;
    for (const e of flat) {
      for (const m of (e.mood || [])) moodCounts[m] = (moodCounts[m] || 0) + 1;
      for (const s of (e.symptoms || [])) symptomCounts[s] = (symptomCounts[s] || 0) + 1;
      if (e.intensity === "heavy") heavyCount++;
    }
    const topMoods = Object.entries(moodCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const topSymptoms = Object.entries(symptomCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const rangeLabel = rangeDays === 7 ? "Last 7 Days" : "Last 30 Days";

    // Build printable HTML
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Check-In Summary</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Georgia,serif;color:#2A2420;max-width:680px;margin:0 auto;padding:40px 32px 60px;line-height:1.6}
h1{font-size:1.5rem;font-weight:700;margin-bottom:4px}
h2{font-size:1rem;font-weight:600;margin:24px 0 8px;border-bottom:1px solid #E8E0D8;padding-bottom:6px}
.sub{font-size:0.85rem;color:#8A7A70;font-style:italic;margin-bottom:20px}
.stats{display:flex;gap:20px;margin-bottom:20px;flex-wrap:wrap}
.stat{background:#F5F1EA;border-radius:8px;padding:12px 16px;min-width:100px}
.stat-val{font-size:1.2rem;font-weight:700;color:#2A2420}
.stat-label{font-size:0.7rem;color:#8A7A70;margin-top:2px}
.day{margin-bottom:16px;padding:12px 16px;border:1px solid #EDE8DF;border-radius:8px}
.day-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}
.day-date{font-weight:600;font-size:0.9rem}
.badge{font-size:0.7rem;padding:2px 10px;border-radius:99px;font-weight:600}
.badge-light{background:#E8F5E9;color:#4A8A5A}
.badge-moderate{background:#FFF3E0;color:#B8860B}
.badge-heavy{background:#FFEBEE;color:#C0392B}
.pills{display:flex;flex-wrap:wrap;gap:4px;margin:4px 0}
.pill{font-size:0.72rem;padding:2px 8px;border-radius:99px;border:1px solid #E0D8D0;color:#5A4A42}
.note{font-style:italic;font-size:0.85rem;color:#5A4A42;margin-top:4px}
.trigger{font-size:0.8rem;color:#8A7A70;margin-top:4px}
.footer{margin-top:32px;padding-top:16px;border-top:1px solid #E8E0D8;font-size:0.72rem;color:#B0A098;text-align:center}
@media print{body{padding:20px}}
</style></head><body>
<h1>Body & Mind Check-In Summary</h1>
<p class="sub">${rangeLabel} &mdash; ${Object.keys(rangeEntries).length} days, ${flat.length} entries</p>

<div class="stats">
<div class="stat"><div class="stat-val">${flat.length}</div><div class="stat-label">Total check-ins</div></div>
<div class="stat"><div class="stat-val">${heavyCount}</div><div class="stat-label">Heavy days</div></div>
<div class="stat"><div class="stat-val">${Object.keys(rangeEntries).length}</div><div class="stat-label">Days tracked</div></div>
</div>

${topMoods.length ? `<h2>Most Common Moods</h2><div class="pills">${topMoods.map(([m, c]) => `<span class="pill">${m} (${c})</span>`).join("")}</div>` : ""}
${topSymptoms.length ? `<h2>Most Common Symptoms</h2><div class="pills">${topSymptoms.map(([s, c]) => `<span class="pill">${s} (${c})</span>`).join("")}</div>` : ""}

<h2>Daily Breakdown</h2>
${Object.entries(rangeEntries).sort().map(([date, entries]) =>
  entries.map(e => `<div class="day">
<div class="day-header">
<span class="day-date">${date}</span>
<span class="badge badge-${e.intensity || "light"}">${e.intensity || "light"}</span>
</div>
${e.mood?.length ? `<div class="pills">${e.mood.map(m => `<span class="pill">${m}</span>`).join("")}</div>` : ""}
${e.symptoms?.length ? `<div class="pills">${e.symptoms.map(s => `<span class="pill">${s}</span>`).join("")}</div>` : ""}
${e.trigger ? `<p class="trigger">Trigger: ${e.trigger}</p>` : ""}
${e.reflection ? `<p class="note">${e.reflection}</p>` : ""}
</div>`).join("")
).join("")}

<div class="footer">Generated from Inner Room Journal</div>
</body></html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const w = window.open(url, "_blank");
    if (w) { w.onload = () => { setTimeout(() => w.print(), 500); }; }
    else {
      const a = document.createElement("a");
      a.href = url; a.download = `checkin-summary-${rangeDays}d.html`; a.click();
    }
    URL.revokeObjectURL(url);
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
          <div style={{ marginTop: 8 }}>
            <p style={{ fontFamily: SANS, fontSize: "0.62rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,248,232,0.2)", margin: "0 0 10px", textAlign: "center" }}>Export for sharing</p>
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              {[{ label: "Last 7 days", days: 7 }, { label: "Last 30 days", days: 30 }].map(opt => (
                <button key={opt.days} onClick={() => handleExport(opt.days)} style={{
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,169,110,0.12)",
                  borderRadius: 12, padding: "10px 20px", cursor: "pointer",
                  color: "rgba(255,248,232,0.35)", fontFamily: SANS, fontSize: "0.72rem",
                  transition: "all 0.2s",
                }} onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(201,169,110,0.3)"; e.currentTarget.style.color = "rgba(255,248,232,0.55)"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(201,169,110,0.12)"; e.currentTarget.style.color = "rgba(255,248,232,0.35)"; }}>
                  {opt.label}
                </button>
              ))}
            </div>
            <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: "0.65rem", color: "rgba(255,248,232,0.15)", textAlign: "center", margin: "10px 0 0" }}>Opens a printable page you can save as PDF</p>
          </div>
        )}
      </div>
    </div>
  );
}
