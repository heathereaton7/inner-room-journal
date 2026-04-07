import { useState, useEffect, useRef } from 'react';
import { GFONTS, B, SERIF, SANS, DISPLAY, SKYLIGHT_STAIRCASE_IMAGE } from '../constants.js';
import { CSS } from '../styles.js';
import ImmersiveRooftop from '../components/ImmersiveRooftop.jsx';
import CharacterWalker from '../components/CharacterWalker.jsx';
import { resolveSprite } from '../overworld/sprites.js';

// Waypoints for auto-walk up the staircase in FINALSKYLIGHT image
// Staircase starts bottom-right of the skylight opening, spirals counterclockwise
// up to the wooden deck on the left, then the stone trail goes up-right
const CLIMB_PATH = [
  { x: 95, y: 97 },   // far bottom-right, base of staircase
  { x: 93, y: 85 },   // first steps curving up
  { x: 88, y: 72 },   // mid spiral, still far right
  { x: 78, y: 58 },   // upper spiral, starting to curve left
  { x: 68, y: 48 },   // near top of staircase
  { x: 62, y: 40 },   // reaching the top landing
  { x: 64, y: 32 },   // hooks right onto the deck/trail
  { x: 76, y: 22 },   // on the stone trail going up-right
  { x: 84, y: 14 },   // climbing the trail
  { x: 90, y: 5 },    // disappearing off the top-right
];
const WALK_SPEED = 10; // % per second

export default function RooftopLoungeScreen({
  spaceTransit, transitDir, transitionToCabin,
  candles, bank, playerAppearance,
}){
  const [climbPhase, setClimbPhase] = useState("climbing"); // "climbing" | "emerging" | "done"
  const spriteRef = useRef(null);
  const animRef = useRef(null);
  const pathIdx = useRef(0);
  const posRef = useRef({ x: CLIMB_PATH[0].x, y: CLIMB_PATH[0].y });
  const frameRef = useRef(0);
  const frameTimer = useRef(0);
  const lastTs = useRef(0);

  const sprite = resolveSprite(playerAppearance);
  const SPRITE_SCALE = 1.6;
  const SW = 40 * SPRITE_SCALE;
  const SH = 40 * SPRITE_SCALE;
  const FRAME_DUR = 150;

  // Auto-walk the character along the path
  useEffect(() => {
    if (climbPhase !== "climbing") return;
    pathIdx.current = 0;
    posRef.current = { x: CLIMB_PATH[0].x, y: CLIMB_PATH[0].y };
    lastTs.current = 0;

    const loop = (ts) => {
      if (!lastTs.current) lastTs.current = ts;
      const dt = Math.min((ts - lastTs.current) / 1000, 0.05);
      lastTs.current = ts;

      const target = CLIMB_PATH[pathIdx.current + 1];
      if (!target) {
        // Reached the end — trigger transition
        setClimbPhase("emerging");
        return;
      }

      const dx = target.x - posRef.current.x;
      const dy = target.y - posRef.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const step = WALK_SPEED * dt;

      if (dist <= step) {
        // Snap to waypoint, advance
        posRef.current.x = target.x;
        posRef.current.y = target.y;
        pathIdx.current++;
      } else {
        // Move toward waypoint
        posRef.current.x += (dx / dist) * step;
        posRef.current.y += (dy / dist) * step;
      }

      // Determine facing direction
      let dir = 'up';
      if (Math.abs(dx) > Math.abs(dy)) {
        dir = dx > 0 ? 'right' : 'left';
      } else {
        dir = dy > 0 ? 'down' : 'up';
      }

      // Animate walk frames
      frameTimer.current += dt * 1000;
      if (frameTimer.current >= FRAME_DUR) {
        frameTimer.current = 0;
        frameRef.current = (frameRef.current + 1) % sprite.cols;
      }

      // Update DOM
      if (spriteRef.current) {
        spriteRef.current.style.left = `${posRef.current.x}%`;
        spriteRef.current.style.top = `${posRef.current.y}%`;
        const row = sprite.dirRow[dir] || 0;
        const col = frameRef.current;
        spriteRef.current.style.backgroundPosition = `${-(col * SW)}px ${-(row * SH)}px`;
      }

      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [climbPhase, sprite]);

  // Emerging → done after cross-fade
  useEffect(() => {
    if (climbPhase !== "emerging") return;
    const t = setTimeout(() => setClimbPhase("done"), 1400);
    return () => clearTimeout(t);
  }, [climbPhase]);

  const climbCSS = `
    @keyframes rooftopReveal {
      0%   { opacity: 0; }
      100% { opacity: 1; }
    }
    @keyframes climbFadeOut {
      0%   { opacity: 1; }
      100% { opacity: 0; }
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
          spawnX={50}
          spawnY={95}
          speed={10}
          scale={1.6}
          zIndex={18}
        />
      )}

      {/* ── SKYLIGHT CLIMB TRANSITION — character walks up the staircase ── */}
      {climbPhase!=="done"&&(
        <div style={{
          position:"fixed",inset:0,zIndex:50,overflow:"hidden",
          background:"#0A0806",
          pointerEvents: climbPhase==="emerging" ? "none" : "all",
          animation: climbPhase==="emerging" ? "climbFadeOut 1.4s ease both" : "none",
        }}>
          {/* Skylight staircase image — static background, no zoom */}
          <img
            src={SKYLIGHT_STAIRCASE_IMAGE}
            alt=""
            style={{
              position:"absolute",
              width:"100%",height:"100%",
              objectFit:"cover",
            }}
            draggable={false}
          />
          {/* Warm lantern glow overlay */}
          <div style={{position:"absolute",inset:0,pointerEvents:"none",background:"radial-gradient(ellipse at 50% 50%, rgba(255,180,80,0.08) 0%, transparent 60%)",mixBlendMode:"screen"}}/>
          {/* Dark vignette */}
          <div style={{position:"absolute",inset:0,pointerEvents:"none",background:"radial-gradient(ellipse at center, transparent 25%, rgba(10,8,6,0.55) 100%)"}}/>

          {/* Auto-walking character sprite */}
          <div
            ref={spriteRef}
            style={{
              position:"absolute",
              left:`${CLIMB_PATH[0].x}%`,
              top:`${CLIMB_PATH[0].y}%`,
              width: SW,
              height: SH,
              transform:"translate(-50%,-80%)",
              zIndex:10,
              backgroundImage:`url(${sprite.src})`,
              backgroundSize:`${sprite.cols * SW}px ${sprite.rows * SH}px`,
              backgroundRepeat:"no-repeat",
              backgroundPosition:"0px 0px",
              imageRendering:"pixelated",
              pointerEvents:"none",
              filter:"drop-shadow(0 2px 8px rgba(0,0,0,0.6))",
            }}
          />
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

      {/* Space transition overlay (for going back down) */}
      {spaceTransit&&<div style={{position:"fixed",inset:0,zIndex:9999,background:"#0A0806",display:"flex",alignItems:"center",justifyContent:"center",animation:"spaceFadeIn .5s ease"}}>
        <div style={{textAlign:"center",animation:"fadeUp .6s .15s ease both"}}>
          <div style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"1.05rem",color:"rgba(255,248,232,0.5)",letterSpacing:"0.04em"}}>{transitDir==="toCabin"?"Heading back down...":"Climbing to the rooftop..."}</div>
        </div>
      </div>}
    </div>
  );
}
