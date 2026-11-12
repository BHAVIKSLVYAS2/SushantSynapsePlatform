// Fixed print palette deliberately independent of the application's viewing theme.
const palette={paper:'#fffaf0',ink:'#382e26',gold:'#987436',light:'#dcca9e',muted:'#76654c'};
export function renderCertificate(canvas,data){
 canvas.width=3508;canvas.height=2480;const x=canvas.getContext('2d');x.scale(3.125,3.125);const w=1122,h=793.6;
 x.fillStyle=palette.paper;x.fillRect(0,0,w,h);x.strokeStyle=palette.gold;x.lineWidth=2;x.strokeRect(28,28,w-56,h-56);x.lineWidth=.6;x.strokeRect(37,37,w-74,h-74);x.strokeRect(45,45,w-90,h-90);
 for(const [cx,cy]of [[65,65],[w-65,65],[65,h-65],[w-65,h-65]]){x.save();x.translate(cx,cy);for(let i=0;i<8;i++){x.rotate(Math.PI/4);x.beginPath();x.ellipse(0,12,5,18,0,0,Math.PI*2);x.stroke();}x.restore();}
 x.save();x.translate(w/2,335);x.globalAlpha=.09;x.strokeStyle=palette.gold;for(let i=0;i<24;i++){x.rotate(Math.PI/12);x.beginPath();x.ellipse(0,70,34,135,0,0,Math.PI*2);x.stroke();}x.restore();
 const line=(s,y,size=20,color=palette.ink,family='Georgia')=>{x.fillStyle=color;x.font=`${size}px ${family}, serif`;while(x.measureText(s).width>w-180&&size>10){size--;x.font=`${size}px ${family}, serif`;}x.textAlign='center';x.fillText(s,w/2,y);};
 line('ॐ',115,48,palette.gold);line('J A P S E V A',155,16,palette.gold);line('Certificate of Mantra Seva',211,40);line('A DEDICATION FULFILLED',246,12,palette.muted);
 line('With devotion, this practice was performed on behalf of',307,18,palette.muted);line(data.client,362,48);x.strokeStyle=palette.light;x.beginPath();x.moveTo(320,382);x.lineTo(802,382);x.stroke();
 // Wrap long custom mantras without losing their content or overflowing the page.
 let rows=[],font=25;for(;font>=8;font--){rows=[];let row='';x.font=`${font}px serif`;for(const c of data.mantra){if(x.measureText(row+c).width>900){rows.push(row);row=c;}else row+=c;}if(row)rows.push(row);if(rows.length*(font+5)<=110)break;}rows.forEach((s,i)=>line(s,420+i*(font+5),font,palette.gold,'serif'));
 const y=555;line(Number(data.count).toLocaleString('en-IN')+' repetitions completed',y,30);line('Performed by '+data.practitioner,y+45,20);line('Completed '+new Intl.DateTimeFormat('en-IN',{dateStyle:'long',timeZone:'Asia/Kolkata'}).format(new Date(data.completedAt)),y+78,16,palette.muted);
 line('Recorded by the practitioner · A personal acknowledgement of practice',701,13,palette.muted);line(data.certificateId,725,10,palette.muted);line('JapSeva · Sushant Synapse',748,12,palette.gold);return canvas;
}
