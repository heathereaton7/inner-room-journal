import { useRef, useEffect } from 'react';
import { CABIN_FALLBACK_IMAGE } from '../constants.js';

// Cozy cabin loft — stone fireplace with roaring fire LEFT, large picture window CENTER
// with pine forest & starry sky, open skylight TOP-CENTER, string lights across ceiling beams,
// spiral staircase RIGHT (future rooftop access), window seat with pillows CENTER,
// wooden desk with "The Inner Room" book in FOREGROUND, desk lamp RIGHT, lantern LEFT,
// notebook & pen LEFT of book, fluffy white rug CENTER FLOOR, candles on mantel + window seat.

export default function ImmersiveCabin(){
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
    // Fireflies — glowing outside the large picture window
    const ffs=[];
    for(let i=0;i<18;i++){
      ffs.push({
        x:0.16+Math.random()*0.56,   // window glass ~16-72% (wider window in new image)
        y:0.10+Math.random()*0.30,    // window glass ~10-40%
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
          if(ff.x<0.16||ff.x>0.72)ff.sx*=-1;
          if(ff.y<0.08||ff.y>0.40)ff.sy*=-1;
          ff.x=Math.max(0.16,Math.min(0.72,ff.x));
          ff.y=Math.max(0.08,Math.min(0.40,ff.y));
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
      {/* Cabin image — oversized for parallax movement.
          object-fit: cover so the image fills the container completely
          (the hotspots in CabinScreen are positioned relative to the
          container and must overlap the visible image — using contain
          on wide screens would leave them sitting in dark letterbox).
          object-position: center bottom anchors the foreground (desk,
          book, spiral staircase, rug) so on wide desktop screens the
          top of the scene (skylight) gets cropped instead of the
          interactive foreground. Mobile portrait looks identical. */}
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
          objectPosition:"center bottom",
          transform:`translate(${-PARALLAX}px,${-PARALLAX}px)`,
          willChange:"transform",
          userSelect:"none",
          WebkitUserDrag:"none",
          pointerEvents:"none",
        }}
        draggable={false}
      />
      {/* Warm firelight flicker overlay — radiates from LEFT stone fireplace */}
      <div className="cabin-firelight" style={{position:"absolute",inset:0,pointerEvents:"none",background:"radial-gradient(ellipse at 8% 40%, rgba(255,160,60,0.12) 0%, rgba(255,120,40,0.04) 30%, transparent 55%)",mixBlendMode:"screen"}}/>
      {/* Fire motion — animated dancing glow from fireplace */}
      <div className="cabin-fire-motion" style={{position:"absolute",left:0,top:"24%",width:"22%",height:"45%",pointerEvents:"none",zIndex:1,background:"radial-gradient(ellipse at 55% 55%, rgba(255,100,20,0.16) 0%, rgba(255,60,10,0.05) 45%, transparent 70%)",mixBlendMode:"screen",transformOrigin:"center bottom"}}/>
      {/* Fire motion secondary — faster flicker layer */}
      <div className="cabin-fire-flicker" style={{position:"absolute",left:"1%",top:"30%",width:"16%",height:"35%",pointerEvents:"none",zIndex:1,background:"radial-gradient(ellipse at 60% 50%, rgba(255,140,40,0.12) 0%, transparent 60%)",mixBlendMode:"screen",transformOrigin:"center bottom"}}/>
      {/* String light glow — warm lights strung across ceiling beams */}
      <div className="cabin-string-lights" style={{position:"absolute",left:"5%",right:"5%",top:"7%",height:"10%",pointerEvents:"none",zIndex:1,background:"linear-gradient(90deg, transparent 0%, rgba(255,210,120,0.05) 10%, rgba(255,200,100,0.07) 25%, rgba(255,210,120,0.04) 40%, rgba(255,200,100,0.07) 55%, rgba(255,210,120,0.05) 70%, rgba(255,200,100,0.07) 85%, transparent 100%)",mixBlendMode:"screen"}}/>
      {/* Skylight glow — cool starlight from open skylight at top center */}
      <div className="cabin-skylight" style={{position:"absolute",left:"28%",top:"0%",width:"44%",height:"12%",pointerEvents:"none",zIndex:1,background:"radial-gradient(ellipse at 50% 0%, rgba(140,160,255,0.08) 0%, rgba(100,120,200,0.03) 50%, transparent 80%)",mixBlendMode:"screen"}}/>
      {/* Candle glow — mantel candles on stone fireplace */}
      <div className="cabin-candle-glow" style={{position:"absolute",left:"5%",top:"28%",width:"10%",height:"8%",pointerEvents:"none",zIndex:1,borderRadius:"50%",background:"radial-gradient(circle, rgba(255,200,80,0.14) 0%, transparent 70%)",mixBlendMode:"screen"}}/>
      {/* Candle glow — window seat candles */}
      <div className="cabin-candle-glow2" style={{position:"absolute",left:"42%",top:"36%",width:"10%",height:"6%",pointerEvents:"none",zIndex:1,borderRadius:"50%",background:"radial-gradient(circle, rgba(255,200,80,0.10) 0%, transparent 65%)",mixBlendMode:"screen"}}/>
      {/* Lantern glow — desk lantern far left */}
      <div className="cabin-lantern-glow" style={{position:"absolute",left:"6%",top:"73%",width:"10%",height:"10%",pointerEvents:"none",zIndex:1,borderRadius:"50%",background:"radial-gradient(circle, rgba(255,190,80,0.14) 0%, transparent 65%)",mixBlendMode:"screen"}}/>
      {/* Desk lamp glow — right side of desk */}
      <div className="cabin-lamp-glow" style={{position:"absolute",right:"8%",top:"66%",width:"14%",height:"14%",pointerEvents:"none",zIndex:1,borderRadius:"50%",background:"radial-gradient(circle, rgba(255,220,140,0.14) 0%, transparent 60%)",mixBlendMode:"screen"}}/>
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
