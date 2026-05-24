import { useState } from 'react';
import { PREGNANCY_MEDITATIONS, getMeditation } from '../data/pregnancyMeditations.js';
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
  panelH: 'rgba(28,22,16,0.78)',
};

/**
 * PregnancyMeditationScreen — 40 weekly meditation cards (verse + prayer +
 * affirmation) for a mother to meditate on through pregnancy.
 *
 * Props:
 *   onBack()
 *   progress              — { currentWeek?: number, completed?: number[] }
 *   onProgressChange(next)
 */
export default function PregnancyMeditationScreen({ onBack, progress, onProgressChange }) {
  const [view, setView] = useState('hub');   // 'hub' | 'card'
  const [activeWeek, setActiveWeek] = useState(null);

  const currentWeek = progress?.currentWeek || null;
  const completed = new Set(progress?.completed || []);

  const openWeek = (w) => {
    setActiveWeek(w);
    setView('card');
  };

  const setCurrentWeek = (w) => {
    onProgressChange({ ...(progress || {}), currentWeek: w });
  };

  const toggleComplete = (w) => {
    const cur = new Set(progress?.completed || []);
    if (cur.has(w)) cur.delete(w); else cur.add(w);
    onProgressChange({ ...(progress || {}), completed: Array.from(cur).sort((a,b)=>a-b) });
  };

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
        title={view === 'card' && activeWeek ? `Week ${activeWeek}` : 'Pregnancy Meditations'}
        onBack={() => {
          if (view === 'hub') onBack();
          else { setActiveWeek(null); setView('hub'); }
        }}
      />

      {view === 'hub' && (
        <HubView
          currentWeek={currentWeek}
          completed={completed}
          onPick={openWeek}
          onSetCurrent={setCurrentWeek}
        />
      )}

      {view === 'card' && activeWeek && (
        <CardView
          week={activeWeek}
          isCompleted={completed.has(activeWeek)}
          onToggleComplete={() => toggleComplete(activeWeek)}
          onNext={activeWeek < 40 ? () => setActiveWeek(activeWeek + 1) : null}
          onPrev={activeWeek > 1 ? () => setActiveWeek(activeWeek - 1) : null}
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

// ── Hub: 40-week grid ────────────────────────────────────────────────────
function HubView({ currentWeek, completed, onPick, onSetCurrent }) {
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '24px 20px 80px' }}>
      <p style={{
        fontFamily: SERIF, fontStyle: 'italic', color: P.goldL,
        fontSize: '1.04rem', textAlign: 'center', lineHeight: 1.55, marginBottom: 6,
      }}>
        His word be a lamp unto thy feet through every week of this journey.
      </p>
      <p style={{
        fontFamily: SANS, fontSize: '0.78rem', color: P.sub,
        textAlign: 'center', letterSpacing: '0.06em', marginBottom: 22,
      }}>
        A verse, a prayer, and an affirmation for every week of pregnancy
      </p>

      {/* Week selector */}
      <div style={{
        background: P.panel, border: `1px solid ${P.border}`, borderRadius: 12,
        padding: '14px 16px', marginBottom: 22,
      }}>
        <div style={{ fontFamily: SANS, fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: P.sub, marginBottom: 8 }}>
          Which week are you?
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <select
            value={currentWeek || ''}
            onChange={(e) => onSetCurrent(e.target.value ? parseInt(e.target.value, 10) : null)}
            style={{
              flex: '1 1 140px',
              background: 'rgba(10,8,6,0.5)',
              color: P.ink, border: `1px solid ${P.border}`,
              borderRadius: 8, padding: '8px 12px',
              fontFamily: SANS, fontSize: '0.92rem',
              cursor: 'pointer',
            }}
          >
            <option value="">Select your week…</option>
            {PREGNANCY_MEDITATIONS.map(m => (
              <option key={m.week} value={m.week}>Week {m.week}</option>
            ))}
          </select>
          {currentWeek && (
            <button
              onClick={() => onPick(currentWeek)}
              style={{
                background: 'rgba(232,212,160,0.18)',
                border: `1px solid ${P.borderH}`,
                color: P.goldL, borderRadius: 8,
                padding: '8px 14px', cursor: 'pointer',
                fontFamily: SANS, fontSize: '0.86rem',
              }}
            >
              Open week {currentWeek}
            </button>
          )}
        </div>
      </div>

      {/* Grid of all 40 weeks */}
      <div style={{ fontFamily: SANS, fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: P.sub, marginBottom: 10 }}>
        All weeks
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(78px, 1fr))',
        gap: 8,
      }}>
        {PREGNANCY_MEDITATIONS.map(m => {
          const isCurrent = m.week === currentWeek;
          const isDone = completed.has(m.week);
          return (
            <button
              key={m.week}
              onClick={() => onPick(m.week)}
              style={{
                aspectRatio: '1 / 1',
                background: isCurrent ? 'rgba(232,212,160,0.18)' : isDone ? 'rgba(201,169,110,0.10)' : P.panel,
                border: `1px solid ${isCurrent ? P.borderH : P.border}`,
                color: P.ink,
                borderRadius: 10,
                cursor: 'pointer',
                fontFamily: SERIF,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 2, padding: 4,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = P.borderH}
              onMouseLeave={e => e.currentTarget.style.borderColor = isCurrent ? P.borderH : P.border}
            >
              <div style={{ fontFamily: SANS, fontSize: '0.58rem', letterSpacing: '0.1em', color: P.sub, textTransform: 'uppercase' }}>Week</div>
              <div style={{ fontSize: '1.4rem', color: isCurrent ? P.goldL : P.ink, lineHeight: 1 }}>{m.week}</div>
              {isDone && (
                <div style={{ fontFamily: SANS, fontSize: '0.55rem', color: P.gold, marginTop: 1, letterSpacing: '0.08em' }}>✓</div>
              )}
            </button>
          );
        })}
      </div>
    </main>
  );
}

// ── Card view ────────────────────────────────────────────────────────────
function CardView({ week, isCompleted, onToggleComplete, onNext, onPrev }) {
  const m = getMeditation(week);
  if (!m) return null;
  return (
    <main style={{ maxWidth: 620, margin: '0 auto', padding: '26px 20px 90px' }}>
      <div style={{ textAlign: 'center', marginBottom: 22 }}>
        <div style={{
          fontFamily: SANS, fontSize: '0.7rem', letterSpacing: '0.18em',
          color: P.sub, textTransform: 'uppercase', marginBottom: 6,
        }}>
          Week {week} of 40
        </div>
        <div style={{
          fontFamily: SERIF, fontStyle: 'italic',
          fontSize: '1.6rem', color: P.goldL, lineHeight: 1.3,
        }}>
          {m.title}
        </div>
      </div>

      <Section label="Verse">
        <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '1.12rem', lineHeight: 1.65, color: P.ink }}>
          “{m.verse.text}”
        </div>
        <div style={{ fontFamily: SANS, fontSize: '0.78rem', color: P.gold, marginTop: 8, letterSpacing: '0.08em' }}>
          — {m.verse.reference} (KJV)
        </div>
      </Section>

      <Section label="Prayer">
        <div style={{ fontFamily: SERIF, fontSize: '1rem', lineHeight: 1.7, color: P.ink }}>
          {m.prayer}
        </div>
      </Section>

      <Section label="Affirmation">
        <div style={{
          fontFamily: SERIF, fontStyle: 'italic',
          fontSize: '1.08rem', lineHeight: 1.55,
          color: P.goldL, textAlign: 'center',
          padding: '4px 6px',
        }}>
          {m.affirmation}
        </div>
      </Section>

      {/* Mark complete */}
      <div style={{ textAlign: 'center', marginTop: 8, marginBottom: 18 }}>
        <button
          onClick={onToggleComplete}
          style={{
            background: isCompleted ? 'rgba(201,169,110,0.22)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${isCompleted ? P.borderH : P.border}`,
            color: isCompleted ? P.goldL : P.ink,
            borderRadius: 24, padding: '10px 22px', cursor: 'pointer',
            fontFamily: SANS, fontSize: '0.86rem', letterSpacing: '0.05em',
          }}
        >
          {isCompleted ? '✓ Meditated on' : 'Mark as meditated on'}
        </button>
      </div>

      {/* Prev / Next navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <button
          onClick={onPrev || (() => {})}
          disabled={!onPrev}
          style={{
            flex: 1, background: 'transparent',
            border: `1px solid ${P.border}`,
            color: onPrev ? P.ink : P.sub,
            borderRadius: 10, padding: '12px 14px',
            cursor: onPrev ? 'pointer' : 'default',
            fontFamily: SANS, fontSize: '0.86rem',
            opacity: onPrev ? 1 : 0.4,
          }}
        >
          ← Previous week
        </button>
        <button
          onClick={onNext || (() => {})}
          disabled={!onNext}
          style={{
            flex: 1, background: 'transparent',
            border: `1px solid ${P.border}`,
            color: onNext ? P.ink : P.sub,
            borderRadius: 10, padding: '12px 14px',
            cursor: onNext ? 'pointer' : 'default',
            fontFamily: SANS, fontSize: '0.86rem',
            opacity: onNext ? 1 : 0.4,
          }}
        >
          Next week →
        </button>
      </div>
    </main>
  );
}

function Section({ label, children }) {
  return (
    <div style={{
      background: P.panel,
      border: `1px solid ${P.border}`,
      borderRadius: 14,
      padding: '18px 20px',
      marginBottom: 16,
    }}>
      <div style={{
        fontFamily: SANS, fontSize: '0.66rem', letterSpacing: '0.18em',
        textTransform: 'uppercase', color: P.sub, marginBottom: 10,
      }}>
        {label}
      </div>
      {children}
    </div>
  );
}
