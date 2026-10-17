import {createSparkCelebration} from '/daily-spark/celebration.mjs';

export function createBreakCelebration(root) {
 const effects=createSparkCelebration(root,{resultSelector:'.result-card',titleSelector:'.break-win-title'});
 const labels={code:'Code cracked!',memory:'All six pairs found!',lights:'All three boards cleared!',face:'Your favourite is crowned!',chaos:'You survived the chaos!'};
 return {
  clear:effects.clear,
  celebrate(id){
   const result=root.querySelector('.result-card');if(!result||result.hidden)return;
   result.classList.add('break-won');
   const title=result.querySelector('h3');title.classList.add('break-win-title');title.tabIndex=-1;
   const badge=document.createElement('p');badge.className='break-win-badge';badge.textContent=labels[id];
   const medal=document.createElement('div');medal.className='break-win-medal';medal.textContent=String.fromCodePoint(0x1f3c6);medal.setAttribute('aria-hidden','true');
   result.prepend(medal,badge);
   effects.celebrate();
  },
 };
}
