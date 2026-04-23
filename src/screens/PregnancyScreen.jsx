import { useState, useMemo, useEffect, useRef } from 'react';
import { SERIF, SANS } from '../constants.js';
import { PREGNANCY_WEEKS, computeWeek, MILESTONES, PREGNANCY_MOODS, PREGNANCY_SYMPTOMS } from '../data/pregnancyWeeks.js';

/* ═══════════════════════════════════════════════════════════════
   THE NURSERY — Pregnancy Tracker
   A cozy sanctuary, not a medical dashboard.

   Views:
     setup    → first-time flow (due date + faith mode + nickname)
     nursery  → home (greeting + current week + hotspots)
     week     → full-screen weekly update (swipeable)
     letters  → letters to baby
     checkin  → daily mood / symptoms / reflection
     milestones → keepsake shelf
     garden   → 40-bloom garden view
═══════════════════════════════════════════════════════════════ */

// ── Nursery palette — warm lamplight + rose quartz ──
const P = {
  bg:      '#1A1410',
  panel:   'rgba(30,22,18,0.92)',
  cream:   '#FAF0EA',
  brown:   '#3A2820',
  taupe:   '#A08580',
  rose:    '#D49098',
  roseL:   '#E8B0B5',
  gold:    '#D4A878',
  olive:   '#9AB090',
  border:  'rgba(212,144,152,0.22)',
  borderL: 'rgba(212,144,152,0.1)',
  head:    'rgba(212,144,152,0.12)',
  candle:  '#E8C088',
};

export function createEmptyPregnancy() {
  return {
    setupComplete: false,
    dueDate: null,          // ISO date string YYYY-MM-DD
    babyNickname: '',
    motherName: '',         // optional — used on cover
    faithMode: 'christian', // 'christian' | 'general' | 'spiritual'
    letters: [],            // { id, date, text, sealed, sealUntilBirth }
    checkins: [],           // { id, date, mood, symptoms, reflection }
    milestones: {},         // { [milestoneId]: { date, reflection, photo? } }
    appointments: [],       // { id, date, provider, type, questions, notes }
    kickSessions: [],       // { id, date, startTime, endTime, count }
    prayers: [],            // { id, date, text }
    bookDedication: '',     // optional custom dedication
    orders: [],             // [{ id, luluPrintJobId, stripePaymentId, status, total, currency, shippingAddress, createdAt, trackingUrl }]
    createdAt: new Date().toISOString(),
  };
}

// ═══════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function PregnancyScreen({ progress, onProgressChange, onBack }) {
  const state = progress || createEmptyPregnancy();
  const [view, setView] = useState(state.setupComplete ? 'nursery' : 'setup');
  const [activeWeek, setActiveWeek] = useState(null);

  const update = (next) => onProgressChange({ ...state, ...next });

  const current = useMemo(() => computeWeek(state.dueDate), [state.dueDate]);
  const weekIdx = current ? Math.max(1, Math.min(40, current.week)) : 1;
  const weekData = PREGNANCY_WEEKS[weekIdx - 1];

  return (
    <div style={{
      minHeight:'100vh',
      background:`linear-gradient(180deg, ${P.bg} 0%, #0F0A08 100%)`,
      color:P.cream,
      fontFamily:SANS,
      paddingBottom:60,
    }}>
      {/* Top bar */}
      <div style={{
        position:'sticky', top:0, zIndex:20,
        background:'rgba(20,14,10,0.95)',
        borderBottom:`1px solid ${P.border}`,
        backdropFilter:'blur(10px)',
        padding:'14px 16px',
        display:'flex', alignItems:'center', justifyContent:'space-between',
      }}>
        <button onClick={() => {
          if (view === 'nursery' || view === 'setup') onBack();
          else setView('nursery');
        }} style={topBtn()}>← Back</button>
        <div style={{ fontFamily:SERIF, fontSize:'1.05rem', color:P.cream, letterSpacing:'0.03em' }}>
          {view === 'setup' ? '🕯️ The Nursery' :
           view === 'letters' ? '💌 Letters' :
           view === 'checkin' ? '🌿 Today' :
           view === 'milestones' ? '🌙 Mementos' :
           view === 'garden' ? '🌷 Garden' :
           view === 'book' ? '📖 Keepsake Book' :
           view === 'week' ? `Week ${activeWeek || weekIdx}` :
           '🕯️ The Nursery'}
        </div>
        <div style={{ width:60 }} />
      </div>

      <div style={{ padding:'22px 16px', maxWidth:720, margin:'0 auto' }}>
        {view === 'setup' && (
          <SetupFlow
            state={state}
            onComplete={(data) => {
              update({ ...data, setupComplete: true });
              setView('nursery');
            }}
          />
        )}

        {view === 'nursery' && (
          <NurseryHome
            state={state}
            current={current}
            weekData={weekData}
            onWeekClick={() => { setActiveWeek(weekIdx); setView('week'); }}
            onLetters={() => setView('letters')}
            onCheckin={() => setView('checkin')}
            onMilestones={() => setView('milestones')}
            onGarden={() => setView('garden')}
            onBook={() => setView('book')}
          />
        )}

        {view === 'week' && (
          <WeekView
            weekNum={activeWeek || weekIdx}
            faithMode={state.faithMode}
            onChangeWeek={(w) => setActiveWeek(w)}
            onWriteLetter={() => setView('letters')}
          />
        )}

        {view === 'letters' && (
          <LettersView
            letters={state.letters}
            babyNickname={state.babyNickname}
            currentWeek={weekIdx}
            onSave={(letter) => update({ letters: [letter, ...state.letters] })}
            onDelete={(id) => update({ letters: state.letters.filter(l => l.id !== id) })}
          />
        )}

        {view === 'checkin' && (
          <CheckinView
            checkins={state.checkins}
            onSave={(entry) => update({ checkins: [entry, ...state.checkins] })}
          />
        )}

        {view === 'milestones' && (
          <MilestonesView
            milestones={state.milestones}
            onSave={(id, data) => update({ milestones: { ...state.milestones, [id]: data } })}
            onClear={(id) => {
              const next = { ...state.milestones };
              delete next[id];
              update({ milestones: next });
            }}
          />
        )}

        {view === 'garden' && (
          <GardenView
            currentWeek={weekIdx}
            onPickWeek={(w) => { setActiveWeek(w); setView('week'); }}
          />
        )}

        {view === 'book' && (
          <KeepsakeBookView
            state={state}
            currentWeek={weekIdx}
            onUpdateDedication={(text) => update({ bookDedication: text })}
            onUpdateMotherName={(name) => update({ motherName: name })}
            onSaveOrder={(order) => update({ orders: [order, ...(state.orders || [])] })}
          />
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  SETUP FLOW
// ═══════════════════════════════════════════════════════════════
function SetupFlow({ state, onComplete }) {
  const [step, setStep] = useState(0);
  const [dueDate, setDueDate] = useState(state.dueDate || '');
  const [babyNickname, setBabyNickname] = useState(state.babyNickname || '');
  // Faith mode is always Christian — the nursery is built around weekly scripture
  const faithMode = 'christian';

  const steps = [
    {
      title: "You're carrying something holy.",
      body: "Let's make this season beautiful together. This space is just for you — a place to remember every small moment.",
      cta: 'Begin',
      render: null,
    },
    {
      title: 'When is your due date?',
      body: "We'll use this to follow along with you — week by week, letter by letter.",
      cta: 'Continue',
      render: (
        <input
          type="date"
          value={dueDate}
          onChange={e => setDueDate(e.target.value)}
          style={inputStyle()}
        />
      ),
    },
    {
      title: 'Do they have a nickname yet?',
      body: "Something just between you two. You can skip this — or change it later.",
      cta: 'Enter the nursery',
      render: (
        <input
          type="text"
          value={babyNickname}
          onChange={e => setBabyNickname(e.target.value)}
          placeholder="Peach, Little One, Baby Bean…"
          style={inputStyle()}
        />
      ),
    },
  ];

  const s = steps[step];
  const canProceed = step !== 1 || !!dueDate;

  return (
    <div style={{ marginTop:40 }}>
      <div style={{ textAlign:'center', marginBottom:30 }}>
        <div style={{ fontSize:'2.5rem', marginBottom:16 }}>🕯️</div>
        <div style={{ fontFamily:SERIF, fontSize:'1.4rem', color:P.cream, marginBottom:12, lineHeight:1.4 }}>
          {s.title}
        </div>
        <div style={{ fontSize:'0.88rem', color:P.taupe, maxWidth:360, margin:'0 auto', lineHeight:1.6 }}>
          {s.body}
        </div>
      </div>

      {s.render && (
        <div style={{ marginBottom:26 }}>{s.render}</div>
      )}

      <div style={{ display:'flex', justifyContent:'center', gap:10 }}>
        {step > 0 && (
          <button onClick={() => setStep(step - 1)} style={ghostBtn()}>Back</button>
        )}
        <button
          disabled={!canProceed}
          onClick={() => {
            if (step === steps.length - 1) {
              onComplete({ dueDate, babyNickname, faithMode });
            } else {
              setStep(step + 1);
            }
          }}
          style={{ ...primaryBtn(), opacity: canProceed ? 1 : 0.5 }}
        >{s.cta}</button>
      </div>

      <div style={{ display:'flex', justifyContent:'center', gap:6, marginTop:30 }}>
        {steps.map((_, i) => (
          <span key={i} style={{
            width:6, height:6, borderRadius:'50%',
            background: i === step ? P.rose : P.borderL,
          }} />
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  NURSERY HOME
// ═══════════════════════════════════════════════════════════════
function NurseryHome({ state, current, weekData, onWeekClick, onLetters, onCheckin, onMilestones, onGarden, onBook }) {
  const greeting = getGreeting();
  const daysUntil = current?.daysUntilDue ?? null;
  const bloomRatio = current ? Math.min(1, current.week / 40) : 0;

  return (
    <div>
      {/* Greeting */}
      <div style={{ textAlign:'center', marginBottom:28, marginTop:8 }}>
        <div style={{ fontSize:'0.78rem', color:P.taupe, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>
          {greeting}
        </div>
        {current && (
          <>
            <div style={{ fontFamily:SERIF, fontSize:'2rem', color:P.cream, lineHeight:1.1, marginBottom:6 }}>
              {current.week <= 40 ? (
                <>Week <span style={{ color:P.rose }}>{current.week}</span>, day {current.dayOfWeek}</>
              ) : (
                <>Any day now.</>
              )}
            </div>
            <div style={{ fontSize:'0.82rem', color:P.taupe }}>
              {current.isPostTerm
                ? `Past due by ${Math.abs(daysUntil)} day${Math.abs(daysUntil) === 1 ? '' : 's'} — soon.`
                : current.week >= 37
                  ? `${daysUntil} day${daysUntil === 1 ? '' : 's'} until their due date.`
                  : `Trimester ${current.trimester}. ${daysUntil} days to go.`}
            </div>
          </>
        )}
      </div>

      {/* Bloom garden indicator */}
      <div style={{
        background:P.panel, border:`1px solid ${P.border}`,
        borderRadius:16, padding:'18px 20px', marginBottom:16,
      }}>
        <div style={{ fontSize:'0.68rem', color:P.taupe, letterSpacing:'0.08em', marginBottom:8 }}>YOUR GARDEN</div>
        <div style={{ display:'flex', gap:3, flexWrap:'wrap', fontSize:'0.85rem', lineHeight:1.3 }}>
          {Array.from({ length: 40 }, (_, i) => (
            <span key={i} style={{ opacity: i < (current?.week || 0) ? 1 : 0.2 }}>
              {i < (current?.week || 0) ? '🌷' : '🤍'}
            </span>
          ))}
        </div>
        <div style={{ marginTop:10, fontSize:'0.72rem', color:P.taupe, fontStyle:'italic' }}>
          {current ? `${current.week} of 40 weeks. ${Math.round(bloomRatio * 100)}% bloomed.` : 'Your garden is getting ready.'}
        </div>
      </div>

      {/* This week's card */}
      {weekData && (
        <button onClick={onWeekClick} style={{
          width:'100%', textAlign:'left',
          background:`linear-gradient(135deg, ${P.head}, rgba(212,144,152,0.04))`,
          border:`1.5px solid ${P.border}`,
          borderRadius:16, padding:'20px 20px',
          cursor:'pointer', color:P.cream, fontFamily:SANS,
          marginBottom:14, transition:'all 0.2s',
        }} onMouseEnter={e => e.currentTarget.style.borderColor = P.rose}
           onMouseLeave={e => e.currentTarget.style.borderColor = P.border}>
          <div style={{ fontSize:'0.66rem', color:P.rose, letterSpacing:'0.1em', marginBottom:6 }}>THIS WEEK</div>
          <div style={{ fontFamily:SERIF, fontSize:'1.15rem', color:P.cream, marginBottom:8 }}>
            {weekData.title}
          </div>
          <div style={{ fontSize:'0.85rem', color:P.cream, lineHeight:1.6, opacity:0.88 }}>
            {weekData.baby}
          </div>
          <div style={{ marginTop:12, fontSize:'0.72rem', color:P.rose, letterSpacing:'0.05em' }}>
            Read more →
          </div>
        </button>
      )}

      {/* Hotspots grid */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
        <HotspotBtn icon="🌿" label="Today" sub="how you feel" onClick={onCheckin} />
        <HotspotBtn icon="💌" label="Letters" sub={`${state.letters.length} written`} onClick={onLetters} />
        <HotspotBtn icon="🌙" label="Mementos" sub={`${Object.keys(state.milestones).length}/${MILESTONES.length} saved`} onClick={onMilestones} />
        <HotspotBtn icon="🌷" label="Garden" sub="every week's bloom" onClick={onGarden} />
      </div>

      {/* Book is forming card — appears once she has content */}
      {(state.letters.length >= 1 || Object.keys(state.milestones).length >= 2) && (
        <button onClick={onBook} style={{
          width:'100%', textAlign:'left', marginBottom:14, marginTop:4,
          background:`linear-gradient(135deg, rgba(212,144,152,0.18), rgba(232,192,136,0.08))`,
          border:`1.5px solid ${P.border}`,
          borderRadius:16, padding:'18px 20px',
          cursor:'pointer', color:P.cream, fontFamily:SANS,
          transition:'all 0.2s',
          display:'grid', gridTemplateColumns:'48px 1fr auto', gap:14, alignItems:'center',
        }} onMouseEnter={e => e.currentTarget.style.borderColor = P.rose}
           onMouseLeave={e => e.currentTarget.style.borderColor = P.border}>
          <div style={{
            width:48, height:48, borderRadius:12,
            background:`linear-gradient(135deg, ${P.rose}, ${P.roseL})`,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:'1.5rem', color:P.bg,
          }}>📖</div>
          <div>
            <div style={{ fontFamily:SERIF, fontSize:'1rem', color:P.cream, marginBottom:3 }}>
              A little book is forming.
            </div>
            <div style={{ fontSize:'0.74rem', color:P.taupe, lineHeight:1.5 }}>
              {state.letters.length} letter{state.letters.length === 1 ? '' : 's'} · {Object.keys(state.milestones).length} memento{Object.keys(state.milestones).length === 1 ? '' : 's'}. Tap to peek inside.
            </div>
          </div>
          <div style={{ color:P.taupe, fontSize:'1.2rem' }}>›</div>
        </button>
      )}

      {/* Scripture / poem for this week */}
      {weekData && (
        <div style={{
          background:'transparent', border:`1px dashed ${P.borderL}`,
          borderRadius:14, padding:'18px 20px', marginTop:10,
          textAlign:'center',
        }}>
          {state.faithMode === 'christian' ? (
            <>
              <div style={{ fontFamily:SERIF, fontStyle:'italic', fontSize:'0.92rem', color:P.cream, lineHeight:1.6, marginBottom:8 }}>
                "{weekData.scripture.text}"
              </div>
              <div style={{ fontSize:'0.72rem', color:P.rose, letterSpacing:'0.1em' }}>
                — {weekData.scripture.ref}
              </div>
            </>
          ) : (
            <div style={{ fontFamily:SERIF, fontStyle:'italic', fontSize:'0.95rem', color:P.cream, lineHeight:1.6 }}>
              {weekData.poem}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  WEEK VIEW — full screen weekly card
// ═══════════════════════════════════════════════════════════════
function WeekView({ weekNum, faithMode, onChangeWeek, onWriteLetter }) {
  const data = PREGNANCY_WEEKS[weekNum - 1];
  if (!data) return null;
  return (
    <div>
      {/* Navigation */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
        <button onClick={() => weekNum > 1 && onChangeWeek(weekNum - 1)}
          disabled={weekNum <= 1}
          style={{ ...ghostBtn(), opacity: weekNum > 1 ? 1 : 0.3 }}>‹ {weekNum > 1 ? `Week ${weekNum - 1}` : ''}</button>
        <button onClick={() => weekNum < 40 && onChangeWeek(weekNum + 1)}
          disabled={weekNum >= 40}
          style={{ ...ghostBtn(), opacity: weekNum < 40 ? 1 : 0.3 }}>{weekNum < 40 ? `Week ${weekNum + 1}` : ''} ›</button>
      </div>

      {/* Week card */}
      <div style={{
        background:P.panel, border:`1px solid ${P.border}`,
        borderRadius:18, padding:'30px 24px',
        textAlign:'center',
      }}>
        <div style={{ fontSize:'0.72rem', color:P.rose, letterSpacing:'0.2em', marginBottom:10 }}>
          WEEK {data.week}
        </div>
        <div style={{ fontFamily:SERIF, fontSize:'1.6rem', color:P.cream, lineHeight:1.2, marginBottom:20 }}>
          {data.title}
        </div>
        <div style={{ width:40, height:1, background:P.border, margin:'0 auto 22px' }} />

        <div style={{ textAlign:'left', marginBottom:22 }}>
          <div style={{ fontSize:'0.66rem', color:P.taupe, letterSpacing:'0.08em', marginBottom:6 }}>THEIR WEEK</div>
          <div style={{ fontFamily:SERIF, fontSize:'0.95rem', color:P.cream, lineHeight:1.7 }}>
            {data.baby}
          </div>
        </div>

        <div style={{ textAlign:'left', marginBottom:22 }}>
          <div style={{ fontSize:'0.66rem', color:P.taupe, letterSpacing:'0.08em', marginBottom:6 }}>YOUR WEEK</div>
          <div style={{ fontFamily:SERIF, fontSize:'0.95rem', color:P.cream, lineHeight:1.7 }}>
            {data.body}
          </div>
        </div>

        {faithMode === 'christian' ? (
          <div style={{
            textAlign:'center', padding:'18px 16px',
            background:`linear-gradient(180deg, ${P.head}, transparent)`,
            borderRadius:12, marginBottom:22,
          }}>
            <div style={{ fontFamily:SERIF, fontStyle:'italic', fontSize:'0.92rem', color:P.cream, lineHeight:1.6, marginBottom:8 }}>
              "{data.scripture.text}"
            </div>
            <div style={{ fontSize:'0.72rem', color:P.rose, letterSpacing:'0.08em' }}>
              — {data.scripture.ref}
            </div>
          </div>
        ) : (
          <div style={{
            textAlign:'center', padding:'18px 16px',
            background:`linear-gradient(180deg, ${P.head}, transparent)`,
            borderRadius:12, marginBottom:22,
          }}>
            <div style={{ fontFamily:SERIF, fontStyle:'italic', fontSize:'0.95rem', color:P.cream, lineHeight:1.6 }}>
              {data.poem}
            </div>
          </div>
        )}

        <div style={{ textAlign:'left', marginBottom:22 }}>
          <div style={{ fontSize:'0.66rem', color:P.taupe, letterSpacing:'0.08em', marginBottom:6 }}>A PROMPT</div>
          <div style={{ fontFamily:SERIF, fontStyle:'italic', fontSize:'0.92rem', color:P.cream, lineHeight:1.6 }}>
            {data.prompt}
          </div>
        </div>

        <button onClick={onWriteLetter} style={{ ...primaryBtn(), width:'100%' }}>
          Write them a letter
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  LETTERS
// ═══════════════════════════════════════════════════════════════
function LettersView({ letters, babyNickname, currentWeek, onSave, onDelete }) {
  const [mode, setMode] = useState(letters.length === 0 ? 'compose' : 'list');
  const [text, setText] = useState('');
  const [sealUntilBirth, setSealUntilBirth] = useState(false);

  const save = () => {
    if (!text.trim()) return;
    const letter = {
      id: 'l' + Date.now(),
      date: new Date().toISOString(),
      week: currentWeek,
      text: text.trim(),
      sealUntilBirth,
    };
    onSave(letter);
    setText('');
    setSealUntilBirth(false);
    setMode('list');
  };

  if (mode === 'compose') {
    return (
      <div>
        <div style={{ textAlign:'center', marginBottom:20 }}>
          <div style={{ fontFamily:SERIF, fontSize:'1.3rem', color:P.cream, marginBottom:6 }}>
            A letter to {babyNickname || 'your baby'}
          </div>
          <div style={{ fontSize:'0.78rem', color:P.taupe }}>
            Week {currentWeek} · {new Date().toLocaleDateString()}
          </div>
        </div>

        <div style={{
          background:P.panel, border:`1px solid ${P.border}`,
          borderRadius:14, overflow:'hidden',
        }}>
          <textarea
            autoFocus
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Dear little one…"
            style={{
              width:'100%', minHeight:240,
              background:'transparent', border:'none', outline:'none',
              color:P.cream, fontFamily:SERIF, fontSize:'0.95rem',
              lineHeight:1.7, padding:'18px 20px',
              resize:'vertical',
              boxSizing:'border-box',
            }}
          />
        </div>

        <label style={{
          display:'flex', alignItems:'center', gap:8, marginTop:14,
          cursor:'pointer', fontSize:'0.82rem', color:P.taupe,
        }}>
          <input type="checkbox" checked={sealUntilBirth} onChange={e => setSealUntilBirth(e.target.checked)} />
          <span>Seal until birth (read together someday)</span>
        </label>

        <div style={{ display:'flex', gap:10, marginTop:18 }}>
          <button onClick={() => { setText(''); setMode('list'); }} style={{ ...ghostBtn(), flex:1 }}>Cancel</button>
          <button onClick={save} disabled={!text.trim()} style={{ ...primaryBtn(), flex:1, opacity: text.trim() ? 1 : 0.5 }}>
            {sealUntilBirth ? 'Seal the letter' : 'Save letter'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:16 }}>
        <div>
          <div style={{ fontFamily:SERIF, fontSize:'1.2rem', color:P.cream }}>
            {letters.length} letter{letters.length === 1 ? '' : 's'}
          </div>
          <div style={{ fontSize:'0.76rem', color:P.taupe, marginTop:2 }}>
            Little messages for {babyNickname || 'your baby'}
          </div>
        </div>
        <button onClick={() => setMode('compose')} style={primaryBtn()}>+ Write</button>
      </div>

      {letters.length === 0 && (
        <div style={{
          textAlign:'center', padding:'40px 20px',
          border:`1px dashed ${P.border}`, borderRadius:14,
          color:P.taupe, fontSize:'0.88rem', lineHeight:1.6,
        }}>
          No letters yet.<br/>
          <span style={{ fontStyle:'italic' }}>Start with one sentence — you'll be glad you did.</span>
        </div>
      )}

      <div style={{ display:'grid', gap:10 }}>
        {letters.map(l => (
          <LetterCard key={l.id} letter={l} onDelete={() => onDelete(l.id)} />
        ))}
      </div>
    </div>
  );
}

function LetterCard({ letter, onDelete }) {
  const [open, setOpen] = useState(false);
  const date = new Date(letter.date).toLocaleDateString(undefined, { month:'long', day:'numeric', year:'numeric' });
  return (
    <div style={{
      background:P.panel, border:`1px solid ${P.border}`,
      borderRadius:12, overflow:'hidden',
    }}>
      <button onClick={() => setOpen(!open)} style={{
        width:'100%', textAlign:'left', background:'transparent',
        border:'none', cursor:'pointer', padding:'14px 16px',
        color:P.cream, fontFamily:SANS,
        display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10,
      }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:'0.72rem', color:P.rose, letterSpacing:'0.05em', marginBottom:4 }}>
            {letter.sealUntilBirth && '🔒 '}Week {letter.week || '?'} · {date}
          </div>
          <div style={{
            fontFamily:SERIF, fontSize:'0.9rem', color:P.cream,
            overflow:'hidden', textOverflow:'ellipsis',
            whiteSpace: open ? 'pre-wrap' : 'nowrap',
            lineHeight: open ? 1.7 : 1.3,
          }}>
            {letter.sealUntilBirth && !open ? '(Sealed — tap to read)' : letter.text}
          </div>
        </div>
        <span style={{ color:P.taupe }}>{open ? '▴' : '▾'}</span>
      </button>
      {open && (
        <div style={{ padding:'4px 16px 14px', borderTop:`1px solid ${P.borderL}`, display:'flex', justifyContent:'flex-end' }}>
          <button onClick={onDelete} style={{
            background:'transparent', border:'none', color:P.taupe,
            cursor:'pointer', fontSize:'0.72rem', padding:'6px 10px',
          }}>Delete</button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  DAILY CHECK-IN
// ═══════════════════════════════════════════════════════════════
function CheckinView({ checkins, onSave }) {
  const [mood, setMood] = useState(null);
  const [symptoms, setSymptoms] = useState([]);
  const [reflection, setReflection] = useState('');

  const today = new Date().toISOString().slice(0, 10);
  const alreadyToday = checkins.some(c => c.date === today);

  const toggleSymptom = (s) => {
    setSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const save = () => {
    if (!mood) return;
    onSave({
      id: 'c' + Date.now(),
      date: today,
      time: new Date().toISOString(),
      mood,
      symptoms,
      reflection: reflection.trim(),
    });
    setMood(null); setSymptoms([]); setReflection('');
  };

  return (
    <div>
      <div style={{ textAlign:'center', marginBottom:24 }}>
        <div style={{ fontFamily:SERIF, fontSize:'1.3rem', color:P.cream, marginBottom:6 }}>
          How are you, really?
        </div>
        <div style={{ fontSize:'0.82rem', color:P.taupe, fontStyle:'italic' }}>
          You don't have to be okay. You just have to be honest.
        </div>
      </div>

      {alreadyToday && (
        <div style={{
          textAlign:'center', fontSize:'0.76rem', color:P.olive,
          marginBottom:16, fontStyle:'italic',
        }}>
          ✓ You already checked in today — but you can add another.
        </div>
      )}

      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:'0.68rem', color:P.taupe, letterSpacing:'0.08em', marginBottom:10 }}>MOOD</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:8 }}>
          {PREGNANCY_MOODS.map(m => {
            const active = mood === m.id;
            return (
              <button key={m.id} onClick={() => setMood(m.id)} style={{
                background: active ? P.head : P.panel,
                border:`1px solid ${active ? P.rose : P.border}`,
                borderRadius:12, padding:'14px 6px',
                cursor:'pointer', color:P.cream, fontFamily:SANS,
                transition:'all 0.15s',
              }}>
                <div style={{ fontSize:'1.4rem', marginBottom:4 }}>{m.emoji}</div>
                <div style={{ fontSize:'0.7rem', color: active ? P.cream : P.taupe }}>{m.label}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:'0.68rem', color:P.taupe, letterSpacing:'0.08em', marginBottom:10 }}>
          ANY SYMPTOMS TODAY? <span style={{ textTransform:'none', letterSpacing:'0', fontStyle:'italic' }}>(optional)</span>
        </div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {PREGNANCY_SYMPTOMS.map(s => {
            const active = symptoms.includes(s);
            return (
              <button key={s} onClick={() => toggleSymptom(s)} style={{
                padding:'6px 12px', borderRadius:999,
                background: active ? P.head : 'transparent',
                border:`1px solid ${active ? P.rose : P.border}`,
                color: active ? P.cream : P.taupe,
                cursor:'pointer', fontSize:'0.76rem', fontFamily:SANS,
              }}>{s}</button>
            );
          })}
        </div>
      </div>

      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:'0.68rem', color:P.taupe, letterSpacing:'0.08em', marginBottom:10 }}>
          A NOTE FOR TODAY <span style={{ textTransform:'none', letterSpacing:'0', fontStyle:'italic' }}>(optional)</span>
        </div>
        <textarea
          value={reflection}
          onChange={e => setReflection(e.target.value)}
          placeholder="What do you want to remember about today?"
          style={{
            width:'100%', minHeight:100,
            background:P.panel, border:`1px solid ${P.border}`,
            borderRadius:12, padding:'12px 14px',
            color:P.cream, fontFamily:SERIF, fontSize:'0.9rem',
            lineHeight:1.6, outline:'none', resize:'vertical',
            boxSizing:'border-box',
          }}
        />
      </div>

      <button onClick={save} disabled={!mood} style={{ ...primaryBtn(), width:'100%', opacity: mood ? 1 : 0.5 }}>
        Save this moment
      </button>

      {/* Recent check-ins */}
      {checkins.length > 0 && (
        <div style={{ marginTop:34 }}>
          <div style={{ fontSize:'0.68rem', color:P.taupe, letterSpacing:'0.08em', marginBottom:10 }}>
            RECENT CHECK-INS
          </div>
          <div style={{ display:'grid', gap:8 }}>
            {checkins.slice(0, 10).map(c => {
              const m = PREGNANCY_MOODS.find(x => x.id === c.mood);
              return (
                <div key={c.id} style={{
                  background:P.panel, border:`1px solid ${P.borderL}`,
                  borderRadius:10, padding:'10px 14px',
                  fontSize:'0.8rem', color:P.cream,
                }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
                    <span>{m?.emoji} {m?.label}</span>
                    <span style={{ fontSize:'0.7rem', color:P.taupe }}>{c.date}</span>
                  </div>
                  {c.symptoms?.length > 0 && (
                    <div style={{ fontSize:'0.72rem', color:P.taupe, marginTop:4 }}>
                      {c.symptoms.join(' · ')}
                    </div>
                  )}
                  {c.reflection && (
                    <div style={{ fontFamily:SERIF, fontSize:'0.82rem', color:P.cream, marginTop:6, fontStyle:'italic', lineHeight:1.5 }}>
                      {c.reflection}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MILESTONES
// ═══════════════════════════════════════════════════════════════
function MilestonesView({ milestones, onSave, onClear }) {
  const [active, setActive] = useState(null);
  const [reflection, setReflection] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  if (active) {
    const m = MILESTONES.find(x => x.id === active);
    const existing = milestones[active];
    return (
      <div>
        <button onClick={() => setActive(null)} style={{ ...ghostBtn(), marginBottom:16 }}>← Mementos</button>

        <div style={{ textAlign:'center', marginBottom:20 }}>
          <div style={{ fontSize:'2.5rem', marginBottom:10 }}>{m.emoji}</div>
          <div style={{ fontFamily:SERIF, fontSize:'1.25rem', color:P.cream }}>{m.label}</div>
        </div>

        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:'0.68rem', color:P.taupe, letterSpacing:'0.08em', marginBottom:8 }}>DATE IT HAPPENED</div>
          <input
            type="date" value={existing?.date || date}
            onChange={e => setDate(e.target.value)}
            style={inputStyle()}
          />
        </div>

        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:'0.68rem', color:P.taupe, letterSpacing:'0.08em', marginBottom:8 }}>A NOTE TO REMEMBER</div>
          <textarea
            value={existing?.reflection ?? reflection}
            onChange={e => setReflection(e.target.value)}
            placeholder="What do you want to remember about this moment?"
            style={{
              width:'100%', minHeight:120,
              background:P.panel, border:`1px solid ${P.border}`,
              borderRadius:12, padding:'12px 14px',
              color:P.cream, fontFamily:SERIF, fontSize:'0.9rem',
              lineHeight:1.6, outline:'none', resize:'vertical', boxSizing:'border-box',
            }}
          />
        </div>

        <div style={{ display:'flex', gap:10 }}>
          {existing && (
            <button onClick={() => { onClear(active); setActive(null); }}
              style={{ ...ghostBtn() }}>Clear</button>
          )}
          <button onClick={() => {
            onSave(active, { date: existing?.date || date, reflection: existing?.reflection ?? reflection });
            setActive(null); setReflection('');
          }} style={{ ...primaryBtn(), flex:1 }}>
            {existing ? 'Update memento' : 'Save memento'}
          </button>
        </div>
      </div>
    );
  }

  const filled = Object.keys(milestones).length;
  return (
    <div>
      <div style={{ textAlign:'center', marginBottom:22 }}>
        <div style={{ fontFamily:SERIF, fontSize:'1.3rem', color:P.cream, marginBottom:6 }}>
          🌙 Mementos
        </div>
        <div style={{ fontSize:'0.82rem', color:P.taupe }}>
          {filled} of {MILESTONES.length} saved. Tap one when it happens.
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        {MILESTONES.map(m => {
          const saved = milestones[m.id];
          return (
            <button key={m.id} onClick={() => setActive(m.id)} style={{
              background: saved
                ? `linear-gradient(135deg, ${P.head}, rgba(212,144,152,0.04))`
                : P.panel,
              border:`1.5px solid ${saved ? P.rose : P.borderL}`,
              borderRadius:14, padding:'18px 14px',
              cursor:'pointer', color:P.cream, fontFamily:SANS,
              textAlign:'left',
              transition:'all 0.2s',
            }}>
              <div style={{ fontSize:'1.6rem', marginBottom:6, opacity: saved ? 1 : 0.4 }}>{m.emoji}</div>
              <div style={{ fontFamily:SERIF, fontSize:'0.82rem', color: saved ? P.cream : P.taupe, marginBottom:4 }}>
                {m.label}
              </div>
              {saved && (
                <div style={{ fontSize:'0.68rem', color:P.rose, letterSpacing:'0.05em' }}>
                  {new Date(saved.date).toLocaleDateString()}
                </div>
              )}
              {!saved && (
                <div style={{ fontSize:'0.68rem', color:P.taupe, fontStyle:'italic' }}>Not yet</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  GARDEN VIEW — 40 blooms
// ═══════════════════════════════════════════════════════════════
function GardenView({ currentWeek, onPickWeek }) {
  return (
    <div>
      <div style={{ textAlign:'center', marginBottom:22 }}>
        <div style={{ fontFamily:SERIF, fontSize:'1.3rem', color:P.cream, marginBottom:6 }}>
          🌷 40 Weeks, 40 Blooms
        </div>
        <div style={{ fontSize:'0.82rem', color:P.taupe }}>
          Tap any bloom to revisit that week.
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:10 }}>
        {Array.from({ length: 40 }, (_, i) => {
          const wk = i + 1;
          const reached = wk <= currentWeek;
          const isCurrent = wk === currentWeek;
          return (
            <button key={wk} onClick={() => onPickWeek(wk)} style={{
              background: isCurrent
                ? `linear-gradient(135deg, ${P.rose}, ${P.roseL})`
                : reached ? P.head : P.panel,
              border:`1px solid ${isCurrent ? P.rose : reached ? P.border : P.borderL}`,
              borderRadius:10, padding:'14px 6px',
              cursor:'pointer', color: isCurrent ? P.bg : P.cream, fontFamily:SANS,
              aspectRatio:'1', display:'flex', flexDirection:'column',
              alignItems:'center', justifyContent:'center', gap:4,
              opacity: reached ? 1 : 0.55,
              transition:'all 0.15s',
            }}>
              <div style={{ fontSize:'1.3rem' }}>{reached ? '🌷' : '🌱'}</div>
              <div style={{ fontSize:'0.64rem', color: isCurrent ? P.bg : reached ? P.cream : P.taupe, fontWeight: isCurrent ? 700 : 400 }}>
                wk {wk}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════
//  KEEPSAKE BOOK VIEW — compile + preview + download PDF
// ═══════════════════════════════════════════════════════════════
function KeepsakeBookView({ state, currentWeek, onUpdateDedication, onUpdateMotherName, onSaveOrder }) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [dedication, setDedication] = useState(state.bookDedication || '');
  const [motherName, setMotherName] = useState(state.motherName || '');

  const letterCount = state.letters?.length || 0;
  const mementoCount = Object.keys(state.milestones || {}).length;
  const babyName = state.babyNickname || 'Little One';

  const pageEstimate = useMemo(() => {
    // Rough: cover + title + dedication + opening + TOC + closing = 6
    // Week spreads: only weeks up to current
    // Letters: 1 page each
    // Mementos: 1 page (or 2 if many)
    const weekPages = Math.min(40, currentWeek || 1);
    const letterPages = letterCount;
    const mementoPages = mementoCount > 0 ? 2 : 0;
    return 6 + weekPages + letterPages + mementoPages;
  }, [currentWeek, letterCount, mementoCount]);

  const handleGenerate = async () => {
    setError(null);
    setGenerating(true);
    try {
      // Persist any edits
      if (dedication !== (state.bookDedication || '')) onUpdateDedication(dedication);
      if (motherName !== (state.motherName || '')) onUpdateMotherName(motherName);

      // Dynamic import keeps the PDF lib out of the main bundle
      const [{ pdf }, { PREGNANCY_WEEKS }, { default: PregnancyBookDocument }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('../data/pregnancyWeeks.js'),
        import('../book/PregnancyBookDocument.jsx'),
      ]);

      // Include weeks up to current (or all 40 if post-term)
      const weeksToInclude = PREGNANCY_WEEKS.slice(0, Math.min(40, currentWeek || 1));

      const doc = (
        <PregnancyBookDocument
          pregnancy={{ ...state, bookDedication: dedication, motherName }}
          motherName={motherName || 'Mama'}
          weeksData={weeksToInclude}
          dedication={dedication}
        />
      );

      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeBaby = babyName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      a.download = `the-story-of-${safeBaby}.pdf`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 300);
    } catch (e) {
      console.error(e);
      setError(e?.message || 'Something went wrong generating the book.');
    } finally {
      setGenerating(false);
    }
  };

  const handlePreview = async () => {
    setError(null);
    setGenerating(true);
    try {
      if (dedication !== (state.bookDedication || '')) onUpdateDedication(dedication);
      if (motherName !== (state.motherName || '')) onUpdateMotherName(motherName);

      const [{ pdf }, { PREGNANCY_WEEKS }, { default: PregnancyBookDocument }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('../data/pregnancyWeeks.js'),
        import('../book/PregnancyBookDocument.jsx'),
      ]);

      const weeksToInclude = PREGNANCY_WEEKS.slice(0, Math.min(40, currentWeek || 1));

      const doc = (
        <PregnancyBookDocument
          pregnancy={{ ...state, bookDedication: dedication, motherName }}
          motherName={motherName || 'Mama'}
          weeksData={weeksToInclude}
          dedication={dedication}
        />
      );

      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (e) {
      console.error(e);
      setError(e?.message || 'Something went wrong generating the book.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div>
      {/* Book cover mockup */}
      <div style={{ textAlign:'center', marginBottom:28 }}>
        <div style={{
          display:'inline-block',
          width:180, height:240,
          background:'linear-gradient(135deg, #FAF6EE, #F4EADF)',
          border:`8px solid ${P.roseL}`,
          boxShadow:'0 12px 32px rgba(0,0,0,0.4)',
          padding:'28px 18px',
          textAlign:'center',
          color:P.brown,
          fontFamily:SERIF,
          marginBottom:20,
          position:'relative',
        }}>
          <div style={{ fontSize:'0.5rem', letterSpacing:'0.3em', color:P.rose, marginBottom:10, textTransform:'uppercase' }}>
            A Keepsake Book
          </div>
          <div style={{ width:30, height:1, background:P.rose, margin:'8px auto' }} />
          <div style={{ fontFamily:SERIF, fontSize:'0.95rem', fontWeight:700, lineHeight:1.2, color:P.brown, marginBottom:6 }}>
            The Story{'\n'}of {babyName}
          </div>
          <div style={{ fontSize:'0.6rem', fontStyle:'italic', color:P.taupe, marginBottom:10 }}>
            Before we ever met
          </div>
          <div style={{ width:30, height:1, background:P.rose, margin:'8px auto' }} />
          {motherName && (
            <div style={{ fontSize:'0.5rem', letterSpacing:'0.2em', color:P.taupe, marginTop:8, textTransform:'uppercase' }}>
              by {motherName}
            </div>
          )}
        </div>
        <div style={{ fontFamily:SERIF, fontSize:'1.3rem', color:P.cream, marginBottom:4 }}>
          Your Keepsake Book
        </div>
        <div style={{ fontSize:'0.82rem', color:P.taupe, fontStyle:'italic' }}>
          Everything you've written, bound in one place.
        </div>
      </div>

      {/* Stats */}
      <div style={{
        background:P.panel, border:`1px solid ${P.border}`,
        borderRadius:14, padding:'16px 18px', marginBottom:18,
      }}>
        <div style={{ fontSize:'0.66rem', color:P.taupe, letterSpacing:'0.08em', marginBottom:10 }}>WHAT'S INSIDE</div>
        <StatLine label="Weeks chronicled" value={`${Math.min(40, currentWeek)}`} />
        <StatLine label="Letters written" value={letterCount} />
        <StatLine label="Mementos saved" value={mementoCount} />
        <StatLine label="Estimated pages" value={`~${pageEstimate}`} />
      </div>

      {/* Book editor */}
      <div style={{ marginBottom:18 }}>
        <div style={{ fontSize:'0.68rem', color:P.taupe, letterSpacing:'0.08em', marginBottom:8 }}>
          YOUR NAME (appears on cover)
        </div>
        <input
          type="text" value={motherName}
          onChange={e => setMotherName(e.target.value)}
          placeholder="e.g. Sarah"
          style={inputStyle()}
        />
      </div>

      <div style={{ marginBottom:22 }}>
        <div style={{ fontSize:'0.68rem', color:P.taupe, letterSpacing:'0.08em', marginBottom:8 }}>
          DEDICATION <span style={{ textTransform:'none', fontStyle:'italic', letterSpacing:0 }}>(optional — we have a beautiful default)</span>
        </div>
        <textarea
          value={dedication}
          onChange={e => setDedication(e.target.value)}
          placeholder={`For you, ${babyName}.\nBefore we ever met, you were already loved.`}
          style={{
            width:'100%', minHeight:90,
            background:P.panel, border:`1px solid ${P.border}`,
            borderRadius:12, padding:'12px 14px',
            color:P.cream, fontFamily:SERIF, fontSize:'0.92rem',
            lineHeight:1.6, outline:'none', resize:'vertical', boxSizing:'border-box',
          }}
        />
      </div>

      {/* Actions */}
      <div style={{ display:'grid', gap:10 }}>
        <button onClick={handlePreview} disabled={generating} style={{
          ...primaryBtn(), width:'100%', opacity: generating ? 0.6 : 1,
        }}>
          {generating ? 'Binding your book…' : '📖 Preview your book'}
        </button>
        <button onClick={handleGenerate} disabled={generating} style={{
          ...ghostBtn(), width:'100%', opacity: generating ? 0.6 : 1,
        }}>
          {generating ? '…' : '⬇ Download as PDF'}
        </button>
      </div>

      {error && (
        <div style={{
          marginTop:14, padding:'10px 14px',
          background:'rgba(200,80,80,0.15)', border:'1px solid rgba(200,80,80,0.3)',
          borderRadius:10, color:'#E8B0B0', fontSize:'0.78rem',
        }}>
          {error}
        </div>
      )}

      {/* Print-on-demand order */}
      <div style={{ marginTop:24 }}>
        <OrderHardcoverPanel
          state={state}
          currentWeek={currentWeek}
          motherName={motherName}
          dedication={dedication}
          onSaveOrder={onSaveOrder}
        />
      </div>

      {/* Order history */}
      {(state.orders || []).length > 0 && (
        <div style={{ marginTop:18 }}>
          <OrderHistory orders={state.orders} />
        </div>
      )}

      {/* Empty state */}
      {letterCount === 0 && mementoCount === 0 && (
        <div style={{
          marginTop:20, padding:'18px 20px',
          background:P.panel, border:`1px dashed ${P.border}`,
          borderRadius:12, textAlign:'center',
          color:P.taupe, fontSize:'0.82rem', lineHeight:1.6, fontStyle:'italic',
        }}>
          Your book is waiting. Start with a letter or save a memento —<br/>
          every word you add becomes another page.
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  ORDER HARDCOVER PANEL — quote + checkout flow calling /api/lulu/*
// ═══════════════════════════════════════════════════════════════
function OrderHardcoverPanel({ state, currentWeek, motherName, dedication, onSaveOrder }) {
  const [step, setStep] = useState('intro'); // intro | address | quote | pay | ordering | success
  const [addr, setAddr] = useState({
    name: motherName || '',
    street1: '', street2: '',
    city: '', state_code: '', postcode: '',
    country_code: 'US',
    phone_number: '',
  });
  const [email, setEmail] = useState('');
  const [shippingLevel, setShippingLevel] = useState('MAIL');
  const [quote, setQuote] = useState(null);
  const [customerPrice, setCustomerPrice] = useState(null);
  const [paymentIntent, setPaymentIntent] = useState(null);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const bookIdRef = useRef(null);

  const letterCount = state.letters?.length || 0;
  const mementoCount = Object.keys(state.milestones || {}).length;
  const pageEstimate = useMemo(() => {
    const w = Math.min(40, currentWeek || 1);
    return Math.max(32, 6 + w + letterCount + (mementoCount > 0 ? 2 : 0));
  }, [currentWeek, letterCount, mementoCount]);

  const canQuote = addr.name && addr.street1 && addr.city && addr.postcode && addr.phone_number;

  // Step 1: get quote from Lulu + compute customer price
  const fetchQuote = async () => {
    setError(null); setBusy(true);
    try {
      const { getBookQuote, computeCustomerPrice } = await import('../book/orderApi.jsx');
      const data = await getBookQuote({
        pageCount: pageEstimate,
        shippingAddress: addr,
        shippingLevel,
      });
      setQuote(data);
      setCustomerPrice(computeCustomerPrice(data.total, data.currency));
      setStep('quote');
    } catch (e) {
      setError(e.message || 'Could not get a price quote.');
    } finally {
      setBusy(false);
    }
  };

  // Step 2: create PaymentIntent + move to pay step
  const proceedToPayment = async () => {
    setError(null); setBusy(true);
    try {
      const { createPaymentIntent } = await import('../book/orderApi.jsx');
      const bookId = `nursery-${Date.now()}`;
      bookIdRef.current = bookId;
      const intent = await createPaymentIntent({
        amountCents: Math.round(customerPrice.total * 100),
        currency: (customerPrice.currency || 'USD').toLowerCase(),
        orderId: bookId,
        customerEmail: email,
        babyName: state.babyNickname,
        motherName,
        shippingAddress: addr,
      });
      setPaymentIntent(intent);
      setStep('pay');
    } catch (e) {
      setError(e.message || 'Could not set up payment.');
    } finally {
      setBusy(false);
    }
  };

  // Step 3: after successful payment, generate PDFs + create Lulu print job
  const afterPaymentSuccess = async (stripePaymentId) => {
    setError(null); setBusy(true); setStep('ordering');
    try {
      const { buildAndUploadBook, createPrintOrder } = await import('../book/orderApi.jsx');
      const bookId = bookIdRef.current || `nursery-${Date.now()}`;
      const { interiorUrl, coverUrl, pageCount } = await buildAndUploadBook({
        pregnancy: state, motherName, currentWeek, dedication, bookId,
      });
      const title = `The Story of ${state.babyNickname || 'Little One'}`;
      const result = await createPrintOrder({
        title, interiorUrl, coverUrl, pageCount,
        shippingAddress: addr, shippingLevel,
        externalId: bookId, contactEmail: email,
      });
      setOrder(result);
      // Save to local state
      onSaveOrder && onSaveOrder({
        id: bookId,
        luluPrintJobId: result.id,
        stripePaymentId,
        status: result.status || 'CREATED',
        total: customerPrice.total,
        currency: customerPrice.currency,
        shippingAddress: addr,
        email,
        babyName: state.babyNickname,
        pageCount,
        trackingUrl: result.trackingUrl || null,
        createdAt: new Date().toISOString(),
      });
      setStep('success');
    } catch (e) {
      setError(`Payment succeeded but the print job failed: ${e.message}. Contact support with payment id ${stripePaymentId}.`);
      setStep('quote');
    } finally {
      setBusy(false);
    }
  };

  // ── UI ──
  if (step === 'success' && order) {
    return (
      <div style={panelBox()}>
        <div style={{ textAlign:'center', padding:'10px 0' }}>
          <div style={{ fontSize:'2rem', marginBottom:10 }}>📖</div>
          <div style={{ fontFamily:SERIF, fontSize:'1.15rem', color:P.cream, marginBottom:6 }}>
            Your book is on its way to being bound.
          </div>
          <div style={{ fontSize:'0.82rem', color:P.taupe, lineHeight:1.6 }}>
            Order <strong style={{ color:P.rose }}>#{order.id}</strong> received.
            We'll email {email} when it ships.
          </div>
          {order.estimatedShipping && (
            <div style={{ fontSize:'0.76rem', color:P.taupe, marginTop:10, fontStyle:'italic' }}>
              Estimated shipping: {order.estimatedShipping.arrival_min} – {order.estimatedShipping.arrival_max}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (step === 'intro') {
    return (
      <div style={panelBox()}>
        <div style={{ fontFamily:SERIF, fontSize:'1.05rem', color:P.cream, marginBottom:6 }}>
          🕊️ Order a hardcover copy
        </div>
        <div style={{ fontSize:'0.8rem', color:P.taupe, lineHeight:1.6, marginBottom:14 }}>
          We'll print your book as a 6×9" hardcover with cream pages, and ship it to your door.
          No printing or shipping on your end.
        </div>
        <div style={{ fontSize:'0.72rem', color:P.taupe, marginBottom:14, fontStyle:'italic' }}>
          ~{pageEstimate} pages · 6×9 hardcover · cream paper
        </div>
        <button onClick={() => setStep('address')} style={{ ...primaryBtn(), width:'100%' }}>
          Get a price →
        </button>
      </div>
    );
  }

  if (step === 'address' || step === 'quoting') {
    return (
      <div style={panelBox()}>
        <div style={{ fontFamily:SERIF, fontSize:'1.05rem', color:P.cream, marginBottom:14 }}>
          Where should we send it?
        </div>
        <div style={{ display:'grid', gap:10 }}>
          <Field label="Full name" value={addr.name} onChange={v => setAddr({...addr, name:v})} />
          <Field label="Email (for shipping updates)" value={email} onChange={setEmail} type="email" />
          <Field label="Address line 1" value={addr.street1} onChange={v => setAddr({...addr, street1:v})} />
          <Field label="Address line 2 (optional)" value={addr.street2} onChange={v => setAddr({...addr, street2:v})} />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            <Field label="City" value={addr.city} onChange={v => setAddr({...addr, city:v})} />
            <Field label="State / Region" value={addr.state_code} onChange={v => setAddr({...addr, state_code:v})} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            <Field label="Postal code" value={addr.postcode} onChange={v => setAddr({...addr, postcode:v})} />
            <Field label="Country (ISO, e.g. US)" value={addr.country_code} onChange={v => setAddr({...addr, country_code:v.toUpperCase()})} />
          </div>
          <Field label="Phone (digits only)" value={addr.phone_number} onChange={v => setAddr({...addr, phone_number:v.replace(/\D/g,'')})} />

          <div style={{ marginTop:8 }}>
            <div style={{ fontSize:'0.66rem', color:P.taupe, letterSpacing:'0.08em', marginBottom:6 }}>SHIPPING</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
              {['MAIL','GROUND','EXPEDITED','EXPRESS'].map(lvl => (
                <button key={lvl} onClick={() => setShippingLevel(lvl)} style={{
                  padding:'8px', borderRadius:8,
                  background: shippingLevel === lvl ? P.head : 'transparent',
                  border:`1px solid ${shippingLevel === lvl ? P.rose : P.border}`,
                  color: shippingLevel === lvl ? P.cream : P.taupe,
                  cursor:'pointer', fontSize:'0.74rem', fontFamily:SANS,
                }}>{lvl}</button>
              ))}
            </div>
          </div>
        </div>

        {error && <ErrorBox msg={error} />}

        <div style={{ display:'flex', gap:8, marginTop:16 }}>
          <button onClick={() => setStep('intro')} style={{ ...ghostBtn(), flex:1 }}>Back</button>
          <button onClick={fetchQuote} disabled={!canQuote || !email || busy} style={{
            ...primaryBtn(), flex:2, opacity: (canQuote && email && !busy) ? 1 : 0.5,
          }}>
            {busy ? 'Getting price…' : 'Get price'}
          </button>
        </div>
      </div>
    );
  }

  if (step === 'quote' && quote && customerPrice) {
    const currency = (customerPrice.currency || 'USD').toUpperCase();
    return (
      <div style={panelBox()}>
        <div style={{ fontFamily:SERIF, fontSize:'1.05rem', color:P.cream, marginBottom:14 }}>
          Your keepsake book
        </div>
        <div style={{ padding:'12px 0', borderTop:`1px solid ${P.borderL}`, borderBottom:`1px solid ${P.borderL}`, marginBottom:14 }}>
          <Line label="6×9 Hardcover · cream paper" value="included" />
          <Line label={`Shipping (${shippingLevel.toLowerCase()})`} value="included" />
          <div style={{ height:1, background:P.borderL, margin:'8px 0' }} />
          <Line label="Total" value={`$${customerPrice.total.toFixed(2)} ${currency}`} big />
        </div>
        <div style={{ fontSize:'0.72rem', color:P.taupe, marginBottom:14 }}>
          Shipping to {addr.name}, {addr.city} {addr.postcode}, {addr.country_code}
        </div>

        {error && <ErrorBox msg={error} />}

        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => setStep('address')} style={{ ...ghostBtn(), flex:1 }}>Edit address</button>
          <button onClick={proceedToPayment} disabled={busy} style={{ ...primaryBtn(), flex:2, opacity: busy ? 0.5 : 1 }}>
            {busy ? 'Preparing…' : 'Continue to payment →'}
          </button>
        </div>
      </div>
    );
  }

  if (step === 'pay' && paymentIntent && customerPrice) {
    return (
      <div style={panelBox()}>
        <div style={{ fontFamily:SERIF, fontSize:'1.05rem', color:P.cream, marginBottom:6 }}>
          Payment
        </div>
        <div style={{ fontSize:'0.78rem', color:P.taupe, marginBottom:14 }}>
          Total: <strong style={{ color:P.rose }}>${customerPrice.total.toFixed(2)} {(customerPrice.currency || 'USD').toUpperCase()}</strong>
        </div>
        <StripePaymentForm
          clientSecret={paymentIntent.clientSecret}
          onSuccess={afterPaymentSuccess}
          onBack={() => setStep('quote')}
          onError={(msg) => setError(msg)}
        />
        {error && <ErrorBox msg={error} />}
      </div>
    );
  }

  if (step === 'ordering') {
    return (
      <div style={panelBox()}>
        <div style={{ textAlign:'center', padding:'20px 0' }}>
          <div style={{ fontSize:'1.4rem', marginBottom:10 }}>📖</div>
          <div style={{ fontFamily:SERIF, fontSize:'1rem', color:P.cream, marginBottom:6 }}>
            Binding your book…
          </div>
          <div style={{ fontSize:'0.8rem', color:P.taupe }}>
            Generating PDF · uploading · sending to printer
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════
//  STRIPE PAYMENT FORM — Elements lazily loaded
// ═══════════════════════════════════════════════════════════════
function StripePaymentForm({ clientSecret, onSuccess, onBack, onError }) {
  const P = { rose:'#D4A0A0', taupe:'#A08580', cream:'#FAF0EA', border:'rgba(212,144,152,0.22)' };
  const [ready, setReady] = useState(false);
  const [ElementsComp, setElementsComp] = useState(null);
  const [stripePromise, setStripePromise] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [stripeJs, reactStripe] = await Promise.all([
          import('@stripe/stripe-js'),
          import('@stripe/react-stripe-js'),
        ]);
        const pk = window.__STRIPE_PUBLIC_KEY__ || import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
        if (!pk) {
          onError && onError('Stripe is not configured yet (missing VITE_STRIPE_PUBLISHABLE_KEY).');
          return;
        }
        setStripePromise(stripeJs.loadStripe(pk));
        setElementsComp(() => reactStripe);
        setReady(true);
      } catch (e) {
        onError && onError('Failed to load Stripe: ' + e.message);
      }
    })();
  }, [onError]);

  if (!ready || !ElementsComp) {
    return (
      <div style={{ textAlign:'center', padding:'24px 0', color:P.taupe, fontSize:'0.84rem' }}>
        Loading secure payment…
      </div>
    );
  }

  const { Elements, PaymentElement, useStripe, useElements } = ElementsComp;

  return (
    <Elements stripe={stripePromise} options={{
      clientSecret,
      appearance: {
        theme: 'night',
        variables: {
          colorPrimary: '#D4A0A0',
          colorBackground: '#1A1410',
          colorText: '#FAF0EA',
          colorDanger: '#E8B0B0',
          fontFamily: 'Inter, system-ui, sans-serif',
          borderRadius: '10px',
        },
      },
    }}>
      <StripeInnerForm
        onSuccess={onSuccess} onBack={onBack} onError={onError}
        PaymentElement={PaymentElement}
        useStripe={useStripe}
        useElements={useElements}
      />
    </Elements>
  );
}

function StripeInnerForm({ onSuccess, onBack, onError, PaymentElement, useStripe, useElements }) {
  const P = { rose:'#D4A0A0', roseL:'#E8B0B5', taupe:'#A08580', cream:'#FAF0EA', border:'rgba(212,144,152,0.22)', bg:'#1A1410' };
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setProcessing(true);
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: window.location.href },
        redirect: 'if_required',
      });
      if (error) {
        onError && onError(error.message || 'Payment failed');
        setProcessing(false);
        return;
      }
      if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess(paymentIntent.id);
      } else if (paymentIntent) {
        onError && onError(`Payment status: ${paymentIntent.status}. Please try again.`);
        setProcessing(false);
      }
    } catch (err) {
      onError && onError(err.message || 'Unexpected payment error');
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ padding:'6px 0 14px' }}>
        <PaymentElement />
      </div>
      <div style={{ display:'flex', gap:8 }}>
        <button type="button" onClick={onBack} disabled={processing} style={{
          background:'transparent', border:`1px solid ${P.border}`, color:P.taupe,
          padding:'9px 14px', borderRadius:10, cursor:'pointer',
          fontSize:'0.78rem', fontFamily:SANS, flex:1, opacity: processing ? 0.5 : 1,
        }}>Back</button>
        <button type="submit" disabled={!stripe || processing} style={{
          background:`linear-gradient(135deg, ${P.rose}, ${P.roseL})`,
          border:'none', color:P.bg,
          padding:'10px 18px', borderRadius:10, cursor:'pointer',
          fontSize:'0.82rem', fontFamily:SANS, fontWeight:600, letterSpacing:'0.04em',
          flex:2, opacity: processing ? 0.5 : 1,
        }}>{processing ? 'Processing…' : 'Pay & place order'}</button>
      </div>
      <div style={{ fontSize:'0.68rem', color:P.taupe, marginTop:10, fontStyle:'italic', textAlign:'center' }}>
        Secured by Stripe. You will not be charged until you confirm.
      </div>
    </form>
  );
}

// ═══════════════════════════════════════════════════════════════
//  ORDER HISTORY — list of past orders from local state
// ═══════════════════════════════════════════════════════════════
function OrderHistory({ orders }) {
  const P = { panel:'rgba(30,22,18,0.92)', cream:'#FAF0EA', rose:'#D4A0A0', taupe:'#A08580', borderL:'rgba(212,144,152,0.1)', border:'rgba(212,144,152,0.22)' };
  if (!orders || orders.length === 0) return null;
  return (
    <div style={{
      background:P.panel, border:`1px solid ${P.border}`,
      borderRadius:14, padding:'16px 18px',
    }}>
      <div style={{ fontFamily:SERIF, fontSize:'1rem', color:P.cream, marginBottom:10 }}>
        📖 Your orders ({orders.length})
      </div>
      <div style={{ display:'grid', gap:8 }}>
        {orders.map(o => (
          <div key={o.id || o.luluPrintJobId} style={{
            borderTop:`1px solid ${P.borderL}`,
            padding:'10px 0',
          }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:3 }}>
              <div style={{ fontSize:'0.86rem', color:P.cream }}>
                {o.babyName ? `The Story of ${o.babyName}` : 'Keepsake Book'}
              </div>
              <div style={{ fontSize:'0.74rem', color:P.rose, fontWeight:600 }}>
                {o.status || 'CREATED'}
              </div>
            </div>
            <div style={{ fontSize:'0.72rem', color:P.taupe, marginBottom:2 }}>
              {new Date(o.createdAt).toLocaleDateString()} ·
              {o.total ? ` $${Number(o.total).toFixed(2)} ${o.currency || 'USD'}` : ''} ·
              {o.pageCount ? ` ${o.pageCount}pg` : ''}
            </div>
            {o.shippingAddress && (
              <div style={{ fontSize:'0.7rem', color:P.taupe }}>
                to {o.shippingAddress.city}{o.shippingAddress.state_code ? `, ${o.shippingAddress.state_code}` : ''}
              </div>
            )}
            {o.trackingUrl && (
              <a href={o.trackingUrl} target="_blank" rel="noreferrer" style={{
                display:'inline-block', marginTop:4, fontSize:'0.74rem', color:P.rose,
                textDecoration:'underline',
              }}>Track shipment</a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <div style={{ fontSize:'0.66rem', color:P.taupe, letterSpacing:'0.08em', marginBottom:4 }}>
        {label.toUpperCase()}
      </div>
      <input
        type={type}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        style={{
          width:'100%', padding:'10px 12px',
          background:'rgba(0,0,0,0.15)',
          border:`1px solid ${P.border}`,
          borderRadius:8,
          color:P.cream, fontFamily:SANS, fontSize:'0.86rem',
          outline:'none', boxSizing:'border-box',
        }}
      />
    </div>
  );
}

function Line({ label, value, big }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', padding:'4px 0' }}>
      <span style={{ fontSize: big ? '0.88rem' : '0.78rem', color: big ? P.cream : P.taupe }}>{label}</span>
      <span style={{ fontSize: big ? '0.94rem' : '0.8rem', color: big ? P.rose : P.cream, fontWeight: big ? 700 : 400 }}>
        {value}
      </span>
    </div>
  );
}

function ErrorBox({ msg }) {
  return (
    <div style={{
      marginTop:14, padding:'10px 14px',
      background:'rgba(200,80,80,0.15)', border:'1px solid rgba(200,80,80,0.3)',
      borderRadius:10, color:'#E8B0B0', fontSize:'0.78rem',
    }}>
      {msg}
    </div>
  );
}

function panelBox() {
  return {
    padding:'18px 20px',
    background:`linear-gradient(135deg, ${P.panel}, rgba(212,144,152,0.06))`,
    border:`1px solid ${P.border}`,
    borderRadius:14,
  };
}

function StatLine({ label, value }) {
  return (
    <div style={{
      display:'flex', justifyContent:'space-between', alignItems:'baseline',
      padding:'4px 0', fontSize:'0.84rem',
    }}>
      <span style={{ color:P.taupe }}>{label}</span>
      <span style={{ color:P.cream, fontWeight:600 }}>{value}</span>
    </div>
  );
}

function HotspotBtn({ icon, label, sub, onClick }) {
  return (
    <button onClick={onClick} style={{
      background:P.panel, border:`1px solid ${P.border}`,
      borderRadius:14, padding:'16px 14px',
      cursor:'pointer', color:P.cream, fontFamily:SANS,
      textAlign:'left', transition:'all 0.2s',
    }} onMouseEnter={e => e.currentTarget.style.borderColor = P.rose}
       onMouseLeave={e => e.currentTarget.style.borderColor = P.border}>
      <div style={{ fontSize:'1.5rem', marginBottom:6 }}>{icon}</div>
      <div style={{ fontFamily:SERIF, fontSize:'0.9rem', color:P.cream, marginBottom:2 }}>{label}</div>
      <div style={{ fontSize:'0.7rem', color:P.taupe }}>{sub}</div>
    </button>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 5)  return 'late night, mama';
  if (h < 12) return 'good morning, mama';
  if (h < 17) return 'good afternoon, mama';
  if (h < 21) return 'good evening, mama';
  return 'quiet night, mama';
}

function primaryBtn() {
  return {
    background:`linear-gradient(135deg, ${P.rose}, ${P.roseL})`,
    border:'none', color:P.bg,
    padding:'10px 20px', borderRadius:10,
    cursor:'pointer', fontFamily:SANS, fontSize:'0.82rem',
    fontWeight:600, letterSpacing:'0.04em',
  };
}
function ghostBtn() {
  return {
    background:'transparent', border:`1px solid ${P.border}`,
    color:P.taupe,
    padding:'8px 14px', borderRadius:10,
    cursor:'pointer', fontFamily:SANS, fontSize:'0.78rem',
  };
}
function topBtn() {
  return {
    background:'transparent', border:`1px solid ${P.border}`,
    color:P.taupe,
    padding:'6px 12px', borderRadius:8,
    cursor:'pointer', fontFamily:SANS, fontSize:'0.78rem',
  };
}
function inputStyle() {
  return {
    width:'100%', padding:'12px 14px',
    background:P.panel, border:`1px solid ${P.border}`,
    borderRadius:12, color:P.cream,
    fontFamily:SANS, fontSize:'0.95rem',
    outline:'none', boxSizing:'border-box',
  };
}
