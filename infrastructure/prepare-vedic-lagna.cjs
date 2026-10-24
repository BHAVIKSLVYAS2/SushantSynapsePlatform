'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const sources=path.resolve(__dirname,'../packages/vedic/data/sources/erfa-2.0.1');
const fixturePath=path.resolve(__dirname,'../tests/fixtures/vedic-lagna/erfa-reference.json');
const manifestPath=path.join(sources,'manifest-p06.json');
const names=['gmst82.c','eqeq94.c'];
const hash=raw=>crypto.createHash('sha256').update(raw).digest('hex');
async function main(){
 if(process.argv.includes('--capture')){
  const entries=[];
  for(const name of names){
   const url='https://raw.githubusercontent.com/liberfa/erfa/v2.0.1/src/'+name;
   const response=await fetch(url,{signal:AbortSignal.timeout(20000)});assert.ok(response.ok,'ERFA capture failed');
   const raw=Buffer.from(await response.arrayBuffer());assert.ok(raw.toString().includes('NumFOCUS'));
   fs.writeFileSync(path.join(sources,name),raw);entries.push({name,url,sha256:hash(raw)});
  }
  fs.writeFileSync(manifestPath,JSON.stringify({version:'erfa-2.0.1-p06',retrieved:'2026-10-24',
   license:'LICENSE',sources:entries},null,2)+'\n');
 }
 const manifest=JSON.parse(fs.readFileSync(manifestPath));
 for(const file of manifest.sources)assert.equal(hash(fs.readFileSync(path.join(sources,file.name))),file.sha256);
 const previous=JSON.parse(fs.readFileSync(path.join(sources,'manifest.json')));
 for(const name of ['t_erfa_c.c','LICENSE']){
  const entry=previous.sources.find(file=>file.name===name);assert.equal(hash(fs.readFileSync(path.join(sources,name))),entry.sha256);
 }
 const text=fs.readFileSync(path.join(sources,'t_erfa_c.c'),'utf8');
 const value=(section,variable)=>{
  const start=text.indexOf('static void '+section+'('),body=text.slice(start,text.indexOf('\n}',start));
  assert.ok(start>=0);const match=body.match(new RegExp('vvd\\('+variable+',\\s*([^,]+)'));
  assert.ok(match);return Number(match[1]);
 };
 const fixture={version:'erfa-2.0.1-p06-published-values',source:previous.sources.find(f=>f.name==='t_erfa_c.c'),
  method:'Published ERFA numerical expectations extracted without executing implementation under test.',
  gmst82:{ut1JulianDay:2453736.5,radians:value('t_gmst82','theta')},
  eqeq94:{ttJulianDay:2441234.5,radians:value('t_eqeq94','eqeq')},
  gst94SameScaleReference:{ut1JulianDay:2453736.5,ttJulianDay:2453736.5,radians:value('t_gst94','theta'),
   note:'Legacy ERFA GST94 uses UT1 for both arguments; runtime uses UT1 for GMST and TT for nutation.'}};
 const output=JSON.stringify(fixture,null,2)+'\n';
 if(process.argv.includes('--check'))assert.equal(fs.readFileSync(fixturePath,'utf8'),output);
 else {fs.mkdirSync(path.dirname(fixturePath),{recursive:true});fs.writeFileSync(fixturePath,output);}
 console.log(JSON.stringify({sources:manifest.sources.length,references:3}));
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
