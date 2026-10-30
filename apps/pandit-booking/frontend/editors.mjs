// Structured controls submit the existing canonical API shapes. No browser storage.
export function createEditors({field,select,button,local,utc}){
 const windowRow=(value={})=>`<div class="editor-row" data-window-row>${field('windowStart','Starts · IST','datetime-local',value.start?local(value.start):'','required')}${field('windowEnd','Ends · IST','datetime-local',value.end?local(value.end):'','required')}${button('remove-window','Remove time slot')}</div>`;
 const itemRow=(value={})=>`<div class="editor-row checklist-row" data-item-row>${field('itemText','Preparation item','text',value.text||'','required maxlength="150"')}${select('responsibility','Responsible person',[['Customer','Customer'],['Pandit','Pandit']],value.responsibility||'Customer',true)}<label class="check"><input name="itemDone" type="checkbox" ${value.done?'checked':''}>Done</label>${button('remove-item','Remove item')}</div>`;
 return {
  windowRow,itemRow,
  availability:windows=>`<p>Choose start and end dates in IST. Each slot can be up to 12 hours. Keep confirmed bookings covered.</p><div data-window-list>${(windows.length?windows:[{}]).map(windowRow).join('')}</div>${button('add-window','Add time slot')}`,
  checklist:items=>`<div data-item-list>${items.map(itemRow).join('')}</div>${button('add-item','Add preparation item')}`,
  readWindows:form=>[...form.querySelectorAll('[data-window-row]')].map(row=>({start:utc(row.querySelector('[name=windowStart]').value),end:utc(row.querySelector('[name=windowEnd]').value)})),
  readItems:form=>[...form.querySelectorAll('[data-item-row]')].map(row=>({text:row.querySelector('[name=itemText]').value,responsibility:row.querySelector('[name=responsibility]').value,done:row.querySelector('[name=itemDone]').checked}))
 };
}
