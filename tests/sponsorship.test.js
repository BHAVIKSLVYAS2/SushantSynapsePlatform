const {test}=require('node:test'),assert=require('node:assert/strict');
const creative={id:'reviewed-example',approved:true,sponsor:'Example advertiser',title:'A useful introduction',description:'A short reviewed message.',url:'https://example.com/offer',pages:['home','teams'],startsAt:'2026-10-01T00:00:00Z',endsAt:'2026-11-01T00:00:00Z'};
test('only approved, active sponsorships appear on explicitly selected public pages',async()=>{
 const {chooseSponsor,validateSponsorConfig}=await import('../packages/ui/sponsorship-engine.mjs');
 const config={enabled:true,contact:null,campaigns:[{...creative,id:'unreviewed',approved:false},creative]};
 assert.equal(validateSponsorConfig(config),config);
 assert.equal(chooseSponsor(config,'home',Date.parse('2026-10-09')),creative);
 for(const page of ['news','advocate','signin','fund-overlap','pocket-pause','moment-studio','profile','search'])assert.equal(chooseSponsor(config,page,Date.parse('2026-10-09')),null);
 assert.equal(chooseSponsor(config,'home',Date.parse(creative.startsAt)-1),null);
 assert.equal(chooseSponsor(config,'home',Date.parse(creative.endsAt)),null);
 assert.equal(chooseSponsor({...config,enabled:false},'home',Date.parse('2026-10-09')),null);
});
test('invalid creative URLs, dates and private placements fail closed',async()=>{
 const {chooseSponsor,validateSponsorConfig,safeSponsorUrl}=await import('../packages/ui/sponsorship-engine.mjs');
 for(const url of ['javascript:alert(1)','http://example.com','https://user:password@example.com','https://example.com:8443','https://example.com/\ntracking','https://localhost'])assert.equal(safeSponsorUrl(url),null);
 for(const patch of [{url:'javascript:alert(1)'},{pages:['advocate']},{startsAt:'2026-02-30T00:00:00Z'},{endsAt:creative.startsAt},{title:'x'.repeat(101)}]){
  const config={enabled:true,contact:null,campaigns:[{...creative,...patch}]};assert.throws(()=>validateSponsorConfig(config));assert.equal(chooseSponsor(config,'home',Date.parse('2026-10-09')),null);
 }
 const duplicates={enabled:true,contact:null,campaigns:[creative,creative]};assert.throws(()=>validateSponsorConfig(duplicates));
 assert.throws(()=>validateSponsorConfig({enabled:true,contact:{type:'email',value:'owner@example.com\r\nBcc:other@example.com'},campaigns:[]}));
});
test('published sponsorship configuration passes creative and contact validation',async()=>{
 const {sponsorConfig}=await import('../apps/portal/frontend/sponsor-config.mjs');const {validateSponsorConfig}=await import('../packages/ui/sponsorship-engine.mjs');
 assert.doesNotThrow(()=>validateSponsorConfig(sponsorConfig));
});
