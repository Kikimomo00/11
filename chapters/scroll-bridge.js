(() => {
  if(parent===window)return;
  const blocked=()=>!!document.querySelector('dialog[open],#editorial-modal.is-active,#lightbox.active')||location.hash.startsWith('#read/');
  function innerScroll(target,delta){
    for(let el=target;el&&el!==document.documentElement;el=el.parentElement){
      const style=getComputedStyle(el);
      if(/auto|scroll/.test(style.overflowY)&&el.scrollHeight>el.clientHeight+2){
        if(delta<0&&el.scrollTop>1||delta>0&&el.scrollTop+el.clientHeight<el.scrollHeight-1)return true;
      }
    }
    return false;
  }
  addEventListener('wheel',e=>{
    if(e.ctrlKey||blocked()||innerScroll(e.target,e.deltaY))return;
    e.preventDefault();parent.postMessage({type:'portfolio-wheel',delta:e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?innerHeight:1)},location.origin);
  },{passive:false});
  let touch=null;
  addEventListener('touchstart',e=>{touch=e.touches.length===1?e.touches[0].clientY:null;},{passive:true});
  addEventListener('touchmove',e=>{if(touch===null||blocked())return;const y=e.touches[0].clientY,delta=touch-y;touch=y;if(innerScroll(e.target,delta))return;e.preventDefault();parent.postMessage({type:'portfolio-wheel',delta},location.origin);},{passive:false});
})();
