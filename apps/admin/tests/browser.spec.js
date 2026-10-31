const {test,expect}=require('../../../tests/browser-fixture.js');
const {startPreview}=require('../../../tests/organisation-preview-fixture.cjs');
let fixture;
test.beforeEach(async()=>{fixture=await startPreview();});
test.afterEach(async()=>{await fixture.stop();});
async function login(page,user){const response=await page.request.post(fixture.base+'/api/auth/login',{data:{email:user+'@example.com',password:fixture.password}});expect(response.status()).toBe(200);}
async function openForm(page,command){const sections={licence:'apps',assignment:'apps',invite:'people',member:'people','revoke-invitation':'people',status:'governance',transfer:'governance','recovery-export':'governance'};if(sections[command])await page.locator('.admin-sections [data-admin-nav="'+sections[command]+'"]').click();const form=page.locator(`form[data-command="${command}"]`);await form.locator('..').locator('summary').click();return form;}

test('mobile creation wizard validates, supports keyboard and browser Back, and reviews multiple licences before writing',async({page})=>{
 test.setTimeout(120000);const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width:320,height:820});await login(page,'super');await page.goto(fixture.base+'/super-admin');await expect(page.getByRole('status')).toHaveText('Workspace ready.');
 const posts=[];page.on('request',r=>{if(r.method()==='POST'&&r.url().endsWith('/provision'))posts.push(r.postDataJSON());});
 const create=page.locator('form[data-command="provision"]');await create.locator('..').locator('summary').focus();await page.keyboard.press('Enter');await expect(create.locator('[data-step="0"]')).toBeVisible();
 await create.getByRole('button',{name:'Continue',exact:true}).click();await expect(create.locator('[name=name]')).toBeFocused();expect(posts).toHaveLength(0);
 await create.getByLabel('Organisation name',{exact:true}).fill('Mobile Guided Organisation');await create.getByLabel('Timezone',{exact:true}).fill('Not/AZone');await create.getByRole('button',{name:'Continue',exact:true}).click();await expect(create.getByLabel('Timezone',{exact:true})).toBeFocused();await create.getByLabel('Timezone',{exact:true}).fill('Asia/Kolkata');await create.getByRole('button',{name:'Continue',exact:true}).click();
 await expect(create.locator('[data-step="1"]')).toBeVisible();await create.getByLabel('Master Admin account email').fill('invalid');await create.getByRole('button',{name:'Continue',exact:true}).click();await expect(create.getByLabel('Master Admin account email')).toBeFocused();await create.getByLabel('Master Admin account email').fill('client@example.com');await page.keyboard.press('Enter');await expect(create.locator('[data-step="2"]')).toBeVisible();
 await page.goBack();await expect(create.locator('[data-step="1"]')).toBeVisible();await expect(create.getByLabel('Master Admin account email')).toHaveValue('client@example.com');await page.goForward();await expect(create.locator('[data-step="2"]')).toBeVisible();
 await create.locator('[name=startsAt]').fill('2027-01-02T10:30');await create.locator('[name=endsAt]').fill('2027-02-02T10:30');await create.locator('[name=readOnlyUntil]').fill('2027-02-05T10:30');await create.getByRole('button',{name:'Add another app licence',exact:true}).click();const extra=create.locator('.additional-licence');await extra.getByRole('combobox',{name:'App',exact:true}).selectOption('batchfee-lite');await extra.locator('[data-licence-field=startsAt]').fill('2027-01-02T10:30');
 await create.getByRole('button',{name:'Continue',exact:true}).click();await expect(create.locator('.wizard-review')).toContainText('Mobile Guided Organisation');await expect(create.locator('.wizard-review')).toContainText('BatchFee Lite');expect(posts).toHaveLength(0);
 await create.getByRole('button',{name:'Back',exact:true}).click();await expect(create.locator('[data-step="2"]')).toBeVisible();await create.getByRole('button',{name:'Continue',exact:true}).click();await create.getByRole('button',{name:'Create organisation',exact:true}).click();await expect(create.getByLabel('Reason for change')).toBeFocused();expect(posts).toHaveLength(0);
 await create.getByLabel('Reason for change').fill('Reviewed mobile creation');await create.getByRole('button',{name:'Create organisation',exact:true}).click();await expect(page.getByRole('status')).toHaveText('Change saved.');expect(posts).toHaveLength(1);expect(posts[0].licences).toHaveLength(2);expect(posts[0].licences[0].startsAt).toBe('2027-01-02T05:00:00.000Z');expect(posts[0].licences[0].readOnlyUntil).toBe('2027-02-05T05:00:00.000Z');
 const token=await page.locator('#secret').inputValue();expect(token).toMatch(/^[a-f0-9]{64}$/);expect(page.url()).not.toContain(token);expect(await page.evaluate(token=>JSON.stringify({...localStorage,...sessionStorage}).includes(token),token)).toBe(false);await page.locator('.admin-sections [data-admin-nav="apps"]').click();await expect(page.locator('#secret')).toHaveValue('');expect(errors).toEqual([]);
});

test('licence switching resets every field for a new app and keeps existing dates exact',async({page})=>{
 await login(page,'super');await page.goto(fixture.base+'/super-admin');await expect(page.getByRole('status')).toHaveText('Workspace ready.');const form=await openForm(page,'licence');const savedStart=await form.locator('[name=startsAt]').inputValue();await expect(form.locator('.licence-state')).toContainText('Editing existing licence');await form.locator('[name=status]').selectOption('Suspended');await form.locator('[name=endsAt]').fill('2031-04-05T12:30');await form.locator('[name=readOnlyUntil]').fill('2031-04-08T12:30');await form.locator('[name=staffLimit]').fill('42');await form.getByLabel('Reason for change').fill('Unsaved draft for first app');
 await form.getByRole('combobox',{name:'App',exact:true}).selectOption('batchfee-lite');await expect(form.locator('.licence-state')).toContainText('New licence');await expect(form.locator('[name=status]')).toHaveValue('Active');for(const name of ['endsAt','readOnlyUntil','staffLimit','clientLimit','reason'])await expect(form.locator('[name='+name+']')).toHaveValue('');await expect(form.getByRole('button',{name:'Create licence',exact:true})).toBeVisible();
 await form.getByRole('combobox',{name:'App',exact:true}).selectOption('advocate');await expect(form.locator('[name=startsAt]')).toHaveValue(savedStart);await expect(form.locator('[name=status]')).toHaveValue('Active');await expect(form.locator('[name=endsAt]')).toHaveValue('2099-01-01T05:30');
 await form.getByRole('combobox',{name:'App',exact:true}).selectOption('batchfee-lite');await form.getByLabel('Reason for change').fill('Enable another supported app');const request=page.waitForRequest(r=>r.url().endsWith('/licence')&&r.method()==='POST');await form.getByRole('button',{name:'Create licence',exact:true}).click();expect((await request).postDataJSON().licenceVersion).toBe(0);await expect(page.getByRole('status')).toHaveText('Change saved.');
 await page.locator('form[data-command="licence"]').locator('..').locator('summary').click();await page.locator('form[data-command="licence"] [name=appId]').selectOption('batchfee-lite');await expect(page.locator('.licence-state')).toContainText('Editing existing licence');
});

test('Master Admin mobile home separates membership, app roles and settings with history and keyboard access',async({page})=>{
 await login(page,'master');await page.goto(fixture.base+'/admin');await expect(page.getByRole('status')).toHaveText('Workspace ready.');await expect(page.locator('[data-admin-section="overview"]')).toBeVisible();await expect(page.locator('.access-model')).toContainText('Neither role automatically grants');await expect(page.locator('[data-admin-section="governance"]')).toHaveCount(0);await expect(page.locator('form[data-command="provision"]')).toHaveCount(0);
 await page.locator('.admin-sections [data-admin-nav="people"]').focus();await page.keyboard.press('Enter');await expect(page.locator('#section-people')).toBeFocused();await expect(page.locator('[data-admin-section="people"]')).toBeVisible();await expect(page.locator('[data-admin-section="people"]')).toContainText('separately gives them a role');await page.locator('.admin-sections [data-admin-nav="apps"]').click();await expect(page.locator('[data-admin-section="apps"]')).toContainText('Current app assignments');await page.goBack();await expect(page.locator('[data-admin-section="people"]')).toBeVisible();await page.goForward();await expect(page.locator('[data-admin-section="apps"]')).toBeVisible();await page.reload();await expect(page.locator('[data-admin-section="apps"]')).toBeVisible();
 for(const width of [320,390,768,1440])for(const theme of ['light','dark']){await page.setViewportSize({width,height:850});await page.getByRole('combobox',{name:'Theme',exact:true}).selectOption(theme);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await page.setViewportSize({width:390,height:850});await page.locator('.admin-sections [data-admin-nav="overview"]').click();const compact=await page.evaluate(()=>({introPadding:getComputedStyle(document.querySelector('#main .intro')).paddingLeft,seatColumns:getComputedStyle(document.querySelector('#main .metrics')).gridTemplateColumns.split(' ').length}));expect(compact).toEqual({introPadding:'0px',seatColumns:3});await page.screenshot({path:'.publish/admin-redesign-master-mobile.png',fullPage:true});
});

test('Super Admin directory selects the intended organisation and creation links cannot bypass validation',async({page})=>{
 await login(page,'super');await page.goto(fixture.base+'/super-admin');await expect(page.getByRole('status')).toHaveText('Workspace ready.');await page.getByRole('searchbox',{name:'Find an organisation'}).fill('Other');await expect(page.locator('[data-select-org]:visible')).toHaveCount(1);await page.locator('[data-select-org="'+fixture.otherOrganisationId+'"]').click();await expect(page.locator('#summary')).toContainText('Other Chambers');await expect(page.locator('#organisation')).toHaveValue(fixture.otherOrganisationId);await page.reload();await expect(page.getByRole('status')).toHaveText('Workspace ready.');await expect(page.locator('#organisation')).toHaveValue(fixture.otherOrganisationId);
 await expect(page.locator('[data-admin-section="governance"]')).toBeHidden();await page.locator('.admin-sections [data-admin-nav="governance"]').click();await expect(page.locator('[data-admin-section="governance"]')).toBeVisible();await expect(page.locator('[data-admin-section="governance"]')).toContainText('Sensitive and infrequent');
 await page.goto(fixture.base+'/super-admin#create/4');const create=page.locator('form[data-command="provision"]');await expect(create.locator('[data-step="0"]')).toBeVisible();await expect(create.getByRole('button',{name:'Create organisation',exact:true})).toBeHidden();const apps=await create.locator('[name=appId] option').evaluateAll(nodes=>nodes.map(n=>n.value));expect(apps).toContain('advocate');expect(apps).toContain('batchfee-lite');expect(apps).not.toContain('ritual-assist');expect(apps).not.toContain('rashifal-kundli');expect(apps).not.toContain('news');
 await page.setViewportSize({width:320,height:850});for(const theme of ['light','dark']){await page.getByRole('combobox',{name:'Theme',exact:true}).selectOption(theme);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}await page.screenshot({path:'.publish/admin-redesign-super-mobile.png',fullPage:true});
});

test('Super Admin manages licences and provisions an organisation',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await login(page,'super');await page.goto(fixture.base+'/super-admin');
 await expect(page.getByRole('status')).toHaveText('Workspace ready.');
 const licence=await openForm(page,'licence');await licence.getByLabel('Licence status').selectOption('Suspended');await licence.getByLabel('Reason for change').fill('Pause for review');await licence.getByRole('button',{name:'Save licence',exact:true}).click();
 await expect(page.getByRole('status')).toHaveText('Change saved.');await expect(page.locator('.licence .badge').first()).toHaveText('Suspended');
 const create=await openForm(page,'provision');await create.getByLabel('Organisation name',{exact:true}).fill('New Chambers');await create.getByRole('button',{name:'Continue',exact:true}).click();await create.getByLabel('Master Admin account email').fill('client@example.com');await create.getByRole('button',{name:'Continue',exact:true}).click();await create.getByRole('button',{name:'Continue',exact:true}).click();await create.getByLabel('Reason for change').fill('New organisation onboarding');await create.getByRole('button',{name:'Create organisation',exact:true}).click();
 await expect(page.getByRole('status')).toHaveText('Change saved.');await expect(page.locator('#summary')).toContainText('New Chambers');await expect(page.locator('#summary')).toContainText('PendingActivation');await expect(page.locator('#secret')).toHaveValue(/^[a-f0-9]{64}$/);await page.getByRole('button',{name:'Clear secret'}).click();await expect(page.locator('#secret')).toHaveValue('');expect(errors).toEqual([]);
});
test('Master Admin invites a client and the intended account accepts',async({page,browser})=>{
 await login(page,'master');await page.goto(fixture.base+'/admin');await expect(page.getByRole('status')).toHaveText('Workspace ready.');await expect(page.locator('form[data-command="licence"]')).toHaveCount(0);
 const invite=await openForm(page,'invite');await invite.getByLabel('Existing account email').fill('client@example.com');await invite.getByLabel('Membership role').selectOption('Client');await invite.getByLabel('Reason for change').fill('Client membership invitation');await invite.getByRole('button',{name:'Create invitation'}).click();await expect(page.getByRole('status')).toHaveText('Change saved.');const token=await page.locator('#secret').inputValue();
 const context=await require('../../../tests/browser-fixture.js').acknowledgedContext(browser);try{const client=await context.newPage();await login(client,'client');await client.goto(fixture.base+'/admin');await expect(client.getByRole('status')).toHaveText('Workspace ready.');await client.getByLabel('Invitation secret',{exact:true}).fill(token);await client.getByRole('button',{name:'Accept invitation',exact:true}).click();await expect(client.getByRole('status')).toHaveText('Change saved.');await expect(client.getByLabel('Invitation secret',{exact:true})).toHaveValue('');}finally{await context.close();}
 await page.getByRole('button',{name:'Refresh',exact:true}).click();await expect(page.getByRole('status')).toHaveText('Workspace ready.');await page.locator('.admin-sections [data-admin-nav="people"]').click();await expect(page.locator('.person').filter({hasText:'client@example.com'})).toContainText('Active');
});
test('membership assignment, stale edit handling and responsive themes',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await login(page,'master');await page.goto(fixture.base+'/admin');await expect(page.getByRole('status')).toHaveText('Workspace ready.');
 const assignment=await openForm(page,'assignment');await assignment.getByRole('combobox',{name:'Member',exact:true}).selectOption('member');await assignment.getByLabel('Reason for change').fill('Assign case work');await assignment.getByRole('button',{name:'Save app access'}).click();await expect(page.getByRole('status')).toHaveText('Change saved.');
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
  await create.getByLabel('Organisation name',{exact:true}).fill('Invited Master Chambers');
 await create.getByRole('button',{name:'Continue',exact:true}).click();await create.getByLabel('Master Admin account type').selectOption('true');await create.getByLabel('Master Admin account email').fill('invited@example.com');await create.getByRole('button',{name:'Continue',exact:true}).click();await create.getByRole('button',{name:'Continue',exact:true}).click();
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
