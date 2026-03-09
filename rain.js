let rainCtx = null, rainPlaying = false, rainGain = null, rainInterval = null;

function startRain() {
  rainCtx = new AudioContext();

  rainGain = rainCtx.createGain();
  rainGain.gain.value = parseFloat(document.getElementById('rainVolume').value);
  rainGain.connect(rainCtx.destination);

  // schedule random raindrops continuously
  scheduleDrops();

  rainCtx.resume();
}

function stopRain() {
  clearInterval(rainInterval);
  rainCtx.close();
  rainCtx = null;
}

//each raindrop = short burst of noise
function createDrop(time, freq, decay, amp) {
  var bufferSize = rainCtx.sampleRate * 0.1, // white noise burst --> 100ms of noise 
  //used white noise, not brown noise because raindrops are sharp, not smooth
      noiseBuffer = rainCtx.createBuffer(1, bufferSize, rainCtx.sampleRate),
      output = noiseBuffer.getChannelData(0);

  for (var i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1; // white noise burst
  }

  var noise = rainCtx.createBufferSource();
  noise.buffer = noiseBuffer;

  // bandpass filter gives each drop its "tink" character
  var filter = rainCtx.createBiquadFilter(); //--> controls "pitch" of drop
  filter.type = 'bandpass';
  filter.frequency.value = freq; //high frequency = light tink
  filter.Q.value = 15;

  // creates sharp attack right at time, then drops it to near zero over decay seconds
  //allows each drop to be distinct, instead of something continuous
  var env = rainCtx.createGain();
  env.gain.setValueAtTime(amp, time);
  env.gain.exponentialRampToValueAtTime(0.0001, time + decay);

  noise.connect(filter);
  filter.connect(env);
  env.connect(rainGain);

  noise.start(time);
  noise.stop(time + decay);
}

//make drops happen at random intervals
function scheduleDrops() {
  rainInterval = setInterval(() => {
    if (!rainCtx) return;
    var now = rainCtx.currentTime;

    // 3 light drops per interval — many, high frequency, short decay
    for (var i = 0; i < 3; i++) {
      var freq  = 1000 + Math.random() * 3000; // random frequency btw 1k–4k hz 
      var decay = 0.05 + Math.random() * 0.1;  // short decay: 50–150ms
      var amp   = 0.1 + Math.random() * 0.2; // lower amplitude
      var delay = Math.random() * 0.1;
      createDrop(now + delay, freq, decay, amp);
    }

    // only fire heavy drops 30% of the time
    if (Math.random() < 0.3) {
      var freq  = 300 + Math.random() * 700;  // lower frequency: 300–1000hz
      var decay = 0.2 + Math.random() * 0.3;  // longer decay: 200–500ms
      var amp   = 0.3 + Math.random() * 0.3; //higher amplitude than light drops
      createDrop(now, freq, decay, amp);
    }

  }, 80); // fire every 80ms
}

document.getElementById('rainBtn').addEventListener('click', () => {
  rainPlaying = !rainPlaying;
  const btn = document.getElementById('rainBtn');
  if (rainPlaying) {
    startRain();
    btn.textContent = '■';
    btn.classList.add('playing');
  } else {
    stopRain();
    btn.textContent = '▶';
    btn.classList.remove('playing');
  }
});

document.getElementById('rainVolume').addEventListener('input', function() {
  if (rainGain) rainGain.gain.value = parseFloat(this.value);
});
```

So your final file structure is:
```
index.html
style.css
brook.js
rain.js