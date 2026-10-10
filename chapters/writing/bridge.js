(() => {
 if(parent===window)return;
 const send=data=>parent.postMessage(data,location.origin);
 const narrative=location.pathname.includes('/narrative/');
 const storyIds=narrative?JSON.parse(document.querySelector('#works-data').textContent).map(work=>work.id):[];
 function navigateStory(hash){send({type:'writing-navigate-story',hash});}
 document.documentElement.classList.add('writing-embedded');
 function modal(){return !!document.querySelector('dialog[open],#lightbox.active');}
 let lastModal=false;
 function reportModal(){const open=modal();if(open!==lastModal){lastModal=open;send({type:'writing-modal',open});}}
 const observer=new MutationObserver(reportModal);observer.observe(document.body,{subtree:true,attributes:true,attributeFilter:['open','class']});
 function reportRoute(){if(narrative)send({type:'writing-child-route',hash:location.hash,title:document.title});}
 addEventListener('hashchange',reportRoute);
 addEventListener('message',event=>{
  if(event.origin!==location.origin||event.source!==parent)return;
  if(event.data?.type==='writing-route-set'&&narrative&&location.hash!==event.data.hash){
   const oldURL=location.href;history.replaceState(null,'',location.pathname+(event.data.hash||''));
   dispatchEvent(new HashChangeEvent('hashchange',{oldURL,newURL:location.href}));
  }
  if(event.data?.type==='writing-activate'){document.documentElement.classList.remove('embedded-pending');dispatchEvent(new CustomEvent('writing-activate'));reportRoute();reportModal();}
  if(event.data?.type==='writing-deactivate')dispatchEvent(new CustomEvent('writing-deactivate'));
 });
 addEventListener('keydown',event=>{
  if(event.ctrlKey||event.metaKey||event.altKey||event.shiftKey||event.target.closest('input,textarea,select,[contenteditable="true"]')||modal())return;
  if(narrative&&location.hash.startsWith('#read/')){
   if(window.getSelection()?.toString())return;
   if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();navigateStory('');}
   if(['ArrowLeft','ArrowRight'].includes(event.key)){
    event.preventDefault();event.stopImmediatePropagation();if(event.repeat)return;
    const next=storyIds.indexOf(location.hash.slice(6))+(event.key==='ArrowRight'?1:-1);
    navigateStory(storyIds[next]?'#read/'+storyIds[next]:'');
   }
   return;
  }
  if(['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();event.stopImmediatePropagation();if(!event.repeat)send({type:'writing-step',direction:event.key==='ArrowRight'?1:-1});}
  if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();send({type:'writing-back'});}
 },true);
 document.addEventListener('click',event=>{
  if(!narrative||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  const link=event.target.closest('a[href^="#"]');if(!link)return;
  const hash=link.getAttribute('href');if(hash!=='#'&&!hash.startsWith('#read/'))return;
  event.preventDefault();event.stopImmediatePropagation();navigateStory(hash==='#'?'':hash);
 },true);
})();
