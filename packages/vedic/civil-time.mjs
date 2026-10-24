import rules from './data/india-time.json' with {type: 'json'};
import {fail, fields, freeze} from './diagnostics.mjs';

export const civilTimeProfile = freeze(rules);
const minute = 60000;
const earliest = Date.parse('1950-01-01T00:00:00Z');
const exclusiveEnd = Date.parse('2099-01-01T00:00:00Z');

// A bounded, source-derived rule. Never use Date's host timezone or Intl for conversion.
function checkRules() {
 if (rules.timeZoneId !== 'Asia/Kolkata' || rules.tzdbVersion !== '2025b'
  || rules.offsetMinutes !== 330 || rules.localStart !== '1950-01-01'
  || rules.localEndExclusive !== '2099-01-01') fail('TIME_DATA_UNAVAILABLE');
}
export function civilDateMilliseconds(value) {
 if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) fail();
 const result = Date.parse(value + 'T00:00:00Z');
 if (!Number.isFinite(result) || new Date(result).toISOString().slice(0, 10) !== value) fail();
 if (result < earliest || result >= exclusiveEnd) fail('OUT_OF_RANGE');
 return result;
}
export function civilClockMinutes(value) {
 if (typeof value !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) fail();
 return Number(value.slice(0, 2)) * 60 + Number(value.slice(3));
}
export function resolveCivilTime(input) {
 fields(input, ['localDate', 'localTime', 'timeZoneId']);
 checkRules();
 if (input.timeZoneId !== rules.timeZoneId) fail('UNSUPPORTED_TIMEZONE');
 const local = civilDateMilliseconds(input.localDate) + civilClockMinutes(input.localTime) * minute;
 return freeze({utcInstant: new Date(local - rules.offsetMinutes * minute).toISOString(),
  offset: '+05:30', offsetMinutes: rules.offsetMinutes, timeZoneId: rules.timeZoneId,
  tzdbVersion: rules.tzdbVersion, timeRuleVersion: rules.version,
  timeSourceSha256: rules.sourceSha256, timeBasis: 'civil-utc-compatible', inputResolutionSeconds: 60});
}
export function assertCivilInterval(startUtc, endUtc, endInclusive) {
 checkRules();
 const start = startUtc + rules.offsetMinutes * minute;
 const end = endUtc + rules.offsetMinutes * minute;
 if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || start < earliest
  || (endInclusive ? end >= exclusiveEnd : end > exclusiveEnd)) fail('OUT_OF_RANGE');
}
