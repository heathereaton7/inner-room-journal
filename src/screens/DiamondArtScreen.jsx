import { useState, useMemo, useEffect } from 'react';
import { TEMPLATES, getTemplate } from '../data/diamondArtTemplates.js';
import {
  makeGuidedProgress, makeFreeProgress, paintCell,
  isComplete, progressPercent, serializeArtwork, templateFor, freeKey,
} from '../systems/diamondArt.js';
import DiamondArtCanvas from '../components/DiamondArtCanvas.jsx';
import DiamondArtFrame from '../components/DiamondArtFrame.jsx';

const SERIF = "'Cormorant Garamond', Georgia, serif";
const SANS = "'Inter', system-ui, -apple-system, sans-serif";

const P = {
  bg: '#1A1612',
  ink: '#FAF6F0',
  sub: 'rgba(232,212,160,0.55)',
  border: 'rgba(201,169,110,0.18)',
  gold: '#C9A96E',
  goldL: '#E8D4A0',
  rose: '#D4A0A8',
  panel: 'rgba(255,255,255,0.04)',
};

/**
 * DiamondArtScreen — top-level screen for the Diamond Art mini-game.
 *
 * Views:
 *   'hub'      — mode picker + recent works
 *   'guided'   — pick a template
 *   'paint'    — active painting canvas
 *   'gallery'  — list of finished pieces
 *   'complete' — completion celebration view
 */
export default function DiamondArtScreen({
  onBack,
  diamondArt, setDiamondArt,
  artGallery, setArtGallery,
  inventory, setInventory,
}) {
  const [view, setView] = useState('hub');
  const [activeKey, setActiveKey] = useState(null);  // key in diamondArt map
  const [selectedColor, setSelectedColor] = useState(1);
  const [toast, setToast] = useState(null);
  const [completedArtwork, setCompletedArtwork] = useState(null);

  const progress = activeKey ? diamondArt[activeKey] : null;
  const template = useMemo(() => templateFor(progress), [progress]);
  const pct = useMemo(() => progressPercent(progress, template), [progress, template]);
  const complete = useMemo(() => isComplete(progress, template), [progress, template]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1900);
    return () => clearTimeout(t);
  }, [toast]);

  // ── Actions ─────────────────────────────────────────────────────────────
  const startGuided = (tpl) => {
    const key = tpl.id;
    const existing = diamondArt[key];
    // Migrate: if existing progress's grid size doesn't match current template, restart
    const expectedLen = tpl.cells.length;
    const compatible = existing
      && existing.cells?.length === expectedLen
      && existing.cols === tpl.grid.cols
      && existing.rows === tpl.grid.rows;
    if (!compatible) {
      setDiamondArt({ ...diamondArt, [key]: makeGuidedProgress(tpl) });
    }
    setActiveKey(key);
    setSelectedColor(tpl.palette[0]?.id || 1);
    setView('paint');
  };

  const startFreestyle = () => {
    const prog = makeFreeProgress();
    const key = freeKey(prog);
    setDiamondArt({ ...diamondArt, [key]: prog });
    setActiveKey(key);
    setSelectedColor(prog.palette[0]?.id || 1);
    setView('paint');
  };

  const onCellTap = (idx) => {
    if (!progress) return;
    const next = paintCell(progress, template, idx, selectedColor);
    if (next !== progress) {
      setDiamondArt({ ...diamondArt, [activeKey]: next });
    } else if (progress.mode === 'guided' && template && template.cells[idx] !== 0 && template.cells[idx] !== selectedColor) {
      // Wrong color — quick subtle nudge
      setToast(`Try color ${template.cells[idx]}`);
    }
  };

  const onSaveExit = () => {
    setToast('Saved');
    setTimeout(() => setView('hub'), 400);
  };

  const onComplete = () => {
    if (!progress || !complete) return;
    const artwork = serializeArtwork(progress, template);
    setArtGallery([artwork, ...(artGallery || [])]);
    // Add to inventory as placeable
    setInventory({ ...(inventory || {}), [artwork.id]: 1 });
    // Remove the in-progress entry
    const next = { ...diamondArt };
    delete next[activeKey];
    setDiamondArt(next);
    setCompletedArtwork(artwork);
    setView('complete');
  };

  const onPlaceInCabin = (artwork) => {
    // Already in inventory; this just acknowledges and returns to cabin
    setToast('Added to your inventory — place from the cabin');
  };

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 50% 20%, #2A1F18 0%, #14100C 70%)',
      color: P.ink,
      fontFamily: SANS,
      position: 'relative',
    }}>
      <Header
        title={view === 'gallery' ? 'Gallery' : view === 'paint' ? (template ? template.title : 'Freestyle') : view === 'complete' ? 'A new piece' : 'Art Studio'}
        onBack={() => {
          if (view === 'hub') onBack();
          else if (view === 'paint') setView('hub');
          else if (view === 'gallery') setView('hub');
          else if (view === 'complete') { setCompletedArtwork(null); setView('hub'); }
          else setView('hub');
        }}
        right={
          view === 'hub' ? (
            <button onClick={() => setView('gallery')} style={smallBtn}>
              Gallery {artGallery?.length ? `(${artGallery.length})` : ''}
            </button>
          ) : null
        }
      />

      {view === 'hub' && (
        <HubView
          onGuided={() => setView('guided')}
          onFree={startFreestyle}
          diamondArt={diamondArt}
          onResume={(key) => {
            // If a guided piece's grid size no longer matches current template, restart it
            const p = diamondArt[key];
            if (p?.mode === 'guided') {
              const tpl = templateFor(p);
              const compatible = tpl
                && p.cells?.length === tpl.cells.length
                && p.cols === tpl.grid.cols
                && p.rows === tpl.grid.rows;
              if (!compatible && tpl) {
                setDiamondArt({ ...diamondArt, [key]: makeGuidedProgress(tpl) });
              }
            }
            setActiveKey(key);
            setView('paint');
          }}
        />
      )}

      {view === 'guided' && (
        <TemplatePickerView
          onPick={startGuided}
          diamondArt={diamondArt}
        />
      )}

      {view === 'paint' && progress && (
        <PaintView
          progress={progress}
          template={template}
          selectedColor={selectedColor}
          setSelectedColor={setSelectedColor}
          onCellTap={onCellTap}
          pct={pct}
          complete={complete}
          onSaveExit={onSaveExit}
          onComplete={onComplete}
        />
      )}

      {view === 'gallery' && (
        <GalleryView
          artGallery={artGallery || []}
          onPlace={onPlaceInCabin}
        />
      )}

      {view === 'complete' && completedArtwork && (
        <CompleteView
          artwork={completedArtwork}
          onDone={() => { setCompletedArtwork(null); setView('gallery'); }}
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

// ── Header ────────────────────────────────────────────────────────────────
function Header({ title, onBack, right }) {
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 10,
      background: 'rgba(20,16,12,0.85)',
      backdropFilter: 'blur(8px)',
      padding: '0 18px', height: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      borderBottom: `1px solid ${P.border}`,
    }}>
      <button onClick={onBack} style={{
        background: 'transparent', border: 'none', cursor: 'pointer',
        color: P.sub, fontSize: '0.82rem', fontFamily: SANS, padding: 0,
      }}>← Back</button>
      <span style={{ fontFamily: SERIF, fontStyle: 'italic', color: P.goldL, fontSize: '0.95rem' }}>{title}</span>
      <div style={{ minWidth: 60, textAlign: 'right' }}>{right}</div>
    </header>
  );
}

const smallBtn = {
  background: 'transparent',
  border: `1px solid ${P.border}`,
  color: P.gold,
  padding: '5px 12px',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: '0.74rem',
  fontFamily: SANS,
};

// ── Hub view ──────────────────────────────────────────────────────────────
function HubView({ onGuided, onFree, diamondArt, onResume }) {
  const inProgress = Object.entries(diamondArt || {});
  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: '32px 22px 80px' }}>
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <p style={{ fontFamily: SERIF, fontStyle: 'italic', color: P.sub, fontSize: '0.95rem', lineHeight: 1.7, margin: 0 }}>
          A quiet hour with the Word. Place one gem at a time, and watch beauty form.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 28 }}>
        <ModeButton
          title="Guided"
          subtitle="Verse-by-verse art"
          onClick={onGuided}
        />
        <ModeButton
          title="Freestyle"
          subtitle="Blank canvas"
          onClick={onFree}
        />
      </div>

      {inProgress.length > 0 && (
        <div>
          <div style={sectionLabel}>In progress</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {inProgress.map(([key, p]) => {
              const tpl = p.mode === 'guided' ? getTemplate(p.templateId) : null;
              const pct = Math.round(progressPercent(p, tpl) * 100);
              return (
                <button key={key} onClick={() => onResume(key)} style={resumeRow}>
                  <span style={{ fontFamily: SERIF, fontStyle: 'italic', color: P.ink, fontSize: '0.94rem' }}>
                    {tpl ? tpl.title : 'Freestyle canvas'}
                  </span>
                  <span style={{ fontFamily: SANS, fontSize: '0.74rem', color: P.gold }}>{pct}%</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
}

function ModeButton({ title, subtitle, onClick }) {
  return (
    <button onClick={onClick} style={{
      background: 'linear-gradient(160deg, rgba(201,169,110,0.10), rgba(201,169,110,0.03))',
      border: `1px solid ${P.border}`,
      color: P.ink,
      padding: '24px 16px',
      borderRadius: 14,
      cursor: 'pointer',
      textAlign: 'left',
      transition: 'all 0.2s',
      fontFamily: SANS,
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(201,169,110,0.45)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = P.border}
    >
      <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '1.18rem', color: P.goldL, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: '0.78rem', color: P.sub }}>{subtitle}</div>
    </button>
  );
}

const sectionLabel = {
  fontSize: '0.66rem', fontFamily: SANS, fontWeight: 600,
  letterSpacing: '0.14em', color: P.sub, textTransform: 'uppercase',
  marginBottom: 12, opacity: 0.8,
};

const resumeRow = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  background: P.panel, border: `1px solid ${P.border}`,
  padding: '12px 16px', borderRadius: 10,
  cursor: 'pointer', textAlign: 'left', fontFamily: SANS,
};

// ── Template picker ───────────────────────────────────────────────────────
function TemplatePickerView({ onPick, diamondArt }) {
  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: '28px 22px 80px' }}>
      <div style={sectionLabel}>Choose a verse</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
        {TEMPLATES.map(tpl => {
          const p = diamondArt?.[tpl.id];
          const pct = p ? Math.round(progressPercent(p, tpl) * 100) : 0;
          return (
            <button key={tpl.id} onClick={() => onPick(tpl)} style={{
              background: P.panel, border: `1px solid ${P.border}`,
              color: P.ink, padding: 14, borderRadius: 12,
              cursor: 'pointer', textAlign: 'left', fontFamily: SANS,
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(201,169,110,0.45)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = P.border}
            >
              <div style={{ marginBottom: 10 }}>
                <MiniPreview template={tpl} />
              </div>
              <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '0.98rem', color: P.goldL, marginBottom: 2 }}>{tpl.title}</div>
              <div style={{ fontSize: '0.7rem', color: P.sub, marginBottom: 6, letterSpacing: '0.06em' }}>{tpl.reference}</div>
              {pct > 0 && (
                <div style={{ fontSize: '0.7rem', color: P.gold }}>{pct}% complete</div>
              )}
            </button>
          );
        })}
      </div>
    </main>
  );
}

function MiniPreview({ template }) {
  // Render template as small fully-filled preview using the FRAME component logic in mini form
  const cellSize = 4;
  const pad = 2;
  const cols = template.grid.cols, rows = template.grid.rows;
  const w = cols * cellSize + pad * 2;
  const h = rows * cellSize + pad * 2;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 'auto', display: 'block', background: '#0E0A06', borderRadius: 4 }}>
      {template.cells.map((cid, i) => {
        if (!cid) return null;
        const c = i % cols, r = Math.floor(i / cols);
        const hex = template.palette.find(p => p.id === cid)?.hex || '#fff';
        return (
          <rect key={i}
            x={pad + c * cellSize} y={pad + r * cellSize}
            width={cellSize - 0.4} height={cellSize - 0.4}
            rx={0.5}
            fill={hex}
          />
        );
      })}
    </svg>
  );
}

// ── Paint view ────────────────────────────────────────────────────────────
function PaintView({ progress, template, selectedColor, setSelectedColor, onCellTap, pct, complete, onSaveExit, onComplete }) {
  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: '20px 14px 100px' }}>
      {template && (
        <div style={{ textAlign: 'center', marginBottom: 14 }}>
          <p style={{ fontFamily: SERIF, fontStyle: 'italic', color: P.goldL, fontSize: '0.9rem', margin: '0 0 4px', lineHeight: 1.55 }}>
            "{template.verse}"
          </p>
          <div style={{ fontSize: '0.66rem', color: P.sub, letterSpacing: '0.1em' }}>{template.reference}</div>
        </div>
      )}

      <DiamondArtCanvas
        progress={progress}
        template={template}
        selectedColor={selectedColor}
        onCellTap={onCellTap}
      />

      {/* Progress bar */}
      <div style={{ margin: '16px auto 8px', maxWidth: 520 }}>
        <div style={{ height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ width: `${Math.round(pct * 100)}%`, height: '100%', background: P.gold, transition: 'width 0.2s' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: '0.7rem', color: P.sub, fontFamily: SANS }}>
          <span>{Math.round(pct * 100)}% complete</span>
          {progress.mode === 'free' && <span>Freestyle</span>}
        </div>
      </div>

      {/* Palette — compact swatches for large palettes */}
      {(() => {
        const isLarge = progress.palette.length > 30;
        const swatch = isLarge ? 24 : 38;
        const gap = isLarge ? 5 : 8;
        const selectedEntry = progress.palette.find(p => p.id === selectedColor);
        return (
          <>
            {selectedEntry && (
              <div style={{ textAlign: 'center', margin: '8px 0 4px', fontSize: '0.74rem', color: P.goldL, fontFamily: SANS }}>
                <span style={{ fontFamily: SERIF, fontStyle: 'italic' }}>{selectedEntry.label}</span>
                <span style={{ color: P.sub }}> · #{selectedEntry.id}</span>
                {selectedEntry.pearl && <span style={{ color: P.sub }}> · pearl</span>}
                {selectedEntry.sparkle && <span style={{ color: P.sub }}> · sparkle</span>}
              </div>
            )}
            <div style={{
              display: 'flex', flexWrap: 'wrap', justifyContent: 'center',
              gap, margin: '8px auto', maxWidth: 560,
              padding: '10px 8px', background: 'rgba(0,0,0,0.3)', borderRadius: 10,
              border: `1px solid ${P.border}`,
              maxHeight: isLarge ? 200 : 'none',
              overflowY: isLarge ? 'auto' : 'visible',
            }}>
              {progress.palette.map(p => {
                const selected = p.id === selectedColor;
                return (
                  <button key={p.id} onClick={() => setSelectedColor(p.id)} style={{
                    width: swatch, height: swatch, borderRadius: isLarge ? 5 : 8,
                    background: p.hex,
                    border: selected ? `2px solid ${P.goldL}` : `1px solid rgba(0,0,0,0.4)`,
                    boxShadow: selected ? '0 0 0 2px rgba(232,212,160,0.35)' : '0 1px 2px rgba(0,0,0,0.3)',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'transform 0.15s',
                    transform: selected ? 'scale(1.15)' : 'scale(1)',
                    padding: 0,
                  }} title={`${p.label} (#${p.id})`}>
                    {p.sparkle && (
                      <span style={{ position: 'absolute', top: 1, right: 2, fontSize: '0.55rem', color: 'rgba(0,0,0,0.5)', fontWeight: 700, lineHeight: 1 }}>*</span>
                    )}
                    {p.pearl && (
                      <span style={{ position: 'absolute', top: 1, left: 2, fontSize: '0.55rem', color: 'rgba(0,0,0,0.5)', fontWeight: 700, lineHeight: 1 }}>o</span>
                    )}
                    {!isLarge && (
                      <span style={{
                        position: 'absolute', bottom: -16, left: '50%', transform: 'translateX(-50%)',
                        fontSize: '0.62rem', color: selected ? P.goldL : P.sub, fontFamily: SANS, fontWeight: 600,
                      }}>{p.id}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        );
      })()}

      {/* Footer actions */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 28, flexWrap: 'wrap' }}>
        <button onClick={onSaveExit} style={{
          background: 'transparent', border: `1px solid ${P.border}`, color: P.sub,
          padding: '10px 22px', borderRadius: 8, cursor: 'pointer',
          fontSize: '0.82rem', fontFamily: SANS,
        }}>Save & exit</button>
        <button
          onClick={onComplete}
          disabled={!complete}
          style={{
            background: complete ? P.gold : 'transparent',
            border: `1px solid ${complete ? P.gold : P.border}`,
            color: complete ? '#1A1612' : 'rgba(180,165,148,0.35)',
            padding: '10px 28px', borderRadius: 8,
            cursor: complete ? 'pointer' : 'default',
            fontSize: '0.86rem', fontFamily: SANS,
            fontWeight: 700,
          }}>Complete →</button>
      </div>
    </main>
  );
}

// ── Gallery view ──────────────────────────────────────────────────────────
function GalleryView({ artGallery, onPlace }) {
  if (artGallery.length === 0) {
    return (
      <main style={{ maxWidth: 640, margin: '0 auto', padding: '60px 22px', textAlign: 'center' }}>
        <p style={{ fontFamily: SERIF, fontStyle: 'italic', color: P.sub, fontSize: '0.96rem', lineHeight: 1.7 }}>
          Your gallery is empty.<br />Finish your first piece and it will rest here.
        </p>
      </main>
    );
  }
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '28px 22px 80px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 22, justifyItems: 'center' }}>
        {artGallery.map(art => (
          <div key={art.id} style={{ textAlign: 'center' }}>
            <DiamondArtFrame artwork={art} size={220} showLabel />
            <button onClick={() => onPlace(art)} style={{
              marginTop: 10,
              background: 'transparent', border: `1px solid ${P.border}`,
              color: P.gold, padding: '6px 14px', borderRadius: 6,
              cursor: 'pointer', fontSize: '0.74rem', fontFamily: SANS,
            }}>Place in cabin</button>
          </div>
        ))}
      </div>
    </main>
  );
}

// ── Complete celebration ──────────────────────────────────────────────────
function CompleteView({ artwork, onDone }) {
  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: '40px 22px', textAlign: 'center' }}>
      <p style={{ fontFamily: SERIF, fontStyle: 'italic', color: P.goldL, fontSize: '1.04rem', marginBottom: 24, lineHeight: 1.7 }}>
        Finished. Hold this work in your hands and breathe.
      </p>
      <DiamondArtFrame artwork={artwork} size={280} showLabel />
      <div style={{ marginTop: 28 }}>
        <p style={{ fontFamily: SERIF, fontStyle: 'italic', color: P.sub, fontSize: '0.86rem', maxWidth: 380, margin: '0 auto 18px', lineHeight: 1.6 }}>
          This piece has been added to your inventory. You can place it in the cabin from your decor menu.
        </p>
        <button onClick={onDone} style={{
          background: P.gold, border: 'none', color: '#1A1612',
          padding: '10px 28px', borderRadius: 8,
          cursor: 'pointer', fontSize: '0.86rem', fontFamily: SANS, fontWeight: 700,
        }}>View gallery</button>
      </div>
    </main>
  );
}
