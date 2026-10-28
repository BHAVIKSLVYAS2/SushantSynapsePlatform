import directory from './data/india-places.json' with {type: 'json'};
import {fail, fields, freeze} from './diagnostics.mjs';

freeze(directory);
const entries = directory.places;
const byId = new Map(entries.map(place => [place.id, place]));
const normalize = value => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
 .toLowerCase().trim().replace(/\s+/g, ' ');
// Displaying a saved/default place does not need a normalized search index.
// Construct it once, on the first actual name lookup.
let index;
const searchIndex = () => index ??= entries.map(place => ({place,
 names: [...new Set([place.name, ...place.aliases].map(normalize))],
 text: normalize([place.name, ...place.aliases, place.state, place.stateCode, 'India'].join(' '))}));

export const placeDirectory = freeze({version: directory.version, count: entries.length,
 source: directory.source, retrieved: directory.retrieved, license: directory.license,
 coverage: directory.coverage, sourceSha256: directory.sourceSha256});

export function validateCoordinates(latitude, longitude) {
 if (typeof latitude !== 'number' || !Number.isFinite(latitude) || latitude < -90 || latitude > 90
  || typeof longitude !== 'number' || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) fail();
 return freeze({latitude, longitude});
}
function queryText(value) {
 if (typeof value !== 'string' || value.length > 100 || /[\u0000-\u001f\u007f]/.test(value)) fail();
 return normalize(value);
}
function options(input) {
 fields(input, ['limit', 'stateCode']);
 const {limit = 10, stateCode} = input;
 if (!Number.isInteger(limit) || limit < 1 || limit > 20) fail();
 if (stateCode !== undefined && (typeof stateCode !== 'string' || !/^IN\.\d{2}$/.test(stateCode))) fail();
 return {limit, stateCode};
}
export function getPlace(placeId) {
 if (typeof placeId !== 'string' || !/^geonames:[1-9]\d{0,11}$/.test(placeId)) fail('UNKNOWN_PLACE');
 const place = byId.get(placeId);
 if (!place) fail('UNKNOWN_PLACE');
 validateCoordinates(place.latitude, place.longitude);
 if (place.countryCode !== 'IN') fail('UNSUPPORTED_PLACE');
 if (place.timeZoneId !== 'Asia/Kolkata') fail('UNSUPPORTED_TIMEZONE');
 return freeze({...place, aliases: [...place.aliases], label: `${place.name}, ${place.state}, India`,
  coordinatePrecision: 'approximate-settlement-point', sourceVersion: directory.version,
  source: directory.source, license: directory.license, sourceSha256: directory.sourceSha256});
}
export function searchPlaces(query, input = {}) {
 const text = queryText(query), {limit, stateCode} = options(input);
 if (text.length < 2) return freeze({matches: [], total: 0, truncated: false});
 const tokens = text.split(' ');
 const matches = searchIndex().filter(entry => (!stateCode || entry.place.stateCode === stateCode)
  && tokens.every(token => entry.text.includes(token)));
 matches.sort((a, b) => Number(normalize(b.place.name) === text) - Number(normalize(a.place.name) === text)
  || Number(b.names.includes(text)) - Number(a.names.includes(text))
  || b.place.population - a.place.population || (a.place.id < b.place.id ? -1 : a.place.id > b.place.id ? 1 : 0));
 return freeze({matches: matches.slice(0, limit).map(entry => getPlace(entry.place.id)),
  total: matches.length, truncated: matches.length > limit});
}
// Convenience lookup never chooses the largest/nearest entry when names collide.
export function resolvePlaceName(name, input = {}) {
 const text = queryText(name), {stateCode} = options(input);
 if (text.length < 2) fail('UNKNOWN_PLACE');
 const matches = searchIndex().filter(entry => (!stateCode || entry.place.stateCode === stateCode)
  && entry.names.includes(text));
 if (!matches.length) fail('UNKNOWN_PLACE');
 if (matches.length > 1) fail('AMBIGUOUS_PLACE');
 return getPlace(matches[0].place.id);
}
