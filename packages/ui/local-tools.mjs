import {downloadBlob} from './download.mjs';
export const $=selector=>document.querySelector(selector);
export function init(){function theme(){document.documentElement.dataset.theme=SynapseTheme.read();}theme();window.addEventListener('storage',theme);window.addEventListener('synapse-theme-change',theme);}
export function download(blob,name){downloadBlob(blob,name,{cleanupDelay:1000});}
export async function copy(text){try{if(navigator.clipboard){await navigator.clipboard.writeText(text);$('#status').textContent='Copied. Paste it into your group chat.';return;}}catch{}$('#copy-text').hidden=false;$('#copy-text').value=text;$('#copy-text').focus();$('#copy-text').select();$('#status').textContent='Select and copy the text below.';}
