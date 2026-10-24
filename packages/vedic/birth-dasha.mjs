import {normalizeInput} from './normalize.mjs';
import {siderealSnapshot} from './sidereal.mjs';
import {vimshottariTimeline, vimshottariModel} from './dasha.mjs';
import {fail, fields, freeze} from './diagnostics.mjs';

export function vimshottariForBirth(input, context, options = {}) {
 fields(options, ['atUtcInstant', 'yearConventionId']);
 const birth = normalizeInput(input, context);
 if (birth.timeAccuracy !== 'exact' || !birth.utcInstant) fail('UNSTABLE_BIRTH_TIME');
 const moon = siderealSnapshot({timeScale: 'UTC', utcInstant: birth.utcInstant,
  bodies: ['Moon'], calculationProfileId: birth.calculationProfileId});
 // A minute-resolution Moon can cross a Nakshatra edge even when its nominal
 // instant is exact. Conservative 24deg/day allowance + proposed 61arcsec guard.
 if (moon.positions[0].boundaryDistances.nakshatraArcsec <= 121) fail('UNSTABLE_BIRTH_TIME');
 let atUtcInstant;
 if (Object.hasOwn(options, 'atUtcInstant')) atUtcInstant = options.atUtcInstant;
 else {
  if (!context || !Number.isSafeInteger(context.now) || Math.abs(context.now) > 8640000000000000) fail();
  atUtcInstant = new Date(context.now).toISOString();
 }
 const timeline = vimshottariTimeline({birthUtcInstant: birth.utcInstant,
  moonSiderealLongitude: moon.positions[0].siderealLongitude, calculationProfileId: birth.calculationProfileId,
  timeZoneId: birth.timeZoneId, yearConventionId: Object.hasOwn(options, 'yearConventionId')
   ? options.yearConventionId : vimshottariModel.yearConventionId, atUtcInstant});
 return freeze({birth, moon, timeline, minuteResolutionScreen: {nakshatraGuardArcsec: 121,
  meaning: 'starting-lord boundary screen, not certified period-date accuracy or P14 stability'},
  warnings: [...new Set([...birth.warnings, ...moon.warnings, ...timeline.warnings, 'DASHA_DATES_SENSITIVE_TO_BIRTH_MOON_PRECISION'])]});
}
