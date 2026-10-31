// Keep the source/verse collection out of the initial checklist download.
let viewModule;
const tabs=['vidhi','mantras','sources'];
export function mountLearning(parent,{guide,language,onNavigate}){
 const hi=language==='hi',root=document.createElement('details');root.className='ritual-learning';root.dataset.ritualLearning=guide.id;root.translate=false;
 const summary=document.createElement('summary');summary.textContent=hi?'इस अनुष्ठान को समझें · विधि और मंत्र':'Learn this ritual · Vidhi & mantras';
 const body=document.createElement('div');body.className='learning-body';root.append(summary,body);parent.append(root);
 let selected='vidhi',view,loading=false;
 const choose=(tab,update=true)=>{if(!tabs.includes(tab))tab='vidhi';selected=tab;if(update)onNavigate(tab);root.open=true;void load();view?.select(tab);};
 async function load(){
  if(view||loading)return;loading=true;body.replaceChildren();const status=document.createElement('p');status.setAttribute('role','status');status.textContent=hi?'सीखने की सामग्री खुल रही है…':'Opening the learning guide…';body.append(status);
  try{const module=await(viewModule??=import('./learning-view.mjs'));if(!root.isConnected)return;view=module.renderLearning(body,{guide,language,onChoose:choose});view.select(selected);}
  catch{viewModule=null;status.textContent=hi?'सीखने की सामग्री नहीं खुल सकी। फिर प्रयास करने के लिए पृष्ठ रीलोड करें।':'The learning guide could not load. Reload the page to try again.';const retry=document.createElement('button');retry.type='button';retry.textContent=hi?'रीलोड करें':'Reload';retry.onclick=()=>location.reload();body.append(retry);}
  finally{loading=false;}
 }
 root.addEventListener('toggle',()=>{if(root.open){const tab=new URL(location.href).searchParams.get('learn');choose(tabs.includes(tab)?tab:'vidhi',!tabs.includes(tab));}else if(tabs.includes(new URL(location.href).searchParams.get('learn')))onNavigate(null);});
 return {root,restore(tab){if(tabs.includes(tab))choose(tab,false);else root.open=false;}};
}
