export const cast=[
 {id:'namo-nimbus',name:'Namo Nimbus',tag:'THE GRAND SHOWMAN',copy:'Every entrance deserves a drumroll.',portrait:0},
 {id:'rally-rohan',name:'Rally Rohan',tag:'THE ETERNAL CAMPAIGNER',copy:'One more rally. One more comeback.',portrait:1},
 {id:'muffler-mohan',name:'Muffler Mohan',tag:'THE CITY FIXER',copy:'Big promises. Bigger scarf.',portrait:2},
 {id:'briefcase-babu',name:'Briefcase Babu',tag:'THE PAPERWORK CHAMPION',copy:'A committee for every committee.',portrait:3},
 {id:'drumroll-didi',name:'Drumroll Didi',tag:'THE STREET-SMART SPEAKER',copy:'Small microphone. Stadium-sized confidence.',portrait:4},
 {id:'coalition-chacha',name:'Coalition Chacha',tag:'THE ALLIANCE ARTIST',copy:'New friends. Same favourite chair.',portrait:5},
 {id:'saffron-sage',name:'Saffron Sage',tag:'THE SERIOUS SMILER',copy:'A calm face. A dramatic entrance.',portrait:6},
 {id:'cycle-captain',name:'Cycle Captain',tag:'THE COMEBACK RIDER',copy:'Every detour deserves another lap.',portrait:7},
 {id:'lexicon-lord',name:'Lexicon Lord',tag:'THE WORDPLAY WIZARD',copy:'Why use one word when twelve will do?',portrait:8},
 {id:'highway-hari',name:'Highway Hari',tag:'THE DETOUR DREAMER',copy:'One more lane. One more ribbon.',portrait:9},
 {id:'budget-beena',name:'Budget Beena',tag:'THE BUDGET BOSS',copy:'Every penny gets a speech.',portrait:10},
 {id:'rally-raja',name:'Rally Raja',tag:'THE COMEBACK CAPTAIN',copy:'One more rally. Another innings.',portrait:11},
 {id:'debate-dastan',name:'Debate Dastan',tag:'THE DEBATE MAESTRO',copy:'A pause is just another argument.',portrait:12}
];
export const inkpot='<svg class="inkpot-icon" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path class="inkpot-quill" d="M18 16 22 5 30 2 27 10 18 18Z"/><path class="inkpot-body" d="M9 13h12v4l4 3v8a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-8l4-3Z"/><rect class="inkpot-cap" x="8" y="11" width="14" height="5" rx="1.5"/><path class="inkpot-shine" d="M9 22v4m3-5h7"/></svg>';
export const reactions=[{id:'garland',icon:'🌼',name:'Garland',side:'fans'},{id:'applause',icon:'👏',name:'Applause',side:'fans'},{id:'shoe',icon:'👟',name:'Shoe',side:'critics'},{id:'finger',icon:inkpot,name:'Throw ink',side:'critics'},{id:'tomato',icon:'🍅',name:'Tomato',side:'critics'},{id:'laugh',icon:'😂',name:'Just laughing',side:'amused'}];
export function tally(scores){const totals={fans:0,critics:0,amused:0};for(const score of scores||[])for(const reaction of reactions)totals[reaction.side]+=score[reaction.id]||0;return totals;}
