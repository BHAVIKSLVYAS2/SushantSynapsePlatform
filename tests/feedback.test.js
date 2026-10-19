const {test}=require('node:test'),assert=require('node:assert/strict');
const origin='https://feedback.test',cookie='__Host-synapse_feedback='+'a'.repeat(64),other='__Host-synapse_feedback='+'b'.repeat(64);
const request=(path='',method='GET',data,headers={})=>new Request(origin+'/api/feedback'+path,{method,headers:{Cookie:cookie,...(data!==undefined?{'Content-Type':'application/json',Origin:origin}:{}),...headers},...(data!==undefined?{body:JSON.stringify(data)}:{})});
const idea={title:'Recurring tasks for Focus',description:'Allow a weekly recurring task so I can plan regular work.',category:'Feature request',app:'Focus'};
async function fixture(){const {feedback,empty}=await import('../apps/feedback/backend/service.mjs');let state=empty();const context={read:async()=>structuredClone(state),write:async(next,version)=>{if(version!==state.version)throw Object.assign(Error('Conflict'),{status:409});state=structuredClone(next);},limit:async()=>({success:true})};return {feedback,context,state:()=>state,create:async data=>(await feedback(request('','POST',{...idea,...data}),context)).json()};}
test('public request/search and browser vote set/unset are persistent and identity-free',async()=>{
 const {feedback,context,create,state}=await fixture(),i=await create();
 for(let n=0;n<2;n++)assert.equal((await(await feedback(request('/'+i.id+'/vote','POST',{voted:true}),context)).json()).votes,1);
 const second=await feedback(request('/'+i.id+'/vote','POST',{voted:true},{Cookie:other}),context);assert.equal((await second.json()).votes,2);
 const mine=await(await feedback(request('?q=recurring&sort=top'),context)).json();assert.equal(mine.items[0].voted,true);assert.equal(mine.total,1);assert.equal(JSON.stringify(mine).includes(state().items[0].creator),false);for(const key of ['voters','reporters','creator','email'])assert.equal(Object.hasOwn(mine.items[0],key),false);
 assert.equal((await(await feedback(request('/'+i.id+'/vote','POST',{voted:false}),context)).json()).votes,1);
 assert.equal((await(await feedback(request('?q=no-such-request'),context)).json()).total,0);
 await assert.rejects(create({title:idea.title.toUpperCase()}),{status:409});
});
test('cookie bootstrap is HttpOnly Secure and POST requires existing identity plus same origin',async()=>{
 const {feedback,context}=await fixture();const response=await feedback(request('','GET',undefined,{Cookie:''}),context);assert.match(response.headers.get('set-cookie'),/__Host-synapse_feedback=[a-f0-9]{64}; HttpOnly; SameSite=Strict; Path=\/; Max-Age=31536000; Secure/);
 await assert.rejects(feedback(request('','POST',idea,{Cookie:''}),context),{status:409});
 await assert.rejects(feedback(request('','POST',idea,{Origin:'https://evil.test'}),context),{status:403});
 await assert.rejects(feedback(request('','POST',idea,{'Sec-Fetch-Site':'cross-site'}),context),{status:403});
 await assert.rejects(feedback(request('','POST',idea,{Origin:''}),context),{status:403});
});
test('comments/reports and admin-only statuses/visibility do not expose hidden text',async()=>{
 const {feedback,context,create}=await fixture(),i=await create(),admin={...context,canModerate:true};
 await feedback(request('/'+i.id+'/comments','POST',{message:'A weekly repeat would help.'}),context);
 const detail=await(await feedback(request('/'+i.id),context)).json(),comment=detail.comments[0];assert.equal(Object.hasOwn(comment,'creator'),false);
 await feedback(request('/'+i.id+'/report','POST',{}),context);await feedback(request('/'+i.id+'/report','POST',{}),context);
 assert.equal((await(await feedback(request('/'+i.id),admin)).json()).reports,1);
 await assert.rejects(feedback(request('/'+i.id+'/moderate','POST',{status:'Shipped'}),context),{status:403});
 await assert.rejects(feedback(request('?moderation=1'),context),{status:403});
 await feedback(request('/'+i.id+'/moderate','POST',{status:'Planned',commentId:comment.id,hidden:true}),admin);
 assert.deepEqual((await(await feedback(request('/'+i.id),context)).json()).comments,[]);
 await feedback(request('/'+i.id+'/moderate','POST',{hidden:true}),admin);
 assert.equal((await(await feedback(request(),context)).json()).total,0);await assert.rejects(feedback(request('/'+i.id),context),{status:404});
 assert.equal((await(await feedback(request('?moderation=1'),admin)).json()).items[0].status,'Planned');
 await feedback(request('/'+i.id+'/moderate','POST',{hidden:false}),admin);assert.equal((await(await feedback(request(),context)).json()).total,1);
});
test('input/query/body bounds, rate limits and request capacity reject without writes',async()=>{
 const {feedback,context,create,state}=await fixture();
 for(const data of [{title:'x'},{description:'short'},{category:'unknown'},{website:'spam'},{userId:'forged'},{title:'x'.repeat(121)}])await assert.rejects(create(data),{status:400});
 for(const q of ['?sort=wrong','?q=x&q=y','?page=0','?status=unknown','?unknown=1'])await assert.rejects(feedback(request(q),context),{status:400});
 await assert.rejects(feedback(request('','POST',idea),{...context,limit:async()=>({success:false})}),{status:429});
 await assert.rejects(feedback(request('','POST',{...idea,description:'x'.repeat(13000)}),context),{status:413});
 assert.equal(state().version,0);
 const full={...context,read:async()=>({version:0,items:Array.from({length:200},(_,n)=>({title:'Existing '+n,hidden:false}))})};await assert.rejects(feedback(request('','POST',idea),full),{status:503});
});
test('conflicting concurrent votes fail rather than silently replacing another browser vote',async()=>{
 const {feedback,context,create,state}=await fixture(),i=await create();
 let reads=0,release;const gate=new Promise(resolve=>release=resolve),racing={...context,read:async()=>{const snapshot=await context.read();if(++reads===2)release();await gate;return snapshot;}};
 const results=await Promise.allSettled([feedback(request('/'+i.id+'/vote','POST',{voted:true}),racing),feedback(request('/'+i.id+'/vote','POST',{voted:true},{Cookie:other}),racing)]);
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(results.find(r=>r.status==='rejected').reason.status,409);assert.equal(state().items[0].voters.length,1);
});
test('feedback survives isolated SQLite reopen without modifying unrelated records/settings',async()=>{
 const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{Store}=require('../apps/advocate/backend/store'),{feedback,storageKey,empty}=await import('../apps/feedback/backend/service.mjs');const dir=fs.mkdtempSync(path.join(os.tmpdir(),'synapse-feedback-'));let store=new Store(dir);
 try{store.setSetting('unrelated',{preserved:true});const context={read:async()=>store.setting(storageKey),write:async(next,version)=>store.transaction(()=>{assert.equal((store.setting(storageKey)||empty()).version,version);store.setSetting(storageKey,next);}),limit:async()=>({success:true})};await feedback(request('','POST',idea),context);store.sql.close();store=new Store(dir);assert.equal(store.setting(storageKey).items[0].title,idea.title);assert.deepEqual(store.setting('unrelated'),{preserved:true});}finally{store.sql.close();fs.rmSync(dir,{recursive:true,force:true});}
});
