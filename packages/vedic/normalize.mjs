import {fail, fields, freeze} from './diagnostics.mjs';
import {getPlace} from './places.mjs';
import {resolveCivilTime, assertCivilInterval, civilDateMilliseconds} from './civil-time.mjs';

const minute = 60000, day = 86400000;
export const calculationProfileId = 'IN_LAHIRI_DEFAULT_V1';

// Stateless normalization only: no astronomical results or stability assertions.
export function normalizeInput(input, context = {}) {
 fields(input, ['localDate', 'localTime', 'placeId', 'timeZoneId', 'calculationProfileId',
  'timeAccuracy', 'precisionOfBirthTimeMinutes', 'language', 'purpose', 'elevationMetres']);
 fields(context, ['now']);
 civilDateMilliseconds(input.localDate);
 if (input.calculationProfileId !== calculationProfileId) fail('MODEL_UNAVAILABLE');
 const place = getPlace(input.placeId);
 if (input.timeZoneId !== place.timeZoneId) fail('UNSUPPORTED_TIMEZONE');
 if (!['exact', 'approximate', 'unknown'].includes(input.timeAccuracy)) fail();
 const language = input.language ?? 'en', purpose = input.purpose ?? 'birth';
 if (!['en', 'hi', 'gu'].includes(language) || !['birth', 'exploration'].includes(purpose)) fail();
 if (purpose === 'birth' && (!Number.isSafeInteger(context.now)
  || Math.abs(context.now) > 8640000000000000)) fail();
 if (input.elevationMetres !== undefined && (typeof input.elevationMetres !== 'number'
  || !Number.isFinite(input.elevationMetres) || input.elevationMetres < -500 || input.elevationMetres > 9000)) fail();
 const warnings = ['APPROXIMATE_PLACE_COORDINATES'];
 if (input.elevationMetres === undefined) warnings.push('SEA_LEVEL_ASSUMED');
 if (input.localDate < '1962-01-01') warnings.push('PROLEPTIC_CIVIL_TIMESTAMP');
 let civil, interval = null;
 if (input.timeAccuracy === 'unknown') {
  if (input.localTime !== undefined || input.precisionOfBirthTimeMinutes !== undefined) fail();
  civil = resolveCivilTime({localDate: input.localDate, localTime: '00:00', timeZoneId: input.timeZoneId});
  const start = Date.parse(civil.utcInstant), end = start + day;
  assertCivilInterval(start, end, false);
  interval = {startUtc: civil.utcInstant, endUtc: new Date(end).toISOString(),
   startInclusive: true, endInclusive: false};
 } else {
  civil = resolveCivilTime({localDate: input.localDate, localTime: input.localTime, timeZoneId: input.timeZoneId});
  if (input.timeAccuracy === 'approximate') {
   const precision = input.precisionOfBirthTimeMinutes;
   if (!Number.isInteger(precision) || precision < 1 || precision > 720) fail();
   const instant = Date.parse(civil.utcInstant), start = instant - precision * minute, end = instant + precision * minute;
   assertCivilInterval(start, end, true);
   interval = {startUtc: new Date(start).toISOString(), endUtc: new Date(end).toISOString(),
    startInclusive: true, endInclusive: true};
  } else if (input.precisionOfBirthTimeMinutes !== undefined) fail();
 }
 const end = Date.parse(interval ? interval.endUtc : civil.utcInstant);
 if (purpose === 'birth' && end > context.now) fail('OUT_OF_RANGE');
 const {utcInstant, ...provenance} = civil;
 return freeze({contractVersion: 'vedic-contract-1', normalizationVersion: 'vedic-normalization-1',
  calculationProfileId, purpose, language, localDate: input.localDate,
  localTime: input.timeAccuracy === 'unknown' ? null : input.localTime,
  timeAccuracy: input.timeAccuracy, precisionOfBirthTimeMinutes: input.precisionOfBirthTimeMinutes ?? null,
  utcInstant: interval ? null : utcInstant, interval, ...provenance,
  inputResolutionSeconds: input.timeAccuracy === 'unknown' ? null : 60,
  place: {...place, elevationMetres: input.elevationMetres ?? 0,
   elevationBasis: input.elevationMetres === undefined ? 'assumed-sea-level' : 'user-supplied'},
  precisionClass: input.timeAccuracy === 'exact' ? 'minute-resolution'
   : input.timeAccuracy === 'approximate' ? 'explicit-interval' : 'unknown-local-day',
  warnings});
}
