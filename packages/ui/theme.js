'use strict';
window.SynapseTheme={
 read(){return localStorage.getItem('synapse-theme')||localStorage.getItem('chambers-theme')||'system';},
 write(value){localStorage.setItem('synapse-theme',value);localStorage.setItem('chambers-theme',value);}
};
