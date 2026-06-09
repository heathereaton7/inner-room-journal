import { useRef, useEffect } from 'react';
import { CABIN_FALLBACK_IMAGE } from '../constants.js';
import { useRoomTheme } from '../systems/roomThemes.js';

// Cabin hall MAP — a grand two-storey log hall used as the cabin landing/hub.
// The map is rendered larger than the viewport and is drag-pannable: it opens
// anchored on the main floor (bottom) and you drag DOWN to travel UP to the
// upper-landing doors. Door-button hotspots can be added as % children of the
// pannable <map layer> so they track the pan.

const FALLBACK_RATIO = 941 / 1672; // width / height of cabinmapfinalmain.png
const ZOOM = 1.35;                 // how far the map is zoomed past "cover" (pan room)

// The outdoor opening of the central door arch, as fractions of the MAP image.
// Seasonal weather (snow/rain/leaves/petals) falls ONLY inside this box so it
// reads as weather outside the door — never inside the cabin. All cabin maps
// share the same hall layout, so one box works for every season.
const DOOR = { left: 0.497, top: 0.35, w: 0.112, h: 0.145 };

// Room doorways on the hall map (fractions of the MAP image). Each is a tappable
// hotspot rendered INSIDE the pannable layer so it tracks the map as you drag.
// `room` is the screen id the door leads to. Shared across all seasonal maps
// since they share the hall layout.
const ROOM_DOORS = [
  { room: 'cozy-creations', label: 'Cozy Creations Room', left: 0.30, top: 0.335, w: 0.155, h: 0.17 },
];

const WEATHER_COLORS = {
  leaves: ['#C8742B', '#A8521F', '#D89A3A', '#9C3B1C', '#B5651D'],
  petals: ['#F4C6D6', '#F7D9E3', '#E8A9C0', '#FBE4EC'],
};

// Candle flames in the hall, as fractions of the MAP image. A soft warm glow
// is drawn on each and flickers like a flame — in EVERY season (candles are
// always lit, independent of weather). All cabin maps share this layout, so one
// set of positions works for all seasons. `size` is the glow radius as a
// fraction of the map width.
const CANDLES = [
  { x: 0.335, y: 0.585, size: 0.017 }, // center table — candle (left)
  { x: 0.378, y: 0.572, size: 0.015 }, // center table — candle (right)
  { x: 0.402, y: 0.452, size: 0.019 }, // floor lantern, left of door arch
  { x: 0.652, y: 0.452, size: 0.019 }, // floor lantern, right of door arch
  { x: 0.132, y: 0.165, size: 0.019 }, // hanging lantern, top-left wall
  { x: 0.692, y: 0.150, size: 0.015 }, // wall sconce, top-right
  { x: 0.778, y: 0.132, size: 0.014 }, // wall sconce, top-right (upper)
  { x: 0.205, y: 0.450, size: 0.016 }, // mantel candle by the fireplace
  { x: 0.122, y: 0.728, size: 0.021 }, // table lamp, bottom-left
  { x: 0.832, y: 0.618, size: 0.018 }, // hanging lantern, mid-right
];

// Build a particle set for the active season's weather. Positions are
// normalized 0..1 within the door box; speeds are fractions of the box per frame.
function makeWeather(type){
  if(!type || type==='none') return [];
  const count = type==='rain' ? 60 : type==='snow' ? 55 : type==='leaves' ? 26 : 34;
  const arr=[];
  for(let i=0;i<count;i++){
    const base={ x:Math.random(), y:Math.random(), phase:Math.random()*Math.PI*2, opacity:Math.random()*0.45+0.4 };
    if(type==='snow') arr.push({ ...base, vy:Math.random()*0.0022+0.0014, sway:Math.random()*0.0016+0.0005, r:Math.random()*1.3+0.5 });
    else if(type==='rain') arr.push({ ...base, vy:Math.random()*0.016+0.018, tilt:Math.random()*0.0008+0.0003, len:Math.random()*7+5, opacity:Math.random()*0.3+0.25 });
    else if(type==='leaves') arr.push({ ...base, vy:Math.random()*0.0024+0.0016, sway:Math.random()*0.004+0.002, size:Math.random()*2.5+2, rot:Math.random()*Math.PI*2, rotV:Math.random()*0.04-0.02, color:WEATHER_COLORS.leaves[i%WEATHER_COLORS.leaves.length] });
    else arr.push({ ...base, vy:Math.random()*0.0022+0.0014, sway:Math.random()*0.0035+0.0018, size:Math.random()*2.2+1.6, rot:Math.random()*Math.PI*2, rotV:Math.random()*0.03-0.015, color:WEATHER_COLORS.petals[i%WEATHER_COLORS.petals.length] });
  }
  return arr;
}

export default function ImmersiveCabin({ onOpenRoom }){
  const theme=useRoomTheme();
  const bgImage=theme.cabin||CABIN_FALLBACK_IMAGE;
  const containerRef=useRef(null);
  const layerRef=useRef(null);
  const canvasRef=useRef(null);
  const doorCanvasRef=useRef(null);
  const candleCanvasRef=useRef(null);
  const animFrame=useRef(null);
  const particles=useRef([]);
  const weatherP=useRef([]);
  const candleFlick=useRef([]);
  const time=useRef(0);

  // Active season's weather kept in a ref so the [] -deps animation loop reads it live.
  const weather=theme.weather;
  const weatherRef=useRef(weather);
  weatherRef.current=weather;

  // Pan state (px). map = computed map box + clamp limits.
  const pan=useRef({ x:0, y:0 });
  const target=useRef({ x:0, y:0 });
  const map=useRef({ w:0, h:0, minX:0, minY:0 });
  const ratio=useRef(FALLBACK_RATIO);
  const dragStart=useRef(null);
  const didInit=useRef(false);

  // Size the map box to cover the viewport, then zoom past it so there is room
  // to pan both axes. Re-clamps the current pan and re-centers on first layout.
  const computeMap=()=>{
    const vw=window.innerWidth, vh=window.innerHeight, r=ratio.current;
    const coverH=Math.max(vh, vw/r);
    const w=coverH*r*ZOOM;
    const h=coverH*ZOOM;
    const minX=Math.min(0, vw-w);
    const minY=Math.min(0, vh-h);
    map.current={ w, h, minX, minY };
    if(layerRef.current){ layerRef.current.style.width=`${w}px`; layerRef.current.style.height=`${h}px`; }
    if(doorCanvasRef.current){ doorCanvasRef.current.width=Math.round(w); doorCanvasRef.current.height=Math.round(h); }
    if(candleCanvasRef.current){ candleCanvasRef.current.width=Math.round(w); candleCanvasRef.current.height=Math.round(h); }
    if(!didInit.current){
      // Open on the main floor (bottom), horizontally centered.
      target.current={ x:minX/2, y:minY };
      pan.current={ ...target.current };
      didInit.current=true;
    } else {
      target.current.x=Math.max(minX, Math.min(0, target.current.x));
      target.current.y=Math.max(minY, Math.min(0, target.current.y));
    }
  };

  // Initialize warm floating dust particles (ambient, viewport-fixed).
  useEffect(()=>{
    const pts=[];
    for(let i=0;i<35;i++){
      pts.push({
        x:Math.random(), y:Math.random(),
        size:Math.random()*2.5+0.8,
        speed:Math.random()*0.0003+0.0001,
        drift:Math.random()*0.0004-0.0002,
        opacity:Math.random()*0.4+0.1,
        phase:Math.random()*Math.PI*2,
        warmth:Math.random(),
      });
    }
    particles.current=pts;
  },[]);

  // Rebuild door weather whenever the season's weather type changes.
  useEffect(()=>{ weatherP.current=makeWeather(weather); },[weather]);

  // Give every candle its own flicker phase + speed so flames waver out of sync.
  useEffect(()=>{
    candleFlick.current=CANDLES.map(()=>({ phase:Math.random()*Math.PI*2, speed:Math.random()*0.004+0.004 }));
  },[]);

  // Drag to pan the map (touch + mouse).
  useEffect(()=>{
    const el=containerRef.current;
    if(!el)return;
    const start=(x,y)=>{ dragStart.current={ x, y, ox:target.current.x, oy:target.current.y }; };
    const move=(x,y)=>{
      if(!dragStart.current)return;
      const { minX, minY }=map.current;
      const nx=dragStart.current.ox+(x-dragStart.current.x);
      const ny=dragStart.current.oy+(y-dragStart.current.y);
      target.current.x=Math.max(minX, Math.min(0, nx));
      target.current.y=Math.max(minY, Math.min(0, ny));
    };
    const end=()=>{ dragStart.current=null; };
    const ts=(e)=>{ const t=e.touches[0]; start(t.clientX,t.clientY); };
    const tm=(e)=>{ const t=e.touches[0]; move(t.clientX,t.clientY); };
    const ms=(e)=>{ start(e.clientX,e.clientY); };
    const mm=(e)=>{ move(e.clientX,e.clientY); };
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

  // Animation loop — smooth pan lerp + ambient dust canvas.
  useEffect(()=>{
    const loop=()=>{
      time.current+=16;
      pan.current.x+=(target.current.x-pan.current.x)*0.12;
      pan.current.y+=(target.current.y-pan.current.y)*0.12;
      if(layerRef.current){
        layerRef.current.style.transform=`translate(${pan.current.x}px,${pan.current.y}px)`;
      }
      // Seasonal weather — drawn on a canvas INSIDE the map layer (so it pans with
      // the map) and clipped to the door arch so it only falls in the doorway.
      const dcvs=doorCanvasRef.current;
      const wType=weatherRef.current;
      if(dcvs){
        const dctx=dcvs.getContext("2d");
        const W=dcvs.width, H=dcvs.height;
        dctx.clearRect(0,0,W,H);
        if(wType && wType!=="none" && weatherP.current.length){
          const bx=DOOR.left*W, by=DOOR.top*H, bw=DOOR.w*W, bh=DOOR.h*H;
          dctx.save();
          dctx.beginPath();
          const rTop=bw*0.5;
          if(dctx.roundRect) dctx.roundRect(bx,by,bw,bh,[rTop,rTop,bw*0.08,bw*0.08]); else dctx.rect(bx,by,bw,bh);
          dctx.clip();
          weatherP.current.forEach(p=>{
            p.y+=p.vy;
            if(wType==="rain") p.x+=p.tilt; else p.x+=Math.sin(time.current*0.0012+p.phase)*p.sway;
            if(p.rotV!==undefined) p.rot+=p.rotV;
            if(p.y>1.04){ p.y=-0.04; p.x=Math.random(); }
            if(p.x<-0.05) p.x=1.05; else if(p.x>1.05) p.x=-0.05;
            const px=bx+p.x*bw, py=by+p.y*bh;
            if(wType==="snow"){
              dctx.beginPath(); dctx.arc(px,py,p.r,0,Math.PI*2);
              dctx.fillStyle=`rgba(245,250,255,${p.opacity})`; dctx.fill();
            } else if(wType==="rain"){
              dctx.strokeStyle=`rgba(180,205,230,${p.opacity})`; dctx.lineWidth=1;
              dctx.beginPath(); dctx.moveTo(px,py); dctx.lineTo(px+1.5,py+p.len); dctx.stroke();
            } else { // leaves / petals
              dctx.save(); dctx.translate(px,py); dctx.rotate(p.rot);
              dctx.globalAlpha=p.opacity; dctx.fillStyle=p.color;
              dctx.beginPath(); dctx.ellipse(0,0,p.size,p.size*0.55,0,0,Math.PI*2); dctx.fill();
              dctx.globalAlpha=1; dctx.restore();
            }
          });
          dctx.restore();
        }
      }
      // Candle flames — soft warm glow on each candle, flickering in all seasons.
      // Drawn on a canvas INSIDE the map layer so the glows track the pan, and
      // composited additively so they read as light over the painted flames.
      const ccvs=candleCanvasRef.current;
      if(ccvs){
        const cctx=ccvs.getContext("2d");
        const W=ccvs.width, H=ccvs.height;
        cctx.clearRect(0,0,W,H);
        const prevOp=cctx.globalCompositeOperation;
        cctx.globalCompositeOperation="lighter";
        const t=time.current;
        CANDLES.forEach((c,i)=>{
          const f=candleFlick.current[i]||{phase:0,speed:0.006};
          // Subtle waver (slow) plus a faster tremor — stays within ~0.78..1.0.
          const flick=0.84+0.10*Math.sin(t*f.speed+f.phase)+0.05*Math.sin(t*f.speed*2.7+f.phase*1.7);
          const cx=c.x*W, cy=c.y*H;
          const r=Math.max(2, c.size*W*flick);
          const g=cctx.createRadialGradient(cx,cy,0,cx,cy,r);
          g.addColorStop(0,`rgba(255,214,140,${0.50*flick})`);
          g.addColorStop(0.45,`rgba(255,160,70,${0.22*flick})`);
          g.addColorStop(1,"rgba(255,140,50,0)");
          cctx.fillStyle=g;
          cctx.beginPath(); cctx.arc(cx,cy,r,0,Math.PI*2); cctx.fill();
        });
        cctx.globalCompositeOperation=prevOp;
      }
      const cvs=canvasRef.current;
      if(cvs){
        const ctx=cvs.getContext("2d");
        const w=cvs.width, h=cvs.height;
        ctx.clearRect(0,0,w,h);
        particles.current.forEach(p=>{
          p.y-=p.speed;
          p.x+=p.drift+Math.sin(time.current*0.001+p.phase)*0.0001;
          if(p.y<-0.05){p.y=1.05;p.x=Math.random();}
          if(p.x<-0.05||p.x>1.05)p.x=Math.random();
          const px=p.x*w, py=p.y*h;
          const flicker=0.7+0.3*Math.sin(time.current*0.002+p.phase);
          const alpha=p.opacity*flicker;
          const r=255, g=Math.round(190+p.warmth*40), b=Math.round(80+p.warmth*60);
          ctx.beginPath();ctx.arc(px,py,p.size,0,Math.PI*2);
          ctx.fillStyle=`rgba(${r},${g},${b},${alpha})`;ctx.fill();
          if(p.size>1.5){
            ctx.beginPath();ctx.arc(px,py,p.size*3,0,Math.PI*2);
            ctx.fillStyle=`rgba(${r},${g},${b},${alpha*0.15})`;ctx.fill();
          }
        });
      }
      animFrame.current=requestAnimationFrame(loop);
    };
    animFrame.current=requestAnimationFrame(loop);
    return()=>{if(animFrame.current)cancelAnimationFrame(animFrame.current);};
  },[]);

  // Layout the map box + size the dust canvas to the viewport.
  useEffect(()=>{
    const resize=()=>{
      computeMap();
      const cvs=canvasRef.current;
      if(cvs){ cvs.width=window.innerWidth; cvs.height=window.innerHeight; }
    };
    resize();
    window.addEventListener("resize",resize);
    return()=>window.removeEventListener("resize",resize);
  },[]);

  return(
    <div ref={containerRef} style={{position:"absolute",inset:0,zIndex:0,overflow:"hidden",background:"#060402",cursor:"grab",touchAction:"none"}} onMouseDown={()=>{if(containerRef.current)containerRef.current.style.cursor="grabbing";}} onMouseUp={()=>{if(containerRef.current)containerRef.current.style.cursor="grab";}}>
      {/* Pannable map layer — image fills it exactly (aspect preserved). Future
          door-button hotspots go here as % children so they pan with the map. */}
      <div ref={layerRef} style={{position:"absolute",top:0,left:0,width:map.current.w||"100%",height:map.current.h||"100%",willChange:"transform"}}>
        <img
          src={bgImage}
          alt="Cabin hall"
          onLoad={(e)=>{ const im=e.target; if(im.naturalWidth&&im.naturalHeight){ ratio.current=im.naturalWidth/im.naturalHeight; computeMap(); } }}
          style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",userSelect:"none",WebkitUserDrag:"none",pointerEvents:"none",display:"block"}}
          draggable={false}
        />
        {/* Candle flames — flickering glow on each candle, inside the layer so it pans with the map */}
        <canvas ref={candleCanvasRef} style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",pointerEvents:"none"}}/>
        {/* Seasonal weather in the doorway — sits inside the layer so it pans with the map */}
        <canvas ref={doorCanvasRef} style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",pointerEvents:"none"}}/>
        {/* Room doorway hotspots — % of the layer, so they pan with the map */}
        {ROOM_DOORS.map(d=>(
          <button
            key={d.room}
            onClick={(e)=>{ e.stopPropagation(); onOpenRoom&&onOpenRoom(d.room); }}
            aria-label={d.label}
            style={{position:"absolute",left:`${d.left*100}%`,top:`${d.top*100}%`,width:`${d.w*100}%`,height:`${d.h*100}%`,background:"transparent",border:"none",padding:0,cursor:"pointer",borderRadius:"45% 45% 8% 8%",outline:"none",WebkitTapHighlightColor:"transparent",zIndex:4}}
          >
            {/* Soft warm aura so the door reads as interactive */}
            <div style={{position:"absolute",inset:"-8%",borderRadius:"45% 45% 12% 12%",background:"radial-gradient(ellipse at 50% 45%, rgba(255,205,120,0.18) 0%, rgba(255,175,80,0.07) 45%, transparent 72%)",pointerEvents:"none",animation:"hotspotPulse 3s ease-in-out infinite"}}/>
          </button>
        ))}
      </div>
      {/* Floating dust particles (viewport-fixed ambience) */}
      <canvas ref={canvasRef} style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:2}}/>
      {/* Cinematic vignette */}
      <div style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:3,background:"radial-gradient(ellipse at center, transparent 40%, rgba(8,6,4,0.55) 100%)"}}/>
      {/* Top shadow for depth */}
      <div style={{position:"absolute",top:0,left:0,right:0,height:"22%",pointerEvents:"none",zIndex:3,background:"linear-gradient(to bottom, rgba(8,6,4,0.30), transparent)"}}/>
    </div>
  );
}
