import {cast as cards} from './cast.mjs';
import {parodyCast} from './personas.mjs';
// Full catalogue for server-rendered profiles and backend validation.
export const cast=cards.map(card=>parodyCast.find(c=>c.id===card.id)||card);
export {arenas,portraitArt,inkpot,reactions,tally} from './cast.mjs';
