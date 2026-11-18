import {test} from 'node:test';import assert from 'node:assert/strict';import {money,financeDate,financeText,sumMoney,validateAccount,requireFinance,isFinanceRequest,isBalanceTotalRequest,balanceTotalAnswer} from '../lib/finance-domain.ts';
test('importi monetari senza arrotondamenti binari e con due decimali',()=>{assert.equal(money('9999999999999999,99'),'9999999999999999.99');assert.equal(money('-50,5'),'-50.50');assert.equal(money('001.2'),'1.20');assert.equal(money('-0'),'0.00');for(const v of ['1.999','1e4','Infinity','NaN','1.000,10',5,'10000000000000000'])assert.throws(()=>money(v));assert.throws(()=>money('0',true));});
test('finanze: date e descrizioni validate',()=>{assert.equal(financeDate('2028-02-29'),'2028-02-29');assert.throws(()=>financeDate('2026-02-29'));assert.equal(financeText(' Incasso '),'Incasso');assert.throws(()=>financeText(' '));});

test('somma importi esatta e totale oltre la precisione dei singoli movimenti',()=>{assert.equal(sumMoney(['1000.10','-100.01','50.02']),'950.11');assert.equal(sumMoney(['9999999999999999.99','0.01']),'10000000000000000.00');assert.equal(sumMoney(['-0.01','-0.02']),'-0.03');});
test('conto: codice stabile, tipo e valuta controllati',()=>{const a={code:'conto_pro',name:'Professionale',accountType:'current',currency:'eur'};assert.equal(validateAccount(a).code,'CONTO_PRO');for(const patch of [{code:'con spazi'},{name:''},{accountType:'invalid'},{currency:'ZZZ'}])assert.throws(()=>validateAccount({...a,...patch}));});

test('Finanze richiede attivazione e intercetta le richieste pertinenti',()=>{assert.throws(()=>requireFinance({enabledAgents:['calendar']}));assert.doesNotThrow(()=>requireFinance({enabledAgents:['finance']}));for(const text of ['Mostra i saldi','Quali pagamenti ho previsti?','Incassi previsti','Il mio conto corrente'])assert.equal(isFinanceRequest(text),true);assert.equal(isFinanceRequest('Quali sono i monumenti di Roma?'),false);});

test('la somma dei saldi usa importi esatti, valute separate e segnala i saldi mancanti',()=>{
 assert.equal(isBalanceTotalRequest('Qual è la somma dei saldi dei miei conti?'),true);
 assert.equal(isBalanceTotalRequest('Quanto ho sui miei conti?'),true);
 assert.equal(isBalanceTotalRequest('Mostra i saldi dei miei conti'),false);
 assert.equal(isBalanceTotalRequest('Somma dei saldi previsti'),false);
 assert.equal(isBalanceTotalRequest('Saldo totale del conto corrente'),false);
 assert.equal(balanceTotalAnswer([
  {name:'Conto A',currency:'EUR',balance:'0.10'},
  {name:'Conto B',currency:'EUR',balance:'0.20'},
  {name:'Conto C',currency:'USD',balance:'-4.55'},
  {name:'Conto D',currency:'EUR',balance:null}
 ]),'Totale parziale dei saldi rilevati\n0,30 EUR\n-4,55 USD\n\nConti senza saldo rilevato: Conto D.');
});
