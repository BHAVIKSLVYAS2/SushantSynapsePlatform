const escape=value=>value.replace(/[\\;:,"]/g,'\\$&');
export function wifiPayload({ssid,security='WPA',password='',hidden=false}){
 if(typeof ssid!=='string'||!ssid.trim()||new TextEncoder().encode(ssid).length>32)throw Error('Enter a network name of up to 32 UTF-8 bytes.');
 if(!['WPA','WEP','nopass'].includes(security))throw Error('Choose a supported security type.');
 if(typeof password!=='string'||password.length>128)throw Error('Keep the password under 129 characters.');
 if(security!=='nopass'&&!password)throw Error('Enter the network password.');
 return `WIFI:T:${security};S:${escape(ssid)};${security==='nopass'?'':`P:${escape(password)};`}H:${hidden?'true':'false'};;`;
}
