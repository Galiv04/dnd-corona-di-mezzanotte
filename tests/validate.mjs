/* ============ TEST AUTOMATICI — validazione dati e logica ============
   Uso: node tests/validate.mjs
   Verifica: integrità del grafo delle scene, dati personaggi/nemici/oggetti,
   sprite ben formati, raggiungibilità dei finali, sanità dei dadi, bilanciamento. */

import { readFileSync } from 'fs';
import vm from 'vm';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { cercaBuchi, cercaNeroPieno } from './buchi-nei-fondali.mjs';

/* I fondali in cui il nero pieno e' una scelta, e la ragione della scelta. */
const NERO_VOLUTO = {};   // qui non ce n'e'

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

let failures = 0, warnings = 0, passed = 0;
function ok(msg) { passed++; }
function fail(msg) { failures++; console.error('  ❌ FAIL:', msg); }
function warn(msg) { warnings++; console.warn('  ⚠ WARN:', msg); }
function section(name) { console.log('\n▶', name); }

/* ---------- carica i moduli di gioco in un contesto Node ---------- */
const src = ['js/sprites.js', 'js/characters.js', 'js/campaign.js']
  .map(f => readFileSync(join(root, f), 'utf8'))
  .join('\n;\n');

const context = {};
const loader = new Function(`${src}; return { Sprites, HEROES, BESTIARY, ITEMS, CAMPAIGN, CAMPAIGN_START, WORLD_MAP };`);
let g;
try {
  g = loader();
  ok('moduli caricati');
} catch (e) {
  console.error('❌ ERRORE FATALE nel caricamento dei moduli:', e.message);
  process.exit(1);
}
const { Sprites, HEROES, BESTIARY, ITEMS, CAMPAIGN, CAMPAIGN_START, WORLD_MAP } = g;

/* ---------- 1. grafo delle scene ---------- */
section('Grafo delle scene');

const sceneIds = new Set(Object.keys(CAMPAIGN));
const SPECIAL = new Set(['RETRY_COMBAT']);

function refsOf(scene) {
  const refs = [];
  for (const c of scene.choices || []) {
    if (c.next) refs.push(c.next);
    if (c.check) { refs.push(c.check.success, c.check.fail); }
  }
  if (scene.combat) { refs.push(scene.combat.victory, scene.combat.defeat); }
  if (scene.minigame) { refs.push(scene.minigame.success, scene.minigame.fail); }
  return refs.filter(Boolean);
}

let badRefs = 0;
for (const [id, scene] of Object.entries(CAMPAIGN)) {
  for (const ref of refsOf(scene)) {
    if (!sceneIds.has(ref) && !SPECIAL.has(ref)) { fail(`scena "${id}" punta a scena inesistente "${ref}"`); badRefs++; }
  }
}
if (!badRefs) { ok(); console.log(`  ✔ tutti i riferimenti tra ${sceneIds.size} scene sono validi`); }

// raggiungibilità da p1 (RETRY_COMBAT torna a una scena combat: consideriamo raggiungibili le scene combat già visitate)
const reachable = new Set();
const queue = [CAMPAIGN_START];
while (queue.length) {
  const id = queue.pop();
  if (reachable.has(id) || SPECIAL.has(id)) continue;
  reachable.add(id);
  const scene = CAMPAIGN[id];
  if (scene) queue.push(...refsOf(scene));
}
const unreachable = [...sceneIds].filter(id => !reachable.has(id));
if (unreachable.length) unreachable.forEach(id => fail(`scena orfana (mai raggiungibile): "${id}"`));
else { ok(); console.log(`  ✔ tutte le ${sceneIds.size} scene sono raggiungibili da "${CAMPAIGN_START}"`); }

// scene senza uscite (devono essere solo i finali)
for (const [id, scene] of Object.entries(CAMPAIGN)) {
  const exits = refsOf(scene).length;
  if (!exits && !scene.ending) fail(`scena "${id}" è un vicolo cieco (nessuna uscita e non è un finale)`);
  if (scene.ending && refsOf(scene).length) warn(`finale "${id}" ha delle uscite: strano`);
}
ok(); console.log('  ✔ nessun vicolo cieco fuori dai finali');

// i finali sono raggiungibili
const endings = Object.entries(CAMPAIGN).filter(([, s]) => s.ending).map(([id]) => id);
if (endings.length < 3) fail(`solo ${endings.length} finali trovati (attesi ≥3)`);
for (const e of endings) {
  if (!reachable.has(e)) fail(`finale "${e}" non raggiungibile`);
}
console.log(`  ✔ ${endings.length} finali, tutti raggiungibili: ${endings.join(', ')}`);

// entrambi i rami del bivio esistono
if (!reachable.has('b1') || !reachable.has('m1')) fail('uno dei due rami del bivio (bosco/miniere) non è raggiungibile');
else console.log('  ✔ entrambi i rami (bosco e miniere) raggiungibili');

/* ---------- 2. scelte e requisiti ---------- */
section('Scelte, oggetti e flag');

const knownFlags = new Set();
for (const scene of Object.values(CAMPAIGN)) {
  if (scene.sets) Object.keys(scene.sets).forEach(f => knownFlags.add(f));
  for (const c of scene.choices || []) if (c.sets) Object.keys(c.sets).forEach(f => knownFlags.add(f));
}
let flagProblems = 0;
for (const [id, scene] of Object.entries(CAMPAIGN)) {
  for (const c of scene.choices || []) {
    for (const itemRef of [c.item, c.removeItem, c.requires?.item]) {
      if (itemRef && !ITEMS[itemRef]) { fail(`scena "${id}": oggetto inesistente "${itemRef}"`); flagProblems++; }
    }
    if (c.check && !['FOR','DES','COS','INT','SAG','CAR'].includes(c.check.stat)) { fail(`scena "${id}": statistica invalida "${c.check.stat}"`); flagProblems++; }
    if (c.check && (c.check.dc < 5 || c.check.dc > 20)) warn(`scena "${id}": CD insolita ${c.check.dc}`);
  }
  for (const itemRef of [scene.item, scene.item2, scene.onEnterOnce?.itemEach]) {
    if (itemRef && !ITEMS[itemRef]) { fail(`scena "${id}": oggetto inesistente "${itemRef}"`); flagProblems++; }
  }
}
if (!flagProblems) { ok(); console.log(`  ✔ tutti i flag (${knownFlags.size}) e gli oggetti referenziati esistono`); }

// oggetti chiave ottenibili prima di dove servono (controllo statico di percorso)
const keyItems = ['pozione_crepuscolo', 'chiave_passaggio'];
for (const it of keyItems) {
  const given = Object.values(CAMPAIGN).some(s => s.item === it || s.item2 === it || (s.choices || []).some(c => c.item === it) || (s.combat?.loot?.items || []).includes(it));
  if (!given) fail(`oggetto chiave "${it}" non viene mai dato al giocatore`);
}
console.log('  ✔ oggetti chiave ottenibili');

/* ---------- 3. combattimenti ---------- */
section('Combattimenti');

let combatProblems = 0;
const combats = Object.entries(CAMPAIGN).filter(([, s]) => s.combat);
for (const [id, scene] of combats) {
  for (const e of scene.combat.enemies) {
    if (!BESTIARY[e]) { fail(`combattimento "${id}": nemico inesistente "${e}"`); combatProblems++; }
  }
  if (!scene.combat.victory || !scene.combat.defeat) { fail(`combattimento "${id}": manca victory/defeat`); combatProblems++; }
  for (const it of scene.combat.loot?.items || []) {
    if (!ITEMS[it]) { fail(`combattimento "${id}": loot inesistente "${it}"`); combatProblems++; }
  }
}
if (!combatProblems) { ok(); console.log(`  ✔ ${combats.length} combattimenti validi (nemici, esiti, loot)`); }

// le sconfitte non-boss portano a sconfitta_generica che deve poter tornare al combattimento
const defeats = new Set(combats.map(([, s]) => s.combat.defeat));
for (const d of defeats) {
  if (!CAMPAIGN[d]) fail(`scena di sconfitta "${d}" inesistente`);
}
console.log(`  ✔ scene di sconfitta esistenti: ${[...defeats].join(', ')}`);

/* ---------- 4. personaggi e bestiario ---------- */
section('Personaggi e bestiario');

let charProblems = 0;
if (HEROES.length !== 6) fail(`attesi 6 eroi, trovati ${HEROES.length}`);
for (const h of HEROES) {
  for (const k of ['id','name','class','tagline','role','stats','maxHp','ac','attack','abilities','passive','backstory','voice','sprite']) {
    if (h[k] === undefined) { fail(`eroe "${h.id}": campo mancante "${k}"`); charProblems++; }
  }
  if (!Sprites.registry[h.sprite]) { fail(`eroe "${h.id}": sprite mancante "${h.sprite}"`); charProblems++; }
  for (const s of ['FOR','DES','COS','INT','SAG','CAR']) {
    if (typeof h.stats[s] !== 'number') { fail(`eroe "${h.id}": stat mancante ${s}`); charProblems++; }
  }
  if (h.abilities.length < 2) { fail(`eroe "${h.id}": meno di 2 abilità`); charProblems++; }
  for (const ab of h.abilities) {
    if (!ab.id || !ab.name || !ab.uses || !ab.type || !ab.desc) { fail(`eroe "${h.id}": abilità incompleta "${ab.id}"`); charProblems++; }
  }
  if (h.backstory.length < 200) warn(`eroe "${h.id}": backstory corta (${h.backstory.length} caratteri)`);
}
for (const [key, b] of Object.entries(BESTIARY)) {
  if (!Sprites.registry[b.sprite]) { fail(`nemico "${key}": sprite mancante "${b.sprite}"`); charProblems++; }
  if (!b.attack || !b.attack.dice || b.attack.bonus === undefined) { fail(`nemico "${key}": attacco malformato`); charProblems++; }
}
if (!charProblems) { ok(); console.log(`  ✔ 6 eroi completi (stats, abilità, backstory, sprite) e ${Object.keys(BESTIARY).length} nemici validi`); }

/* ---------- 5. sprite ---------- */
section('Sprite pixel-art');

let spriteProblems = 0;
for (const [name, def] of Object.entries(Sprites.registry)) {
  if (def.map.length !== 16) { fail(`sprite "${name}": ${def.map.length} righe (attese 16)`); spriteProblems++; }
  def.map.forEach((row, i) => {
    if (row.length !== 16) { fail(`sprite "${name}" riga ${i}: ${row.length} colonne (attese 16)`); spriteProblems++; }
    for (const ch of row) {
      if (ch !== '.' && !def.palette[ch]) { fail(`sprite "${name}" riga ${i}: carattere "${ch}" non in palette`); spriteProblems++; }
    }
  });
  const solid = def.map.join('').split('').filter(c => c !== '.').length;
  if (solid < 40) warn(`sprite "${name}": molto vuoto (${solid} pixel)`);
}
if (!spriteProblems) { ok(); console.log(`  ✔ ${Object.keys(Sprites.registry).length} sprite ben formati (16x16, palette coerenti)`); }

/* ---------- 6. mappa del mondo ---------- */
section('Mappa del mondo');

const mapped = new Set(WORLD_MAP.flatMap(l => l.scenes));
let unmapped = [...sceneIds].filter(id => !mapped.has(id) && id !== 'sconfitta_generica');
if (unmapped.length) unmapped.forEach(id => warn(`scena "${id}" senza luogo sulla mappa (userà fallback)`));
const mapGhost = [...mapped].filter(id => !sceneIds.has(id));
if (mapGhost.length) mapGhost.forEach(id => fail(`la mappa cita una scena inesistente "${id}"`));
else { ok(); console.log(`  ✔ mappa coerente: ${WORLD_MAP.length} luoghi, nessun riferimento fantasma`); }

/* ---------- 7. logica dei dadi ---------- */
section('Logica dei dadi (statistica)');

function roll(sides) { return 1 + Math.floor(Math.random() * sides); }
const N = 100000;
let sum = 0, min = 99, max = 0;
for (let i = 0; i < N; i++) { const r = roll(20); sum += r; min = Math.min(min, r); max = Math.max(max, r); }
const avg = sum / N;
if (min !== 1 || max !== 20) fail(`d20 fuori range: min=${min} max=${max}`);
else if (Math.abs(avg - 10.5) > 0.15) fail(`d20 media anomala: ${avg.toFixed(3)}`);
else { ok(); console.log(`  ✔ d20 uniforme su ${N} tiri (media ${avg.toFixed(2)}, range ${min}-${max})`); }

/* ---------- 8. bilanciamento (simulazione grezza) ---------- */
section('Bilanciamento (stime statistiche)');

function heroDPR(h) { // danno medio per round con attacco base
  const [n, s] = h.attack.dice;
  const statMod = h.stats[h.attack.stat] + (h.id === 'lyra' && h.attack.stat === 'INT' ? 2 : 0);
  const hitChance = Math.min(0.95, Math.max(0.05, (21 - (13 - (statMod + 2))) / 20)); // vs CA 13 media
  const avgDmg = n * (s + 1) / 2 + statMod + (h.attack.bonus || 0);
  return hitChance * avgDmg;
}
function enemyDPR(e) {
  const [n, s] = e.attack.dice;
  const hitChance = Math.min(0.95, Math.max(0.05, (21 - (14 - e.attack.bonus)) / 20)); // vs CA 14 media
  return hitChance * (n * (s + 1) / 2 + e.attack.plus);
}

// party minimo (2 eroi più deboli in danno) contro ogni combattimento
const dprs = HEROES.map(h => ({ id: h.id, dpr: heroDPR(h), hp: h.maxHp })).sort((a, b) => a.dpr - b.dpr);
const weakDuo = dprs.slice(0, 2);
const duoDPR = weakDuo.reduce((t, x) => t + x.dpr, 0) * 1.5; // ~x1.5 per abilità speciali
const duoHP = weakDuo.reduce((t, x) => t + x.hp, 0) + 20;    // + pozioni/cure

for (const [id, scene] of combats) {
  const totalEhp = scene.combat.enemies.reduce((t, e) => t + BESTIARY[e].maxHp, 0);
  const totalEdpr = scene.combat.enemies.reduce((t, e) => t + enemyDPR(BESTIARY[e]), 0);
  const roundsToWin = totalEhp / duoDPR;
  const roundsToLose = duoHP / totalEdpr;
  const margin = roundsToLose / roundsToWin;
  if (margin < 0.9) warn(`combattimento "${id}" molto duro per 2 giocatori (margine ${margin.toFixed(2)}): ok se boss`);
  else ok();
}
console.log('  ✔ stima di bilanciamento per party di 2 completata (vedi eventuali warn)');

const boss = BESTIARY.vesper;
const fullParty = dprs.reduce((t, x) => t + x.dpr, 0) * 1.4;
console.log(`  ℹ boss fight: HP boss+fase2 = ${boss.maxHp + BESTIARY.vesper_corona.maxHp}, DPR party completo ≈ ${fullParty.toFixed(1)} → ~${Math.ceil((boss.maxHp + BESTIARY.vesper_corona.maxHp) / fullParty)} round`);

/* ---------- 9. testi ---------- */
section('Qualità dei testi');

let shortScenes = 0;
for (const [id, scene] of Object.entries(CAMPAIGN)) {
  if (!scene.text || scene.text.length < 80) { warn(`scena "${id}": testo molto corto`); shortScenes++; }
  if (!scene.caption) warn(`scena "${id}": manca la caption`);
  if (!scene.location) fail(`scena "${id}": manca la location`);
}
const totalChars = Object.values(CAMPAIGN).reduce((t, s) => t + (s.text || '').length, 0);
const words = Math.round(totalChars / 6);
console.log(`  ✔ ${Object.keys(CAMPAIGN).length} scene, ~${words} parole di narrazione (~${Math.round(words / 180)} min di sola lettura ad alta voce)`);
if (words < 6000) warn('campagna forse corta per 2-4 ore');

const campSrc = readFileSync(join(root, 'js/campaign.js'), 'utf8');

/* ---------- prove ripetibili: check senza once nelle scene rivisitabili ---------- */
section('Prove nei luoghi rivisitabili (nessuna prova ripetibile)');

const bersagliRitorno = new Set([...campSrc.matchAll(/text: ["']↩[^"']*["'][^\n]*?next: '([a-z_0-9]+)'/g)].map(m => m[1]));
let proveRipetibili = 0;
for (const sid of bersagliRitorno) {
  const m = campSrc.match(new RegExp('^  ' + sid + ': \\{', 'm'));
  if (!m) continue;
  const blocco = campSrc.slice(m.index, campSrc.indexOf('\n  },', m.index));
  for (const c of blocco.matchAll(/\{ text: '([^']{0,60})'[^\n]*?check: \{[^}]*\}[^\n]*\}/g)) {
    if (!c[0].includes('once')) { fail(`scena rivisitabile "${sid}": la prova "${c[1]}" è ripetibile (manca once)`); proveRipetibili++; }
  }
}
if (!proveRipetibili) { ok(); console.log(`  ✔ ${bersagliRitorno.size} scene rivisitabili, nessuna prova ripetibile`); }


/* ---------- Chiavi dei dati: whitelist + CONTROPROVA (ago 2026) ----------
   Un campo dichiarato nei dati e mai letto dal motore è una bugia silenziosa
   (LESSONS-LEARNED #8 e #16: `heal`/`damage`/`goldLoss` sulle scelte non
   esistevano, e `c.item2` dava un oggetto invece di due). Si controlla nelle
   DUE direzioni, perché la whitelist da sola si limiterebbe a legittimare i
   campi morti invece di scoprirli:
     1) FAIL  se i dati usano una chiave FUORI whitelist (typo o campo inventato);
     2) WARN  se una chiave IN whitelist non risulta consumata dal codice. */
section('Chiavi dei dati (whitelist + controprova nel motore)');

const CHIAVI_SCENA = new Set(['location','caption','text','choices','npc','sets','rep','gold','goldLoss',
  'item','item2','heal','damage','fullHeal','recharge','onEnterOnce','combat','minigame','ending']);
const CHIAVI_SCELTA = new Set(['text','next','tag','once','requires','requiresGold','item','item2',
  'removeItem','sets','rep','gold','goldLoss','heal','damage','check']);
const CHIAVI_REQUIRES = new Set(['flag','notFlag','item','notItem','hero']);
const CHIAVI_CHECK = new Set(['stat','dc','success','fail','successHeal','failDamage']);

const codice = ['js/engine.js','js/combat.js','js/main.js','js/scenes.js','js/minigames.js','js/epilogues.js']
  .map(f => { try { return readFileSync(join(root, f), 'utf8'); } catch (e) { return ''; } }).join('\n');

let chiaviIgnote = 0;
for (const [id, scene] of Object.entries(CAMPAIGN)) {
  for (const k of Object.keys(scene)) {
    if (!CHIAVI_SCENA.has(k)) { fail(`scena "${id}": chiave sconosciuta "${k}" (typo o campo mai implementato)`); chiaviIgnote++; }
  }
  for (const c of scene.choices || []) {
    for (const k of Object.keys(c)) {
      if (!CHIAVI_SCELTA.has(k)) { fail(`scena "${id}", scelta "${String(c.text).slice(0, 30)}…": chiave sconosciuta "${k}"`); chiaviIgnote++; }
    }
    for (const k of Object.keys(c.requires || {})) {
      if (!CHIAVI_REQUIRES.has(k)) { fail(`scena "${id}": requires.${k} sconosciuto`); chiaviIgnote++; }
    }
    for (const k of Object.keys(c.check || {})) {
      if (!CHIAVI_CHECK.has(k)) { fail(`scena "${id}": check.${k} sconosciuto`); chiaviIgnote++; }
    }
  }
}
if (!chiaviIgnote) { ok(); console.log(`  ✔ nessuna chiave fuori whitelist (${CHIAVI_SCENA.size} di scena, ${CHIAVI_SCELTA.size} di scelta, ${CHIAVI_REQUIRES.size} requires, ${CHIAVI_CHECK.size} check)`); }

// CONTROPROVA: ogni chiave ammessa deve risultare LETTA da qualche parte nel codice
const usata = (pref, k) => new RegExp(`\\b${pref}\\.${k}\\b`).test(codice);
let morte = 0;
for (const k of CHIAVI_SCENA) if (!usata('scene', k) && !usata('s', k) && !usata('sc', k)) { warn(`chiave di SCENA "${k}" ammessa dal validatore ma mai letta dal codice (campo morto?)`); morte++; }
for (const k of CHIAVI_SCELTA) if (!usata('c', k) && !usata('choice', k)) { warn(`chiave di SCELTA "${k}" ammessa ma mai letta dal codice (campo morto?)`); morte++; }
for (const k of CHIAVI_REQUIRES) if (!usata('requires', k)) { warn(`requires.${k} ammesso ma mai letto dal codice`); morte++; }
for (const k of CHIAVI_CHECK) if (!usata('check', k)) { warn(`check.${k} ammesso ma mai letto dal codice`); morte++; }
if (!morte) { ok(); console.log('  ✔ controprova: tutte le chiavi ammesse sono consumate dal motore'); }

/* ---------- se cadete tutti: ripartenza dal checkpoint (ago 2026) ----------
   Il motore promette due cose: (1) ogni sconfitta finisce in una scena che
   RIMETTE IN PIEDI il gruppo, (2) dalla seconda caduta nello stesso scontro
   compare la scelta di tornare all'ultimo checkpoint. Se una delle due non è
   implementata, la promessa è una bugia: qui si verifica staticamente. */
section('Ripartenza dal checkpoint (se cadete tutti)');

const engineTxt = readFileSync(join(root, 'js/engine.js'), 'utf8');
const combatTxt = readFileSync(join(root, 'js/combat.js'), 'utf8');
let cpProblemi = 0;

// 1. ogni destinazione di sconfitta esiste ed è una scena di recupero (fullHeal)
const destSconfitta = new Set(Object.values(CAMPAIGN).filter(s => s.combat && s.combat.defeat).map(s => s.combat.defeat));
for (const d of destSconfitta) {
  if (!CAMPAIGN[d]) { fail(`scena di sconfitta "${d}" inesistente`); cpProblemi++; continue; }
  if (!CAMPAIGN[d].fullHeal) {
    fail(`scena di sconfitta "${d}" non rimette in piedi il gruppo (manca fullHeal: true): il gruppo resterebbe a terra`);
    cpProblemi++;
  }
}

// 2. il motore implementa DAVVERO la ripartenza e la espone
for (const [frammento, cosa] of [
  ['function riprendiDaCheckpoint', 'la funzione riprendiDaCheckpoint()'],
  ['lastCheckpoint', 'lo snapshot G.lastCheckpoint'],
  ['function registraCaduta', 'il contatore delle cadute registraCaduta()'],
  ['btn-checkpoint-return', 'la SCELTA visibile di ritorno al checkpoint nelle scene di sconfitta'],
  ['riprendiDaCheckpoint, registraCaduta, haCheckpoint', 'l\'export di riprendiDaCheckpoint/registraCaduta/haCheckpoint'],
]) {
  if (!engineTxt.includes(frammento)) { fail(`js/engine.js: manca ${cosa}`); cpProblemi++; }
}
if (!combatTxt.includes('Engine.registraCaduta')) { fail('js/combat.js: defeat() non registra la caduta (Engine.registraCaduta)'); cpProblemi++; }

// 3. lo snapshot deve riavvolgere anche le scene VISITATE, o i flag one-shot si perdono
if (!/enteredScenes:\s*G\.enteredScenes/.test(engineTxt)) {
  fail('js/engine.js: lo snapshot del checkpoint non salva enteredScenes → i flag one-shot delle scene già viste non si rimetterebbero mai (soft-lock)');
  cpProblemi++;
}

// 4. i flag di CHECKPOINT_FLAGS devono essere impostabili da una scena RAGGIUNGIBILE
const cpFlags = (readFileSync(join(root, 'js/campaign.js'), 'utf8').match(/const CHECKPOINT_FLAGS\s*=\s*\[([^\]]*)\]/) || [])[1];
if (cpFlags) {
  const lista = [...cpFlags.matchAll(/'([a-z_0-9]+)'/g)].map(m => m[1]);
  for (const f of lista) {
    const sorgenti = Object.entries(CAMPAIGN).filter(([, s]) => s.sets && s.sets[f]).map(([id]) => id);
    if (!sorgenti.length) { fail(`CHECKPOINT_FLAGS: "${f}" non è impostato da NESSUNA scena (checkpoint morto)`); cpProblemi++; }
    else if (!sorgenti.some(id => reachable.has(id))) { fail(`CHECKPOINT_FLAGS: "${f}" è impostato solo da scene irraggiungibili`); cpProblemi++; }
  }
  console.log(`  ✔ ${lista.length} checkpoint (CHECKPOINT_FLAGS), tutti impostabili da scene raggiungibili`);
} else {
  console.log('  ℹ nessun CHECKPOINT_FLAGS: il punto di ripartenza è l\'ultima scena di riposo (fullHeal/recharge) visitata');
}

if (!cpProblemi) { ok(); console.log(`  ✔ ${destSconfitta.size} scene di sconfitta valide (tutte rimettono in piedi il gruppo) e ripartenza dal checkpoint implementata ed esposta`); }


/* ---------- densità: la metrica GIUSTA ---------- */
section('Densità (nodi di decisione, non scene)');

/* Storia di questa sezione: la soglia della serie era "corridoi ≤15%", dove corridoio
   = scena con una sola scelta. Misurandola sui cinque giochi è venuto fuori che
   Casa stava al 27% e Relais al 20% — ma leggendo le scene, quasi tutte erano BATTUTE:
   sotto-scene che chiudono un momento, cioè buona scrittura. Inseguire quel numero
   porta ad aggiungere seconde scelte finte, che è esattamente il difetto peggiore
   della serie. Quindi la metrica è cambiata, e misura due cose che contano davvero:

   1. SCELTE PER NODO DI DECISIONE: la media sulle sole scene con ≥2 scelte. È quanto
      è ricca una decisione quando il gioco te ne offre una. Soglia: ≥2.2.
   2. CORRIDOI STERILI: scene con una sola scelta E nessun effetto (niente item, sets,
      check, cure, danni, valuta, combat, minigioco, finale). Quelle sì sono
      riempitivo. Soglia: 0, o pochissime e giustificate.

   Il numero grezzo di corridoi resta stampato, ma come informazione, non come voto. */
{
  const idsTot = Object.keys(CAMPAIGN);
  const CAMBIA_SCENA = ['item', 'item2', 'sets', 'heal', 'damage', 'gold', 'goldLoss',
    'fullHeal', 'recharge', 'attenzione', 'unlockHero', 'freeAll', 'reviveAll',
    'killRoller', 'poisonRoller', 'captureRoller'];
  const CAMBIA_SCELTA = ['item', 'item2', 'sets', 'check', 'heal', 'damage', 'gold',
    'goldLoss', 'removeItem', 'removeItem2', 'sacrifice', 'requiresGold'];
  let scelteTot = 0, nodi = 0, scelteNodi = 0, corridoi = 0;
  const sterili = [];
  for (const [id, s] of Object.entries(CAMPAIGN)) {
    const ch = s.choices || [];
    scelteTot += ch.length;
    if (ch.length >= 2) { nodi++; scelteNodi += ch.length; continue; }
    if (ch.length !== 1) continue;
    corridoi++;
    const cambiaScena = CAMBIA_SCENA.some(k => s[k] !== undefined && s[k] !== false && s[k] !== 0);
    const c = ch[0] || {};
    const cambiaScelta = CAMBIA_SCELTA.some(k => c[k] !== undefined && c[k] !== false && c[k] !== 0);
    if (!cambiaScena && !cambiaScelta && !s.combat && !s.minigame && !s.ending) sterili.push(id);
  }
  const perNodo = nodi ? scelteNodi / nodi : 0;
  console.log(`  ℹ ${idsTot.length} scene · ${nodi} nodi di decisione (${Math.round(nodi / idsTot.length * 100)}%) · ${corridoi} scene-battuta con una sola uscita`);
  console.log(`  ℹ scelte per scena: ${(scelteTot / idsTot.length).toFixed(2)} (numero diluito dalle battute) · scelte per NODO: ${perNodo.toFixed(2)}`);
  if (perNodo < 2.2) fail(`solo ${perNodo.toFixed(2)} scelte per nodo di decisione: quando il gioco offre una scelta, deve offrirne almeno 2,2 in media`);
  else ok();
  if (sterili.length) {
    for (const id of sterili) warn(`corridoio STERILE "${id}": una sola uscita e nessun effetto — o gli si dà un effetto, o gli si dà una seconda azione vera, o si fonde con la scena accanto`);
    if (sterili.length > Math.max(3, Math.round(idsTot.length * 0.02))) {
      fail(`${sterili.length} corridoi sterili su ${idsTot.length} scene: è riempitivo, non ritmo`);
    }
  } else { ok(); console.log('  ✔ nessun corridoio sterile: ogni scena con una sola uscita cambia comunque qualcosa'); }
}

/* ---------- 44. testo dentro un canvas ----------
   Un canvas da 960 px mostrato a 355 rende ogni parola scritta dentro un impasto: il
   testo va in DOM, nel canvas restano numeri, icone e barre. Il controllo cerca ogni
   ctx.font sotto i 20px e guarda cosa ci si disegna: una stringa fissa (un'emoji, un
   simbolo) va bene, una stringa CALCOLATA — un nome, un'etichetta — è un errore. */
function testTestoNelCanvas() {
  console.log('\n▸ Testo dentro i canvas');
  /* Solo i canvas a misura FISSA: quelli di index.html (combattimento 960×380, pianta
     720×480) vengono mostrati a un terzo della loro larghezza e tutto dentro rimpicciolisce.
     js/minigames.js è escluso di proposito: là il canvas si dimensiona sulla finestra
     (`Math.min(720, document.body.clientWidth - 60)`), quindi è 1:1 e 12px resta 12px. */
  const files = ['js/combat.js', 'js/engine.js'];
  let sospetti = 0;
  for (const f of files) {
    let src;
    try { src = readFileSync(new URL('../' + f, import.meta.url), 'utf8'); } catch { continue; }
    const righe = src.split('\n');
    righe.forEach((r, i) => {
      const m = r.match(/ctx\.font\s*=\s*["'`](\d+)px/);
      if (!m || Number(m[1]) >= 20) return;
      const seguito = righe.slice(i, i + 3).join(' ');
      const dis = seguito.match(/ctx\.fillText\(\s*([^,]+),/);
      if (!dis) return;
      const arg = dis[1].trim();
      const parola = /\.(name|label|short|titolo|nome|testo|caption)\b/.test(arg);
      if (parola) {
        fail(`${f}:${i + 1} disegna un NOME a ${m[1]}px dentro un canvas a misura fissa (${arg.slice(0, 40)}): `
           + 'il canvas si rimpicciolisce sul telefono e la parola diventa illeggibile — va in DOM');
        sospetti++;
      }
    });
  }
  if (!sospetti) { ok(); console.log('  ✔ nel canvas solo numeri, icone e simboli: le parole stanno in DOM'); }
}
testTestoNelCanvas();

/* ---------- 45. il retro degli oggetti ----------
   Il bottone «Ispeziona» compare solo se l'oggetto ha un `lore`. Prima di agosto 2026 il
   bottone c'era in quattro giochi su cinque e quasi nessun oggetto aveva qualcosa da
   leggere: una funzione costruita e vuota, cioè la stessa bugia di una valuta che non
   compra niente. Il controllo tiene insieme le due metà — la funzione e il contenuto —
   e rifiuta i retro-stub da una riga. NON pretende un lore su ogni oggetto: un pezzo di
   nastro isolante che serve solo a costruire altro non ha un secondo strato, e inventarlo
   sarebbe riempitivo. */
function testRetroOggetti() {
  console.log('\n▸ Il retro degli oggetti');
  const chiavi = Object.keys(ITEMS);
  const conLore = chiavi.filter(k => ITEMS[k].lore);
  let motore = '';
  try { motore = readFileSync(new URL('../js/engine.js', import.meta.url), 'utf8'); } catch {}
  const haFunzione = /function inspectItem/.test(motore);
  const haBottone = /Engine\.inspectItem\(/.test(motore);

  if (conLore.length && !(haFunzione && haBottone)) {
    fail(`${conLore.length} oggetti hanno un retro ma l'interfaccia non lo mostra `
       + `(inspectItem: ${haFunzione ? 'sì' : 'NO'}, bottone nello zaino: ${haBottone ? 'sì' : 'NO'})`);
  } else if (haBottone) {
    const quota = conLore.length / chiavi.length;
    if (conLore.length < 8 || quota < 0.20) {
      fail(`il bottone Ispeziona esiste ma solo ${conLore.length} oggetti su ${chiavi.length} `
         + `(${Math.round(quota * 100)}%) hanno qualcosa da leggere: una funzione quasi vuota `
         + 'promette e non mantiene');
    } else {
      ok(); console.log(`  ✔ ${conLore.length}/${chiavi.length} oggetti (${Math.round(quota * 100)}%) hanno un retro leggibile`);
    }
  } else { ok(); console.log('  ✔ nessun retro e nessun bottone: coerente'); }

  const corti = conLore.filter(k => ITEMS[k].lore.trim().split(/\s+/).length < 35);
  if (corti.length) fail(`retro troppo corti (sotto le 35 parole), sono stub: ${corti.join(', ')}`);
  else if (conLore.length) { ok(); console.log('  ✔ nessun retro da una riga'); }

  const vietate = conLore.filter(k => /inquietant|misterios|agghiacciant|raccapricciant|indicibil/i.test(ITEMS[k].lore));
  if (vietate.length) fail(`parole vietate nel retro di: ${vietate.join(', ')} (l'orrore sta nel dettaglio, non nell'aggettivo)`);
  else if (conLore.length) { ok(); console.log('  ✔ nessun aggettivo che fa il lavoro al posto del dettaglio'); }
}
testRetroOggetti();

/* ---------- 46. scelte chiuse dietro un flag che nessuno imposta ----------
   Trovato così (agosto 2026) un'intera scena di Corona — k_torvald, «da cuoco a cuoco»
   con Monsieur Ragoût — chiusa dietro `torvald_presente`, un flag che nessuna scena e
   nessun modulo impostava mai: scritta, testata, e invisibile a chiunque abbia giocato.
   Il controllo guarda anche fuori da campaign.js, perché i premi dei misteri e delle
   ricette sono flag impostati dai loro moduli. */
function testFlagRichiestiMaiImpostati() {
  console.log('\n▸ Scelte chiuse dietro flag inesistenti');
  const impostati = new Set();
  for (const s of Object.values(CAMPAIGN)) {
    for (const f of Object.keys(s.sets || {})) impostati.add(f);
    for (const c of (s.choices || [])) {
      for (const f of Object.keys(c.sets || {})) impostati.add(f);
      for (const f of Object.keys(c.sacrificeSets || {})) impostati.add(f);
    }
  }
  if (typeof RECIPES !== 'undefined') for (const r of RECIPES) if (r.flag) impostati.add(r.flag);
  if (typeof MISTERI !== 'undefined') for (const m of MISTERI) if (m.premio && m.premio.flag) impostati.add(m.premio.flag);
  for (const f of ['js/misteri.js', 'js/crafting.js', 'js/engine.js', 'js/combat.js', 'js/minigames.js']) {
    let src = '';
    try { src = readFileSync(new URL('../' + f, import.meta.url), 'utf8'); } catch { continue; }
    for (const m of src.matchAll(/G\.flags\[['"]([a-z0-9_]+)['"]\]\s*=/gi)) impostati.add(m[1]);
  }
  /* I FLAG DEI MINIGIOCHI: la scansione trova solo le chiavi LETTERALI, e i minigiochi
     scrivono `G.flags[cfg.extraFlag || '...'] = true` — una chiave calcolata, che nessuna
     espressione regolare puo vedere. Senza questo, un flag assegnato davvero veniva
     dichiarato «mai impostato» e la prima scelta che lo usava passava per contenuto
     irraggiungibile: un falso positivo, che e il tipo peggiore. */
  for (const s2 of Object.values(CAMPAIGN)) {
    const cfg = s2.minigame && s2.minigame.config;
    if (cfg && cfg.extraFlag) impostati.add(cfg.extraFlag);
    if (cfg && cfg.flag) impostati.add(cfg.flag);
  }
  impostati.add('ha_visto_giu');
  const morti = new Map(), inutili = new Map();
  for (const [id, s] of Object.entries(CAMPAIGN)) for (const c of (s.choices || [])) {
    const r = c.requires; if (!r) continue;
    for (const f of [r.flag, r.flag2, ...(r.flagAny || [])]) {
      if (!f || impostati.has(f)) continue;
      if (!morti.has(f)) morti.set(f, []);
      morti.get(f).push(id);
    }
    if (r.notFlag && !impostati.has(r.notFlag)) {
      if (!inutili.has(r.notFlag)) inutili.set(r.notFlag, []);
      inutili.get(r.notFlag).push(id);
    }
  }
  if (morti.size) {
    for (const [f, scene] of morti) {
      fail(`flag "${f}" richiesto da una scelta ma MAI impostato da nessuna scena né da nessun modulo: `
         + `contenuto irraggiungibile in ${scene.join(', ')}`);
    }
  } else { ok(); console.log('  ✔ ogni scelta condizionata può davvero comparire'); }
  for (const [f, scene] of inutili) {
    warn(`notFlag "${f}" non è mai impostato da nessuno: la condizione è sempre vera `
       + `(intenzione morta in ${scene.join(', ')})`);
  }
}
testFlagRichiestiMaiImpostati();

/* ---------- il link a Pages nel README ----------
   Regola del committente, 23 agosto 2026: «nei README delle varie repo ci deve
   sempre essere il link a Pages, perché da mobile altrimenti non lo riesco a
   trovare facilmente». Da telefono la scheda di una repo mostra il README e non
   il pannello di destra: se il link non sta nelle prime righe, il gioco non si
   raggiunge. Pandataria era il caso peggiore — linkava gli altri quattro giochi
   e non sé stessa. Deve stare in alto, non solo esistere. */
function testLinkPagesNelReadme() {
  const REPO = 'dnd-corona-di-mezzanotte';
  let righe;
  try { righe = readFileSync(join(root, 'README.md'), 'utf8').split('\n'); }
  catch { fail('manca il README'); return; }
  const atteso = `https://galiv04.github.io/${REPO}/`;
  const dove = righe.findIndex(r => r.includes(atteso));
  if (dove < 0) fail(`il README non contiene il link a Pages (${atteso})`);
  else if (dove > 5) fail(`il link a Pages sta alla riga ${dove + 1} del README: da mobile `
      + 'non si trova. Va nelle prime righe, subito sotto il titolo.');
  else { ok(); console.log(`  ✔ link a Pages nel README, riga ${dove + 1}`); }
}
testLinkPagesNelReadme();

/* ---------- le schede dei luoghi (il pulsante 🔎) ----------
   Richiesta del committente: ogni scena grafica ha un pulsante che spiega cosa si
   sta guardando. Una scheda mancante spegne il pulsante in silenzio — cioè la
   feature esiste per alcune scene e non per altre, e il giocatore non capisce
   perché. Quindi: ogni painter (tranne `titolo`, che è la copertina) ha la sua
   scheda, con tutte le sezioni piene e almeno tre elementi da guardare. */
function testSchedeDeiLuoghi() {
  let luoghiSrc;
  try { luoghiSrc = readFileSync(join(root, 'js/luoghi.js'), 'utf8'); }
  catch { fail('manca js/luoghi.js: il pulsante che spiega la scena non ha dati'); return; }
  const ctxL = {};
  vm.createContext(ctxL);
  try { vm.runInContext(luoghiSrc + ';globalThis.__L = Luoghi;', ctxL); }
  catch (e) { fail('js/luoghi.js non si carica: ' + e.message); return; }
  const schede = ctxL.__L.LUOGHI;
  /* Le chiavi VERE dei painter, prese dal modulo caricato — non con una regex sul
     sorgente. La regex che usavo pretendeva un nome tutto minuscolo, e nove painter
     della serie si chiamano in camelCase (salaDaPranzo, torreInterno, …): il controllo
     non pretendeva la loro scheda, e in quelle scene il pulsante 🔎 restava spento in
     silenzio. Cioè esattamente il difetto che questo controllo esiste per impedire. */
  const cS = {};
  vm.createContext(cS);
  let srcS = '';
  for (const f of ['js/sprites.js', 'js/scenes.js']) {
    try { srcS += readFileSync(join(root, f), 'utf8') + '\n;\n'; } catch { /* niente */ }
  }
  vm.runInContext(srcS + ';globalThis.__S = Scenes;', cS);
  const painters = Object.keys(cS.__S.painters);
  /* Un fondale che nessuna scena usa non ha bisogno di scheda: il pulsante non
     comparirà mai. Ma è contenuto morto — un painter scritto e mai messo in scena —
     e va detto, non nascosto. In un gioco della serie ce n'era uno. */
  const usati = new Set(Object.values(CAMPAIGN).map(s => s.location).filter(Boolean));
  const morti = painters.filter(p => p !== 'titolo' && !usati.has(p));
  if (morti.length) warn(`fondali dipinti che nessuna scena usa (contenuto morto): ${morti.join(', ')}`);
  const senza = painters.filter(p => p !== 'titolo' && usati.has(p) && !schede[p]);
  if (senza.length) fail(`fondali senza scheda del luogo (pulsante spento): ${senza.join(', ')}`);
  else { ok(); console.log(`  ✔ scheda del luogo per tutti i ${painters.length - 1 - morti.length} fondali usati`); }
  const orfane = Object.keys(schede).filter(k => !painters.includes(k));
  if (orfane.length) warn(`schede di luoghi che non hanno un fondale: ${orfane.join(', ')}`);
  const magre = [];
  for (const [k, L] of Object.entries(schede)) {
    if (!L.titolo || !L.ora || !L.storia || !L.gioco) magre.push(`${k} (sezione vuota)`);
    else if (!Array.isArray(L.guarda) || L.guarda.length < 3) magre.push(`${k} (meno di 3 cose da guardare)`);
    else if (L.storia.length < 120 || L.gioco.length < 80) magre.push(`${k} (storia o gioco troppo corti)`);
  }
  if (magre.length) fail(`schede che promettono e non mantengono: ${magre.join(', ')}`);
  else { ok(); console.log('  ✔ ogni scheda ha le tre sezioni piene'); }
}
testSchedeDeiLuoghi();

/* ---------- buchi nei fondali ----------
   Nessuno sfondo deve lasciare zone che il riquadro mostra NERE, né perché non le
   dipinge nessuno né perché ci passano solo colori semitrasparenti che non arrivano a
   coprire. Sono due difetti diversi e sullo schermo si vedono uguale.
   Trovati così: una fessura di 52×160 fra due case a Ventotene (rimasta mesi, perché
   una fessura nera fra due case sembra un vicolo), una striscia di 292×9 fra il mare e
   la fiancata di una barca, e una fascia di 495×105 in mezzo all'ULTIMA immagine di un
   altro gioco. L'occhio le aveva lasciate passare tutte e tre. */
function testBuchiNeiFondali() {
  const c = {};
  vm.createContext(c);
  let src = '';
  for (const f of ['js/sprites.js', 'js/scenes.js']) {
    try { src += readFileSync(join(root, f), 'utf8') + '\n;\n'; } catch { /* non tutti i giochi hanno sprites */ }
  }
  try { vm.runInContext(src + ';globalThis.__S = Scenes;', c); }
  catch (e) { fail('non riesco a caricare js/scenes.js per cercare i buchi: ' + e.message); return; }
  const S = c.__S;
  const esito = cercaBuchi(S.painters, { setDepth: S.setDepth || S.setEclipse });
  /* Il nero pieno: avviso, non errore. Un fondale con una macchia di (0,0,0) opaco quasi
     sempre ha un colore calcolato male (shade() richiamato su un 'rgb(...)' dà NaN e
     quindi zero: un nero VALIDO che nessun controllo sui colori può vedere). Ma il nero
     voluto esiste — la stiva di un relitto a quarantacinque metri, dove la torcia entra
     e non torna indietro — quindi qui si guarda e si decide, non si blocca. */
  /* Le deroghe si guardano una volta, si scrivono con la ragione, e non tornano piu'.
     Un avviso che si sa di dover ignorare e' peggio di nessun avviso: si impara a saltare
     la riga, e il giorno che sotto c'e' un difetto vero si salta anche quello. */
  for (const n of cercaNeroPieno(S.painters, { setDepth: S.setDepth || S.setEclipse })) {
    if (NERO_VOLUTO[n.nome]) continue;
    warn(`il fondale "${n.nome}" ha ${n.pixel} px di nero pieno (0,0,0): `
       + 'se non è voluto è un colore calcolato male — guardalo col tool dei PNG. '
       + 'Se è voluto, scrivilo in NERO_VOLUTO con la ragione');
  }
  if (!esito.length) {
    ok(); console.log(`  ✔ nessuna macchia scoperta in ${Object.keys(S.painters).length - 1} fondali`);
    return;
  }
  for (const e of esito) {
    if (e.errore) { fail(`il fondale "${e.nome}" esplode: ${e.errore}`); continue; }
    const dove = e.buchi.map(b => `${b.w}×${b.h} a (${b.x},${b.y})`
      + (b.maiDipinto ? ' mai dipinto' : ` coperto solo al ${(b.copertura * 100) | 0}%`)).join(', ');
    fail(`il fondale "${e.nome}" mostra il nero del riquadro: ${dove}`);
  }
}
testBuchiNeiFondali();

/* ---------- esito ---------- */

/* ---------- un boss non deve essere invincibile per costruzione ---------- */
section('Bilanciamento: nessuno uccide più veloce di quanto muoia');

/* Il numero che rende un nemico invincibile è il DANNO, non i punti vita: se
   uccide l'eroe più fragile in due colpi e ne servono otto per abbatterlo, la
   partita non si può vincere — e nei test il sintomo è un «loop di checkpoint»,
   cioè sembra un problema di struttura e non di numeri. (Lezione 27.) */
{
  const pvMin = Math.min(...HEROES.map(h => h.maxHp));
  let squilibrati = 0;
  for (const [key, b] of Object.entries(BESTIARY)) {
    if (!b.attack || !b.attack.dice) continue;
    const [n, facce] = b.attack.dice;
    const danno = n * (facce + 1) / 2 + (b.attack.plus || 0);
    const colpi = Math.ceil(pvMin / danno);
    if (colpi < 3) {
      const msg = `nemico "${key}": ${danno.toFixed(1)} danni medi uccidono l'eroe più fragile (${pvMin} PV) in ${colpi} colpi`;
      if (b.boss || b.isBoss) { fail(msg + ' — e è un BOSS, quindi ci vogliono molti turni per abbatterlo: invincibile per costruzione'); squilibrati++; }
      else warn(msg);
    }
  }
  /* e i gruppi: due nemici da 6 danni sono 12 al round */
  const tesi = [];
  for (const [id, scene] of combats) {
    const vivi = (scene.combat.enemies || []).filter(e => BESTIARY[e]);
    if (vivi.length < 2) continue;
    const dprTot = vivi.reduce((t, e) => {
      const b = BESTIARY[e], [n, facce] = b.attack.dice;
      return t + n * (facce + 1) / 2 + (b.attack.plus || 0);
    }, 0);
    /* Il danno di gruppo, MA diviso fra quanti eroi lo prendono. La prima stesura di
       questo controllo confrontava il danno TOTALE del gruppo nemico coi PV dell'eroe piu
       fragile, cioe misurava un caso che in partita non capita quasi mai: tutti i nemici
       che picchiano sempre e solo la stessa persona. Con l'IA `random` — che e quella di
       quasi tutto il bestiario — il danno si spalma, e il numero giusto e quello per
       testa. Risultato della prima stesura: tredici avvisi identici per gioco, sempre lo
       stesso, che nessuno leggeva piu. Un allarme che si impara a ignorare e peggio di
       nessun allarme (lezione 71).
       Ora si guarda il danno PER EROE, e si resta severi dove conta: se qualche nemico
       concentra il fuoco (ai diverso da random) il caso pessimo torna a essere il totale,
       e i boss hanno il loro controllo a parte, piu stretto, qualche riga sopra. */
    const eroiInCampo = Math.max(1, (HEROES.filter ? HEROES.filter(h => !h.locked) : Object.values(HEROES)).length - 1);
    const concentrano = vivi.some(e => BESTIARY[e].ai && BESTIARY[e].ai !== 'random');
    const perEroe = concentrano ? dprTot : dprTot / Math.min(3, eroiInCampo);
    const rounds = Math.ceil(pvMin / perEroe);
    /* Severita proporzionata. La regola del progetto e «l'eroe piu fragile regge almeno
       TRE COLPI», e quella la verifica il controllo per-nemico qui sopra, che passa. Questo
       secondo controllo guarda il gruppo, ed e un'euristica: contava come debito anche le
       due-round, cioe tredici avvisi identici per gioco che nessuno leggeva piu. Ma due
       round, con la Difesa totale, le cure e il ritorno dal checkpoint, sono tensione e non
       un difetto. Un round solo, invece, e un errore di progetto: il giocatore perde un eroe
       prima di poter reagire. Quindi: allarme dove un round basta, e per il resto UN NUMERO,
       che si guarda quando si vuole guardare. */
    if (rounds < 2) {
      warn(`combattimento "${id}": ${vivi.length} nemici, ${dprTot.toFixed(1)} danni al round`
         + ` = ${perEroe.toFixed(1)} per eroe${concentrano ? ' (concentrano il fuoco)' : ''}`
         + ` contro ${pvMin} PV: l'eroe piu fragile cade in UN ROUND, prima di poter reagire`);
    } else if (rounds === 2) tesi.push(id);
  }
  if (tesi.length) {
    console.log(`  ℹ ${tesi.length} scontri in cui l'eroe piu fragile cadrebbe in due round `
      + `se i nemici lo prendessero di mira tutti insieme: ${tesi.join(', ')}. `
      + `Non e debito — con la Difesa totale, le cure e il checkpoint due round sono tensione — `
      + `ma se questo numero cresce, la difficolta si sta spostando da sola.`);
  }
  if (!squilibrati) { ok(); console.log(`  ✔ nessun boss uccide l'eroe più fragile in meno di 3 colpi (il più fragile ha ${pvMin} PV)`); }
}

console.log('\n' + '═'.repeat(50));
if (failures === 0) {
  console.log(`✅ TUTTI I TEST SUPERATI (${passed} controlli, ${warnings} avvisi non bloccanti)`);
  process.exit(0);
} else {
  console.log(`❌ ${failures} TEST FALLITI (${warnings} avvisi)`);
  process.exit(1);
}
