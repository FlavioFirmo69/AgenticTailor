export function money(value:unknown,nonzero=false){
 if(typeof value!=='string'||! /^-?\d{1,16}([.,]\d{1,2})?$/.test(value.trim()))throw Error('Importo non valido: usa al massimo due decimali.');
 const normalized=value.trim().replace(',','.');const [whole,fraction='']=normalized.replace('-','').split('.');const cents=BigInt(whole)*100n+BigInt(fraction.padEnd(2,'0'));if(nonzero&&cents===0n)throw Error('L’importo deve essere diverso da zero.');return (normalized.startsWith('-')&&cents!==0n?'-':'')+BigInt(whole).toString()+'.'+fraction.padEnd(2,'0');
}
export function financeDate(value:unknown){if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(Date.parse(value))||new Date(value).toISOString().slice(0,10)!==value)throw Error('Data non valida.');return value;}
export function financeText(value:unknown,max=500){if(typeof value!=='string'||!value.trim()||value.length>max)throw Error('Descrizione non valida.');return value.trim();}
export function optionalFinanceText(value:unknown,max:number){return value==null||value===''?'':financeText(value,max);}
export function validateAccount(b:Record<string,unknown>){const code=financeText(b.code,40).toUpperCase();if(!/^[A-Z0-9][A-Z0-9_-]*$/.test(code))throw Error('Codice conto: usa lettere, numeri, trattini e underscore.');const name=financeText(b.name,180),currency=financeText(b.currency,3).toUpperCase();if(!['EUR','USD','GBP','CHF'].includes(currency))throw Error('Valuta non supportata.');const type=String(b.accountType);if(!['current','savings','cash','other'].includes(type))throw Error('Tipo conto non valido.');return {code,name,currency,type};}
export function sumMoney(values:string[]){let total=0n;for(const v of values){const x=money(v);total+=BigInt(x.replace('.',''));}const abs=total<0n?-total:total;return (total<0n?'-':'')+(abs/100n).toString()+'.'+(abs%100n).toString().padStart(2,'0');}

export function requireFinance(s:{enabledAgents?:string[]}){if(!s.enabledAgents?.includes('finance'))throw Error('Finanze non attivo per questo ambiente.');}
export function isFinanceRequest(text:string){return /\b(finanz\w*|sald[oi]|cont[oi] corrent\w*|liquidit[aà]|incass\w*|pagament\w*|uscite|entrate|scadenziario)\b/i.test(text);}

export function isBalanceTotalRequest(text:string){
 if(/\b(?:previst[oi]|proiettat[oi]|futur[oi])\b/i.test(text))return false;
 const total=/\b(?:somma|total[ei]|complessiv[oa]|in tutto)\b/i.test(text);
 const balances=/\b(?:saldi|liquidit[aà](?!\p{L}))/iu.test(text)||(/\bsaldo\b/i.test(text)&&/\bconti\b/i.test(text));
 return total&&balances||/\bquanto\s+(?:ho|abbiamo)\b.*\bconti\b/i.test(text);
}

export type AccountBalance = {name:string;currency:string;balance:string|null};

export function summarizeAccountBalances(accounts:AccountBalance[]){
 const byCurrency=new Map<string,string[]>();
 const missing:string[]=[];
 for(const account of accounts){
  if(account.balance===null){missing.push(account.name);continue;}
  const amounts=byCurrency.get(account.currency)??[];
  amounts.push(account.balance);
  byCurrency.set(account.currency,amounts);
 }
 const totals=[...byCurrency].sort(([a],[b])=>a.localeCompare(b)).map(([currency,amounts])=>({currency,balance:sumMoney(amounts)}));
 return {totals,missing};
}

export function balanceTotalAnswer(accounts:AccountBalance[]):string {
 if(!accounts.length)return 'Non ci sono conti attivi registrati in questo ambiente.';
 const {totals,missing}=summarizeAccountBalances(accounts);
 const summary=totals.length
  ? [missing.length?'Totale parziale dei saldi rilevati':'Totale dei saldi rilevati',...totals.map(({balance,currency})=>balance.replace('.',',')+' '+currency)].join('\n')
  : 'Nessun saldo rilevato per i conti attivi.';
 return missing.length?summary+'\n\nConti senza saldo rilevato: '+missing.join(', ')+'.':summary;
}
