import {Body, Observer, SearchRiseSet} from './vendor/astronomy-engine-2.1.19.mjs';
import {resolveAstronomyTime, engineTime, J2000, civilInstantFromTT} from './astronomy-time.mjs';
import {civilDateMilliseconds, resolveCivilTime, civilTimeProfile} from './civil-time.mjs';
import {panchangSnapshot, panchangChangesBetween, panchangProfile} from './panchang.mjs';
import {fail, fields, freeze, VedicInputError} from './diagnostics.mjs';

const day = 86400000, offset = 330 * 60000;
const observerKeys = ['localDate', 'timeZoneId', 'latitude', 'longitude', 'elevationMetres'];
export const sunriseModel = freeze({id: 'ae-2.1.19-upper-limb-ground-observer-v1',
 limb: 'upper', refraction: '34 arcminutes scaled by engine standard-atmosphere density at ground elevation',
 solarRadius: 'engine solar radius divided by topocentric distance',
 observerHeight: 'declared elevation above sea level; observer at ground level',
 metersAboveGround: 0, horizonDipDegrees: 0, terrain: 'unobstructed local horizontal horizon',
 earthRotation: 'modelled UT1 from Espenak-Meeus delta-T, not observed EOP',
 weather: 'standard atmosphere; actual weather and terrain are not modelled'});

function observer(input) {
 for (const [key, max] of [['latitude', 90], ['longitude', 180]]) {
  if (typeof input[key] !== 'number' || !Number.isFinite(input[key]) || Math.abs(input[key]) > max) fail();
 }
 const height = Object.hasOwn(input, 'elevationMetres') ? input.elevationMetres : 0;
 if (typeof height !== 'number' || !Number.isFinite(height) || height < -500 || height > 9000) fail();
 return new Observer(input.latitude, input.longitude, height);
}
function shiftedDate(date, days) {
 return new Date(civilDateMilliseconds(date) + days * day).toISOString().slice(0, 10);
}
function vara(date) {
 const index = new Date(civilDateMilliseconds(date)).getUTCDay();
 return {index, name: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][index]};
}
function locality(input) {
 return {timeZoneId: input.timeZoneId, latitude: input.latitude, longitude: input.longitude,
  ...(Object.hasOwn(input, 'elevationMetres') ? {elevationMetres: input.elevationMetres} : {})};
}

// Low-level coordinate primitive, not the public place-admission boundary.
// Even polar coordinates are validated to return a safe no-event diagnostic.
export function sunriseOnCivilDay(input) {
 fields(input, observerKeys);
 const site = observer(input);
 const start = resolveCivilTime({localDate: input.localDate, localTime: '00:00', timeZoneId: input.timeZoneId});
 const startMs = Date.parse(start.utcInstant), endMs = startMs + day;
 const time = resolveAstronomyTime({timeScale: 'UTC', utcInstant: start.utcInstant});
 const end = resolveAstronomyTime({timeScale: 'UTC', utcInstant: new Date(endMs).toISOString()});
 let event;
 try {
  // Window is one civil day mapped to engine time, not 24 hours of guessed UTC.
  const first = engineTime(time.ttJulianDay), last = engineTime(end.ttJulianDay);
  event = SearchRiseSet(Body.Sun, site, 1, first, last.ut - first.ut, 0);
 } catch (error) {
  if (error instanceof VedicInputError) throw error;
  fail('COMPUTATION_LIMIT');
 }
 if (!event) fail('SUNRISE_UNAVAILABLE');
 const civil = civilInstantFromTT(J2000 + event.tt), ms = Date.parse(civil.utcInstant);
 if (ms < startMs || ms >= endMs) fail('SUNRISE_UNAVAILABLE');
 return freeze({localDate: input.localDate, utcInstant: civil.utcInstant,
  ttJulianDay: J2000 + event.tt, time: civil.time, model: sunriseModel,
  observer: {latitude: site.latitude, longitude: site.longitude, elevationMetres: site.height},
  timeZoneId: civilTimeProfile.timeZoneId, warnings: [...new Set([...time.warnings, ...end.warnings,
   ...civil.time.warnings, 'STANDARD_ATMOSPHERE_UNOBSTRUCTED_HORIZON',
   ...(!Object.hasOwn(input, 'elevationMetres') ? ['SEA_LEVEL_ASSUMED'] : [])])]});
}

function profile(input) {
 if (input.calculationProfileId !== panchangProfile.id) fail('MODEL_UNAVAILABLE');
}
export function panchangBySunrise(input) {
 fields(input, [...observerKeys, 'calculationProfileId']); profile(input);
 const site = locality(input), sunrise = sunriseOnCivilDay({...site, localDate: input.localDate});
 const nextSunrise = sunriseOnCivilDay({...site, localDate: shiftedDate(input.localDate, 1)});
 const snapshot = panchangSnapshot({timeScale: 'TT', julianDay: sunrise.ttJulianDay,
  calculationProfileId: input.calculationProfileId});
 const changes = panchangChangesBetween({startTtJulianDay: sunrise.ttJulianDay,
  endTtJulianDay: nextSunrise.ttJulianDay, calculationProfileId: input.calculationProfileId});
 return freeze({basis: 'sunrise-day', localDate: input.localDate, sunrise, nextSunrise,
  dayInterval: {startUtc: sunrise.utcInstant, endUtc: nextSunrise.utcInstant, endInclusive: false},
  sunriseVara: vara(input.localDate), atSunrise: snapshot, changes,
  observanceRule: null, warnings: [...new Set([...sunrise.warnings, ...nextSunrise.warnings, ...snapshot.warnings])]});
}

export function panchangAtInstant(input) {
 fields(input, ['utcInstant', ...observerKeys.filter(key => key !== 'localDate'), 'calculationProfileId']);
 profile(input);
 const time = resolveAstronomyTime({timeScale: 'UTC', utcInstant: input.utcInstant});
 const localDate = new Date(Date.parse(time.utcInstant) + offset).toISOString().slice(0, 10);
 civilDateMilliseconds(localDate);
 const site = locality(input), today = sunriseOnCivilDay({...site, localDate});
 // Use the reported millisecond UTC boundary consistently for API round trips.
 const beforeSunrise = Date.parse(time.utcInstant) < Date.parse(today.utcInstant);
 const sunriseDate = beforeSunrise ? shiftedDate(localDate, -1) : localDate;
 const definingSunrise = beforeSunrise ? sunriseOnCivilDay({...site, localDate: sunriseDate}) : today;
 const nextSunrise = beforeSunrise ? today : sunriseOnCivilDay({...site, localDate: shiftedDate(localDate, 1)});
 const snapshot = panchangSnapshot({timeScale: 'UTC', utcInstant: time.utcInstant,
  calculationProfileId: input.calculationProfileId});
 return freeze({basis: 'exact-instant', localDate, civilVara: vara(localDate),
  sunriseVara: vara(sunriseDate), sunriseDate, beforeSunrise, definingSunrise, nextSunrise,
  atInstant: snapshot, observanceRule: null,
  warnings: [...new Set([...snapshot.warnings, ...definingSunrise.warnings, ...nextSunrise.warnings])]});
}
