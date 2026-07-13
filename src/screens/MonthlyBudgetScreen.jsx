import { useState, useMemo } from 'react';
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
  sage: '#B8D4A8',
  sageB: 'rgba(154,170,138,0.5)',
  rose: '#E8A0A0',
};

const BUDGET_XLSX = '/inner-room-monthly-budget.xlsx';

/* ── seed / defaults ─────────────────────────────────────────── */
let _rid = 0;
const rid = () => `r${Date.now().toString(36)}${(_rid++).toString(36)}`;
const row = (category, planned = 0, actual = 0) => ({ id: rid(), category, planned, actual });

function defaultBudget() {
  return {
    startingBalance: 0,
    savingsGoal: 500,
    income: [
      row('Paycheck'),
      row('Other'),
    ],
    expenses: [
      row('Giving'),
      row('Home'),
      row('Electric'),
      row('Water'),
      row('Wifi'),
      row('Phone'),
      row('Car Payment'),
      row('Car Insurance'),
    ],
  };
}

/* ── helpers ─────────────────────────────────────────────────── */
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const money = (n) => {
  const v = Math.round(num(n));
  return (v < 0 ? '-$' : '$') + Math.abs(v).toLocaleString('en-US');
};
const diffLabel = (n) => (n === 0 ? '$0' : (n > 0 ? '+' : '-') + '$' + Math.abs(Math.round(n)).toLocaleString('en-US'));
const sum = (rows, key) => rows.reduce((s, r) => s + num(r[key]), 0);

/* ── month helpers ───────────────────────────────────────────── */
const pad2 = (n) => String(n).padStart(2, '0');
const monthKeyOf = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
const thisMonthKey = () => monthKeyOf(new Date());
const monthLabel = (key) => {
  const [y, m] = (key || thisMonthKey()).split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};
const shiftMonth = (key, delta) => {
  const [y, m] = key.split('-').map(Number);
  return monthKeyOf(new Date(y, m - 1 + delta, 1));
};

/* Migrate any stored shape into { activeMonth, months:{ [key]: monthData } }. */
function migrateBudget(budget) {
  const k = thisMonthKey();
  if (!budget) return { activeMonth: k, months: { [k]: defaultBudget() } };
  if (budget.months) {
    const active = budget.activeMonth && budget.months[budget.activeMonth] ? budget.activeMonth
      : Object.keys(budget.months).sort().slice(-1)[0] || k;
    return { ...budget, activeMonth: active };
  }
  // Old single-budget object → wrap into the current month.
  const { startingBalance = 0, savingsGoal = 500, income = [], expenses = [] } = budget;
  return { activeMonth: k, months: { [k]: { startingBalance, savingsGoal, income, expenses } } };
}

/* Seed a brand-new month from the nearest earlier month (carry category names,
   zero the amounts, carry the prior end balance forward), else defaults. */
function seedMonth(months, key) {
  const earlier = Object.keys(months).filter(k => k < key).sort();
  const template = earlier.length ? months[earlier[earlier.length - 1]]
    : Object.keys(months).sort().slice(-1).map(k => months[k])[0];
  if (!template) return defaultBudget();
  const endBal = num(template.startingBalance) + (sum(template.income, 'actual') - sum(template.expenses, 'actual'));
  const clone = (rows) => rows.map(r => row(r.category));
  return {
    startingBalance: earlier.length ? Math.round(endBal) : 0,
    savingsGoal: num(template.savingsGoal) || 500,
    income: clone(template.income),
    expenses: clone(template.expenses),
  };
}

/* ── CSV export (dependency-free) ────────────────────────────── */
const csvCell = (v) => {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
function monthToRows(key, d) {
  const rows = [];
  rows.push(['Inner Room Journal — Monthly Budget']);
  rows.push([monthLabel(key)]);
  rows.push([]);
  rows.push(['Starting balance', num(d.startingBalance)]);
  rows.push(['Savings goal', num(d.savingsGoal)]);
  rows.push([]);
  rows.push(['Income', 'Planned', 'Actual']);
  d.income.forEach(r => rows.push([r.category, num(r.planned), num(r.actual)]));
  rows.push(['Total income', sum(d.income, 'planned'), sum(d.income, 'actual')]);
  rows.push([]);
  rows.push(['Expenses', 'Planned', 'Actual']);
  d.expenses.forEach(r => rows.push([r.category, num(r.planned), num(r.actual)]));
  rows.push(['Total expenses', sum(d.expenses, 'planned'), sum(d.expenses, 'actual')]);
  rows.push([]);
  const endBal = num(d.startingBalance) + (sum(d.income, 'actual') - sum(d.expenses, 'actual'));
  rows.push(['End balance', Math.round(endBal)]);
  return rows;
}
function downloadCsv(filename, rows) {
  const csv = rows.map(r => r.map(csvCell).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * MonthlyBudgetScreen — a branded, Planned-vs-Actual monthly budget.
 * Mirrors the Google "Monthly Budget" template, re-skinned for Inner Room Journal.
 *
 * Props:
 *   onBack          — leave the budget screen
 *   budget          — persisted { startingBalance, savingsGoal, income:[], expenses:[] } | null
 *   onBudgetChange  — persist (localStorage + Firestore)
 */
export default function MonthlyBudgetScreen({ onBack, budget, onBudgetChange }) {
  const [store, setStore] = useState(() => migrateBudget(budget));
  const activeMonth = store.activeMonth;
  const data = store.months[activeMonth] || defaultBudget();

  const commitStore = (next) => { setStore(next); onBudgetChange && onBudgetChange(next); };
  const commit = (nextData) => commitStore({ ...store, months: { ...store.months, [activeMonth]: nextData } });
  const patch = (fields) => commit({ ...data, ...fields });

  // Switch to another month, creating (seeding) it the first time it's opened.
  const goToMonth = (key) => {
    if (!key) return;
    const months = store.months[key] ? store.months : { ...store.months, [key]: seedMonth(store.months, key) };
    commitStore({ ...store, months, activeMonth: key });
  };

  const savedMonths = Object.keys(store.months).sort();

  const totals = useMemo(() => {
    const incPlanned = sum(data.income, 'planned');
    const incActual = sum(data.income, 'actual');
    const expPlanned = sum(data.expenses, 'planned');
    const expActual = sum(data.expenses, 'actual');
    const savedActual = incActual - expActual;
    const savedPlanned = incPlanned - expPlanned;
    const endBalance = num(data.startingBalance) + savedActual;
    const goal = num(data.savingsGoal);
    const goalPct = goal > 0 ? Math.max(0, Math.min(100, Math.round((savedActual / goal) * 100))) : 0;
    return { incPlanned, incActual, expPlanned, expActual, savedActual, savedPlanned, endBalance, goal, goalPct };
  }, [data]);

  // Row operations
  const setRow = (kind, id, field, value) => {
    const list = data[kind].map(r => r.id === id ? { ...r, [field]: field === 'category' ? value : num(value) } : r);
    patch({ [kind]: list });
  };
  const addRow = (kind) => patch({ [kind]: [...data[kind], row('New category')] });
  const delRow = (kind, id) => patch({ [kind]: data[kind].filter(r => r.id !== id) });

  return (
    <div style={{ minHeight: '100vh', color: P.ink, fontFamily: SANS, position: 'relative', overflow: 'hidden' }}>
      <CottageBackground />
      {/* Readability veil — dims the bright candle glows so numbers stay legible */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: 'rgba(8,6,4,0.6)', pointerEvents: 'none' }} />
      <SoundButton />
      <Header title="Monthly Budget" onBack={onBack} />

      <main style={{ maxWidth: 640, margin: '0 auto', padding: '18px 16px 120px', position: 'relative', zIndex: 1 }}>
        {/* Verse — light touch */}
        <p style={{ fontFamily: SERIF, fontStyle: 'italic', color: P.ink, fontSize: '1.12rem', textAlign: 'center', lineHeight: 1.55, margin: '4px auto 4px', maxWidth: 460 }}>
          “The plans of the diligent lead surely to abundance.”
        </p>
        <p style={{ fontFamily: SANS, fontSize: '0.64rem', color: P.sub, letterSpacing: '0.12em', textTransform: 'uppercase', textAlign: 'center', margin: '0 0 16px' }}>
          Proverbs 21:5
        </p>

        {/* Month selector */}
        <MonthSelector
          activeMonth={activeMonth}
          savedMonths={savedMonths}
          onPrev={() => goToMonth(shiftMonth(activeMonth, -1))}
          onNext={() => goToMonth(shiftMonth(activeMonth, 1))}
          onPick={goToMonth}
        />

        {/* Balance strip */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div style={{ background: P.panel, border: `1px solid ${P.border}`, borderRadius: 14, padding: '13px 15px' }}>
            <div style={{ fontFamily: SANS, fontSize: '0.58rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: P.gold, marginBottom: 6 }}>
              Starting balance
            </div>
            <MoneyInput value={data.startingBalance} onCommit={(v) => patch({ startingBalance: v })} big />
          </div>
          <div style={{ background: 'linear-gradient(160deg, rgba(201,169,110,0.16), rgba(201,169,110,0.05))', border: `1px solid ${P.borderH}`, borderRadius: 14, padding: '13px 15px' }}>
            <div style={{ fontFamily: SANS, fontSize: '0.58rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: P.gold, marginBottom: 6 }}>
              End balance
            </div>
            <div style={{ fontFamily: SERIF, fontStyle: 'italic', color: P.goldL, fontSize: '1.5rem', lineHeight: 1 }}>
              {money(totals.endBalance)}
            </div>
          </div>
        </div>

        {/* Savings card */}
        <div style={{ background: P.panel, border: `1px solid ${P.border}`, borderRadius: 16, padding: '15px 17px', marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12 }}>
            <div>
              <div style={{ fontFamily: SANS, fontSize: '0.58rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: P.gold, marginBottom: 4 }}>
                Saved this month
              </div>
              <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '1.9rem', lineHeight: 1, color: totals.savedActual >= 0 ? P.sage : P.rose }}>
                {money(totals.savedActual)}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: SANS, fontSize: '0.58rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: P.gold, marginBottom: 4 }}>
                Savings goal
              </div>
              <MoneyInput value={data.savingsGoal} onCommit={(v) => patch({ savingsGoal: v })} align="right" />
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 5, overflow: 'hidden' }}>
              <div style={{ width: `${totals.goalPct}%`, height: '100%', background: 'linear-gradient(90deg, #9AAA8A, #B8D4A8)', borderRadius: 5, transition: 'width .35s ease' }} />
            </div>
            <div style={{ fontFamily: SANS, fontSize: '0.62rem', color: P.sub, marginTop: 5 }}>
              {totals.goalPct}% of your {money(totals.goal)} goal
            </div>
          </div>
        </div>

        {/* Tables */}
        <BudgetTable
          title="Income"
          rows={data.income}
          totals={{ planned: totals.incPlanned, actual: totals.incActual }}
          positiveIsGood
          onSet={(id, f, v) => setRow('income', id, f, v)}
          onAdd={() => addRow('income')}
          onDel={(id) => delRow('income', id)}
        />

        <BudgetTable
          title="Expenses"
          rows={data.expenses}
          totals={{ planned: totals.expPlanned, actual: totals.expActual }}
          positiveIsGood={false}
          onSet={(id, f, v) => setRow('expenses', id, f, v)}
          onAdd={() => addRow('expenses')}
          onDel={(id) => delRow('expenses', id)}
        />

        {/* Export */}
        <button
          onClick={() => downloadCsv(`inner-room-budget-${activeMonth}.csv`, monthToRows(activeMonth, data))}
          style={{
            display: 'block', width: '100%', textAlign: 'center', cursor: 'pointer',
            background: 'linear-gradient(160deg, rgba(201,169,110,0.9), rgba(201,169,110,0.7))',
            border: 'none', borderRadius: 12, padding: '14px', marginTop: 24,
            color: '#241B10', fontFamily: SANS, fontSize: '0.86rem', fontWeight: 600, letterSpacing: '0.03em',
          }}
        >
          Export {monthLabel(activeMonth)} (CSV)
        </button>
        {savedMonths.length > 1 && (
          <button
            onClick={() => downloadCsv('inner-room-budget-all-months.csv',
              savedMonths.flatMap((k, i) => [...(i ? [[]] : []), ...monthToRows(k, store.months[k])]))}
            style={{
              display: 'block', width: '100%', textAlign: 'center', cursor: 'pointer',
              background: 'transparent', border: `1px solid ${P.border}`, borderRadius: 12,
              padding: '12px', marginTop: 10, color: P.gold, fontFamily: SANS, fontSize: '0.78rem', letterSpacing: '0.03em',
            }}
          >
            Export all {savedMonths.length} months (CSV)
          </button>
        )}
        <a
          href={BUDGET_XLSX}
          download
          style={{
            display: 'block', textAlign: 'center', textDecoration: 'none',
            background: 'transparent', border: `1px solid ${P.border}`, borderRadius: 12,
            padding: '12px', marginTop: 10,
            color: P.sub, fontFamily: SANS, fontSize: '0.78rem', letterSpacing: '0.03em',
          }}
        >
          Download the blank printable template
        </a>
        <p style={{ fontFamily: SERIF, fontStyle: 'italic', color: P.sub, textAlign: 'center', fontSize: '0.95rem', margin: '14px 0 0' }}>
          You are the caretaker, not the owner.
        </p>
      </main>
    </div>
  );
}

/* ── Month selector ──────────────────────────────────────────── */
function MonthSelector({ activeMonth, savedMonths, onPrev, onNext, onPick }) {
  const chev = {
    background: 'rgba(255,255,255,0.05)', border: `1px solid ${P.border}`, borderRadius: 10,
    color: P.goldL, fontFamily: SERIF, fontSize: '1.25rem', lineHeight: 1, cursor: 'pointer',
    width: 40, height: 40, flexShrink: 0,
  };
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={onPrev} aria-label="Previous month" style={chev}>‹</button>
        <label style={{
          flex: 1, position: 'relative', textAlign: 'center',
          background: 'linear-gradient(160deg, rgba(201,169,110,0.16), rgba(201,169,110,0.05))',
          border: `1px solid ${P.borderH}`, borderRadius: 12, padding: '10px 12px', cursor: 'pointer',
        }}>
          <div style={{ fontFamily: SANS, fontSize: '0.54rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: P.gold, marginBottom: 3 }}>
            Budget month
          </div>
          <div style={{ fontFamily: SERIF, fontStyle: 'italic', color: P.goldL, fontSize: '1.25rem', lineHeight: 1 }}>
            {monthLabel(activeMonth)}
          </div>
          <input
            type="month"
            value={activeMonth}
            onChange={(e) => e.target.value && onPick(e.target.value)}
            aria-label="Pick a budget month"
            style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
          />
        </label>
        <button onClick={onNext} aria-label="Next month" style={chev}>›</button>
      </div>
      {savedMonths.length > 1 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginTop: 10 }}>
          {savedMonths.map(k => (
            <button
              key={k}
              onClick={() => onPick(k)}
              style={{
                background: k === activeMonth ? 'rgba(201,169,110,0.22)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${k === activeMonth ? P.borderH : P.border}`, borderRadius: 999,
                padding: '5px 11px', cursor: 'pointer', color: k === activeMonth ? P.goldL : P.sub,
                fontFamily: SANS, fontSize: '0.68rem',
              }}
            >
              {monthLabel(k)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Table ───────────────────────────────────────────────────── */
function BudgetTable({ title, rows, totals, positiveIsGood, onSet, onAdd, onDel }) {
  const totalDiff = totals.actual - totals.planned;
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '0 4px 8px' }}>
        <h2 style={{ fontFamily: SERIF, fontStyle: 'italic', color: P.goldL, fontSize: '1.35rem', margin: 0 }}>{title}</h2>
        <span style={{ fontFamily: SANS, fontSize: '0.62rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: P.sub }}>
          Planned · Actual · Diff
        </span>
      </div>

      <div style={{ background: P.panel, border: `1px solid ${P.border}`, borderRadius: 14, overflow: 'hidden' }}>
        {/* header row */}
        <Grid header>
          <span>Category</span>
          <span style={{ textAlign: 'right' }}>Planned</span>
          <span style={{ textAlign: 'right' }}>Actual</span>
          <span style={{ textAlign: 'right' }}>Diff</span>
          <span />
        </Grid>

        {rows.map(r => {
          const d = num(r.actual) - num(r.planned);
          const good = positiveIsGood ? d >= 0 : d <= 0;
          return (
            <Grid key={r.id}>
              <TextInput value={r.category} onCommit={(v) => onSet(r.id, 'category', v)} />
              <MoneyInput value={r.planned} onCommit={(v) => onSet(r.id, 'planned', v)} align="right" compact />
              <MoneyInput value={r.actual} onCommit={(v) => onSet(r.id, 'actual', v)} align="right" compact />
              <span style={{ textAlign: 'right', fontFamily: SANS, fontSize: '0.78rem', color: d === 0 ? P.sub : (good ? P.sage : P.rose) }}>
                {diffLabel(d)}
              </span>
              <button onClick={() => onDel(r.id)} aria-label="Remove row" style={delBtn}>×</button>
            </Grid>
          );
        })}

        {/* totals */}
        <Grid total>
          <span style={{ fontFamily: SERIF, fontStyle: 'italic', color: P.goldL, fontSize: '1.02rem' }}>Totals</span>
          <span style={{ textAlign: 'right', fontFamily: SANS, fontWeight: 600, fontSize: '0.82rem', color: P.goldL }}>{money(totals.planned)}</span>
          <span style={{ textAlign: 'right', fontFamily: SANS, fontWeight: 600, fontSize: '0.82rem', color: P.goldL }}>{money(totals.actual)}</span>
          <span style={{ textAlign: 'right', fontFamily: SANS, fontWeight: 600, fontSize: '0.82rem', color: totalDiff === 0 ? P.sub : ((positiveIsGood ? totalDiff >= 0 : totalDiff <= 0) ? P.sage : P.rose) }}>{diffLabel(totalDiff)}</span>
          <span />
        </Grid>
      </div>

      <button onClick={onAdd} style={{ marginTop: 8, background: 'transparent', border: `1px dashed ${P.border}`, borderRadius: 10, padding: '9px', width: '100%', cursor: 'pointer', color: P.gold, fontFamily: SANS, fontSize: '0.74rem', letterSpacing: '0.04em' }}>
        + Add {title.toLowerCase()} category
      </button>
    </div>
  );
}

function Grid({ children, header, total }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 66px 66px 60px 22px',
      alignItems: 'center', gap: 6,
      padding: header ? '9px 12px' : '5px 12px',
      borderBottom: total ? 'none' : `1px solid rgba(201,169,110,0.09)`,
      borderTop: total ? `1px solid ${P.border}` : 'none',
      background: total ? 'rgba(201,169,110,0.06)' : header ? 'rgba(255,255,255,0.02)' : 'transparent',
      fontFamily: SANS,
      fontSize: header ? '0.58rem' : '0.8rem',
      letterSpacing: header ? '0.12em' : 'normal',
      textTransform: header ? 'uppercase' : 'none',
      color: header ? P.gold : P.ink,
    }}>
      {children}
    </div>
  );
}

/* ── inputs ──────────────────────────────────────────────────── */
function TextInput({ value, onCommit }) {
  const [v, setV] = useState(value);
  return (
    <input
      value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => v !== value && onCommit(v)}
      onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
      style={{
        background: 'transparent', border: 'none', borderBottom: '1px solid transparent',
        color: P.ink, fontFamily: SANS, fontSize: '0.8rem', width: '100%', padding: '4px 0', outline: 'none',
      }}
      onFocus={(e) => (e.target.style.borderBottomColor = P.border)}
    />
  );
}

function MoneyInput({ value, onCommit, align = 'left', big = false, compact = false }) {
  const [editing, setEditing] = useState(false);
  const [v, setV] = useState(String(value ?? 0));
  const fontSize = big ? '1.5rem' : compact ? '0.8rem' : '1.05rem';

  if (!editing) {
    return (
      <button
        onClick={() => { setV(String(num(value))); setEditing(true); }}
        style={{
          background: 'transparent', border: 'none', cursor: 'text', padding: compact ? '4px 0' : '0',
          width: '100%', textAlign: align,
          fontFamily: big || !compact ? SERIF : SANS, fontStyle: big || !compact ? 'italic' : 'normal',
          fontSize, color: big ? P.goldL : P.ink, lineHeight: 1,
        }}
      >
        {money(value)}
      </button>
    );
  }
  return (
    <input
      autoFocus
      type="number"
      inputMode="decimal"
      value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => { onCommit(num(v)); setEditing(false); }}
      onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
      style={{
        background: 'rgba(255,255,255,0.06)', border: `1px solid ${P.borderH}`, borderRadius: 6,
        color: P.ink, fontFamily: SANS, fontSize: compact ? '0.8rem' : '0.95rem',
        width: '100%', padding: '4px 6px', outline: 'none', textAlign: align,
      }}
    />
  );
}

const delBtn = {
  background: 'transparent', border: 'none', cursor: 'pointer',
  color: 'rgba(232,160,160,0.55)', fontSize: '1.1rem', lineHeight: 1, padding: 0,
  width: 22, textAlign: 'center',
};

/* ── header (matches FinanceScreen) ──────────────────────────── */
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
