const {fail}=require('../../../server/http');
function draftEdition(preview){
  if(preview.stories?.length!==10)fail(502,'Ten source stories are required before publication.');
  const stories=preview.stories.map(s=>{
    if(s.provider!=='PIB'||!s.publishedAt||typeof s.description!=='string'||s.description.length<80)fail(502,'These source stories do not contain verified publication times and reusable excerpts.');
    return {...s,brief:s.description};
  });
  const index=stories.findIndex(s=>/campaign|review|conference|technology|digital|transport|rail|launch/i.test(s.title));
  const storyPosition=(index<0?0:index)+1;
  const subject=stories[storyPosition-1].title;
  // Original deterministic fictional commentary, not an AI response or a quotation from PIB.
  const satire={storyPosition,title:'The Department of Taking Note Takes Note',body:`Inspired by today’s headline: “${subject}”.\n\nIn our entirely imaginary Department of Taking Note, the morning newspaper has triggered an emergency meeting to decide whether this development should be welcomed immediately or welcomed after tea. A subcommittee favours both, provided each welcome receives its own reference number.\n\nThe office printer has requested a briefing before printing the briefing. Meanwhile, the progress dashboard shows a reassuring green tick beside “Dashboard created”. Nobody has yet found the column for actual progress, but a working group is looking into it.\n\nBy lunchtime, the department has produced three action plans, two revised agendas and a beautifully formatted invitation to tomorrow’s follow-up. The tea has gone cold, which is the only development everyone agrees needs immediate action.\n\nThis is fictional humour about paperwork, not a report of any real meeting, statement or person.`};
  return {date:preview.date,cutoff:preview.cutoff,publishedAt:new Date().toISOString(),stories,satire,model:'local-editorial-template',promptVersion:'pib-excerpt-satire-v1'};
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
