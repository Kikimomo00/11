(() => {
 'use strict';
 const intro=document.querySelector('#characters-intro'),pages=[['intro','数据概览'],['creation','角色创作'],['methodology','创作方法']],reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const first=document.createElement('section');first.className='chapter-flow-page chapter-flow-intro';
 first.append(intro.querySelector('.chapter-header'),intro.querySelector('.chapter-body'));intro.append(first);
 const sections=[first],frames=[];
 for(const [key,label] of pages.slice(1)){
  const section=document.createElement('section');section.className='chapter-flow-page';section.dataset.page=key;
  section.innerHTML='<header class="profile-header"><button class="profile-back" aria-label="返回作品集目录"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12H4m6-6-6 6 6 6"/></svg></button><h2><span>02</span>角色创作与社区增长</h2></header>';
  if(key==='creation')section.insertAdjacentHTML('afterbegin','<canvas class="chapter-stars" aria-hidden="true"></canvas>');
  const iframe=document.createElement('iframe');iframe.title=label;iframe.dataset.src=`chapters/${key}.html?v=6`;iframe.addEventListener('load',()=>{iframe.dataset.ready='true';activateVisible();});
  section.append(iframe);section.querySelector('button').onclick=()=>location.hash='#characters';intro.append(section);sections.push(section);frames.push(iframe);
 }
 const panel=sections[1];
 const pagination=document.createElement('div');pagination.className='chapter-pagination';pagination.hidden=true;pagination.setAttribute('role','navigation');pagination.setAttribute('aria-label','角色专题页码');
 pagination.innerHTML=pages.map(([key,label],i)=>`<a href="#characters/${key}"><span>0${i+1}</span>${label}</a>`).join('');document.body.append(pagination);
 let active=false,selectedPage=0,modalOpen=false,scrollFrame=0;
  const sky=panel.querySelector('canvas'),ctx=sky.getContext('2d');
  let starFrame=0,starLast=0,starTime=0,stars=[],starOn=false,skyW=0,skyH=0;
  const sprite=document.createElement('canvas');sprite.width=sprite.height=32;const sc=sprite.getContext('2d'),glow=sc.createRadialGradient(16,16,0,16,16,16);
  glow.addColorStop(0,'#fff');glow.addColorStop(.16,'#f2e0efcc');glow.addColorStop(.45,'#eee4ff25');glow.addColorStop(1,'#eee4ff00');sc.fillStyle=glow;sc.fillRect(0,0,32,32);
  function sizeStars(){skyW=innerWidth;skyH=innerHeight;const d=Math.min(devicePixelRatio,1.5);sky.width=skyW*d;sky.height=skyH*d;ctx.setTransform(d,0,0,d,0,0);stars=Array.from({length:Math.max(28,Math.min(65,Math.round(skyW*skyH/21000)))},()=>({x:Math.random(),y:Math.random(),r:.7+Math.random()*.95,speed:1.45+Math.random()*3.6,phase:Math.random()*6.28,cycle:5+Math.random()*8}));}
  function paintStars(t){starFrame=0;if(!starOn||document.hidden)return;const dt=starLast?Math.min((t-starLast)/1000,.07):0;starLast=t;starTime+=dt;ctx.clearRect(0,0,skyW,skyH);
    for(const p of stars){if(!reduced.matches){p.y-=p.speed*dt/skyH;if(p.y<-.02)p.y=1.02;}const a=.06+.50*Math.pow(.5+.5*Math.sin(starTime*6.28/p.cycle+p.phase),2);const x=p.x*skyW+Math.sin(starTime*.17+p.phase)*6,y=p.y*skyH;ctx.globalAlpha=a;ctx.drawImage(sprite,x-p.r*3,y-p.r*3,p.r*6,p.r*6);ctx.fillStyle='#eee9f4';ctx.beginPath();ctx.arc(x,y,p.r*.44,0,6.28);ctx.fill();}ctx.globalAlpha=1;
    if(!reduced.matches)starFrame=requestAnimationFrame(paintStars);
  }
  function starsActive(on){starOn=on;cancelAnimationFrame(starFrame);starFrame=0;starLast=0;if(on){if(!stars.length)sizeStars();paintStars(performance.now());}}
  addEventListener('resize',()=>{sizeStars();if(starOn&&reduced.matches)paintStars(performance.now());});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(starFrame);starFrame=0;starLast=0;}else if(starOn)starsActive(true);});
  reduced.addEventListener('change',()=>{starsActive(starOn);});

 function activateVisible(){frames.forEach((f,i)=>{
  if(!f.dataset.ready)return;
  const section=sections[i+1],height=intro.clientHeight;
  const visible=active&&!intro.hidden?Math.max(0,Math.min(section.offsetTop+section.offsetHeight,intro.scrollTop+height)-Math.max(section.offsetTop,intro.scrollTop)):0;
  if(visible>=Math.min(height,section.offsetHeight)*.65&&f.dataset.playing!=='true'){
   f.dataset.playing='true';f.contentWindow.postMessage({type:'chapter-activate'},location.origin);
  }else if(visible===0&&f.dataset.playing==='true'){
   f.dataset.playing='false';f.contentWindow.postMessage({type:'chapter-deactivate'},location.origin);
  }
 });}
 function load(){frames.forEach(f=>{if(!f.getAttribute('src'))f.src=f.dataset.src;});}
 function select(index,write){selectedPage=index;pagination.querySelectorAll('a').forEach((a,i)=>{if(i===index)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});starsActive(index===1);activateVisible();if(write&&location.hash.startsWith('#characters/')&&!window.EvidenceGallery?.active)history.replaceState(null,'',`#characters/${pages[index][0]}`);}
 function nearest(){const center=intro.scrollTop+intro.clientHeight*.5;let index=0;sections.forEach((s,i)=>{if(s.offsetTop<=center)index=i;});return index;}
 function sync(key){const index=pages.findIndex(p=>p[0]===key);if(index<0){active=false;activateVisible();pagination.hidden=true;starsActive(false);return;}const entering=!active;active=true;modalOpen=false;intro.inert=false;intro.classList.remove('flow-modal');pagination.hidden=false;load();select(index,false);intro.scrollTo({top:sections[index].offsetTop,behavior:entering||reduced.matches?'instant':'smooth'});activateVisible();}
 intro.addEventListener('scroll',()=>{if(!active||scrollFrame)return;scrollFrame=requestAnimationFrame(()=>{scrollFrame=0;activateVisible();const i=nearest();if(i!==selectedPage)select(i,true);});},{passive:true});
 function step(direction){if(!active||modalOpen||window.EvidenceGallery?.active)return;const n=Math.max(0,Math.min(2,selectedPage+direction));if(n!==selectedPage)location.hash='#characters/'+pages[n][0];}
 addEventListener('message',e=>{if(e.origin!==location.origin||!frames.some(f=>e.source===f.contentWindow)||!active)return;
  if(e.data?.type==='portfolio-wheel'&&!modalOpen)intro.scrollBy({top:e.data.delta,behavior:'instant'});
  if(e.data?.type==='chapter-modal'){modalOpen=!!e.data.open;intro.classList.toggle('flow-modal',modalOpen);pagination.style.visibility=modalOpen?'hidden':'';}
  if(e.data?.type==='chapter-back')location.hash='#characters/intro';
  if(e.data?.type==='chapter-step')step(e.data.direction);
 });
 addEventListener('keydown',e=>{if(!active||modalOpen||e.ctrlKey||e.metaKey||e.altKey||e.target.closest('input,textarea,[contenteditable="true"]'))return;if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)step(e.key==='ArrowRight'?1:-1);}},true);
 window.ChapterPages={sync,has:key=>key==='creation'||key==='methodology'};
})();
