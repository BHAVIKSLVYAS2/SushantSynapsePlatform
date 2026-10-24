'use strict';
// Independent integer/rational reference generation from the frozen P01 rule.
// Never imports the implementation under test or regenerates astronomical goldens.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const names=['Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury'];
const weights=[7n,20n,6n,10n,7n,18n,16n,19n,17n],year=31557600000n;
const birth=BigInt(Date.parse('2000-01-01T00:00:00Z'));
const cases=[];
for(let i=0;i<9;i++){
 const duration=weights[i]*year,origin=birth-duration/2n;
 let cumulative=0n;
 const children=[];
 for(let j=0;j<9;j++){
  const k=(i+j)%9,start=origin+duration*cumulative/120n;
  cumulative+=weights[k];const end=origin+duration*cumulative/120n;
  assert.equal(duration*cumulative%120n,0n);
  children.push({lord:names[k],startMilliseconds:Number(start),endMilliseconds:Number(end),durationMilliseconds:Number(end-start)});
 }
 cases.push({nakshatra:i+1,moonLongitudeRational:{numerator:(2*i+1)*20,denominator:3},
  lord:names[i],remainingYearsRational:{numerator:Number(weights[i]),denominator:2},
  startMilliseconds:Number(origin),endMilliseconds:Number(origin+duration),antardashas:children});
}
const fixture={version:'p08-independent-rational-fixtures-1',source:'P01 frozen Vimshottari lord weights/year convention',
 reviewStatus:'independent arithmetic method, agent-authored design data; original/human reference acceptance pending',
 method:'BigInt rational offsets at Nakshatra midpoints; no runtime import, floating-point date arithmetic or Gregorian year addition.',
 yearMilliseconds:Number(year),birthUtcInstant:'2000-01-01T00:00:00Z',cases};
const target=path.resolve(__dirname,'../tests/fixtures/vedic-dasha/rational.json'),output=JSON.stringify(fixture,null,2)+'\n';
if(process.argv.includes('--check'))assert.equal(fs.readFileSync(target,'utf8'),output);
else{fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,output);}
console.log(JSON.stringify({midpointCases:cases.length,antardashas:cases.length*9,arithmetic:'independent-BigInt-rational'}));
