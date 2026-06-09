/**
 * Trying to Conceive — meditation cards for the season of waiting and hoping
 * for a child. Same card shape as pregnancyMeditations.js / fatherMeditations.js
 * (verse + prayer + affirmation), but these are NOT tied to a pregnancy week.
 * They are themed reflections for the trying-to-conceive journey.
 *
 * Shape per entry:
 *   week         : sequence number (1..N) — reused as the card id so the
 *                  shared meditation screen's progress logic works unchanged
 *   title        : short theme for the card
 *   verse        : { text, reference }   KJV
 *   prayer       : a prayer to pray over the waiting season
 *   affirmation  : a Scripture-rooted truth to speak over yourself
 */
export const CONCEIVE_MEDITATIONS = [
  {
    week: 1,
    title: 'He Hears the Cry of the Waiting',
    verse: {
      text: 'And she was in bitterness of soul, and prayed unto the LORD, and wept sore.',
      reference: '1 Samuel 1:10',
    },
    prayer: 'Father, like Hannah I bring You the ache I carry. You are not distant from my tears. Hear the prayer of my heart, and let me know that I am seen by You even in the waiting. In Jesus\' name, amen.',
    affirmation: 'My longing is not hidden from God; He hears every cry of my heart.',
  },
  {
    week: 2,
    title: 'The Lord Remembers',
    verse: {
      text: 'And God remembered Rachel, and God hearkened to her, and opened her womb.',
      reference: 'Genesis 30:22',
    },
    prayer: 'Lord, You remembered Rachel in her longing, and You remember me. Nothing about my story has slipped Your mind. Help me to wait in faith, trusting that You hold the timing in Your hands. Amen.',
    affirmation: 'God has not forgotten me. I am remembered and held by Him.',
  },
  {
    week: 3,
    title: 'Wait on the Lord',
    verse: {
      text: 'Wait on the LORD: be of good courage, and he shall strengthen thine heart: wait, I say, on the LORD.',
      reference: 'Psalm 27:14',
    },
    prayer: 'God, waiting is hard, and some days my heart grows weary. Strengthen me. Give me courage to keep hoping without growing bitter. Steady my soul in You while I wait. Amen.',
    affirmation: 'As I wait on the Lord, He is strengthening my heart.',
  },
  {
    week: 4,
    title: 'Hope That Does Not Disappoint',
    verse: {
      text: 'Hope deferred maketh the heart sick: but when the desire cometh, it is a tree of life.',
      reference: 'Proverbs 13:12',
    },
    prayer: 'Father, You know how the waiting can make my heart sick. Guard my hope from despair. Keep it alive and tender, rooted in You and not only in an outcome. Be my tree of life today. Amen.',
    affirmation: 'My hope is anchored in God, who is faithful and good.',
  },
  {
    week: 5,
    title: 'Children Are a Heritage',
    verse: {
      text: 'Lo, children are an heritage of the LORD: and the fruit of the womb is his reward.',
      reference: 'Psalm 127:3',
    },
    prayer: 'Lord, every child is a gift from Your hand, never an accident or an earning. I ask You for the gift of a child, and I trust Your heart toward me as a good Father. Amen.',
    affirmation: 'Children are a gift from God, and I trust His good heart toward me.',
  },
  {
    week: 6,
    title: 'Be Anxious for Nothing',
    verse: {
      text: 'Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God.',
      reference: 'Philippians 4:6',
    },
    prayer: 'God, I lay down the anxiety I have been carrying about this. I bring my request to You honestly, and I thank You in advance for Your faithfulness. Trade my worry for Your peace. Amen.',
    affirmation: 'I release my anxiety to God and receive His peace in its place.',
  },
  {
    week: 7,
    title: 'His Strength in My Weakness',
    verse: {
      text: 'My grace is sufficient for thee: for my strength is made perfect in weakness.',
      reference: '2 Corinthians 12:9',
    },
    prayer: 'Father, I feel weak in this season — weak in faith, weak in patience, weak in hope. Let Your grace be enough for me. Be strong where I am not. Amen.',
    affirmation: 'God\'s grace is sufficient for me; His strength carries me through.',
  },
  {
    week: 8,
    title: 'Cast Your Care on Him',
    verse: {
      text: 'Casting all your care upon him; for he careth for you.',
      reference: '1 Peter 5:7',
    },
    prayer: 'Lord, I keep picking my worries back up. Help me truly cast this care on You and leave it there, because You care for me more than I can fathom. Amen.',
    affirmation: 'I cast my cares on God because He genuinely cares for me.',
  },
  {
    week: 9,
    title: 'Be Still and Know',
    verse: {
      text: 'Be still, and know that I am God.',
      reference: 'Psalm 46:10',
    },
    prayer: 'God, quiet the striving in my heart. In the stillness, remind me who You are — sovereign, loving, and near. Let me rest in Your character even before I see the answer. Amen.',
    affirmation: 'I can be still, because God is God and He is in control.',
  },
  {
    week: 10,
    title: 'Nothing Too Hard for God',
    verse: {
      text: 'Is any thing too hard for the LORD?',
      reference: 'Genesis 18:14',
    },
    prayer: 'Father, You promised Sarah a child when it seemed impossible, and You kept Your word. Nothing is too hard for You. I bring my impossible to the One who specializes in the impossible. Amen.',
    affirmation: 'Nothing is too hard for the Lord — not even this.',
  },
  {
    week: 11,
    title: 'He Gives the Barren a Home',
    verse: {
      text: 'He maketh the barren woman to keep house, and to be a joyful mother of children. Praise ye the LORD.',
      reference: 'Psalm 113:9',
    },
    prayer: 'Lord, You are the God who turns barrenness into joy and emptiness into a home full of life. I praise You in advance for the joy You are able to give. Lift my eyes to Your power. Amen.',
    affirmation: 'God is able to turn my waiting into joy.',
  },
  {
    week: 12,
    title: 'Weeping May Endure for a Night',
    verse: {
      text: 'Weeping may endure for a night, but joy cometh in the morning.',
      reference: 'Psalm 30:5',
    },
    prayer: 'Father, some nights are long and heavy. Thank You that the night is not the end of my story. Let me hold on for the morning joy You are bringing. Amen.',
    affirmation: 'My weeping is not forever; God is bringing joy in the morning.',
  },
  {
    week: 13,
    title: 'Delight Yourself in the Lord',
    verse: {
      text: 'Delight thyself also in the LORD; and he shall give thee the desires of thine heart.',
      reference: 'Psalm 37:4',
    },
    prayer: 'God, draw my heart to delight in You first — not just in what I want, but in who You are. As I find my joy in You, align the desires of my heart with Yours. Amen.',
    affirmation: 'As I delight in the Lord, He tends to the desires of my heart.',
  },
  {
    week: 14,
    title: 'His Timing Is Perfect',
    verse: {
      text: 'To every thing there is a season, and a time to every purpose under the heaven.',
      reference: 'Ecclesiastes 3:1',
    },
    prayer: 'Lord, I confess I want this on my timeline. Help me trust Your seasons. You are never early and never late. Teach me to wait without striving against Your good timing. Amen.',
    affirmation: 'God\'s timing is perfect, and my season is in His hands.',
  },
  {
    week: 15,
    title: 'Renewed Strength',
    verse: {
      text: 'They that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles.',
      reference: 'Isaiah 40:31',
    },
    prayer: 'Father, I am tired. Renew me as I wait on You. Lift me above the weariness so I can keep walking and not faint. Carry me on Your strength, not my own. Amen.',
    affirmation: 'Waiting on the Lord renews my strength day by day.',
  },
  {
    week: 16,
    title: 'He Knows the Plans',
    verse: {
      text: 'For I know the thoughts that I think toward you, saith the LORD, thoughts of peace, and not of evil, to give you an expected end.',
      reference: 'Jeremiah 29:11',
    },
    prayer: 'God, Your thoughts toward me are thoughts of peace. Even when I cannot see the way, You hold a future full of hope for me. I trust You with the end of this story. Amen.',
    affirmation: 'God\'s thoughts toward me are peace, and my future is in His hands.',
  },
  {
    week: 17,
    title: 'The God Who Sees Me',
    verse: {
      text: 'Thou God seest me.',
      reference: 'Genesis 16:13',
    },
    prayer: 'Lord, like Hagar in the wilderness, I need to know I am seen. You see me in my private longing and my unspoken prayers. Thank You that I am never invisible to You. Amen.',
    affirmation: 'I am seen by God; He knows me and walks with me in this.',
  },
  {
    week: 18,
    title: 'Your Labor Is Not in Vain',
    verse: {
      text: 'Therefore, my beloved brethren, be ye stedfast, unmoveable... forasmuch as ye know that your labour is not in vain in the Lord.',
      reference: '1 Corinthians 15:58',
    },
    prayer: 'Father, the prayers, the hoping, the holding on — none of it is wasted in You. Keep me steadfast and unmoved. Let me trust that this season is doing something eternal in me. Amen.',
    affirmation: 'Nothing I bring to God in this season is wasted.',
  },
  {
    week: 19,
    title: 'Trust in the Lord',
    verse: {
      text: 'Trust in the LORD with all thine heart; and lean not unto thine own understanding.',
      reference: 'Proverbs 3:5',
    },
    prayer: 'God, I do not understand the why or the when. Help me lean on You instead of on my own ability to figure it out. I choose to trust You with my whole heart today. Amen.',
    affirmation: 'I trust the Lord with all my heart, even what I cannot understand.',
  },
  {
    week: 20,
    title: 'The Peace That Guards',
    verse: {
      text: 'And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus.',
      reference: 'Philippians 4:7',
    },
    prayer: 'Lord, guard my heart and mind with Your peace — the kind that does not make sense given the circumstances. Let Your peace be the soldier standing watch over my thoughts. Amen.',
    affirmation: 'God\'s peace guards my heart and mind in this waiting.',
  },
  {
    week: 21,
    title: 'Hold Fast Your Confession of Hope',
    verse: {
      text: 'Let us hold fast the profession of our faith without wavering; (for he is faithful that promised;)',
      reference: 'Hebrews 10:23',
    },
    prayer: 'Father, help me hold fast to hope without wavering, not because I am strong, but because You are faithful. You keep Your promises. I anchor myself to Your faithfulness today. Amen.',
    affirmation: 'I hold fast to hope, because the One who promised is faithful.',
  },
];
