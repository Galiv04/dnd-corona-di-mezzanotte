/* ============ MAIN — titolo, setup della compagnia, wiring ============ */

const Main = (() => {

  const $ = id => document.getElementById(id);
  let selection = {}; // heroId -> { selected: bool, player: '' }
  let pendingSlot = null; // slot scelto per la nuova partita
  let pendingDifficulty = 'normale';

  /* Selettore degli slot di salvataggio (mode: 'load' | 'overwrite') */
  function pickSlot(mode) {
    const saves = Engine.listSaves();
    const box = $('modal-generic-content');
    const fmtAge = ts => {
      if (!ts) return '';
      const m = Math.round((Date.now() - ts) / 60000);
      return m < 60 ? `${m} min fa` : m < 1440 ? `${Math.round(m / 60)} ore fa` : `${Math.round(m / 1440)} giorni fa`;
    };
    box.innerHTML = `<h2>${mode === 'load' ? '📂 Quale partita riprendete?' : '⚠ Slot pieni: quale partita sovrascrivere?'}</h2>`;
    saves.forEach((s, i) => {
      const n = i + 1;
      const b = document.createElement('button');
      b.className = 'choice-btn';
      if (s) {
        b.innerHTML = `<b>Slot ${n}</b> — ${s.heroes}${s.players ? ' (' + s.players + ')' : ''} ${s.ended ? '· 🏆 COMPLETATA' : ''}
          <span class="choice-tag">📍 ${s.caption} · 💰 ${s.gold} oro · 🕐 ${fmtAge(s.savedAt)}</span>`;
        b.onclick = () => {
          $('modal-generic').classList.add('hidden');
          if (mode === 'load') { if (!Engine.loadGame(n)) alert('Salvataggio danneggiato.'); }
          else { Engine.clearSave(n); pendingSlot = n; openSetup(); }
        };
      } else {
        b.innerHTML = `<b>Slot ${n}</b> — <span class="choice-tag">vuoto</span>`;
        if (mode === 'overwrite') b.onclick = () => { $('modal-generic').classList.add('hidden'); pendingSlot = n; openSetup(); };
        else b.disabled = true;
      }
      box.appendChild(b);
    });
    const close = document.createElement('button');
    close.className = 'btn';
    close.style.marginTop = '12px';
    close.textContent = '↩ Indietro';
    close.onclick = () => $('modal-generic').classList.add('hidden');
    box.appendChild(close);
    $('modal-generic').classList.remove('hidden');
  }

  function refreshTitle() {
    $('btn-continue').style.display = Engine.hasSave() ? '' : 'none';
  }

  function init() {
    // scena del titolo
    Scenes.paint('title-canvas', 'titolo');
    refreshTitle();

    $('btn-new-game').onclick = () => {
      const free = Engine.firstFreeSlot();
      if (free) { pendingSlot = free; openSetup(); }
      else pickSlot('overwrite'); // tutti gli slot pieni: scegliere quale sovrascrivere
    };
    $('btn-continue').onclick = () => {
      const saves = Engine.listSaves().filter(Boolean);
      if (saves.length === 1) {
        if (!Engine.loadGame(saves[0].slot)) { alert('Salvataggio non trovato o danneggiato.'); refreshTitle(); }
      } else {
        pickSlot('load');
      }
    };
    $('btn-howto').onclick = () => {
      $('howto-content').innerHTML = RULES_HOWTO;
      Engine.showScreen('screen-howto');
    };
    $('btn-howto-back').onclick = () => Engine.showScreen('screen-title');
    $('btn-setup-back').onclick = () => Engine.showScreen('screen-title');
    $('btn-start-adventure').onclick = startAdventure;
    $('btn-diff-normale').onclick = () => setDifficulty('normale');
    $('btn-diff-facile').onclick = () => setDifficulty('facile');

    // header di gioco
    $('btn-map').onclick = Engine.showMap;
    $('btn-party').onclick = Engine.showParty;
    $('btn-inventory').onclick = Engine.showInventory;
    $('btn-rules').onclick = Engine.showRules;
    $('btn-sound').textContent = Sound.isMuted() ? '🔇' : '🔊';
    $('btn-sound').onclick = () => { $('btn-sound').textContent = Sound.toggleMute() ? '🔇' : '🔊'; };
    $('btn-fullscreen').onclick = () => {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen().catch(() => {});
    };
    $('btn-menu').onclick = Engine.showMenu;

    // chiusura modali cliccando fuori
    for (const mid of ['modal-generic', 'modal-char']) {
      $(mid).addEventListener('click', e => { if (e.target === $(mid)) $(mid).classList.add('hidden'); });
    }
  }

  function setDifficulty(d) {
    pendingDifficulty = d;
    $('btn-diff-normale').classList.toggle('btn-gold', d === 'normale');
    $('btn-diff-facile').classList.toggle('btn-gold', d === 'facile');
  }

  /* ---------- setup della compagnia ---------- */

  function openSetup() {
    selection = {};
    for (const h of HEROES) selection[h.id] = { selected: false, player: '' };
    renderSetup();
    Engine.showScreen('screen-setup');
  }

  function renderSetup() {
    const grid = $('char-grid');
    grid.innerHTML = '';
    for (const h of HEROES) {
      const card = document.createElement('div');
      card.className = 'char-card' + (selection[h.id].selected ? ' selected' : '');
      card.innerHTML = `
        <div class="char-card-top">
          <canvas width="72" height="72"></canvas>
          <div>
            <div class="char-name">${h.name}</div>
            <div class="char-class">${h.class}</div>
          </div>
        </div>
        <div class="char-tag">"${h.tagline}"</div>
        <div class="char-card-btns">
          <button class="btn btn-small" data-act="story">📜 Storia</button>
          <button class="btn btn-small ${selection[h.id].selected ? 'btn-danger' : 'btn-gold'}" data-act="toggle">
            ${selection[h.id].selected ? '✖ Rimuovi' : '✔ Scegli'}
          </button>
        </div>
        ${selection[h.id].selected ? `<input class="player-name-input" placeholder="Nome del giocatore (facoltativo)" value="${selection[h.id].player.replace(/"/g, '&quot;')}" maxlength="18">` : ''}
      `;
      const cv = card.querySelector('canvas');
      Sprites.renderToCanvas(cv, Sprites.registry[h.sprite]);

      card.querySelector('[data-act="story"]').onclick = e => { e.stopPropagation(); showCharDetail(h); };
      card.querySelector('[data-act="toggle"]').onclick = e => {
        e.stopPropagation();
        const count = Object.values(selection).filter(s => s.selected).length;
        if (!selection[h.id].selected && count >= 6) return;
        selection[h.id].selected = !selection[h.id].selected;
        renderSetup();
      };
      const input = card.querySelector('.player-name-input');
      if (input) {
        input.onclick = e => e.stopPropagation();
        input.oninput = () => { selection[h.id].player = input.value; };
      }
      grid.appendChild(card);
    }
    updateSetupBar();
  }

  function updateSetupBar() {
    const count = Object.values(selection).filter(s => s.selected).length;
    $('setup-count').textContent = `Eroi selezionati: ${count} / 6` +
      (count === 0 ? ' (minimo 1)' : count === 1 ? ' — 🌟 Eroe Solitario!' : '');
    $('btn-start-adventure').disabled = count < 1;
  }

  function showCharDetail(h) {
    const box = $('modal-char-content');
    box.innerHTML = Engine.heroSheetHTML(h, false) +
      `<div style="display:flex;gap:10px;margin-top:14px">
        <button class="btn btn-gold" id="btn-char-pick">✔ Scegli ${h.name.split(' ')[0]}</button>
        <button class="btn" id="btn-char-close">Chiudi</button>
      </div>`;
    $('modal-char').classList.remove('hidden');
    $('btn-char-close').onclick = () => $('modal-char').classList.add('hidden');
    $('btn-char-pick').onclick = () => {
      const count = Object.values(selection).filter(s => s.selected).length;
      if (!selection[h.id].selected && count < 6) selection[h.id].selected = true;
      $('modal-char').classList.add('hidden');
      renderSetup();
    };
  }

  function startAdventure() {
    const chosen = HEROES.filter(h => selection[h.id].selected)
      .map(h => ({ heroId: h.id, player: selection[h.id].player.trim() }));
    if (chosen.length < 1) return;
    Engine.newGame(chosen, pendingSlot, pendingDifficulty);
    pendingSlot = null;
  }

  return { init, refreshTitle };
})();

document.addEventListener('DOMContentLoaded', Main.init);
