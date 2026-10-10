import {newsSources} from './news-sources.mjs';
import {fundSources} from './fund-sources.mjs';
import pages from './pages.json' with {type: 'json'};
const independent = new Set(['/showcase', '/showcase/', '/support', '/support/', '/ritual-assist', '/ritual-assist/', '/ritual-assist/calendar', '/ritual-assist/calendar/', '/take-a-break', '/take-a-break/', '/sponsor', '/sponsor/', '/moment-studio', '/moment-studio/', '/moment-studio/cards', '/moment-studio/cards/', '/moment-studio/certificates', '/moment-studio/certificates/', '/pocket-pause', '/pocket-pause/', '/team-mixer', '/team-mixer/', '/celebration-studio', '/celebration-studio/', '/decision-wheel', '/decision-wheel/', '/daily-spark', '/daily-spark/', '/', '/fund-overlap', '/news', '/certificates', '/certificates/', '/timetable-lite', '/timetable-lite/']);
const security = {
  'X-Synapse-Frontend': 'cloudflare',
  'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY', 'Referrer-Policy': 'same-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'",
};
function unavailable(method) {
  return new Response(method === 'HEAD' ? null : JSON.stringify({error: 'The backend is currently unavailable. Please try again later. Fund Lens, News temporary editions, Moment Studio, Timetable Lite, Daily Spark, Decision Wheel, Team Mixer and Pocket Pause remain available with an internet connection. Chambers, DIGITAL SAMAJ, Tournament Lite, BatchFee Lite and News saved editions need the server connection to return.', code: 'BACKEND_UNAVAILABLE'}), {
    status: 503, headers: {...security, 'Content-Type': 'application/json; charset=utf-8', 'Retry-After': '30'},
  });
}
// Use a Worker ROUTE, retaining the existing tunnel origin. A Custom Domain
// would change fetch(request) routing and must not replace this configuration.
export async function handle(request, env, originFetch = fetch, sourceOptions = {}) {
  const url = new URL(request.url), pathname = url.pathname;
  if (pathname.startsWith('/api/fund-overlap/') && !/^\/api\/fund-overlap\/(portfolio|watchlists|plans|nav)(\/|$)/.test(pathname)) return fundSources(request, env, sourceOptions);
  if (pathname === '/api/news/sources') return newsSources(request, env, sourceOptions);
  if (pathname.startsWith('/api/') || pathname === '/healthz') {
    // Never forward preview-host credentials/writes to the production database.
    if (url.hostname !== 'apps.sushantsynapse.com') return unavailable(request.method);
    try {
      const response = await originFetch(new Request(request, {redirect: 'manual', signal: AbortSignal.timeout(['GET', 'HEAD'].includes(request.method) ? 15000 : 60000)}));
      if (response.status >= 500) { await response.body?.cancel(); return unavailable(request.method); }
      const headers = new Headers(response.headers);
      headers.set('Cache-Control', 'no-store');
      return new Response(response.body, {status: response.status, statusText: response.statusText, headers});
    } catch { return unavailable(request.method); }
  }
  if (!['GET', 'HEAD'].includes(request.method)) return new Response('Method not allowed', {status: 405, headers: {...security, Allow: 'GET, HEAD'}});
  const canonical = ['/news/', '/advocate/', '/fund-overlap/', '/signin/'].includes(pathname) ? pathname.slice(0, -1) : pathname;
  let page = pages[canonical];
  if (!page) return new Response('Not found', {status: 404, headers: security});
  let offline = false;
  if (!independent.has(canonical)) {
    offline = true;
    if (url.hostname === 'apps.sushantsynapse.com') {
      try {
        const response = await originFetch(new Request(new URL('/healthz', url), {signal: AbortSignal.timeout(4000), redirect: 'manual'}));
        offline = !response.ok;
        await response.body?.cancel();
      } catch { /* Render the offline page, including without JavaScript. */ }
    }
    if (offline) page = '/_pages/unavailable.html';
  }
  const response = await env.ASSETS.fetch(new Request(new URL(page, url)));
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(security)) headers.set(name, value);
  if (offline) headers.set('Retry-After', '30');
  return new Response(request.method === 'HEAD' ? null : response.body, {status: offline ? 503 : response.status, headers});
}
export default {fetch(request, env) { return handle(request, env); }};
