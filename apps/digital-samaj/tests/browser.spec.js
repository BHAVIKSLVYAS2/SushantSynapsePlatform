const {test,expect}=require('@playwright/test');
const {spawn}=require('node:child_process'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
let proc,dir,base;
test.beforeEach(async()=>{
 dir=fs.mkdtempSync(path.join(os.tmpdir(),'samaj-browser-'));
 proc=spawn(process.execPath,['server/index.js'],{cwd:path.resolve(__dirname,'../../..'),env:{...process.env,DATA_DIR:dir,PORT:'0'},stdio:['ignore','pipe','pipe']});
 base=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Server timeout')),15000);proc.stdout.on('data',d=>{const match=String(d).match(/http:\/\/localhost:(\d+)/);if(match){clearTimeout(timer);resolve('http://127.0.0.1:'+match[1]);}});proc.on('exit',c=>reject(Error('Server exited '+c)));});
});
test.afterEach(async()=>{proc.kill();await new Promise(resolve=>{if(proc.exitCode!==null)resolve();else proc.once('exit',resolve);});fs.rmSync(dir,{recursive:true,force:true});});
test('Mobile registration autosaves, resumes, submits atomically and renders private family profile in Hindi',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.request.post(base+'/api/auth/setup',{data:{name:'Coordinator',email:'samaj@example.test',password:'Strong Samaj password!',firmName:'Isolated workspace'}});
 await page.setViewportSize({width:390,height:844});await page.goto(base+'/digital-samaj');
 await page.getByLabel('Samaj name',{exact:true}).fill('Test Samaj');await page.getByRole('button',{name:'Create Samaj',exact:true}).click();
 await page.getByRole('button',{name:'Test Samaj',exact:true}).click();await page.getByRole('button',{name:'Register family',exact:true}).click();
 await page.getByRole('button',{name:'Start a registration',exact:true}).click();await page.getByLabel('Family name',{exact:true}).fill('Vyas Family');await page.getByLabel('State',{exact:true}).fill('Gujarat');
 await page.getByRole('button',{name:'Save & continue later',exact:true}).click();await expect(page.locator('#save-status')).toHaveText('Saved');
 await page.reload();await page.getByRole('button',{name:'Test Samaj',exact:true}).click();await page.getByRole('button',{name:'Register family',exact:true}).click();await page.getByRole('button',{name:'Resume saved registration',exact:true}).click();
 await expect(page.getByLabel('Family name',{exact:true})).toHaveValue('Vyas Family');await page.getByRole('button',{name:'Continue',exact:true}).click();
 await page.getByLabel('English name',{exact:true}).fill('Ramesh Vyas');await page.getByLabel('Hindi name',{exact:true}).fill('रमेश व्यास');
 for(let step=1;step<9;step++)await page.getByRole('button',{name:'Continue',exact:true}).click();
 await page.locator('#consent').check();await page.getByRole('button',{name:'Submit for verification',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Vyas Family',exact:true})).toBeVisible();await expect(page.locator('#profile')).toContainText('Ramesh Vyas');
 await page.getByRole('button',{name:'View profile',exact:true}).click();await page.getByRole('button',{name:'Vanshavali',exact:true}).click();await expect(page.locator('.tree-window')).toBeVisible();
 for(const width of [320,768,1440]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await page.locator('#language').selectOption('hi');await expect(page.getByRole('button',{name:'निर्देशिका',exact:true})).toBeVisible();
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'test-results/digital-samaj-mobile.png',fullPage:true});expect(errors).toEqual([]);
});
test('Signed out access requires shared login and database APIs stay protected',async({page})=>{
 await page.goto(base+'/digital-samaj');await expect(page.getByRole('link',{name:'Sign in',exact:true})).toHaveAttribute('href','/signin?next=digital-samaj');
 expect((await page.request.get(base+'/api/digital-samaj')).status()).toBe(401);
 await page.locator('#language').selectOption('hi');await expect(page.getByRole('link',{name:'साइन इन',exact:true})).toBeVisible();await expect(page.locator('#notice')).not.toHaveClass('show');
});

test('Independent review publishes private-field-safe bilingual PDF; CSV mapping previews before import',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const post=async(url,data)=>{const response=await page.request.post(base+url,{data});expect(response.ok(),await response.text()).toBe(true);return response.json();};
 await post('/api/auth/setup',{name:'Registrar',email:'registrar@example.test',password:'Strong Samaj password!',firmName:'Isolated workspace'});
 const reviewer=await post('/api/users',{name:'Reviewer',email:'reviewer@example.test',password:'Strong Reviewer password!',role:'Advocate',appIds:['digital-samaj']});
 const samaj=await post('/api/digital-samaj',{name:'Review Samaj'}),api='/api/digital-samaj/'+samaj.id;
 await post(api+'/grants',{userId:reviewer.id,role:'SAMAJ_ADMIN',scope:'ALL',scopeValue:''});
 const p=await post(api+'/persons',{data:{englishName:'Ramesh Vyas',hindiName:'रमेश व्यास',mobile:'9876543210',dob:'1970-01-01',occupation:'Teacher'},privacy:{dob:'ADMIN'}});
 await post(api+'/persons/'+p.id+'/submit',{revision:1});
 await post('/api/auth/logout',{});await post('/api/auth/login',{email:'reviewer@example.test',password:'Strong Reviewer password!'});
 await page.goto(base+'/digital-samaj');await page.getByRole('button',{name:'Review Samaj',exact:true}).click();await page.getByRole('button',{name:'Reviews',exact:true}).click();await page.getByRole('button',{name:'Review details',exact:true}).click();
 await expect(page.locator('#review-detail')).toContainText('Ramesh Vyas');await expect(page.locator('#review-detail')).not.toContainText('9876543210');await page.getByLabel('Review reason',{exact:true}).fill('Identity confirmed independently');await page.locator('[data-form=decision]').getByRole('button',{name:'Save',exact:true}).click();
 await page.getByRole('button',{name:'Directory',exact:true}).click();await page.getByRole('button',{name:'View profile',exact:true}).click();await expect(page.locator('#profile')).toContainText('Verified');
 await page.getByLabel('Print language',{exact:true}).selectOption('both');await page.evaluate(()=>window.print=()=>{window.didPrint=true;});await page.getByRole('button',{name:'Print / Save PDF',exact:true}).click();await expect(page.locator('#print-document')).toContainText('रमेश व्यास');await expect(page.locator('#print-document')).not.toContainText('9876543210');
 const pdf=await page.pdf({format:'A4',printBackground:true});expect(pdf.subarray(0,5).toString()).toBe('%PDF-');expect(pdf.length).toBeGreaterThan(5000);await page.evaluate(()=>{delete document.body.dataset.printing;document.querySelector('#print-document')?.remove();});
 await page.getByRole('button',{name:'Administration',exact:true}).click();await page.locator('[data-form=import-file] input[type=file]').setInputFiles({name:'members.csv',mimeType:'text/csv',buffer:Buffer.from('englishName,dob\nImported Person,1990-01-01\nRamesh Vyas,1970-01-01')});await page.locator('[data-form=import-file]').getByRole('button',{name:'Validate & preview'}).click();await page.locator('[data-form=import-map]').getByRole('button',{name:'Validate & preview'}).click();await expect(page.locator('#import-preview')).toContainText('Duplicate');await page.getByRole('button',{name:'Import ready rows'}).click();await expect(page.locator('#import-preview')).toContainText('Created');
 for(const theme of ['dark','light']){const toggle=page.getByRole('button',{name:'Dark mode',exact:true});if(await page.locator('html').getAttribute('data-theme')!==theme)await toggle.click();await expect(page.locator('html')).toHaveAttribute('data-theme',theme);}
 expect(errors).toEqual([]);
});
