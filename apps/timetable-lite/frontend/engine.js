// Pure deterministic constraint solver; shared by the worker, editor and backup validator.
export const DAYS=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
export const minutes=t=>Number(t.slice(0,2))*60+Number(t.slice(3));
const timeOK=t=>typeof t==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(t);
export const className=c=>c.name+(c.section?' · '+c.section:'');
export function emptySetup(){return {version:1,institute:{name:'',year:'2026–27',logo:''},days:DAYS.slice(0,6),periods:[],classes:[],subjects:[],teachers:[],allocations:[],holidays:[],entries:[]};}
export function makePeriods(start,end,duration,breaks=[]){
 if(!timeOK(start)||!timeOK(end)||!Number.isInteger(duration)||duration<10||duration>180)throw Error('Enter valid times and a duration between 10 and 180 minutes.');
 const a=minutes(start),z=minutes(end),sorted=[...breaks].sort((x,y)=>minutes(x.start)-minutes(y.start));if(z<=a)throw Error('End time must be after start time.');
 let prev=a;for(const b of sorted){if(!timeOK(b.start)||!timeOK(b.end)||minutes(b.start)<prev||minutes(b.end)<=minutes(b.start)||minutes(b.end)>z)throw Error('Breaks must be inside the school day and cannot overlap.');prev=minutes(b.end);}
 const fmt=n=>String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');const out=[];let cursor=a,n=1;
 for(const b of [...sorted,{start:end,end:end}]){while(cursor<minutes(b.start)){const next=Math.min(cursor+duration,minutes(b.start));out.push({id:'p'+out.length,name:'Period '+n++,start:fmt(cursor),end:fmt(next),kind:'lesson'});cursor=next;}if(b.start!==end){out.push({id:'p'+out.length,name:b.name||'Break',start:b.start,end:b.end,kind:'break'});cursor=minutes(b.end);}}
 if(out.length>24)throw Error('Use at most 24 timetable rows per day.');return out;
}
export function validateShape(s){
 const errors=[],fail=m=>errors.push(m),text=(v,max=100)=>typeof v==='string'&&v.length<=max;
 if(!s||s.version!==1||!s.institute||!text(s.institute.name)||!text(s.institute.year,40))return ['Invalid Timetable Lite backup (version 1 required).'];
 for(const k of ['days','periods','classes','subjects','teachers','allocations','holidays','entries'])if(!Array.isArray(s[k]))fail(k+' must be a list.');if(errors.length)return errors;
 if(s.classes.length>40||s.teachers.length>100||s.subjects.length>100||s.allocations.length>500||s.entries.length>6720||s.periods.length>24||s.holidays.length>366)return ['Setup exceeds limits: 40 classes, 100 teachers/subjects, 500 allocations, 24 rows/day.'];
 if(s.days.length>7||new Set(s.days).size!==s.days.length||s.days.some(d=>!DAYS.includes(d)))fail('Working days are invalid.');
 for(const key of ['periods','classes','subjects','teachers','allocations']){const ids=new Set();for(const r of s[key]){if(!r||!text(r.id)||!r.id||ids.has(r.id)){fail('Invalid or duplicate '+key+' ID.');continue;}ids.add(r.id);if(key!=='allocations'&&(!text(r.name)||!r.name.trim()))fail('Each '+key+' name must contain 1–100 characters.');}}if(errors.length)return errors;
 let end=0;for(const p of s.periods){if(!timeOK(p.start)||!timeOK(p.end)||minutes(p.start)<end||minutes(p.end)<=minutes(p.start)||!['lesson','break'].includes(p.kind))fail('Periods must have valid, ordered, non-overlapping times.');end=minutes(p.end);}
 for(const c of s.classes)if(!text(c.section,40))fail('Class section must be at most 40 characters.');
 for(const sub of s.subjects)if(typeof sub.core!=='boolean')fail('Subject core flag must be Yes or No.');
 for(const t of s.teachers)if(!Array.isArray(t.subjects)||t.subjects.some(id=>!s.subjects.some(x=>x.id===id))||!Array.isArray(t.days)||t.days.some(d=>!DAYS.includes(d))||!Array.isArray(t.periods)||t.periods.some(id=>!s.periods.some(p=>p.id===id&&p.kind==='lesson')))fail('Teacher '+t.name+' has invalid subjects or availability.');
 const pairs=new Set();for(const a of s.allocations){if(!s.classes.some(c=>c.id===a.classId)||!s.subjects.some(x=>x.id===a.subjectId)||!s.teachers.some(t=>t.id===a.teacherId))fail('Every allocation needs an existing class, subject and teacher.');if(!Number.isInteger(a.weekly)||a.weekly<1||a.weekly>168||!Number.isInteger(a.daily)||a.daily<1||a.daily>24||typeof a.double!=='boolean')fail('Weekly/daily requirements must be positive whole numbers; double periods must be Yes or No.');const pair=a.classId+':'+a.subjectId;if(pairs.has(pair))fail('Allocate each class/subject only once.');pairs.add(pair);}
 for(const h of s.holidays)if(!h||!text(h.name)||typeof h.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(h.date)||!Number.isFinite(Date.parse(h.date))||new Date(h.date).toISOString().slice(0,10)!==h.date)fail('Holiday dates or names are invalid.');
 if(!text(s.institute.logo,1500000)||(s.institute.logo&&!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(s.institute.logo)))fail('Invalid institute logo.');return [...new Set(errors)];
}
export function available(s,t,d,p){return p.kind==='lesson'&&t.days.includes(d)&&(!t.periods.length||t.periods.includes(p.id));}
export function validateSetup(s){
 const errors=validateShape(s);if(errors.length)return errors;
 if(!s.institute.name.trim())errors.push('Enter the institute name.');if(!s.days.length||!s.periods.some(p=>p.kind==='lesson'))errors.push('Enable working days and configure teaching periods.');if(!s.classes.length||!s.allocations.length)errors.push('Add classes and subject allocations.');
 const slots=s.days.length*s.periods.filter(p=>p.kind==='lesson').length;
 for(const c of s.classes){const req=s.allocations.filter(a=>a.classId===c.id).reduce((n,a)=>n+a.weekly,0);if(!req)errors.push(className(c)+' has no subject allocations.');if(req>slots)errors.push(className(c)+' requires '+req+' periods but only '+slots+' are available.');}
 for(const t of s.teachers){const req=s.allocations.filter(a=>a.teacherId===t.id).reduce((n,a)=>n+a.weekly,0),cap=s.days.reduce((n,d)=>n+s.periods.filter(p=>available(s,t,d,p)).length,0);if(req>cap)errors.push(t.name+' has been allocated '+req+' periods but is available for only '+cap+'.');}
 for(const a of s.allocations){const t=s.teachers.find(t=>t.id===a.teacherId),sub=s.subjects.find(x=>x.id===a.subjectId);if(!t.subjects.includes(a.subjectId))errors.push(t.name+' cannot teach '+sub.name+'.');let cap=0;for(const d of s.days){let count=0,run=0;for(const p of s.periods){if(available(s,t,d,p)){run++;if(a.double?run%3!==0:run%2!==0)count++;}else run=0;}cap+=Math.min(a.daily,count);}if(a.weekly>cap)errors.push(className(s.classes.find(c=>c.id===a.classId))+' / '+sub.name+' requires '+a.weekly+' periods but availability, daily maximum and consecutive-period rules allow only '+cap+'.');}return errors;
}
function placementIssue(s,entries,a,day,periodId){
 const p=s.periods.find(p=>p.id===periodId),t=s.teachers.find(t=>t.id===a.teacherId);if(!s.days.includes(day)||!p||p.kind!=='lesson')return 'Subjects cannot be placed on non-working days or during breaks.';if(!available(s,t,day,p))return t.name+' is unavailable at this time.';
 const same=entries.filter(e=>e.day===day),at=same.filter(e=>e.periodId===periodId);if(at.some(e=>s.allocations.find(x=>x.id===e.allocationId).classId===a.classId))return 'This class already has a lesson at this time.';if(at.some(e=>s.allocations.find(x=>x.id===e.allocationId).teacherId===a.teacherId))return t.name+' already teaches another class at this time.';
 const own=same.filter(e=>e.allocationId===a.id);if(own.length>=a.daily)return 'This subject would exceed its maximum periods per day.';const occupied=new Set([...own.map(e=>e.periodId),periodId]);let run=0;for(const row of s.periods){run=row.kind==='lesson'&&occupied.has(row.id)?run+1:0;if(run>(a.double?2:1))return a.double?'Only two consecutive periods are allowed.':'Consecutive periods are disabled for this subject.';}return null;
}
export function validateEntries(s,entries){
 const errors=validateSetup(s);if(errors.length)return errors;if(!Array.isArray(entries))return ['Invalid timetable entries.'];const checked=[];
 for(const e of entries){const a=e&&s.allocations.find(a=>a.id===e.allocationId);if(!a){errors.push('Unknown subject allocation in timetable.');continue;}const reason=placementIssue(s,checked,a,e.day,e.periodId);if(reason)errors.push(reason);checked.push(e);}
 for(const a of s.allocations){const n=entries.filter(e=>e?.allocationId===a.id).length;if(n!==a.weekly)errors.push(s.subjects.find(x=>x.id===a.subjectId).name+' requires '+a.weekly+' periods; timetable contains '+n+'.');}return [...new Set(errors)];
}
export function generate(s,{maxNodes=250000,timeLimit=12000}={}){
 const errors=validateSetup(s);if(errors.length)return {ok:false,errors};const entries=[],remaining=s.allocations.map(a=>a.weekly),last=s.allocations.map(()=>-1),slots=s.days.flatMap(day=>s.periods.filter(p=>p.kind==='lesson').map(p=>({day,periodId:p.id}))),started=Date.now();let nodes=0,limited=false;
 function search(){if(++nodes>maxNodes||Date.now()-started>timeLimit){limited=true;return false;}let best=-1,options=[],slack=Infinity;
 for(let i=0;i<remaining.length;i++){if(!remaining[i])continue;const choices=[];for(let k=last[i]+1;k<slots.length;k++){const x=slots[k];if(!placementIssue(s,entries,s.allocations[i],x.day,x.periodId))choices.push(k);}if(choices.length<remaining[i])return false;const n=choices.length-remaining[i];if(n<slack){slack=n;best=i;options=choices;}}
 if(best===-1)return true;const a=s.allocations[best];const score=k=>{const x=slots[k],daily=entries.filter(e=>e.allocationId===a.id&&e.day===x.day).length,teacher=entries.filter(e=>e.day===x.day&&s.allocations.find(z=>z.id===e.allocationId).teacherId===a.teacherId),pi=s.periods.findIndex(p=>p.id===x.periodId),near=teacher.some(e=>Math.abs(s.periods.findIndex(p=>p.id===e.periodId)-pi)===1),core=s.subjects.find(z=>z.id===a.subjectId).core&&entries.some(e=>e.day===x.day&&Math.abs(s.periods.findIndex(p=>p.id===e.periodId)-pi)===1&&s.allocations.find(z=>z.id===e.allocationId).classId===a.classId&&s.subjects.find(z=>z.id===s.allocations.find(a=>a.id===e.allocationId).subjectId).core);return daily*100+teacher.length*3+(core?8:0)-(near?2:0)+k/1000;};options.sort((x,y)=>score(x)-score(y));
 for(const k of options){const old=last[best];last[best]=k;remaining[best]--;entries.push({allocationId:a.id,...slots[k]});if(search())return true;entries.pop();remaining[best]++;last[best]=old;if(limited)return false;}return false;}
 if(!search())return {ok:false,limited,errors:[limited?'Search limit reached; feasibility is not proven. Try wider teacher availability, higher daily limits or fewer allocations.':'No combination satisfies the shared teacher availability, daily limits and consecutive-period rules.',...s.allocations.map(a=>`${className(s.classes.find(c=>c.id===a.classId))}: ${s.subjects.find(x=>x.id===a.subjectId).name}, ${s.teachers.find(t=>t.id===a.teacherId).name} — ${a.weekly}/week, max ${a.daily}/day`)]};const issues=validateEntries(s,entries);return issues.length?{ok:false,errors:issues}:{ok:true,entries,nodes};
}
export function move(s,source,target){
 const entries=s.entries.map(e=>({...e})),e=entries[source];if(!e)return {ok:false,errors:['Choose a lesson to move.']};const a=s.allocations.find(a=>a.id===e.allocationId),other=entries.find(x=>x!==e&&x.day===target.day&&x.periodId===target.periodId&&s.allocations.find(a=>a.id===x.allocationId).classId===a.classId);if(other){other.day=e.day;other.periodId=e.periodId;}e.day=target.day;e.periodId=target.periodId;const errors=validateEntries(s,entries);return errors.length?{ok:false,errors}:{ok:true,entries};
}
