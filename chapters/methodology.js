(() => {
  'use strict';
  const canvas=document.querySelector('#filament-stage'),ctx=canvas.getContext('2d');
  const nodes=[...document.querySelectorAll('.method-node')],title=document.querySelector('#master-title');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let raf=0,start=0,activated=false,settled=false,points=[],thresholds=[],length=0,duration=3300;
  // Sample Catmull-Rom geometry once. Animation only reads the cached points.
  function build(){
    const w=innerWidth,h=Math.max(innerHeight,document.body.scrollHeight),dpr=Math.min(devicePixelRatio,2);
    canvas.width=w*dpr;canvas.height=h*dpr;canvas.style.height=h+'px';ctx.setTransform(dpr,0,0,dpr,0,0);
    const anchor=el=>{const r=el.getBoundingClientRect();const shift=el.closest('.method-node')?16:20;return{x:r.left+r.width*.5,y:r.top+scrollY+r.height*.55-shift};};
    const anchors=nodes.map(n=>anchor(n.firstElementChild));const t=anchor(title.querySelector('h1'));
    const knots=[{x:-25,y:anchors[0].y+45},...anchors,{x:Math.min(w*.92,anchors[3].x+40),y:Math.max(t.y+40,anchors[3].y-100)},t];
    points=[];thresholds=[];length=0;
    for(let i=0;i<knots.length-1;i++){
      const p0=knots[Math.max(0,i-1)],p1=knots[i],p2=knots[i+1],p3=knots[Math.min(knots.length-1,i+2)];
      for(let j=0;j<=90;j++){
        const u=j/90,v=u*u,z=v*u;
        const calc=k=>.5*((2*p1[k])+(-p0[k]+p2[k])*u+(2*p0[k]-5*p1[k]+4*p2[k]-p3[k])*v+(-p0[k]+3*p1[k]-3*p2[k]+p3[k])*z);
        const p={x:calc('x'),y:calc('y'),s:0},last=points.at(-1);if(last)length+=Math.hypot(p.x-last.x,p.y-last.y);p.s=length;points.push(p);
      }
      if(i<4)thresholds.push(length);
    }
  }
  function finish(){settled=true;cancelAnimationFrame(raf);raf=0;nodes.forEach(n=>n.classList.add('awakened'));title.classList.add('awakened');ctx.clearRect(0,0,canvas.width,canvas.height);}
  function draw(now){
    raf=0;if(settled||document.hidden)return;if(!start)start=now;
    const p=Math.min(1,(now-start)/duration),e=p*p*(3-2*p),head=e*length,tail=Math.max(0,head-length*.23);
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const segment=points.filter(a=>a.s>=tail&&a.s<=head);
    if(segment.length>1){
      const first=segment[0],last=segment.at(-1),gradient=ctx.createLinearGradient(first.x,first.y,last.x,last.y);
      gradient.addColorStop(0,'rgba(242,224,239,0)');gradient.addColorStop(.5,'rgba(207,212,223,.28)');gradient.addColorStop(.88,'rgba(245,244,252,.9)');gradient.addColorStop(1,'#fff');
      ctx.globalAlpha=Math.min(1,p*16)*Math.min(1,(1-p)*7);ctx.lineCap='round';ctx.lineJoin='round';
      ctx.beginPath();segment.forEach((q,i)=>{if(i)ctx.lineTo(q.x,q.y);else ctx.moveTo(q.x,q.y);});
      // A few narrow, translucent strokes replace the full-screen turbulence filter.
      ctx.strokeStyle=gradient;for(const [width,alpha] of [[12,.035],[6,.09],[2.2,.6],[.8,1]]){ctx.lineWidth=width;const a=ctx.globalAlpha;ctx.globalAlpha=a*alpha;ctx.stroke();ctx.globalAlpha=a;}
      ctx.globalAlpha=1;
    }
    nodes.forEach((node,i)=>{if(head>=thresholds[i]-10)node.classList.add('awakened');});
    if(head>=length*.94)title.classList.add('awakened');
    if(p<1)raf=requestAnimationFrame(draw);else finish();
  }
  function activate(){if(activated)return;activated=true;start=0;settled=false;if(reduced.matches){finish();return;}build();raf=requestAnimationFrame(draw);}
  function deactivate(){
    cancelAnimationFrame(raf);raf=0;start=0;activated=false;settled=false;
    nodes.forEach(n=>n.classList.remove('awakened'));title.classList.remove('awakened');
    ctx.clearRect(0,0,canvas.width,canvas.height);
  }
  addEventListener('message',e=>{if(e.source!==parent||e.origin!==location.origin)return;if(e.data?.type==='chapter-activate')activate();if(e.data?.type==='chapter-deactivate')deactivate();});
  addEventListener('message',e=>{if(e.source!==parent||e.origin!==location.origin||e.data?.type!=='chapter-depart')return;cancelAnimationFrame(raf);settled=true;if(reduced.matches)return;[title,...nodes].forEach((el,i)=>el.animate([{opacity:1,translate:'0 0'},{opacity:0,translate:`${-(e.data.direction||1)*(25+i*7)}px ${i%2?-12:12}px`}],{duration:420,delay:i*12,easing:'cubic-bezier(.55,0,.3,1)',fill:'forwards'}));});
  addEventListener('keydown',e=>{
    if(parent===window||e.ctrlKey||e.metaKey||e.altKey||e.shiftKey||e.target?.closest?.('input,textarea,select,[contenteditable="true"]'))return;
    if(!['ArrowLeft','ArrowRight'].includes(e.key))return;
    e.preventDefault();if(!e.repeat)parent.postMessage({type:'chapter-step',direction:e.key==='ArrowLeft'?-1:1},location.origin);
  });
  if(parent===window)activate();
  addEventListener('resize',()=>{if(activated)finish();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&activated)finish();});
  reduced.addEventListener('change',()=>{if(activated)finish();});
  // Readers can skip the reveal without consuming navigation or selecting text.
  addEventListener('keydown',e=>{if(e.key==='Escape'){parent.postMessage({type:'chapter-back'},location.origin);return;}if(e.key===' '&&!settled){e.preventDefault();finish();}});
})();
