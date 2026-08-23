/* ============ DIALOGHI — le finestre di conferma, in stile ============
   Il gioco usava confirm(), alert() e prompt() del browser: tre finestre di sistema, col
   font di sistema e i pulsanti del sistema operativo, in mezzo a un gioco fatto tutto di
   pixel e cornici verdi. Sono anche le uniche finestre che il giocatore vede prima di
   perdere qualcosa — la partita che si sovrascrive, l'utente che si cancella con tutti i
   suoi salvataggi — quindi erano proprio quelle che dovevano essere fatte bene.

   Restano un CANCELLO VERO sulle azioni distruttive: il pulsante che distrugge non è
   quello a fuoco (si apre col fuoco su «Annulla»), è marcato in rosso, e Invio dà sempre
   la risposta prudente. Escape annulla. Una conferma che si può accettare a occhi chiusi
   non è una conferma.

   Le tre funzioni ritornano una Promise, quindi i punti di chiamata sono `await`. */

const Dialoghi = (() => {

  const $ = id => document.getElementById(id);

  function chiudi(el, onKey) {
    el.classList.add('hidden');
    el.innerHTML = '';
    if (onKey) document.removeEventListener('keydown', onKey, true);
  }

  function apri({ titolo, testo, azione, pericolo, campo, valore }) {
    return new Promise(risolvi => {
      let el = $('modal-dialogo');
      if (!el) {
        el = document.createElement('div');
        el.id = 'modal-dialogo';
        el.className = 'modal hidden';
        document.body.appendChild(el);
      }
      const box = document.createElement('div');
      box.className = 'modal-box dialogo-box';
      box.innerHTML = `<h2>${titolo}</h2><p class="dialogo-testo">${testo}</p>`;

      let input = null;
      if (campo) {
        input = document.createElement('input');
        input.type = 'text';
        input.className = 'dialogo-campo';
        input.value = valore || '';
        input.setAttribute('aria-label', titolo);
        box.appendChild(input);
      }

      const riga = document.createElement('div');
      riga.className = 'dialogo-pulsanti';
      const annulla = document.createElement('button');
      annulla.className = 'btn';
      annulla.textContent = azione ? '↩ Annulla' : '↩ Ho capito';
      const conferma = azione ? document.createElement('button') : null;
      if (conferma) {
        conferma.className = 'btn' + (pericolo ? ' btn-pericolo' : '');
        conferma.textContent = azione;
      }
      // l'ordine: prima Annulla, poi l'azione. Il pollice cade sul sicuro.
      riga.appendChild(annulla);
      if (conferma) riga.appendChild(conferma);
      box.appendChild(riga);

      el.innerHTML = '';
      el.appendChild(box);
      el.classList.remove('hidden');

      const finito = v => { chiudi(el, onKey); risolvi(v); };
      const onKey = e => {
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); finito(campo ? null : false); }
        else if (e.key === 'Enter') {
          e.preventDefault(); e.stopPropagation();
          // Invio dà la risposta PRUDENTE quando c'è di mezzo una distruzione
          if (campo) finito(input.value);
          else finito(pericolo ? false : !!azione);
        }
      };
      document.addEventListener('keydown', onKey, true);
      annulla.onclick = () => finito(campo ? null : false);
      if (conferma) conferma.onclick = () => finito(campo ? input.value : true);
      // il fuoco va sul campo se c'è, altrimenti sul pulsante prudente
      (campo ? input : annulla).focus();
      if (campo) input.select();
    });
  }

  /* Una domanda sì/no. `pericolo: true` marca in rosso l'azione e fa sì che Invio dica no. */
  const chiedi = (titolo, testo, azione = 'Conferma', pericolo = false) =>
    apri({ titolo, testo, azione, pericolo });

  /* Un avviso: un pulsante solo. */
  const avvisa = (titolo, testo) => apri({ titolo, testo, azione: null });

  /* Una riga di testo. Ritorna la stringa, o null se annullato. */
  const chiediTesto = (titolo, testo, valore = '', azione = 'Va bene') =>
    apri({ titolo, testo, azione, campo: true, valore });

  return { chiedi, avvisa, chiediTesto };
})();
