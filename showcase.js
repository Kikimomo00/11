(() => {
  'use strict';
  const projects=[
    {id:'about',title:'个人简介',note:'内容创作、用户理解与 AI 实践',src:'assets/about.jpg',alt:'翁蕾的个人照片'},
    {id:'characters',title:'角色创作与社区增长',note:'从人物设定、持续互动，到创作者账号运营',src:'assets/characters-community.png',alt:'角色创作与社区增长艺术字'},
    {id:'writing',title:'内容策划与写作',note:'面向不同受众与场景，设计叙事、风格与表达',src:'assets/writing.png',alt:'内容策划与写作艺术字'},
    {id:'ai',title:'AI 视觉与互动',note:'将角色互动中的需求，做成可体验的产品原型',src:'assets/ai-visuals.png',alt:'AI 视觉与互动艺术字'}
  ];
  const $=s=>document.querySelector(s), stage=$('#artwork'), canvas=$('#scene'), buttons=[...document.querySelectorAll('nav button')];
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'), mod=n=>((n%4)+4)%4;
  let selected=Math.max(0,projects.findIndex(p=>p.id===location.hash.slice(1).split('/')[0])), position=selected,target=selected;
  let width=innerWidth,height=innerHeight,dpr=1,renderer=null,ready=false,frame=0,last=0,burst=0,clock=0,departing=selected,ringHover=0,dustCloud=null;
  let carouselMotion=null,carouselVelocity=0;
  let profileActive=false,profileBusy=false,profileQueued=null,profileHistory=false,returnFocus=null;
  let chapterActive=false,writingActive=false,aiActive=false,returning=false,returnPromise=null,routeSequence=0;
  const mouse={x:-10000,y:-10000,tx:-10000,ty:-10000,power:0,goal:0,inside:false};
  const images=projects.map(p=>{const img=new Image();img.src=p.src;return img;});
  function updateCaption(index){
    const p=projects[index],changed=index!==selected;
    if(changed){departing=selected;if(!drag?.moved)emitDust();}selected=index;
    $('.number').textContent=String(index+1).padStart(2,'0');$('#caption-title').textContent=p.title;$('.subtitle').textContent=p.note;
    if(changed||!ready){
      [$('.number'),$('h1'),$('.subtitle')].forEach((element,i)=>{
        element.getAnimations().forEach(animation=>animation.cancel());
        if(!reduced.matches)element.animate([{transform:'translateY(18px)',opacity:0},{transform:'translateY(0)',opacity:1}],{duration:460,delay:i===2?55:0,easing:'cubic-bezier(.22,1,.36,1)',fill:'backwards'});
      });
    }
    buttons.forEach((b,i)=>{if(i===index)b.setAttribute('aria-current','true');else b.removeAttribute('aria-current');});
    $('.fallback').src=p.src;$('.fallback').alt=p.alt;
    $('#caption-title').disabled=!ready||Math.abs(position-target)>.01;
    if(location.hash!=='#about/profile'&&!location.hash.startsWith('#characters/')&&!location.hash.startsWith('#writing/')&&!location.hash.startsWith('#ai/'))history.replaceState(null,'','#'+p.id);
  }
  function select(index){
    const nearest=Math.round(target),delta=mod(index)-mod(nearest);
    target=nearest+(delta>2?delta-4:delta< -2?delta+4:delta);
    updateCaption(mod(Math.round(target)));
    if(reduced.matches||!renderer)position=target;
    wake();
  }
  buttons.forEach((button,i)=>button.addEventListener('click',()=>{if(i===selected&&Math.abs(position-target)<.01){if(i===0){openProfile();return;}if(i===1){openChapter();return;}if(i===2){openWriting();return;}if(i===3){openAI();return;}}select(i);}));
  $('#caption-title').addEventListener('click',()=>{if(selected===0)openProfile();if(selected===1)openChapter();if(selected===2)openWriting();if(selected===3)openAI();});
  $('#close-profile').addEventListener('click',closeProfile);$('#close-characters').addEventListener('click',closeChapter);
  addEventListener('hashchange',async()=>{
    const route=++routeSequence;
    if(returnPromise)await returnPromise;
    if(route!==routeSequence)return;
    if(!location.hash.includes('/')&&(chapterActive||writingActive||aiActive)){
      returnPromise=returnToDirectory();await returnPromise;returnPromise=null;if(route!==routeSequence)return;
    }
    if(location.hash.startsWith('#ai/')){
      if(profileActive||profileBusy)setProfile(false);if(chapterActive)setChapter(false);if(writingActive)setWriting(false);
      window.EvidenceGallery?.close(true);window.ChapterPages.sync(null);
      select(3);position=target;setAI(true);window.AIPages.sync(location.hash);return;
    }
    if(aiActive)setAI(false);
    if(location.hash.startsWith('#writing/')){
      if(profileActive||profileBusy)setProfile(false);if(chapterActive)setChapter(false);
      window.EvidenceGallery?.close(true);window.ChapterPages.sync(null);
      select(2);position=target;setWriting(true);window.WritingPages.sync(location.hash);return;
    }
    if(writingActive)setWriting(false);
    const key=location.hash.split('/')[1],isEvidence=location.hash.startsWith('#characters/')&&window.EvidenceGallery?.has(key),isChapterPage=location.hash.startsWith('#characters/')&&window.ChapterPages.has(key);
    if(location.hash==='#characters/intro'||isEvidence||isChapterPage){
      if(profileActive||profileBusy)setProfile(false);
      select(1);position=target;await setChapter(true,isEvidence||isChapterPage);
      if(location.hash!==`#characters/${key}`)return;
      if(isEvidence&&location.hash===`#characters/${key}`)window.EvidenceGallery.open(key);
      else window.EvidenceGallery?.close(isChapterPage);window.ChapterPages.sync(isEvidence?null:key);return;
    }
    window.EvidenceGallery?.close(true);window.ChapterPages.sync(null);
    if(location.hash==='#about/profile'){if(chapterActive)setChapter(false);select(0);position=target;setProfile(true);return;}
    if(profileActive||profileBusy)setProfile(false);if(chapterActive)setChapter(false);const n=projects.findIndex(p=>p.id===location.hash.slice(1));if(n>=0)select(n);
  });
  addEventListener('keydown',e=>{if(writingActive||aiActive)return;if(chapterActive){if(e.key==='Escape'){e.preventDefault();closeChapter();}return;}if(profileActive||profileBusy){if(e.key==='Escape'){e.preventDefault();closeProfile();}return;}if(e.ctrlKey||e.altKey||e.metaKey)return;if(['ArrowUp','ArrowLeft','ArrowDown','ArrowRight'].includes(e.key)){e.preventDefault();const d=['ArrowUp','ArrowLeft'].includes(e.key)?-1:1;target=Math.round(target)+d;updateCaption(mod(target));if(reduced.matches)position=target;wake();}});
  let wheelSum=0,wheelTime=0,wheelGate=0,drag=null;
  document.querySelector('main').addEventListener('wheel',e=>{
    if(e.ctrlKey||profileActive||profileBusy||chapterActive||writingActive||aiActive)return;e.preventDefault();const now=performance.now();if(now<wheelGate)return;
    if(now-wheelTime>160)wheelSum=0;wheelTime=now;wheelSum+=e.deltaY*(e.deltaMode===1?16:1);
    if(Math.abs(wheelSum)>40){target=Math.round(target)+Math.sign(wheelSum);updateCaption(mod(target));wheelSum=0;wheelGate=now+740;if(reduced.matches)position=target;wake();}
  },{passive:false});
  stage.addEventListener('pointerdown',e=>{if(e.button!==0)return;departing=mod(Math.round(position));drag={x:e.clientX,y:e.clientY,start:target,moved:false};stage.setPointerCapture(e.pointerId);});
  stage.addEventListener('pointermove',e=>{
    const hoveredCard=cardAt(Math.round(position));stage.dataset.cursorInteractive=String(ready&&Math.abs(position-target)<.01&&Math.abs(e.clientX-hoveredCard.x)<hoveredCard.iw/2&&Math.abs(e.clientY-hoveredCard.y)<hoveredCard.ih/2);
    const distance=mouse.tx< -999?0:Math.hypot(e.clientX-mouse.tx,e.clientY-mouse.ty);
    mouse.inside=e.pointerType!=='touch';mouse.tx=e.clientX;mouse.ty=e.clientY;mouse.goal=Math.max(mouse.goal,Math.min(1,Math.sqrt(distance/12)));
    if(mouse.x< -999){mouse.x=mouse.tx;mouse.y=mouse.ty;}
    if(drag){const dx=drag.x-e.clientX,dy=drag.y-e.clientY;const dist=Math.abs(dy)>Math.abs(dx)?dy:dx;if(Math.abs(dist)>6&&!drag.moved){emitDust();drag.moved=true;}if(drag.moved)target=drag.start+dist/Math.max(230,height*.62);if(reduced.matches)position=target;}
    wake();
  });
  function endDrag(e){if(!drag)return;if(!drag.moved){const card=cardAt(Math.round(position));if(selected<=3&&Math.abs(position-target)<.01&&Math.abs(e.clientX-card.x)<card.iw/2&&Math.abs(e.clientY-card.y)<card.ih/2){drag=null;mouse.goal=0;if(selected===0)openProfile();else if(selected===1)openChapter();else if(selected===2)openWriting();else openAI();return;}const distance=(e.clientY-height*.5);if(Math.abs(distance)>height*.32)target=Math.round(target)+Math.sign(distance);}target=Math.round(target);updateCaption(mod(target));drag=null;mouse.goal=0;wake();}
  stage.addEventListener('pointerup',endDrag);stage.addEventListener('pointercancel',()=>{drag=null;target=Math.round(target);mouse.goal=0;mouse.inside=false;wake();});stage.addEventListener('pointerleave',()=>{mouse.goal=0;mouse.inside=false;wake();});

  function cardAt(slot){const mobile=width<=600,anchor=width*(mobile?.50:.52),radius=height*1.78,angle=(slot-position)*.36;
    const index=mod(slot),ratio=images[index].naturalWidth/images[index].naturalHeight;
    const iw=Math.min(width*(mobile?.82:.40),height*(mobile?.39:.44)*ratio);
    return {index,angle,x:anchor-radius+Math.cos(angle)*radius,y:height*.5+Math.sin(angle)*radius,iw,ih:iw/ratio};}

  function openProfile(){if(profileActive||profileBusy)return;history.pushState(null,'','#about/profile');profileHistory=true;setProfile(true);}
  function closeProfile(){if(!profileActive&&!profileBusy)return;if(profileHistory){profileHistory=false;history.back();}else{history.replaceState(null,'','#about');setProfile(false);}}
  async function setProfile(open){
    if(profileBusy){profileQueued=open;return;}if(profileActive===open)return;
    profileBusy=true;const page=$('#profile'),photo=$('#profile-photo'),main=$('main');
    const card=cardAt(Math.round(position)),home={left:card.x-card.iw/2,top:card.y-card.ih/2,width:card.iw,height:card.ih};
    if(open){returnFocus=document.activeElement;page.hidden=false;page.scrollTop=0;main.inert=true;profileActive=true;cancelAnimationFrame(frame);frame=0;}
    const destination=photo.getBoundingClientRect(),from=open?home:destination,to=open?destination:home;
    const ghost=document.createElement('img');ghost.src=projects[0].src;ghost.alt='';ghost.className='portrait-flight';
    Object.assign(ghost.style,{left:'0',top:'0',width:to.width+'px',height:to.height+'px'});
    const first=`translate(${from.left}px,${from.top}px) scale(${from.width/to.width},${from.height/to.height})`,lastTransform=`translate(${to.left}px,${to.top}px) scale(1,1)`;
    ghost.style.transform=first;photo.style.visibility='hidden';document.body.append(ghost);
    if(!open){profileActive=false;main.inert=false;mouse.inside=false;mouse.goal=0;mouse.power=0;ringHover=0;wake();}
    document.body.classList.toggle('profile-open',open);
    // Commit the initial state before beginning the shared portrait transition.
    void page.offsetWidth;page.classList.toggle('is-visible',open);
    const duration=reduced.matches?0:720;
    if(open&&!reduced.matches){[...page.querySelectorAll('.profile-roles,blockquote,.profile-capabilities section,.profile-portrait figcaption')].forEach((element,i)=>{
      element.getAnimations().forEach(animation=>animation.cancel());
      element.animate([{opacity:0,transform:'translateY(22px)'},{opacity:1,transform:'translateY(0)'}],{duration:620,delay:160+i*65,easing:'cubic-bezier(.22,1,.36,1)',fill:'backwards'});
    });}
    try{await ghost.animate([{transform:first,borderRadius:open?'8px':'0px'},{transform:lastTransform,borderRadius:open?'0px':'8px'}],{duration,easing:'cubic-bezier(.22,1,.36,1)',fill:'forwards'}).finished;}finally{
      ghost.remove();photo.style.visibility='';profileBusy=false;
      if(open){page.focus({preventScroll:true});document.title='个人简介 · 翁蕾';}else{page.hidden=true;document.title='翁蕾 · Portfolio';if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});}
      const queued=profileQueued;profileQueued=null;if(queued!==null&&queued!==profileActive)setProfile(queued);
    }
  }

  async function returnToDirectory(){
    returning=true;document.body.classList.add('section-returning');wake();
    const layers=[...document.querySelectorAll('#characters-intro,.chapter-pagination,.writing-shell,.ai-shell,.evidence-page')].filter(el=>!el.hidden);
    const preserveNarrative=writingActive&&window.WritingPages.current==='narrative';
    let cleanup=()=>{};const motions=[];
    if(!preserveNarrative&&window.SectionExits){
      cleanup=await window.SectionExits.play({kind:writingActive?'writing':aiActive?'ai':'characters',home:cardAt(Math.round(position))});
    }else{
      if(!reduced.matches)layers.forEach(el=>motions.push(el.animate(el.matches('.chapter-pagination')?[{opacity:1},{opacity:0}]:[{clipPath:'inset(0% 0 0 0)',transform:'translateY(0)'},{clipPath:'inset(0% 0 100% 0)',transform:'translateY(-28px)'}],{duration:760,easing:'cubic-bezier(.76,0,.24,1)',fill:'forwards'})));
      await Promise.all(motions.map(a=>a.finished.catch(()=>{})));
    }
    if(writingActive)setWriting(false);if(aiActive)setAI(false);if(chapterActive)await setChapter(false,true);
    window.EvidenceGallery?.close(true);window.ChapterPages.sync(null);motions.forEach(a=>a.cancel());cleanup();document.body.classList.remove('section-returning');returning=false;$('main').inert=false;wake();
  }
  function openAI(){if(aiActive)return;history.pushState(null,'','#ai/intro');setAI(true);window.AIPages.sync(location.hash);}
  function setAI(open){
    if(aiActive===open)return;aiActive=open;$('main').inert=open;document.body.classList.toggle('ai-open',open);
    if(open){returnFocus=document.activeElement;cancelAnimationFrame(frame);frame=0;}
    else{window.AIPages.close();mouse.inside=false;mouse.power=0;mouse.goal=0;ringHover=0;document.title='翁蕾 · Portfolio';returnFocus?.focus({preventScroll:true});wake();}
  }
  function openWriting(){if(writingActive)return;history.pushState(null,'','#writing/narrative');setWriting(true);window.WritingPages.sync(location.hash);}
  function setWriting(open){
    if(writingActive===open)return;writingActive=open;const main=$('main');main.inert=open;document.body.classList.toggle('writing-open',open);
    if(open){returnFocus=document.activeElement;cancelAnimationFrame(frame);frame=0;}
    else{window.WritingPages.close();mouse.inside=false;mouse.power=0;mouse.goal=0;ringHover=0;document.title='翁蕾 · Portfolio';returnFocus?.focus({preventScroll:true});wake();}
  }

  function openChapter(){if(chapterActive)return;history.pushState(null,'','#characters/intro');setChapter(true);window.ChapterPages.sync('intro');}
  function closeChapter(){if(!chapterActive)return;location.hash='#characters';}
  async function setChapter(open,instant=false){
    if(chapterActive===open)return;chapterActive=open;const main=$('main'),page=$('#characters-intro');
    if(open){
      returnFocus=document.activeElement;main.inert=true;cancelAnimationFrame(frame);frame=0;
      await window.CharacterChapter.open({image:images[1],origin:cardAt(Math.round(position)),instant});
      if(chapterActive){page.focus({preventScroll:true});document.title='角色创作与社区增长 · 翁蕾';}
    }else{
      main.inert=false;mouse.inside=false;mouse.power=0;mouse.goal=0;ringHover=0;wake();
      await window.CharacterChapter.close(instant);document.title='翁蕾 · Portfolio';if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});
    }
  }

  // Record the moving image, so each fragment is born where its pixel disappears.
  function emitDust(){if(renderer&&!reduced.matches){
    const slot=Math.round(position),card=cardAt(slot),origins=new Float32Array(28*4);
    for(let i=0;i<28;i++)origins.set([card.x,card.y,card.angle,0],i*4);
    dustCloud={...card,slot,origins,recorded:0,age:0,seed:Math.random()*90};
  }}

  function trackDust(dt){if(!dustCloud)return;const cloud=dustCloud;
    const oldAge=cloud.age;cloud.age+=dt;const previous=cardAt(cloud.slot);
    // All images keep the same angular spacing and easing throughout a transition.
    const last=cloud.lastCard||cloud;
    while(cloud.recorded<27&&(cloud.recorded+1)/60<=cloud.age){
      const n=++cloud.recorded,f=Math.min(1,Math.max(0,(n/60-oldAge)/Math.max(dt,.001)));
      cloud.origins.set([last.x+(previous.x-last.x)*f,last.y+(previous.y-last.y)*f,last.angle+(previous.angle-last.angle)*f,0],n*4);
    }
    if(cloud.recorded<27)cloud.origins.set([previous.x,previous.y,previous.angle,0],(cloud.recorded+1)*4);
    cloud.lastCard=previous;
    if(cloud.age>1.15||reduced.matches)dustCloud=null;
  }

  // The off-screen circular staging follows the supplied ICE WORKS reference.
  // Rendering and randomized flow below are purpose-built for the four supplied images.
  function createRenderer(gl){
    const vertex=`attribute vec2 position;varying vec2 uv;void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}`;
    const noise=`float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}float fbm(vec2 p){return noise(p)*.55+noise(p*2.07+19.)*.28+noise(p*4.13)*.17;}float releaseDelay(vec2 p,vec2 size,float seed){vec2 direction=vec2(cos(seed),sin(seed));float front=.5+dot(p-.5,direction)*.65;return .02+front*.23+hash(floor(p*size/1.7)+seed)*.065;}`;
    const artFragment=`precision highp float;varying vec2 uv;uniform sampler2D image;uniform vec2 resolution,center,size,mouse;uniform float rotation,time,power,disperse,portrait,opacity,animate,activity,age,seed;${noise}
      void main(){vec2 screen=vec2(uv.x,1.-uv.y)*resolution;vec2 q=screen-center;float ca=cos(rotation),sa=sin(rotation);q=vec2(q.x*ca+q.y*sa,-q.x*sa+q.y*ca);vec2 p=q/size+.5;
        if(p.x<-.08||p.x>1.08||p.y<-.08||p.y>1.08)discard;
        vec2 source=p;
        vec2 m=screen-mouse;float influence=exp(-dot(m,m)/24000.)*power;
        vec2 flow=vec2(fbm(p*3.2+vec2(time*.27,0.))-.5,fbm(p*3.2+vec2(0.,-time*.24))-.5);
        float wave=sin(p.y*14.+p.x*5.-time*.95)*cos(p.x*8.+time*.6);
        // Exact zero displacement inside the face; feather only outside it.
        float faceDistance=length((p-vec2(.55,.34))/vec2(.23,.21));
        float faceFreedom=smoothstep(1.,1.24,faceDistance);
        float restraint=mix(1.,1.05*faceFreedom,portrait);
        vec2 ripple=vec2(sin(length(m)*.045-time*3.2),cos(length(m)*.035-time*2.7))*.012;
        float border=smoothstep(0.,.075,min(min(p.x,1.-p.x),min(p.y,1.-p.y)));
        p+=(flow*influence*.24+(vec2(wave*.014,sin(p.x*13.+time*.8)*.009)+ripple*portrait)*influence)*restraint*animate*border;
        if(p.x<0.||p.x>1.||p.y<0.||p.y>1.)discard;
        vec3 col=texture2D(image,vec2(p.x,1.-p.y)).rgb;
        float delay=releaseDelay(source,size,seed);
        float dissolved=smoothstep(delay,delay+.12,age)*(1.-smoothstep(.72,1.12,age));
        float alpha=1.-dissolved;
        float corner=length(max(abs(q)-(size*.5-vec2(8.)),0.))-8.;
        alpha*=1.-smoothstep(-.5,.6,corner);
        gl_FragColor=vec4(col,alpha*opacity);
      }`;
    const particleVertex=`precision highp float;attribute vec2 position;attribute vec4 random;uniform vec2 resolution,center,size;uniform vec4 origins[28];uniform float rotation,time,dpr,age,seed;varying vec2 sampleUV;varying float alpha;varying float star;varying float mist;${noise}
      void main(){sampleUV=vec2(position.x,1.-position.y);vec2 base=(position-.5)*size;
        vec4 r=fract(random+seed*vec4(.1031,.1737,.2371,.3179));
        float life=.48+r.w*.28;
        float release=releaseDelay(position,size,seed);
        float elapsed=max(0.,age-release);
        float progress=clamp(elapsed/life,0.,1.);
        float travel=smoothstep(.035,1.,progress);
        float theta=r.y*6.283185;
        vec2 outward=vec2(cos(theta),sin(theta));
        float scale=min(resolution.x/1000.,1.4);
        float bend=(r.z-.5)*2.;
        vec2 drift=outward*(65.+pow(r.x,.8)*285.)*travel;
        drift+=vec2(-outward.y,outward.x)*bend*sin(progress*(1.4+r.w*2.))*70.*travel;
        drift+=vec2(sin(progress*5.+r.z*12.)-sin(r.z*12.),cos(progress*4.+r.w*12.)-cos(r.w*12.))*18.*travel;
        // Stay attached during the pixel-to-star handoff, then keep the release origin.
        float frameTime=min(age,release+.07)*60.;float frameIndex=floor(frameTime);
        vec3 before=origins[0].xyz,after=origins[0].xyz;
        for(int i=0;i<28;i++){if(float(i)<=frameIndex)before=origins[i].xyz;if(float(i)<=frameIndex+1.)after=origins[i].xyz;}
        vec3 origin=mix(before,after,fract(frameTime));
        float ca=cos(origin.z),sa=sin(origin.z);
        vec2 p=origin.xy+vec2(base.x*ca-base.y*sa,base.x*sa+base.y*ca)+drift*scale;
        gl_Position=vec4(p.x/resolution.x*2.-1.,1.-p.y/resolution.y*2.,0.,1.);
        star=step(.987,r.z);mist=(1.-star)*step(.94,r.w);
        float floating=smoothstep(.08,.35,elapsed);
        gl_PointSize=mix(1.8,mix(mix(.9+r.w*1.8,5.+r.x*6.,star),7.+r.x*9.,mist),floating)*dpr;
        float twinkle=.45+.55*pow(.5+.5*sin(time*(1.5+r.w*3.)+r.z*30.),3.);
        float protectText=smoothstep(.20,.37,p.x/resolution.x);
        alpha=smoothstep(0.,.06,elapsed)*(1.-smoothstep(.25,1.,progress))*mix(1.15,.5+twinkle*.6,floating)*protectText*mix(1.,.08,mist*floating);
      }`;
    const particleFragment=`precision mediump float;uniform sampler2D image;varying vec2 sampleUV;varying float alpha;varying float star;varying float mist;void main(){vec3 c=texture2D(image,sampleUV).rgb;vec2 q=gl_PointCoord-.5;float r=length(q);float core=exp(-r*r*mix(17.,24.,mist));float rays=exp(-abs(q.x)*65.)*exp(-abs(q.y)*7.)+exp(-abs(q.y)*65.)*exp(-abs(q.x)*7.);float glow=core+exp(-r*r*9.)*.16;float mask=mix(glow,core+rays*.65,star)*(1.-smoothstep(.43,.5,r));gl_FragColor=vec4(c,alpha*mask);}`;
    const ringFragment=`precision highp float;varying vec2 uv;uniform vec2 resolution,mouse;uniform float radius,anchor,time,animate,burst,power;
      void main(){vec2 p=vec2(uv.x,1.-uv.y)*resolution;vec2 c=vec2(anchor-radius,resolution.y*.5);float a=atan(p.y-c.y,p.x-c.x);
        float response=min(1.,power*.6+burst)*animate;
        float sweep=sin(a*8.-time*2.1+mouse.y/resolution.y*.8);
        float edge=pow(max(0.,sweep),22.);
        float shoulder=pow(max(0.,sweep),4.);
        float halfWidth=.22+response*(edge*1.15+shoulder*.17);
        float d=abs(length(p-c)-radius);
        float core=1.-smoothstep(halfWidth,halfWidth+.55,d);
        float sheen=exp(-d*d/3.8)*edge*response*.24;
        float alpha=core*(.23+response*(shoulder*.25+edge*.65))+sheen;
        gl_FragColor=vec4(mix(vec3(.72,.76,.83),vec3(.97,.98,1.),edge*response),alpha);
      }`;
    function makeProgram(v,f){const p=gl.createProgram();for(const [type,src] of [[gl.VERTEX_SHADER,v],[gl.FRAGMENT_SHADER,f]]){const shader=gl.createShader(type);gl.shaderSource(shader,src);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));gl.attachShader(p,shader);gl.deleteShader(shader);}gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));return p;}
    function program(v,f){const p=makeProgram(v,f);return {p,u:Object.fromEntries(['image','resolution','center','size','mouse','rotation','time','power','disperse','portrait','opacity','dpr','radius','anchor','activity','burst','animate','age','seed'].map(k=>[k,gl.getUniformLocation(p,k)])),pos:gl.getAttribLocation(p,'position'),random:gl.getAttribLocation(p,'random')};}
    const art=program(vertex,artFragment),dust=program(particleVertex,particleFragment),ring=program(vertex,ringFragment);
    dust.u.origins=gl.getUniformLocation(dust.p,'origins[0]');
    const quad=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,quad);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
    const samples=images.map(img=>{
      const sample=document.createElement('canvas');sample.width=160;sample.height=160;const ctx=sample.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0,160,160);const pixels=ctx.getImageData(0,0,160,160).data;
      const points=[];
      for(let i=0;i<19000;i++){const x=Math.random(),y=Math.random(),j=(Math.floor(y*160)*160+Math.floor(x*160))*4;const luminance=(pixels[j]+pixels[j+1]+pixels[j+2])/765;if(luminance<.045||Math.random()>Math.sqrt(luminance))continue;points.push(x,y,Math.random(),Math.random(),Math.random(),Math.random());}
      const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(points),gl.STATIC_DRAW);return {buffer,count:points.length/6};
    });
    const textures=images.map(img=>{const tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);return tex;});
    gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
    function useQuad(prog){gl.useProgram(prog.p);gl.bindBuffer(gl.ARRAY_BUFFER,quad);gl.enableVertexAttribArray(prog.pos);gl.vertexAttribPointer(prog.pos,2,gl.FLOAT,false,0,0);}
    return {draw(t,energy){
      gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(0,0,0,1);gl.clear(gl.COLOR_BUFFER_BIT);
      const mobile=width<=600,anchor=width*(mobile?.50:.52),radius=height*1.78;
      useQuad(ring);gl.uniform2f(ring.u.resolution,width,height);gl.uniform2f(ring.u.mouse,mouse.x,mouse.y);gl.uniform1f(ring.u.power,reduced.matches?0:ringHover);gl.uniform1f(ring.u.radius,radius);gl.uniform1f(ring.u.anchor,anchor);gl.uniform1f(ring.u.time,t);gl.uniform1f(ring.u.animate,reduced.matches?0:1);gl.uniform1f(ring.u.burst,energy);gl.drawArrays(gl.TRIANGLES,0,6);gl.disableVertexAttribArray(ring.pos);
      const base=Math.round(position);
      for(let slot=base-2;slot<=base+2;slot++){
        const {index,angle,x,y,iw,ih}=cardAt(slot);
        if(y+ih< -80||y-ih>height+80)continue;
        const distance=Math.hypot(mouse.x-x,mouse.y-y);const near=1-Math.min(1,distance/(Math.max(iw,ih)*.75));
        const hover=reduced.matches?0:near*mouse.power;
        const activity=Math.max(.65,1-Math.abs(slot-position)*.20);
        const disperse=reduced.matches||index!==departing?0:Math.min(.88,energy*1.1);
        const opacity=1-Math.min(.45,Math.abs(slot-position)*.18);
        gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,textures[index]);
        const set=(prog)=>{const u=prog.u;gl.uniform1i(u.image,0);gl.uniform2f(u.resolution,width,height);gl.uniform2f(u.center,x,y);gl.uniform2f(u.size,iw,ih);gl.uniform2f(u.mouse,mouse.x,mouse.y);gl.uniform1f(u.rotation,angle);gl.uniform1f(u.time,t);gl.uniform1f(u.power,hover);gl.uniform1f(u.disperse,disperse);gl.uniform1f(u.portrait,index===0?1:0);gl.uniform1f(u.opacity,opacity);gl.uniform1f(u.dpr,dpr);gl.uniform1f(u.activity,activity);gl.uniform1f(u.burst,energy);gl.uniform1f(u.animate,reduced.matches?0:1);};
        useQuad(art);set(art);
        const dissolving=dustCloud&&dustCloud.index===index&&!reduced.matches;
        gl.uniform1f(art.u.age,dissolving?dustCloud.age:-1);gl.uniform1f(art.u.seed,dissolving?dustCloud.seed:0);
        gl.drawArrays(gl.TRIANGLES,0,6);gl.disableVertexAttribArray(art.pos);
      }
      if(dustCloud&&!reduced.matches){
        const {index,x,y,iw,ih,angle,age,seed,origins}=dustCloud,u=dust.u;
        gl.blendFunc(gl.SRC_ALPHA,gl.ONE);gl.useProgram(dust.p);gl.bindTexture(gl.TEXTURE_2D,textures[index]);
        gl.uniform1i(u.image,0);gl.uniform2f(u.resolution,width,height);gl.uniform2f(u.center,x,y);gl.uniform2f(u.size,iw,ih);gl.uniform1f(u.rotation,angle);gl.uniform1f(u.time,t);gl.uniform1f(u.age,age);gl.uniform1f(u.seed,seed);gl.uniform1f(u.dpr,dpr);
        gl.uniform4fv(u.origins,origins);
        gl.bindBuffer(gl.ARRAY_BUFFER,samples[index].buffer);gl.enableVertexAttribArray(dust.pos);gl.vertexAttribPointer(dust.pos,2,gl.FLOAT,false,24,0);gl.enableVertexAttribArray(dust.random);gl.vertexAttribPointer(dust.random,4,gl.FLOAT,false,24,8);gl.drawArrays(gl.POINTS,0,samples[index].count);gl.disableVertexAttribArray(dust.pos);gl.disableVertexAttribArray(dust.random);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
      }
    }};
  }
  function resize(){width=innerWidth;height=innerHeight;dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);wake();}
  function moveCarousel(dt){
    if(reduced.matches){position=target;carouselMotion=null;carouselVelocity=0;return;}
    if(drag?.moved){const old=position;position+=(target-position)*(1-Math.exp(-dt*7));carouselVelocity=(position-old)/Math.max(dt,.001);carouselMotion=null;return;}
    if(position===target){carouselMotion=null;carouselVelocity=0;return;}
    if(!carouselMotion||carouselMotion.to!==target){
      const distance=target-position,duration=.78;
      // Preserve forward velocity on rapid switches; rest starts with a gentle lead-in.
      const slope=Math.max(0,Math.min(1.4,carouselVelocity*duration/distance));
      carouselMotion={from:position,to:target,distance,duration,slope,elapsed:0};
    }
    const m=carouselMotion;m.elapsed+=dt;const t=Math.min(1,m.elapsed/m.duration),t2=t*t,t3=t2*t;
    const progress=3*t2-2*t3+(t3-2*t2+t)*m.slope;
    position=m.from+m.distance*progress;
    carouselVelocity=m.distance/m.duration*(6*t-6*t2+(3*t2-4*t+1)*m.slope);
    if(t===1){position=target;carouselMotion=null;carouselVelocity=0;}
  }
  function render(now){frame=0;if(document.hidden||profileActive||(!returning&&(chapterActive||writingActive||aiActive)))return;const dt=Math.min((now-last)/1000,.05);last=now;const old=position;moveCarousel(dt);
    $('#caption-title').disabled=Math.abs(position-target)>.01;
    const lerp=1-Math.exp(-dt*11);mouse.x+=(mouse.tx-mouse.x)*lerp;mouse.y+=(mouse.ty-mouse.y)*lerp;mouse.power+=(mouse.goal-mouse.power)*lerp;
    mouse.goal*=Math.exp(-dt*8);
    if(mouse.goal<.002)mouse.goal=0;
    if(mouse.power<.002&&mouse.goal===0)mouse.power=0;
    const card=cardAt(Math.round(position)),dx=mouse.tx-card.x,dy=mouse.ty-card.y;
    const cx=dx*Math.cos(card.angle)+dy*Math.sin(card.angle),cy=-dx*Math.sin(card.angle)+dy*Math.cos(card.angle);
    const overImage=mouse.inside&&Math.abs(cx)<card.iw*.5&&Math.abs(cy)<card.ih*.5;
    ringHover+=((overImage&&!reduced.matches?1:0)-ringHover)*lerp;
    if(ringHover<.002&&!overImage)ringHover=0;
    const motion=Math.abs(position-old)/Math.max(dt,.001);
    if(!reduced.matches)clock+=dt;
    burst=reduced.matches?0:burst+(Math.min(1,motion*.32)-burst)*(1-Math.exp(-dt*10));
    if(burst<.002)burst=0;
    trackDust(dt);
    renderer?.draw(clock,burst);
    if(renderer&&(position!==target||burst>0||dustCloud||mouse.power>0||mouse.goal>0||(!reduced.matches&&ringHover>0)))frame=requestAnimationFrame(render);
  }
  function wake(){if(ready&&!frame&&!document.hidden&&!profileActive&&(returning||(!chapterActive&&!writingActive&&!aiActive))){last=performance.now();frame=requestAnimationFrame(render);}}
  addEventListener('resize',resize);document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else wake();});reduced.addEventListener('change',()=>{if(reduced.matches){position=target;mouse.power=0;}wake();});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();renderer=null;stage.classList.remove('ready');});
  async function initialDetail(){
    if(location.hash.startsWith('#ai/')){setAI(true);window.AIPages.sync(location.hash);return;}
    if(location.hash.startsWith('#writing/')){setWriting(true);window.WritingPages.sync(location.hash);return;}
    if(location.hash==='#about/profile')setProfile(true);
    const key=location.hash.split('/')[1],isEvidence=location.hash.startsWith('#characters/')&&window.EvidenceGallery?.has(key),isChapterPage=location.hash.startsWith('#characters/')&&window.ChapterPages.has(key);
    if(location.hash==='#characters/intro'||isEvidence||isChapterPage){await setChapter(true,isEvidence||isChapterPage);if(location.hash!==`#characters/${key}`)return;if(isEvidence&&location.hash===`#characters/${key}`)window.EvidenceGallery.open(key);window.ChapterPages.sync(isEvidence?null:key);}
  }
  Promise.all(images.map(i=>i.decode())).then(()=>{try{const gl=canvas.getContext('webgl',{alpha:false,antialias:false,powerPreference:'low-power'});if(gl){renderer=createRenderer(gl);stage.classList.add('ready');}}catch(e){console.warn('Static preview:',e);}ready=true;resize();wake();initialDetail();}).catch(()=>{ready=true;initialDetail();});
  updateCaption(selected);
})();
