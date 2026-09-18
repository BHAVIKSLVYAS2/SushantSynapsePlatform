const {randomUUID}=require('node:crypto');
const {fail}=require('../../../server/http');
const {validDate}=require('./repository');
function createFetchService({store,repository,provider,clock=()=>new Date()}){
  const indiaDate=date=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata'}).format(date);
  function preview(date){
    validDate(date);const edition=repository.get(date);if(edition)return {date,state:'published',edition,cached:true};
    const row=store.sql.prepare('SELECT * FROM news_runs WHERE date=?').get(date);if(!row)return {date,state:'empty',stories:[]};
    const stories=JSON.parse(row.sourceJson);
    return {date,cutoff:row.cutoff,state:stories.length===10?'ready':row.state==='running'&&row.leaseUntil<=clock().toISOString()?'interrupted':row.state,stories,error:row.error,attempts:row.attempts,cached:stories.length===10,provider:'GDELT'};
  }
  async function fetchDate(requested){
    const now=clock(),date=validDate(requested??indiaDate(now)),at=now.toISOString(),token=randomUUID();
    const claim=store.transaction(()=>{
      const saved=preview(date);if(saved.state==='published'||saved.state==='ready')return saved;
      const existing=store.sql.prepare('SELECT * FROM news_runs WHERE date=?').get(date);
      if(date!==indiaDate(now)&&!existing)fail(400,'Only today can start a new fetch. Existing failed runs can be retried.');
      if(existing?.state==='running'&&existing.leaseUntil>at)fail(409,'A news fetch is already running. Reopen the preview shortly.');
      if(existing&&Date.parse(at)-Date.parse(existing.updatedAt)<60000)fail(429,'Please wait one minute before retrying.');
      if(existing?.attempts>=5)fail(429,'This edition has reached its five-attempt limit.');
      // A persisted global cooldown also protects retries for different dates.
      const last=store.sql.prepare('SELECT MAX(updatedAt) at FROM news_runs').get().at;
      if(last&&Date.parse(at)-Date.parse(last)<60000)fail(429,'Please wait one minute before starting another news fetch.');
      const day=at.slice(0,10),used=store.sql.prepare('SELECT requests FROM news_fetch_budget WHERE day=?').get(day)?.requests||0;
      if(used>=20)fail(429,'The daily news request budget is exhausted. Try tomorrow.');
      store.sql.prepare('INSERT INTO news_fetch_budget VALUES(?,1) ON CONFLICT(day) DO UPDATE SET requests=requests+1').run(day);
      const leaseUntil=new Date(now.getTime()+120000).toISOString();
      if(existing)store.sql.prepare("UPDATE news_runs SET state='running',attempts=attempts+1,leaseToken=?,leaseUntil=?,error=NULL,updatedAt=? WHERE date=?").run(token,leaseUntil,at,date);
      else store.sql.prepare("INSERT INTO news_runs(date,cutoff,state,attempts,leaseToken,leaseUntil,createdAt,updatedAt) VALUES(?,?,'running',1,?,?,?,?)").run(date,at,token,leaseUntil,at,at);
      return {date,cutoff:existing?.cutoff||at,claimed:true};
    });
    if(!claim.claimed)return claim;
    try{
      const stories=await provider.fetchStories(claim.cutoff);
      if(!Array.isArray(stories)||stories.length!==10)fail(502,'News provider did not return ten stories');
      const result=store.sql.prepare("UPDATE news_runs SET sourceJson=?,state='pending',leaseToken=NULL,leaseUntil=NULL,error=NULL,updatedAt=? WHERE date=? AND leaseToken=?").run(JSON.stringify(stories),clock().toISOString(),date,token);
      if(!result.changes)fail(409,'This fetch was superseded. Reopen the saved preview.');
      return {...preview(date),cached:false};
    }catch(error){
      // Never persist arbitrary provider/network exception text or request URLs.
      const message=error.status&&[400,409,429,502].includes(error.status)?error.message:'News fetch failed. Please retry later.';
      store.sql.prepare("UPDATE news_runs SET state='failed',leaseToken=NULL,leaseUntil=NULL,error=?,updatedAt=? WHERE date=? AND leaseToken=?").run(message,clock().toISOString(),date,token);
      fail(error.status&&[400,409,429,502].includes(error.status)?error.status:502,message);
    }
  }
  return {preview,fetchDate};
}
module.exports={createFetchService};
