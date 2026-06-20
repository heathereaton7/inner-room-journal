/**
 * VerseWords — renders a single KJV verse word-by-word.
 *
 * Words that carry a Strong's number get a faint dotted underline and are
 * tappable (open the study panel); everything else — connective words,
 * punctuation, and KJV "added" italic words — renders as plain, calm text.
 *
 * If no tokens are available yet (book still loading / offline), it falls back
 * to the plain verse string so reading is never interrupted.
 *
 * Props:
 *   tokens   array of [word, punc?, italic?, strongs?]  or null
 *   plain    plain verse string fallback
 *   onWordTap({ text, strongs })   called when a tagged word is tapped
 *   enabled  when false, words render as plain text (study taps off) so the
 *            whole verse can be tapped to highlight without accidental opens
 */
export default function VerseWords({ tokens, plain, onWordTap, enabled = true }) {
  if (!tokens || !tokens.length) return plain;

  return tokens.map((t, i) => {
    const word = t[0] || '';
    const punc = t[1] || '';
    const italic = t[2] === 1;
    const strongs = t[3];
    const tappable = enabled && Array.isArray(strongs) && strongs.length > 0;

    const wordSpan = tappable ? (
      <span
        key={'w' + i}
        onClick={(e) => { e.stopPropagation(); onWordTap({ text: word, strongs }); }}
        className="strongs-word"
        style={{
          cursor: 'pointer',
          color: '#F0DBA0',
          borderBottom: '1px solid rgba(212,168,72,0.55)',
          padding: '0 1px',
          borderRadius: 2,
          WebkitTapHighlightColor: 'transparent',
        }}
      >{word}</span>
    ) : (
      <span key={'w' + i} style={italic ? { fontStyle: 'italic', opacity: 0.82 } : undefined}>{word}</span>
    );

    return (
      <span key={'t' + i}>
        {wordSpan}{punc}{i < tokens.length - 1 ? ' ' : ''}
      </span>
    );
  });
}
