const messages = Object.freeze({
 CONSENT_REQUIRED: 'Explicit permission is required before processing two people’s birth details.',
 INVALID_INPUT: 'Check the supplied place and civil-time fields.',
 UNKNOWN_PLACE: 'This place is not in the supported offline directory.',
 AMBIGUOUS_PLACE: 'Choose a place by its ID and state; this name has multiple matches.',
 UNSUPPORTED_PLACE: 'Only listed Indian places are supported; custom coordinates are unavailable.',
 UNSUPPORTED_TIMEZONE: 'This timezone is not supported by the India civil-time profile.',
 OUT_OF_RANGE: 'The requested date or complete time interval is outside supported bounds.',
 TIME_DATA_UNAVAILABLE: 'The required civil-time rule data is unavailable.',
 MODEL_UNAVAILABLE: 'This calculation profile is unavailable.',
 EPHEMERIS_UNAVAILABLE: 'The required astronomy model is unavailable.',
 SUNRISE_UNAVAILABLE: 'A sunrise defining this day is unavailable at the supplied locality.',
 LAGNA_UNAVAILABLE: 'The ascendant is unsupported at this polar or degenerate horizon geometry.',
 COMPUTATION_LIMIT: 'The bounded astronomy calculation could not complete.',
 UNSTABLE_BIRTH_TIME: 'A single precise instant is required for this calculation.'
});

export class VedicInputError extends Error {
 constructor(code) {
  super(messages[code] || messages.INVALID_INPUT);
  this.name = 'VedicInputError';
  this.code = Object.hasOwn(messages, code) ? code : 'INVALID_INPUT';
 }
 toJSON() { return {code: this.code, message: this.message}; }
}
export function fail(code = 'INVALID_INPUT') { throw new VedicInputError(code); }
export function plainObject(value) {
 return value !== null && typeof value === 'object' && !Array.isArray(value)
  && [Object.prototype, null].includes(Object.getPrototypeOf(value));
}
export function fields(value, allowed) {
 if (!plainObject(value) || Reflect.ownKeys(value).some(key => typeof key !== 'string'
  || !allowed.includes(key) || !Object.hasOwn(Object.getOwnPropertyDescriptor(value, key), 'value'))) fail();
}
export function freeze(value) {
 if (value && typeof value === 'object' && !Object.isFrozen(value)) {
  for (const item of Object.values(value)) freeze(item);
  Object.freeze(value);
 }
 return value;
}
