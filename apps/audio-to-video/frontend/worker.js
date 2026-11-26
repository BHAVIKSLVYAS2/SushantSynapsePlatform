'use strict';
// One worker owns one encoder and its filesystem. Termination also cancels synchronous WASM.
self.onmessage = async ({data}) => {
  let core;
  const phase = name => postMessage({phase:name});
  try {
    phase('Loading conversion engine');
    const parallel = data.parallel && self.crossOriginIsolated && typeof SharedArrayBuffer==='function';
    const script = parallel ? '/audio-to-video/core-mt.js' : '/audio-to-video/core.js';
    importScripts(script);
    const response = await fetch(parallel ? '/audio-to-video/engine-mt.bin' : '/audio-to-video/engine.bin');
    if (!response.ok) throw Error('The conversion engine could not be loaded. Reload and retry.');
    const wasmBinary = await new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
    const options={wasmBinary};
    if(parallel){
      const workerURL=new URL('/audio-to-video/thread.js',location.href).href;
      options.mainScriptUrlOrBlob=new URL(script,location.href).href+'#'+btoa(JSON.stringify({workerURL}));
    }
    core = await createFFmpegCore(options);
    phase('Preparing media');
    const fs = core.FS;
    fs.mkdir('/input');
    fs.mount(fs.filesystems.WORKERFS,{blobs:[{name:'media',data:data.media},{name:'cover.png',data:data.cover}]},'/input');
    const errors = [];
    core.setLogger(({message}) => {errors.push(message); if(errors.length>12)errors.shift();});
    const probe = file => {
      core.reset();
      core.ffprobe('-v','error','-show_streams','-show_format','-of','json','-o','info.json',file);
      if(!fs.analyzePath('info.json').exists)throw Error('Cannot read the media headers.');
      const info=JSON.parse(fs.readFile('info.json',{encoding:'utf8'}));
      fs.unlink('info.json');
      return info;
    };
    const info = probe('/input/media');
    const track = info.streams?.find(s=>s.codec_type==='audio');
    if(!track)throw Error('Choose a recording or video containing an audio track.');
    if(data.replace && (!info.format?.format_name?.split(',').includes('mp4') || !info.streams.some(s=>s.codec_type==='video'&&!s.disposition?.attached_pic)))throw Error('Cover replacement requires a readable MP4 video.');
    const duration = Number(track.duration) || Number(info.format.duration);
    if(!(duration>0 && Number.isFinite(duration)))throw Error('Cannot determine audio duration.');
    const fps = Number(data.fps), rate = Number(data.rate);
    if(![24,25,30,60].includes(fps)||![128,192,256,320].includes(rate))throw Error('Invalid export settings.');
    const filters = {
      waveform:'showwaves=s=640x128:mode=line:colors=white:r='+fps,
      bars:'showfreqs=s=640x128:mode=bar:colors=white:fscale=log:rate='+fps,
      circle:"showfreqs=s=256x256:mode=bar:colors=white:fscale=log:rate="+fps+",format=gray,geq=lum='if(between(hypot(X-128,Y-128),56,125),lum((atan2(Y-128,X-128)+PI)*255/(2*PI),255-(hypot(X-128,Y-128)-56)*3.6),0)'"
    };
    const visual = filters[data.effect];
    if(data.effect!=='static'&&!Object.hasOwn(filters,data.effect))throw Error('Invalid visualizer.');
    const codec=['-c:v','libx264','-preset','ultrafast','-tune','stillimage','-crf','23','-pix_fmt','yuv420p','-r',String(fps)];
    phase('Processing video');
    if(!visual){
      core.reset();
      if(core.exec('-loop','1','-framerate','1','-i','/input/cover.png','-t','1',...codec,'still.mp4')!==0)throw Error('Cover encoding failed. Try a lower resolution.');
    }
    const videoInput=visual?['-loop','1','-framerate',String(fps),'-i','/input/cover.png']:['-stream_loop','-1','-i','still.mp4'];
    const args=[...videoInput,'-i','/input/media'];
    if(visual){
      const w=Math.max(2,Math.round(data.width*(data.effect==='circle'?0.25:0.75)/2)*2);
      args.push('-filter_complex','[1:a:0]'+visual+',format=rgba,colorkey=black:0.12:0.08,scale='+w+':-2[effect];[0:v][effect]overlay=(W-w)/2:H-h-H/16[v]','-map','[v]');
    } else args.push('-map','0:v:0');
    args.push('-map','1:a:0','-map_metadata','-1',...(visual?codec:['-c:v','copy']),'-t',String(duration),'-movflags','+faststart');
    core.setProgress(({time})=>postMessage({fraction:Math.min(.99,time/1e6/duration)}));
    const encode = audioArgs => {core.reset();return core.exec(...args,...audioArgs,'-y','output.mp4');};
    const copy = data.preserve && ['aac','mp3','alac','ac3','eac3'].includes(track.codec_name);
    if(!copy || encode(['-c:a','copy'])!==0){
      if(encode(['-c:a','aac','-b:a',rate+'k'])!==0)throw Error('Encoding failed. Try 720p or a smaller recording. '+errors.slice(-2).join(' '));
    }
    phase('Finalizing MP4');
    const output=probe('output.mp4');
    const bytes=fs.readFile('output.mp4');
    postMessage({bytes,width:output.streams[0].width,height:output.streams[0].height,duration:Number(output.format.duration),codec:output.streams.map(s=>s.codec_name).join(' / ')},[bytes.buffer]);
  }catch(error){postMessage({error:error.message || 'Encoder memory exhausted. Try a lower resolution.'});}
  finally{if(core){try{core.FS.unlink('output.mp4');core.FS.unmount('/input');}catch{}}self.close();}
};
