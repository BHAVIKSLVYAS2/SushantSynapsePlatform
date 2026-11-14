const {test}=require('node:test'),assert=require('node:assert/strict');
test('Kundali DMS display preserves sign membership at boundaries and formats completed arcseconds',async()=>{
 const {signDms,grahaCode}=await import('../apps/rashifal-kundli/frontend/practitioner-copy.mjs');
 assert.equal(signDms(118.3949),'28° 23′ 41″');
 assert.equal(signDms(30),'0° 00′ 00″');
 assert.equal(signDms(29.999999999),'29° 59′ 59″');
 assert.equal(signDms(359.999999999),'29° 59′ 59″');
 assert.equal(signDms(360),'0° 00′ 00″');
 assert.throws(()=>signDms(NaN),TypeError);
 assert.equal(grahaCode('Ketu','Ke','hi'),'के');assert.equal(grahaCode('Ketu','Ke','gu'),'કે');
});
