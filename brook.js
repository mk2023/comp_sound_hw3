let audioCtx = null, playing = false, gainNode = null;

function start() {
  audioCtx = new AudioContext();

  // Code from Assignment Instructions

  //first Brown Noise --> Signal
  var bufferSize = 10 * audioCtx.sampleRate,
      noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate),
      output = noiseBuffer.getChannelData(0);

  var lastOut = 0;
  for (var i = 0; i < bufferSize; i++) {
      var brown = Math.random() * 2 - 1;
      output[i] = (lastOut + (0.02 * brown)) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5;
  }

  var brownNoise1 = audioCtx.createBufferSource();
  brownNoise1.buffer = noiseBuffer;
  brownNoise1.loop = true;
  brownNoise1.start(0);

  // have to make another brown noise because the SC code uses two as well. --> Modulation
  var bufferSize2 = 10 * audioCtx.sampleRate,
      noiseBuffer2 = audioCtx.createBuffer(1, bufferSize2, audioCtx.sampleRate),
      output2 = noiseBuffer2.getChannelData(0);

  var lastOut2 = 0;
  for (var i = 0; i < bufferSize2; i++) {
      var brown2 = Math.random() * 2 - 1;
      output2[i] = (lastOut2 + (0.02 * brown2)) / 1.02;
      lastOut2 = output2[i];
      output2[i] *= 3.5;
  }

  var brownNoise2 = audioCtx.createBufferSource();
  brownNoise2.buffer = noiseBuffer2;
  brownNoise2.loop = true;
  brownNoise2.start(0);

  // Equivalent to LPF.ar(BrownNoise.ar(), 400)
  var lpf = audioCtx.createBiquadFilter();
  lpf.type = 'lowpass';
  lpf.frequency.value = 400; // can't change because original code has this explicitly

  // RHPF — set below LPF cutoff so signal gets through
  var rhpf = audioCtx.createBiquadFilter();
  rhpf.type = 'highpass'; // we can change this to bandpass or peaking, but highpass sounds the most similar
  rhpf.frequency.value = 500;
  rhpf.Q.value = 33; // can't change because original code has this explicitly

  // amplitude 0.1 from SC
  gainNode = audioCtx.createGain();
  gainNode.gain.value = 0.1; // can't change because original code has this explicitly

  // Signal chain: brownNoise1 → lpf → rhpf → gain → out
  brownNoise1.connect(lpf);
  lpf.connect(rhpf);
  rhpf.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  // LPF.ar(BrownNoise.ar(), 14) * 400 + 500 → rhpf.frequency
  var modLpf = audioCtx.createBiquadFilter();
  modLpf.type = 'lowpass';
  modLpf.frequency.value = 14; // can't change because original code has this explicitly

  var scale = audioCtx.createGain();
  scale.gain.value = 400; // can't change because original code has this explicitly

  var dc = audioCtx.createConstantSource();
  dc.offset.value = 500; // can't change because original code has this explicitly
  dc.start();

  // Modulation chain: brownNoise2 → modLpf → x400 + 500 → rhpf.frequency
  brownNoise2.connect(modLpf);
  modLpf.connect(scale);
  scale.connect(rhpf.frequency);
  dc.connect(rhpf.frequency);

  audioCtx.resume();
}

function stop() {
  audioCtx.close();
  audioCtx = null;
}

document.getElementById('brookBtn').addEventListener('click', () => {
  playing = !playing;
  const btn = document.getElementById('brookBtn');
  if (playing) {
    start();
    btn.textContent = '■';
    btn.classList.add('playing');
  } else {
    stop();
    btn.textContent = '▶';
    btn.classList.remove('playing');
  }
});

document.getElementById('brookVolume').addEventListener('input', function() {
  if (gainNode) gainNode.gain.value = parseFloat(this.value);
});