import {siderealSnapshot, siderealProfile} from './sidereal.mjs';
import {normalizeDegrees} from './angles.mjs';
import {resolveAstronomyTime, civilInstantFromTT, astronomyCoverage} from './astronomy-time.mjs';
import {fail, fields, freeze} from './diagnostics.mjs';

export const panchangProfile = freeze({id: siderealProfile.id, version: 'panchang-1',
 sectorConvention: 'half-open-start-inclusive', transitionToleranceSeconds: 0.5,
 searchStepHours: 1, maximumSearchHours: 72,
 releaseStatus: 'internal-candidate-independent-PAC-acceptance-pending'});
const moving = ['Bava', 'Balava', 'Kaulava', 'Taitila', 'Garaja', 'Vanija', 'Vishti'];
const counts = {tithi: 30, nakshatra: 27, yoga: 27, karana: 60};

function sector(angle, count) {
 let low = 0, high = count;
 while (low + 1 < high) {
  const mid = (low + high) >> 1;
  if (angle < mid * 360 / count) high = mid; else low = mid;
 }
 return low;
}

// Pure classification primitive: no rounding and no universal boundary epsilon.
export function classifyPanchangAngles(input) {
 fields(input, ['elongation', 'moonSidereal', 'yogaAngle']);
 const elongation = normalizeDegrees(input.elongation), moon = normalizeDegrees(input.moonSidereal);
 const yoga = normalizeDegrees(input.yogaAngle), t = sector(elongation, 30), k = sector(elongation, 60);
 return freeze({tithi: {number: t + 1, paksha: t < 15 ? 'Shukla' : 'Krishna',
  numberWithinPaksha: t % 15 + 1}, nakshatra: {number: sector(moon, 27) + 1,
  pada: sector(moon, 108) % 4 + 1}, yoga: {number: sector(yoga, 27) + 1},
  karana: {halfTithiIndex: k, name: k === 0 ? 'Kimstughna' : k < 57 ? moving[(k - 1) % 7]
   : ['Shakuni', 'Chatushpada', 'Naga'][k - 57]}});
}

function sample(jd) {
 const snapshot = siderealSnapshot({timeScale: 'TT', julianDay: jd,
  bodies: ['Sun', 'Moon'], calculationProfileId: siderealProfile.id});
 const [sun, moon] = snapshot.positions;
 const angles = {tithi: normalizeDegrees(moon.tropicalLongitude - sun.tropicalLongitude),
  nakshatra: moon.siderealLongitude, yoga: normalizeDegrees(moon.siderealLongitude + sun.siderealLongitude)};
 angles.karana = angles.tithi;
 return {angles, snapshot};
}

// Forward crossings, unwrapped at hourly knots. Domain is monotone Sun/Moon
// limbs in the supported analytic model; rate bounds are checked at every knot.
function transitions(jd, initial) {
 const cache = new Map([[jd, initial]]);
 const at = time => {
  if (!cache.has(time)) {
   if (cache.size >= 256) fail('COMPUTATION_LIMIT');
   cache.set(time, sample(time));
  }
  return cache.get(time);
 };
 const results = {};
 for (const [limb, count] of Object.entries(counts)) {
  const startAngle = initial.angles[limb], index = sector(startAngle, count);
  const distance = (index + 1) * 360 / count - startAngle;
  let lo = jd, progress = 0, lastAngle = startAngle, found = false;
  for (let hour = 1; hour <= 72; hour++) {
   const hi = Math.min(jd + hour / 24, astronomyCoverage.endJulianDay);
   if (hi <= lo) fail('OUT_OF_RANGE');
   const angle = at(hi).angles[limb], advance = normalizeDegrees(angle - lastAngle);
   // 0 < daily rates < 24 degrees/day; protects unwrapping and skipped roots.
   if (!(advance > 0 && advance < (hi - lo) * 24)) fail('COMPUTATION_LIMIT');
   if (progress + advance >= distance) {
    let left = lo, right = hi;
    for (let i = 0; i < 20 && (right - left) * 86400 > 0.5; i++) {
     const mid = (left + right) / 2;
     const moved = progress + normalizeDegrees(at(mid).angles[limb] - lastAngle);
     if (moved >= distance) right = mid; else left = mid;
    }
    if ((right - left) * 86400 > 0.5) fail('COMPUTATION_LIMIT');
    const civil = civilInstantFromTT(right);
    results[limb] = {fromIndex: index, toIndex: (index + 1) % count,
     lowerTtJulianDay: left, upperTtJulianDay: right,
     ttJulianDay: right, utcInstant: civil.utcInstant, time: civil.time,
     bracketWidthSeconds: (right - left) * 86400,
     meaning: 'upper bracket is on new side; numerical convergence is not physical accuracy'};
    found = true; break;
   }
   progress += advance; lo = hi; lastAngle = angle;
  }
  if (!found) fail('COMPUTATION_LIMIT');
 }
 return {next: results, evaluations: cache.size};
}

// Geocentric four limbs. Vara requires an explicit locality: see observer module.
export function panchangSnapshot(input) {
 fields(input, ['timeScale', 'julianDay', 'utcInstant', 'calculationProfileId']);
 if (input.calculationProfileId !== siderealProfile.id) fail('MODEL_UNAVAILABLE');
 const timeInput = {timeScale: input.timeScale};
 for (const key of ['julianDay', 'utcInstant']) if (Object.hasOwn(input, key)) timeInput[key] = input[key];
 const time = resolveAstronomyTime(timeInput), jd = time.ttJulianDay, current = sample(jd);
 const limbs = classifyPanchangAngles({elongation: current.angles.tithi,
  moonSidereal: current.angles.nakshatra, yogaAngle: current.angles.yoga});
 const crossing = transitions(jd, current);
 const screening = {tithi: 120, karana: 120, nakshatra: 61, yoga: 122};
 const nearBoundaryLimbs = Object.entries(counts).filter(([key, count]) => {
  const angle = current.angles[key], start = sector(angle, count) * 360 / count;
  return Math.min(angle - start, start + 360 / count - angle) * 3600 <= screening[key];
 }).map(([key]) => key);
 const warnings = [...new Set([...time.warnings, ...current.snapshot.warnings,
  ...Object.values(crossing.next).flatMap(event => event.time.warnings),
  'PANCHANG_PAC_REFERENCE_ACCEPTANCE_PENDING', 'NO_FESTIVAL_OR_BIRTHDAY_RULE_APPLIED',
  ...(nearBoundaryLimbs.length ? ['PANCHANG_NEAR_MODEL_BOUNDARY'] : [])])];
 return freeze({contractVersion: 'vedic-panchang-1', profile: panchangProfile, time,
  limbs, angles: current.angles, nextTransitions: crossing.next,
  calculationEvaluations: crossing.evaluations, nearBoundaryLimbs,
  screeningGuardArcsec: screening, screeningMeaning: 'proposed targets, not certified bounds', warnings});
}

// Enumerate every crossing in a bounded interval, not just endpoint labels.
// This is astronomical event data; it does not select an observance date.
export function panchangChangesBetween(input) {
 fields(input, ['startTtJulianDay', 'endTtJulianDay', 'calculationProfileId']);
 if (input.calculationProfileId !== siderealProfile.id) fail('MODEL_UNAVAILABLE');
 const start = resolveAstronomyTime({timeScale: 'TT', julianDay: input.startTtJulianDay}).ttJulianDay;
 const end = resolveAstronomyTime({timeScale: 'TT', julianDay: input.endTtJulianDay}).ttJulianDay;
 if (end <= start || end - start > 3) fail('OUT_OF_RANGE');
 const changes = [];
 const cached = new Map();
 const nextAt = cursor => {
  if (!cached.has(cursor)) cached.set(cursor, transitions(cursor, sample(cursor)).next);
  return cached.get(cursor);
 };
 // Separate limb cursors: advancing past one approximate root must never skip
 // a different limb's root in an overlapping subsecond bracket.
 for (const limb of Object.keys(counts)) {
  let cursor = start, finished = false;
  for (let knot = 0; knot < 16; knot++) {
   const event = nextAt(cursor)[limb];
   if (event.lowerTtJulianDay >= end) { finished = true; break; }
   if (event.ttJulianDay <= cursor) fail('COMPUTATION_LIMIT');
   const uncertain = event.upperTtJulianDay >= end;
   changes.push({limb, ...event, intervalMembership: uncertain ? 'boundary-uncertain' : 'inside'});
   if (uncertain) { finished = true; break; }
   cursor = event.ttJulianDay;
  }
  if (!finished) fail('COMPUTATION_LIMIT');
 }
 changes.sort((a, b) => a.ttJulianDay - b.ttJulianDay || Object.keys(counts).indexOf(a.limb) - Object.keys(counts).indexOf(b.limb));
 return freeze({startTtJulianDay: start, endTtJulianDay: end, endInclusive: false,
  changes, convergenceSeconds: 0.5,
  boundaryUncertain: changes.some(event => event.intervalMembership === 'boundary-uncertain'),
  ordering: 'upper numerical brackets; overlapping brackets do not establish physical order'});
}
