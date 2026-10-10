(() => {
  'use strict';
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const precise=matchMedia('(hover: hover) and (pointer: fine)');
  // Flex text runs need their own paint box for consistent glyph clipping in Chromium.
  document.querySelectorAll('.chapter-value.word-value').forEach(el=>{
    [...el.childNodes].filter(node=>node.nodeType===Node.TEXT_NODE&&node.textContent.trim()).forEach(node=>{
      const span=document.createElement('span');node.replaceWith(span);span.append(node);
    });
  });
  const selector='.profile-copy p,.profile-copy blockquote,.profile-copy h3,.chapter-platform>span,.chapter-platform>p,.chapter-explanation>p,.chapter-value:not(.word-value),.chapter-value.word-value>span,.chapter-result dt,.evidence-lead h1,.evidence-description,.evidence-note,.evidence-metric:not(.words),.evidence-piece h2,.evidence-piece p,.piece-stat';
  const mounts=new WeakMap();
  function mount(page){
    mounts.get(page)?.();
    const controller=new AbortController(),signal=controller.signal;
    const texts=[...page.querySelectorAll(selector)];
    let frame=0,point=null;
    const active=new Set(),glows=new Map();
    function remove(el){
      el.classList.remove('text-illuminated');el.style.removeProperty('--light-strength');
      glows.get(el)?.remove();glows.delete(el);active.delete(el);
    }
    function clear(){
      cancelAnimationFrame(frame);frame=0;active.forEach(remove);
    }
    function createGlow(el){
      const glow=el.cloneNode(true);
      const sources=[el,...el.querySelectorAll('*')],copies=[glow,...glow.querySelectorAll('*')];
      const properties=['font-family','font-size','font-weight','font-style','line-height','letter-spacing','white-space','text-wrap','text-transform','text-indent','text-align','display','align-items','justify-content','gap','margin','padding'];
      sources.forEach((source,i)=>{
        const style=getComputedStyle(source),copy=copies[i];
        copy.removeAttribute('id');copy.removeAttribute('class');copy.removeAttribute('style');
        properties.forEach(name=>copy.style.setProperty(name,style.getPropertyValue(name)));
        copy.style.setProperty('-webkit-text-fill-color','#fffaff');
      });
      glow.className='text-local-glow';glow.setAttribute('aria-hidden','true');
      Object.assign(glow.style,{position:'fixed',margin:'0',padding:'0',pointerEvents:'none',zIndex:'2'});
      page.append(glow);glows.set(el,glow);return glow;
    }
    function paint(){
      frame=0;
      if(page.hidden||page.inert||page.classList.contains('is-opening')||page.classList.contains('is-dragging'))return;
      const radius=86;
      for(const el of texts){
        const rect=el.getBoundingClientRect(),x=point.x-rect.left,y=point.y-rect.top;
        if(x < -radius||y < -radius||x>rect.width+radius||y>rect.height+radius){
          remove(el);continue;
        }
        if(!active.has(el)){
          const color=getComputedStyle(el).color,channels=color.match(/[\d.]+/g).slice(0,3).map(Number);
          el.style.setProperty('--text-ink',color);
          if(channels.reduce((sum,n)=>sum+n,0)/3>195)createGlow(el);
          el.classList.add('text-illuminated');active.add(el);
        }
        el.style.setProperty('--light-x',`${x}px`);el.style.setProperty('--light-y',`${y}px`);
        el.style.setProperty('--light-strength','1');
        const glow=glows.get(el);
        if(glow){
          Object.assign(glow.style,{left:`${rect.left}px`,top:`${rect.top}px`,width:`${rect.width}px`,height:`${rect.height}px`});
          glow.style.setProperty('--light-x',`${x}px`);glow.style.setProperty('--light-y',`${y}px`);
        }
      }
    }
    page.addEventListener('pointermove',event=>{
      if(!precise.matches||reduced.matches||event.pointerType==='touch')return;
      point={x:event.clientX,y:event.clientY};
      if(!frame)frame=requestAnimationFrame(paint);
      // Keep the last spotlight while the pointer rests; no idle animation loop.
    },{passive:true,signal});
    page.addEventListener('pointerleave',clear,{signal});
    page.addEventListener('scroll',clear,{passive:true,capture:true,signal});
    addEventListener('text-light-reset',clear,{signal});
    addEventListener('resize',clear,{signal});
    const observer=new MutationObserver(()=>{if(page.hidden||page.inert)clear();});observer.observe(page,{attributes:true,attributeFilter:['hidden','inert']});
    reduced.addEventListener('change',clear,{signal});precise.addEventListener('change',clear,{signal});
    document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();},{signal});
    mounts.set(page,()=>{clear();controller.abort();observer.disconnect();});
  }
  window.mountTextLight=mount;
  document.querySelectorAll('.profile-page,.characters-page,.evidence-page').forEach(mount);
})();
