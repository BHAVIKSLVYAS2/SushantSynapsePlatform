import {DEG, precession1976, meanObliquity1980, nutation1980, multiply, transpose, longitudeOf} from './iau1976.mjs';
import {engineTime} from './astronomy-time.mjs';
import {normalizeDegrees} from './angles.mjs';
import {freeze} from './diagnostics.mjs';

const anchorTT = 2435553.5;
const anchorTrue = 23 + 15 / 60 + 0.658 / 3600;
const anchorMean = anchorTrue - nutation1980(anchorTT).longitudeRadians / DEG;
const anchorPrecession = precession1976(anchorTT);
const eps = meanObliquity1980(anchorTT);

export const ayanamshaModel = freeze({id: 'lahiri-iae1985-iau1976-1980-v1',
 anchorTTJulianDay: anchorTT, anchorTrueDegrees: anchorTrue, anchorMeanDegrees: anchorMean,
 precession: 'IAU1976', obliquity: 'IAU1980', nutation: 'IAU1980-106-terms',
 definition: 'Revised IAE post-1985 true anchor; traditional longitude subtraction',
 source: 'https://www.astro.com/swisseph/swisseph.htm',
 releaseStatus: 'internal-candidate-independent-IAE-review-pending'});

export function lahiriAyanamsha(ttJulianDay) {
 engineTime(ttJulianDay);
 // Transport the date's mean equinox to the anchor mean ecliptic; its westward
 // displacement is subtracted from the anchor mean ayanamsha. No linear drift.
 const equinoxJ2000 = multiply(transpose(precession1976(ttJulianDay)), [1, 0, 0]);
 const inAnchorEquator = multiply(anchorPrecession, equinoxJ2000);
 const inAnchorEcliptic = [inAnchorEquator[0],
  Math.cos(eps) * inAnchorEquator[1] + Math.sin(eps) * inAnchorEquator[2],
  -Math.sin(eps) * inAnchorEquator[1] + Math.cos(eps) * inAnchorEquator[2]];
 const longitude = longitudeOf(inAnchorEcliptic);
 const signed = longitude > 180 ? longitude - 360 : longitude;
 const meanDegrees = normalizeDegrees(anchorMean - signed);
 const nutationDegrees = nutation1980(ttJulianDay).longitudeRadians / DEG;
 return freeze({ttJulianDay, model: ayanamshaModel, meanDegrees,
  trueDegrees: normalizeDegrees(meanDegrees + nutationDegrees), nutationDegrees});
}
