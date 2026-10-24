const codes=Object.freeze({Sun:'Su',Moon:'Mo',Mercury:'Me',Venus:'Ve',Mars:'Ma',Jupiter:'Ju',Saturn:'Sa',Rahu:'Ra',Ketu:'Ke'});
export const signNames=Object.freeze(['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces']);
const valid=n=>Number.isInteger(n)&&n>=1&&n<=12;
const invalid=()=>{throw new TypeError('A consistent supported numeric chart is required.');};
export function chartViewModel(chart){
 if(!chart||!['D1','D7','D9','D10','D12'].includes(chart.chartType)||chart.houseSystem!=='whole-sign'||!valid(chart.ascendant?.rashi)
  ||!Array.isArray(chart.houses)||chart.houses.length!==12||!Array.isArray(chart.planets)||chart.planets.length!==9)invalid();
 const seen=new Set();
 const ascendantSourceLongitude=chart.chartType==='D1'?chart.ascendant.siderealLongitude:chart.ascendant.sourceSiderealLongitude;
 if(typeof ascendantSourceLongitude!=='number'||!Number.isFinite(ascendantSourceLongitude)||ascendantSourceLongitude<0||ascendantSourceLongitude>=360)invalid();
 const planets=chart.planets.map(p=>{
  if(!p||!Object.hasOwn(codes,p.body)||seen.has(p.body)||!valid(p.rashi)||!valid(p.houseNumber))invalid();seen.add(p.body);
  const sourceLongitude=chart.chartType==='D1'?p.siderealLongitude:p.sourceSiderealLongitude;
  if(typeof sourceLongitude!=='number'||!Number.isFinite(sourceLongitude)||sourceLongitude<0||sourceLongitude>=360)invalid();
  return Object.freeze({body:p.body,code:codes[p.body],rashi:p.rashi,sign:signNames[p.rashi-1],houseNumber:p.houseNumber,sourceLongitude});
 });
 const houses=chart.houses.map((h,i)=>{
  if(!h||h.houseNumber!==i+1||h.rashi!==(chart.ascendant.rashi-1+i)%12+1||!Array.isArray(h.bodies))invalid();
  const occupants=planets.filter(p=>p.houseNumber===h.houseNumber);
  if(occupants.some(p=>p.rashi!==h.rashi)||h.bodies.length!==occupants.length||new Set(h.bodies).size!==h.bodies.length
   ||h.bodies.some(b=>!occupants.some(p=>p.body===b)))invalid();
  return Object.freeze({houseNumber:h.houseNumber,rashi:h.rashi,sign:signNames[h.rashi-1],isAscendant:i===0,planets:Object.freeze(occupants)});
 });
 return Object.freeze({chartType:chart.chartType,ascendantRashi:chart.ascendant.rashi,ascendantSourceLongitude,houses:Object.freeze(houses),planets:Object.freeze(planets)});
}
// Fixed houses, counterclockwise from the top diamond.
export const northCells=Object.freeze([
 ['200,0 300,100 200,200 100,100',200,74],['0,0 200,0 100,100',100,24],
 ['0,0 100,100 0,200',35,84],['0,200 100,100 200,200 100,300',100,174],
 ['0,200 100,300 0,400',35,294],['0,400 100,300 200,400',100,365],
 ['200,200 300,300 200,400 100,300',200,274],['200,400 300,300 400,400',300,365],
 ['400,200 400,400 300,300',365,294],['200,200 300,100 400,200 300,300',300,174],
 ['300,100 400,0 400,200',365,84],['200,0 400,0 300,100',300,24]
].map(Object.freeze));
// Fixed signs: Aries top second; clockwise, Pisces top left.
export const southCells=Object.freeze([[1,0],[2,0],[3,0],[3,1],[3,2],[3,3],[2,3],[1,3],[0,3],[0,2],[0,1],[0,0]].map(Object.freeze));
