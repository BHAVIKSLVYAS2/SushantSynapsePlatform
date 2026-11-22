const labels={
 en:['Daily & name mantras','Gayatri collection','Navagraha','Prayers & scripture','Shiva & Rudram','Puja readings'],
 hi:['दैनिक और नाम मंत्र','गायत्री संग्रह','नवग्रह','प्रार्थना और शास्त्र','शिव और रुद्रम्','पूजा पाठ'],
 gu:['દૈનિક અને નામ મંત્ર','ગાયત્રી સંગ્રહ','નવગ્રહ','પ્રાર્થના અને શાસ્ત્ર','શિવ અને રુદ્રમ્','પૂજા પાઠ']
};
// Browsing shelves only; scripture text and existing filter metadata stay intact.
function shelf(id){
 if(id.startsWith('puja-'))return 5;
 if(id.startsWith('rudra'))return 4;
 if(id.startsWith('gayatri-')||id==='reading-surya-gayatri')return 1;
 if(id.startsWith('navagraha-')||id==='reading-navagraha')return 2;
 if(id.startsWith('reading-'))return 3;
 return 0;
}
export function mountLibraryIndex(library,rows){
 const groups=labels.en.map((_,i)=>{
  const node=document.createElement('details'),summary=document.createElement('summary'),title=document.createElement('span'),count=document.createElement('span'),body=document.createElement('div');
  node.className='library-index-group';body.className='library-index-entries';count.className='library-group-count';title.setAttribute('role','heading');title.setAttribute('aria-level','3');summary.append(title,count);node.append(summary,body);library.append(node);
  summary.addEventListener('click',()=>{if(!node.open)for(const group of groups)if(group.node!==node)group.node.open=false;});
  return {node,title,count,body,rows:rows.filter(row=>shelf(row.m.id)===i)};
 });
 for(const group of groups)group.count.textContent=String(group.rows.length);
 groups[0].node.open=true;
 let returning=null;
 return {
  reveal(row){returning=row;},
  paint(language,active,filtered){
   library.classList.toggle('library-direct-results',filtered);
   for(const [i,group]of groups.entries()){
    group.title.textContent=(labels[language]||labels.en)[i];group.node.hidden=!!active||filtered;
    if(returning&&!active&&!filtered)group.node.open=group.rows.includes(returning);
    for(const row of group.rows){const parent=active===row||filtered?library:group.body;if(row.card.parentNode!==parent)parent.append(row.card);}
   }
   // Direct results retain the catalogue order used by Previous/Next reading.
   if(filtered)for(const row of rows)library.append(row.card);
   if(!active)returning=null;
  }
 };
}
