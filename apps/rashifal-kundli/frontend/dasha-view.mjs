import {locale,bodyName} from './locale.mjs';
const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
export function mountDasha(container,timeline,language='en'){
 const t=locale(language),root=el('section');root.className='vedic-dasha';root.dataset.feature='dasha';
 const active=timeline.active,major=timeline.mahadashas[active.mahadashaIndex];
 root.append(el('h2',t.dasha),el('p',t.year),el('p',`${t.current}: ${bodyName(active.mahadashaLord,language)} / ${bodyName(active.antardashaLord,language)} · ${t.asOf} ${active.atUtcInstant}`));
 root.append(el('p',`${t.balance}: ${bodyName(timeline.balance.lord,language)} · ${timeline.balance.remainingYears.toFixed(4)} ${t.years}. ${t.origin}`));
 function date(boundary){const time=el('time');time.dateTime=boundary.utcInstant;
  time.textContent=boundary.local.status==='available'?boundary.local.localDateTime+' '+boundary.local.offset:`${t.localUnavailable}: ${boundary.utcInstant}`;return time;}
 const next=el('p',`${t.next}: ${bodyName(active.nextTransition.nextMahadashaLord,language)} / ${bodyName(active.nextTransition.nextAntardashaLord,language)} · `);next.append(date(active.nextTransition.boundary));root.append(next);
 const label=el('label',t.major),select=el('select');select.setAttribute('aria-label',t.major);
 for(const m of timeline.mahadashas){const o=el('option',`${bodyName(m.lord,language)} · ${m.durationYears}`);o.value=String(m.index);select.append(o);}select.value=String(major.index);label.append(select);root.append(label);
 const track=el('div');track.className='vedic-dasha-track';track.setAttribute('role','group');track.setAttribute('aria-label',t.major);
 const buttons=[];for(const m of timeline.mahadashas){const b=el('button',`${bodyName(m.lord,language)} ${m.durationYears}`);b.type='button';b.dataset.major=String(m.index);
  b.addEventListener('click',()=>{select.value=String(m.index);render();});track.append(b);buttons.push(b);}root.append(track);
 const region=el('div');region.className='vedic-period-table';region.tabIndex=0;region.setAttribute('role','region');region.setAttribute('aria-label',t.periodTable);root.append(el('p',t.scrollHint),region);
 function render(){const m=timeline.mahadashas[Number(select.value)];for(const b of buttons)b.setAttribute('aria-pressed',String(Number(b.dataset.major)===m.index));
  const table=el('table'),caption=el('caption',`${bodyName(m.lord,language)} · ${t.periodTable}`),head=el('thead'),hr=el('tr');
  for(const name of [t.body,t.start,t.end]){const th=el('th',name);th.scope='col';hr.append(th);}head.append(hr);const body=el('tbody');
  for(const p of m.antardashas){const row=el('tr');row.dataset.lord=p.lord;row.dataset.start=String(p.start.milliseconds);row.dataset.end=String(p.end.milliseconds);
   const isActive=m.index===active.mahadashaIndex&&p.index===active.antardashaIndex;row.dataset.active=String(isActive);if(isActive)row.setAttribute('aria-current','true');
   const th=el('th',bodyName(p.lord,language));th.scope='row';const a=el('td'),b=el('td');a.append(date(p.start));b.append(date(p.end));row.append(th,a,b);body.append(row);}
  table.append(caption,head,body);region.replaceChildren(table);
 }
 select.addEventListener('change',render);render();container.replaceChildren(root);return {destroy(){root.remove();}};
}
