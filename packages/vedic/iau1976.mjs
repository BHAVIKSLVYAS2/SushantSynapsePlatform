/*! @license BSD-3-Clause
 * Equations/series adapted from ERFA 2.0.1, derived from SOFA.
 * Copyright (C) 2013-2023 NumFOCUS Foundation. All rights reserved.
 * Full terms/notices: data/sources/erfa-2.0.1/LICENSE and retained source headers.
 * This adaptation is not SOFA itself. No Swiss Ephemeris code is included.
 */
import nutationData from './data/iau1980-nutation.json' with {type: 'json'};
import {engineTime, J2000} from './astronomy-time.mjs';
import {normalizeDegrees} from './angles.mjs';
import {fail, freeze} from './diagnostics.mjs';

export const DEG = Math.PI / 180, ARCSEC = DEG / 3600;
const TAU = 2 * Math.PI;
function centuries(jd) { engineTime(jd); return (jd - J2000) / 36525; }
export function multiply(matrix, vector) { return matrix.map(row => row.reduce((sum, value, i) => sum + value * vector[i], 0)); }
export function transpose(matrix) { return matrix[0].map((_, i) => matrix.map(row => row[i])); }
function product(a, b) { return a.map(row => transpose(b).map(column => row.reduce((sum, x, i) => sum + x * column[i], 0))); }
// Passive coordinate rotations, same sense as the retained ERFA references.
const rx = a => [[1, 0, 0], [0, Math.cos(a), Math.sin(a)], [0, -Math.sin(a), Math.cos(a)]];
const ry = a => [[Math.cos(a), 0, -Math.sin(a)], [0, 1, 0], [Math.sin(a), 0, Math.cos(a)]];
const rz = a => [[Math.cos(a), Math.sin(a), 0], [-Math.sin(a), Math.cos(a), 0], [0, 0, 1]];

export function precession1976(jd) {
 const t = centuries(jd);
 const zeta = (2306.2181 + (0.30188 + 0.017998 * t) * t) * t * ARCSEC;
 const z = (2306.2181 + (1.09468 + 0.018203 * t) * t) * t * ARCSEC;
 const theta = (2004.3109 + (-0.42665 - 0.041833 * t) * t) * t * ARCSEC;
 return freeze(product(rz(-z), product(ry(theta), rz(-zeta))));
}
export function meanObliquity1980(jd) {
 const t = centuries(jd);
 return (84381.448 + (-46.8150 + (-0.00059 + 0.001813 * t) * t) * t) * ARCSEC;
}
export function nutation1980(jd) {
 const t = centuries(jd);
 if (nutationData.terms.length !== 106) fail('MODEL_UNAVAILABLE');
 const args = [
  (485866.733 + (715922.633 + (31.310 + 0.064 * t) * t) * t) * ARCSEC + (1325 * t % 1) * TAU,
  (1287099.804 + (1292581.224 + (-0.577 - 0.012 * t) * t) * t) * ARCSEC + (99 * t % 1) * TAU,
  (335778.877 + (295263.137 + (-13.257 + 0.011 * t) * t) * t) * ARCSEC + (1342 * t % 1) * TAU,
  (1072261.307 + (1105601.328 + (-6.891 + 0.019 * t) * t) * t) * ARCSEC + (1236 * t % 1) * TAU,
  (450160.280 + (-482890.539 + (7.455 + 0.008 * t) * t) * t) * ARCSEC + (-5 * t % 1) * TAU
 ].map(a => a % TAU);
 let longitude = 0, obliquity = 0;
 for (let i = nutationData.terms.length - 1; i >= 0; i--) {
  const row = nutationData.terms[i];
  const angle = row.slice(0, 5).reduce((sum, multiple, j) => sum + multiple * args[j], 0);
  longitude += (row[5] + row[6] * t) * Math.sin(angle);
  obliquity += (row[7] + row[8] * t) * Math.cos(angle);
 }
 return freeze({longitudeRadians: longitude * ARCSEC / 10000, obliquityRadians: obliquity * ARCSEC / 10000});
}
export function meanEcliptic1976(vector, jd) {
 if (!Array.isArray(vector) || vector.length !== 3 || !vector.every(value => typeof value === 'number' && Number.isFinite(value))
  || Math.hypot(...vector) === 0) fail();
 const equatorial = multiply(precession1976(jd), vector);
 return multiply(rx(meanObliquity1980(jd)), equatorial);
}
export function longitudeOf(vector) { return normalizeDegrees(Math.atan2(vector[1], vector[0]) / DEG); }
export function meanLunarNode2003(jd) {
 const t = centuries(jd);
 return normalizeDegrees((450160.398036 + t * (-6962890.5431 + t * (7.4722 + t * (0.007702 - 0.00005939 * t)))) / 3600);
}
