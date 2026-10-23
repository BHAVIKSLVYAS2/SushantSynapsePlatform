'use strict';
(() => {
  if (window.SynapseAvailability) {
    if (document.body?.hasAttribute('data-backend-unavailable') && window.SynapseTheme) {
      const apply = () => { const value = SynapseTheme.read(); document.documentElement.dataset.theme = value === 'system' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : value; };
      document.querySelector('#unavailable-theme').insertAdjacentHTML('afterbegin', SynapseTheme.control());
      document.addEventListener('change', apply);
      matchMedia('(prefers-color-scheme: dark)').addEventListener('change', apply);
      apply();
    }
    return;
  }
  const nativeFetch = window.fetch.bind(window);
  function homeOffline() {
    const workspace = document.querySelector('#workspace-apps');
    if (!workspace) return;
    workspace.querySelectorAll('.workspace-card').forEach(card => {
      if (card.querySelector('.offline-ribbon')) return;
      const ribbon = document.createElement('a');
      ribbon.className = 'offline-ribbon'; ribbon.href = '#workspace-connection';
      ribbon.textContent = 'Offline'; ribbon.setAttribute('aria-label', 'Offline — see why');
      card.prepend(ribbon);
    });
    if (document.querySelector('#workspace-connection')) return;
    const note = document.createElement('aside');
    note.id = 'workspace-connection'; note.className = 'workspace-connection';
    note.setAttribute('aria-labelledby', 'connection-title');
    note.innerHTML = '<span class="connection-symbol" aria-hidden="true">☾</span><div><span class="eyebrow">A LITTLE BEHIND THE SCENES</span><h3 id="connection-title">The workspace connection is unavailable.</h3><p>Some workspace services cannot be reached right now. Your saved records remain on the server. Please retry shortly.</p><p class="connection-footnote">The free tools above are still ready to use. Workspace availability depends on the service connection and your app access.</p><p data-connection-status role="status"></p></div><button type="button" data-check-connection>Check again</button>';
    note.querySelector('[data-check-connection]').onclick = async event => {
      const button = event.currentTarget; button.disabled = true; button.textContent = 'Checking…';
      try {
        const response = await nativeFetch('/healthz', {cache:'no-store', signal:AbortSignal.timeout(5000)});
        if (!response.ok) throw Error('Offline');
        workspace.querySelectorAll('.offline-ribbon').forEach(ribbon => ribbon.remove());
        note.querySelector('#connection-title').textContent = 'The service is responding again.';
        note.querySelectorAll('p:not([data-connection-status])').forEach(p => p.remove());
        note.querySelector('[data-connection-status]').textContent = 'Your private workspaces are ready. Sign in with your usual access.';
        button.remove();
      } catch {
        note.querySelector('[data-connection-status]').textContent = 'Still offline. You can enjoy the free tools while it rests.';
        button.textContent = 'Check again';
      } finally {button.disabled = false;}
    };
    workspace.querySelector('.access-heading').after(note);
  }
  function show() {
    if (location.pathname === '/') {homeOffline(); return;}
    if (!document.body || document.body.hasAttribute('data-backend-unavailable') || document.querySelector('#backend-notice')) return;
    const banner = document.createElement('aside');
    banner.id = 'backend-notice'; banner.className = 'backend-notice'; banner.setAttribute('role', 'status');
    banner.innerHTML = '<p><strong>The backend is currently unavailable.</strong> Chambers, DIGITAL SAMAJ, Tournament Lite and BatchFee Lite cannot load or save server data right now. Fund Lens, News temporary editions, Moment Studio, Timetable Lite, Daily Spark, Decision Wheel, Team Mixer remain available with an internet connection. News saved editions return when the connection is restored. If a save was interrupted, check your records after reconnecting before trying it again.</p><nav aria-label="Connection options"><button type="button" data-check-connection>Check connection</button><a href="/fund-overlap">Fund Lens</a><a href="/news">News</a><a href="/moment-studio">Moment Studio</a><a href="/timetable-lite">Timetable Lite</a><a href="/daily-spark">Daily Spark</a><a href="/decision-wheel">Decision Wheel</a><a href="/team-mixer">Team Mixer</a><button type="button" data-dismiss-notice>Dismiss</button></nav>';
    banner.querySelector('[data-dismiss-notice]').onclick = () => banner.remove();
    banner.querySelector('[data-check-connection]').onclick = async event => {
      const button = event.currentTarget; button.disabled = true; button.textContent = 'Checking…';
      try {
        const response = await nativeFetch('/healthz', {cache: 'no-store', signal: AbortSignal.timeout(5000)});
        if (response.ok) { banner.querySelector('p').textContent = 'Connection restored. Chambers, DIGITAL SAMAJ, Tournament Lite, BatchFee Lite and News saved editions are available again with your usual access. Reload this page when you are ready. Check your records before repeating an interrupted save.'; button.remove(); }
        else button.textContent = 'Still unavailable — check again';
      } catch { button.textContent = 'Still unavailable — check again'; }
      finally { button.disabled = false; }
    };
    document.body.append(banner);
  }
  window.SynapseAvailability = {show};
  window.fetch = async (input, options) => {
    const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url, location.href);
    const newsHandlesOutages = /^\/news\/?$/.test(location.pathname) && url.pathname.startsWith('/api/news/');
    const fundHandlesOutages = /^\/fund-overlap\/?$/.test(location.pathname) && url.pathname.startsWith('/api/fund-overlap/');
    const supportHandlesOutages = /^\/support\/?$/.test(location.pathname) && ['/api/support','/api/platform/support','/api/auth/status'].includes(url.pathname);
    const arenaHandlesOutages = url.pathname === '/api/satire-arena' || url.pathname.startsWith('/api/satire-arena/');
    // Passive chrome is not evidence that the current public tool is offline.
    // Its counter has its own unavailable label; sign-in/private pages still warn.
    const publicPage = /^\/(?:showcase|support|contact|privacy|terms|legal|qr-maker|photo-resize|bill-splitter|focus|news|fund-overlap|timetable-lite|ritual-assist|moment-studio|take-a-break|daily-spark|decision-wheel|team-mixer|confessions|satire-arena)(?:\/|$)/.test(location.pathname) && location.pathname !== '/satire-arena/editor';
    const passiveChrome = url.pathname === '/api/platform/visitors' || (publicPage && url.pathname === '/api/auth/status');
    const backend = !passiveChrome && !arenaHandlesOutages && !newsHandlesOutages && !fundHandlesOutages && !supportHandlesOutages && url.origin === location.origin && (url.pathname.startsWith('/api/') || url.pathname === '/healthz');
    try { const response = await nativeFetch(input, options); if (backend && response.status >= 500) show(); return response; }
    catch (error) { if (backend && error.name !== 'AbortError') show(); throw error; }
  };
})();
