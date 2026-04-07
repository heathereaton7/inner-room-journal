import { GFONTS, B, SERIF, SANS, DISPLAY } from '../constants.js';
import { CSS } from '../styles.js';
import ImmersiveGarden from '../components/ImmersiveGarden.jsx';
import CharacterWalker from '../components/CharacterWalker.jsx';

export default function RooftopGardenScreen({
  spaceTransit, transitDir, transitionToRooftop,
  candles, bank, playerAppearance,
}){
  return(
    <div style={{position:"fixed",inset:0,overflow:"hidden",fontFamily:SANS}}>
      <style>{GFONTS}{CSS}</style>

      {/* Full-screen garden background with parallax + mist */}
      <ImmersiveGarden/>

      {/* Walkable character — spawns at bottom center on the stone terrace */}
      <CharacterWalker
        appearance={playerAppearance}
        spawnX={50}
        spawnY={90}
        speed={10}
        scale={1.6}
        zIndex={18}
      />

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

      {/* Back to rooftop lounge — top right */}
      <button onClick={transitionToRooftop} style={{position:"absolute",right:"3%",top:"4%",zIndex:12,background:"rgba(14,8,18,0.6)",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",border:"1px solid rgba(180,140,200,0.15)",borderRadius:999,padding:"6px 16px",cursor:"pointer",color:"rgba(220,200,255,0.6)",fontFamily:SANS,fontSize:"0.7rem",transition:"all 0.2s",display:"inline-flex",alignItems:"center",gap:5,animation:"fadeUp 1s 0.3s ease both",boxShadow:"0 2px 12px rgba(0,0,0,0.3)"}}>
        <span style={{fontSize:"0.65rem"}}>{"\u2190"}</span> Back to lounge
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
