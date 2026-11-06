const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),source='packages/vedic/data/india-places.json',target='packages/vedic/place-directory.browser.mjs';
function packDirectory(directory){
 const {places,...metadata}=directory,keys=Object.keys(places[0]),constants={},dictionaries={};
 if(!places.every(place=>JSON.stringify(Object.keys(place))===JSON.stringify(keys)))throw Error('Place directory fields changed');
 for(const key of keys){
  const unique=[...new Map(places.map(place=>[JSON.stringify(place[key]),place[key]])).values()];
  if(unique.length===1)constants[key]=unique[0];
  else if(unique.length<places.length/4&&unique.every(value=>typeof value==='string'))dictionaries[key]=unique;
 }
 const indices=Object.fromEntries(Object.entries(dictionaries).map(([key,values])=>[key,new Map(values.map((value,index)=>[value,index]))]));
 const fields=keys.filter(key=>!Object.hasOwn(constants,key));
 return {metadata,keys,constants,dictionaries,rows:places.map(place=>fields.map(key=>indices[key]?indices[key].get(place[key]):place[key]))};
}
function browserSource(directory){return '// Generated losslessly from data/india-places.json; run node infrastructure/build-place-directory.cjs.\nimport {unpackDirectory} from "./place-directory-codec.mjs";\nexport default unpackDirectory('+JSON.stringify(packDirectory(directory))+');\n';}
function buildPlaceDirectory(){const code=browserSource(JSON.parse(fs.readFileSync(path.join(root,source),'utf8'))),file=path.join(root,target);if(!fs.existsSync(file)||fs.readFileSync(file,'utf8')!==code)fs.writeFileSync(file,code);return {bytes:Buffer.byteLength(code)};}
if(require.main===module)console.log(buildPlaceDirectory());
module.exports={packDirectory,browserSource,buildPlaceDirectory};
