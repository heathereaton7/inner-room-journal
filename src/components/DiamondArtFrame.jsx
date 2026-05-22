import { useMemo } from 'react';
import { colorHex } from '../systems/diamondArt.js';

/**
 * DiamondArtFrame — renders a completed artwork as a small framed picture.
 *
 * Used both in the gallery list and as the rendered cabin decor.
 *
 * Props:
 *   artwork  — gallery entry { cells, palette, cols, rows, title, reference }
 *   size     — pixel width (height auto from aspect)
 *   showLabel — caption below frame
 */
export default function DiamondArtFrame({ artwork, size = 220, showLabel = true }) {
  if (!artwork) return null;
  const { cells, palette, cols, rows } = artwork;

  // SVG geometry
  const cellSize = 16;
  const pad = 4;
  const w = cols * cellSize + pad * 2;
  const h = rows * cellSize + pad * 2;

  const gems = useMemo(() => {
    const out = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        const filled = cells[i];
        if (!filled) continue;
        const cx = pad + c * cellSize + cellSize / 2;
        const cy = pad + r * cellSize + cellSize / 2;
        const half = (cellSize - 1) / 2;
        out.push({ i, cx, cy, half, hex: colorHex(palette, filled) });
      }
    }
    return out;
  }, [cells, palette, cols, rows]);

  return (
    <div style={{ display: 'inline-block', textAlign: 'center' }}>
      <div style={{
        width: size,
        padding: 8,
        background: 'linear-gradient(145deg,#3A2818,#1A1208)',
        borderRadius: 6,
        boxShadow: '0 4px 12px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(201,169,110,0.35)',
      }}>
        <div style={{
          background: '#0E0A06',
          padding: 4,
          borderRadius: 3,
          boxShadow: 'inset 0 0 8px rgba(0,0,0,0.6)',
        }}>
          <svg
            viewBox={`0 0 ${w} ${h}`}
            style={{ width: '100%', height: 'auto', display: 'block' }}
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              {palette.map(p => (
                <radialGradient key={p.id} id={`fr-${artwork.id}-${p.id}`} cx="35%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
                  <stop offset="35%" stopColor={p.hex} stopOpacity="1" />
                  <stop offset="100%" stopColor={darken(p.hex, 0.4)} stopOpacity="1" />
                </radialGradient>
              ))}
            </defs>
            {gems.map(({ i, cx, cy, half, hex }) => (
              <g key={i} transform={`translate(${cx} ${cy}) rotate(45)`}>
                <rect
                  x={-half * 0.78} y={-half * 0.78}
                  width={half * 1.56} height={half * 1.56}
                  rx={1.6}
                  fill={`url(#fr-${artwork.id}-${cells[i]})`}
                  stroke={darken(hex, 0.35)}
                  strokeWidth="0.2"
                />
                <rect
                  x={-half * 0.55} y={-half * 0.68}
                  width={half * 0.5} height={half * 0.22}
                  rx={1}
                  fill="rgba(255,255,255,0.55)"
                />
              </g>
            ))}
          </svg>
        </div>
      </div>
      {showLabel && (
        <div style={{ marginTop: 8, fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', color: 'rgba(232,212,160,0.85)', fontSize: '0.86rem' }}>
          {artwork.title}
          {artwork.reference && (
            <div style={{ fontFamily: 'Inter, system-ui, sans-serif', fontStyle: 'normal', fontSize: '0.66rem', color: 'rgba(201,169,110,0.55)', marginTop: 2, letterSpacing: '0.08em' }}>
              {artwork.reference}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function darken(hex, amount) {
  if (!hex) return '#000';
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const n = parseInt(h, 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const f = 1 - amount;
  const to = v => Math.round(v * f).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}
