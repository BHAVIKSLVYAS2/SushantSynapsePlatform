// Explicit URL allowlist. Filesystem paths are never accepted from requests.
const staticAssets={
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
 '/certificates':'apps/certificates/frontend/index.html',
 '/certificates/':'apps/certificates/frontend/index.html',
 '/timetable-lite':'apps/timetable-lite/frontend/index.html',
 '/timetable-lite/':'apps/timetable-lite/frontend/index.html',
 '/shared/theme.js':'packages/ui/theme.js',
 '/shared/platform-header.css':'packages/ui/platform-header.css',
};
for(const file of ['platform.js','platform.css','manifest.webmanifest','logo-adaptive.png','logo-adaptive-192.png','logo-adaptive-512.png','logo-adaptive-uhd.png'])staticAssets['/'+file]='apps/portal/frontend/'+file;
for(const file of ['app.js','style.css','icon.svg','advocate.webmanifest'])staticAssets['/'+file]='apps/advocate/frontend/'+file;
for(const file of ['app.js','engine.js','style.css','icon.svg'])staticAssets['/fund-overlap/'+file]='apps/fund-overlap/frontend/'+file;
for(const file of ['app.js','engine.js','style.css','comic.css','art/chai-comic-v1.webp','art/news-desk-v1.webp'])staticAssets['/news/'+file]='apps/news/frontend/'+file;
for(const file of ['app.js','renderer.js','export.js','style.css'])staticAssets['/certificates/'+file]='apps/certificates/frontend/'+file;
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

staticAssets['/celebration-studio']='apps/celebration-studio/frontend/index.html';
staticAssets['/celebration-studio/']='apps/celebration-studio/frontend/index.html';
for(const file of ['app.js','renderer.mjs','style.css'])staticAssets['/celebration-studio/'+file]='apps/celebration-studio/frontend/'+file;

staticAssets['/team-mixer']='apps/team-mixer/frontend/index.html';
staticAssets['/team-mixer/']='apps/team-mixer/frontend/index.html';
for(const file of ['app.js','engine.mjs','export.mjs','style.css'])staticAssets['/team-mixer/'+file]='apps/team-mixer/frontend/'+file;
