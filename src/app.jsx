import { useState, useEffect, useMemo, useRef, useCallback, Component } from "react";
import { auth, db, functions, googleProvider, signInWithPopup, signInWithRedirect, getRedirectResult, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, updateProfile, signOut, onAuthStateChanged, doc, getDoc, setDoc, collection, getDocs, query, where, orderBy, limit, addDoc, deleteDoc, serverTimestamp, Timestamp, onSnapshot, httpsCallable } from "./firebase.js";
import { OverworldScreen } from './overworld/index.js';
import { resolveSprite } from './overworld/sprites.js';
import { DEFAULT_ROOM, migrateRoom, placeItem, isPlacedInRoom } from './roomDecor.js';
import { ITEMS, isOwned, isArtItemId, getArtItemDef } from './items.js';
import { createEmptyGrid, serializeGrid, deserializeGrid } from './systems/GardenGrid.js';
import { canUnlockRabbit } from './systems/rabbitUnlock.js';
/* R3F imports removed — ImmersiveCabin uses pure DOM/Canvas2D for performance */
import { GFONTS, B, SERIF, SANS, DISPLAY, RT, th, REFLECTION_ROOMS, COMMUNITY_ROOMS, LOCKED_ROOM, JESUS_QUESTIONS, QUESTION_SETS, ALL_CARD_QS, CARD_THEMES, CARD_RATIOS, VERSE_THEMES, VIRAL_QS, SAMPLE_PRAYERS, SHELF_BOOKS, BOOK_COVERS, BOOK_CONTENT, getBookPageCount, todayStr, nowTime, entryTime, isoDate, wc, shuffle, THEME_WORDS, aggregateThemes, EMOTION_WORDS, LIFE_THEMES, FAITH_WORDS, SCRIPTURE_PATTERN, IDENTITY_NEG, IDENTITY_POS, GROWTH_MARKERS, STOP_WORDS, EMOTION_COLORS, computeInsights, computeWeeklyDigest, computeSeasonalSummary, computeFutureYou, SHOP_ITEMS, GARDEN_PLANTS, GROWTH_STAGES, PRAYER_BONUS_MINS, CRAFTING_STATIONS, ITEM_CATALOG, KITCHEN_RECIPES, NPC_TRADES, FARM_PLANTS, ANIMAL_TYPES, MAX_ANIMALS, DAILY_MISSIONS, WEEKLY_MISSIONS, getWeekStart, CABIN_FALLBACK_IMAGE, PREMIUM_DAILY_MISSIONS, PREMIUM_WEEKLY_MISSIONS, PREMIUM_GARDEN_PLANTS, PREMIUM_FARM_PLANTS, PREMIUM_ANIMALS, PREMIUM_PROMPTS, PREMIUM_SHOP_ITEMS, PLUS_BENEFITS, BLOG_OWNER_EMAIL, isBlogOwner } from './constants.js';
import { CSS } from './styles.js';
import ImmersiveCabin from './components/ImmersiveCabin.jsx';
import BookSparkles from './components/BookSparkles.jsx';
import CabinScreen from './screens/CabinScreen.jsx';
import ProfileScreen from './screens/ProfileScreen.jsx';
import FeedScreen from './screens/FeedScreen.jsx';
import NotificationsScreen from './screens/NotificationsScreen.jsx';
import CheckInScreen from './screens/CheckInScreen.jsx';
import BecomingHerScreen from './screens/BecomingHerScreen.jsx';
import DiamondArtScreen from './screens/DiamondArtScreen.jsx';
import ColoringScreen from './screens/ColoringScreen.jsx';
import LeakyBucketScreen from './screens/LeakyBucketScreen.jsx';
import DiamondArtFrame from './components/DiamondArtFrame.jsx';
import WordSearchScreen from './screens/WordSearchScreen.jsx';
import HiddenObjectScreen from './screens/HiddenObjectScreen.jsx';
import PregnancyMeditationScreen from './screens/PregnancyMeditationScreen.jsx';
import { parseReference } from './data/bibleBooks.js';
import FertilityTrackerScreen from './screens/FertilityTrackerScreen.jsx';
import VerseTranslationModal from './components/VerseTranslationModal.jsx';
import TrackersScreen, { createEmptyTrackers } from './screens/TrackersScreen.jsx';
import PregnancyScreen, { createEmptyPregnancy } from './screens/PregnancyScreen.jsx';
import { computeWeek } from './data/pregnancyWeeks.js';
import RooftopLoungeScreen from './screens/RooftopLoungeScreen.jsx';
import RooftopGardenScreen from './screens/RooftopGardenScreen.jsx';
import CheckInCalendar from './screens/CheckInCalendar.jsx';
import PostCard from './components/PostCard.jsx';
import UpperRoomGatherings from './screens/UpperRoomGatherings.jsx';
import GatheringFeed from './screens/GatheringFeed.jsx';
import GatheringPost from './screens/GatheringPost.jsx';
import CreateGatheringPost from './screens/CreateGatheringPost.jsx';
import UpperRoomSearch from './screens/UpperRoomSearch.jsx';
import PorchBlogScreen from './screens/PorchBlogScreen.jsx';
import BlogBoardScreen from './screens/BlogBoardScreen.jsx';
import BlogPostScreen from './screens/BlogPostScreen.jsx';
import WriteBlogScreen from './screens/WriteBlogScreen.jsx';
import { generateAnonName, makeSearchTokens, GATHERING_SPACES } from './gatherings.js';
import { ambientPlay, ambientStop, ambientMute, ambientUnmute, ambientIsPlaying, SOUND_LIBRARY, AMBIENT_TRACKS } from './systems/ambientSound.js';
import { ROOM_THEMES, DEFAULT_ROOM_THEME, ROOM_THEME_KEY, ROOM_THEME_EVENT, getRoomTheme, useRoomTheme, COZY_CREATIONS_FALLBACK, BIBLE_BG_FALLBACK } from './systems/roomThemes.js';
import { WindowWeather } from './components/CottageBackground.jsx';


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
      const fieldMap={"irj-entries":"entries","irj-prayer":"prayerPosts","irj-saved-cards":"savedCards","irj-onboarded":"isOnboarded","irj-candles":"candles","irj-prayed":"prayedFor","irj-owned-items":"ownedItems","irj-garden":"gardenPlots","irj-inventory":"inventory","irj-saved-verses":"savedVerses","irj-bank":"bank","irj-sell-basket":"sellBasket","irj-farm-plots":"farmPlots","irj-animals":"animals","irj-missions":"missions","irj-premium":"isPremium","irj-becoming-her":"becomingHer","irj-trackers":"trackers","irj-pregnancy":"pregnancy","irj-garden-grid":"gardenGrid","irj-unlocks":"unlocks","irj-diamond-art":"diamondArt","irj-art-gallery":"artGallery","irj-imported-templates":"importedTemplates","irj-word-search":"wordSearch","irj-hidden-object":"hiddenObject","irj-pregnancy-meditations":"pregnancyMeditations","irj-father-meditations":"fatherMeditations","irj-conceive-meditations":"conceiveMeditations","irj-fertility":"fertility","irj-room-theme":"roomTheme","irj-coloring":"coloring","irj-leaky-bucket":"leakyBucket"};
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
/* BookSparkles extracted to components/BookSparkles.jsx */
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
const KITCHEN_BG_IMAGE="/kitchen.webp";
const STOVE_BG_IMAGE="/stove.webp";
const MARKET_BG_IMAGE="/market.webp";
const KITCHEN_WINDOW_BG_IMAGE="/kitchen-window.webp";
const UPPER_ROOM_BG_IMAGE="/upper-room-hall.webp";

/* Ambient sound system lives in ./systems/ambientSound.js so it can be
   shared with screens that don't render BottomMenuDrawer (Word Search,
   Diamond Art, etc.). `_amb` is the same window-backed singleton. */
const _amb = window.__irjAmbient || (window.__irjAmbient = { el: null, timer: null, id: null, target: 0 });

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
  const theme=useRoomTheme();
  const bgImage=theme.kitchen||KITCHEN_BG_IMAGE;
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
  const windowSnow=useRef([]);
  const time=useRef(0);
  const imgRef=useRef(null);

  const PARALLAX=22;
  const SENSITIVITY=0.4;

  // Snow falling outside the kitchen window — only when the active season's
  // weather is 'snow' and it defines a kitchenWindow box (e.g. Christmas).
  const snowWindow=(theme.weather==='snow'&&theme.kitchenWindow)?theme.kitchenWindow:null;
  const snowWindowRef=useRef(null);
  snowWindowRef.current=snowWindow; // keep the long-lived animation loop in sync with live season changes

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

  // Build snowflakes (normalized 0..1 within the window box) when the season snows.
  useEffect(()=>{
    if(!snowWindow){windowSnow.current=[];return;}
    const flakes=[];
    for(let i=0;i<80;i++){
      flakes.push({
        x:Math.random(),y:Math.random(),
        r:Math.random()*1.6+0.6,
        speed:Math.random()*0.003+0.0015,
        sway:Math.random()*0.0022+0.0006,
        phase:Math.random()*Math.PI*2,
        opacity:Math.random()*0.5+0.3,
      });
    }
    windowSnow.current=flakes;
  },[snowWindow]);

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
        // Snowfall clipped to the kitchen window glass (tracks the parallax offset)
        const sw=snowWindowRef.current;
        if(sw&&windowSnow.current.length){
          const wx=(parseFloat(sw.left)/100)*w+offsetX.current+bx;
          const wy=(parseFloat(sw.top)/100)*h+offsetY.current+by;
          const ww=(parseFloat(sw.width)/100)*w;
          const wh=(parseFloat(sw.height)/100)*h;
          ctx.save();
          ctx.beginPath();
          const rTop=Math.min(ww,wh)*0.5;
          if(ctx.roundRect) ctx.roundRect(wx,wy,ww,wh,[rTop,rTop,ww*0.04,ww*0.04]);
          else ctx.rect(wx,wy,ww,wh);
          ctx.clip();
          windowSnow.current.forEach(f=>{
            f.y+=f.speed; f.x+=Math.sin(time.current*0.001+f.phase)*f.sway;
            if(f.y>1.03){f.y=-0.03;f.x=Math.random();}
            if(f.x<-0.05)f.x=1.05; else if(f.x>1.05)f.x=-0.05;
            const fx=wx+f.x*ww, fy=wy+f.y*wh;
            ctx.beginPath();ctx.arc(fx,fy,f.r,0,Math.PI*2);
            ctx.fillStyle=`rgba(245,250,255,${f.opacity})`;ctx.fill();
          });
          ctx.restore();
        }
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
      <img ref={imgRef} src={bgImage} alt="Kitchen" style={{position:"absolute",top:0,left:0,width:`calc(100% + ${PARALLAX*2}px)`,height:`calc(100% + ${PARALLAX*2}px)`,objectFit:"cover",transform:`translate(${-PARALLAX}px,${-PARALLAX}px)`,willChange:"transform",userSelect:"none",WebkitUserDrag:"none",pointerEvents:"none"}} draggable={false}/>
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

/* Cozy Creations Room background — seasonal art-studio scene. Reads the live
   season via the shared hook so it re-skins instantly when the Season changes. */
function CozyCreationsRoom(){
  const theme=useRoomTheme();
  const bg=theme.artRoom||COZY_CREATIONS_FALLBACK;
  return <img src={bg} alt="Cozy Creations Room" draggable={false} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",userSelect:"none",pointerEvents:"none"}}/>;
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

/* CabinScene3D is replaced by ImmersiveCabin (extracted to components/ImmersiveCabin.jsx) */

/* ═══════════════════════════════════════════════════
   IMMERSIVE GARDEN — Enchanted greenhouse with garden.png
   Stone path leading to glowing archway door, circular
   dirt plots on either side, lanterns, string lights,
   lush plants and lavender throughout.
═══════════════════════════════════════════════════ */
const GARDEN_BG_IMAGE="/garden.webp";

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

// Animal pen slots — horizontal row below farm plots, above bottom buttons
const ANIMAL_PEN_POSITIONS=[
  {left:"8%", top:"86%",size:"13vw",maxSize:"64px"},
  {left:"25%",top:"86%",size:"13vw",maxSize:"64px"},
  {left:"42%",top:"86%",size:"13vw",maxSize:"64px"},
  {left:"58%",top:"86%",size:"13vw",maxSize:"64px"},
  {left:"75%",top:"86%",size:"13vw",maxSize:"64px"},
  {left:"92%",top:"86%",size:"13vw",maxSize:"64px"},
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
   ERROR BOUNDARY — prevents white screen crashes
═══════════════════════════════════════════════════ */
class ErrorBoundary extends Component{
  constructor(p){super(p);this.state={hasError:false,error:null};}
  static getDerivedStateFromError(e){return{hasError:true,error:e};}
  componentDidCatch(e,info){console.error("Inner Room caught error:",e,info);}
  render(){
    if(this.state.hasError) return(
      <div style={{minHeight:"100vh",background:"#1A1612",display:"flex",alignItems:"center",justifyContent:"center",padding:32}}>
        <div style={{textAlign:"center",maxWidth:340}}>
          <div style={{fontSize:"2rem",marginBottom:16}}>🕯️</div>
          <h2 style={{fontFamily:"Georgia,serif",color:"#E8D4A0",fontSize:"1.2rem",margin:"0 0 12px"}}>Something went wrong</h2>
          <p style={{fontFamily:"Georgia,serif",fontStyle:"italic",color:"rgba(232,212,160,0.5)",fontSize:"0.85rem",lineHeight:1.6,margin:"0 0 24px"}}>Your entries are safe. Try refreshing the page.</p>
          <button onClick={()=>{this.setState({hasError:false,error:null});window.location.reload();}} style={{background:"rgba(201,169,110,0.15)",border:"1px solid rgba(201,169,110,0.3)",color:"#E8D4A0",padding:"10px 28px",borderRadius:8,cursor:"pointer",fontFamily:"Georgia,serif",fontSize:"0.88rem"}}>Refresh</button>
        </div>
      </div>
    );
    return this.props.children;
  }
}

/* ═══════════════════════════════════════════════════
   MAIN APP
═══════════════════════════════════════════════════ */
function AppInner(){
  // ── STATE ──
  const [screen,        setScreen]        = useState("loading");
  const prevScreenRef = useRef(null);
  const [obStep,        setObStep]        = useState(0);
  const [sceneIdx,      setSceneIdx]      = useState(0);
  const [sceneTransit,  setSceneTransit]  = useState(false);
  const [scenePrev,     setScenePrev]     = useState(-1);
  const [bookOpen,      setBookOpen]      = useState(false);
  const [prevScreen,    setPrevScreen]    = useState("cabin");
  const [selectedBlogPost, setSelectedBlogPost] = useState(null); // porch blog: post being read
  const [editingBlogPost,  setEditingBlogPost]  = useState(null); // porch blog: post being edited (null = new)
  const [spaceTransit,  setSpaceTransit]  = useState(false);
  const [transitDir,    setTransitDir]    = useState(null);
  const [onboardStep,   setOnboardStep]   = useState(0);
  const [overworldPos,  setOverworldPos]  = useState(null);
  const [playerAppearance, setPlayerAppearance] = useState(null);
  const [playerRoom, setPlayerRoom] = useState(DEFAULT_ROOM);
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
  const [historyMode,   setHistoryMode]   = useState("list"); // "list" | "calendar"
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
  const manualSoundRef = useRef(false); // true when user picked a sound from the menu drawer
  const [menuOpen,       setMenuOpen]     = useState(false); // bottom menu drawer open/closed
  const [menuSoundsOpen, setMenuSoundsOpen] = useState(false); // sounds section expanded in drawer
  const [menuRoomOpen,   setMenuRoomOpen]   = useState(false); // room-style section expanded in drawer
  const [roomTheme,      setRoomTheme]      = useState(()=>{ try{return JSON.parse(localStorage.getItem(ROOM_THEME_KEY))||DEFAULT_ROOM_THEME;}catch{return DEFAULT_ROOM_THEME;} }); // selected activity-room backdrop

  // ── Bible reader (Upper Room) ──
  const [bibleView,     setBibleView]     = useState(null);   // null|"books"|"chapters"|"reading"
  const bibleFromCabinRef = useRef(false); // opened from the cabin book chooser → back returns there
  const [reopenBookChooser, setReopenBookChooser] = useState(0); // bumped to reopen the cabin's book chooser
  const [bibleBook,     setBibleBook]     = useState(0);
  const [bibleChapter,  setBibleChapter]  = useState(0);
  const [bibleFontSize, setBibleFontSize] = useState(()=>{try{return parseInt(localStorage.getItem("irj-bible-fontsize"))||18;}catch{return 18;}});
  const [bibleLoading,  setBibleLoading]  = useState(false);
  const [bibleSearch,   setBibleSearch]   = useState("");
  const [translateVerse, setTranslateVerse] = useState(null); // null | { bookIdx, chapter, verseIdx }
  const bibleDataRef = useRef(null);
  const editEntryRef = useRef(null);
  // ── Market stalls ──
  const [marketStall, setMarketStall] = useState(null); // null|"harvest"
  // ── Economy state ──
  const [bank,         setBank]         = useState({coins:0, diamonds:0});
  const [sellBasket,   setSellBasket]   = useState([]);   // [{itemId, qty, listedAt}]
  const [shopStall,    setShopStall]    = useState(null);  // "general"|"barter"
  const [inventoryTab, setInventoryTab] = useState("all"); // category filter
  const [farmPlots,    setFarmPlots]    = useState([]); // economy garden plots
  const [animals,      setAnimals]      = useState([]); // farm animals [{id,typeId,status,produceReadyAt}]
  const [animalModal,  setAnimalModal]  = useState(null); // null|"buy"|animalId
  const [gardenMode,   setGardenMode]   = useState("farm"); // "farm"|"prayers"
  const [toast,        setToast]        = useState(null); // {msg,emoji} — ephemeral notification
  // ── Prayer reminders ──
  const [reminderPanel, setReminderPanel] = useState(null); // null or {id,time,frequency,days} — editing state
  const [notifPermission, setNotifPermission] = useState(() =>
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );
  // ── Multiplayer state ──
  const [userProfile,       setUserProfile]       = useState(null);
  const [communityListings, setCommunityListings] = useState([]);
  const [communityPrayers,  setCommunityPrayers]  = useState([]);
  const [communityEvents,   setCommunityEvents]   = useState([]);
  const [visitingFarm,      setVisitingFarm]      = useState(null); // {userId,username,farmPlots,gardenPlots}
  const [profileUserId,     setProfileUserId]     = useState(null);
  const [unreadCount,       setUnreadCount]       = useState(0);
  const [missions,          setMissions]          = useState(null);
  const [showMissions,      setShowMissions]      = useState(false);
  const [isPremium,         setIsPremium]         = useState(false);
  const [devPremiumOverride,setDevPremiumOverride]= useState(false);
  const [communityTab,      setCommunityTab]      = useState("browse"); // "browse"|"myListings"|"npc"
  const [prayerWallTab,     setPrayerWallTab]     = useState("mine"); // "mine"|"community"
  const [upperRoomView,     setUpperRoomView]     = useState(null); // null|"scriptures"|"prayer-wall"|"feed"|"notifications"|"find-people"
  const [userSearch,        setUserSearch]         = useState("");
  const [userResults,       setUserResults]        = useState([]);
  const [userSearchLoading, setUserSearchLoading]  = useState(false);
  const [lastCheckinIntensity, setLastCheckinIntensity] = useState(null);
  const [becomingHer, setBecomingHer] = useState(null); // Becoming Her journal progress
  const [trackers, setTrackers] = useState(null); // Bill / Savings / Spending trackers
  const [pregnancy, setPregnancy] = useState(null); // The Nursery pregnancy tracker
  const [gardenGrid, setGardenGridRaw] = useState(() => createEmptyGrid()); // Rooftop garden tile grid
  const [unlocks, setUnlocksRaw] = useState({}); // Persistent unlock flags { rabbitUnlocked, ... }
  const [diamondArt, setDiamondArtRaw] = useState({}); // In-progress diamond art works keyed by templateId/freeKey
  const [artGallery, setArtGalleryRaw] = useState([]); // Completed diamond art pieces
  const [importedTemplates, setImportedTemplatesRaw] = useState({}); // User-imported AI-generated artwork templates
  const [wordSearch, setWordSearchRaw] = useState({}); // Word search puzzle progress keyed by puzzleId
  const [hiddenObject, setHiddenObjectRaw] = useState({}); // Hidden object scene progress keyed by sceneId
  const [pregnancyMeditations, setPregnancyMeditationsRaw] = useState({}); // Pregnancy meditation card progress { currentWeek, completed }
  const [fatherMeditations, setFatherMeditationsRaw] = useState({});       // Father's weekly meditation progress { currentWeek, completed }
  const [conceiveMeditations, setConceiveMeditationsRaw] = useState({});    // Trying-to-conceive meditation progress { completed }
  const [fertility, setFertilityRaw] = useState({});                       // Fertility / TTC tracker { periodStarts, cycleLength, periodLength, notes }
  const [coloring, setColoringRaw] = useState({});                         // Coloring page progress keyed by pageId { imageData, updatedAt }
  const [leakyBucket, setLeakyBucketRaw] = useState([]);                    // Leaky Bucket (Episode 1) saved reflections [{ id, sources, plugs, reflection, createdAt, theme }]
  const [craftChooser, setCraftChooser] = useState(false);                 // "What would you like to create?" modal in the art studio
  const [puzzleChooser, setPuzzleChooser] = useState(false);               // "Pick a puzzle" modal (Word Search / Hidden Object) at the desk
  const [activeGatheringSpace, setActiveGatheringSpace] = useState(null);
  const [gatheringPosts, setGatheringPosts] = useState([]);
  const [gatheringLoading, setGatheringLoading] = useState(false);
  const [activePost, setActivePost] = useState(null);
  const [postReplies, setPostReplies] = useState([]);
  const [postRepliesLoading, setPostRepliesLoading] = useState(false);
  const [gatheringReplyText, setGatheringReplyText] = useState("");
  const [gatheringReplySubmitting, setGatheringReplySubmitting] = useState(false);
  const [gatheringUserReaction, setGatheringUserReaction] = useState(null);
  const [gatheringSearchResults, setGatheringSearchResults] = useState(null);
  const [gatheringSearchLoading, setGatheringSearchLoading] = useState(false);
  const [gatheringSearchQuery, setGatheringSearchQuery] = useState("");
  const [gatheringSpaceCounts, setGatheringSpaceCounts] = useState({});
  const [showProfileSetup,  setShowProfileSetup]   = useState(false);
  const [setupUsername,      setSetupUsername]      = useState("");
  const [setupGender,        setSetupGender]        = useState(null); // "male"|"female"
  const [setupBio,           setSetupBio]           = useState("");
  const [usernameError,      setUsernameError]      = useState("");
  const [usernameChecking,   setUsernameChecking]   = useState(false);
  const [usernameAvailable,  setUsernameAvailable]  = useState(false);
  // ── Auth / mailing list ──
  const [authMode,           setAuthMode]           = useState("choose"); // "choose"|"email"
  const [emailSignupMode,    setEmailSignupMode]    = useState(true);     // true=create account, false=log in
  const [authEmail,          setAuthEmail]          = useState("");
  const [authEmail2,         setAuthEmail2]         = useState(""); // confirm email (signup)
  const [authPassword,       setAuthPassword]       = useState("");
  const [authPassword2,      setAuthPassword2]      = useState(""); // confirm password (signup)
  const [authName,           setAuthName]           = useState("");
  const [authError,          setAuthError]          = useState("");
  const [authBusy,           setAuthBusy]           = useState(false);
  const [marketingConsent,   setMarketingConsent]   = useState(false);
  const signupSourceRef = useRef("app"); // set from ?ref= on mount
  const [farmerSearch,      setFarmerSearch]       = useState("");
  const [farmerResults,     setFarmerResults]     = useState([]);
  const [communityLoading,  setCommunityLoading]  = useState(false);
  const [prayedPostIds,     setPrayedPostIds]     = useState(new Set());
  const [expandedComments,  setExpandedComments]  = useState(null);
  const [postComments,      setPostComments]      = useState({});
  const [commentText,       setCommentText]       = useState("");
  const [commentLoading,    setCommentLoading]    = useState(false);
  const [listingForm,       setListingForm]       = useState(null); // {itemType,quantity,pricePerUnit}
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

  // ── Close menu drawer on screen change ──
  useEffect(()=>{setMenuOpen(false);},[screen]);
  useEffect(()=>{if(screen!=="upper-room"){setUpperRoomView(null);setUserSearch("");setUserResults([]);}},[screen]);
  useEffect(()=>{if(screen==="edit-profile"&&userProfile){setSetupUsername(userProfile.username||"");setSetupGender(userProfile.gender||null);setSetupBio(userProfile.bio||"");setUsernameError("");setUsernameAvailable(false);}},[screen]);
  useEffect(()=>{if(screen!=="profile-onboard"||onboardStep!==3)return;const t=setTimeout(()=>{setIsOnboarded(true);dbSave("irj-onboarded",true);fadeOutAmbient();setScreen("cabin");},3500);return()=>clearTimeout(t);},[screen,onboardStep]);

  // ── AMBIENT SOUND — auto-play / stop per screen ──
  useEffect(()=>{
    ambientMutedRef.current = ambientMuted;
  },[ambientMuted]);

  useEffect(()=>{
    const track = AMBIENT_TRACKS[screen];
    if(track){
      // Room has its own track — override manual sound
      manualSoundRef.current = false;
      if(!ambientMutedRef.current){
        ambientPlay(track.src, { volume: track.volume, fadeMs: 2000, id: track.id });
      }
    } else if(!manualSoundRef.current) {
      // No room track and no manual sound — fade out
      if(_amb.el) ambientStop(2000);
    }
    // If manualSoundRef is true, keep the user's chosen sound playing
    return ()=>{};
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

  // ── Open a Scripture reference in the Upper Room Bible reader ──
  // Used by the meditation study pages ("Read the whole chapter in the Bible").
  const openScriptureRef = useCallback(async(reference)=>{
    const parsed=parseReference(reference);
    if(!parsed) return;
    const data=await loadBible();
    if(!data) return;
    const book=data[parsed.bookIdx];
    const chapIdx=book&&parsed.chapIdx<book.chapters.length?parsed.chapIdx:0;
    bibleFromCabinRef.current=false;
    setBibleBook(parsed.bookIdx);
    setBibleChapter(chapIdx);
    setBibleView("reading");
    setUpperRoomView("scriptures");
    setPrevScreen(screen);
    setScreen("upper-room");
  },[loadBible,screen]);

  // ── Open the Scripture Bible reader at its book list (from the cabin book chooser) ──
  const openScripture = useCallback(async()=>{
    const data=await loadBible();
    if(!data) return;
    bibleFromCabinRef.current=true; // back from the book list returns to the cabin chooser
    setBibleView("books");
    setUpperRoomView("scriptures");
    setPrevScreen(screen);
    setScreen("upper-room");
  },[loadBible,screen]);

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
  // ── Premium computed ──
  const hasPremium = isPremium || devPremiumOverride;
  // ── Missions computed values ──
  const activeMissions=useMemo(()=>getOrResetMissions?getOrResetMissions(missions):null,[missions]);
  const totalUnclaimed=useMemo(()=>{
    if(!activeMissions) return 0;
    const dc=DAILY_MISSIONS.filter(m=>{const s=activeMissions.daily?.progress?.[m.id];return s&&s.count>=m.target&&!s.claimed;}).length;
    const wc2=WEEKLY_MISSIONS.filter(m=>{const s=activeMissions.weekly?.progress?.[m.id];return s&&s.count>=m.target&&!s.claimed;}).length;
    const pdc=hasPremium?PREMIUM_DAILY_MISSIONS.filter(m=>{const s=activeMissions.daily?.progress?.[m.id];return s&&s.count>=m.target&&!s.claimed;}).length:0;
    const pwc=hasPremium?PREMIUM_WEEKLY_MISSIONS.filter(m=>{const s=activeMissions.weekly?.progress?.[m.id];return s&&s.count>=m.target&&!s.claimed;}).length:0;
    return dc+wc2+pdc+pwc;
  },[activeMissions,hasPremium]);

  const debugTapRef=useRef({count:0,timer:null});
  useEffect(()=>{
    if(new URLSearchParams(window.location.search).get("debug")==="1") setDebugHotspots(true);
    const handler=(e)=>{
      if(e.ctrlKey&&e.shiftKey&&e.key===">"){e.preventDefault();setDebugHotspots(d=>!d);}
      if(e.ctrlKey&&e.shiftKey&&e.key==="P"){e.preventDefault();setDevPremiumOverride(d=>{console.log("[DEV] Premium override:",!d);return !d;});}
    };
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
      const an   = await dbLoad("irj-animals") || [];
      const ms   = await dbLoad("irj-missions") || null;
      const pm   = await dbLoad("irj-premium") || false;
      const pa   = await dbLoad("irj-appearance") || null;
      const rm   = await dbLoad("irj-room") || null;
      const bh   = await dbLoad("irj-becoming-her") || null;
      const tr   = await dbLoad("irj-trackers") || null;
      const pg   = await dbLoad("irj-pregnancy") || null;
      const gg   = await dbLoad("irj-garden-grid") || null;
      const ul   = await dbLoad("irj-unlocks") || {};
      const da   = await dbLoad("irj-diamond-art") || {};
      const ag   = await dbLoad("irj-art-gallery") || [];
      const itp  = await dbLoad("irj-imported-templates") || {};
      const ws   = await dbLoad("irj-word-search") || {};
      const ho   = await dbLoad("irj-hidden-object") || {};
      const pm2  = await dbLoad("irj-pregnancy-meditations") || {};
      const fm   = await dbLoad("irj-father-meditations") || {};
      const cm   = await dbLoad("irj-conceive-meditations") || {};
      const fert = await dbLoad("irj-fertility") || {};
      const col  = await dbLoad("irj-coloring") || {};
      const lb   = await dbLoad("irj-leaky-bucket") || [];
      // Migrate prayers: add status/answeredDate/category if missing
      let migrated=false;
      const mpp=pp.map(p=>{
        if(!p.status){migrated=true;return {...p,status:"active",answeredDate:null,category:p.tag};}
        return p;
      });
      if(migrated) dbSave("irj-prayer",mpp);
      // Migrate old ownedItems → inventory (furniture as qty 1)
      if(oi.length>0){
        oi.forEach(id=>{inv[id]=(inv[id]||0)+1;});
        dbSave("irj-inventory",inv);
      }
      // Migrate room bag → inventory
      const migratedRoom=rm?migrateRoom(rm,(id,qty)=>{inv[id]=(inv[id]||0)+qty;}):DEFAULT_ROOM;
      if(rm?.bag?.length>0) dbSave("irj-inventory",inv);
      setEntries(ens); setPrayerPosts(mpp); setSavedCards(sc);
      setCandles(cn); setPrayedFor(pf); setGardenPlots(gp); setInventory(inv); setSavedVerses(sv);
      setBank(bnk); setSellBasket(sb); setFarmPlots(fp); setAnimals(an); setMissions(ms); setIsPremium(!!pm);
      if(pa) setPlayerAppearance(pa);
      if(bh) setBecomingHer(bh);
      if(tr) setTrackers(tr);
      if(pg) setPregnancy(pg);
      if(gg) setGardenGridRaw(deserializeGrid(gg));
      if(ul) setUnlocksRaw(ul);
      if(da) setDiamondArtRaw(da);
      if(ag) setArtGalleryRaw(ag);
      if(itp) setImportedTemplatesRaw(itp);
      if(ws) setWordSearchRaw(ws);
      if(ho) setHiddenObjectRaw(ho);
      if(pm2) setPregnancyMeditationsRaw(pm2);
      if(fm) setFatherMeditationsRaw(fm);
      if(cm) setConceiveMeditationsRaw(cm);
      if(fert) setFertilityRaw(fert);
      if(col) setColoringRaw(col);
      if(lb) setLeakyBucketRaw(lb);
      // Safety: if user has done check-ins but candle was lost in migration, restore it
      const hasCheckins=Object.keys(localStorage).some(k=>k.startsWith("irj-checkins-"));
      const candlePlaced=migratedRoom.placed?.some(p=>p.id==="candle");
      const candleInInv=(inv.candle||0)>0;
      if(hasCheckins&&!candlePlaced&&!candleInInv){
        inv.candle=(inv.candle||0)+1;
        dbSave("irj-inventory",inv);
      }
      // Grant starter garden seeds (one-time)
      if(!inv.timothy_hay_seed&&!inv.cilantro_seed){
        inv.timothy_hay_seed=5;
        inv.cilantro_seed=5;
        dbSave("irj-inventory",inv);
      }
      setPlayerRoom(migratedRoom);
      if(rm?.bag?.length>0||oi.length>0) dbSave("irj-room",migratedRoom);
      let s=0,d=new Date(),map={};
      ens.forEach(e=>{map[e.date]=true;});
      while(map[isoDate(d)]){s++;d.setDate(d.getDate()-1);} setStreak(s);
      setIsOnboarded(!!ob);
      // Shareable landing: innerroomjournal.com/blog (or /?page=blog) opens the
      // atmospheric PORCH scene first (porchforreal.png) — the door steps inside
      // (sign-in gate / cabin) and the "My Blog" book opens the readable board.
      let landing="welcome";
      try{
        const path=window.location.pathname.replace(/\/+$/,"");
        if(new URLSearchParams(window.location.search).get("page")==="blog"||path==="/blog") landing="porch";
      }catch(e){}
      setScreen(landing);
      setCardQ(shuffle(ALL_CARD_QS)[0]);
      // preload spatial world backgrounds
      ["cabin-interior.webp","upper-room-hall.webp","harvest-market.webp"].forEach(src=>{const img=new Image();img.src="/"+src;});
    })();
  },[]);

  // ── SIGNUP SOURCE (e.g. blog link: innerroomjournal.com/blog, /?ref=blog or /?page=blog) ──
  useEffect(()=>{
    try{
      const p=new URLSearchParams(window.location.search);
      const path=window.location.pathname.replace(/\/+$/,"");
      const ref=p.get("ref");
      if(ref) signupSourceRef.current=ref.toLowerCase().slice(0,40);
      else if(p.get("page")==="blog"||path==="/blog") signupSourceRef.current="blog";
    }catch(e){}
  },[]);

  // ── AUTH LISTENER ──
  useEffect(()=>{
    if(!auth) { setAuthLoading(false); return; }
    getRedirectResult(auth).catch(()=>{});
    const unsub=onAuthStateChanged(auth,async(u)=>{
      setUser(u);
      setAuthLoading(false);
      if(u){
        await syncWithCloud(u.uid);
        ensureUserProfile(u.uid, u.displayName);
      }
    });
    return ()=>unsub();
  },[]);

  // ── UNREAD NOTIFICATIONS LISTENER ──
  useEffect(()=>{
    if(!db||!user){ setUnreadCount(0); return; }
    const q=query(collection(db,"notifications"),where("recipientId","==",user.uid),where("read","==",false));
    const unsub2=onSnapshot(q,snap=>setUnreadCount(snap.size),err=>console.warn("notif listener:",err));
    return ()=>unsub2();
  },[db,user]);

  // ── AUTO-CLEAR TOAST ──
  useEffect(()=>{if(toast){const t=setTimeout(()=>setToast(null),2800);return()=>clearTimeout(t);}},[toast]);

  // ── PRAYER REMINDER CHECK (every 60s) ──
  useEffect(()=>{
    if(typeof Notification==='undefined') return;
    const check=()=>{
      const now=new Date();
      const hhmm=String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
      const todayISO=now.toISOString().slice(0,10);
      const dayOfWeek=now.getDay(); // 0=Sun
      setPrayerPosts(prev=>{
        let changed=false;
        const next=prev.map(p=>{
          if(!p.reminder?.enabled) return p;
          if(p.reminder.time!==hhmm) return p;
          if(p.reminder.lastNotified===todayISO) return p;
          // Check frequency
          if(p.reminder.frequency==='weekly'&&!p.reminder.days?.includes(dayOfWeek)) return p;
          // Fire notification
          if(Notification.permission==='granted'){
            try{new Notification('Prayer Reminder',{body:p.text.slice(0,120),icon:'/favicon.ico',tag:'prayer-'+p.id});}catch(e){}
          }
          setToast({msg:'Reminder: '+p.text.slice(0,60)+(p.text.length>60?'...':''),emoji:''});
          changed=true;
          const updatedReminder={...p.reminder,lastNotified:todayISO};
          if(p.reminder.frequency==='once') updatedReminder.enabled=false;
          return {...p,reminder:updatedReminder};
        });
        if(changed) dbSave("irj-prayer",next);
        return changed?next:prev;
      });
    };
    const timer=setInterval(check,60000);
    check(); // run once on mount
    return()=>clearInterval(timer);
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
      const localAnimals=await dbLoad("irj-animals")||[];
      const localMissions=await dbLoad("irj-missions")||null;
      const localPremium=await dbLoad("irj-premium")||false;
      const localDiamondArt=await dbLoad("irj-diamond-art")||{};
      const localArtGallery=await dbLoad("irj-art-gallery")||[];
      const localImportedTemplates=await dbLoad("irj-imported-templates")||{};

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
      // Animals: merge by id, local wins
      const cloudAnimals=cloud.animals||[];
      const mergedAnimals=localAnimals.length?localAnimals.map(la=>{
        const ca=cloudAnimals.find(c=>c.id===la.id);
        return ca&&!la.produceReadyAt&&ca.produceReadyAt?ca:la;
      }):cloudAnimals;
      // Add any cloud-only animals not in local
      cloudAnimals.forEach(ca=>{if(!mergedAnimals.find(a=>a.id===ca.id))mergedAnimals.push(ca);});

      // Missions: take whichever period is more recent
      const cloudMissions=cloud.missions||null;
      let mergedMissions=localMissions||cloudMissions||null;
      if(localMissions&&cloudMissions){
        mergedMissions={
          daily:(localMissions.daily?.date||"")>=(cloudMissions.daily?.date||"")?localMissions.daily:cloudMissions.daily,
          weekly:(localMissions.weekly?.weekStart||"")>=(cloudMissions.weekly?.weekStart||"")?localMissions.weekly:cloudMissions.weekly,
        };
      }

      // Diamond Art in-progress: keyed by templateId/freeKey. Keep whichever
      // copy of each piece was saved most recently (falls back to fill count).
      const cloudDiamondArt=cloud.diamondArt||{};
      const mergedDiamondArt={...cloudDiamondArt};
      Object.keys(localDiamondArt).forEach(key=>{
        const lp=localDiamondArt[key], cp=mergedDiamondArt[key];
        if(!cp){mergedDiamondArt[key]=lp;return;}
        const lt=lp?.lastSavedAt||0, ct=cp?.lastSavedAt||0;
        if(lt!==ct){mergedDiamondArt[key]=lt>ct?lp:cp;return;}
        const fill=p=>Array.isArray(p?.cells)?p.cells.reduce((n,c)=>n+(c?1:0),0):0;
        mergedDiamondArt[key]=fill(lp)>=fill(cp)?lp:cp;
      });
      // Completed gallery pieces: union by id.
      const mergedArtGallery=mergeById(localArtGallery,cloud.artGallery||[]);
      // Imported templates: union of both, local wins on id conflict.
      const mergedImportedTemplates={...(cloud.importedTemplates||{}),...localImportedTemplates};

      localStorage.setItem("irj-diamond-art",JSON.stringify(mergedDiamondArt));
      localStorage.setItem("irj-art-gallery",JSON.stringify(mergedArtGallery));
      localStorage.setItem("irj-imported-templates",JSON.stringify(mergedImportedTemplates));

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
      localStorage.setItem("irj-animals",JSON.stringify(mergedAnimals));
      if(mergedMissions) localStorage.setItem("irj-missions",JSON.stringify(mergedMissions));
      const mergedPremium=cloud.isPremium||localPremium||false;
      localStorage.setItem("irj-premium",JSON.stringify(mergedPremium));

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
        animals:mergedAnimals,
        missions:mergedMissions,
        isPremium:mergedPremium,
        diamondArt:mergedDiamondArt,
        artGallery:mergedArtGallery,
        importedTemplates:mergedImportedTemplates,
        lastSyncedAt:new Date().toISOString(),
      },{merge:true});

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
      setAnimals(mergedAnimals);
      setMissions(mergedMissions);
      setIsPremium(!!mergedPremium);
      setDiamondArtRaw(mergedDiamondArt);
      setArtGalleryRaw(mergedArtGallery);
      setImportedTemplatesRaw(mergedImportedTemplates);

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
    if(!auth){console.error("Auth not initialized");return false;}
    try{ await signInWithPopup(auth,googleProvider); return true; }
    catch(err){
      console.error("Google Sign-In error:",err.code,err.message);
      if(err.code==="auth/popup-blocked"||err.code==="auth/popup-closed-by-user"){
        try{ await signInWithRedirect(auth,googleProvider); }
        catch(e2){ console.error("Redirect fallback error:",e2.code,e2.message); }
      }
      return false;
    }
  }

  // Friendly message for the most common Firebase auth error codes
  function authErrorMessage(code){
    switch(code){
      case "auth/invalid-email": return "That email doesn't look right.";
      case "auth/email-already-in-use": return "An account already exists for that email. Try logging in.";
      case "auth/weak-password": return "Password should be at least 6 characters.";
      case "auth/user-not-found":
      case "auth/wrong-password":
      case "auth/invalid-credential": return "Email or password is incorrect.";
      case "auth/too-many-requests": return "Too many attempts. Please wait a moment and try again.";
      case "auth/operation-not-allowed":
      case "auth/configuration-not-found": return "Email sign-up isn't switched on yet. Please try Google for now.";
      case "auth/network-request-failed": return "Network error. Check your connection and try again.";
      default: return "Something went wrong. Please try again.";
    }
  }

  async function handleEmailSignUp(email,password,name){
    if(!auth){setAuthError("Sign-in is unavailable right now.");return false;}
    setAuthBusy(true);setAuthError("");
    try{
      const cred=await createUserWithEmailAndPassword(auth,email.trim(),password);
      if(name&&name.trim()){ try{ await updateProfile(cred.user,{displayName:name.trim()}); }catch(e){} }
      setAuthBusy(false);
      return true;
    }catch(err){
      console.error("Email sign-up error:",err.code,err.message);
      setAuthError(authErrorMessage(err.code));setAuthBusy(false);
      return false;
    }
  }

  async function handleEmailSignIn(email,password){
    if(!auth){setAuthError("Sign-in is unavailable right now.");return false;}
    setAuthBusy(true);setAuthError("");
    try{
      await signInWithEmailAndPassword(auth,email.trim(),password);
      setAuthBusy(false);
      return true;
    }catch(err){
      console.error("Email sign-in error:",err.code,err.message);
      setAuthError(authErrorMessage(err.code));setAuthBusy(false);
      return false;
    }
  }

  async function handlePasswordReset(email){
    if(!auth||!email||!email.trim()){setAuthError("Enter your email first, then tap reset.");return;}
    try{
      await sendPasswordResetEmail(auth,email.trim());
      setAuthError("");setToast({msg:"Password reset email sent."});
    }catch(err){
      console.error("Password reset error:",err.code,err.message);
      setAuthError(authErrorMessage(err.code));
    }
  }

  // Mailing-list subscriber record (name + email + explicit marketing consent).
  // Stored for every signed-in user; `marketingConsent` gates who may be emailed.
  async function saveSubscriber(uid){
    if(!db||!uid||!auth?.currentUser) return;
    try{
      const u=auth.currentUser;
      const email=u.email||"";
      const ref=doc(db,"subscribers",uid);
      const existing=await getDoc(ref);
      const base={
        uid,
        name:(u.displayName||setupUsername||"").trim(),
        email,
        emailLower:email.toLowerCase(),
        provider:(u.providerData?.[0]?.providerId)||"unknown",
        marketingConsent:!!marketingConsent,
        consentedAt:serverTimestamp(),
        source:signupSourceRef.current||"app",
        updatedAt:serverTimestamp(),
      };
      if(existing.exists()){
        await setDoc(ref,base,{merge:true});
      }else{
        await setDoc(ref,{...base,unsubscribedAt:null,createdAt:serverTimestamp()});
      }
    }catch(e){console.warn("saveSubscriber error:",e);}
  }

  // Build + download the mailing list as CSV (owner only)
  async function exportSubscribersCsv(){
    if(!db){setToast({msg:"Database unavailable."});return;}
    try{
      const snap=await getDocs(collection(db,"subscribers"));
      const esc=(v)=>{const s=(v==null?"":String(v)).replace(/"/g,'""');return `"${s}"`;};
      const rows=[["name","email","marketingConsent","source","provider","consentedAt"]];
      snap.forEach(d=>{
        const x=d.data();
        const ts=x.consentedAt?.toDate?x.consentedAt.toDate().toISOString():"";
        rows.push([x.name||"",x.email||"",x.marketingConsent?"yes":"no",x.source||"",x.provider||"",ts]);
      });
      const csv=rows.map(r=>r.map(esc).join(",")).join("\r\n");
      const blob=new Blob([csv],{type:"text/csv;charset=utf-8;"});
      const url=URL.createObjectURL(blob);
      const a=document.createElement("a");
      a.href=url;a.download=`inner-room-subscribers-${isoDate(new Date())}.csv`;
      document.body.appendChild(a);a.click();document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setToast({msg:`Exported ${snap.size} subscriber${snap.size===1?"":"s"}.`});
    }catch(e){console.warn("exportSubscribersCsv error:",e);setToast({msg:"Export failed."});}
  }

  async function handleSignOut(){
    if(!auth) return;
    await signOut(auth);
    setUser(null);
    setSyncStatus(null);
    // Return to the original first screen — they must sign in again to get back in.
    fadeOutAmbient();
    setOnboardStep(0);
    setScreen("welcome");
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
    if(!jTexts[0].trim()||!activeRoom) return;
    const dayData=activeRoom.days?.[activeDay];
    const e={id:Date.now().toString(),date:todayStr(),time:nowTime(),roomId:activeRoom.id,roomLabel:activeRoom.label||"",roomEmoji:activeRoom.emoji||"",day:activeDay,prompt:dayData?.q||"",text:jTexts.filter(Boolean).join("\n\n---\n\n"),words:jTexts.filter(Boolean).reduce((s,t)=>s+wc(t),0)};
    persistEntries([e,...entries]);
    addCandles(3,"Reflection saved +3 🕯️");
    trackMission("daily_journal"); trackMission("weekly_journal_5");
    setSaveMsg("✓ Saved to your history"); setTimeout(()=>{setSaveMsg("");setScreen(prevScreen);},2200);
  }
  function saveBookEntry(){
    if(!bookText.trim()||!BOOK_CONTENT[deskBook]) return;
    const pg=BOOK_CONTENT[deskBook].pages[bookPage-1];
    if(!pg) return;
    const book=SHELF_BOOKS.find(b=>b.id===deskBook);
    const e={id:Date.now().toString(),date:todayStr(),time:nowTime(),roomId:deskBook,roomLabel:book?.label||deskBook,roomEmoji:book?.emoji||"📖",day:bookPage-1,prompt:pg.prompt||"",text:bookText.trim(),words:wc(bookText)};
    persistEntries([e,...entries]);
    addCandles(3,"Reflection saved +3 🕯️");
    trackMission("daily_journal"); trackMission("weekly_journal_5");
    setBookSaveMsg("✓ Saved to history 📖"); setTimeout(()=>setBookSaveMsg(""),2500);
  }

  // ── PRAYER JOURNAL → GARDEN LINK ──
  function savePrayerJournalEntry(){
    if(!bookText.trim()) return;
    // Save as prayer post
    const p={id:Date.now().toString(),date:todayStr(),time:nowTime(),text:bookText.trim(),tag:"Journal Prayer",prayers:0,status:"active",answeredDate:null,category:"Journal Prayer"};
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
    trackMission("daily_journal"); trackMission("weekly_journal_5");
    setBookText("");
    setBookSaveMsg("Prayer saved & garden watered!");
    setTimeout(()=>setBookSaveMsg(""),2500);
  }

  // ── PRAYER ──
  function postPrayer(){
    if(!newPrayer.trim()) return;
    const p={id:Date.now().toString(),date:todayStr(),time:nowTime(),text:newPrayer.trim(),tag:prayerTag||"General",prayers:0,status:"active",answeredDate:null,category:prayerTag||"General"};
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
      const next=prev.map(p=>p.prayerId===id&&p.stage!=="empty"?{...p,prayerCount:(p.prayerCount||0)+1}:p);
      dbSave("irj-garden",next);
      return next;
    });
    addCandles(2,"You lit a candle for this prayer");
    trackMission("daily_pray_3"); trackMission("weekly_pray_10");
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
  function requestNotifPermission(){
    if(typeof Notification==='undefined') return;
    Notification.requestPermission().then(perm=>{setNotifPermission(perm);});
  }
  function toggleReminder(prayerId, reminderData, keepOpen){
    const next=prayerPosts.map(p=>p.id===prayerId?{...p,reminder:reminderData}:p);
    setPrayerPosts(next); dbSave("irj-prayer",next);
    if(!keepOpen) setReminderPanel(null);
  }
  function removeReminder(prayerId){
    const next=prayerPosts.map(p=>{
      if(p.id!==prayerId) return p;
      const {reminder,...rest}=p;
      return rest;
    });
    setPrayerPosts(next); dbSave("irj-prayer",next);
    setReminderPanel(null);
  }

  // ── GARDEN GRID (auto-save on change) ──
  function setGardenGrid(nextGrid){
    setGardenGridRaw(nextGrid);
    dbSave("irj-garden-grid",serializeGrid(nextGrid));
  }

  // ── UNLOCKS (auto-save on change) ──
  function setUnlocks(key,value){
    setUnlocksRaw(prev=>{
      if(prev[key]===value) return prev; // no-op if already set
      const next={...prev,[key]:value};
      dbSave("irj-unlocks",next);
      return next;
    });
  }

  // ── DIAMOND ART (auto-save on change) ──
  function setDiamondArt(next){
    setDiamondArtRaw(next);
    dbSave("irj-diamond-art",next);
  }
  function setArtGallery(next){
    setArtGalleryRaw(next);
    dbSave("irj-art-gallery",next);
  }
  function setImportedTemplates(next){
    setImportedTemplatesRaw(next);
    dbSave("irj-imported-templates",next);
  }
  function setWordSearch(next){
    setWordSearchRaw(next);
    dbSave("irj-word-search",next);
  }
  function setHiddenObject(next){
    setHiddenObjectRaw(next);
    dbSave("irj-hidden-object",next);
  }
  function setPregnancyMeditations(next){
    setPregnancyMeditationsRaw(next);
    dbSave("irj-pregnancy-meditations",next);
  }
  function setFatherMeditations(next){
    setFatherMeditationsRaw(next);
    dbSave("irj-father-meditations",next);
  }
  function setConceiveMeditations(next){
    setConceiveMeditationsRaw(next);
    dbSave("irj-conceive-meditations",next);
  }
  function setFertility(next){
    setFertilityRaw(next);
    dbSave("irj-fertility",next);
  }
  function setColoring(next){
    setColoringRaw(next);
    dbSave("irj-coloring",next);
  }
  function setLeakyBucket(next){
    setLeakyBucketRaw(next);
    dbSave("irj-leaky-bucket",next);
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
  async function persistFarmPlots(fp){ setFarmPlots(fp); await dbSave("irj-farm-plots",fp); publishFarmSnapshot(fp); }
  async function persistAnimals(a){ setAnimals(a); await dbSave("irj-animals",a); }

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

  // ── MISSIONS ──
  function buildFreshMissions(){
    const dp={}; DAILY_MISSIONS.forEach(m=>{dp[m.id]={count:0,claimed:false};}); PREMIUM_DAILY_MISSIONS.forEach(m=>{dp[m.id]={count:0,claimed:false};});
    const wp={}; WEEKLY_MISSIONS.forEach(m=>{wp[m.id]={count:0,claimed:false};}); PREMIUM_WEEKLY_MISSIONS.forEach(m=>{wp[m.id]={count:0,claimed:false};});
    return {daily:{date:todayStr(),progress:dp},weekly:{weekStart:getWeekStart(),progress:wp}};
  }
  function getOrResetMissions(current){
    const fresh=buildFreshMissions();
    let result=current?{...current}:fresh;
    if(!result.daily||result.daily.date!==todayStr()) result={...result,daily:fresh.daily};
    if(!result.weekly||result.weekly.weekStart!==getWeekStart()) result={...result,weekly:fresh.weekly};
    return result;
  }
  function trackMission(missionId){
    setMissions(prev=>{
      const current=getOrResetMissions(prev);
      let changed=false;
      if(current.daily.progress[missionId]!==undefined){
        const slot=current.daily.progress[missionId];
        const def=DAILY_MISSIONS.find(m=>m.id===missionId);
        if(def&&!slot.claimed&&slot.count<def.target){
          current.daily.progress={...current.daily.progress,[missionId]:{...slot,count:slot.count+1}};
          changed=true;
        }
      }
      if(current.weekly.progress[missionId]!==undefined){
        const slot=current.weekly.progress[missionId];
        const def=WEEKLY_MISSIONS.find(m=>m.id===missionId);
        if(def&&!slot.claimed&&slot.count<def.target){
          current.weekly.progress={...current.weekly.progress,[missionId]:{...slot,count:slot.count+1}};
          changed=true;
        }
      }
      if(!changed) return prev;
      dbSave("irj-missions",current);
      return current;
    });
  }
  function claimMissionReward(missionId,period){
    const defs=period==="daily"?DAILY_MISSIONS:WEEKLY_MISSIONS;
    const def=defs.find(m=>m.id===missionId);
    if(!def) return;
    setMissions(prev=>{
      const current=getOrResetMissions(prev);
      const slot=current[period].progress[missionId];
      if(!slot||slot.claimed||slot.count<def.target) return prev;
      current[period].progress={...current[period].progress,[missionId]:{...slot,claimed:true}};
      dbSave("irj-missions",current);
      return current;
    });
    if(def.reward.candles) addCandles(def.reward.candles,`${def.label} complete`);
    if(def.reward.coins) addCoins(def.reward.coins,`${def.label} complete`);
  }

  // ── MULTIPLAYER — User Profiles ──
  async function checkUsernameAvailable(username, excludeUid){
    if(!db) return true;
    if(!username||username.length<3||username.length>20) return false;
    if(!/^[a-zA-Z0-9_]+$/.test(username)) return false;
    try{
      // Try indexed query first
      const q=query(collection(db,"userProfiles"),where("usernameLower","==",username.toLowerCase()),limit(1));
      const snap=await getDocs(q);
      if(snap.empty) return true;
      return snap.docs.length===1&&snap.docs[0].id===excludeUid;
    }catch(e){
      // Fallback: fetch all profiles and check client-side (handles missing index)
      try{
        const fallback=query(collection(db,"userProfiles"),limit(50));
        const snap2=await getDocs(fallback);
        const taken=snap2.docs.some(d=>d.id!==excludeUid&&(d.data().usernameLower||d.data().username||"").toLowerCase()===username.toLowerCase());
        return !taken;
      }catch(e2){
        console.warn("checkUsername fallback error:",e2);
        return true; // If all queries fail, allow the username
      }
    }
  }

  async function validateUsername(username, excludeUid){
    setUsernameError("");setUsernameAvailable(false);
    if(!username){setUsernameError("");return;}
    if(username.length<3){setUsernameError("At least 3 characters");return;}
    if(username.length>20){setUsernameError("Max 20 characters");return;}
    if(!/^[a-zA-Z0-9_]+$/.test(username)){setUsernameError("Letters, numbers, and underscores only");return;}
    setUsernameChecking(true);
    const available=await checkUsernameAvailable(username, excludeUid);
    setUsernameChecking(false);
    if(!available){setUsernameError("Username already taken");return;}
    setUsernameAvailable(true);
  }

  async function completeProfileSetup(uid){
    if(!db||!setupUsername||!setupGender) return;
    const available=await checkUsernameAvailable(setupUsername, uid);
    if(!available){setUsernameError("Username already taken");return;}
    try{
      const profileRef=doc(db,"userProfiles",uid);
      const snap=await getDoc(profileRef);
      const data={
        username:setupUsername,
        usernameLower:setupUsername.toLowerCase(),
        gender:setupGender,
        bio:setupBio,
        level:1,lastLogin:serverTimestamp(),farmPublic:true,avatarUrl:null,
        followersCount:0,followingCount:0,postsCount:0,
        joinedAt:serverTimestamp(),lastPostAt:null,anonymous:false,
        marketingConsent:!!marketingConsent,consentedAt:serverTimestamp(),
      };
      if(snap.exists()){
        // Existing user migration — merge new fields
        await setDoc(profileRef,{username:setupUsername,usernameLower:setupUsername.toLowerCase(),gender:setupGender,bio:setupBio||snap.data().bio||"",anonymous:false,lastLogin:serverTimestamp(),marketingConsent:!!marketingConsent,consentedAt:serverTimestamp()},{merge:true});
      } else {
        await setDoc(profileRef,data);
      }
      // Mailing-list record (name + email + explicit consent)
      await saveSubscriber(uid);
      const updated=await getDoc(profileRef);
      setUserProfile({id:uid,...updated.data()});
      const app={base:setupGender,outfit:"default"};
      setPlayerAppearance(app);dbSave("irj-appearance",app);
      setShowProfileSetup(false);
      setToast({msg:"Profile created"});
    }catch(e){console.warn("completeProfileSetup error:",e);setToast({msg:"Error saving profile"});}
  }

  async function saveProfileEdits(uid, newUsername, newGender, newBio, newAnonymous){
    if(!db) return;
    // Check username change
    if(newUsername!==userProfile?.username){
      const available=await checkUsernameAvailable(newUsername, uid);
      if(!available){setUsernameError("Username already taken");return false;}
    }
    try{
      const profileRef=doc(db,"userProfiles",uid);
      await setDoc(profileRef,{
        username:newUsername,usernameLower:newUsername.toLowerCase(),
        gender:newGender,bio:newBio,anonymous:!!newAnonymous,
      },{merge:true});
      const updated=await getDoc(profileRef);
      setUserProfile({id:uid,...updated.data()});
      const app={base:newGender,outfit:playerAppearance?.outfit||"default"};
      setPlayerAppearance(app);dbSave("irj-appearance",app);
      setToast({msg:"Profile updated"});
      return true;
    }catch(e){console.warn("saveProfileEdits error:",e);return false;}
  }

  async function ensureUserProfile(uid, displayName){
    if(!db) return;
    try{
      const profileRef=doc(db,"userProfiles",uid);
      const snap=await getDoc(profileRef);
      // Send the user to the right onboarding step ONLY from a pre-app screen
      // (initial sign-in). Never yank someone already inside the app.
      const resumeOnboarding=(step)=>setScreen(s=>{
        if(s==="loading"||s==="welcome"||s==="onboard"||s==="profile-onboard"){
          setOnboardStep(step);
          return "profile-onboard";
        }
        return s;
      });
      if(!snap.exists()){
        // Brand-new user — collect a username next.
        setSetupUsername(prev=>prev||displayName||"");
        resumeOnboarding(1);
        return;
      }
      const data=snap.data();
      if(!data.gender||!data.usernameLower){
        // Incomplete profile — pre-fill what we have and resume at the first
        // missing step (username, then Son/Daughter of God).
        setSetupUsername(prev=>prev||data.username||displayName||"");
        setSetupGender(prev=>prev||data.gender||null);
        setSetupBio(prev=>prev||data.bio||"");
        setUserProfile({id:uid,...data});
        resumeOnboarding(!data.usernameLower?1:2);
        return;
      }
      // Returning user with complete profile
      await setDoc(profileRef,{lastLogin:serverTimestamp()},{merge:true});
      setUserProfile({id:uid,...data});
      setSetupUsername(data.username||"");
      setSetupGender(data.gender||null);
      const app=data.appearance||{base:data.gender||"male",outfit:"default"};
      setPlayerAppearance(app);dbSave("irj-appearance",app);
      if(data.room){
        const mr=migrateRoom(data.room,(id,qty)=>addToInventory(id,qty));
        setPlayerRoom(mr);dbSave("irj-room",mr);
      }
      setIsOnboarded(true);dbSave("irj-onboarded",true);
      // Only land on the cabin from a pre-app screen (initial sign-in). Auth
      // re-fires (token refresh, refocus) must NOT yank the user out of
      // whatever screen they're already on (e.g. the porch).
      setScreen(s=>(s==="loading"||s==="welcome"||s==="onboard"||s==="profile-onboard")?"cabin":s);
    }catch(e){console.warn("ensureUserProfile error:",e);}
  }

  async function publishFarmSnapshot(fp){
    if(!db||!user) return;
    try{
      const profileRef=doc(db,"userProfiles",user.uid);
      await setDoc(profileRef,{publishedFarm:fp||farmPlots,publishedGarden:gardenPlots},{merge:true});
    }catch(e){console.warn("publishFarmSnapshot error:",e);}
  }

  // ── MULTIPLAYER — Community Market ──
  async function loadCommunityListings(){
    if(!db) return;
    setCommunityLoading(true);
    try{
      const q=query(collection(db,"marketListings"),where("status","==","active"),orderBy("createdAt","desc"),limit(50));
      const snap=await getDocs(q);
      setCommunityListings(snap.docs.map(d=>({id:d.id,...d.data()})));
    }catch(e){console.warn("loadCommunityListings error:",e);}
    setCommunityLoading(false);
  }

  async function createListing(itemType,quantity,pricePerUnit){
    if(!functions||!user) return;
    setCommunityLoading(true);
    try{
      const fn=httpsCallable(functions,"createMarketListing");
      const result=await fn({itemType,quantity,pricePerUnit});
      if(result.data.success){
        // Update local inventory to reflect server deduction
        setInventory(prev=>{
          const next={...prev,[itemType]:(prev[itemType]||0)-quantity};
          if(next[itemType]<=0) delete next[itemType];
          dbSave("irj-inventory",next);
          return next;
        });
        setToast({msg:"Listed on the market!",emoji:ITEM_CATALOG[itemType]?.emoji||"📦"});
        setListingForm(null);
        await loadCommunityListings();
      }
    }catch(e){
      setToast({msg:e.message||"Failed to list item",emoji:"❌"});
    }
    setCommunityLoading(false);
  }

  async function purchaseListing(listing){
    if(!functions||!user) return;
    setCommunityLoading(true);
    try{
      const fn=httpsCallable(functions,"purchaseMarketListing");
      const result=await fn({listingId:listing.id});
      if(result.data.success){
        // Update local state to reflect server changes
        setInventory(prev=>{
          const next={...prev,[result.data.itemType]:(prev[result.data.itemType]||0)+result.data.quantity};
          dbSave("irj-inventory",next);
          return next;
        });
        setBank(prev=>{
          const next={...prev,coins:result.data.newCoins};
          dbSave("irj-bank",next);
          return next;
        });
        setToast({msg:`Bought ${result.data.quantity}x ${ITEM_CATALOG[result.data.itemType]?.name||result.data.itemType}!`,emoji:ITEM_CATALOG[result.data.itemType]?.emoji||"📦"});
        await loadCommunityListings();
      }
    }catch(e){
      setToast({msg:e.message||"Purchase failed",emoji:"❌"});
    }
    setCommunityLoading(false);
  }

  async function cancelListing(listingId){
    if(!functions||!user) return;
    setCommunityLoading(true);
    try{
      const fn=httpsCallable(functions,"cancelMarketListing");
      const result=await fn({listingId});
      if(result.data.success){
        setInventory(prev=>{
          const next={...prev,[result.data.itemType]:(prev[result.data.itemType]||0)+result.data.quantity};
          dbSave("irj-inventory",next);
          return next;
        });
        setToast({msg:"Listing cancelled, items returned",emoji:"↩️"});
        await loadCommunityListings();
      }
    }catch(e){
      setToast({msg:e.message||"Cancel failed",emoji:"❌"});
    }
    setCommunityLoading(false);
  }

  // ── MULTIPLAYER — Community Prayers ──
  async function loadCommunityPrayers(){
    if(!db) return;
    setCommunityLoading(true);
    try{
      const q=query(collection(db,"posts"),where("type","==","prayer"),orderBy("createdAt","desc"),limit(40));
      const snap=await getDocs(q);
      const prayers=snap.docs.map(d=>({id:d.id,...d.data()}));
      setCommunityPrayers(prayers);
      // Batch-check which prayers user has prayed for (liked)
      if(user&&prayers.length>0){
        const checks=await Promise.all(prayers.map(p=>getDoc(doc(db,"posts",p.id,"likes",user.uid))));
        const likedIds=new Set();
        checks.forEach((s,i)=>{if(s.exists()) likedIds.add(prayers[i].id);});
        setPrayedPostIds(likedIds);
      }
    }catch(e){console.warn("loadCommunityPrayers error:",e);}
    setCommunityLoading(false);
  }

  async function postCommunityPrayer(){
    if(!db||!user||!newPrayer.trim()) return;
    try{
      await addDoc(collection(db,"posts"),{
        authorId:user.uid,
        authorName:userProfile?.username||"Anonymous",
        authorAvatarUrl:userProfile?.avatarUrl||null,
        type:"prayer",
        content:newPrayer.trim(),
        tag:prayerTag||"General",
        imageUrl:null,
        likesCount:0,
        commentsCount:0,
        createdAt:serverTimestamp(),
        updatedAt:serverTimestamp(),
        visibility:"public",
        tags:prayerTag?[prayerTag.toLowerCase()]:[],
      });
      // Also save locally so it appears in My Prayers tab
      const localP={id:Date.now().toString(),date:todayStr(),time:nowTime(),text:newPrayer.trim(),tag:prayerTag||"General",prayers:0,status:"active",answeredDate:null,category:prayerTag||"General"};
      const nextPrayers=[localP,...prayerPosts]; setPrayerPosts(nextPrayers); dbSave("irj-prayer",nextPrayers);
      setNewPrayer(""); setPrayerTag("");
      setToast({msg:"Prayer shared with community",emoji:"🕯️"});
      trackMission("weekly_share_prayer");
      await loadCommunityPrayers();
    }catch(e){
      setToast({msg:e.message||"Failed to post prayer",emoji:"❌"});
    }
  }

  async function togglePrayForPost(postId){
    if(!functions||!user) return;
    const alreadyPrayed=prayedPostIds.has(postId);
    try{
      const fnName=alreadyPrayed?"unlikePost":"likePost";
      const fn=httpsCallable(functions,fnName);
      const result=await fn({postId});
      // Optimistic local update
      setPrayedPostIds(prev=>{const next=new Set(prev);alreadyPrayed?next.delete(postId):next.add(postId);return next;});
      setCommunityPrayers(prev=>prev.map(p=>p.id===postId?{...p,likesCount:result.data.newLikesCount}:p));
      if(!alreadyPrayed){ addCandles(2,"You lifted this prayer"); trackMission("daily_pray_3"); trackMission("weekly_pray_10"); }
    }catch(e){
      if(e.code==="functions/already-exists"){
        setToast({msg:"Already praying for this",emoji:"🙏"});
      } else {
        setToast({msg:e.message||"Failed",emoji:"❌"});
      }
    }
  }

  async function loadComments(postId){
    if(!db) return;
    try{
      const q=query(collection(db,"posts",postId,"comments"),orderBy("createdAt","asc"),limit(50));
      const snap=await getDocs(q);
      setPostComments(prev=>({...prev,[postId]:snap.docs.map(d=>({id:d.id,...d.data()}))}));
    }catch(e){console.warn("loadComments error:",e);}
  }

  async function submitComment(postId){
    if(!functions||!user||!commentText.trim()) return;
    setCommentLoading(true);
    try{
      const fn=httpsCallable(functions,"addComment");
      await fn({postId,content:commentText.trim()});
      setCommentText("");
      await loadComments(postId);
      trackMission("daily_comment");
      setCommunityPrayers(prev=>prev.map(p=>p.id===postId?{...p,commentsCount:(p.commentsCount||0)+1}:p));
    }catch(e){
      setToast({msg:e.message||"Could not post comment",emoji:"❌"});
    }
    setCommentLoading(false);
  }

  // ── MULTIPLAYER — Community Events ──
  async function loadCommunityEvents(){
    if(!db) return;
    try{
      const q=query(collection(db,"communityEvents"),where("status","==","active"),limit(10));
      const snap=await getDocs(q);
      setCommunityEvents(snap.docs.map(d=>({id:d.id,...d.data()})));
    }catch(e){console.warn("loadCommunityEvents error:",e);}
  }

  async function contributeToEvent(eventId,itemType,quantity){
    if(!functions||!user) return;
    try{
      const fn=httpsCallable(functions,"contributeToEvent");
      const result=await fn({eventId,itemType,quantity});
      if(result.data.success){
        setInventory(prev=>{
          const next={...prev,[itemType]:(prev[itemType]||0)-quantity};
          if(next[itemType]<=0) delete next[itemType];
          dbSave("irj-inventory",next);
          return next;
        });
        setToast({msg:result.data.completed?"Event goal reached!":"Contribution added!",emoji:"🎉"});
        await loadCommunityEvents();
      }
    }catch(e){
      setToast({msg:e.message||"Contribution failed",emoji:"❌"});
    }
  }

  // ── MULTIPLAYER — Farm Visiting ──
  async function searchFarmers(searchTerm){
    if(!db) return;
    setCommunityLoading(true);
    try{
      const q=query(collection(db,"userProfiles"),where("farmPublic","==",true),limit(20));
      const snap=await getDocs(q);
      const results=snap.docs
        .map(d=>({id:d.id,...d.data()}))
        .filter(p=>p.id!==user?.uid)
        .filter(p=>!searchTerm||p.username.toLowerCase().includes(searchTerm.toLowerCase()));
      setFarmerResults(results);
    }catch(e){console.warn("searchFarmers error:",e);}
    setCommunityLoading(false);
  }

  // ── GATHERINGS ──
  async function loadGatheringPosts(spaceId){
    if(!db) return;
    setGatheringLoading(true);
    try{
      // Simple query without orderBy to avoid needing composite index
      const q=query(collection(db,"upperRoomPosts"),where("spaceId","==",spaceId),limit(100));
      const snap=await getDocs(q);
      // Filter active and sort client-side
      const posts=snap.docs.map(d=>({id:d.id,...d.data()})).filter(p=>p.status==="active").sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
      setGatheringPosts(posts);
    }catch(e){console.warn("loadGatheringPosts:",e);setGatheringPosts([]);}
    setGatheringLoading(false);
  }

  async function createGatheringPost(postData){
    if(!db||!user) return;
    const anonName=generateAnonName(user.uid);
    const spaceName=(GATHERING_SPACES.find(s=>s.id===postData.spaceId)||{}).name||"";
    const tokens=makeSearchTokens(postData.title,postData.body,postData.tags,postData.postType,spaceName);
    try{
      const docRef=await addDoc(collection(db,"upperRoomPosts"),{
        ...postData,
        authorId:user.uid,
        anonymousName:anonName,
        createdAt:serverTimestamp(),
        updatedAt:serverTimestamp(),
        replyCount:0,
        reactionCounts:{relate:0,praying:0,helpful:0,encouraged:0,metoo:0},
        status:"active",
        searchTokens:tokens,
      });
      setToast({msg:"Your post is live"});
      // Navigate to the published post
      setActiveGatheringSpace(postData.spaceId);
      loadPostAndReplies(docRef.id);
      setGatheringReplyText("");
      setScreen("gathering-post");
    }catch(e){console.warn("createGatheringPost:",e);setToast({msg:"Something went wrong — check your connection"});}
  }

  async function loadPostAndReplies(postId){
    if(!db) return;
    setPostRepliesLoading(true);
    try{
      const postDoc=await getDoc(doc(db,"upperRoomPosts",postId));
      if(postDoc.exists()) setActivePost({id:postDoc.id,...postDoc.data()});
      const q=query(collection(db,"upperRoomReplies"),where("postId","==",postId),orderBy("createdAt","asc"),limit(100));
      const snap=await getDocs(q);
      setPostReplies(snap.docs.map(d=>({id:d.id,...d.data()})));
      // Load user's reaction
      if(user){
        try{const rDoc=await getDoc(doc(db,"upperRoomReactions",user.uid+"_"+postId));setGatheringUserReaction(rDoc.exists()?rDoc.data().type:null);}catch(e){}
      }
    }catch(e){console.warn("loadPostAndReplies:",e);}
    setPostRepliesLoading(false);
  }

  async function submitGatheringReply(parentReplyId){
    if(!db||!user||!activePost||!gatheringReplyText.trim()) return;
    setGatheringReplySubmitting(true);
    try{
      const anonName=generateAnonName(user.uid);
      await addDoc(collection(db,"upperRoomReplies"),{
        postId:activePost.id, spaceId:activePost.spaceId,
        authorId:user.uid, anonymousName:anonName,
        body:gatheringReplyText.trim(), parentReplyId:parentReplyId||null,
        createdAt:serverTimestamp(), status:"active",
      });
      // Increment reply count on the post
      const postRef=doc(db,"upperRoomPosts",activePost.id);
      await setDoc(postRef,{replyCount:(activePost.replyCount||0)+1,updatedAt:serverTimestamp()},{merge:true});
      // Notify the post author (if it's not the replier)
      if(activePost.authorId&&activePost.authorId!==user.uid){
        try{await addDoc(collection(db,"notifications"),{
          recipientId:activePost.authorId,
          actorId:user.uid,
          actorName:anonName,
          type:"gathering_reply",
          postId:activePost.id,
          postTitle:activePost.title||"",
          spaceId:activePost.spaceId||"",
          preview:gatheringReplyText.trim().slice(0,80),
          read:false,
          createdAt:serverTimestamp(),
        });}catch(e){}
      }
      setGatheringReplyText("");
      loadPostAndReplies(activePost.id);
    }catch(e){console.warn("submitGatheringReply:",e);}
    setGatheringReplySubmitting(false);
  }

  async function reactToGatheringPost(reactionType){
    if(!db||!user||!activePost) return;
    const reactionId=user.uid+"_"+activePost.id;
    try{
      const existing=gatheringUserReaction;
      const postRef=doc(db,"upperRoomPosts",activePost.id);
      if(existing===reactionType){
        // Remove reaction
        await deleteDoc(doc(db,"upperRoomReactions",reactionId));
        await setDoc(postRef,{reactionCounts:{...activePost.reactionCounts,[reactionType]:Math.max(0,(activePost.reactionCounts?.[reactionType]||1)-1)}},{merge:true});
        setGatheringUserReaction(null);
      } else {
        // Add/change reaction
        if(existing) await setDoc(postRef,{reactionCounts:{...activePost.reactionCounts,[existing]:Math.max(0,(activePost.reactionCounts?.[existing]||1)-1)}},{merge:true});
        await setDoc(doc(db,"upperRoomReactions",reactionId),{type:reactionType,targetType:"post",targetId:activePost.id,userId:user.uid,createdAt:serverTimestamp()});
        await setDoc(postRef,{reactionCounts:{...activePost.reactionCounts,[reactionType]:(activePost.reactionCounts?.[reactionType]||0)+1}},{merge:true});
        setGatheringUserReaction(reactionType);
      }
      // Refresh post
      const updated=await getDoc(postRef);
      if(updated.exists()) setActivePost({id:updated.id,...updated.data()});
    }catch(e){console.warn("reactToGatheringPost:",e);}
  }

  async function reportGatheringContent(targetId,targetType,reason){
    if(!db||!user) return;
    try{
      await addDoc(collection(db,"upperRoomReports"),{
        reporterId:user.uid, targetType, targetId, reason,
        createdAt:serverTimestamp(), status:"pending",
      });
      // Auto-flag: check if 3+ reports exist for this target
      try{
        const rq=query(collection(db,"upperRoomReports"),where("targetId","==",targetId),where("status","==","pending"),limit(3));
        const rSnap=await getDocs(rq);
        if(rSnap.size>=3){
          const ref=doc(db,targetType==="reply"?"upperRoomReplies":"upperRoomPosts",targetId);
          await setDoc(ref,{status:"flagged"},{merge:true});
        }
      }catch(e){}
      setToast({msg:"Report submitted. Thank you."});
    }catch(e){console.warn("reportGatheringContent:",e);}
  }

  const [gatheringRecentPosts, setGatheringRecentPosts] = useState([]);

  async function loadRecentGatheringPosts(){
    if(!db) return;
    try{
      const q=query(collection(db,"upperRoomPosts"),limit(50));
      const snap=await getDocs(q);
      const posts=snap.docs.map(d=>({id:d.id,...d.data()})).filter(p=>p.status==="active").sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0)).slice(0,5);
      setGatheringRecentPosts(posts);
    }catch(e){}
  }

  async function loadSpaceCounts(){
    if(!db) return {};
    try{
      const q=query(collection(db,"upperRoomPosts"),limit(500));
      const snap=await getDocs(q);
      const counts={};
      snap.docs.forEach(d=>{const data=d.data();if(data.status==="active")counts[data.spaceId]=(counts[data.spaceId]||0)+1;});
      return counts;
    }catch(e){return {};}
  }

  async function searchGatherings(searchQuery){
    if(!db) return;
    setGatheringSearchLoading(true);setGatheringSearchQuery(searchQuery);
    try{
      const q=query(collection(db,"upperRoomPosts"),limit(200));
      const snap=await getDocs(q);
      const words=searchQuery.toLowerCase().split(/\s+/).filter(w=>w.length>2);
      const results=snap.docs.map(d=>({id:d.id,...d.data()})).filter(p=>p.status==="active").filter(p=>{
        const tokens=p.searchTokens||[];
        const text=(p.title+" "+p.body+" "+(p.tags||[]).join(" ")).toLowerCase();
        return words.some(w=>tokens.includes(w)||text.includes(w));
      }).sort((a,b)=>{
        // Rank by match count
        const scoreA=words.filter(w=>(a.title+" "+a.body).toLowerCase().includes(w)).length;
        const scoreB=words.filter(w=>(b.title+" "+b.body).toLowerCase().includes(w)).length;
        return scoreB-scoreA;
      });
      setGatheringSearchResults(results);
    }catch(e){console.warn("searchGatherings:",e);setGatheringSearchResults([]);}
    setGatheringSearchLoading(false);
  }

  async function searchUsers(searchTerm){
    if(!db) return;
    setUserSearchLoading(true);
    try{
      const q=query(collection(db,"userProfiles"),limit(30));
      const snap=await getDocs(q);
      const results=snap.docs
        .map(d=>({id:d.id,...d.data()}))
        .filter(p=>p.id!==user?.uid)
        .filter(p=>!searchTerm||(p.usernameLower||p.username||"").includes(searchTerm.toLowerCase()));
      setUserResults(results);
    }catch(e){console.warn("searchUsers error:",e);}
    setUserSearchLoading(false);
  }

  async function visitFarm(userId){
    if(!db) return;
    setCommunityLoading(true);
    try{
      const profileDoc=await getDoc(doc(db,"userProfiles",userId));
      if(!profileDoc.exists()){setToast({msg:"Farm not found",emoji:"❌"});setCommunityLoading(false);return;}
      const profile=profileDoc.data();
      setVisitingFarm({
        userId,
        username:profile.username||"Anonymous",
        farmPlots:profile.publishedFarm||[],
        gardenPlots:profile.publishedGarden||[],
      });
      setPrevScreen(screen);
      setScreen("visit-farm");
    }catch(e){
      setToast({msg:"Could not visit farm",emoji:"❌"});
    }
    setCommunityLoading(false);
  }

  function viewProfile(userId){
    setProfileUserId(userId);
    setPrevScreen(screen);
    setScreen("profile");
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
    trackMission("daily_harvest"); trackMission("weekly_harvest_5");
    setTimeout(()=>setCandleReward(null),2500);
  }

  // ── FARM ANIMALS ──
  function getAnimalProduceStatus(animal){
    if(!animal.produceReadyAt) return "hungry";
    if(Date.now()>=animal.produceReadyAt) return "ready";
    return "producing";
  }
  function getAnimalTimeRemaining(animal){
    if(!animal.produceReadyAt) return "";
    const diff=animal.produceReadyAt-Date.now();
    if(diff<=0) return "Ready!";
    const h=Math.floor(diff/3600000);
    const m=Math.floor((diff%3600000)/60000);
    return h>0?`${h}h ${m}m`:`${m}m`;
  }
  function feedAnimal(animalId){
    const animal=animals.find(a=>a.id===animalId);
    if(!animal) return;
    if(getAnimalProduceStatus(animal)!=="hungry") return;
    const type=ANIMAL_TYPES.find(t=>t.id===animal.typeId);
    if(!type) return;
    if(!removeFromInventory("feed",type.feedCost)) {
      setToast({msg:"Need feed! Buy at the shop.",emoji:"🌾"});
      return;
    }
    const next=animals.map(a=>a.id===animalId?{...a,produceReadyAt:Date.now()+type.durationMs}:a);
    persistAnimals(next);
    setToast({msg:`Fed ${type.name}!`,emoji:type.emoji});
    trackMission("daily_feed_animal");
  }
  function collectAnimalProduce(animalId){
    const animal=animals.find(a=>a.id===animalId);
    if(!animal) return;
    if(getAnimalProduceStatus(animal)!=="ready") return;
    const type=ANIMAL_TYPES.find(t=>t.id===animal.typeId);
    if(!type) return;
    addToInventory(type.product,1);
    const next=animals.map(a=>a.id===animalId?{...a,produceReadyAt:null}:a);
    persistAnimals(next);
    const prodName=ITEM_CATALOG[type.product]?.name||type.product;
    setCandleReward({amount:1, message:`Collected ${prodName}!`});
    setTimeout(()=>setCandleReward(null),2500);
  }
  function buyAnimal(typeId){
    if(animals.length>=MAX_ANIMALS){
      setToast({msg:`Max ${MAX_ANIMALS} animals!`,emoji:"🚫"});
      return;
    }
    const type=ANIMAL_TYPES.find(t=>t.id===typeId);
    if(!type) return;
    if(!spendCoins(type.buyCost)){
      setToast({msg:"Not enough coins!",emoji:"🪙"});
      return;
    }
    const newAnimal={id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),typeId,produceReadyAt:null};
    const next=[...animals,newAnimal];
    persistAnimals(next);
    setAnimalModal(null);
    setToast({msg:`Got a ${type.name}!`,emoji:type.emoji});
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
    const bonus=(plot.prayerCount||0)*PRAYER_BONUS_MINS;
    let accumulated=0;
    for(let i=0;i<plant.growthBase.length;i++){
      accumulated+=Math.max(0.5,plant.growthBase[i]-bonus); // min 30 sec per stage
      if(elapsed<accumulated) return GROWTH_STAGES[i]||"seed";
    }
    return "harvestable";
  }
  function getStageIndex(stage){return GROWTH_STAGES.indexOf(stage);}
  function getPlantEmoji(plot){
    if(plot.stage==="empty") return "";
    const plant=GARDEN_PLANTS.find(p=>p.id===plot.plantType);
    if(!plant) return "🌱";
    const si=getStageIndex(getComputedStage(plot));
    return plant.stageEmojis?.[Math.max(0,si)]||"🌱";
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
    trackMission("daily_harvest"); trackMission("weekly_harvest_5");
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
  function transitionToCozyCreations(){
    setSpaceTransit(true); setTransitDir("toRoom");
    setTimeout(()=>{setScreen("cozy-creations");setSpaceTransit(false);setTransitDir(null);},700);
  }
  function transitionToPorch(){
    setSpaceTransit(true); setTransitDir("toRoom");
    setTimeout(()=>{setScreen("porch");setSpaceTransit(false);setTransitDir(null);},700);
  }
  function transitionToRooftop(){
    setSpaceTransit(true); setTransitDir("toRooftop");
    prevScreenRef.current=screen;
    setTimeout(()=>{setScreen("rooftop-lounge");setSpaceTransit(false);setTransitDir(null);},700);
  }
  function transitionToCabin(){
    setSpaceTransit(true); setTransitDir("toCabin");
    setTimeout(()=>{setScreen("cabin");setSpaceTransit(false);setTransitDir(null);},700);
  }
  function transitionToGarden(){
    setSpaceTransit(true); setTransitDir("toGarden");
    setTimeout(()=>{setScreen("rooftop-garden");setSpaceTransit(false);setTransitDir(null);},700);
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
    {bgImage:"/scene-bridge.webp",title:"Most people avoid the real questions.",body:"We fill our days to escape the silence. Inner Room Journal slows you down — and asks the ones that matter.",btn:"Continue",effects:["fireflies","water"]},
    {bgImage:"/scene-path.webp",title:"You won't journal alone.",body:"Guided prompts take you deeper — from surface to root. Plus community rooms where others walk beside you.",btn:"Continue",effects:["fireflies"]},
    {bgImage:"/scene-porch.webp",title:"Growth becomes visible.",body:"Over time, patterns emerge from your words. Themes surface. Transformation becomes something you can see.",btn:"Step inside",effects:["fireflies","smoke","glow"]},
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
      // Final scene → go to profile setup (then cabin)
      setTimeout(()=>{
        if(dontShowAgain) dbSave("irj-onboarded",true);
        setOnboardStep(0);
        setScreen("profile-onboard");
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
    if(dontShowAgain) dbSave("irj-onboarded",true);
    setOnboardStep(0);
    setScreen("profile-onboard");
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
    // Becoming Her opens its own sanctuary screen instead of desk book
    if(bookId==="becoming-her"){ setScreen("becoming-her"); return; }
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
  function goToHistory(){setMenuOpen(false);setCalMonth(new Date().getMonth());setCalYear(new Date().getFullYear());setCalSelectedDay(null);setExpandedEntry(null);setScreen("history");}

  /* ── SECTION HISTORY RENDERER (shared by all journal sections) ── */
  function renderSectionHistory(sectionEntries, label, onNewEntry, isPrayer){
    const MN=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const DN=["S","M","T","W","T","F","S"];
    const sorted=[...sectionEntries].sort((a,b)=>{const ai=parseInt(a.id)||0,bi=parseInt(b.id)||0;return bi-ai;});
    const firstDow=new Date(calYear,calMonth,1).getDay();
    const dim=new Date(calYear,calMonth+1,0).getDate();
    const isCurMonth=calMonth===new Date().getMonth()&&calYear===new Date().getFullYear();
    const todayD=new Date().getDate();
    const byDate={};
    sectionEntries.forEach(e=>{const d=e.date;if(!byDate[d])byDate[d]=[];byDate[d].push(e);});
    const selStr=calSelectedDay?`${calYear}-${String(calMonth+1).padStart(2,"0")}-${String(calSelectedDay).padStart(2,"0")}`:null;
    const selEntries=selStr?(byDate[selStr]||[]):[];
    const monthKey=`${calYear}-${String(calMonth+1).padStart(2,"0")}`;
    const monthCount=sorted.filter(e=>e.date.startsWith(monthKey)).length;

    return<>
      {/* New entry button */}
      <button onClick={onNewEntry} style={{width:"100%",background:"linear-gradient(135deg,rgba(93,74,46,0.1),rgba(93,74,46,0.04))",border:"1px solid rgba(93,74,46,0.22)",color:"#5C4A2E",padding:"11px 16px",borderRadius:8,fontFamily:SERIF,fontStyle:"italic",fontSize:"0.82rem",cursor:"pointer",transition:"all .2s",marginBottom:14,letterSpacing:"0.02em",textAlign:"center"}}>
        Write a new {label}
      </button>

      {/* List / Calendar toggle */}
      <div style={{display:"flex",gap:4,justifyContent:"center",marginBottom:14}}>
        {["list","calendar"].map(m=><button key={m} onClick={()=>{setHistoryMode(m);if(m==="calendar"){setCalMonth(new Date().getMonth());setCalYear(new Date().getFullYear());setCalSelectedDay(null);}}} style={{background:historyMode===m?"rgba(93,74,46,0.15)":"rgba(139,109,69,0.06)",border:"1px solid rgba(139,109,69,0.12)",borderRadius:16,padding:"5px 14px",cursor:"pointer",fontFamily:SANS,fontSize:"0.66rem",fontWeight:600,color:historyMode===m?"#3D2B18":"rgba(107,85,58,0.5)",letterSpacing:"0.06em",textTransform:"capitalize",transition:"all .2s"}}>{m}</button>)}
      </div>

      {/* LIST MODE */}
      {historyMode==="list"&&<>
        {sorted.length===0?<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",textAlign:"center",padding:"0 12px"}}>
          <p style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.86rem",color:"rgba(107,85,58,0.4)",lineHeight:1.7}}>No {label==="entry"?"entries":label+"s"} yet. Start writing!</p>
        </div>:(
          <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:9}}>
            {sorted.map(e=>{
              const isExp=expandedEntry===e.id;
              return(<div key={e.id} onClick={()=>setExpandedEntry(isExp?null:e.id)} style={{background:"rgba(139,109,69,0.05)",border:"1px solid rgba(139,109,69,0.1)",borderRadius:8,padding:"10px 12px",cursor:"pointer",transition:"all .2s"}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                  <span style={{fontSize:"0.66rem",fontWeight:600,color:"rgba(107,85,58,0.5)",fontFamily:SANS}}>{e.date} {entryTime(e)}</span>
                  <span style={{marginLeft:"auto",fontSize:"0.58rem",color:"rgba(107,85,58,0.3)",fontFamily:SANS}}>{e.words||wc(e.text||"")} words</span>
                </div>
                {e.prompt&&e.prompt!=="Free write"&&<p style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.72rem",color:"rgba(107,85,58,0.38)",margin:"0 0 4px",lineHeight:1.5}}>{e.prompt}</p>}
                {isPrayer&&(()=>{const plot=gardenPlots.find(g=>g.prayerId===e.id&&g.stage!=="empty");const stage=plot?getComputedStage(plot):null;return plot?<span style={{fontSize:"0.6rem",fontFamily:SANS,color:"rgba(107,85,58,0.45)",marginBottom:3,display:"block"}}>{getPlantEmoji(plot)} {stage}</span>:null;})()}
                <p style={{fontFamily:SERIF,fontSize:"0.78rem",color:"#4A3826",lineHeight:1.6,margin:0,whiteSpace:isExp?"pre-wrap":"normal"}}>{isExp?(e.text||""):((e.text||"").length>120?(e.text||"").slice(0,120)+"...":(e.text||""))}</p>
                {!isExp&&(e.text||"").length>120&&<span style={{fontSize:"0.6rem",color:"rgba(139,109,69,0.5)",fontFamily:SANS}}>Tap to read more</span>}
                {isExp&&<span style={{fontSize:"0.6rem",color:"rgba(139,109,69,0.5)",fontFamily:SANS,marginTop:4,display:"block"}}>Tap to collapse</span>}
              </div>);
            })}
          </div>
        )}
      </>}

      {/* CALENDAR MODE */}
      {historyMode==="calendar"&&<>
        {/* Month nav */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10,padding:"0 2px"}}>
          <button onClick={()=>calNavigate("prev")} style={{background:"rgba(139,109,69,0.06)",border:"1px solid rgba(139,109,69,0.12)",borderRadius:"50%",width:28,height:28,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.8rem",color:"#5C4A2E"}}>&#8249;</button>
          <div style={{textAlign:"center"}}>
            <div style={{fontFamily:DISPLAY,fontSize:"0.88rem",fontWeight:700,color:"#3D2B18"}}>{["January","February","March","April","May","June","July","August","September","October","November","December"][calMonth]}</div>
            <div style={{fontFamily:SANS,fontSize:"0.56rem",color:"rgba(107,85,58,0.4)",letterSpacing:"0.08em"}}>{calYear}</div>
          </div>
          <button onClick={()=>calNavigate("next")} style={{background:"rgba(139,109,69,0.06)",border:"1px solid rgba(139,109,69,0.12)",borderRadius:"50%",width:28,height:28,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.8rem",color:"#5C4A2E"}}>&#8250;</button>
        </div>

        {/* Calendar grid */}
        <div style={{background:"rgba(139,109,69,0.04)",border:"1px solid rgba(139,109,69,0.1)",borderRadius:10,padding:"8px 6px",marginBottom:10}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:1,marginBottom:4}}>
            {DN.map((d,i)=><div key={i} style={{textAlign:"center",fontSize:"0.52rem",fontFamily:SANS,fontWeight:600,color:"rgba(107,85,58,0.35)",padding:"2px 0"}}>{d}</div>)}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:1}}>
            {Array.from({length:firstDow}).map((_,i)=><div key={`e${i}`} style={{aspectRatio:"1",padding:2}}/>)}
            {Array.from({length:dim}).map((_,i)=>{
              const day=i+1;
              const ds=`${calYear}-${String(calMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
              const de=byDate[ds]||[];
              const has=de.length>0;
              const isSel=calSelectedDay===day;
              const isT=isCurMonth&&day===todayD;
              return(
                <button key={day} onClick={()=>{setCalSelectedDay(isSel?null:day);setExpandedEntry(null);}}
                  style={{aspectRatio:"1",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:isSel?"#3D2B18":isT?"rgba(139,109,69,0.08)":"transparent",border:isT&&!isSel?"1px solid rgba(139,109,69,0.3)":"1px solid transparent",borderRadius:8,cursor:"pointer",position:"relative",transition:"all .15s",padding:0}}>
                  <span style={{fontSize:"0.7rem",fontFamily:SERIF,fontWeight:isSel||isT?700:400,color:isSel?"#F5E6C8":isT?"#8B6D45":has?"#3D2B18":"rgba(107,85,58,0.3)"}}>{day}</span>
                  {has&&<div style={{display:"flex",gap:1,position:"absolute",bottom:2}}>
                    {de.slice(0,3).map((_,j)=><div key={j} style={{width:3,height:3,borderRadius:"50%",background:isSel?"#F5E6C8":"#8B6D45",opacity:0.7}}/>)}
                  </div>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected day entries or month summary */}
        {!calSelectedDay&&<p style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.74rem",color:"rgba(107,85,58,0.4)",textAlign:"center",margin:"4px 0"}}>{monthCount>0?`${monthCount} ${monthCount===1?label:(label==="entry"?"entries":label+"s")} this month`:`No ${label==="entry"?"entries":label+"s"} this month`}</p>}
        {calSelectedDay&&selEntries.length===0&&<p style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.74rem",color:"rgba(107,85,58,0.35)",textAlign:"center",margin:"4px 0"}}>No {label==="entry"?"entries":label+"s"} on this day</p>}
        {calSelectedDay&&selEntries.length>0&&<div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:8}}>
          {selEntries.map(e=>{
            const isExp=expandedEntry===e.id;
            return(<div key={e.id} onClick={()=>setExpandedEntry(isExp?null:e.id)} style={{background:"rgba(139,109,69,0.05)",border:"1px solid rgba(139,109,69,0.1)",borderRadius:8,padding:"8px 10px",cursor:"pointer"}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
                <span style={{fontSize:"0.62rem",fontWeight:600,color:"rgba(107,85,58,0.5)",fontFamily:SANS}}>{entryTime(e)}</span>
                <span style={{marginLeft:"auto",fontSize:"0.56rem",color:"rgba(107,85,58,0.3)",fontFamily:SANS}}>{e.words||wc(e.text||"")} words</span>
              </div>
              <p style={{fontFamily:SERIF,fontSize:"0.76rem",color:"#4A3826",lineHeight:1.5,margin:0,whiteSpace:isExp?"pre-wrap":"normal"}}>{isExp?(e.text||""):((e.text||"").length>100?(e.text||"").slice(0,100)+"...":(e.text||""))}</p>
            </div>);
          })}
        </div>}
      </>}
    </>;
  }


  /* ── DARK HEADER (reusable) ── */
  const DarkHeader = ({title, onBack, extra, backLabel}) => (
    <header style={{background:B.night,padding:"0 24px",height:"54px",display:"flex",alignItems:"center",gap:"12px",boxShadow:"0 2px 16px rgba(0,0,0,0.2)",position:"sticky",top:0,zIndex:200,flexShrink:0}}>
      <button onClick={onBack} style={{background:"transparent",border:"none",cursor:"pointer",color:"rgba(180,165,148,0.55)",fontSize:"0.8rem",fontFamily:SANS,padding:0,transition:"color 0.15s",whiteSpace:"nowrap"}} onMouseEnter={e=>e.target.style.color=B.gold} onMouseLeave={e=>e.target.style.color="rgba(180,165,148,0.55)"}>{backLabel||"← Back"}</button>
      <div style={{height:"14px",width:"1px",background:"rgba(201,169,110,0.2)"}}/>
      <span style={{fontFamily:SERIF,fontStyle:"italic",color:B.goldL,fontSize:"0.92rem",flex:1}}>{title}</span>
      {extra}
    </header>
  );

  /* ── PREMIUM LOCK OVERLAY ── */
  const PremiumLock=({compact})=>(
    <div onClick={(e)=>{e.stopPropagation();setMenuOpen(false);setPrevScreen(screen);setScreen("upgrade");}}
      style={{position:"absolute",inset:0,zIndex:5,background:"rgba(10,8,6,0.65)",backdropFilter:"blur(2px)",WebkitBackdropFilter:"blur(2px)",borderRadius:"inherit",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:compact?4:8,cursor:"pointer",transition:"all 0.2s"}}>
      <svg width={compact?14:18} height={compact?14:18} viewBox="0 0 24 24" fill="none" stroke={B.gold} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
      {!compact&&<span style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.68rem",color:B.goldL,textAlign:"center",lineHeight:1.3}}>Inner Room Plus</span>}
    </div>
  );

  /* ── PLUS ICON HELPER (for upgrade screen) ── */
  const PlusIcon=({type})=>{
    const s={stroke:"rgba(201,169,110,0.7)",strokeWidth:"1.8",strokeLinecap:"round",strokeLinejoin:"round",fill:"none"};
    if(type==="scroll") return <svg width="18" height="18" viewBox="0 0 24 24" {...s}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
    if(type==="seedling") return <svg width="18" height="18" viewBox="0 0 24 24" {...s}><path d="M7 20h10"/><path d="M10 20c5.5-2.5 8-6 6-10-4 2-6 5.5-6 10"/><path d="M14 20c-5.5-2.5-8-6-6-10 4 2 6 5.5 6 10"/></svg>;
    if(type==="feather") return <svg width="18" height="18" viewBox="0 0 24 24" {...s}><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><line x1="16" y1="8" x2="2" y2="22"/><line x1="17.5" y1="15" x2="9" y2="15"/></svg>;
    if(type==="quill") return <svg width="18" height="18" viewBox="0 0 24 24" {...s}><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>;
    if(type==="frame") return <svg width="18" height="18" viewBox="0 0 24 24" {...s}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>;
    return null;
  };

  /* ══ MAP HUD BUTTON — persistent nav across all scenes ══ */
  const MapHudButton=()=>(
    <button onClick={()=>{setScreen("map");setMarketStall(null);setShopStall(null);}} style={{position:"fixed",bottom:20,left:"50%",transform:"translateX(-50%)",zIndex:50,background:"rgba(26,22,18,0.75)",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",border:"1px solid rgba(201,169,110,0.25)",borderRadius:14,padding:"8px 22px",cursor:"pointer",display:"flex",alignItems:"center",gap:7,animation:"fadeUp .8s 1s ease both, mapBtnGlow 4s 2s ease-in-out infinite",transition:"all 0.2s",boxShadow:"0 2px 12px rgba(0,0,0,0.3)"}}>
      <span style={{fontSize:"0.85rem"}}>🗺️</span>
      <span style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.75rem",color:"rgba(255,240,200,0.55)",letterSpacing:"0.02em"}}>Map</span>
    </button>
  );

  /* ══ BOTTOM MENU DRAWER — collapsible tray with Map, Sounds, History, Account ══ */
  const BottomMenuDrawer=()=>{
    const sIsPlaying=(id)=>_amb.id===id&&_amb.el&&!_amb.el.paused;
    const anyPlaying=_amb.el&&!_amb.el.paused;
    return(<>
      {/* Collapsed "Menu" tab — glowing, always visible */}
      {!menuOpen&&(
        <button onClick={()=>setMenuOpen(true)} style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",zIndex:50,background:"rgba(26,22,18,0.88)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",border:"1px solid rgba(201,169,110,0.3)",borderBottom:"none",borderRadius:"14px 14px 0 0",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:7,padding:"7px 28px",animation:"fadeUp .6s .8s ease both, mapBtnGlow 4s 2s ease-in-out infinite",boxShadow:"0 -2px 16px rgba(201,169,110,0.12), 0 0 24px rgba(201,169,110,0.06)"}}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,240,200,0.55)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
          <span style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.75rem",color:"rgba(255,240,200,0.55)",letterSpacing:"0.03em"}}>Menu</span>
          {anyPlaying&&<div style={{width:5,height:5,borderRadius:"50%",background:"rgba(90,138,106,0.8)",animation:"gentlePulse 1.5s infinite"}}/>}
          {unreadCount>0&&<div style={{width:7,height:7,borderRadius:"50%",background:B.gold,animation:"gentlePulse 1.5s ease-in-out infinite"}}/>}
          {totalUnclaimed>0&&!unreadCount&&<div style={{width:7,height:7,borderRadius:"50%",background:B.gold,animation:"gentlePulse 1.5s ease-in-out infinite"}}/>}
        </button>
      )}
      {/* Backdrop */}
      {menuOpen&&<div onClick={()=>setMenuOpen(false)} style={{position:"fixed",inset:0,zIndex:58,background:"rgba(10,8,6,0.4)",animation:"spaceFadeIn .25s ease"}}/>}
      {/* Expanded drawer */}
      {menuOpen&&(
        <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:60,maxHeight:420,background:"rgba(26,22,18,0.94)",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",borderTop:"1px solid rgba(201,169,110,0.2)",borderRadius:"18px 18px 0 0",animation:"menuDrawerUp .35s cubic-bezier(.22,1,.36,1) both",display:"flex",flexDirection:"column",overflowY:"auto",WebkitOverflowScrolling:"touch",padding:"0 20px 28px"}}>
          {/* Drag handle */}
          <div onClick={()=>setMenuOpen(false)} style={{display:"flex",justifyContent:"center",padding:"12px 0 10px",cursor:"pointer"}}>
            <div style={{width:36,height:4,borderRadius:2,background:"rgba(201,169,110,0.3)"}}/>
          </div>

          {/* ── MAP BUTTON — prominent at top ── */}
          <button onClick={()=>{setMenuOpen(false);setScreen("map");setMarketStall(null);setShopStall(null);}} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,width:"100%",background:"rgba(201,169,110,0.08)",border:"1px solid rgba(201,169,110,0.2)",borderRadius:10,padding:"13px 14px",cursor:"pointer",marginBottom:14,transition:"all 0.2s"}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,240,200,0.6)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
            <span style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.82rem",color:B.goldL}}>World Map</span>
          </button>

          {/* ── OWNER: export mailing list ── */}
          {isBlogOwner(user)&&(
            <button onClick={()=>{exportSubscribersCsv();}} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,width:"100%",background:"rgba(90,138,106,0.08)",border:"1px solid rgba(90,138,106,0.25)",borderRadius:10,padding:"12px 14px",cursor:"pointer",marginBottom:14,transition:"all 0.2s"}}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(190,211,196,0.7)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <span style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.8rem",color:"rgba(190,211,196,0.85)"}}>Export email list (CSV)</span>
            </button>
          )}

          {/* ── SOUNDS (collapsible) ── */}
          <div style={{marginBottom:14}}>
            {/* Sounds header — tap to expand/collapse */}
            <button onClick={()=>setMenuSoundsOpen(p=>!p)} style={{display:"flex",alignItems:"center",gap:10,width:"100%",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(201,169,110,0.08)",borderRadius:10,padding:"11px 14px",cursor:"pointer",transition:"all 0.2s",marginBottom:menuSoundsOpen?10:0}}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(201,169,110,0.5)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
              <span style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.78rem",color:B.goldL,flex:1,textAlign:"left"}}>Sounds</span>
              {/* Now-playing mini indicator when collapsed */}
              {!menuSoundsOpen&&anyPlaying&&(
                <div style={{display:"flex",alignItems:"center",gap:5}}>
                  <div style={{display:"flex",alignItems:"flex-end",gap:1.5,height:10}}>
                    {[0,1,2].map(i=><div key={i} style={{width:2,borderRadius:1,background:"rgba(90,138,106,0.6)",animation:`soundBar 0.${6+i*2}s ease-in-out infinite alternate`,animationDelay:`${i*0.1}s`,height:i===1?"100%":"55%"}}/>)}
                  </div>
                  <span style={{fontFamily:SANS,fontSize:"0.62rem",color:"rgba(190,211,196,0.5)"}}>{SOUND_LIBRARY.find(s=>s.id===_amb.id)?.name||""}</span>
                </div>
              )}
              {/* Chevron */}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(201,169,110,0.35)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{transition:"transform 0.25s",transform:menuSoundsOpen?"rotate(180deg)":"rotate(0deg)"}}><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            {/* Expandable sound options */}
            {menuSoundsOpen&&(<>
              {/* Now playing bar */}
              {anyPlaying&&(
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,padding:"8px 12px",background:"rgba(90,138,106,0.08)",border:"1px solid rgba(90,138,106,0.15)",borderRadius:8}}>
                  <div style={{display:"flex",alignItems:"flex-end",gap:2,height:12}}>
                    {[0,1,2].map(i=><div key={i} style={{width:2.5,borderRadius:1,background:"rgba(90,138,106,0.6)",animation:`soundBar 0.${6+i*2}s ease-in-out infinite alternate`,animationDelay:`${i*0.15}s`,height:i===1?"100%":"60%"}}/>)}
                  </div>
                  <span style={{fontFamily:SANS,fontSize:"0.7rem",color:"rgba(190,211,196,0.6)",flex:1}}>{SOUND_LIBRARY.find(s=>s.id===_amb.id)?.name||"Playing"}</span>
                  <button onClick={()=>{ambientStop(800);setAmbientMuted(false);manualSoundRef.current=false;}} style={{background:"transparent",border:"1px solid rgba(255,100,100,0.15)",borderRadius:6,padding:"3px 8px",cursor:"pointer",color:"rgba(255,150,150,0.5)",fontSize:"0.62rem",fontFamily:SANS,fontWeight:600}}>Stop</button>
                </div>
              )}
              {/* Sound list — sounds belonging to the active season are highlighted */}
              {(()=>{ const seasonSounds=getRoomTheme(roomTheme).sounds||[]; const seasonName=getRoomTheme(roomTheme).name; return(
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {[...SOUND_LIBRARY].sort((a,b)=>(seasonSounds.includes(b.id)?1:0)-(seasonSounds.includes(a.id)?1:0)).map(sound=>{
                  const active=sIsPlaying(sound.id);
                  const seasonal=seasonSounds.includes(sound.id);
                  return(
                    <button key={sound.id} onClick={()=>{
                      if(active){ambientStop(800);manualSoundRef.current=false;}
                      else{setAmbientMuted(false);manualSoundRef.current=true;ambientPlay(sound.src,{volume:sound.volume,fadeMs:1200,id:sound.id});}
                    }} style={{display:"flex",alignItems:"center",gap:10,background:active?"rgba(90,138,106,0.08)":seasonal?"rgba(201,169,110,0.07)":"rgba(255,255,255,0.03)",border:"1px solid "+(active?"rgba(90,138,106,0.2)":seasonal?"rgba(201,169,110,0.3)":"rgba(201,169,110,0.08)"),borderRadius:10,padding:"10px 14px",cursor:"pointer",transition:"all 0.2s",width:"100%",textAlign:"left"}}>
                      <div style={{width:32,height:32,borderRadius:"50%",background:active?"rgba(90,138,106,0.2)":"rgba(201,169,110,0.08)",border:"1px solid "+(active?"rgba(90,138,106,0.35)":"rgba(201,169,110,0.15)"),display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        {active?<svg width="12" height="12" viewBox="0 0 24 24" fill="rgba(190,211,196,0.8)" stroke="none"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>:<svg width="12" height="12" viewBox="0 0 24 24" fill="rgba(201,169,110,0.7)" stroke="none"><polygon points="6,3 20,12 6,21"/></svg>}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontFamily:SERIF,fontSize:"0.82rem",color:active?"rgba(190,211,196,0.9)":B.goldL,fontWeight:500}}>{sound.name}</div>
                        <div style={{fontFamily:SANS,fontSize:"0.65rem",color:"rgba(255,248,232,0.25)",lineHeight:1.3}}>{sound.description}</div>
                      </div>
                      <span style={{fontSize:"0.55rem",background:seasonal?"rgba(201,169,110,0.18)":"rgba(201,169,110,0.06)",color:seasonal?B.goldL:"rgba(201,169,110,0.4)",border:"1px solid "+(seasonal?"rgba(201,169,110,0.4)":"rgba(201,169,110,0.1)"),padding:"2px 6px",borderRadius:99,fontFamily:SANS,fontWeight:600,whiteSpace:"nowrap",flexShrink:0}}>{seasonal?`${seasonName} season`:sound.room}</span>
                    </button>
                  );
                })}
              </div>
              );})()}
              {/* Mute toggle */}
              <button onClick={toggleAmbientMute} style={{display:"flex",alignItems:"center",gap:6,marginTop:8,padding:"6px 14px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(201,169,110,0.08)",borderRadius:8,cursor:"pointer"}}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={ambientMuted?"rgba(255,150,150,0.5)":"rgba(201,169,110,0.5)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>{ambientMuted?<><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></>:<><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></>}</svg>
                <span style={{fontFamily:SANS,fontSize:"0.68rem",color:ambientMuted?"rgba(255,150,150,0.5)":"rgba(255,248,232,0.35)",fontWeight:600}}>{ambientMuted?"Unmute":"Mute"}</span>
              </button>
            </>)}
          </div>

          {/* ── SEASON (collapsible) — global theme: re-skins the whole app ── */}
          <div style={{marginBottom:14}}>
            <button onClick={()=>setMenuRoomOpen(p=>!p)} style={{display:"flex",alignItems:"center",gap:10,width:"100%",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(201,169,110,0.08)",borderRadius:10,padding:"11px 14px",cursor:"pointer",transition:"all 0.2s",marginBottom:menuRoomOpen?10:0}}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(201,169,110,0.5)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              <span style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.78rem",color:B.goldL,flex:1,textAlign:"left"}}>Season</span>
              {!menuRoomOpen&&<span style={{fontFamily:SANS,fontSize:"0.62rem",color:"rgba(201,169,110,0.45)"}}>{ROOM_THEMES.find(t=>t.id===roomTheme)?.name||""}</span>}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(201,169,110,0.35)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{transition:"transform 0.25s",transform:menuRoomOpen?"rotate(180deg)":"rotate(0deg)"}}><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            {menuRoomOpen&&(<>
              <p style={{fontFamily:SANS,fontSize:"0.62rem",color:"rgba(255,248,232,0.3)",margin:"0 0 8px",lineHeight:1.4}}>Sets the season for the whole app — your cabin, kitchen, and activity rooms all change to match.</p>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {ROOM_THEMES.map(theme=>{
                  const active=roomTheme===theme.id;
                  return(
                    <button key={theme.id} onClick={()=>{
                      setRoomTheme(theme.id);
                      dbSave(ROOM_THEME_KEY,theme.id);
                      try{window.dispatchEvent(new Event(ROOM_THEME_EVENT));}catch{}
                    }} style={{display:"flex",alignItems:"center",gap:10,background:active?"rgba(201,169,110,0.1)":"rgba(255,255,255,0.03)",border:"1px solid "+(active?"rgba(201,169,110,0.32)":"rgba(201,169,110,0.08)"),borderRadius:10,padding:"8px 10px",cursor:"pointer",transition:"all 0.2s",width:"100%",textAlign:"left"}}>
                      <div style={{width:54,height:40,borderRadius:7,backgroundImage:`url(${theme.src})`,backgroundSize:"cover",backgroundPosition:"center",border:"1px solid "+(active?"rgba(201,169,110,0.4)":"rgba(201,169,110,0.15)"),flexShrink:0}}/>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontFamily:SERIF,fontSize:"0.82rem",color:active?B.goldL:"rgba(255,248,232,0.7)",fontWeight:500}}>{theme.name}</div>
                        <div style={{fontFamily:SANS,fontSize:"0.62rem",color:"rgba(255,248,232,0.28)",lineHeight:1.3}}>{theme.description}</div>
                      </div>
                      {active
                        ?<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={B.gold} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><polyline points="20 6 9 17 4 12"/></svg>
                        :<span style={{fontSize:"0.55rem",background:"rgba(201,169,110,0.06)",color:"rgba(201,169,110,0.4)",border:"1px solid rgba(201,169,110,0.1)",padding:"2px 6px",borderRadius:99,fontFamily:SANS,fontWeight:600,whiteSpace:"nowrap",flexShrink:0}}>{theme.tag}</span>}
                    </button>
                  );
                })}
              </div>
            </>)}
          </div>

          {/* ── MISSIONS BUTTON ── */}
          <button onClick={()=>{const reset=getOrResetMissions(missions);setMissions(reset);dbSave("irj-missions",reset);setShowMissions(true);setMenuOpen(false);}} style={{display:"flex",alignItems:"center",gap:10,width:"100%",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(201,169,110,0.08)",borderRadius:10,padding:"11px 14px",cursor:"pointer",transition:"all 0.2s",marginBottom:14}}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(201,169,110,0.5)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            <span style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.78rem",color:"rgba(255,248,232,0.5)",flex:1,textAlign:"left"}}>Missions</span>
            {totalUnclaimed>0&&<div style={{minWidth:18,height:18,borderRadius:9,background:B.gold,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:SANS,fontSize:"0.55rem",fontWeight:700,color:B.night,padding:"0 5px"}}>{totalUnclaimed}</div>}
          </button>

          {/* ── INVENTORY BUTTON (placeable items) ── */}
          {screen==="cabin"&&(
            <button onClick={()=>{setMenuOpen(false);
              // Trigger the bag drawer in CabinScreen by dispatching a custom event
              window.dispatchEvent(new CustomEvent('open-bag'));
            }} style={{display:"flex",alignItems:"center",gap:10,width:"100%",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(201,169,110,0.08)",borderRadius:10,padding:"11px 14px",cursor:"pointer",transition:"all 0.2s",marginBottom:14}}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(201,169,110,0.5)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
              <span style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.78rem",color:"rgba(255,248,232,0.5)",flex:1,textAlign:"left"}}>Stored Items</span>
            </button>
          )}

          {/* ── INNER ROOM PLUS CTA ── */}
          {!hasPremium&&(
            <button onClick={()=>{setMenuOpen(false);setPrevScreen(screen);setScreen("upgrade");}} style={{display:"flex",alignItems:"center",gap:10,width:"100%",background:"rgba(201,169,110,0.05)",border:"1px solid rgba(201,169,110,0.14)",borderRadius:10,padding:"11px 14px",cursor:"pointer",transition:"all 0.2s",marginBottom:14}}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(201,169,110,0.5)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              <span style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.78rem",color:"rgba(201,169,110,0.55)",flex:1,textAlign:"left"}}>Inner Room Plus</span>
              <span style={{fontSize:"0.55rem",color:"rgba(201,169,110,0.3)",fontFamily:SANS,fontWeight:600,background:"rgba(201,169,110,0.06)",border:"1px solid rgba(201,169,110,0.12)",borderRadius:99,padding:"2px 8px"}}>New</span>
            </button>
          )}

          {/* Divider */}
          <div style={{height:1,background:"rgba(201,169,110,0.1)",margin:"0 0 14px"}}/>

          {/* ── FEED + ALERTS + HISTORY + ACCOUNT ROW ── */}
          <div style={{display:"flex",gap:8}}>
            {/* Feed → routes to Upper Room */}
            <button onClick={()=>{setMenuOpen(false);setUpperRoomView("feed");setScreen("upper-room");}} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(201,169,110,0.12)",borderRadius:10,padding:"12px 8px",cursor:"pointer",transition:"all 0.2s"}}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(201,169,110,0.5)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              <span style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.72rem",color:B.goldL}}>Feed</span>
            </button>
            {/* Alerts → routes to Upper Room */}
            {user&&(
              <button onClick={()=>{setMenuOpen(false);setUpperRoomView("notifications");setScreen("upper-room");}} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6,position:"relative",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(201,169,110,0.12)",borderRadius:10,padding:"12px 8px",cursor:"pointer",transition:"all 0.2s"}}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(201,169,110,0.5)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                <span style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.72rem",color:B.goldL}}>Alerts</span>
                {unreadCount>0&&<div style={{position:"absolute",top:4,right:6,minWidth:16,height:16,borderRadius:8,background:B.gold,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:SANS,fontSize:"0.55rem",fontWeight:700,color:B.night,lineHeight:1,padding:"0 4px"}}>{unreadCount>99?"99+":unreadCount}</div>}
              </button>
            )}
            {/* History */}
            <button onClick={()=>{setMenuOpen(false);goToHistory();}} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(201,169,110,0.12)",borderRadius:10,padding:"12px 8px",cursor:"pointer",transition:"all 0.2s"}}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(201,169,110,0.5)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
              <span style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.72rem",color:B.goldL}}>History</span>
            </button>
            {/* Account */}
            {!user&&!authLoading&&auth?(
              <button onClick={()=>{setMenuOpen(false);handleGoogleSignIn();}} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(201,169,110,0.12)",borderRadius:10,padding:"12px 8px",cursor:"pointer",transition:"all 0.2s"}}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                <span style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.72rem",color:"rgba(255,248,232,0.5)"}}>Sign in</span>
              </button>
            ):user?(
              <button onClick={()=>{setMenuOpen(false);setWindowPanel("profile");}} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(201,169,110,0.12)",borderRadius:10,padding:"12px 8px",cursor:"pointer",transition:"all 0.2s"}}>
                {user.photoURL?<img src={user.photoURL} alt="" referrerPolicy="no-referrer" style={{width:20,height:20,borderRadius:"50%",objectFit:"cover",border:"1px solid rgba(201,169,110,0.3)"}}/>:<span style={{fontSize:"0.72rem",color:B.goldL,fontFamily:DISPLAY,fontWeight:700}}>{user.displayName?.[0]||"?"}</span>}
                <span style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.72rem",color:B.goldL}}>Profile</span>
                {syncStatus==="synced"&&<div style={{width:6,height:6,borderRadius:"50%",background:"#6AAA6A"}}/>}
              </button>
            ):null}
          </div>
        </div>
      )}
      {/* ══ MISSIONS MODAL ═══════════════════════════ */}
      {showMissions&&(
        <>
          {/* Backdrop */}
          <div onClick={()=>setShowMissions(false)} style={{position:"fixed",inset:0,zIndex:299,background:"rgba(10,8,6,0.55)",backdropFilter:"blur(4px)",WebkitBackdropFilter:"blur(4px)",animation:"spaceFadeIn .25s ease"}}/>
          {/* Panel */}
          <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:300,maxHeight:"80vh",background:"rgba(26,22,18,0.97)",backdropFilter:"blur(18px)",WebkitBackdropFilter:"blur(18px)",borderTop:"1px solid rgba(201,169,110,0.25)",borderRadius:"18px 18px 0 0",animation:"panelSlideUp .35s cubic-bezier(.22,1,.36,1) both",display:"flex",flexDirection:"column"}}>
            {/* Drag handle */}
            <div onClick={()=>setShowMissions(false)} style={{display:"flex",justifyContent:"center",padding:"12px 0 6px",cursor:"pointer",flexShrink:0}}>
              <div style={{width:36,height:4,borderRadius:2,background:"rgba(201,169,110,0.3)"}}/>
            </div>
            {/* Header */}
            <div style={{textAlign:"center",padding:"0 20px 16px",flexShrink:0}}>
              <h2 style={{fontFamily:DISPLAY,fontSize:"1.25rem",fontWeight:700,color:B.goldL,margin:"0 0 4px",textShadow:"0 2px 12px rgba(0,0,0,0.5)"}}>Missions</h2>
              <p style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.76rem",color:"rgba(255,248,232,0.3)",margin:0}}>Complete missions for rewards</p>
            </div>
            {/* Scrollable content */}
            <div style={{overflowY:"auto",WebkitOverflowScrolling:"touch",padding:"0 20px 28px",flex:1}}>

              {/* ── DAILY SECTION ── */}
              <div style={{marginBottom:24}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                  <span style={{fontFamily:SANS,fontSize:"0.65rem",fontWeight:700,color:B.gold,letterSpacing:"0.1em",textTransform:"uppercase"}}>Daily</span>
                  <div style={{flex:1,height:1,background:"rgba(201,169,110,0.1)"}}/>
                  <span style={{fontFamily:SANS,fontSize:"0.58rem",color:"rgba(255,248,232,0.2)"}}>Resets at midnight</span>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {DAILY_MISSIONS.map((m,idx)=>{
                    const s=activeMissions?.daily?.progress?.[m.id]||{count:0,claimed:false};
                    const done=s.count>=m.target;
                    const claimed=s.claimed;
                    const pct=Math.min(s.count/m.target,1);
                    return (
                      <div key={m.id} style={{background:claimed?"rgba(255,255,255,0.015)":done?"rgba(201,169,110,0.08)":"rgba(255,255,255,0.03)",border:`1px solid ${claimed?"rgba(201,169,110,0.06)":done?"rgba(201,169,110,0.22)":"rgba(201,169,110,0.08)"}`,borderRadius:12,padding:"12px 14px",opacity:claimed?0.5:1,transition:"all 0.2s",animation:`fadeUp .4s ${idx*0.05}s ease both`}}>
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          {/* Status icon */}
                          {claimed?(
                            <div style={{width:22,height:22,borderRadius:"50%",background:"rgba(106,170,106,0.15)",border:"1.5px solid rgba(106,170,106,0.35)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#6AAA6A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                            </div>
                          ):done?(
                            <div style={{width:22,height:22,borderRadius:"50%",background:"rgba(201,169,110,0.2)",border:"1.5px solid rgba(201,169,110,0.5)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                              <div style={{width:8,height:8,borderRadius:"50%",background:B.gold}}/>
                            </div>
                          ):(
                            <div style={{width:22,height:22,borderRadius:"50%",background:"transparent",border:"1.5px solid rgba(255,248,232,0.15)",flexShrink:0}}/>
                          )}
                          {/* Label + description */}
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontFamily:SANS,fontSize:"0.78rem",fontWeight:600,color:done?B.goldL:"rgba(255,248,232,0.7)",lineHeight:1.3}}>{m.label}</div>
                            <div style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.68rem",color:"rgba(255,248,232,0.25)",marginTop:1}}>{m.description}</div>
                          </div>
                          {/* Reward or claim */}
                          {claimed?(
                            <span style={{fontFamily:SANS,fontSize:"0.62rem",fontWeight:600,color:"rgba(106,170,106,0.5)"}}>Claimed</span>
                          ):done?(
                            <button onClick={()=>claimMissionReward(m.id,"daily")} style={{background:"rgba(201,169,110,0.15)",border:"1px solid rgba(201,169,110,0.4)",borderRadius:999,padding:"5px 14px",cursor:"pointer",fontFamily:SANS,fontSize:"0.68rem",fontWeight:700,color:B.gold,transition:"all 0.2s",whiteSpace:"nowrap"}}>Claim</button>
                          ):(
                            <span style={{fontFamily:SANS,fontSize:"0.62rem",color:"rgba(255,248,232,0.2)",whiteSpace:"nowrap"}}>+{m.reward.candles?`${m.reward.candles} candles`:""}{m.reward.coins?`${m.reward.coins} coins`:""}</span>
                          )}
                        </div>
                        {/* Progress bar (for multi-target missions) */}
                        {m.target>1&&!claimed&&(
                          <div style={{marginTop:8,display:"flex",alignItems:"center",gap:8}}>
                            <div style={{flex:1,height:4,borderRadius:2,background:"rgba(255,255,255,0.06)",overflow:"hidden"}}>
                              <div style={{width:`${pct*100}%`,height:"100%",borderRadius:2,background:done?"rgba(201,169,110,0.7)":"rgba(201,169,110,0.35)",transition:"width 0.4s ease"}}/>
                            </div>
                            <span style={{fontFamily:SANS,fontSize:"0.58rem",color:"rgba(255,248,232,0.25)",whiteSpace:"nowrap"}}>{Math.min(s.count,m.target)}/{m.target}</span>
                          </div>
                        )}
                        {/* Single-target progress note */}
                        {m.target===1&&!claimed&&!done&&(
                          <div style={{marginTop:4}}>
                            <span style={{fontFamily:SANS,fontSize:"0.58rem",color:"rgba(255,248,232,0.15)"}}>{s.count}/{m.target}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── PLUS DAILY MISSIONS ── */}
              <div style={{marginTop:16,marginBottom:24}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={B.gold} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  <span style={{fontFamily:SANS,fontSize:"0.6rem",fontWeight:700,color:B.gold,letterSpacing:"0.1em",textTransform:"uppercase"}}>Plus Daily</span>
                  <div style={{flex:1,height:1,background:"rgba(201,169,110,0.1)"}}/>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {PREMIUM_DAILY_MISSIONS.map((m,idx)=>{
                    const s=hasPremium?(activeMissions?.daily?.progress?.[m.id]||{count:0,claimed:false}):{count:0,claimed:false};
                    const done=s.count>=m.target;
                    const claimed=s.claimed;
                    const pct=Math.min(s.count/m.target,1);
                    return(
                      <div key={m.id} style={{position:"relative",background:claimed?"rgba(255,255,255,0.015)":done?"rgba(201,169,110,0.08)":"rgba(255,255,255,0.03)",border:`1px solid ${claimed?"rgba(201,169,110,0.06)":done?"rgba(201,169,110,0.22)":"rgba(201,169,110,0.08)"}`,borderRadius:12,padding:"12px 14px",opacity:claimed?0.5:1,transition:"all 0.2s",animation:`fadeUp .4s ${idx*0.05}s ease both`}}>
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          {claimed?(<div style={{width:22,height:22,borderRadius:"50%",background:"rgba(106,170,106,0.15)",border:"1.5px solid rgba(106,170,106,0.35)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#6AAA6A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>):done?(<div style={{width:22,height:22,borderRadius:"50%",background:"rgba(201,169,110,0.2)",border:"1.5px solid rgba(201,169,110,0.5)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><div style={{width:8,height:8,borderRadius:"50%",background:B.gold}}/></div>):(<div style={{width:22,height:22,borderRadius:"50%",background:"transparent",border:"1.5px solid rgba(255,248,232,0.15)",flexShrink:0}}/>)}
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontFamily:SANS,fontSize:"0.78rem",fontWeight:600,color:done?B.goldL:"rgba(255,248,232,0.7)",lineHeight:1.3}}>{m.label}</div>
                            <div style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.68rem",color:"rgba(255,248,232,0.25)",marginTop:1}}>{m.description}</div>
                          </div>
                          {claimed?(<span style={{fontFamily:SANS,fontSize:"0.62rem",fontWeight:600,color:"rgba(106,170,106,0.5)"}}>Claimed</span>):done?(<button onClick={()=>claimMissionReward(m.id,"daily")} style={{background:"rgba(201,169,110,0.15)",border:"1px solid rgba(201,169,110,0.4)",borderRadius:999,padding:"5px 14px",cursor:"pointer",fontFamily:SANS,fontSize:"0.68rem",fontWeight:700,color:B.gold,transition:"all 0.2s",whiteSpace:"nowrap"}}>Claim</button>):(<span style={{fontFamily:SANS,fontSize:"0.62rem",color:"rgba(255,248,232,0.2)",whiteSpace:"nowrap"}}>+{m.reward.candles?`${m.reward.candles} candles`:""}{m.reward.coins?`${m.reward.coins} coins`:""}</span>)}
                        </div>
                        {m.target>1&&!claimed&&(<div style={{marginTop:8,display:"flex",alignItems:"center",gap:8}}><div style={{flex:1,height:4,borderRadius:2,background:"rgba(255,255,255,0.06)",overflow:"hidden"}}><div style={{width:`${pct*100}%`,height:"100%",borderRadius:2,background:done?"rgba(201,169,110,0.7)":"rgba(201,169,110,0.35)",transition:"width 0.4s ease"}}/></div><span style={{fontFamily:SANS,fontSize:"0.58rem",color:"rgba(255,248,232,0.25)",whiteSpace:"nowrap"}}>{Math.min(s.count,m.target)}/{m.target}</span></div>)}
                        {!hasPremium&&<PremiumLock compact/>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── WEEKLY SECTION ── */}
              <div>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                  <span style={{fontFamily:SANS,fontSize:"0.65rem",fontWeight:700,color:B.gold,letterSpacing:"0.1em",textTransform:"uppercase"}}>Weekly</span>
                  <div style={{flex:1,height:1,background:"rgba(201,169,110,0.1)"}}/>
                  <span style={{fontFamily:SANS,fontSize:"0.58rem",color:"rgba(255,248,232,0.2)"}}>Resets Monday</span>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {WEEKLY_MISSIONS.map((m,idx)=>{
                    const s=activeMissions?.weekly?.progress?.[m.id]||{count:0,claimed:false};
                    const done=s.count>=m.target;
                    const claimed=s.claimed;
                    const pct=Math.min(s.count/m.target,1);
                    return (
                      <div key={m.id} style={{background:claimed?"rgba(255,255,255,0.015)":done?"rgba(201,169,110,0.08)":"rgba(255,255,255,0.03)",border:`1px solid ${claimed?"rgba(201,169,110,0.06)":done?"rgba(201,169,110,0.22)":"rgba(201,169,110,0.08)"}`,borderRadius:12,padding:"12px 14px",opacity:claimed?0.5:1,transition:"all 0.2s",animation:`fadeUp .4s ${idx*0.05+0.1}s ease both`}}>
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          {/* Status icon */}
                          {claimed?(
                            <div style={{width:22,height:22,borderRadius:"50%",background:"rgba(106,170,106,0.15)",border:"1.5px solid rgba(106,170,106,0.35)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#6AAA6A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                            </div>
                          ):done?(
                            <div style={{width:22,height:22,borderRadius:"50%",background:"rgba(201,169,110,0.2)",border:"1.5px solid rgba(201,169,110,0.5)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                              <div style={{width:8,height:8,borderRadius:"50%",background:B.gold}}/>
                            </div>
                          ):(
                            <div style={{width:22,height:22,borderRadius:"50%",background:"transparent",border:"1.5px solid rgba(255,248,232,0.15)",flexShrink:0}}/>
                          )}
                          {/* Label + description */}
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontFamily:SANS,fontSize:"0.78rem",fontWeight:600,color:done?B.goldL:"rgba(255,248,232,0.7)",lineHeight:1.3}}>{m.label}</div>
                            <div style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.68rem",color:"rgba(255,248,232,0.25)",marginTop:1}}>{m.description}</div>
                          </div>
                          {/* Reward or claim */}
                          {claimed?(
                            <span style={{fontFamily:SANS,fontSize:"0.62rem",fontWeight:600,color:"rgba(106,170,106,0.5)"}}>Claimed</span>
                          ):done?(
                            <button onClick={()=>claimMissionReward(m.id,"weekly")} style={{background:"rgba(201,169,110,0.15)",border:"1px solid rgba(201,169,110,0.4)",borderRadius:999,padding:"5px 14px",cursor:"pointer",fontFamily:SANS,fontSize:"0.68rem",fontWeight:700,color:B.gold,transition:"all 0.2s",whiteSpace:"nowrap"}}>Claim</button>
                          ):(
                            <span style={{fontFamily:SANS,fontSize:"0.62rem",color:"rgba(255,248,232,0.2)",whiteSpace:"nowrap"}}>+{m.reward.candles?`${m.reward.candles} candles`:""}{m.reward.coins?`${m.reward.coins} coins`:""}</span>
                          )}
                        </div>
                        {/* Progress bar */}
                        {m.target>1&&!claimed&&(
                          <div style={{marginTop:8,display:"flex",alignItems:"center",gap:8}}>
                            <div style={{flex:1,height:4,borderRadius:2,background:"rgba(255,255,255,0.06)",overflow:"hidden"}}>
                              <div style={{width:`${pct*100}%`,height:"100%",borderRadius:2,background:done?"rgba(201,169,110,0.7)":"rgba(201,169,110,0.35)",transition:"width 0.4s ease"}}/>
                            </div>
                            <span style={{fontFamily:SANS,fontSize:"0.58rem",color:"rgba(255,248,232,0.25)",whiteSpace:"nowrap"}}>{Math.min(s.count,m.target)}/{m.target}</span>
                          </div>
                        )}
                        {m.target===1&&!claimed&&!done&&(
                          <div style={{marginTop:4}}>
                            <span style={{fontFamily:SANS,fontSize:"0.58rem",color:"rgba(255,248,232,0.15)"}}>{s.count}/{m.target}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── PLUS WEEKLY MISSIONS ── */}
              <div style={{marginTop:16}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={B.gold} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  <span style={{fontFamily:SANS,fontSize:"0.6rem",fontWeight:700,color:B.gold,letterSpacing:"0.1em",textTransform:"uppercase"}}>Plus Weekly</span>
                  <div style={{flex:1,height:1,background:"rgba(201,169,110,0.1)"}}/>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {PREMIUM_WEEKLY_MISSIONS.map((m,idx)=>{
                    const s=hasPremium?(activeMissions?.weekly?.progress?.[m.id]||{count:0,claimed:false}):{count:0,claimed:false};
                    const done=s.count>=m.target;
                    const claimed=s.claimed;
                    const pct=Math.min(s.count/m.target,1);
                    return(
                      <div key={m.id} style={{position:"relative",background:claimed?"rgba(255,255,255,0.015)":done?"rgba(201,169,110,0.08)":"rgba(255,255,255,0.03)",border:`1px solid ${claimed?"rgba(201,169,110,0.06)":done?"rgba(201,169,110,0.22)":"rgba(201,169,110,0.08)"}`,borderRadius:12,padding:"12px 14px",opacity:claimed?0.5:1,transition:"all 0.2s",animation:`fadeUp .4s ${idx*0.05+0.1}s ease both`}}>
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          {claimed?(<div style={{width:22,height:22,borderRadius:"50%",background:"rgba(106,170,106,0.15)",border:"1.5px solid rgba(106,170,106,0.35)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#6AAA6A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>):done?(<div style={{width:22,height:22,borderRadius:"50%",background:"rgba(201,169,110,0.2)",border:"1.5px solid rgba(201,169,110,0.5)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><div style={{width:8,height:8,borderRadius:"50%",background:B.gold}}/></div>):(<div style={{width:22,height:22,borderRadius:"50%",background:"transparent",border:"1.5px solid rgba(255,248,232,0.15)",flexShrink:0}}/>)}
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontFamily:SANS,fontSize:"0.78rem",fontWeight:600,color:done?B.goldL:"rgba(255,248,232,0.7)",lineHeight:1.3}}>{m.label}</div>
                            <div style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.68rem",color:"rgba(255,248,232,0.25)",marginTop:1}}>{m.description}</div>
                          </div>
                          {claimed?(<span style={{fontFamily:SANS,fontSize:"0.62rem",fontWeight:600,color:"rgba(106,170,106,0.5)"}}>Claimed</span>):done?(<button onClick={()=>claimMissionReward(m.id,"weekly")} style={{background:"rgba(201,169,110,0.15)",border:"1px solid rgba(201,169,110,0.4)",borderRadius:999,padding:"5px 14px",cursor:"pointer",fontFamily:SANS,fontSize:"0.68rem",fontWeight:700,color:B.gold,transition:"all 0.2s",whiteSpace:"nowrap"}}>Claim</button>):(<span style={{fontFamily:SANS,fontSize:"0.62rem",color:"rgba(255,248,232,0.2)",whiteSpace:"nowrap"}}>+{m.reward.candles?`${m.reward.candles} candles`:""}{m.reward.coins?`${m.reward.coins} coins`:""}</span>)}
                        </div>
                        {m.target>1&&!claimed&&(<div style={{marginTop:8,display:"flex",alignItems:"center",gap:8}}><div style={{flex:1,height:4,borderRadius:2,background:"rgba(255,255,255,0.06)",overflow:"hidden"}}><div style={{width:`${pct*100}%`,height:"100%",borderRadius:2,background:done?"rgba(201,169,110,0.7)":"rgba(201,169,110,0.35)",transition:"width 0.4s ease"}}/></div><span style={{fontFamily:SANS,fontSize:"0.58rem",color:"rgba(255,248,232,0.25)",whiteSpace:"nowrap"}}>{Math.min(s.count,m.target)}/{m.target}</span></div>)}
                        {!hasPremium&&<PremiumLock compact/>}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        </>
      )}
    </>);
  };

  /* ── All screen branches are wrapped in this IIFE so the global menu bar
       below can render on EVERY screen (the sound menu, like in the cabin). ── */
  const __screenJSX = (() => {

  /* ══ LOADING ══════════════════════════════════════ */
  if(screen==="loading") return(
    <div style={{minHeight:"100vh",background:B.night,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <style>{GFONTS}</style>
      <span style={{fontFamily:SERIF,fontStyle:"italic",color:"rgba(201,169,110,0.4)",fontSize:"1.1rem"}}>Preparing your space…</span>
    </div>
  );

  /* ══ WELCOME — COZY OUTDOOR CABIN ════════════════ */
  if(screen==="welcome") return(
    <div style={{minHeight:"100vh",width:"100%",position:"relative",overflow:"hidden",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-end",background:"#0A0806"}}>
      <style>{GFONTS}{CSS}</style>
      <style>{`
        /* Welcome cabin scene: use cover on portrait / phone screens (so the
           cabin fills the screen edge-to-edge) and contain on landscape /
           desktop screens (so the whole cabin is visible without being
           chopped off horizontally). The dark page background fills any
           letterbox space. */
        .welcome-cabin-bg { object-fit: cover; }
        @media (min-aspect-ratio: 1/1) {
          .welcome-cabin-bg { object-fit: contain; }
        }
      `}</style>
      {/* Cabin background image — now an <img> so we can calculate rendered rect */}
      <img ref={outdoorImgRef} className="welcome-cabin-bg" src="/outdoor.webp" onLoad={recalcOutdoorRect} alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectPosition:"center 30%",zIndex:0,filter:"brightness(1.25)",transformOrigin:"50% 42%",animation:doorOpening?"walkToDoor 1.3s ease-in forwards":"none"}}/>

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
          if(isOnboarded&&user){
            // Signed in + onboarded → door animation → cabin
            setDoorOpening(true);setDoorPhase("walk");
            setTimeout(()=>setDoorPhase("door"),1300);
            setTimeout(()=>setDoorPhase("enter"),3300);
            setTimeout(()=>{setDoorOpening(false);setDoorPhase(null);setScreen("cabin");},4000);
          }else if(isOnboarded&&!user){
            // Onboarded but not signed in → show door sign-in page
            setOnboardStep(0);setScreen("profile-onboard");
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
        {(doorPhase==="door"||doorPhase==="enter")&&<img src="/door.webp" alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",animation:doorPhase==="enter"?"doorEnterZoom 0.7s ease-in forwards":"doorReveal 0.4s ease-out forwards, doorHoldZoom 2s linear 0.4s forwards"}}/>}

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

  /* ══ PROFILE ONBOARDING — All on the door, then zoom into cabin ═ */
  if(screen==="profile-onboard"){
    const step1Ok=setupUsername.length>=3&&(usernameAvailable||!user)&&!usernameChecking;

    // Door background shared by steps 0-2
    const DoorBg=()=>(
      <>
        <img src="/door.webp" alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",objectPosition:"center center",filter:"brightness(0.8)",animation:onboardStep===0?"sceneFadeIn 1s ease both":"none"}}/>
        <div style={{position:"absolute",top:"28%",left:"30%",width:"80px",height:"80px",borderRadius:"50%",background:"radial-gradient(circle,rgba(255,180,60,0.25) 0%,transparent 70%)",animation:"candleGlowPulse 3.5s ease-in-out infinite",pointerEvents:"none"}}/>
        <div style={{position:"absolute",top:"28%",right:"30%",width:"80px",height:"80px",borderRadius:"50%",background:"radial-gradient(circle,rgba(255,180,60,0.25) 0%,transparent 70%)",animation:"candleGlowPulse 3.5s 0.8s ease-in-out infinite",pointerEvents:"none"}}/>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom,transparent 0%,transparent 35%,rgba(10,8,6,0.5) 60%,rgba(10,8,6,0.92) 85%,rgba(10,8,6,0.98) 100%)"}}/>
      </>
    );

    return(
      <div style={{position:"fixed",inset:0,overflow:"hidden",background:"#0A0806"}}>
        <style>{GFONTS}{CSS}</style>

        {/* ── STEP 0: Door — sign-in gate ── */}
        {onboardStep===0&&(
          <div style={{position:"absolute",inset:0}}>
            <DoorBg/>
            <div style={{position:"absolute",bottom:0,left:0,right:0,zIndex:3,display:"flex",flexDirection:"column",alignItems:"center",padding:"0 28px 48px"}}>
              <div className="fu" style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"14px"}}>
                <div style={{width:"32px",height:"1px",background:"linear-gradient(90deg,transparent,rgba(201,169,110,0.4))"}}/>
                <div style={{width:"4px",height:"4px",borderRadius:"50%",background:"rgba(201,169,110,0.35)"}}/>
                <div style={{width:"32px",height:"1px",background:"linear-gradient(90deg,rgba(201,169,110,0.4),transparent)"}}/>
              </div>
              <h1 className="fu2" style={{fontFamily:DISPLAY,fontSize:"clamp(1.5rem,6vw,2.2rem)",fontWeight:700,color:"#FFF8E8",margin:"0 0 8px",textAlign:"center",textShadow:"0 2px 24px rgba(0,0,0,0.8)",lineHeight:1.25,maxWidth:"380px",letterSpacing:"0.03em"}}>
                There's a place for you here.
              </h1>
              <p className="fu3" style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"clamp(0.82rem,2.8vw,0.95rem)",color:"rgba(255,248,232,0.5)",margin:"0 0 28px",textAlign:"center",maxWidth:"300px",lineHeight:1.65,letterSpacing:"0.02em"}}>
                Make yourself at home — your journey is saved and waiting.
              </p>

              {authMode==="choose"&&(<>
                <button className="fu3 door-btn" onClick={()=>{handleGoogleSignIn();/* navigation handled by ensureUserProfile: returning users → cabin, new users → onboarding */}} style={{width:"100%",maxWidth:"320px",background:"linear-gradient(135deg,rgba(201,169,110,0.22),rgba(201,169,110,0.06))",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",border:"1px solid rgba(201,169,110,0.45)",color:"#FFF8E8",padding:"15px 0",borderRadius:"16px",cursor:"pointer",fontSize:"0.9rem",fontFamily:SERIF,fontWeight:600,letterSpacing:"0.06em",fontStyle:"italic",marginBottom:"12px",transition:"all 0.3s",boxShadow:"0 4px 24px rgba(0,0,0,0.3)"}}>
                  Continue with Google
                </button>
                <button className="fu4" onClick={()=>{setAuthMode("email");setAuthError("");}} style={{width:"100%",maxWidth:"320px",background:"transparent",border:"1px solid rgba(255,248,232,0.12)",borderRadius:"16px",padding:"13px 0",cursor:"pointer",color:"rgba(255,248,232,0.55)",fontFamily:SERIF,fontStyle:"italic",fontSize:"0.85rem",letterSpacing:"0.05em",marginBottom:"14px",transition:"all 0.3s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(255,248,232,0.25)";e.currentTarget.style.color="rgba(255,248,232,0.75)";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,248,232,0.12)";e.currentTarget.style.color="rgba(255,248,232,0.55)";}}>
                  Use email instead
                </button>
                <p className="fu4" style={{fontFamily:SANS,fontSize:"0.62rem",color:"rgba(255,248,232,0.22)",textAlign:"center",margin:0,lineHeight:1.5,letterSpacing:"0.03em",maxWidth:"280px"}}>
                  By continuing you agree to our Privacy Policy. We never sell your information.
                </p>
              </>)}

              {authMode==="email"&&(
                <div className="fu" style={{width:"100%",maxWidth:"320px",display:"flex",flexDirection:"column",alignItems:"stretch"}}>
                  {emailSignupMode&&(
                    <input value={authName} onChange={e=>setAuthName(e.target.value.slice(0,40))} placeholder="Your name" autoCapitalize="words" style={{boxSizing:"border-box",background:"transparent",border:"none",borderBottom:"1px solid rgba(201,169,110,0.35)",padding:"10px 4px",marginBottom:"14px",color:"#FFF8E8",fontFamily:SERIF,fontStyle:"italic",fontSize:"1rem",outline:"none",textAlign:"center"}}/>
                  )}
                  <input type="email" value={authEmail} onChange={e=>setAuthEmail(e.target.value.trim())} placeholder="Email" autoCapitalize="none" autoCorrect="off" spellCheck={false} style={{boxSizing:"border-box",background:"transparent",border:"none",borderBottom:"1px solid rgba(201,169,110,0.35)",padding:"10px 4px",marginBottom:"14px",color:"#FFF8E8",fontFamily:SERIF,fontStyle:"italic",fontSize:"1rem",outline:"none",textAlign:"center"}}/>
                  {emailSignupMode&&(
                    <input type="email" value={authEmail2} onChange={e=>setAuthEmail2(e.target.value.trim())} placeholder="Confirm email" autoCapitalize="none" autoCorrect="off" spellCheck={false} onPaste={e=>e.preventDefault()} style={{boxSizing:"border-box",background:"transparent",border:"none",borderBottom:"1px solid rgba(201,169,110,0.35)",padding:"10px 4px",marginBottom:"14px",color:"#FFF8E8",fontFamily:SERIF,fontStyle:"italic",fontSize:"1rem",outline:"none",textAlign:"center"}}/>
                  )}
                  <input type="password" value={authPassword} onChange={e=>setAuthPassword(e.target.value)} placeholder="Password" style={{boxSizing:"border-box",background:"transparent",border:"none",borderBottom:"1px solid rgba(201,169,110,0.35)",padding:"10px 4px",marginBottom:emailSignupMode?"14px":"6px",color:"#FFF8E8",fontFamily:SERIF,fontStyle:"italic",fontSize:"1rem",outline:"none",textAlign:"center"}}/>
                  {emailSignupMode&&(
                    <input type="password" value={authPassword2} onChange={e=>setAuthPassword2(e.target.value)} placeholder="Confirm password" onPaste={e=>e.preventDefault()} style={{boxSizing:"border-box",background:"transparent",border:"none",borderBottom:"1px solid rgba(201,169,110,0.35)",padding:"10px 4px",marginBottom:"6px",color:"#FFF8E8",fontFamily:SERIF,fontStyle:"italic",fontSize:"1rem",outline:"none",textAlign:"center"}}/>
                  )}
                  {authError&&<p style={{fontFamily:SANS,fontSize:"0.7rem",color:"rgba(220,120,120,0.8)",margin:"6px 0 0",textAlign:"center"}}>{authError}</p>}
                  {(()=>{const canSubmit=!authBusy&&authEmail&&authPassword&&(!emailSignupMode||(authEmail2&&authPassword2));return(
                  <button disabled={!canSubmit} onClick={async()=>{
                    if(emailSignupMode){
                      if(authEmail!==authEmail2){setAuthError("Emails don't match. Please check and try again.");return;}
                      if(authPassword!==authPassword2){setAuthError("Passwords don't match. Please check and try again.");return;}
                    }
                    const ok=emailSignupMode?await handleEmailSignUp(authEmail,authPassword,authName):await handleEmailSignIn(authEmail,authPassword);
                    // Navigation is handled by ensureUserProfile: returning users with a
                    // complete profile go straight to the cabin; new/incomplete users
                    // resume onboarding at the first missing step.
                    if(ok&&emailSignupMode&&authName.trim())setSetupUsername(prev=>prev||authName.trim().replace(/[^a-zA-Z0-9_]/g,"").slice(0,20));
                  }} className={canSubmit?"door-btn":""} style={{marginTop:"18px",background:canSubmit?"linear-gradient(135deg,rgba(201,169,110,0.22),rgba(201,169,110,0.06))":"transparent",border:`1px solid ${canSubmit?"rgba(201,169,110,0.45)":"rgba(255,248,232,0.1)"}`,color:canSubmit?"#FFF8E8":"rgba(255,248,232,0.25)",padding:"14px 0",borderRadius:"16px",cursor:canSubmit?"pointer":"default",fontSize:"0.9rem",fontFamily:SERIF,fontWeight:600,fontStyle:"italic",letterSpacing:"0.06em",transition:"all 0.3s"}}>
                    {authBusy?"One moment...":(emailSignupMode?"Create my account":"Log in")}
                  </button>);})()}
                  <button onClick={()=>{setEmailSignupMode(m=>!m);setAuthError("");setAuthEmail2("");setAuthPassword2("");}} style={{marginTop:"14px",background:"transparent",border:"none",cursor:"pointer",color:"rgba(255,248,232,0.5)",fontFamily:SERIF,fontStyle:"italic",fontSize:"0.78rem",letterSpacing:"0.04em"}}>
                    {emailSignupMode?"Already have an account? Log in":"New here? Create an account"}
                  </button>
                  {!emailSignupMode&&(
                    <button onClick={()=>handlePasswordReset(authEmail)} style={{marginTop:"8px",background:"transparent",border:"none",cursor:"pointer",color:"rgba(201,169,110,0.75)",fontFamily:SANS,fontSize:"0.74rem",letterSpacing:"0.03em",textDecoration:"underline",textUnderlineOffset:"3px"}}>
                      Forgot password? Email me a reset link
                    </button>
                  )}
                  <button onClick={()=>{setAuthMode("choose");setAuthError("");}} style={{marginTop:"12px",background:"transparent",border:"none",cursor:"pointer",color:"rgba(255,248,232,0.3)",fontFamily:SERIF,fontStyle:"italic",fontSize:"0.76rem",letterSpacing:"0.05em"}}>
                    Back
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 1: Door — username ── */}
        {onboardStep===1&&(
          <div style={{position:"absolute",inset:0}}>
            <DoorBg/>
            <div style={{position:"absolute",bottom:0,left:0,right:0,zIndex:3,display:"flex",flexDirection:"column",alignItems:"center",padding:"0 28px 48px"}}>
              <div className="fu" style={{width:"100%",maxWidth:"420px",display:"flex",flexDirection:"column",alignItems:"center"}}>
                <p style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"clamp(0.88rem,3vw,1.05rem)",color:"rgba(255,248,232,0.55)",margin:"0 0 10px",textAlign:"center",letterSpacing:"0.04em",lineHeight:1.6}}>
                  What shall we call you here?
                </p>
                <div style={{width:"100%",position:"relative",marginBottom:"8px"}}>
                  <input value={setupUsername} onChange={e=>{const v=e.target.value.replace(/[^a-zA-Z0-9_]/g,"").slice(0,20);setSetupUsername(v);setUsernameError("");setUsernameAvailable(false);}} onBlur={()=>{if(setupUsername.length>=3){if(!user){setUsernameAvailable(true);return;}validateUsername(setupUsername,user?.uid);}}} autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="your name here..." style={{width:"100%",boxSizing:"border-box",background:"transparent",border:"none",borderBottom:`1px solid ${usernameError?"rgba(220,100,100,0.5)":usernameAvailable?"rgba(100,180,100,0.5)":"rgba(201,169,110,0.35)"}`,padding:"10px 36px 10px 4px",color:"#FFF8E8",fontFamily:SERIF,fontStyle:"italic",fontSize:"clamp(1.2rem,5vw,1.6rem)",outline:"none",textAlign:"center",letterSpacing:"0.06em",transition:"border-color 0.3s, box-shadow 0.4s",boxShadow:setupUsername.length>=3?"0 2px 12px rgba(201,169,110,0.12)":"none"}}/>
                  <div style={{position:"absolute",right:4,top:"50%",transform:"translateY(-50%)"}}>
                    {usernameChecking&&<span style={{color:"rgba(255,248,232,0.3)",fontSize:"0.75rem",fontFamily:SANS}}>...</span>}
                    {usernameAvailable&&!usernameChecking&&<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(100,180,100,0.8)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
                    {usernameError&&!usernameChecking&&<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(220,100,100,0.6)" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>}
                  </div>
                </div>
                {usernameError&&<p style={{fontFamily:SANS,fontSize:"0.7rem",color:"rgba(220,120,120,0.75)",margin:"4px 0 0",textAlign:"center"}}>{usernameError}</p>}
                {!usernameError&&<p style={{fontFamily:SANS,fontSize:"0.62rem",color:"rgba(255,248,232,0.2)",margin:"4px 0 0",textAlign:"center",letterSpacing:"0.04em"}}>Letters, numbers, and underscores</p>}
                <p style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.68rem",color:"rgba(255,248,232,0.15)",margin:"8px 0 0",textAlign:"center",letterSpacing:"0.03em"}}>This name will be seen in the community</p>
                <button onClick={()=>setMarketingConsent(c=>!c)} style={{marginTop:"22px",width:"100%",display:"flex",alignItems:"flex-start",gap:"10px",background:"transparent",border:"none",cursor:"pointer",textAlign:"left",padding:0}}>
                  <span style={{flexShrink:0,width:"20px",height:"20px",marginTop:"1px",borderRadius:"5px",border:`1.5px solid ${marketingConsent?"rgba(201,169,110,0.8)":"rgba(255,248,232,0.3)"}`,background:marketingConsent?"rgba(201,169,110,0.22)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s"}}>
                    {marketingConsent&&<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FFF8E8" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                  </span>
                  <span style={{fontFamily:SANS,fontSize:"0.72rem",color:"rgba(255,248,232,0.5)",lineHeight:1.5,letterSpacing:"0.02em"}}>Email me about new videos, blog posts, music &amp; merch <span style={{color:"rgba(255,248,232,0.3)"}}>(optional — unsubscribe anytime)</span></span>
                </button>
                <button onClick={()=>{if(step1Ok)setOnboardStep(2);}} disabled={!step1Ok} className={step1Ok?"door-btn":""} style={{marginTop:"28px",background:step1Ok?"linear-gradient(135deg,rgba(201,169,110,0.22),rgba(201,169,110,0.06))":"transparent",border:`1px solid ${step1Ok?"rgba(201,169,110,0.45)":"rgba(255,248,232,0.08)"}`,borderRadius:"28px",padding:"13px 44px",cursor:step1Ok?"pointer":"default",color:step1Ok?"#FFF8E8":"rgba(255,248,232,0.2)",fontFamily:SERIF,fontStyle:"italic",fontWeight:600,fontSize:"0.88rem",letterSpacing:"0.1em",transition:"all 0.3s"}}>
                  Continue
                </button>
                <button onClick={()=>setOnboardStep(0)} style={{marginTop:"14px",background:"transparent",border:"none",cursor:"pointer",color:"rgba(255,248,232,0.22)",fontFamily:SERIF,fontStyle:"italic",fontSize:"0.78rem",letterSpacing:"0.06em",transition:"color 0.2s"}} onMouseEnter={e=>e.target.style.color="rgba(255,248,232,0.45)"} onMouseLeave={e=>e.target.style.color="rgba(255,248,232,0.22)"}>
                  Back
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: Door — gender ── */}
        {onboardStep===2&&(
          <div style={{position:"absolute",inset:0}}>
            <DoorBg/>
            <div style={{position:"absolute",bottom:0,left:0,right:0,zIndex:3,display:"flex",flexDirection:"column",alignItems:"center",padding:"0 28px 52px"}}>
              <div className="fu" style={{width:"100%",maxWidth:"380px",display:"flex",flexDirection:"column",alignItems:"center"}}>
                <p style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"clamp(0.88rem,3vw,1.05rem)",color:"rgba(255,248,232,0.55)",margin:"0 0 20px",textAlign:"center",letterSpacing:"0.04em",lineHeight:1.6}}>
                  Are you a Daughter of God or a Son of God?
                </p>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"14px",width:"100%"}}>
                  {[["female","Daughter of God"],["male","Son of God"]].map(([val,label])=>(
                    <button key={val} onClick={()=>{
                      setSetupGender(val);
                      const app={base:val,outfit:"default"};
                      setPlayerAppearance(app);dbSave("irj-appearance",app);
                      // After gender → save profile if signed in, then door zoom
                      setTimeout(()=>{
                        if(user) completeProfileSetup(user.uid);
                        else{try{localStorage.setItem("irj-localProfile",JSON.stringify({username:setupUsername,gender:val}));}catch(e){}}
                        setOnboardStep(3);
                      },600);
                    }} style={{background:setupGender===val?"linear-gradient(135deg,rgba(201,169,110,0.18),rgba(201,169,110,0.06))":"rgba(255,248,232,0.04)",border:`1.5px solid ${setupGender===val?"rgba(201,169,110,0.55)":"rgba(255,248,232,0.12)"}`,borderRadius:"16px",padding:"22px 16px",cursor:"pointer",transition:"all 0.25s ease",boxShadow:setupGender===val?"0 0 22px rgba(201,169,110,0.18),inset 0 0 10px rgba(201,169,110,0.04)":"none"}}>
                      <span style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"1rem",color:setupGender===val?"#FFF8E8":"rgba(255,248,232,0.45)",transition:"color 0.25s",letterSpacing:"0.04em"}}>{label}</span>
                    </button>
                  ))}
                </div>
                <button onClick={()=>setOnboardStep(1)} style={{marginTop:"20px",background:"transparent",border:"none",cursor:"pointer",color:"rgba(255,248,232,0.22)",fontFamily:SERIF,fontStyle:"italic",fontSize:"0.78rem",letterSpacing:"0.06em",transition:"color 0.2s"}} onMouseEnter={e=>e.target.style.color="rgba(255,248,232,0.45)"} onMouseLeave={e=>e.target.style.color="rgba(255,248,232,0.22)"}>
                  Back
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3: Door zoom open + Welcome ── */}
        {onboardStep===3&&(
          <div onClick={()=>{setIsOnboarded(true);dbSave("irj-onboarded",true);fadeOutAmbient();setScreen("cabin");}} style={{position:"absolute",inset:0,cursor:"pointer"}}>
            {/* Door zooming open */}
            <img src="/door.webp" alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",objectPosition:"center center",animation:"doorEnterZoom 2s ease-out forwards",filter:"brightness(1.2)"}}/>
            {/* Warm golden flood */}
            <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at center,rgba(255,200,80,0.15) 0%,rgba(255,180,60,0.06) 50%,transparent 100%)",animation:"doorEnterFade 1.5s 0.5s ease both",opacity:0}}/>
            {/* Welcome text over the zoom */}
            <div style={{position:"absolute",inset:0,zIndex:10,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"12px",animation:"fadeUp .4s .2s ease both",opacity:0}}>
                <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"4px"}}>
                  <div style={{width:"40px",height:"1px",background:"linear-gradient(90deg,transparent,rgba(201,169,110,0.5))"}}/>
                  <div style={{width:"5px",height:"5px",borderRadius:"50%",background:"rgba(201,169,110,0.4)"}}/>
                  <div style={{width:"40px",height:"1px",background:"linear-gradient(90deg,rgba(201,169,110,0.5),transparent)"}}/>
                </div>
                <h1 style={{fontFamily:DISPLAY,fontSize:"clamp(2rem,8vw,3.2rem)",fontWeight:700,color:"#FFF8E8",margin:0,textAlign:"center",textShadow:"0 2px 24px rgba(0,0,0,0.7),0 0 60px rgba(201,169,110,0.15)",letterSpacing:"0.04em",lineHeight:1.2}}>
                  Welcome, {setupUsername||"friend"}.
                </h1>
                <p style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"clamp(0.9rem,3vw,1.1rem)",color:"rgba(255,248,232,0.5)",margin:0,textAlign:"center",maxWidth:"320px",lineHeight:1.65,letterSpacing:"0.03em",animation:"fadeUp .4s .3s ease both",opacity:0}}>
                  Your journal is waiting.
                </p>
                <p style={{fontFamily:SANS,fontSize:"0.64rem",color:"rgba(255,248,232,0.18)",margin:"16px 0 0",letterSpacing:"0.08em",animation:"fadeUp .4s .5s ease both",opacity:0}}>
                  Tap anywhere to enter
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }


  /* ══ CABIN (Private Interior — Immersive Hub) ══════ */
  if(screen==="cabin") return(<>
    <CabinScreen
      spaceTransit={spaceTransit} transitDir={transitDir}
      transitionToMap={transitionToMap} transitionToKitchen={transitionToKitchen}
      transitionToRooftop={transitionToRooftop} transitionToJournal={transitionToJournal}
      transitionToCozyCreations={transitionToCozyCreations} openScripture={openScripture}
      reopenBookChooser={reopenBookChooser}
      cabinMode={cabinMode} cabin3DReady={cabin3DReady}
      debugHotspots={debugHotspots} debugTripleTap={debugTripleTap}
      bookOpen={bookOpen} setBookOpen={setBookOpen} deskBook={deskBook}
      shelfAnim={shelfAnim} bookPage={bookPage} flipDir={flipDir}
      bookText={bookText} setBookText={setBookText}
      bookSaveMsg={bookSaveMsg} setBookSaveMsg={setBookSaveMsg}
      journalSection={journalSection} setJournalSection={setJournalSection}
      journalZoom={journalZoom}
      selectShelfBook={selectShelfBook} flipPage={flipPage}
      bookTouchStart={bookTouchStart} bookTouchEnd={bookTouchEnd}
      TOTAL_BOOK_PAGES={TOTAL_BOOK_PAGES}
      windowPanel={windowPanel} setWindowPanel={setWindowPanel}
      showInsights={showInsights} setShowInsights={setShowInsights}
      streak={streak} showStreak={showStreak} candleReward={candleReward}
      candles={candles} bank={bank} tapCandle={tapCandle} addCandles={addCandles}
      entries={entries} totalWords={totalWords} themeData={themeData} roomProg={roomProg}
      ownedItems={ownedItems} toast={toast} user={user}
      handleSignOut={handleSignOut} prayerPosts={prayerPosts}
      enterRoom={enterRoom} persistEntries={persistEntries}
      renderSectionHistory={renderSectionHistory}
      savePrayerJournalEntry={savePrayerJournalEntry} saveBookEntry={saveBookEntry}
      setFlipDir={setFlipDir} setBookPage={setBookPage}
      setHistoryMode={setHistoryMode} historyMode={historyMode}
      jesusIdx={jesusIdx} setScreen={setScreen} setJourneyTab={setJourneyTab}
      setCardQ={setCardQ} setIsCustomCard={setIsCustomCard} setCardCustom={setCardCustom}
      menuOpen={menuOpen} setMenuOpen={setMenuOpen}
      BottomMenuDrawer={BottomMenuDrawer} goToHistory={goToHistory}
      playerRoom={playerRoom}
      onRoomChange={(next)=>{setPlayerRoom(next);dbSave("irj-room",next);if(user&&db){try{setDoc(doc(db,"userProfiles",user.uid),{room:next},{merge:true});}catch(e){}}}}
      inventory={inventory} addToInventory={addToInventory} removeFromInventory={removeFromInventory}
      playerAppearance={playerAppearance}
      transitionToPorch={transitionToPorch}
    />
  </>);


  /* ══ PORCH BLOG (atmospheric landing: door=step inside, book=read blog) ══ */
  if(screen==="porch") return(<>
    <PorchBlogScreen
      onEnter={()=>{ if(user){ transitionToCabin(); } else { signupSourceRef.current="blog"; setAuthError(""); setAuthMode("choose"); setEmailSignupMode(true); setOnboardStep(0); setScreen("profile-onboard"); } }}
      onOpenBoard={()=>setScreen("blog-board")}
    />
  </>);
  if(screen==="blog-board") return(<>
    <BlogBoardScreen
      user={user}
      onBack={()=>setScreen("porch")}
      onOpenPost={(p)=>{setSelectedBlogPost(p);setScreen("blog-post");}}
      onWrite={()=>{setEditingBlogPost(null);setScreen("write-blog");}}
      onJoin={(mode)=>{signupSourceRef.current="blog";setAuthError("");setAuthMode(mode==="login"?"email":"choose");setEmailSignupMode(mode!=="login");setOnboardStep(0);setScreen("profile-onboard");}}
    />
  </>);
  if(screen==="blog-post") return(<>
    <BlogPostScreen
      post={selectedBlogPost}
      user={user}
      onBack={()=>setScreen("blog-board")}
      onEdit={(p)=>{setEditingBlogPost(p);setScreen("write-blog");}}
      onDeleted={()=>{setSelectedBlogPost(null);setScreen("blog-board");}}
    />
  </>);
  if(screen==="write-blog") return(<>
    <WriteBlogScreen
      user={user}
      editingPost={editingBlogPost}
      onBack={()=>setScreen("blog-board")}
      onDone={()=>{setEditingBlogPost(null);setScreen("blog-board");}}
    />
  </>);


  /* ══ ROOFTOP LOUNGE (above cabin via spiral staircase) ══ */
  if(screen==="rooftop-lounge") return(<>
    <RooftopLoungeScreen
      spaceTransit={spaceTransit} transitDir={transitDir}
      transitionToCabin={transitionToCabin} transitionToGarden={transitionToGarden}
      skipClimb={prevScreenRef.current==="rooftop-garden"}
      candles={candles} bank={bank}
      playerAppearance={playerAppearance}
    />
  </>);


  /* ══ ROOFTOP GARDEN (stone terrace with waterfall view) ══ */
  if(screen==="rooftop-garden") return(<>
    <RooftopGardenScreen
      spaceTransit={spaceTransit} transitDir={transitDir}
      transitionToRooftop={transitionToRooftop}
      candles={candles} bank={bank}
      playerAppearance={playerAppearance}
      gardenGrid={gardenGrid} setGardenGrid={setGardenGrid}
      inventory={inventory} setInventory={(updater)=>{
        setInventory(prev=>{
          const next=typeof updater==='function'?updater(prev):{...prev,...updater};
          dbSave("irj-inventory",next);
          // Check rabbit unlock after inventory change (harvest)
          if(!unlocks.rabbitUnlocked&&canUnlockRabbit(next)){
            setUnlocks("rabbitUnlocked",true);
          }
          return next;
        });
      }}
      unlocks={unlocks}
    />
  </>);


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
          {/* ── Premium Plus Prompt ── */}
          {hasPremium&&journalStep>=1&&(
            <div className="fu" style={{marginBottom:"22px"}}>
              <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"10px"}}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={t.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <span style={{fontSize:"0.64rem",fontFamily:SANS,fontWeight:600,letterSpacing:"0.14em",color:t.sub,textTransform:"uppercase",opacity:.7}}>Plus prompt</span>
              </div>
              <p style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"1.08rem",color:t.text,margin:"0 0 8px",lineHeight:1.55}}>{PREMIUM_PROMPTS[activeDay%PREMIUM_PROMPTS.length].q}</p>
              <p style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.82rem",color:t.sub,margin:0,lineHeight:1.5,opacity:.7}}>{PREMIUM_PROMPTS[activeDay%PREMIUM_PROMPTS.length].hint}</p>
            </div>
          )}
          {!hasPremium&&journalStep>=1&&(
            <div onClick={()=>{setPrevScreen(screen);setScreen("upgrade");}} style={{marginBottom:22,padding:"14px 18px",background:"rgba(201,169,110,0.04)",border:"1px dashed rgba(201,169,110,0.15)",borderRadius:12,cursor:"pointer",textAlign:"center",transition:"all 0.2s"}}>
              <div style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.78rem",color:"rgba(201,169,110,0.35)",lineHeight:1.5}}>Unlock deeper prompts with Inner Room Plus</div>
            </div>
          )}
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
        <BottomMenuDrawer/>
      </div>
    );
  }

  /* ══ DIAMOND ART STUDIO ═══════════════════════════ */
  if(screen==="diamond-art"){
    return(
      <DiamondArtScreen
        onBack={()=>setScreen(prevScreen||"cabin")}
        diamondArt={diamondArt}
        setDiamondArt={setDiamondArt}
        artGallery={artGallery}
        setArtGallery={setArtGallery}
        inventory={inventory}
        setInventory={(next)=>{setInventory(next);dbSave("irj-inventory",next);}}
        importedTemplates={importedTemplates}
        setImportedTemplates={setImportedTemplates}
      />
    );
  }

  /* ══ COLORING ═════════════════════════════════════ */
  if(screen==="coloring"){
    return(
      <ColoringScreen
        onBack={()=>setScreen(prevScreen||"cozy-creations")}
        coloring={coloring}
        setColoring={setColoring}
      />
    );
  }

  /* ══ LEAKY BUCKET (Episode 1) ════════════════════ */
  if(screen==="leaky-bucket"){
    return(
      <LeakyBucketScreen onBack={()=>setScreen("cabin")} reflections={leakyBucket} setReflections={setLeakyBucket} />
    );
  }

  /* ══ WORD SEARCH ══════════════════════════════════ */
  if(screen==="word-search"){
    return(
      <WordSearchScreen
        onBack={()=>setScreen(prevScreen||"cabin")}
        progress={wordSearch}
        onProgressChange={setWordSearch}
      />
    );
  }

  /* ══ HIDDEN OBJECT ════════════════════════════════ */
  if(screen==="hidden-object"){
    return(
      <HiddenObjectScreen
        onBack={()=>setScreen(prevScreen||"cabin")}
        progress={hiddenObject}
        onProgressChange={setHiddenObject}
      />
    );
  }

  /* ══ TRYING TO CONCEIVE MEDITATIONS ════════════════ */
  if(screen==="conceive-meditations"){
    return(
      <PregnancyMeditationScreen
        onBack={()=>setScreen(prevScreen||"cabin")}
        progress={conceiveMeditations}
        onProgressChange={setConceiveMeditations}
        onOpenScripture={openScriptureRef}
        variant="conceive"
      />
    );
  }

  /* ══ PREGNANCY MEDITATIONS ═════════════════════════ */
  if(screen==="pregnancy-meditations"){
    return(
      <PregnancyMeditationScreen
        onBack={()=>setScreen(prevScreen||"cabin")}
        progress={pregnancyMeditations}
        onProgressChange={setPregnancyMeditations}
        onOpenScripture={openScriptureRef}
        variant="mother"
      />
    );
  }

  /* ══ FATHER'S MEDITATIONS ══════════════════════════ */
  if(screen==="father-meditations"){
    return(
      <PregnancyMeditationScreen
        onBack={()=>setScreen(prevScreen||"cabin")}
        progress={fatherMeditations}
        onProgressChange={setFatherMeditations}
        onOpenScripture={openScriptureRef}
        variant="father"
      />
    );
  }

  /* ══ CONCEPTION TRACKER ═══════════════════════════ */
  if(screen==="fertility-tracker"){
    return(
      <FertilityTrackerScreen
        onBack={()=>setScreen(prevScreen||"cabin")}
        fertility={fertility}
        onFertilityChange={setFertility}
      />
    );
  }

  /* ══ JESUS ROOM ═══════════════════════════════════ */
  if(screen==="jesus"){
    const t=th("jesus"),jq=JESUS_QUESTIONS[Math.min(jesusIdx,JESUS_QUESTIONS.length-1)]||JESUS_QUESTIONS[0];
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
        <BottomMenuDrawer/>
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
      <BottomMenuDrawer/>
    </div>
  );

  /* ══ THE UPPER ROOM HALL (Community) ═══════════════ */
  if(screen==="hall"||screen==="community") return(
    <div style={{position:"fixed",inset:0,overflow:"hidden",fontFamily:SANS}}>
      <style>{GFONTS}{CSS}</style>
      {/* BG fallback */}
      <div style={{position:"absolute",inset:0,background:"linear-gradient(160deg,#1A1208 0%,#2C1F14 40%,#1A1208 100%)",zIndex:0}}/>
      {/* BG image */}
      <div style={{position:"absolute",inset:0,backgroundImage:"url(/upper-room-hall.webp)",backgroundSize:"cover",backgroundPosition:"center top",zIndex:1}}/>
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
          <div style={{textAlign:"center",marginBottom:32,animation:"fadeUp .3s ease both"}}>
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
            {/* Prayer wall tabs: My Prayers / Community */}
            <div style={{display:"flex",gap:0,marginBottom:14,borderRadius:10,overflow:"hidden",border:"1px solid rgba(201,169,110,0.12)"}}>
              {[["mine","My Prayers"],["community","Community"]].map(([k,label])=>(
                <button key={k} onClick={()=>{setPrayerWallTab(k);if(k==="community") loadCommunityPrayers();}} style={{flex:1,padding:"9px 0",background:prayerWallTab===k?"rgba(201,169,110,0.1)":"rgba(26,22,18,0.5)",border:"none",color:prayerWallTab===k?B.goldL:"rgba(255,248,232,0.35)",fontSize:"0.74rem",fontFamily:SANS,fontWeight:600,cursor:"pointer",transition:"all 0.2s"}}>{label}</button>
              ))}
            </div>

            {/* ── MY PRAYERS TAB ── */}
            {prayerWallTab==="mine"&&<>
              <div style={{background:"rgba(26,22,18,0.6)",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",border:"1px solid rgba(201,169,110,0.1)",borderRadius:12,padding:18,marginBottom:14}}>
                <textarea value={newPrayer} onChange={e=>setNewPrayer(e.target.value)} placeholder="Share what's on your heart…" style={{width:"100%",background:"rgba(255,248,232,0.04)",border:"1px solid rgba(201,169,110,0.1)",borderRadius:8,color:B.goldL,fontSize:"0.88rem",fontFamily:SERIF,padding:13,minHeight:70,boxSizing:"border-box",marginBottom:9,lineHeight:1.7,transition:"border-color 0.2s",resize:"vertical"}} onFocus={e=>e.target.style.borderColor="rgba(201,169,110,0.3)"} onBlur={e=>e.target.style.borderColor="rgba(201,169,110,0.1)"}/>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  <select value={prayerTag} onChange={e=>setPrayerTag(e.target.value)} style={{background:"rgba(255,248,232,0.04)",border:"1px solid rgba(201,169,110,0.1)",borderRadius:7,color:"rgba(255,248,232,0.5)",fontSize:"0.8rem",fontFamily:SANS,padding:"7px 11px",flex:1,minWidth:120}}>
                    <option value="">Tag a topic…</option>
                    {["Healing","Marriage","Singleness","Motherhood","Grief","Anxiety","Finances","Purpose","Forgiveness","Depression","Faith","Career"].map(t=><option key={t}>{t}</option>)}
                  </select>
                  <button onClick={postPrayer} disabled={!newPrayer.trim()} style={{background:newPrayer.trim()?"rgba(90,138,106,0.3)":"transparent",border:`1px solid ${newPrayer.trim()?"rgba(90,138,106,0.4)":"rgba(255,255,255,0.06)"}`,color:newPrayer.trim()?"#BED3C4":"rgba(255,255,255,0.2)",padding:"8px 20px",borderRadius:7,cursor:newPrayer.trim()?"pointer":"default",fontSize:"0.8rem",fontFamily:SANS,fontWeight:600,transition:"all 0.2s"}}>Post</button>
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
                      {p.status==="answered"&&<span style={{fontSize:"0.58rem",background:"rgba(201,169,110,0.15)",color:B.gold,padding:"2px 8px",borderRadius:99,fontFamily:SANS,fontWeight:600}}>Answered</span>}
                      <span style={{fontSize:"0.66rem",color:"rgba(255,248,232,0.25)",fontFamily:SANS,marginLeft:"auto"}}>{p.date}</span>
                    </div>
                    <p style={{fontFamily:SERIF,fontSize:"0.92rem",color:"rgba(255,248,232,0.7)",margin:"0 0 10px",lineHeight:1.65}}>{p.text}</p>
                    <div style={{display:"flex",gap:8,alignItems:"center"}}>
                      {prayedFor.includes(p.id)?(<span style={{background:"rgba(90,138,106,0.08)",border:"1px solid rgba(90,138,106,0.15)",color:"rgba(190,211,196,0.5)",padding:"5px 14px",borderRadius:7,fontSize:"0.74rem",fontFamily:SANS,fontWeight:600}}>Praying ({p.prayers})</span>):(<button onClick={()=>prayFor(p.id)} style={{background:"rgba(90,138,106,0.15)",border:"1px solid rgba(90,138,106,0.25)",color:"#BED3C4",padding:"5px 14px",borderRadius:7,cursor:"pointer",fontSize:"0.74rem",fontFamily:SANS,fontWeight:600,transition:"all 0.15s"}} onMouseEnter={e=>e.target.style.background="rgba(90,138,106,0.3)"} onMouseLeave={e=>e.target.style.background="rgba(90,138,106,0.15)"}>Pray ({p.prayers})</button>)}
                      {p.status==="answered"?
                        <button onClick={()=>reactivatePrayer(p.id)} style={{background:"transparent",border:"1px solid rgba(201,169,110,0.15)",color:"rgba(255,248,232,0.35)",padding:"5px 12px",borderRadius:7,cursor:"pointer",fontSize:"0.72rem",fontFamily:SANS,fontWeight:600}}>Reactivate</button>
                      :
                        <button onClick={()=>markPrayerAnswered(p.id)} style={{background:"rgba(201,169,110,0.1)",border:"1px solid rgba(201,169,110,0.2)",color:B.gold,padding:"5px 12px",borderRadius:7,cursor:"pointer",fontSize:"0.72rem",fontFamily:SANS,fontWeight:600,transition:"all 0.15s"}} onMouseEnter={e=>e.target.style.background="rgba(201,169,110,0.2)"} onMouseLeave={e=>e.target.style.background="rgba(201,169,110,0.1)"}>Answered</button>
                      }
                      {/* Bell icon — reminder toggle */}
                      <button onClick={()=>setReminderPanel(prev=>prev?.id===p.id?null:{id:p.id,time:p.reminder?.time||"09:00",frequency:p.reminder?.frequency||"daily",days:p.reminder?.days||[1,2,3,4,5]})} title="Set reminder" style={{marginLeft:"auto",background:p.reminder?.enabled?"rgba(201,169,110,0.15)":"transparent",border:"1px solid "+(p.reminder?.enabled?"rgba(201,169,110,0.35)":"rgba(201,169,110,0.12)"),borderRadius:7,padding:"4px 8px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s"}}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={p.reminder?.enabled?"rgba(201,169,110,0.9)":"rgba(255,248,232,0.35)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>{p.reminder?.enabled&&<circle cx="18" cy="5" r="3" fill="rgba(201,169,110,0.9)" stroke="none"/>}</svg>
                      </button>
                    </div>
                    {/* ── Reminder Panel (inline) ── */}
                    {reminderPanel?.id===p.id&&(()=>{
                      const rp=reminderPanel;
                      return (
                        <div style={{marginTop:10,background:"rgba(26,22,18,0.7)",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",border:"1px solid rgba(201,169,110,0.15)",borderRadius:10,padding:14}}>
                          {notifPermission!=='granted'&&(
                            <div style={{marginBottom:10,padding:"8px 12px",background:"rgba(201,169,110,0.06)",border:"1px solid rgba(201,169,110,0.12)",borderRadius:8,display:"flex",alignItems:"center",gap:10}}>
                              <span style={{fontSize:"0.76rem",fontFamily:SANS,color:"rgba(255,248,232,0.5)",flex:1}}>Notifications are {notifPermission==='denied'?'blocked':'not enabled'}</span>
                              {notifPermission!=='denied'&&<button onClick={requestNotifPermission} style={{background:"rgba(201,169,110,0.15)",border:"1px solid rgba(201,169,110,0.3)",borderRadius:7,padding:"5px 12px",cursor:"pointer",color:B.gold,fontSize:"0.72rem",fontFamily:SANS,fontWeight:600}}>Enable</button>}
                            </div>
                          )}
                          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                            <span style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.82rem",color:"rgba(255,248,232,0.6)"}}>Reminder</span>
                            <div style={{flex:1}}/>
                            <button onClick={()=>{toggleReminder(p.id,{enabled:!(p.reminder?.enabled),time:rp.time,frequency:rp.frequency,days:rp.days,lastNotified:p.reminder?.lastNotified||null},true);}} style={{background:p.reminder?.enabled?"rgba(90,138,106,0.25)":"rgba(255,248,232,0.04)",border:"1px solid "+(p.reminder?.enabled?"rgba(90,138,106,0.4)":"rgba(201,169,110,0.1)"),borderRadius:99,padding:"3px 14px",cursor:"pointer",color:p.reminder?.enabled?"#BED3C4":"rgba(255,248,232,0.35)",fontSize:"0.7rem",fontFamily:SANS,fontWeight:600,transition:"all 0.15s"}}>{p.reminder?.enabled?"On":"Off"}</button>
                          </div>
                          <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:10}}>
                            <div style={{flex:1,minWidth:100}}>
                              <label style={{fontSize:"0.66rem",fontFamily:SANS,color:"rgba(255,248,232,0.35)",display:"block",marginBottom:4}}>Time</label>
                              <input type="time" value={rp.time} onChange={e=>setReminderPanel(prev=>({...prev,time:e.target.value}))} style={{background:"rgba(255,248,232,0.04)",border:"1px solid rgba(201,169,110,0.12)",borderRadius:7,color:B.goldL,fontSize:"0.82rem",fontFamily:SANS,padding:"6px 10px",width:"100%",boxSizing:"border-box",colorScheme:"dark"}}/>
                            </div>
                            <div style={{flex:1,minWidth:100}}>
                              <label style={{fontSize:"0.66rem",fontFamily:SANS,color:"rgba(255,248,232,0.35)",display:"block",marginBottom:4}}>Frequency</label>
                              <select value={rp.frequency} onChange={e=>setReminderPanel(prev=>({...prev,frequency:e.target.value}))} style={{background:"rgba(255,248,232,0.04)",border:"1px solid rgba(201,169,110,0.12)",borderRadius:7,color:B.goldL,fontSize:"0.82rem",fontFamily:SANS,padding:"6px 10px",width:"100%",boxSizing:"border-box"}}>
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="once">Once</option>
                              </select>
                            </div>
                          </div>
                          {rp.frequency==='weekly'&&(
                            <div style={{marginBottom:10}}>
                              <label style={{fontSize:"0.66rem",fontFamily:SANS,color:"rgba(255,248,232,0.35)",display:"block",marginBottom:5}}>Days</label>
                              <div style={{display:"flex",gap:4}}>
                                {["S","M","T","W","T","F","S"].map((d,i)=>(
                                  <button key={i} onClick={()=>setReminderPanel(prev=>{const s=new Set(prev.days||[]);s.has(i)?s.delete(i):s.add(i);return{...prev,days:[...s]};})} style={{width:28,height:28,borderRadius:"50%",border:"1px solid "+(rp.days?.includes(i)?"rgba(201,169,110,0.4)":"rgba(201,169,110,0.1)"),background:rp.days?.includes(i)?"rgba(201,169,110,0.15)":"transparent",color:rp.days?.includes(i)?B.gold:"rgba(255,248,232,0.3)",fontSize:"0.68rem",fontFamily:SANS,fontWeight:600,cursor:"pointer",padding:0,display:"flex",alignItems:"center",justifyContent:"center"}}>{d}</button>
                                ))}
                              </div>
                            </div>
                          )}
                          <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
                            {p.reminder&&<button onClick={()=>removeReminder(p.id)} style={{background:"transparent",border:"1px solid rgba(255,100,100,0.2)",borderRadius:7,padding:"5px 12px",cursor:"pointer",color:"rgba(255,150,150,0.6)",fontSize:"0.7rem",fontFamily:SANS,fontWeight:600}}>Remove</button>}
                            <button onClick={()=>toggleReminder(p.id,{enabled:true,time:rp.time,frequency:rp.frequency,days:rp.days,lastNotified:p.reminder?.lastNotified||null})} style={{background:"rgba(90,138,106,0.2)",border:"1px solid rgba(90,138,106,0.35)",borderRadius:7,padding:"5px 16px",cursor:"pointer",color:"#BED3C4",fontSize:"0.72rem",fontFamily:SANS,fontWeight:600,transition:"all 0.15s"}}>Save</button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ))}
              </div>
            </>}

            {/* ── COMMUNITY PRAYERS TAB ── */}
            {prayerWallTab==="community"&&<>
              {!user&&<div style={{background:"rgba(26,22,18,0.6)",border:"1px solid rgba(201,169,110,0.1)",borderRadius:12,padding:24,textAlign:"center"}}>
                <p style={{fontFamily:SERIF,fontStyle:"italic",color:"rgba(255,248,232,0.5)",fontSize:"0.9rem",margin:0}}>Sign in to see community prayers</p>
              </div>}
              {user&&<>
                {/* Post a community prayer */}
                <div style={{background:"rgba(26,22,18,0.6)",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",border:"1px solid rgba(201,169,110,0.1)",borderRadius:12,padding:18,marginBottom:14}}>
                  <textarea value={newPrayer} onChange={e=>setNewPrayer(e.target.value)} placeholder="Share a prayer request with the community…" style={{width:"100%",background:"rgba(255,248,232,0.04)",border:"1px solid rgba(201,169,110,0.1)",borderRadius:8,color:B.goldL,fontSize:"0.88rem",fontFamily:SERIF,padding:13,minHeight:60,boxSizing:"border-box",marginBottom:9,lineHeight:1.7,transition:"border-color 0.2s",resize:"vertical"}} onFocus={e=>e.target.style.borderColor="rgba(201,169,110,0.3)"} onBlur={e=>e.target.style.borderColor="rgba(201,169,110,0.1)"}/>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    <select value={prayerTag} onChange={e=>setPrayerTag(e.target.value)} style={{background:"rgba(255,248,232,0.04)",border:"1px solid rgba(201,169,110,0.1)",borderRadius:7,color:"rgba(255,248,232,0.5)",fontSize:"0.8rem",fontFamily:SANS,padding:"7px 11px",flex:1,minWidth:120}}>
                      <option value="">Tag a topic…</option>
                      {["Healing","Marriage","Singleness","Motherhood","Grief","Anxiety","Finances","Purpose","Forgiveness","Depression","Faith","Career"].map(t=><option key={t}>{t}</option>)}
                    </select>
                    <button onClick={postCommunityPrayer} disabled={!newPrayer.trim()||communityLoading} style={{background:newPrayer.trim()?"rgba(90,138,106,0.3)":"transparent",border:`1px solid ${newPrayer.trim()?"rgba(90,138,106,0.4)":"rgba(255,255,255,0.06)"}`,color:newPrayer.trim()?"#BED3C4":"rgba(255,255,255,0.2)",padding:"8px 20px",borderRadius:7,cursor:newPrayer.trim()?"pointer":"default",fontSize:"0.8rem",fontFamily:SANS,fontWeight:600,transition:"all 0.2s"}}>{communityLoading?"Posting...":"Share prayer"}</button>
                  </div>
                </div>
                {/* Refresh button */}
                <div style={{display:"flex",justifyContent:"flex-end",marginBottom:10}}>
                  <button onClick={loadCommunityPrayers} disabled={communityLoading} style={{background:"rgba(201,169,110,0.08)",border:"1px solid rgba(201,169,110,0.15)",borderRadius:8,padding:"4px 12px",cursor:"pointer",color:B.gold,fontSize:"0.68rem",fontFamily:SANS,fontWeight:600}}>{communityLoading?"Loading...":"Refresh"}</button>
                </div>
                {communityPrayers.length===0&&!communityLoading&&<div style={{textAlign:"center",padding:"20px 0"}}>
                  <p style={{fontFamily:SERIF,fontStyle:"italic",color:"rgba(255,248,232,0.35)",fontSize:"0.88rem",margin:0}}>No community prayers yet. Be the first to share.</p>
                </div>}
                <div style={{display:"flex",flexDirection:"column",gap:9}}>
                  {communityPrayers.map((cp,idx)=>(
                    <PostCard key={cp.id}
                      post={cp} idx={idx} user={user}
                      prayed={prayedPostIds.has(cp.id)}
                      commentsOpen={expandedComments===cp.id}
                      comments={postComments[cp.id]||[]}
                      commentText={expandedComments===cp.id?commentText:""}
                      commentLoading={commentLoading}
                      onTogglePray={()=>togglePrayForPost(cp.id)}
                      onToggleComments={()=>{
                        if(expandedComments===cp.id){setExpandedComments(null);}
                        else{setExpandedComments(cp.id);setCommentText("");if(!postComments[cp.id])loadComments(cp.id);}
                      }}
                      onCommentTextChange={setCommentText}
                      onSubmitComment={()=>submitComment(cp.id)}
                      onAuthorTap={viewProfile}
                    />
                  ))}
                </div>
              </>}
            </>}
          </div>

          {/* ── FIND FARMERS / VISIT FARMS ── */}
          <div style={{marginBottom:32}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
              <div style={{width:18,height:1,background:"rgba(201,169,110,0.25)"}}/>
              <span style={{fontSize:"0.65rem",fontFamily:SANS,fontWeight:600,letterSpacing:"0.14em",color:B.gold,textTransform:"uppercase"}}>Visit Farms</span>
              <div style={{flex:1,height:1,background:"rgba(201,169,110,0.12)"}}/>
            </div>
            {!user&&<div style={{background:"rgba(26,22,18,0.5)",border:"1px solid rgba(201,169,110,0.08)",borderRadius:12,padding:24,textAlign:"center"}}>
              <p style={{fontFamily:SERIF,fontStyle:"italic",color:"rgba(255,248,232,0.35)",fontSize:"0.88rem",margin:0}}>Sign in to visit other farms</p>
            </div>}
            {user&&<>
              <div style={{display:"flex",gap:8,marginBottom:14}}>
                <input value={farmerSearch} onChange={e=>setFarmerSearch(e.target.value)} placeholder="Search farmers..." style={{flex:1,background:"rgba(255,248,232,0.04)",border:"1px solid rgba(201,169,110,0.12)",borderRadius:8,color:B.goldL,fontSize:"0.82rem",fontFamily:SANS,padding:"9px 12px",boxSizing:"border-box"}} onKeyDown={e=>{if(e.key==="Enter") searchFarmers(farmerSearch);}}/>
                <button onClick={()=>searchFarmers(farmerSearch)} disabled={communityLoading} style={{background:"rgba(201,169,110,0.1)",border:"1px solid rgba(201,169,110,0.2)",borderRadius:8,padding:"8px 16px",cursor:"pointer",color:B.gold,fontSize:"0.78rem",fontFamily:SANS,fontWeight:600}}>{communityLoading?"...":"Search"}</button>
              </div>
              {farmerResults.length===0&&<div style={{background:"rgba(26,22,18,0.5)",border:"1px solid rgba(201,169,110,0.08)",borderRadius:12,padding:20,textAlign:"center"}}>
                <p style={{fontFamily:SERIF,fontStyle:"italic",color:"rgba(255,248,232,0.3)",fontSize:"0.84rem",margin:"0 0 6px"}}>Search for other farmers or browse random farms</p>
                <button onClick={()=>searchFarmers("")} style={{background:"rgba(201,169,110,0.08)",border:"1px solid rgba(201,169,110,0.15)",borderRadius:8,padding:"6px 16px",cursor:"pointer",color:B.gold,fontSize:"0.72rem",fontFamily:SANS,fontWeight:600,marginTop:6}}>Browse farms</button>
              </div>}
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {farmerResults.map(farmer=>(
                  <div key={farmer.id} style={{background:"rgba(26,22,18,0.5)",backdropFilter:"blur(6px)",WebkitBackdropFilter:"blur(6px)",border:"1px solid rgba(201,169,110,0.08)",borderRadius:12,padding:"14px 16px",display:"flex",alignItems:"center",gap:12}}>
                    <div style={{width:36,height:36,borderRadius:"50%",background:"rgba(201,169,110,0.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1rem",flexShrink:0}}>{farmer.username?farmer.username[0].toUpperCase():"?"}</div>
                    <div style={{flex:1,cursor:"pointer"}} onClick={()=>viewProfile(farmer.id)}>
                      <div style={{fontFamily:SERIF,fontSize:"0.9rem",color:B.goldL,fontWeight:500}}>{farmer.username||"Anonymous"}</div>
                      <div style={{fontFamily:SANS,fontSize:"0.68rem",color:"rgba(255,248,232,0.3)"}}>{farmer.publishedFarm?.length||0} plots</div>
                    </div>
                    <button onClick={()=>viewProfile(farmer.id)} style={{background:"rgba(201,169,110,0.08)",border:"1px solid rgba(201,169,110,0.15)",borderRadius:8,padding:"7px 12px",cursor:"pointer",color:B.gold,fontSize:"0.74rem",fontFamily:SANS,fontWeight:600,transition:"all 0.15s"}} onMouseEnter={e=>e.target.style.background="rgba(201,169,110,0.18)"} onMouseLeave={e=>e.target.style.background="rgba(201,169,110,0.08)"}>Profile</button>
                    <button onClick={()=>visitFarm(farmer.id)} style={{background:"rgba(90,138,106,0.15)",border:"1px solid rgba(90,138,106,0.25)",borderRadius:8,padding:"7px 12px",cursor:"pointer",color:"#BED3C4",fontSize:"0.74rem",fontFamily:SANS,fontWeight:600,transition:"all 0.15s"}} onMouseEnter={e=>e.target.style.background="rgba(90,138,106,0.3)"} onMouseLeave={e=>e.target.style.background="rgba(90,138,106,0.15)"}>Farm</button>
                  </div>
                ))}
              </div>
            </>}
          </div>
        </div>
      </div>

      {/* Transition overlay */}
      {spaceTransit&&<div style={{position:"fixed",inset:0,zIndex:9999,background:"#0A0806",display:"flex",alignItems:"center",justifyContent:"center",animation:"spaceFadeIn .5s ease"}}>
        <div style={{textAlign:"center",animation:"fadeUp .6s .15s ease both"}}>
          <div style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"1.05rem",color:"rgba(255,248,232,0.5)",letterSpacing:"0.04em"}}>{transitDir==="toCabin"?"Returning to the cabin...":"Stepping into The Upper Room..."}</div>
        </div>
      </div>}
      <BottomMenuDrawer/>
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
      <BottomMenuDrawer/>
    </div>
  );}

  /* ══ WORLD MAP — Tile-based Overworld ═══════════════════ */
  if(screen==="map"){
    const handleEnterLocation=(dest)=>{
      setSpaceTransit(true);
      setTransitDir("fromMap");
      // Set garden mode before transitioning
      if(dest==="garden"){setGardenMode("prayers");setSelectedPlot(null);}
      if(dest==="farm"){setGardenMode("farm");setSelectedPlot(null);}

      // Cabin interior interactions (interact: prefix)
      if(dest==="interact:journal"){
        setTimeout(()=>{setScreen("cabin");setBookOpen(true);setJournalSection("blank");setSpaceTransit(false);setTransitDir(null);},700);
        return;
      }
      if(dest==="interact:bookshelf"){
        setTimeout(()=>{setScreen("cabin");setBookOpen(true);setSpaceTransit(false);setTransitDir(null);},700);
        return;
      }
      if(dest==="interact:fireplace"){
        setTimeout(()=>{setScreen("cabin");setWindowPanel("left");setSpaceTransit(false);setTransitDir(null);},700);
        return;
      }
      // Upper Room interactions
      if(dest==="interact:prayer-wall"){
        setTimeout(()=>{setUpperRoomView("prayer");setScreen("upper-room");setSpaceTransit(false);setTransitDir(null);},700);
        return;
      }
      if(dest==="interact:bible"){
        setTimeout(()=>{setUpperRoomView("bible");setScreen("upper-room");setSpaceTransit(false);setTransitDir(null);},700);
        return;
      }
      if(dest==="interact:feed"){
        setTimeout(()=>{setUpperRoomView("feed");setScreen("upper-room");setSpaceTransit(false);setTransitDir(null);},700);
        return;
      }
      // Market interactions
      if(dest==="interact:harvest"){
        setTimeout(()=>{setMarketStall("harvest");setScreen("market");setSpaceTransit(false);setTransitDir(null);},700);
        return;
      }
      if(dest==="interact:general"){
        setTimeout(()=>{setShopStall("general");setScreen("market");setSpaceTransit(false);setTransitDir(null);},700);
        return;
      }
      if(dest==="interact:barter"){
        setTimeout(()=>{setShopStall("barter");setScreen("market");setSpaceTransit(false);setTransitDir(null);},700);
        return;
      }
      // Aquarium — placeholder
      if(dest==="interact:aquarium"){
        setTimeout(()=>{setToast({msg:"The fish are swimming peacefully."});setSpaceTransit(false);setTransitDir(null);},700);
        return;
      }
      // Front door view — placeholder
      if(dest==="interact:front-door-view"){
        setTimeout(()=>{setToast({msg:"The moonlight filters through the glass."});setSpaceTransit(false);setTransitDir(null);},700);
        return;
      }

      setTimeout(()=>{
        // Farm uses the garden screen with gardenMode="farm"
        setScreen(dest==="farm"?"garden":dest);
        setSpaceTransit(false);setTransitDir(null);
      },700);
    };
    return(
      <div style={{position:"fixed",inset:0,overflow:"hidden",fontFamily:SANS}}>
        <style>{GFONTS}{CSS}</style>
        <OverworldScreen
          onEnterLocation={handleEnterLocation}
          playerPos={overworldPos}
          onPosChange={(x,y)=>setOverworldPos({x,y})}
          spriteConfig={resolveSprite(playerAppearance)}
        />
        {spaceTransit&&<div style={{position:"fixed",inset:0,zIndex:9999,background:"#0A0806",animation:"spaceFadeIn .6s ease both",pointerEvents:"all"}}/>}
      </div>
    );
  }

  /* ══ MAP 2 — second map area (placeholder until artwork is added) ═══ */
  if(screen==="map2"){
    return(
      <div style={{position:"fixed",inset:0,overflow:"hidden",fontFamily:SANS,background:"#0A0806"}}>
        <style>{GFONTS}{CSS}</style>

        {/* Atmospheric dark background with subtle vignette */}
        <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 50% 40%, rgba(26,22,18,0.6) 0%, #0A0806 70%)"}}/>

        {/* Content */}
        <div style={{position:"relative",zIndex:10,height:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>

          {/* Back arrow — top-left */}
          <button onClick={()=>{setSpaceTransit(true);setTransitDir("fromMap");setTimeout(()=>{setScreen("map");setSpaceTransit(false);setTransitDir(null);},700);}} style={{
            position:"absolute",top:28,left:20,
            background:"rgba(26,22,18,0.7)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",
            border:"1px solid rgba(201,169,110,0.2)",borderRadius:999,
            padding:"9px 18px 9px 14px",cursor:"pointer",
            color:"rgba(255,240,200,0.7)",fontFamily:SANS,fontSize:"0.82rem",
            display:"flex",alignItems:"center",gap:6,
            transition:"all 0.2s",zIndex:20,
            animation:"fadeUp .3s ease both"
          }}>
            <span style={{fontSize:"1.1em",lineHeight:1}}>&#10094;</span> Back to map
          </button>

          {/* Placeholder content */}
          <div style={{textAlign:"center",padding:"0 32px",animation:"fadeUp .8s .2s ease both",opacity:0}}>
            <div style={{fontSize:"2.4rem",marginBottom:16,opacity:0.25}}>&#9968;</div>
            <h2 style={{fontFamily:DISPLAY,fontSize:"1.5rem",fontWeight:700,color:"rgba(255,240,200,0.7)",margin:"0 0 12px",letterSpacing:"0.02em"}}>
              New Lands Ahead
            </h2>
            <p style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.92rem",color:"rgba(255,240,200,0.35)",margin:0,maxWidth:320,lineHeight:1.6}}>
              This area is being prepared. A new map will appear here soon.
            </p>
          </div>

        </div>

        {spaceTransit&&<div style={{position:"fixed",inset:0,zIndex:9999,background:"#0A0806",animation:"spaceFadeIn .6s ease both",pointerEvents:"all"}}/>}
        <BottomMenuDrawer/>
      </div>
    );
  }

  /* ══ FEED — social feed of posts from followed users ═══════════════ */
  /* ══ BODY & MIND CHECK-IN ═════════════════════════════════════════ */
  if(screen==="check-in"){
    // Load today's entries as an array
    const todayKey=new Date().toISOString().slice(0,10);
    let todayEntries=[];
    try{
      const raw=localStorage.getItem("irj-checkins-"+todayKey);
      if(raw) todayEntries=JSON.parse(raw)||[];
    }catch(e){}
    return(
      <CheckInScreen
        onBack={()=>setScreen("cabin")}
        onViewHistory={()=>setScreen("check-in-history")}
        todayEntries={todayEntries}
        editEntry={editEntryRef.current}
        clearEditEntry={()=>{editEntryRef.current=null;}}
        onSave={(data)=>{
          try{
            const key="irj-checkins-"+data.date;
            const arr=JSON.parse(localStorage.getItem(key)||"[]");
            const idx=arr.findIndex(e=>e&&e.id===data.id);
            if(idx>=0) arr[idx]=data; else arr.push(data);
            localStorage.setItem(key,JSON.stringify(arr.slice(-20)));
          }catch(e){}
          try{
            if(user&&db){
              const ref=doc(db,"users",user.uid);
              setDoc(ref,{["checkin_"+data.id]:data},{merge:true}).catch(()=>{});
            }
          }catch(e){}
        }}
        onPrayWith={(text)=>{setNewPrayer(text||"");setPrayerWallTab("mine");setScreen("cabin");setToast({msg:"Prayer started from your check-in"});}}
        lastCheckinDate={(()=>{try{const hist=Object.keys(localStorage).filter(k=>k.startsWith("irj-checkins-")).map(k=>k.replace("irj-checkins-","")).sort();return hist.length?hist[hist.length-1]:null;}catch(e){return null;}})()}
        onCheckinComplete={(intensityLabel)=>{
          // Candle reward based on intensity
          const rewards={light:3,moderate:5,heavy:8};
          const amt=rewards[intensityLabel]||3;
          const msgs={light:"A quiet light",moderate:"Steady flame",heavy:"Even in the weight, light grows"};
          addCandles(amt,msgs[intensityLabel]||"Light");
          // Track intensity for dove companion
          setLastCheckinIntensity(intensityLabel);
          // Mission tracking
          trackMission("daily_checkin");trackMission("weekly_checkin_3");
          // Room decor — unlock candle on first check-in
          if(!isOwned("candle",inventory,playerRoom)){
            const next=placeItem(playerRoom,"candle");
            setPlayerRoom(next);dbSave("irj-room",next);
            if(user&&db){try{setDoc(doc(db,"userProfiles",user.uid),{room:next},{merge:true});}catch(e){}}
            setTimeout(()=>setToast({msg:"Something new has been placed in your room."}),1800);
          }
          // Garden growth — water the newest growing plant
          setGardenPlots(prev=>{
            const growing=prev.filter(pl=>pl.stage!=="empty"&&pl.plantedAt);
            if(!growing.length) return prev;
            const newest=growing.sort((a,b)=>b.plantedAt-a.plantedAt)[0];
            const boost=intensityLabel==="heavy"?2:1;
            const next=prev.map(pl=>pl.id===newest.id?{...pl,prayerCount:(pl.prayerCount||0)+boost}:pl);
            dbSave("irj-garden",next);
            return next;
          });
        }}
      />
    );
  }

  /* ══ CHECK-IN CALENDAR / HISTORY ══════════════════════════════════ */
  if(screen==="check-in-history") return(<>
    <CheckInCalendar onBack={()=>setScreen("cabin")} onEditEntry={(entry)=>{editEntryRef.current=entry;setScreen("check-in");}}/>
  </>);

  /* ══ GATHERINGS — Upper Room anonymous community ═════════════════ */
  if(screen==="gatherings"){
    if(!gatheringSpaceCounts._loaded&&db){loadSpaceCounts().then(c=>{c._loaded=true;setGatheringSpaceCounts(c);});loadRecentGatheringPosts();}
    // Load saved posts from localStorage IDs
    const savedPostIds=(()=>{try{return JSON.parse(localStorage.getItem("irj-saved-posts")||"[]");}catch(e){return [];}})();
    const savedPostData=gatheringRecentPosts.filter(p=>savedPostIds.includes(p.id));
    return(
      <UpperRoomGatherings
        onBack={()=>setScreen("upper-room")}
        spaceCounts={gatheringSpaceCounts}
        recentPosts={gatheringRecentPosts}
        savedPosts={savedPostData}
        onOpenSpace={(spaceId)=>{setActiveGatheringSpace(spaceId);loadGatheringPosts(spaceId);setScreen("gathering-feed");}}
        onSearch={(q)=>{setGatheringSearchQuery(q);searchGatherings(q);setScreen("gathering-search");}}
        onOpenPost={(post)=>{setActivePost(post);setActiveGatheringSpace(post.spaceId);loadPostAndReplies(post.id);setGatheringReplyText("");setScreen("gathering-post");}}
      />
    );
  }

  if(screen==="gathering-feed"&&activeGatheringSpace) return(
    <GatheringFeed
      spaceId={activeGatheringSpace}
      posts={gatheringPosts}
      loading={gatheringLoading}
      onBack={()=>{setScreen("gatherings");setGatheringPosts([]);}}
      onOpenPost={(postId)=>{loadPostAndReplies(postId);setGatheringReplyText("");setScreen("gathering-post");}}
      onCreatePost={()=>{if(!user){setToast({msg:"Sign in to post"});return;}setScreen("create-gathering-post");}}
    />
  );

  if(screen==="gathering-post"&&activePost) return(
    <GatheringPost
      post={activePost}
      replies={postReplies}
      loading={postRepliesLoading}
      userReaction={gatheringUserReaction}
      replyText={gatheringReplyText}
      setReplyText={setGatheringReplyText}
      replySubmitting={gatheringReplySubmitting}
      anonName={user?generateAnonName(user.uid):"Anonymous"}
      onBack={()=>{setScreen("gathering-feed");setActivePost(null);setPostReplies([]);}}
      onReact={(type)=>{if(!user){setToast({msg:"Sign in to react"});return;}reactToGatheringPost(type);}}
      onReply={(parentId)=>{if(!user){setToast({msg:"Sign in to reply"});return;}submitGatheringReply(parentId);}}
      onReport={reportGatheringContent}
    />
  );

  if(screen==="gathering-search") return(
    <UpperRoomSearch
      initialQuery={gatheringSearchQuery}
      results={gatheringSearchResults}
      loading={gatheringSearchLoading}
      onBack={()=>{setScreen("gatherings");setGatheringSearchResults(null);}}
      onSearch={searchGatherings}
      onOpenPost={(post)=>{setActivePost(post);setActiveGatheringSpace(post.spaceId);loadPostAndReplies(post.id);setGatheringReplyText("");setScreen("gathering-post");}}
      onOpenSpace={(spaceId)=>{setActiveGatheringSpace(spaceId);loadGatheringPosts(spaceId);setScreen("gathering-feed");}}
    />
  );

  if(screen==="create-gathering-post"&&user) return(
    <CreateGatheringPost
      spaceId={activeGatheringSpace}
      anonName={generateAnonName(user.uid)}
      onBack={()=>setScreen(activeGatheringSpace?"gathering-feed":"gatherings")}
      onSubmit={createGatheringPost}
    />
  );

  if(screen==="feed") return(
    <FeedScreen
      user={user} db={db} functions={functions}
      setScreen={setScreen} prevScreen={prevScreen}
      setToast={setToast} addCandles={addCandles}
      viewProfile={viewProfile}
      trackMission={trackMission}
    />
  );

  /* ══ PROFILE — view user profile + follow ═══════════════════════════ */
  if(screen==="profile"&&profileUserId) return(
    <ProfileScreen
      user={user}
      db={db}
      functions={functions}
      profileUserId={profileUserId}
      setScreen={setScreen}
      prevScreen={prevScreen}
      setToast={setToast}
    />
  );

  /* ══ NOTIFICATIONS ═══════════════════════════════════════════════════ */
  if(screen==="notifications") return(
    <NotificationsScreen
      user={user} db={db} functions={functions}
      setScreen={setScreen} prevScreen={prevScreen}
      setToast={setToast} viewProfile={viewProfile}
    />
  );

  /* ══ VISIT FARM — read-only view of another player's farm ═══════════ */
  if(screen==="visit-farm"&&visitingFarm){
    const vfPlots=visitingFarm.publishedFarm||[];
    const vfGetStage=(plot)=>{
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
    };
    const vfGetEmoji=(plot)=>{
      if(plot.stage==="empty") return "";
      const plant=FARM_PLANTS.find(p=>p.id===plot.plantType);
      if(!plant) return "...";
      const stage=vfGetStage(plot);
      const idx=GROWTH_STAGES.indexOf(stage);
      return plant.stageEmojis[Math.max(0,idx)]||plant.emoji;
    };
    return(
      <div style={{position:"fixed",inset:0,overflow:"hidden",fontFamily:SANS}}>
        <style>{GFONTS}{CSS}</style>
        <ImmersiveGarden/>
        <div style={{position:"relative",zIndex:10,height:"100%",overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
          <div style={{maxWidth:720,margin:"0 auto",padding:"28px 22px 80px"}}>
            {/* Back button */}
            <button onClick={()=>{setVisitingFarm(null);setScreen("hall");}} style={{background:"rgba(12,22,8,0.55)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",border:"1px solid rgba(90,138,106,0.15)",borderRadius:999,padding:"8px 20px",cursor:"pointer",color:"rgba(190,211,196,0.6)",fontFamily:SANS,fontSize:"0.78rem",marginBottom:28,transition:"all 0.2s",display:"inline-flex",alignItems:"center",gap:6,animation:"fadeUp .3s ease both"}}>
              Back to hall
            </button>
            {/* Title */}
            <div style={{textAlign:"center",marginBottom:28,animation:"fadeUp .3s ease both",opacity:0}}>
              <h1 style={{fontFamily:DISPLAY,fontSize:"1.6rem",fontWeight:700,color:"rgba(190,211,196,0.9)",margin:"0 0 8px",textShadow:"0 2px 12px rgba(0,0,0,0.5)"}}>Visiting {visitingFarm.username||"Anonymous"}'s Farm</h1>
              <p style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.88rem",color:"rgba(190,211,196,0.4)",margin:0}}>A peaceful walk through their garden</p>
            </div>
            {/* Farm grid */}
            {vfPlots.length===0?
              <div style={{textAlign:"center",padding:"40px 0"}}>
                <p style={{fontFamily:SERIF,fontStyle:"italic",color:"rgba(190,211,196,0.35)",fontSize:"0.92rem"}}>This farmer hasn't published their farm yet.</p>
              </div>
            :
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
                {vfPlots.map((plot,i)=>{
                  const stage=vfGetStage(plot);
                  const emoji=vfGetEmoji(plot);
                  const plant=FARM_PLANTS.find(p=>p.id===plot.plantType);
                  const isEmpty=stage==="empty";
                  return(
                    <div key={plot.id||i} style={{background:isEmpty?"rgba(12,22,8,0.4)":"rgba(22,36,18,0.55)",backdropFilter:"blur(6px)",WebkitBackdropFilter:"blur(6px)",border:`1px solid ${isEmpty?"rgba(90,138,106,0.08)":"rgba(90,138,106,0.18)"}`,borderRadius:14,padding:"16px 10px",textAlign:"center",animation:`fadeUp .4s ${0.1+i*0.05}s ease both`,opacity:0}}>
                      {isEmpty?
                        <div style={{fontSize:"1.4rem",opacity:0.2,marginBottom:4}}>.</div>
                      :<>
                        <div style={{fontSize:"1.8rem",marginBottom:6}}>{emoji}</div>
                        <div style={{fontFamily:SERIF,fontSize:"0.72rem",color:"rgba(190,211,196,0.6)",marginBottom:2}}>{plant?.name||plot.plantType}</div>
                        <div style={{fontFamily:SANS,fontSize:"0.62rem",color:"rgba(190,211,196,0.3)",textTransform:"capitalize"}}>{stage}</div>
                      </>}
                    </div>
                  );
                })}
              </div>
            }
          </div>
        </div>
        <BottomMenuDrawer/>
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
      const bonus=(plot.prayerCount||0)*PRAYER_BONUS_MINS;
      let total=0;
      for(let i=0;i<plant.growthBase.length;i++) total+=Math.max(0.5,plant.growthBase[i]-bonus);
      return Math.min(100,Math.round((elapsed/total)*100));
    };
    const getActiveStage=(plot)=>isFarmMode?getFarmComputedStage(plot):getComputedStage(plot);
    const getActiveEmoji=(plot)=>isFarmMode?getFarmPlantEmoji(plot):getPlantEmoji(plot);
    const growingCount=activePlots.filter(p=>p.stage!=="empty"&&getActiveStage(p)!=="harvestable").length;
    const readyCount=activePlots.filter(p=>p.stage!=="empty"&&getActiveStage(p)==="harvestable").length;
    const animalsHungry=animals.filter(a=>getAnimalProduceStatus(a)==="hungry").length;
    const animalsReady=animals.filter(a=>getAnimalProduceStatus(a)==="ready").length;

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

        {/* ═══ ANIMAL PEN — only in farm mode ═══ */}
        {isFarmMode&&(()=>{
          const filledSlots=animals.map((animal,idx)=>{
            const pos=ANIMAL_PEN_POSITIONS[idx];
            if(!pos) return null;
            const type=ANIMAL_TYPES.find(t=>t.id===animal.typeId);
            if(!type) return null;
            const status=getAnimalProduceStatus(animal);
            const isReady=status==="ready";
            const isHungry=status==="hungry";
            return(
              <button key={animal.id} className="animal-slot" onClick={()=>{
                if(isReady) collectAnimalProduce(animal.id);
                else if(isHungry) feedAnimal(animal.id);
                else setAnimalModal(animal.id);
              }} style={{
                position:"absolute",left:pos.left,top:pos.top,
                width:`min(${pos.size},${pos.maxSize})`,height:`min(${pos.size},${pos.maxSize})`,
                transform:"translate(-50%,-50%)",
                borderRadius:"50%",border:isHungry?"2px dashed rgba(255,200,60,0.3)":isReady?"2px solid rgba(255,200,60,0.5)":"2px solid rgba(90,138,106,0.2)",
                cursor:"pointer",zIndex:11,padding:0,
                background:isReady?"rgba(255,200,60,0.08)":isHungry?"rgba(80,60,30,0.2)":"rgba(90,138,106,0.06)",
                boxShadow:isReady?"0 0 16px rgba(255,200,60,0.3)":"none",
                display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:0,
                overflow:"visible",
              }}>
                {isReady&&<span style={{position:"absolute",top:"-10px",fontSize:"clamp(0.55rem,1.5vw,0.75rem)",animation:"produceFloat 2s ease-in-out infinite",filter:"drop-shadow(0 1px 3px rgba(0,0,0,0.5))"}}>
                  {ITEM_CATALOG[type.product]?.emoji||"📦"}
                </span>}
                <span style={{fontSize:"clamp(0.8rem,2.2vw,1.3rem)",lineHeight:1,animation:"animalBob 3.5s ease-in-out infinite"}}>{type.emoji}</span>
                <span style={{fontSize:"clamp(0.35rem,0.85vw,0.45rem)",fontFamily:SANS,fontWeight:600,lineHeight:1,marginTop:1,
                  color:isReady?"#FFE880":isHungry?"rgba(255,200,60,0.6)":"rgba(190,211,196,0.4)",
                  textShadow:"0 1px 3px rgba(0,0,0,0.8)",
                }}>{isReady?"Collect":isHungry?"Feed":getAnimalTimeRemaining(animal)}</span>
              </button>
            );
          });
          // Empty "+" slots
          const emptySlots=[];
          for(let i=animals.length;i<MAX_ANIMALS;i++){
            const pos=ANIMAL_PEN_POSITIONS[i];
            if(!pos) break;
            if(i>animals.length) break; // only show 1 empty slot
            emptySlots.push(
              <button key={`empty-${i}`} className="animal-slot" onClick={()=>setAnimalModal("buy")} style={{
                position:"absolute",left:pos.left,top:pos.top,
                width:`min(${pos.size},${pos.maxSize})`,height:`min(${pos.size},${pos.maxSize})`,
                transform:"translate(-50%,-50%)",
                borderRadius:"50%",border:"2px dashed rgba(190,211,196,0.12)",
                cursor:"pointer",zIndex:11,padding:0,
                background:"rgba(80,60,30,0.15)",
                display:"flex",alignItems:"center",justifyContent:"center",
              }}>
                <span style={{fontSize:"clamp(0.6rem,1.5vw,0.9rem)",color:"rgba(220,200,160,0.35)",animation:"emptyPlotPulse 3.5s ease-in-out infinite"}}>+</span>
              </button>
            );
          }
          return <>{filledSlots}{emptySlots}</>;
        })()}

        {/* ═══ ANIMAL BUY MODAL ═══ */}
        {animalModal==="buy"&&<div style={{position:"fixed",inset:0,zIndex:300}}>
          <div onClick={()=>setAnimalModal(null)} style={{position:"absolute",inset:0,background:"rgba(6,8,4,0.7)",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",animation:"spaceFadeIn .2s ease"}}/>
          <div style={{position:"absolute",bottom:0,left:0,right:0,maxHeight:"75vh",background:"rgba(18,22,14,0.97)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",border:"1px solid rgba(90,138,106,0.2)",borderRadius:"20px 20px 0 0",padding:"24px 20px 32px",animation:"panelSlideUp .35s cubic-bezier(.22,1,.36,1) both",overflowY:"auto"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
              <div style={{fontFamily:DISPLAY,fontSize:"1rem",fontWeight:700,color:"#BED3C4"}}>Buy an Animal</div>
              <button onClick={()=>setAnimalModal(null)} style={{background:"none",border:"none",color:"rgba(190,211,196,0.3)",fontSize:"0.9rem",cursor:"pointer"}}>✕</button>
            </div>
            <p style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.75rem",color:"rgba(190,211,196,0.4)",marginBottom:16}}>Feed them to produce goods. {animals.length}/{MAX_ANIMALS} slots used.</p>
            <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10}}>
              {[...ANIMAL_TYPES,...PREMIUM_ANIMALS].map(type=>{
                const isLocked=type.premium&&!hasPremium;
                const canAfford=bank.coins>=type.buyCost;
                const atMax=animals.length>=MAX_ANIMALS;
                const disabled=!canAfford||atMax||isLocked;
                return(
                  <button key={type.id} onClick={()=>{if(!disabled)buyAnimal(type.id);}} style={{position:"relative",background:disabled?"rgba(255,255,255,0.02)":"rgba(90,138,106,0.06)",border:`1px solid ${disabled?"rgba(190,211,196,0.06)":"rgba(90,138,106,0.2)"}`,borderRadius:14,padding:"14px 10px",cursor:disabled?"default":"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:5,transition:"all .15s",opacity:disabled?0.4:1}}>
                    <span style={{fontSize:"1.5rem"}}>{type.emoji}</span>
                    <span style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.78rem",color:"rgba(190,211,196,0.8)"}}>{type.name}</span>
                    <span style={{fontFamily:SANS,fontSize:"0.6rem",color:"rgba(190,211,196,0.45)"}}>Produces {ITEM_CATALOG[type.product]?.emoji||""} {ITEM_CATALOG[type.product]?.name||type.product}</span>
                    <span style={{fontFamily:SANS,fontSize:"0.58rem",color:"rgba(190,211,196,0.35)"}}>Every {type.durationLabel}</span>
                    <span style={{fontFamily:SANS,fontSize:"0.68rem",fontWeight:600,color:canAfford?B.goldL:"rgba(190,211,196,0.25)"}}>🪙 {type.buyCost}</span>
                    {isLocked&&<PremiumLock compact/>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>}

        {/* ═══ ANIMAL DETAIL MODAL ═══ */}
        {animalModal&&animalModal!=="buy"&&(()=>{
          const animal=animals.find(a=>a.id===animalModal);
          if(!animal) return null;
          const type=ANIMAL_TYPES.find(t=>t.id===animal.typeId);
          if(!type) return null;
          const status=getAnimalProduceStatus(animal);
          return(
            <div style={{position:"fixed",inset:0,zIndex:300}}>
              <div onClick={()=>setAnimalModal(null)} style={{position:"absolute",inset:0,background:"rgba(6,8,4,0.5)",backdropFilter:"blur(6px)",WebkitBackdropFilter:"blur(6px)"}}/>
              <div onClick={e=>e.stopPropagation()} style={{position:"absolute",bottom:"18%",left:"50%",transform:"translateX(-50%)",width:"min(82vw,300px)",background:"rgba(18,22,14,0.94)",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",border:"1px solid rgba(90,138,106,0.25)",borderRadius:18,padding:"20px 18px",animation:"fadeUp .3s ease both",boxShadow:"0 8px 32px rgba(0,0,0,0.5)"}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                  <span style={{fontSize:"1.8rem"}}>{type.emoji}</span>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:DISPLAY,fontSize:"0.95rem",fontWeight:700,color:"#BED3C4"}}>{type.name}</div>
                    <div style={{fontFamily:SANS,fontSize:"0.68rem",color:"rgba(190,211,196,0.5)"}}>
                      Produces {ITEM_CATALOG[type.product]?.name||type.product} every {type.durationLabel}
                    </div>
                  </div>
                  <button onClick={()=>setAnimalModal(null)} style={{background:"none",border:"none",color:"rgba(190,211,196,0.3)",fontSize:"1rem",cursor:"pointer",padding:4}}>✕</button>
                </div>
                <div style={{fontFamily:SANS,fontSize:"0.75rem",color:status==="ready"?"#FFE880":status==="hungry"?"rgba(255,200,60,0.7)":"rgba(190,211,196,0.5)",marginBottom:12}}>
                  {status==="ready"?"Product ready to collect!":status==="hungry"?"Needs feeding":"Producing... "+getAnimalTimeRemaining(animal)}
                </div>
                {status==="hungry"&&<button onClick={()=>{feedAnimal(animal.id);setAnimalModal(null);}} style={{width:"100%",background:"rgba(90,138,106,0.2)",border:"1px solid rgba(90,138,106,0.35)",borderRadius:10,padding:"10px",fontSize:"0.78rem",fontFamily:SANS,fontWeight:600,color:"#BED3C4",cursor:"pointer"}}>🌾 Feed (1 feed)</button>}
                {status==="ready"&&<button onClick={()=>{collectAnimalProduce(animal.id);setAnimalModal(null);}} style={{width:"100%",background:"rgba(255,200,60,0.15)",border:"1px solid rgba(255,200,60,0.3)",borderRadius:10,padding:"10px",fontSize:"0.78rem",fontFamily:SANS,fontWeight:600,color:"#FFE880",cursor:"pointer"}}>{ITEM_CATALOG[type.product]?.emoji||"📦"} Collect {ITEM_CATALOG[type.product]?.name||type.product}</button>}
              </div>
            </div>
          );
        })()}

        {/* ═══ DOOR — back to map (glowing archway at top center) ═══ */}
        <button onClick={()=>{setScreen("map");setGardenTab("garden");setSelectedPlot(null);}} style={{position:"absolute",left:"35%",top:"6%",width:"30%",height:"16%",zIndex:12,background:"transparent",border:"none",cursor:"pointer",borderRadius:"50% 50% 8px 8px",animation:"gardenDoorGlow 3s ease-in-out infinite"}}>
          <div style={{position:"absolute",bottom:"8%",left:"50%",transform:"translateX(-50%)",display:"flex",alignItems:"center",gap:4,background:"rgba(10,8,6,0.55)",backdropFilter:"blur(6px)",WebkitBackdropFilter:"blur(6px)",borderRadius:10,padding:"4px 10px",whiteSpace:"nowrap",pointerEvents:"none"}}>
            <span style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.5rem",color:"rgba(255,248,232,0.55)",letterSpacing:"0.02em"}}>Back to village</span>
          </div>
        </button>

        {/* ═══ TOP HUD — mode toggle + currency + garden status ═══ */}
        {/* Farm / Prayers tab toggle */}
        <div style={{position:"absolute",top:"3%",left:"50%",transform:"translateX(-50%)",zIndex:22,display:"flex",background:"rgba(10,8,6,0.7)",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",border:"1px solid rgba(190,211,196,0.12)",borderRadius:12,overflow:"hidden",animation:"fadeUp .25s ease both"}}>
          {[{id:"farm",label:"Farm"},{id:"prayers",label:"Prayers"}].map(tab=>(
            <button key={tab.id} onClick={()=>{setGardenMode(tab.id);setSelectedPlot(null);setPlantModal(null);}} style={{background:gardenMode===tab.id?"rgba(90,138,106,0.25)":"transparent",border:"none",padding:"6px 16px",cursor:"pointer",fontFamily:SERIF,fontStyle:"italic",fontSize:"0.72rem",fontWeight:gardenMode===tab.id?600:400,color:gardenMode===tab.id?"#BED3C4":"rgba(190,211,196,0.4)",transition:"all .15s"}}>{tab.label}</button>
          ))}
        </div>

        <div style={{position:"absolute",left:"3%",top:"3%",zIndex:20,display:"flex",alignItems:"center",gap:8,animation:"fadeUp .3s ease both"}}>
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
          {isFarmMode&&animalsReady>0&&<div style={{background:"rgba(10,8,6,0.65)",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",border:"1px solid rgba(255,200,60,0.2)",borderRadius:10,padding:"5px 10px",display:"flex",alignItems:"center",gap:4}}>
            <span style={{fontSize:"0.65rem"}}>🐔</span>
            <span style={{fontFamily:SANS,fontSize:"0.68rem",fontWeight:600,color:"#FFE880"}}>{animalsReady} ready</span>
          </div>}
          {isFarmMode&&animalsHungry>0&&<div style={{background:"rgba(10,8,6,0.55)",backdropFilter:"blur(6px)",WebkitBackdropFilter:"blur(6px)",border:"1px solid rgba(255,200,60,0.12)",borderRadius:10,padding:"5px 10px",display:"flex",alignItems:"center",gap:4}}>
            <span style={{fontSize:"0.65rem"}}>🌾</span>
            <span style={{fontFamily:SANS,fontSize:"0.68rem",color:"rgba(255,200,60,0.5)"}}>{animalsHungry} hungry</span>
          </div>}
        </div>

        {/* ═══ BOTTOM FLOATING BUTTONS — Inventory & Crafting ═══ */}
        <div style={{position:"absolute",bottom:"12%",left:"50%",transform:"translateX(-50%)",zIndex:20,display:"flex",gap:10,animation:"fadeUp .8s .3s ease both"}}>
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
                  🙏 {(prayer.text||"").slice(0,120)}{(prayer.text||"").length>120?"…":""}
                </div>}
                {prayer?.status==="answered"&&<div style={{marginTop:8,fontFamily:SANS,fontSize:"0.72rem",fontWeight:600,color:"#9AB8A4"}}>✦ Prayer answered — in full bloom</div>}
                {!isFarmMode&&<div style={{marginTop:8,fontFamily:SANS,fontSize:"0.65rem",color:"rgba(190,211,196,0.3)"}}>Prayers offered: {plot.prayerCount||0}</div>}
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
                  {[...FARM_PLANTS,...PREMIUM_FARM_PLANTS].map(plant=>{
                    const isLocked=plant.premium&&!hasPremium;
                    const seedCount=inventory[plant.seedItem]||0;
                    const hasSeed=seedCount>0;
                    return(
                      <button key={plant.id} onClick={()=>{if(!isLocked&&hasSeed){plantFarmSeed(plantModal,plant.id);setPlantModal(null);}}} style={{position:"relative",background:hasSeed&&!isLocked?"rgba(90,138,106,0.06)":"rgba(255,255,255,0.02)",border:`1px solid ${hasSeed&&!isLocked?"rgba(90,138,106,0.2)":"rgba(190,211,196,0.06)"}`,borderRadius:14,padding:"14px 10px",cursor:hasSeed&&!isLocked?"pointer":"default",display:"flex",flexDirection:"column",alignItems:"center",gap:6,transition:"all .15s",opacity:isLocked?0.5:hasSeed?1:0.4}}>
                        <span style={{fontSize:"1.4rem"}}>{plant.emoji}</span>
                        <span style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.78rem",color:"rgba(190,211,196,0.8)"}}>{plant.name}</span>
                        <span style={{fontFamily:SANS,fontSize:"0.68rem",fontWeight:600,color:hasSeed?"#BED3C4":"rgba(190,211,196,0.25)"}}>{isLocked?"Plus":hasSeed?`${seedCount} seed${seedCount>1?"s":""}`:"No seeds"}</span>
                        {isLocked&&<PremiumLock compact/>}
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
                  {[...GARDEN_PLANTS,...PREMIUM_GARDEN_PLANTS].map(plant=>{
                    const isLocked=plant.premium&&!hasPremium;
                    const canAfford=candles>=plant.plantCost;
                    return(
                      <button key={plant.id} onClick={()=>{if(!isLocked&&canAfford)plantSeed(plantModal,plantPrayerId,plant.id);}} style={{position:"relative",background:canAfford&&!isLocked?"rgba(90,138,106,0.06)":"rgba(255,255,255,0.02)",border:`1px solid ${canAfford&&!isLocked?"rgba(90,138,106,0.2)":"rgba(190,211,196,0.06)"}`,borderRadius:14,padding:"14px 10px",cursor:canAfford&&!isLocked?"pointer":"default",display:"flex",flexDirection:"column",alignItems:"center",gap:6,transition:"all .15s",opacity:isLocked?0.5:canAfford?1:0.4}}>
                        <span style={{fontSize:"1.4rem"}}>{plant.emoji}</span>
                        <span style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.78rem",color:"rgba(190,211,196,0.8)"}}>{plant.name}</span>
                        <span style={{fontFamily:SANS,fontSize:"0.68rem",fontWeight:600,color:canAfford?B.goldL:"rgba(190,211,196,0.25)"}}>🕯️ {plant.plantCost}</span>
                        {isLocked&&<PremiumLock compact/>}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>}
        <BottomMenuDrawer/>
      </div>
    );
  }

  /* ══ ROOM SHOP ════════════════════════════════════ */
  if(screen==="shop"){
    const allShopItems=[...SHOP_ITEMS,...PREMIUM_SHOP_ITEMS];
    const filteredItems=shopCategory==="all"?allShopItems:allShopItems.filter(i=>i.category===shopCategory);
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
              const isLocked=item.premium&&!hasPremium;
              return(
                <div key={item.id} style={{position:"relative",background:owned?"rgba(90,138,106,0.08)":"rgba(255,255,255,0.03)",border:`1px solid ${owned?"rgba(90,138,106,0.25)":"rgba(212,180,100,0.12)"}`,borderRadius:14,padding:"18px 14px",display:"flex",flexDirection:"column",alignItems:"center",gap:8,transition:"all 0.2s"}}>
                  {isLocked&&<PremiumLock/>}
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
                    <button onClick={()=>{if(canAfford&&!isLocked)buyShopItem(item);}} style={{background:canAfford&&!isLocked?"rgba(212,180,100,0.2)":"rgba(255,255,255,0.04)",border:`1px solid ${canAfford&&!isLocked?"rgba(212,180,100,0.35)":"rgba(255,255,255,0.08)"}`,borderRadius:8,padding:"6px 16px",fontSize:"0.74rem",fontFamily:SANS,fontWeight:600,color:canAfford&&!isLocked?B.goldL:"rgba(255,248,232,0.25)",cursor:canAfford&&!isLocked?"pointer":"default",transition:"all 0.15s"}}>{isLocked?"Plus":canAfford?"Buy":"Not enough 🕯️"}</button>
                  )}
                </div>
              );
            })}
          </div>
          {filteredItems.length===0&&<p style={{fontFamily:SERIF,fontStyle:"italic",color:"rgba(255,248,232,0.3)",textAlign:"center",marginTop:40}}>No items in this category yet.</p>}
        </main>
        <BottomMenuDrawer/>
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
        <BottomMenuDrawer/>
      </div>
    );
  }

  /* ══ MARKET — Placeholder ═══════════════════════ */
  /* ══ KITCHEN — Immersive downstairs kitchen with stove ══════════════ */
  /* ══ COZY CREATIONS ROOM — seasonal art studio (off the cabin hall) ══ */
  if(screen==="cozy-creations"){
    return(
      <div style={{position:"fixed",inset:0,overflow:"hidden",fontFamily:SANS,background:"#0A0604"}}>
        <style>{GFONTS}{CSS}</style>
        <CozyCreationsRoom/>
        {/* Cinematic vignette */}
        <div style={{position:"absolute",inset:0,pointerEvents:"none",background:"radial-gradient(ellipse at center, transparent 45%, rgba(8,6,4,0.5) 100%)"}}/>
        {/* Easel canvas → choose Diamond Art or Coloring */}
        <button onClick={()=>setCraftChooser(true)} aria-label="Choose an art activity"
          style={{position:"absolute",left:"13%",top:"37%",width:"26%",height:"27%",zIndex:13,background:"transparent",border:"none",padding:0,cursor:"pointer",borderRadius:"6%",outline:"none",WebkitTapHighlightColor:"transparent"}}>
          <div style={{position:"absolute",inset:"-6%",borderRadius:"10%",background:"radial-gradient(ellipse at 50% 50%, rgba(255,205,120,0.16) 0%, rgba(255,175,80,0.06) 48%, transparent 72%)",pointerEvents:"none",animation:"hotspotPulse 3s ease-in-out infinite"}}/>
        </button>
        {/* Desk → choose Word Search or Hidden Object */}
        <button onClick={()=>setPuzzleChooser(true)} aria-label="Choose a puzzle"
          style={{position:"absolute",left:"60%",top:"55%",width:"38%",height:"30%",zIndex:13,background:"transparent",border:"none",padding:0,cursor:"pointer",borderRadius:"6%",outline:"none",WebkitTapHighlightColor:"transparent"}}>
          <div style={{position:"absolute",inset:"-6%",borderRadius:"10%",background:"radial-gradient(ellipse at 50% 45%, rgba(255,205,120,0.16) 0%, rgba(255,175,80,0.06) 48%, transparent 72%)",pointerEvents:"none",animation:"hotspotPulse 3s ease-in-out infinite"}}/>
        </button>
        {/* Back to cabin */}
        <button onClick={()=>transitionToCabin()} style={{position:"absolute",top:28,left:22,zIndex:15,background:"rgba(10,6,4,0.50)",backdropFilter:"blur(14px)",WebkitBackdropFilter:"blur(14px)",border:"1px solid rgba(201,169,110,0.12)",borderRadius:999,padding:"8px 20px",cursor:"pointer",color:"rgba(255,248,232,0.6)",fontFamily:SANS,fontSize:"0.78rem",display:"inline-flex",alignItems:"center",gap:6}}>
          <span style={{fontSize:"0.7rem"}}>&#8592;</span> Cabin
        </button>
        {/* Title */}
        <div style={{position:"absolute",top:30,left:0,right:0,textAlign:"center",zIndex:14,pointerEvents:"none",fontFamily:DISPLAY,fontSize:"0.95rem",fontWeight:700,color:"rgba(255,240,210,0.7)",textShadow:"0 2px 10px rgba(0,0,0,0.7)",letterSpacing:"0.03em"}}>Cozy Creations Room</div>
        {spaceTransit&&<div style={{position:"fixed",inset:0,zIndex:9999,background:"#0A0806",animation:"spaceFadeIn .6s ease both",pointerEvents:"all"}}/>}
        {craftChooser&&(
          <div onClick={()=>setCraftChooser(false)} style={{position:"fixed",inset:0,zIndex:9998,background:"rgba(8,6,4,0.72)",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
            <div onClick={e=>e.stopPropagation()} style={{maxWidth:440,width:"100%",background:"linear-gradient(180deg, rgba(30,22,16,0.96), rgba(20,15,11,0.96))",border:"1px solid rgba(201,169,110,0.28)",borderRadius:20,padding:"26px 22px 24px",boxShadow:"0 24px 60px rgba(0,0,0,0.6)"}}>
              <div style={{fontFamily:DISPLAY,fontStyle:"italic",color:"#E8D4A0",fontSize:"1.4rem",textAlign:"center",marginBottom:4}}>What would you like to create?</div>
              <div style={{fontFamily:SANS,fontSize:"0.74rem",color:"rgba(232,212,160,0.55)",textAlign:"center",letterSpacing:"0.05em",marginBottom:22}}>Choose your craft for today</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                {[
                  {key:"diamond-art",label:"Diamond Art",desc:"Place sparkling gems by number",emoji:"&#9672;"},
                  {key:"coloring",label:"Coloring",desc:"Tap to fill with glitter color",emoji:"&#10047;"},
                ].map(opt=>(
                  <button key={opt.key} onClick={()=>{setCraftChooser(false);setPrevScreen("cozy-creations");setScreen(opt.key);}}
                    style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(201,169,110,0.22)",borderRadius:14,padding:"20px 14px",cursor:"pointer",color:"#FAF6F0",textAlign:"center",transition:"all 0.15s"}}>
                    <div style={{fontSize:"1.8rem",color:"#C9A96E",marginBottom:8}} dangerouslySetInnerHTML={{__html:opt.emoji}}/>
                    <div style={{fontFamily:DISPLAY,fontStyle:"italic",color:"#E8D4A0",fontSize:"1.08rem",marginBottom:4}}>{opt.label}</div>
                    <div style={{fontFamily:SANS,fontSize:"0.66rem",color:"rgba(232,212,160,0.5)",lineHeight:1.4}}>{opt.desc}</div>
                  </button>
                ))}
              </div>
              <button onClick={()=>setCraftChooser(false)} style={{display:"block",margin:"18px auto 0",background:"transparent",border:"none",color:"rgba(232,212,160,0.5)",fontFamily:SANS,fontSize:"0.78rem",cursor:"pointer"}}>Maybe later</button>
            </div>
          </div>
        )}
        {puzzleChooser&&(
          <div onClick={()=>setPuzzleChooser(false)} style={{position:"fixed",inset:0,zIndex:9998,background:"rgba(8,6,4,0.72)",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
            <div onClick={e=>e.stopPropagation()} style={{maxWidth:440,width:"100%",background:"linear-gradient(180deg, rgba(30,22,16,0.96), rgba(20,15,11,0.96))",border:"1px solid rgba(201,169,110,0.28)",borderRadius:20,padding:"26px 22px 24px",boxShadow:"0 24px 60px rgba(0,0,0,0.6)"}}>
              <div style={{fontFamily:DISPLAY,fontStyle:"italic",color:"#E8D4A0",fontSize:"1.4rem",textAlign:"center",marginBottom:4}}>Which puzzle today?</div>
              <div style={{fontFamily:SANS,fontSize:"0.74rem",color:"rgba(232,212,160,0.55)",textAlign:"center",letterSpacing:"0.05em",marginBottom:22}}>Search the Word, or search the scene</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                {[
                  {key:"word-search",label:"Word Search",desc:"Find every word of a verse",emoji:"&#9635;"},
                  {key:"hidden-object",label:"Hidden Object",desc:"Spot hidden treasures in a scene",emoji:"&#128269;"},
                ].map(opt=>(
                  <button key={opt.key} onClick={()=>{setPuzzleChooser(false);setPrevScreen("cozy-creations");setScreen(opt.key);}}
                    style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(201,169,110,0.22)",borderRadius:14,padding:"20px 14px",cursor:"pointer",color:"#FAF6F0",textAlign:"center",transition:"all 0.15s"}}>
                    <div style={{fontSize:"1.8rem",color:"#C9A96E",marginBottom:8}} dangerouslySetInnerHTML={{__html:opt.emoji}}/>
                    <div style={{fontFamily:DISPLAY,fontStyle:"italic",color:"#E8D4A0",fontSize:"1.08rem",marginBottom:4}}>{opt.label}</div>
                    <div style={{fontFamily:SANS,fontSize:"0.66rem",color:"rgba(232,212,160,0.5)",lineHeight:1.4}}>{opt.desc}</div>
                  </button>
                ))}
              </div>
              <button onClick={()=>setPuzzleChooser(false)} style={{display:"block",margin:"18px auto 0",background:"transparent",border:"none",color:"rgba(232,212,160,0.5)",fontFamily:SANS,fontSize:"0.78rem",cursor:"pointer"}}>Maybe later</button>
            </div>
          </div>
        )}
        <BottomMenuDrawer/>
      </div>
    );
  }

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
              <img src={getRoomTheme(roomTheme).kitchen||KITCHEN_BG_IMAGE} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} draggable={false}/>
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
              <img src={getRoomTheme(roomTheme).kitchen||KITCHEN_BG_IMAGE} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} draggable={false}/>
              {/* Window light intensifies during zoom */}
              <div style={{position:"absolute",left:"34%",top:"8%",width:"32%",height:"32%",borderRadius:"30%",background:"radial-gradient(ellipse at 50% 50%,rgba(180,220,255,0.25) 0%,rgba(140,190,240,0.08) 45%,transparent 70%)",mixBlendMode:"screen"}}/>
            </div>
            <div style={{position:"fixed",inset:0,background:"#080604",animation:"walkToWindowVignette 1.2s cubic-bezier(0.4,0,0.2,1) forwards"}}/>
          </div>
        )}
        {spaceTransit&&<div style={{position:"fixed",inset:0,zIndex:9999,background:"#0A0806",animation:"spaceFadeIn .6s ease both",pointerEvents:"all"}}/>}
        <BottomMenuDrawer/>
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
                <div key={recipe.id} style={{background:"rgba(18,14,8,0.85)",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",border:`1px solid ${canCook?"rgba(212,180,100,0.2)":"rgba(201,169,110,0.08)"}`,borderRadius:14,padding:"14px 12px",display:"flex",flexDirection:"column",gap:8,animation:"fadeUp .25s ease both"}}>
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
        <BottomMenuDrawer/>
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
          <div style={{position:"absolute",bottom:"12%",left:"50%",transform:"translateX(-50%)",pointerEvents:"none",textAlign:"center",animation:"fadeUp .4s ease both .5s",opacity:0,width:"80%",maxWidth:360}}>
            <p style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"1.1rem",color:"rgba(220,230,240,0.35)",textShadow:"0 2px 12px rgba(0,0,0,0.9)",margin:0,lineHeight:1.6}}>Be still, and know...</p>
            <p style={{fontFamily:SANS,fontSize:"0.72rem",color:"rgba(200,210,220,0.22)",marginTop:10,letterSpacing:"0.04em"}}>guided prayer coming soon</p>
          </div>
        </div>
        {spaceTransit&&<div style={{position:"fixed",inset:0,zIndex:9999,background:"#0A0806",animation:"spaceFadeIn .6s ease both",pointerEvents:"all"}}/>}
        <BottomMenuDrawer/>
      </div>
    );
  }

  if(screen==="market"){
    return(
      <div style={{position:"fixed",inset:0,overflow:"hidden",fontFamily:SANS}}>
        <style>{GFONTS}{CSS}</style>
        <ImmersiveMarket/>

        {/* ── Back to village ── */}
        <button onClick={()=>{setMarketStall(null);setShopStall(null);setScreen("map");}} style={{position:"absolute",top:20,left:16,zIndex:14,background:"rgba(10,8,16,0.55)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",border:"1px solid rgba(201,169,110,0.15)",borderRadius:999,padding:"8px 20px",cursor:"pointer",color:"rgba(255,248,232,0.6)",fontFamily:SANS,fontSize:"0.78rem",transition:"all 0.2s",display:"inline-flex",alignItems:"center",gap:6,animation:"fadeUp .3s ease both"}}>
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
          <div style={{position:"absolute",bottom:24,left:"50%",transform:"translateX(-50%)",zIndex:14,background:"rgba(10,8,16,0.55)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",border:"1px solid rgba(201,169,110,0.15)",borderRadius:14,padding:"12px 28px",textAlign:"center",animation:"fadeUp .35s .1s ease both"}}>
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
                <img src="/harvest-market.webp" alt="Harvest Market stall" style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"center 30%",display:"block"}}/>
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

        {/* ── COMMUNITY MARKET OVERLAY (was Barter Post) ── */}
        {shopStall==="barter"&&(
          <div style={{position:"fixed",inset:0,zIndex:100,background:"#0A0810",animation:"overlayFadeIn .35s ease both",display:"flex",flexDirection:"column"}}>
            <header style={{position:"relative",zIndex:10,background:"rgba(10,8,16,0.75)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",padding:"0 16px",height:54,display:"flex",alignItems:"center",gap:10,borderBottom:"1px solid rgba(201,169,110,0.12)",flexShrink:0}}>
              <button onClick={()=>{setShopStall(null);setCommunityTab("browse");setListingForm(null);}} style={{background:"transparent",border:"none",cursor:"pointer",color:"rgba(255,240,200,0.55)",fontSize:"0.8rem",fontFamily:SANS,padding:"4px 0"}}>{"< Market"}</button>
              <div style={{height:14,width:1,background:"rgba(201,169,110,0.18)"}}/>
              <span style={{fontFamily:SERIF,fontStyle:"italic",color:"rgba(255,240,200,0.75)",fontSize:"0.92rem"}}>Community Market</span>
              <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontSize:"0.7rem",fontFamily:SANS,color:"rgba(255,240,200,0.35)"}}>coins</span>
                <span style={{fontSize:"0.82rem",fontFamily:SANS,fontWeight:700,color:B.goldL}}>{bank.coins||0}</span>
              </div>
            </header>
            {/* Tab bar */}
            <div style={{display:"flex",gap:0,borderBottom:"1px solid rgba(201,169,110,0.1)",flexShrink:0}}>
              {[["browse","Browse"],["myListings","My Listings"],["npcTrades","NPC Trades"]].map(([k,label])=>(
                <button key={k} onClick={()=>{setCommunityTab(k);if(k==="browse") loadCommunityListings();}} style={{flex:1,padding:"10px 0",background:communityTab===k?"rgba(201,169,110,0.08)":"transparent",border:"none",borderBottom:communityTab===k?"2px solid rgba(201,169,110,0.6)":"2px solid transparent",color:communityTab===k?"rgba(255,240,200,0.85)":"rgba(255,240,200,0.4)",fontSize:"0.72rem",fontFamily:SANS,fontWeight:600,cursor:"pointer",transition:"all 0.2s",letterSpacing:"0.02em"}}>{label}</button>
              ))}
            </div>
            <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
              <div style={{maxWidth:600,margin:"0 auto",padding:"18px 22px 80px"}}>

                {/* ── BROWSE TAB ── */}
                {communityTab==="browse"&&(<>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                    <p style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.82rem",color:"rgba(255,240,200,0.4)",margin:0}}>Items listed by other players</p>
                    <button onClick={loadCommunityListings} disabled={communityLoading} style={{background:"rgba(201,169,110,0.1)",border:"1px solid rgba(201,169,110,0.2)",borderRadius:8,padding:"5px 12px",cursor:"pointer",color:B.gold,fontSize:"0.7rem",fontFamily:SANS,fontWeight:600}}>{communityLoading?"Loading...":"Refresh"}</button>
                  </div>
                  {!user&&<div style={{background:"rgba(255,240,200,0.04)",border:"1px solid rgba(201,169,110,0.12)",borderRadius:12,padding:24,textAlign:"center"}}>
                    <p style={{fontFamily:SERIF,fontStyle:"italic",color:"rgba(255,240,200,0.5)",fontSize:"0.9rem",margin:0}}>Sign in to browse community listings</p>
                  </div>}
                  {user&&communityListings.length===0&&!communityLoading&&<div style={{background:"rgba(255,240,200,0.04)",border:"1px solid rgba(201,169,110,0.12)",borderRadius:12,padding:24,textAlign:"center"}}>
                    <p style={{fontFamily:SERIF,fontStyle:"italic",color:"rgba(255,240,200,0.35)",fontSize:"0.88rem",margin:"0 0 6px"}}>No listings right now</p>
                    <p style={{fontFamily:SANS,fontSize:"0.72rem",color:"rgba(255,240,200,0.2)",margin:0}}>Be the first to list something!</p>
                  </div>}
                  {communityListings.map((listing,i)=>{
                    const cat=ITEM_CATALOG[listing.itemType];
                    const canBuy=user&&listing.sellerId!==user.uid&&(bank.coins||0)>=listing.totalPrice;
                    return(
                      <div key={listing.id} style={{background:"rgba(255,240,200,0.04)",border:"1px solid rgba(201,169,110,0.12)",borderRadius:14,padding:"14px 16px",marginBottom:10,animation:`fadeUp .4s ${0.1+i*0.06}s ease both`,opacity:0}}>
                        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                          <span style={{fontSize:"1.4rem"}}>{cat?.emoji||"..."}</span>
                          <div style={{flex:1}}>
                            <div style={{fontFamily:SERIF,fontSize:"0.9rem",color:"rgba(255,240,200,0.8)",fontWeight:500}}>{cat?.name||listing.itemType} x{listing.quantity}</div>
                            <div style={{fontFamily:SANS,fontSize:"0.68rem",color:"rgba(255,240,200,0.3)"}}>by {listing.sellerName}</div>
                          </div>
                          <div style={{textAlign:"right"}}>
                            <div style={{fontFamily:SANS,fontSize:"0.88rem",fontWeight:700,color:B.goldL}}>{listing.totalPrice} coins</div>
                            <div style={{fontFamily:SANS,fontSize:"0.62rem",color:"rgba(255,240,200,0.3)"}}>{listing.pricePerUnit}/ea</div>
                          </div>
                        </div>
                        {user&&listing.sellerId===user.uid?
                          <div style={{fontSize:"0.72rem",fontFamily:SANS,color:"rgba(255,240,200,0.3)",textAlign:"center",padding:"6px 0"}}>Your listing</div>
                        :
                          <button onClick={async()=>{if(!canBuy)return;await purchaseListing(listing);}} disabled={!canBuy} style={{width:"100%",padding:"8px 0",background:canBuy?"rgba(90,138,106,0.15)":"rgba(255,240,200,0.03)",border:`1px solid ${canBuy?"rgba(90,138,106,0.3)":"rgba(201,169,110,0.08)"}`,borderRadius:10,cursor:canBuy?"pointer":"default",color:canBuy?"#BED3C4":"rgba(255,240,200,0.25)",fontFamily:SANS,fontSize:"0.78rem",fontWeight:600,transition:"all 0.15s",opacity:canBuy?1:0.5}}>
                            {!user?"Sign in to buy":canBuy?`Buy for ${listing.totalPrice} coins`:`Not enough coins (${bank.coins||0})`}
                          </button>
                        }
                      </div>
                    );
                  })}
                </>)}

                {/* ── MY LISTINGS TAB ── */}
                {communityTab==="myListings"&&(<>
                  {!user&&<div style={{background:"rgba(255,240,200,0.04)",border:"1px solid rgba(201,169,110,0.12)",borderRadius:12,padding:24,textAlign:"center"}}>
                    <p style={{fontFamily:SERIF,fontStyle:"italic",color:"rgba(255,240,200,0.5)",fontSize:"0.9rem",margin:0}}>Sign in to list items</p>
                  </div>}
                  {user&&<>
                    {/* Create listing form */}
                    {!listingForm?
                      <button onClick={()=>setListingForm({itemType:"",quantity:1,pricePerUnit:1})} style={{width:"100%",padding:"12px 0",background:"rgba(201,169,110,0.08)",border:"1px dashed rgba(201,169,110,0.25)",borderRadius:12,cursor:"pointer",color:B.gold,fontFamily:SANS,fontSize:"0.82rem",fontWeight:600,marginBottom:16,transition:"all 0.15s"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(201,169,110,0.14)"} onMouseLeave={e=>e.currentTarget.style.background="rgba(201,169,110,0.08)"}>+ List an item for sale</button>
                    :
                      <div style={{background:"rgba(255,240,200,0.04)",border:"1px solid rgba(201,169,110,0.15)",borderRadius:14,padding:16,marginBottom:16,animation:"fadeUp .3s ease both"}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                          <span style={{fontFamily:SERIF,fontStyle:"italic",color:"rgba(255,240,200,0.7)",fontSize:"0.88rem"}}>New Listing</span>
                          <button onClick={()=>setListingForm(null)} style={{background:"transparent",border:"none",cursor:"pointer",color:"rgba(255,240,200,0.35)",fontSize:"0.9rem"}}>x</button>
                        </div>
                        <select value={listingForm.itemType} onChange={e=>setListingForm(f=>({...f,itemType:e.target.value}))} style={{width:"100%",background:"rgba(255,248,232,0.04)",border:"1px solid rgba(201,169,110,0.15)",borderRadius:8,color:"rgba(255,240,200,0.7)",fontSize:"0.82rem",fontFamily:SANS,padding:"9px 11px",marginBottom:8}}>
                          <option value="">Choose an item...</option>
                          {Object.entries(inventory).filter(([,v])=>v>0).map(([k,v])=>{
                            const cat=ITEM_CATALOG[k];
                            return <option key={k} value={k}>{cat?.emoji||""} {cat?.name||k} (own {v})</option>;
                          })}
                        </select>
                        <div style={{display:"flex",gap:8,marginBottom:8}}>
                          <div style={{flex:1}}>
                            <label style={{fontSize:"0.66rem",fontFamily:SANS,color:"rgba(255,240,200,0.35)",marginBottom:3,display:"block"}}>Quantity</label>
                            <input type="number" min="1" max={listingForm.itemType?(inventory[listingForm.itemType]||0):999} value={listingForm.quantity} onChange={e=>setListingForm(f=>({...f,quantity:Math.max(1,parseInt(e.target.value)||1)}))} style={{width:"100%",background:"rgba(255,248,232,0.04)",border:"1px solid rgba(201,169,110,0.15)",borderRadius:8,color:"rgba(255,240,200,0.7)",fontSize:"0.82rem",fontFamily:SANS,padding:"8px 10px",boxSizing:"border-box"}}/>
                          </div>
                          <div style={{flex:1}}>
                            <label style={{fontSize:"0.66rem",fontFamily:SANS,color:"rgba(255,240,200,0.35)",marginBottom:3,display:"block"}}>Price/unit</label>
                            <input type="number" min="1" max="9999" value={listingForm.pricePerUnit} onChange={e=>setListingForm(f=>({...f,pricePerUnit:Math.max(1,parseInt(e.target.value)||1)}))} style={{width:"100%",background:"rgba(255,248,232,0.04)",border:"1px solid rgba(201,169,110,0.15)",borderRadius:8,color:"rgba(255,240,200,0.7)",fontSize:"0.82rem",fontFamily:SANS,padding:"8px 10px",boxSizing:"border-box"}}/>
                          </div>
                        </div>
                        {listingForm.itemType&&<p style={{fontSize:"0.72rem",fontFamily:SANS,color:"rgba(255,240,200,0.35)",margin:"0 0 10px"}}>Total: {listingForm.quantity*listingForm.pricePerUnit} coins for {listingForm.quantity}x {ITEM_CATALOG[listingForm.itemType]?.name||listingForm.itemType}</p>}
                        <button onClick={async()=>{
                          if(!listingForm.itemType) return;
                          await createListing(listingForm.itemType,listingForm.quantity,listingForm.pricePerUnit);
                          setListingForm(null);
                        }} disabled={!listingForm.itemType||communityLoading} style={{width:"100%",padding:"9px 0",background:listingForm.itemType?"rgba(90,138,106,0.15)":"rgba(255,240,200,0.03)",border:`1px solid ${listingForm.itemType?"rgba(90,138,106,0.3)":"rgba(201,169,110,0.08)"}`,borderRadius:10,cursor:listingForm.itemType?"pointer":"default",color:listingForm.itemType?"#BED3C4":"rgba(255,240,200,0.25)",fontFamily:SANS,fontSize:"0.78rem",fontWeight:600,transition:"all 0.15s"}}>{communityLoading?"Listing...":"List for sale"}</button>
                      </div>
                    }
                    {/* Active listings by this user */}
                    <p style={{fontFamily:SANS,fontSize:"0.68rem",color:"rgba(255,240,200,0.3)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>Your active listings</p>
                    {communityListings.filter(l=>l.sellerId===user.uid).length===0&&<p style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.82rem",color:"rgba(255,240,200,0.25)",margin:"0 0 16px"}}>You don't have any active listings.</p>}
                    {communityListings.filter(l=>l.sellerId===user.uid).map(listing=>{
                      const cat=ITEM_CATALOG[listing.itemType];
                      return(
                        <div key={listing.id} style={{background:"rgba(255,240,200,0.04)",border:"1px solid rgba(201,169,110,0.12)",borderRadius:14,padding:"14px 16px",marginBottom:10,display:"flex",alignItems:"center",gap:12}}>
                          <span style={{fontSize:"1.3rem"}}>{cat?.emoji||"..."}</span>
                          <div style={{flex:1}}>
                            <div style={{fontFamily:SERIF,fontSize:"0.88rem",color:"rgba(255,240,200,0.7)"}}>{cat?.name||listing.itemType} x{listing.quantity}</div>
                            <div style={{fontFamily:SANS,fontSize:"0.68rem",color:"rgba(255,240,200,0.3)"}}>{listing.totalPrice} coins ({listing.pricePerUnit}/ea)</div>
                          </div>
                          <button onClick={()=>cancelListing(listing.id)} disabled={communityLoading} style={{background:"rgba(255,120,100,0.1)",border:"1px solid rgba(255,120,100,0.2)",borderRadius:8,padding:"6px 14px",cursor:"pointer",color:"rgba(255,160,140,0.7)",fontSize:"0.72rem",fontFamily:SANS,fontWeight:600}}>Cancel</button>
                        </div>
                      );
                    })}
                  </>}
                </>)}

                {/* ── NPC TRADES TAB ── */}
                {communityTab==="npcTrades"&&(<>
                  <h2 style={{fontFamily:DISPLAY,fontSize:"1.2rem",fontWeight:700,color:"rgba(255,240,200,0.85)",margin:"0 0 6px"}}>Traveling Merchants</h2>
                  <p style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.82rem",color:"rgba(255,240,200,0.4)",margin:"0 0 18px"}}>Trade goods with NPCs. No coins needed.</p>
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
                </>)}

              </div>
            </div>
          </div>
        )}
        <BottomMenuDrawer/>
      </div>
    );
  }

  /* ══ UPGRADE — Inner Room Plus ══════════════════════ */
  if(screen==="upgrade"){
    return(
      <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#1A1208 0%,#1A1612 40%,#2A1E08 100%)",color:"#FFF8E8",fontFamily:SANS}}>
        <style>{GFONTS}{CSS}</style>
        <DarkHeader title="" onBack={()=>setScreen(prevScreen||"cabin")} backLabel="← Back"/>
        <main style={{maxWidth:"520px",margin:"0 auto",padding:"40px 24px 80px",textAlign:"center"}}>
          {/* Title */}
          <h1 style={{fontFamily:DISPLAY,fontSize:"1.8rem",fontWeight:700,color:B.goldL,margin:"0 0 8px",textShadow:"0 2px 16px rgba(201,169,110,0.3)",lineHeight:1.2}}>Inner Room Plus</h1>
          <div style={{width:60,height:1,background:"rgba(201,169,110,0.4)",margin:"12px auto 16px"}}/>
          <p style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"1rem",color:"rgba(255,248,232,0.4)",margin:"0 0 44px",lineHeight:1.6}}>Go deeper. Grow more. Walk further.</p>

          {/* Benefits list */}
          <div style={{display:"flex",flexDirection:"column",gap:24,textAlign:"left",marginBottom:52}}>
            {PLUS_BENEFITS.map((b,i)=>(
              <div key={i} style={{display:"flex",gap:16,alignItems:"flex-start",animation:`fadeUp .5s ${i*0.08}s ease both`}}>
                {/* Icon circle */}
                <div style={{width:44,height:44,borderRadius:"50%",flexShrink:0,background:"rgba(201,169,110,0.06)",border:"1px solid rgba(201,169,110,0.18)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <PlusIcon type={b.icon}/>
                </div>
                <div>
                  <div style={{fontFamily:SANS,fontSize:"0.88rem",fontWeight:600,color:B.goldL,marginBottom:4}}>{b.title}</div>
                  <div style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.78rem",color:"rgba(255,248,232,0.3)",lineHeight:1.55}}>{b.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <button style={{background:"rgba(201,169,110,0.1)",border:"1.5px solid rgba(201,169,110,0.35)",borderRadius:999,padding:"14px 44px",cursor:"default",fontFamily:SERIF,fontStyle:"italic",fontSize:"0.95rem",color:B.goldL,boxShadow:"0 0 24px rgba(201,169,110,0.06)",transition:"all 0.2s",letterSpacing:"0.02em"}}>
            Coming Soon
          </button>
          <p style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.72rem",color:"rgba(255,248,232,0.18)",marginTop:18,lineHeight:1.6}}>
            We are still preparing this offering.<br/>Thank you for walking with us.
          </p>
        </main>
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
      else{
        // Leaving the book list: if the reader was opened from the cabin's book
        // chooser, return there (reopen the chooser); otherwise fall back to the
        // Upper Room hub it was opened from.
        setBibleView(null);setBibleSearch("");setUpperRoomView(null);
        if(bibleFromCabinRef.current){
          bibleFromCabinRef.current=false;
          setScreen("cabin");
          setReopenBookChooser(n=>n+1);
        }
      }
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

        {/* ── HUB LANDING VIEW ── */}
        {!bibleView&&!upperRoomView&&(
          <div style={{position:"relative",zIndex:10,height:"100%",overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
            <div style={{maxWidth:720,margin:"0 auto",padding:"28px 22px 80px"}}>
              <button onClick={()=>setScreen("map")} style={{background:"rgba(26,22,30,0.55)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",border:"1px solid rgba(180,160,210,0.15)",borderRadius:999,padding:"8px 20px",cursor:"pointer",color:"rgba(230,220,248,0.6)",fontFamily:SANS,fontSize:"0.78rem",marginBottom:28,transition:"all 0.2s",display:"inline-flex",alignItems:"center",gap:6,animation:"fadeUp .3s ease both"}}>
                Back to village
              </button>
              <div style={{textAlign:"center",marginBottom:32,animation:"fadeUp .3s ease both",opacity:0}}>
                <h1 style={{fontFamily:DISPLAY,fontSize:"2rem",fontWeight:700,color:"#D8C8F0",margin:"0 0 8px",textShadow:"0 2px 12px rgba(0,0,0,0.5)"}}>The Upper Room</h1>
                <p style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"1rem",color:"rgba(200,190,230,0.45)",margin:"0 0 14px"}}>A sacred space for worship and encounter.</p>
                <div style={{width:60,height:1,background:"rgba(180,160,210,0.3)",margin:"0 auto"}}/>
              </div>
              {dailyVerse&&(
                <div onClick={()=>{setBibleBook(dailyVerse.bookIdx);setBibleChapter(dailyVerse.chapIdx);setBibleView("reading");setUpperRoomView("scriptures");}} style={{background:"rgba(20,18,32,0.55)",backdropFilter:"blur(14px)",WebkitBackdropFilter:"blur(14px)",border:"1px solid rgba(180,160,210,0.15)",borderRadius:16,padding:"28px 24px",textAlign:"center",marginBottom:28,animation:"fadeUp .35s .06s ease both",opacity:0,cursor:"pointer",transition:"all 0.3s"}}>
                  <p style={{fontFamily:SANS,fontSize:"0.65rem",letterSpacing:"0.08em",textTransform:"uppercase",color:"rgba(200,190,230,0.35)",margin:"0 0 14px"}}>Verse of the Day</p>
                  <p style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"1.05rem",color:"rgba(230,220,248,0.65)",lineHeight:1.7,margin:"0 0 14px"}}>{dailyVerse.text}</p>
                  <p style={{fontFamily:SANS,fontSize:"0.78rem",color:"rgba(180,160,210,0.45)",margin:0}}>-- {dailyVerse.ref}</p>
                </div>
              )}
              {/* ── Navigation Tiles ── */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12,animation:"fadeUp .35s .08s ease both",opacity:0}}>
                {[
                  {key:"scriptures",label:"The Scriptures",sub:"Read the Word",icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(180,160,210,0.55)" strokeWidth="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>},
                  {key:"prayer-wall",label:"Prayer Wall",sub:"Lift up requests",icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(180,160,210,0.55)" strokeWidth="1.5"><path d="M12 2C6.48 2 2 6 2 11c0 3 1.5 5.5 4 7v4l3.5-2c.8.2 1.6.3 2.5.3 5.52 0 10-4 10-9.3C22 6 17.52 2 12 2z"/></svg>},
                  {key:"feed",label:"Community Feed",sub:"See what others share",icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(180,160,210,0.55)" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>},
                  {key:"find-people",label:"Find People",sub:"Search and follow",icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(180,160,210,0.55)" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>},
                  {key:"gatherings",label:"Gatherings",sub:"Anonymous community",icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(180,160,210,0.55)" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>},
                ].map(tile=>(
                  <button key={tile.key} onClick={()=>{
                    if(tile.key==="scriptures"){setUpperRoomView("scriptures");openBible();}
                    else if(tile.key==="gatherings"){setScreen("gatherings");}
                    else if((tile.key==="feed"||tile.key==="find-people"||tile.key==="notifications")&&!user){setToast({msg:"Sign in to access the community"});}
                    else{setUpperRoomView(tile.key);if(tile.key==="prayer-wall"&&prayerWallTab==="community")loadCommunityPrayers();}
                  }} style={{background:"rgba(20,18,32,0.55)",backdropFilter:"blur(14px)",WebkitBackdropFilter:"blur(14px)",border:"1px solid rgba(180,160,210,0.15)",borderRadius:16,padding:"22px 16px",cursor:"pointer",textAlign:"center",transition:"all 0.3s"}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(180,160,210,0.3)";e.currentTarget.style.background="rgba(20,18,32,0.7)";}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(180,160,210,0.15)";e.currentTarget.style.background="rgba(20,18,32,0.55)";}}>
                    <div style={{marginBottom:10}}>{tile.icon}</div>
                    <div style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.95rem",color:"#D8C8F0",marginBottom:4}}>{tile.label}</div>
                    <div style={{fontFamily:SANS,fontSize:"0.68rem",color:"rgba(200,190,230,0.4)"}}>{tile.sub}</div>
                  </button>
                ))}
              </div>
              {/* Notifications tile — full width */}
              <div style={{animation:"fadeUp .35s .12s ease both",opacity:0}}>
                <button onClick={()=>{if(!user){setToast({msg:"Sign in to access the community"});return;}setUpperRoomView("notifications");}} style={{width:"100%",background:"rgba(20,18,32,0.55)",backdropFilter:"blur(14px)",WebkitBackdropFilter:"blur(14px)",border:"1px solid rgba(180,160,210,0.15)",borderRadius:16,padding:"18px 16px",cursor:"pointer",textAlign:"center",transition:"all 0.3s",position:"relative"}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(180,160,210,0.3)";e.currentTarget.style.background="rgba(20,18,32,0.7)";}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(180,160,210,0.15)";e.currentTarget.style.background="rgba(20,18,32,0.55)";}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(180,160,210,0.55)" strokeWidth="1.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                    <span style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.95rem",color:"#D8C8F0"}}>Notifications</span>
                    {unreadCount>0&&<span style={{background:"rgba(212,168,64,0.8)",color:"#1A1610",fontSize:"0.62rem",fontFamily:SANS,fontWeight:700,padding:"2px 7px",borderRadius:99,minWidth:14,textAlign:"center"}}>{unreadCount}</span>}
                  </div>
                </button>
              </div>
              {/* Saved Verses shortcut */}
              {savedVerses.length>0&&(
                <div style={{textAlign:"center",marginTop:16,animation:"fadeUp .35s .15s ease both",opacity:0}}>
                  <button onClick={()=>setSavedVersesView(true)} style={{background:"rgba(212,168,64,0.08)",border:"1px solid rgba(212,168,64,0.18)",borderRadius:20,padding:"10px 28px",cursor:"pointer",color:"rgba(212,168,64,0.7)",fontFamily:SANS,fontSize:"0.82rem",transition:"all 0.3s"}}>
                    Saved Verses ({savedVerses.length})
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── PRAYER WALL SUB-VIEW ── */}
        {upperRoomView==="prayer-wall"&&!bibleView&&(
          <div style={{position:"relative",zIndex:10,height:"100%",overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
            <div style={{maxWidth:520,margin:"0 auto",padding:"28px 22px 80px"}}>
              <button onClick={()=>setUpperRoomView(null)} style={{background:"rgba(26,22,30,0.55)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",border:"1px solid rgba(180,160,210,0.15)",borderRadius:999,padding:"8px 20px",cursor:"pointer",color:"rgba(230,220,248,0.6)",fontFamily:SANS,fontSize:"0.78rem",marginBottom:28,transition:"all 0.2s",display:"inline-flex",alignItems:"center",gap:6}}>
                Back to Upper Room
              </button>
              <div style={{textAlign:"center",marginBottom:24}}>
                <h1 style={{fontFamily:DISPLAY,fontSize:"1.5rem",fontWeight:700,color:"#D8C8F0",margin:"0 0 8px",textShadow:"0 2px 12px rgba(0,0,0,0.5)"}}>Prayer Wall</h1>
                <p style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.88rem",color:"rgba(200,190,230,0.45)",margin:0}}>Lift up your requests and stand with others in prayer.</p>
              </div>
              {/* Tabs */}
              <div style={{display:"flex",gap:0,marginBottom:14,borderRadius:10,overflow:"hidden",border:"1px solid rgba(180,160,210,0.15)"}}>
                {[["mine","My Prayers"],["community","Community"]].map(([k,label])=>(
                  <button key={k} onClick={()=>{setPrayerWallTab(k);if(k==="community") loadCommunityPrayers();}} style={{flex:1,padding:"9px 0",background:prayerWallTab===k?"rgba(180,160,210,0.1)":"rgba(20,18,32,0.5)",border:"none",color:prayerWallTab===k?"#D8C8F0":"rgba(200,190,230,0.35)",fontSize:"0.74rem",fontFamily:SANS,fontWeight:600,cursor:"pointer",transition:"all 0.2s"}}>{label}</button>
                ))}
              </div>
              {/* My Prayers */}
              {prayerWallTab==="mine"&&<>
                <div style={{background:"rgba(20,18,32,0.6)",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",border:"1px solid rgba(180,160,210,0.12)",borderRadius:12,padding:18,marginBottom:14}}>
                  <textarea value={newPrayer} onChange={e=>setNewPrayer(e.target.value)} placeholder="Share what's on your heart..." style={{width:"100%",background:"rgba(180,160,210,0.04)",border:"1px solid rgba(180,160,210,0.12)",borderRadius:8,color:"#D8C8F0",fontSize:"0.88rem",fontFamily:SERIF,padding:13,minHeight:70,boxSizing:"border-box",marginBottom:9,lineHeight:1.7,transition:"border-color 0.2s",resize:"vertical"}} onFocus={e=>e.target.style.borderColor="rgba(180,160,210,0.3)"} onBlur={e=>e.target.style.borderColor="rgba(180,160,210,0.12)"}/>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    <select value={prayerTag} onChange={e=>setPrayerTag(e.target.value)} style={{background:"rgba(180,160,210,0.04)",border:"1px solid rgba(180,160,210,0.12)",borderRadius:7,color:"rgba(200,190,230,0.5)",fontSize:"0.8rem",fontFamily:SANS,padding:"7px 11px",flex:1,minWidth:120}}>
                      <option value="">Tag a topic...</option>
                      {["Healing","Marriage","Singleness","Motherhood","Grief","Anxiety","Finances","Purpose","Forgiveness","Depression","Faith","Career"].map(t=><option key={t}>{t}</option>)}
                    </select>
                    <button onClick={postPrayer} disabled={!newPrayer.trim()} style={{background:newPrayer.trim()?"rgba(90,138,106,0.3)":"transparent",border:`1px solid ${newPrayer.trim()?"rgba(90,138,106,0.4)":"rgba(180,160,210,0.08)"}`,color:newPrayer.trim()?"#BED3C4":"rgba(200,190,230,0.2)",padding:"8px 20px",borderRadius:7,cursor:newPrayer.trim()?"pointer":"default",fontSize:"0.8rem",fontFamily:SANS,fontWeight:600,transition:"all 0.2s"}}>Post</button>
                  </div>
                </div>
                <div style={{display:"flex",gap:6,marginBottom:10}}>
                  {["active","answered","all"].map(f=>(
                    <button key={f} onClick={()=>setPrayerFilter(f)} style={{background:prayerFilter===f?"rgba(20,18,32,0.8)":"transparent",border:`1px solid ${prayerFilter===f?"rgba(180,160,210,0.3)":"rgba(180,160,210,0.1)"}`,color:prayerFilter===f?"#D8C8F0":"rgba(200,190,230,0.35)",padding:"4px 12px",borderRadius:99,fontSize:"0.68rem",fontFamily:SANS,fontWeight:600,cursor:"pointer",textTransform:"capitalize"}}>{f}</button>
                  ))}
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:9}}>
                  {filteredPrayers.filter(p=>prayerFilter==="all"?true:prayerFilter==="answered"?p.status==="answered":p.status!=="answered").map(p=>(
                    <div key={p.id} style={{background:"rgba(20,18,32,0.5)",backdropFilter:"blur(6px)",border:"1px solid "+(p.status==="answered"?"rgba(180,160,210,0.25)":"rgba(180,160,210,0.08)"),borderLeft:p.status==="answered"?"3px solid rgba(180,160,210,0.5)":"3px solid transparent",borderRadius:12,padding:"15px 17px",opacity:p.status==="answered"?0.7:1}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:7}}>
                        <span style={{fontSize:"0.6rem",background:"rgba(180,160,210,0.1)",color:"rgba(200,190,230,0.6)",border:"1px solid rgba(180,160,210,0.2)",padding:"2px 8px",borderRadius:99,fontFamily:SANS,fontWeight:600}}>{p.tag}</span>
                        {p.status==="answered"&&<span style={{fontSize:"0.58rem",background:"rgba(180,160,210,0.15)",color:"rgba(200,190,230,0.6)",padding:"2px 8px",borderRadius:99,fontFamily:SANS,fontWeight:600}}>Answered</span>}
                        <span style={{fontSize:"0.66rem",color:"rgba(200,190,230,0.25)",fontFamily:SANS,marginLeft:"auto"}}>{p.date}</span>
                      </div>
                      <p style={{fontFamily:SERIF,fontSize:"0.92rem",color:"rgba(230,220,248,0.7)",margin:"0 0 10px",lineHeight:1.65}}>{p.text}</p>
                      <div style={{display:"flex",gap:8,alignItems:"center"}}>
                        {prayedFor.includes(p.id)?(<span style={{background:"rgba(90,138,106,0.08)",border:"1px solid rgba(90,138,106,0.15)",color:"rgba(190,211,196,0.5)",padding:"5px 14px",borderRadius:7,fontSize:"0.74rem",fontFamily:SANS,fontWeight:600}}>Praying ({p.prayers})</span>):(<button onClick={()=>prayFor(p.id)} style={{background:"rgba(90,138,106,0.15)",border:"1px solid rgba(90,138,106,0.25)",color:"#BED3C4",padding:"5px 14px",borderRadius:7,cursor:"pointer",fontSize:"0.74rem",fontFamily:SANS,fontWeight:600,transition:"all 0.15s"}}>Pray ({p.prayers})</button>)}
                        {p.status==="answered"?
                          <button onClick={()=>reactivatePrayer(p.id)} style={{background:"transparent",border:"1px solid rgba(180,160,210,0.15)",color:"rgba(200,190,230,0.35)",padding:"5px 12px",borderRadius:7,cursor:"pointer",fontSize:"0.72rem",fontFamily:SANS,fontWeight:600}}>Reactivate</button>
                        :
                          <button onClick={()=>markPrayerAnswered(p.id)} style={{background:"rgba(180,160,210,0.1)",border:"1px solid rgba(180,160,210,0.2)",color:"rgba(200,190,230,0.6)",padding:"5px 12px",borderRadius:7,cursor:"pointer",fontSize:"0.72rem",fontFamily:SANS,fontWeight:600,transition:"all 0.15s"}}>Answered</button>
                        }
                      </div>
                    </div>
                  ))}
                </div>
              </>}
              {/* Community Prayers */}
              {prayerWallTab==="community"&&<>
                {!user&&<div style={{background:"rgba(20,18,32,0.6)",border:"1px solid rgba(180,160,210,0.12)",borderRadius:12,padding:24,textAlign:"center"}}>
                  <p style={{fontFamily:SERIF,fontStyle:"italic",color:"rgba(200,190,230,0.5)",fontSize:"0.9rem",margin:0}}>Sign in to see community prayers</p>
                </div>}
                {user&&<>
                  <div style={{background:"rgba(20,18,32,0.6)",backdropFilter:"blur(8px)",border:"1px solid rgba(180,160,210,0.12)",borderRadius:12,padding:18,marginBottom:14}}>
                    <textarea value={newPrayer} onChange={e=>setNewPrayer(e.target.value)} placeholder="Share a prayer request with the community..." style={{width:"100%",background:"rgba(180,160,210,0.04)",border:"1px solid rgba(180,160,210,0.12)",borderRadius:8,color:"#D8C8F0",fontSize:"0.88rem",fontFamily:SERIF,padding:13,minHeight:60,boxSizing:"border-box",marginBottom:9,lineHeight:1.7,transition:"border-color 0.2s",resize:"vertical"}} onFocus={e=>e.target.style.borderColor="rgba(180,160,210,0.3)"} onBlur={e=>e.target.style.borderColor="rgba(180,160,210,0.12)"}/>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                      <select value={prayerTag} onChange={e=>setPrayerTag(e.target.value)} style={{background:"rgba(180,160,210,0.04)",border:"1px solid rgba(180,160,210,0.12)",borderRadius:7,color:"rgba(200,190,230,0.5)",fontSize:"0.8rem",fontFamily:SANS,padding:"7px 11px",flex:1,minWidth:120}}>
                        <option value="">Tag a topic...</option>
                        {["Healing","Marriage","Singleness","Motherhood","Grief","Anxiety","Finances","Purpose","Forgiveness","Depression","Faith","Career"].map(t=><option key={t}>{t}</option>)}
                      </select>
                      <button onClick={postCommunityPrayer} disabled={!newPrayer.trim()||communityLoading} style={{background:newPrayer.trim()?"rgba(90,138,106,0.3)":"transparent",border:`1px solid ${newPrayer.trim()?"rgba(90,138,106,0.4)":"rgba(180,160,210,0.08)"}`,color:newPrayer.trim()?"#BED3C4":"rgba(200,190,230,0.2)",padding:"8px 20px",borderRadius:7,cursor:newPrayer.trim()?"pointer":"default",fontSize:"0.8rem",fontFamily:SANS,fontWeight:600,transition:"all 0.2s"}}>{communityLoading?"Posting...":"Share prayer"}</button>
                    </div>
                  </div>
                  <div style={{display:"flex",justifyContent:"flex-end",marginBottom:10}}>
                    <button onClick={loadCommunityPrayers} disabled={communityLoading} style={{background:"rgba(180,160,210,0.08)",border:"1px solid rgba(180,160,210,0.15)",borderRadius:8,padding:"4px 12px",cursor:"pointer",color:"rgba(200,190,230,0.6)",fontSize:"0.68rem",fontFamily:SANS,fontWeight:600}}>{communityLoading?"Loading...":"Refresh"}</button>
                  </div>
                  {communityPrayers.length===0&&!communityLoading&&<div style={{textAlign:"center",padding:"20px 0"}}>
                    <p style={{fontFamily:SERIF,fontStyle:"italic",color:"rgba(200,190,230,0.35)",fontSize:"0.88rem",margin:0}}>No community prayers yet. Be the first to share.</p>
                  </div>}
                  <div style={{display:"flex",flexDirection:"column",gap:9}}>
                    {communityPrayers.map((cp,idx)=>(
                      <PostCard key={cp.id} post={cp} idx={idx} user={user} prayed={prayedPostIds.has(cp.id)} commentsOpen={expandedComments===cp.id} comments={postComments[cp.id]||[]} commentText={expandedComments===cp.id?commentText:""} commentLoading={commentLoading} onTogglePray={()=>togglePrayForPost(cp.id)} onToggleComments={()=>{if(expandedComments===cp.id){setExpandedComments(null);}else{setExpandedComments(cp.id);setCommentText("");if(!postComments[cp.id])loadComments(cp.id);}}} onCommentTextChange={setCommentText} onSubmitComment={()=>submitComment(cp.id)} onAuthorTap={viewProfile}/>
                    ))}
                  </div>
                </>}
              </>}
            </div>
          </div>
        )}

        {/* ── FEED SUB-VIEW ── */}
        {upperRoomView==="feed"&&!bibleView&&(
          <FeedScreen user={user} db={db} functions={functions} setScreen={setScreen} prevScreen="upper-room" setToast={setToast} addCandles={addCandles} viewProfile={viewProfile} trackMission={trackMission} onBack={()=>setUpperRoomView(null)}/>
        )}

        {/* ── NOTIFICATIONS SUB-VIEW ── */}
        {upperRoomView==="notifications"&&!bibleView&&user&&(
          <NotificationsScreen user={user} db={db} functions={functions} setScreen={setScreen} prevScreen="upper-room" setToast={setToast} viewProfile={viewProfile} onBack={()=>setUpperRoomView(null)} onFeedTap={()=>setUpperRoomView("feed")}/>
        )}

        {/* ── FIND PEOPLE SUB-VIEW ── */}
        {upperRoomView==="find-people"&&!bibleView&&user&&(
          <div style={{position:"relative",zIndex:10,height:"100%",overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
            <div style={{maxWidth:520,margin:"0 auto",padding:"28px 22px 80px"}}>
              <button onClick={()=>{setUpperRoomView(null);setUserSearch("");setUserResults([]);}} style={{background:"rgba(26,22,30,0.55)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",border:"1px solid rgba(180,160,210,0.15)",borderRadius:999,padding:"8px 20px",cursor:"pointer",color:"rgba(230,220,248,0.6)",fontFamily:SANS,fontSize:"0.78rem",marginBottom:28,transition:"all 0.2s",display:"inline-flex",alignItems:"center",gap:6}}>
                Back to Upper Room
              </button>
              <div style={{textAlign:"center",marginBottom:24}}>
                <h1 style={{fontFamily:DISPLAY,fontSize:"1.5rem",fontWeight:700,color:"#D8C8F0",margin:"0 0 8px",textShadow:"0 2px 12px rgba(0,0,0,0.5)"}}>Find People</h1>
                <p style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.88rem",color:"rgba(200,190,230,0.45)",margin:0}}>Search for fellow travelers to follow.</p>
              </div>
              <div style={{display:"flex",gap:8,marginBottom:20}}>
                <input value={userSearch} onChange={e=>setUserSearch(e.target.value)} placeholder="Search by username..." onKeyDown={e=>{if(e.key==="Enter")searchUsers(userSearch);}} style={{flex:1,background:"rgba(180,160,210,0.08)",border:"1px solid rgba(180,160,210,0.15)",borderRadius:12,color:"#E8E0F0",fontFamily:SANS,fontSize:"0.85rem",padding:"10px 16px",outline:"none",boxSizing:"border-box"}}/>
                <button onClick={()=>searchUsers(userSearch)} disabled={userSearchLoading} style={{background:"rgba(180,160,210,0.12)",border:"1px solid rgba(180,160,210,0.2)",borderRadius:12,padding:"10px 18px",cursor:"pointer",color:"#D8C8F0",fontFamily:SANS,fontSize:"0.78rem",fontWeight:600,transition:"all 0.2s"}}>{userSearchLoading?"...":"Search"}</button>
              </div>
              {userResults.length===0&&!userSearchLoading&&(
                <div style={{textAlign:"center",padding:"32px 0"}}>
                  <p style={{fontFamily:SERIF,fontStyle:"italic",color:"rgba(200,190,230,0.3)",fontSize:"0.9rem"}}>Search for someone by name, or browse all community members.</p>
                  <button onClick={()=>searchUsers("")} style={{marginTop:12,background:"rgba(180,160,210,0.08)",border:"1px solid rgba(180,160,210,0.15)",borderRadius:12,padding:"8px 20px",cursor:"pointer",color:"rgba(200,190,230,0.6)",fontFamily:SANS,fontSize:"0.74rem",transition:"all 0.2s"}}>Browse all</button>
                </div>
              )}
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {userResults.map((person,idx)=>(
                  <div key={person.id} style={{display:"flex",alignItems:"center",gap:12,background:"rgba(20,18,32,0.55)",border:"1px solid rgba(180,160,210,0.12)",borderRadius:14,padding:"14px 16px",animation:`fadeUp .4s ${idx*0.04}s ease both`,opacity:0}}>
                    {person.avatarUrl
                      ?<img src={person.avatarUrl} alt="" referrerPolicy="no-referrer" style={{width:44,height:44,borderRadius:"50%",objectFit:"cover",border:"1.5px solid rgba(180,160,210,0.25)",flexShrink:0}}/>
                      :<div style={{width:44,height:44,borderRadius:"50%",flexShrink:0,background:"rgba(180,160,210,0.1)",border:"1.5px solid rgba(180,160,210,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:DISPLAY,fontSize:"1.1rem",color:"#D8C8F0"}}>{(person.username||"?")[0].toUpperCase()}</div>
                    }
                    <div style={{flex:1,cursor:"pointer"}} onClick={()=>viewProfile(person.id)}>
                      <div style={{fontFamily:SERIF,fontSize:"0.9rem",color:"#D8C8F0"}}>{person.username||"Anonymous Traveler"}</div>
                      <div style={{fontFamily:SANS,fontSize:"0.66rem",color:"rgba(200,190,230,0.35)",marginTop:2}}>{person.followersCount||0} followers</div>
                    </div>
                    <button onClick={()=>viewProfile(person.id)} style={{background:"rgba(180,160,210,0.10)",border:"1px solid rgba(180,160,210,0.18)",borderRadius:10,padding:"7px 14px",cursor:"pointer",color:"rgba(200,190,230,0.7)",fontFamily:SANS,fontSize:"0.74rem",fontWeight:600,flexShrink:0,transition:"all 0.2s"}}>Profile</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── BIBLE READER ── */}
        {bibleView&&bibleData&&(()=>{
          // Seasonal cozy-cabin room behind the whole Bible reader (Christmas, Fall,
          // Spring, …). A soft scrim keeps the verses readable while the room stays
          // clearly visible. Seasons with no art of their own use the rainy default.
          const bibleBg=getRoomTheme(roomTheme).bibleBg||BIBLE_BG_FALLBACK;
          const readerBg=`linear-gradient(rgba(10,8,16,0.5),rgba(10,8,16,0.68)), url("${bibleBg}") center/cover no-repeat, #0E0B14`;
          // Live weather falling outside the arched window glass (upper-right of the
          // cozy living-room art). Snow for Christmas to match its snowy scene; rain
          // for the rainy mountain-lake seasons. Clipped to the glass region only and
          // painted behind the verses (zIndex -1) so it never obscures the text.
          const bibleWeather=getRoomTheme(roomTheme).weather==='snow'?'snow':'rain';
          return (
          <div style={{position:"absolute",inset:0,zIndex:20,background:readerBg,display:"flex",flexDirection:"column"}}>
            {/* Weather over the window glass (behind the scrim/verses) */}
            <WindowWeather mode={bibleWeather} absolute zIndex={-1} window={{left:"58%",top:"8%",width:"39%",height:"36%",radius:"34% 34% 3% 3% / 18% 18% 2% 2%"}}/>
            {/* Header */}
            <header style={{background:"#0E0B14",padding:"0 16px",height:54,display:"flex",alignItems:"center",gap:10,boxShadow:"0 2px 16px rgba(0,0,0,0.3)",flexShrink:0,zIndex:200}}>
              <button onClick={bibleBack} style={{background:"transparent",border:"none",cursor:"pointer",color:"rgba(200,190,230,0.55)",fontSize:"0.8rem",fontFamily:SANS,padding:"4px 0",transition:"color 0.15s",whiteSpace:"nowrap"}}>{bibleView==="books"?(bibleFromCabinRef.current?"< Back":"< Upper Room"):"< Back"}</button>
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
                    <p key={i} className="verse-tap" onClick={()=>toggleVerseSelection(i)} style={{fontFamily:SERIF,fontSize:bibleFontSize,color:sel?"#FFF8E8":"#E8E0F0",lineHeight:1.85,margin:"0 0 4px",padding:"4px 10px 4px 14px",borderRadius:8,cursor:"pointer",background:sel?"rgba(212,168,64,0.12)":"transparent",borderLeft:sel?"3px solid rgba(212,168,64,0.55)":"3px solid transparent",transition:"all 0.2s ease",animation:`verseReveal .35s ${Math.min(i*0.015,1.2)}s ease both`,opacity:0,WebkitTapHighlightColor:"transparent",position:"relative"}}>
                      <span style={{fontFamily:SANS,fontSize:"0.68em",color:sel?"rgba(212,168,64,0.75)":"rgba(180,160,210,0.38)",marginRight:8,userSelect:"none",fontWeight:600,transition:"color 0.2s"}}>{i+1}</span>
                      {verse}
                      <button
                        onClick={(e)=>{e.stopPropagation();setTranslateVerse({bookIdx:bibleBook,chapter:bibleChapter,verseIdx:i});}}
                        title="Translate to original Hebrew/Greek"
                        style={{
                          marginLeft:8,verticalAlign:"baseline",
                          background:"transparent",border:"1px solid rgba(180,160,210,0.22)",
                          color:"rgba(216,200,240,0.65)",fontFamily:SANS,fontSize:"0.62em",
                          borderRadius:10,padding:"2px 9px",cursor:"pointer",
                          letterSpacing:"0.08em",textTransform:"uppercase",fontWeight:600,
                          opacity:0.75,transition:"all 0.15s",WebkitTapHighlightColor:"transparent",
                        }}
                        onMouseEnter={e=>{e.currentTarget.style.opacity="1";e.currentTarget.style.borderColor="rgba(216,200,240,0.5)";}}
                        onMouseLeave={e=>{e.currentTarget.style.opacity="0.75";e.currentTarget.style.borderColor="rgba(180,160,210,0.22)";}}
                      >א/Α</button>
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
          );
        })()}

        {/* ── ORIGINAL-LANGUAGE TRANSLATION MODAL ── */}
        {translateVerse && bibleDataRef.current && (
          <VerseTranslationModal
            bookIdx0={translateVerse.bookIdx}
            chapter0={translateVerse.chapter}
            verseIdx0={translateVerse.verseIdx}
            bookName={bibleDataRef.current[translateVerse.bookIdx]?.name || ''}
            onClose={()=>setTranslateVerse(null)}
          />
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
        <BottomMenuDrawer/>
      </div>
    );
  }

  /* ══ BECOMING HER — 90-Day Identity + Habit Journal Sanctuary ══ */
  if(screen==="becoming-her"){
    return(
      <BecomingHerScreen
        onBack={()=>setScreen("cabin")}
        progress={becomingHer}
        onProgressChange={(next)=>{setBecomingHer(next);dbSave("irj-becoming-her",next);}}
        addCandles={addCandles}
        setToast={setToast}
      />
    );
  }

  /* ══ TRACKERS — Bills / Savings / Spending / Pregnancy Hub ══ */
  if(screen==="trackers"){
    const pg = pregnancy;
    const pgInfo = pg?.setupComplete ? computeWeek(pg.dueDate) : null;
    const pregnancyStats = pg?.setupComplete ? {
      setupComplete: true,
      week: pgInfo?.week ?? null,
      daysUntilDue: pgInfo?.daysUntilDue ?? null,
      letters: pg.letters?.length || 0,
    } : { setupComplete: false };
    return(
      <TrackersScreen
        onBack={()=>setScreen("cabin")}
        progress={trackers || createEmptyTrackers()}
        onProgressChange={(next)=>{setTrackers(next);dbSave("irj-trackers",next);}}
        pregnancyStats={pregnancyStats}
        onOpenPregnancy={()=>setScreen("pregnancy")}
      />
    );
  }

  /* ══ PREGNANCY — The Nursery ══ */
  if(screen==="pregnancy"){
    return(
      <PregnancyScreen
        onBack={()=>setScreen("trackers")}
        progress={pregnancy || createEmptyPregnancy()}
        onProgressChange={(next)=>{setPregnancy(next);dbSave("irj-pregnancy",next);}}
      />
    );
  }

  /* Old profile setup overlay removed — replaced by immersive profile-onboard screen */

  /* ══ EDIT PROFILE ═══════════════════════════════════════════════ */
  if(screen==="edit-profile"&&user&&userProfile){
    const ep=userProfile;
    const [editU,setEditU]=[setupUsername,setSetupUsername];
    const [editG,setEditG]=[setupGender,setSetupGender];
    const [editB,setEditB]=[setupBio,setSetupBio];
    const canSave=usernameAvailable||editU===ep.username;
    return(
      <div style={{position:"fixed",inset:0,background:"linear-gradient(180deg,#0E0B14 0%,#1A1420 100%)",fontFamily:SANS,overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
        <style>{GFONTS}{CSS}</style>
        <div style={{maxWidth:420,margin:"0 auto",padding:"28px 22px 80px"}}>
          <button onClick={()=>{setScreen(prevScreen||"cabin");setUsernameError("");setUsernameAvailable(false);}} style={{background:"rgba(26,22,30,0.55)",backdropFilter:"blur(12px)",border:"1px solid rgba(180,160,210,0.15)",borderRadius:999,padding:"8px 20px",cursor:"pointer",color:"rgba(230,220,248,0.6)",fontFamily:SANS,fontSize:"0.78rem",marginBottom:28,display:"inline-flex",alignItems:"center",gap:6}}>
            Back
          </button>
          <div style={{textAlign:"center",marginBottom:28}}>
            {user.photoURL?<img src={user.photoURL} alt="" referrerPolicy="no-referrer" style={{width:72,height:72,borderRadius:"50%",border:"2px solid rgba(180,160,210,0.25)",marginBottom:12}}/>:<div style={{width:72,height:72,borderRadius:"50%",background:"rgba(180,160,210,0.1)",border:"2px solid rgba(180,160,210,0.25)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:DISPLAY,fontSize:"1.5rem",color:"#D8C8F0",margin:"0 auto 12px"}}>{(ep.username||"?")[0].toUpperCase()}</div>}
            <h1 style={{fontFamily:DISPLAY,fontSize:"1.5rem",fontWeight:700,color:"#D8C8F0",margin:0}}>Edit Profile</h1>
          </div>
          {/* Username */}
          <div style={{marginBottom:20}}>
            <label style={{fontFamily:SANS,fontSize:"0.68rem",letterSpacing:"0.08em",textTransform:"uppercase",color:"rgba(200,190,230,0.35)",display:"block",marginBottom:8}}>Username</label>
            <div style={{position:"relative"}}>
              <input value={editU} onChange={e=>{const v=e.target.value.replace(/[^a-zA-Z0-9_]/g,"").slice(0,20);setEditU(v);setUsernameError("");if(v===ep.username){setUsernameAvailable(false);}}} onBlur={()=>{if(editU.length>=3&&editU!==ep.username)validateUsername(editU,user.uid);}} style={{width:"100%",boxSizing:"border-box",background:"rgba(180,160,210,0.08)",border:`1px solid ${usernameError?"rgba(220,100,100,0.4)":usernameAvailable?"rgba(100,180,100,0.4)":"rgba(180,160,210,0.15)"}`,borderRadius:12,padding:"12px 40px 12px 16px",color:"#E8E0F0",fontFamily:SANS,fontSize:"0.9rem",outline:"none"}}/>
              <div style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)"}}>
                {usernameChecking&&<span style={{color:"rgba(200,190,230,0.4)",fontSize:"0.7rem"}}>...</span>}
                {usernameAvailable&&!usernameChecking&&<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6AAA6A" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
                {usernameError&&!usernameChecking&&<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#CC6666" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>}
              </div>
            </div>
            {usernameError&&<p style={{fontFamily:SANS,fontSize:"0.72rem",color:"rgba(220,120,120,0.8)",margin:"6px 0 0 4px"}}>{usernameError}</p>}
          </div>
          {/* Gender */}
          <div style={{marginBottom:20}}>
            <label style={{fontFamily:SANS,fontSize:"0.68rem",letterSpacing:"0.08em",textTransform:"uppercase",color:"rgba(200,190,230,0.35)",display:"block",marginBottom:8}}>Gender</label>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              {[["female","Daughter of God"],["male","Son of God"]].map(([val,label])=>(
                <button key={val} onClick={()=>setEditG(val)} style={{background:editG===val?"rgba(180,160,210,0.15)":"rgba(180,160,210,0.04)",border:`1.5px solid ${editG===val?"rgba(180,160,210,0.45)":"rgba(180,160,210,0.12)"}`,borderRadius:14,padding:"14px 16px",cursor:"pointer",textAlign:"center",transition:"all 0.2s"}}>
                  <div style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.92rem",color:editG===val?"#D8C8F0":"rgba(200,190,230,0.45)"}}>{label}</div>
                </button>
              ))}
            </div>
          </div>
          {/* Bio */}
          <div style={{marginBottom:20}}>
            <label style={{fontFamily:SANS,fontSize:"0.68rem",letterSpacing:"0.08em",textTransform:"uppercase",color:"rgba(200,190,230,0.35)",display:"block",marginBottom:8}}>Bio</label>
            <textarea value={editB} onChange={e=>setEditB(e.target.value.slice(0,160))} placeholder="A little about yourself..." style={{width:"100%",boxSizing:"border-box",background:"rgba(180,160,210,0.08)",border:"1px solid rgba(180,160,210,0.15)",borderRadius:12,padding:"12px 16px",color:"#E8E0F0",fontFamily:SERIF,fontSize:"0.88rem",minHeight:60,resize:"vertical",outline:"none",lineHeight:1.6}}/>
          </div>
          {/* Anonymous toggle */}
          <div style={{marginBottom:28,display:"flex",alignItems:"center",gap:12,background:"rgba(180,160,210,0.04)",border:"1px solid rgba(180,160,210,0.1)",borderRadius:12,padding:"14px 16px"}}>
            <div style={{flex:1}}>
              <div style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.88rem",color:"#D8C8F0"}}>Anonymous in communities</div>
              <div style={{fontFamily:SANS,fontSize:"0.66rem",color:"rgba(200,190,230,0.35)",marginTop:2}}>Posts show "Anonymous" instead of your name</div>
            </div>
            <button onClick={()=>{/* toggle stored in profile on save */const el=document.getElementById("anon-toggle");el.dataset.on=el.dataset.on==="true"?"false":"true";el.style.background=el.dataset.on==="true"?"rgba(100,180,100,0.4)":"rgba(180,160,210,0.15)";}} id="anon-toggle" data-on={ep.anonymous?"true":"false"} style={{width:44,height:24,borderRadius:12,background:ep.anonymous?"rgba(100,180,100,0.4)":"rgba(180,160,210,0.15)",border:"none",cursor:"pointer",position:"relative",transition:"background 0.2s",flexShrink:0}}>
              <div style={{width:18,height:18,borderRadius:9,background:"#E8E0F0",position:"absolute",top:3,left:ep.anonymous?23:3,transition:"left 0.2s",boxShadow:"0 1px 4px rgba(0,0,0,0.3)"}}/>
            </button>
          </div>
          {/* Save */}
          <button onClick={async()=>{const anonEl=document.getElementById("anon-toggle");const isAnon=anonEl?.dataset.on==="true";const ok=await saveProfileEdits(user.uid,editU,editG,editB,isAnon);if(ok)setScreen(prevScreen||"cabin");}} disabled={!canSave&&editU!==ep.username} style={{width:"100%",background:"linear-gradient(135deg,rgba(180,160,210,0.25),rgba(180,160,210,0.10))",border:"1px solid rgba(180,160,210,0.35)",borderRadius:16,padding:"14px 0",cursor:"pointer",color:"#E8E0F0",fontFamily:SERIF,fontStyle:"italic",fontSize:"1rem",transition:"all 0.3s",boxShadow:"0 4px 20px rgba(0,0,0,0.3)"}}>
            Save Changes
          </button>
        </div>
      </div>
    );
  }

  return null;
  })();

  /* ── Global menu bar — renders the sound menu on EVERY screen.
       Skip screens that already render their own BottomMenuDrawer (avoid
       duplicates) and the initial setup/welcome screens. ── */
  const __menuHasOwn = new Set(["cabin","journal","jesus","cards","hall","community","insights","map2","visit-farm","garden","shop","history","kitchen","stove","kitchen-window","market","upper-room","cozy-creations"]);
  const __menuHidden = new Set(["loading","welcome","onboard","profile-onboard","blog-post","write-blog"]);
  /* ── Global profile / sign-out panel — the menu's "Profile" button sets
       windowPanel="profile" on every screen, but only CabinScreen renders the
       panel. Render it globally (except on the cabin, which has its own) so the
       user can reach their profile + sign out from anywhere (e.g. the porch). ── */
  const __profilePanel = (windowPanel==="profile" && screen!=="cabin") && (
    <div style={{position:"fixed",inset:0,zIndex:300}}>
      <div onClick={()=>setWindowPanel(null)} style={{position:"absolute",inset:0,background:"rgba(10,8,6,0.5)",animation:"spaceFadeIn .25s ease"}}/>
      <div style={{position:"absolute",left:0,top:0,bottom:0,width:"min(82vw,360px)",background:"linear-gradient(180deg,rgba(26,22,18,0.96),rgba(20,16,12,0.98))",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",borderRight:"1px solid rgba(201,169,110,0.15)",animation:"windowPanelSlideLeft .35s ease both",display:"flex",flexDirection:"column",padding:"48px 28px 36px"}}>
        <button onClick={()=>setWindowPanel(null)} style={{position:"absolute",top:16,right:16,width:32,height:32,borderRadius:"50%",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(201,169,110,0.15)",color:"rgba(255,248,232,0.5)",fontSize:"0.75rem",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:24}}>
          {user?.photoURL?(<img src={user.photoURL} alt="" referrerPolicy="no-referrer" style={{width:52,height:52,borderRadius:"50%",border:"2px solid rgba(201,169,110,0.3)",objectFit:"cover"}}/>):(<div style={{width:52,height:52,borderRadius:"50%",background:"rgba(201,169,110,0.12)",border:"2px solid rgba(201,169,110,0.25)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.4rem",color:B.goldL,fontFamily:DISPLAY,fontWeight:700}}>{user?.displayName?.[0]||"?"}</div>)}
          <div>
            <h3 style={{fontFamily:DISPLAY,fontSize:"1.15rem",fontWeight:700,color:"#FFF8E8",margin:"0 0 3px"}}>{user?.displayName||"Journaler"}</h3>
            <div style={{fontFamily:SANS,fontSize:"0.7rem",color:"rgba(255,248,232,0.4)"}}>{user?.email}</div>
          </div>
        </div>
        <div style={{width:"100%",height:1,background:"linear-gradient(90deg,rgba(201,169,110,0.3),transparent)",marginBottom:22}}/>
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
        <button onClick={()=>{setWindowPanel(null);goToHistory();}} style={{width:"100%",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(201,169,110,0.15)",borderRadius:10,padding:"13px 18px",color:B.goldL,fontFamily:SANS,fontSize:"0.82rem",cursor:"pointer",transition:"all .2s",marginBottom:8,display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:"1rem"}}>📖</span> Reflection History
        </button>
        <div style={{flex:1}}/>
        <button onClick={()=>{setWindowPanel(null);setScreen("edit-profile");}} style={{width:"100%",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(201,169,110,0.15)",borderRadius:10,padding:"13px 18px",color:B.goldL,fontFamily:SANS,fontSize:"0.82rem",cursor:"pointer",transition:"all .2s",marginTop:12,display:"flex",alignItems:"center",gap:10}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(201,169,110,0.5)" strokeWidth="1.8"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Edit Profile
        </button>
        <button onClick={()=>{handleSignOut();setWindowPanel(null);}} style={{width:"100%",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(201,169,110,0.15)",borderRadius:10,padding:"13px 18px",color:"rgba(255,248,232,0.45)",fontFamily:SANS,fontSize:"0.82rem",cursor:"pointer",transition:"all .2s",marginTop:8}}>Sign out</button>
        <div style={{textAlign:"center",marginTop:14}}>
          <p style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.68rem",color:"rgba(255,248,232,0.15)"}}>Tap outside to close</p>
        </div>
      </div>
    </div>
  );

  return(<>
    {__screenJSX}
    {!__menuHasOwn.has(screen) && !__menuHidden.has(screen) && <BottomMenuDrawer/>}
    {__profilePanel}
  </>);
}

export default function App(){return<ErrorBoundary><AppInner/></ErrorBoundary>;}
