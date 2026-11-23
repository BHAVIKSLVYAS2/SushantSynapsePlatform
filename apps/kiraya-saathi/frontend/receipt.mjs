import {rentalText,propertyTypeKey} from './copy.mjs';
import {money} from './engine.mjs';
import {pdfBlob} from '/shared/canvas-pdf.mjs';
export function paymentPdf(data,language='en'){
 const tr=key=>rentalText(language,key);
 const c=document.createElement('canvas');c.width=1754;c.height=1240;const x=c.getContext('2d');x.fillStyle='#ffffff';x.fillRect(0,0,c.width,c.height);x.fillStyle='#16382f';
 const write=(text,left,top,size=27,bold=false)=>{x.font=`${bold?'600':'400'} ${size}px system-ui, "Nirmala UI", sans-serif`;x.fillText(text,left,top);};
 const wrap=(value,top,max=1580)=>{x.font='26px system-ui, "Nirmala UI", sans-serif';let line='';for(const ch of value){if(x.measureText(line+ch).width>max){write(line,85,top,26);top+=35;line='';}line+=ch;}if(line){write(line,85,top,26);top+=35;}return top;};
 write('KIRAYA SAATHI',85,90,26,true);write(tr('Rent payment receipt'),85,155,52,true);write(data.receiptId,85,205,20);
 let y=260;y=wrap(tr('Received by: ')+(data.owner||tr('Property owner')),y);y=wrap(tr('Received from: ')+data.tenant.name,y+12);y=wrap(tr('Property')+': '+data.property.name+' ('+tr(propertyTypeKey(data.property.type))+')',y+12);if(data.property.address)y=wrap(data.property.address,y);
 y+=25;write(money(data.payment.amount),85,y+50,60,true);y+=110;
 for(const [label,value]of [[tr('Rent period'),data.bill.month],[tr('Payment date'),data.payment.date],[tr('Payment method'),tr(data.payment.method)],[tr('Reference'),data.payment.reference||tr('Not entered')]])y=wrap(`${label}: ${value}`,y+12);
 write(tr('Acknowledges this payment only; it does not certify full settlement.'),85,1120,23);write(tr('Payment entered by the owner. Generated locally with Kiraya Saathi.'),85,1160,21);
 return pdfBlob(c);
}
