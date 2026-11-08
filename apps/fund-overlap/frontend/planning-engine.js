(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.FundPlanningEngine=factory();})(globalThis,function(){
 'use strict';
 const error=code=>{throw Error(code);};
 function number(value,min,max){if(typeof value!=='number'&&typeof value!=='string')error('invalid');if(!/^-?\d+(?:\.\d+)?$/.test(String(value).trim()))error('invalid');const n=Number(value);if(!Number.isFinite(n)||n<min||n>max)error('range');return n;}
 const amount=v=>number(v,0,1e10),annual=v=>number(v,-50,40)/100,inflation=v=>number(v,0,20)/100;
 const integer=(v,min,max)=>{const n=number(v,min,max);if(!Number.isInteger(n))error('wholeYears');return n;};
 const finite=n=>{if(!Number.isFinite(n)||Math.abs(n)>1e15)error('tooLarge');return n;};
 const monthly=annualRate=>Math.expm1(Math.log1p(annualRate)/12);
 // Sum 1 + ratio + ... without subtractive cancellation at equal return/inflation.
 function geometric(ratio,count){if(count===0)return 0;const log=Math.log(ratio);return Math.abs(log)<1e-12?count:Math.expm1(count*log)/Math.expm1(log);}
 const futureFactor=(rate,months)=>geometric(1+rate,months)*(1+rate);
 function required(target,savings,rate,months){const futureSavings=finite(savings*Math.pow(1+rate,months)),shortfall=Math.max(0,target-futureSavings);return {futureSavings,shortfall,monthlySaving:shortfall===0?0:months?finite(shortfall/futureFactor(rate,months)):null};}
 function retirement(raw){
  const currentAge=integer(raw.currentAge,18,95),retirementAge=integer(raw.retirementAge,currentAge,95),planUntil=integer(raw.planUntil,retirementAge+1,110),expense=amount(raw.expense),savings=amount(raw.savings),before=annual(raw.beforeReturn),after=annual(raw.afterReturn),rise=inflation(raw.inflation);
  if(!expense)error('positiveExpense');const savingMonths=(retirementAge-currentAge)*12,retirementMonths=(planUntil-retirementAge)*12;
  const monthlyExpense=finite(expense*Math.pow(1+rise,savingMonths/12)),ratio=Math.pow((1+rise)/(1+after),1/12),corpus=finite(monthlyExpense*geometric(ratio,retirementMonths));
  return {kind:'retirement',currentAge,retirementAge,planUntil,savingMonths,retirementMonths,expense,monthlyExpense,corpus,...required(corpus,savings,monthly(before),savingMonths),inflation:rise,beforeReturn:before,afterReturn:after};
 }
 function sip(raw){
  const contribution=amount(raw.contribution),years=integer(raw.years,1,60),rate=annual(raw.returnRate),rise=inflation(raw.inflation),step=number(raw.stepUp??0,0,30)/100;
  if(!contribution)error('positiveContribution');const r=monthly(rate);let value=0,invested=0;const rows=[];
  for(let month=0;month<years*12;month++){const instalment=finite(contribution*Math.pow(1+step,Math.floor(month/12)));invested=finite(invested+instalment);value=finite((value+instalment)*(1+r));if((month+1)%12===0)rows.push({year:(month+1)/12,invested,value,todayValue:finite(value/Math.pow(1+rise,(month+1)/12))});}
  return {kind:'sip',contribution,years,returnRate:rate,inflation:rise,stepUp:step,invested,value,growth:value-invested,todayValue:finite(value/Math.pow(1+rise,years)),rows};
 }
 function goal(raw){const cost=amount(raw.cost),years=integer(raw.years,1,60),savings=amount(raw.savings),rate=annual(raw.returnRate),rise=inflation(raw.inflation);if(!cost)error('positiveCost');const target=finite(cost*Math.pow(1+rise,years));return {kind:'goal',cost,years,savings,returnRate:rate,inflation:rise,target,...required(target,savings,monthly(rate),years*12)};}
 function retirementSensitivity(raw){const base=number(raw.inflation,0,20);return [...new Set([Math.max(0,base-2),base,Math.min(20,base+2)])].map(inflation=>({inflation,...retirement({...raw,inflation})}));}
 function goalSensitivity(raw){const base=number(raw.returnRate,-50,40);return [...new Set([Math.max(-50,base-2),base,Math.min(40,base+2)])].map(returnRate=>({returnRate,...goal({...raw,returnRate})}));}
 return {retirement,sip,goal,monthly,geometric,retirementSensitivity,goalSensitivity};
});
