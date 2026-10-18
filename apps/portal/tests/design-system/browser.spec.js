const {test,expect}=require('@playwright/test');
const {startPreview}=require('../../../../tests/organisation-preview-fixture.cjs');
let runtime;
test.beforeAll(async()=>{runtime=await startPreview({enabled:false});});
test.afterAll(async()=>{await runtime?.stop();});

test('every public app and information page uses shared materials without mobile overflow',async({page,context})=>{
 test.setTimeout(240000);
 await context.route('**/*',r=>/googlesyndication|doubleclick|google-analytics/.test(r.request().url())?r.abort():r.continue());
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const routes=['/','/signin','/support','/sponsor','/contact','/privacy','/terms','/legal','/legal/third-party-notices','/showcase','/confessions','/qr-maker','/photo-resize','/bill-splitter','/focus','/news','/fund-overlap','/timetable-lite','/ritual-assist','/ritual-assist/calendar','/moment-studio','/moment-studio/cards','/take-a-break','/daily-spark','/decision-wheel','/team-mixer','/pocket-pause','/satire-arena','/satire-arena/editor','/satire-arena/daily?sample=1','/satire-arena/characters/namo-nimbus'];
 for(const route of routes){await page.goto(runtime.base+route);await expect(page.locator('link[href*="/shared/premium.css"],link[href*="/home.bundle.css"]'),route).toHaveCount(1);
  for(const width of [320,768,1440])for(const theme of ['light','dark']){await page.setViewportSize({width,height:900});await page.evaluate(t=>{window.SynapseTheme.write(t);document.documentElement.dataset.theme=t;},theme);
   const style=await page.evaluate(()=>{const s=getComputedStyle(document.body),probe=document.createElement('span');probe.style.background='var(--ss-bg)';document.body.append(probe);const expected=getComputedStyle(probe).backgroundColor;probe.remove();return {bg:s.backgroundColor,expected,overflow:document.documentElement.scrollWidth>innerWidth,font:s.fontFamily};});
   expect(style.overflow,route+' '+width+' '+theme).toBe(false);expect(style.bg,route+' uses the canonical canvas').toBe(style.expected);expect(style.font).toMatch(/Inter|Segoe UI|system-ui/);
  }
 }
 await page.goto(runtime.base+'/support');await page.emulateMedia({reducedMotion:'reduce'});expect(await page.locator('.support-hero').evaluate(e=>getComputedStyle(e).animationName)).toBe('none');expect(errors).toEqual([]);
});

test('governance and client screens opt into the same theme without changing access',async({page})=>{
 test.setTimeout(120000);const fixture=await startPreview({chambers:true,multi:true});
 try{await page.request.post(fixture.base+'/api/auth/login',{data:{email:'master@example.com',password:fixture.password}});
  for(const route of ['/account','/admin','/organisation-audit','/platform-audit','/client-access','/client-portal','/super-admin']){await page.goto(fixture.base+route+'?org='+fixture.organisationId);await expect(page.locator('body')).toHaveAttribute('data-ui-app','admin');await expect(page.locator('link[href*="/shared/premium.css"],link[href*="/home.bundle.css"]')).toHaveCount(1);
   for(const width of [320,768,1440])for(const theme of ['light','dark']){await page.setViewportSize({width,height:900});await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),route+' '+width+' '+theme).toBe(true);}
  }
  expect((await page.request.get(fixture.base+'/api/organisation-admin/platform-audit')).status()).toBe(403);
 }finally{await fixture.stop();}
});
