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

// Common KJV / filler words to skip so the puzzle stays meaningful & playable.
const STOP = new Set([
  'THAT', 'THIS', 'WITH', 'FROM', 'THEE', 'THOU', 'THINE', 'UNTO', 'SHALL',
  'WILL', 'HAVE', 'HATH', 'WHICH', 'WHEN', 'THEN', 'THERE', 'WHAT', 'EVEN',
  'EVERY', 'UPON', 'YOUR', 'THEIR', 'THEM', 'THEY', 'BEEN', 'WERE', 'INTO',
  'OVER', 'SUCH', 'THAN', 'ALSO', 'BEING', 'DOTH', 'MINE', 'OURS', 'NOT',
]);

/**
 * Build the list of hidden words from a meditation's verse text + affirmation.
 * Words are uppercased, punctuation-stripped, de-duplicated, filtered to
 * meaningful words (length >= 4, no stop words), and capped so the grid stays
 * playable. Longest/most distinctive words are preferred.
 */
function meditationWords(med) {
  const text = `${med?.verse?.text || ''} ${med?.affirmation || ''}`;
  const raw = text.toUpperCase().replace(/[^A-Z\s]/g, ' ').split(/\s+/).filter(Boolean);
  const seen = new Set();
  const out = [];
  for (const w of raw) {
    if (w.length < 4) continue;
    if (STOP.has(w)) continue;
    if (seen.has(w)) continue;
    seen.add(w);
    out.push(w);
  }
  out.sort((a, b) => b.length - a.length);
  return out.slice(0, 14);
}

/**
 * MeditationWordSearch — a word-search puzzle generated from one meditation's
 * verse and affirmation. Finding every word reveals the affirmation as a
 * gentle blessing.
 *
 * Props:
 *   med     — { verse:{text,reference}, affirmation, title }
 *   seedId  — stable string so the layout is the same each visit
 *   onBack()
 */
export default function MeditationWordSearch({ med, seedId, onBack }) {
  const words = useMemo(() => meditationWords(med), [med]);

  const gridSize = useMemo(() => {
    const longest = words.reduce((m, w) => Math.max(m, w.length), 0);
    const totalLetters = words.reduce((s, w) => s + w.length, 0);
    return Math.min(15, Math.max(11, longest + 1, Math.ceil(Math.sqrt(totalLetters * 1.7))));
  }, [words]);

  const grid = useMemo(
    () => generateGrid(seedId || med?.title || 'meditation', gridSize, words),
    [seedId, med, gridSize, words]
  );

  const [foundWords, setFoundWords] = useState([]);
  const [foundCells, setFoundCells] = useState(() => new Set());
  const [toast, setToast] = useState(null);

  const foundSet = useMemo(() => new Set(foundWords), [foundWords]);
  const remaining = useMemo(() => words.filter(w => !foundSet.has(w)), [words, foundSet]);
  const isComplete = words.length > 0 && remaining.length === 0;

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1600);
    return () => clearTimeout(t);
  }, [toast]);

  const onWordFound = (word, cells) => {
    setFoundWords(prev => prev.includes(word) ? prev : [...prev, word]);
    setFoundCells(prev => {
      const next = new Set(prev);
      cells.forEach(c => next.add(c));
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
        textAlign: 'center', letterSpacing: '0.05em', margin: '0 0 18px',
      }}>
        Find every word from this verse &amp; affirmation
      </p>

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

      {/* Word list */}
      <div style={{ margin: '20px auto 0', maxWidth: 580 }}>
        <div style={{
          fontSize: '0.66rem', fontFamily: SANS, fontWeight: 600,
          letterSpacing: '0.14em', color: P.sub, textTransform: 'uppercase',
          marginBottom: 10, textAlign: 'center',
        }}>
          {isComplete ? 'All words found' : `${remaining.length} word${remaining.length === 1 ? '' : 's'} remaining`}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
          {words.map(w => {
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
