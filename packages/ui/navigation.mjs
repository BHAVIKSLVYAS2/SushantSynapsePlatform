// Only real screen changes create entries. No synthetic landing entries or Back traps.
export function createNavigation(restore) {
 const onPop=()=>restore(new URL(location.href));
 addEventListener('popstate',onPop);
 return {
  go(value,{replace=false}={}) {
   const url=new URL(value,location.href);
   if(url.origin!==location.origin)throw new TypeError('Navigation must stay on this origin');
   if(url.href===location.href)return false;
   const state={...history.state,synapseNavigation:replace?history.state?.synapseNavigation:{parent:location.href}};
   history[replace?'replaceState':'pushState'](state,'',url);
   return true;
  },
  back(fallback) {
   if(history.state?.synapseNavigation?.parent===new URL(fallback,location.href).href&&history.length>1)history.back();
   else {this.go(fallback,{replace:true});onPop();}
  },
  destroy(){removeEventListener('popstate',onPop);}
 };
}

// A shareable overlay route also makes browser Back and Forward work on mobile.
export function bindDialogNavigation(dialog,{parameter='overlay',value,show=()=>dialog.showModal()}={}) {
 let restoring=false;
 const restore=url=>{
  restoring=true;
  try{if(url.searchParams.get(parameter)===value){if(!dialog.open)show();}else if(dialog.open)dialog.close();}
  finally{restoring=false;}
 };
 const navigation=createNavigation(restore);
 const close=()=>{if(restoring||new URL(location.href).searchParams.get(parameter)!==value)return;
  const fallback=new URL(location.href);fallback.searchParams.delete(parameter);navigation.back(fallback);
 };
 dialog.addEventListener('close',close);
 restore(new URL(location.href));
 return {open(){const url=new URL(location.href);url.searchParams.set(parameter,value);navigation.go(url);restore(url);}};
}
