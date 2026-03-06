import { useState, useEffect, useMemo, useRef, useCallback } from "react";

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

async function dbLoad(k){try{const r=await window.storage.get(k);return r?.value?JSON.parse(r.value):null;}catch{return null;}}
async function dbSave(k,v){try{await window.storage.set(k,JSON.stringify(v));}catch{}}

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
   SMALL SHARED COMPONENTS
═══════════════════════════════════════════════════ */
function Candle({size=40}){
  return(<svg width={size} height={size*1.4} viewBox="0 0 48 67" fill="none"><ellipse cx="24" cy="10" rx="8" ry="12" fill="rgba(201,169,110,0.15)" style={{animation:"flicker 2.4s ease-in-out infinite"}}/><ellipse cx="24" cy="13" rx="5" ry="8" fill="rgba(201,169,110,0.25)" style={{animation:"flicker 1.8s ease-in-out infinite reverse"}}/><ellipse cx="24" cy="16" rx="3" ry="5" fill={B.goldL}/><ellipse cx="24" cy="17" rx="1.5" ry="2.5" fill="#FFF8E0"/><rect x="18" y="18" width="12" height="38" rx="2" fill="rgba(250,247,242,0.9)"/><line x1="24" y1="18" x2="24" y2="13" stroke={B.gold} strokeWidth="1.5" strokeLinecap="round"/></svg>);
}
function Stars(){
  const s=useMemo(()=>Array.from({length:55},(_,i)=>({id:i,x:Math.random()*100,y:Math.random()*100,sz:Math.random()*1.5+.5,d:Math.random()*3})),[]);
  return(<div style={{position:"absolute",inset:0,pointerEvents:"none",overflow:"hidden"}}>{s.map(s=><div key={s.id} style={{position:"absolute",left:`${s.x}%`,top:`${s.y}%`,width:`${s.sz}px`,height:`${s.sz}px`,borderRadius:"50%",background:"rgba(255,255,255,0.7)",animation:`twinkle ${2+s.d}s ease-in-out infinite`,animationDelay:`${s.d}s`}}/>)}</div>);
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
   MAIN APP
═══════════════════════════════════════════════════ */
export default function App(){
  // ── STATE ──
  const [screen,        setScreen]        = useState("loading");
  const [obStep,        setObStep]        = useState(0);
  const [entries,       setEntries]       = useState([]);
  const [streak,        setStreak]        = useState(0);
  const [activeRoom,    setActiveRoom]    = useState(null);
  const [journalStep,   setJournalStep]   = useState(0);
  const [activeDay,     setActiveDay]     = useState(0);
  const [jTexts,        setJTexts]        = useState(["","",""]);
  const [saveMsg,       setSaveMsg]       = useState("");
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

  // ── LOAD ──
  useEffect(()=>{
    (async()=>{
      const ens  = await dbLoad("irj-entries") || [];
      const pp   = await dbLoad("irj-prayer")  || SAMPLE_PRAYERS;
      const ob   = await dbLoad("irj-onboarded");
      const sc   = await dbLoad("irj-saved-cards") || [];
      setEntries(ens); setPrayerPosts(pp); setSavedCards(sc);
      let s=0,d=new Date(),map={};
      ens.forEach(e=>{map[e.date]=true;});
      while(map[isoDate(d)]){s++;d.setDate(d.getDate()-1);} setStreak(s);
      setScreen(ob?"home":"welcome");
      setCardQ(shuffle(ALL_CARD_QS)[0]);
    })();
  },[]);

  async function persistEntries(list){
    setEntries(list); await dbSave("irj-entries",list);
    let s=0,d=new Date(),map={};
    list.forEach(e=>{map[e.date]=true;});
    while(map[isoDate(d)]){s++;d.setDate(d.getDate()-1);} setStreak(s);
  }

  // ── JOURNAL ──
  function enterRoom(room){
    const done=entries.filter(e=>e.roomId===room.id).length;
    setActiveRoom(room); setActiveDay(Math.min(done,room.days.length-1));
    setJournalStep(0); setJTexts(["","",""]); setScreen("journal");
  }
  function saveEntry(){
    if(!jTexts[0].trim()) return;
    const e={id:Date.now().toString(),date:todayStr(),roomId:activeRoom.id,roomLabel:activeRoom.label,roomEmoji:activeRoom.emoji,day:activeDay,prompt:activeRoom.days[activeDay].q,text:jTexts.filter(Boolean).join("\n\n---\n\n"),words:jTexts.filter(Boolean).reduce((s,t)=>s+wc(t),0)};
    persistEntries([e,...entries]);
    setSaveMsg("✓ Reflection saved"); setTimeout(()=>{setSaveMsg("");setScreen("home");},1800);
  }

  // ── PRAYER ──
  function postPrayer(){
    if(!newPrayer.trim()) return;
    const p={id:Date.now().toString(),date:todayStr(),text:newPrayer.trim(),tag:prayerTag||"General",prayers:0};
    const next=[p,...prayerPosts]; setPrayerPosts(next); dbSave("irj-prayer",next);
    setNewPrayer(""); setPrayerTag("");
  }
  function prayFor(id){
    const next=prayerPosts.map(p=>p.id===id?{...p,prayers:p.prayers+1}:p);
    setPrayerPosts(next); dbSave("irj-prayer",next);
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

  /* ── GLOBAL CSS ── */
  const CSS=`
    @keyframes flicker{0%,100%{opacity:1;transform:scaleY(1)}50%{opacity:.85;transform:scaleY(.95)}}
    @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
    @keyframes twinkle{0%,100%{opacity:.3;transform:scale(1)}50%{opacity:1;transform:scale(1.4)}}
    @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
    .fu{animation:fadeUp .55s ease both}
    .fu2{animation:fadeUp .55s .12s ease both}
    .fu3{animation:fadeUp .55s .24s ease both}
    .room-c:hover{transform:translateY(-3px)!important;box-shadow:0 12px 36px rgba(0,0,0,0.12)!important;}
    textarea::placeholder{font-style:italic;opacity:0.45}
    textarea:focus,input:focus{outline:none}
    ::-webkit-scrollbar{width:4px}
    ::-webkit-scrollbar-thumb{background:rgba(150,130,110,0.25);border-radius:2px}
  `;

  /* ── DARK HEADER (reusable) ── */
  const DarkHeader = ({title, onBack, extra}) => (
    <header style={{background:B.night,padding:"0 24px",height:"54px",display:"flex",alignItems:"center",gap:"12px",boxShadow:"0 2px 16px rgba(0,0,0,0.2)",position:"sticky",top:0,zIndex:200,flexShrink:0}}>
      <button onClick={onBack} style={{background:"transparent",border:"none",cursor:"pointer",color:"rgba(180,165,148,0.55)",fontSize:"0.8rem",fontFamily:SANS,padding:0,transition:"color 0.15s",whiteSpace:"nowrap"}} onMouseEnter={e=>e.target.style.color=B.gold} onMouseLeave={e=>e.target.style.color="rgba(180,165,148,0.55)"}>← Home</button>
      <div style={{height:"14px",width:"1px",background:"rgba(201,169,110,0.2)"}}/>
      <span style={{fontFamily:SERIF,fontStyle:"italic",color:B.goldL,fontSize:"0.92rem",flex:1}}>{title}</span>
      {extra}
    </header>
  );

  /* ══ LOADING ══════════════════════════════════════ */
  if(screen==="loading") return(
    <div style={{minHeight:"100vh",background:B.night,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <style>{GFONTS}</style>
      <span style={{fontFamily:SERIF,fontStyle:"italic",color:"rgba(201,169,110,0.4)",fontSize:"1.1rem"}}>Preparing your space…</span>
    </div>
  );

  /* ══ WELCOME ══════════════════════════════════════ */
  if(screen==="welcome") return(
    <div style={{minHeight:"100vh",background:B.night,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 24px",position:"relative",overflow:"hidden"}}>
      <style>{GFONTS}{CSS}</style>
      <div style={{position:"absolute",top:"30%",left:"50%",transform:"translate(-50%,-50%)",width:"700px",height:"700px",borderRadius:"50%",background:"radial-gradient(ellipse,rgba(201,169,110,0.06) 0%,transparent 70%)",pointerEvents:"none"}}/>
      <div style={{position:"absolute",top:0,left:0,right:0,height:"2px",background:`linear-gradient(90deg,transparent,${B.sage}44,transparent)`}}/>
      <div style={{position:"absolute",bottom:0,left:0,right:0,height:"2px",background:`linear-gradient(90deg,transparent,${B.pinkD}44,transparent)`}}/>
      <div className="fu" style={{width:"1px",height:"44px",background:"linear-gradient(to bottom,transparent,rgba(201,169,110,0.3))",marginBottom:"24px"}}/>
      <div className="fu2"><Candle size={44}/></div>
      <h1 className="fu2" style={{fontFamily:SERIF,fontSize:"clamp(1.9rem,6vw,3rem)",fontWeight:300,color:B.goldL,margin:"14px 0 8px",letterSpacing:"0.08em",textAlign:"center"}}>Inner Room Journal</h1>
      <p className="fu3" style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.97rem",color:"rgba(232,212,160,0.55)",margin:"0 0 30px",letterSpacing:"0.05em",textAlign:"center"}}>A quiet place to face the questions that matter.</p>
      <div className="fu3" style={{maxWidth:"340px",textAlign:"center",marginBottom:"44px",padding:"22px 26px",border:"1px solid rgba(201,169,110,0.18)",borderRadius:"2px",background:"rgba(255,255,255,0.02)"}}>
        <p style={{fontFamily:SANS,fontSize:"0.86rem",color:"rgba(180,165,148,0.8)",margin:0,lineHeight:1.9,fontWeight:300}}>Not a blank journal.<br/>A guided space for honest reflection,<br/>deeper questions, and healing insight.</p>
      </div>
      <button onClick={()=>setScreen("onboard")} style={{background:"transparent",border:`1px solid ${B.gold}`,color:B.gold,padding:"13px 38px",borderRadius:"2px",cursor:"pointer",fontSize:"0.83rem",fontFamily:SANS,fontWeight:500,letterSpacing:"0.14em",textTransform:"uppercase",transition:"all 0.25s"}} onMouseEnter={e=>{e.target.style.background=B.gold;e.target.style.color=B.night;}} onMouseLeave={e=>{e.target.style.background="transparent";e.target.style.color=B.gold;}}>Enter ›</button>
    </div>
  );

  /* ══ ONBOARDING ═══════════════════════════════════ */
  const OBC=[
    {emoji:"🚪",title:"Most people avoid the real questions.",body:"We fill our days to escape the silence. Inner Room Journal slows you down and asks the ones that matter.",ac:B.sage},
    {emoji:"🕯️",title:"You won't journal alone.",body:"Guided prompts take you deeper — from surface to root. Plus community rooms where others walk beside you.",ac:B.pinkD},
    {emoji:"🌿",title:"Growth becomes visible.",body:"Over time, patterns emerge from your words. Themes surface. Transformation becomes something you can see.",ac:B.gold},
  ];
  if(screen==="onboard") return(
    <div style={{minHeight:"100vh",background:B.night,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 24px"}}>
      <style>{GFONTS}{CSS}</style>
      <div style={{display:"flex",gap:"8px",marginBottom:"52px"}}>{OBC.map((_,i)=><div key={i} style={{width:i===obStep?28:8,height:"8px",borderRadius:"4px",background:i===obStep?OBC[obStep].ac:"rgba(255,255,255,0.08)",transition:"all 0.35s"}}/>)}</div>
      <div key={obStep} className="fu" style={{maxWidth:"400px",width:"100%",textAlign:"center",padding:"0 8px"}}>
        <div style={{width:"60px",height:"60px",borderRadius:"14px",background:`${OBC[obStep].ac}18`,border:`1px solid ${OBC[obStep].ac}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.7rem",margin:"0 auto 22px"}}>{OBC[obStep].emoji}</div>
        <h2 style={{fontFamily:SERIF,fontSize:"1.75rem",fontWeight:600,color:B.goldL,margin:"0 0 16px",lineHeight:1.3}}>{OBC[obStep].title}</h2>
        <p style={{fontFamily:SANS,fontSize:"0.9rem",color:"rgba(180,165,148,0.78)",margin:"0 0 48px",lineHeight:1.85,fontWeight:300}}>{OBC[obStep].body}</p>
      </div>
      <div style={{display:"flex",gap:"10px",alignItems:"center"}}>
        {obStep>0&&<button onClick={()=>setObStep(s=>s-1)} style={{background:"transparent",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(180,165,148,0.55)",padding:"11px 20px",borderRadius:"2px",cursor:"pointer",fontSize:"0.82rem",fontFamily:SANS,letterSpacing:"0.08em"}}>← Back</button>}
        <button onClick={()=>{if(obStep<OBC.length-1)setObStep(s=>s+1);else{dbSave("irj-onboarded",true);setScreen("home");}}} style={{background:OBC[obStep].ac,border:"none",color:B.night,padding:"13px 34px",borderRadius:"2px",cursor:"pointer",fontSize:"0.85rem",fontFamily:SANS,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase"}}>
          {obStep<OBC.length-1?"Continue ›":"Begin My Journey →"}
        </button>
      </div>
      {obStep<OBC.length-1&&<button onClick={()=>{dbSave("irj-onboarded",true);setScreen("home");}} style={{marginTop:"20px",background:"transparent",border:"none",cursor:"pointer",color:"rgba(180,165,148,0.35)",fontSize:"0.76rem",fontFamily:SANS,letterSpacing:"0.08em"}}>Skip intro</button>}
    </div>
  );

  /* ══ HOME ══════════════════════════════════════════ */
  if(screen==="home") return(
    <div style={{minHeight:"100vh",background:B.beige,color:B.ink,fontFamily:SANS}}>
      <style>{GFONTS}{CSS}</style>
      <header style={{background:B.night,padding:"0 24px",height:"58px",display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:"0 2px 24px rgba(0,0,0,0.22)",position:"sticky",top:0,zIndex:200}}>
        <div style={{display:"flex",alignItems:"center",gap:"10px"}}><Candle size={22}/><span style={{fontFamily:SERIF,fontStyle:"italic",color:B.goldL,fontSize:"1rem",fontWeight:400,letterSpacing:"0.04em"}}>Inner Room Journal</span></div>
        <nav style={{display:"flex",gap:"2px"}}>
          {[["✦","cards","Cards"],["👥","community","Community"],["📖","history","History"],["📊","insights","Insights"]].map(([ic,sc,lb])=>(
            <button key={sc} onClick={()=>setScreen(sc)} style={{background:"transparent",border:"none",cursor:"pointer",color:"rgba(180,165,148,0.55)",fontSize:"0.78rem",padding:"8px 10px",borderRadius:"6px",fontFamily:SANS,transition:"all 0.15s",display:"flex",flexDirection:"column",alignItems:"center",gap:"2px"}} onMouseEnter={e=>e.currentTarget.style.color=B.gold} onMouseLeave={e=>e.currentTarget.style.color="rgba(180,165,148,0.55)"}>
              <span style={{fontSize:"0.92rem"}}>{ic}</span>
              <span style={{fontSize:"0.6rem",letterSpacing:"0.06em",textTransform:"uppercase"}}>{lb}</span>
            </button>
          ))}
        </nav>
      </header>
      <main style={{maxWidth:"860px",margin:"0 auto",padding:"30px 22px 100px"}}>
        <div style={{marginBottom:"26px",display:"flex",justifyContent:"space-between",alignItems:"flex-end",flexWrap:"wrap",gap:"10px"}}>
          <div>
            <div style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.82rem",color:B.inkL,marginBottom:"4px"}}>{new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}</div>
            <h2 style={{fontFamily:SERIF,fontSize:"1.65rem",fontWeight:400,color:B.ink,margin:0}}>Choose your room.</h2>
          </div>
          {streak>0&&<div style={{display:"inline-flex",alignItems:"center",gap:"7px",background:B.night,borderRadius:"999px",padding:"7px 16px",fontSize:"0.78rem",color:B.gold,fontWeight:500}}>🔥 {streak}-day streak</div>}
        </div>

        {/* today's question */}
        <div style={{background:B.night,borderRadius:"12px",padding:"20px 24px",marginBottom:"22px",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:"2px",background:`linear-gradient(90deg,transparent,${B.gold}66,transparent)`}}/>
          <div style={{fontSize:"0.66rem",fontFamily:SANS,fontWeight:600,letterSpacing:"0.14em",color:B.gold,textTransform:"uppercase",marginBottom:"8px"}}>Question to carry today</div>
          <p style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"1.08rem",color:B.goldL,margin:"0 0 14px",lineHeight:1.65}}>{VIRAL_QS[new Date().getDate()%VIRAL_QS.length]}</p>
          <button onClick={()=>{setCardQ(VIRAL_QS[new Date().getDate()%VIRAL_QS.length]);setIsCustomCard(false);setScreen("cards");}} style={{background:"transparent",border:`1px solid rgba(201,169,110,0.3)`,color:B.gold,padding:"7px 16px",borderRadius:"8px",cursor:"pointer",fontSize:"0.76rem",fontFamily:SANS,transition:"all 0.15s"}} onMouseEnter={e=>{e.target.style.background="rgba(201,169,110,0.12)";}} onMouseLeave={e=>{e.target.style.background="transparent";}}>Make a shareable card → </button>
        </div>

        {/* REFLECTION ROOMS */}
        <SectionLabel label="Personal Reflection" color={B.sageDk}/>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(215px,1fr))",gap:"10px",marginBottom:"20px"}}>
          {REFLECTION_ROOMS.map((room,i)=>{
            const t=th(room.id),prog=roomProg(room),pct=Math.round(prog/room.days.length*100),done=prog>=room.days.length;
            return(<div key={room.id} className="room-c" onClick={()=>enterRoom(room)} style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:"12px",padding:"19px",position:"relative",overflow:"hidden",cursor:"pointer",transition:"all 0.2s",boxShadow:"0 2px 12px rgba(0,0,0,0.14)",animation:`fadeUp .45s ${i*.06}s ease both`}}>
              <div style={{position:"absolute",inset:0,background:`radial-gradient(ellipse at 50% 30%,${t.glow} 0%,transparent 65%)`,pointerEvents:"none"}}/>
              <div style={{position:"absolute",top:0,left:0,right:0,height:"2px",background:t.accent,opacity:.8}}/>
              {done&&<div style={{position:"absolute",top:"10px",right:"10px",background:B.sageDk,color:"#fff",fontSize:"0.55rem",fontWeight:700,letterSpacing:"0.1em",padding:"2px 7px",borderRadius:"99px",textTransform:"uppercase"}}>Done</div>}
              <div style={{position:"relative"}}><div style={{fontSize:"1.35rem",marginBottom:"8px"}}>{room.emoji}</div><div style={{fontFamily:SERIF,fontSize:"1.03rem",fontWeight:700,color:t.text,marginBottom:"4px"}}>{room.label}</div><div style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.78rem",color:t.sub,marginBottom:"13px",lineHeight:1.5}}>{room.question}</div><div style={{height:"2px",background:"rgba(255,255,255,0.1)",borderRadius:"99px",overflow:"hidden",marginBottom:"4px"}}><div style={{height:"100%",width:`${pct}%`,background:t.accent,borderRadius:"99px"}}/></div><div style={{fontSize:"0.65rem",color:t.sub,opacity:.7}}>Day {prog} of {room.days.length}</div></div>
            </div>);
          })}
        </div>

        {/* JESUS ROOM */}
        <SectionLabel label="Scripture" color="#D4B464"/>
        <div className="room-c" onClick={()=>setScreen("jesus")} style={{background:th("jesus").card,border:`1px solid ${th("jesus").border}`,borderRadius:"12px",padding:"18px 22px",cursor:"pointer",transition:"all 0.2s",marginBottom:"20px",position:"relative",overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,0.18)"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:"2px",background:"#D4B464",opacity:.8}}/>
          <RoomGlow id="jesus"/>
          <div style={{display:"flex",alignItems:"center",gap:"14px",position:"relative"}}>
            <span style={{fontSize:"1.6rem"}}>✝️</span>
            <div style={{flex:1}}><div style={{fontFamily:SERIF,fontSize:"1.08rem",fontWeight:700,color:"#FFF8E8",marginBottom:"3px"}}>Questions Jesus Asked</div><div style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.82rem",color:"rgba(255,248,232,0.5)"}}>{JESUS_QUESTIONS.length} questions from Scripture — applied to your life today.</div></div>
            <span style={{color:"#D4B464",fontSize:"1.1rem"}}>›</span>
          </div>
        </div>

        {/* COMMUNITY ROOMS */}
        <SectionLabel label="Community" color={B.pinkD}/>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(230px,1fr))",gap:"10px",marginBottom:"12px"}}>
          {COMMUNITY_ROOMS.slice(0,4).map((room,i)=>{
            const t=th(room.id),light=t.light;
            return(<div key={room.id} className="room-c" onClick={()=>setScreen("community")} style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:"12px",padding:"18px",cursor:"pointer",transition:"all 0.2s",position:"relative",overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,0.08)",animation:`fadeUp .45s ${i*.07}s ease both`}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:"2px",background:t.accent}}/>
              {room.id==="singleness"&&<Stars/>}
              <div style={{position:"relative"}}>
                <div style={{display:"flex",alignItems:"center",gap:"7px",marginBottom:"8px"}}><span style={{fontSize:"1.2rem"}}>{room.emoji}</span><span style={{fontSize:"0.63rem",fontFamily:SANS,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",color:t.accent,border:`1px solid ${t.border}`,padding:"2px 7px",borderRadius:"99px"}}>Community</span></div>
                <div style={{fontFamily:SERIF,fontSize:"1rem",fontWeight:700,color:light?"#3A1828":t.text,marginBottom:"4px"}}>{room.label}</div>
                <div style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.78rem",color:light?"rgba(58,24,40,0.55)":t.sub,lineHeight:1.5}}>{room.question}</div>
              </div>
            </div>);
          })}
        </div>
        <button onClick={()=>setScreen("community")} style={{width:"100%",background:"transparent",border:`1px solid ${B.pinkD}`,color:B.pinkD,padding:"11px",borderRadius:"10px",cursor:"pointer",fontSize:"0.81rem",fontFamily:SANS,fontWeight:600,letterSpacing:"0.06em",marginBottom:"18px",transition:"all 0.2s"}} onMouseEnter={e=>{e.target.style.background=B.pink;e.target.style.color="#3A1828";}} onMouseLeave={e=>{e.target.style.background="transparent";e.target.style.color=B.pinkD;}}>View all community rooms & prayer wall →</button>

        {/* LOCKED ROOM */}
        <div onClick={()=>streak>=7&&enterRoom(LOCKED_ROOM)} style={{background:streak>=7?B.night:B.beigeD,border:`1px solid ${streak>=7?"rgba(201,169,110,0.3)":B.beigeD}`,borderRadius:"12px",padding:"17px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:"12px",cursor:streak>=7?"pointer":"default",transition:"all 0.2s"}}>
          <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
            <span style={{fontSize:"1.25rem"}}>{streak>=7?"🗝️":"🔒"}</span>
            <div><div style={{fontFamily:SERIF,fontSize:"0.97rem",fontWeight:600,color:streak>=7?B.goldL:B.inkL,marginBottom:"3px"}}>The Locked Room</div><div style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.78rem",color:streak>=7?B.gold:B.inkLL}}>{streak>=7?"You've earned access. The deepest questions await.":`Journal ${7-streak} more day${7-streak===1?"":"s"} to unlock.`}</div></div>
          </div>
          {streak>=7&&<span style={{color:B.gold}}>›</span>}
        </div>
      </main>
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
          <button onClick={()=>setScreen("home")} style={{background:"transparent",border:"none",cursor:"pointer",color:t.sub,fontSize:"0.8rem",fontFamily:SANS,padding:0}}>← Home</button>
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
                {jTexts[0].trim()&&journalStep===0&&<button onClick={()=>setJournalStep(1)} style={{background:"transparent",border:`1px solid ${t.border}`,color:t.sub,padding:"5px 13px",borderRadius:"6px",cursor:"pointer",fontSize:"0.73rem",fontFamily:SANS}} onMouseEnter={e=>{e.target.style.borderColor=t.accent;e.target.style.color=t.accent;}} onMouseLeave={e=>{e.target.style.borderColor=t.border;e.target.style.color=t.sub;}}>Go deeper ↓</button>}
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
          <button onClick={()=>setScreen("home")} style={{background:"transparent",border:"none",cursor:"pointer",color:"rgba(255,248,232,0.4)",fontSize:"0.8rem",fontFamily:SANS,padding:0}}>← Home</button>
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
                <button onClick={()=>{const e={id:Date.now().toString(),date:todayStr(),roomId:"jesus",roomLabel:"Questions Jesus Asked",roomEmoji:"✝️",day:jesusIdx,prompt:jq.app,text:jesusText.trim(),words:wc(jesusText)};persistEntries([e,...entries]);setJesusSaved(true);}} style={{background:"#D4B464",border:"none",color:"#1A1208",padding:"9px 22px",borderRadius:"7px",cursor:"pointer",fontSize:"0.82rem",fontFamily:SANS,fontWeight:700}}>Save reflection →</button>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  /* ══ CARD ENGINE ══════════════════════════════════ */
  if(screen==="cards") return(
    <div style={{minHeight:"100vh",background:B.beige,color:B.ink,fontFamily:SANS}}>
      <style>{GFONTS}{CSS}</style>
      <DarkHeader title="✦ Shareable Question Cards" onBack={()=>setScreen("home")}
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
    </div>
  );

  /* ══ COMMUNITY ═════════════════════════════════════ */
  if(screen==="community") return(
    <div style={{minHeight:"100vh",background:B.beige,color:B.ink,fontFamily:SANS}}>
      <style>{GFONTS}{CSS}</style>
      <DarkHeader title="👥 Community" onBack={()=>setScreen("home")}/>
      <main style={{maxWidth:"800px",margin:"0 auto",padding:"28px 22px 80px"}}>
        <div style={{position:"relative",marginBottom:"18px"}}>
          <span style={{position:"absolute",left:"13px",top:"50%",transform:"translateY(-50%)",color:B.inkLL,fontSize:"0.88rem"}}>🔍</span>
          <input placeholder="Search rooms by topic, theme, or season of life…" value={commSearch} onChange={e=>setCommSearch(e.target.value)} style={{width:"100%",background:B.white,border:`1px solid ${B.beigeD}`,borderRadius:"9px",color:B.ink,fontSize:"0.88rem",fontFamily:SANS,padding:"11px 13px 11px 38px",boxSizing:"border-box",boxShadow:"0 1px 6px rgba(0,0,0,0.04)",transition:"border-color 0.2s"}} onFocus={e=>e.target.style.borderColor=B.sageD} onBlur={e=>e.target.style.borderColor=B.beigeD}/>
        </div>
        <div style={{display:"flex",gap:"5px",marginBottom:"22px",background:B.beigeD,borderRadius:"9px",padding:"4px"}}>
          {[["rooms","Rooms"],["prayer","Prayer Wall"],["people","Find Others"]].map(([id,lb])=><button key={id} onClick={()=>setCommTab(id)} style={{flex:1,background:commTab===id?B.white:"transparent",border:"none",color:commTab===id?B.ink:B.inkL,padding:"8px",borderRadius:"6px",cursor:"pointer",fontSize:"0.8rem",fontFamily:SANS,fontWeight:commTab===id?600:400,transition:"all 0.15s",boxShadow:commTab===id?"0 1px 6px rgba(0,0,0,0.06)":"none"}}>{lb}</button>)}
        </div>
        {commTab==="rooms"&&(
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))",gap:"11px"}}>
            {commRooms.map((room,i)=>{
              const t=th(room.id),light=t.light;
              return(<div key={room.id} className="room-c" onClick={()=>enterRoom(room)} style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:"12px",padding:"20px",cursor:"pointer",transition:"all 0.2s",boxShadow:"0 2px 12px rgba(0,0,0,0.07)",position:"relative",overflow:"hidden",animation:`fadeUp .4s ${i*.06}s ease both`}}>
                <div style={{position:"absolute",top:0,left:0,right:0,height:"2px",background:t.accent}}/>
                {room.id==="singleness"&&<Stars/>}
                <div style={{position:"relative"}}>
                  <div style={{fontSize:"1.4rem",marginBottom:"9px"}}>{room.emoji}</div>
                  <div style={{fontFamily:SERIF,fontSize:"1.05rem",fontWeight:700,color:light?"#3A1828":t.text,marginBottom:"5px"}}>{room.label}</div>
                  <div style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.8rem",color:light?"rgba(58,24,40,0.55)":t.sub,marginBottom:"11px",lineHeight:1.5}}>{room.description}</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:"4px"}}>{room.themes?.slice(0,3).map(tg=><span key={tg} style={{fontSize:"0.62rem",background:`${t.accent}18`,color:t.accent,border:`1px solid ${t.accent}28`,padding:"2px 7px",borderRadius:"99px",fontFamily:SANS}}>{tg}</span>)}</div>
                </div>
              </div>);
            })}
          </div>
        )}
        {commTab==="prayer"&&(
          <>
            <div style={{background:B.white,border:`1px solid ${B.beigeD}`,borderRadius:"12px",padding:"20px",marginBottom:"16px",boxShadow:"0 1px 8px rgba(0,0,0,0.04)"}}>
              <div style={{fontSize:"0.68rem",fontFamily:SANS,fontWeight:600,letterSpacing:"0.1em",color:B.inkLL,textTransform:"uppercase",marginBottom:"11px"}}>Share a prayer request</div>
              <textarea value={newPrayer} onChange={e=>setNewPrayer(e.target.value)} placeholder="Share what's on your heart. This community will pray with you…" style={{width:"100%",background:B.beige,border:`1px solid ${B.beigeD}`,borderRadius:"8px",color:B.ink,fontSize:"0.9rem",fontFamily:SERIF,padding:"13px",minHeight:"80px",boxSizing:"border-box",marginBottom:"9px",lineHeight:1.7,transition:"border-color 0.2s"}} onFocus={e=>e.target.style.borderColor=B.sageD} onBlur={e=>e.target.style.borderColor=B.beigeD}/>
              <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
                <select value={prayerTag} onChange={e=>setPrayerTag(e.target.value)} style={{background:B.beige,border:`1px solid ${B.beigeD}`,borderRadius:"7px",color:B.inkM,fontSize:"0.82rem",fontFamily:SANS,padding:"7px 11px",flex:1,minWidth:"130px"}}>
                  <option value="">Tag a topic…</option>
                  {["Healing","Marriage","Singleness","Motherhood","Grief","Anxiety","Finances","Purpose","Forgiveness","Depression","Faith","Career"].map(t=><option key={t}>{t}</option>)}
                </select>
                <button onClick={postPrayer} disabled={!newPrayer.trim()} style={{background:newPrayer.trim()?B.sageDk:"transparent",border:`1px solid ${newPrayer.trim()?B.sageDk:B.beigeD}`,color:newPrayer.trim()?"#fff":B.inkLL,padding:"8px 20px",borderRadius:"7px",cursor:newPrayer.trim()?"pointer":"default",fontSize:"0.82rem",fontFamily:SANS,fontWeight:600,transition:"all 0.2s"}}>Post anonymously 🙏</button>
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:"9px"}}>
              {filteredPrayers.map(p=>(
                <div key={p.id} style={{background:B.white,border:`1px solid ${B.beigeD}`,borderRadius:"12px",padding:"16px 18px",boxShadow:"0 1px 6px rgba(0,0,0,0.04)"}}>
                  <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"8px"}}><span style={{fontSize:"0.63rem",background:`${B.pinkD}22`,color:B.pinkD,border:`1px solid ${B.pinkD}44`,padding:"2px 8px",borderRadius:"99px",fontFamily:SANS,fontWeight:600}}>{p.tag}</span><span style={{fontSize:"0.68rem",color:B.inkLL,fontFamily:SANS,marginLeft:"auto"}}>{p.date}</span></div>
                  <p style={{fontFamily:SERIF,fontSize:"0.97rem",color:B.ink,margin:"0 0 11px",lineHeight:1.7}}>{p.text}</p>
                  <button onClick={()=>prayFor(p.id)} style={{background:`${B.sage}33`,border:`1px solid ${B.sage}`,color:B.sageDk,padding:"6px 15px",borderRadius:"7px",cursor:"pointer",fontSize:"0.76rem",fontFamily:SANS,fontWeight:600,transition:"all 0.15s"}} onMouseEnter={e=>e.target.style.background=B.sage} onMouseLeave={e=>e.target.style.background=`${B.sage}33`}>🙏 Praying ({p.prayers})</button>
                </div>
              ))}
            </div>
          </>
        )}
        {commTab==="people"&&(
          <div style={{background:B.white,border:`1px solid ${B.beigeD}`,borderRadius:"12px",padding:"28px",textAlign:"center",boxShadow:"0 1px 8px rgba(0,0,0,0.04)"}}>
            <div style={{fontSize:"1.8rem",marginBottom:"12px"}}>🌿</div>
            <h3 style={{fontFamily:SERIF,fontSize:"1.3rem",fontWeight:700,color:B.ink,margin:"0 0 10px"}}>Find Your People</h3>
            <p style={{fontFamily:SERIF,fontStyle:"italic",color:B.inkL,fontSize:"0.93rem",margin:"0 0 20px",lineHeight:1.7}}>Connect with others walking through similar seasons. Choose a room, join the community, and know you are not alone.</p>
            <div style={{display:"flex",flexWrap:"wrap",gap:"7px",justifyContent:"center",marginBottom:"20px"}}>
              {["Divorced Women","Divorced Men","Single Women","Single Men","New Moms","Grieving","Waiting for a Spouse","Healing","Empty Nesters","Struggling with Faith"].map(tag=><span key={tag} style={{fontSize:"0.77rem",background:B.pink,color:"#6A3040",border:`1px solid ${B.pinkD}`,padding:"5px 13px",borderRadius:"99px",fontFamily:SANS}}>{tag}</span>)}
            </div>
            <p style={{fontSize:"0.78rem",color:B.inkLL,fontFamily:SANS,lineHeight:1.7,margin:0}}>Full matching — including private messaging and group circles — will be available in the full app launch. 💛</p>
          </div>
        )}
      </main>
    </div>
  );

  /* ══ INSIGHTS ══════════════════════════════════════ */
  if(screen==="insights") return(
    <div style={{minHeight:"100vh",background:B.beige,color:B.ink,fontFamily:SANS}}>
      <style>{GFONTS}{CSS}</style>
      <DarkHeader title="📊 Your Insights" onBack={()=>setScreen("home")}/>
      <main style={{maxWidth:"700px",margin:"0 auto",padding:"28px 22px 80px"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"10px",marginBottom:"14px"}}>
          {[{e:"📝",v:entries.length,l:"Reflections"},{e:"✍️",v:totalWords.toLocaleString(),l:"Words written"},{e:"🔥",v:`${streak}d`,l:"Streak"}].map((s,i)=>(
            <div key={s.l} style={{background:B.white,border:`1px solid ${B.beigeD}`,borderRadius:"12px",padding:"18px 13px",textAlign:"center",boxShadow:"0 1px 8px rgba(0,0,0,0.04)",animation:`fadeUp .45s ${i*.1}s ease both`}}>
              <div style={{fontSize:"1.3rem",marginBottom:"6px"}}>{s.e}</div>
              <div style={{fontFamily:SERIF,fontSize:"1.5rem",fontWeight:700,color:B.sageDk}}>{s.v}</div>
              <div style={{fontSize:"0.67rem",color:B.inkLL,letterSpacing:"0.07em",textTransform:"uppercase",fontWeight:500,marginTop:"3px"}}>{s.l}</div>
            </div>
          ))}
        </div>
        {entries.length>0&&(
          <>
            <div style={{background:B.white,border:`1px solid ${B.beigeD}`,borderRadius:"12px",padding:"22px",marginBottom:"12px",boxShadow:"0 1px 8px rgba(0,0,0,0.04)"}}>
              <UILabel>Theme breakdown</UILabel>
              {themeData.filter(t=>t.count>0).map(t=>(
                <div key={t.theme} style={{marginBottom:"10px"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:"4px"}}><span style={{fontSize:"0.84rem",color:B.ink,textTransform:"capitalize"}}>{t.theme}</span><span style={{fontSize:"0.76rem",color:B.inkLL}}>{t.pct}%</span></div><div style={{height:"5px",background:B.beigeD,borderRadius:"99px",overflow:"hidden"}}><div style={{height:"100%",width:`${t.pct}%`,background:`linear-gradient(90deg,${B.sageDk},${B.sage})`,borderRadius:"99px",transition:"width 0.7s ease"}}/></div></div>
              ))}
            </div>
            <div style={{background:B.white,border:`1px solid ${B.beigeD}`,borderRadius:"12px",padding:"22px",boxShadow:"0 1px 8px rgba(0,0,0,0.04)"}}>
              <UILabel>Journey progress</UILabel>
              {[...REFLECTION_ROOMS,...COMMUNITY_ROOMS].map(room=>{
                const prog=roomProg(room),pct=Math.round(prog/room.days.length*100);
                return(<div key={room.id} style={{marginBottom:"10px"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:"4px"}}><span style={{fontSize:"0.82rem",color:B.ink}}>{room.emoji} {room.label}</span><span style={{fontSize:"0.74rem",color:B.inkLL}}>{prog}/{room.days.length}</span></div><div style={{height:"4px",background:B.beigeD,borderRadius:"99px",overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,background:th(room.id).accent,borderRadius:"99px",transition:"width 0.6s"}}/></div></div>);
              })}
            </div>
          </>
        )}
        {entries.length===0&&<div style={{background:B.white,borderRadius:"12px",padding:"48px 28px",textAlign:"center",border:`1px solid ${B.beigeD}`}}><div style={{fontSize:"1.8rem",marginBottom:"12px"}}>🌱</div><p style={{fontFamily:SERIF,fontStyle:"italic",color:B.inkL,margin:"0 0 18px"}}>Your insights will emerge as you reflect. Begin with any room.</p><button onClick={()=>setScreen("home")} style={{background:B.night,border:"none",color:B.goldL,padding:"11px 26px",borderRadius:"8px",cursor:"pointer",fontSize:"0.83rem",fontFamily:SANS,fontWeight:600}}>Choose a room →</button></div>}
      </main>
    </div>
  );

  /* ══ HISTORY ═══════════════════════════════════════ */
  if(screen==="history") return(
    <div style={{minHeight:"100vh",background:B.beige,color:B.ink,fontFamily:SANS}}>
      <style>{GFONTS}{CSS}</style>
      <DarkHeader title="📖 Reflection History" onBack={()=>setScreen("home")}/>
      <main style={{maxWidth:"700px",margin:"0 auto",padding:"28px 22px 80px"}}>
        {entries.length===0?(
          <div style={{background:B.white,borderRadius:"12px",padding:"48px 28px",textAlign:"center",border:`1px solid ${B.beigeD}`}}><div style={{fontSize:"1.8rem",marginBottom:"12px"}}>📖</div><p style={{fontFamily:SERIF,fontStyle:"italic",color:B.inkL,margin:"0 0 18px"}}>Your reflections will live here.</p><button onClick={()=>setScreen("home")} style={{background:B.night,border:"none",color:B.goldL,padding:"11px 26px",borderRadius:"8px",cursor:"pointer",fontSize:"0.83rem",fontFamily:SANS,fontWeight:600}}>Begin →</button></div>
        ):(
          <div style={{display:"flex",flexDirection:"column",gap:"9px"}}>
            {entries.map(e=>{
              const allR=[...REFLECTION_ROOMS,...COMMUNITY_ROOMS,LOCKED_ROOM,{id:"jesus",label:"Jesus Questions",emoji:"✝️"},{id:"viral",label:"Questions",emoji:"✦"}];
              const room=allR.find(r=>r.id===e.roomId)||{emoji:e.roomEmoji||"📝",label:e.roomLabel||"Reflection"};
              const t=th(e.roomId)||th("fear");
              return(<div key={e.id} style={{background:B.white,border:`1px solid ${B.beigeD}`,borderRadius:"12px",padding:"16px 18px",boxShadow:"0 1px 6px rgba(0,0,0,0.04)"}}>
                <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"8px"}}><span>{room.emoji}</span><span style={{fontSize:"0.77rem",fontWeight:600,color:t.accent,fontFamily:SANS}}>{room.label} · Day {e.day+1}</span><span style={{marginLeft:"auto",fontSize:"0.68rem",color:B.inkLL}}>{e.date}</span></div>
                <div style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.82rem",color:B.inkL,marginBottom:"8px",lineHeight:1.55,borderLeft:`2px solid ${B.beigeD}`,paddingLeft:"11px"}}>{e.prompt}</div>
                <div style={{fontFamily:SERIF,fontSize:"0.93rem",color:B.ink,lineHeight:1.75}}>{e.text.length>240?e.text.slice(0,240)+"…":e.text}</div>
                <div style={{marginTop:"6px",fontSize:"0.67rem",color:B.inkLL}}>{e.words} words</div>
              </div>);
            })}
          </div>
        )}
      </main>
    </div>
  );

  return null;
}
