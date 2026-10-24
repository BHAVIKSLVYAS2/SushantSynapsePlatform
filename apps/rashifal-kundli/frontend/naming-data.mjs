// Editorial content independent of the astronomical kernel. No scraped name list.
export const namingData=Object.freeze({version:'naming-editorial-1-20261024',license:'Project-authored factual selection; no publisher prose copied',
 source:'https://www.venkateswaratemple.org/flyer/2026_27_EnglishPanchangamFinal.pdf',page:73,
 variant:'HTCS Bridgewater 2026-27 Roman naming-sound table; regional spellings retained',
 syllables:[['Chu','Che','Cho','Laa'],['Lee','Loo','Le','Lo'],['Aa','ee','u','ye'],['O','vaa','vee','vu'],['ve','vo','kaa','kee'],
 ['koo','khaM','jna','cha'],['ke','ko','haa','hi'],['hoo','he','ho','da'],['dee','doo','de','daa'],['maa','mee','moo','me'],
 ['mo','taa','tee','too'],['te','to','paa','pi'],['poo','sham','na','tta'],['pe','po','raa','ri'],['roo','re','ro','ta'],
 ['thee','thoo','the','tho'],['naa','nee','noo','ne'],['no','yaa','yee','yoo'],['ye','yo','baa','bi'],['boo','dha','bhaa','dha'],
 ['be','bo','jaa','ji'],['joo','je','jo','kha'],['gaa','gee','goo','ge'],['go','saa','see','soo'],['se','so','daa','di'],['du','syam','jha','thaa'],['de','do','chaa','chi']],
 names:[
 {id:'ravi',roman:'Ravi',hi:'रवि',gu:'રવિ',language:'Sanskrit-origin',syllables:['raa'],meaning:{en:'Sun',hi:'सूर्य',gu:'સૂર્ય'},
  source:'https://www.sanskrit-lexicon.uni-koeln.de/scans/MWScan/MWScanpdf/mw0869-ravaNaka.pdf',entry:'Monier-Williams (1899), ravi, p.869; short factual gloss, project transliterations'},
 {id:'tara',roman:'Tara',hi:'तारा',gu:'તારા',language:'Sanskrit-origin',syllables:['ta','taa'],meaning:{en:'Star',hi:'तारा',gu:'તારો'},
  source:'https://www.sanskrit-lexicon.uni-koeln.de/scans/MWScan/MWScanpdf/mw0444-tAramAkSika.pdf',entry:'Monier-Williams (1899), tārā, p.443; short factual gloss, project transliterations'}
 ]});
for(const row of namingData.syllables)Object.freeze(row);Object.freeze(namingData.syllables);
for(const n of namingData.names){Object.freeze(n.syllables);Object.freeze(n.meaning);Object.freeze(n);}Object.freeze(namingData.names);

export function namingGuidance(moon){
 if(!moon||!Number.isInteger(moon.nakshatra)||moon.nakshatra<1||moon.nakshatra>27||!Number.isInteger(moon.pada)||moon.pada<1||moon.pada>4)throw new TypeError('Check naming classification.');
 // Guard the full input minute plus the existing P04 screening target; not P14 certification.
 if(moon.nearBoundary||moon.boundaryDistances.padaArcsec<=61+45) return {status:'unavailable',code:'UNSTABLE_BIRTH_TIME'};
 const syllable=namingData.syllables[moon.nakshatra-1][moon.pada-1];
 return {status:'available',nakshatra:moon.nakshatra,pada:moon.pada,syllable,version:namingData.version};
}
export function findNames({query='',language='all',syllable=null}={}){
 if(typeof query!=='string'||query.length>80||!['all','hi','gu'].includes(language))throw new TypeError('Check name filters.');
 const needle=query.trim().toLocaleLowerCase('en');
 return namingData.names.filter(n=>(!syllable||n.syllables.includes(syllable))&&
  `${n.roman} ${language==='all'?n.hi+' '+n.gu:n[language]} ${Object.values(n.meaning).join(' ')}`.toLocaleLowerCase('en').includes(needle));
}
