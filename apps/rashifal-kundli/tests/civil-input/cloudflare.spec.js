const {editBirth}=require('../../../../tests/vedic-kundli-journey.cjs');
const {test,expect}=require('@playwright/test');
const {fillDate,fillTime}=require('../../../../tests/vedic-civil-input.cjs');
let server;
test.beforeAll(async()=>{server=await require('../production-server.cjs').start();});
test.afterAll(async()=>{await server.close();});
test('production mobile controls retain Gujarati, swap distinct birth records and sync exploration actions',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.addInitScript(()=>localStorage.setItem('synapse-language','gu'));
 await page.goto(server.origin+'/rashifal-kundli');await expect(page.locator('html')).toHaveAttribute('lang','gu');await expect(page.locator('#birth-date-month option').nth(8)).toContainText('ઑગસ્ટ');
 await editBirth(page,'#birth-date');await fillDate(page,'#birth-date','1980-08-15');await editBirth(page,'#birth-time');await fillTime(page,'#birth-time','00:05');await expect(page.locator('#birth-time')).toHaveValue('00:05');await expect(page.locator('#birth-time-period')).toHaveValue('AM');
 await page.locator('.civil-input').first().screenshot({path:test.info().outputPath('mobile-birth-date.png')});
 await page.goto(server.origin+'/rashifal-kundli/matching');await expect(page.locator('#match-a-date-day')).toBeDisabled();await page.locator('#matching-consent').check();
 await fillDate(page,'#match-a-date','1980-08-15');await fillDate(page,'#match-b-date','1990-02-28');await fillTime(page,'#match-a-time','00:05');await fillTime(page,'#match-b-time','23:45');await page.locator('#matching-swap').click();
 await expect(page.locator('#match-a-date')).toHaveValue('1990-02-28');await expect(page.locator('#match-a-date-year')).toHaveValue('1990');await expect(page.locator('#match-a-time-hour')).toHaveValue('11');await expect(page.locator('#match-a-time-period')).toHaveValue('PM');await expect(page.locator('#match-b-time-period')).toHaveValue('AM');
 await page.locator('#matching-clear').click();await expect(page.locator('#match-a-date-year')).toHaveValue('');await expect(page.locator('#match-a-date-day')).toBeDisabled();
 await page.goto(server.origin+'/rashifal-kundli/time-machine');await expect(page.locator('html')).toHaveAttribute('lang','gu');await fillDate(page,'#tm-date','2030-01-01');await page.locator('#tm-next').click();await expect(page.locator('#tm-date-day')).toHaveValue('02');await expect(page.locator('#tm-date')).toHaveValue('2030-01-02');
 await page.locator('#tm-now').click();const time=await page.locator('#tm-time').inputValue();await expect(page.locator('#tm-time-hour')).toHaveValue(String(Number(time.slice(0,2))%12||12));await expect(page.locator('#tm-time-period')).toHaveValue(Number(time.slice(0,2))<12?'AM':'PM');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
