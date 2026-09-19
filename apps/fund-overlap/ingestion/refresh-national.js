const path = require('node:path');
const {createNationalProvider} = require('../backend/national-provider');
const root = path.resolve(__dirname, '../../..');
const cacheDir = path.join(process.env.DATA_DIR || path.join(root, 'data'), 'fund-overlap-cache');
const provider = createNationalProvider({cacheDir});
(async () => {
  const codes = await provider.savedSchemeCodes();
  let failures = 0;
  for (const code of codes) {
    try {
      const value = await provider.scheme(code, {force:true});
      if (value.cacheStatus==='stale' || value.cacheWarning) failures++;
      console.log(JSON.stringify({code, name:value.name, portfolioDate:value.portfolioDate, holdings:value.holdings.length, status:value.cacheStatus, warning:value.cacheWarning}));
    } catch (error) {failures++;console.error(JSON.stringify({code,error:error.message}));}
  }
  console.log(JSON.stringify({checked:codes.length,failures,cacheDir}));
  if(failures)process.exitCode=1;
})().catch(error=>{console.error(error.message);process.exitCode=1;});
