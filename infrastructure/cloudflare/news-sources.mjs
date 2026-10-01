import engine from '../../apps/news/frontend/engine.js';

// Public source metadata only. No origin/database access or caller-supplied URLs.
export async function newsSources(request, env, {fetchImpl = fetch, cache = globalThis.caches?.default, now = new Date()} = {}) {
  const headers = {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff'};
  const reply = (status, body) => Response.json(body, {status, headers});
  if (request.method !== 'GET') return new Response(null, {status: 405, headers: {...headers, Allow: 'GET'}});
  const url = new URL(request.url), date = url.searchParams.get('date'), today = engine.indiaDate(now);
  if ([...url.searchParams.keys()].some(key => key !== 'date') || url.searchParams.getAll('date').length !== 1 || !/^\d{4}-\d{2}-\d{2}$/.test(date || '') || !Number.isFinite(Date.parse(date + 'T00:00:00Z')) || new Date(date + 'T00:00:00Z').toISOString().slice(0, 10) !== date || date > today) {
    return reply(400, {error: 'Choose a valid date, today or in the past.'});
  }
  // Canonical keys prevent query-string cache bypass. Cache contains no user data.
  const key = new Request(url.origin + '/api/news/sources?date=' + date);
  try {
    const cached = await cache?.match(key);
    if (cached) return new Response(cached.body, {status: cached.status, headers});
    if (!env.NEWS_LIMITER) return reply(503, {error: 'Independent news sources are not configured yet.'});
    const {success} = await env.NEWS_LIMITER.limit({key: 'news-source-fetch'});
    if (!success) return reply(429, {error: 'News sources are busy. Please try again in a minute.'});
    const cutoff = date === today ? now.toISOString() : new Date(date + 'T23:59:59.999+05:30').toISOString();
    let response;
    try {
      let stories;
      try { stories = await engine.createArchiveProvider({fetchImpl,timeoutMs:60000}).fetchStories(cutoff); }
      catch { stories = await engine.fetchFeedStories(cutoff,fetchImpl); }
      response = reply(200, {date, cutoff, stories});
    } catch (error) {
      console.warn(JSON.stringify({event:'news_source_unavailable',date,reason:error.message}));
      response = reply(502, {error: 'Ten verified stories could not be retrieved for this date. Please try another date or retry later.'});
    }
    if (cache) {
      const stored = new Response(response.clone().body, {status: response.status, headers: {...headers, 'Cache-Control': 'public, max-age=' + (response.ok ? (date === today ? 900 : 86400) : 60)}});
      // Cache failure must not discard successfully fetched public source metadata.
      try { await cache.put(key, stored); } catch { /* Generation can proceed without cache. */ }
    }
    return response;
  } catch {
    return reply(503, {error: 'Independent news sources are temporarily unavailable. Please retry later.'});
  }
}
