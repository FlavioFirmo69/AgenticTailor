# Ricorrenze mensili delle Finanze

Ogni ricorrenza appartiene a un ambiente e a un conto, con importo firmato, descrizione, giorno del mese, data iniziale inclusiva e fine facoltativa. Categoria, controparte, note e collegamenti sono copiati nelle singole previsioni.

La generazione copre fino all'ultimo giorno del dodicesimo mese incluso quello corrente. Avviene al salvataggio e all'apertura/ricarica di Finanze, senza cron o chiamate AI. Non esegue pagamenti, non conferma movimenti e non modifica il saldo rilevato. Nei mesi corti la scadenza viene anticipata all'ultimo giorno disponibile.

Ogni occorrenza ha una data originaria immutabile e un vincolo univoco per ambiente e ricorrenza: rileggere, spostare o annullare una previsione non ne crea una copia. Le modifiche di un movimento riguardano solo quella scadenza. Le ricorrenze storiche 2B non vengono convertite automaticamente.

La pausa annulla solo previsioni con data da oggi in avanti, contrassegnandole come sospese dalla ricorrenza. La ripresa ripristina solo tali previsioni future e genera dal giorno di riattivazione; eseguiti, annullamenti manuali e mesi trascorsi durante la pausa restano conservati. Per sostituire importo o regola, mettere in pausa la vecchia e creare la nuova.

Tutte le scritture sono transazionali, controllano ambiente, conto e versione e vengono registrate nello storico. La generazione blocca il conto e usa un vincolo univoco per evitare duplicati.

Verifiche: npm test, npm run build, node scripts/verify-finance-recurrences.mjs con il server locale avviato. Il test di integrazione usa e rimuove esclusivamente un conto temporaneo.
