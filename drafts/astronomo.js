/* ============ DEVIAZIONE OPZIONALE — LA TORRE DELL'ASTRONOMO (bozza) ============
   File di lavoro: NON è collegato al motore di gioco.
   Quarta scelta al Bivio della Civetta (v3), marcata come deviazione facoltativa
   ("costa tempo ma...") — allunga la storia e RICONFLUISCE sempre al bivio stesso,
   da cui il giocatore sceglie comunque bosco/miniere/fiume.

   Innesto suggerito in v3.choices, ad es.:
   { text: '🔭 Un sentiero laterale porta a una torre pendente. Si dice che l\'astronoma
            del re l\'abbia prevista, questa eclissi — costa tempo ma potrebbe valerne la pena',
     next: 't1' }

   Formato scena e scelta identico a campaign.js:
   { id, location, caption, text, choices: [...], combat: {...}, sets?, item?, item2? }
   { text, tag?, next?, check?, sets?, requires?, gold?, item?, removeItem?, once? }
   check: { stat, dc, success, fail }
   combat: { enemies: [...], victory, defeat, loot?: { gold } }

   Punto d'uscita: l'ultima scena (t8) chiude con next: 'v3', riportando al Bivio
   della Civetta con i tesori ottenuti (mappa_stellare, lente_di_ottavia).

   Painter usati come segnaposto (location esistenti): 'strada' (esterno torre),
   'miniera' e 'cripta' (interni bui della torre), 'vetta' (terrazza del telescopio).
   Painter NUOVI consigliati (vedi report finale): torre_pendente_esterno,
   torre_interno_scala, osservatorio, biblioteca_caos.
   ================================================================================= */

const ASTRO_ITEMS = {
  mappa_stellare: {
    name: 'Mappa Stellare di Ottavia',
    desc: 'Disegnata a mano, con annotazioni frenetiche a margine e almeno una macchia di tè. Rivela un dettaglio cruciale sul rituale di Vesper — il tipo di dettaglio che si nota solo se qualcuno ci ha passato sopra vent\'anni a guardare il cielo.',
    usable: false,
  },
  lente_di_ottavia: {
    name: 'Lente di Ottavia',
    desc: 'Una lente da telescopio smontata a mano, tarata per concentrare anche l\'ultimo filo di luce rimasto nel cielo spento. Contro i non-morti, quel filo taglia che è un piacere.',
    combat: { dice: [3, 6], holy: true },
    icon: '🔭',
  },
};

/* ---------- BESTIARIO DELLA TORRE ---------- */

const ASTRO_ENEMIES = {
  gatto_astrale: {
    name: 'Perielio, Gatto Astrale', sprite: 'wolf',
    maxHp: 10, ac: 12, ai: 'random',
    attack: { name: 'Zampata Costellata', bonus: 2, dice: [1, 4], plus: 0 },
    flavor: 'Un gatto normale, se non fosse che ogni tanto diventa leggermente trasparente e attraversa i muri. Ottavia giura sia "solo un vezzo".',
  },
};

const ASTRO_SCENES = {

  /* ==================== DEVIAZIONE — LA TORRE DELL'ASTRONOMO ==================== */

  t1: {
    location: 'strada',
    caption: 'La Torre Pendente — oltre il sentiero laterale',
    text: `La strada laterale che si stacca poco prima del Bivio della Civetta finisce davanti a una torre che sembra aver perso una scommessa con la gravità. **Pende** di un buon quindici gradi verso ovest, tenuta su — a giudicare dai rumori che vengono da dentro — più da cocciutaggine che da malta.

Alla base, un cartello inchiodato storto (naturalmente) recita: *"OSSERVATORIO STELLARE DI OTTAVIA STELLAROSSA. SUONARE. NON RIDERE. Il ridere è già stato fatto da tutti quelli che dovevano crederle, e guardate un po' come è finita."*

Sui davanzali, alcuni gatti siedono a un'angolazione palesemente impossibile rispetto al resto del mondo, del tutto a loro agio: hanno smesso di notare che il pavimento non è dritto da anni.

Una finestra al terzo piano si spalanca di scatto.

> Ottavia: *(sporgendosi pericolosamente)* "L'ECLISSI! Finalmente! Io — QUARANTOTTESIMA! È il numero fortunato, lo sapevo, lo SAPEVO che prima o poi—"

Si interrompe, guarda giù, vi vede davvero.

> Ottavia: "Oh. Persone vere. Bene, benissimo, salite SUBITO, ho grafici, ho TABELLE, ho un gatto che dorme sopra le prove più importanti ma è comunque un ottimo assistente di ricerca!"

La finestra si richiude di scatto. Da dentro, il rumore di qualcosa — molte cose — che rotola da un lato all'altro della stanza.

Il sentiero verso il Bivio è ancora lì, alle vostre spalle: potreste tornare indietro senza aver perso troppo tempo. Ma la porta della torre, socchiusa, promette più di una semplice chiacchierata.`,
    sets: { via_astronomo: true },
    choices: [
      { text: '🚪 Bussate ed entrate', next: 't2' },
      { text: '🗣 "Ci hanno detto che aveva ragione. Siamo qui per ascoltarla."', next: 't2', sets: { ottavia_creduta: true } },
    ],
  },

  t2: {
    location: 'miniera',
    caption: 'La Scala che Pende — primo rampante',
    text: `Dentro, la torre è ancora peggio di quanto sembrasse da fuori: il pavimento del pianterreno pende talmente a sinistra che un tavolo intero si è incagliato contro il muro come una nave arenata. Contro lo stesso muro, in un'unica composizione, tre candelabri, due tazze da tè (ancora piene) e un gatto — profondamente addormentato, del tutto imperturbabile.

> Ottavia: *(già a metà scala, senza voltarsi)* "Non toccate la pila a sinistra, ormai è un ecosistema, ci convivo. La scala invece pende dall'ALTRA parte — quindi tenetevi a destra, o almeno provateci. Io cammino storta anche quando sono fuori dalla torre, ormai è un problema strutturale mio, non solo suo."

La scala a chiocciola sale stretta e, come promesso, pende in senso opposto al pianterreno: ogni gradino sembra suggerire con insistenza di scivolare verso il vano centrale, dove — lo notate solo ora — c'è un buco profondo che rende l'idea poco allettante.

> Ottavia: "Il vano l'ho lasciato apposta, per il tiro dell'astrolabio. O forse ci è caduto qualcosa di grosso vent'anni fa e non ho più avuto il coraggio di guardare giù. I dettagli sfumano, col tempo."

Salite dietro di lei, con la schiena incollata al muro giusto e il cuore un po' meno.`,
    choices: [
      { text: '👣 Seguite ESATTAMENTE i passi di Ottavia, uno a uno', next: 't3' },
      { text: '🧗 Andate a modo vostro, aggrappandovi al muro', tag: 'Prova di Destrezza — CD 12', check: { stat: 'DES', dc: 12, success: 't3', fail: 't2_capitombolo' } },
    ],
  },

  t2_capitombolo: {
    location: 'miniera',
    caption: 'Il Capitombolo',
    text: `Il piede scivola sul gradino sbagliato — quello che sembrava il più solido, ovviamente — e il resto è un susseguirsi di *bonk*, *ahia* e almeno un *miao* fortemente indignato quando qualcuno atterra a un palmo dalla pila di gatto-e-tazze-da-tè.

Rotolate tutti insieme fino al pianerottolo successivo in una composizione umana che chiamereste "artistica" solo per salvare l'orgoglio.

> Ottavia: *(affacciandosi dall'alto, sinceramente colpita)* "Oh! Bella caduta! Anch'io sono rotolata così, la prima settimana. Ci si abitua. O meglio: mi sono abituata IO a cadere. La torre no, resta indignata ogni volta, come se fosse una novità assoluta."

Il gatto travolto non sembra essersene accorto più di tanto: si sposta di dieci centimetri e si riaddormenta, come se fosse una procedura ormai collaudata da anni di rotolamenti altrui.

Vi rialzate, doloranti nell'orgoglio più che nel corpo — **nessun danno, solo dignità** — e riprendete la salita un gradino alla volta, con la grazia di chi ha appena imparato, a proprie spese, dove NON mettere i piedi.`,
    choices: [{ text: 'Riprendete la salita, più cauti', next: 't3' }],
  },

  t3: {
    location: 'cripta',
    caption: 'L\'Osservatorio — dove il soffitto ha smesso di fidarsi del pavimento',
    text: `La stanza è un tripudio ordinato di caos: telescopi di ogni misura puntati verso direzioni a caso (il pavimento pende ora dal lato opposto rispetto alle scale, e ogni strumento se n'è accorto a modo suo), astrolabi appesi a catenelle che oscillano piano, orologi solari che segnano ore diverse fra loro come se fossero in disaccordo politico.

Sulle pareti, decine di mappe stellari. Su tre di esse, comodamente addormentati, altrettanti gatti.

> Ottavia: "Quelli sono i miei assistenti di ricerca più fidati. Dormono esattamente sui dati più importanti, è una loro specialità. Non chiedetemi come facciano a saperlo."

Vi indica il grande telescopio centrale, l'unico ancora puntato verso il cielo vero:

> Ottavia: "Mi serve una lettura ESATTA di dove si trova l'Anello Rosso in questo momento, non fra un'ora. Il problema è che con l'inclinazione ho tarato male metà strumenti, e l'altra metà l'ha tarata mio cugino, che è anche peggio. Serve un occhio attento — o saggio, o *fortunato*, prendetevi pure il complimento che preferite."`,
    choices: [
      { text: '🔭 Osservate con calma quale strumento è ancora affidabile', tag: 'Prova di Saggezza — CD 12', check: { stat: 'SAG', dc: 12, success: 't4', fail: 't3_distratti' } },
      { text: '🗣 Chiedete direttamente a Ottavia quale usare', next: 't4' },
    ],
  },

  t3_distratti: {
    location: 'cripta',
    caption: 'Una distrazione astronomica',
    text: `Vi concentrate sullo strumento sbagliato: un astrolabio dorato, elaboratissimo, coperto di incisioni misteriose e leve di ogni tipo. Lo azionate con solennità.

Sputa fuori un getto di vapore e una tazza di tè leggermente tiepido.

> Ottavia: *(senza alzare lo sguardo dai suoi appunti)* "Ah, quello. È il mio prototipo di scaldavivande astrale. Funziona benissimo, in effetti, ma con le stelle non c'entra assolutamente nulla. Ci ho lavorato tre anni. Non ne vado fiera, ma nemmeno mi vergogno, che è un ottimo punto di equilibrio nella vita."

Uno dei gatti, disturbato dal vapore, si sposta pigramente di una mappa e vi guarda con un'espressione che definireste, con una certa sicurezza, di educato disprezzo.

Ottavia vi raggiunge e, con due gesti rapidi e competenti, corregge lei stessa la messa a fuoco del telescopio giusto.

> Ottavia: "Ecco. Visto? Non è difficile, se non ci si fa distrarre dal tè gratis. Su, andiamo, la biblioteca ci aspetta — ed è anche peggio di qui, ve lo dico subito."`,
    choices: [{ text: 'Verso la biblioteca', next: 't4' }],
  },

  t4: {
    location: 'cripta',
    caption: 'La Biblioteca del Caos',
    text: `Se l'osservatorio era disordinato, questa stanza ha superato il disordine ed è arrivata dall'altra parte, in un territorio che meriterebbe un nome nuovo. L'inclinazione di questo piano è diversa ANCORA da quella di sotto, e i libri — corollario naturale — hanno passato anni a migrare lentamente verso l'angolo più basso, ammucchiandosi in una collina di carta che Ottavia chiama, senza ironia, "Monte Sapere".

> Ottavia: "Da qualche parte lì dentro c'è un trattato sui rituali di allineamento astrale che mi servirebbe MOLTISSIMO in questo momento. L'ho letto una volta, vent'anni fa. Ricordo la copertina blu. O forse verde. O forse l'ho prestato a qualcuno che non l'ha mai restituito, il che spiegherebbe tutto."

Monte Sapere ondeggia leggermente, come se respirasse. Da qualche parte al suo interno, uno scricchiolio sospetto.

> Ottavia: "Muovetevi con delicatezza. L'ultima volta che qualcuno ha tirato un libro a caso da quella pila, ci è voluta una settimana per riordinare tutto e un gatto è rimasto disperso per tre giorni. Stava benissimo, semplicemente non voleva più uscire."`,
    choices: [
      { text: '📚 Cercate con pazienza il trattato, uno strato alla volta', tag: 'Prova di Intelligenza — CD 12', check: { stat: 'INT', dc: 12, success: 't5', fail: 't4_valanga' } },
      { text: '🗣 Chiedete a Ottavia di indicarvi il punto esatto', next: 't5' },
    ],
  },

  t4_valanga: {
    location: 'cripta',
    caption: 'La Valanga di Monte Sapere',
    text: `Tirate il volume sbagliato. Per un istante non succede nulla, il che è quasi più spaventoso di quello che segue: Monte Sapere si arrende alla gravità tutto insieme, in un'unica frana cartacea che vi seppellisce fino alle ginocchia in trattati di astrologia, almanacchi ammuffiti e — inspiegabilmente — tre ricette di torta alle mele.

Da qualche parte nella pila, un *miao* soffocato ma non allarmato: il gatto disperso di cui parlava Ottavia, a quanto pare, vive lì stabilmente e non gradisce la compagnia improvvisa.

> Ottavia: *(scavando con voi, per nulla scomposta)* "Ah, eccolo! È viva, guardate, sta benissimo. Anche il gatto. Anche voi, probabilmente, appena vi togliete di dosso quel dizionario."

Recupera dalla frana esattamente il volume dalla copertina blu (o verde) che cercava, sfoggiandolo come un trofeo.

> Ottavia: "Visto? Il metodo Monte Sapere funziona sempre, prima o poi. Bisogna solo avere pazienza e un margine di tolleranza per il caos strutturale. Su, verso il piano successivo — l'ultima rampa, promesso."

**(Nessun danno: solo polvere, orgoglio ammaccato e una vaga fragranza di torta alle mele.)**`,
    choices: [{ text: 'Verso l\'ultima rampa', next: 't5' }],
  },

  t5: {
    location: 'cripta',
    caption: 'Perielio Monta la Guardia',
    text: `L'ultima rampa, stretta e a chiocciola, porta dritta alla terrazza. Peccato che a metà scala, seduto proprio al centro del gradino più angusto, ci sia un gatto grigio dal pelo dritto e lo sguardo fisso — e ogni tanto, per una frazione di secondo, leggermente TRASPARENTE, come se un pezzo di lui avesse deciso di stare altrove.

Ringhia. Piano, ma con convinzione.

> Ottavia: "Oh, quello è Perielio. Fa la guardia alla terrazza da quando il telescopio grande ha iniziato a perdere un filo di luce delle stelle — dice che è 'roba sua'. Tecnicamente ha ragione, ma è comunque un gatto, non un notaio."

Perielio non si muove di un centimetro. Il suo sguardo passa da voi alla scala, e ritorno, con l'aria di chi ha già deciso come andrà a finire.

> Ottavia: "Ho delle sardine essiccate in tasca, se vi interessa corrompere un felino semi-astrale. Oppure potete provare a convincerlo con la forza bruta, ma vi avviso: l'ultima volta che ci ha provato un cavaliere errante, Perielio ha vinto ai punti."`,
    choices: [
      { text: '🐟 Distraetelo con le sardine essiccate di Ottavia', tag: 'Prova di Carisma — CD 11', check: { stat: 'CAR', dc: 11, success: 't6', fail: 't5_scontro' } },
      { text: '⚔️ Fatevi largo con decisione', next: 't5_scontro' },
    ],
  },

  t5_scontro: {
    location: 'cripta',
    caption: 'Perielio Non Condivide',
    text: `Le sardine finiscono per terra, rifiutate con sdegno, oppure non arrivate mai a essere offerte: in ogni caso, Perielio decide che è ora di dimostrare chi comanda su questa rampa di scale.

Si materializza per un istante intero — pelo, coda e tutto — proprio davanti a voi, gli occhi che brillano di un blu innaturale, e carica con un miagolio che sembra più un avviso legale che un ruggito.

> Ottavia: *(da dietro, per nulla preoccupata)* "Attenzione alle unghie! E anche se attraversa i muri, in pratica! Ma è comunque solo un gatto, tranquilli, morde molto meno di un editore scontento!"

Perielio sparisce e riappare tre volte in altrettanti angoli della rampa, come se testasse quale sia il vostro lato debole, mentre dietro di lui Ottavia continua a sistemare pergamene come se una zuffa fra un gatto semi-astrale e un gruppo di avventurieri armati fosse la cosa più ordinaria della settimana — il che, in questa torre, probabilmente è vero.`,
    combat: {
      enemies: ['gatto_astrale'],
      victory: 't6',
      defeat: 'sconfitta_generica',
    },
  },

  t6: {
    location: 'vetta',
    caption: 'La Terrazza del Telescopio',
    text: `In cima, finalmente, l'aria aperta — e sopra le vostre teste, il cielo malato: il disco nero del sole spento, cinto da quell'**anello rosso** che si stringe, minuto dopo minuto, verso la mezzanotte.

Il telescopio principale, enorme, punta dritto in alto, montato su una base che qualcuno ha avuto la premura di livellare a mano — l'unico angolo retto di tutta la torre. Tutt'intorno, appesi a fili e chiodi storti, decine di disegni dello stesso cielo fatti notte dopo notte, anno dopo anno, ciascuno con una data e una nota a margine sempre più stanca.

> Ottavia: *(all'oculare, febbrile)* "Bene. BENE. Ora mi serve la vostra opinione, perché io la mia l'ho già data quarantasette volte a vuoto e stavolta voglio un secondo parere prima di aprire bocca. Guardate qui: quale, delle tre, è la lettura che segna il momento ESATTO in cui il rituale di Vesper raggiungerà il culmine?"

Vi lascia posto all'oculare, le mani che le tremano appena — non di freddo. Tre possibili letture, scritte a margine di suo pugno, tremule per l'entusiasmo, vi aspettano sul foglio appuntato al treppiede:`,
    choices: [
      { text: '🌕 "Quando la Luna Vecchia tocca la cima del campanile"', next: 't6_sbagliato' },
      { text: '🔴 "Quando l\'Anello Rosso si chiude del tutto attorno al disco — il vero mezzogiorno di mezzanotte"', next: 't7' },
      { text: '🐓 "Quando il gallo canta due volte"', next: 't6_sbagliato' },
    ],
  },

  t6_sbagliato: {
    location: 'vetta',
    caption: 'Una Lettura Poetica ma Sbagliata',
    text: `Ottavia aggiusta l'oculare secondo la vostra indicazione, trattiene il fiato per un istante di speranza... e poi lo lascia andare in uno sbuffo.

> Ottavia: "No. NO, aspettate, quello è solo... oh. Oh, capisco l'equivoco, è un vecchio detto contadino, carino, ma astronomicamente è una sciocchezza totale. Il campanile non c'entra, e il gallo — be', il gallo canta quando gli pare, gliel'ho spiegato personalmente più volte, senza risultato."

Attraverso il telescopio, per un attimo, l'immagine mostra tutt'altro: Gastone Piccone, il nano custode delle miniere, che sta bisticciando ad alta voce con uno spioncino vuoto, convinto che qualcuno lo stia spiando *proprio in quel momento*. Ottavia scatta indietro dall'oculare, imbarazzata.

> Ottavia: "Ecco, questo è il rischio di un telescopio troppo potente puntato nella direzione sbagliata. Riprovate. Con calma, stavolta — non c'è fretta. O meglio, c'è moltissima fretta, ma gridarvelo addosso non aiuta nessuno dei due."

Nessun danno, nessun rimprovero vero: solo un indice puntato, gentile, verso l'oculare.`,
    choices: [{ text: 'Riguardate con attenzione', next: 't7' }],
  },

  t7: {
    location: 'vetta',
    caption: 'Quarantotto',
    text: `> Ottavia: *(con voce che trema, stavolta non di entusiasmo)* "Esatto. È quello. L'anello che si chiude — il vero segnale. Ve lo dico io: è la prima volta in vent'anni che qualcuno guarda dove guardo io E vede quello che vedo io."

Si allontana dal telescopio, si siede su un baule pieno di rotoli, e per un momento la donna febbrile e chiassosa di poco fa sembra semplicemente stanca.

> Ottavia: "Sapete quante volte ho predetto la fine del mondo? Quarantasette. Il Grande Prosciugamento del 1401 — non prosciugò niente. L'Invasione dei Ragni Parlanti — non hanno mai invaso, si sono scoperti timidi. Ogni volta mi hanno riso dietro, o peggio, davanti. E avevano ragione loro, ogni singola volta."

Indica il cielo, l'anello rosso, quasi con tenerezza.

> Ottavia: "Stavolta ho ragione IO. E scopro che avere ragione, quando la posta in gioco è la fine di tutto, non è affatto la soddisfazione che immaginavo da giovane. Volevo solo che qualcuno, una volta, mi credesse PRIMA della fine del mondo, non durante."

Si scuote, si alza, ritrova in un lampo tutta la sua energia stralunata.

> Ottavia: "Ma basta malinconia, si lavora! Prendete: la mia mappa stellare — lì dentro c'è il dettaglio sul rituale che nessun altro ha mai notato — e questa." Vi porge una lente smontata da un vecchio telescopio, ancora calda. "Concentra la poca luce rimasta in un filo tagliente. Contro i non-morti, fa un male cane. Usatela bene, e ditelo a tutti che la quarantottesima previsione di Ottavia Stellarossa era quella giusta."`,
    sets: { sa_rituale: true },
    item: 'mappa_stellare',
    item2: 'lente_di_ottavia',
    choices: [{ text: 'Ringraziatela e scendete', next: 't8' }],
  },

  t8: {
    location: 'strada',
    caption: 'Il Congedo — di nuovo dritti, più o meno',
    text: `Scendete la torre pendente un piano alla volta, e ogni piano vi restituisce l'equilibrio con un'angolazione diversa, tanto che uscendo all'aria aperta qualcuno del gruppo continua per un buon minuto a camminare leggermente storto, convinto che sia ancora il pavimento a pendere e non le proprie gambe.

Ottavia vi saluta dalla finestra del terzo piano, già intenta a segnare qualcosa su una lavagna gremita di crocette — quarantotto, ora, l'ultima cerchiata due volte.

> Ottavia: "Andate, andate! E se salvate il mondo, ditelo in giro che l'astronoma pazza della torre storta aveva ragione! Non per la gloria, badate — per il PRINCIPIO!"

Un gatto le si struscia contro la caviglia. Lei lo solleva con una mano sola, senza smettere di scrivere con l'altra.

> Ottavia: "Sì, sì, anche tu sei stato un ottimo assistente di ricerca. Il migliore. Come tutti gli altri, del resto."

Il sentiero laterale vi riporta, in pochi minuti, sotto la vecchia quercia del **Bivio della Civetta**, dove la civetta vi osserva con la stessa aria di sempre — forse, se è possibile per un uccello, con un filo di approvazione in più.

L'anello rosso, sopra di voi, continua a stringersi. Ma ora avete una mappa, una lente, e una certezza in più su cosa affrontate stanotte. Resta solo da scegliere, davvero, quale strada prendere.`,
    choices: [{ text: 'Tornate al Bivio della Civetta', next: 'v3' }],
  },

};

const ASTRO_MAP_SCENES = ['t1', 't2', 't2_capitombolo', 't3', 't3_distratti', 't4', 't4_valanga', 't5', 't5_scontro', 't6', 't6_sbagliato', 't7', 't8'];
