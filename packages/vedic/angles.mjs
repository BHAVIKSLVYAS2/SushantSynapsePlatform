import {fail, freeze} from './diagnostics.mjs';

export function normalizeDegrees(value) {
 if (typeof value !== 'number' || !Number.isFinite(value)) fail();
 const remainder = value % 360;
 if (remainder === 0) return 0;
 if (remainder > 0) return remainder;
 const adjusted = remainder + 360;
 // Negative sub-ULP angles cannot round to 360 in the half-open output domain.
 return adjusted === 360 ? 359.99999999999994 : adjusted;
}
const boundaries = count => Object.freeze(Array.from({length: count + 1}, (_, i) => i * 360 / count));
const signs = boundaries(12), quarters = boundaries(108);
function sector(longitude, starts) {
 let low = 0, high = starts.length - 1;
 while (high - low > 1) {
  const middle = (low + high) >> 1;
  if (longitude < starts[middle]) high = middle; else low = middle;
 }
 return low;
}

// Exact classification of the supplied floating-point angle, not a stability claim.
export function classifySidereal(value) {
 const longitude = normalizeDegrees(value), sign = sector(longitude, signs), quarter = sector(longitude, quarters);
 return freeze({longitude, rashi: sign + 1, degreeWithinRashi: longitude - signs[sign],
  nakshatra: Math.floor(quarter / 4) + 1, pada: quarter % 4 + 1,
  angularPrecision: 'nominal-unrounded-input', boundaryConvention: '[start,end)'});
}
export function sectorBoundaryDistances(value) {
 const longitude = normalizeDegrees(value), s = sector(longitude, signs), q = sector(longitude, quarters);
 const n = Math.floor(q / 4) * 4;
 return freeze({rashiArcsec: Math.min(longitude - signs[s], signs[s + 1] - longitude) * 3600,
  nakshatraArcsec: Math.min(longitude - quarters[n], quarters[n + 4] - longitude) * 3600,
  padaArcsec: Math.min(longitude - quarters[q], quarters[q + 1] - longitude) * 3600});
}
