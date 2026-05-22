import { useEffect, useRef, useState, useCallback } from 'react';
import {
  QUALITY_PRESETS, presetById, drillCount,
  loadImageToCanvas, sharpenCanvas, extractPalette,
  downscaleToGrid, ditherToPaletteIndices, detectSparkles,
  canvasToThumbnail, recommendedPreset,
} from '../systems/imageProcessing.js';

const SERIF = "'Cormorant Garamond', Georgia, serif";
const SANS = "'Inter', system-ui, -apple-system, sans-serif";

const P = {
  bg: '#1A1612',
  panel: 'rgba(255,255,255,0.04)',
  ink: '#FAF6F0',
  sub: 'rgba(232,212,160,0.55)',
  border: 'rgba(201,169,110,0.18)',
  borderH: 'rgba(201,169,110,0.45)',
  gold: '#C9A96E',
  goldL: '#E8D4A0',
};

/**
 * ImportArtworkModal — upload an image and convert it into a diamond-art
 * template with the chosen quality preset.
 *
 * Props:
 *   onClose(): close without import
 *   onCommit(template): pass the new imported template up
 */
export default function ImportArtworkModal({ onClose, onCommit }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [verse, setVerse] = useState('');
  const [reference, setReference] = useState('');
  const [presetId, setPresetId] = useState('detailed');
  const [sparkles, setSparkles] = useState(true);
  const [sourceCanvas, setSourceCanvas] = useState(null);
  const [sharpened, setSharpened] = useState(null);
  const [palette, setPalette] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewSparkleCount, setPreviewSparkleCount] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [progressLabel, setProgressLabel] = useState('');
  const [error, setError] = useState(null);
  const previewSeqRef = useRef(0);

  // ── When file changes: load, sharpen, extract palette, suggest preset ──
  useEffect(() => {
    if (!file) return;
    let cancelled = false;
    (async () => {
      try {
        setError(null);
        setProcessing(true);
        setProgressLabel('Loading image...');
        const canvas = await loadImageToCanvas(file, 1024);
        if (cancelled) return;
        setSourceCanvas(canvas);
        setProgressLabel('Sharpening...');
        const sh = sharpenCanvas(canvas, 0.4);
        if (cancelled) return;
        setSharpened(sh);
        setProgressLabel('Extracting 80-color palette...');
        const pal = extractPalette(sh, 80);
        if (cancelled) return;
        setPalette(pal);
        setPresetId(recommendedPreset(canvas));
        if (!title) {
          const guess = (file.name || '').replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ').trim();
          if (guess) setTitle(guess.slice(0, 60));
        }
      } catch (e) {
        console.error(e);
        setError('Could not read this image. Try a different file.');
      } finally {
        if (!cancelled) {
          setProcessing(false);
          setProgressLabel('');
        }
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  // ── Live preview whenever preset / sparkle toggle changes ──
  useEffect(() => {
    if (!sharpened || !palette) return;
    let cancelled = false;
    const seq = ++previewSeqRef.current;
    (async () => {
      const preset = presetById(presetId);
      const small = downscaleToGrid(sharpened, preset.cols, preset.rows);
      if (cancelled || previewSeqRef.current !== seq) return;
      const cells = ditherToPaletteIndices(small, palette, 'floyd-steinberg');
      if (cancelled || previewSeqRef.current !== seq) return;
      const finalPalette = sparkles ? detectSparkles(palette, cells) : palette;
      let sparkleCount = 0;
      if (sparkles) {
        for (let i = 0; i < cells.length; i++) {
          const p = finalPalette.find(pp => pp.id === cells[i]);
          if (p?.sparkle) sparkleCount++;
        }
      }
      const url = canvasToThumbnail(small, finalPalette, cells, preset.cols, preset.rows, 280);
      if (cancelled || previewSeqRef.current !== seq) return;
      setPreviewUrl(url);
      setPreviewSparkleCount(sparkleCount);
    })();
    return () => { cancelled = true; };
  }, [sharpened, palette, presetId, sparkles]);

  const handleFile = useCallback((f) => {
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }
    setFile(f);
  }, []);

  const onSave = useCallback(() => {
    if (!sharpened || !palette || !title.trim()) return;
    setProcessing(true);
    setProgressLabel('Building template...');
    // Defer to next frame so spinner can render
    setTimeout(() => {
      try {
        const preset = presetById(presetId);
        const small = downscaleToGrid(sharpened, preset.cols, preset.rows);
        const cells = ditherToPaletteIndices(small, palette, 'floyd-steinberg');
        const finalPalette = sparkles ? detectSparkles(palette, cells) : palette;
        let sparkleCount = 0;
        if (sparkles) {
          for (let i = 0; i < cells.length; i++) {
            const p = finalPalette.find(pp => pp.id === cells[i]);
            if (p?.sparkle) sparkleCount++;
          }
        }
        const thumbnail = canvasToThumbnail(small, finalPalette, cells, preset.cols, preset.rows, 96);

        const id = `imp_${Date.now()}`;
        const template = {
          id,
          title: title.trim().slice(0, 80),
          verse: verse.trim().slice(0, 280),
          reference: reference.trim().slice(0, 60),
          grid: { cols: preset.cols, rows: preset.rows },
          palette: finalPalette,
          cells, // Uint16Array — caller converts to number[] for storage
          thumbnail,
          sparkleCount,
          createdAt: Date.now(),
          source: 'upload',
        };
        onCommit(template);
      } catch (e) {
        console.error(e);
        setError('Could not save artwork. Try again.');
        setProcessing(false);
      }
    }, 30);
  }, [sharpened, palette, presetId, sparkles, title, verse, reference, onCommit]);

  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.78)',
      backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, overflowY: 'auto',
    }}>
      <div style={{
        background: 'linear-gradient(160deg,#1A1612,#0E0A06)',
        border: `1px solid ${P.border}`, borderRadius: 18,
        maxWidth: 720, width: '100%',
        padding: 24,
        boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
      }} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div>
            <div style={{ fontFamily: SERIF, fontStyle: 'italic', color: P.goldL, fontSize: '1.4rem' }}>
              Import Artwork
            </div>
            <div style={{ fontFamily: SANS, color: P.sub, fontSize: '0.78rem', marginTop: 2 }}>
              Bring an AI-generated scene into your studio.
            </div>
          </div>
          <button onClick={onClose} style={closeBtn}>×</button>
        </div>

        {/* File picker / drop area */}
        {!file && (
          <FileDrop onFile={handleFile} />
        )}

        {file && (
          <>
            {/* Two-column layout: preview | controls */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) 1fr', gap: 18, marginBottom: 18 }}>
              <div>
                {previewUrl ? (
                  <img src={previewUrl} alt="preview"
                    style={{
                      width: '100%', aspectRatio: '1/1', objectFit: 'cover',
                      borderRadius: 10, background: '#0A0805',
                      boxShadow: '0 0 0 1px rgba(201,169,110,0.2), inset 0 0 16px rgba(0,0,0,0.4)',
                      display: 'block',
                    }}
                  />
                ) : (
                  <div style={{
                    width: '100%', aspectRatio: '1/1',
                    borderRadius: 10, background: '#0A0805',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: P.sub, fontFamily: SERIF, fontStyle: 'italic',
                    border: `1px dashed ${P.border}`,
                  }}>
                    {processing ? progressLabel : 'Preview…'}
                  </div>
                )}
                {previewUrl && previewSparkleCount > 0 && (
                  <div style={{ marginTop: 8, fontSize: '0.74rem', color: P.gold, textAlign: 'center', fontFamily: SANS }}>
                    {previewSparkleCount.toLocaleString()} sparkle drills
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Label>Title</Label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder="Name this piece"
                  style={fieldStyle} />
                <Label>Verse <span style={{ color: P.sub, fontWeight: 400 }}>(optional)</span></Label>
                <textarea value={verse} onChange={(e) => setVerse(e.target.value)}
                  placeholder="A short scripture line..."
                  rows={2}
                  style={{ ...fieldStyle, resize: 'vertical', fontFamily: SERIF, fontStyle: 'italic' }} />
                <Label>Reference <span style={{ color: P.sub, fontWeight: 400 }}>(optional)</span></Label>
                <input type="text" value={reference} onChange={(e) => setReference(e.target.value)}
                  placeholder="e.g. Psalm 23:1"
                  style={fieldStyle} />
              </div>
            </div>

            {/* Quality presets */}
            <Label>Quality</Label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
              {QUALITY_PRESETS.map(p => {
                const selected = p.id === presetId;
                return (
                  <button key={p.id} onClick={() => setPresetId(p.id)} style={{
                    flex: '1 1 100px',
                    minWidth: 100,
                    background: selected ? 'rgba(201,169,110,0.18)' : P.panel,
                    border: selected ? `1px solid ${P.borderH}` : `1px solid ${P.border}`,
                    color: selected ? P.goldL : P.ink,
                    padding: '10px 8px', borderRadius: 10,
                    cursor: 'pointer', fontFamily: SANS,
                    textAlign: 'center',
                  }}>
                    <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '0.96rem' }}>{p.label}</div>
                    <div style={{ fontSize: '0.66rem', color: P.sub, marginTop: 2 }}>
                      {drillCount(p).toLocaleString()} drills
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Sparkle toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 14px', background: P.panel, border: `1px solid ${P.border}`,
              borderRadius: 10, marginBottom: 18 }}>
              <div>
                <div style={{ fontFamily: SERIF, fontStyle: 'italic', color: P.ink, fontSize: '0.92rem' }}>
                  Enable sparkle gems
                </div>
                <div style={{ fontSize: '0.72rem', color: P.sub, fontFamily: SANS, marginTop: 1 }}>
                  Brightest highlights become sparkle drills.
                </div>
              </div>
              <button onClick={() => setSparkles(s => !s)} style={{
                width: 46, height: 26, borderRadius: 13,
                background: sparkles ? P.gold : 'rgba(255,255,255,0.1)',
                border: 'none', cursor: 'pointer',
                position: 'relative', transition: 'background 0.2s',
              }}>
                <span style={{
                  position: 'absolute', top: 3, left: sparkles ? 22 : 3,
                  width: 20, height: 20, borderRadius: '50%',
                  background: '#FFF', transition: 'left 0.2s',
                }} />
              </button>
            </div>

            {error && (
              <div style={{ background: 'rgba(180,40,40,0.18)', border: '1px solid rgba(220,80,80,0.3)',
                color: '#F8C8C8', padding: '8px 12px', borderRadius: 8, marginBottom: 12, fontSize: '0.82rem' }}>
                {error}
              </div>
            )}

            {/* Footer actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={() => { setFile(null); setSourceCanvas(null); setSharpened(null); setPalette(null); setPreviewUrl(null); setTitle(''); }} style={ghostBtn}>
                ← Choose another image
              </button>
              <button
                onClick={onSave}
                disabled={!title.trim() || !previewUrl || processing}
                style={{
                  background: title.trim() && previewUrl && !processing ? P.gold : 'rgba(255,255,255,0.06)',
                  color: title.trim() && previewUrl && !processing ? '#1A1612' : 'rgba(232,212,160,0.35)',
                  border: 'none', padding: '12px 28px', borderRadius: 8,
                  cursor: title.trim() && previewUrl && !processing ? 'pointer' : 'default',
                  fontFamily: SANS, fontWeight: 700, fontSize: '0.92rem',
                }}>
                {processing ? (progressLabel || 'Working...') : 'Save artwork →'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function FileDrop({ onFile }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const f = e.dataTransfer.files?.[0];
        if (f) onFile(f);
      }}
      onClick={() => inputRef.current?.click()}
      style={{
        border: `2px dashed ${dragOver ? P.borderH : P.border}`,
        borderRadius: 14,
        padding: '48px 24px',
        textAlign: 'center',
        cursor: 'pointer',
        background: dragOver ? 'rgba(201,169,110,0.06)' : 'transparent',
        transition: 'all 0.2s',
      }}
    >
      <div style={{ fontFamily: SERIF, fontStyle: 'italic', color: P.goldL, fontSize: '1.1rem', marginBottom: 8 }}>
        Drop an image here
      </div>
      <div style={{ fontFamily: SANS, color: P.sub, fontSize: '0.8rem' }}>
        or click to browse · JPG, PNG, WebP supported
      </div>
      <input ref={inputRef} type="file" accept="image/*" hidden
        onChange={(e) => onFile(e.target.files?.[0])} />
    </div>
  );
}

const Label = ({ children }) => (
  <div style={{
    fontSize: '0.66rem', fontFamily: SANS, fontWeight: 600,
    letterSpacing: '0.14em', color: P.sub, textTransform: 'uppercase',
    marginBottom: 6,
  }}>{children}</div>
);

const fieldStyle = {
  background: 'rgba(0,0,0,0.3)',
  border: `1px solid ${P.border}`,
  color: P.ink, padding: '8px 12px', borderRadius: 8,
  fontFamily: SANS, fontSize: '0.92rem',
  outline: 'none',
};
const ghostBtn = {
  background: 'transparent', border: `1px solid ${P.border}`,
  color: P.sub, padding: '10px 18px', borderRadius: 8,
  cursor: 'pointer', fontFamily: SANS, fontSize: '0.82rem',
};
const closeBtn = {
  background: 'transparent', border: 'none', color: P.sub,
  fontSize: '1.6rem', lineHeight: 1, cursor: 'pointer', padding: '4px 8px',
};
