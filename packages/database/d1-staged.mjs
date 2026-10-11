// Read-your-writes for asynchronous app workflows. Writes are collected, not sent
// to D1 until one guarded atomic batch commits the complete request.
import catalog from '../../infrastructure/cloudflare/d1-catalog.json' with {type:'json'};
const split=value=>{const parts=[];let start=0,depth=0,quoted=false;for(let i=0;i<value.length;i++){const c=value[i];if(c==="'"){if(quoted&&value[i+1]==="'"){i++;continue;}quoted=!quoted;}if(quoted)continue;if(c==='(')depth++;if(c===')')depth--;if(c===','&&depth===0){parts.push(value.slice(start,i).trim());start=i+1;}}parts.push(value.slice(start).trim());return parts;};
const qualify=sql=>sql.replace(/\[(platform|chambers|batchfee|samaj|tournament|news|fundlens|satire)\]\.\[(\w+)\]/g,(_,owner,name)=>{if(catalog[name]?.owner!==owner)throw Error('Database ownership mismatch');return name;});
const key=(table,row)=>JSON.stringify(catalog[table].primary.map(k=>row[k]));
const defaultValue=definition=>{const m=definition.match(/\bDEFAULT\s+('(?:''|[^'])*'|-?\d+|NULL)/i);if(!m)return null;return m[1][0]==="'"?m[1].slice(1,-1).replaceAll("''", "'"):m[1]==='NULL'?null:Number(m[1]);};
export class StagedSQL {
 constructor(repo,files){this.repo=repo;this.files=files;this.pending=[];this.overlay=new Map();this.blobs=new Map();}
 prepare(raw){const sql=qualify(raw);return {get:(...args)=>this.query(sql,args,true),all:(...args)=>this.query(sql,args,false),run:(...args)=>this.run(sql,args)};}
 async query(sql,args=[],one=false){
  const definitions=[],bindings=[];
  for(const [table,rows]of this.overlay){if(!rows.size||!new RegExp('\\b'+table+'\\b').test(sql))continue;const info=catalog[table],columns=info.columns.map(c=>c.name);
   const payload=JSON.stringify([...rows.values()].map(({row,old})=>({primary:Object.fromEntries(info.primary.map(k=>[k,(old||row)[k]])),row})));
   if(new TextEncoder().encode(payload).byteLength>1500000)throw Object.assign(Error('This workflow is too large for one atomic save.'),{status:413});
   const matches=info.primary.map(k=>`base.${k} IS json_extract(j.value,'$.primary.${k}')`).join(' AND ');
   const select=`SELECT ${columns.map(c=>'base.'+c).join(',')} FROM main.${table} base WHERE NOT EXISTS(SELECT 1 FROM json_each(?) j WHERE ${matches}) UNION ALL SELECT ${columns.map(c=>`json_extract(j.value,'$.row.${c}') AS ${c}`).join(',')} FROM json_each(?) j WHERE json_type(j.value,'$.row')='object'`;
   bindings.push(payload,payload);definitions.push(`${table} AS (${select})`);
  }
  if(bindings.length+args.length>100)throw Object.assign(Error('This workflow exceeds the D1 statement parameter limit. Submit fewer rows.'),{status:413});
  if(definitions.length){if(/^WITH RECURSIVE\s/i.test(sql))sql=sql.replace(/^WITH RECURSIVE\s/i,'WITH RECURSIVE '+definitions.join(',')+',');else if(/^WITH\s/i.test(sql))sql=sql.replace(/^WITH\s/i,'WITH '+definitions.join(',')+',');else sql='WITH '+definitions.join(',')+' '+sql;}
  const result=one?await this.repo.first(sql,...bindings,...args):await this.repo.all(sql,...bindings,...args);
  if(this.files&&/\b(samaj_files|samaj_message_attachments)\b/.test(sql))for(const row of one?[result]:result){if(row&&Object.hasOwn(row,'content')&&row.content===null){if(this.blobs.has(row.id))row.content=this.blobs.get(row.id);else{const f=await this.files.read('samaj',row.id);if(!f)throw Error('Private file metadata is missing');row.content=Buffer.from(await f.object.arrayBuffer());}}}
  return result;
 }
 remember(table,row,old=null){if(!this.overlay.has(table))this.overlay.set(table,new Map());this.overlay.get(table).set(key(table,old||row),{row,old});}
 async run(raw,args){
  const sql=qualify(raw).trim();let m;
  if(m=/^INSERT(?: OR (IGNORE|REPLACE))? INTO (\w+)(?:\s*\(([^)]+)\))?\s+VALUES\s*\(([\s\S]*?)\)(?:\s+ON CONFLICT[\s\S]*)?$/i.exec(sql)){
   const [,mode,table,cols,values]=m,info=catalog[table];if(!info?.primary.length)throw Error('Unregistered staged table');const columns=cols?split(cols):info.columns.map(c=>c.name),expressions=split(values);if(columns.length!==expressions.length)throw Error('Invalid staged insert');
   let upload=null;if(this.files&&['samaj_files','samaj_message_attachments'].includes(table)){const position=columns.indexOf('content');if(position>=0&&expressions[position]==='?'){const parameter=(expressions.slice(0,position).join(',').match(/\?/g)||[]).length;upload=args[parameter];args=[...args];args[parameter]=null;}}
   const value=await this.query('SELECT '+expressions.map((s,i)=>`${s} AS value${i}`).join(','),args,true),row=Object.fromEntries(info.columns.map(c=>[c.name,defaultValue(c.definition)]));columns.forEach((c,i)=>row[c]=value['value'+i]);
   let previous=await this.query('SELECT * FROM '+table+' WHERE '+info.primary.map(k=>`${k} IS ?`).join(' AND '),info.primary.map(k=>row[k]),true);
   if(mode==='IGNORE'&&!previous)for(const fields of info.unique||[]){if(fields.some(k=>row[k]===null))continue;previous=await this.query('SELECT * FROM '+table+' WHERE '+fields.map(k=>`${k} IS ?`).join(' AND '),fields.map(k=>row[k]),true);if(previous)break;}
   if(previous&&mode==='IGNORE')return {changes:0};if(previous&&/ON CONFLICT/i.test(sql)){const update=sql.match(/DO UPDATE SET ([\s\S]+)$/i);if(!update)throw Error('Unsupported staged conflict');const fields=split(update[1]).map(v=>{const m=/^(\w+)=excluded\.(\w+)$/.exec(v.trim());if(!m||m[1]!==m[2])throw Error('Unsupported staged conflict assignment');return m[1];});for(const column of info.columns)if(!fields.includes(column.name))row[column.name]=previous[column.name];}
   if(upload){this.pending.push(await this.files.upload('samaj',row.id,{name:row.name,mime:row.mime,bytes:upload}));this.blobs.set(row.id,Buffer.from(upload));}
   this.pending.push(this.repo.statement(sql,...args));this.remember(table,row,previous);return {changes:1};
  }
  if(m=/^UPDATE (\w+) SET ([\s\S]+?) WHERE ([\s\S]+)$/i.exec(sql)){
   const [,table,set,where]=m,assignments=split(set).map(v=>{const at=v.indexOf('=');return [v.slice(0,at).trim(),v.slice(at+1).trim()];}),changed=new Set(assignments.map(([k])=>k)),select=[...assignments.map(([k,v])=>`${v} AS ${k}`),...catalog[table].columns.map(c=>c.name).filter(k=>!changed.has(k))].join(',');
   const originals=await this.query('SELECT * FROM '+table+' WHERE '+where,args.slice((set.match(/\?/g)||[]).length)),rows=await this.query('SELECT '+select+' FROM '+table+' WHERE '+where,args);
   this.pending.push(this.repo.statement(sql,...args));rows.forEach((r,i)=>this.remember(table,r,originals[i]));return {changes:rows.length};
  }
  if(m=/^DELETE FROM (\w+)(?: WHERE ([\s\S]+))?$/i.exec(sql)){const [,table,where]=m,rows=await this.query('SELECT * FROM '+table+(where?' WHERE '+where:''),args);this.pending.push(this.repo.statement(sql,...args));for(const r of rows)this.remember(table,null,r);return {changes:rows.length};}
  throw Error('Unsupported staged statement');
 }
 async exec(raw){for(const statement of raw.split(';').map(s=>s.trim()).filter(Boolean))await this.run(statement,[]);}
 async finish(){await this.repo.commit(this.pending);}
}
