export function localDemoAllowed(environment:string|undefined,onVercel:boolean,hostname:string,forceLogin=false){return environment==='development'&&!onVercel&&!forceLogin&&['localhost','127.0.0.1','[::1]'].includes(hostname);}
export function allowedAdmin(user:{email?:string;email_confirmed_at?:string}|null,adminEmail:string|undefined){return Boolean(user?.email&&user.email_confirmed_at&&adminEmail?.trim()&&user.email.toLowerCase()===adminEmail.trim().toLowerCase());}

export type Account={email:string;admin:boolean;clients:string[]};
export function accountCanAccess(account:Account|null,client:string){return Boolean(account&&(account.admin||account.clients.includes(client)));}
