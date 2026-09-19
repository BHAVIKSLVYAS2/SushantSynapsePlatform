const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const {Readable} = require('node:stream');
const {PlatformDatabase} = require('../packages/database');
const {createWatchlists} = require('../apps/fund-overlap/backend/watchlists');
test('SQLite watchlists persist, isolate accounts, preserve preferences and enforce validation/access', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(),'fund-watchlists-'));
  const options = {appSchema:path.resolve('apps/advocate/database/schema.sql')}; let store = new PlatformDatabase(dir,options);
  try {
    for (const id of ['a','b']) store.sql.prepare('INSERT INTO users VALUES(?,?,?,?,?,1)').run(id,id,id+'@test.test','Clerk','test-only');
    store.setPreferences('a',{favorites:['advocate'],recent:[]});
    let current = {id:'a',role:'Clerk'}, allowed = true;
    const auth = {session:() => current,hasAppAccess:() => allowed};
    let handler = createWatchlists({store,auth});
    const invoke = async (method,body,id='') => {
      let result, status;
      const req = Readable.from([Buffer.from(JSON.stringify(body || {}))]); req.headers = {'content-type':'application/json'};
      await handler({route:'fund-overlap/watchlists'+(id?'/'+id:''),method,req,user:current,res:{setHeader(){},writeHead(code){status=code;},end(text){result=JSON.parse(text);}}}); return {status,...result};
    };
    const list = await invoke('POST',{name:'Saved',plans:[{code:'118955',name:'HDFC Direct Growth'}]}); assert.equal(list.status,201);
    assert.deepEqual(store.preferences('a').favorites,['advocate']);
    current = {id:'b',role:'Clerk'}; assert.equal((await invoke('GET')).watchlists.length,0); await assert.rejects(invoke('DELETE',null,list.id),e => e.status===404);
    current = {id:'a',role:'Clerk'};
    await assert.rejects(invoke('POST',{name:'x',plans:[{code:'../123',name:'x'}]}),e => e.status===400);
    await assert.rejects(invoke('POST',{name:'x',plans:[{code:'118955',name:'x'},{code:'118955',name:'x'}]}),e => e.status===400);
    allowed=false; await assert.rejects(invoke('GET'),e => e.status===403); allowed=true;
    store.sql.close(); store = new PlatformDatabase(dir,options); handler = createWatchlists({store,auth});
    assert.equal((await invoke('GET')).watchlists[0].name,'Saved'); await invoke('DELETE',null,list.id); assert.equal((await invoke('GET')).watchlists.length,0);
  } finally {store.sql.close(); if (path.dirname(dir) === path.resolve(os.tmpdir())) fs.rmSync(dir,{recursive:true,force:true});}
});
