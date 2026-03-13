import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { auth, db, googleProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged, doc, getDoc, setDoc } from "./firebase.js";
/* R3F imports removed — ImmersiveCabin uses pure DOM/Canvas2D for performance */

/* ═══════════════════════════════════════════════════
   FONTS
═══════════════════════════════════════════════════ */
const GFONTS = `@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400;1,600&family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,700;1,400;1,700&display=swap');`;

/* ═══════════════════════════════════════════════════
   BRAND PALETTE
═══════════════════════════════════════════════════ */
const B = {
  beige:"#F5F1EA", beigeD:"#EDE8DF", pink:"#F4E8E5", pinkD:"#E8C8C0",
  sage:"#BED3C4", sageD:"#9AB8A4", sageDk:"#5A8A6A",
  night:"#1A1612", nightM:"#241E18", gold:"#C9A96E", goldL:"#E8D4A0",
  ink:"#2A2420", inkM:"#5A4A42", inkL:"#8A7A70", inkLL:"#B0A098",
  white:"#FDFAF6",
};
const SERIF   = "'Cormorant Garamond','Georgia',serif";
const SANS    = "'DM Sans','Helvetica Neue',sans-serif";
const DISPLAY = "'Playfair Display','Georgia',serif";

/* ═══════════════════════════════════════════════════
   ROOM THEMES
═══════════════════════════════════════════════════ */
const RT = {
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
const th = id => RT[id] || RT.fear;

/* ═══════════════════════════════════════════════════
   ROOM DATA
═══════════════════════════════════════════════════ */
const REFLECTION_ROOMS = [
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
];

const COMMUNITY_ROOMS = [
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

const LOCKED_ROOM = {
  id:"locked",label:"The Locked Room",emoji:"🗝️",tag:"Hidden",question:"The question most people never face.",
  description:"Unlocked after 7 days. These are the questions underneath every other question.",
  days:[
    {q:"If your life ended today, what would you most regret not saying, doing, or becoming?",hint:"Feel the weight of this."},
    {q:"What is the one thing you know God is asking of you — that you haven't said yes to?",hint:"You already know what it is."},
    {q:"What would your fully surrendered life look like? And what's stopping you?",hint:"The question underneath every other question."},
  ]
};

const JESUS_QUESTIONS = [
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
const QUESTION_SETS = {
  truth:    {label:"Truth",         emoji:"🪞",color:"#9A8AAA",questions:["What are you pretending not to know?","What truth about yourself are you avoiding?","What would change if you told the truth?","What are you afraid would happen if you were fully honest?","What story are you telling yourself that isn't true?","Where are you lying to yourself to stay comfortable?"]},
  fear:     {label:"Fear",          emoji:"🕯️",color:"#7A9AB8",questions:["What fear is quietly shaping your decisions?","What would you attempt if you knew you couldn't fail?","If fear disappeared tomorrow, what would you do first?","What are you protecting yourself from — and at what cost?","What would you do if no one was watching?","What's the worst that could actually happen — and could you survive it?"]},
  desire:   {label:"Desire",        emoji:"✦", color:"#C4A46A",questions:["What does your heart actually want?","What are you longing for that you haven't admitted yet?","What would a life you truly loved look like?","What are you settling for instead of what you want?","What dream have you quietly given up on?","What do you want that you feel you're not allowed to want?"]},
  identity: {label:"Identity",      emoji:"🌿",color:"#6A9478",questions:["Who are you when no one is watching?","What are you trying to prove, and to whom?","What are you still waiting for permission to do?","Whose voice are you still listening to that you should have let go?","What version of yourself have you abandoned?","What chapter of your story needs to end?"]},
  faith:    {label:"Faith",         emoji:"🌾",color:"#D4B464",questions:["What is God inviting you to trust Him with?","Where do you need to surrender control?","What are you believing about God that might not be true?","What would fully trusting God actually look like?","What is God asking of you that you keep saying no to?","What would you do if you truly believed God was for you?"]},
  healing:  {label:"Healing",       emoji:"🍃",color:"#8AAA7A",questions:["What are you holding onto that is holding you back?","What would your life look like if this wound were healed?","What do you need to forgive yourself for?","What pain have you normalized that deserves attention?","What would you tell the younger version of yourself?","What are you ready to release?"]},
  relations:{label:"Relationships", emoji:"🌸",color:"#C4848A",questions:["What conversation have you been avoiding?","Who deserves more of your honesty?","What pattern in your relationships keeps repeating?","Who are you performing for instead of being real with?","What boundary do you need to set that you keep putting off?","What relationship in your life needs the most attention right now?"]},
};
const ALL_CARD_QS = Object.values(QUESTION_SETS).flatMap(s => s.questions);

const CARD_THEMES = [
  {id:"midnight", label:"Midnight",    preview:"linear-gradient(135deg,#1A1612,#2A1E18)", bg:"linear-gradient(135deg,#1A1612 0%,#2A1E18 50%,#1A1612 100%)", text:"#E8D4A0",sub:"rgba(232,212,160,0.45)",brand:"rgba(201,169,110,0.7)",dot:B.gold,fontType:"serif"},
  {id:"parchment",label:"Parchment",   preview:"linear-gradient(135deg,#F5F0E8,#EDE5D5)", bg:"linear-gradient(135deg,#F5F0E8 0%,#EDE5D5 50%,#F0EBE0 100%)", text:"#2A2018",sub:"rgba(42,32,24,0.45)",brand:"rgba(90,138,106,0.8)",dot:B.sageDk,fontType:"serif"},
  {id:"sage",     label:"Sage",        preview:"linear-gradient(135deg,#2A3828,#3A4A38)", bg:"linear-gradient(135deg,#2A3828 0%,#3A4A38 50%,#2E3E2C 100%)", text:"#E8F2E4",sub:"rgba(232,242,228,0.45)",brand:"rgba(190,211,196,0.8)",dot:B.sage,fontType:"serif"},
  {id:"blush",    label:"Blush",       preview:"linear-gradient(135deg,#3A1820,#4A2430)", bg:"linear-gradient(135deg,#3A1820 0%,#4A2430 50%,#3E1C28 100%)", text:"#F8E8EE",sub:"rgba(248,232,238,0.45)",brand:"rgba(232,200,192,0.8)",dot:B.pinkD,fontType:"serif"},
  {id:"dawn",     label:"Golden Dawn", preview:"linear-gradient(160deg,#2A1E08,#4A3418)", bg:"linear-gradient(160deg,#2A1E08 0%,#3A2A10 40%,#4A3418 100%)", text:"#FFF4D8",sub:"rgba(255,244,216,0.45)",brand:"rgba(212,180,100,0.8)",dot:"#D4B464",fontType:"display"},
  {id:"coastal",  label:"Coastal",     preview:"linear-gradient(160deg,#0A1828,#0E2030)", bg:"linear-gradient(160deg,#0A1828 0%,#122238 40%,#0E2030 100%)", text:"#D8EEFF",sub:"rgba(216,238,255,0.45)",brand:"rgba(100,160,220,0.8)",dot:"#64A0DC",fontType:"sans"},
  {id:"cloud",    label:"Cloud",       preview:"linear-gradient(135deg,#F0F4F8,#EFF5FB)", bg:"linear-gradient(135deg,#F0F4F8 0%,#E8EFF6 50%,#EFF5FB 100%)", text:"#1E2A3A",sub:"rgba(30,42,58,0.4)",brand:"rgba(80,120,180,0.7)",dot:"#5078B4",fontType:"sans"},
  {id:"forest",   label:"Forest",      preview:"linear-gradient(135deg,#0A1A0E,#122018)", bg:"linear-gradient(135deg,#0A1A0E 0%,#122018 50%,#0E1A12 100%)", text:"#D8F0E4",sub:"rgba(216,240,228,0.4)",brand:"rgba(140,200,160,0.7)",dot:"#8CC8A0",fontType:"serif"},
];

const CARD_RATIOS = [
  {id:"square",label:"Square",  w:1080,h:1080,desc:"Instagram Post",  icon:"⬜"},
  {id:"story", label:"Story",   w:1080,h:1920,desc:"Story / TikTok",  icon:"📱"},
  {id:"wide",  label:"Wide",    w:1200,h:628, desc:"Twitter/LinkedIn",icon:"🖥️"},
];

const VERSE_THEMES = [
  {id:"candlelight",label:"Candlelight",preview:"linear-gradient(135deg,#12101A,#1E1828)",bg:"linear-gradient(135deg,#12101A 0%,#1E1828 50%,#14111E 100%)",text:"#E8D4A0",sub:"rgba(200,190,230,0.40)",brand:"rgba(201,169,110,0.7)",dot:"#C9A96E",fontType:"serif"},
  {id:"parchment",label:"Parchment",preview:"linear-gradient(135deg,#F5F0E8,#EDE5D5)",bg:"linear-gradient(135deg,#F5F0E8 0%,#EDE5D5 50%,#F0EBE0 100%)",text:"#2A2018",sub:"rgba(42,32,24,0.45)",brand:"rgba(90,138,106,0.8)",dot:"#5A8A6A",fontType:"serif"},
  {id:"midnight",label:"Midnight",preview:"linear-gradient(135deg,#0A0818,#1A1232)",bg:"linear-gradient(135deg,#0A0818 0%,#1A1232 50%,#0E0B1E 100%)",text:"#D8C8F0",sub:"rgba(200,190,230,0.40)",brand:"rgba(180,160,210,0.7)",dot:"#B4A0D2",fontType:"display"},
  {id:"dawn",label:"Golden Dawn",preview:"linear-gradient(160deg,#2A1E08,#4A3418)",bg:"linear-gradient(160deg,#2A1E08 0%,#3A2A10 40%,#4A3418 100%)",text:"#FFF4D8",sub:"rgba(255,244,216,0.45)",brand:"rgba(212,180,100,0.8)",dot:"#D4B464",fontType:"display"},
  {id:"sage",label:"Sage",preview:"linear-gradient(135deg,#2A3828,#3A4A38)",bg:"linear-gradient(135deg,#2A3828 0%,#3A4A38 50%,#2E3E2C 100%)",text:"#E8F2E4",sub:"rgba(232,242,228,0.45)",brand:"rgba(190,211,196,0.8)",dot:"#BED3C4",fontType:"serif"},
];

const VIRAL_QS = [
  "What are you pretending not to know?","What are you afraid would change if you were fully honest?",
  "What are you trying to prove, and to whom?","What truth about yourself are you avoiding?",
  "If fear disappeared tomorrow, what would you do?","Who would you be if no one was watching?",
  "What are you still waiting for permission to do?","What chapter of your story needs to end?",
];

const SAMPLE_PRAYERS = [
  {id:"p1",date:"2026-03-04",text:"Going through a divorce and feeling completely lost. Please pray that God reminds me who I am in Him.",tag:"Healing",prayers:14},
  {id:"p2",date:"2026-03-04",text:"Single and struggling with loneliness. Please just pray that I feel seen today.",tag:"Singleness",prayers:22},
  {id:"p3",date:"2026-03-03",text:"New mom and drowning. Praying for strength and the ability to extend grace to myself.",tag:"Motherhood",prayers:31},
  {id:"p4",date:"2026-03-02",text:"Believing God for a spouse. Some days the wait feels impossible. Asking for peace in this season.",tag:"Waiting",prayers:18},
];

/* ═══════════════════════════════════════════════════
   BOOKSHELF — SPIRITUAL BOOKS
═══════════════════════════════════════════════════ */
const SHELF_BOOKS = [
  {id:"journal",  label:"Reflection Journal", emoji:"📖"},
  {id:"bible",    label:"Scripture",          emoji:"✝️"},
  {id:"prayers",  label:"Prayers",            emoji:"🙏"},
  {id:"gratitude",label:"Gratitude",          emoji:"🌿"},
  {id:"dreams",   label:"Dreams",             emoji:"✨"},
  {id:"prophecy", label:"Prophecy & Words",   emoji:"🕊️"},
];
/* Book cover colors for the floating shelf books */
const BOOK_COVERS = {
  journal:  {bg:"linear-gradient(160deg,#5C3D2E,#3D2818)",accent:"#C9A96E"},
  bible:    {bg:"linear-gradient(160deg,#2E1E3D,#1E1028)",accent:"#B8A0D0"},
  prayers:  {bg:"linear-gradient(160deg,#1E3D2E,#122818)",accent:"#8AC8A0"},
  gratitude:{bg:"linear-gradient(160deg,#3D3D1E,#282810)",accent:"#D4C87A"},
  dreams:   {bg:"linear-gradient(160deg,#1E2E3D,#101828)",accent:"#7AB8D8"},
  prophecy: {bg:"linear-gradient(160deg,#3D1E2E,#281018)",accent:"#D490C0"},
};

const BOOK_CONTENT = {
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
    cover:{title:"Gratitude Journal",subtitle:"Notice the gifts hidden in ordinary days."},
    pages:[
      {title:"Three Blessings",prompt:"Name three things you are grateful for today.",hint:"Big or small — everything counts."},
      {title:"Unexpected Gift",prompt:"What surprised you with joy recently?",hint:"The best gifts are often unplanned."},
      {title:"A Person",prompt:"Who are you thankful for — and why?",hint:"Let yourself feel the weight of their presence in your life."},
      {title:"Simple Pleasures",prompt:"What simple moment brought you peace today?",hint:"Morning light. A warm cup. A deep breath."},
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

function getBookPageCount(bookType, section){
  if(bookType==="journal"){
    if(!section) return 2; // cover + TOC
    if(section==="blank") return 3; // cover + TOC + write
    if(section==="rooms") return REFLECTION_ROOMS.length+6; // cover + TOC + 7 rooms + jesus + locked + daily + entries
    if(section==="dreams") return 2+(BOOK_CONTENT.dreams?.pages.length||4);
    if(section==="prayers") return 4; // cover + TOC + write + list
  }
  const bc=BOOK_CONTENT[bookType];
  return bc? bc.pages.length+1 : 12;
}

/* ═══════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════ */
function todayStr(){ return new Date().toISOString().slice(0,10); }
function isoDate(d){ return d.toISOString().slice(0,10); }
function wc(t){ return t.trim().split(/\s+/).filter(Boolean).length; }
function shuffle(a){ return [...a].sort(()=>Math.random()-.5); }

const THEME_WORDS={fear:["fear","afraid","scared","anxious","worry"],control:["control","manage","grip","force","fix"],trust:["trust","faith","believe","rely","surrender"],identity:["worth","value","enough","belong","purpose"],release:["release","let go","forgive","grief","heal"],desire:["want","desire","long","dream","hope"],relationships:["relationship","family","love","connection","hurt"]};
function aggregateThemes(entries){
  const t={};
  entries.forEach(e=>{Object.entries(THEME_WORDS).forEach(([k,ws])=>{const c=ws.filter(w=>e.text.toLowerCase().includes(w)).length;t[k]=(t[k]||0)+c;});});
  const sum=Object.values(t).reduce((a,b)=>a+b,0)||1;
  return Object.entries(t).map(([k,v])=>({theme:k,count:v,pct:Math.round(v/sum*100)})).sort((a,b)=>b.count-a.count);
}

/* ═══════════════════════════════════════════════════
   GROWTH INSIGHTS — KEYWORD DICTIONARIES
═══════════════════════════════════════════════════ */
const EMOTION_WORDS={
  joy:["joy","joyful","happy","happiness","glad","delight","cheerful","elated","excited","blessed"],
  peace:["peace","peaceful","calm","rest","still","quiet","serene","tranquil","centered","settled"],
  anxiety:["anxiety","anxious","worry","worried","nervous","stressed","overwhelmed","panic","dread","uneasy"],
  fear:["fear","afraid","scared","terrified","frightened","timid","paralyzed","helpless","threatened","insecure"],
  anger:["anger","angry","frustrated","furious","irritated","resentful","bitter","enraged","mad","hostile"],
  gratitude:["grateful","thankful","gratitude","appreciate","blessed","fortunate","humbled","gift","abundance","praise"],
  loneliness:["lonely","alone","isolated","abandoned","rejected","disconnected","invisible","forgotten","empty","unseen"],
  hope:["hope","hopeful","optimistic","encouraged","expectant","confident","looking forward","anticipate","possibilities","promise"],
};
const LIFE_THEMES={
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
const FAITH_WORDS={
  prayerLang:["pray","prayer","praying","intercede","petition","supplication","knees","crying out","asking God","Lord hear"],
  godRef:["God","Lord","Jesus","Christ","Holy Spirit","Father","Almighty","Savior","Redeemer","Creator","King of kings","Most High"],
  surrenderLang:["surrender","yield","submit","let go","thy will","your will","not my will","give it to God","lay it down","release to you","trust you","in your hands"],
};
const SCRIPTURE_PATTERN=/\b(\d\s*)?[A-Z][a-z]+\s+\d{1,3}:\d{1,3}(?:-\d{1,3})?\b/g;
const IDENTITY_NEG=["i can't","i'm not enough","i'm broken","i'm worthless","i'm a failure","i don't matter","i'll never","i'm too much","nobody loves","i'm stupid","i'm ugly","i hate myself","i'm not good enough","i'm unlovable","what's wrong with me","i'm invisible","i'm hopeless"];
const IDENTITY_POS=["i am enough","i'm growing","God made me","i am loved","i'm becoming","i am worthy","i can do","i'm learning","God is with me","i am chosen","i am strong","i'm healing","i am free","i belong","i am called","i'm brave"];
const GROWTH_MARKERS={
  forgiveness:["forgive","forgave","forgiven","letting go","released","pardoned","mercy"],
  surrender:["surrender","yielded","submitted","let go","gave it to God","thy will","released"],
  gratitude:["grateful","thankful","praise","thanks","appreciation","blessed","counting blessings"],
  repentance:["repent","repentance","confess","confession","turn from","sorry Lord","convicted"],
  trust:["trust","trusting","leaning on","relying on","depending on","faith in","confidence in"],
  obedience:["obey","obedience","obedient","follow","following","submitted","said yes"],
};
const STOP_WORDS=new Set(["the","be","to","of","and","a","in","that","have","i","it","for","not","on","with","he","as","you","do","at","this","but","his","by","from","they","we","her","she","or","an","will","my","one","all","would","there","their","what","so","up","out","if","about","who","get","which","go","me","when","make","can","like","time","no","just","him","know","take","people","into","year","your","good","some","could","them","see","other","than","then","now","look","only","come","its","over","think","also","back","after","use","two","how","our","work","first","well","way","even","new","want","because","any","these","give","day","most","us","is","am","are","was","were","been","being","had","has","does","did","got","getting","got","been","had","has","having","doing","would","should","could","might","must","shall","may","need","really","very","much","more","many","still","already","too","thing","things","something","anything","nothing","everything","going","every","each","been","feel","feeling","felt","lot","kind","maybe","around","through","right","own","say","said","been","those","same","both","before","long","down"]);
const EMOTION_COLORS={joy:"#E8B84B",peace:"#7B9E6B",anxiety:"#C97B4B",fear:"#8B6B8B",anger:"#C45B5B",gratitude:"#D4A853",loneliness:"#6B7B9E",hope:"#5BA8A0"};

/* ═══════════════════════════════════════════════════
   GROWTH INSIGHTS — ANALYSIS ENGINE
═══════════════════════════════════════════════════ */
function computeInsights(entries,prayerPosts){
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

function computeWeeklyDigest(entries,insights){
  const now=new Date();const weekAgo=new Date(now-7*24*60*60*1000);
  const weekEntries=entries.filter(e=>new Date(e.date)>=weekAgo);
  const rooms={};weekEntries.forEach(e=>{if(e.roomLabel)rooms[e.roomLabel]=(rooms[e.roomLabel]||0)+1;});
  const topRooms=Object.entries(rooms).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([r])=>r);
  const totalWords=weekEntries.reduce((s,e)=>s+(e.words||wc(e.text)),0);
  const topEmotions=Object.entries(insights.emotions).sort((a,b)=>b[1].count-a[1].count).slice(0,3).map(([k])=>k);
  return {entryCount:weekEntries.length,totalWords,topRooms,topEmotions};
}

function computeSeasonalSummary(entries,insights,days){
  const now=new Date();const cutoff=new Date(now-days*24*60*60*1000);
  const filtered=entries.filter(e=>new Date(e.date)>=cutoff);
  const totalWords=filtered.reduce((s,e)=>s+(e.words||wc(e.text)),0);
  const avgWords=filtered.length?Math.round(totalWords/filtered.length):0;
  const topThemes=Object.entries(insights.lifeThemes).sort((a,b)=>b[1].count-a[1].count).slice(0,3).map(([k])=>k);
  return {entries:filtered.length,totalWords,avgWords,topThemes,days};
}

function computeFutureYou(entries){
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
const SHOP_ITEMS=[
  // Furniture
  {id:"prayer_chair",name:"Wooden Prayer Chair",emoji:"\u{1FA91}",cost:15,category:"furniture",asset:"/assets/furniture/prayer-chair.png",pos:{top:"62%",left:"8%",width:"12%"}},
  {id:"prayer_rug",name:"Woven Prayer Rug",emoji:"🪷",cost:10,category:"furniture",asset:"/assets/furniture/prayer-rug.png",pos:{top:"78%",left:"22%",width:"18%"}},
  {id:"side_table",name:"Rustic Side Table",emoji:"\u{1FAB5}",cost:12,category:"furniture",asset:"/assets/furniture/side-table.png",pos:{top:"60%",left:"60%",width:"10%"}},
  // Candles & Light
  {id:"candle_cluster",name:"Candle Cluster",emoji:"\uD83D\uDD6F\uFE0F",cost:8,category:"candles",asset:"/assets/furniture/candle-cluster.png",pos:{top:"58%",left:"62%",width:"8%"}},
  {id:"lantern",name:"Brass Lantern",emoji:"\uD83C\uDFEE",cost:12,category:"candles",asset:"/assets/furniture/brass-lantern.png",pos:{top:"35%",left:"5%",width:"6%"}},
  {id:"string_lights",name:"String Lights",emoji:"\u2728",cost:20,category:"candles",asset:"/assets/furniture/string-lights.png",pos:{top:"15%",left:"10%",width:"50%"}},
  // Decor
  {id:"cross_wall",name:"Wooden Cross",emoji:"\u271D\uFE0F",cost:10,category:"decor",asset:"/assets/furniture/wooden-cross.png",pos:{top:"25%",left:"48%",width:"8%"}},
  {id:"plant_pot",name:"Potted Fern",emoji:"\uD83C\uDF3F",cost:6,category:"decor",asset:"/assets/furniture/potted-fern.png",pos:{top:"65%",left:"72%",width:"9%"}},
  {id:"bookstack",name:"Stack of Books",emoji:"\uD83D\uDCDA",cost:8,category:"decor",asset:"/assets/furniture/book-stack.png",pos:{top:"63%",left:"56%",width:"7%"}},
  {id:"bible_open",name:"Open Bible",emoji:"\uD83D\uDCD6",cost:14,category:"decor",asset:"/assets/furniture/open-bible.png",pos:{top:"56%",left:"64%",width:"8%"}},
  {id:"prayer_beads",name:"Prayer Beads",emoji:"\uD83D\uDCFF",cost:5,category:"decor",asset:"/assets/furniture/prayer-beads.png",pos:{top:"58%",left:"70%",width:"6%"}},
  {id:"tapestry",name:"Woven Tapestry",emoji:"\uD83D\uDDBC\uFE0F",cost:18,category:"decor",asset:"/assets/furniture/woven-tapestry.png",pos:{top:"22%",left:"15%",width:"14%"}},
];

/* ═══════════════════════════════════════════════════
   PRAYER GARDEN — PLANTS
═══════════════════════════════════════════════════ */
const GARDEN_PLANTS=[
  // growthBase values are in MINUTES per stage: [seed→sprout, sprout→young, young→mature, mature→harvest]
  {id:"wheat",       name:"Wheat",        emoji:"🌾", stageEmojis:["🌱","🌿","🌾","🌾","🌾"], harvestItem:"wheat",       harvestEmoji:"🌾", plantCost:2, growthBase:[5,6,7,5]},       // 23 min total
  {id:"barley",      name:"Barley",       emoji:"🌿", stageEmojis:["🌱","🌿","🌿","🌿","🌿"], harvestItem:"barley",      harvestEmoji:"🌿", plantCost:2, growthBase:[5,6,7,5]},       // 23 min total
  {id:"grape",       name:"Grape Vine",   emoji:"🍇", stageEmojis:["🌱","🌿","🍃","🍇","🍇"], harvestItem:"grapes",      harvestEmoji:"🍇", plantCost:3, growthBase:[5,7,8,5]},       // 25 min total
  {id:"fig",         name:"Fig Tree",     emoji:"🌳", stageEmojis:["🌱","🌿","🌳","🌳","🌳"], harvestItem:"figs",        harvestEmoji:"🫒", plantCost:4, growthBase:[6,7,9,6]},       // 28 min total
  {id:"olive",       name:"Olive Tree",   emoji:"🫒", stageEmojis:["🌱","🌿","🌳","🫒","🫒"], harvestItem:"olives",      harvestEmoji:"🫒", plantCost:5, growthBase:[6,8,10,6]},      // 30 min total
  {id:"pomegranate", name:"Pomegranate",  emoji:"🍎", stageEmojis:["🌱","🌿","🌳","🍎","🍎"], harvestItem:"pomegranates",harvestEmoji:"🍎", plantCost:6, growthBase:[7,8,11,7]},      // 33 min total
  {id:"date_palm",   name:"Date Palm",    emoji:"🌴", stageEmojis:["🌱","🌿","🌴","🌴","🌴"], harvestItem:"dates",       harvestEmoji:"🌴", plantCost:7, growthBase:[7,9,12,7]},      // 35 min total
];
const GROWTH_STAGES=["seed","sprout","young plant","mature plant","harvestable"];
const PRAYER_BONUS_MINS=2; // each prayer reduces each stage by 2 min

/* ═══════════════════════════════════════════════════
   PRAYER GARDEN — CRAFTING STATIONS
═══════════════════════════════════════════════════ */
const CRAFTING_STATIONS=[
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
const ITEM_CATALOG = {
  // === Seeds ===
  herb_seed:    { name:"Herb Seeds",    emoji:"🌿", cat:"seeds",   buyPrice:2,  sellPrice:1  },
  carrot_seed:  { name:"Carrot Seeds",  emoji:"🥕", cat:"seeds",   buyPrice:3,  sellPrice:1  },
  onion_seed:   { name:"Onion Seeds",   emoji:"🧅", cat:"seeds",   buyPrice:3,  sellPrice:1  },
  potato_seed:  { name:"Potato Seeds",  emoji:"🥔", cat:"seeds",   buyPrice:4,  sellPrice:2  },
  tomato_seed:  { name:"Tomato Seeds",  emoji:"🍅", cat:"seeds",   buyPrice:5,  sellPrice:2  },
  wheat_seed:   { name:"Wheat Seeds",   emoji:"🌾", cat:"seeds",   buyPrice:4,  sellPrice:2  },
  // === Garden Crops ===
  herbs:    { name:"Herbs",    emoji:"🌿", cat:"crops", sellPrice:3  },
  carrot:   { name:"Carrot",   emoji:"🥕", cat:"crops", sellPrice:5  },
  onion:    { name:"Onion",    emoji:"🧅", cat:"crops", sellPrice:5  },
  potato:   { name:"Potato",   emoji:"🥔", cat:"crops", sellPrice:6  },
  tomato:   { name:"Tomato",   emoji:"🍅", cat:"crops", sellPrice:7  },
  wheat:    { name:"Wheat",    emoji:"🌾", cat:"crops", sellPrice:4  },
  barley:   { name:"Barley",   emoji:"🌾", cat:"crops", sellPrice:4  },
  grapes:   { name:"Grapes",   emoji:"🍇", cat:"crops", sellPrice:6  },
  figs:     { name:"Figs",     emoji:"🫐", cat:"crops", sellPrice:7  },
  olives:   { name:"Olives",   emoji:"🫒", cat:"crops", sellPrice:8  },
  pomegranates:{ name:"Pomegranates", emoji:"🍎", cat:"crops", sellPrice:9 },
  dates:    { name:"Dates",    emoji:"🌴", cat:"crops", sellPrice:10 },
  // === Foraged / Ingredients ===
  mushrooms:{ name:"Mushrooms", emoji:"🍄", cat:"ingredients", buyPrice:4,  sellPrice:3  },
  berries:  { name:"Berries",   emoji:"🫐", cat:"ingredients", buyPrice:3,  sellPrice:2  },
  // === Animal Products ===
  eggs:  { name:"Eggs",  emoji:"🥚", cat:"ingredients", buyPrice:5,  sellPrice:4  },
  milk:  { name:"Milk",  emoji:"🥛", cat:"ingredients", buyPrice:5,  sellPrice:4  },
  honey: { name:"Honey", emoji:"🍯", cat:"ingredients", buyPrice:8,  sellPrice:6  },
  // === Crafted Intermediates ===
  olive_oil:    { name:"Olive Oil",    emoji:"🫗", cat:"ingredients", sellPrice:12 },
  lamp_oil:     { name:"Lamp Oil",     emoji:"🪔", cat:"ingredients", sellPrice:10 },
  flour:        { name:"Flour",        emoji:"🌾", cat:"ingredients", sellPrice:6  },
  barley_flour: { name:"Barley Flour", emoji:"🌾", cat:"ingredients", sellPrice:6  },
  dried_figs:   { name:"Dried Figs",   emoji:"🫘", cat:"ingredients", sellPrice:10 },
  dried_dates:  { name:"Dried Dates",  emoji:"🫘", cat:"ingredients", sellPrice:10 },
  raisins:      { name:"Raisins",      emoji:"🫐", cat:"ingredients", sellPrice:8  },
  flatbread:    { name:"Flatbread",    emoji:"🫓", cat:"cooked",      sellPrice:12 },
  // === Cooked Foods ===
  vegetable_soup:     { name:"Vegetable Soup",     emoji:"🍲", cat:"cooked", sellPrice:15 },
  bread:              { name:"Bread",              emoji:"🍞", cat:"cooked", sellPrice:12 },
  roasted_vegetables: { name:"Roasted Vegetables", emoji:"🥘", cat:"cooked", sellPrice:14 },
  stew:               { name:"Stew",               emoji:"🥘", cat:"cooked", sellPrice:22 },
  honey_cake:         { name:"Honey Cake",         emoji:"🍰", cat:"cooked", sellPrice:20 },
  fruit_salad:        { name:"Fruit Salad",        emoji:"🥗", cat:"cooked", sellPrice:16 },
};

/* ═══════════════════════════════════════════════════
   ECONOMY — KITCHEN RECIPES
═══════════════════════════════════════════════════ */
const KITCHEN_RECIPES = [
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
const NPC_TRADES = [
  { id:"t1", npc:"Old Farmer",  offer:{eggs:2},                      want:{wheat:3},      emoji:"👨‍🌾" },
  { id:"t2", npc:"Beekeeper",   offer:{honey:1},                     want:{berries:3},    emoji:"🧑‍🌾" },
  { id:"t3", npc:"Shepherd",    offer:{milk:2},                      want:{herbs:2},      emoji:"🧑" },
  { id:"t4", npc:"Forager",     offer:{mushrooms:3},                 want:{bread:1},      emoji:"🧙" },
  { id:"t5", npc:"Traveler",    offer:{tomato_seed:2,carrot_seed:2}, want:{olive_oil:1},  emoji:"🧳" },
];

/* ═══════════════════════════════════════════════════
   ECONOMY — FARM CROPS (seed-based, no prayer link)
═══════════════════════════════════════════════════ */
const FARM_PLANTS = [
  { id:"herb",   name:"Herbs",   emoji:"🌿", stageEmojis:["🌱","🌿","🌿","🌿","🌿"], harvestItem:"herbs",  seedItem:"herb_seed",   growthBase:[2,3,3,2],   plantCost:0 },
  { id:"carrot", name:"Carrot",  emoji:"🥕", stageEmojis:["🌱","🌿","🥕","🥕","🥕"], harvestItem:"carrot", seedItem:"carrot_seed", growthBase:[4,6,6,4],   plantCost:0 },
  { id:"onion",  name:"Onion",   emoji:"🧅", stageEmojis:["🌱","🌿","🧅","🧅","🧅"], harvestItem:"onion",  seedItem:"onion_seed",  growthBase:[4,6,6,4],   plantCost:0 },
  { id:"potato", name:"Potato",  emoji:"🥔", stageEmojis:["🌱","🌿","🥔","🥔","🥔"], harvestItem:"potato", seedItem:"potato_seed", growthBase:[5,7,8,5],   plantCost:0 },
  { id:"tomato", name:"Tomato",  emoji:"🍅", stageEmojis:["🌱","🌿","🍅","🍅","🍅"], harvestItem:"tomato", seedItem:"tomato_seed", growthBase:[6,8,9,7],   plantCost:0 },
  { id:"wheat_farm", name:"Wheat", emoji:"🌾", stageEmojis:["🌱","🌿","🌾","🌾","🌾"], harvestItem:"wheat", seedItem:"wheat_seed", growthBase:[10,12,13,10], plantCost:0 },
];

async function dbLoad(k){
  try{
    if(window.storage){const r=await window.storage.get(k);return r?.value?JSON.parse(r.value):null;}
    const v=localStorage.getItem(k);return v?JSON.parse(v):null;
  }catch{return null;}
}
async function dbSave(k,v){
  try{
    if(window.storage){await window.storage.set(k,JSON.stringify(v));return;}
    localStorage.setItem(k,JSON.stringify(v));
    // Dual-write to Firestore when signed in
    if(auth?.currentUser){
      const fieldMap={"irj-entries":"entries","irj-prayer":"prayerPosts","irj-saved-cards":"savedCards","irj-onboarded":"isOnboarded","irj-candles":"candles","irj-prayed":"prayedFor","irj-owned-items":"ownedItems","irj-garden":"gardenPlots","irj-inventory":"inventory","irj-saved-verses":"savedVerses","irj-bank":"bank","irj-sell-basket":"sellBasket","irj-farm-plots":"farmPlots"};
      const field=fieldMap[k];
      if(field){
        const userRef=doc(db,"users",auth.currentUser.uid);
        await setDoc(userRef,{[field]:v,lastSyncedAt:new Date().toISOString()},{merge:true});
      }
    }
  }catch(e){console.error("dbSave:",e);}
}

/* ═══════════════════════════════════════════════════
   CANVAS CARD RENDERER
═══════════════════════════════════════════════════ */
function renderCard(canvas, {question, theme, ratio}){
  const ctx=canvas.getContext("2d");
  const {w,h}=ratio;
  canvas.width=w; canvas.height=h;
  const colors=theme.bg.match(/#[0-9A-Fa-f]{6}/g)||["#1A1612","#2A1E18"];
  const g=ctx.createLinearGradient(0,0,w,h);
  colors.forEach((c,i)=>g.addColorStop(i/Math.max(colors.length-1,1),c));
  ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
  // noise
  const nd=ctx.getImageData(0,0,w,h);
  for(let i=0;i<nd.data.length;i+=4){const n=(Math.random()-.5)*10;nd.data[i]=Math.min(255,Math.max(0,nd.data[i]+n));nd.data[i+1]=Math.min(255,Math.max(0,nd.data[i+1]+n));nd.data[i+2]=Math.min(255,Math.max(0,nd.data[i+2]+n));}
  ctx.putImageData(nd,0,0);
  // glow
  const gl=ctx.createRadialGradient(w*.5,h*.35,0,w*.5,h*.35,w*.65);
  gl.addColorStop(0,theme.dot+"18"); gl.addColorStop(1,"transparent");
  ctx.fillStyle=gl; ctx.fillRect(0,0,w,h);
  // top line
  const lg=ctx.createLinearGradient(w*.2,0,w*.8,0);
  lg.addColorStop(0,"transparent"); lg.addColorStop(.5,theme.dot+"88"); lg.addColorStop(1,"transparent");
  ctx.strokeStyle=lg; ctx.lineWidth=2;
  ctx.beginPath(); ctx.moveTo(w*.2,h*.08); ctx.lineTo(w*.8,h*.08); ctx.stroke();
  ctx.beginPath(); ctx.arc(w*.5,h*.08,4,0,Math.PI*2); ctx.fillStyle=theme.dot; ctx.fill();
  // brand label
  ctx.font=`500 ${ratio.id==="wide"?18:22}px DM Sans,sans-serif`;
  ctx.fillStyle=theme.sub; ctx.textAlign="center";
  ctx.fillText("INNER ROOM JOURNAL",w*.5,h*.15);
  // question
  const ff=theme.fontType==="display"?"'Playfair Display',serif":theme.fontType==="sans"?"DM Sans,sans-serif":"'Cormorant Garamond',serif";
  const qlen=question.length;
  let fs=ratio.id==="wide"?52:ratio.id==="story"?72:68;
  if(qlen>60)fs*=.88; if(qlen>80)fs*=.82; if(qlen>100)fs*=.78;
  ctx.font=`italic ${fs}px ${ff}`; ctx.fillStyle=theme.text;
  const maxW=w*(ratio.id==="wide"?.72:.78);
  const words=question.split(" "); const lines=[]; let cur="";
  for(const wd of words){const t=cur?cur+" "+wd:wd;if(ctx.measureText(t).width>maxW&&cur){lines.push(cur);cur=wd;}else cur=t;}
  if(cur)lines.push(cur);
  const lh=fs*1.55; const totalH=lines.length*lh;
  const sy=(ratio.id==="story"?h*.45:h*.48)-totalH/2+lh*.5;
  lines.forEach((l,i)=>ctx.fillText(l,w*.5,sy+i*lh));
  // bottom line + brand
  const by=ratio.id==="story"?h*.8:h*.84;
  const lg2=ctx.createLinearGradient(w*.3,0,w*.7,0);
  lg2.addColorStop(0,"transparent"); lg2.addColorStop(.5,theme.dot+"44"); lg2.addColorStop(1,"transparent");
  ctx.strokeStyle=lg2; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(w*.3,by); ctx.lineTo(w*.7,by); ctx.stroke();
  ctx.font=`300 ${ratio.id==="wide"?20:26}px 'Cormorant Garamond',serif`;
  ctx.fillStyle=theme.brand;
  ctx.fillText("inner room journal",w*.5,by+36);
}

/* ═══════════════════════════════════════════════════
   VERSE CARD RENDERER (canvas)
═══════════════════════════════════════════════════ */
function renderVerseCard(canvas,{text,ref,theme,ratio}){
  const ctx=canvas.getContext("2d");
  const {w,h}=ratio;
  canvas.width=w;canvas.height=h;
  const colors=theme.bg.match(/#[0-9A-Fa-f]{6}/g)||["#12101A","#1E1828"];
  const g=ctx.createLinearGradient(0,0,w,h);
  colors.forEach((c,i)=>g.addColorStop(i/Math.max(colors.length-1,1),c));
  ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  // noise
  const nd=ctx.getImageData(0,0,w,h);
  for(let i=0;i<nd.data.length;i+=4){const n=(Math.random()-.5)*8;nd.data[i]=Math.min(255,Math.max(0,nd.data[i]+n));nd.data[i+1]=Math.min(255,Math.max(0,nd.data[i+1]+n));nd.data[i+2]=Math.min(255,Math.max(0,nd.data[i+2]+n));}
  ctx.putImageData(nd,0,0);
  // glow
  const gl=ctx.createRadialGradient(w*.5,h*.38,0,w*.5,h*.38,w*.6);
  gl.addColorStop(0,theme.dot+"14");gl.addColorStop(1,"transparent");
  ctx.fillStyle=gl;ctx.fillRect(0,0,w,h);
  // top line + dot
  const lg=ctx.createLinearGradient(w*.2,0,w*.8,0);
  lg.addColorStop(0,"transparent");lg.addColorStop(.5,theme.dot+"66");lg.addColorStop(1,"transparent");
  ctx.strokeStyle=lg;ctx.lineWidth=1.5;
  ctx.beginPath();ctx.moveTo(w*.25,h*.1);ctx.lineTo(w*.75,h*.1);ctx.stroke();
  ctx.beginPath();ctx.arc(w*.5,h*.1,3,0,Math.PI*2);ctx.fillStyle=theme.dot;ctx.fill();
  // verse text
  const ff=theme.fontType==="display"?"'Playfair Display',serif":theme.fontType==="sans"?"DM Sans,sans-serif":"'Cormorant Garamond',serif";
  let fs=ratio.id==="wide"?44:ratio.id==="story"?58:54;
  if(text.length>100) fs*=0.85;
  if(text.length>200) fs*=0.80;
  if(text.length>300) fs*=0.75;
  if(text.length>450) fs*=0.70;
  ctx.font=`italic ${fs}px ${ff}`;
  ctx.fillStyle=theme.text;
  ctx.textAlign="center";
  const maxW=w*(ratio.id==="wide"?.72:.78);
  const words=text.split(" ");const lines=[];let cur="";
  for(const wd of words){const t=cur?cur+" "+wd:wd;if(ctx.measureText(t).width>maxW&&cur){lines.push(cur);cur=wd;}else cur=t;}
  if(cur)lines.push(cur);
  const lh=fs*1.5;const totalH=lines.length*lh;
  const sy=(ratio.id==="story"?h*.42:h*.44)-totalH/2+lh*.5;
  lines.forEach((l,i)=>ctx.fillText(l,w*.5,sy+i*lh));
  // reference
  const refY=sy+totalH+fs*0.6;
  ctx.font=`500 ${ratio.id==="wide"?22:28}px DM Sans,sans-serif`;
  ctx.fillStyle=theme.sub;
  ctx.fillText("-- "+ref,w*.5,refY);
  // bottom line + brand
  const by=ratio.id==="story"?h*.82:h*.86;
  const lg2=ctx.createLinearGradient(w*.3,0,w*.7,0);
  lg2.addColorStop(0,"transparent");lg2.addColorStop(.5,theme.dot+"44");lg2.addColorStop(1,"transparent");
  ctx.strokeStyle=lg2;ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(w*.3,by);ctx.lineTo(w*.7,by);ctx.stroke();
  ctx.font=`300 ${ratio.id==="wide"?20:26}px 'Cormorant Garamond',serif`;
  ctx.fillStyle=theme.brand;
  ctx.fillText("inner room journal",w*.5,by+36);
}

/* ═══════════════════════════════════════════════════
   CARD PREVIEW (live CSS)
═══════════════════════════════════════════════════ */
function CardPreview({question,theme,ratio,scale=1}){
  const isStory=ratio.id==="story",isWide=ratio.id==="wide";
  const pw=isWide?340:isStory?200:270,ph=isWide?178:isStory?356:270;
  const ff=theme.fontType==="display"?DISPLAY:theme.fontType==="sans"?SANS:SERIF;
  const qs=question.length>80?"0.82rem":isWide?"0.85rem":isStory?"1rem":"0.98rem";
  return(
    <div style={{width:pw,height:ph,background:theme.bg,borderRadius:"12px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"20px",boxSizing:"border-box",position:"relative",overflow:"hidden",boxShadow:"0 16px 48px rgba(0,0,0,0.3)",transform:`scale(${scale})`,transformOrigin:"center",flexShrink:0}}>
      <div style={{position:"absolute",top:"30%",left:"50%",transform:"translate(-50%,-50%)",width:"70%",height:"70%",borderRadius:"50%",background:`radial-gradient(ellipse,${theme.dot}14 0%,transparent 70%)`,pointerEvents:"none"}}/>
      <div style={{position:"absolute",top:"10%",left:"15%",right:"15%",height:"1px",background:`linear-gradient(90deg,transparent,${theme.dot}66,transparent)`}}/>
      <div style={{position:"absolute",top:"calc(10% - 3px)",left:"50%",transform:"translateX(-50%)",width:"6px",height:"6px",borderRadius:"50%",background:theme.dot}}/>
      <div style={{fontFamily:SANS,fontSize:"0.48rem",letterSpacing:"0.18em",color:theme.sub,textTransform:"uppercase",fontWeight:600,position:"absolute",top:"17%",textAlign:"center"}}>Inner Room Journal</div>
      <p style={{fontFamily:ff,fontStyle:"italic",fontSize:qs,color:theme.text,textAlign:"center",lineHeight:1.65,margin:"8px 0",padding:"0 4px",maxWidth:"100%"}}>{question}</p>
      <div style={{position:"absolute",bottom:"14%",display:"flex",flexDirection:"column",alignItems:"center",gap:"5px"}}>
        <div style={{width:"36px",height:"1px",background:`linear-gradient(90deg,transparent,${theme.dot}44,transparent)`}}/>
        <div style={{fontFamily:SERIF,fontSize:"0.55rem",color:theme.brand,letterSpacing:"0.06em"}}>inner room journal</div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   VERSE PREVIEW (live CSS)
═══════════════════════════════════════════════════ */
function VersePreview({text,refText,theme,ratio,scale=1}){
  const isStory=ratio.id==="story",isWide=ratio.id==="wide";
  const pw=isWide?340:isStory?200:270,ph=isWide?178:isStory?356:270;
  const ff=theme.fontType==="display"?DISPLAY:theme.fontType==="sans"?SANS:SERIF;
  const qs=text.length>150?"0.68rem":text.length>80?"0.78rem":isWide?"0.82rem":isStory?"0.92rem":"0.88rem";
  return(
    <div style={{width:pw,height:ph,background:theme.bg,borderRadius:12,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:16,boxSizing:"border-box",position:"relative",overflow:"hidden",boxShadow:"0 16px 48px rgba(0,0,0,0.3)",transform:`scale(${scale})`,transformOrigin:"center",flexShrink:0}}>
      <div style={{position:"absolute",top:"35%",left:"50%",transform:"translate(-50%,-50%)",width:"70%",height:"70%",borderRadius:"50%",background:`radial-gradient(ellipse,${theme.dot}14 0%,transparent 70%)`,pointerEvents:"none"}}/>
      <div style={{position:"absolute",top:"10%",left:"20%",right:"20%",height:"1px",background:`linear-gradient(90deg,transparent,${theme.dot}55,transparent)`}}/>
      <div style={{position:"absolute",top:"calc(10% - 2px)",left:"50%",transform:"translateX(-50%)",width:5,height:5,borderRadius:"50%",background:theme.dot}}/>
      <p style={{fontFamily:ff,fontStyle:"italic",fontSize:qs,color:theme.text,textAlign:"center",lineHeight:1.55,margin:"0 0 6px",padding:"0 4px",maxWidth:"100%",display:"-webkit-box",WebkitLineClamp:isStory?8:5,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{text}</p>
      <p style={{fontFamily:SANS,fontSize:"0.52rem",color:theme.sub,margin:"4px 0 0",letterSpacing:"0.04em"}}>-- {refText}</p>
      <div style={{position:"absolute",bottom:"12%",display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
        <div style={{width:30,height:"1px",background:`linear-gradient(90deg,transparent,${theme.dot}44,transparent)`}}/>
        <div style={{fontFamily:SERIF,fontSize:"0.48rem",color:theme.brand,letterSpacing:"0.06em"}}>inner room journal</div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   SMALL SHARED COMPONENTS
═══════════════════════════════════════════════════ */
function Candle({size=40}){
  return(<svg width={size} height={size*1.4} viewBox="0 0 48 67" fill="none"><ellipse cx="24" cy="10" rx="8" ry="12" fill="rgba(201,169,110,0.15)" style={{animation:"flicker 2.4s ease-in-out infinite"}}/><ellipse cx="24" cy="13" rx="5" ry="8" fill="rgba(201,169,110,0.25)" style={{animation:"flicker 1.8s ease-in-out infinite reverse"}}/><ellipse cx="24" cy="16" rx="3" ry="5" fill={B.goldL}/><ellipse cx="24" cy="17" rx="1.5" ry="2.5" fill="#FFF8E0"/><rect x="18" y="18" width="12" height="38" rx="2" fill="rgba(250,247,242,0.9)"/><line x1="24" y1="18" x2="24" y2="13" stroke={B.gold} strokeWidth="1.5" strokeLinecap="round"/></svg>);
}
function Stars(){
  const s=useMemo(()=>Array.from({length:55},(_,i)=>({id:i,x:Math.random()*100,y:Math.random()*100,sz:Math.random()*1.5+.5,d:Math.random()*3})),[]);
  return(<div style={{position:"absolute",inset:0,pointerEvents:"none",overflow:"hidden"}}>{s.map(s=><div key={s.id} style={{position:"absolute",left:`${s.x}%`,top:`${s.y}%`,width:`${s.sz}px`,height:`${s.sz}px`,borderRadius:"50%",background:"rgba(255,255,255,0.7)",animation:`twinkle ${2+s.d}s ease-in-out infinite`,animationDelay:`${s.d}s`}}/>)}</div>);
}
function Fireflies(){
  const f=useMemo(()=>Array.from({length:22},(_,i)=>({id:i,x:Math.random()*90+5,y:Math.random()*60+20,sz:Math.random()*4+2,dur:Math.random()*4+3,del:Math.random()*5})),[]);
  return(<div style={{position:"absolute",inset:0,pointerEvents:"none",overflow:"hidden"}}>{f.map(f=><div key={f.id} style={{position:"absolute",left:`${f.x}%`,top:`${f.y}%`,width:`${f.sz}px`,height:`${f.sz}px`,borderRadius:"50%",background:"radial-gradient(circle,rgba(255,240,150,0.9),rgba(201,169,110,0.4),transparent)",boxShadow:`0 0 ${f.sz*2}px rgba(255,240,150,0.5)`,animation:`firefly ${f.dur}s ease-in-out infinite`,animationDelay:`${f.del}s`}}/>)}</div>);
}
function ChimneySmoke(){
  const particles=useMemo(()=>Array.from({length:8},(_,i)=>({id:i,x:Math.random()*16-8,dur:4+Math.random()*3,del:Math.random()*4,sz:6+Math.random()*8})),[]);
  return(<div style={{position:"absolute",top:"22%",left:"52%",pointerEvents:"none",zIndex:3}}>{particles.map(p=><div key={p.id} style={{position:"absolute",left:`${p.x}px`,width:`${p.sz}px`,height:`${p.sz}px`,borderRadius:"50%",background:"radial-gradient(circle,rgba(200,195,190,0.35),transparent)",animation:`smokeDrift ${p.dur}s ease-out infinite`,animationDelay:`${p.del}s`}}/>)}</div>);
}
function CabinWindowGlow(){
  return(<div style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:3}}>
    <div style={{position:"absolute",top:"38%",left:"42%",width:"18px",height:"24px",background:"rgba(255,200,80,0.15)",borderRadius:"2px",animation:"windowGlow 2.5s ease-in-out infinite"}}/>
    <div style={{position:"absolute",top:"38%",left:"54%",width:"18px",height:"24px",background:"rgba(255,200,80,0.15)",borderRadius:"2px",animation:"windowGlow 2.5s ease-in-out infinite",animationDelay:"0.5s"}}/>
  </div>);
}
function WaterShimmer(){
  return(<div style={{position:"absolute",bottom:"15%",left:"10%",width:"35%",height:"8%",pointerEvents:"none",zIndex:3,opacity:0.25,borderRadius:"40%",background:"linear-gradient(90deg,transparent,rgba(180,220,255,0.4),transparent,rgba(180,220,255,0.3),transparent)",backgroundSize:"200% 100%",animation:"waterShimmer 6s linear infinite"}}/>);
}
function CabinCandleGlow(){
  return(<div style={{position:"absolute",bottom:"20%",left:"50%",transform:"translateX(-50%)",width:"320px",height:"220px",background:"radial-gradient(ellipse,rgba(255,200,80,0.07),transparent 70%)",pointerEvents:"none",animation:"windowGlow 3s ease-in-out infinite",zIndex:3}}/>);
}
function LightRays(){
  return(<div style={{position:"absolute",inset:0,pointerEvents:"none",overflow:"hidden",zIndex:2}}>
    {[0,1,2].map(i=><div key={i} style={{position:"absolute",top:"-10%",left:`${20+i*25}%`,width:"80px",height:"120%",background:`linear-gradient(180deg,rgba(255,240,200,${0.04-i*0.01}),transparent 70%)`,transform:`rotate(${-5+i*5}deg)`,transformOrigin:"top center",opacity:0.7,animation:`lightRayShift ${8+i*2}s ease-in-out infinite alternate`}}/>)}
  </div>);
}
function DustMotes(){
  const motes=useMemo(()=>Array.from({length:15},(_,i)=>({id:i,x:Math.random()*90+5,y:Math.random()*80+10,sz:Math.random()*2+1,dur:Math.random()*8+6,del:Math.random()*6})),[]);
  return(<div style={{position:"absolute",inset:0,pointerEvents:"none",overflow:"hidden",zIndex:3}}>
    {motes.map(m=><div key={m.id} style={{position:"absolute",left:`${m.x}%`,top:`${m.y}%`,width:`${m.sz}px`,height:`${m.sz}px`,borderRadius:"50%",background:"rgba(255,240,200,0.5)",animation:`dustFloat ${m.dur}s ease-in-out infinite`,animationDelay:`${m.del}s`}}/>)}
  </div>);
}
function BookSparkles(){
  const sp=useMemo(()=>Array.from({length:12},(_,i)=>({id:i,x:20+Math.random()*60,y:10+Math.random()*80,d:Math.random()*4,dur:2+Math.random()*3,sz:2+Math.random()*3})),[]);
  return(<div style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:5}}>
    {sp.map(p=><div key={p.id} style={{position:"absolute",left:`${p.x}%`,top:`${p.y}%`,width:`${p.sz}px`,height:`${p.sz}px`,borderRadius:"50%",background:"radial-gradient(circle,rgba(255,220,130,0.9),rgba(255,200,80,0.3))",animation:`sparkle ${p.dur}s ${p.d}s ease-in-out infinite`}}/>)}
  </div>);
}
function ShelfParticles(){
  const sp=useMemo(()=>Array.from({length:18},(_,i)=>({id:i,x:72+Math.random()*26,y:24+Math.random()*40,d:Math.random()*6,dur:3+Math.random()*5,sz:1+Math.random()*2.5})),[]);
  return(<div style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:8}}>
    {sp.map(p=><div key={p.id} style={{position:"absolute",left:`${p.x}%`,top:`${p.y}%`,width:`${p.sz}px`,height:`${p.sz}px`,borderRadius:"50%",background:"radial-gradient(circle,rgba(255,220,130,0.7),rgba(201,169,110,0.2))",animation:`shelfDust ${p.dur}s ${p.d}s ease-in-out infinite`}}/>)}
  </div>);
}
function SectionLabel({label,color="#B0A098"}){
  return(<div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"12px"}}>
    <div style={{width:"14px",height:"2px",background:color,opacity:.7}}/>
    <span style={{fontSize:"0.66rem",fontFamily:SANS,fontWeight:600,letterSpacing:"0.14em",color:"#B0A098",textTransform:"uppercase"}}>{label}</span>
    <div style={{flex:1,height:"1px",background:"rgba(0,0,0,0.07)"}}/>
  </div>);
}
function UILabel({children}){
  return(<div style={{fontSize:"0.67rem",fontFamily:SANS,fontWeight:600,letterSpacing:"0.12em",color:"#B0A098",textTransform:"uppercase",marginBottom:"8px"}}>{children}</div>);
}
function PillBtn({children,active,color,onClick}){
  return(<button onClick={onClick} style={{background:active?(color||B.night):"#fff",border:`1px solid ${active?(color||B.night):B.beigeD}`,color:active?"#fff":B.inkM,padding:"6px 14px",borderRadius:"20px",cursor:"pointer",fontSize:"0.77rem",fontFamily:SANS,fontWeight:active?600:400,transition:"all 0.15s"}}>{children}</button>);
}

/* ═══════════════════════════════════════════════════
   ROOM BACKGROUND GLOW ART
═══════════════════════════════════════════════════ */
function RoomGlow({id}){
  const glows={
    men:     <><div style={{position:"absolute",bottom:0,left:0,right:0,height:"30%",background:"linear-gradient(to top,rgba(80,50,20,0.5),transparent)",pointerEvents:"none"}}/><div style={{position:"absolute",top:"15%",left:"8%",width:"3px",height:"50%",background:"rgba(120,80,40,0.4)",borderRadius:"2px",pointerEvents:"none"}}/></>,
    motherhood:<><div style={{position:"absolute",top:"10%",left:"15%",width:"16px",height:"16px",borderRadius:"50%",background:"rgba(255,180,200,0.4)",pointerEvents:"none"}}/><div style={{position:"absolute",top:"20%",right:"18%",width:"12px",height:"12px",borderRadius:"50%",background:"rgba(180,220,255,0.4)",pointerEvents:"none"}}/><div style={{position:"absolute",bottom:"25%",left:"22%",width:"14px",height:"14px",borderRadius:"50%",background:"rgba(220,255,200,0.4)",pointerEvents:"none"}}/></>,
    jesus:   <div style={{position:"absolute",top:"12%",left:"50%",transform:"translateX(-50%)",pointerEvents:"none",opacity:.18}}><div style={{width:"2px",height:"60px",background:"rgba(210,180,100,0.9)",margin:"0 auto"}}/><div style={{width:"36px",height:"2px",background:"rgba(210,180,100,0.9)",marginTop:"-40px",marginLeft:"-17px"}}/></div>,
  };
  return glows[id]||null;
}

/* ═══════════════════════════════════════════════════
   IMMERSIVE CABIN — Premium Parallax Interior (Temporary Fallback)
   Touch/gyroscope-responsive cabin with warm ambient effects.
   This is the temporary mode while the real 3D GLB cabin is being built.
   When the real model is ready, CabinScene3D will be restored and this
   component becomes the fallback for devices that can't run WebGL.

   BACKGROUND IMAGE REQUIREMENTS (approved concept art):
   The image must show the cabin from the couch perspective and include:
   - Gray L-shaped sectional couch in foreground
   - Stone fireplace with wooden cross on left wall
   - Massive panoramic window showing dark pine forest on back wall
   - Exposed beam ceiling with draped string lights
   - Large cream/white shag rug on dark wood floor
   - Coffee table with Bible and small cross
   - Desk nook with glowing lamp in far corner
   - Bookshelf full of books near fireplace
   - Horizontal wood plank wall paneling throughout
   See docs/CABIN_VISUAL_BUILD_BRIEF.md for full spec.
═══════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════
   IMMERSIVE KITCHEN — Cozy downstairs hearth
   Rustic kitchen with stone fireplace/stove LEFT, French doors
   CENTER opening to waterfall view, prep table CENTER,
   stairs going UP on RIGHT, baskets of produce, copper pans.
═══════════════════════════════════════════════════ */
const KITCHEN_BG_IMAGE="/kitchen.png";
const STOVE_BG_IMAGE="/stove.png";
const MARKET_BG_IMAGE="/market.png";
const KITCHEN_WINDOW_BG_IMAGE="/kitchen-window.png";
const UPPER_ROOM_BG_IMAGE="/upper-room-hall.png";

/* ═══════════════════════════════════════════════════
   AMBIENT SOUND MANAGER — Global singleton
   Only one ambient track plays at a time across all rooms.
   Handles fade-in / fade-out, looping, and mute state.
═══════════════════════════════════════════════════ */
const _amb = { el: null, timer: null, id: null, target: 0 };

function ambientPlay(src, { volume = 0.35, fadeMs = 2000, id = src } = {}) {
  // Already playing this exact track — do nothing
  if (_amb.id === id && _amb.el && !_amb.el.paused) return;
  // Stop any existing track instantly before starting new one
  ambientStop(0);
  try {
    const a = new Audio(src);
    a.loop = true;
    a.volume = 0;
    a.preload = "auto";
    _amb.el = a;
    _amb.id = id;
    _amb.target = volume;
    const promise = a.play();
    if (promise) promise.catch(() => {});
    // Fade in
    clearInterval(_amb.timer);
    if (fadeMs <= 0) { a.volume = volume; return; }
    const step = volume / (fadeMs / 50);
    let v = 0;
    _amb.timer = setInterval(() => {
      v = Math.min(volume, v + step);
      if (_amb.el === a) a.volume = v;
      if (v >= volume) clearInterval(_amb.timer);
    }, 50);
  } catch (e) { /* audio not supported */ }
}

function ambientStop(fadeMs = 2000) {
  const a = _amb.el;
  if (!a) return;
  clearInterval(_amb.timer);
  if (fadeMs <= 0) {
    a.pause(); try { a.src = ""; } catch (e) {}
    _amb.el = null; _amb.id = null; return;
  }
  const startVol = a.volume || _amb.target;
  const step = startVol / (fadeMs / 50);
  let v = startVol;
  _amb.timer = setInterval(() => {
    v = Math.max(0, v - step);
    a.volume = v;
    if (v <= 0) {
      clearInterval(_amb.timer);
      a.pause(); try { a.src = ""; } catch (e) {}
      if (_amb.el === a) { _amb.el = null; _amb.id = null; }
    }
  }, 50);
}

function ambientMute() {
  if (_amb.el) { _amb.el.volume = 0; }
}
function ambientUnmute() {
  if (_amb.el) { _amb.el.volume = _amb.target; }
}
function ambientIsPlaying(id) {
  return _amb.id === id && _amb.el && !_amb.el.paused;
}

/* Room-specific ambient tracks */
const AMBIENT_TRACKS = {
  "kitchen-window": { src: "/slrathna-sleep-water-calm-317558.mp3", volume: 0.35, id: "water-calm" },
};

/* ═══════════════════════════════════════════════════
   ImmersiveMarket — Parallax village market with lantern glow, fireflies, string light shimmer
═══════════════════════════════════════════════════ */
function ImmersiveMarket(){
  const containerRef=useRef(null);
  const canvasRef=useRef(null);
  const offsetX=useRef(0);
  const offsetY=useRef(0);
  const targetX=useRef(0);
  const targetY=useRef(0);
  const dragStart=useRef(null);
  const animFrame=useRef(null);
  const particles=useRef([]);
  const fireflies=useRef([]);
  const time=useRef(0);
  const imgRef=useRef(null);

  const PARALLAX=20;
  const SENSITIVITY=0.35;

  // Initialize particles — warm dust motes + fireflies along the path edges
  useEffect(()=>{
    const pts=[];
    for(let i=0;i<30;i++){
      pts.push({
        x:Math.random(),
        y:Math.random(),
        size:Math.random()*2+0.6,
        speed:Math.random()*0.0002+0.0001,
        drift:Math.random()*0.0003-0.00015,
        opacity:Math.random()*0.3+0.08,
        phase:Math.random()*Math.PI*2,
        warmth:Math.random(),
      });
    }
    particles.current=pts;
    // Fireflies — along flower beds and ground edges
    const ffs=[];
    for(let i=0;i<22;i++){
      const side=Math.random()>0.5;
      ffs.push({
        x:side?(0.02+Math.random()*0.22):(0.76+Math.random()*0.22),
        y:0.55+Math.random()*0.42,
        size:Math.random()*2+1.2,
        sx:(Math.random()-0.5)*0.0003,
        sy:(Math.random()-0.5)*0.0002,
        phase:Math.random()*Math.PI*2,
        blink:Math.random()*0.003+0.001,
      });
    }
    fireflies.current=ffs;
  },[]);

  // Gyroscope
  useEffect(()=>{
    let active=true;
    const handle=(e)=>{if(!active)return;targetX.current=Math.max(-1,Math.min(1,(e.gamma||0)/30))*PARALLAX;targetY.current=Math.max(-1,Math.min(1,((e.beta||0)-45)/30))*PARALLAX;};
    if(typeof DeviceOrientationEvent!=="undefined"&&typeof DeviceOrientationEvent.requestPermission==="function"){
      const req=()=>{DeviceOrientationEvent.requestPermission().then(r=>{if(r==="granted")window.addEventListener("deviceorientation",handle);}).catch(()=>{});window.removeEventListener("touchstart",req);};
      window.addEventListener("touchstart",req,{once:true});
    } else { window.addEventListener("deviceorientation",handle); }
    return()=>{active=false;window.removeEventListener("deviceorientation",handle);};
  },[]);

  // Touch/mouse drag
  useEffect(()=>{
    const el=containerRef.current; if(!el) return;
    const start=(x,y)=>{dragStart.current={x,y,ox:targetX.current,oy:targetY.current};};
    const move=(x,y)=>{if(!dragStart.current)return;targetX.current=Math.max(-PARALLAX,Math.min(PARALLAX,dragStart.current.ox+(x-dragStart.current.x)*SENSITIVITY));targetY.current=Math.max(-PARALLAX,Math.min(PARALLAX,dragStart.current.oy+(y-dragStart.current.y)*SENSITIVITY));};
    const end=()=>{dragStart.current=null;};
    const ts=e=>{const t=e.touches[0];start(t.clientX,t.clientY);};
    const tm=e=>{const t=e.touches[0];move(t.clientX,t.clientY);};
    el.addEventListener("touchstart",ts,{passive:true});el.addEventListener("touchmove",tm,{passive:true});el.addEventListener("touchend",end);
    el.addEventListener("mousedown",e=>start(e.clientX,e.clientY));
    const mm=e=>move(e.clientX,e.clientY);
    window.addEventListener("mousemove",mm);window.addEventListener("mouseup",end);
    return()=>{el.removeEventListener("touchstart",ts);el.removeEventListener("touchmove",tm);el.removeEventListener("touchend",end);window.removeEventListener("mousemove",mm);window.removeEventListener("mouseup",end);};
  },[]);

  // Animation loop
  useEffect(()=>{
    const loop=()=>{
      time.current+=16;
      offsetX.current+=(targetX.current-offsetX.current)*0.08;
      offsetY.current+=(targetY.current-offsetY.current)*0.08;
      const bx=Math.sin(time.current*0.0004)*2.5;
      const by=Math.cos(time.current*0.0003)*1.8;
      if(imgRef.current) imgRef.current.style.transform=`translate(${-PARALLAX+offsetX.current+bx}px,${-PARALLAX+offsetY.current+by}px)`;
      const cvs=canvasRef.current;
      if(cvs){
        const ctx=cvs.getContext("2d"),w=cvs.width,h=cvs.height;
        ctx.clearRect(0,0,w,h);
        // Warm floating dust motes
        particles.current.forEach(p=>{
          p.y-=p.speed;p.x+=p.drift+Math.sin(time.current*0.001+p.phase)*0.0001;
          if(p.y<-0.05){p.y=1.05;p.x=Math.random();}
          if(p.x<-0.05||p.x>1.05)p.x=Math.random();
          const fl=0.7+0.3*Math.sin(time.current*0.002+p.phase);
          const a=p.opacity*fl;
          const px=p.x*w,py=p.y*h;
          const r=255,g=Math.round(190+p.warmth*40),b=Math.round(80+p.warmth*60);
          ctx.beginPath();ctx.arc(px,py,p.size,0,Math.PI*2);ctx.fillStyle=`rgba(${r},${g},${b},${a})`;ctx.fill();
          if(p.size>1.5){ctx.beginPath();ctx.arc(px,py,p.size*3,0,Math.PI*2);ctx.fillStyle=`rgba(${r},${g},${b},${a*0.12})`;ctx.fill();}
        });
        // Fireflies along flower beds
        fireflies.current.forEach(ff=>{
          ff.x+=ff.sx+Math.sin(time.current*0.0005+ff.phase)*0.00012;
          ff.y+=ff.sy+Math.cos(time.current*0.0007+ff.phase)*0.00008;
          if(ff.x<0.01||ff.x>0.99)ff.sx*=-1;
          if(ff.y<0.50||ff.y>0.98)ff.sy*=-1;
          ff.x=Math.max(0.01,Math.min(0.99,ff.x));
          ff.y=Math.max(0.50,Math.min(0.98,ff.y));
          const blink=Math.sin(time.current*ff.blink+ff.phase);
          const a=Math.max(0,blink*0.7+0.3)*0.55;
          const px=ff.x*w,py=ff.y*h;
          ctx.beginPath();ctx.arc(px,py,ff.size*7,0,Math.PI*2);ctx.fillStyle=`rgba(160,255,90,${a*0.08})`;ctx.fill();
          ctx.beginPath();ctx.arc(px,py,ff.size*3.5,0,Math.PI*2);ctx.fillStyle=`rgba(180,255,100,${a*0.18})`;ctx.fill();
          ctx.beginPath();ctx.arc(px,py,ff.size,0,Math.PI*2);ctx.fillStyle=`rgba(210,255,140,${a})`;ctx.fill();
        });
      }
      animFrame.current=requestAnimationFrame(loop);
    };
    animFrame.current=requestAnimationFrame(loop);
    return()=>{if(animFrame.current)cancelAnimationFrame(animFrame.current);};
  },[]);

  // Resize
  useEffect(()=>{
    const resize=()=>{const c=canvasRef.current;if(c){c.width=window.innerWidth;c.height=window.innerHeight;}};
    resize();window.addEventListener("resize",resize);
    return()=>window.removeEventListener("resize",resize);
  },[]);

  return(
    <div ref={containerRef} style={{position:"absolute",inset:0,zIndex:0,overflow:"hidden",background:"#0A0810",cursor:"grab"}} onMouseDown={()=>{if(containerRef.current)containerRef.current.style.cursor="grabbing";}} onMouseUp={()=>{if(containerRef.current)containerRef.current.style.cursor="grab";}}>
      <img ref={imgRef} src={MARKET_BG_IMAGE} alt="Market" style={{position:"absolute",top:0,left:0,width:`calc(100% + ${PARALLAX*2}px)`,height:`calc(100% + ${PARALLAX*2}px)`,objectFit:"cover",transform:`translate(${-PARALLAX}px,${-PARALLAX}px)`,willChange:"transform",userSelect:"none",WebkitUserDrag:"none",pointerEvents:"none"}} draggable={false}/>
      {/* Warm lantern glow — left stalls */}
      <div style={{position:"absolute",left:"2%",top:"25%",width:"22%",height:"30%",pointerEvents:"none",zIndex:1,borderRadius:"50%",background:"radial-gradient(circle,rgba(255,180,60,0.12) 0%,transparent 65%)",mixBlendMode:"screen",animation:"stoveFireGlow 3.5s ease-in-out infinite"}}/>
      {/* Warm lantern glow — center stall */}
      <div style={{position:"absolute",left:"34%",top:"22%",width:"32%",height:"28%",pointerEvents:"none",zIndex:1,borderRadius:"50%",background:"radial-gradient(ellipse at 50% 55%,rgba(255,190,70,0.10) 0%,transparent 60%)",mixBlendMode:"screen",animation:"stoveFireGlow 4s ease-in-out infinite",animationDelay:"0.8s"}}/>
      {/* Warm lantern glow — right stalls */}
      <div style={{position:"absolute",right:"2%",top:"25%",width:"22%",height:"30%",pointerEvents:"none",zIndex:1,borderRadius:"50%",background:"radial-gradient(circle,rgba(255,180,60,0.12) 0%,transparent 65%)",mixBlendMode:"screen",animation:"stoveFireGlow 3.8s ease-in-out infinite",animationDelay:"1.5s"}}/>
      {/* String light shimmer across stalls */}
      <div style={{position:"absolute",left:"5%",right:"5%",top:"18%",height:"8%",pointerEvents:"none",zIndex:1,background:"linear-gradient(90deg, transparent 0%, rgba(255,220,120,0.04) 15%, rgba(255,210,100,0.06) 30%, rgba(255,220,120,0.03) 45%, rgba(255,210,100,0.06) 60%, rgba(255,220,120,0.04) 75%, transparent 100%)",mixBlendMode:"screen",animation:"kitchenSteam 5s ease-in-out infinite"}}/>
      {/* Path glow — warm light on cobblestones */}
      <div style={{position:"absolute",left:"25%",top:"50%",width:"50%",height:"45%",pointerEvents:"none",zIndex:1,background:"radial-gradient(ellipse at 50% 30%,rgba(255,190,100,0.06) 0%,transparent 65%)",mixBlendMode:"screen"}}/>
      {/* Particle canvas */}
      <canvas ref={canvasRef} style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:2}}/>
      {/* Cinematic vignette */}
      <div style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:3,background:"radial-gradient(ellipse at center 45%, transparent 30%, rgba(10,8,16,0.60) 100%)"}}/>
      {/* Top sky fade */}
      <div style={{position:"absolute",top:0,left:0,right:0,height:"20%",pointerEvents:"none",zIndex:3,background:"linear-gradient(to bottom, rgba(10,8,16,0.25), transparent)"}}/>
    </div>
  );
}

function ImmersiveKitchen(){
  const containerRef=useRef(null);
  const canvasRef=useRef(null);
  const offsetX=useRef(0);
  const offsetY=useRef(0);
  const targetX=useRef(0);
  const targetY=useRef(0);
  const dragStart=useRef(null);
  const animFrame=useRef(null);
  const kitchenParticles=useRef([]);
  const kitchenFireflies=useRef([]);
  const time=useRef(0);
  const imgRef=useRef(null);

  const PARALLAX=22;
  const SENSITIVITY=0.4;

  useEffect(()=>{
    // Warm embers / cooking steam particles
    const pts=[];
    for(let i=0;i<20;i++){
      pts.push({
        x:Math.random(),y:Math.random(),
        size:Math.random()*1.8+0.5,
        speed:Math.random()*0.0003+0.00012,
        drift:Math.random()*0.0003-0.00015,
        opacity:Math.random()*0.3+0.06,
        phase:Math.random()*Math.PI*2,
        warmth:Math.random(),
      });
    }
    kitchenParticles.current=pts;
    // Warm fireflies + ember sparks
    const ffs=[];
    for(let i=0;i<16;i++){
      ffs.push({
        x:0.06+Math.random()*0.88,
        y:0.10+Math.random()*0.80,
        size:Math.random()*1.6+1.0,
        sx:(Math.random()-0.5)*0.0002,
        sy:(Math.random()-0.5)*0.00015,
        phase:Math.random()*Math.PI*2,
        blink:Math.random()*0.003+0.001,
        isEmber:Math.random()>0.55,
      });
    }
    kitchenFireflies.current=ffs;
  },[]);

  useEffect(()=>{
    let active=true;
    const handle=(e)=>{if(!active)return;targetX.current=Math.max(-1,Math.min(1,(e.gamma||0)/30))*PARALLAX;targetY.current=Math.max(-1,Math.min(1,((e.beta||0)-45)/30))*PARALLAX;};
    if(typeof DeviceOrientationEvent!=="undefined"&&typeof DeviceOrientationEvent.requestPermission==="function"){
      const req=()=>{DeviceOrientationEvent.requestPermission().then(r=>{if(r==="granted")window.addEventListener("deviceorientation",handle);}).catch(()=>{});window.removeEventListener("touchstart",req);};
      window.addEventListener("touchstart",req,{once:true});
    } else { window.addEventListener("deviceorientation",handle); }
    return()=>{active=false;window.removeEventListener("deviceorientation",handle);};
  },[]);

  useEffect(()=>{
    const el=containerRef.current; if(!el) return;
    const start=(x,y)=>{dragStart.current={x,y,ox:targetX.current,oy:targetY.current};};
    const move=(x,y)=>{if(!dragStart.current)return;targetX.current=Math.max(-PARALLAX,Math.min(PARALLAX,dragStart.current.ox+(x-dragStart.current.x)*SENSITIVITY));targetY.current=Math.max(-PARALLAX,Math.min(PARALLAX,dragStart.current.oy+(y-dragStart.current.y)*SENSITIVITY));};
    const end=()=>{dragStart.current=null;};
    const ts=e=>{const t=e.touches[0];start(t.clientX,t.clientY);};
    const tm=e=>{const t=e.touches[0];move(t.clientX,t.clientY);};
    el.addEventListener("touchstart",ts,{passive:true});el.addEventListener("touchmove",tm,{passive:true});el.addEventListener("touchend",end);
    el.addEventListener("mousedown",e=>start(e.clientX,e.clientY));
    const mm=e=>move(e.clientX,e.clientY);
    window.addEventListener("mousemove",mm);window.addEventListener("mouseup",end);
    return()=>{el.removeEventListener("touchstart",ts);el.removeEventListener("touchmove",tm);el.removeEventListener("touchend",end);window.removeEventListener("mousemove",mm);window.removeEventListener("mouseup",end);};
  },[]);

  useEffect(()=>{
    const loop=()=>{
      time.current+=16;
      offsetX.current+=(targetX.current-offsetX.current)*0.08;
      offsetY.current+=(targetY.current-offsetY.current)*0.08;
      const bx=Math.sin(time.current*0.0004)*1.5;
      const by=Math.cos(time.current*0.0003)*1.2;
      if(imgRef.current) imgRef.current.style.transform=`translate(${-PARALLAX+offsetX.current+bx}px,${-PARALLAX+offsetY.current+by}px)`;
      const cvs=canvasRef.current;
      if(cvs){
        const ctx=cvs.getContext("2d"),w=cvs.width,h=cvs.height;
        ctx.clearRect(0,0,w,h);
        kitchenParticles.current.forEach(p=>{
          p.y-=p.speed; p.x+=p.drift+Math.sin(time.current*0.001+p.phase)*0.00008;
          if(p.y<-0.05){p.y=1.05;p.x=Math.random();}
          const fl=0.7+0.3*Math.sin(time.current*0.002+p.phase);
          const a=p.opacity*fl;
          const r=255,g=Math.round(190+p.warmth*40),b=Math.round(100+p.warmth*50);
          const px=p.x*w,py=p.y*h;
          ctx.beginPath();ctx.arc(px,py,p.size,0,Math.PI*2);
          ctx.fillStyle=`rgba(${r},${g},${b},${a})`;ctx.fill();
          if(p.size>1){ctx.beginPath();ctx.arc(px,py,p.size*2.5,0,Math.PI*2);ctx.fillStyle=`rgba(${r},${g},${b},${a*0.1})`;ctx.fill();}
        });
        kitchenFireflies.current.forEach(ff=>{
          ff.x+=ff.sx+Math.sin(time.current*0.0005+ff.phase)*0.00006;
          ff.y+=ff.sy+Math.cos(time.current*0.0006+ff.phase)*0.00005;
          if(ff.x<0.04||ff.x>0.96)ff.sx*=-1;
          if(ff.y<0.06||ff.y>0.90)ff.sy*=-1;
          ff.x=Math.max(0.04,Math.min(0.96,ff.x));
          ff.y=Math.max(0.06,Math.min(0.90,ff.y));
          const blink=Math.sin(time.current*ff.blink+ff.phase);
          const a=Math.max(0,blink*0.7+0.3)*0.5;
          const px=ff.x*w,py=ff.y*h;
          if(ff.isEmber){
            ctx.beginPath();ctx.arc(px,py,ff.size*5,0,Math.PI*2);ctx.fillStyle=`rgba(255,140,40,${a*0.06})`;ctx.fill();
            ctx.beginPath();ctx.arc(px,py,ff.size*2.5,0,Math.PI*2);ctx.fillStyle=`rgba(255,160,60,${a*0.15})`;ctx.fill();
            ctx.beginPath();ctx.arc(px,py,ff.size*0.8,0,Math.PI*2);ctx.fillStyle=`rgba(255,180,80,${a})`;ctx.fill();
          } else {
            ctx.beginPath();ctx.arc(px,py,ff.size*5,0,Math.PI*2);ctx.fillStyle=`rgba(255,210,100,${a*0.05})`;ctx.fill();
            ctx.beginPath();ctx.arc(px,py,ff.size*2.5,0,Math.PI*2);ctx.fillStyle=`rgba(255,220,120,${a*0.12})`;ctx.fill();
            ctx.beginPath();ctx.arc(px,py,ff.size,0,Math.PI*2);ctx.fillStyle=`rgba(255,230,150,${a*0.8})`;ctx.fill();
          }
        });
      }
      animFrame.current=requestAnimationFrame(loop);
    };
    animFrame.current=requestAnimationFrame(loop);
    return()=>{if(animFrame.current)cancelAnimationFrame(animFrame.current);};
  },[]);

  useEffect(()=>{
    const resize=()=>{const c=canvasRef.current;if(c){c.width=window.innerWidth;c.height=window.innerHeight;}};
    resize();window.addEventListener("resize",resize);
    return()=>window.removeEventListener("resize",resize);
  },[]);

  return(
    <div ref={containerRef} style={{position:"absolute",inset:0,zIndex:0,overflow:"hidden",background:"#0A0604",cursor:"grab"}} onMouseDown={()=>{if(containerRef.current)containerRef.current.style.cursor="grabbing";}} onMouseUp={()=>{if(containerRef.current)containerRef.current.style.cursor="grab";}}>
      <img ref={imgRef} src={KITCHEN_BG_IMAGE} alt="Kitchen" style={{position:"absolute",top:0,left:0,width:`calc(100% + ${PARALLAX*2}px)`,height:`calc(100% + ${PARALLAX*2}px)`,objectFit:"cover",transform:`translate(${-PARALLAX}px,${-PARALLAX}px)`,willChange:"transform",userSelect:"none",WebkitUserDrag:"none",pointerEvents:"none"}} draggable={false}/>
      {/* Stove fire glow — warm radial on upper-left fireplace */}
      <div style={{position:"absolute",left:"2%",top:"8%",width:"38%",height:"35%",pointerEvents:"none",zIndex:1,borderRadius:"40%",background:"radial-gradient(ellipse at 50% 65%,rgba(255,140,40,0.12) 0%,rgba(255,100,20,0.04) 45%,transparent 75%)",mixBlendMode:"screen",animation:"kitchenFireGlow 3s ease-in-out infinite"}}/>
      {/* Candle glow — scattered warm lights on stairs */}
      <div style={{position:"absolute",right:"3%",top:"15%",width:"18%",height:"60%",pointerEvents:"none",zIndex:1,background:"radial-gradient(ellipse at 50% 30%,rgba(255,180,60,0.06) 0%,transparent 70%)",mixBlendMode:"screen"}}/>
      {/* Sunset glow through open doors */}
      <div style={{position:"absolute",left:"28%",top:"5%",width:"44%",height:"55%",pointerEvents:"none",zIndex:1,background:"radial-gradient(ellipse at 50% 45%,rgba(255,200,140,0.06) 0%,transparent 65%)",mixBlendMode:"screen"}}/>
      {/* Warm floor glow */}
      <div style={{position:"absolute",left:"20%",top:"70%",width:"60%",height:"30%",pointerEvents:"none",zIndex:1,background:"radial-gradient(ellipse at 50% 30%,rgba(255,180,90,0.04) 0%,transparent 60%)",mixBlendMode:"screen"}}/>
      <canvas ref={canvasRef} style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:2}}/>
      {/* Cinematic vignette */}
      <div style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:3,background:"radial-gradient(ellipse at center 55%, transparent 25%, rgba(8,6,4,0.55) 100%)"}}/>
      <div style={{position:"absolute",top:0,left:0,right:0,height:"18%",pointerEvents:"none",zIndex:3,background:"linear-gradient(to bottom, rgba(8,6,4,0.3), transparent)"}}/>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   IMMERSIVE STOVE — Closeup cooking view
   Stone hearth with roaring fire, cast iron kettle,
   pot, spices, herbs. Where users cook ingredients.
═══════════════════════════════════════════════════ */
function ImmersiveStove(){
  const containerRef=useRef(null);
  const canvasRef=useRef(null);
  const offsetX=useRef(0);
  const offsetY=useRef(0);
  const targetX=useRef(0);
  const targetY=useRef(0);
  const dragStart=useRef(null);
  const animFrame=useRef(null);
  const embers=useRef([]);
  const flames=useRef([]);
  const time=useRef(0);
  const imgRef=useRef(null);

  const PARALLAX=18;
  const SENSITIVITY=0.35;

  useEffect(()=>{
    const pts=[];
    for(let i=0;i<30;i++){
      pts.push({
        x:0.15+Math.random()*0.7,
        y:0.3+Math.random()*0.5,
        size:Math.random()*1.5+0.4,
        speed:Math.random()*0.0005+0.0002,
        drift:Math.random()*0.0004-0.0002,
        opacity:Math.random()*0.4+0.1,
        phase:Math.random()*Math.PI*2,
        isEmber:Math.random()>0.4,
      });
    }
    embers.current=pts;
    // Flickering flame tongues in the hearth
    const fl=[];
    for(let i=0;i<14;i++){
      fl.push({
        x:0.28+Math.random()*0.44,
        baseY:0.50+Math.random()*0.07,
        height:Math.random()*0.14+0.08,
        width:Math.random()*0.024+0.012,
        speed:Math.random()*0.005+0.003,
        phase:Math.random()*Math.PI*2,
        swayAmt:Math.random()*0.014+0.005,
      });
    }
    flames.current=fl;
  },[]);

  useEffect(()=>{
    let active=true;
    const handle=(e)=>{if(!active)return;targetX.current=Math.max(-1,Math.min(1,(e.gamma||0)/30))*PARALLAX;targetY.current=Math.max(-1,Math.min(1,((e.beta||0)-45)/30))*PARALLAX;};
    if(typeof DeviceOrientationEvent!=="undefined"&&typeof DeviceOrientationEvent.requestPermission==="function"){
      const req=()=>{DeviceOrientationEvent.requestPermission().then(r=>{if(r==="granted")window.addEventListener("deviceorientation",handle);}).catch(()=>{});window.removeEventListener("touchstart",req);};
      window.addEventListener("touchstart",req,{once:true});
    } else { window.addEventListener("deviceorientation",handle); }
    return()=>{active=false;window.removeEventListener("deviceorientation",handle);};
  },[]);

  useEffect(()=>{
    const el=containerRef.current; if(!el) return;
    const start=(x,y)=>{dragStart.current={x,y,ox:targetX.current,oy:targetY.current};};
    const move=(x,y)=>{if(!dragStart.current)return;targetX.current=Math.max(-PARALLAX,Math.min(PARALLAX,dragStart.current.ox+(x-dragStart.current.x)*SENSITIVITY));targetY.current=Math.max(-PARALLAX,Math.min(PARALLAX,dragStart.current.oy+(y-dragStart.current.y)*SENSITIVITY));};
    const end=()=>{dragStart.current=null;};
    const ts=e=>{const t=e.touches[0];start(t.clientX,t.clientY);};
    const tm=e=>{const t=e.touches[0];move(t.clientX,t.clientY);};
    el.addEventListener("touchstart",ts,{passive:true});el.addEventListener("touchmove",tm,{passive:true});el.addEventListener("touchend",end);
    el.addEventListener("mousedown",e=>start(e.clientX,e.clientY));
    const mm=e=>move(e.clientX,e.clientY);
    window.addEventListener("mousemove",mm);window.addEventListener("mouseup",end);
    return()=>{el.removeEventListener("touchstart",ts);el.removeEventListener("touchmove",tm);el.removeEventListener("touchend",end);window.removeEventListener("mousemove",mm);window.removeEventListener("mouseup",end);};
  },[]);

  useEffect(()=>{
    const loop=()=>{
      time.current+=16;
      offsetX.current+=(targetX.current-offsetX.current)*0.08;
      offsetY.current+=(targetY.current-offsetY.current)*0.08;
      const bx=Math.sin(time.current*0.0005)*1.2;
      const by=Math.cos(time.current*0.0004)*0.8;
      if(imgRef.current) imgRef.current.style.transform=`translate(${-PARALLAX+offsetX.current+bx}px,${-PARALLAX+offsetY.current+by}px)`;
      const cvs=canvasRef.current;
      if(cvs){
        const ctx=cvs.getContext("2d"),w=cvs.width,h=cvs.height;
        ctx.clearRect(0,0,w,h);
        embers.current.forEach(p=>{
          p.y-=p.speed; p.x+=p.drift+Math.sin(time.current*0.0012+p.phase)*0.00012;
          if(p.y<-0.05){p.y=0.85+Math.random()*0.15;p.x=0.15+Math.random()*0.7;}
          const fl=0.6+0.4*Math.sin(time.current*0.003+p.phase);
          const a=p.opacity*fl;
          const px=p.x*w,py=p.y*h;
          if(p.isEmber){
            ctx.beginPath();ctx.arc(px,py,p.size*4,0,Math.PI*2);ctx.fillStyle=`rgba(255,120,30,${a*0.08})`;ctx.fill();
            ctx.beginPath();ctx.arc(px,py,p.size*1.5,0,Math.PI*2);ctx.fillStyle=`rgba(255,160,50,${a*0.25})`;ctx.fill();
            ctx.beginPath();ctx.arc(px,py,p.size*0.6,0,Math.PI*2);ctx.fillStyle=`rgba(255,200,80,${a})`;ctx.fill();
          } else {
            ctx.beginPath();ctx.arc(px,py,p.size*3,0,Math.PI*2);ctx.fillStyle=`rgba(255,200,120,${a*0.05})`;ctx.fill();
            ctx.beginPath();ctx.arc(px,py,p.size,0,Math.PI*2);ctx.fillStyle=`rgba(255,220,160,${a*0.4})`;ctx.fill();
          }
        });
        // ── Flickering flame tongues ──
        flames.current.forEach(f=>{
          const t=time.current;
          const sway=Math.sin(t*f.speed+f.phase)*f.swayAmt*w;
          const flicker=0.55+0.45*Math.sin(t*f.speed*1.7+f.phase);
          const fh=f.height*flicker*h;
          const bx=f.x*w+sway;
          const by=f.baseY*h;
          const ty=by-fh;
          const hw=f.width*w*(0.65+0.35*Math.sin(t*f.speed*2.3+f.phase));
          const tipSway=Math.sin(t*f.speed*1.3+f.phase*1.5)*hw*0.7;
          // Outer glow around each flame
          ctx.beginPath();ctx.arc(bx,by-fh*0.35,fh*0.6,0,Math.PI*2);
          ctx.fillStyle=`rgba(255,100,20,${0.04*flicker})`;ctx.fill();
          // Flame tongue shape
          ctx.beginPath();
          ctx.moveTo(bx-hw,by);
          ctx.quadraticCurveTo(bx-hw*0.5,by-fh*0.45,bx+tipSway,ty);
          ctx.quadraticCurveTo(bx+hw*0.5,by-fh*0.45,bx+hw,by);
          ctx.closePath();
          const grad=ctx.createLinearGradient(bx,by,bx,ty);
          grad.addColorStop(0,`rgba(255,50,5,${0.32*flicker})`);
          grad.addColorStop(0.25,`rgba(255,110,15,${0.26*flicker})`);
          grad.addColorStop(0.55,`rgba(255,170,40,${0.18*flicker})`);
          grad.addColorStop(0.85,`rgba(255,210,80,${0.08*flicker})`);
          grad.addColorStop(1,`rgba(255,230,120,${0.02*flicker})`);
          ctx.fillStyle=grad;ctx.fill();
          // Bright core
          const coreH=fh*0.4;
          const coreW=hw*0.4;
          ctx.beginPath();
          ctx.moveTo(bx-coreW,by);
          ctx.quadraticCurveTo(bx-coreW*0.3,by-coreH*0.5,bx+tipSway*0.3,by-coreH);
          ctx.quadraticCurveTo(bx+coreW*0.3,by-coreH*0.5,bx+coreW,by);
          ctx.closePath();
          ctx.fillStyle=`rgba(255,240,180,${0.12*flicker})`;ctx.fill();
        });
      }
      animFrame.current=requestAnimationFrame(loop);
    };
    animFrame.current=requestAnimationFrame(loop);
    return()=>{if(animFrame.current)cancelAnimationFrame(animFrame.current);};
  },[]);

  useEffect(()=>{
    const resize=()=>{const c=canvasRef.current;if(c){c.width=window.innerWidth;c.height=window.innerHeight;}};
    resize();window.addEventListener("resize",resize);
    return()=>window.removeEventListener("resize",resize);
  },[]);

  return(
    <div ref={containerRef} style={{position:"absolute",inset:0,zIndex:0,overflow:"hidden",background:"#080402",cursor:"grab"}} onMouseDown={()=>{if(containerRef.current)containerRef.current.style.cursor="grabbing";}} onMouseUp={()=>{if(containerRef.current)containerRef.current.style.cursor="grab";}}>
      <img ref={imgRef} src={STOVE_BG_IMAGE} alt="Stove" style={{position:"absolute",top:0,left:0,width:`calc(100% + ${PARALLAX*2}px)`,height:`calc(100% + ${PARALLAX*2}px)`,objectFit:"cover",transform:`translate(${-PARALLAX}px,${-PARALLAX}px)`,willChange:"transform",userSelect:"none",WebkitUserDrag:"none",pointerEvents:"none"}} draggable={false}/>
      {/* Fire glow — intense hearth center */}
      <div style={{position:"absolute",left:"10%",top:"5%",width:"80%",height:"50%",pointerEvents:"none",zIndex:1,background:"radial-gradient(ellipse at 50% 60%,rgba(255,130,30,0.15) 0%,rgba(255,90,10,0.05) 40%,transparent 70%)",mixBlendMode:"screen",animation:"stoveFireGlow 2.5s ease-in-out infinite"}}/>
      {/* Kettle steam glow */}
      <div style={{position:"absolute",left:"28%",top:"20%",width:"20%",height:"15%",pointerEvents:"none",zIndex:1,background:"radial-gradient(circle,rgba(255,240,220,0.06) 0%,transparent 60%)",mixBlendMode:"screen",animation:"kitchenSteam 4s ease-in-out infinite"}}/>
      <canvas ref={canvasRef} style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:2}}/>
      {/* Warm vignette */}
      <div style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:3,background:"radial-gradient(ellipse at center 50%, transparent 20%, rgba(8,4,2,0.55) 100%)"}}/>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   IMMERSIVE KITCHEN WINDOW — Calm waterfall prayer spot
   Porch overlooking waterfall at twilight. Rocking chair,
   lantern, coffee mug, cozy blanket. Guided prayer view.
═══════════════════════════════════════════════════ */
function ImmersiveKitchenWindow(){
  const containerRef=useRef(null);
  const canvasRef=useRef(null);
  const offsetX=useRef(0);
  const offsetY=useRef(0);
  const targetX=useRef(0);
  const targetY=useRef(0);
  const dragStart=useRef(null);
  const animFrame=useRef(null);
  const particles=useRef([]);
  const time=useRef(0);
  const imgRef=useRef(null);

  const PARALLAX=16;
  const SENSITIVITY=0.35;

  useEffect(()=>{
    // Gentle mist particles from waterfall
    const pts=[];
    for(let i=0;i<25;i++){
      pts.push({
        x:0.20+Math.random()*0.60,
        y:0.10+Math.random()*0.50,
        size:Math.random()*2.0+0.8,
        speed:Math.random()*0.00015+0.00005,
        drift:Math.random()*0.0002-0.0001,
        opacity:Math.random()*0.18+0.04,
        phase:Math.random()*Math.PI*2,
        isMist:Math.random()>0.4,
      });
    }
    // Firefly-like warm lantern sparks near chair area
    for(let i=0;i<12;i++){
      pts.push({
        x:0.05+Math.random()*0.45,
        y:0.50+Math.random()*0.45,
        size:Math.random()*1.4+0.6,
        speed:(Math.random()-0.5)*0.00008,
        drift:(Math.random()-0.5)*0.00012,
        opacity:Math.random()*0.5+0.15,
        phase:Math.random()*Math.PI*2,
        isMist:false,
        isFirefly:true,
        sx:(Math.random()-0.5)*0.00015,
        sy:(Math.random()-0.5)*0.0001,
        blink:Math.random()*0.003+0.001,
      });
    }
    particles.current=pts;
  },[]);

  useEffect(()=>{
    let active=true;
    const handle=(e)=>{if(!active)return;targetX.current=Math.max(-1,Math.min(1,(e.gamma||0)/30))*PARALLAX;targetY.current=Math.max(-1,Math.min(1,((e.beta||0)-45)/30))*PARALLAX;};
    if(typeof DeviceOrientationEvent!=="undefined"&&typeof DeviceOrientationEvent.requestPermission==="function"){
      const req=()=>{DeviceOrientationEvent.requestPermission().then(r=>{if(r==="granted")window.addEventListener("deviceorientation",handle);}).catch(()=>{});window.removeEventListener("touchstart",req);};
      window.addEventListener("touchstart",req,{once:true});
    } else { window.addEventListener("deviceorientation",handle); }
    return()=>{active=false;window.removeEventListener("deviceorientation",handle);};
  },[]);

  useEffect(()=>{
    const el=containerRef.current; if(!el) return;
    const start=(x,y)=>{dragStart.current={x,y,ox:targetX.current,oy:targetY.current};};
    const move=(x,y)=>{if(!dragStart.current)return;targetX.current=Math.max(-PARALLAX,Math.min(PARALLAX,dragStart.current.ox+(x-dragStart.current.x)*SENSITIVITY));targetY.current=Math.max(-PARALLAX,Math.min(PARALLAX,dragStart.current.oy+(y-dragStart.current.y)*SENSITIVITY));};
    const end=()=>{dragStart.current=null;};
    const ts=e=>{const t=e.touches[0];start(t.clientX,t.clientY);};
    const tm=e=>{const t=e.touches[0];move(t.clientX,t.clientY);};
    el.addEventListener("touchstart",ts,{passive:true});el.addEventListener("touchmove",tm,{passive:true});el.addEventListener("touchend",end);
    el.addEventListener("mousedown",e=>start(e.clientX,e.clientY));
    const mm=e=>move(e.clientX,e.clientY);
    window.addEventListener("mousemove",mm);window.addEventListener("mouseup",end);
    return()=>{el.removeEventListener("touchstart",ts);el.removeEventListener("touchmove",tm);el.removeEventListener("touchend",end);window.removeEventListener("mousemove",mm);window.removeEventListener("mouseup",end);};
  },[]);

  useEffect(()=>{
    const loop=()=>{
      time.current+=16;
      offsetX.current+=(targetX.current-offsetX.current)*0.06;
      offsetY.current+=(targetY.current-offsetY.current)*0.06;
      const bx=Math.sin(time.current*0.0003)*1.2;
      const by=Math.cos(time.current*0.00025)*0.8;
      if(imgRef.current) imgRef.current.style.transform=`translate(${-PARALLAX+offsetX.current+bx}px,${-PARALLAX+offsetY.current+by}px)`;
      const cvs=canvasRef.current;
      if(cvs){
        const ctx=cvs.getContext("2d"),w=cvs.width,h=cvs.height;
        ctx.clearRect(0,0,w,h);
        particles.current.forEach(p=>{
          if(p.isFirefly){
            p.x+=p.sx+Math.sin(time.current*0.0004+p.phase)*0.00005;
            p.y+=p.sy+Math.cos(time.current*0.0005+p.phase)*0.00004;
            if(p.x<0.03||p.x>0.50)p.sx*=-1;
            if(p.y<0.45||p.y>0.95)p.sy*=-1;
            p.x=Math.max(0.03,Math.min(0.50,p.x));
            p.y=Math.max(0.45,Math.min(0.95,p.y));
            const blink=Math.sin(time.current*p.blink+p.phase);
            const a=Math.max(0,blink*0.6+0.4)*p.opacity;
            const px=p.x*w,py=p.y*h;
            ctx.beginPath();ctx.arc(px,py,p.size*4,0,Math.PI*2);ctx.fillStyle=`rgba(255,200,100,${a*0.06})`;ctx.fill();
            ctx.beginPath();ctx.arc(px,py,p.size*2,0,Math.PI*2);ctx.fillStyle=`rgba(255,210,120,${a*0.15})`;ctx.fill();
            ctx.beginPath();ctx.arc(px,py,p.size*0.7,0,Math.PI*2);ctx.fillStyle=`rgba(255,230,160,${a*0.8})`;ctx.fill();
          } else {
            // Mist particles drifting from waterfall
            p.y-=p.speed; p.x+=p.drift+Math.sin(time.current*0.0007+p.phase)*0.00006;
            if(p.y<-0.05){p.y=0.55+Math.random()*0.1;p.x=0.25+Math.random()*0.50;}
            const fl=0.6+0.4*Math.sin(time.current*0.0015+p.phase);
            const a=p.opacity*fl;
            const px=p.x*w,py=p.y*h;
            ctx.beginPath();ctx.arc(px,py,p.size,0,Math.PI*2);
            ctx.fillStyle=`rgba(200,220,240,${a})`;ctx.fill();
            if(p.size>1.2){ctx.beginPath();ctx.arc(px,py,p.size*3,0,Math.PI*2);ctx.fillStyle=`rgba(200,220,240,${a*0.08})`;ctx.fill();}
          }
        });
      }
      animFrame.current=requestAnimationFrame(loop);
    };
    animFrame.current=requestAnimationFrame(loop);
    return()=>{if(animFrame.current)cancelAnimationFrame(animFrame.current);};
  },[]);

  useEffect(()=>{
    const resize=()=>{const c=canvasRef.current;if(c){c.width=window.innerWidth;c.height=window.innerHeight;}};
    resize();window.addEventListener("resize",resize);
    return()=>window.removeEventListener("resize",resize);
  },[]);

  return(
    <div ref={containerRef} style={{position:"absolute",inset:0,zIndex:0,overflow:"hidden",background:"#0E0A08",cursor:"grab"}} onMouseDown={()=>{if(containerRef.current)containerRef.current.style.cursor="grabbing";}} onMouseUp={()=>{if(containerRef.current)containerRef.current.style.cursor="grab";}}>
      <img ref={imgRef} src={KITCHEN_WINDOW_BG_IMAGE} alt="Kitchen Window" style={{position:"absolute",top:0,left:0,width:`calc(100% + ${PARALLAX*2}px)`,height:`calc(100% + ${PARALLAX*2}px)`,objectFit:"cover",transform:`translate(${-PARALLAX}px,${-PARALLAX}px)`,willChange:"transform",userSelect:"none",WebkitUserDrag:"none",pointerEvents:"none"}} draggable={false}/>
      {/* Waterfall mist glow — soft blue-white shimmer in center */}
      <div style={{position:"absolute",left:"25%",top:"8%",width:"50%",height:"45%",pointerEvents:"none",zIndex:1,borderRadius:"40%",background:"radial-gradient(ellipse at 50% 55%,rgba(200,220,240,0.08) 0%,rgba(180,200,230,0.03) 50%,transparent 75%)",mixBlendMode:"screen",animation:"waterShimmer 4s ease-in-out infinite"}}/>
      {/* Warm lantern glow on the left side table */}
      <div style={{position:"absolute",left:"5%",top:"45%",width:"25%",height:"30%",pointerEvents:"none",zIndex:1,borderRadius:"50%",background:"radial-gradient(ellipse at 55% 40%,rgba(255,170,60,0.12) 0%,rgba(255,140,40,0.04) 50%,transparent 72%)",mixBlendMode:"screen",animation:"kitchenFireGlow 3.5s ease-in-out infinite"}}/>
      {/* Candle flame glow — tall candle on table */}
      <div style={{position:"absolute",left:"15%",top:"30%",width:"10%",height:"15%",pointerEvents:"none",zIndex:1,borderRadius:"50%",background:"radial-gradient(circle,rgba(255,200,80,0.15) 0%,rgba(255,160,40,0.05) 50%,transparent 70%)",mixBlendMode:"screen",animation:"kitchenFireGlow 2.5s ease-in-out infinite",animationDelay:"0.5s"}}/>
      {/* Sunset sky warmth */}
      <div style={{position:"absolute",left:"15%",top:"0%",width:"70%",height:"20%",pointerEvents:"none",zIndex:1,background:"radial-gradient(ellipse at 50% 80%,rgba(255,180,120,0.06) 0%,transparent 70%)",mixBlendMode:"screen"}}/>
      {/* Soft mist layer across waterfall */}
      <div style={{position:"absolute",left:"20%",top:"20%",width:"55%",height:"35%",pointerEvents:"none",zIndex:1,borderRadius:"50%",background:"radial-gradient(ellipse at 50% 60%,rgba(220,230,240,0.05) 0%,transparent 65%)",mixBlendMode:"screen",animation:"mistDrift 8s ease-in-out infinite"}}/>
      <canvas ref={canvasRef} style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:2}}/>
      {/* Cinematic vignette — darker/moodier for prayer space */}
      <div style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:3,background:"radial-gradient(ellipse at center 45%, transparent 20%, rgba(10,8,6,0.60) 100%)"}}/>
      <div style={{position:"absolute",top:0,left:0,right:0,height:"12%",pointerEvents:"none",zIndex:3,background:"linear-gradient(to bottom, rgba(10,8,6,0.25), transparent)"}}/>
      <div style={{position:"absolute",bottom:0,left:0,right:0,height:"15%",pointerEvents:"none",zIndex:3,background:"linear-gradient(to top, rgba(10,8,6,0.30), transparent)"}}/>
    </div>
  );
}

// Sunken cabin great room — stone fireplace with roaring fire LEFT, large picture window CENTER
// with pine forest & starry sky, cathedral skylight TOP, string lights across ceiling beams,
// wooden stairs going DOWN on RIGHT, desk with open book & lamp UPPER-RIGHT, sectional sofa CENTER,
// rolled paper map with magnifying glass on wooden shelf BOTTOM-CENTER, bookshelf FAR-LEFT, candles on mantel.
const CABIN_FALLBACK_IMAGE="/cabin-interior.png";

function ImmersiveCabin(){
  const containerRef=useRef(null);
  const canvasRef=useRef(null);
  const offsetX=useRef(0);
  const offsetY=useRef(0);
  const targetX=useRef(0);
  const targetY=useRef(0);
  const dragStart=useRef(null);
  const animFrame=useRef(null);
  const particles=useRef([]);
  const fireflies=useRef([]);
  const time=useRef(0);
  const imgLoaded=useRef(false);
  const imgRef=useRef(null);

  // Parallax limits (px the image can shift beyond viewport)
  const PARALLAX=40;
  const SENSITIVITY=0.6;

  // Initialize warm floating dust particles
  useEffect(()=>{
    const pts=[];
    for(let i=0;i<35;i++){
      pts.push({
        x:Math.random(),
        y:Math.random(),
        size:Math.random()*2.5+0.8,
        speed:Math.random()*0.0003+0.0001,
        drift:Math.random()*0.0004-0.0002,
        opacity:Math.random()*0.4+0.1,
        phase:Math.random()*Math.PI*2,
        warmth:Math.random(), // 0=gold, 1=warm white
      });
    }
    particles.current=pts;
    // Fireflies — glowing outside the window area
    const ffs=[];
    for(let i=0;i<18;i++){
      ffs.push({
        x:0.28+Math.random()*0.34,   // window glass only ~28-62%
        y:0.10+Math.random()*0.24,    // window glass only ~10-34%
        size:Math.random()*2+1.5,
        sx:(Math.random()-0.5)*0.0003,
        sy:(Math.random()-0.5)*0.0002,
        phase:Math.random()*Math.PI*2,
        blink:Math.random()*0.003+0.001,
      });
    }
    fireflies.current=ffs;
  },[]);

  // Gyroscope on mobile
  useEffect(()=>{
    let active=true;
    const handleOrientation=(e)=>{
      if(!active)return;
      const beta=e.beta||0;   // front-back tilt (-180..180)
      const gamma=e.gamma||0; // left-right tilt (-90..90)
      targetX.current=Math.max(-1,Math.min(1,gamma/30))*PARALLAX;
      targetY.current=Math.max(-1,Math.min(1,(beta-45)/30))*PARALLAX;
    };
    if(typeof DeviceOrientationEvent!=="undefined"&&typeof DeviceOrientationEvent.requestPermission==="function"){
      // iOS 13+ — request on first user tap
      const reqPerm=()=>{
        DeviceOrientationEvent.requestPermission().then(r=>{
          if(r==="granted") window.addEventListener("deviceorientation",handleOrientation);
        }).catch(()=>{});
        window.removeEventListener("touchstart",reqPerm);
      };
      window.addEventListener("touchstart",reqPerm,{once:true});
    } else {
      window.addEventListener("deviceorientation",handleOrientation);
    }
    return()=>{active=false;window.removeEventListener("deviceorientation",handleOrientation);};
  },[]);

  // Touch drag for look-around
  useEffect(()=>{
    const el=containerRef.current;
    if(!el)return;
    const start=(x,y)=>{dragStart.current={x,y,ox:targetX.current,oy:targetY.current};};
    const move=(x,y)=>{
      if(!dragStart.current)return;
      const dx=(x-dragStart.current.x)*SENSITIVITY;
      const dy=(y-dragStart.current.y)*SENSITIVITY;
      targetX.current=Math.max(-PARALLAX,Math.min(PARALLAX,dragStart.current.ox+dx));
      targetY.current=Math.max(-PARALLAX,Math.min(PARALLAX,dragStart.current.oy+dy));
    };
    const end=()=>{dragStart.current=null;};
    const ts=(e)=>{const t=e.touches[0];start(t.clientX,t.clientY);};
    const tm=(e)=>{const t=e.touches[0];move(t.clientX,t.clientY);};
    const ms=(e)=>{start(e.clientX,e.clientY);};
    const mm=(e)=>{move(e.clientX,e.clientY);};
    el.addEventListener("touchstart",ts,{passive:true});
    el.addEventListener("touchmove",tm,{passive:true});
    el.addEventListener("touchend",end);
    el.addEventListener("mousedown",ms);
    window.addEventListener("mousemove",mm);
    window.addEventListener("mouseup",end);
    return()=>{
      el.removeEventListener("touchstart",ts);
      el.removeEventListener("touchmove",tm);
      el.removeEventListener("touchend",end);
      el.removeEventListener("mousedown",ms);
      window.removeEventListener("mousemove",mm);
      window.removeEventListener("mouseup",end);
    };
  },[]);

  // Animation loop — smooth parallax + particle canvas
  useEffect(()=>{
    const loop=()=>{
      time.current+=16;
      // Smooth lerp parallax
      offsetX.current+=(targetX.current-offsetX.current)*0.08;
      offsetY.current+=(targetY.current-offsetY.current)*0.08;
      // Subtle idle breathing
      const breathX=Math.sin(time.current*0.0004)*3;
      const breathY=Math.cos(time.current*0.0003)*2;
      const finalX=offsetX.current+breathX;
      const finalY=offsetY.current+breathY;
      // Apply to image
      if(imgRef.current){
        imgRef.current.style.transform=`translate(${-PARALLAX+finalX}px,${-PARALLAX+finalY}px) scale(1)`;
      }
      // Draw particles on canvas
      const cvs=canvasRef.current;
      if(cvs){
        const ctx=cvs.getContext("2d");
        const w=cvs.width;
        const h=cvs.height;
        ctx.clearRect(0,0,w,h);
        particles.current.forEach(p=>{
          p.y-=p.speed;
          p.x+=p.drift+Math.sin(time.current*0.001+p.phase)*0.0001;
          if(p.y<-0.05){p.y=1.05;p.x=Math.random();}
          if(p.x<-0.05||p.x>1.05)p.x=Math.random();
          const px=p.x*w;
          const py=p.y*h;
          const flicker=0.7+0.3*Math.sin(time.current*0.002+p.phase);
          const alpha=p.opacity*flicker;
          // Warm gold/amber dust motes
          const r=255;
          const g=Math.round(190+p.warmth*40);
          const b=Math.round(80+p.warmth*60);
          ctx.beginPath();
          ctx.arc(px,py,p.size,0,Math.PI*2);
          ctx.fillStyle=`rgba(${r},${g},${b},${alpha})`;
          ctx.fill();
          // Soft glow halo
          if(p.size>1.5){
            ctx.beginPath();
            ctx.arc(px,py,p.size*3,0,Math.PI*2);
            ctx.fillStyle=`rgba(${r},${g},${b},${alpha*0.15})`;
            ctx.fill();
          }
        });
        // ── Fireflies outside the window ──
        fireflies.current.forEach(ff=>{
          ff.x+=ff.sx+Math.sin(time.current*0.0005+ff.phase)*0.0001;
          ff.y+=ff.sy+Math.cos(time.current*0.0007+ff.phase)*0.00008;
          if(ff.x<0.26||ff.x>0.64)ff.sx*=-1;
          if(ff.y<0.08||ff.y>0.36)ff.sy*=-1;
          ff.x=Math.max(0.26,Math.min(0.64,ff.x));
          ff.y=Math.max(0.08,Math.min(0.36,ff.y));
          const blink=Math.sin(time.current*ff.blink+ff.phase);
          const a=Math.max(0,blink*0.7+0.3)*0.6;
          const px=ff.x*w,py=ff.y*h;
          // Outer glow halo
          ctx.beginPath();ctx.arc(px,py,ff.size*7,0,Math.PI*2);
          ctx.fillStyle=`rgba(160,255,90,${a*0.08})`;ctx.fill();
          // Mid glow
          ctx.beginPath();ctx.arc(px,py,ff.size*3.5,0,Math.PI*2);
          ctx.fillStyle=`rgba(180,255,100,${a*0.18})`;ctx.fill();
          // Core
          ctx.beginPath();ctx.arc(px,py,ff.size,0,Math.PI*2);
          ctx.fillStyle=`rgba(210,255,140,${a})`;ctx.fill();
        });
      }
      animFrame.current=requestAnimationFrame(loop);
    };
    animFrame.current=requestAnimationFrame(loop);
    return()=>{if(animFrame.current)cancelAnimationFrame(animFrame.current);};
  },[]);

  // Resize canvas to match container
  useEffect(()=>{
    const resize=()=>{
      const cvs=canvasRef.current;
      if(!cvs)return;
      cvs.width=window.innerWidth;
      cvs.height=window.innerHeight;
    };
    resize();
    window.addEventListener("resize",resize);
    return()=>window.removeEventListener("resize",resize);
  },[]);

  return(
    <div ref={containerRef} style={{position:"absolute",inset:0,zIndex:0,overflow:"hidden",background:"#060402",cursor:"grab"}} onMouseDown={()=>{if(containerRef.current)containerRef.current.style.cursor="grabbing";}} onMouseUp={()=>{if(containerRef.current)containerRef.current.style.cursor="grab";}}>
      {/* Cabin image — oversized for parallax movement */}
      <img
        ref={imgRef}
        src={CABIN_FALLBACK_IMAGE}
        alt="Cabin interior"
        onLoad={()=>{imgLoaded.current=true;}}
        style={{
          position:"absolute",
          top:0,left:0,
          width:`calc(100% + ${PARALLAX*2}px)`,
          height:`calc(100% + ${PARALLAX*2}px)`,
          objectFit:"cover",
          transform:`translate(${-PARALLAX}px,${-PARALLAX}px)`,
          willChange:"transform",
          userSelect:"none",
          WebkitUserDrag:"none",
          pointerEvents:"none",
        }}
        draggable={false}
      />
      {/* Warm firelight flicker overlay — radiates from LEFT fireplace */}
      <div className="cabin-firelight" style={{position:"absolute",inset:0,pointerEvents:"none",background:"radial-gradient(ellipse at 10% 48%, rgba(255,160,60,0.10) 0%, rgba(255,120,40,0.03) 35%, transparent 60%)",mixBlendMode:"screen"}}/>
      {/* Fire motion — animated dancing glow from fireplace */}
      <div className="cabin-fire-motion" style={{position:"absolute",left:0,top:"22%",width:"24%",height:"55%",pointerEvents:"none",zIndex:1,background:"radial-gradient(ellipse at 55% 55%, rgba(255,100,20,0.14) 0%, rgba(255,60,10,0.04) 45%, transparent 70%)",mixBlendMode:"screen",transformOrigin:"center bottom"}}/>
      {/* Fire motion secondary — faster flicker layer */}
      <div className="cabin-fire-flicker" style={{position:"absolute",left:"1%",top:"30%",width:"18%",height:"40%",pointerEvents:"none",zIndex:1,background:"radial-gradient(ellipse at 60% 50%, rgba(255,140,40,0.10) 0%, transparent 60%)",mixBlendMode:"screen",transformOrigin:"center bottom"}}/>
      {/* String light glow — warm lights across ceiling */}
      <div className="cabin-string-lights" style={{position:"absolute",left:"8%",right:"8%",top:"6%",height:"14%",pointerEvents:"none",zIndex:1,background:"linear-gradient(90deg, transparent 0%, rgba(255,210,120,0.04) 10%, rgba(255,200,100,0.06) 25%, rgba(255,210,120,0.04) 40%, rgba(255,200,100,0.06) 55%, rgba(255,210,120,0.04) 70%, rgba(255,200,100,0.06) 85%, transparent 100%)",mixBlendMode:"screen"}}/>
      {/* Candle glow — mantel candles */}
      <div className="cabin-candle-glow" style={{position:"absolute",left:"8%",top:"26%",width:"8%",height:"8%",pointerEvents:"none",zIndex:1,borderRadius:"50%",background:"radial-gradient(circle, rgba(255,200,80,0.12) 0%, transparent 70%)",mixBlendMode:"screen"}}/>
      {/* Candle glow — near window */}
      <div className="cabin-candle-glow2" style={{position:"absolute",left:"32%",top:"34%",width:"6%",height:"6%",pointerEvents:"none",zIndex:1,borderRadius:"50%",background:"radial-gradient(circle, rgba(255,200,80,0.10) 0%, transparent 65%)",mixBlendMode:"screen"}}/>
      {/* Desk lamp glow — upper right */}
      <div className="cabin-candle-glow" style={{position:"absolute",right:"8%",top:"20%",width:"10%",height:"10%",pointerEvents:"none",zIndex:1,borderRadius:"50%",background:"radial-gradient(circle, rgba(255,210,120,0.12) 0%, transparent 65%)",mixBlendMode:"screen"}}/>
      {/* Floating dust particles + fireflies canvas */}
      <canvas ref={canvasRef} style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:2}}/>
      {/* Cinematic vignette */}
      <div style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:3,background:"radial-gradient(ellipse at center, transparent 35%, rgba(8,6,4,0.55) 100%)"}}/>
      {/* Top shadow for depth */}
      <div style={{position:"absolute",top:0,left:0,right:0,height:"25%",pointerEvents:"none",zIndex:3,background:"linear-gradient(to bottom, rgba(8,6,4,0.30), transparent)"}}/>
      {/* Warm color wash — subtle warmth across whole scene */}
      <div style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:1,background:"linear-gradient(180deg, rgba(201,140,60,0.03) 0%, transparent 40%, rgba(201,140,60,0.02) 100%)"}}/>
    </div>
  );
}

/* CabinScene3D is replaced by ImmersiveCabin above — GLB model will return when rebuilt */

/* ═══════════════════════════════════════════════════
   IMMERSIVE GARDEN — Enchanted greenhouse with garden.png
   Stone path leading to glowing archway door, circular
   dirt plots on either side, lanterns, string lights,
   lush plants and lavender throughout.
═══════════════════════════════════════════════════ */
const GARDEN_BG_IMAGE="/garden.png";

// 12 plots mapped to the circular dirt patches in garden.png
// Arranged in 6 rows of 2 (left + right of stone path), scaling down with perspective
const GARDEN_PLOT_POSITIONS=[
  // Row 1 — bottom (closest)
  {left:"18%",top:"74%",size:"13vw",maxSize:"72px"},
  {left:"63%",top:"74%",size:"13vw",maxSize:"72px"},
  // Row 2
  {left:"13%",top:"62%",size:"11vw",maxSize:"62px"},
  {left:"68%",top:"62%",size:"11vw",maxSize:"62px"},
  // Row 3
  {left:"11%",top:"51%",size:"10vw",maxSize:"54px"},
  {left:"72%",top:"51%",size:"10vw",maxSize:"54px"},
  // Row 4
  {left:"16%",top:"42%",size:"9vw",maxSize:"48px"},
  {left:"68%",top:"42%",size:"9vw",maxSize:"48px"},
  // Row 5
  {left:"22%",top:"34%",size:"8vw",maxSize:"42px"},
  {left:"62%",top:"34%",size:"8vw",maxSize:"42px"},
  // Row 6 — top (farthest, near door)
  {left:"30%",top:"27%",size:"7vw",maxSize:"36px"},
  {left:"55%",top:"27%",size:"7vw",maxSize:"36px"},
];

function ImmersiveGarden(){
  const containerRef=useRef(null);
  const canvasRef=useRef(null);
  const offsetX=useRef(0);
  const offsetY=useRef(0);
  const targetX=useRef(0);
  const targetY=useRef(0);
  const dragStart=useRef(null);
  const animFrame=useRef(null);
  const particles=useRef([]);
  const gardenFireflies=useRef([]);
  const time=useRef(0);
  const imgRef=useRef(null);

  const PARALLAX=30;
  const SENSITIVITY=0.5;

  // Initialize pollen/dust + fireflies
  useEffect(()=>{
    const pts=[];
    for(let i=0;i<25;i++){
      pts.push({
        x:Math.random(),y:Math.random(),
        size:Math.random()*2+0.6,
        speed:Math.random()*0.00025+0.0001,
        drift:Math.random()*0.0003-0.00015,
        opacity:Math.random()*0.35+0.08,
        phase:Math.random()*Math.PI*2,
        warmth:Math.random(),
      });
    }
    particles.current=pts;
    const ffs=[];
    for(let i=0;i<22;i++){
      ffs.push({
        x:0.08+Math.random()*0.84,
        y:0.10+Math.random()*0.75,
        size:Math.random()*1.8+1.2,
        sx:(Math.random()-0.5)*0.00025,
        sy:(Math.random()-0.5)*0.00018,
        phase:Math.random()*Math.PI*2,
        blink:Math.random()*0.003+0.001,
        isGold:Math.random()>0.6, // mix of green and golden fireflies
      });
    }
    gardenFireflies.current=ffs;
  },[]);

  // Gyroscope
  useEffect(()=>{
    let active=true;
    const handle=(e)=>{
      if(!active)return;
      targetX.current=Math.max(-1,Math.min(1,(e.gamma||0)/30))*PARALLAX;
      targetY.current=Math.max(-1,Math.min(1,((e.beta||0)-45)/30))*PARALLAX;
    };
    if(typeof DeviceOrientationEvent!=="undefined"&&typeof DeviceOrientationEvent.requestPermission==="function"){
      const req=()=>{DeviceOrientationEvent.requestPermission().then(r=>{if(r==="granted")window.addEventListener("deviceorientation",handle);}).catch(()=>{});window.removeEventListener("touchstart",req);};
      window.addEventListener("touchstart",req,{once:true});
    } else { window.addEventListener("deviceorientation",handle); }
    return()=>{active=false;window.removeEventListener("deviceorientation",handle);};
  },[]);

  // Touch/mouse drag
  useEffect(()=>{
    const el=containerRef.current; if(!el) return;
    const start=(x,y)=>{dragStart.current={x,y,ox:targetX.current,oy:targetY.current};};
    const move=(x,y)=>{if(!dragStart.current)return;targetX.current=Math.max(-PARALLAX,Math.min(PARALLAX,dragStart.current.ox+(x-dragStart.current.x)*SENSITIVITY));targetY.current=Math.max(-PARALLAX,Math.min(PARALLAX,dragStart.current.oy+(y-dragStart.current.y)*SENSITIVITY));};
    const end=()=>{dragStart.current=null;};
    const ts=e=>{const t=e.touches[0];start(t.clientX,t.clientY);};
    const tm=e=>{const t=e.touches[0];move(t.clientX,t.clientY);};
    el.addEventListener("touchstart",ts,{passive:true});el.addEventListener("touchmove",tm,{passive:true});el.addEventListener("touchend",end);
    el.addEventListener("mousedown",e=>start(e.clientX,e.clientY));
    const mm=e=>move(e.clientX,e.clientY);
    window.addEventListener("mousemove",mm);window.addEventListener("mouseup",end);
    return()=>{el.removeEventListener("touchstart",ts);el.removeEventListener("touchmove",tm);el.removeEventListener("touchend",end);window.removeEventListener("mousemove",mm);window.removeEventListener("mouseup",end);};
  },[]);

  // Animation loop
  useEffect(()=>{
    const loop=()=>{
      time.current+=16;
      offsetX.current+=(targetX.current-offsetX.current)*0.08;
      offsetY.current+=(targetY.current-offsetY.current)*0.08;
      const bx=Math.sin(time.current*0.0004)*2;
      const by=Math.cos(time.current*0.0003)*1.5;
      if(imgRef.current) imgRef.current.style.transform=`translate(${-PARALLAX+offsetX.current+bx}px,${-PARALLAX+offsetY.current+by}px)`;
      const cvs=canvasRef.current;
      if(cvs){
        const ctx=cvs.getContext("2d"),w=cvs.width,h=cvs.height;
        ctx.clearRect(0,0,w,h);
        // Floating pollen/dust
        particles.current.forEach(p=>{
          p.y-=p.speed; p.x+=p.drift+Math.sin(time.current*0.001+p.phase)*0.0001;
          if(p.y<-0.05){p.y=1.05;p.x=Math.random();}
          const fl=0.7+0.3*Math.sin(time.current*0.002+p.phase);
          const a=p.opacity*fl;
          const r=240,g=Math.round(220+p.warmth*30),b=Math.round(160+p.warmth*60);
          const px=p.x*w,py=p.y*h;
          ctx.beginPath();ctx.arc(px,py,p.size,0,Math.PI*2);
          ctx.fillStyle=`rgba(${r},${g},${b},${a})`;ctx.fill();
          if(p.size>1.2){ctx.beginPath();ctx.arc(px,py,p.size*2.5,0,Math.PI*2);ctx.fillStyle=`rgba(${r},${g},${b},${a*0.12})`;ctx.fill();}
        });
        // Fireflies
        gardenFireflies.current.forEach(ff=>{
          ff.x+=ff.sx+Math.sin(time.current*0.0005+ff.phase)*0.00008;
          ff.y+=ff.sy+Math.cos(time.current*0.0006+ff.phase)*0.00006;
          if(ff.x<0.05||ff.x>0.95)ff.sx*=-1;
          if(ff.y<0.08||ff.y>0.88)ff.sy*=-1;
          ff.x=Math.max(0.05,Math.min(0.95,ff.x));
          ff.y=Math.max(0.08,Math.min(0.88,ff.y));
          const blink=Math.sin(time.current*ff.blink+ff.phase);
          const a=Math.max(0,blink*0.7+0.3)*0.55;
          const px=ff.x*w,py=ff.y*h;
          if(ff.isGold){
            ctx.beginPath();ctx.arc(px,py,ff.size*6,0,Math.PI*2);ctx.fillStyle=`rgba(255,220,100,${a*0.06})`;ctx.fill();
            ctx.beginPath();ctx.arc(px,py,ff.size*3,0,Math.PI*2);ctx.fillStyle=`rgba(255,230,120,${a*0.15})`;ctx.fill();
            ctx.beginPath();ctx.arc(px,py,ff.size,0,Math.PI*2);ctx.fillStyle=`rgba(255,240,160,${a})`;ctx.fill();
          } else {
            ctx.beginPath();ctx.arc(px,py,ff.size*6,0,Math.PI*2);ctx.fillStyle=`rgba(140,255,100,${a*0.06})`;ctx.fill();
            ctx.beginPath();ctx.arc(px,py,ff.size*3,0,Math.PI*2);ctx.fillStyle=`rgba(160,255,110,${a*0.15})`;ctx.fill();
            ctx.beginPath();ctx.arc(px,py,ff.size,0,Math.PI*2);ctx.fillStyle=`rgba(190,255,150,${a})`;ctx.fill();
          }
        });
      }
      animFrame.current=requestAnimationFrame(loop);
    };
    animFrame.current=requestAnimationFrame(loop);
    return()=>{if(animFrame.current)cancelAnimationFrame(animFrame.current);};
  },[]);

  // Resize canvas
  useEffect(()=>{
    const resize=()=>{const c=canvasRef.current;if(c){c.width=window.innerWidth;c.height=window.innerHeight;}};
    resize();window.addEventListener("resize",resize);
    return()=>window.removeEventListener("resize",resize);
  },[]);

  return(
    <div ref={containerRef} style={{position:"absolute",inset:0,zIndex:0,overflow:"hidden",background:"#080A06",cursor:"grab"}} onMouseDown={()=>{if(containerRef.current)containerRef.current.style.cursor="grabbing";}} onMouseUp={()=>{if(containerRef.current)containerRef.current.style.cursor="grab";}}>
      <img ref={imgRef} src={GARDEN_BG_IMAGE} alt="Prayer Garden" style={{position:"absolute",top:0,left:0,width:`calc(100% + ${PARALLAX*2}px)`,height:`calc(100% + ${PARALLAX*2}px)`,objectFit:"cover",transform:`translate(${-PARALLAX}px,${-PARALLAX}px)`,willChange:"transform",userSelect:"none",WebkitUserDrag:"none",pointerEvents:"none"}} draggable={false}/>
      {/* Warm lantern glow overlay — left side */}
      <div className="garden-lantern-glow" style={{position:"absolute",left:"5%",top:"55%",width:"15%",height:"20%",pointerEvents:"none",zIndex:1,borderRadius:"50%",background:"radial-gradient(circle,rgba(255,180,60,0.10) 0%, transparent 70%)",mixBlendMode:"screen"}}/>
      {/* Lantern glow — right side */}
      <div className="garden-lantern-glow2" style={{position:"absolute",right:"5%",top:"55%",width:"15%",height:"20%",pointerEvents:"none",zIndex:1,borderRadius:"50%",background:"radial-gradient(circle,rgba(255,180,60,0.10) 0%, transparent 70%)",mixBlendMode:"screen"}}/>
      {/* Archway door glow */}
      <div className="garden-door-glow" style={{position:"absolute",left:"35%",top:"10%",width:"30%",height:"20%",pointerEvents:"none",zIndex:1,background:"radial-gradient(ellipse,rgba(255,200,80,0.12) 0%, transparent 65%)",mixBlendMode:"screen"}}/>
      {/* String light shimmer across greenhouse ceiling */}
      <div className="garden-string-lights" style={{position:"absolute",left:"5%",right:"5%",top:"2%",height:"12%",pointerEvents:"none",zIndex:1,background:"linear-gradient(90deg, transparent 0%, rgba(255,220,140,0.03) 12%, rgba(255,210,120,0.05) 28%, rgba(255,220,140,0.03) 42%, rgba(255,210,120,0.05) 58%, rgba(255,220,140,0.03) 72%, rgba(255,210,120,0.05) 88%, transparent 100%)",mixBlendMode:"screen"}}/>
      {/* Path glow — warm light on the stone path */}
      <div style={{position:"absolute",left:"30%",top:"40%",width:"40%",height:"55%",pointerEvents:"none",zIndex:1,background:"radial-gradient(ellipse at 50% 80%,rgba(255,190,90,0.04) 0%, transparent 60%)",mixBlendMode:"screen"}}/>
      {/* Firefly + pollen canvas */}
      <canvas ref={canvasRef} style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:2}}/>
      {/* Cinematic vignette */}
      <div style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:3,background:"radial-gradient(ellipse at center 60%, transparent 30%, rgba(6,8,4,0.50) 100%)"}}/>
      {/* Top shadow */}
      <div style={{position:"absolute",top:0,left:0,right:0,height:"20%",pointerEvents:"none",zIndex:3,background:"linear-gradient(to bottom, rgba(6,8,4,0.25), transparent)"}}/>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   IMMERSIVE MAP — World navigation hub
   Enchanted overhead view of the village at dusk with
   winding paths connecting Cabin, Prayer Garden, Market,
   and Upper Room. Lanterns glow, fireflies drift,
   starry sky overhead.
═══════════════════════════════════════════════════ */
const MAP_BG_IMAGE="/newmap.png";

// Hotspot positions mapped to BUILDING locations in newmap.png
// Each hotspot covers the actual building footprint + label area
const MAP_LOCATIONS=[
  {id:"cabin",   label:"Cabin",         left:"24%", top:"80%", w:"40%", h:"24%", desc:"Your quiet place"},
  {id:"garden",  label:"Prayer Garden", left:"18%", top:"36%", w:"30%", h:"18%", desc:"Grow your prayers"},
  {id:"market",  label:"Market",        left:"58%", top:"48%", w:"40%", h:"18%", desc:"Trade & provision"},
  {id:"upper-room",label:"Upper Room",  left:"62%", top:"14%", w:"34%", h:"18%", desc:"Worship & encounter"},
];

function ImmersiveMap(){
  const containerRef=useRef(null);
  const canvasRef=useRef(null);
  const offsetX=useRef(0);
  const offsetY=useRef(0);
  const targetX=useRef(0);
  const targetY=useRef(0);
  const dragStart=useRef(null);
  const animFrame=useRef(null);
  const particles=useRef([]);
  const mapFireflies=useRef([]);
  const time=useRef(0);
  const imgRef=useRef(null);

  const PARALLAX=25;
  const SENSITIVITY=0.45;

  // Initialize particles + fireflies
  useEffect(()=>{
    const pts=[];
    for(let i=0;i<18;i++){
      pts.push({
        x:Math.random(),y:Math.random(),
        size:Math.random()*1.5+0.5,
        speed:Math.random()*0.00018+0.00008,
        drift:Math.random()*0.00025-0.000125,
        opacity:Math.random()*0.25+0.06,
        phase:Math.random()*Math.PI*2,
        warmth:Math.random(),
      });
    }
    particles.current=pts;
    const ffs=[];
    for(let i=0;i<30;i++){
      ffs.push({
        x:0.06+Math.random()*0.88,
        y:0.15+Math.random()*0.78,
        size:Math.random()*1.6+1.0,
        sx:(Math.random()-0.5)*0.0002,
        sy:(Math.random()-0.5)*0.00015,
        phase:Math.random()*Math.PI*2,
        blink:Math.random()*0.003+0.0008,
        isGold:Math.random()>0.5,
      });
    }
    mapFireflies.current=ffs;
  },[]);

  // Gyroscope
  useEffect(()=>{
    let active=true;
    const handle=(e)=>{
      if(!active)return;
      targetX.current=Math.max(-1,Math.min(1,(e.gamma||0)/30))*PARALLAX;
      targetY.current=Math.max(-1,Math.min(1,((e.beta||0)-45)/30))*PARALLAX;
    };
    if(typeof DeviceOrientationEvent!=="undefined"&&typeof DeviceOrientationEvent.requestPermission==="function"){
      const req=()=>{DeviceOrientationEvent.requestPermission().then(r=>{if(r==="granted")window.addEventListener("deviceorientation",handle);}).catch(()=>{});window.removeEventListener("touchstart",req);};
      window.addEventListener("touchstart",req,{once:true});
    } else { window.addEventListener("deviceorientation",handle); }
    return()=>{active=false;window.removeEventListener("deviceorientation",handle);};
  },[]);

  // Touch/mouse drag
  useEffect(()=>{
    const el=containerRef.current; if(!el) return;
    const start=(x,y)=>{dragStart.current={x,y,ox:targetX.current,oy:targetY.current};};
    const move=(x,y)=>{if(!dragStart.current)return;targetX.current=Math.max(-PARALLAX,Math.min(PARALLAX,dragStart.current.ox+(x-dragStart.current.x)*SENSITIVITY));targetY.current=Math.max(-PARALLAX,Math.min(PARALLAX,dragStart.current.oy+(y-dragStart.current.y)*SENSITIVITY));};
    const end=()=>{dragStart.current=null;};
    const ts=e=>{const t=e.touches[0];start(t.clientX,t.clientY);};
    const tm=e=>{const t=e.touches[0];move(t.clientX,t.clientY);};
    el.addEventListener("touchstart",ts,{passive:true});el.addEventListener("touchmove",tm,{passive:true});el.addEventListener("touchend",end);
    el.addEventListener("mousedown",e=>start(e.clientX,e.clientY));
    const mm=e=>move(e.clientX,e.clientY);
    window.addEventListener("mousemove",mm);window.addEventListener("mouseup",end);
    return()=>{el.removeEventListener("touchstart",ts);el.removeEventListener("touchmove",tm);el.removeEventListener("touchend",end);window.removeEventListener("mousemove",mm);window.removeEventListener("mouseup",end);};
  },[]);

  // Animation loop
  useEffect(()=>{
    const loop=()=>{
      time.current+=16;
      offsetX.current+=(targetX.current-offsetX.current)*0.07;
      offsetY.current+=(targetY.current-offsetY.current)*0.07;
      const bx=Math.sin(time.current*0.00035)*1.5;
      const by=Math.cos(time.current*0.00025)*1.2;
      if(imgRef.current) imgRef.current.style.transform=`translate(${-PARALLAX+offsetX.current+bx}px,${-PARALLAX+offsetY.current+by}px)`;
      const cvs=canvasRef.current;
      if(cvs){
        const ctx=cvs.getContext("2d"),w=cvs.width,h=cvs.height;
        ctx.clearRect(0,0,w,h);
        // Floating dust/pollen
        particles.current.forEach(p=>{
          p.y-=p.speed; p.x+=p.drift+Math.sin(time.current*0.0008+p.phase)*0.00008;
          if(p.y<-0.04){p.y=1.04;p.x=Math.random();}
          const fl=0.6+0.4*Math.sin(time.current*0.0015+p.phase);
          const a=p.opacity*fl;
          const r=240,g=Math.round(215+p.warmth*35),b2=Math.round(155+p.warmth*65);
          const px=p.x*w,py=p.y*h;
          ctx.beginPath();ctx.arc(px,py,p.size,0,Math.PI*2);
          ctx.fillStyle=`rgba(${r},${g},${b2},${a})`;ctx.fill();
          if(p.size>1.0){ctx.beginPath();ctx.arc(px,py,p.size*2.5,0,Math.PI*2);ctx.fillStyle=`rgba(${r},${g},${b2},${a*0.1})`;ctx.fill();}
        });
        // Fireflies — mix of warm gold and cool blue/white (starlit feel)
        mapFireflies.current.forEach(ff=>{
          ff.x+=ff.sx+Math.sin(time.current*0.00045+ff.phase)*0.00007;
          ff.y+=ff.sy+Math.cos(time.current*0.0005+ff.phase)*0.00005;
          if(ff.x<0.04||ff.x>0.96)ff.sx*=-1;
          if(ff.y<0.06||ff.y>0.92)ff.sy*=-1;
          ff.x=Math.max(0.04,Math.min(0.96,ff.x));
          ff.y=Math.max(0.06,Math.min(0.92,ff.y));
          const blink=Math.sin(time.current*ff.blink+ff.phase);
          const a=Math.max(0,blink*0.65+0.35)*0.5;
          const px=ff.x*w,py=ff.y*h;
          if(ff.isGold){
            ctx.beginPath();ctx.arc(px,py,ff.size*5.5,0,Math.PI*2);ctx.fillStyle=`rgba(255,215,100,${a*0.05})`;ctx.fill();
            ctx.beginPath();ctx.arc(px,py,ff.size*2.8,0,Math.PI*2);ctx.fillStyle=`rgba(255,225,120,${a*0.14})`;ctx.fill();
            ctx.beginPath();ctx.arc(px,py,ff.size,0,Math.PI*2);ctx.fillStyle=`rgba(255,235,155,${a})`;ctx.fill();
          } else {
            ctx.beginPath();ctx.arc(px,py,ff.size*5.5,0,Math.PI*2);ctx.fillStyle=`rgba(180,200,255,${a*0.04})`;ctx.fill();
            ctx.beginPath();ctx.arc(px,py,ff.size*2.8,0,Math.PI*2);ctx.fillStyle=`rgba(200,215,255,${a*0.12})`;ctx.fill();
            ctx.beginPath();ctx.arc(px,py,ff.size,0,Math.PI*2);ctx.fillStyle=`rgba(220,230,255,${a*0.85})`;ctx.fill();
          }
        });
      }
      animFrame.current=requestAnimationFrame(loop);
    };
    animFrame.current=requestAnimationFrame(loop);
    return()=>{if(animFrame.current)cancelAnimationFrame(animFrame.current);};
  },[]);

  // Resize canvas
  useEffect(()=>{
    const resize=()=>{const c=canvasRef.current;if(c){c.width=window.innerWidth;c.height=window.innerHeight;}};
    resize();window.addEventListener("resize",resize);
    return()=>window.removeEventListener("resize",resize);
  },[]);

  return(
    <div ref={containerRef} style={{position:"absolute",inset:0,zIndex:0,overflow:"hidden",background:"#06080A",cursor:"grab"}} onMouseDown={()=>{if(containerRef.current)containerRef.current.style.cursor="grabbing";}} onMouseUp={()=>{if(containerRef.current)containerRef.current.style.cursor="grab";}}>
      <img ref={imgRef} src={MAP_BG_IMAGE} alt="World Map" style={{position:"absolute",top:0,left:0,width:`calc(100% + ${PARALLAX*2}px)`,height:`calc(100% + ${PARALLAX*2}px)`,objectFit:"cover",transform:`translate(${-PARALLAX}px,${-PARALLAX}px)`,willChange:"transform",userSelect:"none",WebkitUserDrag:"none",pointerEvents:"none"}} draggable={false}/>
      {/* Warm lantern glows centered on each building */}
      {/* Cabin glow */}
      <div style={{position:"absolute",left:"18%",top:"70%",width:"24%",height:"18%",pointerEvents:"none",zIndex:1,borderRadius:"50%",background:"radial-gradient(circle,rgba(255,170,50,0.10) 0%, transparent 70%)",mixBlendMode:"screen",animation:"candleGlowPulse 4.2s ease-in-out infinite"}}/>
      {/* Market glow */}
      <div style={{position:"absolute",left:"44%",top:"40%",width:"26%",height:"18%",pointerEvents:"none",zIndex:1,borderRadius:"50%",background:"radial-gradient(circle,rgba(255,180,60,0.12) 0%, transparent 65%)",mixBlendMode:"screen",animation:"candleGlowPulse 3.8s ease-in-out infinite 1.2s"}}/>
      {/* Upper Room glow */}
      <div style={{position:"absolute",left:"56%",top:"5%",width:"22%",height:"16%",pointerEvents:"none",zIndex:1,borderRadius:"50%",background:"radial-gradient(circle,rgba(255,200,100,0.08) 0%, transparent 70%)",mixBlendMode:"screen",animation:"candleGlowPulse 5s ease-in-out infinite 0.6s"}}/>
      {/* Prayer Garden glow */}
      <div style={{position:"absolute",left:"8%",top:"28%",width:"20%",height:"16%",pointerEvents:"none",zIndex:1,borderRadius:"50%",background:"radial-gradient(circle,rgba(200,255,200,0.06) 0%, transparent 70%)",mixBlendMode:"screen",animation:"candleGlowPulse 4.6s ease-in-out infinite 0.8s"}}/>
      {/* Path glow — warm light along the winding paths */}
      <div style={{position:"absolute",left:"25%",top:"35%",width:"50%",height:"45%",pointerEvents:"none",zIndex:1,background:"radial-gradient(ellipse at 50% 55%,rgba(255,190,90,0.03) 0%, transparent 55%)",mixBlendMode:"screen"}}/>
      {/* Starry sky shimmer at top */}
      <div style={{position:"absolute",left:0,top:0,right:0,height:"15%",pointerEvents:"none",zIndex:1,background:"linear-gradient(180deg, rgba(100,120,200,0.04) 0%, transparent 100%)",mixBlendMode:"screen"}}/>
      {/* Firefly + dust canvas */}
      <canvas ref={canvasRef} style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:2}}/>
      {/* Cinematic vignette */}
      <div style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:3,background:"radial-gradient(ellipse at center 50%, transparent 25%, rgba(4,6,10,0.55) 100%)"}}/>
      {/* Top shadow */}
      <div style={{position:"absolute",top:0,left:0,right:0,height:"15%",pointerEvents:"none",zIndex:3,background:"linear-gradient(to bottom, rgba(4,6,10,0.3), transparent)"}}/>
      {/* Bottom shadow */}
      <div style={{position:"absolute",bottom:0,left:0,right:0,height:"12%",pointerEvents:"none",zIndex:3,background:"linear-gradient(to top, rgba(4,6,10,0.25), transparent)"}}/>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   IMMERSIVE UPPER ROOM — parallax + candle particles
═══════════════════════════════════════════════════ */
function ImmersiveUpperRoom(){
  const containerRef=useRef(null);
  const canvasRef=useRef(null);
  const offsetX=useRef(0);
  const offsetY=useRef(0);
  const targetX=useRef(0);
  const targetY=useRef(0);
  const dragStart=useRef(null);
  const animFrame=useRef(null);
  const particles=useRef([]);
  const time=useRef(0);
  const imgRef=useRef(null);

  const PARALLAX=18;
  const SENSITIVITY=0.35;

  useEffect(()=>{
    const pts=[];
    // Warm dust motes drifting through candlelight
    for(let i=0;i<20;i++){
      pts.push({
        x:0.10+Math.random()*0.80,
        y:0.10+Math.random()*0.80,
        size:Math.random()*1.6+0.5,
        speed:Math.random()*0.00008+0.00003,
        drift:(Math.random()-0.5)*0.00012,
        opacity:Math.random()*0.22+0.04,
        phase:Math.random()*Math.PI*2,
        isMote:true,
      });
    }
    // Candle-flame fireflies near the lower half
    for(let i=0;i<10;i++){
      pts.push({
        x:0.15+Math.random()*0.70,
        y:0.40+Math.random()*0.50,
        size:Math.random()*1.2+0.5,
        sx:(Math.random()-0.5)*0.00012,
        sy:(Math.random()-0.5)*0.00008,
        opacity:Math.random()*0.5+0.2,
        phase:Math.random()*Math.PI*2,
        blink:Math.random()*0.003+0.001,
        isFirefly:true,
      });
    }
    particles.current=pts;
  },[]);

  useEffect(()=>{
    let active=true;
    const handle=(e)=>{if(!active)return;targetX.current=Math.max(-1,Math.min(1,(e.gamma||0)/30))*PARALLAX;targetY.current=Math.max(-1,Math.min(1,((e.beta||0)-45)/30))*PARALLAX;};
    if(typeof DeviceOrientationEvent!=="undefined"&&typeof DeviceOrientationEvent.requestPermission==="function"){
      const req=()=>{DeviceOrientationEvent.requestPermission().then(r=>{if(r==="granted")window.addEventListener("deviceorientation",handle);}).catch(()=>{});window.removeEventListener("touchstart",req);};
      window.addEventListener("touchstart",req,{once:true});
    } else { window.addEventListener("deviceorientation",handle); }
    return()=>{active=false;window.removeEventListener("deviceorientation",handle);};
  },[]);

  useEffect(()=>{
    const el=containerRef.current; if(!el) return;
    const start=(x,y)=>{dragStart.current={x,y,ox:targetX.current,oy:targetY.current};};
    const move=(x,y)=>{if(!dragStart.current)return;targetX.current=Math.max(-PARALLAX,Math.min(PARALLAX,dragStart.current.ox+(x-dragStart.current.x)*SENSITIVITY));targetY.current=Math.max(-PARALLAX,Math.min(PARALLAX,dragStart.current.oy+(y-dragStart.current.y)*SENSITIVITY));};
    const end=()=>{dragStart.current=null;};
    const ts=e=>{const t=e.touches[0];start(t.clientX,t.clientY);};
    const tm=e=>{const t=e.touches[0];move(t.clientX,t.clientY);};
    el.addEventListener("touchstart",ts,{passive:true});el.addEventListener("touchmove",tm,{passive:true});el.addEventListener("touchend",end);
    el.addEventListener("mousedown",e=>start(e.clientX,e.clientY));
    const mm=e=>move(e.clientX,e.clientY);
    window.addEventListener("mousemove",mm);window.addEventListener("mouseup",end);
    return()=>{el.removeEventListener("touchstart",ts);el.removeEventListener("touchmove",tm);el.removeEventListener("touchend",end);window.removeEventListener("mousemove",mm);window.removeEventListener("mouseup",end);};
  },[]);

  useEffect(()=>{
    const loop=()=>{
      time.current+=16;
      offsetX.current+=(targetX.current-offsetX.current)*0.06;
      offsetY.current+=(targetY.current-offsetY.current)*0.06;
      const bx=Math.sin(time.current*0.0003)*1.0;
      const by=Math.cos(time.current*0.00025)*0.6;
      if(imgRef.current) imgRef.current.style.transform=`translate(${-PARALLAX+offsetX.current+bx}px,${-PARALLAX+offsetY.current+by}px)`;
      const cvs=canvasRef.current;
      if(cvs){
        const ctx=cvs.getContext("2d"),w=cvs.width,h=cvs.height;
        ctx.clearRect(0,0,w,h);
        particles.current.forEach(p=>{
          if(p.isFirefly){
            p.x+=p.sx+Math.sin(time.current*0.0004+p.phase)*0.00004;
            p.y+=p.sy+Math.cos(time.current*0.0005+p.phase)*0.00003;
            if(p.x<0.10||p.x>0.90)p.sx*=-1;
            if(p.y<0.35||p.y>0.95)p.sy*=-1;
            p.x=Math.max(0.10,Math.min(0.90,p.x));
            p.y=Math.max(0.35,Math.min(0.95,p.y));
            const blink=Math.sin(time.current*p.blink+p.phase);
            const a=Math.max(0,blink*0.6+0.4)*p.opacity;
            const px=p.x*w,py=p.y*h;
            ctx.beginPath();ctx.arc(px,py,p.size*4,0,Math.PI*2);ctx.fillStyle=`rgba(255,190,80,${a*0.05})`;ctx.fill();
            ctx.beginPath();ctx.arc(px,py,p.size*1.8,0,Math.PI*2);ctx.fillStyle=`rgba(255,200,100,${a*0.12})`;ctx.fill();
            ctx.beginPath();ctx.arc(px,py,p.size*0.6,0,Math.PI*2);ctx.fillStyle=`rgba(255,220,150,${a*0.7})`;ctx.fill();
          } else if(p.isMote){
            p.y-=p.speed;
            p.x+=p.drift+Math.sin(time.current*0.0006+p.phase)*0.00005;
            if(p.y<-0.02){p.y=1.02;p.x=0.10+Math.random()*0.80;}
            const fl=0.5+0.5*Math.sin(time.current*0.0012+p.phase);
            const a=p.opacity*fl;
            const px=p.x*w,py=p.y*h;
            ctx.beginPath();ctx.arc(px,py,p.size,0,Math.PI*2);
            ctx.fillStyle=`rgba(255,220,160,${a})`;ctx.fill();
          }
        });
      }
      animFrame.current=requestAnimationFrame(loop);
    };
    animFrame.current=requestAnimationFrame(loop);
    return()=>{if(animFrame.current)cancelAnimationFrame(animFrame.current);};
  },[]);

  useEffect(()=>{
    const resize=()=>{const c=canvasRef.current;if(c){c.width=window.innerWidth;c.height=window.innerHeight;}};
    resize();window.addEventListener("resize",resize);
    return()=>window.removeEventListener("resize",resize);
  },[]);

  return(
    <div ref={containerRef} style={{position:"absolute",inset:0,zIndex:0,overflow:"hidden",background:"#12101A",cursor:"grab"}} onMouseDown={()=>{if(containerRef.current)containerRef.current.style.cursor="grabbing";}} onMouseUp={()=>{if(containerRef.current)containerRef.current.style.cursor="grab";}}>
      <img ref={imgRef} src={UPPER_ROOM_BG_IMAGE} alt="Upper Room" style={{position:"absolute",top:0,left:0,width:`calc(100% + ${PARALLAX*2}px)`,height:`calc(100% + ${PARALLAX*2}px)`,objectFit:"cover",transform:`translate(${-PARALLAX}px,${-PARALLAX}px)`,willChange:"transform",userSelect:"none",WebkitUserDrag:"none",pointerEvents:"none"}} draggable={false}/>
      {/* Warm candle glow — center area */}
      <div style={{position:"absolute",left:"25%",top:"35%",width:"50%",height:"40%",pointerEvents:"none",zIndex:1,borderRadius:"50%",background:"radial-gradient(ellipse at 50% 55%,rgba(255,180,60,0.10) 0%,rgba(255,140,40,0.04) 50%,transparent 75%)",mixBlendMode:"screen",animation:"kitchenFireGlow 3.5s ease-in-out infinite"}}/>
      {/* Soft purple ambient light from above */}
      <div style={{position:"absolute",left:"15%",top:"0%",width:"70%",height:"30%",pointerEvents:"none",zIndex:1,background:"radial-gradient(ellipse at 50% 100%,rgba(180,160,210,0.06) 0%,transparent 70%)",mixBlendMode:"screen"}}/>
      {/* Candle pillar glow — left */}
      <div style={{position:"absolute",left:"10%",top:"50%",width:"18%",height:"25%",pointerEvents:"none",zIndex:1,borderRadius:"50%",background:"radial-gradient(circle,rgba(255,200,80,0.12) 0%,rgba(255,160,40,0.04) 50%,transparent 70%)",mixBlendMode:"screen",animation:"kitchenFireGlow 2.8s ease-in-out infinite",animationDelay:"0.4s"}}/>
      {/* Candle pillar glow — right */}
      <div style={{position:"absolute",right:"10%",top:"50%",width:"18%",height:"25%",pointerEvents:"none",zIndex:1,borderRadius:"50%",background:"radial-gradient(circle,rgba(255,200,80,0.12) 0%,rgba(255,160,40,0.04) 50%,transparent 70%)",mixBlendMode:"screen",animation:"kitchenFireGlow 3.2s ease-in-out infinite",animationDelay:"0.8s"}}/>
      <canvas ref={canvasRef} style={{position:"absolute",inset:0,zIndex:2,pointerEvents:"none"}}/>
      {/* Cinematic vignette */}
      <div style={{position:"absolute",inset:0,zIndex:3,pointerEvents:"none",background:"radial-gradient(ellipse at 50% 50%,transparent 55%,rgba(12,10,20,0.5) 100%)"}}/>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN APP
═══════════════════════════════════════════════════ */
export default function App(){
  // ── STATE ──
  const [screen,        setScreen]        = useState("loading");
  const [obStep,        setObStep]        = useState(0);
  const [sceneIdx,      setSceneIdx]      = useState(0);
  const [sceneTransit,  setSceneTransit]  = useState(false);
  const [scenePrev,     setScenePrev]     = useState(-1);
  const [bookOpen,      setBookOpen]      = useState(false);
  const [prevScreen,    setPrevScreen]    = useState("cabin");
  const [spaceTransit,  setSpaceTransit]  = useState(false);
  const [transitDir,    setTransitDir]    = useState(null);
  const [stoveZoom,     setStoveZoom]     = useState(false);
  const [windowZoom,    setWindowZoom]    = useState(false);
  const [journalZoom,   setJournalZoom]   = useState(false);
  const [bookPage,      setBookPage]      = useState(0);
  const [flipDir,       setFlipDir]       = useState(null);
  const touchRef = useRef({startX:0,startY:0});
  const [isOnboarded,   setIsOnboarded]   = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [doorOpening,   setDoorOpening]   = useState(false);
  const [doorPhase,     setDoorPhase]     = useState(null); // null|"walk"|"door"|"enter"
  const [deskBook,      setDeskBook]      = useState("journal");
  const [shelfAnim,     setShelfAnim]     = useState(null);
  const [windowPanel,   setWindowPanel]   = useState(null);
  const [showStreak,    setShowStreak]    = useState(false);
  const [showInsights,  setShowInsights]  = useState(false);
  // Cabin rendering mode: "immersive" (parallax fallback) or "3d" (future real GLB)
  // Defaults to "immersive" until a proper cabin model is built
  const [cabinMode,     setCabinMode]     = useState("immersive"); // "immersive" | "3d"
  const [cabin3DReady,  setCabin3DReady]  = useState(false);       // flips true when real GLB is deployed
  const streakTimerRef = useRef(null);
  const [entries,       setEntries]       = useState([]);
  const [streak,        setStreak]        = useState(0);
  const [activeRoom,    setActiveRoom]    = useState(null);
  const [journalStep,   setJournalStep]   = useState(0);
  const [activeDay,     setActiveDay]     = useState(0);
  const [jTexts,        setJTexts]        = useState(["","",""]);
  const [saveMsg,       setSaveMsg]       = useState("");
  const [bookText,      setBookText]      = useState("");
  const [bookSaveMsg,   setBookSaveMsg]   = useState("");
  const [journalSection,setJournalSection]= useState(null); // null|"blank"|"rooms"|"dreams"|"prayers"
  const [prayerPosts,   setPrayerPosts]   = useState([]);
  const [newPrayer,     setNewPrayer]     = useState("");
  const [prayerTag,     setPrayerTag]     = useState("");
  const [commTab,       setCommTab]       = useState("rooms");
  const [commSearch,    setCommSearch]    = useState("");
  const [jesusIdx,      setJesusIdx]      = useState(0);
  const [jesusText,     setJesusText]     = useState("");
  const [jesusSaved,    setJesusSaved]    = useState(false);
  // card engine
  const [cardQ,         setCardQ]         = useState(ALL_CARD_QS[0]);
  const [cardCustom,    setCardCustom]    = useState("");
  const [isCustomCard,  setIsCustomCard]  = useState(false);
  const [cardTheme,     setCardTheme]     = useState(CARD_THEMES[0]);
  const [cardRatio,     setCardRatio]     = useState(CARD_RATIOS[0]);
  const [cardSet,       setCardSet]       = useState("all");
  const [cardGenMsg,    setCardGenMsg]    = useState("");
  const [cardGenerating,setCardGenerating]= useState(false);
  const [savedCards,    setSavedCards]    = useState([]);
  const [cardTab,       setCardTab]       = useState("create");
  const [copied,        setCopied]        = useState(false);
  // auth & cloud sync
  const [user,          setUser]          = useState(null);
  const [authLoading,   setAuthLoading]   = useState(true);
  const [syncStatus,    setSyncStatus]    = useState(null);
  // calendar history
  const [calMonth,       setCalMonth]       = useState(()=>new Date().getMonth());
  const [calYear,        setCalYear]        = useState(()=>new Date().getFullYear());
  const [calSelectedDay, setCalSelectedDay] = useState(null);
  const [expandedEntry,  setExpandedEntry]  = useState(null);
  // journey / insights
  const [journeyTab,     setJourneyTab]     = useState("overview");
  const [seasonalPeriod, setSeasonalPeriod] = useState(30);
  const [prayerFilter,   setPrayerFilter]   = useState("active");
  // candle economy
  const [candles,        setCandles]        = useState(0);
  const [prayedFor,      setPrayedFor]      = useState([]);
  const [ownedItems,     setOwnedItems]    = useState([]);
  const [candleReward,   setCandleReward]  = useState(null);
  const [shopCategory,   setShopCategory]  = useState("all");
  // prayer garden
  const [gardenPlots,    setGardenPlots]   = useState([]);
  const [inventory,      setInventory]     = useState({});
  const [gardenTab,      setGardenTab]     = useState("garden");
  const [selectedPlot,   setSelectedPlot]  = useState(null);
  const [craftingStation,setCraftingStation]= useState(null);
  const [doorChoice,     setDoorChoice]    = useState(false);
  const [debugHotspots,  setDebugHotspots] = useState(false);
  const [plantModal,     setPlantModal]    = useState(null);
  const [plantStep,      setPlantStep]     = useState(1);
  const [plantPrayerId,  setPlantPrayerId] = useState(null);
  const [gardenTick,     setGardenTick]   = useState(0); // forces re-render for growth updates
  // ambient sound
  const [ambientMuted,   setAmbientMuted]  = useState(false);
  const ambientMutedRef = useRef(false); // ref mirror for use inside effects

  // ── Bible reader (Upper Room) ──
  const [bibleView,     setBibleView]     = useState(null);   // null|"books"|"chapters"|"reading"
  const [bibleBook,     setBibleBook]     = useState(0);
  const [bibleChapter,  setBibleChapter]  = useState(0);
  const [bibleFontSize, setBibleFontSize] = useState(()=>{try{return parseInt(localStorage.getItem("irj-bible-fontsize"))||18;}catch{return 18;}});
  const [bibleLoading,  setBibleLoading]  = useState(false);
  const [bibleSearch,   setBibleSearch]   = useState("");
  const bibleDataRef = useRef(null);
  // ── Market stalls ──
  const [marketStall, setMarketStall] = useState(null); // null|"harvest"
  // ── Economy state ──
  const [bank,         setBank]         = useState({coins:0, diamonds:0});
  const [sellBasket,   setSellBasket]   = useState([]);   // [{itemId, qty, listedAt}]
  const [shopStall,    setShopStall]    = useState(null);  // "general"|"barter"
  const [inventoryTab, setInventoryTab] = useState("all"); // category filter
  const [farmPlots,    setFarmPlots]    = useState([]); // economy garden plots
  const [gardenMode,   setGardenMode]   = useState("farm"); // "farm"|"prayers"
  // ── Verse selection, saving, sharing ──
  const [selectedVerses,    setSelectedVerses]    = useState(new Set());
  const [savedVerses,       setSavedVerses]       = useState([]);
  const [verseActionBar,    setVerseActionBar]    = useState(false);
  const [savedVersesView,   setSavedVersesView]   = useState(false);
  const [verseShareOverlay, setVerseShareOverlay] = useState(null);
  const [verseTheme,        setVerseTheme]        = useState(VERSE_THEMES[0]);
  const [verseRatio,        setVerseRatio]        = useState(CARD_RATIOS[0]);
  const [verseCopied,       setVerseCopied]       = useState(false);
  const [verseImportPicker, setVerseImportPicker] = useState(false);

  // ── OUTDOOR IMAGE RECT — keeps glow overlays aligned to actual image features ──
  // The outdoor.png is displayed with object-fit:cover + object-position:center 30%
  // which crops differently on every screen size. This calculates the actual rendered
  // image rectangle so glow overlays can use image-relative percentages.
  const outdoorImgRef = useRef(null);
  const [imgRect, setImgRect] = useState(null);
  function recalcOutdoorRect(){
    const img=outdoorImgRef.current;
    if(!img||!img.naturalWidth) return;
    const nw=img.naturalWidth,nh=img.naturalHeight,cw=img.clientWidth,ch=img.clientHeight;
    const ir=nw/nh,cr=cw/ch;
    let rw,rh,ox,oy;
    if(cr<ir){rh=ch;rw=ch*ir;oy=0;ox=0.5*(cw-rw);}
    else{rw=cw;rh=cw/ir;ox=0;oy=0.3*(ch-rh);}
    setImgRect({w:rw,h:rh,x:ox,y:oy});
  }
  useEffect(()=>{
    if(screen!=="welcome"){setImgRect(null);return;}
    window.addEventListener('resize',recalcOutdoorRect);
    return()=>window.removeEventListener('resize',recalcOutdoorRect);
  },[screen]);

  // ── GARDEN GROWTH TIMER ──
  // Ticks every 30s while on garden screen so progress bars & stages update live
  useEffect(()=>{
    if(screen!=="garden") return;
    const id=setInterval(()=>setGardenTick(t=>t+1),30000);
    return ()=>clearInterval(id);
  },[screen]);

  // ── AMBIENT SOUND — auto-play / stop per screen ──
  useEffect(()=>{
    ambientMutedRef.current = ambientMuted;
  },[ambientMuted]);

  useEffect(()=>{
    const track = AMBIENT_TRACKS[screen];
    if(track){
      if(!ambientMutedRef.current){
        ambientPlay(track.src, { volume: track.volume, fadeMs: 2000, id: track.id });
      }
    } else {
      // Leaving a room with ambient — fade out
      if(_amb.el) ambientStop(2000);
    }
    return ()=>{
      // Cleanup on screen change — if new screen has no track, stop is handled above
    };
  },[screen]);

  function toggleAmbientMute(){
    if(ambientMuted){
      setAmbientMuted(false);
      // Resume: play the current screen's track
      const track = AMBIENT_TRACKS[screen];
      if(track) ambientPlay(track.src, { volume: track.volume, fadeMs: 800, id: track.id });
    } else {
      setAmbientMuted(true);
      ambientMute();
    }
  }

  // ── Bible data loader (Upper Room) ──
  const loadBible = useCallback(async()=>{
    if(bibleDataRef.current) return bibleDataRef.current;
    setBibleLoading(true);
    try{
      const cached=localStorage.getItem("irj-kjv-cache");
      if(cached){const data=JSON.parse(cached);bibleDataRef.current=data;setBibleLoading(false);return data;}
      const res=await fetch("/kjv.json");
      const data=await res.json();
      bibleDataRef.current=data;
      try{localStorage.setItem("irj-kjv-cache",JSON.stringify(data));}catch(e){}
      setBibleLoading(false);
      return data;
    }catch(e){console.error("Bible load:",e);setBibleLoading(false);return null;}
  },[]);

  const getDailyVerse = useCallback((bd)=>{
    if(!bd||!bd.length) return null;
    const today=new Date();
    const ds=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
    const cached=localStorage.getItem("irj-daily-verse");
    if(cached){try{const cv=JSON.parse(cached);if(cv.date===ds)return cv;}catch(e){}}
    let h=0;for(let i=0;i<ds.length;i++){h=((h<<5)-h)+ds.charCodeAt(i);h=h&h;}
    h=Math.abs(h);
    const bi=h%bd.length,book=bd[bi],ci=(h>>>3)%book.chapters.length,ch=book.chapters[ci],vi=(h>>>7)%ch.length;
    const v={date:ds,text:ch[vi],ref:`${book.name} ${ci+1}:${vi+1}`,bookIdx:bi,chapIdx:ci,verseIdx:vi};
    localStorage.setItem("irj-daily-verse",JSON.stringify(v));
    return v;
  },[]);

  // ── Bible preload when entering Upper Room ──
  useEffect(()=>{
    if(screen==="upper-room"&&!bibleDataRef.current) loadBible();
  },[screen,loadBible]);

  // ── Bible font size persistence ──
  useEffect(()=>{localStorage.setItem("irj-bible-fontsize",String(bibleFontSize));},[bibleFontSize]);

  // ── Bible scroll-to-top on chapter/book change ──
  useEffect(()=>{
    const el=document.querySelector("[data-bible-scroll]");
    if(el) el.scrollTop=0;
    setSelectedVerses(new Set());
    setVerseActionBar(false);
  },[bibleChapter,bibleBook]);

  // ── HOTSPOT DEBUG MODE ──
  // Toggle: ?debug=1 in URL  |  Ctrl+Shift+. on desktop  |  triple-tap "🕯️ 0" candle badge on mobile
  const debugTapRef=useRef({count:0,timer:null});
  useEffect(()=>{
    if(new URLSearchParams(window.location.search).get("debug")==="1") setDebugHotspots(true);
    const handler=(e)=>{if(e.ctrlKey&&e.shiftKey&&e.key===">"){e.preventDefault();setDebugHotspots(d=>!d);}};
    window.addEventListener("keydown",handler);
    return ()=>window.removeEventListener("keydown",handler);
  },[]);
  function debugTripleTap(){
    const r=debugTapRef.current;
    r.count++;
    clearTimeout(r.timer);
    if(r.count>=3){r.count=0;setDebugHotspots(d=>!d);return;}
    r.timer=setTimeout(()=>{r.count=0;},600);
  }

  // ── LOAD ──
  useEffect(()=>{
    (async()=>{
      const ens  = await dbLoad("irj-entries") || [];
      const pp   = await dbLoad("irj-prayer")  || SAMPLE_PRAYERS;
      const ob   = await dbLoad("irj-onboarded");
      const sc   = await dbLoad("irj-saved-cards") || [];
      const cn   = await dbLoad("irj-candles") || 0;
      const pf   = await dbLoad("irj-prayed") || [];
      const oi   = await dbLoad("irj-owned-items") || [];
      const gp   = await dbLoad("irj-garden") || Array.from({length:12},(_,i)=>({id:i+1,prayerId:null,plantType:null,stage:"empty",plantedAt:null,prayerCount:0}));
      const inv  = await dbLoad("irj-inventory") || {};
      const sv   = await dbLoad("irj-saved-verses") || [];
      const bnk  = await dbLoad("irj-bank") || {coins:0, diamonds:0};
      const sb   = await dbLoad("irj-sell-basket") || [];
      const fp   = await dbLoad("irj-farm-plots") || Array.from({length:12},(_,i)=>({id:i+1,plantType:null,stage:"empty",plantedAt:null}));
      // Migrate prayers: add status/answeredDate/category if missing
      let migrated=false;
      const mpp=pp.map(p=>{
        if(!p.status){migrated=true;return {...p,status:"active",answeredDate:null,category:p.tag};}
        return p;
      });
      if(migrated) dbSave("irj-prayer",mpp);
      setEntries(ens); setPrayerPosts(mpp); setSavedCards(sc);
      setCandles(cn); setPrayedFor(pf); setOwnedItems(oi); setGardenPlots(gp); setInventory(inv); setSavedVerses(sv);
      setBank(bnk); setSellBasket(sb); setFarmPlots(fp);
      let s=0,d=new Date(),map={};
      ens.forEach(e=>{map[e.date]=true;});
      while(map[isoDate(d)]){s++;d.setDate(d.getDate()-1);} setStreak(s);
      setIsOnboarded(!!ob);
      setScreen("welcome");
      setCardQ(shuffle(ALL_CARD_QS)[0]);
      // preload spatial world backgrounds
      ["cabin-interior.png","upper-room-hall.png","harvest-market.png"].forEach(src=>{const img=new Image();img.src="/"+src;});
    })();
  },[]);

  // ── AUTH LISTENER ──
  useEffect(()=>{
    if(!auth) { setAuthLoading(false); return; }
    getRedirectResult(auth).catch(()=>{});
    const unsub=onAuthStateChanged(auth,async(u)=>{
      setUser(u);
      setAuthLoading(false);
      if(u) await syncWithCloud(u.uid);
    });
    return ()=>unsub();
  },[]);

  // ── SELL BASKET AUTO-SELL TIMER ──
  useEffect(()=>{
    const timer=setInterval(()=>{
      setSellBasket(prev=>{
        if(!prev.length) return prev;
        const now=Date.now();
        const ready=prev.filter(b=>now-b.listedAt>=30*60*1000);
        if(!ready.length) return prev;
        const remaining=prev.filter(b=>now-b.listedAt<30*60*1000);
        let earned=0;
        ready.forEach(b=>{
          const cat=ITEM_CATALOG[b.itemId];
          if(cat) earned+=cat.sellPrice*b.qty;
        });
        if(earned>0){
          setBank(bk=>{
            const nb={...bk,coins:(bk.coins||0)+earned};
            dbSave("irj-bank",nb);
            return nb;
          });
          setToast({msg:`Market sold your goods! +${earned} coins`,emoji:"..."});
        }
        dbSave("irj-sell-basket",remaining);
        return remaining;
      });
    },60000);
    return ()=>clearInterval(timer);
  },[]);

  // ── CLOUD SYNC ──
  function mergeById(localArr,cloudArr){
    const map=new Map();
    (cloudArr||[]).forEach(item=>map.set(item.id,item));
    (localArr||[]).forEach(item=>{ if(!map.has(item.id)) map.set(item.id,item); });
    return Array.from(map.values()).sort((a,b)=>{
      if(a.date&&b.date) return b.date.localeCompare(a.date)||b.id.localeCompare(a.id);
      return parseInt(b.id)-parseInt(a.id);
    });
  }

  async function syncWithCloud(uid){
    setSyncStatus("syncing");
    try{
      const userRef=doc(db,"users",uid);
      const snap=await getDoc(userRef);
      const cloud=snap.exists()?snap.data():{};

      const localEntries=await dbLoad("irj-entries")||[];
      const localPrayers=await dbLoad("irj-prayer")||[];
      const localCards=await dbLoad("irj-saved-cards")||[];
      const localOnboard=await dbLoad("irj-onboarded");
      const localCandles=await dbLoad("irj-candles")||0;
      const localPrayed=await dbLoad("irj-prayed")||[];
      const localOwned=await dbLoad("irj-owned-items")||[];
      const localGarden=await dbLoad("irj-garden")||[];
      const localInv=await dbLoad("irj-inventory")||{};
      const localVerses=await dbLoad("irj-saved-verses")||[];
      const localBank=await dbLoad("irj-bank")||{coins:0,diamonds:0};
      const localSellBasket=await dbLoad("irj-sell-basket")||[];
      const localFarmPlots=await dbLoad("irj-farm-plots")||[];

      const mergedEntries=mergeById(localEntries,cloud.entries||[]);
      const mergedPrayers=mergeById(localPrayers,cloud.prayerPosts||[]);
      const mergedCards=mergeById(localCards,cloud.savedCards||[]);
      const mergedOnboard=localOnboard||cloud.isOnboarded||false;
      const mergedCandles=Math.max(localCandles,cloud.candles||0);
      const mergedPrayed=[...new Set([...localPrayed,...(cloud.prayedFor||[])])];
      const mergedOwned=[...new Set([...localOwned,...(cloud.ownedItems||[])])];
      // Garden: merge by plot id (local wins for non-empty, cloud wins if local empty)
      const cloudGarden=cloud.gardenPlots||[];
      const mergedGarden=localGarden.length?localGarden.map(lp=>{
        const cp=cloudGarden.find(c=>c.id===lp.id);
        if(!cp) return lp;
        if(lp.stage==="empty"&&cp.stage!=="empty") return cp;
        if(lp.stage!=="empty") return lp;
        return lp;
      }):cloudGarden.length?cloudGarden:Array.from({length:12},(_,i)=>({id:i+1,prayerId:null,plantType:null,stage:"empty",plantedAt:null,prayerCount:0}));
      // Inventory: max per item
      const cloudInv=cloud.inventory||{};
      const mergedInv={...cloudInv};
      Object.keys(localInv).forEach(k=>{mergedInv[k]=Math.max(localInv[k]||0,mergedInv[k]||0);});
      const mergedVerses=mergeById(localVerses,cloud.savedVerses||[]);
      // Bank: max per currency
      const cloudBank=cloud.bank||{coins:0,diamonds:0};
      const mergedBank={coins:Math.max(localBank.coins||0,cloudBank.coins||0),diamonds:Math.max(localBank.diamonds||0,cloudBank.diamonds||0)};
      // Sell basket: keep local (transient)
      const mergedSellBasket=localSellBasket.length?localSellBasket:(cloud.sellBasket||[]);
      // Farm plots: merge like garden plots
      const cloudFarmPlots=cloud.farmPlots||[];
      const mergedFarmPlots=localFarmPlots.length?localFarmPlots.map(lp=>{
        const cp=cloudFarmPlots.find(c=>c.id===lp.id);
        if(!cp) return lp;
        if(lp.stage==="empty"&&cp.stage!=="empty") return cp;
        return lp;
      }):cloudFarmPlots.length?cloudFarmPlots:Array.from({length:12},(_,i)=>({id:i+1,plantType:null,stage:"empty",plantedAt:null}));

      localStorage.setItem("irj-entries",JSON.stringify(mergedEntries));
      localStorage.setItem("irj-prayer",JSON.stringify(mergedPrayers));
      localStorage.setItem("irj-saved-cards",JSON.stringify(mergedCards));
      localStorage.setItem("irj-onboarded",JSON.stringify(mergedOnboard));
      localStorage.setItem("irj-candles",JSON.stringify(mergedCandles));
      localStorage.setItem("irj-prayed",JSON.stringify(mergedPrayed));
      localStorage.setItem("irj-owned-items",JSON.stringify(mergedOwned));
      localStorage.setItem("irj-garden",JSON.stringify(mergedGarden));
      localStorage.setItem("irj-inventory",JSON.stringify(mergedInv));
      localStorage.setItem("irj-saved-verses",JSON.stringify(mergedVerses));
      localStorage.setItem("irj-bank",JSON.stringify(mergedBank));
      localStorage.setItem("irj-sell-basket",JSON.stringify(mergedSellBasket));
      localStorage.setItem("irj-farm-plots",JSON.stringify(mergedFarmPlots));

      await setDoc(userRef,{
        entries:mergedEntries,
        prayerPosts:mergedPrayers,
        savedCards:mergedCards,
        isOnboarded:mergedOnboard,
        candles:mergedCandles,
        prayedFor:mergedPrayed,
        ownedItems:mergedOwned,
        gardenPlots:mergedGarden,
        inventory:mergedInv,
        savedVerses:mergedVerses,
        bank:mergedBank,
        sellBasket:mergedSellBasket,
        farmPlots:mergedFarmPlots,
        lastSyncedAt:new Date().toISOString(),
      });

      setEntries(mergedEntries);
      setPrayerPosts(mergedPrayers);
      setSavedCards(mergedCards);
      setIsOnboarded(!!mergedOnboard);
      setCandles(mergedCandles);
      setPrayedFor(mergedPrayed);
      setOwnedItems(mergedOwned);
      setGardenPlots(mergedGarden);
      setInventory(mergedInv);
      setSavedVerses(mergedVerses);
      setBank(mergedBank);
      setSellBasket(mergedSellBasket);
      setFarmPlots(mergedFarmPlots);

      let s=0,d=new Date(),map={};
      mergedEntries.forEach(e=>{map[e.date]=true;});
      while(map[isoDate(d)]){s++;d.setDate(d.getDate()-1);} setStreak(s);

      setSyncStatus("synced");
      setTimeout(()=>setSyncStatus(null),3000);
    }catch(err){
      console.error("Sync error:",err);
      setSyncStatus("error");
      setTimeout(()=>setSyncStatus(null),5000);
    }
  }

  async function handleGoogleSignIn(){
    if(!auth){console.error("Auth not initialized");return;}
    try{ await signInWithPopup(auth,googleProvider); }
    catch(err){
      console.error("Google Sign-In error:",err.code,err.message);
      if(err.code==="auth/popup-blocked"||err.code==="auth/popup-closed-by-user"){
        try{ await signInWithRedirect(auth,googleProvider); }
        catch(e2){ console.error("Redirect fallback error:",e2.code,e2.message); }
      }
    }
  }

  async function handleSignOut(){
    if(!auth) return;
    await signOut(auth);
    setUser(null);
    setSyncStatus(null);
  }

  async function persistEntries(list){
    setEntries(list); await dbSave("irj-entries",list);
    let s=0,d=new Date(),map={};
    list.forEach(e=>{map[e.date]=true;});
    while(map[isoDate(d)]){s++;d.setDate(d.getDate()-1);} setStreak(s);
  }

  // ── SAVED VERSES ──
  async function persistSavedVerses(list){
    setSavedVerses(list); await dbSave("irj-saved-verses",list);
  }
  function toggleVerseSelection(idx){
    setSelectedVerses(prev=>{
      const next=new Set(prev);
      if(next.has(idx)) next.delete(idx); else next.add(idx);
      setVerseActionBar(next.size>0);
      return next;
    });
  }
  function getSelectedVerseText(){
    const bibleData=bibleDataRef.current;
    if(!bibleData) return {text:"",ref:""};
    const chap=bibleData[bibleBook].chapters[bibleChapter];
    const indices=[...selectedVerses].sort((a,b)=>a-b);
    const text=indices.map(i=>chap[i]).join(" ");
    const bookName=bibleData[bibleBook].name;
    const chapNum=bibleChapter+1;
    const verseNums=indices.map(i=>i+1);
    let rangeStr="";
    if(verseNums.length===1) rangeStr=`${verseNums[0]}`;
    else{
      // Compress consecutive ranges: 1,2,3,5 => "1-3, 5"
      const ranges=[];let start=verseNums[0],end=verseNums[0];
      for(let k=1;k<verseNums.length;k++){
        if(verseNums[k]===end+1) end=verseNums[k];
        else{ranges.push(start===end?`${start}`:`${start}-${end}`);start=end=verseNums[k];}
      }
      ranges.push(start===end?`${start}`:`${start}-${end}`);
      rangeStr=ranges.join(", ");
    }
    const ref=`${bookName} ${chapNum}:${rangeStr}`;
    return {text,ref};
  }
  function saveSelectedVerses(){
    const {text,ref}=getSelectedVerseText();
    if(!text) return;
    const indices=[...selectedVerses].sort((a,b)=>a-b);
    const sv={id:Date.now().toString(),bookIdx:bibleBook,chapIdx:bibleChapter,verseStart:indices[0],verseEnd:indices[indices.length-1],text,ref,date:todayStr(),highlightColor:"#D4A840"};
    persistSavedVerses([sv,...savedVerses]);
    setSelectedVerses(new Set());
    setVerseActionBar(false);
  }
  function deleteSavedVerse(id){
    persistSavedVerses(savedVerses.filter(v=>v.id!==id));
  }
  function insertVerseIntoJournal(verse){
    const quote=`"${verse.text}"\n-- ${verse.ref}\n\n`;
    setJTexts(tx=>{const n=[...tx];n[0]=quote+n[0];return n;});
    setVerseImportPicker(false);
  }
  async function downloadVerseCard(){
    const {text,ref}=verseShareOverlay||{};
    if(!text) return;
    const canvas=await renderVerseCard(text,ref,verseTheme,verseRatio);
    const link=document.createElement("a");
    link.download=`verse-${Date.now()}.png`;
    link.href=canvas.toDataURL("image/png");
    link.click();
  }
  async function copyVerseCard(){
    const {text,ref}=verseShareOverlay||{};
    if(!text) return;
    try{
      const canvas=await renderVerseCard(text,ref,verseTheme,verseRatio);
      const blob=await new Promise(r=>canvas.toBlob(r,"image/png"));
      await navigator.clipboard.write([new ClipboardItem({"image/png":blob})]);
      setVerseCopied(true);
      setTimeout(()=>setVerseCopied(false),2000);
    }catch(e){console.error("Copy failed:",e);}
  }

  // ── JOURNAL ──
  function enterRoom(room,returnTo){
    const done=entries.filter(e=>e.roomId===room.id).length;
    setActiveRoom(room); setActiveDay(Math.min(done,room.days.length-1));
    setPrevScreen(returnTo||"cabin");
    setJournalStep(0); setJTexts(["","",""]); setScreen("journal");
  }
  function saveEntry(){
    if(!jTexts[0].trim()) return;
    const e={id:Date.now().toString(),date:todayStr(),roomId:activeRoom.id,roomLabel:activeRoom.label,roomEmoji:activeRoom.emoji,day:activeDay,prompt:activeRoom.days[activeDay].q,text:jTexts.filter(Boolean).join("\n\n---\n\n"),words:jTexts.filter(Boolean).reduce((s,t)=>s+wc(t),0)};
    persistEntries([e,...entries]);
    addCandles(3,"Reflection saved +3 🕯️");
    setSaveMsg("✓ Saved to your history"); setTimeout(()=>{setSaveMsg("");setScreen(prevScreen);},2200);
  }
  function saveBookEntry(){
    if(!bookText.trim()||!BOOK_CONTENT[deskBook]) return;
    const pg=BOOK_CONTENT[deskBook].pages[bookPage-1];
    const book=SHELF_BOOKS.find(b=>b.id===deskBook);
    const e={id:Date.now().toString(),date:todayStr(),roomId:deskBook,roomLabel:book?.label||deskBook,roomEmoji:book?.emoji||"📖",day:bookPage-1,prompt:pg.prompt,text:bookText.trim(),words:wc(bookText)};
    persistEntries([e,...entries]);
    addCandles(3,"Reflection saved +3 🕯️");
    setBookSaveMsg("✓ Saved to history 📖"); setTimeout(()=>setBookSaveMsg(""),2500);
  }

  // ── PRAYER JOURNAL → GARDEN LINK ──
  function savePrayerJournalEntry(){
    if(!bookText.trim()) return;
    // Save as prayer post
    const p={id:Date.now().toString(),date:todayStr(),text:bookText.trim(),tag:"Journal Prayer",prayers:0,status:"active",answeredDate:null,category:"Journal Prayer"};
    const nextPrayers=[p,...prayerPosts]; setPrayerPosts(nextPrayers); dbSave("irj-prayer",nextPrayers);
    // Water the most recently planted growing garden plot
    setGardenPlots(prev=>{
      const growing=prev.filter(pl=>pl.stage!=="empty"&&pl.plantedAt&&getComputedStage(pl)!=="harvestable");
      if(!growing.length) return prev;
      const newest=growing.sort((a,b)=>b.plantedAt-a.plantedAt)[0];
      const next=prev.map(pl=>pl.id===newest.id?{...pl,prayerCount:(pl.prayerCount||0)+1}:pl);
      dbSave("irj-garden",next);
      return next;
    });
    addCandles(2,"Prayer saved +2");
    setBookText("");
    setBookSaveMsg("Prayer saved & garden watered!");
    setTimeout(()=>setBookSaveMsg(""),2500);
  }

  // ── PRAYER ──
  function postPrayer(){
    if(!newPrayer.trim()) return;
    const p={id:Date.now().toString(),date:todayStr(),text:newPrayer.trim(),tag:prayerTag||"General",prayers:0,status:"active",answeredDate:null,category:prayerTag||"General"};
    const next=[p,...prayerPosts]; setPrayerPosts(next); dbSave("irj-prayer",next);
    setNewPrayer(""); setPrayerTag("");
  }
  function prayFor(id){
    if(prayedFor.includes(id)) return;
    const next=prayerPosts.map(p=>p.id===id?{...p,prayers:p.prayers+1}:p);
    setPrayerPosts(next); dbSave("irj-prayer",next);
    setPrayedFor(prev=>{const np=[...prev,id];dbSave("irj-prayed",np);return np;});
    // Boost garden plot if this prayer is planted
    setGardenPlots(prev=>{
      const hasPlot=prev.some(p=>p.prayerId===id&&p.stage!=="empty");
      if(!hasPlot) return prev;
      const next=prev.map(p=>p.prayerId===id&&p.stage!=="empty"?{...p,prayerCount:p.prayerCount+1}:p);
      dbSave("irj-garden",next);
      return next;
    });
    addCandles(2,"You lit a candle for this prayer");
  }
  function markPrayerAnswered(id){
    const next=prayerPosts.map(p=>p.id===id?{...p,status:"answered",answeredDate:todayStr()}:p);
    setPrayerPosts(next); dbSave("irj-prayer",next);
    // Bloom garden plot instantly if this prayer is planted
    setGardenPlots(prev=>{
      const hasPlot=prev.some(p=>p.prayerId===id&&p.stage!=="empty");
      if(!hasPlot) return prev;
      const ng=prev.map(p=>p.prayerId===id&&p.stage!=="empty"?{...p,stage:"harvestable"}:p);
      dbSave("irj-garden",ng);
      return ng;
    });
  }
  function reactivatePrayer(id){
    const next=prayerPosts.map(p=>p.id===id?{...p,status:"active",answeredDate:null}:p);
    setPrayerPosts(next); dbSave("irj-prayer",next);
  }

  // ── CANDLE ECONOMY ──
  function addCandles(amount,message){
    setCandles(prev=>{const next=prev+amount;dbSave("irj-candles",next);return next;});
    setCandleReward({amount,message});
    setTimeout(()=>setCandleReward(null),2500);
  }
  function spendCandles(amount){
    setCandles(prev=>{const next=prev-amount;dbSave("irj-candles",next);return next;});
  }
  function buyShopItem(item){
    if(candles<item.cost||ownedItems.includes(item.id)) return;
    spendCandles(item.cost);
    setOwnedItems(prev=>{const next=[...prev,item.id];dbSave("irj-owned-items",next);return next;});
  }

  // ── COIN ECONOMY ──
  async function persistBank(b){ setBank(b); await dbSave("irj-bank",b); }
  async function persistSellBasket(b){ setSellBasket(b); await dbSave("irj-sell-basket",b); }
  async function persistInventory(inv){ setInventory(inv); await dbSave("irj-inventory",inv); }
  async function persistFarmPlots(fp){ setFarmPlots(fp); await dbSave("irj-farm-plots",fp); }

  function addToInventory(itemId, qty=1){
    setInventory(prev=>{
      const next={...prev, [itemId]:(prev[itemId]||0)+qty};
      dbSave("irj-inventory",next);
      return next;
    });
  }
  function removeFromInventory(itemId, qty=1){
    if((inventory[itemId]||0)<qty) return false;
    setInventory(prev=>{
      const next={...prev, [itemId]:(prev[itemId]||0)-qty};
      if(next[itemId]<=0) delete next[itemId];
      dbSave("irj-inventory",next);
      return next;
    });
    return true;
  }
  function hasIngredients(inputsObj){
    return Object.entries(inputsObj).every(([item,qty])=>(inventory[item]||0)>=qty);
  }
  function addCoins(amount, message){
    setBank(prev=>{
      const next={...prev, coins:prev.coins+amount};
      dbSave("irj-bank",next);
      return next;
    });
    setCandleReward({amount, message: message||`+${amount} coins`});
    setTimeout(()=>setCandleReward(null),2500);
  }
  function spendCoins(amount){
    if(bank.coins<amount) return false;
    setBank(prev=>{
      const next={...prev, coins:prev.coins-amount};
      dbSave("irj-bank",next);
      return next;
    });
    return true;
  }

  // ── FARM GARDEN (economy crops) ──
  function getFarmComputedStage(plot){
    if(plot.stage==="empty"||!plot.plantedAt) return "empty";
    const plant=FARM_PLANTS.find(p=>p.id===plot.plantType);
    if(!plant) return plot.stage;
    const elapsed=(Date.now()-plot.plantedAt)/60000;
    let accumulated=0;
    for(let i=0;i<plant.growthBase.length;i++){
      accumulated+=plant.growthBase[i];
      if(elapsed<accumulated) return GROWTH_STAGES[i];
    }
    return "harvestable";
  }
  function getFarmPlantEmoji(plot){
    if(plot.stage==="empty") return "";
    const plant=FARM_PLANTS.find(p=>p.id===plot.plantType);
    if(!plant) return "🌱";
    const stage=getFarmComputedStage(plot);
    const idx=GROWTH_STAGES.indexOf(stage);
    return plant.stageEmojis[Math.max(0,idx)]||plant.emoji;
  }
  function plantFarmSeed(plotId, plantTypeId){
    const plant=FARM_PLANTS.find(p=>p.id===plantTypeId);
    if(!plant||!plant.seedItem) return;
    if(!removeFromInventory(plant.seedItem,1)) return;
    setFarmPlots(prev=>{
      const next=prev.map(p=>p.id===plotId?{...p,plantType:plantTypeId,stage:"seed",plantedAt:Date.now()}:p);
      dbSave("irj-farm-plots",next);
      return next;
    });
  }
  function harvestFarmPlot(plotId){
    const plot=farmPlots.find(p=>p.id===plotId);
    if(!plot||getFarmComputedStage(plot)!=="harvestable") return;
    const plant=FARM_PLANTS.find(p=>p.id===plot.plantType);
    if(!plant) return;
    addToInventory(plant.harvestItem,1);
    setFarmPlots(prev=>{
      const next=prev.map(p=>p.id===plotId?{...p,plantType:null,stage:"empty",plantedAt:null}:p);
      dbSave("irj-farm-plots",next);
      return next;
    });
    setCandleReward({amount:1, message:`Harvested ${plant.name}!`});
    setTimeout(()=>setCandleReward(null),2500);
  }

  // ── PRAYER GARDEN ──
  function getComputedStage(plot){
    if(plot.stage==="empty"||!plot.plantedAt) return "empty";
    // Answered prayers instantly become harvestable
    const prayer=prayerPosts.find(p=>p.id===plot.prayerId);
    if(prayer&&prayer.status==="answered") return "harvestable";
    const plant=GARDEN_PLANTS.find(p=>p.id===plot.plantType);
    if(!plant) return plot.stage;
    const elapsed=(Date.now()-plot.plantedAt)/60000; // minutes
    const bonus=plot.prayerCount*PRAYER_BONUS_MINS;
    let accumulated=0;
    for(let i=0;i<plant.growthBase.length;i++){
      accumulated+=Math.max(0.5,plant.growthBase[i]-bonus); // min 30 sec per stage
      if(elapsed<accumulated) return GROWTH_STAGES[i];
    }
    return "harvestable";
  }
  function getStageIndex(stage){return GROWTH_STAGES.indexOf(stage);}
  function getPlantEmoji(plot){
    if(plot.stage==="empty") return "";
    const plant=GARDEN_PLANTS.find(p=>p.id===plot.plantType);
    if(!plant) return "🌱";
    const si=getStageIndex(getComputedStage(plot));
    return plant.stageEmojis[Math.max(0,si)]||"🌱";
  }
  function plantSeed(plotId,prayerId,plantTypeId){
    const plant=GARDEN_PLANTS.find(p=>p.id===plantTypeId);
    if(!plant||candles<plant.plantCost) return;
    spendCandles(plant.plantCost);
    setGardenPlots(prev=>{
      const next=prev.map(p=>p.id===plotId?{...p,prayerId,plantType:plantTypeId,stage:"seed",plantedAt:Date.now(),prayerCount:0}:p);
      dbSave("irj-garden",next);
      return next;
    });
    setPlantModal(null);setPlantStep(1);setPlantPrayerId(null);
  }
  function harvestPlot(plotId){
    const plot=gardenPlots.find(p=>p.id===plotId);
    if(!plot||getComputedStage(plot)!=="harvestable") return;
    const plant=GARDEN_PLANTS.find(p=>p.id===plot.plantType);
    if(!plant) return;
    // Add to inventory
    setInventory(prev=>{
      const next={...prev,[plant.harvestItem]:(prev[plant.harvestItem]||0)+1};
      dbSave("irj-inventory",next);
      return next;
    });
    // Reset plot
    setGardenPlots(prev=>{
      const next=prev.map(p=>p.id===plotId?{...p,prayerId:null,plantType:null,stage:"empty",plantedAt:null,prayerCount:0}:p);
      dbSave("irj-garden",next);
      return next;
    });
    addCandles(1,"Harvest gathered +1 🕯️");
  }
  function craftItem(stationId,recipeIdx){
    const station=CRAFTING_STATIONS.find(s=>s.id===stationId);
    if(!station) return;
    const recipe=station.recipes[recipeIdx];
    if(!recipe) return;
    // Check if enough inputs
    for(const[item,qty]of Object.entries(recipe.inputs)){
      if((inventory[item]||0)<qty) return;
    }
    // Deduct inputs, add output
    setInventory(prev=>{
      const next={...prev};
      for(const[item,qty]of Object.entries(recipe.inputs)){next[item]=(next[item]||0)-qty;}
      next[recipe.output]=(next[recipe.output]||0)+(recipe.outputQty||1);
      dbSave("irj-inventory",next);
      return next;
    });
    addCandles(1,"Crafted "+recipe.outputName+" +1 🕯️");
  }
  function getAvailablePrayers(){
    const plantedIds=gardenPlots.filter(p=>p.stage!=="empty").map(p=>p.prayerId);
    return prayerPosts.filter(p=>p.status==="active"&&!plantedIds.includes(p.id));
  }
  function openPlantModal(plotId){
    setPlantModal(plotId);setPlantStep(1);setPlantPrayerId(null);
  }
  function transitionToGarden(){
    setDoorChoice(false);
    setSpaceTransit(true); setTransitDir("toGarden");
    setTimeout(()=>{setScreen("garden");setSpaceTransit(false);setTransitDir(null);},700);
  }
  function transitionToMap(){
    setDoorChoice(false);
    setSpaceTransit(true); setTransitDir("toMap");
    setTimeout(()=>{setScreen("map");setSpaceTransit(false);setTransitDir(null);},700);
  }
  function transitionToKitchen(){
    setSpaceTransit(true); setTransitDir("toKitchen");
    setTimeout(()=>{setScreen("kitchen");setSpaceTransit(false);setTransitDir(null);},700);
  }
  function transitionToStove(){
    setStoveZoom(true);
    setTimeout(()=>{setScreen("stove");setStoveZoom(false);},1200);
  }
  function transitionToWindow(){
    setWindowZoom(true);
    setTimeout(()=>{setScreen("kitchen-window");setWindowZoom(false);},1200);
  }
  function transitionToJournal(){
    setJournalZoom(true);
    setJournalSection(null);
    setTimeout(()=>{setJournalZoom(false);setBookOpen(true);setBookPage(0);setFlipDir(null);},1400);
  }

  // ── SCENE NAVIGATION ──
  const SCENES = [
    {bgImage:"/scene-bridge.png",title:"Most people avoid the real questions.",body:"We fill our days to escape the silence. Inner Room Journal slows you down — and asks the ones that matter.",btn:"Continue",effects:["fireflies","water"]},
    {bgImage:"/scene-path.png",title:"You won't journal alone.",body:"Guided prompts take you deeper — from surface to root. Plus community rooms where others walk beside you.",btn:"Continue",effects:["fireflies"]},
    {bgImage:"/scene-porch.png",title:"Growth becomes visible.",body:"Over time, patterns emerge from your words. Themes surface. Transformation becomes something you can see.",btn:"Step inside",effects:["fireflies","smoke","glow"]},
  ];

  function startAmbient(){
    ambientPlay("/ambient-forest.mp3",{ volume:0.3, fadeMs:0, id:"onboard-forest" });
  }
  function fadeOutAmbient(){
    ambientStop(1500);
  }
  function advanceScene(){
    if(sceneTransit) return;
    setSceneTransit(true);
    setScenePrev(sceneIdx);
    if(sceneIdx>=SCENES.length-1){
      // Final scene → enter cabin
      fadeOutAmbient();
      setTimeout(()=>{
        if(dontShowAgain) dbSave("irj-onboarded",true);
        setIsOnboarded(true);
        setScreen("cabin");
        setSceneTransit(false);
        setScenePrev(-1);
      },800);
    }else{
      setTimeout(()=>setSceneIdx(i=>i+1),100);
      setTimeout(()=>{setSceneTransit(false);setScenePrev(-1);},900);
    }
  }
  function retreatScene(){
    if(sceneTransit||sceneIdx<=0) return;
    setSceneTransit(true);
    setScenePrev(sceneIdx);
    setTimeout(()=>setSceneIdx(i=>i-1),100);
    setTimeout(()=>{setSceneTransit(false);setScenePrev(-1);},900);
  }
  function skipOnboarding(){
    fadeOutAmbient();
    if(dontShowAgain) dbSave("irj-onboarded",true);
    setIsOnboarded(true);
    setScreen("cabin");
  }

  // ── SPACE TRANSITIONS ──
  function transitionToHall(){
    setSpaceTransit(true); setTransitDir("toHall");
    setTimeout(()=>{setScreen("hall");setSpaceTransit(false);setTransitDir(null);},700);
  }
  function transitionToCabin(){
    setSpaceTransit(true); setTransitDir("toCabin");
    setTimeout(()=>{setScreen("cabin");setBookOpen(false);setSpaceTransit(false);setTransitDir(null);},700);
  }

  // ── BOOK / PAGE FLIP ──
  const TOTAL_BOOK_PAGES = getBookPageCount(deskBook, journalSection);
  function flipPage(dir){
    const next = dir === "fwd" ? bookPage + 1 : bookPage - 1;
    if(next < 0 || next >= TOTAL_BOOK_PAGES) return;
    setFlipDir(dir);
    setBookPage(next);
    setBookText(""); setBookSaveMsg("");
  }
  function bookTouchStart(e){touchRef.current.startX=e.touches[0].clientX;touchRef.current.startY=e.touches[0].clientY;}
  function bookTouchEnd(e){
    const dx=e.changedTouches[0].clientX-touchRef.current.startX;
    const dy=e.changedTouches[0].clientY-touchRef.current.startY;
    if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)){
      if(dx<0) flipPage("fwd"); else flipPage("bwd");
    }
  }

  // ── SHELF BOOK SELECTION (calm multi-phase) ──
  function selectShelfBook(bookId){
    if(shelfAnim||bookId===deskBook) return;
    setShelfAnim(bookId);
    setJournalSection(null);
    // Phase 1: book lifts & arcs to desk (1.2s)
    // Phase 2: desk book switches & journal opens (after 1.3s)
    setTimeout(()=>{
      setDeskBook(bookId);
      setShelfAnim(null);
    },1300);
    // Phase 3: auto-open journal after desk book settles (1.6s)
    setTimeout(()=>{
      setBookOpen(true);
      setBookPage(0);
      setFlipDir(null);
      setBookText(""); setBookSaveMsg("");
    },1600);
  }

  // ── CANDLE / STREAK TAP ──
  function tapCandle(){
    setShowStreak(true);
    if(streakTimerRef.current) clearTimeout(streakTimerRef.current);
    streakTimerRef.current = setTimeout(()=>setShowStreak(false), 3000);
  }

  // ── CARD ENGINE ──
  function randomCardQ(setId){
    const pool=setId==="all"?ALL_CARD_QS:(QUESTION_SETS[setId]?.questions||ALL_CARD_QS);
    const next=shuffle(pool).find(q=>q!==cardQ)||pool[0];
    setCardQ(next); setIsCustomCard(false); setCardCustom("");
  }
  const displayCardQ = isCustomCard&&cardCustom.trim() ? cardCustom.trim() : cardQ;

  async function downloadCard(){
    setCardGenerating(true);
    try{
      const canvas=document.createElement("canvas");
      renderCard(canvas,{question:displayCardQ,theme:cardTheme,ratio:cardRatio});
      const url=canvas.toDataURL("image/png",1.0);
      const a=document.createElement("a"); a.href=url; a.download=`irj-card-${Date.now()}.png`; a.click();
      const card={id:Date.now().toString(),question:displayCardQ,themeId:cardTheme.id,ratioId:cardRatio.id,date:todayStr()};
      const next=[card,...savedCards].slice(0,20); setSavedCards(next); dbSave("irj-saved-cards",next);
      setCardGenMsg("✓ Downloaded!"); setTimeout(()=>setCardGenMsg(""),2500);
    }catch(e){console.error(e);}
    setCardGenerating(false);
  }

  async function copyCard(){
    try{
      const canvas=document.createElement("canvas");
      renderCard(canvas,{question:displayCardQ,theme:cardTheme,ratio:cardRatio});
      canvas.toBlob(async blob=>{
        try{await navigator.clipboard.write([new ClipboardItem({"image/png":blob})]);setCopied(true);setTimeout(()=>setCopied(false),2000);}
        catch{setCardGenMsg("Copy failed — use Download");setTimeout(()=>setCardGenMsg(""),2500);}
      });
    }catch(e){console.error(e);}
  }

  // ── COMPUTED ──
  const themeData  = useMemo(()=>aggregateThemes(entries),[entries]);
  const totalWords = useMemo(()=>entries.reduce((s,e)=>s+e.words,0),[entries]);
  const commRooms  = useMemo(()=>{
    if(!commSearch.trim()) return COMMUNITY_ROOMS;
    const q=commSearch.toLowerCase();
    return COMMUNITY_ROOMS.filter(r=>r.label.toLowerCase().includes(q)||r.themes?.some(t=>t.includes(q)));
  },[commSearch]);
  const filteredPrayers = useMemo(()=>{
    if(!commSearch.trim()) return prayerPosts;
    const q=commSearch.toLowerCase();
    return prayerPosts.filter(p=>p.text.toLowerCase().includes(q)||p.tag.toLowerCase().includes(q));
  },[prayerPosts,commSearch]);

  function roomProg(room){ return entries.filter(e=>e.roomId===room.id).length; }

  const entriesByDate = useMemo(()=>{
    const map={};
    entries.forEach(e=>{if(!map[e.date]) map[e.date]=[];map[e.date].push(e);});
    return map;
  },[entries]);

  // ── GROWTH INSIGHTS COMPUTED ──
  const insights = useMemo(()=>computeInsights(entries,prayerPosts),[entries,prayerPosts]);
  const weeklyDigest = useMemo(()=>computeWeeklyDigest(entries,insights),[entries,insights]);
  const futureYou = useMemo(()=>computeFutureYou(entries),[entries]);
  const prayerTimeline = useMemo(()=>{
    const active=prayerPosts.filter(p=>p.status!=="answered");
    const answered=prayerPosts.filter(p=>p.status==="answered").sort((a,b)=>(b.answeredDate||"").localeCompare(a.answeredDate||""));
    const categories={};prayerPosts.forEach(p=>{const c=p.category||p.tag||"General";categories[c]=(categories[c]||0)+1;});
    return {active,answered,categories,total:prayerPosts.length};
  },[prayerPosts]);

  function calNavigate(dir){
    setCalSelectedDay(null);setExpandedEntry(null);
    if(dir==="prev"){calMonth===0?(setCalMonth(11),setCalYear(y=>y-1)):setCalMonth(m=>m-1);}
    else{calMonth===11?(setCalMonth(0),setCalYear(y=>y+1)):setCalMonth(m=>m+1);}
  }
  function goToHistory(){setCalMonth(new Date().getMonth());setCalYear(new Date().getFullYear());setCalSelectedDay(null);setExpandedEntry(null);setScreen("history");}

  /* ── GLOBAL CSS ── */
  const CSS=`
    @keyframes flicker{0%,100%{opacity:1;transform:scaleY(1)}50%{opacity:.85;transform:scaleY(.95)}}
    @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
    @keyframes twinkle{0%,100%{opacity:.3;transform:scale(1)}50%{opacity:1;transform:scale(1.4)}}
    @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
    @keyframes firefly{0%{opacity:0;transform:translate(0,0) scale(0.5)}15%{opacity:1;transform:translate(8px,-12px) scale(1)}50%{opacity:0.6;transform:translate(-6px,-28px) scale(0.8)}85%{opacity:1;transform:translate(10px,-16px) scale(1.1)}100%{opacity:0;transform:translate(2px,-40px) scale(0.4)}}
    @keyframes doorGlow{0%,100%{box-shadow:0 0 20px rgba(201,169,110,0.3),0 0 60px rgba(201,169,110,0.1)}50%{box-shadow:0 0 30px rgba(201,169,110,0.5),0 0 80px rgba(201,169,110,0.2)}}
    @keyframes gentlePulse{0%,100%{transform:scale(1)}50%{transform:scale(1.03)}}
    @keyframes sceneZoomIn{from{opacity:1;transform:scale(1)}to{opacity:0;transform:scale(1.08)}}
    @keyframes sceneFadeIn{from{opacity:0}to{opacity:1}}
    @keyframes smokeDrift{0%{opacity:0;transform:translate(0,0) scale(0.3)}20%{opacity:0.4}60%{opacity:0.2;transform:translate(-12px,-40px) scale(0.7)}100%{opacity:0;transform:translate(-20px,-70px) scale(1)}}
    @keyframes windowGlow{0%,100%{opacity:0.4;box-shadow:0 0 15px rgba(255,200,80,0.3)}50%{opacity:0.7;box-shadow:0 0 30px rgba(255,200,80,0.5)}}
    @keyframes waterShimmer{0%{background-position:0% 50%}100%{background-position:200% 50%}}
    @keyframes textFloat{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
    .scene-text{animation:textFloat .6s .15s ease both}
    .scene-text2{animation:textFloat .6s .35s ease both}
    .scene-text3{animation:textFloat .6s .55s ease both}
    @keyframes lightRayShift{0%{opacity:0.5;transform:rotate(-3deg)}100%{opacity:0.8;transform:rotate(3deg)}}
    @keyframes dustFloat{0%{opacity:0;transform:translate(0,0)}25%{opacity:0.6;transform:translate(5px,-8px)}50%{opacity:0.3;transform:translate(-3px,-16px)}75%{opacity:0.5;transform:translate(7px,-10px)}100%{opacity:0;transform:translate(2px,-20px)}}
    @keyframes bookSlideUp{from{transform:translateY(100%);opacity:0.5}to{transform:translateY(0);opacity:1}}
    @keyframes spaceFadeIn{from{opacity:0}to{opacity:1}}
    @keyframes spaceFadeOut{from{opacity:1}to{opacity:0}}
    button{touch-action:manipulation}
    .fu{animation:fadeUp .55s ease both}
    .fu2{animation:fadeUp .55s .12s ease both}
    .fu3{animation:fadeUp .55s .24s ease both}
    .fu4{animation:fadeUp .55s .36s ease both}
    .room-c:hover{transform:translateY(-3px)!important;box-shadow:0 12px 36px rgba(0,0,0,0.12)!important;}
    textarea::placeholder{font-style:italic;opacity:0.45}
    textarea:focus,input:focus{outline:none}
    ::-webkit-scrollbar{width:4px}
    ::-webkit-scrollbar-thumb{background:rgba(150,130,110,0.25);border-radius:2px}
    .door-btn{transition:all 0.4s ease;animation:doorGlow 3s ease-in-out infinite}
    .door-btn:hover{transform:scale(1.06);box-shadow:0 0 40px rgba(201,169,110,0.6),0 0 100px rgba(201,169,110,0.3)!important}
    .door-btn:active{transform:scale(0.97)}
    @keyframes pageRevealFwd{0%{transform:perspective(1200px) rotateY(45deg);opacity:0;transform-origin:left center}100%{transform:perspective(1200px) rotateY(0deg);opacity:1;transform-origin:left center}}
    @keyframes pageRevealBwd{0%{transform:perspective(1200px) rotateY(-45deg);opacity:0;transform-origin:right center}100%{transform:perspective(1200px) rotateY(0deg);opacity:1;transform-origin:right center}}
    @keyframes bookOpenAnim{0%{transform:translate(-50%,-50%) scale(0.88);opacity:0}100%{transform:translate(-50%,-50%) scale(1);opacity:1}}
    @keyframes pageInitial{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    @keyframes sparkle{0%{opacity:0;transform:translate(0,0) scale(0.3)}30%{opacity:1;transform:translate(4px,-10px) scale(1)}70%{opacity:0.3;transform:translate(-3px,-20px) scale(0.5)}100%{opacity:0;transform:translate(6px,-30px) scale(0.2)}}
    @keyframes pageContentReveal{0%{opacity:0;transform:translateY(10px)}100%{opacity:1;transform:translateY(0)}}
    .book-nav{transition:all .2s}
    .book-nav:hover{background:rgba(101,83,55,0.15)!important;border-color:rgba(101,83,55,0.3)!important}
    .book-nav:active{transform:translateY(-50%) scale(0.9)!important}
    @keyframes streakFloat{0%{opacity:0;transform:translate(-50%,-20px) scale(0.8)}15%{opacity:1;transform:translate(-50%,0) scale(1)}85%{opacity:1;transform:translate(-50%,0) scale(1)}100%{opacity:0;transform:translate(-50%,-12px) scale(0.9)}}
    @keyframes candleFloat{0%{opacity:0;transform:translate(-50%,10px) scale(0.8)}12%{opacity:1;transform:translate(-50%,0) scale(1)}80%{opacity:1;transform:translate(-50%,0) scale(1)}100%{opacity:0;transform:translate(-50%,-18px) scale(0.85)}}
    @keyframes insightsSlideUp{from{opacity:0;transform:translate(-50%,-50%) scale(0.92)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}
    @keyframes candlePulse{0%,100%{filter:drop-shadow(0 0 8px rgba(255,200,80,0.3))}50%{filter:drop-shadow(0 0 18px rgba(255,200,80,0.6))}}
    @keyframes shelfDust{0%{opacity:0;transform:translate(0,0) scale(0.3)}20%{opacity:0.7;transform:translate(3px,-6px) scale(0.8)}50%{opacity:0.3;transform:translate(-2px,-14px) scale(0.6)}80%{opacity:0.5;transform:translate(4px,-8px) scale(0.9)}100%{opacity:0;transform:translate(1px,-18px) scale(0.3)}}
    @keyframes shelfGlow{0%,100%{box-shadow:0 0 8px rgba(255,200,80,0.08),0 0 20px rgba(255,200,80,0.03)}50%{box-shadow:0 0 16px rgba(255,200,80,0.18),0 0 35px rgba(255,200,80,0.06)}}
    @keyframes shelfBookLift{0%{transform:translate(0,0) scale(1);opacity:1}30%{transform:translate(-3px,-12px) scale(1.08);opacity:1}100%{transform:translate(-3px,-12px) scale(1.08);opacity:1}}
    @keyframes bookArcToDesk{0%{opacity:1;transform:translate(0,0) scale(1.1)}25%{opacity:1;transform:translate(-80px,-30px) scale(1.25)}55%{opacity:0.9;transform:translate(-180px,40px) scale(1.1)}85%{opacity:0.7;transform:translate(-220px,100px) scale(0.85)}100%{opacity:0;transform:translate(-240px,140px) scale(0.7)}}
    @keyframes bookArcToDeskBottom{0%{opacity:1;transform:translate(0,0) scale(1.1)}25%{opacity:1;transform:translate(-70px,-50px) scale(1.25)}55%{opacity:0.9;transform:translate(-160px,20px) scale(1.1)}85%{opacity:0.7;transform:translate(-200px,80px) scale(0.85)}100%{opacity:0;transform:translate(-230px,120px) scale(0.7)}}
    @keyframes deskBookFadeOut{0%{opacity:1;transform:translateX(0) scale(1)}100%{opacity:0;transform:translateX(-20px) scale(0.92)}}
    @keyframes deskBookFadeIn{0%{opacity:0;transform:translateY(8px) scale(0.95)}100%{opacity:1;transform:translateY(0) scale(1)}}
    .shelf-hotspot{transition:all .4s cubic-bezier(.25,.8,.25,1);cursor:pointer;position:relative}
    .shelf-hotspot:hover{transform:translate(-2px,-6px) scale(1.06)!important}
    .shelf-hotspot:active{transform:translate(-1px,-3px) scale(0.98)!important}
    .window-hotspot{transition:all .3s}
    .window-hotspot:hover{background:rgba(255,200,80,0.12)!important}
    @keyframes cabinFirelight{0%,100%{opacity:0.5}25%{opacity:0.85}50%{opacity:0.4}75%{opacity:0.7}}
    @keyframes fireMotion{0%,100%{opacity:0.5;transform:scaleY(1) scaleX(1)}20%{opacity:0.85;transform:scaleY(1.06) scaleX(0.96)}45%{opacity:0.4;transform:scaleY(0.94) scaleX(1.03)}65%{opacity:0.75;transform:scaleY(1.03) scaleX(0.98)}85%{opacity:0.55;transform:scaleY(0.97) scaleX(1.01)}}
    @keyframes fireFlicker{0%,100%{opacity:0.4;transform:scaleY(1)}30%{opacity:0.9;transform:scaleY(1.08)}60%{opacity:0.3;transform:scaleY(0.92)}80%{opacity:0.7;transform:scaleY(1.04)}}
    @keyframes candleGlowPulse{0%,100%{opacity:0.5;transform:scale(1)}40%{opacity:0.9;transform:scale(1.1)}70%{opacity:0.4;transform:scale(0.95)}}
    @keyframes stringLightTwinkle{0%,100%{opacity:0.4}25%{opacity:0.7}50%{opacity:0.35}75%{opacity:0.65}}
    .cabin-fire-motion{animation:fireMotion 2.5s ease-in-out infinite}
    .cabin-fire-flicker{animation:fireFlicker 1.8s ease-in-out infinite}
    .cabin-string-lights{animation:stringLightTwinkle 6s ease-in-out infinite}
    .cabin-candle-glow{animation:candleGlowPulse 3.5s ease-in-out infinite}
    .cabin-candle-glow2{animation:candleGlowPulse 4.2s ease-in-out infinite 0.8s}
    .cabin-firelight{animation:cabinFirelight 4s ease-in-out infinite}
    .wp-option{transition:all .2s;cursor:pointer}
    .wp-option:hover{background:rgba(255,255,255,0.08)!important;transform:translateY(-2px)}
    .book-room:hover{border-color:rgba(101,83,55,0.4)!important;background:linear-gradient(135deg,rgba(101,83,55,0.08),rgba(101,83,55,0.03))!important}
    @keyframes bookFlyToDesk{0%{opacity:1;transform:translate(0,0) scale(1)}40%{opacity:1;transform:translate(-120px,-40px) scale(1.3)}100%{opacity:0;transform:translate(-200px,120px) scale(0.7)}}
    @keyframes bookArcFromBottom{0%{opacity:1;transform:translate(0,0) scale(1)}30%{opacity:1;transform:translate(0,-60px) scale(1.25)}60%{opacity:0.9;transform:translate(-20px,-120px) scale(1.1)}100%{opacity:0;transform:translate(-30px,-160px) scale(0.75)}}
    @keyframes hotspotPulse{0%,100%{box-shadow:0 0 15px rgba(255,200,80,0.15),0 0 40px rgba(255,200,80,0.05)}50%{box-shadow:0 0 25px rgba(255,200,80,0.3),0 0 60px rgba(255,200,80,0.1)}}
    @keyframes doorLabelFade{0%,100%{opacity:0.5}50%{opacity:1}}
    @keyframes magicGlow{0%,100%{box-shadow:0 0 12px rgba(255,210,120,0.12),0 0 30px rgba(255,200,100,0.06),inset 0 0 8px rgba(255,210,120,0.04)}50%{box-shadow:0 0 22px rgba(255,210,120,0.28),0 0 50px rgba(255,200,100,0.12),inset 0 0 14px rgba(255,210,120,0.08)}}
    @keyframes magicGlowOuter{0%,100%{opacity:0.3;transform:scale(1)}50%{opacity:0.7;transform:scale(1.04)}}
    @keyframes hotspotPulse{0%,100%{opacity:0.25;transform:scale(0.92)}50%{opacity:1;transform:scale(1.3)}}
    .magic-hotspot{cursor:pointer;transition:all .3s ease}
    .magic-hotspot:hover{box-shadow:0 0 30px rgba(255,210,120,0.35),0 0 60px rgba(255,200,100,0.15)!important}
    .magic-hotspot:active{transform:scale(0.97)!important;box-shadow:0 0 15px rgba(255,210,120,0.2)!important}
    @keyframes kitchenFireGlow{0%,100%{opacity:0.7;transform:scale(1)}50%{opacity:1;transform:scale(1.04)}}
    @keyframes stoveFireGlow{0%,100%{opacity:0.7;transform:scale(1)}35%{opacity:1;transform:scale(1.06)}65%{opacity:0.85;transform:scale(1.02)}100%{opacity:0.7;transform:scale(1)}}
    @keyframes kitchenSteam{0%,100%{opacity:0.3;transform:translateY(0) scale(1)}50%{opacity:0.7;transform:translateY(-6px) scale(1.08)}}
    @keyframes stoveGlowPulse{0%,100%{box-shadow:0 0 20px rgba(255,120,30,0.15),0 0 50px rgba(255,100,10,0.08),inset 0 0 10px rgba(255,140,40,0.05)}50%{box-shadow:0 0 35px rgba(255,120,30,0.35),0 0 80px rgba(255,100,10,0.18),inset 0 0 18px rgba(255,140,40,0.10)}}
    @keyframes stoveGlowOuter{0%,100%{opacity:0.25;transform:scale(1)}50%{opacity:0.6;transform:scale(1.06)}}
    @keyframes walkToStoveZoom{0%{transform:scale(1);filter:brightness(1)}40%{transform:scale(1.8);filter:brightness(1.1)}75%{transform:scale(3);filter:brightness(0.5)}100%{transform:scale(4.5);filter:brightness(0)}}
    @keyframes walkToStoveVignette{0%{opacity:0}60%{opacity:0}100%{opacity:1}}
    @keyframes walkToWindowZoom{0%{transform:scale(1);filter:brightness(1)}40%{transform:scale(1.6);filter:brightness(1.15)}75%{transform:scale(2.8);filter:brightness(0.45)}100%{transform:scale(4);filter:brightness(0)}}
    @keyframes walkToWindowVignette{0%{opacity:0}60%{opacity:0}100%{opacity:1}}
    @keyframes walkToJournalZoom{0%{transform:scale(1);filter:brightness(1)}35%{transform:scale(1.6);filter:brightness(1.15)}70%{transform:scale(3.2);filter:brightness(0.4)}100%{transform:scale(5);filter:brightness(0)}}
    @keyframes walkToJournalVignette{0%{opacity:0}55%{opacity:0}100%{opacity:1}}
    @keyframes journalDeskReveal{0%{opacity:0;transform:scale(1.08)}40%{opacity:1;transform:scale(1.02)}100%{opacity:1;transform:scale(1)}}
    @keyframes waterShimmer{0%,100%{opacity:0.12;transform:scaleY(1)}50%{opacity:0.25;transform:scaleY(1.02)}}
    @keyframes mistDrift{0%{transform:translateX(-5%) translateY(2%);opacity:0.15}50%{transform:translateX(3%) translateY(-1%);opacity:0.25}100%{transform:translateX(-5%) translateY(2%);opacity:0.15}}
    @keyframes lanternFlicker{0%{opacity:0.7;transform:scale(1)}12%{opacity:1;transform:scale(1.08)}28%{opacity:0.75;transform:scale(0.97)}42%{opacity:1;transform:scale(1.10)}58%{opacity:0.65;transform:scale(0.96)}70%{opacity:1;transform:scale(1.06)}85%{opacity:0.7;transform:scale(1.01)}100%{opacity:0.7;transform:scale(1)}}
    @keyframes windowGlow{0%,100%{opacity:0.55;transform:scale(1)}30%{opacity:0.9;transform:scale(1.03)}60%{opacity:0.6;transform:scale(0.98)}80%{opacity:0.95;transform:scale(1.02)}}
    @keyframes chimneySmoke{0%{transform:translateY(0) translateX(0) scale(1);opacity:0.30}25%{transform:translateY(-18px) translateX(4px) scale(1.15);opacity:0.22}50%{transform:translateY(-38px) translateX(-3px) scale(1.35);opacity:0.14}75%{transform:translateY(-58px) translateX(6px) scale(1.55);opacity:0.07}100%{transform:translateY(-80px) translateX(2px) scale(1.8);opacity:0}}
    @keyframes chimneySmokeB{0%{transform:translateY(0) translateX(2px) scale(1);opacity:0.25}25%{transform:translateY(-22px) translateX(-5px) scale(1.2);opacity:0.18}50%{transform:translateY(-42px) translateX(4px) scale(1.4);opacity:0.10}75%{transform:translateY(-65px) translateX(-2px) scale(1.6);opacity:0.05}100%{transform:translateY(-85px) translateX(-4px) scale(1.85);opacity:0}}
    @keyframes shelfBookHover{0%,100%{transform:translateX(0)}50%{transform:translateX(-4px)}}
    @keyframes windowPanelSlide{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}
    @keyframes windowPanelSlideLeft{from{transform:translateX(-100%);opacity:0}to{transform:translateX(0);opacity:1}}
    @keyframes doorLightBurst{0%{transform:translate(-50%,-50%) scale(0.05);opacity:0}40%{opacity:0.85}100%{transform:translate(-50%,-50%) scale(4);opacity:1}}
    @keyframes doorFadeWarm{0%{opacity:0}55%{opacity:0}100%{opacity:1}}
    @keyframes doorZoomBg{0%{transform:scale(1);filter:brightness(1)}100%{transform:scale(1.12);filter:brightness(1.3)}}
    @keyframes walkToDoor{0%{transform:scale(1);filter:brightness(1.25)}35%{transform:scale(1.6);filter:brightness(1.15)}65%{transform:scale(3);filter:brightness(0.6)}100%{transform:scale(5.5);filter:brightness(0)}}
    @keyframes doorReveal{0%{opacity:0;transform:scale(1.12)}25%{opacity:1;transform:scale(1.03)}100%{opacity:1;transform:scale(1)}}
    @keyframes doorHoldZoom{0%{transform:scale(1)}100%{transform:scale(1.03)}}
    @keyframes doorEnterZoom{0%{transform:scale(1.03);filter:brightness(1)}60%{transform:scale(1.6);filter:brightness(1.8)}100%{transform:scale(2.2);filter:brightness(2.5)}}
    @keyframes doorEnterFade{0%{opacity:0}100%{opacity:1}}
    @keyframes walkVignette{0%{opacity:0}60%{opacity:0.3}100%{opacity:1}}
    @keyframes gardenSway{0%,100%{transform:rotate(-2deg)}50%{transform:rotate(2deg)}}
    @keyframes gardenGrow{from{transform:scale(0.6);opacity:0}to{transform:scale(1);opacity:1}}
    @keyframes harvestGlow{0%,100%{filter:drop-shadow(0 0 6px rgba(255,220,80,0.4)) brightness(1.1)}50%{filter:drop-shadow(0 0 18px rgba(255,200,60,0.7)) brightness(1.2)}}
    @keyframes harvestBounce{0%{transform:scale(1)}25%{transform:scale(1.15)}50%{transform:scale(0.95)}75%{transform:scale(1.05)}100%{transform:scale(1)}}
    @keyframes gardenPlotFadeIn{from{opacity:0;transform:translate(-50%,-50%) scale(0.8)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}
    @keyframes doorChoiceFadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
    @keyframes bloomPulse{0%,100%{filter:drop-shadow(0 0 6px rgba(180,140,255,0.3))}50%{filter:drop-shadow(0 0 16px rgba(180,140,255,0.6))}}
    @keyframes emptyPlotPulse{0%,100%{opacity:0.35;transform:scale(1)}50%{opacity:0.7;transform:scale(1.12)}}
    @keyframes gardenPlotHover{0%,100%{box-shadow:0 0 8px rgba(255,200,80,0.08)}50%{box-shadow:0 0 18px rgba(255,200,80,0.2)}}
    @keyframes gardenDoorGlow{0%,100%{box-shadow:0 0 20px rgba(255,200,80,0.15),0 0 50px rgba(255,200,80,0.05)}50%{box-shadow:0 0 35px rgba(255,200,80,0.3),0 0 80px rgba(255,200,80,0.1)}}
    .garden-lantern-glow{animation:candleGlowPulse 4s ease-in-out infinite}
    .garden-lantern-glow2{animation:candleGlowPulse 4.8s ease-in-out infinite 1s}
    .garden-door-glow{animation:candleGlowPulse 3.5s ease-in-out infinite 0.5s}
    .garden-string-lights{animation:stringLightTwinkle 7s ease-in-out infinite}
    .garden-plot-hotspot{transition:all .25s ease;cursor:pointer}
    .garden-plot-hotspot:hover{transform:translate(-50%,-50%) scale(1.12)!important}
    .garden-plot-hotspot:active{transform:translate(-50%,-50%) scale(0.92)!important}
    .garden-plot{transition:all .2s ease;cursor:pointer}
    .garden-plot:hover{transform:translateY(-2px);box-shadow:0 4px 16px rgba(0,0,0,0.15)!important}
    .garden-plot:active{transform:scale(0.96)}
    .craft-btn{transition:all .2s}
    .craft-btn:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(0,0,0,0.15)!important}
    @keyframes panelSlideUp{from{transform:translateY(100%);opacity:0.5}to{transform:translateY(0);opacity:1}}
    @keyframes mapHotspotFadeIn{from{opacity:0;transform:translate(-50%,-50%) scale(0.7)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}
    @keyframes mapLabelFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
    .map-hotspot{cursor:pointer}
    .map-hotspot:hover{box-shadow:0 0 35px rgba(255,210,120,0.45),0 0 70px rgba(255,210,120,0.15)!important;transform:translate(-50%,-50%) scale(1.08)!important}
    .map-hotspot:active{transform:translate(-50%,-50%) scale(0.94)!important}
    @keyframes verseReveal{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
    @keyframes actionBarSlideUp{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:translateY(0)}}
    @keyframes overlayFadeIn{from{opacity:0}to{opacity:1}}
    @keyframes mapBtnGlow{0%,100%{box-shadow:0 0 8px rgba(255,210,120,0.15),0 2px 12px rgba(0,0,0,0.3)}50%{box-shadow:0 0 18px rgba(255,210,120,0.35),0 2px 12px rgba(0,0,0,0.3)}}
    @keyframes panelSlideUp{from{opacity:0;transform:translateY(100%)}to{opacity:1;transform:translateY(0)}}
    .verse-tap:active{transform:scale(0.98);}
    .bible-book{transition:all .2s ease;cursor:pointer}.bible-book:hover{background:rgba(180,160,210,0.12)!important;transform:translateX(4px)}.bible-book:active{transform:translateX(2px) scale(0.98)}
    .bible-chap{transition:all .2s ease;cursor:pointer}.bible-chap:hover{background:rgba(180,160,210,0.18)!important;transform:scale(1.08)}.bible-chap:active{transform:scale(0.94)}
  `;

  /* ── DARK HEADER (reusable) ── */
  const DarkHeader = ({title, onBack, extra, backLabel}) => (
    <header style={{background:B.night,padding:"0 24px",height:"54px",display:"flex",alignItems:"center",gap:"12px",boxShadow:"0 2px 16px rgba(0,0,0,0.2)",position:"sticky",top:0,zIndex:200,flexShrink:0}}>
      <button onClick={onBack} style={{background:"transparent",border:"none",cursor:"pointer",color:"rgba(180,165,148,0.55)",fontSize:"0.8rem",fontFamily:SANS,padding:0,transition:"color 0.15s",whiteSpace:"nowrap"}} onMouseEnter={e=>e.target.style.color=B.gold} onMouseLeave={e=>e.target.style.color="rgba(180,165,148,0.55)"}>{backLabel||"← Back"}</button>
      <div style={{height:"14px",width:"1px",background:"rgba(201,169,110,0.2)"}}/>
      <span style={{fontFamily:SERIF,fontStyle:"italic",color:B.goldL,fontSize:"0.92rem",flex:1}}>{title}</span>
      {extra}
    </header>
  );

  /* ══ MAP HUD BUTTON — persistent nav across all scenes ══ */
  const MapHudButton=()=>(
    <button onClick={()=>{setScreen("map");setMarketStall(null);setShopStall(null);}} style={{position:"fixed",bottom:20,left:"50%",transform:"translateX(-50%)",zIndex:50,background:"rgba(26,22,18,0.75)",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",border:"1px solid rgba(201,169,110,0.25)",borderRadius:14,padding:"8px 22px",cursor:"pointer",display:"flex",alignItems:"center",gap:7,animation:"fadeUp .8s 1s ease both, mapBtnGlow 4s 2s ease-in-out infinite",transition:"all 0.2s",boxShadow:"0 2px 12px rgba(0,0,0,0.3)"}}>
      <span style={{fontSize:"0.85rem"}}>🗺️</span>
      <span style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.75rem",color:"rgba(255,240,200,0.55)",letterSpacing:"0.02em"}}>Map</span>
    </button>
  );

  /* ══ LOADING ══════════════════════════════════════ */
  if(screen==="loading") return(
    <div style={{minHeight:"100vh",background:B.night,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <style>{GFONTS}</style>
      <span style={{fontFamily:SERIF,fontStyle:"italic",color:"rgba(201,169,110,0.4)",fontSize:"1.1rem"}}>Preparing your space…</span>
    </div>
  );

  /* ══ WELCOME — COZY OUTDOOR CABIN ════════════════ */
  if(screen==="welcome") return(
    <div style={{minHeight:"100vh",width:"100%",position:"relative",overflow:"hidden",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-end"}}>
      <style>{GFONTS}{CSS}</style>
      {/* Cabin background image — now an <img> so we can calculate rendered rect */}
      <img ref={outdoorImgRef} src="/outdoor.png" onLoad={recalcOutdoorRect} alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",objectPosition:"center 30%",zIndex:0,filter:"brightness(1.25)",transformOrigin:"50% 42%",animation:doorOpening?"walkToDoor 1.3s ease-in forwards":"none"}}/>

      {/* ── Glow overlays — positioned relative to actual rendered image rectangle ── */}
      {/* This container is sized/positioned to match the real image rect, so child */}
      {/* positions as % of image always land on the correct features. */}
      {imgRect&&<div style={{position:"absolute",left:imgRect.x,top:imgRect.y,width:imgRect.w,height:imgRect.h,zIndex:1,pointerEvents:"none",overflow:"visible"}}>

        {/* ── Chimney smoke ── */}
        <div style={{position:"absolute",left:"50%",top:"6%",width:"6%",height:"4%",borderRadius:"50%",background:"radial-gradient(circle,rgba(180,175,165,0.30) 0%,rgba(160,155,148,0.10) 50%,transparent 75%)",pointerEvents:"none",animation:"chimneySmoke 4s ease-out infinite"}}/>
        <div style={{position:"absolute",left:"51.5%",top:"7%",width:"5%",height:"3.5%",borderRadius:"50%",background:"radial-gradient(circle,rgba(175,170,162,0.25) 0%,rgba(155,150,145,0.08) 50%,transparent 75%)",pointerEvents:"none",animation:"chimneySmokeB 5s ease-out infinite",animationDelay:"1.5s"}}/>
        <div style={{position:"absolute",left:"49%",top:"5.5%",width:"7%",height:"4.5%",borderRadius:"50%",background:"radial-gradient(circle,rgba(185,180,172,0.20) 0%,transparent 60%)",pointerEvents:"none",animation:"chimneySmoke 6s ease-out infinite",animationDelay:"3s"}}/>

        {/* ── Bridge lanterns — 4 lanterns on wooden bridge railing posts ── */}
        <div style={{position:"absolute",left:"17%",top:"78%",width:"6%",height:"5%",borderRadius:"50%",background:"radial-gradient(circle,rgba(255,190,60,0.85) 0%,rgba(255,150,30,0.35) 40%,transparent 72%)",pointerEvents:"none",mixBlendMode:"screen",animation:"lanternFlicker 2.2s ease-in-out infinite"}}/>
        <div style={{position:"absolute",left:"30%",top:"75%",width:"6%",height:"5%",borderRadius:"50%",background:"radial-gradient(circle,rgba(255,190,60,0.85) 0%,rgba(255,150,30,0.35) 40%,transparent 72%)",pointerEvents:"none",mixBlendMode:"screen",animation:"lanternFlicker 2.5s ease-in-out infinite",animationDelay:"0.4s"}}/>
        <div style={{position:"absolute",left:"55%",top:"75%",width:"6%",height:"5%",borderRadius:"50%",background:"radial-gradient(circle,rgba(255,190,60,0.85) 0%,rgba(255,150,30,0.35) 40%,transparent 72%)",pointerEvents:"none",mixBlendMode:"screen",animation:"lanternFlicker 2.3s ease-in-out infinite",animationDelay:"0.8s"}}/>
        <div style={{position:"absolute",left:"69%",top:"78%",width:"6%",height:"5%",borderRadius:"50%",background:"radial-gradient(circle,rgba(255,190,60,0.85) 0%,rgba(255,150,30,0.35) 40%,transparent 72%)",pointerEvents:"none",mixBlendMode:"screen",animation:"lanternFlicker 2.6s ease-in-out infinite",animationDelay:"1.2s"}}/>

        {/* ── Porch lanterns — flanking the cabin door ── */}
        <div style={{position:"absolute",left:"29.5%",top:"36%",width:"7%",height:"5%",borderRadius:"50%",background:"radial-gradient(circle,rgba(255,200,70,0.90) 0%,rgba(255,160,40,0.38) 40%,transparent 72%)",pointerEvents:"none",mixBlendMode:"screen",animation:"lanternFlicker 2.0s ease-in-out infinite",animationDelay:"0.3s"}}/>
        <div style={{position:"absolute",left:"56.5%",top:"36%",width:"7%",height:"5%",borderRadius:"50%",background:"radial-gradient(circle,rgba(255,200,70,0.90) 0%,rgba(255,160,40,0.38) 40%,transparent 72%)",pointerEvents:"none",mixBlendMode:"screen",animation:"lanternFlicker 2.4s ease-in-out infinite",animationDelay:"0.7s"}}/>

        {/* ── Cabin windows — warm interior glow ── */}
        {/* Upper floor windows */}
        <div style={{position:"absolute",left:"26%",top:"16%",width:"10%",height:"7%",borderRadius:"20%",background:"radial-gradient(ellipse,rgba(255,200,80,0.50) 0%,rgba(255,160,40,0.15) 55%,transparent 75%)",pointerEvents:"none",mixBlendMode:"screen",animation:"windowGlow 3.5s ease-in-out infinite"}}/>
        <div style={{position:"absolute",left:"41%",top:"15%",width:"8%",height:"6%",borderRadius:"20%",background:"radial-gradient(ellipse,rgba(255,200,80,0.45) 0%,rgba(255,160,40,0.14) 55%,transparent 75%)",pointerEvents:"none",mixBlendMode:"screen",animation:"windowGlow 4s ease-in-out infinite",animationDelay:"0.6s"}}/>
        <div style={{position:"absolute",left:"58%",top:"16%",width:"10%",height:"7%",borderRadius:"20%",background:"radial-gradient(ellipse,rgba(255,200,80,0.50) 0%,rgba(255,160,40,0.15) 55%,transparent 75%)",pointerEvents:"none",mixBlendMode:"screen",animation:"windowGlow 3.8s ease-in-out infinite",animationDelay:"1s"}}/>
        {/* Lower floor windows */}
        <div style={{position:"absolute",left:"24%",top:"34%",width:"8%",height:"8%",borderRadius:"15%",background:"radial-gradient(ellipse,rgba(255,195,75,0.55) 0%,rgba(255,155,35,0.18) 50%,transparent 72%)",pointerEvents:"none",mixBlendMode:"screen",animation:"windowGlow 3.2s ease-in-out infinite",animationDelay:"0.4s"}}/>
        <div style={{position:"absolute",left:"62%",top:"34%",width:"8%",height:"8%",borderRadius:"15%",background:"radial-gradient(ellipse,rgba(255,195,75,0.55) 0%,rgba(255,155,35,0.18) 50%,transparent 72%)",pointerEvents:"none",mixBlendMode:"screen",animation:"windowGlow 3.6s ease-in-out infinite",animationDelay:"1.2s"}}/>
        <div style={{position:"absolute",left:"71%",top:"34%",width:"7%",height:"7%",borderRadius:"15%",background:"radial-gradient(ellipse,rgba(255,195,75,0.48) 0%,rgba(255,155,35,0.15) 50%,transparent 72%)",pointerEvents:"none",mixBlendMode:"screen",animation:"windowGlow 4.2s ease-in-out infinite",animationDelay:"0.8s"}}/>

        {/* ── Water reflection shimmer ── */}
        <div style={{position:"absolute",left:"18%",top:"83%",width:"55%",height:"10%",borderRadius:"40%",background:"radial-gradient(ellipse at 50% 40%,rgba(255,190,80,0.14) 0%,transparent 65%)",pointerEvents:"none",mixBlendMode:"screen",animation:"lanternFlicker 3s ease-in-out infinite",animationDelay:"0.5s"}}/>
      </div>}

      {/* Minimal overlay — only at the very bottom for text readability */}
      <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom, transparent 0%, transparent 50%, rgba(10,8,6,0.10) 65%, rgba(10,8,6,0.50) 80%, rgba(10,8,6,0.80) 100%)",zIndex:1}}/>
      {/* Stars in the sky */}
      <div style={{position:"absolute",inset:0,zIndex:2}}><Stars/></div>
      {/* Fireflies */}
      <div style={{position:"absolute",inset:0,zIndex:2}}><Fireflies/></div>
      {/* Content — positioned at bottom, pushed up */}
      <div style={{position:"relative",zIndex:3,display:"flex",flexDirection:"column",alignItems:"center",padding:"0 28px 14px",maxWidth:"480px",width:"100%"}}>
        {/* Decorative top ornament */}
        <div className="fu" style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"6px"}}>
          <div style={{width:"28px",height:"1px",background:"linear-gradient(90deg,transparent,rgba(201,169,110,0.4))"}}/>
          <div style={{width:"5px",height:"5px",borderRadius:"50%",background:"rgba(201,169,110,0.35)"}}/>
          <div style={{width:"28px",height:"1px",background:"linear-gradient(90deg,rgba(201,169,110,0.4),transparent)"}}/>
        </div>
        {/* Title */}
        <h1 className="fu2" style={{fontFamily:DISPLAY,fontSize:"clamp(2rem,8vw,3.4rem)",fontWeight:700,color:"#FFF8E8",margin:"6px 0 2px",letterSpacing:"0.05em",textAlign:"center",textShadow:"0 2px 24px rgba(0,0,0,0.7), 0 0 50px rgba(201,169,110,0.12)",lineHeight:1.15}}>The Inner Room</h1>
        {/* Elegant gold divider */}
        <div className="fu2" style={{display:"flex",alignItems:"center",gap:"8px",margin:"8px 0 10px"}}>
          <div style={{width:"40px",height:"1px",background:"linear-gradient(90deg,transparent,rgba(201,169,110,0.5))"}}/>
          <div style={{fontFamily:SERIF,fontSize:"0.7rem",color:"rgba(201,169,110,0.4)",letterSpacing:"0.2em"}}>✦</div>
          <div style={{width:"40px",height:"1px",background:"linear-gradient(90deg,rgba(201,169,110,0.5),transparent)"}}/>
        </div>
        {/* Subtitle */}
        <p className="fu3" style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"clamp(0.92rem,3.2vw,1.12rem)",color:"rgba(255,248,232,0.72)",margin:"0 0 18px",letterSpacing:"0.04em",textAlign:"center",textShadow:"0 2px 12px rgba(0,0,0,0.6)",lineHeight:1.7,maxWidth:"340px"}}>A quiet place to face the questions that matter.</p>
        {/* Door button */}
        <button className="fu4 door-btn" onClick={()=>{
          if(isOnboarded){
            setDoorOpening(true);setDoorPhase("walk");
            setTimeout(()=>setDoorPhase("door"),1300);
            setTimeout(()=>setDoorPhase("enter"),3300);
            setTimeout(()=>{setDoorOpening(false);setDoorPhase(null);setScreen("cabin");},4000);
          }else{
            setDontShowAgain(false);startAmbient();setSceneIdx(0);setScenePrev(-1);setSceneTransit(false);setScreen("onboard");
          }
        }} style={{background:"linear-gradient(135deg, rgba(201,169,110,0.22), rgba(201,169,110,0.06))",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",border:"1px solid rgba(201,169,110,0.45)",color:"#FFF8E8",padding:"16px 52px",borderRadius:"30px",cursor:"pointer",fontSize:"0.92rem",fontFamily:SERIF,fontWeight:600,letterSpacing:"0.14em",textTransform:"none",fontStyle:"italic",boxShadow:"0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,248,232,0.06)"}}>
          {isOnboarded?"Return to the cabin":"Enter the cabin"}
        </button>
        {/* Returning user hint */}
        {isOnboarded&&<p className="fu4" style={{fontFamily:SANS,fontSize:"0.66rem",color:"rgba(255,248,232,0.22)",marginTop:"14px",letterSpacing:"0.06em"}}>Your journal awaits inside</p>}
      </div>

      {/* ══ DOOR OPENING ANIMATION — walk → door close-up → enter cabin ══ */}
      {doorOpening&&<div style={{position:"fixed",inset:0,zIndex:100,pointerEvents:"none"}}>
        {/* Walk phase: closing vignette as we approach the cabin */}
        {doorPhase==="walk"&&<div style={{position:"absolute",inset:0,background:"radial-gradient(circle at 50% 42%, transparent 10%, rgba(0,0,0,0.9) 75%)",animation:"walkVignette 1.3s ease-in forwards"}}/>}

        {/* Door close-up photo — shown during "door" and "enter" phases */}
        {(doorPhase==="door"||doorPhase==="enter")&&<img src="/door.png" alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",animation:doorPhase==="enter"?"doorEnterZoom 0.7s ease-in forwards":"doorReveal 0.4s ease-out forwards, doorHoldZoom 2s linear 0.4s forwards"}}/>}

        {/* Flickering lantern glow on the door photo */}
        {doorPhase==="door"&&<>
          <div style={{position:"absolute",left:"4%",top:"12%",width:"20%",height:"16%",borderRadius:"50%",background:"radial-gradient(circle,rgba(255,200,70,0.55) 0%,rgba(255,160,40,0.18) 50%,transparent 75%)",mixBlendMode:"screen",animation:"lanternFlicker 2s ease-in-out infinite"}}/>
          <div style={{position:"absolute",left:"76%",top:"12%",width:"20%",height:"16%",borderRadius:"50%",background:"radial-gradient(circle,rgba(255,200,70,0.55) 0%,rgba(255,160,40,0.18) 50%,transparent 75%)",mixBlendMode:"screen",animation:"lanternFlicker 2.3s ease-in-out infinite",animationDelay:"0.5s"}}/>
        </>}

        {/* Enter phase: warm golden light flooding from the opening door */}
        {doorPhase==="enter"&&<div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 50% 35%, rgba(255,240,200,0.98) 0%, rgba(245,228,195,0.96) 60%, rgba(240,220,180,0.94) 100%)",animation:"doorEnterFade 0.6s ease-in forwards"}}/>}
      </div>}
    </div>
  );

  /* ══ ONBOARDING — IMMERSIVE WALK TO CABIN ═════════ */
  if(screen==="onboard"){
    const sc=SCENES[sceneIdx];
    const prevSc=scenePrev>=0?SCENES[scenePrev]:null;
    return(
    <div style={{position:"fixed",inset:0,overflow:"hidden",background:"#0A0806"}}>
      <style>{GFONTS}{CSS}</style>

      {/* Outgoing scene (zooms in + fades out) */}
      {prevSc&&<div key={`prev-${scenePrev}`} style={{position:"absolute",inset:0,backgroundImage:`url('${prevSc.bgImage}')`,backgroundSize:"cover",backgroundPosition:"center center",backgroundRepeat:"no-repeat",animation:"sceneZoomIn 0.8s ease-out forwards",zIndex:1}}/>}

      {/* Current scene background */}
      <div key={`scene-${sceneIdx}`} style={{position:"absolute",inset:0,backgroundImage:`url('${sc.bgImage}')`,backgroundSize:"cover",backgroundPosition:"center center",backgroundRepeat:"no-repeat",animation:scenePrev>=0?"sceneFadeIn 0.8s ease both":"none",zIndex:2}}/>

      {/* Dark gradient overlay for text readability */}
      <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom, rgba(10,8,6,0.05) 0%, rgba(10,8,6,0.1) 40%, rgba(10,8,6,0.5) 65%, rgba(10,8,6,0.92) 85%, rgba(10,8,6,0.98) 100%)",zIndex:3}}/>

      {/* Ambient effects layer */}
      <div style={{position:"absolute",inset:0,zIndex:4,pointerEvents:"none"}}>
        {sc.effects.includes("fireflies")&&<Fireflies/>}
        {sc.effects.includes("smoke")&&<ChimneySmoke/>}
        {sc.effects.includes("glow")&&<CabinWindowGlow/>}
        {sc.effects.includes("water")&&<WaterShimmer/>}
      </div>

      {/* Text + controls overlay at bottom */}
      <div style={{position:"absolute",bottom:0,left:0,right:0,zIndex:5,display:"flex",flexDirection:"column",alignItems:"center",padding:"0 28px 44px"}}>
        {/* Progress dots */}
        <div className="scene-text" style={{display:"flex",gap:"8px",marginBottom:"24px"}}>
          {SCENES.map((_,i)=><div key={i} style={{width:i===sceneIdx?24:8,height:"6px",borderRadius:"3px",background:i===sceneIdx?"rgba(201,169,110,0.8)":"rgba(255,255,255,0.15)",transition:"all 0.4s ease"}}/>)}
        </div>

        {/* Title */}
        <h2 key={`t-${sceneIdx}`} className="scene-text" style={{fontFamily:DISPLAY,fontSize:"clamp(1.5rem,6vw,2.4rem)",fontWeight:700,color:"#FFF8E8",margin:"0 0 8px",letterSpacing:"0.03em",textAlign:"center",textShadow:"0 2px 20px rgba(0,0,0,0.7), 0 0 40px rgba(201,169,110,0.12)",lineHeight:1.25,maxWidth:"420px"}}>
          {sc.title}
        </h2>

        {/* Divider */}
        <div className="scene-text" style={{width:"50px",height:"1px",background:"linear-gradient(90deg,transparent,rgba(201,169,110,0.5),transparent)",margin:"4px 0 10px"}}/>

        {/* Body text */}
        <p key={`b-${sceneIdx}`} className="scene-text2" style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"clamp(0.88rem,3vw,1.05rem)",color:"rgba(255,248,232,0.65)",margin:"0 0 28px",textAlign:"center",maxWidth:"380px",lineHeight:1.65,textShadow:"0 1px 8px rgba(0,0,0,0.5)",letterSpacing:"0.02em"}}>
          {sc.body}
        </p>

        {/* Buttons */}
        <div className="scene-text3" style={{display:"flex",gap:"10px",alignItems:"center"}}>
          {sceneIdx>0&&<button onClick={retreatScene} style={{background:"transparent",border:"1px solid rgba(201,169,110,0.25)",color:"rgba(255,248,232,0.5)",padding:"12px 20px",borderRadius:"24px",cursor:"pointer",fontSize:"0.82rem",fontFamily:SERIF,fontStyle:"italic",letterSpacing:"0.06em",transition:"all 0.3s"}}>← Back</button>}
          <button onClick={advanceScene} className="door-btn" style={{background:"linear-gradient(135deg, rgba(201,169,110,0.2), rgba(201,169,110,0.08))",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",border:"1px solid rgba(201,169,110,0.4)",color:"#FFF8E8",padding:"14px 38px",borderRadius:"28px",cursor:"pointer",fontSize:"0.88rem",fontFamily:SERIF,fontWeight:600,letterSpacing:"0.1em",fontStyle:"italic",transition:"all 0.3s"}}>
            {sc.btn}
          </button>
        </div>

        {/* Don't show again checkbox */}
        <label onClick={()=>setDontShowAgain(v=>!v)} style={{display:"flex",alignItems:"center",gap:8,marginTop:18,cursor:"pointer",userSelect:"none"}}>
          <div style={{width:16,height:16,borderRadius:4,border:"1px solid rgba(201,169,110,0.35)",background:dontShowAgain?"rgba(201,169,110,0.25)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s",flexShrink:0}}>
            {dontShowAgain&&<span style={{color:B.gold,fontSize:"0.65rem",lineHeight:1}}>✓</span>}
          </div>
          <span style={{fontFamily:SANS,fontSize:"0.7rem",color:"rgba(255,248,232,0.35)",letterSpacing:"0.04em"}}>Don't show this again</span>
        </label>
        {/* Skip intro */}
        {sceneIdx<SCENES.length-1&&<button onClick={skipOnboarding} style={{marginTop:"10px",background:"transparent",border:"none",cursor:"pointer",color:"rgba(255,248,232,0.25)",fontSize:"0.74rem",fontFamily:SANS,letterSpacing:"0.08em",transition:"color 0.2s"}} onMouseEnter={e=>e.target.style.color="rgba(255,248,232,0.5)"} onMouseLeave={e=>e.target.style.color="rgba(255,248,232,0.25)"}>Skip intro</button>}
      </div>
    </div>
    );
  }

  /* ══ CABIN (Private Interior — Immersive Hub) ══════ */
  if(screen==="cabin") return(
    <div style={{position:"fixed",inset:0,overflow:"hidden",fontFamily:SANS}}>
      <style>{GFONTS}{CSS}</style>

      {/* ── Full-screen cabin background ── */}
      {/* cabinMode "immersive" = parallax fallback (temporary until real 3D cabin is built) */}
      {/* cabinMode "3d" = future React Three Fiber scene (swap in when GLB is ready) */}
      {cabinMode==="3d"&&cabin3DReady?(
        /* Future: <CabinScene3D/> — will render the real GLB model here */
        <div style={{position:"absolute",inset:0,background:"#060402",zIndex:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <span style={{color:"rgba(255,248,232,0.3)",fontFamily:SERIF,fontStyle:"italic",fontSize:"0.8rem"}}>3D cabin loading…</span>
        </div>
      ):(
        <ImmersiveCabin/>
      )}

      {/* ── Owned furniture decorations ── */}
      {ownedItems.map(itemId=>{
        const item=SHOP_ITEMS.find(i=>i.id===itemId);
        if(!item) return null;
        return(
          <div key={item.id} style={{position:"absolute",top:item.pos.top,left:item.pos.left,width:item.pos.width,zIndex:5,pointerEvents:"none",animation:"fadeUp 0.6s ease both"}}>
            <img src={item.asset} alt={item.name} onError={e=>{e.target.parentNode.style.display="none";}} style={{width:"100%",height:"auto",display:"block"}}/>
          </div>
        );
      })}

      {/* ═══ INTERACTIVE HOTSPOTS ═══ */}
      {/* Positions mapped to cabin-interior.png: sunken great room — fireplace LEFT, window CENTER,
          stairs RIGHT, desk with open book UPPER-RIGHT, sectional sofa CENTER, rolled map on shelf BOTTOM-CENTER */}
      {/* ─── HOW TO EDIT HOTSPOTS ───
          Each hotspot is a <button> with absolute positioning (left/right/top/bottom as %).
          To reposition: change the left/top/width/height percentages.
          To change navigation: change the onClick function.
          Glow class: "magic-hotspot" + animation:"magicGlow ..." for the enchanted look.
          The outer <div> with magicGlowOuter adds the soft radial aura around each hotspot. ─── */}

      {/* 1. MAP ON SHELF — rolled paper map with magnifying glass on the wooden shelf → world map */}
      <button onClick={()=>transitionToMap()} style={{position:"absolute",left:"28%",top:"82%",width:"44%",height:"14%",zIndex:11,background:"transparent",border:"none",padding:0,cursor:"pointer",borderRadius:"10px",outline:"none",WebkitTapHighlightColor:"transparent"}}>
        {/* Pulse glow on magnifying glass */}
        <div style={{position:"absolute",left:"40%",top:"-55%",width:"28%",height:"100%",borderRadius:"50%",background:"radial-gradient(circle,rgba(255,220,120,0.32) 0%,rgba(255,190,80,0.12) 40%,transparent 72%)",pointerEvents:"none",animation:"hotspotPulse 2.6s ease-in-out infinite"}}/>
        <div style={{position:"absolute",left:"45%",top:"-45%",width:"18%",height:"70%",borderRadius:"50%",background:"radial-gradient(circle,rgba(255,245,180,0.22) 0%,transparent 55%)",pointerEvents:"none",animation:"hotspotPulse 3s ease-in-out infinite",animationDelay:"0.5s"}}/>
      </button>

      {/* 2. STAIRS — wooden stairs on the RIGHT → downstairs kitchen */}
      <button onClick={()=>transitionToKitchen()} style={{position:"absolute",right:"0%",top:"52%",width:"20%",height:"34%",zIndex:12,background:"transparent",border:"none",padding:0,cursor:"pointer",borderRadius:"8px",outline:"none",WebkitTapHighlightColor:"transparent"}}>
        {/* Pulse glow on staircase */}
        <div style={{position:"absolute",left:"15%",top:"20%",width:"70%",height:"50%",borderRadius:"45%",background:"radial-gradient(ellipse at 55% 50%,rgba(255,210,120,0.30) 0%,rgba(255,180,80,0.10) 45%,transparent 72%)",pointerEvents:"none",animation:"hotspotPulse 3s ease-in-out infinite"}}/>
        <div style={{position:"absolute",left:"25%",top:"28%",width:"50%",height:"38%",borderRadius:"50%",background:"radial-gradient(ellipse at 50% 50%,rgba(255,240,170,0.18) 0%,transparent 55%)",pointerEvents:"none",animation:"hotspotPulse 3.5s ease-in-out infinite",animationDelay:"0.7s"}}/>
      </button>

      {/* 3. OPEN BOOK ON DESK — upper-right corner on the desk near lamp → journal */}
      <button onClick={()=>transitionToJournal()} style={{position:"absolute",right:"6%",top:"30%",width:"18%",height:"16%",zIndex:11,background:"transparent",border:"none",padding:0,cursor:"pointer",borderRadius:"8px",outline:"none",WebkitTapHighlightColor:"transparent"}}>
        {/* Pulse glow on open book */}
        <div style={{position:"absolute",left:"10%",top:"10%",width:"80%",height:"85%",borderRadius:"45%",background:"radial-gradient(ellipse at 50% 55%,rgba(255,215,130,0.30) 0%,rgba(255,190,90,0.10) 45%,transparent 72%)",pointerEvents:"none",animation:"hotspotPulse 2.8s ease-in-out infinite",animationDelay:"0.3s"}}/>
        <div style={{position:"absolute",left:"22%",top:"18%",width:"56%",height:"65%",borderRadius:"50%",background:"radial-gradient(circle,rgba(255,245,180,0.20) 0%,transparent 55%)",pointerEvents:"none",animation:"hotspotPulse 3.3s ease-in-out infinite",animationDelay:"1s"}}/>
      </button>

      {/* 4. LEFT WINDOW — left half of the large picture window (forest + starry sky) */}
      <button className="window-hotspot" onClick={()=>setWindowPanel("left")} style={{position:"absolute",left:"18%",top:"6%",width:"25%",height:"32%",zIndex:10,background:"transparent",border:"none",cursor:"pointer",borderRadius:"8px"}}/>

      {/* 5. RIGHT WINDOW — right half of the large picture window */}
      <button className="window-hotspot" onClick={()=>setWindowPanel("right")} style={{position:"absolute",left:"44%",top:"6%",width:"25%",height:"32%",zIndex:10,background:"transparent",border:"none",cursor:"pointer",borderRadius:"8px"}}/>

      {/* 6. CANDLE / STREAK — over the fireplace mantel candles (LEFT side) */}
      <button onClick={tapCandle} style={{position:"absolute",left:"2%",top:"20%",width:"16%",height:"20%",zIndex:10,background:"transparent",border:"none",cursor:"pointer",borderRadius:"50%",animation:"candlePulse 3s ease-in-out infinite"}}>
        <div style={{position:"absolute",inset:"-20%",borderRadius:"50%",background:"radial-gradient(circle,rgba(255,200,80,0.06),transparent 65%)",pointerEvents:"none"}}/>
      </button>

      {/* 7. INSIGHTS — center area on the fluffy rug/carpet */}
      <button onClick={()=>setShowInsights(true)} style={{position:"absolute",left:"30%",right:"30%",top:"58%",height:"14%",zIndex:10,background:"transparent",border:"none",cursor:"pointer",borderRadius:"8px"}}>
        <div style={{position:"absolute",inset:"-10%",borderRadius:"50%",background:"radial-gradient(circle,rgba(255,200,80,0.04),transparent 60%)",pointerEvents:"none"}}/>
      </button>

      {/* 8. SIGN-IN / PROFILE — bottom-left beneath desk (always visible) */}
      {!user&&!authLoading&&auth&&(
        <button onClick={handleGoogleSignIn} style={{position:"absolute",left:"4%",bottom:"3%",zIndex:12,background:"rgba(26,22,18,0.65)",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",border:"1px solid rgba(201,169,110,0.2)",borderRadius:14,padding:"8px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:8,animation:"fadeUp 1s 1.5s ease both",boxShadow:"0 4px 16px rgba(0,0,0,0.3)"}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.68rem",color:"rgba(255,248,232,0.5)",letterSpacing:"0.02em"}}>Save your journey</span>
        </button>
      )}
      {user&&(
        <button onClick={()=>setWindowPanel("profile")} style={{position:"absolute",left:"4%",bottom:"3%",zIndex:12,width:40,height:40,borderRadius:"50%",overflow:"hidden",border:`2px solid rgba(201,169,110,${syncStatus==="synced"?0.5:0.25})`,background:"rgba(26,22,18,0.6)",cursor:"pointer",boxShadow:"0 2px 14px rgba(0,0,0,0.35)",animation:"fadeUp .5s ease both",padding:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
          {user.photoURL?(<img src={user.photoURL} alt="" referrerPolicy="no-referrer" style={{width:"100%",height:"100%",objectFit:"cover"}}/>):(<span style={{fontSize:"0.95rem",color:B.goldL,fontFamily:DISPLAY,fontWeight:700}}>{user.displayName?.[0]||"?"}</span>)}
          {syncStatus==="syncing"&&<div style={{position:"absolute",bottom:-2,right:-2,width:10,height:10,borderRadius:"50%",background:B.gold,border:"2px solid #1A1612",animation:"gentlePulse 1s infinite"}}/>}
          {syncStatus==="synced"&&<div style={{position:"absolute",bottom:-2,right:-2,width:10,height:10,borderRadius:"50%",background:"#6AAA6A",border:"2px solid #1A1612"}}/>}
        </button>
      )}

      {/* 9. HISTORY — bottom-right floating button */}
      <button onClick={goToHistory} style={{position:"absolute",right:"4%",bottom:"3%",zIndex:12,background:"rgba(26,22,18,0.65)",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",border:"1px solid rgba(201,169,110,0.2)",borderRadius:14,padding:"8px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:8,animation:"fadeUp 1s 1.8s ease both",boxShadow:"0 4px 16px rgba(0,0,0,0.3)"}}>
        <span style={{fontSize:"0.85rem"}}>📖</span>
        <span style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.68rem",color:"rgba(255,248,232,0.5)",letterSpacing:"0.02em"}}>History</span>
      </button>

      {/* 10. BOOKSHELF — far left behind fireplace → shelf books */}
      {SHELF_BOOKS.filter(b=>b.id!=="prayers"&&b.id!=="dreams").map((book,i)=>{
        const cv=BOOK_COVERS[book.id]||BOOK_COVERS.journal;
        const isActive=deskBook===book.id;
        const bookPositions=[
          {left:"0%",bottom:"42%",width:"6%",height:"8%"},  // book 1
          {left:"1%",bottom:"50%",width:"6%",height:"8%"},  // book 2
          {left:"0%",bottom:"58%",width:"7%",height:"7%"},  // book 3
          {left:"1%",bottom:"34%",width:"6%",height:"8%"},  // book 4
          {left:"0%",bottom:"66%",width:"7%",height:"7%"},  // book 5
          {left:"1%",bottom:"26%",width:"6%",height:"8%"},  // book 6
        ];
        const pos=bookPositions[i]||bookPositions[0];
        return(
          <button key={book.id} className="shelf-hotspot" onClick={()=>selectShelfBook(book.id)}
            style={{position:"absolute",left:pos.left,bottom:pos.bottom,width:pos.width,height:pos.height,zIndex:11,background:"transparent",border:"none",cursor:"pointer",borderRadius:"4px",animation:isActive?"none":"shelfGlow 4s ease-in-out infinite",animationDelay:`${i*0.3}s`}}>
            {isActive&&<div style={{position:"absolute",inset:"-15%",borderRadius:"50%",background:`radial-gradient(circle,${cv.accent}25,transparent 65%)`,pointerEvents:"none"}}/>}
          </button>
        );
      })}

      {/* CURRENCY BALANCE — candles + coins (triple-tap = toggle debug hotspots) — always visible */}
      <div onClick={debugTripleTap} style={{position:"absolute",left:"3%",top:"4%",zIndex:12,background:"rgba(26,22,18,0.7)",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",border:"1px solid rgba(212,180,100,0.15)",borderRadius:10,padding:"5px 12px",display:"flex",alignItems:"center",gap:10,animation:"fadeUp 1s 2s ease both",cursor:"default"}}>
        <div style={{display:"flex",alignItems:"center",gap:4}}>
          <span style={{fontSize:"0.8rem"}}>🕯️</span>
          <span style={{fontFamily:DISPLAY,fontSize:"0.82rem",fontWeight:700,color:B.goldL}}>{candles}</span>
        </div>
        <div style={{width:1,height:14,background:"rgba(212,180,100,0.2)"}}/>
        <div style={{display:"flex",alignItems:"center",gap:4}}>
          <span style={{fontSize:"0.75rem",color:"rgba(255,210,120,0.7)"}}>o</span>
          <span style={{fontFamily:DISPLAY,fontSize:"0.82rem",fontWeight:700,color:"rgba(255,210,120,0.85)"}}>{bank.coins}</span>
        </div>
      </div>

      {/* Back to village — top-right navigation */}
      <button onClick={()=>transitionToMap()} style={{position:"absolute",right:"3%",top:"4%",zIndex:12,background:"rgba(26,22,18,0.6)",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",border:"1px solid rgba(201,169,110,0.15)",borderRadius:999,padding:"6px 16px",cursor:"pointer",color:"rgba(255,248,232,0.55)",fontFamily:SANS,fontSize:"0.7rem",transition:"all 0.2s",display:"inline-flex",alignItems:"center",gap:5,animation:"fadeUp 1s 2s ease both",boxShadow:"0 2px 12px rgba(0,0,0,0.25)"}}>
        <span style={{fontSize:"0.65rem"}}>&#8592;</span> Back to village
      </button>

      {/* ═══ HOTSPOT DEBUG OVERLAY (2D only) ═══ */}
      {debugHotspots&&<>
        <div style={{position:"fixed",top:8,left:"50%",transform:"translateX(-50%)",zIndex:999,background:"rgba(255,60,60,0.85)",color:"#fff",fontFamily:SANS,fontSize:"0.65rem",fontWeight:700,padding:"4px 14px",borderRadius:20,letterSpacing:"0.04em",pointerEvents:"none",backdropFilter:"blur(6px)",WebkitBackdropFilter:"blur(6px)",whiteSpace:"nowrap"}}>DEBUG HOTSPOTS ON</div>
        {/* 1. Map on shelf */}
        <div style={{position:"absolute",left:"28%",top:"82%",width:"44%",height:"14%",zIndex:900,background:"rgba(255,100,100,0.25)",border:"2px solid rgba(255,100,100,0.7)",borderRadius:10,pointerEvents:"none",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontFamily:SANS,fontSize:"0.5rem",fontWeight:700,color:"#fff",background:"rgba(255,60,60,0.75)",padding:"2px 6px",borderRadius:8}}>MAP → World Map</span></div>
        {/* 2. Stairs */}
        <div style={{position:"absolute",right:"0%",top:"42%",width:"20%",height:"42%",zIndex:900,background:"rgba(100,255,100,0.25)",border:"2px solid rgba(100,255,100,0.7)",borderRadius:8,pointerEvents:"none",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontFamily:SANS,fontSize:"0.5rem",fontWeight:700,color:"#fff",background:"rgba(60,180,60,0.85)",padding:"2px 6px",borderRadius:8}}>STAIRS → Kitchen</span></div>
        {/* 3. Open book on desk */}
        <div style={{position:"absolute",right:"6%",top:"20%",width:"18%",height:"16%",zIndex:900,background:"rgba(100,100,255,0.25)",border:"2px solid rgba(100,100,255,0.7)",borderRadius:8,pointerEvents:"none",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontFamily:SANS,fontSize:"0.5rem",fontWeight:700,color:"#fff",background:"rgba(60,60,255,0.75)",padding:"2px 6px",borderRadius:8}}>BOOK → Journal</span></div>
        {/* 4. Left Window */}
        <div style={{position:"absolute",left:"18%",top:"6%",width:"25%",height:"32%",zIndex:900,background:"rgba(255,255,100,0.2)",border:"2px solid rgba(255,255,100,0.7)",borderRadius:8,pointerEvents:"none",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontFamily:SANS,fontSize:"0.5rem",fontWeight:700,color:"#fff",background:"rgba(180,180,0,0.85)",padding:"2px 6px",borderRadius:8}}>L-WIN</span></div>
        {/* 5. Right Window */}
        <div style={{position:"absolute",left:"44%",top:"6%",width:"25%",height:"32%",zIndex:900,background:"rgba(255,165,0,0.2)",border:"2px solid rgba(255,165,0,0.7)",borderRadius:8,pointerEvents:"none",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontFamily:SANS,fontSize:"0.5rem",fontWeight:700,color:"#fff",background:"rgba(200,120,0,0.85)",padding:"2px 6px",borderRadius:8}}>R-WIN</span></div>
        {/* 6. Candle (fireplace) */}
        <div style={{position:"absolute",left:"2%",top:"20%",width:"16%",height:"20%",zIndex:900,background:"rgba(255,100,255,0.25)",border:"2px solid rgba(255,100,255,0.7)",borderRadius:"50%",pointerEvents:"none",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontFamily:SANS,fontSize:"0.5rem",fontWeight:700,color:"#fff",background:"rgba(200,60,200,0.85)",padding:"2px 6px",borderRadius:8}}>CANDLE</span></div>
        {/* 7. Insights (rug) */}
        <div style={{position:"absolute",left:"30%",right:"30%",top:"58%",height:"14%",zIndex:900,background:"rgba(0,200,200,0.2)",border:"2px solid rgba(0,200,200,0.7)",borderRadius:8,pointerEvents:"none",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontFamily:SANS,fontSize:"0.5rem",fontWeight:700,color:"#fff",background:"rgba(0,150,150,0.85)",padding:"2px 6px",borderRadius:8}}>INSIGHTS</span></div>
      </>}

      {/* ═══ STREAK FLOATING INDICATOR ═══ */}
      {showStreak&&<div style={{position:"fixed",bottom:"28%",left:"50%",zIndex:60,animation:"streakFloat 3s ease both",pointerEvents:"none"}}>
        <div style={{background:"rgba(26,22,18,0.92)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",border:"1px solid rgba(201,169,110,0.3)",borderRadius:16,padding:"14px 24px",display:"flex",alignItems:"center",gap:12,boxShadow:"0 8px 32px rgba(0,0,0,0.4), 0 0 20px rgba(201,169,110,0.1)",whiteSpace:"nowrap"}}>
          <span style={{fontSize:"1.5rem"}}>🔥</span>
          <div>
            <div style={{fontFamily:DISPLAY,fontSize:"1.2rem",fontWeight:700,color:B.goldL}}>{streak}-day streak</div>
            <div style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.72rem",color:"rgba(255,248,232,0.4)",marginTop:2}}>{streak>=7?"The locked room awaits":"Keep showing up"}</div>
          </div>
        </div>
      </div>}

      {/* ═══ CANDLE REWARD FLOAT ═══ */}
      {candleReward&&<div style={{position:"fixed",bottom:"35%",left:"50%",zIndex:60,animation:"candleFloat 2.5s ease both",pointerEvents:"none"}}>
        <div style={{background:"rgba(26,22,18,0.92)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",border:"1px solid rgba(212,180,100,0.35)",borderRadius:16,padding:"14px 24px",display:"flex",alignItems:"center",gap:12,boxShadow:"0 8px 32px rgba(0,0,0,0.4), 0 0 20px rgba(212,180,100,0.15)",whiteSpace:"nowrap"}}>
          <span style={{fontSize:"1.5rem"}}>🕯️</span>
          <div>
            <div style={{fontFamily:DISPLAY,fontSize:"1.2rem",fontWeight:700,color:B.goldL}}>+{candleReward.amount} 🕯️</div>
            <div style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.72rem",color:"rgba(255,248,232,0.5)",marginTop:2}}>{candleReward.message}</div>
          </div>
        </div>
      </div>}

      {/* ═══ INSIGHTS OVERLAY ═══ */}
      {showInsights&&<div style={{position:"fixed",inset:0,zIndex:80}}>
        <div onClick={()=>setShowInsights(false)} style={{position:"absolute",inset:0,background:"rgba(10,8,6,0.6)",animation:"spaceFadeIn .25s ease"}}/>
        <div style={{position:"absolute",top:"50%",left:"50%",width:"min(88vw,400px)",maxHeight:"min(80vh,600px)",animation:"insightsSlideUp .4s cubic-bezier(.22,1,.36,1) both",background:"rgba(26,22,18,0.95)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",border:"1px solid rgba(201,169,110,0.2)",borderRadius:20,overflow:"hidden",display:"flex",flexDirection:"column"}}>
          {/* Close */}
          <button onClick={()=>setShowInsights(false)} style={{position:"absolute",top:14,right:14,width:30,height:30,borderRadius:"50%",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(201,169,110,0.15)",color:"rgba(255,248,232,0.5)",fontSize:"0.7rem",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",zIndex:5}}>✕</button>
          <div style={{overflowY:"auto",padding:"28px 24px 24px",flex:1}}>
            {/* Header */}
            <div style={{textAlign:"center",marginBottom:20}}>
              <div style={{fontSize:"1.3rem",marginBottom:6}}>✨</div>
              <h3 style={{fontFamily:DISPLAY,fontSize:"1.2rem",fontWeight:700,color:B.goldL,margin:"0 0 4px"}}>Your Journey</h3>
              <div style={{width:40,height:1,background:"linear-gradient(90deg,transparent,rgba(201,169,110,0.4),transparent)",margin:"8px auto 0"}}/>
            </div>
            {/* Stats row */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:18}}>
              {[{v:entries.length,l:"Reflections",e:"📝"},{v:totalWords.toLocaleString(),l:"Words",e:"✍️"},{v:`${streak}d`,l:"Streak",e:"🔥"}].map(s=>(
                <div key={s.l} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(201,169,110,0.1)",borderRadius:12,padding:"12px 8px",textAlign:"center"}}>
                  <div style={{fontSize:"0.9rem",marginBottom:4}}>{s.e}</div>
                  <div style={{fontFamily:SERIF,fontSize:"1.15rem",fontWeight:700,color:B.goldL}}>{s.v}</div>
                  <div style={{fontSize:"0.56rem",color:"rgba(255,248,232,0.35)",letterSpacing:"0.08em",textTransform:"uppercase",marginTop:2}}>{s.l}</div>
                </div>
              ))}
            </div>
            {/* Theme breakdown */}
            {entries.length>0&&<>
              <div style={{fontSize:"0.6rem",fontFamily:SANS,fontWeight:600,letterSpacing:"0.12em",color:"rgba(255,248,232,0.3)",textTransform:"uppercase",marginBottom:10}}>Theme Breakdown</div>
              {themeData.filter(t=>t.count>0).slice(0,5).map(t=>(
                <div key={t.theme} style={{marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                    <span style={{fontSize:"0.78rem",color:"rgba(255,248,232,0.7)",textTransform:"capitalize"}}>{t.theme}</span>
                    <span style={{fontSize:"0.68rem",color:"rgba(255,248,232,0.35)"}}>{t.pct}%</span>
                  </div>
                  <div style={{height:4,background:"rgba(255,255,255,0.06)",borderRadius:99,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${t.pct}%`,background:`linear-gradient(90deg,${B.gold},${B.goldL})`,borderRadius:99,transition:"width .7s ease"}}/>
                  </div>
                </div>
              ))}
              {/* Room progress */}
              <div style={{fontSize:"0.6rem",fontFamily:SANS,fontWeight:600,letterSpacing:"0.12em",color:"rgba(255,248,232,0.3)",textTransform:"uppercase",margin:"18px 0 10px"}}>Room Progress</div>
              {REFLECTION_ROOMS.map(room=>{
                const prog=roomProg(room),pct=Math.round(prog/room.days.length*100);
                return(<div key={room.id} style={{marginBottom:8}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                    <span style={{fontSize:"0.74rem",color:"rgba(255,248,232,0.6)"}}>{room.emoji} {room.label}</span>
                    <span style={{fontSize:"0.64rem",color:"rgba(255,248,232,0.3)"}}>{prog}/{room.days.length}</span>
                  </div>
                  <div style={{height:3,background:"rgba(255,255,255,0.06)",borderRadius:99,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${pct}%`,background:th(room.id).accent,borderRadius:99,transition:"width .6s"}}/>
                  </div>
                </div>);
              })}
            </>}
            {entries.length===0&&<div style={{textAlign:"center",padding:"20px 0"}}>
              <p style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.85rem",color:"rgba(255,248,232,0.35)",lineHeight:1.6}}>Your insights will emerge as you reflect. Open a book to begin.</p>
            </div>}
            {entries.length>0&&<button onClick={()=>{setShowInsights(false);goToHistory();}} style={{width:"100%",marginTop:16,background:"rgba(201,169,110,0.08)",border:"1px solid rgba(201,169,110,0.15)",borderRadius:10,padding:"11px",color:B.goldL,fontFamily:SERIF,fontStyle:"italic",fontSize:"0.82rem",cursor:"pointer",textAlign:"center"}}>View all reflections 📖</button>}
            <button onClick={()=>{setShowInsights(false);setJourneyTab("overview");setScreen("insights");}} style={{width:"100%",marginTop:8,background:"rgba(201,169,110,0.12)",border:"1px solid rgba(201,169,110,0.2)",borderRadius:10,padding:"11px",color:B.goldL,fontFamily:SERIF,fontStyle:"italic",fontSize:"0.82rem",cursor:"pointer",textAlign:"center"}}>View full journey ✨</button>
          </div>
        </div>
      </div>}

      {/* ═══ SHELF-TO-DESK ANIMATION OVERLAY ═══ */}
      {shelfAnim&&(()=>{
        const book=SHELF_BOOKS.find(b=>b.id===shelfAnim);
        const idx=SHELF_BOOKS.findIndex(b=>b.id===shelfAnim);
        // Books are now at the bottom — calculate horizontal start position
        const bookLefts=[20,31,42,53,64,75];
        const startLeft=`${bookLefts[idx]||45}%`;
        return <div style={{position:"fixed",inset:0,zIndex:50,pointerEvents:"none"}}>
          {/* Floating book emoji arcing from bottom shelf upward to center */}
          <div style={{position:"absolute",left:startLeft,bottom:"6%",fontSize:"2rem",animation:"bookArcFromBottom 1.2s cubic-bezier(.25,.46,.45,.94) forwards",filter:"drop-shadow(0 4px 24px rgba(255,200,80,0.6)) drop-shadow(0 0 12px rgba(255,220,130,0.3))"}}>
            {book?.emoji||"📖"}
          </div>
          {/* Soft golden trail glow */}
          <div style={{position:"absolute",left:startLeft,bottom:"6%",width:"30px",height:"30px",borderRadius:"50%",background:"radial-gradient(circle,rgba(255,220,130,0.4),transparent 70%)",animation:"bookArcFromBottom 1.2s 0.08s cubic-bezier(.25,.46,.45,.94) forwards",opacity:0.5}}/>
          {/* Desk book fade-out */}
          <div style={{position:"absolute",left:"45%",top:"55%",fontSize:"1.6rem",animation:"deskBookFadeOut 0.6s 0.3s ease forwards",opacity:1}}>
            {SHELF_BOOKS.find(b=>b.id===deskBook)?.emoji||"📖"}
          </div>
        </div>;
      })()}

      {/* ═══ WINDOW / PROFILE PANEL OVERLAY ═══ */}
      {windowPanel&&<div style={{position:"fixed",inset:0,zIndex:80}}>
        {/* Backdrop */}
        <div onClick={()=>setWindowPanel(null)} style={{position:"absolute",inset:0,background:"rgba(10,8,6,0.5)",animation:"spaceFadeIn .25s ease"}}/>
        {/* Panel */}
        <div style={{position:"absolute",[windowPanel==="right"?"right":"left"]:0,top:0,bottom:0,width:"min(82vw,360px)",background:"linear-gradient(180deg,rgba(26,22,18,0.96),rgba(20,16,12,0.98))",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",borderRight:windowPanel!=="right"?"1px solid rgba(201,169,110,0.15)":"none",borderLeft:windowPanel==="right"?"1px solid rgba(201,169,110,0.15)":"none",animation:windowPanel==="right"?"windowPanelSlide .35s ease both":"windowPanelSlideLeft .35s ease both",display:"flex",flexDirection:"column",padding:"48px 28px 36px"}}>
          {/* Close */}
          <button onClick={()=>setWindowPanel(null)} style={{position:"absolute",top:16,right:16,width:32,height:32,borderRadius:"50%",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(201,169,110,0.15)",color:"rgba(255,248,232,0.5)",fontSize:"0.75rem",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>

          {/* ── PROFILE PANEL ── */}
          {windowPanel==="profile"&&<>
            <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:24}}>
              {user?.photoURL?(<img src={user.photoURL} alt="" referrerPolicy="no-referrer" style={{width:52,height:52,borderRadius:"50%",border:"2px solid rgba(201,169,110,0.3)",objectFit:"cover"}}/>):(<div style={{width:52,height:52,borderRadius:"50%",background:"rgba(201,169,110,0.12)",border:"2px solid rgba(201,169,110,0.25)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.4rem",color:B.goldL,fontFamily:DISPLAY,fontWeight:700}}>{user?.displayName?.[0]||"?"}</div>)}
              <div>
                <h3 style={{fontFamily:DISPLAY,fontSize:"1.15rem",fontWeight:700,color:"#FFF8E8",margin:"0 0 3px"}}>{user?.displayName||"Journaler"}</h3>
                <div style={{fontFamily:SANS,fontSize:"0.7rem",color:"rgba(255,248,232,0.4)"}}>{user?.email}</div>
              </div>
            </div>
            <div style={{width:"100%",height:1,background:"linear-gradient(90deg,rgba(201,169,110,0.3),transparent)",marginBottom:22}}/>
            {/* Sync status */}
            <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(201,169,110,0.12)",borderRadius:12,padding:"14px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:"1.1rem"}}>☁️</span>
                <span style={{fontFamily:SERIF,fontSize:"0.88rem",color:"#FFF8E8"}}>Cloud sync</span>
              </div>
              <span style={{fontFamily:SANS,fontSize:"0.7rem",color:"#6AAA6A",fontWeight:600}}>Active</span>
            </div>
            {/* Stats */}
            <div style={{display:"flex",gap:10,marginBottom:18}}>
              <div style={{flex:1,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(201,169,110,0.08)",borderRadius:10,padding:"12px 14px",textAlign:"center"}}>
                <div style={{fontFamily:DISPLAY,fontSize:"1.3rem",fontWeight:700,color:B.goldL}}>{entries.length}</div>
                <div style={{fontFamily:SANS,fontSize:"0.62rem",color:"rgba(255,248,232,0.35)",marginTop:2}}>Reflections</div>
              </div>
              <div style={{flex:1,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(201,169,110,0.08)",borderRadius:10,padding:"12px 14px",textAlign:"center"}}>
                <div style={{fontFamily:DISPLAY,fontSize:"1.3rem",fontWeight:700,color:B.goldL}}>{streak}</div>
                <div style={{fontFamily:SANS,fontSize:"0.62rem",color:"rgba(255,248,232,0.35)",marginTop:2}}>Day streak</div>
              </div>
              <div style={{flex:1,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(201,169,110,0.08)",borderRadius:10,padding:"12px 14px",textAlign:"center"}}>
                <div style={{fontFamily:DISPLAY,fontSize:"1.3rem",fontWeight:700,color:B.goldL}}>{prayerPosts.length}</div>
                <div style={{fontFamily:SANS,fontSize:"0.62rem",color:"rgba(255,248,232,0.35)",marginTop:2}}>Prayers</div>
              </div>
            </div>
            {/* Info */}
            <div style={{background:"rgba(106,170,106,0.06)",border:"1px solid rgba(106,170,106,0.12)",borderRadius:10,padding:"12px 16px",marginBottom:14}}>
              <p style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.78rem",color:"rgba(255,248,232,0.45)",margin:0,lineHeight:1.6}}>Your reflections, prayers, and progress are safely synced across all your devices.</p>
            </div>
            <button onClick={()=>{setWindowPanel(null);goToHistory();}} style={{width:"100%",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(201,169,110,0.15)",borderRadius:10,padding:"13px 18px",color:B.goldL,fontFamily:SANS,fontSize:"0.82rem",cursor:"pointer",transition:"all .2s",marginBottom:8,display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:"1rem"}}>📖</span> Reflection History
            </button>
            <div style={{flex:1}}/>
            {/* Sign out */}
            <button onClick={()=>{handleSignOut();setWindowPanel(null);}} style={{width:"100%",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(201,169,110,0.15)",borderRadius:10,padding:"13px 18px",color:"rgba(255,248,232,0.45)",fontFamily:SANS,fontSize:"0.82rem",cursor:"pointer",transition:"all .2s",marginTop:12}}>Sign out</button>
            <div style={{textAlign:"center",marginTop:14}}>
              <p style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.68rem",color:"rgba(255,248,232,0.15)"}}>Tap outside to close</p>
            </div>
          </>}

          {/* ── WINDOW PANELS (left/right) ── */}
          {(windowPanel==="left"||windowPanel==="right")&&<>
            {/* Title */}
            <div style={{marginBottom:28}}>
              <div style={{fontSize:"1.4rem",marginBottom:8}}>{windowPanel==="left"?"🌲":"🌊"}</div>
              <h3 style={{fontFamily:DISPLAY,fontSize:"1.3rem",fontWeight:700,color:"#FFF8E8",margin:"0 0 4px"}}>{windowPanel==="left"?"Forest View":"Waterfall View"}</h3>
              <div style={{width:40,height:1,background:"linear-gradient(90deg,rgba(201,169,110,0.4),transparent)",marginTop:8}}/>
            </div>
            {/* Options */}
            <div style={{display:"flex",flexDirection:"column",gap:"14px",flex:1}}>
              {(windowPanel==="left"?[
                {emoji:"🔊",label:"Nature Sounds",desc:"Forest birdsong & gentle breeze"},
                {emoji:"⏱️",label:"Prayer Timer",desc:"1 · 3 · 5 · 10 minutes of stillness"},
                {emoji:"🕊️",label:"Stillness Mode",desc:"Quiet your mind. Just breathe."},
              ]:[
                {emoji:"📖",label:"Daily Scripture",desc:"A word to carry with you today"},
                {emoji:"🔊",label:"Water Sounds",desc:"Flowing waterfall & river stones"},
                {emoji:"🙏",label:"Quiet Prayer Space",desc:"Pour out your heart in this place"},
              ]).map((opt,i)=>(
                <div key={i} className="wp-option" style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(201,169,110,0.12)",borderRadius:12,padding:"16px 18px",display:"flex",alignItems:"center",gap:"14px"}}>
                  <div style={{fontSize:"1.3rem",width:36,textAlign:"center"}}>{opt.emoji}</div>
                  <div>
                    <div style={{fontFamily:SERIF,fontSize:"0.92rem",color:"#FFF8E8",fontWeight:600,marginBottom:2}}>{opt.label}</div>
                    <div style={{fontFamily:SANS,fontSize:"0.7rem",color:"rgba(255,248,232,0.4)"}}>{opt.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            {/* Footer hint */}
            <div style={{textAlign:"center",marginTop:20}}>
              <p style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.72rem",color:"rgba(255,248,232,0.2)"}}>Tap outside to close</p>
            </div>
          </>}
        </div>
      </div>}

      {/* ═══ IMMERSIVE PAGE-FLIPPING JOURNAL ═══ */}
      {bookOpen&&<div style={{position:"fixed",inset:0,zIndex:100}}>
        {/* Backdrop */}
        <div onClick={()=>{setBookOpen(false);setJournalSection(null);}} style={{position:"absolute",inset:0,background:"rgba(10,8,6,0.72)",backdropFilter:"blur(3px)",WebkitBackdropFilter:"blur(3px)",animation:"spaceFadeIn .3s ease"}}/>
        <BookSparkles/>
        {/* Book container */}
        <div onTouchStart={bookTouchStart} onTouchEnd={bookTouchEnd} style={{position:"absolute",top:"50%",left:"50%",width:"min(88vw,420px)",height:"min(78vh,640px)",animation:"bookOpenAnim .5s cubic-bezier(.22,1,.36,1) both",display:"flex",flexDirection:"column"}}>
          {/* Leather spine binding */}
          <div style={{position:"absolute",left:-6,top:4,bottom:4,width:13,background:"linear-gradient(90deg,#2E1E10,#4A3220,#3D2B18,#2E1E10)",borderRadius:"4px 0 0 4px",boxShadow:"2px 0 12px rgba(0,0,0,0.4), inset -1px 0 2px rgba(255,200,80,0.05)",zIndex:3}}/>
          {/* Page edges */}
          <div style={{position:"absolute",right:-3,top:8,bottom:8,width:6,background:"linear-gradient(90deg,#E8D5B0,#DCC89C,#D4BF90)",borderRadius:"0 2px 2px 0",boxShadow:"-1px 0 4px rgba(0,0,0,0.1)",zIndex:1}}/>
          {/* Cream page */}
          <div key={`p-${bookPage}-${deskBook}`} style={{flex:1,background:"linear-gradient(155deg,#F5E6C8 0%,#ECD9B5 35%,#E4CFA5 70%,#DCC89C 100%)",borderRadius:"3px 10px 10px 3px",position:"relative",overflow:"hidden",animation:`${flipDir==="bwd"?"pageRevealBwd":flipDir==="fwd"?"pageRevealFwd":"pageInitial"} .45s ease-out both`,boxShadow:"0 4px 30px rgba(0,0,0,0.4), 0 0 60px rgba(0,0,0,0.15), inset -2px 0 6px rgba(139,109,69,0.08)"}}>
            {/* Paper texture */}
            <div style={{position:"absolute",inset:0,background:"repeating-linear-gradient(0deg,transparent,transparent 28px,rgba(139,119,89,0.04) 28px,rgba(139,119,89,0.04) 29px)",pointerEvents:"none",borderRadius:"inherit"}}/>
            <div style={{position:"absolute",inset:0,boxShadow:"inset 0 0 80px rgba(139,109,69,0.12), inset 0 0 30px rgba(139,109,69,0.06)",pointerEvents:"none",borderRadius:"inherit"}}/>
            <div style={{position:"absolute",left:0,top:0,bottom:0,width:20,background:"linear-gradient(90deg,rgba(80,55,30,0.18),rgba(80,55,30,0.05),transparent)",pointerEvents:"none"}}/>
            {/* Page content */}
            <div style={{position:"relative",zIndex:2,height:"100%",display:"flex",flexDirection:"column",padding:"28px 22px 16px 30px",overflowY:"auto",WebkitOverflowScrolling:"touch"}}>

              {/* ══ JOURNAL-TYPE PAGES (Reflection Journal = default desk book) ══ */}
              {deskBook==="journal"&&<>
                {/* PAGE 0: Cover — pure journalondesk.png, no text */}
                {bookPage===0&&<>
                  <div style={{flex:1,position:"relative",animation:"pageContentReveal .5s .15s ease both",margin:"-28px -22px -16px -30px",overflow:"hidden",borderRadius:"3px 10px 10px 3px"}}>
                    <img src="/journalondesk.png" alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",objectPosition:"center 45%",borderRadius:"inherit"}} draggable={false}/>
                    {/* Page-turn arrow on the book's right edge */}
                    <button onClick={()=>flipPage("fwd")} style={{position:"absolute",right:"16%",top:"48%",transform:"translateY(-50%)",width:36,height:36,borderRadius:"50%",background:"rgba(245,230,200,0.75)",border:"1px solid rgba(139,109,69,0.25)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.1rem",color:"#5C4A2E",zIndex:5,boxShadow:"0 2px 10px rgba(0,0,0,0.3)",animation:"pageContentReveal 1s 1s ease both",backdropFilter:"blur(4px)",WebkitBackdropFilter:"blur(4px)"}}>&#8250;</button>
                  </div>
                </>}

                {/* PAGE 1: Table of Contents (section chooser) */}
                {bookPage===1&&!journalSection&&<>
                  <div style={{flex:1,display:"flex",flexDirection:"column",animation:"pageContentReveal .5s .1s ease both"}}>
                    <div style={{textAlign:"center",marginBottom:18}}>
                      <h2 style={{fontFamily:DISPLAY,fontSize:"clamp(1.15rem,4.5vw,1.35rem)",fontWeight:700,color:"#3D2B18",margin:"0 0 4px"}}>Choose Your Path</h2>
                      <div style={{width:50,height:1,background:"linear-gradient(90deg,transparent,#8B6D45,transparent)",margin:"8px auto 0"}}/>
                    </div>
                    <div style={{flex:1,display:"flex",flexDirection:"column",gap:12,justifyContent:"center"}}>
                      {[
                        {id:"blank",label:"Blank Journal",desc:"Free write your thoughts"},
                        {id:"rooms",label:"Reflection Rooms",desc:"Guided daily reflections"},
                        {id:"dreams",label:"Dream Journal",desc:"Record your dreams"},
                        {id:"prayers",label:"Prayer Journal",desc:"Prayers that water your garden"},
                      ].map(opt=>(
                        <button key={opt.id} onClick={()=>{setJournalSection(opt.id);setBookPage(2);setFlipDir("fwd");setBookText("");setBookSaveMsg("");}} style={{background:"rgba(139,109,69,0.06)",border:"1px solid rgba(139,109,69,0.15)",borderRadius:10,padding:"14px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:12,transition:"all .2s",textAlign:"left"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(139,109,69,0.12)"} onMouseLeave={e=>e.currentTarget.style.background="rgba(139,109,69,0.06)"}>
                          <div>
                            <div style={{fontFamily:DISPLAY,fontSize:"0.92rem",fontWeight:700,color:"#3D2B18",marginBottom:2}}>{opt.label}</div>
                            <div style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.76rem",color:"rgba(107,85,58,0.5)"}}>{opt.desc}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </>}

                {/* ── SECTION: BLANK JOURNAL (free write) ── */}
                {journalSection==="blank"&&bookPage===2&&<>
                  <div style={{flex:1,display:"flex",flexDirection:"column",animation:"pageContentReveal .5s .1s ease both"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                      <button onClick={()=>{setJournalSection(null);setBookPage(1);setFlipDir("bwd");}} style={{background:"transparent",border:"none",cursor:"pointer",fontFamily:SERIF,fontSize:"0.74rem",color:"rgba(107,85,58,0.5)",padding:0}}>&#8249; Contents</button>
                      <div style={{flex:1}}/>
                      <span style={{fontFamily:SANS,fontSize:"0.58rem",color:"rgba(107,85,58,0.35)",letterSpacing:"0.1em",textTransform:"uppercase"}}>{todayStr()}</span>
                    </div>
                    <h2 style={{fontFamily:DISPLAY,fontSize:"clamp(1.1rem,4vw,1.3rem)",fontWeight:700,color:"#3D2B18",margin:"0 0 12px",textAlign:"center"}}>Free Write</h2>
                    <div style={{width:40,height:1,background:"linear-gradient(90deg,transparent,rgba(139,109,69,0.3),transparent)",margin:"0 auto 14px"}}/>
                    <div style={{background:"rgba(139,109,69,0.04)",border:"1px solid rgba(139,109,69,0.1)",borderRadius:10,overflow:"hidden",flex:1,minHeight:160}}>
                      <textarea value={bookText} onChange={e=>setBookText(e.target.value)} placeholder="Write freely... no prompts, no rules." style={{width:"100%",height:"100%",minHeight:160,background:"transparent",border:"none",padding:"14px 16px",fontFamily:SERIF,fontSize:"0.88rem",color:"#4A3826",lineHeight:1.8,boxSizing:"border-box",resize:"none"}}/>
                    </div>
                    {bookText.trim()&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 12px",marginTop:8,background:"rgba(139,109,69,0.08)",borderRadius:8,border:"1px solid rgba(139,109,69,0.15)"}}>
                      <span style={{fontSize:"0.7rem",color:"rgba(107,85,58,0.5)",fontFamily:SANS}}>{bookSaveMsg||`${wc(bookText)} words`}</span>
                      <button onClick={()=>{const e={id:Date.now().toString(),date:todayStr(),roomId:"blank",roomLabel:"Blank Journal",roomEmoji:"📝",day:0,prompt:"Free write",text:bookText.trim(),words:wc(bookText)};persistEntries([e,...entries]);addCandles(3,"Reflection saved +3");setBookSaveMsg("Saved!");setTimeout(()=>setBookSaveMsg(""),2500);}} style={{background:"linear-gradient(135deg,#5C4A2E,#3D2B18)",border:"none",color:"#F5E6C8",padding:"6px 18px",borderRadius:6,cursor:"pointer",fontSize:"0.76rem",fontFamily:SANS,fontWeight:600}}>Save</button>
                    </div>}
                  </div>
                </>}

                {/* ── SECTION: REFLECTION ROOMS ── */}
                {journalSection==="rooms"&&bookPage>=2&&<>
                  {/* Back to contents link */}
                  {(()=>{
                    const roomIdx=bookPage-2; // 0-6 = rooms, 7=jesus, 8=locked, 9=daily, 10=entries
                    return<div style={{flex:1,display:"flex",flexDirection:"column",animation:"pageContentReveal .5s .1s ease both"}}>
                      <div style={{display:"flex",alignItems:"center",marginBottom:10}}>
                        <button onClick={()=>{setJournalSection(null);setBookPage(1);setFlipDir("bwd");}} style={{background:"transparent",border:"none",cursor:"pointer",fontFamily:SERIF,fontSize:"0.74rem",color:"rgba(107,85,58,0.5)",padding:0}}>&#8249; Contents</button>
                      </div>
                      {/* Reflection Rooms (pages 2-8, roomIdx 0-6) */}
                      {roomIdx>=0&&roomIdx<REFLECTION_ROOMS.length&&(()=>{
                        const room=REFLECTION_ROOMS[roomIdx],prog=roomProg(room),done=prog>=room.days.length,currentDay=Math.min(prog,room.days.length-1),dayData=room.days[currentDay];
                        return<>
                          <div style={{textAlign:"center",marginBottom:14}}>
                            <div style={{fontSize:"1.8rem",marginBottom:6}}>{room.emoji}</div>
                            <h2 style={{fontFamily:DISPLAY,fontSize:"clamp(1.15rem,4.5vw,1.35rem)",fontWeight:700,color:"#3D2B18",margin:"0 0 4px"}}>{room.label}</h2>
                            <div style={{fontFamily:SANS,fontSize:"0.6rem",color:"rgba(107,85,58,0.5)",letterSpacing:"0.1em",textTransform:"uppercase",marginTop:3}}>{done?"Complete":`Day ${prog+1} of ${room.days.length}`}</div>
                          </div>
                          <div style={{width:40,height:1,background:"linear-gradient(90deg,transparent,rgba(139,109,69,0.3),transparent)",margin:"0 auto 16px"}}/>
                          <p style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"clamp(0.85rem,3vw,0.95rem)",color:"#5C4A2E",lineHeight:1.7,textAlign:"center",margin:"0 6px 8px"}}>"{room.question}"</p>
                          {!done&&<div style={{background:"rgba(139,109,69,0.06)",borderRadius:8,padding:"14px 16px",margin:"12px 0",border:"1px solid rgba(139,109,69,0.1)"}}>
                            <div style={{fontFamily:SANS,fontSize:"0.56rem",color:"rgba(107,85,58,0.45)",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:6}}>Today's Prompt</div>
                            <p style={{fontFamily:SERIF,fontSize:"clamp(0.8rem,2.8vw,0.88rem)",color:"#4A3826",lineHeight:1.6,margin:0}}>{dayData.q}</p>
                            <p style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.72rem",color:"rgba(107,85,58,0.38)",margin:"6px 0 0"}}>{dayData.hint}</p>
                          </div>}
                          {done&&<div style={{background:"rgba(139,109,69,0.05)",borderRadius:8,padding:"12px 16px",margin:"12px 0",border:"1px dashed rgba(139,109,69,0.12)",textAlign:"center"}}>
                            <p style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.82rem",color:"rgba(107,85,58,0.45)",margin:0}}>You've completed all {room.days.length} days in this room.</p>
                          </div>}
                          <div style={{flex:1,minHeight:16}}/>
                          <button className="book-room" onClick={()=>{setBookOpen(false);enterRoom(room,"cabin");}} style={{alignSelf:"center",background:"linear-gradient(135deg,rgba(93,74,46,0.1),rgba(93,74,46,0.04))",border:"1px solid rgba(93,74,46,0.22)",color:"#5C4A2E",padding:"11px 32px",borderRadius:8,fontFamily:SERIF,fontStyle:"italic",fontSize:"0.84rem",cursor:"pointer",transition:"all .2s",letterSpacing:"0.02em"}}>{done?"Revisit this room":"Begin reflecting"}</button>
                        </>;
                      })()}
                      {/* Jesus Questions (roomIdx 7) */}
                      {roomIdx===REFLECTION_ROOMS.length&&<>
                        <div style={{textAlign:"center",marginBottom:14}}>
                          <div style={{fontSize:"1.8rem",marginBottom:8}}>&#10013;&#65039;</div>
                          <h2 style={{fontFamily:DISPLAY,fontSize:"clamp(1.1rem,4.5vw,1.3rem)",fontWeight:700,color:"#3D2B18",margin:"0 0 4px",textAlign:"center"}}>Questions Jesus Asked</h2>
                        </div>
                        <div style={{width:40,height:1,background:"linear-gradient(90deg,transparent,rgba(139,109,69,0.3),transparent)",margin:"0 auto 16px"}}/>
                        <p style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"clamp(0.88rem,3vw,1rem)",color:"#5C4A2E",lineHeight:1.7,textAlign:"center",margin:"0 4px"}}>"{JESUS_QUESTIONS[jesusIdx].q}"</p>
                        <p style={{fontFamily:SANS,fontSize:"0.66rem",color:"rgba(107,85,58,0.4)",margin:"8px 0 0",textAlign:"center"}}>{JESUS_QUESTIONS[jesusIdx].ref}</p>
                        <div style={{background:"rgba(139,109,69,0.06)",borderRadius:8,padding:"12px 16px",margin:"18px 0",border:"1px solid rgba(139,109,69,0.1)"}}>
                          <p style={{fontFamily:SERIF,fontSize:"0.82rem",color:"#4A3826",lineHeight:1.55,margin:0,textAlign:"center"}}>{JESUS_QUESTIONS[jesusIdx].app}</p>
                        </div>
                        <div style={{flex:1}}/>
                        <button className="book-room" onClick={()=>{setBookOpen(false);setScreen("jesus");}} style={{alignSelf:"center",background:"linear-gradient(135deg,rgba(93,74,46,0.1),rgba(93,74,46,0.04))",border:"1px solid rgba(93,74,46,0.22)",color:"#5C4A2E",padding:"11px 32px",borderRadius:8,fontFamily:SERIF,fontStyle:"italic",fontSize:"0.84rem",cursor:"pointer",transition:"all .2s"}}>Open Scripture questions</button>
                      </>}
                      {/* Locked Room (roomIdx 8) */}
                      {roomIdx===REFLECTION_ROOMS.length+1&&(()=>{
                        const unlocked=streak>=7;
                        return<div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center"}}>
                          <div style={{fontSize:"2rem",marginBottom:12}}>{unlocked?"🗝️":"🔒"}</div>
                          <h2 style={{fontFamily:DISPLAY,fontSize:"clamp(1.1rem,4.5vw,1.3rem)",fontWeight:700,color:unlocked?"#3D2B18":"rgba(61,43,24,0.4)",margin:"0 0 4px"}}>The Locked Room</h2>
                          <div style={{width:40,height:1,background:`linear-gradient(90deg,transparent,rgba(139,109,69,${unlocked?0.3:0.12}),transparent)`,margin:"12px auto 18px"}}/>
                          {unlocked?<>
                            <p style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.92rem",color:"#5C4A2E",lineHeight:1.7,margin:"0 8px 24px"}}>The deepest questions await.</p>
                            <button className="book-room" onClick={()=>{setBookOpen(false);enterRoom(LOCKED_ROOM,"cabin");}} style={{background:"linear-gradient(135deg,rgba(93,74,46,0.1),rgba(93,74,46,0.04))",border:"1px solid rgba(93,74,46,0.22)",color:"#5C4A2E",padding:"11px 32px",borderRadius:8,fontFamily:SERIF,fontStyle:"italic",fontSize:"0.84rem",cursor:"pointer"}}>Enter the locked room</button>
                          </>:<>
                            <p style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.88rem",color:"rgba(107,85,58,0.4)",lineHeight:1.7,margin:"0 8px"}}>Some rooms only open with consistency.</p>
                            <div style={{width:"60%",maxWidth:180,height:4,background:"rgba(139,109,69,0.1)",borderRadius:99,margin:"22px auto 8px",overflow:"hidden"}}><div style={{width:`${(streak/7)*100}%`,height:"100%",background:"linear-gradient(90deg,#8B6D45,#C9A96E)",borderRadius:99}}/></div>
                            <p style={{fontFamily:SANS,fontSize:"0.66rem",color:"rgba(107,85,58,0.35)"}}>{7-streak} more day{7-streak===1?"":"s"} to unlock</p>
                          </>}
                        </div>;
                      })()}
                      {/* Daily Question (roomIdx 9) */}
                      {roomIdx===REFLECTION_ROOMS.length+2&&(()=>{
                        const dailyQ=VIRAL_QS[new Date().getDate()%VIRAL_QS.length];
                        return<>
                          <div style={{textAlign:"center",marginBottom:14}}>
                            <h2 style={{fontFamily:DISPLAY,fontSize:"clamp(1.05rem,4vw,1.2rem)",fontWeight:700,color:"#3D2B18",margin:"0 0 4px"}}>Question to Carry Today</h2>
                          </div>
                          <div style={{width:40,height:1,background:"linear-gradient(90deg,transparent,rgba(139,109,69,0.3),transparent)",margin:"0 auto 16px"}}/>
                          <div style={{background:"rgba(139,109,69,0.06)",borderRadius:8,padding:"18px 16px",border:"1px solid rgba(139,109,69,0.1)",marginBottom:14}}>
                            <p style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"clamp(0.88rem,3vw,0.98rem)",color:"#5C4A2E",lineHeight:1.7,margin:0,textAlign:"center"}}>{dailyQ}</p>
                          </div>
                          <button className="book-room" onClick={()=>{setBookOpen(false);setCardQ(dailyQ);setIsCustomCard(false);setScreen("cards");}} style={{alignSelf:"center",background:"transparent",border:"1px solid rgba(101,83,55,0.2)",color:"#5C4A2E",padding:"9px 22px",borderRadius:8,fontFamily:SERIF,fontStyle:"italic",fontSize:"0.78rem",cursor:"pointer"}}>Make a card</button>
                        </>;
                      })()}
                      {/* Past Entries (roomIdx 10) */}
                      {roomIdx===REFLECTION_ROOMS.length+3&&<>
                        <div style={{textAlign:"center",marginBottom:14}}>
                          <h2 style={{fontFamily:DISPLAY,fontSize:"clamp(1.05rem,4vw,1.2rem)",fontWeight:700,color:"#3D2B18",margin:"0 0 4px"}}>Past Entries</h2>
                          <div style={{fontFamily:SANS,fontSize:"0.6rem",color:"rgba(107,85,58,0.5)",letterSpacing:"0.1em",textTransform:"uppercase",marginTop:3}}>{entries.length} reflection{entries.length===1?"":"s"}</div>
                        </div>
                        <div style={{width:40,height:1,background:"linear-gradient(90deg,transparent,rgba(139,109,69,0.3),transparent)",margin:"0 auto 14px"}}/>
                        {entries.length===0?<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",textAlign:"center",padding:"0 12px"}}>
                          <p style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.88rem",color:"rgba(107,85,58,0.4)",lineHeight:1.7}}>Your reflections will appear here as you journal.</p>
                        </div>:(
                          <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:10}}>
                            {entries.slice(0,8).map(e=>{
                              const allR=[...REFLECTION_ROOMS,...COMMUNITY_ROOMS,LOCKED_ROOM,{id:"jesus",label:"Jesus Questions",emoji:"✝️"}];
                              const room=allR.find(r=>r.id===e.roomId)||{emoji:e.roomEmoji||"📝",label:e.roomLabel||"Reflection"};
                              return(<div key={e.id} style={{background:"rgba(139,109,69,0.05)",border:"1px solid rgba(139,109,69,0.1)",borderRadius:8,padding:"10px 12px"}}>
                                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                                  <span style={{fontSize:"0.7rem"}}>{room.emoji}</span>
                                  <span style={{fontSize:"0.62rem",fontWeight:600,color:"rgba(107,85,58,0.5)",fontFamily:SANS}}>{room.label}</span>
                                  <span style={{marginLeft:"auto",fontSize:"0.58rem",color:"rgba(107,85,58,0.3)"}}>{e.date}</span>
                                </div>
                                <p style={{fontFamily:SERIF,fontSize:"0.78rem",color:"#4A3826",lineHeight:1.6,margin:0}}>{e.text.length>120?e.text.slice(0,120)+"...":e.text}</p>
                              </div>);
                            })}
                            {entries.length>8&&<p style={{textAlign:"center",fontFamily:SERIF,fontStyle:"italic",fontSize:"0.72rem",color:"rgba(107,85,58,0.35)",margin:"8px 0 0"}}>+ {entries.length-8} more entries</p>}
                          </div>
                        )}
                      </>}
                      <div style={{textAlign:"center",fontFamily:SANS,fontSize:"0.6rem",color:"rgba(107,85,58,0.3)",letterSpacing:"0.1em",textTransform:"uppercase",marginTop:10}}>{bookPage+1} of {TOTAL_BOOK_PAGES}</div>
                    </div>;
                  })()}
                </>}

                {/* ── SECTION: DREAM JOURNAL ── */}
                {journalSection==="dreams"&&bookPage>=2&&(()=>{
                  const dreamPages=BOOK_CONTENT.dreams?.pages||[];
                  const pgIdx=bookPage-2;
                  const pg=dreamPages[pgIdx];
                  if(!pg) return null;
                  return<div style={{flex:1,display:"flex",flexDirection:"column",animation:"pageContentReveal .5s .1s ease both"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                      <button onClick={()=>{setJournalSection(null);setBookPage(1);setFlipDir("bwd");}} style={{background:"transparent",border:"none",cursor:"pointer",fontFamily:SERIF,fontSize:"0.74rem",color:"rgba(107,85,58,0.5)",padding:0}}>&#8249; Contents</button>
                      <div style={{flex:1}}/>
                      <span style={{fontFamily:SANS,fontSize:"0.58rem",color:"rgba(107,85,58,0.35)",letterSpacing:"0.1em",textTransform:"uppercase"}}>Dream {pgIdx+1} of {dreamPages.length}</span>
                    </div>
                    <h2 style={{fontFamily:DISPLAY,fontSize:"clamp(1.15rem,4.5vw,1.35rem)",fontWeight:700,color:"#3D2B18",margin:"0 0 4px",textAlign:"center"}}>{pg.title}</h2>
                    <div style={{width:40,height:1,background:"linear-gradient(90deg,transparent,rgba(139,109,69,0.3),transparent)",margin:"8px auto 16px"}}/>
                    <div style={{background:"rgba(139,109,69,0.06)",borderRadius:8,padding:"16px 18px",margin:"0 0 10px",border:"1px solid rgba(139,109,69,0.1)"}}>
                      <p style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"clamp(0.88rem,3vw,0.98rem)",color:"#5C4A2E",lineHeight:1.7,margin:0,textAlign:"center"}}>{pg.prompt}</p>
                    </div>
                    <p style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.74rem",color:"rgba(107,85,58,0.4)",textAlign:"center",margin:"0 0 14px",lineHeight:1.6}}>{pg.hint}</p>
                    <div style={{background:"rgba(139,109,69,0.04)",border:"1px solid rgba(139,109,69,0.1)",borderRadius:10,overflow:"hidden",flex:1,minHeight:120}}>
                      <textarea value={bookText} onChange={e=>setBookText(e.target.value)} placeholder="Write your thoughts here..." style={{width:"100%",height:"100%",minHeight:120,background:"transparent",border:"none",padding:"14px 16px",fontFamily:SERIF,fontSize:"0.88rem",color:"#4A3826",lineHeight:1.8,boxSizing:"border-box",resize:"none"}}/>
                    </div>
                    {bookText.trim()&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 12px",marginTop:8,background:"rgba(139,109,69,0.08)",borderRadius:8,border:"1px solid rgba(139,109,69,0.15)"}}>
                      <span style={{fontSize:"0.7rem",color:"rgba(107,85,58,0.5)",fontFamily:SANS}}>{bookSaveMsg||`${wc(bookText)} words`}</span>
                      <button onClick={()=>{const e={id:Date.now().toString(),date:todayStr(),roomId:"dreams",roomLabel:"Dream Journal",roomEmoji:"🌙",day:pgIdx,prompt:pg.prompt,text:bookText.trim(),words:wc(bookText)};persistEntries([e,...entries]);addCandles(3,"Dream saved +3");setBookSaveMsg("Saved!");setTimeout(()=>setBookSaveMsg(""),2500);}} style={{background:"linear-gradient(135deg,#5C4A2E,#3D2B18)",border:"none",color:"#F5E6C8",padding:"6px 18px",borderRadius:6,cursor:"pointer",fontSize:"0.76rem",fontFamily:SANS,fontWeight:600}}>Save</button>
                    </div>}
                  </div>;
                })()}

                {/* ── SECTION: PRAYER JOURNAL ── */}
                {journalSection==="prayers"&&bookPage>=2&&<>
                  <div style={{flex:1,display:"flex",flexDirection:"column",animation:"pageContentReveal .5s .1s ease both"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                      <button onClick={()=>{setJournalSection(null);setBookPage(1);setFlipDir("bwd");}} style={{background:"transparent",border:"none",cursor:"pointer",fontFamily:SERIF,fontSize:"0.74rem",color:"rgba(107,85,58,0.5)",padding:0}}>&#8249; Contents</button>
                    </div>
                    {/* Page 2: Write a prayer */}
                    {bookPage===2&&<>
                      <h2 style={{fontFamily:DISPLAY,fontSize:"clamp(1.1rem,4vw,1.3rem)",fontWeight:700,color:"#3D2B18",margin:"0 0 4px",textAlign:"center"}}>Write a Prayer</h2>
                      <p style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.78rem",color:"rgba(107,85,58,0.45)",textAlign:"center",margin:"4px 0 14px"}}>Each prayer waters a plant in your garden</p>
                      <div style={{width:40,height:1,background:"linear-gradient(90deg,transparent,rgba(139,109,69,0.3),transparent)",margin:"0 auto 14px"}}/>
                      <div style={{background:"rgba(139,109,69,0.04)",border:"1px solid rgba(139,109,69,0.1)",borderRadius:10,overflow:"hidden",flex:1,minHeight:160}}>
                        <textarea value={bookText} onChange={e=>setBookText(e.target.value)} placeholder="Pour out your heart... He is listening." style={{width:"100%",height:"100%",minHeight:160,background:"transparent",border:"none",padding:"14px 16px",fontFamily:SERIF,fontSize:"0.88rem",color:"#4A3826",lineHeight:1.8,boxSizing:"border-box",resize:"none"}}/>
                      </div>
                      {bookText.trim()&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 12px",marginTop:8,background:"rgba(139,109,69,0.08)",borderRadius:8,border:"1px solid rgba(139,109,69,0.15)"}}>
                        <span style={{fontSize:"0.7rem",color:"rgba(107,85,58,0.5)",fontFamily:SANS}}>{bookSaveMsg||`${wc(bookText)} words`}</span>
                        <button onClick={savePrayerJournalEntry} style={{background:"linear-gradient(135deg,#3D6B3D,#2E5A2E)",border:"none",color:"#E8F5E8",padding:"6px 18px",borderRadius:6,cursor:"pointer",fontSize:"0.76rem",fontFamily:SANS,fontWeight:600}}>Save & Water Garden</button>
                      </div>}
                    </>}
                    {/* Page 3: Prayer list with garden status */}
                    {bookPage===3&&<>
                      <h2 style={{fontFamily:DISPLAY,fontSize:"clamp(1.05rem,4vw,1.2rem)",fontWeight:700,color:"#3D2B18",margin:"0 0 4px",textAlign:"center"}}>Your Prayers</h2>
                      <div style={{fontFamily:SANS,fontSize:"0.6rem",color:"rgba(107,85,58,0.5)",letterSpacing:"0.1em",textTransform:"uppercase",marginTop:3,textAlign:"center"}}>{prayerPosts.length} prayer{prayerPosts.length===1?"":"s"}</div>
                      <div style={{width:40,height:1,background:"linear-gradient(90deg,transparent,rgba(139,109,69,0.3),transparent)",margin:"10px auto 14px"}}/>
                      {prayerPosts.length===0?<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",textAlign:"center"}}>
                        <p style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.88rem",color:"rgba(107,85,58,0.4)",lineHeight:1.7}}>Your prayers will appear here. Turn back to write one.</p>
                      </div>:(
                        <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:10}}>
                          {prayerPosts.slice(0,10).map(p=>{
                            const plot=gardenPlots.find(g=>g.prayerId===p.id&&g.stage!=="empty");
                            const stage=plot?getComputedStage(plot):null;
                            return(<div key={p.id} style={{background:"rgba(139,109,69,0.05)",border:"1px solid rgba(139,109,69,0.1)",borderRadius:8,padding:"10px 12px"}}>
                              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                                <span style={{fontSize:"0.7rem",fontFamily:SERIF,color:"rgba(107,85,58,0.4)"}}>{plot?getPlantEmoji(plot):"~"}</span>
                                <span style={{fontSize:"0.62rem",fontWeight:600,color:p.status==="answered"?"#4A8B4A":"rgba(107,85,58,0.5)",fontFamily:SANS}}>{p.status==="answered"?"Answered":stage||"Not yet planted"}</span>
                                <span style={{marginLeft:"auto",fontSize:"0.58rem",color:"rgba(107,85,58,0.3)"}}>{p.date}</span>
                              </div>
                              <p style={{fontFamily:SERIF,fontSize:"0.78rem",color:"#4A3826",lineHeight:1.6,margin:0}}>{p.text.length>100?p.text.slice(0,100)+"...":p.text}</p>
                            </div>);
                          })}
                          {prayerPosts.length>10&&<p style={{textAlign:"center",fontFamily:SERIF,fontStyle:"italic",fontSize:"0.72rem",color:"rgba(107,85,58,0.35)",margin:"8px 0 0"}}>+ {prayerPosts.length-10} more prayers</p>}
                        </div>
                      )}
                    </>}
                  </div>
                </>}
              </>}

              {/* ══ OTHER BOOK TYPES (Bible, Prayers, Gratitude, Dreams, Prophecy) ══ */}
              {deskBook!=="journal"&&BOOK_CONTENT[deskBook]&&<>
                {/* PAGE 0: Cover */}
                {bookPage===0&&<>
                  <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",animation:"pageContentReveal .5s .15s ease both"}}>
                    <div style={{fontSize:"2.2rem",marginBottom:14,filter:"drop-shadow(0 2px 4px rgba(139,109,69,0.2))"}}>
                      {SHELF_BOOKS.find(b=>b.id===deskBook)?.emoji||"📖"}
                    </div>
                    <h2 style={{fontFamily:DISPLAY,fontSize:"clamp(1.3rem,5vw,1.6rem)",fontWeight:700,color:"#3D2B18",margin:"0 0 6px",letterSpacing:"0.02em"}}>{BOOK_CONTENT[deskBook].cover.title}</h2>
                    <div style={{width:50,height:1,background:"linear-gradient(90deg,transparent,#8B6D45,transparent)",margin:"4px auto 18px"}}/>
                    <p style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"clamp(0.88rem,3vw,1rem)",color:"#6B553A",lineHeight:1.75,maxWidth:280,margin:"0 auto"}}>{BOOK_CONTENT[deskBook].cover.subtitle}</p>
                    <p style={{fontFamily:SERIF,fontSize:"0.78rem",color:"rgba(107,85,58,0.4)",marginTop:28,letterSpacing:"0.02em"}}>Turn the page to begin →</p>
                  </div>
                  <div style={{textAlign:"center",fontFamily:SANS,fontSize:"0.6rem",color:"rgba(107,85,58,0.3)",letterSpacing:"0.1em",textTransform:"uppercase"}}>— 1 of {TOTAL_BOOK_PAGES} —</div>
                </>}

                {/* CONTENT PAGES */}
                {bookPage>=1&&bookPage<=BOOK_CONTENT[deskBook].pages.length&&(()=>{
                  const pg=BOOK_CONTENT[deskBook].pages[bookPage-1];
                  return<>
                    <div style={{flex:1,display:"flex",flexDirection:"column",animation:"pageContentReveal .5s .1s ease both"}}>
                      <div style={{textAlign:"center",marginBottom:14}}>
                        <div style={{fontFamily:SANS,fontSize:"0.56rem",color:"rgba(107,85,58,0.45)",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:8}}>Page {bookPage}</div>
                        <h2 style={{fontFamily:DISPLAY,fontSize:"clamp(1.15rem,4.5vw,1.35rem)",fontWeight:700,color:"#3D2B18",margin:"0 0 4px"}}>{pg.title}</h2>
                      </div>
                      <div style={{width:40,height:1,background:"linear-gradient(90deg,transparent,rgba(139,109,69,0.3),transparent)",margin:"0 auto 16px"}}/>
                      <div style={{background:"rgba(139,109,69,0.06)",borderRadius:8,padding:"16px 18px",margin:"0 0 14px",border:"1px solid rgba(139,109,69,0.1)"}}>
                        <p style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"clamp(0.88rem,3vw,0.98rem)",color:"#5C4A2E",lineHeight:1.7,margin:0,textAlign:"center"}}>{pg.prompt}</p>
                      </div>
                      <p style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.74rem",color:"rgba(107,85,58,0.4)",textAlign:"center",margin:"0 0 16px",lineHeight:1.6}}>{pg.hint}</p>
                      {/* Writing area */}
                      <div style={{background:"rgba(139,109,69,0.04)",border:"1px solid rgba(139,109,69,0.1)",borderRadius:10,overflow:"hidden",flex:1,minHeight:120}}>
                        <textarea value={bookText} onChange={e=>setBookText(e.target.value)} placeholder="Write your thoughts here…" style={{width:"100%",height:"100%",minHeight:120,background:"transparent",border:"none",padding:"14px 16px",fontFamily:SERIF,fontSize:"0.88rem",color:"#4A3826",lineHeight:1.8,boxSizing:"border-box",resize:"none"}}/>
                      </div>
                      {/* Save bar */}
                      {bookText.trim()&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 12px",marginTop:8,background:"rgba(139,109,69,0.08)",borderRadius:8,border:"1px solid rgba(139,109,69,0.15)"}}>
                        <span style={{fontSize:"0.7rem",color:"rgba(107,85,58,0.5)",fontFamily:SANS}}>{bookSaveMsg||`${wc(bookText)} words`}</span>
                        <button onClick={saveBookEntry} style={{background:"linear-gradient(135deg,#5C4A2E,#3D2B18)",border:"none",color:"#F5E6C8",padding:"6px 18px",borderRadius:6,cursor:"pointer",fontSize:"0.76rem",fontFamily:SANS,fontWeight:600,letterSpacing:"0.02em"}}>Save →</button>
                      </div>}
                    </div>
                    <div style={{textAlign:"center",fontFamily:SANS,fontSize:"0.6rem",color:"rgba(107,85,58,0.3)",letterSpacing:"0.1em",textTransform:"uppercase",marginTop:10}}>— {bookPage+1} of {TOTAL_BOOK_PAGES} —</div>
                  </>;
                })()}
              </>}

            </div>
          </div>
          {/* Nav arrows */}
          {bookPage>0&&<button className="book-nav" onClick={()=>flipPage("bwd")} style={{position:"absolute",left:-20,top:"50%",transform:"translateY(-50%)",width:38,height:38,borderRadius:"50%",background:"rgba(245,230,200,0.92)",border:"1px solid rgba(101,83,55,0.15)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1rem",color:"#5C4A2E",zIndex:10,boxShadow:"0 2px 12px rgba(0,0,0,0.25)"}}>‹</button>}
          {bookPage<TOTAL_BOOK_PAGES-1&&<button className="book-nav" onClick={()=>flipPage("fwd")} style={{position:"absolute",right:-20,top:"50%",transform:"translateY(-50%)",width:38,height:38,borderRadius:"50%",background:"rgba(245,230,200,0.92)",border:"1px solid rgba(101,83,55,0.15)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1rem",color:"#5C4A2E",zIndex:10,boxShadow:"0 2px 12px rgba(0,0,0,0.25)"}}>›</button>}
          {/* Close */}
          <button onClick={()=>{setBookOpen(false);setJournalSection(null);}} style={{position:"absolute",top:-16,right:-16,width:34,height:34,borderRadius:"50%",background:"rgba(26,22,18,0.88)",border:"1px solid rgba(201,169,110,0.2)",color:"rgba(255,248,232,0.6)",fontSize:"0.8rem",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",zIndex:10,transition:"all .2s",boxShadow:"0 2px 12px rgba(0,0,0,0.35)"}} onMouseEnter={e=>{e.currentTarget.style.background="rgba(201,169,110,0.25)";e.currentTarget.style.color="#FFF8E8";}} onMouseLeave={e=>{e.currentTarget.style.background="rgba(26,22,18,0.88)";e.currentTarget.style.color="rgba(255,248,232,0.6)";}}>✕</button>
        </div>
      </div>}

      {/* ═══ WALK-TO-JOURNAL ZOOM ANIMATION ═══ */}
      {journalZoom&&(
        <div style={{position:"fixed",inset:0,zIndex:9998,overflow:"hidden",pointerEvents:"all"}}>
          {/* Cabin zooms toward the desk/book area (upper-right) */}
          <div style={{position:"absolute",inset:0,transformOrigin:"85% 36%",animation:"walkToJournalZoom 1.4s cubic-bezier(0.4,0,0.2,1) forwards"}}>
            <img src={CABIN_FALLBACK_IMAGE} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} draggable={false}/>
            {/* Warm lamp glow intensifies on the desk during zoom */}
            <div style={{position:"absolute",right:"6%",top:"26%",width:"22%",height:"20%",borderRadius:"45%",background:"radial-gradient(ellipse at 50% 50%,rgba(255,215,130,0.35) 0%,rgba(255,190,90,0.12) 45%,transparent 72%)",mixBlendMode:"screen"}}/>
          </div>
          {/* Journal desk image cross-fades in as cabin darkens */}
          <div style={{position:"fixed",inset:0,animation:"journalDeskReveal 0.6s 0.8s ease both"}}>
            <img src="/journalondesk.png" alt="" style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"center 40%"}} draggable={false}/>
            {/* Warm candlelight glow overlay */}
            <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 50% 45%,rgba(255,200,100,0.08) 0%,transparent 60%)",mixBlendMode:"screen",pointerEvents:"none"}}/>
          </div>
          {/* Dark vignette during transition */}
          <div style={{position:"fixed",inset:0,background:"#0A0806",animation:"walkToJournalVignette 1.4s cubic-bezier(0.4,0,0.2,1) forwards"}}/>
        </div>
      )}

      {/* ═══ SPACE TRANSITION OVERLAY ═══ */}
      {spaceTransit&&<div style={{position:"fixed",inset:0,zIndex:9999,background:"#0A0806",display:"flex",alignItems:"center",justifyContent:"center",animation:"spaceFadeIn .5s ease"}}>
        <div style={{textAlign:"center",animation:"fadeUp .6s .15s ease both"}}>
          <div style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"1.05rem",color:"rgba(255,248,232,0.5)",letterSpacing:"0.04em"}}>{transitDir==="toHall"?"Stepping into The Upper Room...":transitDir==="toGarden"?"Walking to the garden...":"Returning to the cabin..."}</div>
        </div>
      </div>}
      <MapHudButton/>
    </div>
  );

  /* ══ JOURNAL ══════════════════════════════════════ */
  if(screen==="journal"&&activeRoom){
    const t=th(activeRoom.id),light=t.light;
    return(
      <div style={{minHeight:"100vh",background:typeof t.bg==="string"&&t.bg.includes("gradient")?t.bg:t.bg,color:light?t.text:t.text,fontFamily:SANS,position:"relative"}}>
        <style>{GFONTS}{CSS}</style>
        <div style={{position:"absolute",inset:0,background:`radial-gradient(ellipse at 50% 30%,${t.glow} 0%,transparent 65%)`,pointerEvents:"none"}}/>
        {activeRoom.id==="singleness"&&<Stars/>}
        <RoomGlow id={activeRoom.id}/>
        <header style={{position:"relative",zIndex:10,background:"rgba(0,0,0,0.22)",backdropFilter:"blur(8px)",padding:"0 22px",height:"50px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${t.border}`}}>
          <button onClick={()=>setScreen(prevScreen)} style={{background:"transparent",border:"none",cursor:"pointer",color:t.sub,fontSize:"0.8rem",fontFamily:SANS,padding:0}}>← Back</button>
          <span style={{fontFamily:SERIF,fontStyle:"italic",color:t.accent,fontSize:"0.88rem"}}>{activeRoom.emoji} {activeRoom.label}</span>
          <span style={{fontSize:"0.7rem",color:t.accent,fontFamily:SANS,fontWeight:500}}>Day {activeDay+1}/{activeRoom.days.length}</span>
        </header>
        <div style={{height:"2px",background:"rgba(255,255,255,0.07)",display:"flex",position:"relative",zIndex:10}}>
          {activeRoom.days?.map((_,i)=><div key={i} style={{flex:1,background:i<=activeDay?t.accent:"transparent"}}/>)}
        </div>
        <main style={{maxWidth:"640px",margin:"0 auto",padding:"36px 22px 80px",position:"relative",zIndex:5}}>
          <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"26px"}}>
            <div style={{width:"22px",height:"2px",background:t.accent}}/><span style={{fontSize:"0.66rem",fontFamily:SANS,fontWeight:600,letterSpacing:"0.14em",color:t.sub,textTransform:"uppercase",opacity:.8}}>{activeRoom.label} · Day {activeDay+1}</span>
          </div>
          {/* Step 0 */}
          <div className="fu" style={{marginBottom:"22px"}}>
            <div style={{fontSize:"0.66rem",fontFamily:SANS,fontWeight:600,letterSpacing:"0.14em",color:t.sub,textTransform:"uppercase",marginBottom:"10px",opacity:.7}}>Reflection question</div>
            <h2 style={{fontFamily:SERIF,fontSize:"1.42rem",fontWeight:400,color:t.text,margin:"0 0 7px",lineHeight:1.45}}>{activeRoom.days[activeDay].q}</h2>
            <p style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.86rem",color:t.sub,margin:"0 0 14px",lineHeight:1.65,opacity:.8}}>{activeRoom.days[activeDay].hint}</p>
            <div style={{background:"rgba(255,255,255,0.05)",border:`1px solid ${t.border}`,borderRadius:"12px",overflow:"hidden",backdropFilter:"blur(4px)"}}>
              <textarea value={jTexts[0]} onChange={e=>setJTexts(tx=>{const n=[...tx];n[0]=e.target.value;return n;})} placeholder="Begin here. This space is only for you…" style={{width:"100%",background:"transparent",border:"none",minHeight:"190px",lineHeight:"1.9",fontSize:"1rem",fontFamily:SERIF,padding:"18px",color:t.text,boxSizing:"border-box"}}/>
              <div style={{padding:"10px 16px",borderTop:`1px solid ${t.border}`,background:"rgba(0,0,0,0.1)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:"0.68rem",color:t.sub,opacity:.55}}>{wc(jTexts[0])>0?`${wc(jTexts[0])} words`:""}</span>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  {savedVerses.length>0&&<button onClick={()=>setVerseImportPicker(true)} style={{background:"transparent",border:`1px solid ${t.border}`,color:t.sub,padding:"5px 13px",borderRadius:"6px",cursor:"pointer",fontSize:"0.73rem",fontFamily:SANS,opacity:0.7,transition:"all 0.2s"}} onMouseEnter={e=>{e.target.style.borderColor=t.accent;e.target.style.color=t.accent;e.target.style.opacity="1";}} onMouseLeave={e=>{e.target.style.borderColor=t.border;e.target.style.color=t.sub;e.target.style.opacity="0.7";}}>+ Verse</button>}
                  {jTexts[0].trim()&&journalStep===0&&<button onClick={()=>setJournalStep(1)} style={{background:"transparent",border:`1px solid ${t.border}`,color:t.sub,padding:"5px 13px",borderRadius:"6px",cursor:"pointer",fontSize:"0.73rem",fontFamily:SANS}} onMouseEnter={e=>{e.target.style.borderColor=t.accent;e.target.style.color=t.accent;}} onMouseLeave={e=>{e.target.style.borderColor=t.border;e.target.style.color=t.sub;}}>Go deeper ↓</button>}
                </div>
              </div>
            </div>
          </div>
          {/* Step 1 */}
          {journalStep>=1&&<div className="fu" style={{marginBottom:"22px"}}>
            <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"10px"}}><div style={{flex:1,height:"1px",background:t.border,opacity:.5}}/><span style={{fontSize:"0.64rem",fontFamily:SANS,fontWeight:600,letterSpacing:"0.14em",color:t.sub,textTransform:"uppercase",whiteSpace:"nowrap",opacity:.7}}>Going deeper</span><div style={{flex:1,height:"1px",background:t.border,opacity:.5}}/></div>
            <p style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"1.08rem",color:t.text,margin:"0 0 12px",lineHeight:1.55}}>What's underneath what you just wrote?</p>
            <div style={{background:"rgba(255,255,255,0.05)",border:`1px solid ${t.border}`,borderRadius:"12px",overflow:"hidden",backdropFilter:"blur(4px)"}}>
              <textarea value={jTexts[1]} onChange={e=>setJTexts(tx=>{const n=[...tx];n[1]=e.target.value;return n;})} placeholder="Don't stop at the surface…" style={{width:"100%",background:"transparent",border:"none",minHeight:"130px",lineHeight:"1.9",fontSize:"1rem",fontFamily:SERIF,padding:"16px",color:t.text,boxSizing:"border-box"}}/>
              <div style={{padding:"8px 16px",borderTop:`1px solid ${t.border}`,background:"rgba(0,0,0,0.1)",display:"flex",justifyContent:"flex-end"}}>
                {jTexts[1].trim()&&journalStep===1&&<button onClick={()=>setJournalStep(2)} style={{background:"transparent",border:`1px solid ${t.border}`,color:t.sub,padding:"5px 13px",borderRadius:"6px",cursor:"pointer",fontSize:"0.73rem",fontFamily:SANS}} onMouseEnter={e=>{e.target.style.borderColor=t.accent;e.target.style.color=t.accent;}} onMouseLeave={e=>{e.target.style.borderColor=t.border;e.target.style.color=t.sub;}}>One more layer ↓</button>}
              </div>
            </div>
          </div>}
          {/* Step 2 */}
          {journalStep>=2&&<div className="fu" style={{marginBottom:"22px"}}>
            <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"10px"}}><div style={{flex:1,height:"1px",background:t.border,opacity:.5}}/><span style={{fontSize:"0.64rem",fontFamily:SANS,fontWeight:600,letterSpacing:"0.14em",color:t.sub,textTransform:"uppercase",whiteSpace:"nowrap",opacity:.7}}>The root</span><div style={{flex:1,height:"1px",background:t.border,opacity:.5}}/></div>
            <p style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"1.08rem",color:t.text,margin:"0 0 12px",lineHeight:1.55}}>What belief about yourself or God sits beneath all of this?</p>
            <div style={{background:"rgba(255,255,255,0.05)",border:`1px solid ${t.border}`,borderRadius:"12px",overflow:"hidden",backdropFilter:"blur(4px)"}}>
              <textarea value={jTexts[2]} onChange={e=>setJTexts(tx=>{const n=[...tx];n[2]=e.target.value;return n;})} placeholder="This is the root. Sit with it gently…" style={{width:"100%",background:"transparent",border:"none",minHeight:"110px",lineHeight:"1.9",fontSize:"1rem",fontFamily:SERIF,padding:"16px",color:t.text,boxSizing:"border-box"}}/>
            </div>
          </div>}
          {/* Save bar */}
          {jTexts[0].trim()&&<div className="fu" style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"13px 17px",background:"rgba(0,0,0,0.2)",borderRadius:"10px",border:`1px solid ${t.border}`,backdropFilter:"blur(4px)",flexWrap:"wrap",gap:"10px"}}>
            <div>{saveMsg?<span style={{fontSize:"0.78rem",color:t.accent,fontWeight:600}}>{saveMsg}</span>:<span style={{fontSize:"0.73rem",color:t.sub,opacity:.6}}>{jTexts.filter(Boolean).reduce((s,tx)=>s+wc(tx),0)} words</span>}</div>
            <div style={{display:"flex",gap:"8px"}}>
              <button onClick={()=>{setCardQ(jTexts[0].trim().split(/[.!?]/)[0].trim().slice(0,80));setIsCustomCard(true);setCardCustom(jTexts[0].trim().split(/[.!?]/)[0].trim().slice(0,80));setScreen("cards");}} style={{background:"transparent",border:`1px solid ${t.border}`,color:t.sub,padding:"8px 13px",borderRadius:"7px",cursor:"pointer",fontSize:"0.75rem",fontFamily:SANS}}>✦ Make card</button>
              <button onClick={saveEntry} style={{background:t.accent,border:"none",color:"#1A1612",padding:"8px 22px",borderRadius:"7px",cursor:"pointer",fontSize:"0.82rem",fontFamily:SANS,fontWeight:700}}>Save →</button>
            </div>
          </div>}
        </main>
        {/* ── VERSE IMPORT PICKER ── */}
        {verseImportPicker&&(
          <div onClick={e=>{if(e.target===e.currentTarget)setVerseImportPicker(false);}} style={{position:"fixed",inset:0,zIndex:500,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"flex-end",justifyContent:"center",animation:"overlayFadeIn .2s ease both"}}>
            <div style={{background:"#1A1612",borderRadius:"20px 20px 0 0",width:"100%",maxWidth:500,maxHeight:"60vh",display:"flex",flexDirection:"column",animation:"panelSlideUp .3s ease both"}}>
              <div style={{padding:"16px 20px",borderBottom:"1px solid rgba(201,169,110,0.12)",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
                <span style={{fontFamily:SERIF,fontStyle:"italic",color:t.text,fontSize:"0.92rem"}}>Insert a saved verse</span>
                <button onClick={()=>setVerseImportPicker(false)} style={{background:"transparent",border:"none",cursor:"pointer",color:t.sub,fontSize:"1.1rem",lineHeight:1}}>x</button>
              </div>
              <div style={{overflowY:"auto",WebkitOverflowScrolling:"touch",padding:"12px 16px 24px",flex:1}}>
                {savedVerses.length===0&&(
                  <div style={{textAlign:"center",padding:"32px 0"}}>
                    <p style={{fontFamily:SERIF,fontStyle:"italic",color:t.sub,fontSize:"0.88rem",opacity:0.5}}>No saved verses yet</p>
                    <p style={{fontFamily:SANS,fontSize:"0.72rem",color:t.sub,opacity:0.3,marginTop:6}}>Save verses from the Bible in the Upper Room</p>
                  </div>
                )}
                {savedVerses.map(v=>(
                  <button key={v.id} onClick={()=>insertVerseIntoJournal(v)} style={{width:"100%",textAlign:"left",background:"rgba(255,255,255,0.03)",border:`1px solid ${t.border}`,borderRadius:10,padding:"14px 16px",marginBottom:8,cursor:"pointer",transition:"all 0.2s"}} onMouseEnter={e=>e.currentTarget.style.borderColor=t.accent} onMouseLeave={e=>e.currentTarget.style.borderColor=t.border}>
                    <p style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.85rem",color:t.text,margin:"0 0 4px",lineHeight:1.6,opacity:0.7,overflow:"hidden",textOverflow:"ellipsis",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>"{v.text}"</p>
                    <p style={{fontFamily:SANS,fontSize:"0.7rem",color:t.sub,margin:0,opacity:0.5}}>-- {v.ref}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        <MapHudButton/>
      </div>
    );
  }

  /* ══ JESUS ROOM ═══════════════════════════════════ */
  if(screen==="jesus"){
    const t=th("jesus"),jq=JESUS_QUESTIONS[jesusIdx];
    return(
      <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#1A1208,#2A1E08)",color:"#FFF8E8",fontFamily:SANS,position:"relative"}}>
        <style>{GFONTS}{CSS}</style>
        <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 50% 25%,rgba(212,180,100,0.09) 0%,transparent 60%)",pointerEvents:"none"}}/>
        <RoomGlow id="jesus"/>
        <header style={{position:"relative",zIndex:10,background:"rgba(0,0,0,0.25)",backdropFilter:"blur(8px)",padding:"0 22px",height:"50px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${t.border}`}}>
          <button onClick={()=>setScreen("cabin")} style={{background:"transparent",border:"none",cursor:"pointer",color:"rgba(255,248,232,0.4)",fontSize:"0.8rem",fontFamily:SANS,padding:0}}>← Back</button>
          <span style={{fontFamily:SERIF,fontStyle:"italic",color:"#D4B464",fontSize:"0.88rem"}}>✝️ Questions Jesus Asked</span>
          <span style={{fontSize:"0.7rem",color:"#D4B464",fontFamily:SANS}}>{jesusIdx+1}/{JESUS_QUESTIONS.length}</span>
        </header>
        <main style={{maxWidth:"660px",margin:"0 auto",padding:"38px 22px 80px",position:"relative",zIndex:5}}>
          <div style={{display:"flex",gap:"4px",marginBottom:"32px",flexWrap:"wrap",maxWidth:"340px"}}>
            {JESUS_QUESTIONS.map((_,i)=><div key={i} onClick={()=>{setJesusIdx(i);setJesusText("");setJesusSaved(false);}} style={{width:"9px",height:"9px",borderRadius:"50%",background:i===jesusIdx?"#D4B464":i<jesusIdx?"rgba(212,180,100,0.4)":"rgba(255,255,255,0.12)",cursor:"pointer",transition:"all 0.2s"}}/>)}
          </div>
          <div style={{marginBottom:"6px",fontSize:"0.7rem",fontFamily:SANS,color:"rgba(212,180,100,0.5)",letterSpacing:"0.1em"}}>{jq.ref}</div>
          <blockquote style={{fontFamily:SERIF,fontSize:"1.42rem",fontWeight:400,color:"#FFF8E8",margin:"0 0 6px",lineHeight:1.5,borderLeft:"2px solid rgba(212,180,100,0.4)",paddingLeft:"18px",fontStyle:"italic"}}>"{jq.q}"</blockquote>
          <div style={{height:"1px",background:"rgba(212,180,100,0.14)",margin:"22px 0"}}/>
          <div style={{marginBottom:"5px",fontSize:"0.66rem",fontFamily:SANS,color:"rgba(212,180,100,0.5)",letterSpacing:"0.12em",textTransform:"uppercase"}}>Applied to your life today</div>
          <p style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"1.08rem",color:"rgba(255,248,232,0.72)",margin:"0 0 22px",lineHeight:1.65}}>{jq.app}</p>
          <div style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${t.border}`,borderRadius:"12px",overflow:"hidden",backdropFilter:"blur(4px)",marginBottom:"16px"}}>
            <textarea value={jesusText} onChange={e=>{setJesusText(e.target.value);setJesusSaved(false);}} placeholder="Write your honest response here…" style={{width:"100%",background:"transparent",border:"none",minHeight:"170px",lineHeight:"1.9",fontSize:"1rem",fontFamily:SERIF,padding:"18px",color:"#FFF8E8",boxSizing:"border-box"}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"10px"}}>
            <div style={{display:"flex",gap:"8px"}}>
              <button onClick={()=>{setJesusIdx(i=>Math.max(0,i-1));setJesusText("");setJesusSaved(false);}} disabled={jesusIdx===0} style={{background:"transparent",border:`1px solid ${t.border}`,color:"rgba(255,248,232,0.35)",padding:"9px 18px",borderRadius:"7px",cursor:jesusIdx===0?"default":"pointer",fontSize:"0.78rem",fontFamily:SANS,opacity:jesusIdx===0?.3:1}}>← Prev</button>
              <button onClick={()=>{setJesusIdx(i=>Math.min(JESUS_QUESTIONS.length-1,i+1));setJesusText("");setJesusSaved(false);}} disabled={jesusIdx===JESUS_QUESTIONS.length-1} style={{background:"transparent",border:`1px solid ${t.border}`,color:"rgba(255,248,232,0.35)",padding:"9px 18px",borderRadius:"7px",cursor:jesusIdx===JESUS_QUESTIONS.length-1?"default":"pointer",fontSize:"0.78rem",fontFamily:SANS,opacity:jesusIdx===JESUS_QUESTIONS.length-1?.3:1}}>Next →</button>
            </div>
            {jesusText.trim()&&(
              <div style={{display:"flex",gap:"8px"}}>
                {jesusSaved&&<span style={{fontSize:"0.78rem",color:"#D4B464",fontWeight:600,alignSelf:"center"}}>✓ Saved</span>}
                <button onClick={()=>{const e={id:Date.now().toString(),date:todayStr(),roomId:"jesus",roomLabel:"Questions Jesus Asked",roomEmoji:"✝️",day:jesusIdx,prompt:jq.app,text:jesusText.trim(),words:wc(jesusText)};persistEntries([e,...entries]);addCandles(3,"Reflection saved +3 🕯️");setJesusSaved(true);}} style={{background:"#D4B464",border:"none",color:"#1A1208",padding:"9px 22px",borderRadius:"7px",cursor:"pointer",fontSize:"0.82rem",fontFamily:SANS,fontWeight:700}}>Save reflection →</button>
              </div>
            )}
          </div>
        </main>
        <MapHudButton/>
      </div>
    );
  }

  /* ══ CARD ENGINE ══════════════════════════════════ */
  if(screen==="cards") return(
    <div style={{minHeight:"100vh",background:B.beige,color:B.ink,fontFamily:SANS}}>
      <style>{GFONTS}{CSS}</style>
      <DarkHeader title="✦ Shareable Question Cards" onBack={()=>setScreen("cabin")}
        extra={<div style={{display:"flex",gap:"4px"}}>{[["create","Create"],["saved","Saved"],["library","Library"]].map(([id,lb])=><button key={id} onClick={()=>setCardTab(id)} style={{background:cardTab===id?"rgba(201,169,110,0.15)":"transparent",border:`1px solid ${cardTab===id?"rgba(201,169,110,0.35)":"transparent"}`,color:cardTab===id?B.gold:"rgba(180,165,148,0.45)",padding:"6px 14px",borderRadius:"6px",cursor:"pointer",fontSize:"0.76rem",fontFamily:SANS,fontWeight:cardTab===id?600:400,transition:"all 0.15s"}}>{lb}</button>)}</div>}
      />
      <main style={{maxWidth:"1050px",margin:"0 auto",padding:"28px 22px 80px"}}>

        {/* ── CREATE ── */}
        {cardTab==="create"&&(
          <div style={{display:"grid",gridTemplateColumns:"1fr minmax(260px,380px)",gap:"24px",alignItems:"start"}}>
            {/* Controls */}
            <div>
              <UILabel>Category</UILabel>
              <div style={{display:"flex",gap:"6px",flexWrap:"wrap",marginBottom:"18px"}}>
                <PillBtn active={cardSet==="all"} onClick={()=>{setCardSet("all");randomCardQ("all");}}>✦ All</PillBtn>
                {Object.entries(QUESTION_SETS).map(([id,s])=><PillBtn key={id} active={cardSet===id} color={s.color} onClick={()=>{setCardSet(id);randomCardQ(id);}}>{s.emoji} {s.label}</PillBtn>)}
              </div>
              <UILabel>Current question</UILabel>
              <div style={{background:B.white,border:`1px solid ${B.beigeD}`,borderRadius:"12px",padding:"18px 20px",marginBottom:"16px",boxShadow:"0 1px 8px rgba(0,0,0,0.04)"}}>
                <p style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"1.15rem",color:B.ink,margin:"0 0 14px",lineHeight:1.65}}>"{displayCardQ}"</p>
                <button onClick={()=>randomCardQ(cardSet)} style={{background:"transparent",border:`1px solid ${B.beigeD}`,color:B.inkL,padding:"7px 16px",borderRadius:"7px",cursor:"pointer",fontSize:"0.78rem",fontFamily:SANS,transition:"all 0.15s",display:"flex",alignItems:"center",gap:"6px"}} onMouseEnter={e=>e.currentTarget.style.borderColor=B.sageD} onMouseLeave={e=>e.currentTarget.style.borderColor=B.beigeD}><span>↻</span> New question</button>
              </div>
              <UILabel>Or write your own</UILabel>
              <div style={{background:B.white,border:`1px solid ${B.beigeD}`,borderRadius:"12px",padding:"14px",marginBottom:"16px",boxShadow:"0 1px 8px rgba(0,0,0,0.04)"}}>
                <textarea value={cardCustom} onChange={e=>setCardCustom(e.target.value)} placeholder="Type a custom question or insight from your journal…" style={{width:"100%",background:B.beige,border:`1px solid ${B.beigeD}`,borderRadius:"8px",color:B.ink,fontSize:"0.92rem",fontFamily:SERIF,padding:"11px 13px",minHeight:"70px",boxSizing:"border-box",fontStyle:"italic",lineHeight:1.7,marginBottom:"9px",transition:"border-color 0.2s"}} onFocus={e=>e.target.style.borderColor=B.sageD} onBlur={e=>e.target.style.borderColor=B.beigeD}/>
                <button onClick={()=>{if(cardCustom.trim()){setIsCustomCard(true);}}} disabled={!cardCustom.trim()} style={{background:cardCustom.trim()?B.sageDk:"transparent",border:`1px solid ${cardCustom.trim()?B.sageDk:B.beigeD}`,color:cardCustom.trim()?"#fff":B.inkLL,padding:"7px 16px",borderRadius:"7px",cursor:cardCustom.trim()?"pointer":"default",fontSize:"0.78rem",fontFamily:SANS,fontWeight:600,transition:"all 0.2s"}}>Use this question</button>
              </div>
              <UILabel>Background style</UILabel>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"7px",marginBottom:"16px"}}>
                {CARD_THEMES.map(t=><div key={t.id} onClick={()=>setCardTheme(t)} style={{borderRadius:"9px",overflow:"hidden",cursor:"pointer",border:`2px solid ${cardTheme.id===t.id?B.gold:"transparent"}`,transition:"all 0.15s",boxShadow:cardTheme.id===t.id?"0 0 0 2px rgba(201,169,110,0.3)":"none"}}><div style={{height:"36px",background:t.preview}}/><div style={{background:B.white,padding:"3px 5px",fontSize:"0.63rem",color:cardTheme.id===t.id?B.ink:B.inkL,fontFamily:SANS,fontWeight:cardTheme.id===t.id?600:400,textAlign:"center"}}>{t.label}</div></div>)}
              </div>
              <UILabel>Format</UILabel>
              <div style={{display:"flex",gap:"8px",marginBottom:"20px"}}>
                {CARD_RATIOS.map(r=><button key={r.id} onClick={()=>setCardRatio(r)} style={{flex:1,background:cardRatio.id===r.id?B.night:B.white,border:`1px solid ${cardRatio.id===r.id?B.night:B.beigeD}`,color:cardRatio.id===r.id?B.goldL:B.inkM,padding:"9px 7px",borderRadius:"9px",cursor:"pointer",fontSize:"0.76rem",fontFamily:SANS,fontWeight:500,transition:"all 0.2s",textAlign:"center"}}><div style={{fontSize:"1.1rem",marginBottom:"3px"}}>{r.icon}</div><div style={{fontWeight:600}}>{r.label}</div><div style={{fontSize:"0.6rem",opacity:.6,marginTop:"2px"}}>{r.desc}</div></button>)}
              </div>
              <div style={{display:"flex",gap:"9px",flexWrap:"wrap",alignItems:"center",marginBottom:"14px"}}>
                <button onClick={downloadCard} disabled={cardGenerating} style={{background:B.night,border:"none",color:B.goldL,padding:"12px 26px",borderRadius:"10px",cursor:cardGenerating?"default":"pointer",fontSize:"0.85rem",fontFamily:SANS,fontWeight:700,letterSpacing:"0.04em",display:"flex",alignItems:"center",gap:"7px",opacity:cardGenerating?.7:1}}>
                  {cardGenerating?<><span style={{display:"inline-block",animation:"spin 0.8s linear infinite"}}>⟳</span> Generating…</>:<>⬇ Download</>}
                </button>
                <button onClick={copyCard} style={{background:"transparent",border:`1px solid ${B.gold}`,color:B.gold,padding:"11px 20px",borderRadius:"10px",cursor:"pointer",fontSize:"0.83rem",fontFamily:SANS,fontWeight:600,transition:"all 0.2s"}} onMouseEnter={e=>{e.target.style.background=B.gold;e.target.style.color=B.night;}} onMouseLeave={e=>{e.target.style.background="transparent";e.target.style.color=B.gold;}}>{copied?"✓ Copied!":"📋 Copy"}</button>
              </div>
              {cardGenMsg&&<div style={{fontSize:"0.8rem",color:B.sageDk,fontWeight:600,marginBottom:"12px"}}>{cardGenMsg}</div>}
              {/* Share tips */}
              <div style={{padding:"14px 16px",background:B.white,borderRadius:"10px",border:`1px solid ${B.beigeD}`,boxShadow:"0 1px 6px rgba(0,0,0,0.04)"}}>
                <div style={{fontSize:"0.68rem",fontWeight:600,letterSpacing:"0.1em",color:B.inkLL,textTransform:"uppercase",marginBottom:"9px"}}>Share tips</div>
                {[["📸","Instagram","Story format → New Story → upload. Caption with the question + 'link in bio'"],["🎵","TikTok","Green screen effect → use card as background → answer the question on camera"],["🐦","X/Twitter","Wide format → attach to tweet with the question as your text. Drives replies"],].map(s=><div key={s[1]} style={{display:"flex",gap:"9px",marginBottom:"7px",alignItems:"flex-start"}}><span style={{fontSize:"0.9rem",flexShrink:0}}>{s[0]}</span><div><span style={{fontSize:"0.78rem",fontWeight:600,color:B.ink}}>{s[1]}: </span><span style={{fontSize:"0.76rem",color:B.inkL,lineHeight:1.5}}>{s[2]}</span></div></div>)}
              </div>
            </div>
            {/* Preview */}
            <div style={{position:"sticky",top:"72px"}}>
              <UILabel>Live preview</UILabel>
              <div style={{background:B.white,borderRadius:"14px",padding:"22px",border:`1px solid ${B.beigeD}`,boxShadow:"0 2px 18px rgba(0,0,0,0.06)",display:"flex",flexDirection:"column",alignItems:"center",gap:"14px"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"300px",width:"100%"}}>
                  <CardPreview question={displayCardQ} theme={cardTheme} ratio={cardRatio} scale={cardRatio.id==="wide"?.92:cardRatio.id==="story"?.82:1}/>
                </div>
                <div style={{display:"flex",gap:"5px",justifyContent:"center",flexWrap:"wrap"}}>
                  {CARD_THEMES.map(t=><div key={t.id} onClick={()=>setCardTheme(t)} style={{width:"24px",height:"24px",borderRadius:"50%",background:t.preview,cursor:"pointer",border:`2px solid ${cardTheme.id===t.id?B.gold:"transparent"}`,transition:"all 0.15s"}} title={t.label}/>)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── SAVED CARDS ── */}
        {cardTab==="saved"&&(
          <div>
            <p style={{color:B.inkL,fontSize:"0.85rem",marginBottom:"20px",margin:"0 0 20px"}}>Your generated cards — click any to re-edit.</p>
            {savedCards.length===0?(
              <div style={{background:B.white,borderRadius:"12px",padding:"48px 32px",textAlign:"center",border:`1px solid ${B.beigeD}`}}><div style={{fontSize:"1.8rem",marginBottom:"12px"}}>🎨</div><p style={{fontFamily:SERIF,fontStyle:"italic",color:B.inkL,margin:"0 0 18px"}}>No cards yet. Create your first one.</p><button onClick={()=>setCardTab("create")} style={{background:B.night,border:"none",color:B.goldL,padding:"11px 26px",borderRadius:"8px",cursor:"pointer",fontSize:"0.83rem",fontFamily:SANS,fontWeight:600}}>Create a Card →</button></div>
            ):(
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:"12px"}}>
                {savedCards.map((card,i)=>{
                  const ct=CARD_THEMES.find(t=>t.id===card.themeId)||CARD_THEMES[0];
                  const cr=CARD_RATIOS.find(r=>r.id===card.ratioId)||CARD_RATIOS[0];
                  return(<div key={card.id} style={{background:B.white,borderRadius:"12px",overflow:"hidden",border:`1px solid ${B.beigeD}`,boxShadow:"0 1px 8px rgba(0,0,0,0.05)",animation:`fadeUp .4s ${i*.04}s ease both`}}>
                    <div style={{padding:"14px",display:"flex",alignItems:"center",justifyContent:"center",background:B.beige,minHeight:"100px"}}><CardPreview question={card.question} theme={ct} ratio={cr} scale={.5}/></div>
                    <div style={{padding:"13px 15px"}}><p style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.88rem",color:B.ink,margin:"0 0 8px",lineHeight:1.5}}>"{card.question}"</p><div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}><span style={{fontSize:"0.67rem",color:B.inkLL}}>{card.date}</span><button onClick={()=>{setCardQ(card.question);setCardTheme(ct);setCardRatio(cr);setIsCustomCard(false);setCardTab("create");}} style={{background:"transparent",border:`1px solid ${B.beigeD}`,color:B.inkL,padding:"4px 11px",borderRadius:"6px",cursor:"pointer",fontSize:"0.7rem",fontFamily:SANS,transition:"all 0.15s"}} onMouseEnter={e=>e.target.style.borderColor=B.sageD} onMouseLeave={e=>e.target.style.borderColor=B.beigeD}>Edit →</button></div></div>
                  </div>);
                })}
              </div>
            )}
          </div>
        )}

        {/* ── QUESTION LIBRARY ── */}
        {cardTab==="library"&&(
          <div>
            <div style={{position:"relative",marginBottom:"18px"}}>
              <span style={{position:"absolute",left:"13px",top:"50%",transform:"translateY(-50%)",color:B.inkLL,fontSize:"0.88rem"}}>🔍</span>
              <input placeholder="Search questions…" style={{width:"100%",background:B.white,border:`1px solid ${B.beigeD}`,borderRadius:"9px",color:B.ink,fontSize:"0.88rem",fontFamily:SANS,padding:"10px 13px 10px 38px",boxSizing:"border-box",boxShadow:"0 1px 6px rgba(0,0,0,0.04)",transition:"border-color 0.2s"}} onFocus={e=>e.target.style.borderColor=B.sageD} onBlur={e=>e.target.style.borderColor=B.beigeD}/>
            </div>
            {Object.entries(QUESTION_SETS).map(([sid,set])=>(
              <div key={sid} style={{marginBottom:"22px"}}>
                <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"9px"}}><div style={{width:"10px",height:"10px",borderRadius:"50%",background:set.color}}/><span style={{fontSize:"0.68rem",fontFamily:SANS,fontWeight:600,letterSpacing:"0.12em",color:B.inkL,textTransform:"uppercase"}}>{set.emoji} {set.label}</span><div style={{flex:1,height:"1px",background:B.beigeD}}/></div>
                <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
                  {set.questions.map((q,i)=><div key={i} onClick={()=>{setCardQ(q);setIsCustomCard(false);setCardSet(sid);setCardTab("create");}} style={{background:B.white,border:`1px solid ${B.beigeD}`,borderRadius:"9px",padding:"11px 16px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",gap:"10px",transition:"all 0.15s",boxShadow:"0 1px 4px rgba(0,0,0,0.03)"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=set.color;e.currentTarget.style.transform="translateX(3px)";}} onMouseLeave={e=>{e.currentTarget.style.borderColor=B.beigeD;e.currentTarget.style.transform="none";}}><p style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.97rem",color:B.ink,margin:0,lineHeight:1.5,flex:1}}>{q}</p><span style={{color:B.inkLL,fontSize:"0.77rem",flexShrink:0,fontFamily:SANS}}>Use →</span></div>)}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <MapHudButton/>
    </div>
  );

  /* ══ THE UPPER ROOM HALL (Community) ═══════════════ */
  if(screen==="hall"||screen==="community") return(
    <div style={{position:"fixed",inset:0,overflow:"hidden",fontFamily:SANS}}>
      <style>{GFONTS}{CSS}</style>
      {/* BG fallback */}
      <div style={{position:"absolute",inset:0,background:"linear-gradient(160deg,#1A1208 0%,#2C1F14 40%,#1A1208 100%)",zIndex:0}}/>
      {/* BG image */}
      <div style={{position:"absolute",inset:0,backgroundImage:"url(/upper-room-hall.png)",backgroundSize:"cover",backgroundPosition:"center top",zIndex:1}}/>
      {/* Dark overlay */}
      <div style={{position:"absolute",inset:0,background:"linear-gradient(180deg,rgba(10,8,6,0.7) 0%,rgba(10,8,6,0.35) 30%,rgba(10,8,6,0.5) 70%,rgba(10,8,6,0.85) 100%)",zIndex:2,pointerEvents:"none"}}/>
      {/* Ambient */}
      <div style={{zIndex:3,pointerEvents:"none"}}><LightRays/><DustMotes/></div>

      {/* Scrollable content */}
      <div style={{position:"relative",zIndex:10,height:"100%",overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
        <div style={{maxWidth:720,margin:"0 auto",padding:"28px 22px 80px"}}>

          {/* Return to village map */}
          <button onClick={()=>setScreen("map")} style={{background:"rgba(26,22,18,0.5)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",border:"1px solid rgba(201,169,110,0.15)",borderRadius:999,padding:"8px 20px",cursor:"pointer",color:"rgba(255,248,232,0.6)",fontFamily:SANS,fontSize:"0.78rem",marginBottom:28,transition:"all 0.2s",display:"inline-flex",alignItems:"center",gap:6}}
            onMouseEnter={e=>{e.currentTarget.style.background="rgba(201,169,110,0.15)";e.currentTarget.style.color=B.goldL;}}
            onMouseLeave={e=>{e.currentTarget.style.background="rgba(26,22,18,0.5)";e.currentTarget.style.color="rgba(255,248,232,0.6)";}}>
            Back to village
          </button>

          {/* Title */}
          <div style={{textAlign:"center",marginBottom:32,animation:"fadeUp .6s ease both"}}>
            <h1 style={{fontFamily:DISPLAY,fontSize:"2rem",fontWeight:700,color:B.goldL,margin:"0 0 8px",textShadow:"0 2px 12px rgba(0,0,0,0.5)",letterSpacing:"0.02em"}}>The Upper Room Hall</h1>
            <p style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"1rem",color:"rgba(255,248,232,0.45)",margin:"0 0 14px"}}>Where we walk together.</p>
            <div style={{width:60,height:1,background:"rgba(201,169,110,0.3)",margin:"0 auto"}}/>
          </div>

          {/* Community room doors — 2-col grid */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12,marginBottom:36}}>
            {COMMUNITY_ROOMS.map((room,i)=>{
              const t=th(room.id);
              return(<div key={room.id} onClick={()=>enterRoom(room,"hall")} style={{background:"rgba(26,22,18,0.6)",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",border:"1px solid rgba(201,169,110,0.12)",borderRadius:"18px 18px 12px 12px",padding:"20px 16px 18px",cursor:"pointer",transition:"all 0.25s",position:"relative",overflow:"hidden",animation:`fadeUp .5s ${i*.08}s ease both`}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=t.accent;e.currentTarget.style.background="rgba(26,22,18,0.75)";}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(201,169,110,0.12)";e.currentTarget.style.background="rgba(26,22,18,0.6)";}}>
                <div style={{position:"absolute",top:0,left:"15%",right:"15%",height:3,borderRadius:"0 0 99px 99px",background:t.accent,opacity:.6}}/>
                <div style={{textAlign:"center"}}>
                  <div style={{fontSize:"1.5rem",marginBottom:8}}>{room.emoji}</div>
                  <div style={{fontFamily:SERIF,fontSize:"0.92rem",fontWeight:700,color:B.goldL,marginBottom:5}}>{room.label}</div>
                  <div style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.72rem",color:"rgba(255,248,232,0.35)",lineHeight:1.5}}>{room.question}</div>
                </div>
              </div>);
            })}
          </div>

          {/* ── PRAYER WALL ── */}
          <div style={{marginBottom:32}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
              <div style={{width:18,height:1,background:"rgba(201,169,110,0.25)"}}/>
              <span style={{fontSize:"0.65rem",fontFamily:SANS,fontWeight:600,letterSpacing:"0.14em",color:B.gold,textTransform:"uppercase"}}>Prayer Wall</span>
              <div style={{flex:1,height:1,background:"rgba(201,169,110,0.12)"}}/>
            </div>
            <div style={{background:"rgba(26,22,18,0.6)",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",border:"1px solid rgba(201,169,110,0.1)",borderRadius:12,padding:18,marginBottom:14}}>
              <textarea value={newPrayer} onChange={e=>setNewPrayer(e.target.value)} placeholder="Share what's on your heart…" style={{width:"100%",background:"rgba(255,248,232,0.04)",border:"1px solid rgba(201,169,110,0.1)",borderRadius:8,color:B.goldL,fontSize:"0.88rem",fontFamily:SERIF,padding:13,minHeight:70,boxSizing:"border-box",marginBottom:9,lineHeight:1.7,transition:"border-color 0.2s",resize:"vertical"}} onFocus={e=>e.target.style.borderColor="rgba(201,169,110,0.3)"} onBlur={e=>e.target.style.borderColor="rgba(201,169,110,0.1)"}/>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                <select value={prayerTag} onChange={e=>setPrayerTag(e.target.value)} style={{background:"rgba(255,248,232,0.04)",border:"1px solid rgba(201,169,110,0.1)",borderRadius:7,color:"rgba(255,248,232,0.5)",fontSize:"0.8rem",fontFamily:SANS,padding:"7px 11px",flex:1,minWidth:120}}>
                  <option value="">Tag a topic…</option>
                  {["Healing","Marriage","Singleness","Motherhood","Grief","Anxiety","Finances","Purpose","Forgiveness","Depression","Faith","Career"].map(t=><option key={t}>{t}</option>)}
                </select>
                <button onClick={postPrayer} disabled={!newPrayer.trim()} style={{background:newPrayer.trim()?"rgba(90,138,106,0.3)":"transparent",border:`1px solid ${newPrayer.trim()?"rgba(90,138,106,0.4)":"rgba(255,255,255,0.06)"}`,color:newPrayer.trim()?"#BED3C4":"rgba(255,255,255,0.2)",padding:"8px 20px",borderRadius:7,cursor:newPrayer.trim()?"pointer":"default",fontSize:"0.8rem",fontFamily:SANS,fontWeight:600,transition:"all 0.2s"}}>Post anonymously 🙏</button>
              </div>
            </div>
            <div style={{display:"flex",gap:6,marginBottom:10}}>
              {["active","answered","all"].map(f=>(
                <button key={f} onClick={()=>setPrayerFilter(f)} style={{background:prayerFilter===f?B.night:"transparent",border:`1px solid ${prayerFilter===f?"rgba(201,169,110,0.3)":"rgba(201,169,110,0.1)"}`,color:prayerFilter===f?B.goldL:"rgba(255,248,232,0.35)",padding:"4px 12px",borderRadius:99,fontSize:"0.68rem",fontFamily:SANS,fontWeight:600,cursor:"pointer",textTransform:"capitalize"}}>{f}</button>
              ))}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:9}}>
              {filteredPrayers.filter(p=>prayerFilter==="all"?true:prayerFilter==="answered"?p.status==="answered":p.status!=="answered").map(p=>(
                <div key={p.id} style={{background:"rgba(26,22,18,0.5)",backdropFilter:"blur(6px)",WebkitBackdropFilter:"blur(6px)",border:"1px solid "+(p.status==="answered"?"rgba(201,169,110,0.25)":"rgba(201,169,110,0.08)"),borderLeft:p.status==="answered"?"3px solid rgba(201,169,110,0.5)":"3px solid transparent",borderRadius:12,padding:"15px 17px",opacity:p.status==="answered"?0.7:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:7}}>
                    <span style={{fontSize:"0.6rem",background:"rgba(200,164,106,0.1)",color:B.gold,border:"1px solid rgba(200,164,106,0.2)",padding:"2px 8px",borderRadius:99,fontFamily:SANS,fontWeight:600}}>{p.tag}</span>
                    {p.status==="answered"&&<span style={{fontSize:"0.58rem",background:"rgba(201,169,110,0.15)",color:B.gold,padding:"2px 8px",borderRadius:99,fontFamily:SANS,fontWeight:600}}>✓ Answered</span>}
                    <span style={{fontSize:"0.66rem",color:"rgba(255,248,232,0.25)",fontFamily:SANS,marginLeft:"auto"}}>{p.date}</span>
                  </div>
                  <p style={{fontFamily:SERIF,fontSize:"0.92rem",color:"rgba(255,248,232,0.7)",margin:"0 0 10px",lineHeight:1.65}}>{p.text}</p>
                  <div style={{display:"flex",gap:8}}>
                    {prayedFor.includes(p.id)?(<span style={{background:"rgba(90,138,106,0.08)",border:"1px solid rgba(90,138,106,0.15)",color:"rgba(190,211,196,0.5)",padding:"5px 14px",borderRadius:7,fontSize:"0.74rem",fontFamily:SANS,fontWeight:600}}>🙏 Praying ({p.prayers})</span>):(<button onClick={()=>prayFor(p.id)} style={{background:"rgba(90,138,106,0.15)",border:"1px solid rgba(90,138,106,0.25)",color:"#BED3C4",padding:"5px 14px",borderRadius:7,cursor:"pointer",fontSize:"0.74rem",fontFamily:SANS,fontWeight:600,transition:"all 0.15s"}} onMouseEnter={e=>e.target.style.background="rgba(90,138,106,0.3)"} onMouseLeave={e=>e.target.style.background="rgba(90,138,106,0.15)"}>🙏 Pray ({p.prayers})</button>)}
                    {p.status==="answered"?
                      <button onClick={()=>reactivatePrayer(p.id)} style={{background:"transparent",border:"1px solid rgba(201,169,110,0.15)",color:"rgba(255,248,232,0.35)",padding:"5px 12px",borderRadius:7,cursor:"pointer",fontSize:"0.72rem",fontFamily:SANS,fontWeight:600}}>Reactivate</button>
                    :
                      <button onClick={()=>markPrayerAnswered(p.id)} style={{background:"rgba(201,169,110,0.1)",border:"1px solid rgba(201,169,110,0.2)",color:B.gold,padding:"5px 12px",borderRadius:7,cursor:"pointer",fontSize:"0.72rem",fontFamily:SANS,fontWeight:600,transition:"all 0.15s"}} onMouseEnter={e=>e.target.style.background="rgba(201,169,110,0.2)"} onMouseLeave={e=>e.target.style.background="rgba(201,169,110,0.1)"}>✓ Answered</button>
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── FIND OTHERS ── */}
          <div style={{background:"rgba(26,22,18,0.5)",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",border:"1px solid rgba(201,169,110,0.08)",borderRadius:12,padding:24,textAlign:"center"}}>
            <div style={{fontSize:"1.5rem",marginBottom:10}}>🌿</div>
            <h3 style={{fontFamily:SERIF,fontSize:"1.15rem",fontWeight:700,color:B.goldL,margin:"0 0 8px"}}>Find Your People</h3>
            <p style={{fontFamily:SERIF,fontStyle:"italic",color:"rgba(255,248,232,0.35)",fontSize:"0.86rem",margin:"0 0 16px",lineHeight:1.6}}>Connect with others walking through similar seasons.</p>
            <div style={{display:"flex",flexWrap:"wrap",gap:6,justifyContent:"center",marginBottom:16}}>
              {["Divorced","Single","New Moms","Grieving","Waiting","Healing","Empty Nesters","Faith"].map(tag=><span key={tag} style={{fontSize:"0.7rem",background:"rgba(200,164,106,0.08)",color:B.gold,border:"1px solid rgba(200,164,106,0.15)",padding:"4px 12px",borderRadius:99,fontFamily:SANS}}>{tag}</span>)}
            </div>
            <p style={{fontSize:"0.72rem",color:"rgba(255,248,232,0.2)",fontFamily:SANS,lineHeight:1.6,margin:0}}>Full matching coming in the app launch. 💛</p>
          </div>
        </div>
      </div>

      {/* Transition overlay */}
      {spaceTransit&&<div style={{position:"fixed",inset:0,zIndex:9999,background:"#0A0806",display:"flex",alignItems:"center",justifyContent:"center",animation:"spaceFadeIn .5s ease"}}>
        <div style={{textAlign:"center",animation:"fadeUp .6s .15s ease both"}}>
          <div style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"1.05rem",color:"rgba(255,248,232,0.5)",letterSpacing:"0.04em"}}>{transitDir==="toCabin"?"Returning to the cabin...":"Stepping into The Upper Room..."}</div>
        </div>
      </div>}
      <MapHudButton/>
    </div>
  );

  /* ══ INSIGHTS ══════════════════════════════════════ */
  if(screen==="insights"){
    const JCard=({children,style,...p})=><div style={{background:B.white,border:`1px solid ${B.beigeD}`,borderRadius:12,padding:"20px",boxShadow:"0 1px 8px rgba(0,0,0,0.04)",marginBottom:12,animation:"fadeUp .45s ease both",...style}} {...p}>{children}</div>;
    const JBar=({label,value,max,color,sub})=>{const pct=max?Math.round(value/max*100):0;return(<div style={{marginBottom:10}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:"0.82rem",color:B.ink,textTransform:"capitalize"}}>{label}</span><span style={{fontSize:"0.74rem",color:B.inkLL}}>{sub||value}</span></div><div style={{height:5,background:B.beigeD,borderRadius:99,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,background:color||`linear-gradient(90deg,${B.sageDk},${B.sage})`,borderRadius:99,transition:"width 0.7s ease"}}/></div></div>);};
    const JTabPill=({k,label})=><button onClick={()=>setJourneyTab(k)} style={{background:journeyTab===k?B.night:"transparent",border:`1px solid ${journeyTab===k?"rgba(201,169,110,0.3)":B.beigeD}`,color:journeyTab===k?B.goldL:B.inkL,padding:"6px 14px",borderRadius:99,fontSize:"0.72rem",fontFamily:SANS,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap",transition:"all 0.2s"}}>{label}</button>;
    const seasonalData=computeSeasonalSummary(entries,insights,seasonalPeriod);
    const emMax=Math.max(1,...Object.values(insights.emotions).map(v=>v.count));
    const thMax=Math.max(1,...Object.values(insights.lifeThemes).map(v=>v.count));
    const gmMax=Math.max(1,...Object.values(insights.growthMarkers));
    const todMax=Math.max(1,...Object.values(insights.timeOfDay));
    const topWords=Object.entries(insights.wordFreq).sort((a,b)=>b[1]-a[1]).slice(0,40);
    const wfMax=topWords.length?topWords[0][1]:1;
    const wordColors=[B.gold,B.sageDk,B.ink,B.sage,"#8B6B4B","#6B7B9E"];

    return(
    <div style={{minHeight:"100vh",background:B.beige,color:B.ink,fontFamily:SANS}}>
      <style>{GFONTS}{CSS}</style>
      <DarkHeader title="✨ Your Journey" onBack={()=>setScreen("cabin")}/>
      <main style={{maxWidth:"700px",margin:"0 auto",padding:"28px 22px 80px"}}>
        {/* Tab bar */}
        <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:14,marginBottom:4,WebkitOverflowScrolling:"touch"}}>
          {[["overview","Overview"],["emotions","Emotions"],["themes","Themes"],["faith","Faith"],["prayers","Prayers"],["identity","Identity"],["growth","Growth"],["cloud","Words"],["future","Future You"]].map(([k,l])=><JTabPill key={k} k={k} label={l}/>)}
        </div>

        {entries.length===0&&<JCard style={{padding:"48px 28px",textAlign:"center"}}><div style={{fontSize:"1.8rem",marginBottom:12}}>🌱</div><p style={{fontFamily:SERIF,fontStyle:"italic",color:B.inkL,margin:"0 0 18px"}}>Your insights will emerge as you reflect. Begin with any room.</p><button onClick={()=>setScreen("cabin")} style={{background:B.night,border:"none",color:B.goldL,padding:"11px 26px",borderRadius:8,cursor:"pointer",fontSize:"0.83rem",fontFamily:SANS,fontWeight:600}}>Choose a room →</button></JCard>}

        {entries.length>0&&journeyTab==="overview"&&<>
          {/* Stats grid */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:14}}>
            {[{e:"📝",v:entries.length,l:"Reflections"},{e:"✍️",v:totalWords.toLocaleString(),l:"Words written"},{e:"🔥",v:`${streak}d`,l:"Streak"}].map((s,i)=>(
              <div key={s.l} style={{background:B.white,border:`1px solid ${B.beigeD}`,borderRadius:12,padding:"18px 13px",textAlign:"center",boxShadow:"0 1px 8px rgba(0,0,0,0.04)",animation:`fadeUp .45s ${i*.1}s ease both`}}>
                <div style={{fontSize:"1.3rem",marginBottom:6}}>{s.e}</div>
                <div style={{fontFamily:SERIF,fontSize:"1.5rem",fontWeight:700,color:B.sageDk}}>{s.v}</div>
                <div style={{fontSize:"0.67rem",color:B.inkLL,letterSpacing:"0.07em",textTransform:"uppercase",fontWeight:500,marginTop:3}}>{s.l}</div>
              </div>
            ))}
          </div>
          {/* Weekly digest */}
          <JCard><UILabel>This Week</UILabel>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div><span style={{fontSize:"1.2rem",fontFamily:SERIF,fontWeight:700,color:B.sageDk}}>{weeklyDigest.entryCount}</span><span style={{fontSize:"0.72rem",color:B.inkLL,marginLeft:6}}>entries</span></div>
              <div><span style={{fontSize:"1.2rem",fontFamily:SERIF,fontWeight:700,color:B.sageDk}}>{weeklyDigest.totalWords.toLocaleString()}</span><span style={{fontSize:"0.72rem",color:B.inkLL,marginLeft:6}}>words</span></div>
            </div>
            {weeklyDigest.topEmotions.length>0&&<p style={{fontSize:"0.78rem",color:B.inkL,margin:"10px 0 0",fontFamily:SERIF,fontStyle:"italic"}}>Top emotions: {weeklyDigest.topEmotions.join(", ")}</p>}
            {weeklyDigest.topRooms.length>0&&<p style={{fontSize:"0.78rem",color:B.inkL,margin:"4px 0 0",fontFamily:SERIF,fontStyle:"italic"}}>Active rooms: {weeklyDigest.topRooms.join(", ")}</p>}
          </JCard>
          {/* Top 3 emotions mini-bars */}
          <JCard><UILabel>Emotional landscape</UILabel>
            {Object.entries(insights.emotions).sort((a,b)=>b[1].count-a[1].count).slice(0,3).map(([emo,d])=><JBar key={emo} label={emo} value={d.count} max={emMax} color={EMOTION_COLORS[emo]} sub={`${d.count} mentions`}/>)}
          </JCard>
          {/* Time of day */}
          <JCard><UILabel>When you reflect</UILabel>
            {[["🌅 Morning","morning"],["☀️ Afternoon","afternoon"],["🌆 Evening","evening"],["🌙 Night","night"]].map(([l,k])=><JBar key={k} label={l} value={insights.timeOfDay[k]} max={todMax} color={B.sageDk} sub={`${insights.timeOfDay[k]} entries`}/>)}
          </JCard>
          {/* Seasonal summary */}
          <JCard>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
              <UILabel style={{margin:0}}>Seasonal Summary</UILabel>
              <div style={{display:"flex",gap:4}}>
                {[30,90,365].map(d=><button key={d} onClick={()=>setSeasonalPeriod(d)} style={{background:seasonalPeriod===d?B.night:"transparent",border:`1px solid ${seasonalPeriod===d?"rgba(201,169,110,0.25)":B.beigeD}`,color:seasonalPeriod===d?B.goldL:B.inkL,padding:"3px 10px",borderRadius:99,fontSize:"0.66rem",fontFamily:SANS,fontWeight:600,cursor:"pointer"}}>{d}d</button>)}
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,textAlign:"center"}}>
              <div><div style={{fontFamily:SERIF,fontSize:"1.1rem",fontWeight:700,color:B.sageDk}}>{seasonalData.entries}</div><div style={{fontSize:"0.65rem",color:B.inkLL}}>entries</div></div>
              <div><div style={{fontFamily:SERIF,fontSize:"1.1rem",fontWeight:700,color:B.sageDk}}>{seasonalData.totalWords.toLocaleString()}</div><div style={{fontSize:"0.65rem",color:B.inkLL}}>words</div></div>
              <div><div style={{fontFamily:SERIF,fontSize:"1.1rem",fontWeight:700,color:B.sageDk}}>{seasonalData.avgWords}</div><div style={{fontSize:"0.65rem",color:B.inkLL}}>avg/entry</div></div>
            </div>
            {seasonalData.topThemes.length>0&&<p style={{fontSize:"0.78rem",color:B.inkL,margin:"10px 0 0",fontFamily:SERIF,fontStyle:"italic"}}>Top themes: {seasonalData.topThemes.join(", ")}</p>}
          </JCard>
          {/* Breakthroughs */}
          {insights.breakthroughs.length>0&&<JCard style={{borderLeft:`3px solid ${B.gold}`}}>
            <UILabel>✨ Breakthrough moment</UILabel>
            <p style={{fontFamily:SERIF,fontSize:"0.88rem",color:B.ink,margin:0,lineHeight:1.6}}>
              On {insights.breakthroughs[insights.breakthroughs.length-1].date}, your writing shifted from <strong style={{color:EMOTION_COLORS[insights.breakthroughs[insights.breakthroughs.length-1].from]||B.ink}}>{insights.breakthroughs[insights.breakthroughs.length-1].from}</strong> to <strong style={{color:EMOTION_COLORS[insights.breakthroughs[insights.breakthroughs.length-1].to]||B.sageDk}}>{insights.breakthroughs[insights.breakthroughs.length-1].to}</strong>.
            </p>
          </JCard>}
          {/* Room progress */}
          <JCard><UILabel>Journey progress</UILabel>
            {[...REFLECTION_ROOMS,...COMMUNITY_ROOMS].map(room=>{
              const prog=roomProg(room),pct=Math.round(prog/room.days.length*100);
              return(<div key={room.id} style={{marginBottom:10}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:"0.82rem",color:B.ink}}>{room.emoji} {room.label}</span><span style={{fontSize:"0.74rem",color:B.inkLL}}>{prog}/{room.days.length}</span></div><div style={{height:4,background:B.beigeD,borderRadius:99,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,background:th(room.id).accent,borderRadius:99,transition:"width 0.6s"}}/></div></div>);
            })}
          </JCard>
        </>}

        {entries.length>0&&journeyTab==="emotions"&&<>
          <JCard><UILabel>Emotional patterns</UILabel>
            {Object.entries(insights.emotions).sort((a,b)=>b[1].count-a[1].count).map(([emo,d])=><JBar key={emo} label={emo} value={d.count} max={emMax} color={EMOTION_COLORS[emo]} sub={`${d.count} mentions`}/>)}
            {Object.values(insights.emotions).every(d=>d.count===0)&&<p style={{fontFamily:SERIF,fontStyle:"italic",color:B.inkL,margin:0}}>Keep reflecting — emotional patterns will emerge over time.</p>}
          </JCard>
          {Object.entries(insights.emotions).sort((a,b)=>b[1].count-a[1].count)[0]?.[1]?.count>0&&<JCard>
            <p style={{fontFamily:SERIF,fontSize:"0.88rem",color:B.ink,margin:0,lineHeight:1.65,fontStyle:"italic"}}>
              Your most frequent emotion is <strong style={{color:EMOTION_COLORS[Object.entries(insights.emotions).sort((a,b)=>b[1].count-a[1].count)[0][0]]}}>{Object.entries(insights.emotions).sort((a,b)=>b[1].count-a[1].count)[0][0]}</strong> with {Object.entries(insights.emotions).sort((a,b)=>b[1].count-a[1].count)[0][1].count} mentions across your reflections.
            </p>
          </JCard>}
        </>}

        {entries.length>0&&journeyTab==="themes"&&<>
          <JCard><UILabel>Life themes</UILabel>
            {Object.entries(insights.lifeThemes).sort((a,b)=>b[1].count-a[1].count).map(([th,d])=><JBar key={th} label={th.replace("_"," ")} value={d.count} max={thMax} color={`linear-gradient(90deg,${B.sageDk},${B.sage})`} sub={`${d.pct}%`}/>)}
          </JCard>
        </>}

        {entries.length>0&&journeyTab==="faith"&&<>
          <JCard><UILabel>Faith & Scripture</UILabel>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,textAlign:"center",marginBottom:14}}>
              <div><div style={{fontFamily:SERIF,fontSize:"1.3rem",fontWeight:700,color:B.sageDk}}>{insights.faithMentions.prayerLang}</div><div style={{fontSize:"0.65rem",color:B.inkLL}}>Prayer language</div></div>
              <div><div style={{fontFamily:SERIF,fontSize:"1.3rem",fontWeight:700,color:B.sageDk}}>{insights.faithMentions.godRefs}</div><div style={{fontSize:"0.65rem",color:B.inkLL}}>God references</div></div>
              <div><div style={{fontFamily:SERIF,fontSize:"1.3rem",fontWeight:700,color:B.sageDk}}>{insights.faithMentions.surrenderLang}</div><div style={{fontSize:"0.65rem",color:B.inkLL}}>Surrender language</div></div>
            </div>
          </JCard>
          {insights.faithMentions.scriptures.length>0&&<JCard><UILabel>Scripture references</UILabel>
            {insights.faithMentions.scriptures.map((s,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:i<insights.faithMentions.scriptures.length-1?`1px solid ${B.beigeD}`:"none"}}><span style={{fontFamily:SERIF,fontSize:"0.88rem",color:B.ink}}>{s.ref}</span><span style={{fontSize:"0.72rem",color:B.inkLL}}>{s.date}</span></div>)}
          </JCard>}
          {insights.faithMentions.scriptures.length===0&&<JCard style={{textAlign:"center",padding:"32px 20px"}}><p style={{fontFamily:SERIF,fontStyle:"italic",color:B.inkL,margin:0}}>No scripture references found yet. Try including verse references (e.g. John 3:16) in your reflections.</p></JCard>}
        </>}

        {journeyTab==="prayers"&&<>
          <JCard>
            <UILabel>Prayer journey</UILabel>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,textAlign:"center",marginBottom:14}}>
              <div><div style={{fontFamily:SERIF,fontSize:"1.3rem",fontWeight:700,color:B.sageDk}}>{prayerTimeline.total}</div><div style={{fontSize:"0.65rem",color:B.inkLL}}>Total prayers</div></div>
              <div><div style={{fontFamily:SERIF,fontSize:"1.3rem",fontWeight:700,color:B.sageDk}}>{prayerTimeline.active.length}</div><div style={{fontSize:"0.65rem",color:B.inkLL}}>Active</div></div>
              <div><div style={{fontFamily:SERIF,fontSize:"1.3rem",fontWeight:700,color:B.gold}}>{prayerTimeline.answered.length}</div><div style={{fontSize:"0.65rem",color:B.inkLL}}>Answered</div></div>
            </div>
            {Object.keys(prayerTimeline.categories).length>0&&<>
              <UILabel>By category</UILabel>
              {Object.entries(prayerTimeline.categories).sort((a,b)=>b[1]-a[1]).map(([cat,cnt])=><JBar key={cat} label={cat} value={cnt} max={prayerTimeline.total} color={B.sageDk} sub={cnt}/>)}
            </>}
          </JCard>
          <JCard>
            <div style={{display:"flex",gap:6,marginBottom:12}}>
              {["active","answered","all"].map(f=><button key={f} onClick={()=>setPrayerFilter(f)} style={{background:prayerFilter===f?B.night:"transparent",border:`1px solid ${prayerFilter===f?"rgba(201,169,110,0.25)":B.beigeD}`,color:prayerFilter===f?B.goldL:B.inkL,padding:"4px 12px",borderRadius:99,fontSize:"0.68rem",fontFamily:SANS,fontWeight:600,cursor:"pointer",textTransform:"capitalize"}}>{f}</button>)}
            </div>
            {prayerPosts.filter(p=>prayerFilter==="all"?true:prayerFilter==="answered"?p.status==="answered":p.status!=="answered").map(p=>(
              <div key={p.id} style={{padding:"12px 0",borderBottom:`1px solid ${B.beigeD}`,opacity:p.status==="answered"?0.7:1}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                  <span style={{fontSize:"0.6rem",background:"rgba(90,138,106,0.1)",color:B.sageDk,padding:"2px 8px",borderRadius:99,fontFamily:SANS,fontWeight:600}}>{p.tag}</span>
                  {p.status==="answered"&&<span style={{fontSize:"0.58rem",background:"rgba(201,169,110,0.12)",color:B.gold,padding:"2px 8px",borderRadius:99,fontFamily:SANS,fontWeight:600}}>✓ Answered{p.answeredDate?` ${p.answeredDate}`:""}</span>}
                  <span style={{fontSize:"0.66rem",color:B.inkLL,fontFamily:SANS,marginLeft:"auto"}}>{p.date}</span>
                </div>
                <p style={{fontFamily:SERIF,fontSize:"0.86rem",color:B.ink,margin:"0 0 6px",lineHeight:1.55}}>{p.text}</p>
              </div>
            ))}
            {prayerPosts.length===0&&<p style={{fontFamily:SERIF,fontStyle:"italic",color:B.inkL,margin:0}}>No prayers posted yet. Visit the Community Hall to share a prayer.</p>}
          </JCard>
        </>}

        {entries.length>0&&journeyTab==="identity"&&<>
          <JCard><UILabel>Identity language</UILabel>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              <div>
                <div style={{fontSize:"0.72rem",fontFamily:SANS,fontWeight:600,color:"#C45B5B",marginBottom:8,textTransform:"uppercase",letterSpacing:"0.08em"}}>Negative patterns ({insights.identity.negative.length})</div>
                {insights.identity.negative.length===0&&<p style={{fontFamily:SERIF,fontStyle:"italic",color:B.inkL,fontSize:"0.8rem",margin:0}}>None found</p>}
                {insights.identity.negative.slice(0,8).map((p,i)=><div key={i} style={{fontSize:"0.78rem",fontFamily:SERIF,color:B.inkL,padding:"4px 0",borderBottom:`1px solid ${B.beigeD}`}}>"{p.text}"</div>)}
              </div>
              <div>
                <div style={{fontSize:"0.72rem",fontFamily:SANS,fontWeight:600,color:"#5BA8A0",marginBottom:8,textTransform:"uppercase",letterSpacing:"0.08em"}}>Growth patterns ({insights.identity.positive.length})</div>
                {insights.identity.positive.length===0&&<p style={{fontFamily:SERIF,fontStyle:"italic",color:B.inkL,fontSize:"0.8rem",margin:0}}>None found</p>}
                {insights.identity.positive.slice(0,8).map((p,i)=><div key={i} style={{fontSize:"0.78rem",fontFamily:SERIF,color:B.inkL,padding:"4px 0",borderBottom:`1px solid ${B.beigeD}`}}>"{p.text}"</div>)}
              </div>
            </div>
          </JCard>
          <JCard style={{textAlign:"center",padding:"24px 20px"}}>
            {(()=>{const neg=insights.identity.negative.length,pos=insights.identity.positive.length,total=neg+pos||1;const ratio=Math.round(pos/total*100);return<>
              <div style={{fontFamily:SERIF,fontSize:"1.5rem",fontWeight:700,color:ratio>=50?B.sageDk:"#C45B5B"}}>{ratio}%</div>
              <div style={{fontSize:"0.72rem",color:B.inkLL,marginBottom:8}}>growth language ratio</div>
              <p style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.85rem",color:B.inkL,margin:0,lineHeight:1.6}}>
                {ratio>=70?"Your words reflect deep identity roots. You're seeing yourself through God's eyes.":ratio>=40?"Growth is happening — you're shifting from old patterns to new truth.":"Be gentle with yourself. Healing is a journey, not a destination."}
              </p>
            </>;})()}
          </JCard>
        </>}

        {entries.length>0&&journeyTab==="growth"&&<>
          <JCard><UILabel>Spiritual growth markers</UILabel>
            {[["forgiveness","🕊️"],["surrender","🤲"],["gratitude","🙏"],["repentance","💧"],["trust","🤝"],["obedience","👣"]].map(([mk,emoji])=><JBar key={mk} label={`${emoji} ${mk}`} value={insights.growthMarkers[mk]} max={gmMax} color={B.sageDk} sub={`${insights.growthMarkers[mk]} mentions`}/>)}
            {Object.values(insights.growthMarkers).every(v=>v===0)&&<p style={{fontFamily:SERIF,fontStyle:"italic",color:B.inkL,margin:"8px 0 0"}}>Growth markers will appear as you reflect on your spiritual journey.</p>}
          </JCard>
        </>}

        {entries.length>0&&journeyTab==="cloud"&&<>
          <JCard><UILabel>Word cloud</UILabel>
            {topWords.length>0?<div style={{display:"flex",flexWrap:"wrap",gap:"6px 10px",justifyContent:"center",padding:"12px 0"}}>
              {topWords.map(([word,count],i)=>{
                const sz=0.7+((count/wfMax)*1.5);
                return<span key={word} style={{fontSize:`${sz}rem`,fontFamily:SERIF,color:wordColors[i%wordColors.length],opacity:0.7+((count/wfMax)*0.3),cursor:"default",transition:"transform 0.2s"}} title={`${word}: ${count} times`}>{word}</span>;
              })}
            </div>:<p style={{fontFamily:SERIF,fontStyle:"italic",color:B.inkL,margin:0}}>Write more to see your word patterns emerge.</p>}
          </JCard>
        </>}

        {journeyTab==="future"&&<>
          {futureYou?<>
            <JCard style={{borderLeft:`3px solid ${B.sageDk}`}}>
              <UILabel>Your first entry</UILabel>
              <div style={{fontSize:"0.72rem",color:B.inkLL,marginBottom:6}}>{futureYou.first.date}</div>
              <p style={{fontFamily:SERIF,fontSize:"0.88rem",color:B.ink,margin:"0 0 8px",lineHeight:1.6,fontStyle:"italic"}}>"{futureYou.first.snippet}…"</p>
              {futureYou.first.negPatterns.length>0&&<div style={{fontSize:"0.72rem",color:"#C45B5B"}}>Identity patterns: {futureYou.first.negPatterns.join(", ")}</div>}
              {futureYou.first.posPatterns.length>0&&<div style={{fontSize:"0.72rem",color:"#5BA8A0"}}>Growth patterns: {futureYou.first.posPatterns.join(", ")}</div>}
            </JCard>
            <div style={{textAlign:"center",padding:"8px 0"}}><span style={{fontSize:"0.72rem",color:B.inkLL,fontFamily:SANS}}>{futureYou.daysBetween} days between</span></div>
            <JCard style={{borderLeft:`3px solid ${B.gold}`}}>
              <UILabel>Your latest entry</UILabel>
              <div style={{fontSize:"0.72rem",color:B.inkLL,marginBottom:6}}>{futureYou.latest.date}</div>
              <p style={{fontFamily:SERIF,fontSize:"0.88rem",color:B.ink,margin:"0 0 8px",lineHeight:1.6,fontStyle:"italic"}}>"{futureYou.latest.snippet}…"</p>
              {futureYou.latest.negPatterns.length>0&&<div style={{fontSize:"0.72rem",color:"#C45B5B"}}>Identity patterns: {futureYou.latest.negPatterns.join(", ")}</div>}
              {futureYou.latest.posPatterns.length>0&&<div style={{fontSize:"0.72rem",color:"#5BA8A0"}}>Growth patterns: {futureYou.latest.posPatterns.join(", ")}</div>}
            </JCard>
          </>:<JCard style={{textAlign:"center",padding:"48px 24px"}}>
            <div style={{fontSize:"1.6rem",marginBottom:12}}>🪞</div>
            <p style={{fontFamily:SERIF,fontStyle:"italic",color:B.inkL,margin:"0 0 4px",lineHeight:1.6}}>Keep reflecting — after 5 entries, you'll be able to see how far you've come.</p>
            <p style={{fontSize:"0.74rem",color:B.inkLL,margin:0}}>{entries.length}/5 entries so far</p>
          </JCard>}
        </>}
      </main>
      <MapHudButton/>
    </div>
  );}

  /* ══ WORLD MAP — Navigation Hub ═══════════════════ */
  if(screen==="map"){
    // Helper: navigate from map to a destination with transition
    const mapGoTo=(dest)=>{
      setSpaceTransit(true);
      setTransitDir("fromMap");
      setTimeout(()=>{
        if(dest==="cabin"){setScreen("cabin");}
        else if(dest==="garden"){setScreen("garden");}
        else if(dest==="hall"){setScreen("hall");}
        else if(dest==="market"){setScreen("market");}
        else if(dest==="upper-room"){setScreen("upper-room");}
        else{setScreen(dest);}
        setSpaceTransit(false);setTransitDir(null);
      },700);
    };
    return(
      <div style={{position:"fixed",inset:0,overflow:"hidden",fontFamily:SANS}}>
        <style>{GFONTS}{CSS}</style>

        {/* ── Full-screen immersive map background ── */}
        <ImmersiveMap/>

        {/* ═══ LOCATION HOTSPOTS — positioned over map labels ═══ */}
        {MAP_LOCATIONS.map((loc,idx)=>(
          <button key={loc.id} onClick={()=>mapGoTo(loc.id)} style={{
            position:"absolute",left:loc.left,top:loc.top,
            transform:"translate(-50%,-50%)",
            width:loc.w,height:loc.h,
            borderRadius:16,border:"none",zIndex:10,
            background:"transparent",cursor:"pointer",
            WebkitTapHighlightColor:"transparent",
            padding:0,outline:"none",
          }}/>
        ))}

        {/* ═══ SPACE TRANSIT OVERLAY ═══ */}
        {spaceTransit&&<div style={{position:"fixed",inset:0,zIndex:9999,background:"#0A0806",animation:"spaceFadeIn .6s ease both",pointerEvents:"all"}}/>}
      </div>
    );
  }

  /* ══ PRAYER GARDEN ═══════════════════════════════ */
  if(screen==="garden"){
    void gardenTick;
    const availablePrayers=getAvailablePrayers();
    const invItems=Object.entries(inventory).filter(([,v])=>v>0);
    const totalInv=invItems.reduce((s,[,v])=>s+v,0);
    const isFarmMode=gardenMode==="farm";
    const activePlots=isFarmMode?farmPlots:gardenPlots;
    const getGrowthPercent=(plot)=>{
      if(plot.stage==="empty"||!plot.plantedAt) return 0;
      if(isFarmMode){
        const cs=getFarmComputedStage(plot);
        if(cs==="harvestable") return 100;
        const plant=FARM_PLANTS.find(p=>p.id===plot.plantType);
        if(!plant) return 0;
        const elapsed=(Date.now()-plot.plantedAt)/60000;
        let total=0;
        for(let i=0;i<plant.growthBase.length;i++) total+=plant.growthBase[i];
        return Math.min(100,Math.round((elapsed/total)*100));
      }
      const cs=getComputedStage(plot);
      if(cs==="harvestable") return 100;
      const plant=GARDEN_PLANTS.find(p=>p.id===plot.plantType);
      if(!plant) return 0;
      const elapsed=(Date.now()-plot.plantedAt)/60000;
      const bonus=plot.prayerCount*PRAYER_BONUS_MINS;
      let total=0;
      for(let i=0;i<plant.growthBase.length;i++) total+=Math.max(0.5,plant.growthBase[i]-bonus);
      return Math.min(100,Math.round((elapsed/total)*100));
    };
    const getActiveStage=(plot)=>isFarmMode?getFarmComputedStage(plot):getComputedStage(plot);
    const getActiveEmoji=(plot)=>isFarmMode?getFarmPlantEmoji(plot):getPlantEmoji(plot);
    const growingCount=activePlots.filter(p=>p.stage!=="empty"&&getActiveStage(p)!=="harvestable").length;
    const readyCount=activePlots.filter(p=>p.stage!=="empty"&&getActiveStage(p)==="harvestable").length;

    return(
      <div style={{position:"fixed",inset:0,overflow:"hidden",fontFamily:SANS}}>
        <style>{GFONTS}{CSS}</style>

        {/* ── Full-screen immersive garden background ── */}
        <ImmersiveGarden/>

        {/* ═══ GARDEN PLOT HOTSPOTS — mapped to circular dirt patches ═══ */}
        {activePlots.map((plot,idx)=>{
          const pos=GARDEN_PLOT_POSITIONS[idx];
          if(!pos) return null;
          const cs=getActiveStage(plot);
          const isHarvestable=cs==="harvestable";
          const isEmpty=cs==="empty";
          const prayer=(!isFarmMode&&plot.prayerId)?prayerPosts.find(p=>p.id===plot.prayerId):null;
          const isAnswered=prayer&&prayer.status==="answered";
          const pct=getGrowthPercent(plot);
          return(
            <button key={plot.id} className="garden-plot-hotspot" onClick={()=>{
              if(isFarmMode){
                if(isEmpty) setPlantModal(plot.id);
                else if(isHarvestable) harvestFarmPlot(plot.id);
                else setSelectedPlot(selectedPlot===plot.id?null:plot.id);
              } else {
                if(isEmpty) openPlantModal(plot.id);
                else if(isHarvestable) harvestPlot(plot.id);
                else setSelectedPlot(selectedPlot===plot.id?null:plot.id);
              }
            }} style={{
              position:"absolute",left:pos.left,top:pos.top,
              width:`min(${pos.size},${pos.maxSize})`,height:`min(${pos.size},${pos.maxSize})`,
              transform:"translate(-50%,-50%)",
              borderRadius:"50%",border:"none",cursor:"pointer",zIndex:10,
              background:isEmpty?"rgba(80,60,30,0.25)":isHarvestable?"rgba(255,200,60,0.15)":"rgba(90,138,106,0.12)",
              boxShadow:isHarvestable?"0 0 16px rgba(255,200,60,0.35), 0 0 40px rgba(255,200,60,0.1)":isEmpty?"none":"0 0 10px rgba(90,138,106,0.15)",
              animation:isHarvestable?`gardenDoorGlow 2.5s ease-in-out infinite`:`gardenPlotFadeIn .5s ${idx*0.06}s ease both`,
              display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:1,
              padding:0,overflow:"visible",
            }}>
              {isEmpty?(
                <span style={{fontSize:"clamp(0.7rem,2vw,1.1rem)",color:"rgba(220,200,160,0.45)",animation:"emptyPlotPulse 3.5s ease-in-out infinite",lineHeight:1}}>+</span>
              ):(
                <>
                  <span style={{fontSize:"clamp(0.9rem,2.5vw,1.5rem)",lineHeight:1,animation:isHarvestable?"harvestGlow 2s ease-in-out infinite":isAnswered?"bloomPulse 2s ease-in-out infinite":"gardenSway 4s ease-in-out infinite",transformOrigin:"bottom center",filter:"drop-shadow(0 2px 4px rgba(0,0,0,0.4))"}}>{getActiveEmoji(plot)}</span>
                  {isAnswered&&!isHarvestable&&<span style={{position:"absolute",top:"-4px",right:"-2px",fontSize:"0.45rem"}}>🌸</span>}
                  {isHarvestable&&<span style={{fontSize:"clamp(0.35rem,0.9vw,0.5rem)",fontFamily:SANS,fontWeight:700,color:"#FFE880",textShadow:"0 1px 4px rgba(0,0,0,0.7)",lineHeight:1,animation:"harvestBounce 1.5s ease-in-out infinite"}}>Harvest</span>}
                  {!isHarvestable&&!isEmpty&&(
                    <div style={{width:"70%",height:2,background:"rgba(0,0,0,0.3)",borderRadius:1,overflow:"hidden",marginTop:1}}>
                      <div style={{width:`${pct}%`,height:"100%",background:"linear-gradient(90deg,#5A8A6A,#BED3C4)",borderRadius:1,transition:"width 0.5s"}}/>
                    </div>
                  )}
                </>
              )}
            </button>
          );
        })}

        {/* ═══ DOOR — back to map (glowing archway at top center) ═══ */}
        <button onClick={()=>{setScreen("map");setGardenTab("garden");setSelectedPlot(null);}} style={{position:"absolute",left:"35%",top:"6%",width:"30%",height:"16%",zIndex:12,background:"transparent",border:"none",cursor:"pointer",borderRadius:"50% 50% 8px 8px",animation:"gardenDoorGlow 3s ease-in-out infinite"}}>
          <div style={{position:"absolute",bottom:"8%",left:"50%",transform:"translateX(-50%)",display:"flex",alignItems:"center",gap:4,background:"rgba(10,8,6,0.55)",backdropFilter:"blur(6px)",WebkitBackdropFilter:"blur(6px)",borderRadius:10,padding:"4px 10px",whiteSpace:"nowrap",pointerEvents:"none"}}>
            <span style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.5rem",color:"rgba(255,248,232,0.55)",letterSpacing:"0.02em"}}>Back to village</span>
          </div>
        </button>

        {/* ═══ TOP HUD — mode toggle + currency + garden status ═══ */}
        {/* Farm / Prayers tab toggle */}
        <div style={{position:"absolute",top:"3%",left:"50%",transform:"translateX(-50%)",zIndex:22,display:"flex",background:"rgba(10,8,6,0.7)",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",border:"1px solid rgba(190,211,196,0.12)",borderRadius:12,overflow:"hidden",animation:"fadeUp .5s ease both"}}>
          {[{id:"farm",label:"Farm"},{id:"prayers",label:"Prayers"}].map(tab=>(
            <button key={tab.id} onClick={()=>{setGardenMode(tab.id);setSelectedPlot(null);setPlantModal(null);}} style={{background:gardenMode===tab.id?"rgba(90,138,106,0.25)":"transparent",border:"none",padding:"6px 16px",cursor:"pointer",fontFamily:SERIF,fontStyle:"italic",fontSize:"0.72rem",fontWeight:gardenMode===tab.id?600:400,color:gardenMode===tab.id?"#BED3C4":"rgba(190,211,196,0.4)",transition:"all .15s"}}>{tab.label}</button>
          ))}
        </div>

        <div style={{position:"absolute",left:"3%",top:"3%",zIndex:20,display:"flex",alignItems:"center",gap:8,animation:"fadeUp .6s ease both"}}>
          {isFarmMode ? (
            <div style={{background:"rgba(10,8,6,0.65)",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",border:"1px solid rgba(212,180,100,0.15)",borderRadius:10,padding:"5px 12px",display:"flex",alignItems:"center",gap:6}}>
              <span style={{fontSize:"0.75rem"}}>🪙</span>
              <span style={{fontFamily:DISPLAY,fontSize:"0.82rem",fontWeight:700,color:B.goldL}}>{bank.coins}</span>
            </div>
          ) : (
            <div style={{background:"rgba(10,8,6,0.65)",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",border:"1px solid rgba(212,180,100,0.15)",borderRadius:10,padding:"5px 12px",display:"flex",alignItems:"center",gap:6}}>
              <span style={{fontSize:"0.8rem"}}>🕯️</span>
              <span style={{fontFamily:DISPLAY,fontSize:"0.82rem",fontWeight:700,color:B.goldL}}>{candles}</span>
            </div>
          )}
          {readyCount>0&&<div style={{background:"rgba(10,8,6,0.65)",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",border:"1px solid rgba(255,200,60,0.2)",borderRadius:10,padding:"5px 10px",display:"flex",alignItems:"center",gap:4}}>
            <span style={{fontSize:"0.65rem"}}>✨</span>
            <span style={{fontFamily:SANS,fontSize:"0.68rem",fontWeight:600,color:"#FFE880"}}>{readyCount} ready</span>
          </div>}
          {growingCount>0&&<div style={{background:"rgba(10,8,6,0.55)",backdropFilter:"blur(6px)",WebkitBackdropFilter:"blur(6px)",border:"1px solid rgba(90,138,106,0.15)",borderRadius:10,padding:"5px 10px",display:"flex",alignItems:"center",gap:4}}>
            <span style={{fontSize:"0.65rem"}}>🌱</span>
            <span style={{fontFamily:SANS,fontSize:"0.68rem",color:"rgba(190,211,196,0.5)"}}>{growingCount}</span>
          </div>}
        </div>

        {/* ═══ BOTTOM FLOATING BUTTONS — Inventory & Crafting ═══ */}
        <div style={{position:"absolute",bottom:"4%",left:"50%",transform:"translateX(-50%)",zIndex:20,display:"flex",gap:10,animation:"fadeUp .8s .3s ease both"}}>
          <button onClick={()=>{setGardenTab(gardenTab==="inventory"?"garden":"inventory");setCraftingStation(null);}} style={{background:gardenTab==="inventory"?"rgba(90,138,106,0.25)":"rgba(10,8,6,0.65)",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",border:`1px solid ${gardenTab==="inventory"?"rgba(90,138,106,0.4)":"rgba(190,211,196,0.15)"}`,borderRadius:14,padding:"10px 18px",cursor:"pointer",display:"flex",alignItems:"center",gap:6,boxShadow:"0 4px 16px rgba(0,0,0,0.3)"}}>
            <span style={{fontSize:"0.85rem"}}>🧺</span>
            <span style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.72rem",color:gardenTab==="inventory"?"#BED3C4":"rgba(190,211,196,0.5)"}}>Inventory</span>
            {totalInv>0&&<span style={{fontFamily:SANS,fontSize:"0.6rem",fontWeight:700,color:B.goldL,background:"rgba(212,180,100,0.15)",borderRadius:6,padding:"1px 5px"}}>{totalInv}</span>}
          </button>
          <button onClick={()=>{setGardenTab(gardenTab==="crafting"?"garden":"crafting");setCraftingStation(null);}} style={{background:gardenTab==="crafting"?"rgba(90,138,106,0.25)":"rgba(10,8,6,0.65)",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",border:`1px solid ${gardenTab==="crafting"?"rgba(90,138,106,0.4)":"rgba(190,211,196,0.15)"}`,borderRadius:14,padding:"10px 18px",cursor:"pointer",display:"flex",alignItems:"center",gap:6,boxShadow:"0 4px 16px rgba(0,0,0,0.3)"}}>
            <span style={{fontSize:"0.85rem"}}>⚙️</span>
            <span style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.72rem",color:gardenTab==="crafting"?"#BED3C4":"rgba(190,211,196,0.5)"}}>Crafting</span>
          </button>
        </div>

        {/* ═══ SELECTED PLOT DETAIL — floating card ═══ */}
        {selectedPlot&&(()=>{
          const plot=activePlots.find(p=>p.id===selectedPlot);
          if(!plot||plot.stage==="empty") return null;
          const plant=isFarmMode?FARM_PLANTS.find(p=>p.id===plot.plantType):GARDEN_PLANTS.find(p=>p.id===plot.plantType);
          const prayer=(!isFarmMode&&plot.prayerId)?prayerPosts.find(p=>p.id===plot.prayerId):null;
          const cs=getActiveStage(plot);
          const pct=getGrowthPercent(plot);
          return(
            <div onClick={()=>setSelectedPlot(null)} style={{position:"fixed",inset:0,zIndex:50}}>
              <div style={{position:"absolute",inset:0,background:"rgba(6,8,4,0.4)"}}/>
              <div onClick={e=>e.stopPropagation()} style={{position:"absolute",bottom:"14%",left:"50%",transform:"translateX(-50%)",width:"min(88vw,340px)",background:"rgba(18,22,14,0.94)",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",border:"1px solid rgba(90,138,106,0.25)",borderRadius:18,padding:"20px 18px",animation:"fadeUp .3s ease both",boxShadow:"0 8px 32px rgba(0,0,0,0.5)"}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                  <span style={{fontSize:"1.6rem"}}>{getActiveEmoji(plot)}</span>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:DISPLAY,fontSize:"0.95rem",fontWeight:700,color:"#BED3C4"}}>{plant?.name||"Plant"}</div>
                    <div style={{fontFamily:SANS,fontSize:"0.68rem",color:"rgba(190,211,196,0.5)"}}>Stage: {cs} · {pct}% grown</div>
                  </div>
                  <button onClick={()=>setSelectedPlot(null)} style={{background:"none",border:"none",color:"rgba(190,211,196,0.3)",fontSize:"1rem",cursor:"pointer",padding:4}}>✕</button>
                </div>
                <div style={{width:"100%",height:4,background:"rgba(190,211,196,0.1)",borderRadius:2,overflow:"hidden",marginBottom:10}}>
                  <div style={{width:`${pct}%`,height:"100%",background:"linear-gradient(90deg,#5A8A6A,#9AB8A4)",borderRadius:2,transition:"width 0.5s"}}/>
                </div>
                {prayer&&<div style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.8rem",color:"rgba(190,211,196,0.55)",lineHeight:1.5,borderTop:"1px solid rgba(90,138,106,0.12)",paddingTop:10}}>
                  🙏 {prayer.text.slice(0,120)}{prayer.text.length>120?"…":""}
                </div>}
                {prayer?.status==="answered"&&<div style={{marginTop:8,fontFamily:SANS,fontSize:"0.72rem",fontWeight:600,color:"#9AB8A4"}}>✦ Prayer answered — in full bloom</div>}
                {!isFarmMode&&<div style={{marginTop:8,fontFamily:SANS,fontSize:"0.65rem",color:"rgba(190,211,196,0.3)"}}>Prayers offered: {plot.prayerCount}</div>}
                {isFarmMode&&plant&&<div style={{marginTop:8,fontFamily:SANS,fontSize:"0.65rem",color:"rgba(190,211,196,0.3)"}}>Sells for {ITEM_CATALOG[plant.harvestItem]?.sellPrice||0} coins</div>}
              </div>
            </div>
          );
        })()}

        {/* ═══ INVENTORY PANEL (slides up from bottom) ═══ */}
        {gardenTab==="inventory"&&(()=>{
          const cats=[{id:"all",label:"All"},{id:"seeds",label:"Seeds"},{id:"crops",label:"Crops"},{id:"ingredients",label:"Ingredients"},{id:"cooked",label:"Cooked"}];
          const filtered=invItems.filter(([item])=>{
            if(inventoryTab==="all") return true;
            const cat=ITEM_CATALOG[item]?.cat;
            return cat===inventoryTab;
          });
          return <div style={{position:"fixed",inset:0,zIndex:40}} onClick={()=>setGardenTab("garden")}>
            <div style={{position:"absolute",inset:0,background:"rgba(6,8,4,0.35)"}}/>
            <div onClick={e=>e.stopPropagation()} style={{position:"absolute",bottom:0,left:0,right:0,maxHeight:"60vh",background:"rgba(18,22,14,0.96)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",border:"1px solid rgba(90,138,106,0.2)",borderRadius:"20px 20px 0 0",padding:"20px 18px 30px",animation:"panelSlideUp .35s cubic-bezier(.22,1,.36,1) both",overflowY:"auto"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                <div style={{fontFamily:DISPLAY,fontSize:"1rem",fontWeight:700,color:"#BED3C4"}}>Inventory</div>
                <button onClick={()=>setGardenTab("garden")} style={{background:"none",border:"none",color:"rgba(190,211,196,0.3)",fontSize:"0.9rem",cursor:"pointer"}}>✕</button>
              </div>
              {/* Category tabs */}
              <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
                {cats.map(c=><button key={c.id} onClick={()=>setInventoryTab(c.id)} style={{background:inventoryTab===c.id?"rgba(90,138,106,0.2)":"transparent",border:`1px solid ${inventoryTab===c.id?"rgba(90,138,106,0.35)":"rgba(190,211,196,0.08)"}`,color:inventoryTab===c.id?"#BED3C4":"rgba(190,211,196,0.35)",padding:"4px 12px",borderRadius:8,cursor:"pointer",fontSize:"0.68rem",fontFamily:SANS,fontWeight:inventoryTab===c.id?600:400,transition:"all 0.15s"}}>{c.label}</button>)}
              </div>
              {filtered.length===0?(
                <div style={{textAlign:"center",padding:"20px 0"}}>
                  <p style={{fontFamily:SERIF,fontStyle:"italic",color:"rgba(190,211,196,0.35)",fontSize:"0.85rem"}}>
                    {invItems.length===0?"Your harvest will appear here.":"No items in this category."}
                  </p>
                </div>
              ):(
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
                  {filtered.map(([item,qty])=>{
                    const catItem=ITEM_CATALOG[item];
                    const emoji=catItem?.emoji||"📦";
                    const displayName=catItem?.name||item.replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase());
                    const sellPrice=catItem?.sellPrice;
                    return(
                      <div key={item} style={{background:"rgba(90,138,106,0.06)",border:"1px solid rgba(90,138,106,0.15)",borderRadius:12,padding:"12px 8px",display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                        <span style={{fontSize:"1.3rem"}}>{emoji}</span>
                        <span style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.62rem",color:"rgba(190,211,196,0.6)",textAlign:"center",lineHeight:1.2}}>{displayName}</span>
                        <span style={{fontFamily:DISPLAY,fontSize:"0.9rem",fontWeight:700,color:"#BED3C4"}}>x{qty}</span>
                        {sellPrice&&<span style={{fontFamily:SANS,fontSize:"0.55rem",color:"rgba(212,180,100,0.5)"}}>🪙 {sellPrice}</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>;
        })()}

        {/* ═══ CRAFTING PANEL (slides up from bottom) ═══ */}
        {gardenTab==="crafting"&&<div style={{position:"fixed",inset:0,zIndex:40}} onClick={()=>{setGardenTab("garden");setCraftingStation(null);}}>
          <div style={{position:"absolute",inset:0,background:"rgba(6,8,4,0.35)"}}/>
          <div onClick={e=>e.stopPropagation()} style={{position:"absolute",bottom:0,left:0,right:0,maxHeight:"65vh",background:"rgba(18,22,14,0.96)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",border:"1px solid rgba(90,138,106,0.2)",borderRadius:"20px 20px 0 0",padding:"20px 18px 30px",animation:"panelSlideUp .35s cubic-bezier(.22,1,.36,1) both",overflowY:"auto"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
              <div style={{fontFamily:DISPLAY,fontSize:"1rem",fontWeight:700,color:"#BED3C4"}}>⚙️ Crafting</div>
              <button onClick={()=>{setGardenTab("garden");setCraftingStation(null);}} style={{background:"none",border:"none",color:"rgba(190,211,196,0.3)",fontSize:"0.9rem",cursor:"pointer"}}>✕</button>
            </div>
            {!craftingStation?(
              <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12}}>
                {CRAFTING_STATIONS.map(station=>(
                  <button key={station.id} className="craft-btn" onClick={()=>setCraftingStation(station.id)} style={{background:"rgba(90,138,106,0.06)",border:"1px solid rgba(90,138,106,0.2)",borderRadius:14,padding:"18px 12px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
                    <span style={{fontSize:"1.6rem"}}>{station.emoji}</span>
                    <span style={{fontFamily:DISPLAY,fontSize:"0.85rem",fontWeight:700,color:"#BED3C4"}}>{station.name}</span>
                    <span style={{fontFamily:SANS,fontSize:"0.6rem",color:"rgba(190,211,196,0.4)"}}>{station.recipes.length} recipe{station.recipes.length>1?"s":""}</span>
                  </button>
                ))}
              </div>
            ):(()=>{
              const station=CRAFTING_STATIONS.find(s=>s.id===craftingStation);
              if(!station) return null;
              return(
                <div>
                  <button onClick={()=>setCraftingStation(null)} style={{background:"transparent",border:"none",cursor:"pointer",color:"rgba(190,211,196,0.4)",fontSize:"0.75rem",fontFamily:SANS,padding:0,marginBottom:12}}>← All stations</button>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
                    <span style={{fontSize:"1.4rem"}}>{station.emoji}</span>
                    <span style={{fontFamily:DISPLAY,fontSize:"1rem",fontWeight:700,color:"#BED3C4"}}>{station.name}</span>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    {station.recipes.map((recipe,ri)=>{
                      const canCraft=Object.entries(recipe.inputs).every(([item,qty])=>(inventory[item]||0)>=qty);
                      return(
                        <div key={ri} style={{background:canCraft?"rgba(90,138,106,0.08)":"rgba(255,255,255,0.02)",border:`1px solid ${canCraft?"rgba(90,138,106,0.25)":"rgba(190,211,196,0.08)"}`,borderRadius:12,padding:"14px"}}>
                          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                            <div style={{flex:1}}>
                              <div style={{fontFamily:SANS,fontSize:"0.6rem",color:"rgba(190,211,196,0.35)",marginBottom:3,textTransform:"uppercase",letterSpacing:"0.05em"}}>Needs</div>
                              {Object.entries(recipe.inputs).map(([item,qty])=>{
                                const has=inventory[item]||0;
                                return <div key={item} style={{fontFamily:SANS,fontSize:"0.7rem",color:has>=qty?"rgba(190,211,196,0.7)":"rgba(255,150,150,0.6)",marginBottom:1}}>{item.replace(/_/g," ")} {has}/{qty}</div>;
                              })}
                            </div>
                            <span style={{color:"rgba(190,211,196,0.2)",fontSize:"0.8rem"}}>→</span>
                            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                              <span style={{fontSize:"1.2rem"}}>{recipe.outputEmoji}</span>
                              <span style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.62rem",color:"rgba(190,211,196,0.5)",textAlign:"center"}}>{recipe.outputName}</span>
                            </div>
                          </div>
                          <button onClick={()=>{if(canCraft)craftItem(station.id,ri);}} style={{width:"100%",background:canCraft?"rgba(90,138,106,0.2)":"rgba(255,255,255,0.03)",border:`1px solid ${canCraft?"rgba(90,138,106,0.35)":"rgba(190,211,196,0.08)"}`,borderRadius:8,padding:"8px 12px",fontSize:"0.72rem",fontFamily:SANS,fontWeight:600,color:canCraft?"#BED3C4":"rgba(190,211,196,0.2)",cursor:canCraft?"pointer":"default"}}>{canCraft?"✦ Craft":"Craft"}</button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>}

        {/* ═══ PLANT SELECTION MODAL ═══ */}
        {plantModal&&<div style={{position:"fixed",inset:0,zIndex:300}}>
          <div onClick={()=>{setPlantModal(null);setPlantStep(1);setPlantPrayerId(null);}} style={{position:"absolute",inset:0,background:"rgba(6,8,4,0.7)",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",animation:"spaceFadeIn .2s ease"}}/>
          <div style={{position:"absolute",bottom:0,left:0,right:0,maxHeight:"75vh",background:"rgba(18,22,14,0.97)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",border:"1px solid rgba(90,138,106,0.2)",borderRadius:"20px 20px 0 0",padding:"24px 20px 32px",animation:"panelSlideUp .35s cubic-bezier(.22,1,.36,1) both",overflowY:"auto"}}>
            {isFarmMode?(
              <>
                <div style={{fontFamily:DISPLAY,fontSize:"1rem",fontWeight:700,color:"#BED3C4",marginBottom:4}}>Plant a Crop</div>
                <p style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.75rem",color:"rgba(190,211,196,0.4)",marginBottom:16}}>Use seeds from your inventory to plant crops.</p>
                <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10}}>
                  {FARM_PLANTS.map(plant=>{
                    const seedCount=inventory[plant.seedItem]||0;
                    const hasSeed=seedCount>0;
                    return(
                      <button key={plant.id} onClick={()=>{if(hasSeed){plantFarmSeed(plantModal,plant.id);setPlantModal(null);}}} style={{background:hasSeed?"rgba(90,138,106,0.06)":"rgba(255,255,255,0.02)",border:`1px solid ${hasSeed?"rgba(90,138,106,0.2)":"rgba(190,211,196,0.06)"}`,borderRadius:14,padding:"14px 10px",cursor:hasSeed?"pointer":"default",display:"flex",flexDirection:"column",alignItems:"center",gap:6,transition:"all .15s",opacity:hasSeed?1:0.4}}>
                        <span style={{fontSize:"1.4rem"}}>{plant.emoji}</span>
                        <span style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.78rem",color:"rgba(190,211,196,0.8)"}}>{plant.name}</span>
                        <span style={{fontFamily:SANS,fontSize:"0.68rem",fontWeight:600,color:hasSeed?"#BED3C4":"rgba(190,211,196,0.25)"}}>{hasSeed?`${seedCount} seed${seedCount>1?"s":""}`:"No seeds"}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            ):plantStep===1?(
              <>
                <div style={{fontFamily:DISPLAY,fontSize:"1rem",fontWeight:700,color:"#BED3C4",marginBottom:4}}>Choose a Prayer</div>
                <p style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.75rem",color:"rgba(190,211,196,0.4)",marginBottom:16}}>Select an active prayer to plant in your garden.</p>
                {availablePrayers.length===0?(
                  <p style={{fontFamily:SERIF,fontStyle:"italic",color:"rgba(190,211,196,0.3)",fontSize:"0.82rem",textAlign:"center",padding:"20px 0"}}>No available prayers. Post a new prayer on the prayer wall first.</p>
                ):(
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {availablePrayers.slice(0,8).map(prayer=>(
                      <button key={prayer.id} onClick={()=>{setPlantPrayerId(prayer.id);setPlantStep(2);}} style={{background:"rgba(90,138,106,0.06)",border:"1px solid rgba(90,138,106,0.15)",borderRadius:12,padding:"12px 14px",cursor:"pointer",textAlign:"left",transition:"all .15s"}} onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(90,138,106,0.35)"} onMouseLeave={e=>e.currentTarget.style.borderColor="rgba(90,138,106,0.15)"}>
                        <div style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.8rem",color:"rgba(190,211,196,0.75)",lineHeight:1.4}}>{prayer.text.slice(0,100)}{prayer.text.length>100?"…":""}</div>
                        <div style={{fontFamily:SANS,fontSize:"0.62rem",color:"rgba(190,211,196,0.3)",marginTop:4}}>{prayer.tag} · {prayer.date}</div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            ):(
              <>
                <button onClick={()=>setPlantStep(1)} style={{background:"transparent",border:"none",cursor:"pointer",color:"rgba(190,211,196,0.4)",fontSize:"0.75rem",fontFamily:SANS,padding:0,marginBottom:12}}>← Change prayer</button>
                <div style={{fontFamily:DISPLAY,fontSize:"1rem",fontWeight:700,color:"#BED3C4",marginBottom:4}}>Choose a Plant</div>
                <p style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.75rem",color:"rgba(190,211,196,0.4)",marginBottom:16}}>Each plant has a different cost and growth time.</p>
                <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10}}>
                  {GARDEN_PLANTS.map(plant=>{
                    const canAfford=candles>=plant.plantCost;
                    return(
                      <button key={plant.id} onClick={()=>{if(canAfford)plantSeed(plantModal,plantPrayerId,plant.id);}} style={{background:canAfford?"rgba(90,138,106,0.06)":"rgba(255,255,255,0.02)",border:`1px solid ${canAfford?"rgba(90,138,106,0.2)":"rgba(190,211,196,0.06)"}`,borderRadius:14,padding:"14px 10px",cursor:canAfford?"pointer":"default",display:"flex",flexDirection:"column",alignItems:"center",gap:6,transition:"all .15s",opacity:canAfford?1:0.4}}>
                        <span style={{fontSize:"1.4rem"}}>{plant.emoji}</span>
                        <span style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.78rem",color:"rgba(190,211,196,0.8)"}}>{plant.name}</span>
                        <span style={{fontFamily:SANS,fontSize:"0.68rem",fontWeight:600,color:canAfford?B.goldL:"rgba(190,211,196,0.25)"}}>🕯️ {plant.plantCost}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>}
        <MapHudButton/>
      </div>
    );
  }

  /* ══ ROOM SHOP ════════════════════════════════════ */
  if(screen==="shop"){
    const filteredItems=shopCategory==="all"?SHOP_ITEMS:SHOP_ITEMS.filter(i=>i.category===shopCategory);
    const cats=[{id:"all",label:"All"},{id:"furniture",label:"Furniture"},{id:"candles",label:"Candles"},{id:"decor",label:"Decor"}];
    return(
      <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#1A1208,#2A1E08)",color:"#FFF8E8",fontFamily:SANS}}>
        <style>{GFONTS}{CSS}</style>
        <DarkHeader title="🕯️ Room Shop" onBack={()=>setScreen("cabin")} extra={<div style={{display:"flex",alignItems:"center",gap:6,background:"rgba(212,180,100,0.1)",border:"1px solid rgba(212,180,100,0.2)",borderRadius:10,padding:"5px 12px"}}><span style={{fontSize:"0.9rem"}}>🕯️</span><span style={{fontFamily:DISPLAY,fontSize:"0.9rem",fontWeight:700,color:B.goldL}}>{candles}</span></div>}/>
        <main style={{maxWidth:"600px",margin:"0 auto",padding:"20px 18px 80px"}}>
          {/* Category filters */}
          <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
            {cats.map(c=><button key={c.id} onClick={()=>setShopCategory(c.id)} style={{background:shopCategory===c.id?"rgba(212,180,100,0.15)":"transparent",border:`1px solid ${shopCategory===c.id?"rgba(212,180,100,0.35)":"rgba(255,248,232,0.08)"}`,color:shopCategory===c.id?B.goldL:"rgba(255,248,232,0.4)",padding:"6px 16px",borderRadius:8,cursor:"pointer",fontSize:"0.78rem",fontFamily:SANS,fontWeight:shopCategory===c.id?600:400,transition:"all 0.15s"}}>{c.label}</button>)}
          </div>
          {/* Item grid */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:14}}>
            {filteredItems.map(item=>{
              const owned=ownedItems.includes(item.id);
              const canAfford=candles>=item.cost;
              return(
                <div key={item.id} style={{background:owned?"rgba(90,138,106,0.08)":"rgba(255,255,255,0.03)",border:`1px solid ${owned?"rgba(90,138,106,0.25)":"rgba(212,180,100,0.12)"}`,borderRadius:14,padding:"18px 14px",display:"flex",flexDirection:"column",alignItems:"center",gap:8,transition:"all 0.2s"}}>
                  {/* Item preview */}
                  <div style={{width:"60px",height:"60px",display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(255,255,255,0.03)",borderRadius:12,position:"relative"}}>
                    <img src={item.asset} alt={item.name} onError={e=>{e.target.style.display="none";e.target.nextSibling.style.display="flex";}} style={{maxWidth:"100%",maxHeight:"100%",objectFit:"contain"}}/>
                    <span style={{display:"none",fontSize:"1.8rem",alignItems:"center",justifyContent:"center",width:"100%",height:"100%"}}>{item.emoji}</span>
                  </div>
                  {/* Name */}
                  <div style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.82rem",color:"rgba(255,248,232,0.85)",textAlign:"center",lineHeight:1.3}}>{item.name}</div>
                  {/* Cost */}
                  <div style={{fontSize:"0.72rem",color:B.goldL,fontFamily:SANS,fontWeight:600}}>🕯️ {item.cost}</div>
                  {/* Buy / Owned button */}
                  {owned?(
                    <div style={{background:"rgba(90,138,106,0.15)",border:"1px solid rgba(90,138,106,0.2)",borderRadius:8,padding:"6px 16px",fontSize:"0.74rem",fontFamily:SANS,fontWeight:600,color:"rgba(190,211,196,0.7)"}}>✓ Owned</div>
                  ):(
                    <button onClick={()=>{if(canAfford)buyShopItem(item);}} style={{background:canAfford?"rgba(212,180,100,0.2)":"rgba(255,255,255,0.04)",border:`1px solid ${canAfford?"rgba(212,180,100,0.35)":"rgba(255,255,255,0.08)"}`,borderRadius:8,padding:"6px 16px",fontSize:"0.74rem",fontFamily:SANS,fontWeight:600,color:canAfford?B.goldL:"rgba(255,248,232,0.25)",cursor:canAfford?"pointer":"default",transition:"all 0.15s"}}>{canAfford?"Buy":"Not enough 🕯️"}</button>
                  )}
                </div>
              );
            })}
          </div>
          {filteredItems.length===0&&<p style={{fontFamily:SERIF,fontStyle:"italic",color:"rgba(255,248,232,0.3)",textAlign:"center",marginTop:40}}>No items in this category yet.</p>}
        </main>
        <MapHudButton/>
      </div>
    );
  }

  /* ══ HISTORY (Calendar) ═══════════════════════════ */
  if(screen==="history"){
    const MN=["January","February","March","April","May","June","July","August","September","October","November","December"];
    const DN=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    const firstDow=new Date(calYear,calMonth,1).getDay();
    const dim=new Date(calYear,calMonth+1,0).getDate();
    const today=todayStr();
    const isCurMonth=calMonth===new Date().getMonth()&&calYear===new Date().getFullYear();
    const todayD=new Date().getDate();
    const selStr=calSelectedDay?`${calYear}-${String(calMonth+1).padStart(2,"0")}-${String(calSelectedDay).padStart(2,"0")}`:null;
    const selEntries=selStr?(entriesByDate[selStr]||[]):[];
    const monthEntries=entries.filter(e=>{const[y,m]=e.date.split("-");return parseInt(y)===calYear&&parseInt(m)===calMonth+1;});
    const allR=[...REFLECTION_ROOMS,...COMMUNITY_ROOMS,LOCKED_ROOM,{id:"jesus",label:"Jesus Questions",emoji:"✝️"},{id:"viral",label:"Questions",emoji:"✦"},...SHELF_BOOKS.filter(b=>b.id!=="journal").map(b=>({id:b.id,label:b.label,emoji:b.emoji}))];

    return(
      <div style={{minHeight:"100vh",background:B.beige,color:B.ink,fontFamily:SANS}}>
        <style>{GFONTS}{CSS}</style>
        <DarkHeader title="📖 Reflection History" onBack={()=>setScreen("cabin")}/>
        <main style={{maxWidth:"700px",margin:"0 auto",padding:"20px 18px 80px"}}>

          {/* ── Month / Year Navigator ── */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18,padding:"0 4px"}}>
            <button onClick={()=>calNavigate("prev")} style={{background:B.white,border:`1px solid ${B.beigeD}`,borderRadius:"50%",width:36,height:36,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1rem",color:B.inkM,boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>‹</button>
            <div style={{textAlign:"center"}}>
              <div style={{fontFamily:DISPLAY,fontSize:"1.2rem",fontWeight:700,color:B.ink}}>{MN[calMonth]}</div>
              <div style={{fontFamily:SANS,fontSize:"0.68rem",color:B.inkLL,letterSpacing:"0.08em"}}>{calYear}</div>
            </div>
            <button onClick={()=>calNavigate("next")} style={{background:B.white,border:`1px solid ${B.beigeD}`,borderRadius:"50%",width:36,height:36,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1rem",color:B.inkM,boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>›</button>
          </div>

          {/* ── Calendar Grid ── */}
          <div style={{background:B.white,border:`1px solid ${B.beigeD}`,borderRadius:14,padding:"14px 10px",boxShadow:"0 1px 8px rgba(0,0,0,0.04)",marginBottom:20}}>
            {/* Day-of-week headers */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:6}}>
              {DN.map(d=><div key={d} style={{textAlign:"center",fontSize:"0.62rem",fontFamily:SANS,fontWeight:600,color:B.inkLL,letterSpacing:"0.06em",padding:"4px 0"}}>{d}</div>)}
            </div>
            {/* Day cells */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
              {Array.from({length:firstDow}).map((_,i)=><div key={`e${i}`} style={{aspectRatio:"1",padding:4}}/>)}
              {Array.from({length:dim}).map((_,i)=>{
                const day=i+1;
                const ds=`${calYear}-${String(calMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                const de=entriesByDate[ds]||[];
                const has=de.length>0;
                const isSel=calSelectedDay===day;
                const isT=isCurMonth&&day===todayD;
                return(
                  <button key={day} onClick={()=>{setCalSelectedDay(isSel?null:day);setExpandedEntry(null);}}
                    style={{aspectRatio:"1",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2,background:isSel?B.night:isT?"rgba(201,169,110,0.08)":"transparent",border:isT&&!isSel?`1px solid ${B.gold}`:"1px solid transparent",borderRadius:10,cursor:"pointer",position:"relative",transition:"all 0.15s"}}>
                    <span style={{fontSize:"0.82rem",fontFamily:SERIF,fontWeight:isSel||isT?700:400,color:isSel?B.goldL:isT?B.gold:has?B.ink:B.inkLL}}>{day}</span>
                    {has&&<div style={{display:"flex",gap:2,position:"absolute",bottom:3}}>
                      {de.slice(0,3).map((en,j)=><div key={j} style={{width:4,height:4,borderRadius:"50%",background:isSel?B.goldL:th(en.roomId).accent,opacity:isSel?0.8:0.7}}/>)}
                    </div>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Month summary (no day selected) ── */}
          {!calSelectedDay&&<div style={{textAlign:"center",padding:"12px 0"}}>
            <p style={{fontFamily:SERIF,fontStyle:"italic",color:B.inkL,fontSize:"0.85rem",lineHeight:1.6}}>
              {monthEntries.length>0?`${monthEntries.length} reflection${monthEntries.length===1?"":"s"} this month. Tap a day to explore.`:"No reflections this month yet."}
            </p>
          </div>}

          {/* ── Selected day: entries found ── */}
          {calSelectedDay&&selEntries.length>0&&<div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,padding:"0 4px"}}>
              <div style={{width:3,height:16,background:B.gold,borderRadius:2}}/>
              <span style={{fontFamily:DISPLAY,fontSize:"1rem",fontWeight:700,color:B.ink}}>{MN[calMonth]} {calSelectedDay}, {calYear}</span>
              <span style={{fontFamily:SANS,fontSize:"0.7rem",color:B.inkLL,marginLeft:"auto"}}>{selEntries.length} {selEntries.length===1?"entry":"entries"}</span>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:9}}>
              {selEntries.map((e,idx)=>{
                const room=allR.find(r=>r.id===e.roomId)||{emoji:e.roomEmoji||"📝",label:e.roomLabel||"Reflection"};
                const t=th(e.roomId)||th("fear");
                const isExp=expandedEntry===e.id;
                return(
                  <div key={e.id} onClick={()=>setExpandedEntry(isExp?null:e.id)} style={{background:B.white,border:`1px solid ${B.beigeD}`,borderRadius:12,padding:"16px 18px",boxShadow:"0 1px 6px rgba(0,0,0,0.04)",cursor:"pointer",transition:"all 0.2s",borderLeft:`3px solid ${t.accent}`,animation:`fadeUp .45s ${idx*.08}s ease both`}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                      <span>{room.emoji}</span>
                      <span style={{fontSize:"0.77rem",fontWeight:600,color:t.accent,fontFamily:SANS}}>{room.label}{typeof e.day==="number"?` · Day ${e.day+1}`:""}</span>
                      <span style={{marginLeft:"auto",fontSize:"0.68rem",color:B.inkLL}}>{e.words} words</span>
                    </div>
                    <div style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.82rem",color:B.inkL,marginBottom:8,lineHeight:1.55,borderLeft:`2px solid ${B.beigeD}`,paddingLeft:11}}>{e.prompt}</div>
                    <div style={{fontFamily:SERIF,fontSize:"0.93rem",color:B.ink,lineHeight:1.75,whiteSpace:isExp?"pre-wrap":"normal"}}>{isExp?e.text:(e.text.length>240?e.text.slice(0,240)+"…":e.text)}</div>
                    {!isExp&&e.text.length>240&&<div style={{fontFamily:SANS,fontSize:"0.7rem",color:B.gold,marginTop:6,fontWeight:500}}>Tap to read more</div>}
                    {isExp&&<div style={{fontFamily:SANS,fontSize:"0.7rem",color:B.inkLL,marginTop:8,fontWeight:500}}>Tap to collapse</div>}
                  </div>
                );
              })}
            </div>
          </div>}

          {/* ── Selected day: no entries ── */}
          {calSelectedDay&&selEntries.length===0&&<div style={{background:B.white,borderRadius:12,padding:"32px 24px",textAlign:"center",border:`1px solid ${B.beigeD}`}}>
            <div style={{fontSize:"1.4rem",marginBottom:8}}>🌙</div>
            <p style={{fontFamily:SERIF,fontStyle:"italic",color:B.inkL,margin:"0 0 14px",fontSize:"0.88rem"}}>No reflections on this day.</p>
            <button onClick={()=>setScreen("cabin")} style={{background:B.night,border:"none",color:B.goldL,padding:"9px 22px",borderRadius:8,cursor:"pointer",fontSize:"0.8rem",fontFamily:SANS,fontWeight:600}}>Start reflecting</button>
          </div>}

          {/* ── Global empty state ── */}
          {entries.length===0&&<div style={{background:B.white,borderRadius:12,padding:"48px 28px",textAlign:"center",border:`1px solid ${B.beigeD}`,marginTop:16}}>
            <div style={{fontSize:"1.8rem",marginBottom:12}}>📖</div>
            <p style={{fontFamily:SERIF,fontStyle:"italic",color:B.inkL,margin:"0 0 18px"}}>Your reflections will live here.</p>
            <button onClick={()=>setScreen("cabin")} style={{background:B.night,border:"none",color:B.goldL,padding:"11px 26px",borderRadius:8,cursor:"pointer",fontSize:"0.83rem",fontFamily:SANS,fontWeight:600}}>Begin →</button>
          </div>}

        </main>
        <MapHudButton/>
      </div>
    );
  }

  /* ══ MARKET — Placeholder ═══════════════════════ */
  /* ══ KITCHEN — Immersive downstairs kitchen with stove ══════════════ */
  if(screen==="kitchen"){
    return(
      <div style={{position:"fixed",inset:0,overflow:"hidden",fontFamily:SANS,background:"#0A0604"}}>
        <style>{GFONTS}{CSS}</style>
        <ImmersiveKitchen/>
        {/* UI layer on top of immersive background */}
        <div style={{position:"relative",zIndex:10,height:"100%",pointerEvents:"none"}}>

          {/* ── STOVE HOTSPOT — black cast iron stove, FAR LEFT ── */}
          <button onClick={()=>transitionToStove()} style={{position:"absolute",left:"0%",top:"46%",width:"15%",height:"28%",pointerEvents:"auto",zIndex:11,background:"transparent",border:"none",padding:0,cursor:"pointer",outline:"none",WebkitTapHighlightColor:"transparent"}}>
            {/* Warm fire glow emanating from stove — natural, not a box */}
            <div style={{position:"absolute",inset:"-30% -40% -20% -30%",borderRadius:"50%",background:"radial-gradient(ellipse at 55% 60%, rgba(255,120,30,0.14) 0%, rgba(255,90,10,0.06) 40%, transparent 72%)",pointerEvents:"none",animation:"kitchenFireGlow 3s ease-in-out infinite"}}/>
            <div style={{position:"absolute",inset:"-15%",borderRadius:"50%",background:"radial-gradient(ellipse at 50% 70%, rgba(255,160,50,0.08) 0%, transparent 60%)",pointerEvents:"none",animation:"kitchenFireGlow 4s ease-in-out infinite",animationDelay:"0.8s"}}/>
          </button>

          {/* ── STAIRS HOTSPOT — wooden stairs, FAR RIGHT → back upstairs ── */}
          <button onClick={()=>{setSpaceTransit(true);setTransitDir("toCabin");setTimeout(()=>{setScreen("cabin");setSpaceTransit(false);setTransitDir(null);},700);}} style={{position:"absolute",right:"0%",top:"18%",width:"14%",height:"55%",pointerEvents:"auto",zIndex:11,background:"transparent",border:"none",padding:0,cursor:"pointer",outline:"none",WebkitTapHighlightColor:"transparent"}}>
            {/* Candlelight glow along the stairs — natural warm light */}
            <div style={{position:"absolute",inset:"-15% -25% -10% -20%",borderRadius:"40%",background:"radial-gradient(ellipse at 40% 45%, rgba(255,190,80,0.08) 0%, rgba(255,160,60,0.03) 45%, transparent 70%)",pointerEvents:"none",animation:"kitchenFireGlow 5s ease-in-out infinite",animationDelay:"1.5s"}}/>
            <div style={{position:"absolute",left:"-10%",top:"10%",width:"80%",height:"80%",borderRadius:"30%",background:"linear-gradient(to top, rgba(255,180,70,0.04) 0%, rgba(255,200,100,0.07) 40%, rgba(255,180,70,0.03) 70%, transparent 100%)",pointerEvents:"none",animation:"kitchenFireGlow 4s ease-in-out infinite",animationDelay:"0.5s"}}/>
          </button>

          {/* ── WINDOW HOTSPOT — waterfall window, BACK CENTER → prayer spot ── */}
          <button onClick={()=>transitionToWindow()} style={{position:"absolute",left:"34%",top:"8%",width:"32%",height:"32%",pointerEvents:"auto",zIndex:11,background:"transparent",border:"none",padding:0,cursor:"pointer",outline:"none",WebkitTapHighlightColor:"transparent"}}>
            <div style={{position:"absolute",left:"30%",top:"20%",width:"40%",height:"70%",borderRadius:"50%",background:"radial-gradient(circle,rgba(180,220,255,0.30) 0%,rgba(160,200,240,0.12) 40%,transparent 72%)",pointerEvents:"none",animation:"hotspotPulse 2.6s ease-in-out infinite"}}/>
            <div style={{position:"absolute",left:"35%",top:"30%",width:"30%",height:"50%",borderRadius:"50%",background:"radial-gradient(circle,rgba(200,235,255,0.22) 0%,transparent 55%)",pointerEvents:"none",animation:"hotspotPulse 3.1s ease-in-out infinite",animationDelay:"0.5s"}}/>
          </button>

        </div>
        {/* Walk-to-stove zoom animation — zooms toward left-center stove area */}
        {stoveZoom&&(
          <div style={{position:"fixed",inset:0,zIndex:9998,overflow:"hidden",pointerEvents:"all"}}>
            <div style={{position:"absolute",inset:0,transformOrigin:"8% 58%",animation:"walkToStoveZoom 1.2s cubic-bezier(0.4,0,0.2,1) forwards"}}>
              <img src={KITCHEN_BG_IMAGE} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} draggable={false}/>
              {/* Fire glow intensifies during zoom */}
              <div style={{position:"absolute",left:"0%",top:"46%",width:"16%",height:"28%",borderRadius:"50%",background:"radial-gradient(ellipse at 55% 60%,rgba(255,140,40,0.30) 0%,rgba(255,100,20,0.10) 40%,transparent 70%)",mixBlendMode:"screen"}}/>
            </div>
            <div style={{position:"fixed",inset:0,background:"#080402",animation:"walkToStoveVignette 1.2s cubic-bezier(0.4,0,0.2,1) forwards"}}/>
          </div>
        )}
        {/* Walk-to-window zoom animation — zooms toward back-center window */}
        {windowZoom&&(
          <div style={{position:"fixed",inset:0,zIndex:9998,overflow:"hidden",pointerEvents:"all"}}>
            <div style={{position:"absolute",inset:0,transformOrigin:"50% 22%",animation:"walkToWindowZoom 1.2s cubic-bezier(0.4,0,0.2,1) forwards"}}>
              <img src={KITCHEN_BG_IMAGE} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} draggable={false}/>
              {/* Window light intensifies during zoom */}
              <div style={{position:"absolute",left:"34%",top:"8%",width:"32%",height:"32%",borderRadius:"30%",background:"radial-gradient(ellipse at 50% 50%,rgba(180,220,255,0.25) 0%,rgba(140,190,240,0.08) 45%,transparent 70%)",mixBlendMode:"screen"}}/>
            </div>
            <div style={{position:"fixed",inset:0,background:"#080604",animation:"walkToWindowVignette 1.2s cubic-bezier(0.4,0,0.2,1) forwards"}}/>
          </div>
        )}
        {spaceTransit&&<div style={{position:"fixed",inset:0,zIndex:9999,background:"#0A0806",animation:"spaceFadeIn .6s ease both",pointerEvents:"all"}}/>}
        <MapHudButton/>
      </div>
    );
  }

  /* ══ STOVE — Immersive cooking closeup ══════════════════════════════ */
  if(screen==="stove"){
    return(
      <div style={{position:"fixed",inset:0,overflow:"hidden",fontFamily:SANS,background:"#080402"}}>
        <style>{GFONTS}{CSS}</style>
        <ImmersiveStove/>
        {/* UI layer */}
        <div style={{position:"relative",zIndex:10,height:"100%",display:"flex",flexDirection:"column"}}>
          {/* Header */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"20px 18px 10px"}}>
            <button onClick={()=>{setSpaceTransit(true);setTransitDir("toKitchen");setTimeout(()=>{setScreen("kitchen");setSpaceTransit(false);setTransitDir(null);},700);}} style={{background:"rgba(10,6,4,0.45)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",border:"1px solid rgba(201,169,110,0.12)",borderRadius:999,padding:"8px 20px",cursor:"pointer",color:"rgba(255,248,232,0.55)",fontFamily:SANS,fontSize:"0.78rem",display:"inline-flex",alignItems:"center",gap:6}}>
              ← Kitchen
            </button>
            <div style={{fontFamily:DISPLAY,fontSize:"0.95rem",fontWeight:700,color:"rgba(255,240,210,0.65)",textShadow:"0 2px 8px rgba(0,0,0,0.6)"}}>Cooking Fire</div>
            <div style={{width:80}}/>
          </div>
          {/* Recipe grid */}
          <div style={{flex:1,overflowY:"auto",padding:"10px 18px 80px",display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12,alignContent:"start"}}>
            {KITCHEN_RECIPES.map(recipe=>{
              const canCook=hasIngredients(recipe.inputs);
              return(
                <div key={recipe.id} style={{background:"rgba(18,14,8,0.85)",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",border:`1px solid ${canCook?"rgba(212,180,100,0.2)":"rgba(201,169,110,0.08)"}`,borderRadius:14,padding:"14px 12px",display:"flex",flexDirection:"column",gap:8,animation:"fadeUp .5s ease both"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:"1.4rem"}}>{recipe.emoji}</span>
                    <span style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.82rem",color:"rgba(255,240,210,0.8)",flex:1}}>{recipe.name}</span>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:3}}>
                    {Object.entries(recipe.inputs).map(([ing,qty])=>{
                      const owned=inventory[ing]||0;
                      const enough=owned>=qty;
                      const catItem=ITEM_CATALOG[ing];
                      return(
                        <div key={ing} style={{display:"flex",alignItems:"center",gap:4,fontSize:"0.65rem",fontFamily:SANS}}>
                          <span>{catItem?.emoji||"📦"}</span>
                          <span style={{color:enough?"rgba(190,211,196,0.6)":"rgba(255,120,100,0.6)"}}>{catItem?.name||ing}: {owned}/{qty}</span>
                        </div>
                      );
                    })}
                  </div>
                  <button onClick={()=>{
                    if(!canCook) return;
                    Object.entries(recipe.inputs).forEach(([ing,qty])=>removeFromInventory(ing,qty));
                    addToInventory(recipe.output,recipe.qty);
                    setCandleReward({amount:1,message:`Cooked ${recipe.name}!`});
                    setTimeout(()=>setCandleReward(null),2500);
                  }} disabled={!canCook} style={{background:canCook?"rgba(212,180,100,0.15)":"rgba(255,255,255,0.03)",border:`1px solid ${canCook?"rgba(212,180,100,0.3)":"rgba(201,169,110,0.08)"}`,borderRadius:10,padding:"8px 0",cursor:canCook?"pointer":"default",fontFamily:SANS,fontSize:"0.75rem",fontWeight:600,color:canCook?B.goldL:"rgba(201,169,110,0.2)",transition:"all .15s",opacity:canCook?1:0.5}}>
                    Cook
                  </button>
                </div>
              );
            })}
          </div>
        </div>
        {spaceTransit&&<div style={{position:"fixed",inset:0,zIndex:9999,background:"#0A0806",animation:"spaceFadeIn .6s ease both",pointerEvents:"all"}}/>}
        {candleReward&&<div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",zIndex:200,background:"rgba(18,14,8,0.95)",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",border:"1px solid rgba(212,180,100,0.3)",borderRadius:18,padding:"24px 32px",textAlign:"center",animation:"fadeUp .3s ease both",boxShadow:"0 8px 32px rgba(0,0,0,0.6)"}}>
          <div style={{fontSize:"1.8rem",marginBottom:8}}>🍳</div>
          <div style={{fontFamily:DISPLAY,fontSize:"1rem",fontWeight:700,color:B.goldL}}>{candleReward.message}</div>
        </div>}
        <MapHudButton/>
      </div>
    );
  }

  /* ══ KITCHEN WINDOW — Calm waterfall prayer spot ══════════════════════ */
  if(screen==="kitchen-window"){
    return(
      <div style={{position:"fixed",inset:0,overflow:"hidden",fontFamily:SANS,background:"#0E0A08"}}>
        <style>{GFONTS}{CSS}</style>
        <ImmersiveKitchenWindow/>
        {/* UI layer */}
        <div style={{position:"relative",zIndex:10,height:"100%",pointerEvents:"none"}}>
          {/* Back to kitchen button */}
          <button onClick={()=>{setSpaceTransit(true);setTransitDir("toKitchen");setTimeout(()=>{setScreen("kitchen");setSpaceTransit(false);setTransitDir(null);},700);}} style={{position:"absolute",top:28,left:22,pointerEvents:"auto",background:"rgba(10,8,6,0.50)",backdropFilter:"blur(14px)",WebkitBackdropFilter:"blur(14px)",border:"1px solid rgba(180,200,220,0.10)",borderRadius:999,padding:"8px 20px",cursor:"pointer",color:"rgba(220,230,240,0.55)",fontFamily:SANS,fontSize:"0.78rem",transition:"all 0.3s",display:"inline-flex",alignItems:"center",gap:6,zIndex:15}}>
            Back to kitchen
          </button>
          {/* Sound toggle — top right */}
          <button onClick={toggleAmbientMute} style={{position:"absolute",top:28,right:22,pointerEvents:"auto",width:40,height:40,borderRadius:"50%",background:"rgba(10,8,6,0.45)",backdropFilter:"blur(14px)",WebkitBackdropFilter:"blur(14px)",border:"1px solid rgba(180,200,220,0.10)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",zIndex:15,transition:"all 0.3s",animation:"fadeUp .6s .8s ease both",opacity:0}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(220,230,240,0.55)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              {ambientMuted?<>
                <line x1="23" y1="9" x2="17" y2="15"/>
                <line x1="17" y1="9" x2="23" y2="15"/>
              </>:<>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
              </>}
            </svg>
          </button>
          {/* Prayer spot — centered atmospheric text */}
          <div style={{position:"absolute",bottom:"12%",left:"50%",transform:"translateX(-50%)",pointerEvents:"none",textAlign:"center",animation:"fadeUp 1s ease both .5s",opacity:0,width:"80%",maxWidth:360}}>
            <p style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"1.1rem",color:"rgba(220,230,240,0.35)",textShadow:"0 2px 12px rgba(0,0,0,0.9)",margin:0,lineHeight:1.6}}>Be still, and know...</p>
            <p style={{fontFamily:SANS,fontSize:"0.72rem",color:"rgba(200,210,220,0.22)",marginTop:10,letterSpacing:"0.04em"}}>guided prayer coming soon</p>
          </div>
        </div>
        {spaceTransit&&<div style={{position:"fixed",inset:0,zIndex:9999,background:"#0A0806",animation:"spaceFadeIn .6s ease both",pointerEvents:"all"}}/>}
        <MapHudButton/>
      </div>
    );
  }

  if(screen==="market"){
    return(
      <div style={{position:"fixed",inset:0,overflow:"hidden",fontFamily:SANS}}>
        <style>{GFONTS}{CSS}</style>
        <ImmersiveMarket/>

        {/* ── Back to village ── */}
        <button onClick={()=>{setMarketStall(null);setShopStall(null);setScreen("map");}} style={{position:"absolute",top:20,left:16,zIndex:14,background:"rgba(10,8,16,0.55)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",border:"1px solid rgba(201,169,110,0.15)",borderRadius:999,padding:"8px 20px",cursor:"pointer",color:"rgba(255,248,232,0.6)",fontFamily:SANS,fontSize:"0.78rem",transition:"all 0.2s",display:"inline-flex",alignItems:"center",gap:6,animation:"fadeUp .6s ease both"}}>
          Back to village
        </button>

        {/* ── Market stall hotspots ── */}
        {/* Harvest Market — left stall */}
        <button onClick={()=>setMarketStall("harvest")} style={{position:"absolute",left:"2%",top:"20%",width:"30%",height:"35%",zIndex:11,background:"transparent",border:"none",padding:0,cursor:"pointer",outline:"none",WebkitTapHighlightColor:"transparent"}}>
          <div style={{position:"absolute",left:"25%",top:"15%",width:"55%",height:"50%",borderRadius:"50%",background:"radial-gradient(circle,rgba(255,210,120,0.28) 0%,rgba(255,180,80,0.10) 40%,transparent 72%)",pointerEvents:"none",animation:"hotspotPulse 3s ease-in-out infinite"}}/>
          <div style={{position:"absolute",left:"32%",top:"22%",width:"40%",height:"38%",borderRadius:"50%",background:"radial-gradient(circle,rgba(255,240,170,0.18) 0%,transparent 55%)",pointerEvents:"none",animation:"hotspotPulse 3.5s ease-in-out infinite",animationDelay:"0.6s"}}/>
        </button>

        {/* General Shop — center stall */}
        <button onClick={()=>setShopStall("general")} style={{position:"absolute",left:"33%",top:"18%",width:"34%",height:"38%",zIndex:11,background:"transparent",border:"none",padding:0,cursor:"pointer",outline:"none",WebkitTapHighlightColor:"transparent"}}>
          <div style={{position:"absolute",left:"22%",top:"18%",width:"56%",height:"48%",borderRadius:"50%",background:"radial-gradient(circle,rgba(255,215,130,0.28) 0%,rgba(255,190,90,0.10) 40%,transparent 72%)",pointerEvents:"none",animation:"hotspotPulse 2.8s ease-in-out infinite",animationDelay:"0.4s"}}/>
          <div style={{position:"absolute",left:"30%",top:"25%",width:"40%",height:"36%",borderRadius:"50%",background:"radial-gradient(circle,rgba(255,245,180,0.18) 0%,transparent 55%)",pointerEvents:"none",animation:"hotspotPulse 3.3s ease-in-out infinite",animationDelay:"1s"}}/>
        </button>

        {/* Barter Post — right stall */}
        <button onClick={()=>setShopStall("barter")} style={{position:"absolute",right:"2%",top:"20%",width:"30%",height:"35%",zIndex:11,background:"transparent",border:"none",padding:0,cursor:"pointer",outline:"none",WebkitTapHighlightColor:"transparent"}}>
          <div style={{position:"absolute",left:"20%",top:"15%",width:"55%",height:"50%",borderRadius:"50%",background:"radial-gradient(circle,rgba(255,210,120,0.28) 0%,rgba(255,180,80,0.10) 40%,transparent 72%)",pointerEvents:"none",animation:"hotspotPulse 3.2s ease-in-out infinite",animationDelay:"0.8s"}}/>
          <div style={{position:"absolute",left:"28%",top:"22%",width:"40%",height:"38%",borderRadius:"50%",background:"radial-gradient(circle,rgba(255,240,170,0.18) 0%,transparent 55%)",pointerEvents:"none",animation:"hotspotPulse 3.6s ease-in-out infinite",animationDelay:"1.4s"}}/>
        </button>

        {/* ── Coming soon overlay — bottom of path ── */}
        {!marketStall&&!shopStall&&(
          <div style={{position:"absolute",bottom:24,left:"50%",transform:"translateX(-50%)",zIndex:14,background:"rgba(10,8,16,0.55)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",border:"1px solid rgba(201,169,110,0.15)",borderRadius:14,padding:"12px 28px",textAlign:"center",animation:"fadeUp .8s .4s ease both"}}>
            <p style={{fontFamily:SERIF,fontStyle:"italic",color:"rgba(255,248,232,0.4)",fontSize:"0.85rem",margin:0}}>Tap a stall to browse...</p>
          </div>
        )}

        {/* ── HARVEST MARKET CLOSE-UP ── */}
        {marketStall==="harvest"&&(()=>{
          const sellableItems=Object.entries(inventory).filter(([k,v])=>v>0&&ITEM_CATALOG[k]&&ITEM_CATALOG[k].sellPrice).map(([k,v])=>({id:k,...ITEM_CATALOG[k],owned:v}));
          const basketTotal=sellBasket.reduce((s,b)=>(ITEM_CATALOG[b.itemId]?s+ITEM_CATALOG[b.itemId].sellPrice*b.qty:s),0);
          const oldestListing=sellBasket.length?Math.min(...sellBasket.map(b=>b.listedAt)):null;
          const msLeft=oldestListing?(oldestListing+30*60*1000-Date.now()):null;
          const minsLeft=msLeft!==null?Math.max(0,Math.ceil(msLeft/60000)):null;
          return(
          <div style={{position:"fixed",inset:0,zIndex:100,background:"#0A0810",animation:"overlayFadeIn .35s ease both",display:"flex",flexDirection:"column"}}>
            <header style={{position:"relative",zIndex:10,background:"rgba(10,8,16,0.75)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",padding:"0 16px",height:54,display:"flex",alignItems:"center",gap:10,borderBottom:"1px solid rgba(201,169,110,0.12)",flexShrink:0}}>
              <button onClick={()=>setMarketStall(null)} style={{background:"transparent",border:"none",cursor:"pointer",color:"rgba(255,240,200,0.55)",fontSize:"0.8rem",fontFamily:SANS,padding:"4px 0"}}>{"< Market"}</button>
              <div style={{height:14,width:1,background:"rgba(201,169,110,0.18)"}}/>
              <span style={{fontFamily:SERIF,fontStyle:"italic",color:"rgba(255,240,200,0.75)",fontSize:"0.92rem"}}>Harvest Market</span>
              <div style={{marginLeft:"auto",fontFamily:SANS,fontSize:"0.75rem",color:"rgba(255,210,120,0.7)"}}>{bank.coins} coins</div>
            </header>
            <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
              <div style={{position:"relative",width:"100%",maxHeight:"40vh",overflow:"hidden"}}>
                <img src="/harvest-market.png" alt="Harvest Market stall" style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"center 30%",display:"block"}}/>
                <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 50% 40%, rgba(255,190,80,0.08) 0%, transparent 60%)",mixBlendMode:"screen",pointerEvents:"none"}}/>
                <div style={{position:"absolute",bottom:0,left:0,right:0,height:"40%",background:"linear-gradient(to top, #0A0810 0%, rgba(10,8,16,0.6) 50%, transparent 100%)",pointerEvents:"none"}}/>
              </div>
              <div style={{maxWidth:600,margin:"-30px auto 0",padding:"0 22px 80px",position:"relative",zIndex:2}}>
                <h2 style={{fontFamily:DISPLAY,fontSize:"1.4rem",fontWeight:700,color:"rgba(255,240,200,0.85)",margin:"0 0 6px"}}>Harvest Market</h2>
                <p style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.82rem",color:"rgba(255,240,200,0.4)",margin:"0 0 18px"}}>List your goods for sale. Items sell automatically after 30 minutes.</p>

                {/* Sell Basket */}
                {sellBasket.length>0&&(
                  <div style={{background:"rgba(255,240,200,0.04)",border:"1px solid rgba(201,169,110,0.15)",borderRadius:14,padding:"14px 16px",marginBottom:16}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                      <span style={{fontFamily:SANS,fontSize:"0.78rem",color:"rgba(255,240,200,0.6)",fontWeight:600}}>Listed for Sale</span>
                      {minsLeft!==null&&<span style={{fontFamily:SANS,fontSize:"0.72rem",color:"rgba(255,210,120,0.6)"}}>Sells in ~{minsLeft} min</span>}
                    </div>
                    {sellBasket.map((b,i)=>{
                      const cat=ITEM_CATALOG[b.itemId];
                      return(
                        <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 0",borderTop:i?"1px solid rgba(201,169,110,0.08)":"none"}}>
                          <span style={{fontSize:"1.1rem"}}>{cat?cat.emoji:"?"}</span>
                          <span style={{fontFamily:SANS,fontSize:"0.82rem",color:"rgba(255,240,200,0.65)",flex:1}}>{cat?cat.name:b.itemId} x{b.qty}</span>
                          <span style={{fontFamily:SANS,fontSize:"0.75rem",color:"rgba(255,210,120,0.6)"}}>{cat?cat.sellPrice*b.qty:0}c</span>
                          <button onClick={()=>{
                            addToInventory(b.itemId,b.qty);
                            const nb=[...sellBasket];nb.splice(i,1);persistSellBasket(nb);
                          }} style={{background:"rgba(255,100,100,0.15)",border:"1px solid rgba(255,100,100,0.2)",borderRadius:8,padding:"3px 8px",cursor:"pointer",color:"rgba(255,160,160,0.8)",fontFamily:SANS,fontSize:"0.68rem"}}>Remove</button>
                        </div>
                      );
                    })}
                    <div style={{display:"flex",justifyContent:"space-between",marginTop:10,paddingTop:8,borderTop:"1px solid rgba(201,169,110,0.12)"}}>
                      <span style={{fontFamily:SANS,fontSize:"0.78rem",color:"rgba(255,240,200,0.5)"}}>Total when sold:</span>
                      <span style={{fontFamily:SANS,fontSize:"0.85rem",color:"rgba(255,210,120,0.85)",fontWeight:600}}>{basketTotal} coins</span>
                    </div>
                  </div>
                )}

                {/* Add items to sell */}
                <h3 style={{fontFamily:SANS,fontSize:"0.82rem",color:"rgba(255,240,200,0.55)",margin:"0 0 10px",fontWeight:600}}>Your Goods</h3>
                {sellableItems.length===0&&(
                  <p style={{fontFamily:SERIF,fontStyle:"italic",color:"rgba(255,240,200,0.25)",fontSize:"0.82rem"}}>No sellable items in inventory. Grow crops and cook food to sell here.</p>
                )}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  {sellableItems.map((item,i)=>(
                    <div key={item.id} style={{background:"rgba(255,240,200,0.04)",border:"1px solid rgba(201,169,110,0.12)",borderRadius:12,padding:"12px",animation:`fadeUp .4s ${0.1+i*0.05}s ease both`,opacity:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                        <span style={{fontSize:"1.2rem"}}>{item.emoji}</span>
                        <div>
                          <p style={{fontFamily:SANS,fontSize:"0.78rem",color:"rgba(255,240,200,0.65)",margin:0,fontWeight:500}}>{item.name}</p>
                          <p style={{fontFamily:SANS,fontSize:"0.68rem",color:"rgba(255,210,120,0.5)",margin:0}}>{item.sellPrice}c each | Own: {item.owned}</p>
                        </div>
                      </div>
                      <button onClick={()=>{
                        if(removeFromInventory(item.id,1)){
                          const existing=sellBasket.find(b=>b.itemId===item.id);
                          if(existing){
                            const nb=sellBasket.map(b=>b.itemId===item.id?{...b,qty:b.qty+1}:b);
                            persistSellBasket(nb);
                          }else{
                            persistSellBasket([...sellBasket,{itemId:item.id,qty:1,listedAt:Date.now()}]);
                          }
                        }
                      }} style={{width:"100%",padding:"6px 0",background:"rgba(201,169,110,0.12)",border:"1px solid rgba(201,169,110,0.2)",borderRadius:8,cursor:"pointer",color:"rgba(255,240,200,0.7)",fontFamily:SANS,fontSize:"0.72rem",transition:"all 0.15s"}}>
                        List 1 for Sale
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          );
        })()}

        {/* ── GENERAL SHOP OVERLAY ── */}
        {shopStall==="general"&&(()=>{
          const shopItems=Object.entries(ITEM_CATALOG).filter(([k,v])=>v.buyPrice).map(([k,v])=>({id:k,...v}));
          const shopCats=[...new Set(shopItems.map(i=>i.cat))];
          const filteredShop=inventoryTab==="all"?shopItems:shopItems.filter(i=>i.cat===inventoryTab);
          return(
          <div style={{position:"fixed",inset:0,zIndex:100,background:"#0A0810",animation:"overlayFadeIn .35s ease both",display:"flex",flexDirection:"column"}}>
            <header style={{position:"relative",zIndex:10,background:"rgba(10,8,16,0.75)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",padding:"0 16px",height:54,display:"flex",alignItems:"center",gap:10,borderBottom:"1px solid rgba(201,169,110,0.12)",flexShrink:0}}>
              <button onClick={()=>setShopStall(null)} style={{background:"transparent",border:"none",cursor:"pointer",color:"rgba(255,240,200,0.55)",fontSize:"0.8rem",fontFamily:SANS,padding:"4px 0"}}>{"< Market"}</button>
              <div style={{height:14,width:1,background:"rgba(201,169,110,0.18)"}}/>
              <span style={{fontFamily:SERIF,fontStyle:"italic",color:"rgba(255,240,200,0.75)",fontSize:"0.92rem"}}>General Shop</span>
              <div style={{marginLeft:"auto",fontFamily:SANS,fontSize:"0.75rem",color:"rgba(255,210,120,0.7)"}}>{bank.coins} coins</div>
            </header>
            <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
              <div style={{maxWidth:600,margin:"0 auto",padding:"18px 22px 80px"}}>
                <h2 style={{fontFamily:DISPLAY,fontSize:"1.4rem",fontWeight:700,color:"rgba(255,240,200,0.85)",margin:"0 0 6px"}}>General Shop</h2>
                <p style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.82rem",color:"rgba(255,240,200,0.4)",margin:"0 0 14px"}}>Buy seeds, ingredients, and supplies with coins.</p>

                {/* Category tabs */}
                <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
                  {["all",...shopCats].map(c=>(
                    <button key={c} onClick={()=>setInventoryTab(c)} style={{padding:"5px 12px",borderRadius:20,border:"1px solid "+(inventoryTab===c?"rgba(201,169,110,0.4)":"rgba(201,169,110,0.12)"),background:inventoryTab===c?"rgba(201,169,110,0.15)":"transparent",color:inventoryTab===c?"rgba(255,240,200,0.8)":"rgba(255,240,200,0.4)",fontFamily:SANS,fontSize:"0.72rem",cursor:"pointer",textTransform:"capitalize"}}>{c}</button>
                  ))}
                </div>

                {/* Item grid */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  {filteredShop.map((item,i)=>(
                    <div key={item.id} style={{background:"rgba(255,240,200,0.04)",border:"1px solid rgba(201,169,110,0.12)",borderRadius:12,padding:"12px",animation:`fadeUp .4s ${0.1+i*0.05}s ease both`,opacity:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                        <span style={{fontSize:"1.2rem"}}>{item.emoji}</span>
                        <div>
                          <p style={{fontFamily:SANS,fontSize:"0.78rem",color:"rgba(255,240,200,0.65)",margin:0,fontWeight:500}}>{item.name}</p>
                          <p style={{fontFamily:SANS,fontSize:"0.68rem",color:"rgba(255,210,120,0.5)",margin:0}}>{item.buyPrice}c | Own: {inventory[item.id]||0}</p>
                        </div>
                      </div>
                      <button onClick={()=>{
                        if(spendCoins(item.buyPrice)){
                          addToInventory(item.id,1);
                          setToast({msg:`Bought ${item.name}!`,emoji:item.emoji});
                        }else{
                          setToast({msg:"Not enough coins!",emoji:"..."});
                        }
                      }} disabled={bank.coins<item.buyPrice} style={{width:"100%",padding:"6px 0",background:bank.coins>=item.buyPrice?"rgba(201,169,110,0.12)":"rgba(255,240,200,0.03)",border:"1px solid "+(bank.coins>=item.buyPrice?"rgba(201,169,110,0.2)":"rgba(201,169,110,0.08)"),borderRadius:8,cursor:bank.coins>=item.buyPrice?"pointer":"default",color:bank.coins>=item.buyPrice?"rgba(255,240,200,0.7)":"rgba(255,240,200,0.25)",fontFamily:SANS,fontSize:"0.72rem",transition:"all 0.15s",opacity:bank.coins>=item.buyPrice?1:0.5}}>
                        Buy for {item.buyPrice}c
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          );
        })()}

        {/* ── BARTER POST OVERLAY ── */}
        {shopStall==="barter"&&(
          <div style={{position:"fixed",inset:0,zIndex:100,background:"#0A0810",animation:"overlayFadeIn .35s ease both",display:"flex",flexDirection:"column"}}>
            <header style={{position:"relative",zIndex:10,background:"rgba(10,8,16,0.75)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",padding:"0 16px",height:54,display:"flex",alignItems:"center",gap:10,borderBottom:"1px solid rgba(201,169,110,0.12)",flexShrink:0}}>
              <button onClick={()=>setShopStall(null)} style={{background:"transparent",border:"none",cursor:"pointer",color:"rgba(255,240,200,0.55)",fontSize:"0.8rem",fontFamily:SANS,padding:"4px 0"}}>{"< Market"}</button>
              <div style={{height:14,width:1,background:"rgba(201,169,110,0.18)"}}/>
              <span style={{fontFamily:SERIF,fontStyle:"italic",color:"rgba(255,240,200,0.75)",fontSize:"0.92rem"}}>Barter Post</span>
            </header>
            <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
              <div style={{maxWidth:600,margin:"0 auto",padding:"18px 22px 80px"}}>
                <h2 style={{fontFamily:DISPLAY,fontSize:"1.4rem",fontWeight:700,color:"rgba(255,240,200,0.85)",margin:"0 0 6px"}}>Barter Post</h2>
                <p style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.82rem",color:"rgba(255,240,200,0.4)",margin:"0 0 18px"}}>Trade goods with traveling merchants. No coins needed.</p>

                {NPC_TRADES.map((trade,i)=>{
                  const canTrade=Object.entries(trade.want).every(([k,v])=>(inventory[k]||0)>=v);
                  return(
                    <div key={trade.id} style={{background:"rgba(255,240,200,0.04)",border:"1px solid rgba(201,169,110,0.12)",borderRadius:14,padding:"16px",marginBottom:10,animation:`fadeUp .4s ${0.1+i*0.08}s ease both`,opacity:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                        <span style={{fontSize:"1.6rem"}}>{trade.emoji}</span>
                        <span style={{fontFamily:SERIF,fontSize:"0.95rem",color:"rgba(255,240,200,0.75)",fontWeight:500}}>{trade.npc}</span>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,flexWrap:"wrap"}}>
                        <div style={{flex:1}}>
                          <p style={{fontFamily:SANS,fontSize:"0.68rem",color:"rgba(255,240,200,0.35)",margin:"0 0 4px",textTransform:"uppercase",letterSpacing:"0.5px"}}>They want</p>
                          {Object.entries(trade.want).map(([k,v])=>{
                            const cat=ITEM_CATALOG[k];
                            const owned=inventory[k]||0;
                            return <p key={k} style={{fontFamily:SANS,fontSize:"0.78rem",color:owned>=v?"rgba(180,220,160,0.8)":"rgba(255,160,160,0.7)",margin:"2px 0"}}>{cat?cat.emoji:""} {cat?cat.name:k} x{v} <span style={{fontSize:"0.68rem",color:"rgba(255,240,200,0.3)"}}>(own {owned})</span></p>;
                          })}
                        </div>
                        <div style={{fontSize:"1.2rem",color:"rgba(255,240,200,0.25)"}}>→</div>
                        <div style={{flex:1}}>
                          <p style={{fontFamily:SANS,fontSize:"0.68rem",color:"rgba(255,240,200,0.35)",margin:"0 0 4px",textTransform:"uppercase",letterSpacing:"0.5px"}}>You get</p>
                          {Object.entries(trade.offer).map(([k,v])=>{
                            const cat=ITEM_CATALOG[k];
                            return <p key={k} style={{fontFamily:SANS,fontSize:"0.78rem",color:"rgba(255,240,200,0.65)",margin:"2px 0"}}>{cat?cat.emoji:""} {cat?cat.name:k} x{v}</p>;
                          })}
                        </div>
                      </div>
                      <button onClick={()=>{
                        if(!canTrade)return;
                        Object.entries(trade.want).forEach(([k,v])=>removeFromInventory(k,v));
                        Object.entries(trade.offer).forEach(([k,v])=>addToInventory(k,v));
                        const firstOffer=Object.keys(trade.offer)[0];
                        setToast({msg:`Traded with ${trade.npc}!`,emoji:ITEM_CATALOG[firstOffer]?ITEM_CATALOG[firstOffer].emoji:"..."});
                      }} disabled={!canTrade} style={{width:"100%",padding:"8px 0",background:canTrade?"rgba(201,169,110,0.12)":"rgba(255,240,200,0.03)",border:"1px solid "+(canTrade?"rgba(201,169,110,0.2)":"rgba(201,169,110,0.08)"),borderRadius:10,cursor:canTrade?"pointer":"default",color:canTrade?"rgba(255,240,200,0.7)":"rgba(255,240,200,0.25)",fontFamily:SANS,fontSize:"0.78rem",fontWeight:500,transition:"all 0.15s",opacity:canTrade?1:0.5}}>
                        {canTrade?"Trade":"Need more items"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        <MapHudButton/>
      </div>
    );
  }

  /* ══ UPPER ROOM — KJV Bible Reader ════════════════ */
  if(screen==="upper-room"){
    const bibleData=bibleDataRef.current;
    const dailyVerse=bibleData?getDailyVerse(bibleData):null;

    const bibleBack=()=>{
      if(bibleView==="reading"){setBibleView("chapters");}
      else if(bibleView==="chapters"){setBibleView("books");setBibleSearch("");}
      else{setBibleView(null);setBibleSearch("");}
    };
    const openBible=async()=>{
      const data=await loadBible();
      if(data) setBibleView("books");
    };

    // Filtered book list
    const filteredBooks=bibleData?(bibleSearch?bibleData.map((b,i)=>({...b,idx:i})).filter(b=>b.name.toLowerCase().includes(bibleSearch.toLowerCase())):bibleData.map((b,i)=>({...b,idx:i}))):[];
    const otBooks=filteredBooks.filter(b=>b.idx<39);
    const ntBooks=filteredBooks.filter(b=>b.idx>=39);

    return(
      <div style={{position:"fixed",inset:0,overflow:"hidden",fontFamily:SANS}}>
        <style>{GFONTS}{CSS}</style>
        <ImmersiveUpperRoom/>

        {/* ── LANDING VIEW ── */}
        {!bibleView&&(
          <div style={{position:"relative",zIndex:10,height:"100%",overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
            <div style={{maxWidth:720,margin:"0 auto",padding:"28px 22px 80px"}}>
              {/* Back to village */}
              <button onClick={()=>setScreen("map")} style={{background:"rgba(26,22,30,0.55)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",border:"1px solid rgba(180,160,210,0.15)",borderRadius:999,padding:"8px 20px",cursor:"pointer",color:"rgba(230,220,248,0.6)",fontFamily:SANS,fontSize:"0.78rem",marginBottom:28,transition:"all 0.2s",display:"inline-flex",alignItems:"center",gap:6,animation:"fadeUp .6s ease both"}}>
                Back to village
              </button>
              {/* Title */}
              <div style={{textAlign:"center",marginBottom:32,animation:"fadeUp .6s .1s ease both",opacity:0}}>
                <h1 style={{fontFamily:DISPLAY,fontSize:"2rem",fontWeight:700,color:"#D8C8F0",margin:"0 0 8px",textShadow:"0 2px 12px rgba(0,0,0,0.5)"}}>The Upper Room</h1>
                <p style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"1rem",color:"rgba(200,190,230,0.45)",margin:"0 0 14px"}}>A sacred space for worship and encounter.</p>
                <div style={{width:60,height:1,background:"rgba(180,160,210,0.3)",margin:"0 auto"}}/>
              </div>
              {/* Daily Verse */}
              {dailyVerse&&(
                <div onClick={()=>{setBibleBook(dailyVerse.bookIdx);setBibleChapter(dailyVerse.chapIdx);setBibleView("reading");}} style={{background:"rgba(20,18,32,0.55)",backdropFilter:"blur(14px)",WebkitBackdropFilter:"blur(14px)",border:"1px solid rgba(180,160,210,0.15)",borderRadius:16,padding:"28px 24px",textAlign:"center",marginBottom:24,animation:"fadeUp .8s .25s ease both",opacity:0,cursor:"pointer",transition:"all 0.3s"}}>
                  <p style={{fontFamily:SANS,fontSize:"0.65rem",letterSpacing:"0.08em",textTransform:"uppercase",color:"rgba(200,190,230,0.35)",margin:"0 0 14px"}}>Verse of the Day</p>
                  <p style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"1.05rem",color:"rgba(230,220,248,0.65)",lineHeight:1.7,margin:"0 0 14px"}}>{dailyVerse.text}</p>
                  <p style={{fontFamily:SANS,fontSize:"0.78rem",color:"rgba(180,160,210,0.45)",margin:0}}>-- {dailyVerse.ref}</p>
                </div>
              )}
              {/* Open Bible */}
              <div style={{textAlign:"center",animation:"fadeUp .8s .4s ease both",opacity:0}}>
                <button onClick={openBible} disabled={bibleLoading} style={{background:"linear-gradient(135deg,rgba(180,160,210,0.20),rgba(180,160,210,0.06))",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",border:"1px solid rgba(180,160,210,0.30)",color:"#E8E0F0",borderRadius:30,padding:"14px 36px",cursor:bibleLoading?"wait":"pointer",fontFamily:SERIF,fontStyle:"italic",fontSize:"1rem",transition:"all 0.3s",boxShadow:"0 4px 24px rgba(0,0,0,0.3)"}}>
                  {bibleLoading?"Loading Scriptures...":"Open the Scriptures"}
                </button>
              </div>
              {/* Saved Verses */}
              {savedVerses.length>0&&(
                <div style={{textAlign:"center",marginTop:16,animation:"fadeUp .8s .55s ease both",opacity:0}}>
                  <button onClick={()=>setSavedVersesView(true)} style={{background:"rgba(212,168,64,0.08)",border:"1px solid rgba(212,168,64,0.18)",borderRadius:20,padding:"10px 28px",cursor:"pointer",color:"rgba(212,168,64,0.7)",fontFamily:SANS,fontSize:"0.82rem",transition:"all 0.3s"}}>
                    Saved Verses ({savedVerses.length})
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── BIBLE READER ── */}
        {bibleView&&bibleData&&(
          <div style={{position:"absolute",inset:0,zIndex:20,background:"rgba(12,10,20,0.96)",display:"flex",flexDirection:"column"}}>
            {/* Header */}
            <header style={{background:"#0E0B14",padding:"0 16px",height:54,display:"flex",alignItems:"center",gap:10,boxShadow:"0 2px 16px rgba(0,0,0,0.3)",flexShrink:0,zIndex:200}}>
              <button onClick={bibleBack} style={{background:"transparent",border:"none",cursor:"pointer",color:"rgba(200,190,230,0.55)",fontSize:"0.8rem",fontFamily:SANS,padding:"4px 0",transition:"color 0.15s",whiteSpace:"nowrap"}}>{bibleView==="books"?"< Upper Room":"< Back"}</button>
              <div style={{height:14,width:1,background:"rgba(180,160,210,0.2)"}}/>
              <span style={{fontFamily:SERIF,fontStyle:"italic",color:"#D8C8F0",fontSize:"0.92rem",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                {bibleView==="reading"?`${bibleData[bibleBook].name} ${bibleChapter+1}`:bibleView==="chapters"?bibleData[bibleBook].name:"Scripture"}
              </span>
              {/* Font size controls */}
              {bibleView==="reading"&&(
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <button onClick={()=>setBibleFontSize(s=>Math.max(14,s-2))} style={{background:"rgba(180,160,210,0.12)",border:"1px solid rgba(180,160,210,0.2)",borderRadius:6,width:30,height:30,cursor:"pointer",color:"#D8C8F0",fontFamily:SANS,fontSize:"0.75rem",display:"flex",alignItems:"center",justifyContent:"center"}}>A-</button>
                  <button onClick={()=>setBibleFontSize(s=>Math.min(28,s+2))} style={{background:"rgba(180,160,210,0.12)",border:"1px solid rgba(180,160,210,0.2)",borderRadius:6,width:30,height:30,cursor:"pointer",color:"#D8C8F0",fontFamily:SANS,fontSize:"0.75rem",display:"flex",alignItems:"center",justifyContent:"center"}}>A+</button>
                </div>
              )}
            </header>

            {/* Scrollable content */}
            <div data-bible-scroll="" style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch"}}>

              {/* ── BOOK LIST ── */}
              {bibleView==="books"&&(
                <div style={{maxWidth:680,margin:"0 auto",padding:"16px 16px 80px"}}>
                  {/* Search */}
                  <div style={{position:"relative",marginBottom:16}}>
                    <input value={bibleSearch} onChange={e=>setBibleSearch(e.target.value)} placeholder="Search books..." style={{width:"100%",boxSizing:"border-box",background:"rgba(180,160,210,0.08)",border:"1px solid rgba(180,160,210,0.15)",borderRadius:12,padding:"10px 16px 10px 38px",color:"#E8E0F0",fontFamily:SANS,fontSize:"0.85rem",outline:"none"}}/>
                    <svg style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",opacity:0.3}} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D8C8F0" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  </div>
                  {/* Old Testament */}
                  {otBooks.length>0&&(
                    <>
                      <p style={{fontFamily:SANS,fontSize:"0.68rem",letterSpacing:"0.08em",textTransform:"uppercase",color:"rgba(200,190,230,0.30)",margin:"16px 0 8px 4px"}}>Old Testament</p>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                        {otBooks.map(b=>(
                          <button key={b.idx} className="bible-book" onClick={()=>{setBibleBook(b.idx);setBibleChapter(0);setBibleView("chapters");}} style={{background:"rgba(180,160,210,0.06)",border:"1px solid rgba(180,160,210,0.10)",borderRadius:10,padding:"10px 12px",textAlign:"left",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                            <span style={{fontFamily:SANS,fontSize:"0.82rem",color:"#D8C8F0"}}>{b.name}</span>
                            <span style={{fontFamily:SANS,fontSize:"0.65rem",color:"rgba(180,160,210,0.35)"}}>{b.chapters.length}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                  {/* New Testament */}
                  {ntBooks.length>0&&(
                    <>
                      <p style={{fontFamily:SANS,fontSize:"0.68rem",letterSpacing:"0.08em",textTransform:"uppercase",color:"rgba(200,190,230,0.30)",margin:"24px 0 8px 4px"}}>New Testament</p>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                        {ntBooks.map(b=>(
                          <button key={b.idx} className="bible-book" onClick={()=>{setBibleBook(b.idx);setBibleChapter(0);setBibleView("chapters");}} style={{background:"rgba(180,160,210,0.06)",border:"1px solid rgba(180,160,210,0.10)",borderRadius:10,padding:"10px 12px",textAlign:"left",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                            <span style={{fontFamily:SANS,fontSize:"0.82rem",color:"#D8C8F0"}}>{b.name}</span>
                            <span style={{fontFamily:SANS,fontSize:"0.65rem",color:"rgba(180,160,210,0.35)"}}>{b.chapters.length}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                  {filteredBooks.length===0&&(
                    <p style={{textAlign:"center",fontFamily:SERIF,fontStyle:"italic",color:"rgba(200,190,230,0.3)",marginTop:40}}>No books match your search</p>
                  )}
                </div>
              )}

              {/* ── CHAPTER GRID ── */}
              {bibleView==="chapters"&&(
                <div style={{maxWidth:680,margin:"0 auto",padding:"24px 16px 80px"}}>
                  <p style={{fontFamily:SANS,fontSize:"0.72rem",color:"rgba(200,190,230,0.35)",marginBottom:16,textAlign:"center"}}>Select a chapter</p>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(52px,1fr))",gap:8}}>
                    {bibleData[bibleBook].chapters.map((_,ci)=>(
                      <button key={ci} className="bible-chap" onClick={()=>{setBibleChapter(ci);setBibleView("reading");}} style={{background:"rgba(180,160,210,0.08)",border:"1px solid rgba(180,160,210,0.12)",borderRadius:10,padding:"12px 0",textAlign:"center",color:"#D8C8F0",fontFamily:SANS,fontSize:"0.9rem",fontWeight:500}}>
                        {ci+1}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── READING VIEW ── */}
              {bibleView==="reading"&&(
                <div style={{maxWidth:680,margin:"0 auto",padding:"24px 20px 100px"}}>
                  {bibleData[bibleBook].chapters[bibleChapter].map((verse,i)=>{
                    const sel=selectedVerses.has(i);
                    return(
                    <p key={i} className="verse-tap" onClick={()=>toggleVerseSelection(i)} style={{fontFamily:SERIF,fontSize:bibleFontSize,color:sel?"#FFF8E8":"#E8E0F0",lineHeight:1.85,margin:"0 0 4px",padding:"4px 10px 4px 14px",borderRadius:8,cursor:"pointer",background:sel?"rgba(212,168,64,0.12)":"transparent",borderLeft:sel?"3px solid rgba(212,168,64,0.55)":"3px solid transparent",transition:"all 0.2s ease",animation:`verseReveal .35s ${Math.min(i*0.015,1.2)}s ease both`,opacity:0,WebkitTapHighlightColor:"transparent"}}>
                      <span style={{fontFamily:SANS,fontSize:"0.68em",color:sel?"rgba(212,168,64,0.75)":"rgba(180,160,210,0.38)",marginRight:8,userSelect:"none",fontWeight:600,transition:"color 0.2s"}}>{i+1}</span>
                      {verse}
                    </p>);
                  })}
                  {/* Chapter navigation */}
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:40,paddingTop:20,borderTop:"1px solid rgba(180,160,210,0.10)"}}>
                    {bibleChapter>0?(
                      <button onClick={()=>setBibleChapter(c=>c-1)} style={{background:"rgba(180,160,210,0.10)",border:"1px solid rgba(180,160,210,0.15)",borderRadius:20,padding:"8px 20px",cursor:"pointer",color:"rgba(230,220,248,0.6)",fontFamily:SANS,fontSize:"0.78rem",transition:"all 0.2s"}}>
                        Previous
                      </button>
                    ):<div/>}
                    <span style={{fontFamily:SANS,fontSize:"0.72rem",color:"rgba(200,190,230,0.3)"}}>{bibleChapter+1} / {bibleData[bibleBook].chapters.length}</span>
                    {bibleChapter<bibleData[bibleBook].chapters.length-1?(
                      <button onClick={()=>setBibleChapter(c=>c+1)} style={{background:"rgba(180,160,210,0.10)",border:"1px solid rgba(180,160,210,0.15)",borderRadius:20,padding:"8px 20px",cursor:"pointer",color:"rgba(230,220,248,0.6)",fontFamily:SANS,fontSize:"0.78rem",transition:"all 0.2s"}}>
                        Next
                      </button>
                    ):<div/>}
                  </div>
                  {/* ── FLOATING ACTION BAR ── */}
                  {verseActionBar&&(
                    <div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",zIndex:300,background:"rgba(14,11,20,0.85)",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",border:"1px solid rgba(212,168,64,0.25)",borderRadius:18,padding:"10px 18px",display:"flex",alignItems:"center",gap:14,animation:"actionBarSlideUp .3s ease both",boxShadow:"0 8px 32px rgba(0,0,0,0.5)"}}>
                      <span style={{fontFamily:SANS,fontSize:"0.72rem",color:"rgba(212,168,64,0.7)",whiteSpace:"nowrap"}}>{selectedVerses.size} verse{selectedVerses.size>1?"s":""}</span>
                      <div style={{width:1,height:20,background:"rgba(212,168,64,0.2)"}}/>
                      <button onClick={saveSelectedVerses} style={{background:"rgba(212,168,64,0.15)",border:"1px solid rgba(212,168,64,0.30)",borderRadius:10,padding:"7px 16px",cursor:"pointer",color:"#D4A840",fontFamily:SANS,fontSize:"0.76rem",fontWeight:600,transition:"all 0.2s",whiteSpace:"nowrap"}}>Save</button>
                      <button onClick={()=>{const v=getSelectedVerseText();setVerseShareOverlay(v);}} style={{background:"rgba(180,160,210,0.12)",border:"1px solid rgba(180,160,210,0.20)",borderRadius:10,padding:"7px 16px",cursor:"pointer",color:"#D8C8F0",fontFamily:SANS,fontSize:"0.76rem",transition:"all 0.2s",whiteSpace:"nowrap"}}>Share</button>
                      <button onClick={()=>{setSelectedVerses(new Set());setVerseActionBar(false);}} style={{background:"transparent",border:"none",cursor:"pointer",color:"rgba(200,190,230,0.4)",fontFamily:SANS,fontSize:"0.76rem",padding:"7px 8px",transition:"color 0.2s"}}>Clear</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── SAVED VERSES VIEW ── */}
        {savedVersesView&&(
          <div style={{position:"fixed",inset:0,zIndex:500,background:"rgba(10,8,16,0.97)",display:"flex",flexDirection:"column",animation:"overlayFadeIn .25s ease both"}}>
            <header style={{background:"#0E0B14",padding:"0 16px",height:54,display:"flex",alignItems:"center",gap:10,boxShadow:"0 2px 16px rgba(0,0,0,0.3)",flexShrink:0}}>
              <button onClick={()=>setSavedVersesView(false)} style={{background:"transparent",border:"none",cursor:"pointer",color:"rgba(200,190,230,0.55)",fontSize:"0.8rem",fontFamily:SANS,padding:"4px 0"}}>{"< Back"}</button>
              <div style={{height:14,width:1,background:"rgba(180,160,210,0.2)"}}/>
              <span style={{fontFamily:SERIF,fontStyle:"italic",color:"#D8C8F0",fontSize:"0.92rem"}}>Saved Verses</span>
            </header>
            <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch",padding:"20px 16px 80px"}}>
              <div style={{maxWidth:680,margin:"0 auto"}}>
                {savedVerses.length===0&&(
                  <div style={{textAlign:"center",marginTop:80}}>
                    <p style={{fontFamily:SERIF,fontStyle:"italic",color:"rgba(200,190,230,0.3)",fontSize:"1rem"}}>No saved verses yet</p>
                    <p style={{fontFamily:SANS,fontSize:"0.78rem",color:"rgba(200,190,230,0.2)",marginTop:8}}>Tap verses while reading to select and save them</p>
                  </div>
                )}
                {savedVerses.map(v=>(
                  <div key={v.id} style={{background:"rgba(180,160,210,0.06)",border:"1px solid rgba(180,160,210,0.10)",borderRadius:14,padding:"18px 16px",marginBottom:12}}>
                    <p style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.92rem",color:"rgba(230,220,248,0.65)",lineHeight:1.7,margin:"0 0 8px"}}>"{v.text.length>180?v.text.slice(0,180)+"...":v.text}"</p>
                    <p style={{fontFamily:SANS,fontSize:"0.75rem",color:"rgba(180,160,210,0.45)",margin:"0 0 12px"}}>-- {v.ref}</p>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                      <button onClick={()=>setVerseShareOverlay({text:v.text,ref:v.ref})} style={{background:"rgba(180,160,210,0.10)",border:"1px solid rgba(180,160,210,0.15)",borderRadius:8,padding:"6px 14px",cursor:"pointer",color:"rgba(230,220,248,0.55)",fontFamily:SANS,fontSize:"0.72rem",transition:"all 0.2s"}}>Share</button>
                      <button onClick={()=>{setBibleBook(v.bookIdx);setBibleChapter(v.chapIdx);setSavedVersesView(false);setBibleView("reading");}} style={{background:"rgba(180,160,210,0.10)",border:"1px solid rgba(180,160,210,0.15)",borderRadius:8,padding:"6px 14px",cursor:"pointer",color:"rgba(230,220,248,0.55)",fontFamily:SANS,fontSize:"0.72rem",transition:"all 0.2s"}}>Read</button>
                      <button onClick={()=>deleteSavedVerse(v.id)} style={{background:"rgba(180,80,80,0.08)",border:"1px solid rgba(180,80,80,0.15)",borderRadius:8,padding:"6px 14px",cursor:"pointer",color:"rgba(220,120,120,0.55)",fontFamily:SANS,fontSize:"0.72rem",transition:"all 0.2s"}}>Remove</button>
                    </div>
                    <p style={{fontFamily:SANS,fontSize:"0.62rem",color:"rgba(200,190,230,0.2)",marginTop:8}}>{v.date}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── VERSE SHARE OVERLAY ── */}
        {verseShareOverlay&&(
          <div onClick={e=>{if(e.target===e.currentTarget)setVerseShareOverlay(null);}} style={{position:"fixed",inset:0,zIndex:600,background:"rgba(6,4,12,0.92)",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",animation:"overlayFadeIn .25s ease both"}}>
            <div style={{background:"#12101A",border:"1px solid rgba(180,160,210,0.15)",borderRadius:20,padding:"28px 24px",maxWidth:420,width:"90%",maxHeight:"85vh",overflowY:"auto",position:"relative"}}>
              <button onClick={()=>setVerseShareOverlay(null)} style={{position:"absolute",top:12,right:14,background:"transparent",border:"none",cursor:"pointer",color:"rgba(200,190,230,0.4)",fontSize:"1.2rem",lineHeight:1}}>x</button>
              <p style={{fontFamily:SANS,fontSize:"0.68rem",letterSpacing:"0.08em",textTransform:"uppercase",color:"rgba(200,190,230,0.30)",margin:"0 0 16px",textAlign:"center"}}>Create Verse Image</p>
              {/* Preview */}
              <div style={{display:"flex",justifyContent:"center",marginBottom:20}}>
                <VersePreview text={verseShareOverlay.text} refText={verseShareOverlay.ref} theme={verseTheme} ratio={verseRatio} scale={0.32}/>
              </div>
              {/* Theme picker */}
              <p style={{fontFamily:SANS,fontSize:"0.65rem",color:"rgba(200,190,230,0.30)",margin:"0 0 8px",textTransform:"uppercase",letterSpacing:"0.06em"}}>Theme</p>
              <div style={{display:"flex",gap:10,marginBottom:18,flexWrap:"wrap"}}>
                {VERSE_THEMES.map(th=>(
                  <button key={th.id} onClick={()=>setVerseTheme(th)} title={th.label} style={{width:32,height:32,borderRadius:"50%",background:th.preview,border:verseTheme.id===th.id?"2px solid rgba(212,168,64,0.8)":"2px solid rgba(180,160,210,0.15)",cursor:"pointer",transition:"all 0.2s",boxShadow:verseTheme.id===th.id?"0 0 12px rgba(212,168,64,0.3)":"none"}}/>
                ))}
              </div>
              {/* Ratio picker */}
              <p style={{fontFamily:SANS,fontSize:"0.65rem",color:"rgba(200,190,230,0.30)",margin:"0 0 8px",textTransform:"uppercase",letterSpacing:"0.06em"}}>Size</p>
              <div style={{display:"flex",gap:8,marginBottom:22}}>
                {CARD_RATIOS.map(r=>(
                  <button key={r.label} onClick={()=>setVerseRatio(r)} style={{background:verseRatio.label===r.label?"rgba(212,168,64,0.15)":"rgba(180,160,210,0.06)",border:verseRatio.label===r.label?"1px solid rgba(212,168,64,0.35)":"1px solid rgba(180,160,210,0.12)",borderRadius:8,padding:"6px 14px",cursor:"pointer",color:verseRatio.label===r.label?"#D4A840":"rgba(200,190,230,0.5)",fontFamily:SANS,fontSize:"0.72rem",transition:"all 0.2s"}}>{r.label}</button>
                ))}
              </div>
              {/* Actions */}
              <div style={{display:"flex",gap:10}}>
                <button onClick={downloadVerseCard} style={{flex:1,background:"linear-gradient(135deg,rgba(212,168,64,0.20),rgba(212,168,64,0.06))",border:"1px solid rgba(212,168,64,0.30)",borderRadius:12,padding:"12px 0",cursor:"pointer",color:"#D4A840",fontFamily:SANS,fontSize:"0.82rem",fontWeight:600,transition:"all 0.2s"}}>Download</button>
                <button onClick={copyVerseCard} style={{flex:1,background:"rgba(180,160,210,0.10)",border:"1px solid rgba(180,160,210,0.18)",borderRadius:12,padding:"12px 0",cursor:"pointer",color:verseCopied?"#5A8A6A":"#D8C8F0",fontFamily:SANS,fontSize:"0.82rem",transition:"all 0.2s"}}>{verseCopied?"Copied!":"Copy"}</button>
              </div>
            </div>
          </div>
        )}

        {spaceTransit&&<div style={{position:"fixed",inset:0,zIndex:9999,background:"#0A0806",animation:"spaceFadeIn .6s ease both",pointerEvents:"all"}}/>}
        <MapHudButton/>
      </div>
    );
  }

  return null;
}
