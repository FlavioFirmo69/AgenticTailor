export function bookSalesPeriod(input:{month?:string;start?:string;end?:string}){
 if(input.start!==undefined||input.end!==undefined){
  const {start,end}=input;for(const d of [start,end])if(typeof d!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(d)||!Number.isFinite(Date.parse(d))||new Date(d).toISOString().slice(0,10)!==d)throw Error('Seleziona una data iniziale e finale valide.');
  if(end!<start!)throw Error('La data finale deve essere successiva o uguale a quella iniziale.');return {start:start!,end:end!};
 }
 const month=input.month;if(!month||!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)||month<'0001-01')throw Error('Mese non valido.');
 const end=new Date(month+'-01T12:00:00Z');end.setUTCMonth(end.getUTCMonth()+1);end.setUTCDate(0);return {start:month+'-01',end:end.toISOString().slice(0,10)};
}
