// Only old character links need code. Ordinary discovery uses native links and
// never imports voting, artwork, sound or the catalogue.
const query=new URLSearchParams(location.search),legacy=query.get('character')||location.hash.match(/^#character-([a-z-]+)$/)?.[1];
if(legacy){
 const {cast,reactions}=await import('./catalogue.mjs');
 const character=cast.find(c=>c.id===legacy);
 if(character){
  const target=new URL('/satire-arena/'+character.arena,location.origin),reaction=query.get('reaction');
  if(reactions.some(r=>r.id===reaction)){target.searchParams.set('character',character.id);target.searchParams.set('reaction',reaction);}
  target.hash='character-'+character.id;
  location.replace(target.pathname+target.search+target.hash);
 }
}
