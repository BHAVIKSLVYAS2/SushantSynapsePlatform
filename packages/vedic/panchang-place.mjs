import {getPlace} from './places.mjs';
import {panchangAtInstant, panchangBySunrise} from './panchang-observer.mjs';
import {fields, freeze, fail} from './diagnostics.mjs';

// Public admission uses the offline Indian directory, never arbitrary coordinates.
export function panchangForPlace(input) {
 fields(input, ['placeId', 'utcInstant', 'localDate', 'calculationProfileId', 'elevationMetres']);
 const hasDate = Object.hasOwn(input, 'localDate');
 if (hasDate === Object.hasOwn(input, 'utcInstant')) {
  fail();
 }
 const place = getPlace(input.placeId);
 const args = {latitude: place.latitude, longitude: place.longitude, timeZoneId: place.timeZoneId,
  calculationProfileId: input.calculationProfileId,
  ...(Object.hasOwn(input, 'elevationMetres') ? {elevationMetres: input.elevationMetres} : {})};
 const panchang = hasDate ? panchangBySunrise({...args, localDate: input.localDate})
  : panchangAtInstant({...args, utcInstant: input.utcInstant});
 return freeze({place, panchang, warnings: [...new Set([...panchang.warnings,
  'APPROXIMATE_SETTLEMENT_COORDINATES'])]});
}
