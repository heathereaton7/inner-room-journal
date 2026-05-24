import { useState, useRef, useCallback, useEffect } from 'react';

const SANS = "'Inter', system-ui, -apple-system, sans-serif";

const P = {
  border: 'rgba(201,169,110,0.18)',
  borderH: 'rgba(201,169,110,0.55)',
  gold: '#C9A96E',
  goldL: '#E8D4A0',
};

/**
 * WordSearchGrid — interactive letter grid with two selection modes:
 *
 *   1. Drag mode — press on a letter and drag through letters in a straight
 *      line to the last letter. Releasing checks for a word match.
 *
 *   2. Tap-per-letter mode — tap each letter of the word one by one. The
 *      first tap starts the selection; each subsequent tap must be adjacent
 *      (in any of 8 directions) and the line must keep going in the same
 *      direction. The word is auto-checked after every tap, so finishing the
 *      last letter immediately marks the word as found.
 *
 * Releasing on the same cell you started on counts as a tap (extends the
 * incremental selection). Dragging across two or more cells counts as a
 * drag (full-line match).
 *
 * Props:
 *   grid             — { size, letters, placements }
 *   foundCells       — Set<number> of cell indices already locked in
 *   targetWords      — string[] of remaining unfound words
 *   onWordFound(word, cells)
 */
export default function WordSearchGrid({ grid, foundCells, targetWords, onWordFound }) {
  const size = grid.size;
  const wrapperRef = useRef(null);
  const dragRef = useRef({ active: false, startIdx: null, lastIdx: null, moved: false });
  // Selection: array of cell indices in order. In drag mode it's a straight
  // line being previewed; in tap mode it's the incrementally-built selection.
  const [selection, setSelection] = useState([]);
  const [dragLine, setDragLine] = useState(null);
  const [errorCells, setErrorCells] = useState(null);

  // ── Selection helpers ──────────────────────────────────────────────────
  const lineCells = useCallback((r1, c1, r2, c2) => {
    const dr = Math.sign(r2 - r1);
    const dc = Math.sign(c2 - c1);
    const adr = Math.abs(r2 - r1);
    const adc = Math.abs(c2 - c1);
    if (!(adr === 0 || adc === 0 || adr === adc)) return null;
    const len = Math.max(adr, adc) + 1;
    const cells = [];
    for (let i = 0; i < len; i++) {
      const r = r1 + dr * i;
      const c = c1 + dc * i;
      if (r < 0 || r >= size || c < 0 || c >= size) return null;
      cells.push(r * size + c);
    }
    return cells;
  }, [size]);

  const extendsLine = useCallback((prev, newIdx) => {
    if (prev.length === 0) return true;
    const last = prev[prev.length - 1];
    const lastR = Math.floor(last / size), lastC = last % size;
    const nR = Math.floor(newIdx / size), nC = newIdx % size;
    const dr = nR - lastR, dc = nC - lastC;
    if (Math.abs(dr) > 1 || Math.abs(dc) > 1 || (dr === 0 && dc === 0)) return false;
    if (prev.length >= 2) {
      const prev2 = prev[prev.length - 2];
      const p2R = Math.floor(prev2 / size), p2C = prev2 % size;
      const prevDr = lastR - p2R, prevDc = lastC - p2C;
      if (dr !== prevDr || dc !== prevDc) return false;
    }
    return true;
  }, [size]);

  const tryMatch = useCallback((cells) => {
    if (cells.length < 2) return null;
    const word = cells.map(i => grid.letters[i]).join('');
    const reversed = word.split('').reverse().join('');
    for (const t of targetWords) {
      if (word === t) return { word: t, cells };
      if (reversed === t) return { word: t, cells: cells.slice().reverse() };
    }
    return null;
  }, [grid.letters, targetWords]);

  // ── Find cell index from a pointer position ────────────────────────────
  const cellAtPoint = useCallback((x, y) => {
    const el = document.elementFromPoint(x, y);
    if (!el) return null;
    const data = el.closest('[data-cell]');
    if (!data) return null;
    const idx = parseInt(data.getAttribute('data-cell'), 10);
    if (!Number.isFinite(idx)) return null;
    return { idx, r: Math.floor(idx / size), c: idx % size };
  }, [size]);

  // ── Pointer handlers ───────────────────────────────────────────────────
  const onPointerDown = useCallback((e) => {
    const hit = cellAtPoint(e.clientX, e.clientY);
    if (!hit) return;
    // Capture the pointer so subsequent move/up events come here even if user drags outside
    wrapperRef.current?.setPointerCapture?.(e.pointerId);
    dragRef.current = { active: true, startIdx: hit.idx, lastIdx: hit.idx, moved: false, pointerId: e.pointerId };
    // Initial drag-line preview is just the starting cell
    setDragLine([hit.idx]);
  }, [cellAtPoint]);

  const onPointerMove = useCallback((e) => {
    const drag = dragRef.current;
    if (!drag.active) return;
    const hit = cellAtPoint(e.clientX, e.clientY);
    if (!hit) return;
    if (hit.idx === drag.lastIdx) return;
    drag.lastIdx = hit.idx;
    drag.moved = true;
    // Recompute the line from start to current
    const startR = Math.floor(drag.startIdx / size);
    const startC = drag.startIdx % size;
    const cells = lineCells(startR, startC, hit.r, hit.c);
    setDragLine(cells || [drag.startIdx]);
  }, [cellAtPoint, lineCells, size]);

  const flashError = useCallback((cells) => {
    setErrorCells(new Set(cells));
    setTimeout(() => setErrorCells(null), 380);
  }, []);

  const onPointerUp = useCallback((e) => {
    const drag = dragRef.current;
    if (!drag.active) return;
    wrapperRef.current?.releasePointerCapture?.(drag.pointerId);
    dragRef.current = { active: false, startIdx: null, lastIdx: null, moved: false };
    setDragLine(null);

    if (drag.moved) {
      // ── Drag selection ──
      const startR = Math.floor(drag.startIdx / size);
      const startC = drag.startIdx % size;
      const endR = Math.floor(drag.lastIdx / size);
      const endC = drag.lastIdx % size;
      const cells = lineCells(startR, startC, endR, endC);
      if (!cells) return;
      const match = tryMatch(cells);
      if (match) {
        onWordFound(match.word, match.cells);
        setSelection([]);
      } else {
        flashError(cells);
        setSelection([]);
      }
    } else {
      // ── Tap-per-letter selection ──
      const idx = drag.startIdx;
      setSelection(prev => {
        // Tapping the same last cell cancels
        if (prev.length > 0 && prev[prev.length - 1] === idx) {
          return [];
        }
        // Extend if adjacent + same direction
        if (extendsLine(prev, idx)) {
          const next = [...prev, idx];
          // Try matching after each tap
          const match = tryMatch(next);
          if (match) {
            // Schedule the parent state update outside the setter to avoid double-fire
            queueMicrotask(() => onWordFound(match.word, match.cells));
            return [];
          }
          return next;
        }
        // Doesn't extend — start a new selection at this cell
        return [idx];
      });
    }
  }, [extendsLine, flashError, lineCells, onWordFound, tryMatch, size]);

  // ── Cleanup if component unmounts mid-drag ──
  useEffect(() => () => { dragRef.current.active = false; }, []);

  // Build set of cell indices that are currently highlighted (drag preview or tap selection)
  const previewSet = dragLine ? new Set(dragLine) : new Set(selection);

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div
      ref={wrapperRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${size}, 1fr)`,
        gap: 2,
        background: 'rgba(10,8,6,0.78)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        padding: 8,
        borderRadius: 12,
        border: `1px solid ${P.border}`,
        boxShadow: '0 8px 26px rgba(0,0,0,0.5)',
        maxWidth: 580,
        margin: '0 auto',
        touchAction: 'none',
        userSelect: 'none',
        position: 'relative',
      }}
    >
      {grid.letters.map((letter, idx) => {
        const isFound = foundCells.has(idx);
        const isPreview = previewSet.has(idx);
        const isStart = dragRef.current.active && idx === dragRef.current.startIdx;
        const isError = errorCells?.has(idx);
        let bg = 'rgba(255,255,255,0.04)';
        let color = '#FAF6F0';
        let border = `1px solid rgba(255,255,255,0.06)`;
        if (isFound) {
          bg = 'rgba(201,169,110,0.32)';
          color = '#1A1612';
          border = `1px solid rgba(201,169,110,0.5)`;
        } else if (isError) {
          bg = 'rgba(220,80,80,0.4)';
          border = `1px solid rgba(220,80,80,0.6)`;
        } else if (isPreview) {
          bg = isStart ? 'rgba(232,212,160,0.55)' : 'rgba(232,212,160,0.22)';
          border = `1px solid ${P.borderH}`;
        }
        return (
          <div
            key={idx}
            data-cell={idx}
            style={{
              aspectRatio: '1 / 1',
              background: bg,
              color,
              border,
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontFamily: SANS,
              fontWeight: 700,
              fontSize: `min(${Math.floor(560 / size * 0.5)}px, calc((100vw - 56px) / ${size} * 0.5))`,
              userSelect: 'none',
              transition: 'background 0.08s',
            }}
          >
            {letter}
          </div>
        );
      })}
    </div>
  );
}
