import {createHash} from 'node:crypto';
export class PrivateFiles {
 constructor(bucket,repo){if(!bucket)throw Error('Private R2 binding is missing');this.bucket=bucket;this.repo=repo;}
 async upload(scope,id,{name,mime,bytes}){
  if(!['chambers','samaj'].includes(scope)||!id||!bytes?.byteLength)throw Error('Invalid private file');
  const key=`${scope}/${id}/${crypto.randomUUID()}`,sha256=createHash('sha256').update(bytes).digest('hex');
  await this.bucket.put(key,bytes,{httpMetadata:{contentType:'application/octet-stream'},customMetadata:{sha256}});
  // Immutable objects survive ambiguous D1 failures. Reconcile unreferenced keys only
  // after a grace period; never delete a possibly committed object in a catch block.
  return this.repo.statement('INSERT INTO edge_objects(scope,id,object_key,name,mime,size,sha256,created_at) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(scope,id) DO UPDATE SET object_key=excluded.object_key,name=excluded.name,mime=excluded.mime,size=excluded.size,sha256=excluded.sha256,created_at=excluded.created_at',scope,id,key,name,mime,bytes.byteLength,sha256,new Date().toISOString());
 }
 async read(scope,id){const meta=await this.repo.first('SELECT * FROM edge_objects WHERE scope=? AND id=?',scope,id);if(!meta)return null;const object=await this.bucket.get(meta.object_key);if(!object||(object.size!==undefined&&object.size!==meta.size))throw Object.assign(Error('Stored file is temporarily unavailable.'),{status:503});return {meta,object};}
}
