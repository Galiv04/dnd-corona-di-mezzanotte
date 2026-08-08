/* ============ ATTO 2C — IL FIUME (bozza) ============
   File di lavoro: NON è collegato al motore di gioco.
   Terza via verso il Castello Crepuscolo, da innestare al Bivio della Civetta (v3)
   con una nuova scelta, ad es.:
   { text: '🛶 Il Molo del Vecchio Salice — si dice che il Fiume Torbido passi SOTTO il castello',
     next: 'r1', sets: { via: 'fiume' } }

   Formato scena e scelta identico a campaign.js:
   { id, location, caption, text, choices: [...], combat: {...} }
   { text, tag?, next?, check?, sets?, requires?, gold?, item?, removeItem?, once? }
   check: { stat, dc, success, fail }
   combat: { enemies: [...], victory, defeat, loot?: { gold } }

   Punto d'uscita: l'ultima scena (r7) chiude con next: 'c_gerbold',
   raccordandosi all'Atto 3 esistente (come fanno c_cantine e c_giardino).
   ======================================================================= */

const FIUME_ITEMS = {
  lacrima_di_luna: {
    name: 'Lacrima di Luna',
    desc: 'Una lacrima d\'argento che non si asciuga mai. Custodisce un ricordo felice che non è più vostro — ma nell\'ora più buia potrebbe restituirvi la luce.',
    usable: false,
  },
  fischietto_di_bertoldo: {
    name: 'Fischietto di Bertoldo',
    desc: 'Un fischietto d\'ottone annerito dal tempo. Si dice richiami l\'attenzione di qualunque fantasma d\'acqua nel raggio di un fiume.',
    usable: false,
  },
};

/* ---------- BESTIARIO DEL FIUME ---------- */

const FIUME_ENEMIES = {
  anguilla: {
    name: 'Anguilla del Torbido', sprite: 'anguilla',
    maxHp: 11, ac: 12, ai: 'random',
    attack: { name: 'Morso Guizzante', bonus: 3, dice: [1, 6], plus: 1 },
    flavor: 'Lunga, viscida e permalosissima se le tocchi il nido tra le canne.',
  },
  spirito_fiume: {
    name: 'Spirito del Fiume', sprite: 'spirito_fiume',
    maxHp: 20, ac: 13, ai: 'weakest', undead: true,
    attack: { name: 'Corrente Gelida', bonus: 4, dice: [1, 8], plus: 1 },
    flavor: 'Un\'ombra d\'acqua che sorveglia il canneto da più tempo di quanto chiunque ricordi.',
  },
};

const FIUME_SCENES = {

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

Non se ne va. Anzi, si avvicina.`,
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

Il barcone si impenna, i massi neri sfrecciano a un palmo dallo scafo, e serve ogni braccio del gruppo, coordinato, per non finire rovesciati nella corrente gelida.`,
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

Il barcone, ammaccato ma intero, esce dalle rapide zoppicando come un'anatra ubriaca e decisamente offesa.`,
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

Bisogna riprendere la rincorsa: i remi doloranti, i muscoli che protestano formalmente — ma stavolta, sapendo dove NON spingere, il barcone trova finalmente la fessura giusta nel velo d'acqua e scivola dentro la grotta, ansante ma intero.`,
    damage: 3,
    choices: [{ text: 'Dentro, finalmente', next: 'r6' }],
  },

  r6: {
    location: 'cisterna',
    caption: 'La Grotta della Cisterna',
    text: `Oltre la cascata, il fiume si acquieta in una grotta enorme, illuminata da cristalli azzurri incastonati nella roccia — cugini, probabilmente, di quelli visti nelle Miniere di Ferrovecchio, anche se nessuno qui potrà mai confermarlo con certezza. L'acqua scorre placida verso un arco di pietra scavato a mano: umano, non naturale.

> Bertoldo: "La Cisterna del castello. Ci arrivo fin qui da sempre, ma non sono mai salito oltre: un fantasma d'acqua in una cantina di vampiri è una combinazione che nessuno dei due gradirebbe. Da lì in su, tocca a voi."

Il barcone approda su una banchina di pietra coperta di muschio fosforescente. Sopra di voi, una scala di servizio sale nel buio, tagliata nella roccia dalle stesse mani che duecento anni fa scavarono anche le miniere: qualcuno, all'epoca, amava decisamente le scorciatoie sotterranee più del dovuto.

Bertoldo lega il barcone a un anello di ferro arrugginito, con la cura meticolosa di chi non è affatto sicuro di voler concludere questo viaggio.`,
    choices: [{ text: 'Sbarcate sulla banchina', next: 'r7' }],
  },

  r7: {
    location: 'cisterna',
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

};

/* Elenco di tutte le scene del ramo del Fiume (Atto 2C) */
const FIUME_MAP_SCENES = [
  'r1', 'r1_sbagliato', 'r1_tariffa', 'r1_commosso', 'r1_offeso',
  'r1_remo', 'r1_remo_fail', 'r1_anguille',
  'r2', 'r2_ko',
  'r3', 'r3_ascolto',
  'r4', 'r4_dono', 'r4_rifiuta',
  'r5', 'r5_ko',
  'r6', 'r7',
];
