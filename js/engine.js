/* ============ ENGINE — stato di gioco, scene, prove, modali ============ */

let G = null; // stato di gioco globale

const Engine = (() => {

  const SLOTS = 3;
  const $ = id => document.getElementById(id);

  /* ---------- profili utente (ognuno ha i suoi 3 slot) ---------- */

  const PROFILES_KEY = 'corona-profiles';
  const CURRENT_PROFILE_KEY = 'corona-current-profile';
  const DEFAULT_PROFILE = 'Compagnia di Brindolo';

  function listProfiles() {
    try {
      const raw = localStorage.getItem(PROFILES_KEY);
      const list = raw ? JSON.parse(raw) : [];
      return list.length ? list : [DEFAULT_PROFILE];
    } catch (e) { return [DEFAULT_PROFILE]; }
  }

  function saveProfiles(list) {
    try { localStorage.setItem(PROFILES_KEY, JSON.stringify(list)); } catch (e) {}
  }

  function currentProfile() {
    try { return localStorage.getItem(CURRENT_PROFILE_KEY) || DEFAULT_PROFILE; } catch (e) { return DEFAULT_PROFILE; }
  }

  function setCurrentProfile(name) {
    try { localStorage.setItem(CURRENT_PROFILE_KEY, name); } catch (e) {}
    const list = listProfiles();
    if (!list.includes(name)) { list.push(name); saveProfiles(list); }
  }

  const slotKey = (n, profile = null) => `corona-save-${encodeURIComponent(profile || currentProfile())}-slot-${n}`;

  // migrazione dai vecchi formati (salvataggio singolo e slot senza profilo)
  try {
    const legacy = localStorage.getItem('corona-di-mezzanotte-save-v1');
    if (legacy && !localStorage.getItem(`corona-save-slot-1`)) {
      localStorage.setItem('corona-save-slot-1', legacy);
      localStorage.removeItem('corona-di-mezzanotte-save-v1');
    }
    for (let n = 1; n <= SLOTS; n++) {
      const old = localStorage.getItem(`corona-save-slot-${n}`);
      if (old && !localStorage.getItem(slotKey(n, DEFAULT_PROFILE))) {
        localStorage.setItem(slotKey(n, DEFAULT_PROFILE), old);
        localStorage.removeItem(`corona-save-slot-${n}`);
      }
    }
    if (!localStorage.getItem(PROFILES_KEY)) saveProfiles([DEFAULT_PROFILE]);
    if (!localStorage.getItem(CURRENT_PROFILE_KEY)) setCurrentProfile(DEFAULT_PROFILE);
  } catch (e) {}

  /* ---------- stato ---------- */

  function newGame(selection, slot = null, difficulty = 'normale') {
    // selection: [{heroId, player}]
    if (slot == null) slot = firstFreeSlot() || 1;
    const solo = selection.length === 1;
    G = {
      party: selection.map(s => {
        const base = HEROES.find(h => h.id === s.heroId);
        const hero = { ...JSON.parse(JSON.stringify(base)), hp: base.maxHp, down: false, player: s.player || '' };
        if (solo) {
          // Modalità Eroe Solitario: più resistente, più risorse
          hero.maxHp += 10; hero.hp = hero.maxHp; hero.ac += 1;
          for (const ab of hero.abilities) ab.uses += 1;
        }
        return hero;
      }),
      uses: {},
      gold: solo ? 45 : 30,
      inventory: solo ? ['pozione_cura', 'pozione_cura'] : [],
      flags: solo ? { solo: true } : {},
      sceneId: CAMPAIGN_START,
      usedChoices: {},   // sceneId -> [testi scelti "once"]
      enteredScenes: {}, // sceneId -> true (per effetti one-shot)
      lastCombatSceneId: null,
      lastCheckpoint: null, // { sceneId, snapshot } — l'ultimo riposo vero
      koCount: {},          // sceneId del combattimento -> quante volte ci siete caduti
      history: [],       // tappe della storia (per il riepilogo alla ripresa)
      seenEnemies: [],   // nemici incontrati (per il bestiario)
      slot,
      difficulty,
      stats: { combats: 0, checksPassed: 0, checksFailed: 0, scenes: 0, start: Date.now() },
    };
    for (const h of G.party) {
      G.uses[h.id] = {};
      for (const ab of h.abilities) G.uses[h.id][ab.id] = ab.uses;
      // scene speciali riservate a chi ha certi eroi in squadra
      G.flags[h.id + '_presente'] = true;
    }
    saveGame();
    gotoScene(CAMPAIGN_START);
    {
      const box = $('modal-generic-content');
      let html = `<h2>📖 La Storia</h2>` + (typeof RULES_STORY !== 'undefined' ? RULES_STORY : '');
      if (solo) {
        html += `<h2 style="margin-top:16px">🌟 Modalità Eroe Solitario</h2>
        <p style="margin-bottom:12px">${G.party[0].name} affronta l'avventura DA SOLO. Il destino, impressionato, concede:</p>
        <div class="ability-box"><span class="ability-name">❤ +10 PV massimi e +1 CA</span></div>
        <div class="ability-box"><span class="ability-name">✨ +1 uso a ogni abilità speciale</span></div>
        <div class="ability-box"><span class="ability-name">🧪 2 Pozioni di Cura e +15 monete d'oro di partenza</span></div>
        <p style="color:var(--text-dim);margin-top:10px">Consiglio da DM: comprate pozioni. TANTE pozioni.</p>`;
      }
      html += `<button class="btn btn-gold" style="margin-top:12px" onclick="document.getElementById('modal-generic').classList.add('hidden')">⚔ Che l'avventura abbia inizio</button>`;
      box.innerHTML = html;
      $('modal-generic').classList.remove('hidden');
    }
  }

  function saveGame() {
    if (!G) return;
    G.savedAt = Date.now();
    try { localStorage.setItem(slotKey(G.slot || 1), JSON.stringify(G)); } catch (e) { /* storage pieno o disabilitato */ }
  }

  function listSaves(profile = null) {
    const out = [];
    for (let n = 1; n <= SLOTS; n++) {
      try {
        const raw = localStorage.getItem(slotKey(n, profile));
        if (!raw) { out.push(null); continue; }
        const g = JSON.parse(raw);
        const scene = CAMPAIGN[g.sceneId];
        out.push({
          slot: n,
          heroes: (g.party || []).map(h => h.name.split(' ')[0]).join(', '),
          players: (g.party || []).map(h => h.player).filter(Boolean).join(', '),
          caption: scene ? scene.caption : '—',
          gold: g.gold,
          savedAt: g.savedAt || null,
          ended: !!(scene && scene.ending),
        });
      } catch (e) { out.push(null); }
    }
    return out;
  }

  function hasSave() { return listSaves().some(Boolean); }

  function firstFreeSlot() {
    const saves = listSaves();
    for (let n = 1; n <= SLOTS; n++) if (!saves[n - 1]) return n;
    return null;
  }

  function loadGame(slot = null) {
    try {
      if (slot == null) slot = listSaves().findIndex(Boolean) + 1;
      if (!slot) return false;
      const raw = localStorage.getItem(slotKey(slot));
      if (!raw) return false;
      G = JSON.parse(raw);
      G.slot = slot;
      if (!CAMPAIGN[G.sceneId]) G.sceneId = CAMPAIGN_START;
      renderScene(CAMPAIGN[G.sceneId], true);
      showRecap();
      return true;
    } catch (e) { return false; }
  }

  // "La storia finora": riepilogo alla ripresa della partita
  function showRecap() {
    if (!G || !G.history || G.history.length < 2) return;
    const beats = G.history.slice(-6).map(c => `<div class="ability-box" style="border-left-color:var(--gold)"><div class="ability-desc">📖 ${c}</div></div>`).join('');
    const box = $('modal-generic-content');
    box.innerHTML = `<h2>📜 La storia finora...</h2>
      <p style="color:var(--text-dim);margin-bottom:10px">Bentornati, eroi! La compagnia (${G.party.map(h => h.name.split(' ')[0]).join(', ')}) ha ${G.gold} monete d'oro. Le ultime tappe:</p>
      ${beats}
      <button class="btn btn-gold" style="margin-top:12px" onclick="document.getElementById('modal-generic').classList.add('hidden')">▶ Si riparte!</button>`;
    $('modal-generic').classList.remove('hidden');
  }

  function clearSave(slot = null, profile = null) {
    try {
      if (slot != null) localStorage.removeItem(slotKey(slot, profile));
      else if (G && G.slot) localStorage.removeItem(slotKey(G.slot));
    } catch (e) {}
  }

  /* ---------- codici di salvataggio (trasferimento tra dispositivi) ---------- */

  /* Il salvataggio completo contiene backstory e descrizioni (migliaia di caratteri):
     per il codice da copiare teniamo solo ciò che non è ricostruibile da HEROES.
     Risultato: da ~4.800 a poche centinaia di caratteri.                        */
  function compact(g) {
    return {
      v: 2,
      p: g.party.map(h => ({ i: h.id, n: h.player || '', h: h.hp, d: !!h.down, m: h.maxHp, a: h.ac, u: h.abilities.map(ab => ab.uses) })),
      U: g.uses, g: g.gold, I: g.inventory, f: g.flags, s: g.sceneId,
      c: g.usedChoices, e: g.enteredScenes, y: g.history, n: g.seenEnemies,
      l: g.lastCombatSceneId, D: g.difficulty, t: g.stats, w: g.savedAt,
    };
  }

  function expand(c) {
    const party = c.p.map(p => {
      const base = HEROES.find(h => h.id === p.i);
      if (!base) return null;
      const hero = JSON.parse(JSON.stringify(base));
      hero.player = p.n; hero.hp = p.h; hero.down = p.d;
      if (p.m != null) hero.maxHp = p.m;
      if (p.a != null) hero.ac = p.a;
      if (p.u) hero.abilities.forEach((ab, i) => { if (p.u[i] != null) ab.uses = p.u[i]; });
      return hero;
    }).filter(Boolean);
    return {
      party, uses: c.U, gold: c.g, inventory: c.I, flags: c.f, sceneId: c.s,
      usedChoices: c.c || {}, enteredScenes: c.e || {}, history: c.y || [],
      seenEnemies: c.n || [], lastCombatSceneId: c.l || null,
      difficulty: c.D || 'normale', stats: c.t || { combats: 0, checksPassed: 0, checksFailed: 0, scenes: 0, start: Date.now() },
      savedAt: c.w || Date.now(),
    };
  }

  function exportCode(slot, profile = null) {
    try {
      const raw = localStorage.getItem(slotKey(slot, profile));
      if (!raw) return null;
      const json = JSON.stringify(compact(JSON.parse(raw)));
      return btoa(unescape(encodeURIComponent(json)));
    } catch (e) { return null; }
  }

  function importCode(code, slot, profile = null) {
    try {
      const raw = decodeURIComponent(escape(atob(code.trim().replace(/\s+/g, ''))));
      const parsed = JSON.parse(raw);
      // accetta sia il formato compatto (v:2) sia i vecchi codici per esteso
      const g = parsed.v === 2 ? expand(parsed) : parsed;
      if (!g.party || !g.party.length || !g.sceneId) return 'Codice non valido: manca la compagnia o la scena.';
      if (!CAMPAIGN[g.sceneId]) g.sceneId = CAMPAIGN_START;
      localStorage.setItem(slotKey(slot, profile), JSON.stringify(g));
      return null; // nessun errore
    } catch (e) { return 'Codice non riconosciuto: controllate di averlo copiato per intero.'; }
  }

  function deleteProfile(name) {
    for (let n = 1; n <= SLOTS; n++) clearSave(n, name);
    const list = listProfiles().filter(p => p !== name);
    saveProfiles(list.length ? list : [DEFAULT_PROFILE]);
    if (currentProfile() === name) setCurrentProfile(list[0] || DEFAULT_PROFILE);
  }

  function renameProfile(oldName, newName) {
    if (!newName || listProfiles().includes(newName)) return false;
    for (let n = 1; n <= SLOTS; n++) {
      try {
        const raw = localStorage.getItem(slotKey(n, oldName));
        if (raw) { localStorage.setItem(slotKey(n, newName), raw); localStorage.removeItem(slotKey(n, oldName)); }
      } catch (e) {}
    }
    saveProfiles(listProfiles().map(p => p === oldName ? newName : p));
    if (currentProfile() === oldName) setCurrentProfile(newName);
    return true;
  }

  /* ---------- navigazione schermate ---------- */

  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    $(id).classList.add('active');
  }

  function currentScene() { return CAMPAIGN[G && G.sceneId] || null; }

  /* ---------- formattazione testo ---------- */

  function formatText(text) {
    const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return esc(text)
      .split('\n')
      .map(line => {
        const m = line.match(/^&gt; ([^:]+): ?(.*)$/);
        if (m) return `<span class="speaker">${m[1]}:</span> ${m[2]}`;
        return line;
      })
      .join('\n')
      .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
      .replace(/\*(.+?)\*/g, '<i>$1</i>');
  }

  /* ---------- scene ---------- */

  function gotoScene(id) {
    if (id === 'RETRY_COMBAT') id = G.lastCombatSceneId || CAMPAIGN_START;
    const scene = CAMPAIGN[id];
    if (!scene) { console.error('Scena mancante:', id); return; }
    G.sceneId = id;
    G.stats.scenes++;

    const firstVisit = !G.enteredScenes[id];
    G.enteredScenes[id] = true;

    // effetti d'ingresso (solo alla prima visita)
    if (firstVisit) {
      if (scene.sets) Object.assign(G.flags, scene.sets);
      if (scene.rep) G.flags.reputazione = (G.flags.reputazione || 0) + scene.rep;
      if (scene.gold) G.gold = Math.max(0, G.gold + scene.gold);
      if (scene.goldLoss) G.gold = Math.max(0, G.gold - scene.goldLoss);
      if (scene.item) G.inventory.push(scene.item);
      if (scene.item2) G.inventory.push(scene.item2);
      if (scene.heal) {
        // le Provviste di Bocciolo rendono i riposi più nutrienti
        const bonus = (scene.recharge && G.inventory.includes('provviste')) ? 2 : 0;
        for (const h of G.party) if (!h.down) h.hp = Math.min(h.maxHp, h.hp + scene.heal + bonus);
      }
      if (scene.damage) for (const h of G.party) if (!h.down) h.hp = Math.max(1, h.hp - scene.damage);
      if (scene.onEnterOnce && scene.onEnterOnce.itemEach) {
        for (const h of G.party) G.inventory.push(scene.onEnterOnce.itemEach);
      }
    }

    // effetti che devono valere a OGNI visita (scene di sconfitta e di riposo)
    if (scene.fullHeal) {
      for (const h of G.party) {
        h.hp = h.maxHp; h.down = false;
        for (const ab of h.abilities) G.uses[h.id][ab.id] = ab.uses;
      }
      if (!firstVisit && scene.goldLoss) G.gold = Math.max(0, G.gold - scene.goldLoss);
    }

    /* CHECKPOINT — La Corona non ha CHECKPOINT_FLAGS (e non se ne inventano):
       il punto di ripartenza è l'ultima scena di RIPOSO VERO visitata (fullHeal
       o recharge) che NON sia la destinazione di sconfitta di un combattimento.
       Quelle rimandano già allo scontro con PV pieni: usarle come checkpoint
       sarebbe un cerchio. Snapshot dello stato di ADESSO: se cadete due volte
       nello stesso punto si riparte da qui (vedi riprendiDaCheckpoint). */
    if ((scene.fullHeal || scene.recharge) && !isSceneDiSconfitta(id)) {
      try {
        G.lastCheckpoint = { sceneId: id, flag: null, snapshot: JSON.stringify({
          party: G.party, uses: G.uses, gold: G.gold, inventory: G.inventory,
          flags: G.flags, koCount: G.koCount || {},
          enteredScenes: G.enteredScenes, usedChoices: G.usedChoices,
        }) };
      } catch (e) {}
    }
    if (scene.recharge) {
      for (const h of G.party) for (const ab of h.abilities) G.uses[h.id][ab.id] = ab.uses;
    }

    if (scene.combat) G.lastCombatSceneId = id;

    // cronologia per il riepilogo "la storia finora"
    if (!G.history) G.history = [];
    if (scene.caption && G.history[G.history.length - 1] !== scene.caption) {
      G.history.push(scene.caption);
      if (G.history.length > 60) G.history.shift();
    }

    saveGame();
    renderScene(scene);
  }

  let typeTimer = null;

  const MUSIC_BY_LOCATION = {
    taverna: 'village', villaggio: 'village', alba: 'alba', vetta: 'boss',
    bosco: 'bosco', capanna: 'bosco', miniera: 'miniera',
    fiume: 'fiume', cisterna: 'cripta', cripta: 'cripta',
    ballo: 'ballo', castelloEsterno: 'cripta', salaTrono: 'ballo',
  };

  function musicForScene(scene) {
    if (scene.ending) return 'alba';
    // momenti speciali della storia
    if (/^f_(tenzone|lacrima|corona)/.test(G.sceneId)) return 'tenzone';
    return MUSIC_BY_LOCATION[scene.location] || 'explore';
  }

  /* Quanto è avanzata l'eclissi, scena per scena (0 = appena iniziata, 1 = mezzanotte).
     Segue l'orologio della storia: mezzogiorno → 15:00 → 18:00 → 22:00 → 23:55. */
  function eclipsePhaseFor(id) {
    if (/^e_/.test(id)) return 0;                       // epiloghi: il sole è tornato
    if (/^(f_|c_vetta)/.test(id)) return 1;             // mezzanotte meno cinque
    if (/^c_scala/.test(id)) return 0.92;               // 23:30
    if (/^c_/.test(id)) return 0.78;                    // il castello, ore 22:00
    if (/^(b|m|r)\d|^(b|m|r)[0-9_]/.test(id)) return 0.6; // atti 2: sera inoltrata
    if (id === 'v3') return 0.45;                       // il bivio, ore 18:00
    if (/^v2/.test(id)) return 0.32;                    // il ponte, ore 15:00
    return 0.16;                                        // prologo a Brindolo
  }

  function renderScene(scene, instant = false) {
    showScreen('screen-game');
    if (typeof Sound !== 'undefined') Sound.music(musicForScene(scene));
    if (typeof Scenes.setEclipse === 'function') Scenes.setEclipse(eclipsePhaseFor(G.sceneId));
    /* Le didascalie sono scritte come "Luogo, ora — frase": il luogo e l'ora vanno
       nell'HUD (orientamento), la frase sotto il quadro (didascalia dell'immagine).
       Senza trattino lungo l'HUD prende tutto e la didascalia sotto resta vuota. */
    const capIntera = scene.caption || '';
    const tagliaCap = capIntera.indexOf(' — ');
    const capLuogo = tagliaCap > 0 ? capIntera.slice(0, tagliaCap) : capIntera;
    const capFrase = tagliaCap > 0 ? capIntera.slice(tagliaCap + 3) : '';
    $('hud-location').textContent = '📍 ' + capLuogo;
    Scenes.paint('scene-canvas', scene.location, null, scene.npc);
    /* La scheda del luogo: il pulsante 🔎 sul quadro. Si accende solo se questo
       luogo ha una scheda scritta — un pulsante che apre il vuoto è peggio di
       nessun pulsante. Richiesta del committente, 23 agosto 2026. */
    if (typeof Luoghi !== 'undefined') Luoghi.aggiorna(scene.location, capLuogo);
    $('scene-caption').textContent = capFrase;
    $('scene-caption').classList.toggle('hidden', !capFrase);

    const narr = $('narration');
    const choicesEl = $('choices');
    choicesEl.innerHTML = '';

    // righe condizionate alla presenza dell'eroe: [[eroe:id]]...[[/eroe]] appare solo se l'eroe è in gioco
    const testoFiltrato = (scene.text || '').replace(/\[\[eroe:([a-z_]+)\]\]([\s\S]*?)\[\[\/eroe\]\]/g,
      (m, id, corpo) => G.party.some(h => h.id === id && !h.down) ? corpo : ''
    ).replace(/\n{3,}/g, '\n\n');
    const html = `<span class="dm-label">🎙 IL NARRATORE</span>` + formatText(testoFiltrato);

    if (typeTimer) { clearInterval(typeTimer); typeTimer = null; }

    const finishRender = () => {
      narr.innerHTML = html;
      renderChoices(scene);
      renderPartyBar('party-bar');
    };

    if (instant) { finishRender(); return; }

    // effetto macchina da scrivere (cliccabile per saltare)
    narr.innerHTML = '';
    const plain = document.createElement('div');
    narr.appendChild(plain);
    let i = 0;
    const step = 3; // caratteri per tick
    const raw = scene.text;
    typeTimer = setInterval(() => {
      i += step;
      if (i >= raw.length) {
        clearInterval(typeTimer); typeTimer = null;
        finishRender();
      } else {
        plain.innerHTML = `<span class="dm-label">🎙 IL NARRATORE</span>` + formatText(raw.slice(0, i)) + '<span class="cursor"></span>';
      }
    }, 12);
    narr.onclick = () => {
      if (typeTimer) { clearInterval(typeTimer); typeTimer = null; finishRender(); }
    };
    renderPartyBar('party-bar');
  }

  function choiceAvailable(c) {
    if (c.requires) {
      if (c.requires.flag && !G.flags[c.requires.flag]) return false;
      if (c.requires.notFlag && G.flags[c.requires.notFlag]) return false;
      if (c.requires.item && !G.inventory.includes(c.requires.item)) return false;
      if (c.requires.notItem && G.inventory.includes(c.requires.notItem)) return false;
      /* requires.hero: la scelta compare solo se quell'eroe è in squadra e in piedi.
         Serve per le scene che appartengono a un personaggio: Torvald che chiede a
         Monsieur Ragoût di vedergli la cucina non ha senso se Torvald non c'è. */
      if (c.requires.hero && !G.party.some(h => h.id === c.requires.hero && !h.down)) return false;
    }
    if (c.once && (G.usedChoices[G.sceneId] || []).includes(c.text)) return false;
    return true;
  }

  function renderChoices(scene) {
    const choicesEl = $('choices');
    choicesEl.innerHTML = '';

    if (scene.ending) {
      renderEnding(scene);
      return;
    }

    if (scene.minigame) {
      const b = document.createElement('button');
      b.className = 'choice-btn';
      b.innerHTML = `🎮 <b>SI GIOCA!</b> <span class="choice-tag">${scene.minigame.tag || 'Un minigioco: il gioco vi spiega le regole.'}</span>`;
      b.onclick = () => Minigames.start(scene.minigame, ok => {
        gotoScene(ok ? scene.minigame.success : scene.minigame.fail);
      });
      choicesEl.appendChild(b);
      return;
    }

    if (scene.combat) {
      const b = document.createElement('button');
      b.className = 'choice-btn';
      b.innerHTML = `⚔ <b>INIZIA IL COMBATTIMENTO!</b> <span class="choice-tag">Preparatevi: si combatte a turni, il gioco vi guida.</span>`;
      b.onclick = () => Combat.start(scene.combat, G.sceneId);
      choicesEl.appendChild(b);
      return;
    }

    for (const c of (scene.choices || [])) {
      if (!choiceAvailable(c)) continue;
      const b = document.createElement('button');
      b.className = 'choice-btn';
      let inner = c.text;
      if (c.tag) inner += ` <span class="choice-check">🎲 ${c.tag}</span>`;
      const poor = c.requiresGold && G.gold < c.requiresGold;
      if (poor) inner += ` <span class="choice-tag">(vi servono ${c.requiresGold} monete — ne avete ${G.gold})</span>`;
      b.innerHTML = inner;
      b.disabled = !!poor;
      b.onclick = () => resolveChoice(scene, c);
      choicesEl.appendChild(b);
    }

    /* ↩ SI RIPARTE DAL CHECKPOINT — offerta ESPLICITA nelle scene di sconfitta,
       dalla SECONDA caduta nello stesso scontro (la prima volta il gioco vi
       raccoglie e basta). È una scelta vera, non una punizione: tornare indietro
       vi restituisce il pezzo di storia che la sconfitta vi fa saltare, e vi costa
       tutto quello che avete raccolto da lì in poi (la modale lo dice per nome). */
    if (haCheckpoint() && isSceneDiSconfitta(G.sceneId) &&
        (G.koCount || {})[G.lastCombatSceneId] > 1) {
      const nodo = (CAMPAIGN[G.lastCheckpoint.sceneId] || {}).caption || 'l\'ultimo checkpoint';
      const b = document.createElement('button');
      b.className = 'choice-btn';
      b.id = 'btn-checkpoint-return';
      b.innerHTML = `↩ <b>🌒 Tornare indietro</b>: l'eclisse vi rimanda a «${nodo}»` +
        ` <span class="choice-tag">Riprendete da lì: PV pieni e abilità cariche, la strada di nuovo intera — ma quello che avete raccolto dopo non lo avete più</span>`;
      b.onclick = () => riprendiDaCheckpoint();
      choicesEl.appendChild(b);
    }
  }

  function resolveChoice(scene, c) {
    if (typeof Sound !== 'undefined') Sound.play(c.item ? 'item' : c.gold ? 'gold' : 'click');
    if (c.once) {
      if (!G.usedChoices[G.sceneId]) G.usedChoices[G.sceneId] = [];
      G.usedChoices[G.sceneId].push(c.text);
    }
    if (c.gold) G.gold = Math.max(0, G.gold + c.gold);
    if (c.item) G.inventory.push(c.item);
    // c.item2: era una chiave MORTA (solo scene.item2 veniva applicato), quindi ogni
    // scelta che dava due oggetti ne dava uno solo, in silenzio.
    if (c.item2) G.inventory.push(c.item2);
    if (c.removeItem) {
      const i = G.inventory.indexOf(c.removeItem);
      if (i >= 0) G.inventory.splice(i, 1);
    }
    // effetti meccanici della SCELTA (non solo della scena): heal/damage/goldLoss.
    // Erano chiavi morte silenziose: decine di scelte le usavano senza effetto (ago 2026).
    if (c.heal) { for (const h of G.party) if (!h.down) h.hp = Math.min(h.maxHp, h.hp + c.heal); }
    if (c.damage) { for (const h of G.party) if (!h.down) h.hp = Math.max(1, h.hp - c.damage); }
    if (c.goldLoss) G.gold = Math.max(0, G.gold - c.goldLoss);
    if (c.sets) Object.assign(G.flags, c.sets);
    if (c.rep) G.flags.reputazione = (G.flags.reputazione || 0) + c.rep;
    saveGame();

    if (c.check) {
      pickHeroForCheck(c.check);
    } else if (c.next) {
      gotoScene(c.next);
    } else {
      // scelta "da negozio": resta nella scena e aggiorna
      renderScene(scene, true);
    }
  }

  /* ---------- prove di abilità ---------- */

  const STAT_NAMES = { FOR: 'Forza', DES: 'Destrezza', COS: 'Costituzione', INT: 'Intelligenza', SAG: 'Saggezza', CAR: 'Carisma' };

  function heroCheckMod(h, stat) {
    let m = h.stats[stat] || 0;
    if (h.id === 'lyra' && stat === 'INT') m += 2;
    if (h.id === 'kael' && stat === 'SAG') m += 2;
    return m;
  }

  function pickHeroForCheck(check) {
    const box = $('modal-generic-content');
    box.innerHTML = `<h2>🎲 Prova di ${STAT_NAMES[check.stat]} — CD ${check.dc}</h2>
      <p style="margin-bottom:12px">Chi ci prova? Scegliete l'eroe (contano i suoi bonus!):</p>`;
    G.party.forEach(h => {
      if (h.down) return;
      const mod = heroCheckMod(h, check.stat);
      const b = document.createElement('button');
      b.className = 'choice-btn';
      b.innerHTML = `${h.name} <span class="choice-tag">${STAT_NAMES[check.stat]}: ${mod >= 0 ? '+' + mod : mod}${h.player ? ' · giocato da ' + h.player : ''}</span>`;
      b.onclick = () => {
        $('modal-generic').classList.add('hidden');
        const rollIt = (isReroll) => Dice.showRoll({
          title: `${h.name} ${isReroll ? 'RITIRA (Dado del Destino!)' : 'tenta'}:<br>${STAT_NAMES[check.stat]} — CD ${check.dc}`,
          mod, dc: check.dc,
          onDone: res => {
            if (!res.success && !isReroll && G.inventory.includes('dado_destino')) {
              return offerReroll(() => {
                const i = G.inventory.indexOf('dado_destino');
                if (i >= 0) G.inventory.splice(i, 1);
                saveGame();
                rollIt(true);
              }, () => {
                G.stats.checksFailed++;
                gotoScene(check.fail);
              });
            }
            if (res.success) G.stats.checksPassed++; else G.stats.checksFailed++;
            // esiti meccanici opzionali della prova (portati da L'Effetto Zoom):
            // il dado conta anche quando successo e fallimento portano alla stessa scena
            if (res.success && check.successHeal) h.hp = Math.min(h.maxHp, h.hp + check.successHeal);
            if (!res.success && check.failDamage) h.hp = Math.max(1, h.hp - check.failDamage);
            gotoScene(res.success ? check.success : check.fail);
          },
        });
        rollIt(false);
      };
      box.appendChild(b);
    });
    $('modal-generic').classList.remove('hidden');
  }

  // proposta di ritiro con il Dado del Destino
  function offerReroll(onYes, onNo) {
    const box = $('modal-generic-content');
    box.innerHTML = `<h2>🎲 Il Dado del Destino freme...</h2>
      <p style="margin-bottom:12px">La prova è fallita, ma nello zaino il dado di Gedeone <i>vibra</i>. Un solo uso. Questo momento lo merita?</p>
      <button class="choice-btn" id="btn-reroll-yes">🎲 <b>SÌ: ritirate il dado!</b> (consuma il Dado del Destino)</button>
      <button class="choice-btn" id="btn-reroll-no">🙅 No, accettate il fato: sarà per un momento più importante</button>`;
    $('modal-generic').classList.remove('hidden');
    $('btn-reroll-yes').onclick = () => { $('modal-generic').classList.add('hidden'); onYes(); };
    $('btn-reroll-no').onclick = () => { $('modal-generic').classList.add('hidden'); onNo(); };
  }

  /* ---------- se cadete tutti: si riparte dal checkpoint ---------- */

  // le scene che un combattimento usa come sconfitta: non possono essere checkpoint
  let _sconfitte = null;
  function isSceneDiSconfitta(id) {
    if (!_sconfitte) {
      _sconfitte = new Set();
      for (const s of Object.values(CAMPAIGN)) {
        if (s.combat && s.combat.defeat) _sconfitte.add(s.combat.defeat);
      }
    }
    return _sconfitte.has(id);
  }

  /* Quante volte siete già caduti in QUESTO scontro: la prima volta valgono le
     scene di sconfitta scritte (Gerbold, il "soccorritore"), dalla seconda si
     torna al checkpoint. */
  function registraCaduta(sceneId) {
    if (!G) return 1;
    if (!G.koCount) G.koCount = {};
    const k = sceneId || G.sceneId || '?';
    G.koCount[k] = (G.koCount[k] || 0) + 1;
    return G.koCount[k];
  }

  function haCheckpoint() { return !!(G && G.lastCheckpoint && G.lastCheckpoint.snapshot); }

  /* Si riparte dall'ultimo riposo vero, con lo stato di ALLORA: quello che avevate
     raccolto dopo l'avete perso, e la modale lo dice PER NOME. Torna false se non
     c'è nessun checkpoint: in quel caso vale la scena di sconfitta scritta. */
  function riprendiDaCheckpoint() {
    /* PIETÀ PROGRESSIVA, contata PER SCONTRO. Senza questo un gruppo troppo debole
       rimbalza fra il riposo e la sconfitta all'infinito; contata a vita, invece,
       regalerebbe lo sconto a tutti gli scontri dopo qualche caduta sparsa. Ogni
       ritorno sullo STESSO scontro toglie il 12% delle forze a chi vi ha steso,
       fino a un terzo, e il log del combattimento lo dice. */
    if (G) {
      G.stats = G.stats || {};
      G.stats.checkpointRitorni = (G.stats.checkpointRitorni || 0) + 1;
      const _scontro = G.lastCombatSceneId || G.sceneId || '?';
      G.stats.ritorniPerScontro = G.stats.ritorniPerScontro || {};
      G.stats.ritorniPerScontro[_scontro] = (G.stats.ritorniPerScontro[_scontro] || 0) + 1;
      G.pieta = Math.min(0.34, G.stats.ritorniPerScontro[_scontro] * 0.12);
    }
    const cp = G && G.lastCheckpoint;
    if (!cp || !cp.snapshot) return false;
    let s;
    try { s = JSON.parse(cp.snapshot); } catch (e) { return false; }
    if (!s || !s.party || !s.party.length) return false;

    const restanti = [...(s.inventory || [])];
    const perse = [];
    for (const it of (G.inventory || [])) {
      const i = restanti.indexOf(it);
      if (i >= 0) restanti.splice(i, 1); else perse.push(it);
    }
    const nomiPersi = perse.map(i => (ITEMS[i] ? ITEMS[i].name : i));
    const oroPerso = Math.max(0, (G.gold || 0) - (s.gold || 0));

    G.party = s.party;
    G.uses = s.uses;
    G.gold = s.gold;
    G.inventory = s.inventory;
    G.flags = s.flags;
    G.koCount = s.koCount || {};
    // si riavvolge ANCHE cosa è stato visitato: senza questo i flag one-shot
    // delle scene già entrate non si rimettono più e il contenuto si soft-locka.
    if (s.enteredScenes) G.enteredScenes = s.enteredScenes;
    if (s.usedChoices) G.usedChoices = s.usedChoices;
    for (const h of G.party) { h.hp = h.maxHp; h.down = false; h.luckUsed = false; }
    G.stats = G.stats || {};
    G.stats.checkpointRitorni = (G.stats.checkpointRitorni || 0) + 1;

    // prima si NAVIGA, poi si racconta: la modale è informativa, non un cancello
    // (un onclick inline non lo esegue né lo stub dei test né chi chiude con Esc).
    gotoScene(cp.sceneId);

    const nodo = CAMPAIGN[cp.sceneId] ? CAMPAIGN[cp.sceneId].caption : 'l\'ultimo riposo';
    const box = $('modal-generic-content');
    box.innerHTML = `<h2 style="color:var(--red)">🌒 L'ECLISSE VI RIMANDA INDIETRO</h2>
      <div class="backstory" style="white-space:pre-wrap">Un attimo il buio, e poi la sensazione più strana di tutta la vostra vita: il <b>sapore del pasto di prima</b>, ancora in bocca.

Siete di nuovo a <i>${nodo}</i>. Le bende sono nuove, le abilità cariche, il fiato in ordine. La luna, sopra di voi, è tornata di qualche dito indietro.

*(L'eclisse mangia il tempo. Di solito lo mangia in avanti. Stanotte, per voi, ha fatto un'eccezione — e le eccezioni si pagano.)*

Quello che avevate raccolto da lì in poi, <b>non lo avete più</b>.${nomiPersi.length ? `\n\n<span style="color:var(--red)">Vi manca:</span> ${nomiPersi.join(', ')}.` : `\n\n<span style="color:var(--text-dim)">Gli zaini, almeno, sono come li avevate lasciati.</span>`}${oroPerso ? `\n<span style="color:var(--red)">💰 Oro:</span> ne avevate ${oroPerso} in più. Si riparte da ${G.gold}.` : ''}

<span style="color:var(--green)">PV al massimo, abilità ricaricate.</span> Mezzanotte, però, non torna indietro con voi.</div>
      <button class="btn btn-gold" style="margin-top:14px" onclick="document.getElementById('modal-generic').classList.add('hidden')">⚔ Rifarlo meglio</button>`;
    $('modal-generic').classList.remove('hidden');
    if (typeof Sound !== 'undefined') Sound.play('defeat');
    saveGame();
    return true;
  }

  /* ---------- barra del gruppo ---------- */

  function renderPartyBar(containerId, activeIdx = -1) {
    const bar = $(containerId);
    bar.innerHTML = '';
    G.party.forEach((h, i) => {
      const slot = document.createElement('div');
      slot.className = 'party-slot' + (i === activeIdx ? ' active-turn' : '') + (h.down ? ' dead' : '');
      const cv = document.createElement('canvas');
      cv.width = 36; cv.height = 36;
      slot.appendChild(cv);
      const info = document.createElement('div');
      info.className = 'party-slot-info';
      const frac = h.hp / h.maxHp;
      info.innerHTML = `
        <div class="party-slot-name">${h.name.split(' ')[0]}</div>
        ${h.player ? `<div class="party-slot-player">${h.player}</div>` : ''}
        <div class="hp-bar"><div class="hp-fill ${frac > 0.5 ? 'high' : frac > 0.25 ? 'mid' : ''}" style="width:${Math.max(0, frac * 100)}%"></div></div>
        <span class="hp-text">${h.down ? 'A TERRA' : h.hp + '/' + h.maxHp + ' PV'}</span>`;
      slot.appendChild(info);
      slot.onclick = () => showHeroSheet(h);
      bar.appendChild(slot);
      Sprites.renderToCanvas(cv, Sprites.registry[h.sprite]);
    });
  }

  /* ---------- schede e modali ---------- */

  function heroSheetHTML(h, withUses = true) {
    /* LE CONDIZIONI ATTIVE. Richiesta del committente dopo aver giocato: «siamo
       avvelenati ma non sembra succeda niente, e se clicchi il personaggio non si
       vede e non dà info al riguardo». Ogni stato va scritto qui, con l'effetto
       numerico E il modo di togliersela. */
    const conditions = [];
    if (h.veleno) conditions.push(`<div class="ability-box" style="border-left:5px solid var(--red)"><span class="ability-name">🤢 AVVELENATO</span><div class="ability-desc"><b>−2 a TUTTE le prove e agli attacchi</b>, finché il veleno gira. Si cura con un antidoto, con una cura del chierico, o dormendo una notte intera al sicuro.</div></div>`);
    if (h.down) conditions.push(`<div class="ability-box" style="border-left:5px solid var(--red)"><span class="ability-name">💀 A TERRA</span><div class="ability-desc">A zero punti vita: non agisce e non tira. Serve una cura, una pozione o che qualcuno lo rialzi — e in combattimento rialzarlo costa un turno a chi lo fa.</div></div>`);
    if (h.preso) conditions.push(`<div class="ability-box" style="border-left:5px solid var(--red)"><span class="ability-name">🕸 TRATTENUTO</span><div class="ability-desc">Qualcosa lo tiene e non lo lascia: fuori gioco finché non lo strappate via.</div></div>`);
    if (h.morto) conditions.push(`<div class="ability-box" style="border-left:5px solid var(--red)"><span class="ability-name">⚰️ CADUTO</span><div class="ability-desc">Non respira più. Torna solo con una resurrezione vera — o in uno dei finali che se lo meritano.</div></div>`);
    const stats = Object.entries(h.stats).map(([k, v]) =>
      `<div class="stat-chip"><span class="stat-label">${k}</span><span class="stat-val">${v >= 0 ? '+' + v : v}</span></div>`).join('');
    const abilities = h.abilities.map(ab => {
      const left = withUses && G && G.uses[h.id] ? ` — usi rimasti: <b>${G.uses[h.id][ab.id]}</b>` : ` — usi per avventura: <b>${ab.uses}</b>`;
      return `<div class="ability-box"><span class="ability-name">✨ ${ab.name}</span>${left}<div class="ability-desc">${ab.desc}</div></div>`;
    }).join('');
    return `
      <h2>${h.name}</h2>
      <p style="color:var(--blue);font-size:20px">${h.class} — <i>${h.tagline}</i></p>
      ${h.player ? `<p style="color:var(--text-dim)">Giocato da: <b>${h.player}</b></p>` : ''}
      ${conditions.length ? `<h3>⚠️ Condizioni attive</h3>${conditions.join('')}` : ''}
      <div class="stat-row">
        <div class="stat-chip"><span class="stat-label">PV</span><span class="stat-val">${G ? h.hp + '/' + h.maxHp : h.maxHp}</span></div>
        <div class="stat-chip"><span class="stat-label">CA</span><span class="stat-val">${h.ac}</span></div>
        ${stats}
      </div>
      <h3>⚔ Attacco</h3>
      <div class="ability-box"><span class="ability-name">${h.attack.name}</span><div class="ability-desc">${h.attack.desc}</div></div>
      <h3>✨ Abilità speciali</h3>
      ${abilities}
      <div class="ability-box"><span class="ability-name">🌟 Passiva</span><div class="ability-desc">${h.passive}</div></div>
      <h3>📜 Storia</h3>
      <div class="backstory">${h.backstory}</div>
      <div class="backstory" style="border-left:5px solid var(--green)"><b>Come interpretarlo:</b> ${h.voice}</div>
      <p style="font-size:19px;color:var(--text-dim);margin-top:8px"><b>Ruolo nel gruppo:</b> ${h.role}</p>`;
  }

  function showHeroSheet(h) {
    const box = $('modal-generic-content');
    box.innerHTML = heroSheetHTML(h) + `<button class="btn" style="margin-top:14px" onclick="document.getElementById('modal-generic').classList.add('hidden')">✔ Chiudi</button>`;
    $('modal-generic').classList.remove('hidden');
  }

  /* Gli stati stanno nella scheda completa, ma servono nel riepilogo: nel mezzo di un
     combattimento nessuno apre cinque schede per sapere chi è conciato male. */
  function badgeStati(h) {
    const b = [];
    if (h.morto) b.push('⚰️ CADUTO');
    if (h.down) b.push('💀 A TERRA');
    if (h.preso) b.push('🕸 TRATTENUTO');
    if (h.veleno) b.push('🤢 AVVELENATO');
    return b.length ? ' · ' + b.join(' · ') : '';
  }

  function showParty() {
    const box = $('modal-generic-content');
    box.innerHTML = `<h2>🎭 La Compagnia</h2>` +
      G.party.map((h, i) => `<div class="ability-box" style="cursor:pointer" onclick="Engine.showHeroSheetIdx(${i})">
        <span class="ability-name">${h.name}</span> — ${h.class}${h.player ? ' · ' + h.player : ''}
        <div class="ability-desc">PV ${h.hp}/${h.maxHp} · CA ${h.ac}${badgeStati(h)} — <i>tocca per la scheda completa</i></div>
      </div>`).join('') +
      `<button class="btn" style="margin-top:14px" onclick="document.getElementById('modal-generic').classList.add('hidden')">✔ Chiudi</button>`;
    $('modal-generic').classList.remove('hidden');
  }

  function showHeroSheetIdx(i) { showHeroSheet(G.party[i]); }

  function inspectItem(itemId) {
    const item = ITEMS[itemId];
    if (!item || !item.lore) return;
    const box = $('modal-generic-content');
    box.innerHTML = `<h2>📖 ${item.name}</h2>
      <div class="backstory" style="white-space:pre-wrap">${item.lore}</div>
      <button class="btn" style="margin-top:14px" onclick="Engine.showInventory()">↩ Allo zaino</button>`;
    $('modal-generic').classList.remove('hidden');
  }

  function showInventory() {
    const box = $('modal-generic-content');
    const counts = {};
    for (const it of G.inventory) counts[it] = (counts[it] || 0) + 1;
    let itemsHtml = Object.entries(counts).map(([it, n]) => {
      const item = ITEMS[it];
      const useBtn = item.usable ? `<button class="btn btn-small" onclick="Engine.usePotionOutside('${it}')">🧪 Bevi</button>` : '';
      /* Gli oggetti che portano un pezzo di storia hanno un secondo strato: il bottone
         compare SOLO se c'è qualcosa da leggere, così non promette niente a vuoto. */
      const loreBtn = item.lore ? `<button class="btn btn-small" onclick="Engine.inspectItem('${it}')">📖 Ispeziona</button>` : '';
      return `<div class="inv-item"><span class="inv-name">${item.name}${n > 1 ? ' ×' + n : ''}</span><span class="inv-desc">${item.desc}</span>${useBtn}${loreBtn}</div>`;
    }).join('') || '<p style="color:var(--text-dim)">Lo zaino è vuoto. Succede ai migliori.</p>';
    box.innerHTML = `<h2>🎒 Zaino del Gruppo</h2>
      <div class="gold-display">💰 ${G.gold} monete d'oro</div>
      ${itemsHtml}
      <button class="btn" style="margin-top:14px" onclick="document.getElementById('modal-generic').classList.add('hidden')">✔ Chiudi</button>`;
    $('modal-generic').classList.remove('hidden');
  }

  function usePotionOutside(itemId) {
    const box = $('modal-generic-content');
    const item = ITEMS[itemId];
    box.innerHTML = `<h2>🧪 ${item.name}</h2><p style="margin-bottom:12px">Chi la beve?</p>` +
      G.party.map((h, i) => `<button class="choice-btn" onclick="Engine.applyPotion('${itemId}', ${i})">${h.name} <span class="choice-tag">PV ${h.hp}/${h.maxHp}${h.down ? ' — A TERRA' : ''}</span></button>`).join('');
    $('modal-generic').classList.remove('hidden');
  }

  function applyPotion(itemId, heroIdx) {
    const i = G.inventory.indexOf(itemId);
    if (i < 0) return;
    G.inventory.splice(i, 1);
    const h = G.party[heroIdx];
    h.down = false;
    h.hp = Math.min(h.maxHp, Math.max(0, h.hp) + ITEMS[itemId].heal);
    saveGame();
    renderPartyBar('party-bar');
    showInventory();
  }

  function showRules() {
    const box = $('modal-generic-content');
    box.innerHTML = `<h2>📖 Regole Rapide</h2>${RULES_QUICK}
      <button class="btn" style="margin-top:14px" onclick="document.getElementById('modal-generic').classList.add('hidden')">✔ Chiudi</button>`;
    $('modal-generic').classList.remove('hidden');
  }

  /* ---------- mappa ---------- */

  /* La pianta è un canvas da 720 mostrato a 289 sul telefono: il 40%. Un'etichetta da
     9px arrivava a 3,6px, cioè un impasto. Nella pianta restano i NUMERI, che si leggono
     anche rimpiccioliti; i nomi stanno qui sotto in testo vero, che non rimpicciolisce
     con l'immagine. */
  function legendaMappa() {
    const cur = WORLD_MAP.find(w => w.scenes && G && w.scenes.includes(G.sceneId));
    return '<div class="mappa-legenda">' + WORLD_MAP.map((l, i) => {
      const qui = cur && cur.key === l.key;
      return `<span class="mappa-voce${qui ? ' qui' : ''}"><b>${i + 1}</b> ${l.label}${qui ? ' ⭐' : ''}</span>`;
    }).join('') + '</div>';
  }

  function showMap() {
    const box = $('modal-generic-content');
    box.innerHTML = `<h2>🗺 Regno di Lumelia</h2><canvas id="map-canvas" width="720" height="480"></canvas>${legendaMappa()}
      <p style="color:var(--text-dim);font-size:19px;margin-top:8px">⭐ = posizione attuale della compagnia. I numeri sulla mappa sono nell'elenco qui sopra.</p>
      <button class="btn" style="margin-top:10px" onclick="document.getElementById('modal-generic').classList.add('hidden')">✔ Chiudi</button>`;
    $('modal-generic').classList.remove('hidden');
    drawMap();
  }

  function drawMap() {
    const canvas = $('map-canvas');
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    const W = canvas.width, H = canvas.height;
    const r = Scenes.rng(500);

    // sfondo pergamena notturna
    Scenes.blocks(ctx, 0, 0, W, H, '#1d1a2e', 20, r, 0.12);
    // montagne a nord
    for (let i = 0; i < 6; i++) {
      const x = W * 0.1 + i * W * 0.15, s = 40 + r() * 30;
      ctx.fillStyle = '#2e2a3d';
      ctx.beginPath(); ctx.moveTo(x, H * 0.18); ctx.lineTo(x + s, H * 0.18 - s); ctx.lineTo(x + s * 2, H * 0.18); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#4a4560';
      ctx.beginPath(); ctx.moveTo(x + s * 0.6, H * 0.18 - s * 0.6); ctx.lineTo(x + s, H * 0.18 - s); ctx.lineTo(x + s * 1.4, H * 0.18 - s * 0.6); ctx.closePath(); ctx.fill();
    }
    // bosco a ovest
    for (let i = 0; i < 14; i++) {
      const x = W * (0.12 + r() * 0.25), y = H * (0.22 + r() * 0.2);
      ctx.fillStyle = '#1d3a25'; ctx.fillRect(x, y, 14, 14);
      ctx.fillStyle = '#2a4d33'; ctx.fillRect(x + 2, y - 6, 10, 10);
    }
    // fiume
    ctx.strokeStyle = '#2a4a6e'; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(W * 0.05, H * 0.85);
    ctx.quadraticCurveTo(W * 0.4, H * 0.75, W * 0.55, H * 0.45);
    ctx.quadraticCurveTo(W * 0.65, H * 0.28, W * 0.9, H * 0.2); ctx.stroke();

    // strade tra i luoghi
    ctx.strokeStyle = '#6e5a42'; ctx.lineWidth = 4; ctx.setLineDash([8, 6]);
    const pts = k => { const l = WORLD_MAP.find(w => w.key === k); return [l.x * W, l.y * H]; };
    const path = (a, b) => { const [x1, y1] = pts(a), [x2, y2] = pts(b); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); };
    path('brindolo', 'ponte'); path('ponte', 'bivio'); path('bivio', 'bosco'); path('bivio', 'miniere');
    path('bosco', 'castello'); path('miniere', 'castello');
    path('bivio', 'molo'); path('molo', 'castello');
    ctx.setLineDash([]);

    // luogo corrente
    const cur = WORLD_MAP.find(w => w.scenes.includes(G.sceneId));

    for (const loc of WORLD_MAP) {
      const x = loc.x * W, y = loc.y * H;
      // icona
      if (loc.key === 'castello') {
        ctx.fillStyle = '#3a3045'; ctx.fillRect(x - 14, y - 20, 28, 20);
        ctx.fillRect(x - 20, y - 30, 10, 30); ctx.fillRect(x + 10, y - 30, 10, 30);
        ctx.fillStyle = '#e84a5a'; ctx.fillRect(x - 3, y - 16, 6, 8);
      } else if (loc.key === 'bosco') {
        ctx.fillStyle = '#2a4d33'; ctx.fillRect(x - 12, y - 16, 24, 16);
        ctx.fillStyle = '#1d3a25'; ctx.fillRect(x - 6, y - 24, 12, 12);
      } else if (loc.key === 'miniere') {
        ctx.fillStyle = '#4a3524'; ctx.fillRect(x - 14, y - 14, 28, 14);
        ctx.fillStyle = '#1a1a22'; ctx.fillRect(x - 6, y - 10, 12, 10);
      } else if (loc.key === 'molo') {
        // barcone sul fiume
        ctx.fillStyle = '#3a2a18'; ctx.fillRect(x - 16, y - 8, 32, 8);
        ctx.fillRect(x - 2, y - 24, 4, 16);
        ctx.fillStyle = '#e8e0d0';
        ctx.beginPath(); ctx.moveTo(x + 2, y - 24); ctx.lineTo(x + 14, y - 12); ctx.lineTo(x + 2, y - 12); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#2a4a6e'; ctx.fillRect(x - 20, y, 40, 4);
      } else if (loc.key === 'ponte') {
        ctx.fillStyle = '#6e5238'; ctx.fillRect(x - 16, y - 6, 32, 8);
        ctx.fillStyle = '#4a3524'; ctx.fillRect(x - 16, y + 2, 6, 8); ctx.fillRect(x + 10, y + 2, 6, 8);
      } else {
        ctx.fillStyle = '#8a6a45'; ctx.fillRect(x - 10, y - 12, 20, 12);
        ctx.fillStyle = '#7a3025';
        ctx.beginPath(); ctx.moveTo(x - 14, y - 12); ctx.lineTo(x, y - 24); ctx.lineTo(x + 14, y - 12); ctx.closePath(); ctx.fill();
      }
      // etichetta
      ctx.fillStyle = cur && cur.key === loc.key ? '#f5c542' : '#a89cc8';
      ctx.font = "10px 'Press Start 2P'";
      ctx.textAlign = 'center';
      ctx.font = "26px 'Press Start 2P'";
      /* Il numero sta sotto il luogo, tranne quando sotto c'è un altro luogo vicino:
         nel Relais «I Tornanti» e «Paternopoli» distano 29 px in orizzontale e 48 in
         verticale, e il numero del primo cadeva sull'icona del secondo. In quel caso
         il numero va SOPRA. Vale per tutti: se un giorno due luoghi si avvicinano,
         la pianta si aggiusta da sola. */
      const sottoOccupato = WORLD_MAP.some(altro => altro !== loc
        && Math.abs(altro.x * W - x) < 60
        && (altro.y * H - y) > 0 && (altro.y * H - y) < 70);
      ctx.fillText(String(WORLD_MAP.indexOf(loc) + 1), x, sottoOccupato ? y - 34 : y + 46);
      if (cur && cur.key === loc.key) {
        ctx.fillStyle = '#f5c542';
        ctx.font = "18px 'Press Start 2P'";
        ctx.fillText('⭐', x, y - 34);
      }
      ctx.textAlign = 'left';
    }

    // eclissi nell'angolo
    ctx.fillStyle = '#0d0a1a'; ctx.beginPath(); ctx.arc(W - 50, 46, 26, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#e84a5a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(W - 50, 46, 26, 0, Math.PI * 2); ctx.stroke();
  }

  /* ---------- menu ---------- */

  function showMenu() {
    const box = $('modal-generic-content');
    box.innerHTML = `<h2>☰ Menu</h2>
      <p style="color:var(--text-dim);margin-bottom:14px">💾 Salvataggio automatico a ogni scena — utente <b>${currentProfile()}</b>, <b>slot ${G.slot || 1}</b> di 3. Potete chiudere il browser e riprendere quando volete.</p>
      <button class="choice-btn" onclick="document.getElementById('modal-generic').classList.add('hidden')">▶ Torna alla partita</button>
      <button class="choice-btn" onclick="Engine.showDiary()">📔 Diario di viaggio</button>
      <button class="choice-btn" onclick="Engine.showBestiary()">🐺 Bestiario (nemici incontrati)</button>
      <button class="choice-btn" onclick="Engine.backToTitle()">🏠 Torna al titolo (la partita resta salvata)</button>
      <button class="choice-btn" style="border-left-color:var(--red)" onclick="Engine.confirmRestart()">🗑 Ricomincia da capo (cancella il salvataggio)</button>`;
    $('modal-generic').classList.remove('hidden');
  }

  function showDiary() {
    const box = $('modal-generic-content');
    const beats = (G.history || []).map((c, i) => `<div class="ability-box" style="border-left-color:var(--gold)"><div class="ability-desc">${i + 1}. ${c}</div></div>`).join('') ||
      '<p style="color:var(--text-dim)">Il diario è ancora bianco. Le grandi storie iniziano così.</p>';
    box.innerHTML = `<h2>📔 Diario di Viaggio</h2>
      <p style="color:var(--text-dim);margin-bottom:10px">Le tappe della vostra impresa, in ordine:</p>
      ${beats}
      <button class="btn" style="margin-top:12px" onclick="Engine.showMenu()">↩ Menu</button>`;
  }

  function showBestiary() {
    const box = $('modal-generic-content');
    const seen = G.seenEnemies || [];
    let html = `<h2>🐺 Bestiario di Lumelia</h2>
      <p style="color:var(--text-dim);margin-bottom:10px">Creature incontrate finora: ${seen.length}. Le altre... le scoprirete nel modo divertente.</p>`;
    if (!seen.length) html += '<p style="color:var(--text-dim)">Nessuno scontro finora. Beati voi.</p>';
    for (const key of seen) {
      const b = BESTIARY[key];
      if (!b) continue;
      html += `<div class="ability-box" style="display:flex;gap:12px;align-items:center">
        <canvas data-sprite="${b.sprite}" width="56" height="56" style="border:2px solid var(--border);background:#111;flex-shrink:0"></canvas>
        <div><span class="ability-name">${b.name}</span>${b.undead ? ' <span style="color:var(--purple)">· non-morto</span>' : ''}${b.boss ? ' <span style="color:var(--red)">· BOSS</span>' : ''}
        <div class="ability-desc">${b.flavor}<br>PV ${b.maxHp} · CA ${b.ac} · ${b.attack.name}</div></div>
      </div>`;
    }
    html += `<button class="btn" style="margin-top:12px" onclick="Engine.showMenu()">↩ Menu</button>`;
    box.innerHTML = html;
    box.querySelectorAll('canvas[data-sprite]').forEach(cv => Sprites.renderToCanvas(cv, Sprites.registry[cv.dataset.sprite]));
  }

  function backToTitle() {
    $('modal-generic').classList.add('hidden');
    showScreen('screen-title');
    Main.refreshTitle();
  }

  function confirmRestart() {
    const box = $('modal-generic-content');
    box.innerHTML = `<h2>⚠ Sicuri sicuri?</h2>
      <p style="margin-bottom:14px">Cancellerete il salvataggio e tutta la gloria accumulata. Per sempre.</p>
      <button class="choice-btn" onclick="Engine.doRestart()">🗑 Sì, ricominciamo da capo</button>
      <button class="choice-btn" onclick="Engine.showMenu()">↩ No, torna al menu</button>`;
  }

  function doRestart() {
    clearSave();
    $('modal-generic').classList.add('hidden');
    showScreen('screen-title');
    Main.refreshTitle();
  }

  /* ---------- finale ---------- */

  function renderEnding(scene) {
    const choicesEl = $('choices');
    const mins = Math.round((Date.now() - G.stats.start) / 60000);

    // epiloghi personali degli eroi
    const endingType = G.sceneId === 'e_finale_bardo' ? 'redenzione' : G.sceneId === 'e_finale_esilio' ? 'esilio' : 'vittoria';
    if (typeof HERO_EPILOGUES !== 'undefined') {
      const epi = document.createElement('div');
      epi.innerHTML = `<h3 style="font-family:var(--font-pixel);font-size:14px;color:var(--blue);margin:14px 0 8px">🌟 E i nostri eroi?</h3>` +
        G.party.map(h => {
          const text = HERO_EPILOGUES[h.id] && HERO_EPILOGUES[h.id][endingType];
          return text ? `<div class="ability-box"><span class="ability-name">${h.name}${h.player ? ' (' + h.player + ')' : ''}</span><div class="ability-desc">${text}</div></div>` : '';
        }).join('');
      choicesEl.appendChild(epi);
    }

    // cronache di Lumelia: il mondo ricorda le vostre scelte
    if (typeof CRONACA !== 'undefined') {
      const righe = CRONACA.filter(c => G.flags[c.flag]);
      if (righe.length) {
        const cron = document.createElement('div');
        cron.innerHTML = `<h3 style="font-family:var(--font-pixel);font-size:14px;color:var(--purple);margin:14px 0 8px">📜 Cronache di Lumelia — sei mesi dopo</h3>` +
          righe.map(c => `<div class="ability-box" style="border-left-color:var(--purple)"><div class="ability-desc">${c.icon} ${c.text}</div></div>`).join('');
        choicesEl.appendChild(cron);
      }
    }

    // imprese sbloccate
    if (typeof IMPRESE !== 'undefined') {
      const unlocked = IMPRESE.filter(i => G.flags[i.flag]);
      if (unlocked.length) {
        const ach = document.createElement('div');
        ach.innerHTML = `<h3 style="font-family:var(--font-pixel);font-size:14px;color:var(--gold);margin:14px 0 8px">🏆 Imprese sbloccate (${unlocked.length}/${IMPRESE.length})</h3>` +
          unlocked.map(i => `<div class="ability-box" style="border-left-color:var(--gold)"><span class="ability-name">${i.icon} ${i.title}</span><div class="ability-desc">${i.desc}</div></div>`).join('') +
          `<p style="color:var(--text-dim);font-size:18px;margin:6px 0 10px">Le altre ${IMPRESE.length - unlocked.length} imprese vi aspettano in una nuova partita...</p>`;
        choicesEl.appendChild(ach);
      }
    }

    const div = document.createElement('div');
    div.innerHTML = `
      <div class="ability-box" style="border-left-color:var(--gold)">
        <span class="ability-name">📊 Cronaca dell'impresa</span>
        <div class="ability-desc">
          Eroi: ${G.party.map(h => h.name.split(' ')[0]).join(', ')}<br>
          Combattimenti vinti: ${G.stats.combats} · Prove superate: ${G.stats.checksPassed} · Prove fallite: ${G.stats.checksFailed} (le più divertenti)<br>
          Oro finale: ${G.gold} monete · Durata: circa ${mins} minuti<br>
          Via scelta: ${G.flags.via === 'bosco' ? '🌲 il Bosco dei Sussurri' : G.flags.via === 'miniere' ? '⛏ le Miniere di Ferrovecchio' : G.flags.via === 'fiume' ? '🛶 il Fiume Torbido' : '—'}${G.flags.reputazione ? `<br>Fama a Brindolo: ${'⭐'.repeat(Math.min(5, G.flags.reputazione))}` : ''}
        </div>
      </div>`;
    choicesEl.appendChild(div);

    const replay = document.createElement('button');
    replay.className = 'choice-btn';
    replay.innerHTML = `🔄 <b>Nuova partita</b> <span class="choice-tag">Provate l'altra strada al bivio, un altro modo di entrare nel castello, un altro finale...</span>`;
    replay.onclick = () => { clearSave(); showScreen('screen-title'); Main.refreshTitle(); };
    choicesEl.appendChild(replay);

    const title = document.createElement('button');
    title.className = 'choice-btn';
    title.innerHTML = `🏠 Torna al titolo`;
    title.onclick = () => { showScreen('screen-title'); Main.refreshTitle(); };
    choicesEl.appendChild(title);
  }

  return {
    newGame, saveGame, loadGame, hasSave, clearSave, listSaves, firstFreeSlot,
    listProfiles, currentProfile, setCurrentProfile, deleteProfile, renameProfile, exportCode, importCode,
    showScreen, gotoScene, currentScene, renderPartyBar,
    showParty, showHeroSheet, showHeroSheetIdx, showInventory, inspectItem, showRules, showMap, showMenu, showDiary, showBestiary,
    usePotionOutside, applyPotion, backToTitle, confirmRestart, doRestart,
    riprendiDaCheckpoint, registraCaduta, haCheckpoint,
    heroSheetHTML, formatText,
  };
})();
