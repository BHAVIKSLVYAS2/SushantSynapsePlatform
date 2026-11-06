import {mountBirthApp} from '../frontend/birth-app.mjs';
mountBirthApp(document.querySelector('#birth-app'));
document.querySelector('#theme').value=window.SynapseTheme.preference();
document.querySelector('#theme').addEventListener('change',event=>window.SynapseTheme.write(event.target.value,true));
