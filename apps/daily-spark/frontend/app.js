import {sparkMarkup} from './view.mjs';
import {mountSpark} from './play.mjs';
const media=matchMedia('(prefers-color-scheme: dark)'),button=document.querySelector('#theme');
button.outerHTML=SynapseTheme.control('id="theme"');
function theme(){const preference=SynapseTheme.read();document.documentElement.dataset.theme=preference==='system'?(media.matches?'dark':'light'):preference;}
document.querySelector('#theme').addEventListener('change',theme);media.addEventListener('change',theme);theme();
const root=document.querySelector('#spark-root');root.innerHTML=sparkMarkup;mountSpark(root);
