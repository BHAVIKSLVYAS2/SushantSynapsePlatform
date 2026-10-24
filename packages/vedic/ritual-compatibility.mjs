import {AstroTime,MoonPhase} from './vendor/astronomy-engine-2.1.19.mjs';
import {panchangSnapshot} from './panchang.mjs';
import {fields,fail,freeze} from './diagnostics.mjs';
export const ritualCompatibilityPolicy=freeze({id:'ritual-shared-engine-distinct-profiles-v1',engineVersion:'2.1.19',
 engineSha256:'6257fd34e7a74370767a98bf26d1724d748e5f71c1530be6730ff21336cc6607',
 shared:'identical pinned Astronomy Engine implementation only',
 legacy:'Ritual IST/Date-to-TT model, upstream MoonPhase/GeoMoon special case, Spica month labels, five-minute/Aparahna rules',
 candidate:'Vedic explicit UTC/TT and leap policy, backdated apparent Moon, versioned Lahiri, separate birth/sunrise admission',
 profileEquivalent:false,calendarSubstitution:'blocked; do not substitute birthdays, mourning dates or regional rules'});
export function auditRitualCompatibility(input){
 fields(input,['utcInstant','calculationProfileId']);if(input.calculationProfileId!=='IN_LAHIRI_DEFAULT_V1')fail('MODEL_UNAVAILABLE');
 const candidate=panchangSnapshot({timeScale:'UTC',utcInstant:input.utcInstant,calculationProfileId:input.calculationProfileId}),legacyTime=new AstroTime(new Date(candidate.time.utcInstant)),legacyElongation=MoonPhase(legacyTime);
 const aligned=panchangSnapshot({timeScale:'TT',julianDay:2451545+legacyTime.tt,calculationProfileId:input.calculationProfileId});
 const difference=(a,b)=>((a-b+540)%360-180)*3600;
 return freeze({policy:ritualCompatibilityPolicy,utcInstant:candidate.time.utcInstant,
  legacy:{elongation:legacyElongation,tithi:Math.floor(legacyElongation/12)+1,ttJulianDay:2451545+legacyTime.tt},
  candidate:{elongation:candidate.angles.tithi,tithi:candidate.limbs.tithi.number,ttJulianDay:candidate.time.ttJulianDay},
  sameUtcDifferenceArcsec:difference(candidate.angles.tithi,legacyElongation),
  alignedTtDifferenceArcsec:difference(aligned.angles.tithi,legacyElongation),
  timeModelDifferenceSeconds:(candidate.time.ttJulianDay-(2451545+legacyTime.tt))*86400,
  acceptance:'not-equivalent-profiles; measured differences are diagnostics, not tolerance approval'});
}
