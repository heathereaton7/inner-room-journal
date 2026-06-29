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
  {
    id: 'ws_walk_by_faith',
    title: 'Walk by Faith',
    reference: '2 Corinthians 5:7',
    verseText: 'For we walk by faith, not by sight.',
    gridSize: 10,
  },
  {
    id: 'ws_more_than_conquerors',
    title: 'More Than Conquerors',
    reference: 'Romans 8:37',
    verseText: 'Nay, in all these things we are more than conquerors through him that loved us.',
    gridSize: 13,
  },
  {
    id: 'ws_god_is_my_refuge',
    title: 'God Is Our Refuge',
    reference: 'Psalm 46:1',
    verseText: 'God is our refuge and strength, a very present help in trouble.',
    gridSize: 12,
  },
  {
    id: 'ws_good_shepherd',
    title: 'The Good Shepherd',
    reference: 'John 10:11',
    verseText: 'I am the good shepherd: the good shepherd giveth his life for the sheep.',
    gridSize: 13,
  },
  {
    id: 'ws_taste_and_see',
    title: 'Taste and See',
    reference: 'Psalm 34:8',
    verseText: 'O taste and see that the Lord is good: blessed is the man that trusteth in him.',
    gridSize: 13,
  },
  {
    id: 'ws_my_grace_sufficient',
    title: 'My Grace Is Sufficient',
    reference: '2 Corinthians 12:9',
    verseText: 'My grace is sufficient for thee: for my strength is made perfect in weakness.',
    gridSize: 13,
  },
  {
    id: 'ws_plans_to_prosper',
    title: 'Thoughts of Peace',
    reference: 'Jeremiah 29:11',
    verseText: 'For I know the thoughts that I think toward you, saith the Lord, thoughts of peace, and not of evil, to give you an expected end.',
    gridSize: 16,
  },
  {
    id: 'ws_in_him_we_live',
    title: 'In Him We Live',
    reference: 'Acts 17:28',
    verseText: 'For in him we live, and move, and have our being.',
    gridSize: 11,
  },
  {
    id: 'ws_ask_and_receive',
    title: 'Ask and It Shall Be Given',
    reference: 'Matthew 7:7',
    verseText: 'Ask, and it shall be given you; seek, and ye shall find; knock, and it shall be opened unto you.',
    gridSize: 14,
  },
  {
    id: 'ws_finished_good_fight',
    title: 'I Have Fought a Good Fight',
    reference: '2 Timothy 4:7',
    verseText: 'I have fought a good fight, I have finished my course, I have kept the faith.',
    gridSize: 13,
  },
  {
    id: 'ws_let_there_be_light',
    title: 'Let There Be Light',
    reference: 'Genesis 1:3',
    verseText: 'And God said, Let there be light: and there was light.',
    gridSize: 11,
  },
  {
    id: 'ws_great_is_thy_faith',
    title: 'Great Is Thy Faithfulness',
    reference: 'Lamentations 3:22-23',
    verseText: 'It is of the Lord\u2019s mercies that we are not consumed, because his compassions fail not. They are new every morning: great is thy faithfulness.',
    gridSize: 16,
  },

  // ── Identity in Christ — who you are because of Jesus ──
  {
    id: 'ws_id_sons_of_god',
    title: 'Power to Become',
    reference: 'John 1:12',
    verseText: 'But as many as received him, to them gave he power to become the sons of God, even to them that believe on his name.',
    gridSize: 16,
  },
  {
    id: 'ws_id_crucified_with_christ',
    title: 'Christ Liveth in Me',
    reference: 'Galatians 2:20',
    verseText: 'I am crucified with Christ: nevertheless I live; yet not I, but Christ liveth in me.',
    gridSize: 15,
  },
  {
    id: 'ws_id_chosen_generation',
    title: 'A Chosen Generation',
    reference: '1 Peter 2:9',
    verseText: 'But ye are a chosen generation, a royal priesthood, an holy nation, a peculiar people.',
    gridSize: 15,
  },
  {
    id: 'ws_id_workmanship',
    title: 'We Are His Workmanship',
    reference: 'Ephesians 2:10',
    verseText: 'For we are his workmanship, created in Christ Jesus unto good works.',
    gridSize: 14,
  },
  {
    id: 'ws_id_called_sons',
    title: 'Called the Sons of God',
    reference: '1 John 3:1',
    verseText: 'Behold, what manner of love the Father hath bestowed upon us, that we should be called the sons of God.',
    gridSize: 16,
  },
  {
    id: 'ws_id_children_by_faith',
    title: 'Children of God by Faith',
    reference: 'Galatians 3:26',
    verseText: 'For ye are all the children of God by faith in Christ Jesus.',
    gridSize: 13,
  },
  {
    id: 'ws_id_vine_branches',
    title: 'The Vine and the Branches',
    reference: 'John 15:5',
    verseText: 'I am the vine, ye are the branches: he that abideth in me, and I in him, the same bringeth forth much fruit.',
    gridSize: 16,
  },
  {
    id: 'ws_id_hid_with_christ',
    title: 'Hid With Christ in God',
    reference: 'Colossians 3:3',
    verseText: 'For ye are dead, and your life is hid with Christ in God.',
    gridSize: 12,
  },
  {
    id: 'ws_id_spirit_witness',
    title: 'The Spirit Beareth Witness',
    reference: 'Romans 8:16',
    verseText: 'The Spirit itself beareth witness with our spirit, that we are the children of God.',
    gridSize: 14,
  },
  {
    id: 'ws_id_righteousness_of_god',
    title: 'The Righteousness of God',
    reference: '2 Corinthians 5:21',
    verseText: 'For he hath made him to be sin for us, who knew no sin; that we might be made the righteousness of God in him.',
    gridSize: 16,
  },

  // ── Heather's Story — Part 1: "I Sold Everything and Ran" ──
  // Leaving it all behind, healing, a new identity, and finding Jesus.
  {
    id: 'ws_story1_new_creature',
    group: "Heather's Story — Part 1",
    title: 'All Things New',
    reference: '2 Corinthians 5:17',
    verseText: 'Therefore if any man be in Christ, he is a new creature: old things are passed away; behold, all things are become new.',
    gridSize: 16,
  },
  {
    id: 'ws_story1_new_thing',
    group: "Heather's Story — Part 1",
    title: 'A Way in the Wilderness',
    reference: 'Isaiah 43:19',
    verseText: 'Behold, I will do a new thing; now it shall spring forth; shall ye not know it? I will even make a way in the wilderness, and rivers in the desert.',
    gridSize: 16,
  },
  {
    id: 'ws_story1_wonderfully_made',
    group: "Heather's Story — Part 1",
    title: 'Fearfully and Wonderfully Made',
    reference: 'Psalm 139:14',
    verseText: 'I will praise thee; for I am fearfully and wonderfully made: marvellous are thy works; and that my soul knoweth right well.',
    gridSize: 16,
  },
  {
    id: 'ws_story1_expected_end',
    group: "Heather's Story — Part 1",
    title: 'An Expected End',
    reference: 'Jeremiah 29:11',
    verseText: 'For I know the thoughts that I think toward you, saith the Lord, thoughts of peace, and not of evil, to give you an expected end.',
    gridSize: 16,
  },
  {
    id: 'ws_story1_direct_paths',
    group: "Heather's Story — Part 1",
    title: 'He Shall Direct Thy Paths',
    reference: 'Proverbs 3:6',
    verseText: 'In all thy ways acknowledge him, and he shall direct thy paths.',
    gridSize: 13,
  },

  // ── Heather's Story — Part 2: "Then Everything Fell Apart" ──
  // When it all broke down, God showed up every time.
  {
    id: 'ws_story2_work_together',
    group: "Heather's Story — Part 2",
    title: 'All Things Work Together',
    reference: 'Romans 8:28',
    verseText: 'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.',
    gridSize: 16,
  },
  {
    id: 'ws_story2_broken_heart',
    group: "Heather's Story — Part 2",
    title: 'Nigh to the Broken Heart',
    reference: 'Psalm 34:18',
    verseText: 'The Lord is nigh unto them that are of a broken heart; and saveth such as be of a contrite spirit.',
    gridSize: 15,
  },
  {
    id: 'ws_story2_healeth_broken',
    group: "Heather's Story — Part 2",
    title: 'He Healeth the Broken',
    reference: 'Psalm 147:3',
    verseText: 'He healeth the broken in heart, and bindeth up their wounds.',
    gridSize: 13,
  },
  {
    id: 'ws_story2_miry_clay',
    group: "Heather's Story — Part 2",
    title: 'Out of the Miry Clay',
    reference: 'Psalm 40:2',
    verseText: 'He brought me up also out of an horrible pit, out of the miry clay, and set my feet upon a rock, and established my goings.',
    gridSize: 16,
  },
  {
    id: 'ws_story2_grace_sufficient',
    group: "Heather's Story — Part 2",
    title: 'My Grace Is Sufficient',
    reference: '2 Corinthians 12:9',
    verseText: 'And he said unto me, My grace is sufficient for thee: for my strength is made perfect in weakness.',
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
 *   - Skip short words (1-2 letters) since they're trivial to find, clutter the
 *     grid, and are easily traced inside longer words (but we still display them
 *     in the verse reveal)
 *   - Deduplicate so the same word doesn't have to be hidden twice
 *   - Drop any word that can be traced (forwards OR backwards) inside a longer
 *     target word, e.g. BE/HE inside BEHOLD or CARE inside CARETH. The grid
 *     matches in all 8 directions including reverse, so without this the player
 *     could "find" a word within another word.
 */
export function extractWords(verseText) {
  const raw = verseText.toUpperCase().replace(/[^A-Z\s]/g, ' ').split(/\s+/).filter(Boolean);
  const seen = new Set();
  const out = [];
  for (const w of raw) {
    if (w.length < 3) continue;
    if (seen.has(w)) continue;
    seen.add(w);
    out.push(w);
  }
  return out.filter(w => !out.some(other => {
    if (other === w || other.length <= w.length) return false;
    const rev = other.split('').reverse().join('');
    return other.includes(w) || rev.includes(w);
  }));
}

/**
 * Original word sequence (with duplicates) for displaying the verse reveal.
 */
export function verseWords(verseText) {
  return verseText.toUpperCase().replace(/[^A-Z\s]/g, ' ').split(/\s+/).filter(Boolean);
}
