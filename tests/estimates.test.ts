import {test} from 'node:test';
import assert from 'node:assert/strict';
import {estimateSummary,validateEstimate,validateHoursPerDay} from '../lib/estimates-domain.ts';
const phases=[{title:'Fase',tasks:[{title:'Richiesta',role:'Socio',required:true,estimate:{type:'fixed' as const,value:16}},{title:'Lavoro',role:'Progettista',required:true,estimate:{type:'percent' as const,value:90}}]}];
test('fisse e percentuali del totale: quadratura e scostamenti senza normalizzazione',()=>{const s=estimateSummary(phases,20,8);assert.equal(s.budget,160);assert.equal(s.total,160);assert.equal(s.balance,0);assert.equal(estimateSummary(phases,10,8).balance,-8);assert.equal(estimateSummary(phases,40,8).balance,16);});
test('stima disegno 30% corrisponde a 48 ore su 160',()=>{const p=[{title:'Disegno',tasks:[{title:'Tavole',role:'Progettista',required:true,estimate:{type:'percent' as const,value:30}}]}];assert.equal(estimateSummary(p,20,8).total,48);});
test('stime e parametri validati',()=>{assert.throws(()=>validateEstimate({type:'percent',value:101}));assert.throws(()=>validateEstimate({type:'fixed',value:-1}));assert.throws(()=>validateEstimate({type:'fixed',value:NaN}));assert.throws(()=>validateEstimate({type:'fixed',value:.001}));assert.throws(()=>validateHoursPerDay(0));assert.throws(()=>estimateSummary(phases,0,8));});
