import {normalizeInput} from './normalize.mjs';
import {d1ChartAtInstant} from './d1.mjs';
import {DEG} from './iau1976.mjs';
import {fail, freeze} from './diagnostics.mjs';

// The P02 place/civil/future admission boundary stays separate from pure geometry.
export function birthChartForBirth(input, context) {
 const birth = normalizeInput(input, context);
 if (birth.timeAccuracy !== 'exact' || !birth.utcInstant) fail('UNSTABLE_BIRTH_TIME');
 const chart = d1ChartAtInstant({timeScale: 'UTC', utcInstant: birth.utcInstant,
  latitude: birth.place.latitude, longitude: birth.place.longitude,
  elevationMetres: birth.place.elevationMetres, calculationProfileId: birth.calculationProfileId});
 // HH:mm is minute resolution. Apply a deliberately conservative two-sided
 // angular screen, not an endpoint-only or P14 stability claim. For any true
 // obliquity <=26deg, the geometry derivative is bounded by this ratio.
 const phi = Math.abs(birth.place.latitude) * DEG;
 const minimumNorm = Math.cos(phi + 26 * DEG);
 if (minimumNorm <= 1e-6) fail('UNSTABLE_BIRTH_TIME');
 const lagnaGuardArcsec = 61 + Math.cos(phi) / minimumNorm * (361 / 1440) * 3600;
 // Physical positions move <24deg/day in this profile; 60s is <=60 arcseconds.
 // Targets remain proposed screens, not certified physical/model error bounds.
 const planetGuardArcsec = 121;
 if (chart.ascendant.boundaryDistances.rashiArcsec <= lagnaGuardArcsec
  || chart.planets.some(position => position.boundaryDistances.rashiArcsec <= planetGuardArcsec)) fail('UNSTABLE_BIRTH_TIME');
 return freeze({birth, chart, minuteResolutionScreen: {status: 'outside-conservative-sign-boundary-screen',
  lagnaGuardArcsec, planetGuardArcsec, inputResolutionSeconds: 60,
  meaning: 'nominal screening under proposed model targets, not certified birth-time stability'},
  warnings: [...new Set([...birth.warnings, ...chart.warnings, 'MINUTE_RESOLUTION_CONSERVATIVE_SCREEN_ONLY'])]});
}
