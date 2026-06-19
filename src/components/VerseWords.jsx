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
 */
export default function VerseWords({ tokens, plain, onWordTap }) {
  if (!tokens || !tokens.length) return plain;

  return tokens.map((t, i) => {
    const word = t[0] || '';
    const punc = t[1] || '';
    const italic = t[2] === 1;
    const strongs = t[3];
    const tappable = Array.isArray(strongs) && strongs.length > 0;

    const wordSpan = tappable ? (
      <span
        key={'w' + i}
        onClick={(e) => { e.stopPropagation(); onWordTap({ text: word, strongs }); }}
        className="strongs-word"
        style={{
          cursor: 'pointer',
          borderBottom: '1px dotted rgba(212,168,72,0.30)',
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
