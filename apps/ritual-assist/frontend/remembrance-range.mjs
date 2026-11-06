// Ranges use existing calculated years, starting at the planning year.
export function remembranceYears(calendar,value){
 const match=/^next-(2|5|10)$/.exec(String(value));
 return match?calendar.yearly.slice(0,Number(match[1])):calendar.yearly.filter(item=>item.year===Number(value));
}
export function remembranceRangeLabel(calendar,value){
 const years=remembranceYears(calendar,value);
 return years.length>1?`${years[0].year}–${years.at(-1).year}`:String(years[0]?.year??'');
}
