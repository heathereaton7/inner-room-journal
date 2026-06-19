import { useEffect, useState } from 'react';
import { lookupStrongs } from '../systems/strongsData.js';

const SERIF = "'Cormorant Garamond', Georgia, serif";
const SANS = "'Inter', system-ui, -apple-system, sans-serif";

// Bible-reader palette (candlelit plum + gold) so the panel feels native here.
const P = {
  ink: '#E8E0F0',
  sub: 'rgba(200,190,230,0.55)',
  faint: 'rgba(200,190,230,0.32)',
  accent: '#D8C8F0',
  gold: '#D4A848',
  line: 'rgba(180,160,210,0.16)',
  lineH: 'rgba(216,200,240,0.40)',
  chip: 'rgba(180,160,210,0.10)',
};

/**
 * StrongsStudyPanel — a calm bottom-sheet word study.
 *
 * Props:
 *   word      { text: string, strongs: string[] }  the tapped English word
 *   reference string                                e.g. "Genesis 1:1"
 *   onClose()
 *
 * Looks the word's Strong's id(s) up in the local dictionary. If a word maps
 * to more than one number, all are offered as small selector chips. If a
 * lookup fails it simply shows a gentle message — never crashes.
 */
export default function StrongsStudyPanel({ word, reference, onClose }) {
  const [entries, setEntries] = useState(null); // resolved dictionary entries
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setActive(0);
    lookupStrongs(word?.strongs || []).then(res => {
      if (!cancelled) { setEntries(res); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [word]);

  // Close on Escape
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const entry = entries && entries[active];
  const cleanWord = (word?.text || '').replace(/^[("']+|[)"',.;:!?]+$/g, '');

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(8,6,14,0.62)', backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'linear-gradient(170deg,#16111F,#0B0814)',
          borderTop: `1px solid ${P.line}`,
          borderLeft: `1px solid ${P.line}`, borderRight: `1px solid ${P.line}`,
          borderRadius: '20px 20px 0 0',
          width: '100%', maxWidth: 680, maxHeight: '82vh',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 -18px 50px rgba(0,0,0,0.5)',
          animation: 'studySheetUp .3s cubic-bezier(.25,.8,.25,1) both',
        }}
      >
        <style>{`@keyframes studySheetUp{from{transform:translateY(100%);opacity:.6}to{transform:translateY(0);opacity:1}}`}</style>

        {/* Grip + header */}
        <div style={{ padding: '10px 20px 0', flexShrink: 0 }}>
          <div style={{ width: 38, height: 4, borderRadius: 2, background: P.line, margin: '0 auto 12px' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: SERIF, fontStyle: 'italic', color: P.accent, fontSize: '1.5rem', lineHeight: 1.15 }}>
                {cleanWord || word?.text}
              </div>
              {reference && (
                <div style={{ fontFamily: SANS, fontSize: '0.7rem', color: P.faint, marginTop: 3, letterSpacing: '0.04em' }}>
                  {reference}
                </div>
              )}
            </div>
            <button onClick={onClose} aria-label="Close" style={{
              background: 'transparent', border: 'none', color: P.sub,
              fontSize: '1.6rem', lineHeight: 1, cursor: 'pointer', padding: '0 4px', marginTop: -2,
            }}>×</button>
          </div>

          {/* Multiple Strong's numbers -> selector chips */}
          {entries && entries.length > 1 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
              {entries.map((en, i) => (
                <button key={en.id} onClick={() => setActive(i)} style={{
                  fontFamily: SANS, fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.06em',
                  padding: '5px 12px', borderRadius: 14, cursor: 'pointer',
                  background: i === active ? 'rgba(212,168,72,0.16)' : P.chip,
                  border: `1px solid ${i === active ? 'rgba(212,168,72,0.45)' : P.line}`,
                  color: i === active ? P.gold : P.sub, transition: 'all .15s',
                }}>{en.id}</button>
              ))}
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '18px 22px 28px' }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '34px 0', color: P.sub, fontFamily: SERIF, fontStyle: 'italic' }}>
              Opening the original language…
            </div>
          )}

          {!loading && (!entries || entries.length === 0) && (
            <div style={{ textAlign: 'center', padding: '28px 10px', color: P.sub, fontFamily: SERIF, fontStyle: 'italic', fontSize: '0.96rem', lineHeight: 1.6 }}>
              This word carries no Strong's entry — it's part of the natural English
              of the verse. Try another word.
            </div>
          )}

          {!loading && entry && (
            <>
              {/* Original word, large */}
              {entry.original && (
                <div style={{ textAlign: 'center', marginBottom: 6 }}>
                  <div style={{
                    fontFamily: SERIF, fontSize: '2.6rem', color: P.gold, lineHeight: 1.25,
                    direction: entry.language === 'hebrew' ? 'rtl' : 'ltr',
                  }}>
                    {entry.original}
                  </div>
                </div>
              )}

              {/* Transliteration + pronunciation */}
              {(entry.transliteration || entry.pronunciation) && (
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  {entry.transliteration && (
                    <span style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '1.1rem', color: P.ink }}>
                      {entry.transliteration}
                    </span>
                  )}
                  {entry.pronunciation && (
                    <span style={{ fontFamily: SANS, fontSize: '0.82rem', color: P.faint, marginLeft: 10 }}>
                      {entry.pronunciation}
                    </span>
                  )}
                </div>
              )}

              {/* Meta pills: Strong's number + part of speech */}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
                <span style={pill}>Strong's {entry.id}</span>
                <span style={pill}>{entry.language === 'greek' ? 'Greek' : 'Hebrew'}</span>
                {entry.partOfSpeech && <span style={pill}>{entry.partOfSpeech}</span>}
              </div>

              {/* Short definition */}
              {entry.definitionShort && (
                <Section label="Meaning">
                  <p style={defText}>{entry.definitionShort}</p>
                </Section>
              )}

              {/* Fuller definition: derivation + KJV usage */}
              {entry.derivation && (
                <Section label="Derivation">
                  <p style={defText}>{entry.derivation}</p>
                </Section>
              )}
              {entry.kjvUsage && (
                <Section label="Rendered in the KJV as">
                  <p style={{ ...defText, fontStyle: 'italic', color: P.accent }}>{entry.kjvUsage}</p>
                </Section>
              )}
            </>
          )}
        </div>

        {/* Attribution */}
        <div style={{ flexShrink: 0, padding: '10px 22px', borderTop: `1px solid ${P.line}` }}>
          <p style={{ fontFamily: SANS, fontSize: '0.62rem', color: P.faint, textAlign: 'center', lineHeight: 1.5, margin: 0 }}>
            Strong's dictionary © OpenScriptures (CC&nbsp;BY-SA). KJV word tagging from the
            MetaV database (public domain).
          </p>
        </div>
      </div>
    </div>
  );
}

const pill = {
  fontFamily: SANS, fontSize: '0.66rem', fontWeight: 600, letterSpacing: '0.05em',
  padding: '4px 11px', borderRadius: 12,
  background: P.chip, border: `1px solid ${P.line}`, color: P.sub,
};

const defText = {
  fontFamily: SERIF, fontSize: '1.04rem', lineHeight: 1.7, color: P.ink, margin: 0,
};

function Section({ label, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{
        fontFamily: SANS, fontSize: '0.64rem', fontWeight: 600, letterSpacing: '0.12em',
        textTransform: 'uppercase', color: P.faint, marginBottom: 6,
      }}>{label}</div>
      {children}
    </div>
  );
}
