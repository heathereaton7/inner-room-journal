/**
 * Local original-language data loader.
 *
 * All data is bundled in /public/strongs (built one-time by
 * scripts/strongs-prep/build.cjs from OpenScriptures + MetaV):
 *
 *   /strongs/hebrew.json      Strong's Hebrew/Aramaic dictionary (H####)
 *   /strongs/greek.json       Strong's Greek dictionary (G####)
 *   /strongs/kjv/<book>.json  per-book KJV word tokens with Strong's tags
 *
 * Everything is fetched lazily (a book's tokens only when that book is opened,
 * a language dictionary only when its first word is tapped) and cached in
 * memory for the rest of the session. No network/database — works offline.
 *
 * Token shape (from build.cjs):
 *   [word, punc, italic, [strongsIds]]
 *   - word    English word (curly apostrophes, leading "(" folded in)
 *   - punc    trailing punctuation incl. folded ")"   (may be missing)
 *   - italic  1 = KJV "added" word (no Strong's)       (may be missing)
 *   - strongs array of Strong's ids, e.g. ["H1254","H853"] (may be missing)
 */

const bookCache = new Map();   // bookId1 -> { "<chap>": { "<verse>": [tokens] } }
const bookPromises = new Map(); // bookId1 -> in-flight fetch promise
const dictCache = new Map();    // 'H' | 'G' -> { id: entry }
const dictPromises = new Map(); // 'H' | 'G' -> in-flight fetch promise

/** Load a book's tagged tokens (book is 0-indexed, Genesis = 0). */
export async function loadBookTokens(bookIdx0) {
  const id1 = bookIdx0 + 1;
  if (bookCache.has(id1)) return bookCache.get(id1);
  if (bookPromises.has(id1)) return bookPromises.get(id1);
  const p = fetch(`/strongs/kjv/${id1}.json`)
    .then(r => { if (!r.ok) throw new Error('book ' + id1 + ' ' + r.status); return r.json(); })
    .then(data => { bookCache.set(id1, data); bookPromises.delete(id1); return data; })
    .catch(err => { bookPromises.delete(id1); throw err; });
  bookPromises.set(id1, p);
  return p;
}

/** Synchronous accessor — returns the cached book or null if not yet loaded. */
export function getCachedBook(bookIdx0) {
  return bookCache.get(bookIdx0 + 1) || null;
}

/**
 * Tokens for a single verse, or null if the book isn't loaded yet / no data.
 * chapter0 and verseIdx0 are 0-indexed (to match the reader's state).
 */
export function getVerseTokens(bookIdx0, chapter0, verseIdx0) {
  const book = bookCache.get(bookIdx0 + 1);
  if (!book) return null;
  const ch = book[chapter0 + 1];
  if (!ch) return null;
  return ch[verseIdx0 + 1] || null;
}

/** Load a language dictionary by Strong's prefix ('H' or 'G'). */
async function loadDict(prefix) {
  if (dictCache.has(prefix)) return dictCache.get(prefix);
  if (dictPromises.has(prefix)) return dictPromises.get(prefix);
  const file = prefix === 'G' ? 'greek.json' : 'hebrew.json';
  const p = fetch(`/strongs/${file}`)
    .then(r => { if (!r.ok) throw new Error(file + ' ' + r.status); return r.json(); })
    .then(data => { dictCache.set(prefix, data); dictPromises.delete(prefix); return data; })
    .catch(err => { dictPromises.delete(prefix); throw err; });
  dictPromises.set(prefix, p);
  return p;
}

const LANGS = { H: 'hebrew', G: 'greek' };

/**
 * Look up one Strong's id (e.g. "H7225") in the local dictionary.
 * Returns a normalized entry or null (never throws):
 *   { id, language, original, transliteration, pronunciation,
 *     definitionShort, definitionFull, partOfSpeech }
 */
export async function lookupStrong(strongId) {
  if (!strongId) return null;
  try {
    const prefix = strongId[0] === 'G' ? 'G' : 'H';
    const dict = await loadDict(prefix);
    const e = dict[strongId];
    if (!e) return null;
    // Aramaic entries live in the Hebrew dictionary; OpenScriptures doesn't
    // flag them separately, so report Hebrew/Greek by prefix.
    return {
      id: strongId,
      language: LANGS[prefix],
      original: e.w || '',
      transliteration: e.x || '',
      pronunciation: e.p || '',
      definitionShort: e.s || '',
      derivation: e.d || '',
      kjvUsage: e.k || '',
      partOfSpeech: e.pos || '',
    };
  } catch {
    return null;
  }
}

/** Look up several Strong's ids at once (preserves order, drops misses). */
export async function lookupStrongs(ids) {
  if (!ids || !ids.length) return [];
  const results = await Promise.all(ids.map(lookupStrong));
  return results.filter(Boolean);
}
