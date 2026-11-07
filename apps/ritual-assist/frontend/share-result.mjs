import {downloadBlob} from '/shared/download.mjs';

// Prepare the file before the tap so mobile Web Share keeps its user activation.
export function mountShareResult(container,{language='en',render,filename,title,label}){
 const hi=language==='hi',panel=document.createElement('div'),button=document.createElement('button'),status=document.createElement('p'),canvas=document.createElement('canvas');
 panel.className='ritual-result-share';button.type='button';button.className='primary';
 button.textContent=label||(hi?'परिणाम साझा करें':'Share result');status.className='fine';status.setAttribute('role','status');canvas.hidden=true;
 panel.append(button,status,canvas);container.append(panel);
 let file=null,generation=0,busy=false;
 function prepare(){
  const version=++generation;file=null;button.disabled=true;status.textContent='';
  try{
   panel.hidden=!render(canvas);if(panel.hidden)return;
   canvas.toBlob(blob=>{if(version!==generation)return;if(!blob){status.textContent=hi?'चित्र नहीं बन सका। फिर गणना करें।':'Could not prepare the image. Please calculate again.';return;}file=new File([blob],filename(),{type:'image/png'});button.disabled=busy;},'image/png');
  }catch(error){status.textContent=error.message;panel.hidden=false;}
 }
 button.onclick=async()=>{
  if(!file||busy)return;busy=true;button.disabled=true;
  try{
   if(navigator.share&&navigator.canShare?.({files:[file]}))await navigator.share({title:title(),files:[file]});
   else{downloadBlob(file,file.name,{cleanupDelay:1000});status.textContent=hi?'चित्र डाउनलोड हुआ। इसे साझा कर सकते हैं।':'Image downloaded. It is ready to share.';}
  }catch(error){if(error.name!=='AbortError')status.textContent=error.message;}
  finally{busy=false;button.disabled=!file;}
 };
 panel.prepare=prepare;prepare();
 document.fonts?.ready.then(()=>{if(panel.isConnected&&!busy)prepare();});
 return panel;
}
