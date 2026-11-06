import {sparkMarkup} from './view.mjs';
import {mountSpark} from './play.mjs';
const button=document.querySelector('#theme');
button.outerHTML=SynapseTheme.control('id="theme"');
function theme(){document.documentElement.dataset.theme=SynapseTheme.read();}
document.querySelector('#theme').addEventListener('change',theme);theme();
const root=document.querySelector('#spark-root');root.innerHTML=sparkMarkup;mountSpark(root);
