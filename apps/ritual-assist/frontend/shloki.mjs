// Keep the Sanskrit collection and reader out of the initial checklist load.
let modulePromise;
export function mountShloki(parent,{language,onNavigate}){
 const root=document.createElement('details'),summary=document.createElement('summary'),body=document.createElement('div');
 root.className='shloki-collection card';root.translate=false;root.setAttribute('data-language-preserve','');body.className='shloki-body';root.append(summary,body);parent.prepend(root);
 let selected='ganesh-dhyana',view,loading=false;
 const label=()=>{summary.textContent=language==='hi'?'श्लोकी संग्रह':'Shloki collection';};label();
 async function load(){
  if(view){view.show(selected,language);return;}if(loading)return;loading=true;
  const status=document.createElement('p');status.role='status';status.textContent=language==='hi'?'पाठ खुल रहा है…':'Opening the collection…';body.replaceChildren(status);
  try{const module=await(modulePromise??=import('./shloki-view.mjs'));if(!root.isConnected)return;view=module.mountShlokiReader(body,{onChoose:id=>onNavigate(id)});view.show(selected,language);}
  catch{modulePromise=null;status.textContent=language==='hi'?'पाठ नहीं खुला। फिर प्रयास करें।':'Could not open the collection. Try again.';const retry=document.createElement('button');retry.type='button';retry.textContent=language==='hi'?'फिर प्रयास करें':'Try again';retry.onclick=()=>void load();body.append(retry);}
  finally{loading=false;}
 }
 root.addEventListener('toggle',()=>{const id=new URL(location.href).searchParams.get('shloka');if(root.open){if(!id)onNavigate(selected);else void load();}else if(id)onNavigate(null);});
 return {
  restore(id){if(id)selected=/^[a-z0-9-]{1,60}$/.test(id)?id:'unavailable';root.open=Boolean(id);if(root.open)void load();},
  setLanguage(next){if(language===next)return;language=next;label();if(view)view.show(selected,language);},
  root
 };
}
