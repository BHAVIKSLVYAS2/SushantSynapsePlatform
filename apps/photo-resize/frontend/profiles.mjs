// Dated official guidance: digital checks, never an acceptance promise.
export const profiles=Object.freeze({
 custom:{name:'Custom — copy your form requirements',width:1600,height:1600,kb:200,minKb:0,fit:'fit',format:'image/jpeg',dpi:0},
 'india-evisa':{name:'Indian e-Visa — square photo',width:600,height:600,kb:1000,minKb:10,maxBytes:1000000,fit:'crop',format:'image/jpeg',dpi:0,kind:'photo',checked:'2026-10-31',source:'https://indianvisaonline.gov.in/evisa/tvoa.html',reference:'Official e-Visa document requirements',note:'Official guidance: JPEG, 10 KB–1 MB, square image. 600 × 600 px is this tool’s working size, not an official minimum. Check the current portal and review your whole face, lighting and background.'},
});
export function profileOptions(id){if(!Object.hasOwn(profiles,id))throw Error('Choose a known profile.');return {...profiles[id]};}
