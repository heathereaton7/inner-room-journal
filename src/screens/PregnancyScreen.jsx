import { useState, useMemo } from 'react';
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
    faithMode: 'christian', // 'christian' | 'general' | 'spiritual'
    letters: [],            // { id, date, text, sealed, sealUntilBirth }
    checkins: [],           // { id, date, mood, symptoms, reflection }
    milestones: {},         // { [milestoneId]: { date, reflection, photo? } }
    appointments: [],       // { id, date, provider, type, questions, notes }
    kickSessions: [],       // { id, date, startTime, endTime, count }
    prayers: [],            // { id, date, text }
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
  const [faithMode, setFaithMode] = useState(state.faithMode || 'christian');

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
      cta: 'Continue',
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
    {
      title: 'What tone feels like home?',
      body: "We'll shape your weekly encouragement around this. You can always change it later in settings.",
      cta: 'Enter the nursery',
      render: (
        <div style={{ display:'grid', gap:10 }}>
          {[
            { id:'christian',  label:'Christian',   desc:'Weekly scripture and faith-based reflection.' },
            { id:'spiritual',  label:'Spiritual',   desc:'Poetic, open spiritual encouragement.' },
            { id:'general',    label:'Just warmth', desc:'No spiritual language — just gentle, loving words.' },
          ].map(opt => {
            const active = faithMode === opt.id;
            return (
              <button key={opt.id} onClick={() => setFaithMode(opt.id)} style={{
                background: active ? P.head : P.panel,
                border:`1.5px solid ${active ? P.rose : P.border}`,
                borderRadius:12, padding:'14px 16px',
                cursor:'pointer', textAlign:'left', color:P.cream, fontFamily:SANS,
                transition:'all 0.2s',
              }}>
                <div style={{ fontFamily:SERIF, fontSize:'0.95rem', color:P.cream, marginBottom:3 }}>{opt.label}</div>
                <div style={{ fontSize:'0.76rem', color:P.taupe, lineHeight:1.5 }}>{opt.desc}</div>
              </button>
            );
          })}
        </div>
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
function NurseryHome({ state, current, weekData, onWeekClick, onLetters, onCheckin, onMilestones, onGarden }) {
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
