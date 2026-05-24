import { useEffect, useState } from 'react';
import { fetchChapterStrongs, lookupStrong, segmentsForVerse } from '../systems/bibleTranslation.js';

const SERIF = "'Cormorant Garamond', Georgia, serif";
const SANS = "'Inter', system-ui, -apple-system, sans-serif";

const P = {
  bg: '#0E0B14',
  panel: 'rgba(180,160,210,0.06)',
  border: 'rgba(180,160,210,0.18)',
  borderH: 'rgba(180,160,210,0.45)',
  ink: '#E8E0F0',
  sub: 'rgba(200,190,230,0.55)',
  accent: '#D8C8F0',
  gold: '#D4A848',
};

/**
 * VerseTranslationModal — shows a verse with each word's original Hebrew /
 * Greek root, transliteration, pronunciation, and BDB / Thayer's definition.
 *
 * Props:
 *   bookIdx0  — 0-indexed app book index
 *   chapter0  — 0-indexed chapter
 *   verseIdx0 — 0-indexed verse within the chapter
 *   bookName  — display name (e.g. "Genesis")
 *   onClose()
 */
export default function VerseTranslationModal({ bookIdx0, chapter0, verseIdx0, bookName, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [segments, setSegments] = useState(null);
  const [activeSegment, setActiveSegment] = useState(null);
  const [activeLex, setActiveLex] = useState(null);
  const [lexLoading, setLexLoading] = useState(false);

  // Fetch chapter once on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchChapterStrongs(bookIdx0, chapter0);
        if (cancelled) return;
        const verseSegs = segmentsForVerse(data, verseIdx0 + 1);
        setSegments(verseSegs || []);
      } catch (e) {
        if (!cancelled) setError('Could not load the original-language data. Check your connection and try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [bookIdx0, chapter0, verseIdx0]);

  const onSegmentTap = async (seg) => {
    if (!seg.strong) return;
    setActiveSegment(seg);
    setActiveLex(null);
    setLexLoading(true);
    const lex = await lookupStrong(seg.strong);
    setActiveLex(lex);
    setLexLoading(false);
  };

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.78)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 18, overflowY: 'auto',
      }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{
        background: 'linear-gradient(160deg,#15101F,#0A0814)',
        border: `1px solid ${P.border}`,
        borderRadius: 18,
        maxWidth: 680, width: '100%',
        maxHeight: '92vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 20px', borderBottom: `1px solid ${P.border}` }}>
          <div>
            <div style={{ fontFamily: SERIF, fontStyle: 'italic', color: P.accent, fontSize: '1.05rem' }}>
              Original languages
            </div>
            <div style={{ fontFamily: SANS, fontSize: '0.74rem', color: P.sub, marginTop: 2 }}>
              {bookName} {chapter0 + 1}:{verseIdx0 + 1}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none', color: P.sub,
            fontSize: '1.5rem', lineHeight: 1, cursor: 'pointer', padding: '4px 8px',
          }}>×</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px 24px' }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: P.sub, fontFamily: SERIF, fontStyle: 'italic' }}>
              Loading original-language data...
            </div>
          )}
          {error && (
            <div style={{ background: 'rgba(180,40,40,0.12)', border: '1px solid rgba(220,80,80,0.3)',
              color: '#F8C8C8', padding: '12px 16px', borderRadius: 10, fontSize: '0.84rem', fontFamily: SANS }}>
              {error}
            </div>
          )}

          {!loading && !error && segments && (
            <>
              <p style={{ fontFamily: SANS, fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: P.sub, marginBottom: 10 }}>
                Tap any word to see its original-language root
              </p>
              <div style={{ fontFamily: SERIF, fontSize: '1.08rem', lineHeight: 1.85, color: P.ink, marginBottom: 22 }}>
                {segments.map((seg, i) => {
                  const isActive = activeSegment === seg;
                  const tappable = !!seg.strong;
                  return (
                    <span
                      key={i}
                      onClick={() => onSegmentTap(seg)}
                      style={{
                        background: isActive ? 'rgba(216,200,240,0.16)' : tappable ? 'transparent' : 'transparent',
                        borderBottom: tappable ? '1px dashed rgba(216,200,240,0.32)' : 'none',
                        borderRadius: 4,
                        padding: '0 2px',
                        cursor: tappable ? 'pointer' : 'default',
                        transition: 'all 0.15s',
                        color: isActive ? P.accent : 'inherit',
                      }}
                    >
                      {seg.text}
                    </span>
                  );
                })}
              </div>

              {/* Active word panel */}
              {activeSegment && (
                <div style={{
                  background: P.panel,
                  border: `1px solid ${P.borderH}`,
                  borderRadius: 12,
                  padding: '16px 18px',
                  marginTop: 8,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, gap: 14 }}>
                    <div>
                      <div style={{ fontFamily: SERIF, fontStyle: 'italic', color: P.accent, fontSize: '0.96rem', marginBottom: 2 }}>
                        "{activeSegment.text.trim()}"
                      </div>
                      <div style={{ fontFamily: SANS, fontSize: '0.7rem', color: P.sub, letterSpacing: '0.08em' }}>
                        Strong's {activeSegment.strong}
                      </div>
                    </div>
                  </div>

                  {lexLoading && (
                    <div style={{ color: P.sub, fontFamily: SERIF, fontStyle: 'italic', fontSize: '0.88rem' }}>
                      Looking up...
                    </div>
                  )}

                  {!lexLoading && activeLex && (
                    <>
                      {activeLex.lexeme && (
                        <div style={{ marginBottom: 8 }}>
                          <div style={{ fontFamily: SANS, fontSize: '0.66rem', color: P.sub, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>Original</div>
                          <div style={{ fontFamily: SERIF, fontSize: '1.5rem', color: P.gold, lineHeight: 1.3 }}>
                            {activeLex.lexeme}
                          </div>
                        </div>
                      )}
                      {(activeLex.transliteration || activeLex.pronunciation) && (
                        <div style={{ marginBottom: 10 }}>
                          {activeLex.transliteration && (
                            <span style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '0.94rem', color: P.ink }}>
                              {activeLex.transliteration}
                            </span>
                          )}
                          {activeLex.pronunciation && (
                            <span style={{ fontFamily: SANS, fontSize: '0.82rem', color: P.sub, marginLeft: 10 }}>
                              ({activeLex.pronunciation})
                            </span>
                          )}
                        </div>
                      )}
                      <div style={{ fontFamily: SERIF, fontSize: '0.92rem', color: P.ink, lineHeight: 1.65 }}
                        dangerouslySetInnerHTML={{ __html: activeLex.definitionHtml }}
                      />
                    </>
                  )}

                  {!lexLoading && !activeLex && activeSegment.strong && (
                    <div style={{ color: P.sub, fontFamily: SERIF, fontStyle: 'italic', fontSize: '0.88rem' }}>
                      No lexicon entry available for this word.
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
