import {lagnaAtInstant} from './lagna.mjs';
import {siderealSnapshot, siderealProfile} from './sidereal.mjs';
import {classifySidereal, normalizeDegrees} from './angles.mjs';
import {fields, fail, freeze} from './diagnostics.mjs';

export function wholeSignHouseForLongitude(input) {
 fields(input, ['lagnaSiderealLongitude', 'siderealLongitude']);
 const rising = classifySidereal(input.lagnaSiderealLongitude).rashi;
 const sign = classifySidereal(input.siderealLongitude).rashi;
 return (sign - rising + 12) % 12 + 1;
}

export function wholeSignHouses(lagnaSiderealLongitude) {
 const rising = classifySidereal(lagnaSiderealLongitude).rashi;
 return freeze(Array.from({length: 12}, (_, index) => {
  const rashi = (rising - 1 + index) % 12 + 1;
  return {houseNumber: index + 1, rashi, startSiderealLongitude: (rashi - 1) * 30,
   endSiderealLongitude: normalizeDegrees(rashi * 30), endInclusive: false,
   wrapsZero: rashi === 12};
 }));
}

// Numeric D1 only. Graphic representations belong to P07; input UI to P09.
export function d1ChartAtInstant(input) {
 fields(input, ['timeScale', 'julianDay', 'utcInstant', 'latitude', 'longitude', 'elevationMetres',
  'calculationProfileId', 'houseSystem']);
 if (input.calculationProfileId !== siderealProfile.id
  || (Object.hasOwn(input, 'houseSystem') && input.houseSystem !== 'whole-sign')) fail('MODEL_UNAVAILABLE');
 const lagnaInput = {...input}; delete lagnaInput.houseSystem;
 const ascendant = lagnaAtInstant(lagnaInput);
 const timeInput = {timeScale: input.timeScale, calculationProfileId: input.calculationProfileId};
 for (const key of ['julianDay', 'utcInstant']) if (Object.hasOwn(input, key)) timeInput[key] = input[key];
 const snapshot = siderealSnapshot(timeInput);
 const planets = snapshot.positions.map(position => ({...position,
  houseNumber: wholeSignHouseForLongitude({lagnaSiderealLongitude: ascendant.siderealLongitude,
   siderealLongitude: position.siderealLongitude})}));
 const houses = wholeSignHouses(ascendant.siderealLongitude).map(house => ({...house,
  bodies: planets.filter(position => position.houseNumber === house.houseNumber).map(position => position.body)}));
 return freeze({contractVersion: 'vedic-d1-1', chartType: 'D1', houseSystem: 'whole-sign',
  profile: siderealProfile, time: snapshot.time, astronomyModel: snapshot.astronomyModel,
  ayanamsha: snapshot.ayanamsha, ascendant, houses, planets,
  birthTimeStability: 'not-evaluated', precisionClass: 'nominal-instant-not-birth-time-stability',
  warnings: [...new Set([...ascendant.warnings, ...snapshot.warnings,
   'WHOLE_SIGN_HOUSE_BOUNDARIES_ARE_SIGN_STARTS', 'D1_INDEPENDENT_REFERENCE_ACCEPTANCE_PENDING'])]});
}
