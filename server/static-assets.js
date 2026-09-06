// Explicit URL allowlist. Filesystem paths are never accepted from requests.
const staticAssets={
 '/':'apps/portal/frontend/index.html',
 '/advocate':'apps/advocate/frontend/index.html',
 '/shared/theme.js':'packages/ui/theme.js',
};
for(const file of ['platform.js','platform.css','platform-icon.svg','manifest.webmanifest'])staticAssets['/'+file]='apps/portal/frontend/'+file;
for(const file of ['app.js','style.css','icon.svg','advocate.webmanifest'])staticAssets['/'+file]='apps/advocate/frontend/'+file;
module.exports={staticAssets};
