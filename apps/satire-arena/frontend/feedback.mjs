const effects={
 garland:{icon:'🌼',particles:['🌼','🌸','🌼','🍃','🌸'],pulse:[20,35,20]},
 applause:{icon:'👏',particles:['✨','👏','✨'],pulse:[20,30,20,30,20]},
 shoe:{icon:'👟',particles:[],pulse:[45,25,65]},
 finger:{icon:'🖕',particles:[],pulse:[25,35,40]},
 tomato:{icon:'🍅',particles:['💥'],pulse:[35,20,75]},
 laugh:{icon:'😂',particles:['😂','✨','😂'],pulse:[20,25,20,25,30]}
};
const timers=new WeakMap();
export function stopVibration(){try{navigator.vibrate?.(0);}catch{/* Hardware feedback must never interrupt a vote. */}}
export function playReaction(card,reaction,{haptics=true}={}){
 const effect=effects[reaction];if(!card||!effect||document.hidden)return;
 const portrait=card.querySelector('.portrait'),button=card.querySelector(`[data-reaction="${reaction}"]`);
 clearTimeout(timers.get(card));card.querySelectorAll('.reaction-effect').forEach(el=>el.remove());card.querySelectorAll('.reaction-confirmed').forEach(el=>el.classList.remove('reaction-confirmed'));
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 card.dataset.effect=reaction;card.classList.remove('reaction-active');void card.offsetWidth;card.classList.add('reaction-active');button?.classList.add('reaction-confirmed');
 const layer=document.createElement('div');layer.className='reaction-effect'+(reduced?' reaction-still':'');layer.setAttribute('aria-hidden','true');
 const hero=document.createElement('span');hero.className='reaction-hero';hero.textContent=effect.icon;layer.append(hero);
 if(!reduced)for(const [i,icon]of effect.particles.entries()){const particle=document.createElement('span');particle.className='reaction-particle particle-'+i;particle.textContent=icon;layer.append(particle);}
 portrait.append(layer);
 if(haptics&&!reduced)try{navigator.vibrate?.(effect.pulse);}catch{/* Unsupported or denied vibration leaves visual feedback available. */}
 timers.set(card,setTimeout(()=>{layer.remove();card.classList.remove('reaction-active');delete card.dataset.effect;button?.classList.remove('reaction-confirmed');timers.delete(card);},reduced?650:1350));
}
