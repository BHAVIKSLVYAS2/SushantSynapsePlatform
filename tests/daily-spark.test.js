const {test}=require('node:test'),assert=require('node:assert/strict');
test('IST rollover, deterministic daily puzzles and valid solutions across a year',async()=>{
 const {istDate,puzzle,tokens,solve}=await import('../apps/daily-spark/frontend/engine.mjs');
 assert.equal(istDate(new Date('2026-10-08T18:29:59Z')),'2026-10-08');assert.equal(istDate(new Date('2026-10-08T18:30:00Z')),'2026-10-09');
 const unique=new Set();for(let day=0;day<365;day++){const date=new Date(Date.UTC(2026,0,1+day)).toISOString().slice(0,10),numbers=puzzle(date);assert.deepEqual(puzzle(date),numbers);assert.equal(numbers.length,4);assert.ok(numbers.every(n=>Number.isInteger(n)&&n>=1&&n<=9));const solution=solve(tokens(numbers));assert.ok(solution);assert.ok(Math.abs(Function('return '+solution)()-24)<1e-8);unique.add(numbers.join(','));}assert.ok(unique.size>100);
});
test('fractions, duplicate tiles, impossible branches and division by zero',async()=>{
 const {calculate,solve,tokens}=await import('../apps/daily-spark/frontend/engine.mjs');assert.throws(()=>calculate(2,'/',0),/zero/);assert.throws(()=>calculate(2,'?',3),/operation/);assert.throws(()=>calculate(NaN,'+',3),/numbers/);assert.equal(calculate(3,'-',8),-5);assert.equal(solve(tokens([1,1,1,1])),null);const solution=solve(tokens([3,3,8,8]));assert.ok(solution);assert.ok(Math.abs(Function('return '+solution)()-24)<1e-8);
});
test('v2 levels are deterministic, solvable and enforce their claimed solution properties',async()=>{
 const {levelBanks,levelPuzzle,solve,tokens,solutionSteps,calculate}=await import('../apps/daily-spark/frontend/engine.mjs');
 function possible(items,divide){if(items.length===1)return items[0]===24;for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++){const a=items[i],b=items[j],rest=items.filter((_,k)=>k!==i&&k!==j),values=[a+b,a*b,a-b,b-a];if(divide){if(b&&Number.isInteger(a/b))values.push(a/b);if(a&&Number.isInteger(b/a))values.push(b/a);}for(const v of new Set(values))if(possible([...rest,v],divide))return true;}return false;}
 for(const [level,bank] of Object.entries(levelBanks))for(const numbers of bank){assert.ok(solve(tokens(numbers)));assert.equal(possible(numbers,false),level==='warmup');assert.equal(possible(numbers,true),level!=='expert');}
 for(const level of Object.keys(levelBanks))for(let seed=0;seed<40;seed++){const numbers=levelPuzzle(String(seed),level);assert.deepEqual(numbers,levelPuzzle(String(seed),level));assert.ok(solve(tokens(numbers)));}
 assert.throws(()=>levelPuzzle('date','invalid'));const steps=solutionSteps(tokens([3,3,8,8]));assert.equal(steps.length,3);const items=[3,3,8,8];for(const step of steps){for(const n of [step.a,step.b]){const i=items.findIndex(v=>Math.abs(v-n)<1e-8);assert.ok(i>=0);items.splice(i,1);}assert.equal(calculate(step.a,step.op,step.b),step.value);items.push(step.value);}assert.ok(Math.abs(items[0]-24)<1e-8);assert.equal(solutionSteps(tokens([1,1,1,1])),null);
});
