const {test,expect}=require('../../../tests/browser-fixture.js');
const {startPreview}=require('../../../tests/organisation-preview-fixture.cjs');
let fixture;
test.beforeEach(async()=>{fixture=await startPreview();});
test.afterEach(async()=>{await fixture.stop();});
async function login(page,user){const response=await page.request.post(fixture.base+'/api/auth/login',{data:{email:user+'@example.com',password:fixture.password}});expect(response.status()).toBe(200);}
async function openForm(page,command){const form=page.locator(`form[data-command="${command}"]`);await form.locator('..').locator('summary').click();return form;}

test('Super Admin manages licences and provisions an organisation',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await login(page,'super');await page.goto(fixture.base+'/super-admin');
 await expect(page.getByRole('status')).toHaveText('Workspace ready.');
 const licence=await openForm(page,'licence');await licence.getByLabel('Licence status').selectOption('Suspended');await licence.getByLabel('Reason for change').fill('Pause for review');await licence.getByRole('button',{name:'Save licence',exact:true}).click();
 await expect(page.getByRole('status')).toHaveText('Change saved.');await expect(page.locator('.licence .badge').first()).toHaveText('Suspended');
 const create=await openForm(page,'provision');await create.getByLabel('Organisation name',{exact:true}).fill('New Chambers');await create.getByLabel('Master Admin account email').fill('client@example.com');await create.getByLabel('Reason for change').fill('New organisation onboarding');await create.getByRole('button',{name:'Create organisation',exact:true}).click();
 await expect(page.getByRole('status')).toHaveText('Change saved.');await expect(page.locator('#summary')).toContainText('New Chambers');await expect(page.locator('#summary')).toContainText('PendingActivation');await expect(page.locator('#secret')).toHaveValue(/^[a-f0-9]{64}$/);await page.getByRole('button',{name:'Clear secret'}).click();await expect(page.locator('#secret')).toHaveValue('');expect(errors).toEqual([]);
});
test('Master Admin invites a client and the intended account accepts',async({page,browser})=>{
 await login(page,'master');await page.goto(fixture.base+'/admin');await expect(page.getByRole('status')).toHaveText('Workspace ready.');await expect(page.locator('form[data-command="licence"]')).toHaveCount(0);
 const invite=await openForm(page,'invite');await invite.getByLabel('Existing account email').fill('client@example.com');await invite.getByLabel('Membership role').selectOption('Client');await invite.getByLabel('Reason for change').fill('Client membership invitation');await invite.getByRole('button',{name:'Create invitation'}).click();await expect(page.getByRole('status')).toHaveText('Change saved.');const token=await page.locator('#secret').inputValue();
 const context=await require('../../../tests/browser-fixture.js').acknowledgedContext(browser);try{const client=await context.newPage();await login(client,'client');await client.goto(fixture.base+'/admin');await expect(client.getByRole('status')).toHaveText('Workspace ready.');await client.getByLabel('Invitation secret',{exact:true}).fill(token);await client.getByRole('button',{name:'Accept invitation',exact:true}).click();await expect(client.getByRole('status')).toHaveText('Change saved.');await expect(client.getByLabel('Invitation secret',{exact:true})).toHaveValue('');}finally{await context.close();}
 await page.getByRole('button',{name:'Refresh',exact:true}).click();await expect(page.getByRole('status')).toHaveText('Workspace ready.');await expect(page.locator('.person').filter({hasText:'client@example.com'})).toContainText('Active');
});
test('membership assignment, stale edit handling and responsive themes',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await login(page,'master');await page.goto(fixture.base+'/admin');await expect(page.getByRole('status')).toHaveText('Workspace ready.');
 const assignment=await openForm(page,'assignment');await assignment.getByRole('combobox',{name:'Member',exact:true}).selectOption('member');await assignment.getByLabel('Reason for change').fill('Assign case work');await assignment.getByRole('button',{name:'Save Chambers access'}).click();await expect(page.getByRole('status')).toHaveText('Change saved.');
 const member=await openForm(page,'member');await member.getByRole('combobox',{name:'Member',exact:true}).selectOption('member');await member.getByLabel('Membership status').selectOption('Inactive');await member.getByLabel('Reason for change').fill('Keep this entered reason');
 const current=await (await page.request.get(fixture.base+'/api/organisation-admin/organisations/'+fixture.organisationId)).json();await page.request.post(fixture.base+'/api/organisation-admin/organisations/'+fixture.organisationId+'/assignment',{data:{userId:'member',role:'Advocate',status:'Active',version:current.organisation.version,reason:'Concurrent assignment change'}});
 await member.getByRole('button',{name:'Update membership'}).click();await expect(page.getByRole('status')).toContainText('Refresh the workspace');await expect(member.getByLabel('Reason for change')).toHaveValue('Keep this entered reason');
 await page.getByRole('button',{name:'Refresh',exact:true}).click();await expect(page.getByRole('status')).toHaveText('Workspace ready.');
 for(const width of [320,390,768,1440])for(const theme of ['light','dark']){await page.setViewportSize({width,height:900});await page.getByRole('combobox',{name:'Theme',exact:true}).selectOption(theme);await expect(page.locator('html')).toHaveAttribute('data-theme',theme);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await page.emulateMedia({colorScheme:'dark'});await page.getByRole('combobox',{name:'Theme',exact:true}).selectOption('system');await expect(page.locator('html')).toHaveAttribute('data-theme','dark');await page.emulateMedia({colorScheme:'light'});await expect(page.locator('html')).toHaveAttribute('data-theme','light');
 await page.screenshot({path:'.publish/admin-desktop.png',fullPage:true});await page.setViewportSize({width:390,height:844});await page.screenshot({path:'.publish/admin-mobile.png',fullPage:true});expect(errors).toEqual([]);
});
test('signed-out and non-Super Admin visitors receive useful access states',async({page})=>{
 await page.goto(fixture.base+'/admin');await expect(page.getByRole('status')).toHaveText('Please sign in');await expect(page.locator('#signin')).toBeVisible();await expect(page.locator('#workspace')).toBeHidden();await login(page,'master');await page.goto(fixture.base+'/super-admin');await expect(page.getByRole('status')).toContainText('Super Admin access is required');await expect(page.locator('#workspace')).toBeHidden();
});

test('normal sign-in opens Super Admin and a different account can explicitly switch',async({page})=>{
 await page.goto(fixture.base+'/account');const signin=page.locator('#admin-login');
 await signin.getByLabel('Account email').fill('super@example.com');await signin.getByLabel('Password',{exact:true}).fill(fixture.password);await signin.getByRole('button',{name:'Sign in',exact:true}).click();
 await expect(page).toHaveURL(fixture.base+'/super-admin');await expect(page.getByRole('status')).toHaveText('Workspace ready.');
 await login(page,'master');await page.goto(fixture.base+'/super-admin');await expect(page.locator('#workspace')).toBeHidden();await expect(page.locator('#panels')).toBeEmpty();
 await page.getByRole('button',{name:'Switch account',exact:true}).click();await expect(page.locator('#signin')).toBeVisible();await expect(page.getByRole('status')).toHaveText('Please sign in');
 await signin.getByLabel('Account email').fill('super@example.com');await signin.getByLabel('Password',{exact:true}).fill(fixture.password);await signin.getByRole('button',{name:'Sign in',exact:true}).click();await expect(page.getByRole('status')).toHaveText('Workspace ready.');await expect(page).toHaveURL(fixture.base+'/super-admin');
});

test('new Master Admin invitation activates an account and signs into only its organisation',async({page,browser})=>{
 await login(page,'super');await page.goto(fixture.base+'/super-admin');
 await expect(page.getByRole('status')).toHaveText('Workspace ready.');
 const create=await openForm(page,'provision');
 await create.getByLabel('Master Admin account type').selectOption('true');
 await create.getByLabel('Organisation name',{exact:true}).fill('Invited Master Chambers');
 await create.getByLabel('Master Admin account email').fill('invited@example.com');
 await create.getByLabel('Reason for change').fill('New primary onboarding');
 await create.getByRole('button',{name:'Create organisation',exact:true}).click();
 await expect(page.getByRole('status')).toHaveText('Change saved.');
 const token=await page.locator('#secret').inputValue();
 const context=await require('../../../tests/browser-fixture.js').acknowledgedContext(browser);
 try{
  const recipient=await context.newPage();await recipient.goto(fixture.base+'/admin');
  await expect(recipient.locator('#signin')).toBeVisible();
  await recipient.getByText('Activate a new account',{exact:true}).click();
  const activate=recipient.locator('#new-master');
  for(const width of [320,390,768,1440])for(const theme of ['light','dark']){
   await recipient.setViewportSize({width,height:900});await recipient.getByRole('combobox',{name:'Theme',exact:true}).selectOption(theme);
   expect(await recipient.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
  await recipient.setViewportSize({width:390,height:844});await recipient.getByRole('combobox',{name:'Theme',exact:true}).selectOption('light');
  await recipient.screenshot({path:'.publish/admin-new-master-mobile.png',fullPage:true});
  await activate.getByLabel('New account invitation secret').fill(token);
  await activate.getByLabel('Invited email').fill('invited@example.com');
  await activate.getByLabel('Your name').fill('Invited Master');
  await activate.getByLabel('Choose a password').fill('Recipient password chosen 2026!');
  await activate.getByRole('button',{name:'Activate account',exact:true}).click();
  await expect(recipient.getByRole('status')).toContainText('Account activated. Sign in');
  await expect(activate.getByLabel('New account invitation secret')).toHaveValue('');
  const signin=recipient.locator('#admin-login');await signin.getByLabel('Account email').fill('invited@example.com');
  await signin.getByLabel('Password',{exact:true}).fill('Recipient password chosen 2026!');
  await signin.getByRole('button',{name:'Sign in',exact:true}).click();
  await expect(recipient.getByRole('status')).toHaveText('Workspace ready.');
  await expect(recipient.locator('#summary')).toContainText('Invited Master Chambers');
  await expect(recipient.locator('#organisation option')).toHaveCount(1);
  await expect(recipient.locator('form[data-command="provision"]')).toHaveCount(0);
  for(const width of [320,390,768,1440]){await recipient.setViewportSize({width,height:900});expect(await recipient.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
  await recipient.getByRole('button',{name:'Sign out',exact:true}).click();
  await expect(recipient.locator('#workspace')).toBeHidden();await expect(recipient.locator('#panels')).toBeEmpty();
 }finally{await context.close();}
});

for(const role of ['Staff','Client'])test(`Master Admin invites a new ${role} identity and recipient activates without administration access`,async({page,browser})=>{
 await login(page,'master');await page.goto(fixture.base+'/admin');await expect(page.getByRole('status')).toHaveText('Workspace ready.');
 const invite=await openForm(page,'invite');await invite.getByLabel('Invited account type').selectOption('true');
 await invite.getByLabel('New or pending account email').fill('new-member@example.com');await invite.getByLabel('Membership role').selectOption(role);
 await invite.getByLabel('Reason for change').fill('New '+role+' invitation');await invite.getByRole('button',{name:'Create invitation',exact:true}).click();
 await expect(page.getByRole('status')).toHaveText('Change saved.');const token=await page.locator('#secret').inputValue();
 const context=await require('../../../tests/browser-fixture.js').acknowledgedContext(browser);
 try{
  const recipient=await context.newPage();await recipient.goto(fixture.base+'/admin');await expect(recipient.locator('#signin')).toBeVisible();
  await recipient.getByText('Activate a new account',{exact:true}).click();const activate=recipient.locator('#new-master');
  await activate.getByLabel('New account invitation type').selectOption('false');
  await activate.getByLabel('New account invitation secret').fill(token);await activate.getByLabel('Invited email').fill('new-member@example.com');
  await activate.getByLabel('Your name').fill('New '+role);await activate.getByLabel('Choose a password').fill('Recipient password chosen 2026!');
  await activate.getByRole('button',{name:'Activate account',exact:true}).click();await expect(recipient.getByRole('status')).toContainText('Account activated. Sign in');
  const signin=recipient.locator('#admin-login');await signin.getByLabel('Account email').fill('new-member@example.com');await signin.getByLabel('Password',{exact:true}).fill('Recipient password chosen 2026!');
  await signin.getByRole('button',{name:'Sign in',exact:true}).click();await expect(recipient.getByRole('status')).toHaveText('Workspace ready.');
  await expect(recipient.locator('#organisation option')).toHaveCount(0);await expect(recipient.locator('form[data-command]')).toHaveCount(0);
  await page.getByRole('button',{name:'Refresh',exact:true}).click();await expect(page.getByRole('status')).toHaveText('Workspace ready.');
  await expect(page.locator('.person').filter({hasText:'new-member@example.com'})).toContainText('Active');
  await expect(page.locator('.person').filter({hasText:'new-member@example.com'})).toContainText(role);
 }finally{await context.close();}
});

test('Super Admin downloads an explicitly confirmed full recovery backup',async({page})=>{
 await login(page,'super');await page.goto(fixture.base+'/super-admin');await expect(page.getByRole('status')).toHaveText('Workspace ready.');
 const recovery=await openForm(page,'recovery-export');
 for(const width of [320,390,768,1440])for(const theme of ['light','dark']){
  await page.setViewportSize({width,height:900});await page.getByRole('combobox',{name:'Theme',exact:true}).selectOption(theme);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
 await page.setViewportSize({width:390,height:844});await page.getByRole('combobox',{name:'Theme',exact:true}).selectOption('light');
 await recovery.screenshot({path:'.publish/recovery-controls-mobile.png'});
 await recovery.getByLabel('Your current password').fill('Wrong password for recovery!');
 await recovery.getByLabel('Type EXPORT ALL ORGANISATIONS').fill('EXPORT ALL ORGANISATIONS');
 await recovery.getByLabel('Reason for change').fill('Offline recovery rehearsal');
 await recovery.getByRole('button',{name:'Download full recovery backup',exact:true}).click();
 await expect(page.getByRole('status')).toHaveText('Password verification failed');await expect(recovery.getByLabel('Your current password')).toHaveValue('');
 await recovery.getByLabel('Your current password').fill(fixture.password);
 const downloaded=page.waitForEvent('download');await recovery.getByRole('button',{name:'Download full recovery backup',exact:true}).click();
 const download=await downloaded;expect(download.suggestedFilename()).toBe('synapse-platform-recovery.sql');
 const sql=require('node:fs').readFileSync(await download.path(),'utf8');expect(sql).toContain('CREATE TABLE platform_organisations');expect(sql).toContain(Buffer.from('PlatformRecoveryExportCreated').toString('hex'));expect(sql).not.toContain(fixture.password);
 await expect(page.getByRole('status')).toContainText('Recovery backup downloaded');await expect(recovery.getByLabel('Your current password')).toHaveValue('');
 await page.getByRole('button',{name:'Sign out',exact:true}).click();await login(page,'master');await page.goto(fixture.base+'/admin');await expect(page.getByRole('status')).toHaveText('Workspace ready.');await expect(page.locator('form[data-command="recovery-export"]')).toHaveCount(0);
});
