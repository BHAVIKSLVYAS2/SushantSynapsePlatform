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
  function show() {
    if (!document.body || document.body.hasAttribute('data-backend-unavailable') || document.querySelector('#backend-notice')) return;
    const banner = document.createElement('aside');
    banner.id = 'backend-notice'; banner.className = 'backend-notice'; banner.setAttribute('role', 'status');
    banner.innerHTML = '<p><strong>The backend is currently unavailable.</strong> Server data cannot be loaded or saved right now. If a save was interrupted, check your records after reconnecting before trying it again.</p><nav aria-label="Connection options"><button type="button" data-check-connection>Check connection</button><a href="/certificates">Certificates</a><a href="/timetable-lite">Timetable Lite</a><button type="button" data-dismiss-notice>Dismiss</button></nav>';
    banner.querySelector('[data-dismiss-notice]').onclick = () => banner.remove();
    banner.querySelector('[data-check-connection]').onclick = async event => {
      const button = event.currentTarget; button.disabled = true; button.textContent = 'Checking…';
      try {
        const response = await nativeFetch('/healthz', {cache: 'no-store', signal: AbortSignal.timeout(5000)});
        if (response.ok) { banner.querySelector('p').textContent = 'Connection restored. You can reload this page when you are ready. Check your records before repeating an interrupted save.'; button.remove(); }
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
    const backend = !newsHandlesOutages && !fundHandlesOutages && url.origin === location.origin && (url.pathname.startsWith('/api/') || url.pathname === '/healthz');
    try { const response = await nativeFetch(input, options); if (backend && response.status >= 500) show(); return response; }
    catch (error) { if (backend && error.name !== 'AbortError') show(); throw error; }
  };
})();
