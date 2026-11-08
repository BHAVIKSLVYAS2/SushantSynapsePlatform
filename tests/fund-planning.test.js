const {test}=require('node:test');
const assert=require('node:assert/strict');
const engine=require('../apps/fund-overlap/frontend/planning-engine');
const retirement={currentAge:30,retirementAge:60,planUntil:85,expense:40000,savings:500000,inflation:6,beforeReturn:10,afterReturn:7};
test('retirement corpus funds inflation-linked monthly withdrawals',()=>{
 const r=engine.retirement(retirement);let balance=r.corpus,expense=r.monthlyExpense;
 const monthlyReturn=engine.monthly(.07),monthlyInflation=engine.monthly(.06);
 for(let m=0;m<300;m++){balance=(balance-expense)*(1+monthlyReturn);expense*=1+monthlyInflation;}
 assert.ok(Math.abs(balance)<.01);
 let saved=500000;for(let m=0;m<360;m++)saved=(saved+r.monthlySaving)*(1+engine.monthly(.10));
 assert.ok(Math.abs(saved-r.corpus)<.01);
});
test('zero rates, immediate retirement and fully funded target',()=>{
 const raw={...retirement,currentAge:60,inflation:0,beforeReturn:0,afterReturn:0,savings:0};
 const r=engine.retirement(raw);assert.equal(r.corpus,40000*300);assert.equal(r.monthlySaving,null);
 assert.equal(engine.retirement({...raw,savings:r.corpus}).monthlySaving,0);
 assert.equal(engine.goal({cost:120000,years:1,savings:0,returnRate:0,inflation:0}).monthlySaving,10000);
});
test('SIP annual step-up and inflation buying power',()=>{
 const r=engine.sip({contribution:1000,years:2,returnRate:0,inflation:10,stepUp:10});
 assert.equal(r.invested,25200);assert.equal(r.value,25200);assert.ok(Math.abs(r.todayValue-25200/1.21)<.0001);assert.equal(r.rows.length,2);
 const loss=engine.sip({contribution:1000,years:1,returnRate:-20,inflation:0});assert.ok(loss.growth<0);
});
test('reject invalid, empty, fractional ages and extreme inputs',()=>{
 for(const change of [{currentAge:''},{currentAge:30.5},{retirementAge:29},{planUntil:60},{expense:0},{inflation:21},{beforeReturn:'NaN'},{savings:-1}])assert.throws(()=>engine.retirement({...retirement,...change}));
 assert.throws(()=>engine.sip({contribution:1e10,years:60,returnRate:40,inflation:0,stepUp:30}));
});
