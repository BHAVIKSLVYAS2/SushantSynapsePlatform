import {StagedSQL} from './d1-staged.mjs';
import base from '../../infrastructure/cloudflare/d1-catalog.json' with {type:'json'};
import organisations from '../../infrastructure/cloudflare/organisation-catalog.json' with {type:'json'};
// Per-request staging only. Validation and read-your-writes happen before one
// revision-guarded D1 transaction; a failed request never flushes staged writes.
export class OrganisationD1SQL extends StagedSQL {
 constructor(repo){super(repo,null,{...base,...organisations});this.isTransaction=false;}
 async exec(sql){
  if(sql==='BEGIN IMMEDIATE'){if(this.isTransaction)throw Error('Nested transaction');this.isTransaction=true;return;}
  if(sql==='COMMIT'||sql==='ROLLBACK'){this.isTransaction=false;return;}
  throw Error('Runtime schema changes are unavailable');
 }
 async run(sql,args){
  if(/^INSERT INTO platform_organisation_audit\(/.test(sql)){
   this.pending.push(this.repo.statement(sql,...args));return {changes:1};
  }
  return super.run(sql,args);
 }
 async finish(){
  if(this.pending.length)await this.repo.commit([this.repo.statement('PRAGMA defer_foreign_keys=ON'),...this.pending]);
 }
}
