import {mountMatching} from '../frontend/rulebook-view.mjs';
mountMatching(document.querySelector('#matching-app'));
document.querySelector('#theme').value=window.SynapseTheme.preference();
document.querySelector('#theme').addEventListener('change',event=>window.SynapseTheme.write(event.target.value,true));
