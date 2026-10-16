import {$,init,copy} from '/shared/local-tools.mjs?v=20261016-wins';
import {split,splitExpenses,money,paise} from './engine.mjs?v=20261016-ease';
init();let result=null,lastMode='equal',undo=null,isExample=false;
const labels={custom:'Individual share (₹)',percentage:'Percentage (%)',shares:'Shares'};
function clear(){result=null;$('#settlement-cards').replaceChildren();liveSummary();$('#result').textContent='Enter who paid, then calculate a fair split.';$('#copy').disabled=true;$('#copy-text').hidden=true;$('#status').textContent='';}
function advanced(){return $('#advanced').checked;}
function liveSummary(){
 if(!advanced()){let text='Enter your bill to get started.';try{if($('#bill-amount').value)text='Bill total: '+money(paise($('#bill-amount').value));}catch{text='Check the bill amount';}$('#entered-total').textContent=text;$('#percentage-status').hidden=true;return;}
 const trip=$('#entry-mode').value==='trip',inputs=trip?[...document.querySelectorAll('[data-expense=amount]')]:[...document.querySelectorAll('[data-field=paid]')];let total=0,valid=true;for(const input of inputs){try{total+=paise(input.value||'0');}catch{valid=false;}}
 $('#entered-total').textContent=valid?'Entered total: '+money(total):'Check the payment amounts';
 const percentage=$('#mode').value==='percentage';$('#percentage-status').hidden=!percentage;if(percentage){let sum=0,ok=true;for(const input of document.querySelectorAll('[data-field=share]')){try{const n=paise(input.value||'0');if(n>10000)ok=false;sum+=n;}catch{ok=false;}}
 $('#percentage-status').textContent=!ok?'Enter valid percentages from 0 to 100.':(sum/100).toFixed(2)+'% entered'+(sum===10000?' · Ready to split':sum<10000?' · '+((10000-sum)/100).toFixed(2)+'% remaining':' · '+((sum-10000)/100).toFixed(2)+'% over');$('#percentage-status').dataset.ready=String(ok&&sum===10000);}
}
function invalidateUndo(){undo=null;$('#undo-removal').hidden=true;}
function removeRow(row,kind){isExample=false;$('#example-notice').hidden=true;undo={row,parent:row.parentElement,next:row.nextSibling,kind};row.remove();$('#undo-removal').hidden=false;syncPayers();clear();$('#status').textContent=kind+' removed. You can undo this removal.';}
$('#undo-removal').onclick=()=>{if(!undo)return;const {row,parent,next}=undo;parent.insertBefore(row,next?.parentElement===parent?next:null);invalidateUndo();syncPayers();sync();clear();$('#status').textContent='Removed entry restored.';};
function personRows(){return [...$('#people').children];}
function syncPayers(){const payer=$('#bill-payer'),saved=payer.value;payer.replaceChildren(...personRows().map((row,i)=>new Option(row.querySelector('[data-field=name]').value.trim()||'Person '+(i+1),row.dataset.id)));if([...payer.options].some(option=>option.value===saved))payer.value=saved;for(const select of document.querySelectorAll('[data-expense=payer]')){const value=select.value;select.replaceChildren(...personRows().map((row,i)=>new Option(row.querySelector('[data-field=name]').value.trim()||'Person '+(i+1),row.dataset.id)));if([...select.options].some(o=>o.value===value))select.value=value;}}
function equalPercent(){const rows=personRows(),base=Math.floor(10000/rows.length),left=10000%rows.length;rows.forEach((row,i)=>row.querySelector('[data-field=share]').value=((base+(i<left?1:0))/100).toFixed(2));clear();}
function sync(){
 const mode=advanced()?$('#mode').value:'equal',trip=advanced()&&$('#entry-mode').value==='trip';
 $('#editor').classList.toggle('simple-split',!advanced());$('#simple-bill').hidden=advanced();$('#bill-amount').disabled=advanced();$('#bill-amount').required=!advanced();$('#bill-payer').disabled=advanced();$('#advanced-options').hidden=!advanced();$('#advanced-options').disabled=!advanced();
 document.querySelectorAll('.custom-share').forEach(cell=>{cell.hidden=mode==='equal';const input=cell.querySelector('input');if(input){input.required=mode!=='equal';input.disabled=mode==='equal';input.setAttribute('aria-label',labels[mode]||'Individual share');cell.dataset.label=labels[mode]||'Share (₹)';}});
 $('#share-heading').textContent=labels[mode]||'Share (₹)';
 document.querySelectorAll('.paid-cell').forEach(cell=>{cell.hidden=!advanced()||trip;const input=cell.querySelector('input');if(input)input.disabled=!advanced()||trip;});
 $('#expenses-section').hidden=!trip;document.querySelectorAll('#expenses-section input,#expenses-section select').forEach(input=>input.disabled=!trip);
 $('#equal-percent').hidden=mode!=='percentage';
 const help={equal:'Everyone has an equal share. Extra paise go to the first people listed.',custom:'Enter each person’s total share in rupees. Shares must match the total paid.',percentage:'Percentages must total 100%. Up to two decimal places are supported.',shares:'Use relative shares: 2, 1, 1 means half, a quarter and a quarter. Zero excludes someone from the cost.'};
 $('#split-help').textContent=help[mode]+(trip?' The same split applies to the combined total of all expenses.':' Enter each person’s total paid.');
}
function add(name='',paid='0'){
 invalidateUndo();
 if(personRows().length>=20){$('#status').textContent='Add up to 20 people.';return;}
 const row=document.createElement('tr');row.dataset.id=crypto.randomUUID();
 for(const [field,value]of [['name',name],['paid',paid],['share',$('#mode').value==='shares'?'1':'0']]){
  const cell=document.createElement('td'),input=document.createElement('input');cell.dataset.label=field==='name'?'Name':field==='paid'?'Paid (₹)':'Share (₹)';input.dataset.field=field;input.className=field==='name'?'participant-name':'paid';input.value=value;input.required=true;input.setAttribute('aria-label',field==='name'?'Person name':field==='paid'?'Amount paid':'Individual share');if(field==='name')input.maxLength=50;else{input.inputMode='decimal';input.maxLength=11;}if(field==='share')cell.className='custom-share';if(field==='paid')cell.className='paid-cell';cell.append(input);row.append(cell);
 }
 const cell=document.createElement('td'),remove=document.createElement('button');remove.type='button';remove.textContent='×';remove.setAttribute('aria-label','Remove person');remove.onclick=()=>{if(personRows().length<=2){$('#status').textContent='Keep at least two people.';return;}if([...document.querySelectorAll('[data-expense=payer]')].some(s=>s.value===row.dataset.id)){$('#status').textContent='Change or remove this person’s expenses before removing them.';return;}removeRow(row,'Person');};cell.append(remove);row.append(cell);$('#people').append(row);sync();syncPayers();clear();
}
function addExpense(){
 invalidateUndo();
 if($('#expenses').children.length>=100){$('#status').textContent='Add up to 100 expenses.';return;}
 const fieldset=document.createElement('fieldset');fieldset.className='expense-row';const legend=document.createElement('legend');legend.textContent='Expense';fieldset.append(legend);
 for(const [field,label]of [['title','What was it for?'],['payer','Who paid?'],['amount','Amount (₹)']]){
  const wrapper=document.createElement('label');wrapper.textContent=label;const input=document.createElement(field==='payer'?'select':'input');input.dataset.expense=field;if(field!=='payer'){input.maxLength=field==='title'?80:11;input.required=field==='amount';if(field==='amount')input.inputMode='decimal';else input.placeholder='e.g. Dinner or train tickets';}wrapper.append(input);fieldset.append(wrapper);
 }
 const remove=document.createElement('button');remove.type='button';remove.textContent='Remove expense';remove.onclick=()=>removeRow(fieldset,'Expense');fieldset.append(remove);$('#expenses').append(fieldset);syncPayers();sync();clear();
}
$('#add').onclick=()=>add();$('#add-expense').onclick=addExpense;$('#equal-percent').onclick=equalPercent;
$('#mode').onchange=()=>{const mode=$('#mode').value;for(const row of personRows()){const input=row.querySelector('[data-field=share]');input.dataset[lastMode]=input.value;input.value=input.dataset[mode]??(mode==='shares'?'1':'0');}if(mode==='percentage'&&personRows().every(row=>!row.querySelector('[data-field=share]').dataset.percentage))equalPercent();lastMode=mode;sync();clear();};
$('#entry-mode').onchange=()=>{if($('#entry-mode').value==='trip'&&!$('#expenses').children.length)addExpense();sync();clear();};
$('#editor').addEventListener('input',event=>{invalidateUndo();isExample=false;$('#example-notice').hidden=true;if(event.target.dataset.field==='name')syncPayers();clear();});
$('#editor').onsubmit=e=>{e.preventDefault();try{
 const elements=personRows(),rows=elements.map(row=>Object.fromEntries([...row.querySelectorAll('input')].map(input=>[input.dataset.field,input.value])));
 if(!advanced()){const payer=elements.findIndex(row=>row.dataset.id===$('#bill-payer').value);if(payer<0)throw Error('Choose who paid the bill.');const amount=$('#bill-amount').value;result=split(rows.map((row,i)=>({...row,paid:i===payer?amount:'0'})),'equal');}else if($('#entry-mode').value==='trip'){const expenses=[...$('#expenses').children].map(row=>{const get=f=>row.querySelector('[data-expense='+f+']').value;return {title:get('title'),amount:get('amount'),payer:elements.findIndex(person=>person.dataset.id===get('payer'))};});result=splitExpenses(rows,expenses,$('#mode').value);}else result=split(rows,$('#mode').value);
 const title=advanced()?$('#group-title').value.trim():'',expenseText=result.expenses?'\n\nExpenses\n'+result.expenses.map(e=>e.title+' · '+e.payer+' paid '+money(e.amount)).join('\n'):'';
 $('#result').textContent=(title?title+'\n\n':'')+'Total: '+money(result.total)+expenseText+'\n\n'+result.people.map(p=>p.name+' · paid '+money(p.paid)+' · share '+money(p.share)).join('\n')+'\n\n'+(result.transfers.length?result.transfers.map(t=>t.from+' pays '+t.to+' '+money(t.amount)).join('\n'):'Everyone is settled.');
 $('#entered-total').textContent='Total to split: '+money(result.total);
 $('#settlement-cards').replaceChildren();const cards=result.transfers.length?result.transfers:[{from:'Everyone is settled',to:'',amount:0}];for(const transfer of cards){const card=document.createElement('article');card.className='settlement-card';const who=document.createElement('p'),amount=document.createElement('strong');who.textContent=transfer.to?transfer.from+' pays '+transfer.to:transfer.from;amount.textContent=money(transfer.amount);card.append(who,amount);$('#settlement-cards').append(card);}
 document.querySelectorAll('[data-step]').forEach(button=>{if(button.dataset.step==='settle')button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');});$('#settle-step').focus();
 $('#copy').disabled=false;$('#status').textContent='Split calculated. No money has been transferred.';
 }catch(error){clear();$('#status').textContent=error.message;}};
$('#copy').onclick=()=>{if(result)copy($('#result').textContent+'\n\nCreated with Sushant Synapse · Bill Splitter\n'+location.origin+'/bill-splitter');};
function reset(example,focus=true){if(!isExample&&($('#bill-amount').value||personRows().some(r=>r.querySelector('[data-field=name]').value.trim())||$('#expenses').children.length)&&!confirm('Replace the current people and expenses?'))return;invalidateUndo();$('#people').replaceChildren();$('#expenses').replaceChildren();$('#group-title').value='';$('#advanced').checked=example;$('#bill-amount').value='';$('#mode').value='equal';lastMode='equal';$('#entry-mode').value='bill';isExample=example;$('#example-notice').hidden=!example;if(example){add('Aarav','600');add('Meera','0');add('Neel','0');}else{add();add();}sync();clear();document.querySelectorAll('[data-step]').forEach(b=>b.removeAttribute('aria-current'));document.querySelector('[data-step=people]').setAttribute('aria-current','step');if(focus)(example?$('#people-step'):$('#bill-amount')).focus();}
 $('#fresh').onclick=()=>reset(false);$('#example').onclick=()=>reset(true);
 document.querySelectorAll('[data-step]').forEach(button=>button.onclick=()=>{document.querySelectorAll('[data-step]').forEach(b=>b.removeAttribute('aria-current'));button.setAttribute('aria-current','step');if(button.dataset.step==='settle'){$('#editor').requestSubmit();return;}const target=button.dataset.step==='expenses'&&$('#entry-mode').value==='trip'?$('#expenses-step'):$('#people-step');target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});target.focus();});
 $('#advanced').onchange=()=>{invalidateUndo();sync();clear();};
 reset(false,false);
