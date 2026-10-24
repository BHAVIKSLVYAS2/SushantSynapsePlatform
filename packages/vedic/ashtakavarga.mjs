import {fields,fail,freeze} from './diagnostics.mjs';
export const ashtakavargaModel=freeze({id:'pvr-raw-seven-bav-eight-contributors-v1',
 source:{title:'P.V.R. Narasimha Rao: Vedic Astrology, An Integrated Approach',url:'https://vedicastrologer.org/articles/vedic_astro_textbook.pdf',locator:'chapter 12, tables 19–25'},
 contributors:['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Lagna'],recipients:['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'],
 pointConvention:'1 = positive contribution (rekha in this source); 0 = no contribution; terminology differs by school',
 reduction:'none; no Trikona/Ekadhipatya or Sodhya Pinda',scope:'D1 sign inputs only; excludes nodes and a separate Lagna recipient row',
 releaseStatus:'internal-candidate-independent-table-review-pending'});
// One string per relative sign-house, bits in model contributor order.
// Factual numeric transcription of tables 19–25; no publisher prose or figures.
const table=freeze({
 Sun:['10100010','10100010','01010001','10100011','00011000','01011101','10100110','10100010','10111010','11110011','11111011','00010101'],
 Moon:['01011000','00101000','11110111','00011100','00110110','11100011','11011100','10011000','01000100','11111101','11111111','00000000'],
 Mars:['00100011','00100000','11010001','00100010','10010000','11011101','00100010','00100110','00000010','10101011','11111111','00001100'],
 Mercury:['00110111','01100111','00010100','01100111','10010100','11011001','00100010','01101111','10110110','01110011','11111111','10011000'],
 Jupiter:['10111001','11111101','10001010','10111001','01010111','00010111','11101001','10101000','11010101','10111101','11111101','00000010'],
 Venus:['01000101','01000101','01110111','01100111','01011111','00110000','00000000','11001111','01111111','00001110','11111111','11100000'],
 Saturn:['10000001','10000000','01100011','10000001','00101010','01111111','10000000','10010000','00010000','10110001','11111111','00111100']
});
export function rawAshtakavarga(input){
 fields(input,['modelId','signs']);if(input.modelId!==ashtakavargaModel.id)fail('MODEL_UNAVAILABLE');fields(input.signs,ashtakavargaModel.contributors);
 for(const body of ashtakavargaModel.contributors)if(!Number.isInteger(input.signs[body])||input.signs[body]<1||input.signs[body]>12)fail();
 const bav=ashtakavargaModel.recipients.map(body=>{const contributions=ashtakavargaModel.contributors.map((contributor,index)=>({contributor,
  values:Array.from({length:12},(_,rashi)=>Number(table[body][(rashi-input.signs[contributor]+13)%12][index]))}));
  const values=Array.from({length:12},(_,i)=>contributions.reduce((sum,c)=>sum+c.values[i],0));return {body,values,total:values.reduce((a,b)=>a+b,0),contributions};});
 const sav=Array.from({length:12},(_,i)=>bav.reduce((sum,b)=>sum+b.values[i],0));
 return freeze({contractVersion:'vedic-raw-ashtakavarga-1',model:ashtakavargaModel,signOrder:'Aries through Pisces, 1..12',bav,sav,total:sav.reduce((a,b)=>a+b,0),interpretation:'withheld-no-prediction-or-strength-band'});
}
