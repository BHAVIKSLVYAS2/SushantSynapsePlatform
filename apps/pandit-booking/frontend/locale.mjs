import {copy,text} from './copy.mjs';

let language='en',registered=false,scheduled=false;
const originals=new WeakMap(),attributes=new WeakMap();
export const checklistLine=item=>`${text(item.responsibility,language)} | ${text(item.done?'done':'pending',language)} | ${item.text}`;
export const canonical=value=>{
 for(const key of ['Customer','Pandit','pending','done'])if(key===value||copy[key].includes(value))return key;
 return value;
};
export function translateMessage(message,locale=language){
 const suffix=' Open My account to sign in again.';
 if(message.endsWith(suffix))return translateMessage(message.slice(0,-suffix.length),locale)+' '+text(suffix.trim(),locale);
 if(copy[message]||locale==='en')return text(message,locale);
 let match=/^(.+): use (\d+)–(\d+) characters$/.exec(message);
 if(match){const label=text(match[1],locale);return locale==='hi'?`${label}: ${match[2]} से ${match[3]} अक्षर लिखें`:`${label}: ${match[2]} થી ${match[3]} અક્ષર લખો`;}
 match=/^Invalid (.+)$/.exec(message);
 if(match){const label=text(match[1],locale);return locale==='hi'?`${label} मान्य नहीं है`:`${label} માન્ય નથી`;}
 // Transport/internal errors are not user content. Keep the original available
 // to support while presenting a translated recovery instruction.
 return text('Please refresh and try again.',locale);
}

function sourceText(node){
 let record=originals.get(node);
 if(!record||record.last!==node.data){record={source:node.data,last:node.data};originals.set(node,record);}
 return record;
}
function apply(){
 for(const root of document.querySelectorAll('main,#detail')){
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  while(walker.nextNode()){
   const node=walker.currentNode,parent=node.parentElement;
   if(!parent||parent.closest('script,style,textarea,input,[data-language-preserve],[data-booking-time],#notice'))continue;
   const record=sourceText(node),source=record.source.trim(),value=text(source,language);
   // Combined badges/counts keep only their app-authored words translatable.
   const next=record.source.replace(source,value);
   if(node.data!==next)node.data=next;
   record.last=next;
  }
  for(const element of root.querySelectorAll('[aria-label],[title],[placeholder]')){
   if(element.closest('[data-language-preserve]'))continue;
   let records=attributes.get(element);if(!records){records={};attributes.set(element,records);}
   for(const name of ['aria-label','title','placeholder']){
    const current=element.getAttribute(name);if(current===null)continue;
    let record=records[name];if(!record||record.last!==current)record=records[name]={source:current,last:current};
    const value=text(record.source,language);if(value!==current)element.setAttribute(name,value);record.last=value;
   }
  }
  for(const element of root.querySelectorAll('[data-booking-time]')){
   const value=new Intl.DateTimeFormat(language==='en'?'en-IN':language+'-IN',{timeZone:'Asia/Kolkata',dateStyle:'medium',timeStyle:'short'}).format(new Date(element.dataset.bookingTime))+' IST';
   if(element.textContent!==value)element.textContent=value;
  }
 }
 const notice=document.querySelector('#notice');
 if(notice?.dataset.bookingNotice){const value=translateMessage(notice.dataset.bookingNotice);if(notice.textContent!==value)notice.textContent=value;}
 const title=text('Pandit Booking · Curio',language);if(document.title!==title)document.title=title;
}
function queue(){if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;apply();});}
function register(){
 if(registered||!window.SynapseLanguage)return;
 registered=true;
 window.SynapseLanguage.register({controls:'[data-booking-language-source]',languages:['en','hi','gu'],apply(value){language=value;apply();}});
}
export function install(){
 const start=()=>{register();new MutationObserver(queue).observe(document.body,{subtree:true,childList:true,characterData:true});apply();};
 addEventListener('synapse-language-change',event=>{register();language=event.detail.language;apply();});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
}
