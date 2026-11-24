import {romanize,gujaratiScript} from './script-aids.mjs';
import {cleanReadingText} from './chapter-meanings.mjs';

const copy={
 en:{roman:'Roman',gujarati:'Gujarati',meaning:'Meaning',hindi:'Meaning · Hindi',note:'Roman and Gujarati are script-based reading aids, not translations or a recording. Vedic pitch accents and teacher pronunciation review are not included.'},
 hi:{roman:'रोमन',gujarati:'गुजराती',meaning:'अर्थ',hindi:'अर्थ · हिंदी',note:'रोमन और गुजराती उसी पाठ की लिपि-सहायता हैं, अनुवाद या रिकॉर्डिंग नहीं। इनमें वैदिक स्वर और शिक्षक द्वारा उच्चारण की समीक्षा शामिल नहीं है।'},
 gu:{roman:'રોમન',gujarati:'ગુજરાતી',meaning:'અર્થ',hindi:'અર્થ · હિન્દી',note:'રોમન અને ગુજરાતી એ જ પાઠની લિપિ-સહાય છે, અનુવાદ કે રેકોર્ડિંગ નથી. તેમાં વૈદિક સ્વર અને શિક્ષક દ્વારા ઉચ્ચારની સમીક્ષા સામેલ નથી.'}
};
export function studyPassage(sanskrit,meanings,language='hi'){
 const source=cleanReadingText(sanskrit).trim().replace(/\n[ \t]*\n+/g,'\n');
 const meaningLanguage=meanings[language]?.trim()?language:['hi','en','gu'].find(key=>meanings[key]?.trim());
 return {source,roman:romanize(source),gujarati:gujaratiScript(source),meaning:meanings[meaningLanguage]||'',meaningLanguage};
}
export const studyNote=language=>(copy[language]||copy.en).note;
const make=(tag,text,cls,language)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(cls)node.className=cls;if(language)node.lang=language;return node;};
const guideCopy={
 en:['Pronunciation help · Devanagari','Reading help · words as printed'],
 hi:['उच्चारण सहायता · देवनागरी','पठन सहायता · मूल पाठ के शब्द'],
 gu:['ઉચ્ચાર સહાય · દેવનાગરી','વાંચન સહાય · મૂળ પાઠના શબ્દો']
};
export function renderStudyPassage(sanskrit,meanings,language,{devanagari,roman,gujarati,romanGuide}={}){
 const unit=studyPassage(sanskrit,meanings,language),t=copy[language]||copy.en,block=make('section',undefined,'verse-pair');
 block.append(make('p',unit.source,'mantra verse-text','sa-Deva'));
 const labels=guideCopy[language]||guideCopy.en;
 const authored=devanagari?.trim()&&devanagari.trim().replace(/\s+/g,' ')!==unit.source.replace(/\s+/g,' ');
 // Only separate words already spaced in the source. Keep sandhi and accents intact.
 const spaced=unit.source.replace(/([^\s।॥])[^\S\n]+(?=[^\s।॥])/gu,'$1\u2002\u2002');
 if(authored||spaced!==unit.source){
  const guide=make('div',undefined,'verse-devanagari-help');
  guide.append(make('span',labels[authored?0:1],'verse-meaning-label'),make('p',authored?devanagari:spaced,undefined,'sa-Deva'));
  block.append(guide);
 }
 const aids=make('dl',undefined,'verse-pronunciation');
 for(const [label,value,lang]of [[t.roman,roman||unit.roman,'sa-Latn'],[t.gujarati,gujarati||unit.gujarati,'sa-Gujr']]){
  const row=make('div');row.append(make('dt',label),make('dd',value,undefined,lang));aids.append(row);
 }
 const meaning=make('div',undefined,'verse-meaning-block');
 meaning.append(make('span',unit.meaningLanguage==='hi'&&language!=='hi'?t.hindi:t.meaning,'verse-meaning-label'),make('p',unit.meaning,'verse-meaning',unit.meaningLanguage));
 const help=make('div',undefined,'verse-reading-help');
 help.append(aids);
 if(romanGuide&&romanGuide!==(roman||unit.roman))help.append(make('p',romanGuide,'muted','sa-Latn'));
 block.append(meaning,help);return block;
}
