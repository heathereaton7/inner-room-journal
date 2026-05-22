import { useMemo, useRef, useState, useEffect } from 'react';
import { colorHex } from '../systems/diamondArt.js';

/**
 * DiamondArtCanvas — renders the grid as SVG diamond gems.
 *
 * Props:
 *   progress       — current progress state (cells, palette, mode, cols, rows)
 *   template       — template object (guided mode only; null for freestyle)
 *   selectedColor  — colorId currently selected in the palette
 *   onCellTap      — (idx) => void
 *   showNumbers    — guided mode helper to show target numbers on empty cells
 */
export default function DiamondArtCanvas({
  progress, template, selectedColor, onCellTap, showNumbers = true,
}) {
  const { cols, rows, palette, cells, mode } = progress;
  const [flashIdx, setFlashIdx] = useState(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (flashIdx === null) return;
    const t = setTimeout(() => setFlashIdx(null), 280);
    return () => clearTimeout(t);
  }, [flashIdx]);

  // SVG viewBox sized to grid. Smaller cells for denser grids.
  const cellSize = cols >= 32 ? 12 : 16; // svg units per cell
  const gap = cols >= 32 ? 0.5 : 1;
  const pad = 4;
  const w = cols * cellSize + pad * 2;
  const h = rows * cellSize + pad * 2;
  const showNumbersResolved = showNumbers && cols < 32; // hide numbers on dense grids

  // Pre-compute gem display data for each cell
  const cellData = useMemo(() => {
    const out = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        const filled = cells[i];
        const target = template ? template.cells[i] : 0;
        out.push({ idx: i, r, c, filled, target });
      }
    }
    return out;
  }, [cells, template, cols, rows]);

  // Build O(1) lookup map for palette properties (pearl, sparkle, etc.)
  const paletteMap = useMemo(() => {
    const m = new Map();
    palette.forEach(p => m.set(p.id, p));
    return m;
  }, [palette]);

  const handleTap = (idx, target) => {
    if (mode === 'guided') {
      // In guided mode, only tappable cells have target > 0
      if (target === 0) return;
    }
    setFlashIdx(idx);
    onCellTap(idx);
  };

  return (
    <div ref={wrapRef} style={{
      width: '100%',
      maxWidth: 520,
      margin: '0 auto',
      background: 'rgba(10,8,6,0.6)',
      borderRadius: 14,
      padding: 8,
      boxShadow: 'inset 0 0 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(201,169,110,0.15)',
    }}>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        style={{ width: '100%', height: 'auto', display: 'block', touchAction: 'manipulation' }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Gem gradient per palette color */}
          {palette.map(p => (
            p.pearl ? (
              // Pearl: iridescent shimmer with soft hue shift
              <radialGradient key={p.id} id={`gem-${p.id}`} cx="32%" cy="28%" r="80%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                <stop offset="20%" stopColor={lighten(p.hex, 0.25)} stopOpacity="1" />
                <stop offset="55%" stopColor={p.hex} stopOpacity="1" />
                <stop offset="80%" stopColor={pearlShift(p.hex)} stopOpacity="1" />
                <stop offset="100%" stopColor={darken(p.hex, 0.18)} stopOpacity="1" />
              </radialGradient>
            ) : p.sparkle ? (
              // Sparkle: extra-bright core with crystalline edge
              <radialGradient key={p.id} id={`gem-${p.id}`} cx="35%" cy="28%" r="75%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                <stop offset="18%" stopColor="#FFFFFF" stopOpacity="0.95" />
                <stop offset="45%" stopColor={p.hex} stopOpacity="1" />
                <stop offset="100%" stopColor={darken(p.hex, 0.3)} stopOpacity="1" />
              </radialGradient>
            ) : (
              <radialGradient key={p.id} id={`gem-${p.id}`} cx="35%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
                <stop offset="35%" stopColor={p.hex} stopOpacity="1" />
                <stop offset="100%" stopColor={darken(p.hex, 0.4)} stopOpacity="1" />
              </radialGradient>
            )
          ))}
          <filter id="da-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="0.6" />
          </filter>
        </defs>
        {/* Cells */}
        {cellData.map(({ idx, r, c, filled, target }) => {
          const cx = pad + c * cellSize + cellSize / 2;
          const cy = pad + r * cellSize + cellSize / 2;
          const half = (cellSize - gap) / 2;
          const isFlash = flashIdx === idx;
          const isBackground = mode === 'guided' && target === 0;
          const fillHex = filled ? colorHex(palette, filled) : null;
          const targetHex = target ? colorHex(palette, target) : null;

          // Background-only cell (guided): render very subtle dot
          if (isBackground) {
            return (
              <rect
                key={idx}
                x={cx - half} y={cy - half} width={half * 2} height={half * 2}
                rx={2}
                fill="rgba(255,255,255,0.015)"
                stroke="rgba(255,255,255,0.04)"
                strokeWidth="0.3"
              />
            );
          }

          return (
            <g key={idx} onClick={() => handleTap(idx, target)} style={{ cursor: 'pointer' }}>
              {/* Hit-target square */}
              <rect
                x={cx - half} y={cy - half} width={half * 2} height={half * 2}
                fill="transparent"
              />
              {filled ? (
                // Diamond gem (rotated square)
                <g transform={`translate(${cx} ${cy}) rotate(45) scale(${isFlash ? 1.15 : 1})`} style={{ transition: 'transform 200ms ease-out' }}>
                  <rect
                    x={-half * 0.78} y={-half * 0.78}
                    width={half * 1.56} height={half * 1.56}
                    rx={1.6}
                    fill={`url(#gem-${filled})`}
                    stroke={darken(fillHex, 0.35)}
                    strokeWidth="0.25"
                  />
                  {/* Inner highlight */}
                  {(paletteMap.get(filled)?.pearl) ? (
                    // Pearl: large soft highlight (no harsh edge)
                    <ellipse cx={-half * 0.25} cy={-half * 0.35} rx={half * 0.42} ry={half * 0.28} fill="rgba(255,255,255,0.75)" />
                  ) : (
                    <rect
                      x={-half * 0.55} y={-half * 0.68}
                      width={half * 0.5} height={half * 0.22}
                      rx={1}
                      fill="rgba(255,255,255,0.55)"
                    />
                  )}
                  {/* Sparkle: tiny 4-point star inside */}
                  {(paletteMap.get(filled)?.sparkle) && (
                    <g transform={`rotate(-45)`}>
                      <path
                        d={`M 0 ${-half * 0.55} L ${half * 0.12} 0 L 0 ${half * 0.55} L ${-half * 0.12} 0 Z`}
                        fill="rgba(255,255,255,0.95)"
                      />
                      <path
                        d={`M ${-half * 0.55} 0 L 0 ${half * 0.12} L ${half * 0.55} 0 L 0 ${-half * 0.12} Z`}
                        fill="rgba(255,255,255,0.85)"
                      />
                    </g>
                  )}
                </g>
              ) : (
                // Empty target cell — show outline + number
                <g>
                  <rect
                    x={cx - half * 0.85} y={cy - half * 0.85}
                    width={half * 1.7} height={half * 1.7}
                    rx={2}
                    fill={targetHex ? hexWithAlpha(targetHex, showNumbersResolved ? 0.10 : 0.22) : 'rgba(255,255,255,0.04)'}
                    stroke={targetHex ? hexWithAlpha(targetHex, showNumbersResolved ? 0.35 : 0.50) : 'rgba(255,255,255,0.12)'}
                    strokeWidth="0.35"
                  />
                  {showNumbersResolved && target > 0 && (
                    <text
                      x={cx} y={cy + cellSize * 0.18}
                      textAnchor="middle"
                      fontSize={cellSize * 0.55}
                      fontFamily="ui-sans-serif, system-ui, sans-serif"
                      fontWeight="600"
                      fill={targetHex ? hexWithAlpha(targetHex, 0.85) : 'rgba(255,255,255,0.6)'}
                    >{target}</text>
                  )}
                </g>
              )}
              {/* Selection hint — pulse ring if this cell matches selected color and is empty (guided) */}
              {mode === 'guided' && !filled && target === selectedColor && (
                <rect
                  x={cx - half * 0.95} y={cy - half * 0.95}
                  width={half * 1.9} height={half * 1.9}
                  rx={2.5}
                  fill="none"
                  stroke={targetHex}
                  strokeWidth="0.5"
                  opacity="0.6"
                >
                  <animate attributeName="opacity" values="0.3;0.9;0.3" dur="1.6s" repeatCount="indefinite" />
                </rect>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── color helpers ──────────────────────────────────────────────────────────
function darken(hex, amount) {
  if (!hex) return '#000';
  const { r, g, b } = hexToRgb(hex);
  const f = 1 - amount;
  return rgbToHex(Math.round(r * f), Math.round(g * f), Math.round(b * f));
}
function lighten(hex, amount) {
  if (!hex) return '#fff';
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(
    Math.round(r + (255 - r) * amount),
    Math.round(g + (255 - g) * amount),
    Math.round(b + (255 - b) * amount),
  );
}
// pearlShift: shift hue toward complementary tint for iridescent look
function pearlShift(hex) {
  const { r, g, b } = hexToRgb(hex);
  // Subtle channel swap towards opal/iridescent feel
  return rgbToHex(
    Math.round(g * 0.4 + r * 0.6),
    Math.round(b * 0.4 + g * 0.6),
    Math.round(r * 0.3 + b * 0.7),
  );
}
function hexWithAlpha(hex, a) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}
function hexToRgb(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const n = parseInt(h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function rgbToHex(r, g, b) {
  const to = v => v.toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}
