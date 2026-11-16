# Marketing: predisposizione disattivata

Il catalogo continua a dichiarare Marketing `ready:false`. `marketing-policy.ts` blocca l'esecuzione sul server indipendentemente dalla UI. Inserire una chiave LLM non attiva automaticamente il modulo: prima vanno collegati e verificati generazione, controllo dello stile, misurazione e revisione. Nessuna chiamata provider, invio social/email o controllo periodico automatico è introdotto da questa modifica.

## Dati e decisioni

Migrazione 021: strategie per soggetto e ambiente; revisioni immutabili con motivazione, decorrenza, origine, versione della scheda e dell'identità, copia del Markdown di stile; attività datate con testo completo e riferimento a strategia/revisione; audit delle decisioni. Le API attuali del caso editoriale richiedono il superuser e l'ambiente personale. Il nucleo dati può essere esteso ad altri soggetti; nessuna identità autoriale è applicata agli altri ambienti.

La prima bozza di Gabriella deriva dalla simulazione salvata nella scheda: 21 voci, inclusi i tre controlli mensili. Il profilo Markdown nativo di Flavio, che contiene anche le indicazioni di voce, viene copiato nella revisione come riferimento di stile; non è stato dedotto un nuovo stile. Un successivo file di stile più specifico dovrà essere acquisito esplicitamente prima della generazione. La bozza non è stata riscritta da un LLM né dichiarata conforme mediante verifica automatica.

La creazione di bozze è consentita solo all'amministratore; approvazione/rifiuto operativo restano bloccati. L'API non espone un generatore fittizio. La bozza strutturata è una fotografia: modificare il vecchio campo libero del calendario nella scheda non modifica implicitamente la revisione. Questo evita variazioni nascoste a un piano approvato.

## Applicazione di una revisione quando il modulo sarà attivato

Transazione unica con lock del libro e della strategia e versione attesa. Una sola bozza pendente. Una decorrenza passata richiede una proposta aggiornata. Approvazione: annulla con motivo le attività aperte dalla decorrenza, conserva le precedenti e quelle pubblicate, crea le nuove attività, storicizza la revisione precedente e registra chi ha deciso. Rifiuto: nessuna modifica al piano attuale. Versione e stato impediscono doppie applicazioni. Gli elementi che si vogliono mantenere nel futuro devono essere presenti nella nuova proposta sostitutiva; l'anteprima esplicita il numero di attività annullate e create.

L'agenda legge solo attività persistite e approvate, con sigla MK, senza occupare disponibilità. Aprendo il giorno si può consultare il testo e il riferimento alla revisione. Annullate e pubblicate restano nell'archivio e non tra le attività aperte. La perdita di accesso al provider non elimina gli impegni già approvati. Nessuna attività di Gabriella è stata inserita in agenda durante questa predisposizione.

## Verifiche

- `npm test`: stile obbligatorio, date e chiavi valide; sostituzione dalla decorrenza e conservazione delle attività precedenti/pubblicate.
- `node scripts/verify-marketing.mjs`: fixture temporanea, versioni e concorrenza, isolamento, stile e audit; approvazione/rifiuto/generazione bloccati e nessuna attività creata.
- `node scripts/prepare-gabriella-strategy.mjs`: preparazione idempotente della prima bozza, senza sovrascrivere strategie esistenti.
- Build e verifica browser dello stato disattivato e dei comandi di approvazione/revisione non utilizzabili.

## Attività senza data di 2B: verifica separata

Al controllo del 13 novembre 2026, `sb2_events` non contiene eventi senza data per l'utente selezionato. `sb2_tasks` contiene invece 12 attività aperte senza scadenza: una già migrata con una pratica, undici non migrate nell'area operativa di Agentic. Sono ancora nella fonte 2B. Nessuna nuova migrazione o data fittizia è stata applicata con questa modifica.
