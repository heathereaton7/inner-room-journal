/**
 * Word search grid generation.
 *
 * Given a list of words and a grid size, places each word into the grid in
 * one of the 8 directions (horizontal/vertical/diagonal, both forwards and
 * backwards). Allows overlap when letters match. Falls back to growing the
 * grid if a word cannot fit. Fills remaining cells with random letters.
 *
 * Deterministic per (puzzleId + size + words) so the same puzzle always
 * looks the same — important because progress is keyed by cell index.
 */

const DIRECTIONS = [
  { dr:  0, dc:  1 }, // →
  { dr:  0, dc: -1 }, // ←
  { dr:  1, dc:  0 }, // ↓
  { dr: -1, dc:  0 }, // ↑
  { dr:  1, dc:  1 }, // ↘
  { dr: -1, dc: -1 }, // ↖
  { dr:  1, dc: -1 }, // ↙
  { dr: -1, dc:  1 }, // ↗
];

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// Simple seeded RNG so puzzle layout is stable across reloads
function makeRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function stringSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Generate a word search grid.
 *
 *   puzzleId   — string used as RNG seed for stability
 *   size       — grid side (e.g. 12 → 12x12)
 *   words      — array of uppercase words to hide
 *
 * Returns:
 *   {
 *     size,
 *     letters: string[size*size],
 *     placements: { word: { r, c, dr, dc, cells: [idx, ...] } }
 *     unplaced: string[] (words that couldn't fit — should be empty in practice)
 *   }
 */
export function generateGrid(puzzleId, size, words) {
  const rng = makeRng(stringSeed(puzzleId + ':' + size + ':' + words.join(',')));

  // Sort words longest-first to ease placement
  const sorted = [...words].sort((a, b) => b.length - a.length);

  // Try multiple full attempts to avoid getting stuck
  for (let attempt = 0; attempt < 12; attempt++) {
    const grid = new Array(size * size).fill(null);
    const placements = {};
    const unplaced = [];

    for (const word of sorted) {
      // For each word, try up to N random positions/directions
      let placed = false;
      const tries = 200;
      for (let t = 0; t < tries; t++) {
        const dir = DIRECTIONS[Math.floor(rng() * DIRECTIONS.length)];
        const r0 = Math.floor(rng() * size);
        const c0 = Math.floor(rng() * size);
        const r1 = r0 + dir.dr * (word.length - 1);
        const c1 = c0 + dir.dc * (word.length - 1);
        if (r1 < 0 || r1 >= size || c1 < 0 || c1 >= size) continue;

        // Check fit
        let ok = true;
        for (let i = 0; i < word.length; i++) {
          const r = r0 + dir.dr * i;
          const c = c0 + dir.dc * i;
          const idx = r * size + c;
          const cur = grid[idx];
          if (cur !== null && cur !== word[i]) { ok = false; break; }
        }
        if (!ok) continue;

        // Place
        const cells = [];
        for (let i = 0; i < word.length; i++) {
          const r = r0 + dir.dr * i;
          const c = c0 + dir.dc * i;
          const idx = r * size + c;
          grid[idx] = word[i];
          cells.push(idx);
        }
        placements[word] = { r: r0, c: c0, dr: dir.dr, dc: dir.dc, cells };
        placed = true;
        break;
      }
      if (!placed) unplaced.push(word);
    }

    if (unplaced.length === 0) {
      // Fill empty cells with random letters
      const letters = new Array(size * size);
      for (let i = 0; i < size * size; i++) {
        letters[i] = grid[i] !== null ? grid[i] : LETTERS[Math.floor(rng() * 26)];
      }
      return { size, letters, placements, unplaced: [] };
    }
  }

  // Final fallback — return whatever we have, even with unplaced words
  const grid = new Array(size * size).fill(null);
  const placements = {};
  const unplaced = [...sorted];
  const letters = new Array(size * size);
  for (let i = 0; i < size * size; i++) {
    letters[i] = grid[i] !== null ? grid[i] : LETTERS[Math.floor(rng() * 26)];
  }
  return { size, letters, placements, unplaced };
}

/**
 * Check whether the cells from (r1,c1) to (r2,c2) form a valid straight
 * line that spells one of the unfound target words. Returns the matching
 * word + cell indices, or null.
 */
export function checkSelection(grid, r1, c1, r2, c2, targetWords) {
  const dr = Math.sign(r2 - r1);
  const dc = Math.sign(c2 - c1);
  const adr = Math.abs(r2 - r1);
  const adc = Math.abs(c2 - c1);
  // Must be horizontal, vertical, or 45° diagonal
  if (!(adr === 0 || adc === 0 || adr === adc)) return null;

  const len = Math.max(adr, adc) + 1;
  if (len < 2) return null;

  const cells = [];
  let s = '';
  for (let i = 0; i < len; i++) {
    const r = r1 + dr * i;
    const c = c1 + dc * i;
    if (r < 0 || r >= grid.size || c < 0 || c >= grid.size) return null;
    const idx = r * grid.size + c;
    cells.push(idx);
    s += grid.letters[idx];
  }
  const reversed = s.split('').reverse().join('');
  for (const word of targetWords) {
    if (word === s) return { word, cells };
    if (word === reversed) return { word, cells: cells.slice().reverse() };
  }
  return null;
}
