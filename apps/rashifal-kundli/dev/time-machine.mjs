import {mountTimeMachine} from '../frontend/time-machine-view.mjs';
mountTimeMachine(document.querySelector('#time-machine-app'));
document.querySelector('#theme').value=window.SynapseTheme.read();
document.querySelector('#theme').addEventListener('change',event=>window.SynapseTheme.write(event.target.value));
