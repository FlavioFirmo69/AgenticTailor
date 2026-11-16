# GitHub e Vercel

Repository: `FlavioFirmo69/AgenticTailor`, pubblico per scelta del proprietario. La cartella locale del repository è `C:\Sorgenti\AgenticTailor`; su Vercel la Root Directory è la radice, non `outputs/agent-studio`.

## Dati e segreti

I dati attivi sono in PostgreSQL su Supabase, incluse le tabelle `sb2_*` storiche. Non occorre migrare nuovamente il database per distribuire il frontend/server Next.js. Alcuni task 2B non sono ancora esposti nell'area operativa di Agentic. Asset statici e configurazioni di codice sono nel repository; backup e documenti operativi locali non vengono distribuiti.

Nessun file `.env*`, backup `data/`, cache o credenziale viene versionato. Le variabili di Vercel sono configurate separatamente per Production e, se desiderato, Preview. Il database non è accessibile direttamente dal browser.

Variabili server:

- `DATABASE_URL`: connessione PostgreSQL del database esistente. Preferire una connessione pooler Supabase compatibile con il runtime Vercel. Non usare `localhost`.
- `SECOND_BRAIN_SAME_DATABASE=true`: lettura delle tabelle storiche nel database attivo. `SECOND_BRAIN_DATABASE_URL` non serve.
- `ADMIN_EMAIL`: unica email autorizzata; deve corrispondere a un utente Supabase Auth confermato.
- `SECOND_BRAIN_USER_EMAIL`: necessaria solo se le tabelle storiche contengono più utenti attivi e la selezione non è univoca.

Variabili pubbliche di autenticazione:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: chiave pubblicabile del medesimo progetto; mai `service_role`, chiavi segrete o password PostgreSQL.

Lasciare `CLIENT_ID` non impostata per l'istanza personale con selettore degli ambienti demo. Non caricare `LOCAL_DATABASE_URL` o `SUPABASE_MIGRATION_URL` in produzione. Le chiavi AI non sono necessarie; Marketing resta disattivato anche dopo la pubblicazione.

## Accesso

`proxy.ts` protegge pagine e API online; gli handler verificano nuovamente la sessione. Supabase SSR gestisce cookie di sessione, rinnovo e logout. `getUser()` verifica l'identità presso Supabase; non viene autorizzato il semplice contenuto di un cookie non verificato. Solo l'email amministratore configurata e confermata può accedere. Nessuna funzione di registrazione pubblica è esposta.

L'autenticazione automatica locale vale esclusivamente per NODE_ENV=development, host localhost e assenza di VERCEL. `AUTH_REQUIRE_LOGIN=true` permette di richiedere il login anche in sviluppo. In produzione, se la configurazione manca o Supabase Auth non risponde, l'accesso resta negato.

Creare il proprio utente da Supabase Dashboard → Authentication → Users, scegliendo la password fuori dalla chat. La password non è una variabile dell'app e non viene archiviata in Agentic. Il login password non richiede redirect email; eventuali flussi di recupero password o magic link non sono ancora implementati.

## Distribuzione

1. Verificare `npm test` e `npm run build`.
2. Collegare il repository al progetto Vercel con framework Next.js, installazione da lockfile e build standard.
3. Configurare le variabili per l'ambiente scelto. Una modifica delle variabili richiede una nuova distribuzione.
4. Verificare senza sessione: pagina `/` reindirizzata a `/login`, API rifiutate e nessun dato personale nella risposta.
5. Effettuare il login con il proprio utente, verificare lettura e un salvataggio autorizzato, quindi logout e nuovo controllo delle API.

La configurazione Next include esplicitamente migrazioni SQL e istruzioni Markdown nelle funzioni server. Nessuna dipendenza operativa da file fuori repository; lo script opzionale di rigenerazione del catalogo valvole richiede invece l'estrazione DWG locale originale.

## Aggiornamenti

Con l'integrazione GitHub, ogni push sul ramo di produzione attiva una nuova distribuzione. Le modifiche al codice non sostituiscono i dati Supabase. In questa prima istanza protetta l'amministratore può accedere a tutti gli ambienti demo: non è ancora un portale clienti con ruoli separati.
