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

  function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
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
        ctx.fillStyle = 'rgba(245,197,66,.16)'; ctx.fillRect(wx - 6, groundY - h + 6, 26, 26);
        ctx.fillStyle = '#f5c542'; ctx.fillRect(wx, groundY - h + 12, 14, 14);
        ctx.fillStyle = '#5a4530'; ctx.fillRect(wx + 6, groundY - h + 12, 2, 14);
      }
    }
  }

  // Torcia con staffa: non fluttua più a mezz'aria
  function torch(ctx, x, y, bracket = true) {
    if (bracket) { ctx.fillStyle = '#3a3a45'; ctx.fillRect(x - 5, y + 4, 16, 4); ctx.fillRect(x - 5, y + 4, 4, 12); }
    ctx.fillStyle = '#6e4a2a'; ctx.fillRect(x, y, 6, 22);
    ctx.fillStyle = 'rgba(245,166,35,.16)'; ctx.fillRect(x - 14, y - 22, 34, 34);
    ctx.fillStyle = '#f5a623'; ctx.fillRect(x - 3, y - 10, 12, 12);
    ctx.fillStyle = '#f5e042'; ctx.fillRect(x, y - 7, 6, 6);
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

  // Alone luminoso morbido (fasce concentriche): evita il rettangolo squadrato
  function glow(ctx, x, y, w, h, rgb) {
    for (let i = 3; i >= 1; i--) {
      ctx.fillStyle = `rgba(${rgb},${0.05 * i})`;
      ctx.fillRect(x - w * i / 2, y - h * i / 2, w * i, h * i);
    }
  }

  function crystalVein(ctx, x, y, n, rand) {
    for (let i = 0; i < n; i++) {
      const cx = x + (rand() - 0.5) * 34, cy = y + (rand() - 0.5) * 26;
      const s = 6 + Math.round(rand() * 5);
      ctx.fillStyle = 'rgba(90,216,224,.16)'; ctx.fillRect(cx - 5, cy - 5, s + 10, s + 10);
      ctx.fillStyle = '#5ad8e0'; ctx.fillRect(cx, cy, s, s);
      ctx.fillStyle = '#a0f0f5'; ctx.fillRect(cx + 1, cy + 1, Math.max(2, s - 4), Math.max(2, s - 4));
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
      skyGradient(ctx, W, H, '#0d0a1a', '#3a1545', 10);
      stars(ctx, W, H, r, 50);
      moon(ctx, W * 0.5, H * 0.3, 40, '#c8b8e8', true);
      const g = H * 0.82;
      hills(ctx, W, g, 40, '#150d20', r, 40);
      blocks(ctx, W * 0.32, g - 90, W * 0.36, 90, '#1a1028', 8, r, 0.1);
      blocks(ctx, W * 0.28, g - 130, 30, 130, '#150d20', 8, r, 0.1);
      blocks(ctx, W * 0.66, g - 130, 30, 130, '#150d20', 8, r, 0.1);
      blocks(ctx, W * 0.46, g - 160, 38, 160, '#1d1230', 8, r, 0.1);
      ctx.fillStyle = '#e84a5a';
      ctx.fillRect(W * 0.48, g - 140, 8, 10); ctx.fillRect(W * 0.51, g - 120, 8, 10);
      ctx.fillRect(W * 0.30, g - 110, 6, 8); ctx.fillRect(W * 0.68, g - 110, 6, 8);
      blocks(ctx, 0, g, W, H - g, '#1d1830', 10, r, 0.2);
      const cx = W * 0.5 - 14, cy = g - 185;
      ctx.fillStyle = 'rgba(245,197,66,.16)'; ctx.fillRect(cx - 12, cy - 14, 52, 44);
      ctx.fillStyle = '#f5c542';
      ctx.fillRect(cx, cy + 8, 28, 8);
      ctx.fillRect(cx, cy, 6, 8); ctx.fillRect(cx + 11, cy - 4, 6, 12); ctx.fillRect(cx + 22, cy, 6, 8);
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
      ctx.fillStyle = '#1a1a22'; ctx.fillRect(W * 0.80 + 26, floorY - 92, 78, 92);
      ctx.fillStyle = 'rgba(245,166,35,.2)'; ctx.fillRect(W * 0.80 - 10, floorY - 120, 150, 130);
      ctx.fillStyle = '#f5a623'; ctx.fillRect(W * 0.80 + 36, floorY - 62, 58, 62);
      ctx.fillStyle = '#f5e042'; ctx.fillRect(W * 0.80 + 50, floorY - 44, 30, 44);
      ctx.fillStyle = '#3a2a18';
      ctx.fillRect(W * 0.80 + 30, floorY - 14, 70, 8); // ceppi
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
      ctx.fillStyle = '#f0e8d8'; ctx.fillRect(W * 0.47, floorY - 76, 9, 18);
      ctx.fillStyle = 'rgba(245,224,66,.18)'; ctx.fillRect(W * 0.47 - 12, floorY - 96, 34, 34);
      ctx.fillStyle = '#f5e042'; ctx.fillRect(W * 0.47 + 1, floorY - 84, 7, 8);
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
      // ruscello sotto il ponte
      blocks(ctx, W * 0.30, H - 74, W * 0.40, 74, '#12304a', 12, r, 0.24);
      ctx.fillStyle = 'rgba(150,190,230,.18)';
      for (let i = 0; i < 10; i++) ctx.fillRect(W * 0.31 + r() * W * 0.37, H - 70 + r() * 50, 16 + r() * 20, 3);
      // il ponticello, all'altezza del terreno
      bridge(ctx, W * 0.28, g - 4, W * 0.44, r);
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
      const r = rng(31);
      skyGradient(ctx, W, H, '#0d0a1f', '#33204a', 10);
      stars(ctx, W, H, r, 45);
      moon(ctx, W * 0.15, 66, 26, '#c8b8e8', true);
      const g = H - 84;
      hills(ctx, W, g + 4, 46, '#152515', r, 30);
      for (let i = 0; i < 7; i++) tree(ctx, 40 + i * (W / 7) + (r() * 34 - 17), g + 8, 58 + r() * 30, '#1d3a22', '#3a2a18', r);
      ground(ctx, W, H, g, '#26402a', r, 12, 10);
      // sentiero che si allontana in prospettiva
      for (let i = 0; i < 14; i++) {
        const t = i / 14;
        const pw = 40 + t * 150;
        blocks(ctx, W * 0.5 - pw / 2 + Math.sin(i * 0.7) * 24, g + 8 + i * ((H - g) / 14), pw, 10, '#6e5a42', 10, r, 0.2);
      }
      sign(ctx, W * 0.82, g + 10, 84, 30, 2);
      bush(ctx, W * 0.12, g + 8, 24, '#2a4a2e', r);
      bush(ctx, W * 0.66, g + 12, 20, '#2a4a2e', r);
    },

    bosco(ctx, W, H) {
      const r = rng(37);
      skyGradient(ctx, W, H, '#0a0d14', '#14261d', 10);
      const g = H - 64;
      // fondo: massa di chiome lontane
      hills(ctx, W, H * 0.42, 70, '#0f2216', r, 28);
      for (let i = 0; i < 9; i++) {
        const x = 30 + i * (W / 8.5) + (r() * 26 - 13);
        tree(ctx, x, g + 12, 108 + r() * 54, '#132b1a', '#241a10', r);
      }
      for (let i = 0; i < 7; i++) {
        const x = 70 + i * (W / 6.5) + (r() * 20 - 10);
        tree(ctx, x, g + 12, 62 + r() * 26, '#1d3a25', '#2e2115', r);
      }
      ground(ctx, W, H, g, '#16301c', r, 12, 12);
      // funghi luminosi
      for (let i = 0; i < 7; i++) {
        const x = 60 + r() * (W - 120), y = g + 14 + r() * 26;
        glow(ctx, x, y - 8, 16, 12, '200,90,224');
        ctx.fillStyle = '#e8d8f0'; ctx.fillRect(x - 1, y - 8, 6, 10);
        ctx.fillStyle = '#c85ae0'; ctx.fillRect(x - 7, y - 14, 18, 8);
        ctx.fillStyle = '#e8b8f5'; ctx.fillRect(x - 4, y - 12, 5, 3);
      }
      // occhi nel buio
      ctx.fillStyle = '#e8d84a';
      ctx.fillRect(W * 0.12, H * 0.44, 5, 5); ctx.fillRect(W * 0.12 + 12, H * 0.44, 5, 5);
      ctx.fillRect(W * 0.85, H * 0.36, 5, 5); ctx.fillRect(W * 0.85 + 12, H * 0.36, 5, 5);
    },

    capanna(ctx, W, H) {
      const r = rng(41);
      skyGradient(ctx, W, H, '#0a0d14', '#1a2e22', 10);
      const g = H - 72;
      hills(ctx, W, H * 0.5, 60, '#0f2216', r, 30);
      for (let i = 0; i < 5; i++) tree(ctx, 40 + i * (W / 4.2), g + 10, 82 + r() * 34, '#132b1a', '#241a10', r);
      // capanna storta
      const cx = W * 0.33, cw = 210, ch = 112;
      blocks(ctx, cx, g - ch, cw, ch, '#4a3a28', 10, r, 0.18);
      // tetto di paglia a spiovente
      for (let i = 0; i < 6; i++) {
        const rw = (cw + 40) * (1 - i / 6);
        blocks(ctx, cx + (cw - rw) / 2 + i * 3, g - ch - 6 - i * 10, rw, 11, '#2e4a2e', 9, r, 0.2);
      }
      ctx.fillStyle = '#241a10'; ctx.fillRect(cx + 84, g - 52, 38, 52);
      ctx.fillStyle = '#3a2a18'; ctx.fillRect(cx + 80, g - 56, 46, 5);
      // finestra verde magica
      ctx.fillStyle = 'rgba(138,224,90,.2)'; ctx.fillRect(cx + 10, g - 100, 56, 56);
      ctx.fillStyle = '#8ae05a'; ctx.fillRect(cx + 24, g - 88, 28, 28);
      ctx.fillStyle = '#4a3a28'; ctx.fillRect(cx + 36, g - 88, 4, 28);
      // camino con fumo verde
      blocks(ctx, cx + 152, g - ch - 46, 24, 60, '#5a5a66', 8, r, 0.2);
      ctx.fillStyle = 'rgba(138,224,90,.34)';
      ctx.fillRect(cx + 154, g - ch - 66, 18, 15); ctx.fillRect(cx + 162, g - ch - 88, 15, 15); ctx.fillRect(cx + 152, g - ch - 108, 13, 13);
      ground(ctx, W, H, g, '#16301c', r, 12, 12);
      // calderone col fuoco
      ctx.fillStyle = '#2a2a35'; ctx.fillRect(W * 0.70, g - 30, 56, 30);
      ctx.fillStyle = '#1a1a22'; ctx.fillRect(W * 0.70 + 6, g - 24, 44, 8);
      ctx.fillStyle = 'rgba(138,224,90,.25)'; ctx.fillRect(W * 0.70 - 6, g - 56, 68, 40);
      ctx.fillStyle = '#8ae05a'; ctx.fillRect(W * 0.70 + 5, g - 38, 46, 9);
      ctx.fillStyle = '#f5a623'; ctx.fillRect(W * 0.70 + 10, g - 6, 36, 6);
      // erbe appese a un filo
      ctx.strokeStyle = '#5a4530'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx + cw, g - ch + 20); ctx.lineTo(W * 0.92, g - ch + 40); ctx.stroke();
      for (let i = 0; i < 5; i++) {
        const hx = cx + cw + 14 + i * 26, hy = g - ch + 22 + i * 4;
        ctx.fillStyle = ['#5a8a4a', '#8a7a3a', '#6a5a8a'][i % 3];
        ctx.fillRect(hx, hy, 8, 22);
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
      const g = H - 60;
      hills(ctx, W, g - 10, 50, '#170f22', r, 34);
      // mura
      blocks(ctx, W * 0.08, g - 150, W * 0.84, 132, '#3a3045', 12, r, 0.15);
      for (let x = W * 0.08; x < W * 0.9; x += 36) blocks(ctx, x, g - 168, 20, 18, '#3a3045', 8, r, 0.15);
      // torri laterali
      blocks(ctx, W * 0.05, g - 240, 70, 222, '#332a40', 10, r, 0.15);
      blocks(ctx, W * 0.87, g - 240, 70, 222, '#332a40', 10, r, 0.15);
      // mastio centrale, più alto e affusolato
      blocks(ctx, W * 0.43, g - 286, 130, 136, '#3d3350', 10, r, 0.15);
      blocks(ctx, W * 0.415, g - 300, 160, 18, '#4a3f6b', 10, r, 0.12);
      const spike = (x, w, y) => { for (let i = 0; i < 6; i++) blocks(ctx, x + i * (w / 12), y - i * 11, w - i * (w / 6), 11, '#5a2035', 8, r, 0.15); };
      spike(W * 0.05, 70, g - 240); spike(W * 0.87, 70, g - 240); spike(W * 0.43, 130, g - 300);
      ctx.fillStyle = '#e84a5a';
      ctx.fillRect(W * 0.46, g - 262, 11, 16); ctx.fillRect(W * 0.53, g - 232, 11, 16);
      ctx.fillRect(W * 0.08 + 24, g - 210, 8, 12); ctx.fillRect(W * 0.9, g - 210, 8, 12);
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
      // Barriera Notturna: un velo d'ombra sottile, che si intuisce senza coprire il castello
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = `rgba(40,12,60,${0.045 + i * 0.012})`;
        ctx.fillRect(W * 0.03 - i * 5, g - 300 + i * 14, W * 0.94 + i * 10, 300);
      }
      ctx.fillStyle = 'rgba(140,80,220,.14)';
      for (let i = 0; i < 14; i++) ctx.fillRect(W * 0.04 + r() * W * 0.9, g - 300 + r() * 290, 26 + r() * 70, 3);
      // bagliore del velo lungo il bordo superiore
      ctx.fillStyle = 'rgba(160,106,224,.10)';
      ctx.fillRect(W * 0.02, g - 306, W * 0.96, 8);
    },

    cucine(ctx, W, H) {
      const r = rng(151);
      const floorY = H - 66;
      blocks(ctx, 0, 0, W, H, '#3d3a34', 14, r, 0.16);          // muri di pietra affumicata
      blocks(ctx, 0, floorY, W, H - floorY, '#4a4038', 16, r, 0.2);
      // grande focolare acceso "per abitudine"
      blocks(ctx, W * 0.04, floorY - 168, 190, 168, '#5a5a60', 10, r, 0.18);
      blocks(ctx, W * 0.02, floorY - 182, 220, 16, '#6e6e78', 10, r, 0.12);
      ctx.fillStyle = '#14100e'; ctx.fillRect(W * 0.04 + 34, floorY - 106, 122, 106);
      glow(ctx, W * 0.04 + 95, floorY - 50, 90, 70, '245,166,35');
      ctx.fillStyle = '#f5a623'; ctx.fillRect(W * 0.04 + 48, floorY - 70, 94, 70);
      ctx.fillStyle = '#f5e042'; ctx.fillRect(W * 0.04 + 66, floorY - 48, 58, 48);
      // pentolone appeso sul fuoco
      ctx.fillStyle = '#3a3a45'; ctx.fillRect(W * 0.04 + 60, floorY - 132, 70, 12);
      blocks(ctx, W * 0.04 + 64, floorY - 122, 62, 40, '#8a5a2a', 8, r, 0.14);
      ctx.fillStyle = '#c8a032'; ctx.fillRect(W * 0.04 + 64, floorY - 126, 62, 6);
      // rastrelliera di pentole di rame
      blocks(ctx, W * 0.30, 44, W * 0.42, 10, '#4a3524', 10, r, 0.1);
      for (let i = 0; i < 7; i++) {
        const px = W * 0.31 + i * (W * 0.40 / 7);
        const s = 22 + (i % 3) * 8;
        ctx.fillStyle = i % 2 ? '#c87a32' : '#b06a28';
        ctx.fillRect(px, 54, s, s * 0.8);
        ctx.fillStyle = '#8a5520'; ctx.fillRect(px + s - 4, 56, 12, 4);
      }
      // trecce d'aglio ed erbe appese
      for (let i = 0; i < 5; i++) {
        const hx = W * 0.34 + i * 40;
        ctx.strokeStyle = '#6e5a3a'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(hx, 54); ctx.lineTo(hx, 84); ctx.stroke();
        ctx.fillStyle = i % 2 ? '#e8e0c8' : '#5a8a4a';
        for (let k = 0; k < 3; k++) ctx.fillRect(hx - 5, 84 + k * 9, 11, 9);
      }
      // lungo tavolo da lavoro macchiato da due secoli di sughi
      blocks(ctx, W * 0.34, floorY - 62, W * 0.44, 16, '#7a5c3d', 10, r, 0.14);
      ctx.fillStyle = '#5a3a28';
      for (let i = 0; i < 9; i++) ctx.fillRect(W * 0.35 + r() * W * 0.4, floorY - 60 + r() * 10, 8 + r() * 14, 4);
      ctx.fillStyle = '#4a3524';
      ctx.fillRect(W * 0.36, floorY - 46, 14, 46); ctx.fillRect(W * 0.74, floorY - 46, 14, 46);
      // sul tavolo: tagliere, verdure, un coltello piantato
      ctx.fillStyle = '#8a6a45'; ctx.fillRect(W * 0.40, floorY - 72, 46, 10);
      ctx.fillStyle = '#c85a4a'; ctx.fillRect(W * 0.43, floorY - 78, 10, 8);
      ctx.fillStyle = '#5fca6a'; ctx.fillRect(W * 0.55, floorY - 76, 14, 8);
      ctx.fillStyle = '#c8ccd8'; ctx.fillRect(W * 0.66, floorY - 86, 4, 24);
      ctx.fillStyle = '#4a3524'; ctx.fillRect(W * 0.655, floorY - 94, 14, 10);
      // credenza con stoviglie
      blocks(ctx, W * 0.82, floorY - 130, W * 0.16, 130, '#5a4530', 10, r, 0.14);
      for (let row = 0; row < 3; row++) {
        blocks(ctx, W * 0.82, floorY - 110 + row * 34, W * 0.16, 8, '#4a3524', 8, r, 0.1);
        for (let i = 0; i < 4; i++) { ctx.fillStyle = '#e8e4d8'; ctx.fillRect(W * 0.83 + i * 26, floorY - 126 + row * 34, 18, 16); }
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
      // la scala a chiocciola che sale verso destra
      for (let g = 0; g < 9; g++) {
        const gx = W * 0.06 + g * W * 0.1, gy = H * 0.82 - g * H * 0.055;
        blocks(ctx, gx, gy, W * 0.12, 12, '#4a4258', 8, r, 0.12);
        ctx.fillStyle = '#332e44'; ctx.fillRect(gx, gy + 12, W * 0.12, 5);
      }
      // il corrimano di corda, che non si fida
      ctx.strokeStyle = '#6a5a3a'; ctx.lineWidth = 3; ctx.beginPath();
      ctx.moveTo(W * 0.08, H * 0.72);
      for (let g = 1; g < 9; g++) ctx.lineTo(W * 0.12 + g * W * 0.1, H * 0.72 - g * H * 0.055 + Math.sin(g) * 5);
      ctx.stroke();
      // pile di libri e pergamene sui gradini
      for (const [bx, by, n] of [[0.18, 0.76, 3], [0.47, 0.60, 2], [0.76, 0.44, 4]]) {
        for (let k = 0; k < n; k++) {
          ctx.fillStyle = ['#7a2432', '#3d5a80', '#8a6a2d', '#3d8a80'][k % 4];
          ctx.fillRect(W * bx + (r() * 6 - 3), H * by - k * 7, 34, 6);
        }
      }
      // candele nelle nicchie
      for (const fx of [0.3, 0.66]) {
        glow(ctx, W * fx, H * 0.5, 22, 16, '232,182,76');
        ctx.fillStyle = '#e8e4dc'; ctx.fillRect(W * fx - 2, H * 0.5 - 8, 4, 10);
        ctx.fillStyle = '#f5c542'; ctx.fillRect(W * fx - 1, H * 0.5 - 12, 2, 4);
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
        ctx.fillStyle = 'rgba(245,197,66,.14)'; ctx.fillRect(x + 24, y + 14, 40, 30);
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

    salaTrono(ctx, W, H) {
      const r = rng(61);
      blocks(ctx, 0, 0, W, H, '#241d33', 16, r, 0.18);
      blocks(ctx, 0, H - 60, W, 60, '#1a1428', 14, r, 0.15);
      blocks(ctx, W * 0.38, H * 0.35, W * 0.24, H * 0.65 - 60, '#6e1525', 12, r, 0.15);
      for (const fx of [0.12, 0.3, 0.7, 0.88]) {
        blocks(ctx, W * fx - 16, 20, 32, H - 80, '#3a3050', 10, r, 0.12);
        blocks(ctx, W * fx - 24, 10, 48, 16, '#4a3f6b', 10, r, 0.1);
        blocks(ctx, W * fx - 24, H - 76, 48, 16, '#4a3f6b', 10, r, 0.1);
      }
      blocks(ctx, W * 0.44, H * 0.3, W * 0.12, H * 0.34, '#1d1d28', 8, r, 0.12);
      blocks(ctx, W * 0.42, H * 0.24, W * 0.16, 20, '#f5c542', 8, r, 0.1);
      ctx.fillStyle = '#f5c542';
      ctx.fillRect(W * 0.44, H * 0.24 - 14, 10, 14); ctx.fillRect(W * 0.495, H * 0.24 - 22, 10, 22); ctx.fillRect(W * 0.55, H * 0.24 - 14, 10, 14);
      for (const fx of [0.2, 0.5, 0.8]) {
        ctx.fillStyle = '#f0f0e8'; ctx.fillRect(W * fx - 4, 46, 8, 20);
        ctx.fillStyle = 'rgba(160,106,224,.2)'; ctx.fillRect(W * fx - 18, 22, 36, 40);
        ctx.fillStyle = '#a06ae0'; ctx.fillRect(W * fx - 7, 34, 14, 14);
        ctx.fillStyle = '#d8b8f5'; ctx.fillRect(W * fx - 3, 38, 6, 8);
      }
      ctx.fillStyle = '#3d1030'; ctx.fillRect(W * 0.46, 30, W * 0.08, H * 0.16);
      ctx.fillStyle = '#e84a5a'; ctx.fillRect(W * 0.47, 40, W * 0.06, H * 0.05);
      ctx.fillStyle = '#8a35b8'; ctx.fillRect(W * 0.47, 40 + H * 0.06, W * 0.06, H * 0.05);
    },

    cripta(ctx, W, H) {
      const r = rng(71);
      blocks(ctx, 0, 0, W, H, '#242030', 16, r, 0.22);
      blocks(ctx, 0, H - 50, W, 50, '#1a1724', 14, r, 0.18);
      for (const fx of [0.2, 0.5, 0.8]) {
        blocks(ctx, W * fx - 34, H * 0.24, 68, H * 0.58, '#161320', 12, r, 0.12);
        blocks(ctx, W * fx - 64, H * 0.22, 28, H * 0.62, '#3d374d', 10, r, 0.15);
        blocks(ctx, W * fx + 36, H * 0.22, 28, H * 0.62, '#3d374d', 10, r, 0.15);
        blocks(ctx, W * fx - 64, H * 0.15, 128, 26, '#443d55', 10, r, 0.15);
      }
      for (const fx of [0.12, 0.68]) {
        blocks(ctx, W * fx, H - 104, 130, 54, '#4a4460', 8, r, 0.15);
        blocks(ctx, W * fx - 6, H - 112, 142, 12, '#5a5372', 8, r, 0.12);
        ctx.fillStyle = '#f5c542'; ctx.fillRect(W * fx + 56, H - 96, 16, 4); ctx.fillRect(W * fx + 62, H - 102, 4, 16);
      }
      blocks(ctx, W * 0.42, H - 92, 130, 12, '#4a3524', 8, r, 0.12);
      ctx.fillStyle = '#3a2a18'; ctx.fillRect(W * 0.44, H - 80, 10, 34); ctx.fillRect(W * 0.53, H - 80, 10, 34);
      for (let i = 0; i < 5; i++) { ctx.fillStyle = '#c8ccd8'; ctx.fillRect(W * 0.425 + i * 0.026 * W, H - 100, 16, 6); }
      for (const fx of [0.08, 0.34, 0.62, 0.9]) {
        ctx.fillStyle = 'rgba(95,224,138,.12)'; ctx.fillRect(W * fx - 16, H * 0.46 - 20, 42, 48);
        ctx.fillStyle = '#f0f0e8'; ctx.fillRect(W * fx, H * 0.5, 7, 16);
        ctx.fillStyle = '#5fe08a'; ctx.fillRect(W * fx - 2, H * 0.5 - 12, 11, 12);
        ctx.fillStyle = '#c8f5d8'; ctx.fillRect(W * fx + 1, H * 0.5 - 8, 5, 6);
      }
      ctx.strokeStyle = 'rgba(200,200,220,.28)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(60, 50); ctx.moveTo(30, 0); ctx.lineTo(60, 50); ctx.moveTo(0, 30); ctx.lineTo(60, 50); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(W, 0); ctx.lineTo(W - 60, 50); ctx.moveTo(W - 30, 0); ctx.lineTo(W - 60, 50); ctx.stroke();
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
      ctx.fillStyle = 'rgba(245,224,66,.08)'; ctx.fillRect(W * 0.5 - 110, 0, 220, 90);
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
      moon(ctx, W * 0.5, H * 0.36, 40, '#e8e0f0', true);   // abbassata: a mezzanotte la corona è enorme
      ctx.fillStyle = 'rgba(232,74,90,.12)';
      ctx.fillRect(0, 0, W, H);
      const g = H - 40;
      // nuvole basse per dare l'altezza
      ctx.fillStyle = 'rgba(60,30,70,.5)';
      for (let i = 0; i < 6; i++) ctx.fillRect(r() * W, g - 40 + r() * 30, 60 + r() * 90, 8);
      blocks(ctx, W * 0.18, g - 30, W * 0.64, 70, '#2e2a3d', 12, r, 0.15);
      for (let x = W * 0.18; x < W * 0.82; x += 40) blocks(ctx, x, g - 48, 22, 18, '#2e2a3d', 8, r, 0.15);
      blocks(ctx, W * 0.44, g - 80, W * 0.12, 50, '#1d1d28', 8, r, 0.12);
      blocks(ctx, W * 0.425, g - 88, W * 0.15, 10, '#2a2a38', 8, r, 0.1);
      const cx = W * 0.5 - 20, cy = g - 134;
      ctx.fillStyle = 'rgba(245,197,66,.2)'; ctx.fillRect(cx - 18, cy - 24, 76, 58);
      ctx.fillStyle = '#f5c542';
      ctx.fillRect(cx, cy + 10, 40, 10);
      ctx.fillRect(cx, cy, 8, 10); ctx.fillRect(cx + 16, cy - 6, 8, 16); ctx.fillRect(cx + 32, cy, 8, 10);
      ctx.fillStyle = '#e84a5a'; ctx.fillRect(cx + 18, cy + 12, 5, 5);
      ctx.strokeStyle = '#a06ae0'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(W * 0.5, cy - 20); ctx.lineTo(W * 0.44, H * 0.2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(W * 0.5, cy - 20); ctx.lineTo(W * 0.58, H * 0.15); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(W * 0.5, cy - 20); ctx.lineTo(W * 0.52, H * 0.1); ctx.stroke();
    },

    fiume(ctx, W, H) {
      const r = rng(113);
      skyGradient(ctx, W, H, '#0a0d18', '#1a2a3d', 10);
      stars(ctx, W, H, r, 40);
      moon(ctx, W * 0.80, 52, 24, '#c8b8e8', true);
      const g = H * 0.54;
      hills(ctx, W, g - 10, 46, '#101d16', r, 30);
      // riva con profilo irregolare
      for (let x = 0; x < W; x += 14) {
        const off = Math.round((r() - 0.5) * 2) * 6;
        blocks(ctx, x, g - 26 + off, 14, 34, '#14261c', 10, r, 0.2);
      }
      // salici piangenti veri
      for (let i = 0; i < 4; i++) willow(ctx, 60 + i * (W / 3.6), g + 4, 92 + r() * 26, '#1d3a2a', '#2e2115', r);
      // acqua
      blocks(ctx, 0, g + 6, W, H - g - 6, '#0f2438', 14, r, 0.25);
      ctx.fillStyle = 'rgba(200,184,232,.2)';
      for (let i = 0; i < 12; i++) ctx.fillRect(W * 0.6 + r() * W * 0.34, g + 20 + r() * (H - g - 30), 14 + r() * 22, 3);
      ctx.fillStyle = 'rgba(90,157,224,.14)';
      for (let i = 0; i < 18; i++) ctx.fillRect(r() * W, g + 14 + r() * (H - g - 20), 10 + r() * 30, 2);
      // molo di legno
      blocks(ctx, 0, g + 10, W * 0.22, 12, '#5a4530', 10, r, 0.15);
      for (const px of [0.04, 0.12, 0.19]) ctx.fillRect(W * px, g + 22, 8, 26);
      // barcone con prua, palo e lanterna
      const bx = W * 0.36, by = g + 42;
      blocks(ctx, bx, by, 168, 24, '#3a2a18', 8, r, 0.14);
      blocks(ctx, bx + 8, by - 9, 152, 11, '#4a3524', 8, r, 0.12);
      ctx.fillStyle = '#3a2a18';
      ctx.beginPath(); ctx.moveTo(bx + 168, by); ctx.lineTo(bx + 196, by + 6); ctx.lineTo(bx + 168, by + 24); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#2a1d10'; ctx.fillRect(bx + 76, by - 52, 7, 44);
      ctx.fillStyle = 'rgba(245,197,66,.18)'; ctx.fillRect(bx + 60, by - 74, 42, 40);
      ctx.fillStyle = '#f5c542'; ctx.fillRect(bx + 70, by - 64, 19, 15);
      // canne sulle rive
      reeds(ctx, 10, g + 14, 6, r); reeds(ctx, W - 70, g + 14, 7, r);
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
      // muschio luminescente
      for (let i = 0; i < 14; i++) {
        const x = r() * W, y = H * 0.2 + r() * H * 0.5;
        ctx.fillStyle = 'rgba(95,202,106,.18)'; ctx.fillRect(x - 6, y - 4, 20, 14);
        ctx.fillStyle = 'rgba(95,202,106,.6)'; ctx.fillRect(x, y, 7 + r() * 7, 4);
      }
      // scala di servizio che sale
      const sx = W * 0.76;
      for (let i = 0; i < 8; i++) blocks(ctx, sx + i * 14, H - 56 - i * 26, 56, 12, '#3a3548', 8, r, 0.12);
      ctx.fillStyle = '#2a2a35';
      for (let i = 0; i < 8; i++) ctx.fillRect(sx + i * 14 + 50, H - 56 - i * 26, 6, 26);
      // botti dimenticate
      blocks(ctx, W * 0.07, H - 92, 46, 46, '#4a3524', 8, r, 0.15);
      ctx.fillStyle = '#3a2a18'; ctx.fillRect(W * 0.07, H - 80, 46, 5); ctx.fillRect(W * 0.07, H - 60, 46, 5);
      blocks(ctx, W * 0.13, H - 74, 44, 28, '#3a2a18', 8, r, 0.15);
      // stalattiti gocciolanti
      ctx.fillStyle = '#4a6a7a';
      for (let i = 0; i < 10; i++) { const x = 30 + r() * (W - 60); ctx.fillRect(x, 0, 5, 8 + r() * 16); }
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
      ctx.fillStyle = 'rgba(245,224,66,.18)'; ctx.fillRect(0, H * 0.5, W, H * 0.3);
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
