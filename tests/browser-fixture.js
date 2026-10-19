const base=require('@playwright/test');
const {key,version}=require('../packages/ui/beta-html.cjs');
// Existing workflow suites exercise a returning visitor. First-visit notice
// tests import Playwright directly and exercise the acknowledgement themselves.
async function acknowledgeBeta(context){
 await context.addInitScript(({key,version})=>{
  for(const name of ['localStorage','sessionStorage'])try{window[name].setItem(key,version);}catch{}
  // Storage-denial workflows cannot retain a preference; acknowledge via the
  // real controls in their test setup rather than adding a runtime bypass.
  document.addEventListener('DOMContentLoaded',()=>{
   const dialog=document.getElementById('synapse-beta-dialog');if(!dialog?.open)return;
   const input=dialog.querySelector('input');input.checked=true;input.dispatchEvent(new Event('change',{bubbles:true}));dialog.querySelector('form').requestSubmit();
  },{once:true});
 },{key,version});
}
async function acknowledgedContext(browser,options){
 const context=await browser.newContext(options);await acknowledgeBeta(context);return context;
}
const test=base.test.extend({context:async({context},use)=>{await acknowledgeBeta(context);await use(context);}});
module.exports={...base,test,acknowledgeBeta,acknowledgedContext};
