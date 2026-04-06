import { useRef, useEffect } from 'react';
import { ROOFTOP_LOUNGE_IMAGE } from '../constants.js';

// Rooftop terrace — open-air lounge above the cabin, reached via spiral staircase.
// Purple-pink twilight sky, string lights draped across scene, pergola with drapes LEFT,
// large sectional sofa CENTER-LEFT, coffee table with candles + food CENTER,
// spiral staircase RIGHT, stone path FOREGROUND, lanterns scattered throughout,
// ocean/water view + mountains in BACKGROUND, lush greenery everywhere.

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
  const fireflies=useRef([]);
  const time=useRef(0);
  const imgRef=useRef(null);

  const PARALLAX=35;
  const SENSITIVITY=0.5;

  // Initialize warm floating particles + fireflies in the garden
  useEffect(()=>{
    const pts=[];
    for(let i=0;i<25;i++){
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
    // Fireflies — scattered through the greenery and stone path
    const ffs=[];
    for(let i=0;i<22;i++){
      ffs.push({
        x:0.05+Math.random()*0.90,
        y:0.35+Math.random()*0.55,  // lower half — in the garden/path area
        size:Math.random()*1.8+1,
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
        // Fireflies in the garden greenery
        fireflies.current.forEach(ff=>{
          ff.x+=ff.sx+Math.sin(time.current*0.0005+ff.phase)*0.0001;
          ff.y+=ff.sy+Math.cos(time.current*0.0007+ff.phase)*0.00008;
          if(ff.x<0.03||ff.x>0.97)ff.sx*=-1;
          if(ff.y<0.30||ff.y>0.92)ff.sy*=-1;
          ff.x=Math.max(0.03,Math.min(0.97,ff.x));
          ff.y=Math.max(0.30,Math.min(0.92,ff.y));
          const blink=Math.sin(time.current*ff.blink+ff.phase);
          const a=Math.max(0,blink*0.7+0.3)*0.55;
          const px=ff.x*w,py=ff.y*h;
          ctx.beginPath();ctx.arc(px,py,ff.size*6,0,Math.PI*2);
          ctx.fillStyle=`rgba(180,255,120,${a*0.07})`;ctx.fill();
          ctx.beginPath();ctx.arc(px,py,ff.size*3,0,Math.PI*2);
          ctx.fillStyle=`rgba(200,255,140,${a*0.16})`;ctx.fill();
          ctx.beginPath();ctx.arc(px,py,ff.size,0,Math.PI*2);
          ctx.fillStyle=`rgba(220,255,160,${a})`;ctx.fill();
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
    <div ref={containerRef} style={{position:"absolute",inset:0,zIndex:0,overflow:"hidden",background:"#120818",cursor:"grab"}} onMouseDown={()=>{if(containerRef.current)containerRef.current.style.cursor="grabbing";}} onMouseUp={()=>{if(containerRef.current)containerRef.current.style.cursor="grab";}}>
      {/* Rooftop terrace image — oversized for parallax */}
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
      {/* String light glow — warm lights draped across the terrace */}
      <div style={{position:"absolute",left:"0%",right:"0%",top:"8%",height:"18%",pointerEvents:"none",zIndex:1,background:"linear-gradient(90deg, transparent 0%, rgba(255,210,120,0.06) 10%, rgba(255,200,100,0.09) 25%, rgba(255,210,120,0.05) 40%, rgba(255,200,100,0.09) 55%, rgba(255,210,120,0.06) 70%, rgba(255,200,100,0.09) 85%, transparent 100%)",mixBlendMode:"screen"}}/>
      {/* Twilight sky wash — purple-pink gradient from above */}
      <div style={{position:"absolute",left:0,right:0,top:0,height:"35%",pointerEvents:"none",zIndex:1,background:"linear-gradient(to bottom, rgba(140,80,180,0.06) 0%, rgba(180,100,160,0.03) 50%, transparent 100%)",mixBlendMode:"screen"}}/>
      {/* Pergola warm glow — left side under the drapes */}
      <div style={{position:"absolute",left:"0%",top:"18%",width:"35%",height:"30%",pointerEvents:"none",zIndex:1,borderRadius:"50%",background:"radial-gradient(ellipse at 40% 50%, rgba(255,180,80,0.10) 0%, transparent 65%)",mixBlendMode:"screen"}}/>
      {/* Coffee table candle cluster — center */}
      <div style={{position:"absolute",left:"32%",top:"46%",width:"18%",height:"12%",pointerEvents:"none",zIndex:1,borderRadius:"50%",background:"radial-gradient(circle, rgba(255,200,100,0.14) 0%, transparent 65%)",mixBlendMode:"screen"}}/>
      {/* Lantern glows — scattered warm points */}
      <div style={{position:"absolute",left:"2%",top:"55%",width:"8%",height:"8%",pointerEvents:"none",zIndex:1,borderRadius:"50%",background:"radial-gradient(circle, rgba(255,190,80,0.12) 0%, transparent 65%)",mixBlendMode:"screen"}}/>
      <div style={{position:"absolute",right:"5%",top:"42%",width:"8%",height:"8%",pointerEvents:"none",zIndex:1,borderRadius:"50%",background:"radial-gradient(circle, rgba(255,190,80,0.12) 0%, transparent 65%)",mixBlendMode:"screen"}}/>
      <div style={{position:"absolute",left:"48%",top:"72%",width:"6%",height:"6%",pointerEvents:"none",zIndex:1,borderRadius:"50%",background:"radial-gradient(circle, rgba(255,190,80,0.10) 0%, transparent 65%)",mixBlendMode:"screen"}}/>
      <div style={{position:"absolute",right:"15%",top:"65%",width:"7%",height:"7%",pointerEvents:"none",zIndex:1,borderRadius:"50%",background:"radial-gradient(circle, rgba(255,190,80,0.10) 0%, transparent 65%)",mixBlendMode:"screen"}}/>
      {/* Ocean horizon glow — distant warm light on water */}
      <div style={{position:"absolute",left:"40%",top:"22%",width:"50%",height:"15%",pointerEvents:"none",zIndex:1,background:"radial-gradient(ellipse at 60% 50%, rgba(200,150,180,0.06) 0%, transparent 70%)",mixBlendMode:"screen"}}/>
      {/* Particles + fireflies canvas */}
      <canvas ref={canvasRef} style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:2}}/>
      {/* Cinematic vignette */}
      <div style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:3,background:"radial-gradient(ellipse at center, transparent 30%, rgba(18,8,24,0.55) 100%)"}}/>
      {/* Bottom shadow — stone path fading */}
      <div style={{position:"absolute",bottom:0,left:0,right:0,height:"15%",pointerEvents:"none",zIndex:3,background:"linear-gradient(to top, rgba(18,8,24,0.35), transparent)"}}/>
      {/* Warm-purple color wash */}
      <div style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:1,background:"linear-gradient(180deg, rgba(140,80,160,0.02) 0%, transparent 40%, rgba(180,120,80,0.02) 100%)"}}/>
    </div>
  );
}
