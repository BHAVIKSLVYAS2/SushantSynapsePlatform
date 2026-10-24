import {Body, GeoMoon, HelioVector, BackdatePosition, Vector, Ecliptic}
 from './vendor/astronomy-engine-2.1.19.mjs';
import {engineTime, resolveAstronomyTime, astronomyCoverage} from './astronomy-time.mjs';
import {fail, fields, freeze, VedicInputError} from './diagnostics.mjs';

const bodies = Object.freeze(['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn']);
export const astronomyModel = freeze({id: 'ae-2.1.19-geocentric-v1', engineVersion: '2.1.19',
 engineSha256: '6257fd34e7a74370767a98bf26d1724d748e5f71c1530be6730ff21336cc6607',
 ephemerisId: 'ae-2.1.19-bundled-vsop87-lunar-series',
 dataKind: 'bundled-analytic-coefficients', downloadedJplKernel: false,
 coverage: astronomyCoverage, origin: 'Earth-geocenter', vectorFrame: 'EQJ-J2000-mean-equator',
 angleFrame: 'true-ecliptic-and-equinox-of-date',
 lightTimeModel: 'ae-2.1.19-bounded-10-iteration',
 aberrationModel: 'ae-2.1.19-first-order-heliocentric-observer-backdating',
 excludedCorrections: ['gravitational-light-deflection', 'atmospheric-refraction', 'topocentric-parallax'],
 bodies, releaseStatus: 'internal-candidate-production-acceptance-pending'});

// Raw tropical astronomy only. No sidereal zodiac, nodes, charts or interpretations.
export function astronomySnapshot(input) {
 fields(input, ['timeScale', 'julianDay', 'utcInstant', 'bodies', 'correction', 'modelId']);
 if (input.modelId !== undefined && input.modelId !== astronomyModel.id) fail('MODEL_UNAVAILABLE');
 const correction = input.correction ?? 'apparent';
 if (!['geometric', 'apparent'].includes(correction)) fail();
 const selected = input.bodies ?? bodies;
 if (!Array.isArray(selected) || Object.getPrototypeOf(selected) !== Array.prototype
  || selected.length < 1 || selected.length > bodies.length
  || Reflect.ownKeys(selected).some(key => key !== 'length' && !/^[0-6]$/.test(typeof key === 'string' ? key : 'invalid'))) fail();
 for (let i = 0; i < selected.length; i++) {
  const descriptor = Object.getOwnPropertyDescriptor(selected, String(i));
  if (!descriptor || !Object.hasOwn(descriptor, 'value') || !bodies.includes(descriptor.value)) fail();
 }
 if (new Set(selected).size !== selected.length) fail();
 const timeInput = {timeScale: input.timeScale};
 for (const key of ['julianDay', 'utcInstant']) if (Object.hasOwn(input, key)) timeInput[key] = input[key];
 const scales = resolveAstronomyTime(timeInput), time = engineTime(scales.ttJulianDay);
 try {
  const earth = correction === 'geometric' ? HelioVector(Body.Earth, time) : null;
  const positions = selected.map(body => {
   let vector;
   if (correction === 'apparent') {
    // Apply light-time/aberration to Moon too: upstream GeoVector special-cases it.
    const backdated = BackdatePosition(time, Body.Earth, Body[body], true);
    vector = new Vector(backdated.x, backdated.y, backdated.z, time);
   } else if (body === 'Moon') vector = GeoMoon(time);
   else {
    const target = HelioVector(Body[body], time);
    vector = new Vector(target.x - earth.x, target.y - earth.y, target.z - earth.z, time);
   }
   const ecliptic = Ecliptic(vector);
   const values = [vector.x, vector.y, vector.z, ecliptic.elon, ecliptic.elat];
   if (!values.every(Number.isFinite) || Math.hypot(vector.x, vector.y, vector.z) <= 0) fail('EPHEMERIS_UNAVAILABLE');
   return {body, vectorAu: [vector.x, vector.y, vector.z], tropicalLongitude: ecliptic.elon,
    eclipticLatitude: ecliptic.elat};
  });
  return freeze({contractVersion: 'vedic-astronomy-1', model: astronomyModel,
   time: scales, correction, positions, warnings: [...scales.warnings,
    'INTERNAL_CANDIDATE_NOT_PRODUCTION_VALIDATED', 'APPROXIMATE_ANALYTIC_MODEL']});
 } catch (error) {
  if (error instanceof VedicInputError) throw error;
  fail('EPHEMERIS_UNAVAILABLE');
 }
}
