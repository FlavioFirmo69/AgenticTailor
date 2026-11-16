# Agentic Tailor — demo 0.1

## Console del consulente

Aprire /admin per il catalogo completo e le attivazioni per cliente. Tutte le installazioni, incluse quelle precedenti senza configurazione, partono con zero agenti attivi. Calendario è implementato; gli altri elementi del catalogo sono in progettazione e non attivabili. La disattivazione conserva i dati e impedisce nuove operazioni anche dal backend.

Durante `npm run dev` su localhost l'identità superuser è automatica. Le API amministrative rifiutano l'accesso nelle build di produzione e su Vercel: l'autenticazione reale del consulente va implementata prima di abilitare l'amministrazione in produzione. Questa console opera sulle installazioni configurate nella demo; la futura gestione di database separati richiederà connessioni amministrative esplicite per ciascuna installazione.

Primo incremento locale della piattaforma di agenti su misura. Next.js/TypeScript, PostgreSQL facoltativo durante la demo. Nessuna dipendenza dai vecchi progetti.

## Avvio

Node.js 20.9+ richiesto. Nella cartella del progetto:

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Aprire http://127.0.0.1:3000. Senza DATABASE_URL viene usato un archivio JSON locale in data/, escluso da Git. Non avviene un fallback silenzioso se PostgreSQL configurato è irraggiungibile.

## PostgreSQL locale

Configurare in .env.local POSTGRES_ADMIN_URL con una connessione amministrativa al database postgres. Eseguire `npm run db:create`: crea soltanto AgenticTailor se assente. Configurare poi DATABASE_URL per AgenticTailor e riavviare il server. Password con caratteri speciali devono essere codificate per URL. Non inviare o pubblicare le credenziali.

Lo schema demo usa tailor_demo_state, una riga JSONB per ambiente, con transazione e blocco per riga. È una scelta provvisoria per questo incremento, non il modello dati finale. Il database non importa automaticamente i dati dell'archivio locale.

## Percorso dimostrativo

1. Chiedere «Quali sono i monumenti di Roma?»: nessun agente attivato.
2. Chiedere «Cerca disponibilità nel calendario per 2026-11-12» (oppure una data feriale): Calendario attivato, ricerca deterministica.
3. Scegliere e confermare uno slot; verificare Agenda e ricontrollo dello slot occupato.
4. In Istruzioni aggiungere «Tutte le risposte consegnale in spagnolo», salvare e ripetere la ricerca.
5. Cambiare cliente: messaggi, agenda e istruzioni sono separati.

Senza provider AI il router è a regole, la domanda su Roma ha una risposta predefinita e il cambio lingua supportato è un esempio deterministico. Le istruzioni libere richiedono AI_BASE_URL (base terminante in /v1, senza /chat/completions), AI_MODEL e AI_API_KEY. Le chiavi rimangono sul server. Con AI il calendario usa comunque i risultati deterministici; il modello ne formula la risposta.

## Confini della demo

Prenotazioni da 60 minuti, sei slot feriali, orari Europe/Rome. Titolo libero, nessuna anagrafica sanitaria. Nessuna integrazione calendario esterno. Marketing, Commesse, Redattore e Pianificatore sono predisposizioni visive, non agenti eseguibili. Supervisione Markdown, autenticazione, autorizzazioni reali, audit completo, cancellazione eventi, limiti di spesa, migrazioni per entità e job durevoli sono incrementi successivi. Il seguito «il secondo» mantiene il routing ma la prenotazione avviene con i pulsanti di conferma.

Il server locale ascolta su 127.0.0.1. Questa demo non deve essere pubblicata su Internet con dati reali prima di implementare autenticazione. Per produzione CLIENT_ID deve fissare un solo cliente; il database sarà dedicato. L'archivio locale è disabilitato su Vercel.

## Verifica

`npm test` e `npm run build`.

## Agenda mensile
La vista Agenda mostra il mese, con navigazione e pulsante Oggi. Selezionare un giorno per inserire titolo, orario e durata e salvare su PostgreSQL senza chiamate AI. L'inserimento manuale permette tutti i giorni e orari; la ricerca via chat conserva per ora gli slot dimostrativi feriali. Le sovrapposizioni sono bloccate sul server. L'agente deve essere attivo per il cliente.

Gli appuntamenti manuali supportano durate in minuti, in ore (fino a 12 ore e opzione 24 ore) e Tutto il giorno. Gli eventi giornalieri sono salvati da mezzanotte alla mezzanotte successiva, con fine esclusiva, e bloccano le sovrapposizioni per quella giornata.

## Modulo Commesse

Commesse è un modulo generico disponibile nel catalogo, disattivato per impostazione iniziale. Abilitarlo per un cliente da /admin e selezionare quel workspace. La sezione Commesse permette creazione e modifica della scheda, ricerca, filtro per stato e note nel diario. Codice e titolo sono obbligatori; il codice è stabile e univoco per cliente. Committente e responsabile sono campi descrittivi, non anagrafiche o assegnazioni autorizzative. Gli stati generici non certificano approvazioni tecniche.

PostgreSQL è richiesto. La migrazione database/001_projects.sql viene applicata una volta al primo accesso, con registrazione in tailor_schema_migrations. Le schede sono in tailor_projects e il diario in tailor_project_diary; le scritture di scheda e storico sono atomiche. La versione della scheda impedisce sovrascritture concorrenti. Il diario conserva autore demo, data evento e data registrazione. Nessuna funzione di cancellazione è esposta.

La chat riconosce richieste su commesse o incarichi e consulta l'elenco in modo deterministico; creazione, modifica e note passano dai moduli. Non sono ancora implementati selezione della commessa come contesto di altri agenti, permessi aziendali, attività, caratteristiche progettuali, elaborati, preventivi o integrazioni esterne. Le istruzioni base sono in agents/projects/instructions.md; questa versione non usa il modello per elaborare le commesse.

Verifica aggiuntiva locale: con npm run dev attivo eseguire node scripts/verify-projects.mjs. La procedura crea un record temporaneo, prova duplicati, isolamento, versionamento e diario, rimuove i propri dati di prova e ripristina le attivazioni precedenti.

## Team e modelli per ambiente

Con Commesse attivo sono disponibili Team e Modelli. L'anagrafica permette di aggiungere, modificare e disattivare persone; è distinta dal login. I modelli sono consultabili e possono essere applicati alle nuove commesse dal modulo di creazione o alle commesse ancora prive di fasi. L'editor dei modelli sarà un incremento successivo. Le copie di fasi e task sono indipendenti dalla versione sorgente. Modelli, persone e assegnazioni sono vincolati al client_id anche tramite chiavi esterne nel database.

Il responsabile della commessa è selezionato dal team; i valori liberi preesistenti restano leggibili finché non vengono collegati a una persona. Il task ha persona, stato, scadenza e nota. Avvio e completamento richiedono persona attiva; Non applicabile richiede motivazione. Gli aggiornamenti task sono versionati e scritti nel diario. Il conteggio dei task non rappresenta l'avanzamento tecnico o in ore e non approva gli elaborati.

La migrazione 002_team_workflows crea le tabelle per persone, modelli, fasi e task. Lo script node scripts/seed-engineering-demo.mjs prepara soltanto lo Studio tecnico: cinque persone demo senza email, modello Studio tecnico · 10 fasi, commesse DEMO-BWH Ballroom White House e DEMO-HLX Hotel Luxury, ciascuna con dieci fasi e ventidue task assegnati. Tutti i task sono Da fare. La procedura non sovrascrive dati esistenti e può essere ripetuta senza duplicazioni. Non crea utenti di accesso e non concede permessi aziendali. Attiva Commesse nello Studio tecnico preservando le altre attivazioni.

Verifiche locali: node scripts/verify-workflow.mjs (per la prima demo non ancora modificata), npm test, npm run build. I dati temporanei delle verifiche vengono rimossi; le due commesse demo rimangono disponibili.

## Stime nel modello

Modelli permette al superuser locale di modificare, per ciascun task, Ore fisse oppure Percentuale del totale. Le ore per giorno-persona fanno parte del modello. La simulazione in giorni-persona è locale e non modifica le commesse: mostra ore fisse, percentuali, totale task e quota non allocata o eccedente senza normalizzare i valori. La somma delle fasi deriva dai task, senza doppio conteggio.

Ogni salvataggio incrementa la versione e conserva le copie storiche in tailor_project_model_versions. Le nuove commesse copiano le formule di stima; quelle già esistenti non vengono aggiornate. La migrazione 003_model_estimates aggiunge storico e campi di stima. Il modello dimostrativo dello Studio tecnico è alla versione 2: 16 ore fisse + 90% dell'impegno totale, con 30% nella fase Disegno e dimensionamento. Su 20 giorni-persona da 8 ore, 160 ore complessive. Questi valori sono ipotesi iniziali da validare con lo studio. Il task Registrare richiesta e riferimenti ha 2 ore fisse, cui si aggiunge 1 ora di valutazione nella stessa fase.

La stima totale effettiva della commessa, l'applicazione alle copie esistenti e le date automatiche di pianificazione sono incrementi successivi. Nessuna disponibilità personale o sequenza di calendario viene calcolata in questa versione.

## Pianificazione deterministica della commessa

Aprire una commessa: la sezione Pianificazione raccoglie giorni-persona, avvio e scadenza richiesta. Calcola un'anteprima dal modello o dalle formule già copiate, poi conferma il piano iniziale o una nuova revisione. Le percentuali si applicano al budget totale; le ore sono arrotondate al minuto per task. La sequenza segue l'ordine delle fasi e dei task, distribuisce l'impegno su giornate della durata prevista dal modello ed esclude sabati e domeniche. Non usa AI e non controlla carichi, persone, assenze, festività o dipendenze avanzate.

La conferma salva uno snapshot immutabile in tailor_project_plans, aggiorna data iniziale, budget, scadenza e date pianificate dei task e scrive nel diario. Il piano iniziale rimane nello storico. Una firma dei dati di origine invalida le anteprime superate ed evita la doppia conferma. Le scadenze manuali dei singoli task restano distinte dalle date pianificate. Le modifiche a persone o dati successive non riscrivono lo snapshot del piano: occorre calcolare e confermare una revisione.

Per le commesse nate prima delle stime si può scegliere esplicitamente Usa le stime del modello corrente. La conferma copia soltanto le formule se fasi e task corrispondono, conservando persone e stati; strutture differenti vengono rifiutate. Nessun aggiornamento automatico di tutte le commesse.

La demo Ballroom White House ha un piano iniziale di 20 giorni-persona, 8 ore/giorno, avvio 16/11/2026 e scadenza 11/12/2026: 160 ore, 22 task, fine 11/12/2026. Hotel Luxury rimane priva di piano. Queste date sono uno scenario dimostrativo. Script dedicati: node scripts/verify-planning.mjs verifica con dati temporanei; node scripts/demo-ballroom-plan.mjs prepara il solo piano Ballroom se ancora assente.

Il piano mostra anche un Gantt con viste Fasi e Task, scala Adatta o Giorni e barre selezionabili. Scadenza prevista della commessa (linea navy tratteggiata) e fine calcolata (linea blu continua) rimangono distinte anche quando coincidono. La scala include entrambe le date; i fine settimana sono ombreggiati e le barre sono per giorno di calendario. La tabella del piano resta disponibile sotto il Gantt. Nessun dato pianificato viene modificato dai controlli del grafico.

## Pianificatore dello studio

Il modulo Pianificatore è attivabile separatamente dal catalogo; è stato abilitato nello Studio tecnico. Offre viste Studio, Persone e Attività con navigazione settimanale/mensile e filtri per commessa, persona e stato. L'apertura iniziale mostra la settimana corrente oppure il primo periodo futuro con lavoro se quella corrente è vuota. Il comando Oggi ripristina il periodo attuale.

La fonte è sempre l'ultima revisione confermata di ogni commessa Attiva o In attesa. Le anteprime e i vecchi piani non si sommano. Impegni e date vengono dal piano; persone e stati vengono dai task correnti. Le ore settimanali/mensili sono ricostruite dalla stessa distribuzione sequenziale giornaliera del piano: un task che attraversa periodi diversi contribuisce solo con la quota del periodo. Completati e non applicabili restano nelle ore storicamente pianificate, ma sono esclusi dalle ore su task aperti.

Le segnalazioni riguardano commesse senza piano, fine oltre scadenza, assegnazioni mancanti, persone inattive, task in attesa e oltre la propria fine pianificata. Sono riferite a tutte le commesse in carico, non soltanto ai filtri del periodo. Non viene rilevato un sovraccarico personale; nessun calendario, assenza o vincolo delle persone è ancora applicato. Le date non sono spostabili da questa vista. Quando Commesse è abilitato, un'attività apre la scheda di origine.

La chat riconosce richieste al Pianificatore e restituisce un riepilogo deterministico con intervallo esplicito; per filtri temporali e dettagli si usa la schermata. Nessun modello AI è necessario. GET /api/planner è di sola lettura e verifica attivazione e ambiente. Verifica aggiuntiva: node scripts/verify-planner.mjs.

La vista iniziale del Pianificatore è ora Piano completo per operatore: Gantt raggruppato per persona, commessa e task, con tutti i gruppi inizialmente espansi. Comprende tutte le attività dei piani confermati, senza limitazione settimanale. Le ore riepilogate sono totali del piano. Il comando Periodo riattiva la selezione settimanale/mensile; Studio mantiene la vista delle commesse nel periodo. Filtri di persona, commessa e stato restano disponibili. Nessun piano viene modificato da queste scelte di visualizzazione.

## Sopralluoghi

Modulo generico `visits`, attivabile per ambiente. Accesso dalla navigazione Sopralluoghi e dalla scheda commessa. Ogni visita conserva data, luogo, partecipanti, obiettivo, osservazioni, decisioni e azioni. Le questioni delle visite precedenti compaiono come riferimenti storici da verificare; non sono copiate nelle nuove osservazioni. Partecipanti e azioni sono attualmente testo libero: nessuna assegnazione di task automatica.

La bozza del verbale è assemblata deterministicamente dai campi e dalle didascalie. Conferma esplicita e riapertura per revisione mantengono gli snapshot confermati. Una modifica o un nuovo allegato invalida la bozza precedente. La chat può elencare le visite; non analizza immagini.

Acquisizione tramite input fotocamera posteriore sui dispositivi compatibili oppure selezione multipla dalla galleria. JPEG/PNG/WebP, 8 MB per file, 30 foto per visita. Foto e metadati risiedono nel PostgreSQL del cliente; API allegati verifica ambiente e attivazione. Nessun upload privato in public/. La fotocamera reale va provata sul dispositivo e richiede i normali permessi del browser; la demo localhost non espone il servizio al telefono.

`node scripts/seed-visits-demo.mjs` inserisce due visite Ballroom con immagini fittizie generate da AI senza sovrascrivere visite preesistenti e attiva solo engineering. `node scripts/verify-visits.mjs` verifica upload/lettura, gating clienti, bozza/conferma/revisione e versioni concorrenti usando una visita temporanea poi rimossa. Migrazione: 005_site_visits.sql.

## Percorso della commessa

La scheda si apre sulla timeline verticale Percorso della commessa. Tutte le fasi restano visibili con assegnazioni, avanzamento e intervallo pianificato; task, documenti e sopralluoghi sono espandibili. Filtri Tutto, Documenti, Disegni, Sopralluoghi e Decisioni. Le fasi seguono il modello, gli eventi interni sono ordinati per data del documento/visita (non sono un consuntivo delle date pianificate).

Archivio documentale comune della commessa: un originale può essere associato a più fasi, a un task e a un sopralluogo senza duplicare i file. Ogni upload successivo crea una revisione conservando i precedenti file. L'aggiunta concorrente verifica l'ultima revisione conosciuta. Titolo, tipo e collegamenti del documento restano stabili; gli stati delle revisioni sono dichiarazioni manuali, non approvazioni tecniche automatiche. Per cambiare stato si registra una nuova revisione. Visite prive di fase e materiali generali compaiono in un gruppo dedicato; la fase di una visita si può scegliere nel pannello laterale.

Pannello laterale con fotografie, verbali e storico documentale. PDF renderizzati localmente con PDF.js (https://mozilla.github.io/pdf.js/examples/), immagini in anteprima; DWG, DXF, DOCX, XLSX, TXT e ZIP scaricabili. Gli allegati sono conservati in PostgreSQL e richiedono ambiente/commessa corretti e modulo Commesse attivo. Le visite e le foto sono incluse solo se Sopralluogo è attivo. Limite demo 8 MB per documento. Il pulsante Gestione e pianificazione mantiene disponibili Gantt, gestione task, sopralluoghi e diario.

Gli asset pubblici del lettore PDF (mai i documenti dei clienti) sono ricreati dai comandi predev/prebuild e ignorati da git. Migrazione 006_project_timeline.sql; seed idempotente node scripts/seed-timeline-demo.mjs con tre documenti e quattro revisioni PDF fittizie della Ballroom. Verifica di integrazione: node scripts/verify-timeline.mjs usa allegati temporanei e li rimuove dopo il collaudo.

## Laboratorio verbale: simulazione generativa senza chiave

Nel secondo sopralluogo Ballroom, Laboratorio del verbale mostra il Markdown standard e una personalizzazione per ambiente salvabile dal superuser locale. Per il confronto: MD vuoto significa italiano; salvare `Scrivi il verbale in spagnolo.` e scegliere Rigenera bozza simulata riproduce la variante spagnola. Sono due testi preparati nella chat, non chiamate AI eseguite al click; altre istruzioni restituiscono un messaggio esplicito invece di essere ignorate. La bozza resta da confermare e i task non vengono modificati.

Ogni simulazione conserva dati di provenienza, Markdown standard/personalizzato effettivo e output. Le bozze precedenti sono confrontabili e le conferme conservano anche la provenienza. Un'impronta delle annotazioni e degli allegati impedisce di riutilizzare testi preparati per dati differenti; anche le modifiche al Markdown standard invalidano i campioni. Modifiche a visita/foto o nuova bozza deterministica rimuovono la provenienza dalla bozza corrente, conservando lo storico.

Migrazione 007_visit_generation.sql. Preparazione dei due campioni sui dati verificati: `node --experimental-strip-types scripts/prepare-visit-simulations.mjs`. Verifica con visita temporanea: `node --experimental-strip-types scripts/verify-visit-generation.mjs`. Nessuna chiave API richiesta, nessun file o fotografia inviato dal demo a provider esterni.

## Ambiente personale e Second Brain

L'ambiente personal (Il mio ambiente) è separato dalle installazioni dei clienti. Comprende Consulenza e sviluppi, Scrittura e Agenda personale. Il selettore iniziale usa CLIENT_ID quando configurato; nel demo apre l'ambiente personale. Il provisioning `node scripts/seed-personal-workspace.mjs --activate` attiva Calendario, Commesse e Pianificatore e crea un responsabile Io e due modelli essenziali. Il seed conserva i modelli e i dati già modificati; --activate è un'opzione esplicita per le attivazioni. Non crea commesse o eventi fittizi.

Da Second Brain sono previste esclusivamente letture di sb2_users, sb2_author_profiles (solo identità autore), sb2_books, sb2_book_editions e sb2_events. Nessuna strategia, istruzione autoriale, task, vendita, finanza o magazzino viene importato. L'anagrafica pubblicazioni mostra titolo, autore, codice, genere, sinossi, stato editoriale, date originali, edizioni e ISBN. Le date parziali non vengono presentate come precise.

Per il collegamento aggiungere al .env.local esistente soltanto SECOND_BRAIN_DATABASE_URL (connessione PostgreSQL Supabase sorgente) e SECOND_BRAIN_USER_EMAIL (utente sb2_users da consultare). Gli esempi sono in .env.example; non sostituire DATABASE_URL, che resta il database di Agentic Tailor. Nessuna credenziale viene recuperata automaticamente dallo ZIP. Preferire un ruolo sorgente con soli permessi SELECT. Tutte le letture avvengono in transazioni READ ONLY, con parametri SQL e senza esecuzione di migrazioni o regole di aggiornamento del vecchio software. La sorgente reale non è stata verificata finché il collegamento non è configurato.

Il calendario unisce nella vista mensile gli eventi locali e gli eventi Second Brain, contrassegnati 2B e consultabili in sola lettura. I nuovi appuntamenti restano in Agentic Tailor; se la sorgente è configurata, il salvataggio verifica anche le sovrapposizioni esterne e si interrompe se la fonte non risponde. Non viene inventata una durata per gli eventi che hanno solo l'orario iniziale: le prenotazioni potenzialmente sovrapposte richiedono di completare la durata nella fonte originale. Non esiste sincronizzazione o copia permanente degli eventi.

Il workspace personale e l'API del collegamento richiedono attualmente il superuser di sviluppo locale; prima di pubblicare serve un'autenticazione reale. Gli ambienti dei clienti non possono consultare il connettore personale. Il backend FastAPI di Second Brain non viene avviato né richiamato: questo evita anche gli aggiornamenti automatici del suo calendario all'avvio.

## Migrazione a Supabase

### Pratiche personali migrate da Second Brain

Il 13 novembre 2026 sono state migrate nell'ambiente personale 5 pratiche, 15 attività e 8 appuntamenti. La sezione Pratiche permette di creare e modificare pratiche, attività, appuntamenti e note, con controllo delle modifiche concorrenti. Contesto, stati, scadenze e completamenti originali sono conservati. I 5 piani, i 2 messaggi e le 59 registrazioni originali restano consultabili nel diario: i piani storici non vengono eseguiti.

Gli appuntamenti delle pratiche sono gestiti dalle tabelle tailor_personal_case_* e compaiono in agenda con il contrassegno PR. Gli eventi sb2 delle pratiche migrate vengono esclusi dall'agenda per evitare doppioni. Le copie in Second Brain restano inalterate; le modifiche successive in 2B non vengono sincronizzate. Le pubblicazioni e gli altri eventi storici continuano a usare il collegamento in sola lettura descritto sopra.

Migrazione: `node scripts/migrate-second-brain-cases.mjs` mostra il piano; con `--apply` importa solo le pratiche non ancora migrate, conservando le modifiche native. Snapshot privato iniziale: data/backups/second-brain-cases-2026-11-13T12-48-20-590Z. Collaudo: `node --experimental-strip-types scripts/verify-personal-cases.mjs`, con server locale attivo; confronta i dati originali e verifica gestione, isolamento e calendario usando una pratica temporanea poi rimossa. Migrazione SQL: 008_personal_cases.sql.

Il trasferimento iniziale è stato eseguito e verificato il 13 novembre 2026: 19 tabelle tailor_*, record e allegati, conservando le tabelle sb2_* già presenti. DATABASE_URL ora punta a Supabase e LOCAL_DATABASE_URL conserva la connessione precedente. SECOND_BRAIN_SAME_DATABASE=true fa riutilizzare il medesimo pool per calendario e pubblicazioni. Se esiste un solo utente attivo Second Brain viene selezionato automaticamente; con più utenti occorre SECOND_BRAIN_USER_EMAIL. Non vengono lette strategie, vendite o finanze.

`npm run db:supabase:plan` confronta la sorgente locale conservata con la destinazione, senza scrivere. `npm run db:supabase:apply` importa soltanto quando non esistono tabelle tailor_*: una destinazione identica viene saltata; una differente blocca il trasferimento. Non sovrascrive né elimina le tabelle preesistenti. Durante la copia le scritture sulle tabelle sorgenti sono brevemente bloccate per mantenere uno snapshot coerente.

`npm run db:backup` salva la sorgente locale conservata, inclusi gli allegati, in data/backups. Questi file e le copie private della configurazione non vanno pubblicati. Il ripristino usa schema e dati PostgreSQL, senza proprietari o ACL della macchina locale. Importazione e abilitazione RLS/revoca accessi anon e authenticated avvengono nella stessa transazione; l'app usa connessioni server PostgreSQL. Queste protezioni impediscono accessi diretti via API Supabase, ma non sostituiscono l'autenticazione applicativa prima del deploy pubblico.

Una stringa Supabase Transaction pooler (porta 6543) viene adattata in memoria alla corrispondente Session pooler (5432) per la migrazione; il valore segreto non viene stampato. DATABASE_URL resta adatta al runtime configurato. Backup e manifest iniziali sono conservati sotto data/backups/supabase-2026-11-13T09-35-21-648Z. `node scripts/verify-supabase-migration.mjs` esegue il collaudo su un database temporaneo locale: richiede il permesso CREATEDB e non deve usare la destinazione Supabase come sorgente di test.

Per tornare al locale, il manutentore può reimpostare DATABASE_URL con LOCAL_DATABASE_URL e disattivare SECOND_BRAIN_SAME_DATABASE; dopo nuove scritture cloud il database locale non è più una copia aggiornata e non va riattivato senza riconciliazione. La separazione del demo pubblico dall'ambiente personale resta da completare prima di pubblicare su Vercel.

## Finanze personali

La sezione Finanze è riservata all'ambiente personale e al superuser locale. Dal 13 novembre 2026 gestisce nativamente i due conti provenienti da Second Brain, 26 rilevazioni del saldo, 4 movimenti e 36 registrazioni storiche (incluse quelle riferite a movimenti non più presenti). Snapshot originali e backup privato in data/backups/second-brain-finance-2026-11-13T13-07-52.494Z; integrazione dello storico generale nel backup delle 13-09-27.597Z. Le tabelle sb2 non vengono modificate.

Si aggiorna manualmente il saldo rilevato, con data e nota, e si aggiungono entrate positive e uscite negative previste. Ogni aggiornamento conserva lo storico. La previsione parte dal saldo più recente per data di rilevazione e somma tutti i movimenti ancora pianificati, anche scaduti, in ordine di data. Senza un saldo iniziale le proiezioni non vengono mostrate. Segna pagato/incassato conferma soltanto la registrazione e la toglie dalla previsione: non aggiorna il saldo reale e non invia operazioni alla banca. Occorre quindi segnare gli impegni eseguiti prima di registrare un saldo che già li comprende. Annulla previsione conserva il movimento nello storico.

Importi PostgreSQL numeric(18,2), trasferiti e validati come stringhe decimali. Un contatore di versione per conto protegge i salvataggi concorrenti. Le ricorrenze originali sono conservate come informazione: non vengono creati movimenti automatici. Nessuna sincronizzazione successiva con 2B. RLS e revoca dei ruoli pubblici sulle quattro nuove tabelle; autenticazione reale ancora necessaria prima della pubblicazione.

Migrazione SQL 010_personal_finance.sql. Analisi: node scripts/migrate-second-brain-finance.mjs; applicazione: stesso comando con --apply. Le riesecuzioni saltano i conti già migrati e non sovrascrivono l'operatività nativa; integrano solo eventuali registrazioni originali di audit non ancora conservate. Collaudo: node scripts/verify-personal-finance.mjs con server locale attivo; confronta i dati con la fonte e usa un conto temporaneo rimosso al termine.

### Espansione Finanze: conti e scadenziario

Pulsante Aggiungi conto con nome, codice univoco, tipo (corrente, risparmio, cassa, altro), valuta EUR/USD/GBP/CHF e saldo iniziale facoltativo. Creazione e saldo iniziale sono atomici. I riepiloghi e le proiezioni sono sempre del conto selezionato, senza sommare valute diverse.

Ogni previsione dispone di controparte, categoria, note e un collegamento facoltativo a una pratica o commessa dell'ambiente personale. Controparti e categorie si inseriscono liberamente e vengono riproposte come suggerimenti, anche fra conti dello stesso ambiente. I movimenti ancora previsti sono modificabili; eseguiti e annullati restano nello storico. Filtri per stato, testo, entrate/uscite, scadenza, categoria e collegamento. I filtri non alterano la base del saldo previsto, esplicitata nella pagina.

Migrazione 011_finance_details.sql additiva, senza modifica dei movimenti preesistenti. La funzione resta un modulo deterministico nel solo ambiente personale: attivazione come agente e distribuzione negli altri ambienti verranno implementate separatamente. Collaudo aggiuntivo: node scripts/verify-finance-expansion.mjs (crea e rimuove un conto e una commessa temporanei). L'audit della migrazione confronta le istantanee con il backup iniziale, senza pretendere che dati operativi e 2B restino sincronizzati.

Il banner introduttivo ripetuto è stato rimosso dal workspace comune. Lo stato del provider AI compare nel menu laterale, anche su mobile.

### Agente Finanze e attivazioni

Finanze è ora registrato nel catalogo degli agenti. La migrazione 012_finance_agent.sql lo attiva una sola volta nell'ambiente personal e lo disattiva negli altri ambienti demo. Le successive scelte dell'amministratore restano persistenti. Nuove installazioni e ambienti non attivati partono senza conti e senza accesso al modulo.

Conti, rilevazioni, movimenti, categorie e controparti sono isolati dal parametro client_id in tutte le query. I collegamenti verificano lo stesso ambiente; le chiavi esterne composite impediscono associazioni fra ambienti. Le pratiche personali esistono soltanto in personal; le commesse sono disponibili nel rispettivo ambiente. Disattivare Finanze nasconde l'accesso e blocca letture, scritture e personalizzazioni API, conservando i dati. Gli endpoint finanziari richiedono ancora il superuser locale fino all'introduzione dell'autenticazione reale.

Markdown base: agents/finance/instructions.md. Il pannello Istruzioni agente conserva personalizzazioni e versioni nel dato di stato del singolo ambiente, separatamente dal calendario. Al momento la chat offre consultazioni deterministiche di saldi e movimenti previsti; non esegue scritture o pagamenti. Le personalizzazioni vengono salvate, ma la riformulazione generativa è esplicitamente da integrare.

Collaudo: node scripts/verify-finance-agent.mjs verifica configurazione iniziale, attivazione temporanea di writer con conto di test, isolamento delle istruzioni e dei conti, routing della chat e conservazione alla disattivazione. Ripristina la configurazione iniziale e rimuove soltanto i dati di collaudo.

## Trasferimento del contesto Sigma nella commessa

La migrazione 013_project_context.sql introduce un dossier storico per commessa e appuntamenti nativi della commessa. Il trasferimento richiesto per SIGMA → SIGMA-CONS è stato eseguito con snapshot privato sotto data/backups/sigma-context-*. Il contesto integrale, 1 attività, 4 appuntamenti e 17 registrazioni storiche sono consultabili nella scheda Contesto e storico di SIGMA-CONS. Le attività dell'incarico concluso sono documentazione storica: non vengono inventate fasi o assegnazioni operative. Gli appuntamenti restano nell'agenda con il contrassegno CM; i due collegamenti finanziari sono stati riassociati alla commessa, aggiornando le versioni dei conti interessati.

La pratica originale conserva soltanto una copia tecnica di recupero e provenienza: converted_project_id la ritira da tutti gli elenchi operativi, compreso il cestino e il selettore finanziario, e ne impedisce modifiche. Le schermate della commessa leggono il dossier trasferito, senza dipendere dalla consultazione della pratica originale. Le copie originali degli eventi non vengono più incluse nell'agenda; la sorgente 2B resta esclusa per evitare duplicazioni. Il diario di SIGMA-DEV contiene il riferimento aggiornato al dossier di SIGMA-CONS.

Analisi: node scripts/transfer-sigma-context.mjs; applicazione con --apply. Operazione atomica, con backup, verifica strutturale e protezione dalle duplicazioni. Collaudo in sola lettura (salvo una nota esplicitamente respinta): node scripts/verify-sigma-context.mjs. Verifica payload e contesto, ritiro della pratica, eventi nativi senza duplicati, collegamenti finanziari e isolamento della commessa.

## Valore previsto e stato dichiarato delle fasi

Migrazione 014_project_value_phase_status.sql: valore previsto EUR opzionale della commessa (numeric(18,2), non negativo); fase con stato dichiarato opzionale, nota e versione indipendente. Nessun importo è stato inventato o precompilato per le commesse esistenti. Il campo è nella scheda commessa e nel relativo modulo, con variazioni registrate nel diario. Non genera automaticamente incassi, rate o fatture.

Nel percorso le fasi Da avviare sono evidenziate in ambra. Ogni fase dispone di selettore e Salva stato: Da avviare, In corso, In attesa, Completata, Non applicabile (motivo obbligatorio), oppure Automatico dai task. Stato dichiarato e stati dei task restano indipendenti; il percorso avverte se una fase è dichiarata completa ma ha ancora task aperti. Il controllo è disponibile anche in Gestione e pianificazione. Le scritture verificano ambiente, commessa, fase e versione, e vengono registrate nel diario.

Collaudo: node scripts/verify-project-value-phases.mjs usa una commessa temporanea e verifica importi, diario, ritorno allo stato automatico, concorrenza, isolamento e assenza di variazioni ai task; rimuove la commessa al termine.

## Gestione del percorso: rimozione, ripristino e trasferimento

Nella scheda commessa, Gestisci percorso permette di rimuovere il percorso in modo ripristinabile oppure trasferirlo a una commessa del medesimo ambiente senza modello, fasi o piani. Ogni azione richiede conferma nell'interfaccia e verifica le versioni delle commesse sul server; origine e destinazione vengono bloccate in ordine stabile nella transazione. Non modifica titolo, committente, valore, scadenza, contesto storico o finanze delle due commesse.

La rimozione conserva uno snapshot privato di fasi, task, modello, pianificazione e collegamenti nella tabella tailor_workflow_archives. I documenti con revisioni, le visite con foto/verbali e il diario restano nella commessa; vengono rimossi solo i collegamenti alle fasi/task archiviati. Il ripristino è consentito soltanto quando la commessa è priva di percorso e ripristina anche i collegamenti, con controllo dei riferimenti ancora presenti. Le versioni di fase e task aumentano per invalidare editor aperti prima della rimozione.

Il trasferimento sposta gli stessi identificativi di fasi e task, piani confermati e materiali effettivamente collegati: documenti associati a fasi/task, sopralluoghi associati a fasi, documenti delle visite trasferite e visite referenziate dai documenti trasferiti. La chiusura dei collegamenti include fotografie, revisioni e verbali senza duplicare file. Documenti e visite generali non collegati restano all'origine. Assegnazioni, stati e date pianificate si conservano: non viene ricalcolato un piano sulla scadenza della destinazione. Ricezione e trasferimento vengono registrati nei rispettivi diari. La commessa di origine torna senza percorso.

Migrazione 015_workflow_lifecycle.sql con RLS e revoca accessi pubblici sull'archivio. I vincoli esterni dei materiali sono differibili per aggiornare coerentemente i riferimenti compositi nella stessa transazione; restano tutti verificati al commit. Collaudo node scripts/verify-workflow-lifecycle.mjs: commesse e materiali temporanei, date e stati dopo ripristino, destinazione occupata, isolamento, spostamento di documenti multipli/visite/foto/verbali e conservazione dei materiali generali; pulizia dei soli dati di prova al termine.

## Task delle fasi e agenda personale

I task della copia di commessa sono modificabili per titolo, persona, stato, scadenza e note dal percorso (Modifica task), da Gestione e pianificazione e dall'agenda. I modelli non vengono modificati; titolo e variazioni sono registrati nel diario e la versione protegge gli editor concorrenti. La pianificazione mantiene i propri intervalli; una modifica del titolo aggiorna l'impronta dei futuri piani.

La migrazione 016_agenda_identity.sql associa il superuser locale al membro personal-owner tramite ID persistente, senza dedurre l'identità dal nome visualizzato. L'endpoint my-tasks è riservato all'ambiente personale e richiede Commesse e Calendario attivi. Restituisce solo i task aperti assegnati a quel membro nelle commesse operative (esclude Completata, Non acquisita, Annullata). La futura autenticazione reale dovrà fornire il collegamento all'identità effettiva.

TK indica attività informative che non bloccano prenotazioni. Le date pianificate, inclusive, hanno precedenza; senza piano si usa la scadenza. Senza entrambe il task compare in Da pianificare. I task non sono copiati in eventi: riassegnazione, completamento e trasferimento del percorso si riflettono alla lettura. Si possono modificare dall'elenco I miei task o dal riepilogo del giorno. Gli aggiornamenti delle fonti storiche e dei task sono indipendenti. Collaudo: node scripts/verify-task-agenda.mjs.

## Catalogo e archivio vendite dei libri

Il 13 novembre 2026 sono stati migrati nell'ambiente personale 27 libri, 25 edizioni e 321 registrazioni di vendita (1.006 copie). Catalogo e vendite sono ora letti da tailor_publications, tailor_publication_editions e tailor_book_sales, senza dipendere da letture runtime delle tabelle sb2 dei libri. Rimangono consultabili data, quantità, canale, formato e note; i dati sorgenti e gli identificativi esterni sono conservati negli snapshot. Nessun prezzo o incasso viene inventato, e il flag da inventario non avvia movimentazioni di magazzino. Non sono importate strategie o regole generative.

Migrazione 017_publications_sales.sql. Esecuzione: node scripts/migrate-book-sales.mjs; --apply esegue una sola copia atomica con backup privato e verifica. Manifest di importazione evita risincronizzazioni o duplicazioni. Backup iniziale: data/backups/book-sales-2026-11-13T14-49-24.399Z. I totali accanto ai titoli sono somme delle quantità originali, con suddivisione ebook/cartaceo/altri formati o non specificati; un libro senza vendite mostra zero. Il dettaglio contiene l'archivio filtrabile per canale e formato. L'archivio è consultabile: inserimento di nuove vendite e import futuri saranno aggiunti separatamente. RLS, revoca dei ruoli pubblici e accesso applicativo al solo superuser personale. Collaudo: node scripts/verify-book-sales.mjs.

Le attività editoriali di 2B non sono ancora migrate: lettura preliminare di 7 progetti e 61 task legati a libro/progetto, di cui 19 aperti e 42 completati. Due progetti sono associati a Peter: non unirli automaticamente. Valutare il riuso del motore commesse in una vista editoriale con collegamento al libro, ownership univoca dei task e storico generativo conservato senza riattivare piani automatici. Il calendario storico di 2B mantiene ancora il suo collegamento originale.

## Vendite modificabili e magazzino cartaceo

La lista libri mette prima lo stato promotion e ordina ciascun gruppo per copie vendute decrescenti, con titolo e ID come spareggio stabile. Le quantità vengono confrontate come interi esatti. Nella scheda del libro: Nuova vendita, Modifica vendita, Carica copie e Modifica carico. Formato/edizione, data, quantità, canale e note sono modificabili; una nuova edizione priva di metadati noti viene registrata come Da precisare, senza inventare ISBN o date di pubblicazione.

Migrazioni 018_book_sale_editing.sql e 019_book_stock.sql. Il magazzino importato da 2B gestisce solo paperback (cartaceo in brossura): 6 carichi originali per 59 copie. Backup privato: data/backups/book-stock-2026-11-13T17-47-41.920Z. Script node scripts/migrate-book-stock.mjs --apply, con manifest anti-duplicazione. I carichi e le vendite da inventario già importati non vengono duplicati o scaricati nuovamente: disponibilità = somma dei carichi meno somma delle vendite da magazzino. Le vendite esterne non influiscono sul magazzino.

Il server blocca la riga libro durante vendite e carichi per verificare la giacenza nella stessa transazione. La modifica di una vendita considera anche lo scarico precedente, evitando doppi conteggi; cambiare da vendita da magazzino a esterna restituisce la disponibilità. Sono rifiutati giacenze negative, vendite da magazzino di formati diversi da paperback, edizioni di altri libri, quantità non intere/non positive e versioni obsolete. Gli ID delle nuove registrazioni sono stabili per il tentativo: un reinvio identico non duplica i dati. Snapshot sorgenti originali conservati, audit separato di ogni aggiornamento. Nessuna operazione bancaria e nessuna copia scritta in 2B.

Verifiche: node scripts/verify-book-movements.mjs usa libri temporanei e collauda creazione, modifiche, formato, carichi, giacenze, idempotenza, concorrenza, audit e isolamento; pulisce solo le proprie fixture. node scripts/verify-book-sales.mjs confronta gli snapshot con i backup e i totali attuali con i dati operativi, consentendo modifiche native successive alla migrazione.

### Elenco per autore e scheda libro modale

La lista pubblicazioni è divisa in due colonne, Flavio a sinistra e Cesare a destra, raggruppando per author_id persistente. Ogni colonna conserva l'ordinamento promozione/vendite; ricerca comune su titolo, codice, autore e ISBN. Le colonne restano affiancate nel pannello stretto, con contatori sotto il titolo. Ogni riga mostra copie vendute e giacenza cartacea disponibile, calcolate separatamente per evitare moltiplicazioni dovute alle edizioni.

Il clic sul titolo apre una finestra con autore, stato, dati editoriali e totali, più Nuova vendita e Carica copie con archivio modificabile. Le finestre di inserimento sono modali sopra la scheda e la loro chiusura non chiude il libro. Dopo un salvataggio, lista e intestazione della scheda si aggiornano senza perdere la selezione. Gli snapshot originali di 2B non vengono toccati. Verifica API estesa per confrontare la giacenza di ogni titolo con carichi e scarichi operativi; verifica UI di entrambe le colonne anche a larghezza ridotta e delle finestre annidate.

Le righe della bibliografia e la scheda separano vendite cartacee (brossura e copertina rigida) ed ebook. Gli altri formati o le vendite senza edizione nota restano esposti separatamente, senza inferenze. La giacenza indica sempre le copie cartacee in brossura del magazzino; il totale per ordinamento continua a comprendere tutte le copie registrate.

Marketing predisposto ma disattivato: strategie versionate, copia del Markdown di stile, attività collegate e integrazione agenda senza generazione o approvazione attive. Dettagli e limiti: docs/marketing-lifecycle.md. Migrazione 021 applicata; la simulazione Gabriella resta in bozza e non crea eventi.

Home personale: riepilogo Oggi e Resto della settimana fino a domenica, con fuso Europe/Rome. Riutilizza gli appuntamenti dell’agenda, il calendario storico, i task assegnati e le attività marketing approvate. Nessuna scrittura o generazione; fonti non raggiungibili segnalate come riepilogo parziale.
