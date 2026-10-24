import {normalizeInput} from './normalize.mjs';
import {siderealSnapshot} from './sidereal.mjs';
import {fail, freeze} from './diagnostics.mjs';

// Separate bridge keeps the large place directory out of astronomy-only bundles.
export function siderealForBirth(input, context) {
 const birth = normalizeInput(input, context);
 if (birth.timeAccuracy !== 'exact' || !birth.utcInstant) fail('UNSTABLE_BIRTH_TIME');
 const sidereal = siderealSnapshot({timeScale: 'UTC', utcInstant: birth.utcInstant,
  calculationProfileId: birth.calculationProfileId});
 return freeze({birth, sidereal, warnings: [...new Set([...birth.warnings, ...sidereal.warnings])]});
}
