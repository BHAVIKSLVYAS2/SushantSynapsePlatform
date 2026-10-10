export const cast=[
 {id:'namo-nimbus',name:'Namo Nimbus',tag:'THE GRAND SHOWMAN',copy:'Every entrance deserves a drumroll.',portrait:0},
 {id:'rally-rohan',name:'Rally Rohan',tag:'THE ETERNAL CAMPAIGNER',copy:'One more rally. One more comeback.',portrait:1},
 {id:'muffler-mohan',name:'Muffler Mohan',tag:'THE CITY FIXER',copy:'Big promises. Bigger scarf.',portrait:2},
 {id:'briefcase-babu',name:'Briefcase Babu',tag:'THE PAPERWORK CHAMPION',copy:'A committee for every committee.',portrait:3},
 {id:'drumroll-didi',name:'Drumroll Didi',tag:'THE STREET-SMART SPEAKER',copy:'Small microphone. Stadium-sized confidence.',portrait:4},
 {id:'coalition-chacha',name:'Coalition Chacha',tag:'THE ALLIANCE ARTIST',copy:'New friends. Same favourite chair.',portrait:5}
];
export const reactions=[{id:'garland',icon:'🌼',name:'Garland',side:'fans'},{id:'applause',icon:'👏',name:'Applause',side:'fans'},{id:'shoe',icon:'👟',name:'Shoe',side:'critics'},{id:'finger',icon:'🖕',name:'Middle finger',side:'critics'},{id:'tomato',icon:'🍅',name:'Tomato',side:'critics'},{id:'laugh',icon:'😂',name:'Just laughing',side:'amused'}];
export function tally(scores){const totals={fans:0,critics:0,amused:0};for(const score of scores||[])for(const reaction of reactions)totals[reaction.side]+=score[reaction.id]||0;return totals;}
