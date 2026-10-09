export const emptySupport={title:'Sushant Synapse',upiId:'',paymentUrl:'',isActive:false};
export const treats=[{name:'Chai',amount:20,icon:'☕',line:'A little encouragement'},{name:'Coffee',amount:49,icon:'♨',line:'Fuel the next improvement'},{name:'A snack',amount:99,icon:'♡',line:'Support the everyday tools'},{name:'A meal',amount:249,icon:'✦',line:'Help us keep building'}];
export function validateSupport(input){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Invalid support settings');
 const result={};for(const [key,max] of [['title',100],['upiId',321],['paymentUrl',1000]]){if(typeof input[key]!=='string'||input[key].length>max)throw Error('Invalid '+key);result[key]=input[key].trim();}
 if(!result.title||/[\u0000-\u001f\u007f<>]/.test(result.title))throw Error('Enter a recipient name (maximum 100 characters)');
 if(result.upiId&&!/^[A-Za-z0-9._-]{2,256}@[A-Za-z]{2,64}$/.test(result.upiId))throw Error('Enter a valid UPI ID');
 if(result.paymentUrl){let url;try{url=new URL(result.paymentUrl);}catch{throw Error('Enter an HTTPS payment link');}if(url.protocol!=='https:'||url.username||url.password||/[\s\\]/.test(result.paymentUrl)||!url.hostname.includes('.')||url.hostname.endsWith('.'))throw Error('Enter a public HTTPS payment link without credentials');}
 if(typeof input.isActive!=='boolean')throw Error('Invalid enabled state');result.isActive=input.isActive;
 if(result.isActive&&!result.upiId&&!result.paymentUrl)throw Error('Add a verified UPI ID or HTTPS payment link before enabling support');
 return result;
}
export function paymentTarget(config,treat){const valid=validateSupport(config);if(!valid.isActive)return '';if(valid.upiId){if(!treats.some(t=>t.amount===treat.amount&&t.name===treat.name))throw Error('Invalid contribution');return 'upi://pay?'+new URLSearchParams({pa:valid.upiId,pn:valid.title,am:String(treat.amount),cu:'INR',tn:'Support with '+treat.name});}return valid.paymentUrl;}
