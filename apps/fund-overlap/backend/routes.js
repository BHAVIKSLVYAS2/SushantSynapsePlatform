const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');
const {fail} = require('../../../server/http');
const {slugValid} = require('./provider');
const {createNationalProvider, codeValid, familyName} = require('./national-provider');
const {createNavProvider} = require('./nav-provider');
const {createWatchlists} = require('./watchlists');
const {createPortfolio} = require('./portfolio');

function createFundOverlap({auth, store, cacheDir, provider = createNationalProvider({cacheDir}), nav = createNavProvider({cacheDir})}) {
  const root = path.join(__dirname, '..', 'data');
  const cache = new Map();
  const watchlists = store ? createWatchlists({store,auth}) : null;
  const portfolio = store ? createPortfolio({store,auth,nav}) : null;
  return async function handle({route, method, req, res, user}) {
    if (!auth.hasAppAccess(user, 'fund-overlap')) fail(403, 'Ask the platform owner for Fund Lens access');
    if(route==='fund-overlap/portfolio'||route.startsWith('fund-overlap/portfolio/')) {
      if(!portfolio)fail(503,'Portfolio tracker unavailable');
      return portfolio({route,method,req,res,user});
    }
    if (route === 'fund-overlap/watchlists' || route.startsWith('fund-overlap/watchlists/')) {
      if (!watchlists) fail(503,'Watchlists unavailable');
      return watchlists({route,method,req,res,user});
    }
    if (!['GET', 'HEAD'].includes(method)) fail(405, 'Fund Lens is read-only');
    const relative = route.slice('fund-overlap/'.length);
    if (relative === 'plans' || relative.startsWith('nav/')) {
      let data;
      if (relative === 'plans') {
        const q = (new URL(req.url, 'http://localhost').searchParams.get('q') || '').trim();
        if (q.length < 2 || q.length > 100 || /[\x00-\x1f]/.test(q)) fail(400, 'Enter 2–100 characters');
        try {data = await nav.plans(q);} catch {fail(503, 'Plan search unavailable. Retry shortly.');}
      } else {
        const code = relative.slice(4); if (!codeValid(code)) fail(404, 'Scheme not found');
        try {data = await nav.history(code);} catch (error) {fail(503, error.message);}
      }
      const current = auth.session(req);
      if (!current) fail(401, 'Please sign in');
      if (!auth.hasAppAccess(current, 'fund-overlap')) fail(403, 'Fund Lens access needed');
      res.setHeader('Cache-Control', 'private, no-store'); res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.writeHead(200); return res.end(method === 'HEAD' ? undefined : JSON.stringify(data));
    }
    if (relative === 'search' || relative.startsWith('remote/') || relative.startsWith('scheme/')) {
      res.setHeader('Cache-Control', 'private, no-store');
      res.setHeader('Vary', 'Cookie');
      let data;
      if (relative === 'search') {
        const params = new URL(req.url, 'http://localhost').searchParams;
        const query = (params.get('q') || '').trim(), offset = Number(params.get('offset') || 0);
        if (query.length < 2 || query.length > 100 || /[\x00-\x1f]/.test(query) || !Number.isInteger(offset) || offset < 0 || offset > 100000) fail(400, 'Enter 2–100 characters to search funds');
        const local = JSON.parse(fs.readFileSync(path.join(root, 'fund-index.json'), 'utf8')).funds;
        const words = query.toLowerCase().split(/\s+/);
        const matches = offset ? [] : local.filter(f => words.every(w => `${f.name} ${f.amc} ${f.category}`.toLowerCase().includes(w)));
        try {
          const page = await provider.search(query, offset);
          const remote = Array.isArray(page) ? page : page.funds;
          const merged = [...matches];
          for (const fund of remote) {
            const official = local.find(f => familyName(f.name) === familyName(fund.name));
            const entry = official || fund;
            if (!merged.some(f => f.id === entry.id)) merged.push(entry);
          }
          data = {funds: merged, nextOffset: Array.isArray(page) ? (remote.length === 20 && offset < 200 ? offset + 20 : null) : page.nextOffset, warning:page.warning, total:page.total, catalogueCount:page.catalogueCount};
        } catch { data = {funds: matches, nextOffset: null, warning: 'National fund search is temporarily unavailable. Local verified matches are shown; retry shortly.'}; }
      } else if (relative.startsWith('scheme/')) {
        const code = relative.slice('scheme/'.length);
        if (!codeValid(code)) fail(404, 'Fund not found');
        try { data = await provider.scheme(code); }
        catch (error) { fail(503, error.message); }
      } else {
        const slug = relative.slice('remote/'.length);
        if (!slugValid(slug)) fail(404, 'Fund not found');
        try { data = await provider.snapshot(slug); }
        catch (error) { fail(503, error.message); }
      }
      const current = auth.session(req);
      if (!current) fail(401, 'Please sign in');
      if (!auth.hasAppAccess(current, 'fund-overlap')) fail(403, 'Ask the platform owner for Fund Lens access');
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.writeHead(200); return res.end(method === 'HEAD' ? undefined : JSON.stringify(data));
    }
    if (relative !== 'fund-index.json' && !/^holdings\/[a-z0-9-]{1,80}\/\d{4}-\d{2}-\d{2}-[a-f0-9]{16}\.json$/.test(relative)) fail(404, 'Snapshot not found');
    const file = path.join(root, relative);
    let stat;
    try { stat = fs.statSync(file); } catch { fail(404, 'Snapshot not found'); }
    const version = `${stat.mtimeMs}:${stat.size}`;
    let item = cache.get(relative);
    if (!item || item.version !== version) {
      const bytes = fs.readFileSync(file);
      item = {version, bytes, etag: '"' + createHash('sha256').update(bytes).digest('hex') + '"'};
      if (cache.size > 100) cache.clear();
      cache.set(relative, item);
    }
    // Recheck identity/grants before returning even an unchanged cached snapshot.
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'private, max-age=0, must-revalidate');
    res.setHeader('Vary', 'Cookie');
    res.setHeader('ETag', item.etag);
    if (req.headers['if-none-match'] === item.etag) {res.writeHead(304); return res.end();}
    res.writeHead(200);
    return res.end(method === 'HEAD' ? undefined : item.bytes);
  };
}
module.exports = {createFundOverlap};
