const turns=new WeakMap();
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)');
export function capturePage(element){
 if(reduced().matches)return null;
 const scroll=element?.closest('.book-reader-scroll');if(!scroll)return null;
 const clone=scroll.cloneNode(true);clone.dataset.scrollTop=String(scroll.scrollTop);clone.removeAttribute('id');clone.querySelector('#library')?.classList.add('book-snapshot-library');
 clone.querySelectorAll('[hidden]').forEach(n=>n.remove());clone.querySelectorAll('details[name]').forEach(n=>n.removeAttribute('name'));clone.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));clone.querySelectorAll('[data-mantra-id]').forEach(n=>n.removeAttribute('data-mantra-id'));clone.querySelectorAll('audio').forEach(n=>n.remove());
 clone.querySelectorAll('button,input,select,a').forEach(n=>{const text=document.createElement('span');text.className=n.className+' book-snapshot-control';text.textContent=n.tagName==='SELECT'?n.selectedOptions[0]?.textContent||'':n.tagName==='INPUT'?'':n.textContent;n.replaceWith(text);});return clone;
}
export function cancelPageTurn(element){const stage=element?.closest('.book-reader-stage')||element;const old=turns.get(stage);if(old){old.animation.cancel();old.foldAnimation?.cancel();old.leaf?.remove();old.fold?.remove();turns.delete(stage);}}
export function turnPage(element,direction=1,snapshot=null){
 const stage=element.closest('.book-reader-stage')||element;cancelPageTurn(stage);const preference=reduced();if(preference.matches||!element.animate)return;
 let leaf=null,fold=null,foldAnimation=null,target=element,frames=[{opacity:.5,transform:'translateX('+direction*8+'px)'},{opacity:1,transform:'none'}];
 if(stage!==element){
  leaf=document.createElement('div');leaf.className='book-turn-leaf';leaf.inert=true;leaf.setAttribute('aria-hidden','true');const copy=snapshot||capturePage(element);if(!copy)return;leaf.append(copy);stage.append(leaf);copy.scrollTop=Number(copy.dataset.scrollTop)||0;target=leaf;
  // Peel the old page diagonally from its lower corner, exposing the live page.
  const forward=[
   {clipPath:'polygon(0% 0%,100% 0%,100% 100%,100% 100%,0% 100%)',transform:'rotateY(0deg) rotateZ(0deg)',opacity:1},
   {clipPath:'polygon(0% 0%,100% 0%,100% 82%,82% 100%,0% 100%)',transform:'rotateY(-5deg) rotateZ(-1deg)',opacity:1,offset:.2},
   {clipPath:'polygon(0% 0%,100% 0%,100% 15%,15% 100%,0% 100%)',transform:'translate(-3%,-2%) rotateY(-35deg) rotateZ(-5deg)',opacity:1,offset:.65},
   {clipPath:'polygon(0% 0%,0% 0%,0% 0%,0% 0%,0% 0%)',transform:'translate(-15%,-8%) rotateY(-100deg) rotateZ(-12deg)',opacity:0}
  ];
  if(direction<0){leaf.classList.add('book-turn-back');frames=forward.map(frame=>({...frame,clipPath:frame.clipPath.replace(/(\d+)% (\d+)%/g,(_,x,y)=>`${100-Number(x)}% ${y}%`),transform:frame.transform.replaceAll('-', '+')}));}else frames=forward;
  fold=document.createElement('div');fold.className='book-turn-fold'+(direction<0?' book-turn-back':'');fold.inert=true;fold.setAttribute('aria-hidden','true');stage.append(fold);
  foldAnimation=fold.animate([{transform:'scale(.025)',opacity:0},{transform:'translate(-4%,-3%) scale(.2)',opacity:.85,offset:.2},{transform:'translate(-35%,-28%) scale(.6)',opacity:.7,offset:.65},{transform:'translate(-100%,-85%) scale(.9)',opacity:0}],{duration:620,easing:'cubic-bezier(.32,.08,.24,1)',fill:'forwards'});
 }
 const animation=target.animate(frames,{duration:leaf?620:260,easing:'cubic-bezier(.32,.08,.24,1)',fill:leaf?'forwards':'none'});turns.set(stage,{animation,leaf,fold,foldAnimation});
 const cancel=()=>cancelPageTurn(stage);preference.addEventListener('change',cancel,{once:true});animation.finished.catch(()=>{}).finally(()=>{leaf?.remove();fold?.remove();preference.removeEventListener('change',cancel);if(turns.get(stage)?.animation===animation)turns.delete(stage);});
}
