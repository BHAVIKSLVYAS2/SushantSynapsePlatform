let audio,noise,output,applause,applauseReady,playback=0;
// Only voting/detail pages import this module. The chooser never fetches audio.
const applauseBytes=fetch('/satire-arena/applause.mp3').then(r=>r.ok?r.arrayBuffer():null).catch(()=>null);
const active=new Set();
export function prepareSound(){
 try{const Context=window.AudioContext||window.webkitAudioContext;if(!Context)return;if(!audio||audio.state==='closed'){applause=null;applauseReady=null;audio=new Context({latencyHint:'interactive'});output=audio.createGain();output.gain.value=2;const limiter=audio.createDynamicsCompressor();limiter.threshold.value=-10;limiter.knee.value=8;limiter.ratio.value=6;limiter.attack.value=.003;limiter.release.value=.12;output.connect(limiter);const saturator=audio.createWaveShaper(),curve=new Float32Array(2048);for(let i=0;i<curve.length;i++)curve[i]=.9*Math.tanh((i/(curve.length-1)*2-1)*1.7);saturator.curve=curve;saturator.oversample='none';limiter.connect(saturator);saturator.connect(audio.destination);noise=audio.createBuffer(1,audio.sampleRate,audio.sampleRate);const samples=noise.getChannelData(0);for(let i=0;i<samples.length;i++)samples[i]=Math.random()*2-1;}if(audio.state==='suspended')audio.resume().catch(()=>{});}catch{/* Audio support is optional. */}
}
export function stopSound(){playback++;for(const oscillator of active){try{oscillator.stop();}catch{}}active.clear();}
function recordedApplause(start){
 const source=audio.createBufferSource(),gain=audio.createGain(),duration=Math.min(1.6,applause.duration-.15);source.buffer=applause;
 gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(.7,start+.005);gain.gain.setValueAtTime(.7,start+duration-.2);gain.gain.linearRampToValueAtTime(0,start+duration);source.connect(gain);gain.connect(output);
 active.add(source);source.onended=()=>{active.delete(source);source.disconnect();gain.disconnect();};source.start(start,.15,duration);source.stop(start+duration+.01);
}
function applauseSound(version){
 if(applause){recordedApplause(audio.currentTime);return;}
 const context=audio;
 applauseReady||=applauseBytes.then(bytes=>bytes?context.decodeAudioData(bytes.slice(0)):null).then(buffer=>{if(audio===context)applause=buffer;return buffer;}).catch(()=>null);
 return applauseReady.then(buffer=>{
  if(version!==playback||document.hidden||audio!==context||audio.state==='closed')return;
  if(buffer)recordedApplause(audio.currentTime);
  else [0,.14,.29,.45,.62].forEach(t=>{hiss(audio.currentTime+t,.045,1500,.6);hiss(audio.currentTime+t+.009,.035,900,.3,'highpass');});
 }).catch(()=>{/* Audio failure never interrupts voting. */});
}
function envelope(start,duration,volume){const gain=audio.createGain();gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(volume,start+.004);gain.gain.setValueAtTime(volume*.65,start+duration*.25);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);gain.connect(output);return gain;}
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
 case 'garland':[659,831,988].forEach((f,i)=>tone(now+i*.09,.3,f,f,.14));break;
 case 'applause':return applauseSound(playback);
 case 'shoe':hiss(now,.22,650,.2,'bandpass',3400);tone(now+.2,.23,280,95,.36,'triangle');hiss(now+.2,.13,650,.4,'lowpass');break;
 case 'finger':hiss(now,.17,2400,.23,'bandpass',600);hiss(now+.12,.3,1200,.35,'lowpass',350);[0,.085,.19].forEach((t,i)=>tone(now+.21+t,.14,1000-i*180,300,.14));break;
 case 'tomato':tone(now,.32,240,80,.32,'triangle');hiss(now,.32,2000,.5,'lowpass',160);break;
 case 'laugh':[0,.16,.33,.51,.7].forEach((t,i)=>tone(now+t,.14,340+i%2*100,210+i%2*65,.58,'sawtooth',true));break;
 }}catch{/* Feedback must never interrupt voting. */}
}
