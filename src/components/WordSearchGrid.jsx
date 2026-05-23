import { useState, useMemo, useCallback } from 'react';
import { checkSelection } from '../systems/wordSearchGen.js';

const SANS = "'Inter', system-ui, -apple-system, sans-serif";

const P = {
  border: 'rgba(201,169,110,0.18)',
  borderH: 'rgba(201,169,110,0.55)',
  gold: '#C9A96E',
  goldL: '#E8D4A0',
};

/**
 * WordSearchGrid — interactive letter grid.
 *
 * Selection model: tap the first letter, then tap the last letter. If the
 * cells between form a valid straight line that spells one of the unfound
 * target words (forwards or backwards), that word is marked found.
 *
 * Props:
 *   grid            — { size, letters, placements }
 *   foundCells      — Set<number> of cell indices already locked in (found)
 *   targetWords     — string[] of remaining unfound words
 *   onWordFound(word, cells)
 */
export default function WordSearchGrid({ grid, foundCells, targetWords, onWordFound }) {
  const [first, setFirst] = useState(null);   // { r, c, idx } or null
  const [hover, setHover] = useState(null);   // { r, c } for desktop hover preview
  const [errorIdx, setErrorIdx] = useState(null);

  // Preview cells if user has tapped a first letter and is hovering
  const previewCells = useMemo(() => {
    if (!first || !hover) return null;
    const dr = Math.sign(hover.r - first.r);
    const dc = Math.sign(hover.c - first.c);
    const adr = Math.abs(hover.r - first.r);
    const adc = Math.abs(hover.c - first.c);
    if (!(adr === 0 || adc === 0 || adr === adc)) return null;
    const len = Math.max(adr, adc) + 1;
    const cells = new Set();
    for (let i = 0; i < len; i++) {
      const r = first.r + dr * i;
      const c = first.c + dc * i;
      cells.add(r * grid.size + c);
    }
    return cells;
  }, [first, hover, grid.size]);

  const onCellTap = useCallback((r, c) => {
    const idx = r * grid.size + c;
    if (!first) {
      setFirst({ r, c, idx });
      return;
    }
    if (first.r === r && first.c === c) {
      // Tapped same cell → cancel
      setFirst(null);
      return;
    }
    // Try to match
    const match = checkSelection(grid, first.r, first.c, r, c, targetWords);
    if (match) {
      onWordFound(match.word, match.cells);
      setFirst(null);
      setHover(null);
    } else {
      // Brief error feedback then accept this cell as new first
      setErrorIdx(idx);
      setTimeout(() => setErrorIdx(null), 350);
      setFirst({ r, c, idx });
    }
  }, [first, grid, targetWords, onWordFound]);

  const onCellHover = useCallback((r, c) => {
    if (!first) return;
    setHover({ r, c });
  }, [first]);

  // Render
  const cellSize = `min(${Math.floor(560 / grid.size)}px, calc((100vw - 56px) / ${grid.size}))`;

  return (
    <div
      onPointerLeave={() => setHover(null)}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${grid.size}, 1fr)`,
        gap: 2,
        background: 'rgba(0,0,0,0.35)',
        padding: 8,
        borderRadius: 12,
        border: `1px solid ${P.border}`,
        maxWidth: 580,
        margin: '0 auto',
        touchAction: 'manipulation',
      }}
    >
      {grid.letters.map((letter, idx) => {
        const r = Math.floor(idx / grid.size);
        const c = idx % grid.size;
        const isFound = foundCells.has(idx);
        const isFirst = first && first.idx === idx;
        const isPreview = previewCells?.has(idx);
        const isError = errorIdx === idx;
        let bg = 'rgba(255,255,255,0.04)';
        let color = '#FAF6F0';
        let border = `1px solid rgba(255,255,255,0.06)`;
        if (isFound) {
          bg = 'rgba(201,169,110,0.32)';
          color = '#1A1612';
          border = `1px solid rgba(201,169,110,0.5)`;
        } else if (isError) {
          bg = 'rgba(220,80,80,0.35)';
          border = `1px solid rgba(220,80,80,0.6)`;
        } else if (isFirst) {
          bg = 'rgba(232,212,160,0.55)';
          color = '#1A1612';
          border = `1px solid ${P.goldL}`;
        } else if (isPreview) {
          bg = 'rgba(232,212,160,0.18)';
          border = `1px solid ${P.borderH}`;
        }
        return (
          <button
            key={idx}
            onClick={() => onCellTap(r, c)}
            onPointerEnter={() => onCellHover(r, c)}
            style={{
              width: cellSize,
              height: cellSize,
              aspectRatio: '1 / 1',
              background: bg,
              color,
              border,
              borderRadius: 4,
              cursor: 'pointer',
              fontFamily: SANS,
              fontWeight: 700,
              fontSize: `min(${Math.floor(560 / grid.size * 0.5)}px, calc((100vw - 56px) / ${grid.size} * 0.5))`,
              padding: 0,
              transition: 'transform 0.08s',
              transform: isFirst ? 'scale(1.08)' : 'scale(1)',
              userSelect: 'none',
            }}
          >
            {letter}
          </button>
        );
      })}
    </div>
  );
}
