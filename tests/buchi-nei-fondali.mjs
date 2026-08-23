/* ============ BUCHI NEI FONDALI ============
   Trova le zone di uno sfondo che il gioco non copre: il riquadro della scena ha fondo
   NERO, quindi un pixel non dipinto si vede nero e il cervello lo legge come contenuto
   (un vicolo fra due case, un'ombra, la lontananza in fondo a una strada).

   COPIA. L'originale sta in ../dnd-motore/tools/; qui ci vuole una copia perché ogni
   repo di gioco deve stare in piedi da sola (la CI gira nel repo). Se si corregge, si
   corregge là e si ricopia in tutti e cinque.

   SECONDA STESURA, e la ragione conta. La prima misurava la copertura con un contesto
   FINTO che registrava solo i fillRect e ne sommava l'alfa: un modello, non un disegno.
   Ha trovato difetti veri (una fessura di 52×160 fra due case, una fascia mai dipinta
   nell'ultima immagine di un gioco), ma ha anche cominciato a segnalare come scoperti
   tre fondali che a occhio sono pieni — perché il modello non sa cosa fa `blocks()`
   quando dipinge una texture a chiazze semitrasparenti su un fondo opaco.
   Due misure che si contraddicono sono peggio di una misura sola (lezione 64), e fra le
   due quella giusta è ovvia: adesso si DISEGNA per davvero con `tela.mjs` — lo stesso
   rasterizzatore che produce i PNG che si guardano — e si legge l'alfa vera. */

import { Tela } from './tela.mjs';

const SCOPERTO = 0.08;   // trasparenza residua oltre la quale il nero del riquadro passa

/* Le macchie scoperte, per grandezza. Flood fill a quattro direzioni sui pixel. */
function macchie(residua, W, H, sogliaPixel, latoMin) {
  const visto = new Uint8Array(residua.length);
  const scoperto = i => residua[i] > SCOPERTO;
  const pila = new Int32Array(residua.length);
  const fuori = [];
  for (let i = 0; i < residua.length; i++) {
    if (!scoperto(i) || visto[i]) continue;
    let n = 0, minX = W, maxX = -1, minY = H, maxY = -1, peggio = 0, cima = 0;
    pila[cima++] = i; visto[i] = 1;
    while (cima) {
      const j = pila[--cima];
      const x = j % W, y = (j - x) / W;
      n++;
      if (residua[j] > peggio) peggio = residua[j];
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
      if (x > 0 && scoperto(j - 1) && !visto[j - 1]) { visto[j - 1] = 1; pila[cima++] = j - 1; }
      if (x < W - 1 && scoperto(j + 1) && !visto[j + 1]) { visto[j + 1] = 1; pila[cima++] = j + 1; }
      if (y > 0 && scoperto(j - W) && !visto[j - W]) { visto[j - W] = 1; pila[cima++] = j - W; }
      if (y < H - 1 && scoperto(j + W) && !visto[j + W]) { visto[j + W] = 1; pila[cima++] = j + W; }
    }
    const w = maxX - minX + 1, h = maxY - minY + 1;
    if (n >= sogliaPixel && Math.min(w, h) >= latoMin) {
      fuori.push({ pixel: n, x: minX, y: minY, w, h, maiDipinto: peggio > 0.98, copertura: 1 - peggio });
    }
  }
  return fuori.sort((a, b) => b.pixel - a.pixel);
}

/* Il nero pieno: (0,0,0) opaco. Quasi sempre non è una scelta ma un colore CALCOLATO
   male — shade() ridà 'rgb(...)', blocks() richiama shade() sul colore che riceve, e
   shade('rgb(58,58,66)') fa parseInt('gb(...)',16) = NaN, NaN>>16&255 = 0: nero valido,
   che nessun controllo sui colori sballati può vedere. Ma il nero voluto esiste (la
   stiva di un relitto a quarantacinque metri), quindi è un avviso e non un errore. */
function neroPieno(tela) {
  const px = tela.px;
  let n = 0;
  for (let i = 0; i < tela.width * tela.height; i++) {
    if (px[i * 4 + 3] > 0.9 && px[i * 4] < 0.5 && px[i * 4 + 1] < 0.5 && px[i * 4 + 2] < 0.5) n++;
  }
  return n;
}

/* painters: l'oggetto Scenes.painters. Ritorna [{ nome, buchi, nero }] per i fondali con
   almeno una macchia oltre soglia (o un errore).
   sogliaPixel: quanti pixel scoperti fanno una macchia che si vede (default 700).
   latoMin: e quanto deve essere spessa (default 9 px). */
export function cercaBuchi(painters, { W = 960, H = 360, sogliaPixel = 700, latoMin = 9,
                                       salta = ['titolo'], setDepth = null } = {}) {
  const esito = [];
  for (const [nome, fn] of Object.entries(painters)) {
    if (salta.includes(nome)) continue;
    const tela = new Tela(W, H);
    if (setDepth) setDepth(0);
    try { fn(tela.getContext(), W, H); } catch (e) { esito.push({ nome, errore: e.message }); continue; }
    const buchi = macchie(tela.trasparenza(), W, H, sogliaPixel, latoMin);
    const nero = neroPieno(tela);
    if (buchi.length) esito.push({ nome, buchi, nero });
  }
  return esito;
}

/* Il nero pieno di tutti i fondali, per l'avviso separato. */
export function cercaNeroPieno(painters, { W = 960, H = 360, soglia = 500,
                                           salta = ['titolo'], setDepth = null } = {}) {
  const fuori = [];
  for (const [nome, fn] of Object.entries(painters)) {
    if (salta.includes(nome)) continue;
    const tela = new Tela(W, H);
    if (setDepth) setDepth(0);
    try { fn(tela.getContext(), W, H); } catch { continue; }
    const n = neroPieno(tela);
    if (n > soglia) fuori.push({ nome, pixel: n });
  }
  return fuori.sort((a, b) => b.pixel - a.pixel);
}
