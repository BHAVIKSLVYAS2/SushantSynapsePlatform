import QR from '/support-qr.mjs';
import {$,init,download} from '/shared/local-tools.mjs?v=20261016-wins';
init();let ready=false;
$('#editor').onsubmit=e=>{e.preventDefault();ready=false;$('#download').disabled=true;$('#qr').hidden=true;try{
 const value=$('#content').value.trim();if(!value||new TextEncoder().encode(value).length>1200)throw Error('Enter up to 1,200 UTF-8 bytes of text or a link.');
 if($('#kind').value==='url'){const url=new URL(value);if(!['https:','http:'].includes(url.protocol))throw Error('Use a full https:// or http:// link.');}
 const qr=QR.create(value,{errorCorrectionLevel:'M'}),n=qr.modules.size,pixel=Math.max(4,Math.floor(768/(n+8))),side=(n+8)*pixel,c=$('#qr');c.width=c.height=side;const ctx=c.getContext('2d');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,side,side);ctx.fillStyle='#000000';for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(qr.modules.get(y,x))ctx.fillRect((x+4)*pixel,(y+4)*pixel,pixel,pixel);
 c.hidden=false;ready=true;$('#download').disabled=false;$('#status').textContent='QR ready. Scan the preview to check it before printing or sharing.';
 }catch(error){$('#status').textContent=error instanceof TypeError?'Use a full valid link, including https://.':error.message;}};
$('#editor').addEventListener('input',()=>{ready=false;$('#download').disabled=true;$('#qr').hidden=true;$('#status').textContent='Create a QR for your updated content.';});
$('#download').onclick=()=>{if(!ready)return;$('#qr').toBlob(blob=>{if(blob)download(blob,'my-qr-code.png');else $('#status').textContent='Could not create the PNG. Try again.';},'image/png');};
