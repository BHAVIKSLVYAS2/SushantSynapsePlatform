const {createPublicApi} = require('./public-api');
const {createReferenceCache} = require('./reference-cache');
const {codeValid} = require('./national-provider');
function createNavProvider({cacheDir, fetchImpl = fetch, now = () => Date.now(), delayMs = 250} = {}) {
  const api = createPublicApi({fetchImpl, delayMs}), cache = createReferenceCache(cacheDir, {now});
  async function plans(query) {
    const saved = await cache.get('nav:catalogue', 86400000, async () => (await api.request('https://api.mfapi.in/mf')).data,
      rows => {if (!Array.isArray(rows) || !rows.length || rows.length > 100000 || rows.some(r => !codeValid(r.schemeCode) || typeof r.schemeName !== 'string')) throw Error('Invalid scheme catalogue');});
    const words = query.toLowerCase().split(/\s+/);
    const rows = saved.value.filter(r => String(r.schemeCode) === query || words.every(w => r.schemeName.toLowerCase().includes(w)));
    return {plans:rows.slice(0,40).map(r => ({code:String(r.schemeCode),name:r.schemeName})),total:rows.length,stale:saved.stale};
  }
  async function history(code) {
    if (!codeValid(code)) throw Error('Invalid scheme code');
    const saved = await cache.get('nav:history:'+code, 86400000, async () => {
      const {data} = await api.request('https://api.mfapi.in/mf/'+code);
      if (data.status !== 'SUCCESS' || String(data.meta?.scheme_code) !== code) throw Error('NAV scheme identity mismatch');
      return {code,name:data.meta.scheme_name,rows:data.data.map(r => {
        const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(r.date);
        return {date:match ? `${match[3]}-${match[2]}-${match[1]}` : '',nav:Number(r.nav)};
      }).sort((a,b) => a.date.localeCompare(b.date)),fetchedAt:new Date(now()).toISOString()};
    }, value => {
      if (value?.code !== code || typeof value.name !== 'string' || !Array.isArray(value.rows) || !value.rows.length || value.rows.length > 30000) throw Error('NAV history unavailable');
      let previous = '';
      for (const r of value.rows) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(r.date) || !Number.isFinite(Date.parse(r.date)) || new Date(r.date).toISOString().slice(0,10) !== r.date || r.date <= previous || Date.parse(r.date) > now() || !Number.isFinite(r.nav) || r.nav <= 0) throw Error('Invalid NAV history');
        previous = r.date;
      }
    });
    return {...saved.value,stale:saved.stale,source:'MFapi',sourceUrl:'https://api.mfapi.in/mf/'+code};
  }
  return {plans,history};
}
module.exports = {createNavProvider};
