/**
 * Bible translation helpers — looks up the original Hebrew / Greek words
 * behind each KJV verse, using the bolls.life public API + Brown-Driver-Briggs
 * / Thayer's lexicon.
 *
 * Two endpoints are used:
 *   1. https://bolls.life/get-chapter/KJV/{bookId}/{chapter}/
 *      → array of verses, each with embedded `<S>nnnn</S>` Strong's tags
 *   2. https://bolls.life/dictionary-definition/BDBT/{H|G}{nnnn}/
 *      → array with original lexeme, transliteration, pronunciation,
 *        and BDB / Thayer's definition for the Strong's number
 *
 * Both API responses are cached in-memory and in localStorage so the user
 * gets instant lookups for chapters and words they've already seen.
 *
 * Book indexing:
 *   - This app's kjv.json is 0-indexed (Genesis = 0)
 *   - bolls.life is 1-indexed (Genesis = 1)
 *   - OT covers books 1-39 (Hebrew, prefix H); NT covers 40-66 (Greek, G)
 */

const CHAPTER_CACHE_KEY = 'irj-strong-chapter-cache';
const LEXEME_CACHE_KEY = 'irj-strong-lex-cache';

// In-memory caches
const chapterCache = new Map(); // `${book}:${chapter}` → parsed verses
const lexemeCache = new Map();  // `H7225` → lexicon entry

// Load persisted caches on first use
let loadedFromDisk = false;
function loadCachesFromDisk() {
  if (loadedFromDisk) return;
  loadedFromDisk = true;
  try {
    const cc = JSON.parse(localStorage.getItem(CHAPTER_CACHE_KEY) || '{}');
    for (const k in cc) chapterCache.set(k, cc[k]);
  } catch {}
  try {
    const lc = JSON.parse(localStorage.getItem(LEXEME_CACHE_KEY) || '{}');
    for (const k in lc) lexemeCache.set(k, lc[k]);
  } catch {}
}

function saveChapterCache() {
  try {
    const obj = {};
    for (const [k, v] of chapterCache) obj[k] = v;
    localStorage.setItem(CHAPTER_CACHE_KEY, JSON.stringify(obj));
  } catch {}
}

function saveLexemeCache() {
  try {
    const obj = {};
    for (const [k, v] of lexemeCache) obj[k] = v;
    localStorage.setItem(LEXEME_CACHE_KEY, JSON.stringify(obj));
  } catch {}
}

/**
 * Determine the Strong's prefix (H for OT Hebrew, G for NT Greek) given
 * the 0-indexed app book index.
 */
function strongsPrefix(bookIdx0) {
  return bookIdx0 < 39 ? 'H' : 'G';
}

/**
 * Parse a Strong's-tagged verse text into a list of word segments.
 * Each segment is: { text, strong }
 * where `strong` is the full Strong's id (e.g. "H7225") or null.
 *
 *   "In the beginning<S>7225</S> God<S>430</S> ..."
 *
 * becomes:
 *   [
 *     { text: "In the beginning", strong: "H7225" },
 *     { text: " God", strong: "H430" },
 *     ...
 *   ]
 */
export function parseStrongs(text, prefix = 'H') {
  if (!text) return [];
  const segments = [];
  const re = /<S>(\d+)<\/S>/g;
  let lastIndex = 0;
  let match;
  let pending = '';
  while ((match = re.exec(text)) !== null) {
    pending += text.slice(lastIndex, match.index);
    const num = match[1];
    if (pending.trim()) {
      segments.push({ text: pending, strong: prefix + num });
    } else {
      // Standalone tag (e.g. untranslated particles) — keep prefix only
      segments.push({ text: pending, strong: prefix + num });
    }
    pending = '';
    lastIndex = re.lastIndex;
  }
  // Trailing text without a Strong's tag
  const trail = text.slice(lastIndex);
  if (trail) segments.push({ text: trail, strong: null });
  return segments;
}

/**
 * Strip Strong's tags from a verse to get plain reading text.
 */
export function stripStrongs(text) {
  return (text || '').replace(/<S>\d+<\/S>/g, '');
}

/**
 * Fetch a chapter's Strong's-tagged KJV from bolls.life.
 *
 *   bookIdx0  — 0-indexed (Genesis = 0)
 *   chapter   — 0-indexed (chapter 1 = 0)
 *
 * Returns:
 *   {
 *     prefix: 'H' | 'G',
 *     verses: [
 *       { number: 1, rawText, plainText, segments: [{text, strong}] },
 *       ...
 *     ]
 *   }
 *
 * Throws if the network is unreachable.
 */
export async function fetchChapterStrongs(bookIdx0, chapter) {
  loadCachesFromDisk();
  const key = `${bookIdx0}:${chapter}`;
  if (chapterCache.has(key)) return chapterCache.get(key);

  const bookId1 = bookIdx0 + 1;
  const chapter1 = chapter + 1;
  const url = `https://bolls.life/get-chapter/KJV/${bookId1}/${chapter1}/`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Chapter fetch failed: ${resp.status}`);
  const data = await resp.json();

  const prefix = strongsPrefix(bookIdx0);
  const verses = (Array.isArray(data) ? data : []).map(v => ({
    number: v.verse,
    rawText: v.text,
    plainText: stripStrongs(v.text),
    segments: parseStrongs(v.text, prefix),
  }));

  const result = { prefix, verses };
  chapterCache.set(key, result);
  saveChapterCache();
  return result;
}

/**
 * Look up a Strong's number in the BDB / Thayer's lexicon.
 *
 *   strongId — full id like "H7225" or "G2316"
 *
 * Returns:
 *   {
 *     id, lexeme, transliteration, pronunciation, definitionHtml, definitionPlain
 *   } or null on failure.
 */
export async function lookupStrong(strongId) {
  loadCachesFromDisk();
  if (!strongId) return null;
  if (lexemeCache.has(strongId)) return lexemeCache.get(strongId);

  try {
    const url = `https://bolls.life/dictionary-definition/BDBT/${strongId}/`;
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const data = await resp.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    const entry = data[0];
    const definitionHtml = entry.definition || '';
    const definitionPlain = htmlToPlain(definitionHtml);
    const result = {
      id: strongId,
      lexeme: entry.lexeme || '',
      transliteration: entry.transliteration || '',
      pronunciation: entry.pronunciation || '',
      definitionHtml,
      definitionPlain,
    };
    lexemeCache.set(strongId, result);
    saveLexemeCache();
    return result;
  } catch (e) {
    return null;
  }
}

/**
 * Strip HTML to plain text (for the definition snippet shown above the
 * full HTML render).
 */
function htmlToPlain(html) {
  return (html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Convenience: parse a single verse string (from kjv.json) and the Strong's
 * data returned by fetchChapterStrongs, returning the segments for that
 * verse number.
 */
export function segmentsForVerse(chapterData, verseNumber1based) {
  if (!chapterData) return null;
  const v = chapterData.verses.find(x => x.number === verseNumber1based);
  return v ? v.segments : null;
}
