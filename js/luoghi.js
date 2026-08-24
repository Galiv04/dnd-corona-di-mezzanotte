/* ============ LUOGHI — la lettura della scena ============
   Un pulsante sul quadro, e una scheda che spiega cosa si sta guardando.

   PERCHÉ ESISTE. Richiesta del committente, 23 agosto 2026: «ogni scena grafica,
   un tastino che puoi cliccare, un piccolo pop-up che ti spiega la scena, cosa
   vivi, elementi che potrebbero essere interessanti sia per la storia che per altre
   dinamiche nel gioco».

   COS'È E COSA NON È. È una didascalia: dice cosa c'è nel quadro, com'è fatto quel
   posto di Lumelia, e cosa ci si può fare. **Non anticipa niente.**

   E IN QUESTO GIOCO, IL TONO. La Corona è l'unica avventura allegra della serie: le
   schede stanno sullo stesso registro — precise sui fatti del mondo, e senza mai
   fare le serie quando la scena non lo è. Dove c'è una cosa vera del mondo reale
   (com'è fatta un'eclissi anulare, perché un condotto di aerazione sta in alto, cosa
   succede al vino a temperatura costante) si dice: in un gioco fantasy la cosa vera
   è la sorpresa migliore.

   IL RIUSO. `apri()` e `aggiorna()` sono identici in tutti i giochi della serie
   (copia di riferimento in ../dnd-motore/tools/luoghi-rendering.js). */

const Luoghi = (() => {

  const LUOGHI = {
    taverna: {
      titolo: 'La taverna «Il Gallo Storto», a Brindolo',
      ora: 'Giorno di mercato, mezzogiorno — e poi non più',
      guarda: [
        ['Il tavolo grande', 'Vicino al camino, quello dei clienti che l’oste conosce. È il vostro da tre avventure.'],
        ['Il camino', 'Acceso anche d’estate, perché il camino di una taverna è acceso sempre: ci si cuoce.'],
        ['Il bancone', 'Bocciolo dietro, e dietro Bocciolo le botti. Lo stufato profuma da tre stanze di distanza.'],
        ['L’emporio, accanto', 'Da Gedeone — Tutto per l’Avventura (e per la Fine del Mondo). L’insegna è stata aggiornata di recente.'],
        ['Le finestre', 'Danno sul mercato. Da lì entra la luce, e a un certo punto smette di entrare.'],
      ],
      storia: 'Le taverne di villaggio erano tre cose in una: locanda, ufficio postale e banca. Ci si mangiava, ci si lasciavano i messaggi, e l’oste teneva a mente chi doveva cosa a chi — ed era per questo che l’oste era la persona più informata del paese. Bocciolo non fa eccezione, e ha anche una capra.',
      gioco: 'È il punto di partenza e il posto in cui si compra: l’emporio di Gedeone è il negozio del gioco, e ha un catalogo che cambia con l’avanzare della storia. La taverna è anche dove si torna a chiedere, e chiedere paga.',
    },

    villaggio: {
      titolo: 'La piazza di Brindolo',
      ora: 'Mezzogiorno, e il sole si spegne',
      guarda: [
        ['Il sole', 'Non tramonta e non si nasconde: si **spegne**, come una lanterna, e resta un disco nero contornato da un anello rosso.'],
        ['Il mercato', 'Bancarelle a metà giornata, con la merce fuori e nessuno che la guarda più.'],
        ['I paesani', 'Fermi tutti nella stessa posizione, con la faccia in su. È l’unica volta in cui questo villaggio sta zitto.'],
        ['Il tempietto del Sole', 'In fondo alla piazza, col mosaico dorato che di colpo non ha più niente da riflettere.'],
      ],
      storia: 'Un anello rosso attorno a un disco nero è un’eclissi **anulare**: capita quando la luna è troppo lontana per coprire il sole del tutto e ne resta fuori un bordo. Dura minuti, non giorni — che è esattamente il problema. Nel mondo vero gli anelli di fuoco sono stati per millenni il segno più temuto del cielo, e ogni cultura che li ha visti ha scritto qualcosa quel giorno.',
      gioco: 'Da qui parte tutto, e la piazza resta un nodo: ci si torna per parlare con la gente, e le voci del paese diventano indizi. Il tempietto ha un tetto, e sui tetti in questo gioco si trovano capre.',
    },

    ponte: {
      titolo: 'Il ponticello sulla Strada del Nord',
      ora: 'Le tre del pomeriggio, buio pesto',
      guarda: [
        ['La strada', 'Sale tra colline e boschi sotto un cielo nero trapunto di stelle confuse — anche loro convinte che sia notte.'],
        ['Il ponticello', 'Di legno, largo quanto un carro. È l’unico passaggio, ed è per questo che ci si mette qualcuno.'],
        ['I tre goblin', 'In fila. Uno di loro sta facendo una cosa che i goblin non fanno di solito.'],
        ['La carovana', 'Del Sindacato, ferma poco più avanti. I carrettieri hanno l’aria di chi ha già pagato.'],
      ],
      storia: 'Il pedaggio al ponte è la più antica delle imprese: chi controlla l’unico attraversamento controlla il commercio, e per questo i ponti nel mondo vero sono stati per secoli proprietà di qualcuno. Un ponte di legno largo un carro è anche una struttura fragile, e chi lo tiene ha più da perdere di chi lo attraversa.',
      gioco: 'È il primo combattimento, e si può anche non combattere: parlare è sempre una via, e con questi tre funziona meglio che con altri. Quello che decidete qui torna più tardi, quando servirà qualcuno che vi conosca.',
    },

    tempietto: {
      titolo: 'Il tetto del tempietto del Sole',
      ora: 'Sotto l’anello rosso',
      guarda: [
        ['Il colmo del tetto', 'Tegole e mosaico dorato, ora imbronciato perché non ha più niente da riflettere.'],
        ['Berenice', 'La capra di Bocciolo, in equilibrio perfetto sul colmo: sagoma nera contro l’anello rosso.'],
        ['Il suo sguardo', 'Fissa il cielo spento con aria di sfida assoluta, come se il sole l’avesse offesa personalmente.'],
        ['La piazza, in basso', 'Da quassù si vede tutto il mercato, e tutti quelli che stanno guardando in alto.'],
      ],
      storia: 'Le capre arrivano sui tetti per davvero: hanno lo zoccolo diviso in due dita che si aprono e si chiudono, e una capacità di equilibrio che a nessun altro animale della fattoria è venuta in mente. In Marocco salgono sugli alberi di argan. Un tetto, per una capra, è una collina con meno erba.',
      gioco: 'Recuperare Berenice è una delle imprese secondarie, e non è decorativa: quello che si ottiene qui serve davvero. Ci sono più modi di tirarla giù, e uno solo non richiede di arrampicarsi.',
    },

    strada: {
      titolo: 'Il Bivio della Civetta',
      ora: 'Le sei di sera, che qui vuol dire come le tre',
      guarda: [
        ['La vecchia quercia', 'Con la civetta sopra, che vi osserva con l’aria di chi ne ha viste tante.'],
        ['Il cartello', 'Tre direzioni. La terza è stata aggiunta a mano, con una grafia tremolante.'],
        ['Il muretto', 'Basso, dietro il cartello. Ci si può stare dietro, ed è utile.'],
        ['Le tre strade', 'Bosco dei Sussurri, Miniere di Ferrovecchio, e quella scritta a mano.'],
      ],
      storia: 'Un’indicazione aggiunta a mano su un cartello ufficiale vuol dire una cosa sola: che qualcuno ci è andato abbastanza spesso da stancarsi di spiegare la strada. Nei crocevia veri, le scritte non autorizzate sono la fonte più affidabile che ci sia.',
      gioco: 'È il bivio vero del gioco: le tre strade portano a tre posti diversi, e non si fanno tutte. Il gioco tiene il conto di quali avete visto, e alla fine vi dice cosa non vi ha mostrato.',
    },

    bosco: {
      titolo: 'Il Bosco dei Sussurri',
      ora: 'Sera, sotto le fronde',
      guarda: [
        ['Le fronde', 'Bisbigliano al vostro passaggio. Non è il vento: il vento non commenta il taglio di capelli.'],
        ['I funghi luminosi', 'Alla base dei tronchi. Sono l’unica illuminazione, e si spostano se li si guarda troppo.'],
        ['Il sentiero', 'C’è, e a un certo punto ce ne sono due, ed entrambi sembrano quello di prima.'],
        ['Le voci', 'Parlano di voi fra loro, e una a un certo punto si accorge che le sentite.'],
      ],
      storia: 'Nel mondo vero i funghi che brillano esistono e sono una quarantina di specie: la luce serve ad attirare gli insetti che disperdono le spore. E gli alberi comunicano davvero, attraverso le radici e i funghi che le collegano — non con le parole, ma la rete c’è, e i botanici la chiamano proprio così.',
      gioco: 'Il bosco si perde: girare a vuoto è una meccanica, e uscirne richiede o fortuna o un’idea. Le voci dicono cose vere se si smette di rispondere, ed è uno dei posti in cui ascoltare vale più di parlare.',
    },

    capanna: {
      titolo: 'La capanna di Nonna Ortica',
      ora: 'Le otto di sera',
      guarda: [
        ['La capanna', 'Storta, coperta di muschio, esattamente come una capanna di strega deve essere.'],
        ['Il fumo', 'Verde, dal camino. Non è un effetto scenico: è quello che sta cuocendo.'],
        ['Il calderone', 'In giardino, che borbotta da solo.'],
        ['La porta', 'Si apre prima che possiate bussare.'],
        ['Nonna Ortica', 'Alta un metro e un mattarello.'],
      ],
      storia: 'Le fiamme verdi sono chimica vera: il rame nel fuoco dà il verde, il sodio l’arancione, il potassio il lilla. Le erbaiole di paese sapevano quali polveri fanno che colore molto prima che qualcuno chiamasse la cosa chimica — ed era metà del loro mestiere, perché un rimedio che si vede funzionare viene creduto.',
      gioco: 'Da lei si ottengono cose, e il modo di ottenerle non è pagare: è farla ridere. È una delle scene in cui il gioco premia l’idea sbagliata invece della statistica giusta, ed è fatta apposta.',
    },

    miniera: {
      titolo: 'Le Miniere di Ferrovecchio',
      ora: 'Dopo il condotto di aerazione',
      guarda: [
        ['Il condotto', 'Buio, polvere di due secoli, e un’eco che moltiplica ogni starnuto per otto.'],
        ['La sala principale', 'Si sbuca dal soffitto, e da lassù si vede tutto quello che sta succedendo sotto.'],
        ['Il carrello', 'Sui binari, con la leva. Funziona ancora, che è la parte incredibile.'],
        ['I cristalli azzurri', 'Incastonati nella roccia. Fanno luce quanto basta per non inciampare.'],
      ],
      storia: 'I condotti di aerazione delle miniere vere stanno in alto e sono obbligatori: senza tiraggio l’aria si carica di gas e di polvere, e la polvere di carbone in sospensione esplode. Il camino non è comodità: è la ragione per cui la miniera si può usare. Ed è anche il motivo per cui in una miniera c’è sempre un secondo modo di entrare.',
      gioco: 'La miniera è la parte più «da dungeon» del gioco: si arriva da sopra, e arrivare da sopra vuol dire vedere prima di essere visti. Il carrello si può usare, e usarlo è una scelta con un esito.',
    },

    cucine: {
      titolo: 'Le Cucine di Crepuscolo',
      ora: 'Durante il ballo, sotto il salone',
      guarda: [
        ['L’aria', 'Cambia appena si scende: dal profumo di cera e vino della festa a brodo, arrosto, burro rosolato.'],
        ['Le braci', 'Covano da chissà quanto. Nessuno le ha accese stasera.'],
        ['L’ordine', 'Perfetto e assurdo: ogni utensile al suo gancio, ogni banco pulito, in un castello dove nient’altro è in ordine.'],
        ['Il Grande Ricettario', 'Sul banco, aperto. Le ricette sono scritte da più mani diverse.'],
        ['Monsieur Ragoût', 'Primo Cuoco di Crepuscolo. Ha un mestiere e lo prende più seriamente della fine del mondo.'],
      ],
      storia: 'Le cucine dei castelli stavano sotto o staccate dal corpo principale per due ragioni: il fumo e il rischio d’incendio. Il che vuol dire che erano il piano più difficile da controllare dall’alto — e che chi ci lavorava sapeva sempre più di quanto si supponesse. Un ricettario scritto da mani diverse è un archivio di cuochi.',
      gioco: 'Le cucine sono un posto in cui si ottengono cose senza combattere: il cuoco vuole una mano, e darla conviene. Il ricettario è una fonte di indizi, e le ricette dicono chi ha mangiato cosa in questo castello.',
    },

    cripta: {
      titolo: 'Le Cantine del Castello, via Passaggio Basso',
      ora: 'Notte',
      guarda: [
        ['La porta circolare dei nani', 'Ruota su cardini unti duecento anni fa, e ancora funzionano.'],
        ['Le volte di pietra', 'Basse, a botte. L’acustica qui restituisce ogni parola con mezzo secondo di ritardo.'],
        ['Le botti', 'Gigantesche, etichettate con le annate. Alcune hanno una data e nient’altro.'],
        ['Gerbold', 'Maggiordomo, duecento anni di onorato servizio. Il servizio è la parte che gli sta stretta.'],
      ],
      storia: 'Una cantina interrata sta a temperatura costante tutto l’anno — dodici, quattordici gradi — ed è per questo che il vino ci invecchia invece di guastarsi. È anche il motivo per cui le cantine sono il posto meglio conservato di qualunque castello: quello che ci finisce dentro resta come l’hanno lasciato.',
      gioco: 'Il Passaggio Basso è la via che salta il ballo, e saltarlo è legittimo. Gerbold ha un problema, e i problemi del personale in questo gioco sono sempre la strada più breve per una chiave.',
    },

    ballo: {
      titolo: 'Il Gran Ballo dell’Eclissi',
      ora: 'Il salone delle feste, tarda notte',
      guarda: [
        ['I lampadari', 'Candele viola. Nessuno le ha portate: erano già viola.'],
        ['I tavoli', 'Gemono sotto banchetti sontuosi, per chi mangia. E calici di un liquido rosso vivo, per chi non chiede.'],
        ['Gli ospiti', 'Decine, mascherati, che danzano un valzer lentissimo e ipnotico. Il passo è lo stesso per tutti.'],
        ['L’orchestra', 'Sul palco. Suona bene e non ha bisogno di respirare fra le frasi.'],
        ['Le maschere', 'Coprono la faccia e non il collo, ed è dal collo che si capisce chi è chi.'],
      ],
      storia: 'Il ballo in maschera nasce per una ragione pratica: permettere a persone di rango diverso di stare nella stessa stanza senza che nessuno debba fare il primo inchino. Chi lo organizza, quindi, ha sempre un interesse a che nessuno riconosca nessuno — e chi partecipa ha sempre un interesse a riconoscere qualcuno.',
      gioco: 'Il ballo si attraversa fingendo, e fingere è una meccanica: il valzer ha un passo, e sbagliarlo ha conseguenze. Si può anche non ballare, ma bisogna aver trovato prima l’altra strada.',
    },

    vetta: {
      titolo: 'La Vetta della Torre',
      ora: 'Mezzanotte meno cinque',
      guarda: [
        ['La terrazza', 'Circolare, sospesa sul nulla. Non c’è parapetto, perché a chi l’ha costruita non serviva.'],
        ['Il cielo', 'Immenso. Da quassù l’anello rosso non è più in alto: è alla vostra altezza.'],
        ['L’altare di ossidiana', 'Al centro. Nero, lucido, e riflette quello che gli sta sopra.'],
        ['La Corona di Mezzanotte', 'Sospesa a mezz’aria, avvolta da lampi viola: un cerchio di metallo nero con una gemma rossa che pulsa come un cuore.'],
      ],
      storia: 'L’ossidiana è vetro vulcanico: si rompe con un bordo più affilato di un bisturi, e i popoli che non conoscevano il metallo ci facevano le lame. Nel mondo vero è anche il primo specchio che l’uomo abbia usato — lucidata, restituisce l’immagine. Un altare di ossidiana è un altare che guarda indietro.',
      gioco: 'È l’ultima scena, e i cinque minuti che mancano sono veri: il gioco conta i turni. Tutto quello che avete raccolto durante la giornata si può usare qui, e il gioco vi mostra cosa avete a portata prima di cominciare.',
    },

    fiume: {
      titolo: 'Il Molo del Vecchio Salice, sul Fiume Torbido',
      ora: 'Sera',
      guarda: [
        ['Il molo', 'Legno marcio che sembra tenersi in piedi per pura cocciutaggine.'],
        ['Il salice', 'Enorme, la corteccia rugosa come pelle antica. Allunga un ramo come per stringervi la mano.'],
        ['Le canne', 'Il sentiero scende ripido fra quelle. Non si vede l’acqua fino all’ultimo.'],
        ['La barca di Bertoldo', 'Ormeggiata. Il traghettatore c’è sempre, e ha sempre una condizione.'],
      ],
      storia: 'I salici crescono sull’acqua perché sono l’unico grande albero che tollera le radici sommerse, e per la stessa ragione si piantavano sugli argini: le radici tengono la terra. Un salice enorme su un fiume vuol dire che quel punto è stabile da moltissimo tempo, e per questo il molo è lì e non altrove.',
      gioco: 'Il fiume è la via d’acqua, e Bertoldo la apre a chi risolve i suoi indovinelli: è il minigioco del gioco, e sbagliare non chiude la strada — la fa costare. Il salice, se ascoltato, dice qualcosa che serve alla fine.',
    },

    cisterna: {
      titolo: 'La Grotta della Cisterna',
      ora: 'Oltre la cascata',
      guarda: [
        ['La grotta', 'Enorme. Il fiume si acquieta e smette di fare rumore.'],
        ['I cristalli azzurri', 'Incastonati nella roccia, probabilmente cugini di quelli delle Miniere di Ferrovecchio — anche se nessuno qui potrà mai confermarlo.'],
        ['L’acqua', 'Scorre placida verso un arco di pietra scavato.'],
        ['L’arco', 'Non è naturale. Qualcuno l’ha tagliato, e l’ha tagliato per farci passare qualcosa.'],
      ],
      storia: 'Le grotte attraversate da un fiume si formano in millenni: l’acqua scioglie il calcare e si porta via la roccia una molecola alla volta. Un arco tagliato a mano dentro una grotta naturale vuol dire che il posto era già lì e qualcuno l’ha trovato utile: le cisterne migliori sono quelle che non hanno dovuto essere scavate.',
      gioco: 'È il passaggio nascosto, e ci si arriva solo per acqua. Il congedo di Bertoldo qui è una scena breve e conta: chi vi ha portato fin qui lo ha fatto per un motivo, e il motivo si scopre adesso.',
    },

    alba: {
      titolo: 'L’alba su Lumelia',
      ora: 'Dopo mezzanotte, per la prima volta da ieri',
      guarda: [
        ['Il disco nero', 'Si sgretola come cenere soffiata via.'],
        ['Il sole', 'Esplode di nuovo nel cielo, caldo, abbagliante e meravigliosamente **normale**.'],
        ['Il mondo che si riaccende', 'I boschi, i campi, il nastro lontano del fiume. Tornano a uno a uno, non tutti insieme.'],
        ['All’orizzonte', 'Piccolo piccolo, un dettaglio che si vede solo da quassù.'],
      ],
      storia: 'Un’eclissi anulare vera dura al massimo dodici minuti e poi il sole torna da sé: la paura che non torni è più antica dell’astronomia, ed è la ragione per cui ogni civiltà si è messa a calcolare i cicli del cielo. Sapere quando finisce è stata la prima forma di potere.',
      gioco: 'È l’epilogo, e il gioco fa i conti: chi c’è, cosa avete portato, quali imprese avete chiuso e quali no. Da qui si vede anche quello che non avete visitato — ed è fatto per farvi venire voglia di rifarlo per un’altra strada.',
    },
    castelloEsterno: {
      titolo: 'Castello Crepuscolo, da fuori',
      ora: 'Le 22:00',
      guarda: [
        ['Il castello', 'Si arrampica sulla montagna come un artiglio di pietra nera, le guglie perse nel cielo senza sole.'],
        ['Le finestre', 'Pulsa una luce rossastra. Pulsa: non brilla.'],
        ['La Barriera Notturna', 'Un velo d’ombra liquida che avvolge tutto e ondeggia come acqua verticale.'],
        ['Il punto che non torna', 'C’è qualcosa che non quadra nella barriera, e si vede solo stando fermi a guardarla.'],
        ['Gli ospiti in arrivo', 'Arrivano mascherati, e le maschere sono un problema perché voi non ne avete.'],
      ],
      storia: 'Una barriera che ondeggia come acqua verticale ha una superficie, e ogni superficie ha un punto in cui è più sottile: è così per il ghiaccio, per il vetro e per la tela di un tamburo. Il modo di trovarlo non è spingere più forte in un punto qualunque — è guardare dove il disegno si muove diversamente.',
      gioco: 'Entrare al ballo richiede una maschera a testa, e le maschere si procurano: comprate, barattate, chieste, rubacchiate. Il gioco conta come le avete ottenute, perché al ballo qualcuno le riconosce.',
    },

    torreInterno: {
      titolo: 'Dentro la Torre Pendente',
      ora: 'Dal primo rampante in su',
      guarda: [
        ['Il pavimento', 'Pende talmente a sinistra che un tavolo intero si è incagliato contro il muro come una nave arenata.'],
        ['La composizione contro il muro', 'Tre candelabri, due tazze da tè ancora piene, e un gatto che ha smesso di lottare.'],
        ['La scala', 'Gira, e girando cambia la direzione in cui si cade.'],
        ['L’Osservatorio', 'In cima, dove il soffitto ha smesso di fidarsi del pavimento.'],
      ],
      storia: 'Quindici gradi di pendenza sono più di quanto sembri: la Torre di Pisa ne ha meno di quattro. A quindici gradi un oggetto tondo non sta fermo da nessuna parte, e per camminare bisogna appoggiare il piede di traverso — è per questo che chi ci abita, dentro una torre così, cammina in un modo suo.',
      gioco: 'La pendenza è una meccanica: alcune azioni riescono peggio e altre meglio, e il gioco lo dice prima. In cima c’è una distrazione astronomica che vale la salita.',
    },

    torrePendente: {
      titolo: 'La Torre Pendente, da fuori',
      ora: 'Oltre il sentiero laterale',
      guarda: [
        ['La torre', 'Sembra aver perso una scommessa con la gravità: pende di un buon quindici gradi verso ovest.'],
        ['La malta', 'A giudicare dai rumori che vengono da dentro, la tiene su più la cocciutaggine che la malta.'],
        ['La base', 'Ci si arriva dalla strada laterale che si stacca poco prima del Bivio della Civetta.'],
        ['La porta', 'C’è, ed è sul lato verso cui la torre pende. Naturalmente.'],
      ],
      storia: 'Le torri pendono per una ragione sola: fondazioni su terreno che cede da un lato. E continuano a stare in piedi per una ragione altrettanto semplice — la verticale del loro peso cade ancora dentro la base. Il giorno in cui esce, non c’è malta che tenga.',
      gioco: 'È una delle tre strade del Bivio della Civetta, e la più facile da non vedere. Chi ci va trova qualcuno che non compare da nessun’altra parte del gioco.',
    },
  };

  /* ---------- il rendering: identico in tutti i giochi della serie ---------- */

  const $ = id => document.getElementById(id);
  let corrente = null;

  /* IL GRASSETTO DELLE SCHEDE. Le schede iniettavano il testo GREZZO in innerHTML, e nel
     testo delle schede il grassetto si scrive `**cosi**` come in tutto il resto del gioco:
     risultato, nel browser si leggevano gli asterischi. Trentaquattro volte in questo gioco,
     e in tutti e cinque. Il motore ha `formatText` da sempre — ma e' privato dentro Engine, e
     una scheda non deve dipendere dai privati di un altro modulo: qui basta una versione
     piccola, con l'escape prima, che fa grassetto e corsivo e nient'altro.
     E' un difetto che nessun collaudo poteva vedere: il grafo era sano, i dati erano sani, e
     gli asterischi si vedono solo GUARDANDO la scheda in un browser. */
  const md = t => String(t)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/\*(.+?)\*/g, '<i>$1</i>');

  function apri(key, titoloHUD) {
    const L = LUOGHI[key];
    if (!L) return;
    const box = $('modal-generic-content');
    if (!box) return;
    box.innerHTML = `<h2>🔎 ${md(L.titolo)}</h2>`
      + `<p style="color:var(--text-dim);margin:-6px 0 14px">${md(L.ora)}</p>`
      + (titoloHUD && titoloHUD !== L.titolo
          ? `<p style="color:var(--text-dim);font-size:.92em;margin:-10px 0 14px">Nel gioco, adesso: <b>${titoloHUD}</b></p>` : '')
      + `<h3>👁 Cosa vedete nel quadro</h3><ul style="margin:0 0 14px;padding-left:18px">`
      + L.guarda.map(([n, t]) => `<li style="margin-bottom:7px"><b>${md(n)}.</b> ${md(t)}</li>`).join('')
      + `</ul><h3>📜 Perché questo posto esiste</h3><p style="margin:0 0 14px">${md(L.storia)}</p>`
      + `<h3>🎲 Cosa c'entra col gioco</h3><p style="margin:0 0 4px">${md(L.gioco)}</p>`
      + `<p style="color:var(--text-dim);font-size:.86em;margin:14px 0 0">Questa scheda racconta solo quello che`
      + ` avete già davanti agli occhi: non anticipa niente di quello che deve ancora succedere.</p>`;
    const chiudi = document.createElement('button');
    chiudi.className = 'btn';
    chiudi.style.marginTop = '14px';
    chiudi.textContent = '↩ Torna alla scena';
    chiudi.onclick = () => $('modal-generic').classList.add('hidden');
    box.appendChild(chiudi);
    $('modal-generic').classList.remove('hidden');
  }

  /* Chiamata dal motore dopo ogni Scenes.paint(): accende il pulsante se questo
     luogo ha una scheda, lo spegne se non ce l'ha. Un luogo senza scheda non
     mostra un pulsante che apre il vuoto. */
  function aggiorna(key, titoloHUD) {
    corrente = key;
    const b = $('btn-scena');
    if (!b) return;
    const haScheda = !!LUOGHI[key];
    b.classList.toggle('hidden', !haScheda);
    if (!haScheda) return;
    b.onclick = () => apri(key, titoloHUD);
    b.title = 'Cosa sto guardando?';
  }

  return { LUOGHI, apri, aggiorna, corrente: () => corrente };
})();
