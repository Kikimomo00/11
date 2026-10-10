const entries = [
  {id:'media',title:'融媒文章 · 市级融媒体收录',src:'assets/media-2.png'},
  {id:'speech',title:'领导讲话稿 · 全市工业产品供需对接会',src:'assets/speech.png'},
  {id:'video',title:'活动视频文案 · 荆楚科普大讲堂之走进鄂州',src:'assets/video.png'}
];
const viewer=document.querySelector('.viewer');
const viewerImage=document.querySelector('#viewer-image');
let selected=0;
let trigger=null;
function showImage(index){
 selected=(index+entries.length)%entries.length;
 const entry=entries[selected];
 viewerImage.src=entry.src;
 viewerImage.alt=document.querySelector(`[data-image="${entry.id}"] img`).alt;
 document.querySelector('#viewer-title').textContent=entry.title;
 document.querySelector('#viewer-count').textContent=`0${selected+1} / 03`;
}
document.querySelectorAll('[data-image]').forEach(button=>button.addEventListener('click',()=>{
 trigger=button;showImage(entries.findIndex(entry=>entry.id===button.dataset.image));
 viewer.showModal();document.body.style.overflow='hidden';
}));
document.querySelector('.close').addEventListener('click',()=>viewer.close());
document.querySelector('.previous').addEventListener('click',()=>showImage(selected-1));
document.querySelector('.next').addEventListener('click',()=>showImage(selected+1));
viewer.addEventListener('close',()=>{document.body.style.overflow='';trigger?.focus({preventScroll:true});});
viewer.addEventListener('click',event=>{if(event.target===viewer || event.target.classList.contains('viewer-stage'))viewer.close();});
viewer.addEventListener('keydown',event=>{
 if(event.key==='ArrowRight'){event.preventDefault();showImage(selected+1);}
 if(event.key==='ArrowLeft'){event.preventDefault();showImage(selected-1);}
});

// One update per pointer frame; the light stays in place when the pointer rests.
const ink=[...document.querySelectorAll('.ink')];
ink.forEach(element=>element.style.setProperty('--base-ink',getComputedStyle(element).color));
let pointer=null,frame=0;
function light(){
 frame=0;
 const updates=ink.map(element=>({element,rect:element.getBoundingClientRect()}));
 for(const {element,rect} of updates){
  const near=pointer && !viewer.open && pointer.x>rect.left-55 && pointer.x<rect.right+55 && pointer.y>rect.top-55 && pointer.y<rect.bottom+55;
  element.classList.toggle('is-lit',!!near);
  if(near){element.style.setProperty('--light-x',`${pointer.x-rect.left}px`);element.style.setProperty('--light-y',`${pointer.y-rect.top}px`);}
 }
}
function schedule(){if(!frame)frame=requestAnimationFrame(light);}
document.addEventListener('pointermove',event=>{if(event.pointerType==='touch')return;pointer={x:event.clientX,y:event.clientY};schedule();},{passive:true});
document.documentElement.addEventListener('pointerleave',()=>{pointer=null;schedule();});
window.addEventListener('scroll',schedule,{passive:true});
window.addEventListener('resize',schedule);
