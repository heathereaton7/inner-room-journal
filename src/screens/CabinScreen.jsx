import { useState, useRef, useCallback, useEffect } from 'react';
import { GFONTS, B, SERIF, SANS, DISPLAY, SHELF_BOOKS, BOOK_COVERS, BOOK_CONTENT, REFLECTION_ROOMS, LOCKED_ROOM, JESUS_QUESTIONS, VIRAL_QS, th, wc, todayStr, nowTime, getBookPageCount, CABIN_FALLBACK_IMAGE, AVATAR_NAV } from '../constants.js';
import { SHOP_ITEMS } from '../items.js';
import { ITEMS, isPlaceable } from '../items.js';
import { CSS } from '../styles.js';
import { useRoomTheme, INNER_ROOM_LANDING_FALLBACK } from '../systems/roomThemes.js';
import CharacterWalker from '../components/CharacterWalker.jsx';
import BookSparkles from '../components/BookSparkles.jsx';
import { moveItem, removeFromRoom, placeItem } from '../roomDecor.js';

export default function CabinScreen({
  spaceTransit, transitDir, transitionToMap, transitionToKitchen, transitionToRooftop, transitionToJournal, transitionToCozyCreations,
  cabinMode, cabin3DReady, debugHotspots, debugTripleTap,
  bookOpen, setBookOpen, deskBook, shelfAnim, bookPage, flipDir, bookText, setBookText,
  bookSaveMsg, setBookSaveMsg, journalSection, setJournalSection, journalZoom,
  selectShelfBook, flipPage, bookTouchStart, bookTouchEnd, TOTAL_BOOK_PAGES,
  windowPanel, setWindowPanel, showInsights, setShowInsights,
  streak, showStreak, candleReward, candles, bank, tapCandle, addCandles,
  entries, totalWords, themeData, roomProg,
  ownedItems, toast, user,
  handleSignOut, prayerPosts,
  enterRoom, persistEntries,
  renderSectionHistory, savePrayerJournalEntry, saveBookEntry,
  setFlipDir, setBookPage, setHistoryMode, historyMode,
  jesusIdx, setScreen, setJourneyTab,
  setCardQ, setIsCustomCard, setCardCustom,
  menuOpen, setMenuOpen,
  BottomMenuDrawer, goToHistory,
  playerRoom, onRoomChange, inventory, addToInventory, removeFromInventory,
  playerAppearance,
}){
  const roomThemeData = useRoomTheme();
  const cabinBgImage = roomThemeData.cabin || CABIN_FALLBACK_IMAGE;
  // The cabin landing is now the cozy "Inner Room" reading nook (per-season).
  const landingBgImage = roomThemeData.landing || INNER_ROOM_LANDING_FALLBACK;
  // Cabin corner chrome (Back to village pill, Kitchen button, currency badge)
  // is hidden on the nook landing for now — only the desk book is tappable.
  // Flip to true to bring the old cabin navigation back.
  const SHOW_CABIN_CHROME = false;
  const [selectedDecor, setSelectedDecor] = useState(null);
  const [draggingDecor, setDraggingDecor] = useState(null);
  const [dragPos, setDragPos] = useState(null);
  const [showBag, setShowBag] = useState(false);
  // Loft view: the OLD cozy-loft cabin interior (cabin-interior.png), reached
  // via the upstairs middle door on the grand hall map. Holds the original
  // loft hotspots (book→journal, staircase→rooftop, etc.).
  const [loftView, setLoftView] = useState(false);
  // Desk-book chooser: tapping the book on the desk opens a swipeable picker of
  // books. Slide 0 = Journals (the Inner Room journal); slide 1 = Meditations
  // (a cover you'll design in Canva → /meditations-cover.png, with Psalm 1:2).
  const [bookChooser, setBookChooser] = useState(false);
  const [chooserIdx, setChooserIdx] = useState(0); // 0 = Journals, 1 = Meditations
  const [medOpen, setMedOpen] = useState(false);   // Meditations cover + verse view
  const [medImgOk, setMedImgOk] = useState(false); // true once /meditations-cover.png loads
  const [lbImgOk, setLbImgOk] = useState(false);   // true once /leakybucket.png loads
  const openBookChooser = useCallback(() => { setChooserIdx(0); setBookChooser(true); }, []);
  const containerRef = useRef(null);

  const handleDecorTap = useCallback((itemId, e) => {
    e.stopPropagation();
    setSelectedDecor(prev => prev === itemId ? null : itemId);
  }, []);

  const startDrag = useCallback((itemId) => {
    setSelectedDecor(null);
    setDraggingDecor(itemId);
    const item = playerRoom?.placed?.find(p => p.id === itemId);
    if (item) setDragPos({ left: item.left, top: item.top });
  }, [playerRoom]);

  const handleDragMove = useCallback((e) => {
    if (!draggingDecor || !containerRef.current) return;
    e.preventDefault();
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const left = Math.max(2, Math.min(98, ((clientX - rect.left) / rect.width) * 100));
    const top = Math.max(2, Math.min(98, ((clientY - rect.top) / rect.height) * 100));
    setDragPos({ left, top });
  }, [draggingDecor]);

  const endDrag = useCallback(() => {
    if (!draggingDecor || !dragPos) { setDraggingDecor(null); setDragPos(null); return; }
    const next = moveItem(playerRoom, draggingDecor, Math.round(dragPos.left * 10) / 10, Math.round(dragPos.top * 10) / 10);
    if (onRoomChange) onRoomChange(next);
    setDraggingDecor(null);
    setDragPos(null);
  }, [draggingDecor, dragPos, playerRoom, onRoomChange]);

  // Put away: remove from room → add to inventory
  const handleStow = useCallback((itemId) => {
    const next = removeFromRoom(playerRoom, itemId);
    if (onRoomChange) onRoomChange(next);
    if (addToInventory) addToInventory(itemId, 1);
    setSelectedDecor(null);
  }, [playerRoom, onRoomChange, addToInventory]);

  // Place from inventory: remove from inventory → add to room
  const handlePlaceFromInventory = useCallback((itemId) => {
    if (removeFromInventory) removeFromInventory(itemId, 1);
    const next = placeItem(playerRoom, itemId);
    if (onRoomChange) onRoomChange(next);
  }, [playerRoom, onRoomChange, removeFromInventory]);

  // Placeable items in inventory (the "bag")
  const placeableInInventory = Object.entries(inventory || {})
    .filter(([id, qty]) => qty > 0 && isPlaceable(id));

  // Listen for menu "Stored Items" button
  useEffect(() => {
    const handler = () => setShowBag(true);
    window.addEventListener('open-bag', handler);
    return () => window.removeEventListener('open-bag', handler);
  }, []);

  return(
    <div ref={containerRef} style={{position:"fixed",inset:0,overflow:"hidden",fontFamily:SANS}}
      onMouseMove={draggingDecor?handleDragMove:undefined}
      onMouseUp={draggingDecor?endDrag:undefined}
      onTouchMove={draggingDecor?handleDragMove:undefined}
      onTouchEnd={draggingDecor?endDrag:undefined}
      onClick={()=>{if(selectedDecor)setSelectedDecor(null);}}
    >
      <style>{GFONTS}{CSS}</style>

      {/* ── Full-screen cabin background ── */}
      {/* cabinMode "immersive" = parallax fallback (temporary until real 3D cabin is built) */}
      {/* cabinMode "3d" = future React Three Fiber scene (swap in when GLB is ready) */}
      {loftView?(
        /* OLD cabin landing — cozy loft interior, reached via the upstairs door */
        <div style={{position:"absolute",inset:0,zIndex:0,background:"#060402",animation:"spaceFadeIn .5s ease"}}>
          <img src="/cabin-interior.png" alt="Cabin loft" draggable={false} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",userSelect:"none",WebkitUserDrag:"none",pointerEvents:"none"}}/>
          {/* Cinematic vignette to match the hall */}
          <div style={{position:"absolute",inset:0,pointerEvents:"none",background:"radial-gradient(ellipse at center, transparent 42%, rgba(8,6,4,0.5) 100%)"}}/>
        </div>
      ):cabinMode==="3d"&&cabin3DReady?(
        /* Future: <CabinScene3D/> — will render the real GLB model here */
        <div style={{position:"absolute",inset:0,background:"#060402",zIndex:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <span style={{color:"rgba(255,248,232,0.3)",fontFamily:SERIF,fontStyle:"italic",fontSize:"0.8rem"}}>3D cabin loading…</span>
        </div>
      ):(
        /* Cabin landing — the cozy "Inner Room" reading nook (per-season).
           The only interactive spot is "The Inner Room" book on the desk,
           which opens your books (Journals / Meditations / Leaky Bucket). */
        <div style={{position:"absolute",inset:0,zIndex:0,background:"#0A0806",animation:"spaceFadeIn .6s ease"}}>
          <img src={landingBgImage} alt="The Inner Room" draggable={false} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",objectPosition:"center 72%",userSelect:"none",WebkitUserDrag:"none",pointerEvents:"none"}}/>
          {/* Soft cinematic vignette */}
          <div style={{position:"absolute",inset:0,pointerEvents:"none",background:"radial-gradient(ellipse at 60% 80%, transparent 40%, rgba(8,6,4,0.42) 100%)"}}/>

          {/* THE ONLY HOTSPOT — "The Inner Room" book on the desk → your books */}
          <button onClick={()=>openBookChooser()} aria-label="Open The Inner Room book" style={{position:"absolute",left:"50%",top:"80%",width:"46%",height:"19%",zIndex:11,background:"transparent",border:"none",padding:0,cursor:"pointer",borderRadius:"12px",outline:"none",WebkitTapHighlightColor:"transparent"}}>
            <div style={{position:"absolute",left:"14%",top:"6%",width:"72%",height:"88%",borderRadius:"45%",background:"radial-gradient(ellipse at 50% 50%,rgba(255,215,130,0.28) 0%,rgba(255,190,90,0.10) 45%,transparent 72%)",pointerEvents:"none",animation:"hotspotPulse 2.8s ease-in-out infinite"}}/>
            <div style={{position:"absolute",left:"28%",top:"18%",width:"44%",height:"64%",borderRadius:"50%",background:"radial-gradient(circle,rgba(255,245,180,0.18) 0%,transparent 55%)",pointerEvents:"none",animation:"hotspotPulse 3.3s ease-in-out infinite",animationDelay:"0.8s"}}/>
          </button>
        </div>
      )}

      {/* ── Walkable character ── */}
      {AVATAR_NAV && !bookOpen && !showBag && !windowPanel && !showInsights && (
        <CharacterWalker
          appearance={playerAppearance}
          spawnX={75}
          spawnY={68}
          speed={10}
          scale={1.6}
          zIndex={18}
        />
      )}

      {/* ── All placed decor items (unified) ── */}
      {playerRoom?.placed?.map(item=>{
        const config=ITEMS[item.id];
        if(!config?.decor) return null;
        const d=config.decor;
        const isDragging=draggingDecor===item.id;
        const pos=isDragging&&dragPos?dragPos:item;
        return(
          <div key={`${item.id}-${item.left}-${item.top}`} style={{
            position:"absolute",
            left:`${pos.left}%`, top:`${pos.top}%`,
            width:d.width||"18%",
            transform:"translate(-50%,-50%)",
            zIndex:isDragging?200:15,
            filter:d.filter||(isDragging?"brightness(1.3)":"none"),
            cursor:isDragging?"grabbing":"pointer",
            transition:isDragging?"none":"left 0.15s ease, top 0.15s ease",
            animation:isDragging?"none":"fadeUp 0.8s ease both",
            touchAction:"none",
            padding:8,
          }}
            onClick={(e)=>handleDecorTap(item.id,e)}
            onTouchStart={(e)=>{if(draggingDecor)return;e.stopPropagation();handleDecorTap(item.id,e);}}
          >
            {d.glow&&!isDragging&&(
              <div style={{position:"absolute",left:"50%",top:"60%",width:d.glow.size,paddingBottom:d.glow.size,transform:"translate(-50%,-50%)",borderRadius:"50%",background:`radial-gradient(circle,${d.glow.color},transparent 70%)`,pointerEvents:"none",filter:"blur(4px)"}}/>
            )}
            <img src={d.src} alt={config.name||item.id} draggable={false} style={{width:"100%",height:"auto",display:"block",position:"relative",pointerEvents:"none"}} onError={e=>{e.target.parentNode.style.display="none";}}/>
            {selectedDecor===item.id&&!isDragging&&(
              <div onClick={e=>e.stopPropagation()} style={{position:"absolute",left:"50%",bottom:"105%",transform:"translateX(-50%)",zIndex:210,display:"flex",gap:6,animation:"fadeUp 0.2s ease both"}}>
                <button onClick={(e)=>{e.stopPropagation();startDrag(item.id);}} style={{background:"rgba(26,22,18,0.92)",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",border:"1px solid rgba(201,169,110,0.25)",borderRadius:10,padding:"7px 14px",cursor:"pointer",color:"rgba(255,248,232,0.8)",fontFamily:SANS,fontSize:"0.68rem",fontWeight:600,whiteSpace:"nowrap",boxShadow:"0 4px 16px rgba(0,0,0,0.4)"}}>Move</button>
                <button onClick={(e)=>{e.stopPropagation();handleStow(item.id);}} style={{background:"rgba(26,22,18,0.92)",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",border:"1px solid rgba(201,169,110,0.25)",borderRadius:10,padding:"7px 14px",cursor:"pointer",color:"rgba(255,248,232,0.8)",fontFamily:SANS,fontSize:"0.68rem",fontWeight:600,whiteSpace:"nowrap",boxShadow:"0 4px 16px rgba(0,0,0,0.4)"}}>Put away</button>
              </div>
            )}
          </div>
        );
      })}

      {/* Drag mode indicator */}
      {draggingDecor&&(
        <div style={{position:"fixed",top:16,left:"50%",transform:"translateX(-50%)",zIndex:300,background:"rgba(26,22,18,0.9)",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",border:"1px solid rgba(201,169,110,0.3)",borderRadius:12,padding:"8px 20px",pointerEvents:"none"}}>
          <span style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.78rem",color:"rgba(255,248,232,0.7)"}}>Drag to reposition, then release</span>
        </div>
      )}

      {/* Bag button — show if placeable items exist in inventory */}
      {placeableInInventory.length>0&&!bookOpen&&!showBag&&!windowPanel&&(
        <button onClick={()=>setShowBag(true)} style={{position:"absolute",left:"3%",bottom:"18%",zIndex:12,width:38,height:38,borderRadius:"50%",background:"rgba(26,22,18,0.75)",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",border:"1px solid rgba(201,169,110,0.2)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 12px rgba(0,0,0,0.3)",animation:"fadeUp 1s 1.5s ease both"}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,248,232,0.6)" strokeWidth="1.8"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
        </button>
      )}

      {/* Bag drawer — shows placeable items from inventory */}
      {showBag&&(
        <div style={{position:"fixed",inset:0,zIndex:80}}>
          <div onClick={()=>setShowBag(false)} style={{position:"absolute",inset:0,background:"rgba(10,8,6,0.5)",animation:"spaceFadeIn .2s ease"}}/>
          <div style={{position:"absolute",bottom:0,left:0,right:0,background:"rgba(26,22,18,0.96)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",borderTop:"1px solid rgba(201,169,110,0.2)",borderRadius:"20px 20px 0 0",padding:"20px 24px 32px",animation:"insightsSlideUp .3s ease both",maxHeight:"40vh",overflowY:"auto"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
              <h3 style={{fontFamily:DISPLAY,fontSize:"1rem",fontWeight:700,color:B.goldL,margin:0}}>Stored Items</h3>
              <button onClick={()=>setShowBag(false)} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(201,169,110,0.15)",borderRadius:"50%",width:28,height:28,cursor:"pointer",color:"rgba(255,248,232,0.5)",fontSize:"0.7rem",display:"flex",alignItems:"center",justifyContent:"center"}}>&#10005;</button>
            </div>
            {placeableInInventory.length===0&&(
              <p style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.82rem",color:"rgba(255,248,232,0.3)",textAlign:"center",padding:"16px 0"}}>No stored items</p>
            )}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(80px,1fr))",gap:12}}>
              {placeableInInventory.map(([itemId,qty])=>{
                const config=ITEMS[itemId];
                if(!config?.decor) return null;
                return(
                  <button key={itemId} onClick={()=>{handlePlaceFromInventory(itemId);setShowBag(false);}} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(201,169,110,0.15)",borderRadius:12,padding:"12px 8px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:6,transition:"all .2s"}}>
                    <img src={config.decor.src} alt={config.name||itemId} style={{width:40,height:"auto"}} draggable={false}/>
                    <span style={{fontFamily:SANS,fontSize:"0.6rem",color:"rgba(255,248,232,0.6)",textAlign:"center"}}>{config.name||itemId}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ═══ INTERACTIVE HOTSPOTS ═══ */}
      {/* Positions mapped to new cabin image: cozy loft — stone fireplace LEFT, large window CENTER,
          spiral staircase RIGHT, desk with "The Inner Room" book FOREGROUND, rug CENTER FLOOR,
          window seat with pillows CENTER-BACK, skylight TOP, string lights across ceiling beams */}
      {/* ─── HOW TO EDIT HOTSPOTS ───
          Each hotspot is a <button> with absolute positioning (left/right/top/bottom as %).
          To reposition: change the left/top/width/height percentages.
          To change navigation: change the onClick function.
          Glow class: "magic-hotspot" + animation:"magicGlow ..." for the enchanted look.
          The outer <div> with magicGlowOuter adds the soft radial aura around each hotspot. ─── */}

      {/* ── OLD LOFT HOTSPOTS — only over the cozy-loft view (cabin-interior.png) ── */}
      {loftView && (<>
      {/* 1. THE INNER ROOM BOOK — center of desk foreground → book chooser (Journals / Meditations) */}
      <button onClick={()=>openBookChooser()} style={{position:"absolute",left:"28%",top:"74%",width:"38%",height:"14%",zIndex:11,background:"transparent",border:"none",padding:0,cursor:"pointer",borderRadius:"10px",outline:"none",WebkitTapHighlightColor:"transparent"}}>
        {/* Pulse glow on "The Inner Room" book */}
        <div style={{position:"absolute",left:"20%",top:"5%",width:"60%",height:"90%",borderRadius:"45%",background:"radial-gradient(ellipse at 50% 50%,rgba(255,215,130,0.30) 0%,rgba(255,190,90,0.10) 45%,transparent 72%)",pointerEvents:"none",animation:"hotspotPulse 2.8s ease-in-out infinite"}}/>
        <div style={{position:"absolute",left:"30%",top:"15%",width:"40%",height:"70%",borderRadius:"50%",background:"radial-gradient(circle,rgba(255,245,180,0.20) 0%,transparent 55%)",pointerEvents:"none",animation:"hotspotPulse 3.3s ease-in-out infinite",animationDelay:"0.8s"}}/>
      </button>

      {/* 2. SPIRAL STAIRCASE — right side → rooftop lounge (up the spiral stairs) */}
      <button onClick={()=>transitionToRooftop()} style={{position:"absolute",right:"0%",top:"12%",width:"28%",height:"58%",zIndex:12,background:"transparent",border:"none",padding:0,cursor:"pointer",borderRadius:"8px",outline:"none",WebkitTapHighlightColor:"transparent"}}>
        {/* Pulse glow along spiral staircase */}
        <div style={{position:"absolute",left:"20%",top:"30%",width:"60%",height:"40%",borderRadius:"45%",background:"radial-gradient(ellipse at 50% 50%,rgba(255,210,120,0.25) 0%,rgba(255,180,80,0.08) 45%,transparent 72%)",pointerEvents:"none",animation:"hotspotPulse 3s ease-in-out infinite"}}/>
        <div style={{position:"absolute",left:"30%",top:"38%",width:"40%",height:"28%",borderRadius:"50%",background:"radial-gradient(ellipse at 50% 50%,rgba(255,240,170,0.15) 0%,transparent 55%)",pointerEvents:"none",animation:"hotspotPulse 3.5s ease-in-out infinite",animationDelay:"0.7s"}}/>
      </button>

      {/* 3. NOTEBOOK ON DESK — left side of desk near lantern → world map */}
      <button onClick={()=>transitionToMap()} style={{position:"absolute",left:"8%",top:"76%",width:"20%",height:"12%",zIndex:11,background:"transparent",border:"none",padding:0,cursor:"pointer",borderRadius:"8px",outline:"none",WebkitTapHighlightColor:"transparent"}}>
        {/* Pulse glow on notebook */}
        <div style={{position:"absolute",left:"15%",top:"5%",width:"70%",height:"90%",borderRadius:"50%",background:"radial-gradient(circle,rgba(255,220,120,0.28) 0%,rgba(255,190,80,0.10) 40%,transparent 72%)",pointerEvents:"none",animation:"hotspotPulse 2.6s ease-in-out infinite"}}/>
        <div style={{position:"absolute",left:"25%",top:"15%",width:"50%",height:"70%",borderRadius:"50%",background:"radial-gradient(circle,rgba(255,245,180,0.18) 0%,transparent 55%)",pointerEvents:"none",animation:"hotspotPulse 3s ease-in-out infinite",animationDelay:"0.5s"}}/>
      </button>

      {/* 4. FIREPLACE — stone fireplace on left → ambient sounds */}
      <button onClick={()=>{if(typeof window!=="undefined")window.dispatchEvent(new Event("toggle-fireplace"));}} style={{position:"absolute",left:"0%",top:"22%",width:"18%",height:"32%",zIndex:10,background:"transparent",border:"none",padding:0,cursor:"pointer",borderRadius:"8px",outline:"none",WebkitTapHighlightColor:"transparent"}}>
        <div style={{position:"absolute",left:"20%",top:"30%",width:"70%",height:"50%",borderRadius:"50%",background:"radial-gradient(circle,rgba(255,160,60,0.08) 0%,transparent 60%)",pointerEvents:"none"}}/>
      </button>

      {/* 5. WINDOW SEAT — reading nook with pillows → future expansion */}
      {/* Currently a subtle interactive zone, can be used for ambient view or Scripture reading */}

      {/* 7. INSIGHTS — center area on the fluffy white rug */}
      <button onClick={()=>setShowInsights(true)} style={{position:"absolute",left:"20%",right:"28%",top:"48%",height:"17%",zIndex:10,background:"transparent",border:"none",cursor:"pointer",borderRadius:"8px"}}>
        <div style={{position:"absolute",inset:"-10%",borderRadius:"50%",background:"radial-gradient(circle,rgba(255,200,80,0.04),transparent 60%)",pointerEvents:"none"}}/>
      </button>
      </>)}

      {/* Back to hall — only in the loft view */}
      {loftView && (
        <button onClick={()=>setLoftView(false)} style={{position:"absolute",left:"50%",bottom:"4%",transform:"translateX(-50%)",zIndex:14,background:"rgba(26,22,18,0.7)",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",border:"1px solid rgba(201,169,110,0.18)",borderRadius:999,padding:"7px 18px",cursor:"pointer",color:"rgba(255,248,232,0.6)",fontFamily:SANS,fontSize:"0.72rem",display:"inline-flex",alignItems:"center",gap:6,animation:"fadeUp 0.8s ease both",boxShadow:"0 2px 12px rgba(0,0,0,0.3)"}}>
          <span style={{fontSize:"0.7rem"}}>&#8595;</span> Back to the hall
        </button>
      )}

      {/* Shelf book hotspots removed — Scripture, Gratitude, Prophecy & Words,
          and Becoming Her are now accessible from the "Choose Your Path" menu
          inside the Inner Room Journal (alongside the other journals). */}

      {/* CURRENCY BALANCE — candles + coins (triple-tap = toggle debug hotspots) */}
      {SHOW_CABIN_CHROME && (
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
      )}

      {/* Back to village — top-right navigation */}
      {SHOW_CABIN_CHROME && (
      <button onClick={()=>transitionToMap()} style={{position:"absolute",right:"3%",top:"4%",zIndex:12,background:"rgba(26,22,18,0.6)",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",border:"1px solid rgba(201,169,110,0.15)",borderRadius:999,padding:"6px 16px",cursor:"pointer",color:"rgba(255,248,232,0.55)",fontFamily:SANS,fontSize:"0.7rem",transition:"all 0.2s",display:"inline-flex",alignItems:"center",gap:5,animation:"fadeUp 1s 2s ease both",boxShadow:"0 2px 12px rgba(0,0,0,0.25)"}}>
        <span style={{fontSize:"0.65rem"}}>&#8592;</span> Back to village
      </button>
      )}

      {/* ═══ HOTSPOT DEBUG OVERLAY (2D only) ═══ */}
      {debugHotspots&&<>
        <div style={{position:"fixed",top:8,left:"50%",transform:"translateX(-50%)",zIndex:999,background:"rgba(255,60,60,0.85)",color:"#fff",fontFamily:SANS,fontSize:"0.65rem",fontWeight:700,padding:"4px 14px",borderRadius:20,letterSpacing:"0.04em",pointerEvents:"none",backdropFilter:"blur(6px)",WebkitBackdropFilter:"blur(6px)",whiteSpace:"nowrap"}}>DEBUG HOTSPOTS ON</div>
        {/* 1. Inner Room book on desk */}
        <div style={{position:"absolute",left:"28%",top:"74%",width:"38%",height:"14%",zIndex:900,background:"rgba(100,100,255,0.25)",border:"2px solid rgba(100,100,255,0.7)",borderRadius:10,pointerEvents:"none",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontFamily:SANS,fontSize:"0.5rem",fontWeight:700,color:"#fff",background:"rgba(60,60,255,0.75)",padding:"2px 6px",borderRadius:8}}>BOOK → Journal</span></div>
        {/* 2. Spiral staircase */}
        <div style={{position:"absolute",right:"0%",top:"12%",width:"28%",height:"58%",zIndex:900,background:"rgba(100,255,100,0.25)",border:"2px solid rgba(100,255,100,0.7)",borderRadius:8,pointerEvents:"none",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontFamily:SANS,fontSize:"0.5rem",fontWeight:700,color:"#fff",background:"rgba(60,180,60,0.85)",padding:"2px 6px",borderRadius:8}}>STAIRS → Rooftop Lounge</span></div>
        {/* 3. Notebook on desk */}
        <div style={{position:"absolute",left:"8%",top:"76%",width:"20%",height:"12%",zIndex:900,background:"rgba(255,100,100,0.25)",border:"2px solid rgba(255,100,100,0.7)",borderRadius:8,pointerEvents:"none",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontFamily:SANS,fontSize:"0.5rem",fontWeight:700,color:"#fff",background:"rgba(255,60,60,0.75)",padding:"2px 6px",borderRadius:8}}>NOTEBOOK → World Map</span></div>
        {/* 4. Fireplace */}
        <div style={{position:"absolute",left:"0%",top:"22%",width:"18%",height:"32%",zIndex:900,background:"rgba(255,180,60,0.25)",border:"2px solid rgba(255,180,60,0.7)",borderRadius:8,pointerEvents:"none",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontFamily:SANS,fontSize:"0.5rem",fontWeight:700,color:"#fff",background:"rgba(200,120,20,0.85)",padding:"2px 6px",borderRadius:8}}>FIREPLACE</span></div>
        {/* 7. Insights (rug) */}
        <div style={{position:"absolute",left:"20%",right:"28%",top:"48%",height:"17%",zIndex:900,background:"rgba(0,200,200,0.2)",border:"2px solid rgba(0,200,200,0.7)",borderRadius:8,pointerEvents:"none",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontFamily:SANS,fontSize:"0.5rem",fontWeight:700,color:"#fff",background:"rgba(0,150,150,0.85)",padding:"2px 6px",borderRadius:8}}>INSIGHTS</span></div>
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

      {/* ═══ TOAST NOTIFICATION ═══ */}
      {toast&&<div style={{position:"fixed",bottom:"12%",left:"50%",transform:"translateX(-50%)",zIndex:70,animation:"candleFloat 2.8s ease both",pointerEvents:"none"}}>
        <div style={{background:"rgba(26,22,18,0.92)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",border:"1px solid rgba(201,169,110,0.25)",borderRadius:14,padding:"10px 20px",display:"flex",alignItems:"center",gap:8,boxShadow:"0 6px 24px rgba(0,0,0,0.4)",whiteSpace:"nowrap"}}>
          {toast.emoji&&<span style={{fontSize:"1.1rem"}}>{toast.emoji}</span>}
          <span style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.82rem",color:"rgba(255,248,232,0.75)"}}>{toast.msg}</span>
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
            {/* Edit Profile */}
            <button onClick={()=>{setWindowPanel(null);setScreen("edit-profile");}} style={{width:"100%",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(201,169,110,0.15)",borderRadius:10,padding:"13px 18px",color:B.goldL,fontFamily:SANS,fontSize:"0.82rem",cursor:"pointer",transition:"all .2s",marginTop:12,display:"flex",alignItems:"center",gap:10}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(201,169,110,0.5)" strokeWidth="1.8"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Edit Profile
            </button>
            {/* Sign out */}
            <button onClick={()=>{handleSignOut();setWindowPanel(null);}} style={{width:"100%",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(201,169,110,0.15)",borderRadius:10,padding:"13px 18px",color:"rgba(255,248,232,0.45)",fontFamily:SANS,fontSize:"0.82rem",cursor:"pointer",transition:"all .2s",marginTop:8}}>Sign out</button>
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

      {/* ═══ DESK-BOOK CHOOSER — swipe between Journals & Meditations ═══ */}
      {bookChooser&&<div style={{position:"fixed",inset:0,zIndex:120}}>
        {/* Backdrop */}
        <div onClick={()=>setBookChooser(false)} style={{position:"absolute",inset:0,background:"rgba(10,8,6,0.80)",backdropFilter:"blur(4px)",WebkitBackdropFilter:"blur(4px)",animation:"spaceFadeIn .3s ease"}}/>
        <BookSparkles/>
        {/* Centered column: heading above the books, books laid out side by side */}
        <div style={{position:"absolute",inset:0,zIndex:2,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"clamp(18px,5vh,38px)",padding:"9% 14px 8%",overflowY:"auto"}}>
          {/* Heading */}
          <div style={{textAlign:"center",flexShrink:0,animation:"fadeUp .6s ease both",pointerEvents:"none"}}>
            <h2 style={{fontFamily:DISPLAY,fontSize:"clamp(1.35rem,5.5vw,1.75rem)",fontWeight:700,color:B.goldL,margin:0,letterSpacing:"0.04em"}}>Your Books</h2>
            <p style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.8rem",color:"rgba(255,248,232,0.5)",margin:"6px 0 0"}}>Tap a book to open</p>
          </div>
          {/* Books — side by side */}
          <div style={{display:"flex",flexWrap:"wrap",alignItems:"flex-start",justifyContent:"center",gap:"clamp(12px,3.5vw,30px)",width:"100%",maxWidth:560}}>
            {/* ── Book 1: JOURNALS ── */}
            <div style={{width:"clamp(96px,27vw,172px)",display:"flex",flexDirection:"column",alignItems:"center",gap:12}}>
              <button onClick={()=>{setBookChooser(false);transitionToJournal();}} style={{width:"100%",aspectRatio:"2 / 3",borderRadius:"4px 11px 11px 4px",border:"none",padding:0,cursor:"pointer",position:"relative",overflow:"hidden",boxShadow:"0 16px 44px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,169,110,0.22)",animation:"fadeUp .5s ease both"}}>
                <img src="/journalondesk.png" alt="The Inner Room journal" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",objectPosition:"center 46%"}} draggable={false}/>
                {/* Spine + edge sheen for a book feel */}
                <div style={{position:"absolute",left:0,top:0,bottom:0,width:14,background:"linear-gradient(90deg,rgba(20,12,4,0.55),rgba(20,12,4,0.12),transparent)",pointerEvents:"none"}}/>
                <div style={{position:"absolute",inset:0,boxShadow:"inset 0 0 50px rgba(0,0,0,0.35)",borderRadius:"inherit",pointerEvents:"none"}}/>
              </button>
              <div style={{textAlign:"center",animation:"fadeUp .6s .1s ease both"}}>
                <div style={{fontFamily:DISPLAY,fontSize:"0.92rem",fontWeight:700,color:B.goldL,letterSpacing:"0.03em"}}>Journals</div>
                <div style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.64rem",color:"rgba(255,248,232,0.45)",marginTop:3,lineHeight:1.35}}>The Inner Room journal</div>
              </div>
            </div>
            {/* ── Book 2: MEDITATIONS ── */}
            <div style={{width:"clamp(96px,27vw,172px)",display:"flex",flexDirection:"column",alignItems:"center",gap:12}}>
              <button onClick={()=>{setBookChooser(false);setMedOpen(true);}} style={{width:"100%",aspectRatio:"2 / 3",borderRadius:"4px 11px 11px 4px",border:"none",padding:0,cursor:"pointer",position:"relative",overflow:"hidden",background:"linear-gradient(160deg,#33230F 0%,#2A1B0C 45%,#1E1307 100%)",boxShadow:"0 16px 44px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,169,110,0.22)",animation:"fadeUp .5s ease both"}}>
                {/* Themed placeholder cover (shown until your Canva /meditations-cover.png exists) */}
                <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",padding:"16% 13%"}}>
                  <div style={{position:"absolute",inset:"7%",border:"1px solid rgba(201,169,110,0.38)",borderRadius:6,boxShadow:"inset 0 0 26px rgba(201,169,110,0.12)",pointerEvents:"none"}}/>
                  <div style={{position:"absolute",inset:"9.5%",border:"1px solid rgba(201,169,110,0.18)",borderRadius:4,pointerEvents:"none"}}/>
                  <span style={{fontSize:"1.45rem",marginBottom:10}}>🕯️</span>
                  <div style={{fontFamily:DISPLAY,fontSize:"clamp(1.05rem,4.6vw,1.35rem)",fontWeight:700,color:"#E8C98A",letterSpacing:"0.07em"}}>Meditations</div>
                  <div style={{width:34,height:1,background:"linear-gradient(90deg,transparent,#C9A96E,transparent)",margin:"11px 0"}}/>
                  <p style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.68rem",lineHeight:1.65,color:"rgba(245,230,200,0.78)",margin:0}}>&ldquo;…in his law doth he meditate day and night.&rdquo;</p>
                  <div style={{fontFamily:SANS,fontSize:"0.56rem",letterSpacing:"0.12em",color:"rgba(201,169,110,0.6)",marginTop:9}}>PSALM 1:2 · KJV</div>
                </div>
                {/* Swappable Canva design — covers the placeholder once the file is added */}
                <img src="/meditations-cover.png" alt="Meditations" onLoad={()=>setMedImgOk(true)} onError={()=>{}} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",display:medImgOk?"block":"none"}} draggable={false}/>
                <div style={{position:"absolute",left:0,top:0,bottom:0,width:14,background:"linear-gradient(90deg,rgba(20,12,4,0.55),rgba(20,12,4,0.12),transparent)",pointerEvents:"none"}}/>
              </button>
              <div style={{textAlign:"center",animation:"fadeUp .6s .1s ease both"}}>
                <div style={{fontFamily:DISPLAY,fontSize:"0.92rem",fontWeight:700,color:B.goldL,letterSpacing:"0.03em"}}>Meditations</div>
                <div style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.64rem",color:"rgba(255,248,232,0.45)",marginTop:3,lineHeight:1.35}}>Meditate on His word, day and night</div>
              </div>
            </div>
            {/* ── Book 3: THE LEAKY BUCKET ── */}
            <div style={{width:"clamp(96px,27vw,172px)",display:"flex",flexDirection:"column",alignItems:"center",gap:12}}>
              <button onClick={()=>{setBookChooser(false);setScreen("leaky-bucket");}} style={{width:"100%",aspectRatio:"2 / 3",borderRadius:"4px 11px 11px 4px",border:"none",padding:0,cursor:"pointer",position:"relative",overflow:"hidden",background:"linear-gradient(160deg,#27414C 0%,#1C313A 48%,#13242B 100%)",boxShadow:"0 16px 44px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,169,110,0.22)",animation:"fadeUp .5s ease both"}}>
                <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",padding:"16% 13%"}}>
                  <div style={{position:"absolute",inset:"7%",border:"1px solid rgba(201,169,110,0.38)",borderRadius:6,boxShadow:"inset 0 0 26px rgba(95,168,201,0.14)",pointerEvents:"none"}}/>
                  <div style={{position:"absolute",inset:"9.5%",border:"1px solid rgba(201,169,110,0.18)",borderRadius:4,pointerEvents:"none"}}/>
                  <span style={{fontSize:"1.45rem",marginBottom:10}}>🪣</span>
                  <div style={{fontFamily:DISPLAY,fontSize:"clamp(1.0rem,4.4vw,1.3rem)",fontWeight:700,color:"#E8C98A",letterSpacing:"0.05em"}}>The Leaky Bucket</div>
                  <div style={{width:34,height:1,background:"linear-gradient(90deg,transparent,#C9A96E,transparent)",margin:"11px 0"}}/>
                  <p style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.68rem",lineHeight:1.65,color:"rgba(245,230,200,0.78)",margin:0}}>&ldquo;…broken cisterns, that can hold no water.&rdquo;</p>
                  <div style={{fontFamily:SANS,fontSize:"0.56rem",letterSpacing:"0.12em",color:"rgba(201,169,110,0.6)",marginTop:9}}>JEREMIAH 2:13 · KJV</div>
                </div>
                {/* Photographic cover — covers the placeholder once the file loads */}
                <img src="/leakybucket.png" alt="The Leaky Bucket" onLoad={()=>setLbImgOk(true)} onError={()=>{}} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",display:lbImgOk?"block":"none"}} draggable={false}/>
                {/* Title plate over the photo */}
                {lbImgOk&&<div style={{position:"absolute",left:0,right:0,bottom:0,padding:"34% 12% 12%",background:"linear-gradient(to top,rgba(8,10,12,0.92) 8%,rgba(8,10,12,0.6) 50%,transparent)",pointerEvents:"none",textAlign:"center"}}>
                  <div style={{fontFamily:DISPLAY,fontSize:"clamp(1.0rem,4.4vw,1.3rem)",fontWeight:700,color:"#E8C98A",letterSpacing:"0.05em"}}>The Leaky Bucket</div>
                  <div style={{width:34,height:1,background:"linear-gradient(90deg,transparent,#C9A96E,transparent)",margin:"8px auto"}}/>
                  <p style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.66rem",lineHeight:1.55,color:"rgba(245,230,200,0.85)",margin:0}}>&ldquo;…broken cisterns, that can hold no water.&rdquo;</p>
                  <div style={{fontFamily:SANS,fontSize:"0.54rem",letterSpacing:"0.12em",color:"rgba(201,169,110,0.7)",marginTop:7}}>JEREMIAH 2:13 · KJV</div>
                </div>}
                <div style={{position:"absolute",left:0,top:0,bottom:0,width:14,background:"linear-gradient(90deg,rgba(20,12,4,0.55),rgba(20,12,4,0.12),transparent)",pointerEvents:"none",zIndex:2}}/>
              </button>
              <div style={{textAlign:"center",animation:"fadeUp .6s .1s ease both"}}>
                <div style={{fontFamily:DISPLAY,fontSize:"0.92rem",fontWeight:700,color:B.goldL,letterSpacing:"0.03em"}}>The Leaky Bucket</div>
                <div style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.64rem",color:"rgba(255,248,232,0.45)",marginTop:3,lineHeight:1.35}}>Episode One · what truly holds</div>
              </div>
            </div>
          </div>
        </div>
        {/* Close */}
        <button onClick={()=>setBookChooser(false)} aria-label="Close" style={{position:"absolute",top:"6%",right:"5%",zIndex:5,width:34,height:34,borderRadius:"50%",background:"rgba(26,22,18,0.6)",border:"1px solid rgba(201,169,110,0.18)",color:"rgba(255,248,232,0.6)",fontSize:"0.85rem",cursor:"pointer",backdropFilter:"blur(6px)",WebkitBackdropFilter:"blur(6px)"}}>&#10005;</button>
      </div>}

      {/* ═══ MEDITATIONS — verse + list of all meditations in the app ═══ */}
      {medOpen&&<div style={{position:"fixed",inset:0,zIndex:125}}>
        <div onClick={()=>setMedOpen(false)} style={{position:"absolute",inset:0,background:"rgba(10,8,6,0.78)",backdropFilter:"blur(3px)",WebkitBackdropFilter:"blur(3px)",animation:"spaceFadeIn .3s ease"}}/>
        <BookSparkles/>
        <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:"min(88vw,420px)",height:"min(78vh,640px)",animation:"bookOpenAnim .5s cubic-bezier(.22,1,.36,1) both",display:"flex",flexDirection:"column"}}>
          {/* Leather spine */}
          <div style={{position:"absolute",left:-6,top:4,bottom:4,width:13,background:"linear-gradient(90deg,#2E1E10,#4A3220,#3D2B18,#2E1E10)",borderRadius:"4px 0 0 4px",boxShadow:"2px 0 12px rgba(0,0,0,0.4)",zIndex:3}}/>
          <div style={{position:"absolute",right:-3,top:8,bottom:8,width:6,background:"linear-gradient(90deg,#E8D5B0,#DCC89C,#D4BF90)",borderRadius:"0 2px 2px 0",zIndex:1}}/>
          {/* Cream page */}
          <div style={{flex:1,background:"linear-gradient(155deg,#F5E6C8 0%,#ECD9B5 35%,#E4CFA5 70%,#DCC89C 100%)",borderRadius:"3px 10px 10px 3px",position:"relative",overflow:"hidden",boxShadow:"0 4px 30px rgba(0,0,0,0.4), inset 0 0 80px rgba(139,109,69,0.12)"}}>
            <div style={{position:"relative",zIndex:2,height:"100%",display:"flex",flexDirection:"column",alignItems:"center",padding:"30px 24px 24px",overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
              <span style={{fontSize:"1.5rem",marginBottom:8}}>🕯️</span>
              <h2 style={{fontFamily:DISPLAY,fontSize:"clamp(1.4rem,5.5vw,1.75rem)",fontWeight:700,color:"#3D2B18",margin:"0 0 6px",letterSpacing:"0.04em",textAlign:"center"}}>Meditations</h2>
              <p style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.82rem",color:"#4A3826",lineHeight:1.6,maxWidth:280,margin:"0 0 2px",textAlign:"center"}}>&ldquo;…in his law doth he meditate day and night.&rdquo;</p>
              <div style={{fontFamily:SANS,fontSize:"0.62rem",letterSpacing:"0.1em",color:"rgba(107,85,58,0.6)"}}>PSALM 1:2 · KJV</div>
              <div style={{width:54,height:1,background:"linear-gradient(90deg,transparent,#8B6D45,transparent)",margin:"16px 0 18px"}}/>
              <div style={{width:"100%",maxWidth:340,display:"flex",flexDirection:"column",gap:11}}>
                {[
                  {id:"conceive-meditations",label:"Trying to Conceive",desc:"Verses to meditate on while you wait and hope"},
                  {id:"pregnancy-meditations",label:"Pregnancy Meditations",desc:"A verse, prayer, and affirmation each week"},
                  {id:"father-meditations",label:"Father's Meditations",desc:"Weekly verse, prayer, and declaration for dad"},
                ].map(m=>(
                  <button key={m.id} onClick={()=>{setMedOpen(false);setBookChooser(false);setScreen(m.id);}} style={{background:"rgba(139,109,69,0.06)",border:"1px solid rgba(139,109,69,0.18)",borderRadius:10,padding:"13px 16px",cursor:"pointer",textAlign:"left",transition:"all .2s"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(139,109,69,0.12)"} onMouseLeave={e=>e.currentTarget.style.background="rgba(139,109,69,0.06)"}>
                    <div style={{fontFamily:DISPLAY,fontSize:"0.95rem",fontWeight:700,color:"#3D2B18",marginBottom:2}}>{m.label}</div>
                    <div style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.76rem",color:"rgba(107,85,58,0.55)"}}>{m.desc}</div>
                  </button>
                ))}
              </div>
              <button onClick={()=>{setMedOpen(false);setChooserIdx(1);setBookChooser(true);}} style={{marginTop:20,background:"linear-gradient(135deg,rgba(93,74,46,0.1),rgba(93,74,46,0.04))",border:"1px solid rgba(93,74,46,0.22)",color:"#5C4A2E",padding:"10px 26px",borderRadius:8,fontFamily:SERIF,fontStyle:"italic",fontSize:"0.82rem",cursor:"pointer"}}>&#8249; Back to your books</button>
            </div>
          </div>
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
                        {id:"bible",label:"Scripture",desc:"Sit with the questions Jesus asked"},
                        {id:"gratitude",label:"Gratitude",desc:"Name the small graces"},
                        {id:"prophecy",label:"Prophecy & Words",desc:"Record words spoken over you"},
                        {id:"becoming-her",label:"Becoming Her",desc:"90-day identity & habit journey"},
                        {id:"check-in",label:"Body & Mind Check-In",desc:"Notice what you're carrying"},
                        {id:"trackers",label:"Trackers",desc:"Bills, savings, and spending"},
                        {id:"fertility-tracker",label:"Conception Tracker",desc:"Cycle, ovulation, and fertile window"},
                      ].map(opt=>(
                        <button key={opt.id} onClick={()=>{if(opt.id==="check-in"){setBookOpen(false);setScreen("check-in");return;}if(opt.id==="trackers"){setBookOpen(false);setScreen("trackers");return;}if(opt.id==="fertility-tracker"){setBookOpen(false);setScreen("fertility-tracker");return;}if(opt.id==="bible"||opt.id==="gratitude"||opt.id==="prophecy"||opt.id==="becoming-her"){setBookOpen(false);selectShelfBook(opt.id);return;}setJournalSection(opt.id);setBookPage(2);setFlipDir("fwd");setBookText("");setBookSaveMsg("");setHistoryMode("list");}} style={{background:"rgba(139,109,69,0.06)",border:"1px solid rgba(139,109,69,0.15)",borderRadius:10,padding:"14px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:12,transition:"all .2s",textAlign:"left"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(139,109,69,0.12)"} onMouseLeave={e=>e.currentTarget.style.background="rgba(139,109,69,0.06)"}>
                          <div>
                            <div style={{fontFamily:DISPLAY,fontSize:"0.92rem",fontWeight:700,color:"#3D2B18",marginBottom:2}}>{opt.label}</div>
                            <div style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.76rem",color:"rgba(107,85,58,0.5)"}}>{opt.desc}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </>}

                {/* ── SECTION: BLANK JOURNAL HISTORY (page 2) ── */}
                {journalSection==="blank"&&bookPage===2&&<>
                  <div style={{flex:1,display:"flex",flexDirection:"column",animation:"pageContentReveal .5s .1s ease both"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                      <button onClick={()=>{setJournalSection(null);setBookPage(1);setFlipDir("bwd");}} style={{background:"transparent",border:"none",cursor:"pointer",fontFamily:SERIF,fontSize:"0.74rem",color:"rgba(107,85,58,0.5)",padding:0}}>&#8249; Contents</button>
                    </div>
                    <h2 style={{fontFamily:DISPLAY,fontSize:"clamp(1.05rem,4vw,1.2rem)",fontWeight:700,color:"#3D2B18",margin:"0 0 10px",textAlign:"center"}}>Past Entries</h2>
                    <div style={{width:40,height:1,background:"linear-gradient(90deg,transparent,rgba(139,109,69,0.3),transparent)",margin:"0 auto 12px"}}/>
                    {renderSectionHistory(
                      entries.filter(e=>e.roomId==="blank"),
                      "entry",
                      ()=>{setBookPage(3);setFlipDir("fwd");setBookText("");setHistoryMode("list");}
                    )}
                  </div>
                </>}

                {/* ── SECTION: BLANK JOURNAL (free write, page 3) ── */}
                {journalSection==="blank"&&bookPage===3&&<>
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
                      <button onClick={()=>{const e={id:Date.now().toString(),date:todayStr(),time:nowTime(),roomId:"blank",roomLabel:"Blank Journal",roomEmoji:"📝",day:0,prompt:"Free write",text:bookText.trim(),words:wc(bookText)};persistEntries([e,...entries]);addCandles(3,"Reflection saved +3");setBookSaveMsg("Saved!");setTimeout(()=>setBookSaveMsg(""),2500);}} style={{background:"linear-gradient(135deg,#5C4A2E,#3D2B18)",border:"none",color:"#F5E6C8",padding:"6px 18px",borderRadius:6,cursor:"pointer",fontSize:"0.76rem",fontFamily:SANS,fontWeight:600}}>Save</button>
                    </div>}
                  </div>
                </>}

                {/* ── SECTION: REFLECTION ROOMS ── */}
                {journalSection==="rooms"&&bookPage>=2&&<>
                  {(()=>{
                    const roomIdx=bookPage-2; // 0=entries, 1-7=rooms, 8=jesus, 9=locked, 10=daily
                    return<div style={{flex:1,display:"flex",flexDirection:"column",animation:"pageContentReveal .5s .1s ease both"}}>
                      <div style={{display:"flex",alignItems:"center",marginBottom:10}}>
                        <button onClick={()=>{setJournalSection(null);setBookPage(1);setFlipDir("bwd");}} style={{background:"transparent",border:"none",cursor:"pointer",fontFamily:SERIF,fontSize:"0.74rem",color:"rgba(107,85,58,0.5)",padding:0}}>&#8249; Contents</button>
                      </div>
                      {/* Past Reflections (roomIdx 0, page 2) */}
                      {roomIdx===0&&<>
                        <h2 style={{fontFamily:DISPLAY,fontSize:"clamp(1.05rem,4vw,1.2rem)",fontWeight:700,color:"#3D2B18",margin:"0 0 10px",textAlign:"center"}}>Past Reflections</h2>
                        <div style={{width:40,height:1,background:"linear-gradient(90deg,transparent,rgba(139,109,69,0.3),transparent)",margin:"0 auto 12px"}}/>
                        {renderSectionHistory(
                          entries.filter(e=>REFLECTION_ROOMS.some(r=>r.id===e.roomId)||e.roomId==="jesus"),
                          "reflection",
                          ()=>{setBookPage(3);setFlipDir("fwd");setHistoryMode("list");}
                        )}
                      </>}
                      {/* Reflection Rooms (pages 3-9, roomIdx 1-7) */}
                      {roomIdx>=1&&roomIdx<=REFLECTION_ROOMS.length&&(()=>{
                        const room=REFLECTION_ROOMS[roomIdx-1],prog=roomProg(room),done=prog>=room.days.length,currentDay=Math.min(prog,room.days.length-1),dayData=room.days[currentDay];
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
                      {/* Jesus Questions (roomIdx 8) */}
                      {roomIdx===REFLECTION_ROOMS.length+1&&(()=>{
                        const jq=JESUS_QUESTIONS[Math.min(jesusIdx,JESUS_QUESTIONS.length-1)];
                        if(!jq) return null;
                        return<>
                        <div style={{textAlign:"center",marginBottom:14}}>
                          <div style={{fontSize:"1.8rem",marginBottom:8}}>&#10013;&#65039;</div>
                          <h2 style={{fontFamily:DISPLAY,fontSize:"clamp(1.1rem,4.5vw,1.3rem)",fontWeight:700,color:"#3D2B18",margin:"0 0 4px",textAlign:"center"}}>Questions Jesus Asked</h2>
                        </div>
                        <div style={{width:40,height:1,background:"linear-gradient(90deg,transparent,rgba(139,109,69,0.3),transparent)",margin:"0 auto 16px"}}/>
                        <p style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"clamp(0.88rem,3vw,1rem)",color:"#5C4A2E",lineHeight:1.7,textAlign:"center",margin:"0 4px"}}>"{jq.q}"</p>
                        <p style={{fontFamily:SANS,fontSize:"0.66rem",color:"rgba(107,85,58,0.4)",margin:"8px 0 0",textAlign:"center"}}>{jq.ref}</p>
                        <div style={{background:"rgba(139,109,69,0.06)",borderRadius:8,padding:"12px 16px",margin:"18px 0",border:"1px solid rgba(139,109,69,0.1)"}}>
                          <p style={{fontFamily:SERIF,fontSize:"0.82rem",color:"#4A3826",lineHeight:1.55,margin:0,textAlign:"center"}}>{jq.app}</p>
                        </div>
                        <div style={{flex:1}}/>
                        <button className="book-room" onClick={()=>{setBookOpen(false);setScreen("jesus");}} style={{alignSelf:"center",background:"linear-gradient(135deg,rgba(93,74,46,0.1),rgba(93,74,46,0.04))",border:"1px solid rgba(93,74,46,0.22)",color:"#5C4A2E",padding:"11px 32px",borderRadius:8,fontFamily:SERIF,fontStyle:"italic",fontSize:"0.84rem",cursor:"pointer",transition:"all .2s"}}>Open Scripture questions</button>
                      </>;})()}
                      {/* Locked Room (roomIdx 9) */}
                      {roomIdx===REFLECTION_ROOMS.length+2&&(()=>{
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
                      {/* Daily Question (roomIdx 10) */}
                      {roomIdx===REFLECTION_ROOMS.length+3&&(()=>{
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
                      <div style={{textAlign:"center",fontFamily:SANS,fontSize:"0.6rem",color:"rgba(107,85,58,0.3)",letterSpacing:"0.1em",textTransform:"uppercase",marginTop:10}}>{bookPage+1} of {TOTAL_BOOK_PAGES}</div>
                    </div>;
                  })()}
                </>}

                {/* ── SECTION: DREAM JOURNAL ── */}
                {journalSection==="dreams"&&bookPage>=2&&(()=>{
                  const dreamPages=BOOK_CONTENT.dreams?.pages||[];
                  /* Page 2: Dream History */
                  if(bookPage===2) return<div style={{flex:1,display:"flex",flexDirection:"column",animation:"pageContentReveal .5s .1s ease both"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                      <button onClick={()=>{setJournalSection(null);setBookPage(1);setFlipDir("bwd");}} style={{background:"transparent",border:"none",cursor:"pointer",fontFamily:SERIF,fontSize:"0.74rem",color:"rgba(107,85,58,0.5)",padding:0}}>&#8249; Contents</button>
                    </div>
                    <h2 style={{fontFamily:DISPLAY,fontSize:"clamp(1.05rem,4vw,1.2rem)",fontWeight:700,color:"#3D2B18",margin:"0 0 10px",textAlign:"center"}}>Dream History</h2>
                    <div style={{width:40,height:1,background:"linear-gradient(90deg,transparent,rgba(139,109,69,0.3),transparent)",margin:"0 auto 12px"}}/>
                    {renderSectionHistory(
                      entries.filter(e=>e.roomId==="dreams"),
                      "dream",
                      ()=>{setBookPage(3);setFlipDir("fwd");setBookText("");setHistoryMode("list");}
                    )}
                  </div>;
                  /* Pages 3+: Dream prompts */
                  const pgIdx=bookPage-3;
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
                      <button onClick={()=>{const e={id:Date.now().toString(),date:todayStr(),time:nowTime(),roomId:"dreams",roomLabel:"Dream Journal",roomEmoji:"🌙",day:pgIdx,prompt:pg.prompt,text:bookText.trim(),words:wc(bookText)};persistEntries([e,...entries]);addCandles(3,"Dream saved +3");setBookSaveMsg("Saved!");setTimeout(()=>setBookSaveMsg(""),2500);}} style={{background:"linear-gradient(135deg,#5C4A2E,#3D2B18)",border:"none",color:"#F5E6C8",padding:"6px 18px",borderRadius:6,cursor:"pointer",fontSize:"0.76rem",fontFamily:SANS,fontWeight:600}}>Save</button>
                    </div>}
                  </div>;
                })()}

                {/* ── SECTION: PRAYER JOURNAL ── */}
                {journalSection==="prayers"&&bookPage>=2&&<>
                  <div style={{flex:1,display:"flex",flexDirection:"column",animation:"pageContentReveal .5s .1s ease both"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                      <button onClick={()=>{setJournalSection(null);setBookPage(1);setFlipDir("bwd");}} style={{background:"transparent",border:"none",cursor:"pointer",fontFamily:SERIF,fontSize:"0.74rem",color:"rgba(107,85,58,0.5)",padding:0}}>&#8249; Contents</button>
                    </div>
                    {/* Page 2: Prayer history with garden status */}
                    {bookPage===2&&<>
                      <h2 style={{fontFamily:DISPLAY,fontSize:"clamp(1.05rem,4vw,1.2rem)",fontWeight:700,color:"#3D2B18",margin:"0 0 10px",textAlign:"center"}}>Your Prayers</h2>
                      <div style={{width:40,height:1,background:"linear-gradient(90deg,transparent,rgba(139,109,69,0.3),transparent)",margin:"0 auto 12px"}}/>
                      {renderSectionHistory(
                        prayerPosts.map(p=>({...p,words:wc(p.text||""),roomId:"prayers",prompt:p.tag||""})),
                        "prayer",
                        ()=>{setBookPage(3);setFlipDir("fwd");setBookText("");setHistoryMode("list");},
                        true
                      )}
                    </>}
                    {/* Page 3: Write a prayer */}
                    {bookPage===3&&<>
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
                  if(!pg) return null;
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
          {/* Cabin zooms toward the desk/book area (center-foreground) */}
          <div style={{position:"absolute",inset:0,transformOrigin:"48% 80%",animation:"walkToJournalZoom 1.4s cubic-bezier(0.4,0,0.2,1) forwards"}}>
            <img src={cabinBgImage} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} draggable={false}/>
            {/* Warm glow intensifies on "The Inner Room" book during zoom */}
            <div style={{position:"absolute",left:"30%",top:"72%",width:"34%",height:"18%",borderRadius:"45%",background:"radial-gradient(ellipse at 50% 50%,rgba(255,215,130,0.35) 0%,rgba(255,190,90,0.12) 45%,transparent 72%)",mixBlendMode:"screen"}}/>
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

      {/* Kitchen — bottom right quick access */}
      {SHOW_CABIN_CHROME&&!bookOpen&&!showInsights&&!shelfAnim&&(
        <button onClick={()=>transitionToKitchen()} style={{position:"fixed",bottom:32,right:24,zIndex:12,background:"rgba(26,22,18,0.7)",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",border:"1px solid rgba(201,169,110,0.15)",borderRadius:14,padding:"10px 18px",cursor:"pointer",color:"rgba(255,248,232,0.55)",fontFamily:SANS,fontSize:"0.72rem",fontWeight:600,transition:"all 0.2s",display:"flex",alignItems:"center",gap:6,animation:"fadeUp 1s 1s ease both",boxShadow:"0 2px 12px rgba(0,0,0,0.3)"}}>
          <span style={{fontSize:"0.8rem",opacity:0.7}}>&#8595;</span> Kitchen
        </button>
      )}

      {/* ═══ SPACE TRANSITION OVERLAY ═══ */}
      {spaceTransit&&<div style={{position:"fixed",inset:0,zIndex:9999,background:"#0A0806",display:"flex",alignItems:"center",justifyContent:"center",animation:"spaceFadeIn .5s ease"}}>
        <div style={{textAlign:"center",animation:"fadeUp .6s .15s ease both"}}>
          <div style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"1.05rem",color:"rgba(255,248,232,0.5)",letterSpacing:"0.04em"}}>{transitDir==="toHall"?"Stepping into The Upper Room...":transitDir==="toRooftop"?"Climbing to the rooftop...":transitDir==="toKitchen"?"Heading downstairs...":transitDir==="toGarden"?"Walking to the garden...":"Returning to the cabin..."}</div>
        </div>
      </div>}
      <BottomMenuDrawer/>
    </div>
  );
}
