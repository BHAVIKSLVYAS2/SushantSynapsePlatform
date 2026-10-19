(function () {
  if (window.top !== window || location.origin !== 'https://apps.sushantsynapse.com') return;
  const state = window.__synapseWrapper || (window.__synapseWrapper = {port: null, busy: false});
  if (state.installed) return;
  state.installed = true;
  // Reading our own exports must not use fetch: the website's connect-src
  // policy rejects blob/data requests even though browser downloads allow them.
  const blobs = new Map();
  const createObjectURL = URL.createObjectURL.bind(URL);
  const revokeObjectURL = URL.revokeObjectURL.bind(URL);
  URL.createObjectURL = blob => { const url = createObjectURL(blob); blobs.set(url, blob); return url; };
  URL.revokeObjectURL = url => { blobs.delete(url); revokeObjectURL(url); };
  const exportBlob = url => {
    if (blobs.has(url)) return blobs.get(url);
    if (url.startsWith('data:')) {
      const comma = url.indexOf(',');
      if (comma < 0) throw new Error('Invalid data URL');
      const header = url.slice(5, comma), payload = url.slice(comma + 1);
      const body = /;base64$/i.test(header)
        ? Uint8Array.from(atob(decodeURIComponent(payload)), c => c.charCodeAt(0))
        : new TextEncoder().encode(decodeURIComponent(payload));
      return new Blob([body], {type: header.split(';')[0] || 'text/plain'});
    }
    throw new Error('Export is no longer available');
  };
  window.addEventListener('message', event => {
    if (event.source && event.source !== window) return;
    if (event.data === 'synapse-native-ready' && event.ports.length === 1) {
      state.port?.close(); state.port = event.ports[0];
    }
  });
  window.print = () => state.port?.postMessage(JSON.stringify({type: 'print'}));
  const accepts = anchor => anchor?.hasAttribute('download') && state.port && /^(blob:|data:)/.test(anchor.href);
  const download = async anchor => {
    if (state.busy) return;
    state.busy = true;
    try {
      const blob = exportBlob(anchor.href);
      if (blob.size > 32 * 1024 * 1024) throw new Error('Download too large');
      state.port.postMessage(JSON.stringify({type: 'start', name: anchor.download || 'download', mime: blob.type, size: blob.size}));
      const bytes = new Uint8Array(await blob.arrayBuffer());
      for (let offset = 0; offset < bytes.length; offset += 49152) {
        const chunk = bytes.subarray(offset, offset + 49152);
        state.port.postMessage(JSON.stringify({type: 'chunk', data: btoa(String.fromCharCode(...chunk))}));
      }
      state.port.postMessage(JSON.stringify({type: 'end'}));
    } catch (_) { state.port?.postMessage(JSON.stringify({type: 'error'})); }
    finally { state.busy = false; }
  };
  const nativeClick = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () {
    if (accepts(this)) { void download(this); return; }
    return nativeClick.call(this);
  };
  document.addEventListener('click', event => {
    const anchor = event.target.closest?.('a[download]');
    if (!accepts(anchor)) return;
    event.preventDefault(); void download(anchor);
  }, true);
})();
