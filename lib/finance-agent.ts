import {readFile} from 'node:fs/promises';import path from 'node:path';import {finance,latestAccountBalances} from './finance-store';import {balanceTotalAnswer,isBalanceTotalRequest,sumMoney} from './finance-domain';
export const financeBase=()=>readFile(path.join(process.cwd(),'agents/finance/instructions.md'),'utf8');
export async function financeAnswer(client:string,text:string){
 if(isBalanceTotalRequest(text))return balanceTotalAnswer(await latestAccountBalances(client));
 const first=await finance(client);if(!first.accounts.length)return 'Non ci sono conti registrati in questo ambiente. Apri Finanze per aggiungere il primo conto.';
 const matched=first.accounts.filter(a=>text.toLocaleLowerCase('it').includes(a.code.toLocaleLowerCase('it'))||text.toLocaleLowerCase('it').includes(a.name.toLocaleLowerCase('it')));
 const accounts=matched.length?matched:first.accounts;const lines:string[]=[];
 for(const a of accounts){const d=a.id===first.selected?.id?first:await finance(client,a.id),balance=d.balances[0],planned=d.transactions.filter(t=>t.status==='planned');lines.push(a.name+' · '+a.currency+'\nSaldo rilevato: '+(balance?balance.balance+' al '+balance.date:'non disponibile')+'\nSaldo dopo tutti gli impegni: '+(balance?sumMoney([balance.balance,...planned.map(t=>t.amount)]):'non disponibile'));
 if(/incass|pagament|previst|uscite|entrate|scadenziario/i.test(text)){const movements=planned.filter(t=>/pagament|uscite/i.test(text)&&!/incass|entrate/i.test(text)?t.amount.startsWith('-'):/incass|entrate/i.test(text)&&!/pagament|uscite/i.test(text)?!t.amount.startsWith('-'):true);lines.push(movements.length?movements.slice(0,15).map(t=>`${t.date} · ${t.description} · ${t.amount} ${a.currency}`).join('\n')+(movements.length>15?`\nAltri ${movements.length-15} movimenti nello scadenziario.`:''):'Nessun movimento previsto per questa selezione.');}}
 return lines.join('\n\n')+'\n\nConsultazione dei dati registrati. Per inserire o modificare dati apri Finanze; la chat non esegue operazioni bancarie.';
}

export {requireFinance,isFinanceRequest,isBalanceTotalRequest} from './finance-domain';
