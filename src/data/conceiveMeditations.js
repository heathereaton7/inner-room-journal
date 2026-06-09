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
 *   study        : { context, crossRefs:[reference strings], questions:[strings] }
 *                  the "Go Deeper" in-app study for this passage
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
    study: {
      context: 'Hannah was childless for years, and she carried real grief — the text says she was in "bitterness of soul." She did not hide her pain or pretend to be fine; she brought the raw ache straight to God in the tabernacle. Notice that she prayed and wept at the same time. God did not rebuke her honesty. A few verses later (1 Samuel 1:19-20) the Lord "remembered her," and she conceived Samuel. Her tears were never wasted; they were heard. Your waiting is not silence to God — He is leaning in to every word and every tear.',
      crossRefs: ['1 Samuel 1:11', '1 Samuel 1:19', 'Psalm 56:8', 'Psalm 34:18'],
      questions: [
        'What is the honest ache you have been afraid to bring to God? What would it look like to pour it out the way Hannah did?',
        'Hannah believed God could hear her even in bitterness of soul. Where do you need to believe He is near in your pain right now?',
        'Psalm 56:8 says God keeps your tears in a bottle. How does it change your waiting to know none of your tears are unseen?',
      ],
    },
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
    study: {
      context: 'When Scripture says "God remembered Rachel," it does not mean He had forgotten her — God never forgets. In the Bible, for God to "remember" means He moves to act on what He has always known. The same word is used when God "remembered" Noah in the flood and "remembered" His covenant with Abraham. Rachel had waited a long time and even wrestled with envy and despair (Genesis 30:1). Yet at the right moment, God acted. Your season may feel like silence, but the God who remembered Rachel is keeping watch over your story too.',
      crossRefs: ['Genesis 8:1', 'Genesis 21:1', '1 Samuel 1:19', 'Luke 1:13'],
      questions: [
        'Where have you started to feel forgotten? What would change if you truly believed God is actively remembering you?',
        'Rachel\'s waiting was long and painful before God acted. How can you guard your heart from bitterness while you wait?',
        'God "remembering" always leads to action in His timing. What does it look like to trust His timing rather than your own?',
      ],
    },
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
    study: {
      context: 'David wrote this at the close of a psalm full of enemies, fear, and longing. Waiting in Scripture is not passive idleness — the Hebrew word carries the idea of a tense, hopeful expectation, like a watchman waiting for morning. David repeats the command twice ("wait, I say, on the LORD") because he knows how tempting it is to give up. Between the two commands is a promise: God Himself will strengthen your heart. The strength to keep waiting does not come from gritting your teeth; it comes from Him as you wait.',
      crossRefs: ['Psalm 27:13', 'Isaiah 40:31', 'Psalm 130:5', 'Lamentations 3:25'],
      questions: [
        'David had to tell himself to wait twice. What does your heart say when waiting gets hard, and what truth do you need to repeat to yourself?',
        'The verse links waiting with courage. Where do you need courage today to keep hoping?',
        'God promises to strengthen your heart as you wait. What is one way you can lean on His strength instead of your own this week?',
      ],
    },
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
    study: {
      context: 'This proverb names something honestly that many believers feel guilty about: waiting can genuinely make the heart sick. The Bible does not shame you for the heaviness of deferred hope — it acknowledges it. But the verse does not end in sickness. The fulfilled desire is called "a tree of life," an image of flourishing and joy that runs from Eden (Genesis 2:9) to the New Jerusalem (Revelation 22:2). Romans tells us that hope rooted in God "maketh not ashamed." Your longing is not foolish, and the God of hope can keep your heart alive even in the wait.',
      crossRefs: ['Romans 5:3-5', 'Proverbs 13:19', 'Psalm 42:11', 'Romans 15:13'],
      questions: [
        'In what ways has deferred hope made your heart "sick"? How does it help to know God\'s Word names that pain instead of dismissing it?',
        'Romans 5 says hope built on God does not disappoint. How is hope in God different from hope pinned only on an outcome?',
        'What is one practice that helps keep your hope alive and tender rather than hardened or numb?',
      ],
    },
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
    study: {
      context: 'Psalm 127 is a song of ascent, sung by pilgrims journeying up to Jerusalem. Its theme is that all true building is the Lord\'s work — "except the LORD build the house, they labour in vain." In that context, children are named a "heritage" and a "reward," words that point to inheritance and grace, not payment earned. A child is never a wage for being good enough; a child is a gift from a generous Father. As you ask God for this gift, you are asking the One whose heart toward you is good.',
      crossRefs: ['Psalm 127:1', 'Psalm 128:3', 'Genesis 33:5', 'James 1:17'],
      questions: [
        'Do you ever feel like you have to earn God\'s blessing? How does seeing children as a gift, not a wage, change how you pray?',
        'Psalm 127 begins by saying God must build the house. Where are you tempted to strive in your own strength instead of trusting His building?',
        'What does it tell you about God\'s heart that He calls children a "reward" — a word of grace and delight?',
      ],
    },
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
    study: {
      context: 'Paul wrote these words from prison, and "be careful for nothing" means "be anxious for nothing" in older English. He does not simply command you to stop worrying — he gives you something to do with the worry. Every anxious thought becomes a specific request brought to God, wrapped in thanksgiving. Thanksgiving matters: it reminds you of who God has already been before you see the answer. The very next verse (Philippians 4:7) promises the result — a peace beyond understanding that guards your heart.',
      crossRefs: ['Philippians 4:7', '1 Peter 5:7', 'Matthew 6:25-27', 'Psalm 55:22'],
      questions: [
        'What is the specific anxiety about conceiving that you most need to turn into a prayer instead of a worry?',
        'Paul ties requests to thanksgiving. What can you genuinely thank God for today, even before the answer comes?',
        'Worry tends to come back. What is your plan for "casting it again" each time the anxiety returns?',
      ],
    },
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
    study: {
      context: 'Paul begged God three times to remove a painful "thorn in the flesh," and God\'s answer was not to remove it but to give grace within it. This is one of Scripture\'s most tender truths: God\'s strength is not just available despite our weakness — it is "made perfect" in it. Weakness is the very place His power shows up most clearly. Paul learned to stop hiding his weakness and instead let it become a doorway for grace. In a season where you feel weak in faith and patience, that weakness is not disqualifying; it is the place God meets you.',
      crossRefs: ['2 Corinthians 12:10', 'Isaiah 40:29', '2 Corinthians 4:7', 'Hebrews 4:16'],
      questions: [
        'Where do you feel weakest in this season — faith, patience, hope, or your body? What would it look like to bring that exact weakness to God?',
        'Paul stopped hiding his weakness and let God\'s grace fill it. What weakness have you been trying to hide or fix on your own?',
        'How does it change things to believe God\'s strength shows up best precisely where you are weakest?',
      ],
    },
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
    study: {
      context: 'Peter wrote to believers under pressure and suffering. The word "casting" pictures throwing a heavy load off yourself and onto someone able to carry it. The reason given is stunning in its simplicity: "for he careth for you." The God who holds the universe is personally concerned with your private burdens. This verse is actually attached to the one before it about humbling yourself under God\'s hand — casting your care on God is an act of humility, admitting you were never meant to carry it alone.',
      crossRefs: ['1 Peter 5:6', 'Psalm 55:22', 'Matthew 11:28-30', 'Psalm 68:19'],
      questions: [
        'What care do you keep "picking back up" after you give it to God? Why do you think it is so hard to leave it with Him?',
        'Peter says casting your cares is connected to humility. How is trusting God with this burden an act of letting go of control?',
        '"He careth for you" — do you truly believe God cares about this specific longing? What helps you believe it?',
      ],
    },
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
    study: {
      context: 'Psalm 46 is the psalm that inspired the hymn "A Mighty Fortress Is Our God." It opens with the earth being moved and mountains falling into the sea — chaos on every side — yet declares "God is our refuge and strength." The command to "be still" is not an invitation to a peaceful, easy life; it is a command to stop striving and frantic fear in the middle of upheaval. "Know that I am God" is the anchor: rest comes not from calm circumstances but from knowing who He is. You can be still because He is God, and you are not.',
      crossRefs: ['Psalm 46:1', 'Exodus 14:14', 'Isaiah 30:15', 'Psalm 62:5'],
      questions: [
        'What striving or controlling is your heart doing right now that God is inviting you to lay down?',
        'The psalm describes chaos, yet still says "be still." How can you find God\'s rest even when your circumstances are unsettled?',
        'Stillness here flows from knowing who God is. Which truth about God\'s character most steadies you today?',
      ],
    },
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
    study: {
      context: 'God spoke this question to Abraham after Sarah laughed in disbelief at the promise of a son in her old age. Humanly, it was impossible — Sarah was well past childbearing years. But God\'s question is rhetorical: nothing is too hard for Him. One year later, Isaac was born (Genesis 21:1-2), and the laughter of doubt became the laughter of joy (Isaac means "laughter"). The same question echoes in Jeremiah and is answered by the angel to Mary: "with God nothing shall be impossible." Your impossible is not too big for the God of Sarah.',
      crossRefs: ['Genesis 21:1-2', 'Jeremiah 32:17', 'Luke 1:37', 'Matthew 19:26'],
      questions: [
        'What feels "too hard" about your situation? How does it help to bring that exact impossibility to God?',
        'Sarah\'s laughter of doubt became laughter of joy. Where have you laughed in disbelief, and how might God want to redeem that?',
        'God did not need Sarah\'s ability — only His own power and His timing. How does that free you from pressure to make it happen?',
      ],
    },
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
    study: {
      context: 'Psalm 113 praises a God who "humbleth himself to behold the things that are in heaven, and in the earth" — the exalted King who stoops low to lift up the lowly. The psalm pictures Him raising the poor from the dust and seating them with princes, and then, as the climax, turning a barren woman into a joyful mother. This was sung at Passover. It is a picture of God\'s heart for reversal: He delights to bring life where there was emptiness. Your story of waiting is exactly the kind of story this God loves to turn into praise.',
      crossRefs: ['Psalm 113:7-8', '1 Samuel 2:5', 'Isaiah 54:1', 'Luke 1:46-49'],
      questions: [
        'Psalm 113 shows a God who stoops to lift the lowly. Where do you need Him to stoop down to you right now?',
        'The psalm calls the barren woman a "joyful mother." Can you praise God in advance for joy you have not yet seen? What makes that hard or possible?',
        'How does remembering God\'s pattern of reversal (dust to honor, barren to joyful) shape the way you pray today?',
      ],
    },
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
    study: {
      context: 'David wrote Psalm 30 as a song of thanksgiving after God lifted him out of a deep low. The contrast he draws is between a "night" of weeping and the "morning" of joy. Night in Scripture is often a season of sorrow and testing — but mornings always come. The verse does not promise the night will be short, only that it will not be the end. God\'s anger is "but for a moment," while His favor is "for a lifetime." Whatever night you are in, it has a morning that God Himself is bringing.',
      crossRefs: ['Psalm 30:11', 'Lamentations 3:22-23', 'John 16:20', 'Isaiah 61:3'],
      questions: [
        'What does the "night" feel like in your waiting? How does it help to know God calls it a night, not the end?',
        'David eventually testified that God turned his mourning into dancing (Psalm 30:11). What would it look like to trust God for that turn?',
        'Lamentations says mercy is new "every morning." How can you receive fresh mercy for today instead of carrying yesterday\'s grief?',
      ],
    },
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
    study: {
      context: 'Psalm 37 is a wisdom psalm urging believers not to fret over those who seem to prosper without God. Into that context comes the call to "delight thyself in the LORD." This is not a formula where delighting in God earns you whatever you want. Rather, as you find your deepest joy in God Himself, He shapes and satisfies the desires of your heart — both fulfilling some and refining others to match His. The surrounding verses tell you to "commit thy way" and "rest in the LORD." Delight is about treasuring the Giver above the gift.',
      crossRefs: ['Psalm 37:5', 'Psalm 37:7', 'Matthew 6:33', 'Psalm 73:25-26'],
      questions: [
        'Be honest: is your delight more in God Himself, or in the gift you are asking for? How can you grow in delighting in Him?',
        'The next verses say "commit thy way" and "rest." What would it look like to commit this desire to God and then rest?',
        'How might delighting in God actually reshape what you most deeply long for over time?',
      ],
    },
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
    study: {
      context: 'Solomon opens this famous passage with a sweeping truth: there is a season and a time for everything. The verses that follow name times to be born and to die, to weep and to laugh, to embrace and to refrain. The point is that life moves through God-ordained seasons, and wisdom means trusting the One who sets the times rather than demanding our own. A few verses later he adds that God "hath made every thing beautiful in his time." Your season of waiting is not outside God\'s calendar — it is part of a timing He calls beautiful.',
      crossRefs: ['Ecclesiastes 3:11', 'Habakkuk 2:3', 'Galatians 4:4', 'Acts 1:7'],
      questions: [
        'Where are you fighting against God\'s timing and trying to impose your own? What would surrender look like?',
        'Ecclesiastes says God makes things beautiful "in his time." Can you trust that even this waiting will have a beauty you cannot yet see?',
        'Galatians 4:4 says Christ came "in the fulness of time." How does God\'s perfect timing in the bigger story help you trust His timing in yours?',
      ],
    },
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
    study: {
      context: 'Isaiah 40 was written to a people worn down and feeling that God had overlooked them ("My way is hid from the LORD," v.27). God answers by reminding them that He is the everlasting Creator who "fainteth not, neither is weary." Then comes the promise: those who wait on Him will exchange their weariness for His strength. The progression — mounting up, running, walking — is striking. Sometimes faith soars, sometimes it just keeps walking without fainting. All of it is sustained by God\'s strength, not our own. Waiting is the very thing that renews you here.',
      crossRefs: ['Isaiah 40:28-29', 'Isaiah 40:27', '2 Corinthians 4:16', 'Psalm 103:5'],
      questions: [
        'How worn out do you feel in this season? Where do you need God to renew your strength today?',
        'The verse moves from soaring to running to simply walking without fainting. Which describes your faith right now, and how can you keep walking?',
        'God says He "fainteth not." How does the tirelessness of God encourage your tired heart?',
      ],
    },
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
    study: {
      context: 'God spoke this promise through Jeremiah to people in exile in Babylon — and He had just told them the wait would last seventy years (Jeremiah 29:10). In other words, the famous promise of a future and a hope was given to people in the middle of a long, hard wait, not at the end of it. God\'s "thoughts of peace" do not always mean a quick rescue; they mean His intentions toward you are good even when the timeline is long. He tells them to keep living, praying, and seeking Him in the waiting (v.12-13), and promises they will find Him when they seek with all their heart.',
      crossRefs: ['Jeremiah 29:10', 'Jeremiah 29:12-13', 'Romans 8:28', 'Proverbs 19:21'],
      questions: [
        'This promise was given to people in a long wait. How does that context make the verse more honest and more comforting for your season?',
        'God\'s thoughts toward you are "peace, not evil." Where do you struggle to believe His intentions are good?',
        'Verses 12-13 call them to keep seeking God in the wait. What does it look like to seek Him "with all your heart" right now?',
      ],
    },
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
    study: {
      context: 'Hagar was a mistreated, pregnant servant who fled into the wilderness, alone and overlooked by everyone. There, the angel of the LORD found her, called her by name, and made promises over her future. In response, Hagar gave God a name no one else in Scripture gives Him: El Roi, "the God who sees me." She was the lowest in her household, yet she was the one God personally sought out in the desert. If God saw Hagar in her wilderness, He sees you in yours — including the private aches no one else knows about.',
      crossRefs: ['Genesis 16:11', 'Psalm 139:1-4', 'Hebrews 4:13', 'Luke 12:6-7'],
      questions: [
        'Where do you feel overlooked or invisible in this journey? How does "Thou God seest me" speak to that?',
        'God found Hagar in the wilderness and called her by name. What does it mean to you that God seeks you out personally?',
        'Psalm 139 says God knows your every thought. Is there a private longing you can bring honestly to the God who already sees it?',
      ],
    },
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
    study: {
      context: 'This verse is the triumphant conclusion of 1 Corinthians 15, the great resurrection chapter. Because Christ is risen and death is defeated, Paul says, your labor "is not in vain in the Lord." The word "therefore" connects everything: the resurrection guarantees that nothing done in faith is ever wasted. In a world where so much feels futile, the resurrection is the proof that God redeems and uses everything offered to Him. Your prayers, your perseverance, the unseen work God is doing in your heart through this waiting — none of it disappears. It all counts in the Lord.',
      crossRefs: ['1 Corinthians 15:57', 'Galatians 6:9', 'Hebrews 6:10', '2 Chronicles 15:7'],
      questions: [
        'What in this season has felt "in vain" to you — like it is going nowhere? How does the resurrection speak to that fear?',
        'Paul calls you to be "steadfast, unmoveable." What helps you stay anchored when your emotions are shaken?',
        'God promises your labor counts. What unseen work might God be doing in you through this very waiting?',
      ],
    },
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
    study: {
      context: 'This is one of the best-known proverbs, and its wisdom is profound for anyone in a confusing season. To trust God "with all thine heart" is total, not partial. The second half is just as important: "lean not unto thine own understanding." In a waiting season, the mind spins trying to figure out the why and the when — calculating, analyzing, researching. The proverb does not forbid wisdom, but it warns against leaning your whole weight on your own ability to make sense of things. The next verse promises that when you acknowledge Him in all your ways, "he shall direct thy paths."',
      crossRefs: ['Proverbs 3:6', 'Isaiah 55:8-9', 'Psalm 32:8', 'Jeremiah 17:7-8'],
      questions: [
        'Where are you leaning hard on your "own understanding" — trying to figure everything out? What would it look like to lean on God instead?',
        'Trusting "with all thine heart" is total. Is there a part of this you are still holding back from God?',
        'The promise is that God will direct your path. How might trust actually bring more peace than having all the answers?',
      ],
    },
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
    study: {
      context: 'This is the promise that immediately follows the command to be anxious for nothing and to pray about everything (Philippians 4:6). The word "keep" is a military term — it pictures a garrison of soldiers standing guard over a city. God\'s peace stands watch over your heart and mind, protecting them from the assault of anxious thoughts. This peace "passeth all understanding," meaning it does not depend on your circumstances making sense. You may not understand the timing or the wait, but the peace of God can guard you right in the middle of the not-knowing.',
      crossRefs: ['Philippians 4:6', 'John 14:27', 'Isaiah 26:3', 'Colossians 3:15'],
      questions: [
        'This peace "passeth understanding" — it does not require answers first. Where do you need peace that does not depend on circumstances changing?',
        'The peace of God "guards" your heart and mind like a soldier. What anxious thoughts do you most need guarded against?',
        'Verse 6 (prayer) comes before verse 7 (peace). How have you experienced peace arriving after you truly prayed?',
      ],
    },
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
    study: {
      context: 'Hebrews was written to believers tempted to give up and drift away under pressure. The command to "hold fast" pictures gripping something tightly so it cannot be torn from your hands. But notice where the strength to hold on comes from — not from your own willpower, but from the character of the One who made the promise: "for he is faithful that promised." Your grip may feel weak and wavering, but the object of your hope is utterly reliable. You hold fast not because your faith is strong, but because God is faithful. The next verses urge believers to spur one another on, reminding us we are not meant to hold on alone.',
      crossRefs: ['Hebrews 10:24-25', 'Hebrews 11:11', '1 Thessalonians 5:24', 'Lamentations 3:23'],
      questions: [
        'What does it look like to "hold fast" to hope on the days your faith feels like it is wavering?',
        'The anchor is God\'s faithfulness, not your strength. How does shifting your focus from your faith to His faithfulness steady you?',
        'Hebrews says we hold on better together (v.24-25). Who can you let walk with you and remind you of God\'s faithfulness in this season?',
      ],
    },
  },
];
