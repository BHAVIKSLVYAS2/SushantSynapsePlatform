const {draftEdition}=require('../frontend/engine');
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
