const {test}=require('node:test'),assert=require('node:assert/strict');
test('IST rollover, deterministic daily puzzles and valid solutions across a year',async()=>{
 const {istDate,puzzle,tokens,solve}=await import('../apps/daily-spark/frontend/engine.mjs');
 assert.equal(istDate(new Date('2026-10-08T18:29:59Z')),'2026-10-08');assert.equal(istDate(new Date('2026-10-08T18:30:00Z')),'2026-10-09');
 const unique=new Set();for(let day=0;day<365;day++){const date=new Date(Date.UTC(2026,0,1+day)).toISOString().slice(0,10),numbers=puzzle(date);assert.deepEqual(puzzle(date),numbers);assert.equal(numbers.length,4);assert.ok(numbers.every(n=>Number.isInteger(n)&&n>=1&&n<=9));const solution=solve(tokens(numbers));assert.ok(solution);assert.ok(Math.abs(Function('return '+solution)()-24)<1e-8);unique.add(numbers.join(','));}assert.ok(unique.size>100);
});
test('fractions, duplicate tiles, impossible branches and division by zero',async()=>{
 const {calculate,solve,tokens}=await import('../apps/daily-spark/frontend/engine.mjs');assert.throws(()=>calculate(2,'/',0),/zero/);assert.throws(()=>calculate(2,'?',3),/operation/);assert.throws(()=>calculate(NaN,'+',3),/numbers/);assert.equal(calculate(3,'-',8),-5);assert.equal(solve(tokens([1,1,1,1])),null);const solution=solve(tokens([3,3,8,8]));assert.ok(solution);assert.ok(Math.abs(Function('return '+solution)()-24)<1e-8);
});
