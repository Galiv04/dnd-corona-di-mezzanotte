# CLAUDE.md — istruzioni per chi lavora su questo progetto

> Questo file viene letto automaticamente da Claude Code all'apertura del progetto.
> Contiene tutto il necessario per lavorare a "La Corona di Mezzanotte" o per **creare una nuova campagna** con lo stesso motore.

## Cos'è questo progetto

Un'avventura fantasy interattiva in stile D&D, in **italiano**, giocabile nel browser da **1-6 giocatori sullo stesso schermo**, con Dungeon Master automatico. Sito 100% statico (HTML/CSS/JS vanilla, zero dipendenze, zero build) pubblicato su GitHub Pages.

- **Live**: https://galiv04.github.io/dnd-corona-di-mezzanotte/
- **Repo**: https://github.com/Galiv04/dnd-corona-di-mezzanotte

## Documentazione di progetto

La documentazione condivisa del motore vive ora nel repo separato **[Galiv04/dnd-motore](https://github.com/Galiv04/dnd-motore)** (`../dnd-motore/`):

| File | Contenuto |
|---|---|
| [../dnd-motore/docs/ARCHITETTURA.md](../dnd-motore/docs/ARCHITETTURA.md) | Come funziona il motore: formati dati, moduli, flusso di gioco |
| [../dnd-motore/docs/STILE-NARRATIVO.md](../dnd-motore/docs/STILE-NARRATIVO.md) | Tono, voce, regole di scrittura, esempi buoni e cattivi |
| [../dnd-motore/docs/COME-CREARE-UNA-CAMPAGNA.md](../dnd-motore/docs/COME-CREARE-UNA-CAMPAGNA.md) | Ricetta passo-passo per una nuova storia |
| [../dnd-motore/docs/LESSONS-LEARNED.md](../dnd-motore/docs/LESSONS-LEARNED.md) | Errori commessi e come evitarli la prossima volta |
| [../dnd-motore/docs/PIPELINE-PRODUZIONE.md](../dnd-motore/docs/PIPELINE-PRODUZIONE.md) | Il framework riusabile: orchestratore + agenti, moduli portabili, regole di efficienza |
| [../dnd-motore/docs/PREFERENZE.md](../dnd-motore/docs/PREFERENZE.md) | Preferenze del committente e modo di lavorare atteso |
| [templates/campagna-template.js](templates/campagna-template.js) | Scheletro commentato di una campagna nuova (ora anche in `../dnd-motore/templates/`) |

## Aggiornamenti di serie (agosto 2026)

La Corona è stata allineata agli standard degli altri giochi:
- **Densità**: 11% di scene-corridoio, 1.95 scelte/scena (soglie di serie in `../dnd-motore/docs/PIPELINE-PRODUZIONE.md`). Le prove possono usare `successHeal`/`failDamage` (il dado conta anche a destinazione uguale).
- **Minigiochi**: `js/minigames.js` + `scene.minigame` — la Frana del Monte Sapere (corsa, t4) e il secondo indovinello del Vecchio Salice (r1_tariffa). Doc: `../dnd-motore/docs/MINIGIOCHI.md`.
- Regola di serie: **nessuna scelta che promette contenuto narrativo senza una scena di payoff** (i gesti auto-contenuti con effetto visibile sono ok).

## Comandi

```bash
node tests/validate.mjs     # 26 controlli statici: grafo scene, dati, sprite, bilanciamento
node tests/playthrough.mjs  # 46 partite complete simulate headless (no browser)
```

**Entrambi devono essere verdi prima di ogni commit.** Non esiste build: si modificano i file e si ricarica.

## Regole di lavoro (importanti)

1. **Testare SEMPRE prima di pushare.** I due comandi sopra, più una verifica visiva sul sito live quando il cambiamento è grafico.
2. **Niente localhost su questa macchina**: le connessioni a `127.0.0.1` vanno in timeout (filtro di rete). Si verifica il gioco **sul sito GitHub Pages** o con i test headless Node. Vedi [LESSONS-LEARNED](docs/LESSONS-LEARNED.md#rete).
3. **`git push` richiede il workaround DNS** (già configurato nel repo):
   `git config http.curloptResolve "github.com:443:140.82.121.3"` — se smette di funzionare, aggiornare l'IP con `nslookup github.com`.
4. **La cache di GitHub Pages dura ~10 minuti**: dopo un deploy, per verificare nel browser bisogna forzare il refetch degli asset (`fetch(url, {cache:'reload'})` su tutti i file, poi `location.reload()`).
5. **Le API del browser vanno protette** (`typeof performance !== 'undefined'`, ecc.): il simulatore headless carica gli stessi file in Node.
6. **Tutto in italiano**: testi, commenti del codice, messaggi di commit.

## Struttura dei file

```
index.html          ordine di caricamento degli script (contano!)
css/style.css       stile pixel retrò, temi, accessibilità, animazioni
js/sound.js         effetti chiptune + sequencer musicale (WebAudio, zero asset)
js/sprites.js       sprite 16x16 come mappe di caratteri + palette
js/scenes.js        painter procedurali degli sfondi (canvas)
js/characters.js    HEROES (6 eroi) + BESTIARY (nemici)
js/campaign.js      ITEMS + CAMPAIGN (tutte le scene) + WORLD_MAP
js/epilogues.js     HERO_EPILOGUES + IMPRESE + CRONACA
js/rules.js         testi delle regole (guida completa + regole rapide)
js/dice.js          tiri di dado con overlay animato
js/combat.js        combattimento a turni
js/engine.js        stato di gioco, scene, salvataggi, profili, modali
js/main.js          titolo, setup della compagnia, scorciatoie, wiring
tests/              validate.mjs (statico) + playthrough.mjs (simulazione)
```

## Cosa NON fare

- Non introdurre dipendenze esterne, framework o build step: il gioco deve restare un sito statico apribile anche da `file://`.
- Non aggiungere immagini o file audio: grafica e suoni sono **generati via codice** (canvas + WebAudio). È una scelta di progetto, non un limite.
- Non spezzare il formato dati delle scene senza aggiornare `tests/validate.mjs`.
- Non usare `alert()`/`prompt()` per il flusso di gioco (solo per utility di gestione): il gioco usa le proprie modali.
