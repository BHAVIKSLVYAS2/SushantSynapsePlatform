const {test,expect}=require('@playwright/test');
const {spawn}=require('node:child_process'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
let child,base,dir;
test.beforeAll(async()=>{dir=fs.mkdtempSync(path.join(os.tmpdir(),'synapse-wheel-'));child=spawn(process.execPath,['server/index.js'],{env:{...process.env,PORT:'0',DATA_DIR:dir},stdio:['ignore','pipe','pipe']});await new Promise((resolve,reject)=>{let out='';const timer=setTimeout(()=>reject(Error('Startup timed out')),15000);child.stdout.on('data',chunk=>{out+=chunk;const match=out.match(/localhost:(\d+)/);if(match){base='http://127.0.0.1:'+match[1];clearTimeout(timer);resolve();}});child.once('error',reject);});});
test.afterAll(async()=>{if(child?.exitCode===null)await new Promise(resolve=>{child.once('exit',resolve);child.kill();});if(dir)fs.rmSync(dir,{recursive:true,force:true});});
test.beforeEach(async({page})=>{await page.addInitScript(()=>{crypto.getRandomValues=array=>{array.fill(1);return array;};Object.defineProperty(navigator,'share',{value:undefined});Object.defineProperty(navigator,'clipboard',{value:undefined});});});
test('reported list explains the duplicate beside the editor and recovers without altering data',async({page})=>{
 const list=require('./option-list.cjs');await page.setViewportSize({width:390,height:844});await page.goto(base+'/decision-wheel');await page.locator('#options').fill(list.join('\n'));await page.locator('#update').click();
 await expect(page.locator('#options-error')).toContainText('"battle axe" on lines 3, 10');await expect(page.locator('#options-error')).toContainText('Wheel not updated');await expect(page.locator('#options')).toHaveAttribute('aria-invalid','true');await expect(page.locator('#options')).toBeFocused();await expect(page.locator('#options')).toHaveValue(list.join('\n'));await expect(page.locator('#wheel path')).toHaveCount(6);
 await page.locator('#spin').click();await expect(page.locator('#options-error')).toBeVisible();await expect(page.locator('#history li')).toHaveCount(0);await expect(page.locator('#result')).toBeHidden();
 const corrected=list.filter((_,index)=>index!==9);await page.locator('#options').fill(corrected.join('\n'));await expect(page.locator('#options-error')).toBeHidden();await page.locator('#update').click();await expect(page.locator('#wheel path')).toHaveCount(20);await expect(page.locator('#count')).toHaveText('20 EQUAL CHOICES');await expect(page.locator('#options')).not.toHaveAttribute('aria-invalid','true');await expect(page.locator('#options')).toHaveValue(corrected.join('\n'));
 await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#spin').click();await expect(page.locator('#winner')).toHaveText('energy pistol');
});
test('spin locks edits, lands on winner, shares privately and removes without repeats',async({page})=>{
 const api=[],errors=[];page.on('request',r=>{if(r.url().includes('/api/')&&new URL(r.url()).pathname!=='/api/platform/visitors'&&!(r.method()==='GET'&&new URL(r.url()).pathname==='/api/auth/status'))api.push(r.url());});page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/decision-wheel');await expect(page.locator('#wheel path')).toHaveCount(6);
 await page.locator('#spin').click();await expect(page.locator('#spin')).toBeDisabled();await expect(page.locator('#options')).toBeDisabled();await expect(page.getByRole('button',{name:'Lunch ideas'})).toBeDisabled();await expect(page.locator('#winner')).toHaveText('Poha',{timeout:10000});await expect(page.locator('#spin')).toBeEnabled();expect(await page.locator('#wheel').evaluate(el=>el.style.transform)).toBe('rotate(2070deg)');
 await page.locator('#share').click();await expect(page.locator('#share-text')).toHaveValue(/Selected: Poha/);await expect(page.locator('#share-text')).not.toHaveValue(/Dosa/);await page.locator('#remove').click();await expect(page.locator('#options')).not.toHaveValue(/Poha/);await expect(page.locator('#wheel path')).toHaveCount(5);
 await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#options').fill('A\nB');await page.locator('#spin').focus();await page.keyboard.press('Space');await expect(page.locator('#winner')).toHaveText('B');await page.locator('#remove').click();await expect(page.locator('#winner')).toHaveText('A');await expect(page.locator('#spin')).toBeDisabled();await expect(page.locator('#remove')).toBeDisabled();await page.locator('#share').click();await expect(page.locator('#share-text')).toHaveValue(/Remaining option: A/);
 await expect(page.locator('#history li')).toHaveCount(2);await page.locator('#clear-history').click();await expect(page.locator('#history li')).toHaveCount(0);await page.reload();await expect(page.locator('#options')).toHaveValue(/Dosa/);await expect(page.locator('#result')).toBeHidden();expect(api).toEqual([]);expect(errors).toEqual([]);
});
test('branded hub, default sound, slow final ticks and motion cancellation keep the selected winner',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{const Original=window.AudioContext;if(Original)window.AudioContext=class extends Original{constructor(...args){super(...args);window.audioCreated=(window.audioCreated||0)+1;}};});
 await page.goto(base+'/decision-wheel');
 await expect(page.locator('.hub img')).toHaveAttribute('src','/logo-adaptive-192.png');
 expect(await page.locator('.hub img').evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
 expect(await page.evaluate(()=>window.audioCreated||0)).toBe(0);
 await expect(page.getByRole('button',{name:'Tick sound: on'})).toHaveAttribute('aria-pressed','true');
 await page.getByRole('button',{name:'Tick sound: on'}).click();await expect(page.locator('.wheel-sound')).toHaveAttribute('aria-pressed','false');
 await page.getByRole('button',{name:'Tick sound: off'}).click();await expect(page.locator('.wheel-sound')).toHaveAttribute('aria-pressed','true');
 await page.locator('#spin').click();
 const measure=async time=>page.evaluate(async time=>{const animation=document.querySelector('#wheel').getAnimations()[0];animation.pause();animation.currentTime=time;await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);const m=new DOMMatrixReadOnly(getComputedStyle(document.querySelector('#wheel')).transform);return (Math.atan2(m.b,m.a)*180/Math.PI+360)%360;},time);
 const a=await measure(1000),b=await measure(1100),c=await measure(5000),d=await measure(5100),early=(b-a+360)%360,late=(d-c+360)%360;
 expect(early).toBeGreaterThan(late*5);expect(late).toBeGreaterThan(0);
 await expect(page.locator('.play')).toHaveClass(/is-settling/);await expect(page.locator('#status')).toContainText('Final turn');
 await expect(page.locator('#options')).toBeDisabled();
 await page.emulateMedia({reducedMotion:'reduce'});await expect(page.locator('#winner')).toHaveText('Poha');await expect(page.locator('#spin')).toBeEnabled();
 await expect(page.locator('.spin-preview')).toHaveCount(0);await expect(page.locator('.wheel-confetti')).toHaveCount(0);await expect(page.locator('.play')).not.toHaveClass(/is-spinning|is-settling/);
 expect(await page.locator('#wheel').evaluate(el=>el.style.transform)).toBe('rotate(2070deg)');
 expect(await page.locator('.hub').evaluate(el=>getComputedStyle(el).transform)).toBe('matrix(1, 0, 0, 1, -36, -36)');
 expect(errors).toEqual([]);
});

test('validation, safe labels, theme, reduced motion, history bound and phone layouts',async({page})=>{
 await page.addInitScript(()=>{if(!localStorage.getItem('synapse-theme'))localStorage.setItem('synapse-theme','system');});await page.emulateMedia({reducedMotion:'reduce',colorScheme:'dark'});await page.goto(base+'/decision-wheel/');await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
 for(const [value,error]of [['One','between 2 and 30'],['Dosa\ndosa','unique'],['x'.repeat(61)+'\nOK','60 characters']]){await page.locator('#options').fill(value);await page.locator('#update').click();await expect(page.locator('#status')).toContainText(error);await expect(page.locator('#result')).toBeHidden();}
 await page.locator('#options').fill('<img src=x onerror=alert(1)>\nNormal');await page.locator('#update').click();await expect(page.locator('#wheel path')).toHaveCount(2);await expect(page.locator('#wheel img')).toHaveCount(0);
 await page.getByRole('button',{name:'Pick a team'}).click();for(let i=0;i<22;i++){await page.locator('#spin').click();await expect(page.locator('#spin')).toBeEnabled();}await expect(page.locator('#history li')).toHaveCount(20);
 await page.getByRole('button',{name:'Dark mode',exact:true}).click();await expect(page.locator('html')).toHaveAttribute('data-theme','light');
 await page.locator('#options').fill(Array.from({length:30},(_,i)=>'Long choice '+i+' '+ 'x'.repeat(35)).join('\n'));await page.locator('#update').click();await expect(page.locator('#wheel path')).toHaveCount(30);
 for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await page.getByRole('button',{name:'Lunch ideas'}).click();await page.screenshot({path:'test-results/decision-wheel-desktop.png',fullPage:true});await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'Dark mode',exact:true}).click();await page.screenshot({path:'test-results/decision-wheel-mobile.png',fullPage:true});
});
