'use strict';
const find = selector => document.querySelector(selector);
const canvas = find('canvas'), pen = canvas.getContext('2d'), audio = find('audio');
const file = find('#file'), lyrics = find('#lyrics'), save = find('#save'), statusLine = find('#status');
const exportButton = find('#export');
let cues = [], sourceUrl, downloadUrl, frame, context, input, recording = false;
const mime = ['video/mp4;codecs=avc1.42001E,mp4a.40.2','video/mp4'].find(type => window.MediaRecorder?.isTypeSupported(type));

function update() {
  if (downloadUrl) URL.revokeObjectURL(downloadUrl);
  downloadUrl = null;
  save.hidden = true;
  const lines = lyrics.value.trim().split(/\n/).map(line => line.trim()).filter(Boolean);
  let previous = -1;
  const timed = lines.some(line => line.startsWith('['));
  try {
    cues = lines.map((line, index) => {
      if (!timed) return {time:index * audio.duration / lines.length, text:line};
      const match = /^\[(\d+):([0-5]\d(?:\.\d{1,3})?)\]\s*(.+)$/.exec(line);
      if (!match) throw Error('Use [mm:ss.xx] followed by lyrics on every timed line.');
      const time = Number(match[1])*60 + Number(match[2]);
      if (time <= previous || time >= audio.duration) throw Error('Use increasing timestamps within the recording.');
      previous = time;
      return {time,text:match[3]};
    });
    statusLine.textContent = mime ? '' : 'This browser lacks MP4 recording support. Try Chrome.';
  } catch (error) { cues = []; statusLine.textContent = error.message; }
  exportButton.disabled = recording || !mime || !Number.isFinite(audio.duration) || !cues.length;
  draw();
}
function draw() {
  cancelAnimationFrame(frame);
  const gradient = pen.createLinearGradient(0,0,1280,720);
  gradient.addColorStop(0,'#182640'); gradient.addColorStop(1,'#66375c');
  pen.fillStyle = gradient; pen.fillRect(0,0,1280,720);
  pen.fillStyle = '#fff7ed'; pen.textAlign = 'center'; pen.font = '56px Georgia, serif';
  const caption = cues.findLast(cue => cue.time <= audio.currentTime)?.text ?? (sourceUrl ? '' : 'Your lyric preview');
  const rows = [''];
  for (const word of caption.split(/\s+/)) {
    const last = rows.length-1, next = (rows[last]+' '+word).trim();
    if (rows[last] && pen.measureText(next).width > 1120) rows.push(word);
    else rows[last] = next;
  }
  const spacing = Math.min(70,580/rows.length);
  pen.font = Math.min(56,spacing*.8)+'px Georgia, serif';
  rows.forEach((row,index)=>pen.fillText(row,640,380+(index-(rows.length-1)/2)*spacing,1120));
  if (!audio.paused) frame = requestAnimationFrame(draw);
}
file.onchange = () => {
  audio.pause(); audio.removeAttribute('src'); audio.load();
  if (sourceUrl) URL.revokeObjectURL(sourceUrl);
  sourceUrl = null;
  const selected = file.files[0];
  if (selected && /\.wav$/i.test(selected.name)) audio.src = sourceUrl = URL.createObjectURL(selected);
  update();
  if (selected && !sourceUrl) statusLine.textContent = 'Choose a WAV file.';
};
lyrics.oninput = audio.onloadedmetadata = update;
audio.onerror = () => { update(); statusLine.textContent = 'This recording could not be decoded.'; };
audio.onplay = audio.onseeked = draw;
exportButton.onclick = async () => {
  let stream, destination, recorder;
  recording = true; find('fieldset').disabled = exportButton.disabled = true; audio.controls = false;
  try {
    audio.pause(); audio.currentTime = 0; audio.playbackRate = 1;
    context ??= new AudioContext(); await context.resume();
    if (!input) { input = context.createMediaElementSource(audio); input.connect(context.destination); }
    destination = context.createMediaStreamDestination(); input.connect(destination);
    stream = canvas.captureStream(30); stream.addTrack(destination.stream.getAudioTracks()[0]);
    recorder = new MediaRecorder(stream,{mimeType:mime});
    const parts = [];
    recorder.ondataavailable = event => { if (event.data.size) parts.push(event.data); };
    const finished = new Promise((resolve,reject) => {
      recorder.onstop = resolve;
      recorder.onerror = () => reject(Error('MP4 encoding failed.'));
    });
    audio.onended = () => recorder.stop();
    recorder.start(250); draw();
    statusLine.textContent = 'Exporting in real time. Keep this tab visible.';
    await Promise.all([finished,audio.play()]);
    if (!parts.length) throw Error('The encoder returned an empty file.');
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    save.href = downloadUrl = URL.createObjectURL(new Blob(parts,{type:'video/mp4'}));
    save.hidden = false; statusLine.textContent = 'Your MP4 is ready.';
  } catch (error) { statusLine.textContent = error.message; }
  finally {
    audio.onended = null; audio.pause();
    if (recorder?.state === 'recording') recorder.stop();
    stream?.getTracks().forEach(track => track.stop());
    if (destination) input.disconnect(destination);
    recording = false; find('fieldset').disabled = exportButton.disabled = false; audio.controls = true;
  }
};
const recognizerType = window.SpeechRecognition || window.webkitSpeechRecognition;
const tools = document.createElement('section');
tools.innerHTML = '<label>Vocal language<select><option value="en-US">English</option><option value="hi-IN">Hindi</option><option value="gu-IN">Gujarati</option></select></label><button type="button">Generate lyrics on device</button><small> Uses a local speech language pack. Review sung words and timing before export.</small>';
lyrics.parentElement.before(tools);
const generate = tools.querySelector('button');
const cancelLyrics = document.createElement('button');
cancelLyrics.type = 'button';
cancelLyrics.textContent = 'Cancel transcription';
cancelLyrics.hidden = true;
find('fieldset').after(cancelLyrics);
if (!recognizerType?.available || !('processLocally' in recognizerType.prototype)) {
  generate.disabled = true;
  tools.querySelector('small').textContent = ' Local transcription requires a browser with on-device speech recognition.';
}
generate.onclick = async () => {
  if (!sourceUrl || !Number.isFinite(audio.duration)) { statusLine.textContent = 'Choose a playable WAV first.'; return; }
  if (lyrics.value.trim() && !confirm('Replace the current lyrics when recognition succeeds?')) return;
  const language = tools.querySelector('select').value;
  const options = {langs:[language],processLocally:true};
  const recognition = new recognizerType();
  const cancelled = new Promise((resolve,reject) => {
    cancelLyrics.onclick = () => reject(Error('Transcription cancelled.'));
  });
  cancelLyrics.hidden = false;
  let streamNode, timeout;
  const lines = [];
  let onset = 0, ended = false;
  find('fieldset').disabled = exportButton.disabled = true; audio.controls = false;
  try {
    const availability = await Promise.race([recognizerType.available(options),cancelled]);
    if (availability !== 'available') {
      if (availability === 'unavailable') throw Error('This browser has no local speech pack for that language.');
      statusLine.textContent = 'Allow the browser to download the local speech pack when prompted.';
      if (!await Promise.race([recognizerType.install(options),cancelled])) throw Error('The speech pack could not be installed.');
    }
    audio.pause(); audio.currentTime = 0; audio.playbackRate = 1;
    context ??= new AudioContext(); await context.resume();
    if (!input) { input = context.createMediaElementSource(audio); input.connect(context.destination); }
    streamNode = context.createMediaStreamDestination(); input.connect(streamNode);
    recognition.processLocally = true;
    recognition.lang = language;
    recognition.continuous = true;
    statusLine.textContent = 'Listening to the WAV on this device…';
    await Promise.race([cancelled,new Promise((resolve,reject) => {
      recognition.onstart = () => audio.play().catch(reject);
      recognition.onspeechstart = () => { onset = audio.currentTime; };
      recognition.onresult = event => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i], text = result[0].transcript.trim();
          if (!result.isFinal || !text) continue;
          const tick = Math.max(Math.floor(onset*100), (lines.at(-1)?.tick ?? -1)+1);
          if (tick < audio.duration*100) lines.push({tick,text});
          onset = audio.currentTime;
        }
      };
      recognition.onerror = event => reject(Error('Local recognition failed: '+event.error));
      recognition.onend = resolve;
      audio.onended = () => { ended = true; recognition.stop(); };
      timeout = setTimeout(() => reject(Error('Local recognition timed out.')), (audio.duration+30)*1000);
      recognition.start(streamNode.stream.getAudioTracks()[0]);
    })]);
    if (!lines.length) throw Error('No words were recognized. Try a clearer vocal track or another language.');
    lyrics.value = lines.map(({tick,text}) => '['+String(Math.floor(tick/6000)).padStart(2,'0')+':'+(tick%6000/100).toFixed(2).padStart(5,'0')+'] '+text).join('\n');
    statusLine.textContent = ended ? 'Lyrics generated. Review the words and timing.' : 'Recognition ended early. Review the partial lyrics.';
  } catch (error) { statusLine.textContent = error.message; }
  finally {
    const message = statusLine.textContent;
    cancelLyrics.hidden = true; cancelLyrics.onclick = null;
    clearTimeout(timeout); recognition.onstart = null; recognition.abort(); audio.onended = null; audio.pause(); audio.currentTime = 0;
    if (streamNode) { input.disconnect(streamNode); streamNode.stream.getTracks().forEach(track => track.stop()); }
    find('fieldset').disabled = false; audio.controls = true; update(); statusLine.textContent = message;
  }
};
update();
