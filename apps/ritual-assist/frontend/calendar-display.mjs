// Presentation only: no ephemeris or calculation-engine dependency.
const mod=(n,d)=>((n%d)+d)%d;
export const DAY=86400000,IST=330*60000,BOUNDARY_GUARD=5*60000;
export const localDate=value=>new Date(Number(value instanceof Date?value:new Date(value))+IST).toISOString().slice(0,10);
export function midnight(date){
 if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date))throw Error('Enter a valid date');
 const d=new Date(date+'T00:00:00+05:30');if(!Number.isFinite(+d)||localDate(d)!==date)throw Error('Enter a valid date');return +d;
}
export const addDays=(date,days)=>localDate(midnight(date)+days*DAY);

export const tithiNames={en:['Pratipada','Dwitiya','Tritiya','Chaturthi','Panchami','Shashthi','Saptami','Ashtami','Navami','Dashami','Ekadashi','Dwadashi','Trayodashi','Chaturdashi','Purnima','Pratipada','Dwitiya','Tritiya','Chaturthi','Panchami','Shashthi','Saptami','Ashtami','Navami','Dashami','Ekadashi','Dwadashi','Trayodashi','Chaturdashi','Amavasya'],hi:['प्रतिपदा','द्वितीया','तृतीया','चतुर्थी','पंचमी','षष्ठी','सप्तमी','अष्टमी','नवमी','दशमी','एकादशी','द्वादशी','त्रयोदशी','चतुर्दशी','पूर्णिमा','प्रतिपदा','द्वितीया','तृतीया','चतुर्थी','पंचमी','षष्ठी','सप्तमी','अष्टमी','नवमी','दशमी','एकादशी','द्वादशी','त्रयोदशी','चतुर्दशी','अमावस्या']};
export const monthNames={en:['Chaitra','Vaishakha','Jyeshtha','Ashadha','Shravana','Bhadrapada','Ashwina','Kartika','Margashirsha','Pausha','Magha','Phalguna'],hi:['चैत्र','वैशाख','ज्येष्ठ','आषाढ़','श्रावण','भाद्रपद','आश्विन','कार्तिक','मार्गशीर्ष','पौष','माघ','फाल्गुन']};

export function tithiLabel(tithi,language='en'){const paksha=tithi<=15?(language==='hi'?'शुक्ल':'Shukla'):(language==='hi'?'कृष्ण':'Krishna');return paksha+' '+tithiNames[language][tithi-1];}

export function displayedMonth(month,tithi,calendar){return calendar==='purnimanta'&&tithi>15?mod(month.index+1,12):month.index;}

export function calendarRows(result){
 const rows=[...result.early,...result.monthly,...result.annual?[result.annual]:[],...result.pitru?[result.pitru]:[],...result.upcomingAnnual||[],...result.upcomingPitru||[],...(result.yearly||[]).flatMap(year=>[...year.annual,...year.pitru])];
 const seen=new Set();return rows.filter(row=>{const key=row.kind+':'+(row.window?row.window.number+':'+localDate(row.window.start):row.date);if(seen.has(key))return false;seen.add(key);return true;}).sort((a,b)=>(a.window?.start??midnight(a.date))-(b.window?.start??midnight(b.date)));
}
