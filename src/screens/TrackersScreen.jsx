import { useState, useMemo, useCallback, useContext, createContext } from 'react';
import { SERIF, SANS } from '../constants.js';

// ── Theme context — provides current palette to all sub-components ──
const ThemeCtx = createContext(null);
const useP = () => useContext(ThemeCtx);

/* ═══════════════════════════════════════════════════════════════
   TRACKERS — Spreadsheet-style Bill / Savings / Spending tracker
   Works like opening a Google Sheet inside the app.

   4 tabs:
     1. How to Use
     2. Monthly Bills
     3. Savings Goals
     4. Spending Tracker

   Data is persisted via onProgressChange (localStorage + Firestore).
═══════════════════════════════════════════════════════════════ */

// ── Theme presets (user can switch) ──
const TRACKER_THEMES = {
  tulip: {
    label: 'Tulip Garden',
    bloom: '🌷',
    bg: '#1A1612', panel: 'rgba(26,22,18,0.92)',
    cream: '#FAF6F0', brown: '#3A2E28', taupe: '#8A7A70',
    accent: '#C9A96E', accent2: '#D4A0A0', olive: '#9AAA8A',
    border: 'rgba(201,169,110,0.22)', borderL: 'rgba(201,169,110,0.1)',
    paidBg: 'rgba(154,170,138,0.18)', paidTxt: '#B8D4A8',
    head: 'rgba(201,169,110,0.12)',
  },
  lavender: {
    label: 'Lavender Dream',
    bloom: '💜',
    bg: '#1A1624', panel: 'rgba(30,24,40,0.92)',
    cream: '#F5F0FA', brown: '#2E1E3D', taupe: '#9086A0',
    accent: '#B8A0D0', accent2: '#C9A0B8', olive: '#A8A0D0',
    border: 'rgba(184,160,208,0.22)', borderL: 'rgba(184,160,208,0.1)',
    paidBg: 'rgba(184,160,208,0.18)', paidTxt: '#D4C0E8',
    head: 'rgba(184,160,208,0.12)',
  },
  ocean: {
    label: 'Ocean Calm',
    bloom: '🌊',
    bg: '#0F1A24', panel: 'rgba(18,30,45,0.92)',
    cream: '#F0F5FA', brown: '#1E2E3D', taupe: '#7090A0',
    accent: '#7AB8D8', accent2: '#A0C8D8', olive: '#8AC8C0',
    border: 'rgba(122,184,216,0.22)', borderL: 'rgba(122,184,216,0.1)',
    paidBg: 'rgba(122,184,216,0.18)', paidTxt: '#B0D4E8',
    head: 'rgba(122,184,216,0.12)',
  },
  sage: {
    label: 'Sage Garden',
    bloom: '🌿',
    bg: '#141A14', panel: 'rgba(22,30,22,0.92)',
    cream: '#F5FAF0', brown: '#1E3D2E', taupe: '#7A9078',
    accent: '#9AAA8A', accent2: '#C8D4A0', olive: '#8AC8A0',
    border: 'rgba(154,170,138,0.25)', borderL: 'rgba(154,170,138,0.12)',
    paidBg: 'rgba(154,170,138,0.2)', paidTxt: '#C8D8B0',
    head: 'rgba(154,170,138,0.14)',
  },
  sunset: {
    label: 'Sunset Glow',
    bloom: '🌅',
    bg: '#241410', panel: 'rgba(40,22,18,0.92)',
    cream: '#FAF0ED', brown: '#3D1E18', taupe: '#A08578',
    accent: '#E8A878', accent2: '#D88870', olive: '#D4A068',
    border: 'rgba(232,168,120,0.22)', borderL: 'rgba(232,168,120,0.1)',
    paidBg: 'rgba(232,168,120,0.18)', paidTxt: '#F0C8A0',
    head: 'rgba(232,168,120,0.12)',
  },
  rose: {
    label: 'Rose Quartz',
    bloom: '🌸',
    bg: '#24141A', panel: 'rgba(40,22,30,0.92)',
    cream: '#FAF0F3', brown: '#3D1E2E', taupe: '#A08085',
    accent: '#D490B0', accent2: '#E8A8C0', olive: '#C898B8',
    border: 'rgba(212,144,176,0.22)', borderL: 'rgba(212,144,176,0.1)',
    paidBg: 'rgba(212,144,176,0.18)', paidTxt: '#E8B8D0',
    head: 'rgba(212,144,176,0.12)',
  },
  light: {
    label: 'Soft Light',
    bloom: '☀️',
    bg: '#FAF6F0', panel: 'rgba(255,251,245,0.95)',
    cream: '#3A2E28', brown: '#5C4A2E', taupe: '#8A7A70',
    accent: '#B89456', accent2: '#D4A0A0', olive: '#7A9068',
    border: 'rgba(93,74,46,0.18)', borderL: 'rgba(93,74,46,0.08)',
    paidBg: 'rgba(154,170,138,0.2)', paidTxt: '#5C7048',
    head: 'rgba(201,169,110,0.14)',
  },
};

// ── Categories for bills & spending ──
const BILL_CATEGORIES = ['Housing','Utilities','Insurance','Food','Car','Fun','Health','Subscriptions','Other'];
const SPEND_CATEGORIES = ['Groceries','Gas','Eating Out','Household','Clothes','Hobbies','Fun','Gifts','Other'];

// ── Generic seed data (no personalization) ──
const SEED = {
  bills: [
    { id: 'b1', name: 'Rent / Mortgage', category: 'Housing',   dueDay: 1,  amount: 0, autoPay: false, paid: false, notes: '' },
    { id: 'b2', name: 'Electric',        category: 'Utilities', dueDay: 15, amount: 0, autoPay: false, paid: false, notes: '' },
    { id: 'b3', name: 'Water',           category: 'Utilities', dueDay: 20, amount: 0, autoPay: false, paid: false, notes: '' },
    { id: 'b4', name: 'Internet',        category: 'Utilities', dueDay: 10, amount: 0, autoPay: true,  paid: false, notes: '' },
    { id: 'b5', name: 'Phone',           category: 'Utilities', dueDay: 5,  amount: 0, autoPay: true,  paid: false, notes: '' },
    { id: 'b6', name: 'Car Insurance',   category: 'Insurance', dueDay: 12, amount: 0, autoPay: true,  paid: false, notes: '' },
    { id: 'b7', name: 'Health Insurance',category: 'Insurance', dueDay: 1,  amount: 0, autoPay: true,  paid: false, notes: '' },
    { id: 'b8', name: 'Streaming',       category: 'Subscriptions', dueDay: 22, amount: 0, autoPay: true, paid: false, notes: '' },
    { id: 'b9', name: 'Groceries (weekly)', category: 'Food',   dueDay: '', amount: 0, autoPay: false, paid: false, notes: '' },
    { id: 'b10',name: 'Gas for Car',     category: 'Car',       dueDay: '', amount: 0, autoPay: false, paid: false, notes: '' },
  ],
  goals: [
    { id: 'g1', name: 'Emergency Fund', target: 1000, saved: 0, notes: '' },
    { id: 'g2', name: 'Vacation Fund',  target: 800,  saved: 0, notes: '' },
    { id: 'g3', name: 'New Laptop',     target: 500,  saved: 0, notes: '' },
    { id: 'g4', name: 'Gift Fund',      target: 200,  saved: 0, notes: '' },
  ],
  spending: [],
};

// ── Default / empty state ──
export function createEmptyTrackers() {
  return {
    bills: SEED.bills.map(b => ({ ...b })),
    goals: SEED.goals.map(g => ({ ...g })),
    spending: [],
    lastReset: new Date().toISOString().slice(0,7), // YYYY-MM
    theme: 'tulip',
    history: {}, // { 'YYYY-MM': { bills, totals, spending } } snapshots of past months
    todos: [], // { id, title, priority, energy, minutes, section, done, doneAt, createdAt }
    todoDay: new Date().toISOString().slice(0,10), // last day the Done list was rolled over
  };
}

// ── Todo constants (ADHD-friendly) ──
const TODO_PRIORITIES = {
  must:   { label:'Must do',   emoji:'🔥', color:'#E8A878' },
  should: { label:'Should do', emoji:'💛', color:'#D4C87A' },
  nice:   { label:'Nice to do',emoji:'💙', color:'#7AB8D8' },
};
const TODO_ENERGIES = {
  low:  { label:'Low',    emoji:'🌿' },
  med:  { label:'Medium', emoji:'🌸' },
  high: { label:'High',   emoji:'⚡' },
};
const TODO_TIMES = [5, 15, 30, 60];
const SECTIONS = {
  big:   { label:'The Big 3',     desc:"Today's most important tasks — do these first.", cap:3 },
  quick: { label:'Quick Wins',    desc:'Small tasks (5–15 min) for dopamine hits.',       cap:99 },
  later: { label:'Later',         desc:"The backlog. Don't think about it right now.",    cap:99 },
};

// Encouragement messages when tasks complete
const CELEBRATIONS = [
  'One less thing.', 'Well done.', 'That counted.', 'Look at you.', 'Progress.',
  'Off the plate.', 'Gentle win.', 'Consistency over intensity.', 'Keep going.', "That's one.",
];

// Helper: format YYYY-MM to nice label like "April 2026"
function monthLabel(ym) {
  if (!ym) return '';
  const [y, m] = ym.split('-');
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

// ── Helpers ──
function money(n) {
  const v = Number(n) || 0;
  if (v === 0) return '—';
  return `$${v.toFixed(2)}`;
}
function pct(n) {
  return `${Math.round((Number(n)||0) * 100)}%`;
}
function goalStage(ratio) {
  if (ratio >= 1)    return '🎉 GOAL REACHED!';
  if (ratio >= 0.8)  return '🌸 Almost there!';
  if (ratio >= 0.6)  return '🌷 In full bloom';
  if (ratio >= 0.4)  return '🪴 Growing strong';
  if (ratio >= 0.2)  return '🌿 Sprouting up';
  if (ratio > 0)     return '🌱 Just planted';
  return '💐 Ready to begin';
}
function bloomRow(ratio, full='🌷', empty='🤍', len=10) {
  const filled = Math.max(0, Math.min(len, Math.round(ratio * len)));
  return full.repeat(filled) + empty.repeat(len - filled);
}
function billsVibe(ratio) {
  if (ratio >= 1)    return '🎉 All bills paid!';
  if (ratio >= 0.75) return '🌸 Almost there!';
  if (ratio >= 0.5)  return '🌷 Halfway bloomed!';
  if (ratio >= 0.25) return '🪴 Growing nicely';
  if (ratio > 0)     return '🌱 Just getting started';
  return '💐 A fresh new month';
}

// ═══════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function TrackersScreen({ progress, onProgressChange, onBack }) {
  const state = progress || createEmptyTrackers();
  const [tab, setTab] = useState('bills');
  const [editingCell, setEditingCell] = useState(null); // `${rowId}:${field}`
  const [showSettings, setShowSettings] = useState(false);

  // Active theme (falls back to tulip)
  const P = TRACKER_THEMES[state.theme] || TRACKER_THEMES.tulip;
  const isLight = state.theme === 'light';

  const update = useCallback((next) => {
    onProgressChange({ ...state, ...next });
  }, [state, onProgressChange]);

  const setTheme = (themeId) => update({ theme: themeId });

  // Download as PDF via browser print (native Save as PDF dialog)
  const downloadPDF = () => {
    document.body.classList.add('tracker-print-mode');
    setTimeout(() => {
      window.print();
      setTimeout(() => document.body.classList.remove('tracker-print-mode'), 500);
    }, 50);
  };

  // ── Computed: bills totals ──
  const billsCalc = useMemo(() => {
    const totalBills = state.bills.reduce((s,b) => s + (Number(b.amount)||0), 0);
    const paidBills  = state.bills.filter(b => b.paid).reduce((s,b) => s + (Number(b.amount)||0), 0);
    const stillPay   = totalBills - paidBills;
    const named      = state.bills.filter(b => (b.name||'').trim().length > 0);
    const numPaid    = named.filter(b => b.paid).length;
    const numTotal   = named.length;
    const ratio      = numTotal > 0 ? numPaid / numTotal : 0;
    return { totalBills, paidBills, stillPay, numPaid, numTotal, ratio };
  }, [state.bills]);

  // ── Computed: spending totals ──
  const spendCalc = useMemo(() => {
    const total = state.spending.reduce((s,r) => s + (Number(r.amount)||0), 0);
    const byCat = {};
    state.spending.forEach(r => {
      const c = r.category || 'Other';
      byCat[c] = (byCat[c]||0) + (Number(r.amount)||0);
    });
    return { total, byCat };
  }, [state.spending]);

  // ── Computed: savings totals ──
  const goalCalc = useMemo(() => {
    const target = state.goals.reduce((s,g) => s + (Number(g.target)||0), 0);
    const saved  = state.goals.reduce((s,g) => s + (Number(g.saved)||0), 0);
    return { target, saved, ratio: target > 0 ? saved / target : 0 };
  }, [state.goals]);

  // ── Row operations ──
  const updateBill = (id, field, value) => {
    const bills = state.bills.map(b => b.id === id ? { ...b, [field]: value } : b);
    update({ bills });
  };
  const addBill = () => {
    const id = 'b' + Date.now();
    update({ bills: [...state.bills, { id, name:'', category:'Other', dueDay:'', amount:0, autoPay:false, paid:false, notes:'' }] });
  };
  const deleteBill = (id) => {
    update({ bills: state.bills.filter(b => b.id !== id) });
  };
  const resetMonth = () => {
    // Archive current month before resetting so the user can look back
    const ym = state.lastReset || new Date().toISOString().slice(0,7);
    const named = state.bills.filter(b => (b.name||'').trim().length > 0);
    const numPaid  = named.filter(b => b.paid).length;
    const numTotal = named.length;
    const totalBills = state.bills.reduce((s,b) => s + (Number(b.amount)||0), 0);
    const paidBills  = state.bills.filter(b => b.paid).reduce((s,b) => s + (Number(b.amount)||0), 0);
    // Spending that falls in this archive month
    const monthSpending = state.spending.filter(r => (r.date||'').startsWith(ym));
    const spendTotal = monthSpending.reduce((s,r) => s + (Number(r.amount)||0), 0);
    const byCat = {};
    monthSpending.forEach(r => { const c = r.category || 'Other'; byCat[c] = (byCat[c]||0) + (Number(r.amount)||0); });

    const snapshot = {
      bills: state.bills.map(b => ({ ...b })),
      totalBills, paidBills, numPaid, numTotal,
      ratio: numTotal > 0 ? numPaid / numTotal : 0,
      spending: monthSpending,
      spendTotal,
      byCat,
      archivedAt: new Date().toISOString(),
    };

    const history = { ...(state.history || {}), [ym]: snapshot };
    const bills = state.bills.map(b => ({ ...b, paid:false }));
    // Remove archived month's spending from the active list so the new month starts clean
    const spending = state.spending.filter(r => !(r.date||'').startsWith(ym));
    update({ bills, spending, history, lastReset: new Date().toISOString().slice(0,7) });
  };

  const updateGoal = (id, field, value) => {
    const goals = state.goals.map(g => g.id === id ? { ...g, [field]: value } : g);
    update({ goals });
  };
  const addGoal = () => {
    const id = 'g' + Date.now();
    update({ goals: [...state.goals, { id, name:'', target:0, saved:0, notes:'' }] });
  };
  const deleteGoal = (id) => {
    update({ goals: state.goals.filter(g => g.id !== id) });
  };

  const updateSpend = (id, field, value) => {
    const spending = state.spending.map(r => r.id === id ? { ...r, [field]: value } : r);
    update({ spending });
  };
  const addSpend = () => {
    const id = 's' + Date.now();
    const today = new Date().toISOString().slice(0,10);
    update({ spending: [...state.spending, { id, date: today, category:'Groceries', where:'', amount:0, notes:'' }] });
  };
  const deleteSpend = (id) => {
    update({ spending: state.spending.filter(r => r.id !== id) });
  };

  // ── Todo operations ──
  // Daily rollover: if it's a new day, archive yesterday's completed todos (remove from list)
  const today = new Date().toISOString().slice(0,10);
  const todos = (state.todos || []).filter(t => !(t.done && t.doneAt && !t.doneAt.startsWith(today)));
  // Note: we don't call update() just for rollover reads — we filter on display

  const addTodo = (section = 'later') => {
    const id = 't' + Date.now();
    const newTodo = {
      id, title:'', priority:'should', energy:'med', minutes:15,
      section, done:false, doneAt:null, createdAt: new Date().toISOString(),
    };
    update({ todos: [...(state.todos || []), newTodo] });
  };
  const updateTodo = (id, field, value) => {
    const todos = (state.todos || []).map(t => t.id === id ? { ...t, [field]: value } : t);
    update({ todos });
  };
  const toggleTodoDone = (id) => {
    const todos = (state.todos || []).map(t => {
      if (t.id !== id) return t;
      const done = !t.done;
      return { ...t, done, doneAt: done ? new Date().toISOString() : null };
    });
    update({ todos });
  };
  const deleteTodo = (id) => {
    update({ todos: (state.todos || []).filter(t => t.id !== id) });
  };
  const moveTodoToSection = (id, section) => {
    updateTodo(id, 'section', section);
  };
  const clearDoneTodos = () => {
    update({ todos: (state.todos || []).filter(t => !t.done) });
  };

  return (
    <ThemeCtx.Provider value={P}>
    <PrintStyles />
    <div className="tracker-root" style={{
      minHeight:'100vh',
      background: isLight
        ? `linear-gradient(180deg, ${P.bg} 0%, #F0EBE2 100%)`
        : `linear-gradient(180deg, ${P.bg} 0%, #0F0B08 100%)`,
      color:P.cream,
      fontFamily:SANS,
      paddingBottom:80,
    }}>
      {/* ── Top bar ── */}
      <div className="tracker-topbar" style={{
        position:'sticky', top:0, zIndex:20,
        background: isLight ? 'rgba(255,251,245,0.95)' : 'rgba(20,16,12,0.95)',
        borderBottom:`1px solid ${P.border}`,
        backdropFilter:'blur(10px)',
      }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px' }}>
          <button onClick={onBack} style={{
            background:'transparent', border:`1px solid ${P.border}`, color:P.taupe,
            padding:'6px 12px', borderRadius:8, cursor:'pointer', fontFamily:SANS, fontSize:'0.78rem',
          }}>← Back</button>
          <div style={{ fontFamily:SERIF, fontSize:'1.05rem', color:P.cream, letterSpacing:'0.03em' }}>
            {P.bloom} Trackers
          </div>
          <div style={{ display:'flex', gap:6 }}>
            <button title="Download as PDF" onClick={downloadPDF} style={{
              background:'transparent', border:`1px solid ${P.border}`, color:P.taupe,
              width:32, height:32, borderRadius:8, cursor:'pointer', fontSize:'0.9rem',
              display:'inline-flex', alignItems:'center', justifyContent:'center',
            }}>⬇</button>
            <button title="Customize" onClick={() => setShowSettings(true)} style={{
              background:'transparent', border:`1px solid ${P.border}`, color:P.taupe,
              width:32, height:32, borderRadius:8, cursor:'pointer', fontSize:'0.9rem',
              display:'inline-flex', alignItems:'center', justifyContent:'center',
            }}>⚙</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="tracker-tabs" style={{ display:'flex', gap:0, borderTop:`1px solid ${P.borderL}`, overflowX:'auto' }}>
          {[
            { id:'todos',    label:'To-Do',            icon:'✓' },
            { id:'bills',    label:'Monthly Bills',    icon:'💌' },
            { id:'goals',    label:'Savings Goals',    icon:P.bloom },
            { id:'spending', label:'Spending',         icon:'✨' },
            { id:'howto',    label:'How to Use',       icon:'💗' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex:1, minWidth:100,
              background: tab === t.id ? P.head : 'transparent',
              border:'none',
              borderBottom: tab === t.id ? `2px solid ${P.accent}` : `2px solid transparent`,
              color: tab === t.id ? P.cream : P.taupe,
              padding:'10px 8px',
              cursor:'pointer',
              fontFamily:SANS,
              fontSize:'0.74rem',
              letterSpacing:'0.05em',
              transition:'all 0.2s',
              whiteSpace:'nowrap',
            }}>
              <span style={{ marginRight:4 }}>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ padding:'18px 14px', maxWidth:960, margin:'0 auto' }}>

        {tab === 'bills' && (
          <BillsTab
            bills={state.bills}
            calc={billsCalc}
            editingCell={editingCell} setEditingCell={setEditingCell}
            updateBill={updateBill} addBill={addBill} deleteBill={deleteBill}
            resetMonth={resetMonth}
            lastReset={state.lastReset}
            history={state.history || {}}
          />
        )}

        {tab === 'goals' && (
          <GoalsTab
            goals={state.goals}
            calc={goalCalc}
            editingCell={editingCell} setEditingCell={setEditingCell}
            updateGoal={updateGoal} addGoal={addGoal} deleteGoal={deleteGoal}
          />
        )}

        {tab === 'spending' && (
          <SpendingTab
            spending={state.spending}
            calc={spendCalc}
            editingCell={editingCell} setEditingCell={setEditingCell}
            updateSpend={updateSpend} addSpend={addSpend} deleteSpend={deleteSpend}
            lastReset={state.lastReset}
            history={state.history || {}}
          />
        )}

        {tab === 'todos' && (
          <TodoTab
            todos={todos}
            addTodo={addTodo} updateTodo={updateTodo}
            toggleTodoDone={toggleTodoDone} deleteTodo={deleteTodo}
            moveTodoToSection={moveTodoToSection}
            clearDoneTodos={clearDoneTodos}
            editingCell={editingCell} setEditingCell={setEditingCell}
          />
        )}

        {tab === 'howto' && <HowToTab />}
      </div>

      {/* ── Print header (only visible on print) ── */}
      <div className="tracker-print-header">
        <h1>{P.bloom} My Trackers</h1>
        <div className="subtitle">Printed {new Date().toLocaleDateString()}</div>
      </div>

      {/* ── Settings modal ── */}
      {showSettings && (
        <SettingsPanel
          currentTheme={state.theme || 'tulip'}
          onSelect={(id) => { setTheme(id); }}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
    </ThemeCtx.Provider>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SETTINGS PANEL — color theme picker
═══════════════════════════════════════════════════════════════ */
function SettingsPanel({ currentTheme, onSelect, onClose }) {
  const P = useP();
  return (
    <div onClick={onClose} style={{
      position:'fixed', inset:0, zIndex:100,
      background:'rgba(10,8,6,0.75)', backdropFilter:'blur(4px)',
      display:'flex', alignItems:'center', justifyContent:'center',
      padding:'20px',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background:P.panel, border:`1px solid ${P.border}`,
        borderRadius:16, padding:'22px 22px 24px',
        maxWidth:460, width:'100%', maxHeight:'82vh', overflowY:'auto',
      }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <div style={{ fontFamily:SERIF, fontSize:'1.15rem', color:P.cream }}>Customize</div>
          <button onClick={onClose} style={{
            background:'transparent', border:'none', color:P.taupe,
            cursor:'pointer', fontSize:'1.2rem', padding:4,
          }}>×</button>
        </div>
        <div style={{ fontSize:'0.76rem', color:P.taupe, marginBottom:16, lineHeight:1.5 }}>
          Pick a color theme for your tracker. Your choice saves automatically.
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(130px, 1fr))', gap:10 }}>
          {Object.entries(TRACKER_THEMES).map(([id, t]) => {
            const active = currentTheme === id;
            return (
              <button key={id} onClick={() => onSelect(id)} style={{
                background: active ? `linear-gradient(135deg, ${t.bg}, ${t.panel})` : t.bg,
                border:`1.5px solid ${active ? t.accent : 'rgba(255,255,255,0.08)'}`,
                borderRadius:12, padding:'14px 12px',
                cursor:'pointer', textAlign:'left',
                position:'relative', overflow:'hidden',
                transition:'all 0.2s',
                color: t.cream,
                fontFamily:SANS,
              }}>
                <div style={{ fontSize:'1.4rem', marginBottom:6 }}>{t.bloom}</div>
                <div style={{ fontFamily:SERIF, fontSize:'0.85rem', color:t.cream, marginBottom:8 }}>{t.label}</div>
                <div style={{ display:'flex', gap:4 }}>
                  <span style={{ width:14, height:14, borderRadius:3, background:t.accent }} />
                  <span style={{ width:14, height:14, borderRadius:3, background:t.accent2 }} />
                  <span style={{ width:14, height:14, borderRadius:3, background:t.olive }} />
                </div>
                {active && (
                  <div style={{
                    position:'absolute', top:8, right:8,
                    width:18, height:18, borderRadius:'50%',
                    background: t.accent, color: t.bg,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:'0.7rem', fontWeight:700,
                  }}>✓</div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PRINT STYLES — injects @media print rules
═══════════════════════════════════════════════════════════════ */
function PrintStyles() {
  return (
    <style>{`
      .tracker-print-header { display: none; }
      @media print {
        @page { margin: 0.5in; }
        body { background: white !important; }
        body > *:not(.tracker-root):not(style):not(link):not(script) { display: none !important; }
        .tracker-root .tracker-topbar,
        .tracker-root button.row-delete,
        .tracker-root .tracker-action-row,
        .tracker-root .tracker-summary-gardens {
          display: none !important;
        }
        .tracker-root {
          background: white !important;
          color: black !important;
          padding: 0 !important;
          min-height: auto !important;
        }
        .tracker-print-header {
          display: block !important;
          padding: 0 0 12px;
          border-bottom: 2px solid #333;
          margin-bottom: 16px;
        }
        .tracker-print-header h1 { font-family: Georgia, serif; font-size: 22px; margin: 0; color: #222; }
        .tracker-print-header .subtitle { font-size: 11px; color: #666; margin-top: 4px; }
        .tracker-root * {
          color: black !important;
          background: white !important;
          border-color: #ccc !important;
          text-shadow: none !important;
          box-shadow: none !important;
        }
        .tracker-root table { page-break-inside: auto; }
        .tracker-root tr { page-break-inside: avoid; page-break-after: auto; }
        .tracker-root thead { display: table-header-group; }
      }
    `}</style>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CELL (editable)
═══════════════════════════════════════════════════════════════ */
function Cell({ value, onChange, type='text', format='auto', options, placeholder='', editing, onEdit, onBlur, style = {}, readOnly = false }) {
  const P = useP();
  if (readOnly) {
    return (
      <div style={{
        padding:'8px 10px',
        fontSize:'0.82rem',
        color:P.cream,
        ...style,
      }}>{value}</div>
    );
  }
  if (type === 'checkbox') {
    return (
      <button onClick={() => onChange(!value)} style={{
        background:'transparent', border:'none', cursor:'pointer',
        padding:'8px 10px', color:P.cream, fontSize:'0.82rem',
        display:'flex', alignItems:'center', gap:6, ...style,
      }}>
        <span style={{
          width:16, height:16, borderRadius:4,
          border:`1.5px solid ${value ? P.olive : P.taupe}`,
          background: value ? P.olive : 'transparent',
          display:'inline-flex', alignItems:'center', justifyContent:'center',
          color:P.bg, fontSize:'0.65rem', fontWeight:700,
        }}>{value ? '✓' : ''}</span>
        <span style={{ color: value ? P.paidTxt : P.taupe }}>{value ? 'Yes' : 'No'}</span>
      </button>
    );
  }
  if (type === 'select') {
    return (
      <select value={value || ''} onChange={e => onChange(e.target.value)} style={{
        width:'100%', padding:'8px 10px',
        background:'transparent', border:'none',
        color:P.cream, fontFamily:SANS, fontSize:'0.82rem',
        cursor:'pointer', outline:'none',
        ...style,
      }}>
        {options.map(o => <option key={o} value={o} style={{ background:P.brown }}>{o}</option>)}
      </select>
    );
  }
  if (editing) {
    return (
      <input
        autoFocus
        type={type}
        value={value ?? ''}
        placeholder={placeholder}
        onChange={e => onChange(type === 'number' ? e.target.value : e.target.value)}
        onBlur={onBlur}
        onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); }}
        style={{
          width:'100%', padding:'8px 10px',
          background:'rgba(201,169,110,0.08)',
          border:`1.5px solid ${P.accent}`,
          borderRadius:4,
          color:P.cream, fontFamily:SANS, fontSize:'0.82rem',
          outline:'none',
          boxSizing:'border-box',
          ...style,
        }}
      />
    );
  }
  return (
    <div onClick={onEdit} style={{
      padding:'8px 10px',
      fontSize:'0.82rem',
      color: (value === '' || value == null || value === 0) ? P.taupe : P.cream,
      cursor:'text',
      minHeight:'1.2em',
      ...style,
    }}>{value === '' || value == null ? (placeholder || '—') : (type === 'number' && format !== 'plain' ? money(value) : value)}</div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   BILLS TAB
═══════════════════════════════════════════════════════════════ */
function BillsTab({ bills, calc, editingCell, setEditingCell, updateBill, addBill, deleteBill, resetMonth, lastReset, history }) {
  const P = useP();
  const archivedMonths = Object.keys(history || {}).sort().reverse();
  return (
    <>
      <SectionHeader
        title="Monthly Bills"
        subtitle="Mark a bill Paid when you pay it — watch your garden bloom."
      />

      {/* Summary + Garden */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
        <SummaryCard>
          <div style={{ fontSize:'0.72rem', color:P.taupe, letterSpacing:'0.08em', marginBottom:6 }}>THIS MONTH</div>
          <StatRow label="Total Bills"  value={money(calc.totalBills)} />
          <StatRow label="Paid So Far"  value={money(calc.paidBills)} accent={P.paidTxt} />
          <StatRow label="Still to Pay" value={money(calc.stillPay)} accent={P.rose} />
          <StatRow label="Bills Paid"   value={`${calc.numPaid} / ${calc.numTotal}`} />
          <StatRow label="% Done"       value={pct(calc.ratio)} accent={P.accent} />
        </SummaryCard>

        <SummaryCard>
          <div style={{ fontSize:'0.72rem', color:P.taupe, letterSpacing:'0.08em', marginBottom:6 }}>🌷 YOUR GARDEN</div>
          <div style={{ fontSize:'1.25rem', letterSpacing:'0.1em', lineHeight:1.5, marginBottom:10 }}>
            {bloomRow(calc.ratio, P.bloom,'🤍', 10)}
          </div>
          <div style={{ fontSize:'0.82rem', color:P.cream, fontStyle:'italic' }}>
            {billsVibe(calc.ratio)}
          </div>
          <div style={{ fontSize:'0.68rem', color:P.taupe, marginTop:10 }}>
            Reset paid status monthly to replant.
          </div>
        </SummaryCard>
      </div>

      {/* Table */}
      <SheetTable
        columns={[
          { key:'name',     label:'Bill Name',   width:'minmax(120px, 1.6fr)' },
          { key:'category', label:'Category',    width:'minmax(100px, 1fr)' },
          { key:'dueDay',   label:'Due Day',     width:'70px' },
          { key:'amount',   label:'Amount',      width:'90px' },
          { key:'autoPay',  label:'Auto-Pay?',   width:'80px' },
          { key:'paid',     label:'Paid?',       width:'80px' },
          { key:'notes',    label:'Notes',       width:'minmax(90px, 1.2fr)' },
          { key:'_actions', label:'',            width:'40px' },
        ]}
        rows={bills}
        renderCell={(row, col) => {
          const k = col.key;
          const cellKey = `${row.id}:${k}`;
          const isEditing = editingCell === cellKey;
          const commonProps = {
            editing: isEditing,
            onEdit: () => setEditingCell(cellKey),
            onBlur: () => setEditingCell(null),
          };
          if (k === 'name')     return <Cell value={row.name}     placeholder="(bill name)" onChange={v => updateBill(row.id,'name',v)} {...commonProps} />;
          if (k === 'category') return <Cell value={row.category} type="select" options={BILL_CATEGORIES} onChange={v => updateBill(row.id,'category',v)} />;
          if (k === 'dueDay')   return <Cell value={row.dueDay}   type="number" format="plain" placeholder="—" onChange={v => updateBill(row.id,'dueDay',v === '' ? '' : Number(v))} {...commonProps} />;
          if (k === 'amount')   return <Cell value={row.amount}   type="number" placeholder="$0" onChange={v => updateBill(row.id,'amount',Number(v)||0)} {...commonProps} />;
          if (k === 'autoPay')  return <Cell value={row.autoPay}  type="checkbox" onChange={v => updateBill(row.id,'autoPay',v)} />;
          if (k === 'paid')     return <Cell value={row.paid}     type="checkbox" onChange={v => updateBill(row.id,'paid',v)} />;
          if (k === 'notes')    return <Cell value={row.notes}    placeholder="—" onChange={v => updateBill(row.id,'notes',v)} {...commonProps} />;
          if (k === '_actions') return <RowDelete onClick={() => deleteBill(row.id)} />;
          return null;
        }}
        rowStyle={(row) => row.paid ? { background:P.paidBg } : {}}
        footer={
          <tr>
            <td colSpan={3} style={{ padding:'10px 12px', textAlign:'right', color:P.taupe, fontSize:'0.78rem' }}>TOTAL</td>
            <td style={{ padding:'10px 12px', color:P.accent, fontWeight:600, fontSize:'0.82rem' }}>{money(calc.totalBills)}</td>
            <td colSpan={4} />
          </tr>
        }
      />

      <div style={{ display:'flex', gap:10, marginTop:14, flexWrap:'wrap' }}>
        <ActionBtn onClick={addBill}>+ Add Bill</ActionBtn>
        <ActionBtn variant="ghost" onClick={resetMonth}>Reset All Paid (new month)</ActionBtn>
      </div>

      {lastReset && (
        <div style={{ marginTop:10, fontSize:'0.7rem', color:P.taupe }}>
          Current month: {monthLabel(lastReset)}
        </div>
      )}

      {archivedMonths.length > 0 && (
        <div style={{ marginTop:32 }}>
          <div style={{ fontFamily:SERIF, fontSize:'1.05rem', color:P.cream, marginBottom:4 }}>Past Months</div>
          <div style={{ fontSize:'0.76rem', color:P.taupe, marginBottom:12, lineHeight:1.5 }}>
            A snapshot of every month you've reset. Tap to expand.
          </div>
          <div style={{ display:'grid', gap:10 }}>
            {archivedMonths.map(ym => (
              <HistoryMonthCard key={ym} ym={ym} snap={history[ym]} type="bills" />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   HISTORY MONTH CARD — used in both Bills and Spending tabs
═══════════════════════════════════════════════════════════════ */
function HistoryMonthCard({ ym, snap, type }) {
  const P = useP();
  const [open, setOpen] = useState(false);
  if (!snap) return null;

  const ratio = snap.ratio ?? (snap.numTotal > 0 ? snap.numPaid / snap.numTotal : 0);

  return (
    <div style={{
      background:P.panel, border:`1px solid ${P.border}`, borderRadius:12,
      overflow:'hidden',
    }}>
      <button onClick={() => setOpen(!open)} style={{
        width:'100%', padding:'12px 16px',
        background:'transparent', border:'none', cursor:'pointer',
        display:'flex', alignItems:'center', justifyContent:'space-between', gap:10,
        fontFamily:SANS, color:P.cream, textAlign:'left',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, flex:1, minWidth:0 }}>
          <div style={{ fontFamily:SERIF, fontSize:'0.95rem', color:P.cream }}>
            {monthLabel(ym)}
          </div>
          <div style={{ fontSize:'0.9rem', letterSpacing:'0.05em' }}>
            {bloomRow(ratio, P.bloom, '🤍', 6)}
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {type === 'bills' ? (
            <>
              <span style={{ fontSize:'0.76rem', color:P.taupe }}>{snap.numPaid}/{snap.numTotal} paid</span>
              <span style={{ fontSize:'0.76rem', color:P.accent, fontWeight:600 }}>{money(snap.paidBills || 0)}</span>
            </>
          ) : (
            <>
              <span style={{ fontSize:'0.76rem', color:P.taupe }}>{(snap.spending||[]).length} entries</span>
              <span style={{ fontSize:'0.76rem', color:P.accent, fontWeight:600 }}>{money(snap.spendTotal || 0)}</span>
            </>
          )}
          <span style={{ color:P.taupe, fontSize:'0.9rem' }}>{open ? '▴' : '▾'}</span>
        </div>
      </button>

      {open && (
        <div style={{ padding:'4px 16px 14px', borderTop:`1px solid ${P.borderL}` }}>
          {type === 'bills' ? (
            <div style={{ padding:'10px 0' }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
                <div style={{ fontSize:'0.76rem' }}>
                  <div style={{ color:P.taupe, fontSize:'0.66rem', letterSpacing:'0.08em' }}>TOTAL BILLS</div>
                  <div style={{ color:P.cream }}>{money(snap.totalBills || 0)}</div>
                </div>
                <div style={{ fontSize:'0.76rem' }}>
                  <div style={{ color:P.taupe, fontSize:'0.66rem', letterSpacing:'0.08em' }}>PAID</div>
                  <div style={{ color:P.accent }}>{money(snap.paidBills || 0)} ({Math.round(ratio * 100)}%)</div>
                </div>
              </div>
              {(snap.bills || []).filter(b => (b.name||'').trim()).map(b => (
                <div key={b.id} style={{
                  display:'flex', justifyContent:'space-between', padding:'5px 0',
                  fontSize:'0.78rem',
                  borderTop:`1px dashed ${P.borderL}`,
                  color: b.paid ? P.paidTxt : P.taupe,
                }}>
                  <span>{b.paid ? '✓ ' : '○ '}{b.name}</span>
                  <span>{money(b.amount || 0)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding:'10px 0' }}>
              {Object.keys(snap.byCat || {}).length > 0 && (
                <div style={{ marginBottom:12 }}>
                  <div style={{ color:P.taupe, fontSize:'0.66rem', letterSpacing:'0.08em', marginBottom:4 }}>BY CATEGORY</div>
                  {Object.entries(snap.byCat).sort((a,b) => b[1]-a[1]).map(([cat,amt]) => (
                    <div key={cat} style={{ display:'flex', justifyContent:'space-between', fontSize:'0.78rem', padding:'2px 0' }}>
                      <span style={{ color:P.cream }}>{cat}</span>
                      <span style={{ color:P.accent }}>{money(amt)}</span>
                    </div>
                  ))}
                </div>
              )}
              {(snap.spending || []).length > 0 && (
                <div>
                  <div style={{ color:P.taupe, fontSize:'0.66rem', letterSpacing:'0.08em', marginBottom:4 }}>ENTRIES</div>
                  {snap.spending.map(r => (
                    <div key={r.id} style={{
                      display:'grid', gridTemplateColumns:'70px 1fr auto', gap:10,
                      padding:'4px 0', fontSize:'0.76rem',
                      borderTop:`1px dashed ${P.borderL}`,
                    }}>
                      <span style={{ color:P.taupe }}>{r.date}</span>
                      <span style={{ color:P.cream }}>{r.where || r.category}</span>
                      <span style={{ color:P.accent }}>{money(r.amount || 0)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   GOALS TAB
═══════════════════════════════════════════════════════════════ */
function GoalsTab({ goals, calc, editingCell, setEditingCell, updateGoal, addGoal, deleteGoal }) {
  const P = useP();
  return (
    <>
      <SectionHeader
        title="Savings & Goals Garden"
        subtitle="Each goal grows as you add money to it. Update Saved So Far and watch it bloom."
      />

      <SummaryCard style={{ marginBottom:16 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
          <StatBlock label="Total Target"  value={money(calc.target)} />
          <StatBlock label="Saved So Far"  value={money(calc.saved)}  accent={P.olive} />
          <StatBlock label="% to Total"    value={pct(calc.ratio)}    accent={P.accent} />
        </div>
      </SummaryCard>

      {/* Goals as cards (each with its own garden bar) */}
      {goals.map(g => {
        const ratio = (Number(g.target)||0) > 0 ? (Number(g.saved)||0) / g.target : 0;
        const done = ratio >= 1;
        return (
          <div key={g.id} style={{
            background: done ? 'linear-gradient(135deg, rgba(201,169,110,0.18), rgba(201,169,110,0.08))' : P.panel,
            border:`1px solid ${done ? P.accent : P.border}`,
            borderRadius:12,
            padding:'14px 16px',
            marginBottom:10,
            transition:'all 0.2s',
          }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10, marginBottom:8 }}>
              <div style={{ flex:1, minWidth:0 }}>
                <Cell
                  value={g.name}
                  placeholder="(goal name)"
                  onChange={v => updateGoal(g.id,'name',v)}
                  editing={editingCell === `${g.id}:name`}
                  onEdit={() => setEditingCell(`${g.id}:name`)}
                  onBlur={() => setEditingCell(null)}
                  style={{ fontFamily:SERIF, fontSize:'1rem', padding:'2px 0', color:P.cream }}
                />
              </div>
              <button onClick={() => deleteGoal(g.id)} style={{
                background:'transparent', border:'none', color:P.taupe, cursor:'pointer',
                fontSize:'0.9rem', padding:4, opacity:0.5,
              }}>×</button>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
              <div>
                <div style={{ fontSize:'0.66rem', color:P.taupe, letterSpacing:'0.06em', marginBottom:2 }}>TARGET</div>
                <Cell
                  value={g.target} type="number"
                  onChange={v => updateGoal(g.id,'target',Number(v)||0)}
                  editing={editingCell === `${g.id}:target`}
                  onEdit={() => setEditingCell(`${g.id}:target`)}
                  onBlur={() => setEditingCell(null)}
                  placeholder="$0"
                  style={{ padding:'4px 0', fontSize:'0.9rem' }}
                />
              </div>
              <div>
                <div style={{ fontSize:'0.66rem', color:P.taupe, letterSpacing:'0.06em', marginBottom:2 }}>SAVED SO FAR</div>
                <Cell
                  value={g.saved} type="number"
                  onChange={v => updateGoal(g.id,'saved',Number(v)||0)}
                  editing={editingCell === `${g.id}:saved`}
                  onEdit={() => setEditingCell(`${g.id}:saved`)}
                  onBlur={() => setEditingCell(null)}
                  placeholder="$0"
                  style={{ padding:'4px 0', fontSize:'0.9rem', color:P.olive }}
                />
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ height:8, background:'rgba(255,255,255,0.05)', borderRadius:4, overflow:'hidden', marginBottom:6 }}>
              <div style={{
                width:`${Math.min(100, ratio*100)}%`,
                height:'100%',
                background: done ? P.accent : `linear-gradient(90deg, ${P.olive}, ${P.accent})`,
                transition:'width 0.3s',
              }} />
            </div>

            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:'0.78rem' }}>
              <span style={{ color: done ? P.accent : P.cream }}>{goalStage(ratio)}</span>
              <span style={{ color:P.taupe }}>{pct(ratio)}</span>
            </div>

            <div style={{ fontSize:'1rem', letterSpacing:'0.08em', marginTop:8, lineHeight:1.3 }}>
              {bloomRow(ratio, P.bloom,'🤍', 10)}
            </div>
          </div>
        );
      })}

      <ActionBtn onClick={addGoal}>+ Add Goal</ActionBtn>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SPENDING TAB
═══════════════════════════════════════════════════════════════ */
function SpendingTab({ spending, calc, editingCell, setEditingCell, updateSpend, addSpend, deleteSpend, lastReset, history }) {
  const P = useP();
  const archivedMonths = Object.keys(history || {}).sort().reverse();
  return (
    <>
      <SectionHeader
        title="Spending Tracker"
        subtitle="Jot down anything you spend that isn't a regular monthly bill."
      />

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
        <SummaryCard>
          <div style={{ fontSize:'0.72rem', color:P.taupe, letterSpacing:'0.08em', marginBottom:6 }}>TOTAL SPENT</div>
          <div style={{ fontFamily:SERIF, fontSize:'1.6rem', color:P.accent }}>{money(calc.total)}</div>
          <div style={{ fontSize:'0.7rem', color:P.taupe, marginTop:6 }}>{spending.length} entries</div>
        </SummaryCard>

        <SummaryCard>
          <div style={{ fontSize:'0.72rem', color:P.taupe, letterSpacing:'0.08em', marginBottom:6 }}>BY CATEGORY</div>
          {Object.keys(calc.byCat).length === 0 ? (
            <div style={{ fontSize:'0.78rem', color:P.taupe, fontStyle:'italic' }}>No spending logged yet.</div>
          ) : (
            Object.entries(calc.byCat)
              .sort((a,b) => b[1]-a[1])
              .slice(0,6)
              .map(([cat,amt]) => (
                <div key={cat} style={{ display:'flex', justifyContent:'space-between', fontSize:'0.78rem', padding:'2px 0' }}>
                  <span style={{ color:P.cream }}>{cat}</span>
                  <span style={{ color:P.accent }}>{money(amt)}</span>
                </div>
              ))
          )}
        </SummaryCard>
      </div>

      {spending.length === 0 ? (
        <div style={{
          textAlign:'center', padding:'30px 20px',
          color:P.taupe, fontSize:'0.85rem',
          border:`1px dashed ${P.border}`, borderRadius:12,
        }}>
          No entries yet. Tap "+ Add Entry" to log your first spend.
        </div>
      ) : (
        <SheetTable
          columns={[
            { key:'date',     label:'Date',         width:'110px' },
            { key:'category', label:'Category',     width:'minmax(100px, 1fr)' },
            { key:'where',    label:'Where / What', width:'minmax(120px, 1.5fr)' },
            { key:'amount',   label:'Amount',       width:'90px' },
            { key:'notes',    label:'Notes',        width:'minmax(90px, 1fr)' },
            { key:'_actions', label:'',             width:'40px' },
          ]}
          rows={spending}
          renderCell={(row, col) => {
            const k = col.key;
            const cellKey = `${row.id}:${k}`;
            const isEditing = editingCell === cellKey;
            const commonProps = {
              editing: isEditing,
              onEdit: () => setEditingCell(cellKey),
              onBlur: () => setEditingCell(null),
            };
            if (k === 'date')     return <Cell value={row.date} type="date" onChange={v => updateSpend(row.id,'date',v)} {...commonProps} />;
            if (k === 'category') return <Cell value={row.category} type="select" options={SPEND_CATEGORIES} onChange={v => updateSpend(row.id,'category',v)} />;
            if (k === 'where')    return <Cell value={row.where} placeholder="(where / what)" onChange={v => updateSpend(row.id,'where',v)} {...commonProps} />;
            if (k === 'amount')   return <Cell value={row.amount} type="number" placeholder="$0" onChange={v => updateSpend(row.id,'amount',Number(v)||0)} {...commonProps} />;
            if (k === 'notes')    return <Cell value={row.notes} placeholder="—" onChange={v => updateSpend(row.id,'notes',v)} {...commonProps} />;
            if (k === '_actions') return <RowDelete onClick={() => deleteSpend(row.id)} />;
            return null;
          }}
          footer={
            <tr>
              <td colSpan={3} style={{ padding:'10px 12px', textAlign:'right', color:P.taupe, fontSize:'0.78rem' }}>TOTAL</td>
              <td style={{ padding:'10px 12px', color:P.accent, fontWeight:600, fontSize:'0.82rem' }}>{money(calc.total)}</td>
              <td colSpan={2} />
            </tr>
          }
        />
      )}

      <div style={{ marginTop:14 }}>
        <ActionBtn onClick={addSpend}>+ Add Entry</ActionBtn>
      </div>

      {lastReset && (
        <div style={{ marginTop:10, fontSize:'0.7rem', color:P.taupe }}>
          Current month: {monthLabel(lastReset)}
        </div>
      )}

      {archivedMonths.length > 0 && (
        <div style={{ marginTop:32 }}>
          <div style={{ fontFamily:SERIF, fontSize:'1.05rem', color:P.cream, marginBottom:4 }}>Past Months</div>
          <div style={{ fontSize:'0.76rem', color:P.taupe, marginBottom:12, lineHeight:1.5 }}>
            Saved when you reset the Bills tab. Tap a month to see where your money went.
          </div>
          <div style={{ display:'grid', gap:10 }}>
            {archivedMonths.map(ym => (
              <HistoryMonthCard key={ym} ym={ym} snap={history[ym]} type="spending" />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TODO TAB — ADHD-friendly task list
   "The Big 3" → Quick Wins → Later → Done Today
═══════════════════════════════════════════════════════════════ */
function TodoTab({ todos, addTodo, updateTodo, toggleTodoDone, deleteTodo, moveTodoToSection, clearDoneTodos, editingCell, setEditingCell }) {
  const P = useP();
  const [celebration, setCelebration] = useState(null);

  const bySection = {
    big:   todos.filter(t => !t.done && t.section === 'big'),
    quick: todos.filter(t => !t.done && t.section === 'quick'),
    later: todos.filter(t => !t.done && t.section === 'later'),
  };
  const doneToday = todos.filter(t => t.done);
  const totalActive = bySection.big.length + bySection.quick.length + bySection.later.length;

  const handleToggle = (t) => {
    if (!t.done) {
      // About to mark done — celebrate
      const msg = CELEBRATIONS[Math.floor(Math.random() * CELEBRATIONS.length)];
      setCelebration(msg);
      setTimeout(() => setCelebration(null), 1800);
    }
    toggleTodoDone(t.id);
  };

  return (
    <>
      <SectionHeader
        title="To-Do"
        subtitle="Designed for ADHD brains. Pick your Big 3, get quick wins, let Later stay out of sight."
      />

      {/* Stats strip */}
      <div style={{
        display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:8,
        marginBottom:18,
      }}>
        <StatMini P={P} icon="🎯" label="Big 3" value={bySection.big.length} />
        <StatMini P={P} icon="⚡" label="Quick" value={bySection.quick.length} />
        <StatMini P={P} icon="📋" label="Later" value={bySection.later.length} />
        <StatMini P={P} icon="✓"  label="Done"  value={doneToday.length} accent />
      </div>

      {/* Empty state */}
      {totalActive === 0 && doneToday.length === 0 && (
        <div style={{
          textAlign:'center', padding:'30px 20px',
          border:`1px dashed ${P.border}`, borderRadius:12,
          color:P.taupe, fontSize:'0.85rem', lineHeight:1.6,
          marginBottom:16,
        }}>
          Your list is clear. <br/>
          Start by adding one <strong style={{ color:P.accent }}>Big 3</strong> task — just one — to anchor your day.
        </div>
      )}

      {/* Big 3 */}
      <TodoSection
        section="big"
        title={SECTIONS.big.label}
        subtitle={SECTIONS.big.desc}
        items={bySection.big}
        cap={SECTIONS.big.cap}
        onAdd={() => addTodo('big')}
        onToggle={handleToggle}
        onUpdate={updateTodo}
        onDelete={deleteTodo}
        onMove={moveTodoToSection}
        editingCell={editingCell}
        setEditingCell={setEditingCell}
        highlight
      />

      {/* Quick Wins */}
      <TodoSection
        section="quick"
        title={SECTIONS.quick.label}
        subtitle={SECTIONS.quick.desc}
        items={bySection.quick}
        cap={SECTIONS.quick.cap}
        onAdd={() => addTodo('quick')}
        onToggle={handleToggle}
        onUpdate={updateTodo}
        onDelete={deleteTodo}
        onMove={moveTodoToSection}
        editingCell={editingCell}
        setEditingCell={setEditingCell}
      />

      {/* Later */}
      <TodoSection
        section="later"
        title={SECTIONS.later.label}
        subtitle={SECTIONS.later.desc}
        items={bySection.later}
        cap={SECTIONS.later.cap}
        onAdd={() => addTodo('later')}
        onToggle={handleToggle}
        onUpdate={updateTodo}
        onDelete={deleteTodo}
        onMove={moveTodoToSection}
        editingCell={editingCell}
        setEditingCell={setEditingCell}
        collapsible
      />

      {/* Done Today */}
      {doneToday.length > 0 && (
        <div style={{ marginTop:24 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:8 }}>
            <div>
              <div style={{ fontFamily:SERIF, fontSize:'1rem', color:P.cream }}>
                ✨ Done Today ({doneToday.length})
              </div>
              <div style={{ fontSize:'0.72rem', color:P.taupe, marginTop:2 }}>
                Every check is a win worth celebrating.
              </div>
            </div>
            <button onClick={clearDoneTodos} style={{
              background:'transparent', border:'none', color:P.taupe,
              cursor:'pointer', fontSize:'0.72rem', fontFamily:SANS,
            }}>Clear</button>
          </div>
          <div style={{ display:'grid', gap:6 }}>
            {doneToday.map(t => (
              <div key={t.id} style={{
                display:'flex', alignItems:'center', gap:10,
                padding:'8px 12px',
                background:`linear-gradient(90deg, ${P.paidBg}, transparent)`,
                border:`1px solid ${P.borderL}`,
                borderRadius:10,
              }}>
                <button onClick={() => handleToggle(t)} style={{
                  width:22, height:22, borderRadius:'50%',
                  background:P.olive, border:'none', color:P.bg,
                  cursor:'pointer', fontSize:'0.75rem', fontWeight:700,
                  display:'inline-flex', alignItems:'center', justifyContent:'center',
                  flexShrink:0,
                }}>✓</button>
                <span style={{ flex:1, fontSize:'0.84rem', color:P.paidTxt, textDecoration:'line-through' }}>
                  {t.title || '(untitled)'}
                </span>
                <button onClick={() => deleteTodo(t.id)} style={{
                  background:'transparent', border:'none', color:P.taupe,
                  cursor:'pointer', fontSize:'0.95rem', padding:4, opacity:0.5,
                }}>×</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Celebration toast */}
      {celebration && (
        <div style={{
          position:'fixed', bottom:40, left:'50%', transform:'translateX(-50%)',
          background:`linear-gradient(135deg, ${P.accent}, ${P.accent2})`,
          color:P.bg, padding:'12px 24px', borderRadius:999,
          fontFamily:SERIF, fontSize:'0.95rem', fontWeight:600,
          boxShadow:'0 8px 32px rgba(0,0,0,0.25)',
          zIndex:50,
          animation:'celebrateIn 0.35s cubic-bezier(.2,.9,.3,1.3) both',
          pointerEvents:'none',
        }}>
          🌿 {celebration}
        </div>
      )}

      {/* keyframes injected once */}
      <style>{`
        @keyframes celebrateIn {
          0%   { opacity:0; transform:translateX(-50%) translateY(20px) scale(0.8); }
          60%  { opacity:1; transform:translateX(-50%) translateY(-4px) scale(1.05); }
          100% { opacity:1; transform:translateX(-50%) translateY(0) scale(1); }
        }
        @keyframes todoFade { from { opacity:0; transform:translateY(-4px); } to { opacity:1; transform:none; } }
      `}</style>
    </>
  );
}

/* ── Small stat box for todo header ── */
function StatMini({ P, icon, label, value, accent }) {
  return (
    <div style={{
      background:P.panel, border:`1px solid ${P.border}`,
      borderRadius:10, padding:'10px 8px', textAlign:'center',
    }}>
      <div style={{ fontSize:'1.1rem', marginBottom:2 }}>{icon}</div>
      <div style={{
        fontFamily:SERIF, fontSize:'1.15rem',
        color: accent ? P.accent : P.cream, lineHeight:1,
      }}>{value}</div>
      <div style={{ fontSize:'0.6rem', color:P.taupe, marginTop:4, letterSpacing:'0.08em' }}>
        {label}
      </div>
    </div>
  );
}

/* ── Todo section (Big 3 / Quick / Later) ── */
function TodoSection({ section, title, subtitle, items, cap, onAdd, onToggle, onUpdate, onDelete, onMove, editingCell, setEditingCell, highlight, collapsible }) {
  const P = useP();
  const [open, setOpen] = useState(!collapsible);
  const atCap = items.length >= cap;

  return (
    <div style={{
      marginBottom:20,
      background: highlight ? `linear-gradient(135deg, ${P.head}, transparent)` : 'transparent',
      border: highlight ? `1px solid ${P.border}` : 'none',
      borderRadius: highlight ? 14 : 0,
      padding: highlight ? '14px 14px 12px' : 0,
    }}>
      <button onClick={() => collapsible && setOpen(!open)} style={{
        display:'flex', justifyContent:'space-between', alignItems:'flex-start',
        width:'100%', background:'transparent', border:'none', color:P.cream,
        padding:0, cursor: collapsible ? 'pointer' : 'default',
        textAlign:'left', marginBottom:10,
      }}>
        <div>
          <div style={{ fontFamily:SERIF, fontSize:'1rem', color:P.cream }}>
            {title} <span style={{ color:P.taupe, fontSize:'0.82rem' }}>({items.length}{cap < 99 ? `/${cap}` : ''})</span>
          </div>
          <div style={{ fontSize:'0.72rem', color:P.taupe, marginTop:2, lineHeight:1.5 }}>
            {subtitle}
          </div>
        </div>
        {collapsible && (
          <span style={{ color:P.taupe, fontSize:'0.9rem' }}>{open ? '▴' : '▾'}</span>
        )}
      </button>

      {open && (
        <>
          <div style={{ display:'grid', gap:6 }}>
            {items.map(t => (
              <TodoItem
                key={t.id} todo={t}
                onToggle={() => onToggle(t)}
                onUpdate={onUpdate}
                onDelete={() => onDelete(t.id)}
                onMove={onMove}
                editingCell={editingCell}
                setEditingCell={setEditingCell}
              />
            ))}
          </div>
          {!atCap && (
            <button onClick={onAdd} style={{
              marginTop: items.length > 0 ? 8 : 0,
              width:'100%', padding:'10px',
              background:'transparent', border:`1px dashed ${P.border}`,
              borderRadius:10, color:P.taupe,
              cursor:'pointer', fontFamily:SANS, fontSize:'0.78rem',
              transition:'all 0.2s',
            }}>+ Add a {section === 'big' ? 'Big 3 task' : section === 'quick' ? 'quick win' : 'task for later'}</button>
          )}
          {atCap && section === 'big' && (
            <div style={{
              marginTop:8, padding:'8px 12px',
              background:P.borderL, borderRadius:8,
              fontSize:'0.72rem', color:P.taupe, fontStyle:'italic', textAlign:'center',
            }}>
              3 is enough. Do these first.
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ── Individual todo item ── */
function TodoItem({ todo, onToggle, onUpdate, onDelete, onMove, editingCell, setEditingCell }) {
  const P = useP();
  const [showOptions, setShowOptions] = useState(false);
  const prio = TODO_PRIORITIES[todo.priority] || TODO_PRIORITIES.should;
  const energy = TODO_ENERGIES[todo.energy] || TODO_ENERGIES.med;
  const cellKey = `${todo.id}:title`;
  const isEditing = editingCell === cellKey;

  return (
    <div style={{
      background:P.panel, border:`1px solid ${P.border}`,
      borderRadius:10, overflow:'hidden',
      animation:'todoFade 0.3s ease',
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px' }}>
        <button onClick={onToggle} style={{
          width:22, height:22, borderRadius:'50%',
          background:'transparent', border:`2px solid ${P.taupe}`,
          cursor:'pointer', fontSize:'0.75rem',
          display:'inline-flex', alignItems:'center', justifyContent:'center',
          flexShrink:0, transition:'all 0.15s',
        }} onMouseEnter={e => e.currentTarget.style.borderColor = P.accent}
           onMouseLeave={e => e.currentTarget.style.borderColor = P.taupe} />

        <div style={{ flex:1, minWidth:0 }}>
          {isEditing ? (
            <input
              autoFocus
              value={todo.title || ''}
              onChange={e => onUpdate(todo.id, 'title', e.target.value)}
              onBlur={() => setEditingCell(null)}
              onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); }}
              placeholder="What needs to happen?"
              style={{
                width:'100%', background:'transparent', border:'none',
                color:P.cream, fontFamily:SANS, fontSize:'0.88rem',
                outline:'none', padding:0,
              }}
            />
          ) : (
            <div onClick={() => setEditingCell(cellKey)} style={{
              fontSize:'0.88rem', color: todo.title ? P.cream : P.taupe,
              cursor:'text', fontStyle: todo.title ? 'normal' : 'italic',
            }}>{todo.title || 'Tap to name this task…'}</div>
          )}
          <div style={{ display:'flex', gap:10, marginTop:4, fontSize:'0.7rem', color:P.taupe, flexWrap:'wrap' }}>
            <span style={{ color: prio.color }}>{prio.emoji} {prio.label}</span>
            <span>{energy.emoji} {energy.label} energy</span>
            <span>⏱ {todo.minutes}min</span>
          </div>
        </div>

        <button onClick={() => setShowOptions(!showOptions)} style={{
          background:'transparent', border:'none', color:P.taupe,
          cursor:'pointer', fontSize:'1.1rem', padding:4, opacity:0.6,
        }}>{showOptions ? '×' : '⋯'}</button>
      </div>

      {showOptions && (
        <div style={{
          padding:'4px 12px 12px',
          borderTop:`1px solid ${P.borderL}`,
          display:'flex', flexDirection:'column', gap:10,
        }}>
          {/* Priority */}
          <div>
            <div style={{ fontSize:'0.66rem', color:P.taupe, letterSpacing:'0.08em', marginBottom:4 }}>PRIORITY</div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {Object.entries(TODO_PRIORITIES).map(([k, v]) => (
                <button key={k} onClick={() => onUpdate(todo.id, 'priority', k)} style={{
                  padding:'5px 10px', borderRadius:6,
                  background: todo.priority === k ? v.color + '33' : 'transparent',
                  border: `1px solid ${todo.priority === k ? v.color : P.border}`,
                  color: todo.priority === k ? v.color : P.taupe,
                  cursor:'pointer', fontSize:'0.72rem', fontFamily:SANS,
                }}>{v.emoji} {v.label}</button>
              ))}
            </div>
          </div>
          {/* Energy */}
          <div>
            <div style={{ fontSize:'0.66rem', color:P.taupe, letterSpacing:'0.08em', marginBottom:4 }}>ENERGY NEEDED</div>
            <div style={{ display:'flex', gap:6 }}>
              {Object.entries(TODO_ENERGIES).map(([k, v]) => (
                <button key={k} onClick={() => onUpdate(todo.id, 'energy', k)} style={{
                  padding:'5px 10px', borderRadius:6, flex:1,
                  background: todo.energy === k ? P.head : 'transparent',
                  border: `1px solid ${todo.energy === k ? P.accent : P.border}`,
                  color: todo.energy === k ? P.cream : P.taupe,
                  cursor:'pointer', fontSize:'0.72rem', fontFamily:SANS,
                }}>{v.emoji} {v.label}</button>
              ))}
            </div>
          </div>
          {/* Time */}
          <div>
            <div style={{ fontSize:'0.66rem', color:P.taupe, letterSpacing:'0.08em', marginBottom:4 }}>TIME ESTIMATE</div>
            <div style={{ display:'flex', gap:6 }}>
              {TODO_TIMES.map(m => (
                <button key={m} onClick={() => onUpdate(todo.id, 'minutes', m)} style={{
                  padding:'5px 10px', borderRadius:6, flex:1,
                  background: todo.minutes === m ? P.head : 'transparent',
                  border: `1px solid ${todo.minutes === m ? P.accent : P.border}`,
                  color: todo.minutes === m ? P.cream : P.taupe,
                  cursor:'pointer', fontSize:'0.72rem', fontFamily:SANS,
                }}>{m < 60 ? `${m}m` : `${m/60}h`}</button>
              ))}
            </div>
          </div>
          {/* Move + delete */}
          <div>
            <div style={{ fontSize:'0.66rem', color:P.taupe, letterSpacing:'0.08em', marginBottom:4 }}>MOVE TO</div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {Object.entries(SECTIONS).filter(([k]) => k !== todo.section).map(([k, v]) => (
                <button key={k} onClick={() => onMove(todo.id, k)} style={{
                  padding:'5px 10px', borderRadius:6,
                  background:'transparent', border:`1px solid ${P.border}`,
                  color:P.taupe, cursor:'pointer', fontSize:'0.72rem', fontFamily:SANS,
                }}>→ {v.label}</button>
              ))}
              <button onClick={onDelete} style={{
                padding:'5px 10px', borderRadius:6, marginLeft:'auto',
                background:'transparent', border:`1px solid ${P.border}`,
                color:P.taupe, cursor:'pointer', fontSize:'0.72rem', fontFamily:SANS,
              }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   HOW-TO TAB
═══════════════════════════════════════════════════════════════ */
function HowToTab() {
  const P = useP();
  const items = [
    { t:'The Tabs',        b:'Five tabs at the top: To-Do, Monthly Bills, Savings Goals, Spending Tracker, and this How-To page.' },
    { t:'To-Do (ADHD-friendly)', b:"Pick 1–3 tasks as your 'Big 3' for the day — that's your anchor. Quick Wins (5–15 min) give dopamine hits. Later is the backlog that stays out of sight. Each task has a priority (🔥/💛/💙), energy level (🌿/🌸/⚡), and time estimate. Completed tasks move to Done Today with a small celebration. At midnight the Done list rolls over so you start fresh." },
    { t:'Your Garden',     b:"The flowers aren't pictures — they respond to your numbers. 🌸 = done. 🤍 = not yet. As you mark bills paid or add saved money, the garden blooms." },
    { t:'Monthly Bills',   b:"Type your real bills over the sample ones. Fill in Amount. When you pay a bill, tap the Paid? checkbox — the row turns green and a flower blooms in your garden." },
    { t:'Monthly Reset',   b:"On the first of each new month, tap 'Reset All Paid' to replant your garden for the new month. 🌱" },
    { t:'Savings Goals',   b:'Each goal has a target and a saved amount. As you save, update the Saved So Far field — the garden bar fills up and the stage changes from 🌱 seedling all the way to 🎉 goal reached. Goals that hit 100% turn gold.' },
    { t:'Spending',        b:'Any one-off purchase (gas, groceries, etc.) goes on the Spending Tracker tab. Totals add themselves up automatically.' },
    { t:'Sunday Habit',    b:'Pick one time each Sunday — even just 10 minutes — to open this and update it. That is the whole secret to staying consistent.' },
    { t:'If It Breaks',    b:"Nothing will actually break. Just type over whatever looks wrong. If a garden ever looks empty, check that the target isn't zero. 🌸" },
  ];
  return (
    <>
      <SectionHeader title="How to Use Your Trackers" subtitle="A gentle, sustainable rhythm. No shame. No spreadsheet stress." />
      <div style={{ display:'grid', gap:10 }}>
        {items.map((it, i) => (
          <div key={i} style={{
            background:P.panel,
            border:`1px solid ${P.border}`,
            borderRadius:12,
            padding:'14px 16px',
          }}>
            <div style={{ fontFamily:SERIF, fontSize:'0.98rem', color:P.cream, marginBottom:4 }}>{it.t}</div>
            <div style={{ fontSize:'0.82rem', color:P.taupe, lineHeight:1.5 }}>{it.b}</div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SHARED SUB-COMPONENTS
═══════════════════════════════════════════════════════════════ */
function SectionHeader({ title, subtitle }) {
  const P = useP();
  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ fontFamily:SERIF, fontSize:'1.25rem', color:P.cream, marginBottom:4 }}>{title}</div>
      <div style={{ fontSize:'0.78rem', color:P.taupe, lineHeight:1.5 }}>{subtitle}</div>
    </div>
  );
}

function SummaryCard({ children, style }) {
  const P = useP();
  return (
    <div style={{
      background:P.panel,
      border:`1px solid ${P.border}`,
      borderRadius:12,
      padding:'14px 16px',
      ...style,
    }}>{children}</div>
  );
}

function StatRow({ label, value, accent }) {
  const P = useP();
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', padding:'3px 0', fontSize:'0.82rem' }}>
      <span style={{ color:P.taupe }}>{label}</span>
      <span style={{ color: accent || P.cream, fontWeight: accent ? 600 : 400 }}>{value}</span>
    </div>
  );
}

function StatBlock({ label, value, accent }) {
  const P = useP();
  return (
    <div>
      <div style={{ fontSize:'0.66rem', color:P.taupe, letterSpacing:'0.08em', marginBottom:2 }}>{label}</div>
      <div style={{ fontFamily:SERIF, fontSize:'1.1rem', color: accent || P.cream }}>{value}</div>
    </div>
  );
}

function ActionBtn({ children, onClick, variant }) {
  const P = useP();
  const ghost = variant === 'ghost';
  return (
    <button onClick={onClick} style={{
      background: ghost ? 'transparent' : `linear-gradient(135deg, ${P.accent}, ${P.accent2})`,
      border: ghost ? `1px solid ${P.border}` : 'none',
      color: ghost ? P.taupe : P.bg,
      padding:'9px 16px',
      borderRadius:10,
      cursor:'pointer',
      fontFamily:SANS,
      fontSize:'0.78rem',
      letterSpacing:'0.04em',
      fontWeight: ghost ? 400 : 600,
    }}>{children}</button>
  );
}

function RowDelete({ onClick }) {
  const P = useP();
  return (
    <button className="row-delete" onClick={onClick} style={{
      background:'transparent', border:'none', color:P.taupe,
      cursor:'pointer', fontSize:'1rem', padding:'8px', opacity:0.5,
    }}>×</button>
  );
}

function SheetTable({ columns, rows, renderCell, rowStyle, footer }) {
  const P = useP();
  return (
    <div style={{
      background:P.panel,
      border:`1px solid ${P.border}`,
      borderRadius:12,
      overflow:'auto',
      WebkitOverflowScrolling:'touch',
    }}>
      <table style={{
        width:'100%', minWidth:640,
        borderCollapse:'collapse',
        fontFamily:SANS,
      }}>
        <colgroup>
          {columns.map(c => <col key={c.key} style={{ width:c.width }} />)}
        </colgroup>
        <thead>
          <tr style={{ background:P.head }}>
            {columns.map(c => (
              <th key={c.key} style={{
                padding:'10px 12px', textAlign:'left',
                fontSize:'0.7rem', letterSpacing:'0.08em',
                color:P.taupe, fontWeight:500,
                borderBottom:`1px solid ${P.border}`,
              }}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => {
            const rs = rowStyle ? rowStyle(row) : {};
            return (
              <tr key={row.id} style={{ borderBottom:`1px solid ${P.borderL}`, ...rs }}>
                {columns.map(c => (
                  <td key={c.key} style={{ padding:0, verticalAlign:'middle' }}>
                    {renderCell(row, c)}
                  </td>
                ))}
              </tr>
            );
          })}
          {footer}
        </tbody>
      </table>
    </div>
  );
}
