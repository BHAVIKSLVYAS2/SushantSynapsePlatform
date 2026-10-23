import {reactions} from './cast.mjs';
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Shared card face for the voting feed and server-rendered character details.
export function cardFace(c,{detail=false,copy=c.copy}={}){
 const words=c.name.split(' '),heading=detail?'h1':'h2';
 return `<div class="card-body"><small>${escape(c.tag)}</small><${heading}${detail?' id="character-name"':''}><span class="character-name-lead">${escape(words.shift())}</span> ${escape(words.join(' '))}</${heading}><p class="daily-punchline punchline">${escape(copy)}</p>${detail?'':'<div class="leader-ribbon" hidden></div>'}</div><div class="portrait portrait-${c.portrait}" role="img" aria-label="${escape(c.name)}, a fictional parody cartoon"><span>FICTIONAL PARODY</span></div>`;
}
// Build the final DOM once; nothing is subsequently moved into another layout.
export function createCard(c,index,{vote,share}){
 const article=document.createElement('article');
 article.className='arena-card'+(index?' art-pending':'');article.id='character-'+c.id;article.dataset.character=c.id;
 article.innerHTML=`<a class="character-hero" href="/satire-arena/characters/${c.id}" aria-label="Biography and punchlines for ${escape(c.name)}">${cardFace(c)}</a><section class="character-voting" aria-label="Reaction voting for ${escape(c.name)}"><div class="reaction-heading"><strong>▥ &nbsp; PICK YOUR REACTION</strong><strong class="card-total">Loading scores…</strong></div><div class="reactions" role="group" aria-label="Reactions for ${escape(c.name)}">${reactions.map(r=>`<button type="button" data-reaction="${r.id}" data-side="${r.side}" title="${r.name}" disabled aria-pressed="false" aria-label="${r.name} for ${escape(c.name)}"><span aria-hidden="true">${r.icon}</span><b>${r.name}</b><strong>—</strong></button>`).join('')}</div></section><div class="vote-confirmation"><div class="vote-confirmation-copy"><span class="choice-badge" hidden></span><p class="vote-state" role="status">Loading shared scores…</p></div><details class="character-share-menu"><summary>Share ↗</summary><button type="button" data-share-character="${c.id}" aria-label="Share ${escape(c.name)} standings" disabled>Share ↗</button><div class="character-share-links">${[['native','Share link'],['whatsapp','WhatsApp'],['copy','Copy link']].map(([method,label])=>`<button type="button" data-link-method="${method}">${label}</button>`).join('')}</div></details></div>`;
 article.querySelectorAll('[data-reaction]').forEach(button=>button.onclick=()=>vote(c.id,button.dataset.reaction));article.querySelector('[data-share-character]').onclick=()=>share(c.id);
 return article;
}
