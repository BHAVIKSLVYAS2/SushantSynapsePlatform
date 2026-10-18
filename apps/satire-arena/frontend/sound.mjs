let audio,noise;
const active=new Set();
export function prepareSound(){
 try{const Context=window.AudioContext||window.webkitAudioContext;if(!Context)return;if(!audio||audio.state==='closed'){audio=new Context({latencyHint:'interactive'});noise=audio.createBuffer(1,audio.sampleRate,audio.sampleRate);const samples=noise.getChannelData(0);for(let i=0;i<samples.length;i++)samples[i]=Math.random()*2-1;}if(audio.state==='suspended')audio.resume().catch(()=>{});}catch{/* Audio support is optional. */}
}
export function stopSound(){for(const oscillator of active){try{oscillator.stop();}catch{}}active.clear();}
function envelope(start,duration,volume){const gain=audio.createGain();gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(volume,start+.006);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);gain.connect(audio.destination);return gain;}
function track(source,nodes,start,duration){active.add(source);source.onended=()=>{active.delete(source);source.disconnect();nodes.forEach(node=>node.disconnect());};source.start(start);source.stop(start+duration+.01);}
function tone(start,duration,from,to,volume,type='sine',voice=false){
 const source=audio.createOscillator(),gain=envelope(start,duration,volume);source.type=type;source.frequency.setValueAtTime(from,start);source.frequency.exponentialRampToValueAtTime(to,start+duration);
 const nodes=[gain];if(voice){const filter=audio.createBiquadFilter();filter.type='bandpass';filter.frequency.value=850;filter.Q.value=1.2;source.connect(filter);filter.connect(gain);nodes.push(filter);}else source.connect(gain);
 track(source,nodes,start,duration);
}
function hiss(start,duration,frequency,volume,filterType='bandpass',end=frequency){
 const source=audio.createBufferSource(),filter=audio.createBiquadFilter(),gain=envelope(start,duration,volume);source.buffer=noise;filter.type=filterType;filter.frequency.setValueAtTime(frequency,start);filter.frequency.exponentialRampToValueAtTime(end,start+duration);filter.Q.value=.7;source.connect(filter);filter.connect(gain);track(source,[filter,gain],start,duration);
}
export function playSound(reaction){
 if(document.hidden||!audio||audio.state==='closed')return;
 stopSound();const now=audio.currentTime;
 // Schedule on the tap, including while resume() unlocks a suspended context.
 try{switch(reaction){
 case 'garland':[523,659,784].forEach((f,i)=>tone(now+i*.065,.18,f,f,.06));break;
 case 'applause':[0,.09,.19,.29].forEach(t=>{hiss(now+t,.075,1700,.25);hiss(now+t+.009,.055,950,.11,'highpass');});break;
 case 'shoe':hiss(now,.17,500,.12,'bandpass',2600);tone(now+.13,.16,150,48,.19,'triangle');hiss(now+.13,.08,280,.17,'lowpass');break;
 case 'finger':hiss(now,.13,1800,.13,'bandpass',500);hiss(now+.08,.23,750,.2,'lowpass',150);[0,.06,.13].forEach((t,i)=>tone(now+.13+t,.09,650-i*90,220,.055));break;
 case 'tomato':tone(now,.22,180,45,.18);hiss(now,.23,1200,.24,'lowpass',120);break;
 case 'laugh':[0,.12,.24,.37,.5].forEach((t,i)=>tone(now+t,.105,210+i%2*65,150+i%2*40,.15,'sawtooth',true));break;
 }}catch{/* Feedback must never interrupt voting. */}
}
