'use strict';

const {portfolioFamily} = require('../frontend/engine');
const {renamedFunds} = require('./search-names');
const {Buffer} = require('node:buffer');

// All tokenization, grouping and ordering happens while publishing reference
// files. Queries use integer postings rather than scanning portfolio names.
const wordsIn = value => String(value || '').toLowerCase().replace(/&/g, ' and ')
  .replace(/\b(large|mid|small|flexi|multi)cap\b/g, '$1 cap')
  .replace(/\bbluechip\b/g, 'blue chip').match(/[a-z0-9]+/g) || [];
const queryWord = value => String(value || '').toLowerCase() === '&' ? 'and' : String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const caches = new WeakMap();
const hydrated = new WeakMap();

class Varints {
  constructor(){this.bytes=Buffer.allocUnsafe(1024);this.length=0;}
  write(value){
    if(!Number.isInteger(value)||value<0||value>0xffffffff)throw Error('Invalid search integer');
    if(this.length+5>this.bytes.length){const next=Buffer.allocUnsafe(this.bytes.length*2);this.bytes.copy(next,0,0,this.length);this.bytes=next;}
    while(value>=128){this.bytes[this.length++]=(value%128)|128;value=Math.floor(value/128);}
    this.bytes[this.length++]=value;
  }
  base64(){return this.bytes.subarray(0,this.length).toString('base64');}
}
function readVarint(bytes,cursor){
  let value=0,factor=1;
  for(let i=0;i<5;i++){
    if(cursor.at>=bytes.length)throw Error('Truncated published search index');
    const byte=bytes[cursor.at++];value+=(byte&127)*factor;
    if(!(byte&128)){if(value>0xffffffff)throw Error('Invalid published search integer');return value;}
    factor*=128;
  }
  throw Error('Invalid published search integer');
}
const zigzag=value=>value<0?-value*2-1:value*2;
const signed=value=>value%2?-(value+1)/2:value/2;
function compactIndex(index){
  const plain=new Varints(),postings=new Varints(),lengths=new Varints();let previous=0;
  for(const value of index.plain){plain.write(zigzag(value-previous));previous=value;}
  for(const list of index.lists){const start=postings.length;previous=0;for(const value of list){postings.write(value-previous);previous=value;}lengths.write(postings.length-start);}
  const packSequences=(rows,width)=>{
    const packed=new Varints(),previous=new Array(width).fill(0);
    for(const row of rows){
      let samePrefix=true;
      for(let i=0;i<width-1;i++){
        packed.write(row[i]-(samePrefix?previous[i]:0));
        samePrefix=samePrefix&&row[i]===previous[i];
      }
      packed.write(zigzag(row[width-1]-previous[width-1]));
      for(let i=0;i<width;i++)previous[i]=row[i];
    }
    return packed.base64();
  };
  return {version:2,rowCount:index.rowCount,tokens:index.tokens,plain:plain.base64(),postings:postings.base64(),lengths:lengths.base64(),listCount:index.lists.length,pairCount:index.pairs.length,tripleCount:index.triples.length,pairs:packSequences(index.pairs,3),triples:packSequences(index.triples,4)};
}

// Call once during Worker module initialization to move binary decoding outside
// request work. queryIndex also hydrates lazily for Node callers and old files.
function hydrateSearchIndex(index){
  if(!index || ![1,2].includes(index.version)||!Array.isArray(index.tokens)||!Number.isInteger(index.rowCount)||index.rowCount<0||index.rowCount>100000)throw Error('Invalid published search index');
  if(index.version===1)return index;
  if(hydrated.has(index))return hydrated.get(index);
  const decode=(encoded,count,visitor)=>{
    if(typeof encoded!=='string'||!Number.isInteger(count)||count<0)throw Error('Invalid published search binary');
    const bytes=Buffer.from(encoded,'base64'),cursor={at:0};visitor(bytes,cursor,count);
    if(cursor.at!==bytes.length)throw Error('Unexpected published search bytes');
  };
  const plain=new Uint32Array(index.tokens.length);let previous=0;
  decode(index.plain,plain.length,(bytes,cursor,count)=>{for(let i=0;i<count;i++){previous+=signed(readVarint(bytes,cursor));if(previous<0||previous>=index.listCount)throw Error('Invalid search posting ID');plain[i]=previous;}});
  const offsets=new Uint32Array(index.listCount+1);
  decode(index.lengths,index.listCount,(bytes,cursor,count)=>{for(let i=0;i<count;i++)offsets[i+1]=offsets[i]+readVarint(bytes,cursor);});
  const postings=Buffer.from(index.postings,'base64');if(offsets.at(-1)!==postings.length)throw Error('Invalid search posting offsets');
  const unpackSequences=(encoded,count,width)=>{
    const values=new Uint32Array(count*width),previous=new Array(width).fill(0);
    decode(encoded,count,(bytes,cursor,size)=>{
      for(let row=0;row<size;row++){
        let samePrefix=true;
        for(let i=0;i<width-1;i++){
          const value=readVarint(bytes,cursor)+(samePrefix?previous[i]:0);
          if(value>=index.tokens.length)throw Error('Invalid search token ID');
          values[row*width+i]=value;samePrefix=samePrefix&&value===previous[i];
        }
        const posting=previous[width-1]+signed(readVarint(bytes,cursor));if(posting<0||posting>=index.listCount)throw Error('Invalid search posting ID');
        values[row*width+width-1]=posting;
        for(let i=0;i<width;i++)previous[i]=values[row*width+i];
      }
    });
    return {values,width,length:count};
  };
  const result={version:1,rowCount:index.rowCount,tokens:index.tokens,plain,postings,offsets,decodedLists:new Map(),pairs:unpackSequences(index.pairs,index.pairCount,3),triples:unpackSequences(index.triples,index.tripleCount,4)};
  hydrated.set(index,result);return result;
}

function aliasValues(aliases, row, position) {
  const value = typeof aliases === 'function' ? aliases(row, position) : Array.isArray(aliases) ? aliases[position] : aliases && (aliases[row.schemeCode] || aliases[row.name]);
  return Array.isArray(value) ? value : typeof value === 'string' ? [value] : [];
}

function buildSearchIndex(rows, {aliases,compact=true} = {}) {
  if (!Array.isArray(rows) || rows.length > 100000) throw Error('Invalid published search rows');
  const terms = new Map(), pairTerms = new Map(), tripleTerms = new Map();
  const add = (table, key, position) => {
    const previous = table.get(key);
    if (!previous) table.set(key, [position]);
    else if (previous.at(-1) !== position) previous.push(position);
  };
  rows.forEach((row, position) => {
    const text = typeof row === 'string' ? row : `${row.name || row.schemeName || ''} ${row.amc || ''}`;
    const alternatives = [text, ...aliasValues(aliases, row, position), ...(row?.previousNames || [])];
    // A row contributes to each posting at most once, even when plans share
    // aliases or the same word appears several times in a scheme name.
    const seenTerms = new Set(), seenPairs = new Set(), seenTriples = new Set();
    for (const alternative of alternatives) {
      const tokens = wordsIn(alternative);
      for (let i=0; i<tokens.length; i++) {
        seenTerms.add(tokens[i]);
        if (i+1<tokens.length) seenPairs.add(tokens[i]+'\0'+tokens[i+1]);
        if (i+2<tokens.length) seenTriples.add(tokens[i]+'\0'+tokens[i+1]+'\0'+tokens[i+2]);
      }
    }
    for (const key of seenTerms) add(terms, key, position);
    for (const key of seenPairs) add(pairTerms, key, position);
    for (const key of seenTriples) add(tripleTerms, key, position);
  });
  const tokens = [...terms.keys()].sort(), tokenIds = new Map(tokens.map((token,i)=>[token,i]));
  const lists = [], listIds = new Map();
  const posting = list => {
    const key = list.join(',');
    if (listIds.has(key)) return listIds.get(key);
    const id = lists.length; lists.push(list); listIds.set(key, id); return id;
  };
  const plain = tokens.map(token=>posting(terms.get(token)));
  const sequences = (table, count) => [...table].map(([key,list])=>[...key.split('\0').map(token=>tokenIds.get(token)), posting(list)])
    .sort((a,b)=>{for(let i=0;i<count;i++)if(a[i]!==b[i])return a[i]-b[i];return 0;});
  const index={version:1, rowCount:rows.length, tokens, plain, lists, pairs:sequences(pairTerms,2), triples:sequences(tripleTerms,3)};
  return compact?compactIndex(index):index;
}

function lowerToken(tokens, term) {
  let lo=0, hi=tokens.length;
  while(lo<hi) {const mid=(lo+hi)>>>1; if(tokens[mid]<term)lo=mid+1;else hi=mid;}
  return lo;
}
function prefixRange(tokens, prefix) {return [lowerToken(tokens,prefix), lowerToken(tokens,prefix+'\uffff')];}
function exactToken(tokens, token) {const i=lowerToken(tokens,token);return tokens[i]===token?i:-1;}
function lowerSequence(rows, key) {
  let lo=0, hi=rows.length;
  while(lo<hi) {
    const mid=(lo+hi)>>>1; let comparison=0;
    for(let i=0;i<key.length;i++){const value=rows.width?rows.values[mid*rows.width+i]:rows[mid][i];if(value!==key[i]){comparison=value<key[i]?-1:1;break;}}
    if(comparison<0)lo=mid+1;else hi=mid;
  }
  return lo;
}
function addSequences(table, fixed, range, postingIds) {
  const start=lowerSequence(table,[...fixed,range[0]]), end=lowerSequence(table,[...fixed,range[1]]);
  for(let i=start;i<end;i++)postingIds.add(table.width?table.values[i*table.width+table.width-1]:table[i].at(-1));
}
function matchingPostings(index, term) {
  const ids=new Set(), tokens=index.tokens;
  // Numeric search terms match complete tokens: "100" must not find "1001D".
  if (/^\d+$/.test(term)) {const position=exactToken(tokens,term);if(position>=0)ids.add(index.plain[position]);return ids;}
  const range=prefixRange(tokens,term);
  for(let i=range[0];i<range[1];i++)ids.add(index.plain[i]);
  // Only complete leading tokens can begin a joined two/three-word query.
  // A broad prefix such as "fund" therefore never visits all joined phrases.
  for(let firstLength=1;firstLength<term.length;firstLength++) {
    const first=exactToken(tokens,term.slice(0,firstLength));if(first<0)continue;
    const rest=term.slice(firstLength);
    addSequences(index.pairs,[first],prefixRange(tokens,rest),ids);
    for(let secondLength=1;secondLength<rest.length;secondLength++) {
      const second=exactToken(tokens,rest.slice(0,secondLength));if(second<0)continue;
      addSequences(index.triples,[first,second],prefixRange(tokens,rest.slice(secondLength)),ids);
    }
  }
  return ids;
}

function mergeSorted(a,b) {
  const result=[];let i=0,j=0;
  while(i<a.length||j<b.length) {
    const value=j===b.length||i<a.length&&a[i]<b[j]?a[i++]:i===a.length||b[j]<a[i]?b[j++]: (j++,a[i++]);
    result.push(value);
  }
  return result;
}
function postingList(index,id){
  if(index.lists)return index.lists[id];
  if(index.decodedLists.has(id))return index.decodedLists.get(id);
  const cursor={at:index.offsets[id]},end=index.offsets[id+1],list=[];let position=0;
  while(cursor.at<end){const delta=readVarint(index.postings,cursor);position+=delta;if(position>=index.rowCount||list.length&&delta===0)throw Error('Invalid search posting order');list.push(position);}
  if(cursor.at!==end)throw Error('Invalid search posting boundary');index.decodedLists.set(id,list);return list;
}
function unionPostings(index, ids) {
  const lists=[...ids].map(id=>postingList(index,id));if(!lists.length)return [];
  if(lists.length===1)return lists[0];
  let maximum=0;for(const list of lists)if(list.length>maximum)maximum=list.length;
  if(maximum===index.rowCount)return lists.find(list=>list.length===maximum);
  if(lists.length<=8&&maximum<4096) {lists.sort((a,b)=>a.length-b.length);return lists.reduce(mergeSorted);}
  // Many prefix variants are cheapest to union with a bounded integer bitmap;
  // row IDs are already in public result order, so no name sort is required.
  const flags=new Uint8Array(index.rowCount);
  for(const list of lists)for(const position of list)flags[position]=1;
  const result=[];for(let i=0;i<flags.length;i++)if(flags[i])result.push(i);return result;
}
function intersectSorted(a,b) {
  const result=[];let i=0,j=0;
  while(i<a.length&&j<b.length){if(a[i]===b[j]){result.push(a[i]);i++;j++;}else if(a[i]<b[j])i++;else j++;}
  return result;
}
function queryIndex(index, query) {
  index=hydrateSearchIndex(index);
  const words=[...new Set((Array.isArray(query)?query:String(query || '').split(/\s+/)).map(queryWord).filter(Boolean))];
  const key=words.slice().sort().join(' ');
  let cache=caches.get(index);if(!cache){cache=new Map();caches.set(index,cache);}
  if(cache.has(key))return cache.get(key);
  const matches=words.map(term=>unionPostings(index,matchingPostings(index,term))).sort((a,b)=>a.length-b.length);
  let result=matches.length?matches[0]:Array.from({length:index.rowCount},(_,i)=>i);
  for(let i=1;i<matches.length&&result.length;i++)result=intersectSorted(result,matches[i]);
  if(cache.size>=16)cache.delete(cache.keys().next().value);cache.set(key,result);return result;
}

function buildCatalogueSearch(rows, {aliases} = {}) {
  if(!Array.isArray(rows))throw Error('Invalid published catalogue');
  const preference=row=>(/\bdirect\b/i.test(row.name || '')?2:0)+(/\bgrowth(?:\s+option)?\s*$/i.test(row.name || '')?1:0);
  const groups=new Map();
  rows.forEach((row,position)=>{
    const family=portfolioFamily(row.name) || 'scheme-'+row.schemeCode;
    let group=groups.get(family);
    if(!group){group={row,position,aliases:[]};groups.set(family,group);}
    group.aliases.push(row.name, ...aliasValues(aliases,row,position), ...(row.previousNames || []));
    const compared=String(row.name).localeCompare(String(group.row.name));
    if(preference(row)>preference(group.row)||preference(row)===preference(group.row)&&(compared<0||compared===0&&String(row.schemeCode)<String(group.row.schemeCode))) {group.row=row;group.position=position;}
  });
  const previousNames=new Map(renamedFunds.map(row=>[portfolioFamily(row.name),row.previousNames]));
  const sorted=[...groups.values()].sort((a,b)=>String(a.row.name).localeCompare(String(b.row.name))||String(a.row.schemeCode).localeCompare(String(b.row.schemeCode)));
  const resultRows=sorted.map(group=>group.row), resultAliases=sorted.map(group=>[...group.aliases,...(previousNames.get(portfolioFamily(group.row.name)) || [])]);
  return {rows:resultRows,sourceRows:sorted.map(group=>group.position),index:buildSearchIndex(resultRows,{aliases:resultAliases})};
}

module.exports={buildSearchIndex,queryIndex,buildCatalogueSearch,hydrateSearchIndex};
