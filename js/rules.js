/* ============ REGOLE — guida rapida e "come si gioca" ============ */

const RULES_HOWTO = `
<h3>🎲 Che gioco è questo?</h3>
<p>È un'avventura fantasy interattiva ispirata a <b>Dungeons &amp; Dragons</b>, pensata per chi non ha mai giocato.
Il computer fa da <b>Dungeon Master</b> (il narratore): racconta la storia, vi propone le scelte, tira i dadi e gestisce i combattimenti.
Voi dovete solo <b>leggere ad alta voce, discutere e scegliere</b>.</p>

<h3>👥 Come si gioca in gruppo (2-6 giocatori)</h3>
<p>Si gioca <b>tutti insieme su un solo schermo</b> (ideale: TV o laptop al centro del tavolo).</p>
<p>1. Ogni giocatore sceglie <b>un eroe</b> e scrive il proprio nome sotto.<br>
2. A turno, un giocatore fa da <b>lettore</b>: legge la narrazione ad alta voce (con le voci dei personaggi, se avete coraggio).<br>
3. Le <b>scelte si discutono insieme</b>: siete una compagnia, decidete come una compagnia.<br>
4. Quando serve una <b>prova di abilità</b>, scegliete CHI la tenta: ogni eroe è bravo in cose diverse (il gioco vi mostra i bonus).<br>
5. In <b>combattimento</b> ognuno controlla il proprio eroe nel proprio turno.</p>

<h3>🎯 Le prove di abilità</h3>
<p>Quando tentate qualcosa di incerto (convincere, scalare, ricordare), il gioco tira un <b>dado a 20 facce (d20)</b> e somma il bonus dell'eroe.
Se il totale raggiunge la <b>CD</b> (Classe di Difficoltà), è un successo!</p>
<p><b>Esempio:</b> convincere i goblin ha CD 12. Fizzle ha Carisma +2: col dado esce 11, totale 13 → <b>successo!</b></p>
<p>Un <b>20 naturale</b> sul dado è sempre un trionfo (critico!), un <b>1 naturale</b> è sempre un pasticcio.</p>

<h3>⚔ Il combattimento (semplice, promesso)</h3>
<p>Si combatte <b>a turni</b>, in ordine di iniziativa (un tiro di dado all'inizio). Nel tuo turno scegli UNA azione:</p>
<p>• <b>Attacco</b>: tiri per colpire (d20 + bonus contro la CA del nemico); se colpisci, tiri i danni.<br>
• <b>Abilità speciale</b>: le mosse forti del tuo eroe. Hanno usi limitati: spendeteli bene!<br>
• <b>Pozione</b>: bevi (o fai bere) una pozione curativa.<br>
• <b>Difesa</b>: +3 alla tua CA fino al prossimo turno.</p>
<p>Se un eroe scende a <b>0 PV</b> cade a terra svenuto: NON è morto, e una cura (tipo la Luce Curativa di Brunilde) lo rimette in piedi.
Se cade tutto il gruppo... il DM è clemente, ma la storia prenderà una piega meno gloriosa.</p>

<h3>📊 Le sigle in breve</h3>
<p><b>PV</b> = Punti Vita (a 0 sei a terra) · <b>CA</b> = Classe Armatura (quanto sei difficile da colpire) · <b>CD</b> = difficoltà di una prova ·
<b>FOR/DES/COS/INT/SAG/CAR</b> = Forza, Destrezza, Costituzione, Intelligenza, Saggezza, Carisma.</p>

<h3>💡 Consigli da veterani (che non siete, ma lo sembrerete)</h3>
<p>• Non esiste la scelta "giusta": esiste la storia che create.<br>
• Le prove fallite non rovinano la partita: la rendono più divertente.<br>
• Parlate nei panni del personaggio: vale doppio.<br>
• Tenete d'occhio le pozioni prima del gran finale.<br>
• Il gioco salva da solo a ogni scena: potete chiudere e riprendere quando volete.</p>

<h3>⏱ Durata</h3>
<p>Una partita completa dura <b>2-4 ore</b>. Volendo si può spezzare in due serate: il salvataggio automatico vi aspetta.</p>
`;

const RULES_QUICK = `
<div class="rules-section"><details open><summary>🎯 Prove di abilità</summary><div class="rules-body">
<p>Il gioco tira <b>1d20 + bonus dell'eroe</b> contro una <b>CD</b>:</p>
<p>CD 10 = facile · CD 12 = media · CD 13-14 = difficile</p>
<p><b>20 naturale</b> = successo critico automatico · <b>1 naturale</b> = fallimento automatico</p>
<p>Scegliete l'eroe giusto per ogni prova: il gioco mostra il bonus di ciascuno prima di tirare.</p>
</div></details></div>

<div class="rules-section"><details><summary>⚔ Combattimento — il tuo turno</summary><div class="rules-body">
<p>Nel tuo turno, UNA azione a scelta:</p>
<p><b>⚔ Attacco</b> — d20 + bonus vs CA del nemico → se colpisci: danni dell'arma.</p>
<p><b>✨ Abilità</b> — le mosse speciali. Usi limitati: si ricaricano riposando sulla scala della torre (prima del finale) e dopo una sconfitta.</p>
<p><b>🧪 Pozione</b> — cura te o un alleato (anche uno a terra: lo rialza!).</p>
<p><b>🛡 Difesa</b> — +3 CA fino al tuo prossimo turno.</p>
</div></details></div>

<div class="rules-section"><details><summary>💀 Cadere a 0 PV</summary><div class="rules-body">
<p>A 0 PV l'eroe è <b>a terra, svenuto</b>: salta i turni e non può agire. NON è morto.</p>
<p>Si rialza se riceve una cura (Luce Curativa, pozione versata da un alleato).</p>
<p>Se cade TUTTO il gruppo, il DM vi salva... con qualche conseguenza.</p>
</div></details></div>

<div class="rules-section"><details><summary>🌟 Vantaggio e Svantaggio</summary><div class="rules-body">
<p><b>Vantaggio</b>: tiri 2d20 e tieni il <b>migliore</b> (es. attacco furtivo, sorpresa).</p>
<p><b>Svantaggio</b>: tiri 2d20 e tieni il <b>peggiore</b> (es. nemici nel fumo di Fizzle).</p>
</div></details></div>

<div class="rules-section"><details><summary>🧪 Oggetti e oro</summary><div class="rules-body">
<p>Lo <b>zaino è condiviso</b>: le pozioni le può usare chiunque nel proprio turno.</p>
<p>L'<b>oro</b> serve nei negozi e nelle trattative. Alcuni oggetti aprono strade alternative nella storia...</p>
</div></details></div>

<div class="rules-section"><details><summary>😇 Non-morti e danni sacri</summary><div class="rules-body">
<p>Scheletri e vampiri sono <b>non-morti</b>: la <b>Sacra Folgore</b> di Brunilde infligge loro <b>danni doppi</b>.</p>
<p>Tenetelo a mente per il castello...</p>
</div></details></div>

<div class="rules-section"><details><summary>📖 Chi legge? Chi decide?</summary><div class="rules-body">
<p>Consiglio: <b>ruotate il lettore</b> a ogni scena. Le scelte si discutono insieme; se non siete d'accordo... votate, o fate decidere l'eroe più pertinente (è il suo momento!).</p>
</div></details></div>
`;
