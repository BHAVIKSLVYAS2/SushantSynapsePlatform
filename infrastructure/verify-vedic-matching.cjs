const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
(async()=>{
 const {ashtakoota}=await import('../packages/vedic/matching.mjs'),{geometricTraditionalChecks}=await import('../packages/vedic/traditional-checks.mjs');
 const {matchingRulebook,traditionalRulebook,ruleSources}=await import('../packages/vedic/rulebooks.mjs');
 const fixture=JSON.parse(fs.readFileSync(path.join(__dirname,'../tests/fixtures/vedic-matching-examples.json'),'utf8'));
 const examples=fixture.examples.map(e=>{const result=ashtakoota({personAMoonLongitude:e.a,personBMoonLongitude:e.b,rulebookId:matchingRulebook.id});assert.deepEqual(result.components.map(c=>c.score),e.scores);assert.equal(result.total,e.total);return {fixture:e,result};});
 let pairs=0,min=36,max=0;const totals=Array(73).fill(0);for(let a=0;a<108;a++)for(let b=0;b<108;b++){const result=ashtakoota({personAMoonLongitude:(a+.5)*360/108,personBMoonLongitude:(b+.5)*360/108,rulebookId:matchingRulebook.id});pairs++;min=Math.min(min,result.total);max=Math.max(max,result.total);totals[result.total*2]++;}
 const checks=[];for(const mangalVariant of Object.keys(traditionalRulebook.variants))for(let h=1;h<=12;h++)checks.push(geometricTraditionalChecks({positions:['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'].map(body=>({body,siderealLongitude:body==='Mars'?(h-1)*30+15:body==='Jupiter'?105:15})),lagnaLongitude:15,rulebookId:traditionalRulebook.id,mangalVariant}));
 const hashes=Object.fromEntries(['rulebooks','matching','traditional-checks','birth-matching'].map(name=>[name,createHash('sha256').update(fs.readFileSync(path.join(__dirname,'../packages/vedic',name+'.mjs'))).digest('hex')]));
 const report={phase:'P15',status:'internal-draft-independent-traditional-review-pending',hashes,ruleSources,examples,quarterGrid:{pairs,min,max,halfPointHistogram:totals},checks};const destination=path.join(__dirname,'../docs/vedic/P15_REFERENCE_RESULTS.json');
 if(process.argv.includes('--check'))assert.deepEqual(JSON.parse(fs.readFileSync(destination,'utf8')),report);else fs.writeFileSync(destination,JSON.stringify(report,null,2)+'\n');console.log('P15 reference '+(process.argv.includes('--check')?'verified':'saved')+': 3 examples, 11664 pairs, 36 geometric cases');
})().catch(error=>{console.error(error);process.exitCode=1;});
