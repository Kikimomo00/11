(() => {
  'use strict';
  const data=window.characterData,arena=document.querySelector('#cards-arena'),cards=[...arena.children];
  const modal=document.querySelector('#editorial-modal'),frame=document.querySelector('#modal-frame'),close=document.querySelector('#modal-close-btn');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let lastCard=null,raf=0,targetX=0,targetY=0,x=0,y=0,readyTimer=0,activated=false;
  const back=()=>parent.postMessage({type:'chapter-back'},location.origin);
  function move(){raf=0;x+=(targetX-x)*.13;y+=(targetY-y)*.13;frame.style.setProperty('--rx',y+'deg');frame.style.setProperty('--ry',x+'deg');if(Math.abs(targetX-x)+Math.abs(targetY-y)>.008)raf=requestAnimationFrame(move);}
  function open(index){
    const item=data[index];lastCard=cards[index];
    document.querySelector('#modal-title').textContent=item.name;document.querySelector('#modal-roman').textContent=item.roman;
    document.querySelector('#modal-tagline').textContent=item.tagline;document.querySelector('#modal-body').textContent=item.body;
    const image=document.querySelector('#modal-image');image.src=item.image;image.alt=item.name;
    parent.postMessage({type:'chapter-modal',open:true},location.origin);arena.inert=true;modal.inert=false;modal.setAttribute('aria-hidden','false');modal.classList.add('is-active');frame.scrollTop=0;
    document.body.style.overflow='hidden';close.focus({preventScroll:true});
    clearTimeout(readyTimer);readyTimer=setTimeout(()=>frame.classList.add('parallax-ready'),900);
  }
  function hide(){parent.postMessage({type:'chapter-modal',open:false},location.origin);clearTimeout(readyTimer);cancelAnimationFrame(raf);raf=0;targetX=targetY=x=y=0;frame.style.removeProperty('--rx');frame.style.removeProperty('--ry');frame.classList.remove('parallax-ready');modal.classList.remove('is-active');modal.inert=true;modal.setAttribute('aria-hidden','true');arena.inert=false;document.body.style.overflow='';lastCard?.focus({preventScroll:true});}
  cards.forEach((card,index)=>{
    card.addEventListener('pointerenter',e=>{if(e.pointerType==='touch')return;card.classList.add('is-chosen');arena.classList.add('is-focusing');});
    card.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;const r=card.getBoundingClientRect();card.style.setProperty('--mouse-px',e.clientX-r.left+'px');card.style.setProperty('--mouse-py',e.clientY-r.top+'px');card.style.setProperty('--light-x',(e.clientX-r.left)/r.width*100+'%');card.style.setProperty('--light-y',(e.clientY-r.top)/r.height*100+'%');});
    card.addEventListener('pointerleave',()=>{card.classList.remove('is-chosen');arena.classList.remove('is-focusing');});
    card.addEventListener('click',()=>open(index));card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open(index);}});
  });
  close.onclick=hide;modal.onclick=e=>{if(e.target===modal)hide();};
  addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();if(modal.classList.contains('is-active'))hide();else back();}if(e.key==='Tab'&&modal.classList.contains('is-active')){e.preventDefault();close.focus();}});
  modal.addEventListener('pointermove',e=>{if(reduced.matches||innerWidth<768||!frame.classList.contains('parallax-ready'))return;targetX=(e.clientX/innerWidth-.5)*3;targetY=-(e.clientY/innerHeight-.5)*2;if(!raf)raf=requestAnimationFrame(move);});
  modal.addEventListener('pointerleave',()=>{targetX=targetY=0;if(!raf&&!reduced.matches)raf=requestAnimationFrame(move);});
  let entryAnimations=[];
  function activate(){
    if(activated)return;activated=true;entryAnimations.forEach(a=>a.cancel());entryAnimations=[];
    if(reduced.matches)return;
    cards.forEach((card,i)=>{
      const inward=(1.5-i)*Math.min(innerWidth*.045,52);
      entryAnimations.push(card.animate([
        {opacity:0,translate:`${inward}px ${i%2?64:42}px`,rotate:`${(1.5-i)*5}deg`,scale:'.9',clipPath:'inset(0 0 100% 0)'},
        {offset:.66,opacity:1,clipPath:'inset(0 0 0% 0)'},
        {opacity:1,translate:'0 0',rotate:'0deg',scale:'1',clipPath:'inset(0 0 0% 0)'}
      ],{duration:1200,delay:[80,220,0,150][i],easing:'cubic-bezier(.22,1,.36,1)',fill:'backwards'}));
    });
    entryAnimations.push(document.querySelector('footer').animate([{opacity:0,translate:'0 8px'},{opacity:1,translate:'0 0'}],{duration:650,delay:700,fill:'backwards',easing:'ease-out'}));
  }
  function depart(direction){if(reduced.matches)return;cards.forEach((card,i)=>card.animate([{opacity:1,translate:'0 0',rotate:'0deg'},{opacity:0,translate:`${-direction*(35+i*16)}px ${i%2?-18:18}px`,rotate:`${-direction*(i%2?5:-3)}deg`}],{duration:450,delay:i*18,easing:'cubic-bezier(.55,0,.3,1)',fill:'forwards'}));}
  let chapterVisible=parent===window;
  function floatState(){document.body.classList.toggle('is-chapter-active',chapterVisible&&!document.hidden);}
  document.addEventListener('visibilitychange',floatState);
  addEventListener('message',e=>{if(e.source!==parent||e.origin!==location.origin)return;if(e.data?.type==='chapter-activate'){chapterVisible=true;floatState();activate();}if(e.data?.type==='chapter-deactivate'){chapterVisible=false;activated=false;entryAnimations.forEach(a=>a.cancel());entryAnimations=[];floatState();}if(e.data?.type==='chapter-depart')depart(e.data.direction||1);});
  addEventListener('keydown',e=>{
    if(parent===window||e.ctrlKey||e.metaKey||e.altKey||e.shiftKey||modal.classList.contains('is-active')||e.target?.closest?.('input,textarea,select,[contenteditable="true"]'))return;
    if(!['ArrowLeft','ArrowRight'].includes(e.key))return;
    e.preventDefault();if(!e.repeat)parent.postMessage({type:'chapter-step',direction:e.key==='ArrowLeft'?-1:1},location.origin);
  });
  if(parent===window){floatState();activate();}
})();
