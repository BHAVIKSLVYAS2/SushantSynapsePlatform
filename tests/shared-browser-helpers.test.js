const {test}=require('node:test'),assert=require('node:assert/strict');

test('shared ZIP retains UTF-8 and legacy flags, binary bytes and central directory offsets',async()=>{
 const {zip}=await import('../packages/ui/archive.mjs'),{crc32}=await import('../packages/ui/crc32.mjs');
 assert.equal(crc32(new TextEncoder().encode('123456789')),0xcbf43926);
 for(const utf8 of [true,false]){
  const files=[{name:utf8?'मीरा.pdf':'timetable-1.png',data:new Uint8Array([0,255,10,128])},{name:'empty.txt',data:new Uint8Array()}];
  const blob=zip(files,{utf8}),bytes=new Uint8Array(await blob.arrayBuffer()),view=new DataView(bytes.buffer),end=bytes.length-22;
  assert.equal(blob.type,'application/zip');assert.equal(view.getUint32(end,true),0x06054b50);assert.equal(view.getUint16(end+10,true),2);
  let local=0,central=view.getUint32(end+16,true);
  for(const file of files){
   assert.equal(view.getUint32(local,true),0x04034b50);assert.equal(view.getUint16(local+6,true),utf8?0x800:0);
   assert.equal(view.getUint32(local+14,true),crc32(file.data));const length=view.getUint16(local+26,true);
   assert.equal(new TextDecoder().decode(bytes.slice(local+30,local+30+length)),file.name);
   assert.deepEqual(bytes.slice(local+30+length,local+30+length+file.data.length),file.data);
   assert.equal(view.getUint32(central,true),0x02014b50);assert.equal(view.getUint32(central+42,true),local);assert.equal(view.getUint16(central+8,true),utf8?0x800:0);
   local+=30+length+file.data.length;central+=46+length;
  }
  assert.equal(central,end);assert.equal(local,view.getUint32(end+16,true));
 }
});

test('download cleanup runs after both successful and failed clicks, retaining caller timing',async()=>{
 const {downloadBlob}=await import('../packages/ui/download.mjs');
 const saved={document:global.document,timer:global.setTimeout,create:URL.createObjectURL,revoke:URL.revokeObjectURL};
 try{
  let failed=false,delay,scheduled,revoked,clicked;
  global.document={createElement:()=>({click(){clicked=this;if(failed)throw Error('click failed');}})};
  URL.createObjectURL=()=> 'blob:fixture';URL.revokeObjectURL=url=>revoked=url;global.setTimeout=(fn,ms)=>{scheduled=fn;delay=ms;};
  downloadBlob(new Blob(['test']),'test.txt');assert.equal(clicked.download,'test.txt');assert.equal(clicked.href,'blob:fixture');assert.equal(delay,60000);scheduled();assert.equal(revoked,'blob:fixture');
  failed=true;assert.throws(()=>downloadBlob(new Blob(),'failed.txt',{cleanupDelay:1000}),/click failed/);assert.equal(delay,1000);scheduled();assert.equal(revoked,'blob:fixture');
 }finally{if(saved.document===undefined)delete global.document;else global.document=saved.document;global.setTimeout=saved.timer;URL.createObjectURL=saved.create;URL.revokeObjectURL=saved.revoke;}
});

test('HTML helper encodes markup and both quote delimiters while retaining ordinary Unicode',async()=>{
 const {escapeHtml}=await import('../packages/ui/text.mjs');assert.equal(escapeHtml('<img title="मीरा\'s">&'), '&lt;img title=&quot;मीरा&#39;s&quot;&gt;&amp;');assert.equal(escapeHtml(null),'');assert.equal(escapeHtml(0),'0');
});
