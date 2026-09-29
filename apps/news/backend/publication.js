const {fail}=require('../../../server/http');
function draftEdition(preview){
  if(preview.stories?.length!==10)fail(502,'Ten source stories are required before publication.');
  const stories=preview.stories.map(s=>{
    if(!['PIB','IndianExpress'].includes(s.provider)||!s.publishedAt||typeof s.description!=='string'||!s.description.trim())fail(502,'These source stories do not contain verified publication times and reusable excerpts.');
    return {...s,brief:s.provider==='IndianExpress'?`${s.category||'News'} · Source excerpt: ${s.description}…`:s.description};
  });
  const safe=stories.filter(s=>!/death|killed|rape|assault|suicide|attack|disaster|murder|war|victim|arrest|accus|probe|fraud/i.test(s.title));
  const chosen=safe.find(s=>/film|movie|trailer|cinema|music|festival|technology|digital|launch|cricket|sport/i.test(s.title))||safe[0];
  const storyPosition=chosen?stories.indexOf(chosen)+1:1,subject=stories[storyPosition-1].title;
  const scenes={
    'Masala · Entertainment':['The group chat has entered the cinema','ME: One quick entertainment update. Then I work.','BESTIE: You analysed that harder than your exam syllabus.','ME: This is research. My unfinished assignment is the sequel.'],
    Sport:['The sofa coach is online','ME: I have a complete strategy for this match.','BESTIE: Your fitness watch just asked if you are still alive.','ME: I bring tactical depth. The sofa brings back support.'],
    Tech:['My phone got the upgrade. I did not.','ME: Another tech update. We are living in the future.','PHONE: Great. Please free up storage.','ME: The future can wait. Those 4,000 screenshots are important.'],
    Money:['Budget meeting: me versus my cart','ME: Time to understand the economy.','SHOPPING CART: Start with these twelve things you do not need.','ME: I said understand it. Not take personal feedback.'],
    'Life & culture':['Main character, low battery','ME: This is my sign to go outside and have a life.','BESTIE: Are you coming or making a mood board?','ME: The mood board has excellent attendance.'],
    India:['Big update. Tiny attention span.','ME: Reading the news. Becoming an informed adult.','BESTIE: Can you explain the headline without opening six tabs?','ME: Yes. Right after I close the tab playing music somewhere.'],
    Sensitive:['The scroll needs a tea break','ME: That is a lot to take in.','PHONE: Another notification?','ME: No. Tea first. The endless scroll can wait.']
  };
  const scene=scenes[chosen?require('./archive-provider').desk(chosen.url):'Sensitive']||scenes.India;
  const satire={storyPosition,title:scene[0],body:['In the news: '+subject,'Panel 1: '+scene[1],'Panel 2: '+scene[2],'Panel 3: '+scene[3],'This is fictional humour: imaginary readers reacting to a real headline, not real quotes or events.'].join('\n\n')};
  return {date:preview.date,cutoff:preview.cutoff,publishedAt:new Date().toISOString(),stories,satire,model:'local-editorial-template',promptVersion:'news-comic-v2'};
}
function createPublicationService({repository,fetching}){
  return {async fetchDate(date){
    const preview=await fetching.fetchDate(date);
    if(preview.state==='published')return preview;
    const saved=repository.get(preview.date);
    if(saved)return {date:preview.date,state:'published',edition:saved,cached:true};
    const edition=repository.publish(draftEdition(preview));
    return {date:edition.date,state:'published',edition,cached:false};
  }};
}
module.exports={draftEdition,createPublicationService};
