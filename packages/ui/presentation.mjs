// Move no content: the running timer/wheel remains the same DOM and state.
export function mountPresentation(panel,{label='Fullscreen'}={}){
 if(!panel)return;
 const button=document.createElement('button');button.type='button';button.className='presentation-toggle';button.textContent=label;button.setAttribute('aria-pressed','false');panel.prepend(button);
 let active=false,previousFocus=null,scroll=0,overflow='',isolated=[];
 function restore(){if(!active)return;active=false;panel.classList.remove('is-presentation');document.body.style.overflow=overflow;for(const [node,value]of isolated)node.inert=value;isolated=[];button.textContent=label;button.setAttribute('aria-pressed','false');previousFocus?.focus({preventScroll:true});window.scrollTo(0,scroll);}
 async function close(){restore();if(document.fullscreenElement===panel)try{await document.exitFullscreen();}catch{}}
 button.onclick=async()=>{if(active){await close();return;}previousFocus=document.activeElement;scroll=window.scrollY;overflow=document.body.style.overflow;active=true;panel.classList.add('is-presentation');document.body.style.overflow='hidden';button.textContent='Exit fullscreen';button.setAttribute('aria-pressed','true');
  for(let node=panel;node&&node!==document.body;node=node.parentElement)for(const sibling of node.parentElement.children)if(sibling!==node){isolated.push([sibling,sibling.inert]);sibling.inert=true;}
  button.focus();try{await panel.requestFullscreen?.();if(!active&&document.fullscreenElement===panel)await document.exitFullscreen();}catch{/* Fixed-position mode also supports phones without Fullscreen API. */}
 };
 document.addEventListener('fullscreenchange',()=>{if(active&&!document.fullscreenElement)restore();});
 document.addEventListener('keydown',event=>{if(!active)return;if(event.key==='Escape'){event.preventDefault();close();}else if(event.key==='Tab'){const controls=[...panel.querySelectorAll('button,input,select,textarea,a[href],[tabindex="0"]')].filter(node=>!node.disabled&&node.getClientRects().length);const first=controls[0],last=controls.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}});
 window.addEventListener('pagehide',restore);
}
