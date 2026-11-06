// Build-owned data only. Recreate canonical field order and values exactly.
export function unpackDirectory({metadata,keys,constants,dictionaries,rows}){
 const fields=keys.filter(key=>!Object.hasOwn(constants,key));
 return {...metadata,places:rows.map(row=>{
  const values=Object.fromEntries(fields.map((key,index)=>[key,
   dictionaries[key]?dictionaries[key][row[index]]:row[index]]));
  return Object.fromEntries(keys.map(key=>[key,Object.hasOwn(constants,key)?constants[key]:values[key]]));
 })};
}
