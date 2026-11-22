// Original editorial drafts. Text comparison is distinct from interpretation review.
export function enrichMahamrityunjaya(record){
 const unit=record.units[0],text=unit.text;
 const portions=['ॐ त्र्यम्बकं यजामहे ','सुगन्धिं पुष्टिवर्धनम् । ','उर्वारुकमिव बन्धनान्मृत्योर्मुक्षीय मामृतात् ॥'];
 if(portions.join('')!==text)throw Error('Mahamrityunjaya pilot needs review after text change');
 const source='https://sanskritdocuments.org/doc_veda/r07.pdf';
 record.titleSanskrit='महामृत्युञ्जय मन्त्र';record.scriptureReference='Ṛgveda 7.59.12';record.source.verification={status:'source-checked',evidence:source,scope:'Verse text comparison only; Om is the retained customary preface; accents not represented.'};
 record.tradition='Unaccented devotional study text; not an accented Vedic recitation edition';
 record.pilot=true;
 const content=[
  {literal:'हम त्रिनेत्रधारी की उपासना करते हैं।',natural:'हम तीन नेत्रों वाले प्रभु की आराधना करते हैं।',contextual:'त्र्यम्बकं उपासना के विषय को और यजामहे उपासना करने की क्रिया को बताता है। शिव/रुद्र की पहचान पारंपरिक संदर्भ है; यह नाम इस पंक्ति में अलग शब्द के रूप में नहीं है।',roman:'oṃ tryambakaṃ yajāmahe',glosses:['प्रणव; वर्तमान पाठ का आरंभिक उपसर्ग','तीन नेत्रों वाले को; अर्थ-समीक्षा लंबित','हम उपासना करते हैं']},
  {literal:'सुगंधित और पोषण बढ़ाने वाले की।',natural:'जो सुगंधित हैं और पोषण को बढ़ाते हैं।',contextual:'यह पिछली पंक्ति के त्र्यम्बक का विशेषण-समूह है, स्वतंत्र वाक्य नहीं। पुष्टि को पोषण के अर्थ में रखा गया है; इससे किसी उपचार की गारंटी नहीं निकलती।',roman:'sugandhiṃ puṣṭivardhanam',glosses:['सुगंधित को','पोषण बढ़ाने वाले को']},
  {literal:'जैसे उर्वारुक बंधन से, वैसे मैं मृत्यु से छूटूँ, अमृतत्व से नहीं।',natural:'जैसे ककड़ी का फल अपने बंधन से छूटता है, वैसे मैं मृत्यु के बंधन से मुक्त होऊँ, अमृतत्व से अलग न होऊँ।',contextual:'फल और उसके बंधन की उपमा मुक्ति की प्रार्थना से जुड़ी है। मुक्षीय का प्रथम-पुरुष एकवचन भाव यहाँ रखा गया है। संधि-विच्छेद और अमृतत्व की परंपरागत व्याख्या के लिए स्वतंत्र विशेषज्ञ समीक्षा आवश्यक है।',roman:'urvārukam iva bandhanān mṛtyor mukṣīya mā amṛtāt',glosses:['उर्वारुक (ककड़ी के फल) के समान; संधियुक्त सतह','बंधन से / मृत्यु से / मैं छूटूँ — संधियुक्त समूह; पदच्छेद सत्यापित नहीं','अमृतत्व से नहीं — संधियुक्त समूह; पदच्छेद सत्यापित नहीं']}
 ];
 let start=0;unit.lines=portions.map((value,i)=>{
  const base=unit.lines[0],id=record.id+':rv-7.59.12:study-'+(i+1),data=content[i];
  const words=[...value.matchAll(/[^\s\u0964\u0965]+/gu)].map((m,j)=>({id:id+':surface:'+j,start:m.index,end:m.index+m[0].length,text:m[0],kind:'orthographic-surface',grammar:null,meanings:[{language:'hi',text:data.glosses[j],verification:{status:'ai-assisted'},sourceReferences:[source]}],verification:{status:'ai-assisted'}}));
  const line={...base,id,order:i,start,end:start+value.length,text:value,verseId:record.id+':rv-7.59.12',boundaryStatus:'editorial-study-group',words,padaccheda:null,pronunciation:{text:data.roman,kind:'approximate-roman-aid',verification:{status:'ai-assisted'}},annotations:['literal','natural','contextual'].map(kind=>({kind,text:data[kind],language:'hi',lineId:id,wordIds:words.map(w=>w.id),mantraVersion:record.version,sourceReferences:[source],verification:{status:'ai-assisted'}}))};start=line.end;return line;
 });
 record.reviewQueue.push('pilot-Hindi-and-lexical-drafts','pilot-study-boundaries','Vedic-teacher-review');
}
