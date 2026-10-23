'use strict';
const fs=require('node:fs'),path=require('node:path');
const {Readable}=require('node:stream');
const {createHash}=require('node:crypto');
const {qualified}=require('../../../packages/database/catalog');
const ballotTables=['arena_votes','arena_expanded_votes','arena_cast_votes','arena_additions_votes','arena_speakers_votes','arena_anchors_votes','arena_spotlight_votes'];
function registerArena(store){
 const schema=['001-arena.sql','002-expanded-arena.sql','003-nine-character-arena.sql','004-highway-budget.sql','005-speakers.sql','006-news-anchors.sql','007-spotlight-arenas.sql'].map(file=>fs.readFileSync(path.join(__dirname,'../database',file),'utf8')).join('\n');
 store.registerAppSchema('satire-arena',schema,ballotTables);
}
function arenaDatabase(store){
 const qualify=sql=>sql.replace(/\b(arena_votes|arena_expanded_votes|arena_cast_votes|arena_additions_votes|arena_speakers_votes|arena_anchors_votes|arena_spotlight_votes|arena_all_votes)\b/g,name=>qualified(name));
 return {
  prepare(sql){return {bind(...args){return {all(){return {results:store.sql.prepare(qualify(sql)).all(...args)};}};}};},
  batch(statements){return store.transaction(()=>statements.map(statement=>statement.all()));}
 };
}
function createArena({store,secret=process.env.ARENA_COOKIE_SECRET,now=()=>new Date()}){
 registerArena(store);
 const database=arenaDatabase(store),edge=import('./edge.mjs'),buckets=new Map();
 // Local fallback; the Cloudflare route also retains its managed rate limiter.
 const limiter={async limit({key}){const minute=Math.floor(Date.now()/60000),id=createHash('sha256').update(key).digest('hex');let bucket=buckets.get(id);if(!bucket||bucket.minute!==minute){if(buckets.size>=10000){for(const [key,value]of buckets)if(value.minute!==minute)buckets.delete(key);if(buckets.size>=10000)return {success:false};}bucket={minute,count:0};buckets.set(id,bucket);}return {success:++bucket.count<=120};}};
 return async function handle(req,res,origin){
  const request=new Request(new URL(req.url,origin),{method:req.method,headers:{...req.headers,'cf-connecting-ip':req.socket?.remoteAddress||'local'},...(!['GET','HEAD'].includes(req.method)?{body:Readable.toWeb(req),duplex:'half'}:{})});
  const response=await (await edge).arena(request,{ARENA_DB:database,ARENA_COOKIE_SECRET:secret,ARENA_LIMITER:limiter},{now:now()});
  if(response.status>=500){const error=Error((await response.json()).error);error.status=response.status;throw error;}
  for(const [key,value]of response.headers)res.setHeader(key,value);
  res.writeHead(response.status);res.end(Buffer.from(await response.arrayBuffer()));
 };
}
module.exports={createArena,registerArena,arenaDatabase,ballotTables};
