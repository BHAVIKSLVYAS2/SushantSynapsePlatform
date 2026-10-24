import {localSiderealTime} from './sidereal-time.mjs';
import {meanObliquity1980, nutation1980, DEG} from './iau1976.mjs';
import {lahiriAyanamsha} from './ayanamsha.mjs';
import {classifySidereal, normalizeDegrees, sectorBoundaryDistances} from './angles.mjs';
import {siderealProfile} from './sidereal.mjs';
import {fail, fields, freeze} from './diagnostics.mjs';

export const lagnaModel = freeze({id: 'lagna-geometric-iau1982-1994-1980-v1',
 profileId: siderealProfile.id, siderealTime: 'IAU1982-GMST-plus-IAU1994-equation-equinoxes-TT-v1',
 obliquity: 'IAU1980-mean-plus-106-term-nutation', horizon: 'local-geometric-geodetic',
 refraction: false, elevationEffect: 'none; local tangent horizon, no dip',
 polarPolicy: 'withhold at or beyond true-obliquity polar circle and near-degenerate geometry',
 precisionClass: 'nominal-instant-not-birth-time-stability',
 releaseStatus: 'internal-candidate-independent-Lagna-acceptance-pending'});

// Standalone geometry primitive. The production profile supplies true obliquity
// and local APPARENT sidereal angle; no mean/true frame mixing is allowed.
export function ascendantGeometry(input) {
 fields(input, ['localApparentDegrees', 'latitude', 'trueObliquityDegrees']);
 if (typeof input.latitude !== 'number' || !Number.isFinite(input.latitude) || Math.abs(input.latitude) > 90
  || typeof input.trueObliquityDegrees !== 'number' || !Number.isFinite(input.trueObliquityDegrees)
  || input.trueObliquityDegrees < 20 || input.trueObliquityDegrees > 26) fail();
 const theta = normalizeDegrees(input.localApparentDegrees) * DEG;
 const phi = input.latitude * DEG, eps = input.trueObliquityDegrees * DEG;
 const minimumNorm = Math.cos(Math.abs(phi) + eps);
 if (minimumNorm <= 1e-6) fail('LAGNA_UNAVAILABLE');
 const a = Math.cos(phi) * Math.cos(theta);
 const b = Math.cos(phi) * Math.sin(theta) * Math.cos(eps) + Math.sin(phi) * Math.sin(eps);
 const norm = Math.hypot(a, b);
 if (norm <= 1e-6) fail('LAGNA_UNAVAILABLE');
 // At theta=0,phi=0 the east horizon is lambda=90, not the western 270.
 const lambda = Math.atan2(a, -b), c = Math.cos(lambda), s = Math.sin(lambda);
 const equatorial = [c, s * Math.cos(eps), s * Math.sin(eps)];
 const horizonResidual = a * c + b * s;
 const eastProjection = -Math.sin(theta) * equatorial[0] + Math.cos(theta) * equatorial[1];
 if (eastProjection <= 1e-6 || Math.abs(horizonResidual) > 1e-10) fail('LAGNA_UNAVAILABLE');
 return freeze({tropicalLongitude: normalizeDegrees(lambda / DEG), latitude: input.latitude,
  localApparentDegrees: normalizeDegrees(input.localApparentDegrees), trueObliquityDegrees: input.trueObliquityDegrees,
  horizonResidual, eastProjection, geometryNorm: norm,
  // |d lambda/d theta| <= |v'|/|v| <= cos(phi)/cos(|phi|+eps).
  longitudeSensitivityUpperBound: Math.cos(phi) / minimumNorm});
}

export function lagnaAtInstant(input) {
 fields(input, ['timeScale', 'julianDay', 'utcInstant', 'latitude', 'longitude', 'elevationMetres', 'calculationProfileId']);
 if (input.calculationProfileId !== siderealProfile.id) fail('MODEL_UNAVAILABLE');
 const elevation = Object.hasOwn(input, 'elevationMetres') ? input.elevationMetres : 0;
 if (typeof elevation !== 'number' || !Number.isFinite(elevation) || elevation < -500 || elevation > 9000) fail();
 const timeInput = {timeScale: input.timeScale, longitude: input.longitude};
 for (const key of ['julianDay', 'utcInstant']) if (Object.hasOwn(input, key)) timeInput[key] = input[key];
 const siderealTime = localSiderealTime(timeInput), jd = siderealTime.time.ttJulianDay;
 const trueObliquityDegrees = (meanObliquity1980(jd) + nutation1980(jd).obliquityRadians) / DEG;
 const geometry = ascendantGeometry({latitude: input.latitude,
  localApparentDegrees: siderealTime.localApparentDegrees, trueObliquityDegrees});
 const ayanamsha = lahiriAyanamsha(jd);
 const siderealLongitude = normalizeDegrees(geometry.tropicalLongitude - ayanamsha.trueDegrees);
 const classification = classifySidereal(siderealLongitude), distances = sectorBoundaryDistances(siderealLongitude);
 const nearBoundary = distances.rashiArcsec <= 61;
 return freeze({contractVersion: 'vedic-lagna-1', model: lagnaModel, time: siderealTime.time,
  observer: {latitude: input.latitude, longitude: input.longitude, elevationMetres: elevation},
  siderealTime, geometry, ayanamsha, tropicalLongitude: geometry.tropicalLongitude,
  siderealLongitude, ...classification, boundaryDistances: distances, nearBoundary,
  screeningGuardArcsec: 61, birthTimeStability: 'not-evaluated',
  warnings: [...new Set([...siderealTime.warnings, 'INTERNAL_CANDIDATE_NOT_PRODUCTION_VALIDATED',
   'LAGNA_INDEPENDENT_REFERENCE_ACCEPTANCE_PENDING', 'BIRTH_TIME_STABILITY_NOT_EVALUATED',
   'GEOMETRIC_HORIZON_NO_REFRACTION_OR_TERRAIN',
   ...(nearBoundary ? ['LAGNA_NEAR_MODEL_BOUNDARY'] : []),
   ...(!Object.hasOwn(input, 'elevationMetres') ? ['SEA_LEVEL_ASSUMED'] : [])])]});
}
