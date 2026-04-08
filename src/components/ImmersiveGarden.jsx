import { useRef, useEffect } from 'react';
import { ROOFTOP_GARDEN_IMAGE } from '../constants.js';

// Rooftop garden — stone terrace overlooking a waterfall at twilight.
// Brick paver floor, stone wall railing, waterfall LEFT, mountains + purple sky,
// trees and greenery around edges.

export default function ImmersiveGarden(){
  const containerRef=useRef(null);
  const canvasRef=useRef(null);
  const offsetX=useRef(0);
  const offsetY=useRef(0);
  const targetX=useRef(0);
  const targetY=useRef(0);
  const dragStart=useRef(null);
  const animFrame=useRef(null);
  const particles=useRef([]);
  const time=useRef(0);
  const imgRef=useRef(null);

  const PARALLAX=30;
  const SENSITIVITY=0.5;

  // Mist particles drifting from the waterfall
  useEffect(()=>{
    const pts=[];
    for(let i=0;i<30;i++){
      pts.push({
        x:0.1+Math.random()*0.5,
        y:0.2+Math.random()*0.35,
        size:Math.random()*3+1,
        speed:Math.random()*0.0002+0.0001,
        drift:Math.random()*0.0004-0.0001,
        opacity:Math.random()*0.2+0.03,
        phase:Math.random()*Math.PI*2,
        warmth:Math.random(),
      });
    }
    particles.current=pts;
  },[]);

  // Gyroscope
  useEffect(()=>{
    let active=true;
    const handleOrientation=(e)=>{
      if(!active)return;
      targetX.current=Math.max(-1,Math.min(1,(e.gamma||0)/30))*PARALLAX;
      targetY.current=Math.max(-1,Math.min(1,((e.beta||0)-45)/30))*PARALLAX;
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

  // Touch drag
  useEffect(()=>{
    const el=containerRef.current;
    if(!el)return;
    const start=(x,y)=>{dragStart.current={x,y,ox:targetX.current,oy:targetY.current};};
    const move=(x,y)=>{
      if(!dragStart.current)return;
      targetX.current=Math.max(-PARALLAX,Math.min(PARALLAX,dragStart.current.ox+(x-dragStart.current.x)*SENSITIVITY));
      targetY.current=Math.max(-PARALLAX,Math.min(PARALLAX,dragStart.current.oy+(y-dragStart.current.y)*SENSITIVITY));
    };
    const end=()=>{dragStart.current=null;};
    const ts=(e)=>{const t=e.touches[0];start(t.clientX,t.clientY);};
    const tm=(e)=>{const t=e.touches[0];move(t.clientX,t.clientY);};
    const ms=(e)=>start(e.clientX,e.clientY);
    const mm=(e)=>move(e.clientX,e.clientY);
    el.addEventListener("touchstart",ts,{passive:true});
    el.addEventListener("touchmove",tm,{passive:true});
    el.addEventListener("touchend",end);
    el.addEventListener("mousedown",ms);
    window.addEventListener("mousemove",mm);
    window.addEventListener("mouseup",end);
    return()=>{el.removeEventListener("touchstart",ts);el.removeEventListener("touchmove",tm);el.removeEventListener("touchend",end);el.removeEventListener("mousedown",ms);window.removeEventListener("mousemove",mm);window.removeEventListener("mouseup",end);};
  },[]);

  // Animation loop
  useEffect(()=>{
    const loop=()=>{
      time.current+=16;
      offsetX.current+=(targetX.current-offsetX.current)*0.07;
      offsetY.current+=(targetY.current-offsetY.current)*0.07;
      const bx=Math.sin(time.current*0.0003)*2;
      const by=Math.cos(time.current*0.00025)*1.5;
      if(imgRef.current){
        imgRef.current.style.transform=`translate(${-PARALLAX+offsetX.current+bx}px,${-PARALLAX+offsetY.current+by}px)`;
      }
      const cvs=canvasRef.current;
      if(cvs){
        const ctx=cvs.getContext("2d");
        const w=cvs.width,h=cvs.height;
        ctx.clearRect(0,0,w,h);
        // Waterfall mist
        particles.current.forEach(p=>{
          p.x+=p.drift+Math.sin(time.current*0.0008+p.phase)*0.00015;
          p.y+=p.speed;
          if(p.y>0.6){p.y=0.2;p.x=0.1+Math.random()*0.5;}
          if(p.x<0.05||p.x>0.65)p.x=0.1+Math.random()*0.5;
          const px=p.x*w,py=p.y*h;
          const alpha=p.opacity*(0.6+0.4*Math.sin(time.current*0.001+p.phase));
          ctx.beginPath();ctx.arc(px,py,p.size,0,Math.PI*2);
          ctx.fillStyle=`rgba(220,230,255,${alpha})`;ctx.fill();
          if(p.size>1.5){
            ctx.beginPath();ctx.arc(px,py,p.size*3,0,Math.PI*2);
            ctx.fillStyle=`rgba(220,230,255,${alpha*0.08})`;ctx.fill();
          }
        });
      }
      animFrame.current=requestAnimationFrame(loop);
    };
    animFrame.current=requestAnimationFrame(loop);
    return()=>{if(animFrame.current)cancelAnimationFrame(animFrame.current);};
  },[]);

  // Resize canvas
  useEffect(()=>{
    const resize=()=>{const cvs=canvasRef.current;if(!cvs)return;cvs.width=window.innerWidth;cvs.height=window.innerHeight;};
    resize();window.addEventListener("resize",resize);
    return()=>window.removeEventListener("resize",resize);
  },[]);

  return(
    <div ref={containerRef} style={{position:"absolute",inset:0,zIndex:0,overflow:"hidden",background:"#0E0812",cursor:"grab"}} onMouseDown={()=>{if(containerRef.current)containerRef.current.style.cursor="grabbing";}} onMouseUp={()=>{if(containerRef.current)containerRef.current.style.cursor="grab";}}>
      <img ref={imgRef} src={ROOFTOP_GARDEN_IMAGE} alt="Rooftop garden" style={{position:"absolute",top:0,left:0,width:`calc(100% + ${PARALLAX*2}px)`,height:`calc(100% + ${PARALLAX*2}px)`,objectFit:"cover",transform:`translate(${-PARALLAX}px,${-PARALLAX}px)`,willChange:"transform",userSelect:"none",WebkitUserDrag:"none",pointerEvents:"none",filter:"saturate(0.85) brightness(0.95) contrast(0.92) blur(0.3px)"}} draggable={false}/>
      {/* Waterfall mist glow */}
      <div style={{position:"absolute",left:"10%",top:"15%",width:"35%",height:"35%",pointerEvents:"none",zIndex:1,background:"radial-gradient(ellipse at 50% 60%, rgba(200,210,240,0.08) 0%, transparent 65%)",mixBlendMode:"screen"}}/>
      {/* Twilight sky wash */}
      <div style={{position:"absolute",left:0,right:0,top:0,height:"30%",pointerEvents:"none",zIndex:1,background:"linear-gradient(to bottom, rgba(160,100,180,0.05) 0%, transparent 100%)",mixBlendMode:"screen"}}/>
      {/* Warm stone floor glow */}
      <div style={{position:"absolute",left:"20%",top:"55%",width:"60%",height:"40%",pointerEvents:"none",zIndex:1,borderRadius:"50%",background:"radial-gradient(circle, rgba(200,170,140,0.06) 0%, transparent 65%)",mixBlendMode:"screen"}}/>
      {/* Mist + particles canvas */}
      <canvas ref={canvasRef} style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:2}}/>
      {/* Vignette */}
      <div style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:3,background:"radial-gradient(ellipse at center, transparent 30%, rgba(14,8,18,0.55) 100%)"}}/>
      <div style={{position:"absolute",bottom:0,left:0,right:0,height:"15%",pointerEvents:"none",zIndex:3,background:"linear-gradient(to top, rgba(14,8,18,0.30), transparent)"}}/>
    </div>
  );
}
