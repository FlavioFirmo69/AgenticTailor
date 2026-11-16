# Agentic Tailor
Un repository comune, distribuzioni e database separati per cliente. Il selettore clienti è esclusivamente dimostrativo.
Gli agenti combinano istruzioni Markdown e strumenti deterministici. Nessuna istruzione concede permessi.
Tenere motore, dominio e persistenza indipendenti dalla UI. Validare gli strumenti sul server.
Per aggiungere un agente: definire capacità, implementare servizi deterministici, registrare il routing, aggiungere Markdown e verifiche di dominio. Dichiarare separatamente le capacità simulate.
Non importare automaticamente dati, credenziali o personalizzazioni dai vecchi progetti.
Non leggere o stampare file .env. Non versionare data/, node_modules/ e .next/.
Verifica: npm test e npm run build.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

Modelli, persone, fasi e task appartengono al singolo ambiente: ogni query e ogni assegnazione devono verificare client_id. I task istanziati sono copie indipendenti del modello versionato. Non sovrascrivere i dati demo modificati dall'utente nei successivi seed.
