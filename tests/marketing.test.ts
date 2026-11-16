import {test} from 'node:test';import assert from 'node:assert/strict';
import {validateMarketingDraft,revisionImpact} from '../lib/marketing-domain.ts';
const input={effectiveOn:'2027-02-01',reason:'Invito al Rotary',styleMarkdown:'# Voce\nConcreta, riflessiva, senza slogan.',plan:{summary:'Revisione per la presentazione',items:[{key:'evento',date:'2027-02-12',channel:'Facebook',title:'Invito',body:'Testo completo da rivedere.'}]}};
test('revisioni marketing: obbligo stile, date reali e chiavi univoche',()=>{
 assert.equal(validateMarketingDraft(input).styleMarkdown,input.styleMarkdown);
 for(const x of [{...input,styleMarkdown:''},{...input,effectiveOn:'2027-02-30'},{...input,effectiveOn:'2027-03-01'},{...input,plan:{...input.plan,items:[...input.plan.items,...input.plan.items]}}])assert.throws(()=>validateMarketingDraft(x));
});
test('riposizionamento: annulla soltanto aperte dalla decorrenza, conserva passato e pubblicate',()=>{
 const existing=[{id:'passata',date:'2027-01-31',state:'todo'},{id:'oggi',date:'2027-02-01',state:'ready'},{id:'futura',date:'2027-03-01',state:'todo'},{id:'pubblicata',date:'2027-03-02',state:'published'},{id:'annullata',date:'2027-03-03',state:'cancelled'}];
 const impact=revisionImpact(existing,validateMarketingDraft(input).plan,'2027-02-01');assert.deepEqual(impact.cancel,['oggi','futura']);assert.deepEqual(impact.preserve,['passata','pubblicata','annullata']);assert.equal(impact.create,1);
});
