'use strict';
const {fail}=require('../../../server/http');
const {sensitive}=require('./security');
const personFields=['hindiName','englishName','gender','dob','birthTime','birthPlace','bloodGroup','maritalStatus','mobile','whatsapp','email','education','qualification','achievements','occupation','designation','organization','workplace','isDeceased','dateOfDeath','nativeVillage','district','state','currentCity','address','pin'];
const familyFields=['name','nativeVillage','district','state','gotra','kul','kuldevi','kuldevta','address','currentCity','pin','mobile','alternateMobile','whatsapp','email'];
function text(v,name,max=200,required=false){if(v===undefined||v===null)v='';if(typeof v!=='string'||v.length>max||(required&&!v.trim()))fail(400,`${name}: invalid or missing value`);return v.trim();}
function date(v,name){v=text(v,name,10);const d=new Date(v+'T00:00:00Z');if(v&&(!/^\d{4}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==v||v>new Date().toISOString().slice(0,10)))fail(400,`${name}: invalid or future date`);return v;}
function clean(kind,input,old={}){
 if(!input||typeof input!=='object'||Array.isArray(input))fail(400,'Profile must be an object');
 const fields=kind==='person'?personFields:familyFields,d={...old};
 for(const k of Object.keys(input)){if(!fields.includes(k))fail(400,`Unknown field: ${k}`);if(k==='isDeceased'){if(typeof input[k]!=='boolean')fail(400,'Invalid deceased flag');d[k]=input[k];}else d[k]=text(input[k],k,k==='achievements'||k==='address'?1000:200);}
 if(kind==='person'){
  if(!d.englishName&&!d.hindiName)fail(400,'Name is required');
  for(const k of ['dob','dateOfDeath'])if(d[k])d[k]=date(d[k],k);
  if(d.dateOfDeath&&(!d.isDeceased||(d.dob&&d.dateOfDeath<d.dob)))fail(400,'Death date must follow birth date and deceased status');
  if(d.gender&&!['Male','Female','Other','Unspecified'].includes(d.gender))fail(400,'Invalid gender');
  if(d.bloodGroup&&!['A+','A-','B+','B-','AB+','AB-','O+','O-'].includes(d.bloodGroup))fail(400,'Invalid blood group');
  if(d.maritalStatus&&!['Single','Married','Widowed','Divorced','Separated','Unspecified'].includes(d.maritalStatus))fail(400,'Invalid marital status');
  if(d.birthTime&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(d.birthTime))fail(400,'Invalid birth time');
 }else if(!d.name)fail(400,'Family name is required');
 for(const k of ['mobile','alternateMobile','whatsapp'])if(d[k]&&!/^\+?[0-9 ()-]{7,20}$/.test(d[k]))fail(400,`Invalid ${k}`);
 if(d.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email))fail(400,'Invalid email');
 if(d.pin&&!/^\d{6}$/.test(d.pin))fail(400,'PIN must have six digits');
 return d;
}
function privacy(input={},old={}){if(!input||typeof input!=='object'||Array.isArray(input))fail(400,'Invalid privacy settings');const out={...old};for(const [k,v]of Object.entries(input)){if(!sensitive.includes(k)||!['PRIVATE','FAMILY','SAMAJ','ADMIN','PUBLIC'].includes(v))fail(400,'Invalid visibility');out[k]=v;}return out;}
module.exports={clean,privacy,text,date,personFields,familyFields};
