/**
 * KJV book order + reference parsing helpers.
 *
 * BIBLE_BOOKS is the canonical 66-book order matching public/kjv.json's `name`
 * fields, so the index returned here lines up with the Bible reader's bibleBook.
 *
 * parseReference('1 Samuel 1:10') -> { bookIdx: 8, chapIdx: 0, verseIdx: 9 }
 * (chapIdx / verseIdx are zero-based to match the reader's state.)
 */
export const BIBLE_BOOKS = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
  'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
  '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra',
  'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs',
  'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah', 'Lamentations',
  'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
  'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk',
  'Zephaniah', 'Haggai', 'Zechariah', 'Malachi', 'Matthew',
  'Mark', 'Luke', 'John', 'Acts', 'Romans',
  '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians', 'Philippians',
  'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy',
  'Titus', 'Philemon', 'Hebrews', 'James', '1 Peter',
  '2 Peter', '1 John', '2 John', '3 John', 'Jude', 'Revelation',
];

// Common shorthand / spelling variations -> canonical name.
const ALIASES = {
  'psalm': 'Psalms',
  'psalms': 'Psalms',
  'song of songs': 'Song of Solomon',
  'song of solomon': 'Song of Solomon',
  'canticles': 'Song of Solomon',
  'revelations': 'Revelation',
  'revelation': 'Revelation',
};

const NAME_INDEX = (() => {
  const map = {};
  BIBLE_BOOKS.forEach((name, i) => { map[name.toLowerCase()] = i; });
  return map;
})();

export function findBookIndex(name) {
  if (!name) return -1;
  const key = name.trim().toLowerCase();
  if (ALIASES[key] != null) return NAME_INDEX[ALIASES[key].toLowerCase()];
  if (NAME_INDEX[key] != null) return NAME_INDEX[key];
  return -1;
}

/**
 * Parse a reference like "1 Samuel 1:10", "Psalm 27:14", "Genesis 18:14".
 * Returns { bookIdx, chapIdx, verseIdx } (zero-based chap/verse) or null.
 * Ignores trailing "(KJV)" and verse ranges (uses the first verse).
 */
export function parseReference(reference) {
  if (!reference || typeof reference !== 'string') return null;
  // Strip parenthetical notes, e.g. "(KJV)"
  const clean = reference.replace(/\([^)]*\)/g, '').trim();
  // Match: <book name> <chapter>:<verse>   (book may begin with a leading digit)
  const m = clean.match(/^([0-9]?\s?[A-Za-z][A-Za-z\s]+?)\s+(\d+):(\d+)/);
  if (!m) return null;
  const bookIdx = findBookIndex(m[1]);
  if (bookIdx < 0) return null;
  const chapIdx = parseInt(m[2], 10) - 1;
  const verseIdx = parseInt(m[3], 10) - 1;
  if (chapIdx < 0 || verseIdx < 0) return null;
  return { bookIdx, chapIdx, verseIdx };
}
