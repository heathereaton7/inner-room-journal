import { useState, useMemo, useEffect } from 'react';
import { generateGrid } from '../systems/wordSearchGen.js';
import WordSearchGrid from './WordSearchGrid.jsx';

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
};

// Common KJV / filler words that stay visible (never become blanks).
const STOP = new Set([
  'THAT', 'THIS', 'WITH', 'FROM', 'THEE', 'THOU', 'THINE', 'UNTO', 'SHALL',
  'WILL', 'HAVE', 'HATH', 'WHICH', 'WHEN', 'THEN', 'THERE', 'WHAT', 'EVEN',
  'EVERY', 'UPON', 'YOUR', 'THEIR', 'THEM', 'THEY', 'BEEN', 'WERE', 'INTO',
  'OVER', 'SUCH', 'THAN', 'ALSO', 'BEING', 'DOTH', 'MINE', 'OURS', 'NOT',
]);

// Strip everything but A–Z and uppercase, to get a word's searchable "core".
const core = (s) => s.toUpperCase().replace(/[^A-Z]/g, '');

/**
 * Parse a verse into ordered tokens and decide which words become blanks.
 *
 * Returns { tokens, words } where:
 *   tokens — [{ kind:'space' } | { kind:'text', raw } | { kind:'blank', raw, word }]
 *            in original reading order (so the verse can be shown in full).
 *   words  — the unique uppercase words hidden in the grid (the blanks).
 *
 * A word becomes a blank only if it is meaningful (length >= 4, not a stop
 * word) AND it does not collide with a near-duplicate. Two words "collide"
 * when one is a substring of the other (e.g. WATER / WATERS) — those stay
 * visible as given hint text so the puzzle is never ambiguous.
 */
function parseVerse(text) {
  const rawTokens = String(text || '').split(/(\s+)/);

  // First pass: gather the distinct meaningful cores.
  const meaningful = [];
  const seen = new Set();
  for (const tok of rawTokens) {
    if (/^\s*$/.test(tok)) continue;
    const c = core(tok);
    if (c.length < 4 || STOP.has(c) || seen.has(c)) continue;
    seen.add(c);
    meaningful.push(c);
  }

  // Flag cores that collide with a near-duplicate (substring either way).
  const colliding = new Set();
  for (const a of meaningful) {
    for (const b of meaningful) {
      if (a === b) continue;
      if (a.includes(b) || b.includes(a)) { colliding.add(a); colliding.add(b); }
    }
  }

  // Selectable = meaningful, non-colliding, longest first, capped for playability.
  const selectable = meaningful
    .filter((c) => !colliding.has(c))
    .sort((a, b) => b.length - a.length)
    .slice(0, 12);
  const blankSet = new Set(selectable);

  // Second pass: build the ordered token list.
  const tokens = rawTokens.map((tok) => {
    if (/^\s*$/.test(tok)) return { kind: 'space' };
    const c = core(tok);
    if (blankSet.has(c)) return { kind: 'blank', raw: tok, word: c };
    return { kind: 'text', raw: tok };
  });

  return { tokens, words: selectable };
}

/**
 * VerseWordSearch — a fill-in-the-blank word search.
 *
 * The full verse is shown at the top with its key words replaced by blanks.
 * As each word is found in the grid below, that blank is filled in — so the
 * verse is gently revealed line by line. Finding every word completes the
 * verse and reveals the affirmation as a blessing.
 *
 * Props:
 *   med     — { verse:{ text }, affirmation, title }
 *   seedId  — stable string so the layout is the same each visit
 */
export default function VerseWordSearch({ med, seedId }) {
  const { tokens, words } = useMemo(
    () => parseVerse(med?.verse?.text || ''),
    [med]
  );

  const gridSize = useMemo(() => {
    const longest = words.reduce((m, w) => Math.max(m, w.length), 0);
    const totalLetters = words.reduce((s, w) => s + w.length, 0);
    return Math.min(15, Math.max(11, longest + 1, Math.ceil(Math.sqrt(totalLetters * 1.7))));
  }, [words]);

  const grid = useMemo(
    () => generateGrid(seedId || med?.title || 'verse', gridSize, words),
    [seedId, med, gridSize, words]
  );

  const [foundWords, setFoundWords] = useState([]);
  const [foundCells, setFoundCells] = useState(() => new Set());
  const [toast, setToast] = useState(null);

  const foundSet = useMemo(() => new Set(foundWords), [foundWords]);
  const remaining = useMemo(() => words.filter((w) => !foundSet.has(w)), [words, foundSet]);
  const isComplete = words.length > 0 && remaining.length === 0;

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1600);
    return () => clearTimeout(t);
  }, [toast]);

  const onWordFound = (word, cells) => {
    setFoundWords((prev) => (prev.includes(word) ? prev : [...prev, word]));
    setFoundCells((prev) => {
      const next = new Set(prev);
      cells.forEach((c) => next.add(c));
      return next;
    });
    setToast(`Found “${word.toLowerCase()}”`);
  };

  return (
    <main style={{ maxWidth: 620, margin: '0 auto', padding: '20px 16px 90px', position: 'relative' }}>
      <p style={{
        fontFamily: SERIF, fontStyle: 'italic', color: P.goldL,
        fontSize: '1.02rem', textAlign: 'center', lineHeight: 1.5, margin: '0 0 4px',
      }}>
        {med?.title}
      </p>
      <p style={{
        fontFamily: SANS, fontSize: '0.74rem', color: P.sub,
        textAlign: 'center', letterSpacing: '0.05em', margin: '0 0 16px',
      }}>
        Find each word to fill in the verse
      </p>

      {/* The verse, with blanks that fill in as words are found */}
      <div style={{
        margin: '0 auto 18px', maxWidth: 560,
        padding: '18px 20px', background: P.panel,
        border: `1px solid ${isComplete ? P.borderH : P.border}`, borderRadius: 14,
        boxShadow: '0 6px 22px rgba(0,0,0,0.4)',
        fontFamily: SERIF, fontSize: '1.18rem', lineHeight: 1.95,
        color: 'rgba(245,238,225,0.9)', textAlign: 'center',
      }}>
        {tokens.map((t, i) => {
          if (t.kind === 'space') return ' ';
          if (t.kind === 'text') {
            return <span key={i}>{t.raw}</span>;
          }
          // blank
          const found = foundSet.has(t.word);
          if (found) {
            return (
              <span key={i} style={{
                color: P.goldL, fontStyle: 'italic', fontWeight: 600,
                animation: 'fadeUp .4s ease both',
              }}>
                {t.raw}
              </span>
            );
          }
          return (
            <span key={i} style={{
              display: 'inline-block',
              minWidth: `${Math.max(1.4, t.word.length * 0.62)}em`,
              borderBottom: `2px solid ${P.borderH}`,
              margin: '0 2px',
              verticalAlign: 'baseline',
              height: '1.1em',
            }} aria-label="blank" />
          );
        })}
      </div>

      {/* Completion blessing */}
      {isComplete && (
        <div style={{
          textAlign: 'center', margin: '0 auto 16px', maxWidth: 540,
          padding: '16px 20px', background: 'rgba(40,30,20,0.78)',
          border: `1px solid ${P.borderH}`, borderRadius: 14,
          boxShadow: '0 6px 22px rgba(0,0,0,0.4)',
        }}>
          <div style={{ fontFamily: SANS, fontSize: '0.64rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: P.sub, marginBottom: 8 }}>
            Well done
          </div>
          <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '1.12rem', lineHeight: 1.55, color: P.goldL }}>
            {med?.affirmation}
          </div>
        </div>
      )}

      <WordSearchGrid
        grid={grid}
        foundCells={foundCells}
        targetWords={remaining}
        onWordFound={onWordFound}
      />

      {/* Word bank — the words to search for */}
      <div style={{ margin: '20px auto 0', maxWidth: 580 }}>
        <div style={{
          fontSize: '0.66rem', fontFamily: SANS, fontWeight: 600,
          letterSpacing: '0.14em', color: P.sub, textTransform: 'uppercase',
          marginBottom: 10, textAlign: 'center',
        }}>
          {isComplete ? 'Verse complete' : `Words to find · ${remaining.length} left`}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
          {words.map((w) => {
            const isFound = foundSet.has(w);
            return (
              <span key={w} style={{
                padding: '4px 10px', borderRadius: 14,
                background: isFound ? 'rgba(201,169,110,0.18)' : 'rgba(255,255,255,0.04)',
                color: isFound ? P.goldL : P.ink,
                fontSize: '0.78rem', fontFamily: SANS, fontWeight: 600,
                textDecoration: isFound ? 'line-through' : 'none',
                textDecorationColor: 'rgba(201,169,110,0.6)',
                border: `1px solid ${isFound ? 'rgba(201,169,110,0.35)' : P.border}`,
                letterSpacing: '0.04em', transition: 'all 0.2s',
              }}>{w}</span>
            );
          })}
        </div>
      </div>

      {toast && (
        <div style={{
          position: 'fixed', bottom: 30, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(20,16,12,0.95)', color: P.goldL,
          padding: '10px 18px', borderRadius: 10,
          fontFamily: SERIF, fontStyle: 'italic', fontSize: '0.92rem',
          border: `1px solid ${P.border}`, zIndex: 1000, backdropFilter: 'blur(6px)',
        }}>{toast}</div>
      )}
    </main>
  );
}
