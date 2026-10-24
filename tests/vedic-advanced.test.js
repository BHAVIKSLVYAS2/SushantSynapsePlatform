const {test}=require('node:test'),assert=require('node:assert/strict');
const fixture=require('./fixtures/vedic-advanced-reference.json');
const birth={localDate:'2000-01-01',localTime:'12:15',placeId:'geonames:1261481',timeZoneId:'Asia/Kolkata',timeAccuracy:'exact',calculationProfileId:'IN_LAHIRI_DEFAULT_V1'},context={now:Date.parse('2026-10-24T12:00Z')};
function adjacent(x,direction){if(x===0)return direction>0?Number.MIN_VALUE:-Number.MIN_VALUE;const b=new ArrayBuffer(8),v=new DataView(b);v.setFloat64(0,x);let bits=v.getBigUint64(0);bits+=(x>0)===(direction>0)?1n:-1n;v.setBigUint64(0,bits);return v.getFloat64(0);}
test('P16 D7/D10/D12 agree with six published worked mappings',async()=>{
 const {advancedDivisionForLongitude:part}=await import('../packages/vedic/advanced-vargas.mjs');for(const e of fixture.divisionExamples)assert.equal(part({chartType:e.chartType,siderealLongitude:e.longitude}).rashi,e.rashi);
});
test('P16 all 348 divisional cells and every representable boundary neighbour retain half-open assignments',async()=>{
 const {advancedDivisionForLongitude:part}=await import('../packages/vedic/advanced-vargas.mjs');
 for(const [type,n,evenOffset]of [['D7',7,6],['D10',10,8],['D12',12,0]])for(let sign=0;sign<12;sign++)for(let k=0;k<n;k++){
  const start=sign*30+k*30/n,end=sign*30+(k+1)*30/n,expected=(sign+(sign%2?evenOffset:0)+k)%12+1;
  for(const angle of [start,adjacent(start,1),(start+end)/2,adjacent(end,-1)]){const r=part({chartType:type,siderealLongitude:angle});assert.equal(r.rashi,expected,`${type} ${sign} ${k} ${angle}`);assert.equal(r.divisionWithinRashi,k+1);assert.ok(r.boundaryDistanceArcsec>=0);}
 }
 for(const type of ['D7','D10','D12'])assert.equal(part({chartType:type,siderealLongitude:360}).rashi,1);
});
test('P16 raw Ashtakavarga agrees with published Chart 6 Sun/Mercury BAV and all twelve SAV values',async()=>{
 const {rawAshtakavarga,ashtakavargaModel}=await import('../packages/vedic/ashtakavarga.mjs');const r=rawAshtakavarga({signs:fixture.ashtakavarga.signs,modelId:ashtakavargaModel.id});
 assert.deepEqual(r.bav.find(p=>p.body==='Sun').values,fixture.ashtakavarga.sunBav);assert.deepEqual(r.bav.find(p=>p.body==='Mercury').values,fixture.ashtakavarga.mercuryBav);assert.deepEqual(r.sav,fixture.ashtakavarga.sav);assert.equal(r.total,337);
});
test('P16 eight contributions reconstruct each BAV; row totals, 337 total and rotation covariance hold',async()=>{
 const {rawAshtakavarga:av,ashtakavargaModel:m}=await import('../packages/vedic/ashtakavarga.mjs');const base=av({modelId:m.id,signs:fixture.ashtakavarga.signs});
 for(let shift=0;shift<12;shift++){const signs=Object.fromEntries(Object.entries(fixture.ashtakavarga.signs).map(([k,s])=>[k,(s-1+shift)%12+1])),r=av({modelId:m.id,signs});assert.equal(r.total,337);assert.deepEqual(r.bav.map(p=>p.total),[48,49,39,54,56,52,39]);for(let row=0;row<7;row++)for(let i=0;i<12;i++){assert.equal(r.bav[row].values[i],r.bav[row].contributions.reduce((sum,c)=>sum+c.values[i],0));assert.ok(r.bav[row].values[i]>=0&&r.bav[row].values[i]<=8);assert.equal(r.bav[row].values[(i+shift)%12],base.bav[row].values[i]);}assert.ok(Object.isFrozen(r.bav));}
});
test('P16 Uccha Bala has source-defined extrema, half-strength quadratures and excludes nodes/full Shadbala',async()=>{
 const {ucchaBala:strength,ucchaBalaModel:m}=await import('../packages/vedic/strength.mjs');
 for(const [body,exaltation]of Object.entries({Sun:10,Moon:33,Mars:298,Mercury:165,Jupiter:95,Venus:357,Saturn:200}))for(const [offset,expected]of [[0,60],[90,30],[180,0],[270,30],[360,60]]){
  const r=strength({body,siderealLongitude:exaltation+offset,modelId:m.id});assert.equal(r.virupas,expected);assert.equal(r.rupas,expected/60);assert.equal(r.fullShadbala.status,'unavailable');
 }
 assert.throws(()=>strength({body:'Rahu',siderealLongitude:10,modelId:m.id}),e=>e.code==='MODEL_UNAVAILABLE');
});
test('P16 exact birth bridge produces independent candidate divisions and conditional Uccha ranges',async()=>{
 const {advancedForBirth}=await import('../packages/vedic/birth-advanced.mjs');const r=advancedForBirth(birth,context);assert.ok(Object.values(r.charts).every(c=>c.status==='available'));assert.equal(r.ashtakavarga.value.total,337);assert.equal(r.uccha.values.length,7);assert.equal(r.shadbala.status,'unavailable');
 for(const value of r.uccha.values){assert.ok(value.virupaRange[0]<=value.virupas&&value.virupaRange[1]>=value.virupas);assert.ok(value.virupaRange[0]>=0&&value.virupaRange[1]<=60);}
 for(const c of Object.values(r.charts)){assert.equal(c.value.planets.length,9);assert.equal(c.value.houses.flatMap(h=>h.bodies).length,9);}
});
test('P16 one unstable division does not discard other divisions, raw AV or continuous strength',async()=>{
 const {advancedForBirth}=await import('../packages/vedic/birth-advanced.mjs');const r=advancedForBirth({...birth,localTime:'12:00'},context);assert.equal(r.charts.D7.status,'unavailable');assert.equal(r.charts.D10.status,'available');assert.equal(r.charts.D12.status,'available');assert.equal(r.ashtakavarga.status,'available');assert.equal(r.uccha.status,'available');
});
test('P16 birth admission rejects uncertainty, future interval tails, purpose overrides and invalid model/input',async()=>{
 const {advancedForBirth}=await import('../packages/vedic/birth-advanced.mjs'),{rawAshtakavarga}=await import('../packages/vedic/ashtakavarga.mjs'),{advancedDivisionForLongitude,advancedChartFromD1}=await import('../packages/vedic/advanced-vargas.mjs');
 for(const patch of [{timeAccuracy:'unknown',localTime:undefined},{timeAccuracy:'approximate',precisionOfBirthTimeMinutes:10},{purpose:'exploration'},{localDate:'2030-01-01'},{elevationMetres:undefined}])assert.throws(()=>advancedForBirth({...birth,...patch},context));
 assert.throws(()=>advancedForBirth(birth,{now:Date.parse('2000-01-01T06:45:30Z')}),e=>e.code==='OUT_OF_RANGE');
 assert.throws(()=>advancedDivisionForLongitude({chartType:'D60',siderealLongitude:12}),e=>e.code==='MODEL_UNAVAILABLE');
 assert.throws(()=>advancedDivisionForLongitude({chartType:'D7',siderealLongitude:NaN}),e=>e.code==='INVALID_INPUT');
 assert.throws(()=>advancedChartFromD1({chartType:'D7',d1:{get chartType(){throw Error('private');}}}),e=>e.code==='INVALID_INPUT');
 assert.throws(()=>rawAshtakavarga({modelId:'pvr-raw-seven-bav-eight-contributors-v1',signs:{...fixture.ashtakavarga.signs,Rahu:1}}),e=>e.code==='INVALID_INPUT');
 assert.throws(()=>rawAshtakavarga({modelId:'pvr-raw-seven-bav-eight-contributors-v1',signs:{...fixture.ashtakavarga.signs,Lagna:0}}),e=>e.code==='INVALID_INPUT');
});
