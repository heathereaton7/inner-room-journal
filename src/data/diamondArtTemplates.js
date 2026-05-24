/**
 * Diamond Art Templates — Scripture-inspired designs.
 *
 * 40×40 grids (1600 cells) with rich palettes (12-15 colors per design)
 * and procedural shape rendering for Dazzly-like gradient depth.
 *
 * Each template uses positional shading functions to give the art
 * realistic light/shadow ramps rather than flat color blocks.
 *
 * Special premium templates use 100-color palettes with pearl/sparkle gems.
 */

import { ramp, makeEntries, joinPalette } from './diamondArtPalette.js';

const COLS = 40;
const ROWS = 40;

// ── Helpers ────────────────────────────────────────────────────────────────
const idx = (r, c) => r * COLS + c;

function emptyCells() {
  return new Array(COLS * ROWS).fill(0);
}

function setCell(cells, r, c, colorId) {
  if (r >= 0 && r < ROWS && c >= 0 && c < COLS) cells[idx(r, c)] = colorId;
}

/**
 * fillShape(cells, predicate, colorFn) — for every cell that matches predicate(r,c,dist…),
 * assigns the colorId returned by colorFn(r,c,…). Skips when colorFn returns 0/null.
 */
function fillRegion(cells, fn) {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const colorId = fn(r, c);
      if (colorId && colorId > 0) cells[idx(r, c)] = colorId;
    }
  }
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// Pick palette index from a normalized depth value t in [0..1]
// using a band-list [lo, hi, colorId].
function bandPick(t, bands) {
  for (const [lo, hi, c] of bands) {
    if (t >= lo && t < hi) return c;
  }
  return bands[bands.length - 1][2];
}

// Build the 100-color palette for Lilies of the Field
function buildLiliesPalette() {
  // 1-18: sky ramp — dawn pink → cream → pale blue (18 shades)
  const sky = ramp([
    '#F8C9D8', '#F4D0CE', '#F4E2D2', '#F8EBD6', '#FAF2DC',
    '#F8F0D8', '#F4ECD0', '#EFE6C8', '#E8DBC2', '#E0D8C0',
    '#D8D8C0', '#CCD8C8', '#C0D8D0', '#B4D4D6', '#A8CFDC',
    '#A0CCDC', '#98C8DC', '#90C4DC',
  ], 18);
  // 19-32: light grass (14)
  const lightGrass = ramp([
    '#C8E0A0', '#BCDA98', '#B0D08C', '#A4C880', '#98C078',
    '#8CB870', '#80B068', '#74A858', '#68A050', '#5C9848',
    '#509040', '#488838', '#408030', '#387828',
  ], 14);
  // 33-50: deep grass shadow band (18)
  const deepGrass = ramp([
    '#347224', '#306820', '#2C601C', '#285818', '#245014',
    '#204810', '#1C400C', '#183808', '#143004', '#102800',
    '#0C2400', '#082000', '#061C00', '#041800', '#021400',
    '#021004', '#020C08', '#02080C',
  ], 18);
  // 51-68: petal whites (18) — shadow to highlight
  const petalWhites = ramp([
    '#988A78', '#A89A88', '#B8AC98', '#C8BEA8', '#D8D0B8',
    '#E0DBC4', '#E8E5D0', '#F0EDDC', '#F4F0E2', '#F8F4E8',
    '#FAF7ED', '#FBF9F0', '#FCFAF4', '#FDFBF6', '#FEFCF8',
    '#FEFDFA', '#FFFEFC', '#FFFFFF',
  ], 18);
  // 69-80: gold center (12) — bright cream-gold to deep gold
  const goldCenter = ramp([
    '#FFF8D0', '#FFEFA8', '#FFE486', '#FFD86A', '#F8C84C',
    '#EAB438', '#D89E28', '#C08B20', '#A87018', '#905810',
    '#78400C', '#603008',
  ], 12);
  // 81-86: petal sparkles (sparkle: true)
  const sparkles = ['#FFFFFF', '#FFFEF8', '#FFFCEC', '#FAF4D8', '#F8E8AC', '#FFD888'];
  // 87-92: pearl petal highlights (pearl: true)
  const pearls = ['#F8E8E4', '#F0E4F0', '#E8E8F4', '#F4F0E8', '#FCFBF8', '#FFFCF4'];
  // 93-96: stem/leaf greens (4)
  const stemLeaf = ['#2C401C', '#385020', '#486028', '#5A7830'];
  // 97-100: small lily rose accents (4)
  const roseAccent = ['#D88090', '#E89AA8', '#F4B0BC', '#F8C8D0'];

  return joinPalette(
    makeEntries(sky, 'Sky', 0),
    makeEntries(lightGrass, 'Light grass', 0),
    makeEntries(deepGrass, 'Deep grass', 0),
    makeEntries(petalWhites, 'Petal', 0),
    makeEntries(goldCenter, 'Gold', 0),
    makeEntries(sparkles, 'Sparkle', 0, { sparkle: true }),
    makeEntries(pearls, 'Pearl', 0, { pearl: true }),
    makeEntries(stemLeaf, 'Leaf', 0),
    makeEntries(roseAccent, 'Rose', 0),
  );
}

// ── Template 1: Lilies of the Field (100 colors) ──────────────────────────
//
// Palette layout (100 total):
//   1-18:   sky ramp (dawn pink → cream → pale blue) [pearl on highlights]
//   19-32:  light grass / midground (yellow-green to mid green) [14]
//   33-50:  deep grass shadow band (mid → forest) [18]
//   51-68:  petal whites (shadow → highlight → shine) [18]
//   69-80:  gold center (deep gold → bright cream-gold) [12]
//   81-86:  petal sparkles (sparkle: true) [6]
//   87-92:  pearl petal highlights (pearl: true) [6]
//   93-96:  stem/leaf greens (deep, mid, light, bright) [4]
//   97-100: small lily rose accents (deep → bright rose) [4]
function buildLilies() {
  const cells = emptyCells();

  // ── Sky gradient (rows 0..23) — uses ids 1-18 ──
  fillRegion(cells, (r, c) => {
    if (r >= 24) return 0;
    // Vertical t with subtle horizontal warmth (sun on the right)
    const vt = r / 23;
    const warmth = (c / COLS) * 0.08;
    const t = clamp(vt - warmth, 0, 1);
    return Math.round(1 + t * 17); // 1..18
  });

  // ── Grass — bottom rows 24..ROWS-1 ──
  fillRegion(cells, (r, c) => {
    if (r < 24) return 0;
    const t = (r - 24) / (ROWS - 24);
    // Gentle horizontal wave for natural feel
    const wave = Math.sin(c * 0.45) * 0.05 + Math.cos(c * 0.27 + r * 0.18) * 0.04;
    const v = clamp(t + wave, 0, 1);
    if (v < 0.4) {
      // Light grass (19-32) — 14 shades
      return Math.round(19 + (v / 0.4) * 13);
    }
    // Deep grass shadow band (33-50) — 18 shades
    const dt = (v - 0.4) / 0.6;
    return Math.round(33 + dt * 17);
  });

  // ── Central lily flower around (r=18, c=20), radius ~9 ──
  const cx = 20, cy = 18;
  fillRegion(cells, (r, c) => {
    const dx = c - cx, dy = r - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 9.5) return 0;
    // Six-petal pattern using angle
    const angle = Math.atan2(dy, dx);
    const petalAngle = (angle + Math.PI) / (Math.PI * 2) * 6;
    const petalT = Math.abs((petalAngle % 1) - 0.5) * 2; // 0 center-of-petal, 1 edge
    const petalRadius = 8.5 - petalT * 3;
    if (dist > petalRadius) return 0;

    // Inner gold core (ids 69-80, 12 shades — bright center to deeper edge)
    if (dist < 3.5) {
      const t = dist / 3.5; // 0 center, 1 edge of core
      // bright center → mid → deeper at edge
      return Math.round(69 + t * 11);
    }

    // Petal — composite of distance from center and petal angle for shading
    // Bright highlight along the spine (low petalT) on upper petals (negative dy)
    const isUpperPetal = dy < 0;
    const along = (petalRadius - dist) / Math.max(0.1, petalRadius - 3.5); // 0 at outer edge, 1 at gold-core boundary
    const acrossLight = 1 - petalT;            // 1 along spine, 0 at edge

    // Lit term: brighter when light from upper-left (compute pseudo-normal)
    const light = clamp(0.45 + acrossLight * 0.55 + along * 0.25 + (isUpperPetal ? 0.15 : -0.05), 0, 1);

    // Petal whites ramp (51-68) — 18 shades, low light = shadow, high light = bright
    const baseId = Math.round(51 + light * 17);

    // Sparkle on hottest along-spine highlight of front-facing petals
    if (acrossLight > 0.85 && along > 0.55 && along < 0.85) {
      // Random-ish sparkle gem (ids 81-86)
      const sparkleIdx = ((r * 7 + c * 3) % 6);
      return 81 + sparkleIdx;
    }

    // Pearl shimmer on inner-curve of petals
    if (along > 0.7 && acrossLight < 0.4) {
      const pearlIdx = ((r + c) % 6);
      return 87 + pearlIdx;
    }

    return baseId;
  });

  // ── Stem (id 93-95 — leaf greens) ──
  for (let r = 28; r < 38; r++) {
    setCell(cells, r, 20, 93);
    if (r > 30) setCell(cells, r, 21, 94);
  }
  // ── Leaves around stem ──
  const leafCells = [
    [31, 17], [31, 18], [32, 16], [32, 17], [32, 18], [33, 17], [33, 18],
    [31, 22], [31, 23], [32, 22], [32, 23], [32, 24], [33, 22], [33, 23],
  ];
  leafCells.forEach(([r, c], i) => setCell(cells, r, c, 93 + (i % 4)));

  // ── Side smaller lilies (rose 97-100) ──
  const smallLilies = [[34, 7], [34, 33], [30, 5], [30, 35]];
  smallLilies.forEach(([rr, cc]) => {
    for (let dr = -2; dr <= 2; dr++) {
      for (let dc = -2; dc <= 2; dc++) {
        const d = Math.sqrt(dr * dr + dc * dc);
        if (d <= 2) {
          // Inner = bright, outer = deeper rose
          const t = 1 - d / 2;
          const id = Math.round(97 + t * 3); // 97-100
          setCell(cells, rr + dr, cc + dc, id);
        }
      }
    }
  });

  // ── Drifting dew/petal sparkles in the sky ──
  const sparkles = [
    [3, 5], [4, 12], [2, 22], [5, 30], [7, 6],
    [9, 34], [12, 4], [11, 28], [13, 14], [16, 32], [15, 3], [17, 38],
    [6, 18], [10, 10],
  ];
  sparkles.forEach(([r, c], i) => setCell(cells, r, c, 81 + (i % 6)));

  // ── Pearl droplets on petals & leaves ──
  const pearlSpots = [
    [16, 21], [15, 19], [18, 22], [33, 18], [33, 22],
    [21, 16], [21, 24], [30, 18],
  ];
  pearlSpots.forEach(([r, c], i) => setCell(cells, r, c, 87 + (i % 6)));

  return cells;
}

// ── Template 2: Stars in the Sky ──────────────────────────────────────────
function buildStars() {
  const cells = emptyCells();
  // Sky vertical gradient — deep indigo at zenith to navy at horizon
  fillRegion(cells, (r, c) => {
    const t = r / ROWS;
    // soft horizontal variation
    const noise = Math.sin(c * 0.3 + r * 0.2) * 0.04;
    const v = clamp(t + noise, 0, 1);
    return bandPick(v, [
      [0, 0.15, 1],  // deepest indigo
      [0.15, 0.35, 2],
      [0.35, 0.55, 3],
      [0.55, 0.75, 4],
      [0.75, 1.0, 5], // horizon glow
    ]);
  });
  // Distant clouds at horizon (subtle)
  fillRegion(cells, (r, c) => {
    if (r < 30) return 0;
    const cloud = Math.sin(c * 0.4) * 1.5 + Math.sin(c * 0.8 + 1) * 1.2;
    if (r > 32 + cloud && r < 34 + cloud) return 6;
    return 0;
  });
  // Moon — top-right crescent
  const mcx = 30, mcy = 9;
  fillRegion(cells, (r, c) => {
    const d = Math.sqrt((c - mcx) ** 2 + (r - mcy) ** 2);
    if (d < 4.5) {
      // crescent: cut out part toward bottom-left
      const cutD = Math.sqrt((c - mcx + 1.8) ** 2 + (r - mcy + 1.5) ** 2);
      if (cutD < 4) return 0; // cut out
      // Moon body shading
      if (d < 1.5) return 9;  // brightest
      if (d < 3) return 8;
      if (d < 4) return 7;
      return 10; // edge
    }
    return 0;
  });
  // Moon halo glow (subtle)
  fillRegion(cells, (r, c) => {
    const d = Math.sqrt((c - mcx) ** 2 + (r - mcy) ** 2);
    if (d > 4.5 && d < 6) {
      // only assign if it's still sky
      const i = idx(r, c);
      if (cells[i] >= 1 && cells[i] <= 5) return 11; // pale moon glow
    }
    return 0;
  });
  // Stars with halos
  const stars = [
    [4, 6], [3, 14], [5, 20], [2, 26], [7, 34], [9, 10], [11, 25],
    [13, 4], [14, 17], [16, 8], [16, 30], [18, 14], [19, 22],
    [20, 3], [21, 36], [23, 11], [24, 28], [26, 6], [27, 19], [28, 14], [29, 33],
  ];
  stars.forEach(([r, c]) => {
    // Halo ring
    for (let dr = -2; dr <= 2; dr++) {
      for (let dc = -2; dc <= 2; dc++) {
        const d = Math.sqrt(dr * dr + dc * dc);
        if (d > 1.2 && d < 2.0) {
          const cellIdx = idx(r + dr, c + dc);
          if (cellIdx >= 0 && cellIdx < cells.length) {
            const cur = cells[cellIdx];
            if (cur >= 1 && cur <= 5) cells[cellIdx] = 12; // glow
          }
        }
      }
    }
    // Star body — cross/plus pattern
    setCell(cells, r, c, 14);     // bright core
    setCell(cells, r - 1, c, 13); // top
    setCell(cells, r + 1, c, 13); // bottom
    setCell(cells, r, c - 1, 13);
    setCell(cells, r, c + 1, 13);
  });
  return cells;
}

// ── Template 3: He Lifts Mine Eyes — Mountains ────────────────────────────
function buildMountains() {
  const cells = emptyCells();
  // Sky — vertical gradient sunrise (peach -> rose -> lavender -> blue)
  fillRegion(cells, (r, c) => {
    const t = r / 22;
    if (r > 22) return 0;
    return bandPick(t, [
      [0, 0.18, 1],   // top peach
      [0.18, 0.40, 2], // rose
      [0.40, 0.62, 3], // soft pink
      [0.62, 0.85, 4], // lavender
      [0.85, 1.5, 5], // pale blue
    ]);
  });
  // Sun — circular gradient
  const scx = 12, scy = 10;
  fillRegion(cells, (r, c) => {
    const d = Math.sqrt((c - scx) ** 2 + (r - scy) ** 2);
    if (d < 5) {
      if (d < 1.5) return 7;  // brightest core
      if (d < 3) return 6;
      return 8; // soft outer
    }
    return 0;
  });
  // Far mountain layer (lavender)
  fillRegion(cells, (r, c) => {
    const peak1 = 14 + Math.round(3 * Math.sin(c * 0.4 + 0.5));
    const peak2 = 12 + Math.round(2 * Math.sin(c * 0.6 + 2));
    const peakLine = Math.min(peak1, peak2);
    if (r >= peakLine && r <= 22) {
      const t = (r - peakLine) / (22 - peakLine);
      return bandPick(t, [
        [0, 0.3, 9],
        [0.3, 0.7, 10],
        [0.7, 1.5, 11],
      ]);
    }
    return 0;
  });
  // Middle mountain layer (mid blue)
  fillRegion(cells, (r, c) => {
    const peak = 18 + Math.round(4 * Math.sin(c * 0.35 + 3) + 2 * Math.sin(c * 0.8 + 1));
    if (r >= peak && r <= 27) {
      const t = (r - peak) / (27 - peak);
      return bandPick(t, [
        [0, 0.3, 12],
        [0.3, 0.7, 13],
        [0.7, 1.5, 14],
      ]);
    }
    return 0;
  });
  // Foreground mountain (deep blue) with snow caps
  fillRegion(cells, (r, c) => {
    const peak = 21 + Math.round(5 * Math.sin(c * 0.25 + 1) + 2 * Math.sin(c * 0.6));
    if (r >= peak && r <= 30) {
      const t = (r - peak) / Math.max(1, 30 - peak);
      // Snow line near peak
      if (t < 0.18) return 15; // snow
      if (t < 0.30) return 16; // snow shadow
      return bandPick(t, [
        [0.30, 0.55, 17],
        [0.55, 0.80, 18],
        [0.80, 1.5, 19],
      ]);
    }
    return 0;
  });
  // Lake (bottom)
  fillRegion(cells, (r, c) => {
    if (r < 30) return 0;
    const t = (r - 30) / (ROWS - 30);
    return bandPick(t, [
      [0, 0.3, 20],
      [0.3, 0.7, 21],
      [0.7, 1.5, 22],
    ]);
  });
  // Sun reflection in lake
  for (let dr = 0; dr < 4; dr++) {
    const r = 31 + dr;
    if (r < ROWS) {
      const len = 5 - dr;
      for (let dc = -len; dc <= len; dc++) {
        if (Math.random() > 0.3) setCell(cells, r, scx + dc, 6);
      }
    }
  }
  return cells;
}

// ── Template 4: Dove with Olive Branch ────────────────────────────────────
function buildDove() {
  const cells = emptyCells();
  // Sky — soft pale gradient
  fillRegion(cells, (r, c) => {
    const t = r / ROWS;
    return bandPick(t, [
      [0, 0.4, 1],
      [0.4, 0.7, 2],
      [0.7, 1.5, 3],
    ]);
  });
  // Light rays from upper right (subtle)
  fillRegion(cells, (r, c) => {
    // diagonal rays
    const beam = Math.sin((r + c) * 0.6) * 0.5 + 0.5;
    if (c > 25 && r < 18 && beam > 0.85) {
      const i = idx(r, c);
      if (cells[i] >= 1 && cells[i] <= 3) return 4; // light ray
    }
    return 0;
  });
  // Dove body — centered around (r=22, c=20)
  const bcx = 20, bcy = 22;
  fillRegion(cells, (r, c) => {
    // Body ellipse
    const dx = (c - bcx) / 6;
    const dy = (r - bcy) / 4;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d < 1.0) {
      // Body shading — top is brighter (light from above)
      const shade = (r - (bcy - 4)) / 8; // 0 top -> 1 bottom
      if (shade < 0.25) return 5;  // brightest white
      if (shade < 0.55) return 6;  // pale white
      if (shade < 0.85) return 7;  // mid grey-white
      return 8; // shadow
    }
    return 0;
  });
  // Head — small circle to the right of body
  const hcx = 27, hcy = 19;
  fillRegion(cells, (r, c) => {
    const d = Math.sqrt((c - hcx) ** 2 + (r - hcy) ** 2);
    if (d < 2.5) {
      if (d < 1) return 5;
      if (d < 2) return 6;
      return 7;
    }
    return 0;
  });
  // Beak (gold/peach)
  setCell(cells, hcy, hcx + 3, 9);
  setCell(cells, hcy, hcx + 2, 9);
  setCell(cells, hcy + 1, hcx + 3, 10);
  // Eye
  setCell(cells, hcy - 1, hcx + 1, 11);
  // Wing — extended upward and back
  const wingCells = [
    [18, 18], [18, 19], [18, 20], [18, 21],
    [19, 17], [19, 18], [19, 19], [19, 20], [19, 21],
    [20, 17], [20, 18], [20, 19], [20, 20],
    [17, 19], [17, 20], [17, 21],
    [16, 20], [16, 21],
  ];
  wingCells.forEach(([r, c], i) => {
    // Shading: outer feathers darker
    const isEdge = i < 5 || (i > 13);
    setCell(cells, r, c, isEdge ? 8 : 7);
  });
  // Wing tips with highlights
  setCell(cells, 16, 21, 6);
  setCell(cells, 17, 21, 6);
  // Tail feathers
  const tailCells = [
    [22, 14], [22, 13], [23, 14], [23, 13], [24, 14], [24, 15],
    [21, 14], [22, 12],
  ];
  tailCells.forEach(([r, c]) => setCell(cells, r, c, 7));
  setCell(cells, 22, 12, 8); // shadow at tail
  // Olive branch in beak — extending right and up
  const olive = [
    [19, 31], [19, 32], [19, 33], [20, 32], [20, 33], [20, 34],
    [18, 32], [18, 33], [18, 34], [17, 33], [17, 34],
  ];
  olive.forEach(([r, c]) => setCell(cells, r, c, 12)); // leaf green
  // Olive berries (gold)
  setCell(cells, 17, 35, 13);
  setCell(cells, 18, 35, 13);
  setCell(cells, 20, 35, 13);
  // Branch (brown)
  setCell(cells, 19, 30, 14);
  setCell(cells, 19, 29, 14);
  return cells;
}

// ── Template 5: Light of the World — Lantern ──────────────────────────────
function buildLight() {
  const cells = emptyCells();
  const ccx = 20, ccy = 22; // lantern center

  // Dark background with radial halo
  fillRegion(cells, (r, c) => {
    const d = Math.sqrt((c - ccx) ** 2 + (r - ccy) ** 2);
    // Multiple halo bands
    if (d > 16) return 1;          // pitch
    if (d > 13) return 2;          // very dim
    if (d > 10) return 3;          // dim glow
    if (d > 8) return 4;           // soft amber
    if (d > 6) return 5;           // warm amber
    if (d > 4) return 6;           // bright gold
    return 7; // brightest core glow
  });

  // Lantern frame (brass)
  // Top cap (cone)
  for (let r = ccy - 9; r <= ccy - 7; r++) {
    const half = (r - (ccy - 10));
    for (let c = ccx - half; c <= ccx + half; c++) setCell(cells, r, c, 11);
  }
  // Chimney
  for (let r = ccy - 7; r <= ccy - 5; r++) {
    setCell(cells, r, ccx - 1, 12);
    setCell(cells, r, ccx, 11);
    setCell(cells, r, ccx + 1, 12);
  }
  // Top dome
  for (let r = ccy - 5; r <= ccy - 4; r++) {
    for (let c = ccx - 3; c <= ccx + 3; c++) setCell(cells, r, c, 11);
  }
  // Glass house — frame columns
  for (let r = ccy - 4; r <= ccy + 4; r++) {
    setCell(cells, r, ccx - 4, 12);
    setCell(cells, r, ccx + 4, 12);
  }
  // Glass shine (a few highlight cells inside)
  setCell(cells, ccy - 2, ccx - 3, 8); // glass shine left
  setCell(cells, ccy - 1, ccx - 3, 8);
  // Top and bottom brass bars
  for (let c = ccx - 4; c <= ccx + 4; c++) {
    setCell(cells, ccy - 4, c, 11);
    setCell(cells, ccy + 4, c, 11);
  }
  // Bottom base
  for (let r = ccy + 4; r <= ccy + 6; r++) {
    const w = 5 - (r - (ccy + 4));
    for (let c = ccx - w; c <= ccx + w; c++) {
      setCell(cells, r, c, r === ccy + 6 ? 13 : 12);
    }
  }
  // Hanging chain (top)
  for (let r = ccy - 14; r < ccy - 9; r++) {
    setCell(cells, r, ccx, r % 2 === 0 ? 11 : 12);
  }
  // Flame inside — teardrop shape (white-hot center)
  const flame = [
    [ccy - 2, ccx],
    [ccy - 1, ccx - 1], [ccy - 1, ccx], [ccy - 1, ccx + 1],
    [ccy, ccx - 1], [ccy, ccx], [ccy, ccx + 1],
    [ccy + 1, ccx - 1], [ccy + 1, ccx], [ccy + 1, ccx + 1],
    [ccy + 2, ccx],
  ];
  flame.forEach(([r, c], i) => {
    // Center brightest, edges orange
    if (r === ccy && c === ccx) setCell(cells, r, c, 14); // white-hot
    else if (Math.abs(r - ccy) + Math.abs(c - ccx) === 1) setCell(cells, r, c, 9); // gold
    else setCell(cells, r, c, 10); // orange edge
  });
  // Add a few floating embers
  setCell(cells, ccy - 6, ccx + 5, 9);
  setCell(cells, ccy + 1, ccx - 7, 10);
  setCell(cells, ccy - 4, ccx + 7, 10);
  return cells;
}

// ── Template 6: Clean Heart ──────────────────────────────────────────────
function buildHeart() {
  const cells = emptyCells();
  // Soft cream background with radial vignette
  fillRegion(cells, (r, c) => {
    const dx = (c - 20) / 22, dy = (r - 20) / 22;
    const d = Math.sqrt(dx * dx + dy * dy);
    return bandPick(d, [
      [0, 0.3, 1],     // brightest cream center
      [0.3, 0.6, 2],   // mid cream
      [0.6, 0.85, 3],  // dusty
      [0.85, 1.5, 4],  // edge shadow
    ]);
  });
  // Heart shape using parametric curve, scaled to grid
  // Calculate for each cell whether it falls inside the heart and where on it
  const heartCenterX = 20, heartCenterY = 22;
  const scale = 11;
  fillRegion(cells, (r, c) => {
    const x = (c - heartCenterX) / scale;
    const y = -(r - heartCenterY) / scale;
    // Heart inequality: (x^2 + y^2 - 1)^3 - x^2 * y^3 <= 0
    const v = Math.pow(x * x + y * y - 1, 3) - x * x * Math.pow(y, 3);
    if (v > 0) return 0;
    // Inside heart — shade by depth (more negative = more inside)
    const depth = -v;
    // Add light direction shading — light from upper-left
    const light = (-x * 0.7 + y * 0.7); // -1..1
    const composite = clamp(depth * 0.6 + light * 0.6 + 0.5, 0, 1);
    return bandPick(composite, [
      [0, 0.12, 5],   // deepest shadow (rose dark)
      [0.12, 0.26, 6], // shadow
      [0.26, 0.42, 7], // mid rose
      [0.42, 0.58, 8], // base rose
      [0.58, 0.72, 9], // light rose
      [0.72, 0.88, 10], // highlight pink
      [0.88, 1.5, 11], // brightest highlight
    ]);
  });
  // Bright shine spot upper-left of heart
  const shine = [[13, 14], [13, 15], [14, 13], [14, 14], [14, 15], [15, 14]];
  shine.forEach(([r, c]) => setCell(cells, r, c, 12));
  // Tiny sparkle stars around heart
  const sparkles = [
    [5, 6], [4, 14], [3, 26], [6, 33],
    [10, 4], [12, 35], [18, 3], [19, 36],
    [28, 4], [27, 35], [34, 8], [35, 30], [36, 18],
  ];
  sparkles.forEach(([r, c], i) => {
    const colorId = i % 2 === 0 ? 13 : 14;
    setCell(cells, r, c, colorId);
    // Tiny cross
    if (i % 3 === 0) {
      setCell(cells, r - 1, c, 14);
      setCell(cells, r + 1, c, 14);
      setCell(cells, r, c - 1, 14);
      setCell(cells, r, c + 1, 14);
      setCell(cells, r, c, 13);
    }
  });
  return cells;
}

// ──────────────────────────────────────────────────────────────────────────
// PREMIUM 100-COLOR TEMPLATES (with pearls + sparkles)
// ──────────────────────────────────────────────────────────────────────────

// Build the 100-color palette for Crown of Life
function buildCrownPalette() {
  // 1-18: gold ramp (deep to bright)
  const gold = ramp([
    '#1A0F03', '#3A2208', '#5A3812', '#7A5018', '#9A6820',
    '#B47830', '#C9904A', '#D8A655', '#E4B868', '#EDC97A',
    '#F4D88A', '#FAE5A0', '#FCEFB8', '#FFF4CC', '#FFF8D8',
    '#FFFBE6', '#FFFDF0', '#FFFEF8',
  ], 18);
  // 19-30: pearl ramp (subtle hue shifts, pearl=true)
  const pearl = [
    '#F4E8E8', '#F8EEEE', '#FCF4F4', '#F8F0E8',
    '#F0E8F0', '#E8F0F4', '#F4F8FC', '#FAFAFA',
    '#FFFCFC', '#FFFFFF', '#FFF8F0', '#F8F4FC',
  ];
  // 31-42: sapphire blue ramp
  const sapphire = ramp([
    '#0A0828', '#181848', '#222870', '#28389A',
    '#3050C0', '#3870E0', '#5090F0', '#70B0F8',
    '#A0CCFC', '#C8E0FE', '#E0EEFF', '#F0F8FF',
  ], 12);
  // 43-54: ruby red ramp
  const ruby = ramp([
    '#1A0408', '#400810', '#600C18', '#801028',
    '#A01838', '#C02050', '#D8385A', '#E85870',
    '#F08090', '#F8A8B4', '#FCCCD4', '#FFE4EC',
  ], 12);
  // 55-66: emerald green ramp
  const emerald = ramp([
    '#021008', '#082818', '#0C4028', '#105838',
    '#187048', '#208860', '#28A078', '#48B89A',
    '#78D0B8', '#A8E0CC', '#D0EEDC', '#E8F8F0',
  ], 12);
  // 67-78: amethyst purple ramp
  const amethyst = ramp([
    '#0A0418', '#1A0830', '#301050', '#481870',
    '#603090', '#7848B0', '#9068C8', '#A888D8',
    '#C0A8E4', '#D8C8EC', '#ECE0F4', '#F8F0FC',
  ], 12);
  // 79-86: sparkle white (sparkle=true)
  const sparkle = ['#FFFFFF', '#FCFCFF', '#F8F8FF', '#F4F4FC', '#FCFCFC', '#FFFEF0', '#FEF8D8', '#FAEFB0'];
  // 87-94: shadow brown (8)
  const shadow = ramp(['#0A0604', '#1A0E08', '#28180C', '#382010', '#482814', '#583018', '#68381C', '#784020'], 8);
  // 95-100: velvet purple background (6)
  const velvet = ramp(['#08051A', '#0E0820', '#180A2C', '#241038', '#321848', '#3E2058'], 6);

  return joinPalette(
    makeEntries(gold, 'Gold', 0),
    makeEntries(pearl, 'Pearl', 0, { pearl: true }),
    makeEntries(sapphire, 'Sapphire', 0),
    makeEntries(ruby, 'Ruby', 0),
    makeEntries(emerald, 'Emerald', 0),
    makeEntries(amethyst, 'Amethyst', 0),
    makeEntries(sparkle, 'Sparkle', 0, { sparkle: true }),
    makeEntries(shadow, 'Shadow', 0),
    makeEntries(velvet, 'Velvet', 0),
  );
}

// Build the 100-color palette for New Jerusalem (Pearl Gates)
function buildPearlGatesPalette() {
  // 1-20: pearl iridescent ramps with subtle hue shifts (pearl=true)
  const pearls = [
    '#FFFFFF', '#FFFCFC', '#FCFCFF', '#FCF8F4', '#F8F4F0',
    '#F4F0F4', '#F0F4F8', '#E8ECF4', '#ECECEC', '#E0E8E8',
    '#F8F4E8', '#F4ECE0', '#ECE8E4', '#F8F0F0', '#F0E8E8',
    '#E4ECEC', '#E8F0E8', '#F0F4E8', '#F8F8E8', '#FFFEF0',
  ];
  // 21-30: golden street (sparkle=true on brightest)
  const street = ramp([
    '#6A4818', '#8B6020', '#B07A30', '#D49D40',
    '#E8C25C', '#F4DC78', '#FAE8A0', '#FCEFB8',
    '#FFF4CC', '#FFFADC',
  ], 10);
  // 31-36: jasper (red)
  const jasper = ramp(['#2A0808', '#5A1810', '#80281C', '#A03830', '#B85048', '#D87068'], 6);
  // 37-42: sapphire
  const sapphire = ramp(['#080828', '#1C2858', '#304080', '#4860A8', '#6080C8', '#88A8E0'], 6);
  // 43-48: chalcedony (pale blue/white)
  const chalcedony = ramp(['#3A4858', '#5A6878', '#7888A0', '#9CACC0', '#BCD0E0', '#DCE8F0'], 6);
  // 49-54: emerald
  const emerald = ramp(['#082018', '#0C3828', '#185040', '#286858', '#408878', '#68A89A'], 6);
  // 55-60: sardonyx (pale orange-pink)
  const sardonyx = ramp(['#3A1A14', '#5A2A20', '#80483A', '#A0685A', '#C0887A', '#D8A89A'], 6);
  // 61-66: sardius (deep orange-red)
  const sardius = ramp(['#3A1004', '#5A1808', '#7A2810', '#9A3818', '#BA5028', '#D87040'], 6);
  // 67-72: chrysolite (gold-green)
  const chrysolite = ramp(['#1A2008', '#383C10', '#585820', '#787838', '#989858', '#B8B878'], 6);
  // 73-78: beryl (sea green)
  const beryl = ramp(['#082028', '#103840', '#185860', '#287880', '#4898A0', '#78B8C0'], 6);
  // 79-82: topaz (golden yellow)
  const topaz = ramp(['#3A2808', '#806020', '#C09838', '#F8D060'], 4);
  // 83-86: chrysoprasus (yellow-green)
  const chrysoprasus = ramp(['#1A2808', '#384818', '#586828', '#80983C'], 4);
  // 87-90: jacinth (orange)
  const jacinth = ramp(['#3A2008', '#704018', '#A86828', '#E89848'], 4);
  // 91-94: amethyst
  const amethyst = ramp(['#180828', '#382058', '#583890', '#8060B8'], 4);
  // 95-100: sky glow above gates (6)
  const skyGlow = ramp(['#181230', '#241848', '#3A2868', '#583890', '#7858B0', '#A088D0'], 6);

  return joinPalette(
    makeEntries(pearls, 'Pearl', 0, { pearl: true }),
    makeEntries(street.slice(0, 8), 'Street', 0),
    makeEntries(street.slice(8), 'Street shine', 0, { sparkle: true }),
    makeEntries(jasper, 'Jasper', 0),
    makeEntries(sapphire, 'Sapphire', 0),
    makeEntries(chalcedony, 'Chalcedony', 0),
    makeEntries(emerald, 'Emerald', 0),
    makeEntries(sardonyx, 'Sardonyx', 0),
    makeEntries(sardius, 'Sardius', 0),
    makeEntries(chrysolite, 'Chrysolite', 0),
    makeEntries(beryl, 'Beryl', 0),
    makeEntries(topaz, 'Topaz', 0),
    makeEntries(chrysoprasus, 'Chrysoprasus', 0),
    makeEntries(jacinth, 'Jacinth', 0),
    makeEntries(amethyst, 'Amethyst', 0),
    makeEntries(skyGlow, 'Sky', 0),
  );
}

// ── Template 7: Crown of Life ─────────────────────────────────────────────
function buildCrown() {
  const cells = emptyCells();
  // Velvet purple background with radial vignette (palette 95-100)
  fillRegion(cells, (r, c) => {
    const dx = (c - 20) / 24, dy = (r - 20) / 24;
    const d = Math.sqrt(dx * dx + dy * dy);
    return bandPick(d, [
      [0, 0.25, 100],   // brightest center (still dark velvet)
      [0.25, 0.50, 99],
      [0.50, 0.70, 98],
      [0.70, 0.85, 97],
      [0.85, 1.0, 96],
      [1.0, 1.5, 95],
    ]);
  });
  // Crown band — wide gold arc, rows 18-26
  fillRegion(cells, (r, c) => {
    if (r < 18 || r > 26) return 0;
    if (c < 4 || c > 35) return 0;
    // Curve: band thickness modulates with cos
    const bandCenter = 22 + Math.sin((c - 4) * 0.2) * 0.6;
    const distFromCenter = Math.abs(r - bandCenter);
    if (distFromCenter > 4) return 0;
    // Vertical shading on band (top = bright, bottom = dark)
    const vt = (r - 18) / 8;
    // Horizontal subtle shading
    const ht = Math.abs(c - 20) / 16; // edges darker
    const composite = (1 - vt) * 0.6 + (1 - ht) * 0.4;
    return Math.round(2 + composite * 14); // gold ramp ids 1-18 (use 2-16)
  });
  // Crown spikes (5 spikes pointing up)
  const spikeCols = [8, 14, 20, 26, 32];
  spikeCols.forEach((sc, i) => {
    // Spike triangle from row 18 down to row 8 (top of spike)
    const spikeTop = 10 + (i === 2 ? -2 : 0); // center spike is taller
    for (let r = spikeTop; r <= 18; r++) {
      const halfWidth = Math.floor((r - spikeTop) / 2) + 1;
      for (let dc = -halfWidth; dc <= halfWidth; dc++) {
        const cc = sc + dc;
        // Shading: outer edges darker, top brighter
        const vt = (r - spikeTop) / (18 - spikeTop);
        const ht = Math.abs(dc) / Math.max(1, halfWidth);
        const composite = (1 - vt * 0.4) * (1 - ht * 0.3);
        const colorIdx = Math.round(4 + composite * 12); // gold
        setCell(cells, r, cc, clamp(colorIdx, 2, 17));
      }
    }
  });
  // Jewels at top of spikes (different gems per spike)
  // Center spike: large pearl (palette 19-30, pearl=true), positioned at row 8
  const gemSpots = [
    { r: 14, c: 8,  baseId: 31, ramp: 12, type: 'sapphire' },    // sapphire
    { r: 14, c: 14, baseId: 55, ramp: 12, type: 'emerald' },     // emerald
    { r: 8,  c: 20, baseId: 19, ramp: 12, type: 'pearl' },       // central pearl
    { r: 14, c: 26, baseId: 43, ramp: 12, type: 'ruby' },        // ruby
    { r: 14, c: 32, baseId: 67, ramp: 12, type: 'amethyst' },    // amethyst
  ];
  gemSpots.forEach(({ r, c, baseId, ramp: rampLen, type }) => {
    const isCentral = type === 'pearl';
    const radius = isCentral ? 3 : 2.2;
    for (let dr = -Math.ceil(radius); dr <= Math.ceil(radius); dr++) {
      for (let dc = -Math.ceil(radius); dc <= Math.ceil(radius); dc++) {
        const d = Math.sqrt(dr * dr + dc * dc);
        if (d > radius) continue;
        // Inner cells = brightest
        const t = d / radius; // 0 center, 1 edge
        const colorIdx = Math.round(baseId + rampLen - 2 - t * (rampLen - 3));
        setCell(cells, r + dr, c + dc, colorIdx);
      }
    }
    // Sparkle highlight cell (single bright cell)
    if (!isCentral) setCell(cells, r - 1, c - 1, 79 + (baseId % 8)); // sparkle id
  });
  // Pearl row beneath the crown band — row 26-27
  for (let c = 5; c < 35; c += 2) {
    const idx = 19 + (c % 12); // varied pearls
    setCell(cells, 27, c, idx);
    setCell(cells, 27, c + 1, 19 + ((c + 3) % 12));
  }
  // Cross on central spike (small)
  setCell(cells, 5, 20, 86); // sparkle
  setCell(cells, 6, 20, 14); // gold
  setCell(cells, 5, 19, 13);
  setCell(cells, 5, 21, 13);
  // Sparkle stars scattered around
  const sparkles = [
    [3, 4], [4, 12], [2, 28], [5, 36],
    [10, 3], [12, 36], [22, 2], [24, 37],
    [33, 5], [34, 15], [35, 25], [33, 35],
  ];
  sparkles.forEach(([r, c], i) => setCell(cells, r, c, 79 + (i % 8)));
  return cells;
}

// ── Template 8: New Jerusalem — Pearl Gates ───────────────────────────────
function buildPearlGates() {
  const cells = emptyCells();
  // Sky glow gradient (top half) — palette 95-100
  fillRegion(cells, (r, c) => {
    if (r >= 12) return 0;
    const t = r / 12;
    return bandPick(t, [
      [0, 0.2, 95],
      [0.2, 0.4, 96],
      [0.4, 0.6, 97],
      [0.6, 0.8, 98],
      [0.8, 1.5, 99],
    ]);
  });
  // Glowing star at top center
  const starR = 4, starC = 20;
  fillRegion(cells, (r, c) => {
    const d = Math.sqrt((c - starC) ** 2 + (r - starR) ** 2);
    if (d < 1) return 29; // sparkle street
    if (d < 2) return 30;
    return 0;
  });
  // Light rays from star (diagonal)
  for (let i = 0; i < 5; i++) {
    for (let step = 1; step < 7; step++) {
      const ang = (i / 5) * Math.PI - Math.PI / 2;
      const dr = Math.round(Math.sin(ang) * step);
      const dc = Math.round(Math.cos(ang) * step);
      const cell = idx(starR + dr, starC + dc);
      if (cell >= 0 && cell < cells.length && cells[cell] >= 95 && cells[cell] <= 100) {
        cells[cell] = 100;
      }
    }
  }
  // Three gate arches (large, pearl) — left, center, right
  const gates = [
    { cx: 8, cy: 22, w: 5, top: 12 },   // left gate
    { cx: 20, cy: 21, w: 7, top: 10 },  // center gate (largest)
    { cx: 32, cy: 22, w: 5, top: 12 },  // right gate
  ];
  gates.forEach(({ cx, cy, w, top }) => {
    fillRegion(cells, (r, c) => {
      if (r < top || r > 32) return 0;
      if (c < cx - w || c > cx + w) return 0;
      // Arch top — semicircle
      if (r < cy - 2) {
        const dy = (cy - 2) - r;
        const halfArch = Math.sqrt(Math.max(0, w * w - dy * dy));
        if (Math.abs(c - cx) > halfArch) return 0;
      }
      // Pillar shading (light from upper-left)
      const distFromLeftEdge = c - (cx - w);
      const lightness = clamp((distFromLeftEdge / (2 * w)) + (top - r) / 30, 0, 1);
      // Use pearl indices 1-20 (palette pearls are first 20 entries)
      const colorIdx = Math.round(1 + lightness * 19);
      return clamp(colorIdx, 1, 20);
    });
  });
  // Gate openings (darker, deep inside) — small darker rectangles inside each gate
  gates.forEach(({ cx, cy, w }) => {
    const innerW = Math.max(1, w - 3);
    for (let r = cy; r <= 31; r++) {
      for (let c = cx - innerW; c <= cx + innerW; c++) {
        setCell(cells, r, c, 95); // sky glow (deep)
      }
    }
  });
  // Foundation stones — 12 stones in two rows (rows 33-36)
  // Each stone is ~3 columns wide
  const stones = [
    { start: 31, ids: [31, 32, 33, 34, 35, 36] },   // jasper
    { start: 37, ids: [37, 38, 39, 40, 41, 42] },   // sapphire
    { start: 43, ids: [43, 44, 45, 46, 47, 48] },   // chalcedony
    { start: 49, ids: [49, 50, 51, 52, 53, 54] },   // emerald
    { start: 55, ids: [55, 56, 57, 58, 59, 60] },   // sardonyx
    { start: 61, ids: [61, 62, 63, 64, 65, 66] },   // sardius
    { start: 67, ids: [67, 68, 69, 70, 71, 72] },   // chrysolite
    { start: 73, ids: [73, 74, 75, 76, 77, 78] },   // beryl
    { start: 79, ids: [79, 80, 81, 82] },           // topaz (4 colors)
    { start: 83, ids: [83, 84, 85, 86] },           // chrysoprasus
    { start: 87, ids: [87, 88, 89, 90] },           // jacinth
    { start: 91, ids: [91, 92, 93, 94] },           // amethyst
  ];
  // Arrange 12 stones in one row of 12 (cols 2-37, 3 cols each, rows 33-36)
  stones.forEach((stone, i) => {
    const startCol = 2 + i * 3;
    for (let r = 33; r <= 35; r++) {
      for (let c = startCol; c < startCol + 3; c++) {
        // Shading within stone: top = brightest, bottom = darkest
        const t = (r - 33) / 2; // 0 top, 1 bottom
        const horizT = (c - startCol) / 2;
        const composite = (1 - t) * 0.7 + (1 - horizT) * 0.3;
        const ids = stone.ids;
        const colorIdx = ids[Math.round(composite * (ids.length - 1))];
        setCell(cells, r, c, colorIdx);
      }
    }
  });
  // Golden street (rows 36-39)
  fillRegion(cells, (r, c) => {
    if (r < 36) return 0;
    const t = (r - 36) / 4;
    // Slight horizontal variation for shimmer
    const shimmer = Math.abs(Math.sin(c * 0.6)) * 0.3;
    const composite = clamp(t + shimmer, 0, 1);
    // Use street ids 21-30 (8 normal + 2 sparkle)
    if (shimmer > 0.25 && r > 37 && (c % 4) === 0) return 29; // sparkle
    return Math.round(21 + composite * 7); // 21-28 normal street
  });
  return cells;
}


// ── Templates registry ────────────────────────────────────────────────────
export const TEMPLATES = [
  {
    id: 'lilies',
    title: 'Lilies of the Field',
    verse: 'Consider the lilies of the field, how they grow; they toil not, neither do they spin.',
    reference: 'Matthew 6:28',
    grid: { cols: COLS, rows: ROWS },
    palette: buildLiliesPalette(),
    cells: buildLilies(),
  },
  {
    id: 'stars',
    title: 'Stars in the Sky',
    verse: 'Look now toward heaven, and count the stars, if thou be able to number them.',
    reference: 'Genesis 15:5',
    grid: { cols: COLS, rows: ROWS },
    palette: [
      { id: 1,  hex: '#0A0E2A', label: 'Zenith' },
      { id: 2,  hex: '#10193A', label: 'Deep sky' },
      { id: 3,  hex: '#1A2452', label: 'Night sky' },
      { id: 4,  hex: '#2A3068', label: 'Mid sky' },
      { id: 5,  hex: '#3A3F78', label: 'Horizon' },
      { id: 6,  hex: '#5A5088', label: 'Cloud' },
      { id: 7,  hex: '#C8B868', label: 'Moon edge' },
      { id: 8,  hex: '#E8D580', label: 'Moon mid' },
      { id: 9,  hex: '#FAEFB0', label: 'Moon bright' },
      { id: 10, hex: '#A89858', label: 'Moon shadow' },
      { id: 11, hex: '#5A5278', label: 'Moon glow' },
      { id: 12, hex: '#6A6088', label: 'Star halo' },
      { id: 13, hex: '#FAE4A0', label: 'Star point' },
      { id: 14, hex: '#FFFFD0', label: 'Star core' },
    ],
    cells: buildStars(),
  },
  {
    id: 'mountains',
    title: 'He Lifts Mine Eyes',
    verse: 'I will lift up mine eyes unto the hills, from whence cometh my help.',
    reference: 'Psalm 121:1',
    grid: { cols: COLS, rows: ROWS },
    palette: [
      { id: 1,  hex: '#F8C9A0', label: 'Top peach' },
      { id: 2,  hex: '#E8A8AA', label: 'Rose' },
      { id: 3,  hex: '#D0A0B0', label: 'Soft pink' },
      { id: 4,  hex: '#A89AC0', label: 'Lavender' },
      { id: 5,  hex: '#A0B0CC', label: 'Pale blue' },
      { id: 6,  hex: '#F8D578', label: 'Sun glow' },
      { id: 7,  hex: '#FFF2B8', label: 'Sun core' },
      { id: 8,  hex: '#F5C868', label: 'Sun edge' },
      { id: 9,  hex: '#B098C0', label: 'Far peak' },
      { id: 10, hex: '#806890', label: 'Far mid' },
      { id: 11, hex: '#604870', label: 'Far base' },
      { id: 12, hex: '#5A6080', label: 'Mid peak' },
      { id: 13, hex: '#404868', label: 'Mid body' },
      { id: 14, hex: '#283050', label: 'Mid base' },
      { id: 15, hex: '#F0EEE2', label: 'Snow' },
      { id: 16, hex: '#C8C8D8', label: 'Snow shadow' },
      { id: 17, hex: '#384258', label: 'Near peak' },
      { id: 18, hex: '#202840', label: 'Near body' },
      { id: 19, hex: '#101830', label: 'Near base' },
      { id: 20, hex: '#283858', label: 'Lake top' },
      { id: 21, hex: '#182848', label: 'Lake mid' },
      { id: 22, hex: '#0A1A38', label: 'Lake deep' },
    ],
    cells: buildMountains(),
  },
  {
    id: 'dove',
    title: 'Peace I Leave With You',
    verse: 'Peace I leave with you, my peace I give unto you.',
    reference: 'John 14:27',
    grid: { cols: COLS, rows: ROWS },
    palette: [
      { id: 1,  hex: '#D8E2EE', label: 'Sky top' },
      { id: 2,  hex: '#E8ECF2', label: 'Sky mid' },
      { id: 3,  hex: '#F2F4F8', label: 'Sky base' },
      { id: 4,  hex: '#F8F4D8', label: 'Light ray' },
      { id: 5,  hex: '#FFFFFC', label: 'Dove bright' },
      { id: 6,  hex: '#F0EDE6', label: 'Dove pale' },
      { id: 7,  hex: '#D0CDC4', label: 'Dove mid' },
      { id: 8,  hex: '#9A958A', label: 'Dove shadow' },
      { id: 9,  hex: '#E8A858', label: 'Beak' },
      { id: 10, hex: '#A87838', label: 'Beak shadow' },
      { id: 11, hex: '#1A1612', label: 'Eye' },
      { id: 12, hex: '#7A9A6A', label: 'Olive leaf' },
      { id: 13, hex: '#D8A848', label: 'Olive berry' },
      { id: 14, hex: '#6A4A2A', label: 'Branch' },
    ],
    cells: buildDove(),
  },
  {
    id: 'light',
    title: 'Light of the World',
    verse: 'Ye are the light of the world. A city that is set on an hill cannot be hid.',
    reference: 'Matthew 5:14',
    grid: { cols: COLS, rows: ROWS },
    palette: [
      { id: 1,  hex: '#0A0805', label: 'Pitch dark' },
      { id: 2,  hex: '#181208', label: 'Very dim' },
      { id: 3,  hex: '#2A1F10', label: 'Dim glow' },
      { id: 4,  hex: '#4A3018', label: 'Soft amber' },
      { id: 5,  hex: '#6A4825', label: 'Warm amber' },
      { id: 6,  hex: '#A06820', label: 'Bright gold' },
      { id: 7,  hex: '#C88830', label: 'Halo core' },
      { id: 8,  hex: '#E8D080', label: 'Glass shine' },
      { id: 9,  hex: '#F4C040', label: 'Flame gold' },
      { id: 10, hex: '#E89020', label: 'Flame orange' },
      { id: 11, hex: '#8B5A2C', label: 'Brass bright' },
      { id: 12, hex: '#5A3818', label: 'Brass shadow' },
      { id: 13, hex: '#3A220C', label: 'Brass deep' },
      { id: 14, hex: '#FFF8D0', label: 'Flame core' },
    ],
    cells: buildLight(),
  },
  {
    id: 'heart',
    title: 'Create in Me a Clean Heart',
    verse: 'Create in me a clean heart, O God; and renew a right spirit within me.',
    reference: 'Psalm 51:10',
    grid: { cols: COLS, rows: ROWS },
    palette: [
      { id: 1,  hex: '#FAF1E4', label: 'Bright cream' },
      { id: 2,  hex: '#F4E5D0', label: 'Mid cream' },
      { id: 3,  hex: '#E8D5B8', label: 'Dusty cream' },
      { id: 4,  hex: '#C8B49A', label: 'Edge shadow' },
      { id: 5,  hex: '#7A2A38', label: 'Deep shadow' },
      { id: 6,  hex: '#9A3848', label: 'Shadow' },
      { id: 7,  hex: '#B85060', label: 'Mid rose' },
      { id: 8,  hex: '#C9687A', label: 'Base rose' },
      { id: 9,  hex: '#D88090', label: 'Light rose' },
      { id: 10, hex: '#E89AA8', label: 'Highlight pink' },
      { id: 11, hex: '#F8C0CA', label: 'Bright highlight' },
      { id: 12, hex: '#FFFFFC', label: 'Shine' },
      { id: 13, hex: '#E8C26A', label: 'Sparkle gold' },
      { id: 14, hex: '#FAEFB0', label: 'Sparkle white' },
    ],
    cells: buildHeart(),
  },
  {
    id: 'crown',
    title: 'Crown of Life',
    verse: 'Blessed is the man that endureth temptation: for when he is tried, he shall receive the crown of life.',
    reference: 'James 1:12',
    grid: { cols: COLS, rows: ROWS },
    palette: buildCrownPalette(),
    cells: buildCrown(),
  },
  {
    id: 'pearl-gates',
    title: 'New Jerusalem',
    verse: 'And the twelve gates were twelve pearls; every several gate was of one pearl: and the street of the city was pure gold.',
    reference: 'Revelation 21:21',
    grid: { cols: COLS, rows: ROWS },
    palette: buildPearlGatesPalette(),
    cells: buildPearlGates(),
  },
];

export function getTemplate(id) {
  return TEMPLATES.find(t => t.id === id);
}

// Default palette for freestyle mode (16 colors with gradient ramps)
export const FREESTYLE_PALETTE = [
  { id: 1,  hex: '#FAF6EC', label: 'Cream' },
  { id: 2,  hex: '#F2EBD8', label: 'Ivory' },
  { id: 3,  hex: '#E8D4A0', label: 'Gold light' },
  { id: 4,  hex: '#C9A96E', label: 'Gold' },
  { id: 5,  hex: '#8B6A3A', label: 'Brown' },
  { id: 6,  hex: '#D4A0A8', label: 'Rose' },
  { id: 7,  hex: '#A86070', label: 'Deep rose' },
  { id: 8,  hex: '#B0A0C0', label: 'Lavender' },
  { id: 9,  hex: '#7A6090', label: 'Deep lavender' },
  { id: 10, hex: '#8FAA75', label: 'Sage' },
  { id: 11, hex: '#3A5A78', label: 'Deep blue' },
  { id: 12, hex: '#1A2240', label: 'Night' },
  { id: 13, hex: '#E8C26A', label: 'Honey' },
  { id: 14, hex: '#5A7A4A', label: 'Leaf' },
  { id: 15, hex: '#9A958A', label: 'Stone' },
  { id: 16, hex: '#1A1612', label: 'Ink' },
];

export const FREESTYLE_SIZE = { cols: COLS, rows: ROWS };
