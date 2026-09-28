// Explicit URL allowlist. Filesystem paths are never accepted from requests.
const staticAssets={
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
for(const file of ['app.js','style.css'])staticAssets['/news/'+file]='apps/news/frontend/'+file;
for(const file of ['app.js','renderer.js','export.js','style.css'])staticAssets['/certificates/'+file]='apps/certificates/frontend/'+file;
module.exports={staticAssets};
for(const file of ['app.js','export.js','style.css'])staticAssets['/tournament-lite/'+file]='apps/tournament-lite/frontend/'+file;
for(const file of ['app.js','style.css'])staticAssets['/batchfee-lite/'+file]='apps/batchfee-lite/frontend/'+file;
for(const file of ['app.js','engine.js','worker.js','export.js','style.css'])staticAssets['/timetable-lite/'+file]='apps/timetable-lite/frontend/'+file;
