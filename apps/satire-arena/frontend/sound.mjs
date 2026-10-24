let audio,noise,output,playback=0;
// Only voting/detail pages import this module. The chooser never fetches audio.
const clips={garland:'/satire-arena/wow.wav',applause:'/satire-arena/applause.mp3',shoe:'/satire-arena/ye-le.wav',tomato:'/satire-arena/dishoom.wav'};
const bytes=new Map(),decoded=new Map(),decoding=new Map();
function loadClip(reaction){if(!bytes.has(reaction))bytes.set(reaction,fetch(clips[reaction],{signal:AbortSignal.timeout(6000)}).then(r=>{if(!r.ok)throw Error('Audio unavailable');return r.arrayBuffer();}).catch(()=>{bytes.delete(reaction);return null;}));return bytes.get(reaction);}
const active=new Set();
export function prepareSound(reaction='applause'){
 if(clips[reaction])loadClip(reaction);
 try{const Context=window.AudioContext||window.webkitAudioContext;if(!Context)return;if(!audio||audio.state==='closed'){decoded.clear();decoding.clear();audio=new Context({latencyHint:'interactive'});output=audio.createGain();output.gain.value=2;const limiter=audio.createDynamicsCompressor();limiter.threshold.value=-10;limiter.knee.value=8;limiter.ratio.value=6;limiter.attack.value=.003;limiter.release.value=.12;output.connect(limiter);const saturator=audio.createWaveShaper(),curve=new Float32Array(2048);for(let i=0;i<curve.length;i++)curve[i]=.9*Math.tanh((i/(curve.length-1)*2-1)*1.7);saturator.curve=curve;saturator.oversample='none';limiter.connect(saturator);saturator.connect(audio.destination);noise=audio.createBuffer(1,audio.sampleRate,audio.sampleRate);const samples=noise.getChannelData(0);for(let i=0;i<samples.length;i++)samples[i]=Math.random()*2-1;}if(audio.state==='suspended')audio.resume().catch(()=>{});}catch{/* Audio support is optional. */}
}
export function stopSound(){playback++;for(const oscillator of active){try{oscillator.stop();}catch{}}active.clear();}
function recordedClip(reaction,start){
 const buffer=decoded.get(reaction),offset=reaction==='applause'?.15:0,source=audio.createBufferSource(),gain=audio.createGain(),duration=Math.min(reaction==='applause'?1.6:1.25,buffer.duration-offset),fade=Math.min(.2,duration/4);source.buffer=buffer;
 gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(.7,start+.005);gain.gain.setValueAtTime(.7,start+duration-fade);gain.gain.linearRampToValueAtTime(0,start+duration);source.connect(gain);gain.connect(output);
 active.add(source);source.onended=()=>{active.delete(source);source.disconnect();gain.disconnect();};source.start(start,offset,duration);source.stop(start+duration+.01);
}
function clipSound(reaction,version){
 if(decoded.has(reaction)){recordedClip(reaction,audio.currentTime);return;}
 const context=audio;
 if(!decoding.has(reaction))decoding.set(reaction,loadClip(reaction).then(value=>value?context.decodeAudioData(value.slice(0)):null).then(buffer=>{if(audio===context&&buffer)decoded.set(reaction,buffer);return buffer;}).catch(()=>null).finally(()=>{if(audio===context)decoding.delete(reaction);}));
 return decoding.get(reaction).then(buffer=>{
  if(version!==playback||document.hidden||audio!==context||audio.state==='closed')return;
  if(buffer)recordedClip(reaction,audio.currentTime);
  else syntheticSound(reaction,audio.currentTime);
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
 try{if(clips[reaction])return clipSound(reaction,playback);syntheticSound(reaction,now);}catch{/* Feedback must never interrupt voting. */}
}
function syntheticSound(reaction,now){switch(reaction){
 case 'garland':[659,831,988].forEach((f,i)=>tone(now+i*.09,.3,f,f,.14));break;
 case 'applause':[0,.14,.29,.45,.62].forEach(t=>{hiss(now+t,.045,1500,.6);hiss(now+t+.009,.035,900,.3,'highpass');});break;
 case 'shoe':hiss(now,.22,650,.2,'bandpass',3400);tone(now+.2,.23,280,95,.36,'triangle');hiss(now+.2,.13,650,.4,'lowpass');break;
 case 'finger':hiss(now,.07,2800,.2,'bandpass',600);hiss(now+.035,.3,1600,.5,'lowpass',180);[0,.055,.13].forEach((t,i)=>tone(now+.09+t,.13,650-i*110,110,.22));break;
 case 'tomato':tone(now,.32,240,80,.32,'triangle');hiss(now,.32,2000,.5,'lowpass',160);break;
 case 'laugh':[0,.16,.33,.51,.7].forEach((t,i)=>tone(now+t,.14,340+i%2*100,210+i%2*65,.58,'sawtooth',true));break;
 }
}
