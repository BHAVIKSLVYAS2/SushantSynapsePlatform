const {test}=require('node:test'),assert=require('node:assert/strict');
const at='2024-01-01T00:00:00.000Z',profile='IN_LAHIRI_DEFAULT_V1',offsets=[-3600,-1800,-30,0,30,1800,3600],bodies=['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn'];
function fixture(overrides={}){const origins={Sun:0,Moon:80,Mercury:13,Venus:9,Mars:120,Jupiter:210,Saturn:300};return {at,profile,samples:offsets.map(seconds=>({at:new Date(Date.parse(at)+seconds*1000).toISOString(),positions:bodies.map(body=>{const spec=overrides[body]||{},lon=((spec.origin??origins[body])+(spec.rate??(body==='Sun'?1:0.5))*seconds/86400+(spec.curve??0)*(seconds/3600)**2+720)%360;return {body,tropicalLongitude:lon,siderealLongitude:(lon-24+360)%360};})}))};}
test('direct/retrograde Mercury and Venus use different source thresholds; stations stay unresolved',async()=>{
 const {evaluatePlanetConditions}=await import('../packages/vedic/planet-condition.mjs');
 for(const body of ['Mercury','Venus']){const direct=evaluatePlanetConditions(fixture()).rows.find(p=>p.body===body),retro=evaluatePlanetConditions(fixture({[body]:{rate:-0.5}})).rows.find(p=>p.body===body);assert.equal(direct.motion.status,'direct');assert.equal(direct.combustion.status,'combust');assert.equal(retro.motion.status,'retrograde');assert.equal(retro.combustion.status,'clear');const station=evaluatePlanetConditions(fixture({[body]:{rate:0,curve:0.01}})).rows.find(p=>p.body===body);assert.equal(station.motion.status,'near-station');assert.equal(station.combustion.status,'uncertain');assert.equal(station.combustion.thresholds.length,2);}
});
test('all six combustion boundaries use conservative separation ranges, including across 360 degrees',async()=>{
 const {evaluatePlanetConditions}=await import('../packages/vedic/planet-condition.mjs');
 for(const [body,limit]of [['Moon',12],['Mars',17],['Mercury',14],['Jupiter',11],['Venus',10],['Saturn',15]])for(const [delta,status]of [[-0.2,'combust'],[0,'uncertain'],[0.2,'clear']]){const row=evaluatePlanetConditions(fixture({Sun:{origin:359,rate:1},[body]:{origin:(359+limit+delta)%360,rate:1}})).rows.find(p=>p.body===body);assert.equal(row.combustion.status,status,body+' '+delta);assert(Math.abs(row.combustion.separationDegrees-(limit+delta))<1e-8);}
 const row=evaluatePlanetConditions(fixture({Mercury:{origin:359.999,rate:1}})).rows.find(p=>p.body==='Mercury');assert.equal(row.motion.status,'direct');assert.equal(row.combustion.status,'combust');
});
test('source observations cannot omit/duplicate bodies, change sample times or use invalid angles',async()=>{
 const {evaluatePlanetConditions}=await import('../packages/vedic/planet-condition.mjs');for(const mutate of [f=>f.samples.pop(),f=>f.samples[0].at=at,f=>f.samples[0].positions[0].body='Mercury',f=>f.samples[3].positions[1].siderealLongitude=360,f=>f.samples[3].positions[1].tropicalLongitude=NaN]){const f=fixture();mutate(f);assert.throws(()=>evaluatePlanetConditions(f));}
});
test('real ephemeris anchors: solar transit and both sides of a Mercury station; coverage is bounded',async()=>{
 const {planetConditionsAtInstant}=await import('../packages/vedic/planet-condition.mjs');
 // NASA catalog: Mercury transit 2019-11-11, greatest transit 15:20 UT.
 // https://eclipse.gsfc.nasa.gov/transit/catalog/MercuryCatalog.html
 const read=date=>planetConditionsAtInstant({utcInstant:date,calculationProfileId:profile}).rows.find(p=>p.body==='Mercury');const transit=read('2019-11-11T15:20:00Z');assert.equal(transit.motion.status,'retrograde');assert.equal(transit.combustion.status,'combust');assert(transit.combustion.separationDegrees<0.01);
 assert.equal(read('2024-08-04T12:00:00Z').motion.status,'direct');assert.equal(read('2024-08-05T04:56:00Z').motion.status,'near-station');assert.equal(read('2024-08-06T12:00:00Z').motion.status,'retrograde');
 assert.throws(()=>read('1940-01-01T00:00:00Z'));assert.throws(()=>planetConditionsAtInstant({utcInstant:at,calculationProfileId:'missing'}));
});
