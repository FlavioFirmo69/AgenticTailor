import {test} from 'node:test';
import assert from 'node:assert/strict';
import {consultingIntent,consultingSummary,consultingSwitchTaskId,findConsultingProject,recentConsultingProject,switchDate} from '../lib/consulting-chat.ts';
import type {WorkPhase,WorkTask} from '../lib/workflow-domain.ts';

const project={id:'fruit',code:'FRUITMIGRAZIONE',title:'Spostare Business e Fruit sul nuovo server',status:'In attesa' as const};
test('identifica la commessa aperta dal codice anche con la frase colloquiale originale',()=>{
 const query=consultingIntent('com è la situazione di Fruitmigrazione?');
 assert.deepEqual(query,{kind:'status',name:'Fruitmigrazione'});
 assert.deepEqual(findConsultingProject('Fruit migrazione',[project]),project);
 assert.equal(findConsultingProject('Fruit',[project,{...project,id:'other',code:'FRUIT2'}]),undefined);
 assert.equal(findConsultingProject('FRUITMIGRAZIONE',[{...project,status:'Completata'}]),undefined);
});

test('switch richiede una data valida e il riferimento al più recente riepilogo',()=>{
 const input=consultingIntent('Fissato lo switch in data 15/12/2026');
 assert.equal(input?.kind,'switch');
 assert.equal(switchDate(input?.kind==='switch'?input.details:''),'2026-12-15');
 assert.equal(switchDate(' 2026-12-15.'),'2026-12-15');
 assert.equal(switchDate(' in data 30/02/2027'),undefined);
 assert.equal(switchDate(' non il 2026-12-15 ma il 2026-12-16'),undefined);
 const answer={id:'1',role:'assistant' as const,agent:'consulting',consultingProjectId:'fruit',text:''};
 assert.equal(recentConsultingProject([answer]),'fruit');
 assert.equal(recentConsultingProject([answer,{id:'2',role:'assistant',agent:'finance',text:''}]),undefined);
});

test('riepilogo per fase include solo task ancora aperti',()=>{
 const task=(title:string,status:WorkTask['status']):WorkTask=>({id:title,title,status,assigneeId:null,expectedRole:'',required:false,dueDate:null,note:'',version:1});
 const phase={id:'p',title:'Trasferimento',position:1,tasks:[task('Attività aperta','In attesa'),task('Attività chiusa','Completato'),task('Ignorata','Non applicabile')]} as WorkPhase;
 const summary=consultingSummary(project,[phase],'2026-12-15');
 assert.match(summary,/Trasferimento\n• Attività aperta · In attesa/);
 assert.match(summary,/Switch fissato per il 2026-12-15/);
 assert.doesNotMatch(summary,/Attività chiusa|Ignorata/);
});

test('il riferimento allo switch compare sul task univoco e non indovina fra più task',()=>{
 const task={id:'switch-date',title:'Fissare data switch'};
 assert.equal(consultingSwitchTaskId([{id:'other',title:'Contabilizzazione Fruit'},task]),task.id);
 assert.equal(consultingSwitchTaskId([{id:'2',title:'Fissare la data dello switch'},task]),undefined);
 assert.equal(consultingSwitchTaskId([{id:'other',title:'Verificare lo switch'}]),undefined);
});
