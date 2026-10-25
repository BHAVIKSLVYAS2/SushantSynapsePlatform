const {test,expect}=require('@playwright/test');
const {createPreviewServer}=require('../../../../infrastructure/preview-vedic-charts.cjs');
const {fillDate,fillTime}=require('../../../../tests/vedic-civil-input.cjs');
let server;
test.beforeAll(async()=>{server=await createPreviewServer(0,{birth:true});});
test.afterAll(async()=>{await server.close();});
async function paste(page,selector,text){await page.locator(selector).evaluate((node,text)=>{const data=new DataTransfer();data.setData('text',text);node.dispatchEvent(new ClipboardEvent('paste',{clipboardData:data,bubbles:true,cancelable:true}));},text);}
test('mobile direct entry validates leap dates and distinguishes noon from midnight',async({page})=>{
 await page.setViewportSize({width:320,height:850});await page.goto(server.origin);
 await expect(page.locator('#birth-date')).toBeHidden();await expect(page.locator('#birth-time-period')).toHaveValue('');
 await fillDate(page,'#birth-date','1980-08-15');await expect(page.locator('#birth-date')).toHaveValue('1980-08-15');
 await fillDate(page,'#birth-date','1999-02-29');await expect(page.locator('#birth-date')).toHaveValue('');expect(await page.locator('#birth-date-day').evaluate(n=>n.validationMessage)).toContain('real date');
 await fillDate(page,'#birth-date','2000-02-29');await expect(page.locator('#birth-date')).toHaveValue('2000-02-29');
 await fillTime(page,'#birth-time','00:05');await expect(page.locator('#birth-time-hour')).toHaveValue('12');await expect(page.locator('#birth-time-period')).toHaveValue('AM');await expect(page.locator('#birth-time')).toHaveValue('00:05');
 await page.locator('#birth-time-period').selectOption('PM');await expect(page.locator('#birth-time')).toHaveValue('12:05');
 await page.locator('#birth-time-minute').fill('60');await expect(page.locator('#birth-time')).toHaveValue('');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('paste and language changes preserve partial entries; clear removes all birth data',async({page})=>{
 await page.goto(server.origin);await paste(page,'#birth-date-day','15/08/1980');await expect(page.locator('#birth-date')).toHaveValue('1980-08-15');
 await paste(page,'#birth-time-hour','23:45');await expect(page.locator('#birth-time')).toHaveValue('23:45');
 await page.locator('#birth-date-year').fill('198');
 for(const language of ['hi','gu']){await page.locator('#birth-language').selectOption(language);await expect(page.locator('#birth-date-year')).toHaveValue('198');expect(await page.locator('#birth-date-month option').nth(8).innerText()).toMatch(language==='hi'?/[\u0900-\u097f]/:/[\u0a80-\u0aff]/);}
 await paste(page,'#birth-date-day','૨૦૦૦-૦૨-૨૯');await expect(page.locator('#birth-date')).toHaveValue('2000-02-29');
 await page.locator('form button[type=button]').click();for(const id of ['date','time','date-day','date-year','date-month','time-hour','time-minute','time-period'])await expect(page.locator('#birth-'+id)).toHaveValue('');
});
test('unknown birth time disables segmented time and editing invalidates the review',async({page})=>{
 await page.goto(server.origin);await fillDate(page,'#birth-date','2000-01-01');await fillTime(page,'#birth-time','12:15');await page.locator('#birth-query').fill('New Delhi');await page.locator('#birth-place').selectOption('geonames:1261481');await page.locator('form button[type=submit]').click();await expect(page.locator('#birth-review')).toContainText('2000-01-01');
 await page.locator('#birth-date-year').fill('1980');await expect(page.locator('#birth-review')).toBeEmpty();await page.locator('#birth-accuracy').selectOption('unknown');await expect(page.locator('#birth-time')).toHaveValue('');await expect(page.locator('#birth-time-hour')).toBeDisabled();await expect(page.locator('#birth-time-hour')).toBeHidden();
 await page.locator('#birth-accuracy').selectOption('exact');await expect(page.locator('#birth-time-hour')).toBeEnabled();await expect(page.locator('#birth-time-period')).toHaveValue('');
});
