(() => {
 'use strict';
 const pages=[['narrative','叙事与内容设计'],['fashion','小红书穿搭账号'],['government','政务写作']],reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const shell=document.createElement('section');shell.className='writing-shell';shell.hidden=true;shell.tabIndex=-1;shell.setAttribute('aria-label','文字作品');
 shell.innerHTML='<div class="writing-stage"></div><button class="writing-back" aria-label="返回作品集目录"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12H4m7-7-7 7 7 7"/></svg></button><nav class="writing-dock" aria-label="文字作品页码">'+pages.map(([key,label],i)=>`<a href="#writing/${key}"><span>0${i+1}</span>${label}</a>`).join('')+'</nav>';
 document.body.append(shell);const stage=shell.querySelector('.writing-stage');
 let sections=[],frames=[],loads=[],current=0,modal=false,detail=false,sequence=0,animations=[],curtain=null,scrollFrame=0,playbackReady=false;
 function parse(hash){const parts=hash.split('/');const index=Math.max(0,pages.findIndex(p=>p[0]===parts[1]));return {index,inner:index===0&&parts[2]?'#read/'+parts[2]:''};}
 function animate(el,keys,options){if(reduced.matches)return Promise.resolve();const a=el.animate(keys,{fill:'both',...options});animations.push(a);return a.finished.catch(()=>{});}
 function cancel(){animations.forEach(a=>a.cancel());animations=[];curtain?.remove();curtain=null;shell.classList.remove('is-entering');}
 function chrome(index,inner=''){detail=!!inner;shell.classList.toggle('is-detail',detail);shell.querySelectorAll('.writing-dock a').forEach((a,i)=>{if(i===index)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});}
 function activateVisible(){
  if(!playbackReady||shell.hidden)return;
  frames.forEach((f,i)=>{
   if(f.dataset.ready!=='true')return;
   const section=sections[i],height=stage.clientHeight;
   const visible=Math.max(0,Math.min(section.offsetTop+section.offsetHeight,stage.scrollTop+height)-Math.max(section.offsetTop,stage.scrollTop));
   if(visible>=Math.min(height,section.offsetHeight)*.65&&f.dataset.playing!=='true'){f.dataset.playing='true';f.contentWindow.postMessage({type:'writing-activate'},location.origin);}
   else if(visible===0&&f.dataset.playing==='true'){f.dataset.playing='false';f.contentWindow.postMessage({type:'writing-deactivate'},location.origin);}
  });
 }
 function select(index,write){current=index;chrome(index,index===0?parse(location.hash).inner:'');document.title=pages[index][1]+' · 翁蕾';if(write)history.replaceState(null,'','#writing/'+pages[index][0]);}
 function mount(inner){
  sections=pages.map(([key,label],i)=>{const section=document.createElement('section');section.className='writing-flow-page';section.setAttribute('aria-label',label);const f=document.createElement('iframe');f.title=label;frames.push(f);loads.push(new Promise(resolve=>f.addEventListener('load',()=>{f.dataset.ready='true';activateVisible();resolve();},{once:true})));f.src=`chapters/writing/${key}/index.html?v=2${i===0?inner:''}`;section.append(f);stage.append(section);return section;});
 }
 async function sync(hash){
  const {index,inner}=parse(hash),entering=shell.hidden,token=++sequence;cancel();shell.hidden=false;
  if(!frames.length)mount(inner);chrome(index,inner);modal=false;shell.classList.remove('is-modal');
  let cover=Promise.resolve();
  if(entering&&index===0&&!inner&&!reduced.matches){shell.classList.add('is-entering');curtain=document.createElement('div');curtain.className='writing-entry-curtain';shell.append(curtain);cover=animate(curtain,[{transform:'translateY(100%)'},{transform:'translateY(0)'}],{duration:520,easing:'cubic-bezier(.65,0,.25,1)'});}
  await Promise.all([loads[index],cover]);if(token!==sequence)return;
  frames[index].contentWindow.postMessage({type:'writing-route-set',hash:inner},location.origin);
  stage.scrollTo({top:sections[index].offsetTop,behavior:entering||detail||reduced.matches?'instant':'smooth'});select(index,false);chrome(index,inner);shell.classList.remove('is-entering');playbackReady=true;activateVisible();
  if(curtain){const paper=frames[0].contentDocument.querySelector('.composition'),r=paper.getBoundingClientRect(),host=frames[0].getBoundingClientRect();await animate(curtain,[{transform:'translate(0,0) scale(1)'},{transform:`translate(${r.left+host.left}px,${r.top+host.top}px) scale(${r.width/innerWidth},${r.height/innerHeight})`}],{duration:650,easing:'cubic-bezier(.76,0,.24,1)'});if(token!==sequence)return;await animate(curtain,[{opacity:1},{opacity:0}],{duration:160});if(token!==sequence)return;cancel();}
 }
 stage.addEventListener('scroll',()=>{if(shell.hidden||detail||modal||scrollFrame)return;scrollFrame=requestAnimationFrame(()=>{scrollFrame=0;activateVisible();const i=Math.max(0,Math.min(2,Math.floor((stage.scrollTop+stage.clientHeight*.5)/stage.clientHeight)));if(i!==current)select(i,true);});},{passive:true});
 function step(direction){if(shell.hidden||modal||detail)return;const n=Math.max(0,Math.min(2,current+direction));if(n!==current)location.hash='#writing/'+pages[n][0];}
 shell.querySelector('.writing-back').onclick=()=>location.hash='#writing';
 addEventListener('message',e=>{
  const index=frames.findIndex(f=>f.contentWindow===e.source);if(e.origin!==location.origin||index<0||shell.hidden)return;const data=e.data;
  if(data?.type==='portfolio-wheel'&&!modal&&!detail)stage.scrollBy({top:data.delta,behavior:'instant'});
  if(index!==current)return;
  if(data?.type==='writing-step')step(data.direction);
  if(data?.type==='writing-back')location.hash='#writing';
  if(data?.type==='writing-modal'){modal=!!data.open;shell.classList.toggle('is-modal',modal);}
  if(data?.type==='writing-navigate-story'&&index===0){const m=/^#read\/([a-z-]+)$/.exec(data.hash);location.hash='#writing/narrative'+(m?'/'+m[1]:'');}
  if(data?.type==='writing-child-route'&&index===0){const m=/^#read\/([a-z-]+)$/.exec(data.hash);if(location.hash.startsWith('#writing/narrative')){history.replaceState(null,'','#writing/narrative'+(m?'/'+m[1]:''));chrome(0,m?data.hash:'');}}
 });
 addEventListener('keydown',e=>{if(shell.hidden||modal||detail||e.ctrlKey||e.metaKey||e.altKey||e.target.closest('input,textarea,[contenteditable="true"]'))return;if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)step(e.key==='ArrowRight'?1:-1);}if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();location.hash='#writing';}},true);
 window.WritingPages={sync,close(){++sequence;cancel();playbackReady=false;cancelAnimationFrame(scrollFrame);scrollFrame=0;stage.replaceChildren();frames=[];sections=[];loads=[];current=0;modal=detail=false;shell.hidden=true;shell.classList.remove('is-detail','is-modal');},get active(){return !shell.hidden;},get current(){return pages[current][0];}};
})();
