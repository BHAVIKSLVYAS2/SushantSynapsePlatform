export function istDate(now=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);}
export const tokens=numbers=>numbers.map(value=>({value,expression:String(value)}));
export function calculate(a,op,b){if(!Number.isFinite(a)||!Number.isFinite(b))throw Error('Choose two numbers.');if(op==='+')return a+b;if(op==='-')return a-b;if(op==='*')return a*b;if(op==='/'){if(Math.abs(b)<1e-10)throw Error('Cannot divide by zero. Choose another move.');return a/b;}throw Error('Choose an operation.');}
export function solve(items){
 if(items.length===1)return Math.abs(items[0].value-24)<1e-8?items[0].expression:null;
 for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++){
  const rest=items.filter((_,k)=>k!==i&&k!==j);
  for(const [a,b]of [[items[i],items[j]],[items[j],items[i]]])for(const op of ['+','-','*','/']){
   if(op==='/'&&Math.abs(b.value)<1e-10)continue;
   const answer=solve([...rest,{value:calculate(a.value,op,b.value),expression:`(${a.expression} ${op} ${b.expression})`}]);if(answer)return answer;
  }
 }return null;
}
export function puzzle(seed){let state=2166136261;for(const c of `spark-v1:${seed}`)state=Math.imul(state^c.charCodeAt(0),16777619)>>>0;const next=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return 1+state%9;};for(let i=0;i<100;i++){const numbers=Array.from({length:4},next);if(solve(tokens(numbers)))return numbers;}return [2,3,4,6];}
export const display=value=>Number.isInteger(value)?String(value):String(Number(value.toFixed(4)));
export function practicePuzzle(seed,difficulty='medium'){
 if(!['easy','medium','hard'].includes(difficulty))throw Error('Choose easy, medium or hard.');if(difficulty==='medium')return puzzle(seed);
 function simple(items){if(items.length===1)return Math.abs(items[0]-24)<1e-8;for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++){const rest=items.filter((_,k)=>k!==i&&k!==j),a=items[i],b=items[j];for(const value of [a+b,a*b,a-b,b-a])if(simple([...rest,value]))return true;}return false;}
 for(let i=0;i<40;i++){const numbers=puzzle(`${seed}:${i}`),plain=simple(numbers);if(difficulty==='easy'&&plain&&numbers.every(n=>n<=6)||difficulty==='hard'&&!plain)return numbers;}return difficulty==='easy'?[2,3,4,6]:[3,3,8,8];
}
