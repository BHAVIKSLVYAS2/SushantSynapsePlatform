export const whatsappNumber='917874166009';
const labels={name:'Name',phone:'Contact phone',email:'Contact email',business:'Business',website:'Website',placement:'Preferred placement',amount:'Proposed contribution',topic:'Topic',message:'Message / dates / budget'};
export function contactMessage(kind,fields,page){
 const lines=['Sushant Synapse — '+kind+' enquiry'];
 for(const [key,label]of Object.entries(labels)){const value=String(fields[key]??'').trim();if(value)lines.push(label+': '+value);}
 // Only the page path is included, never query strings, account or app records.
 if(typeof page==='string'&&/^\/[a-z0-9/_.-]*$/i.test(page))lines.push('Page: '+page);
 const message=lines.join('\n\n');if(message.length>4500)throw Error('Please shorten your message to prepare the WhatsApp link.');return message;
}
export function whatsappLink(message){return 'https://wa.me/'+whatsappNumber+'?text='+encodeURIComponent(message);}
