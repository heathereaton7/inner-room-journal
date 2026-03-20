import { useMemo } from 'react';

export default function BookSparkles(){
  const sp=useMemo(()=>Array.from({length:12},(_,i)=>({id:i,x:20+Math.random()*60,y:10+Math.random()*80,d:Math.random()*4,dur:2+Math.random()*3,sz:2+Math.random()*3})),[]);
  return(<div style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:5}}>
    {sp.map(p=><div key={p.id} style={{position:"absolute",left:`${p.x}%`,top:`${p.y}%`,width:`${p.sz}px`,height:`${p.sz}px`,borderRadius:"50%",background:"radial-gradient(circle,rgba(255,220,130,0.9),rgba(255,200,80,0.3))",animation:`sparkle ${p.dur}s ${p.d}s ease-in-out infinite`}}/>)}
  </div>);
}
