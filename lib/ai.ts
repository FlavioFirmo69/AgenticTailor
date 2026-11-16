export const aiReady=()=>Boolean(process.env.AI_API_KEY&&process.env.AI_BASE_URL&&process.env.AI_MODEL);
export async function generate(system:string,history:{role:string;text:string}[]):Promise<string>{
 const response=await fetch(process.env.AI_BASE_URL!.replace(/\/$/,'')+'/chat/completions',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${process.env.AI_API_KEY}`},body:JSON.stringify({model:process.env.AI_MODEL,messages:[{role:'system',content:system},...history.slice(-10).map(m=>({role:m.role,content:m.text}))]}),signal:AbortSignal.timeout(45000)});
 if(!response.ok)throw Error('Il provider AI non è disponibile. Riprova più tardi.');const data=await response.json();const content=data.choices?.[0]?.message?.content;if(typeof content!=='string'||!content.trim())throw Error('Risposta AI non valida.');return content;
}
