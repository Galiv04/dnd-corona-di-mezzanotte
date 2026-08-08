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

  function moon(ctx, x, y, r, color = '#e8e0f0', eclipse = false) {
    ctx.fillStyle = color;
    for (let dy = -r; dy <= r; dy += 3) {
      const hw = Math.floor(Math.sqrt(r * r - dy * dy) / 3) * 3;
      ctx.fillRect(x - hw, y + dy, hw * 2, 3);
    }
    if (eclipse) {
      ctx.fillStyle = '#3a1025';
      for (let dy = -r + 6; dy <= r - 6; dy += 3) {
        const hw = Math.floor(Math.sqrt((r - 6) * (r - 6) - dy * dy) / 3) * 3;
        ctx.fillRect(x - hw + 4, y + dy, hw * 2, 3);
      }
    }
  }

  function tree(ctx, x, groundY, size, leaf, trunk, rand) {
    const tw = Math.max(6, Math.floor(size / 5));
    blocks(ctx, x - tw / 2, groundY - size, tw, size, trunk, 6, rand);
    const lw = size * 1.1;
    blocks(ctx, x - lw / 2, groundY - size - lw * 0.9, lw, lw * 0.55, leaf, 8, rand, 0.3);
    blocks(ctx, x - lw / 3, groundY - size - lw * 1.25, lw * 0.66, lw * 0.45, leaf, 8, rand, 0.3);
  }

  function house(ctx, x, groundY, w, h, wall, roof, rand, windowLit = true) {
    blocks(ctx, x, groundY - h, w, h, wall, 8, rand, 0.12);
    // tetto a triangolo blocchi
    const steps = 6;
    for (let i = 0; i < steps; i++) {
      const rw = w + 12 - (w + 12) * (i / steps);
      blocks(ctx, x + (w - rw) / 2, groundY - h - 10 - i * 8, rw, 8, roof, 8, rand, 0.15);
    }
    // porta
    ctx.fillStyle = '#3a2a18';
    ctx.fillRect(x + w / 2 - 8, groundY - 26, 16, 26);
    // finestre
    if (windowLit) {
      ctx.fillStyle = '#f5c542';
      ctx.fillRect(x + 8, groundY - h + 12, 12, 12);
      ctx.fillRect(x + w - 20, groundY - h + 12, 12, 12);
    }
  }

  function torch(ctx, x, y) {
    ctx.fillStyle = '#6e4a2a'; ctx.fillRect(x, y, 6, 22);
    ctx.fillStyle = '#f5a623'; ctx.fillRect(x - 3, y - 10, 12, 12);
    ctx.fillStyle = '#f5e042'; ctx.fillRect(x, y - 7, 6, 6);
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
  // Ogni pittore riceve (ctx, W, H) e disegna lo sfondo completo.

  const painters = {

    titolo(ctx, W, H) {
      const r = rng(42);
      skyGradient(ctx, W, H, '#0d0a1a', '#3a1545', 10);
      stars(ctx, W, H, r, 50);
      moon(ctx, W * 0.5, H * 0.3, 40, '#c8b8e8', true);
      // castello in silhouette
      const g = H * 0.82;
      blocks(ctx, W * 0.32, g - 90, W * 0.36, 90, '#1a1028', 8, r, 0.1);
      blocks(ctx, W * 0.28, g - 130, 30, 130, '#150d20', 8, r, 0.1);
      blocks(ctx, W * 0.66, g - 130, 30, 130, '#150d20', 8, r, 0.1);
      blocks(ctx, W * 0.46, g - 160, 38, 160, '#1d1230', 8, r, 0.1);
      // finestre rosse
      ctx.fillStyle = '#e84a5a';
      ctx.fillRect(W * 0.48, g - 140, 8, 10); ctx.fillRect(W * 0.51, g - 120, 8, 10);
      ctx.fillRect(W * 0.30, g - 110, 6, 8); ctx.fillRect(W * 0.68, g - 110, 6, 8);
      // terreno
      blocks(ctx, 0, g, W, H - g, '#1d1830', 10, r, 0.2);
      // corona dorata sopra la torre
      ctx.fillStyle = '#f5c542';
      const cx = W * 0.5 - 14, cy = g - 185;
      ctx.fillRect(cx, cy + 8, 28, 8);
      ctx.fillRect(cx, cy, 6, 8); ctx.fillRect(cx + 11, cy - 4, 6, 12); ctx.fillRect(cx + 22, cy, 6, 8);
    },

    taverna(ctx, W, H) {
      const r = rng(7);
      blocks(ctx, 0, 0, W, H, '#3a2a1a', 14, r, 0.15); // pareti legno
      blocks(ctx, 0, H - 60, W, 60, '#4a3524', 16, r, 0.2); // pavimento
      // travi
      blocks(ctx, 0, 40, W, 14, '#2a1d10', 20, r, 0.1);
      blocks(ctx, W * 0.25, 0, 14, H - 60, '#2a1d10', 20, r, 0.1);
      blocks(ctx, W * 0.72, 0, 14, H - 60, '#2a1d10', 20, r, 0.1);
      // camino
      blocks(ctx, W * 0.8, H - 200, 120, 140, '#5a5a66', 10, r, 0.2);
      ctx.fillStyle = '#1a1a22'; ctx.fillRect(W * 0.8 + 24, H - 140, 72, 80);
      ctx.fillStyle = '#f5a623'; ctx.fillRect(W * 0.8 + 34, H - 110, 52, 50);
      ctx.fillStyle = '#f5e042'; ctx.fillRect(W * 0.8 + 46, H - 95, 28, 35);
      // bancone
      blocks(ctx, W * 0.05, H - 150, 240, 90, '#5d4530', 12, r, 0.15);
      blocks(ctx, W * 0.05, H - 160, 240, 12, '#6e5238', 12, r, 0.1);
      // boccali
      ctx.fillStyle = '#c8a032'; ctx.fillRect(W * 0.1, H - 185, 16, 22); ctx.fillRect(W * 0.16, H - 182, 16, 19);
      ctx.fillStyle = '#f0e8d8'; ctx.fillRect(W * 0.1, H - 190, 16, 6); ctx.fillRect(W * 0.16, H - 187, 16, 6);
      // tavolo
      blocks(ctx, W * 0.42, H - 120, 160, 16, '#5d4530', 12, r, 0.12);
      ctx.fillStyle = '#4a3524'; ctx.fillRect(W * 0.44, H - 104, 12, 44); ctx.fillRect(W * 0.56, H - 104, 12, 44);
      // candele sul tavolo
      ctx.fillStyle = '#f0e8d8'; ctx.fillRect(W * 0.47, H - 138, 8, 18);
      ctx.fillStyle = '#f5e042'; ctx.fillRect(W * 0.47, H - 146, 8, 8);
      torch(ctx, W * 0.3, 100); torch(ctx, W * 0.65, 100);
      // finestra con notte fuori
      ctx.fillStyle = '#0d0a1f'; ctx.fillRect(W * 0.35, 70, 70, 60);
      ctx.fillStyle = '#9a90c0'; ctx.fillRect(W * 0.37, 80, 3, 3); ctx.fillRect(W * 0.41, 95, 3, 3);
      ctx.strokeStyle = '#2a1d10'; ctx.lineWidth = 6;
      ctx.strokeRect(W * 0.35, 70, 70, 60);
      ctx.beginPath(); ctx.moveTo(W * 0.35 + 35, 70); ctx.lineTo(W * 0.35 + 35, 130); ctx.stroke();
    },

    villaggio(ctx, W, H) {
      const r = rng(11);
      skyGradient(ctx, W, H, '#0d0a1f', '#2a1a3d', 10);
      stars(ctx, W, H, r, 55);
      moon(ctx, W * 0.82, 60, 30, '#c8b8e8', true);
      const g = H - 70;
      // colline lontane
      blocks(ctx, 0, g - 60, W, 60, '#1d1830', 12, r, 0.15);
      // case
      house(ctx, W * 0.06, g, 110, 85, '#8a6a45', '#7a3025', r);
      house(ctx, W * 0.3, g, 90, 70, '#96755a', '#6e5238', r);
      house(ctx, W * 0.55, g, 130, 95, '#8a6a45', '#7a3025', r);
      house(ctx, W * 0.8, g, 95, 75, '#96755a', '#5a4a35', r);
      // pozzo
      blocks(ctx, W * 0.46, g - 30, 46, 30, '#6e6e7a', 8, r, 0.2);
      ctx.fillStyle = '#3a2a18'; ctx.fillRect(W * 0.46 + 4, g - 66, 6, 36); ctx.fillRect(W * 0.46 + 36, g - 66, 6, 36);
      ctx.fillStyle = '#7a3025'; ctx.fillRect(W * 0.46 - 4, g - 74, 54, 10);
      // terreno erba scura (notte)
      blocks(ctx, 0, g, W, H - g, '#26402a', 12, r, 0.25);
      // lanterne
      torch(ctx, W * 0.25, g - 40); torch(ctx, W * 0.75, g - 40);
    },

    strada(ctx, W, H) {
      const r = rng(23);
      skyGradient(ctx, W, H, '#0d0a1f', '#33204a', 10);
      stars(ctx, W, H, r, 45);
      moon(ctx, W * 0.15, 70, 26, '#c8b8e8', true);
      const g = H - 80;
      blocks(ctx, 0, g - 40, W, 40, '#152515', 12, r, 0.2);
      for (let i = 0; i < 7; i++) tree(ctx, 40 + i * (W / 7) + (r() * 40 - 20), g, 55 + r() * 30, '#1d3a22', '#3a2a18', r);
      blocks(ctx, 0, g, W, H - g, '#26402a', 12, r, 0.25);
      // sentiero
      for (let i = 0; i < 14; i++) {
        blocks(ctx, W * 0.42 + Math.sin(i * 0.8) * 30, g + 6 + i * ((H - g) / 14), 90, 8, '#6e5a42', 10, r, 0.2);
      }
      // cartello
      ctx.fillStyle = '#3a2a18'; ctx.fillRect(W * 0.78, g - 46, 8, 46);
      ctx.fillStyle = '#6e5238'; ctx.fillRect(W * 0.73, g - 60, 76, 20);
    },

    bosco(ctx, W, H) {
      const r = rng(31);
      skyGradient(ctx, W, H, '#0a0d14', '#14261d', 10);
      const g = H - 60;
      // alberi fitti e contorti
      for (let i = 0; i < 11; i++) {
        const x = 20 + i * (W / 10) + (r() * 30 - 15);
        const s = 90 + r() * 60;
        tree(ctx, x, g + 10, s, '#132b1a', '#241a10', r);
      }
      for (let i = 0; i < 8; i++) {
        const x = 60 + i * (W / 7);
        tree(ctx, x, g + 10, 60 + r() * 30, '#1d3a25', '#2e2115', r);
      }
      blocks(ctx, 0, g, W, H - g, '#16301c', 12, r, 0.3);
      // funghi luminosi
      for (let i = 0; i < 6; i++) {
        const x = 60 + r() * (W - 120), y = g + 10 + r() * 30;
        ctx.fillStyle = '#c85ae0'; ctx.fillRect(x - 6, y - 10, 16, 8);
        ctx.fillStyle = '#e8d8f0'; ctx.fillRect(x - 1, y - 4, 6, 10);
        ctx.fillStyle = 'rgba(200,90,224,.15)'; ctx.fillRect(x - 14, y - 20, 32, 26);
      }
      // occhi nel buio
      ctx.fillStyle = '#e8d84a';
      ctx.fillRect(W * 0.12, H * 0.42, 5, 5); ctx.fillRect(W * 0.12 + 12, H * 0.42, 5, 5);
      ctx.fillRect(W * 0.85, H * 0.35, 5, 5); ctx.fillRect(W * 0.85 + 12, H * 0.35, 5, 5);
    },

    capanna(ctx, W, H) {
      const r = rng(37);
      skyGradient(ctx, W, H, '#0a0d14', '#1a2e22', 10);
      const g = H - 70;
      for (let i = 0; i < 6; i++) tree(ctx, 30 + i * (W / 5), g + 10, 80 + r() * 40, '#132b1a', '#241a10', r);
      // capanna storta
      blocks(ctx, W * 0.32, g - 110, 200, 110, '#4a3a28', 10, r, 0.18);
      const steps = 5;
      for (let i = 0; i < steps; i++) {
        const rw = 240 - 240 * (i / steps);
        blocks(ctx, W * 0.32 + (200 - rw) / 2, g - 120 - i * 10, rw, 10, '#2e4a2e', 10, r, 0.2);
      }
      ctx.fillStyle = '#241a10'; ctx.fillRect(W * 0.32 + 80, g - 50, 34, 50);
      ctx.fillStyle = '#8ae05a'; ctx.fillRect(W * 0.32 + 24, g - 84, 26, 26); // finestra verde magica
      ctx.fillStyle = 'rgba(138,224,90,.18)'; ctx.fillRect(W * 0.32 + 10, g - 98, 54, 54);
      // camino con fumo verde
      blocks(ctx, W * 0.32 + 150, g - 160, 22, 60, '#5a5a66', 8, r, 0.2);
      ctx.fillStyle = 'rgba(138,224,90,.35)';
      ctx.fillRect(W * 0.32 + 152, g - 180, 16, 14); ctx.fillRect(W * 0.32 + 160, g - 202, 14, 14); ctx.fillRect(W * 0.32 + 150, g - 222, 12, 12);
      blocks(ctx, 0, g, W, H - g, '#16301c', 12, r, 0.3);
      // calderone fuori
      ctx.fillStyle = '#2a2a35'; ctx.fillRect(W * 0.68, g - 26, 50, 26);
      ctx.fillStyle = '#8ae05a'; ctx.fillRect(W * 0.68 + 5, g - 32, 40, 8);
    },

    miniera(ctx, W, H) {
      const r = rng(41);
      blocks(ctx, 0, 0, W, H, '#2e2a35', 16, r, 0.25); // roccia
      blocks(ctx, 0, H - 50, W, 50, '#242030', 14, r, 0.2);
      // travi di sostegno
      for (let i = 0; i < 4; i++) {
        const x = W * 0.1 + i * W * 0.25;
        blocks(ctx, x, 30, 16, H - 80, '#4a3524', 12, r, 0.12);
        blocks(ctx, x - 30, 30, 76, 14, '#4a3524', 12, r, 0.12);
      }
      // vene di cristallo
      for (let i = 0; i < 10; i++) {
        const x = r() * W, y = 60 + r() * (H - 160);
        ctx.fillStyle = '#5ad8e0'; ctx.fillRect(x, y, 8, 8);
        ctx.fillStyle = '#a0f0f5'; ctx.fillRect(x + 2, y + 2, 4, 4);
      }
      // binari
      ctx.fillStyle = '#6e6e7a';
      ctx.fillRect(0, H - 34, W, 5); ctx.fillRect(0, H - 16, W, 5);
      ctx.fillStyle = '#4a3524';
      for (let x = 10; x < W; x += 40) ctx.fillRect(x, H - 38, 14, 32);
      // carrello
      blocks(ctx, W * 0.6, H - 80, 90, 45, '#5a4a3a', 8, r, 0.15);
      ctx.fillStyle = '#2a2a35';
      ctx.fillRect(W * 0.6 + 8, H - 36, 20, 20); ctx.fillRect(W * 0.6 + 60, H - 36, 20, 20);
      torch(ctx, W * 0.15, H * 0.4); torch(ctx, W * 0.5, H * 0.35); torch(ctx, W * 0.85, H * 0.4);
    },

    castelloEsterno(ctx, W, H) {
      const r = rng(53);
      skyGradient(ctx, W, H, '#150d24', '#3d1535', 10);
      stars(ctx, W, H, r, 40);
      moon(ctx, W * 0.5, 55, 34, '#c8b8e8', true);
      const g = H - 60;
      // ponte levatoio e fossato
      blocks(ctx, 0, g, W, H - g, '#1d1830', 12, r, 0.2);
      ctx.fillStyle = '#0f1d2e'; ctx.fillRect(0, g - 18, W, 18);
      blocks(ctx, W * 0.42, g - 20, 150, 20, '#4a3524', 10, r, 0.15);
      // mura
      blocks(ctx, W * 0.08, g - 150, W * 0.84, 132, '#3a3045', 12, r, 0.15);
      // merli
      for (let x = W * 0.08; x < W * 0.9; x += 36) blocks(ctx, x, g - 168, 20, 18, '#3a3045', 8, r, 0.15);
      // torri
      blocks(ctx, W * 0.05, g - 240, 70, 222, '#332a40', 10, r, 0.15);
      blocks(ctx, W * 0.87, g - 240, 70, 222, '#332a40', 10, r, 0.15);
      blocks(ctx, W * 0.42, g - 300, 150, 150, '#3d3350', 10, r, 0.15);
      // guglie
      const spike = (x, w, y) => { for (let i = 0; i < 5; i++) blocks(ctx, x + i * (w / 10), y - i * 10, w - i * (w / 5), 10, '#5a2035', 8, r, 0.15); };
      spike(W * 0.05, 70, g - 240); spike(W * 0.87, 70, g - 240); spike(W * 0.42, 150, g - 300);
      // finestre rosse
      ctx.fillStyle = '#e84a5a';
      ctx.fillRect(W * 0.47, g - 270, 10, 14); ctx.fillRect(W * 0.53, g - 250, 10, 14);
      ctx.fillRect(W * 0.08 + 24, g - 210, 8, 12); ctx.fillRect(W * 0.9, g - 210, 8, 12);
      // portone
      ctx.fillStyle = '#1a1020'; ctx.fillRect(W * 0.45, g - 90, 100, 72);
      ctx.fillStyle = '#0d0810';
      ctx.fillRect(W * 0.45 + 10, g - 80, 80, 62);
    },

    salaTrono(ctx, W, H) {
      const r = rng(61);
      blocks(ctx, 0, 0, W, H, '#241d33', 16, r, 0.18);
      blocks(ctx, 0, H - 60, W, 60, '#1a1428', 14, r, 0.15);
      // tappeto rosso
      blocks(ctx, W * 0.38, H * 0.35, W * 0.24, H * 0.65 - 60, '#6e1525', 12, r, 0.15);
      // colonne
      for (const fx of [0.12, 0.3, 0.7, 0.88]) {
        blocks(ctx, W * fx - 16, 20, 32, H - 80, '#3a3050', 10, r, 0.12);
        blocks(ctx, W * fx - 24, 10, 48, 16, '#4a3f6b', 10, r, 0.1);
        blocks(ctx, W * fx - 24, H - 76, 48, 16, '#4a3f6b', 10, r, 0.1);
      }
      // trono
      blocks(ctx, W * 0.44, H * 0.3, W * 0.12, H * 0.34, '#1d1d28', 8, r, 0.12);
      blocks(ctx, W * 0.42, H * 0.24, W * 0.16, 20, '#f5c542', 8, r, 0.1);
      ctx.fillStyle = '#f5c542';
      ctx.fillRect(W * 0.44, H * 0.24 - 14, 10, 14); ctx.fillRect(W * 0.495, H * 0.24 - 22, 10, 22); ctx.fillRect(W * 0.55, H * 0.24 - 14, 10, 14);
      // candelabri fluttuanti con fuoco viola
      for (const fx of [0.2, 0.5, 0.8]) {
        ctx.fillStyle = '#f0f0e8'; ctx.fillRect(W * fx - 4, 46, 8, 20);
        ctx.fillStyle = '#a06ae0'; ctx.fillRect(W * fx - 7, 34, 14, 14);
        ctx.fillStyle = '#d8b8f5'; ctx.fillRect(W * fx - 3, 38, 6, 8);
      }
      // vetrata
      ctx.fillStyle = '#3d1030'; ctx.fillRect(W * 0.46, 30, W * 0.08, H * 0.16);
      ctx.fillStyle = '#e84a5a'; ctx.fillRect(W * 0.47, 40, W * 0.06, H * 0.05);
      ctx.fillStyle = '#8a35b8'; ctx.fillRect(W * 0.47, 40 + H * 0.06, W * 0.06, H * 0.05);
    },

    cripta(ctx, W, H) {
      const r = rng(71);
      blocks(ctx, 0, 0, W, H, '#1d1a26', 16, r, 0.22);
      blocks(ctx, 0, H - 50, W, 50, '#14121c', 14, r, 0.18);
      // archi
      for (const fx of [0.2, 0.5, 0.8]) {
        blocks(ctx, W * fx - 60, H * 0.25, 24, H * 0.6, '#2e2a3d', 10, r, 0.15);
        blocks(ctx, W * fx + 36, H * 0.25, 24, H * 0.6, '#2e2a3d', 10, r, 0.15);
        blocks(ctx, W * fx - 60, H * 0.18, 120, 24, '#2e2a3d', 10, r, 0.15);
      }
      // sarcofagi
      blocks(ctx, W * 0.12, H - 100, 130, 50, '#3a3548', 8, r, 0.15);
      blocks(ctx, W * 0.68, H - 100, 130, 50, '#3a3548', 8, r, 0.15);
      // candele verdi
      for (const fx of [0.1, 0.35, 0.62, 0.9]) {
        ctx.fillStyle = '#f0f0e8'; ctx.fillRect(W * fx, H * 0.5, 6, 14);
        ctx.fillStyle = '#5fe08a'; ctx.fillRect(W * fx - 2, H * 0.5 - 10, 10, 10);
      }
      // ragnatele
      ctx.strokeStyle = 'rgba(200,200,220,.25)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(60, 50); ctx.moveTo(30, 0); ctx.lineTo(60, 50); ctx.moveTo(0, 30); ctx.lineTo(60, 50); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(W, 0); ctx.lineTo(W - 60, 50); ctx.moveTo(W - 30, 0); ctx.lineTo(W - 60, 50); ctx.moveTo(W, 30); ctx.lineTo(W - 60, 50); ctx.stroke();
    },

    ballo(ctx, W, H) {
      const r = rng(83);
      blocks(ctx, 0, 0, W, H, '#2a1d33', 16, r, 0.15);
      blocks(ctx, 0, H - 60, W, 60, '#3d2a1d', 12, r, 0.12); // parquet
      // lampadario
      ctx.fillStyle = '#f5c542';
      ctx.fillRect(W * 0.5 - 3, 0, 6, 30);
      ctx.fillRect(W * 0.5 - 50, 30, 100, 8);
      for (const dx of [-50, -25, 0, 25, 44]) {
        ctx.fillStyle = '#f0f0e8'; ctx.fillRect(W * 0.5 + dx, 20, 6, 12);
        ctx.fillStyle = '#f5e042'; ctx.fillRect(W * 0.5 + dx - 2, 12, 10, 10);
      }
      // tende
      blocks(ctx, 0, 0, 50, H - 60, '#5a1525', 10, r, 0.15);
      blocks(ctx, W - 50, 0, 50, H - 60, '#5a1525', 10, r, 0.15);
      // tavolo banchetto
      blocks(ctx, W * 0.62, H - 130, 260, 16, '#5d4530', 10, r, 0.12);
      ctx.fillStyle = '#4a3524'; ctx.fillRect(W * 0.64, H - 114, 12, 54); ctx.fillRect(W * 0.85, H - 114, 12, 54);
      // cibo
      ctx.fillStyle = '#e84a5a'; ctx.fillRect(W * 0.65, H - 146, 22, 16);
      ctx.fillStyle = '#f5c542'; ctx.fillRect(W * 0.72, H - 142, 30, 12);
      ctx.fillStyle = '#c85ae0'; ctx.fillRect(W * 0.8, H - 144, 18, 14);
      // ospiti mascherati (silhouette)
      for (let i = 0; i < 5; i++) {
        const x = W * 0.12 + i * W * 0.1, hgt = 60 + r() * 14;
        ctx.fillStyle = i % 2 ? '#1d1428' : '#241a30';
        ctx.fillRect(x, H - 60 - hgt, 26, hgt);
        ctx.fillStyle = '#f0e8d8'; ctx.fillRect(x + 4, H - 60 - hgt + 6, 18, 8); // maschera
      }
    },

    vetta(ctx, W, H) {
      const r = rng(97);
      skyGradient(ctx, W, H, '#0d0a1f', '#4a1540', 12);
      stars(ctx, W, H, r, 70);
      // eclissi grande
      moon(ctx, W * 0.5, H * 0.28, 55, '#e8e0f0', true);
      ctx.fillStyle = 'rgba(232,74,90,.12)';
      ctx.fillRect(0, 0, W, H);
      // vetta della torre
      const g = H - 40;
      blocks(ctx, W * 0.2, g - 30, W * 0.6, 70, '#2e2a3d', 12, r, 0.15);
      for (let x = W * 0.2; x < W * 0.8; x += 40) blocks(ctx, x, g - 48, 22, 18, '#2e2a3d', 8, r, 0.15);
      // altare
      blocks(ctx, W * 0.44, g - 80, W * 0.12, 50, '#1d1d28', 8, r, 0.12);
      // la Corona di Mezzanotte che fluttua
      const cx = W * 0.5 - 20, cy = g - 130;
      ctx.fillStyle = '#f5c542';
      ctx.fillRect(cx, cy + 10, 40, 10);
      ctx.fillRect(cx, cy, 8, 10); ctx.fillRect(cx + 16, cy - 6, 8, 16); ctx.fillRect(cx + 32, cy, 8, 10);
      ctx.fillStyle = '#e84a5a'; ctx.fillRect(cx + 18, cy + 12, 5, 5);
      ctx.fillStyle = 'rgba(245,197,66,.18)'; ctx.fillRect(cx - 14, cy - 20, 68, 50);
      // fulmini viola
      ctx.strokeStyle = '#a06ae0'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(W * 0.5, cy - 20); ctx.lineTo(W * 0.44, H * 0.2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(W * 0.5, cy - 20); ctx.lineTo(W * 0.58, H * 0.15); ctx.stroke();
    },

    alba(ctx, W, H) {
      const r = rng(101);
      skyGradient(ctx, W, H, '#3a5a8a', '#f5a05a', 12);
      // sole che sorge
      moon(ctx, W * 0.5, H * 0.62, 44, '#f5e042', false);
      ctx.fillStyle = 'rgba(245,224,66,.2)'; ctx.fillRect(0, H * 0.5, W, H * 0.3);
      const g = H - 70;
      blocks(ctx, 0, g - 40, W, 40, '#2a4a2e', 12, r, 0.2);
      house(ctx, W * 0.08, g, 100, 80, '#a8825a', '#8a4030', r, false);
      house(ctx, W * 0.72, g, 110, 85, '#b09068', '#7a5a40', r, false);
      blocks(ctx, 0, g, W, H - g, '#3d6a3a', 12, r, 0.25);
      // bandierine festa
      ctx.strokeStyle = '#3a2a18'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(W * 0.15, g - 90); ctx.lineTo(W * 0.75, g - 100); ctx.stroke();
      const cols = ['#e84a5a', '#f5c542', '#5a9de0', '#5fca6a', '#c85ae0'];
      for (let i = 0; i < 12; i++) {
        ctx.fillStyle = cols[i % cols.length];
        const x = W * 0.15 + i * (W * 0.6 / 12), y = g - 90 - (i * 10 / 12);
        ctx.fillRect(x, y, 10, 14);
      }
    },
  };

  // Disegna una scena per location, con eventuali eroi in campo
  function paint(canvasId, locationKey, heroKeys = null) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    const W = canvas.width, H = canvas.height;
    const painter = painters[locationKey] || painters.strada;
    painter(ctx, W, H);
    if (heroKeys && heroKeys.length) {
      heroesRow(ctx, W, H - 8, heroKeys, 3);
    }
  }

  return { paint, painters, rng, blocks, shade, heroesRow };
})();
