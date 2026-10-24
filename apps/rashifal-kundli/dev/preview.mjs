import {divisionalChartsAtInstant} from '../../../packages/vedic/d9.mjs';
import {mountCharts} from '../frontend/chart-view.mjs';
export {mountCharts};
const charts=divisionalChartsAtInstant({timeScale:'UTC',utcInstant:'2000-01-01T06:30:00Z',
 latitude:28.6139,longitude:77.209,calculationProfileId:'IN_LAHIRI_DEFAULT_V1'});
mountCharts(document.querySelector('#charts'),charts);
document.querySelector('#theme').value=window.SynapseTheme.read();
document.querySelector('#theme').addEventListener('change',event=>window.SynapseTheme.write(event.target.value));
