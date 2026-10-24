import {classifySidereal, sectorBoundaryDistances} from './angles.mjs';
import {civilTimeProfile} from './civil-time.mjs';
import {fail, fields, freeze} from './diagnostics.mjs';

const dayMilliseconds = 86400000, yearMilliseconds = 31557600000;
const lords = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'];
const years = [7, 20, 6, 10, 7, 18, 16, 19, 17];
const cycleMilliseconds = 120 * yearMilliseconds;
const earliestBirth = Date.parse('1949-12-31T18:30:00Z');
const exclusiveBirthEnd = Date.parse('2098-12-31T18:30:00Z');

export const vimshottariModel = freeze({id: 'vimshottari-maha-antar-1', calculationProfileId: 'IN_LAHIRI_DEFAULT_V1',
 yearConventionId: 'VIMSHOTTARI_365_25_DAY_V1', daysPerYear: 365.25, dayMilliseconds, yearMilliseconds,
 lords: lords.map((lord, i) => ({lord, years: years[i]})), cycleYears: 120,
 timeBasis: 'uniform-day-Unix-millisecond-arithmetic-v1',
 utcMeaning: 'ISO projections of arithmetic timestamps; no SI elapsed-time or future leap-second prediction',
 periodBoundaries: '[start,end); shared integer millisecond boundaries',
 maximumQueryYearsAfterBirth: 240,
 releaseStatus: 'internal-candidate-independent-period-acceptance-pending'});

function instant(value) {
 if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)) fail();
 const ms = Date.parse(value), canonical = value.includes('.') ? value : value.slice(0, -1) + '.000Z';
 if (!Number.isSafeInteger(ms) || new Date(ms).toISOString() !== canonical) fail();
 return ms;
}

export function vimshottariBirthBalance(moonSiderealLongitude) {
 const position = classifySidereal(moonSiderealLongitude), index = position.nakshatra - 1;
 const start = index * 360 / 27, end = (index + 1) * 360 / 27;
 const elapsedFraction = (position.longitude - start) / (end - start);
 const remainingFraction = (end - position.longitude) / (end - start), lordIndex = index % 9;
 const fullMilliseconds = years[lordIndex] * yearMilliseconds;
 const rawElapsedMilliseconds = elapsedFraction * fullMilliseconds;
 // Preserve the classified birth lord when a positive balance is below 1ms.
 // The adjustment is at most 1ms; no angular epsilon changes Nakshatra.
 const elapsedMilliseconds = Math.min(fullMilliseconds - 1, Math.max(0, Math.round(rawElapsedMilliseconds)));
 return freeze({sourceMoonSiderealLongitude: position.longitude, nakshatra: position.nakshatra,
  lord: lords[lordIndex], lordIndex, fullYears: years[lordIndex], elapsedFraction, remainingFraction,
  remainingYears: remainingFraction * years[lordIndex], rawElapsedMilliseconds,
  elapsedMilliseconds, remainingMilliseconds: fullMilliseconds - elapsedMilliseconds,
  subMillisecondBalanceQuantized: Math.round(rawElapsedMilliseconds) >= fullMilliseconds,
  boundaryDistanceArcsec: sectorBoundaryDistances(position.longitude).nakshatraArcsec,
  nearBoundary: sectorBoundaryDistances(position.longitude).nakshatraArcsec <= 61});
}

function boundaryProjector() {
 const cache = new Map(); let unavailable = false;
 const rules = civilTimeProfile;
 if (rules.timeZoneId !== 'Asia/Kolkata' || rules.offsetMinutes !== 330 || rules.tzdbVersion !== '2025b') fail('TIME_DATA_UNAVAILABLE');
 const localStart = Date.parse(rules.localStart + 'T00:00:00Z');
 const localEnd = Date.parse(rules.localEndExclusive + 'T00:00:00Z');
 function at(milliseconds) {
  if (!cache.has(milliseconds)) {
   const shifted = milliseconds + rules.offsetMinutes * 60000;
   let local;
   if (shifted < localStart || shifted >= localEnd) {
    unavailable = true;
    local = {status: 'unavailable', diagnostic: {code: 'TIME_DATA_UNAVAILABLE',
     message: 'This boundary is outside the pinned India civil-time range.'}};
   } else {
    local = {status: 'available', localDateTime: new Date(shifted).toISOString().slice(0, -1),
     offset: '+05:30', offsetMinutes: rules.offsetMinutes, timeZoneId: rules.timeZoneId,
     timeRuleVersion: rules.version, tzdbVersion: rules.tzdbVersion};
   }
   cache.set(milliseconds, {milliseconds, utcInstant: new Date(milliseconds).toISOString(), local});
  }
  return cache.get(milliseconds);
 }
 return {at, hasUnavailable: () => unavailable};
}

// Pure arithmetic: callers supply an already computed nominal birth Moon.
// No astronomy, host clock, place lookup, network or persistence is involved.
export function vimshottariTimeline(input) {
 fields(input, ['birthUtcInstant', 'moonSiderealLongitude', 'calculationProfileId',
  'yearConventionId', 'timeZoneId', 'atUtcInstant']);
 if (input.calculationProfileId !== vimshottariModel.calculationProfileId
  || input.yearConventionId !== vimshottariModel.yearConventionId) fail('MODEL_UNAVAILABLE');
 if (input.timeZoneId !== 'Asia/Kolkata') fail('UNSUPPORTED_TIMEZONE');
 const birthMs = instant(input.birthUtcInstant);
 if (birthMs < earliestBirth || birthMs >= exclusiveBirthEnd) fail('OUT_OF_RANGE');
 const atMs = Object.hasOwn(input, 'atUtcInstant') ? instant(input.atUtcInstant) : birthMs;
 const queryEnd = birthMs + 2 * cycleMilliseconds;
 if (atMs < birthMs || atMs >= queryEnd) fail('OUT_OF_RANGE');
 const balance = vimshottariBirthBalance(input.moonSiderealLongitude);
 const origin = birthMs - balance.elapsedMilliseconds;
 const cycleIndex = Math.floor((atMs - origin) / cycleMilliseconds);
 const cycleStart = origin + cycleIndex * cycleMilliseconds;
 const project = boundaryProjector();
 const majors = []; let cursor = cycleStart;
 for (let i = 0; i < 9; i++) {
  const lordIndex = (balance.lordIndex + i) % 9, duration = years[lordIndex] * yearMilliseconds;
  const startMs = cursor, endMs = startMs + duration;
  const children = []; let cumulativeYears = 0;
  for (let j = 0; j < 9; j++) {
   const minorIndex = (lordIndex + j) % 9;
   const childStart = startMs + years[lordIndex] * cumulativeYears * (yearMilliseconds / 120);
   cumulativeYears += years[minorIndex];
   const childEnd = j === 8 ? endMs : startMs + years[lordIndex] * cumulativeYears * (yearMilliseconds / 120);
   children.push({index: j, lord: lords[minorIndex], start: project.at(childStart), end: project.at(childEnd),
    durationMilliseconds: childEnd - childStart, endInclusive: false});
  }
  majors.push({index: i, lord: lords[lordIndex], durationYears: years[lordIndex],
   start: project.at(startMs), end: project.at(endMs), durationMilliseconds: duration,
   endInclusive: false, antardashas: children});
  cursor = endMs;
 }
 const major = majors.find(p => p.start.milliseconds <= atMs && atMs < p.end.milliseconds);
 if (!major) fail('COMPUTATION_LIMIT');
 const minor = major.antardashas.find(p => p.start.milliseconds <= atMs && atMs < p.end.milliseconds);
 if (!minor) fail('COMPUTATION_LIMIT');
 const nextMajorLord = lords[(lords.indexOf(major.lord) + 1) % 9];
 const majorChanges = minor.index === 8;
 const nextMinorLord = majorChanges ? nextMajorLord : major.antardashas[minor.index + 1].lord;
 const birthMajorStart = project.at(origin), birthMajorEnd = project.at(origin + balance.fullYears * yearMilliseconds);
 const warnings = ['INTERNAL_CANDIDATE_NOT_PRODUCTION_VALIDATED', 'DASHA_UNIFORM_DAY_UNIX_PROJECTIONS',
  'DASHA_INDEPENDENT_REFERENCE_ACCEPTANCE_PENDING', 'BIRTH_TIME_STABILITY_NOT_EVALUATED'];
 if (balance.nearBoundary) warnings.push('DASHA_NEAR_NAKSHATRA_BOUNDARY');
 if (balance.subMillisecondBalanceQuantized) warnings.push('SUB_MILLISECOND_BALANCE_QUANTIZED_TO_ONE_MILLISECOND');
 const queryCoverage = {startMilliseconds: birthMs, endMilliseconds: queryEnd,
  startUtcInstant: new Date(birthMs).toISOString(), endUtcInstant: new Date(queryEnd).toISOString(), endInclusive: false};
 if (project.hasUnavailable()) warnings.push('DASHA_LOCAL_PROJECTION_OUTSIDE_PINNED_CIVIL_RANGE');
 return freeze({contractVersion: 'vedic-dasha-1', model: vimshottariModel,
  birthUtcInstant: new Date(birthMs).toISOString(), balance,
  birthMahadasha: {lord: balance.lord, start: birthMajorStart, end: birthMajorEnd},
  cycleIndex, cycle: {start: project.at(cycleStart), end: project.at(cursor), durationMilliseconds: cycleMilliseconds},
  queryCoverage, mahadashas: majors,
  active: {atUtcInstant: new Date(atMs).toISOString(), precisionClass: 'nominal-not-stability-verified', mahadashaIndex: major.index,
   mahadashaLord: major.lord, antardashaIndex: minor.index, antardashaLord: minor.lord,
   nextTransition: {boundary: minor.end, changes: majorChanges ? ['mahadasha', 'antardasha'] : ['antardasha'],
    nextMahadashaLord: majorChanges ? nextMajorLord : major.lord, nextAntardashaLord: nextMinorLord},
   nextMahadashaTransition: {boundary: major.end, nextLord: nextMajorLord}},
  birthTimeStability: 'not-evaluated', interpretation: 'traditional-period-arithmetic-only', warnings});
}
