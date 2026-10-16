const key=name=>name.normalize('NFKC').toLocaleLowerCase('en-IN');
export function swapMembers(result,first,second,rules={}){
 const next=structuredClone(result),positions=new Map();next.teams.forEach((team,t)=>team.members.forEach((name,i)=>positions.set(key(name),[t,i])));
 const a=positions.get(key(first)),b=positions.get(key(second));if(!a||!b)throw Error('Choose two people from the current teams.');if(a[0]===b[0])throw Error('Choose people from different teams.');
 [next.teams[a[0]].members[a[1]],next.teams[b[0]].members[b[1]]]=[second,first];
 const teams=new Map();next.teams.forEach((team,t)=>team.members.forEach(name=>teams.set(key(name),t)));
 for(const type of ['together','apart'])for(const row of (rules[type]||'').split(/\r?\n/).filter(row=>row.trim())){const values=row.split('|').map(name=>teams.get(key(name.trim())));if(values.some(value=>value===undefined))throw Error('Mix again to apply the current rules.');const count=new Set(values).size;if(type==='together'?count!==1:count!==values.length)throw Error('That swap would break a keep-'+type+' rule. Choose another pair.');}
 return next;
}
