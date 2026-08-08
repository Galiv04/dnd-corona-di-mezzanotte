/* ============ MAIN — titolo, setup della compagnia, wiring ============ */

const Main = (() => {

  const $ = id => document.getElementById(id);
  let selection = {}; // heroId -> { selected: bool, player: '' }

  function refreshTitle() {
    $('btn-continue').style.display = Engine.hasSave() ? '' : 'none';
  }

  function init() {
    // scena del titolo
    Scenes.paint('title-canvas', 'titolo');
    refreshTitle();

    $('btn-new-game').onclick = () => {
      if (Engine.hasSave()) {
        if (!confirm('C\'è una partita salvata: iniziarne una nuova la cancellerà. Continuare?')) return;
        Engine.clearSave();
      }
      openSetup();
    };
    $('btn-continue').onclick = () => {
      if (!Engine.loadGame()) { alert('Salvataggio non trovato o danneggiato.'); refreshTitle(); }
    };
    $('btn-howto').onclick = () => {
      $('howto-content').innerHTML = RULES_HOWTO;
      Engine.showScreen('screen-howto');
    };
    $('btn-howto-back').onclick = () => Engine.showScreen('screen-title');
    $('btn-setup-back').onclick = () => Engine.showScreen('screen-title');
    $('btn-start-adventure').onclick = startAdventure;

    // header di gioco
    $('btn-map').onclick = Engine.showMap;
    $('btn-party').onclick = Engine.showParty;
    $('btn-inventory').onclick = Engine.showInventory;
    $('btn-rules').onclick = Engine.showRules;
    $('btn-menu').onclick = Engine.showMenu;

    // chiusura modali cliccando fuori
    for (const mid of ['modal-generic', 'modal-char']) {
      $(mid).addEventListener('click', e => { if (e.target === $(mid)) $(mid).classList.add('hidden'); });
    }
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
    $('setup-count').textContent = `Eroi selezionati: ${count} / 6` + (count < 2 ? ' (minimo 2)' : '');
    $('btn-start-adventure').disabled = count < 2;
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
    if (chosen.length < 2) return;
    Engine.newGame(chosen);
  }

  return { init, refreshTitle };
})();

document.addEventListener('DOMContentLoaded', Main.init);
