class HttpError extends Error { constructor(status, message) { super(message); this.status = status; } }
const fail = (code, message) => { throw new HttpError(code, message); };
async function readBody(req, limit = 8 * 1024 * 1024) {
  if (!req.headers['content-type']?.startsWith('application/json')) fail(415, 'JSON content type required');
  let size = 0; const chunks = [];
  for await (const chunk of req) { size += chunk.length; if (size > limit) fail(413, 'Request is too large'); chunks.push(chunk); }
  let body; try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { fail(400, 'Invalid JSON'); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) fail(400, 'Invalid request');
  return body;
}

module.exports={fail,readBody};
