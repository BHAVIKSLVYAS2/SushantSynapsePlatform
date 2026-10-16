// Export ink is independent of the editor theme so shared files stay legible.
export const exportBrand='Created with Sushant Synapse';
export function drawExportBrand(ctx,{width,height,ink='#526174',size=14}){
 ctx.save();ctx.font=`500 ${size}px "Segoe UI", Arial, sans-serif`;ctx.fillStyle=ink;
 ctx.textAlign='center';ctx.textBaseline='alphabetic';ctx.fillText(exportBrand,width/2,height-18);ctx.restore();
}
