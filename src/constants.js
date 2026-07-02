/* ═══════════════════════════════════════════════════
   FONTS
═══════════════════════════════════════════════════ */
export const GFONTS = `@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400;1,600&family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,700;1,400;1,700&display=swap');`;

/* ═══════════════════════════════════════════════════
   BRAND PALETTE
═══════════════════════════════════════════════════ */
export const B = {
  beige:"#F5F1EA", beigeD:"#EDE8DF", pink:"#F4E8E5", pinkD:"#E8C8C0",
  sage:"#BED3C4", sageD:"#9AB8A4", sageDk:"#5A8A6A",
  night:"#1A1612", nightM:"#241E18", gold:"#C9A96E", goldL:"#E8D4A0",
  ink:"#2A2420", inkM:"#5A4A42", inkL:"#8A7A70", inkLL:"#B0A098",
  white:"#FDFAF6",
};
export const SERIF   = "'Cormorant Garamond','Georgia',serif";
export const SANS    = "'DM Sans','Helvetica Neue',sans-serif";
export const DISPLAY = "'Playfair Display','Georgia',serif";

/* ═══════════════════════════════════════════════════
   NAVIGATION MODE
   AVATAR_NAV=false → tap/finger-pan navigation, no walking
   avatar, no joystick (the current app default).
   Flip to true to restore the original walkable avatar +
   virtual joystick everywhere (code is preserved/dormant).
═══════════════════════════════════════════════════ */
export const AVATAR_NAV = false;

/* ═══════════════════════════════════════════════════
   PORCH BLOG — OWNER ACCOUNT
   Only this Google account can write/edit/delete blog posts
   (the porch board is public to read). Gated by the owner's
   verified email so no UID lookup is needed.

   The same email is enforced server-side in firestore.rules
   (request.auth.token.email). Keep the two in sync.
═══════════════════════════════════════════════════ */
export const BLOG_OWNER_EMAIL = "heathereaton7@gmail.com";
export const isBlogOwner = (user) =>
  !!user &&
  user.emailVerified === true &&
  typeof user.email === "string" &&
  user.email.toLowerCase() === BLOG_OWNER_EMAIL.toLowerCase();

/* ═══════════════════════════════════════════════════
   ROOM THEMES
═══════════════════════════════════════════════════ */
export const RT = {
  fear:      {bg:"#1A1612",card:"#241E18",border:"rgba(155,130,180,0.25)",accent:"#9A8AAA",text:"#E8E0F0",sub:"rgba(232,224,240,0.5)",glow:"rgba(155,130,180,0.1)"},
  control:   {bg:"#12201A",card:"#182818",border:"rgba(90,138,106,0.25)",accent:B.sageDk,text:"#E0F0E8",sub:"rgba(224,240,232,0.5)",glow:"rgba(90,138,106,0.1)"},
  beliefs:   {bg:"#1E1508",card:"#281E0A",border:"rgba(196,132,58,0.25)",accent:"#C4843A",text:"#F5EDD0",sub:"rgba(245,237,208,0.5)",glow:"rgba(196,132,58,0.1)"},
  avoidance: {bg:"#101820",card:"#162030",border:"rgba(100,150,200,0.25)",accent:"#5A9AB8",text:"#D8EEFF",sub:"rgba(216,238,255,0.5)",glow:"rgba(100,150,200,0.1)"},
  release:   {bg:"#101A10",card:"#182818",border:"rgba(100,170,100,0.25)",accent:"#6AAA6A",text:"#E0F5E0",sub:"rgba(224,245,224,0.5)",glow:"rgba(100,170,100,0.1)"},
  desire:    {bg:"#1E1412",card:"#281E18",border:"rgba(200,164,106,0.25)",accent:"#C8A46A",text:"#F8EDD8",sub:"rgba(248,237,216,0.5)",glow:"rgba(200,164,106,0.1)"},
  trust:     {bg:"#101A14",card:"#162018",border:"rgba(90,140,120,0.25)",accent:"#5A9478",text:"#DDF0E8",sub:"rgba(221,240,232,0.5)",glow:"rgba(90,140,120,0.1)"},
  divorce:   {bg:"#2C1F3A",card:"rgba(44,31,58,0.97)",border:"rgba(190,160,210,0.3)",accent:"#C490D0",text:"#F0E4F8",sub:"rgba(240,228,248,0.5)",glow:"rgba(180,140,200,0.12)"},
  singleness:{bg:"#0A1628",card:"rgba(14,26,48,0.97)",border:"rgba(100,160,220,0.3)",accent:"#64A0DC",text:"#D8EEFF",sub:"rgba(216,238,255,0.5)",glow:"rgba(100,160,220,0.12)"},
  waiting:   {bg:"linear-gradient(160deg,#F5E8D0,#E8D0B8)",card:"rgba(255,248,235,0.95)",border:"rgba(200,164,106,0.3)",accent:"#B8843A",text:"#3A2810",sub:"rgba(58,40,16,0.5)",glow:"rgba(200,164,106,0.15)",light:true},
  motherhood:{bg:"linear-gradient(160deg,#FAF0F5,#F0E0EE)",card:"rgba(255,248,252,0.96)",border:"rgba(220,170,190,0.3)",accent:"#C87090",text:"#3A1828",sub:"rgba(58,24,40,0.45)",glow:"rgba(220,170,190,0.15)",light:true},
  depression:{bg:"#181C24",card:"rgba(28,32,44,0.97)",border:"rgba(120,150,200,0.25)",accent:"#7890C8",text:"#D8E4F8",sub:"rgba(216,228,248,0.5)",glow:"rgba(120,150,200,0.1)"},
  men:       {bg:"linear-gradient(160deg,#1A1E14,#1E2418)",card:"rgba(28,34,22,0.97)",border:"rgba(120,160,90,0.3)",accent:"#88A850",text:"#E8F0D8",sub:"rgba(232,240,216,0.5)",glow:"rgba(120,160,90,0.12)"},
  jesus:     {bg:"linear-gradient(160deg,#1A1208,#2A1E08)",card:"rgba(40,28,8,0.97)",border:"rgba(210,180,100,0.3)",accent:"#D4B464",text:"#FFF8E8",sub:"rgba(255,248,232,0.5)",glow:"rgba(210,180,100,0.15)"},
  locked:    {bg:"#0A0808",card:"#160E08",border:"rgba(201,169,110,0.3)",accent:B.gold,text:"#FFF8E8",sub:"rgba(255,248,232,0.5)",glow:"rgba(201,169,110,0.12)"},
  viral:     {bg:B.beige,card:B.white,border:B.beigeD,accent:B.sageDk,text:B.ink,sub:B.inkL,glow:"transparent"},
};
export const th = id => RT[id] || RT.fear;

/* ═══════════════════════════════════════════════════
   ROOM DATA
═══════════════════════════════════════════════════ */
export const REFLECTION_ROOMS = [
  {id:"fear",      label:"Fear",      emoji:"🕯️",tag:"Reflection", question:"What are you afraid of right now?",
   days:[{q:"What is worrying you most right now?",hint:"No wrong answer."},{q:"What are you afraid will happen if this doesn't resolve?",hint:"Go beneath the surface."},{q:"What belief about yourself or God might be underneath that fear?",hint:"This is the root."},{q:"What would trusting God with this fear look like today?",hint:"One small act of trust."}]},
  {id:"control",   label:"Control",   emoji:"⚖️",tag:"Reflection", question:"What are you trying to control?",
   days:[{q:"What situation are you trying to control right now?",hint:"Name it plainly."},{q:"What are you afraid will happen if you let go?",hint:"The fear behind the grip."},{q:"Where does this need to control come from in you?",hint:"A wound? A belief?"},{q:"What would surrendering this area with faith look like?",hint:"Surrender is the hardest trust."}]},
  {id:"beliefs",   label:"Beliefs",   emoji:"🪞",tag:"Reflection", question:"What are you believing that might not be true?",
   days:[{q:"What story are you telling yourself about your situation?",hint:"Just notice — don't defend."},{q:"Where did this belief come from?",hint:"Inherited beliefs aren't always true."},{q:"What would it mean if this belief were false?",hint:"We hold beliefs out of fear."},{q:"What truth could replace the lie?",hint:"Write it even if it doesn't feel real."}]},
  {id:"avoidance", label:"Avoidance", emoji:"🚪",tag:"Reflection", question:"What are you avoiding?",
   days:[{q:"What conversation or decision have you been putting off?",hint:"Just name it."},{q:"What are you afraid will happen if you stop avoiding it?",hint:"What is the avoidance protecting?"},{q:"What has this avoidance already cost you?",hint:"Avoidance always has a price."},{q:"What is one small step toward this today?",hint:"Move one inch closer."}]},
  {id:"release",   label:"Release",   emoji:"🍃",tag:"Reflection", question:"What are you holding onto that needs releasing?",
   days:[{q:"What are you holding onto — a grudge, grief, an expectation?",hint:"Name it specifically."},{q:"Why is it so hard to let this go?",hint:"What does holding it give you?"},{q:"What would your life look like if this were released?",hint:"Let yourself imagine it."},{q:"Are you ready to release it?",hint:"Readiness means choosing, not feeling."}]},
  {id:"desire",    label:"Desire",    emoji:"✦", tag:"Reflection", question:"What does your heart actually want?",
   days:[{q:"Remove all 'should' — what does your heart actually want?",hint:"Desire isn't dangerous."},{q:"Are you allowing yourself to want this? Why or why not?",hint:"Many have learned to suppress desire."},{q:"Is this desire pointing toward something true?",hint:"Some desires are invitations."},{q:"How might God be involved in this desire?",hint:"Desire and calling are often neighbors."}]},
  {id:"trust",     label:"Trust",     emoji:"🌿",tag:"Reflection", question:"What is God inviting you to trust Him with?",
   days:[{q:"In what area does trust feel hardest right now?",hint:"Trust is hardest where it matters most."},{q:"What has made trust difficult here?",hint:"Understanding the wound helps."},{q:"What would full trust look like — concretely?",hint:"Not a feeling. An actual posture."},{q:"What is one act of trust you could take today?",hint:"Small acts compound into deep faith."}]},
  /* ── Heather's Story — companion reflections for the video series ── */
  {id:"story-part-1", label:"Heather's Story — Part 1", emoji:"🌄", tag:"Reflection", question:"What is God asking you to leave behind to follow Him?",
   days:[
     {q:"What is something you've been holding onto that God may be asking you to release?",hint:"Possessions, comfort, an old identity — name it plainly."},
     {q:"Where has your sense of worth been tied to things that can be taken away?",hint:"A relationship, a role, an achievement."},
     {q:"When have you felt God leading you somewhere unfamiliar — and how did you respond?",hint:"Following Him often feels like running before it feels like peace."},
     {q:"What old belief about yourself is God rewriting in this season?",hint:"The lie you've believed vs. the truth He speaks over you."},
     {q:"What would it look like to become a little more like Jesus this week?",hint:"One concrete way — not someday, but now."},
   ]},
  {id:"story-part-2", label:"Heather's Story — Part 2", emoji:"🕊️", tag:"Reflection", question:"When everything falls apart, where do you find God?",
   days:[
     {q:"What part of your life feels like it's falling apart right now?",hint:"Say it plainly — this is a safe place."},
     {q:"Where have you seen God show up, even in the middle of the breaking?",hint:"Look for the small mercies you almost missed."},
     {q:"What 'wrong turn' are you tempted to define yourself by?",hint:"A choice, a season, a relationship — He isn't finished with you."},
     {q:"How do you hold onto faith when the hard thing doesn't go away?",hint:"Faith isn't the absence of pain."},
     {q:"What would it look like to trust that God is still writing your story?",hint:"The breakdown is not the final chapter."},
   ]},
];

export const COMMUNITY_ROOMS = [
  {id:"divorce",    label:"Divorce & Separation",   emoji:"🌙",tag:"Community", question:"Finding peace when your world breaks apart.",
   description:"A safe space for those walking through divorce. You are not alone.",
   themes:["divorce","separation","grief","identity","starting over","healing"],
   days:[{q:"What part of this season has been hardest to talk about?",hint:"This room is safe."},{q:"What has this loss taught you about yourself?",hint:"Loss can be a strange teacher."},{q:"What does healing actually look like for you — the real version?",hint:"Be specific."},{q:"What would you tell someone just entering this season?",hint:"Your story has wisdom."}]},
  {id:"singleness", label:"Singleness & Waiting",   emoji:"⭐",tag:"Community", question:"Learning to be whole in the waiting.",
   description:"For those navigating singleness — whether peaceful, painful, or both.",
   themes:["singleness","contentment","loneliness","purpose","waiting"],
   days:[{q:"What does your singleness reveal about what you're believing about yourself?",hint:"The season reveals what noise hides."},{q:"Where have you confused 'waiting' with 'on hold'?",hint:"They are not the same."},{q:"What would a deeply fulfilling single life look like for you?",hint:"Design it honestly."},{q:"What is God forming in you that could only happen here?",hint:"This is not wasted time."}]},
  {id:"waiting",    label:"Preparing for a Spouse", emoji:"🌅",tag:"Community", question:"Becoming who you're asking God to send.",
   description:"Not just waiting — preparing. Doing the inner work to be ready.",
   themes:["preparation","healing","wholeness","prayer","readiness"],
   days:[{q:"What wounds from your past need healing before your next relationship begins?",hint:"Unhealed wounds become future arguments."},{q:"What kind of person are you becoming — and would they attract what you're asking for?",hint:"Be honest."},{q:"What non-negotiables have you never spoken out loud?",hint:"They matter."},{q:"What does your prayer life look like around this area?",hint:"Where we pray reveals what we trust."}]},
  {id:"motherhood", label:"Motherhood",              emoji:"🌸",tag:"Community", question:"The holy exhaustion of raising souls.",
   description:"For mothers in every season — new, overwhelmed, empty-nested, or in between.",
   themes:["motherhood","exhaustion","identity","grace","self-care"],
   days:[{q:"What part of motherhood has surprised you most — and not in a good way?",hint:"Hard truths need air too."},{q:"Where do you most need grace for yourself right now?",hint:"You cannot pour from empty."},{q:"What does your child see when they look at you — and what do you wish they saw?",hint:"This is invitation, not shame."},{q:"What would you tell the version of yourself who first became a mother?",hint:"She needs your compassion."}]},
  {id:"depression",  label:"Depression & Grief",     emoji:"🌊",tag:"Community", question:"You are not your darkness. You are not alone.",
   description:"A gentle room for those carrying heaviness. Not a substitute for professional care.",
   themes:["depression","grief","anxiety","hopelessness","healing","numbness"],
   days:[{q:"If your depression had a voice, what would it tell you about yourself?",hint:"Name it so you can examine it."},{q:"What does the word 'hope' actually feel like right now?",hint:"Honesty is the beginning."},{q:"When was the last time you felt something close to peace?",hint:"Even small clues matter."},{q:"What do you need from God that you haven't been able to ask for?",hint:"He can handle the honest version."}]},
  {id:"men",         label:"Men's Room",             emoji:"🪵",tag:"Community", question:"The questions men aren't supposed to ask.",
   description:"A cabin space for men to reflect honestly. No performance required.",
   themes:["masculinity","purpose","failure","identity","fatherhood","loneliness"],
   days:[{q:"What are you carrying right now that you haven't told anyone?",hint:"This room doesn't judge."},{q:"Where have you confused strength with silence?",hint:"Carrying alone isn't strength."},{q:"What does it mean to you to be a man — and where did that come from?",hint:"Many definitions were given, not chosen."},{q:"What would it look like to lead from wholeness instead of wounds?",hint:"Worth sitting with."}]},
];

export const LOCKED_ROOM = {
  id:"locked",label:"The Locked Room",emoji:"🗝️",tag:"Hidden",question:"The question most people never face.",
  description:"Unlocked after 7 days. These are the questions underneath every other question.",
  days:[
    {q:"If your life ended today, what would you most regret not saying, doing, or becoming?",hint:"Feel the weight of this."},
    {q:"What is the one thing you know God is asking of you — that you haven't said yes to?",hint:"You already know what it is."},
    {q:"What would your fully surrendered life look like? And what's stopping you?",hint:"The question underneath every other question."},
  ]
};

export const JESUS_QUESTIONS = [
  {ref:"John 5:6",      q:"Do you want to get well?",                                                           app:"Are you actually willing to change — or have you become comfortable in your struggle?"},
  {ref:"Matthew 16:15", q:"Who do you say I am?",                                                              app:"Not who culture says, not who your church says — who do *you* say Jesus is?"},
  {ref:"Matthew 6:27",  q:"Can any one of you by worrying add a single hour to your life?",                    app:"What are you worrying about that is outside your control today?"},
  {ref:"Luke 6:46",     q:"Why do you call me 'Lord, Lord,' and do not do what I say?",                        app:"Where is there a gap between what you believe and how you're actually living?"},
  {ref:"Mark 10:36",    q:"What do you want me to do for you?",                                                app:"If Jesus asked you this today — what would your honest answer be?"},
  {ref:"John 11:26",    q:"Do you believe this?",                                                              app:"The thing you say you believe — do you actually believe it in this moment?"},
  {ref:"Matthew 16:26", q:"What good will it be for someone to gain the whole world, yet forfeit their soul?", app:"What are you trading your inner life for right now?"},
  {ref:"John 21:17",    q:"Do you love me?",                                                                   app:"Beyond your words and habits — how would you describe your love for God right now?"},
  {ref:"Matthew 5:46",  q:"If you love those who love you, what reward will you get?",                         app:"Who in your life is hardest to love — and what is God asking of you toward them?"},
  {ref:"Matthew 26:40", q:"Couldn't you keep watch with me for one hour?",                                     app:"What does your prayer life reveal about your capacity to be present with God?"},
  {ref:"John 18:34",    q:"Is that your own idea, or did others tell you that about me?",                      app:"What beliefs about God have you inherited but never examined for yourself?"},
  {ref:"Luke 18:8",     q:"When the Son of Man comes, will he find faith on the earth?",                       app:"What does your faith actually look like in practice, not in theory?"},
  {ref:"John 20:15",    q:"Why are you crying? Who is it you are looking for?",                                app:"What are you grieving, and who or what are you really searching for?"},
  {ref:"Matthew 9:28",  q:"Do you believe that I am able to do this?",                                         app:"In this specific situation — do you actually believe God can move?"},
  {ref:"Luke 9:25",     q:"What good is it to gain the whole world, and yet lose or forfeit your very self?",  app:"What version of 'success' might actually cost you your soul?"},
];

/* ═══════════════════════════════════════════════════
   CARD ENGINE DATA
═══════════════════════════════════════════════════ */
export const QUESTION_SETS = {
  truth:    {label:"Truth",         emoji:"🪞",color:"#9A8AAA",questions:["What are you pretending not to know?","What truth about yourself are you avoiding?","What would change if you told the truth?","What are you afraid would happen if you were fully honest?","What story are you telling yourself that isn't true?","Where are you lying to yourself to stay comfortable?"]},
  fear:     {label:"Fear",          emoji:"🕯️",color:"#7A9AB8",questions:["What fear is quietly shaping your decisions?","What would you attempt if you knew you couldn't fail?","If fear disappeared tomorrow, what would you do first?","What are you protecting yourself from — and at what cost?","What would you do if no one was watching?","What's the worst that could actually happen — and could you survive it?"]},
  desire:   {label:"Desire",        emoji:"✦", color:"#C4A46A",questions:["What does your heart actually want?","What are you longing for that you haven't admitted yet?","What would a life you truly loved look like?","What are you settling for instead of what you want?","What dream have you quietly given up on?","What do you want that you feel you're not allowed to want?"]},
  identity: {label:"Identity",      emoji:"🌿",color:"#6A9478",questions:["Who are you when no one is watching?","What are you trying to prove, and to whom?","What are you still waiting for permission to do?","Whose voice are you still listening to that you should have let go?","What version of yourself have you abandoned?","What chapter of your story needs to end?"]},
  faith:    {label:"Faith",         emoji:"🌾",color:"#D4B464",questions:["What is God inviting you to trust Him with?","Where do you need to surrender control?","What are you believing about God that might not be true?","What would fully trusting God actually look like?","What is God asking of you that you keep saying no to?","What would you do if you truly believed God was for you?"]},
  healing:  {label:"Healing",       emoji:"🍃",color:"#8AAA7A",questions:["What are you holding onto that is holding you back?","What would your life look like if this wound were healed?","What do you need to forgive yourself for?","What pain have you normalized that deserves attention?","What would you tell the younger version of yourself?","What are you ready to release?"]},
  relations:{label:"Relationships", emoji:"🌸",color:"#C4848A",questions:["What conversation have you been avoiding?","Who deserves more of your honesty?","What pattern in your relationships keeps repeating?","Who are you performing for instead of being real with?","What boundary do you need to set that you keep putting off?","What relationship in your life needs the most attention right now?"]},
};
export const ALL_CARD_QS = Object.values(QUESTION_SETS).flatMap(s => s.questions);

export const CARD_THEMES = [
  {id:"midnight", label:"Midnight",    preview:"linear-gradient(135deg,#1A1612,#2A1E18)", bg:"linear-gradient(135deg,#1A1612 0%,#2A1E18 50%,#1A1612 100%)", text:"#E8D4A0",sub:"rgba(232,212,160,0.45)",brand:"rgba(201,169,110,0.7)",dot:B.gold,fontType:"serif"},
  {id:"parchment",label:"Parchment",   preview:"linear-gradient(135deg,#F5F0E8,#EDE5D5)", bg:"linear-gradient(135deg,#F5F0E8 0%,#EDE5D5 50%,#F0EBE0 100%)", text:"#2A2018",sub:"rgba(42,32,24,0.45)",brand:"rgba(90,138,106,0.8)",dot:B.sageDk,fontType:"serif"},
  {id:"sage",     label:"Sage",        preview:"linear-gradient(135deg,#2A3828,#3A4A38)", bg:"linear-gradient(135deg,#2A3828 0%,#3A4A38 50%,#2E3E2C 100%)", text:"#E8F2E4",sub:"rgba(232,242,228,0.45)",brand:"rgba(190,211,196,0.8)",dot:B.sage,fontType:"serif"},
  {id:"blush",    label:"Blush",       preview:"linear-gradient(135deg,#3A1820,#4A2430)", bg:"linear-gradient(135deg,#3A1820 0%,#4A2430 50%,#3E1C28 100%)", text:"#F8E8EE",sub:"rgba(248,232,238,0.45)",brand:"rgba(232,200,192,0.8)",dot:B.pinkD,fontType:"serif"},
  {id:"dawn",     label:"Golden Dawn", preview:"linear-gradient(160deg,#2A1E08,#4A3418)", bg:"linear-gradient(160deg,#2A1E08 0%,#3A2A10 40%,#4A3418 100%)", text:"#FFF4D8",sub:"rgba(255,244,216,0.45)",brand:"rgba(212,180,100,0.8)",dot:"#D4B464",fontType:"display"},
  {id:"coastal",  label:"Coastal",     preview:"linear-gradient(160deg,#0A1828,#0E2030)", bg:"linear-gradient(160deg,#0A1828 0%,#122238 40%,#0E2030 100%)", text:"#D8EEFF",sub:"rgba(216,238,255,0.45)",brand:"rgba(100,160,220,0.8)",dot:"#64A0DC",fontType:"sans"},
  {id:"cloud",    label:"Cloud",       preview:"linear-gradient(135deg,#F0F4F8,#EFF5FB)", bg:"linear-gradient(135deg,#F0F4F8 0%,#E8EFF6 50%,#EFF5FB 100%)", text:"#1E2A3A",sub:"rgba(30,42,58,0.4)",brand:"rgba(80,120,180,0.7)",dot:"#5078B4",fontType:"sans"},
  {id:"forest",   label:"Forest",      preview:"linear-gradient(135deg,#0A1A0E,#122018)", bg:"linear-gradient(135deg,#0A1A0E 0%,#122018 50%,#0E1A12 100%)", text:"#D8F0E4",sub:"rgba(216,240,228,0.4)",brand:"rgba(140,200,160,0.7)",dot:"#8CC8A0",fontType:"serif"},
];

export const CARD_RATIOS = [
  {id:"square",label:"Square",  w:1080,h:1080,desc:"Instagram Post",  icon:"⬜"},
  {id:"story", label:"Story",   w:1080,h:1920,desc:"Story / TikTok",  icon:"📱"},
  {id:"wide",  label:"Wide",    w:1200,h:628, desc:"Twitter/LinkedIn",icon:"🖥️"},
];

export const VERSE_THEMES = [
  {id:"candlelight",label:"Candlelight",preview:"linear-gradient(135deg,#12101A,#1E1828)",bg:"linear-gradient(135deg,#12101A 0%,#1E1828 50%,#14111E 100%)",text:"#E8D4A0",sub:"rgba(200,190,230,0.40)",brand:"rgba(201,169,110,0.7)",dot:"#C9A96E",fontType:"serif"},
  {id:"parchment",label:"Parchment",preview:"linear-gradient(135deg,#F5F0E8,#EDE5D5)",bg:"linear-gradient(135deg,#F5F0E8 0%,#EDE5D5 50%,#F0EBE0 100%)",text:"#2A2018",sub:"rgba(42,32,24,0.45)",brand:"rgba(90,138,106,0.8)",dot:"#5A8A6A",fontType:"serif"},
  {id:"midnight",label:"Midnight",preview:"linear-gradient(135deg,#0A0818,#1A1232)",bg:"linear-gradient(135deg,#0A0818 0%,#1A1232 50%,#0E0B1E 100%)",text:"#D8C8F0",sub:"rgba(200,190,230,0.40)",brand:"rgba(180,160,210,0.7)",dot:"#B4A0D2",fontType:"display"},
  {id:"dawn",label:"Golden Dawn",preview:"linear-gradient(160deg,#2A1E08,#4A3418)",bg:"linear-gradient(160deg,#2A1E08 0%,#3A2A10 40%,#4A3418 100%)",text:"#FFF4D8",sub:"rgba(255,244,216,0.45)",brand:"rgba(212,180,100,0.8)",dot:"#D4B464",fontType:"display"},
  {id:"sage",label:"Sage",preview:"linear-gradient(135deg,#2A3828,#3A4A38)",bg:"linear-gradient(135deg,#2A3828 0%,#3A4A38 50%,#2E3E2C 100%)",text:"#E8F2E4",sub:"rgba(232,242,228,0.45)",brand:"rgba(190,211,196,0.8)",dot:"#BED3C4",fontType:"serif"},
];

export const VIRAL_QS = [
  "What are you pretending not to know?","What are you afraid would change if you were fully honest?",
  "What are you trying to prove, and to whom?","What truth about yourself are you avoiding?",
  "If fear disappeared tomorrow, what would you do?","Who would you be if no one was watching?",
  "What are you still waiting for permission to do?","What chapter of your story needs to end?",
];

export const SAMPLE_PRAYERS = [
  {id:"p1",date:"2026-03-04",text:"Going through a divorce and feeling completely lost. Please pray that God reminds me who I am in Him.",tag:"Healing",prayers:14},
  {id:"p2",date:"2026-03-04",text:"Single and struggling with loneliness. Please just pray that I feel seen today.",tag:"Singleness",prayers:22},
  {id:"p3",date:"2026-03-03",text:"New mom and drowning. Praying for strength and the ability to extend grace to myself.",tag:"Motherhood",prayers:31},
  {id:"p4",date:"2026-03-02",text:"Believing God for a spouse. Some days the wait feels impossible. Asking for peace in this season.",tag:"Waiting",prayers:18},
];

/* ═══════════════════════════════════════════════════
   BOOKSHELF — SPIRITUAL BOOKS
═══════════════════════════════════════════════════ */
export const SHELF_BOOKS = [
  {id:"journal",  label:"Reflection Journal", emoji:"📖"},
  {id:"bible",    label:"Scripture",          emoji:"✝️"},
  {id:"prayers",  label:"Prayers",            emoji:"🙏"},
  {id:"gratitude",label:"Gratitude",          emoji:"🌿"},
  {id:"dreams",   label:"Dreams",             emoji:"✨"},
  {id:"prophecy", label:"Prophecy & Words",   emoji:"🕊️"},
  {id:"becoming-her", label:"Becoming Her",    emoji:"🌸"},
];
/* Book cover colors for the floating shelf books */
export const BOOK_COVERS = {
  journal:  {bg:"linear-gradient(160deg,#5C3D2E,#3D2818)",accent:"#C9A96E"},
  bible:    {bg:"linear-gradient(160deg,#2E1E3D,#1E1028)",accent:"#B8A0D0"},
  prayers:  {bg:"linear-gradient(160deg,#1E3D2E,#122818)",accent:"#8AC8A0"},
  gratitude:{bg:"linear-gradient(160deg,#3D3D1E,#282810)",accent:"#D4C87A"},
  dreams:   {bg:"linear-gradient(160deg,#1E2E3D,#101828)",accent:"#7AB8D8"},
  prophecy:      {bg:"linear-gradient(160deg,#3D1E2E,#281018)",accent:"#D490C0"},
  'becoming-her':{bg:"linear-gradient(160deg,#3D2E28,#2A1E18)",accent:"#D4A0A0"},
};

export const BOOK_CONTENT = {
  bible:{
    cover:{title:"Scripture & Meditation",subtitle:"Sit with the questions Jesus asked."},
    pages:[
      {title:"John 5:6",prompt:"Do you want to get well?",hint:"Are you actually willing to change — or have you become comfortable in your struggle?"},
      {title:"Matthew 16:15",prompt:"Who do you say I am?",hint:"Not who culture says, not who your church says — who do you say Jesus is?"},
      {title:"Mark 10:36",prompt:"What do you want me to do for you?",hint:"If Jesus asked you this today — what would your honest answer be?"},
      {title:"John 11:26",prompt:"Do you believe this?",hint:"The thing you say you believe — do you actually believe it in this moment?"},
      {title:"Matthew 16:26",prompt:"What good will it be to gain the whole world, yet forfeit your soul?",hint:"What are you trading your inner life for right now?"},
      {title:"John 21:17",prompt:"Do you love me?",hint:"Beyond your words and habits — how would you describe your love for God right now?"},
      {title:"John 20:15",prompt:"Why are you crying? Who is it you are looking for?",hint:"What are you grieving, and who or what are you really searching for?"},
    ],
  },
  prayers:{
    cover:{title:"Prayer Journal",subtitle:"Pour your heart out. He is listening."},
    pages:[
      {title:"Gratitude Prayer",prompt:"What are you thankful for today?",hint:"Start with the smallest blessings."},
      {title:"Intercession",prompt:"Who needs your prayers right now?",hint:"Name them. Hold them before God."},
      {title:"Confession",prompt:"What do you need to lay down?",hint:"Grace meets honesty."},
      {title:"Petition",prompt:"What are you asking God for?",hint:"Ask boldly."},
      {title:"Listening",prompt:"What is God saying to you today?",hint:"Be still. Wait. Write what comes."},
    ],
  },
  gratitude:{
    cover:{title:"Gratitude Journal",subtitle:"Enter His gates with thanksgiving — gratitude is the doorway in."},
    pages:[
      {title:"The Answered Prayer You're In",prompt:"What is one prayer you are already living inside of right now?",hint:"The child, the home, the marriage, the very thing you once begged God for. Naming it reminds you He is a God who answers."},
      {title:"Enter His Gates",prompt:"Before you ask God for anything today, what will you thank Him for first?",hint:"Philippians 4:6 — with thanksgiving, then let your requests be made known. Thanksgiving comes first; it opens the door."},
      {title:"One Specific Grace",prompt:"Name one specific gift from today — and let yourself feel the weight of it.",hint:"Not a long list. One thing, felt deeply. Gratitude is a switch God built into you, not a checklist to rush through."},
      {title:"The Scarcity Lens",prompt:"Where have you been scanning for lack instead of looking for provision?",hint:"A worried mind filters out the very answers in front of it. Name the fear here, then hand it back to God."},
      {title:"Eyes to See",prompt:"What good has been quietly present lately that you almost walked past?",hint:"Your mind only shows you what you tell it matters. Tell it to notice grace — and it will start finding more."},
    ],
  },
  dreams:{
    cover:{title:"Dream Journal",subtitle:"God speaks in the night. Capture what you see."},
    pages:[
      {title:"The Dream",prompt:"What did you dream last night?",hint:"Write everything you remember — even fragments."},
      {title:"Symbols & Themes",prompt:"What images, symbols, or themes stood out?",hint:"Colors, people, places, feelings."},
      {title:"Interpretation",prompt:"What might God be saying through this dream?",hint:"Ask the Holy Spirit to reveal the meaning."},
      {title:"Emotions",prompt:"What emotions did you feel during and after the dream?",hint:"Emotions are signposts."},
    ],
  },
  prophecy:{
    cover:{title:"Prophecy & Words",subtitle:"Record what the Spirit speaks. Hold fast to the good."},
    pages:[
      {title:"What I Am Hearing",prompt:"What words or impressions have you received from God?",hint:"Write it down before you forget."},
      {title:"Scripture Confirmation",prompt:"What Scripture is confirming what you are hearing?",hint:"God's voice never contradicts His Word."},
      {title:"Recurring Themes",prompt:"What themes keep coming up in your prayer life?",hint:"Patterns often reveal purpose."},
      {title:"What God is Confirming",prompt:"What is God making clearer over time?",hint:"He confirms through multiple witnesses."},
    ],
  },
};

export function getBookPageCount(bookType, section){
  if(bookType==="journal"){
    if(!section) return 2; // cover + TOC
    if(section==="blank") return 4; // cover + TOC + history + write
    if(section==="rooms") return REFLECTION_ROOMS.length+6; // cover + TOC + entries + 7 rooms + jesus + locked + daily
    if(section==="dreams") return 3+(BOOK_CONTENT.dreams?.pages.length||4); // cover + TOC + history + prompts
    if(section==="prayers") return 4; // cover + TOC + history + write
    if(section==="bible-notes") return 3; // cover + TOC + notes list
  }
  const bc=BOOK_CONTENT[bookType];
  return bc? bc.pages.length+1 : 12;
}

/* ═══════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════ */
export function todayStr(){ return new Date().toISOString().slice(0,10); }
export function nowTime(){ return new Date().toLocaleTimeString([],{hour:'numeric',minute:'2-digit'}); }
export function entryTime(e){ if(e.time) return e.time; const ts=parseInt(e.id); if(!ts||isNaN(ts)) return ""; return new Date(ts).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'}); }
export function isoDate(d){ return d.toISOString().slice(0,10); }
export function getWeekStart(){ const d=new Date(); const day=d.getDay(); d.setDate(d.getDate()-(day===0?6:day-1)); return d.toISOString().slice(0,10); }
export function wc(t){ return t.trim().split(/\s+/).filter(Boolean).length; }
export function shuffle(a){ return [...a].sort(()=>Math.random()-.5); }

export const THEME_WORDS={fear:["fear","afraid","scared","anxious","worry"],control:["control","manage","grip","force","fix"],trust:["trust","faith","believe","rely","surrender"],identity:["worth","value","enough","belong","purpose"],release:["release","let go","forgive","grief","heal"],desire:["want","desire","long","dream","hope"],relationships:["relationship","family","love","connection","hurt"]};
export function aggregateThemes(entries){
  const t={};
  entries.forEach(e=>{Object.entries(THEME_WORDS).forEach(([k,ws])=>{const c=ws.filter(w=>e.text.toLowerCase().includes(w)).length;t[k]=(t[k]||0)+c;});});
  const sum=Object.values(t).reduce((a,b)=>a+b,0)||1;
  return Object.entries(t).map(([k,v])=>({theme:k,count:v,pct:Math.round(v/sum*100)})).sort((a,b)=>b.count-a.count);
}

/* ═══════════════════════════════════════════════════
   GROWTH INSIGHTS — KEYWORD DICTIONARIES
═══════════════════════════════════════════════════ */
export const EMOTION_WORDS={
  joy:["joy","joyful","happy","happiness","glad","delight","cheerful","elated","excited","blessed"],
  peace:["peace","peaceful","calm","rest","still","quiet","serene","tranquil","centered","settled"],
  anxiety:["anxiety","anxious","worry","worried","nervous","stressed","overwhelmed","panic","dread","uneasy"],
  fear:["fear","afraid","scared","terrified","frightened","timid","paralyzed","helpless","threatened","insecure"],
  anger:["anger","angry","frustrated","furious","irritated","resentful","bitter","enraged","mad","hostile"],
  gratitude:["grateful","thankful","gratitude","appreciate","blessed","fortunate","humbled","gift","abundance","praise"],
  loneliness:["lonely","alone","isolated","abandoned","rejected","disconnected","invisible","forgotten","empty","unseen"],
  hope:["hope","hopeful","optimistic","encouraged","expectant","confident","looking forward","anticipate","possibilities","promise"],
};
export const LIFE_THEMES={
  relationships:["relationship","friend","friendship","partner","spouse","husband","wife","marriage","connection","community","people","companion"],
  family:["family","mother","father","mom","dad","parent","child","children","son","daughter","sibling","brother","sister"],
  calling:["calling","purpose","vocation","mission","ministry","assignment","destiny","path","direction","gifting","anointing","commission"],
  faith:["faith","believe","trust","God","Jesus","Spirit","prayer","scripture","church","worship","devotion","gospel"],
  forgiveness:["forgive","forgiveness","pardon","mercy","reconcile","release","grudge","offense","bitterness","grace","restore","heal"],
  fear_theme:["fear","afraid","anxious","worry","dread","panic","overwhelm","doubt","uncertainty","insecurity","control","paralyzed"],
  identity:["identity","worth","value","enough","belong","purpose","who I am","self","confidence","image","comparison","approval"],
  control:["control","grip","manage","fix","plan","force","striving","surrender","let go","trust","release","rest"],
  waiting:["waiting","patience","season","delay","longing","unfulfilled","hope","endure","persevere","trust","stillness","slow"],
};
export const FAITH_WORDS={
  prayerLang:["pray","prayer","praying","intercede","petition","supplication","knees","crying out","asking God","Lord hear"],
  godRef:["God","Lord","Jesus","Christ","Holy Spirit","Father","Almighty","Savior","Redeemer","Creator","King of kings","Most High"],
  surrenderLang:["surrender","yield","submit","let go","thy will","your will","not my will","give it to God","lay it down","release to you","trust you","in your hands"],
};
export const SCRIPTURE_PATTERN=/\b(\d\s*)?[A-Z][a-z]+\s+\d{1,3}:\d{1,3}(?:-\d{1,3})?\b/g;
export const IDENTITY_NEG=["i can't","i'm not enough","i'm broken","i'm worthless","i'm a failure","i don't matter","i'll never","i'm too much","nobody loves","i'm stupid","i'm ugly","i hate myself","i'm not good enough","i'm unlovable","what's wrong with me","i'm invisible","i'm hopeless"];
export const IDENTITY_POS=["i am enough","i'm growing","God made me","i am loved","i'm becoming","i am worthy","i can do","i'm learning","God is with me","i am chosen","i am strong","i'm healing","i am free","i belong","i am called","i'm brave"];
export const GROWTH_MARKERS={
  forgiveness:["forgive","forgave","forgiven","letting go","released","pardoned","mercy"],
  surrender:["surrender","yielded","submitted","let go","gave it to God","thy will","released"],
  gratitude:["grateful","thankful","praise","thanks","appreciation","blessed","counting blessings"],
  repentance:["repent","repentance","confess","confession","turn from","sorry Lord","convicted"],
  trust:["trust","trusting","leaning on","relying on","depending on","faith in","confidence in"],
  obedience:["obey","obedience","obedient","follow","following","submitted","said yes"],
};
export const STOP_WORDS=new Set(["the","be","to","of","and","a","in","that","have","i","it","for","not","on","with","he","as","you","do","at","this","but","his","by","from","they","we","her","she","or","an","will","my","one","all","would","there","their","what","so","up","out","if","about","who","get","which","go","me","when","make","can","like","time","no","just","him","know","take","people","into","year","your","good","some","could","them","see","other","than","then","now","look","only","come","its","over","think","also","back","after","use","two","how","our","work","first","well","way","even","new","want","because","any","these","give","day","most","us","is","am","are","was","were","been","being","had","has","does","did","got","getting","got","been","had","has","having","doing","would","should","could","might","must","shall","may","need","really","very","much","more","many","still","already","too","thing","things","something","anything","nothing","everything","going","every","each","been","feel","feeling","felt","lot","kind","maybe","around","through","right","own","say","said","been","those","same","both","before","long","down"]);
export const EMOTION_COLORS={joy:"#E8B84B",peace:"#7B9E6B",anxiety:"#C97B4B",fear:"#8B6B8B",anger:"#C45B5B",gratitude:"#D4A853",loneliness:"#6B7B9E",hope:"#5BA8A0"};

/* ═══════════════════════════════════════════════════
   GROWTH INSIGHTS — ANALYSIS ENGINE
═══════════════════════════════════════════════════ */
export function computeInsights(entries,prayerPosts){
  const emotions={};Object.keys(EMOTION_WORDS).forEach(k=>{emotions[k]={count:0,entries:[]};});
  const lifeThemes={};Object.keys(LIFE_THEMES).forEach(k=>{lifeThemes[k]={count:0,pct:0};});
  const faithMentions={scriptures:[],prayerLang:0,godRefs:0,surrenderLang:0};
  const identity={negative:[],positive:[]};
  const growthMarkers={};Object.keys(GROWTH_MARKERS).forEach(k=>{growthMarkers[k]=0;});
  const timeOfDay={morning:0,afternoon:0,evening:0,night:0};
  const wordFreq={};
  const emotionTimeline=[];

  entries.forEach(e=>{
    const low=e.text.toLowerCase();
    // Emotions
    let entryEmotions=[];
    Object.entries(EMOTION_WORDS).forEach(([emo,words])=>{
      const hits=words.filter(w=>low.includes(w)).length;
      if(hits>0){emotions[emo].count+=hits;emotions[emo].entries.push(e.id);entryEmotions.push(emo);}
    });
    emotionTimeline.push({id:e.id,date:e.date,emotions:entryEmotions});
    // Life themes
    Object.entries(LIFE_THEMES).forEach(([th,words])=>{
      const hits=words.filter(w=>low.includes(w)).length;
      lifeThemes[th].count+=hits;
    });
    // Faith
    const scrMatches=e.text.match(SCRIPTURE_PATTERN);
    if(scrMatches) scrMatches.forEach(ref=>faithMentions.scriptures.push({ref,entryId:e.id,date:e.date}));
    FAITH_WORDS.prayerLang.forEach(w=>{if(low.includes(w.toLowerCase())) faithMentions.prayerLang++;});
    FAITH_WORDS.godRef.forEach(w=>{if(low.includes(w.toLowerCase())) faithMentions.godRefs++;});
    FAITH_WORDS.surrenderLang.forEach(w=>{if(low.includes(w.toLowerCase())) faithMentions.surrenderLang++;});
    // Identity
    IDENTITY_NEG.forEach(p=>{if(low.includes(p)) identity.negative.push({text:p,entryId:e.id,date:e.date});});
    IDENTITY_POS.forEach(p=>{if(low.includes(p)) identity.positive.push({text:p,entryId:e.id,date:e.date});});
    // Growth markers
    Object.entries(GROWTH_MARKERS).forEach(([mk,words])=>{words.forEach(w=>{if(low.includes(w)) growthMarkers[mk]++;});});
    // Time of day
    const ts=parseInt(e.id);
    if(!isNaN(ts)){const h=new Date(ts).getHours();if(h>=5&&h<12)timeOfDay.morning++;else if(h>=12&&h<17)timeOfDay.afternoon++;else if(h>=17&&h<21)timeOfDay.evening++;else timeOfDay.night++;}
    // Word frequency
    e.text.replace(/[^a-zA-Z\s]/g,"").toLowerCase().split(/\s+/).forEach(w=>{if(w.length>=3&&!STOP_WORDS.has(w)) wordFreq[w]=(wordFreq[w]||0)+1;});
  });

  // Life theme percentages
  const themeSum=Object.values(lifeThemes).reduce((a,b)=>a+b.count,0)||1;
  Object.keys(lifeThemes).forEach(k=>{lifeThemes[k].pct=Math.round(lifeThemes[k].count/themeSum*100);});

  // Breakthroughs: detect negative→positive shifts in rolling 3-entry windows
  const breakthroughs=[];
  const negEmos=new Set(["anxiety","fear","anger","loneliness"]);
  const posEmos=new Set(["joy","peace","gratitude","hope"]);
  for(let i=2;i<emotionTimeline.length;i++){
    const prev=emotionTimeline[i-2].emotions.concat(emotionTimeline[i-1].emotions);
    const curr=emotionTimeline[i].emotions;
    const hadNeg=prev.some(em=>negEmos.has(em));
    const hasPos=curr.some(em=>posEmos.has(em));
    const noNeg=!curr.some(em=>negEmos.has(em));
    if(hadNeg&&hasPos&&noNeg){
      breakthroughs.push({date:emotionTimeline[i].date,from:prev.filter(em=>negEmos.has(em))[0],to:curr.filter(em=>posEmos.has(em))[0],entryId:emotionTimeline[i].id});
    }
  }

  return {emotions,lifeThemes,faithMentions,identity,growthMarkers,timeOfDay,wordFreq,breakthroughs};
}

export function computeWeeklyDigest(entries,insights){
  const now=new Date();const weekAgo=new Date(now-7*24*60*60*1000);
  const weekEntries=entries.filter(e=>new Date(e.date)>=weekAgo);
  const rooms={};weekEntries.forEach(e=>{if(e.roomLabel)rooms[e.roomLabel]=(rooms[e.roomLabel]||0)+1;});
  const topRooms=Object.entries(rooms).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([r])=>r);
  const totalWords=weekEntries.reduce((s,e)=>s+(e.words||wc(e.text)),0);
  const topEmotions=Object.entries(insights.emotions).sort((a,b)=>b[1].count-a[1].count).slice(0,3).map(([k])=>k);
  return {entryCount:weekEntries.length,totalWords,topRooms,topEmotions};
}

export function computeSeasonalSummary(entries,insights,days){
  const now=new Date();const cutoff=new Date(now-days*24*60*60*1000);
  const filtered=entries.filter(e=>new Date(e.date)>=cutoff);
  const totalWords=filtered.reduce((s,e)=>s+(e.words||wc(e.text)),0);
  const avgWords=filtered.length?Math.round(totalWords/filtered.length):0;
  const topThemes=Object.entries(insights.lifeThemes).sort((a,b)=>b[1].count-a[1].count).slice(0,3).map(([k])=>k);
  return {entries:filtered.length,totalWords,avgWords,topThemes,days};
}

export function computeFutureYou(entries){
  if(entries.length<5) return null;
  const sorted=[...entries].sort((a,b)=>a.id-b.id);
  const first=sorted[0];const latest=sorted[sorted.length-1];
  const firstLow=first.text.toLowerCase();const latestLow=latest.text.toLowerCase();
  const firstNeg=IDENTITY_NEG.filter(p=>firstLow.includes(p));
  const firstPos=IDENTITY_POS.filter(p=>firstLow.includes(p));
  const latestNeg=IDENTITY_NEG.filter(p=>latestLow.includes(p));
  const latestPos=IDENTITY_POS.filter(p=>latestLow.includes(p));
  const daysBetween=Math.round((parseInt(latest.id)-parseInt(first.id))/(1000*60*60*24));
  return {first:{date:first.date,snippet:first.text.slice(0,120),negPatterns:firstNeg,posPatterns:firstPos},latest:{date:latest.date,snippet:latest.text.slice(0,120),negPatterns:latestNeg,posPatterns:latestPos},daysBetween};
}

/* ═══════════════════════════════════════════════════
   CANDLE ECONOMY — SHOP ITEMS
═══════════════════════════════════════════════════ */
// SHOP_ITEMS — now sourced from items.js (unified item registry)
export { SHOP_ITEMS } from './items.js';

/* ═══════════════════════════════════════════════════
   PRAYER GARDEN — PLANTS
═══════════════════════════════════════════════════ */
export const GARDEN_PLANTS=[
  // growthBase values are in MINUTES per stage: [seed→sprout, sprout→young, young→mature, mature→harvest]
  {id:"wheat",       name:"Wheat",        emoji:"🌾", stageEmojis:["🌱","🌿","🌾","🌾","🌾"], harvestItem:"wheat",       harvestEmoji:"🌾", plantCost:2, growthBase:[5,6,7,5]},       // 23 min total
  {id:"barley",      name:"Barley",       emoji:"🌿", stageEmojis:["🌱","🌿","🌿","🌿","🌿"], harvestItem:"barley",      harvestEmoji:"🌿", plantCost:2, growthBase:[5,6,7,5]},       // 23 min total
  {id:"grape",       name:"Grape Vine",   emoji:"🍇", stageEmojis:["🌱","🌿","🍃","🍇","🍇"], harvestItem:"grapes",      harvestEmoji:"🍇", plantCost:3, growthBase:[5,7,8,5]},       // 25 min total
  {id:"fig",         name:"Fig Tree",     emoji:"🌳", stageEmojis:["🌱","🌿","🌳","🌳","🌳"], harvestItem:"figs",        harvestEmoji:"🫒", plantCost:4, growthBase:[6,7,9,6]},       // 28 min total
  {id:"olive",       name:"Olive Tree",   emoji:"🫒", stageEmojis:["🌱","🌿","🌳","🫒","🫒"], harvestItem:"olives",      harvestEmoji:"🫒", plantCost:5, growthBase:[6,8,10,6]},      // 30 min total
  {id:"pomegranate", name:"Pomegranate",  emoji:"🍎", stageEmojis:["🌱","🌿","🌳","🍎","🍎"], harvestItem:"pomegranates",harvestEmoji:"🍎", plantCost:6, growthBase:[7,8,11,7]},      // 33 min total
  {id:"date_palm",   name:"Date Palm",    emoji:"🌴", stageEmojis:["🌱","🌿","🌴","🌴","🌴"], harvestItem:"dates",       harvestEmoji:"🌴", plantCost:7, growthBase:[7,9,12,7]},      // 35 min total
];
export const GROWTH_STAGES=["seed","sprout","young plant","mature plant","harvestable"];
export const PRAYER_BONUS_MINS=2; // each prayer reduces each stage by 2 min

/* ═══════════════════════════════════════════════════
   PRAYER GARDEN — CRAFTING STATIONS
═══════════════════════════════════════════════════ */
export const CRAFTING_STATIONS=[
  {id:"olive_press", name:"Olive Press",  emoji:"🫒", recipes:[
    {inputs:{olives:3},  output:"olive_oil",  outputName:"Olive Oil",   outputEmoji:"🫗", outputQty:1},
    {inputs:{olives:2},  output:"lamp_oil",   outputName:"Lamp Oil",    outputEmoji:"🪔", outputQty:1},
  ]},
  {id:"drying_rack",  name:"Drying Rack",  emoji:"🧺", recipes:[
    {inputs:{figs:2},    output:"dried_figs",  outputName:"Dried Figs",   outputEmoji:"🫘", outputQty:2},
    {inputs:{grapes:3},  output:"raisins",     outputName:"Raisins",      outputEmoji:"🫐", outputQty:2},
    {inputs:{dates:2},   output:"dried_dates", outputName:"Dried Dates",  outputEmoji:"🫘", outputQty:2},
  ]},
  {id:"grain_mill",   name:"Grain Mill",   emoji:"⚙️", recipes:[
    {inputs:{wheat:3},   output:"flour",       outputName:"Flour",        outputEmoji:"🌫️", outputQty:2},
    {inputs:{barley:3},  output:"barley_flour",outputName:"Barley Flour", outputEmoji:"🌫️", outputQty:2},
  ]},
  {id:"bread_oven",   name:"Bread Oven",   emoji:"🫓", recipes:[
    {inputs:{flour:2},        output:"bread",     outputName:"Bread",     outputEmoji:"🍞", outputQty:1},
    {inputs:{barley_flour:2}, output:"flatbread", outputName:"Flatbread", outputEmoji:"🫓", outputQty:1},
  ]},
];

/* ═══════════════════════════════════════════════════
   ECONOMY — ITEM CATALOG
═══════════════════════════════════════════════════ */
// ITEM_CATALOG — now sourced from items.js (unified item registry)
export { ITEM_CATALOG } from './items.js';

/* ═══════════════════════════════════════════════════
   ECONOMY — KITCHEN RECIPES
═══════════════════════════════════════════════════ */
export const KITCHEN_RECIPES = [
  { id:"vegetable_soup",     name:"Vegetable Soup",     emoji:"🍲", inputs:{carrot:1, onion:1, herbs:1},           output:"vegetable_soup",     qty:1 },
  { id:"bread",              name:"Bread",              emoji:"🍞", inputs:{flour:2},                              output:"bread",              qty:1 },
  { id:"roasted_vegetables", name:"Roasted Vegetables", emoji:"🥘", inputs:{potato:1, tomato:1, herbs:1},          output:"roasted_vegetables", qty:1 },
  { id:"stew",               name:"Stew",               emoji:"🥘", inputs:{carrot:1, potato:1, onion:1, tomato:1},output:"stew",               qty:1 },
  { id:"honey_cake",         name:"Honey Cake",         emoji:"🍰", inputs:{flour:1, honey:1, eggs:1},             output:"honey_cake",         qty:1 },
  { id:"fruit_salad",        name:"Fruit Salad",        emoji:"🥗", inputs:{berries:1, figs:1, honey:1},           output:"fruit_salad",        qty:1 },
];

/* ═══════════════════════════════════════════════════
   ECONOMY — NPC BARTER TRADES
═══════════════════════════════════════════════════ */
export const NPC_TRADES = [
  { id:"t1", npc:"Old Farmer",  offer:{eggs:2},                      want:{wheat:3},      emoji:"👨‍🌾" },
  { id:"t2", npc:"Beekeeper",   offer:{honey:1},                     want:{berries:3},    emoji:"🧑‍🌾" },
  { id:"t3", npc:"Shepherd",    offer:{milk:2},                      want:{herbs:2},      emoji:"🧑" },
  { id:"t4", npc:"Forager",     offer:{mushrooms:3},                 want:{bread:1},      emoji:"🧙" },
  { id:"t5", npc:"Traveler",    offer:{tomato_seed:2,carrot_seed:2}, want:{olive_oil:1},  emoji:"🧳" },
];

/* ═══════════════════════════════════════════════════
   ECONOMY — FARM CROPS (seed-based, no prayer link)
═══════════════════════════════════════════════════ */
export const FARM_PLANTS = [
  { id:"herb",   name:"Herbs",   emoji:"🌿", stageEmojis:["🌱","🌿","🌿","🌿","🌿"], harvestItem:"herbs",  seedItem:"herb_seed",   growthBase:[2,3,3,2],   plantCost:0 },
  { id:"carrot", name:"Carrot",  emoji:"🥕", stageEmojis:["🌱","🌿","🥕","🥕","🥕"], harvestItem:"carrot", seedItem:"carrot_seed", growthBase:[4,6,6,4],   plantCost:0 },
  { id:"onion",  name:"Onion",   emoji:"🧅", stageEmojis:["🌱","🌿","🧅","🧅","🧅"], harvestItem:"onion",  seedItem:"onion_seed",  growthBase:[4,6,6,4],   plantCost:0 },
  { id:"potato", name:"Potato",  emoji:"🥔", stageEmojis:["🌱","🌿","🥔","🥔","🥔"], harvestItem:"potato", seedItem:"potato_seed", growthBase:[5,7,8,5],   plantCost:0 },
  { id:"tomato", name:"Tomato",  emoji:"🍅", stageEmojis:["🌱","🌿","🍅","🍅","🍅"], harvestItem:"tomato", seedItem:"tomato_seed", growthBase:[6,8,9,7],   plantCost:0 },
  { id:"wheat_farm", name:"Wheat", emoji:"🌾", stageEmojis:["🌱","🌿","🌾","🌾","🌾"], harvestItem:"wheat", seedItem:"wheat_seed", growthBase:[10,12,13,10], plantCost:0 },
];

/* ═══════════════════════════════════════════════════
   ECONOMY — FARM ANIMALS (timestamp-based production)
═══════════════════════════════════════════════════ */
export const ANIMAL_TYPES=[
  {id:"chicken", name:"Chicken", emoji:"🐔", product:"eggs",  durationMs:3*60*60*1000,  feedCost:1, buyCost:25,  durationLabel:"3h"},
  {id:"goat",    name:"Goat",    emoji:"🐐", product:"milk",  durationMs:6*60*60*1000,  feedCost:1, buyCost:50,  durationLabel:"6h"},
  {id:"sheep",   name:"Sheep",   emoji:"🐑", product:"wool",  durationMs:12*60*60*1000, feedCost:1, buyCost:75,  durationLabel:"12h"},
  {id:"cow",     name:"Cow",     emoji:"🐄", product:"milk",  durationMs:8*60*60*1000,  feedCost:1, buyCost:100, durationLabel:"8h"},
  {id:"bees",    name:"Bees",    emoji:"🐝", product:"honey", durationMs:24*60*60*1000, feedCost:1, buyCost:120, durationLabel:"24h"},
];
export const MAX_ANIMALS=6;

export const DAILY_MISSIONS=[
  {id:"daily_journal",     label:"Journal a prayer",   description:"Write a prayer or reflection", target:1, reward:{candles:10}},
  {id:"daily_pray_3",      label:"Pray for 3 people",  description:"Lift others' prayers",         target:3, reward:{candles:8}},
  {id:"daily_comment",     label:"Encourage someone",  description:"Comment on a community prayer", target:1, reward:{candles:5}},
  {id:"daily_harvest",     label:"Harvest a crop",     description:"Gather from your garden or farm",target:1, reward:{coins:10}},
  {id:"daily_feed_animal", label:"Feed an animal",     description:"Care for one of your animals",  target:1, reward:{candles:5}},
  {id:"daily_checkin",     label:"Check in with yourself", description:"Complete a body & mind check-in", target:1, reward:{candles:8}},
];
export const WEEKLY_MISSIONS=[
  {id:"weekly_journal_5",    label:"Journal 5 times",   description:"Write 5 reflections this week", target:5,  reward:{candles:25}},
  {id:"weekly_pray_10",      label:"Pray for 10 people",description:"Lift 10 prayers this week",     target:10, reward:{candles:20}},
  {id:"weekly_harvest_5",    label:"Harvest 5 crops",   description:"Gather 5 harvests this week",   target:5,  reward:{coins:25}},
  {id:"weekly_share_prayer", label:"Share a prayer",    description:"Post a prayer to the community", target:1,  reward:{candles:15}},
  {id:"weekly_checkin_3",    label:"Show up 3 times",   description:"Complete 3 check-ins this week", target:3, reward:{candles:15}},
];

export const CABIN_FALLBACK_IMAGE="/cabinmapfinalmain.png";
export const SKYLIGHT_STAIRCASE_IMAGE="/FINALSKYLIGHT.png";
export const ROOFTOP_LOUNGE_IMAGE="/FINALROOFTOP.png";
export const ROOFTOP_GARDEN_IMAGE="/Stone terrace at twilight waterfall view.png";

/* ══════════════════════════════════════════════════════
   INNER ROOM PLUS — Premium Content
   ══════════════════════════════════════════════════════ */

export const PREMIUM_DAILY_MISSIONS=[
  {id:"plus_daily_deep_journal", label:"Deep reflection",  description:"Write 3 layers deep in a journal entry", target:1, reward:{candles:15}, premium:true},
  {id:"plus_daily_verse_save",   label:"Save a scripture", description:"Save a verse from the Upper Room Bible",  target:1, reward:{candles:12}, premium:true},
  {id:"plus_daily_craft",        label:"Craft an item",    description:"Create something at a crafting station",   target:1, reward:{coins:15},   premium:true},
];

export const PREMIUM_WEEKLY_MISSIONS=[
  {id:"plus_weekly_journal_10",  label:"Journal 10 times", description:"Write 10 reflections this week", target:10, reward:{candles:50}, premium:true},
  {id:"plus_weekly_harvest_10",  label:"Harvest 10 crops", description:"Gather 10 harvests this week",   target:10, reward:{coins:50},   premium:true},
];

export const PREMIUM_GARDEN_PLANTS=[
  {id:"saffron",      name:"Saffron Crocus", emoji:"✨", stageEmojis:["🌱","🌿","🌸","🌸","🌸"], harvestItem:"saffron",      harvestEmoji:"✨", plantCost:8,  growthBase:[8,10,14,8], premium:true},
  {id:"frankincense", name:"Frankincense",   emoji:"🌲", stageEmojis:["🌱","🌿","🌲","🌲","🌲"], harvestItem:"frankincense", harvestEmoji:"🌲", plantCost:10, growthBase:[10,12,16,10],premium:true},
  {id:"myrrh",        name:"Myrrh Tree",     emoji:"🪵", stageEmojis:["🌱","🌿","🌳","🪵","🪵"], harvestItem:"myrrh",        harvestEmoji:"🪵", plantCost:12, growthBase:[12,14,18,12],premium:true},
];

export const PREMIUM_FARM_PLANTS=[
  {id:"lavender", name:"Lavender", emoji:"💜", stageEmojis:["🌱","🌿","💜","💜","💜"], harvestItem:"lavender",   seedItem:"lavender_seed", growthBase:[8,10,12,8],  plantCost:0, premium:true},
  {id:"flax",     name:"Flax",     emoji:"🧵", stageEmojis:["🌱","🌿","🧵","🧵","🧵"], harvestItem:"flax_fiber", seedItem:"flax_seed",     growthBase:[10,12,14,10],plantCost:0, premium:true},
];

export const PREMIUM_ANIMALS=[
  {id:"dove",   name:"Dove",   emoji:"🕊️", product:"feathers",  durationMs:4*60*60*1000,  feedCost:1, buyCost:80,  durationLabel:"4h",  premium:true},
  {id:"donkey", name:"Donkey", emoji:"🫏",  product:"transport", durationMs:16*60*60*1000, feedCost:1, buyCost:150, durationLabel:"16h", premium:true},
];

export const PREMIUM_PROMPTS=[
  {q:"What is the prayer you have never prayed out loud?",                                hint:"Some prayers live in the body, not the mouth."},
  {q:"If you could hear God's voice clearly right now, what do you think He would say?",  hint:"Sit with this. Don't rush the answer."},
  {q:"What part of your story have you never let God into?",                              hint:"The locked rooms are where healing begins."},
  {q:"What would change if you stopped performing your faith?",                           hint:"Authenticity is a form of worship."},
  {q:"What are you building your identity on that could be taken away?",                  hint:"Name the foundations."},
];

// PREMIUM_SHOP_ITEMS — now sourced from items.js (unified item registry)
export { PREMIUM_SHOP_ITEMS } from './items.js';

export const PLUS_BENEFITS=[
  {icon:"scroll",   title:"Bonus Missions",  desc:"Extra daily and weekly missions with greater rewards"},
  {icon:"seedling", title:"Exclusive Seeds",  desc:"Premium plants like Saffron, Frankincense, and Myrrh"},
  {icon:"feather",  title:"Rare Animals",     desc:"Unique creatures like the Dove and Donkey"},
  {icon:"quill",    title:"Deeper Prompts",   desc:"Exclusive journal questions that go beneath the surface"},
  {icon:"frame",    title:"Cabin Upgrades",   desc:"Premium furniture and decor for your cabin"},
];
