import { useState, useMemo, useCallback } from 'react';
import { SERIF, SANS } from '../constants.js';

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

// ── Palette (matches app aesthetic) ──
const P = {
  bg:      '#1A1612',
  panel:   'rgba(26,22,18,0.92)',
  cream:   '#FAF6F0',
  brown:   '#3A2E28',
  taupe:   '#8A7A70',
  gold:    '#C9A96E',
  rose:    '#D4A0A0',
  olive:   '#9AAA8A',
  border:  'rgba(201,169,110,0.22)',
  borderL: 'rgba(201,169,110,0.1)',
  paidBg:  'rgba(154,170,138,0.18)',
  paidTxt: '#B8D4A8',
  head:    'rgba(201,169,110,0.12)',
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
  };
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

  const update = useCallback((next) => {
    onProgressChange({ ...state, ...next });
  }, [state, onProgressChange]);

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
    const bills = state.bills.map(b => ({ ...b, paid:false }));
    update({ bills, lastReset: new Date().toISOString().slice(0,7) });
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

  return (
    <div style={{
      minHeight:'100vh',
      background:'linear-gradient(180deg, #1A1612 0%, #14100C 100%)',
      color:P.cream,
      fontFamily:SANS,
      paddingBottom:80,
    }}>
      {/* ── Top bar ── */}
      <div style={{
        position:'sticky', top:0, zIndex:20,
        background:'rgba(20,16,12,0.95)',
        borderBottom:`1px solid ${P.border}`,
        backdropFilter:'blur(10px)',
      }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px' }}>
          <button onClick={onBack} style={{
            background:'transparent', border:`1px solid ${P.border}`, color:P.taupe,
            padding:'6px 12px', borderRadius:8, cursor:'pointer', fontFamily:SANS, fontSize:'0.78rem',
          }}>← Back</button>
          <div style={{ fontFamily:SERIF, fontSize:'1.05rem', color:P.cream, letterSpacing:'0.03em' }}>
            🌷 Trackers
          </div>
          <div style={{ width:60 }} />
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:0, borderTop:`1px solid ${P.borderL}`, overflowX:'auto' }}>
          {[
            { id:'bills',    label:'Monthly Bills',    icon:'💌' },
            { id:'goals',    label:'Savings Goals',    icon:'🌷' },
            { id:'spending', label:'Spending',         icon:'✨' },
            { id:'howto',    label:'How to Use',       icon:'💗' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex:1, minWidth:100,
              background: tab === t.id ? P.head : 'transparent',
              border:'none',
              borderBottom: tab === t.id ? `2px solid ${P.gold}` : `2px solid transparent`,
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
          />
        )}

        {tab === 'howto' && <HowToTab />}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CELL (editable)
═══════════════════════════════════════════════════════════════ */
function Cell({ value, onChange, type='text', format='auto', options, placeholder='', editing, onEdit, onBlur, style = {}, readOnly = false }) {
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
          border:`1.5px solid ${P.gold}`,
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
function BillsTab({ bills, calc, editingCell, setEditingCell, updateBill, addBill, deleteBill, resetMonth, lastReset }) {
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
          <StatRow label="% Done"       value={pct(calc.ratio)} accent={P.gold} />
        </SummaryCard>

        <SummaryCard>
          <div style={{ fontSize:'0.72rem', color:P.taupe, letterSpacing:'0.08em', marginBottom:6 }}>🌷 YOUR GARDEN</div>
          <div style={{ fontSize:'1.25rem', letterSpacing:'0.1em', lineHeight:1.5, marginBottom:10 }}>
            {bloomRow(calc.ratio, '🌸','🤍', 10)}
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
            <td style={{ padding:'10px 12px', color:P.gold, fontWeight:600, fontSize:'0.82rem' }}>{money(calc.totalBills)}</td>
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
          Last reset: {lastReset}
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   GOALS TAB
═══════════════════════════════════════════════════════════════ */
function GoalsTab({ goals, calc, editingCell, setEditingCell, updateGoal, addGoal, deleteGoal }) {
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
          <StatBlock label="% to Total"    value={pct(calc.ratio)}    accent={P.gold} />
        </div>
      </SummaryCard>

      {/* Goals as cards (each with its own garden bar) */}
      {goals.map(g => {
        const ratio = (Number(g.target)||0) > 0 ? (Number(g.saved)||0) / g.target : 0;
        const done = ratio >= 1;
        return (
          <div key={g.id} style={{
            background: done ? 'linear-gradient(135deg, rgba(201,169,110,0.18), rgba(201,169,110,0.08))' : P.panel,
            border:`1px solid ${done ? P.gold : P.border}`,
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
                background: done ? P.gold : `linear-gradient(90deg, ${P.olive}, ${P.gold})`,
                transition:'width 0.3s',
              }} />
            </div>

            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:'0.78rem' }}>
              <span style={{ color: done ? P.gold : P.cream }}>{goalStage(ratio)}</span>
              <span style={{ color:P.taupe }}>{pct(ratio)}</span>
            </div>

            <div style={{ fontSize:'1rem', letterSpacing:'0.08em', marginTop:8, lineHeight:1.3 }}>
              {bloomRow(ratio, '🌷','🤍', 10)}
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
function SpendingTab({ spending, calc, editingCell, setEditingCell, updateSpend, addSpend, deleteSpend }) {
  return (
    <>
      <SectionHeader
        title="Spending Tracker"
        subtitle="Jot down anything you spend that isn't a regular monthly bill."
      />

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
        <SummaryCard>
          <div style={{ fontSize:'0.72rem', color:P.taupe, letterSpacing:'0.08em', marginBottom:6 }}>TOTAL SPENT</div>
          <div style={{ fontFamily:SERIF, fontSize:'1.6rem', color:P.gold }}>{money(calc.total)}</div>
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
                  <span style={{ color:P.gold }}>{money(amt)}</span>
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
              <td style={{ padding:'10px 12px', color:P.gold, fontWeight:600, fontSize:'0.82rem' }}>{money(calc.total)}</td>
              <td colSpan={2} />
            </tr>
          }
        />
      )}

      <div style={{ marginTop:14 }}>
        <ActionBtn onClick={addSpend}>+ Add Entry</ActionBtn>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   HOW-TO TAB
═══════════════════════════════════════════════════════════════ */
function HowToTab() {
  const items = [
    { t:'The Tabs',        b:'Four tabs at the top: Monthly Bills, Savings Goals, Spending Tracker, and this How-To page.' },
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
  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ fontFamily:SERIF, fontSize:'1.25rem', color:P.cream, marginBottom:4 }}>{title}</div>
      <div style={{ fontSize:'0.78rem', color:P.taupe, lineHeight:1.5 }}>{subtitle}</div>
    </div>
  );
}

function SummaryCard({ children, style }) {
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
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', padding:'3px 0', fontSize:'0.82rem' }}>
      <span style={{ color:P.taupe }}>{label}</span>
      <span style={{ color: accent || P.cream, fontWeight: accent ? 600 : 400 }}>{value}</span>
    </div>
  );
}

function StatBlock({ label, value, accent }) {
  return (
    <div>
      <div style={{ fontSize:'0.66rem', color:P.taupe, letterSpacing:'0.08em', marginBottom:2 }}>{label}</div>
      <div style={{ fontFamily:SERIF, fontSize:'1.1rem', color: accent || P.cream }}>{value}</div>
    </div>
  );
}

function ActionBtn({ children, onClick, variant }) {
  const ghost = variant === 'ghost';
  return (
    <button onClick={onClick} style={{
      background: ghost ? 'transparent' : `linear-gradient(135deg, ${P.gold}, #B8945A)`,
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
  return (
    <button onClick={onClick} style={{
      background:'transparent', border:'none', color:P.taupe,
      cursor:'pointer', fontSize:'1rem', padding:'8px', opacity:0.5,
    }}>×</button>
  );
}

function SheetTable({ columns, rows, renderCell, rowStyle, footer }) {
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
