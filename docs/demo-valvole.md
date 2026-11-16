# Demo catalogo e configuratore valvole

Percorso locale: `/demo/valvole`.

Fonte grafica: esclusivamente i tredici blocchi con “valvola” nel nome di `legenda nuova-REV01.dwg`, fornito dall'utente. Il lettore LibreDWG ha prodotto l'inventario. Lo script `scripts/build-valve-demo.mjs` converte linee, archi e polilinee 2D in anteprime, discretizzando gli archi. Nessun simbolo è copiato da un testo normativo non accessibile, nessuna geometria è inventata da un LLM. La selezione iniziale è la valvola a sfera.

Funzioni: scelta visuale; attributi proposti TIPO, CODICE, DN, PN, DESCRIZIONE; aggiunta, modifica e rimozione di attributi; visibilità dell'etichetta in anteprima; esportazione JSON della scheda con geometria e SVG dell'anteprima. Modifiche isolate in memoria per componente, nessuna scrittura a database o al DWG. Il pulsante di salvataggio DWG è disabilitato. Non è un dimensionatore né un generatore di geometrie dimensionali.

I campi sono proposte per il processo Sigma, non requisiti tratti dalla norma. CODICE è obbligatorio solo per l'esportazione del demo. I tag sono univoci, iniziano con una lettera e ammettono lettere ASCII, numeri e underscore. Le stringhe esportate in XML sono escapate. Il riferimento nel catalogo è la definizione del blocco, non un inserimento specifico.

## Riferimenti ufficiali verificati il 15 novembre 2026

- [UNI 9511-1:1989](https://store.uni.com/uni-9511-1-1989): in vigore, per segni grafici negli schemi di impianti idrici e scarico, riscaldamento, refrigerazione, condizionamento e gas domestico. È il riferimento di ambito individuato per questo esempio; la conformità dei singoli simboli non è stata verificata sul testo integrale.
- [UNI EN ISO 10628-2:2013](https://store.uni.com/uni-en-iso-10628-2-2013): in vigore; riguarda l'industria chimica e petrolchimica, ambito distinto dal precedente.
- [ISO 14617-2:2025 nel catalogo UNI](https://store.uni.com/iso-14617-2-2025): in vigore dal 25 aprile 2025, libreria generale di simboli industriali. Non va rinominata “UNI EN ISO” senza un recepimento verificato.
- [ISO 14617-8:2002](https://www.iso.org/standard/33386.html?browse=ics): sostituita dalla ISO 14617-2:2025; non viene proposta come edizione corrente.

Sono state consultate le schede pubbliche dei cataloghi. Il testo integrale delle norme non è stato acquistato né riprodotto. Per una libreria presentata come conforme occorre confrontare simboli e regole di applicazione con una copia autorizzata della norma pertinente. Il demo mantiene esplicita la provenienza Sigma e la verifica ancora da svolgere.
