/**
 * Finance & Stewardship — a weekly, bite-sized course that blends biblical
 * stewardship with plain, ADHD-friendly money skills. Shame-free tone:
 * "start with one number, not all of them" / "missed a week? just return."
 *
 * Shape per lesson (mirrors the meditation card shape so patterns stay consistent):
 *   week          : sequence number (1..N) — reused as the id for progress logic
 *   title         : short lesson name
 *   headline      : one-line hook shown under the title
 *   verse         : { text, reference }   KJV anchor
 *   content       : array of short plain-language paragraphs (2-4)
 *   keyTakeaway   : one-liner summary
 *   affirmation   : a truth to speak over yourself
 *   practicalStep : ONE small, ADHD-sized action for the week
 *   study         : { context, crossRefs:[reference strings], questions:[strings] }
 */
export const FINANCE_LESSONS = [
  {
    week: 1,
    title: 'It Was Never Only Yours',
    headline: 'Stewardship starts by loosening the grip.',
    verse: {
      text: 'The earth is the LORD\'s, and the fulness thereof; the world, and they that dwell therein.',
      reference: 'Psalm 24:1',
    },
    content: [
      'Before a single budget line, there is one quiet truth that changes everything: it all belongs to God, and you are the caretaker. A steward is not the owner — a steward manages what belongs to Someone else, and answers to that Owner with love, not fear.',
      'This is good news for a tired mind. You do not have to carry the weight of ownership. You get to ask a simpler question: "God, how do You want me to care for what You have handed me this week?"',
      'You are not behind. You are not disqualified by past mistakes. Today you simply begin to caretake, one small faithful step at a time.',
    ],
    keyTakeaway: 'You are the caretaker, not the owner — that takes the pressure off.',
    affirmation: 'I am a faithful steward of what God has entrusted to me.',
    practicalStep: 'Write down one thing you are thankful God has provided this week. Just one.',
    study: {
      context: 'Scripture never treats money as neutral or as ultimately ours. Psalm 24:1 declares that everything — the earth and everyone in it — belongs to God. That reframes money management from "protecting my stuff" to "caring for God\'s stuff." A steward in the ancient world managed a master\'s entire household; the master trusted them, and they reported back. God is not a harsh accountant looking for a reason to punish you. He is the generous Owner who invites you to caretake with Him. When money feels heavy, it is often because we have quietly taken back ownership. Setting it down again is where peace begins.',
      crossRefs: ['Deuteronomy 8:18', 'Haggai 2:8', '1 Chronicles 29:14', 'Luke 16:10'],
      questions: [
        'Where have you been carrying money as if it were entirely yours to protect? What would change if you saw yourself as caretaker?',
        'What is one thing God has provided that you have stopped noticing?',
        'How does it feel to know God is a generous Owner rather than a harsh accountant?',
      ],
    },
  },
  {
    week: 2,
    title: 'Know Your Numbers',
    headline: 'You cannot steward what you refuse to look at.',
    verse: {
      text: 'Be thou diligent to know the state of thy flocks, and look well to thy herds.',
      reference: 'Proverbs 27:23',
    },
    content: [
      'For a shepherd, wealth was flocks. Wisdom said: know the state of them. Not obsess — know. In our world the flocks are our accounts, our bills, our income. Looking at the real numbers is an act of faithfulness, not fear.',
      'If checking your balance makes your stomach drop, you are not alone. Avoidance feels safer for a minute and worse for a month. But you do not have to fix anything today. You only have to look.',
      'Start small. One glance is a win. God is with you in the looking.',
    ],
    keyTakeaway: 'Looking honestly at your money is faithfulness, not failure.',
    affirmation: 'I can look at my numbers with courage, because God is with me.',
    practicalStep: 'Open one account and write down the balance. That is the whole task today.',
    study: {
      context: 'Proverbs 27:23-27 is a small farming parable about attentiveness. The shepherd who "looks well to his herds" is not anxious — he is aware. Riches, the passage warns, do not last forever (v.24), so ongoing attention matters more than one lucky harvest. For an ADHD mind, "know the state of your flocks" is permission to make knowing simple and repeatable rather than perfect. God is not asking for a flawless spreadsheet; He is inviting you to gentle, honest awareness. Avoidance is understandable, but Scripture calls the caretaker to look — and promises provision to those who tend faithfully (v.27).',
      crossRefs: ['Luke 14:28', 'Proverbs 24:3-4', 'Proverbs 27:24', '2 Corinthians 8:21'],
      questions: [
        'What money number have you been avoiding? What do you think you will feel when you finally see it?',
        'How could you make "knowing your numbers" simple enough to actually repeat each week?',
        'Where do you need to hear that awareness is faithfulness, not judgment?',
      ],
    },
  },
  {
    week: 3,
    title: 'Give, Save, Live',
    headline: 'A budget can be three buckets, not thirty.',
    verse: {
      text: 'There is treasure to be desired and oil in the dwelling of the wise; but a foolish man spendeth it up.',
      reference: 'Proverbs 21:20',
    },
    content: [
      'A budget is just a plan for the money before it disappears. It does not have to be complicated to be wise. Try three simple buckets: Give, Save, Live. Every dollar goes into one of them.',
      'The wise, Proverbs says, keep some oil in the dwelling — a little set aside — while the foolish spend it all the moment it arrives. This is not about being rich. It is about not living with your tank always on empty.',
      'Pick simple percentages you can remember. Even 10 / 10 / 80 is a real budget. The best budget is the one you will actually use.',
    ],
    keyTakeaway: 'Give, Save, Live — three buckets you can actually remember.',
    affirmation: 'I make a simple plan for my money, and simple is enough.',
    practicalStep: 'Decide your three percentages (e.g. 10 give / 10 save / 80 live) and write them down.',
    study: {
      context: 'Proverbs 21:20 contrasts the wise, who keep "treasure" and "oil" in reserve, with the fool who "spendeth it up" — consumes everything the moment it arrives. The image is a household that always has a little margin versus one perpetually scraping bottom. A budget is simply the tool that creates that margin on purpose. Scripture consistently commends planning (Proverbs 21:5) and reserves for the future (Genesis 41 — Joseph storing grain). "Give, Save, Live" echoes the biblical rhythm of honoring God first (giving), preparing wisely (saving), and providing for daily needs (living). The genius of three buckets is that a tired brain can hold three categories, not thirty.',
      crossRefs: ['Proverbs 21:5', 'Genesis 41:34-36', 'Luke 14:28', 'Proverbs 6:6-8'],
      questions: [
        'Which of your three buckets currently gets ignored — give, save, or live?',
        'What has made past budgets fail for you, and how could three simple buckets be different?',
        'What would "keeping a little oil in the dwelling" look like in your life this month?',
      ],
    },
  },
  {
    week: 4,
    title: 'A Little Set Aside',
    headline: 'The ant teaches the emergency fund.',
    verse: {
      text: 'Go to the ant, thou sluggard; consider her ways, and be wise: ... Provideth her meat in the summer, and gathereth her food in the harvest.',
      reference: 'Proverbs 6:6, 8',
    },
    content: [
      'An emergency fund is a small cushion of money you touch only when life surprises you — a flat tire, a sick day, a broken tooth. It turns a crisis into an inconvenience.',
      'The ant does not panic in winter, because she gathered a little in summer. You do not need thousands to start. A first goal of even a small amount already changes how emergencies feel.',
      'Name a starter number that feels doable, not overwhelming. Small and started beats big and imaginary.',
    ],
    keyTakeaway: 'A small cushion turns a crisis into an inconvenience.',
    affirmation: 'I am gathering a little in advance, and it brings me peace.',
    practicalStep: 'Set a starter emergency-fund goal in the Savings Goals tracker (even a small one).',
    study: {
      context: 'Proverbs 6:6-8 sends the sluggard to watch an ant, who "provideth her meat in the summer" with no commander driving her — she simply prepares in the good season for the lean one. This is the biblical seed of the emergency fund: setting aside a little now so a future surprise does not become a catastrophe. Jesus\' words about not worrying (Matthew 6) are not a contradiction; wise preparation and freedom from anxiety go together. The point is not hoarding out of fear but building a modest buffer out of foresight. For someone who struggles with follow-through, the ant\'s lesson is that consistency in small things, not one heroic effort, is what carries you through winter.',
      crossRefs: ['Proverbs 30:25', 'Genesis 41:35-36', 'Proverbs 21:5', 'Matthew 6:31-33'],
      questions: [
        'What recent "emergency" would have felt smaller if you had a little cushion?',
        'What starter number feels doable rather than overwhelming to you?',
        'Where do you tend to prepare in "summer," and where do you tend to wait until "winter"?',
      ],
    },
  },
  {
    week: 5,
    title: 'Enough Is a Gift',
    headline: 'Contentment quietly defeats comparison.',
    verse: {
      text: 'But godliness with contentment is great gain.',
      reference: '1 Timothy 6:6',
    },
    content: [
      'Comparison is a thief that spends your money for you. The scroll shows you everyone\'s highlight reel, and suddenly what was fine feels like lack. Much of what we buy is bought to soothe that ache.',
      'Paul learned contentment — it was not automatic. He said he had learned, "in whatsoever state I am, therewith to be content." Contentment is a skill God grows in us, and it is worth more than a raise.',
      'You do not have to earn more to feel like enough. Sometimes the fastest way to have more is to want less.',
    ],
    keyTakeaway: 'Contentment is great gain — and it costs nothing to practice.',
    affirmation: 'What God has given me is enough for today, and I am grateful.',
    practicalStep: 'Notice one thing you almost bought to soothe comparison, and pause on it 24 hours.',
    study: {
      context: '1 Timothy 6 warns that the love of money — not money itself — is "the root of all evil" (v.10), and sets contentment against it as "great gain." Paul models this in Philippians 4:11-13, where he says he "learned" contentment in plenty and in want, through Christ who strengthens him. Contentment in Scripture is not passivity or lack of ambition; it is a settled trust that God is enough, which frees us from the endless upgrade cycle that comparison drives. Modern life supercharges comparison, and much impulse spending is really an attempt to medicate the feeling of falling behind. Naming that pattern robs it of its power. Wanting less is a legitimate, biblical wealth-building strategy.',
      crossRefs: ['Philippians 4:11-13', 'Hebrews 13:5', 'Ecclesiastes 5:10', 'Exodus 20:17'],
      questions: [
        'Whose life or feed most tempts you toward comparison spending? What ache is it touching?',
        'When have you bought something to soothe a feeling rather than meet a need?',
        'What would "godliness with contentment" look like in your relationship with money this week?',
      ],
    },
  },
  {
    week: 6,
    title: 'Free From the Weight of Debt',
    headline: 'Owe no one but the debt of love.',
    verse: {
      text: 'The rich ruleth over the poor, and the borrower is servant to the lender.',
      reference: 'Proverbs 22:7',
    },
    content: [
      'Debt is not a moral failure — but it is a weight, and Scripture is honest about that: the borrower becomes servant to the lender. Getting free is less about shame and more about steadily loosening a heavy pack.',
      'Pick the smallest debt first, or the one with the highest interest — either works. Pay minimums on the rest and throw everything extra at the one you chose. When it is gone, roll that payment onto the next. Momentum is the whole secret.',
      'Every payment is a small act of freedom. You are not just paying a bill; you are buying back your future margin.',
    ],
    keyTakeaway: 'Attack one debt at a time — momentum, not perfection.',
    affirmation: 'I am steadily walking toward freedom, one payment at a time.',
    practicalStep: 'List your debts smallest to largest. Circle the first one to attack.',
    study: {
      context: 'Proverbs 22:7 states a plain reality rather than a condemnation: borrowing creates a servant-lender relationship that constrains your freedom. Romans 13:8 lifts the vision higher — "Owe no man any thing, but to love one another." Scripture does not treat every debt as sin, but it consistently frames freedom from debt as a good worth pursuing, because it releases you to give, save, and respond to God\'s leading without a lender\'s claim on you. The practical wisdom of attacking one debt at a time reflects the biblical value of steady diligence over dramatic bursts (Proverbs 13:11 — wealth gathered "by labour shall increase"). Shame paralyzes; a plan mobilizes.',
      crossRefs: ['Romans 13:8', 'Proverbs 13:11', 'Deuteronomy 15:6', 'Luke 7:41-42'],
      questions: [
        'What feelings come up when you look honestly at your debts? Where do you need to trade shame for a plan?',
        'Which debt will you attack first, and why did you choose it?',
        'What freedom are you hoping for on the other side of this?',
      ],
    },
  },
  {
    week: 7,
    title: 'The Open Hand',
    headline: 'Generosity is how we hold money loosely.',
    verse: {
      text: 'God loveth a cheerful giver.',
      reference: '2 Corinthians 9:7',
    },
    content: [
      'Giving comes first in "Give, Save, Live" for a reason: it keeps money from becoming a god. When we give, we prove to our own hearts that we are not owned by what we own.',
      'God does not want grudging, pressured gifts. He loves a cheerful giver — someone who gives from joy, not guilt. Even a small, glad gift breaks money\'s grip more than a large, resentful one.',
      'Generosity is not a reward for the rich; it is a practice for everyone. The open hand receives more freely too.',
    ],
    keyTakeaway: 'Giving keeps money in its place — a tool, not a master.',
    affirmation: 'I give with a glad heart, and my hands stay open.',
    practicalStep: 'Give one small gift this week — cheerfully, not out of guilt.',
    study: {
      context: '2 Corinthians 9:6-8 teaches that giving is meant to flow from a settled heart: "not grudgingly, or of necessity: for God loveth a cheerful giver." The Greek for "cheerful" is the root of our word hilarious — glad, generous, free. Paul promises that God is able to make "all grace abound" so that givers always have "all sufficiency in all things." Giving is spiritually strategic: it loosens money\'s grip on the heart (Matthew 6:21 — where your treasure is, there your heart will be). Notably, Scripture never ties the joy of giving to wealth; the widow\'s two mites (Mark 12) were praised precisely because they were small and wholehearted.',
      crossRefs: ['Mark 12:41-44', 'Malachi 3:10', 'Proverbs 11:24-25', 'Acts 20:35'],
      questions: [
        'When has giving felt joyful versus pressured? What made the difference?',
        'Where might money be quietly gripping your heart, and how could giving loosen it?',
        'What is one small, cheerful gift you could give this week?',
      ],
    },
  },
  {
    week: 8,
    title: 'Saving With a Name',
    headline: 'Goals with a purpose beat willpower.',
    verse: {
      text: 'The thoughts of the diligent tend only to plenteousness.',
      reference: 'Proverbs 21:5',
    },
    content: [
      'Money without a plan tends to evaporate. Money with a named goal tends to stick. "Saving" is vague; "$300 for Christmas" or "car repair fund" is something your brain can actually chase.',
      'Diligent thoughts, Proverbs says, tend toward plenty. That is planning — thinking ahead on purpose. A named goal turns saving from willpower into a game you can win.',
      'Give each goal a name and a number. Watching a bar fill up is far more motivating than a vague sense that you "should save more."',
    ],
    keyTakeaway: 'A named goal sticks where "save more" slips away.',
    affirmation: 'My saving has a purpose, and I can see it growing.',
    practicalStep: 'Add one named savings goal (with a real number) to the Savings Goals tracker.',
    study: {
      context: 'Proverbs 21:5 contrasts the "diligent," whose planning leads to plenty, with the hasty, who rush "only to want." Diligence here is thoughtful, forward-looking intention — the opposite of impulsive scrambling. Naming a savings goal applies this by turning a vague hope into a concrete plan the mind can pursue. Scripture repeatedly honors preparation over spontaneity (Joseph storing grain, the ant gathering, the builder counting the cost in Luke 14:28). For a brain that struggles with abstract, distant rewards, a specific named goal with a visible progress bar externalizes motivation — which is wise stewardship of how God actually made you, not a workaround for weakness.',
      crossRefs: ['Luke 14:28', 'Genesis 41:48-49', 'Proverbs 13:11', 'Proverbs 24:27'],
      questions: [
        'What vague "I should save" has never turned into real saving for you?',
        'What is one goal specific enough to actually chase — with a name and a number?',
        'How does seeing progress (a filling bar) affect your motivation compared to willpower alone?',
      ],
    },
  },
  {
    week: 9,
    title: 'The Pause Before the Purchase',
    headline: 'Naming your spending triggers takes their power.',
    verse: {
      text: 'He that hath no rule over his own spirit is like a city that is broken down, and without walls.',
      reference: 'Proverbs 25:28',
    },
    content: [
      'Impulse spending usually is not about the thing — it is about a feeling. Bored, tired, anxious, celebrating, overwhelmed: each can flip the "buy now" switch before you even notice. This is doubly true for an ADHD brain wired for novelty and quick reward.',
      'A city without walls is defenseless. A simple wall for your money is the pause: a 24-hour wait on anything unplanned, or moving your card out of one-click reach. You are not weak; you are building a wall.',
      'The goal is not to never enjoy anything. It is to make sure you, not the impulse, are the one deciding.',
    ],
    keyTakeaway: 'Build one small "wall" — like a 24-hour pause — around impulse buys.',
    affirmation: 'I can pause. I get to decide, not my impulse.',
    practicalStep: 'Set up one friction wall: unsave a card, or make a 24-hour rule for unplanned buys.',
    study: {
      context: 'Proverbs 25:28 pictures a person with no self-rule as a city "broken down, and without walls" — utterly exposed to whatever comes against it. In the ancient world, walls were survival; a breached wall meant the enemy could enter at will. Applied to money, the "wall" is the intentional friction we build against impulse: a waiting period, removing saved payment methods, a spending plan decided in advance when we are calm. Scripture treats self-control as a fruit of the Spirit (Galatians 5:22-23), meaning it grows with God\'s help, not by white-knuckling alone. Understanding your specific triggers is not self-indulgent analysis — it is knowing the gates your city needs guarded.',
      crossRefs: ['Galatians 5:22-23', '1 Corinthians 6:12', 'Proverbs 21:20', 'Titus 2:11-12'],
      questions: [
        'What feelings most often flip your "buy now" switch — boredom, stress, celebration, overwhelm?',
        'What is one small wall you could build that would slow an impulse just enough?',
        'How does it help to know self-control is a fruit God grows, not something you must force alone?',
      ],
    },
  },
  {
    week: 10,
    title: 'Let the System Carry It',
    headline: 'Automate the good choice so you decide once.',
    verse: {
      text: 'Let all things be done decently and in order.',
      reference: '1 Corinthians 14:40',
    },
    content: [
      'Every money decision costs a little energy, and energy runs out — especially for a tired or ADHD brain. The fix is not more willpower; it is fewer decisions. Set it up once, then let the system carry it.',
      'Automate the good choices: a scheduled transfer to savings the day after payday, autopay on the bills you can trust, a recurring reminder for the ones you cannot. Order, Paul says, is not cold — it frees us.',
      'You are working with how God made you, not against it. A good system is stewardship on autopilot.',
    ],
    keyTakeaway: 'Decide once, automate it, and stop spending energy on it.',
    affirmation: 'I build systems that carry the good choice for me.',
    practicalStep: 'Automate one thing: a savings transfer, one autopay, or one recurring bill reminder.',
    study: {
      context: '1 Corinthians 14:40 — "decently and in order" — comes from Paul\'s instructions for worship, but the principle is broad: God is a God of order, not confusion (v.33), and ordered systems serve people rather than burden them. Decision fatigue is real; each choice draws from a limited reserve, and money involves dozens of small choices daily. Automating good defaults is a way of "setting your house in order" (2 Kings 20:1) so that faithfulness does not depend on remembering or willpower in a weak moment. This is especially gracious for those whose executive function is uneven — the system becomes an external structure that holds the good choice steady, reflecting wisdom rather than compensating for failure.',
      crossRefs: ['1 Corinthians 14:33', 'Proverbs 24:27', 'Nehemiah 2:4-8', 'Proverbs 21:5'],
      questions: [
        'Which money decisions drain you most by having to make them over and over?',
        'What is one good choice you could set up once and let a system carry?',
        'Where have you blamed yourself for "forgetting" when a system would have carried it instead?',
      ],
    },
  },
  {
    week: 11,
    title: 'Room to Breathe',
    headline: 'Margin is space for God and for rest.',
    verse: {
      text: 'And when ye reap the harvest of your land, thou shalt not wholly reap the corners of thy field.',
      reference: 'Leviticus 19:9',
    },
    content: [
      'God told Israel not to harvest the very corners of their fields — to leave margin on purpose, for the poor and the stranger. Margin is the opposite of maxed-out. It is space left over: a little money, a little time, a little room to breathe.',
      'A life with no margin cannot be generous and cannot rest. When every dollar is already spoken for, an emergency becomes a crisis and a nudge from God to give has nowhere to come from.',
      'Building margin is slow and quiet, but it is where peace lives. Aim to spend a little less than you have — even a small gap changes everything.',
    ],
    keyTakeaway: 'Leave margin on purpose — it is where peace and generosity live.',
    affirmation: 'I leave room to breathe, and that room is where peace grows.',
    practicalStep: 'Find one small expense to trim this month and let that gap become your margin.',
    study: {
      context: 'The gleaning laws of Leviticus 19:9-10 commanded farmers to deliberately not maximize — to leave the corners and the fallen grain for the poor and the sojourner (this is the field where Ruth later gleaned). Built into God\'s economy was intentional margin: unharvested space that made room for generosity and dignity. The Sabbath principle carries the same DNA — resting on the seventh day and letting the land rest every seventh year (Leviticus 25) required trusting God enough to not squeeze out every last bit. Financial margin applies this: spending less than you earn leaves room to give, to rest, and to respond to God without panic. A maxed-out life has no corners left for grace.',
      crossRefs: ['Leviticus 25:3-4', 'Ruth 2:2-3', 'Exodus 20:8-10', 'Philippians 4:19'],
      questions: [
        'Where in your finances is every dollar already spoken for, leaving no room to breathe?',
        'What small expense could you trim to create even a little margin?',
        'How might margin change your ability to give, to rest, or to respond to God?',
      ],
    },
  },
  {
    week: 12,
    title: 'The Long Faithfulness',
    headline: 'Small, steady steps become a legacy.',
    verse: {
      text: 'A good man leaveth an inheritance to his children\'s children.',
      reference: 'Proverbs 13:22',
    },
    content: [
      'You have covered the whole rhythm now: caretaking, knowing your numbers, simple budgeting, saving, contentment, freedom from debt, generosity, guarding against impulse, systems, and margin. None of it depends on being rich. It depends on being faithful in small things, over time.',
      'God commends the servant who was "faithful over a few things." Wealth that lasts, Proverbs says, is gathered little by little. A legacy is not built in one heroic month; it is built in a thousand ordinary, unremarkable choices.',
      'If you have missed weeks, you have not failed — you have simply arrived. The whole point of stewardship is that you get to keep beginning again. Start where you are.',
    ],
    keyTakeaway: 'Legacy is built little by little — and you can always begin again.',
    affirmation: 'I am faithful in small things, and God is building something lasting.',
    practicalStep: 'Choose one habit from these weeks to keep, and put it on repeat.',
    study: {
      context: 'Proverbs 13:22 sets a long horizon — an inheritance reaching to grandchildren — while the same chapter notes that wealth "gotten by vanity shall be diminished: but he that gathereth by labour shall increase" (v.11). The biblical picture of lasting provision is slow accumulation through faithful diligence, not a windfall. Jesus\' parable of the talents rewards the servant "faithful over a few things" by making him "ruler over many" (Matthew 25:21) — the emphasis is on faithfulness with whatever you have, however small. This closing lesson reframes the whole course: stewardship is not a test you pass or fail but a relationship you keep returning to. Grace means every missed week is simply an invitation to begin again, which is itself the heart of the gospel.',
      crossRefs: ['Matthew 25:21', 'Proverbs 13:11', 'Luke 16:10', 'Lamentations 3:22-23'],
      questions: [
        'Looking back over these weeks, which lesson landed most deeply for you?',
        'What one habit do you most want to keep and put on repeat?',
        'Where do you need to hear that a missed week is not failure but an invitation to begin again?',
      ],
    },
  },
];

export function getFinanceLesson(week) {
  return FINANCE_LESSONS.find(l => l.week === week) || null;
}
