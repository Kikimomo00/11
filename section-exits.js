(() => {
  'use strict';
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const ease='cubic-bezier(.64,0,.28,1)';
  function visibleSection(host,selector){
    return [...host.querySelectorAll(selector)].sort((a,b)=>{
      const overlap=el=>{const r=el.getBoundingClientRect();return Math.max(0,Math.min(innerHeight,r.bottom)-Math.max(0,r.top));};
      return overlap(b)-overlap(a);
    })[0];
  }
  async function play({kind,home}){
    const motions=[],locked=[];
    const animate=(el,to,duration=700,delay=0)=>{
      if(!el)return;
      const style=el.ownerDocument.defaultView.getComputedStyle(el),from={};
      Object.keys(to).forEach(key=>from[key]=style[key]);
      if('clipPath' in to&&from.clipPath==='none')from.clipPath='inset(0 0 0 0)';
      const motion=el.animate([from,to],{duration,delay,easing:ease,fill:'forwards'});motions.push(motion);return motion;
    };
    const fade=(el,delay=0)=>animate(el,{opacity:0,translate:'0 -12px'},360,delay);
    const lock=el=>{if(el){locked.push([el,el.inert]);el.inert=true;}};
    const finish=()=>{motions.forEach(a=>a.cancel());locked.forEach(([el,inert])=>el.inert=inert);};
    const chapter=document.querySelector('#characters-intro'),writing=document.querySelector('.writing-shell'),ai=document.querySelector('.ai-shell');
    const host=kind==='writing'?writing:kind==='ai'?ai:chapter;
    if(!host||reduced.matches)return finish;
    // Keep the outgoing live DOM, including its current scroll and hover state.
    lock(host);window.dispatchEvent(new Event('text-light-reset'));
    let duration=980;
    if(kind==='writing'){
      const section=visibleSection(host,'.writing-flow-page'),frame=section?.querySelector('iframe'),doc=frame?.contentDocument;
      const fashion=!!doc?.querySelector('.fashion-stage');
      fade(host.querySelector('.writing-back'));fade(host.querySelector('.writing-dock'));
      if(fashion){
        doc.querySelectorAll('.art-frame').forEach((el,i)=>{
          animate(el,{translate:`${i?42:-42}px ${i?-90:90}px`,rotate:`${i?7:-7}deg`,scale:'.86',clipPath:i?'inset(100% 0 0 0)':'inset(0 0 100% 0)',opacity:0},820,i*85);
        });
        [...doc.querySelectorAll('.metrics>div')].reverse().forEach((el,i)=>fade(el,i*50));
        animate(doc.querySelector('.description'),{clipPath:'inset(0 0 100% 0)',translate:'0 -20px',opacity:0},580,70);
        animate(doc.querySelector('.tapered-hairline'),{scale:'0 1',opacity:0},600,70);
        animate(doc.querySelector('.editorial header'),{clipPath:'inset(0 100% 0 0)',translate:'-25px 0',opacity:0},660,160);
      }else{
        doc?.querySelectorAll('.work').forEach((work,i)=>{
          const delay=(2-i)*90;
          fade(work.querySelector('.work-description'),delay);fade(work.querySelector('.caption'),delay+30);
          animate(work.querySelector('.evidence'),{clipPath:'inset(0 0 100% 0)',translate:'0 -28px',scale:'.96',opacity:0},720,delay);
          fade(work.querySelector('.media-lead'),delay+90);
          animate(work.querySelector('.work-heading'),{clipPath:'inset(0 100% 0 0)',opacity:0},520,delay+120);
          fade(work.querySelector('.category'),delay+70);
        });
        doc?.querySelectorAll('#page-title>.ink').forEach((el,i)=>animate(el,{clipPath:'inset(100% 0 0 0)',translate:'0 -18px',opacity:0},660,230-i*100));
      }
    }else if(kind==='ai'){
      fade(host.querySelector('.ai-back'));fade(host.querySelector('.ai-chapter-label'));
      fade(host.querySelector('.ai-controls'));fade(host.querySelector('.ai-image-credit'),60);
      animate(host.querySelector('.ai-caption'),{clipPath:'inset(0 0 100% 0)',translate:'0 22px',opacity:0},560);
      host.querySelectorAll('.ai-card').forEach((el,i)=>{
        if(getComputedStyle(el).visibility==='hidden')return;
        animate(el,{transform:`translate(-50%,-50%) translate3d(${(i-1.5)*18}px,0,-460px) rotateY(${(i-1.5)*24+65}deg) scale(.6)`,opacity:0},850,i*35);
      });
      animate(host.querySelector('.ai-heading h2'),{clipPath:'inset(0 100% 0 0)',translate:'-24px 0',opacity:0},650,130);
      fade(host.querySelector('.ai-heading p'),80);
    }else{
      const section=visibleSection(chapter,'.chapter-flow-page'),frame=section?.querySelector('iframe'),doc=frame?.contentDocument;
      lock(document.querySelector('.chapter-pagination'));fade(document.querySelector('.chapter-pagination'));
      fade(section?.querySelector('.profile-header,.chapter-header'));
      if(section?.dataset.page==='creation'&&doc){
        const rect=frame.getBoundingClientRect();
        doc.querySelectorAll('.card-unit').forEach((el,i)=>{
          const r=el.getBoundingClientRect();
          animate(el,{translate:`${(home.x-rect.left-r.left-r.width/2)*.78}px ${(home.y-rect.top-r.top-r.height/2)*.55}px`,scale:'.24',rotate:`${(i-1.5)*8}deg`,opacity:0},820,[60,150,0,100][i]);
        });
        fade(doc.querySelector('footer'),0);animate(section.querySelector('.chapter-stars'),{opacity:0},650,80);
      }else if(section?.dataset.page==='methodology'&&doc){
        [...doc.querySelectorAll('.method-node')].reverse().forEach((el,i)=>animate(el,{clipPath:'inset(0 0 100% 0)',translate:`${i%2?24:-24}px -24px`,opacity:0},650,i*80));
        animate(doc.querySelector('#master-title'),{clipPath:'inset(0 50% 0 50%)',opacity:0,translate:'0 -12px'},780,140);
        doc.querySelectorAll('canvas').forEach(el=>fade(el));
      }else{
        section?.querySelectorAll('.chapter-result').forEach((el,i)=>animate(el,{translate:`${(1.5-i)*35}px -42px`,scale:'.85',opacity:0},650,(3-i)*75));
        animate(section?.querySelector('.chapter-platform'),{clipPath:'inset(0 0 100% 0)',translate:'0 -30px',opacity:0},800,100);
        fade(section?.querySelector('.chapter-explanation'),50);
      }
      const evidence=document.querySelector('.evidence-page');
      if(evidence&&!evidence.hidden){lock(evidence);animate(evidence,{clipPath:'inset(0 50% 0 50%)',opacity:0},800,80);}
    }
    // The directory is already underneath: uncover it only after the content starts moving.
    animate(host,{opacity:0},500,duration-500);
    const artwork=document.querySelector('#artwork');
    if(artwork)motions.push(artwork.animate([{scale:'.94',opacity:.35},{scale:'1',opacity:1}],{duration:740,delay:220,fill:'backwards',easing:'cubic-bezier(.22,1,.36,1)'}));
    const caption=document.querySelector('main>.caption');
    if(caption)motions.push(caption.animate([{opacity:0,translate:'0 14px'},{opacity:1,translate:'0 0'}],{duration:540,delay:360,fill:'backwards',easing:'cubic-bezier(.22,1,.36,1)'}));
    await Promise.all(motions.map(a=>a.finished.catch(()=>{})));
    return finish;
  }
  window.SectionExits={play};
})();
