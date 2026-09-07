const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');
const {fail} = require('../../../server/http');

function createFundOverlap({auth}) {
  const root = path.join(__dirname, '..', 'data');
  const cache = new Map();
  return function handle({route, method, req, res, user}) {
    if (!auth.hasAppAccess(user, 'fund-overlap')) fail(403, 'Ask the platform owner for Fund Lens access');
    if (!['GET', 'HEAD'].includes(method)) fail(405, 'Fund Lens is read-only');
    const relative = route.slice('fund-overlap/'.length);
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
