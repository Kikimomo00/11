(() => {
  'use strict';
  const projects = [
    {id:'phone',title:'仿真手机聊天组件',copy:'从角色扮演的代入感需求出发，生成仿真手机聊天组，让原本存在于文本描述中的“角色社交生活”成为可直接体验的产品原型。作品集中展示的是便于独立浏览的离线演示版，实际使用时可接入模型 API，根据实时对话动态生成聊天内容与角色反馈。'},
    {id:'story',title:'多分支互动文字游戏',copy:'将角色故事改编成轻量互动文游，以「利润 / 掌控力 / 丑闻度 / 亲密度」四项数值记录用户选择，并设置前后关联事件与多种结局，让同一组人物关系可以沿不同路径发展。'},
    {id:'cards',title:'抽鬼牌互动小游戏',copy:'将传统抽鬼牌规则与角色人格结合。相比单纯给游戏套一层人物皮肤，更关注“角色性格如何进入游戏规则”，让玩法本身成为关系互动的一部分。'},
    {id:'forum',title:'AI仿真论坛',copy:'基于 Gemini 3.8 Flash，通过提示词约束用户身份、立场、饭圈黑话与评论语气，生成具有高度活人感的社区讨论内容。此处展示的是一次生成的回复示范；实际游玩时，会根据剧情随机生成讨论内容。'}
  ];
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const shell=document.createElement('section');shell.className='ai-shell';shell.hidden=true;shell.setAttribute('aria-label','AI 视觉与互动');
  shell.innerHTML=`<div class="ai-scroll" tabindex="-1"><div class="ai-track">${projects.map((_,i)=>`<div class="ai-stop" style="top:${i*25}%" aria-hidden="true"></div>`).join('')}<div class="ai-view">
    <button class="ai-back" aria-label="返回作品集目录">←</button><span class="ai-chapter-label">04 / AI 视觉与互动</span>
    <header class="ai-heading"><h2>AI-assisted Prototyping<span>/ Vibe Coding</span></h2><p>以AI角色扮演的实际体验需求为起点，通过自然语言与 AI 协作完成需求拆解、交互设计、视觉定义与交互产品原型实现。</p></header>
    <div class="ai-arena"><div class="ai-ring">${projects.map((p,i)=>`<button class="ai-card" data-index="${i}" aria-label="体验${p.title}"><img src="chapters/ai/${p.id}.png" alt="${p.title}作品封面" draggable="false"></button>`).join('')}</div></div>
    <p class="ai-image-credit">本页展示图片均由本人使用 GPT 生成</p><div class="ai-caption" aria-live="polite" aria-atomic="true"><h3></h3><p></p></div>
    <div class="ai-controls" role="navigation" aria-label="互动作品切换">${projects.map((p,i)=>`<button class="ai-dot" data-go="${i}" aria-label="切换至${p.title}">0${i+1}</button>`).join('')}</div>
  </div></div></div>`;
  document.body.append(shell);
  const dialog=document.createElement('dialog');dialog.className='ai-demo';dialog.setAttribute('aria-label','互动作品演示');
  dialog.innerHTML='<header class="ai-demo-header"><button class="ai-demo-close" aria-label="关闭演示，返回作品轮播">←</button><span></span></header><div class="ai-loading">正在打开作品</div>';
  document.body.append(dialog);
  const scroller=shell.querySelector('.ai-scroll'),cards=[...shell.querySelectorAll('.ai-card')],caption=shell.querySelector('.ai-caption'),dots=[...shell.querySelectorAll('[data-go]')];
  let active=false,current=0,position=0,target=0,raf=0,last=0,demo=null,opener=null,entryStart=0,entryElapsed=1400,entryAnimations=[];
  function enter(){
    entryAnimations.forEach(a=>a.cancel());entryAnimations=[];
    entryElapsed=reduced.matches?1400:0;entryStart=performance.now();
    if(reduced.matches){paint();return;}
    const reveal=(selector,delay,duration=900)=>{const el=shell.querySelector(selector);entryAnimations.push(el.animate([{opacity:0,clipPath:'inset(0 0 100% 0)',translate:'0 18px'},{opacity:1,clipPath:'inset(0 0 0% 0)',translate:'0 0'}],{duration,delay,fill:'backwards',easing:'cubic-bezier(.22,1,.36,1)'}));};
    reveal('.ai-heading h2',0);reveal('.ai-heading p',160);reveal('.ai-caption',620);reveal('.ai-image-credit',800,600);reveal('.ai-controls',900,600);
    paint();wake();
  }
  function updateCaption(index){
    current=index;const p=projects[index];caption.querySelector('h3').innerHTML=`<span>0${index+1}</span>${p.title}`;caption.querySelector('p').textContent=p.copy;
    dots.forEach((d,i)=>{if(i===index)d.setAttribute('aria-current','true');else d.removeAttribute('aria-current');});
    if(!reduced.matches){caption.getAnimations().forEach(a=>a.cancel());caption.animate([{opacity:.1,translate:'0 8px'},{opacity:1,translate:'0 0'}],{duration:380,easing:'cubic-bezier(.22,1,.36,1)'});}
  }
  function paint(){
    const radius=Math.min(innerWidth*.34,435),depth=Math.min(innerWidth*.16,190);
    cards.forEach((card,i)=>{
      const theta=(i-position)*Math.PI/2,c=Math.cos(theta),s=Math.sin(theta);
      const progress=reduced.matches?1:Math.max(0,Math.min(1,(entryElapsed-(1-c)*105)/1050)),p=1-Math.pow(1-progress,4);
      card.style.transform=`translate(-50%,-50%) translate3d(${s*radius*(.14+.86*p)}px,${(1-c)*-12+48*(1-p)}px,${(c-1)*depth-260*(1-p)}px) rotateY(${-s*(28+32*(1-p))}deg)`;
      card.style.opacity=String((.18+(c+1)*.41)*p);card.style.zIndex=String(Math.round((c+1)*100));
      card.style.visibility=c<-.88?'hidden':'visible';card.tabIndex=i===current?0:-1;
    });
  }
  function tick(now){raf=0;const dt=Math.min((now-last)/1000,.05);last=now;entryElapsed=reduced.matches?1400:Math.min(1400,now-entryStart);position=reduced.matches?target:position+(target-position)*(1-Math.exp(-22*dt));if(Math.abs(target-position)<.0002)position=target;paint();if(position!==target||entryElapsed<1400)raf=requestAnimationFrame(tick);}
  function wake(){if(active&&!raf&&!document.hidden){last=performance.now();raf=requestAnimationFrame(tick);}}
  scroller.addEventListener('scroll',()=>{target=scroller.scrollTop/scroller.clientHeight;const next=Math.max(0,Math.min(3,Math.round(target)));if(next!==current)updateCaption(next);wake();},{passive:true});
  function go(index){index=(index+4)%4;scroller.scrollTo({top:index*scroller.clientHeight,behavior:reduced.matches?'instant':'smooth'});}
  function closeDemo(){
    if(!demo)return;dialog.close();dialog.querySelector('iframe')?.remove();dialog.querySelector('.ai-loading').hidden=false;demo=null;scroller.inert=false;opener?.focus({preventScroll:true});
  }
  function openDemo(id){
    const p=projects.find(p=>p.id===id);if(!p||demo===id)return;closeDemo();demo=id;opener=cards[projects.indexOf(p)];scroller.inert=true;
    dialog.querySelector('.ai-demo-header span').textContent=p.title;const frame=document.createElement('iframe');frame.title=p.title;frame.setAttribute('sandbox','allow-scripts allow-same-origin');frame.src=`chapters/ai/${id}.html`;frame.addEventListener('load',()=>{if(demo!==id)return;dialog.querySelector('.ai-loading').hidden=true;if(!reduced.matches)frame.animate([{opacity:0,transform:'translateY(12px)'},{opacity:1,transform:'none'}],{duration:480,easing:'cubic-bezier(.22,1,.36,1)'});});dialog.append(frame);dialog.showModal();dialog.querySelector('button').focus();
  }
  function returnToRing(){location.hash='#ai/intro';}
  dialog.querySelector('button').addEventListener('click',returnToRing);dialog.addEventListener('cancel',e=>{e.preventDefault();returnToRing();});
  shell.querySelector('.ai-back').addEventListener('click',()=>location.hash='#ai');
  cards.forEach((card,i)=>card.addEventListener('click',()=>{go(i);location.hash='#ai/'+projects[i].id;}));
  dots.forEach(d=>d.addEventListener('click',()=>go(Number(d.dataset.go))));shell.querySelectorAll('[data-step]').forEach(b=>b.addEventListener('click',()=>go(current+Number(b.dataset.step))));
  addEventListener('keydown',e=>{if(!active||demo||e.altKey||e.metaKey||e.ctrlKey)return;if(['ArrowLeft','ArrowUp','ArrowRight','ArrowDown'].includes(e.key)){e.preventDefault();go(current+(['ArrowLeft','ArrowUp'].includes(e.key)?-1:1));}else if(e.key==='Escape'){e.preventDefault();location.hash='#ai';}});
  addEventListener('message',e=>{if(e.origin===location.origin&&e.source===dialog.querySelector('iframe')?.contentWindow&&e.data?.type==='ai-demo-close')returnToRing();});
  addEventListener('resize',()=>{if(active){scroller.scrollTo({top:current*scroller.clientHeight,behavior:'instant'});target=position=current;paint();}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;}else wake();});
  window.AIPages={
    sync(hash){
      const key=hash.split('/')[1];if(!active){active=true;shell.hidden=false;updateCaption(current);scroller.scrollTo({top:current*scroller.clientHeight,behavior:'instant'});position=target=current;enter();scroller.focus({preventScroll:true});}
      document.title='AI 视觉与互动 · 翁蕾';if(projects.some(p=>p.id===key))openDemo(key);else closeDemo();
    },
    close(){closeDemo();active=false;shell.hidden=true;cancelAnimationFrame(raf);raf=0;entryAnimations.forEach(a=>a.cancel());entryAnimations=[];},
    get active(){return active;}
  };
})();
