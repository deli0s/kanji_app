let traceState=null;
export function mountTrace(el,kanji){
  const canvas=el.querySelector('canvas'),ctx=canvas.getContext('2d'),rect=()=>canvas.getBoundingClientRect();
  let drawing=false,points=[];
  function resize(){const r=rect(),d=window.devicePixelRatio||1;canvas.width=Math.max(1,r.width*d);canvas.height=Math.max(1,r.height*d);ctx.setTransform(d,0,0,d,0,0);ctx.lineWidth=7;ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#18212a'}
  resize();window.addEventListener('resize',resize);
  function pos(e){const r=rect();return{x:e.clientX-r.left,y:e.clientY-r.top}}
  canvas.addEventListener('pointerdown',e=>{drawing=true;canvas.setPointerCapture(e.pointerId);const p=pos(e);points=[p];ctx.beginPath();ctx.moveTo(p.x,p.y)});
  canvas.addEventListener('pointermove',e=>{if(!drawing)return;const p=pos(e);points.push(p);ctx.lineTo(p.x,p.y);ctx.stroke()});
  canvas.addEventListener('pointerup',()=>{drawing=false});
  traceState={canvas,ctx,resize};
}
export function clearTrace(canvas){if(!canvas)return;const ctx=canvas.getContext('2d');ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);const d=window.devicePixelRatio||1;ctx.setTransform(d,0,0,d,0,0);ctx.lineWidth=7;ctx.lineCap='round'}
export function showStrokeOrder(canvas,strokes){if(!canvas||!strokes?.length)return;clearTrace(canvas);const ctx=canvas.getContext('2d'),r=canvas.getBoundingClientRect(),d=window.devicePixelRatio||1;ctx.setTransform(d,0,0,d,0,0);ctx.strokeStyle='#17222a';ctx.lineWidth=7;ctx.lineCap='round';ctx.lineJoin='round';let i=0;function one(){if(i>=strokes.length)return;const s=strokes[i++];ctx.beginPath();ctx.moveTo(s[0][0]/100*r.width,s[0][1]/100*r.height);for(const p of s.slice(1))ctx.lineTo(p[0]/100*r.width,p[1]/100*r.height);ctx.stroke();setTimeout(one,280)}one()}
