// Use the visible mobile controls, keeping calculation values canonical.
async function fillDate(page,selector,value){
 const [year='',month='',day='']=value.split('-');
 await page.locator(selector+'-day').fill(day);
 await page.locator(selector+'-month').selectOption(month?String(Number(month)):'');
 await page.locator(selector+'-year').fill(year);
}
async function fillTime(page,selector,value){
 const [hour='',minute='']=value.split(':');
 await page.locator(selector+'-hour').fill(hour===''?'':String(Number(hour)%12||12));
 await page.locator(selector+'-minute').fill(minute);
 await page.locator(selector+'-period').selectOption(hour===''?'':Number(hour)<12?'AM':'PM');
}
async function openKundliCalculations(page){await page.locator('#kundli-reading-title').waitFor();await page.locator('details[data-kundli-group]').evaluateAll(nodes=>nodes.forEach(node=>node.open=true));}
module.exports={fillDate,fillTime,openKundliCalculations};
