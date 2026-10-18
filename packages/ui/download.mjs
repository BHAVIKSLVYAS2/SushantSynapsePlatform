// Keep app-specific cleanup timing while sharing the browser download lifecycle.
export function downloadBlob(blob,name,{cleanupDelay=60000}={}){
 const url=URL.createObjectURL(blob),link=document.createElement('a');
 try{link.href=url;link.download=name;link.click();}
 finally{setTimeout(()=>URL.revokeObjectURL(url),cleanupDelay);}
}
