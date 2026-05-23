/**
 * Word search puzzle library — one KJV verse per puzzle.
 *
 * The verse is parsed into a list of words (uppercased, punctuation stripped).
 * Every word in the verse is hidden in the grid. When the player finds them
 * all, the full verse reveals at the bottom of the screen.
 *
 * Grid size is chosen per-puzzle based on verse length. The grid is generated
 * at runtime by systems/wordSearchGen.js so we don't have to hand-place words.
 */

export const WORD_SEARCH_PUZZLES = [
  {
    id: 'ws_be_still',
    title: 'Be Still',
    reference: 'Psalm 46:10',
    verseText: 'Be still, and know that I am God.',
    gridSize: 11,
  },
  {
    id: 'ws_for_god_so_loved',
    title: 'For God So Loved',
    reference: 'John 3:16',
    verseText: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.',
    gridSize: 16,
  },
  {
    id: 'ws_lord_my_shepherd',
    title: 'The Lord Is My Shepherd',
    reference: 'Psalm 23:1',
    verseText: 'The Lord is my shepherd; I shall not want.',
    gridSize: 12,
  },
  {
    id: 'ws_through_christ',
    title: 'Through Christ',
    reference: 'Philippians 4:13',
    verseText: 'I can do all things through Christ which strengtheneth me.',
    gridSize: 13,
  },
  {
    id: 'ws_trust_lord',
    title: 'Trust in the Lord',
    reference: 'Proverbs 3:5',
    verseText: 'Trust in the Lord with all thine heart; and lean not unto thine own understanding.',
    gridSize: 14,
  },
  {
    id: 'ws_be_strong',
    title: 'Be Strong and Courageous',
    reference: 'Joshua 1:9',
    verseText: 'Be strong and of a good courage; be not afraid, neither be thou dismayed.',
    gridSize: 13,
  },
  {
    id: 'ws_way_truth_life',
    title: 'The Way',
    reference: 'John 14:6',
    verseText: 'I am the way, the truth, and the life.',
    gridSize: 11,
  },
  {
    id: 'ws_fear_thou_not',
    title: 'Fear Thou Not',
    reference: 'Isaiah 41:10',
    verseText: 'Fear thou not; for I am with thee: be not dismayed; for I am thy God.',
    gridSize: 13,
  },
  {
    id: 'ws_god_is_love',
    title: 'God Is Love',
    reference: '1 John 4:8',
    verseText: 'He that loveth not knoweth not God; for God is love.',
    gridSize: 12,
  },
  {
    id: 'ws_lilies_field',
    title: 'Consider the Lilies',
    reference: 'Matthew 6:28',
    verseText: 'Consider the lilies of the field, how they grow; they toil not, neither do they spin.',
    gridSize: 13,
  },
  {
    id: 'ws_lift_eyes',
    title: 'I Will Lift Mine Eyes',
    reference: 'Psalm 121:1',
    verseText: 'I will lift up mine eyes unto the hills, from whence cometh my help.',
    gridSize: 13,
  },
  {
    id: 'ws_clean_heart',
    title: 'Create in Me a Clean Heart',
    reference: 'Psalm 51:10',
    verseText: 'Create in me a clean heart, O God; and renew a right spirit within me.',
    gridSize: 13,
  },
];

export function getPuzzle(id) {
  return WORD_SEARCH_PUZZLES.find(p => p.id === id);
}

/**
 * Extract the searchable words from a verse text:
 *   - Strip punctuation
 *   - Uppercase
 *   - Skip very short words (1 letter) since they're trivial to find
 *     and would clutter the grid (but we still display them in the verse reveal)
 *   - Deduplicate so the same word doesn't have to be hidden twice
 */
export function extractWords(verseText) {
  const raw = verseText.toUpperCase().replace(/[^A-Z\s]/g, ' ').split(/\s+/).filter(Boolean);
  const seen = new Set();
  const out = [];
  for (const w of raw) {
    if (w.length < 2) continue;
    if (seen.has(w)) continue;
    seen.add(w);
    out.push(w);
  }
  return out;
}

/**
 * Original word sequence (with duplicates) for displaying the verse reveal.
 */
export function verseWords(verseText) {
  return verseText.toUpperCase().replace(/[^A-Z\s]/g, ' ').split(/\s+/).filter(Boolean);
}
