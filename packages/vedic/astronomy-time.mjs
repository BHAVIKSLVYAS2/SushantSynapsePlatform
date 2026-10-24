import {AstroTime, DeltaT_EspenakMeeus} from './vendor/astronomy-engine-2.1.19.mjs';
import leaps from './data/leap-seconds.json' with {type: 'json'};
import {fail, fields, freeze} from './diagnostics.mjs';

export const J2000 = 2451545;
const day = 86400000;
const epoch = Date.parse('2000-01-01T12:00:00Z');
// Guarded analytic evaluation range including explicit reference anchors/margins.
export const astronomyCoverage = freeze({timeScale: 'TT', startJulianDay: 2433280.5,
 endJulianDay: 2487706.5, endInclusive: true});

export function engineTime(ttJulianDay) {
 if (typeof ttJulianDay !== 'number' || !Number.isFinite(ttJulianDay)) fail();
 if (ttJulianDay < astronomyCoverage.startJulianDay || ttJulianDay > astronomyCoverage.endJulianDay) fail('OUT_OF_RANGE');
 const tt = ttJulianDay - J2000;
 let ut = tt;
 // Bounded inverse rather than the upstream unbounded TT constructor loop.
 for (let i = 0; i < 8; i++) {
  const next = tt - DeltaT_EspenakMeeus(ut) / 86400;
  if (Math.abs(next - ut) < 1e-10) {
   const time = new AstroTime(next);
   time.tt = tt;
   return time;
  }
  ut = next;
 }
 fail('COMPUTATION_LIMIT');
}

export function resolveAstronomyTime(input) {
 fields(input, ['timeScale', 'julianDay', 'utcInstant']);
 let time, utcInstant = null, civilJulianDay = null, ttMinusCivilSeconds = null;
 let timeConversionModel = 'explicit-TT-v1';
 const warnings = ['MODELLED_UT1_NOT_OBSERVED_EOP', 'TDB_NOT_COMPUTED'];
 if (input.timeScale === 'TT') {
  if (Object.hasOwn(input, 'utcInstant')) fail();
  time = engineTime(input.julianDay);
 } else if (input.timeScale === 'UTC') {
  if (Object.hasOwn(input, 'julianDay') || typeof input.utcInstant !== 'string'
   || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(input.utcInstant)) fail();
  const milliseconds = Date.parse(input.utcInstant);
  const canonical = input.utcInstant.includes('.') ? input.utcInstant : input.utcInstant.slice(0, -1) + '.000Z';
  if (!Number.isFinite(milliseconds) || new Date(milliseconds).toISOString() !== canonical) fail();
  utcInstant = new Date(milliseconds).toISOString();
  civilJulianDay = milliseconds / day + 2440587.5;
  const entry = leaps.entries.findLast(value => value.effectiveUtc <= utcInstant);
  if (entry) {
   ttMinusCivilSeconds = entry.taiMinusUtcSeconds + 32.184;
   timeConversionModel = leaps.version;
   if (utcInstant >= leaps.expiresUtc) {
    warnings.push('LEAP_SECOND_TABLE_EXPIRED_FOR_INSTANT');
    timeConversionModel += '-unconfirmed-last-offset';
   }
  } else {
   ttMinusCivilSeconds = DeltaT_EspenakMeeus((milliseconds - epoch) / day);
   timeConversionModel = 'pre-1972-civil-as-UT1-espenak-meeus-2006-v1';
   warnings.push('PRE_1972_CIVIL_AS_UT1_APPROXIMATION');
  }
  time = engineTime(civilJulianDay + ttMinusCivilSeconds / 86400);
 } else fail();
 return freeze({inputTimeScale: input.timeScale, utcInstant, civilJulianDay,
  ttJulianDay: J2000 + time.tt, ut1JulianDayModelled: J2000 + time.ut,
  tdbJulianDay: null, ttMinusCivilSeconds,
  deltaTSecondsModelled: DeltaT_EspenakMeeus(time.ut), timeConversionModel,
  ut1Model: 'astronomy-engine-2.1.19-espenak-meeus-2006',
  leapSecondSourceSha256: leaps.sourceSha256, leapSecondTableExpiresUtc: leaps.expiresUtc,
  warnings});
}

// Invert this package's civil-to-TT model, never AstroTime.date (modelled UT1).
// ISO UTC cannot represent a leap second; a non-representable root is withheld.
export function civilInstantFromTT(ttJulianDay) {
 engineTime(ttJulianDay);
 let milliseconds = (ttJulianDay - 2440587.5) * day;
 for (let i = 0; i < 8; i++) {
  const utcInstant = new Date(Math.round(milliseconds)).toISOString();
  const resolved = resolveAstronomyTime({timeScale: 'UTC', utcInstant});
  const error = (ttJulianDay - resolved.ttJulianDay) * day;
  if (Math.abs(error) <= 1.1) return freeze({utcInstant, time: resolved});
  milliseconds += error;
 }
 fail('TIME_DATA_UNAVAILABLE');
}
