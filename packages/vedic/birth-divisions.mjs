import {birthChartForBirth} from './birth-chart.mjs';
import {d9ChartAtInstant, navamsaForLongitude} from './d9.mjs';
import {fail, freeze} from './diagnostics.mjs';

// P06 exact-time/place admission plus a stricter divisional-boundary screen.
export function birthChartsForBirth(input, context) {
 const base = birthChartForBirth(input, context), d1 = base.chart;
 const lagnaDistance = navamsaForLongitude(d1.ascendant.siderealLongitude).boundaryDistanceArcsec;
 if (lagnaDistance <= base.minuteResolutionScreen.lagnaGuardArcsec
  || d1.planets.some(p => navamsaForLongitude(p.siderealLongitude).boundaryDistanceArcsec
   <= base.minuteResolutionScreen.planetGuardArcsec)) fail('UNSTABLE_BIRTH_TIME');
 const birth = base.birth;
 const d9 = d9ChartAtInstant({timeScale: 'UTC', utcInstant: birth.utcInstant,
  latitude: birth.place.latitude, longitude: birth.place.longitude,
  elevationMetres: birth.place.elevationMetres, calculationProfileId: birth.calculationProfileId});
 return freeze({birth, d1, d9, minuteResolutionScreen: {...base.minuteResolutionScreen,
  scope: 'D1-sign-and-D9-division-boundaries'},
  warnings: [...new Set([...base.warnings, ...d9.warnings])]});
}
