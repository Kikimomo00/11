(() => {
  'use strict';
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const arrow='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12H4m6-6-6 6 6 6"/></svg>';
  const folios={
    followers:{index:'01',label:'账号与粉丝',metric:'2.5<small>W</small>',description:'粉丝数为两账号相加。',note:'藤井雫已更名为默认用户名，所有角色均已删除。',color:'#e9dfe8',curtain:'up',items:[
      {src:'followers-main.png',title:'心泪纯',stat:'1.80 万',note:'主账号 · 粉丝数据截图',width:1058,height:595},
      {src:'followers-second.png',title:'藤井雫',stat:'7,126',note:'次账号 · 现显示为 mufyer\n所有角色已删除',width:1058,height:595}
    ]},
    roles:{index:'02',label:'百万量级角色',metric:'04',description:'四个现代都市情感角色，从人物设定到持续对话。',note:'',color:'#dce5e8',curtain:'right',items:[
      {src:'role-zong.png',title:'宗湛',stat:'1,793,390',note:'',width:301,height:440},
      {src:'role-zhou.png',title:'周见深',stat:'1,000,615',note:'上线七天突破百万\n角色现已删除',width:1206,height:1299},
      {src:'role-bo.png',title:'薄亦臣',stat:'1,114,953',note:'',width:294,height:446},
      {src:'role-yin.png',title:'尹洵仁',stat:'955,393',note:'上线七天突破 80 万 · 曾登顶平台榜一',width:295,height:440}
    ]},
    conversations:{index:'03',label:'长对话与用户反馈',metric:'千轮<span class="metric-slash">/</span>万轮',words:true,description:'来自角色评论区的长对话记录，以及用户对剧情、人物与互动体验的反馈。',note:'',color:'#e2e8dd',curtain:'down',items:[
      {src:'conversation-8.png',title:'万轮之后，仍期待番外',note:'1 万轮 / 2 千轮 · 宗湛',width:1206,height:594},
      {src:'conversation-30.png',title:'对话中的生活细节',note:'1 万轮 · 用户互动反馈',width:1206,height:1027},
      {src:'conversation-17.png',title:'人物情绪被读懂',note:'1 千轮 · 宗湛',width:1206,height:821},
      {src:'conversation-9.png',title:'持续回到同一个角色',note:'1 万轮 · 宗湛',width:1060,height:342},
      {src:'conversation-2.png',title:'继续聊，也期待新内容',note:'1 千轮 · 薄亦臣',width:1206,height:618},
      {src:'conversation-12.png',title:'从互动走向角色二创',note:'8 千轮 · 用户自述约稿',width:1206,height:299},
      {src:'review-2.png',title:'人物动机与情感关系',note:'1 千轮 · 用户长评',width:1206,height:1529},
      {src:'review-3.png',title:'角色逻辑与剧情推进',note:'2 千轮 · 用户长评',width:1206,height:1526},
      {src:'review-1.png',title:'不同人物之间的细腻解读',note:'1 千轮 · 用户长评',width:1206,height:2622}
    ]},
    fanworks:{index:'04',label:'角色衍生创作',metric:'二创',words:true,description:'角色被带到对话之外：粉丝自发约稿、绘制与分享，让人物拥有新的表达。',note:'以下为粉丝创作与发布截图，非本人绘制；原图中的作者署名与作品标记均保留。',color:'#eee0d6',curtain:'left',items:[
      {src:'fan-zhou.jpg',title:'周见深 · 衍生创作',note:'粉丝发布截图',width:1206,height:1431},
      {src:'fan-yin.png',title:'尹洵仁 · 角色约稿',note:'粉丝发布截图',width:1206,height:1015},
      {src:'fan-collection.png',title:'角色们的另一种模样',note:'薄亦臣、尹洵仁等角色 · 粉丝自发约稿合集',width:1206,height:1879}
    ]}
  };
  const keys=Object.keys(folios),intro=document.querySelector('#characters-intro');
  const page=document.createElement('section');page.className='evidence-page';page.hidden=true;page.tabIndex=-1;page.setAttribute('aria-labelledby','evidence-title');document.body.append(page);
  const lightbox=document.createElement('dialog');lightbox.className='evidence-lightbox';lightbox.setAttribute('aria-label','截图原图');
  lightbox.innerHTML='<div class="evidence-lightbox-bar"><span></span><button type="button" aria-label="关闭原图"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 5 14 14M19 5 5 19"/></svg></button></div><img alt="">';document.body.append(lightbox);
  let current=null,sequence=0,ownedHistory=false,animations=[],extras=[],observer=null,returnTarget=null,busy=false,gesture=null,suppressClickUntil=0,wheelSum=0,wheelLast=0,wheelGate=0;
  const scrollPositions=new Map();
  const easings={cover:'cubic-bezier(.76,0,.24,1)',reveal:'cubic-bezier(.16,1,.3,1)'};
  const directions={up:['translateY(101%)','translateY(-101%)'],right:['translateX(-101%)','translateX(101%)'],down:['translateY(-101%)','translateY(101%)'],left:['translateX(101%)','translateX(-101%)']};
  function animate(el,frames,options={}){
    if(reduced.matches)return null;
    const a=el.animate(frames,{duration:720,easing:easings.reveal,fill:'backwards',...options});animations.push(a);return a;
  }
  async function finish(a){try{await a?.finished;}catch{}}
  function resetLight(){window.dispatchEvent(new Event('text-light-reset'));}
  function clearMotion(){animations.forEach(a=>a.cancel());animations=[];extras.forEach(el=>el.remove());extras=[];observer?.disconnect();observer=null;page.style.removeProperty('--drag-x');page.classList.remove('is-dragging');}
  function remember(){const scroll=page.querySelector('.evidence-scroll');if(current&&scroll)scrollPositions.set(current,scroll.scrollTop);}
  function render(key){
    const data=folios[key];page.dataset.folio=key;page.style.setProperty('--folio-bg',data.color);
    page.innerHTML=`<header class="evidence-header"><button type="button" class="profile-back evidence-back" aria-label="返回数据概览">${arrow}</button><div class="folio-index"><span>02 / ${data.index}</span>角色创作与社区增长</div></header>
      <div class="evidence-layout"><div class="evidence-lead"><div class="evidence-lead-content"><p class="evidence-kicker">MUFY / ${data.index}</p><div class="evidence-metric${data.words?' words':''}">${data.metric}</div><h1 id="evidence-title">${data.label}</h1><p class="evidence-description">${data.description}</p>${data.note?`<p class="evidence-note">${data.note}</p>`:''}</div>
      <div class="evidence-pager" role="group" aria-label="切换数据图册">${keys.map(k=>`<button type="button" data-folio-target="${k}" aria-label="切换至${folios[k].label}"${k===key?' aria-current="page"':''}><span>${folios[k].index}</span></button>`).join('')}</div></div>
      <div class="evidence-scroll" tabindex="0" role="region" aria-label="${data.label}图片，可上下滚动"><div class="evidence-gallery">${data.items.map((item,i)=>`<figure class="evidence-piece"><button type="button" class="evidence-image-button" data-image="${i}" aria-label="查看${item.title}原图"><img draggable="false" src="assets/evidence/${item.src}" alt="${item.title}${item.note?'：'+item.note.replace(/\n/g,'；'):''}" width="${item.width}" height="${item.height}" loading="${i<2?'eager':'lazy'}" decoding="async"></button><figcaption><span class="piece-index">${String(i+1).padStart(2,'0')}</span><div>${item.stat?`<span class="piece-stat">${item.stat}</span>`:''}<h2>${item.title}</h2>${item.note?`<p>${item.note}</p>`:''}</div></figcaption></figure>`).join('')}</div><div class="evidence-end">${data.items.length} / ${data.items.length}</div></div></div>`;
    page.querySelector('.evidence-back').addEventListener('click',back);
    page.querySelectorAll('[data-folio-target]').forEach(button=>button.addEventListener('click',()=>{
      const key=button.dataset.folioTarget;navigate(key,null,true,Math.sign(keys.indexOf(key)-keys.indexOf(current))||1);
    }));
    page.querySelectorAll('[data-image]').forEach(button=>button.addEventListener('click',()=>{
      if(performance.now()<suppressClickUntil||busy)return;zoom(data.items[Number(button.dataset.image)],button);
    }));
    page.querySelector('.evidence-scroll').scrollTop=scrollPositions.get(key)||0;
    window.mountTextLight?.(page);
  }
  function zoom(item,button){
    resetLight();const image=lightbox.querySelector('img');image.src=`assets/evidence/${item.src}`;image.alt=item.title;image.style.width=`${Math.max(item.width,560)}px`;
    lightbox.querySelector('span').textContent=item.title;lightbox.showModal();lightbox.scrollTop=0;
    animate(lightbox,[{opacity:0},{opacity:1}],{duration:220});
    animate(image,[{opacity:0,transform:'translateY(18px) scale(.98)',filter:'blur(4px)'},{opacity:1,transform:'none',filter:'blur(0px)'}],{duration:500});
  }
  lightbox.querySelector('button').addEventListener('click',()=>lightbox.close());
  lightbox.addEventListener('click',e=>{if(e.target===lightbox)lightbox.close();});
  function revealImages(direction=1){
    const scroll=page.querySelector('.evidence-scroll'),pieces=[...page.querySelectorAll('.evidence-piece')];
    if(reduced.matches)return;
    const reveal=(piece,delay)=>{
      const image=piece.querySelector('.evidence-image-button'),caption=piece.querySelector('figcaption');
      animate(image,[{opacity:0,transform:`translate(${direction*35}px,28px) scale(.965)`,clipPath:'inset(8% 0 0 0)',filter:'blur(6px)'},{opacity:1,transform:'translate(0,0) scale(1)',clipPath:'inset(0 0 0 0)',filter:'blur(0px)'}],{duration:920,delay});
      animate(caption,[{opacity:0,transform:`translateX(${direction*20}px)`,filter:'blur(4px)'},{opacity:1,transform:'translateX(0)',filter:'blur(0px)'}],{duration:760,delay:delay+90});
    };
    observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(entry.isIntersecting){entry.target.style.visibility='';reveal(entry.target,0);observer.unobserve(entry.target);}
    }),{root:scroll,threshold:.035});
    const bounds=scroll.getBoundingClientRect();let visible=0;
    pieces.forEach(piece=>{const r=piece.getBoundingClientRect();
      if(r.top<bounds.bottom&&r.bottom>bounds.top)reveal(piece,90+visible++*115);
      else{piece.style.visibility='hidden';observer.observe(piece);}
    });
  }
  function curtain(color,direction){
    const el=document.createElement('div');el.className='folio-curtain';el.style.background=color;el.setAttribute('aria-hidden','true');document.body.append(el);extras.push(el);
    const [enter,leave]=directions[direction];
    const cover=animate(el,[{transform:enter},{transform:'translate(0,0)'}],{duration:520,easing:easings.cover,fill:'forwards'});
    return {el,cover,leave};
  }
  function outgoing(direction,shift){
    const lead=page.querySelector('.evidence-lead-content'),gallery=page.querySelector('.evidence-gallery');
    if(lead)animate(lead,[{opacity:1,transform:`translateX(${shift*.12}px)`},{opacity:0,transform:`translateX(${-direction*44}px)`,filter:'blur(5px)'}],{duration:440});
    if(gallery)animate(gallery,[{opacity:1,transform:`translateX(${shift*.2}px)`},{opacity:0,transform:`translateX(${-direction*75}px)`,filter:'blur(4px)'}],{duration:480,delay:30});
  }
  async function open(key,source=null,direction=1,shift=0){
    if(!folios[key]||(current===key&&!page.hidden))return;
    window.ChapterPages?.sync(null);
    const token=++sequence,wasOpen=!page.hidden;
    remember();current=key;busy=true;gesture=null;clearMotion();resetLight();if(lightbox.open)lightbox.close();
    returnTarget=source||intro.querySelectorAll('.result-open')[keys.indexOf(key)];intro.inert=true;page.classList.add('is-opening');
    let drape=null;
    if(!reduced.matches){
      drape=curtain(folios[key].color,folios[key].curtain);
      if(wasOpen)outgoing(direction,shift);
      await finish(drape.cover);if(token!==sequence)return;
    }
    render(key);page.hidden=false;document.title=`${folios[key].label} · 翁蕾`;
    if(!reduced.matches){

      animate(drape.el,[{transform:'translate(0,0)'},{transform:drape.leave}],{duration:700,easing:easings.cover,fill:'forwards'});
      const blocks=page.querySelectorAll('.evidence-kicker,.evidence-metric,.evidence-lead h1,.evidence-description,.evidence-note,.evidence-pager');
      blocks.forEach((el,i)=>animate(el,[{opacity:0,transform:`translate(${direction*(22+i*3)}px,${12+i*2}px)`,filter:`blur(${i===1?10:5}px)`},{opacity:1,transform:'translate(0,0)',filter:'blur(0px)'}],{duration:850,delay:65+i*45}));
      revealImages(direction);
      await Promise.all(animations.map(finish));if(token!==sequence)return;
      extras.forEach(el=>el.remove());extras=[];
    }
    if(token===sequence){busy=false;page.classList.remove('is-opening');page.focus({preventScroll:true});}
  }
  async function close(immediate=false){
    if(!current&&page.hidden)return;
    const token=++sequence;remember();current=null;busy=true;gesture=null;clearMotion();resetLight();if(lightbox.open)lightbox.close();
    let drape=null;
    if(!immediate&&!reduced.matches){drape=curtain('#000','down');outgoing(-1,0);await finish(drape.cover);if(token!==sequence)return;}
    page.hidden=true;page.classList.remove('is-opening');intro.inert=false;
    if(drape){await finish(animate(drape.el,[{transform:'translate(0,0)'},{transform:drape.leave}],{duration:480,easing:easings.cover,fill:'forwards'}));}
    if(token!==sequence)return;clearMotion();busy=false;
    if(location.hash==='#characters/intro'){window.ChapterPages?.sync('intro');document.title='角色创作与社区增长 · 翁蕾';returnTarget?.focus({preventScroll:true});}
  }
  function navigate(key,source,replace=false,direction=1,shift=0){
    if(!folios[key]||key===current)return;
    if(replace)history.replaceState(null,'',`#characters/${key}`);
    else{history.pushState(null,'',`#characters/${key}`);ownedHistory=true;}
    open(key,source,direction,shift);
  }
  function step(direction,shift=0){if(!current||busy||lightbox.open)return;const i=(keys.indexOf(current)+direction+keys.length)%keys.length;navigate(keys[i],null,true,direction,shift);}
  function back(){if(!current)return;if(ownedHistory){ownedHistory=false;history.back();}else{history.replaceState(null,'','#characters/intro');close();}}
  intro.querySelectorAll('.chapter-result').forEach((result,i)=>{
    const button=document.createElement('button');button.className='result-open';button.type='button';button.setAttribute('aria-label',`查看${folios[keys[i]].label}`);
    button.addEventListener('click',()=>navigate(keys[i],button));result.append(button);
  });
  // Horizontal gestures choose a folio; vertical gestures stay within the image column.
  page.addEventListener('pointerdown',e=>{
    if(busy||lightbox.open||e.button!==0||e.target.closest('.evidence-back,.evidence-pager'))return;
    gesture={id:e.pointerId,x:e.clientX,y:e.clientY,axis:null,dx:0,time:performance.now()};
  });
  page.addEventListener('pointermove',e=>{
    if(!gesture||gesture.id!==e.pointerId)return;
    const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;
    if(!gesture.axis&&Math.max(Math.abs(dx),Math.abs(dy))>10){
      gesture.axis=Math.abs(dx)>Math.abs(dy)*1.2?'x':'y';
      if(gesture.axis==='x'){page.setPointerCapture(e.pointerId);resetLight();page.classList.add('is-dragging');}
    }
    if(gesture.axis==='x'){e.preventDefault();gesture.dx=dx;page.style.setProperty('--drag-x',`${Math.max(-190,Math.min(190,dx))}px`);}
  },{passive:false});
  function endGesture(e){
    if(!gesture||gesture.id!==e.pointerId)return;const g=gesture;gesture=null;
    if(page.hasPointerCapture(e.pointerId))page.releasePointerCapture(e.pointerId);
    page.classList.remove('is-dragging');page.style.removeProperty('--drag-x');
    if(g.axis!=='x')return;suppressClickUntil=performance.now()+450;
    const distance=Math.abs(g.dx),velocity=distance/Math.max(1,performance.now()-g.time);
    if(e.type!=='pointercancel'&&(distance>55||(distance>26&&velocity>.45)))step(g.dx<0?1:-1,Math.max(-190,Math.min(190,g.dx)));
    else{[['.evidence-lead-content',.12],['.evidence-gallery',.2]].forEach(([selector,factor])=>animate(page.querySelector(selector),[{transform:`translateX(${Math.max(-190,Math.min(190,g.dx))*factor}px)`},{transform:'translateX(0)'}],{duration:350}));}
  }
  page.addEventListener('pointerup',endGesture);page.addEventListener('pointercancel',endGesture);
  page.addEventListener('dragstart',e=>e.preventDefault());
  page.addEventListener('wheel',e=>{
    if(lightbox.open||e.ctrlKey)return;
    const horizontal=e.shiftKey||(Math.abs(e.deltaX)>Math.abs(e.deltaY)*1.15&&Math.abs(e.deltaX)>2);
    if(horizontal){
      e.preventDefault();const now=performance.now();if(busy||now<wheelGate)return;
      if(now-wheelLast>180)wheelSum=0;wheelLast=now;wheelSum+=e.shiftKey?(e.deltaY||e.deltaX):e.deltaX;
      if(Math.abs(wheelSum)>65){step(Math.sign(wheelSum));wheelSum=0;wheelGate=now+1450;}
    }else if(!e.target.closest('.evidence-scroll')){
      e.preventDefault();const scroll=page.querySelector('.evidence-scroll');if(scroll)scroll.scrollTop+=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?scroll.clientHeight:1);
    }
  },{passive:false});
  addEventListener('keydown',e=>{
    if(!current)return;
    if(e.key==='Escape'){e.stopImmediatePropagation();e.preventDefault();if(lightbox.open)lightbox.close();else back();}
    if(!lightbox.open&&!e.ctrlKey&&!e.altKey&&!e.metaKey&&['ArrowLeft','ArrowRight'].includes(e.key)){
      e.stopImmediatePropagation();e.preventDefault();step(e.key==='ArrowRight'?1:-1);
    }
  },true);
  // Complete, rather than strand, a transition when the viewport or motion preference changes.
  function settle(){
    if(!current){if(busy){++sequence;clearMotion();page.hidden=true;intro.inert=false;busy=false;}return;}
    if(!busy)remember();
    ++sequence;clearMotion();render(current);page.hidden=false;page.classList.remove('is-opening');busy=false;gesture=null;
  }
  reduced.addEventListener('change',settle);addEventListener('resize',settle);
  window.EvidenceGallery={open,close,back,has:key=>Object.hasOwn(folios,key),get active(){return current!==null;}};
})();
