export const sponsorPages = Object.freeze({home:'/',teams:'/team-mixer',wheel:'/decision-wheel',spark:'/daily-spark',timetable:'/timetable-lite',news:'/news'});
const text=(value,max)=>typeof value==='string'&&value.trim().length>0&&value.length<=max;
export function safeSponsorUrl(value){
 try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password&&url.hostname.includes('.')&&!url.port&&!/[\u0000-\u0020]/.test(value)&&value.length<=500?url.href:null;}catch{return null;}
}
export function validateSponsorConfig(config){
 if(!config||typeof config.enabled!=='boolean'||!Array.isArray(config.campaigns)||config.campaigns.length>30)throw Error('Invalid sponsorship configuration');
 if(config.contact!==null&&(!config.contact||config.contact.type!=='email'||!text(config.contact.value,160)||! /^[^\s@<>?]+@[^\s@<>?]+\.[^\s@<>?]+$/.test(config.contact.value)))throw Error('Invalid public sponsorship contact');
 const ids=new Set();
 for(const campaign of config.campaigns){
  if(!campaign||!text(campaign.id,60)||!/^[a-z0-9-]+$/.test(campaign.id)||ids.has(campaign.id)||typeof campaign.approved!=='boolean'||!text(campaign.sponsor,70)||!text(campaign.title,100)||!text(campaign.description,220)||!safeSponsorUrl(campaign.url)||!Array.isArray(campaign.pages)||!campaign.pages.length||campaign.pages.some(page=>!Object.hasOwn(sponsorPages,page)))throw Error('Invalid sponsorship creative');
  const validDate=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().replace('.000','')===value;
  if(!validDate(campaign.startsAt)||!validDate(campaign.endsAt)||Date.parse(campaign.startsAt)>=Date.parse(campaign.endsAt))throw Error('Invalid sponsorship dates');
  ids.add(campaign.id);
 }
 return config;
}
export function chooseSponsor(config,page,now=Date.now()){
 try{validateSponsorConfig(config);}catch{return null;}
 if(!config.enabled||!Object.hasOwn(sponsorPages,page))return null;
 return config.campaigns.find(c=>c.approved&&c.pages.includes(page)&&Date.parse(c.startsAt)<=now&&now<Date.parse(c.endsAt))||null;
}
