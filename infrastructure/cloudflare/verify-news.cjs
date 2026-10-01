// Source reads and temporary browser generation only; never publishes to SQLite.
const assert=require('node:assert/strict');
const {chromium}=require('@playwright/test');
const base=process.argv[2];
const date=process.argv[3]||new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata'}).format(new Date());
if(!['https://apps.sushantsynapse.com','https://sushant-synapse-frontend-preview.bhavik-slvyas.workers.dev'].includes(base))throw Error('Use the production or preview origin');
(async()=>{
  const browser=await chromium.launch({channel:'chrome',headless:true});
  try{
    const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    // Simulate origin outage without stopping it or touching shared editions.
    await page.route(/\/api\/news\/(?!sources)/,route=>route.fulfill({status:503,json:{error:'Verification: origin unavailable'}}));
    const response=await page.goto(base+'/news?date='+date);assert.equal(response.status(),200);
    await page.locator('#device-note').waitFor();await page.locator('#fetch-news').click();
    await page.waitForFunction(()=>document.querySelectorAll('.saved-story').length===10||(!document.querySelector('#fetch-news').disabled&&document.querySelector('#fetch-status').textContent.includes('retry')),{},{timeout:110000});
    assert.equal(await page.locator('.saved-story').count(),10,await page.locator('#fetch-status').textContent());
    assert.equal(await page.locator('.comic-panel').count(),3);
    await page.waitForFunction(()=>[...document.querySelectorAll('.comic-scene')].every(img=>img.complete&&img.naturalWidth>0));
    assert.match(await page.locator('#fetch-status').textContent(),/Not saved to shared archives/);
    await page.getByRole('button',{name:'Dark mode',exact:true}).click();
    for(const width of [320,768,1440]){await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
    await page.screenshot({path:'test-results/news-device-'+(base.includes('workers.dev')?'preview':'production')+'.png',fullPage:true});
    assert.deepEqual(errors,[]);
    console.log(JSON.stringify({base,date,stories:10,comicPanels:3,backend:'simulated unavailable',businessWrites:0,browser:'passed'}));
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
