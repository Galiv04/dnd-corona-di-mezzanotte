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

  return { play, toggleMute, isMuted };
})();
