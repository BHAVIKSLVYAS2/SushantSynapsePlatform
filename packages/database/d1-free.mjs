import {D1Repository} from './d1.mjs';
import {fail} from '../../server/edge-http.mjs';
// Free D1 allows 50 queries per invocation. Fail before starting an atomic save.
export class FreeD1Repository extends D1Repository {
 constructor(binding,budget=45){super(binding);this.remaining=Math.min(49,budget);}
 consume(count=1){if(count>this.remaining){console.warn('D1 query budget exhausted',{requested:count,remaining:this.remaining});fail(413,'This operation exceeds the free workspace query limit. Use a smaller operation.');}this.remaining-=count;}
 async first(...args){this.consume();return super.first(...args);}
 async all(...args){this.consume();return super.all(...args);}
 async commit(statements){if(statements.length){this.consume(statements.length+3);return super.commit(statements);}}
}
