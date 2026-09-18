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
  document.querySelector('#sign-in').hidden=true;
  document.querySelector('#gate-message').textContent='Checking access…';
  try{
    const response=await fetch('/api/news/status',{cache:'no-store'});
    if(response.status===401){document.querySelector('#sign-in').hidden=false;throw Error('Sign in with your platform account to continue.');}
    if(response.status===403)throw Error('Ask the platform owner for News app access.');
    if(!response.ok)throw Error('The newspaper could not be loaded. Please retry.');
    const status=await response.json();
    document.querySelector('#edition-date').value=status.today;
    document.querySelector('#gate').hidden=true;
    document.querySelector('#newspaper').hidden=false;
    if(status.archiveAvailable)await loadArchives(status.today);
    document.querySelector('#fetch-news').hidden=!status.fetchAvailable;
    document.querySelector('#fetch-note').textContent=status.fetchAvailable?'':'The owner can publish today\u2019s newspaper.';
    if(status.fetchAvailable)await setupFetching(status.today);
  }catch(error){document.querySelector('#gate-message').textContent=error.message;document.querySelector('#retry').hidden=false;}
}
document.querySelector('#retry').addEventListener('click',load);
load();

let dates=[],nextBefore=null,selection='',requestVersion=0;
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
  if(response.status===401||response.status===403){
    document.querySelector('#newspaper').hidden=true;document.querySelector('#gate').hidden=false;
    document.querySelector('#gate-message').textContent='Your session or preview access has ended. Sign in to continue.';
    document.querySelector('#sign-in').hidden=false;
    throw Error('Sign in to continue.');
  }
  if(response.status===404)return null;
  if(!response.ok)throw Error('Could not load saved editions. Please try again.');
  return response.json();
}
function renderEdition(edition){
  const reader=document.querySelector('#saved-reader');reader.replaceChildren();
  const meta=element('p',`Edition ${edition.date} · Published ${new Date(edition.publishedAt).toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})} IST`,'saved-meta');
  reader.append(meta,element('p',`News through ${new Date(edition.cutoff).toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})} IST`,'saved-meta'));
  const grid=element('div','','saved-stories');
  for(const story of edition.stories){
    const article=element('article','','saved-story');
    article.append(element('p',story.position===1?'Lead story':`Story ${story.position}`,'section-label'),element('h2',story.title),element('p',story.brief));
    const link=element('a',`Read original · ${story.source}`);const url=new URL(story.url);
    if(['http:','https:'].includes(url.protocol)&&!url.username&&!url.password){link.href=url.href;link.target='_blank';link.rel='noopener noreferrer';article.append(link);}
    grid.append(article);
  }
  const satire=element('aside','','saved-satire');
  satire.append(element('p','Satire · Fictional commentary','section-label'),element('h2',edition.satire.title),element('p',edition.satire.body),element('p',`Inspired by story ${edition.satire.storyPosition}: ${edition.stories[edition.satire.storyPosition-1].title}`,'saved-meta'));
  if(edition.model==='local-editorial-template')reader.append(element('p','India public affairs - Ten recent PIB releases. Briefs are credited source excerpts; satire uses a local editorial template.','saved-meta'));
  reader.append(grid,satire);reader.hidden=false;
  document.querySelector('.masthead h1').textContent=edition.name;
  document.querySelector('.byline strong').textContent=edition.author;
  document.querySelector('.edition-line span:nth-child(2)').textContent=`Saved edition · ${edition.date}`;
  document.querySelector('#print-edition').disabled=false;
}
async function openEdition(date){
  if(!date)return;
  const version=++requestVersion;selection=date;clearReader();navigation();
  document.querySelector('#edition-date').value=date;
  document.querySelector('.edition-line span:nth-child(2)').textContent=`Selected date · ${date}`;
  document.querySelector('#reader-status').textContent='Opening saved newspaper…';
  const url=new URL(location.href);url.searchParams.set('date',date);history.replaceState(null,'',url);
  try{
    const edition=await getJson('/api/news/editions/'+encodeURIComponent(date));
    if(version!==requestVersion)return;
    if(!edition){document.querySelector('#reader-status').textContent=`No saved newspaper for ${date}.`;return;}
    renderEdition(edition);document.querySelector('#reader-status').textContent='Opened from saved editions. No news was fetched.';
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
  document.querySelector('#archive-note').textContent='Choose a date to open its saved newspaper.';
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
  document.querySelector('#preview-heading').textContent='Today\u2019s newspaper';
  document.querySelector('#fetch-status').textContent=result.state==='published'?(result.cached?'Opened the stored newspaper. No news request was made.':'Newspaper published and saved.'):(result.error||'A previous fetch is unfinished. Click Fetch to resume.');
  document.querySelector('#fetch-news').textContent=result.state==='published'?"Open today's newspaper":"Fetch today's newspaper";
}
async function setupFetching(today){
  const button=document.querySelector('#fetch-news');button.disabled=false;button.textContent="Fetch today's newspaper";
  document.querySelector('#fetch-note').textContent='Fetch once per day. Reopen the saved edition any time.';
  try{const saved=await getJson('/api/news/preview/'+today);if(saved&&saved.state!=='empty')showPreview(saved);}catch(error){document.querySelector('#fetch-status').textContent=error.message;}
}
document.querySelector('#fetch-news').addEventListener('click',async()=>{
  const button=document.querySelector('#fetch-news');button.disabled=true;
  document.querySelector('#fetch-preview').hidden=false;document.querySelector('#fetch-status').textContent='Preparing your newspaper...';
  try{
    const response=await fetch('/api/news/fetch',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
    if(response.status===401||response.status===403){document.querySelector('#newspaper').hidden=true;document.querySelector('#gate').hidden=false;document.querySelector('#gate-message').textContent='Sign in as the platform owner to fetch news.';document.querySelector('#sign-in').hidden=false;return;}
    const result=await response.json();if(!response.ok)throw Error(result.error||'News fetch failed. Please retry later.');
    showPreview(result);if(result.state==='published'){dates=[];await archivePage();await openEdition(result.date);}
  }catch(error){document.querySelector('#fetch-status').textContent=error.message;}
  finally{button.disabled=false;}
});
