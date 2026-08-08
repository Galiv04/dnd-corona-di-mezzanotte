/* ============ CONTENUTI EXTRA — bozza per "La Corona di Mezzanotte" ============
   File di lavoro: NON è collegato al motore di gioco.
   Contiene tre blocchi indipendenti, pensati per essere innestati a mano
   in js/campaign.js quando saranno approvati:

   1) CAPRA_SCENES — side-quest opzionale "Berenice, la capra sparita" (prologo, Brindolo)
   2) HERO_EPILOGUES — epiloghi personali per ciascuno dei 6 eroi, per tipo di finale
   3) IMPRESE — achievement di fine partita, valutabili come G.flags[flag]

   Formato scena e scelta identico a campaign.js:
   { id, location, caption, text, choices: [...], combat: {...} }
   { text, tag?, next?, check?, sets?, requires?, gold?, item?, removeItem?, once? }
   ================================================================== */


/* ==================== 0) OGGETTI NUOVI USATI DALLA QUEST ====================
   Da unire a ITEMS in campaign.js quando la quest verrà innestata.          */

const EXTRA_ITEMS = {
  provviste: {
    name: 'Provviste di Bocciolo',
    desc: 'Pane di segale, formaggio stagionato e un sugo di famiglia il cui ingrediente segreto Bocciolo rifiuta di rivelare "per il vostro bene". Si dice tenga svegli, allegri e sorprendentemente pieni di energia.',
    usable: false,
  },
};


/* ==================== 1) SIDE-QUEST — "Berenice, la Capra Sparita" ====================
   Opzionale, prologo a Brindolo. Si innesta con una nuova scelta nell'hub v1
   (da aggiungere a mano, es: { text: '🐐 Bocciolo vi chiama: sparita di nuovo la capra!', next: 'q_capra1', once: true }).
   L'ultima scena richiude il cerchio con next: 'v1'.                             */

const CAPRA_SCENES = {

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
    location: 'villaggio',
    caption: 'Il tetto del tempietto — un déjà-vu',
    text: `Là, in equilibrio perfetto sul colmo del tetto del tempietto del Sole, tra le tegole e il mosaico dorato ora imbronciato, c'è **Berenice**: la capra di Bocciolo, sagoma nera contro l'anello rosso dell'eclissi, che fissa il cielo spento con aria di sfida assoluta. Come se il sole l'avesse offesa personalmente.

Non parla — è una capra — ma le OPINIONI, quelle, le ha eccome: vi guarda uno a uno, vi valuta, e sembra concludere che nessuno di voi è degno di un salvataggio dignitoso.

> Bocciolo, da terra, mani nei capelli: "È la TERZA volta che succede, quest'anno! Come diavolo ci arriva, lassù?! Non ci sono scale! Non ci sono appigli! Quella capra ha stretto un patto con qualcosa di innominabile, ne sono certo!"

Pipino il chierico, capitato lì per caso, si fa il segno del sole e se ne va in fretta, borbottando qualcosa sui "misteri che il manuale non copre".

Due strade, per farla scendere.`,
    choices: [
      { text: '🧗 Arrampicatevi fin lassù', tag: 'Prova di Destrezza — CD 11', check: { stat: 'DES', dc: 11, success: 'q_capra_salvata', fail: 'q_capra2_ko' } },
      { text: '🥕 Attiratela con del cibo (con astuzia: cosa mangerebbe MAI una capra apocalittica?)', tag: 'Prova di Intelligenza — CD 10', check: { stat: 'INT', dc: 10, success: 'q_capra_salvata', fail: 'q_capra2_ko' } },
      { text: '🗣 Attiratela con del cibo (con fascino: parlatele come si parla a una dama)', tag: 'Prova di Carisma — CD 10', check: { stat: 'CAR', dc: 10, success: 'q_capra_salvata', fail: 'q_capra2_ko' } },
    ],
  },

  q_capra2_ko: {
    location: 'villaggio',
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
    caption: 'Taverna "Il Gallo Storto" — capra recuperata',
    text: `Berenice si lascia infine convincere a scendere — con la dignità intatta e l'aria di chi vi sta facendo un favore enorme — e trotterella verso Bocciolo come se niente fosse. Lui la stringe in un abbraccio che lei sopporta con pazienza quasi regale.

> Bocciolo: *(con le lacrime agli occhi)* "L'avete ritrovata. DI NUOVO. Non so nemmeno come ringraziarvi... anzi, sì, lo so."

Sparisce in cucina e torna con una **pozione di cura** e un sacco pesante, che vi consegna con solennità quasi religiosa.

> Bocciolo: "Le **Provviste di Bocciolo**. Ricetta di famiglia, la stessa che tengo sotto il bancone per le emergenze VERE. Non chiedetemi cosa c'è dentro. Mangiatele e basta, quando ne avrete bisogno."

Berenice vi osserva un'ultima volta dalla soglia, mastica qualcosa che probabilmente non dovrebbe mangiare, e vi concede — a modo suo — un cenno che potrebbe essere approvazione. O disprezzo attenuato. Con lei è sempre difficile dirlo.

**(Berenice è salva. Di nuovo. Per ora.)**`,
    item: 'pozione_cura',
    item2: 'provviste',
    sets: { capra_salvata: true },
    choices: [
      { text: 'Tornate ai preparativi', next: 'v1' },
    ],
  },

};


/* ==================== 2) EPILOGHI PERSONALI DEGLI EROI ====================
   Mappa heroId -> { vittoria, redenzione, esilio }.
   'vittoria'   = Vesper sconfitto in battaglia, corona distrutta (cfr. e_finale_giusto)
   'redenzione' = Vespertino redento, diventa bardo al Gallo Storto (cfr. e_finale_bardo)
   'esilio'     = Vesper esiliato, vagabondo per il regno (cfr. e_finale_esilio)      */

const HERO_EPILOGUES = {

  torvald: {
    vittoria: `Torvald tornò a Brindolo con il martello ancora caldo e aprì finalmente la locanda dei suoi sogni: "Il Martello e il Mestolo", dove il menù è fisso, la porzione è abbondante e chi si lamenta della cottura viene invitato — gentilmente — a uscire e ripensarci. Le pareti si riempirono presto di armi da guerra riconvertite in posate giganti e di una statua di sé stesso, offerta dal Comune, che lui trova "lusinghiera ma con le spalle sproporzionate". Ogni sera racconta la battaglia contro Vesper a chiunque ordini lo stufato, aggiungendo un dettaglio nuovo — e sempre più eroico — a ogni versione.`,
    redenzione: `Quando Vespertino Morn iniziò a suonare ogni venerdì al Gallo Storto, Torvald si offrì — "per il bene della locanda, non perché mi sia affezionato al vampiro" — di curare il buffet dei concerti. Inventò lo "Stufato del Pubblico Sordo", diventato il piatto più richiesto della regione. I due litigano regolarmente su cosa serva davvero a un artista per esibirsi al meglio (Torvald dice: pancia piena; Vespertino dice: silenzio rispettoso), ma quando le luci si abbassano è sempre Torvald, tra i tavoli, il primo ad applaudire più forte di tutti — e a fingere di non commuoversi.`,
    esilio: `Torvald aprì comunque la sua locanda — il sogno non aspetta il lieto fine di qualcun altro — e la chiamò "Il Sole Ritrovato", in onore della notte più lunga della sua vita. Tiene un tavolo permanentemente apparecchiato per un ospite che forse non tornerà mai: "Non si sa mai, un vampiro pallido e affamato di zuppa." Quando i viandanti raccontano di aver sentito un liutista sconosciuto cantare in qualche taverna di frontiera, Torvald si limita ad annuire e a preparare una porzione in più, "giusto per sicurezza". Nessuno osa più lamentarsi del suo stufato. Nessuno ci ha mai provato due volte.`,
  },

  lyra: {
    vittoria: `Lyra tornò all'Accademia con un rapporto dettagliato — "in tredici capitoli, con note a piè di pagina" — sulla sconfitta di un vampiro incoronato, e l'Arcimaga Selestra fu costretta a riammetterla con tanto di scuse pubbliche. Lyra ascoltò l'intero discorso di riammissione, annuì compostamente... e rifiutò. "Ho già l'unico laboratorio che conta: il mondo," dichiarò, richiudendosi il taccuino esplosivo sotto il braccio prima di tornare sulla strada coi compagni. L'Accademia le dedicò comunque un'aula. Lei non l'ha mai vista: era troppo occupata a far esplodere qualcos'altro, altrove, con debito permesso.`,
    redenzione: `Ai concerti del venerdì, Lyra cura le luci: fuochi fatui incantati che danzano sopra il palco di Vespertino a tempo di musica — "pura fisica applicata," insiste, ignorando chi la chiama "scenografia". L'Accademia le ha offerto una cattedra dopo aver saputo della corona distrutta; lei ha risposto con un incantesimo dimostrativo che ha fatto saltare tre finestre della sala del consiglio, allegando un biglietto: "Ripensateci." Tiene un intero capitolo del taccuino dedicato a "Cosa NON fare con una corona magica senziente", che vende a caro prezzo ad altri maghi. È, a modo suo, felicissima.`,
    esilio: `Lyra non tornò mai all'Accademia: pubblicò da sola un trattato — "Della Corona di Mezzanotte e degli Errori Altrui" — che l'Arcimaga Selestra lesse, si dice, tre volte prima di scrivere una lettera di scuse mai spedita. Lyra viaggia ancora col taccuino esplosivo, sempre più pieno, sempre più pericoloso da aprire. Di tanto in tanto incrocia voci su un menestrello pallido che canta nelle locande di frontiera, e si chiede, con genuina curiosità accademica, quale incantesimo tenesse insieme corona e vampiro per duecento anni. Non lo scoprirà mai del tutto. Le piace così.`,
  },

  fizzle: {
    vittoria: `Con la reputazione da eroe e la borsa più pesante di sempre, Fizzle fece finalmente la cosa che rimandava da anni: consegnò la lettera d'amore. La destinataria — una fioraia di Brindolo di nome Rosalba — la lesse, arrossì, e gli chiese perché diamine ci avesse messo così tanto. Fizzle, per una volta nella vita, non ebbe una battuta pronta. I due si vedono ogni martedì; lui le porta sempre qualcosa "ricollocato con stile" da un'avventura, lei finge di non saperlo. Il 60% del maltolto, promette, va ancora in beneficenza. Il restante 40%, ora, va in fiori.`,
    redenzione: `Fizzle si autonominò "agente ufficiale" di Vespertino Morn, ruolo che consiste soprattutto nel vendere gadget non autorizzati — corone di latta, sold out ogni venerdì — e nel negoziare col bagarinaggio dei biglietti, lavoro che svolge con l'autorità morale di un ex bagarino pentito. Ha finalmente consegnato la sua vecchia lettera d'amore, ispirato dal secondo atto di Vespertino: "Se un vampiro può reinventarsi, posso farlo anch'io." La fioraia Rosalba ora vende fiori proprio davanti al Gallo Storto, ogni venerdì sera. Coincidenza? Fizzle giura di sì. Nessuno gli crede.`,
    esilio: `Fizzle rintraccia il menestrello esiliato una volta l'anno, non si sa mai come: gli lascia sempre qualcosa di utile — una moneta, una coperta, una volta un intero liuto "ricollocato da un nobile che comunque non lo suonava" — e sparisce prima dell'alba, esattamente come fa Vesper. Nessuno dei due lo ammetterà mai, ma è la cosa più simile a un'amicizia che entrambi si concedano. Quanto alla lettera d'amore: consegnata, finalmente, alla fioraia Rosalba, che ha risposto con un mazzo di fiori e la domanda che tutti si aspettavano — "Ma quanto ci hai messo?"`,
  },

  brunilde: {
    vittoria: `Brunilde tornò al convento di Santa Aurora aspettandosi una ramanzina per il mazzafrusto, e ricevette invece una promozione: la Madre Superiora la nominò "Guardiana della Luce Errante", titolo che lei trova "pomposo ma onestamente meritato". Continua a benedire tutto, nemici compresi, e a menare con entusiasmo pastorale chiunque minacci la pace di Lumelia. Il suo primo atto ufficiale da promossa è stato presentare reclamo scritto contro "l'insulto personale" subito dal sole spento — reclamo accolto, sei mesi dopo, con tanto di scuse cosmiche informali. Le altre suore la temono e la adorano in proporzioni quasi uguali.`,
    redenzione: `Ispirata dalla seconda vita di Vespertino, Brunilde fondò un nuovo ordine: le Suore dell'Alba Operosa, dedicate a chi merita una seconda possibilità e a chi, semplicemente, ha bisogno di una sana energia mattutina applicata con un candelabro. Officia personalmente il concerto del venerdì con una breve benedizione prima del bis — "Che la luce, e la musica, vi accolga. ADESSO." — e tiene un occhio vigile su Vespertino, nel caso ricadesse in vecchie abitudini teatrali. Non è mai successo. Ma lei resta pronta, mazzafrusto a portata di mano, "per principio, non per sfiducia".`,
    esilio: `Brunilde non approvò l'esilio — "la clemenza senza redenzione è solo pigrizia con una buona pubblicità," dichiarò al Consiglio, che finse di non sentire — e da allora dedica un pellegrinaggio l'anno a cercare il menestrello errante, nella speranza di convincerlo a tornare e "fare ammenda come si deve". Non ci è ancora riuscita. Nel frattempo ha fondato comunque le Suore dell'Alba Operosa, "per tenersi in esercizio", e benedice ogni villaggio che attraversa con lo stesso entusiasmo con cui menerebbe un demone. Il mazzafrusto, dice, è anche un ottimo bastone da pellegrino. Soprattutto per un pellegrino di taglia forte.`,
  },

  kael: {
    vittoria: `Sul palco per la consegna della statua, al sindaco Bartolo che gli chiede due parole, Kael pronuncia la frase più lunga della sua vita pubblica: "Biscotto e io... abbiamo degli amici. Cinque, per la precisione. Sei, contando il tasso." Il pubblico applaude, Biscotto rifiuta di scendere dalla sua spalla per il resto della cerimonia, e il Consiglio di Brindolo conia — su richiesta ufficiale di Zonk — una medaglietta per "Servizio Eroico e Morsi Tempestivi". Kael porta ancora il mantello, medita ancora molto, ma ha smesso di definirsi "un lupo solitario". Ora dice "due lupi", e basta.`,
    redenzione: `Kael si presenta ai concerti del venerdì sempre allo stesso tavolo d'angolo, sempre con la scusa di "tenere d'occhio la situazione". Biscotto, meno interessato alla sicurezza e più al buffet di Torvald, ha sviluppato una tecnica di furto di crostini leggendaria tra il personale. Vespertino gli ha dedicato una strofa segreta della Ballata — "al ranger che non applaude ma resta fino alla fine" — e Kael, che nega di averla notata, la canticchia distrattamente quando pensa che nessuno ascolti. Nessuno glielo dice. Fa ormai parte del suo fascino misterioso, ufficialmente riconosciuto come tale dal resto del gruppo.`,
    esilio: `Da bravo ranger, Kael continua a seguire — a distanza, senza farsi vedere, "per abitudine professionale" — le tracce del menestrello esiliato attraverso il regno. Ogni tanto torna a Brindolo con notizie: "Ha cantato a Ponte Vecchio. Bene, ma la seconda strofa era stanca." Biscotto lo accompagna sempre, ha imparato a riconoscere l'odore del mantello di Vesper da un miglio, e una volta gli ha restituito un bottone perduto senza che nessuno glielo chiedesse. Kael sostiene di non provare simpatia per un ex-vampiro. Il gruppo sostiene che i suoi rapporti di viaggio siano sempre, sospettosamente, molto dettagliati.`,
  },

  zonk: {
    vittoria: `Zonk vinse la mostra di ricamo di Villa Petunia con un arazzo enorme — categoria "scene epiche", sezione creata apposta per lui — raffigurante l'intera avventura, ragni compresi (ricamati piccolissimi, in un angolo, "per esposizione controllata"). Durante la premiazione un ragno vero, sfuggito da una cassa di frutta, gli è passato vicino: Zonk è rimasto quasi fermo un secondo intero prima di salire su un tavolo urlando con dignità. La statua in piazza lo ritrae con i fiorellini all'uncinetto, come richiesto espressamente. Dice che è "il giorno più bello della sua vita, dopo il torneo e il ricamo". Nell'ordine giusto.`,
    redenzione: `Zonk realizza sciarpe ricamate per ogni concerto di Vespertino — una diversa a settimana, sempre con una nota musicale e un piccolo sole, "perché il tema deve essere chiaro" — e le vende al banchetto insieme ai goblin del guardaroba. È diventato, suo malgrado, l'accessorio di moda più ambito di Lumelia. Ai bambini del coro insegna il punto croce dopo le prove; dice che "condividere la merenda e il ricamo" sia la vera ricetta per una pace duratura, e finora nessuno ha trovato controesempi validi. La sua paura dei ragni resta intatta, ma ora la definisce "una fase", con encomiabile ottimismo.`,
    esilio: `Zonk finì comunque l'arazzo dell'avventura, ma lasciò un angolo vuoto, "per quando la storia si completa". Ogni tanto lo porta con sé ai mercati, nella vaga speranza che il menestrello esiliato lo veda e capisca di essere ancora, in qualche modo, parte della trama. Ha anche spedito, tramite un mercante di fiducia, una sciarpa ricamata con una nota musicale e la scritta "Anche i cattivi meritano di stare al caldo". Non ha mai ricevuto risposta. In fondo non se l'aspettava. Nel frattempo ha vinto comunque la mostra di ricamo di Villa Petunia, ragni quasi affrontati con successo.`,
  },

};


/* ==================== 3) IMPRESE — achievement di fine partita ====================
   Ogni voce è valutabile come G.flags[flag] (verità = impresa sbloccata).
   Le prime 12 usano flag GIÀ presenti in campaign.js (o impostati da CAPRA_SCENES sopra).
   Le ultime 6 richiedono flag NUOVI: vedi il riepilogo in fondo al file/nel report.  */

const IMPRESE = [
  // ---- flag già esistenti in campaign.js / CAPRA_SCENES ----
  { flag: 'reputazione',        icon: '📢', title: 'Idolo della Piazza',            desc: 'Avete calmato Brindolo nel giorno in cui il sole si è spento.' },
  { flag: 'sa_magia',           icon: '🔮', title: 'Detective dell\'Apocalisse',    desc: 'Avete capito al volo che il sole non si è spento: ve l\'hanno rubato.' },
  { flag: 'stufato_bonus',      icon: '🍲', title: 'A Pancia Piena',                desc: 'Avete finito lo stufato mentre il mondo finiva. Priorità sacrosante.' },
  { flag: 'eroici',             icon: '⚔️', title: 'Eroi Senza Contrattare',        desc: 'Avete accettato la missione senza discutere sul prezzo.' },
  { flag: 'sa_passato_bardo',   icon: '🎻', title: 'Biografi Non Autorizzati',      desc: 'Conoscete il segreto imbarazzante di Lord Vesper Morn: sapeva cantare.' },
  { flag: 'benedizione',        icon: '✨', title: 'Benedetti al Quarto Giorno',    desc: 'Pipino vi ha benedetto a caso, ed è pure funzionato.' },
  { flag: 'sa_ballo',           icon: '🕺', title: 'Amici dei Goblin',              desc: 'Avete fatto pace (o affari) coi Goblin Riuniti del Turno di Notte.' },
  { flag: 'sa_corona',          icon: '👑', title: 'La Colpa È della Corona',       desc: 'Avete scoperto che il vero nemico non è Vesper, ma ciò che porta in testa.' },
  { flag: 'burocrazia_battuta', icon: '📋', title: 'Terrore degli Uffici Reclami',  desc: 'Avete compilato un modulo alla perfezione. Gli scheletri vi rispettano.' },
  { flag: 'sa_gerbold',         icon: '🫖', title: 'Orecchie Fini al Buffet',       desc: 'Avete origliato abbastanza da scoprire che pure il maggiordomo è esausto.' },
  { flag: 'gerbold_alleato',    icon: '🏖️', title: 'Sindacalisti per Scheletri',    desc: 'Avete convinto Gerbold a licenziarsi su due femori.' },
  { flag: 'capra_salvata',      icon: '🐐', title: 'Salvatori di Berenice',         desc: 'Avete recuperato la capra di Bocciolo dal tetto del tempietto. Di nuovo.' },

  // ---- flag NUOVI: richiedono una piccola aggiunta a campaign.js (vedi report) ----
  { flag: 'via_bosco',              icon: '🌲', title: 'Sussurratori di Alberi',      desc: 'Avete scelto la via del Bosco dei Sussurri, e siete sopravvissuti al gossip.' },
  { flag: 'via_miniere',            icon: '⛏️', title: 'Amici dei Nani Paranoici',    desc: 'Avete scelto la via delle Miniere di Ferrovecchio, superando l\'interrogatorio.' },
  { flag: 'fatto_ridere_ortica',    icon: '😂', title: 'Comici Sopraffini',           desc: 'Avete fatto ridere una strega per la prima volta in duecento anni.' },
  { flag: 'finale_vittoria',        icon: '🏆', title: 'Il Sole Torna sul Serio',     desc: 'Avete sconfitto Vesper in battaglia e distrutto la Corona.' },
  { flag: 'finale_redenzione',      icon: '🎶', title: 'Un Vampiro Redento',          desc: 'Avete convinto Vespertino a scegliere un applauso vero, non la vendetta.' },
  { flag: 'finale_corona_distrutta', icon: '💥', title: 'Corona in Mille Pezzi',      desc: 'Avete strappato la Corona di Mezzanotte prima che fosse troppo tardi.' },
];

/* ---------------------------------------------------------------------------
   RIEPILOGO FLAG NUOVI NECESSARI (nessuna modifica fatta ai file esistenti,
   solo segnalazione — vedi anche il messaggio di riepilogo restituito):

   - via_bosco / via_miniere:
       scena v3, nelle due scelte che oggi impostano solo `sets: { via: 'bosco' }`
       e `sets: { via: 'miniere' }`. Basta aggiungere il flag booleano gemello,
       es. `sets: { via: 'bosco', via_bosco: true }` e
           `sets: { via: 'miniere', via_miniere: true }`.

   - fatto_ridere_ortica:
       scena b3_riso_ok (oggi non imposta alcun flag). Aggiungere
       `sets: { fatto_ridere_ortica: true }`.

   - finale_vittoria:
       scena f_vittoria_boss, accanto a `sets: { finale: 'vittoria' }`.
       Aggiungere `finale_vittoria: true` allo stesso oggetto sets.

   - finale_redenzione:
       impostato in DUE scene (entrambe portano a e_alba_redenzione):
       f_corona_win e f_tenzone_win. Aggiungere `finale_redenzione: true`
       accanto a `sets: { finale: 'redenzione' }` in entrambe.

   - finale_corona_distrutta:
       scena f_corona_strappata, accanto a `sets: { finale: 'corona_distrutta' }`.
       Aggiungere `finale_corona_distrutta: true` allo stesso oggetto sets.
   --------------------------------------------------------------------------- */
