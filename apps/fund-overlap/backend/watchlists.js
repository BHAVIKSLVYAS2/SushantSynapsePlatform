const {randomUUID} = require('node:crypto');
const {fail,readBody} = require('../../../server/http');
const {codeValid} = require('./national-provider');
function createWatchlists({store,auth}) {
  return async ({route,method,req,res,user}) => {
    if (!user || !['Owner','Advocate','Clerk'].includes(user.role) || !auth.hasAppAccess(user,'fund-overlap')) fail(403,'Fund Lens access needed');
    const id = route.slice('fund-overlap/watchlists'.length).replace(/^\//,'');
    if (id && !/^[a-f0-9-]{36}$/.test(id)) fail(404,'Watchlist not found');
    let input;
    if (method === 'POST' && !id) {
      input = await readBody(req);
      if (!input || typeof input.name !== 'string' || !input.name.trim() || input.name.trim().length > 60 || /[\x00-\x1f]/.test(input.name)) fail(400,'Enter a watchlist name of 1–60 characters');
      if (!Array.isArray(input.plans) || input.plans.length < 1 || input.plans.length > 4 || input.plans.some(p => !p || typeof p.code !== 'string' || !codeValid(p.code) || typeof p.name !== 'string' || !p.name.trim() || p.name.length > 300) || new Set(input.plans.map(p => p.code)).size !== input.plans.length) fail(400,'Choose 1–4 different exact plans');
    } else if (!(method === 'GET' && !id) && !(method === 'DELETE' && id)) fail(405,'Method not allowed');
    const current = auth.session(req);
    if (!current || current.id !== user.id) fail(401,'Please sign in');
    if (!auth.hasAppAccess(current,'fund-overlap')) fail(403,'Fund Lens access needed');
    let output;
    store.transaction(() => {
      const preferences = store.preferences(current.id), lists = preferences.fundLensWatchlists || [];
      if (method === 'POST') {
        if (lists.length >= 10) fail(400,'You can save up to 10 watchlists. Delete one before adding another.');
        output = {id:randomUUID(),name:input.name.trim(),plans:input.plans.map(p => ({code:p.code,name:p.name.trim()}))}; lists.push(output);
        store.setPreferences(current.id,{...preferences,fundLensWatchlists:lists});
      } else if (method === 'DELETE') {
        if (!lists.some(l => l.id === id)) fail(404,'Watchlist not found');
        store.setPreferences(current.id,{...preferences,fundLensWatchlists:lists.filter(l => l.id !== id)}); output = {deleted:true};
      } else output = {watchlists:lists};
    });
    res.setHeader('Content-Type','application/json; charset=utf-8'); res.setHeader('Cache-Control','private, no-store');
    res.writeHead(method === 'POST' ? 201 : 200); res.end(JSON.stringify(output));
  };
}
module.exports = {createWatchlists};
