/* ============ LA CORONA DI MEZZANOTTE — campagna completa ============
   Formato scena:
   { id, location, caption, text, choices: [...], combat: {...} }
   Formato scelta:
   { text, tag?, next?, check?, sets?, requires?, gold?, item?, removeItem?, once? }
   check: { stat, dc, success, fail, groupBonusItem? }
   requires: { flag?, notFlag?, item?, notItem? }                       */

const ITEMS = {
  pozione_cura:       { name: 'Pozione di Cura', desc: 'Ripristina 10 PV. Usabile in combattimento.', usable: true, heal: 10 },
  pozione_cura_magg:  { name: 'Pozione di Cura Maggiore', desc: 'Ripristina 20 PV. Usabile in combattimento.', usable: true, heal: 20 },
  bomba_puzzolente:   { name: 'Bomba Puzzolente', desc: 'Da lancio: colpisce sempre, 2d6 danni e il bersaglio resta stordito dal tanfo (svantaggio al prossimo attacco).', combat: { dice: [2, 6], distract: true }, icon: '💣' },
  acqua_santa:        { name: 'Fiala d\'Acqua Santa', desc: 'Da lancio: colpisce sempre, 2d8 danni — DOPPI contro i non-morti. Benedetta da Pipino in persona.', combat: { dice: [2, 8], holy: true }, icon: '💧' },
  dado_destino:       { name: 'Dado del Destino', desc: 'Il d20 "fortunato" di Gedeone. UNA volta sola, permette di ritirare una prova di abilità fallita. Gedeone giura che non è truccato. Gedeone giura tante cose.', usable: false, reroll: true },
  specchio_argento:   { name: 'Specchio d\'Argento', desc: 'I vampiri non si riflettono... e ODIANO che glielo si faccia notare.', usable: false },
  aglio:              { name: 'Treccia d\'Aglio', desc: 'Contro i vampiri, dicono. Di sicuro contro i compagni di viaggio.', usable: false },
  corda:              { name: 'Corda Robusta (15 m)', desc: 'Non si sa mai. Davvero, non si sa MAI.', usable: false },
  torce:              { name: 'Torce (x4)', desc: 'Luce portatile. Nelle miniere vale oro.', usable: false },
  pozione_crepuscolo: { name: 'Pozione del Crepuscolo', desc: 'Un sorso e la barriera notturna del castello vi ignorerà.', usable: false },
  chiave_passaggio:   { name: 'Chiave del Passaggio Basso', desc: 'Apre l\'antico passaggio nanico sotto il Castello Crepuscolo.', usable: false },
  gemma_nanica:       { name: 'Gemma Nanica', desc: 'Brilla di luce azzurra. Vale un piccolo tesoro.', usable: false },
  dente_lupo:         { name: 'Dente di Lupo', desc: 'Trofeo del Crepuscolo. A Nonna Ortica serviva proprio questo.', usable: false },
  maschere:           { name: 'Maschere da Ballo', desc: 'Sei maschere eleganti "prese in prestito" per il Gran Ballo.', usable: false },
  chiave_torre:       { name: 'Chiave della Torre', desc: 'Dono di Gerbold. Apre la scala privata di Lord Morn.', usable: false },
  spartito:           { name: 'Spartito Ingiallito', desc: '"Ballata per un Re Sordo" — di Vespertino Morn. La canzone che rovinò tutto.', usable: false },
  lacrima_di_luna:    { name: 'Lacrima di Luna', desc: 'Una lacrima d\'argento che non si asciuga mai. Custodisce un ricordo felice che non è più vostro — ma nell\'ora più buia potrebbe restituirvi la luce.', usable: false },
  fischietto_di_bertoldo: { name: 'Fischietto di Bertoldo', desc: 'Un fischietto d\'ottone annerito. Richiama l\'attenzione di qualunque fantasma d\'acqua nel raggio di un fiume.', usable: false },
  provviste:          { name: 'Provviste di Bocciolo', desc: 'Pane di segale, formaggio stagionato e un sugo di famiglia dall\'ingrediente segreto. Rende i riposi più efficaci (+2 PV extra).', usable: false },
};

const CAMPAIGN = {

  /* ==================== PROLOGO ==================== */

  p1: {
    location: 'taverna',
    caption: 'Taverna "Il Gallo Storto" — Villaggio di Brindolo',
    text: `**Regno di Lumelia, giorno di mercato.**

La taverna "Il Gallo Storto" profuma di stufato e birra speziata. Voi siete seduti al tavolo grande vicino al camino: compagni di mille (va bene, tre) avventure, oggi in meritata pausa.

Fuori, il sole splende sul mercato di Brindolo. Dentro, l'oste Bocciolo — un omone con un grembiule che ha visto cose — vi riempie i boccali.

> Bocciolo: "Offre la casa! Ieri avete ritrovato la mia capra. Siete gente a posto, voi."

È il momento più tranquillo che vivrete per molto, MOLTO tempo. Godetevelo.`,
    choices: [
      { text: 'Brindate alla capra ritrovata! 🍻', next: 'p2' },
      { text: 'Chiedete a Bocciolo un\'altra porzione di stufato', next: 'p1b' },
    ],
  },

  p1b: {
    location: 'taverna',
    caption: 'Taverna "Il Gallo Storto"',
    text: `Bocciolo posa sul tavolo una zuppiera FUMANTE. Torvald l'annusa da professionista e concede un cenno d'approvazione. È il massimo complimento che Bocciolo riceverà mai.

Fuori si sente la banda del paese che accorda gli strumenti per la festa del raccolto. Un piccione si posa sul davanzale. Tutto è pace.

*Tutto è pace per ancora... tre secondi.*`,
    choices: [
      { text: 'Continua', next: 'p2' },
    ],
  },

  p2: {
    location: 'villaggio',
    caption: 'Piazza di Brindolo — mezzogiorno...?',
    text: `Succede a metà di un brindisi.

La luce che entra dalle finestre *trema*, come una candela sotto un soffio. Poi, in pieno mezzogiorno... **il sole si spegne.**

Non tramonta. Non si nasconde dietro una nuvola. Si SPEGNE, come una lanterna, lasciando nel cielo un disco nero contornato da un anello rosso sangue.

La piazza esplode nel panico. Galline ovunque. Il fornaio corre in tondo con una pagnotta in mano gridando "PERCHÉ?!". Qualcuno, in lontananza, suona una campana a caso.

> Bocciolo: *(sottovoce)* "...questo non è normale nemmeno per Brindolo."`,
    choices: [
      { text: 'Uscite in piazza a calmare la folla', tag: 'Prova di Carisma — CD 10', check: { stat: 'CAR', dc: 10, success: 'p2_calma_ok', fail: 'p2_calma_ko' } },
      { text: 'Studiate il cielo: cosa può spegnere un sole?', tag: 'Prova di Intelligenza — CD 10', check: { stat: 'INT', dc: 10, success: 'p2_studio_ok', fail: 'p2_studio_ko' } },
      { text: 'Restate calmi e finite lo stufato. Le crisi si affrontano a stomaco pieno.', next: 'p2_stufato' },
    ],
  },

  p2_calma_ok: {
    location: 'villaggio',
    caption: 'Piazza di Brindolo',
    text: `Salite sulla fontana e la vostra voce copre il caos:

**"BRINDOLO! Respirate! Nessuno è ferito, nessuno sta morendo, e il fornaio può smettere di correre!"**

Funziona. La folla si ferma, vi guarda, e si aggrappa alla vostra calma come a una zattera. Il fornaio si siede sulla sua pagnotta, esausto ma sereno.

*Il villaggio si ricorderà di voi.* **(+1 Reputazione)**`,
    rep: 1,
    choices: [{ text: 'Continua', next: 'p3' }],
  },

  p2_calma_ko: {
    location: 'villaggio',
    caption: 'Piazza di Brindolo',
    text: `Salite sulla fontana per parlare alla folla... e scivolate sul muschio, finendo seduti nell'acqua con un *SPLASH* solenne.

La piazza si ferma. Silenzio. Poi qualcuno ridacchia. Poi ridono tutti, perfino il fornaio.

Be'... tecnicamente il panico è passato. Diciamo che era il piano fin dall'inizio.`,
    choices: [{ text: 'Uscite dalla fontana con dignità. Continua', next: 'p3' }],
  },

  p2_studio_ok: {
    location: 'villaggio',
    caption: 'Piazza di Brindolo',
    text: `Osservate il disco nero. Non è una nuvola, non è un'eclissi naturale: l'anello rosso *pulsa*, con un ritmo regolare. Come un cuore. O come un **incantesimo**.

Chi di voi se ne intende riconosce i segni: magia di sangue, antica e teatrale. Qualcuno non ha *spento* il sole... l'ha **rubato**, e ha lasciato quel disco come biglietto da visita.

*Un indizio prezioso.* **(Avete capito che è opera di un incantatore)**`,
    sets: { sa_magia: true },
    choices: [{ text: 'Continua', next: 'p3' }],
  },

  p2_studio_ko: {
    location: 'villaggio',
    caption: 'Piazza di Brindolo',
    text: `Fissate il cielo con aria da esperti. Molto a lungo. Con il mento appoggiato alla mano, per rendere l'idea.

Conclusione dell'analisi: *"È diventato buio."*

Rivoluzionario. Comunque, guardare il disco nero così a lungo vi ha fatto lacrimare gli occhi. Almeno ora sapete che... no, niente, è proprio buio e basta.`,
    choices: [{ text: 'Continua', next: 'p3' }],
  },

  p2_stufato: {
    location: 'taverna',
    caption: 'Taverna "Il Gallo Storto"',
    text: `Mentre fuori il mondo impazzisce, voi finite lo stufato con la calma dei veri professionisti. Bocciolo vi guarda con ammirazione mista a terrore.

> Bocciolo: "Voi... voi siete o incoscienti o eroi."

> Torvald: *(se presente, annuisce)* "Le due cose non si escludono."

Lo stomaco pieno vi dà forza: **tutto il gruppo parte con +2 PV bonus per la prossima battaglia.** La saggezza popolare aveva ragione.`,
    sets: { stufato_bonus: true },
    choices: [{ text: 'Ora sì: uscite in piazza. Continua', next: 'p3' }],
  },

  p3: {
    location: 'villaggio',
    caption: 'Piazza di Brindolo — sotto il sole spento',
    text: `Un uomo rotondo con una fascia da sindaco e la faccia di chi ha appena invecchiato dieci anni si fa largo tra la folla: è **Bartolo Boncuore**, sindaco di Brindolo.

> Bartolo: "Eroi! Voi siete eroi, vero? Ho un DISASTRO e un corvo!"

Il corvo in questione, appollaiato sulla sua spalla, vi fissa con aria di superiorità. Alla zampa porta una pergamena sigillata con ceralacca **rosso sangue**. Bartolo la srotola con le mani che tremano:

*"A Lumelia e ai suoi villici insignificanti.
Il sole era volgare. L'ho rimosso. Stanotte, quando l'eclissi sarà completa, indosserò la **Corona di Mezzanotte** e la notte regnerà PER SEMPRE. Non è personale. Anzi no: è ESTREMAMENTE personale.
Con drammatico affetto,
**Lord Vesper Morn** ✒ (il ghirigoro della firma occupa metà pagina)"*

> Bartolo: "Vesper Morn! Il vampiro del Castello Crepuscolo! Vi prego, fermatelo: il Consiglio offre **500 monete d'oro** e una statua in piazza!"`,
    choices: [
      { text: '"Accettiamo! Per Brindolo e per il sole!"', next: 'p3_info', sets: { eroici: true } },
      { text: '"500 monete E la statua E cena gratis a vita da Bocciolo."', tag: 'Prova di Carisma — CD 13', check: { stat: 'CAR', dc: 13, success: 'p3_nego_ok', fail: 'p3_nego_ko' } },
      { text: '"Prima le domande: chi è esattamente questo Vesper Morn?"', next: 'p3_info' },
    ],
  },

  p3_nego_ok: {
    location: 'villaggio',
    caption: 'Piazza di Brindolo',
    text: `Bartolo strabuzza gli occhi, guarda la piazza buia, guarda voi, riguarda la piazza.

> Bartolo: "...e va bene! Cena gratis a vita! Bocciolo, di' di sì!"

> Bocciolo: *(da lontano)* "COSA?!"

> Bartolo: "DICE DI SÌ! E tenete... un anticipo."

Vi mette in mano una borsa. **(+50 monete d'oro subito!)** Sapete il fatto vostro, non c'è che dire.`,
    gold: 50,
    choices: [{ text: 'Continua', next: 'p3_info' }],
  },

  p3_nego_ko: {
    location: 'villaggio',
    caption: 'Piazza di Brindolo',
    text: `> Bartolo: *(improvvisamente molto sindaco)* "Cari eroi, il bilancio comunale è già in rosso per la sagra della zucca. 500 monete, statua, e la mia eterna gratitudine. Prendere o lasciare."

Il corvo emette un verso che suona sospettosamente come una risata.

Va bene, va bene. 500 monete. E la statua. Che comunque non è male, come pacchetto.`,
    choices: [{ text: '"Affare fatto." Continua', next: 'p3_info' }],
  },

  p3_info: {
    location: 'villaggio',
    caption: 'Piazza di Brindolo',
    text: `Bartolo racconta ciò che tutti sanno — e che nessuno racconta volentieri:

**Lord Vesper Morn**, il vampiro del **Castello Crepuscolo**, sulle montagne a nord. Duecento anni di "vicinato tranquillo": qualche pecora sparita, lamenti teatrali nelle notti di tempesta, il classico. Nessuno l'ha mai visto davvero arrabbiato.

> Bartolo: "Ma c'è un problema, eroi. Il castello è protetto dalla **Barriera Notturna**: un muro di ombra solida. Frecce, arieti, insulti: rimbalza tutto."

Si gratta la testa.

> Bartolo: "Due sole speranze. **Nonna Ortica**, la strega del Bosco dei Sussurri: se c'è una pozione che passa quella barriera, lei sa farla. Oppure le **Miniere di Ferrovecchio**: i nani che le scavarono costruirono anche le cantine del castello... e si dice che un passaggio segreto li colleghi ancora."

> Bartolo: "Ah, e... l'eclissi si completa a **mezzanotte**. Avrete tempo per UNA sola strada. Scegliete bene."`,
    choices: [
      { text: 'Prima di partire: fate provviste in paese', next: 'v1' },
    ],
  },

  /* ==================== ATTO 1 — BRINDOLO ==================== */

  v1: {
    location: 'villaggio',
    caption: 'Brindolo — ultimi preparativi',
    text: `La piazza è illuminata da lanterne accese in pieno "giorno". Avete poco tempo, ma partire impreparati sarebbe da dilettanti. E voi siete professionisti. Più o meno.

Dove andate?`,
    hub: true,
    choices: [
      { text: '🧪 L\'emporio di Gedeone — pozioni e attrezzatura', next: 'v_emporio', once: true },
      { text: '👵 La vecchia Mirtilla — dicono sappia TUTTO di tutti', next: 'v_mirtilla', once: true },
      { text: '⛪ Il tempietto del Sole — una benedizione non guasta', next: 'v_tempio', once: true },
      { text: '🐐 Bocciolo irrompe in piazza: "BERENICE È SPARITA! DI NUOVO!"', next: 'q_capra1', once: true },
      { text: '🐦‍⬛ Il corvo di Vesper è ancora appollaiato sulla fontana. Vi FISSA.', next: 'q_corvo1', once: true },
      { text: '🐴 Si parte! Verso nord, verso il Castello Crepuscolo!', next: 'v2' },
    ],
  },

  /* ---------- il corvo Amleto ---------- */

  q_corvo1: {
    location: 'villaggio',
    caption: 'La fontana di Brindolo — un corvo con opinioni',
    text: `Il corvo che ha consegnato la lettera di Vesper non se n'è andato. Se ne sta appollaiato sulla fontana, e vi osserva con un'aria che non è da uccello: è da CRITICO. Uno di quelli delle prime file, che prende appunti.

Quando vi avvicinate, inclina la testa e — giurereste — *alza un sopracciglio*. I corvi non hanno sopracciglia. Questo se l'è procurato apposta.

> Bartolo: *(di passaggio, sottovoce)* "Quella bestiaccia è qui da stamattina. Ha rifiutato il pane di tre fornai diversi. TRE. Con motivazioni, mi è parso di capire."

Il corvo gracchia qualcosa che suona sospettosamente come una recensione. C'è di sicuro qualcosa di strano in lui — e chissà cosa sa del suo padrone.`,
    choices: [
      { text: '🧠 Osservatelo bene: cosa NON torna in questo corvo?', tag: 'Prova di Intelligenza — CD 11', check: { stat: 'INT', dc: 11, success: 'q_corvo_ok', fail: 'q_corvo_ko' } },
      { text: '🗣 Parlategli con rispetto, da pubblico a critico', tag: 'Prova di Carisma — CD 11', check: { stat: 'CAR', dc: 11, success: 'q_corvo_ok', fail: 'q_corvo_ko' } },
    ],
  },

  q_corvo_ok: {
    location: 'villaggio',
    caption: 'Amleto, ex critico musicale',
    text: `Ci arrivate: il portamento teatrale, il disprezzo per il pane scadente, il modo in cui gracchia in PENTAMETRI. Questo non è un corvo. È — o meglio, ERA — una persona.

Al vostro sguardo di comprensione, il corvo si scioglie in un gracchiare fiume che, con un po' di fantasia e molto contesto, si lascia interpretare:

> Corvo: "CRA! Cra-cra... CRA!" *(traduzione libera: "FINALMENTE! Duecento anni che nessuno lo capisce!")*

Mettendo insieme i gesti, i graffi sul bordo della fontana (ci ha INCISO delle note!) e il suo indicare insistente verso nord, la storia emerge: si chiamava **Amleto Dellacroce**, critico musicale della corte. Fu LUI, duecento anni fa, a stroncare per iscritto la Ballata per un Re Sordo — "un'opera avanti di due secoli, purtroppo eseguita con due secoli di ritardo", scrisse. Il neonato vampiro lo maledisse trasformandolo in corvo... e poi, non sapendo che farsene, lo assunse come postino.

> Corvo: *(gracchiando piano, quasi triste)* "Cra... cra." *(traduzione: "La ballata era BUONA. Era l'ESECUZIONE, il problema. Nessuno stronca l'anima: si stronca la serata.")*

**(Avete scoperto il passato di Vesper — e che perfino il suo critico più feroce ne riconosceva il talento. Questo, lassù, può valere oro.)**`,
    sets: { sa_passato_bardo: true, sa_corvo: true },
    choices: [
      { text: 'Amleto vi fa un inchino d\'ala. Tornate in piazza', next: 'v1' },
    ],
  },

  q_corvo_ko: {
    location: 'villaggio',
    caption: 'Incomprensioni ornitologiche',
    text: `Il vostro approccio parte con le migliori intenzioni e finisce come ogni conversazione con un critico: male.

Qualcuno prova con "chi è un bel corvetto?", e il corvo si IRRIGIDISCE come se aveste applaudito tra un movimento e l'altro di una sinfonia. Qualcun altro gli offre una briciola di pane raccolto da terra, e il corvo la esamina, la respinge con la zampa, e gracchia tre note secche che non serve un traduttore per capire: *"da due su dieci"*.

Poi si volta dall'altra parte, offesissimo, e finge di ammirare il panorama.

> Bartolo: *(di passaggio)* "Ci avete provato. Con quello lì hanno fallito in tanti. Dicono che il fornaio del '48 ci sia rimasto secco, dopo la recensione."

Il corvo vi concede un ultimo sguardo — deluso ma non sorpreso, il peggiore degli sguardi — e torna a fissare il nord.`,
    choices: [
      { text: 'Ritirata dignitosa. Tornate in piazza', next: 'v1' },
    ],
  },

  v_emporio: {
    location: 'taverna',
    caption: 'Emporio "Da Gedeone — Tutto per l\'Avventura (e per la Fine del Mondo)"',
    text: `Gedeone, un gnomo con occhialini spessi come fondi di bottiglia, ha già cambiato l'insegna: *"SALDI DI FINE DEL MONDO"*.

> Gedeone: "Eroi! Il sindaco paga per voi l'essenziale: una **pozione di cura per ciascuno**, offre il comune!" *(consegna le pozioni)* "Poi avrei tre pezzi speciali, a prezzo, ehm, 'd'emergenza'..."

Sul bancone: una **corda robusta** (10 oro), delle **torce** (10 oro), e — Gedeone abbassa la voce — uno **specchio d'argento** (25 oro): *"Sa, i vampiri e gli specchi... vecchia storia, mai smentita."* C'è anche una **treccia d'aglio** (2 oro), ma quella la vende con un sorrisetto.

Dallo scaffale "ARTICOLI PER LA GUERRA CHIMICA (legalissimi)": **bombe puzzolenti** (12 oro l'una, *"invenzione mia: formaggio dei trolls stagionato in scatola"*) e **fiale d'acqua santa** (15 oro, *"benedette dal piccolo Pipino: potenti, il ragazzo ci crede DAVVERO"*).`,
    onEnterOnce: { itemEach: 'pozione_cura' },
    hub: true,
    choices: [
      { text: '💰 Comprate la corda (10 oro)', requiresGold: 10, gold: -10, item: 'corda', once: true },
      { text: '💰 Comprate le torce (10 oro)', requiresGold: 10, gold: -10, item: 'torce', once: true },
      { text: '💰 Comprate lo specchio d\'argento (25 oro)', requiresGold: 25, gold: -25, item: 'specchio_argento', once: true },
      { text: '💰 Comprate l\'aglio (2 oro). Non si sa mai.', requiresGold: 2, gold: -2, item: 'aglio', once: true },
      { text: '💣 Comprate una bomba puzzolente (12 oro)', requiresGold: 12, gold: -12, item: 'bomba_puzzolente' },
      { text: '💧 Comprate una fiala d\'acqua santa (15 oro)', requiresGold: 15, gold: -15, item: 'acqua_santa' },
      { text: '🎲 Comprate il "Dado del Destino" (25 oro) — Gedeone strizza l\'occhio', requiresGold: 25, gold: -25, item: 'dado_destino', once: true },
      { text: '↩ Tornate in piazza', next: 'v1' },
    ],
  },

  v_mirtilla: {
    location: 'taverna',
    caption: 'La casa della vecchia Mirtilla',
    text: `Mirtilla ha novantatré anni, una sedia a dondolo e la memoria di un archivio reale. Vi squadra da capo a piedi.

> Mirtilla: "Vesper Morn, eh? Ah, i giovani. Nessuno si ricorda più niente. Sedetevi, che vi racconto una storia."

*Duecento anni fa*, al castello non viveva un vampiro, ma un giovane bardo di corte: **Vespertino Morn**. Ambizioso, vanitoso, bravino — ma non quanto credeva. Alla festa d'estate cantò per il vecchio Re la sua opera magna: la *"Ballata per un Re Sordo"*. Titolo infelice. Esecuzione peggiore.

> Mirtilla: "Il Re rise. La corte rise. TUTTO IL REGNO rise. Vespertino fuggì sulle montagne giurando che un giorno il mondo intero avrebbe ascoltato la sua musica... nel silenzio di una notte senza fine. Poi al castello arrivò *qualcosa*, e Vespertino non fu mai più visto. Al suo posto: Lord Vesper Morn."

Vi fissa con occhi lucidissimi.

> Mirtilla: "I mostri, ragazzi miei, non nascono mostri. Ricordatevelo, lassù. E se proprio dovete combatterlo... *un artista ferito vuole una cosa sola: l'applauso che non ha mai avuto.*"

Fruga in un baule e vi mette in mano un foglio ingiallito: lo **spartito originale** della *Ballata per un Re Sordo*. "Lo conservavo io. Non chiedete come. Ero giovane, lui era... be', un disastro affascinante."

**(Avete scoperto il passato segreto di Vesper Morn — e avete il suo spartito!)**`,
    sets: { sa_passato_bardo: true },
    item: 'spartito',
    choices: [
      { text: 'La ringraziate e le baciate la mano. Tornate in piazza', next: 'v1' },
    ],
  },

  v_tempio: {
    location: 'villaggio',
    caption: 'Tempietto del Sole — Brindolo',
    text: `Il tempietto del Sole è minuscolo e adorabile, con un mosaico dorato che ora, senza sole, sembra fissare il cielo con aria offesa.

Il chierico del villaggio, un ragazzino di nome Pipino che è chierico da MARTEDÌ, vi accoglie nel panico più totale.

> Pipino: "È il mio quarto giorno! Il manuale non dice NIENTE su cosa fare se il sole si spegne! Ho controllato l'indice!"

Vi guardate. Qualcuno gli posa una mano sulla spalla. Pipino tira un respiro, apre il libro delle preghiere alla prima pagina a caso e vi benedice con tutta la sincerità del mondo.

Sorprendentemente... *funziona*. Una tenue luce dorata vi avvolge. **(Benedizione dell'Alba: nel combattimento finale, tutto il gruppo avrà +1 a tutti i tiri!)**`,
    sets: { benedizione: true },
    choices: [
      { text: '"Grazie, Pipino. Sei un grande." Tornate in piazza', next: 'v1' },
    ],
  },

  /* ---------- side-quest: Berenice, la capra sparita ---------- */

  q_capra1: {
    location: 'taverna',
    caption: 'Taverna "Il Gallo Storto" — un\'emergenza di capra',
    text: `Siete ancora tra un ultimo boccale e l'altro, prima della partenza verso nord, quando la porta della taverna sbatte contro il muro con un TONFO che fa sobbalzare perfino gli avventori più distratti.

È Bocciolo. Grembiule storto, occhi sgranati, fiato corto come dopo una maratona in salita.

> Bocciolo: "BERENICE! È SPARITA! DI NUOVO! Proprio ORA, con questo buio che non si vede il naso davanti alla faccia!"

Vi guardate. *Ancora* la capra. Berenice è di famiglia — era della nonna di Bocciolo — e da allora fa anche da sveglia ufficiale del quartiere, belando puntualissima ogni alba. Peccato che l'alba, al momento, sia sospesa a tempo indeterminato.

> Bocciolo: "Senza il suo belato nessuno si sveglierà MAI PIÙ! O peggio, si sveglieranno tutti insieme quando deciderò io di suonare la campana a mano — ed è un potere che NON voglio avere, sui miei vicini!"

Vi supplica con gli occhi da cane bastonato. Avete ancora un po' di tempo prima di partire verso nord. Un po', non tanto.`,
    choices: [
      { text: '🔦 Cercate le tracce di Berenice nel buio', tag: 'Prova di Saggezza — CD 10', check: { stat: 'SAG', dc: 10, success: 'q_capra2', fail: 'q_capra1_tracce_ko' } },
    ],
  },

  q_capra1_tracce_ko: {
    location: 'villaggio',
    caption: 'Piazza di Brindolo — tracce (quasi) perse',
    text: `Vi accovacciate, esaminate il terreno con aria da esperti tracciatori... e seguite con grande sicurezza un sentiero di impronte che si rivela, dieci minuti dopo, quello del maiale del vicino. Il maiale vi fissa, visibilmente offeso di essere scambiato per una capra.

Sul punto di arrendervi, un dettaglio vi salva: un batuffolo di lana bianca impigliato in una grondaia, e un inconfondibile odore di capra proveniente da... sopra le vostre teste. LETTERALMENTE sopra le vostre teste.

Alzate lo sguardo verso il tempietto del Sole.`,
    choices: [
      { text: 'Alzate lo sguardo...', next: 'q_capra2' },
    ],
  },

  q_capra2: {
    location: 'tempietto',
    npc: [{ key: 'capra', x: 0.5, y: 0.333, scale: 4 }],
    caption: 'Il tetto del tempietto — un déjà-vu',
    text: `Là, in equilibrio perfetto sul colmo del tetto del tempietto del Sole, tra le tegole e il mosaico dorato ora imbronciato, c'è **Berenice**: la capra di Bocciolo, sagoma nera contro l'anello rosso dell'eclissi, che fissa il cielo spento con aria di sfida assoluta. Come se il sole l'avesse offesa personalmente.

Non parla — è una capra — ma le OPINIONI, quelle, le ha eccome: vi guarda uno a uno, vi valuta, e sembra concludere che nessuno di voi è degno di un salvataggio dignitoso.

> Bocciolo: *(da terra, mani nei capelli)* "È la TERZA volta che succede, quest'anno! Come diavolo ci arriva, lassù?! Non ci sono scale! Non ci sono appigli! Quella capra ha stretto un patto con qualcosa di innominabile, ne sono certo!"

Pipino il chierico, capitato lì per caso, si fa il segno del sole e se ne va in fretta, borbottando qualcosa sui "misteri che il manuale non copre".

Due strade, per farla scendere.`,
    choices: [
      { text: '🧗 Arrampicatevi fin lassù', tag: 'Prova di Destrezza — CD 11', check: { stat: 'DES', dc: 11, success: 'q_capra_salvata', fail: 'q_capra2_ko' } },
      { text: '🥕 Attiratela con del cibo (con astuzia: cosa mangerebbe MAI una capra apocalittica?)', tag: 'Prova di Intelligenza — CD 10', check: { stat: 'INT', dc: 10, success: 'q_capra_salvata', fail: 'q_capra2_ko' } },
      { text: '🗣 Attiratela con del cibo (con fascino: parlatele come si parla a una dama)', tag: 'Prova di Carisma — CD 10', check: { stat: 'CAR', dc: 10, success: 'q_capra_salvata', fail: 'q_capra2_ko' } },
    ],
  },

  q_capra2_ko: {
    location: 'tempietto',
    npc: [{ key: 'capra', x: 0.5, y: 0.333, scale: 4 }],
    caption: 'Il tetto del tempietto — tentativo maldestro',
    text: `Che sia l'appiglio che si sbriciola sotto una mano di troppo, o l'offerta di cibo che Berenice giudica personalmente insultante con un solo sguardo laterale, il risultato è lo stesso: qualcuno finisce seduto per terra con la schiena a pezzi. **(-2 PV)**

Berenice, dall'alto, osserva l'intera scena senza muovere un muscolo. Poi sbatte le palpebre, lentamente, con un disprezzo che nessuna creatura sprovvista di sopracciglia dovrebbe essere in grado di esprimere.

> Bocciolo: "Vi sta GIUDICANDO. Lo fa sempre. È il suo momento preferito della giornata."

Va bene. Riprovate, stavolta con più metodo — e con QUALSIASI cosa aveste in tasca: una capra apocalittica, si scopre, mangia letteralmente TUTTO. Un torsolo di mela, la lista della spesa di qualcuno, un bottone smarrito. Basta insistere, e soprattutto farlo insieme.`,
    damage: 2,
    choices: [
      { text: 'Riprovate, tutti insieme stavolta', next: 'q_capra_salvata' },
    ],
  },

  q_capra_salvata: {
    location: 'taverna',
    npc: ['capra'],
    caption: 'Taverna "Il Gallo Storto" — capra recuperata',
    text: `Berenice si lascia infine convincere a scendere — con la dignità intatta e l'aria di chi vi sta facendo un favore enorme — e trotterella verso Bocciolo come se niente fosse. Lui la stringe in un abbraccio che lei sopporta con pazienza quasi regale.

> Bocciolo: *(con le lacrime agli occhi)* "L'avete ritrovata. DI NUOVO. Non so nemmeno come ringraziarvi... anzi, sì, lo so."

Sparisce in cucina e torna con una **pozione di cura** e un sacco pesante, che vi consegna con solennità quasi religiosa.

> Bocciolo: "Le **Provviste di Bocciolo**. Ricetta di famiglia, la stessa che tengo sotto il bancone per le emergenze VERE. Non chiedetemi cosa c'è dentro. Mangiatele e basta, quando ne avrete bisogno."

Berenice vi osserva un'ultima volta dalla soglia, mastica qualcosa che probabilmente non dovrebbe mangiare, e vi concede — a modo suo — un cenno che potrebbe essere approvazione. O disprezzo attenuato. Con lei è sempre difficile dirlo.

**(Berenice è salva. Di nuovo. Per ora. +1 Reputazione!)**`,
    item: 'pozione_cura',
    item2: 'provviste',
    sets: { capra_salvata: true },
    rep: 1,
    choices: [
      { text: 'Tornate ai preparativi', next: 'v1' },
    ],
  },

  /* ---------- viaggio e imboscata ---------- */

  v2: {
    location: 'ponte',
    npc: ['goblin', 'goblin_capo', 'goblin'],
    caption: 'La Strada del Nord — ore 15:00, buio pesto',
    text: `Lasciate Brindolo tra gli applausi (e qualche singhiozzo) dei paesani. La strada del nord si inoltra tra colline e boschi, sotto un cielo nero trapunto di stelle confuse — anche loro convinte che sia notte.

Dopo un'ora di marcia, un ponticello di legno. E sul ponticello... **tre goblin**. Uno di loro regge un cartello scritto a mano: *"SIOPERO... SCOPERO... FERMI TUTI"*.

> Gruk: "ALT! Io Gruk, capo-delegato dei **Goblin Riuniti del Turno di Notte**! Da quando sole spento, noi lavorare turno di notte NO-STOP! Non pagati! Voi pagare pedaggio di solidarietà: **20 monete**!"

I tre goblin incrociano le braccia. Uno di loro sbadiglia vistosamente.`,
    choices: [
      { text: '⚔ "L\'unico pedaggio che pagheremo è in LEGNATE." (combattete!)', next: 'v2_fight' },
      { text: '💰 Pagate le 20 monete. La solidarietà è importante.', requiresGold: 20, gold: -20, next: 'v2_paga' },
      { text: '🗣 "Gruk, ragioniamo: è VESPER che vi sfrutta. Il nemico è lui!"', tag: 'Prova di Carisma — CD 12', check: { stat: 'CAR', dc: 12, success: 'v2_sindacato', fail: 'v2_fight_insulted' } },
      { text: '💪 Vi fate GRANDI e ringhiate. Tutti insieme.', tag: 'Prova di Forza — CD 13', check: { stat: 'FOR', dc: 13, success: 'v2_paura', fail: 'v2_fight_insulted' } },
      { text: '🤝 "Controproposta: 35 monete e ci fate da GUIDE fino al bivio."', requiresGold: 35, gold: -35, next: 'v2_guide' },
    ],
  },

  v2_guide: {
    location: 'ponte',
    npc: ['goblin', 'goblin_capo', 'goblin'],
    caption: 'La Carovana del Sindacato',
    text: `Gruk conta le monete due volte, le morde una a una ("procedura standard"), poi si volta verso l'assemblea:

> Gruk: "Compagni! Proposta di lavoro REGOLARE: scorta turistica, tariffa piena, mancia non esclusa! Chi è a favore?"

Tre zampe si alzano all'istante. Mai visto un sindacato deliberare così in fretta.

Il viaggio fino al bivio diventa un'esperienza che nessuna guida stamperebbe mai: i goblin conoscono OGNI scorciatoia ("di qua il fango è solo fino al ginocchio!"), ogni pianta commestibile ("questa no. questa NO. questa sì ma poi si vede il futuro e non è mai bello"), e soprattutto ogni pettegolezzo del regno.

> Gruk: "...e al castello, capito, stasera GRANDE festa mascherata. Ospiti da tutto il regno! E il ponte levatoio ovest, catena rotta da anni. Vesper tirchio. MAI fare il tirchio coi ponti levatoi."

Vi lasciano al Bivio della Civetta con una stretta di zampa ciascuno e un volantino ("GOBLIN TOUR — si accettano prenotazioni"). Onestamente? Soldi ben spesi.

**(Informazioni sul Gran Ballo ottenute, e siete arrivati riposati: +3 PV a tutti!)**`,
    sets: { sa_ballo: true },
    heal: 3,
    rep: 1,
    choices: [{ text: 'Al Bivio della Civetta', next: 'v3' }],
  },

  v2_fight: {
    location: 'ponte',
    npc: ['goblin', 'goblin_capo', 'goblin'],
    caption: 'Il Ponticello — IMBOSCATA!',
    text: `> Gruk: "SCIOPERO SELVAGGIO!"

I goblin estraggono mazze chiodate decorate con adesivi rivendicativi. Si combatte!

*(Primo combattimento! Niente paura: il gioco vi guida turno per turno.)*`,
    combat: {
      enemies: ['goblin', 'goblin', 'goblin_capo'],
      victory: 'v2_vittoria',
      defeat: 'sconfitta_generica',
      loot: { gold: 15 },
    },
  },

  v2_fight_insulted: {
    location: 'ponte',
    npc: ['goblin', 'goblin_capo', 'goblin'],
    caption: 'Il Ponticello — trattativa fallita',
    text: `> Gruk: *(offeso)* "Tu... tu parlare come PADRONE! ASSEMBLEA STRAORDINARIA! Ordine del giorno: BOTTE!"

La diplomazia è fallita. I goblin caricano!`,
    combat: {
      enemies: ['goblin', 'goblin', 'goblin_capo'],
      victory: 'v2_vittoria',
      defeat: 'sconfitta_generica',
      loot: { gold: 15 },
    },
  },

  v2_vittoria: {
    location: 'ponte',
    npc: ['goblin'],
    caption: 'Il Ponticello — dopo la battaglia',
    text: `I goblin giacciono a terra emettendo lamenti sindacalmente coordinati. Gruk, con un occhio nero, alza una zampa:

> Gruk: "Ok, ok... assemblea deliberare: RITIRATA STRATEGICA."

I tre si trascinano via nel buio. Nella fretta, hanno abbandonato la cassa del sindacato: **15 monete d'oro** e un volantino che dice *"VESPER MORN NON PAGA GLI STRAORDINARI"*.

Interessante: perfino i suoi goblin lo detestano.`,
    choices: [{ text: 'Proseguite verso nord', next: 'v3' }],
  },

  v2_paga: {
    location: 'ponte',
    npc: ['goblin', 'goblin_capo', 'goblin'],
    caption: 'Il Ponticello',
    text: `Contate le 20 monete nella zampa tesa di Gruk, che le esamina professionalmente e vi rilascia perfino una **ricevuta** (scritta su una foglia).

> Gruk: "Voi lavoratori onesti! Gruk dare informazione bonus: al castello, Lord Vesper fare grande FESTA stanotte. Ospiti mascherati da tutto il regno! Voi con maschera... entrare facile facile."

I goblin vi salutano col pugno alzato. **(Informazione preziosa sul Gran Ballo!)**`,
    sets: { sa_ballo: true },
    choices: [{ text: 'Proseguite verso nord', next: 'v3' }],
  },

  v2_sindacato: {
    location: 'ponte',
    npc: ['goblin', 'goblin_capo', 'goblin'],
    caption: 'Il Ponticello — assemblea straordinaria',
    text: `Parlate col cuore in mano: gli straordinari non pagati, i turni di notte eterni, un datore di lavoro che LETTERALMENTE ha spento il sole senza consultare i dipendenti...

I goblin si consultano fitto fitto. Poi Gruk si volta, con una lacrimuccia:

> Gruk: "Voi... voi CAPIRE Gruk. Assemblea vota: SCIOPERO CONTRO VESPER! Voi passare gratis. E Gruk dire segreto: stanotte al castello grande FESTA mascherata, tanti ospiti! E ponte levatoio ovest ha catena arrugginita, rotta da anni. Vesper tirchio, mai riparata!"

I goblin vi scortano oltre il ponte cantando un inno di lotta stonatissimo. **(Informazioni preziose ottenute! +1 Reputazione)**`,
    sets: { sa_ballo: true },
    rep: 1,
    choices: [{ text: 'Proseguite verso nord', next: 'v3' }],
  },

  v2_paura: {
    location: 'ponte',
    npc: ['goblin', 'goblin_capo', 'goblin'],
    caption: 'Il Ponticello',
    text: `Vi gonfiate come gatti arrabbiati. Chi ringhia, chi fa scrocchiare le nocche, chi solleva un masso con noncuranza fischiettando.

I goblin vi guardano. Guardano le loro mazze. Rifanno il conto dei rapporti di forza.

> Gruk: "...assemblea delibera PAUSA PRANZO! Anticipata! Molto anticipata!"

Spariscono nel sottobosco a velocità ammirevole, lasciando cadere il cartello dello sciopero. Passate il ponte da trionfatori.`,
    choices: [{ text: 'Proseguite verso nord', next: 'v3' }],
  },

  /* ---------- IL BIVIO ---------- */

  v3: {
    location: 'strada',
    caption: 'Il Bivio della Civetta — ore 18:00',
    text: `La strada si divide sotto una vecchia quercia dove una civetta vi osserva con l'aria di chi ne ha viste tante.

Il cartello di legno indica tre direzioni (la terza è stata aggiunta a mano, con una grafia tremolante):

⬅ **BOSCO DEI SUSSURRI** — *"Casa di Nonna Ortica. Se gli alberi parlano, non rispondete."*
La strega può preparare la **Pozione del Crepuscolo** per attraversare la Barriera Notturna.

➡ **MINIERE DI FERROVECCHIO** — *"Chiuso per pensionamento. Suonare forte."*
Nelle profondità si nasconde il **passaggio segreto** dei nani, dritto alle cantine del castello.

⬇ **MOLO DEL VECCHIO SALICE** — *"Il Fiume Torbido passa SOTTO il castello. Chiedere di Bertoldo. Portare pazienza."*
Si dice che un traghettatore fantasma conosca la via d'acqua fino alle cisterne di Crepuscolo.

Sopra di voi, l'anello rosso dell'eclissi si sta stringendo. Mezzanotte si avvicina: **c'è tempo per una sola strada.** Discutetene: è una delle decisioni più importanti dell'avventura.`,
    choices: [
      { text: '🌲 Verso il Bosco dei Sussurri, dalla strega Nonna Ortica', next: 'b1', sets: { via: 'bosco', via_bosco: true } },
      { text: '⛏ Verso le Miniere di Ferrovecchio, in cerca del passaggio', next: 'm1', sets: { via: 'miniere', via_miniere: true } },
      { text: '🛶 Verso il Molo del Vecchio Salice, sul Fiume Torbido', next: 'r1', sets: { via_fiume: true } },
    ],
  },

  /* ==================== ATTO 2A — BOSCO DEI SUSSURRI ==================== */

  b1: {
    location: 'bosco',
    caption: 'Bosco dei Sussurri — dove gli alberi spettegolano',
    text: `Il Bosco dei Sussurri merita il suo nome: le fronde *bisbigliano* al vostro passaggio. Non è il vento. Il vento non commenta il vostro taglio di capelli.

> Una voce tra le foglie: "Pssst... quello basso ha le tasche piene..."
> Un'altra voce: "Sssh! Magari sente... oh, ha sentito."

I funghi luminosi punteggiano il buio di violetto. Il sentiero per la capanna di Nonna Ortica esiste, ma il bosco — dicono — lo *sposta* quando si annoia.

Serve qualcuno con i sensi affilati per non girare in tondo fino all'alba. Che peraltro non arriverà mai, se non vi sbrigate.`,
    choices: [
      { text: '🧭 Cercate le tracce del sentiero vero', tag: 'Prova di Saggezza — CD 11', check: { stat: 'SAG', dc: 11, success: 'b2', fail: 'b1_persi' } },
      { text: '🗣 Chiedete indicazioni agli alberi. Con gentilezza.', tag: 'Prova di Carisma — CD 13', check: { stat: 'CAR', dc: 13, success: 'b1_alberi', fail: 'b1_persi' } },
    ],
  },

  b1_alberi: {
    location: 'bosco',
    caption: 'Bosco dei Sussurri',
    text: `Vi rivolgete alla quercia più anziana con un inchino perfetto:

*"Venerabile signora, sapreste indicarci la strada per la capanna di Nonna Ortica?"*

Silenzio. Poi il bosco intero ESPLODE in bisbigli entusiasti:

> "Ha detto SIGNORA!" "Che educazione!" "Nessuno ci parla mai!" "Una volta uno mi ha inciso un cuore con l'ascia, MALEDUCATO..."

I rami si spostano da soli, aprendo un corridoio di funghi luminosi diritto verso la capanna. La quercia vi congeda con una pioggia di ghiande affettuose (una in testa a Zonk, se c'è: il suo "ahia" è dolcissimo).`,
    choices: [{ text: 'Seguite il corridoio di funghi', next: 'b3_arrivo' }],
  },

  b1_persi: {
    location: 'bosco',
    caption: 'Bosco dei Sussurri — molto persi',
    text: `Un'ora dopo. Siete passati davanti allo stesso ceppo a forma di papera TRE volte. Il bosco bisbiglia risatine.

E poi vi accorgete del silenzio. I sussurri sono cessati di colpo. Anche i funghi sembrano trattenere il respiro.

Sopra di voi, tra i rami... *fili d'argento*. Spessi come corde. E in fondo ai fili, otto occhi rossi che si accendono. Poi altri otto. Poi altri otto ancora.

**RAGNI. GIGANTI.**

> Zonk: *(se presente, con un filo di voce)* "Zonk vuole andare a casa."`,
    combat: {
      enemies: ['ragno', 'ragno', 'ragno'],
      victory: 'b1_ragni_vinti',
      defeat: 'sconfitta_generica',
      loot: { gold: 10 },
    },
  },

  b1_ragni_vinti: {
    location: 'bosco',
    caption: 'Bosco dei Sussurri',
    text: `L'ultimo ragno si accartoccia con un *crunch* poco elegante. Il bosco riprende a bisbigliare, stavolta con rispetto:

> "Hanno sconfitto i ragni..." "Quelli del piano di sopra saranno FURIOSI..." "Sssh! Indica loro la strada e facciamoli sloggiare!"

Le fronde si scostano rivelando il sentiero. Tra le ragnatele trovate anche un borsello impigliato: **10 monete d'oro** (e un ex-avventuriero che non ne avrà più bisogno: gli fate un cenno di rispetto).`,
    choices: [{ text: 'Verso la capanna della strega', next: 'b3_arrivo' }],
  },

  b2: {
    location: 'bosco',
    caption: 'Bosco dei Sussurri — la Radura dei Funghi',
    text: `Tracce di passi, muschio piegato, rametti spezzati ad altezza di nonnina: il sentiero è VOSTRO. Lo seguite fino a una radura dove i funghi luminosi crescono alti come persone.

Anzi. SONO persone. Più o meno.

Il fungo più grosso e violaceo apre due occhietti gialli e sbadiglia:

> Fungo Anziano: "Ospiti! Che gioia! Che onore! Che... aspetta, aspetta. Regole del bosco: per passare dalla MIA radura, dovete rispondere al MIO indovinello. È la tradizione. Non l'ho inventata io, non prendetevela con me."

Si schiarisce la voce (i funghi hanno la voce?):

*"Non ho ali ma ogni notte volo,
non ho bocca ma rubo il sole,
più mi guardi e meno mi vedi,
sono l'ombra di ciò che credi.
**Chi sono?**"*`,
    choices: [
      { text: '"Sei l\'ECLISSI!"', next: 'b2_giusto' },
      { text: '"Sei un PIPISTRELLO!"', next: 'b2_sbagliato' },
      { text: '"Sei... un altro fungo?"', next: 'b2_sbagliato2' },
    ],
  },

  b2_giusto: {
    location: 'bosco',
    caption: 'La Radura dei Funghi',
    text: `> Fungo Anziano: "L'ECLISSI! Sì! SÌ! Nessuno lo indovina MAI! Di solito dicono 'un pipistrello' e io devo fingere di non essere deluso!"

Il fungo è così felice che rilascia una nuvola di spore dorate profumate di vaniglia. Vi sentite... riposati! **(Tutto il gruppo recupera 5 PV — e i funghi vi faranno passare sempre volentieri.)**

> Fungo Anziano: "La capanna di Ortica è dritta di là. Ditele che Gigio la saluta! Lei sa chi sono. Siamo usciti insieme, una volta. Non ha funzionato. Distanza, sapete."`,
    heal: 5,
    choices: [{ text: '"...Grazie, Gigio." Verso la capanna', next: 'b3_arrivo' }],
  },

  b2_sbagliato: {
    location: 'bosco',
    caption: 'La Radura dei Funghi',
    text: `> Fungo Anziano: *(sospiro lunghissimo)* "Un pipistrello. UN PIPISTRELLO. Dicono TUTTI 'un pipistrello'! I pipistrelli HANNO le ali! È nel testo! 'NON ho ali'! PRIMA RIGA!"

Il fungo si agita e — *POFF* — rilascia per lo stress una nuvola di spore soporifere. Vi pizzicano il naso, vi si chiudono gli occhi... La risposta era *l'eclissi*, ovviamente.

**(Lo starnuto collettivo vi costa energie: -3 PV a tutti. E i funghi ringhiosi si sono svegliati di pessimo umore!)**`,
    damage: 3,
    combat: {
      enemies: ['fungo', 'fungo', 'fungo'],
      victory: 'b2_funghi_vinti',
      defeat: 'sconfitta_generica',
    },
  },

  b2_sbagliato2: {
    location: 'bosco',
    caption: 'La Radura dei Funghi',
    text: `> Fungo Anziano: "Un ALTRO FUNGO? Che indovinello sarebbe 'indovina chi sono, sono un fungo'?! IO sono un fungo! Lo VEDI che sono un fungo! L'indovinello parlava dell'ECLISSI!"

Il fungo è così indignato che — *POFF* — rilascia una nuvola di spore urticanti, e i suoi cugini ringhiosi emergono dal terreno per difendere l'onore della famiglia.

**(-3 PV a tutti per le spore. E ora... funghi arrabbiati!)**`,
    damage: 3,
    combat: {
      enemies: ['fungo', 'fungo', 'fungo'],
      victory: 'b2_funghi_vinti',
      defeat: 'sconfitta_generica',
    },
  },

  b2_funghi_vinti: {
    location: 'bosco',
    caption: 'La Radura dei Funghi',
    text: `I funghi ringhiosi si sgonfiano con un suono da palloncino triste. Il Fungo Anziano riemerge, spettinato:

> Fungo Anziano: "Ok! Ok. Colpa mia, mi sono scaldato. È che ci tengo, all'indovinello. Passate pure. La capanna di Ortica è di là. E... non ditele di questa storia, per favore. Abbiamo un passato."`,
    choices: [{ text: 'Verso la capanna della strega', next: 'b3_arrivo' }],
  },

  b3_arrivo: {
    location: 'capanna',
    npc: ['nonnaOrtica'],
    caption: 'La Capanna di Nonna Ortica — ore 20:00',
    text: `La capanna di Nonna Ortica è esattamente come una capanna di strega dovrebbe essere: storta, coperta di muschio, con fumo VERDE che esce dal camino e un calderone che borbotta da solo in giardino.

La porta si apre prima che possiate bussare.

**Nonna Ortica** è alta un metro e un mattarello, ha una verruca strategica sul naso e occhi che vi radiografano l'anima.

> Ortica: "Il sole spento, l'eclissi rossa, e degli eroi alla mia porta. Fatemi indovinare: vi serve la **Pozione del Crepuscolo** per passare la Barriera di quel *melodrammatico* di Vesper Morn."

Rientra in casa lasciando la porta aperta. Dal fondo:

> Ortica: "Entrate! La pozione so farla in mezz'ora. Ma le streghe non lavorano GRATIS. Regola del mestiere. Il sindacato è severissimo."`,
    choices: [{ text: 'Entrate nella capanna', next: 'b3' }],
  },

  b3: {
    location: 'capanna',
    npc: ['nonnaOrtica'],
    caption: 'Dentro la capanna — tra barattoli che occhieggiano',
    text: `L'interno è un caos organizzato: barattoli etichettati ("RISATE DI BAMBINO", "MARTEDÌ ESSICCATI", "NON APRIRE — SUL SERIO"), un gatto che vi fissa e POI SI METTE A LEGGERE UN LIBRO, ed erbe appese a testa in giù.

> Ortica: "Il mio prezzo. Potete scegliere:"

> Ortica: "**Uno.** Sono duecento anni che nessuno mi fa ridere. Fatemi fare UNA risata vera — non un sorrisetto, una RISATA — e la pozione è vostra."

> Ortica: "**Due.** Mi serve un **dente di lupo del Crepuscolo** per la mia collezione. C'è un branco proprio qui fuori, sono già stati avvisati da quel pettegolo del bosco che siete qui. Sbrigativa, come soluzione, ma onesta."

Il gatto volta pagina, interessato a come andrà a finire.`,
    choices: [
      { text: '🎭 Tentate di farla ridere (scegliete la vostra gag)', next: 'b3_gag' },
      { text: '🐺 Uscite ad affrontare i lupi per il dente', next: 'b3_lupi' },
    ],
  },

  b3_gag: {
    location: 'capanna',
    npc: ['nonnaOrtica'],
    caption: 'Operazione: Far Ridere la Strega',
    text: `Duecento anni senza ridere. La posta è alta, il pubblico difficilissimo. Vi consultate in un angolo, da veri professionisti della commedia.

*(Giocatori: discutete e scegliete la vostra strategia comica!)*`,
    choices: [
      { text: '🎩 La commedia fisica: la piramide umana "Torre di Brindolo" che crolla', tag: 'Prova di Destrezza — CD 12', check: { stat: 'DES', dc: 12, success: 'b3_riso_ok', fail: 'b3_riso_meh' } },
      { text: '🎤 L\'imitazione: "Lord Vesper Morn che ordina un caffè macchiato"', tag: 'Prova di Carisma — CD 12', check: { stat: 'CAR', dc: 12, success: 'b3_riso_ok', fail: 'b3_riso_meh' } },
      { text: '🧠 La battuta colta: il paradosso del gatto che legge', tag: 'Prova di Intelligenza — CD 13', check: { stat: 'INT', dc: 13, success: 'b3_riso_ok', fail: 'b3_riso_meh' } },
    ],
  },

  b3_riso_ok: {
    location: 'capanna',
    npc: ['nonnaOrtica'],
    caption: 'MISSIONE COMPIUTA',
    text: `Silenzio.

Poi il labbro di Ortica *trema*. Le spalle sussultano. Il naso con la verruca fa un rumore tipo teiera...

**"BWAHAHAHAHAHAHAH!"**

La risata di Nonna Ortica fa tremare i barattoli, spaventa il gatto (che perde il segno del libro, e vi maledirà per sempre) e fa fiorire di colpo tutte le erbe secche appese al soffitto.

> Ortica: *(asciugandosi le lacrime)* "Duecento... duecento ANNI... oh, che meraviglia. Un patto è un patto, colombelle. LA POZIONE!"`,
    sets: { fatto_ridere_ortica: true },
    choices: [{ text: 'Continua', next: 'b4' }],
  },

  b3_riso_meh: {
    location: 'capanna',
    npc: ['nonnaOrtica'],
    caption: 'Pubblico difficile',
    text: `...il finale della gag muore nel silenzio. Ortica vi fissa, impassibile come una roccia con la verruca.

> Ortica: "Mh. Carino. Da tre su dieci. Mia cugina Gertrude ci avrebbe riso, ma lei ride anche ai funerali."

Sospira e indica la porta col mento.

> Ortica: "Piano B, tesorucci: i lupi sono in giardino. Un dente, una pozione. E magari, mentre combattete, fatemi vedere qualcosa di buffo, va'."`,
    choices: [{ text: '🐺 Uscite ad affrontare i lupi', next: 'b3_lupi' }],
  },

  b3_lupi: {
    location: 'capanna',
    caption: 'Il giardino di Ortica — ringhi nel buio',
    text: `Il branco vi aspetta tra il calderone e i cespugli di rose nere: tre **Lupi del Crepuscolo**, il pelo che sembra assorbire la luce, gli occhi come lanterne gialle.

Il capobranco ringhia. Dalla finestra, Ortica grida:

> Ortica: "Mi serve UN dente! Possibilmente un canino! E non calpestate le rose o il prossimo ingrediente lo fornite VOI!"`,
    combat: {
      enemies: ['lupo', 'lupo', 'lupo'],
      victory: 'b3_lupi_vinti',
      defeat: 'sconfitta_generica',
    },
  },

  b3_lupi_vinti: {
    location: 'capanna',
    caption: 'Il giardino di Ortica',
    text: `L'ultimo lupo guaisce e il branco si ritira nell'ombra, sconfitto con onore. Sul prato, tra l'erba: un canino perfetto, lungo come un dito. **(Dente di Lupo ottenuto!)**

Ortica esce, lo esamina controluce come un gioielliere e annuisce.

> Ortica: "Bel pezzo. E le rose sono intatte: siete promossi. Entrate, che la pozione bolle."`,
    item: 'dente_lupo',
    choices: [{ text: 'Rientrate nella capanna', next: 'b4' }],
  },

  b4: {
    location: 'capanna',
    npc: ['nonnaOrtica'],
    caption: 'La Pozione del Crepuscolo',
    text: `Mezz'ora di vapori violacei, tre bestemmie in linguaggio arcano e un "NON TOCCARE QUELLO" dopo, Nonna Ortica vi consegna una fiala che sembra contenere un pezzetto di cielo notturno, stelle comprese.

> Ortica: "**Pozione del Crepuscolo**. Un sorso a testa davanti alla Barriera, e per la magia del castello sarete *ombre tra le ombre*. Entrerete dal giardino come se foste di famiglia."

Poi vi afferra per le maniche, improvvisamente seria:

> Ortica: "Ora ascoltatemi bene, perché lo dirò una volta sola. Conoscevo Vesper *prima*. Il potere di spegnere il sole NON è suo: è della **Corona di Mezzanotte**. Lui ne è il portatore, e la corona... lo sta divorando da duecento anni. **Separatelo dalla corona e tornerà a essere solo un bardo triste con troppi mantelli.** Ve lo ricorderete?"

**(Segreto cruciale: la debolezza di Vesper è la CORONA! Nuove opzioni nello scontro finale.)**

> Ortica: "E tenete anche questa. Per il viaggio."

*(Vi lancia una Pozione di Cura Maggiore. Il gatto vi fa l'occhiolino. Inquietante.)*`,
    sets: { sa_corona: true, ha_pozione_crepuscolo: true },
    item: 'pozione_crepuscolo',
    item2: 'pozione_cura_magg',
    choices: [{ text: 'Salutate Ortica e partite verso il castello', next: 'c1' }],
  },

  /* ==================== ATTO 2B — MINIERE DI FERROVECCHIO ==================== */

  m1: {
    location: 'strada',
    caption: 'Ingresso delle Miniere di Ferrovecchio — ore 19:00',
    text: `Le Miniere di Ferrovecchio si aprono nel fianco della montagna come uno sbadiglio pietrificato. Il portone di quercia rinforzata è chiuso da tre catenacci, due lucchetti e un cartello: *"CHIUSO. PER SEMPRE. Sì, anche per te."*

Bussate. Silenzio. Bussate FORTE.

Uno spioncino si apre con uno scatto. Ne emerge un sopracciglio ENORME e un occhio sospettoso.

> Voce: "CHI SIETE? Cosa VOLETE? Chi vi MANDA? Sapete che ore SONO? No, non lo sapete, il sole è SPENTO, ah-HA!"

È **Gastone Piccone**, ultimo nano custode delle miniere. In duecento anni di solitudine, la sua paranoia ha raggiunto livelli artistici.`,
    choices: [
      { text: '🗣 "Il sindaco di Brindolo ci manda a salvare il sole. Ci serve il passaggio dei nani."', tag: 'Prova di Carisma — CD 12', check: { stat: 'CAR', dc: 12, success: 'm1_apre', fail: 'm1_test' } },
      { text: '🕳 Cercate un altro ingresso: il vecchio condotto di aerazione', tag: 'Prova di Destrezza — CD 12', check: { stat: 'DES', dc: 12, success: 'm2_condotto', fail: 'm1_caduta' } },
    ],
  },

  m1_test: {
    location: 'strada',
    caption: 'L\'interrogatorio di Gastone',
    text: `> Gastone: "Salvare il sole, eh? COMODO. È quello che direbbe una SPIA di Vesper! Ah-HA! Ma Gastone non è nato ieri! Gastone è nato 247 anni fa! DOMANDA DI SICUREZZA!"

L'occhio si stringe nello spioncino:

> Gastone: "Cosa mette un VERO nano nella birra di malto scuro?"`,
    choices: [
      { text: '"Niente! La birra di malto scuro è già perfetta!"', next: 'm1_apre_test' },
      { text: '"Del miele?"', next: 'm1_sbaglio' },
      { text: '"...altra birra?"', next: 'm1_apre_test2' },
    ],
  },

  m1_apre_test: {
    location: 'strada',
    npc: ['gastone'],
    caption: 'Le porte si aprono',
    text: `Silenzio. Poi rumore di TRE catenacci, DUE lucchetti e una sbarra.

> Gastone: *(spalancando il portone, commosso)* "NIENTE! Esatto! La risposta è NIENTE! Solo un cuore onesto lo sa! Le spie di Vesper avrebbero detto 'del miele'. IL MIELE. Nella birra scura. *Mostri.*"

Vi trascina dentro e richiude tutto a velocità impressionante.`,
    choices: [{ text: 'Continua', next: 'm2' }],
  },

  m1_apre_test2: {
    location: 'strada',
    npc: ['gastone'],
    caption: 'Le porte si aprono',
    text: `Lo spioncino resta immobile tre secondi. Poi:

> Gastone: "...ALTRA BIRRA. *Snif.* È la risposta più bella che abbia mai sentito. Tecnicamente sbagliata, ma FILOSOFICAMENTE perfetta."

Rumore di catenacci: il portone si apre su un nano con una barba fino alle ginocchia e gli occhi lucidi.

> Gastone: "Entrate, entrate. Era tanto che non parlavo con qualcuno che non fosse un piccone."`,
    choices: [{ text: 'Continua', next: 'm2' }],
  },

  m1_sbaglio: {
    location: 'strada',
    caption: 'Risposta errata',
    text: `> Gastone: "DEL MIELE?! *DEL MIELE?!* SPIE! SPIE DI VESPER! Lo sapevo! SOLO un vampiro direbbe una cosa del genere!"

Lo spioncino si chiude con uno SBAM. Seguono rumori di mobili trascinati contro la porta.

Bene. Benissimo. Resta il condotto di aerazione, lassù sulla parete: stretto, arrugginito e poco invitante. Perfetto.`,
    choices: [
      { text: '🕳 Arrampicatevi al condotto di aerazione', tag: 'Prova di Destrezza — CD 12', check: { stat: 'DES', dc: 12, success: 'm2_condotto', fail: 'm1_caduta' } },
      { text: '🪢 Usate la corda per salire in sicurezza', requires: { item: 'corda' }, next: 'm2_condotto_corda' },
    ],
  },

  m1_caduta: {
    location: 'strada',
    caption: 'Il condotto — tentativo n°1',
    text: `L'arrampicata inizia bene e finisce malissimo: la grondaia a cui vi appendete è decorativa, come scoprite a metà volo.

*CRASH.* Atterrate uno sull'altro in una pila poco dignitosa. **(-4 PV a chi ha tentato... cioè a tutti, eravate una piramide.)**

Dallo spioncino, la voce di Gastone:

> Gastone: "AH-HA! Il condotto FINTO! Funziona SEMPRE! ...aspetta. Nessuna spia sarebbe così scoordinata."

*Rumore di catenacci.*

> Gastone: "Entrate, va'. Se eravate spie, siete le peggiori che abbia mai visto. E questo mi rassicura."`,
    damage: 4,
    choices: [{ text: 'Entrate, doloranti ma dentro', next: 'm2' }],
  },

  m2_condotto: {
    location: 'miniera',
    caption: 'Dentro il condotto di aerazione',
    text: `Con l'agilità di gatti (ok, di gatti *robusti*), scalate la parete e vi infilate nel condotto uno alla volta. Dentro: buio, polvere di due secoli e un'eco che moltiplica ogni starnuto per otto.

Il condotto sbuca nel soffitto della sala principale della miniera. Da lì assistete a una scena surreale: Gastone, il nano custode, sta pattugliando la sala parlando da solo.

> Gastone: "...e se arrivano dalla porta, TRAPPOLA. E se arrivano dal condotto... eh. Ecco. Dal condotto non arriva mai nessuno."

Vi calate alle sue spalle. Si volta. Vi guarda. Guarda il condotto. Vi riguarda.

> Gastone: "...DAL CONDOTTO?! Duecento anni di piani ANTI-CONDOTTO e arrivano DAL CONDOTTO quando smetto di crederci! Va bene! VA BENE. Rispetto. Cosa volete?"`,
    choices: [{ text: '"Il passaggio segreto per il castello. E scusa per il condotto."', next: 'm2' }],
  },

  m2_condotto_corda: {
    location: 'miniera',
    caption: 'Dentro il condotto — via corda',
    text: `La corda robusta si rivela l'acquisto del secolo: rampino improvvisato, tre strattoni di collaudo e su, uno alla volta, in totale sicurezza. Perfino con stile.

Attraversate il condotto e vi calate nella sala principale, sempre con la corda, silenziosi come professionisti.

Gastone, il nano custode, è così impressionato dalla manovra che si dimentica di essere paranoico:

> Gastone: "Ma che BELLA calata. Doppia sicura, nodo barcaiolo... GENTE SERIA, finalmente! Le spie di Vesper si calano sempre malissimo. Cosa vi serve?"`,
    choices: [{ text: '"Il passaggio segreto per il castello, per favore."', next: 'm2' }],
  },

  m1_apre: {
    location: 'strada',
    npc: ['gastone'],
    caption: 'Le porte di Ferrovecchio',
    text: `Parlate con il tono giusto: fermo, onesto, con la giusta dose di "siamo tutti nella stessa barca buia".

Lo spioncino resta aperto a lungo. Poi:

> Gastone: "...il sindaco Boncuore, eh? Quello che da vent'anni mi manda gli auguri di compleanno? *Snif.* L'unico che se lo ricorda?"

TRE catenacci, DUE lucchetti, UNA sbarra: il portone si apre su un nano commosso con la barba fino alle ginocchia.

> Gastone: "Entrate, amici di Bartolo. Le miniere di Ferrovecchio sono a vostra disposizione. Occhio alla testa. E ai fantasmi. E soprattutto... alla BUROCRAZIA."

Non ha l'aria di scherzare, sull'ultima parte.`,
    choices: [{ text: 'Entrate nelle miniere', next: 'm2' }],
  },

  m2: {
    location: 'miniera',
    npc: ['gastone'],
    caption: 'Miniere di Ferrovecchio — Sala del Carrello',
    text: `Gastone vi guida per gallerie sostenute da travi antiche, tra vene di cristallo azzurro che pulsano piano nel buio.

> Gastone: "Il passaggio per il castello esiste, sì. I miei antenati scavarono le cantine di Crepuscolo, e da bravi nani si tennero un'entrata di servizio. Ma è in FONDO alla miniera, e il fondo è..." *(rabbrividisce)* "...zona UFFICI."

Arrivate a una biforcazione. A sinistra: un tunnel a piedi, lungo ma tranquillo. A destra: un binario che si tuffa nel buio con una pendenza allarmante, e sopra il binario... un carrello da miniera. UN SOLO carrello, misura famiglia.

> Gastone: "A piedi son due ore. Col carrello, dieci minuti. Il carrello però non lo usiamo dal 1847 per via dell'incidente che chiamiamo 'l'Incidente'."`,
    choices: [
      { text: '🔦 Prima: accendete le torce e frugate nel vecchio deposito accanto ai binari', requires: { item: 'torce' }, once: true, next: 'm2_deposito' },
      { text: '🛒 CARRELLO. Ovviamente carrello.', tag: 'Prova di Destrezza — CD 12 (il frenatore)', check: { stat: 'DES', dc: 12, success: 'm2_carrello_ok', fail: 'm2_carrello_ko' } },
      { text: '🚶 A piedi. Due ore di cammino non hanno mai ucciso nessuno.', next: 'm2_piedi' },
    ],
  },

  m2_deposito: {
    location: 'miniera',
    npc: ['gastone'],
    caption: 'Il vecchio deposito — luce nelle tenebre',
    text: `Le torce di Gedeone si accendono al primo colpo (ottimo acquisto!) e il deposito smette di essere un buco nero: è una stanzetta piena di casse del 1847, ragnatele monumentali e — sotto un telo ammuffito — la vecchia cassetta di pronto soccorso dei minatori.

Dentro, miracolosamente intatta: una **Pozione di Cura Maggiore** ("olio di grotta, gradazione: medica") e un borsellino con **10 monete d'oro** dimenticato da qualche capocantiere distratto.

> Gastone: "Il deposito! Certo! È che senza luce non ci entro mai, ci vive un'eco che fa i versacci."

L'eco, per la cronaca, vi fa un versaccio di saluto. Educata, comunque.`,
    item: 'pozione_cura_magg',
    gold: 10,
    choices: [{ text: '↩ Tornate ai binari', next: 'm2' }],
  },

  m2_carrello_ok: {
    location: 'miniera',
    caption: 'IL CARRELLO — 80 km/h di gloria nanica',
    text: `Vi stipate nel carrello (qualcuno in braccio a qualcun altro, non facciamo nomi, Zonk) e via!

La discesa è PURA FOLLIA: scintille dalle rotaie, cristalli che sfrecciano come stelle, un pipistrello che vi si spiaccica educatamente sul casco di Torvald. Chi è ai freni li usa con la precisione di un chirurgo: curva a destra, contro-curva, SALTO DEL BINARIO ROTTO—

*—atterraggio perfetto.*

Il carrello si ferma con eleganza al capolinea. Dietro di voi, Gastone arriva correndo con le gambe corte:

> Gastone: "MAI... *(ansima)* ...VISTO... NIENTE... DEL GENERE... L'Incidente è VENDICATO! I miei antenati vi sorridono!"

**(Siete arrivati riposati e gasatissimi: +2 PV a tutti, fino al massimo.)**`,
    heal: 2,
    choices: [{ text: 'Verso la zona uffici', next: 'm3' }],
  },

  m2_carrello_ko: {
    location: 'miniera',
    caption: 'IL CARRELLO — versione "l\'Incidente 2"',
    text: `Vi stipate nel carrello e via! La discesa è PURA FOLLIA: scintille, curve, il famoso salto del binario rotto—

Il freno viene azionato col tempismo di un applauso fuori tempo. Il carrello decolla, la fisica presenta il conto, e atterrate TUTTI in un deposito di sacchi di farina fossile del 1847.

*POFF.* Nuvola bianca. Tosse. Un elmo rotola via con dignità.

**(-3 PV a tutti, e ora sembrate sei fantasmi permalosi.)**

> Gastone: *(arrivando)* "...ecco, ESATTO, è andata ESATTAMENTE così anche nel 1847. Almeno voi siete atterrati sul morbido. Su, scrollatevi: la zona uffici è di là."`,
    damage: 3,
    choices: [{ text: 'Verso la zona uffici, bianchi come lenzuola', next: 'm3' }],
  },

  m2_piedi: {
    location: 'miniera',
    caption: 'Il tunnel lungo — due ore dopo',
    text: `Scegliete la via sicura. Due ore di cammino tra gallerie silenziose, mentre Gastone vi intrattiene con la storia COMPLETA delle miniere, inclusa la lista dei 340 tipi di roccia che ha catalogato personalmente ("...e questa è ardesia COMUNE, da non confondere con l'ardesia SPECIALE che vedremo tra quaranta minuti...").

È il viaggio più noioso della vostra vita. Ma le gambe vi hanno retto e siete tutti interi.

*(Il tempo però stringe: l'anello dell'eclissi là fuori si sta chiudendo...)*`,
    choices: [{ text: 'Finalmente: la zona uffici', next: 'm3' }],
  },

  m3: {
    location: 'miniera',
    npc: ['skeleton','skeleton'],
    caption: 'UFFICIO RECLAMI DEL SOTTOSUOLO — "Prendere il numero"',
    text: `In fondo alla miniera, dove dovrebbe esserci il passaggio segreto, trovate... una SCRIVANIA. Anzi tre, in fila, sotto un'insegna scolpita nella roccia:

**"UFFICIO RECLAMI E CONCESSIONI DEL SOTTOSUOLO — Sportello 1 di 1 (gli altri due sono chiusi)"**

Dietro le scrivanie, tre **scheletri** in maniche di camicia (come? perché? mistero) timbrano scartoffie che nessuno leggerà mai. L'eco della magia di Vesper li anima da due secoli: hanno dimenticato tutto tranne LA PROCEDURA.

Lo scheletro centrale alza il teschio e vi fissa con le orbite vuote:

> Scheletro Capoufficio: "Numerino." *(indica una macchinetta arrugginita)* "Per il passaggio serve il **Modulo 7-B**: 'Richiesta Transito Sotterraneo con Finalità di Assedio'. In triplice copia. Oppure..." *(fa scricchiolare le falangi)* "...c'è la procedura d'urgenza."

La "procedura d'urgenza", capite dal gesto, prevede legnate.`,
    choices: [
      { text: '📋 Compilate il Modulo 7-B. In triplice copia. Alla PERFEZIONE.', tag: 'Prova di Intelligenza — CD 13', check: { stat: 'INT', dc: 13, success: 'm3_modulo_ok', fail: 'm3_modulo_ko' } },
      { text: '⚔ Procedura d\'urgenza. (Combattete!)', next: 'm3_fight' },
    ],
  },

  m3_modulo_ok: {
    location: 'miniera',
    npc: ['skeleton'],
    caption: 'Trionfo burocratico',
    text: `Chi di voi ha la penna più ferma affronta il Modulo 7-B: quarantadue campi, sette firme, una marca da bollo che fabbricate al volo con cera di candela e la faccia di Zonk come sigillo.

Riga per riga. Casella per casella. PERFETTO.

Lo Scheletro Capoufficio esamina le tre copie per un tempo interminabile. Le gira. Le annusa (come?). Poi, con un gesto solenne, cala il timbrone:

**"APPROVATO."**

> Scheletro Capoufficio: "...duecento anni. Duecento anni che nessuno compila il 7-B correttamente. È il giorno più bello della mia morte." *(si asciuga un'orbita)* "SPORTELLO LIBERO! Passaggio concesso! E per la stima: prendete questa dal fondo smarriti."

Vi consegna una **Gemma Nanica** scintillante. I tre scheletri vi fanno la ola con le braccia riattaccabili. **(Passaggio ottenuto senza combattere + gemma preziosa!)**`,
    item: 'gemma_nanica',
    sets: { burocrazia_battuta: true },
    choices: [{ text: 'Oltre lo sportello, verso il passaggio', next: 'm4' }],
  },

  m3_modulo_ko: {
    location: 'miniera',
    npc: ['skeleton','skeleton'],
    caption: 'Respinto con disonore',
    text: `Quarantadue campi, sette firme... e alla casella 38 ("motivo del transito") qualcuno scrive *"per menare un vampiro"*.

Lo Scheletro Capoufficio legge. Si blocca. Il timbro cala come una ghigliottina:

**"RESPINTO. Linguaggio non conforme. Ripresentarsi tra 6-8 settimane lavorative."**

> Voi: "Non ABBIAMO 6-8 settimane! Il mondo finisce a MEZZANOTTE!"

> Scheletro Capoufficio: "Allora resta solo..." *(i tre scheletri si alzano all'unisono, facendo scricchiolare le vertebre)* "...LA PROCEDURA D'URGENZA."`,
    combat: {
      enemies: ['scheletro', 'scheletro', 'scheletro'],
      victory: 'm3_fight_win',
      defeat: 'sconfitta_generica',
    },
  },

  m3_fight: {
    location: 'miniera',
    caption: 'PROCEDURA D\'URGENZA',
    text: `Ribaltate il numerino sul bancone. I tre scheletri si alzano lentamente, sistemandosi le maniche di camicia con burocratica minaccia.

> Scheletro Capoufficio: "Farò rapporto. POSTUMO."

*(Consiglio da DM: gli scheletri sono non-morti — la Sacra Folgore di Brunilde fa danni DOPPI!)*`,
    combat: {
      enemies: ['scheletro', 'scheletro', 'scheletro'],
      victory: 'm3_fight_win',
      defeat: 'sconfitta_generica',
      loot: { gold: 12 },
    },
  },

  m3_fight_win: {
    location: 'miniera',
    caption: 'Sportello definitivamente chiuso',
    text: `L'ultimo scheletro crolla in un mucchietto ordinato di ossa e rimpianti. Il timbrone "RESPINTO" rotola ai vostri piedi: qualcuno lo intasca come trofeo.

Dietro le scrivanie, nel cassetto del capoufficio: **12 monete d'oro** di "fondo cassa" e una **Gemma Nanica** confiscata chissà quando a chissà chi.

La porta sul retro dell'ufficio si apre su una galleria che sale, sale, sale...`,
    item: 'gemma_nanica',
    choices: [{ text: 'Verso il passaggio segreto', next: 'm4' }],
  },

  m4: {
    location: 'miniera',
    npc: ['gastone'],
    caption: 'Il Passaggio Basso — capolavoro nanico',
    text: `La galleria termina davanti a una porta circolare di pietra, decorata con rune naniche e — molto meno solennemente — un tappetino che dice *"BENTORNATO (pulirsi i piedi)"*.

Gastone vi raggiunge, tira fuori da sotto la barba una chiave di ferro grande come un avambraccio e ve la consegna con entrambe le mani, cerimoniosamente.

> Gastone: "La **Chiave del Passaggio Basso**. Di là si sale dritti nelle CANTINE del Castello Crepuscolo. I miei antenati la costruirono e i vampiri non l'hanno mai trovata, perché i vampiri non puliscono MAI le cantine."

Poi vi afferra per le maniche, improvvisamente serissimo:

> Gastone: "Un'ultima cosa. Mio nonno lavorò al castello PRIMA che Vesper diventasse... Vesper. Diceva sempre: *'quel ragazzo non è cattivo, è la CORONA che è cattiva'*. La trovò lui, sapete, in uno scavo. La **Corona di Mezzanotte**. Non l'ha forgiata Vesper: l'ha TROVATA. E le cose antiche trovate negli scavi profondi..." *(rabbrividisce)* "...non si mettono IN TESTA."

**(Segreto cruciale: il potere è nella CORONA, non in Vesper! Nuove opzioni nello scontro finale.)**`,
    sets: { sa_corona: true, ha_passaggio: true },
    item: 'chiave_passaggio',
    choices: [{ text: 'Ringraziate Gastone e imboccate il passaggio', next: 'c1' }],
  },


  /* ==================== ATTO 2C — IL FIUME ==================== */

  r1: {
    location: 'fiume',
    caption: 'Il Molo del Vecchio Salice — sul Fiume Torbido',
    text: `Il sentiero che si stacca dal Bivio della Civetta scende ripido tra le canne, fino a un molo di legno marcio che sembra tenersi in piedi per pura cocciutaggine. Sopra di voi, un salice ENORME — la corteccia rugosa come pelle antica — allunga un ramo come per stringervi la mano.

> Il Vecchio Salice: "Ospiti! Finalmente! Sapete da quanto nessuno mi passa davanti senza urlare 'AAH UN ALBERO CHE PARLA'? Rilassatevi, sono di famiglia: i miei cugini del Bosco dei Sussurri vi avranno già spettegolato addosso, immagino. Prozia Quercia mi scrive lettere lunghissime, tutto gossip."

Le fronde si scostano, indicando un barcone sfasciato ormeggiato a un palo storto. Nessun barcaiolo in vista: solo un cappello a tesa larga appoggiato sul sedile di poppa, e una nebbiolina blu che sembra RESPIRARE.

> Il Vecchio Salice: "Prima di farvi conoscere Bertoldo — è permaloso, avvisati — un piccolo pedaggio d'usanza. Da queste parti si dice: chi risponde all'indovinello dell'albero ha il favore dell'albero. E il favore dell'albero, coi fantasmi, CONTA."

Si schiarisce la voce (le fronde stormiscono in un modo fin troppo teatrale):

*"Non ho gambe ma cammino da secoli,
non ho bocca ma sussurro ai veli,
porto il cielo capovolto sulla schiena
e ricordo ogni lacrima che pena.
**Chi sono?**"*`,
    sets: { via: 'fiume' },
    choices: [
      { text: '🌊 "Il Fiume Torbido"', next: 'r1_tariffa' },
      { text: '🌙 "La Luna, ovviamente"', next: 'r1_sbagliato' },
      { text: '🪞 "Sei tu, Salice. Ti guardi troppo nell\'acqua."', next: 'r1_sbagliato' },
    ],
  },

  r1_sbagliato: {
    location: 'fiume',
    caption: 'Un indovinello mancato',
    text: `Il Salice si blocca a mezza fronda, indignato.

> Il Vecchio Salice: "SBAGLIATO! Del tutto, completamente, ARTISTICAMENTE sbagliato! Non importa quale delle due sciocchezze abbiate detto: la risposta era il FIUME. Legge il testo, gente! 'Porto il cielo capovolto sulla schiena' — è l'ACQUA che riflette il cielo capovolto, mica la luna, e IO men che meno, per quanto abbia — lo ammetto — un bel fogliame."

Scosso dalla propria indignazione, lascia cadere una raffica di foglie ingiallite che vi piove addosso, infilandosi ovunque: nei colletti, negli stivali, e — con mira sospettosamente precisa — dentro l'orecchio di chiunque nel gruppo abbia l'udito più fine, che la estrae con un'espressione offesa. Nessun danno: solo dignità capillarmente compromessa e capelli pieni di autunno anticipato.

> Il Vecchio Salice: "Comunque. Andate, andate. Bertoldo è al molo, il cappello è suo, l'odore di muffa pure. E se gli dite che l'indovinello l'ha inventato mia cugina, negherò tutto: la reputazione letteraria di questa famiglia è già abbastanza compromessa."

Un ultimo ramo vi indica la strada, quasi con affetto, prima di tornare a spettegolare fitto con le fronde più alte.`,
    choices: [{ text: 'Verso il molo, dove aspetta Bertoldo', next: 'r1_tariffa' }],
  },

  r1_tariffa: {
    location: 'fiume',
    npc: ['bertoldo'],
    caption: 'Bertoldo, il Traghettatore',
    text: `Il cappello sul sedile si solleva da solo — o quasi: sotto c'è una figura semitrasparente in giubba da barcaiolo d'altri tempi, i contorni che ondeggiano come visti attraverso l'acqua. **Bertoldo** vi squadra con un'espressione permanentemente scontenta.

> Bertoldo: "Voi. Vivi. Che volete attraversare il MIO fiume col MIO barcone, immagino. Bene. Tariffa: **trenta monete d'oro** — a GRUPPO, non sono un mostro — e nessuna domanda su come sia diventato... così." Indica sé stesso con un gesto vago, imbarazzato.

Vi accorgete che Bertoldo non tocca MAI l'acqua: resta fermo un palmo sopra la superficie, aggrappato al bordo del barcone come a una zattera di salvataggio. Per un fantasma d'acqua, sembra terrorizzato dall'acqua.

> Bertoldo: *(sulla difensiva, notando lo sguardo)* "COSA. Cosa guardate. Sì, sono annegato centocinquant'anni fa, in QUESTO fiume, e no: non impari a nuotare da morto. È una delle ingiustizie più grandi dell'aldilà, ve lo assicuro io. Allora? Pagate, o avete altre proposte? Il Fiume Torbido non aspetta nessuno, nemmeno i suoi barcaioli."`,
    choices: [
      { text: '💰 Pagate le 30 monete', requiresGold: 30, gold: -30, next: 'r2' },
      { text: '🗣 Parlate del suo passato, con delicatezza', tag: 'Prova di Carisma — CD 12', check: { stat: 'CAR', dc: 12, success: 'r1_commosso', fail: 'r1_offeso' } },
      { text: '🎣 Offritevi di aiutarlo a ritrovare il suo remo fortunato, perduto nel canneto', tag: 'Prova di Saggezza — CD 11', check: { stat: 'SAG', dc: 11, success: 'r1_remo', fail: 'r1_remo_fail' } },
    ],
  },

  r1_commosso: {
    location: 'fiume',
    npc: ['bertoldo'],
    caption: 'Il peso di centocinquant\'anni',
    text: `Qualcuno del gruppo si siede sul bordo del molo — non troppo vicino all'acqua, per rispetto — e chiede, piano: "Com'è successo, Bertoldo?"

Il fantasma si irrigidisce. Sembra sul punto di rispondere con la solita brusquerie. Poi, lentamente, si sgonfia come una vela senza vento.

> Bertoldo: "Trasportavo la posta reale, quella notte. Piena burrasca. Una cassa scivolò in acqua e io, STUPIDO, ci saltai dietro credendo di saperci fare. Non sapevo nuotare nemmeno da VIVO, capite? Ma ero giovane, orgoglioso, e c'era una lettera importante in quella cassa. Sono morto per un plico di documenti che probabilmente diceva 'aumento delle tasse sul sale'."

Guarda l'acqua con un misto di odio e nostalgia.

> Bertoldo: "La Corporazione dei Barcaioli mi ha 'promosso' a traghettatore eterno. Nessuno mi ha mai chiesto se lo volessi. E il bello è: ancora oggi, se cado in acqua, affondo come un sasso. Fantasma o no. Non è nemmeno la mia specialità, la mia MORTE."

Per la prima volta, l'espressione scontrosa si incrina in qualcosa di più tenero.

> Bertoldo: "...Nessuno mi chiede mai come sto. Grazie. Salite a bordo, gratis: stanotte la Corporazione può pagarmi lei gli straordinari, per una volta che non lo fa."

**(Bertoldo è commosso: la traversata è gratuita, e vi condurrà con più cura del solito.)**`,
    sets: { bertoldo_amico: true },
    choices: [{ text: 'Salite a bordo', next: 'r2' }],
  },

  r1_offeso: {
    location: 'fiume',
    npc: ['bertoldo'],
    caption: 'Un discorso che non ha smosso nulla',
    text: `Il discorso commovente parte bene e poi... si perde per strada. Qualcuno inciampa in un "capiamo il tuo dolore" seguito da un impacciato "...il fiume, eh, brutta bestia", che suona più come una recensione del meteo che come empatia vera.

> Bertoldo: *(imperturbabile)* "Emozionante. Davvero. Mi sento CAPITO fino al midollo — che peraltro non ho più. Sapete cosa mi commuove per davvero? Il suono di monete d'oro che cadono nella mia scodella."

Incrocia le braccia trasparenti, per quanto sia possibile farlo con dignità restando un palmo sopra l'acqua che tanto teme.

> Bertoldo: "MA. Siete stati simpatici, a modo vostro goffo. Vi faccio uno sconto sentimentale: aiutatemi a issare la vela — incastrata da quando quel vampiro drammatico ha spento il sole e i cardini si sono raggelati — e vi porto per venti monete, non trenta."

Con qualche spallata coordinata (e un contributo non richiesto di chi tratta la vela come un ingrediente ribelle da domare a suon di gomiti), la vela si issa con un ultimo scricchiolio soddisfatto. Bertoldo, per la prima volta, sembra quasi divertito dal caos.

> Bertoldo: "Non malissimo, per essere vivi. Su, a bordo, prima che cambi idea sullo sconto."`,
    gold: -20,
    choices: [{ text: 'Salite a bordo', next: 'r2' }],
  },

  r1_remo: {
    location: 'fiume',
    npc: ['bertoldo'],
    caption: 'Il remo tra le canne',
    text: `Qualcuno con occhio allenato nota, tra le canne sulla riva, un bagliore d'oro vecchio: un remo consumato, l'impugnatura intagliata a forma di pesce sorridente (o forse è solo storto). Recuperarlo richiede scivolare a piedi nudi nel fango, disturbare una famiglia di rane profondamente indignate, e sopportare per tutto il tempo lo sguardo giudicante di un airone che non smette MAI di fissarvi.

Quando lo porgete a Bertoldo, il fantasma resta immobile per un tempo imbarazzante.

> Bertoldo: "Il... il MIO remo. Quello di mio padre. Lo persi la notte che... be', la notte che sapete. Centocinquant'anni che lo cerco tra queste canne, ogni singola notte, e VOI lo trovate in mezz'ora?!"

Lo stringe al petto — attraversandolo un poco, essendo un fantasma: il remo fluttua dentro la sua giacca in un modo che sarebbe inquietante se non fosse così commovente.

> Bertoldo: "Salite. Salite SUBITO. Stanotte si naviga con lo stile di una volta. E gratis, ovviamente: un uomo che ritrova il remo di suo padre non fa pagare pedaggio, che diamine." *(fruga in tasca e vi porge un piccolo oggetto d'ottone annerito)* "Tenete. Un fischietto da barcaiolo. Se mai vi serve richiamare l'attenzione di qualcosa che vive nell'acqua... be', funziona. L'ho scoperto nel modo peggiore."

**(Remo Fortunato ritrovato! Bertoldo naviga con più sicurezza: la traversata sarà più agevole.)**`,
    sets: { remo_ritrovato: true },
    item: 'fischietto_di_bertoldo',
    choices: [{ text: 'Salite a bordo', next: 'r2' }],
  },

  r1_remo_fail: {
    location: 'fiume',
    caption: 'Qualcosa si muove tra le canne',
    text: `La ricerca comincia bene: canne scostate con cura, fango setacciato con la pazienza di un minatore. Poi qualcuno affonda una mano un po' troppo a fondo in una tana sommersa e sente qualcosa di lungo, freddo e MOLTO vivo attorcigliarsi intorno al polso.

Il canneto esplode di movimento: bolle, fango sollevato, tre paia di occhi gialli che spuntano dall'acqua torbida. Non è il remo. Sono **anguille**, grosse come braccia, e sono FURIOSE — e dietro di loro un'ombra liquida più densa delle altre si solleva lentamente: qualcosa che sorveglia il canneto da molto più tempo di centocinquant'anni.

> Bertoldo: *(dal molo, per niente utile)* "OH NO. Il guardiano del canneto! Non lo disturbo dai tempi in cui ero VIVO! Fate silenzio, magari se ne va!"

Non se ne va. Anzi, si avvicina, e l'acqua intorno comincia a girare lenta, come in un imbuto che si sta decidendo se inghiottirvi o solo spaventarvi a morte. Da qualche parte, tra le radici sommerse, intravedete un bagliore che potrebbe essere il remo perduto — o solo il riflesso della luna che non c'è più.

> Bertoldo: "Se vi serve un consiglio da esperto: NON toccate altra acqua per un po'. Anche se, ripensandoci, è un po' tardi per quel consiglio."`,
    choices: [
      { text: '⚔ Affrontate anguille e guardiano', next: 'r1_anguille' },
      { text: '🧠 Distraetele gettando in acqua il cesto di pesce essiccato di Bertoldo', tag: 'Prova di Intelligenza — CD 11', check: { stat: 'INT', dc: 11, success: 'r2', fail: 'r1_anguille' } },
    ],
  },

  r1_anguille: {
    location: 'fiume',
    caption: 'Il Guardiano del Canneto',
    text: `Il cesto di pesce essiccato (se lanciato) non basta a calmare le acque: le anguille caricano comunque, e dietro di loro lo **Spirito del Fiume** si materializza per intero — un'ombra d'acqua alta come un uomo, con occhi come lanterne sommerse, che sibila una parola in un idioma che solo il fiume ricorda ancora.

Nel caos della mischia, qualcosa bianco lampeggia sott'acqua vicino ai vostri piedi: il remo di Bertoldo, incastrato tra le radici da centocinquant'anni, liberato dal trambusto. Non è il momento di festeggiare: prima bisogna sopravvivere alla festa che avete involontariamente organizzato.

> Bertoldo: *(urlando dal sicuro, cioè da un metro sopra l'acqua)* "NON GLI SERVE UN MOTIVO! DIFENDETEVI E BASTA! ...e se vedete un remo, portatemelo, già che ci siete!"

Le anguille sfrecciano tra le gambe cercando di trascinarvi verso il fondo, mentre lo Spirito allunga braccia d'acqua fredda che passano attraverso gli scudi come se non esistessero. È una lotta scomoda, bagnata, e assolutamente non prevista nel programma della serata — ma il canneto, a modo suo, sembra quasi rispettarvi per esserci finiti dentro con tanto entusiasmo.

**(Combattimento! Lo Spirito del Fiume è un'entità spettrale: la Sacra Folgore e la magia funzionano meglio del solito.)**`,
    sets: { remo_ritrovato: true },
    combat: {
      enemies: ['anguilla', 'anguilla', 'spirito_fiume'],
      victory: 'r2',
      defeat: 'sconfitta_generica',
      loot: { gold: 8 },
    },
  },

  r2: {
    location: 'fiume',
    caption: 'Si parte! Le Rapide del Singhiozzo',
    text: `Il barcone di Bertoldo scivola sull'acqua nera, silenzioso a parte lo sciabordio dei remi e i lamenti occasionali del legno (il barcone, non Bertoldo — anche se è difficile dirlo). Il Fiume Torbido si infila sotto la montagna, e la luce dell'eclissi filtra a malapena tra le rocce sopra di voi.

Dopo pochi minuti, un rombo sordo cresce dal buio a valle: le **Rapide del Singhiozzo**, così chiamate — spiega Bertoldo — perché l'acqua tra questi massi fa un suono esattamente come qualcuno che piange sottovoce, ininterrottamente, da secoli.

> Bertoldo: "Tenetevi forte e REMATE quando dico remate! Le rapide non perdonano gli sbadati, e io, ricordo, non sono un granché nel salvare gente in acqua!"

Il barcone si impenna, i massi neri sfrecciano a un palmo dallo scafo, e serve ogni braccio del gruppo, coordinato, per non finire rovesciati nella corrente gelida. Bertoldo grida ordini a raffica — "SINISTRA! NO, L'ALTRA SINISTRA! LA MIA O LA VOSTRA?!" — mentre il rombo dell'acqua diventa quasi assordante e la prima onda alta vi si rovescia addosso come un secchio gelato.`,
    choices: [
      { text: '🚣 Remate insieme, con tutta la forza che avete', tag: 'Prova di Destrezza (di gruppo) — CD 12', check: { stat: 'DES', dc: 12, success: 'r3', fail: 'r2_ko' } },
    ],
  },

  r2_ko: {
    location: 'fiume',
    caption: 'Un tuffo non richiesto',
    text: `Il coordinamento... manca. Un remo colpisce un altro remo, qualcuno grida "A DESTRA!" mentre un altro grida "A SINISTRA!", e il barcone incontra un masso con un CROCK che gela il sangue più della corrente stessa.

Lo scafo si inclina, l'acqua invade la stiva fino alle caviglie, e nel caos qualcuno perde la presa sulla borsa delle monete: **dieci monete d'oro** finiscono nel Fiume Torbido, dove — potete giurarlo — resteranno per altri centocinquant'anni. **(-3 PV a tutti, tra colpi e gelo.)**

> Bertoldo: *(aggrappato disperatamente al timone, un metro sopra l'acqua che tanto teme)* "AH-HA! VISTO? VISTO?! Ecco perché ODIO queste rapide! Nessuno è mai bravo la prima volta! ...la seconda nemmeno, a dire il vero."

Il barcone, ammaccato ma intero, esce dalle rapide zoppicando come un'anatra ubriaca e decisamente offesa. Da qualche parte sotto i sedili, qualcuno recupera un elmo, uno stivale spaiato e — mistero irrisolto — un cucchiaio che nessuno del gruppo ricorda di aver portato. Il Fiume Torbido, evidentemente, colleziona souvenir a modo suo.`,
    damage: 3,
    goldLoss: 10,
    choices: [{ text: 'Riprendete la corrente, gocciolanti', next: 'r3' }],
  },

  r3: {
    location: 'fiume',
    caption: 'I Salici Piangenti',
    text: `Il fiume rallenta in un'ansa larga, dove decine di salici si chinano sull'acqua con i rami che ne sfiorano la superficie. E qui la faccenda si fa STRANA: questi salici non stormiscono, non spettegolano come il loro cugino al molo.

**Piangono. Davvero.** Gocce trasparenti scivolano lungo ogni ramo e cadono nell'acqua con un plic-plic costante, come una pioggia che viene solo dall'alto degli alberi e da nessun'altra parte del cielo.

> Bertoldo: *(sottovoce, insolitamente delicato)* "Li chiamano i Salici Piangenti da sempre. Nessuno sa perché piangano. Io una teoria ce l'ho, ma... non sono sicuro di volerne parlare. Se qualcuno di voi ha l'orecchio fine, forse l'acqua ha una risposta migliore della mia."

Le lacrime dei salici cadono sul barcone, sui vostri mantelli, su chi tra voi le raccoglie curioso e le assaggia — sanno di ruggine e di nostalgia, a quanto pare, il che non chiarisce granché ma è comunque un'informazione.`,
    choices: [
      { text: '👂 Fermatevi ad ascoltare l\'acqua', tag: 'Prova di Saggezza — CD 12', check: { stat: 'SAG', dc: 12, success: 'r3_ascolto', fail: 'r4' } },
      { text: '➡ Proseguite: la notte stringe', next: 'r4' },
    ],
  },

  r3_ascolto: {
    location: 'fiume',
    caption: 'Ciò che l\'acqua ricorda',
    text: `Chi si china sull'acqua, in silenzio, sente qualcosa sotto il gorgoglio delle onde: un ronzio basso, quasi un canto, che sale dalla corrente e scende dai rami dei salici insieme, come se fiume e alberi condividessero lo stesso, vecchio dolore.

Non sono parole. Sono più simili a un ricordo che galleggia: una torre, una gemma rossa che pulsa, e — sotto tutto il resto — un pianto ANTICO che non appartiene né al fiume né agli alberi, ma scende da molto più in alto. Dal castello.

> Bertoldo: "Il castello piange, sapete? Da duecento anni. Ogni goccia che cade da questi rami è arrivata fin qui scivolando dalle grondaie di Crepuscolo, attraverso la roccia, per il fiume sotterraneo. Duecento anni di lacrime che nessuno raccoglie mai, perché nessuno lassù ha più tempo di piangere in pace."

Vi guardate. Se il castello piange da duecento anni — da quando Vespertino Morn sparì e Vesper Morn apparve — forse quel pianto non è del tutto suo. Forse è la **Corona** a piangere, attraverso di lui, ogni singola notte.

**(Avete intuito un pezzo in più della verità: la Corona di Mezzanotte pesa su Vesper da duecento anni — e forse piange quanto lui.)**`,
    sets: { sa_corona: true },
    choices: [{ text: 'Riprendete la corrente', next: 'r4' }],
  },

  r4: {
    location: 'fiume',
    npc: ['bertoldo'],
    caption: 'Il Pescatore di Ricordi',
    text: `Oltre l'ansa dei salici, seduto su una zattera immobile in mezzo alla corrente — come se la corrente, per lui, avesse deciso di fermarsi — c'è un uomo con una lenza gettata in acqua. Non ha ami. Non ha esca. Il filo scende dritto nel buio e non tocca mai il fondo.

> Il Pescatore: *(senza voltarsi)* "Buonasera. O buona notte eterna, fate voi. Pesco ricordi, qui. I vostri, se volete: galleggiano tutti, prima o poi, quando si passa abbastanza vicino a me."

Si volta. Ha un volto che dimenticate un secondo dopo averlo guardato — non per magia oscura, sembra, ma per rispetto: non vuole essere ricordato più di quanto ricordi lui stesso.

> Il Pescatore: "Ho un dono, per chi vuole. La **Lacrima di Luna**: un'arma contro il buio, l'unica che conosca davvero. Il prezzo è un pedaggio semplice: UN ricordo felice. Uno vero. Datemelo, e nella notte più buia la lacrima brillerà per voi. Rifiutate, e proseguite pure: il fiume non vi obbliga a niente, io nemmeno."

> Bertoldo: *(bisbigliando)* "L'ho visto altre volte. Non mente mai, questo qui. Ma un ricordo felice, una volta dato, non torna indietro. Ci ho provato a chiedergli il mio. Non ha funzionato."

Il gruppo si guarda. È una decisione da prendere insieme: chi, se qualcuno, è disposto a cedere qualcosa che non tornerà mai più?`,
    choices: [
      { text: '💧 Qualcuno del gruppo fa un passo avanti e cede un ricordo felice', next: 'r4_dono' },
      { text: '🚫 Rifiutate: certi ricordi non si vendono, nemmeno per la magia', next: 'r4_rifiuta' },
    ],
  },

  r4_dono: {
    location: 'fiume',
    npc: ['bertoldo'],
    caption: 'Il prezzo pagato',
    text: `Uno di voi — non serve dire chi, lo sapete già, e non ne parlerete più — chiude gli occhi e lascia andare qualcosa: una risata d'infanzia, un abbraccio, un pomeriggio qualunque che era, semplicemente, perfetto. Il Pescatore allunga due dita e lo raccoglie dall'aria come si raccoglie una goccia di pioggia.

> Il Pescatore: "Grazie. Sarà al sicuro con me. Meglio che nel fondo di un fiume, credetemi." *(sorride, per la prima e ultima volta)* "Ecco a voi."

Dalla lenza, dove non c'è ami né esca, sale qualcosa che LUCCICA: una lacrima d'argento perfetta, fredda al tatto ma calda a guardarla, che non si asciuga mai. La **Lacrima di Luna**.

> Il Pescatore: "Nell'ora più buia, quando tutto sembra perso, lasciatela cadere. Riporterà alla luce ciò che il buio vuole tenersi. Usatela bene: non ne pescherò un'altra uguale."

Il Pescatore china il capo, rilancia la lenza nel nulla, e quando vi voltate a guardarlo ancora una volta, avete già dimenticato di averlo fatto — resta solo, tra le mani, la prova che non era un sogno.`,
    sets: { lacrima_ceduta: true },
    item: 'lacrima_di_luna',
    choices: [{ text: 'Riprendete la corrente, in silenzio', next: 'r5' }],
  },

  r4_rifiuta: {
    location: 'fiume',
    npc: ['bertoldo'],
    caption: 'Il ricordo che resta vostro',
    text: `Vi guardate, e la risposta arriva senza bisogno di parole: no. Non stanotte, non per questo. I ricordi felici, con tutto quello che sta succedendo al mondo, sono merce troppo rara per venderla anche alla causa più giusta.

> Il Pescatore: *(senza offendersi, anzi, quasi sollevato)* "Saggia scelta. La maggior parte accetta subito, e poi passa gli anni a chiedersi cosa ha perso esattamente. Voi almeno lo saprete sempre: avete scelto di restare interi."

Rilancia la lenza in acqua, senza ami, senza esca, e il filo scompare di nuovo nel buio.

> Il Pescatore: "Buona fortuna, lassù. E se cambiate idea... be', il fiume passa sempre di nuovo da queste parti, per chi sa aspettare. Io non ho fretta: ho tutto il tempo del mondo, letteralmente."

Bertoldo, dal timone, annuisce con un rispetto insolito.

> Bertoldo: "Bella scelta. Il mio di ricordo più felice gliel'ho quasi dato, una notte. Poi ho pensato: e se fosse l'unico che mi resta? Tengo la lenza a distanza, da allora."

Il barcone riprende la corrente, verso il rombo lontano di una cascata.`,
    choices: [{ text: 'Proseguite verso il rombo', next: 'r5' }],
  },

  r5: {
    location: 'fiume',
    caption: 'La Cascata del Tuffo Fatale',
    text: `Il rombo cresce fino a diventare un muro di suono: davanti a voi, il fiume precipita in una **cascata** che sparisce in una nube di spruzzi fosforescenti. Bertoldo, per la prima volta da quando l'avete conosciuto, smette di parlare.

> Bertoldo: *(piano, quasi un sussurro)* "Questo è il punto. Qui... è qui che sono annegato. Centocinquant'anni fa, in una notte di burrasca uguale a questa. La grotta che porta alle cantine del castello è dietro la cascata: bisogna remare CONTRO corrente per infilarcisi, dritti nell'acqua che cade."

Le sue mani trasparenti tremano sul timone — o forse è solo l'acqua che le attraversa, difficile dirlo con un fantasma.

> Bertoldo: "Ogni notte busso a questa cascata, e ogni notte trovo una scusa per non entrarci. Stanotte... stanotte con voi a bordo, forse ce la faccio. Ma il remare tocca a VOI: io posso guidare, non posso spingere. Datemi tutto quello che avete."

Il barcone punta dritto contro la corrente, verso il muro d'acqua che ruggisce.`,
    choices: [
      { text: '💪 Remate contro corrente, con tutta la forza che avete', tag: 'Prova di Forza — CD 12', check: { stat: 'FOR', dc: 12, success: 'r6', fail: 'r5_ko' } },
    ],
  },

  r5_ko: {
    location: 'fiume',
    caption: 'Respinti dalla corrente',
    text: `I remi mordono l'acqua con tutta la forza che avete, ma la cascata è più testarda di voi: il barcone viene sbattuto indietro, gira su sé stesso due volte come una trottola ubriaca, e finisce a sbattere contro una roccia sommersa con un TONFO che fa vibrare i denti. **(-3 PV a tutti, e un giro di corrente completamente sprecato.)**

> Bertoldo: *(aggrappato al timone con tutt'e due le mani trasparenti)* "ECCO PERCHÉ NON CI PROVO MAI! Ogni notte la stessa storia, in fondo! Vi avevo avvertiti che non sono bravo con l'acqua!"

Bisogna riprendere la rincorsa: i remi doloranti, i muscoli che protestano formalmente, e Bertoldo che ripete a voce sempre più acuta "STAVOLTA VA MEGLIO, STAVOLTA VA MEGLIO" come un mantra poco convincente. Ma stavolta, sapendo dove NON spingere, il barcone trova finalmente la fessura giusta nel velo d'acqua e scivola dentro la grotta, ansante ma intero — con un ultimo spruzzo vendicativo della cascata che vi saluta bagnandovi fino all'ultimo centimetro rimasto asciutto.`,
    damage: 3,
    choices: [{ text: 'Dentro, finalmente', next: 'r6' }],
  },

  r6: {
    location: 'cisterna',
    npc: ['bertoldo'],
    caption: 'La Grotta della Cisterna',
    text: `Oltre la cascata, il fiume si acquieta in una grotta enorme, illuminata da cristalli azzurri incastonati nella roccia — cugini, probabilmente, di quelli visti nelle Miniere di Ferrovecchio, anche se nessuno qui potrà mai confermarlo con certezza. L'acqua scorre placida verso un arco di pietra scavato a mano: umano, non naturale.

> Bertoldo: "La Cisterna del castello. Ci arrivo fin qui da sempre, ma non sono mai salito oltre: un fantasma d'acqua in una cantina di vampiri è una combinazione che nessuno dei due gradirebbe. Da lì in su, tocca a voi."

Il barcone approda su una banchina di pietra coperta di muschio fosforescente. Sopra di voi, una scala di servizio sale nel buio, tagliata nella roccia dalle stesse mani che duecento anni fa scavarono anche le miniere: qualcuno, all'epoca, amava decisamente le scorciatoie sotterranee più del dovuto.

Bertoldo lega il barcone a un anello di ferro arrugginito, con la cura meticolosa di chi non è affatto sicuro di voler concludere questo viaggio.`,
    choices: [{ text: 'Sbarcate sulla banchina', next: 'r7' }],
  },

  r7: {
    location: 'cisterna',
    npc: ['bertoldo'],
    caption: 'Il Congedo di Bertoldo',
    text: `Salite dal barcone sulla banchina di pietra, e per un istante nessuno dice niente: Bertoldo, il fiume, la cascata alle spalle — sembra già tutto un ricordo, anche se è successo dieci minuti fa.

> Bertoldo: "Bene. Siamo arrivati. La scala sale dritta alle cantine: da lì, il resto del castello è affar vostro, non mio." *(esita)* "Io... resto qui. È il massimo che riesco a fare, per stanotte. Magari è anche il massimo che riuscirò MAI a fare. Ma è più di quanto pensassi, un'ora fa."

Solleva una mano trasparente, quasi a benedirvi, e qualcosa nell'aria attorno a voi si scalda: un ultimo dono di un fiume che, alla fine, forse, ama ancora un po' — le rapide superate insieme, le lacrime dei salici, il remo ritrovato o il ricordo condiviso: qualunque strada abbiate scelto, il fiume se la ricorda tutta.

> Bertoldo: "Questo è tutto quello che un fantasma bagnato può offrire: la benedizione di un'acqua che vi ha portato fin qui senza affondarvi. Andate. E se qualcuno lassù vi chiede del passaggio segreto sotto il castello... ditegli che l'ha aperto un uomo che ha paura dell'acqua da centocinquant'anni, e ci è passato in mezzo comunque, stanotte, per voi."

**(La Benedizione del Fiume: tutto il gruppo recupera 6 punti vita prima della salita.)**

Vi congeda con un cenno buffo, mezzo saluto militare e mezzo inchino, prima di sedersi di nuovo sul barcone a guardare l'acqua che tanto teme e che, in fondo, non ha mai davvero smesso di amare.`,
    sets: { benedizione_fiume: true },
    heal: 6,
    choices: [
      { text: 'Salite la scala di servizio verso le cantine del castello', next: 'c_gerbold' },
    ],
  },

  /* ==================== ATTO 3 — CASTELLO CREPUSCOLO ==================== */

  c1: {
    location: 'castelloEsterno',
    caption: 'Castello Crepuscolo — ore 22:00',
    text: `Eccolo.

Il **Castello Crepuscolo** si arrampica sulla montagna come un artiglio di pietra nera, le guglie perse nel cielo senza sole. Dalle finestre pulsa una luce rossastra, e la **Barriera Notturna** avvolge tutto: un velo d'ombra liquida che ondeggia come acqua verticale.

Ma c'è qualcosa che NON vi aspettavate: **musica**. Violini, risate, calici che tintinnano. Dal portone principale, una fila di carrozze scarica ospiti in maschera: mantelli, gioielli, maschere di velluto.

Un valletto scheletrico all'ingresso annuncia con voce tonante:

> "BENVENUTI AL GRAN BALLO DELL'ECLISSI! Sua Oscurità Lord Vesper Morn celebra L'ULTIMA NOTTE... cioè, la PRIMA di INFINITE notti! Esibire l'invito!"

L'anello rosso nel cielo è sottilissimo, ormai. **Due ore a mezzanotte.** Come entrate?`,
    choices: [
      { text: '🎭 Dal portone, mescolati agli invitati del Gran Ballo', next: 'c_maschere' },
      { text: '🍷 Dalle cantine, con la Chiave del Passaggio Basso', requires: { item: 'chiave_passaggio' }, next: 'c_cantine' },
      { text: '🌒 Dal giardino, bevendo la Pozione del Crepuscolo', requires: { item: 'pozione_crepuscolo' }, removeItem: 'pozione_crepuscolo', next: 'c_giardino' },
      { text: '🧗 Scalando le mura, come ai vecchi tempi', tag: 'Prova di Forza — CD 14', check: { stat: 'FOR', dc: 14, success: 'c_mura_ok', fail: 'c_mura_ko' } },
    ],
  },

  /* ---------- ingresso: festa ---------- */

  c_maschere: {
    location: 'castelloEsterno',
    caption: 'Il problema delle maschere',
    text: `Per entrare dal portone servono: maschere, contegno aristocratico e un invito. Avete: facce da schiaffi, armi male occultate e niente invito.

Dietro le carrozze, però, notate un furgone di servizio con la scritta *"MASCHERART — Forniture per Feste dell'Altro Mondo"*. Il fattorino sta scaricando scatole di maschere di ricambio.`,
    choices: [
      { text: '🤫 Qualcuno "ricolloca" sei maschere dal furgone', tag: 'Prova di Destrezza — CD 12', check: { stat: 'DES', dc: 12, success: 'c_maschere_ok', fail: 'c_maschere_ko' } },
      { text: '🗣 Convincete il fattorino che siete artisti ingaggiati per la festa', tag: 'Prova di Carisma — CD 12', check: { stat: 'CAR', dc: 12, success: 'c_maschere_ok2', fail: 'c_maschere_ko' } },
    ],
  },

  c_maschere_ok: {
    location: 'castelloEsterno',
    caption: 'Sei maschere più tardi...',
    text: `Mani di velluto: sei maschere spariscono dal furgone senza che una piuma si scomponga. C'è anche l'imbarazzo della scelta: un corvo, una volpe, un sole (ironico), una luna, un gatto e... una rana. Qualcuno DOVRÀ fare la rana.

**(Maschere da Ballo ottenute!)** Vi cambiate dietro una carrozza e vi mettete in fila con l'aria più annoiata e aristocratica che avete.

> Valletto: "Nomi, prego."

> Voi: *(voce impostata)* "Il Conte e la Contessa Von Ranocchio, con seguito."

> Valletto: *(pausa infinita)* "...i Von Ranocchio. Ma certo. PASSARE PURE."`,
    item: 'maschere',
    choices: [{ text: 'Dentro: il Gran Ballo vi aspetta', next: 'c_ballo' }],
  },

  c_maschere_ok2: {
    location: 'castelloEsterno',
    caption: 'Gli "artisti"',
    text: `> Voi: "Siamo gli ARTISTI! La compagnia teatrale 'I Figli della Mezzanotte'! Il numero di apertura! Non ci hanno dato le maschere di scena, TIPICO della produzione..."

Il fattorino, che chiaramente odia il suo lavoro con passione, vi squadra:

> Fattorino: "Artisti, eh. Sapete cosa? Non mi pagano abbastanza per fare domande. Prendete le maschere. E se vi chiedono qualcosa, io non vi ho mai visti."

**(Maschere ottenute!)** Vi presenta perfino al valletto come "il numero d'apertura". Il valletto vi fa passare con un inchino. Il fattorino vi fa l'occhiolino. Che brava persona.`,
    item: 'maschere',
    choices: [{ text: 'Dentro: il Gran Ballo vi aspetta', next: 'c_ballo' }],
  },

  c_maschere_ko: {
    location: 'castelloEsterno',
    caption: 'Operazione fallita — piano B(otte)',
    text: `Il piano fallisce nel modo più classico: la pila di scatole crolla, il fattorino urla "AL LADRO!", e due **guardie pipistrello** enormi calano dalle torri con uno stridio da gelare il sangue.

Il valletto scheletrico commenta, annoiato:

> Valletto: "Ogni festa c'è qualcuno che prova a imbucarsi. OGNI. FESTA."

Almeno le maschere ormai le avete in mano. Ma prima: i pipistrelli!`,
    item: 'maschere',
    combat: {
      enemies: ['pipistrello', 'pipistrello'],
      victory: 'c_maschere_ko_win',
      defeat: 'sconfitta_generica',
    },
  },

  c_maschere_ko_win: {
    location: 'castelloEsterno',
    caption: 'Imbucati con la forza',
    text: `I pipistrelli si ritirano sulle torri, stridendo offesissimi. Il valletto scheletrico vi guarda, guarda le maschere nelle vostre mani, e sospira il sospiro di chi è pagato troppo poco (cioè niente, da 200 anni):

> Valletto: "...sapete che c'è? PASSARE PURE. 'Compagnia di artisti di strada, numero di lotta comica'. Lo scrivo io sul registro. Non voglio più saperne niente."

Vi infilate le maschere ed entrate, un po' ammaccati ma DENTRO.`,
    choices: [{ text: 'Il Gran Ballo vi aspetta', next: 'c_ballo' }],
  },

  c_ballo: {
    location: 'ballo',
    npc: ['vesper'],
    caption: 'Il Gran Ballo dell\'Eclissi',
    text: `Il salone delle feste è uno spettacolo: lampadari con candele viola, tavoli che gemono sotto banchetti sontuosi (per chi mangia) e calici di un liquido rosso vivo (per chi... non chiedete), e decine di ospiti mascherati che danzano un valzer lentissimo e ipnotico.

Sul palco, un'orchestra di scheletri suona con impegno commovente e risultati discutibili.

E poi le trombe squillano. Le porte in cima allo scalone si spalancano e **LUI** appare.

**Lord Vesper Morn** scende i gradini a mantello spiegato (c'è uno scheletro il cui UNICO compito è sventolarglielo da dietro con un mantice). Pallido, elegantissimo, bello in un modo che dà fastidio.

> Vesper: "Ospiti adorati! Benvenuti alla FINE DEL GIORNO! A mezzanotte salirò sulla torre, indosserò la Corona... e il sole diventerà un RICORDO! Ma prima..." *(schiocca le dita, l'orchestra riparte)* "...si BALLA!"

Scompare tra gli applausi in una nuvola di pipistrelli coreografati. La **scala della torre** è dietro il palco, sorvegliata da un maggiordomo scheletrico dall'aria terribilmente stanca.`,
    choices: [
      { text: '💃 Un giro di valzer per non dare nell\'occhio, avvicinandosi al palco ballando', tag: 'Prova di Destrezza — CD 11', check: { stat: 'DES', dc: 11, success: 'c_ballo_danza', fail: 'c_ballo_pesta' } },
      { text: '🍽 Al buffet! Origliare i pettegolezzi degli ospiti (e assaggiare tutto)', next: 'c_ballo_buffet' },
      { text: '🎯 Dritti alla scala della torre, ignorando la festa', next: 'c_gerbold' },
    ],
  },

  c_ballo_danza: {
    location: 'ballo',
    caption: 'Il valzer degli impostori',
    text: `Vi lanciate nel valzer. E — sorpresa — siete BRAVISSIMI. Piroette, inchini, un casqué che strappa un "oooh" alla sala. Una contessa vampira con maschera di pavone sussurra al vostro passaggio:

> Contessa: "Che stile... senti, tesoro, tu che sei chiaramente dell'ambiente: dicono che il caro Vesper sia TERRORIZZATO all'idea che stasera qualcuno fischi. Duecento anni fa, sai, il famoso *concerto*... il Re rise e lui non si è MAI ripreso. Un fiasco può distruggerlo più di cento spade."

Ridacchia dietro il ventaglio e volteggia via.

**(Pettegolezzo cruciale: Vesper è terrorizzato dal pubblico! Il suo passato di bardo è la sua ferita aperta.)**`,
    sets: { sa_passato_bardo: true },
    choices: [{ text: 'Verso la scala della torre, ballando fino al palco', next: 'c_gerbold' }],
  },

  c_ballo_pesta: {
    location: 'ballo',
    caption: 'Il valzer dei disastri',
    text: `Il valzer inizia bene per circa quattro secondi. Poi qualcuno pesta il piede alla persona sbagliata: un barone vampiro con la maschera da lupo, che ulula (letteralmente) di dolore.

> Barone: "I MIEI ALLUCI! Da CHI vi ha insegnato a ballare, da un TROLL?!"

> Voi: "...sì?"

La sala si volta a guardarvi. L'orchestra si ferma. Un valletto scheletrico si avvicina scivolando sul parquet:

> Valletto: "Gli ospiti *vivaci* sono pregati di accomodarsi al buffet. LONTANO dalla pista."

Ok. Poteva andare peggio. Al buffet si origlia benissimo, tra l'altro.`,
    choices: [{ text: 'Al buffet, con dignità ferita', next: 'c_ballo_buffet' }],
  },

  c_ballo_buffet: {
    location: 'ballo',
    caption: 'Il buffet dei segreti',
    text: `Il buffet è sorprendentemente ottimo (Torvald, se c'è, approva i crostini con riserva professionale). E soprattutto: attorno ai tartufi di sangue d'arancia, i vampiri SPETTEGOLANO.

> Vampiro 1: "...duecento anni e ancora prova il discorso allo specchio. Che poi, capisci, allo specchio LUI NON SI VEDE..."

> Vampira 2: "E la corona? Dicono che gli parli. Che di notte lui la SENTA cantare. Se vuoi il mio parere, non è lui che comanda quella cosa: è quella COSA che comanda lui."

> Vampiro 1: "Sssh! Il maggiordomo... no, tranquilla, è Gerbold. Poverino. Duecento anni di servizio e mai UN giorno di ferie. Se avesse ancora il bile, sarebbe verde."

**(Informazioni preziose: la Corona domina Vesper... e il maggiordomo Gerbold è sull'orlo di una crisi di nervi.)**`,
    sets: { sa_corona: true, sa_gerbold: true },
    choices: [{ text: 'Verso la scala della torre — è quasi ora', next: 'c_gerbold' }],
  },

  /* ---------- ingresso: cantine ---------- */

  c_cantine: {
    location: 'cripta',
    npc: ['gerbold'],
    caption: 'Le Cantine del Castello — via del Passaggio Basso',
    text: `La Chiave del Passaggio Basso gira con uno scatto sordo, e la porta circolare dei nani ruota su cardini che qualcuno — benedetti nani — ha unto DUECENTO anni fa e ancora funzionano.

Emergete tra le **cantine del castello**: volte di pietra, botti gigantesche etichettate con annate tipo *"1650 — annata malinconica"* e *"1806 — retrogusto di rimpianto"*, e ragnatele come tende da salotto.

Da una scala in fondo filtrano musica e risate: sopra c'è una FESTA, a quanto pare. Ma tra voi e la scala c'è una cripta... e nella cripta, una figura china su un tavolo, che lucida argenteria alla luce di una candela verde.

Uno scheletro. In **livrea da maggiordomo**. Impeccabile. Vi dà le spalle, ma vi ha già sentiti:

> Scheletro: *(senza voltarsi)* "Gli ospiti della festa hanno sbagliato strada, o gli intrusi hanno trovato quella giusta. In entrambi i casi: benvenuti. Io sono **Gerbold**. Datemi un istante, devo finire il cucchiaino 4.712."`,
    choices: [{ text: 'Parlate con Gerbold', next: 'c_gerbold' }],
  },

  /* ---------- ingresso: giardino ---------- */

  c_giardino: {
    location: 'castelloEsterno',
    caption: 'Il Giardino Notturno — oltre la Barriera',
    text: `Un sorso a testa. La Pozione del Crepuscolo sa di menta, notte e — stranamente — biscotti della nonna.

L'effetto è immediato: i vostri contorni si fanno *morbidi*, come disegni sfumati. La Barriera Notturna vi scivola addosso senza vedervi: un secondo di freddo assoluto, ed eccovi DENTRO, nel giardino del castello.

Il giardino di Vesper è... in realtà molto curato. Rose nere potate a forma di pipistrello, una fontana che zampilla nebbia, panchine con vista sull'abisso per momenti di angst da vampiro.

Un cartello scritto in bella grafia: *"Si prega di non calpestare le aiuole. Le aiuole ricambieranno. — la Direzione"*

Attraversate il giardino fino a una porta di servizio, che si apre sulle **cucine** e poi giù verso le cantine. Nessuna guardia: sono tutte alla festa che si sente pulsare di sopra. Solo, in una cripta attigua alle cantine, uno scheletro in livrea che lucida argenteria...`,
    choices: [{ text: 'Avvicinatevi allo scheletro maggiordomo', next: 'c_gerbold' }],
  },

  /* ---------- ingresso: mura ---------- */

  c_mura_ok: {
    location: 'castelloEsterno',
    caption: 'La scalata — versione eroica',
    text: `Pietra su pietra, appiglio su appiglio. Il più forte di voi fa da ancora, gli altri salgono in cordata. Sotto, l'abisso; sopra, i merli.

Venti minuti di muscoli urlanti dopo, vi issate su un camminamento deserto: le guardie pipistrello sono tutte a fare da valletti alla festa che romba nel salone.

Da qui, una scala a chiocciola scende verso le cucine e le **cantine**. Passando davanti a una feritoia, intravedete il salone: centinaia di ospiti mascherati, e un vampiro drammaticissimo che scende uno scalone a mantello spiegato.

Nelle cantine, in una cripta silenziosa, uno scheletro in livrea da maggiordomo lucida cucchiaini e sospira il sospiro più stanco che abbiate mai sentito.`,
    choices: [{ text: 'Avvicinatevi allo scheletro maggiordomo', next: 'c_gerbold' }],
  },

  c_mura_ko: {
    location: 'castelloEsterno',
    caption: 'La scalata — versione realistica',
    text: `Pietra su pietra, appiglio su... CRACK.

Il cornicione decorativo (PERCHÉ mettono cornicioni DECORATIVI sui castelli?!) si sbriciola, e la cordata intera scivola giù per tre metri buoni, atterrando in un cespuglio di rose nere che — fedele al cartello — RICAMBIA.

**(-4 PV a tutti, e un'esperienza formativa sulle spine.)**

Peggio: lo stridio! Due **guardie pipistrello** calano dalle torri!`,
    damage: 4,
    combat: {
      enemies: ['pipistrello', 'pipistrello'],
      victory: 'c_mura_ko_win',
      defeat: 'sconfitta_generica',
    },
  },

  c_mura_ko_win: {
    location: 'castelloEsterno',
    caption: 'Le mura — al secondo tentativo',
    text: `I pipistrelli battono in ritirata verso le guglie, e stavolta la scalata riesce: raggiungete il camminamento deserto e, da lì, una scala a chiocciola che scende verso le cucine e le cantine.

In una cripta attigua, uno scheletro in livrea da maggiordomo sta lucidando cucchiaini alla luce di una candela verde, sospirando ogni sette secondi esatti.`,
    choices: [{ text: 'Avvicinatevi allo scheletro maggiordomo', next: 'c_gerbold' }],
  },

  /* ---------- GERBOLD ---------- */

  c_gerbold: {
    location: 'cripta',
    npc: ['gerbold'],
    caption: 'Gerbold — Maggiordomo, 200 anni di onorato servizio',
    text: `**Gerbold** posa il cucchiaino 4.712 con precisione millimetrica e si volta. È uno scheletro alto e curvo, con una livrea stirata alla perfezione e un'aura di stanchezza COSMICA.

> Gerbold: "Dunque. Sei figuri armati diretti alla torre del padrone la notte del suo gran trionfo. Il protocollo è chiaro: devo suonare l'allarme, chiamare le guardie e trattenervi fino all'arrivo dei rinforzi."

Non si muove. Guarda il mucchio di argenteria. Poi voi. Poi di nuovo l'argenteria.

> Gerbold: "Duecento anni. Duecento anni che stiro mantelli, lucido bare e mi occupo del RECLUTAMENTO dei pipistrelli. Sapete quante ferie ho fatto? ZERO. Sapete quante volte mi ha detto 'grazie'? Ne ho tenuto il conto: QUATTRO. L'ultima nel 1913, e si riferiva al mantello."

Le sue orbite vuote vi fissano. C'è una domanda lì dentro, da qualche parte.`,
    choices: [
      { text: '🗣 "Gerbold... ti meriti una vacanza. Aiutaci, e ti PORTIAMO al mare."', tag: 'Prova di Carisma — CD 12', check: { stat: 'CAR', dc: 12, success: 'c_gerbold_alleato', fail: 'c_gerbold_fight' } },
      { text: '🧾 "Duecento anni senza ferie? È illegale. Ti serve un sindacato. Conosciamo dei goblin..."', requires: { flag: 'sa_ballo' }, next: 'c_gerbold_alleato' },
      { text: '⚔ Niente chiacchiere: è pur sempre una guardia. All\'attacco!', next: 'c_gerbold_fight' },
    ],
  },

  c_gerbold_alleato: {
    location: 'cripta',
    npc: ['gerbold'],
    caption: 'La ribellione del maggiordomo',
    text: `Gerbold resta immobile così a lungo che temete si sia spento. Poi, con gesto lentissimo e cerimoniale... si toglie i guanti bianchi. Li piega. Li posa sull'argenteria.

> Gerbold: "Il mare. Ho visto il mare nel 1802, di sfuggita, da una carrozza. Il padrone disse che 'troppa luce rovina il colorito'." *(pausa)* "Io non HO un colorito. Sono OSSA."

Si raddrizza, e per la prima volta in due secoli la sua schiena fa un rumore tipo applauso.

> Gerbold: "Signori. Signore. In qualità di maggiordomo DIMISSIONARIO del Castello Crepuscolo, ho l'onore di comunicarvi che: la scala privata della torre è dietro l'arazzo del corvo, questa è la **chiave**, il padrone sarà sulla vetta per il rituale a mezzanotte, e il suo punto debole è che NON sopporta di essere interrotto durante i monologhi."

Vi consegna una chiave nera lucidata a specchio. **(Chiave della Torre + Gerbold è vostro ALLEATO: vi ha rivelato tutto e coprirà la vostra salita!)**

> Gerbold: "Io intanto annaffierò le piante. Con l'ACQUA SBAGLIATA. *(pausa)* Scherzo. Forse."`,
    sets: { gerbold_alleato: true },
    item: 'chiave_torre',
    choices: [{ text: 'Alla scala privata della torre!', next: 'c_scala' }],
  },

  c_gerbold_fight: {
    location: 'cripta',
    caption: 'Il protocollo è il protocollo',
    text: `> Gerbold: *(sospiro profondissimo)* "Capisco. Che sia messo a verbale che ci ho provato, a evitarlo. Odio fare straordinari."

Afferra un vassoio d'argento grande come uno scudo e lo fa roteare con perizia terrificante: duecento anni a servire in tavola sviluppano un polso NOTEVOLE.

> Gerbold: "Regolamento del castello, articolo 1: gli intrusi vanno respinti. Articolo 2: con ELEGANZA."

*(Attenzione: Gerbold è un mini-boss! È un non-morto: la Sacra Folgore fa danni doppi.)*`,
    combat: {
      enemies: ['gerbold'],
      victory: 'c_gerbold_sconfitto',
      defeat: 'sconfitta_generica',
    },
  },

  c_gerbold_sconfitto: {
    location: 'cripta',
    caption: 'Il maggiordomo a riposo (forzato)',
    text: `Il vassoio d'argento rotola a terra con un lungo *clang* malinconico. Gerbold, ridotto a un mucchio ordinato di ossa (ordinato PERFINO così: deformazione professionale), mormora dal pavimento:

> Gerbold: "...finalmente... un po' di... riposo..."

Le sue falangi indicano un gancio vicino alla porta: una chiave nera lucidata a specchio. **(Chiave della Torre ottenuta.)** Accanto, un arazzo con un corvo ricamato nasconde una scala a chiocciola che sale, e sale, e sale.

*(Una vocina in fondo alle orbite di Gerbold vi assicura che gli scheletri si "riassemblano" col tempo. Vi sentite solo il 70% in colpa.)*`,
    item: 'chiave_torre',
    choices: [{ text: 'Alla scala della torre', next: 'c_scala' }],
  },

  /* ---------- LA SCALA ---------- */

  c_scala: {
    location: 'cripta',
    caption: 'La Scala della Torre — ore 23:30',
    text: `La scala a chiocciola sembra non finire mai. Dalle feritoie, l'anello dell'eclissi è ormai un filo rosso sottile come un capello: **mezzanotte è a mezz'ora**.

A tre quarti della salita trovate un pianerottolo con una fontanella (i vampiri si idratano?), una panca di pietra, e un silenzio perfetto per tirare il fiato.

Dall'alto, attutita, arriva la voce di Vesper che... prova il discorso:

> Vesper: *(eco lontana)* "Popolo di Lumelia, INCHINATEVI— no. Popolo di Lumelia, TREMATE— nemmeno. Ah, se solo il pubblico sapesse APPREZZARE..."

Decisione tattica, eroi: riposare qui costa tempo prezioso, ma arrivare stanchi dal boss...`,
    choices: [
      { text: '🛌 Riposo breve: bende, pozioni, un boccone (+8 PV a tutti, ma arriverete a rituale INIZIATO)', next: 'c_scala_riposo' },
      { text: '🏃 Di corsa! Coglietelo di sorpresa PRIMA che inizi il rituale (vantaggio al primo turno)', next: 'c_scala_corsa' },
    ],
  },

  c_scala_riposo: {
    location: 'cripta',
    caption: 'Il pianerottolo — riposo del guerriero',
    text: `Dieci minuti di bende, sorsi di pozione, uno spuntino a base delle provviste di Torvald (o di chi per lui) e qualche profondo respiro. **(+8 PV a tutti e TUTTE le abilità speciali ricaricate!)**

Quando ripartite siete quasi nuovi. Ma dall'alto, la voce di Vesper è cambiata: non prova più il discorso. Sta *CANTANDO*. E la torre intera vibra di magia.

Il rituale è INIZIATO. Salite gli ultimi gradini quattro a quattro...`,
    heal: 8,
    recharge: true,
    sets: { rituale_iniziato: true },
    choices: [{ text: 'Spalancate la porta della vetta!', next: 'c_vetta' }],
  },

  c_scala_corsa: {
    location: 'cripta',
    caption: 'La scala — sprint finale',
    text: `Niente pause: SU, gradino dopo gradino, i polmoni in fiamme e le gambe che protestano formalmente.

Ma ne vale la pena: quando raggiungete la porta della vetta, dall'altra parte Vesper sta ANCORA sistemando il leggio del discorso, spolverando l'altare e posizionando la corona con l'angolazione migliore rispetto alla luna.

Non vi aspetta. **(Sorpresa! Se si combatte, tutto il gruppo avrà VANTAGGIO al primo turno.)**`,
    sets: { sorpresa: true },
    choices: [{ text: 'Spalancate la porta della vetta!', next: 'c_vetta' }],
  },

  /* ==================== FINALE — LA VETTA ==================== */

  c_vetta: {
    location: 'vetta',
    npc: ['vesper'],
    caption: 'La Vetta della Torre — mezzanotte meno cinque',
    text: `La porta si spalanca su un cielo IMMENSO.

La vetta della torre è una terrazza circolare sospesa sul nulla. Al centro, un altare di ossidiana. Sopra l'altare, sospesa a mezz'aria e avvolta da lampi viola, **LA CORONA DI MEZZANOTTE**: un cerchio di metallo nero con una gemma rossa che *pulsa come un cuore*. E se ascoltate bene... canta. Una ninnananna in una lingua morta.

Davanti all'altare, di spalle, mantello al vento (lo scheletro col mantice è accucciato in un angolo): **Lord Vesper Morn**.

> Vesper: *(senza voltarsi)* "Ah. Gli EROI." *(si volta, teatralissimo)* "Sapevo che sareste venuti! L'ho SCRITTO nel discorso! Vedete? Pagina tre: 'e quando gli sciocchi eroi arriveranno...' — è QUI che mi interrompete, rovinando la battuta. TIPICO del pubblico moderno."

Vi squadra uno a uno, e per un istante — un istante solo — sotto la posa da monarca delle tenebre intravedete qualcos'altro. Un ragazzo su un palco, duecento anni fa, davanti a una corte che ride.

> Vesper: "Mezzanotte è tra CINQUE minuti. Il tempo di un ultimo scambio di battute. Sceglietele BENE."`,
    choices: [
      { text: '⚔ "L\'unica battuta che ci serve è FINALE. Ridacci il sole!" (BATTAGLIA!)', next: 'f_boss_intro' },
      { text: '🎭 "Vespertino Morn. Abbiamo sentito la tua ballata. Merita un VERO pubblico."', requires: { flag: 'sa_passato_bardo' }, next: 'f_tenzone1' },
      { text: '👑 "Non sei tu il nemico. È quella CORONA. Ti sta divorando da duecento anni."', requires: { flag: 'sa_corona' }, next: 'f_corona1' },
      { text: '🪞 Estraete lo specchio d\'argento e glielo puntate contro', requires: { item: 'specchio_argento' }, next: 'f_specchio' },
      { text: '🧄 Brandite la treccia d\'aglio come una reliquia sacra!', requires: { item: 'aglio' }, removeItem: 'aglio', next: 'f_aglio' },
    ],
  },

  f_aglio: {
    location: 'vetta',
    npc: ['vesper'],
    caption: 'L\'arma segreta (secondo Gedeone)',
    text: `Estraete la treccia d'aglio e la brandite con la sicurezza di chi ha pagato DUE monete d'oro per l'arma definitiva contro i vampiri.

Silenzio.

Vesper la fissa. Poi vi fissa. Poi la rifissa.

> Vesper: "È... è AGLIO? Mi avete portato dell'AGLIO?" *(si preme le dita sulle tempie)* "L'aglio è un MITO. Una diceria. Una CALUNNIA inventata da un osteria di Valforte nel 1748 per vendere più bruschette! Io CUCINO con l'aglio! Il mio ragù era LEGGENDARIO!"

Fa un mezzo passo indietro comunque.

> Vesper: "...però il gesto. IL GESTO, capite? Duecento anni di rispetto del mestiere e voi mi presentate al rituale con l'ortaggio del pregiudizio. Sono OFFESO. Profondamente. Artisticamente."

Ha perso completamente il filo del discorso che stava provando. Il leggio è là, abbandonato. **(Vesper è sinceramente TURBATO: -2 ai suoi tiri nel primo round di un eventuale scontro!)**

*(Torvald, se presente, annota la storia del ragù. Per la locanda.)*`,
    sets: { vesper_turbato: true },
    choices: [
      { text: '⚔ Approfittate dello sconcerto: ALL\'ATTACCO!', next: 'f_boss_intro' },
      { text: '🎭 "Vespertino... la tua ballata merita un vero pubblico." (se sapete del suo passato)', requires: { flag: 'sa_passato_bardo' }, next: 'f_tenzone1' },
      { text: '👑 "Non sei tu il nemico. È quella CORONA che ti divora." (se conoscete il segreto)', requires: { flag: 'sa_corona' }, next: 'f_corona1' },
    ],
  },

  /* ---------- via dello specchio (gag + indebolimento) ---------- */

  f_specchio: {
    location: 'vetta',
    npc: ['vesper'],
    caption: 'Lo specchio della verità',
    text: `Lo specchio d'argento scintilla alla luce dell'eclissi. Vesper lo guarda... e nello specchio non c'è NESSUNO. Solo un mantello che fluttua vuoto e un leggio.

> Vesper: "Ma... ma io... IL COLORITO! Come faccio a sapere se il MANTELLO CADE BENE se non mi ci VEDO?! È per questo che tengo Gerbold! GERBOLD! ...Gerbold?"

Silenzio. Gerbold, ovunque sia, non risponde. Vesper vacilla, sinceramente scosso: duecento anni di pose provate alla cieca, e ora la prova davanti a tutti.

**(Vesper è TURBATO: inizierà l'eventuale scontro con -2 ai suoi tiri per il primo round!)**`,
    sets: { vesper_turbato: true },
    choices: [
      { text: '⚔ Approfittatene: ALL\'ATTACCO!', next: 'f_boss_intro' },
      { text: '🎭 "Vespertino... la tua ballata merita un vero pubblico." (se sapete del suo passato)', requires: { flag: 'sa_passato_bardo' }, next: 'f_tenzone1' },
      { text: '👑 "È la corona il mostro, non tu. Toglila. Guarda cosa sei diventato."', requires: { flag: 'sa_corona' }, next: 'f_corona1' },
    ],
  },

  /* ---------- via della corona ---------- */

  f_corona1: {
    location: 'vetta',
    npc: ['vesper'],
    caption: 'La verità sulla Corona',
    text: `Alla parola "corona", qualcosa cambia. La gemma rossa sull'altare *sibila* — un suono acido, offeso. E Vesper... Vesper si tocca la tempia, come per un mal di testa vecchio duecento anni.

> Vesper: "La corona... mi sta... no. NO. La corona è MIA. È l'unica che... l'unica che mi abbia mai DETTO DI SÌ. Quando la trovai nella cripta più profonda, lei CANTAVA per me. Solo per me! Diceva: 'con me, nessuno riderà mai più'..."

> Voi: "E ha mantenuto la promessa? O da duecento anni ridono ancora, solo che tu non li senti più?"

Vesper apre la bocca. La richiude. La gemma PULSA furiosa, e la voce del vampiro esce stranamente doppia, come se qualcun altro parlasse con lui:

> Vesper+: "**BASTA. Il rituale si compie ORA.**"

Afferra la corona. Ma le sue mani TREMANO: il dubbio è piantato. È il momento: parole o acciaio?`,
    choices: [
      { text: '🗣 "VESPERTINO! Lasciala! Duecento anni fa ridevano di una CANZONE. Non di TE!"', tag: 'Prova di Carisma — CD 14 (la corona sarà indebolita comunque)', check: { stat: 'CAR', dc: 14, success: 'f_corona_win', fail: 'f_boss_intro_indebolito' } },
      { text: '⚔ È troppo tardi per le parole: attaccate PRIMA che la indossi!', next: 'f_boss_intro_indebolito' },
    ],
  },

  f_corona_win: {
    location: 'vetta',
    npc: ['vesper'],
    caption: 'La scelta di Vespertino',
    text: `Le parole colpiscono più forte di qualsiasi maglio.

Vesper guarda la corona nelle proprie mani. La gemma rossa canta, sibila, PROMETTE — e per la prima volta in duecento anni, lui la *sente davvero*: una ninnananna che non è mai stata per lui. È solo l'esca di qualcosa di antico e affamato che voleva una notte eterna per sé.

> Vesper: *(piano)* "...il Re rise. La corte rise. E io... io ho passato duecento anni a costruire la vendetta perfetta per un pubblico che è MORTO DI VECCHIAIA nel frattempo." *(risata rotta)* "Nessuno... nessuno ride di me da un secolo e mezzo. Se lo sono DIMENTICATI. Ero solo io. Io e questa... COSA."

Solleva la corona sopra la testa — e per un attimo gelido temete il peggio —

— e la SCAGLIA contro l'altare di ossidiana.

**La Corona di Mezzanotte si spezza con un urlo che sentono fino a Brindolo.** La gemma esplode in mille schegge che si dissolvono in fumo. Il filo rosso nel cielo si spezza, l'anello si apre...

*(continua)*`,
    sets: { finale: 'redenzione', finale_redenzione: true },
    choices: [{ text: 'Guardate il cielo', next: 'e_alba_redenzione' }],
  },

  /* ---------- via della tenzone bardica ---------- */

  f_tenzone1: {
    location: 'vetta',
    npc: ['vesper'],
    caption: 'La Tenzone — round 1',
    text: `**"Abbiamo sentito la tua ballata."**

Sei parole, e Lord Vesper Morn — terrore di Lumelia, ladro del sole — si IMMOBILIZZA come colto in flagrante.

> Vesper: "Voi... l'avete... QUALE versione? Quella che gira è piena di ERRORI di trascrizione, la modulazione in terza strofa è—" *(si ricompone, mantello al vento)* "—IRRILEVANTE. È irrilevante! Il passato è morto! Come me! Che infatti sto BENISSIMO!"

> Voi: "Dimostralo. Un'ultima esibizione, Vespertino: TU contro NOI. Se conquisti il pubblico, saliremo noi stessi a metterti la corona in testa. Ma se il pubblico conquista TE..."

La vanità di duecento anni fa il suo lavoro: gli occhi di Vesper si ACCENDONO.

> Vesper: "Una TENZONE?! Ai MIEI tempi si facevano nelle taverne... palco condiviso, pubblico sovrano... OH, che meraviglia, che DRAMMA! Accetto! Scheletro! IL LIUTO!"

Lo scheletro del mantice corre a prendere un liuto polveroso. La sfida è: colpirlo al cuore (artistico). Chi apre per voi?`,
    choices: [
      { text: '🎼 Gli porgete lo SPARTITO ORIGINALE, conservato da Mirtilla per duecento anni', requires: { item: 'spartito' }, next: 'f_tenzone2' },
      { text: '🎵 Aprite con una canzone VOSTRA: sincera, stonata, vera', tag: 'Prova di Carisma — CD 12', check: { stat: 'CAR', dc: 12, success: 'f_tenzone2', fail: 'f_tenzone_fail1' } },
      { text: '🧠 Aprite analizzando la SUA ballata: "la terza strofa era avanti di duecento anni"', tag: 'Prova di Intelligenza — CD 12', check: { stat: 'INT', dc: 12, success: 'f_tenzone2', fail: 'f_tenzone_fail1' } },
    ],
  },

  f_tenzone2: {
    location: 'vetta',
    npc: ['vesper'],
    caption: 'La Tenzone — round 2',
    text: `Colpito. COLPITO! Vesper stringe il liuto al petto come uno scudo.

> Vesper: "La terza strofa... VOI l'avete CAPITA?" *(agli scheletri)* "LORO L'HANNO CAPITA! Duecento anni e finalmente qualcuno—" *(si ricompone, ma il mantello ormai sventola a mezz'asta)* "—continua. CONTINUATE."

Adesso tocca al colpo di grazia. Il vampiro è a UN passo dal crollo: gli manca solo ciò che il Re gli negò quella sera.

*(Vi guardate. Lo sapete tutti cos'è.)*`,
    choices: [
      { text: '👏 APPLAUDITE. Tutti insieme. Forte. Come duecento anni fa nessuno fece.', tag: 'Prova di Carisma — CD 13', check: { stat: 'CAR', dc: 13, success: 'f_tenzone_win', fail: 'f_tenzone_fail2' } },
      { text: '🎭 Chiedetegli di cantarla ORA, la Ballata. Il finale che non ebbe mai.', tag: 'Prova di Saggezza — CD 13', check: { stat: 'SAG', dc: 13, success: 'f_tenzone_win', fail: 'f_tenzone_fail2' } },
    ],
  },

  f_tenzone_win: {
    location: 'vetta',
    npc: ['vesper'],
    caption: 'L\'applauso',
    text: `E allora Vespertino Morn canta.

La *Ballata per un Re Sordo*, completa, sulla vetta di una torre sotto un sole spento. E — dannazione — è BELLA. Duecento anni di dolore le hanno dato quello che le mancava: adesso è vera.

L'ultima nota si spegne sull'abisso. Silenzio.

E voi APPLAUDITE. Non per strategia — be', non SOLO per strategia. Applaudite perché era giusto così. Lo scheletro col mantice applaude. I pipistrelli sulle guglie applaudono (a modo loro, con le ali: sembra grandine).

Vesper resta immobile, gli occhi rossi sgranati sotto l'eclissi. Poi qualcosa gli scivola sulla guancia. I vampiri non piangono; sarà umidità di torre.

> Vesper: "...duecento anni." *(guarda la corona sull'altare, e la sua voce si fa dura)* "E TU me li hai fatti passare ad aspettare un applauso, sussurrandomi che non sarebbe mai arrivato."

Afferra la Corona di Mezzanotte e la FRANTUMA sull'altare come un liuto scordato.

*(continua)*`,
    sets: { finale: 'redenzione', finale_redenzione: true },
    choices: [{ text: 'Guardate il cielo', next: 'e_alba_redenzione' }],
  },

  f_tenzone_fail1: {
    location: 'vetta',
    npc: ['vesper'],
    caption: 'La Tenzone — fischio a metà',
    text: `L'apertura... non decolla. La rima zoppa, l'accordo sbagliato — e Vesper se ne ACCORGE, perché è vanitoso ma non sordo.

> Vesper: *(gelido)* "Ah. AH! Capisco. Non siete pubblico: siete SICARI con un trucco da quattro soldi. Come il Re! Come TUTTI! Volevate farmi abbassare la guardia col mio stesso CUORE?!"

Il mantello torna a spiegarsi in modalità tempesta. La corona sull'altare RIDE — un suono orribile.

> Vesper: "Il rituale può attendere CINQUE minuti. Prima... la CRITICA."

*(La tenzone è fallita, ma la ferita è aperta: Vesper combatterà distratto — i suoi primi due round avranno -1 ai tiri.)*`,
    sets: { vesper_turbato: true },
    choices: [{ text: '⚔ E sia: BATTAGLIA!', next: 'f_boss_intro' }],
  },

  f_tenzone_fail2: {
    location: 'vetta',
    npc: ['vesper'],
    caption: 'La Tenzone — l\'applauso mancato',
    text: `L'applauso parte... male. Fuori tempo. Qualcuno esita un secondo di troppo, e in quell'ESITAZIONE Vesper — che da duecento anni non aspetta altro — legge tutto.

> Vesper: *(piano, pericolosissimo)* "State... FINGENDO. Come la corte. Applausi di cortesia. Il Re almeno ebbe l'onestà di RIDERMI in faccia."

Il liuto cade. Il mantello ESPLODE al vento. La gemma della corona pulsa come un cuore impazzito.

> Vesper: "Avete riaperto la ferita, eroi. Ora... la CHIUDO. CON VOI DENTRO."

*(Ci siete andati VICINISSIMI: Vesper è emotivamente a pezzi. Combatterà con -1 ai tiri per i primi due round, e la via della corona resta aperta durante lo scontro...)*`,
    sets: { vesper_turbato: true },
    choices: [{ text: '⚔ BATTAGLIA!', next: 'f_boss_intro' }],
  },

  /* ---------- BOSS FIGHT ---------- */

  f_boss_intro: {
    location: 'vetta',
    caption: 'BATTAGLIA FINALE — Lord Vesper Morn',
    text: `> Vesper: "E va bene. AZIONE!"

Schiocca le dita: il mantello si gonfia da solo (lo scheletro col mantice è al lavoro), due **pipistrelli colossali** calano dalle guglie, e l'aria si riempie di note d'organo che NESSUN organo sta suonando.

> Vesper: "Vi concedo un'ultima domanda prima del sipario. No? Nessuna? PECCATO. Era la parte migliore del copione!"

**È LA BATTAGLIA FINALE!** *(Consigli da DM: è un non-morto — la Sacra Folgore fa danni doppi. Attenzione: a metà scontro succederà QUALCOSA. Tenete pronte le pozioni!)*`,
    combat: {
      enemies: ['vesper', 'pipistrello', 'pipistrello'],
      victory: 'f_boss_fase2_check',
      defeat: 'f_sconfitta_boss',
      bossPhase: true,
    },
  },

  f_boss_intro_indebolito: {
    location: 'vetta',
    caption: 'BATTAGLIA FINALE — un vampiro col dubbio',
    text: `Vesper indossa la corona — ma le mani gli tremano ancora, e la corona SENTE il suo dubbio. I lampi viola si fanno incerti, a singhiozzo.

> Vesper+: "**Il rituale... si compie... comunque!**"

Due **pipistrelli colossali** calano dalle guglie. La battaglia è inevitabile — ma avete piantato un seme: *il legame tra Vesper e la corona è INCRINATO*.

**(Vantaggio narrativo: nella fase finale, la corona potrà essergli STRAPPATA! Anche i suoi primi round saranno più deboli.)**`,
    sets: { vesper_turbato: true, corona_incrinata: true },
    combat: {
      enemies: ['vesper', 'pipistrello', 'pipistrello'],
      victory: 'f_boss_fase2_check',
      defeat: 'f_sconfitta_boss',
      bossPhase: true,
    },
  },

  f_boss_fase2_check: {
    location: 'vetta',
    npc: ['vesper'],
    caption: 'La battaglia — INTERMEZZO',
    text: `Vesper cade su un ginocchio, il mantello finalmente AFFLOSCIATO. I pipistrelli sono fuggiti. Avete... vinto?

> Vesper: *(ansimando)* "Bravi... bravissimi... che COREOGRAFIA..." *(alza la testa: sta SORRIDENDO)* "...ma ogni grande spettacolo ha un SECONDO ATTO."

Con l'ultimo guizzo di forza, balza sull'altare e **SI CALA LA CORONA DI MEZZANOTTE SULLA FRONTE.**

Il mondo diventa viola. La gemma rossa DIVAMPA. L'ombra della torre si allunga fino all'orizzonte, e Vesper si solleva a mezz'aria, gli occhi due fornaci, la voce raddoppiata da qualcosa di antichissimo:

> Vesper Incoronato: "**IO SONO LA NOTTE. E LA NOTTE... NON APPLAUDE.**"`,
    choices: [
      { text: '⚔ FASE DUE: abbattete il Vesper Incoronato!', next: 'f_boss_fase2' },
      { text: '🫳 STRAPPATEGLI LA CORONA! (il legame è incrinato!)', requires: { flag: 'corona_incrinata' }, tag: 'Prova di Destrezza — CD 14', check: { stat: 'DES', dc: 14, success: 'f_corona_strappata', fail: 'f_boss_fase2_dopotentativo' } },
      { text: '🌙 Lasciate cadere la LACRIMA DI LUNA davanti a lui', requires: { item: 'lacrima_di_luna' }, removeItem: 'lacrima_di_luna', next: 'f_lacrima' },
    ],
  },

  f_lacrima: {
    location: 'vetta',
    npc: ['vesper'],
    caption: 'La Lacrima di Luna',
    text: `La Lacrima di Luna tocca la pietra della torre e **non si rompe: si apre.**

Il ricordo che uno di voi ha ceduto al Pescatore sboccia a mezz'aria come un'alba in miniatura: una risata d'infanzia, un abbraccio, un pomeriggio qualunque che era, semplicemente, perfetto. Luce vera, calda, PICCOLA — davanti alla notte immensa del Vesper Incoronato.

E la notte immensa... esita.

> Vesper Incoronato: "**Cos'è... questo... IO NON RICORDO NIENTE DEL GENERE—**"

> Vesper: *(la sua voce vera, sotto quella doppia, incrinata)* "...io sì. Io sì. Prima del castello. Prima della corte. C'era una taverna, e mia madre cantava, e nessuno... nessuno rideva DI me. Ridevano CON me."

La gemma rossa STRIDE, furiosa, cercando di richiudere la breccia. Ma la corona ha un difetto fatale: può prometterti che nessuno riderà mai più di te. **Non può darti un ricordo felice. Non ne ha mai avuto uno.**

È il momento: le sue mani stanno GIÀ salendo verso la corona.`,
    choices: [
      { text: '🗣 "Vespertino. Scegli tu, stavolta: la corona o la taverna."', tag: 'Prova di Carisma — CD 11 (la Lacrima vi assiste)', check: { stat: 'CAR', dc: 11, success: 'f_lacrima_win', fail: 'f_boss_fase2' } },
    ],
  },

  f_lacrima_win: {
    location: 'vetta',
    npc: ['vesper'],
    caption: 'La scelta della taverna',
    text: `Vesper Morn — Vespertino, ormai, il volto sotto la corona più giovane a ogni respiro — chiude gli occhi dentro il ricordo che gli avete regalato.

E sceglie la taverna.

Le sue mani strappano la **Corona di Mezzanotte** dalla propria fronte con un movimento solo, netto, definitivo, e la scagliano sull'altare di ossidiana con tutta la rabbia di duecento anni sprecati.

**CRACK.**

L'urlo della corona si sente fino a Brindolo. La gemma rossa esplode in mille schegge che si dissolvono in fumo, e con lei si dissolve la notte doppia, il mantello gonfio, il rituale — tutto, tranne un uomo pallido in ginocchio sulla vetta di una torre, che ride e piange insieme guardando un ricordo non suo brillare nell'aria.

> Vespertino: "...grazie. A chi di voi l'ha dato via, io... vi devo un ricordo. Vi devo MOLTO più di un ricordo."

Nel cielo, il filo rosso dell'eclissi si spezza.

*(continua)*`,
    sets: { finale: 'redenzione', finale_redenzione: true, lacrima_usata: true },
    choices: [{ text: 'Guardate il cielo', next: 'e_alba_redenzione' }],
  },

  f_boss_fase2: {
    location: 'vetta',
    caption: 'FASE DUE — Vesper Incoronato',
    text: `L'aria stessa sembra combattervi. Vesper fluttua sopra l'altare, avvolto in un turbine di notte solida.

*(Fase 2: è più potente ma la corona ha consumato parte della sua essenza — i suoi PV NON sono al massimo. Dategli tutto quello che avete! Le pozioni non si conservano per il "dopo": USATELE.)*`,
    combat: {
      enemies: ['vesper_corona'],
      victory: 'f_vittoria_boss',
      defeat: 'f_sconfitta_boss',
    },
  },

  f_boss_fase2_dopotentativo: {
    location: 'vetta',
    caption: 'Il tentativo — quasi!',
    text: `Il balzo è PERFETTO, le dita si chiudono sul metallo nero — ma la corona URLA e una frustata d'ombra vi scaglia indietro. **(-5 PV a chi ci ha provato... e a chi gli è caduto addosso.)**

> Vesper Incoronato: "**AUDACE. Nel copione non c'era. QUASI apprezzabile.**"

Non resta che la maniera classica: LEGNATE.`,
    damage: 5,
    combat: {
      enemies: ['vesper_corona'],
      victory: 'f_vittoria_boss',
      defeat: 'f_sconfitta_boss',
    },
  },

  f_corona_strappata: {
    location: 'vetta',
    npc: ['vesper'],
    caption: 'LA CORONA STRAPPATA',
    text: `Un balzo. Un ingaggio. Una piroetta che nessuno di voi saprà mai ripetere.

E la **Corona di Mezzanotte viene STRAPPATA dalla fronte di Vesper Morn.**

Il vampiro crolla come una marionetta tagliata. La corona, nelle vostre mani, URLA e si dibatte — la gemma rossa cerca disperatamente una fronte, una tempia, un pensiero a cui aggrapparsi, sussurrando promesse a raffica: *"il sole ANCHE per te è volgare — ascolta — con me nessuno riderà MAI più di—"*

> Vesper: *(da terra, con la voce di nuovo SUA, roca)* "...l'altare... SPACCATELA... sull'altare... è quello il suo... il suo PALCO..."

La corona, però, non ha finito. Tra le vostre dita, la gemma rossa smette di urlare e comincia a *sussurrare* — a OGNUNO di voi, con una voce diversa, la voce giusta:

*"Con me la locanda non fallirà mai... l'Accademia si INGINOCCHIERÀ... nessuna lettera resterà mai più senza risposta... la luce non si spegnerà MAI più, se sarai TU a portarla..."*

È leggera. È bellissima. E vi starebbe benissimo.`,
    choices: [
      { text: '💥 SULL\'ALTARE. SUBITO. (spaccatela!)', next: 'f_corona_distrutta' },
      { text: '👑 "...e se la indossassimo NOI? Solo per sistemare le cose. Solo per un po\'."', tag: 'Prova di Saggezza — CD 13 (resistere alla tentazione)', check: { stat: 'SAG', dc: 13, success: 'f_tentazione_ok', fail: 'f_tentazione_ko' } },
    ],
  },

  f_tentazione_ok: {
    location: 'vetta',
    npc: ['vesper'],
    caption: 'La Tentazione — respinta',
    text: `Per un lungo istante, la mano che regge la corona... si alza. Verso una fronte. La vostra.

Poi chi di voi ha la testa più lucida guarda giù: Vesper Morn, in ginocchio tra i frammenti del suo rituale, duecento anni di eternità sprecata negli occhi. Ecco com'è, uno che ha detto di sì.

> Voi: "...no. Nessuno dovrebbe portarti. Nemmeno noi. SOPRATTUTTO noi."

La corona STRILLA di frustrazione — un suono che scheggia due merli della torre — perché sa di aver perso: la sua unica arma è il desiderio, e voi avete appena smesso di desiderarla.

> Vesper: *(piano, da terra)* "Duecento anni... e a me non è riuscito in duecento anni quello che voi avete fatto in dieci secondi. Chapeau. Sinceramente."

**(Avete resistito alla Corona di Mezzanotte. Pochissimi, nella storia di Lumelia, possono dirlo.)**`,
    sets: { tentazione_resistita: true },
    choices: [{ text: '💥 E ora: L\'ALTARE.', next: 'f_corona_distrutta' }],
  },

  f_tentazione_ko: {
    location: 'vetta',
    npc: ['vesper'],
    caption: 'Il Regno dei Quattro Secondi',
    text: `La corona tocca la fronte di uno di voi.

Per la cronaca di Lumelia, il regno che ne segue dura **quattro secondi esatti**, e viene ricordato così:

*Secondo uno:* gli occhi del nuovo sovrano diventano viola e la sua voce esce in MAIUSCOLO: "**FINALMENTE. COME PRIMO DECRETO—**"

*Secondo due:* il resto del gruppo, con la prontezza di chi si conosce da mille (va bene, tre) avventure, placca il monarca in carica con un rugby di gruppo degno degli annali.

*Secondo tre:* la corona rotola sul pavimento della torre strillando "**NON È COSTITUZIONALE**" con la voce di prima.

*Secondo quattro:* l'ex sovrano, seduto per terra, sbatte le palpebre e chiede: "...cos'è successo? Perché mi fa male TUTTO? E perché stavo per dire 'decreto'?"

**(-3 PV al monarca deposto, per via del placcaggio. Ne è valsa la pena.)**

> Vesper: *(da terra, quasi divertito)* "Quattro secondi. Il mio record negativo era un'ora. Siete AMICI migliori dei miei, devo dire."`,
    sets: { tentazione_ceduta: true },
    damage: 3,
    choices: [{ text: '💥 BASTA. L\'ALTARE. ORA.', next: 'f_corona_distrutta' }],
  },

  f_corona_distrutta: {
    location: 'vetta',
    npc: ['vesper'],
    caption: 'La fine della Corona di Mezzanotte',
    text: `La Corona di Mezzanotte incontra l'ossidiana alla massima velocità consentita dalla fisica.

**CRACK.**

L'urlo si sente fino a Brindolo. Poi: silenzio. La gemma rossa esplode in mille schegge che si dissolvono in fumo, portandosi via duecento anni di ninnananne avvelenate.

E nel cielo, il filo rosso dell'eclissi... si spezza.

*(continua)*`,
    sets: { finale: 'corona_distrutta', finale_corona_distrutta: true },
    choices: [{ text: 'Guardate il cielo', next: 'e_alba_redenzione' }],
  },

  f_vittoria_boss: {
    location: 'vetta',
    caption: 'La caduta della Notte',
    text: `L'ultimo colpo attraversa il turbine d'ombra e trova il bersaglio.

Vesper Incoronato si spegne a mezz'aria — letteralmente: la notte che lo avvolgeva si sfalda come stoffa vecchia, e il vampiro precipita sull'altare. La Corona di Mezzanotte rotola via dalla sua fronte, sibilando furiosa, cercando freneticamente un'altra testa...

> Vesper: *(a terra, con la voce di nuovo SUA, debolissima)* "...no. No, non di nuovo. Non un ALTRO me."

E con l'ultimo gesto — il migliore dei suoi duecento anni — la afferra e la SPACCA sull'altare di ossidiana.

**CRACK.**

L'urlo della corona si sente fino a Brindolo. La gemma esplode in fumo rosso che il vento dell'eclissi spazza via. E nel cielo, il filo scarlatto... si spezza.

*(continua)*`,
    sets: { finale: 'vittoria', finale_vittoria: true },
    choices: [{ text: 'Guardate il cielo', next: 'e_alba' }],
  },

  f_sconfitta_boss: {
    location: 'cripta',
    caption: 'Buio. Poi... una candela verde.',
    text: `Buio.

Vi risvegliate doloranti su lastre di pietra fredda: le segrete del castello. Vesper non vi ha finiti — "*uccidere il pubblico è da DILETTANTI*", lo ricordate vagamente pontificare — ma vi ha chiusi qui "fino a dopo il rituale".

Una chiave gira nella serratura. La porta si apre su una figura ossuta con una candela verde e — riconoscibile tra mille — una livrea perfetta.

> Gerbold: "I signori hanno riposato? Bene. Ho preso la libertà di recuperare il vostro equipaggiamento, lucidarlo — deformazione professionale — e di lasciare aperta la scala della torre. Il 'padrone' è talmente impegnato a montarsi la testa che non si è accorto di NULLA."

*(Anche se non l'avevate mai incontrato, o l'avevate combattuto: c'è una cosa che i maggiordomi rispettano più del protocollo, ed è il CORAGGIO. Inoltre nessuno gli paga gli straordinari da due secoli.)*

> Gerbold: "Il rituale si completa tra POCHI MINUTI. Se corrono, i signori arrivano in tempo per il gran finale. E... signori? Stavolta, VINCETE. Odio i lieti fini rimandati."

**(Tutti i PV e le abilità sono stati ripristinati. Le pozioni usate no: Gerbold non fa miracoli.)**`,
    fullHeal: true,
    choices: [{ text: '🏃 Di corsa alla vetta — SECONDO ROUND!', next: 'f_boss_intro' }],
  },

  /* ---------- sconfitta generica (non-boss) ---------- */

  sconfitta_generica: {
    location: 'strada',
    caption: 'Tutto nero... ma non è finita',
    text: `Buio. Poi odori: erba, fumo di legna, unguento alle ortiche.

Vi risvegliate doloranti attorno a un fuocherello. Le vostre ferite sono state bendate con perizia da qualcuno che è già sparito nella notte, lasciando solo impronte piccole... e una scia di monete mancanti: **il "soccorritore" si è pagato il disturbo (-15 monete d'oro).**

Su una foglia, un biglietto scritto col carbone: *"Siete stati fortunati. La prossima volta, siate anche BRAVI. — Un ammiratore (più o meno)"*

Vi rialzate, scrollate la polvere e vi rimettete in cammino: Lumelia conta su di voi, ammaccature comprese.

**(PV e abilità ripristinati. Riproverete lo scontro da capo: stavolta, tattica!)**`,
    fullHeal: true,
    goldLoss: 15,
    choices: [{ text: '↩ Tornate sui vostri passi e riprovate', next: 'RETRY_COMBAT' }],
  },

  /* ==================== EPILOGHI ==================== */

  e_alba: {
    location: 'alba',
    npc: ['vesper'],
    caption: 'L\'ALBA — per la prima volta da... ieri',
    text: `Il disco nero si sgretola come cenere soffiata via. E il sole — IL SOLE! — esplode di nuovo nel cielo di Lumelia, caldo e abbagliante e meravigliosamente NORMALE.

Dalla vetta della torre vedete il mondo riaccendersi: i boschi, i campi, il nastro lontano del fiume, e — piccolo piccolo all'orizzonte — il campanile di Brindolo che suona a festa.

Vesper Morn giace tra i frammenti della corona. Sconfitto, spettinato, il mantello ridotto a uno straccio. Alla luce del sole (che curiosamente non lo incenerisce: *"effetto residuo della corona"*, direbbe Lyra — "*fortuna sfacciata*", direbbe Fizzle) sembra solo... un uomo pallido e stanchissimo, di duecentoventi anni.

> Vesper: "...e adesso? Il finale prevede la mia distruzione, immagino. Il pubblico ADORA le esecuzioni. Fate pure: ho già pronto un ultimo monologo. Dura solo venti minuti."`,
    choices: [
      { text: '⚖ "Niente esecuzioni. Verrai a Brindolo a RIPARARE: lavori utili e concerti gratis."', next: 'e_finale_giusto' },
      { text: '🕊 "Vai. Sparisci. E che non si senta MAI più parlare di te."', next: 'e_finale_esilio' },
    ],
  },

  e_alba_redenzione: {
    location: 'alba',
    npc: ['vesper'],
    caption: 'L\'ALBA — per la prima volta da... ieri',
    text: `Il disco nero si sgretola come cenere soffiata via. E il sole — IL SOLE! — esplode di nuovo nel cielo di Lumelia, caldo e abbagliante e meravigliosamente NORMALE.

Vespertino Morn resta in piedi tra i frammenti della corona, a fissare la sua prima alba dopo duecento anni. La luce non lo incenerisce: con la corona è morta anche la maledizione, e quello che resta è solo... un uomo pallido, spettinato, di duecentoventi anni, con gli occhi pieni di sole.

> Vespertino: "È... è sempre stata così? Così... *gialla*?" *(si volta verso di voi, e per la prima volta il suo sorriso non è teatrale)* "Ho spento il sole perché nessuno rideva PIÙ di me, sapete. Sciocchezza magnifica: era la CORONA che rideva. Da duecento anni. E io che credevo fosse il pubblico."

Si guarda le mani, il mantello strappato, l'alba.

> Vespertino: "Ho un debito con un intero regno e duecento anni di canzoni arretrate. Da dove... da dove si comincia, a rifare tutto?"`,
    choices: [
      { text: '🍻 "Si comincia da una taverna. Conosciamo un Gallo Storto che cerca un musicista."', next: 'e_finale_bardo' },
    ],
  },

  e_finale_giusto: {
    location: 'alba',
    caption: 'EPILOGO — Giustizia (con calendario eventi)',
    text: `**Sei mesi dopo.**

Brindolo non è mai stata così bene. Il "programma di riabilitazione" di Vesper Morn procede: ha ricostruito il ponte del sindacato goblin (ora sono i suoi più accaniti fan: "LUI SÌ CHE PAGA GLI STRAORDINARI!"), tiene concerti gratuiti ogni venerdì e insegna canto al coro dei bambini, che lo adorano e lo chiamano "il maestro Pipistrello".

Gerbold — riassemblato, dimissionario e RAGGIANTE — gestisce la biglietteria. Ha fatto la sua prima vacanza al mare: esiste un ritratto di uno scheletro in camicia hawaiana su una sdraio, ed è l'immagine più bella che vedrete mai.

La vostra statua in piazza è venuta benissimo (Zonk è ritratto mentre fa i fiorellini all'uncinetto, com'era suo espresso desiderio). Le 500 monete sono state pagate fino all'ultima. La cena da Bocciolo è gratis a vita — per la GIOIA di Bocciolo.

E quando il sole tramonta su Brindolo — *tramonta e poi RISORGE, ogni giorno, come deve* — dalla taverna parte sempre la stessa canzone: la *Ballata per un Re Sordo*, seconda versione. Quella con il finale nuovo.

**🌅 FINE — Avete salvato il sole, il regno e perfino il cattivo. Partita PERFETTA, eroi di Brindolo!**`,
    ending: true,
  },

  e_finale_esilio: {
    location: 'alba',
    caption: 'EPILOGO — Il vagabondo',
    text: `**Sei mesi dopo.**

Vesper Morn se n'è andato quella mattina stessa, mantello strappato al vento, senza voltarsi. Ogni tanto arrivano voci: un menestrello pallido che canta nelle locande di frontiera, sempre gratis, sempre a capo coperto, che sparisce prima dell'alba per abitudine più che per necessità. Dicono che sia bravo. Dicono che alla fine di ogni canzone sussurri "grazie" al pubblico, anche quando il pubblico è un oste e due ubriachi.

Brindolo vi ha eretto la statua promessa (magnifica: Zonk è ritratto con i fiorellini all'uncinetto, e la piccioncina che nidifica sull'elmo di Torvald sembra messa apposta). Le 500 monete: pagate. La fama: immensa. Il sole: puntualissimo, ogni mattina.

Gerbold è rimasto al castello, che ora è SUO per usucapione ("duecento anni di possesso ininterrotto, ho i documenti"). L'ha trasformato in una locanda a tema: *"Il Crepuscolo — Soggiorni Gotici per Famiglie"*. È sempre pieno.

E nelle sere d'estate, quando i grilli cantano e la birra è fresca, a Brindolo si racconta di sei eroi che salvarono il sole... e lasciarono andare l'uomo che l'aveva spento. C'è chi dice che fu clemenza. C'è chi dice che fu saggezza. Bocciolo dice che eravate solo troppo stanchi per un altro combattimento, ma a Bocciolo piace rovinare le storie.

**🌅 FINE — Il sole è salvo e la leggenda è vostra, eroi di Brindolo!**`,
    ending: true,
  },

  e_finale_bardo: {
    location: 'alba',
    caption: 'EPILOGO — La seconda carriera di Vespertino Morn',
    text: `**Sei mesi dopo.**

Il "Gallo Storto" ha dovuto RADDOPPIARE i tavoli.

Ogni venerdì sera, Vespertino Morn — ex terrore di Lumelia, attuale musicista residente — sale sul palchetto che Bocciolo gli ha costruito accanto al camino, accorda il liuto, e per due ore incanta un pubblico che arriva perfino dalla capitale. Chiude sempre con la *Ballata per un Re Sordo*. Il pubblico la conosce a memoria. La cantano INSIEME. E lui, ogni volta, alla fine, resta un secondo in silenzio a occhi chiusi, come a controllare che sia tutto vero.

Nonna Ortica scende dal bosco per i concerti ("solo per criticare", dice, in prima fila). Gastone fornisce la birra scura ("SENZA MIELE, come natura comanda"). Gerbold fa il buttafuori più elegante della storia: nessuno ha mai osato fare a botte davanti a uno scheletro in frac. I goblin del sindacato gestiscono il guardaroba — tariffa fissa, ricevuta su foglia.

La vostra statua in piazza è splendida. Ma la vostra vera ricompensa è il tavolo grande vicino al camino, riservato PER SEMPRE: *"Compagnia del Sole Riacceso — non spostare MAI"*.

E quando qualche viandante chiede a Bocciolo se è vera, la storia del vampiro che spense il sole per un applauso, l'oste indica il palco, la sala che canta, il bardo pallido che sorride:

*"Vera com'è vero che il sole domattina sorge. E sai la parte più bella? Il finale l'hanno scritto sei clienti abituali."*

**🌅 FINE — Il finale perfetto: avete salvato il sole CON UN APPLAUSO. Leggende, altro che eroi!**`,
    ending: true,
  },
};

/* Scena iniziale della campagna */
const CAMPAIGN_START = 'p1';

/* Mappa del mondo: luoghi e coordinate (per il canvas della mappa) */
const WORLD_MAP = [
  { key: 'brindolo',  label: 'Brindolo',              x: 0.18, y: 0.72, scenes: ['p1','p1b','p2','p2_calma_ok','p2_calma_ko','p2_studio_ok','p2_studio_ko','p2_stufato','p3','p3_nego_ok','p3_nego_ko','p3_info','v1','v_emporio','v_mirtilla','v_tempio','q_capra1','q_capra1_tracce_ko','q_capra2','q_capra2_ko','q_capra_salvata','q_corvo1','q_corvo_ok','q_corvo_ko'] },
  { key: 'ponte',     label: 'Ponte dei Goblin',      x: 0.38, y: 0.60, scenes: ['v2','v2_fight','v2_fight_insulted','v2_vittoria','v2_paga','v2_sindacato','v2_paura','v2_guide'] },
  { key: 'bivio',     label: 'Bivio della Civetta',   x: 0.50, y: 0.50, scenes: ['v3'] },
  { key: 'bosco',     label: 'Bosco dei Sussurri',    x: 0.30, y: 0.30, scenes: ['b1','b1_alberi','b1_persi','b1_ragni_vinti','b2','b2_giusto','b2_sbagliato','b2_sbagliato2','b2_funghi_vinti','b3_arrivo','b3','b3_gag','b3_riso_ok','b3_riso_meh','b3_lupi','b3_lupi_vinti','b4'] },
  { key: 'miniere',   label: 'Miniere di Ferrovecchio', x: 0.70, y: 0.34, scenes: ['m1','m1_test','m1_apre_test','m1_apre_test2','m1_sbaglio','m1_caduta','m2_condotto','m2_condotto_corda','m1_apre','m2','m2_deposito','m2_carrello_ok','m2_carrello_ko','m2_piedi','m3','m3_modulo_ok','m3_modulo_ko','m3_fight','m3_fight_win','m4'] },
  { key: 'molo',      label: 'Fiume Torbido',         x: 0.76, y: 0.58, scenes: ['r1','r1_sbagliato','r1_tariffa','r1_commosso','r1_offeso','r1_remo','r1_remo_fail','r1_anguille','r2','r2_ko','r3','r3_ascolto','r4','r4_dono','r4_rifiuta','r5','r5_ko','r6','r7'] },
  { key: 'castello',  label: 'Castello Crepuscolo',   x: 0.52, y: 0.12, scenes: ['c1','c_maschere','c_maschere_ok','c_maschere_ok2','c_maschere_ko','c_maschere_ko_win','c_ballo','c_ballo_danza','c_ballo_pesta','c_ballo_buffet','c_cantine','c_giardino','c_mura_ok','c_mura_ko','c_mura_ko_win','c_gerbold','c_gerbold_alleato','c_gerbold_fight','c_gerbold_sconfitto','c_scala','c_scala_riposo','c_scala_corsa','c_vetta','f_aglio','f_specchio','f_corona1','f_corona_win','f_tenzone1','f_tenzone2','f_tenzone_win','f_tenzone_fail1','f_tenzone_fail2','f_boss_intro','f_boss_intro_indebolito','f_boss_fase2_check','f_boss_fase2','f_boss_fase2_dopotentativo','f_corona_strappata','f_tentazione_ok','f_tentazione_ko','f_corona_distrutta','f_lacrima','f_lacrima_win','f_vittoria_boss','f_sconfitta_boss','e_alba','e_alba_redenzione','e_finale_giusto','e_finale_esilio','e_finale_bardo'] },
];
