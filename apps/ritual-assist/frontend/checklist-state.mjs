export const storageKey='synapse-ritual-checklists-v1';
export function readState(raw,guides){
 if(!raw)return {version:1,remember:false,guides:{}};
 if(raw.length>750000)throw Error('Saved checklist is too large.');
 const data=JSON.parse(raw);if(data?.version!==1||typeof data.remember!=='boolean'||!data.guides||Array.isArray(data.guides)||typeof data.guides!=='object')throw Error('Saved checklist could not be read.');
 const result={version:1,remember:data.remember,guides:{}};
 for(const [id,entry]of Object.entries(data.guides)){
  const guide=guides.find(g=>g.id===id);if(!guide)continue;
  if(!entry||!Array.isArray(entry.extras)||entry.extras.length>40||!Array.isArray(entry.checked)||entry.checked.length>300)throw Error('Invalid saved checklist.');
  const ids=new Set();const extras=entry.extras.map(e=>{if(!e||typeof e.id!=='string'||!/^extra-[a-zA-Z0-9-]{1,60}$/.test(e.id)||ids.has(e.id)||typeof e.label!=='string'||!e.label.trim()||[...e.label].length>120)throw Error('Invalid extra item.');ids.add(e.id);return {id:e.id,label:e.label.trim()};});
  const allowed=new Set([...guide.items.map(i=>i.id),...ids]);
  const details={};if(entry.details!==undefined){if(!entry.details||typeof entry.details!=='object'||Array.isArray(entry.details)||Object.keys(entry.details).length>300)throw Error('Invalid saved item details.');for(const [item,value]of Object.entries(entry.details)){if(!allowed.has(item))continue;if(!value||typeof value.quantity!=='string'||value.quantity.length>60||typeof value.arranger!=='string'||value.arranger.length>80)throw Error('Invalid quantity or arranger.');details[item]={quantity:value.quantity,arranger:value.arranger};}}
  result.guides[id]={extras,details,checked:data.remember?entry.checked.filter(v=>typeof v==='string'&&allowed.has(v)):[]};
 }return result;
}
