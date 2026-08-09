/* ============ SPRITES — pixel art procedurale ============
   Ogni sprite è una mappa di caratteri 16x16. Ogni carattere è un colore
   nella palette dello sprite. '.' = trasparente.                        */

const Sprites = (() => {

  function drawSprite(ctx, map, palette, x, y, scale, flip = false) {
    const h = map.length, w = map[0].length;
    for (let r = 0; r < h; r++) {
      for (let c = 0; c < w; c++) {
        const ch = map[r][flip ? w - 1 - c : c];
        if (ch === '.') continue;
        const col = palette[ch];
        if (!col) continue;
        ctx.fillStyle = col;
        ctx.fillRect(x + c * scale, y + r * scale, scale, scale);
      }
    }
  }

  function renderToCanvas(canvas, spriteDef, bg = '#181428') {
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const scale = Math.floor(Math.min(canvas.width, canvas.height) / 16);
    const off = Math.floor((canvas.width - scale * 16) / 2);
    drawSprite(ctx, spriteDef.map, spriteDef.palette, off, off, scale);
  }

  /* ---------- EROI (16x16) ---------- */

  // Torvald — guerriero nano, barba rossa, elmo
  const torvald = {
    palette: { s:'#e8b88a', b:'#c14b2a', B:'#8f341c', m:'#8a8f9e', M:'#b8bec9', d:'#5a5f6e', a:'#6e4a2a', g:'#f5c542', e:'#2a2a35', w:'#fff' },
    map: [
      '....mmmmmmmm....',
      '...mMMMMMMMMm...',
      '..mMMmmmmmmMMm..',
      '..mmssssssssmm..',
      '..ssswsesewsss..',
      '..ssssssssssss..',
      '..sbbbbbbbbbbs..',
      '..bbBbbbbbbBbb..',
      '..bBBBbbbbBBBb..',
      '..bBBBBBBBBBBb..',
      '...dddddddddd...',
      '..ddadaggaddd d.'.replace(' ',''),
      '..ddaddggddadd..',
      '..dddddddddddd..',
      '...aaa....aaa...',
      '...aaa....aaa...',
    ].map(r => r.padEnd(16,'.').slice(0,16)),
  };

  // Lyra — maga elfa, cappello viola, capelli argento
  const lyra = {
    palette: { s:'#f0cfa8', h:'#d8d8ea', p:'#7a4ad8', P:'#5a35a8', g:'#f5c542', e:'#3a7ad8', d:'#3a3050', w:'#fff', k:'#2a2a35' },
    map: [
      '.......pp.......',
      '......pppp......',
      '.....pppppp.....',
      '....pPpppPpp....',
      '..ppppppppppp p.'.replace(' ',''),
      '.pPPPPPPPPPPPPp.',
      '...hhssssssh h..'.replace(' ',''),
      '...hswsesews h..'.replace(' ',''),
      '...hssssssss....',
      '...hhsskksshh...',
      '....ddddddd d...'.replace(' ',''),
      '...dddgddddd....',
      '...ddddddgdd....',
      '...ddddddddd....',
      '....dd....dd....',
      '....dd....dd....',
    ].map(r => r.padEnd(16,'.').slice(0,16)),
  };

  // Fizzle — ladro halfling, cappuccio verde, sorriso furbo
  const fizzle = {
    palette: { s:'#e8b88a', v:'#3d7a3d', V:'#2a5a2a', e:'#2a2a35', d:'#4a4035', g:'#f5c542', w:'#fff', k:'#c14b2a' },
    map: [
      '....vvvvvvvv....',
      '...vvVVVVVVvv...',
      '..vvVssssssVvv..',
      '..vVsswsewssVv..',
      '..vVsssssessVv..',
      '..vVsskkkkssVv..',
      '...vssssssssv...',
      '....vvvvvvvv....',
      '...ddddddddd d..'.replace(' ',''),
      '..ddgdddddddgd..',
      '..dddddvvddddd..',
      '..ddddvvvvdddd..',
      '...dddddddddd...',
      '...ddd....ddd...',
      '....dd....dd....',
      '................',
    ].map(r => r.padEnd(16,'.').slice(0,16)),
  };

  // Brunilde — chierica, velo bianco, simbolo sole
  const brunilde = {
    palette: { s:'#d8a878', v:'#f0f0f5', V:'#c8c8d5', e:'#3a2a20', g:'#f5c542', d:'#e8e8f0', D:'#b8b8c8', w:'#fff', r:'#c14b2a' },
    map: [
      '....vvvvvvvv....',
      '...vvvvvvvvvv...',
      '..vvVVVVVVVVvv..',
      '..vVssssssssVv..',
      '..vVswsessws Vv.'.replace(' ',''),
      '..vVssssssssVv..',
      '..vVsssrrsssVv..',
      '...vssssssssv...',
      '...ddddddddd d..'.replace(' ',''),
      '..ddddDggDdddd..',
      '..dddDDggDDddd..',
      '..ddddDggDdddd..',
      '..dddddddddddd..',
      '..dddddddddddd..',
      '...ddd....ddd...',
      '................',
    ].map(r => r.padEnd(16,'.').slice(0,16)),
  };

  // Kael — ranger mezzelfo, capelli neri, mantello verde scuro
  const kael = {
    palette: { s:'#e0b890', h:'#1a1a22', v:'#2a4a35', V:'#1d3525', e:'#4a9a5a', d:'#3a3528', g:'#f5c542', w:'#fff', b:'#6e4a2a', k:'#4a3528' },
    map: [
      '....hhhhhhhh....',
      '...hhhhhhhhhh...',
      '..hhhssssssHh h.'.replace('H','h').replace(' ',''),
      '..hhswsesews h..'.replace(' ',''),
      '...hssssssss h..'.replace(' ',''),
      '...hsssssss h...'.replace(' ',''),
      '....ssskks s....'.replace(' ',''),
      '...vvvvvvvvv....',
      '..vvVVVVVVVvv b.'.replace(' ',''),
      '..vVVdddddVVvbb.',
      '..vVdddgdddVvb..',
      '..vVdddddddVvb..',
      '...vdddddddv.b..',
      '...ddd...ddd.b..',
      '...ddd...ddd....',
      '................',
    ].map(r => r.padEnd(16,'.').slice(0,16)),
  };

  // Zonk — barbaro mezzorco, pelle verde, cresta
  const zonk = {
    palette: { s:'#7aa85a', S:'#5d8a42', h:'#2a2a22', e:'#e8d84a', d:'#8a5a35', D:'#6e4525', w:'#fff', t:'#f0f0e8', g:'#f5c542' },
    map: [
      '.......hh.......',
      '......hhhh......',
      '..s...hhhh...s..',
      '..ss.sssssss ss.'.replace(' ',''),
      '..sswsesewss ss.'.replace(' ',''),
      '..ssssssssssss..',
      '..sstssssssts s.'.replace(' ',''),
      '..sSttssssttSs..',
      '...sssssssss s..'.replace(' ',''),
      '..ddDDddddDDd d.'.replace(' ',''),
      '..dddDddddDdd d.'.replace(' ',''),
      '..ddddddddddd d.'.replace(' ',''),
      '..sdddddddddds..',
      '..s.ddd..ddd.s..',
      '....ddd..ddd....',
      '................',
    ].map(r => r.padEnd(16,'.').slice(0,16)),
  };

  /* ---------- NEMICI ---------- */

  const goblin = {
    palette: { s:'#6a9a4a', S:'#4d7a35', e:'#e84a4a', d:'#5a4a35', t:'#e8e0d0', w:'#fff' },
    map: [
      '................',
      '..s..........s..',
      '..ss........ss..',
      '..sssssssssss s.'.replace(' ',''),
      '..sSssssssssSs..',
      '..sesssssssses..',
      '..ssssseesssss..',
      '..sssstttts ss..'.replace(' ',''),
      '...ssssssss s...'.replace(' ',''),
      '...ddddddddd....',
      '..ddddddddddd...',
      '..ddddddddddd...',
      '...ddddddddd....',
      '...dd.....dd....',
      '...ss.....ss....',
      '................',
    ].map(r => r.padEnd(16,'.').slice(0,16)),
  };

  const wolf = {
    palette: { f:'#5a5a6a', F:'#3d3d4a', e:'#e8d84a', t:'#f0f0e8', n:'#1a1a22' },
    map: [
      '................',
      '................',
      '..F.........F...',
      '..FF.......FF...',
      '..FFFFFFFFFFF...',
      '..FfffffffffF...',
      '..FeffffffefF...',
      '..FfffffffffFF..',
      '..FffttttfffFFF.',
      '...FFffffFF..FF.',
      '..FFFFFFFFFF.F..',
      '..FffffffffF....',
      '..FfFF..FFfF....',
      '..FfF....FfF....',
      '..nn......nn....',
      '................',
    ].map(r => r.padEnd(16,'.').slice(0,16)),
  };

  const skeleton = {
    palette: { b:'#e8e8dc', B:'#c0c0b0', e:'#1a1a22', r:'#8a2a2a', d:'#4a4a55' },
    map: [
      '....bbbbbbbb....',
      '...bbbbbbbbbb...',
      '..bbBBBBBBBBbb..',
      '..bbeBBBBBBebb..',
      '..bbBBBBBBBBbb..',
      '..bbBeeeeeeBbb..',
      '...bbbbbbbbbb...',
      '....b.bbbb.b....',
      '...bbbbbbbbbb...',
      '..b.bBBBBBBb.b..',
      '..b.bbbbbbbb.b..',
      '..b.bBBBBBBb.b..',
      '....bbb..bbb....',
      '....bb....bb....',
      '....bb....bb....',
      '................',
    ].map(r => r.padEnd(16,'.').slice(0,16)),
  };

  const ragno = {
    palette: { c:'#2a2a35', C:'#1a1a22', e:'#e84a4a', h:'#4a3a5a' },
    map: [
      '................',
      '................',
      '..c..........c..',
      '...c...cc...c...',
      '..c.c.cccc.c.c..',
      '...ccccccccc c..'.replace(' ',''),
      '..cchcceecchcc..',
      '.c.cccceeccc.c..',
      '.c..cccccccc..c.',
      '.c.cCCCCCCCc.c..',
      '..ccCCCCCCCcc...',
      '.c..cCCCCCc..c..',
      '.c...ccccc...c..',
      '..c...ccc...c...',
      '................',
      '................',
    ].map(r => r.padEnd(16,'.').slice(0,16)),
  };

  const bandito = {
    palette: { s:'#d8a878', k:'#3a3a45', K:'#2a2a32', e:'#e8e8f0', d:'#5a3525', g:'#8a8f9e' },
    map: [
      '....kkkkkkkk....',
      '...kkkkkkkkkk...',
      '..kkKKKKKKKKkk..',
      '..kKssssssssKk..',
      '..kKKeKKKKeKKk..',
      '..kKKKKKKKKKKk..',
      '..kKsssssss sKk.'.replace(' ',''),
      '...kkkkkkkkkk...',
      '...dddddddddd...',
      '..dddddddddddg..',
      '..ddkddddddkdgg.',
      '..dddddddddddg..',
      '...dddddddddd...',
      '...ddd....ddd...',
      '...kk......kk...',
      '................',
    ].map(r => r.padEnd(16,'.').slice(0,16)),
  };

  const fungo = {
    palette: { c:'#c85ae0', C:'#9a35b8', t:'#e8d8f0', e:'#f5c542', s:'#d8c8e0', m:'#8a6aa8' },
    map: [
      '.....cccccc.....',
      '...cccccccccc...',
      '..cctccccctcc c.'.replace(' ',''),
      '..ccccctcccccc..',
      '.cctcccccccctcc.',
      '.cccccccccccccc.',
      '.CCCCCCCCCCCCCC.',
      '...ssssssssss...',
      '...sesssssses...',
      '...ssssssssss...',
      '...ssmmmmmmss...',
      '...ssssssssss...',
      '....ssssssss....',
      '....ss....ss....',
      '....mm....mm....',
      '................',
    ].map(r => r.padEnd(16,'.').slice(0,16)),
  };

  const gerbold = {
    palette: { b:'#e8e8dc', B:'#c0c0b0', e:'#5ad8e0', k:'#1d1d28', K:'#2e2e3d', g:'#f5c542', p:'#f0f0f5' },
    map: [
      '....bbbbbbbb....',
      '...bbbbbbbbbb...',
      '..bbBBBBBBBBbb..',
      '..bbeBBBBBBebb..',
      '..bbBBBBBBBBbb..',
      '..bbBeeeeeeBbb..',
      '...bbbbbbbbbb...',
      '..kkkkkppkkkkk..',
      '..kKKKKppKKKKk..',
      '..kKkKKppKKkKk..',
      '..kKKKKggKKKKk..',
      '..kKKKKKKKKKKk..',
      '..kkkkkkkkkkkk..',
      '...kkk....kkk...',
      '...bb......bb...',
      '................',
    ].map(r => r.padEnd(16,'.').slice(0,16)),
  };

  const vesper = {
    palette: { s:'#e8e0f0', h:'#1a1a22', c:'#8a1a2a', C:'#5a0f1a', e:'#e84a4a', k:'#1d1d28', g:'#f5c542', w:'#fff', t:'#f0f0e8' },
    map: [
      '....hhhhhhhh....',
      '...hhhhhhhhhh...',
      '..hhhssssss hh..'.replace(' ',''),
      '..hhsesssesh h..'.replace(' ',''),
      '..hhssssssshh...',
      '..hhsstssts hh..'.replace(' ',''),
      '...hsssssssh....',
      '..cccccccccccc..',
      '.ccCCCCCCCCCCcc.',
      '.cCCkkkkkkkkCCc.',
      '.cCkkkgkkgkkkCc.',
      '.cCkkkkkkkkkkCc.',
      '.cCCkkkkkkkkCCc.',
      '..cckkkkkkkkcc..',
      '...ckk....kkc...',
      '....kk....kk....',
    ].map(r => r.padEnd(16,'.').slice(0,16)),
  };

  const nonnaOrtica = {
    palette: { s:'#c8e0a8', v:'#4a6a3a', V:'#354d28', e:'#e8d84a', h:'#d8d8ea', d:'#5a4a6a', g:'#f5c542', w:'#fff' },
    map: [
      '.......vv.......',
      '......vvvv......',
      '.....vvvvvv.....',
      '....vvvvvvvv....',
      '..vvvvvvvvvvvv..',
      '.vVVVVVVVVVVVVv.',
      '...hhssssss hh..'.replace(' ',''),
      '...hswsesswsh...',
      '...hsssssssh....',
      '...hhssssshh....',
      '....dddddddd....',
      '...dddgddddd....',
      '...dddddddd d...'.replace(' ',''),
      '...dddddddd d...'.replace(' ',''),
      '....dd....dd....',
      '................',
    ].map(r => r.padEnd(16,'.').slice(0,16)),
  };

  const pipistrello = {
    palette: { c:'#3a3045', C:'#241d2e', e:'#e84a4a', t:'#e8e0d0' },
    map: [
      '................',
      '................',
      '..c.........c...',
      '..cc.......cc...',
      '..ccc..c..ccc...',
      '..cccccccccc c..'.replace(' ',''),
      '.cccCCcccCCcc c.'.replace(' ',''),
      '.ccCCCceecCCCcc.',
      '.ccCCccccccCCcc.',
      '..cccctcctcccc..',
      '...cc.cccc.cc...',
      '...c...cc...c...',
      '................',
      '................',
      '................',
      '................',
    ].map(r => r.padEnd(16,'.').slice(0,16)),
  };

  const biscotto = { // il tasso di Kael
    palette: { f:'#4a4a55', F:'#2e2e38', t:'#f0f0e8', e:'#1a1a22', n:'#1a1a22' },
    map: [
      '................',
      '................',
      '................',
      '..F.........F...',
      '..FFFFFFFFFFF...',
      '..FtFFFFFFtFF...',
      '..FteFFFFetFF...',
      '..FttFFFFttFFF..',
      '..FFFttttFFFFFF.',
      '...FFFFFFFFF.FF.',
      '..FFFFFFFFFFF...',
      '..FffffffffF....',
      '..FtF....FtF....',
      '..nn......nn....',
      '................',
      '................',
    ].map(r => r.padEnd(16,'.').slice(0,16)),
  };

  const anguilla = {
    palette: { c:'#3a6a7a', C:'#2a4d5a', e:'#e8d84a', t:'#8ad8e0', f:'#5a9aab' },
    map: [
      '................',
      '................',
      '....cccc........',
      '...cccccc.......',
      '..cceccccc......',
      '..ccccccccc.....',
      '..cctcccCCcc....',
      '...ccccccCCcc...',
      '....fcccccCCc c.'.replace(' ',''),
      '......cccccCCc..',
      '....ccccccccCc..',
      '...ccCCCCcccc...',
      '..ccCC..CCcc....',
      '..cc......cc....',
      '...c............',
      '................',
    ].map(r => r.padEnd(16,'.').slice(0,16)),
  };

  const spiritoFiume = {
    palette: { s:'#a8d8e8', S:'#78b8d0', e:'#1a3a4a', w:'#e8f5f8', d:'#4a8aa0' },
    map: [
      '.....ssssss.....',
      '....ssssssss....',
      '...sSssssssSs...',
      '...sseSssSess...',
      '...ssssssssss...',
      '...sssSwwSsss...',
      '....ssssssss....',
      '...ssssssssss...',
      '..sSssssssssSs..',
      '..ssssssssssss..',
      '..sSssssssssSs..',
      '...ssssssssss...',
      '...sS.ssss.Ss...',
      '....s..ss..s....',
      '.....s.ss.s.....',
      '................',
    ].map(r => r.padEnd(16,'.').slice(0,16)),
  };

  // Berenice, la capra apocalittica
  const capra = {
    palette: { w:'#e8e4d8', W:'#c8c2b0', e:'#e8a020', h:'#8a8070', p:'#c8a0a8', n:'#2a2a22' },
    map: [
      '................',
      '..h..........h..',
      '..hh...ww...hh..',
      '...hwwwwwwwwh...',
      '...wwewwwwew w..'.replace(' ',''),
      '...wwwwwwwwww...',
      '....wwwppww w...'.replace(' ',''),
      '.....Wwwww W....'.replace(' ',''),
      '...WWwwwwwwWW...',
      '..WwwwwwwwwwwW..',
      '..Wwwwwwwwwww W.'.replace(' ',''),
      '..WwwwwwwwwwwW..',
      '...Www....wwW...',
      '...ww......ww...',
      '...nn......nn...',
      '................',
    ].map(r => r.padEnd(16,'.').slice(0,16)),
  };

  // Bertoldo, il traghettatore fantasma (cappello a tesa larga)
  const bertoldo = {
    palette: { s:'#a8d8e8', S:'#78b8d0', h:'#4a3a28', H:'#5d4a35', e:'#1a3a4a', w:'#e8f5f8', g:'#6a8a98' },
    map: [
      '....hhhhhhhh....',
      '...hhhhhhhhhh...',
      '.hhHHHHHHHHHHhh.',
      '.hhhhhhhhhhhhhh.',
      '....ssssssss....',
      '...sswsessws s..'.replace(' ',''),
      '...ssssssssss...',
      '...sssSggSsss...',
      '....ssssssss....',
      '...gssssssssg...',
      '..gsSssssssSsg..',
      '..gssssssssssg..',
      '...sSssssssSs...',
      '....ssssssss....',
      '.....s.ss.s.....',
      '................',
    ].map(r => r.padEnd(16,'.').slice(0,16)),
  };

  // Gastone Piccone, nano custode (variante cromatica del guerriero nano)
  const gastone = {
    palette: { s:'#e8b88a', b:'#9a9a8a', B:'#6e6e5d', m:'#5d4a35', M:'#6e5a42', d:'#4a4a3a', a:'#3a3a2e', g:'#c8c8b8', e:'#2a2a35', w:'#fff' },
    map: torvald.map,
  };

  const registry = {
    torvald, lyra, fizzle, brunilde, kael, zonk,
    goblin, wolf, skeleton, ragno, bandito, fungo, gerbold, vesper,
    nonnaOrtica, pipistrello, biscotto,
    anguilla, spirito_fiume: spiritoFiume,
    capra, bertoldo, gastone,
  };

  return { drawSprite, renderToCanvas, registry };
})();
