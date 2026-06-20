import { useState } from 'react';
import { COLORING_PAGES, getColoringPage } from '../data/coloringPages.js';
import ColoringCanvas from '../components/ColoringCanvas.jsx';
import CottageBackground from '../components/CottageBackground.jsx';
import SoundButton from '../components/SoundButton.jsx';

const SERIF = "'Cormorant Garamond', Georgia, serif";
const SANS = "'Inter', system-ui, -apple-system, sans-serif";

const P = {
  ink: '#FAF6F0',
  sub: 'rgba(232,212,160,0.55)',
  border: 'rgba(201,169,110,0.18)',
  borderH: 'rgba(201,169,110,0.55)',
  gold: '#C9A96E',
  goldL: '#E8D4A0',
  panel: 'rgba(255,255,255,0.04)',
};

/**
 * ColoringScreen — tap-to-color "paint bucket" coloring book.
 *
 * Views:
 *   'hub'   — list of available coloring pages
 *   'page'  — active ColoringCanvas for a chosen page
 *
 * Props:
 *   onBack
 *   coloring      — persisted map { [pageId]: { imageData, updatedAt } }
 *   setColoring   — setter that persists (localStorage + Firestore)
 */
export default function ColoringScreen({ onBack, coloring, setColoring }) {
  const [activeId, setActiveId] = useState(null);
  const [color, setColor] = useState('#ff4d9d');

  const page = activeId ? getColoringPage(activeId) : null;
  const saved = activeId ? coloring?.[activeId]?.imageData || null : null;
  const pages = COLORING_PAGES;

  const persistPage = (pageId, dataUrl) => {
    setColoring({ ...(coloring || {}), [pageId]: { imageData: dataUrl, updatedAt: Date.now() } });
  };

  return (
    <div style={{ minHeight: '100vh', color: P.ink, fontFamily: SANS, position: 'relative', overflow: 'hidden' }}>
      <CottageBackground />
      <SoundButton />
      <Header
        title={page ? page.title : 'Coloring'}
        onBack={() => {
          if (page) setActiveId(null);
          else onBack();
        }}
      />

      {/* Choose a page */}
      {!page && (
        <main style={{ maxWidth: 620, margin: '0 auto', padding: '18px 16px 110px', position: 'relative' }}>
          <p style={{
            fontFamily: SERIF, fontStyle: 'italic', color: P.goldL,
            fontSize: '1.1rem', textAlign: 'center', lineHeight: 1.5, margin: '4px 0 6px',
          }}>
            Choose a page to color
          </p>
          <p style={{
            fontFamily: SANS, fontSize: '0.74rem', color: P.sub,
            textAlign: 'center', letterSpacing: '0.05em', margin: '0 0 20px',
          }}>
            Tap an area to fill it with glitter color
          </p>
          {pages.length === 0 && (
            <p style={{ fontFamily: SERIF, fontStyle: 'italic', color: P.sub, textAlign: 'center', fontSize: '0.98rem', marginTop: 40 }}>
              New pages are coming soon.
            </p>
          )}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: 14, maxWidth: 560, margin: '0 auto',
          }}>
            {pages.map(pg => {
              const done = !!coloring?.[pg.id]?.imageData;
              return (
                <button
                  key={pg.id}
                  onClick={() => setActiveId(pg.id)}
                  style={{
                    background: P.panel, border: `1px solid ${P.border}`,
                    borderRadius: 14, padding: 0, cursor: 'pointer', overflow: 'hidden',
                    textAlign: 'left', color: P.ink, position: 'relative',
                  }}
                >
                  <div style={{
                    aspectRatio: '1 / 1', background: '#fff',
                    backgroundImage: `url("${coloring?.[pg.id]?.imageData || pg.src}")`,
                    backgroundSize: 'cover', backgroundPosition: 'center',
                  }} />
                  {done && (
                    <span style={{
                      position: 'absolute', top: 8, right: 8,
                      background: 'rgba(20,16,12,0.85)', color: P.goldL,
                      fontFamily: SANS, fontSize: '0.6rem', letterSpacing: '0.1em',
                      textTransform: 'uppercase', padding: '3px 8px', borderRadius: 10,
                      border: `1px solid ${P.border}`,
                    }}>In progress</span>
                  )}
                  <div style={{ padding: '10px 12px 12px' }}>
                    <div style={{ fontFamily: SERIF, fontStyle: 'italic', color: P.goldL, fontSize: '1.02rem', lineHeight: 1.2 }}>
                      {pg.title}
                    </div>
                    {pg.reference && (
                      <div style={{ fontFamily: SANS, fontSize: '0.66rem', color: P.sub, marginTop: 4, letterSpacing: '0.04em' }}>
                        {pg.reference}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </main>
      )}

      {page && (
        <main style={{ maxWidth: 620, margin: '0 auto', padding: '16px 14px 110px', position: 'relative' }}>
          {page.verse && (
            <div style={{ textAlign: 'center', margin: '0 auto 16px', maxWidth: 520 }}>
              <p style={{ fontFamily: SERIF, fontStyle: 'italic', color: P.goldL, fontSize: '1.06rem', lineHeight: 1.5, margin: 0 }}>
                “{page.verse}”
              </p>
              {page.reference && (
                <p style={{ fontFamily: SANS, fontSize: '0.68rem', color: P.sub, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '6px 0 0' }}>
                  {page.reference}
                </p>
              )}
            </div>
          )}
          <ColoringCanvas
            page={page}
            savedImage={saved}
            color={color}
            onColorChange={setColor}
            onPersist={(dataUrl) => persistPage(page.id, dataUrl)}
          />
        </main>
      )}
    </div>
  );
}

function Header({ title, onBack }) {
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 10,
      background: 'rgba(20,16,12,0.85)', backdropFilter: 'blur(8px)',
      padding: '0 18px', height: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      borderBottom: `1px solid ${P.border}`,
    }}>
      <button onClick={onBack} style={{
        background: 'transparent', border: 'none', cursor: 'pointer',
        color: P.sub, fontSize: '0.82rem', fontFamily: SANS, padding: 0,
      }}>← Back</button>
      <span style={{ fontFamily: SERIF, fontStyle: 'italic', color: P.goldL, fontSize: '0.95rem' }}>{title}</span>
      <div style={{ minWidth: 60 }} />
    </header>
  );
}
