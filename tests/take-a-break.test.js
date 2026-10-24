const {test}=require('node:test'),assert=require('node:assert/strict');
test('clue-led codes have exactly one solution and need all five clues',async()=>{
 const {codePuzzle,scoreCode}=await import('../apps/take-a-break/frontend/engine.mjs');
 const codes=[];for(let a=0;a<10;a++)for(let b=0;b<10;b++)for(let c=0;c<10;c++)if(a!==b&&a!==c&&b!==c)codes.push(''+a+b+c);
 for(let seed=0;seed<100;seed++){
  const puzzle=codePuzzle('day'+seed);assert.deepEqual(puzzle,codePuzzle('day'+seed));assert.equal(puzzle.clues.length,5);assert.equal(new Set(puzzle.secret).size,3);
  const matches=(code,clue)=>{const score=scoreCode(code,clue.guess);return score.exact===clue.exact&&score.elsewhere===clue.elsewhere;};
  for(const clue of puzzle.clues)assert.ok(matches(puzzle.secret,clue));
  assert.deepEqual(codes.filter(code=>puzzle.clues.every(clue=>matches(code,clue))),[puzzle.secret]);
  for(let skipped=0;skipped<5;skipped++)assert.ok(codes.filter(code=>puzzle.clues.every((clue,i)=>i===skipped||matches(code,clue))).length>1,'each clue matters');
 }
 assert.deepEqual(scoreCode('042','204'),{exact:0,elsewhere:3});
 assert.deepEqual(scoreCode('042','047'),{exact:2,elsewhere:0});
 assert.deepEqual(scoreCode('042','042'),{exact:3,elsewhere:0});
 for(const bad of ['001','12','1234','12a',123])assert.throws(()=>scoreCode('042',bad));
});
test('memory boards have exact pairs and every move preserves the original board',async()=>{const {memoryGame,turnMemory,closeMemoryPair}=await import('../apps/take-a-break/frontend/engine.mjs');let state=memoryGame('2026-10-09');assert.deepEqual(state,memoryGame('2026-10-09'));for(let symbol=0;symbol<6;symbol++){const indices=state.cards.flatMap((v,i)=>v===symbol?[i]:[]);assert.equal(indices.length,2);const original=state;state=turnMemory(state,indices[0]);assert.equal(turnMemory(state,indices[0]),state);state=turnMemory(state,indices[1]);assert.deepEqual(state.cards,original.cards);assert.equal(original.matched.length,symbol*2);}assert.equal(state.matched.length,12);assert.equal(state.moves,6);assert.throws(()=>turnMemory(state,20));let mismatch=memoryGame('mismatch');const first=0,other=mismatch.cards.findIndex(v=>v!==mismatch.cards[first]);mismatch=turnMemory(turnMemory(mismatch,first),other);assert.equal(mismatch.open.length,2);assert.equal(turnMemory(mismatch,1),mismatch);assert.deepEqual(closeMemoryPair(mismatch).open,[]);});
test('Lights Out toggles orthogonal neighbours, is reversible and finds shortest solutions',async()=>{
 const {toggleLights,solveLights,lightsLevel}=await import('../apps/take-a-break/frontend/engine.mjs');
 const off=Array(9).fill(false),corner=toggleLights(off,3,0);assert.deepEqual(corner.flatMap((v,i)=>v?[i]:[]),[0,1,3]);assert.deepEqual(off,Array(9).fill(false));assert.deepEqual(toggleLights(corner,3,0),off);
 assert.deepEqual(toggleLights(off,3,2).flatMap((v,i)=>v?[i]:[]),[1,2,5]);assert.deepEqual(solveLights(off,3),[]);
 // Independent BFS verifies optimality across every reachable 3x3 position.
 const encode=board=>board.reduce((mask,v,i)=>mask|(Number(v)<<i),0),distances=new Map([[0,0]]),queue=[off];
 for(let q=0;q<queue.length;q++)for(let i=0;i<9;i++){const board=toggleLights(queue[q],3,i),key=encode(board);if(!distances.has(key)){distances.set(key,distances.get(encode(queue[q]))+1);queue.push(board);}}
 for(const board of queue)assert.equal(solveLights(board,3).length,distances.get(encode(board)));
 for(let seed=0;seed<40;seed++)for(let level=1;level<=3;level++){const puzzle=lightsLevel('day'+seed,level);assert.deepEqual(puzzle,lightsLevel('day'+seed,level));assert.equal(puzzle.size,level+2);assert.ok(puzzle.par>=[3,6,9][level-1]);let cells=[...puzzle.cells];const solution=solveLights(cells,puzzle.size);assert.equal(solution.length,puzzle.par);for(const index of solution)cells=toggleLights(cells,puzzle.size,index);assert.ok(cells.every(v=>!v));}
 assert.throws(()=>toggleLights(off,3,9));assert.throws(()=>lightsLevel('day',4));assert.throws(()=>solveLights([true],3));
});
test('Face-Off produces N minus one comparisons including uneven rounds and does not mutate past states',async()=>{const {faceOff,chooseFace,parseChoices}=await import('../apps/take-a-break/frontend/engine.mjs');for(let size=2;size<=16;size++){const values=Array.from({length:size},(_,i)=>'Choice '+i);let state=faceOff(values,'2026-10-09');assert.deepEqual(state,faceOff(values,'2026-10-09'));while(!state.winner){const prior=structuredClone(state),next=chooseFace(state,state.picks.length%2);assert.deepEqual(state,prior);state=next;}assert.equal(state.picks.length,size-1);assert.ok(values.includes(state.winner));assert.throws(()=>chooseFace(state,0));}for(const input of ['one','A\na','x'.repeat(61)+'\nb','a\n'.repeat(17)])assert.throws(()=>parseChoices(input));assert.deepEqual(parseChoices(' A\r\n\nB '),['A','B']);});
test('shared days reject invalid calendar dates, malformed and future links',async()=>{const {validDay}=await import('../apps/take-a-break/frontend/engine.mjs');for(const value of ['2026-02-30','2026-10-10','2026-1-01','not-a-date',null])assert.equal(validDay(value,'2026-10-09'),false);assert.equal(validDay('2026-10-09','2026-10-09'),true);assert.equal(validDay('2024-02-29','2026-10-09'),true);});
test('hub catalogue keeps existing launch identifiers and exposes the public play hub',()=>{const {apps}=require('../packages/app-registry');assert.equal(apps.find(a=>a.id==='decision-wheel').catalogueParent,undefined);assert.equal(apps.find(a=>a.id==='daily-spark').path,'/take-a-break');assert.equal(apps.filter(a=>a.public&&a.status==='Available'&&!a.catalogueParent).length,15);});
