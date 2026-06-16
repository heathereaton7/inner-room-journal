import { useState, useEffect } from 'react';
import CottageBackground from '../components/CottageBackground.jsx';
import SoundButton from '../components/SoundButton.jsx';

const SERIF = "'Cormorant Garamond', Georgia, serif";
const SANS = "'Inter', system-ui, -apple-system, sans-serif";

// Warm cabin palette + Leaky Bucket accents
const P = {
  ink: '#FAF6F0',
  sub: 'rgba(232,212,160,0.55)',
  border: 'rgba(201,169,110,0.18)',
  borderH: 'rgba(201,169,110,0.55)',
  gold: '#C9A96E',
  goldL: '#E8D4A0',
  panel: 'rgba(255,255,255,0.04)',
  water: '#5FA8C9',      // clear blue water that fills / leaks
  waterD: '#3C7FA0',
  pewter: '#8C9398',     // galvanized cistern
  pewterD: '#5A6166',
  sage: '#8DA17B',       // sage-green truth plugs
};

/**
 * LeakyBucketScreen — guided journaling experience based on Jeremiah 2:13
 * ("Episode 1 — The Leaky Bucket").
 *
 * Steps (built incrementally):
 *   1  intro      — set up the metaphor, empty cistern, "Fill your bucket"
 *   2  fill       — (coming next)
 *   3  leak       — (coming next)
 *   4  plug       — (coming next)
 *   5  it-holds   — (coming next, saves reflection)
 *
 * Props:
 *   onBack — return to the cabin
 */
// Preset "worth sources" the user can tap to add (they can also type their own)
const PRESET_SOURCES = [
  'Accomplishments', "Others' approval", 'Being needed',
  'Productivity', 'A relationship', 'Likes & follows',
  'My appearance', 'Control',
];

export default function LeakyBucketScreen({ onBack, reflections = [], setReflections }) {
  const [step, setStep] = useState(1);
  // Shared across the whole flow: the "leaky" worth-sources the user names
  const [sources, setSources] = useState([]);
  // Which holes have been sealed with a truth (hole ids)
  const [plugged, setPlugged] = useState([]);

  // Cistern fills as items are added; capped so it never quite reaches the brim
  const fillPct = Math.min(92, sources.length * 16);

  const addSource = (label) => {
    const v = (label || '').trim();
    if (!v) return;
    setSources(prev => prev.some(s => s.toLowerCase() === v.toLowerCase()) ? prev : [...prev, v]);
  };
  const removeSource = (label) => setSources(prev => prev.filter(s => s !== label));
  const plugHole = (id) => setPlugged(prev => prev.includes(id) ? prev : [...prev, id]);

  return (
    <div style={{ minHeight: '100vh', color: P.ink, fontFamily: SANS, position: 'relative', overflow: 'hidden' }}>
      <CottageBackground />
      <SoundButton />
      <Header
        onBack={() => { if (step > 1) setStep(s => s - 1); else onBack(); }}
        title="The Leaky Bucket"
      />

      {step === 1 && <IntroStep onFill={() => setStep(2)} />}

      {step === 2 && (
        <FillStep
          sources={sources}
          fillPct={fillPct}
          onAdd={addSource}
          onRemove={removeSource}
          onContinue={() => setStep(3)}
        />
      )}

      {step === 3 && (
        <LeakStep
          fillPct={fillPct}
          onContinue={() => setStep(4)}
        />
      )}

      {step === 4 && (
        <PlugStep
          plugged={plugged}
          onPlug={plugHole}
          onContinue={() => setStep(5)}
        />
      )}

      {step === 5 && (
        <ItHoldsStep
          sources={sources}
          plugged={plugged}
          reflections={reflections}
          onSave={(entry) => setReflections([entry, ...reflections])}
          onDone={onBack}
        />
      )}
    </div>
  );
}

/* ── Intro (Step 1) ──────────────────────────────────────────── */
function IntroStep({ onFill }) {
  return (
    <div style={{
      position: 'relative', zIndex: 2,
      minHeight: 'calc(100vh - 50px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      textAlign: 'center', padding: '24px 22px 40px', gap: 22,
    }}>
      <div style={{ animation: 'fadeUp .6s ease both' }}>
        <div style={{ fontFamily: SANS, fontSize: '0.62rem', letterSpacing: '0.22em', color: P.sub, textTransform: 'uppercase' }}>
          Episode One
        </div>
        <h1 style={{
          fontFamily: SERIF, fontStyle: 'italic', fontWeight: 600,
          fontSize: 'clamp(1.8rem,7vw,2.6rem)', color: P.goldL, margin: '8px 0 0', lineHeight: 1.15,
        }}>
          The Leaky Bucket
        </h1>
      </div>

      <Cistern fillPct={0} style={{ animation: 'fadeUp .7s .1s ease both' }} />

      <p style={{
        fontFamily: SERIF, fontStyle: 'italic',
        fontSize: 'clamp(1.02rem,4.4vw,1.2rem)', lineHeight: 1.7,
        color: 'rgba(245,238,225,0.9)', maxWidth: 440, margin: 0,
        animation: 'fadeUp .7s .2s ease both',
      }}>
        We all carry a bucket. Every day, we try to fill it — with what we do,
        what others think, how needed we feel. But the bucket is cracked.
        No matter how much we pour in, it never holds.
      </p>

      <button
        onClick={onFill}
        style={{
          marginTop: 6,
          background: `linear-gradient(135deg, ${P.water}, ${P.waterD})`,
          border: 'none', borderRadius: 14,
          padding: '15px 34px', cursor: 'pointer',
          color: '#fff', fontFamily: SANS, fontWeight: 600, fontSize: '0.95rem',
          letterSpacing: '0.02em',
          boxShadow: '0 10px 28px rgba(60,127,160,0.4)',
          animation: 'fadeUp .7s .3s ease both',
        }}
      >
        Fill your bucket →
      </button>
    </div>
  );
}

/* ── Fill the bucket (Step 2) ────────────────────────────────── */
function FillStep({ sources, fillPct, onAdd, onRemove, onContinue }) {
  const [draft, setDraft] = useState('');
  const submit = () => { onAdd(draft); setDraft(''); };

  return (
    <div style={{
      position: 'relative', zIndex: 2, minHeight: 'calc(100vh - 50px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '22px 20px 40px', gap: 18,
    }}>
      <div style={{ textAlign: 'center', maxWidth: 460, animation: 'fadeUp .5s ease both' }}>
        <h2 style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 600, fontSize: 'clamp(1.4rem,5.5vw,1.9rem)', color: P.goldL, margin: 0 }}>
          What have you been filling it with?
        </h2>
        <p style={{ fontFamily: SERIF, fontSize: '1rem', lineHeight: 1.6, color: 'rgba(245,238,225,0.82)', margin: '10px 0 0' }}>
          Name what you've been getting your worth from. Tap one, or add your own.
        </p>
      </div>

      <Cistern fillPct={fillPct} />

      {/* Items currently in the bucket */}
      {sources.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 480 }}>
          {sources.map(s => (
            <button key={s} onClick={() => onRemove(s)} aria-label={`Remove ${s}`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                background: `linear-gradient(135deg, ${P.water}, ${P.waterD})`,
                border: 'none', borderRadius: 999, padding: '8px 14px', cursor: 'pointer',
                color: '#fff', fontFamily: SANS, fontSize: '0.82rem', fontWeight: 500,
                boxShadow: '0 4px 14px rgba(60,127,160,0.35)',
              }}>
              {s} <span style={{ opacity: 0.8, fontSize: '0.9rem' }}>✕</span>
            </button>
          ))}
        </div>
      )}

      {/* Preset chips not yet chosen */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 480 }}>
        {PRESET_SOURCES.filter(p => !sources.some(s => s.toLowerCase() === p.toLowerCase())).map(p => (
          <button key={p} onClick={() => onAdd(p)}
            style={{
              background: P.panel, border: `1px solid ${P.border}`, borderRadius: 999,
              padding: '8px 14px', cursor: 'pointer', color: P.ink,
              fontFamily: SANS, fontSize: '0.82rem',
            }}>
            + {p}
          </button>
        ))}
      </div>

      {/* Add your own */}
      <div style={{ display: 'flex', gap: 8, width: '100%', maxWidth: 420 }}>
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') submit(); }}
          placeholder="Something else…"
          style={{
            flex: 1, background: 'rgba(0,0,0,0.25)', border: `1px solid ${P.border}`,
            borderRadius: 12, padding: '12px 14px', color: P.ink,
            fontFamily: SANS, fontSize: '0.9rem', outline: 'none',
          }}
        />
        <button onClick={submit} disabled={!draft.trim()}
          style={{
            background: draft.trim() ? P.panel : 'transparent',
            border: `1px solid ${draft.trim() ? P.borderH : P.border}`, borderRadius: 12,
            padding: '0 18px', cursor: draft.trim() ? 'pointer' : 'default',
            color: P.goldL, fontFamily: SANS, fontSize: '0.9rem',
          }}>
          Add
        </button>
      </div>

      {/* Continue */}
      <button
        onClick={onContinue}
        disabled={sources.length === 0}
        style={{
          marginTop: 6,
          background: sources.length ? `linear-gradient(135deg, ${P.water}, ${P.waterD})` : 'rgba(255,255,255,0.06)',
          border: 'none', borderRadius: 14, padding: '15px 34px',
          cursor: sources.length ? 'pointer' : 'default',
          color: sources.length ? '#fff' : 'rgba(255,255,255,0.4)',
          fontFamily: SANS, fontWeight: 600, fontSize: '0.95rem',
          boxShadow: sources.length ? '0 10px 28px rgba(60,127,160,0.4)' : 'none',
          transition: 'all .25s',
        }}>
        {sources.length ? 'My bucket is full →' : 'Add at least one'}
      </button>
    </div>
  );
}

/* ── Jeremiah 2:13 (KJV) broken into the three lies ──────────── */
const JER_213 =
  '"For my people have committed two evils; they have forsaken me the fountain of living waters, and hewed them out cisterns, broken cisterns, that can hold no water."';

const JER_LIES = [
  {
    phrase: 'the fountain of living waters',
    body: 'They walked away from the one source that never runs dry.',
    lie: 'He isn\u2019t enough.',
  },
  {
    phrase: 'hewed them out cisterns',
    body: 'So we carve our own containers for worth \u2014 achievements, approval, being needed.',
    lie: 'I can make my own worth.',
  },
  {
    phrase: 'broken cisterns, that can hold no water',
    body: 'But they crack. Whatever you pour in leaks right back out.',
    lie: 'These things can hold me.',
  },
];

/* ── The leak (Step 3) ───────────────────────────────────────── */
function LeakStep({ fillPct, onContinue }) {
  // Water drains out of the holes shortly after the screen appears
  const [level, setLevel] = useState(fillPct);
  useEffect(() => {
    const t = setTimeout(() => setLevel(7), 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{
      position: 'relative', zIndex: 2, minHeight: 'calc(100vh - 50px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '22px 20px 44px', gap: 18,
    }}>
      <div style={{ textAlign: 'center', maxWidth: 480, animation: 'fadeUp .5s ease both' }}>
        <h2 style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 600, fontSize: 'clamp(1.4rem,5.5vw,1.9rem)', color: P.goldL, margin: 0 }}>
          But it won't hold.
        </h2>
        <p style={{ fontFamily: SERIF, fontSize: '1rem', lineHeight: 1.6, color: 'rgba(245,238,225,0.82)', margin: '10px 0 0' }}>
          Watch what happens. No matter how full it looks, it leaks right back out.
        </p>
      </div>

      <Cistern fillPct={level} leaking />

      {/* Jeremiah 2:13 */}
      <div style={{ maxWidth: 500, textAlign: 'center', animation: 'fadeUp .6s .15s ease both' }}>
        <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '1.02rem', lineHeight: 1.7, color: '#F0E6D2', margin: 0 }}>
          {JER_213}
        </p>
        <div style={{ fontFamily: SANS, fontSize: '0.62rem', letterSpacing: '0.16em', color: P.gold, marginTop: 10 }}>
          JEREMIAH 2:13 · KJV
        </div>
      </div>

      {/* The three lies */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 460 }}>
        {JER_LIES.map((l, i) => (
          <div key={i} style={{
            background: 'rgba(0,0,0,0.28)', border: `1px solid ${P.border}`,
            borderLeft: `3px solid ${P.water}`, borderRadius: 12, padding: '14px 16px',
            animation: `fadeUp .5s ${0.25 + i * 0.12}s ease both`,
          }}>
            <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '0.98rem', color: P.goldL }}>
              &ldquo;{l.phrase}&rdquo;
            </div>
            <div style={{ fontFamily: SANS, fontSize: '0.84rem', lineHeight: 1.55, color: 'rgba(245,238,225,0.78)', margin: '6px 0 9px' }}>
              {l.body}
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
              <span style={{ fontFamily: SANS, fontSize: '0.6rem', letterSpacing: '0.14em', color: 'rgba(207,135,120,0.9)', textTransform: 'uppercase' }}>The lie</span>
              <span style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '0.95rem', color: '#E8B6A8' }}>{l.lie}</span>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onContinue}
        style={{
          marginTop: 4,
          background: `linear-gradient(135deg, ${P.sage}, #6E8460)`,
          border: 'none', borderRadius: 14, padding: '15px 34px', cursor: 'pointer',
          color: '#fff', fontFamily: SANS, fontWeight: 600, fontSize: '0.95rem',
          boxShadow: '0 10px 28px rgba(110,132,96,0.4)',
        }}>
        Plug the holes with truth →
      </button>
    </div>
  );
}

/* ── The three truths that plug the lies (call-and-response) ─── */
// holeId matches the hole each truth seals (same order as JER_LIES / HOLES)
const TRUTHS = [
  {
    holeId: 0,
    lie: 'He isn\u2019t enough.',
    truth: 'He is living water \u2014 drink, and never thirst again.',
    ref: 'John 4:14',
    text: '"But whosoever drinketh of the water that I shall give him shall never thirst; but the water that I shall give him shall be in him a well of water springing up into everlasting life."',
  },
  {
    holeId: 1,
    lie: 'I can make my own worth.',
    truth: 'He chose you before you\u2019d done a single thing.',
    ref: 'Ephesians 1:4\u20135',
    text: '"According as he hath chosen us in him before the foundation of the world, that we should be holy and without blame before him in love: Having predestinated us unto the adoption of children by Jesus Christ to himself, according to the good pleasure of his will."',
  },
  {
    holeId: 2,
    lie: 'These things can hold me.',
    truth: 'Nothing can separate you from His love.',
    ref: 'Romans 8:38\u201339',
    text: '"For I am persuaded, that neither death, nor life, nor angels, nor principalities, nor powers, nor things present, nor things to come, Nor height, nor depth, nor any other creature, shall be able to separate us from the love of God, which is in Christ Jesus our Lord."',
  },
];

/* ── Plug the holes (Step 4) ─────────────────────────────────── */
function PlugStep({ plugged, onPlug, onContinue }) {
  const allSealed = plugged.length === HOLES.length;
  // Water climbs and holds as each hole is sealed
  const level = allSealed ? 88 : 8 + plugged.length * 26;

  return (
    <div style={{
      position: 'relative', zIndex: 2, minHeight: 'calc(100vh - 50px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '22px 20px 44px', gap: 18,
    }}>
      <div style={{ textAlign: 'center', maxWidth: 480, animation: 'fadeUp .5s ease both' }}>
        <h2 style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 600, fontSize: 'clamp(1.4rem,5.5vw,1.9rem)', color: P.goldL, margin: 0 }}>
          Seal each hole with truth.
        </h2>
        <p style={{ fontFamily: SERIF, fontSize: '1rem', lineHeight: 1.6, color: 'rgba(245,238,225,0.82)', margin: '10px 0 0' }}>
          For every lie, there is a word from God that answers it. Tap each truth to plug the hole.
        </p>
      </div>

      <Cistern fillPct={level} leaking={!allSealed} plugged={plugged} />

      {/* The three truths */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 480 }}>
        {TRUTHS.map((t, i) => {
          const sealed = plugged.includes(t.holeId);
          return (
            <button
              key={t.holeId}
              onClick={() => onPlug(t.holeId)}
              disabled={sealed}
              style={{
                textAlign: 'left', width: '100%', cursor: sealed ? 'default' : 'pointer',
                background: sealed ? 'rgba(141,161,123,0.14)' : 'rgba(0,0,0,0.28)',
                border: `1px solid ${sealed ? 'rgba(141,161,123,0.55)' : P.border}`,
                borderLeft: `3px solid ${sealed ? P.sage : 'rgba(232,182,168,0.6)'}`,
                borderRadius: 12, padding: '14px 16px',
                transition: 'all .3s', animation: `fadeUp .5s ${0.2 + i * 0.12}s ease both`,
              }}>
              {/* lie being answered */}
              <div style={{ fontFamily: SANS, fontSize: '0.74rem', color: 'rgba(232,182,168,0.85)', textDecoration: sealed ? 'line-through' : 'none' }}>
                {t.lie}
              </div>
              {/* the truth */}
              <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '1.05rem', lineHeight: 1.45, color: sealed ? '#CDE0BD' : P.goldL, margin: '5px 0 8px' }}>
                {t.truth}
              </div>
              {/* verse */}
              <div style={{ fontFamily: SANS, fontSize: '0.78rem', lineHeight: 1.55, color: 'rgba(245,238,225,0.72)' }}>
                {t.text}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 9 }}>
                <span style={{ fontFamily: SANS, fontSize: '0.6rem', letterSpacing: '0.14em', color: P.gold, textTransform: 'uppercase' }}>{t.ref} · KJV</span>
                <span style={{ fontFamily: SANS, fontSize: '0.74rem', fontWeight: 600, color: sealed ? P.sage : 'rgba(141,161,123,0.85)' }}>
                  {sealed ? 'Sealed ✓' : 'Tap to seal →'}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <button
        onClick={onContinue}
        disabled={!allSealed}
        style={{
          marginTop: 4,
          background: allSealed ? `linear-gradient(135deg, ${P.sage}, #6E8460)` : 'rgba(255,255,255,0.06)',
          border: 'none', borderRadius: 14, padding: '15px 34px',
          cursor: allSealed ? 'pointer' : 'default',
          color: allSealed ? '#fff' : 'rgba(255,255,255,0.4)',
          fontFamily: SANS, fontWeight: 600, fontSize: '0.95rem',
          boxShadow: allSealed ? '0 10px 28px rgba(110,132,96,0.4)' : 'none',
          transition: 'all .25s',
        }}>
        {allSealed ? 'Now it holds →' : `Seal all three (${plugged.length}/3)`}
      </button>
    </div>
  );
}

/* ── It holds (Step 5) — reflection + save ───────────────────── */
function ItHoldsStep({ sources, plugged, reflections, onSave, onDone }) {
  const [draft, setDraft] = useState('');
  const [saved, setSaved] = useState(false);
  const allPlugged = HOLES.map(h => h.id); // all three sealed by the time we reach here

  const save = () => {
    const text = draft.trim();
    if (!text) return;
    const usedTruths = TRUTHS
      .filter(t => (plugged.length ? plugged : allPlugged).includes(t.holeId))
      .map(t => ({ truth: t.truth, ref: t.ref }));
    const entry = {
      id: `lb-${Date.now()}`,
      sources,
      plugs: usedTruths,
      reflection: text,
      createdAt: new Date().toISOString(),
      theme: 'leaky-bucket/episode-1',
    };
    onSave(entry);
    setDraft('');
    setSaved(true);
  };

  return (
    <div style={{
      position: 'relative', zIndex: 2, minHeight: 'calc(100vh - 50px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '22px 20px 48px', gap: 18,
    }}>
      <div style={{ textAlign: 'center', maxWidth: 480, animation: 'fadeUp .5s ease both' }}>
        <h2 style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 600, fontSize: 'clamp(1.5rem,6vw,2rem)', color: P.goldL, margin: 0 }}>
          Now it holds.
        </h2>
        <p style={{ fontFamily: SERIF, fontSize: '1rem', lineHeight: 1.6, color: 'rgba(245,238,225,0.85)', margin: '10px 0 0' }}>
          Sealed by truth, the water stays. This is what it feels like to draw
          your worth from the One who never runs dry.
        </p>
      </div>

      <Cistern fillPct={90} plugged={plugged.length ? plugged : allPlugged} style={{ animation: 'fadeUp .7s .1s ease both' }} />

      {/* Blessing */}
      <p style={{
        fontFamily: SERIF, fontStyle: 'italic', fontSize: '1.08rem', lineHeight: 1.65,
        color: '#F0E6D2', textAlign: 'center', maxWidth: 440, margin: 0,
        animation: 'fadeUp .6s .2s ease both',
      }}>
        &ldquo;He is the fountain of living waters. In Him, you are full &mdash; and you hold.&rdquo;
      </p>

      {/* Reflection box */}
      <div style={{ width: '100%', maxWidth: 460, animation: 'fadeUp .6s .25s ease both' }}>
        <label style={{ display: 'block', fontFamily: SANS, fontSize: '0.66rem', letterSpacing: '0.16em', color: P.gold, textTransform: 'uppercase', marginBottom: 8 }}>
          Sit with it — what is He saying to you?
        </label>
        <textarea
          value={draft}
          onChange={e => { setDraft(e.target.value); setSaved(false); }}
          placeholder="Write your reflection here…"
          rows={5}
          style={{
            width: '100%', boxSizing: 'border-box',
            background: 'rgba(0,0,0,0.25)', border: `1px solid ${P.border}`,
            borderRadius: 12, padding: '14px', color: P.ink,
            fontFamily: SERIF, fontSize: '1rem', lineHeight: 1.6, outline: 'none', resize: 'vertical',
          }}
        />
        <button
          onClick={save}
          disabled={!draft.trim()}
          style={{
            marginTop: 12, width: '100%',
            background: draft.trim() ? `linear-gradient(135deg, ${P.sage}, #6E8460)` : 'rgba(255,255,255,0.06)',
            border: 'none', borderRadius: 14, padding: '15px 0',
            cursor: draft.trim() ? 'pointer' : 'default',
            color: draft.trim() ? '#fff' : 'rgba(255,255,255,0.4)',
            fontFamily: SANS, fontWeight: 600, fontSize: '0.95rem',
            boxShadow: draft.trim() ? '0 10px 28px rgba(110,132,96,0.4)' : 'none',
            transition: 'all .25s',
          }}>
          {saved ? 'Saved ✓ — write another' : 'Save this reflection'}
        </button>
        {saved && (
          <p style={{ fontFamily: SANS, fontSize: '0.78rem', color: P.sage, textAlign: 'center', margin: '10px 0 0' }}>
            Kept safe. You can return to it anytime.
          </p>
        )}
      </div>

      {/* History */}
      {reflections.length > 0 && (
        <div style={{ width: '100%', maxWidth: 460, marginTop: 6 }}>
          <div style={{ fontFamily: SANS, fontSize: '0.66rem', letterSpacing: '0.16em', color: P.gold, textTransform: 'uppercase', marginBottom: 10, textAlign: 'center' }}>
            Your reflections
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {reflections.map(r => (
              <div key={r.id} style={{
                background: 'rgba(0,0,0,0.26)', border: `1px solid ${P.border}`,
                borderLeft: `3px solid ${P.sage}`, borderRadius: 12, padding: '13px 15px',
              }}>
                <div style={{ fontFamily: SERIF, fontSize: '0.98rem', lineHeight: 1.55, color: '#F0E6D2', whiteSpace: 'pre-wrap' }}>
                  {r.reflection}
                </div>
                <div style={{ fontFamily: SANS, fontSize: '0.66rem', color: P.sub, marginTop: 8 }}>
                  {formatDate(r.createdAt)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button onClick={onDone} style={{
        marginTop: 4, background: P.panel, border: `1px solid ${P.border}`, borderRadius: 12,
        padding: '13px 30px', cursor: 'pointer', color: P.goldL, fontFamily: SANS, fontSize: '0.88rem',
      }}>
        Return to the cabin
      </button>
    </div>
  );
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return ''; }
}

// The three holes in the cistern (shared by the leak + plug steps)
const HOLES = [
  { id: 0, x: 63, y: 121 },
  { id: 1, x: 100, y: 138 },
  { id: 2, x: 137, y: 121 },
];

/* ── Reusable cistern drawing (water, leaks, and sage-green plugs) ── */
function Cistern({ fillPct = 0, style, leaking = false, plugged = [] }) {
  const clamped = Math.max(0, Math.min(100, fillPct));
  // Bucket interior y-range (in SVG units): top ~52, bottom ~150
  const top = 52, bottom = 150;
  const colH = bottom - top;            // full water column height
  const shift = colH * (1 - clamped / 100); // how far to push the water down
  const showHoles = leaking || plugged.length > 0;
  const isPlugged = (id) => plugged.includes(id);
  return (
    <svg viewBox="0 0 200 180" width="min(58vw,220px)" style={style} aria-hidden="true">
      <defs>
        <linearGradient id="lb-pewter" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={P.pewterD} />
          <stop offset="0.5" stopColor={P.pewter} />
          <stop offset="1" stopColor={P.pewterD} />
        </linearGradient>
        <linearGradient id="lb-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={P.water} />
          <stop offset="1" stopColor={P.waterD} />
        </linearGradient>
        <radialGradient id="lb-sage" cx="0.4" cy="0.35" r="0.8">
          <stop offset="0" stopColor="#A9BB97" />
          <stop offset="1" stopColor="#6E8460" />
        </radialGradient>
        <clipPath id="lb-clip">
          <path d="M40 50 L160 50 L150 152 Q100 162 50 152 Z" />
        </clipPath>
      </defs>

      {/* Water inside (clipped to bucket shape, slides up as it fills) */}
      {clamped > 0 && (
        <g clipPath="url(#lb-clip)">
          <g style={{ transform: `translateY(${shift}px)`, transition: 'transform .55s cubic-bezier(.22,1,.36,1)' }}>
            <rect x="30" y={top} width="140" height={colH + 16} fill="url(#lb-water)" />
            {/* gentle surface highlight */}
            <ellipse cx="100" cy={top + 2} rx="58" ry="5" fill="rgba(255,255,255,0.28)" />
          </g>
        </g>
      )}

      {/* Leaking streams out of any unplugged hole */}
      {leaking && HOLES.filter(h => !isPlugged(h.id)).map(h => (
        <g key={`leak-${h.id}`}>
          {[0, 0.45].map((delay, k) => (
            <circle key={k} cx={h.x} r="2.4" fill="#6FB3D2">
              <animate attributeName="cy" values={`${h.y};${h.y + 36}`} dur="0.9s" begin={`${delay}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.95;0.95;0" dur="0.9s" begin={`${delay}s`} repeatCount="indefinite" />
            </circle>
          ))}
        </g>
      ))}

      {/* Bucket body */}
      <path d="M40 50 L160 50 L150 152 Q100 162 50 152 Z"
        fill="none" stroke="url(#lb-pewter)" strokeWidth="6" strokeLinejoin="round" />
      {/* Rim */}
      <ellipse cx="100" cy="50" rx="62" ry="11" fill="none" stroke="url(#lb-pewter)" strokeWidth="6" />
      {/* Metal bands */}
      <path d="M45 88 Q100 96 155 88" fill="none" stroke={P.pewterD} strokeWidth="3" opacity="0.6" />
      <path d="M48 120 Q100 128 152 120" fill="none" stroke={P.pewterD} strokeWidth="3" opacity="0.6" />
      {/* Handle */}
      <path d="M44 54 Q100 18 156 54" fill="none" stroke={P.pewter} strokeWidth="4" strokeLinecap="round" />

      {/* Holes (and sage-green plugs once sealed) */}
      {showHoles && HOLES.map(h => (
        isPlugged(h.id) ? (
          <g key={`hole-${h.id}`}>
            <circle cx={h.x} cy={h.y} r="5.4" fill="url(#lb-sage)" stroke="#56684B" strokeWidth="1" />
            <ellipse cx={h.x - 1.4} cy={h.y - 1.6} rx="1.8" ry="1.2" fill="rgba(255,255,255,0.45)" />
          </g>
        ) : (
          <ellipse key={`hole-${h.id}`} cx={h.x} cy={h.y} rx="4.4" ry="3.4" fill="#1A130C" stroke={P.pewterD} strokeWidth="1" />
        )
      ))}
    </svg>
  );
}

/* ── Header (matches the rest of the app) ────────────────────── */
function Header({ title, onBack }) {
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 10,
      background: 'rgba(20,16,12,0.85)', backdropFilter: 'blur(8px)',
      padding: '0 18px', height: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      borderBottom: `1px solid ${P.border}`,
    }}>
      <button onClick={onBack} style={{
        background: 'transparent', border: 'none', cursor: 'pointer',
        color: P.sub, fontSize: '0.82rem', fontFamily: SANS, padding: 0,
      }}>← Back</button>
      <span style={{ fontFamily: SERIF, fontStyle: 'italic', color: P.goldL, fontSize: '0.95rem' }}>{title}</span>
      <div style={{ minWidth: 60 }} />
    </header>
  );
}
