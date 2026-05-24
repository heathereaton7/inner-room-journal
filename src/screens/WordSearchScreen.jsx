import { useState, useMemo, useEffect } from 'react';
import { WORD_SEARCH_PUZZLES, getPuzzle, extractWords, verseWords } from '../data/wordSearchPuzzles.js';
import { generateGrid } from '../systems/wordSearchGen.js';
import WordSearchGrid from '../components/WordSearchGrid.jsx';

const SERIF = "'Cormorant Garamond', Georgia, serif";
const SANS = "'Inter', system-ui, -apple-system, sans-serif";

const P = {
  bg: '#1A1612',
  ink: '#FAF6F0',
  sub: 'rgba(232,212,160,0.55)',
  border: 'rgba(201,169,110,0.18)',
  gold: '#C9A96E',
  goldL: '#E8D4A0',
  panel: 'rgba(255,255,255,0.04)',
};

/**
 * WordSearchScreen — KJV verse word-search game.
 *
 * Hub view lists the puzzles. Each puzzle hides every word of a KJV verse
 * in the letter grid; finding all of them reveals the complete verse.
 *
 * Props:
 *   onBack()
 *   progress              — { [puzzleId]: { foundWords: string[], completedAt? } }
 *   onProgressChange(next)
 */
export default function WordSearchScreen({ onBack, progress, onProgressChange }) {
  const [view, setView] = useState('hub');  // 'hub' | 'play' | 'complete'
  const [activeId, setActiveId] = useState(null);
  const [toast, setToast] = useState(null);

  const activePuzzle = activeId ? getPuzzle(activeId) : null;
  const activeProgress = activeId ? (progress?.[activeId] || { foundWords: [] }) : null;

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1800);
    return () => clearTimeout(t);
  }, [toast]);

  const startPuzzle = (id) => {
    setActiveId(id);
    setView('play');
  };

  const onWordFound = (puzzleId, word, cells) => {
    const prev = progress?.[puzzleId] || { foundWords: [], foundCells: [] };
    if (prev.foundWords?.includes(word)) return;
    const nextFoundWords = [...(prev.foundWords || []), word];
    const nextFoundCells = Array.from(new Set([...(prev.foundCells || []), ...cells]));
    const next = {
      ...progress,
      [puzzleId]: { foundWords: nextFoundWords, foundCells: nextFoundCells },
    };
    onProgressChange(next);
    setToast(`Found "${word}"`);
  };

  return (
    <div style={{
      minHeight: '100vh',
      color: P.ink,
      fontFamily: SANS,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <CottageBackground />
      <Header
        title={view === 'play' && activePuzzle ? activePuzzle.title : 'Word Search'}
        onBack={() => {
          if (view === 'hub') onBack();
          else { setActiveId(null); setView('hub'); }
        }}
      />

      {view === 'hub' && (
        <HubView puzzles={WORD_SEARCH_PUZZLES} progress={progress} onPick={startPuzzle} />
      )}

      {view === 'play' && activePuzzle && (
        <PlayView
          puzzle={activePuzzle}
          progress={activeProgress}
          onWordFound={(w, c) => onWordFound(activePuzzle.id, w, c)}
          onComplete={() => {
            const cur = progress?.[activePuzzle.id] || { foundWords: [], foundCells: [] };
            onProgressChange({ ...progress, [activePuzzle.id]: { ...cur, completedAt: Date.now() } });
          }}
        />
      )}

      {toast && (
        <div style={{
          position: 'fixed', bottom: 30, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(20,16,12,0.95)', color: P.goldL,
          padding: '10px 18px', borderRadius: 10,
          fontFamily: SERIF, fontStyle: 'italic', fontSize: '0.92rem',
          border: `1px solid ${P.border}`, zIndex: 1000,
          backdropFilter: 'blur(6px)',
        }}>{toast}</div>
      )}
    </div>
  );
}

// ── Cottage background with flickering candles ────────────────────────────
// Renders the rainy-cottage-window scene under the puzzle UI, plus three
// soft glowing flames anchored to the actual candles in the painting (left
// wall lantern, right windowsill lantern, table candle) that flicker with
// staggered random pulses so they feel alive.
function CottageBackground() {
  return (
    <>
      <style>{`
        @keyframes ws-flicker-a {
          0%, 100% { opacity: 0.85; transform: translate(-50%, -50%) scale(1); }
          15%      { opacity: 0.62; transform: translate(-50%, -50%) scale(0.96); }
          32%      { opacity: 0.95; transform: translate(-50%, -50%) scale(1.06); }
          48%      { opacity: 0.7;  transform: translate(-50%, -50%) scale(0.98); }
          65%      { opacity: 0.88; transform: translate(-50%, -50%) scale(1.02); }
          82%      { opacity: 0.55; transform: translate(-50%, -50%) scale(0.94); }
        }
        @keyframes ws-flicker-b {
          0%, 100% { opacity: 0.7;  transform: translate(-50%, -50%) scale(1); }
          12%      { opacity: 0.95; transform: translate(-50%, -50%) scale(1.08); }
          28%      { opacity: 0.5;  transform: translate(-50%, -50%) scale(0.92); }
          44%      { opacity: 0.85; transform: translate(-50%, -50%) scale(1.04); }
          60%      { opacity: 0.62; transform: translate(-50%, -50%) scale(0.97); }
          78%      { opacity: 0.92; transform: translate(-50%, -50%) scale(1.05); }
        }
        @keyframes ws-flicker-c {
          0%, 100% { opacity: 0.78; transform: translate(-50%, -50%) scale(1.01); }
          18%      { opacity: 0.55; transform: translate(-50%, -50%) scale(0.95); }
          34%      { opacity: 0.9;  transform: translate(-50%, -50%) scale(1.07); }
          52%      { opacity: 0.68; transform: translate(-50%, -50%) scale(0.99); }
          70%      { opacity: 0.86; transform: translate(-50%, -50%) scale(1.03); }
          88%      { opacity: 0.6;  transform: translate(-50%, -50%) scale(0.96); }
        }
      `}</style>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        backgroundImage: 'url(/wordsearchbackgroundone.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        pointerEvents: 'none',
      }} />
      {/* Darken layer so puzzle text stays readable on top */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        background: 'linear-gradient(180deg, rgba(10,8,6,0.55) 0%, rgba(10,8,6,0.72) 60%, rgba(10,8,6,0.82) 100%)',
        pointerEvents: 'none',
      }} />
      {/* Flickering candle glows — positioned over the actual candles in the painting */}
      <CandleGlow left="8.5%"  top="22%"  color="#FFB36A" size={220} keyframe="ws-flicker-a" duration={2.7} />
      <CandleGlow left="86%"   top="76%"  color="#FFC07A" size={260} keyframe="ws-flicker-b" duration={3.4} />
      <CandleGlow left="53%"   top="88%"  color="#FFC988" size={170} keyframe="ws-flicker-c" duration={2.2} />
    </>
  );
}

function CandleGlow({ left, top, color, size, keyframe, duration }) {
  return (
    <div style={{
      position: 'fixed', left, top,
      width: size, height: size,
      transform: 'translate(-50%, -50%)',
      background: `radial-gradient(circle, ${color} 0%, rgba(255,180,90,0.4) 22%, rgba(255,150,60,0.15) 50%, transparent 75%)`,
      mixBlendMode: 'screen',
      pointerEvents: 'none',
      zIndex: 0,
      filter: 'blur(2px)',
      animation: `${keyframe} ${duration}s ease-in-out infinite`,
    }} />
  );
}

// ── Header ────────────────────────────────────────────────────────────────
function Header({ title, onBack }) {
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 10,
      background: 'rgba(20,16,12,0.78)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      padding: '0 18px', height: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      borderBottom: `1px solid ${P.border}`,
    }}>
      <button onClick={onBack} style={{
        background: 'transparent', border: 'none', cursor: 'pointer',
        color: P.sub, fontSize: '0.82rem', fontFamily: SANS, padding: 0,
      }}>← Back</button>
      <span style={{ fontFamily: SERIF, fontStyle: 'italic', color: P.goldL, fontSize: '0.95rem', textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>{title}</span>
      <div style={{ minWidth: 60 }} />
    </header>
  );
}

// ── Hub view ──────────────────────────────────────────────────────────────
function HubView({ puzzles, progress, onPick }) {
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '32px 22px 80px', position: 'relative', zIndex: 1 }}>
      <p style={{ textAlign: 'center', fontFamily: SERIF, fontStyle: 'italic', color: P.sub, fontSize: '0.95rem', lineHeight: 1.7, margin: '0 0 28px' }}>
        Hide and seek with the Word. Find every word of the verse to reveal the whole.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
        {puzzles.map(puzzle => {
          const p = progress?.[puzzle.id];
          const totalWords = extractWords(puzzle.verseText).length;
          const foundCount = p?.foundWords?.length || 0;
          const completed = !!p?.completedAt;
          return (
            <button key={puzzle.id} onClick={() => onPick(puzzle.id)} style={{
              background: completed ? 'rgba(40,30,20,0.78)' : 'rgba(20,16,12,0.72)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              border: `1px solid ${completed ? 'rgba(201,169,110,0.4)' : P.border}`,
              color: P.ink, padding: '16px 18px', borderRadius: 12,
              cursor: 'pointer', textAlign: 'left', fontFamily: SANS,
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
              transition: 'all 0.2s',
            }}>
              <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '1rem', color: P.goldL, marginBottom: 2 }}>
                {puzzle.title}
              </div>
              <div style={{ fontSize: '0.7rem', color: P.sub, marginBottom: 8, letterSpacing: '0.06em' }}>
                {puzzle.reference} · {puzzle.gridSize}×{puzzle.gridSize}
              </div>
              <div style={{
                height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden',
              }}>
                <div style={{
                  width: `${Math.round((foundCount / totalWords) * 100)}%`,
                  height: '100%',
                  background: completed ? P.gold : 'rgba(201,169,110,0.6)',
                  transition: 'width 0.2s',
                }} />
              </div>
              <div style={{ marginTop: 6, fontSize: '0.7rem', color: completed ? P.gold : P.sub }}>
                {completed ? 'Verse revealed' : `${foundCount} / ${totalWords} words`}
              </div>
            </button>
          );
        })}
      </div>
    </main>
  );
}

// ── Play view ─────────────────────────────────────────────────────────────
function PlayView({ puzzle, progress, onWordFound, onComplete }) {
  const allWords = useMemo(() => extractWords(puzzle.verseText), [puzzle.verseText]);
  const grid = useMemo(() => generateGrid(puzzle.id, puzzle.gridSize, allWords), [puzzle.id, puzzle.gridSize, allWords]);

  const foundSet = useMemo(() => new Set(progress?.foundWords || []), [progress]);
  const remainingWords = useMemo(() => allWords.filter(w => !foundSet.has(w)), [allWords, foundSet]);
  const foundCells = useMemo(() => new Set(progress?.foundCells || []), [progress]);
  const isComplete = remainingWords.length === 0;

  // Auto-mark completion when last word found
  useEffect(() => {
    if (isComplete && !progress?.completedAt) {
      onComplete();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete]);

  const displayWords = useMemo(() => verseWords(puzzle.verseText), [puzzle.verseText]);

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '18px 14px 80px', position: 'relative', zIndex: 1 }}>
      {/* Verse reveal area */}
      <div style={{
        textAlign: 'center', margin: '0 auto 16px', maxWidth: 600,
        padding: '14px 18px',
        background: isComplete ? 'rgba(40,30,20,0.78)' : 'rgba(20,16,12,0.72)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        border: `1px solid ${isComplete ? 'rgba(201,169,110,0.5)' : P.border}`,
        borderRadius: 12,
        boxShadow: '0 6px 22px rgba(0,0,0,0.4)',
      }}>
        <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '1.04rem', lineHeight: 1.6, margin: 0, color: P.ink }}>
          {isComplete ? (
            <>"{puzzle.verseText}"</>
          ) : (
            displayWords.map((w, i) => {
              const isFound = foundSet.has(w);
              return (
                <span key={i} style={{ color: isFound ? P.goldL : 'transparent', background: isFound ? 'transparent' : 'rgba(255,255,255,0.07)', borderRadius: 4, padding: '0 6px', margin: '0 2px', transition: 'all 0.3s' }}>
                  {isFound ? w.toLowerCase() : '•'.repeat(Math.min(w.length, 6))}
                </span>
              );
            })
          )}
        </p>
        <div style={{ fontFamily: SANS, fontSize: '0.72rem', color: P.sub, marginTop: 8, letterSpacing: '0.08em' }}>
          — {puzzle.reference}
        </div>
      </div>

      {/* Grid */}
      <WordSearchGrid
        grid={grid}
        foundCells={foundCells}
        targetWords={remainingWords}
        onWordFound={onWordFound}
      />

      {/* Word list */}
      <div style={{ margin: '20px auto 0', maxWidth: 580 }}>
        <div style={{
          fontSize: '0.66rem', fontFamily: SANS, fontWeight: 600,
          letterSpacing: '0.14em', color: P.sub, textTransform: 'uppercase',
          marginBottom: 10, textAlign: 'center',
        }}>
          {isComplete ? 'All words found' : `${remainingWords.length} word${remainingWords.length === 1 ? '' : 's'} remaining`}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
          {allWords.map(w => {
            const isFound = foundSet.has(w);
            return (
              <span key={w} style={{
                padding: '4px 10px',
                borderRadius: 14,
                background: isFound ? 'rgba(201,169,110,0.18)' : 'rgba(255,255,255,0.04)',
                color: isFound ? P.goldL : P.ink,
                fontSize: '0.78rem',
                fontFamily: SANS,
                fontWeight: 600,
                textDecoration: isFound ? 'line-through' : 'none',
                textDecorationColor: 'rgba(201,169,110,0.6)',
                border: `1px solid ${isFound ? 'rgba(201,169,110,0.35)' : P.border}`,
                letterSpacing: '0.04em',
                transition: 'all 0.2s',
              }}>{w}</span>
            );
          })}
        </div>
      </div>
    </main>
  );
}
