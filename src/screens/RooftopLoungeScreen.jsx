import { GFONTS, B, SERIF, SANS, DISPLAY } from '../constants.js';
import { CSS } from '../styles.js';
import ImmersiveRooftop from '../components/ImmersiveRooftop.jsx';

export default function RooftopLoungeScreen({
  spaceTransit, transitDir, transitionToCabin,
  candles, bank,
}){
  return(
    <div style={{position:"fixed",inset:0,overflow:"hidden",fontFamily:SANS}}>
      <style>{GFONTS}{CSS}</style>

      {/* Full-screen rooftop background with parallax + stars */}
      <ImmersiveRooftop/>

      {/* Currency display — top left */}
      <div style={{position:"absolute",left:"3%",top:"4%",zIndex:12,background:"rgba(10,14,30,0.7)",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",border:"1px solid rgba(140,170,220,0.15)",borderRadius:10,padding:"5px 12px",display:"flex",alignItems:"center",gap:10,animation:"fadeUp 1s 0.5s ease both",cursor:"default"}}>
        <div style={{display:"flex",alignItems:"center",gap:4}}>
          <span style={{fontSize:"0.8rem"}}>{"\uD83D\uDD6F\uFE0F"}</span>
          <span style={{fontFamily:DISPLAY,fontSize:"0.82rem",fontWeight:700,color:B.goldL}}>{candles}</span>
        </div>
        <div style={{width:1,height:14,background:"rgba(140,170,220,0.2)"}}/>
        <div style={{display:"flex",alignItems:"center",gap:4}}>
          <span style={{fontSize:"0.75rem",color:"rgba(180,200,255,0.7)"}}>o</span>
          <span style={{fontFamily:DISPLAY,fontSize:"0.82rem",fontWeight:700,color:"rgba(200,215,255,0.85)"}}>{bank.coins}</span>
        </div>
      </div>

      {/* Back to cabin — top right */}
      <button onClick={transitionToCabin} style={{position:"absolute",right:"3%",top:"4%",zIndex:12,background:"rgba(10,14,30,0.6)",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",border:"1px solid rgba(140,170,220,0.15)",borderRadius:999,padding:"6px 16px",cursor:"pointer",color:"rgba(200,215,255,0.6)",fontFamily:SANS,fontSize:"0.7rem",transition:"all 0.2s",display:"inline-flex",alignItems:"center",gap:5,animation:"fadeUp 1s 0.5s ease both",boxShadow:"0 2px 12px rgba(0,0,0,0.3)"}}>
        <span style={{fontSize:"0.65rem"}}>{"\u2193"}</span> Down to cabin
      </button>

      {/* Rooftop label — fades in gently */}
      <div style={{position:"absolute",bottom:"6%",left:"50%",transform:"translateX(-50%)",zIndex:12,animation:"fadeUp 1.5s 1s ease both",pointerEvents:"none",textAlign:"center"}}>
        <div style={{fontFamily:DISPLAY,fontSize:"1.1rem",fontWeight:700,color:"rgba(200,215,255,0.35)",letterSpacing:"0.08em",textTransform:"uppercase"}}>Rooftop Lounge</div>
        <div style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.75rem",color:"rgba(200,215,255,0.2)",marginTop:4}}>A quiet place above the world</div>
      </div>

      {/* Space transition overlay */}
      {spaceTransit&&<div style={{position:"fixed",inset:0,zIndex:9999,background:"#050812",display:"flex",alignItems:"center",justifyContent:"center",animation:"spaceFadeIn .5s ease"}}>
        <div style={{textAlign:"center",animation:"fadeUp .6s .15s ease both"}}>
          <div style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"1.05rem",color:"rgba(200,215,255,0.5)",letterSpacing:"0.04em"}}>{transitDir==="toCabin"?"Heading back down...":"Climbing to the rooftop..."}</div>
        </div>
      </div>}
    </div>
  );
}
