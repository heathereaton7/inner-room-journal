import { useState, useMemo, useEffect, useRef } from 'react';
import { HIDDEN_OBJECT_SCENES, getScene } from '../data/hiddenObjectScenes.js';
import CottageBackground from '../components/CottageBackground.jsx';
import SoundButton from '../components/SoundButton.jsx';

const SERIF = "'Cormorant Garamond', Georgia, serif";
const SANS = "'Inter', system-ui, -apple-system, sans-serif";

const P = {
  bg: '#1A1612',
  ink: '#FAF6F0',
  sub: 'rgba(232,212,160,0.55)',
  border: 'rgba(201,169,110,0.18)',
  gold: '#C9A96E',
  goldL: '#E8D4A0',
  panel: 'rgba(255,255,255,0.04)',
};

/**
 * HiddenObjectScreen — tap-on-scene "I Spy" game.
 *
 * Hub view lists the scenes. Each scene hides a list of objects in one
 * illustration; tap each object to find it. Finding them all reveals a verse.
 *
 * Props:
 *   onBack()
 *   progress              — { [sceneId]: { found: string[], completedAt? } }
 *   onProgressChange(next)
 */
export default function HiddenObjectScreen({ onBack, progress, onProgressChange }) {
  const [view, setView] = useState('hub'); // 'hub' | 'play'
  const [activeId, setActiveId] = useState(null);
  const [toast, setToast] = useState(null);

  const activeScene = activeId ? getScene(activeId) : null;
  const activeProgress = activeId ? (progress?.[activeId] || { found: [] }) : null;

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1600);
    return () => clearTimeout(t);
  }, [toast]);

  const startScene = (id) => { setActiveId(id); setView('play'); };

  const onObjectFound = (sceneId, obj) => {
    const prev = progress?.[sceneId] || { found: [] };
    if (prev.found?.includes(obj.id)) return;
    const next = {
      ...progress,
      [sceneId]: { ...prev, found: [...(prev.found || []), obj.id] },
    };
    onProgressChange(next);
    setToast(`Found the ${obj.label.toLowerCase()}`);
  };

  return (
    <div style={{ minHeight: '100vh', color: P.ink, fontFamily: SANS, position: 'relative', overflow: 'hidden' }}>
      <CottageBackground />
      <SoundButton />
      <Header
        title={view === 'play' && activeScene ? activeScene.title : 'Hidden Object'}
        onBack={() => {
          if (view === 'hub') onBack();
          else { setActiveId(null); setView('hub'); }
        }}
      />

      {view === 'hub' && (
        <HubView scenes={HIDDEN_OBJECT_SCENES} progress={progress} onPick={startScene} />
      )}

      {view === 'play' && activeScene && (
        <PlayView
          scene={activeScene}
          progress={activeProgress}
          onObjectFound={(o) => onObjectFound(activeScene.id, o)}
          onComplete={() => {
            const cur = progress?.[activeScene.id] || { found: [] };
            if (cur.completedAt) return;
            onProgressChange({ ...progress, [activeScene.id]: { ...cur, completedAt: Date.now() } });
          }}
          onMiss={() => setToast('Keep looking…')}
        />
      )}

      {toast && (
        <div style={{
          position: 'fixed', bottom: 30, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(20,16,12,0.95)', color: P.goldL,
          padding: '10px 18px', borderRadius: 10,
          fontFamily: SERIF, fontStyle: 'italic', fontSize: '0.92rem',
          border: `1px solid ${P.border}`, zIndex: 1000, backdropFilter: 'blur(6px)',
        }}>{toast}</div>
      )}
    </div>
  );
}

// ── Header ────────────────────────────────────────────────────────────────
function Header({ title, onBack }) {
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 10,
      background: 'rgba(20,16,12,0.78)',
      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      padding: '0 18px', height: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      borderBottom: `1px solid ${P.border}`,
    }}>
      <button onClick={onBack} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: P.sub, fontSize: '0.82rem', fontFamily: SANS, padding: 0 }}>← Back</button>
      <span style={{ fontFamily: SERIF, fontStyle: 'italic', color: P.goldL, fontSize: '0.95rem', textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>{title}</span>
      <div style={{ minWidth: 60 }} />
    </header>
  );
}

// ── Hub view ──────────────────────────────────────────────────────────────
function HubView({ scenes, progress, onPick }) {
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '32px 22px 80px', position: 'relative', zIndex: 1 }}>
      <p style={{ textAlign: 'center', fontFamily: SERIF, fontStyle: 'italic', color: P.sub, fontSize: '0.95rem', lineHeight: 1.7, margin: '0 0 28px' }}>
        Be still and search. Find every hidden treasure in the scene to reveal the verse.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
        {scenes.map(scene => {
          const p = progress?.[scene.id];
          const total = scene.objects.length;
          const foundCount = p?.found?.length || 0;
          const completed = !!p?.completedAt;
          return (
            <button key={scene.id} onClick={() => onPick(scene.id)} style={{
              background: completed ? 'rgba(40,30,20,0.78)' : 'rgba(20,16,12,0.72)',
              backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
              border: `1px solid ${completed ? 'rgba(201,169,110,0.4)' : P.border}`,
              color: P.ink, padding: 0, borderRadius: 12, overflow: 'hidden',
              cursor: 'pointer', textAlign: 'left', fontFamily: SANS,
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)', transition: 'all 0.2s',
            }}>
              <div style={{ height: 110, overflow: 'hidden', borderBottom: `1px solid ${P.border}` }}>
                <img src={scene.src} alt={scene.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
              <div style={{ padding: '14px 16px 16px' }}>
                <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '1rem', color: P.goldL, marginBottom: 2 }}>{scene.title}</div>
                <div style={{ fontSize: '0.7rem', color: P.sub, marginBottom: 8, letterSpacing: '0.06em' }}>{scene.reference} · {total} objects</div>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.round((foundCount / total) * 100)}%`, height: '100%', background: completed ? P.gold : 'rgba(201,169,110,0.6)', transition: 'width 0.2s' }} />
                </div>
                <div style={{ marginTop: 6, fontSize: '0.7rem', color: completed ? P.gold : P.sub }}>
                  {completed ? 'Verse revealed' : `${foundCount} / ${total} found`}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </main>
  );
}

// ── Play view ─────────────────────────────────────────────────────────────
function PlayView({ scene, progress, onObjectFound, onComplete, onMiss }) {
  const imgRef = useRef(null);
  const foundSet = useMemo(() => new Set(progress?.found || []), [progress]);
  const remaining = useMemo(() => scene.objects.filter(o => !foundSet.has(o.id)), [scene.objects, foundSet]);
  const isComplete = remaining.length === 0;
  const [flash, setFlash] = useState(null); // {x,y} of last good tap, for a sparkle

  useEffect(() => {
    if (isComplete && !progress?.completedAt) onComplete();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete]);

  const handleTap = (e) => {
    if (isComplete) return;
    const el = imgRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pt = e.touches?.[0] || e.changedTouches?.[0] || e;
    const px = pt.clientX - rect.left;
    const py = pt.clientY - rect.top;
    const tapXpct = (px / rect.width) * 100;
    const tapYpct = (py / rect.height) * 100;
    // Calibration aid — see hiddenObjectScenes.js
    // eslint-disable-next-line no-console
    console.log(`[hidden-object] tap x:${tapXpct.toFixed(1)} y:${tapYpct.toFixed(1)}`);

    // Nearest unfound object whose hit-circle contains the tap (pixel space)
    let hit = null, best = Infinity;
    for (const o of remaining) {
      const dx = (tapXpct - o.x) / 100 * rect.width;
      const dy = (tapYpct - o.y) / 100 * rect.height;
      const rpx = (o.r / 100) * rect.width;
      const d2 = dx * dx + dy * dy;
      if (d2 <= rpx * rpx && d2 < best) { best = d2; hit = o; }
    }
    if (hit) {
      setFlash({ x: hit.x, y: hit.y, id: hit.id + Date.now() });
      onObjectFound(hit);
    } else {
      onMiss();
    }
  };

  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: '14px 14px 80px', position: 'relative', zIndex: 1 }}>
      {/* Scene */}
      <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', border: `1px solid ${P.border}`, boxShadow: '0 8px 30px rgba(0,0,0,0.5)', lineHeight: 0 }}>
        <img
          ref={imgRef}
          src={scene.src}
          alt={scene.title}
          onClick={handleTap}
          draggable={false}
          style={{ width: '100%', height: 'auto', display: 'block', cursor: 'crosshair', userSelect: 'none', WebkitUserSelect: 'none', WebkitTapHighlightColor: 'transparent' }}
        />
        {/* Found markers */}
        {scene.objects.filter(o => foundSet.has(o.id)).map(o => (
          <div key={o.id} style={{
            position: 'absolute', left: `${o.x}%`, top: `${o.y}%`,
            width: `${o.r * 2}%`, transform: 'translate(-50%,-50%)',
            aspectRatio: '1 / 1', borderRadius: '50%',
            border: '2px solid rgba(201,169,110,0.9)',
            boxShadow: '0 0 14px rgba(201,169,110,0.6), inset 0 0 14px rgba(201,169,110,0.25)',
            pointerEvents: 'none',
          }} />
        ))}
        {/* Sparkle on a fresh find */}
        {flash && (
          <div key={flash.id} style={{
            position: 'absolute', left: `${flash.x}%`, top: `${flash.y}%`,
            transform: 'translate(-50%,-50%)', pointerEvents: 'none',
            color: P.goldL, fontSize: '1.4rem', animation: 'hoSparkle 0.7s ease-out forwards',
          }}>✦</div>
        )}
      </div>

      {/* Verse reveal */}
      {isComplete && (
        <div style={{
          textAlign: 'center', margin: '16px auto 0', maxWidth: 560,
          padding: '14px 18px', background: 'rgba(40,30,20,0.78)',
          border: '1px solid rgba(201,169,110,0.5)', borderRadius: 12,
          boxShadow: '0 6px 22px rgba(0,0,0,0.4)',
        }}>
          <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '1.04rem', lineHeight: 1.6, margin: 0, color: P.ink }}>
            "{scene.verseText}"
          </p>
          <div style={{ fontFamily: SANS, fontSize: '0.72rem', color: P.sub, marginTop: 8, letterSpacing: '0.08em' }}>— {scene.reference}</div>
        </div>
      )}

      {/* Object list */}
      <div style={{ margin: '18px auto 0', maxWidth: 580 }}>
        <div style={{ fontSize: '0.66rem', fontFamily: SANS, fontWeight: 600, letterSpacing: '0.14em', color: P.sub, textTransform: 'uppercase', marginBottom: 10, textAlign: 'center' }}>
          {isComplete ? 'All objects found' : `${remaining.length} object${remaining.length === 1 ? '' : 's'} remaining`}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
          {scene.objects.map(o => {
            const f = foundSet.has(o.id);
            return (
              <span key={o.id} style={{
                padding: '4px 10px', borderRadius: 14,
                background: f ? 'rgba(201,169,110,0.18)' : 'rgba(255,255,255,0.04)',
                color: f ? P.goldL : P.ink, fontSize: '0.78rem', fontFamily: SANS, fontWeight: 600,
                textDecoration: f ? 'line-through' : 'none', textDecorationColor: 'rgba(201,169,110,0.6)',
                border: `1px solid ${f ? 'rgba(201,169,110,0.35)' : P.border}`,
                letterSpacing: '0.04em', transition: 'all 0.2s',
              }}>{o.label}</span>
            );
          })}
        </div>
      </div>

      <style>{`@keyframes hoSparkle{0%{opacity:0;transform:translate(-50%,-50%) scale(0.4)}40%{opacity:1;transform:translate(-50%,-50%) scale(1.3)}100%{opacity:0;transform:translate(-50%,-50%) scale(1.8)}}`}</style>
    </main>
  );
}
