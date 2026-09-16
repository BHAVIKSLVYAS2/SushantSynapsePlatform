const fs=require('node:fs');
const path=require('node:path');
const {fail}=require('../../../server/http');
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata'}).format(new Date());
function validDate(value){
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(Date.parse(value+'T00:00:00Z'))||new Date(value+'T00:00:00Z').toISOString().slice(0,10)!==value)fail(400,'Enter a valid edition date (YYYY-MM-DD)');
  return value;
}
function text(value,label,max){if(typeof value!=='string'||!value.trim()||value.length>max)fail(400,`Invalid ${label}`);return value.trim();}
function timestamp(value,label){
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)||!Number.isFinite(Date.parse(value)))fail(400,`Invalid ${label}`);
  validDate(value.slice(0,10));return new Date(value).toISOString();
}
function sourceUrl(value){
  text(value,'source URL',2000);let url;try{url=new URL(value);}catch{fail(400,'Invalid source URL');}
  if(!['https:','http:'].includes(url.protocol)||url.username||url.password)fail(400,'Invalid source URL');
  url.hash='';return url.href;
}
function createNewsRepository(store){
  store.registerAppSchema('news-editions-1',fs.readFileSync(path.join(__dirname,'../database/001-editions.sql'),'utf8'),['news_migrations','news_editions','news_stories','news_runs']);
  store.sql.prepare('INSERT OR IGNORE INTO news_migrations VALUES(1,?)').run(new Date().toISOString());
  function get(date){
    validDate(date);const row=store.sql.prepare('SELECT * FROM news_editions WHERE date=?').get(date);
    if(!row)return null;
    const {satireTitle,satireBody,satireStory,...edition}=row;
    return {...edition,satire:{title:satireTitle,body:satireBody,storyPosition:satireStory},stories:store.sql.prepare('SELECT position,title,brief,source,url,publishedAt FROM news_stories WHERE editionDate=? ORDER BY position').all(date)};
  }
  function list(before){
    if(before)validDate(before);
    const rows=store.sql.prepare('SELECT date,name,author,publishedAt FROM news_editions WHERE date < ? ORDER BY date DESC LIMIT 31').all(before||'9999-12-31');
    return {editions:rows.slice(0,30),nextBefore:rows.length>30?rows[29].date:null};
  }
  // Internal publication boundary for the future validated generation pipeline;
  // there is deliberately no user-supplied publication HTTP endpoint.
  function publish(input){
    const date=validDate(input?.date);
    if(date>today())fail(400,'Cannot publish a future edition');
    const existing=get(date);if(existing)return existing;
    const cutoff=timestamp(input.cutoff,'news cutoff'),publishedAt=timestamp(input.publishedAt,'publication time');
    if(new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata'}).format(new Date(cutoff))!==date||Date.parse(publishedAt)<Date.parse(cutoff)||Date.parse(publishedAt)>Date.now())fail(400,'Invalid edition timing');
    if(!Array.isArray(input.stories)||input.stories.length!==10)fail(400,'An edition needs exactly ten stories');
    const stories=input.stories.map((s,index)=>{
      if(!s||typeof s!=='object')fail(400,'Invalid story');
      const at=timestamp(s.publishedAt,'story publication time');
      if(Date.parse(at)>Date.parse(cutoff)||Date.parse(at)<Date.parse(cutoff)-86400000)fail(400,'Story is outside the edition news window');
      return {position:index+1,title:text(s.title,'headline',300),brief:text(s.brief,'brief',3000),source:text(s.source,'source',200),url:sourceUrl(s.url),publishedAt:at};
    });
    if(new Set(stories.map(s=>s.url)).size!==10||new Set(stories.map(s=>s.title.toLowerCase().replace(/\s+/g,' '))).size!==10)fail(400,'Duplicate stories');
    const satire=input.satire||{};
    const title=text(satire.title,'satire title',300),body=text(satire.body,'satire',6000);
    if(!Number.isInteger(satire.storyPosition)||satire.storyPosition<1||satire.storyPosition>10)fail(400,'Invalid satire source');
    const model=text(input.model,'model',150),promptVersion=text(input.promptVersion,'prompt version',100);
    return store.transaction(()=>{
      const saved=get(date);if(saved)return saved;
      store.sql.prepare('INSERT INTO news_editions VALUES(?,?,?,?,?,?,?,?,?,?)').run(date,'Sushant Synapse Times','Bhavik',cutoff,publishedAt,title,body,satire.storyPosition,model,promptVersion);
      const insert=store.sql.prepare('INSERT INTO news_stories VALUES(?,?,?,?,?,?,?)');
      for(const s of stories)insert.run(date,s.position,s.title,s.brief,s.source,s.url,s.publishedAt);
      store.sql.prepare("UPDATE news_runs SET state='published',leaseToken=NULL,leaseUntil=NULL,error=NULL,updatedAt=? WHERE date=?").run(publishedAt,date);
      return get(date);
    });
  }
  return {get,list,publish};
}
module.exports={createNewsRepository,validDate,today};
