// Build the reading tree from the same DOM cells and paragraphs used to paint
// the download. Page-local MCIDs point back into that single logical tree.
export function reportStructure(rootId,parentTree,pages,object){
 const roles={ARTICLE:'Document',H1:'H1',H2:'H2',H3:'H3',P:'P',UL:'L',OL:'L',LI:'LI',DT:'P',DD:'P',TABLE:'Table',CAPTION:'Caption',TR:'TR',TH:'TH',TD:'TD',FIGCAPTION:'Figure'};
 const tags=new Map(),roots=[],parents=[];
 let nextId=parentTree+1;
 const ref=id=>id+' 0 R';
 function ensure(node){
  if(!node)return null;
  if(tags.has(node))return tags.get(node);
  const parent=ensure(node.parentElement);
  if(!roles[node.tagName])return parent;
  const tag={id:nextId++,role:roles[node.tagName],parent:parent?.id??rootId,kids:[]};
  tags.set(node,tag);
  (parent?parent.kids:roots).push(ref(tag.id));
  return tag;
 }
 for(const [i,page] of pages.entries()){
  const pageParents=[];parents.push(pageParents);
  let previous,group;
  for(const run of page.runs){
   const tag=ensure(run.node);
   if(!tag){run.group=null;previous=null;continue;}
   if(previous!==tag){
    group=pageParents.length;
    pageParents.push(ref(tag.id));
    tag.kids.push(`<< /Type /MCR /Pg ${ref(3+i*3)} /MCID ${group} >>`);
    previous=tag;
   }
   run.group=group;
  }
 }
 for(const [node,tag] of tags){
  let attributes='';
  if(tag.role==='TH')attributes=node.getAttribute('scope')==='row'?' /A << /O /Table /Scope /Row >>':' /A << /O /Table /Scope /Column >>';
  if(tag.role==='Figure'){
   const houses=Array.from(node.parentElement.querySelectorAll('svg g[data-house] title'),title=>title.textContent);
   const description=[node.textContent,...houses].join(' · ');
   const utf16=description.split('').map(unit=>unit.charCodeAt(0).toString(16).padStart(4,'0')).join('');
   attributes=' /Alt <FEFF'+utf16+'>';
  }
  object(tag.id,`<< /Type /StructElem /S /${tag.role} /P ${ref(tag.parent)} /K [${tag.kids.join(' ')}]${attributes} >>`);
 }
 object(parentTree,`<< /Nums [${parents.map((items,i)=>i+' ['+items.join(' ')+']').join(' ')}] >>`);
 object(rootId,`<< /Type /StructTreeRoot /K [${roots.join(' ')}] /ParentTree ${ref(parentTree)} /ParentTreeNextKey ${pages.length} >>`);
 return tags;
}
