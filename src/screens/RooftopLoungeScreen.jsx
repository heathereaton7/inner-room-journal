import { useState, useEffect } from 'react';
import { GFONTS, B, SERIF, SANS, DISPLAY, SKYLIGHT_STAIRCASE_IMAGE } from '../constants.js';
import { CSS } from '../styles.js';
import ImmersiveRooftop from '../components/ImmersiveRooftop.jsx';
import CharacterWalker from '../components/CharacterWalker.jsx';

export default function RooftopLoungeScreen({
  spaceTransit, transitDir, transitionToCabin,
  candles, bank, playerAppearance,
}){
  // Skylight climb-through transition — plays once on arrival
  const [climbPhase, setClimbPhase] = useState("climbing"); // "climbing" | "emerging" | "done"

  useEffect(()=>{
    // Phase 1: show skylight staircase view, slowly zoom in (0 → 1.8s)
    // Phase 2: cross-fade to rooftop (1.8s → 3s)
    // Phase 3: fully on rooftop
    const t1 = setTimeout(()=> setClimbPhase("emerging"), 1800);
    const t2 = setTimeout(()=> setClimbPhase("done"), 3200);
    return()=>{clearTimeout(t1);clearTimeout(t2);};
  },[]);

  const climbCSS = `
    @keyframes skylightClimb {
      0%   { transform: scale(1) translateY(0);     opacity: 1; }
      60%  { transform: scale(1.8) translateY(-12%); opacity: 1; }
      100% { transform: scale(2.6) translateY(-20%); opacity: 0; }
    }
    @keyframes rooftopReveal {
      0%   { opacity: 0; }
      100% { opacity: 1; }
    }
  `;

  return(
    <div style={{position:"fixed",inset:0,overflow:"hidden",fontFamily:SANS}}>
      <style>{GFONTS}{CSS}{climbCSS}</style>

      {/* Full-screen rooftop background with parallax + fireflies */}
      <div style={{
        opacity: climbPhase==="done" ? 1 : climbPhase==="emerging" ? 1 : 0,
        animation: climbPhase==="emerging" ? "rooftopReveal 1.4s ease both" : "none",
        position:"absolute",inset:0,zIndex:0,
      }}>
        <ImmersiveRooftop/>
      </div>

      {/* ── Walkable character (appears after climb transition) ── */}
      {climbPhase==="done" && (
        <CharacterWalker
          appearance={playerAppearance}
          spawnX={78}
          spawnY={58}
          speed={10}
          scale={1.6}
          zIndex={18}
        />
      )}

      {/* ── SKYLIGHT CLIMB TRANSITION ── */}
      {climbPhase!=="done"&&(
        <div style={{
          position:"fixed",inset:0,zIndex:50,overflow:"hidden",
          background:"#0A0806",
          pointerEvents: climbPhase==="emerging" ? "none" : "all",
        }}>
          {/* Skylight staircase image — zooms in as if climbing up through it */}
          <img
            src={SKYLIGHT_STAIRCASE_IMAGE}
            alt=""
            style={{
              position:"absolute",
              width:"100%",height:"100%",
              objectFit:"cover",
              animation:"skylightClimb 3.2s cubic-bezier(0.3,0,0.2,1) forwards",
              transformOrigin:"55% 15%", /* zoom toward the walkway/path at the top */
            }}
            draggable={false}
          />
          {/* Warm lantern glow overlay */}
          <div style={{position:"absolute",inset:0,pointerEvents:"none",background:"radial-gradient(ellipse at 50% 50%, rgba(255,180,80,0.08) 0%, transparent 60%)",mixBlendMode:"screen"}}/>
          {/* Dark vignette */}
          <div style={{position:"absolute",inset:0,pointerEvents:"none",background:"radial-gradient(ellipse at center, transparent 25%, rgba(10,8,6,0.65) 100%)"}}/>
          {/* Text */}
          <div style={{position:"absolute",bottom:"12%",left:"50%",transform:"translateX(-50%)",zIndex:10,textAlign:"center",animation:"fadeUp 0.8s 0.3s ease both",pointerEvents:"none"}}>
            <div style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"1rem",color:"rgba(255,248,232,0.45)",letterSpacing:"0.04em"}}>Climbing to the rooftop...</div>
          </div>
          {/* Bright flash at the end as you "emerge" into the light */}
          {climbPhase==="emerging"&&(
            <div style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:20,background:"rgba(255,240,220,0.15)",animation:"rooftopReveal 0.4s ease reverse both"}}/>
          )}
        </div>
      )}

      {/* Currency display — top left */}
      {climbPhase==="done"&&(
        <div style={{position:"absolute",left:"3%",top:"4%",zIndex:12,background:"rgba(18,8,24,0.7)",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",border:"1px solid rgba(180,140,200,0.15)",borderRadius:10,padding:"5px 12px",display:"flex",alignItems:"center",gap:10,animation:"fadeUp 1s 0.3s ease both",cursor:"default"}}>
          <div style={{display:"flex",alignItems:"center",gap:4}}>
            <span style={{fontSize:"0.8rem"}}>{"\uD83D\uDD6F\uFE0F"}</span>
            <span style={{fontFamily:DISPLAY,fontSize:"0.82rem",fontWeight:700,color:B.goldL}}>{candles}</span>
          </div>
          <div style={{width:1,height:14,background:"rgba(180,140,200,0.2)"}}/>
          <div style={{display:"flex",alignItems:"center",gap:4}}>
            <span style={{fontSize:"0.75rem",color:"rgba(220,200,255,0.7)"}}>o</span>
            <span style={{fontFamily:DISPLAY,fontSize:"0.82rem",fontWeight:700,color:"rgba(220,200,255,0.85)"}}>{bank.coins}</span>
          </div>
        </div>
      )}

      {/* Back to cabin — top right */}
      {climbPhase==="done"&&(
        <button onClick={transitionToCabin} style={{position:"absolute",right:"3%",top:"4%",zIndex:12,background:"rgba(18,8,24,0.6)",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",border:"1px solid rgba(180,140,200,0.15)",borderRadius:999,padding:"6px 16px",cursor:"pointer",color:"rgba(220,200,255,0.6)",fontFamily:SANS,fontSize:"0.7rem",transition:"all 0.2s",display:"inline-flex",alignItems:"center",gap:5,animation:"fadeUp 1s 0.3s ease both",boxShadow:"0 2px 12px rgba(0,0,0,0.3)"}}>
          <span style={{fontSize:"0.65rem"}}>{"\u2193"}</span> Down to cabin
        </button>
      )}

      {/* Rooftop label — fades in after arrival */}
      {climbPhase==="done"&&(
        <div style={{position:"absolute",bottom:"6%",left:"50%",transform:"translateX(-50%)",zIndex:12,animation:"fadeUp 1.5s 0.5s ease both",pointerEvents:"none",textAlign:"center"}}>
          <div style={{fontFamily:DISPLAY,fontSize:"1.1rem",fontWeight:700,color:"rgba(220,200,255,0.30)",letterSpacing:"0.08em",textTransform:"uppercase"}}>Rooftop Lounge</div>
          <div style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.75rem",color:"rgba(220,200,255,0.18)",marginTop:4}}>A quiet place above the world</div>
        </div>
      )}

      {/* Space transition overlay (for going back down) */}
      {spaceTransit&&<div style={{position:"fixed",inset:0,zIndex:9999,background:"#0A0806",display:"flex",alignItems:"center",justifyContent:"center",animation:"spaceFadeIn .5s ease"}}>
        <div style={{textAlign:"center",animation:"fadeUp .6s .15s ease both"}}>
          <div style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"1.05rem",color:"rgba(255,248,232,0.5)",letterSpacing:"0.04em"}}>{transitDir==="toCabin"?"Heading back down...":"Climbing to the rooftop..."}</div>
        </div>
      </div>}
    </div>
  );
}
