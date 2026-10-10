(() => {
  'use strict';
  const fine=matchMedia('(hover: hover) and (pointer: fine)'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const documents=new WeakSet(),frames=new WeakSet(),cursors=new Map();
  const css=`
    .portfolio-cursor{position:fixed;top:0;left:0;width:100%;height:100%;z-index:2147483647;pointer-events:none!important;overflow:visible;mix-blend-mode:difference}
    .portfolio-cursor line{stroke:#fff;stroke-width:1.25;stroke-linecap:round;pointer-events:none}
    .portfolio-cursor.is-link line{stroke-width:1.8}
    .portfolio-cursor.is-pressed line{stroke-width:1}
    .artwork[data-cursor-interactive="true"]{cursor:pointer}
    @media(prefers-reduced-motion:reduce),(hover:none),(pointer:coarse){.portfolio-cursor{display:none}}
  `;
  function install(doc){
    if(!doc.body||documents.has(doc))return;
    documents.add(doc);
    const win=doc.defaultView,style=doc.createElement('style');style.textContent=css;doc.head.append(style);
    const svgNS='http://www.w3.org/2000/svg',ring=doc.createElementNS(svgNS,'svg');ring.setAttribute('class','portfolio-cursor');ring.setAttribute('aria-hidden','true');doc.body.append(ring);
    const lines=Array.from({length:16},()=>{const line=doc.createElementNS(svgNS,'line');line.style.opacity=0;ring.append(line);return line;});
    let frame=0,points=[],link=false;
    const hide=()=>{win.cancelAnimationFrame(frame);frame=0;points=[];lines.forEach(line=>line.style.opacity=0);ring.classList.remove('is-pressed');};
    cursors.set(ring,hide);
    function draw(now){
      frame=0;
      const host=doc.querySelector('dialog[open]')||doc.body;
      if(ring.parentNode!==host)host.append(ring);
      points=points.filter(point=>now-point.t<150);
      ring.classList.toggle('is-link',link);
      let distance=0,index=0;
      for(let i=points.length-1;i>0&&index<lines.length;i--){
        const a=points[i],b=points[i-1],length=Math.hypot(b.x-a.x,b.y-a.y);
        if(!length)continue;
        const ratio=Math.min(1,(38-distance)/length),line=lines[index++];
        line.setAttribute('x1',a.x);line.setAttribute('y1',a.y);
        line.setAttribute('x2',a.x+(b.x-a.x)*ratio);line.setAttribute('y2',a.y+(b.y-a.y)*ratio);
        line.style.opacity=Math.max(0,(1-(now-b.t)/150)*(1-distance/38)*(link?.65:.42));
        distance+=length;if(distance>=38)break;
      }
      for(;index<lines.length;index++)lines[index].style.opacity=0;
      if(points.length)frame=win.requestAnimationFrame(draw);
    }
    doc.addEventListener('pointermove',e=>{
      if(!fine.matches||reduced.matches||e.pointerType==='touch'){hide();return;}
      const el=e.target;
      if(!(el instanceof win.Element)||el.closest('iframe,input:not([type="button"]):not([type="submit"]):not([type="checkbox"]):not([type="radio"]),textarea,[contenteditable="true"]')){hide();return;}
      cursors.forEach((clear,other)=>{if(!other.isConnected)cursors.delete(other);else if(other!==ring)clear();});
      const now=win.performance.now(),last=points[points.length-1];
      if(last&&(now-last.t>150||Math.hypot(e.clientX-last.x,e.clientY-last.y)>160))points=[];
      points.push({x:e.clientX,y:e.clientY,t:now});if(points.length>17)points.shift();
      link=!el.closest('[inert],:disabled,[aria-disabled="true"]')&&!!(el.closest('a[href],button,summary,label,[role="button"],[role="link"],[onclick],input,[data-cursor-interactive="true"]')||win.getComputedStyle(el).cursor==='pointer');
      if(!frame)frame=win.requestAnimationFrame(draw);
    },{passive:true});
    doc.addEventListener('pointerdown',()=>ring.classList.add('is-pressed'),{passive:true});
    doc.addEventListener('pointerup',()=>ring.classList.remove('is-pressed'),{passive:true});
    doc.addEventListener('pointercancel',hide,{passive:true});
    doc.addEventListener('pointerout',e=>{if(!e.relatedTarget)hide();},{passive:true});
    doc.addEventListener('scroll',hide,{capture:true,passive:true});
    doc.addEventListener('keydown',hide,{passive:true});win.addEventListener('blur',hide);
    doc.addEventListener('visibilitychange',()=>{if(doc.hidden)hide();});
    const bindFrame=el=>{
      if(frames.has(el))return;frames.add(el);
      const attach=()=>{try{if(el.contentDocument?.readyState==='complete')install(el.contentDocument);}catch{}};
      el.addEventListener('load',attach);attach();
    };
    doc.querySelectorAll('iframe').forEach(bindFrame);
    const observer=new MutationObserver(records=>{
      for(const record of records){
        if(record.type==='attributes'){hide();continue;}
        for(const node of record.addedNodes){if(node.nodeType!==1||node===ring)continue;if(node.matches('iframe'))bindFrame(node);node.querySelectorAll('iframe').forEach(bindFrame);}
      }
    });
    observer.observe(doc.body,{subtree:true,childList:true,attributes:true,attributeFilter:['open']});
    win.addEventListener('pagehide',()=>{hide();observer.disconnect();cursors.delete(ring);},{once:true});
  }
  install(document);
})();
