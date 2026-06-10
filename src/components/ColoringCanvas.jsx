import { useRef, useEffect, useState, useCallback } from 'react';

const SANS = "'Inter', system-ui, -apple-system, sans-serif";

const P = {
  ink: '#FAF6F0',
  sub: 'rgba(232,212,160,0.55)',
  border: 'rgba(201,169,110,0.18)',
  borderH: 'rgba(201,169,110,0.55)',
  gold: '#C9A96E',
  goldL: '#E8D4A0',
};

// Coloring palette — lots of colors with light → dark shades of each family so
// pages can be shaded, not just flat-filled. Grouped by hue (each row a family).
const PALETTE = [
  // Pinks / magentas
  '#ffd9ec', '#ff9ccb', '#ff5cb0', '#ff1f8e', '#d4146e', '#8f0d49',
  // Reds / corals
  '#ffd2cc', '#ff8f7a', '#ff4d4d', '#e02020', '#a81414', '#6e0d0d',
  // Oranges / peaches
  '#ffe6c2', '#ffc266', '#ff9a2e', '#f5780a', '#c25600', '#8a3d00',
  // Yellows / golds
  '#fff6c2', '#ffe680', '#ffd23d', '#f5b800', '#c99200', '#8f6800',
  // Greens
  '#d6f5cc', '#9ee87a', '#5ce86b', '#23c44a', '#13903a', '#0a5e26',
  // Teals / aquas
  '#cdf6f0', '#7fe6dd', '#23d3c4', '#10b0a4', '#0a7d75', '#064f4a',
  // Blues
  '#cfe2ff', '#7faaff', '#3d6bff', '#1f47d4', '#1330a0', '#0b1d66',
  // Purples / violets
  '#ecd6ff', '#c49cff', '#9b4dff', '#7a2cd4', '#5618a0', '#360c66',
  // Browns / tans / earth (great for sparrows, branches, soil)
  '#f0e0c8', '#dcc39a', '#c79a5e', '#a6713a', '#7a4d24', '#4d2f15',
  // Neutrals (greys, stone, white, black)
  '#ffffff', '#e2e6ea', '#b9c2d0', '#8a93a3', '#4a4f59', '#1a1c20',
];

// Pixels in the source art darker than this are treated as line "walls" the
// flood fill cannot cross. Keeps color from bleeding across the outlines.
const WALL_THRESHOLD = 110;

const MAX_WORK = 1200;        // cap the working canvas longest side (phone speed)
const TAP_MOVE_TOL = 8;       // px of finger movement still counted as a tap
const TAP_TIME_TOL = 500;     // ms
const AUTOSAVE_MS = 1200;     // debounce after a fill before persisting

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * ColoringCanvas — draws a line-art page and flood-fills tapped areas.
 *
 * Props:
 *   page          — { id, src, title, verse, reference }
 *   savedImage    — PNG data URL to restore (or null for blank line art)
 *   color         — selected fill color (hex) or 'erase'
 *   onColorChange — (hex|'erase') => void
 *   onPersist(dataUrl) — store the PNG (called debounced after fills, and on
 *                        explicit Save / Start over)
 */
export default function ColoringCanvas({ page, savedImage, color, onColorChange, onPersist }) {
  const canvasRef = useRef(null);
  const blankRef = useRef(null);         // offscreen canvas: blank line art
  const wallMaskRef = useRef(null);      // Uint8Array, 1 = line/wall
  const dimsRef = useRef({ w: 0, h: 0 });
  const [ready, setReady] = useState(false);

  // View transform (custom pinch-zoom + drag-pan so taps map exactly to pixels)
  const [tf, setTf] = useState({ scale: 1, tx: 0, ty: 0 });
  const tfRef = useRef(tf);
  useEffect(() => { tfRef.current = tf; }, [tf]);

  const pointers = useRef(new Map());          // active pointers by id
  const gesture = useRef(null);                // pinch gesture bookkeeping
  const tapInfo = useRef(null);                // single-pointer tap/pan tracking

  const onPersistRef = useRef(onPersist);
  useEffect(() => { onPersistRef.current = onPersist; }, [onPersist]);
  const saveTimer = useRef(null);

  const exportPng = useCallback(() => {
    const canvas = canvasRef.current;
    // JPEG (not PNG) keeps the saved data URL well under Firestore's 1MB
    // per-document limit so colored pages sync to the cloud, not just
    // localStorage. The art is flat color + line work, so quality holds up.
    return canvas ? canvas.toDataURL('image/jpeg', 0.82) : null;
  }, []);
  const persistNow = useCallback(() => {
    if (saveTimer.current) { clearTimeout(saveTimer.current); saveTimer.current = null; }
    const url = exportPng();
    if (url) onPersistRef.current?.(url);
  }, [exportPng]);
  const schedulePersist = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(persistNow, AUTOSAVE_MS);
  }, [persistNow]);
  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current); }, []);

  // ── Load the line art, build wall mask + blank copy, draw saved or blank ──
  useEffect(() => {
    let cancelled = false;
    setReady(false);
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      const scale = Math.min(1, MAX_WORK / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      dimsRef.current = { w, h };

      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      // Blank line-art copy (used by "Start over")
      const blank = document.createElement('canvas');
      blank.width = w; blank.height = h;
      const bctx = blank.getContext('2d');
      bctx.fillStyle = '#fff';
      bctx.fillRect(0, 0, w, h);
      bctx.drawImage(img, 0, 0, w, h);
      blankRef.current = blank;

      // Read luminance into a wall mask from the blank art
      const data = bctx.getImageData(0, 0, w, h).data;
      const mask = new Uint8Array(w * h);
      for (let i = 0, p = 0; i < data.length; i += 4, p++) {
        const a = data[i + 3];
        const lum = a < 8 ? 255 : (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
        mask[p] = lum < WALL_THRESHOLD ? 1 : 0;
      }
      wallMaskRef.current = mask;

      // Draw the saved picture if present, else the blank line art
      if (savedImage) {
        const saved = new Image();
        saved.onload = () => {
          if (cancelled) return;
          ctx.clearRect(0, 0, w, h);
          ctx.drawImage(saved, 0, 0, w, h);
          setReady(true);
        };
        saved.onerror = () => { if (!cancelled) { ctx.drawImage(blank, 0, 0); setReady(true); } };
        saved.src = savedImage;
      } else {
        ctx.drawImage(blank, 0, 0);
        setReady(true);
      }
    };
    img.src = page.src;
    return () => { cancelled = true; };
  }, [page.src, savedImage]);

  // ── Flood fill from a pixel, bounded by the wall mask ──
  const floodFill = useCallback((px, py, fillHex) => {
    const { w, h } = dimsRef.current;
    const mask = wallMaskRef.current;
    if (!mask || px < 0 || py < 0 || px >= w || py >= h) return;
    if (mask[py * w + px] === 1) return; // tapped a line — nothing to fill

    const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
    const imgData = ctx.getImageData(0, 0, w, h);
    const d = imgData.data;
    const [fr, fg, fb] = hexToRgb(fillHex);

    const visited = new Uint8Array(w * h);
    const stack = [[px, py]];
    while (stack.length) {
      const [sx, sy] = stack.pop();
      const row = sy * w;
      let xL = sx;
      while (xL >= 0 && mask[row + xL] === 0 && !visited[row + xL]) xL--;
      xL++;
      let xR = sx;
      while (xR < w && mask[row + xR] === 0 && !visited[row + xR]) xR++;
      xR--;
      for (let x = xL; x <= xR; x++) {
        const idx = row + x;
        visited[idx] = 1;
        const o = idx * 4;
        d[o] = fr; d[o + 1] = fg; d[o + 2] = fb; d[o + 3] = 255;
        if (sy > 0) { const up = idx - w; if (mask[up] === 0 && !visited[up]) stack.push([x, sy - 1]); }
        if (sy < h - 1) { const dn = idx + w; if (mask[dn] === 0 && !visited[dn]) stack.push([x, sy + 1]); }
      }
    }
    ctx.putImageData(imgData, 0, 0);
    schedulePersist();
  }, [schedulePersist]);

  // ── Map a client point to a source pixel using the canvas's rendered rect ──
  const pixelAt = useCallback((clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const r = canvas.getBoundingClientRect(); // reflects the CSS transform
    const nx = (clientX - r.left) / r.width;
    const ny = (clientY - r.top) / r.height;
    if (nx < 0 || ny < 0 || nx > 1 || ny > 1) return null;
    return { x: Math.floor(nx * canvas.width), y: Math.floor(ny * canvas.height) };
  }, []);

  const applyFillAt = useCallback((clientX, clientY) => {
    const px = pixelAt(clientX, clientY);
    if (!px) return;
    floodFill(px.x, px.y, color === 'erase' ? '#ffffff' : color);
  }, [pixelAt, floodFill, color]);

  // ── Pointer gestures: 1 finger = paint/pan, 2 fingers = pinch zoom + pan ──
  const onPointerDown = useCallback((e) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) {
      tapInfo.current = { id: e.pointerId, x0: e.clientX, y0: e.clientY, moved: 0, t0: Date.now() };
    } else if (pointers.current.size === 2) {
      const pts = [...pointers.current.values()];
      const dx = pts[0].x - pts[1].x, dy = pts[0].y - pts[1].y;
      gesture.current = {
        dist: Math.hypot(dx, dy),
        cx: (pts[0].x + pts[1].x) / 2,
        cy: (pts[0].y + pts[1].y) / 2,
        startTf: { ...tfRef.current },
      };
      tapInfo.current = null; // second finger cancels the tap
    }
  }, []);

  const onPointerMove = useCallback((e) => {
    const pt = pointers.current.get(e.pointerId);
    if (!pt) return;
    pt.x = e.clientX; pt.y = e.clientY;

    if (pointers.current.size >= 2 && gesture.current) {
      const pts = [...pointers.current.values()];
      const dx = pts[0].x - pts[1].x, dy = pts[0].y - pts[1].y;
      const dist = Math.hypot(dx, dy);
      const cx = (pts[0].x + pts[1].x) / 2;
      const cy = (pts[0].y + pts[1].y) / 2;
      const g = gesture.current;
      const ratio = g.dist > 0 ? dist / g.dist : 1;
      const nextScale = Math.max(1, Math.min(6, g.startTf.scale * ratio));
      const k = nextScale / g.startTf.scale;
      const tx = g.startTf.tx + (cx - g.cx) - (g.cx - g.startTf.tx) * (k - 1);
      const ty = g.startTf.ty + (cy - g.cy) - (g.cy - g.startTf.ty) * (k - 1);
      setTf({ scale: nextScale, tx, ty });
      return;
    }

    if (tapInfo.current && e.pointerId === tapInfo.current.id) {
      const ti = tapInfo.current;
      ti.moved = Math.hypot(e.clientX - ti.x0, e.clientY - ti.y0);
      if (tfRef.current.scale > 1 && ti.moved > TAP_MOVE_TOL) {
        setTf(prev => ({ ...prev, tx: prev.tx + e.movementX, ty: prev.ty + e.movementY }));
      }
    }
  }, []);

  const onPointerUp = useCallback((e) => {
    const ti = tapInfo.current;
    const wasTap = ti && e.pointerId === ti.id
      && ti.moved < TAP_MOVE_TOL && (Date.now() - ti.t0) < TAP_TIME_TOL
      && pointers.current.size === 1;
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) gesture.current = null;
    if (wasTap) applyFillAt(e.clientX, e.clientY);
    if (pointers.current.size === 0) tapInfo.current = null;
  }, [applyFillAt]);

  const handleStartOver = useCallback(() => {
    const canvas = canvasRef.current, blank = blankRef.current;
    if (!canvas || !blank) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(blank, 0, 0);
    setTf({ scale: 1, tx: 0, ty: 0 });
    persistNow();
  }, [persistNow]);

  const dims = dimsRef.current;
  return (
    <div style={{ position: 'relative' }}>
      <div
        style={{
          position: 'relative', overflow: 'hidden', borderRadius: 16,
          border: `1px solid ${P.border}`, background: '#fff',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)', touchAction: 'none',
          maxWidth: 560, margin: '0 auto',
          aspectRatio: dims.w && dims.h ? `${dims.w} / ${dims.h}` : '5 / 7',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <canvas
          ref={canvasRef}
          style={{
            display: 'block', width: '100%', height: '100%',
            transform: `translate(${tf.tx}px, ${tf.ty}px) scale(${tf.scale})`,
            transformOrigin: '0 0', touchAction: 'none', cursor: 'crosshair',
          }}
        />
        <GlitterShimmer />
        {!ready && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: P.sub, fontFamily: SANS, fontSize: '0.85rem',
            background: 'rgba(255,255,255,0.6)', zIndex: 6,
          }}>Loading…</div>
        )}
      </div>

      {/* Toolbar: palette + tools */}
      <div style={{ maxWidth: 560, margin: '14px auto 0' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 12 }}>
          {PALETTE.map(c => {
            const active = color === c;
            return (
              <button
                key={c}
                onClick={() => onColorChange(c)}
                aria-label={`Color ${c}`}
                style={{
                  width: 30, height: 30, borderRadius: '50%', background: c,
                  border: active ? `3px solid ${P.goldL}` : '2px solid rgba(255,255,255,0.35)',
                  boxShadow: active ? '0 0 10px rgba(232,212,160,0.7)' : '0 1px 4px rgba(0,0,0,0.4)',
                  cursor: 'pointer', padding: 0, transition: 'transform 0.1s',
                  transform: active ? 'scale(1.12)' : 'scale(1)',
                }}
              />
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <ToolButton active={color === 'erase'} onClick={() => onColorChange('erase')}>Eraser</ToolButton>
          <ToolButton onClick={persistNow}>Save</ToolButton>
          <ToolButton onClick={handleStartOver}>Start over</ToolButton>
          {tf.scale > 1 && <ToolButton onClick={() => setTf({ scale: 1, tx: 0, ty: 0 })}>Reset zoom</ToolButton>}
        </div>
        <div style={{ textAlign: 'center', color: P.sub, fontFamily: SANS, fontSize: '0.7rem', marginTop: 10, letterSpacing: '0.03em' }}>
          Tap an area to fill it · pinch to zoom · drag with one finger to pan when zoomed
        </div>
      </div>
    </div>
  );
}

function ToolButton({ children, onClick, active }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? 'rgba(201,169,110,0.22)' : 'rgba(255,255,255,0.05)',
        border: `1px solid ${active ? P.borderH : P.border}`,
        color: active ? P.goldL : P.ink,
        borderRadius: 20, padding: '9px 18px', cursor: 'pointer',
        fontFamily: SANS, fontSize: '0.82rem', letterSpacing: '0.03em',
      }}
    >{children}</button>
  );
}

// ── Gentle glitter shimmer: white sparkle dots that slowly twinkle ──
function GlitterShimmer() {
  const sparkles = useRef(
    Array.from({ length: 22 }, () => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: 2 + Math.random() * 3,
      delay: Math.random() * 5,
      dur: 3 + Math.random() * 4,
    }))
  ).current;
  return (
    <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5, overflow: 'hidden', borderRadius: 16 }}>
      <style>{`
        @keyframes irjGlitterTwinkle {
          0%, 100% { opacity: 0; transform: scale(0.4); }
          50% { opacity: 0.9; transform: scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .irj-sparkle { animation: none !important; opacity: 0.5 !important; }
        }
      `}</style>
      {sparkles.map((s, i) => (
        <span
          key={i}
          className="irj-sparkle"
          style={{
            position: 'absolute', left: `${s.left}%`, top: `${s.top}%`,
            width: s.size, height: s.size, borderRadius: '50%',
            background: 'radial-gradient(circle, #fff 0%, rgba(255,255,255,0.6) 40%, transparent 70%)',
            boxShadow: '0 0 6px rgba(255,255,255,0.8)',
            animation: `irjGlitterTwinkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
