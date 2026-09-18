// Preloaded only by the isolated browser server, never by production.
const path=require('node:path'),os=require('node:os');
if(path.dirname(path.resolve(process.env.DATA_DIR||'.'))!==path.resolve(os.tmpdir())||!path.basename(process.env.DATA_DIR||'').startsWith('synapse-news-'))throw Error('Mock provider requires isolated News DATA_DIR');
const original=global.fetch;
global.fetch=async(input,options)=>{
 const url=new URL(input);
 if(url.hostname!=='api.gdeltproject.org')return original(input,options);
 const at=url.searchParams.get('enddatetime');
 return new Response(JSON.stringify({articles:Array.from({length:15},(_,i)=>({title:['Parliament debates transport infrastructure','Scientists discover new ocean species','India wins international hockey final','Monsoon rainfall boosts rice harvest','Central bank reviews inflation forecast','Space mission reaches lunar orbit','New railway opens mountain route','Schools introduce regional language classes','National park reports tiger population rise','Technology exports expand this quarter','City launches electric bus service','Museum restores ancient manuscripts','Farmers receive improved irrigation access','Coastal cleanup attracts volunteers','University opens research laboratory'][i],url:`https://source${i}.example/story`,language:'English',seendate:at.slice(0,8)+'T'+at.slice(8)+'Z'}))}),{headers:{'Content-Type':'application/json'}});
};
