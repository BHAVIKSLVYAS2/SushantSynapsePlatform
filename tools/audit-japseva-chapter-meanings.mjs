import {createHash} from 'node:crypto';
import {mantras} from '../apps/japseva/frontend/library.mjs';
import {chapterMeaningPairs} from '../apps/japseva/frontend/chapter-meanings.mjs';
const digest=text=>createHash('sha256').update(text).digest('hex');
const unique=new Map(),missing=[],books=[];
for(const m of mantras.filter(m=>m.chapters)){
 let passages=0,empty=0;
 for(const [index,c]of m.chapters.entries()){
  if(!c.text){empty++;continue;}
  const pairs=chapterMeaningPairs(c);
  if(!pairs||pairs.map(p=>p.sanskrit).join('')!==c.text){missing.push(m.id+':'+index);continue;}
  passages+=pairs.length;unique.set(digest(c.text),{sourceSha256:digest(c.text),meaningSha256:digest(JSON.stringify(pairs.map(p=>p.meaning.hi))),passages:pairs.length});
 }
 books.push({id:m.id,sections:m.chapters.length,instructionOnly:empty,passages});
}
const result={entries:mantras.length,books,uniqueSources:unique.size,uniquePassages:[...unique.values()].reduce((n,r)=>n+r.passages,0),missing,reviewStatus:'ai-assisted; independent Sanskrit/Hindi review pending',sources:[...unique.values()]};
console.log(JSON.stringify(result,null,2));if(missing.length)process.exitCode=1;
