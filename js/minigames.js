/* ============ MINIGAMES — modulo riusabile della serie (v1) ============
   Cinque tipi: corsa (runner a un tasto coi personaggini), indovinello,
   memoria (Simon), calcolo (quiz a tempo), filastrocca (completa il verso).
   Uso nelle scene:
     minigame: { type, hero, success, fail, config: {...} }
   Il motore chiama Minigames.start(mg, gotoScene). Vedi ../dnd-motore/docs/MINIGIOCHI.md */

const Minigames = (() => {

  let overlay = null;
  let running = null; // { raf, keyH, clickH } — per lo smontaggio pulito

  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function ensureOverlay() {
    if (!overlay) {
      overlay = el('div', 'minigame-overlay hidden');
      overlay.id = 'minigame-overlay';
      document.body.appendChild(overlay);
    }
    return overlay;
  }

  function teardown() {
    if (running) {
      if (running.raf) cancelAnimationFrame(running.raf);
      if (running.keyH) document.removeEventListener('keydown', running.keyH);
      if (running.timer) clearInterval(running.timer);
      if (running.watchdog) clearTimeout(running.watchdog);
      running = null;
    }
    if (overlay) { overlay.classList.add('hidden'); overlay.innerHTML = ''; }
  }

  function finish(mg, done, success) {
    teardown();
    if (typeof Sound !== 'undefined') Sound.play(success ? 'victory' : 'fail');
    done(!!success);
  }

  /* ---------- involucro comune: titolo, COME SI GIOCA, VIA ---------- */
  function frame(mg, titolo, comeSiGioca, buildBody) {
    const ov = ensureOverlay();
    ov.innerHTML = '';
    ov.classList.remove('hidden');
    const box = el('div', 'minigame-box');
    box.appendChild(el('h2', null, titolo));
    const rules = el('div', 'minigame-rules', `<b>🎮 COME SI GIOCA</b><br>${comeSiGioca}`);
    box.appendChild(rules);
    const body = el('div', 'minigame-body');
    box.appendChild(body);
    const via = el('button', 'btn btn-gold', '▶ VIA');
    box.appendChild(via);
    ov.appendChild(box);
    via.onclick = () => { via.remove(); rules.style.opacity = 0.55; buildBody(body); };
    return body;
  }

  /* ==================== CORSA — runner a un tasto ==================== */
  /* config: { ostacoli: n (default 9), velocita: px/s (default 260),
               tema: 'siepi'|'libri'|'lavatrici'|'tornanti', suolo: '#123', cielo: '#000' } */
  function corsa(mg, hero, done) {
    const cfg = mg.config || {};
    const TOT = cfg.ostacoli || 9;
    frame(mg, cfg.titolo || `🏃 La corsa di ${hero.name}`,
      `${hero.name} corre da solo — il tavolo fa il tifo. <b>UN comando</b>: SPAZIO / click / tap = <b>SALTO</b>. Supera <b>${TOT} ostacoli</b> senza inciamparci. Tre inciampi = fallita.`,
      (body) => {
        const W = Math.min(720, Math.max(320, document.body.clientWidth - 60)), H = 240;
        const cv = el('canvas', 'minigame-canvas');
        cv.width = W; cv.height = H;
        body.appendChild(cv);
        const hud = el('div', 'minigame-hud', '');
        body.appendChild(hud);
        const ctx = cv.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        const def = Sprites.registry[hero.sprite];
        const GROUND = H - 34, SIZE = 48;
        const st = {
          x: 60, y: GROUND - SIZE, vy: 0, onGround: true,
          t: 0, last: null, passed: 0, hits: 0, obs: [], nextIn: 0.9, speed: cfg.velocita || 260, spawned: 0,
        };
        const temaColori = { siepi: '#2e5c31', libri: '#7a5a38', lavatrici: '#9aa3ad', tornanti: '#5a5a66' }[cfg.tema] || '#2e5c31';

        function jump() { if (st.onGround) { st.vy = -430; st.onGround = false; if (typeof Sound !== 'undefined') Sound.play('click'); } }
        const keyH = (e) => { if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); jump(); } };
        document.addEventListener('keydown', keyH);
        cv.addEventListener('pointerdown', jump);
        running = { keyH };

        function spawn() {
          const alto = Math.random() < 0.25 && st.spawned > 2; // ogni tanto un ostacolo alto (si passa sotto? no: salto più preciso)
          st.obs.push({ x: W + 30, w: 18 + Math.random() * 14, h: alto ? 52 : 26 + Math.random() * 16, hit: false, ok: false });
          st.spawned++;
        }

        // driver dei frame: rAF quando c'è, timer di riserva quando il browser
        // lo sospende (pagina nascosta, ambienti di test) — il gioco non si congela mai
        let ticked = false;
        function schedule() {
          if (!running) return;
          running.raf = requestAnimationFrame(loop);
          if (!running.watchdog) {
            running.watchdog = setTimeout(() => {
              if (!ticked && running) {
                running.timer = setInterval(() => loop(performance.now()), 33);
              }
            }, 500);
          }
        }
        function loop(ts) {
          if (!running) return;
          ticked = true;
          if (st.last == null) st.last = ts;
          const dt = Math.min(0.033, (ts - st.last) / 1000);
          st.last = ts; st.t += dt;

          // fisica
          st.vy += 1250 * dt; st.y += st.vy * dt;
          if (st.y >= GROUND - SIZE) { st.y = GROUND - SIZE; st.vy = 0; st.onGround = true; }

          // ostacoli
          st.nextIn -= dt;
          if (st.nextIn <= 0 && st.spawned < TOT) { spawn(); st.nextIn = 0.85 + Math.random() * 0.7; }
          for (const o of st.obs) {
            o.x -= st.speed * dt;
            const heroBox = { x: st.x + 10, y: st.y + 6, w: SIZE - 20, h: SIZE - 8 };
            const oBox = { x: o.x, y: GROUND - o.h, w: o.w, h: o.h };
            if (!o.hit && !o.ok) {
              const coll = heroBox.x < oBox.x + oBox.w && heroBox.x + heroBox.w > oBox.x && heroBox.y + heroBox.h > oBox.y;
              if (coll) { o.hit = true; st.hits++; if (typeof Sound !== 'undefined') Sound.play('hit'); }
              else if (o.x + o.w < st.x) { o.ok = true; st.passed++; if (typeof Sound !== 'undefined') Sound.play('gold'); }
            }
          }
          st.obs = st.obs.filter(o => o.x > -60);

          // disegno
          ctx.fillStyle = cfg.cielo || '#141018'; ctx.fillRect(0, 0, W, H);
          ctx.fillStyle = '#0c0a10';
          for (let i = 0; i < 5; i++) { const px = (W - ((st.t * 40 + i * 180) % (W + 200))); ctx.fillRect(px, 40 + (i % 3) * 22, 60, 8); }
          ctx.fillStyle = cfg.suolo || '#241d28'; ctx.fillRect(0, GROUND, W, H - GROUND);
          ctx.fillStyle = '#3a2f40';
          for (let i = 0; i < 12; i++) { const px = W - ((st.t * st.speed + i * 90) % (W + 90)); ctx.fillRect(px, GROUND, 40, 3); }
          for (const o of st.obs) {
            ctx.fillStyle = o.hit ? '#6b2430' : temaColori;
            ctx.fillRect(o.x, GROUND - o.h, o.w, o.h);
            ctx.fillStyle = 'rgba(0,0,0,.25)';
            ctx.fillRect(o.x, GROUND - o.h, o.w, 5);
          }
          const bob = st.onGround ? Math.sin(st.t * 18) * 2 : 0;
          if (def) Sprites.drawSprite(ctx, def.map, def.palette, st.x, st.y + bob, SIZE / (def.map.length >= 32 ? 32 : 16), true);
          hud.innerHTML = `Superati: <b>${st.passed}/${TOT}</b> · Inciampi: <b style="color:${st.hits ? 'var(--red)' : 'inherit'}">${st.hits}/3</b>`;

          // esiti
          if (st.hits >= 3) return finish(mg, done, false);
          if (st.passed + st.obs.filter(o => o.hit).length >= TOT && st.obs.every(o => o.ok || o.hit)) {
            return finish(mg, done, st.hits < 3);
          }
          if (!running.timer) schedule();
        }
        schedule();
      });
  }

  /* ==================== INDOVINELLO / FILASTROCCA ==================== */
  /* config indovinello: { testo, risposte: [{t, ok}], titolo }
     config filastrocca: { versi: 'testo con ___', risposte: [{t, ok}], titolo } */
  function scelte(mg, done, titolo, istruzioni, testoHtml, risposte) {
    frame(mg, titolo, istruzioni, (body) => {
      body.appendChild(el('div', 'minigame-testo', testoHtml));
      const mix = [...risposte].sort(() => Math.random() - 0.5);
      for (const r of mix) {
        const b = el('button', 'choice-btn', r.t);
        b.onclick = () => finish(mg, done, !!r.ok);
        body.appendChild(b);
      }
    });
  }

  function indovinello(mg, done) {
    const c = mg.config || {};
    scelte(mg, done, c.titolo || '🗝 L\'indovinello',
      'Il TAVOLO ragiona insieme, ad alta voce. UNA risposta sola: sceglietela bene.',
      `<i>${c.testo}</i>`, c.risposte || []);
  }

  function filastrocca(mg, done) {
    const c = mg.config || {};
    scelte(mg, done, c.titolo || '🎵 La filastrocca',
      'Completate il verso mancante. Cantarla ad alta voce aiuta (e fa scena).',
      `<i>${(c.versi || '').replace(/___/g, '<b>______</b>')}</i>`, c.risposte || []);
  }

  /* ==================== MEMORIA — Simon ==================== */
  /* config: { simboli: ['🕯','🔔','🍷','🗝'], lunghezza: 5, titolo } */
  function memoria(mg, done) {
    const c = mg.config || {};
    const SIM = c.simboli || ['🕯', '🔔', '🍷', '🗝'];
    const LEN = c.lunghezza || 5;
    const SUONI = ['click', 'gold', 'heal', 'dice'];
    frame(mg, c.titolo || '🧠 La sequenza',
      `Guardate la sequenza che si illumina, poi RIPETETELA toccando i simboli nello stesso ordine. Cresce di uno a ogni giro: arrivate a <b>${LEN}</b>. Un errore = fallita.`,
      (body) => {
        const seq = Array.from({ length: LEN }, () => Math.floor(Math.random() * SIM.length));
        const stato = el('div', 'minigame-hud', '');
        const grid = el('div', 'minigame-simon', '');
        const btns = SIM.map((s, i) => {
          const b = el('button', 'minigame-simon-btn', s);
          b.disabled = true;
          grid.appendChild(b);
          return b;
        });
        body.appendChild(stato); body.appendChild(grid);
        let round = 1, idx = 0, mode = 'show';

        function flash(i, ms = 420) {
          return new Promise(res => {
            btns[i].classList.add('lit');
            if (typeof Sound !== 'undefined') Sound.play(SUONI[i % SUONI.length]);
            setTimeout(() => { btns[i].classList.remove('lit'); setTimeout(res, 140); }, ms);
          });
        }
        async function mostra() {
          mode = 'show'; idx = 0;
          stato.innerHTML = `Giro <b>${round}/${LEN}</b> — guardate...`;
          btns.forEach(b => b.disabled = true);
          for (let i = 0; i < round; i++) await flash(seq[i]);
          stato.innerHTML = `Giro <b>${round}/${LEN}</b> — tocca a voi!`;
          btns.forEach(b => b.disabled = false);
          mode = 'input';
        }
        btns.forEach((b, i) => b.onclick = async () => {
          if (mode !== 'input') return;
          await flash(i, 200);
          if (i !== seq[idx]) return finish(mg, done, false);
          idx++;
          if (idx === round) {
            if (round === LEN) return finish(mg, done, true);
            round++; setTimeout(mostra, 500);
          }
        });
        mostra();
      });
  }

  /* ==================== CALCOLO — quiz lampo a tempo ==================== */
  /* config: { domande: [{q, r: [{t, ok}]}], secondi: 15, titolo } — passa con 2/3 giuste */
  function calcolo(mg, done) {
    const c = mg.config || {};
    const DOM = c.domande || [];
    const SEC = c.secondi || 15;
    const daPassare = Math.ceil(DOM.length * 2 / 3);
    frame(mg, c.titolo || '🧮 Il conto',
      `${DOM.length} domande, <b>${SEC} secondi</b> l'una, si risponde insieme ad alta voce. Servono <b>${daPassare} risposte giuste</b>. La barra scende: quando è vuota, la domanda è persa.`,
      (body) => {
        let i = 0, giuste = 0;
        const qEl = el('div', 'minigame-testo', '');
        const barra = el('div', 'minigame-timerbar', '<div></div>');
        const ansBox = el('div', null, '');
        const stato = el('div', 'minigame-hud', '');
        body.appendChild(stato); body.appendChild(qEl); body.appendChild(barra); body.appendChild(ansBox);

        function next() {
          if (running && running.timer) clearInterval(running.timer);
          if (i >= DOM.length) return finish(mg, done, giuste >= daPassare);
          const d = DOM[i];
          stato.innerHTML = `Domanda <b>${i + 1}/${DOM.length}</b> · Giuste: <b>${giuste}</b>`;
          qEl.innerHTML = `<b>${d.q}</b>`;
          ansBox.innerHTML = '';
          const mix = [...d.r].sort(() => Math.random() - 0.5);
          for (const r of mix) {
            const b = el('button', 'choice-btn', r.t);
            b.onclick = () => { if (typeof Sound !== 'undefined') Sound.play(r.ok ? 'success' : 'fail'); if (r.ok) giuste++; i++; next(); };
            ansBox.appendChild(b);
          }
          let left = SEC * 10;
          barra.firstChild.style.width = '100%';
          running = running || {};
          running.timer = setInterval(() => {
            left--; barra.firstChild.style.width = (left / (SEC * 10) * 100) + '%';
            if (left <= 0) { clearInterval(running.timer); if (typeof Sound !== 'undefined') Sound.play('fail'); i++; next(); }
          }, 100);
        }
        next();
      });
  }

  /* ==================== avvio ==================== */

  function pickHero(mg, then) {
    // per i minigiochi d'azione: il tavolo sceglie chi corre (come per le prove)
    const vivi = G.party.filter(h => !h.down && !h.preso && !h.morto);
    if (mg.hero) { const h = G.party.find(x => x.id === mg.hero); return then(h || vivi[0]); }
    if (vivi.length === 1) return then(vivi[0]);
    const ov = ensureOverlay();
    ov.innerHTML = ''; ov.classList.remove('hidden');
    const box = el('div', 'minigame-box');
    box.appendChild(el('h2', null, '🎮 Chi gioca?'));
    box.appendChild(el('p', null, 'Il tavolo sceglie chi affronta il minigioco. Gli altri fanno il tifo (obbligatorio).'));
    for (const h of vivi) {
      const b = el('button', 'choice-btn', `${h.name} <span class="choice-tag">${h.class}</span>`);
      b.onclick = () => then(h);
      box.appendChild(b);
    }
    ov.appendChild(box);
  }

  function start(mg, done) {
    teardown();
    const go = ok => done(ok);
    switch (mg.type) {
      case 'corsa': return pickHero(mg, h => corsa(mg, h, go));
      case 'indovinello': return indovinello(mg, go);
      case 'filastrocca': return filastrocca(mg, go);
      case 'memoria': return memoria(mg, go);
      case 'calcolo': return calcolo(mg, go);
      default: console.error('Minigioco sconosciuto:', mg.type); done(true);
    }
  }

  return { start, teardown };
})();
