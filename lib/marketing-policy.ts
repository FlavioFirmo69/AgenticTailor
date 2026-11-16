import {aiReady} from './ai';
// Attivazione deliberata dopo collegamento e verifica del flusso LLM. Una chiave non basta.
export function marketingCapability(){return {enabled:false as boolean,llmConfigured:aiReady(),reason:'Marketing disattivato: in attesa del collegamento LLM e della verifica del flusso. Bozze consultabili, nessuna attività pianificata.'};}
export function requireMarketingExecution(){const c=marketingCapability();if(!c.enabled||!c.llmConfigured)throw Error(c.reason);}
