// Synthetic, isolated real-inference evaluation. No accounts, DATA_DIR or app writes.
// Exit 2 means no inference was possible: never treat it as a quality pass.
const http=require('node:http'),fs=require('node:fs/promises'),path=require('node:path');
const {chromium}=require('@playwright/test');
(async()=>{
 const file=await fs.readFile(path.join(__dirname,'../frontend/local-writing.mjs'));
 const server=http.createServer((req,res)=>{if(req.url==='/local-writing.mjs'){res.writeHead(200,{'Content-Type':'text/javascript'});res.end(file);}else if(req.url==='/'){res.writeHead(200,{'Content-Type':'text/html'});res.end('<!doctype html><title>Isolated local writing evaluation</title><button id="run">Evaluate local writing</button>');}else{res.writeHead(404);res.end();}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;
 try{
  browser=await chromium.launch({channel:'chrome',headless:!process.argv.includes('--headed')});const page=await browser.newPage();await page.goto('http://127.0.0.1:'+server.address().port);
  const availability=await page.evaluate(async()=>{const {createLocalWriter}=await import('/local-writing.mjs');return {agent:navigator.userAgent,...await createLocalWriter().availability()};});
  const cases=[
   {prompt:'Write a professional birthday invitation.',context:{recipient:'Meera',date:'2026-12-12',location:'Lotus Hall'}},
   {prompt:'Create a Diwali greeting for my family.',context:{sender:'Aarav'}},
   {prompt:'Generate appreciation certificate wording.',context:{recipient:'Meera',contribution:'volunteering at the library'},maxLength:250},
   {prompt:'Create a retirement farewell message.',context:{recipient:'Meera',relationship:'colleague'}},
   ...['improve','shorter','formal','friendly','emotional','grammar','simple','alternative','invitation','certificate'].map(action=>({action,text:'Meera, we is happy to invite you to Lotus Hall on 2026-12-12.',context:{recipient:'Meera',location:'Lotus Hall',date:'2026-12-12'},length:'long'}))
  ];
  if(availability.state!=='available'&&!(process.argv.includes('--download')&&['downloadable','downloading'].includes(availability.state))){console.log(JSON.stringify({status:'blocked',availability,realInference:false,qualityApprovedLanguages:[],unverifiedLanguages:['hi','gu','hinglish'],reason:'A supported local model must be available before quality can be evaluated. No model was downloaded.'},null,2));process.exitCode=2;return;}
  await page.evaluate(cases=>{window.cases=cases;document.querySelector('#run').onclick=async()=>{const {createLocalWriter}=await import('/local-writing.mjs'),writer=createLocalWriter({evaluation:true});window.results=[];for(const input of window.cases){try{const output=await writer.write(input);window.results.push({input,output});}catch(error){window.results.push({input,error:error.message});}}window.done=true;};},cases);
  await page.click('#run');await page.waitForFunction(()=>window.done,{},{timeout:600000});const results=await page.evaluate(()=>window.results);
  console.log(JSON.stringify({status:results.some(row=>row.error)?'failed':'needs-fluency-review',availability,realInference:true,qualityApprovedLanguages:[],results,note:'Review naturalness, grammar, requested action, supplied facts, layout and exports before approving any language. Automated detail checks alone do not certify fluency.'},null,2));if(results.some(row=>row.error))process.exitCode=1;
 }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
