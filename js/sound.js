/* ============ SOUND — effetti chiptune via WebAudio (zero asset) ============ */

const Sound = (() => {

  let ctx = null;
  let muted = false;
  try { muted = localStorage.getItem('corona-muted') === '1'; } catch (e) {}

  function ac() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // nota singola stile chip: onda quadra con decadimento
  function blip(freq, dur = 0.08, type = 'square', vol = 0.12, when = 0) {
    const a = ac();
    if (!a || muted) return;
    const t = a.currentTime + when;
    const osc = a.createOscillator();
    const gain = a.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain); gain.connect(a.destination);
    osc.start(t); osc.stop(t + dur + 0.02);
  }

  function noise(dur = 0.15, vol = 0.1, when = 0) {
    const a = ac();
    if (!a || muted) return;
    const t = a.currentTime + when;
    const len = Math.floor(a.sampleRate * dur);
    const buf = a.createBuffer(1, len, a.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = a.createBufferSource();
    src.buffer = buf;
    const gain = a.createGain();
    gain.gain.setValueAtTime(vol, t);
    src.connect(gain); gain.connect(a.destination);
    src.start(t);
  }

  const effects = {
    click()   { blip(660, 0.05, 'square', 0.06); },
    dice()    { for (let i = 0; i < 6; i++) blip(300 + Math.random() * 500, 0.04, 'square', 0.05, i * 0.05); },
    success() { blip(523, 0.09, 'square', 0.1); blip(659, 0.09, 'square', 0.1, 0.09); blip(784, 0.16, 'square', 0.12, 0.18); },
    crit()    { blip(523, 0.08, 'square', 0.1); blip(659, 0.08, 'square', 0.1, 0.08); blip(784, 0.08, 'square', 0.1, 0.16); blip(1047, 0.25, 'square', 0.13, 0.24); },
    fail()    { blip(220, 0.12, 'sawtooth', 0.1); blip(165, 0.22, 'sawtooth', 0.1, 0.12); },
    hit()     { noise(0.12, 0.12); blip(140, 0.1, 'sawtooth', 0.1); },
    heal()    { blip(392, 0.08, 'triangle', 0.12); blip(523, 0.08, 'triangle', 0.12, 0.08); blip(659, 0.14, 'triangle', 0.12, 0.16); },
    victory() { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => blip(f, 0.12, 'square', 0.11, i * 0.12)); },
    gold()    { blip(1319, 0.05, 'square', 0.1); blip(1760, 0.09, 'square', 0.1, 0.06); },
    item()    { blip(659, 0.07, 'triangle', 0.11); blip(880, 0.07, 'triangle', 0.11, 0.08); blip(1319, 0.12, 'triangle', 0.12, 0.16); },
    defeat()  { [392, 330, 262, 196].forEach((f, i) => blip(f, 0.2, 'sawtooth', 0.1, i * 0.18)); },
    combat()  { blip(196, 0.1, 'sawtooth', 0.12); blip(196, 0.1, 'sawtooth', 0.12, 0.14); blip(233, 0.25, 'sawtooth', 0.13, 0.28); },
  };

  function play(name) {
    try { if (effects[name]) effects[name](); } catch (e) { /* audio non disponibile: pazienza */ }
  }

  function toggleMute() {
    muted = !muted;
    try { localStorage.setItem('corona-muted', muted ? '1' : '0'); } catch (e) {}
    return muted;
  }

  function isMuted() { return muted; }

  /* ================= MUSICA DI SOTTOFONDO =================
     Piccolo sequencer chiptune: basso a onda triangolare + melodia quadra,
     tracce componibili come array di semitoni (null = pausa).          */

  let musicMuted = false;
  try { musicMuted = localStorage.getItem('corona-music-muted') === '1'; } catch (e) {}

  const NOTE = st => 440 * Math.pow(2, (st - 57) / 12); // semitono -> Hz (57 = LA4)

  /* Tracce tematiche: { bpm, vol, bass, lead, hat? } — step da 1/8.
     Ogni luogo della storia ha il suo colore musicale.                */
  const TRACKS = {
    // Il titolo: la notte eterna che incombe (Re minore, lento e sospeso)
    title: {
      bpm: 66, vol: 0.045,
      bass: [38, null, null, null, 45, null, null, null, 41, null, null, null, 43, null, 43, null],
      lead: [62, null, 65, null, 69, null, 65, null, 62, null, null, null, 60, null, 57, null],
    },
    // In viaggio: passo costante, un po' di apprensione (La minore)
    explore: {
      bpm: 92, vol: 0.04,
      bass: [45, null, 45, null, 43, null, 43, null, 41, null, 41, null, 43, null, 45, null],
      lead: [null, 64, null, 67, null, 64, null, 62, null, 60, null, 64, null, 62, null, null],
    },
    // Brindolo e la taverna: caldo e casalingo (Do maggiore saltellante)
    village: {
      bpm: 100, vol: 0.04,
      bass: [48, null, 43, null, 45, null, 43, null, 41, null, 45, null, 43, null, 43, null],
      lead: [72, 71, 72, null, 74, null, 72, null, 71, null, 69, 71, 72, null, null, null],
    },
    // Bosco dei Sussurri: sospeso, come bisbigli tra le fronde
    bosco: {
      bpm: 76, vol: 0.04,
      bass: [38, null, null, null, null, null, 34, null, 36, null, null, null, null, null, 33, null],
      lead: [null, 65, null, null, 62, null, null, 64, null, null, 58, null, 62, null, null, null],
    },
    // Miniere: profondo, cavernoso, gocce che cadono
    miniera: {
      bpm: 70, vol: 0.042,
      bass: [28, null, null, null, null, null, null, null, 31, null, null, null, null, null, 35, null],
      lead: [null, null, null, 76, null, null, null, null, null, null, 74, null, null, null, null, 71],
    },
    // Fiume Torbido: fluido, dondolante come una barca
    fiume: {
      bpm: 104, vol: 0.04,
      bass: [43, null, null, 38, null, null, 41, null, null, 36, null, null, 43, null, 38, null],
      lead: [null, 62, 65, null, 67, null, null, 65, 62, null, 60, null, null, 62, null, null],
    },
    // Gran Ballo dell'Eclissi: un valzer elegante e un filo sinistro (oom-pah-pah)
    ballo: {
      bpm: 138, vol: 0.045,
      bass: [33, 45, 45, 31, 43, 43, 29, 41, 41, 31, 43, 43],
      lead: [69, null, 68, 69, null, 72, null, null, 71, 69, null, 68],
      hat:  [0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1],
    },
    // Cripte e cantine del castello: quasi silenzio, tensione
    cripta: {
      bpm: 64, vol: 0.04,
      bass: [31, null, null, null, null, null, 30, null, null, null, 31, null, null, null, null, null],
      lead: [null, null, 62, null, null, null, null, null, 61, null, null, null, null, 58, null, null],
    },
    // La tenzone bardica: un liuto sincero (arpeggio in La minore)
    tenzone: {
      bpm: 88, vol: 0.045,
      bass: [33, null, null, null, 36, null, null, null, 31, null, null, null, 35, null, null, null],
      lead: [57, 60, 64, 69, 64, 60, 57, null, 55, 59, 62, 67, 62, 59, 55, null],
    },
    // Battaglia: incalzante
    combat: {
      bpm: 132, vol: 0.05,
      bass: [40, 40, null, 40, 43, null, 40, null, 38, 38, null, 38, 41, null, 43, null],
      lead: [null, null, 64, null, null, 67, 64, null, null, null, 62, null, 65, null, null, null],
      hat:  [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0],
    },
    // Vesper Morn: drammatico, mezzo passo alla volta, come il suo mantello
    boss: {
      bpm: 148, vol: 0.055,
      bass: [38, 38, 44, 38, 38, 45, 38, 44, 37, 37, 43, 37, 37, 44, 37, 43],
      lead: [62, null, null, 62, 63, null, 62, null, 61, null, null, 61, 62, null, 61, null],
      hat:  [1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1],
    },
    // L'alba ritrovata: finalmente maggiore, finalmente casa
    alba: {
      bpm: 84, vol: 0.045,
      bass: [36, null, 43, null, 45, null, 43, null, 41, null, 48, null, 43, null, 43, null],
      lead: [64, null, 67, 69, 72, null, 69, 67, 65, null, 64, 65, 67, null, null, null],
    },
  };

  let music = { track: null, timer: null, step: 0, nextTime: 0 };

  function stopMusic() {
    if (music.timer) { clearInterval(music.timer); music.timer = null; }
    music.track = null;
  }

  function scheduleNote(freq, t, dur, type, vol) {
    const a = ac();
    if (!a) return;
    const osc = a.createOscillator();
    const gain = a.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain); gain.connect(a.destination);
    osc.start(t); osc.stop(t + dur + 0.03);
  }

  function playMusic(name) {
    if (music.track === name) return;      // già in riproduzione
    stopMusic();
    if (muted || musicMuted) { music.track = name; return; } // ricorda la traccia per il toggle
    const a = ac();
    const tr = TRACKS[name];
    if (!a || !tr) { music.track = name; return; }
    music.track = name;
    music.step = 0;
    music.nextTime = a.currentTime + 0.06;
    const stepDur = 60 / tr.bpm / 2; // ottavi
    music.timer = setInterval(() => {
      if (muted || musicMuted) return;
      const ahead = a.currentTime + 0.25;
      while (music.nextTime < ahead) {
        const i = music.step % tr.bass.length;
        const b = tr.bass[i], l = tr.lead[i];
        if (b != null) scheduleNote(NOTE(b), music.nextTime, stepDur * 0.9, 'triangle', tr.vol * 1.15);
        if (l != null) scheduleNote(NOTE(l), music.nextTime, stepDur * 0.75, 'square', tr.vol * 0.7);
        if (tr.hat && tr.hat[i % tr.hat.length]) scheduleNote(NOTE(93 + (i % 2)), music.nextTime, 0.03, 'square', tr.vol * 0.25);
        music.nextTime += stepDur;
        music.step++;
      }
    }, 100);
  }

  function toggleMusicMute() {
    musicMuted = !musicMuted;
    try { localStorage.setItem('corona-music-muted', musicMuted ? '1' : '0'); } catch (e) {}
    const cur = music.track;
    stopMusic();
    if (!musicMuted && cur) playMusic(cur);
    else music.track = cur;
    return musicMuted;
  }

  // le AudioContext partono "suspended" finché l'utente non interagisce:
  // al primo gesto riavviamo la traccia richiesta
  if (typeof document !== 'undefined') {
    document.addEventListener('pointerdown', () => {
      const a = ac();
      if (a && music.track && !music.timer && !muted && !musicMuted) {
        const cur = music.track; music.track = null; playMusic(cur);
      }
    });
  }

  return { play, toggleMute, isMuted, music: playMusic, toggleMusicMute, isMusicMuted: () => musicMuted };
})();
