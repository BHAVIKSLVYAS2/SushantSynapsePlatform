// Explicit URL allowlist. Filesystem paths are never accepted from requests.
const staticAssets={
 '/ads.txt':'packages/ui/ads.txt',
 '/shared/beta-notice.js':'packages/ui/beta-notice.js',
 '/shared/beta-notice.css':'packages/ui/beta-notice.css',
 '/feedback':'apps/feedback/frontend/index.html',
 '/feedback/':'apps/feedback/frontend/index.html',
 '/feedback/app.js':'apps/feedback/frontend/app.js',
 '/feedback/style.css':'apps/feedback/frontend/style.css',
 '/shared/download.mjs':'packages/ui/download.mjs',
 '/shared/text.mjs':'packages/ui/text.mjs',
 '/shared/crc32.mjs':'packages/ui/crc32.mjs',
 '/shared/archive.mjs':'packages/ui/archive.mjs',
 '/shared/visitors.mjs':'packages/ui/visitors.mjs',
 '/news/newsroom.css':'apps/news/frontend/newsroom.css',
 '/shared/platform-shell.js':'packages/ui/platform-shell.bundle.js',
 '/shared/platform-shell.css':'packages/ui/platform-shell.css',
 '/home.css':'apps/portal/frontend/home.css',
 '/home.bundle.css':'apps/portal/frontend/home.bundle.css',
 '/home-discovery.js':'apps/portal/frontend/home-discovery.js',
 '/home-art.svg':'apps/portal/frontend/home-art.svg',
 '/shared/premium.css':'packages/ui/premium.bundle.css',
 '/satire-arena/editor':'apps/satire-arena/frontend/editor.html',
 '/satire-arena/editor.js':'apps/satire-arena/frontend/editor.js',
 '/satire-arena/content.js':'apps/satire-arena/frontend/content.js',
 '/satire-arena/character.js':'apps/satire-arena/frontend/character.js',
 '/satire-arena/character.css':'apps/satire-arena/frontend/character.css',
 '/satire-arena/sample.css':'apps/satire-arena/frontend/sample.css',
 '/satire-arena/metrics.js':'apps/satire-arena/frontend/metrics.js',
 '/satire-arena/enhancements.js':'apps/satire-arena/frontend/enhancements.js',
 '/satire-arena':'apps/satire-arena/frontend/entry.html',
 '/satire-arena/':'apps/satire-arena/frontend/entry.html',
 '/satire-arena/entry.css':'apps/satire-arena/frontend/entry.css',
 '/satire-arena/entry.js':'apps/satire-arena/frontend/entry.js',
 '/satire-arena/politicians':'apps/satire-arena/frontend/index.html',
 '/satire-arena/news-anchors':'apps/satire-arena/frontend/news-anchors.html',
 '/satire-arena/actors':'apps/satire-arena/frontend/actors.html',
 '/satire-arena/corporates':'apps/satire-arena/frontend/corporates.html',
 '/satire-arena/actors-fast.webp':'apps/satire-arena/frontend/actors-fast.webp',
 '/satire-arena/corporates-fast.webp':'apps/satire-arena/frontend/corporates-fast.webp',
 '/satire-arena/personas.mjs':'apps/satire-arena/frontend/personas.mjs',
 '/satire-arena/spotlight.mjs':'apps/satire-arena/frontend/spotlight.mjs',
 '/satire-arena/anchors-fast.webp':'apps/satire-arena/frontend/anchors-fast.webp',
 '/satire-arena/catalogue.mjs':'apps/satire-arena/frontend/catalogue.mjs',
 '/satire-arena/sound.mjs':'apps/satire-arena/frontend/sound.mjs',
 '/satire-arena/applause.mp3':'apps/satire-arena/frontend/applause.mp3',
 '/satire-arena/anchors-expressions-fast.webp':'apps/satire-arena/frontend/anchors-expressions-fast.webp',
 '/satire-arena/actors-expressions-fast.webp':'apps/satire-arena/frontend/actors-expressions-fast.webp',
 '/satire-arena/corporates-expressions-fast.webp':'apps/satire-arena/frontend/corporates-expressions-fast.webp',
 '/satire-arena/cast-fast.webp':'apps/satire-arena/frontend/cast-fast.webp',
 '/satire-arena/extra-cast-fast.webp':'apps/satire-arena/frontend/extra-cast-fast.webp',
 '/satire-arena/new-cast-fast.webp':'apps/satire-arena/frontend/new-cast-fast.webp',
 '/satire-arena/expressions-original-fast.webp':'apps/satire-arena/frontend/expressions-original-fast.webp',
 '/satire-arena/expressions-expanded-fast.webp':'apps/satire-arena/frontend/expressions-expanded-fast.webp',
 '/satire-arena/expressions-new-fast.webp':'apps/satire-arena/frontend/expressions-new-fast.webp',
 '/satire-arena/highway-budget-fast.webp':'apps/satire-arena/frontend/highway-budget-fast.webp',
 '/satire-arena/speakers-fast.webp':'apps/satire-arena/frontend/speakers-fast.webp',
 '/satire-arena/extra-cast.svg':'apps/satire-arena/frontend/extra-cast.svg',
 '/satire-arena/feedback.mjs':'apps/satire-arena/frontend/feedback.mjs',
 '/satire-arena/app.js':'apps/satire-arena/frontend/app.js',
 '/satire-arena/style.css':'apps/satire-arena/frontend/style.css',
 '/satire-arena/cartoon-cast-768.webp':'apps/satire-arena/frontend/cartoon-cast-768.webp',
 '/satire-arena/cartoon-cast-384.webp':'apps/satire-arena/frontend/cartoon-cast-384.webp',
 '/satire-arena/cartoon-cast.webp':'apps/satire-arena/frontend/cartoon-cast.webp',
 '/satire-arena/cartoon-cast.png':'apps/satire-arena/frontend/cartoon-cast.png',
 '/privacy':'apps/portal/frontend/privacy.html',
 '/terms':'apps/portal/frontend/terms.html',
 '/contact':'apps/portal/frontend/contact.html',
 '/shared/whatsapp.js':'packages/ui/whatsapp.js',
 '/shared/whatsapp-engine.mjs':'packages/ui/whatsapp-engine.mjs',
 '/shared/whatsapp.css':'packages/ui/whatsapp.css',
 '/legal':'apps/portal/frontend/legal.html',
 '/legal/third-party-notices':'apps/portal/frontend/third-party-notices.html',
 '/legal.css':'apps/portal/frontend/legal.css',
 '/shared/legal-footer.css':'packages/ui/legal-footer.css',
 '/shared/language.js':'packages/ui/language.js',
 '/showcase':'apps/portal/frontend/showcase.html',
 '/showcase/':'apps/portal/frontend/showcase.html',
 '/showcase.js':'apps/portal/frontend/showcase.js',
 '/showcase.css':'apps/portal/frontend/showcase.css',
 '/support':'apps/portal/frontend/support.html',
 '/support/':'apps/portal/frontend/support.html',
 '/support.js':'apps/portal/frontend/support.js',
 '/support.css':'apps/portal/frontend/support.css',
 '/support-engine.mjs':'apps/portal/frontend/support-engine.mjs',
 '/support-qr.mjs':'apps/portal/frontend/support-qr.mjs',
 '/ritual-assist':'apps/ritual-assist/frontend/index.html',
 '/ritual-assist/calendar':'apps/ritual-assist/frontend/calendar.html',
 '/ritual-assist/calendar/':'apps/ritual-assist/frontend/calendar.html',
 '/ritual-assist/calendar.js':'apps/ritual-assist/frontend/calendar.js',
 '/ritual-assist/lunar-core.mjs':'apps/ritual-assist/frontend/lunar-core.mjs',
 '/ritual-assist/observance-rules.mjs':'apps/ritual-assist/frontend/observance-rules.mjs',
 '/ritual-assist/observance-calendar.mjs':'apps/ritual-assist/frontend/observance-calendar.mjs',
 '/ritual-assist/observance-export.mjs':'apps/ritual-assist/frontend/observance-export.mjs',
 '/ritual-assist/calendar-export.mjs':'apps/ritual-assist/frontend/calendar-export.mjs',
 '/ritual-assist/calendar-tools.mjs':'apps/ritual-assist/frontend/calendar-tools.mjs',
 '/ritual-assist/preparation-pack.mjs':'apps/ritual-assist/frontend/preparation-pack.mjs',
 '/ritual-assist/calendar.css':'apps/ritual-assist/frontend/calendar.css',
 '/ritual-assist/panchang.mjs':'apps/ritual-assist/frontend/panchang.mjs',
 '/ritual-assist/astronomy-engine.mjs':'apps/ritual-assist/frontend/astronomy-engine.mjs',
 '/ritual-assist/':'apps/ritual-assist/frontend/index.html',
 '/ritual-assist/app.js':'apps/ritual-assist/frontend/app.js',
 '/ritual-assist/guides.mjs':'apps/ritual-assist/frontend/guides.mjs',
 '/ritual-assist/seedha.mjs':'apps/ritual-assist/frontend/seedha.mjs',
 '/ritual-assist/mourning.mjs':'apps/ritual-assist/frontend/mourning.mjs',
 '/ritual-assist/materials-review.mjs':'apps/ritual-assist/frontend/materials-review.mjs',
 '/ritual-assist/style.css':'apps/ritual-assist/frontend/style.css',
 '/ritual-assist/gallery.css':'apps/ritual-assist/frontend/gallery.css',
 '/ritual-assist/landing.mjs':'apps/ritual-assist/frontend/landing.mjs',
 '/ritual-assist/calendar-hero.webp':'apps/ritual-assist/frontend/calendar-hero.webp',
 '/ritual-assist/guide-icons.webp':'apps/ritual-assist/frontend/guide-icons.webp',
 '/moment-studio':'apps/moment-studio/frontend/certificates.html',
 '/moment-studio/':'apps/moment-studio/frontend/certificates.html',
 '/moment-studio/cards':'apps/moment-studio/frontend/index.html',
 '/moment-studio/cards/':'apps/moment-studio/frontend/index.html',
 '/moment-studio/certificates':'apps/moment-studio/frontend/certificates.html',
 '/moment-studio/certificates/':'apps/moment-studio/frontend/certificates.html',
 '/moment-studio/card-app.js':'apps/moment-studio/frontend/card-app.js',
 '/moment-studio/card-renderer.mjs':'apps/moment-studio/frontend/card-renderer.mjs',
 '/moment-studio/branding.mjs':'apps/moment-studio/frontend/branding.mjs',
 '/moment-studio/messages.mjs':'apps/moment-studio/frontend/messages.mjs',
 '/moment-studio/cards.css':'apps/moment-studio/frontend/cards.css',
 '/moment-studio/certificate-app.js':'apps/moment-studio/frontend/certificate-app.js',
 '/moment-studio/batch.mjs':'apps/moment-studio/frontend/batch.mjs',
 '/moment-studio/certificate-renderer.mjs':'apps/moment-studio/frontend/certificate-renderer.mjs',
 '/moment-studio/certificate-export.js':'apps/moment-studio/frontend/certificate-export.js',
 '/moment-studio/certificates.css':'apps/moment-studio/frontend/certificates.css',


 '/focus':'apps/focus/frontend/index.html',
 '/focus/':'apps/focus/frontend/index.html',
 '/focus/app.js':'apps/focus/frontend/app.js',
 '/focus/focus-timer.mjs':'apps/focus/frontend/focus-timer.mjs',
 '/focus/task-model.mjs':'apps/focus/frontend/task-model.mjs',
 '/focus/style.css':'apps/focus/frontend/style.css',
 '/digital-samaj':'apps/digital-samaj/frontend/index.html',
 '/digital-samaj/':'apps/digital-samaj/frontend/index.html',
 '/tournament-lite':'apps/tournament-lite/frontend/index.html',
 '/tournament-lite/':'apps/tournament-lite/frontend/index.html',
 '/batchfee-lite':'apps/batchfee-lite/frontend/index.html',
 '/batchfee-lite/':'apps/batchfee-lite/frontend/index.html',
 '/':'apps/portal/frontend/index.html',
 '/signin':'apps/portal/frontend/index.html',
 '/advocate':'apps/advocate/frontend/index.html',
 '/fund-overlap':'apps/fund-overlap/frontend/index.html',
 '/news':'apps/news/frontend/index.html',
 '/timetable-lite':'apps/timetable-lite/frontend/index.html',
 '/timetable-lite/':'apps/timetable-lite/frontend/index.html',
 '/shared/theme.js':'packages/ui/theme.js',
 '/take-a-break':'apps/take-a-break/frontend/index.html',
 '/take-a-break/':'apps/take-a-break/frontend/index.html',
 '/daily-spark/celebration.mjs':'apps/daily-spark/frontend/celebration.mjs',
 '/daily-spark/celebration.css':'apps/daily-spark/frontend/celebration.css',
 '/daily-spark/play.mjs':'apps/daily-spark/frontend/play.mjs',
 '/daily-spark/view.mjs':'apps/daily-spark/frontend/view.mjs',
 '/shared/platform-header.css':'packages/ui/platform-header.css',
};
for(const route of ['/privacy','/terms','/contact','/legal','/legal/third-party-notices'])staticAssets[route+'/']=staticAssets[route];
for(const file of ['platform.js','platform.css','manifest.webmanifest','logo-adaptive.png','logo-adaptive-192.png','logo-adaptive-512.png','logo-adaptive-uhd.png'])staticAssets['/'+file]='apps/portal/frontend/'+file;
staticAssets['/favicon.svg']='apps/portal/frontend/favicon.svg';
for(const file of ['app.js','style.css','icon.svg','advocate.webmanifest'])staticAssets['/'+file]='apps/advocate/frontend/'+file;
for(const file of ['app.js','engine.js','style.css','icon.svg'])staticAssets['/fund-overlap/'+file]='apps/fund-overlap/frontend/'+file;
for(const file of ['app.js','engine.js','style.css','comic.css'])staticAssets['/news/'+file]='apps/news/frontend/'+file;
staticAssets['/confessions']='apps/confessions/frontend/index.html';
staticAssets['/confessions/']='apps/confessions/frontend/index.html';
for(const file of ['app.js','style.css','captcha.mjs'])staticAssets['/confessions/'+file]='apps/confessions/frontend/'+file;
module.exports={staticAssets};
staticAssets['/shared/tool-refinements.css']='packages/ui/tool-refinements.css';
for(const file of ['presentation.mjs','presentation.css'])staticAssets['/shared/'+file]='packages/ui/'+file;
for(const file of ['reading-tools.mjs','reading-tools.css'])staticAssets['/news/'+file]='apps/news/frontend/'+file;
staticAssets['/qr-maker/wifi.mjs']='apps/qr-maker/frontend/wifi.mjs';
staticAssets['/team-mixer/swaps.mjs']='apps/team-mixer/frontend/swaps.mjs';
for(const id of ['qr-maker','photo-resize','bill-splitter']){
 staticAssets['/'+id]='apps/'+id+'/frontend/index.html';
 staticAssets['/'+id+'/']='apps/'+id+'/frontend/index.html';
 staticAssets['/'+id+'/app.js']='apps/'+id+'/frontend/app.js';
 if(id!=='qr-maker')staticAssets['/'+id+'/engine.mjs']='apps/'+id+'/frontend/engine.mjs';
}
staticAssets['/shared/local-tools.css']='packages/ui/local-tools.css';
staticAssets['/shared/export-brand.mjs']='packages/ui/export-brand.mjs';
staticAssets['/shared/local-tools.mjs']='packages/ui/local-tools.mjs';
staticAssets['/focus/backups.mjs']='apps/focus/frontend/backups.mjs';
staticAssets['/team-mixer/wins.css']='apps/team-mixer/frontend/wins.css';
staticAssets['/bill-splitter/style.css']='apps/bill-splitter/frontend/style.css';
staticAssets['/ritual-assist/arrangements.css']='apps/ritual-assist/frontend/arrangements.css';
staticAssets['/ritual-assist/checklist-state.mjs']='apps/ritual-assist/frontend/checklist-state.mjs';
for(const file of ['app.js','engine.mjs','style.css','chaos-engine.mjs','chaos.mjs','chaos.css','celebration.mjs'])staticAssets['/take-a-break/'+file]='apps/take-a-break/frontend/'+file;
for(const file of ['app.js','i18n.js','style.css','print.css'])staticAssets['/digital-samaj/'+file]='apps/digital-samaj/frontend/'+file;
for(const file of ['app.js','export.js','style.css','scheduling.js'])staticAssets['/tournament-lite/'+file]='apps/tournament-lite/frontend/'+file;
for(const file of ['app.js','style.css'])staticAssets['/batchfee-lite/'+file]='apps/batchfee-lite/frontend/'+file;
for(const file of ['app.js','engine.js','worker.js','export.js','style.css','mobile.css'])staticAssets['/timetable-lite/'+file]='apps/timetable-lite/frontend/'+file;

staticAssets['/daily-spark']='apps/daily-spark/frontend/index.html';
staticAssets['/daily-spark/']='apps/daily-spark/frontend/index.html';
for(const file of ['app.js','engine.mjs','style.css'])staticAssets['/daily-spark/'+file]='apps/daily-spark/frontend/'+file;

staticAssets['/decision-wheel']='apps/decision-wheel/frontend/index.html';
staticAssets['/decision-wheel/']='apps/decision-wheel/frontend/index.html';
for(const file of ['app.js','engine.mjs','style.css'])staticAssets['/decision-wheel/'+file]='apps/decision-wheel/frontend/'+file;


staticAssets['/team-mixer']='apps/team-mixer/frontend/index.html';
staticAssets['/team-mixer/']='apps/team-mixer/frontend/index.html';
for(const file of ['app.js','engine.mjs','export.mjs','style.css'])staticAssets['/team-mixer/'+file]='apps/team-mixer/frontend/'+file;
