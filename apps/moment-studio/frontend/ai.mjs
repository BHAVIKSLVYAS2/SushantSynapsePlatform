// Browser-only template suggestions. No model, network request or persistence.
import {occasions} from './card-renderer.mjs';
import {condolenceMessage} from './messages.mjs';
export const getLocalAiState=()=>({ready:true,mode:'local-templates',model:'Local wording helper',noDownload:true});
const clean=value=>typeof value==='string'?value.trim().replace(/\s+/g,' '):'';
export function buildAiPrompt(occasion='birthday',language='en'){
 const kind=Object.hasOwn(occasions,occasion)?occasion:'birthday';
 return language==='hi'?occasions[kind].hi.message:'Suggest wording for '+occasions[kind].name+'.';
}
export function generateAiText(context={}){
 const {occasion='birthday',language='en',tone='warm',prompt=''}=context,lang=language==='hi'?'hi':'en';
 const kind=Object.hasOwn(occasions,occasion)?occasion:'birthday';
 const style=/short|brief/i.test(prompt)?'short':/formal/i.test(prompt)?'formal':tone;
 let text=occasions[kind][lang].message;
 if(kind==='condolence')text=condolenceMessage({language:lang,tone:style==='short'?'brief':style==='formal'?'formal':'warm',connection:'general',variant:0}).message;
 const name=clean(context.name||context.recipient);if(name)text=name+', '+text;
 if(style==='short')text=text.split(/(?<=[.!?\u0964])\s+/)[0];
 else if(style==='formal'&&kind!=='condolence')text=(lang==='hi'?'\u0938\u093e\u0926\u0930, ':'With kind regards, ')+text;
 if(kind==='invitation')text=[text,clean(context.event||context.title),clean(context.date),clean(context.venue),clean(context.host||context.sender)].filter(Boolean).join('\n');
 return {text:text.slice(0,600),source:'local',model:'Local wording helper',quality:style,locale:lang};
}
export function improveExistingText(currentText='',action='warm',context={}){
 let text=clean(currentText);if(!text)return generateAiText({...context,tone:action}).text;
 if(action==='short')text=text.split(/(?<=[.!?\u0964])\s+/)[0];
 if(action==='formal'){const prefix=context.language==='hi'?'\u0938\u093e\u0926\u0930, ':'With kind regards, ';if(!text.startsWith(prefix))text=prefix+text;}
 return text.slice(0,600);
}
export function generateCondolenceCopy({language='en',tone='warm',connection='general',variant=0}={}){
 return condolenceMessage({language:language==='hi'?'hi':'en',tone:['warm','formal','brief'].includes(tone)?tone:'warm',connection,variant});
}
