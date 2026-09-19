const fs=require('node:fs'),path=require('node:path');
const {randomUUID,createHash}=require('node:crypto');
const {fail,readBody}=require('../../../server/http');
const core=require('../frontend/portfolio-core');
const fingerprint=row=>createHash('sha256').update(JSON.stringify(core.clean(row))).digest('hex');
function createPortfolio({store,auth,nav}) {
  store.transaction(()=>{
    store.registerAppSchema('fund-lens-portfolio-1',fs.readFileSync(path.join(__dirname,'../database/001-portfolio.sql'),'utf8'),['fund_lens_migrations','fund_lens_portfolios','fund_lens_transactions']);
    store.sql.prepare('INSERT OR IGNORE INTO fund_lens_migrations VALUES(1,?)').run(new Date().toISOString());
  });
  function identity(req,user) {
    const current=auth.session(req);
    if(!current||current.id!==user?.id)fail(401,'Please sign in');
    if(!['Owner','Advocate','Clerk'].includes(current.role)||!auth.hasAppAccess(current,'fund-overlap'))fail(403,'Fund Lens access needed');
    return current.id;
  }
  const read=id=>({revision:store.sql.prepare('SELECT revision FROM fund_lens_portfolios WHERE userId=?').get(id)?.revision||0,transactions:store.sql.prepare('SELECT id,schemeCode,schemeName,date,type,units,amount,reference FROM fund_lens_transactions WHERE userId=? ORDER BY date,id').all(id)});
  return async ({route,method,req,res,user})=>{
    const userId=identity(req,user), relative=route.slice('fund-overlap/portfolio'.length);
    const send=(status,data)=>{res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','private, no-store');res.writeHead(status);res.end(JSON.stringify(data));};
    if(method==='GET'&&relative==='')return send(200,read(userId));
    if(method==='GET'&&relative==='/value') {
      const state=read(userId),balances=core.sequence(state.transactions),histories={};
      await Promise.all([...balances].filter(([,units])=>units>0).map(async ([code])=>{try{histories[code]=await nav.history(code);}catch(error){histories[code]={error:error.message};}}));
      identity(req,user);
      if(read(userId).revision!==state.revision)fail(409,'Portfolio changed. Reload before valuing it.');
      return send(200,{revision:state.revision,...core.valuation(state.transactions,histories)});
    }
    const match=/^\/transactions\/([a-f0-9-]{36})$/.exec(relative), preview=relative==='/preview';
    if(!((method==='POST'&&(relative==='/transactions'||preview))||(['PATCH','DELETE'].includes(method)&&match)))fail(405,'Portfolio method not allowed');
    const input=await readBody(req,1000000);
    if(!Number.isSafeInteger(input.revision)||input.revision<0)fail(400,'Portfolio revision is required');
    const initial=read(userId);
    if(initial.revision!==input.revision)fail(409,'Portfolio changed in another tab. Reload before saving.');
    const old=match?initial.transactions.find(r=>r.id===match[1]):null;
    if(match&&!old)fail(404,'Transaction not found');
    let rows=[];
    if(method!=='DELETE') {
      const supplied=method==='PATCH'?[input.transaction]:input.transactions;
      if(!Array.isArray(supplied)||!supplied.length||supplied.length>500)fail(400,'Submit 1–500 transactions');
      rows=supplied.map((row,i)=>{try{return core.clean(row);}catch(e){fail(400,`Row ${i+1}: ${e.message}`);}});
      const codes=[...new Set(rows.map(r=>r.schemeCode))];
      if(new Set([...initial.transactions.map(r=>r.schemeCode),...codes]).size>50)fail(400,'A portfolio supports up to 50 schemes');
      const names=new Map(initial.transactions.map(r=>[r.schemeCode,r.schemeName]));
      await Promise.all(codes.filter(code=>!names.has(code)).map(async code=>{try{const h=await nav.history(code);if(h.code!==code)throw Error('Scheme mismatch');names.set(code,h.name);}catch{fail(400,`Cannot verify AMFI scheme ${code}. Check the code or retry when NAV data is available.`);}}));
      rows=rows.map(r=>({...r,schemeName:names.get(r.schemeCode),fingerprint:fingerprint(r)}));
    }
    identity(req,user);
    let result;
    store.transaction(()=>{
      const state=read(userId);if(state.revision!==input.revision)fail(409,'Portfolio changed in another tab. Reload before saving.');
      const retained=state.transactions.filter(r=>r.id!==old?.id),seen=new Set(retained.map(fingerprint)),added=[];let duplicates=0;
      for(const r of rows){if(seen.has(r.fingerprint)){if(method==='PATCH')fail(400,'That transaction already exists');duplicates++;}else{seen.add(r.fingerprint);added.push(r);}}
      const combined=[...retained,...added];if(combined.length>10000)fail(400,'Portfolio limit: 10,000 transactions');
      try{core.sequence(combined);}catch(error){fail(400,error.message);}
      if(preview){result={revision:state.revision,transactions:added.map(({fingerprint,...r})=>r),duplicates};return;}
      if(old)store.sql.prepare('DELETE FROM fund_lens_transactions WHERE userId=? AND id=?').run(userId,old.id);
      for(const r of added)store.sql.prepare('INSERT INTO fund_lens_transactions VALUES(?,?,?,?,?,?,?,?,?,?)').run(old?.id||randomUUID(),userId,r.schemeCode,r.schemeName,r.date,r.type,r.units,r.amount,r.reference,r.fingerprint);
      if(old||added.length)store.sql.prepare('INSERT INTO fund_lens_portfolios VALUES(?,1) ON CONFLICT(userId) DO UPDATE SET revision=revision+1').run(userId);
      result={...read(userId),imported:added.length,duplicates};
    });
    return send(200,result);
  };
}
module.exports={createPortfolio};
