import {createHash} from 'node:crypto';
import {fail} from '../../server/edge-http.mjs';
export const D1_FILE_LIMIT=1000000,D1_DOCUMENT_LIMIT=100000000;
// The blob, file metadata, document record and audit entry share the guarded batch.
// No public object URL and no separate storage subscription are used.
export class D1PrivateFiles {
 constructor(repo){this.repo=repo;this.maxFileBytes=D1_FILE_LIMIT;}
 async upload(scope,id,{name,mime,bytes}){
  if(scope!=='chambers'||!id||!bytes?.byteLength)fail(400,'Invalid document');
  if(bytes.byteLength>D1_FILE_LIMIT)fail(413,'Choose a nonempty document up to 1 MB');
  const sha256=createHash('sha256').update(bytes).digest('hex');
  return this.repo.statement('INSERT INTO edge_document_blobs(id,name,mime,size,sha256,content,created_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,mime=excluded.mime,size=excluded.size,sha256=excluded.sha256,content=excluded.content,created_at=excluded.created_at',id,name,mime,bytes.byteLength,sha256,bytes,new Date().toISOString());
 }
 async read(scope,id){
  if(scope!=='chambers')fail(400,'Invalid document scope');
  const row=await this.repo.first('SELECT name,mime,size,sha256,content FROM edge_document_blobs WHERE id=?',id);
  if(!row)fail(503,'This document has not been imported into D1. Its original bytes remain in the recovery backup.');
  const bytes=new Uint8Array(row.content);
  if(bytes.byteLength!==row.size||createHash('sha256').update(bytes).digest('hex')!==row.sha256)fail(503,'Stored document verification failed');
  return {meta:{...row,id,content:undefined},object:new Response(bytes)};
 }
}
