const turns=new WeakMap();
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)');
export function capturePage(element){
 const scroll=element?.closest('.book-reader-scroll');if(!scroll)return null;
 const clone=scroll.cloneNode(true);clone.dataset.scrollTop=String(scroll.scrollTop);clone.removeAttribute('id');
 clone.querySelectorAll('[hidden]').forEach(n=>n.remove());clone.querySelectorAll('details[name]').forEach(n=>n.removeAttribute('name'));clone.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));clone.querySelectorAll('[data-mantra-id]').forEach(n=>n.removeAttribute('data-mantra-id'));clone.querySelectorAll('audio').forEach(n=>n.remove());
 clone.querySelectorAll('button,input,select,a,summary').forEach(n=>{const text=document.createElement('span');text.className='book-snapshot-control';text.textContent=n.tagName==='SELECT'?n.selectedOptions[0]?.textContent||'':n.tagName==='INPUT'?'':n.textContent;n.replaceWith(text);});return clone;
}
export function cancelPageTurn(element){const stage=element?.closest('.book-reader-stage')||element;const old=turns.get(stage);if(old){old.animation.cancel();old.leaf?.remove();turns.delete(stage);}}
export function turnPage(element,direction=1,snapshot=null){
 const stage=element.closest('.book-reader-stage')||element;cancelPageTurn(stage);const preference=reduced();if(preference.matches||!element.animate)return;
 let leaf=null,target=element,frames=[{opacity:.5,transform:'translateX('+direction*8+'px)'},{opacity:1,transform:'none'}];
 if(stage!==element){leaf=document.createElement('div');leaf.className='book-turn-leaf';leaf.inert=true;leaf.setAttribute('aria-hidden','true');const copy=snapshot||capturePage(element);if(!copy)return;leaf.append(copy);stage.append(leaf);copy.scrollTop=Number(copy.dataset.scrollTop)||0;target=leaf;frames=direction>0?[{transform:'rotateY(0deg)',opacity:1},{transform:'rotateY(-65deg)',opacity:1,offset:.55},{transform:'rotateY(-110deg)',opacity:0}]:[{transform:'rotateY(-105deg)',opacity:0},{transform:'rotateY(-45deg)',opacity:1,offset:.4},{transform:'rotateY(0deg)',opacity:0}];}
 const animation=target.animate(frames,{duration:leaf?520:260,easing:'cubic-bezier(.32,.08,.24,1)',fill:leaf?'forwards':'none'});turns.set(stage,{animation,leaf});
 const cancel=()=>cancelPageTurn(stage);preference.addEventListener('change',cancel,{once:true});animation.finished.catch(()=>{}).finally(()=>{leaf?.remove();preference.removeEventListener('change',cancel);if(turns.get(stage)?.animation===animation)turns.delete(stage);});
}
