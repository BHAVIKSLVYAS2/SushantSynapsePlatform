export function paise(raw){const value=String(raw).trim();if(!/^(0|[1-9]\d{0,6})(\.\d{1,2})?$/.test(value))throw Error('Enter an amount up to ₹99,99,999.99 with at most two decimals.');const [whole,fraction='']=value.split('.');return Number(whole)*100+Number(fraction.padEnd(2,'0'));}
export const money=n=>'₹'+(n/100).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});
function peopleFrom(rows,mode){
 if(!Array.isArray(rows)||rows.length<2||rows.length>20||!['equal','custom','percentage','shares'].includes(mode))throw Error('Add 2–20 people and choose a split method.');
 const ids=new Set();return rows.map(r=>{const name=String(r.name||'').trim();if(!name||[...name].length>50||ids.has(name.normalize('NFKC').toLocaleLowerCase()))throw Error('Use distinct names, up to 50 characters each.');ids.add(name.normalize('NFKC').toLocaleLowerCase());return {name,paid:0,share:0,value:r.share};});
}
function allocate(total,weights){
 const sum=weights.reduce((s,n)=>s+BigInt(n),0n);if(sum===0n)throw Error('Enter at least one positive share.');
 const rows=weights.map((n,i)=>{const product=BigInt(total)*BigInt(n);return {i,amount:Number(product/sum),remainder:product%sum};});
 let left=total-rows.reduce((s,r)=>s+r.amount,0);for(const row of [...rows].sort((a,b)=>a.remainder===b.remainder?a.i-b.i:a.remainder>b.remainder?-1:1)){if(!left)break;row.amount++;left--;}
 return rows.map(r=>r.amount);
}
function settle(people,mode){
 const total=people.reduce((s,p)=>s+p.paid,0);if(!total)throw Error('Enter at least one payment.');
 let amounts;
 if(mode==='custom'){amounts=people.map(p=>paise(p.value));if(amounts.reduce((a,b)=>a+b,0)!==total)throw Error('Individual shares must add up exactly to the total paid.');}
 else {const weights=mode==='equal'?people.map(()=>1):people.map(p=>{let value;try{value=paise(p.value);}catch{throw Error(mode==='percentage'?'Enter a percentage from 0 to 100, with up to two decimals.':'Enter non-negative shares with up to two decimals.');}if(mode==='percentage'&&value>10000)throw Error('Each percentage must be between 0 and 100.');return value;});if(mode==='percentage'&&weights.reduce((a,b)=>a+b,0)!==10000)throw Error('Percentages must add up exactly to 100%.');amounts=allocate(total,weights);}
 people.forEach((p,i)=>{p.share=amounts[i];delete p.value;});
 const creditors=[],debtors=[];for(const p of people){const balance=p.paid-p.share;if(balance>0)creditors.push({name:p.name,left:balance});if(balance<0)debtors.push({name:p.name,left:-balance});}
 const transfers=[];let i=0,j=0;while(i<debtors.length&&j<creditors.length){const amount=Math.min(debtors[i].left,creditors[j].left);transfers.push({from:debtors[i].name,to:creditors[j].name,amount});debtors[i].left-=amount;creditors[j].left-=amount;if(!debtors[i].left)i++;if(!creditors[j].left)j++;}
 return {total,people,transfers};
}
export function split(rows,mode='equal'){const people=peopleFrom(rows,mode);people.forEach((p,i)=>p.paid=paise(rows[i].paid));return settle(people,mode);}
export function splitExpenses(rows,expenses,mode='equal'){
 const people=peopleFrom(rows,mode);
 if(!Array.isArray(expenses)||expenses.length<1||expenses.length>100)throw Error('Add 1–100 expenses.');
 const clean=expenses.map((e,i)=>{if(!e||!Number.isInteger(e.payer)||e.payer<0||e.payer>=people.length)throw Error('Choose a person who paid each expense.');const title=String(e.title||'').trim()||'Expense '+(i+1);if([...title].length>80)throw Error('Keep expense names under 80 characters.');const amount=paise(e.amount);if(!amount)throw Error('Each expense must be greater than zero.');people[e.payer].paid+=amount;return {title,payer:people[e.payer].name,amount};});
 return {...settle(people,mode),expenses:clean};
}
