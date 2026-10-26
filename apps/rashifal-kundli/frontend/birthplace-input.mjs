import {searchPlaces,getPlace} from '../../../packages/vedic/places.mjs';
import {placeLabel} from './place-text.mjs';
import {savedCopy} from './saved-kundli.mjs';
// One editable combobox; the hidden select retains the calculation place-ID contract.
export function mountBirthplace(query,select,help,{copy=savedCopy}={}){
 let language='en',matches=[],active=-1;
 const label=query.parentElement,list=document.createElement('div'),message=document.createElement('span');
 label.classList.add('birthplace-combobox');list.id=query.id+'-options';list.className='birthplace-options';list.role='listbox';list.hidden=true;
 message.className='vedic-help';message.role='status';label.append(list,message);select.parentElement.hidden=true;select.required=false;query.required=true;
 query.role='combobox';query.setAttribute('aria-autocomplete','list');query.setAttribute('aria-controls',list.id);query.setAttribute('aria-expanded','false');query.autocomplete='off';
 function close(){list.hidden=true;query.setAttribute('aria-expanded','false');query.removeAttribute('aria-activedescendant');active=-1;}
 function selectPlace(id,notify=true){const place=getPlace(id);select.replaceChildren(new Option(placeLabel(place,language),id,true,true));query.value=placeLabel(place,language);query.setCustomValidity('');message.textContent='';if(notify)query.focus();close();if(notify)select.dispatchEvent(new Event('change',{bubbles:true}));}
 function highlight(){[...list.children].forEach((node,index)=>node.setAttribute('aria-selected',String(index===active)));if(active>=0){query.setAttribute('aria-activedescendant',list.children[active].id);list.children[active].scrollIntoView({block:'nearest'});}else query.removeAttribute('aria-activedescendant');}
 function search(){select.replaceChildren(new Option('',''));query.setCustomValidity(copy[language].choose);matches=[];active=-1;list.replaceChildren();if(query.value.trim().length<2){message.textContent='';close();return;}
  try{matches=searchPlaces(query.value,{limit:12}).matches;}catch{matches=[];}
  for(const place of matches){const option=document.createElement('div');option.role='option';option.id=query.id+'-option-'+list.children.length;option.dataset.placeId=place.id;option.textContent=placeLabel(place,language);option.setAttribute('aria-selected','false');option.addEventListener('mousedown',event=>event.preventDefault());option.addEventListener('click',()=>selectPlace(place.id));list.append(option);select.append(new Option(option.textContent,place.id));}
  message.textContent=matches.length?`${matches.length} ${copy[language].results}`:copy[language].none;list.hidden=!matches.length;query.setAttribute('aria-expanded',String(matches.length>0));
 }
 function keydown(event){if(event.key==='Escape'){close();return;}if(event.key==='ArrowDown'||event.key==='ArrowUp'){if(!matches.length)return;event.preventDefault();list.hidden=false;query.setAttribute('aria-expanded','true');active=(active+(event.key==='ArrowDown'?1:-1)+matches.length)%matches.length;highlight();}else if(event.key==='Enter'&&!list.hidden&&active>=0){event.preventDefault();selectPlace(matches[active].id);}}
 const blur=()=>close();query.addEventListener('input',search);query.addEventListener('keydown',keydown);query.addEventListener('blur',blur);
 // Pointer selection runs on pointerdown before blur on touch devices.
 const pointer=event=>{const option=event.target.closest('[data-place-id]');if(option){event.preventDefault();selectPlace(option.dataset.placeId);}};list.addEventListener('pointerdown',pointer);
 return {select:selectPlace,clear(){select.replaceChildren(new Option('',''));query.value='';query.setCustomValidity('');matches=[];message.textContent='';close();},translate(lang){language=lang;query.setAttribute('aria-label',copy[lang].place);query.placeholder=copy[lang].search;help.textContent=copy[lang].hint;list.setAttribute('aria-label',copy[lang].place);if(select.value){const place=getPlace(select.value);query.value=placeLabel(place,lang);select.options[select.selectedIndex].textContent=query.value;close();}else if(query.value)search();},destroy(){query.removeEventListener('input',search);query.removeEventListener('keydown',keydown);query.removeEventListener('blur',blur);list.removeEventListener('pointerdown',pointer);}};
}
