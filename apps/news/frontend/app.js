'use strict';
const theme=document.querySelector('#theme');
const systemTheme=matchMedia('(prefers-color-scheme: dark)');
function applyTheme(){document.documentElement.dataset.theme=theme.value==='system'?(systemTheme.matches?'dark':'light'):theme.value;}
theme.value=window.SynapseTheme.read();
if(!theme.value)theme.value='system';
applyTheme();
theme.addEventListener('change',()=>{window.SynapseTheme.write(theme.value);applyTheme();});
systemTheme.addEventListener('change',applyTheme);
window.addEventListener('storage',()=>{theme.value=window.SynapseTheme.read();if(!theme.value)theme.value='system';applyTheme();});
async function load(){
  document.querySelector('#retry').hidden=true;
  document.querySelector('#gate-message').textContent='Loading newspaper…';
  try{
    const response=await fetch('/api/news/status',{cache:'no-store'});
    if(!response.ok)throw Error('The newspaper could not be loaded. Please retry.');
    const status=await response.json();
    editionToday=status.today;selection=status.today;
    document.querySelector('#edition-date').value=status.today;
    document.querySelector('#gate').hidden=true;
    document.querySelector('#newspaper').hidden=false;
    if(status.archiveAvailable)await loadArchives(status.today);
    document.querySelector('#fetch-news').hidden=!status.fetchAvailable;
    document.querySelector('#fetch-note').textContent=status.fetchAvailable?'':'Newspaper generation is temporarily unavailable. Please retry shortly.';
    if(status.fetchAvailable)await setupFetching(status.today);
  }catch(error){document.querySelector('#gate-message').textContent=error.message;document.querySelector('#retry').hidden=false;}
}
document.querySelector('#retry').addEventListener('click',load);
load();

let dates=[],nextBefore=null,selection='',requestVersion=0,editionToday='',fetching=false,selectedSaved=false;
const element=(tag,content,className)=>{const node=document.createElement(tag);node.textContent=content;if(className)node.className=className;return node;};
function clearReader(){
  document.querySelector('#saved-reader').replaceChildren();
  document.querySelector('#saved-reader').hidden=true;
  document.querySelector('.paper-grid').hidden=true;
  document.querySelector('#print-edition').disabled=true;
}
function navigation(){
  const index=dates.findIndex(e=>e.date===selection);
  document.querySelector('#previous-edition').disabled=index<0||index===dates.length-1;
  document.querySelector('#next-edition').disabled=index<=0;
  document.querySelector('#latest-edition').disabled=!dates.length||selection===dates[0].date;
}
async function getJson(url){
  const response=await fetch(url,{cache:'no-store'});
  if(response.status===404)return null;
  if(!response.ok)throw Error('Could not load saved editions. Please try again.');
  return response.json();
}
function storyTopic(story){
  const path=new URL(story.url).pathname;
  if(path.includes('/entertainment/'))return 'Masala';
  if(path.includes('/sports/'))return 'Sport';
  if(path.includes('/technology/'))return 'Tech';
  if(path.includes('/business/'))return 'Money';
  if(path.includes('/world/'))return 'World';
  if(/\/(lifestyle|trending)\//.test(path))return 'Life & culture';
  if(/\/(education|health)\//.test(path))return 'Learning & health';
  return 'India';
}
function artwork(name,alt,className){
  const img=element('img','',className);img.src='/news/art/'+name+'-v1.webp';img.alt=alt;img.width=1536;img.height=1024;img.decoding='async';
  img.addEventListener('error',()=>{img.hidden=true;});return img;
}
function renderEdition(edition){
  const reader=document.querySelector('#saved-reader');reader.replaceChildren();
  const overview=element('div','','reader-overview');
  overview.append(element('h2','The daily dispatch'),element('span',edition.stories.length+' stories · One chai break','reading-time'));
  const info=element('details','','edition-info');info.append(element('summary','Edition '+edition.date+' · Sources & timing'));
  info.append(element('p','Published '+new Date(edition.publishedAt).toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})+' IST. News through '+new Date(edition.cutoff).toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})+' IST.','saved-meta'));
  info.append(element('p','Short credited source excerpts. Follow each original for full context. The artwork is AI-generated editorial illustration, not news photography.','saved-meta'));
  const filters=element('div','','topic-filters');filters.setAttribute('role','group');filters.setAttribute('aria-label','Filter stories by topic');
  const count=element('p','Showing all '+edition.stories.length+' stories','filter-count');count.setAttribute('role','status');
  const grid=element('div','','saved-stories');
  for(const story of edition.stories){
    const article=element('article','','saved-story');article.dataset.topic=storyTopic(story);article.id='story-'+story.position;
    const topline=element('div','','story-topline');
    topline.append(element('span',storyTopic(story),'topic-tag'),element('span',String(story.position).padStart(2,'0'),'story-number'));
    article.append(topline);
    if(story.position===1)article.append(element('p','The lead','section-label lead-label'));
    article.append(element('h2',story.title),element('p',story.brief,story.brief.length>250?'story-brief is-long':'story-brief'));
    const actions=element('div','','story-actions'),link=element('a','Read original · '+story.source);const url=new URL(story.url);
    if(['http:','https:'].includes(url.protocol)&&!url.username&&!url.password){link.href=url.href;link.target='_blank';link.rel='noopener noreferrer';actions.append(link);}
    const toggle=element('button','Read full brief','expand-brief');toggle.setAttribute('aria-expanded','false');
    toggle.addEventListener('click',()=>{const expanded=article.classList.toggle('expanded');toggle.setAttribute('aria-expanded',String(expanded));toggle.textContent=expanded?'Show less':'Read full brief';});
    if(story.brief.length>250)actions.append(toggle);
    article.append(actions);grid.append(article);
  }
  for(const topic of ['All stories',...new Set(edition.stories.map(storyTopic))]){
    const button=element('button',topic);button.setAttribute('aria-pressed',String(topic==='All stories'));
    button.addEventListener('click',()=>{
      for(const other of filters.children)other.setAttribute('aria-pressed',String(other===button));
      let visible=0;for(const article of grid.children){article.hidden=topic!=='All stories'&&article.dataset.topic!==topic;if(!article.hidden)visible++;}
      count.textContent=topic==='All stories'?'Showing all '+visible+' stories':visible+' '+topic+' '+(visible===1?'story':'stories');
    });filters.append(button);
  }
  const satire=element('aside','','saved-satire');satire.id='lighter-side';
  const satireHead=element('div','','satire-heading');
  satireHead.append(element('p','The chai-break comic','section-label'),element('h2',edition.satire.title),element('span','Satire · Fictional commentary','badge'));
  satire.append(satireHead);
  if(edition.promptVersion==='news-comic-v2'){
    const body=element('div','','comic-strip');
    for(const [i,text]of edition.satire.body.split('\n\n').entries()){
      if(i>0&&i<4){
        const panel=element('section','','comic-panel');
        panel.append(element('span',String(i).padStart(2,'0'),'panel-number'),artwork('chai-comic','', 'comic-scene'));
        const dialogue=text.replace(/^Panel \d+:\s*/,'');const split=dialogue.indexOf(':');
        const bubble=element('div','','speech-bubble');bubble.append(element('span',split<0?'Reader':dialogue.slice(0,split),'speaker'),element('p',split<0?dialogue:dialogue.slice(split+1).trim()));
        panel.append(bubble);body.append(panel);
      }else body.append(element('p',text,'comic-caption'));
    }
    satire.append(body);
  }else{
    satire.append(artwork('chai-comic','Two fictional friends sharing news over chai','legacy-comic-art'),element('p',edition.satire.body,'satire-body'));
  }
  satire.append(element('p','AI-generated illustration · Fictional characters, not a depiction of the reported event.','art-credit'));
  const reference=element('a','Inspired by story '+edition.satire.storyPosition+': '+edition.stories[edition.satire.storyPosition-1].title,'satire-reference');
  reference.href='#story-'+edition.satire.storyPosition;reference.addEventListener('click',()=>filters.firstElementChild.click());satire.append(reference);
  reader.append(overview,info,filters,count,grid,satire);reader.hidden=false;
  document.querySelector('.masthead h1').textContent=edition.name;
  document.querySelector('.byline strong').textContent=edition.author;
  document.querySelector('.edition-line span:nth-child(2)').textContent='Saved edition · '+edition.date;
  document.querySelector('#print-edition').disabled=false;
}
async function openEdition(date){
  if(!date)return;
  const version=++requestVersion;selection=date;selectedSaved=false;clearReader();navigation();
  document.querySelector('#fetch-preview').hidden=true;updateFetchControl();
  document.querySelector('#edition-date').value=date;
  document.querySelector('.edition-line span:nth-child(2)').textContent=`Selected date · ${date}`;
  document.querySelector('#reader-status').textContent='Opening saved newspaper…';
  const url=new URL(location.href);url.searchParams.set('date',date);history.replaceState(null,'',url);
  if(!validSelection(date)){document.querySelector('#reader-status').textContent=date>editionToday?'Future dates cannot generate news. Choose today or a past date.':'Enter a valid edition date.';return;}
  try{
    const edition=await getJson('/api/news/editions/'+encodeURIComponent(date));
    if(version!==requestVersion)return;
    if(!edition){document.querySelector('#reader-status').textContent=`No saved newspaper for ${date}.`;return;}
    selectedSaved=true;updateFetchControl();
    renderEdition(edition);showPreview({date,state:'published',cached:true});document.querySelector('#reader-status').textContent='Opened from saved editions. No news was fetched.';
  }catch(error){if(version===requestVersion)document.querySelector('#reader-status').textContent=error.message;}
}
async function archivePage(before){
  const result=await getJson('/api/news/editions'+(before?'?before='+encodeURIComponent(before):''));
  if(!result)throw Error('Saved editions are unavailable.');
  dates=before?[...dates,...result.editions]:result.editions;nextBefore=result.nextBefore;
  const list=document.querySelector('#archive-list');list.replaceChildren();
  for(const edition of dates){const button=element('button',edition.date);button.addEventListener('click',()=>openEdition(edition.date));list.append(button);}
  document.querySelector('#archive-empty').hidden=dates.length>0;
  document.querySelector('#more-editions').hidden=!nextBefore;navigation();
}
async function loadArchives(today){
  document.querySelector('#edition-date').disabled=false;document.querySelector('#edition-date').max=today;
  document.querySelector('#edition-navigation').hidden=false;
  document.querySelector('#archive-note').textContent='Choose today or a past date to generate or open its newspaper.';
  document.querySelector('.preview-note p').textContent='Ten stories, one satire, a newspaper to keep.';
  try{
    await archivePage();
    const requested=new URL(location.href).searchParams.get('date');
    if(requested||dates.length)await openEdition(requested||dates[0].date);
  }catch(error){document.querySelector('#reader-status').textContent=error.message;}
}
document.querySelector('#edition-date').addEventListener('change',event=>openEdition(event.target.value));
document.querySelector('#latest-edition').addEventListener('click',()=>{if(dates.length)openEdition(dates[0].date);});
document.querySelector('#previous-edition').addEventListener('click',()=>{const index=dates.findIndex(e=>e.date===selection);if(index>=0&&dates[index+1])openEdition(dates[index+1].date);});
document.querySelector('#next-edition').addEventListener('click',()=>{const index=dates.findIndex(e=>e.date===selection);if(index>0)openEdition(dates[index-1].date);});
document.querySelector('#print-edition').addEventListener('click',()=>window.print());
document.querySelector('#more-editions').addEventListener('click',async()=>{const button=document.querySelector('#more-editions');button.disabled=true;try{await archivePage(nextBefore);}catch(error){document.querySelector('#reader-status').textContent=error.message;}finally{button.disabled=false;}});

function showPreview(result){
  document.querySelector('#fetch-preview').hidden=false;
  document.querySelector('#preview-stories').replaceChildren();
  document.querySelector('#preview-heading').textContent=`Newspaper for ${result.date}`;
  document.querySelector('#fetch-status').textContent=result.state==='published'?(result.cached?'Opened the stored newspaper. No news request was made.':'Newspaper published and saved.'):(result.error||'A previous fetch is unfinished. Click Fetch to resume.');
  updateFetchControl();
}
function validSelection(date){return /^\d{4}-\d{2}-\d{2}$/.test(date)&&Number.isFinite(Date.parse(date+'T00:00:00Z'))&&new Date(date+'T00:00:00Z').toISOString().slice(0,10)===date&&date<=editionToday;}
function updateFetchControl(){
  const button=document.querySelector('#fetch-news'),isToday=selection===editionToday;
  button.disabled=fetching||!validSelection(selection);
  button.textContent=fetching?'Preparing newspaper...':selectedSaved?(isToday?"Open today's newspaper":`Open newspaper for ${selection}`):(isToday?"Fetch today's newspaper":`Generate newspaper for ${selection}`);
  document.querySelector('#fetch-note').textContent=!validSelection(selection)?'Choose today or a past date. Future editions cannot be generated.':selectedSaved?'Open the saved edition without fetching again.':'Generate ten varied stories for this date, plus a fictional comic. Historical coverage depends on the source archive.';
}
async function setupFetching(){updateFetchControl();}
document.querySelector('#fetch-news').addEventListener('click',async()=>{
  const date=selection,version=requestVersion;
  if(!validSelection(date))return;
  fetching=true;updateFetchControl();
  document.querySelector('#fetch-preview').hidden=false;document.querySelector('#fetch-status').textContent='Preparing your newspaper...';
  try{
    const response=await fetch('/api/news/fetch',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({date})});
    const result=await response.json();if(!response.ok)throw Error(result.error||'News fetch failed. Please retry later.');
    if(result.state==='published'){
      await archivePage();
      if(version!==requestVersion)return;
      await openEdition(date);
      if(selection!==date)return;
    }
    if(selection===date)showPreview(result);
  }catch(error){if(version===requestVersion)document.querySelector('#fetch-status').textContent=error.message;}
  finally{fetching=false;updateFetchControl();}
});
