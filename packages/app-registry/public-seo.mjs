import registry from './index.js';
// Reviewed, useful public landing pages only. Never derive this from all HTML
// assets: that includes account/admin shells and noindex verification previews.
const utilityIds=new Set(['qr-maker','photo-resize','bill-splitter','moment-studio','decision-wheel','news','focus','ritual-assist','team-mixer','timetable-lite','fund-overlap','daily-spark']);
export function publicUtilityPaths(){
 const apps=registry.apps.filter(app=>app.public&&app.status==='Available'&&utilityIds.has(app.id));
 return [...new Set([...apps.map(app=>app.path),...(apps.some(app=>app.id==='ritual-assist')?['/ritual-assist/calendar']:[]),...(apps.some(app=>app.id==='moment-studio')?['/moment-studio/cards']:[])])];
}
