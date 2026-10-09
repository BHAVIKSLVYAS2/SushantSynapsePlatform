'use strict';
// Shared source parsing and editorial rules; no persistence or Node dependencies.
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.SynapseNews=factory();
})(globalThis,()=>{
const fail=(status,message)=>{throw Object.assign(new Error(message),{status});};
function clean(value){
  const entities={amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' ',rsquo:'’',lsquo:'‘',ldquo:'“',rdquo:'”',ndash:'–',mdash:'—'};
  return value.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'').replace(/<[^>]*>/g,' ').replace(/&(#x[\da-f]+|#\d+|\w+);/gi,(m,key)=>{if(key[0]!=='#')return entities[key]??m;const n=key[1].toLowerCase()==='x'?parseInt(key.slice(2),16):Number(key.slice(1));return n>0&&n<=0x10ffff?String.fromCodePoint(n):'';}).replace(/[\u0000-\u001f]/g,' ').replace(/\s+/g,' ').trim();
}
const ORIGIN='https://indianexpress.com';
const indiaDate=date=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata'}).format(new Date(date));
function desk(url){
  if(/\/entertainment\//.test(url))return 'Masala · Entertainment';
  if(/\/sports\//.test(url))return 'Sport';
  if(/\/technology\//.test(url))return 'Tech';
  if(/\/business\//.test(url))return 'Money';
  if(/\/(lifestyle|trending)\//.test(url))return 'Life & culture';
  if(/\/world\//.test(url))return 'World';
  if(/\/(education|health)\//.test(url))return 'Learning & health';
  return 'India';
}
const tokens=s=>new Set(s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu,' ').split(/\s+/).filter(w=>w.length>2&&!['the','and','for','with','from','that','this','says','after','india','new'].includes(w)));
function duplicate(a,b){
  if(a.url===b.url)return true;
  const x=tokens(a.title),y=tokens(b.title),overlap=[...x].filter(w=>y.has(w)).length;
  return overlap/Math.max(1,Math.min(x.size,y.size))>=0.65;
}
function selectDiverse(items,limit=10){
  const groups=new Map();
  for(const item of items){const key=item.category||desk(item.url);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(item);}
  const selected=[];
  // Two entertainment slots when available, then round-robin desks. Never pad with duplicates.
  const order=['India','Masala · Entertainment','Sport','Tech','Money','World','Life & culture','Learning & health'];
  for(let round=0;round<limit&&selected.length<limit;round++)for(const key of order){
    const queue=groups.get(key)||[];
    while(queue.length){const item=queue.shift();if(selected.some(s=>duplicate(s,item)))continue;selected.push(item);break;}
    if(selected.length===limit)break;
  }
  return selected;
}
function parseListing(html){
  const section=html.match(/<div class="article-list">([\s\S]*?)<\/ul>/)?.[1]||'';
  return [...section.matchAll(/<a\b[^>]*href=["'](https:\/\/indianexpress\.com\/article\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)].map(m=>({url:clean(m[1]),title:clean(m[2])})).filter(s=>s.title&&s.title.length<=300);
}
function parseArticle(html,candidate,cutoff){
  const meta={};
  for(const tag of html.matchAll(/<meta\b[^>]*>/gi)){
    const attrs={};for(const m of tag[0].matchAll(/([\w:-]+)\s*=\s*(["'])([\s\S]*?)\2/g))attrs[m[1].toLowerCase()]=m[3];
    meta[attrs.property||attrs.name]=attrs.content;
  }
  const at=Date.parse(meta['article:published_time']);
  if(!Number.isFinite(at)||at>Date.parse(cutoff)||indiaDate(at)!==indiaDate(cutoff))return null;
  const description=clean(meta['og:description']||meta.description||'').split(/\s+/).slice(0,25).join(' ');
  if(!description)return null;
  return {...candidate,source:'The Indian Express',provider:'IndianExpress',publishedAt:new Date(at).toISOString(),observedAt:cutoff,description,category:desk(candidate.url)};
}
function createArchiveProvider({fetchImpl=globalThis.fetch,timeoutMs=90000}={}){
  return {async fetchStories(cutoff){
    const date=indiaDate(cutoff),signal=AbortSignal.timeout(timeoutMs);
    async function read(url){
      const target=new URL(url);
      if(target.origin!==ORIGIN||target.username||target.password)fail(400,'Invalid news source');
      // Workers supports manual redirects; reject non-2xx without following them.
      const response=await fetchImpl(target.href,{signal,redirect:'manual'});
      if(!response.ok){await response.body?.cancel();throw Error('Source unavailable (HTTP '+response.status+')');}
      const decoder=new TextDecoder();let contents='',size=0;
      for await(const chunk of response.body){size+=chunk.length;if(size>2000000)fail(502,'News source response was too large.');contents+=decoder.decode(chunk,{stream:true});}
      return contents+decoder.decode();
    }
    const archive=ORIGIN+'/archive/'+date.replaceAll('-','/')+'/';
    const pages=await Promise.allSettled([archive,archive+'page/2/',archive+'page/3/',archive+'page/4/'].map(read));
    if(pages.every(p=>p.status==='rejected'))fail(502,'Source archive unavailable: '+pages[0].reason.message+'. No edition was saved.');
    const candidates=selectDiverse(pages.flatMap(p=>p.status==='fulfilled'?parseListing(p.value):[]),24);
    const stories=[];
    for(let i=0;i<candidates.length;i+=4){
      const batch=await Promise.allSettled(candidates.slice(i,i+4).map(async s=>parseArticle(await read(s.url),s,cutoff)));
      for(const result of batch)if(result.status==='fulfilled'&&result.value)stories.push(result.value);
    }
    const selected=selectDiverse(stories);
    if(selected.length<10)fail(502,`Only ${selected.length} distinct dated stories were available for ${date}. No edition was saved. Try again later; archive coverage varies by date.`);
    return selected;
  }};
}
// Complete setups and payoffs matched to headlines, not broad news desks.
const comicAngles=[
  [/\b(trailer|teaser)\b/i,[
    ['The trailer review committee','FAN: A two-minute trailer. Finally, something quick.','FRIEND: Why is your review forty minutes long?','FAN: I am saving the audience time. Part two drops tomorrow.'],
    ['Spoiler protection squad','FAN: I paused the trailer on every frame to find the twist.','FRIEND: And now?','FAN: I am furious that the trailer gave away the twist.'],
    ['Advance booking for an opinion','FAN: I have declared this a masterpiece.','FRIEND: The film is not out yet.','FAN: Neither is my salary. I still have spending plans.']
  ]],
  [/\b(box office|blockbuster|cinema|movie|film)\b/i,[
    ['The popcorn financing department','FAN: Two cinema tickets, please.','FRIEND: Shall we split the popcorn?','FAN: First tell me which of us qualifies for the loan.'],
    ['Five stars, terms apply','FAN: My review is completely independent.','FRIEND: You gave it five stars before watching it.','FAN: Exactly. Even the film could not influence me.'],
    ['The real interval thriller','FAN: I finally understood the cinema business.','FRIEND: Ticket sales? Streaming rights?','FAN: They show a film to keep you near the samosas for three hours.']
  ]],
  [/\b(phone|smartphone|iphone|handset)\b/i,[
    ['A down payment on the future','BUYER: The new phone makes everything look professional.','FRIEND: What will you photograph first?','BUYER: The old phone. It has to sell before the EMI starts.'],
    ['Battery life, human edition','BUYER: This phone lasts two days on one charge.','FRIEND: Finally, freedom.','BUYER: I spent both days watching battery comparison videos.'],
    ['Premium unboxing','BUYER: The phone is thinner than ever.','FRIEND: What did they remove this time?','BUYER: Judging by my bank balance, my emergency fund.']
  ]],
  [/\b(ai|artificial intelligence|chatbot)\b/i,[
    ['Artificial intelligence, natural delegation','EMPLOYEE: AI wrote my entire presentation in seconds.','COLLEAGUE: Brilliant. What does it say?','EMPLOYEE: Wait. I will ask it to explain it to me.'],
    ['The meeting has become self-aware','BOSS: My AI assistant will attend the meeting.','STAFF: Ours too.','INTERN: Can the bots approve my leave, or do they also need to circle back?'],
    ['Productivity has entered the chat','EMPLOYEE: AI saves me three hours a day.','FRIEND: What do you do with the time?','EMPLOYEE: Attend workshops on how AI can save me three hours a day.']
  ]],
  [/\b(cricket|ipl|t20|odi|batsman|wicket)\b/i,[
    ['Selection committee, sofa branch','FAN: Terrible shot. I would have played that differently.','FRIEND: You missed the biscuit when you dipped it in chai.','FAN: Different conditions. The cup was turning.'],
    ['Expert analysis, no equipment required','FAN: We need to rotate the strike.','FRIEND: You have not moved from that chair in four hours.','FAN: Nobody is offering me a single.'],
    ['The review system at home','FAN: Clearly not out. Review it!','FRIEND: You owe me five hundred from the last match.','FAN: Insufficient evidence. Stay with the original decision.']
  ]],
  [/\b(election|polls|manifesto|campaign)\b/i,[
    ['Manifesto meets housing society','RESIDENT: I am contesting the society election. Free parking for everyone!','NEIGHBOUR: We have twelve spaces and forty cars.','RESIDENT: Please do not bring arithmetic into a positive campaign.'],
    ['Exit poll at the dinner table','UNCLE: I can predict exactly how everyone will vote.','AUNTIE: What does everyone want for dinner?','UNCLE: Let us wait for a larger sample size.'],
    ['Promises with unlimited validity','CANDIDATE: If elected society secretary, I will fix that lift.','RESIDENT: You promised that last time.','CANDIDATE: See? Consistent leadership.']
  ]],
  [/\b(inflation|prices|price rise|cost of living)\b/i,[
    ['The shopping bag is now minimalist','SHOPPER: I am embracing minimalism.','FRIEND: Fewer possessions?','SHOPPER: Same grocery bill. Fewer groceries. The economy chose my aesthetic.'],
    ['Tomatoes enter wealth management','SHOPPER: I asked for half a kilo of tomatoes.','FRIEND: And?','SHOPPER: The vendor asked whether I wanted a nominee.'],
    ['The family budget gets promoted','PARENT: We are going out for dinner tonight.','CHILD: Where?','PARENT: The balcony. Bring your plate.']
  ]],
  [/\b(interest rate|repo|emi|loan|mortgage)\b/i,[
    ['A long-term relationship','BORROWER: My bank and I are very committed.','FRIEND: How long have you been together?','BORROWER: Five years. It just extended our relationship by another ten.'],
    ['The EMI fitness programme','BORROWER: I am cutting back on eating out.','FRIEND: Health kick?','BORROWER: Yes. Keeping the loan account healthy.'],
    ['Dream home, recurring subscription','BUYER: Finally, a place I can call my own.','FRIEND: Congratulations!','BUYER: The bank lets me say that between instalments.']
  ]],
  [/\b(railway|train|metro|traffic|commute|road|highway)\b/i,[
    ['Estimated arrival: character development','COMMUTER: The map says twenty minutes.','FRIEND: It said that twenty minutes ago.','COMMUTER: Nice to have one stable relationship in this city.'],
    ['The shortcut advisory board','DRIVER: I know a shortcut.','PASSENGER: So does everyone in this lane.','DRIVER: It is an exclusive shortcut. We are queuing for membership.'],
    ['Office with a moving view','COMMUTER: I spend so much time travelling, I should claim rent.','COLLEAGUE: For the office?','COMMUTER: For the seat. I have put down roots.']
  ]],
  [/\b(exam|exams|syllabus|admission|homework)\b/i,[
    ['Revision of the revision plan','STUDENT: My study timetable is colour-coded and perfectly balanced.','FRIEND: How much have you studied?','STUDENT: Stationery. I now know everything about highlighters.'],
    ['Competitive parenting','PARENT: No pressure. Just do your best.','CHILD: Really?','PARENT: Yes. Specifically, better than Sharma ji’s best.'],
    ['The overnight preparation strategy','STUDENT: I work best under pressure.','FRIEND: The exam is tomorrow.','STUDENT: Exactly. My talent should arrive any minute now.']
  ]],
  [/\b(music|album|singer|concert|song)\b/i,[
    ['Live music, recorded attendance','FAN: Best concert of my life.','FRIEND: How was the singer?','FAN: Hang on. Let me watch my recording.'],
    ['The ticket price hits a high note','FAN: I got concert tickets!','FRIEND: Front row?','FAN: Back row. Front-row financial consequences.'],
    ['Exclusive listening party','FAN: This album speaks directly to me.','FRIEND: It has ten million listeners.','FAN: Yes, but they are all overhearing our conversation.']
  ]],
  [/\b(space|satellite|telescope|moon|mars|rocket)\b/i,[
    ['Interplanetary customer support','READER: We can send a machine all the way to Mars.','FRIEND: Incredible.','READER: My delivery driver still needs three calls to find this building.'],
    ['A small step for the family group','UNCLE: With a telescope we can see billions of years into the past.','AUNTIE: I can do that without equipment.','UNCLE: Please do not bring up the wedding again.'],
    ['Space for one more update','READER: Imagine living on the Moon.','FRIEND: Peace. Silence. No interruptions.','PHONE: You have been added to Moon Residents Official Group.']
  ]]
];
const readingScenes=[
  ['Breaking: the group admin has an opinion','UNCLE: I have forwarded the headline to eight groups.','NIECE: Did you read the article?','UNCLE: I am in distribution, not research.'],
  ['A developing story about my attention span','READER: I need the full context before forming an opinion.','PHONE: The article takes four minutes to read.','READER: Fine. Show me a stranger who sounds confident.'],
  ['Sources close to the dining table','UNCLE: My sources confirm it.','NIECE: Your source is a forwarded voice note.','UNCLE: Yes. An audio briefing from a senior contact.'],
  ['The expert panel is typing','READER: I will wait until I understand this before commenting.','GROUP CHAT: Why so quiet?','READER: Apparently research looks exactly like losing an argument.']
];
const sensitiveStory=/\b(death|dead|died|dies|killed|killing|rape|assault|suicide|attack|disaster|murder|war|victims?|arrest|fraud|crash|earthquake|floods?|injur\w*|terror\w*|abuse|cancer|grief|fatal\w*|accus\w*|probe)\b/i;
function createSatire(stories,{date='',variant=0}={}){
  if(!Array.isArray(stories)||!stories.length)fail(400,'A source story is required for satire.');
  const candidates=[],seen=new Set();
  for(const [index,story] of stories.entries()){
    if(sensitiveStory.test([story.title,story.description,story.brief].filter(Boolean).join(' ')))continue;
    const angle=comicAngles.find(([pattern])=>pattern.test(story.title));
    if(!angle)continue;
    for(const scene of angle[1]){
      // The same gag attached to another headline is still the same gag.
      if(seen.has(scene[0]))continue;
      seen.add(scene[0]);candidates.push({scene,storyPosition:index+1});
    }
  }
  const general=!candidates.length;
  if(general)for(const scene of readingScenes)candidates.push({scene,storyPosition:1});
  let hash=0;for(const char of stories.map(s=>s.title).join('|'))hash=(Math.imul(hash,31)+char.codePointAt(0))>>>0;
  const day=Math.floor(Date.parse(date+'T00:00:00Z')/86400000)||0;
  const offset=Number.isSafeInteger(variant)&&variant>=0?variant:0;
  const {scene,storyPosition}=candidates[((hash+day)%candidates.length+offset%candidates.length)%candidates.length];
  return {storyPosition,title:scene[0],body:[
    general?'Reading-room comic: about news-reading habits, not the people or events in this edition.':'In the news: '+stories[storyPosition-1].title,
    ...scene.slice(1).map((line,i)=>'Panel '+(i+1)+': '+line),
    'This is fictional humour: imaginary characters, not real quotes or events.'
  ].join('\n\n')};
}
function draftEdition(preview){
  if(preview.stories?.length!==10)fail(502,'Ten source stories are required before publication.');
  const stories=preview.stories.map(s=>{
    if(!['PIB','IndianExpress','BBC'].includes(s.provider)||!s.publishedAt||typeof s.description!=='string'||!s.description.trim())fail(502,'These source stories do not contain verified publication times and reusable excerpts.');
    return {...s,brief:s.provider!=='PIB'?`${s.category||'News'} · Source excerpt: ${s.description}…`:s.description};
  });
  const satire=createSatire(stories,{date:preview.date});
  return {date:preview.date,cutoff:preview.cutoff,publishedAt:new Date().toISOString(),stories,satire,model:'local-editorial-template',promptVersion:'news-comic-v3'};
}

function parseFeed(xml,cutoff,category='World'){
  const stories=[];
  for(const match of xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)){
    const field=name=>clean((match[1].match(new RegExp('<'+name+'(?:\\s[^>]*)?>([\\s\\S]*?)</'+name+'>','i'))?.[1]||'').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1'));
    const title=field('title'),link=field('link'),at=Date.parse(field('pubDate')),description=field('description').split(/\s+/).slice(0,25).join(' ');
    let url;try{url=new URL(link);}catch{continue;}
    if(!['https://www.bbc.co.uk','https://www.bbc.com'].includes(url.origin)||url.username||url.password||!title||title.length>300||!description||!Number.isFinite(at)||at>Date.parse(cutoff)||indiaDate(at)!==indiaDate(cutoff))continue;
    url.search='';url.hash='';
    stories.push({title,url:url.href,source:'BBC News',provider:'BBC',publishedAt:new Date(at).toISOString(),observedAt:cutoff,description,category});
  }
  return stories;
}
async function fetchFeedStories(cutoff,fetchImpl=globalThis.fetch){
  const signal=AbortSignal.timeout(25000);
  const feeds=[['world/asia/india/','India'],['world/','World'],['business/','Money'],['technology/','Tech'],['entertainment_and_arts/','Life & culture'],['science_and_environment/','Tech'],['health/','Life & culture'],['world/asia/','World']];
  const results=await Promise.allSettled(feeds.map(async ([path,category])=>{
    const response=await fetchImpl('https://feeds.bbci.co.uk/news/'+path+'rss.xml',{signal,redirect:'manual'});
    if(!response.ok){await response.body?.cancel();fail(502,'News feed unavailable (HTTP '+response.status+')');}
    let xml='',size=0;const decoder=new TextDecoder();
    for await(const chunk of response.body){size+=chunk.length;if(size>2000000)fail(502,'News feed too large');xml+=decoder.decode(chunk,{stream:true});}
    return parseFeed(xml+decoder.decode(),cutoff,category);
  }));
  const stories=selectDiverse(results.flatMap(r=>r.status==='fulfilled'?r.value:[]));
  if(stories.length<10)fail(502,'Ten dated feed stories unavailable. '+(results.find(r=>r.status==='rejected')?.reason.message||''));
  return stories;
}
return {createArchiveProvider,parseListing,parseArticle,selectDiverse,duplicate,desk,draftEdition,createSatire,indiaDate,parseFeed,fetchFeedStories};
});
