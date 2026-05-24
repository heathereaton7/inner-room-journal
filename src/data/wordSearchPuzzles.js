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
  {
    id: 'ws_cast_thy_burden',
    title: 'Cast Thy Burden',
    reference: 'Psalm 55:22',
    verseText: 'Cast thy burden upon the Lord, and he shall sustain thee: he shall never suffer the righteous to be moved.',
    gridSize: 15,
  },
  {
    id: 'ws_delight_in_lord',
    title: 'Delight Thyself in the Lord',
    reference: 'Psalm 37:4',
    verseText: 'Delight thyself also in the Lord; and he shall give thee the desires of thine heart.',
    gridSize: 14,
  },
  {
    id: 'ws_wait_on_lord',
    title: 'They That Wait Upon the Lord',
    reference: 'Isaiah 40:31',
    verseText: 'But they that wait upon the Lord shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.',
    gridSize: 17,
  },
  {
    id: 'ws_seek_ye_first',
    title: 'Seek Ye First',
    reference: 'Matthew 6:33',
    verseText: 'But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you.',
    gridSize: 15,
  },
  {
    id: 'ws_all_things_work',
    title: 'All Things Work Together',
    reference: 'Romans 8:28',
    verseText: 'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.',
    gridSize: 16,
  },
  {
    id: 'ws_god_hath_not_given',
    title: 'A Sound Mind',
    reference: '2 Timothy 1:7',
    verseText: 'For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind.',
    gridSize: 15,
  },
  {
    id: 'ws_let_not_heart_troubled',
    title: 'Let Not Your Heart Be Troubled',
    reference: 'John 14:1',
    verseText: 'Let not your heart be troubled: ye believe in God, believe also in me.',
    gridSize: 13,
  },
  {
    id: 'ws_come_unto_me',
    title: 'Come Unto Me',
    reference: 'Matthew 11:28',
    verseText: 'Come unto me, all ye that labour and are heavy laden, and I will give you rest.',
    gridSize: 13,
  },
  {
    id: 'ws_peace_i_leave',
    title: 'Peace I Leave With You',
    reference: 'John 14:27',
    verseText: 'Peace I leave with you, my peace I give unto you: not as the world giveth, give I unto you. Let not your heart be troubled, neither let it be afraid.',
    gridSize: 17,
  },
  {
    id: 'ws_weeping_endure',
    title: 'Joy Cometh in the Morning',
    reference: 'Psalm 30:5',
    verseText: 'Weeping may endure for a night, but joy cometh in the morning.',
    gridSize: 12,
  },
  {
    id: 'ws_he_careth_for_you',
    title: 'He Careth for You',
    reference: '1 Peter 5:7',
    verseText: 'Casting all your care upon him; for he careth for you.',
    gridSize: 12,
  },
  {
    id: 'ws_new_creature',
    title: 'A New Creature',
    reference: '2 Corinthians 5:17',
    verseText: 'Therefore if any man be in Christ, he is a new creature: old things are passed away; behold, all things are become new.',
    gridSize: 15,
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
