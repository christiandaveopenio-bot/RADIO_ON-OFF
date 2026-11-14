document.addEventListener('DOMContentLoaded', () => {
  const btn       = document.querySelector('.btn');
  const tuneLeft  = document.querySelector('.tune-left');
  const volBtn    = document.querySelector('.tune-right');   // volume na ito
  const image     = document.getElementById('radio_img');
  const body      = document.body;

  const IMG_OFF   = 'img_on_off/radoff.png';
  const IMG_START = 'img_on_off/radstart.png';
  const IMG_ON    = 'img_on_off/radon.png';

  const SOUNDS = [
    'sound_rad/alexis_gaming_cam-radio-338296.mp3',
    'sound_rad/djartmusic-radio-tuning-1-298746.mp3',
    'sound_rad/freesound_community-fm-radio-static-82334.mp3',
    'sound_rad/freesound_community-spooky-music-box-radio-broadcast-32650.mp3',
    'sound_rad/freesound_community-tuning-radio-7150.mp3',
    'sound_rad/u_wxn5lzrjy3-military-radio-communication-222904.mp3'
    // add sounds here
  ];

  const stations = SOUNDS.map(path => {
    const a = new Audio(path);
    a.preload = 'auto';
    a.onerror = () => console.error('CANNOT FIND SOUND: ' + path);
    return a;
  });

  // VOLUME: puwedeng baguhin ang mga numero dito
  const VOLUME_LEVELS = [1, 0.75, 0.5, 0.25, 0];
  let volIndex = 1;                 // 1 = 75% ang simula
  let volume   = VOLUME_LEVELS[volIndex];

  function applyVolume() {
    volume = VOLUME_LEVELS[volIndex];
    stations.forEach(s => { s.volume = volume; });
    const pct = Math.round(volume * 100);
    volBtn.textContent = pct + '%';
    volBtn.setAttribute('aria-label', 'Volume ' + pct + ' percent');
  }
  applyVolume();

  let current = -1;
  let warmUpTimer = null;
  let warming = false;

  function setImage(path) {
    const test = new Image();
    test.onload  = () => { image.src = path; };
    test.onerror = () => console.error('CANNOT FIND FILE: ' + path);
    test.src = path;
  }

  function stopAll() {
    stations.forEach(s => {
      s.onended = null;
      s.pause();
      s.currentTime = 0;
    });
  }

  function playRandom() {
    stopAll();

    let next;
    do {
      next = Math.floor(Math.random() * stations.length);
    } while (next === current && stations.length > 1);

    current = next;
    const s = stations[current];
    s.volume = volume;
    s.onended = () => {
      if (body.classList.contains('on')) playRandom();
    };
    s.play().catch(() => {});
  }

  // maikling click na gawa ng JS, sumusunod din sa volume
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  let ctx = null;

  function playClick() {
    if (volume === 0) return;
    if (!ctx) ctx = new AudioCtx();
    if (ctx.state === 'suspended') ctx.resume();

    const t    = ctx.currentTime;
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.06);
    gain.gain.setValueAtTime(Math.max(0.0001, 0.25 * volume), t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);

    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.09);
  }

  // POWER BUTTON (knob)
  btn.addEventListener('click', () => {
    body.classList.toggle('on');
    btn.setAttribute('aria-pressed', body.classList.contains('on'));
    playClick();
    radioChange();
  });

  // ◀ RANDOM SOUND
  tuneLeft.addEventListener('click', () => {
    if (!body.classList.contains('on') || warming) return;
    playClick();
    playRandom();
  });

  // ▶ VOLUME: bawat pindot, bababa ang volume; pagkatapos ng mute, balik sa 100%
  volBtn.addEventListener('click', () => {
    volIndex = (volIndex + 1) % VOLUME_LEVELS.length;
    applyVolume();
    playClick();
  });

  // mouse wheel: scroll pataas = lakas, pababa = hina
  volBtn.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (e.deltaY < 0) volIndex = Math.max(0, volIndex - 1);
    else              volIndex = Math.min(VOLUME_LEVELS.length - 1, volIndex + 1);
    applyVolume();
  }, { passive: false });

  function radioChange() {
    clearTimeout(warmUpTimer);

    if (body.classList.contains('on')) {
      warming = true;
      setImage(IMG_START);
      image.classList.remove('starting');
      void image.offsetWidth;
      image.classList.add('starting');

      warmUpTimer = setTimeout(() => {
        warming = false;
        setImage(IMG_ON);
        image.classList.remove('starting');
        playRandom();
      }, 1200);
    } else {
      warming = false;
      image.classList.remove('starting');
      setImage(IMG_OFF);
      stopAll();
      current = -1;
    }
  }
});