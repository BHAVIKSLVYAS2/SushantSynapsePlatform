// Explicit URL allowlist. Filesystem paths are never accepted from requests.
const staticAssets={
 '/moment-studio':'apps/moment-studio/frontend/index.html',
 '/moment-studio/':'apps/moment-studio/frontend/index.html',
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
 '/moment-studio/certificate-renderer.mjs':'apps/moment-studio/frontend/certificate-renderer.mjs',
 '/moment-studio/certificate-export.js':'apps/moment-studio/frontend/certificate-export.js',
 '/moment-studio/certificates.css':'apps/moment-studio/frontend/certificates.css',
 '/certificates':'apps/moment-studio/frontend/certificates.html',
 '/certificates/':'apps/moment-studio/frontend/certificates.html',
 '/certificates/app.js':'apps/moment-studio/frontend/certificate-app.js',
 '/certificates/renderer.js':'apps/moment-studio/frontend/certificate-renderer.mjs',
 '/certificates/export.js':'apps/moment-studio/frontend/certificate-export.js',
 '/certificates/style.css':'apps/moment-studio/frontend/certificates.css',
 '/certificates/branding.mjs':'apps/moment-studio/frontend/branding.mjs',
 '/celebration-studio':'apps/moment-studio/frontend/index.html',
 '/celebration-studio/':'apps/moment-studio/frontend/index.html',
 '/celebration-studio/app.js':'apps/moment-studio/frontend/card-app.js',
 '/celebration-studio/renderer.mjs':'apps/moment-studio/frontend/card-renderer.mjs',
 '/celebration-studio/style.css':'apps/moment-studio/frontend/cards.css',
 '/celebration-studio/branding.mjs':'apps/moment-studio/frontend/branding.mjs',

 '/pocket-pause/scenes.mjs':'apps/pocket-pause/frontend/scenes.mjs',
 '/pocket-pause':'apps/pocket-pause/frontend/index.html',
 '/pocket-pause/':'apps/pocket-pause/frontend/index.html',
 '/pocket-pause/app.js':'apps/pocket-pause/frontend/app.js',
 '/pocket-pause/engine.mjs':'apps/pocket-pause/frontend/engine.mjs',
 '/pocket-pause/style.css':'apps/pocket-pause/frontend/style.css',
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
 '/shared/platform-header.css':'packages/ui/platform-header.css',
};
for(const file of ['platform.js','platform.css','manifest.webmanifest','logo-adaptive.png','logo-adaptive-192.png','logo-adaptive-512.png','logo-adaptive-uhd.png'])staticAssets['/'+file]='apps/portal/frontend/'+file;
for(const file of ['app.js','style.css','icon.svg','advocate.webmanifest'])staticAssets['/'+file]='apps/advocate/frontend/'+file;
for(const file of ['app.js','engine.js','style.css','icon.svg'])staticAssets['/fund-overlap/'+file]='apps/fund-overlap/frontend/'+file;
for(const file of ['app.js','engine.js','style.css','comic.css','art/chai-comic-v1.webp','art/news-desk-v1.webp'])staticAssets['/news/'+file]='apps/news/frontend/'+file;
module.exports={staticAssets};
for(const file of ['app.js','i18n.js','style.css','print.css'])staticAssets['/digital-samaj/'+file]='apps/digital-samaj/frontend/'+file;
for(const file of ['app.js','export.js','style.css'])staticAssets['/tournament-lite/'+file]='apps/tournament-lite/frontend/'+file;
for(const file of ['app.js','style.css'])staticAssets['/batchfee-lite/'+file]='apps/batchfee-lite/frontend/'+file;
for(const file of ['app.js','engine.js','worker.js','export.js','style.css'])staticAssets['/timetable-lite/'+file]='apps/timetable-lite/frontend/'+file;

staticAssets['/daily-spark']='apps/daily-spark/frontend/index.html';
staticAssets['/daily-spark/']='apps/daily-spark/frontend/index.html';
for(const file of ['app.js','engine.mjs','style.css'])staticAssets['/daily-spark/'+file]='apps/daily-spark/frontend/'+file;

staticAssets['/decision-wheel']='apps/decision-wheel/frontend/index.html';
staticAssets['/decision-wheel/']='apps/decision-wheel/frontend/index.html';
for(const file of ['app.js','engine.mjs','style.css'])staticAssets['/decision-wheel/'+file]='apps/decision-wheel/frontend/'+file;


staticAssets['/team-mixer']='apps/team-mixer/frontend/index.html';
staticAssets['/team-mixer/']='apps/team-mixer/frontend/index.html';
for(const file of ['app.js','engine.mjs','export.mjs','style.css'])staticAssets['/team-mixer/'+file]='apps/team-mixer/frontend/'+file;
