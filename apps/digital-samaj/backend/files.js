'use strict';
const {randomUUID}=require('node:crypto');
const {fail}=require('../../../server/http');
const {text}=require('./validation');
function decodeFile(b,{photoOnly=false}={}){
 const name=text(b.name,'File name',120,true).replace(/[^\p{L}\p{N} ._-]/gu,'_');
 if(typeof b.content!=='string'||b.content.length>2800000||!/^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(b.content))fail(400,'Invalid file encoding');
 const content=Buffer.from(b.content,'base64');if(content.length<12||content.length>2*1024*1024)fail(400,'File must be between 12 bytes and 2 MB');
 let mime;
 if(content.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))){mime='image/png';if(content.length<24||content.toString('ascii',12,16)!=='IHDR'||content.readUInt32BE(16)*content.readUInt32BE(20)>16000000)fail(400,'Image dimensions too large or invalid');}
 else if(content[0]===255&&content[1]===216&&content[2]===255){mime='image/jpeg';let position=2,dimensions=false;while(position+4<content.length){if(content[position]!==255)break;while(content[position]===255)position++;const marker=content[position++];if(marker===217||marker===218)break;if(marker===1||marker>=208&&marker<=215)continue;const length=content.readUInt16BE(position);if(length<2||position+length>content.length)break;if([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker)){if(length<8)break;const height=content.readUInt16BE(position+3),width=content.readUInt16BE(position+5);if(!width||!height||width*height>16000000)fail(400,'Image dimensions too large or invalid');dimensions=true;break;}position+=length;}if(!dimensions)fail(400,'Invalid JPEG dimensions');}
 else if(!photoOnly&&content.subarray(0,5).toString()==='%PDF-')mime='application/pdf';
 else fail(400,'Choose PNG or JPEG'+(photoOnly?'':' or PDF'));
 if(b.mime!==mime)fail(400,'File type does not match content');return {name,mime,content};
}
function files({repo,store}){const {sql}=repo;return ({resource,id,method,b,ctx,json,res})=>{
 if(resource!=='photos')return false;const {samajId,sec,user}=ctx;
 if(method==='POST'&&!id){const kind=b.kind;if(!['person','family'].includes(kind))fail(400,'Invalid photo owner');const r=repo.get(kind,b.entityId,samajId);sec.require(kind+'.edit',r);repo.revision(r,b);if(!sec.visible(r,'photo')&&r.created_by!==user.id)fail(403,'Photo privacy denied');const file=decodeFile(b,{photoOnly:true}),fid=randomUUID();store.transaction(()=>{sql.prepare('INSERT INTO samaj_files VALUES(?,?,?,?,?,?,?,?,?)').run(fid,samajId,kind==='person'?r.id:null,kind==='family'?r.id:null,file.name,file.mime,file.content,user.id,repo.now());const data={...JSON.parse(r.data),photo:fid};sql.prepare(`UPDATE ${kind==='person'?'samaj_persons':'samaj_families'} SET data=?,revision=revision+1,updated_at=? WHERE id=?`).run(JSON.stringify(data),repo.now(),r.id);repo.audit(user,samajId,'photo.upload',r.id,null,{fileId:fid});});json(201,{id:fid});return true;}
 if(method==='GET'&&id){const f=sql.prepare('SELECT * FROM samaj_files WHERE id=? AND samaj_id=?').get(id,samajId);if(!f)fail(404,'Photo not found');const r=repo.get(f.person_id?'person':'family',f.person_id||f.family_id,samajId);sec.require(r.kind+'.view',r);if(!sec.visible(r,'photo')||r.status!=='VERIFIED'&&!sec.can(r.kind+'.edit',r))fail(403,'Photo is private');res.writeHead(200,{'Content-Type':f.mime,'Content-Length':f.content.length,'Cache-Control':'no-store','Content-Disposition':'inline','X-Content-Type-Options':'nosniff'});res.end(Buffer.from(f.content));return true;}
 return false;
};}
module.exports={files,decodeFile};
