import {classifySidereal, sectorBoundaryDistances} from './angles.mjs';
import {d1ChartAtInstant, wholeSignHouses} from './d1.mjs';
import {freeze} from './diagnostics.mjs';

export const navamsaModel = freeze({id: 'parasari-navamsa-108-half-open-v1',
 method: 'movable-self-fixed-ninth-dual-fifth', sectors: 108,
 boundaries: 'canonical i*360/108; start inclusive, end exclusive',
 meaning: 'divisional signs, not physical positions on a second sky',
 releaseStatus: 'internal-candidate-independent-acceptance-pending'});

export function navamsaForLongitude(siderealLongitude) {
 const source = classifySidereal(siderealLongitude);
 const index = (source.nakshatra - 1) * 4 + source.pada - 1;
 return freeze({sourceSiderealLongitude: source.longitude, sourceRashi: source.rashi,
  divisionIndex: index, divisionWithinRashi: index % 9 + 1,
  rashi: index % 12 + 1,
  boundaryDistanceArcsec: sectorBoundaryDistances(source.longitude).padaArcsec,
  nearBoundary: sectorBoundaryDistances(source.longitude).padaArcsec <= 61,
  coordinateKind: 'divisional-sign-not-physical-longitude'});
}

function fromD1(d1) {
 const ascendant = navamsaForLongitude(d1.ascendant.siderealLongitude);
 const planets = d1.planets.map(position => {
  const division = navamsaForLongitude(position.siderealLongitude);
  return {body: position.body, kind: position.kind, ...division,
   houseNumber: (division.rashi - ascendant.rashi + 12) % 12 + 1};
 });
 const houses = wholeSignHouses((ascendant.rashi - 1) * 30).map(house => ({
  houseNumber: house.houseNumber, rashi: house.rashi,
  bodies: planets.filter(p => p.houseNumber === house.houseNumber).map(p => p.body)}));
 return freeze({contractVersion: 'vedic-d9-1', chartType: 'D9', houseSystem: 'whole-sign',
  profile: d1.profile, time: d1.time, model: navamsaModel, ayanamsha: d1.ayanamsha,
  ascendant, houses, planets, birthTimeStability: 'not-evaluated',
  precisionClass: 'nominal-instant-not-birth-time-stability',
  warnings: [...new Set([...d1.warnings, 'D9_DIVISIONAL_COORDINATES_NOT_PHYSICAL_LONGITUDES',
   'D9_INDEPENDENT_REFERENCE_ACCEPTANCE_PENDING',
   ...([ascendant, ...planets].some(p => p.nearBoundary) ? ['D9_NEAR_MODEL_BOUNDARY'] : [])])]});
}

export function divisionalChartsAtInstant(input) {
 const d1 = d1ChartAtInstant(input);
 return freeze({d1, d9: fromD1(d1)});
}
export function d9ChartAtInstant(input) { return fromD1(d1ChartAtInstant(input)); }
