import { useState, useCallback, useEffect, useRef } from 'react';
import { B, SERIF, SANS, DISPLAY, GFONTS } from '../constants.js';
import CottageBackground from '../components/CottageBackground.jsx';

/* ═══════════════════════════════════════════════════════════════
   BECOMING HER — 90-Day Identity + Habit Journal Sanctuary

   4 interactive zones:
     1. Journal Table  → daily/weekly pages
     2. Vision Wall    → identity words, Scripture, vine growth
     3. Prayer Corner  → candle, declaration cards
     4. Growth Shelf   → milestones, dot tracker

   Sub-views controlled by `view` state:
     null        → sanctuary hub (room with 4 zones)
     "journal"   → daily journal page
     "vision"    → identity portrait + vine
     "prayer"    → candle + declaration cards
     "shelf"     → milestone shelf + dot tracker
     "setup"     → first-time setup flow
     "grace"     → grace reset page
═══════════════════════════════════════════════════════════════ */

// ── Palette ──
const P = {
  bg:      '#1A1612',
  card:    'rgba(26,22,18,0.92)',
  cream:   '#FAF6F0',
  brown:   '#3A2E28',
  taupe:   '#8A7A70',
  gold:    '#C9A96E',
  goldL:   '#E8D4A0',
  rose:    '#D4A0A0',
  olive:   '#9AAA8A',
  lavender:'#B8A0C8',
  border:  'rgba(201,169,110,0.2)',
  borderL: 'rgba(201,169,110,0.1)',
};

// ── 90 Daily Truths (first 14 shown, rest can be added) ──
const DAILY_TRUTHS = [
  { day:1,  text:"You are chosen and dearly loved.",               ref:"Colossians 3:12" },
  { day:2,  text:"His mercies are new every morning.",             ref:"Lamentations 3:23" },
  { day:3,  text:"You are fearfully and wonderfully made.",        ref:"Psalm 139:14" },
  { day:4,  text:"He who began a good work in you will complete it.", ref:"Philippians 1:6" },
  { day:5,  text:"You are a new creation in Christ.",              ref:"2 Corinthians 5:17" },
  { day:6,  text:"Nothing can separate you from His love.",        ref:"Romans 8:38-39" },
  { day:7,  text:"Be still and know that I am God.",               ref:"Psalm 46:10" },
  { day:8,  text:"The Lord is your shepherd. You lack nothing.",   ref:"Psalm 23:1" },
  { day:9,  text:"He gives strength to the weary.",                ref:"Isaiah 40:29" },
  { day:10, text:"You are the light of the world.",                ref:"Matthew 5:14" },
  { day:11, text:"Cast all your anxiety on Him.",                  ref:"1 Peter 5:7" },
  { day:12, text:"He makes all things beautiful in His time.",     ref:"Ecclesiastes 3:11" },
  { day:13, text:"You are God's masterpiece.",                     ref:"Ephesians 2:10" },
  { day:14, text:"His grace is sufficient for you.",               ref:"2 Corinthians 12:9" },
];

// ── Month themes ──
const MONTHS = [
  { month:1, title:"Identity",   subtitle:"Who does He say I am?",  scripture:"1 John 3:1",        color:P.rose },
  { month:2, title:"Alignment",  subtitle:"What does she do?",      scripture:"Romans 12:2",       color:P.olive },
  { month:3, title:"Embodiment", subtitle:"She lives here now.",     scripture:"Philippians 3:14",  color:P.lavender },
];

// ── Shelf milestones ──
const MILESTONES = [
  { id:'first-light',      name:'First Light',      tier:1, trigger:'day-1',    symbol:'She began.' },
  { id:'sealed-envelope',  name:'Sealed Envelope',  tier:1, trigger:'week-1',   symbol:'First words written.' },
  { id:'wildflower',       name:'Wildflower',       tier:1, trigger:'week-2',   symbol:'Something new is growing.' },
  { id:'truth-mirror',     name:'Truth Mirror',     tier:1, trigger:'month-1',  symbol:'She sees herself clearly.' },
  { id:'olive-branch',     name:'Olive Branch',     tier:2, trigger:'week-5',   symbol:'Rhythms taking root.' },
  { id:'habit-journal',    name:'Small Journal',    tier:2, trigger:'week-6',   symbol:'Habits forming.' },
  { id:'golden-bookmark',  name:'Golden Bookmark',  tier:2, trigger:'month-2',  symbol:'Aligned with who she is becoming.' },
  { id:'crown-leaves',     name:'Crown of Leaves',  tier:3, trigger:'week-9',   symbol:'Walking in confidence.' },
  { id:'lit-lantern',      name:'Lit Lantern',      tier:3, trigger:'week-11',  symbol:'Light from within.' },
  { id:'open-journal',     name:'Open Journal',     tier:3, trigger:'day-90',   symbol:'She has become.' },
];

// ── Declaration cards ──
const DECLARATION_CARDS = [
  { id:'card-chosen',      text:'I am chosen and dearly loved.',           ref:'Colossians 3:12',    unlock:'setup' },
  { id:'card-daughter',     text:'I am a daughter of the King.',           ref:'1 John 3:1',         unlock:'setup' },
  { id:'card-new',          text:'I am a new creation.',                   ref:'2 Corinthians 5:17', unlock:'setup' },
  { id:'card-fearful',      text:'I am fearfully and wonderfully made.',   ref:'Psalm 139:14',       unlock:'setup' },
  { id:'card-enough',       text:'His grace is sufficient for me.',        ref:'2 Corinthians 12:9', unlock:'setup' },
  { id:'card-not-too-much', text:'I am not too much.',                     ref:'Psalm 139:14',       unlock:'week-2' },
  { id:'card-mercies',      text:'His mercies are new every morning.',     ref:'Lamentations 3:23',  unlock:'week-3' },
  { id:'card-beautiful',    text:'He makes all things beautiful in His time.', ref:'Ecclesiastes 3:11', unlock:'week-4' },
  { id:'card-not-behind',   text:'I am not behind. My steps are ordered.', ref:'Psalm 37:23',        unlock:'week-5' },
  { id:'card-rest',         text:'I do not have to earn rest.',            ref:'Matthew 11:28',       unlock:'week-6' },
  { id:'card-transformed',  text:'I am being transformed.',               ref:'Romans 12:2',         unlock:'week-7' },
  { id:'card-ordered',      text:'My steps are ordered by the Lord.',      ref:'Psalm 37:23',        unlock:'week-8' },
  { id:'card-press-on',     text:'I press on toward the goal.',            ref:'Philippians 3:14',    unlock:'week-9' },
  { id:'card-enough-him',   text:'I am enough in Him.',                    ref:'2 Corinthians 3:5',   unlock:'week-10' },
  { id:'card-not-shaken',   text:'I will not be shaken.',                  ref:'Psalm 16:8',          unlock:'week-11' },
  { id:'card-strength',     text:'She is clothed in strength and dignity.',ref:'Proverbs 31:25',      unlock:'week-12' },
];

// ── Helpers ──
function getWeek(day){ return Math.ceil(day / 7); }
function getMonth(day){ return day <= 30 ? 1 : day <= 60 ? 2 : 3; }
function getDayType(day){
  const dayInWeek = ((day - 1) % 7) + 1;
  if(dayInWeek === 1) return 'weekly-reset';
  if(dayInWeek === 7) return 'sabbath';
  if(dayInWeek === 6) return 'reflect';
  return 'daily';
}
function getTruth(day){
  return DAILY_TRUTHS[(day - 1) % DAILY_TRUTHS.length];
}

// ── Default progress ──
function defaultProgress(){
  return {
    started: null,
    currentDay: 0,
    setupComplete: false,
    identity: { words: ['','',''], morningAnchor: '', eveningAnchor: '', scripture: '' },
    anchors: ['','',''],
    entries: {},
    weeklyReflections: {},
    monthlyReflections: {},
    unlockedItems: [],
    unlockedCards: ['card-chosen','card-daughter','card-new','card-fearful','card-enough'],
    vineStage: 0,
    candlesLit: 0,
    graceResets: 0,
  };
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
export default function BecomingHerScreen({ onBack, progress, onProgressChange, addCandles, setToast }){
  const [view, setView] = useState(null);
  const prog = progress || defaultProgress();

  // ── Derived state ──
  const day = prog.currentDay || 0;
  const week = day > 0 ? getWeek(day) : 0;
  const month = day > 0 ? getMonth(day) : 0;
  const monthData = MONTHS[(month || 1) - 1];
  const needsSetup = !prog.setupComplete;

  // ── Auto-show setup on first visit ──
  useEffect(()=>{
    if(needsSetup && view !== 'setup') setView('setup');
  },[needsSetup]);

  // ── Save helper ──
  const save = useCallback((updates)=>{
    const next = { ...prog, ...updates };
    if(onProgressChange) onProgressChange(next);
  },[prog, onProgressChange]);

  // ── Setup handlers ──
  const [setupStep, setSetupStep] = useState(0);
  const [setupWords, setSetupWords] = useState(['','','']);
  const [setupMorning, setSetupMorning] = useState('');
  const [setupEvening, setSetupEvening] = useState('');
  const [setupScripture, setSetupScripture] = useState('');

  const completeSetup = useCallback(()=>{
    const today = new Date().toISOString().slice(0,10);
    save({
      setupComplete: true,
      started: today,
      currentDay: 1,
      identity: {
        words: setupWords,
        morningAnchor: setupMorning,
        eveningAnchor: setupEvening,
        scripture: setupScripture,
      },
    });
    setView(null);
    if(setToast) setToast({ msg: 'Your journey begins today.' });
  },[save, setupWords, setupMorning, setupEvening, setupScripture, setToast]);

  // ── Daily entry handlers ──
  const [remember, setRemember] = useState('');
  const [release, setRelease] = useState('');
  const [receive, setReceive] = useState('');
  const [respond, setRespond] = useState('');
  const [anchorsChecked, setAnchorsChecked] = useState([false,false,false]);
  const [mood, setMood] = useState(null);

  // Load existing entry when opening journal
  useEffect(()=>{
    if(view === 'journal' && day > 0){
      const existing = prog.entries[day];
      if(existing){
        setRemember(existing.remember || '');
        setRelease(existing.release || '');
        setReceive(existing.receive || '');
        setRespond(existing.respond || '');
        setAnchorsChecked(existing.anchors || [false,false,false]);
        setMood(existing.mood || null);
      } else {
        setRemember(''); setRelease(''); setReceive(''); setRespond('');
        setAnchorsChecked([false,false,false]); setMood(null);
      }
    }
  },[view, day]);

  const saveEntry = useCallback(()=>{
    const today = new Date().toISOString().slice(0,10);
    const entry = {
      date: today,
      remember, release, receive, respond,
      anchors: anchorsChecked,
      mood,
    };
    const entries = { ...prog.entries, [day]: entry };
    const isNew = !prog.entries[day];

    // Advance day if this is a new entry
    const nextDay = isNew ? Math.min(day + 1, 90) : day;
    const nextWeek = getWeek(nextDay);
    const nextVine = Math.min(Math.floor(nextWeek), 12);

    // Check milestone unlocks
    const newItems = [...prog.unlockedItems];
    const checkMilestone = (trigger) => {
      const m = MILESTONES.find(ms => ms.trigger === trigger);
      if(m && !newItems.includes(m.id)){ newItems.push(m.id); return m; }
      return null;
    };

    if(day === 1) checkMilestone('day-1');
    if(day === 90) checkMilestone('day-90');
    const weekTrigger = `week-${week}`;
    checkMilestone(weekTrigger);
    const monthTrigger = `month-${month}`;
    if(day === 30 || day === 60 || day === 90) checkMilestone(monthTrigger);

    // Check card unlocks
    const newCards = [...prog.unlockedCards];
    DECLARATION_CARDS.forEach(card => {
      if(!newCards.includes(card.id) && card.unlock === weekTrigger){
        newCards.push(card.id);
      }
    });

    // Candle count for prayer corner
    let candlesLit = prog.candlesLit;
    if(day === 1 && candlesLit === 0) candlesLit = 1;
    if(day >= 30 && candlesLit < 2) candlesLit = 2;
    if(day >= 60 && candlesLit < 3) candlesLit = 3;

    save({
      entries,
      currentDay: nextDay,
      vineStage: nextVine,
      unlockedItems: newItems,
      unlockedCards: newCards,
      candlesLit,
    });

    if(isNew && addCandles) addCandles(3, 'Becoming Her reflection +3');
    setView(null);
    if(setToast && isNew) setToast({ msg: `Day ${day} complete.` });
  },[day, week, month, remember, release, receive, respond, anchorsChecked, mood, prog, save, addCandles, setToast]);

  /* ═══════════════════════════════════════════
     RENDER — SETUP FLOW
  ═══════════════════════════════════════════ */
  if(view === 'setup'){
    return(
      <div style={{position:'fixed',inset:0,background:'transparent',fontFamily:SANS,overflow:'auto',WebkitOverflowScrolling:'touch'}}><CottageBackground/>
        <style>{GFONTS}</style>
        <div style={{maxWidth:440,margin:'0 auto',padding:'60px 28px 80px',textAlign:'center'}}>

          {setupStep === 0 && <>
            <div style={{fontFamily:DISPLAY,fontSize:'1.8rem',fontWeight:700,color:P.goldL,marginBottom:12}}>Becoming Her</div>
            <div style={{fontFamily:SERIF,fontStyle:'italic',fontSize:'0.92rem',color:P.taupe,lineHeight:1.7,marginBottom:32}}>
              A 90-day journey of identity, habits, and becoming who Jesus already sees.
              <br/><br/>
              It takes 5-10 minutes a day. That is enough.
            </div>
            <button onClick={()=>setSetupStep(1)} style={btnStyle}>Begin</button>
          </>}

          {setupStep === 1 && <>
            <div style={{fontFamily:DISPLAY,fontSize:'1.2rem',fontWeight:700,color:P.goldL,marginBottom:8}}>Who are you becoming?</div>
            <div style={{fontFamily:SERIF,fontStyle:'italic',fontSize:'0.82rem',color:P.taupe,marginBottom:28}}>3 words that describe her:</div>
            {setupWords.map((w,i)=>(
              <input key={i} value={w} onChange={e=>{const a=[...setupWords];a[i]=e.target.value;setSetupWords(a);}}
                placeholder={['e.g. Beloved','e.g. Strong','e.g. Faithful'][i]}
                style={inputStyle} />
            ))}
            <div style={{fontFamily:SERIF,fontStyle:'italic',fontSize:'0.82rem',color:P.taupe,margin:'24px 0 8px'}}>Her morning anchor:</div>
            <input value={setupMorning} onChange={e=>setSetupMorning(e.target.value)} placeholder="e.g. Prayer + coffee" style={inputStyle}/>
            <div style={{fontFamily:SERIF,fontStyle:'italic',fontSize:'0.82rem',color:P.taupe,margin:'24px 0 8px'}}>Her evening anchor:</div>
            <input value={setupEvening} onChange={e=>setSetupEvening(e.target.value)} placeholder="e.g. Gratitude journal" style={inputStyle}/>
            <div style={{display:'flex',gap:10,marginTop:28}}>
              <button onClick={()=>setSetupStep(0)} style={{...btnStyle,flex:1,background:'transparent',border:`1px solid ${P.border}`}}>Back</button>
              <button onClick={()=>setSetupStep(2)} style={{...btnStyle,flex:2}}>Continue</button>
            </div>
          </>}

          {setupStep === 2 && <>
            <div style={{fontFamily:DISPLAY,fontSize:'1.2rem',fontWeight:700,color:P.goldL,marginBottom:8}}>Your Scripture Anchor</div>
            <div style={{fontFamily:SERIF,fontStyle:'italic',fontSize:'0.82rem',color:P.taupe,marginBottom:20}}>The verse you are standing on this season:</div>
            <textarea value={setupScripture} onChange={e=>setSetupScripture(e.target.value)}
              placeholder="e.g. I am fearfully and wonderfully made. — Psalm 139:14"
              rows={3} style={{...inputStyle,resize:'none',minHeight:80}}/>
            <div style={{display:'flex',gap:10,marginTop:28}}>
              <button onClick={()=>setSetupStep(1)} style={{...btnStyle,flex:1,background:'transparent',border:`1px solid ${P.border}`}}>Back</button>
              <button onClick={completeSetup} style={{...btnStyle,flex:2}}>Enter the Sanctuary</button>
            </div>
          </>}
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════
     RENDER — DAILY JOURNAL PAGE
  ═══════════════════════════════════════════ */
  if(view === 'journal' && day > 0){
    const truth = getTruth(day);
    const dayType = getDayType(day);

    // Sabbath rest page
    if(dayType === 'sabbath'){
      return(
        <div style={{position:'fixed',inset:0,background:'transparent',fontFamily:SANS,overflow:'auto',WebkitOverflowScrolling:'touch'}}><CottageBackground/>
          <style>{GFONTS}</style>
          <div style={{maxWidth:440,margin:'0 auto',padding:'60px 28px 80px',textAlign:'center'}}>
            <button onClick={()=>setView(null)} style={backBtnStyle}>Back to sanctuary</button>
            <div style={{fontFamily:DISPLAY,fontSize:'0.85rem',color:P.taupe,letterSpacing:'0.08em',marginBottom:8}}>DAY {day}</div>
            <div style={{fontFamily:DISPLAY,fontSize:'1.4rem',fontWeight:700,color:P.goldL,marginBottom:28}}>Sabbath Rest</div>
            <div style={{width:40,height:1,background:`linear-gradient(90deg,transparent,${P.gold},transparent)`,margin:'0 auto 32px'}}/>
            <div style={{fontFamily:SERIF,fontStyle:'italic',fontSize:'1.1rem',color:P.goldL,lineHeight:1.8,marginBottom:40}}>
              Be still and know that I am God.<br/>
              <span style={{fontSize:'0.82rem',color:P.taupe}}>Psalm 46:10</span>
            </div>
            <div style={{fontFamily:SERIF,fontStyle:'italic',fontSize:'0.85rem',color:P.taupe,marginBottom:12}}>Something I am grateful for:</div>
            <textarea value={respond} onChange={e=>setRespond(e.target.value)} rows={2} placeholder="..." style={{...inputStyle,resize:'none',textAlign:'center'}}/>
            <button onClick={saveEntry} style={{...btnStyle,marginTop:28}}>Rest complete</button>
          </div>
        </div>
      );
    }

    // Standard daily page
    return(
      <div style={{position:'fixed',inset:0,background:'transparent',fontFamily:SANS,overflow:'auto',WebkitOverflowScrolling:'touch'}}><CottageBackground/>
        <style>{GFONTS}</style>
        <div style={{maxWidth:440,margin:'0 auto',padding:'40px 24px 80px'}}>
          <button onClick={()=>setView(null)} style={backBtnStyle}>Back to sanctuary</button>
          <div style={{textAlign:'center',marginBottom:20}}>
            <div style={{fontFamily:DISPLAY,fontSize:'0.78rem',color:P.taupe,letterSpacing:'0.08em',marginBottom:4}}>DAY {day} &middot; {monthData.title}</div>
            <div style={{fontFamily:DISPLAY,fontSize:'1.15rem',fontWeight:700,color:P.goldL,fontStyle:'italic'}}>{monthData.subtitle}</div>
          </div>

          {/* Today's Truth */}
          <div style={{background:'rgba(201,169,110,0.06)',border:`1px solid ${P.borderL}`,borderRadius:14,padding:'16px 20px',marginBottom:24,textAlign:'center'}}>
            <div style={{fontFamily:SERIF,fontStyle:'italic',fontSize:'0.95rem',color:P.goldL,lineHeight:1.6}}>{truth.text}</div>
            <div style={{fontFamily:SANS,fontSize:'0.68rem',color:P.taupe,marginTop:6}}>{truth.ref}</div>
          </div>

          {/* REMEMBER */}
          <div style={promptLabelStyle}>REMEMBER <span style={{fontWeight:400,color:P.taupe}}>— Who does Jesus say I am today?</span></div>
          <textarea value={remember} onChange={e=>setRemember(e.target.value)} rows={2} style={{...inputStyle,resize:'none'}} placeholder="..."/>

          {/* RELEASE */}
          <div style={promptLabelStyle}>RELEASE <span style={{fontWeight:400,color:P.taupe}}>— What am I letting go of?</span></div>
          <textarea value={release} onChange={e=>setRelease(e.target.value)} rows={1} style={{...inputStyle,resize:'none'}} placeholder="..."/>

          {/* RECEIVE */}
          <div style={promptLabelStyle}>RECEIVE <span style={{fontWeight:400,color:P.taupe}}>— What truth am I choosing?</span></div>
          <textarea value={receive} onChange={e=>setReceive(e.target.value)} rows={1} style={{...inputStyle,resize:'none'}} placeholder="..."/>

          {/* RESPOND */}
          <div style={promptLabelStyle}>RESPOND <span style={{fontWeight:400,color:P.taupe}}>— My one small step today:</span></div>
          <input value={respond} onChange={e=>setRespond(e.target.value)} style={inputStyle} placeholder="..."/>

          {/* 3 Anchors */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:20,margin:'28px 0 16px'}}>
            <div style={{fontFamily:SANS,fontSize:'0.7rem',color:P.taupe,letterSpacing:'0.06em'}}>MY 3 ANCHORS</div>
            {anchorsChecked.map((checked,i)=>(
              <button key={i} onClick={()=>{const a=[...anchorsChecked];a[i]=!a[i];setAnchorsChecked(a);}}
                style={{width:32,height:32,borderRadius:'50%',border:`2px solid ${checked?P.gold:P.border}`,background:checked?'rgba(201,169,110,0.15)':'transparent',cursor:'pointer',transition:'all 0.2s',display:'flex',alignItems:'center',justifyContent:'center'}}>
                {checked && <div style={{width:12,height:12,borderRadius:'50%',background:P.gold}}/>}
              </button>
            ))}
          </div>

          {/* Mood (optional) */}
          <div style={{fontFamily:SANS,fontSize:'0.68rem',color:P.taupe,textAlign:'center',marginBottom:8,letterSpacing:'0.04em'}}>How did today feel? (optional)</div>
          <div style={{display:'flex',justifyContent:'center',gap:8,marginBottom:28}}>
            {['Hard','Okay','Good','Grateful'].map(m=>(
              <button key={m} onClick={()=>setMood(mood===m.toLowerCase()?null:m.toLowerCase())}
                style={{padding:'6px 14px',borderRadius:20,border:`1px solid ${mood===m.toLowerCase()?P.gold:P.borderL}`,background:mood===m.toLowerCase()?'rgba(201,169,110,0.1)':'transparent',color:mood===m.toLowerCase()?P.goldL:P.taupe,fontFamily:SANS,fontSize:'0.7rem',cursor:'pointer',transition:'all 0.2s'}}>
                {m}
              </button>
            ))}
          </div>

          <button onClick={saveEntry} style={btnStyle}>Save reflection</button>

          {/* Grace reset link */}
          <div style={{textAlign:'center',marginTop:20}}>
            <button onClick={()=>setView('grace')} style={{background:'none',border:'none',color:P.taupe,fontFamily:SERIF,fontStyle:'italic',fontSize:'0.75rem',cursor:'pointer',textDecoration:'underline',textUnderlineOffset:3}}>
              I missed some days
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════
     RENDER — VISION WALL
  ═══════════════════════════════════════════ */
  if(view === 'vision'){
    const id = prog.identity || {};
    return(
      <div style={{position:'fixed',inset:0,background:'transparent',fontFamily:SANS,overflow:'auto',WebkitOverflowScrolling:'touch'}}><CottageBackground/>
        <style>{GFONTS}</style>
        <div style={{maxWidth:440,margin:'0 auto',padding:'40px 24px 80px'}}>
          <button onClick={()=>setView(null)} style={backBtnStyle}>Back to sanctuary</button>
          <div style={{textAlign:'center',marginBottom:28}}>
            <div style={{fontFamily:DISPLAY,fontSize:'1.2rem',fontWeight:700,color:P.goldL}}>Vision Wall</div>
            <div style={{fontFamily:SERIF,fontStyle:'italic',fontSize:'0.82rem',color:P.taupe,marginTop:4}}>Who she is becoming</div>
          </div>

          {/* Identity words */}
          <div style={{display:'flex',justifyContent:'center',gap:12,marginBottom:28}}>
            {(id.words || ['','','']).map((w,i)=>(
              <div key={i} style={{background:'rgba(201,169,110,0.08)',border:`1px solid ${P.borderL}`,borderRadius:10,padding:'10px 18px',fontFamily:DISPLAY,fontSize:'0.85rem',fontWeight:700,color:P.goldL,minWidth:80,textAlign:'center'}}>
                {w || '...'}
              </div>
            ))}
          </div>

          {/* Scripture anchor */}
          {id.scripture && (
            <div style={{background:'rgba(201,169,110,0.04)',border:`1px solid ${P.borderL}`,borderRadius:14,padding:'20px 24px',marginBottom:28,textAlign:'center'}}>
              <div style={{fontFamily:SERIF,fontStyle:'italic',fontSize:'1rem',color:P.goldL,lineHeight:1.7}}>{id.scripture}</div>
            </div>
          )}

          {/* Vine growth */}
          <div style={{marginBottom:28}}>
            <div style={{fontFamily:SANS,fontSize:'0.68rem',color:P.taupe,letterSpacing:'0.08em',marginBottom:12,textAlign:'center'}}>VINE GROWTH</div>
            <div style={{display:'flex',justifyContent:'center',gap:6}}>
              {Array.from({length:12}).map((_,i)=>(
                <div key={i} style={{width:20,height:20,borderRadius:'50%',border:`1.5px solid ${i < prog.vineStage ? P.olive : P.borderL}`,background:i < prog.vineStage ? 'rgba(154,170,138,0.25)' : 'transparent',transition:'all 0.3s'}}>
                  {i < prog.vineStage && <div style={{width:'100%',height:'100%',borderRadius:'50%',background:`radial-gradient(circle,${P.olive},transparent)`,opacity:0.5}}/>}
                </div>
              ))}
            </div>
            <div style={{fontFamily:SERIF,fontStyle:'italic',fontSize:'0.72rem',color:P.taupe,textAlign:'center',marginTop:8}}>
              Week {week} of 12
            </div>
          </div>

          {/* Anchors */}
          <div style={{fontFamily:SANS,fontSize:'0.68rem',color:P.taupe,letterSpacing:'0.08em',marginBottom:10}}>DAILY ANCHORS</div>
          {(prog.anchors || ['','','']).map((a,i)=>(
            <div key={i} style={{fontFamily:SERIF,fontSize:'0.88rem',color:'rgba(255,248,232,0.6)',padding:'8px 0',borderBottom:`1px solid ${P.borderL}`}}>
              {a || `Anchor ${i+1} (not set)`}
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════
     RENDER — PRAYER CORNER
  ═══════════════════════════════════════════ */
  if(view === 'prayer'){
    const unlockedCards = DECLARATION_CARDS.filter(c => prog.unlockedCards.includes(c.id));
    return(
      <div style={{position:'fixed',inset:0,background:'transparent',fontFamily:SANS,overflow:'auto',WebkitOverflowScrolling:'touch'}}><CottageBackground/>
        <style>{GFONTS}</style>
        <div style={{maxWidth:440,margin:'0 auto',padding:'40px 24px 80px'}}>
          <button onClick={()=>setView(null)} style={backBtnStyle}>Back to sanctuary</button>
          <div style={{textAlign:'center',marginBottom:28}}>
            <div style={{fontFamily:DISPLAY,fontSize:'1.2rem',fontWeight:700,color:P.goldL}}>Prayer Corner</div>
            <div style={{fontFamily:SERIF,fontStyle:'italic',fontSize:'0.82rem',color:P.taupe,marginTop:4}}>Be still. He is here.</div>
          </div>

          {/* Candles */}
          <div style={{display:'flex',justifyContent:'center',gap:24,marginBottom:32}}>
            {[1,2,3].map(n=>(
              <div key={n} style={{textAlign:'center'}}>
                <div style={{width:40,height:56,borderRadius:'6px 6px 0 0',background:n <= prog.candlesLit ? 'linear-gradient(180deg,#C9A96E,#8A6A3E)' : 'rgba(255,255,255,0.06)',border:`1px solid ${n <= prog.candlesLit ? 'rgba(201,169,110,0.4)' : P.borderL}`,position:'relative',display:'flex',alignItems:'flex-start',justifyContent:'center'}}>
                  {n <= prog.candlesLit && (
                    <div style={{width:8,height:12,borderRadius:'50% 50% 50% 50% / 60% 60% 40% 40%',background:'radial-gradient(ellipse,#FFE0A0,#FFA040)',marginTop:-8,boxShadow:'0 0 12px rgba(255,180,60,0.5)',animation:'candleFlicker 2s ease-in-out infinite'}}/>
                  )}
                </div>
                <div style={{fontSize:'0.6rem',color:P.taupe,marginTop:4}}>
                  {n === 1 ? 'Identity' : n === 2 ? 'Alignment' : 'Embodiment'}
                </div>
              </div>
            ))}
          </div>

          {/* Declaration cards */}
          <div style={{fontFamily:SANS,fontSize:'0.68rem',color:P.taupe,letterSpacing:'0.08em',marginBottom:12}}>DECLARATION CARDS ({unlockedCards.length})</div>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {unlockedCards.map(card=>(
              <div key={card.id} style={{background:'rgba(201,169,110,0.05)',border:`1px solid ${P.borderL}`,borderRadius:12,padding:'16px 20px'}}>
                <div style={{fontFamily:SERIF,fontStyle:'italic',fontSize:'0.92rem',color:P.goldL,lineHeight:1.6}}>{card.text}</div>
                <div style={{fontFamily:SANS,fontSize:'0.68rem',color:P.taupe,marginTop:6}}>- {card.ref}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════
     RENDER — GROWTH SHELF
  ═══════════════════════════════════════════ */
  if(view === 'shelf'){
    const unlocked = prog.unlockedItems || [];
    return(
      <div style={{position:'fixed',inset:0,background:'transparent',fontFamily:SANS,overflow:'auto',WebkitOverflowScrolling:'touch'}}><CottageBackground/>
        <style>{GFONTS}</style>
        <div style={{maxWidth:440,margin:'0 auto',padding:'40px 24px 80px'}}>
          <button onClick={()=>setView(null)} style={backBtnStyle}>Back to sanctuary</button>
          <div style={{textAlign:'center',marginBottom:28}}>
            <div style={{fontFamily:DISPLAY,fontSize:'1.2rem',fontWeight:700,color:P.goldL}}>Growth Shelf</div>
            <div style={{fontFamily:SERIF,fontStyle:'italic',fontSize:'0.82rem',color:P.taupe,marginTop:4}}>Every step matters</div>
          </div>

          {/* Shelf tiers */}
          {[1,2,3].map(tier=>(
            <div key={tier} style={{marginBottom:20}}>
              <div style={{fontFamily:SANS,fontSize:'0.62rem',color:P.taupe,letterSpacing:'0.1em',marginBottom:8}}>
                {tier === 1 ? 'MONTH 1 — IDENTITY' : tier === 2 ? 'MONTH 2 — ALIGNMENT' : 'MONTH 3 — EMBODIMENT'}
              </div>
              <div style={{background:'rgba(255,255,255,0.02)',border:`1px solid ${P.borderL}`,borderRadius:12,padding:'12px 16px',display:'flex',gap:12,flexWrap:'wrap',minHeight:60,alignItems:'center'}}>
                {MILESTONES.filter(m=>m.tier===tier).map(m=>{
                  const earned = unlocked.includes(m.id);
                  return(
                    <div key={m.id} style={{textAlign:'center',opacity:earned?1:0.25,transition:'opacity 0.5s'}}>
                      <div style={{width:36,height:36,borderRadius:8,background:earned?'rgba(201,169,110,0.15)':'rgba(255,255,255,0.04)',border:`1px solid ${earned?P.gold:P.borderL}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1rem',marginBottom:4}}>
                        {earned ? '\u2726' : '\u25CB'}
                      </div>
                      <div style={{fontFamily:SANS,fontSize:'0.55rem',color:earned?P.goldL:P.taupe,maxWidth:60}}>{m.name}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* 90-day dot tracker */}
          <div style={{fontFamily:SANS,fontSize:'0.68rem',color:P.taupe,letterSpacing:'0.08em',marginTop:28,marginBottom:12,textAlign:'center'}}>90-DAY TRACKER</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:6,maxWidth:280,margin:'0 auto'}}>
            {Array.from({length:90}).map((_,i)=>{
              const d = i + 1;
              const filled = !!prog.entries[d];
              return(
                <div key={d} style={{width:28,height:28,borderRadius:'50%',border:`1.5px solid ${filled?P.gold:P.borderL}`,background:filled?'rgba(201,169,110,0.2)':'transparent',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.5rem',color:filled?P.goldL:P.taupe,transition:'all 0.3s'}}>
                  {d}
                </div>
              );
            })}
          </div>
          <div style={{fontFamily:SERIF,fontStyle:'italic',fontSize:'0.72rem',color:P.taupe,textAlign:'center',marginTop:12}}>
            Every filled circle is a win.
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════
     RENDER — GRACE RESET
  ═══════════════════════════════════════════ */
  if(view === 'grace'){
    return(
      <div style={{position:'fixed',inset:0,background:'transparent',fontFamily:SANS,overflow:'auto',WebkitOverflowScrolling:'touch'}}><CottageBackground/>
        <style>{GFONTS}</style>
        <div style={{maxWidth:440,margin:'0 auto',padding:'60px 28px 80px',textAlign:'center'}}>
          <button onClick={()=>setView(null)} style={backBtnStyle}>Back to sanctuary</button>
          <div style={{fontFamily:DISPLAY,fontSize:'1.3rem',fontWeight:700,color:P.goldL,marginBottom:16}}>A Gentle Return</div>
          <div style={{width:40,height:1,background:`linear-gradient(90deg,transparent,${P.gold},transparent)`,margin:'0 auto 28px'}}/>
          <div style={{fontFamily:SERIF,fontStyle:'italic',fontSize:'0.95rem',color:'rgba(255,248,232,0.6)',lineHeight:1.8,marginBottom:32}}>
            If you missed some days, you are still here.<br/>
            That matters.<br/><br/>
            You do not restart. You just return.<br/><br/>
            Pick up wherever you are.<br/>
            No guilt. No catching up.
          </div>
          <div style={{fontFamily:SERIF,fontStyle:'italic',fontSize:'0.85rem',color:P.taupe,marginBottom:8}}>Where I am today:</div>
          <input style={inputStyle} placeholder="..."/>
          <div style={{fontFamily:SERIF,fontStyle:'italic',fontSize:'0.85rem',color:P.taupe,margin:'20px 0 8px'}}>One thing I will do:</div>
          <input style={inputStyle} placeholder="..."/>
          <button onClick={()=>{
            save({ graceResets: (prog.graceResets || 0) + 1 });
            setView('journal');
            if(setToast) setToast({ msg: 'Welcome back.' });
          }} style={{...btnStyle,marginTop:28}}>Return to Day {day}</button>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════
     RENDER — SANCTUARY HUB (main room)
  ═══════════════════════════════════════════ */
  return(
    <div style={{position:'fixed',inset:0,background:'transparent',fontFamily:SANS,overflow:'hidden'}}><CottageBackground/>
      <style>{GFONTS}{`
        @keyframes candleFlicker {
          0%,100% { opacity:1; transform:scaleY(1); }
          50% { opacity:0.7; transform:scaleY(0.85); }
        }
        @keyframes gentlePulse {
          0%,100% { opacity:0.6; }
          50% { opacity:1; }
        }
      `}</style>

      {/* Background — warm dark with subtle radial warmth */}
      <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at 50% 40%, rgba(201,169,110,0.06) 0%, transparent 60%)'}}/>

      {/* Back button */}
      <button onClick={onBack} style={{...backBtnStyle,position:'absolute',top:16,left:16,zIndex:20}}>
        Back to cabin
      </button>

      {/* Title */}
      <div style={{position:'absolute',top:16,left:'50%',transform:'translateX(-50%)',zIndex:20,textAlign:'center'}}>
        <div style={{fontFamily:DISPLAY,fontSize:'0.9rem',fontWeight:700,color:P.goldL}}>Becoming Her</div>
        {day > 0 && <div style={{fontFamily:SERIF,fontStyle:'italic',fontSize:'0.68rem',color:P.taupe}}>Day {day} of 90</div>}
      </div>

      {/* 4 Zone tiles — centered in room */}
      <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,padding:'0 28px',maxWidth:380}}>

          {/* Journal Table */}
          <button onClick={()=>setView('journal')} disabled={day<1} style={zoneStyle}>
            <div style={{fontSize:'1.5rem',marginBottom:8}}>&#128214;</div>
            <div style={{fontFamily:DISPLAY,fontSize:'0.88rem',fontWeight:700,color:P.goldL}}>Journal Table</div>
            <div style={{fontFamily:SERIF,fontStyle:'italic',fontSize:'0.7rem',color:P.taupe,marginTop:4}}>
              {day > 0 ? `Day ${day} is ready` : 'Complete setup first'}
            </div>
            {day > 0 && <div style={{width:6,height:6,borderRadius:'50%',background:P.gold,margin:'8px auto 0',animation:'gentlePulse 2s ease-in-out infinite'}}/>}
          </button>

          {/* Vision Wall */}
          <button onClick={()=>setView('vision')} style={zoneStyle}>
            <div style={{fontSize:'1.5rem',marginBottom:8}}>&#127793;</div>
            <div style={{fontFamily:DISPLAY,fontSize:'0.88rem',fontWeight:700,color:P.goldL}}>Vision Wall</div>
            <div style={{fontFamily:SERIF,fontStyle:'italic',fontSize:'0.7rem',color:P.taupe,marginTop:4}}>
              {prog.vineStage > 0 ? `Vine: ${prog.vineStage}/12` : 'Identity + growth'}
            </div>
          </button>

          {/* Prayer Corner */}
          <button onClick={()=>setView('prayer')} style={zoneStyle}>
            <div style={{fontSize:'1.5rem',marginBottom:8}}>&#128367;</div>
            <div style={{fontFamily:DISPLAY,fontSize:'0.88rem',fontWeight:700,color:P.goldL}}>Prayer Corner</div>
            <div style={{fontFamily:SERIF,fontStyle:'italic',fontSize:'0.7rem',color:P.taupe,marginTop:4}}>
              {prog.candlesLit > 0 ? `${prog.candlesLit} candle${prog.candlesLit>1?'s':''} lit` : 'Light a candle'}
            </div>
          </button>

          {/* Growth Shelf */}
          <button onClick={()=>setView('shelf')} style={zoneStyle}>
            <div style={{fontSize:'1.5rem',marginBottom:8}}>&#127942;</div>
            <div style={{fontFamily:DISPLAY,fontSize:'0.88rem',fontWeight:700,color:P.goldL}}>Growth Shelf</div>
            <div style={{fontFamily:SERIF,fontStyle:'italic',fontSize:'0.7rem',color:P.taupe,marginTop:4}}>
              {(prog.unlockedItems||[]).length} of {MILESTONES.length} collected
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   SHARED STYLES
═══════════════════════════════════════════ */
const btnStyle = {
  width:'100%',padding:'14px 24px',borderRadius:12,border:'none',cursor:'pointer',
  background:'rgba(201,169,110,0.12)',color:P.goldL,
  fontFamily:SERIF,fontStyle:'italic',fontSize:'0.88rem',fontWeight:600,
  boxShadow:'0 2px 12px rgba(0,0,0,0.2)',transition:'all 0.2s',
};
const inputStyle = {
  width:'100%',padding:'12px 16px',borderRadius:10,border:`1px solid ${P.border}`,
  background:'rgba(255,255,255,0.03)',color:'rgba(255,248,232,0.8)',
  fontFamily:SERIF,fontSize:'0.88rem',outline:'none',marginBottom:8,
  boxSizing:'border-box',
};
const backBtnStyle = {
  background:'none',border:'none',color:P.taupe,fontFamily:SANS,fontSize:'0.75rem',
  cursor:'pointer',marginBottom:20,padding:0,
};
const promptLabelStyle = {
  fontFamily:SANS,fontSize:'0.72rem',fontWeight:600,color:'rgba(255,248,232,0.5)',
  letterSpacing:'0.04em',marginBottom:6,marginTop:16,
};
const zoneStyle = {
  background:'rgba(26,22,18,0.85)',backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)',
  border:`1px solid rgba(201,169,110,0.15)`,borderRadius:16,padding:'24px 16px',
  cursor:'pointer',textAlign:'center',transition:'all 0.2s',
};
