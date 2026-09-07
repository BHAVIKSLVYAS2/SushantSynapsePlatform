// Explicit URL allowlist. Filesystem paths are never accepted from requests.
const staticAssets={
 '/':'apps/portal/frontend/index.html',
 '/advocate':'apps/advocate/frontend/index.html',
 '/fund-overlap':'apps/fund-overlap/frontend/index.html',
 '/shared/theme.js':'packages/ui/theme.js',
};
for(const file of ['platform.js','platform.css','manifest.webmanifest','logo-adaptive.png','logo-adaptive-192.png','logo-adaptive-512.png','logo-adaptive-uhd.png'])staticAssets['/'+file]='apps/portal/frontend/'+file;
for(const file of ['app.js','style.css','icon.svg','advocate.webmanifest'])staticAssets['/'+file]='apps/advocate/frontend/'+file;
for(const file of ['app.js','engine.js','style.css','icon.svg'])staticAssets['/fund-overlap/'+file]='apps/fund-overlap/frontend/'+file;
module.exports={staticAssets};
