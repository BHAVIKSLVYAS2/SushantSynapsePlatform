// Read-your-writes for asynchronous app workflows. Writes are collected, not sent
// to D1 until one guarded atomic batch commits the complete request.
import catalog from '../../infrastructure/cloudflare/d1-catalog.json' with {type:'json'};
const split=value=>{const parts=[];let start=0,depth=0,quoted=false;for(let i=0;i<value.length;i++){const c=value[i];if(c==="'"){if(quoted&&value[i+1]==="'"){i++;continue;}quoted=!quoted;}if(quoted)continue;if(c==='(')depth++;if(c===')')depth--;if(c===','&&depth===0){parts.push(value.slice(start,i).trim());start=i+1;}}parts.push(value.slice(start).trim());return parts;};
const qualify=(sql,catalog)=>sql.replace(/\[(platform|chambers|batchfee|samaj|tournament|news|fundlens|satire)\]\.\[(\w+)\]/g,(_,owner,name)=>{if(catalog[name]?.owner!==owner)throw Error('Database ownership mismatch');return name;});
const key=(catalog,table,row)=>JSON.stringify(catalog[table].primary.map(k=>row[k]));
const defaultValue=definition=>{const m=definition.match(/\bDEFAULT\s+('(?:''|[^'])*'|-?\d+|NULL)/i);if(!m)return null;return m[1][0]==="'"?m[1].slice(1,-1).replaceAll("''", "'"):m[1]==='NULL'?null:Number(m[1]);};
// Evaluate only literal VALUES expressions locally; all other SQL stays in D1.
const literalValues=(expressions,args)=>{let at=0;const values=[];for(const e of expressions){const v=e.trim();if(v==='?'){const value=args[at++];values.push(value===undefined?null:typeof value==='boolean'?Number(value):value);}else if(/^NULL$/i.test(v))values.push(null);else if(/^-?\d+(?:\.\d+)?$/.test(v))values.push(Number(v));else if(/^'(?:''|[^'])*'$/.test(v))values.push(v.slice(1,-1).replaceAll("''","'"));else return null;}return at===args.length?values:null;};
const copyRows=value=>Array.isArray(value)?value.map(row=>({...row})):value?{...value}:value;
export class StagedSQL {
 constructor(repo,files,tableCatalog=catalog){this.catalog=tableCatalog;this.repo=repo;this.files=files;this.pending=[];this.fileWrites=[];this.overlay=new Map();this.blobs=new Map();this.queryCache=new Map();}
 prepare(raw){const sql=qualify(raw,this.catalog);return {get:(...args)=>this.query(sql,args,true),all:(...args)=>this.query(sql,args,false),run:(...args)=>this.run(sql,args)};}
 project(sql,args){
  const match=/^SELECT (\*|1|[\w, ]+) FROM (\w+) WHERE (.+)$/i.exec(sql.trim());if(!match||!this.catalog[match[2]])return null;
  const [,selection,table,where]=match,info=this.catalog[table],conditions=[];let at=0;
  for(const piece of where.split(/\s+AND\s+/i)){const m=/^(\w+)\s*(=|IS)\s*(\?|NULL|-?\d+|'(?:''|[^'])*')$/i.exec(piece.trim());if(!m||!info.columns.some(c=>c.name===m[1]))return null;const expression=m[3],value=expression==='?'?args[at++]:/^NULL$/i.test(expression)?null:expression[0]==="'"?expression.slice(1,-1).replaceAll("''","'"):Number(expression);conditions.push({column:m[1],is:m[2].toUpperCase()==='IS',value});}
  if(at!==args.length)return null;
  const equal=(a,c)=>c.is?a===c.value:a!==null&&c.value!==null&&a===c.value;
  const overlays=[...this.overlay.get(table)?.values()||[]];
  const primary=info.primary.every(k=>conditions.some(c=>c.column===k&&c.value!==null));
  const knownPrimary=primary&&overlays.some(({row,old,identity})=>info.primary.every(k=>conditions.filter(c=>c.column===k).every(c=>equal((old||row||identity)[k],c))));
  // A child of a newly staged parent cannot already exist in the base database.
  const newParent=conditions.some(c=>{const reference=info.columns.find(f=>f.name===c.column)?.definition.match(/REFERENCES\s+(\w+)\s*\((\w+)\)/i);return reference&&[...this.overlay.get(reference[1])?.values()||[]].some(({row,old})=>!old&&row&&equal(row[reference[2]],c));});
  if(!knownPrimary&&!newParent)return null;
  const selected=selection==='*'?null:selection==='1'?['1']:selection.split(',').map(c=>c.trim());if(selected?.some(c=>c!=='1'&&!info.columns.some(f=>f.name===c)))return null;
  return overlays.map(v=>v.row).filter(row=>row&&conditions.every(c=>equal(row[c.column],c))).map(row=>selected?Object.fromEntries(selected.map(c=>[c,c==='1'?1:row[c]])):{...row});
 }
 async hydrate(sql,result,one){
  if(this.files&&/\b(samaj_files|samaj_message_attachments)\b/.test(sql))for(const row of one?[result]:result){if(row&&Object.hasOwn(row,'content')&&row.content===null){if(this.blobs.has(row.id))row.content=this.blobs.get(row.id);else{const f=await this.files.read('samaj',row.id);if(!f)throw Error('Private file metadata is missing');row.content=Buffer.from(await f.object.arrayBuffer());this.blobs.set(row.id,row.content);}}}return result;
 }
 async query(sql,args=[],one=false){
  const projection=this.project(sql,args);if(projection!==null)return this.hydrate(sql,one?projection[0]||null:projection,one);
  const definitions=[],bindings=[];
  for(const [table,rows]of this.overlay){if(!rows.size||!new RegExp('\\b'+table+'\\b').test(sql))continue;const info=this.catalog[table],columns=info.columns.map(c=>c.name);
   const payload=JSON.stringify([...rows.values()].map(({row,old,identity})=>({primary:Object.fromEntries(info.primary.map(k=>[k,(old||row||identity)[k]])),row})));
   if(new TextEncoder().encode(payload).byteLength>1500000)throw Object.assign(Error('This workflow is too large for one atomic save.'),{status:413});
   const matches=info.primary.map(k=>`base.${k} IS json_extract(j.value,'$.primary.${k}')`).join(' AND ');
   const select=`SELECT ${columns.map(c=>'base.'+c).join(',')} FROM main.${table} base WHERE NOT EXISTS(SELECT 1 FROM json_each(?) j WHERE ${matches}) UNION ALL SELECT ${columns.map(c=>`json_extract(j.value,'$.row.${c}') AS ${c}`).join(',')} FROM json_each(?) j WHERE json_type(j.value,'$.row')='object'`;
   bindings.push(payload,payload);definitions.push(`${table} AS (${select})`);
  }
  if(bindings.length+args.length>100)throw Object.assign(Error('This workflow exceeds the D1 statement parameter limit. Submit fewer rows.'),{status:413});
  if(definitions.length){if(/^WITH RECURSIVE\s/i.test(sql))sql=sql.replace(/^WITH RECURSIVE\s/i,'WITH RECURSIVE '+definitions.join(',')+',');else if(/^WITH\s/i.test(sql))sql=sql.replace(/^WITH\s/i,'WITH '+definitions.join(',')+',');else sql='WITH '+definitions.join(',')+' '+sql;}
  const encodedKey=JSON.stringify([one,sql,bindings,args]),cacheKey=encodedKey.length<=32768?encodedKey:null;
  const result=cacheKey&&this.queryCache.has(cacheKey)?copyRows(this.queryCache.get(cacheKey)):one?await this.repo.first(sql,...bindings,...args):await this.repo.all(sql,...bindings,...args);
  if(cacheKey&&!this.queryCache.has(cacheKey)&&this.queryCache.size<100&&JSON.stringify(result).length<=32768)this.queryCache.set(cacheKey,copyRows(result));
  return this.hydrate(sql,result,one);
 }
 remember(table,row,old=null){if(!this.overlay.has(table))this.overlay.set(table,new Map());const id=key(this.catalog,table,old||row),previous=this.overlay.get(table).get(id);this.overlay.get(table).set(id,{row,old:previous?previous.old:old,identity:previous?.identity||old||row});}
 async run(raw,args){
  const sql=qualify(raw,this.catalog).trim();let m;
  if(m=/^INSERT(?: OR (IGNORE|REPLACE))? INTO (\w+)(?:\s*\(([^)]+)\))?\s+VALUES\s*\(([\s\S]*?)\)(?:\s+ON CONFLICT[\s\S]*)?$/i.exec(sql)){
   const [,mode,table,cols,values]=m,info=this.catalog[table];if(!info?.primary.length)throw Error('Unregistered staged table');const columns=cols?split(cols):info.columns.map(c=>c.name),expressions=split(values);if(columns.length!==expressions.length)throw Error('Invalid staged insert');
   let upload=null;if(this.files&&['samaj_files','samaj_message_attachments'].includes(table)){const position=columns.indexOf('content');if(position>=0&&expressions[position]==='?'){const parameter=(expressions.slice(0,position).join(',').match(/\?/g)||[]).length;upload=args[parameter];args=[...args];args[parameter]=null;}}
   const literals=literalValues(expressions,args),value=literals?Object.fromEntries(literals.map((v,i)=>['value'+i,v])):await this.query('SELECT '+expressions.map((s,i)=>`${s} AS value${i}`).join(','),args,true),row=Object.fromEntries(info.columns.map(c=>[c.name,defaultValue(c.definition)]));columns.forEach((c,i)=>row[c]=value['value'+i]);
   const newInsert=this.repo.remaining!==undefined&&!mode&&!/ON CONFLICT/i.test(sql);
   let previous=newInsert?null:await this.query('SELECT * FROM '+table+' WHERE '+info.primary.map(k=>`${k} IS ?`).join(' AND '),info.primary.map(k=>row[k]),true);
   if(mode==='IGNORE'&&!previous)for(const fields of info.unique||[]){if(fields.some(k=>row[k]===null))continue;previous=await this.query('SELECT * FROM '+table+' WHERE '+fields.map(k=>`${k} IS ?`).join(' AND '),fields.map(k=>row[k]),true);if(previous)break;}
   if(previous&&mode==='IGNORE')return {changes:0};if(previous&&/ON CONFLICT/i.test(sql)){const update=sql.match(/DO UPDATE SET ([\s\S]+)$/i);if(!update)throw Error('Unsupported staged conflict');const fields=split(update[1]).map(v=>{const m=/^(\w+)=excluded\.(\w+)$/.exec(v.trim());if(!m||m[1]!==m[2])throw Error('Unsupported staged conflict assignment');return m[1];});for(const column of info.columns)if(!fields.includes(column.name))row[column.name]=previous[column.name];}
   if(upload){const statement=await this.files.upload('samaj',row.id,{name:row.name,mime:row.mime,bytes:upload,table});this.pending.push(statement);this.fileWrites.push(statement);this.blobs.set(row.id,Buffer.from(upload));}
   this.pending.push(this.repo.statement(sql,...args));this.remember(table,row,previous);return {changes:1};
  }
  if(m=/^UPDATE (\w+) SET ([\s\S]+?) WHERE ([\s\S]+)$/i.exec(sql)){
   const [,table,set,where]=m,assignments=split(set).map(v=>{const at=v.indexOf('=');return [v.slice(0,at).trim(),v.slice(at+1).trim()];}),changed=new Set(assignments.map(([k])=>k)),select=[...assignments.map(([k,v])=>`${v} AS ${k}`),...this.catalog[table].columns.map(c=>c.name).filter(k=>!changed.has(k))].join(',');
   const originals=await this.query('SELECT * FROM '+table+' WHERE '+where,args.slice((set.match(/\?/g)||[]).length)),rows=await this.query('SELECT '+select+' FROM '+table+' WHERE '+where,args);
   this.pending.push(this.repo.statement(sql,...args));rows.forEach((r,i)=>this.remember(table,r,originals[i]));return {changes:rows.length};
  }
  if(m=/^DELETE FROM (\w+)(?: WHERE ([\s\S]+))?$/i.exec(sql)){const [,table,where]=m,rows=await this.query('SELECT * FROM '+table+(where?' WHERE '+where:''),args);this.pending.push(this.repo.statement(sql,...args));for(const r of rows)this.remember(table,null,r);return {changes:rows.length};}
  throw Error('Unsupported staged statement');
 }
 async exec(raw){for(const statement of raw.split(';').map(s=>s.trim()).filter(Boolean))await this.run(statement,[]);}
 async finish(){
  if(this.repo.remaining===undefined)return this.repo.commit(this.pending);
  // Commit the already-validated final projection once per table on Free D1.
  // Parent-first inserts retain immediate foreign keys; audits remain append-only.
  const order=[],seen=new Set(),visit=table=>{if(seen.has(table))return;seen.add(table);for(const column of this.catalog[table].columns){const parent=column.definition.match(/REFERENCES\s+(\w+)/i)?.[1];if(parent&&parent!==table&&this.overlay.has(parent))visit(parent);}order.push(table);};
  for(const table of this.overlay.keys())visit(table);
  const writes=[...this.fileWrites];
  for(const table of [...order].reverse()){
   const info=this.catalog[table],removed=[...this.overlay.get(table).values()].filter(({row,old})=>old&&(!row||key(this.catalog,table,row)!==key(this.catalog,table,old))).map(({old})=>Object.fromEntries(info.primary.map(k=>[k,old[k]])));
   if(removed.length)writes.push(this.repo.statement(`DELETE FROM ${table} WHERE EXISTS(SELECT 1 FROM json_each(?) j WHERE ${info.primary.map(k=>`${table}.${k} IS json_extract(j.value,'$.${k}')`).join(' AND ')})`,JSON.stringify(removed)));
  }
  for(const table of order){
   const info=this.catalog[table],columns=info.columns.map(c=>c.name),entries=[...this.overlay.get(table).values()].filter(v=>v.row);if(!entries.length)continue;
   const updates=columns.filter(c=>!info.primary.includes(c));
   for(const fresh of [true,false]){const rows=entries.filter(v=>!v.old===fresh).map(v=>v.row);if(!rows.length)continue;
    writes.push(this.repo.statement(`INSERT INTO ${table}(${columns.join(',')}) SELECT ${columns.map(c=>`json_extract(j.value,'$.${c}')`).join(',')} FROM json_each(?) j WHERE 1${fresh?'':` ON CONFLICT(${info.primary.join(',')}) DO ${updates.length?'UPDATE SET '+updates.map(c=>`${c}=excluded.${c}`).join(','):'NOTHING'}`}`,JSON.stringify(rows)));
   }
  }
  await this.repo.commit(writes);
 }
}
