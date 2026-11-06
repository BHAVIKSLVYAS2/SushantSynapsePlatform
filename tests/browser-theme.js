const {expect}=require('@playwright/test');
async function setTheme(page,value){
 const button=page.locator('[data-theme-toggle]:visible');
 await expect(button).toBeVisible();
 await button.click();
 await page.locator('#synapse-theme-picker [data-theme-choice='+value+']').click();
 await expect(page.locator('#synapse-theme-picker')).not.toBeVisible();
 await expect.poll(()=>page.evaluate(()=>window.SynapseTheme.preference())).toBe(value);
}
async function toggleTheme(page){const current=await page.evaluate(()=>document.documentElement.dataset.theme);await setTheme(page,current==='dark'?'light':'dark');}
module.exports={setTheme,toggleTheme};
