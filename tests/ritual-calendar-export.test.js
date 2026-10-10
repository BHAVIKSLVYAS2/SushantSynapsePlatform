const {test}=require('node:test'),assert=require('node:assert/strict');
const now=+new Date('2026-10-10T12:00:00+05:30');
async function fixture(){const {generateCalendar}=await import('../apps/ritual-assist/frontend/panchang.mjs');return generateCalendar({date:'2025-10-01',time:'12:00',city:'delhi',calendar:'amanta',counting:'civil',include13:true},{now});}
const unfold=s=>s.replace(/\r\n[ \t]/g,'');
test('ICS exports individual future dates, stable private IDs and absolute 9am IST reminders',async()=>{
 const {calendarIcs,reminderSelection}=await import('../apps/ritual-assist/frontend/calendar-export.mjs'),r=await fixture(),selection=reminderSelection(r,now);
 const text=await calendarIcs(r,{now}),ics=unfold(text),events=ics.split('BEGIN:VEVENT\r\n').slice(1).map(s=>s.split('END:VEVENT')[0]);assert.equal(events.length,selection.rows.length);assert.ok(events.length>=20);assert.equal(new Set(events.map(s=>s.match(/^UID:(.+)$/m)[1])).size,events.length);
 const again=unfold(await calendarIcs(r,{now:now+1000,language:'hi'}));assert.deepEqual([...ics.matchAll(/^UID:(.+)$/gm)].map(m=>m[1]),[...again.matchAll(/^UID:(.+)$/gm)].map(m=>m[1]));
 assert.ok(ics.includes('TRIGGER;VALUE=DATE-TIME:20261018T033000Z'));assert.ok(!ics.includes('RRULE'));assert.ok(!ics.includes('ATTENDEE'));assert.ok(!ics.includes('ORGANIZER'));assert.ok(!ics.includes('DTSTART;VALUE=DATE:20251004'));assert.ok(!ics.includes('2025-10-01'));assert.equal((ics.match(/CLASS:PRIVATE/g)||[]).length,events.length);
 events.forEach((event,i)=>{assert.ok(event.includes('DTSTART;VALUE=DATE:'+selection.rows[i].date.replaceAll('-','')));assert.match(event,/DTEND;VALUE=DATE:\d{8}/);assert.match(event,/DTSTAMP:20261010T063000Z/);});
 for(const line of text.split('\r\n'))assert.ok(Buffer.byteLength(line,'utf8')<=75);assert.ok(!/[^\r]\n/.test(text));
});
test('conditional, unresolved, expired and out-of-horizon dates never enter reminders',async()=>{
 const {calendarIcs,reminderSelection}=await import('../apps/ritual-assist/frontend/calendar-export.mjs'),r=await fixture(),first=r.upcomingAnnual[0];
 r.early=[];r.monthly=[];r.annual=null;r.pitru=null;r.upcomingAnnual=[];r.upcomingPitru=[];r.yearly=[{year:2026,annual:[{...first,conditional:true}],pitru:[]}];
 assert.equal(reminderSelection(r,now).rows.length,0);assert.equal(reminderSelection(r,now).withheld.length,1);await assert.rejects(calendarIcs(r,{now}),/No resolved/);
 r.yearly[0].annual=[{...first,date:null,status:'boundary',conditional:false}];assert.equal(reminderSelection(r,now).rows.length,0);await assert.rejects(calendarIcs(r,{now}),/No resolved/);
 r.yearly[0].annual=[{...first,date:'2026-01-01',conditional:false},{...first,date:'2027-01-01',window:{...first.window,start:first.window.start+86400000},conditional:false}];assert.equal(reminderSelection(r,now).rows.length,0);
 await assert.rejects(calendarIcs(await fixture(),{now,reminderDays:2}),/Invalid/);
});
test('Hindi folds losslessly and past alarms are omitted without losing today’s event',async()=>{
 const {foldCalendarLine,calendarIcs}=await import('../apps/ritual-assist/frontend/calendar-export.mjs'),line='DESCRIPTION:'+'श्राद्ध और बरसी '.repeat(20);assert.equal(unfold(foldCalendarLine(line)),line);for(const part of foldCalendarLine(line).split('\r\n'))assert.ok(Buffer.byteLength(part,'utf8')<=75);
 const r=await fixture();r.early=[{kind:'day',day:10,date:'2026-10-10',status:'counted'}];r.monthly=[];r.annual=null;r.pitru=null;r.upcomingAnnual=[];r.upcomingPitru=[];r.yearly=[{year:2026,annual:[],pitru:[]}];const text=unfold(await calendarIcs(r,{language:'hi',now,reminderDays:0}));assert.match(text,/SUMMARY:दिन 10/);assert.ok(!text.includes('BEGIN:VALARM'));assert.ok(text.includes('DTEND;VALUE=DATE:20261011'));
});
test('preparation pack retains candidate dates, selected sources, material checks and assignments',async()=>{
 const {preparationPack,packText}=await import('../apps/ritual-assist/frontend/preparation-pack.mjs'),r=await fixture();r.annual.conditional=true;
 for(const language of ['en','hi']){const pack=preparationPack(r,language,['day-10','shraddha','shraddha']);assert.deepEqual(pack.guides.map(g=>g.id),['day-10','shraddha']);assert.ok(pack.schedule.some(row=>row.kind==='annual'&&row.conditional));const text=packText(pack,{checked:new Set(['shraddha:water']),assignments:['Aakanksha']});assert.ok(text.includes('Aakanksha'));assert.ok(text.includes('[x] '+pack.guides[1].items[0].label[language]));assert.ok(text.includes('https://www.drikpanchang.com/'));assert.ok(text.includes('2026-10-19'));assert.ok(text.includes(pack.guides[1].variation[language]));}
 assert.throws(()=>preparationPack(r,'en',[]));assert.throws(()=>preparationPack(r,'en',['../../data']));assert.throws(()=>preparationPack(r,'bad'));
});
