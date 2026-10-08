const {test,expect}=require('@playwright/test');
const {spawn}=require('node:child_process'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
let child,base,dir;
test.beforeAll(async()=>{dir=fs.mkdtempSync(path.join(os.tmpdir(),'synapse-spark-'));child=spawn(process.execPath,['server/index.js'],{env:{...process.env,PORT:'0',DATA_DIR:dir},stdio:['ignore','pipe','pipe']});await new Promise((resolve,reject)=>{let out='';const timer=setTimeout(()=>reject(Error('Startup timed out')),15000);child.stdout.on('data',chunk=>{out+=chunk;const match=out.match(/localhost:(\d+)/);if(match){base='http://127.0.0.1:'+match[1];clearTimeout(timer);resolve();}});child.once('error',reject);});});
test.afterAll(async()=>{if(child?.exitCode===null)await new Promise(resolve=>{child.once('exit',resolve);child.kill();});if(dir)fs.rmSync(dir,{recursive:true,force:true});});
test('anonymous daily solve, undo, honest sharing and no API traffic',async({page})=>{
 const requests=[],errors=[];page.on('request',r=>requests.push(r.url()));page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{Object.defineProperty(navigator,'share',{value:undefined});Object.defineProperty(navigator,'clipboard',{value:undefined});});
 await page.goto(base+'/daily-spark?day=2026-10-08');await expect(page.locator('#numbers button')).toHaveCount(4);await expect(page.locator('#edition')).toContainText('2026-10-08');
 const original=await page.locator('#numbers button').allTextContents();
 await page.locator('#numbers button').nth(0).click();await page.locator('#numbers button').nth(1).click();await page.getByRole('button',{name:'Add',exact:true}).click();await page.locator('#combine').click();await expect(page.locator('#numbers button')).toHaveCount(3);await page.locator('#undo').click();expect(await page.locator('#numbers button').allTextContents()).toEqual(original);
 const {solve,tokens,display,calculate}=await import('../frontend/engine.mjs');
 const expression=solve(tokens(original.map(Number))),parts=expression.match(/\d+|[()+*/-]/g);let cursor=0;
 async function run(){const token=parts[cursor++];if(token!=='(')return Number(token);const a=await run(),op=parts[cursor++],b=await run();cursor++;
 const tiles=await page.locator('#numbers button').allTextContents();const i=tiles.indexOf(display(a)),j=tiles.findIndex((v,k)=>k!==i&&v===display(b));expect(i).toBeGreaterThanOrEqual(0);expect(j).toBeGreaterThanOrEqual(0);await page.locator('#numbers button').nth(i).click();await page.locator('#numbers button').nth(j).click();await page.locator('[data-op="'+op+'"]').click();await page.locator('#combine').click();return calculate(a,op,b);}
 await run();await expect(page.locator('#result-title')).toContainText('You made it');await expect(page.locator('#result-copy')).toContainText('without hints');await page.locator('#share').click();await expect(page.locator('#share-text')).toHaveValue(/day=2026-10-08/);expect(await page.locator('#share-text').inputValue()).not.toContain(expression);
 await page.reload();expect(await page.locator('#numbers button').allTextContents()).toEqual(original);await expect(page.locator('#result')).toBeHidden();expect(requests.filter(url=>url.includes('/api/'))).toEqual([]);expect(errors).toEqual([]);
});
test('hints, reveal, practice, theme and phone layouts',async({page})=>{
 await page.goto(base+'/');await expect(page.getByRole('link',{name:'Daily Spark',exact:true})).toBeVisible();await page.getByRole('link',{name:'Daily Spark',exact:true}).click();
 await page.locator('#hint').click();await expect(page.locator('#status')).toContainText('Try combining');await page.locator('#reveal').click();await expect(page.locator('#result-copy')).toContainText('= 24');await expect(page.locator('#combine')).toBeDisabled();await page.locator('#practice').click();await expect(page.locator('#edition')).toContainText('PRACTICE');await page.locator('#daily').click();await expect(page.locator('#edition')).toContainText('DAILY');
 await page.emulateMedia({colorScheme:'dark'});await expect(page.locator('html')).toHaveAttribute('data-theme','dark');await page.locator('#theme').click();await expect(page.locator('html')).toHaveAttribute('data-theme','light');
 for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await page.screenshot({path:'test-results/daily-spark-desktop.png',fullPage:true});await page.setViewportSize({width:390,height:844});await page.locator('#theme').click();await page.screenshot({path:'test-results/daily-spark-mobile.png',fullPage:true});
});
