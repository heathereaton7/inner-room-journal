import { useRef, useEffect } from 'react';
import { ROOFTOP_LOUNGE_IMAGE } from '../constants.js';

// Rooftop lounge — open-air terrace above the cabin, reached via spiral staircase.
// Night sky with stars overhead, string lights, cozy seating, panoramic forest/mountain view.

export default function ImmersiveRooftop(){
  const containerRef=useRef(null);
  const canvasRef=useRef(null);
  const offsetX=useRef(0);
  const offsetY=useRef(0);
  const targetX=useRef(0);
  const targetY=useRef(0);
  const dragStart=useRef(null);
  const animFrame=useRef(null);
  const particles=useRef([]);
  const stars=useRef([]);
  const time=useRef(0);
  const imgRef=useRef(null);

  const PARALLAX=35;
  const SENSITIVITY=0.5;

  // Initialize floating particles + twinkling stars
  useEffect(()=>{
    const pts=[];
    for(let i=0;i<20;i++){
      pts.push({
        x:Math.random(),
        y:Math.random(),
        size:Math.random()*2+0.5,
        speed:Math.random()*0.0002+0.00005,
        drift:Math.random()*0.0003-0.00015,
        opacity:Math.random()*0.3+0.05,
        phase:Math.random()*Math.PI*2,
        warmth:Math.random(),
      });
    }
    particles.current=pts;
    // Twinkling stars in the open sky area
    const st=[];
    for(let i=0;i<40;i++){
      st.push({
        x:0.05+Math.random()*0.90,
        y:0.02+Math.random()*0.35,
        size:Math.random()*1.5+0.5,
        phase:Math.random()*Math.PI*2,
        twinkle:Math.random()*0.004+0.001,
        brightness:Math.random()*0.5+0.3,
      });
    }
    stars.current=st;
  },[]);

  // Gyroscope on mobile
  useEffect(()=>{
    let active=true;
    const handleOrientation=(e)=>{
      if(!active)return;
      const beta=e.beta||0;
      const gamma=e.gamma||0;
      targetX.current=Math.max(-1,Math.min(1,gamma/30))*PARALLAX;
      targetY.current=Math.max(-1,Math.min(1,(beta-45)/30))*PARALLAX;
    };
    if(typeof DeviceOrientationEvent!=="undefined"&&typeof DeviceOrientationEvent.requestPermission==="function"){
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

  // Animation loop
  useEffect(()=>{
    const loop=()=>{
      time.current+=16;
      offsetX.current+=(targetX.current-offsetX.current)*0.07;
      offsetY.current+=(targetY.current-offsetY.current)*0.07;
      const breathX=Math.sin(time.current*0.0003)*2.5;
      const breathY=Math.cos(time.current*0.00025)*1.5;
      const finalX=offsetX.current+breathX;
      const finalY=offsetY.current+breathY;
      if(imgRef.current){
        imgRef.current.style.transform=`translate(${-PARALLAX+finalX}px,${-PARALLAX+finalY}px)`;
      }
      const cvs=canvasRef.current;
      if(cvs){
        const ctx=cvs.getContext("2d");
        const w=cvs.width;
        const h=cvs.height;
        ctx.clearRect(0,0,w,h);
        // Warm dust motes
        particles.current.forEach(p=>{
          p.y-=p.speed;
          p.x+=p.drift+Math.sin(time.current*0.001+p.phase)*0.00008;
          if(p.y<-0.05){p.y=1.05;p.x=Math.random();}
          if(p.x<-0.05||p.x>1.05)p.x=Math.random();
          const px=p.x*w,py=p.y*h;
          const flicker=0.7+0.3*Math.sin(time.current*0.002+p.phase);
          const alpha=p.opacity*flicker;
          const r=255,g=Math.round(200+p.warmth*30),b=Math.round(120+p.warmth*60);
          ctx.beginPath();ctx.arc(px,py,p.size,0,Math.PI*2);
          ctx.fillStyle=`rgba(${r},${g},${b},${alpha})`;ctx.fill();
          if(p.size>1.2){
            ctx.beginPath();ctx.arc(px,py,p.size*3,0,Math.PI*2);
            ctx.fillStyle=`rgba(${r},${g},${b},${alpha*0.12})`;ctx.fill();
          }
        });
        // Twinkling stars
        stars.current.forEach(s=>{
          const twinkle=Math.sin(time.current*s.twinkle+s.phase);
          const a=Math.max(0,twinkle*0.5+0.5)*s.brightness;
          const px=s.x*w,py=s.y*h;
          // Star core
          ctx.beginPath();ctx.arc(px,py,s.size*0.6,0,Math.PI*2);
          ctx.fillStyle=`rgba(220,230,255,${a})`;ctx.fill();
          // Star glow
          ctx.beginPath();ctx.arc(px,py,s.size*2.5,0,Math.PI*2);
          ctx.fillStyle=`rgba(200,215,255,${a*0.12})`;ctx.fill();
        });
      }
      animFrame.current=requestAnimationFrame(loop);
    };
    animFrame.current=requestAnimationFrame(loop);
    return()=>{if(animFrame.current)cancelAnimationFrame(animFrame.current);};
  },[]);

  // Resize canvas
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
    <div ref={containerRef} style={{position:"absolute",inset:0,zIndex:0,overflow:"hidden",background:"#050812",cursor:"grab"}} onMouseDown={()=>{if(containerRef.current)containerRef.current.style.cursor="grabbing";}} onMouseUp={()=>{if(containerRef.current)containerRef.current.style.cursor="grab";}}>
      {/* Rooftop image — oversized for parallax */}
      <img
        ref={imgRef}
        src={ROOFTOP_LOUNGE_IMAGE}
        alt="Rooftop lounge"
        style={{
          position:"absolute",
          top:0,left:0,
          width:`calc(100% + ${PARALLAX*2}px)`,
          height:`calc(100% + ${PARALLAX*2}px)`,
          objectFit:"cover",
          transform:`translate(${-PARALLAX}px,${-PARALLAX}px)`,
          willChange:"transform",
          userSelect:"none",
          WebkitUserDrag:"none",
          pointerEvents:"none",
        }}
        draggable={false}
      />
      {/* String light glow — warm lights across the rooftop */}
      <div style={{position:"absolute",left:"5%",right:"5%",top:"10%",height:"12%",pointerEvents:"none",zIndex:1,background:"linear-gradient(90deg, transparent 0%, rgba(255,210,120,0.06) 15%, rgba(255,200,100,0.08) 30%, rgba(255,210,120,0.05) 50%, rgba(255,200,100,0.08) 70%, rgba(255,210,120,0.06) 85%, transparent 100%)",mixBlendMode:"screen"}}/>
      {/* Cool night sky ambient — subtle blue from above */}
      <div style={{position:"absolute",left:0,right:0,top:0,height:"40%",pointerEvents:"none",zIndex:1,background:"linear-gradient(to bottom, rgba(80,100,180,0.06) 0%, transparent 100%)",mixBlendMode:"screen"}}/>
      {/* Warm ambient from any lamps/candles */}
      <div style={{position:"absolute",left:"30%",top:"55%",width:"40%",height:"30%",pointerEvents:"none",zIndex:1,borderRadius:"50%",background:"radial-gradient(circle, rgba(255,200,100,0.08) 0%, transparent 65%)",mixBlendMode:"screen"}}/>
      {/* Particles + stars canvas */}
      <canvas ref={canvasRef} style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:2}}/>
      {/* Cinematic vignette — slightly deeper for night scene */}
      <div style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:3,background:"radial-gradient(ellipse at center, transparent 30%, rgba(5,8,18,0.60) 100%)"}}/>
      {/* Top shadow */}
      <div style={{position:"absolute",top:0,left:0,right:0,height:"20%",pointerEvents:"none",zIndex:3,background:"linear-gradient(to bottom, rgba(5,8,18,0.25), transparent)"}}/>
      {/* Cool color wash — subtle nighttime blue-purple */}
      <div style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:1,background:"linear-gradient(180deg, rgba(80,100,160,0.03) 0%, transparent 40%, rgba(60,80,140,0.02) 100%)"}}/>
    </div>
  );
}
