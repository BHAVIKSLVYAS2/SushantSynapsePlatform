const words={
 en:{category:'Category',topic:'Deity / topic',audio:'Audio',all:'All',recorded:'With audio',unrecorded:'Without audio',reset:'Reset filters'},
 hi:{category:'श्रेणी',topic:'देवता / विषय',audio:'ऑडियो',all:'सभी',recorded:'ऑडियो सहित',unrecorded:'ऑडियो के बिना',reset:'फ़िल्टर हटाएँ'},
 gu:{category:'શ્રેણી',topic:'દેવતા / વિષય',audio:'ઑડિયો',all:'બધાં',recorded:'ઑડિયો સાથે',unrecorded:'ઑડિયો વગર',reset:'ફિલ્ટર દૂર કરો'}
};
const categories={nama:['Name mantras','नाम मंत्र','નામ મંત્ર'],vedic:['Vedic mantras','वैदिक मंत्र','વૈદિક મંત્ર'],prayer:['Prayers & salutations','प्रार्थना और वंदना','પ્રાર્થના અને વંદના'],scripture:['Scripture readings','शास्त्र पाठ','શાસ્ત્ર પાઠ'],peace:['Peace invocations','शांति पाठ','શાંતિ પાઠ'],navagraha:['Navagraha','नवग्रह','નવગ્રહ']};
const topics={ganesha:['Ganesha','गणेश','ગણેશ'],shiva:['Shiva','शिव','શિવ'],vishnu:['Vishnu / Narayana','विष्णु / नारायण','વિષ્ણુ / નારાયણ'],rama:['Rama','राम','રામ'],krishna:['Krishna','कृष्ण','કૃષ્ણ'],hanuman:['Hanuman','हनुमान','હનુમાન'],durga:['Durga','दुर्गा','દુર્ગા'],lakshmi:['Lakshmi','लक्ष्मी','લક્ષ્મી'],saraswati:['Saraswati','सरस्वती','સરસ્વતી'],navagraha:['Navagraha','नवग्रह','નવગ્રહ'],gayatri:['Gayatri','गायत्री','ગાયત્રી'],guru:['Guru','गुरु','ગુરુ'],peace:['Peace','शांति','શાંતિ']};
export function mantraMetadata(m){
 if(m.categories)return {categories:m.categories,topic:m.topic};
 if(m.id.startsWith('navagraha-'))return {categories:['nama','navagraha'],topic:'navagraha'};
 if(m.id.startsWith('nama-'))return {categories:['nama'],topic:m.id.slice(5)};
 const byId={gayatri:['vedic','gayatri'],mahamrityunjaya:['vedic','shiva'],shiva:['nama','shiva'],ganesha:['nama','ganesha'],vasudeva:['nama','vishnu'],narayana:['nama','vishnu'],'saha-navavatu':['peace','peace'],purnamadah:['peace','peace']};
 const [category,topic]=byId[m.id]||['prayer','peace'];return {categories:[category],topic};
}
export function mountLibraryFilters(host,onChange){
 const root=document.createElement('div');root.className='library-filters';root.setAttribute('data-language-preserve','');const fields={};
 for(const key of ['category','topic','audio']){const label=document.createElement('label'),caption=document.createElement('span'),select=document.createElement('select');select.id='mantra-filter-'+key;label.append(caption,select);root.append(label);select.onchange=()=>{paintReset();onChange();};fields[key]={caption,select};}
 const reset=document.createElement('button');reset.type='button';reset.className='library-filter-reset';root.append(reset);host.querySelector('[role=status]').before(root);
 function paintReset(){reset.hidden=!Object.values(fields).some(f=>f.select.value);}
 function clear(){for(const f of Object.values(fields))f.select.value='';paintReset();}
 reset.onclick=()=>{clear();onChange();};
 return {clear,translate(language){const t=words[language]||words.en,index={en:0,hi:1,gu:2}[language]??0;for(const [key,f] of Object.entries(fields)){const value=f.select.value;f.caption.textContent=t[key];const choices=key==='audio'?{recorded:[t.recorded],unrecorded:[t.unrecorded]}:key==='category'?categories:topics;f.select.replaceChildren(new Option(t.all,''),...Object.entries(choices).map(([id,names])=>new Option(names[key==='audio'?0:index],id)));f.select.value=value;}reset.textContent=t.reset;paintReset();},matches(m){const meta=mantraMetadata(m),category=fields.category.select.value,topic=fields.topic.select.value,audio=fields.audio.select.value;return (!category||meta.categories.includes(category))&&(!topic||meta.topic===topic)&&(!audio||(audio==='recorded'?!!m.audio:!m.audio));}};
}
