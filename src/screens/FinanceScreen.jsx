import { useState } from 'react';
import { FINANCE_LESSONS, getFinanceLesson } from '../data/financeLessons.js';
import { reminderCount } from '../systems/financeReminders.js';
import CottageBackground from '../components/CottageBackground.jsx';
import SoundButton from '../components/SoundButton.jsx';

const SERIF = "'Cormorant Garamond', Georgia, serif";
const SANS = "'Inter', system-ui, -apple-system, sans-serif";

const P = {
  ink: '#FAF6F0',
  sub: 'rgba(232,212,160,0.55)',
  border: 'rgba(201,169,110,0.18)',
  borderH: 'rgba(201,169,110,0.55)',
  gold: '#C9A96E',
  goldL: '#E8D4A0',
  panel: 'rgba(255,255,255,0.04)',
  warm: 'rgba(232,168,120,0.14)',
  warmB: 'rgba(232,168,120,0.4)',
  warmT: '#F0C8A0',
};

/**
 * FinanceScreen — a faith + practical, ADHD-friendly "money home."
 *
 * Views:
 *   'hub'    — welcome + gentle reminders + tiles (Learn + links to Trackers)
 *   'learn'  — the weekly finance course (sequential unlock)
 *   'lesson' — one weekly lesson (verse, content, step, reflection)
 *
 * Props:
 *   onBack           — leave the finance area
 *   progress         — { currentWeek, completed:[], reflections:{}, startedAt }
 *   onProgressChange — persist (localStorage + Firestore)
 *   reminders        — { overdue:[], dueSoon:[] } from computeBillReminders
 *   onOpenTrackers   — () => route to the Bills/Goals/Spending/To-Do trackers
 */
export default function FinanceScreen({ onBack, progress, onProgressChange, reminders, onOpenTrackers, onOpenBudget, onSaveReflection }) {
  const prog = progress || { currentWeek: 1, completed: [], reflections: {}, startedAt: null };
  const [view, setView] = useState('hub');
  const [activeWeek, setActiveWeek] = useState(null);

  const lesson = activeWeek ? getFinanceLesson(activeWeek) : null;
  const completed = prog.completed || [];
  const currentWeek = prog.currentWeek || 1;

  const openLesson = (week) => { setActiveWeek(week); setView('lesson'); };

  const markComplete = (week) => {
    if (completed.includes(week)) return;
    const nextCompleted = [...completed, week];
    const nextCurrent = Math.min(Math.max(currentWeek, week + 1), FINANCE_LESSONS.length);
    onProgressChange({
      ...prog,
      completed: nextCompleted,
      currentWeek: nextCurrent,
      startedAt: prog.startedAt || new Date().toISOString(),
    });
  };

  const headerTitle = view === 'lesson' && lesson ? `Week ${lesson.week}`
    : view === 'learn' ? 'The Course'
    : 'Stewardship';

  const handleBack = () => {
    if (view === 'lesson') { setView('learn'); setActiveWeek(null); }
    else if (view === 'learn') setView('hub');
    else onBack();
  };

  return (
    <div style={{ minHeight: '100vh', color: P.ink, fontFamily: SANS, position: 'relative', overflow: 'hidden' }}>
      <CottageBackground />
      <SoundButton />
      <Header title={headerTitle} onBack={handleBack} />

      {view === 'hub' && (
        <HubView
          reminders={reminders}
          currentWeek={currentWeek}
          totalWeeks={FINANCE_LESSONS.length}
          completedCount={completed.length}
          onLearn={() => setView('learn')}
          onOpenTrackers={onOpenTrackers}
          onOpenBudget={onOpenBudget}
        />
      )}

      {view === 'learn' && (
        <LearnView
          currentWeek={currentWeek}
          completed={completed}
          onOpenLesson={openLesson}
        />
      )}

      {view === 'lesson' && lesson && (
        <LessonView
          key={lesson.week}
          lesson={lesson}
          isComplete={completed.includes(lesson.week)}
          savedReflection={(prog.reflections || {})[lesson.week]}
          onSaveReflection={onSaveReflection}
          onComplete={() => markComplete(lesson.week)}
          onNext={() => {
            const next = getFinanceLesson(lesson.week + 1);
            if (next && (completed.includes(lesson.week) || lesson.week + 1 <= currentWeek)) openLesson(next.week);
            else { setView('learn'); setActiveWeek(null); }
          }}
        />
      )}
    </div>
  );
}

/* ── Hub ─────────────────────────────────────────────────────── */
function HubView({ reminders, currentWeek, totalWeeks, completedCount, onLearn, onOpenTrackers, onOpenBudget }) {
  const nextLesson = getFinanceLesson(currentWeek);
  const rc = reminderCount(reminders);

  const tiles = [
    { key: 'bills', title: 'Budget & Bills', desc: 'Plan the month and track what is due' },
    { key: 'goals', title: 'Savings Goals', desc: 'Name a goal and watch it grow' },
    { key: 'spend', title: 'Spending Tracker', desc: 'See where the money actually goes' },
    { key: 'todo', title: 'To-Do List', desc: 'One small money task at a time' },
  ];

  return (
    <main style={{ maxWidth: 620, margin: '0 auto', padding: '18px 16px 120px', position: 'relative' }}>
      <p style={{ fontFamily: SERIF, fontStyle: 'italic', color: P.goldL, fontSize: '1.15rem', textAlign: 'center', lineHeight: 1.5, margin: '4px 0 6px' }}>
        Money, held with an open hand
      </p>
      <p style={{ fontFamily: SANS, fontSize: '0.74rem', color: P.sub, textAlign: 'center', lineHeight: 1.6, margin: '0 auto 20px', maxWidth: 460 }}>
        You are the caretaker, not the owner. Start with one small step — not all of them. Missed a week? Just return.
      </p>

      {/* Gentle reminders */}
      <RemindersBanner reminders={reminders} onOpenTrackers={onOpenTrackers} />

      {/* Learn this week — the headline card */}
      <button
        onClick={onLearn}
        style={{
          width: '100%', textAlign: 'left', cursor: 'pointer',
          background: 'linear-gradient(160deg, rgba(201,169,110,0.14), rgba(201,169,110,0.05))',
          border: `1px solid ${P.borderH}`, borderRadius: 16, padding: '16px 18px', marginBottom: 16,
          color: P.ink,
        }}
      >
        <div style={{ fontFamily: SANS, fontSize: '0.62rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: P.gold, marginBottom: 6 }}>
          Learn · Week {currentWeek} of {totalWeeks}
        </div>
        <div style={{ fontFamily: SERIF, fontStyle: 'italic', color: P.goldL, fontSize: '1.3rem', lineHeight: 1.2 }}>
          {nextLesson ? nextLesson.title : 'You have finished the course'}
        </div>
        {nextLesson && (
          <div style={{ fontFamily: SANS, fontSize: '0.76rem', color: P.sub, marginTop: 6, lineHeight: 1.5 }}>
            {nextLesson.headline}
          </div>
        )}
        <ProgressBar value={completedCount} max={totalWeeks} />
      </button>

      {/* Monthly Budget — headline planner (Planned vs Actual) */}
      {onOpenBudget && (
        <button
          onClick={onOpenBudget}
          style={{
            width: '100%', textAlign: 'left', cursor: 'pointer',
            background: 'linear-gradient(160deg, rgba(154,170,138,0.16), rgba(201,169,110,0.05))',
            border: `1px solid ${P.border}`, borderRadius: 16, padding: '15px 18px', margin: '0 0 4px',
            color: P.ink,
          }}
        >
          <div style={{ fontFamily: SANS, fontSize: '0.6rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: P.gold, marginBottom: 6 }}>
            Monthly Budget
          </div>
          <div style={{ fontFamily: SERIF, fontStyle: 'italic', color: P.goldL, fontSize: '1.28rem', lineHeight: 1.2 }}>
            Plan the month — planned vs actual
          </div>
          <div style={{ fontFamily: SANS, fontSize: '0.74rem', color: P.sub, marginTop: 5, lineHeight: 1.5 }}>
            Set a starting balance, name your income &amp; expenses, and watch your end balance grow.
          </div>
        </button>
      )}

      {/* Tracker tiles */}
      <div style={{ fontFamily: SANS, fontSize: '0.62rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: P.gold, margin: '18px 4px 10px' }}>
        Plan & Track
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
        {tiles.map(t => (
          <button
            key={t.key}
            onClick={() => onOpenTrackers && onOpenTrackers(t.key)}
            style={{
              background: P.panel, border: `1px solid ${P.border}`, borderRadius: 14,
              padding: '14px 14px 16px', cursor: 'pointer', textAlign: 'left', color: P.ink,
            }}
          >
            <div style={{ fontFamily: SERIF, fontStyle: 'italic', color: P.goldL, fontSize: '1.08rem', lineHeight: 1.2 }}>
              {t.title}
            </div>
            <div style={{ fontFamily: SANS, fontSize: '0.68rem', color: P.sub, marginTop: 5, lineHeight: 1.45 }}>
              {t.desc}
            </div>
          </button>
        ))}
      </div>

      {rc === 0 && (
        <p style={{ fontFamily: SERIF, fontStyle: 'italic', color: P.sub, textAlign: 'center', fontSize: '0.95rem', margin: '22px 0 0' }}>
          Nothing due right now. Rest in that.
        </p>
      )}
    </main>
  );
}

function RemindersBanner({ reminders, onOpenTrackers }) {
  const overdue = reminders?.overdue || [];
  const dueSoon = reminders?.dueSoon || [];
  if (overdue.length === 0 && dueSoon.length === 0) return null;

  const line = (b) => {
    const label = b.daysAway < 0 ? `${Math.abs(b.daysAway)}d overdue`
      : b.daysAway === 0 ? 'due today'
      : `in ${b.daysAway}d`;
    return (
      <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontFamily: SANS, fontSize: '0.76rem', color: P.warmT, padding: '3px 0' }}>
        <span>{b.name}</span>
        <span style={{ color: P.sub, whiteSpace: 'nowrap' }}>{label}</span>
      </div>
    );
  };

  return (
    <div style={{ background: P.warm, border: `1px solid ${P.warmB}`, borderRadius: 14, padding: '13px 15px', marginBottom: 16 }}>
      <div style={{ fontFamily: SANS, fontSize: '0.62rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: P.warmT, marginBottom: 8 }}>
        Coming up
      </div>
      {overdue.map(line)}
      {dueSoon.map(line)}
      <button
        onClick={() => onOpenTrackers && onOpenTrackers('bills')}
        style={{ marginTop: 8, background: 'transparent', border: 'none', cursor: 'pointer', color: P.gold, fontFamily: SANS, fontSize: '0.72rem', padding: 0 }}
      >
        Open bills →
      </button>
    </div>
  );
}

/* ── Learn (course list) ─────────────────────────────────────── */
function LearnView({ currentWeek, completed, onOpenLesson }) {
  return (
    <main style={{ maxWidth: 620, margin: '0 auto', padding: '18px 16px 120px', position: 'relative' }}>
      <p style={{ fontFamily: SERIF, fontStyle: 'italic', color: P.goldL, fontSize: '1.1rem', textAlign: 'center', lineHeight: 1.5, margin: '4px 0 4px' }}>
        A quiet weekly course
      </p>
      <p style={{ fontFamily: SANS, fontSize: '0.72rem', color: P.sub, textAlign: 'center', margin: '0 0 20px' }}>
        One small lesson a week. No rushing.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {FINANCE_LESSONS.map(l => {
          const done = completed.includes(l.week);
          const locked = l.week > currentWeek;
          return (
            <button
              key={l.week}
              disabled={locked}
              onClick={() => !locked && onOpenLesson(l.week)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left',
                background: locked ? 'rgba(255,255,255,0.02)' : P.panel,
                border: `1px solid ${l.week === currentWeek && !done ? P.borderH : P.border}`,
                borderRadius: 14, padding: '13px 15px',
                cursor: locked ? 'default' : 'pointer', opacity: locked ? 0.5 : 1, color: P.ink,
              }}
            >
              <div style={{
                width: 34, height: 34, flexShrink: 0, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: done ? 'rgba(154,170,138,0.22)' : 'rgba(201,169,110,0.12)',
                border: `1px solid ${done ? 'rgba(154,170,138,0.5)' : P.border}`,
                fontFamily: SERIF, fontSize: '0.95rem', color: done ? '#B8D4A8' : P.goldL,
              }}>
                {done ? '✓' : l.week}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: SERIF, fontStyle: 'italic', color: P.goldL, fontSize: '1.08rem', lineHeight: 1.2 }}>
                  {l.title}
                </div>
                <div style={{ fontFamily: SANS, fontSize: '0.68rem', color: P.sub, marginTop: 3, lineHeight: 1.4 }}>
                  {locked ? 'Unlocks after the week before' : l.headline}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </main>
  );
}

/* ── Lesson ──────────────────────────────────────────────────── */
function LessonView({ lesson, isComplete, onComplete, onNext, savedReflection, onSaveReflection }) {
  const [showStudy, setShowStudy] = useState(false);
  const questions = lesson.study?.questions || [];
  const [answers, setAnswers] = useState(() => savedReflection?.answers || {});
  const [savedMsg, setSavedMsg] = useState('');

  const anyAnswered = questions.some((_, i) => (answers[i] || '').trim());

  const handleSaveReflection = () => {
    if (!anyAnswered || !onSaveReflection) return;
    onSaveReflection(lesson, answers);
    setSavedMsg('✓ Saved to your reflection journal');
    setTimeout(() => setSavedMsg(''), 2600);
  };
  return (
    <main style={{ maxWidth: 600, margin: '0 auto', padding: '16px 18px 120px', position: 'relative' }}>
      <h1 style={{ fontFamily: SERIF, fontStyle: 'italic', color: P.goldL, fontSize: '1.7rem', lineHeight: 1.2, textAlign: 'center', margin: '4px 0 4px' }}>
        {lesson.title}
      </h1>
      <p style={{ fontFamily: SANS, fontSize: '0.76rem', color: P.sub, textAlign: 'center', margin: '0 0 20px', lineHeight: 1.5 }}>
        {lesson.headline}
      </p>

      {/* Verse */}
      <div style={{ textAlign: 'center', margin: '0 auto 22px', maxWidth: 500 }}>
        <p style={{ fontFamily: SERIF, fontStyle: 'italic', color: P.ink, fontSize: '1.12rem', lineHeight: 1.55, margin: 0 }}>
          “{lesson.verse.text}”
        </p>
        <p style={{ fontFamily: SANS, fontSize: '0.66rem', color: P.sub, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '8px 0 0' }}>
          {lesson.verse.reference}
        </p>
      </div>

      {/* Content */}
      {lesson.content.map((para, i) => (
        <p key={i} style={{ fontFamily: SANS, fontSize: '0.9rem', color: P.ink, lineHeight: 1.7, margin: '0 0 14px' }}>
          {para}
        </p>
      ))}

      {/* Key takeaway */}
      <div style={{ background: P.panel, border: `1px solid ${P.border}`, borderRadius: 12, padding: '12px 15px', margin: '18px 0' }}>
        <div style={{ fontFamily: SANS, fontSize: '0.6rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: P.gold, marginBottom: 5 }}>
          Take this with you
        </div>
        <div style={{ fontFamily: SERIF, fontStyle: 'italic', color: P.goldL, fontSize: '1.05rem', lineHeight: 1.4 }}>
          {lesson.keyTakeaway}
        </div>
      </div>

      {/* Affirmation */}
      <div style={{ textAlign: 'center', margin: '20px 0' }}>
        <div style={{ fontFamily: SANS, fontSize: '0.6rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: P.gold, marginBottom: 6 }}>
          Speak it
        </div>
        <p style={{ fontFamily: SERIF, fontStyle: 'italic', color: P.ink, fontSize: '1.15rem', lineHeight: 1.5, margin: 0 }}>
          {lesson.affirmation}
        </p>
      </div>

      {/* Practical step */}
      <div style={{ background: P.warm, border: `1px solid ${P.warmB}`, borderRadius: 12, padding: '13px 15px', margin: '18px 0' }}>
        <div style={{ fontFamily: SANS, fontSize: '0.6rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: P.warmT, marginBottom: 5 }}>
          One small step this week
        </div>
        <div style={{ fontFamily: SANS, fontSize: '0.88rem', color: P.warmT, lineHeight: 1.55 }}>
          {lesson.practicalStep}
        </div>
      </div>

      {/* Go deeper */}
      <button
        onClick={() => setShowStudy(s => !s)}
        style={{ width: '100%', background: 'transparent', border: `1px solid ${P.border}`, borderRadius: 10, padding: '11px', cursor: 'pointer', color: P.gold, fontFamily: SANS, fontSize: '0.76rem', letterSpacing: '0.04em', margin: '6px 0 0' }}
      >
        {showStudy ? 'Hide reflection' : 'Go deeper · reflection'}
      </button>

      {showStudy && (
        <div style={{ marginTop: 14 }}>
          <p style={{ fontFamily: SANS, fontSize: '0.86rem', color: P.ink, lineHeight: 1.7, margin: '0 0 14px' }}>
            {lesson.study.context}
          </p>
          {lesson.study.crossRefs?.length > 0 && (
            <p style={{ fontFamily: SANS, fontSize: '0.72rem', color: P.sub, lineHeight: 1.6, margin: '0 0 16px' }}>
              <span style={{ color: P.gold }}>See also: </span>{lesson.study.crossRefs.join(' · ')}
            </p>
          )}
          {questions.map((q, i) => (
            <div key={i} style={{ margin: '0 0 18px' }}>
              <div style={{ display: 'flex', gap: 10, margin: '0 0 8px' }}>
                <span style={{ fontFamily: SERIF, color: P.gold, fontSize: '1rem', flexShrink: 0 }}>{i + 1}.</span>
                <p style={{ fontFamily: SERIF, fontStyle: 'italic', color: P.goldL, fontSize: '1.02rem', lineHeight: 1.5, margin: 0 }}>{q}</p>
              </div>
              <textarea
                value={answers[i] || ''}
                onChange={(e) => setAnswers(a => ({ ...a, [i]: e.target.value }))}
                placeholder="Write your reflection…"
                rows={3}
                style={{
                  width: '100%', boxSizing: 'border-box', resize: 'vertical', minHeight: 68,
                  background: 'rgba(255,255,255,0.04)', border: `1px solid ${P.border}`, borderRadius: 10,
                  padding: '10px 12px', color: P.ink, fontFamily: SANS, fontSize: '0.88rem', lineHeight: 1.6,
                  outline: 'none',
                }}
              />
            </div>
          ))}

          {questions.length > 0 && (
            <div style={{ marginTop: 4 }}>
              <button
                onClick={handleSaveReflection}
                disabled={!anyAnswered}
                style={{
                  width: '100%', background: anyAnswered ? P.warm : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${anyAnswered ? P.warmB : P.border}`, borderRadius: 10, padding: '12px',
                  cursor: anyAnswered ? 'pointer' : 'default', color: anyAnswered ? P.warmT : P.sub,
                  fontFamily: SANS, fontSize: '0.8rem', letterSpacing: '0.03em',
                }}
              >
                Save to my reflection journal
              </button>
              {savedMsg && (
                <div style={{ textAlign: 'center', fontFamily: SERIF, fontStyle: 'italic', color: '#B8D4A8', fontSize: '0.92rem', marginTop: 10 }}>
                  {savedMsg}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Complete / next */}
      <div style={{ marginTop: 26 }}>
        {isComplete ? (
          <>
            <div style={{ textAlign: 'center', fontFamily: SERIF, fontStyle: 'italic', color: '#B8D4A8', fontSize: '1rem', marginBottom: 12 }}>
              You showed up for this week.
            </div>
            <button onClick={onNext} style={btnPrimary}>Next week →</button>
          </>
        ) : (
          <button onClick={onComplete} style={btnPrimary}>Mark this week complete</button>
        )}
      </div>
    </main>
  );
}

/* ── shared bits ─────────────────────────────────────────────── */
function ProgressBar({ value, max }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #C9A96E, #E8D4A0)', borderRadius: 4 }} />
      </div>
      <div style={{ fontFamily: SANS, fontSize: '0.62rem', color: P.sub, marginTop: 5 }}>
        {value} of {max} weeks complete
      </div>
    </div>
  );
}

const btnPrimary = {
  width: '100%',
  background: 'linear-gradient(160deg, rgba(201,169,110,0.9), rgba(201,169,110,0.7))',
  border: 'none', borderRadius: 12, padding: '14px', cursor: 'pointer',
  color: '#241B10', fontFamily: SANS, fontSize: '0.86rem', fontWeight: 600, letterSpacing: '0.03em',
};

function Header({ title, onBack }) {
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 10,
      background: 'rgba(20,16,12,0.85)', backdropFilter: 'blur(8px)',
      padding: '0 18px', height: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      borderBottom: `1px solid ${P.border}`,
    }}>
      <button onClick={onBack} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: P.sub, fontSize: '0.82rem', fontFamily: SANS, padding: 0 }}>← Back</button>
      <span style={{ fontFamily: SERIF, fontStyle: 'italic', color: P.goldL, fontSize: '0.95rem' }}>{title}</span>
      <div style={{ minWidth: 60 }} />
    </header>
  );
}
