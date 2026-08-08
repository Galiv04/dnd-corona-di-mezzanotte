/* ============ PLAYTHROUGH — simulazioni complete headless (no browser) ============
   Uso: node tests/playthrough.mjs

   Carica engine.js, combat.js, dice.js (+ dati) in un vm.Context Node con uno stub
   minimale di document/localStorage/timer, e gioca partite complete cliccando
   programmaticamente i bottoni generati dal gioco (choices, azioni di combattimento,
   overlay dei dadi, selezione eroe per le prove), esattamente come farebbe un utente.

   Obiettivo: scovare bug di RUNTIME (eccezioni, scene mancanti, loop infiniti,
   stato incoerente) che i controlli statici di validate.mjs non possono vedere,
   perché richiedono di ESEGUIRE la logica di gioco (combattimenti, prove, salvataggi). */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import vm from 'vm';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const FILES = [
  'js/sprites.js', 'js/scenes.js', 'js/characters.js', 'js/campaign.js',
  'js/rules.js', 'js/dice.js', 'js/combat.js', 'js/engine.js',
];
const SOURCES = FILES.map(f => ({ name: f, code: readFileSync(join(root, f), 'utf8') }));

let failures = 0;
function fail(msg) { failures++; console.error('  ❌ FAIL:', msg); }
function section(name) { console.log('\n▶', name); }

/* ==================== RNG SEEDABILE ==================== */

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ==================== DOM FINTO MINIMALE ==================== */

// Contesto canvas 2D: un Proxy che accetta QUALSIASI proprietà/metodo senza
// mai lanciare eccezioni (fillRect, beginPath, arc, fillText, textAlign, ...).
function makeFakeCtx(canvasEl) {
  const store = { canvas: canvasEl };
  const noop = () => {};
  return new Proxy(store, {
    get(target, prop) {
      if (prop in target) return target[prop];
      if (prop === 'measureText') return () => ({ width: 8 });
      if (prop === 'createLinearGradient' || prop === 'createRadialGradient') {
        return () => ({ addColorStop: noop });
      }
      return noop;
    },
    set(target, prop, value) { target[prop] = value; return true; },
  });
}

class FakeElement {
  constructor(tag = 'div') {
    this.tagName = String(tag).toUpperCase();
    this._id = '';
    this._className = '';
    this.children = [];
    this.parentNode = null;
    this.style = {};
    this.dataset = {};
    this._innerHTML = '';
    this._textContent = '';
    this.disabled = false;
    this.value = '';
    this.onclick = null;
    this.oninput = null;
    this.width = 300;
    this.height = 150;
    this._ctx = null;
    this.scrollTop = 0;
    this.scrollHeight = 0;
    this._listeners = {};
  }
  get id() { return this._id; }
  set id(v) { this._id = v; }
  get className() { return this._className; }
  set className(v) { this._className = String(v); }
  get classList() {
    const self = this;
    const toks = () => self._className.split(/\s+/).filter(Boolean);
    return {
      add: (...cls) => { const s = new Set(toks()); cls.forEach(c => s.add(c)); self._className = [...s].join(' '); },
      remove: (...cls) => { const s = new Set(toks()); cls.forEach(c => s.delete(c)); self._className = [...s].join(' '); },
      contains: (c) => toks().includes(c),
      toggle: (c) => { if (toks().includes(c)) self.classList.remove(c); else self.classList.add(c); },
    };
  }
  get innerHTML() { return this._innerHTML; }
  set innerHTML(v) { this._innerHTML = v; this.children = []; }
  get textContent() { return this._textContent; }
  set textContent(v) { this._textContent = String(v); }
  appendChild(child) { this.children.push(child); child.parentNode = this; return child; }
  addEventListener(type, fn) { (this._listeners[type] = this._listeners[type] || []).push(fn); }
  removeEventListener() {}
  querySelector() { return null; }
  querySelectorAll() { return []; }
  getContext(type) { if (!this._ctx) this._ctx = makeFakeCtx(this); return this._ctx; }
}

// id -> dimensioni canvas realistiche (non indispensabile, ma evita divisioni bizzarre)
const CANVAS_SIZES = {
  'title-canvas': [480, 270], 'scene-canvas': [960, 360], 'combat-canvas': [960, 380],
  'dice-canvas': [140, 140], 'map-canvas': [720, 480],
};

// Tutti gli id noti usati da document.getElementById(...) nel codice di gioco
// (elenco ricavato da grep su js/*.js, inclusi quelli incorporati in stringhe innerHTML).
const KNOWN_IDS_WITH_CLASS = {
  'screen-title': 'screen active', 'screen-howto': 'screen', 'screen-setup': 'screen',
  'screen-game': 'screen', 'screen-combat': 'screen',
  'modal-char': 'modal hidden', 'modal-generic': 'modal hidden', 'dice-overlay': 'modal hidden',
  'combat-banner': 'combat-banner hidden',
  'btn-dice-continue': 'btn btn-big hidden',
};

function makeDocument() {
  const elementsById = new Map();
  function getElementById(id) {
    if (!elementsById.has(id)) {
      const tag = /canvas/.test(id) ? 'canvas' : 'div';
      const el = new FakeElement(tag);
      el._id = id;
      if (KNOWN_IDS_WITH_CLASS[id] !== undefined) el.className = KNOWN_IDS_WITH_CLASS[id];
      if (CANVAS_SIZES[id]) { el.width = CANVAS_SIZES[id][0]; el.height = CANVAS_SIZES[id][1]; }
      elementsById.set(id, el);
    }
    return elementsById.get(id);
  }
  // pre-crea gli elementi con classe nota, così querySelectorAll('.screen') li trova
  // anche prima che vengano toccati da getElementById nel codice di gioco.
  for (const id of Object.keys(KNOWN_IDS_WITH_CLASS)) getElementById(id);
  return {
    getElementById,
    createElement: (tag) => new FakeElement(tag),
    querySelectorAll(sel) {
      if (sel === '.screen') return [...elementsById.values()].filter(e => e.classList.contains('screen'));
      return [];
    },
    addEventListener() {},
  };
}

/* ==================== SANDBOX / CARICAMENTO SCRIPT ==================== */

const scriptCache = SOURCES.map(s => ({ name: s.name, script: new vm.Script(s.code, { filename: s.name }) }));
const scriptGetG = new vm.Script('(typeof G !== "undefined" ? G : null)');
const scriptGetApi = new vm.Script('({Engine, Combat, Dice, HEROES, BESTIARY, ITEMS, CAMPAIGN, CAMPAIGN_START, WORLD_MAP})');

function buildGame(seed) {
  const doc = makeDocument();
  const storage = new Map();
  const localStorage = {
    getItem: k => (storage.has(k) ? storage.get(k) : null),
    setItem: (k, v) => storage.set(k, String(v)),
    removeItem: k => storage.delete(k),
  };
  const consoleErrors = [];
  const activeIntervals = new Set();
  const sandbox = {
    document: doc,
    localStorage,
    console: { log() {}, warn() {}, error: (...a) => consoleErrors.push(a.map(String).join(' ')), info() {} },
    setTimeout: (fn, _ms, ...args) => { fn(...args); return 0; },
    clearTimeout: () => {},
    setInterval: (fn) => {
      const id = Symbol('interval');
      activeIntervals.add(id);
      let iter = 0;
      while (activeIntervals.has(id) && iter < 100000) { fn(); iter++; }
      if (iter >= 100000) throw new Error('setInterval non terminato (probabile loop infinito nella digitazione del testo)');
      return id;
    },
    clearInterval: (id) => { activeIntervals.delete(id); },
  };
  const context = vm.createContext(sandbox);
  for (const { name, script } of scriptCache) {
    try { script.runInContext(context); } catch (e) { throw new Error(`Errore caricando ${name}: ${e.message}`); }
  }
  // RNG seedabile: sostituiamo Math.random del *contesto* (realm separato) per rendere
  // le partite riproducibili in base al seed di ogni run.
  const ctxMath = vm.runInContext('Math', context);
  ctxMath.random = mulberry32(seed);

  const api = scriptGetApi.runInContext(context);
  const getG = () => scriptGetG.runInContext(context);
  return { context, doc, api, getG, consoleErrors };
}

/* ==================== UTILITA' DI INTERAZIONE ==================== */

function buttons(el) { return el.children.filter(c => c.tagName === 'BUTTON'); }
function enabledButtons(el) { return buttons(el).filter(b => !b.disabled); }

function matchButton(list, matcher) {
  if (matcher == null) return null;
  if (typeof matcher === 'string') return list.find(b => b.innerHTML.includes(matcher)) || null;
  if (matcher instanceof RegExp) return list.find(b => matcher.test(b.innerHTML)) || null;
  if (typeof matcher === 'function') return list.find(matcher) || null;
  return null;
}

function statModFromButton(html) {
  const m = html.match(/([A-Z]{3}):\s*([+-]?\d+)/);
  return m ? parseInt(m[2], 10) : 0;
}
function hpRatioFromButton(html) {
  const m = html.match(/PV\s*(\d+)\s*\/\s*(\d+)/);
  return m ? parseInt(m[1], 10) / Math.max(1, parseInt(m[2], 10)) : 1;
}

/* ==================== CONTROLLI DI COERENZA DELLO STATO ==================== */

function checkInvariants(G, where) {
  if (!G) return;
  if (!Number.isFinite(G.gold) || G.gold < 0) {
    throw new Error(`STATO INCOERENTE: oro invalido (${G.gold}) @ ${where}`);
  }
  for (const h of G.party) {
    if (!Number.isFinite(h.hp) || h.hp < 0 || h.hp > h.maxHp) {
      throw new Error(`STATO INCOERENTE: HP invalidi per "${h.id}" (${h.hp}/${h.maxHp}) @ ${where}`);
    }
  }
  for (const hid of Object.keys(G.uses || {})) {
    for (const abid of Object.keys(G.uses[hid])) {
      const v = G.uses[hid][abid];
      if (!Number.isFinite(v) || v < 0) {
        throw new Error(`STATO INCOERENTE: usi negativi/non-numerici ${hid}.${abid} = ${v} @ ${where}`);
      }
    }
  }
}

/* ==================== STRATEGIA DI COMBATTIMENTO ==================== */

function classifyCombatMenu(btns) {
  if (btns.some(b => /^🎯/.test(b.innerHTML))) return 'target'; // 🎯
  if (btns.some(b => /^❤|^💀/.test(b.innerHTML))) return 'ally'; // ❤ o 💀
  return 'main';
}

function pickWeakestTarget(btns) {
  const targets = btns.filter(b => !/Indietro/.test(b.innerHTML));
  targets.sort((a, b) => hpRatioFromButton(a.innerHTML) - hpRatioFromButton(b.innerHTML));
  return targets[0] || btns[0];
}

function pickAllyForHealing(btns) {
  const allies = btns.filter(b => !/Indietro/.test(b.innerHTML));
  const down = allies.find(b => /A TERRA/.test(b.innerHTML));
  if (down) return down;
  allies.sort((a, b) => hpRatioFromButton(a.innerHTML) - hpRatioFromButton(b.innerHTML));
  return allies[0] || btns[0];
}

function pickMainCombatAction(btns, turnCounter, G) {
  const enabled = btns.filter(b => !b.disabled);
  if (!enabled.length) return btns[0];
  const needHeal = G && G.party.some(h => h.down || h.hp / h.maxHp < 0.35);
  if (needHeal) {
    const healer = enabled.find(b => /Cura/i.test(b.innerHTML) && /^(✨|🧪)/.test(b.innerHTML));
    if (healer) return healer;
  }
  const attack = enabled.find(b => /^⚔/.test(b.innerHTML)); // ⚔
  const abilities = enabled.filter(b => /^✨/.test(b.innerHTML)); // ✨
  const pool = [];
  if (attack) pool.push(attack);
  pool.push(...abilities);
  if (!pool.length) return enabled[0];
  return pool[turnCounter % pool.length];
}

function runCombat(game, scenario, state) {
  const { doc } = game;
  const LIMIT = 800;
  let steps = 0;
  let turnCounter = 0;
  while (true) {
    steps++;
    if (steps > LIMIT) throw new Error(`LOOP INFINITO sospetto nel combattimento (> ${LIMIT} azioni)`);

    const diceOverlay = doc.getElementById('dice-overlay');
    if (!diceOverlay.classList.contains('hidden')) {
      const btn = doc.getElementById('btn-dice-continue');
      if (typeof btn.onclick !== 'function') throw new Error('overlay dado visibile ma bottone "Continua" senza onclick');
      btn.onclick();
      checkInvariants(game.getG(), 'dopo tiro di dado in combattimento');
      continue;
    }
    const screenCombat = doc.getElementById('screen-combat');
    if (!screenCombat.classList.contains('active')) return; // combattimento risolto, siamo tornati alla scena

    const box = doc.getElementById('combat-actions');
    const btns = buttons(box);
    if (!btns.length) throw new Error('Nessuna azione di combattimento disponibile mentre "screen-combat" e\' attivo');

    const kind = classifyCombatMenu(btns);
    let chosen;
    if (state.strategy === 'passive' && kind === 'main') {
      chosen = btns.find(b => /Difesa totale/.test(b.innerHTML)) || enabledButtons(box)[0];
    } else if (kind === 'target') {
      chosen = pickWeakestTarget(btns);
    } else if (kind === 'ally') {
      chosen = pickAllyForHealing(btns);
    } else {
      chosen = pickMainCombatAction(btns, turnCounter++, game.getG());
    }
    if (!chosen) throw new Error(`Nessuna azione selezionabile in combattimento (kind=${kind})`);
    chosen.onclick();
    checkInvariants(game.getG(), 'dopo azione di combattimento');
  }
}

/* ==================== STRATEGIA DI NAVIGAZIONE SCENE ==================== */

const HUB_SCENES = new Set(['v1', 'v_emporio']);
const LEAVE_HINTS = ['Si parte!', 'Tornate in piazza'];

function pickSceneChoice(sceneId, btns, scenario) {
  const forced = scenario.choices && scenario.choices[sceneId];
  if (forced) {
    const m = matchButton(btns, forced);
    if (m) return m;
  }
  if (HUB_SCENES.has(sceneId)) {
    const leave = btns.find(b => LEAVE_HINTS.some(h => b.innerHTML.includes(h)));
    const others = btns.filter(b => b !== leave);
    if (others.length && scenario.rand() < 0.85) return others[Math.floor(scenario.rand() * others.length)];
    return leave || btns[0];
  }
  return btns[Math.floor(scenario.rand() * btns.length)];
}

function pickCheckHero(btns, scenario) {
  const bias = scenario.checkBias || 'random';
  if (bias === 'random') return btns[Math.floor(scenario.rand() * btns.length)];
  const withMod = btns.map(b => ({ b, mod: statModFromButton(b.innerHTML) }));
  withMod.sort((x, y) => (bias === 'best' ? y.mod - x.mod : x.mod - y.mod));
  return withMod[0].b;
}

/* ==================== ESECUZIONE DI UNA PARTITA ==================== */

function runGame(scenario) {
  const game = buildGame(scenario.seed);
  scenario.rand = mulberry32(scenario.seed * 7919 + 13); // rand separato per le scelte, dal dado di gioco
  const { doc, api, getG } = game;
  const log = { scenes: [], ending: null, combats: 0 };
  const state = { strategy: 'aggressive', firstLossForced: !scenario.forceFirstCombatLoss };

  try {
    api.Engine.newGame(scenario.heroes.map(id => ({ heroId: id, player: '' })));
  } catch (e) {
    return { ok: false, scenario, error: `Engine.newGame ha lanciato un'eccezione: ${e.stack || e}`, log };
  }

  const STEP_LIMIT = 2000;
  let steps = 0;
  try {
    checkInvariants(getG(), 'dopo newGame');
    while (true) {
      steps++;
      if (steps > STEP_LIMIT) throw new Error(`LOOP INFINITO sospetto nella navigazione (> ${STEP_LIMIT} passi totali)`);

      const G = getG();
      const sceneId = G.sceneId;
      const scene = api.CAMPAIGN[sceneId];
      if (!scene) throw new Error(`Scena non trovata: "${sceneId}" (riferita da qualche parte ma assente in CAMPAIGN)`);
      log.scenes.push(sceneId);

      if (scene.ending) { log.ending = sceneId; break; }

      const modalGeneric = doc.getElementById('modal-generic');
      if (!modalGeneric.classList.contains('hidden')) {
        const content = doc.getElementById('modal-generic-content');
        const btns = buttons(content);
        if (!btns.length) { modalGeneric.classList.add('hidden'); continue; }
        const chosen = pickCheckHero(btns, scenario);
        chosen.onclick();
        checkInvariants(getG(), `dopo scelta eroe per prova in "${sceneId}"`);
        continue;
      }

      const diceOverlay = doc.getElementById('dice-overlay');
      if (!diceOverlay.classList.contains('hidden')) {
        const btn = doc.getElementById('btn-dice-continue');
        if (typeof btn.onclick !== 'function') throw new Error('overlay dado visibile ma bottone "Continua" senza onclick');
        btn.onclick();
        checkInvariants(getG(), `dopo tiro di dado fuori combattimento (scena "${sceneId}")`);
        continue;
      }

      if (scene.combat) {
        log.combats++;
        const box = doc.getElementById('choices');
        const startBtn = buttons(box)[0];
        if (!startBtn) throw new Error(`Bottone "INIZIA IL COMBATTIMENTO" mancante in scena "${sceneId}"`);
        if (scenario.forceFirstCombatLoss && !state.firstLossForced) {
          state.strategy = 'passive';
          state.firstLossForced = true;
        } else {
          state.strategy = 'aggressive';
        }
        startBtn.onclick();
        runCombat(game, scenario, state);
        checkInvariants(getG(), `dopo combattimento originato da "${sceneId}"`);
        continue;
      }

      const choicesBox = doc.getElementById('choices');
      const btns = enabledButtons(choicesBox);
      if (!btns.length) throw new Error(`Nessuna scelta disponibile in scena "${sceneId}" (vicolo cieco a runtime)`);
      const chosen = pickSceneChoice(sceneId, btns, scenario);
      if (!chosen) throw new Error(`pickSceneChoice non ha selezionato nulla in scena "${sceneId}"`);
      chosen.onclick();
      checkInvariants(getG(), `dopo scelta in "${sceneId}"`);
    }
  } catch (e) {
    return { ok: false, scenario, error: e.stack || String(e), log };
  }

  if (game.consoleErrors.length) {
    return { ok: false, scenario, error: `console.error catturati durante la partita: ${game.consoleErrors.join(' | ')}`, log };
  }
  return { ok: true, scenario, log };
}

/* ==================== DEFINIZIONE DEGLI SCENARI ==================== */

let seedCounter = 1;
function nextSeed() { return seedCounter++ * 104729; }

function scenario(name, heroes, choices, opts = {}) {
  return {
    name,
    seed: opts.seed ?? nextSeed(),
    heroes,
    choices,
    checkBias: opts.checkBias || 'best',
    forceFirstCombatLoss: !!opts.forceFirstCombatLoss,
  };
}

const V2_FIGHT = { text: 'LEGNATE' };

const scenarios = [];

// ---- Ramo BOSCO, con le 4 varianti di ingresso al castello ----
scenarios.push(scenario('bosco -> maschere -> danza -> attacco diretto -> finale giusto', ['torvald', 'brunilde'], {
  v1: 'vecchia Mirtilla', v2: 'LEGNATE', v3: 'Bosco dei Sussurri',
  b1: 'tracce del sentiero', b2: "ECLISSI!", b3: 'Tentate di farla ridere', b3_gag: 'Torre di Brindolo',
  c1: 'Gran Ballo', c_ballo: 'Un giro di valzer', c_gerbold: 'ti meriti una vacanza', c_scala: 'Riposo breve',
  c_vetta: 'BATTAGLIA!', e_alba: 'Niente esecuzioni',
}));

scenarios.push(scenario('bosco -> giardino -> tenzone bardica (round1 INT) -> finale bardo?', ['lyra', 'brunilde'], {
  v1: 'vecchia Mirtilla', v2: 'LEGNATE', v3: 'Bosco dei Sussurri',
  b1: 'indicazioni agli alberi', b3: 'Uscite ad affrontare i lupi per il dente',
  c1: 'Pozione del Crepuscolo', c_gerbold: 'Niente chiacchiere', c_scala: 'Di corsa! Coglietelo di sorpresa',
  c_vetta: 'Vespertino Morn', f_tenzone1: 'la SUA ballata', f_tenzone2: 'APPLAUDITE',
}));

scenarios.push(scenario('bosco -> mura -> via della corona (persuasione) -> finale bardo?', ['fizzle', 'brunilde'], {
  v1: 'Si parte!', v2: 'Pagate le 20 monete', v3: 'Bosco dei Sussurri',
  b1: 'tracce del sentiero', b2: 'PIPISTRELLO!', b3: 'Tentate di farla ridere', b3_gag: 'caffè macchiato',
  c1: 'Scalando le mura', c_gerbold: "senza ferie", c_scala: 'Riposo breve',
  c_vetta: 'quella CORONA', f_corona1: 'VESPERTINO! Lasciala', e_alba: 'Vai. Sparisci',
}, { checkBias: 'best' }));

scenarios.push(scenario('bosco -> maschere/buffet -> corona (attacco diretto, indebolito) -> strappo corona', ['fizzle', 'kael'], {
  v1: 'emporio di Gedeone', v_emporio: "l'aglio", v2: 'ragioniamo', v3: 'Bosco dei Sussurri',
  b1: 'indicazioni agli alberi', b3: 'Uscite ad affrontare i lupi per il dente',
  c1: 'Gran Ballo', c_ballo: 'Al buffet! Origliare', c_gerbold: 'ti meriti una vacanza', c_scala: 'Di corsa! Coglietelo di sorpresa',
  c_vetta: 'quella CORONA', f_corona1: 'troppo tardi per le parole', f_boss_fase2_check: 'STRAPPATEGLI LA CORONA',
  e_alba: 'Niente esecuzioni',
}, { checkBias: 'best' }));

scenarios.push(scenario('bosco (fungo sbagliato -> combattimento funghi) -> mura fallita -> pipistrelli', ['torvald', 'zonk'], {
  v1: 'Si parte!', v2: 'LEGNATE', v3: 'Bosco dei Sussurri',
  b1: 'tracce del sentiero', b2: 'altro fungo?', b3: 'Uscite ad affrontare i lupi per il dente',
  c1: 'Scalando le mura', c_gerbold: 'Niente chiacchiere', c_scala: 'Riposo breve',
  c_vetta: 'BATTAGLIA!', e_alba: 'Vai. Sparisci',
}, { checkBias: 'worst' }));

scenarios.push(scenario('bosco (persi tra gli alberi -> ragni giganti) -> giardino -> specchio', ['fizzle', 'kael'], {
  v1: 'emporio di Gedeone', v_emporio: "specchio d'argento", v2: 'GRANDI e ringhiate', v3: 'Bosco dei Sussurri',
  b1: 'tracce del sentiero', b3: 'Tentate di farla ridere', b3_gag: 'paradosso del gatto',
  c1: 'Pozione del Crepuscolo', c_gerbold: 'ti meriti una vacanza', c_scala: 'Di corsa! Coglietelo di sorpresa',
  c_vetta: "specchio d'argento", e_alba: 'Niente esecuzioni',
}, { checkBias: 'worst' }));

// ---- Ramo MINIERE, con le 4 varianti di ingresso al castello ----
scenarios.push(scenario('miniere (parlantina) -> carrello -> modulo 7-B -> cantine -> finale giusto', ['fizzle', 'torvald'], {
  v1: 'Si parte!', v2: 'LEGNATE', v3: 'Miniere di Ferrovecchio',
  m1: 'sindaco di Brindolo ci manda', m2: 'Ovviamente carrello', m3: 'Modulo 7-B',
  c1: 'Passaggio Basso', c_gerbold: 'ti meriti una vacanza', c_scala: 'Riposo breve',
  c_vetta: 'BATTAGLIA!', e_alba: 'Niente esecuzioni',
}));

scenarios.push(scenario('miniere (condotto, test sbagliato) -> a piedi -> combattimento scheletri -> maschere', ['zonk', 'brunilde'], {
  v1: 'vecchia Mirtilla', v2: 'LEGNATE', v3: 'Miniere di Ferrovecchio',
  m1: 'condotto di aerazione', m2: 'Due ore di cammino', m3: "Procedura d'urgenza",
  c1: 'Gran Ballo', c_ballo: 'Dritti alla scala della torre', c_gerbold: 'ti meriti una vacanza', c_scala: 'Riposo breve',
  c_vetta: 'Vespertino Morn', f_tenzone1: 'canzone VOSTRA', f_tenzone2: 'cantarla ORA',
}));

scenarios.push(scenario('miniere (risposta indovinello alternativa) -> carrello sbagliato -> mura', ['kael', 'brunilde'], {
  v1: 'Si parte!', v2: 'LEGNATE', v3: 'Miniere di Ferrovecchio',
  m1: 'sindaco di Brindolo ci manda', m1_test: 'altra birra?', m2: 'Ovviamente carrello', m3: 'Modulo 7-B',
  c1: 'Scalando le mura', c_gerbold: 'Niente chiacchiere', c_scala: 'Di corsa! Coglietelo di sorpresa',
  c_vetta: 'quella CORONA', f_corona1: 'VESPERTINO! Lasciala',
}, { checkBias: 'worst' }));

scenarios.push(scenario('miniere (risposta sbagliata -> caduta dal condotto) -> cantine -> corona persuasione', ['fizzle', 'brunilde'], {
  v1: 'Si parte!', v2: 'LEGNATE', v3: 'Miniere di Ferrovecchio',
  m1: 'sindaco di Brindolo ci manda', m1_test: 'Del miele?', v_emporio: 'la corda',
  m2: 'Due ore di cammino', m3: "Procedura d'urgenza",
  c1: 'Passaggio Basso', c_gerbold: 'ti meriti una vacanza', c_scala: 'Riposo breve',
  c_vetta: 'quella CORONA', f_corona1: 'VESPERTINO! Lasciala', e_alba: 'Niente esecuzioni',
}, { checkBias: 'best' }));

// ---- Sconfitta generica + ripetizione del combattimento ----
scenarios.push(scenario('sconfitta generica nel primo combattimento poi RIPROVA e vince', ['torvald', 'zonk'], {
  v1: 'Si parte!', v2: 'LEGNATE', v3: 'Bosco dei Sussurri',
  b1: 'tracce del sentiero', b2: "ECLISSI!", b3: 'Uscite ad affrontare i lupi per il dente',
  c1: 'Gran Ballo', c_ballo: 'Dritti alla scala della torre', c_gerbold: 'Niente chiacchiere', c_scala: 'Riposo breve',
  c_vetta: 'BATTAGLIA!', e_alba: 'Vai. Sparisci',
}, { forceFirstCombatLoss: true }));

scenarios.push(scenario('sconfitta generica nel bivio miniere (scheletri) poi RIPROVA', ['lyra', 'kael'], {
  v1: 'Si parte!', v2: 'Pagate le 20 monete', v3: 'Miniere di Ferrovecchio',
  m1: 'sindaco di Brindolo ci manda', m2: 'Due ore di cammino', m3: "Procedura d'urgenza",
  c1: 'Scalando le mura', c_gerbold: 'senza ferie', c_scala: 'Riposo breve',
  c_vetta: 'BATTAGLIA!', e_alba: 'Niente esecuzioni',
}, { forceFirstCombatLoss: true }));

// ---- Round-robin extra per varietà (varianti di dettaglio, seed diversi, mix di bias) ----
const extraVariants = [
  { path: 'bosco', b1: 'tracce del sentiero', b2: "ECLISSI!", b3: 'Tentate di farla ridere', b3_gag: 'Torre di Brindolo', entry: 'Gran Ballo', ballo: 'Un giro di valzer' },
  { path: 'bosco', b1: 'indicazioni agli alberi', entry: 'Pozione del Crepuscolo' },
  { path: 'bosco', b1: 'tracce del sentiero', b2: 'PIPISTRELLO!', entry: 'Scalando le mura' },
  { path: 'miniere', m1: 'sindaco di Brindolo ci manda', m2: 'Ovviamente carrello', m3: 'Modulo 7-B', entry: 'Passaggio Basso' },
  { path: 'miniere', m1: 'condotto di aerazione', m2: 'Due ore di cammino', m3: "Procedura d'urgenza", entry: 'Gran Ballo', ballo: 'Al buffet! Origliare' },
  { path: 'miniere', m1: 'sindaco di Brindolo ci manda', m1_test: 'altra birra?', m2: 'Ovviamente carrello', m3: 'Modulo 7-B', entry: 'Scalando le mura' },
];
const heroPairs = [['torvald', 'brunilde'], ['fizzle', 'lyra'], ['kael', 'zonk'], ['brunilde', 'zonk'], ['lyra', 'fizzle'], ['torvald', 'kael']];
const vettaOptions = ['BATTAGLIA!', 'quella CORONA'];
const endings = ['Niente esecuzioni', 'Vai. Sparisci'];

for (let i = 0; i < 14; i++) {
  const v = extraVariants[i % extraVariants.length];
  const heroes = heroPairs[i % heroPairs.length];
  const choices = {
    v1: i % 3 === 0 ? 'emporio di Gedeone' : (i % 3 === 1 ? 'tempietto del Sole' : 'Si parte!'),
    v_emporio: 'le torce',
    v2: i % 2 === 0 ? 'LEGNATE' : 'ragioniamo',
    v3: v.path === 'bosco' ? 'Bosco dei Sussurri' : 'Miniere di Ferrovecchio',
    c1: v.entry,
    c_gerbold: i % 2 === 0 ? 'ti meriti una vacanza' : 'Niente chiacchiere',
    c_scala: i % 2 === 0 ? 'Riposo breve' : 'Di corsa! Coglietelo di sorpresa',
    c_vetta: vettaOptions[i % vettaOptions.length],
    f_corona1: 'VESPERTINO! Lasciala',
    e_alba: endings[i % endings.length],
  };
  if (v.b1) choices.b1 = v.b1;
  if (v.b2) choices.b2 = v.b2;
  if (v.b3) choices.b3 = v.b3; else choices.b3 = 'Uscite ad affrontare i lupi per il dente';
  if (v.b3_gag) choices.b3_gag = v.b3_gag;
  if (v.ballo) choices.c_ballo = v.ballo;
  if (v.m1) choices.m1 = v.m1;
  if (v.m1_test) choices.m1_test = v.m1_test;
  if (v.m2) choices.m2 = v.m2;
  if (v.m3) choices.m3 = v.m3;
  scenarios.push(scenario(`variante extra #${i + 1} (${v.path}, ingresso: ${v.entry})`, heroes, choices, { checkBias: i % 3 === 0 ? 'worst' : 'best' }));
}

// ---- Tentativi dedicati al finale "bardo" (richiede un successo su una prova) ----
function bardoAttempt(seedOffset, useTenzone) {
  const heroes = useTenzone ? ['lyra', 'brunilde'] : ['fizzle', 'brunilde'];
  const choices = {
    v1: 'vecchia Mirtilla', v2: 'LEGNATE',
    v3: 'Bosco dei Sussurri', b1: 'tracce del sentiero', b2: "ECLISSI!",
    b3: 'Uscite ad affrontare i lupi per il dente',
    c1: 'Pozione del Crepuscolo', c_gerbold: 'ti meriti una vacanza', c_scala: 'Riposo breve',
  };
  if (useTenzone) {
    choices.c_vetta = 'Vespertino Morn';
    choices.f_tenzone1 = 'la SUA ballata';
    choices.f_tenzone2 = 'APPLAUDITE';
  } else {
    choices.c_vetta = 'quella CORONA';
    choices.f_corona1 = 'VESPERTINO! Lasciala';
  }
  return scenario(`tentativo finale bardo (${useTenzone ? 'tenzone' : 'corona'}) #${seedOffset}`, heroes, choices, { checkBias: 'best', seed: 900000 + seedOffset });
}
for (let i = 0; i < 6; i++) scenarios.push(bardoAttempt(i, i % 2 === 0));

/* ==================== ESECUZIONE ==================== */

section('Simulazione di partite complete (headless)');
console.log(`  Esecuzione di ${scenarios.length} partite simulate...\n`);

const results = [];
for (const sc of scenarios) {
  const r = runGame(sc);
  results.push(r);
  const endingTxt = r.ok ? (r.log.ending || '(nessun finale?!)') : 'ERRORE';
  const line = `  ${r.ok ? '✅' : '❌'} [seed ${sc.seed}] ${sc.name} — scene: ${r.log.scenes.length}, combattimenti: ${r.log.combats}, esito: ${endingTxt}`;
  console.log(line);
  if (!r.ok) {
    console.error(`      ↳ ${r.error.split('\n')[0]}`);
  }
}

const fatalRuns = results.filter(r => !r.ok);
for (const r of fatalRuns) fail(`Partita "${r.scenario.name}" (seed ${r.scenario.seed}): ${r.error.split('\n')[0]}`);

/* ==================== VERIFICA DELLA COPERTURA ==================== */

section('Copertura dei percorsi richiesti');

const allScenesSeen = new Set(results.filter(r => r.ok).flatMap(r => r.log.scenes));
const allEndings = new Set(results.filter(r => r.ok && r.log.ending).map(r => r.log.ending));

function coverage(label, sceneIds) {
  const seen = sceneIds.filter(id => allScenesSeen.has(id));
  const ok = seen.length === sceneIds.length;
  console.log(`  ${ok ? '✅' : '❌'} ${label}: ${seen.join(', ') || '(nessuna)'}`);
  if (!ok) fail(`${label}: mancano ${sceneIds.filter(id => !allScenesSeen.has(id)).join(', ')}`);
}

coverage('Ramo bosco', ['b1', 'b4']);
coverage('Ramo miniere', ['m1', 'm4']);
coverage('Ingresso castello - maschere', ['c_maschere']);
coverage('Ingresso castello - cantine', ['c_cantine']);
coverage('Ingresso castello - giardino', ['c_giardino']);
coverage('Ingresso castello - mura', ['c_mura_ok', 'c_mura_ko'].some(id => allScenesSeen.has(id)) ? ['c_mura_ok'].filter(id => allScenesSeen.has(id)).concat(['c_mura_ko'].filter(id => allScenesSeen.has(id))) : ['c_mura_ok']);
coverage('Tenzone bardica', ['f_tenzone1', 'f_tenzone2']);
coverage('Via della corona', ['f_corona1']);
coverage('Boss fight fase 1', ['f_boss_intro']);
coverage('Boss fight fase 2', ['f_boss_fase2']);
coverage('Sconfitta generica + RETRY_COMBAT', ['sconfitta_generica']);

console.log(`  ${allEndings.size >= 3 ? '✅' : '❌'} Finali raggiunti (${allEndings.size}/3): ${[...allEndings].join(', ') || '(nessuno)'}`);
if (allEndings.size < 3) {
  const missing = ['e_finale_giusto', 'e_finale_esilio', 'e_finale_bardo'].filter(e => !allEndings.has(e));
  fail(`Finali non raggiunti in nessuna delle ${scenarios.length} run: ${missing.join(', ')}`);
}

/* ==================== ESITO FINALE ==================== */

console.log('\n' + '═'.repeat(60));
if (failures === 0) {
  console.log(`✅ TUTTE LE PARTITE SIMULATE COMPLETATE SENZA ERRORI (${scenarios.length} run, ${allScenesSeen.size} scene distinte visitate, ${allEndings.size}/3 finali)`);
  process.exit(0);
} else {
  console.log(`❌ ${failures} PROBLEMI RILEVATI su ${scenarios.length} partite simulate`);
  process.exit(1);
}
