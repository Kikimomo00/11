(() => {
  'use strict';
  const fashion=location.pathname.includes('/fashion/');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const root=document.documentElement;
  let active=false,animations=[];
  const style=document.createElement('style');
  style.textContent='.entrance{animation:none}.writing-entry-pending .editorial,.writing-entry-pending .art-grid,.writing-entry-pending .introduction,.writing-entry-pending .works{opacity:0}#page-title>.ink{display:inline-block}';
  document.head.append(style);
  if(parent!==window&&!reduced.matches)root.classList.add('writing-entry-pending');
  const ease='cubic-bezier(.22,1,.36,1)';
  function animate(el,keys,delay=0,duration=900){if(el)animations.push(el.animate(keys,{duration,delay,easing:ease,fill:'backwards'}));}
  const rise=[{opacity:0,translate:'0 20px'},{opacity:1,translate:'0 0'}];
  function activate(){
    if(active)return;active=true;root.classList.remove('writing-entry-pending');
    if(reduced.matches)return;
    if(fashion){
      animate(document.querySelector('.editorial header'),[{opacity:0,clipPath:'inset(0 100% 0 0)',translate:'-12px 0'},{opacity:1,clipPath:'inset(0 0% 0 0)',translate:'0 0'}],40,950);
      animate(document.querySelector('.tapered-hairline'),[{scale:'0 1',opacity:0},{scale:'1 1',opacity:1}],180,1000);
      animate(document.querySelector('.description'),rise,220,900);
      document.querySelectorAll('.metrics>div').forEach((el,i)=>animate(el,rise,440+i*100,700));
      document.querySelectorAll('.art-frame').forEach((el,i)=>{
        animate(el,[{opacity:0,clipPath:i?'inset(100% 0 0 0)':'inset(0 0 100% 0)',translate:`${i?22:-22}px ${i?32:-32}px`,rotate:`${i?3:-3}deg`},{opacity:1,clipPath:'inset(0 0 0 0)',translate:'0 0',rotate:'0deg'}],120+i*160,1200);
        animate(el.querySelector('img'),[{transform:'scale(1.12)'},{transform:'scale(1)'}],120+i*160,1400);
      });
    }else{
      document.querySelectorAll('#page-title>.ink').forEach((el,i)=>animate(el,[{opacity:0,clipPath:'inset(0 0 100% 0)',translate:'0 14px'},{opacity:1,clipPath:'inset(0 0 0% 0)',translate:'0 0'}],i*140,1000));
      document.querySelectorAll('.work').forEach((work,i)=>{
        const delay=260+i*160;
        animate(work.querySelector('.work-heading'),rise,delay,800);
        animate(work.querySelector('.category'),rise,delay+65,800);
        animate(work.querySelector('.media-lead'),rise,delay+130,850);
        animate(work.querySelector('.evidence'),[{opacity:0,clipPath:'inset(0 100% 0 0)',translate:'0 12px'},{opacity:1,clipPath:'inset(0 0% 0 0)',translate:'0 0'}],delay+180,1100);
        animate(work.querySelector('.caption'),rise,delay+380,700);
        animate(work.querySelector('.work-description'),rise,delay+440,750);
      });
    }
  }
  function deactivate(){active=false;animations.forEach(a=>a.cancel());animations=[];if(!reduced.matches)root.classList.add('writing-entry-pending');}
  addEventListener('writing-activate',activate);addEventListener('writing-deactivate',deactivate);
  reduced.addEventListener('change',()=>{animations.forEach(a=>a.cancel());animations=[];root.classList.remove('writing-entry-pending');});
  if(parent===window)activate();
})();
