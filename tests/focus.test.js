const {test}=require('node:test');
const assert=require('node:assert/strict');
const model=import('../apps/focus/frontend/task-model.mjs');
const DAY='2026-10-12',OTHER_DAY='2026-10-13';
function task(id,overrides={}){return {id,title:'Task '+id,date:DAY,priority:'Normal',minutes:25,done:false,createdAt:'2026-10-12T07:00:00.000Z',...overrides};}
function command(plan,input){return {...input,revision:plan.revision};}
function rejectsWithoutChanging(updatePlan,plan,input,status){const snapshot=structuredClone(plan);assert.throws(()=>updatePlan(plan,command(plan,input)),error=>error.status===status);assert.deepEqual(plan,snapshot);}

test('Focus legacy plans remain compatible and creation ordering does not mutate stored tasks',async()=>{
 const {emptyPlan,updatePlan,orderedTasks}=await model;assert.deepEqual(emptyPlan(),{revision:0,tasks:[]});
 const rows=[task('later',{createdAt:'2026-10-12T08:00:00.000Z'}),task('earlier',{createdAt:'2026-10-12T06:00:00.000Z'})],snapshot=structuredClone(rows);assert.deepEqual(orderedTasks(rows).map(t=>t.id),['earlier','later']);assert.deepEqual(rows,snapshot);
 let plan={revision:3,tasks:rows};const previous=structuredClone(plan);plan=updatePlan(plan,command(plan,{type:'rename',id:'later',title:' Renamed task '}));assert.equal(plan.revision,4);assert.equal(plan.tasks.find(t=>t.id==='later').title,'Renamed task');assert.deepEqual(previous.tasks,rows);
 plan=updatePlan(plan,command(plan,{type:'toggle',id:'earlier',done:true}));plan=updatePlan(plan,command(plan,{type:'move',id:'later',date:OTHER_DAY}));assert.equal(plan.tasks.find(t=>t.id==='earlier').done,true);assert.equal(plan.tasks.find(t=>t.id==='later').date,OTHER_DAY);
 const created=updatePlan(emptyPlan(),{revision:0,type:'add',title:' New task ',date:DAY,priority:'Low',minutes:5});assert.equal(created.tasks[0].title,'New task');assert.equal(created.tasks[0].done,false);assert.ok(created.tasks[0].id);assert.equal(created.revision,1);
});

test('Focus reordering moves within and between priorities and normalizes only affected lanes',async()=>{
 const {updatePlan,orderedTasks}=await model;
 const original={revision:7,tasks:[task('a',{order:10}),task('b',{order:20}),task('c',{priority:'High',order:90}),task('low',{priority:'Low'}),task('tomorrow',{date:OTHER_DAY,order:42}),task('done',{done:true,priority:'Low'})]},snapshot=structuredClone(original);
 let next=updatePlan(original,command(original,{type:'reorder',id:'b',priority:'Normal',beforeId:'a'}));assert.equal(next.revision,8);assert.deepEqual(orderedTasks(next.tasks.filter(t=>t.priority==='Normal'&&t.date===DAY)).map(t=>t.id),['b','a']);assert.equal(next.tasks.find(t=>t.id==='b').order,0);assert.equal(next.tasks.find(t=>t.id==='a').order,1);assert.deepEqual(original,snapshot);
 next=updatePlan(next,command(next,{type:'reorder',id:'b',priority:'High',beforeId:'c'}));assert.equal(next.tasks.find(t=>t.id==='b').priority,'High');assert.deepEqual(orderedTasks(next.tasks.filter(t=>t.priority==='High')).map(t=>t.id),['b','c']);assert.equal(next.tasks.find(t=>t.id==='a').order,0);assert.equal(next.tasks.find(t=>t.id==='c').order,1);
 for(const id of ['low','tomorrow','done'])assert.deepEqual(next.tasks.find(t=>t.id===id),original.tasks.find(t=>t.id===id));
 next=updatePlan(next,command(next,{type:'reorder',id:'b',priority:'High',beforeId:null}));assert.deepEqual(orderedTasks(next.tasks.filter(t=>t.priority==='High')).map(t=>t.id),['c','b']);
});

test('Focus reordering rejects stale commands and invalid cross-day, priority or completed destinations atomically',async()=>{
 const {updatePlan}=await model;const plan={revision:9,tasks:[task('source'),task('other-day',{date:OTHER_DAY}),task('other-priority',{priority:'High'}),task('complete',{done:true})]},snapshot=structuredClone(plan);
 assert.throws(()=>updatePlan(plan,{revision:8,type:'reorder',id:'source',priority:'High'}),error=>error.status===409);assert.deepEqual(plan,snapshot);
 for(const input of [{type:'reorder',id:'source',priority:'Urgent'},{type:'reorder',id:'source',priority:'Normal',beforeId:'other-day'},{type:'reorder',id:'source',priority:'Normal',beforeId:'other-priority'},{type:'reorder',id:'source',priority:'Normal',beforeId:'complete'},{type:'reorder',id:'source',priority:'Normal',beforeId:'missing'},{type:'reorder',id:'source',priority:'Normal',beforeId:5},{type:'reorder',id:'complete',priority:'High'}])rejectsWithoutChanging(updatePlan,plan,input,400);
 rejectsWithoutChanging(updatePlan,plan,{type:'reorder',id:'missing',priority:'Normal'},404);
});

test('Focus detail editing preserves identity and completion while validating every editable field',async()=>{
 const {updatePlan}=await model;const plan={revision:4,tasks:[task('keep',{done:true,priority:'Low',order:5}),task('untouched',{priority:'High',order:23})]},snapshot=structuredClone(plan);
 const next=updatePlan(plan,command(plan,{type:'edit',id:'keep',title:' Completed preparation ',priority:'High',minutes:240,date:OTHER_DAY})),changed=next.tasks.find(t=>t.id==='keep');assert.equal(next.revision,5);assert.equal(changed.id,'keep');assert.equal(changed.createdAt,plan.tasks[0].createdAt);assert.equal(changed.done,true);assert.equal(changed.title,'Completed preparation');assert.equal(changed.priority,'High');assert.equal(changed.minutes,240);assert.equal(changed.date,OTHER_DAY);assert.deepEqual(next.tasks.find(t=>t.id==='untouched'),plan.tasks[1]);assert.deepEqual(plan,snapshot);
 const valid={type:'edit',id:'keep',title:'Valid task',priority:'Normal',minutes:25,date:DAY};
 for(const invalid of [{title:''},{title:'x'.repeat(161)},{title:null},{priority:'Urgent'},{minutes:4},{minutes:241},{minutes:25.5},{minutes:'25'},{date:'2026-02-31'},{date:'2026-13-01'},{date:null}])rejectsWithoutChanging(updatePlan,plan,{...valid,...invalid},400);
});

test('Focus day and overall capacity limits preserve existing tasks and permit edits within a full day',async()=>{
 const {updatePlan}=await model;const fullDay={revision:2,tasks:[task('source'),...Array.from({length:100},(_,index)=>task('full-'+index,{date:OTHER_DAY}))]},edit={type:'edit',id:'source',title:'Moved title',priority:'High',minutes:45,date:OTHER_DAY};
 rejectsWithoutChanging(updatePlan,fullDay,edit,409);rejectsWithoutChanging(updatePlan,fullDay,{type:'move',id:'source',date:OTHER_DAY},409);
 const sameDay={...fullDay,tasks:fullDay.tasks.filter(t=>t.date===OTHER_DAY)},edited=updatePlan(sameDay,command(sameDay,{...edit,id:'full-0'}));assert.equal(edited.tasks.length,100);assert.equal(edited.tasks[0].title,'Moved title');
 rejectsWithoutChanging(updatePlan,sameDay,{type:'add',title:'Overflow',priority:'Normal',minutes:25,date:OTHER_DAY},409);
 const maximum={revision:0,tasks:Array.from({length:500},(_,index)=>task('max-'+index,{date:'2026-10-'+String(12+Math.floor(index/100)).padStart(2,'0')}))};rejectsWithoutChanging(updatePlan,maximum,{type:'add',title:'Overflow',priority:'Normal',minutes:25,date:'2026-11-01'},409);
});

test('Focus edited or carried tasks append to their destination and completion can be reopened without losing lane order',async()=>{
 const {updatePlan,orderedTasks}=await model;
 let plan={revision:0,tasks:[task('stay'),task('edited',{createdAt:'2026-10-12T08:00:00.000Z'}),task('destination',{priority:'High',order:0}),task('carry',{date:'2026-10-11',priority:'High'})]};
 plan=updatePlan(plan,command(plan,{type:'edit',id:'edited',title:'Updated details',priority:'High',date:DAY,minutes:45}));
 const order=()=>orderedTasks(plan.tasks.filter(t=>t.date===DAY&&t.priority==='High'&&!t.done)).map(t=>t.id);
 assert.deepEqual(order(),['destination','edited']);assert.equal(plan.tasks.find(t=>t.id==='stay').order,0);
 plan=updatePlan(plan,command(plan,{type:'move',id:'carry',date:DAY}));assert.deepEqual(order(),['destination','edited','carry']);
 plan=updatePlan(plan,command(plan,{type:'toggle',id:'edited',done:true}));assert.deepEqual(order(),['destination','carry']);
 plan=updatePlan(plan,command(plan,{type:'toggle',id:'edited',done:false}));assert.deepEqual(order(),['destination','carry','edited']);assert.equal(plan.tasks.find(t=>t.id==='edited').title,'Updated details');assert.equal(plan.tasks.find(t=>t.id==='edited').minutes,45);
 plan=updatePlan(plan,command(plan,{type:'delete',id:'carry'}));assert.deepEqual(order(),['destination','edited']);assert.deepEqual(orderedTasks(plan.tasks.filter(t=>t.date===DAY&&t.priority==='High')).map(t=>t.order),[0,1]);
});
