export function parseOptions(text){
 if(typeof text!=='string'||text.length>4096)throw Error('Keep the list under 4,096 characters.');
 const options=text.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
 if(options.length<2||options.length>30)throw Error('Enter between 2 and 30 options, one per line.');
 if(options.some(s=>[...s].length>60))throw Error('Keep each option to 60 characters or fewer.');
 const unique=new Set(options.map(s=>s.normalize('NFKC').toLocaleLowerCase('en-IN')));
 if(unique.size!==options.length)throw Error('Each option must be unique so every choice gets one equal slice.');
 return options;
}
// Rejection sampling avoids modulo bias; each listed option has the same chance.
export function chooseIndex(count,read=()=>crypto.getRandomValues(new Uint32Array(1))[0]){
 if(!Number.isInteger(count)||count<2||count>30)throw Error('Invalid option count.');
 const limit=4294967296-(4294967296%count);
 for(let i=0;i<128;i++){const value=read();if(!Number.isInteger(value)||value<0||value>4294967295)throw Error('Invalid random value.');if(value<limit)return value%count;}
 throw Error('Random selection failed. Please try again.');
}
export function landingRotation(previous,index,count){
 if(!Number.isFinite(previous)||!Number.isInteger(count)||count<2||count>30||!Number.isInteger(index)||index<0||index>=count)throw Error('Invalid wheel position.');
 const current=((previous%360)+360)%360,target=(360-(index+.5)*360/count)%360;
 return previous+1800+((target-current+360)%360);
}
export const presets={lunch:['Dosa','Poha','Rajma rice','Sandwich','Idli','Pav bhaji'],tasks:['Wash the dishes','Water the plants','Take out the rubbish','Set the table'],team:['Team A','Team B','Team C','Team D']};
