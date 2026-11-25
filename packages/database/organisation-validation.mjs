export class OrganisationError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}

const fail = (code, message) => { throw new OrganisationError(code, message); };

export function text(value, label, max = 500) {
  if (typeof value !== 'string' || !value.trim() || value.length > max) {
    fail('invalid-input', `Invalid ${label}`);
  }
  return value.trim();
}

export function limit(value, min = 0) {
  if (value !== null && (!Number.isSafeInteger(value) || value < min)) {
    fail('invalid-input', 'Invalid seat limit');
  }
  return value;
}

export function instant(value) {
  const timestamp = typeof value === 'string' ? Date.parse(value) : NaN;
  if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString() !== value) {
    fail('invalid-input', 'Use canonical ISO UTC timestamps');
  }
  return timestamp;
}
