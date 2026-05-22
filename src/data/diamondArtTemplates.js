/**
 * Diamond Art Templates — Scripture-inspired designs.
 *
 * 40×40 grids (1600 cells) with rich palettes (12-15 colors per design)
 * and procedural shape rendering for Dazzly-like gradient depth.
 *
 * Each template uses positional shading functions to give the art
 * realistic light/shadow ramps rather than flat color blocks.
 */

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

// ── Template 1: Lilies of the Field ───────────────────────────────────────
function buildLilies() {
  const cells = emptyCells();
  // Sky gradient (top -> middle)
  fillRegion(cells, (r, c) => {
    if (r >= 24) return 0;
    const t = r / 24;
    return bandPick(t, [
      [0, 0.25, 1],   // pale cream top
      [0.25, 0.55, 2], // soft peach
      [0.55, 1.0, 3], // sky cream
    ]);
  });
  // Grass field (bottom)
  fillRegion(cells, (r, c) => {
    if (r < 24) return 0;
    const t = (r - 24) / (ROWS - 24);
    // mild wave variation across columns
    const wave = Math.sin(c * 0.45) * 0.05;
    const v = clamp(t + wave, 0, 1);
    return bandPick(v, [
      [0, 0.3, 4],  // light grass
      [0.3, 0.7, 5], // mid grass
      [0.7, 1.0, 6], // deep grass
    ]);
  });
  // Central lily flower around (r=20, c=20), radius ~8
  const cx = 20, cy = 20;
  fillRegion(cells, (r, c) => {
    const dx = c - cx, dy = r - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 9) return 0;
    // Six-petal pattern using angle
    const angle = Math.atan2(dy, dx);
    const petalAngle = (angle + Math.PI) / (Math.PI * 2) * 6;
    const petalT = Math.abs((petalAngle % 1) - 0.5) * 2; // 0 at center of petal, 1 at edge
    // Petal radius modulates with angle
    const petalRadius = 8 - petalT * 3;
    if (dist > petalRadius) return 0;
    // Shading: outer = dark cream, middle = cream, inner near center = bright white
    if (dist < 2) return 11; // golden core inner
    if (dist < 3) return 10; // gold mid
    if (dist < 4) return 9;  // gold edge
    if (petalT > 0.75) return 7; // petal shadow edge
    if (dist > petalRadius - 1) return 7; // petal outline
    if (petalT < 0.25 && dist > 4 && dist < 6) return 12; // petal highlight (bright white)
    return 8; // mid petal cream
  });
  // Stem
  for (let r = 28; r < 38; r++) {
    setCell(cells, r, 20, 13);
    if (r > 30) setCell(cells, r, 21, 13);
  }
  // Leaves left and right
  const leafCells = [
    [31, 17], [31, 18], [32, 16], [32, 17], [32, 18], [33, 17], [33, 18],
    [31, 22], [31, 23], [32, 22], [32, 23], [32, 24], [33, 22], [33, 23],
  ];
  leafCells.forEach(([r, c]) => setCell(cells, r, c, 13));
  // Side smaller lilies (left and right)
  const smallLilies = [[33, 8], [33, 32]];
  smallLilies.forEach(([rr, cc]) => {
    for (let dr = -2; dr <= 2; dr++) {
      for (let dc = -2; dc <= 2; dc++) {
        const d = Math.sqrt(dr * dr + dc * dc);
        if (d <= 2) {
          if (d < 0.5) setCell(cells, rr + dr, cc + dc, 11);
          else if (d < 1.5) setCell(cells, rr + dr, cc + dc, 14);
          else setCell(cells, rr + dr, cc + dc, 15);
        }
      }
    }
  });
  // Falling petals / dew sparkles in sky
  const sparkles = [[5, 8], [8, 32], [12, 6], [15, 33], [3, 22]];
  sparkles.forEach(([r, c]) => setCell(cells, r, c, 12));
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

// ── Templates registry ────────────────────────────────────────────────────
export const TEMPLATES = [
  {
    id: 'lilies',
    title: 'Lilies of the Field',
    verse: 'Consider the lilies of the field, how they grow; they toil not, neither do they spin.',
    reference: 'Matthew 6:28',
    grid: { cols: COLS, rows: ROWS },
    palette: [
      { id: 1,  hex: '#F4E5D0', label: 'Pale sky' },
      { id: 2,  hex: '#F0C9A8', label: 'Peach' },
      { id: 3,  hex: '#E8DBC2', label: 'Cream' },
      { id: 4,  hex: '#B9D096', label: 'Light grass' },
      { id: 5,  hex: '#8FAA75', label: 'Mid grass' },
      { id: 6,  hex: '#5F7E4A', label: 'Deep grass' },
      { id: 7,  hex: '#C8B998', label: 'Petal shadow' },
      { id: 8,  hex: '#F2EBD8', label: 'Petal mid' },
      { id: 9,  hex: '#E8C26A', label: 'Gold edge' },
      { id: 10, hex: '#F0CF60', label: 'Gold mid' },
      { id: 11, hex: '#FFE07A', label: 'Gold core' },
      { id: 12, hex: '#FFFCF2', label: 'Petal shine' },
      { id: 13, hex: '#3A5028', label: 'Stem' },
      { id: 14, hex: '#D89AA8', label: 'Small lily' },
      { id: 15, hex: '#A86C7A', label: 'Lily edge' },
    ],
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
