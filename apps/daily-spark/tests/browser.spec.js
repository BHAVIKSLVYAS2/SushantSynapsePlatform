const {test,expect}=require('../../../tests/browser-fixture.js');
const {spawn}=require('node:child_process'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
let child,base,dir;
test.beforeAll(async()=>{dir=fs.mkdtempSync(path.join(os.tmpdir(),'synapse-spark-'));child=spawn(process.execPath,['server/index.js'],{env:{...process.env,PORT:'0',DATA_DIR:dir},stdio:['ignore','pipe','pipe']});await new Promise((resolve,reject)=>{let out='';const timer=setTimeout(()=>reject(Error('Startup timed out')),15000);child.stdout.on('data',chunk=>{out+=chunk;const match=out.match(/localhost:(\d+)/);if(match){base='http://127.0.0.1:'+match[1];clearTimeout(timer);resolve();}});child.once('error',reject);});});
test.afterAll(async()=>{if(child?.exitCode===null)await new Promise(resolve=>{child.once('exit',resolve);child.kill();});if(dir)fs.rmSync(dir,{recursive:true,force:true});});
test('anonymous daily solve, undo, honest sharing and no game API traffic',async({page})=>{
 const requests=[],errors=[];page.on('request',r=>requests.push(r.url()));page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{Object.defineProperty(navigator,'share',{value:undefined});Object.defineProperty(navigator,'clipboard',{value:undefined});});
 await page.goto(base+'/daily-spark?day=2026-10-08');await expect(page.locator('#numbers button')).toHaveCount(4);await expect(page.locator('#edition')).toContainText('2026-10-08');
 const original=await page.locator('#numbers button').allTextContents();
 await page.locator('#numbers button').nth(0).click();await page.locator('#numbers button').nth(1).click();await page.getByRole('button',{name:'Add',exact:true}).click();await page.locator('#combine').click();await expect(page.locator('#numbers button')).toHaveCount(3);await page.locator('#undo').click();expect(await page.locator('#numbers button').allTextContents()).toEqual(original);
 const {solve,tokens,display,calculate}=await import('../frontend/engine.mjs');
 const expression=solve(tokens(original.map(Number))),parts=expression.match(/\d+|[()+*/-]/g);let cursor=0;
 async function run(){const token=parts[cursor++];if(token!=='(')return Number(token);const a=await run(),op=parts[cursor++],b=await run();cursor++;
 const tiles=await page.locator('#numbers button').allTextContents();const i=tiles.indexOf(display(a)),j=tiles.findIndex((v,k)=>k!==i&&v===display(b));expect(i).toBeGreaterThanOrEqual(0);expect(j).toBeGreaterThanOrEqual(0);await page.locator('#numbers button').nth(i).click();await page.locator('#numbers button').nth(j).click();await page.locator('[data-op="'+op+'"]').click();await page.locator('#combine').click();return calculate(a,op,b);}
 await run();await expect(page.locator('#result-title')).toHaveText('You made 24!');await expect(page.locator('#result-copy')).toContainText('without hints');await page.locator('#share').click();await expect(page.locator('#share-text')).toHaveValue(/day=2026-10-08/);expect(await page.locator('#share-text').inputValue()).not.toContain(expression);
 await page.reload();expect(await page.locator('#numbers button').allTextContents()).toEqual(original);await expect(page.locator('#result')).toBeHidden();expect(requests.filter(url=>url.includes('/api/')&&!['/api/auth/status','/api/platform/visitors'].includes(new URL(url).pathname))).toEqual([]);expect(errors).toEqual([]);
});
test('hints, reveal, practice, theme and phone layouts',async({page})=>{
 await page.goto(base+'/');await expect(page.getByRole('link',{name:'Take a Break',exact:true})).toBeVisible();await page.goto(base+'/daily-spark');
 await page.locator('#hint').click();await expect(page.locator('#status')).toContainText('A nudge');await page.locator('#hint').click();await expect(page.locator('#status')).toContainText('Try combining');await page.locator('.spark-details').first().locator('summary').click();await page.locator('#reveal').click();await expect(page.locator('#result-copy')).toContainText('= 24');await expect(page.locator('#combine')).toBeDisabled();await page.locator('#practice').click();await expect(page.locator('#edition')).toContainText('PRACTICE');await page.locator('#daily').click();await expect(page.locator('#edition')).toContainText('DAILY');
 await page.locator('#theme').evaluate(el=>{window.SynapseTheme.write('system');el.dispatchEvent(new Event('change',{bubbles:true}));});await page.emulateMedia({colorScheme:'dark'});await expect(page.locator('html')).toHaveAttribute('data-theme','dark');await page.getByRole('button',{name:'Dark mode',exact:true}).click();await expect(page.locator('html')).toHaveAttribute('data-theme','light');
 for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await page.screenshot({path:'test-results/daily-spark-desktop.png',fullPage:true});await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'Dark mode',exact:true}).click();await page.screenshot({path:'test-results/daily-spark-mobile.png',fullPage:true});
});
test('new daily levels survive reload and sharing; hints progress and practice keeps the selected level',async({page})=>{
 await page.addInitScript(()=>{Object.defineProperty(navigator,'share',{value:undefined});Object.defineProperty(navigator,'clipboard',{value:undefined});});
 await page.goto(base+'/daily-spark');await expect(page.locator('#practice-difficulty')).toHaveValue('challenge');
 await page.getByLabel('Difficulty').selectOption('expert');await expect(page.locator('#difficulty-note')).toContainText('fractional');
 const original=await page.locator('#numbers button').allTextContents();const link=page.url();expect(link).toContain('level=expert');await page.reload();expect(await page.locator('#numbers button').allTextContents()).toEqual(original);
 await page.locator('#hint').click();await expect(page.locator('#status')).toContainText('A nudge');await page.locator('#hint').click();await expect(page.locator('#status')).toContainText('Try combining');await page.locator('#hint').click();await expect(page.locator('#status')).toContainText('First move');
 await page.locator('.spark-details').first().locator('summary').click();await page.locator('#reveal').click();await expect(page.locator('#result')).not.toHaveClass(/spark-solved/);await page.locator('#share').click();await expect(page.locator('#share-text')).toHaveValue(/level=expert/);
 await page.locator('#another').click();await expect(page.locator('#edition')).toContainText('PRACTICE');await expect(page.locator('#practice-difficulty')).toHaveValue('expert');await page.getByLabel('Difficulty').selectOption('warmup');await expect(page.locator('#difficulty-note')).toContainText('no division');await page.locator('#daily').click();await expect(page.locator('#edition')).toContainText('DAILY');await expect(page).toHaveURL(/level=warmup/);
});

async function solveBoard(page, scope = page) {
 const {solve,tokens,display,calculate}=await import('../frontend/engine.mjs');
 const original=await scope.locator('#numbers button').allTextContents();
 const parts=solve(tokens(original.map(Number))).match(/\d+|[()+*/-]/g);let cursor=0;
 async function step(){
  const token=parts[cursor++];if(token!=='(')return Number(token);
  const a=await step(),op=parts[cursor++],b=await step();cursor++;
  const tiles=await scope.locator('#numbers button').allTextContents();
  const i=tiles.indexOf(display(a)),j=tiles.findIndex((value,index)=>index!==i&&value===display(b));
  expect(i).toBeGreaterThanOrEqual(0);expect(j).toBeGreaterThanOrEqual(0);
  await scope.locator('#numbers button').nth(i).click();await scope.locator('#numbers button').nth(j).click();
  await scope.locator('[data-op="'+op+'"]').click();await scope.locator('#combine').click();
  return calculate(a,op,b);
 }
 await step();
}

test('a real win earns a visible medal, bounded party poppers and fireworks, then cleans up on reset',async({page},testInfo)=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.clock.install();await page.emulateMedia({reducedMotion:'no-preference'});
 await page.setViewportSize({width:390,height:844});await page.goto(base+'/daily-spark?day=2026-10-08');
 await expect(page.locator('.spark-party-overlay')).toHaveCount(0);
 await solveBoard(page);
 await expect(page.locator('#result-title')).toHaveText('You made 24!');
 await expect(page.locator('#result-title')).toBeFocused();
 await expect(page.locator('.spark-win-art')).toBeVisible();
 await expect(page.locator('#result-badge')).toHaveText('Daily puzzle complete');
 await expect(page.locator('#result-copy')).toContainText('without hints');
 await expect(page.locator('.spark-party-overlay')).toHaveCount(1);
 await expect(page.locator('.spark-popper')).toHaveCount(2);
 await expect(page.locator('.spark-firework-ring')).toHaveCount(3);
 expect(await page.locator('.spark-party-overlay>span').count()).toBeLessThan(120);
 expect(await page.locator('.spark-party-overlay').evaluate(element=>getComputedStyle(element).pointerEvents)).toBe('none');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:testInfo.outputPath('make-24-victory-mobile.png')});
 await page.clock.fastForward(3000);await expect(page.locator('.spark-party-overlay')).toHaveCount(0);
 await page.locator('.spark-details').first().locator('summary').click();await page.locator('#reset').click();
 await expect(page.locator('#result')).toBeHidden();await solveBoard(page);
 await expect(page.locator('.spark-party-overlay')).toHaveCount(1);
 await page.locator('#reset').click();await expect(page.locator('.spark-party-overlay')).toHaveCount(0);
 await page.locator('#reveal').click();
 await expect(page.locator('#result')).not.toHaveClass(/spark-solved/);
 await expect(page.locator('.spark-win-art')).not.toBeVisible();
 await expect(page.locator('.spark-party-overlay')).toHaveCount(0);
 expect(errors).toEqual([]);
});

test('hint-assisted wins feel rewarding while reduced motion keeps the achievement still',async({page},testInfo)=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:320,height:844});
 await page.goto(base+'/daily-spark?day=2026-10-08');await page.locator('#hint').click();await solveBoard(page);
 await expect(page.locator('#result-title')).toHaveText('You made 24!');
 await expect(page.locator('#result-copy')).toContainText('Solved with hints.');
 await expect(page.locator('.spark-win-art')).toBeVisible();
 await expect(page.locator('.spark-party-overlay')).toHaveCount(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:testInfo.outputPath('make-24-reduced-motion.png')});
 expect(errors).toEqual([]);
});

test('hub Make 24 celebrates genuine wins and stops effects when changing games or motion preferences',async({page})=>{
 const errors=[],api=[];page.on('pageerror',error=>errors.push(error.message));
 page.on('request',request=>{if(new URL(request.url()).pathname.startsWith('/api/')&&new URL(request.url()).pathname!=='/api/platform/visitors'&&!(request.method()==='GET'&&new URL(request.url()).pathname==='/api/auth/status'))api.push(request.url());});
 await page.clock.install();await page.emulateMedia({reducedMotion:'no-preference'});
 await page.setViewportSize({width:1440,height:1000});
 await page.goto(base+'/take-a-break?game=24&day=2026-10-08&v=1');
 const scope=page.locator('[data-pane="24"]');await solveBoard(page,scope);
 await expect(scope.locator('#result-title')).toHaveText('You made 24!');
 await expect(scope.locator('.spark-win-art')).toBeVisible();await expect(page.locator('.spark-party-overlay')).toHaveCount(1);
 await page.emulateMedia({reducedMotion:'reduce'});await expect(page.locator('.spark-party-overlay')).toHaveCount(0);
 await expect(scope.locator('.spark-win-art')).toBeVisible();
 await page.emulateMedia({reducedMotion:'no-preference'});
 await scope.locator('.spark-details').first().locator('summary').click();await scope.locator('#reset').click();await solveBoard(page,scope);
 await expect(page.locator('.spark-party-overlay')).toHaveCount(1);
 await page.getByRole('button',{name:'Try Crack the Code',exact:true}).click();
 await expect(page.locator('[data-pane="code"]')).toBeVisible();await expect(page.locator('.spark-party-overlay')).toHaveCount(0);
 await page.locator('#all-breaks').click();await page.locator('[data-game="24"]').click();
 await expect(scope.locator('#result-title')).toHaveText('You made 24!');
 await expect(page.locator('.spark-party-overlay')).toHaveCount(0);
 expect(api).toEqual([]);expect(errors).toEqual([]);
});
