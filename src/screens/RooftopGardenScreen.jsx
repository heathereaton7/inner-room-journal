import { useState, useEffect, useRef } from 'react';
import { GFONTS, B, SERIF, SANS, DISPLAY } from '../constants.js';
import { CSS } from '../styles.js';
import ImmersiveGarden from '../components/ImmersiveGarden.jsx';
import CharacterWalker from '../components/CharacterWalker.jsx';
import GardenGridOverlay from '../components/GardenGridOverlay.jsx';

const RABBIT_SPRITE = '/Animals/Marley%20the%20rabbit%20sprite%20collection.png';

export default function RooftopGardenScreen({
  spaceTransit, transitDir, transitionToRooftop,
  candles, bank, playerAppearance,
  gardenGrid, setGardenGrid, inventory, setInventory,
  unlocks,
}){
  const [editMode, setEditMode] = useState(false);
  const [rabbitToast, setRabbitToast] = useState(false);
  const prevUnlocked = useRef(unlocks?.rabbitUnlocked || false);

  // Detect the moment rabbit unlocks (transition from false to true)
  useEffect(() => {
    if (unlocks?.rabbitUnlocked && !prevUnlocked.current) {
      prevUnlocked.current = true;
      setRabbitToast(true);
    }
  }, [unlocks?.rabbitUnlocked]);

  // Auto-dismiss rabbit toast
  useEffect(() => {
    if (!rabbitToast) return;
    const id = setTimeout(() => setRabbitToast(false), 4000);
    return () => clearTimeout(id);
  }, [rabbitToast]);

  // Stable random position for rabbit (computed once per mount)
  const rabbitPos = useRef({
    x: 60 + Math.random() * 20,  // 60-80% from left
    y: 55 + Math.random() * 20,  // 55-75% from top
  });

  return(
    <div style={{position:"fixed",inset:0,overflow:"hidden",fontFamily:SANS}}>
      <style>{GFONTS}{CSS}</style>

      {/* Full-screen garden background with parallax + mist */}
      <ImmersiveGarden/>

      {/* Garden grid overlay — always renders soil/plants, toolbar in edit mode */}
      <GardenGridOverlay
        grid={gardenGrid}
        setGrid={setGardenGrid}
        editMode={editMode}
        inventory={inventory}
        setInventory={setInventory}
      />

      {/* Rabbit companion — appears after unlock */}
      {unlocks?.rabbitUnlocked && (
        <div style={{
          position: 'absolute',
          left: `${rabbitPos.current.x}%`,
          top: `${rabbitPos.current.y}%`,
          transform: 'translate(-50%, -50%)',
          zIndex: 16,
          pointerEvents: 'none',
          animation: 'fadeUp 1.5s ease both',
        }}>
          {/* Sprite sheet is 3x2 grid (1536x1024). Crop to top-left frame (front-facing sit). */}
          <div style={{
            width: 72,
            height: 72,
            overflow: 'hidden',
            borderRadius: 4,
          }}>
            <img
              src={RABBIT_SPRITE}
              alt="Rabbit companion"
              draggable={false}
              style={{
                width: 216,        // 72px * 3 cols = full sheet width scaled
                height: 144,       // 72px * 2 rows = full sheet height scaled
                objectFit: 'cover',
                objectPosition: '0 0', // top-left frame
                filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.35))',
                imageRendering: 'auto',
                pointerEvents: 'none',
              }}
            />
          </div>
          {/* Soft glow beneath rabbit */}
          <div style={{
            position: 'absolute',
            bottom: -4,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 40,
            height: 12,
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(200,170,120,0.15) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
        </div>
      )}

      {/* Rabbit unlock toast */}
      {rabbitToast && (
        <div style={{
          position: 'fixed',
          top: '15%',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 75,
          background: 'rgba(14,8,18,0.9)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(201,169,110,0.35)',
          borderRadius: 16,
          padding: '14px 24px',
          maxWidth: '85%',
          textAlign: 'center',
          animation: 'fadeUp 0.6s ease',
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
        }}>
          <div style={{
            fontFamily: DISPLAY,
            fontSize: '0.95rem',
            fontWeight: 600,
            color: B.goldL,
            marginBottom: 4,
          }}>
            A gentle presence has appeared in your garden...
          </div>
          <div style={{
            fontFamily: SERIF,
            fontStyle: 'italic',
            fontSize: '0.78rem',
            color: 'rgba(220,200,255,0.5)',
          }}>
            Your faithful care has drawn a visitor.
          </div>
        </div>
      )}

      {/* Walkable character — hidden in edit mode so taps go to grid */}
      {!editMode && (
        <CharacterWalker
          appearance={playerAppearance}
          spawnX={50}
          spawnY={90}
          speed={10}
          scale={1.6}
          zIndex={18}
        />
      )}

      {/* Currency display — top left */}
      <div style={{position:"absolute",left:"3%",top:"4%",zIndex:12,background:"rgba(14,8,18,0.7)",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",border:"1px solid rgba(180,140,200,0.15)",borderRadius:10,padding:"5px 12px",display:"flex",alignItems:"center",gap:10,animation:"fadeUp 1s 0.3s ease both",cursor:"default"}}>
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

      {/* Back to rooftop lounge — top right (hidden in edit mode) */}
      {!editMode && (
        <button onClick={transitionToRooftop} style={{position:"absolute",right:"3%",top:"4%",zIndex:12,background:"rgba(14,8,18,0.6)",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",border:"1px solid rgba(180,140,200,0.15)",borderRadius:999,padding:"6px 16px",cursor:"pointer",color:"rgba(220,200,255,0.6)",fontFamily:SANS,fontSize:"0.7rem",transition:"all 0.2s",display:"inline-flex",alignItems:"center",gap:5,animation:"fadeUp 1s 0.3s ease both",boxShadow:"0 2px 12px rgba(0,0,0,0.3)"}}>
          <span style={{fontSize:"0.65rem"}}>{"\u2190"}</span> Back to lounge
        </button>
      )}

      {/* Garden edit mode toggle — bottom right */}
      <button
        onClick={() => setEditMode(prev => !prev)}
        style={{
          position: 'fixed',
          bottom: editMode ? 140 : 32,
          right: 24,
          zIndex: 58,
          background: editMode
            ? 'rgba(201,169,110,0.25)'
            : 'rgba(14,8,18,0.7)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: editMode
            ? '1.5px solid rgba(201,169,110,0.5)'
            : '1px solid rgba(180,140,200,0.15)',
          borderRadius: 14,
          padding: '10px 18px',
          cursor: 'pointer',
          color: editMode ? B.goldL : 'rgba(220,200,255,0.6)',
          fontFamily: SANS,
          fontSize: '0.72rem',
          fontWeight: 600,
          transition: 'all 0.25s ease',
          boxShadow: editMode
            ? '0 0 20px rgba(201,169,110,0.15)'
            : '0 2px 12px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        {editMode ? (
          <>
            <span style={{ fontSize: '0.8rem' }}>{"\u2714"}</span>
            Done
          </>
        ) : (
          <>
            <GardenIcon />
            Garden
          </>
        )}
      </button>

      {/* Space transition overlay */}
      {spaceTransit&&<div style={{position:"fixed",inset:0,zIndex:9999,background:"#0E0812",display:"flex",alignItems:"center",justifyContent:"center",animation:"spaceFadeIn .5s ease"}}>
        <div style={{textAlign:"center",animation:"fadeUp .6s .15s ease both"}}>
          <div style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"1.05rem",color:"rgba(220,200,255,0.5)",letterSpacing:"0.04em"}}>{transitDir==="toRooftop"?"Heading back to the lounge...":"Stepping onto the terrace..."}</div>
        </div>
      </div>}
    </div>
  );
}

/* Tiny trowel/garden icon (SVG inline) */
function GardenIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
      <path d="M2 22L12 12" />
      <path d="M12 12C12 12 14 6 20 4C18 10 12 12 12 12Z" />
    </svg>
  );
}
