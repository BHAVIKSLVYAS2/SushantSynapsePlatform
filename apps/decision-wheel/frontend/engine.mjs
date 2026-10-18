function invalidOptions(message){const error=Error(message);error.name='OptionsValidationError';throw error;}
export function parseOptions(text){
 if(typeof text!=='string'||text.length>4096)invalidOptions('Keep the list to 4,096 characters or fewer.');
 const entries=text.split(/\r\n?|\n/).map((value,index)=>({value:value.trim(),line:index+1})).filter(entry=>entry.value);
 if(entries.length<2||entries.length>30)invalidOptions(`You entered ${entries.length} ${entries.length===1?'option':'options'}. Enter between 2 and 30 options, one per line. Blank lines are ignored.`);
 const long=entries.find(entry=>[...entry.value].length>60);
 if(long)invalidOptions(`Line ${long.line} has ${[...long.value].length} characters. Keep each option to 60 characters or fewer.`);
 const groups=new Map();for(const entry of entries){const key=entry.value.normalize('NFKC').toLocaleLowerCase('en-IN');if(!groups.has(key))groups.set(key,[]);groups.get(key).push(entry);}
 const duplicates=[...groups.values()].filter(group=>group.length>1);
 if(duplicates.length){const details=duplicates.slice(0,4).map(group=>`"${group[0].value}" on lines ${group.map(entry=>entry.line).join(', ')}`).join('; ');invalidOptions(`Repeated ${duplicates.length===1?'option':'options'}: ${details}.${duplicates.length>4?` Plus ${duplicates.length-4} other repeated options.`:''} Remove or rename repeats. Each unique option gets one equal slice.`);}
 return entries.map(entry=>entry.value);
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
