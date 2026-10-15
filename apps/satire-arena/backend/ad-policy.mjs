// Readiness only: this module never loads advertising or renders a placement.
// A reviewed, manually configured nonpolitical article is required for eligibility.
export function eligiblePlacements(post,config={enabled:false,placements:[]}){
 if(!config.enabled||post?.status!=='published'||!['office','technology','indian-life','social-trends'].includes(post.category))return [];
 return (config.placements||[]).filter(p=>p.reviewed===true&&p.position==='after-article'&&typeof p.slot==='string'&&/^\d{10}$/.test(p.slot)).slice(0,1).map(({slot,position})=>({slot,position}));
}
