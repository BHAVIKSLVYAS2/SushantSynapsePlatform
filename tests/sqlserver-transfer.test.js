'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {digest}=require('../packages/database/sqlserver-transfer');
test('migration verification ignores ordering and preserves values, blobs and duplicate rows',()=>{
 const rows=[{id:1,label:'पहला',blob:Buffer.from([0,255])},{id:2,label:'second',blob:null}];
 assert.equal(digest(rows),digest([{blob:null,label:'second',id:2},{blob:new Uint8Array([0,255]),label:'पहला',id:1}]));
 assert.notEqual(digest(rows),digest([{...rows[0],label:'changed'},rows[1]]));
 assert.notEqual(digest(rows),digest([rows[0],rows[0],rows[1]]));
 assert.notEqual(digest(rows),digest([{...rows[0],id:'1'},rows[1]]));
});
