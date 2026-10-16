export function paise(raw){const value=String(raw).trim();if(!/^(0|[1-9]\d{0,6})(\.\d{1,2})?$/.test(value))throw Error('Enter an amount up to ₹99,99,999.99 with at most two decimals.');const [whole,fraction='']=value.split('.');return Number(whole)*100+Number(fraction.padEnd(2,'0'));}
export const money=n=>'₹'+(n/100).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});
export function split(rows,mode='equal'){
 if(!Array.isArray(rows)||rows.length<2||rows.length>20||!['equal','custom'].includes(mode))throw Error('Add 2–20 people and choose a split method.');
 const ids=new Set(),people=rows.map(r=>{const name=String(r.name||'').trim();if(!name||[...name].length>50||ids.has(name.toLocaleLowerCase()))throw Error('Use distinct names, up to 50 characters each.');ids.add(name.toLocaleLowerCase());return {name,paid:paise(r.paid),share:mode==='custom'?paise(r.share):0};});
 const total=people.reduce((s,p)=>s+p.paid,0);if(!total)throw Error('Enter at least one payment.');
 if(mode==='equal'){const base=Math.floor(total/people.length),remainder=total%people.length;people.forEach((p,i)=>p.share=base+(i<remainder?1:0));}
 else if(people.reduce((s,p)=>s+p.share,0)!==total)throw Error('Individual shares must add up exactly to the total paid.');
 const creditors=[],debtors=[];for(const p of people){const balance=p.paid-p.share;if(balance>0)creditors.push({name:p.name,left:balance});if(balance<0)debtors.push({name:p.name,left:-balance});}
 const transfers=[];let i=0,j=0;while(i<debtors.length&&j<creditors.length){const amount=Math.min(debtors[i].left,creditors[j].left);transfers.push({from:debtors[i].name,to:creditors[j].name,amount});debtors[i].left-=amount;creditors[j].left-=amount;if(!debtors[i].left)i++;if(!creditors[j].left)j++;}
 return {total,people,transfers};
}
