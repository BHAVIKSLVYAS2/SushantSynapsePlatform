const {expect}=require('@playwright/test');
async function setTheme(page,value){
 const button=page.getByRole('button',{name:'Dark mode',exact:true});
 await expect(button).toBeVisible();
 if(value==='system'){
  // Exercise an existing system preference; the visible control is now binary.
  await button.evaluate(el=>{window.SynapseTheme.write('system');el.value='system';el.dispatchEvent(new Event('change',{bubbles:true}));});
 }else{
  if(await button.getAttribute('aria-pressed')!==String(value==='dark'))await button.click();
  await expect(button).toHaveAttribute('aria-pressed',String(value==='dark'));
 }
}
module.exports={setTheme};
