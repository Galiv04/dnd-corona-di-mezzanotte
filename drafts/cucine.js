/* ============ LE CUCINE DI CREPUSCOLO — ramo opzionale, Atto 3 ============

   Bozza NON collegata alla campagna principale. Chi la integra dovrà:

   1. Fondere CUCINE_ITEMS dentro ITEMS (in js/campaign.js).
   2. Fondere CUCINE_ENEMIES dentro BESTIARY (in js/characters.js).
   3. Fondere le scene di CUCINE_SCENES dentro CAMPAIGN (in js/campaign.js).
   4. Aggiungere UNA scelta in più a `c_gerbold` (es. "Chiedete a Gerbold
      dove sono finite le cucine" oppure "Prima, un salto in cucina") che
      punti a 'k1', e una scelta in più a `c_ballo`
      ("🚪 Sgattaiolate dalla porta di servizio verso le cucine") che
      punti anch'essa a 'k1'.
   5. La scena finale del ramo (k10) chiude già su `next: 'c_scala'`: nessuna
      modifica necessaria lì.
   6. `torvald_presente` è un flag impostato altrove (setup compagnia)
      quando Torvald è nel gruppo: qui viene solo LETTO con `requires`.

   Painter consigliati (in js/scenes.js):
   - 'cucine' — location dedicata: focolari spenti ma ancora accesi per
     abitudine, pentole di rame, casseruole enormi, trecce d'aglio e
     erbe appese, un lungo tavolo da lavoro macchiato di duecento anni
     di sughi. Nel frattempo il draft usa 'taverna' come segnaposto.
   - (opzionale) una variante più fredda di 'cripta' per la dispensa
     sotterranea (scaffalature, botti, la torta del 1826 su un piedistallo
     polveroso) — per ora riusa 'cripta' così com'è.

   ============================================================ */

const CUCINE_ITEMS = {
  banchetto_ragout: {
    name: 'Il Banchetto di Monsieur Ragoût',
    desc: 'Sette portate impilate con cura ossessiva in un unico vassoio "da viaggio". Un piatto talmente buono da rimettere in piedi un morto, letteralmente.',
    usable: true,
    heal: 25,
  },
  coltello_da_cuoco: {
    name: 'Coltello da Cuoco di Monsieur Ragoût',
    desc: 'Lama affilata da duecento anni di solo, inutile, perfetto affilamento. Bilanciato per tagliare julienne o, all\'occorrenza, un vampiro.',
    combat: { dice: [2, 8] },
    icon: '🔪',
  },
};

const CUCINE_ENEMIES = {
  garzone_scheletro: {
    name: 'Garzone Scheletrico di Riserva',
    sprite: 'skeleton',
    maxHp: 12,
    ac: 12,
    ai: 'random',
    undead: true,
    attack: { name: 'Colpo di Mestolo Regolamentare', bonus: 3, dice: [1, 6], plus: 1 },
    flavor: 'Non è geloso di Ossobuco. È SOLO geloso di Ossobuco. C\'è una bella differenza, a sentir lui.',
  },
};

const CUCINE_SCENES = {

  /* ---------- k1: ingresso ---------- */

  k1: {
    location: 'taverna',
    caption: 'Le Cucine di Crepuscolo — sotto il salone',
    text: `Una porta di servizio, un corridoio in discesa, e l'aria cambia: dal profumo di cera e vino della festa a qualcosa di molto più concreto. **Brodo. Arrosto. Burro rosolato.**

Le cucine del castello sono enormi, illuminate da braci che covano da chissà quanto, e in perfetto, assurdo ordine. Su un bancone lunghissimo: anatre laccate, torri di soufflé che non collassano, una zuppa che fuma con pazienza infinita. Non manca NULLA.

Tranne i commensali.

Piatti su piatti, disposti con precisione da parata militare, e non un morso da nessuna parte. Vassoi d'argento allineati come soldati, ognuno etichettato con un cartellino elegante: *"Portata IV — servire immediatamente"*. Il più vecchio che notate dice *"1841"*.

Da una porta socchiusa in fondo, luce di candele verdi e una voce che urla in un francese furibondo contro — a giudicare dal tintinnio — una salsa che ha osato non addensarsi in tempo.

> Voce: "MAIS ENFIN! Una BÉCHAMEL non si comporta così! Duecento anni e ancora non hai IMPARATO?!"

Qualcosa — o qualcuno — piange. Una salsa che piange è un'informazione che nessuno di voi sapeva di poter avere.

Vi guardate. Il **Gran Ballo** pulsa lontano, sopra le vostre teste; qui sotto, in questo silenzio pieno di odori meravigliosi e nessun ospite, sembra di essere entrati in un segreto che il castello custodisce da molto più tempo della festa.`,
    sets: { via_cucine: true },
    choices: [{ text: 'Avvicinatevi alla porta e alla voce furente', next: 'k2' }],
  },

  /* ---------- k2: Monsieur Ragoût ---------- */

  k2: {
    location: 'taverna',
    caption: 'Monsieur Ragoût, Primo Cuoco di Crepuscolo',
    text: `Dietro la porta: un fantasma in tenuta da chef, toque compresa, che fluttua a mezzo palmo dal pavimento agitando un cucchiaio di legno come uno scettro di giudizio. La salsa, in una casseruola di rame, gorgoglia sommessa e — giurereste — mortificata.

Vi vede. Si compone. Si presenta con un inchino che sarebbe elegantissimo se non attraversasse parzialmente il tavolo.

> "**Monsieur Ragoût**, Primo Cuoco di questo castello da duecentotré anni. Sei intrusi in cucina la notte del gran rituale. *Magnifique.* Almeno QUALCUNO ha trovato la strada giusta."

Vi squadra, poi guarda, con un'espressione che vi si incolla addosso, il bancone stracolmo di capolavori intatti.

> Ragoût: "Vedete questo? Sette portate. Perfette. La Duchessa Anversa in salsa di melagrana, il soufflé al Calvados che non crolla MAI, la zuppa dell'applauso... e sapete chi le ha assaggiate, in due secoli? **NESSUNO.** I vampiri bevono. Solo quello. BEVONO. Io cucino capolavori per gente che ha smesso di avere un palato nel millesettecento e rotti!"

Il cucchiaio di legno trema nella sua mano trasparente.

> Ragoût: "Ma... MA CHI ASSAGGIA?! Ditemelo voi, chi assaggia?!"

Si riprende, dignitosissimo, e si passa la manica sugli occhi che non ha più.

> Ragoût: "Perdonate. È stata una brutta cinquantina d'anni. Cosa posso fare per voi, prima che il vostro amico pipistrellesco di sopra faccia a pezzi il mio soffitto con quella corona maledetta?"`,
    choices: [
      { text: '📖 "Cosa sono TUTTI questi appunti sul ricettario?"', next: 'k3' },
      { text: '🥫 "Possiamo dare un\'occhiata alla dispensa?"', next: 'k4' },
      { text: '🍳 Torvald si fa avanti: "Da cuoco a cuoco... posso vedere la vostra cucina?"', requires: { flag: 'torvald_presente' }, next: 'k_torvald' },
      { text: '⏩ "Non abbiamo tempo, Monsieur. Ci serve il vostro aiuto contro Vesper."', next: 'k5' },
    ],
  },

  /* ---------- k3: il ricettario disperato (gag) ---------- */

  k3: {
    location: 'taverna',
    caption: 'Il Grande Ricettario di Crepuscolo',
    text: `Ragoût apre con orgoglio un volume enorme, rilegato in pelle scura, spesso come un tronco. È il suo ricettario. O meglio: era un ricettario, prima di diventare qualcos'altro.

La prima pagina, del 1823, è impeccabile: calligrafia elegante, *"Consommé alla Duchessa, per otto commensali"*. La nota a margine dice: *"Presentare caldo, guarnire con erba cipollina."*

Girate pagina. 1841: la stessa ricetta, riscritta. Nota a margine, più fitta: *"Per SEI commensali (due non sono più tornati. Non chiedete)."*

1877: *"Per QUATTRO commensali, guarnire comunque con erba cipollina, non si sa mai."*

1910: *"Per ZERO commensali. Guarnire lo stesso. La forma è tutto ciò che resta."*

1956: la ricetta è la stessa, perfetta, ma la nota è ridotta a un singolo, straziante *"..."*

2003: qualcuno — Ragoût, ovviamente — ha disegnato una faccina sorridente accanto al piatto vuoto. Poi l'ha cancellata. Poi ridisegnata. Tre volte.

> Ragoût: *(con voce stranamente allegra, il tipo di allegria che fa più male di un pianto)* "Vedete? La tecnica non è MAI calata. È solo che... a un certo punto ho smesso di scrivere 'per quanti commensali' e ho iniziato a scrivere 'in memoria di quanti commensali'."

Richiude il libro con delicatezza, come si richiude qualcosa di fragile.

> Ragoût: "Comunque! Non siete qui per la mia autobiografia gastronomica. Che altro serve?"`,
    choices: [{ text: 'Tornate da Ragoût', next: 'k5' }],
  },

  /* ---------- k4: la dispensa (gag + Ossobuco) ---------- */

  k4: {
    location: 'cripta',
    caption: 'La Dispensa Eterna',
    text: `Una porta di quercia annerita, e dietro: file su file di scaffali che scendono nel buio, pieni di formaggi, salumi, vasetti di conserva e barattoli etichettati con grafie di secoli diversi. L'aria non sa di muffa. Sa di... niente. Come se il tempo, qui dentro, avesse semplicemente smesso di passare.

> Ragoût: "Incantesimo di conservazione del castello. Utilissimo per i vini. Per il resto, è una tortura raffinata: niente marcisce MAI. Vedete quella, in fondo?"

Su un piedistallo di marmo, sotto una campana di vetro, troneggia una torta a tre piani, glassa a fiori perfetta, candeline mai accese. Un cartellino: *"Torta di Compleanno — Sua Oscurità, 1826."*

> Ragoût: "Centonovantanove anni fresca come stamattina. Non l'ha mai tagliata. Disse che 'i compleanni sono per chi invecchia'."

Un rumore di masticazione attira la vostra attenzione: in un angolo, uno scheletro con un tovagliolo al collo sta assaggiando, con un cucchiaino, da una dozzina di scodelle diverse.

> Scheletro: "Ossobuco, ai vostri ordini. Assaggiatore Ufficiale del Castello dal 1824." *(assaggia)* "Mmh. Sale." *(assaggia di nuovo, identico gesto)* "Mmh. Ancora sale."

> Voi: "...hai anche solo la lingua, per assaggiare?"

> Ossobuco: *(offeso)* "Non serve la lingua. Serve il **DOVERE**. Assaggio per dovere. SOLO per dovere." *(assaggia una terza volta, identica alle prime due)* "Buonissimo. Come sempre. Come SEMPRE."

Ragoût annuisce, commosso a modo suo: è l'unico, in duecento anni, che ha continuato a fingere di avere un palato solo per fargli compagnia.`,
    choices: [{ text: 'Tornate su, da Ragoût', next: 'k5' }],
  },

  /* ---------- k_torvald: scena speciale (requires torvald_presente) ---------- */

  k_torvald: {
    location: 'taverna',
    caption: 'Da cuoco a cuoco',
    text: `Torvald si avvicina al bancone con l'aria di chi entra in un tempio. Passa un dito sul bordo di una casseruola di rame, la annusa, e mormora qualcosa come un professionista che riconosce un collega.

> Torvald: "Riduzione al vino, deglassata due volte. E quella béchamel... l'hai montata a freddo, vero? Nessuno la fa più così."

Ragoût si volta di scatto, il cucchiaio di legno che gli trema nella mano trasparente per un motivo completamente diverso, stavolta.

> Ragoût: "...*deux fois.* Sì. DUE volte. In duecent'anni nessuno — NESSUNO — se n'è mai accorto guardando solo la casseruola!"

Per la prima volta da quando siete arrivati, il fantasma sembra dimenticarsi di essere furioso.

> Ragoût: "Tu. Come ti chiami. Racconta. Dimmi che hai un ristorante, un locale, ANCHE una bancarella. Dimmi che qualcuno, da qualche parte, ti applaude quando cucini."

> Torvald: "Ho una locanda in testa. Non ancora sui piedi. Ma il sogno è quello: un posto dove nessuno si lamenta della cottura."

> Ragoût: *(quasi sottovoce)* "Che lusso. Lamentarsi. Io darei duecento anni di soufflé perfetti per un solo, misero reclamo scritto a mano."

I due parlano di riduzioni e temperature per un tempo che sembra sia troppo poco che troppo lungo. Alla fine Ragoût si scuote, ricomponendosi nella sua dignità professionale.

> Ragoût: "Bene. BENE. Abbastanza sentimentalismo per un secolo. Vediamo se il resto della vostra compagnia è utile quanto il vostro cuoco."`,
    choices: [{ text: 'Tornate agli altri, da Ragoût', next: 'k5' }],
  },

  /* ---------- k5: la prova — ricostruire la ricetta ---------- */

  k5: {
    location: 'taverna',
    caption: 'La Zuppa dell\'Applauso',
    text: `Ragoût estrae, da un cassetto chiuso a chiave con tre lucchetti (uno dei quali, ammette, "puramente decorativo, li adoro"), una singola pagina ingiallita e macchiata d'acqua. In cima, a lettere svolazzanti: *"Zuppa dell'Applauso — la ricetta che mi rese famoso a Corte, prima di TUTTO questo."*

Metà del testo è illeggibile. Macchie, bruciature di candela, e — sospetta — qualche lacrima antica.

> Ragoût: "L'ultima cosa che ho cucinato da VIVO. Prima che diventassi... questo. Non ricordo più l'ordine esatto degli ingredienti, e il foglio non aiuta. Se qualcuno di voi ha occhio per la logica, o palato per l'intuito, datemi una mano. Vorrei — solo una volta ancora — sentirne il profumo giusto."

Sul tavolo: una fila di vasetti senza etichetta, una bilancia arrugginita, e appunti sparsi con frammenti di frasi — *"...prima il porro, MAI la cipolla prima..."*, *"...il vino si versa quando il fondo GEME, non prima..."* — indizi, se sapete leggerli, o assaggiarli.

Ragoût si allontana di un passo, quasi non riuscendo a guardare.

> Ragoût: "Fate con calma. O in fretta, vista l'ora. Ma fate ATTENZIONE: sbagliare l'ordine, con una zuppa come questa, è imperdonabile."

Poi, sottovoce, quasi a se stesso:

> Ragoût: "...anche se, diciamocelo, dopo duecento anni cosa volete che sia un altro fallimento."`,
    choices: [
      { text: '🧠 Ricostruite la sequenza deducendola dagli appunti', tag: 'Prova di Intelligenza — CD 13', check: { stat: 'INT', dc: 13, success: 'k6a', fail: 'k6b' } },
      { text: '👅 Assaggiate i vasetti e affidatevi all\'istinto', tag: 'Prova di Saggezza — CD 12', check: { stat: 'SAG', dc: 12, success: 'k6a', fail: 'k6b' } },
    ],
  },

  /* ---------- k6a: successo ---------- */

  k6a: {
    location: 'taverna',
    caption: 'Il profumo giusto',
    text: `Porro prima, MAI la cipolla prima. Il vino versato esattamente quando il fondo geme. Un pizzico — solo un pizzico — dell'erba amara che nessuno etichetta perché "si sente e basta". La sequenza si ricompone pezzo dopo pezzo, come se il foglio macchiato ritrovasse, per qualche minuto, la sua calligrafia originale.

Quando la zuppa finalmente sobbolle nell'ordine giusto, l'odore che si alza dalla pentola è qualcosa che va oltre il cibo: caldo, rotondo, quasi... **familiare**, anche per chi non l'ha mai assaggiata prima d'ora.

Ragoût resta immobile, il cucchiaio a mezz'aria, gli occhi (che non ha) fissi sulla pentola.

> Ragoût: "...è LUI. È esattamente lui. Il profumo della sala da concerto, la sera del debutto. Non lo sentivo da... da quando ero ancora fatto di carne."

Si volta verso di voi, e per un istante il fantasma furioso scompare del tutto, lasciando solo un cuoco, commosso, che ha appena ritrovato qualcosa che credeva perduto per sempre.

> Ragoût: "Grazie. Voglio dire — *merci*, davvero. Qualunque cosa vi serva, in questa cucina, è vostra."

Da un corridoio laterale, però, arriva un rumore metallico e stizzito: qualcosa, o qualcuno, non ha gradito affatto la vostra intrusione tra i fornelli.`,
    choices: [
      { text: '⚔ Andate a controllare quel rumore', next: 'k7_combat' },
      { text: '➡ Ignoratelo: c\'è altro di cui parlare con Ragoût', next: 'k8' },
    ],
  },

  /* ---------- k6b: fallimento (comico, non punitivo) ---------- */

  k6b: {
    location: 'taverna',
    caption: 'Un profumo... diverso',
    text: `Qualcosa va storto. Forse la cipolla prima del porro, forse il vino versato troppo presto, forse quell'erba amara aggiunta con mano un po' TROPPO generosa. Il risultato, dopo venti minuti di sobbollire fiducioso, è una zuppa di un colore che in natura non esiste, con un profumo che ricorda vagamente dei calzini bolliti in festa.

Ossobuco, se presente, la assaggia per dovere. Impallidisce. Per quanto sia possibile impallidire, essendo già bianco osso.

> Ossobuco: "...per dovere lo dico: NO."

Ragoût osserva la pentola in silenzio per un tempo lunghissimo. Poi, invece di esplodere come vi aspettavate, scoppia in una risata — la prima vera risata che gli avete sentito fare, sghemba e un po' arrugginita per il disuso.

> Ragoût: "MAGNIFIQUE. Un disastro TOTALE. Sapete quante volte, da vivo, ho rovinato una salsa davanti al Re? Zero. Ero troppo bravo per sbagliare, e troppo orgoglioso per ridere quando succedeva. Voi, invece..."

Si asciuga una lacrima immaginaria.

> Ragoût: "Grazie. Non ridevo da... non ricordo nemmeno. Versate pure quella cosa nello scarico. Con rispetto, ma versatela."

Da un corridoio laterale arriva un rumore metallico e indignato: a quanto pare, qualcun altro in cucina non ha trovato la scena altrettanto divertente.`,
    choices: [
      { text: '⚔ Andate a controllare quel rumore', next: 'k7_combat' },
      { text: '➡ Ignoratelo: c\'è altro di cui parlare con Ragoût', next: 'k8' },
    ],
  },

  /* ---------- k7_combat: combattimento opzionale ---------- */

  k7_combat: {
    location: 'cripta',
    caption: 'La Rivolta dei Garzoni',
    text: `Nel corridoio verso la dispensa, tre garzoni scheletrici di riserva — mai assunti "ufficialmente", mai promossi, tenuti pronti "in caso di emergenza banchetto" per un secolo e mezzo — hanno deciso che la vostra intrusione tra i fornelli sia l'emergenza che aspettavano. Brandiscono mestoli, mattarelli e uno spiedo particolarmente ambizioso.

> Garzone: "NOI puliamo pentole da CENTOCINQUANT'ANNI senza un grazie, e VOI entrate e vi improvvisate cuochi?! Fuori dalla NOSTRA cucina!"

Ossobuco, se è con voi, li guarda con la superiorità di chi ha un titolo ufficiale e loro no.

> Ossobuco: "Assaggiatori NON autorizzati. Vergognoso."

I mestoli si alzano. Protocollo o gelosia professionale, il risultato è lo stesso: si combatte.`,
    combat: {
      enemies: ['garzone_scheletro', 'garzone_scheletro'],
      victory: 'k8',
      defeat: 'sconfitta_generica',
    },
  },

  /* ---------- k8: la scelta morale ---------- */

  k8: {
    location: 'taverna',
    caption: 'Un consiglio da amico',
    text: `Ragoût vi accompagna verso l'uscita delle cucine, verso la scala che sale alla torre. Si ferma sulla soglia, il cucchiaio di legno stretto contro il petto come uno scudo, e per un momento sembra molto più vecchio dei suoi duecentotré anni.

> Ragoût: "Prima che andiate: so cosa sta per succedere lassù. Lo sento nelle travi, nel modo in cui persino il mio brodo trema quando lui prova il discorso. Ditemi solo una cosa, prima di rischiare la pelle — o le ossa, nel mio caso — per fermarlo: ne vale davvero la pena?"

Guarda oltre le vostre spalle, verso le sue sette portate perfette, i suoi duecento anni di servizio, il contratto che nessuno gli ha mai fatto leggere davvero prima di firmarlo con la sua stessa vita.

> Ragoût: "Perché io, vedete, gli devo ancora un po' di lealtà. È il mio padrone. Ma anche un fantasma stanco ha diritto a sapere per COSA sta continuando a stirare tovaglioli."

C'è dell'altro, dietro la domanda. Duecento anni di servizio creano un legame strano, sospeso a metà tra la lealtà e la prigionia — e la risposta che gli darete potrebbe essere la prima cosa vera che qualcuno gli dice da molto, molto tempo.`,
    choices: [
      {
        text: '🗣 "Vesper non vuole salvare nessuno: vuole spegnere il sole per sempre. Meritavi di saperlo."',
        sets: { avviso_ragout: true, alleato_ragout: true },
        next: 'k9',
      },
      {
        text: '🔥 "Duecento anni di ferie mai fatte, Monsieur. Non è ora che qualcuno, in questo castello, si ribelli davvero?"',
        sets: { ribellione_ragout: true, alleato_ragout: true },
        next: 'k9',
      },
      {
        text: '🙄 "Non è affar nostro, Monsieur. Abbiamo un castello da salvare."',
        next: 'k9',
      },
    ],
  },

  /* ---------- k9: il momento di cuore — l'assaggio ---------- */

  k9: {
    location: 'taverna',
    caption: 'Il primo assaggio in duecento anni',
    text: `Sulla soglia, qualcuno del gruppo si ferma. Forse è la fame nervosa prima di una battaglia, forse è solo curiosità: un cucchiaio, preso quasi senza pensarci, affonda in una delle sette portate perfette allineate sul bancone — la Duchessa Anversa in salsa di melagrana, quella che aspetta un commensale dal 1841.

Il boccone sparisce. Segue un secondo di silenzio totale, poi:

> "...è BUONISSIMO. Monsieur, questo è — è il piatto migliore che abbia mai mangiato in vita mia."

*(Torvald, se presente, non dice nulla: si limita ad annuire con la gravità solenne di un intenditore che riconosce un maestro. Poi chiede, sottovoce, la ricetta della salsa.)*

Monsieur Ragoût non si muove. Non parla. Il cucchiaio di legno gli scivola dalla mano e attraversa il pavimento senza far rumore, perché ovviamente un cucchiaio fantasma non fa rumore, ma in quel momento sembra pesare quanto una campana.

> Ragoût: *(con un filo di voce)* "...duecentotré anni."

Si copre il viso con entrambe le mani, e per la prima volta da quando siete entrati in questa cucina, Monsieur Ragoût — furia gastronomica, tiranno dei fornelli, prigioniero di un banchetto senza fine — piange. Ma sorride, mentre lo fa.

> Ragoût: "Qualcuno ha ASSAGGIATO. Finalmente, FINALMENTE qualcuno ha—"

Non finisce la frase. Non ne ha bisogno. Vi impacchetta, con mani tremanti ma velocissime, un intero vassoio da viaggio: **(Il Banchetto di Monsieur Ragoût ottenuto!)**

> Ragoût: "Portatelo con voi. E se dovete rimettere in piedi qualcuno, lassù... che sia con QUESTO."`,
    item: 'banchetto_ragout',
    choices: [{ text: 'Ringraziate Monsieur Ragoût e tornate alla scala della torre', next: 'k10' }],
  },

  /* ---------- k10: commiato ---------- */

  k10: {
    location: 'taverna',
    caption: 'Il commiato di Monsieur Ragoût',
    text: `Vi accompagna fino al piede della scala, fluttuando con un'eleganza che duecento anni di rabbia non erano mai riusciti a spegnere del tutto. Prima di lasciarvi andare, sfila da un blocco di legno un coltello dalla lama sottilissima, lucidata fino a farla sembrare uno specchio.

> Ragoût: "Il mio coltello da julienne. L'ho affilato ogni singola settimana per due secoli, senza mai tagliare altro che verdure che nessuno mangiava. Prendetelo. Che almeno TAGLI qualcosa di importante, per una volta."

**(Coltello da Cuoco di Monsieur Ragoût ottenuto!)**

Vi guarda salire i primi gradini, poi aggiunge, quasi controvoglia:

> Ragoût: "E se per caso... per PURO caso... doveste convincere quell'insopportabile vampiro viziato a lasciare in pace il sole — ditegli che il suo cuoco lo aspetta per il pranzo. Un pranzo VERO. Con commensali VERI. Gli ho preparato la Zuppa dell'Applauso, in fondo. Sarebbe un peccato, no, non condividerla con nessuno?"

Nella sua voce, sotto l'orgoglio ferito di due secoli, c'è qualcosa che assomiglia pericolosamente alla speranza.

Dietro di voi, la cucina torna al suo brontolio sommesso di pentole e fornelli — meno solo, adesso, di quanto lo fosse un'ora fa. Davanti a voi, la scala sale buia verso la torre, e verso mezzanotte.`,
    choices: [{ text: 'Alla scala della torre', next: 'c_scala' }],
  },

};

const CUCINE_MAP_SCENES = [
  'k1', 'k2', 'k3', 'k4', 'k_torvald', 'k5', 'k6a', 'k6b', 'k7_combat', 'k8', 'k9', 'k10',
];
