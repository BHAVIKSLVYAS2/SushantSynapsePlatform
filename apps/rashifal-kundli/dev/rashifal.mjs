import {mountRashifal} from '../frontend/rashifal-view.mjs';
mountRashifal(document.querySelector('#rashifal-app'));
document.querySelector('#theme').value=window.SynapseTheme.read();
document.querySelector('#theme').addEventListener('change',event=>window.SynapseTheme.write(event.target.value));
