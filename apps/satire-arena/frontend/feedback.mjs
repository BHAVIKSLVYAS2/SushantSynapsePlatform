import {inkpot} from './catalogue.mjs?v=20261011-speakers';
const effects={
 garland:{icon:'🌼',particles:['🌼','🌸','🌼','🍃','🌸'],pulse:[20,35,20]},
 applause:{icon:'👏',particles:['✨','👏','✨'],pulse:[20,30,20,30,20]},
 shoe:{icon:'👟',particles:[],pulse:[45,25,65]},
 finger:{icon:'',particles:[],pulse:[25,35,40]},
 tomato:{icon:'🍅',particles:['💥'],pulse:[35,20,75]},
 laugh:{icon:'😂',particles:['😂','✨','😂'],pulse:[20,25,20,25,30]}
};
const timers=new WeakMap();
const expressions={garland:'happy',applause:'happy',shoe:'annoyed',tomato:'startled',finger:'annoyed',laugh:'laughing'};
const sheets=['expressions-original-fast.webp','expressions-expanded-fast.webp','expressions-new-fast.webp','highway-budget-fast.webp','speakers-fast.webp'];
const ready=new Set();
const preparing=new Map();
export function prepareReaction(card){
 const portrait=card?.querySelector('.portrait'),number=Number([...portrait?.classList||[]].find(name=>/^portrait-\d+$/.test(name))?.split('-')[1]),index=number>=11?4:number>=9?3:Math.floor(number/3);
 if(number>=13)return Promise.resolve();
 if(!sheets[index]||preparing.has(index))return preparing.get(index);
 const image=new Image();image.src='/satire-arena/'+sheets[index];const promise=image.decode().then(()=>ready.add(index)).catch(()=>{});preparing.set(index,promise);return promise;
}
export function stopVibration(){try{navigator.vibrate?.(0);}catch{/* Hardware feedback must never interrupt a vote. */}}
export function playReaction(card,reaction,{haptics=true}={}){
 const effect=effects[reaction];if(!card||!effect||document.hidden)return;
 const portrait=card.querySelector('.portrait'),button=card.querySelector(`[data-reaction="${reaction}"]`);
 clearTimeout(timers.get(card));delete card.dataset.expression;card.querySelectorAll('.reaction-effect').forEach(el=>el.remove());card.querySelectorAll('.reaction-confirmed').forEach(el=>el.classList.remove('reaction-confirmed'));
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 card.dataset.effect=reaction;card.classList.remove('reaction-active');void card.offsetWidth;card.classList.add('reaction-active');button?.classList.add('reaction-confirmed');
 const index=Number([...portrait.classList].find(name=>/^portrait-\d+$/.test(name))?.split('-')[1]);
 if(index<13&&ready.has(index>=11?4:index>=9?3:Math.floor(index/3)))card.dataset.expression=expressions[reaction];
 const layer=document.createElement('div');layer.className='reaction-effect'+(reduced?' reaction-still':'');layer.setAttribute('aria-hidden','true');
 const hero=document.createElement('span');hero.className='reaction-hero';if(reaction==='finger')hero.innerHTML=inkpot;else hero.textContent=effect.icon;layer.append(hero);
 if(reaction==='finger'){
  // Keep the stored ballot ID compatible; the current gesture is an ink throw.
  layer.classList.add('ink-effect');hero.classList.add('ink-projectile');
  const splash=document.createElementNS('http://www.w3.org/2000/svg','svg');
  splash.classList.add('ink-splash');splash.setAttribute('viewBox','0 0 160 160');
  splash.innerHTML='<path class="ink-blot" d="M77 38C60 30 58 51 47 49L25 38 37 62C39 73 21 70 25 84L43 91 32 115 57 103C67 100 63 130 79 124L89 105 119 122 108 96C107 87 137 92 132 77L110 68 126 43 100 52C90 54 98 24 84 28Z"/><g class="ink-drops"><circle cx="18" cy="28" r="5"/><circle cx="137" cy="39" r="7"/><circle cx="146" cy="111" r="5"/><circle cx="20" cy="126" r="7"/><circle cx="70" cy="145" r="4"/><circle cx="115" cy="14" r="4"/></g><path class="ink-shine" d="M61 59Q69 47 81 50M48 76Q44 83 49 88"/>';
  layer.append(splash);
 }
 if(!reduced)for(const [i,icon]of effect.particles.entries()){const particle=document.createElement('span');particle.className='reaction-particle particle-'+i;particle.textContent=icon;layer.append(particle);}
 portrait.append(layer);
 if(haptics&&!reduced)try{navigator.vibrate?.(effect.pulse);}catch{/* Unsupported or denied vibration leaves visual feedback available. */}
 timers.set(card,setTimeout(()=>{layer.remove();card.classList.remove('reaction-active');delete card.dataset.effect;delete card.dataset.expression;button?.classList.remove('reaction-confirmed');timers.delete(card);},reduced?900:1800));
}
