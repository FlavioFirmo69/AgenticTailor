# Home compatta e chiusura delle attività

La sezione “La tua settimana” è un elemento details chiuso inizialmente. Il riepilogo mostra quante attività aperte sono in agenda oggi, con data e settimana calcolate in Europe/Rome. Un click apre oggi e resto della settimana; il pulsante ✓ è disponibile solo sulle voci di oggi. Una chiusura riuscita aggiorna subito il contatore e offre “Annulla chiusura”.

La migrazione 022 registra chiusure e storico nell'ambiente personale. Non elimina appuntamenti e non modifica le tabelle storiche `sb2_*`. Le chiusure degli eventi del calendario sono sovrapposte ai dati originali: spariscono dal riepilogo delle cose da fare e rimangono identificabili come completati nell'agenda. Per le voci marketing non viene effettuata alcuna pubblicazione né viene attivato un LLM.

Per un task della commessa, la chiusura aggiorna anche il suo stato nativo a Completato, incrementa la versione e registra una nota nel diario. Sono ammessi solo task assegnati al profilo personale attivo, di commesse operative, presenti nell'agenda di oggi. Se un task viene riaperto dalla commessa torna nel riepilogo. L'annullamento dalla home ripristina solo lo stato precedente e viene rifiutato se nel frattempo il task ha subito altre modifiche.

Tutti i comandi richiedono amministratore e ambiente personale; l'origine delle richieste browser viene controllata. La risoluzione dell'evento avviene sul server: il client non può inventare titolo, data o assegnazione. Lock, transazione e stato della chiusura impediscono duplicazioni da doppio click. Il conteggio non nasconde eventuali errori delle fonti: in quel caso è indicato come parziale.

Collaudo: `node scripts/verify-agenda-completion.mjs` usa appuntamenti e task temporanei identificati, rimossi al termine. Verifica chiusura/annullamento, idempotenza, concorrenza, riapertura esterna e isolamento. La prova browser di apertura del pannello, chiusura e annullamento ha usato soltanto un appuntamento temporaneo.

## Appuntamenti scaduti

Nell’ambiente personale, la regola si applica agli appuntamenti nativi con data iniziale dal 18 novembre 2026. La data operativa è quella di Europe/Rome. Gli appuntamenti con orario ancora aperti risultano eseguiti dal giorno successivo alla data di fine. Lo stato deriva dagli orari registrati e non richiede un processo schedulato. Una chiusura manuale ha precedenza. Nell’agenda, «Riapri appuntamento» disattiva la chiusura automatica per l’orario corrente. Un cambio di orario riapplica la regola al nuovo appuntamento.

Gli eventi a tutto il giorno ancora aperti compaiono in «Da recuperare», dentro «La tua settimana», a partire dalla loro data di fine esclusiva. La lista mostra la data iniziale. Il pulsante ✓ completa l’attività e offre l’annullamento. «Riprogramma» sposta l’evento originale mantenendo identità e durata, con una nuova data da oggi in avanti. Gli elementi collegati e quelli dello storico restano soggetti alle regole dei rispettivi moduli.
