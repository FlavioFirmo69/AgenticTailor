# Accesso agli ambienti

L'amministratore è l'email confermata configurata in ADMIN_EMAIL. Gli account dei clienti usano Supabase Auth e una voce attiva in tailor_workspace_access, che associa l'email confermata al solo ambiente autorizzato. La tabella è privata, con RLS e senza accesso diretto per anon/authenticated.

Per abilitare un cliente, creare l'utente confermato da Supabase Authentication e inserire l'associazione sul database tramite un operatore amministrativo. Le password restano in Supabase Auth. Non esistono registrazione pubblica o elevazione di privilegi dal browser. Disattivare active revoca l'accesso applicativo anche alle sessioni già aperte, dalla richiesta successiva.

Pagina principale e API verificano l'identità sul server con getUser. Il selettore mostra solo gli ambienti autorizzati. Le API personali e di amministrazione restano riservate all'amministratore.

Esci chiude la sessione del browser corrente, cancella i cookie Supabase e forza il login anche durante lo sviluppo locale. Negli altri browser le sessioni restano attive. Il superuser automatico locale resta disponibile solo nei browser che non hanno ancora effettuato login/logout; AUTH_REQUIRE_LOGIN=true lo disabilita completamente. In produzione il bypass locale è sempre escluso.

Verifiche: npm test; npm run build; impostare TEST_STUDIO_EMAIL su un account già abilitato allo studio tecnico ed eseguire node node_modules/tsx/dist/cli.mjs scripts/verify-account-access.mjs. Quest'ultima usa Auth simulato e le API effettive con le autorizzazioni del database, senza password reali. Il login reale richiede una verifica manuale da parte del titolare delle credenziali.
