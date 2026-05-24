import { useState, useMemo } from 'react';
import {
  todayISO, toISO, fromISO, addDays, daysBetween,
  cycleAt, classifyDate, togglePeriodStart, updateNote,
  monthGrid, averageCycleLength,
  DEFAULT_CYCLE_LENGTH, DEFAULT_PERIOD_LENGTH,
} from '../systems/fertilityTracker.js';
import CottageBackground from '../components/CottageBackground.jsx';

const SERIF = "'Cormorant Garamond', Georgia, serif";
const SANS = "'Inter', system-ui, -apple-system, sans-serif";

const P = {
  ink: '#FAF6F0',
  sub: 'rgba(232,212,160,0.55)',
  border: 'rgba(201,169,110,0.18)',
  borderH: 'rgba(201,169,110,0.55)',
  gold: '#C9A96E',
  goldL: '#E8D4A0',
  panel: 'rgba(20,16,12,0.62)',
  // Cycle status colors
  period: '#C45A6A',
  fertile: 'rgba(120,180,200,0.6)',
  peak: 'rgba(170,140,220,0.8)',
  ovulation: '#E8C26A',
  predicted: 'rgba(196,90,106,0.32)',
};

const MOOD_OPTIONS = ['Hopeful', 'Calm', 'Hormonal', 'Tired', 'Anxious', 'Joyful', 'Heavy'];
const SYMPTOM_OPTIONS = ['Cramps', 'Bloating', 'Headache', 'Tender breasts', 'Spotting', 'Nausea', 'Backache', 'Fatigue'];
const MUCUS_OPTIONS = [
  { id: 'dry', label: 'Dry' },
  { id: 'sticky', label: 'Sticky' },
  { id: 'creamy', label: 'Creamy' },
  { id: 'watery', label: 'Watery' },
  { id: 'eggwhite', label: 'Egg white (fertile)' },
];

/**
 * FertilityTrackerScreen — Flo-style trying-to-conceive tracker.
 *
 * Views:
 *   - 'today'     Current cycle day, fertility status, predictions
 *   - 'calendar'  Month grid with period / fertile / ovulation markers
 *   - 'day'       Symptom log for a chosen date
 *   - 'settings'  Cycle + period length overrides
 *
 * Props:
 *   onBack()
 *   fertility               — { periodStarts, cycleLength, periodLength, notes }
 *   onFertilityChange(next)
 */
export default function FertilityTrackerScreen({ onBack, fertility, onFertilityChange }) {
  const [view, setView] = useState('today');
  const [activeDate, setActiveDate] = useState(todayISO());

  const today = todayISO();
  const cyc = useMemo(() => cycleAt(fertility, today), [fertility, today]);
  const avgCycle = useMemo(() => averageCycleLength(fertility?.periodStarts || []), [fertility]);

  const onTogglePeriod = (iso) => onFertilityChange(togglePeriodStart(fertility, iso));
  const onNotePatch = (iso, patch) => onFertilityChange(updateNote(fertility, iso, patch));

  return (
    <div style={{
      minHeight: '100vh',
      color: P.ink,
      fontFamily: SANS,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <CottageBackground />
      <Header
        title={view === 'day' ? formatDate(activeDate) : 'Conception Tracker'}
        onBack={() => {
          if (view === 'today') onBack();
          else setView('today');
        }}
      />

      {view === 'today' && (
        <TodayView
          fertility={fertility}
          cyc={cyc}
          today={today}
          avgCycle={avgCycle}
          onLogToday={() => onTogglePeriod(today)}
          onOpenCalendar={() => setView('calendar')}
          onOpenSettings={() => setView('settings')}
          onOpenDay={(iso) => { setActiveDate(iso); setView('day'); }}
        />
      )}

      {view === 'calendar' && (
        <CalendarView
          fertility={fertility}
          today={today}
          onPickDay={(iso) => { setActiveDate(iso); setView('day'); }}
        />
      )}

      {view === 'day' && (
        <DayView
          fertility={fertility}
          date={activeDate}
          onTogglePeriod={() => onTogglePeriod(activeDate)}
          onPatch={(patch) => onNotePatch(activeDate, patch)}
        />
      )}

      {view === 'settings' && (
        <SettingsView
          fertility={fertility}
          avgCycle={avgCycle}
          onChange={(patch) => onFertilityChange({ ...(fertility || {}), ...patch })}
        />
      )}
    </div>
  );
}

// ── Header ───────────────────────────────────────────────────────────────
function Header({ title, onBack }) {
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 10,
      background: 'rgba(20,16,12,0.78)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      padding: '0 18px', height: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      borderBottom: `1px solid ${P.border}`,
    }}>
      <button onClick={onBack} style={{
        background: 'transparent', border: 'none', color: P.goldL,
        fontFamily: SANS, fontSize: '0.92rem', cursor: 'pointer',
        padding: '6px 10px', borderRadius: 8,
      }}>← Back</button>
      <div style={{ fontFamily: SERIF, fontStyle: 'italic', color: P.goldL, fontSize: '1rem' }}>
        {title}
      </div>
      <div style={{ width: 60 }} />
    </header>
  );
}

// ── Today view ───────────────────────────────────────────────────────────
function TodayView({ fertility, cyc, today, avgCycle, onLogToday, onOpenCalendar, onOpenSettings, onOpenDay }) {
  const noPeriods = !cyc;
  const todayLogged = (fertility?.periodStarts || []).includes(today);

  return (
    <main style={{ maxWidth: 620, margin: '0 auto', padding: '22px 20px 80px' }}>
      <p style={{
        fontFamily: SERIF, fontStyle: 'italic', color: P.goldL,
        fontSize: '1rem', textAlign: 'center', lineHeight: 1.5, marginBottom: 24,
      }}>
        “He maketh the barren woman to keep house, and to be a joyful mother of children.” — Psalm 113:9
      </p>

      {noPeriods ? (
        <div style={{
          background: P.panel, border: `1px solid ${P.border}`,
          borderRadius: 16, padding: '22px 22px', textAlign: 'center', marginBottom: 18,
        }}>
          <div style={{ fontFamily: SERIF, fontStyle: 'italic', color: P.goldL, fontSize: '1.08rem', marginBottom: 8 }}>
            Welcome — let's begin tracking
          </div>
          <div style={{ color: P.sub, fontSize: '0.86rem', lineHeight: 1.55, marginBottom: 14 }}>
            Log the first day of your most recent period to start seeing fertile-window predictions and ovulation estimates.
          </div>
          <button
            onClick={onLogToday}
            style={primaryBtn}
          >
            Period started today
          </button>
          <div style={{ marginTop: 10 }}>
            <button onClick={onOpenCalendar} style={secondaryBtn}>
              Or choose a past date on the calendar
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Cycle hero */}
          <div style={{
            background: P.panel, border: `1px solid ${P.borderH}`,
            borderRadius: 16, padding: '22px 22px', textAlign: 'center', marginBottom: 16,
          }}>
            <div style={{ fontFamily: SANS, fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: P.sub, marginBottom: 6 }}>
              Cycle day
            </div>
            <div style={{ fontFamily: SERIF, fontSize: '3.4rem', color: P.goldL, lineHeight: 1, marginBottom: 6 }}>
              {cyc.cycleDay}
            </div>
            <div style={{ fontFamily: SANS, fontSize: '0.84rem', color: P.sub, marginBottom: 14 }}>
              of {cyc.cycleLength}
            </div>
            <StatusPill status={cyc.status} label={cyc.statusLabel} />
          </div>

          {/* Predictions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            <PredictionTile
              label="Next ovulation"
              value={cyc.daysUntilOvulation === 0
                ? 'Today'
                : cyc.daysUntilOvulation > 0
                  ? `In ${cyc.daysUntilOvulation}d`
                  : 'Passed'}
              sub={formatDate(cyc.ovulationDate)}
            />
            <PredictionTile
              label="Next period"
              value={cyc.daysUntilNextPeriod === 0 ? 'Today' : `In ${cyc.daysUntilNextPeriod}d`}
              sub={formatDate(cyc.nextPeriodStart)}
            />
          </div>

          {/* Fertile window */}
          <div style={{
            background: P.panel, border: `1px solid ${P.border}`,
            borderRadius: 14, padding: '14px 18px', marginBottom: 16,
          }}>
            <div style={{ fontFamily: SANS, fontSize: '0.66rem', letterSpacing: '0.18em', color: P.sub, textTransform: 'uppercase', marginBottom: 6 }}>
              Fertile window
            </div>
            <div style={{ fontFamily: SERIF, fontStyle: 'italic', color: P.ink, fontSize: '1rem' }}>
              {formatDate(cyc.fertileWindowStart)} — {formatDate(cyc.fertileWindowEnd)}
            </div>
            <div style={{ marginTop: 6, fontSize: '0.78rem', color: P.sub }}>
              Best chances on {formatDate(cyc.ovulationDate)} (peak fertility)
            </div>
          </div>

          {/* Quick actions */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
            <button
              onClick={onLogToday}
              style={{
                ...primaryBtn,
                flex: '1 1 220px',
                background: todayLogged ? 'rgba(196,90,106,0.28)' : 'rgba(232,212,160,0.18)',
                borderColor: todayLogged ? 'rgba(196,90,106,0.6)' : P.borderH,
                color: todayLogged ? '#F8D0D8' : P.goldL,
              }}
            >
              {todayLogged ? '✓ Period started today (tap to undo)' : 'Mark period started today'}
            </button>
            <button onClick={() => onOpenDay(today)} style={{ ...secondaryBtn, flex: '1 1 160px' }}>
              Log symptoms
            </button>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={onOpenCalendar} style={{ ...secondaryBtn, flex: '1 1 160px' }}>Calendar</button>
            <button onClick={onOpenSettings} style={{ ...secondaryBtn, flex: '1 1 160px' }}>Cycle settings</button>
          </div>

          {/* Stats footer */}
          <div style={{ marginTop: 22, textAlign: 'center', color: P.sub, fontSize: '0.78rem', lineHeight: 1.6 }}>
            Tracking {(fertility?.periodStarts || []).length} {(fertility?.periodStarts || []).length === 1 ? 'cycle' : 'cycles'}
            {' · '}avg cycle {avgCycle} days
          </div>
        </>
      )}
    </main>
  );
}

function StatusPill({ status, label }) {
  const colors = {
    period: { bg: 'rgba(196,90,106,0.25)', border: 'rgba(196,90,106,0.6)', ink: '#F8D0D8' },
    fertile: { bg: 'rgba(120,180,200,0.22)', border: 'rgba(120,180,200,0.6)', ink: '#C8E4F0' },
    peak: { bg: 'rgba(170,140,220,0.32)', border: 'rgba(170,140,220,0.7)', ink: '#E0D0F0' },
    luteal: { bg: 'rgba(255,255,255,0.06)', border: P.border, ink: P.ink },
    'pre-period': { bg: 'rgba(196,90,106,0.14)', border: 'rgba(196,90,106,0.45)', ink: '#F0C4CC' },
    low: { bg: 'rgba(255,255,255,0.06)', border: P.border, ink: P.sub },
  };
  const c = colors[status] || colors.low;
  return (
    <div style={{
      display: 'inline-block',
      background: c.bg, border: `1px solid ${c.border}`,
      color: c.ink, padding: '6px 16px', borderRadius: 20,
      fontFamily: SANS, fontSize: '0.84rem', letterSpacing: '0.05em',
    }}>
      {label}
    </div>
  );
}

function PredictionTile({ label, value, sub }) {
  return (
    <div style={{
      background: P.panel, border: `1px solid ${P.border}`,
      borderRadius: 12, padding: '12px 14px',
    }}>
      <div style={{ fontFamily: SANS, fontSize: '0.64rem', letterSpacing: '0.16em', color: P.sub, textTransform: 'uppercase', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontFamily: SERIF, fontStyle: 'italic', color: P.goldL, fontSize: '1.15rem' }}>
        {value}
      </div>
      <div style={{ marginTop: 2, fontSize: '0.74rem', color: P.sub }}>
        {sub}
      </div>
    </div>
  );
}

// ── Calendar view ────────────────────────────────────────────────────────
function CalendarView({ fertility, today, onPickDay }) {
  const [{ y, m }, setYM] = useState(() => {
    const d = fromISO(today);
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const grid = monthGrid(y, m);
  const monthLabel = fromISO(`${y}-${String(m + 1).padStart(2, '0')}-01`)
    .toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const dows = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const prev = () => {
    const d = new Date(y, m - 1, 1);
    setYM({ y: d.getFullYear(), m: d.getMonth() });
  };
  const next = () => {
    const d = new Date(y, m + 1, 1);
    setYM({ y: d.getFullYear(), m: d.getMonth() });
  };

  return (
    <main style={{ maxWidth: 560, margin: '0 auto', padding: '20px 16px 80px' }}>
      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <button onClick={prev} style={iconBtn}>‹</button>
        <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '1.2rem', color: P.goldL }}>
          {monthLabel}
        </div>
        <button onClick={next} style={iconBtn}>›</button>
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center',
        marginBottom: 12, fontSize: '0.7rem', color: P.sub,
      }}>
        <LegendDot color={P.period} label="Period" />
        <LegendDot color={P.fertile} label="Fertile" />
        <LegendDot color={P.peak} label="Peak" />
        <LegendDot color={P.ovulation} label="Ovulation" />
        <LegendDot color={P.predicted} label="Predicted" outline />
      </div>

      {/* Day of week header */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
        {dows.map((d, i) => (
          <div key={i} style={{ textAlign: 'center', color: P.sub, fontSize: '0.7rem', letterSpacing: '0.1em' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {grid.map(cell => {
          const cls = classifyDate(fertility, cell.iso);
          const isToday = cell.iso === today;
          const hasNote = !!fertility?.notes?.[cell.iso];
          let bg = 'rgba(255,255,255,0.03)';
          let border = `1px solid ${P.border}`;
          let color = cell.inMonth ? P.ink : P.sub;
          if (cls === 'period') { bg = P.period; color = '#FFF'; }
          else if (cls === 'peak') { bg = P.peak; color = '#FFF'; }
          else if (cls === 'fertile') { bg = P.fertile; color = '#0E0A06'; }
          else if (cls === 'ovulation') { bg = P.ovulation; color = '#1A1612'; }
          else if (cls === 'predicted-period') {
            bg = P.predicted;
            border = `1px dashed rgba(196,90,106,0.6)`;
            color = cell.inMonth ? '#F0C4CC' : P.sub;
          }
          return (
            <button
              key={cell.iso}
              onClick={() => onPickDay(cell.iso)}
              style={{
                aspectRatio: '1 / 1', background: bg, border,
                color, borderRadius: 8, cursor: 'pointer',
                fontFamily: SANS, fontSize: '0.82rem',
                fontWeight: isToday ? 700 : 400,
                outline: isToday ? `2px solid ${P.goldL}` : 'none',
                outlineOffset: -2,
                position: 'relative',
                opacity: cell.inMonth ? 1 : 0.42,
              }}
            >
              {cell.day}
              {hasNote && (
                <span style={{
                  position: 'absolute', bottom: 4, right: 4,
                  width: 4, height: 4, borderRadius: '50%',
                  background: P.gold,
                }} />
              )}
            </button>
          );
        })}
      </div>

      <p style={{ marginTop: 14, color: P.sub, fontSize: '0.74rem', textAlign: 'center', lineHeight: 1.5 }}>
        Tap a day to log symptoms or mark a period start.
      </p>
    </main>
  );
}

function LegendDot({ color, label, outline }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <span style={{
        display: 'inline-block', width: 10, height: 10, borderRadius: '50%',
        background: outline ? 'transparent' : color,
        border: outline ? `1px dashed ${color.replace(/0\.\d+/, '0.8')}` : 'none',
      }} />
      <span>{label}</span>
    </div>
  );
}

// ── Day view ─────────────────────────────────────────────────────────────
function DayView({ fertility, date, onTogglePeriod, onPatch }) {
  const note = fertility?.notes?.[date] || {};
  const isPeriodStart = (fertility?.periodStarts || []).includes(date);
  const cyc = cycleAt(fertility, date);

  const toggleSymptom = (s) => {
    const cur = new Set(note.symptoms || []);
    if (cur.has(s)) cur.delete(s); else cur.add(s);
    onPatch({ symptoms: Array.from(cur) });
  };

  return (
    <main style={{ maxWidth: 620, margin: '0 auto', padding: '20px 18px 90px' }}>
      {cyc && (
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontFamily: SANS, fontSize: '0.7rem', letterSpacing: '0.18em', color: P.sub, textTransform: 'uppercase', marginBottom: 4 }}>
            Cycle day {cyc.cycleDay}
          </div>
          <StatusPill status={cyc.status} label={cyc.statusLabel} />
        </div>
      )}

      <Section label="Period">
        <button
          onClick={onTogglePeriod}
          style={{
            ...primaryBtn,
            width: '100%',
            background: isPeriodStart ? 'rgba(196,90,106,0.28)' : 'rgba(232,212,160,0.14)',
            borderColor: isPeriodStart ? 'rgba(196,90,106,0.6)' : P.border,
            color: isPeriodStart ? '#F8D0D8' : P.ink,
          }}
        >
          {isPeriodStart ? '✓ Period started this day (tap to undo)' : 'Mark this day as period start'}
        </button>
      </Section>

      <Section label="Mood">
        <ChipRow
          options={MOOD_OPTIONS}
          selected={note.mood ? [note.mood] : []}
          single
          onToggle={(v) => onPatch({ mood: note.mood === v ? '' : v })}
        />
      </Section>

      <Section label="Symptoms">
        <ChipRow
          options={SYMPTOM_OPTIONS}
          selected={note.symptoms || []}
          onToggle={toggleSymptom}
        />
      </Section>

      <Section label="Cervical mucus">
        <ChipRow
          options={MUCUS_OPTIONS.map(m => m.label)}
          selected={(MUCUS_OPTIONS.find(m => m.id === note.mucus) || {}).label ? [(MUCUS_OPTIONS.find(m => m.id === note.mucus)).label] : []}
          single
          onToggle={(label) => {
            const opt = MUCUS_OPTIONS.find(m => m.label === label);
            onPatch({ mucus: note.mucus === opt?.id ? '' : opt?.id });
          }}
        />
      </Section>

      <Section label="BBT (°C)">
        <input
          type="number"
          step="0.01"
          placeholder="36.50"
          value={note.bbt ?? ''}
          onChange={(e) => onPatch({ bbt: e.target.value === '' ? '' : parseFloat(e.target.value) })}
          style={{
            width: '100%', maxWidth: 160,
            background: 'rgba(10,8,6,0.5)', color: P.ink,
            border: `1px solid ${P.border}`, borderRadius: 8,
            padding: '10px 12px', fontFamily: SANS, fontSize: '1rem',
          }}
        />
      </Section>

      <Section label="Intimacy">
        <button
          onClick={() => onPatch({ intimacy: !note.intimacy })}
          style={{
            background: note.intimacy ? 'rgba(232,212,160,0.22)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${note.intimacy ? P.borderH : P.border}`,
            color: note.intimacy ? P.goldL : P.ink,
            padding: '8px 16px', borderRadius: 20,
            cursor: 'pointer', fontFamily: SANS, fontSize: '0.86rem',
          }}
        >
          {note.intimacy ? '✓ Logged' : 'Log intimacy for this day'}
        </button>
      </Section>

      <Section label="Pregnancy test">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { id: '', label: 'None' },
            { id: 'negative', label: 'Negative' },
            { id: 'positive', label: 'Positive' },
          ].map(o => {
            const active = (note.test || '') === o.id;
            return (
              <button
                key={o.id}
                onClick={() => onPatch({ test: o.id })}
                style={chipStyle(active)}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      </Section>

      <Section label="Notes">
        <textarea
          rows={3}
          placeholder="Anything else worth remembering…"
          value={note.notes || ''}
          onChange={(e) => onPatch({ notes: e.target.value })}
          style={{
            width: '100%', background: 'rgba(10,8,6,0.5)', color: P.ink,
            border: `1px solid ${P.border}`, borderRadius: 10,
            padding: '10px 12px', fontFamily: SERIF, fontSize: '0.96rem',
            lineHeight: 1.55, resize: 'vertical',
          }}
        />
      </Section>
    </main>
  );
}

function ChipRow({ options, selected, onToggle, single }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {options.map(opt => {
        const active = selected.includes(opt);
        return (
          <button key={opt} onClick={() => onToggle(opt)} style={chipStyle(active)}>
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function chipStyle(active) {
  return {
    background: active ? 'rgba(232,212,160,0.22)' : 'rgba(255,255,255,0.04)',
    border: `1px solid ${active ? P.borderH : P.border}`,
    color: active ? P.goldL : P.ink,
    padding: '7px 14px', borderRadius: 20,
    cursor: 'pointer', fontFamily: SANS, fontSize: '0.82rem',
  };
}

// ── Settings view ────────────────────────────────────────────────────────
function SettingsView({ fertility, avgCycle, onChange }) {
  const cycleLength = fertility?.cycleLength || avgCycle || DEFAULT_CYCLE_LENGTH;
  const periodLength = fertility?.periodLength || DEFAULT_PERIOD_LENGTH;
  return (
    <main style={{ maxWidth: 520, margin: '0 auto', padding: '24px 20px 80px' }}>
      <p style={{ fontFamily: SERIF, fontStyle: 'italic', color: P.goldL, textAlign: 'center', marginBottom: 18 }}>
        Adjust your cycle length so predictions match your body.
      </p>

      <Section label="Average cycle length (days)">
        <NumberInput
          value={cycleLength}
          min={21} max={45}
          onChange={(v) => onChange({ cycleLength: v })}
        />
        <p style={{ marginTop: 8, fontSize: '0.78rem', color: P.sub }}>
          Computed average from logs: {avgCycle} days
        </p>
      </Section>

      <Section label="Typical period length (days)">
        <NumberInput
          value={periodLength}
          min={2} max={10}
          onChange={(v) => onChange({ periodLength: v })}
        />
      </Section>

      <p style={{ marginTop: 22, color: P.sub, fontSize: '0.78rem', textAlign: 'center', lineHeight: 1.6 }}>
        This tracker is a tool, not a diagnosis. Trust the Lord with the timing, and let this help you steward what He shows you.
      </p>
    </main>
  );
}

function NumberInput({ value, min, max, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        style={iconBtn}
      >−</button>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => {
          const v = parseInt(e.target.value, 10);
          if (Number.isFinite(v)) onChange(Math.max(min, Math.min(max, v)));
        }}
        style={{
          width: 80, textAlign: 'center',
          background: 'rgba(10,8,6,0.5)', color: P.goldL,
          border: `1px solid ${P.border}`, borderRadius: 8,
          padding: '8px 10px', fontFamily: SERIF, fontSize: '1.2rem',
        }}
      />
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        style={iconBtn}
      >+</button>
    </div>
  );
}

// ── Shared bits ──────────────────────────────────────────────────────────
function Section({ label, children }) {
  return (
    <div style={{
      background: P.panel, border: `1px solid ${P.border}`,
      borderRadius: 14, padding: '16px 18px', marginBottom: 14,
    }}>
      <div style={{ fontFamily: SANS, fontSize: '0.66rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: P.sub, marginBottom: 10 }}>
        {label}
      </div>
      {children}
    </div>
  );
}

const primaryBtn = {
  background: 'rgba(232,212,160,0.18)',
  border: `1px solid ${P.borderH}`,
  color: P.goldL,
  padding: '11px 22px', borderRadius: 24, cursor: 'pointer',
  fontFamily: SANS, fontSize: '0.92rem', letterSpacing: '0.04em',
};

const secondaryBtn = {
  background: 'transparent',
  border: `1px solid ${P.border}`,
  color: P.ink,
  padding: '10px 18px', borderRadius: 22, cursor: 'pointer',
  fontFamily: SANS, fontSize: '0.86rem',
};

const iconBtn = {
  background: 'rgba(255,255,255,0.04)',
  border: `1px solid ${P.border}`,
  color: P.goldL, width: 36, height: 36,
  borderRadius: '50%', cursor: 'pointer',
  fontSize: '1.3rem', lineHeight: 1, fontFamily: SERIF,
};

function formatDate(iso) {
  return fromISO(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
