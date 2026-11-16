import {pool} from './store';
import {ready} from './projects-store';
import {validateMarketingDraft,marketingDate,revisionImpact,type MarketingPlan} from './marketing-domain';
import {marketingCapability,requireMarketingExecution} from './marketing-policy';

function uuid(v:unknown):asserts v is string{if(typeof v!=='string'||!/^[0-9a-f-]{36}$/i.test(v))throw Error('Libro non valido.');}
export async function marketingBook(client:string,bookId:string){
 await ready();uuid(bookId);const c=await pool().connect();try{await c.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
 const book=(await c.query('SELECT title,author_id FROM tailor_publications WHERE client_id=$1 AND id=$2',[client,bookId])).rows[0];if(!book)throw Error('Libro non trovato.');
 const strategy=(await c.query("SELECT * FROM tailor_marketing_strategies WHERE client_id=$1 AND subject_kind='book' AND subject_id=$2",[client,bookId])).rows[0]??null;
 const revisions=strategy?(await c.query("SELECT revision,state,reason,to_char(effective_on,'YYYY-MM-DD') AS \"effectiveOn\",plan,style_markdown AS \"styleMarkdown\",identity_version,brief_version,origin,created_at FROM tailor_marketing_revisions WHERE client_id=$1 AND strategy_id=$2 ORDER BY revision DESC",[client,strategy.id])).rows:[];
 const activities=strategy?(await c.query("SELECT id,revision,item_key AS key,to_char(scheduled_on,'YYYY-MM-DD') AS date,channel,title,body,state,cancellation_reason,version FROM tailor_marketing_activities WHERE client_id=$1 AND strategy_id=$2 ORDER BY scheduled_on,id",[client,strategy.id])).rows:[];
 const identity=(await c.query('SELECT markdown,version FROM tailor_author_identities WHERE client_id=$1 AND author_id=$2',[client,book.author_id])).rows[0]??null;
 await c.query('COMMIT');return {capability:marketingCapability(),strategy,revisions,activities,identity};
 }catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
}
export async function marketingCommand(client:string,b:Record<string,unknown>,actor:string){
 const action=b.action;if(!['draft','approve','reject'].includes(String(action)))throw Error('Azione marketing non valida.');
 // Protezione server: nessuna approvazione, rifiuto operativo o agenda finché il modulo è sospeso.
 if(action!=='draft')requireMarketingExecution();
 await ready();uuid(b.bookId);if(!Number.isInteger(b.version)||Number(b.version)<0)throw Error('Versione non valida.');
 const draft=action==='draft'?validateMarketingDraft(b):null;
 const c=await pool().connect();try{await c.query('BEGIN');
 const book=(await c.query('SELECT title,author_id FROM tailor_publications WHERE client_id=$1 AND id=$2 FOR UPDATE',[client,b.bookId])).rows[0];if(!book)throw Error('Libro non trovato.');
 let strategy=(await c.query("SELECT * FROM tailor_marketing_strategies WHERE client_id=$1 AND subject_kind='book' AND subject_id=$2 FOR UPDATE",[client,b.bookId])).rows[0];
 if((strategy?.version??0)!==b.version)throw Error('Strategia aggiornata: ricarica prima di procedere.');
 if(!strategy){if(!draft)throw Error('Strategia non trovata.');strategy=(await c.query("INSERT INTO tailor_marketing_strategies(id,client_id,subject_kind,subject_id,title) VALUES($1,$2,'book',$3,$4) RETURNING *",[crypto.randomUUID(),client,b.bookId,book.title])).rows[0];}
 let revision:number;
 if(draft){
 const pending=await c.query("SELECT revision FROM tailor_marketing_revisions WHERE client_id=$1 AND strategy_id=$2 AND state='draft'",[client,strategy.id]);if(pending.rowCount)throw Error('Esiste già una bozza: conservarla o decidere prima di proporre una nuova versione.');
 const identity=(await c.query('SELECT version FROM tailor_author_identities WHERE client_id=$1 AND author_id=$2',[client,book.author_id])).rows[0];if(!identity)throw Error('Collegare prima l’identità autoriale.');
 const brief=(await c.query('SELECT version FROM tailor_book_briefs WHERE client_id=$1 AND book_id=$2',[client,b.bookId])).rows[0];if(!brief)throw Error('Compilare prima la scheda libro.');
 revision=(await c.query('SELECT COALESCE(MAX(revision),0)+1 AS next FROM tailor_marketing_revisions WHERE client_id=$1 AND strategy_id=$2',[client,strategy.id])).rows[0].next;
 await c.query("INSERT INTO tailor_marketing_revisions(client_id,strategy_id,revision,state,reason,effective_on,plan,style_markdown,identity_version,brief_version,origin) VALUES($1,$2,$3,'draft',$4,$5,$6,$7,$8,$9,'chat-simulation')",[client,strategy.id,revision,draft.reason,draft.effectiveOn,draft.plan,draft.styleMarkdown,identity.version,brief.version]);
 }else{
 if(!Number.isInteger(b.revision))throw Error('Revisione non valida.');revision=Number(b.revision);
 const row=(await c.query("SELECT *,to_char(effective_on,'YYYY-MM-DD') AS date FROM tailor_marketing_revisions WHERE client_id=$1 AND strategy_id=$2 AND revision=$3 FOR UPDATE",[client,strategy.id,revision])).rows[0];if(!row||row.state!=='draft')throw Error('Questa revisione è già stata decisa o non esiste.');
 if(action==='approve'){
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Rome',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());if(row.date<today)throw Error('La decorrenza è passata: preparare una revisione aggiornata prima di pianificare.');
 const plan=row.plan as MarketingPlan;validateMarketingDraft({effectiveOn:row.date,reason:row.reason,styleMarkdown:row.style_markdown,plan});
 const existing=(await c.query("SELECT id,to_char(scheduled_on,'YYYY-MM-DD') AS date,state FROM tailor_marketing_activities WHERE client_id=$1 AND strategy_id=$2 FOR UPDATE",[client,strategy.id])).rows;
 const impact=revisionImpact(existing,plan,row.date);
 await c.query("UPDATE tailor_marketing_activities SET state='cancelled',cancellation_reason=$3,version=version+1 WHERE client_id=$1 AND strategy_id=$2 AND id=ANY($4::uuid[])",[client,strategy.id,'Sostituita dalla revisione '+revision,impact.cancel]);
 for(const x of plan.items)await c.query("INSERT INTO tailor_marketing_activities(id,client_id,strategy_id,revision,item_key,scheduled_on,channel,title,body) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)",[crypto.randomUUID(),client,strategy.id,revision,x.key,x.date,x.channel,x.title,x.body]);
 await c.query("UPDATE tailor_marketing_revisions SET state='superseded' WHERE client_id=$1 AND strategy_id=$2 AND state='approved'",[client,strategy.id]);
 await c.query('UPDATE tailor_marketing_strategies SET active_revision=$3 WHERE client_id=$1 AND id=$2',[client,strategy.id,revision]);
 }
 await c.query('UPDATE tailor_marketing_revisions SET state=$4,decided_at=now(),decided_by=$5 WHERE client_id=$1 AND strategy_id=$2 AND revision=$3',[client,strategy.id,revision,action==='approve'?'approved':'rejected',actor]);
 }
 await c.query('UPDATE tailor_marketing_strategies SET version=version+1 WHERE client_id=$1 AND id=$2',[client,strategy.id]);
 await c.query('INSERT INTO tailor_marketing_audit(id,client_id,strategy_id,action,payload,actor) VALUES($1,$2,$3,$4,$5,$6)',[crypto.randomUUID(),client,strategy.id,String(action),{revision},actor]);
 await c.query('COMMIT');return {ok:true,revision};
 }catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
}

export async function marketingAgenda(client:string,start:string,end:string){
 await ready();marketingDate(start);marketingDate(end);if(start>end)throw Error('Intervallo non valido.');
 // Una volta approvate, le attività sono dati persistenti: rimangono consultabili anche senza provider.
 return (await pool().query("SELECT a.id,a.strategy_id AS \"strategyId\",a.revision,to_char(a.scheduled_on,'YYYY-MM-DD') AS date,a.channel,a.title,a.body,a.state,s.title AS \"strategyTitle\" FROM tailor_marketing_activities a JOIN tailor_marketing_strategies s ON s.client_id=a.client_id AND s.id=a.strategy_id WHERE a.client_id=$1 AND a.scheduled_on BETWEEN $2 AND $3 AND a.state NOT IN ('cancelled','published') ORDER BY a.scheduled_on,a.id",[client,start,end])).rows;
}
