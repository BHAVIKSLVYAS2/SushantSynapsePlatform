import {calendarRows,calendarText} from './panchang.mjs';
import {guides,checklistText,scope} from './guides.mjs';
import {occasionTitle} from './calendar-export.mjs';

export const packGuides=guides.filter(guide=>guide.category==='ashubh'||guide.id==='havan');
export const defaultPackGuides=['prarthana-sabha','day-10','day-11','day-12','shraddha'];
export const packTasks={en:['Confirm dates and family custom with the officiant','Arrange materials and quantities','Coordinate venue, travel and guest support'],hi:['पुरोहित के साथ तारीख और पारिवारिक रीति पक्की करें','सामग्री और मात्रा की व्यवस्था करें','स्थान, यात्रा और अतिथि सेवा का समन्वय करें']};

export function preparationPack(result,language='en',selected=defaultPackGuides){
 if(!['en','hi'].includes(language)||!Array.isArray(selected)||!selected.length||selected.some(id=>!packGuides.some(g=>g.id===id)))throw Error('Choose at least one preparation guide');
 return {title:language==='hi'?'स्मरण और अनुष्ठान तैयारी पुस्तिका':'Remembrance preparation pack',language,result,scope:scope[language],guides:[...new Set(selected)].map(id=>packGuides.find(g=>g.id===id)),schedule:calendarRows(result)};
}

export function packText(pack,{checked=new Set(),assignments=[]}={}){
 const {language,result}=pack,hi=language==='hi',lines=[pack.title,'Sushant Synapse · Ritual Assist','',pack.scope,'',calendarText(result,language),'',hi?'पारिवारिक जिम्मेदारियाँ':'Family responsibilities'];
 packTasks[language].forEach((task,i)=>lines.push(task+' · '+(hi?'जिम्मेदार':'Assigned to')+': '+(assignments[i]||'________________')));
 for(const guide of pack.guides){lines.push('\n'+checklistText(guide,language,new Set(guide.items.filter(item=>checked.has(guide.id+':'+item.id)).map(item=>item.id))));}
 lines.push('',hi?'चेक और जिम्मेदारियाँ इसी टैब में हैं। फ़ाइल साझा करने पर उसमें शामिल विवरण भी साझा होंगे।':'Checks and assignments stay in this tab. Sharing this file also shares its included details.');return lines.join('\n');
}

export function scheduleLabel(row,language){return occasionTitle(row,language)+(row.conditional?(language==='hi'?' · पुष्टि आवश्यक':' · confirmation required'):'');}
