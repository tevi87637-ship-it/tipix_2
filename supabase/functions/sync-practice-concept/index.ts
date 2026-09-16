import {createClient} from 'npm:@supabase/supabase-js@2.116.0';
const origin='https://tipix-learning-phase-one.vvreddy1584.chatgpt.site';
const headers={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS','Content-Type':'application/json','Vary':'Origin'};
Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 const reply=(status:number,data:unknown)=>new Response(JSON.stringify(data),{status,headers});
 if(req.method!=='POST')return reply(405,{error:'POST required'});
 const authorization=req.headers.get('Authorization');
 if(!authorization?.startsWith('Bearer '))return reply(401,{error:'Sign in required'});
 if(Number(req.headers.get('Content-Length')||0)>4096)return reply(413,{error:'Request too large'});
 const client=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_ANON_KEY')!,{global:{headers:{Authorization:authorization}},auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user},error:authError}=await client.auth.getUser(authorization.slice(7));
 if(authError||!user?.email_confirmed_at)return reply(401,{error:'Verified sign-in required'});
 let body:Record<string,unknown>;
 try{const raw=await req.text();if(raw.length>4096)return reply(413,{error:'Request too large'});body=JSON.parse(raw);if(!body||Array.isArray(body)||typeof body!=='object')throw new Error();}catch{return reply(400,{error:'JSON object required'});}
 if(!['health','scope','all'].includes(String(body.mode))||Object.keys(body).some(k=>!['mode','concept_id'].includes(k)))return reply(400,{error:'Use health, scope or all mode'});
 if(body.mode==='scope'&&!(typeof body.concept_id==='string'&&/^[0-9a-f-]{36}$/i.test(body.concept_id)))return reply(400,{error:'Valid concept_id required'});
 // Caller JWT is forwarded, never replaced by a service key. The RPC checks the private staff role,
 // rate-limits sync and records unavailable feeds. It will not fabricate content on provider failure.
 const {data,error}=await client.rpc('academic_api',{op:'sync',payload:body});
 if(error)return reply(error.code==='42501'?403:400,{error:error.message});
 return reply(200,data);
});
