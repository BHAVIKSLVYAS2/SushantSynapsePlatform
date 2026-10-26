// Older component regressions now enter the explicit Edit/optional-details UI.
async function editBirth(page,selector=''){
 const panel=page.locator('.kundli-input-panel');if(!await panel.count())return;
 if(await panel.getAttribute('open')===null)await panel.locator(':scope>summary').click();
 if(/^#birth-(name|elevation)$/.test(selector)){
  const options=page.locator('.kundli-input-options');
  if(await options.getAttribute('open')===null)await options.locator(':scope>summary').click();
 }
}
module.exports={editBirth};
