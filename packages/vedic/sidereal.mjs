import {astronomySnapshot, astronomyModel} from './astronomy.mjs';
import {resolveAstronomyTime} from './astronomy-time.mjs';
import {lahiriAyanamsha, ayanamshaModel} from './ayanamsha.mjs';
import {DEG, meanEcliptic1976, meanLunarNode2003, longitudeOf} from './iau1976.mjs';
import {normalizeDegrees, classifySidereal, sectorBoundaryDistances} from './angles.mjs';
import {fail, fields, freeze} from './diagnostics.mjs';

const physical = astronomyModel.bodies;
const allBodies = Object.freeze([...physical, 'Rahu', 'Ketu']);
export const siderealProfile = freeze({id: 'IN_LAHIRI_DEFAULT_V1', version: 'sidereal-iau1976-1980-v1',
 conventionsVersion: 'vedic-conventions-1-anchor-erratum-20261024',
 ayanamsha: ayanamshaModel, frame: 'IAU1976-mean-ecliptic-of-date-plus-IAU1980-longitude-nutation',
 nodeModel: 'IERS2003-Simon1994-mean-lunar-node-TT-approximation-v1',
 nodeSource: 'https://raw.githubusercontent.com/liberfa/erfa/v2.0.1/src/faom03.c',
 classificationScreeningGuardArcsec: 61,
 guardMeaning: 'proposed 60 arcsecond physical-position target plus 1 arcsecond ayanamsha target; not a certified error bound',
 birthTimeStability: 'not-evaluated', releaseStatus: 'internal-candidate-production-acceptance-pending'});

export function siderealSnapshot(input) {
 fields(input, ['timeScale', 'julianDay', 'utcInstant', 'bodies', 'calculationProfileId']);
 if (input.calculationProfileId !== siderealProfile.id) fail('MODEL_UNAVAILABLE');
 const selected = input.bodies ?? allBodies;
 if (!Array.isArray(selected) || Object.getPrototypeOf(selected) !== Array.prototype
  || selected.length < 1 || selected.length > allBodies.length
  || Reflect.ownKeys(selected).some(key => key !== 'length' && !/^[0-8]$/.test(typeof key === 'string' ? key : 'invalid'))) fail();
 for (let i = 0; i < selected.length; i++) {
  const property = Object.getOwnPropertyDescriptor(selected, String(i));
  if (!property || !Object.hasOwn(property, 'value') || !allBodies.includes(property.value)) fail();
 }
 if (new Set(selected).size !== selected.length) fail();
 const timeInput = {timeScale: input.timeScale};
 for (const key of ['julianDay', 'utcInstant']) if (Object.hasOwn(input, key)) timeInput[key] = input[key];
 const time = resolveAstronomyTime(timeInput), jd = time.ttJulianDay;
 const ayanamsha = lahiriAyanamsha(jd);
 const chosenPhysical = selected.filter(body => physical.includes(body));
 const raw = chosenPhysical.length ? astronomySnapshot({...timeInput, bodies: chosenPhysical, correction: 'apparent'}) : null;
 const byBody = new Map(raw ? raw.positions.map(position => [position.body, position]) : []);
 const meanRahu = meanLunarNode2003(jd);
 const warnings = [...new Set([...(raw ? raw.warnings : time.warnings),
  'INTERNAL_CANDIDATE_NOT_PRODUCTION_VALIDATED', 'SIDEREAL_REFERENCE_REVIEW_PENDING', 'BIRTH_TIME_STABILITY_NOT_EVALUATED'])];
 const positions = selected.map(body => {
  const node = body === 'Rahu' || body === 'Ketu';
  let meanLongitude, eclipticLatitude = null;
  if (node) meanLongitude = normalizeDegrees(meanRahu + (body === 'Ketu' ? 180 : 0));
  else {
   const ecliptic = meanEcliptic1976(byBody.get(body).vectorAu, jd);
   meanLongitude = longitudeOf(ecliptic);
   eclipticLatitude = Math.atan2(ecliptic[2], Math.hypot(ecliptic[0], ecliptic[1])) / DEG;
  }
  const tropicalLongitude = normalizeDegrees(meanLongitude + ayanamsha.nutationDegrees);
  // Subtract in the mean frame: algebraically identical to true-minus-true,
  // with less roundoff and no double-counted nutation.
  const siderealLongitude = normalizeDegrees(meanLongitude - ayanamsha.meanDegrees);
  const classification = classifySidereal(siderealLongitude), boundaryDistances = sectorBoundaryDistances(siderealLongitude);
  const nearBoundary = Object.values(boundaryDistances).some(distance => distance <= siderealProfile.classificationScreeningGuardArcsec);
  if (nearBoundary && !warnings.includes('SECTOR_NEAR_MODEL_BOUNDARY')) warnings.push('SECTOR_NEAR_MODEL_BOUNDARY');
  return {body, kind: node ? 'computed-mean-lunar-node' : 'physical-body',
   meanTropicalLongitude: meanLongitude, tropicalLongitude, siderealLongitude, eclipticLatitude,
   rashi: classification.rashi, degreeWithinRashi: classification.degreeWithinRashi,
   nakshatra: classification.nakshatra, pada: classification.pada,
   boundaryDistances, nearBoundary, precisionClass: 'nominal-candidate-not-stability-verified'};
 });
 return freeze({contractVersion: 'vedic-positions-1', profile: siderealProfile,
  astronomyModel, time, ayanamsha, positions, warnings});
}
