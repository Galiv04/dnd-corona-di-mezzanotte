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
      if (running.keyU) document.removeEventListener('keyup', running.keyU);
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
          /* Anche qui i contatori vanno DENTRO il canvas: sotto, su uno schermo
             basso, non si vedono mentre si corre (vedi l'apnea). */
          ctx.fillStyle = 'rgba(4,10,16,.62)'; ctx.fillRect(6, 6, 250, 24);
          ctx.font = "12px 'Press Start 2P', monospace";
          ctx.fillStyle = '#eef4f3';
          ctx.fillText(`${st.passed}/${TOT}`, 12, 23);
          ctx.fillStyle = st.hits ? '#cf3d4d' : '#93aeb4';
          ctx.fillText(`inciampi ${st.hits}/3`, 78, 23);
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
      const colonna = el('div', 'choices');
      const mix = [...risposte].sort(() => Math.random() - 0.5);
      for (const r of mix) {
        const b = el('button', 'choice-btn', r.t);
        b.onclick = () => finish(mg, done, !!r.ok);
        colonna.appendChild(b);
      }
      body.appendChild(colonna);
    });
  }

  function indovinello(mg, done) {
    const c = mg.config || {};
    scelte(mg, done, c.titolo || '🗝 L\'indovinello',
      'Il TAVOLO ragiona insieme, ad alta voce. UNA risposta sola: sceglietela bene.',
      `<i>${(c.testo || '').replace(/^\s*>\s?/gm, '').replace(/\n/g, '<br>')}</i>`, c.risposte || []);
  }

  function filastrocca(mg, done) {
    const c = mg.config || {};
    scelte(mg, done, c.titolo || '🎵 La filastrocca',
      'Completate il verso mancante. Cantarla ad alta voce aiuta (e fa scena).',
      `<i>${(c.versi || '').replace(/___/g, '<b>______</b>').replace(/\n/g, '<br>')}</i>`, c.risposte || []);
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


  /* ==================== APNEA — la discesa (minigioco firma di Pandataria) ==================== */
  /* config: { profondita: 18, oggetto: 'chiave', extra: 8, extraFlag: 'x', fiato: 100,
               titolo, cosa: 'la cosa che luccica' }
     UN comando: TIENI PREMUTO = scendi, LASCI = risali (il corpo galleggia).
     Il fiato scende sempre, e più sei profondo più scende in fretta.
     A profondità c'è l'oggetto. Più giù (extra) c'è QUALCOSA CHE NON TI SERVE — e che vorrai vedere:
     `cosaExtra` è la riga che descrive quel qualcosa nel briefing, in modo che il giocatore SAPPIA
     cosa si sta giocando quando decide di scendere ancora cinque metri. */
  function apnea(mg, hero, done) {
    const cfg = mg.config || {};
    const TARGET = cfg.profondita || 18;
    const EXTRA = cfg.extra ? TARGET + cfg.extra : null;
    /* Il fiato iniziale NON è un numero fisso della scena: è la risorsa del gruppo.
       Con poco Fiato certe profondità sono fisicamente fuori portata, e il gioco
       lo dice PRIMA di far scendere qualcuno. Vedi Engine.apneaFiato(). */
    const FIATO0 = cfg.fiato || (typeof Engine !== 'undefined' && Engine.apneaFiato ? Engine.apneaFiato() : 100);
    const ARRIVO = (typeof Engine !== 'undefined' && Engine.metriPossibili) ? Engine.metriPossibili() : 99;
    frame(mg, cfg.titolo || `🫁 L'apnea di ${hero.name}`,
      `${hero.name} scende da sola. <b>TIENI PREMUTO</b> (spazio / dito / mouse) per <b>scendere</b>, lascia per <b>risalire</b>: il corpo galleggia da solo.<br>
       Il <b>fiato</b> scende sempre, e più giù sei, più in fretta se ne va. ${cfg.cosa ? `A <b>${TARGET} metri</b> c'è ${cfg.cosa}.` : `Quello che vi serve è a <b>${TARGET} metri</b>.`}<br>
       <span style="color:var(--red)">Torna su col fiato ancora in petto. Non fare l'eroe.</span><br>
       <span style="color:${ARRIVO < TARGET ? 'var(--red)' : 'var(--green)'}">🫁 Con il fiato che avete adesso (${FIATO0}) arrivate a circa <b>${ARRIVO} metri</b>${ARRIVO < TARGET ? ` — e quella cosa sta a ${TARGET}. <b>Non ce la fate.</b> Andate a mangiare, a dormire, o riparate la bombola, e tornate.` : '. Ce la fate, se non vi fermate a guardare.'}</span>${EXTRA ? `<br><span style="color:var(--text-dim)">E cinque metri più giù, a <b>${EXTRA}</b>, ${cfg.cosaExtra || 'c\'è qualcosa che non vi serve'}. Non vi serve. Nessuno vi obbliga.</span>` : ''}`,
      (body) => {
        const W = Math.min(420, Math.max(280, document.body.clientWidth - 80)), H = 320;
        const cv = el('canvas', 'minigame-canvas');
        cv.width = W; cv.height = H;
        body.appendChild(cv);
        const hud = el('div', 'minigame-hud', '');
        const bar = el('div', 'minigame-timerbar', '<div></div>');
        body.appendChild(bar); body.appendChild(hud);
        const ctx = cv.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        const def = Sprites.registry[hero.sprite];
        const MAXD = (EXTRA || TARGET) + 6;           // metri rappresentati sul canvas
        const st = {
          d: 0, v: 0, giu: false, fiato: FIATO0, t: 0, last: null,
          preso: false, visto: false, risalito: false, morto: false,
          bolle: [], neve: Array.from({ length: 40 }, () => ({ x: Math.random() * W, y: Math.random() * H, s: 0.2 + Math.random() * 0.6 })),
        };
        const y = m => 26 + (m / MAXD) * (H - 52);     // metri -> pixel

        const giuOn = () => { st.giu = true; };
        const giuOff = () => { st.giu = false; };
        const keyD = e => { if (e.code === 'Space' || e.code === 'ArrowDown') { e.preventDefault(); giuOn(); } };
        const keyU = e => { if (e.code === 'Space' || e.code === 'ArrowDown') { e.preventDefault(); giuOff(); } };
        document.addEventListener('keydown', keyD);
        document.addEventListener('keyup', keyU);
        cv.addEventListener('pointerdown', giuOn);
        cv.addEventListener('pointerup', giuOff);
        cv.addEventListener('pointerleave', giuOff);
        running = { keyH: keyD, keyU };

        let ticked = false;
        function schedule() {
          if (!running) return;
          running.raf = requestAnimationFrame(loop);
          if (!running.watchdog) running.watchdog = setTimeout(() => {
            if (!ticked && running) running.timer = setInterval(() => loop(performance.now()), 33);
          }, 500);
        }

        function loop(ts) {
          if (!running) return;
          ticked = true;
          if (st.last == null) st.last = ts;
          const dt = Math.min(0.033, (ts - st.last) / 1000);
          st.last = ts; st.t += dt;

          // movimento verticale: spinta giù, galleggiamento su
          const target = st.giu ? 3.4 : -2.4;
          st.v += (target - st.v) * Math.min(1, dt * 5);
          st.d = Math.max(0, Math.min(MAXD, st.d + st.v * dt));

          // il fiato: costo base + costo della profondità (la pressione)
          st.fiato -= dt * (4.8 + st.d * 0.28);
          if (st.giu) st.fiato -= dt * 1.4;

          // eventi di profondità
          if (!st.preso && st.d >= TARGET) {
            st.preso = true;
            if (typeof Sound !== 'undefined') Sound.play('item');
          }
          if (EXTRA && !st.visto && st.d >= EXTRA) {
            st.visto = true;
            if (typeof Sound !== 'undefined') Sound.play('coro');
          }
          if (st.preso && st.d <= 0.4) st.risalito = true;
          if (st.fiato <= 0) st.morto = true;

          // bolle
          if (Math.random() < dt * 6) st.bolle.push({ x: W / 2 + (Math.random() - 0.5) * 22, m: st.d, r: 1 + Math.random() * 2 });
          st.bolle.forEach(b => { b.m -= dt * 6; });
          st.bolle = st.bolle.filter(b => b.m > -1);

          /* ---- disegno: più giù = più buio, più stretto, più vuoto ---- */
          const prof = st.d / MAXD;
          ctx.fillStyle = '#071019'; ctx.fillRect(0, 0, W, H);
          // gradiente d'acqua
          const g = ctx.createLinearGradient(0, 0, 0, H);
          g.addColorStop(0, '#16455e'); g.addColorStop(0.35, '#0b2537'); g.addColorStop(1, '#03070c');
          ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
          // superficie che tremola
          ctx.fillStyle = 'rgba(180,230,255,.30)';
          for (let x = 0; x < W; x += 6) ctx.fillRect(x, 20 + Math.sin(st.t * 3 + x * 0.12) * 3, 5, 3);
          // marine snow (l'unica cosa che si muove nel buio)
          ctx.fillStyle = 'rgba(220,235,255,.5)';
          for (const n of st.neve) {
            n.y -= n.s * 22 * dt * 60 * 0.02;
            if (n.y < 24) { n.y = H; n.x = Math.random() * W; }
            ctx.fillRect(n.x, n.y, 2, 2);
          }
          // tacche dei metri
          ctx.fillStyle = 'rgba(255,255,255,.13)';
          for (let m = 5; m < MAXD; m += 5) { ctx.fillRect(4, y(m), 12, 1); }
          // l'oggetto
          if (!st.preso) {
            const pulse = 0.6 + Math.sin(st.t * 4) * 0.4;
            ctx.fillStyle = `rgba(255,210,127,${pulse})`;
            ctx.fillRect(W / 2 - 5, y(TARGET) - 4, 10, 8);
            ctx.fillStyle = 'rgba(255,210,127,.18)';
            ctx.fillRect(W / 2 - 14, y(TARGET) - 13, 28, 26);
          }
          // la cosa più giù: si vede solo se ci arrivi
          if (EXTRA && st.d > EXTRA - 5) {
            const al = Math.min(1, (st.d - (EXTRA - 5)) / 4);
            ctx.fillStyle = `rgba(143,29,44,${0.30 * al})`;
            ctx.fillRect(0, y(EXTRA) - 16, W, 44);
            ctx.fillStyle = `rgba(220,200,205,${0.5 * al})`;
            ctx.fillRect(W / 2 - 3, y(EXTRA), 6, 14);
            ctx.fillRect(W / 2 - 9, y(EXTRA) + 3, 18, 3);
          }
          // bolle
          ctx.fillStyle = 'rgba(210,240,255,.55)';
          for (const b of st.bolle) ctx.fillRect(b.x, y(Math.max(0, b.m)), b.r, b.r);
          // l'eroe
          const hy = y(st.d) - 18;
          if (def) Sprites.drawSprite(ctx, def.map, def.palette, W / 2 - 18, hy, 36 / (def.map.length >= 32 ? 32 : 16), true);
          // il buio che stringe
          const vign = ctx.createRadialGradient(W / 2, hy + 18, 10, W / 2, hy + 18, Math.max(40, W * (1 - prof * 0.72)));
          vign.addColorStop(0, 'rgba(0,0,0,0)');
          vign.addColorStop(1, `rgba(0,0,0,${0.35 + prof * 0.6})`);
          ctx.fillStyle = vign; ctx.fillRect(0, 0, W, H);

          const f = Math.max(0, st.fiato / FIATO0);
          /* IL FIATO E I METRI, DENTRO IL CANVAS. La barra HTML sotto il canvas, su
             uno schermo da 720 px, finisce a 812: fuori dallo schermo. Chi gioca
             l'apnea deve vedere quanto fiato gli resta SENZA scorrere, sennò la
             meccanica non esiste. Verificato guardando il gioco vero, 23 ago 2026. */
          const pad = 10, bw = Math.min(240, W * 0.42), bh = 12;
          ctx.fillStyle = 'rgba(4,10,16,.62)';
          ctx.fillRect(pad - 4, pad - 4, bw + 8, bh + 30);
          ctx.fillStyle = 'rgba(255,255,255,.14)';
          ctx.fillRect(pad, pad, bw, bh);
          ctx.fillStyle = f > 0.5 ? '#ffd27f' : f > 0.22 ? '#d08a2a' : '#cf3d4d';
          ctx.fillRect(pad, pad, Math.max(0, bw * f), bh);
          ctx.fillStyle = 'rgba(0,0,0,.5)';
          for (let i = 1; i < 4; i++) ctx.fillRect(pad + bw * i / 4, pad, 1, bh);
          ctx.font = "12px 'Press Start 2P', monospace";
          ctx.fillStyle = f > 0.22 ? '#eef4f3' : '#ff9aa4';
          ctx.fillText(`${st.d.toFixed(1)}m  fiato ${Math.ceil(f * 100)}%`, pad, pad + bh + 16);
          if (st.preso) { ctx.fillStyle = '#57c08f'; ctx.fillText('PRESO - RISALI', pad, pad + bh + 32); }
          bar.firstChild.style.width = (f * 100) + '%';
          bar.firstChild.style.background = f > 0.5 ? 'var(--gold)' : f > 0.22 ? '#d08a2a' : 'var(--red)';
          hud.innerHTML = `<b>${st.d.toFixed(1)} m</b> · fiato <b>${Math.ceil(f * 100)}%</b>` +
            (st.preso ? ' · <span style="color:var(--green)">PRESO — RISALI</span>' : '') +
            (st.visto ? ' · <span style="color:var(--red)">l\'hai visto</span>' : '');

          if (st.morto) {
            if (st.visto) G.flags[cfg.extraFlag || 'ha_visto_giu'] = true;
            return finish(mg, done, false);
          }
          if (st.risalito) {
            if (cfg.oggetto && !G.inventory.includes(cfg.oggetto)) G.inventory.push(cfg.oggetto);
            if (st.visto) G.flags[cfg.extraFlag || 'ha_visto_giu'] = true;
            return finish(mg, done, true);
          }
          if (!running.timer) schedule();
        }
        schedule();
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
      case 'apnea': return pickHero(mg, h => apnea(mg, h, go));
      case 'indovinello': return indovinello(mg, go);
      case 'filastrocca': return filastrocca(mg, go);
      case 'memoria': return memoria(mg, go);
      case 'calcolo': return calcolo(mg, go);
      default: console.error('Minigioco sconosciuto:', mg.type); done(true);
    }
  }

  return { start, teardown };
})();
