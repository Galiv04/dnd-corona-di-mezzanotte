# 🌒 La Corona di Mezzanotte

**Un'avventura fantasy interattiva in stile D&D, per 1-6 giocatori, con Dungeon Master automatico.**

🎮 **Gioca subito:** https://galiv04.github.io/dnd-corona-di-mezzanotte/ · [![Test di Lumelia](https://github.com/Galiv04/dnd-corona-di-mezzanotte/actions/workflows/tests.yml/badge.svg)](https://github.com/Galiv04/dnd-corona-di-mezzanotte/actions/workflows/tests.yml)

## Cos'è

Il vampiro Lord Vesper Morn ha spento il sole. Avete tempo fino a mezzanotte per riaccenderlo.

- 🎭 **6 eroi pregenerati** con storia, abilità e personalità (scegliete da 1 a 6 personaggi)
- 🎙 **Dungeon Master automatico**: il gioco narra, propone scelte, tira i dadi e arbitra i combattimenti
- 🗺 **Storia ramificata**: 140 scene, 3 percorsi principali (bosco, miniere, fiume), side-quest, 3 finali con varianti (inclusa la Tentazione della Corona) e 25 imprese sbloccabili
- ⚔ **Combattimenti a turni** semplificati in stile D&D (d20, CA, vantaggio/svantaggio)
- 📖 **Regole consultabili in un click** — pensato per chi non ha MAI giocato a D&D
- 💾 **Salvataggio automatico** su 3 slot (gruppi diversi sullo stesso dispositivo) con riepilogo alla ripresa
- 🎵 **Effetti sonori chiptune** generati via WebAudio (disattivabili)
- 🌟 **Modalità Eroe Solitario** per giocare da soli con bonus dedicati
- 🕹 Grafica pixel-art disegnata interamente via canvas, zero dipendenze

## Come si gioca

1. Aprite il sito su un solo schermo condiviso (TV o laptop al centro del tavolo)
2. Ogni giocatore sceglie un eroe e scrive il suo nome
3. Leggete la narrazione ad alta voce (a turno!), discutete le scelte, tirate i dadi
4. Durata: **2-4 ore**. Nessuna preparazione richiesta.

## Sviluppo

Sito 100% statico (HTML/CSS/JS vanilla). Per provarlo in locale:

```bash
python3 -m http.server 8000
# poi aprite http://localhost:8000
```

Test automatici (validazione del grafo della storia, dati, bilanciamento):

```bash
node tests/validate.mjs
```

---

*Creato con Claude Code. Che la luce vi accolga. ADESSO. — Sorella Brunilde*
