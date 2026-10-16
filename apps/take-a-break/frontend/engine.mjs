export const version='1';
export function random(seed){let state=2166136261;for(const c of `break-v1:${seed}`)state=Math.imul(state^c.charCodeAt(0),16777619)>>>0;return()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};}
export function shuffle(values,seed){const result=[...values],next=random(seed);for(let i=result.length-1;i>0;i--){const j=Math.floor(next()*(i+1));[result[i],result[j]]=[result[j],result[i]];}return result;}
export function validDay(value,today){return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value&&value<=today;}
// Original five-clue construction. Digit and column permutations preserve its
// unique solution and the fact that every clue is needed. Other games keep v1.
export const codeVersion='2';
export function codePuzzle(seed){
 const digits=shuffle('0123456789',`${seed}:code:v2:digits`),columns=shuffle([0,1,2],`${seed}:code:v2:columns`);
 const transform=code=>columns.map(i=>digits[Number(code[i])]).join('');
 const rows=[['345',0,0],['620',0,2],['582',1,0],['294',0,1],['702',1,1]];
 return {secret:transform('012'),clues:shuffle(rows,`${seed}:code:v2:clues`).map(([guess,exact,elsewhere])=>({guess:transform(guess),exact,elsewhere}))};
}
export function codeSecret(seed){return codePuzzle(seed).secret;}
export function scoreCode(secret,guess){
 if(typeof secret!=='string'||typeof guess!=='string'||!/^\d{3}$/.test(secret)||!/^\d{3}$/.test(guess)||new Set(secret).size!==3||new Set(guess).size!==3)throw Error('Use three different digits from 0 to 9.');
 let exact=0;const remainingSecret=[],remainingGuess=[];
 for(let i=0;i<3;i++){if(secret[i]===guess[i])exact++;else{remainingSecret.push(secret[i]);remainingGuess.push(guess[i]);}}
 let elsewhere=0;for(const digit of remainingGuess){const index=remainingSecret.indexOf(digit);if(index>=0){elsewhere++;remainingSecret.splice(index,1);}}
 return {exact,elsewhere};
}
export const memorySymbols=[{mark:'★',name:'star'},{mark:'♥',name:'heart'},{mark:'◆',name:'diamond'},{mark:'☀',name:'sun'},{mark:'☂',name:'umbrella'},{mark:'♣',name:'club'}];
export function memoryGame(seed){return {cards:shuffle([0,0,1,1,2,2,3,3,4,4,5,5],`${seed}:memory`),open:[],matched:[],moves:0};}
export function turnMemory(state,index){if(!Number.isInteger(index)||index<0||index>=state.cards.length)throw Error('Choose a card on the board.');if(state.open.length===2||state.open.includes(index)||state.matched.includes(index))return state;const next={...state,open:[...state.open,index],matched:[...state.matched]};if(next.open.length===2){next.moves++;if(next.cards[next.open[0]]===next.cards[next.open[1]]){next.matched.push(...next.open);next.open=[];}}return next;}
export function closeMemoryPair(state){return {...state,open:[]};}
export function toggleLights(cells,size,index){
 if(!Number.isInteger(size)||size<3||size>5||!Array.isArray(cells)||cells.length!==size*size||cells.some(v=>typeof v!=='boolean')||!Number.isInteger(index)||index<0||index>=cells.length)throw Error('Choose a tile on a 3–5 square board.');
 const next=[...cells],row=Math.floor(index/size),column=index%size;
 for(const [r,c]of [[row,column],[row-1,column],[row+1,column],[row,column-1],[row,column+1]])if(r>=0&&r<size&&c>=0&&c<size)next[r*size+c]=!next[r*size+c];
 return next;
}
// Enumerate the first row, then chase lit cells downwards. Every solution has
// exactly one first-row pattern, so the shortest surviving pattern is optimal.
export function solveLights(cells,size){
 toggleLights(cells,size,0);let best=null;
 for(let mask=0;mask<2**size;mask++){
  let board=[...cells];const moves=[];const press=index=>{board=toggleLights(board,size,index);moves.push(index);};
  for(let c=0;c<size;c++)if(mask&(1<<c))press(c);
  for(let r=1;r<size;r++)for(let c=0;c<size;c++)if(board[(r-1)*size+c])press(r*size+c);
  if(board.every(v=>!v)&&(!best||moves.length<best.length))best=moves;
 }
 return best;
}
export function lightsLevel(seed,level){
 if(!Number.isInteger(level)||level<1||level>3)throw Error('Choose level 1, 2 or 3.');
 const size=level+2,next=random(`${seed}:lights:v1:${level}`),target=[3,6,9][level-1];let best=null;
 for(let attempt=0;attempt<128;attempt++){
  let cells=Array(size*size).fill(false);for(let index=0;index<cells.length;index++)if(next()<.5)cells=toggleLights(cells,size,index);
  const solution=solveLights(cells,size),candidate={size,cells,par:solution.length};
  if(!best||candidate.par>best.par)best=candidate;
  if(candidate.par>=target)return candidate;
 }
 return best;
}
export function parseChoices(text){if(typeof text!=='string'||text.length>2000)throw Error('Keep your list under 2,000 characters.');const choices=text.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);if(choices.length<2||choices.length>16||choices.some(s=>s.length>60))throw Error('Use 2–16 choices, up to 60 characters each.');if(new Set(choices.map(s=>s.normalize('NFKC').toLowerCase())).size!==choices.length)throw Error('Give each choice a different name.');return choices;}
export function faceOff(choices,seed){parseChoices(choices.join('\n'));return {contenders:shuffle(choices,`${seed}:face`),winners:[],round:1,picks:[],winner:null};}
export function chooseFace(state,index){if(state.winner||![0,1].includes(index)||state.contenders.length<2)throw Error('Choose one of the two options.');const next={...state,contenders:state.contenders.slice(2),winners:[...state.winners,state.contenders[index]],picks:[...state.picks,{winner:state.contenders[index],other:state.contenders[1-index],round:state.round}]};if(next.contenders.length===1){next.winners.push(next.contenders[0]);next.contenders=[];}if(!next.contenders.length){if(next.winners.length===1){next.winner=next.winners[0];next.winners=[];}else{next.contenders=next.winners;next.winners=[];next.round++;}}return next;}
