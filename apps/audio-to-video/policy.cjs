const studioPath = /^(?:\/_static\/[a-f0-9]{32})?\/audio-to-video(?:\/?|\/(?:worker|thread)\.js)$/;
const policy = "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self'; style-src 'self'; img-src 'self' blob: data:; media-src 'self' blob:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'";
module.exports = {studioPath,policy};
