const {test,expect}=require('../../../../tests/browser-fixture.js');
const {startPreview}=require('../../../../tests/organisation-preview-fixture.cjs');
const {setTheme}=require('../../../../tests/browser-theme');
let fixture,base;
test.beforeAll(async()=>{fixture=await startPreview({enabled:false});base=fixture.base;});
test.afterAll(async()=>{await fixture?.stop();});
for(const language of ['hi','gu']){
 test(language+' translated controls fit all themes and phone widths',async({page})=>{
  await page.addInitScript(l=>localStorage.setItem('synapse-language',l),language);
  for(const route of ['/take-a-break?game=24','/bill-splitter','/ritual-assist/guides','/photo-resize']){
   await page.goto(base+route);if(route.includes('guides'))await page.locator('#guide-title').waitFor();
   for(const width of [320,390,1440])for(const theme of ['light','dark','deep']){await page.setViewportSize({width,height:900});await setTheme(page,theme);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),language+' '+route+' '+width+' '+theme).toBe(true);}
  }
 });
 test(language+' Face-Off keeps literal titles and choices through a result and language switches',async({page})=>{
  await page.addInitScript(l=>localStorage.setItem('synapse-language',l),language);await page.goto(base+'/take-a-break?game=face');await page.locator('.face-editor [name=title]').fill('Home');await page.locator('.face-editor [name=choices]').fill('Home\nOptions');await page.locator('.face-editor button[type=submit]').click();await expect(page.locator('.face-pair button').first()).toHaveText('Home');await expect(page.locator('.face-pair button').last()).toHaveText('Options');await page.locator('.face-pair button').first().click();await expect(page.locator('.result-card h3')).toHaveText('Home');await page.evaluate(()=>SynapseLanguage.set('en'));await page.evaluate(l=>SynapseLanguage.set(l),language);await expect(page.locator('.face-title')).toHaveText('Home');await expect(page.locator('.result-card h3')).toHaveText('Home');await expect(page.locator('.face-history')).toContainText('Options');
 });
 test(language+' photo validation and generated checks translate without changing pixels',async({page})=>{
  await page.addInitScript(l=>localStorage.setItem('synapse-language',l),language);await page.goto(base+'/photo-resize');
  const image=await page.evaluate(()=>{const canvas=document.createElement('canvas');canvas.width=canvas.height=64;canvas.getContext('2d').fillRect(0,0,64,64);return canvas.toDataURL('image/png').split(',')[1];});
  await page.locator('#photo').setInputFiles({name:'Home.png',mimeType:'image/png',buffer:Buffer.from(image,'base64')});await expect(page.locator('#create')).toBeEnabled();await page.locator('#dimensions summary').click();await page.locator('#minimum').fill('500');await page.locator('#create').click();await expect(page.locator('#status')).toHaveText(language==='hi'?'न्यूनतम KB शून्य और अधिकतम KB के बीच हो।':'ન્યૂનતમ KB શૂન્ય અને મહત્તમ KB વચ્ચે હોવા જોઈએ.');
  await page.locator('#minimum').fill('0');await page.locator('#create').click();await expect(page.locator('#checks h3')).toHaveText(language==='hi'?'डिजिटल आकार जाँच सफल':'ડિજિટલ કદની તપાસ સફળ');await expect(page.locator('#checks li').first()).toContainText(language==='hi'?'फ़ाइल फ़ॉर्मैट':'ફાઇલનું ફોર્મેટ');
  await page.evaluate(()=>SynapseLanguage.set('en'));await expect(page.locator('#checks h3')).toHaveText('Digital size checks pass');await page.evaluate(l=>SynapseLanguage.set(l),language);await expect(page.locator('#width')).toHaveValue('1600');await expect(page.locator('#checks li').first()).not.toContainText('File format');
 });
 test(language+' public controls, dropdowns and progress survive language changes',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(l=>localStorage.setItem('synapse-language',l),language);await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto(base+'/take-a-break?game=24&level=challenge');await expect(page.locator('#new-game')).toHaveText(language==='hi'?'नया खेल':'નવી રમત');
  await page.locator('#round-options').click();await expect(page.locator('#restart-round')).toHaveText(language==='hi'?'यह पहेली फिर शुरू करें':'આ કોયડો ફરી શરૂ કરો');
  const difficulty=page.locator('#practice-difficulty');await expect(difficulty).toHaveValue('challenge');await expect(difficulty.locator('option[value=expert]')).toHaveText(language==='hi'?'कठिन':'અઘરું');await expect(difficulty.locator('option[value=challenge]')).not.toHaveText('Challenge');
  await difficulty.selectOption('expert');await expect(page.locator('#difficulty-note')).not.toContainText('A tougher spark');
  const tile=page.locator('#numbers button').first();await tile.click();const value=await tile.textContent();
  await page.evaluate(()=>SynapseLanguage.set('en'));await expect(page.locator('#new-game')).toHaveText('New game');await page.evaluate(l=>SynapseLanguage.set(l),language);await expect(tile).toHaveAttribute('aria-pressed','true');expect((await tile.textContent()).match(/\d+/)[0]).toBe(value.match(/\d+/)[0]);
  await page.locator('#round-options').click();let dialogMessage;page.once('dialog',async dialog=>{dialogMessage=dialog.message();await dialog.dismiss();});await difficulty.selectOption('warmup');await expect(difficulty).toHaveValue('expert');expect(dialogMessage).toMatch(language==='hi'?/[\u0900-\u097f]/:/[\u0a80-\u0aff]/);
  expect(errors).toEqual([]);
 });
 test(language+' Bill Splitter protects names and amounts in controls, settlement and copy',async({page})=>{
  await page.addInitScript(l=>localStorage.setItem('synapse-language',l),language);await page.goto(base+'/bill-splitter');await page.locator('#example').click();await page.locator('[data-name]').first().fill('Home');await page.locator('[data-name]').nth(1).fill('Options');
  await expect(page.locator('.shared-people span').filter({hasText:/^Home$/}).first()).toHaveText('Home');await expect(page.locator('.settlement-card').first()).toContainText('Home');await expect(page.locator('.settlement-card').first()).toContainText('Options');
  await expect(page.locator('.settlement-card').first()).toContainText(language==='hi'?'भुगतान करेगा':'ચૂકવશે');await expect(page.locator('#result')).toContainText('Home');const amount=await page.locator('#entered-total').textContent();
  await page.evaluate(()=>SynapseLanguage.set('en'));await expect(page.locator('.settlement-card').first()).toContainText('pays');await page.evaluate(l=>SynapseLanguage.set(l),language);await expect(page.locator('[data-name]').first()).toHaveValue('Home');await expect(page.locator('#entered-total')).toHaveText(amount);
 });
 test(language+' Picksy preserves literal choices while translating status and controls',async({page})=>{
  await page.addInitScript(l=>localStorage.setItem('synapse-language',l),language);await page.emulateMedia({reducedMotion:'reduce'});await page.goto(base+'/decision-wheel');await expect(page.locator('#edit-choices')).toHaveText(language==='hi'?'विकल्प बदलें':'વિકલ્પો બદલો');await page.locator('#options').fill('Home\nOptions');await page.locator('#spin').click();await expect(page.locator('#winner')).toHaveText(/^(Home|Options)$/);await expect(page.locator('#count')).not.toContainText('EQUAL CHOICES');
  const winner=await page.locator('#winner').textContent();await page.evaluate(()=>SynapseLanguage.set('en'));await page.evaluate(l=>SynapseLanguage.set(l),language);await expect(page.locator('#winner')).toHaveText(winner);await expect(page.locator('#options')).toHaveValue('Home\nOptions');await expect(page.locator('.wheel-sound')).not.toContainText('Tick sound');
  await page.locator('#options').fill('Home\nHome');await page.locator('#spin').click();await expect(page.locator('#options-error')).toContainText('"Home"');await expect(page.locator('#options-error')).toContainText(language==='hi'?'इन पंक्तियों में':'આ લીટીઓમાં');await expect(page.locator('#options-error')).not.toContainText('on lines');await page.evaluate(()=>SynapseLanguage.set('en'));await expect(page.locator('#options-error')).toContainText('on lines');
 });
 test(language+' audited public tools translate instructions and keep mobile layout',async({page})=>{
  await page.addInitScript(l=>localStorage.setItem('synapse-language',l),language);await page.setViewportSize({width:390,height:844});const script=language==='hi'?/[\u0900-\u097f]/:/[\u0a80-\u0aff]/;
  for(const [route,selector]of [['/photo-resize','label:has(#document-kind)'],['/timetable-lite','button[type=submit]'],['/ritual-assist/guides','#share-checklist']]){
   await page.goto(base+route);if(route.includes('guides'))await page.locator('#guide-title').waitFor();
   if(route==='/photo-resize'){await expect(page.locator('#document-kind option[value=photo]')).toHaveText(language==='hi'?'फोटो':'ફોટો');await expect(page.locator('#fit')).toHaveValue('fit');}
   else if(route==='/timetable-lite'){await page.locator('#steps [data-step="1"]').click();await expect(page.getByRole('button',{name:language==='hi'?'कक्षा जोड़ें':'વર્ગ ઉમેરો',exact:true})).toBeVisible();}
   else {await expect(page.getByRole('button',{name:language==='hi'?'चित्र साझा करें':'ચિત્ર શેર કરો',exact:true})).toBeVisible();await expect(page.locator('[data-ritual-section=dates]')).toHaveText(language==='hi'?'व्रत तिथियाँ':'વ્રતની તારીખો');await expect(page.locator('.ritual-task-header p')).toHaveText(language==='hi'?'अनुष्ठान चुनें, फिर सामग्री की व्यवस्था करें और टिक लगाएँ।':'વિધિ પસંદ કરો, પછી તેની સામગ્રી ગોઠવો અને ટિક કરો.');}
   await expect(page.locator('html')).toHaveAttribute('lang',language);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),route).toBe(true);
  }
  await page.screenshot({path:'.publish/public-language-'+language+'.png'});
 });
}
