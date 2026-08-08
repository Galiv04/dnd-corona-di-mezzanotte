/* ============ ENGINE — stato di gioco, scene, prove, modali ============ */

let G = null; // stato di gioco globale

const Engine = (() => {

  const SAVE_KEY = 'corona-di-mezzanotte-save-v1'; // slot storico (migrato allo slot 1)
  const SLOTS = 3;
  const slotKey = n => `corona-save-slot-${n}`;
  const $ = id => document.getElementById(id);

  // migrazione: il vecchio salvataggio singolo diventa lo slot 1
  try {
    const legacy = localStorage.getItem(SAVE_KEY);
    if (legacy && !localStorage.getItem(slotKey(1))) {
      localStorage.setItem(slotKey(1), legacy);
      localStorage.removeItem(SAVE_KEY);
    }
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
      history: [],       // tappe della storia (per il riepilogo alla ripresa)
      seenEnemies: [],   // nemici incontrati (per il bestiario)
      slot,
      difficulty,
      stats: { combats: 0, checksPassed: 0, checksFailed: 0, scenes: 0, start: Date.now() },
    };
    for (const h of G.party) {
      G.uses[h.id] = {};
      for (const ab of h.abilities) G.uses[h.id][ab.id] = ab.uses;
    }
    saveGame();
    gotoScene(CAMPAIGN_START);
    if (solo) {
      const box = $('modal-generic-content');
      box.innerHTML = `<h2>🌟 Modalità Eroe Solitario</h2>
        <p style="margin-bottom:12px">${G.party[0].name} affronta l'avventura DA SOLO. Il destino, impressionato, concede:</p>
        <div class="ability-box"><span class="ability-name">❤ +10 PV massimi e +1 CA</span></div>
        <div class="ability-box"><span class="ability-name">✨ +1 uso a ogni abilità speciale</span></div>
        <div class="ability-box"><span class="ability-name">🧪 2 Pozioni di Cura e +15 monete d'oro di partenza</span></div>
        <p style="color:var(--text-dim);margin-top:10px">Consiglio da DM: comprate pozioni. TANTE pozioni.</p>
        <button class="btn btn-gold" style="margin-top:12px" onclick="document.getElementById('modal-generic').classList.add('hidden')">⚔ Che l'avventura abbia inizio</button>`;
      $('modal-generic').classList.remove('hidden');
    }
  }

  function saveGame() {
    if (!G) return;
    G.savedAt = Date.now();
    try { localStorage.setItem(slotKey(G.slot || 1), JSON.stringify(G)); } catch (e) { /* storage pieno o disabilitato */ }
  }

  function listSaves() {
    const out = [];
    for (let n = 1; n <= SLOTS; n++) {
      try {
        const raw = localStorage.getItem(slotKey(n));
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

  function clearSave(slot = null) {
    try {
      if (slot != null) localStorage.removeItem(slotKey(slot));
      else if (G && G.slot) localStorage.removeItem(slotKey(G.slot));
    } catch (e) {}
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

  function renderScene(scene, instant = false) {
    showScreen('screen-game');
    $('hud-location').textContent = '📍 ' + (scene.caption || '');
    Scenes.paint('scene-canvas', scene.location);
    $('scene-caption').textContent = scene.caption || '';

    const narr = $('narration');
    const choicesEl = $('choices');
    choicesEl.innerHTML = '';

    const html = `<span class="dm-label">🎙 IL NARRATORE</span>` + formatText(scene.text);

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
  }

  function resolveChoice(scene, c) {
    if (typeof Sound !== 'undefined') Sound.play('click');
    if (c.once) {
      if (!G.usedChoices[G.sceneId]) G.usedChoices[G.sceneId] = [];
      G.usedChoices[G.sceneId].push(c.text);
    }
    if (c.gold) G.gold = Math.max(0, G.gold + c.gold);
    if (c.item) G.inventory.push(c.item);
    if (c.removeItem) {
      const i = G.inventory.indexOf(c.removeItem);
      if (i >= 0) G.inventory.splice(i, 1);
    }
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
        Dice.showRoll({
          title: `${h.name} tenta:<br>${STAT_NAMES[check.stat]} — CD ${check.dc}`,
          mod, dc: check.dc,
          onDone: res => {
            if (res.success) G.stats.checksPassed++; else G.stats.checksFailed++;
            gotoScene(res.success ? check.success : check.fail);
          },
        });
      };
      box.appendChild(b);
    });
    $('modal-generic').classList.remove('hidden');
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

  function showParty() {
    const box = $('modal-generic-content');
    box.innerHTML = `<h2>🎭 La Compagnia</h2>` +
      G.party.map((h, i) => `<div class="ability-box" style="cursor:pointer" onclick="Engine.showHeroSheetIdx(${i})">
        <span class="ability-name">${h.name}</span> — ${h.class}${h.player ? ' · ' + h.player : ''}
        <div class="ability-desc">PV ${h.hp}/${h.maxHp} · CA ${h.ac} ${h.down ? '· 💀 A TERRA' : ''} — <i>tocca per la scheda completa</i></div>
      </div>`).join('') +
      `<button class="btn" style="margin-top:14px" onclick="document.getElementById('modal-generic').classList.add('hidden')">✔ Chiudi</button>`;
    $('modal-generic').classList.remove('hidden');
  }

  function showHeroSheetIdx(i) { showHeroSheet(G.party[i]); }

  function showInventory() {
    const box = $('modal-generic-content');
    const counts = {};
    for (const it of G.inventory) counts[it] = (counts[it] || 0) + 1;
    let itemsHtml = Object.entries(counts).map(([it, n]) => {
      const item = ITEMS[it];
      const useBtn = item.usable ? `<button class="btn btn-small" onclick="Engine.usePotionOutside('${it}')">🧪 Bevi</button>` : '';
      return `<div class="inv-item"><span class="inv-name">${item.name}${n > 1 ? ' ×' + n : ''}</span><span class="inv-desc">${item.desc}</span>${useBtn}</div>`;
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

  function showMap() {
    const box = $('modal-generic-content');
    box.innerHTML = `<h2>🗺 Regno di Lumelia</h2><canvas id="map-canvas" width="720" height="480"></canvas>
      <p style="color:var(--text-dim);font-size:19px;margin-top:8px">⭐ = posizione attuale della compagnia</p>
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
      ctx.fillText(loc.label, x, y + 22);
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
      <p style="color:var(--text-dim);margin-bottom:14px">La partita si salva da sola a ogni scena. Potete chiudere il browser e riprendere quando volete.</p>
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
    showScreen, gotoScene, currentScene, renderPartyBar,
    showParty, showHeroSheet, showHeroSheetIdx, showInventory, showRules, showMap, showMenu, showDiary, showBestiary,
    usePotionOutside, applyPotion, backToTitle, confirmRestart, doRestart,
    heroSheetHTML, formatText,
  };
})();
