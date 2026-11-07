import {$,init,copy} from '/shared/local-tools.mjs?v=20261016-wins';
import {splitGroup,money} from './engine.mjs?v=20261107-simple';
init();
let result=null,example=false,showErrors=false;
const people=()=>[...$('#people').children];
const expenses=()=>[...document.querySelectorAll('.expense-row')];
const nameOf=card=>card.querySelector('[data-name]').value.trim();
const labelOf=card=>nameOf(card)||'Person '+(people().indexOf(card)+1);
function node(tag,className,text){const e=document.createElement(tag);e.className=className;if(text!==undefined)e.textContent=text;return e;}
function button(text,action,className=''){const e=node('button',className,text);e.type='button';e.onclick=action;if(className.startsWith('remove-')){e.setAttribute('aria-label',text);e.title=text;e.textContent='';const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d','M6 6l12 12M18 6 6 18');svg.append(path);e.append(svg);}return e;}
function clear(){result=null;$('#settlement-cards').replaceChildren();$('#result').textContent='';$('#copy').disabled=true;$('#copy-text').hidden=true;$('#copy-text').value='';}
function calculate(force=false){
 clear();
 const cards=people(),entries=expenses().filter(row=>row.querySelector('[data-title]').value.trim()||row.querySelector('[data-amount]').value.trim());
 $('#settlement').hidden=!entries.length;
 if(!entries.length){$('#status').textContent='Add names and an expense to get started.';return;}
 try{
  result=splitGroup(cards.map(card=>({name:nameOf(card)})),entries.map(row=>({title:row.querySelector('[data-title]').value,amount:row.querySelector('[data-amount]').value,payer:cards.indexOf(row.closest('.person-card')),...(row.shared===null?{}:{members:row.shared.map(id=>cards.findIndex(card=>card.dataset.id===id))})})));
  showErrors=true;$('#entered-total').textContent='Total: '+money(result.total);
  if(!result.transfers.length)$('#settlement-cards').append(node('p','settled','Everyone is settled.'));
  for(const t of result.transfers){const card=node('article','settlement-card');card.append(node('span','',t.from+' pays '+t.to),node('strong','',money(t.amount)));$('#settlement-cards').append(card);}
  $('#result').textContent='Total: '+money(result.total)+'\n\n'+result.expenses.map(e=>e.payer+' paid '+money(e.amount)+' - '+e.title+'\nShared by: '+e.members.join(', ')).join('\n\n')+'\n\n'+result.people.map(p=>p.name+' - paid '+money(p.paid)+' - share '+money(p.share)).join('\n')+'\n\n'+(result.transfers.length?result.transfers.map(t=>t.from+' pays '+t.to+' '+money(t.amount)).join('\n'):'Everyone is settled.');
  $('#copy').disabled=false;$('#status').textContent='';
 }catch(error){result=null;$('#entered-total').textContent='Finish the entries to see the split.';$('#status').textContent=showErrors||force?error.message:'Add everyone\'s name and a valid expense amount.';}
}
function updateSharing(){
 const cards=people();
 for(const row of expenses()){
  const details=row.querySelector('details'),summary=details.querySelector('summary'),list=details.querySelector('.shared-people');
  const focused=[...list.querySelectorAll('input')].indexOf(document.activeElement);
  summary.textContent=row.shared===null?'Shared by everyone':row.shared.length?'Shared by '+row.shared.map(id=>labelOf(cards.find(c=>c.dataset.id===id))).join(', '):'Choose who shares';list.replaceChildren();
  const all=node('label','shared-option'),allInput=node('input','');allInput.type='checkbox';allInput.checked=row.shared===null;all.append(allInput,document.createTextNode('Everyone'));list.append(all);
  allInput.onchange=()=>{row.shared=allInput.checked?null:[];changed();updateSharing();};
  for(const card of cards){const label=node('label','shared-option'),input=node('input','');input.type='checkbox';input.checked=row.shared===null||row.shared.includes(card.dataset.id);label.append(input,document.createTextNode(labelOf(card)));list.append(label);input.onchange=()=>{
   const selected=new Set(row.shared===null?cards.map(c=>c.dataset.id):row.shared);if(input.checked)selected.add(card.dataset.id);else selected.delete(card.dataset.id);
   row.shared=[...selected];changed();updateSharing();
  };}
  if(focused>=0)list.querySelectorAll('input')[focused]?.focus({preventScroll:true});
 }
}
function changed(){example=false;$('#example-notice').hidden=true;calculate();}
function addExpense(card,values={},focus=true){
 if(expenses().length>=100){$('#status').textContent='Add up to 100 expenses.';return;}
 const row=node('div','expense-row');row.shared=values.members??null;
 const titleLabel=node('label','','What was it for?'),title=node('input','');title.dataset.title='';title.placeholder='e.g. Dinner';title.maxLength=80;title.value=values.title||'';titleLabel.append(title);
 const amountLabel=node('label','','Amount (\u20b9)'),amount=node('input','');amount.dataset.amount='';amount.inputMode='decimal';amount.maxLength=11;amount.placeholder='0.00';amount.value=values.amount||'';amountLabel.append(amount);
 const details=node('details','sharing');details.append(node('summary','','Shared by everyone'),node('div','shared-people'));
 row.append(titleLabel,amountLabel,button('Remove expense',()=>{row.remove();changed();},'remove-expense'),details);card.querySelector('.person-expenses').append(row);updateSharing();calculate();if(focus)title.focus();return row;
}
function addPerson(name='',focus=true){
 if(people().length>=20){$('#status').textContent='Add up to 20 people.';return;}
 const card=node('section','person-card');card.dataset.id=crypto.randomUUID();
 const header=node('div','person-heading'),label=node('label','','Name'),input=node('input','');input.dataset.name='';input.maxLength=50;input.placeholder='Person '+(people().length+1);input.value=name;label.append(input);
 const remove=button('Remove person',()=>{
  if(people().length<=2){$('#status').textContent='Keep at least two people.';return;}
  const entered=[...card.querySelectorAll('.expense-row input')].some(e=>e.type!=='checkbox'&&e.value.trim());
  if(entered&&!confirm('Remove '+labelOf(card)+' and their expenses?'))return;
  card.remove();for(const row of expenses())if(row.shared!==null)row.shared=row.shared.filter(id=>id!==card.dataset.id);
  changed();updateSharing();$('#add').focus();
 },'remove-person');
 header.append(label,remove);card.append(header,node('div','person-expenses'),button('Add expense',()=>addExpense(card),'add-expense'));$('#people').append(card);updateSharing();calculate();if(focus)input.focus();return card;
}
$('#editor').addEventListener('input',event=>{if(event.target.type==='checkbox')return;changed();if(event.target.hasAttribute('data-name'))updateSharing();});
$('#editor').onsubmit=event=>{event.preventDefault();calculate(true);};
$('#add').onclick=()=>{addPerson();changed();};
$('#copy').onclick=()=>{if(result)copy($('#result').textContent+'\n\nCreated with Sushant Synapse - Bill Splitter\n'+location.origin+'/bill-splitter');};
function reset(sample=false,initial=false){
 const entered=people().some(card=>nameOf(card))||expenses().some(row=>[...row.querySelectorAll('input')].some(input=>input.type!=='checkbox'&&input.value.trim()));
 if(!initial&&!example&&entered&&!confirm('Replace the current people and expenses?'))return;
 $('#people').replaceChildren();showErrors=false;
 if(sample){const a=addPerson('Aarav',false),b=addPerson('Meera',false);addPerson('Neel',false);addExpense(a,{title:'Dinner',amount:'1200'},false);addExpense(b,{title:'Taxi',amount:'300'},false);}
 else {const a=addPerson('',false);addPerson('',false);addExpense(a,{},false);}
 example=sample;$('#example-notice').hidden=!sample;calculate();if(!initial)people()[0].querySelector('[data-name]').focus();
}
$('#fresh').onclick=()=>reset();$('#example').onclick=()=>reset(true);
reset(false,true);
