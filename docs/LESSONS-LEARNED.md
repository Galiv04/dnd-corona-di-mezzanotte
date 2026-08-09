# Lezioni imparate — dalla creazione del primo gioco

Errori realmente commessi durante lo sviluppo di "La Corona di Mezzanotte" e come evitarli la prossima volta.

## Ambiente <a name="rete"></a>

**1. Su questa macchina localhost non funziona.**
I server HTTP locali si avviano ma ogni connessione a `127.0.0.1` va in timeout (filtro di rete), sia dal browser sia da `curl`. Sono stati persi ~20 minuti a diagnosticarlo.
→ **Prossima volta**: saltare direttamente il server locale. Si verifica con i **test headless in Node** e con il **sito live su GitHub Pages**.

**2. `git push` fallisce con "Could not resolve host: github.com".**
Il DNS del sistema non risolve `github.com` (ma `api.github.com` sì, e `gh` funziona).
→ **Soluzione permanente già applicata**: `git config http.curloptResolve "github.com:443:140.82.121.3"`. Se cambia l'IP: `nslookup github.com`.

**3. GitHub Pages serve gli asset dalla cache per ~10 minuti.**
Dopo un deploy il browser mostrava ancora la versione vecchia, facendo sembrare "non funzionante" un fix corretto.
→ **Prossima volta**: verificare prima con `curl` che il file sul server sia aggiornato, poi nel browser forzare `fetch(url, {cache:'reload'})` su tutti gli asset e ricaricare.

## Testing

**4. I test hanno ripagato immediatamente.**
`validate.mjs` (grafo delle scene, dati, sprite) ha trovato al primo colpo: un riferimento a una scena inesistente, 2 pixel fuori palette, una scelta irraggiungibile.
→ **Prossima volta**: scrivere il validatore del grafo **prima** di scrivere metà campagna. Costa un'ora, ne fa risparmiare molte.

**5. Il simulatore di partite complete è la rete di sicurezza vera.**
`playthrough.mjs` gioca 46 partite headless con stub del DOM e copre tutte le strade e i finali. Ha impedito più volte di pushare regressioni.
→ **Attenzione**: gli stub del DOM vanno progettati **generosi** (timer con coda vera, `parentElement`, `remove()`, `clientWidth`), altrimenti ogni nuova API del browser rompe il test.

**6. Le API del browser vanno protette.**
`performance.now()` e `requestAnimationFrame` hanno rotto tutte le simulazioni Node.
→ **Regola**: ogni API browser usata nel codice di gioco va dietro un `typeof X !== 'undefined'`.

**7. I test non vedono la grafica. È l'errore più costoso di tutti.**
Una regola CSS `.hidden` mancante lasciava il banner "COMBATTIMENTO!" sopra la scena: suite verde, gioco visivamente rotto. Peggio: per giorni **le chiome degli alberi sono rimaste staccate dai tronchi** (fluttuavano a mezz'aria) in metà delle ambientazioni, e nessun test se n'è accorto — l'ha trovato il committente giocando.
→ **Prossima volta**: costruire un **banco di prova visivo** che disegni ogni sfondo a piena dimensione su richiesta (qui: `Scenes.painters[nome]` su un canvas a tutto schermo) e passarli in rassegna **uno per uno** con uno screenshot, prima del rilascio e dopo ogni modifica grafica.

**7-bis. Le classi di bug grafico da cercare sempre.**
Dall'audit completo delle 15 ambientazioni:
- elementi **staccati o fluttuanti** rispetto a ciò che dovrebbe reggerli (chiome/tronchi, torce senza staffa, cartelli senza palo);
- elementi **nascosti dietro altri** (l'eclissi finiva dietro la torre del castello);
- **bande e rettangoli netti** dove serve un profilo naturale (le "colline" sembravano muri);
- **aloni squadrati** attorno alle fonti di luce;
- **coerenza tra testo e immagine**: se la scena dice "tre goblin con un cartello", devono esserci tre goblin e un cartello. Due segnalazioni su tre del committente erano di questo tipo.

**7-ter. Una funzione irraggiungibile dall'interfaccia è un bug, anche se il codice è giusto.**
I 3 slot di salvataggio funzionavano perfettamente ma non comparivano mai: con un solo salvataggio "Continua" caricava diretto, e "Nuova Avventura" sceglieva lo slot da sé.
→ **Regola**: per ogni funzionalità, verificare *il percorso con cui l'utente ci arriva*, non solo che funzioni.

## Codice

**8. Dati dichiarati ma mai letti = bug silenzioso.**
Le abilità dichiaravano `stat: 'SAG'` ma il combattimento usava sempre la statistica dell'arma: la Sacra Folgore di Brunilde era molto più debole del previsto.
→ **Prossima volta**: aggiungere al validatore un controllo "ogni campo dichiarato nei dati è consumato da qualche parte nel codice".

**9. Gli effetti "una volta sola" e le scene ripetibili non vanno d'accordo.**
Il gate `enteredScenes` bloccava `fullHeal` dalla seconda sconfitta in poi: il gruppo riprovava il boss senza cure, di fatto in una partita impossibile.
→ **Regola**: distinguere esplicitamente **effetti one-shot** (oggetti, oro) da **effetti di stato ripetibili** (cure, riposi).

**10. Le promesse nel testo sono contratti.**
Il manuale prometteva che le abilità si ricaricassero "nelle scene di riposo" — che non esistevano. Il testo prometteva "+1 Reputazione" da un flag che nessuno leggeva. Le torce erano acquistabili ma inutili.
→ **Regola**: se il testo promette una meccanica, o la si implementa o si cambia il testo. Nessuna eccezione.

**11. Un bottone "Indietro" può regalare un'azione extra.**
Nella seconda freccia di Kael il back rimetteva a disposizione l'intero menu: due azioni in un turno.
→ **Regola**: nelle azioni a più passi, il ritorno indietro va disabilitato dopo che una risorsa è stata spesa.

## Processo

**12. La delega in parallelo ha funzionato benissimo.**
Agenti separati per: simulatore di test, code review, scrittura del ramo del fiume, side-quest ed epiloghi. Il tempo di scrittura si è ridotto drasticamente.
→ **Prossima volta**: dare agli agenti **il formato dati esatto e il tono con esempi**, e chiedere output in un file di bozza separato (`drafts/`) da integrare a mano. Funziona molto meglio del farli scrivere direttamente nei file vivi.

**13. Chiedere prima, decidere dopo.**
Le 4 domande iniziali (multiplayer, lingua, tono, regole) hanno indirizzato l'intero progetto. Sono valse più di qualunque discussione successiva.

**14. "Fatto" è un giudizio del committente, non dello sviluppatore.**
Il gioco era "completo" almeno tre volte prima di esserlo davvero: mancavano audio, accessibilità, profili, varianti di trama.
→ **Prossima volta**: continuare a proporre migliorie finché non è il committente a dire basta.

## Contenuti

**15. Le scene si scrivono in blocchi tematici, non in ordine.**
Scrivere tutto un ramo (bosco, miniere, fiume) in una volta mantiene coerenti tono e ritmo molto meglio che procedere in sequenza.

**16. Il conteggio parole predice la durata.**
~180 parole = 1 minuto di lettura ad alta voce. Con 16.700 parole → ~90 minuti di sola lettura, che con discussioni, dadi e combattimenti diventano le **2-4 ore** promesse. Il validatore lo calcola automaticamente.

**17. Le scelte che cambiano la trama valgono più delle scene in più.**
Il ramo del fiume (19 scene) ha aggiunto meno rigiocabilità della "Tentazione della Corona" (3 scene) e delle Cronache di Lumelia, che fanno sentire ogni partita diversa.
