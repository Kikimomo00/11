(() => {
  'use strict';
  const page=document.querySelector('#characters-intro'),canvas=document.querySelector('#chapter-scene');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let frame=0,generation=0,timers=[],animations=[],finishOpening=null;
  const clamp=n=>Math.max(0,Math.min(1,n));
  const smooth=(a,b,n)=>{const t=clamp((n-a)/(b-a));return t*t*(3-2*t);};
  const curve=(a,b,c,d,t)=>{const q=1-t;return q*q*q*a+3*q*q*t*b+3*q*t*t*c+t*t*t*d;};
  function clean(){cancelAnimationFrame(frame);frame=0;timers.forEach(clearTimeout);timers=[];animations.forEach(a=>a.cancel());animations=[];if(finishOpening){finishOpening();finishOpening=null;}}
  function reveal(element,delay,duration=720){
    animations.push(element.animate([{opacity:0,clipPath:'inset(0 100% 0 0)',transform:'translateY(10px)'},{opacity:1,clipPath:'inset(0 0% 0 0)',transform:'translateY(0)'}],{delay,duration,easing:'cubic-bezier(.2,.8,.2,1)',fill:'both'}));
  }
  function glyphPoints(element){
    const rect=element.getBoundingClientRect(),sample=document.createElement('canvas');sample.width=650;sample.height=180;
    const context=sample.getContext('2d',{willReadFrequently:true}),style=getComputedStyle(element);
    context.fillStyle='#fff';context.font=`112px ${style.fontFamily}`;context.textBaseline='middle';
    const label=element.textContent.replace(/\s/g,''),measure=context.measureText(label).width;
    context.fillText(label,8,88);const data=context.getImageData(0,0,650,180).data,points=[];
    for(let y=12;y<160;y+=3)for(let x=8;x<Math.min(648,measure+10);x+=3){if(data[(y*650+x)*4+3]>100)points.push({x:rect.left+(x-8)/measure*rect.width,y:rect.top+(y-28)/120*rect.height});}
    return {points,rect};
  }
  function coverPoints(image,origin,targets){
    const sample=document.createElement('canvas');sample.width=360;sample.height=240;
    const context=sample.getContext('2d',{willReadFrequently:true});context.drawImage(image,0,0,360,240);
    const data=context.getImageData(0,0,360,240).data,points=[];
    for(let y=0;y<240;y+=2)for(let x=0;x<360;x+=2){
      const k=(y*360+x)*4,light=(data[k]+data[k+1]+data[k+2])/765;if(light<.16)continue;
      const group=(x<180?0:1)+(y<120?0:2),glyph=targets[group].points;
      if(!glyph.length)continue;
      const end=glyph[Math.floor(Math.random()*glyph.length)],r=Math.random(),bend=Math.random()*2-1;
      points.push({x:origin.x-origin.iw/2+x/360*origin.iw,y:origin.y-origin.ih/2+y/240*origin.ih,tx:end.x,ty:end.y,r,bend,light,color:`rgb(${data[k]},${data[k+1]},${data[k+2]})`,group});
    }
    return points;
  }
  async function open({image,origin,instant=false}){
    clean();const token=++generation;page.hidden=false;page.scrollTop=0;page.classList.add('is-opening');document.body.classList.add('chapter-open');
    canvas.style.opacity='1';canvas.hidden=false;
    if(instant||reduced.matches){page.classList.remove('is-opening');canvas.hidden=true;return;}
    const ctx=canvas.getContext('2d');if(!ctx){page.classList.remove('is-opening');canvas.hidden=true;return;}
    const width=innerWidth,height=innerHeight,ratio=Math.min(devicePixelRatio||1,1.5);canvas.width=width*ratio;canvas.height=height*ratio;ctx.setTransform(ratio,0,0,ratio,0,0);
    const targets=[...page.querySelectorAll('.chapter-value')].map(glyphPoints),points=coverPoints(image,origin,targets);
    // Independent gestures: a low sweep, a lifted hairpin, a shallow fold, a wide return.
    // A small variation per entrance keeps them alive without losing the composition.
    const paths=[
      {sx:-.16,sy:.09,ax:-.29,ay:.12,bx:-.10,by:-.12,start:.29,end:1.43,strands:5,spread:3.5,weight:.68,tail:.32},
      {sx:.04,sy:-.14,ax:.12,ay:-.35,bx:-.18,by:-.09,start:.43,end:1.61,strands:7,spread:4.8,weight:.83,tail:.24},
      {sx:-.06,sy:.03,ax:.25,ay:-.09,bx:.05,by:.13,start:.22,end:1.33,strands:4,spread:3,weight:.57,tail:.42},
      {sx:.15,sy:-.04,ax:.33,ay:-.23,bx:.12,by:.03,start:.37,end:1.51,strands:6,spread:4.2,weight:.74,tail:.29}
    ].map(p=>({...p,ax:p.ax+(Math.random()-.5)*.035,ay:p.ay+(Math.random()-.5)*.04,phase:Math.random()*Math.PI*2}));
    reveal(page.querySelector('.chapter-platform'),850,900);reveal(page.querySelector('.chapter-explanation'),1050,900);
    page.querySelectorAll('.chapter-result').forEach((element,i)=>reveal(element,paths[i].end*1000-50,640));
    const start=performance.now();
    await new Promise(resolve=>{
      finishOpening=resolve;
      function draw(now){
        if(token!==generation){resolve();return;}
        const t=(now-start)/1000;ctx.clearRect(0,0,width,height);
        const peel=smooth(.20,.62,t),fade=1-smooth(1.66,2.24,t);
        ctx.globalCompositeOperation='lighter';
        // The original image unfolds as reflective slivers before it becomes light.
        const unfold=smooth(.04,.70,t),material=1-smooth(.36,.88,t);
        if(material>0){for(let i=0;i<40;i++){
          const u=(i+.5)/40-.5,depth=Math.sin(i*.59+unfold*2.2),expansion=1+unfold*.72;
          ctx.save();ctx.translate(origin.x+u*origin.iw*expansion,origin.y+Math.sin(i*.23)*unfold*27);
          ctx.rotate(u*unfold*.25);ctx.scale(Math.max(.12,Math.cos(unfold*depth*1.35)),expansion);
          ctx.globalAlpha=material*(.84+.16*Math.cos(i*.4-unfold*5));
          ctx.drawImage(image,i*image.naturalWidth/40,0,image.naturalWidth/40,image.naturalHeight,-origin.iw/80,-origin.ih/2,origin.iw/40+.3,origin.ih);
          ctx.restore();
        }}
        // Coherent silver filaments carry the motion; points add depth, not visual noise.
        targets.forEach(({rect},g)=>{
          const path=paths[g],silk=smooth(path.start,path.start+.30,t)*(1-smooth(path.end-.16,path.end+.28,t));
          if(silk<=0)return;
          const tx=rect.left+rect.width/2,ty=rect.top+rect.height/2;
          const sx=origin.x+path.sx*origin.iw,sy=origin.y+path.sy*origin.ih;
          const head=smooth(path.start,path.end,t),tail=Math.max(0,head-path.tail),core=Math.floor(path.strands/2);
          for(let strand=0;strand<path.strands;strand++){
            const offset=(strand-core)*path.spread;
            ctx.beginPath();
            for(let step=0;step<=35;step++){
              const p=tail+(head-tail)*step/35;
              const fold=Math.sin(p*Math.PI)*Math.sin(p*4+path.phase)*offset;
              const x=curve(sx,sx+path.ax*width,tx+path.bx*width,tx,p)+fold;
              const y=curve(sy,sy+path.ay*height+offset,ty+path.by*height-offset*.4,ty,p);
              if(step===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
            }
            ctx.strokeStyle=strand===core?'#f2e0ef':'#c9cbd7';ctx.globalAlpha=silk*(strand===core?.42:.12);ctx.lineWidth=strand===core?path.weight:.32;
            ctx.shadowColor='#e9dfea';ctx.shadowBlur=strand===core?7:0;ctx.stroke();ctx.shadowBlur=0;
          }
        });
        for(const p of points){
          const path=paths[p.group],progress=smooth(path.start-.08+p.r*.12,path.end+p.r*.10,t),arc=Math.sin(Math.PI*progress);
          const x=curve(p.x,p.x+path.ax*width,p.tx+path.bx*width,p.tx,progress)+arc*p.bend*24;
          const y=curve(p.y,p.y+path.ay*height,p.ty+path.by*height,p.ty,progress)+arc*Math.sin(p.r*16+path.phase)*18;
          const size=(.45+p.light)*(.9+arc*p.r*2.5);
          ctx.globalAlpha=peel*fade*(.4+p.light*.5);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(x,y,size*.5,0,Math.PI*2);ctx.fill();
          if(p.r>.985&&arc>.2){ctx.globalAlpha*=.55;ctx.strokeStyle='#f2e0ef';ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(x-6*arc,y);ctx.lineTo(x+6*arc,y);ctx.moveTo(x,y-6*arc);ctx.lineTo(x,y+6*arc);ctx.stroke();}
        }
        // Four brief silver ripples mark the points where fragments become typography.
        for(let i=0;i<targets.length;i++){
          const end=paths[i].end,arrival=smooth(end-.27,end+.02,t)*(1-smooth(end+.02,end+.40,t));
          if(arrival<=0)continue;
          const r=targets[i].rect,radius=12+smooth(end-.24,end+.40,t)*(40+i*6),x=r.left+r.width/2,y=r.top+r.height/2;
          const halo=ctx.createRadialGradient(x,y,0,x,y,80);halo.addColorStop(0,'rgba(242,224,239,.10)');halo.addColorStop(1,'rgba(242,224,239,0)');ctx.globalAlpha=arrival;ctx.fillStyle=halo;ctx.fillRect(x-80,y-80,160,160);
          ctx.globalAlpha=arrival*.22;ctx.strokeStyle='#eee4ef';ctx.lineWidth=.6;ctx.beginPath();ctx.ellipse(x,y,radius*1.5,radius*.33,-.35+i*.19,0,Math.PI*2);ctx.stroke();
        }
        ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
        if(t<2.25){frame=requestAnimationFrame(draw);}else{frame=0;canvas.hidden=true;page.classList.remove('is-opening');finishOpening=null;resolve();}
      }
      frame=requestAnimationFrame(draw);
    });
  }
  async function close(instant=false){
    ++generation;clean();canvas.hidden=true;page.classList.remove('is-opening');
    const animation=page.animate([{opacity:1},{opacity:0}],{duration:reduced.matches||instant?0:320,easing:'ease',fill:'forwards'});
    document.body.classList.remove('chapter-open');
    try{await animation.finished;}finally{page.hidden=true;animation.cancel();}
  }
  addEventListener('resize',()=>{if(!page.hidden){++generation;clean();canvas.hidden=true;page.classList.remove('is-opening');}});
  reduced.addEventListener('change',()=>{if(reduced.matches&&!page.hidden){++generation;clean();canvas.hidden=true;page.classList.remove('is-opening');}});
  window.CharacterChapter={open,close};
})();
