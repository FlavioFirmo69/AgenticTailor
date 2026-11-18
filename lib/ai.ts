function providerConfig(){
 for(const prefix of ['LLM','AI']){
  const baseUrl=process.env[prefix+'_BASE_URL']?.trim().replace(/^https\\:/i,'https:').replace(/\/+$/,'');
  const model=process.env[prefix+'_MODEL']?.trim();
  const apiKey=process.env[prefix+'_API_KEY']?.trim();
  if(baseUrl&&model&&apiKey)return {baseUrl,model,apiKey};
 }
}

export const aiReady=()=>Boolean(providerConfig());
export function aiQuotaUrl():string|undefined{
 const config=providerConfig();
 if(config&&/^https:\/\/generativelanguage\.googleapis\.com\//i.test(config.baseUrl))return 'https://aistudio.google.com/rate-limit';
}

export async function generate(system:string,history:{role:string;text:string}[]):Promise<string>{
 const config=providerConfig();
 if(!config)throw Error('Il provider AI non è configurato.');
 const response=await fetch(config.baseUrl+'/chat/completions',{
  method:'POST',
  headers:{'Content-Type':'application/json',Authorization:'Bearer '+config.apiKey},
  body:JSON.stringify({model:config.model,messages:[{role:'system',content:system},...history.slice(-10).map(m=>({role:m.role,content:m.text}))]}),
  signal:AbortSignal.timeout(45000)
 });
 if(!response.ok)throw Error('Il provider AI non è disponibile. Riprova più tardi.');
 const data=await response.json();
 const content=data.choices?.[0]?.message?.content;
 if(typeof content!=='string'||!content.trim())throw Error('Risposta AI non valida.');
 return content;
}
