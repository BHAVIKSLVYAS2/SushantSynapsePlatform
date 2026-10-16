import test from 'node:test';
import assert from 'node:assert/strict';
import {visitors} from '../backend/visitors.mjs';
test('distinct browser aggregation deduplicates, estimates and stores no IDs',async()=>{
 let saved=null,writes=0;const context={readVisitors:async()=>saved,writeVisitors:async next=>{saved=next;writes++;}};
 const get=()=>visitors(new Request('https://example.test/api/platform/visitors'),context);
 const post=id=>visitors(new Request('https://example.test/api/platform/visitors',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})}),context);
 assert.equal((await (await get()).json()).count,0);
 const id='00000000-0000-4000-8000-000000000000';assert.equal((await (await post(id)).json()).count,1);await post(id);assert.equal(writes,1);assert.ok(!JSON.stringify(saved).includes(id));
 for(let n=1;n<1000;n++)await post('00000000-0000-4000-8000-'+n.toString(16).padStart(12,'0'));
 const result=await (await get()).json();assert.ok(result.count>900&&result.count<1100);assert.equal(result.estimated,true);assert.equal(saved.registers.length,1024);assert.ok(JSON.stringify(saved).length<3000);
 await assert.rejects(()=>post('invalid'),e=>e.status===400);
});
