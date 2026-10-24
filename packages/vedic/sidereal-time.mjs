/*! @license BSD-3-Clause
 * Sidereal-time equations adapted from ERFA 2.0.1, derived from SOFA.
 * Copyright (C) 2013-2023 NumFOCUS Foundation. All rights reserved.
 * Full terms/notices: data/sources/erfa-2.0.1/LICENSE and source headers.
 * This adaptation is not SOFA itself. No Swiss Ephemeris code is included.
 */
import {DEG, ARCSEC, nutation1980, meanObliquity1980} from './iau1976.mjs';
import {J2000, astronomyCoverage, resolveAstronomyTime} from './astronomy-time.mjs';
import {normalizeDegrees} from './angles.mjs';
import {fields, fail, freeze} from './diagnostics.mjs';

export function greenwichMeanSidereal1982(ut1JulianDay) {
 if (typeof ut1JulianDay !== 'number' || !Number.isFinite(ut1JulianDay)) fail();
 if (ut1JulianDay < astronomyCoverage.startJulianDay - 1
  || ut1JulianDay > astronomyCoverage.endJulianDay + 1) fail('OUT_OF_RANGE');
 const t = (ut1JulianDay - J2000) / 36525;
 const seconds = 24110.54841 - 43200
  + (8640184.812866 + (0.093104 - 0.0000062 * t) * t) * t
  + (ut1JulianDay % 1) * 86400;
 return normalizeDegrees(seconds / 240);
}

export function equationEquinoxes1994(ttJulianDay) {
 const nutation = nutation1980(ttJulianDay), eps = meanObliquity1980(ttJulianDay);
 const t = (ttJulianDay - J2000) / 36525;
 // Original IAU1980 node argument, not the different IERS2003 mean-node model.
 const omega = (450160.280 + (-482890.539 + (7.455 + 0.008 * t) * t) * t) * ARCSEC
  + (-5 * t % 1) * 2 * Math.PI;
 return nutation.longitudeRadians * Math.cos(eps)
  + ARCSEC * (0.00264 * Math.sin(omega) + 0.000063 * Math.sin(2 * omega));
}

export function localSiderealTime(input) {
 fields(input, ['timeScale', 'julianDay', 'utcInstant', 'longitude']);
 if (typeof input.longitude !== 'number' || !Number.isFinite(input.longitude) || Math.abs(input.longitude) > 180) fail();
 const timeInput = {timeScale: input.timeScale};
 for (const key of ['julianDay', 'utcInstant']) if (Object.hasOwn(input, key)) timeInput[key] = input[key];
 const time = resolveAstronomyTime(timeInput);
 const gmst = greenwichMeanSidereal1982(time.ut1JulianDayModelled);
 const equationDegrees = equationEquinoxes1994(time.ttJulianDay) / DEG;
 const gast = normalizeDegrees(gmst + equationDegrees);
 return freeze({time, greenwichMeanDegrees: gmst, greenwichApparentDegrees: gast,
  localApparentDegrees: normalizeDegrees(gast + input.longitude), equationEquinoxesDegrees: equationDegrees,
  model: 'IAU1982-GMST-plus-IAU1994-equation-equinoxes-TT-v1',
  longitudeConvention: 'east-positive',
  warnings: [...time.warnings, 'EQUATION_EQUINOXES_TT_FOR_TDB_APPROXIMATION']});
}
