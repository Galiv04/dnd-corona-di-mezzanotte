/* ============ SCENES — sfondi pixel/blocchi procedurali ============ */

const Scenes = (() => {

  // RNG con seme, per texture riproducibili
  function rng(seed) {
    let s = seed >>> 0;
    return () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  /* shade(colore, fattore) — schiarisce o scurisce.
     Accetta ANCHE 'rgb(r,g,b)', non solo '#rrggbb': mix() restituisce 'rgb(...)' e
     blocks() chiama shade() sul colore che riceve, quindi bastava passare un colore
     mescolato a blocks() per far fare a parseInt un NaN, e NaN>>16&255 vale 0 — cioè
     un nero perfettamente valido che nessun controllo intercetta. Leggere le due
     notazioni qui sana tutti i punti di chiamata in una volta. */
  function shade(col, f) {
    let r, g, b;
    if (col[0] === '#') {
      const n = parseInt(col.slice(1), 16);
      r = (n >> 16) & 255; g = (n >> 8) & 255; b = n & 255;
    } else {
      const m = col.match(/-?\d+/g) || [0, 0, 0];
      r = +m[0]; g = +m[1]; b = +m[2];
    }
    r = Math.max(0, Math.min(255, Math.round(r * f)));
    g = Math.max(0, Math.min(255, Math.round(g * f)));
    b = Math.max(0, Math.min(255, Math.round(b * f)));
    return `rgb(${r},${g},${b})`;
  }

  // Riempi area con blocchi stile minecraft (variazione di tono per blocco)
  function blocks(ctx, x, y, w, h, color, blockSize, rand, variance = 0.18) {
    for (let by = y; by < y + h; by += blockSize) {
      for (let bx = x; bx < x + w; bx += blockSize) {
        const f = 1 - variance / 2 + rand() * variance;
        ctx.fillStyle = shade(color, f);
        ctx.fillRect(bx, by, Math.min(blockSize, x + w - bx), Math.min(blockSize, y + h - by));
        // bordo superiore più chiaro (effetto 3D blocco)
        ctx.fillStyle = shade(color, f * 1.15);
        ctx.fillRect(bx, by, Math.min(blockSize, x + w - bx), 2);
      }
    }
  }

  function skyGradient(ctx, W, H, top, bottom, bands = 8) {
    for (let i = 0; i < bands; i++) {
      const t = i / (bands - 1);
      const c1 = parseInt(top.slice(1), 16), c2 = parseInt(bottom.slice(1), 16);
      const r = Math.round(((c1 >> 16) & 255) * (1 - t) + ((c2 >> 16) & 255) * t);
      const g = Math.round(((c1 >> 8) & 255) * (1 - t) + ((c2 >> 8) & 255) * t);
      const b = Math.round((c1 & 255) * (1 - t) + (c2 & 255) * t);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(0, Math.floor(H * i / bands), W, Math.ceil(H / bands) + 1);
    }
  }

  function stars(ctx, W, H, rand, n = 60) {
    for (let i = 0; i < n; i++) {
      const x = Math.floor(rand() * W), y = Math.floor(rand() * H * 0.7);
      ctx.fillStyle = rand() > 0.8 ? '#fff' : '#9a90c0';
      const s = rand() > 0.9 ? 3 : 2;
      ctx.fillRect(x, y, s, s);
    }
  }

  /* ---------- ECLISSI ----------
     Fase 0 = appena iniziata (anello sottile e pallido)
     Fase 1 = mezzanotte (corona rossa larga e pulsante).
     La imposta il motore scena per scena: vedi Engine.eclipsePhaseFor().  */
  let eclipsePhase = 0.3;
  function setEclipse(p) { eclipsePhase = Math.max(0, Math.min(1, p)); }
  function getEclipse() { return eclipsePhase; }

  // Disco a pixel PERFETTAMENTE simmetrico (il vecchio disegno era storto)
  function pixelDisc(ctx, cx, cy, r, px = 3) {
    const CX = Math.round(cx / px) * px, CY = Math.round(cy / px) * px;
    const R = Math.max(px, Math.round(r / px) * px);
    for (let dy = -R; dy < R; dy += px) {
      const yy = dy + px / 2;                     // centro della riga: simmetrico per dy e -dy-px
      const hw = Math.sqrt(Math.max(0, R * R - yy * yy));
      const w = Math.max(px, Math.round(hw / px) * px);
      ctx.fillRect(CX - w, CY + dy, w * 2, px);
    }
  }

  function mix(a, b, t) {
    const ca = parseInt(a.slice(1), 16), cb = parseInt(b.slice(1), 16);
    const r = Math.round(((ca >> 16) & 255) * (1 - t) + ((cb >> 16) & 255) * t);
    const g = Math.round(((ca >> 8) & 255) * (1 - t) + ((cb >> 8) & 255) * t);
    const bl = Math.round((ca & 255) * (1 - t) + (cb & 255) * t);
    return `rgb(${r},${g},${bl})`;
  }

  function moon(ctx, x, y, r, color = '#e8e0f0', eclipse = false, phase = null) {
    const p = phase != null ? phase : eclipsePhase;
    if (!eclipse) { ctx.fillStyle = color; pixelDisc(ctx, x, y, r); return; }

    // alone esterno: si allarga e si arrossa con l'avanzare della notte
    const halo = Math.round(r * (0.5 + p * 1.4));
    ctx.fillStyle = `rgba(${Math.round(180 + 60 * p)},${Math.round(90 - 50 * p)},${Math.round(140 - 60 * p)},${0.05 + p * 0.10})`;
    pixelDisc(ctx, x, y, r + halo);
    ctx.fillStyle = `rgba(${Math.round(200 + 40 * p)},${Math.round(80 - 40 * p)},${Math.round(120 - 60 * p)},${0.06 + p * 0.12})`;
    pixelDisc(ctx, x, y, r + Math.round(halo * 0.55));

    // la corona: da tenue lilla a rosso sangue, sempre più spessa
    const ring = Math.round(3 + p * 9);
    ctx.fillStyle = mix('#c8b8e8', '#f0323e', p);
    pixelDisc(ctx, x, y, r + ring);
    // bordo interno più caldo, per dare spessore alla corona
    ctx.fillStyle = mix('#e8e0f0', '#ff6a52', Math.min(1, p * 1.2));
    pixelDisc(ctx, x, y, r + Math.round(ring * 0.45));

    // il disco nero che divora il sole
    ctx.fillStyle = mix('#2a1020', '#12060c', p);
    pixelDisc(ctx, x, y, r);

    // lingue di corona quando mezzanotte è vicina
    if (p > 0.55) {
      const n = 8, len = Math.round((p - 0.55) * r * 1.6);
      ctx.fillStyle = mix('#e8607a', '#ff3a3a', p);
      for (let i = 0; i < n; i++) {
        const a = i * (Math.PI * 2 / n) + p;
        const fx = x + Math.cos(a) * (r + ring + 1), fy = y + Math.sin(a) * (r + ring + 1);
        ctx.fillRect(Math.round(fx - 1), Math.round(fy - 1), 3, 3);
        ctx.fillRect(Math.round(fx + Math.cos(a) * len - 1), Math.round(fy + Math.sin(a) * len - 1), 3, 3);
      }
    }
  }

  /* ---------- helper di terreno e vegetazione ---------- */

  // Profilo di terreno irregolare: niente più bande orizzontali nette
  function ground(ctx, W, H, topY, color, rand, blockSize = 12, jag = 8) {
    for (let x = 0; x < W; x += blockSize) {
      const off = Math.round((rand() - 0.5) * jag / blockSize) * blockSize;
      blocks(ctx, x, topY + off, blockSize, H - topY - off, color, blockSize, rand, 0.22);
    }
  }

  // Colline morbide sul fondo (silhouette a gradini, non una banda piatta)
  function hills(ctx, W, baseY, height, color, rand, step = 24) {
    let h = height * (0.5 + rand() * 0.5);
    for (let x = 0; x < W; x += step) {
      h += (rand() - 0.5) * height * 0.5;
      h = Math.max(height * 0.25, Math.min(height, h));
      blocks(ctx, x, baseY - h, step, h + 4, color, 12, rand, 0.14);
    }
  }

  // ALBERO — la chioma poggia sul tronco (era il bug principale: fluttuava)
  function tree(ctx, x, groundY, size, leaf, trunk, rand) {
    const tw = Math.max(8, Math.round(size / 6) * 2);
    const topY = groundY - size;                    // cima del tronco
    blocks(ctx, x - tw / 2, topY, tw, size, trunk, 6, rand);
    // radici
    blocks(ctx, x - tw, groundY - 8, tw * 2, 8, trunk, 6, rand, 0.3);
    const lw = size * 1.15;
    // la chioma parte SOTTO la cima del tronco e la avvolge
    const leafBottom = topY + size * 0.22;
    blocks(ctx, x - lw / 2, leafBottom - lw * 0.5, lw, lw * 0.5, leaf, 8, rand, 0.28);
    blocks(ctx, x - lw * 0.36, leafBottom - lw * 0.8, lw * 0.72, lw * 0.34, leaf, 8, rand, 0.28);
    blocks(ctx, x - lw * 0.2, leafBottom - lw * 0.98, lw * 0.4, lw * 0.24, leaf, 8, rand, 0.28);
  }

  // Salice piangente: chioma tondeggiante + rami che ricadono da sotto
  function willow(ctx, x, groundY, size, leaf, trunk, rand) {
    const tw = Math.max(8, Math.round(size / 7) * 2);
    const topY = groundY - size;
    blocks(ctx, x - tw / 2, topY, tw, size, trunk, 6, rand);
    blocks(ctx, x - tw, groundY - 8, tw * 2, 8, trunk, 6, rand, 0.3);
    const lw = size * 1.25;
    const crown = topY + size * 0.16;               // base della chioma
    // chioma a tre fasce, la più larga al centro
    blocks(ctx, x - lw * 0.36, crown - lw * 0.46, lw * 0.72, lw * 0.16, leaf, 8, rand, 0.24);
    blocks(ctx, x - lw / 2, crown - lw * 0.32, lw, lw * 0.2, leaf, 8, rand, 0.24);
    blocks(ctx, x - lw * 0.44, crown - lw * 0.14, lw * 0.88, lw * 0.16, leaf, 8, rand, 0.24);
    // rami che ricadono da SOTTO la chioma, più lunghi al centro
    for (let i = -4; i <= 4; i++) {
      const bx = x + i * (lw / 9.5);
      const len = size * (0.42 - Math.abs(i) * 0.045) + rand() * 8;
      blocks(ctx, bx - 3, crown + lw * 0.02, 6, Math.max(10, len), leaf, 6, rand, 0.34);
    }
  }

  function bush(ctx, x, groundY, size, color, rand) {
    blocks(ctx, x - size / 2, groundY - size * 0.6, size, size * 0.6, color, 6, rand, 0.3);
    blocks(ctx, x - size * 0.3, groundY - size * 0.85, size * 0.6, size * 0.3, color, 6, rand, 0.3);
  }

  /* FUNGO LUMINOSO. Erano sette macchie viola di diciotto pixel col cappello piatto, e
     con l'alone così piccolo (16×12) da essere invisibile: cioè sette cose piccole in
     un'inquadratura, e nessuna che facesse da soggetto — mentre il testo di b2 dice che
     nella radura «i funghi luminosi crescono ALTI COME PERSONE» e che il più grosso apre
     due occhi. Alti come persone, a questa scala, sono i sessanta-novanta pixel di uno
     sprite d'eroe. Il cappello è una cupola (non un rettangolo), sotto ha le lamelle in
     ombra, il gambo si allarga al piede, e l'alone è grande quanto la luce che deve
     dare: un fungo luminoso che non illumina niente è solo un fungo viola. */
  function glowMushroom(ctx, x, groundY, capW, rand) {
    const capH = Math.round(capW * 0.46), stemH = Math.round(capW * 0.86);
    const sw = Math.max(5, Math.round(capW * 0.26 / 3) * 3);
    const capY = groundY - stemH;
    glow(ctx, x, capY - capH * 0.3, capW * 2.2, (stemH + capH) * 1.5, '200,90,224');
    ctx.fillStyle = '#8f7ea8'; ctx.fillRect(Math.round(x - sw / 2), capY, sw, stemH);
    ctx.fillStyle = '#cfc0e0'; ctx.fillRect(Math.round(x - sw / 2), capY, Math.max(3, Math.round(sw / 3)), stemH);
    ctx.fillStyle = '#8f7ea8'; ctx.fillRect(Math.round(x - sw / 2 - 3), groundY - 6, sw + 6, 6);  // piede allargato
    ctx.fillStyle = '#5a3a70'; ctx.fillRect(Math.round(x - capW * 0.34), capY - 4, Math.round(capW * 0.68), 5); // lamelle
    ctx.fillStyle = '#8f2eb0'; pixelEllipse(ctx, x, capY - capH * 0.42, capW * 0.5, capH * 0.56, 3);
    ctx.fillStyle = '#c85ae0'; pixelEllipse(ctx, x, capY - capH * 0.62, capW * 0.42, capH * 0.40, 3);
    ctx.fillStyle = '#e8b8f5'; pixelEllipse(ctx, x - capW * 0.13, capY - capH * 0.82, capW * 0.20, capH * 0.16, 3);
    ctx.fillStyle = '#f0e0f8';
    for (let i = 0; i < 3; i++) {
      const a = -0.4 - i * 0.9 + rand() * 0.3, rr = capW * (0.16 + rand() * 0.16);
      ctx.fillRect(Math.round(x + Math.cos(a) * rr), Math.round(capY - capH * 0.5 + Math.sin(a) * capH * 0.3), 4, 3);
    }
  }

  function reeds(ctx, x, groundY, n, rand) {
    for (let i = 0; i < n; i++) {
      const rx = x + i * 5, h = 14 + rand() * 16;
      ctx.fillStyle = '#3d6a3a'; ctx.fillRect(rx, groundY - h, 3, h);
      ctx.fillStyle = '#7a6a2a'; ctx.fillRect(rx - 1, groundY - h - 7, 5, 7);
    }
  }

  /* ---------- helper di costruzioni ---------- */

  function house(ctx, x, groundY, w, h, wall, roof, rand, windowLit = true) {
    blocks(ctx, x, groundY - h, w, h, wall, 8, rand, 0.12);
    // tetto a spiovente: ogni gradino è più stretto e più alto
    const steps = 7, over = 14;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const rw = (w + over * 2) * (1 - t);
      blocks(ctx, x + (w - rw) / 2, groundY - h - 8 - i * 8, rw, 9, roof, 8, rand, 0.16);
    }
    // porta con architrave
    ctx.fillStyle = '#3a2a18'; ctx.fillRect(x + w / 2 - 9, groundY - 28, 18, 28);
    ctx.fillStyle = '#5a4530'; ctx.fillRect(x + w / 2 - 11, groundY - 31, 22, 4);
    ctx.fillStyle = '#c8a032'; ctx.fillRect(x + w / 2 + 4, groundY - 16, 3, 3); // maniglia
    if (windowLit) {
      for (const wx of [x + 10, x + w - 24]) {
        glow(ctx, wx + 7, groundY - h + 19, 40, 40, '245,197,66');
        ctx.fillStyle = '#f5c542'; ctx.fillRect(wx, groundY - h + 12, 14, 14);
        ctx.fillStyle = '#5a4530'; ctx.fillRect(wx + 6, groundY - h + 12, 2, 14);
      }
    }
  }

  // Torcia con staffa: non fluttua più a mezz'aria
  function torch(ctx, x, y, bracket = true) {
    if (bracket) { ctx.fillStyle = '#3a3a45'; ctx.fillRect(x - 5, y + 4, 16, 4); ctx.fillRect(x - 5, y + 4, 4, 12); }
    ctx.fillStyle = '#6e4a2a'; ctx.fillRect(x, y, 6, 22);
    glow(ctx, x + 3, y - 6, 54, 54, '245,166,35');
    flame(ctx, x + 3, y + 3, 16, 22, rng(x * 7 + y)); // una lingua, non un quadratino
  }

  // Cartello di legno con righe di "scritta"
  function sign(ctx, x, groundY, w = 84, h = 30, lines = 2) {
    ctx.fillStyle = '#4a3524'; ctx.fillRect(x - 4, groundY - 46, 8, 46);
    ctx.fillStyle = '#6e5238'; ctx.fillRect(x - w / 2, groundY - 76, w, h);
    ctx.fillStyle = '#5a4530'; ctx.fillRect(x - w / 2, groundY - 76, w, 3);
    ctx.fillStyle = '#2e2118';
    for (let i = 0; i < lines; i++) {
      const lw = w * (0.5 + (i % 2) * 0.2);
      ctx.fillRect(x - lw / 2, groundY - 66 + i * 9, lw, 4);
    }
  }

  // Ponticello di legno sopra un ruscello
  function bridge(ctx, x, y, w, rand) {
    blocks(ctx, x, y, w, 12, '#6e5238', 10, rand, 0.16);
    blocks(ctx, x, y - 3, w, 4, '#8a6a45', 10, rand, 0.1);
    // parapetti
    for (const side of [0, 1]) {
      const px = x + (side ? w - 8 : 0);
      ctx.fillStyle = '#4a3524';
      ctx.fillRect(px, y - 30, 8, 30);
    }
    ctx.fillStyle = '#5a4530';
    ctx.fillRect(x, y - 26, w, 6);
    ctx.fillRect(x + w * 0.45, y - 30, 8, 30);
  }

  // Trave da miniera: montanti fino al soffitto + traversa
  function mineBeam(ctx, x, ceilY, floorY, rand) {
    blocks(ctx, x, ceilY, 14, floorY - ceilY, '#4a3524', 10, rand, 0.14);
    blocks(ctx, x + 70, ceilY, 14, floorY - ceilY, '#4a3524', 10, rand, 0.14);
    blocks(ctx, x - 8, ceilY, 100, 14, '#5a4530', 10, rand, 0.12);
  }

  // Ellisse a pixel, simmetrica come pixelDisc ma con raggi diversi sui due assi
  function pixelEllipse(ctx, cx, cy, rx, ry, px = 3) {
    const CX = Math.round(cx / px) * px, CY = Math.round(cy / px) * px;
    const RX = Math.max(px, Math.round(rx / px) * px), RY = Math.max(px, Math.round(ry / px) * px);
    for (let dy = -RY; dy < RY; dy += px) {
      const yy = dy + px / 2;
      const k = 1 - (yy * yy) / (RY * RY);
      if (k <= 0) continue;
      const w = Math.max(px, Math.round(RX * Math.sqrt(k) / px) * px);
      ctx.fillRect(CX - w, CY + dy, w * 2, px);
    }
  }

  /* ALONE LUMINOSO — a ellissi concentriche, non a rettangoli.
     Prima erano tre fillRect concentrici: attorno a una candela, a un fungo o a un
     lampadario si vedeva la SCATOLA, e l'occhio la legge come un cartellino, una
     piastrella o una cornice — cioè come contenuto, non come luce. La luce non ha
     spigoli, quindi nemmeno il suo alone: quattro ellissi di raggio calante e alpha
     crescente verso il centro, e il bordo sfuma invece di tagliare.
     w e h restano la LARGHEZZA e l'ALTEZZA nominali dell'alone (come prima), così
     tutti i punti di chiamata non cambiano. */
  function glow(ctx, x, y, w, h, rgb) {
    /* Il numero di gusci va col DIAMETRO, non fisso: quattro gusci su una candela sono
       una sfumatura, gli stessi quattro sul lampadario del ballo (320 px) sono tre
       anelli concentrici — e un anello è uno spigolo, solo tondo. Un guscio ogni tredici
       pixel di diametro, e l'alpha di ciascuno si ricalcola per arrivare sempre allo stesso
       0,22 al centro: così un alone grande non diventa anche più opaco. */
    const n = Math.max(5, Math.min(22, Math.round(Math.max(w, h) / 13)));
    const a = 1 - Math.pow(1 - 0.22, 1 / n);
    ctx.fillStyle = `rgba(${rgb},${a.toFixed(4)})`;
    for (let i = 0; i < n; i++) {
      const k = 1.20 - (i * 1.02) / n;
      pixelEllipse(ctx, x, y, Math.max(4, w * k * 0.5), Math.max(4, h * k * 0.5), 3);
    }
  }

  /* FIAMMA — una lingua sola: larga in basso, strozzata verso la punta.
     Il fuoco si riconosce dal PROFILO. Due fillRect concentrici a spigolo vivo (com'era
     nel focolare della taverna e in quello delle cucine) leggono come un pannello
     luminoso acceso, non come una fiamma. E la temperatura va messa nel posto giusto:
     il cuore bianco-giallo sta in BASSO, dove il fuoco è più caldo, e la punta si
     raffredda verso il rosso. */
  function flame(ctx, cx, baseY, w, h, rand, px = 4) {
    const rows = Math.max(3, Math.round(h / px));
    const lean = (rand() - 0.5) * w * 0.5;
    for (let i = 0; i < rows; i++) {
      const u = i / (rows - 1);
      const y = baseY - px - i * px;
      const hw = Math.max(px, Math.round((w / 2) * Math.pow(1 - u, 0.6) / px) * px);
      const x = Math.round((cx + lean * u * u) / px) * px;
      ctx.fillStyle = u > 0.8 ? '#c8451c' : (u > 0.5 ? '#e8722a' : '#f5a623');
      ctx.fillRect(x - hw, y, hw * 2, px);
      if (u < 0.6) {
        const cw = Math.max(px, Math.round(hw * 0.5 / px) * px);
        ctx.fillStyle = u < 0.3 ? '#fff2c0' : '#f5e042';
        ctx.fillRect(x - cw, y, cw * 2, px);
      }
    }
  }

  // Fuoco di legna: ceppi incrociati, brace fra loro e tre-quattro lingue di altezza diversa
  function fire(ctx, cx, baseY, w, h, rand) {
    glow(ctx, cx, baseY - h * 0.42, w * 2.4, h * 2.1, '245,166,35');
    ctx.fillStyle = '#3a2a18'; ctx.fillRect(cx - w * 0.5, baseY - 9, w, 11);
    ctx.fillStyle = '#4a3524';
    ctx.fillRect(cx - w * 0.46, baseY - 17, w * 0.52, 9);
    ctx.fillRect(cx - w * 0.02, baseY - 19, w * 0.5, 9);
    ctx.fillStyle = '#c8341c'; ctx.fillRect(cx - w * 0.3, baseY - 7, w * 0.6, 6);
    ctx.fillStyle = '#f5701c'; ctx.fillRect(cx - w * 0.18, baseY - 6, w * 0.34, 4);
    for (const [dx, k] of [[-0.32, 0.52], [-0.11, 0.84], [0.13, 1], [0.33, 0.64]]) {
      flame(ctx, cx + dx * w, baseY - 12, w * 0.44, h * k, rand);
    }
  }

  /* Vena di cristalli. `scale` serve dove i cristalli devono FARSI VEDERE (la grotta
     della cisterna, il cui testo li nomina come sorgente di luce): a scala 1 un
     grappolo sta in 34x26 px, sotto la soglia oltre la quale un oggetto dice cosa è. */
  function crystalVein(ctx, x, y, n, rand, scale = 1) {
    for (let i = 0; i < n; i++) {
      const cx = x + (rand() - 0.5) * 34 * scale, cy = y + (rand() - 0.5) * 26 * scale;
      const s = Math.round((6 + rand() * 5) * scale);
      glow(ctx, cx + s / 2, cy + s / 2, s * 3.4, s * 3.4, '90,216,224');
      ctx.fillStyle = '#3aa8b4'; ctx.fillRect(cx, cy, s, s);
      ctx.fillStyle = '#5ad8e0'; ctx.fillRect(cx, cy, s, Math.max(2, Math.round(s * 0.55)));
      ctx.fillStyle = '#a0f0f5'; ctx.fillRect(cx + 1, cy + 1, Math.max(2, s - 4), Math.max(2, Math.round(s * 0.34)));
    }
  }

  /* ---------- LA TAVOLA DELLE CUCINE ----------
     Il testo di k1 costruisce tutta l'inquietudine su un banchetto PERFETTO senza
     commensali: «anatre laccate, torri di soufflé che non collassano, una zuppa che fuma
     con pazienza infinita. Non manca NULLA», e «piatti su piatti, disposti con precisione
     da parata militare. Vassoi d'argento allineati come soldati». Il tavolo era invece
     spoglio: un tagliere, due cubetti colorati e un coltellino, settantaquattro pixel di
     roba su quattrocentoventitré di piano — cioè il quadro diceva l'esatto contrario del
     testo. Qui ci sono quattro portate GRANDI (settanta-novanta pixel ciascuna) alla
     stessa quota e a passo regolare: la regolarità è quella che il testo chiama
     militare, e va vista. Pochi oggetti grandi, non dieci puntini. */

  // Vassoio d'argento: tre fasce (piano, filo di luce sul bordo, ombra sotto)
  function tray(ctx, cx, y, w) {
    ctx.fillStyle = '#8f96a6'; ctx.fillRect(Math.round(cx - w / 2), y, w, 5);
    ctx.fillStyle = '#ccd2de'; ctx.fillRect(Math.round(cx - w / 2), y, w, 2);
    ctx.fillStyle = '#5f6474'; ctx.fillRect(Math.round(cx - w / 2), y + 5, w, 3);
  }

  // Anatra laccata: corpo tondo in tre toni, collo e testa da un lato, cosce dall'altro
  function roastDuck(ctx, cx, baseY, w) {
    const h = Math.round(w * 0.46);
    ctx.fillStyle = '#7a3d18'; pixelEllipse(ctx, cx, baseY - h * 0.42, w * 0.5, h * 0.52, 3);
    ctx.fillStyle = '#a35c22'; pixelEllipse(ctx, cx, baseY - h * 0.58, w * 0.44, h * 0.38, 3);
    ctx.fillStyle = '#d69a4a'; pixelEllipse(ctx, cx - w * 0.06, baseY - h * 0.78, w * 0.26, h * 0.16, 3);
    // collo e testa: è il dettaglio che dice «anatra» e non «pagnotta»
    ctx.fillStyle = '#8a4a1e'; ctx.fillRect(Math.round(cx + w * 0.36), Math.round(baseY - h * 1.5), 8, Math.round(h * 0.8));
    ctx.fillStyle = '#a35c22'; ctx.fillRect(Math.round(cx + w * 0.34), Math.round(baseY - h * 1.62), 15, 9);
    ctx.fillStyle = '#e0b45a'; ctx.fillRect(Math.round(cx + w * 0.48), Math.round(baseY - h * 1.56), 8, 4);
    // cosce legate
    ctx.fillStyle = '#8a4a1e';
    ctx.fillRect(Math.round(cx - w * 0.52), Math.round(baseY - h * 0.62), 16, 9);
    ctx.fillRect(Math.round(cx - w * 0.50), Math.round(baseY - h * 0.36), 14, 8);
  }

  // Zuppiera col coperchio e il vapore: la zuppa del testo «fuma con pazienza infinita»
  function tureen(ctx, cx, baseY, w, rand) {
    const h = Math.round(w * 0.60);
    ctx.fillStyle = '#b8b2a2'; pixelEllipse(ctx, cx, baseY - h * 0.26, w * 0.5, h * 0.34, 3);
    ctx.fillStyle = '#dcd6c6'; pixelEllipse(ctx, cx, baseY - h * 0.34, w * 0.44, h * 0.26, 3);
    // manici sul bordo, dove stanno per davvero
    ctx.fillStyle = '#c8a032';
    ctx.fillRect(Math.round(cx - w * 0.60), Math.round(baseY - h * 0.52), 12, 6);
    ctx.fillRect(Math.round(cx + w * 0.48), Math.round(baseY - h * 0.52), 12, 6);
    // coperchio: fascia del bordo + cupola + pomello
    ctx.fillStyle = '#c8a032'; ctx.fillRect(Math.round(cx - w * 0.52), Math.round(baseY - h * 0.62), Math.round(w * 1.04), 6);
    ctx.fillStyle = '#dcd6c6'; pixelEllipse(ctx, cx, baseY - h * 0.66, w * 0.42, h * 0.26, 3);
    ctx.fillStyle = '#f0ece0'; pixelEllipse(ctx, cx - w * 0.08, baseY - h * 0.78, w * 0.2, h * 0.1, 3);
    ctx.fillStyle = '#c8a032'; ctx.fillRect(Math.round(cx - 5), Math.round(baseY - h * 1.02), 10, 8);
    /* Vapore: sbuffi che salgono, si allargano e si diradano. Al primo tentativo ci
       avevo messo anche un glow: su una parete scura l'alone pallido diventava una PALLA
       grigia appesa sopra la zuppiera, e la zuppiera sembrava tenere un pallone. Il
       vapore non illumina niente, quindi non ha alone: ha solo forma e trasparenza. */
    for (let i = 0; i < 4; i++) {
      const t = i / 3;
      ctx.fillStyle = `rgba(246,243,232,${(0.62 - t * 0.40).toFixed(3)})`;
      pixelEllipse(ctx, cx + Math.sin(t * 4.2 + rand()) * w * 0.20, baseY - h * 1.15 - i * 14, 6 + i * 3, 4 + i * 2, 3);
    }
  }

  // Pila di piatti: dischi visti quasi di taglio, uno sopra l'altro
  function plateStack(ctx, cx, baseY, w, n = 7) {
    for (let i = 0; i < n; i++) {
      const y = baseY - i * 7;
      ctx.fillStyle = '#9a9689'; pixelEllipse(ctx, cx, y, w * 0.5, 5, 3);
      ctx.fillStyle = '#eae6d8'; pixelEllipse(ctx, cx, y - 2, w * 0.5, 3, 3);
    }
  }

  /* CASSERUOLA DI RAME appesa alla rastrelliera — casseruola, non pentola, perché è la
     parola che usa il testo: «la salsa, in una casseruola di rame», «passa un dito sul
     bordo di una casseruola di rame». Erano sette rettangoli arancioni di 22-38 px in
     fila, e un rettangolo pieno non è un recipiente. Tre cose la fanno leggere: il FONDO
     TONDO (i fianchi diritti solo per la metà alta, poi l'ellisse), la fascia chiara
     sull'IMBOCCATURA col filo di luce sul filo, e il MANICO LUNGO di legno attaccato al
     bordo — che è anche il punto da cui una casseruola si appende davvero, quindi il
     gancio sta là e non in mezzo alla pancia. Rame in tre fasce di tono. */
  function copperPan(ctx, cx, rimY, w, h) {
    const R = Math.round(w / 2), straight = Math.round(h * 0.52);
    for (let i = 0; i < h; i += 3) {
      const t = i / h;
      let hw = R;
      if (i > straight) { const u = (i - straight) / (h - straight); hw = R * Math.sqrt(Math.max(0, 1 - u * u)); }
      hw = Math.max(3, Math.round(hw));
      ctx.fillStyle = t < 0.28 ? '#c88a3a' : (t < 0.68 ? '#a86428' : '#7d461c');
      ctx.fillRect(cx - hw, rimY + 9 + i, hw * 2, 3);
    }
    ctx.fillStyle = '#d8a04a'; ctx.fillRect(cx - R, rimY, w, 10);
    ctx.fillStyle = '#f0c878'; ctx.fillRect(cx - R, rimY, w, 3);
    const hl = Math.round(w * 0.5);
    ctx.fillStyle = '#5a4530'; ctx.fillRect(cx + R, rimY + 2, hl, 7);
    ctx.fillStyle = '#7a5c3d'; ctx.fillRect(cx + R, rimY + 2, hl, 2);
    ctx.fillStyle = '#3a2a18'; ctx.fillRect(cx + R + hl - 8, rimY - 12, 4, 14);   // gancio sul manico
  }

  /* Soufflé. Al primo tentativo era una torre di tre pirottini impilati e leggeva come
     una pila di frittelle: la «torre» di un soufflé non è una pila, è UNO che è cresciuto
     fuori dal suo stampo. Quindi stampo scanalato (le scanalature verticali sono il
     dettaglio che dice «stampo da soufflé» e non «bicchiere») e cupola dorata più larga
     del bordo, spaccata in cima come si spacca crescendo. */
  function souffle(ctx, cx, baseY, w) {
    const R = Math.round(w / 2);
    ctx.fillStyle = '#c4bfae'; ctx.fillRect(cx - R, baseY - 32, w, 32);
    ctx.fillStyle = '#8f8a7c';
    for (let i = 1; i < 5; i++) ctx.fillRect(cx - R + Math.round(i * w / 5), baseY - 30, 3, 28);
    ctx.fillStyle = '#eae4d2'; ctx.fillRect(cx - R - 3, baseY - 36, w + 6, 6);      // bordo dello stampo
    ctx.fillStyle = '#a87a34'; pixelEllipse(ctx, cx, baseY - 44, R * 1.16, 15, 3);   // cupola cresciuta
    ctx.fillStyle = '#d69a4a'; pixelEllipse(ctx, cx, baseY - 52, R * 0.94, 10, 3);
    ctx.fillStyle = '#f0c878'; pixelEllipse(ctx, cx - R * 0.22, baseY - 58, R * 0.44, 5, 3);
    ctx.fillStyle = '#7d5a24';                                                       // le spaccature
    ctx.fillRect(Math.round(cx - R * 0.5), baseY - 50, 4, 9);
    ctx.fillRect(Math.round(cx + R * 0.36), baseY - 53, 4, 11);
  }

  /* LA CORONA DI MEZZANOTTE — un solo disegno, per il titolo e per la vetta.
     Prima erano due francobolli diversi: 28 px d'oro sulla schermata del titolo e 40 px
     d'oro sull'altare della vetta. Due errori in uno. Il primo è la taglia: sotto i
     sessanta pixel un oggetto non dice cosa è, dice solo che c'è — e questo è l'oggetto
     che dà il nome al gioco, quindi deve essere il SOGGETTO, un terzo dell'inquadratura.
     Il secondo è il colore: il testo di c_vetta non lascia margini, «un cerchio di
     metallo NERO con una gemma rossa che pulsa come un cuore», e il quadro si adegua al
     testo. Metallo nero in tre fasce (alta più chiara, media base, bassa in ombra) più
     il filo di luce viola sul bordo dove prende il bagliore dell'eclissi: è la
     convenzione che trasforma una sagoma di cartone in metallo.
     Il cerchietto è disegnato come un'ELLISSE vista di tre quarti — arco vicino in
     basso, arco lontano in alto, punte che salgono da tutto il giro — perché è quello
     che fa leggere «cerchio» invece di «barra».
     cx = centro, baseY = punto più basso del cerchietto, w = larghezza totale. */
  function crown(ctx, cx, baseY, w, rand) {
    const px = w >= 200 ? 4 : 3;    // sulla schermata del titolo la corona è più piccola
    const q = v => Math.round(v / px) * px;
    const half = q(w / 2), band = q(w * 0.18), d = q(w * 0.07);
    const yE = baseY - d;                                  // centro dell'ellisse
    const arc = t => Math.sqrt(Math.max(0, 1 - t * t));
    const nearY = t => q(yE + d * arc(t));                 // arco vicino (in basso)
    const farY = t => q(yE - d * arc(t));                  // arco lontano (in alto)
    const BASE = '#1a1420', HI = '#332a44', DARK = '#0d0912', RIM = '#a06ae0';

    // un velo viola dietro tutto: il metallo nero su cielo notturno ha bisogno di
    // qualcosa che gli stacchi la sagoma, e l'eclissi gliela dà
    glow(ctx, cx, yE - w * 0.14, w * 1.5, w * 1.05, '140,80,220');

    // punte del lato lontano: si vedono dietro il cerchietto e sono ciò che dice "giro"
    for (const t of [-0.55, 0.55]) {
      const bw = q(w * 0.07), h = q(w * 0.2), x = q(cx + t * half);
      for (let i = 0; i * px < h; i++) {
        const k = 1 - (i * px) / h;
        const hw = Math.max(px, q(bw * Math.pow(k, 0.55)));
        ctx.fillStyle = DARK;
        ctx.fillRect(x - hw, farY(t) - i * px - px, hw * 2, px);
      }
    }
    // l'arco lontano del cerchietto: una fascia scura che si inarca verso l'alto
    for (let x = -half; x < half; x += px) {
      const t = x / half;
      ctx.fillStyle = DARK;
      ctx.fillRect(q(cx + x), farY(t), px, band * 0.5);
    }
    // punte del lato vicino: cinque, la centrale la più alta
    for (const [t, k] of [[-0.86, 0.44], [-0.45, 0.62], [0, 1], [0.45, 0.62], [0.86, 0.44]]) {
      const bw = q(w * (t === 0 ? 0.105 : 0.085)), h = q(w * 0.38 * k);
      const x = q(cx + t * half), top = nearY(t) - band;
      for (let i = 0; i * px < h; i++) {
        const u = (i * px) / h;
        const hw = Math.max(px, q(bw * Math.pow(1 - u, 0.5)));
        const y = top - i * px - px;
        ctx.fillStyle = BASE; ctx.fillRect(x - hw, y, hw * 2, px);
        ctx.fillStyle = HI; ctx.fillRect(x - hw + px, y, px, px);
        // il filo di luce solo sul bordo SINISTRO: la luce viene da una parte sola, e
        // due bordi accesi su una punta larga tre pixel la coloravano tutta di viola
        if (hw >= px * 2) { ctx.fillStyle = RIM; ctx.fillRect(x - hw, y, px, px); }
      }
      // sferetta sulla punta: le corone finiscono con una perla, non con uno spillo
      ctx.fillStyle = HI; ctx.fillRect(x - px * 1.5, top - h - px, px * 3, px * 2);
      ctx.fillStyle = RIM; ctx.fillRect(x - px, top - h - px, px * 2, px);
    }
    // il cerchietto vicino, in tre fasce di tono + filo di luce sul bordo alto
    for (let x = -half; x < half; x += px) {
      const t = x / half, X = q(cx + x), top = nearY(t) - band;
      ctx.fillStyle = HI; ctx.fillRect(X, top, px, q(band * 0.3));
      ctx.fillStyle = BASE; ctx.fillRect(X, top + q(band * 0.3), px, q(band * 0.42));
      ctx.fillStyle = DARK; ctx.fillRect(X, top + q(band * 0.72), px, band - q(band * 0.72));
      ctx.fillStyle = RIM; ctx.fillRect(X, top, px, px);
    }
    // borchie sul cerchietto, fra le punte
    for (const t of [-0.66, -0.24, 0.24, 0.66]) {
      const X = q(cx + t * half), Y = nearY(t) - q(band * 0.55);
      ctx.fillStyle = '#6e3a5a'; ctx.fillRect(X - px, Y, px * 2, px * 2);
      ctx.fillStyle = '#c85a6e'; ctx.fillRect(X - px, Y, px, px);
    }
    // LA GEMMA: il punto più chiaro del quadro, perché è lei che canta
    const gr = q(w * 0.115), gy = nearY(0) - q(band * 0.52);
    glow(ctx, cx, gy, gr * 6, gr * 6, '232,74,90');
    ctx.fillStyle = '#5a0c18'; pixelEllipse(ctx, cx, gy, gr + px, gr * 0.95 + px, px);
    ctx.fillStyle = '#c81c2e'; pixelEllipse(ctx, cx, gy, gr, gr * 0.9, px);
    ctx.fillStyle = '#f04a4a'; pixelEllipse(ctx, cx, gy, gr * 0.62, gr * 0.56, px);
    ctx.fillStyle = '#ffb0a0'; ctx.fillRect(cx - q(gr * 0.3), gy - q(gr * 0.42), q(gr * 0.4), q(gr * 0.3));
    // lampi viola che l'avvolgono (il testo: «avvolta da lampi viola»): salgono verso
    // l'esterno, come scariche. Prima puntavano in giù e sembravano gocciolare.
    // Scariche CORTE, appiccicate al metallo. I lampi lunghi li ho provati due volte —
    // in giù sembravano gocciolare, in su sembravano due ali — e la lezione 60 dice
    // cosa si fa la terza volta: qui restano solo le scintille, che si leggono.
    const k = w / 230;                    // le scintille scalano con la corona
    for (const t of [-0.66, -0.23, 0.23, 0.66]) {   // nei vuoti FRA le punte
      const X = cx + t * half, Y = nearY(t) - band - 4 * k;
      const jx = (rand() - 0.5) * 10 * k;
      for (const [wd, col] of [[6, 'rgba(120,60,190,.5)'], [3, 'rgba(214,170,255,.95)']]) {
        ctx.strokeStyle = col; ctx.lineWidth = Math.max(1, wd * k);
        ctx.beginPath();
        ctx.moveTo(X - 7 * k, Y); ctx.lineTo(X + 2 * k + jx, Y - 9 * k);
        ctx.lineTo(X - 3 * k + jx, Y - 11 * k); ctx.lineTo(X + 8 * k, Y - 20 * k);
        ctx.stroke();
      }
    }
  }

  function heroesRow(ctx, W, groundY, partySpriteKeys, scale = 4) {
    const n = partySpriteKeys.length;
    const totalW = n * 20 * scale;
    let x = Math.floor(W / 2 - totalW / 2);
    for (const key of partySpriteKeys) {
      const def = Sprites.registry[key];
      if (def) Sprites.drawSprite(ctx, def.map, def.palette, x, groundY - 16 * scale, scale);
      x += 20 * scale;
    }
  }

  /* ------------- PITTORI DI LOCATION ------------- */

  const painters = {

    titolo(ctx, W, H) {
      const r = rng(42);
      // ATTENZIONE: questo painter gira su un canvas 480x270 (index.html), non sui
      // 960x360 degli altri. Tutte le misure passano da S, altrimenti la corona che
      // sta bene nel provino diventa un cartellone sulla schermata vera.
      const S = W / 960;
      skyGradient(ctx, W, H, '#0d0a1a', '#3a1545', 10);
      stars(ctx, W, H, r, 50);
      // l'eclissi si sposta di lato: al centro, come soggetto, ci va la Corona
      moon(ctx, W * 0.19, H * 0.20, 32 * S, '#c8b8e8', true);
      const g = H * 0.88;
      hills(ctx, W, g, 40 * S, '#150d20', r, 40 * S);
      /* IL CASTELLO — prima erano cinque rettangoli piatti con varianza 0,1: leggeva
         come cartone ritagliato. Adesso ogni corpo ha le tre fasce della muratura
         (cresta più chiara, dove batte la luna; base più scura, in ombra), i MERLI in
         cima e un filo di luce sul filo verticale che guarda la luna, a sinistra. */
      const bs = Math.max(4, Math.round(8 * S));
      const torre = (x, w, h, col) => {
        const y = g - h;
        blocks(ctx, x, y, w, h, col, bs, r, 0.14);
        blocks(ctx, x, y, w, Math.round(h * 0.22), shade(col, 1.35), bs, r, 0.1);
        blocks(ctx, x, g - Math.round(h * 0.3), w, Math.round(h * 0.3), shade(col, 0.72), bs, r, 0.12);
        for (let mx = x; mx < x + w - 8 * S; mx += 22 * S) {                // merli
          blocks(ctx, mx, y - 16 * S, 13 * S, 17 * S, shade(col, 1.2), bs, r, 0.1);
        }
        ctx.fillStyle = 'rgba(200,184,232,.16)'; ctx.fillRect(x, y, Math.max(2, 3 * S), h);
      };
      torre(W * 0.30, W * 0.40, 84 * S, '#1a1028');   // corpo centrale con le mura
      torre(W * 0.24, 44 * S, 132 * S, '#150d20');    // torri laterali
      torre(W * 0.68, 44 * S, 132 * S, '#150d20');
      torre(W * 0.455, 60 * S, 140 * S, '#231637');   // il mastio
      // finestre accese: poche e grandi, così si vedono
      for (const [fx, fy] of [[0.472, 106], [0.472, 68], [0.253, 96], [0.695, 96]]) {
        glow(ctx, W * fx + 8 * S, g - fy * S + 9 * S, 44 * S, 44 * S, '232,74,90');
        ctx.fillStyle = '#e84a5a'; ctx.fillRect(W * fx, g - fy * S, 16 * S, 19 * S);
        ctx.fillStyle = '#2a0d18'; ctx.fillRect(W * fx + 7 * S, g - fy * S, Math.max(2, 3 * S), 19 * S);
      }
      blocks(ctx, 0, g, W, H - g, '#1d1830', Math.max(5, 10 * S), r, 0.2);
      // LA CORONA sopra il castello: è il titolo del gioco, quindi è il soggetto
      crown(ctx, W * 0.5, g - 170 * S, 230 * S, r);
    },

    taverna(ctx, W, H) {
      const r = rng(7);
      const floorY = H - 62;
      blocks(ctx, 0, 0, W, H, '#3a2a1a', 14, r, 0.15);
      blocks(ctx, 0, floorY, W, H - floorY, '#4a3524', 16, r, 0.2);
      // travi
      blocks(ctx, 0, 30, W, 16, '#2a1d10', 20, r, 0.1);
      for (const fx of [0.24, 0.74]) blocks(ctx, W * fx, 30, 16, floorY - 30, '#2a1d10', 20, r, 0.1);
      // camino
      blocks(ctx, W * 0.80, floorY - 150, 130, 150, '#5a5a66', 10, r, 0.2);
      blocks(ctx, W * 0.78, floorY - 162, 154, 14, '#6e6e7a', 10, r, 0.15); // mensola
      /* IL FOCOLARE. Era un rettangolo arancione con dentro un rettangolo giallo e una
         barra scura sopra per i ceppi: leggeva come un pannello luminoso acceso, non
         come un fuoco. Il fuoco si riconosce dal profilo — lingue larghe in basso e
         strozzate in punta, la brace fra i ceppi — e quella sagoma ce l'ha già fire(),
         che è lo stesso helper del focolare delle cucine: un fuoco solo, due scene. */
      ctx.fillStyle = '#1a1a22'; ctx.fillRect(W * 0.80 + 26, floorY - 92, 78, 92);
      fire(ctx, W * 0.80 + 65, floorY - 4, 58, 56, r);
      // scaffale con bottiglie dietro il bancone
      blocks(ctx, W * 0.05, floorY - 168, 230, 10, '#5d4530', 10, r, 0.12);
      const bottleCols = ['#5a8a4a', '#8a5a2a', '#4a6a9a', '#8a4a6a', '#6a6a3a'];
      for (let i = 0; i < 9; i++) {
        ctx.fillStyle = bottleCols[i % bottleCols.length];
        ctx.fillRect(W * 0.05 + 10 + i * 24, floorY - 192, 10, 24);
        ctx.fillStyle = '#2e2118'; ctx.fillRect(W * 0.05 + 13 + i * 24, floorY - 198, 4, 8);
      }
      // bancone
      blocks(ctx, W * 0.05, floorY - 92, 240, 92, '#5d4530', 12, r, 0.15);
      blocks(ctx, W * 0.05 - 8, floorY - 104, 256, 14, '#7a5c3d', 12, r, 0.1);
      // boccali sul bancone
      for (const bx of [0.09, 0.15, 0.20]) {
        ctx.fillStyle = '#c8a032'; ctx.fillRect(W * bx, floorY - 128, 18, 24);
        ctx.fillStyle = '#f0e8d8'; ctx.fillRect(W * bx, floorY - 134, 18, 7);
        ctx.fillStyle = '#c8a032'; ctx.fillRect(W * bx + 18, floorY - 122, 5, 12);
      }
      // sgabelli
      for (const sx of [0.30, 0.35]) {
        blocks(ctx, W * sx, floorY - 34, 26, 8, '#6e5238', 8, r, 0.1);
        ctx.fillStyle = '#4a3524'; ctx.fillRect(W * sx + 4, floorY - 26, 6, 26); ctx.fillRect(W * sx + 16, floorY - 26, 6, 26);
      }
      // tavolo con candela e piatti
      blocks(ctx, W * 0.44, floorY - 58, 170, 14, '#5d4530', 12, r, 0.12);
      ctx.fillStyle = '#4a3524'; ctx.fillRect(W * 0.46, floorY - 44, 14, 44); ctx.fillRect(W * 0.58, floorY - 44, 14, 44);
      // la candela sul tavolo: alone tondo (era un quadrato di 34×34 attorno alla fiamma,
      // e attorno a una candela un quadrato più chiaro sembra un quadretto appeso)
      glow(ctx, W * 0.47 + 5, floorY - 82, 46, 50, '245,224,66');
      ctx.fillStyle = '#f0e8d8'; ctx.fillRect(W * 0.47, floorY - 76, 9, 18);
      flame(ctx, W * 0.47 + 4, floorY - 76, 8, 12, r, 3);
      ctx.fillStyle = '#c8ccd8'; ctx.fillRect(W * 0.52, floorY - 64, 22, 6);
      // botti
      for (const bx of [0.66, 0.72]) {
        blocks(ctx, W * bx, floorY - 52, 44, 52, '#5a4530', 8, r, 0.14);
        ctx.fillStyle = '#3a2a18'; ctx.fillRect(W * bx, floorY - 40, 44, 5); ctx.fillRect(W * bx, floorY - 20, 44, 5);
      }
      // finestra notturna
      ctx.fillStyle = '#0d0a1f'; ctx.fillRect(W * 0.34, 62, 78, 66);
      ctx.fillStyle = '#9a90c0'; ctx.fillRect(W * 0.36, 74, 3, 3); ctx.fillRect(W * 0.40, 96, 3, 3);
      ctx.strokeStyle = '#2a1d10'; ctx.lineWidth = 6;
      ctx.strokeRect(W * 0.34, 62, 78, 66);
      ctx.beginPath(); ctx.moveTo(W * 0.34 + 39, 62); ctx.lineTo(W * 0.34 + 39, 128); ctx.stroke();
      torch(ctx, W * 0.29, 96); torch(ctx, W * 0.66, 96);
    },

    villaggio(ctx, W, H) {
      const r = rng(11);
      skyGradient(ctx, W, H, '#0d0a1f', '#2a1a3d', 10);
      stars(ctx, W, H, r, 55);
      moon(ctx, W * 0.84, 58, 30, '#c8b8e8', true);
      const g = H - 76;
      hills(ctx, W, g + 6, 46, '#1d1830', r, 34);   // colline morbide, non una banda
      // case
      house(ctx, W * 0.04, g, 112, 84, '#8a6a45', '#7a3025', r);
      house(ctx, W * 0.28, g, 92, 68, '#96755a', '#6e5238', r);
      house(ctx, W * 0.56, g, 132, 96, '#8a6a45', '#7a3025', r);
      house(ctx, W * 0.82, g, 96, 74, '#96755a', '#5a4a35', r);
      // pozzo
      blocks(ctx, W * 0.455, g - 34, 52, 34, '#6e6e7a', 8, r, 0.2);
      blocks(ctx, W * 0.45, g - 40, 62, 8, '#8a8a96', 8, r, 0.12);
      ctx.fillStyle = '#3a2a18'; ctx.fillRect(W * 0.46, g - 78, 7, 40); ctx.fillRect(W * 0.505, g - 78, 7, 40);
      ctx.fillStyle = '#7a3025'; ctx.fillRect(W * 0.448, g - 88, 66, 12);
      ctx.fillStyle = '#4a3524'; ctx.fillRect(W * 0.482, g - 76, 4, 22);
      ctx.fillStyle = '#5a5a66'; ctx.fillRect(W * 0.474, g - 56, 20, 12); // secchio
      // terreno + sentiero
      ground(ctx, W, H, g, '#26402a', r, 12, 10);
      for (let i = 0; i < 16; i++) {
        blocks(ctx, i * (W / 16) + (r() - 0.5) * 10, g + 14 + Math.sin(i) * 5, W / 16, 9, '#6e5a42', 9, r, 0.2);
      }
      // lanterne su palo
      for (const fx of [0.24, 0.76]) {
        ctx.fillStyle = '#3a2a18'; ctx.fillRect(W * fx, g - 54, 7, 54);
        torch(ctx, W * fx - 1, g - 62, false);
      }
      // cespugli e staccionata
      bush(ctx, W * 0.20, g + 6, 26, '#2a4a2e', r);
      bush(ctx, W * 0.70, g + 8, 22, '#2a4a2e', r);
      ctx.fillStyle = '#5a4530';
      for (let x = W * 0.36; x < W * 0.44; x += 14) ctx.fillRect(x, g - 22, 5, 24);
      ctx.fillRect(W * 0.36, g - 16, W * 0.08, 4);
    },

    ponte(ctx, W, H) {
      const r = rng(19);
      skyGradient(ctx, W, H, '#0d0a1f', '#33204a', 10);
      stars(ctx, W, H, r, 45);
      moon(ctx, W * 0.14, 58, 26, '#c8b8e8', true);
      const g = H - 118;                    // terreno alto: il ponte resta sopra la didascalia
      hills(ctx, W, g + 4, 40, '#152515', r, 30);
      for (let i = 0; i < 5; i++) tree(ctx, 40 + i * (W / 4.5) + (r() * 30 - 15), g + 8, 56 + r() * 24, '#1d3a22', '#3a2a18', r);
      ground(ctx, W, H, g, '#26402a', r, 12, 10);
      /* LA GOLA — prima il ruscello era un rettangolo blu incassato nel prato trentasei
         pixel SOTTO l'impalcato, con i bordi tagliati a squadra: il ponte non scavalcava
         niente e il giardino aveva una piscina. E la scena è tutta un pedaggio per
         passare, quindi il passaggio deve esserci. Adesso il terreno è APERTO fra le due
         sponde: si vede la parete di terra in ombra con gli strati, le due sponde che
         scendono di sbieco verso l'acqua, e due pile di legno che dall'impalcato
         arrivano nell'acqua col loro riflesso. */
      const xL = Math.round(W * 0.24), xR = Math.round(W * 0.76), wl = H - 46;
      const lip = [];
      for (let x = xL; x < xR; x += 8) lip.push(g + 2 + Math.round(r() * 3) * 5);
      // la parete di fondo della gola, dal ciglio irregolare fino in basso
      lip.forEach((ly, i) => {
        const x = xL + i * 8;
        blocks(ctx, x, ly, 8, H - ly, '#241a12', 8, r, 0.26);
        ctx.fillStyle = '#12100c'; ctx.fillRect(x, ly, 8, 5);   // il ciglio sporge e fa ombra
      });
      // strati di terra e sassi: una parete tutta di un tono è un fondale, non una parete
      for (const [dy, col, hh] of [[24, '#33261a', 7], [44, '#1c1510', 9], [62, '#2e2418', 6]]) {
        for (let x = xL; x < xR; x += 12) {
          ctx.fillStyle = col;
          ctx.fillRect(x, g + dy + Math.round(r() * 2) * 4, 12, hh);
        }
      }
      for (let i = 0; i < 7; i++) {                                // sassi incastrati
        const sx = xL + 20 + r() * (xR - xL - 60), sy = g + 20 + r() * 60;
        blocks(ctx, sx, sy, 14 + r() * 16, 10 + r() * 8, '#3d3226', 6, r, 0.22);
      }
      // l'acqua, che ora passa DAVVERO sotto l'impalcato
      blocks(ctx, xL, wl, xR - xL, H - wl, '#12304a', 10, r, 0.24);
      ctx.fillStyle = 'rgba(150,190,230,.18)';
      for (let i = 0; i < 12; i++) ctx.fillRect(xL + 10 + r() * (xR - xL - 40), wl + 4 + r() * 46, 16 + r() * 22, 3);
      // le due sponde che scendono di sbieco: sono loro a dire «gola» e non «buca»
      /* LE SPONDE VICINE: due cunei d'erba che dal ciglio scendono nell'acqua e finiscono
         a punta in basso. Sono loro a dire «gola» invece di «buca»: l'erba scavalca il
         bordo e continua in pendenza, e la punta in basso evita il taglio verticale. */
      for (const side of [-1, 1]) {
        const x0 = side < 0 ? xL : xR, wd = 138;
        for (let k = 0; k < wd; k += 5) {
          const x = side < 0 ? x0 + k : x0 - k - 5;
          const top = g + 2 + (k / wd) * (H - g) + Math.round(r() * 2) * 4;
          if (top >= H - 4) continue;
          blocks(ctx, x, top, 5, H - top, '#332617', 5, r, 0.2);
          blocks(ctx, x, top, 5, Math.min(9, H - top), '#2c4a30', 5, r, 0.18);
          ctx.fillStyle = '#3d6a3a'; ctx.fillRect(x, top, 5, 3);
        }
        // qualche sasso sulla battigia, dove la sponda entra in acqua
        for (let i = 0; i < 3; i++) {
          const t = 0.55 + r() * 0.3, x = side < 0 ? x0 + t * wd : x0 - t * wd;
          blocks(ctx, x, g + 2 + t * (H - g) - 6, 12 + r() * 10, 8, '#4a4438', 6, r, 0.2);
        }
      }
      // il ponticello: gli estremi poggiano sulle sponde, non sul prato
      bridge(ctx, W * 0.21, g - 4, W * 0.58, r);
      // le pile: dall'impalcato giù nell'acqua, col riflesso sotto
      for (const px of [W * 0.36, W * 0.62]) {
        ctx.fillStyle = 'rgba(10,26,42,.55)'; ctx.fillRect(px + 1, wl, 16, H - wl);
        blocks(ctx, px, g + 8, 18, wl - g + 4, '#4a3524', 9, r, 0.16);
        ctx.fillStyle = '#6e5238'; ctx.fillRect(px, g + 8, 3, wl - g + 4);
        ctx.strokeStyle = '#3a2a18'; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(px + 9, g + 26); ctx.lineTo(px + 9 + (px < W / 2 ? -34 : 34), g + 6); ctx.stroke();
      }
      // cartello dello sciopero, piantato accanto al ponte
      sign(ctx, W * 0.17, g + 14, 92, 34, 3);
      // fagotti e cassetta del "sindacato"
      blocks(ctx, W * 0.80, g + 2, 34, 22, '#5a4530', 8, r, 0.15);
      ctx.fillStyle = '#3a2a18'; ctx.fillRect(W * 0.80, g + 8, 34, 4);
      bush(ctx, W * 0.89, g + 8, 26, '#2a4a2e', r);
    },

    tempietto(ctx, W, H) {
      const r = rng(23);
      skyGradient(ctx, W, H, '#0d0a1f', '#2a1a3d', 10);
      stars(ctx, W, H, r, 50);
      moon(ctx, W * 0.16, 56, 28, '#c8b8e8', true);
      const g = H - 70;
      hills(ctx, W, g + 4, 40, '#1d1830', r, 34);
      // il tempietto: basamento, colonne, frontone, tetto
      const tx = W * 0.34, tw = W * 0.32, th = 120;
      blocks(ctx, tx - 14, g - 14, tw + 28, 16, '#8a8a96', 10, r, 0.12);           // gradini
      blocks(ctx, tx - 6, g - 26, tw + 12, 14, '#9a9aa6', 10, r, 0.12);
      for (let i = 0; i < 5; i++) {                                                 // colonne
        const cx = tx + 10 + i * ((tw - 32) / 4);
        blocks(ctx, cx, g - 26 - th * 0.62, 18, th * 0.62, '#b0b0bc', 10, r, 0.1);
        blocks(ctx, cx - 3, g - 26 - th * 0.62 - 8, 24, 9, '#c8c8d4', 8, r, 0.08);
      }
      blocks(ctx, tx - 10, g - 26 - th * 0.62 - 18, tw + 20, 14, '#c0c0cc', 10, r, 0.1); // architrave
      // frontone triangolare a gradini
      const roofBase = g - 26 - th * 0.62 - 18;
      for (let i = 0; i < 6; i++) {
        const rw = (tw + 20) * (1 - i / 6);
        blocks(ctx, tx - 10 + ((tw + 20) - rw) / 2, roofBase - 10 - i * 10, rw, 11, '#c8a032', 9, r, 0.14);
      }
      // sole d'oro sul frontone (spento: grigio con anello dorato)
      const sx = tx + tw / 2, sy = roofBase - 30;
      ctx.fillStyle = '#8a7a45';
      for (let dy = -9; dy <= 9; dy += 3) { const hw = Math.floor(Math.sqrt(81 - dy * dy) / 3) * 3; ctx.fillRect(sx - hw, sy + dy, hw * 2, 3); }
      ctx.fillStyle = '#f5c542';
      for (let a = 0; a < 8; a++) {
        const ang = a * Math.PI / 4;
        ctx.fillRect(sx + Math.cos(ang) * 15 - 2, sy + Math.sin(ang) * 15 - 2, 5, 5);
      }
      ground(ctx, W, H, g, '#26402a', r, 12, 10);
      for (const fx of [0.16, 0.86]) {
        ctx.fillStyle = '#3a2a18'; ctx.fillRect(W * fx, g - 50, 7, 50);
        torch(ctx, W * fx - 1, g - 58, false);
      }
      bush(ctx, W * 0.24, g + 6, 24, '#2a4a2e', r);
      bush(ctx, W * 0.78, g + 6, 22, '#2a4a2e', r);
    },

    strada(ctx, W, H) {
      /* IL BIVIO DELLA CIVETTA, quattordici scene, e il nome dice le due cose
         che il quadro non aveva: «LA STRADA SI DIVIDE sotto una vecchia QUERCIA
         dove una CIVETTA vi osserva con l'aria di chi ne ha viste tante. Il
         cartello di legno indica TRE DIREZIONI (la terza è stata aggiunta a
         mano, con una grafia tremolante)». Più «il muretto è di pietra a secco,
         alto quanto un ginocchio» dove si accucciano i due banditi.
         Prima: sette alberi quasi identici in fila a distanza quasi uguale, un
         sentiero SOLO che scendeva al centro, e un cartello da 84x30 con due
         righe illeggibili. Cioè: nessun bivio nel Bivio, nessuna quercia,
         nessuna civetta, e un cartello che non indicava niente. */
      const r = rng(31);
      const g = H - 96;
      skyGradient(ctx, W, g + 20, '#0d0a1f', '#33204a', 10);
      stars(ctx, W, g, r, 45);
      moon(ctx, W * 0.82, 56, 26, '#c8b8e8', true);
      hills(ctx, W, g + 4, 46, '#111c11', r, 30);
      /* GLI ALBERI DI FONDO: sagome CONTROLUCE (più scure del cielo — l'unica
         luce è un'eclissi), di altezza e distanza irregolari. Sette cloni a
         passo quasi uguale leggono come una staccionata di broccoli. */
      for (const [fx, alt] of [[0.05, 74], [0.13, 52], [0.235, 96], [0.35, 60],
                               [0.60, 88], [0.70, 54], [0.79, 70], [0.93, 100]]) {
        tree(ctx, W * fx, g + 8, alt, '#0f1c12', '#1c150c', r);
      }
            /* L'ERBA stava a #1c2e1f, luminanza 38: quattro punti SOTTO la soglia a
         cui un pixel conta come nero. Tutto il prato — un terzo del quadro —
         risultava buio, e il fondale segnava l'85% di nero pur avendo il
         soggetto in piena vista. Un prato sotto un'eclissi non e' nero: e'
         verde spento. */
      ground(ctx, W, H, g, '#28402a', r, 12, 10);
      ctx.fillStyle = 'rgba(120,160,120,.05)'; ctx.fillRect(0, g, W, 3);

      /* LE DUE STRADE, che si dividono. Sono due piani orizzontali: partono
         larghe dal bordo basso, si stringono andando in là e convergono verso
         due punti diversi sull'orizzonte — è la divergenza che fa il bivio. */
      const strada2 = (x0, x1, largo0, largo1) => {
        for (let k = 0; k <= 44; k++) {
          const t = k / 44;
          const xx = x0 + (x1 - x0) * t;
          const yy = H - t * (H - g - 6);
          const larg = largo0 + (largo1 - largo0) * t;
          blocks(ctx, xx - larg / 2, yy, larg, Math.ceil((H - g) / 44) + 2, mix('#6e5a42', '#3e3426', t), 9, r, 0.16);
          ctx.fillStyle = `rgba(24,18,12,${(0.24 * (1 - t)).toFixed(3)})`;
          ctx.fillRect(xx - larg / 2, yy, 3, 3); ctx.fillRect(xx + larg / 2 - 3, yy, 3, 3);
        }
      };
      strada2(W * 0.47, W * 0.16, 130, 16);
      strada2(W * 0.53, W * 0.86, 130, 16);
      blocks(ctx, W * 0.40, H - 34, W * 0.20, 34, '#6e5a42', 9, r, 0.16);   // il tratto comune, davanti

      /* IL MURETTO DI PIETRA A SECCO, alto quanto un ginocchio (45 cm): pietre
         di taglia diversa incastrate senza malta, e la fila di copertina in
         cima. È dietro di lui che i due banditi si accucciano. */
      {
        const my = g + 26;
        /* Pietre da 13 px e non da 7: a sette, su un prato scuro, leggevano
           come PIETRISCO. E i tre corsi devono vedersi — una pietra a secco si
           riconosce dai giunti aperti fra pietre di taglia diversa, non dalla
           grana. */
        for (let x = W * 0.055; x < W * 0.40; x += 13) {
          const alt = 30 + Math.round(Math.sin(x * 0.07) * 3);
          for (let q = 0; q < 3; q++) {
            const hh = 9 + ((x + q * 17) % 3);
            const larg = 13 - ((x + q * 5) % 3);
            ctx.fillStyle = ['#4e4e46', '#3a3a34', '#59594f'][(x / 13 + q) % 3 | 0];
            ctx.fillRect(x, my + alt - (q + 1) * hh, larg, hh - 2);
            ctx.fillStyle = 'rgba(196,204,192,.07)'; ctx.fillRect(x, my + alt - (q + 1) * hh, larg, 2);
            ctx.fillStyle = 'rgba(8,10,8,.44)'; ctx.fillRect(x, my + alt - (q + 1) * hh + hh - 2, larg, 2);
          }
          ctx.fillStyle = '#62625a'; ctx.fillRect(x, my + alt - 36, 13, 5);       // la copertina
          ctx.fillStyle = 'rgba(200,210,200,.10)'; ctx.fillRect(x, my + alt - 36, 13, 1);
          ctx.fillStyle = 'rgba(8,10,8,.42)'; ctx.fillRect(x, my + alt - 1, 13, 5);
        }
      }

      /* LA VECCHIA QUERCIA DEL BIVIO: il tronco grosso e nodoso, i rami che si
         aprono a candelabro, la chioma larga — ed è l'albero sotto cui la
         strada si divide, quindi sta nel mezzo, non in fila con gli altri. */
      {
        const qx = W * 0.335, qb = g + 16;
        for (let y = qb; y > 96; y -= 1) {                                        // il tronco
          const t = (qb - y) / (qb - 96);
          const sp = Math.round(46 - t * 16);
          const cx2 = qx + Math.sin(t * 1.8) * 9;
          ctx.fillStyle = mix('#2a2016', '#1e1710', t * 0.6);
          ctx.fillRect(cx2 - sp / 2, y, sp, 1);
          for (let q = 0; q < 5; q++) {                                           // corteccia, solchi verticali
            const ox = (q - 2) * 9 + ((q * 7) % 4) - 1;
            if (Math.abs(ox) > sp / 2 - 2) continue;
            ctx.fillStyle = q % 2 ? 'rgba(10,8,5,.42)' : 'rgba(112,96,68,.11)';
            ctx.fillRect(cx2 + ox, y, 3, 1);
          }
        }
        ctx.fillStyle = '#241b12';                                                // le radici
        for (const dx of [-40, -22, 20, 38]) for (let k = 0; k < 22; k++) ctx.fillRect(qx + dx * (1 + k / 22 * 0.6), qb + k * 0.4, 8, 5);
        // i rami a candelabro
        for (const [ang, lun] of [[-1.15, 120], [-0.55, 96], [0.45, 108], [1.05, 88], [-0.05, 70]]) {
          for (let k = 0; k < lun; k++) {
            const xx = qx + Math.sin(ang) * k, yy = 100 - Math.cos(ang) * k * 0.62;
            ctx.fillStyle = '#241b12'; ctx.fillRect(xx, yy, Math.max(3, 11 - k / 12 | 0), 4);
          }
        }
        // la chioma: sagoma scura, col filo di luna in alto a destra
        for (let q = 0; q < 200; q++) {
          const ax = qx - 168 + (r() * 336 | 0), ay = -10 + (r() * 118 | 0);
          const w2 = 15 + (r() * 13 | 0), h2 = 10 + (r() * 8 | 0);
          ctx.fillStyle = ['#0d1a11', '#09150d', '#111f15'][q % 3];
          ctx.fillRect(ax, ay, w2, h2);
          const vl = (ax - (qx - 168)) / 336 * 0.6 + (1 - (ay + 10) / 118) * 0.4;
          if (vl > 0.66) {
            ctx.fillStyle = `rgba(176,164,208,${(0.09 + (vl - 0.66) * 0.24).toFixed(3)})`;
            ctx.fillRect(ax, ay, w2, 2); ctx.fillRect(ax + w2 - 2, ay, 2, h2);
          }
        }
        /* LA CIVETTA, su un ramo basso: pancia chiara, due occhi grandi e
           tondi con la pupilla, il becco fra i due, e i ciuffetti. Sono gli
           occhi che fanno la civetta: grandi, gialli e frontali. */
        const ox2 = qx + 78, oy2 = 138;
        ctx.fillStyle = '#241b12'; ctx.fillRect(ox2 - 26, oy2 + 22, 56, 5);       // il ramo su cui sta
        ctx.fillStyle = '#5a4a36'; pixelEllipse(ctx, ox2, oy2, 17, 21, 3);        // il corpo
        ctx.fillStyle = '#8a7a5e'; pixelEllipse(ctx, ox2, oy2 + 4, 12, 15, 3);    // la pancia chiara
        ctx.fillStyle = '#3e3222';                                                // le ali richiuse
        ctx.fillRect(ox2 - 17, oy2 - 6, 6, 22); ctx.fillRect(ox2 + 11, oy2 - 6, 6, 22);
        ctx.fillStyle = '#f0d878'; pixelDisc(ctx, ox2 - 7, oy2 - 8, 6, 2);        // gli occhi
        pixelDisc(ctx, ox2 + 7, oy2 - 8, 6, 2);
        ctx.fillStyle = '#100c06'; pixelDisc(ctx, ox2 - 7, oy2 - 8, 3, 2); pixelDisc(ctx, ox2 + 7, oy2 - 8, 3, 2);
        ctx.fillStyle = '#c8a038'; ctx.fillRect(ox2 - 2, oy2 - 5, 4, 6);          // il becco
        ctx.fillStyle = '#3e3222';                                                // i ciuffetti
        ctx.fillRect(ox2 - 14, oy2 - 20, 5, 7); ctx.fillRect(ox2 + 9, oy2 - 20, 5, 7);
        ctx.fillStyle = '#5a4a36'; ctx.fillRect(ox2 - 6, oy2 + 20, 4, 5); ctx.fillRect(ox2 + 2, oy2 + 20, 4, 5);
        glow(ctx, ox2, oy2 - 8, 15, 6, '240,216,120');
      }

      /* IL CARTELLO A TRE BRACCI. Il terzo è aggiunto a mano: legno più chiaro,
         inchiodato di sbieco, con la scritta tremolante — e si vede che è
         l'ultimo perché è l'unico storto. */
      {
        const cx2 = W * 0.505, cb = H - 30;
        ctx.fillStyle = '#3e3022'; ctx.fillRect(cx2 - 6, cb - 132, 13, 132);
        ctx.fillStyle = '#54432e'; ctx.fillRect(cx2 - 6, cb - 132, 4, 132);
        ctx.fillStyle = 'rgba(10,8,5,.44)'; ctx.fillRect(cx2 - 14, cb - 4, 30, 6);
        const braccio = (yy, verso, larg, alto, col, storto) => {
          ctx.save();
          ctx.translate(cx2 + (verso > 0 ? 5 : -5), yy);
          if (storto) ctx.rotate(verso > 0 ? 0.10 : -0.13);
          const x0 = verso > 0 ? 0 : -larg;
          ctx.fillStyle = col; ctx.fillRect(x0, 0, larg, alto);
          ctx.fillStyle = shade(col, 1.22); ctx.fillRect(x0, 0, larg, 3);
          ctx.fillStyle = shade(col, 0.66); ctx.fillRect(x0, alto - 3, larg, 3);
          // la punta a freccia
          for (let k = 0; k < alto / 2; k++) {
            ctx.fillStyle = col;
            ctx.fillRect(verso > 0 ? larg + k : -larg - k - 1, k, 1, alto - k * 2);
          }
          // le lettere: due righe di trattini, tremolanti se il braccio è storto
          ctx.fillStyle = storto ? 'rgba(28,20,12,.72)' : 'rgba(26,20,12,.60)';
          for (let q = 0; q < 9; q++) {
            const lx = x0 + 7 + q * ((larg - 16) / 9);
            ctx.fillRect(lx, 6 + (storto ? ((q * 5) % 3) - 1 : 0), 5 + (q % 3), 3);
            if (q < 6) ctx.fillRect(lx, 13 + (storto ? ((q * 7) % 3) - 1 : 0), 4 + (q % 2), 2);
          }
          ctx.restore();
        };
        braccio(cb - 126, -1, 112, 24, '#6a5438', false);   // BOSCO DEI SUSSURRI
        braccio(cb - 92, 1, 118, 24, '#6a5438', false);     // MINIERE DI FERROVECCHIO
        braccio(cb - 58, 1, 96, 22, '#8a7250', true);       // e la terza, aggiunta a mano
      }
      bush(ctx, W * 0.10, g + 14, 26, '#182c1c', r);
      bush(ctx, W * 0.72, g + 18, 22, '#182c1c', r);
    },

    bosco(ctx, W, H) {
      /* IL BOSCO DEI SUSSURRI, nove scene. Il testo chiede tre cose che non
         c'erano:
           «Il SENTIERO per la capanna di Nonna Ortica esiste, ma il bosco —
            dicono — lo SPOSTA»; e più tardi «i rami si spostano da soli,
            aprendo un CORRIDOIO DI FUNGHI LUMINOSI diritto verso la capanna».
            Nel quadro non c'era nessun sentiero: solo alberi in fila.
           «Vi rivolgete alla QUERCIA PIÙ ANZIANA con un inchino perfetto» —
            e non c'era una quercia più anziana: sedici alberi quasi identici a
            passo quasi uguale, cioè una siepe di broccoli.
           «Le fronde BISBIGLIANO al vostro passaggio»: c'erano due paia di
            occhi gialli da cinque pixel, in tutto.
         Adesso: il sentiero che si stringe verso il fondo con il corridoio di
         funghi che lo fiancheggia (e sono i funghi a illuminare il sentiero, non
         una luce che viene da nessuna parte), la QUERCIA ANZIANA come soggetto —
         col nodo che è un occhio e la fenditura che è una bocca, perché in
         questo bosco gli alberi parlano — e sette paia d'occhi di taglia diversa
         a profondità diverse fra le fronde. */
      const r = rng(37);
      const g = H - 64;
      skyGradient(ctx, W, g, '#0a0d14', '#14261d', 10);
      hills(ctx, W, H * 0.42, 70, '#08150c', r, 28);
      /* Gli alberi: sagome CONTROLUCE, a distanza e altezza irregolari, e più
         scure andando in fondo — è la profondità che fa un bosco, non il numero. */
      for (const [fx, alt] of [[0.03, 126], [0.115, 92], [0.20, 148], [0.30, 104],
                               [0.42, 132], [0.545, 88], [0.635, 140], [0.755, 100],
                               [0.845, 152], [0.955, 112]]) {
        tree(ctx, W * fx, g + 12, alt, '#0a1a10', '#150f08', r);
      }
      for (const [fx, alt] of [[0.075, 62], [0.255, 74], [0.375, 56], [0.60, 68],
                               [0.70, 52], [0.80, 72], [0.915, 58]]) {
        tree(ctx, W * fx, g + 16, alt, '#112a19', '#221809', r);
      }
      /* Il sottobosco stava a luminanza 33, cioè sotto la soglia del nero: un
         terzo del quadro contava come buio. Un bosco illuminato da funghi
         luminosi non ha il suolo nero — è il suolo la superficie che quella luce
         prende per prima. */
      ground(ctx, W, H, g, '#1e3c24', r, 12, 12);

      /* IL SENTIERO, che si stringe verso il fondo: un piano orizzontale, quindi
         i suoi bordi convergono e la terra battuta si schiarisce venendo avanti. */
      {
        const x0 = W * 0.52, x1 = W * 0.60;
        for (let k = 0; k <= 46; k++) {
          const t = k / 46;
          const xx = x0 + (x1 - x0) * t, yy = H - t * (H - g - 4);
          const larg = 210 - t * 194;
          blocks(ctx, xx - larg / 2, yy, larg, Math.ceil((H - g) / 46) + 2, mix('#6a5b42', '#2e281c', t), 9, r, 0.14);
          ctx.fillStyle = `rgba(14,10,6,${(0.30 * (1 - t)).toFixed(3)})`;
          ctx.fillRect(xx - larg / 2, yy, 3, 3); ctx.fillRect(xx + larg / 2 - 3, yy, 3, 3);
        }
      }

      /* IL CORRIDOIO DI FUNGHI che fiancheggia il sentiero: sette per parte, che
         rimpiccioliscono andando in fondo — è il rimpicciolire che fa il
         corridoio. E la loro luce viola cade sul sentiero. */
      /* Sette per parte a passo regolare si SOVRAPPONEVANO: le calotte vicine
         si toccavano e la fila leggeva come un BRUCO VIOLA. Quattro per parte,
         a profondità sfalsate fra destra e sinistra, e staccati dal bordo del
         sentiero di una calotta intera. */
      const scia = [];
      for (let k = 0; k < 4; k++) {
        const t = k / 3.4;
        const xx = W * 0.52 + (W * 0.60 - W * 0.52) * t, yy = H - t * (H - g - 4);
        const larg = 150 - t * 138;
        const cap = Math.round(78 - t * 56);
        scia.push([xx - larg / 2 - cap * 0.86, yy - t * 8, cap]);
      }
      for (let k = 0; k < 4; k++) {
        const t = (k + 0.5) / 3.4;
        const xx = W * 0.52 + (W * 0.60 - W * 0.52) * t, yy = H - t * (H - g - 4);
        const larg = 150 - t * 138;
        const cap = Math.round(70 - t * 50);
        scia.push([xx + larg / 2 + cap * 0.86, yy - 6 - t * 8, cap]);
      }
      // la luce viola sul sentiero, prima dei funghi
      for (const [mx, my, cap] of scia) {
        const rx2 = cap * 1.5, ry2 = cap * 0.5;
        for (let y = Math.max(0, my - ry2); y < Math.min(H, my + ry2); y++) {
          for (let x = Math.max(0, mx - rx2); x < Math.min(W, mx + rx2); x += 3) {
            const d = Math.hypot((x - mx) / rx2, (y - my) / ry2);
            if (d >= 1) continue;
            const a = 0.16 * Math.pow(1 - d, 1.8);
            if (a <= 0.005) continue;
            ctx.fillStyle = `rgba(178,96,214,${a.toFixed(3)})`;
            ctx.fillRect(x, y, 3, 1);
          }
        }
      }
      for (const [mx, my, cap] of scia) if (cap > 16) glowMushroom(ctx, mx, my, cap, r);
      /* e il velo viola che i funghi buttano su tutto il primo piano: la luce
         di dodici funghi luminosi non si ferma sul sentiero. */
      /* ...ma un velo TINGE, non copre: a 0,035+0,055 il primo piano diventava
         una fascia lavanda uniforme che leggeva come NEBBIA e mangiava la grana
         del sottobosco. Un terzo di quell'opacità, più i cespi d'erba scuri che
         dicono che quello è un suolo e non un piano. */
      for (let y = g - 60; y < H; y += 2) {
        const t = (y - (g - 60)) / (H - g + 60);
        ctx.fillStyle = `rgba(146,86,192,${(0.012 + t * 0.020).toFixed(3)})`;
        ctx.fillRect(0, y, W, 2);
      }
      for (let q = 0; q < 130; q++) {                    // cespi, radici, foglie secche
        const ax = r() * W, ay = g + 4 + r() * (H - g - 6);
        ctx.fillStyle = ['rgba(12,26,15,.52)', 'rgba(46,66,38,.34)', 'rgba(70,58,34,.30)'][q % 3];
        ctx.fillRect(ax, ay, 5 + (r() * 14 | 0), 3 + (r() * 3 | 0));
        if (q % 4 === 0) { ctx.fillStyle = 'rgba(30,52,32,.42)'; ctx.fillRect(ax + 2, ay - 5, 3, 6); }
      }

      /* LA QUERCIA PIÙ ANZIANA: il soggetto. Tronco di 96 px alla base, nodoso,
         con IL NODO CHE È UN OCCHIO e LA FENDITURA CHE È UNA BOCCA — perché in
         questo bosco gli alberi parlano, e un albero che parla si riconosce da
         quello, non dalla dimensione. */
      {
        const qx = W * 0.225, qb = g + 20;
        for (let y = qb; y > 40; y -= 1) {
          const t = (qb - y) / (qb - 40);
          const sp = Math.round(96 - t * 40 + Math.sin(t * 7) * 6);
          const cx2 = qx + Math.sin(t * 2.2) * 14;
          ctx.fillStyle = mix('#33261a', '#241a10', t * 0.6);
          ctx.fillRect(cx2 - sp / 2, y, sp, 1);
          for (let q = 0; q < 8; q++) {
            const ox = (q - 4) * 12 + ((q * 7) % 5) - 2;
            if (Math.abs(ox) > sp / 2 - 2) continue;
            ctx.fillStyle = q % 3 !== 1 ? 'rgba(10,7,4,.42)' : 'rgba(122,102,70,.12)';
            ctx.fillRect(cx2 + ox, y, 3, 1);
          }
        }
        ctx.fillStyle = '#241a10';                                  // le radici, grosse
        for (const dx of [-72, -44, -18, 22, 50, 76]) for (let k = 0; k < 26; k++) ctx.fillRect(qx + dx * (1 + k / 26 * 0.5), qb + k * 0.4, 11, 6);
        // IL NODO-OCCHIO e LA FENDITURA-BOCCA
        const fy2 = g - 96;
        ctx.fillStyle = '#1a1209'; pixelEllipse(ctx, qx - 16, fy2, 17, 13, 3);
        ctx.fillStyle = '#0b0704'; pixelEllipse(ctx, qx - 16, fy2, 11, 8, 3);
        ctx.fillStyle = '#e8d84a'; pixelDisc(ctx, qx - 14, fy2 + 1, 5, 2);      // la pupilla accesa
        ctx.fillStyle = '#100c04'; pixelDisc(ctx, qx - 14, fy2 + 1, 2, 2);
        glow(ctx, qx - 14, fy2 + 1, 11, 5, '232,216,74');
        ctx.fillStyle = '#1a1209'; pixelEllipse(ctx, qx + 22, fy2 - 4, 12, 9, 3);
        ctx.fillStyle = '#0b0704'; pixelEllipse(ctx, qx + 22, fy2 - 4, 7, 5, 3);
        /* LA BOCCA era `sin(t*3.1)*7` su 56 px: un ARCO SOLO, cioè un sorriso,
           cioè una faccina. Una fenditura nella corteccia è quasi orizzontale e
           irregolare: si sposta di due o tre pixel a caso, non descrive una
           curva. È la differenza fra un albero che potrebbe parlare e un
           adesivo. */
        ctx.fillStyle = '#0b0704';
        for (let k = 0; k < 58; k++) {
          const dy = ((k * 7) % 5) - 2 + ((k * 13) % 3) - 1;
          ctx.fillRect(qx - 30 + k, fy2 + 36 + dy, 2, 3 + ((k * 5) % 3));
        }
        ctx.fillStyle = 'rgba(122,102,70,.13)';
        for (let k = 0; k < 58; k++) {
          const dy = ((k * 7) % 5) - 2 + ((k * 13) % 3) - 1;
          ctx.fillRect(qx - 30 + k, fy2 + 40 + dy, 2, 2);
        }
        // i rami a candelabro, e la chioma che pesa sopra
        for (const [ang, lun] of [[-1.25, 150], [-0.6, 120], [0.5, 134], [1.15, 110], [-0.1, 84]]) {
          for (let k = 0; k < lun; k++) {
            ctx.fillStyle = '#241a10';
            ctx.fillRect(qx + Math.sin(ang) * k, 44 - Math.cos(ang) * k * 0.5, Math.max(4, 13 - k / 11 | 0), 5);
          }
        }
        for (let q = 0; q < 200; q++) {
          const ax = qx - 200 + (r() * 400 | 0), ay = -14 + (r() * 108 | 0);
          ctx.fillStyle = ['#0c1a11', '#08150d', '#102016'][q % 3];
          ctx.fillRect(ax, ay, 16 + (r() * 12 | 0), 10 + (r() * 8 | 0));
        }
      }

      /* GLI OCCHI FRA LE FRONDE, sette paia, di taglia e altezza diverse: due
         paia da cinque pixel in un bosco che «bisbiglia al vostro passaggio»
         erano un accenno, non una minaccia. Alcuni sbirciano da dietro un ramo
         (una palpebra scura che ne taglia metà). */
      for (const [fx, fy, sz, meta] of [[0.075, 0.40, 7, 0], [0.135, 0.22, 5, 1], [0.335, 0.34, 6, 0],
                                        [0.455, 0.15, 8, 0], [0.585, 0.30, 5, 1], [0.745, 0.20, 7, 0],
                                        [0.885, 0.37, 6, 1]]) {
        const ex = W * fx, ey = H * fy;
        glow(ctx, ex + sz, ey + sz / 2, sz * 3, sz * 1.4, '232,216,74');
        ctx.fillStyle = '#e8d84a';
        ctx.fillRect(ex, ey, sz, sz); ctx.fillRect(ex + sz * 2.2, ey, sz, sz);
        ctx.fillStyle = '#161008';
        ctx.fillRect(ex + sz * 0.3, ey + sz * 0.3, Math.max(2, sz * 0.4), Math.max(2, sz * 0.4));
        ctx.fillRect(ex + sz * 2.5, ey + sz * 0.3, Math.max(2, sz * 0.4), Math.max(2, sz * 0.4));
        if (meta) { ctx.fillStyle = '#0a1409'; ctx.fillRect(ex - 2, ey - 2, sz * 3.4, Math.ceil(sz * 0.45)); }
      }
    },

    capanna(ctx, W, H) {
      /* LA CAPANNA DI NONNA ORTICA, otto scene, e il testo la descrive in una
         riga sola che è già un elenco: «esattamente come una capanna di strega
         dovrebbe essere: STORTA, coperta di MUSCHIO, con FUMO VERDE che esce dal
         camino e un CALDERONE che borbotta da solo IN GIARDINO».
         Prima: una capanna perfettamente rettangolare e perfettamente in piombo
         (nessuna stortura), senza un filo di muschio, con il fumo verde fatto di
         tre quadrati allineati, e un calderone che era un rettangolo grigio da
         56x30 — cioè una cassetta. E il suolo stava a luminanza 33: sotto la
         soglia del nero, un terzo del quadro buio.
         Adesso: la capanna PENDE (tutta ruotata di sette gradi, ed è la rotazione
         a farla di strega — non i dettagli), il tetto di paglia ha i covoni
         legati, il muschio cresce dove l'acqua scende, il fumo verde sale a
         volute che si allargano, e il calderone è un calderone: pancia tonda su
         un TREPPIEDE, con il fuoco sotto e il borbottio che esce. */
      const r = rng(41);
      const g = H - 72;
      skyGradient(ctx, W, g, '#0a0d14', '#1a2e22', 10);
      hills(ctx, W, H * 0.5, 60, '#08150c', r, 30);
      for (const [fx, alt] of [[0.045, 96], [0.145, 68], [0.62, 104], [0.72, 74], [0.88, 118], [0.965, 84]]) {
        tree(ctx, W * fx, g + 10, alt, '#0a1a10', '#150f08', r);
      }
      ground(ctx, W, H, g, '#1e3c24', r, 12, 12);
      for (let q = 0; q < 120; q++) {                       // il giardino: cespi ed erbacce
        const ax = r() * W, ay = g + 4 + r() * (H - g - 6);
        ctx.fillStyle = ['rgba(12,26,15,.50)', 'rgba(48,70,40,.32)', 'rgba(72,60,34,.28)'][q % 3];
        ctx.fillRect(ax, ay, 5 + (r() * 14 | 0), 3 + (r() * 3 | 0));
        if (q % 4 === 0) { ctx.fillStyle = 'rgba(34,58,34,.44)'; ctx.fillRect(ax + 2, ay - 6, 3, 7); }
      }

      /* LA CAPANNA STORTA: si ruota tutta, così ogni linea pende insieme. Una
         capanna disegnata dritta con qualche dettaglio sghembo resta dritta. */
      const cx = W * 0.30, cw = 224, ch = 124;
      ctx.save();
      ctx.translate(cx + cw / 2, g);
      ctx.rotate(0.085);   // sette gradi: a tre e mezzo la stortura non si leggeva
      ctx.translate(-(cx + cw / 2), -g);
      ctx.fillStyle = 'rgba(6,10,6,.44)'; ctx.fillRect(cx - 10, g - 6, cw + 20, 12);
      // le tavole verticali della parete, di larghezza diversa
      for (let x = 0; x < cw; ) {
        const larg = 11 + ((x * 7) % 9);
        ctx.fillStyle = ['#4a3a28', '#42331f', '#54422c', '#3c2f1e'][(x / 7 | 0) % 4];
        ctx.fillRect(cx + x, g - ch, Math.min(larg, cw - x), ch);
        ctx.fillStyle = 'rgba(12,8,4,.34)'; ctx.fillRect(cx + x, g - ch, 2, ch);
        x += larg;
      }
      // IL MUSCHIO, dove l'acqua scende: sotto il tetto, negli angoli, sui giunti
      for (let q = 0; q < 90; q++) {
        const ax = cx + (r() * cw | 0);
        const alto = 8 + (r() * 26 | 0);
        const dalTetto = r() > 0.45;
        const ay = dalTetto ? g - ch + (r() * 26 | 0) : g - (r() * 30 | 0) - alto;
        ctx.fillStyle = ['rgba(74,112,54,.44)', 'rgba(52,88,42,.40)', 'rgba(96,132,62,.30)'][q % 3];
        ctx.fillRect(ax, ay, 4 + (r() * 8 | 0), alto);
      }
      /* IL TETTO DI PAGLIA: covoni legati, non sei fasce sovrapposte. Ogni covone
         ha il suo legaccio e le sue punte, e i covoni si accavallano. */
      for (let i = 0; i < 5; i++) {
        const rw = (cw + 52) * (1 - i / 5.6);
        const rx2 = cx + (cw - rw) / 2 + i * 2, ry2 = g - ch - 4 - i * 13;
        for (let x = 0; x < rw; x += 13) {
          ctx.fillStyle = ['#3e5a34', '#33502c', '#476639'][(x / 13 | 0) % 3];
          ctx.fillRect(rx2 + x, ry2, 12, 16);
          ctx.fillStyle = 'rgba(18,30,16,.44)'; ctx.fillRect(rx2 + x + 11, ry2, 2, 16);
          ctx.fillStyle = 'rgba(150,168,110,.14)'; ctx.fillRect(rx2 + x, ry2, 12, 2);
        }
        ctx.fillStyle = '#241a10'; ctx.fillRect(rx2, ry2 + 11, rw, 3);       // il legaccio
      }
      // la porta, e la sua soglia consumata
      ctx.fillStyle = '#241a10'; ctx.fillRect(cx + 92, g - 62, 46, 62);
      ctx.fillStyle = '#3a2a18'; ctx.fillRect(cx + 86, g - 68, 58, 7);
      ctx.fillStyle = '#54422c'; ctx.fillRect(cx + 92, g - 4, 46, 4);
      ctx.fillStyle = '#e8c860'; ctx.fillRect(cx + 130, g - 36, 5, 5);        // la maniglia
      // LA FINESTRA VERDE, coi quattro riquadri e il piombo
      glow(ctx, cx + 44, g - 82, 24, 24, '138,224,90');
      ctx.fillStyle = '#2e2418'; ctx.fillRect(cx + 22, g - 102, 44, 44);
      ctx.fillStyle = '#8ae05a'; ctx.fillRect(cx + 26, g - 98, 36, 36);
      ctx.fillStyle = '#b8f088'; ctx.fillRect(cx + 26, g - 98, 36, 8);
      ctx.fillStyle = '#2e2418'; ctx.fillRect(cx + 42, g - 98, 4, 36); ctx.fillRect(cx + 26, g - 82, 36, 4);
      // e IL GATTO che legge un libro, sul davanzale
      ctx.fillStyle = '#1d1a20'; ctx.fillRect(cx + 20, g - 58, 50, 6);        // il davanzale
      ctx.fillStyle = '#17141a'; pixelEllipse(ctx, cx + 40, g - 68, 13, 9, 2);
      ctx.fillStyle = '#17141a'; pixelDisc(ctx, cx + 30, g - 76, 7, 2);       // la testa
      ctx.fillRect(cx + 24, g - 84, 4, 6); ctx.fillRect(cx + 32, g - 84, 4, 6);   // le orecchie
      ctx.fillStyle = '#8ae05a'; ctx.fillRect(cx + 27, g - 77, 3, 2); ctx.fillRect(cx + 32, g - 77, 3, 2);
      ctx.fillStyle = '#17141a';                                              // la coda, alzata
      for (let k = 0; k < 18; k++) ctx.fillRect(cx + 52 + k * 0.6, g - 70 - k, 3, 3);
      ctx.fillStyle = '#d8cfae'; ctx.fillRect(cx + 34, g - 64, 22, 3);        // IL LIBRO, aperto
      ctx.fillStyle = '#b8ad8a'; ctx.fillRect(cx + 44, g - 65, 2, 4);
      // IL CAMINO, di pietra, con il fumo VERDE a volute che si allargano
      for (let q = 0; q < 8; q++) {
        ctx.fillStyle = ['#5a5a66', '#4a4a54', '#66666f'][q % 3];
        ctx.fillRect(cx + 160, g - ch - 48 + q * 7, 26, 6);
        ctx.fillStyle = 'rgba(20,20,26,.34)'; ctx.fillRect(cx + 160, g - ch - 48 + q * 7 + 5, 26, 2);
      }
      ctx.fillStyle = '#2a2a32'; ctx.fillRect(cx + 156, g - ch - 54, 34, 8);
      ctx.restore();
      // il fumo va disegnato FUORI dalla rotazione: il fumo non pende
      for (let k = 0; k < 30; k++) {
        const t = k / 29;
        const yy = g - ch - 62 - k * 6;
        const xx = cx + 176 + Math.sin(k * 0.38) * (10 + t * 34);
        const rr = 7 + t * 22;
        ctx.fillStyle = `rgba(138,224,90,${(0.30 * (1 - t * 0.9)).toFixed(3)})`;
        pixelDisc(ctx, xx, yy, rr, 3);
      }
      glow(ctx, cx + 186, g - ch - 90, 34, 40, '138,224,90');

      /* IL CALDERONE, in giardino, che borbotta DA SOLO: pancia tonda su un
         treppiede di ferro, il bordo svasato, il fuoco sotto, e le bolle che
         scoppiano fuori dall'orlo. Prima era un rettangolo grigio da 56x30 su
         niente: una cassetta degli attrezzi con del vapore sopra. */
      {
        const kx = W * 0.735, kb = g + 22;
        ctx.fillStyle = 'rgba(6,10,6,.44)'; ctx.fillRect(kx - 44, kb - 2, 92, 8);
        ctx.fillStyle = '#2a2a32';                                            // il treppiede
        for (const pend of [-0.55, 0.55, 0.06]) {
          for (let k = 0; k < 34; k++) ctx.fillRect(kx + pend * k, kb - 34 + k, 5, 2);
        }
        // la pancia: un ovale schiacciato, piu' larga in alto
        for (let y = -30; y < 6; y++) {
          const u = (y + 30) / 36;
          const sp = Math.round(46 * Math.sqrt(Math.max(0, 1 - Math.pow(u * 1.5 - 0.55, 2) * 1.6)));
          ctx.fillStyle = mix('#3a3a46', '#1c1c24', u);
          ctx.fillRect(kx - sp, kb - 44 + y + 8, sp * 2, 1);
          ctx.fillStyle = 'rgba(150,150,170,.10)'; ctx.fillRect(kx - sp, kb - 44 + y + 8, 4, 1);
        }
        ctx.fillStyle = '#4a4a58'; ctx.fillRect(kx - 50, kb - 68, 100, 8);    // il bordo svasato
        ctx.fillStyle = '#5e5e6c'; ctx.fillRect(kx - 50, kb - 68, 100, 2);
        ctx.fillStyle = '#141418'; ctx.fillRect(kx - 44, kb - 62, 88, 5);     // dentro
        ctx.fillStyle = '#8ae05a'; ctx.fillRect(kx - 42, kb - 62, 84, 3);     // la pozione
        ctx.fillStyle = '#2a2a32';                                            // il manico ad arco
        for (let a = 10; a <= 170; a += 4) {
          const rad = a * Math.PI / 180;
          ctx.fillRect(kx - Math.cos(rad) * 52, kb - 68 - Math.sin(rad) * 34, 5, 4);
        }
        // il fuoco sotto
        glow(ctx, kx, kb - 12, 26, 12, '245,166,35');
        for (let k = 0; k < 14; k++) {
          const fx2 = kx - 30 + (r() * 60 | 0), fh = 8 + (r() * 16 | 0);
          ctx.fillStyle = ['#f5a623', '#e8621a', '#f8d24a'][k % 3];
          ctx.fillRect(fx2, kb - 6 - fh, 5, fh);
        }
        ctx.fillStyle = '#2e2118';                                            // la legna
        for (let k = 0; k < 5; k++) ctx.fillRect(kx - 34 + k * 15, kb - 6, 17, 5);
        // le BOLLE che scoppiano fuori dall'orlo: e' il «borbotta da solo»
        glow(ctx, kx, kb - 84, 30, 26, '138,224,90');
        for (let k = 0; k < 16; k++) {
          const bx2 = kx - 34 + (r() * 68 | 0), by2 = kb - 72 - (r() * 46 | 0);
          ctx.fillStyle = `rgba(138,224,90,${(0.20 + r() * 0.40).toFixed(2)})`;
          pixelDisc(ctx, bx2, by2, 3 + (r() * 5 | 0), 2);
        }
      }

      /* LE ERBE APPESE A TESTA IN GIÙ, su un filo teso fra la capanna e un palo:
         mazzetti legati, di lunghezza diversa, che è come si essiccano davvero. */
      {
        const y0 = g - 116, y1 = g - 96;
        ctx.fillStyle = '#4a3a28'; ctx.fillRect(W * 0.905, y1, 7, 96);        // il palo
        ctx.fillStyle = '#5a4530';
        for (let k = 0; k < 46; k++) ctx.fillRect(W * 0.56 + k * 7, y0 + (y1 - y0) * (k / 45) + Math.sin(k / 45 * 3.14) * 7, 7, 2);
        for (let k = 0; k < 8; k++) {
          const t = (k + 0.5) / 8;
          const hx = W * 0.56 + t * (W * 0.345);
          const hy = y0 + (y1 - y0) * t + Math.sin(t * 3.14) * 7;
          const lun = 20 + ((k * 13) % 18);
          ctx.fillStyle = '#6a5230'; ctx.fillRect(hx - 2, hy, 15, 5);        // il legaccio
          /* Un MAZZETTO, non un serpentello: al primo colpo ogni erba era una
             sola striscia da sei pixel che ondeggiava, e otto strisce ondeggianti
             appese a un filo leggevano come otto zigzag colorati. Un mazzo
             essiccato e' quattro o cinque steli affiancati, di lunghezza diversa,
             che si aprono un po' scendendo. */
          for (let st = 0; st < 5; st++) {
            const lun2 = lun - ((st * 7) % 9);
            const ox = (st - 2) * 3;
            for (let q = 0; q < lun2; q++) {
              const apre = ox * (1 + q / lun2 * 0.8);
              ctx.fillStyle = st % 2
                ? ['#4e7a3e', '#7a6a2e', '#5a4a7a', '#3e6a44'][k % 4]
                : ['#3c6230', '#5f5223', '#453862', '#2f5636'][k % 4];
              ctx.fillRect(hx + 4 + apre, hy + 5 + q, 3, 2);
            }
            // la punta secca, piu' chiara
            ctx.fillStyle = 'rgba(200,190,140,.30)';
            ctx.fillRect(hx + 4 + ox * 1.8, hy + 4 + lun2, 3, 3);
          }
        }
      }
    },

    miniera(ctx, W, H) {
      const r = rng(43);
      const floorY = H - 52;
      blocks(ctx, 0, 0, W, H, '#2e2a35', 16, r, 0.25);
      // galleria che si perde sul fondo, con imbocco ad arco
      blocks(ctx, W * 0.36, 40, W * 0.28, floorY - 40, '#1a1720', 14, r, 0.16);
      for (let i = 0; i < 5; i++) {   // arco a gradini sull'imbocco
        blocks(ctx, W * 0.36 + i * 10, 40 - 12 + i * 10, W * 0.28 - i * 20, 12, '#2a2634', 10, r, 0.12);
      }
      blocks(ctx, W * 0.41, 70, W * 0.18, floorY - 70, '#12101a', 12, r, 0.12);
      for (let i = 0; i < 4; i++) {
        blocks(ctx, W * 0.41 + i * 8, 70 - 10 + i * 8, W * 0.18 - i * 16, 10, '#1a1720', 10, r, 0.1);
      }
      blocks(ctx, 0, floorY, W, H - floorY, '#242030', 14, r, 0.2);
      // travi di sostegno complete (montanti + traversa a soffitto)
      for (let i = 0; i < 4; i++) mineBeam(ctx, W * 0.06 + i * W * 0.25, 0, floorY, r);
      // vene di cristallo raggruppate
      crystalVein(ctx, W * 0.14, H * 0.42, 5, r);
      crystalVein(ctx, W * 0.68, H * 0.3, 4, r);
      crystalVein(ctx, W * 0.88, H * 0.55, 5, r);
      // binari con traversine
      ctx.fillStyle = '#4a3524';
      for (let x = 6; x < W; x += 42) ctx.fillRect(x, floorY + 4, 18, 34);
      ctx.fillStyle = '#8a8a96';
      ctx.fillRect(0, floorY + 10, W, 6); ctx.fillRect(0, floorY + 30, W, 6);
      // carrello da miniera con ruote
      const kx = W * 0.60;
      blocks(ctx, kx, floorY - 46, 96, 46, '#5a4a3a', 8, r, 0.15);
      blocks(ctx, kx - 4, floorY - 52, 104, 10, '#6e5a45', 8, r, 0.1);
      ctx.fillStyle = '#3a3a45';
      ctx.fillRect(kx + 10, floorY, 22, 22); ctx.fillRect(kx + 62, floorY, 22, 22);
      ctx.fillStyle = '#6e6e7a';
      ctx.fillRect(kx + 16, floorY + 6, 10, 10); ctx.fillRect(kx + 68, floorY + 6, 10, 10);
      ctx.fillStyle = '#5ad8e0';
      ctx.fillRect(kx + 22, floorY - 56, 14, 10); ctx.fillRect(kx + 46, floorY - 58, 16, 12); // carico di cristalli
      // picconi appoggiati e sacchi
      ctx.fillStyle = '#4a3524'; ctx.fillRect(W * 0.30, floorY - 44, 6, 44);
      ctx.fillStyle = '#8a8a96'; ctx.fillRect(W * 0.30 - 10, floorY - 50, 26, 8);
      blocks(ctx, W * 0.22, floorY - 26, 40, 26, '#6e5a42', 8, r, 0.16);
      // torce su staffa alle travi
      torch(ctx, W * 0.155, H * 0.38); torch(ctx, W * 0.655, H * 0.32); torch(ctx, W * 0.905, H * 0.42);
    },

    castelloEsterno(ctx, W, H) {
      const r = rng(53);
      skyGradient(ctx, W, H, '#150d24', '#3d1535', 10);
      stars(ctx, W, H, r, 40);
      moon(ctx, W * 0.18, 54, 32, '#c8b8e8', true);   // spostata: non più coperta dalla torre
      /* «Il Castello Crepuscolo si arrampica sulla montagna come UN ARTIGLIO DI
         PIETRA NERA». Era dipinto in #3a3045 e #332a40 — luminanza 50 — su un
         cielo che all'orizzonte fa 33: pietra PIÙ CHIARA del cielo, cioè un
         castello illuminato da niente in una notte di eclissi, e una sagoma che
         il misuratore dei soggetti non riusciva nemmeno a trovare (diciassette
         punti di salto, sotto la soglia). Nera com'è scritto: la sagoma esiste,
         il rosso delle finestre diventa l'unica cosa viva, e il velo della
         Barriera si vede perché ha qualcosa di scuro dietro. */
      const g = H - 60;
      hills(ctx, W, g - 10, 50, '#170f22', r, 34);
      // mura
      blocks(ctx, W * 0.08, g - 150, W * 0.84, 132, '#171320', 12, r, 0.15);
      for (let x = W * 0.08; x < W * 0.9; x += 36) blocks(ctx, x, g - 168, 20, 18, '#171320', 8, r, 0.15);
      // torri laterali
      blocks(ctx, W * 0.05, g - 240, 70, 222, '#120f1a', 10, r, 0.15);
      blocks(ctx, W * 0.87, g - 240, 70, 222, '#120f1a', 10, r, 0.15);
      // mastio centrale, più alto e affusolato
      blocks(ctx, W * 0.43, g - 286, 130, 136, '#1a1526', 10, r, 0.15);
      blocks(ctx, W * 0.415, g - 300, 160, 18, '#221c30', 10, r, 0.12);
      const spike = (x, w, y) => { for (let i = 0; i < 6; i++) blocks(ctx, x + i * (w / 12), y - i * 11, w - i * (w / 6), 11, '#2a1020', 8, r, 0.15); };
      spike(W * 0.05, 70, g - 240); spike(W * 0.87, 70, g - 240); spike(W * 0.43, 130, g - 300);
      /* «Dalle finestre PULSA una luce rossastra»: due finestre non pulsano,
         fanno due puntini. Su un castello nero le finestre accese sono la sola
         cosa che si vede, quindi sono tante e di intensità diversa. */
      const finestre = [[0.46, 262, 11, 17, 1.0], [0.53, 232, 11, 17, 0.8], [0.49, 196, 10, 15, 0.6],
                        [0.075, 214, 9, 14, 0.9], [0.075, 176, 9, 14, 0.5], [0.088, 138, 8, 12, 0.7],
                        [0.895, 214, 9, 14, 0.9], [0.895, 176, 9, 14, 0.6], [0.908, 138, 8, 12, 0.4],
                        [0.20, 118, 8, 12, 0.5], [0.31, 118, 8, 12, 0.8], [0.62, 118, 8, 12, 0.6],
                        [0.72, 118, 8, 12, 0.9], [0.41, 92, 7, 11, 0.4], [0.57, 92, 7, 11, 0.7]];
      for (const [fx, fy, fw, fh, forza] of finestre) {
        glow(ctx, W * fx + fw / 2, g - fy + fh / 2, fw * 1.7, fh * 1.4, '232,74,90');
        ctx.fillStyle = `rgba(232,74,90,${(0.42 + forza * 0.5).toFixed(2)})`;
        ctx.fillRect(W * fx, g - fy, fw, fh);
        ctx.fillStyle = `rgba(255,196,180,${(0.20 + forza * 0.4).toFixed(2)})`;
        ctx.fillRect(W * fx + 2, g - fy + 2, fw - 4, 4);
      }
      // fossato e ponte levatoio con catene
      blocks(ctx, 0, g, W, H - g, '#1d1830', 12, r, 0.2);
      blocks(ctx, W * 0.18, g - 20, W * 0.64, 24, '#0f1d2e', 10, r, 0.22);
      blocks(ctx, W * 0.42, g - 22, 150, 22, '#4a3524', 10, r, 0.15);
      ctx.strokeStyle = '#6e6e7a'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(W * 0.44, g - 22); ctx.lineTo(W * 0.46, g - 96); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(W * 0.56, g - 22); ctx.lineTo(W * 0.54, g - 96); ctx.stroke();
      // portone
      ctx.fillStyle = '#1a1020'; ctx.fillRect(W * 0.45, g - 96, 100, 76);
      ctx.fillStyle = '#0d0810'; ctx.fillRect(W * 0.45 + 10, g - 86, 80, 66);
      /* LA BARRIERA NOTTURNA: «un velo d'ombra liquida che ondeggia COME ACQUA
         VERTICALE». Prima erano quattro rettangoli sovrapposti a opacità
         crescente e quattordici trattini sparsi: un velo piatto. L'acqua
         verticale si disegna colonna per colonna, con la fase che scorre in
         altezza — è l'ondeggiare che la fa liquida, non la trasparenza. */
      /* Le creste vanno ORIZZONTALI e ondeggianti, non diagonali: `sin(u*26 +
         v*9)` faceva fasce inclinate che leggevano come graffi o pioggia. Un
         velo d'acqua verticale, visto di faccia, ha le onde che corrono in
         orizzontale e SALGONO — quindi la fase sta in y e la deformazione in x. */
      for (let y = g - 306; y < g + 6; y += 2) {
        const v = (y - (g - 306)) / 312;
        for (let x = W * 0.02; x < W * 0.98; x += 3) {
          const u = (x - W * 0.02) / (W * 0.96);
          const onda = Math.sin(y * 0.085 + Math.sin(u * 7.5) * 2.6 + Math.sin(u * 2.1) * 1.4);
          const a = 0.028 + Math.max(0, onda) * 0.055;
          ctx.fillStyle = `rgba(48,14,72,${a.toFixed(3)})`;
          ctx.fillRect(x, y, 3, 2);
          if (onda > 0.90) { ctx.fillStyle = `rgba(168,112,232,${(0.10 - v * 0.04).toFixed(3)})`; ctx.fillRect(x, y, 3, 1); }
        }
      }
      ctx.fillStyle = 'rgba(170,116,236,.10)'; ctx.fillRect(W * 0.02, g - 310, W * 0.96, 6);

      /* E LA LUNA, che sta a sinistra, deve prendere gli SPIGOLI: un castello di
         pietra nera senza un filo di luce sui bordi è una macchia nera, e il
         quadro segnava il 95% di pixel scuri. Il filo di luna a sinistra e il
         rimbalzo caldo delle finestre sono le due cose che gli danno il volume
         senza schiarire la pietra. */
      ctx.fillStyle = 'rgba(190,178,232,.16)';
      for (const [bx2, by2, bh2] of [[W * 0.05, g - 240, 222], [W * 0.08, g - 150, 132],
                                     [W * 0.43, g - 286, 136], [W * 0.87, g - 240, 222]]) {
        ctx.fillRect(bx2, by2, 3, bh2);
      }
      ctx.fillStyle = 'rgba(190,178,232,.10)';
      ctx.fillRect(W * 0.08, g - 150, W * 0.84, 3); ctx.fillRect(W * 0.415, g - 300, 160, 3);
      for (const [fx, fy, fw, fh, forza] of finestre) {         // il rimbalzo caldo sul muro
        ctx.fillStyle = `rgba(184,58,60,${(0.05 + forza * 0.05).toFixed(3)})`;
        ctx.fillRect(W * fx - fw, g - fy - fh * 0.6, fw * 3, fh * 2.2);
      }

      /* LA FILA DI CARROZZE che scarica gli ospiti al portone, e in fondo IL
         FURGONE «MASCHERART — Forniture per Feste dell'Altro Mondo», da cui il
         fattorino sta scaricando scatole di maschere di ricambio. Sono la
         ragione per cui si entra da lì, e nel quadro non c'erano. */
      {
        const carrozza = (cx2, sc, col) => {
          const cy2 = g + 6;
          ctx.fillStyle = 'rgba(6,4,10,.45)'; ctx.fillRect(cx2 - 46 * sc, cy2 + 8 * sc, 96 * sc, 6 * sc);
          ctx.fillStyle = col; ctx.fillRect(cx2 - 34 * sc, cy2 - 40 * sc, 70 * sc, 34 * sc);      // la cassa
          ctx.fillStyle = shade(col, 1.3); ctx.fillRect(cx2 - 34 * sc, cy2 - 40 * sc, 70 * sc, 3 * sc);
          ctx.fillStyle = '#e8c060'; ctx.fillRect(cx2 - 24 * sc, cy2 - 34 * sc, 20 * sc, 15 * sc); // il finestrino acceso
          ctx.fillStyle = shade(col, 0.6); ctx.fillRect(cx2 - 34 * sc, cy2 - 46 * sc, 74 * sc, 7 * sc);
          ctx.fillStyle = '#1a1520';                                                              // le ruote
          pixelDisc(ctx, cx2 - 24 * sc, cy2 + 2 * sc, 12 * sc, 2);
          pixelDisc(ctx, cx2 + 26 * sc, cy2 + 2 * sc, 16 * sc, 2);
          ctx.fillStyle = '#3e3348';
          pixelDisc(ctx, cx2 - 24 * sc, cy2 + 2 * sc, 5 * sc, 2); pixelDisc(ctx, cx2 + 26 * sc, cy2 + 2 * sc, 6 * sc, 2);
          ctx.fillStyle = '#2a2230'; ctx.fillRect(cx2 + 36 * sc, cy2 - 26 * sc, 26 * sc, 4 * sc);  // il timone
          glow(ctx, cx2 - 38 * sc, cy2 - 34 * sc, 9 * sc, 8 * sc, '240,200,110');                 // la lanterna
          ctx.fillStyle = '#f0c868'; ctx.fillRect(cx2 - 40 * sc, cy2 - 38 * sc, 6 * sc, 8 * sc);
        };
        /* LE POZZE DELLE LANTERNE sul terreno, prima delle carrozze: la
           lanterna c'era ma non illuminava niente, e il primo piano — che è la
           parte che DEVE restare leggibile in un quadro di pietra nera —
           restava allo stesso buio del cielo. */
        /* ...e la pozza va costruita come un'ELLISSE con la x arrotondata: al
           primo colpo partivo da `px2 - rx2` in virgola mobile, quindi le celle
           da tre pixel non si allineavano fra una riga e l'altra e il risultato
           era una linea TRATTEGGIATA di puntini gialli, non una pozza. */
        for (const [px2, forza] of [[W * 0.262, 1.0], [W * 0.123, 0.85], [W * 0.030, 0.65], [W * 0.42, 0.95], [W * 0.70, 0.75]]) {
          const cx3 = Math.round(px2), cy3 = g + 22;
          const rx3 = Math.round(150 * forza), ry3 = Math.round(46 * forza);
          for (let y = Math.max(0, cy3 - ry3); y < Math.min(H, cy3 + ry3); y++) {
            for (let x = Math.max(0, cx3 - rx3); x < Math.min(W, cx3 + rx3); x += 3) {
              const d = Math.hypot((x - cx3) / rx3, (y - cy3) / ry3);
              if (d >= 1) continue;
              const a = 0.30 * forza * Math.pow(1 - d, 1.8);
              if (a <= 0.005) continue;
              ctx.fillStyle = `rgba(240,198,110,${a.toFixed(3)})`;
              ctx.fillRect(x, y, 3, 1);
            }
          }
        }
        carrozza(W * 0.30, 1.00, '#241a2e');
        carrozza(W * 0.155, 0.80, '#2a1f34');
        carrozza(W * 0.055, 0.62, '#1e1626');
        // gli OSPITI in fila al portone, sagome in abito lungo, con la maschera chiara
        for (let k = 0; k < 9; k++) {
          const ox2 = W * 0.375 + k * 17 + (k % 3) * 3, alt = 40 + (k % 4) * 4;
          ctx.fillStyle = ['#191325', '#221a2c', '#14101e'][k % 3];
          ctx.fillRect(ox2, g + 12 - alt, 12, alt);
          ctx.fillStyle = '#0f0b16'; ctx.fillRect(ox2 - 2, g + 12 - alt + 10, 16, alt - 10);
          ctx.fillStyle = '#d8cfc0'; ctx.fillRect(ox2 + 2, g + 12 - alt, 8, 7);     // la maschera
          ctx.fillStyle = '#2a2230'; ctx.fillRect(ox2 + 3, g + 12 - alt + 2, 2, 2); ctx.fillRect(ox2 + 7, g + 12 - alt + 2, 2, 2);
        }
        // IL FURGONE DI SERVIZIO, dietro le carrozze
        {
          const fx2 = W * 0.70, fy2 = g + 4;
          ctx.fillStyle = 'rgba(6,4,10,.45)'; ctx.fillRect(fx2 - 8, fy2 + 10, 112, 6);
          ctx.fillStyle = '#2e2a3a'; ctx.fillRect(fx2, fy2 - 44, 96, 44);
          ctx.fillStyle = '#3a3548'; ctx.fillRect(fx2, fy2 - 44, 96, 3);
          ctx.fillStyle = '#d8d2c0'; ctx.fillRect(fx2 + 8, fy2 - 36, 58, 12);        // la scritta MASCHERART
          ctx.fillStyle = 'rgba(40,34,50,.80)';
          for (let q = 0; q < 8; q++) ctx.fillRect(fx2 + 11 + q * 7, fy2 - 33, 4, 6);
          ctx.fillStyle = '#1a1520'; pixelDisc(ctx, fx2 + 18, fy2 + 2, 12, 2); pixelDisc(ctx, fx2 + 78, fy2 + 2, 12, 2);
          ctx.fillStyle = '#3e3348'; pixelDisc(ctx, fx2 + 18, fy2 + 2, 5, 2); pixelDisc(ctx, fx2 + 78, fy2 + 2, 5, 2);
          // il fattorino, che scarica una scatola di maschere
          ctx.fillStyle = '#241d2e'; ctx.fillRect(fx2 + 100, fy2 - 34, 13, 34);
          ctx.fillStyle = '#c8b898'; ctx.fillRect(fx2 + 100, fy2 - 40, 13, 7);
          ctx.fillStyle = '#6a5c48'; ctx.fillRect(fx2 + 112, fy2 - 26, 20, 15);      // la scatola
          ctx.fillStyle = '#d8cfc0'; ctx.fillRect(fx2 + 115, fy2 - 30, 6, 5); ctx.fillRect(fx2 + 123, fy2 - 29, 6, 5);
        }
      }
    },

    cucine(ctx, W, H) {
      const r = rng(151);
      const floorY = H - 66;
      blocks(ctx, 0, 0, W, H, '#3d3a34', 14, r, 0.16);          // muri di pietra affumicata
      blocks(ctx, 0, floorY, W, H - floorY, '#4a4038', 16, r, 0.2);
      // grande focolare acceso "per abitudine"
      blocks(ctx, W * 0.04, floorY - 168, 190, 168, '#5a5a60', 10, r, 0.18);
      blocks(ctx, W * 0.02, floorY - 182, 220, 16, '#6e6e78', 10, r, 0.12);
      /* Le «braci che covano da chissà quanto» di k1: fuoco basso e largo, ceppi e brace
         rossa fra loro. Erano due rettangoli concentrici arancione e giallo — a spigolo
         vivo, cioè un pannello luminoso acceso dentro un camino. Stesso helper del
         focolare della taverna: una fiamma disegnata in un posto solo. */
      ctx.fillStyle = '#14100e'; ctx.fillRect(W * 0.04 + 34, floorY - 106, 122, 106);
      fire(ctx, W * 0.04 + 95, floorY - 6, 96, 58, r);
      // pentolone appeso sul fuoco
      ctx.fillStyle = '#3a3a45'; ctx.fillRect(W * 0.04 + 60, floorY - 132, 70, 12);
      blocks(ctx, W * 0.04 + 64, floorY - 122, 62, 40, '#8a5a2a', 8, r, 0.14);
      ctx.fillStyle = '#c8a032'; ctx.fillRect(W * 0.04 + 64, floorY - 126, 62, 6);
      /* Rastrelliera: TRE casseruole di rame grandi invece di sette rettangolini. E via
         le cinque trecce d'aglio: erano bastoncini verdi e bianchi di undici pixel appesi
         fra le pentole, e non si capiva se fossero pentole, prosciutti o panni stesi —
         e l'aglio non lo nomina nessuna scena delle cucine. Un oggetto che dopo due
         tentativi non si legge si toglie: la parete sgombra attorno alle tre casseruole
         vale più di quindici macchie. */
      blocks(ctx, W * 0.30, 44, W * 0.42, 10, '#4a3524', 10, r, 0.1);
      copperPan(ctx, 326, 62, 76, 48);
      copperPan(ctx, 478, 58, 84, 54);
      copperPan(ctx, 622, 64, 68, 42);
      // lungo tavolo da lavoro macchiato da due secoli di sughi
      blocks(ctx, W * 0.34, floorY - 62, W * 0.44, 16, '#7a5c3d', 10, r, 0.14);
      ctx.fillStyle = '#5a3a28';
      for (let i = 0; i < 9; i++) ctx.fillRect(W * 0.35 + r() * W * 0.4, floorY - 60 + r() * 10, 8 + r() * 14, 4);
      ctx.fillStyle = '#4a3524';
      ctx.fillRect(W * 0.36, floorY - 46, 14, 46); ctx.fillRect(W * 0.74, floorY - 46, 14, 46);
      /* LE SETTE PORTATE PERFETTE. Quattro portate grandi sui loro vassoi d'argento,
         allineate alla stessa quota e a passo regolare di centocinque pixel: è la
         «precisione da parata militare» che il testo nomina, e adesso si vede. */
      const topY = floorY - 62;
      for (let i = 0; i < 4; i++) {
        // la x si arrotonda: in un painter pixel-art un fillRect su coordinata
        // frazionaria non è un rettangolo, sono due bordi mezzi trasparenti (lezione 55)
        const cx = Math.round(W * 0.34 + (W * 0.44) * (0.125 + i * 0.25));
        tray(ctx, cx, topY - 8, 92);
        if (i === 0) roastDuck(ctx, cx, topY - 8, 78);
        else if (i === 1) souffle(ctx, cx, topY - 8, 54);
        else if (i === 2) tureen(ctx, cx, topY - 8, 66, r);
        else plateStack(ctx, cx, topY - 10, 62, 7);
      }
      /* Credenza: sei piatti TONDI da quarantasei pixel su due palchetti, non dodici
         quadratini di 18×16 su tre — che a griglia leggevano come una finestra a
         riquadri. Un piatto è un disco: se lo si disegna quadrato non è un piatto. */
      blocks(ctx, W * 0.82, floorY - 130, W * 0.16, 130, '#5a4530', 10, r, 0.14);
      for (let row = 0; row < 2; row++) {
        const shelfY = floorY - 70 + row * 60;
        blocks(ctx, W * 0.82, shelfY, W * 0.16, 8, '#4a3524', 8, r, 0.1);
        for (let i = 0; i < 3; i++) {
          const cx = W * 0.82 + 30 + i * 47;
          ctx.fillStyle = '#c4bfae'; pixelDisc(ctx, cx, shelfY - 24, 23, 3);   // tesa
          ctx.fillStyle = '#eae6d8'; pixelDisc(ctx, cx, shelfY - 24, 18, 3);   // cavo del piatto
        }
      }
      torch(ctx, W * 0.30, H * 0.42); torch(ctx, W * 0.78, H * 0.42);
    },

    torreInterno(ctx, W, H) {
      const r = rng(211);
      // muri di pietra della torre, con la PENDENZA che si sente
      blocks(ctx, 0, 0, W, H, '#2a2438', 14, r, 0.14);
      ctx.save();
      ctx.transform(1, 0.045, 0, 1, 0, -W * 0.02); // tutto pende, piano
      // finestre ad arco con le stelle
      for (const fx of [0.14, 0.5, 0.86]) {
        const wx = W * fx - 26, wy = H * 0.10;
        ctx.fillStyle = '#0d0a1d'; ctx.fillRect(wx, wy + 14, 52, 78);
        ctx.fillStyle = '#0d0a1d';
        for (let k = 0; k < 7; k++) ctx.fillRect(wx + 4 + k * 6, wy + 14 - Math.round(Math.sin((k / 6) * Math.PI) * 14), 6, 16);
        ctx.fillStyle = '#e8e0f0';
        for (let st = 0; st < 8; st++) ctx.fillRect(wx + 6 + ((st * 17) % 44), wy + 20 + ((st * 29) % 62), 2, 2);
        ctx.fillStyle = '#4a4258'; ctx.fillRect(wx - 4, wy + 90, 60, 6);
      }
      /* IL PIANTERRENO. Il testo di t2 lo descrive: «il pavimento del pianterreno pende
         talmente a sinistra che un tavolo intero si è incagliato contro il muro come una
         nave arenata. Contro lo stesso muro, tre candelabri, due tazze da tè e un gatto
         profondamente addormentato». Prima il quarto in basso a sinistra era muro vuoto —
         e la scala non poggiava su niente. */
      const floorY = H - 30;
      ctx.save();                                       // il tavolo arenato, di sbieco
      ctx.translate(W * 0.10, floorY - 30); ctx.rotate(0.15);
      blocks(ctx, -84, -14, 156, 15, '#5d4530', 10, r, 0.14);
      ctx.fillStyle = '#7a5c3d'; ctx.fillRect(-84, -17, 156, 4);
      ctx.fillStyle = '#4a3524'; ctx.fillRect(-68, 1, 14, 60); ctx.fillRect(48, 1, 14, 60);
      ctx.restore();
      // il pavimento si dipinge DOPO le gambe: così le taglia netto invece di lasciarle
      // spuntare sotto, che è il difetto di prima ma al rovescio
      // la fascia sfora sotto e ai lati: la pendenza la solleva a sinistra, e senza il
      // margine resterebbe una striscia di muro scoperta in fondo all'inquadratura
      blocks(ctx, -20, floorY, W + 40, H - floorY + 42, '#231d31', 12, r, 0.16);
      ctx.fillStyle = '#3a3350'; ctx.fillRect(-20, floorY, W + 40, 3);
      for (const [kx, kh] of [[26, 54], [62, 66], [98, 46]]) {   // tre candelabri
        const ky = floorY - 42 - kx * 0.15;
        ctx.fillStyle = '#8a7a45'; ctx.fillRect(kx - 11, ky, 24, 5);
        ctx.fillStyle = '#a89055'; ctx.fillRect(kx - 3, ky - kh, 7, kh);
        ctx.fillStyle = '#8a7a45'; ctx.fillRect(kx - 15, ky - kh + 8, 34, 5);
        for (const dx of [-14, 0, 14]) {
          ctx.fillStyle = '#e8e4dc'; ctx.fillRect(kx + dx, ky - kh - 12, 5, 13);
          glow(ctx, kx + dx + 2, ky - kh - 16, 30, 34, '232,182,76');
          flame(ctx, kx + dx + 2, ky - kh - 10, 7, 11, r, 2);
        }
      }
      for (const [cx2, cy2] of [[108, 280], [134, 284]]) {         // due tazze da tè
        ctx.fillStyle = '#e0dcd0'; ctx.fillRect(cx2, cy2, 15, 11);
        ctx.fillStyle = '#c0bcae'; ctx.fillRect(cx2 + 15, cy2 + 3, 4, 5);
        ctx.fillStyle = '#7a5a3a'; ctx.fillRect(cx2 + 2, cy2, 11, 3);
      }
      // il gatto, profondamente addormentato e del tutto imperturbabile
      const gtx = 176, gty = floorY - 2;
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(gtx - 4, gty - 5, 66, 6);
      blocks(ctx, gtx, gty - 22, 56, 22, '#4d4860', 6, r, 0.14);
      ctx.fillStyle = '#605a76'; ctx.fillRect(gtx + 4, gty - 26, 26, 6);
      ctx.fillStyle = '#4d4860'; ctx.fillRect(gtx + 44, gty - 34, 17, 14);   // testa
      ctx.fillRect(gtx + 45, gty - 39, 5, 6); ctx.fillRect(gtx + 55, gty - 39, 5, 6);
      ctx.fillStyle = '#37334a'; ctx.fillRect(gtx - 14, gty - 9, 18, 6);     // coda
      /* LA SCALA. Prima erano nove lastre con tre pixel di vuoto fra l'una e l'altra e
         nessuna alzata: nove rettangoli sfalsati restano nove rettangoli sfalsati. Ogni
         pedata adesso ha la sua ALZATA piena fino alla pedata di sotto, e sotto tutto
         corre il cosciale di pietra che regge la rampa: è il pieno che fa leggere «scala». */
      const NS = 8, sx0 = W * 0.25, sdx = W * 0.085, sy0 = floorY - 30, sdy = 20, sw = W * 0.13;
      for (let s = 0; s < NS; s++) {
        const gx = sx0 + s * sdx, gy = sy0 - s * sdy;
        blocks(ctx, gx, gy + 12, sw, sdy + 26, '#332d45', 9, r, 0.1);         // cosciale
        blocks(ctx, gx, gy + 12, sw * 0.58, sdy, '#3d3750', 9, r, 0.1);       // alzata
        blocks(ctx, gx, gy, sw, 12, '#57506e', 8, r, 0.12);                   // pedata
        ctx.fillStyle = '#6e6688'; ctx.fillRect(gx, gy, sw, 3);               // filo di luce
        ctx.fillStyle = '#1a1724'; ctx.fillRect(gx, gy + 12, sw, 3);          // ombra sotto il naso
      }
      // il pianerottolo in cima, con la porta: la scala deve portare da qualche parte
      const lx = sx0 + NS * sdx;
      blocks(ctx, lx - 12, sy0 - NS * sdy, W - lx + 12, 15, '#57506e', 8, r, 0.12);
      blocks(ctx, lx - 12, sy0 - NS * sdy + 15, W - lx + 12, 30, '#332d45', 9, r, 0.1);
      ctx.fillStyle = '#0d0a14'; ctx.fillRect(lx + 4, sy0 - NS * sdy - 74, 56, 74);
      blocks(ctx, lx - 2, sy0 - NS * sdy - 84, 68, 12, '#3d374f', 8, r, 0.1);
      // il corrimano di corda, che non si fida: parte DAL primo gradino, su paletti
      const postY = s => sy0 - s * sdy - 44;
      ctx.fillStyle = '#4a3f2a';
      for (let s = 0; s < NS; s += 2) ctx.fillRect(sx0 + s * sdx + 10, postY(s), 6, 44);
      ctx.strokeStyle = '#8a7a4a'; ctx.lineWidth = 4; ctx.beginPath();
      ctx.moveTo(sx0 + 13, postY(0));
      for (let s = 2; s < NS; s += 2) ctx.lineTo(sx0 + s * sdx + 13, postY(s) + 4);
      ctx.lineTo(lx, postY(NS - 1) - 6);
      ctx.stroke();
      // pile di libri e pergamene sui gradini
      for (const [s, n] of [[1, 3], [4, 2], [6, 4]]) {
        for (let k = 0; k < n; k++) {
          ctx.fillStyle = ['#7a2432', '#3d5a80', '#8a6a2d', '#3d8a80'][k % 4];
          ctx.fillRect(sx0 + s * sdx + 40 + (r() * 6 - 3), sy0 - s * sdy - 7 - k * 7, 40, 7);
        }
      }
      // candele nelle nicchie della parete, sopra la rampa
      for (const [fx, s] of [[0.30, 1], [0.62, 4]]) {
        const ny = sy0 - s * sdy - 62;
        blocks(ctx, W * fx - 20, ny - 12, 40, 50, '#221c30', 8, r, 0.12);
        ctx.fillStyle = '#171320'; ctx.fillRect(W * fx - 15, ny - 8, 30, 42);
        glow(ctx, W * fx, ny + 16, 74, 74, '232,182,76');
        ctx.fillStyle = '#e8e4dc'; ctx.fillRect(W * fx - 4, ny + 16, 8, 18);
        flame(ctx, W * fx, ny + 17, 9, 14, r, 2);
      }
      // un astrolabio d\'ottone appeso
      ctx.strokeStyle = '#c8a032'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(W * 0.55, H * 0.28, 16, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(W * 0.55, H * 0.28, 10, 0.5, Math.PI * 2 + 0.5); ctx.stroke();
      ctx.fillStyle = '#c8a032'; ctx.fillRect(W * 0.55 - 1, H * 0.28 - 22, 2, 8);
      ctx.restore();
      // polvere di gesso che cade dalla pendenza (fuori trasformazione: cade DRITTA)
      ctx.fillStyle = 'rgba(220,215,230,.25)';
      for (let k = 0; k < 8; k++) ctx.fillRect(30 + ((k * 127) % (W - 60)), (k * 61) % H, 2, 2);
    },

    torrePendente(ctx, W, H) {
      const r = rng(157);
      skyGradient(ctx, W, H, '#0d0a1f', '#2e1f42', 10);
      stars(ctx, W, H, r, 55);
      moon(ctx, W * 0.16, 54, 24, '#c8b8e8', true);
      const g = H - 64;
      hills(ctx, W, g + 2, 44, '#1a1428', r, 32);
      // la torre pende: ogni piano è spostato di lato rispetto al precedente
      const base = W * 0.42, piani = 5, ph = 42, pw = 104;   // 5 piani: il telescopio in cima resta nell'inquadratura
      for (let i = 0; i < piani; i++) {
        const off = i * 13;                                  // la pendenza
        const x = base + off, y = g - (i + 1) * ph;
        blocks(ctx, x, y, pw, ph, i % 2 ? '#5a5468' : '#4d4860', 10, r, 0.14);
        blocks(ctx, x - 6, y, pw + 12, 8, '#6a6478', 8, r, 0.1);  // cornicione
        // finestre illuminate, storte anche loro
        glow(ctx, x + 43, y + 29, 54, 48, '245,197,66');
        ctx.fillStyle = '#f5c542'; ctx.fillRect(x + 34, y + 20, 18, 18);
        ctx.fillStyle = '#4d4860'; ctx.fillRect(x + 42, y + 20, 3, 18);
      }
      // terrazza col telescopio in cima
      const tx = base + piani * 13, ty = g - piani * ph;
      blocks(ctx, tx - 12, ty - 14, pw + 24, 16, '#6a6478', 8, r, 0.1);
      for (let i = 0; i < 5; i++) blocks(ctx, tx - 8 + i * 26, ty - 26, 14, 14, '#5a5468', 7, r, 0.1);
      // il telescopio puntato di sbieco
      ctx.strokeStyle = '#8a8a96'; ctx.lineWidth = 9;
      ctx.beginPath(); ctx.moveTo(tx + 40, ty - 24); ctx.lineTo(tx + 96, ty - 66); ctx.stroke();
      ctx.fillStyle = '#c8ccd8'; ctx.fillRect(tx + 90, ty - 74, 16, 14);
      ctx.fillStyle = '#3a3a45'; ctx.fillRect(tx + 30, ty - 26, 22, 10);
      // gatti sui davanzali (due puntini con le orecchie)
      for (const [cx, cy] of [[base + 20, g - ph + 6], [base + 3 * 13 + 84, g - 3 * ph + 6]]) {
        ctx.fillStyle = '#2a2a35'; ctx.fillRect(cx, cy - 10, 16, 10);
        ctx.fillRect(cx + 1, cy - 15, 4, 6); ctx.fillRect(cx + 11, cy - 15, 4, 6);
        ctx.fillStyle = '#e8d84a'; ctx.fillRect(cx + 3, cy - 8, 3, 3); ctx.fillRect(cx + 10, cy - 8, 3, 3);
      }
      ground(ctx, W, H, g, '#26402a', r, 12, 10);
      // roba rotolata giù dalla torre, ammucchiata a valle della pendenza
      for (let i = 0; i < 7; i++) {
        const ox = base - 60 + r() * 50;
        ctx.fillStyle = ['#8a6a45', '#5a5a66', '#7a3025'][i % 3];
        ctx.fillRect(ox, g - 6 - (i % 3) * 6, 12 + r() * 10, 8);
      }
      bush(ctx, W * 0.14, g + 6, 24, '#2a4a2e', r);
    },

    /* Qui c'era salaTrono(): una sala scura viola con quattro colonne e un tappeto rosso,
       disegnata solo con blocks() e seme 61, cioe nello stile piu vecchio e piu semplice di
       tutti gli altri fondali di questo gioco. NESSUNA SCENA la usava — l'ha trovata il
       controllo nuovo sui fondali senza scheda, che elenca i painter che nessuna scena
       mette in scena.
       Tolta invece di collegata, e per una ragione: nel castello tutte le strade del ballo
       confluiscono al maggiordomo, non c'e un momento da sala del trono, e inventarne uno
       per giustificare un fondale avanzato avrebbe aggiunto un corridoio — cioe una scena
       di passaggio che non fa niente, che questo progetto vieta. La regola del progetto e
       la stessa per le risorse e per i fondali: se una cosa non fa niente, si rende vera o
       si toglie. Il codice sta in git, se un giorno servisse una sala del trono vera. */

    cripta(ctx, W, H) {
      /* LE CANTINE DEL CASTELLO, undici scene — e il fondale le disegnava come
         una CRIPTA SEPOLCRALE: tre nicchie ad arco identiche a distanza uguale,
         quattro candele identiche a distanza uguale, due sarcofagi con la croce
         d'oro. Il testo dice un'altra cosa:
           «Emergete tra le CANTINE del castello: volte di pietra, BOTTI
            GIGANTESCHE etichettate con annate tipo "1650 — annata malinconica"
            e "1806 — retrogusto di rimpianto", e RAGNATELE COME TENDE DA
            SALOTTO. Da una scala in fondo filtrano musica e luce.»
         E qui vive GERBOLD, lo scheletro maggiordomo, che sta lucidando il
         CUCCHIAINO 4.712 di un mucchio di argenteria, in livrea stirata.
         Una cripta con i sarcofagi e una cantina con le botti non sono la
         stessa stanza, e undici scene si svolgono nella seconda. */
      const r = rng(71);
      const floorY = H - 62;
      blocks(ctx, 0, 0, W, floorY, '#2b2436', 16, r, 0.18);
      /* LE VOLTE DI PIETRA: tre archi a tutto sesto, con i conci in chiave. Non
         sono nicchie: sono le campate del soffitto, quindi cominciano in alto e
         il loro intradosso e' un semicerchio. */
      for (const fx of [0.17, 0.5, 0.83]) {
        const cx2 = W * fx, R = 118;
        for (let a = 0; a <= 180; a += 2) {
          const rad = a * Math.PI / 180;
          const xx = cx2 - Math.cos(rad) * R, yy = 126 - Math.sin(rad) * R * 0.62;
          if (yy < 0) continue;
          ctx.fillStyle = (a / 12 | 0) % 2 ? '#3a3348' : '#443c56';   // i conci alternati
          ctx.fillRect(xx - 7, yy, 15, 15);
          ctx.fillStyle = 'rgba(160,150,190,.10)'; ctx.fillRect(xx - 7, yy, 15, 3);
        }
        ctx.fillStyle = '#1d1928';                                     // il vano dietro l'arco
        for (let a = 6; a <= 174; a += 2) {
          const rad = a * Math.PI / 180;
          const xx = cx2 - Math.cos(rad) * (R - 12), yy = 126 - Math.sin(rad) * (R - 12) * 0.62;
          ctx.fillRect(xx - 6, yy + 8, 13, 126 - yy + 8);
        }
        ctx.fillStyle = '#4e4560';                                     // i piedritti
        ctx.fillRect(cx2 - R - 6, 126, 16, floorY - 126);
        ctx.fillRect(cx2 + R - 10, 126, 16, floorY - 126);
      }
      blocks(ctx, 0, floorY, W, H - floorY, '#221d2e', 14, r, 0.14);
      ctx.fillStyle = 'rgba(8,6,12,.5)'; ctx.fillRect(0, floorY, W, 4);
      ctx.fillStyle = 'rgba(20,16,28,.30)';
      for (let y = floorY + 8, passo = 7; y < H; passo *= 1.5, y += passo) ctx.fillRect(0, y, W, 2);

      /* LE BOTTI GIGANTESCHE, di taglie diverse, con i cerchi di ferro, le
         doghe e L'ETICHETTA con l'annata — che e' la battuta della stanza. Una
         botte grande da cantina e' alta un metro e ottanta: a 120 px/m fa 216. */
      const botte = (bx, by, bw, bh, col) => {
        for (let x = 0; x < bw; x++) {
          const u = x / bw - 0.5;
          // il ventre: a 0,12 la botte si stringeva solo del 6% ai lati, cioe'
          // era un cilindro. Una botte ha il ventre, ed e' il ventre che la fa
          // riconoscere di profilo.
          const cu = Math.round(bh * 0.5 * (1 - Math.pow(Math.abs(u) * 2, 2.2) * 0.16));
          const yy = by + bh / 2 - cu;
          ctx.fillStyle = mix(col, shade(col, 0.62), Math.abs(u) * 1.5);
          ctx.fillRect(bx + x, yy, 1, cu * 2);
          if (x % 13 === 0) { ctx.fillStyle = 'rgba(14,10,6,.40)'; ctx.fillRect(bx + x, yy, 2, cu * 2); }  // le doghe
        }
        ctx.fillStyle = '#3e3a44';                                      // i cerchi di ferro
        for (const q of [0.14, 0.40, 0.60, 0.86]) {
          const yy = by + bh * q;
          ctx.fillRect(bx + 2, yy, bw - 4, 7);
          ctx.fillStyle = 'rgba(180,178,196,.14)'; ctx.fillRect(bx + 2, yy, bw - 4, 2);
          ctx.fillStyle = '#3e3a44';
        }
        ctx.fillStyle = '#241a10'; pixelDisc(ctx, bx + bw * 0.5, by + bh * 0.5, 11, 3);   // il cocchiume
        ctx.fillStyle = '#5a4632'; pixelDisc(ctx, bx + bw * 0.5, by + bh * 0.5, 6, 2);
        // L'ETICHETTA con l'annata, inchiodata di sbieco
        ctx.save(); ctx.translate(bx + bw * 0.22, by + bh * 0.24); ctx.rotate(-0.07);
        ctx.fillStyle = '#d8cfae'; ctx.fillRect(0, 0, 54, 26);
        ctx.fillStyle = '#b8ad8a'; ctx.fillRect(0, 0, 54, 3);
        ctx.fillStyle = 'rgba(50,38,22,.72)';
        ctx.fillRect(6, 6, 40, 4);                                     // l'annata, in grande
        for (let q = 0; q < 3; q++) ctx.fillRect(6, 14 + q * 4, 30 - q * 6, 2);
        ctx.restore();
        ctx.fillStyle = 'rgba(8,6,10,.44)'; ctx.fillRect(bx - 4, by + bh - 5, bw + 8, 8);
      };
      botte(W * 0.035, floorY - 178, 148, 178, '#5a4028');
      botte(W * 0.205, floorY - 152, 124, 152, '#4e3822');
      botte(W * 0.665, floorY - 190, 158, 190, '#5f4429');
      botte(W * 0.845, floorY - 140, 116, 140, '#4a3420');

      /* LA SCALA IN FONDO, da cui «filtrano musica e luce»: e' l'unica cosa
         chiara del quadro, e sta in mezzo, fra le botti. */
      {
        const sx = W * 0.435, sw = 132;
        ctx.fillStyle = '#1a1624'; ctx.fillRect(sx - 8, 118, sw + 16, floorY - 118);
        for (let k = 0; k < 11; k++) {                                 // i gradini
          const yy = floorY - 6 - k * 15, larg = sw - k * 6;
          ctx.fillStyle = mix('#4e4560', '#6e6484', k / 10);
          ctx.fillRect(sx + (sw - larg) / 2, yy, larg, 8);
          ctx.fillStyle = `rgba(255,232,180,${(0.05 + k * 0.022).toFixed(3)})`;
          ctx.fillRect(sx + (sw - larg) / 2, yy, larg, 3);
        }
        glow(ctx, sx + sw / 2, 132, 44, 30, '255,224,160');
        ctx.fillStyle = 'rgba(255,226,168,.16)'; ctx.fillRect(sx + 22, 118, sw - 44, 26);
      }

      /* IL TAVOLO DI GERBOLD, con IL MUCCHIO DI ARGENTERIA e il cucchiaino
         4.712: un mucchio, non cinque cosini in fila, e uno solo tirato fuori
         dal mucchio e messo sul panno. */
      {
        const tx = W * 0.40, ty = floorY - 46, tw = 196;
        ctx.fillStyle = 'rgba(8,6,10,.44)'; ctx.fillRect(tx - 6, floorY - 6, tw + 12, 8);
        blocks(ctx, tx, ty, tw, 12, '#4a352a', 6, r, 0.10);
        ctx.fillStyle = '#5c4335'; ctx.fillRect(tx, ty, tw, 3);
        ctx.fillStyle = '#2e2118'; ctx.fillRect(tx + 10, ty + 12, 11, 34); ctx.fillRect(tx + tw - 21, ty + 12, 11, 34);
        // il mucchio: cucchiai accatastati alla rinfusa, che luccicano
        for (let k = 0; k < 46; k++) {
          const ax = tx + 96 + (r() * 88 | 0), ay = ty - 4 - (r() * 22 | 0);
          const ang = (r() - 0.5) * 2;
          ctx.save(); ctx.translate(ax, ay); ctx.rotate(ang);
          ctx.fillStyle = ['#8e94a4', '#a8aebc', '#787e8c'][k % 3];
          ctx.fillRect(0, 0, 16, 3);
          ctx.fillStyle = '#c2c8d4'; pixelDisc(ctx, 0, 1, 3, 2);
          ctx.restore();
        }
        // il panno, e IL cucchiaino: quello che sta lucidando adesso
        ctx.fillStyle = '#6a2a34'; ctx.fillRect(tx + 20, ty - 3, 58, 8);
        ctx.fillStyle = '#e8eef8'; ctx.fillRect(tx + 30, ty - 6, 22, 4);
        ctx.fillStyle = '#ffffff'; pixelDisc(ctx, tx + 30, ty - 4, 4, 2);
        glow(ctx, tx + 34, ty - 4, 16, 6, '232,238,248');
      }

      /* LE RAGNATELE COME TENDE DA SALOTTO: non due fili in un angolo — dei
         drappi, che pendono dalle volte con l'orlo che ricade. */
      for (const [tx2, tw2, prof] of [[W * 0.055, 150, 66], [W * 0.395, 176, 52], [W * 0.775, 164, 74]]) {
        for (let x = 0; x < tw2; x += 3) {
          const u = x / tw2;
          const cade = prof * Math.sin(u * Math.PI) + 8;
          ctx.fillStyle = 'rgba(214,214,232,.10)';
          ctx.fillRect(tx2 + x, 2, 3, cade);
          ctx.fillStyle = 'rgba(228,228,244,.16)';
          ctx.fillRect(tx2 + x, 2 + cade - 3, 3, 3);          // l'orlo, che si vede
        }
        ctx.fillStyle = 'rgba(228,228,244,.13)';              // i fili radiali
        for (let q = 0; q < 5; q++) ctx.fillRect(tx2 + q * (tw2 / 5), 2, 2, prof * 0.8);
      }
    },

    ballo(ctx, W, H) {
      const r = rng(83);
      blocks(ctx, 0, 0, W, H, '#2a1d33', 16, r, 0.15);
      for (const fx of [0.18, 0.5, 0.82]) {
        const vx = W * fx - 34;
        ctx.fillStyle = '#1a1226'; ctx.fillRect(vx - 6, 26, 80, 120);
        const cols = ['#8a35b8', '#e84a5a', '#3a6ab8', '#c85ae0'];
        for (let row = 0; row < 4; row++) for (let col = 0; col < 2; col++) {
          ctx.fillStyle = cols[(row + col) % cols.length];
          ctx.fillRect(vx + col * 34, 32 + row * 28, 30, 24);
        }
        ctx.fillStyle = '#1a1226'; ctx.fillRect(vx - 6, 18, 80, 10);
      }
      blocks(ctx, 0, H - 60, W, 60, '#3d2a1d', 12, r, 0.12);
      ctx.fillStyle = 'rgba(245,197,66,.06)';
      for (let i = 0; i < 8; i++) ctx.fillRect(r() * W, H - 56 + r() * 40, 40 + r() * 60, 4);
      ctx.fillStyle = '#c8a032';
      ctx.fillRect(W * 0.5 - 4, 0, 8, 34);
      ctx.fillRect(W * 0.5 - 90, 34, 180, 10);
      ctx.fillRect(W * 0.5 - 60, 54, 120, 8);
      for (const [dx, y] of [[-90, 34], [-56, 34], [-20, 34], [16, 34], [52, 34], [82, 34], [-60, 54], [-28, 54], [4, 54], [36, 54], [52, 54]]) {
        ctx.fillStyle = '#f0f0e8'; ctx.fillRect(W * 0.5 + dx, y - 12, 7, 12);
        ctx.fillStyle = '#f5e042'; ctx.fillRect(W * 0.5 + dx - 2, y - 20, 11, 10);
      }
      // il lampadario faceva 220×90 di rettangolo giallastro appeso al muro: dietro le
      // dodici candele si vedeva la CORNICE, non la luce. Adesso è un alone a ellissi.
      glow(ctx, W * 0.5, 40, 88, 50, '245,224,66');   // 320 = 1280 px di alone: piu' del canvas
      blocks(ctx, 0, 0, 50, H - 60, '#5a1525', 10, r, 0.15);
      blocks(ctx, W - 50, 0, 50, H - 60, '#5a1525', 10, r, 0.15);
      ctx.fillStyle = '#f5c542'; ctx.fillRect(0, H * 0.4, 50, 6); ctx.fillRect(W - 50, H * 0.4, 50, 6);
      blocks(ctx, W * 0.66, H - 130, 240, 16, '#5d4530', 10, r, 0.12);
      ctx.fillStyle = '#4a3524'; ctx.fillRect(W * 0.68, H - 114, 12, 54); ctx.fillRect(W * 0.88, H - 114, 12, 54);
      ctx.fillStyle = '#e84a5a'; ctx.fillRect(W * 0.69, H - 146, 22, 16);
      ctx.fillStyle = '#f5c542'; ctx.fillRect(W * 0.75, H - 142, 30, 12);
      ctx.fillStyle = '#c85ae0'; ctx.fillRect(W * 0.83, H - 144, 18, 14);
      const guestCols = ['#241a30', '#1d1428', '#2e1a26', '#1a2030'];
      const maskCols = ['#f0e8d8', '#f5c542', '#c85ae0', '#5a9de0', '#e84a5a'];
      for (let i = 0; i < 4; i++) {
        const x = W * 0.09 + i * W * 0.14, hgt = 74 + r() * 16;
        for (const [off, lean] of [[0, 3], [30, -3]]) {
          ctx.fillStyle = guestCols[Math.floor(r() * guestCols.length)];
          ctx.fillRect(x + off + lean, H - 60 - hgt, 24, hgt);
          ctx.fillRect(x + off + lean + 4, H - 60 - hgt - 14, 16, 16);
          ctx.fillStyle = maskCols[Math.floor(r() * maskCols.length)];
          ctx.fillRect(x + off + lean + 6, H - 60 - hgt - 10, 12, 7);
        }
        ctx.fillStyle = '#d8c8b8'; ctx.fillRect(x + 24, H - 60 - hgt + 18, 8, 5);
      }
    },

    vetta(ctx, W, H) {
      const r = rng(97);
      skyGradient(ctx, W, H, '#0d0a1f', '#4a1540', 12);
      stars(ctx, W, H, r, 70);
      // l'eclissi sta di LATO: al centro c'è la corona, e i due dischi sovrapposti
      // facevano una cucitura fra il cerchio e la scatola dell'alone
      moon(ctx, W * 0.20, H * 0.26, 38, '#e8e0f0', true);
      ctx.fillStyle = 'rgba(232,74,90,.12)';
      ctx.fillRect(0, 0, W, H);
      const g = H - 40;
      // nuvole basse per dare l'altezza
      ctx.fillStyle = 'rgba(60,30,70,.5)';
      for (let i = 0; i < 6; i++) ctx.fillRect(r() * W, g - 40 + r() * 30, 60 + r() * 90, 8);
      blocks(ctx, W * 0.18, g - 30, W * 0.64, 70, '#2e2a3d', 12, r, 0.15);
      for (let x = W * 0.18; x < W * 0.82; x += 40) blocks(ctx, x, g - 48, 22, 18, '#2e2a3d', 8, r, 0.15);
      // l'altare di ossidiana, largo e basso: è un piedistallo, non un piedino
      blocks(ctx, W * 0.40, g - 74, W * 0.20, 46, '#161620', 8, r, 0.12);
      blocks(ctx, W * 0.375, g - 86, W * 0.25, 14, '#22222e', 8, r, 0.1);
      ctx.fillStyle = '#3a3a4a'; ctx.fillRect(W * 0.375, g - 86, W * 0.25, 3);
      // LA CORONA: sospesa a mezz'aria sopra l'altare, 230 px — il soggetto della scena
      crown(ctx, W * 0.5, g - 106, 230, r);
    },

    fiume(ctx, W, H) {
      /* IL FIUME, ventun scene, e il testo chiede tre cose che il quadro non
         dava:
           «Sopra di voi, un salice ENORME — la corteccia rugosa come pelle
            antica — allunga UN RAMO come per stringervi la mano.»
         C'erano QUATTRO salici identici, alti novanta pixel, a distanza uguale:
         non un salice enorme, ma una siepe. E un albero che parla e allunga la
         mano deve essere il soggetto, non uno di quattro cloni.
           «Porto il cielo capovolto sulla schiena — è l'ACQUA che riflette il
            cielo capovolto.»
         È la risposta dell'indovinello del Salice, ed è la ragione per cui quel
         fiume esiste: l'acqua era un campo blu piatto senza un riflesso.
           «un molo di legno marcio che sembra tenersi in piedi per pura
            cocciutaggine», e il BARCONE di Bertoldo, col cappello sul sedile.
         Il molo era una barra orizzontale con tre pali, il barcone una zattera
         da 168 px, e il cappello — che è il modo in cui Bertoldo si rivela —
         non c'era. */
      const r = rng(113);
      const acquaY = Math.round(H * 0.46);
      skyGradient(ctx, W, acquaY, '#0a0d18', '#1a2a3d', 10);
      stars(ctx, W, acquaY - 8, r, 44);
      moon(ctx, W * 0.78, 48, 24, '#c8b8e8', true);
      hills(ctx, W, acquaY - 12, 44, '#101d16', r, 30);
      // la riva di là, col profilo irregolare
      for (let x = 0; x < W; x += 14) {
        const off = Math.round((r() - 0.5) * 2) * 5;
        blocks(ctx, x, acquaY - 20 + off, 14, 26, '#14261c', 10, r, 0.2);
      }

      /* L'ACQUA come PIANO ORIZZONTALE: le rughe si allargano venendo avanti, e
         dentro ci sta il cielo capovolto — la luna eclissata riflessa, spezzata
         in bande, e le sagome degli alberi allungate verso di noi. */
      /* L'ACQUA PORTA IL CIELO CAPOVOLTO, e quindi vicino all'orizzonte è più
         CHIARA del cielo, non più scura. Era #0f2438 (luminanza 31) sotto un
         cielo che all'orizzonte fa 40: un fiume più scuro del cielo che
         riflette è la negazione dell'indovinello su cui questa scena è
         costruita. In lontananza l'acqua è specchio (prende il cielo), venendo
         avanti diventa vetro (si vede il fondo, che è nero). */
      for (let y = acquaY; y < H; y++) {
        const t = (y - acquaY) / (H - acquaY);
        blocks(ctx, 0, y, W, 1, mix('#24374e', '#0b1826', Math.pow(t, 0.7)), 14, r, 0.16);
      }
      for (let y = acquaY, passo = 3; y < H; passo *= 1.36, y += passo) {
        ctx.fillStyle = `rgba(120,164,214,${(0.05 + (y - acquaY) / (H - acquaY) * 0.05).toFixed(3)})`;
        ctx.fillRect(0, y, W, Math.max(1, passo * 0.4 | 0));
      }
      // IL CIELO CAPOVOLTO: il riflesso della luna, spezzato dalle rughe
      {
        const mx = W * 0.78;
        for (let k = 0; k < 46; k++) {
          const t = k / 45;
          const yy = acquaY + 4 + k * (1 + t * 3.4);
          if (yy > H) break;
          const larg = 30 + t * 46, sfa = (r() - 0.5) * (10 + t * 26);
          ctx.fillStyle = `rgba(190,172,224,${(0.26 * (1 - t * 0.86)).toFixed(3)})`;
          ctx.fillRect(mx - larg / 2 + sfa, yy, larg, Math.max(1, 2 + t * 3 | 0));
        }
      }

      /* IL SALICE, uno, ENORME: il tronco esce dal bordo alto, la corteccia è
         rugosa a solchi verticali, le radici artigliano la riva, e IL RAMO che
         «allunga come per stringervi la mano» arriva fino al centro del quadro
         con le fronde che pendono. */
      {
        const tx = W * 0.145, base = acquaY + 12;
        /* L'ORDINE conta: la chioma va DIETRO il tronco. Al primo tentativo il
           tronco era disegnato prima e le duecento macchie di fogliame gli
           passavano sopra: quello che si vedeva era una massa di corteccia fra
           le foglie, cioè una zolla di radici appesa in aria, non un albero. */
        /* LA CHIOMA È CONTROLUCE. Prima le foglie erano #1d3a2a e #24452f —
           luminanza 47 e 57 — su un cielo notturno che va da 13 a 38: cioè
           foglie PIÙ CHIARE del cielo, illuminate da niente, in una scena la
           cui unica luce è una luna eclissata. Una chioma davanti a un cielo
           notturno è una SAGOMA più scura del cielo, e prende la luna solo sul
           bordo dalla parte da cui viene — qui in alto a destra. Così la
           sagoma dell'albero esiste, invece di sfumare nel cielo. */
        for (let q = 0; q < 210; q++) {
          const ax = tx - 130 + (r() * 300 | 0), ay = -14 + (r() * 128 | 0);
          const w2 = 14 + (r() * 12 | 0), h2 = 9 + (r() * 7 | 0);
          ctx.fillStyle = ['#0c1a12', '#08150e', '#101f16'][q % 3];
          ctx.fillRect(ax, ay, w2, h2);
          // il filo di luna, sulle foglie esposte in alto a destra
          const versoLuna = (ax - (tx - 130)) / 300 * 0.6 + (1 - (ay + 14) / 128) * 0.4;
          if (versoLuna > 0.62) {
            ctx.fillStyle = `rgba(176,164,208,${(0.10 + (versoLuna - 0.62) * 0.26).toFixed(3)})`;
            ctx.fillRect(ax, ay, w2, 2);
            ctx.fillRect(ax + w2 - 2, ay, 2, h2);
          }
        }
        // IL TRONCO: 74 px alla base, che si stringe salendo e entra nella chioma
        for (let y = base; y > -6; y -= 1) {
          const t = (base - y) / (base + 6);
          const sp = Math.round(74 - t * 24);
          const cx2 = tx + Math.sin(t * 1.4) * 14;
          ctx.fillStyle = mix('#3a2a1a', '#2a1e12', t * 0.5);
          ctx.fillRect(cx2 - sp / 2, y, sp, 1);
          ctx.fillStyle = 'rgba(120,100,68,.20)'; ctx.fillRect(cx2 - sp / 2, y, 4, 1);   // il fianco in luce
          /* LA CORTECCIA. L'offset del solco dipendeva da y (`q*17 + y*3`),
             quindi ogni solco andava in DIAGONALE e i cinque insieme facevano
             un reticolo: sullo schermo veniva un CESTO INTRECCIATO. Un solco di
             corteccia è VERTICALE, e la sua x non cambia salendo. */
          for (let q = 0; q < 7; q++) {
            const ox = (q - 3) * 11 + ((q * 7) % 5) - 2;
            if (Math.abs(ox) > sp / 2 - 2) continue;
            const scuro = q % 3 !== 1;
            ctx.fillStyle = scuro ? 'rgba(14,10,6,.40)' : 'rgba(132,110,76,.13)';
            ctx.fillRect(cx2 + ox, y, scuro ? 3 : 2, 1);
          }
        }
        // le radici, che artigliano la riva
        ctx.fillStyle = '#2e2115';
        for (const [dx, dl] of [[-64, 30], [-38, 22], [34, 26], [62, 34], [-14, 16], [16, 18]]) {
          for (let k = 0; k < dl; k++) ctx.fillRect(tx + dx * (1 + k / dl * 0.5), base + k * 0.5, 9, 5);
        }
        /* IL RAMO CHE ALLUNGA LA MANO: dal tronco verso il centro, in leggera
           discesa, con quattro dita di rametto in punta — è quello il gesto. */
        const rl = 300;
        for (let k = 0; k < rl; k++) {
          const t = k / rl;
          const xx = tx + 30 + k, yy = 96 + Math.sin(t * 1.5) * 26 + t * t * 40;
          const sp = Math.round(17 - t * 11);
          ctx.fillStyle = mix('#3a2a1a', '#2e2115', t);
          ctx.fillRect(xx, yy, 2, sp);
          ctx.fillStyle = 'rgba(120,100,68,.18)'; ctx.fillRect(xx, yy, 2, 3);
          if (k % 24 === 0 && t > 0.2) {                      // le fronde che pendono dal ramo
            const lun = 30 + (r() * 54 | 0);
            for (let q = 0; q < lun; q++) {
              ctx.fillStyle = q % 7 < 4 ? '#12241a' : '#0d1c13';
              ctx.fillRect(xx + Math.sin(q * 0.18) * 3, yy + sp + q, 3, 2);
            }
          }
        }
        for (let q = 0; q < 4; q++) {                          // le quattro dita in punta
          const fx2 = tx + 30 + rl, fy2 = 96 + Math.sin(1.5) * 26 + 40;
          for (let k = 0; k < 26; k++) {
            ctx.fillStyle = '#2e2115';
            ctx.fillRect(fx2 + k, fy2 - 10 + q * 7 + k * (0.28 + q * 0.20), 3, 3);
          }
        }
        // e le fronde lunghe del salice, che è quello che lo fa salice: davanti
        // alla chioma e ai lati del tronco, non sopra
        for (let q = 0; q < 30; q++) {
          const ax = tx - 122 + q * 9;
          if (Math.abs(ax - tx) < 26) continue;                // non davanti al tronco
          const lun = 60 + (r() * 130 | 0);
          for (let k = 0; k < lun; k++) {
            ctx.fillStyle = k % 9 < 5 ? '#14271b' : '#0e1e14';
            ctx.fillRect(ax + Math.sin(k * 0.09 + q) * 5, 100 + k, 3, 2);
          }
        }
        // il riflesso del salice nell'acqua: una macchia allungata verso di noi
        for (let y = acquaY; y < H; y += 2) {
          const t = (y - acquaY) / (H - acquaY);
          ctx.fillStyle = `rgba(18,44,30,${(0.30 * (1 - t * 0.8)).toFixed(3)})`;
          ctx.fillRect(tx - 90 - t * 60, y, 210 + t * 150, 2);
        }
      }

      /* IL MOLO DI LEGNO MARCIO, in scorcio: le tavole convergono, i pali si
         accorciano andando in là, e una tavola manca (è marcio: si tiene in
         piedi per pura cocciutaggine). */
      {
        const m0 = 0, m1 = W * 0.40, y0 = H - 26, y1 = acquaY + 26;
        for (let k = 0; k < 40; k++) {
          const t = k / 39;
          const xx = m0 + (m1 - m0) * t, yy = y0 + (y1 - y0) * t;
          const larg = Math.round(70 - t * 46);
          if (k === 21 || k === 22) continue;                  // la tavola che manca
          /* E IL TAVOLATO VA DI TRAVERSO. Al primo tentativo il piano era una
             fascia unica che si stringe: leggeva come una RAMPA. Un molo si
             riconosce dalle tavole trasversali — e sono anche loro un piano
             orizzontale, quindi si allargano venendo avanti, che qui viene da
             sé perché ogni passo di k è una tavola. */
          const passo = Math.ceil((m1 - m0) / 39) + 1;
          ctx.fillStyle = mix('#5a4530', '#3e3020', t);
          ctx.fillRect(xx, yy, passo, larg);
          ctx.fillStyle = `rgba(150,124,88,${(0.16 * (1 - t)).toFixed(3)})`;
          ctx.fillRect(xx, yy, passo, 2);
          ctx.fillStyle = `rgba(12,8,4,${(0.34 * (1 - t * 0.5)).toFixed(3)})`;
          ctx.fillRect(xx, yy, 1, larg);                      // la fuga fra due tavole
          ctx.fillStyle = `rgba(20,14,8,${(0.40 * (1 - t * 0.4)).toFixed(3)})`;
          ctx.fillRect(xx, yy + larg - 3, passo, 3);          // e il bordo di sotto, in ombra
        }
        for (const t of [0.12, 0.44, 0.78]) {                   // i pali, sempre più corti
          const xx = m0 + (m1 - m0) * t, yy = y0 + (y1 - y0) * t;
          const sp = Math.round(13 - t * 7), lun = Math.round(64 - t * 40);
          ctx.fillStyle = '#3a2c1c'; ctx.fillRect(xx, yy + Math.round(70 - t * 46) - 4, sp, lun);
          ctx.fillStyle = 'rgba(10,20,30,.34)';
          ctx.fillRect(xx, yy + Math.round(70 - t * 46) + lun - 8, sp + 4, 6);
        }
      }

      /* IL BARCONE di Bertoldo: un barcone, non una zattera — 300 px, con la
         prua alzata, la falchetta, il SEDILE e IL CAPPELLO sopra, il palo da
         barcaiolo appoggiato, e la lanterna. */
      {
        const bx = W * 0.44, by = H - 82;
        // il riflesso, prima della barca
        ctx.fillStyle = 'rgba(8,16,26,.44)'; ctx.fillRect(bx - 6, by + 40, 316, 22);
        blocks(ctx, bx, by, 300, 40, '#3a2a18', 8, r, 0.12);            // lo scafo
        blocks(ctx, bx + 6, by - 12, 288, 14, '#4a3524', 8, r, 0.10);   // la falchetta
        ctx.fillStyle = '#5c4530'; ctx.fillRect(bx + 6, by - 12, 288, 3);
        ctx.fillStyle = '#2e2114';                                      // le ordinate, dentro
        for (let k = 0; k < 6; k++) ctx.fillRect(bx + 26 + k * 46, by + 2, 6, 24);
        ctx.fillStyle = '#3a2a18';                                      // la prua alzata
        for (let k = 0; k < 40; k++) ctx.fillRect(bx + 300 + k, by - Math.round(k * 0.42), 1, 40 + Math.round(k * 0.42));
        ctx.fillStyle = '#4a3524'; for (let k = 0; k < 40; k++) ctx.fillRect(bx + 300 + k, by - Math.round(k * 0.42) - 12, 1, 14);
        // IL SEDILE e IL CAPPELLO che si solleva da solo
        ctx.fillStyle = '#54402c'; ctx.fillRect(bx + 96, by - 22, 84, 11);
        ctx.fillStyle = '#66503a'; ctx.fillRect(bx + 96, by - 22, 84, 3);
        ctx.fillStyle = '#22252e'; ctx.fillRect(bx + 108, by - 30, 58, 8);          // la tesa
        ctx.fillStyle = '#2c303a'; ctx.fillRect(bx + 120, by - 44, 34, 15);         // la cupola
        ctx.fillStyle = '#171a21'; ctx.fillRect(bx + 120, by - 33, 34, 4);          // il nastro
        ctx.fillStyle = 'rgba(150,160,180,.14)'; ctx.fillRect(bx + 120, by - 44, 34, 2);
        // IL PALO DA BARCAIOLO, appoggiato alla falchetta
        ctx.fillStyle = '#5a4530';
        for (let k = 0; k < 210; k++) ctx.fillRect(bx + 190 + k * 0.5, by - 8 - k * 0.72, 5, 2);
        // la lanterna, a prua
        ctx.fillStyle = '#2a1d10'; ctx.fillRect(bx + 250, by - 62, 7, 42);
        glow(ctx, bx + 253, by - 66, 22, 20, '245,197,66');
        ctx.fillStyle = '#f5c542'; ctx.fillRect(bx + 246, by - 74, 17, 14);
        ctx.fillStyle = '#fff0b0'; ctx.fillRect(bx + 249, by - 71, 9, 7);
        // e il suo riflesso, che trema
        for (let k = 0; k < 26; k++) {
          const t = k / 25;
          ctx.fillStyle = `rgba(245,197,66,${(0.16 * (1 - t)).toFixed(3)})`;
          ctx.fillRect(bx + 248 - t * 12 + (r() - 0.5) * 10, by + 42 + k * 3, 14 + t * 18, 2);
        }
      }
      // canne, dove il molo lascia la riva
      reeds(ctx, W - 66, acquaY + 6, 7, r); reeds(ctx, W - 130, acquaY + 2, 5, r);
    },

    cisterna(ctx, W, H) {
      const r = rng(127);
      blocks(ctx, 0, 0, W, H, '#1a2028', 16, r, 0.2);
      blocks(ctx, 0, H - 46, W, 46, '#12181e', 14, r, 0.18);
      for (const fx of [0.16, 0.5, 0.84]) {
        blocks(ctx, W * fx - 44, H * 0.22, 88, H * 0.6, '#141a20', 12, r, 0.12);
        blocks(ctx, W * fx - 70, H * 0.2, 26, H * 0.65, '#242e3a', 10, r, 0.15);
        blocks(ctx, W * fx + 44, H * 0.2, 26, H * 0.65, '#242e3a', 10, r, 0.15);
        blocks(ctx, W * fx - 70, H * 0.14, 140, 22, '#2a3644', 10, r, 0.15);
      }
      // canale d'acqua
      blocks(ctx, W * 0.28, H - 84, W * 0.44, 38, '#0f2438', 10, r, 0.25);
      ctx.fillStyle = 'rgba(90,216,224,.2)';
      for (let i = 0; i < 9; i++) ctx.fillRect(W * 0.30 + r() * W * 0.4, H - 80 + r() * 30, 12 + r() * 18, 2);
      /* I CRISTALLI AZZURRI. Il testo di r6 dice che la grotta è «illuminata da cristalli
         azzurri incastonati nella roccia — cugini di quelli visti nelle Miniere di
         Ferrovecchio»: il giocatore ha appena visto quelli della miniera e cerca questi.
         Nel quadro non c'era nemmeno uno, e la luce la faceva il muschio verde.
         Vanno solo dove c'è pietra DIPINTA: fra un arco e l'altro, mai nel vuoto nero. */
      crystalVein(ctx, 48, H * 0.34, 5, r, 2.1);
      crystalVein(ctx, 312, H * 0.42, 6, r, 2.3);
      crystalVein(ctx, 646, H * 0.3, 5, r, 2.2);
      crystalVein(ctx, 912, H * 0.52, 4, r, 1.9);
      /* IL MUSCHIO. Prima erano quattordici pastigliette con x = r()*W e y libera: senza
         vincolo di superficie finivano anche DENTRO gli archi neri, dove non c'è nessuna
         roccia su cui stare, e venti macchie sotto i venti pixel sono il difetto delle
         «sette cose piccole» moltiplicato per tre. Adesso sono quattro colonie grandi,
         ognuna ancorata a una superficie che esiste: il bordo di un pilastro o la linea
         dell'acqua, dove il muschio cresce per davvero. */
      /* Al primo tentativo le colonie avevano il loro alone verde ed erano di un verde da
         prato: leggevano come quattro cespugli che galleggiano sull'acqua, e rubavano ai
         cristalli il mestiere di illuminare la grotta — che è quello che il testo dà a
         loro. Il muschio non fa luce: quindi niente alone, verde spento da pietra bagnata,
         e sotto ogni colonia la fascia scura del bagnasciuga che la ATTACCA alla roccia
         invece di lasciarla appoggiata sul pelo dell'acqua. */
      const colonia = (cx, cy, w, h) => {
        ctx.fillStyle = '#15281a';
        ctx.fillRect(Math.round(cx - w / 2) - 2, cy, w + 4, 7);       // bagnasciuga: la base bagnata
        for (let k = 0; k < 16; k++) {
          const t = k / 15;
          const hh = Math.max(4, Math.round(h * (0.35 + 0.65 * Math.sin(t * Math.PI)) + r() * 5));
          const x = Math.round(cx - w / 2 + t * w);
          const wd = Math.ceil(w / 15) + 1;
          ctx.fillStyle = '#1e4626'; ctx.fillRect(x, cy - hh, wd, hh + 4);
          ctx.fillStyle = '#356b35'; ctx.fillRect(x, cy - hh, wd, Math.max(3, hh * 0.38));
          if (r() > 0.6) { ctx.fillStyle = '#4f8f42'; ctx.fillRect(x, cy - hh, 3, 3); }
        }
      };
      colonia(W * 0.34, H - 84, 86, 16);          // sul ciglio del canale
      colonia(W * 0.62, H - 84, 74, 13);
      colonia(W * 0.16 + 58, H * 0.8, 66, 19);    // al piede del pilastro dell'arco
      colonia(W * 0.5 - 58, H * 0.8, 62, 16);
      /* LA SCALA DI SERVIZIO — «la scala sale dritta alle cantine», dice Bertoldo.
         Prima erano lastre rosa (#3a3548, un colore che non appartiene a niente in questa
         scena) con quattordici pixel di vuoto fra un gradino e l'altro. Alzate piene e
         la pietra della cisterna: gli stessi toni dei pilastri. */
      const sx = W * 0.74;
      for (let i = 0; i < 7; i++) {
        const gx = sx + i * 26, gy = H - 46 - i * 24;
        blocks(ctx, gx, gy + 11, 46, 24 + 16, '#232c36', 8, r, 0.12);   // cosciale
        blocks(ctx, gx, gy + 11, 28, 24, '#2b3642', 8, r, 0.12);        // alzata
        blocks(ctx, gx, gy, 46, 11, '#44525f', 8, r, 0.12);             // pedata
        ctx.fillStyle = '#5a6a78'; ctx.fillRect(gx, gy, 46, 3);
        ctx.fillStyle = '#101820'; ctx.fillRect(gx, gy + 11, 46, 3);
      }
      // botti dimenticate
      blocks(ctx, W * 0.07, H - 92, 46, 46, '#4a3524', 8, r, 0.15);
      ctx.fillStyle = '#3a2a18'; ctx.fillRect(W * 0.07, H - 80, 46, 5); ctx.fillRect(W * 0.07, H - 60, 46, 5);
      blocks(ctx, W * 0.13, H - 74, 44, 28, '#3a2a18', 8, r, 0.15);
      // stalattiti: poche e grosse, con la punta. Dieci schegge da cinque pixel non si
      // vedevano come stalattiti, si vedevano come sporco sul soffitto.
      for (const [x, hh] of [[112, 34], [268, 26], [452, 40], [618, 22], [802, 32]]) {
        for (let k = 0; k * 4 < hh; k++) {
          const wd = Math.max(3, Math.round((14 * (1 - (k * 4) / hh)) / 3) * 3);
          ctx.fillStyle = k * 4 < hh * 0.4 ? '#5a7a8a' : '#3d5a6a';
          ctx.fillRect(x - wd, k * 4, wd * 2, 4);
        }
      }
    },

    alba(ctx, W, H) {
      const r = rng(101);
      skyGradient(ctx, W, H, '#3a5a8a', '#f5a05a', 12);
      const g = H - 78;
      // il sole è tornato: disco pieno, niente eclissi
      moon(ctx, W * 0.5, H * 0.6, 46, '#f5e042', false);
      ctx.fillStyle = 'rgba(245,224,66,.16)';
      for (let i = 0; i < 10; i++) {
        const a = i * Math.PI / 10;
        ctx.fillRect(W * 0.5 + Math.cos(a) * 70 - 4, H * 0.6 - Math.sin(a) * 70 - 4, 9, 9);
      }
      // il bagliore dell'alba era una fascia di 960×108 con lo spigolo netto sopra e
      // sotto: una riga orizzontale che tagliava il cielo a metà. La luce del sole si
      // allarga DAL sole, quindi l'alone è centrato su di lui e sfuma.
      glow(ctx, W * 0.5, H * 0.6, W * 0.9, 250, '245,224,66');
      hills(ctx, W, g + 2, 48, '#2a4a2e', r, 32);
      house(ctx, W * 0.06, g, 104, 82, '#a8825a', '#8a4030', r, false);
      house(ctx, W * 0.74, g, 112, 86, '#b09068', '#7a5a40', r, false);
      ground(ctx, W, H, g, '#3d6a3a', r, 12, 10);
      // bandierine della festa
      ctx.strokeStyle = '#3a2a18'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(W * 0.15, g - 92); ctx.lineTo(W * 0.78, g - 104); ctx.stroke();
      const cols = ['#e84a5a', '#f5c542', '#5a9de0', '#5fca6a', '#c85ae0'];
      for (let i = 0; i < 14; i++) {
        ctx.fillStyle = cols[i % cols.length];
        const x = W * 0.15 + i * (W * 0.63 / 14), y = g - 92 - (i * 12 / 14);
        ctx.fillRect(x, y, 11, 15);
      }
      // uccellini
      ctx.strokeStyle = '#3a3a45'; ctx.lineWidth = 2;
      for (const [bx, by] of [[W * 0.24, 44], [W * 0.3, 60], [W * 0.72, 52]]) {
        ctx.beginPath(); ctx.moveTo(bx - 7, by); ctx.lineTo(bx, by - 5); ctx.lineTo(bx + 7, by); ctx.stroke();
      }
    },
  };

  /* Disegna una scena, con eventuali eroi e PNG.
     npcKeys accetta stringhe ('gerbold') oppure oggetti posizionati:
     { key, x, y, scale, flip } con x/y in frazioni di larghezza/altezza. */
  function paint(canvasId, locationKey, heroKeys = null, npcKeys = null) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    const W = canvas.width, H = canvas.height;
    const painter = painters[locationKey] || painters.strada;
    painter(ctx, W, H);
    if (heroKeys && heroKeys.length) heroesRow(ctx, W, H - 8, heroKeys, 3);
    if (npcKeys && npcKeys.length) drawNpcs(ctx, W, H, npcKeys);
  }

  function drawNpcs(ctx, W, H, npcKeys) {
    // i PNG senza posizione esplicita vengono allineati a destra, sul terreno
    const plain = npcKeys.filter(n => typeof n === 'string');
    const placed = npcKeys.filter(n => typeof n === 'object' && n);
    const scale = 5, size = 16 * scale;
    // i piedi stanno sopra la didascalia, altrimenti i personaggi finiscono coperti
    const baseFeet = H - 62;
    let x = Math.floor(W * 0.70 - (plain.length - 1) * (size + 16) / 2);
    for (const key of plain) {
      const def = Sprites.registry[key];
      if (def) {
        ctx.fillStyle = 'rgba(0,0,0,.35)';
        ctx.fillRect(x + 6, baseFeet - 4, size - 12, 8);
        Sprites.drawSprite(ctx, def.map, def.palette, x, baseFeet - size, scale, true);
      }
      x += size + 16;
    }
    for (const n of placed) {
      const def = Sprites.registry[n.key];
      if (!def) continue;
      const s = n.scale || 5, sz = 16 * s;
      const px = Math.round((n.x != null ? n.x * W : W * 0.7) - sz / 2);
      // n.y indica dove poggiano i PIEDI del personaggio (frazione di altezza)
      const finalY = n.y != null ? Math.round(n.y * H) - sz : H - 62 - sz;
      ctx.fillStyle = 'rgba(0,0,0,.3)';
      ctx.fillRect(px + 6, finalY + sz - 4, sz - 12, 7);
      Sprites.drawSprite(ctx, def.map, def.palette, px, finalY, s, n.flip !== false);
    }
  }

  return { paint, painters, rng, blocks, shade, heroesRow, tree, willow, house, torch, sign, ground, hills, moon, setEclipse, getEclipse, pixelDisc };
})();
