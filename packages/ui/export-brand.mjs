// Export ink is independent of the editor theme so shared files stay legible.
export const exportBrand='Sushant Synapse';
const logo=await(async()=>{if(typeof Image==='undefined')return null;const image=new Image();image.src='/logo-adaptive-192.png';let timer;try{await Promise.race([image.decode(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Logo unavailable')),8000);})]);return image.naturalWidth?image:null;}catch{return null;}finally{clearTimeout(timer);}})();
export function drawExportBrand(ctx,{width,height,ink='#526174',size=14}){
 if(!logo)throw Error('The Sushant Synapse logo could not load. Reload before exporting.');
 ctx.save();ctx.font=`500 ${size}px "Segoe UI", Arial, sans-serif`;ctx.fillStyle=ink;
 const logoSize=size+6,gap=6,left=(width-ctx.measureText(exportBrand).width-logoSize-gap)/2,y=height-22;
 ctx.drawImage(logo,left,y-logoSize/2,logoSize,logoSize);ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillText(exportBrand,left+logoSize+gap,y);ctx.restore();
}
export function exportBrandElement(){const mark=document.createElement('p');mark.className='export-brand';const image=document.createElement('img');image.src='/logo-adaptive-192.png';image.width=image.height=20;image.alt='';mark.append(image,document.createTextNode(exportBrand));return mark;}
