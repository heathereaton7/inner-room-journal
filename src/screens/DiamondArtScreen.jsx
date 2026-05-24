import { useState, useMemo, useEffect } from 'react';
import { TEMPLATES, getTemplate } from '../data/diamondArtTemplates.js';
import {
  makeGuidedProgress, makeFreeProgress, paintCell,
  isComplete, progressPercent, serializeArtwork, templateFor, freeKey,
  cellsToArray, cellsFromArray, setImportedTemplateLookup,
} from '../systems/diamondArt.js';
import { BUILTIN_IMAGE_TEMPLATES } from '../data/builtinImageTemplates.js';
import { processUrlToTemplate } from '../systems/imageProcessing.js';
import CanvasDiamondBoard from '../components/CanvasDiamondBoard.jsx';
import DiamondArtFrame from '../components/DiamondArtFrame.jsx';
import ImportArtworkModal from '../components/ImportArtworkModal.jsx';
import CottageBackground from '../components/CottageBackground.jsx';

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
  importedTemplates, setImportedTemplates,
}) {
  const [view, setView] = useState('hub');
  const [activeKey, setActiveKey] = useState(null);  // key in diamondArt map
  const [selectedColor, setSelectedColor] = useState(1);
  const [toast, setToast] = useState(null);
  const [completedArtwork, setCompletedArtwork] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [processing, setProcessing] = useState(null); // { id, label, fraction } | null

  // Allow templateFor() in systems/diamondArt.js to find imported templates
  useEffect(() => {
    setImportedTemplateLookup((id) => importedTemplates?.[id] || null);
    return () => setImportedTemplateLookup(null);
  }, [importedTemplates]);

  // Built-in image templates as picker stubs (no cells until processed)
  const builtinStubs = useMemo(() => {
    return BUILTIN_IMAGE_TEMPLATES.map(b => {
      // If already processed and cached as an imported template, use that
      const cached = importedTemplates?.[b.id];
      if (cached) return cached;
      // Otherwise present as a stub the user can tap to process
      return {
        id: b.id,
        title: b.title,
        verse: b.verse,
        reference: b.reference,
        grid: { cols: 150, rows: 150 },
        palette: [],
        cells: [],
        sourceUrl: b.sourceUrl,
        cropFraction: b.cropFraction,
        defaultPreset: b.defaultPreset,
        _builtinStub: true,
      };
    });
  }, [importedTemplates]);

  // Merge built-in and imported templates for the picker
  const allTemplates = useMemo(() => {
    const imp = Object.values(importedTemplates || {});
    // Filter out imported entries that correspond to builtins (those are surfaced via builtinStubs)
    const userImports = imp.filter(t => !BUILTIN_IMAGE_TEMPLATES.some(b => b.id === t.id));
    return [...TEMPLATES, ...builtinStubs, ...userImports];
  }, [importedTemplates, builtinStubs]);

  // Lazy-process a builtin image template and cache it as an imported template
  const processBuiltin = async (builtinStub) => {
    setProcessing({ id: builtinStub.id, label: 'Preparing artwork...', fraction: 0 });
    try {
      const tpl = await processUrlToTemplate(
        builtinStub.sourceUrl,
        builtinStub.defaultPreset || 'detailed',
        {
          cropFraction: builtinStub.cropFraction,
          onProgress: (label, fraction) => setProcessing({ id: builtinStub.id, label, fraction }),
        }
      );
      const storable = {
        id: builtinStub.id,
        title: builtinStub.title,
        verse: builtinStub.verse || '',
        reference: builtinStub.reference || '',
        grid: { cols: tpl.cols, rows: tpl.rows },
        palette: tpl.palette,
        cells: cellsToArray(tpl.cells),
        thumbnail: tpl.thumbnail,
        sparkleCount: tpl.sparkleCount,
        createdAt: Date.now(),
        source: 'builtin',
      };
      const next = { ...(importedTemplates || {}), [builtinStub.id]: storable };
      setImportedTemplates(next);
      // Start a new guided progress against the template
      setDiamondArt({ ...diamondArt, [builtinStub.id]: makeGuidedProgress(storable) });
      setActiveKey(builtinStub.id);
      setSelectedColor(tpl.palette[0]?.id || 1);
      setProcessing(null);
      setView('paint');
    } catch (e) {
      console.error(e);
      setProcessing(null);
      setToast('Could not load that artwork. Try again.');
    }
  };

  const progress = activeKey ? diamondArt[activeKey] : null;
  const template = useMemo(() => {
    if (!progress || progress.mode !== 'guided') return null;
    const id = progress.templateId;
    if (!id) return null;
    return getTemplate(id) || importedTemplates?.[id] || null;
  }, [progress, importedTemplates]);
  const pct = useMemo(() => progressPercent(progress, template), [progress, template]);
  const complete = useMemo(() => isComplete(progress, template), [progress, template]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1900);
    return () => clearTimeout(t);
  }, [toast]);

  // ── Actions ─────────────────────────────────────────────────────────────
  const startGuided = (tpl) => {
    // If this is a builtin-image stub that hasn't been processed yet, run the pipeline
    if (tpl._builtinStub) {
      processBuiltin(tpl);
      return;
    }
    const key = tpl.id;
    const existing = diamondArt[key];
    // Migrate: if existing progress's grid size OR palette doesn't match
    // current template (e.g. palette upgrades like Lilies 15 → 100), restart.
    const expectedLen = tpl.cells.length;
    const compatible = existing
      && existing.cells?.length === expectedLen
      && existing.cols === tpl.grid.cols
      && existing.rows === tpl.grid.rows
      && existing.palette?.length === tpl.palette.length;
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
      color: P.ink,
      fontFamily: SANS,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <CottageBackground />
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
          onImport={() => setShowImport(true)}
          diamondArt={diamondArt}
          importedTemplates={importedTemplates}
          onResume={(key) => {
            // If a guided piece's grid OR palette no longer matches current template, restart it
            const p = diamondArt[key];
            if (p?.mode === 'guided') {
              const tpl = getTemplate(p.templateId) || importedTemplates?.[p.templateId] || null;
              const compatible = tpl
                && p.cells?.length === tpl.cells.length
                && p.cols === tpl.grid.cols
                && p.rows === tpl.grid.rows
                && p.palette?.length === tpl.palette.length;
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
          allTemplates={allTemplates}
        />
      )}

      {showImport && (
        <ImportArtworkModal
          onClose={() => setShowImport(false)}
          onCommit={(template) => {
            // Persist imported template (convert Uint16Array → number[] for storage)
            const storable = { ...template, cells: cellsToArray(template.cells) };
            const nextImported = { ...(importedTemplates || {}), [template.id]: storable };
            setImportedTemplates(nextImported);
            // Start a new guided progress against the template
            setDiamondArt({ ...diamondArt, [template.id]: makeGuidedProgress(storable) });
            setActiveKey(template.id);
            setSelectedColor(template.palette[0]?.id || 1);
            setShowImport(false);
            setView('paint');
            setToast('Artwork imported');
          }}
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

      {processing && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1500,
          background: 'rgba(10,8,6,0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: 24,
        }}>
          <div style={{ fontFamily: SERIF, fontStyle: 'italic', color: P.goldL, fontSize: '1.4rem', marginBottom: 18, textAlign: 'center' }}>
            Preparing your artwork
          </div>
          <div style={{ width: 280, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden', marginBottom: 14 }}>
            <div style={{
              width: `${Math.round((processing.fraction || 0) * 100)}%`,
              height: '100%', background: P.gold, transition: 'width 0.25s',
            }} />
          </div>
          <div style={{ fontFamily: SANS, fontSize: '0.82rem', color: P.sub, textAlign: 'center' }}>
            {processing.label || 'Processing...'}
          </div>
        </div>
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
function HubView({ onGuided, onFree, onImport, diamondArt, importedTemplates, onResume }) {
  const inProgress = Object.entries(diamondArt || {});
  const resolveTpl = (p) => {
    if (p?.mode !== 'guided') return null;
    return getTemplate(p.templateId) || importedTemplates?.[p.templateId] || null;
  };
  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: '32px 22px 80px' }}>
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <p style={{ fontFamily: SERIF, fontStyle: 'italic', color: P.sub, fontSize: '0.95rem', lineHeight: 1.7, margin: 0 }}>
          A quiet hour with the Word. Place one gem at a time, and watch beauty form.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
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
        <ModeButton
          title="Import"
          subtitle="Your own image"
          onClick={onImport}
        />
      </div>

      {inProgress.length > 0 && (
        <div>
          <div style={sectionLabel}>In progress</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {inProgress.map(([key, p]) => {
              const tpl = resolveTpl(p);
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
function TemplatePickerView({ onPick, diamondArt, allTemplates }) {
  const tpls = allTemplates || TEMPLATES;
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '28px 22px 80px' }}>
      <div style={sectionLabel}>Choose a verse</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
        {tpls.map(tpl => {
          const p = diamondArt?.[tpl.id];
          // Resolve target cells for percent (use template.cells; for imported,
          // template has cells in number[] form, fine for the iteration)
          const pct = p ? Math.round(progressPercent(p, tpl) * 100) : 0;
          const isImported = !!tpl.thumbnail;
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
              <div style={{ marginBottom: 10, position: 'relative' }}>
                {tpl._builtinStub
                  ? (
                    <div style={{ width: '100%', aspectRatio: '1/1', borderRadius: 6, background: '#0E0A06', overflow: 'hidden', position: 'relative' }}>
                      <img
                        src={tpl.sourceUrl}
                        alt=""
                        style={{
                          position: 'absolute',
                          left: `${-(tpl.cropFraction?.x || 0) * 100 / (tpl.cropFraction?.w || 1)}%`,
                          top: `${-(tpl.cropFraction?.y || 0) * 100 / (tpl.cropFraction?.h || 1)}%`,
                          width: `${100 / (tpl.cropFraction?.w || 1)}%`,
                          height: `${100 / (tpl.cropFraction?.h || 1)}%`,
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />
                    </div>
                  )
                  : isImported
                    ? <img src={tpl.thumbnail} alt="" style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: 6, background: '#0E0A06', display: 'block' }} />
                    : <MiniPreview template={tpl} />}
              </div>
              <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '0.98rem', color: P.goldL, marginBottom: 2 }}>{tpl.title}</div>
              <div style={{ fontSize: '0.7rem', color: P.sub, marginBottom: 6, letterSpacing: '0.06em' }}>
                {tpl.reference || (isImported ? `${tpl.grid.cols}×${tpl.grid.rows} · ${(tpl.grid.cols * tpl.grid.rows).toLocaleString()} drills` : '')}
              </div>
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
      {Array.from(template.cells).map((cid, i) => {
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

      <CanvasDiamondBoard
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

      {/* Palette — completed colors auto-hide, number printed on each swatch */}
      <PaletteStrip
        progress={progress}
        template={template}
        selectedColor={selectedColor}
        setSelectedColor={setSelectedColor}
      />

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

// ── Palette strip ─────────────────────────────────────────────────────────
function PaletteStrip({ progress, template, selectedColor, setSelectedColor }) {
  // Count needed vs filled per color id (only relevant in guided mode)
  const completion = useMemo(() => {
    const out = new Map();
    if (progress.mode !== 'guided' || !template) return out;
    const tcells = template.cells;
    const pcells = progress.cells;
    const len = Math.min(tcells.length, pcells.length);
    for (let i = 0; i < len; i++) {
      const t = tcells[i];
      if (t > 0) {
        const cur = out.get(t) || { needed: 0, filled: 0 };
        cur.needed++;
        if (pcells[i] === t) cur.filled++;
        out.set(t, cur);
      }
    }
    return out;
  }, [progress, template]);

  // Visible palette — drop colors that are 100% complete in guided mode
  const visiblePalette = useMemo(() => {
    if (progress.mode !== 'guided' || !template) return progress.palette;
    return progress.palette.filter(p => {
      const info = completion.get(p.id);
      if (!info || info.needed === 0) return false;       // unused colors hidden
      return info.filled < info.needed;                   // hide when finished
    });
  }, [progress.palette, completion, template, progress.mode]);

  // Switch selected color if the current one just got hidden
  useEffect(() => {
    if (!visiblePalette.length) return;
    if (!visiblePalette.find(p => p.id === selectedColor)) {
      setSelectedColor(visiblePalette[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visiblePalette.length]);

  const isLarge = visiblePalette.length > 30;
  const swatch = isLarge ? 28 : 42;
  const gap = isLarge ? 6 : 8;
  const selectedEntry = visiblePalette.find(p => p.id === selectedColor);

  if (visiblePalette.length === 0) {
    return (
      <div style={{
        textAlign: 'center', margin: '14px auto', maxWidth: 520,
        padding: '14px 12px', background: 'rgba(201,169,110,0.08)',
        border: `1px solid ${P.border}`, borderRadius: 10,
        fontFamily: SERIF, fontStyle: 'italic', color: P.goldL, fontSize: '0.95rem',
      }}>
        Every color has been placed. The piece is finished.
      </div>
    );
  }

  return (
    <>
      {selectedEntry && (
        <div style={{ textAlign: 'center', margin: '8px 0 4px', fontSize: '0.74rem', color: P.goldL, fontFamily: SANS }}>
          <span style={{ fontFamily: SERIF, fontStyle: 'italic' }}>{selectedEntry.label}</span>
          <span style={{ color: P.sub }}> · #{selectedEntry.id}</span>
          {selectedEntry.pearl && <span style={{ color: P.sub }}> · pearl</span>}
          {selectedEntry.sparkle && <span style={{ color: P.sub }}> · sparkle</span>}
          {(() => {
            const info = completion.get(selectedEntry.id);
            if (!info) return null;
            return <span style={{ color: P.sub }}> · {info.filled} / {info.needed}</span>;
          })()}
        </div>
      )}
      <div style={{
        display: 'flex', flexWrap: 'wrap', justifyContent: 'center',
        gap, margin: '8px auto', maxWidth: 580,
        padding: '12px 10px', background: 'rgba(0,0,0,0.3)', borderRadius: 10,
        border: `1px solid ${P.border}`,
        maxHeight: isLarge ? 220 : 'none',
        overflowY: isLarge ? 'auto' : 'visible',
      }}>
        {visiblePalette.map(p => {
          const selected = p.id === selectedColor;
          const luma = paletteLuma(p.hex);
          const numColor = luma > 140 ? '#1A1612' : '#FAF6F0';
          const numShadow = luma > 140 ? '0 1px 0 rgba(255,255,255,0.5)' : '0 1px 2px rgba(0,0,0,0.55)';
          const fontSize = Math.max(10, Math.round(swatch * 0.48));
          return (
            <button key={p.id} onClick={() => setSelectedColor(p.id)} style={{
              width: swatch, height: swatch, borderRadius: isLarge ? 6 : 8,
              background: p.hex,
              border: selected ? `2px solid ${P.goldL}` : `1px solid rgba(0,0,0,0.4)`,
              boxShadow: selected ? '0 0 0 2px rgba(232,212,160,0.4)' : '0 1px 2px rgba(0,0,0,0.3)',
              cursor: 'pointer',
              position: 'relative',
              transition: 'transform 0.15s',
              transform: selected ? 'scale(1.15)' : 'scale(1)',
              padding: 0,
            }} title={`${p.label} (#${p.id})`}>
              {p.sparkle && (
                <span style={{ position: 'absolute', top: 1, right: 2, fontSize: '0.55rem', color: 'rgba(0,0,0,0.55)', fontWeight: 700, lineHeight: 1 }}>*</span>
              )}
              {p.pearl && (
                <span style={{ position: 'absolute', top: 1, left: 2, fontSize: '0.55rem', color: 'rgba(0,0,0,0.55)', fontWeight: 700, lineHeight: 1 }}>o</span>
              )}
              {/* Number always visible — centered on the swatch */}
              <span style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize, fontWeight: 700, color: numColor,
                fontFamily: SANS, textShadow: numShadow,
                pointerEvents: 'none',
              }}>{p.id}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

function paletteLuma(hex) {
  let h = (hex || '#000').replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const n = parseInt(h, 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
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
