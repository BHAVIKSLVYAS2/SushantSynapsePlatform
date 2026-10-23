import {parodyCast} from './personas.mjs';
// Separate module retained for existing imports; all fictional copy has one owner.
export const spotlightCast=parodyCast.filter(c=>c.arena==='actors'||c.arena==='corporates');
