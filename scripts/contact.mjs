const recipient='marcbrioche.agence@gmail.com';
const choices={aperçu:'Aperçu de mon bien',unité:'Vidéo à l’unité',pack:'Pack professionnel','sur-mesure':'Accompagnement sur mesure',autre:'Autre demande'};
const response=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const failure=(error,status=400)=>response({ok:false,error},status);
const ready=env=>!!(env.CONTACT_FROM&&env.RESEND_API_KEY&&env.TURNSTILE_SECRET_KEY&&env.TURNSTILE_SITE_KEY);
async function readBounded(request,limit=14000){
 const reader=request.body?.getReader();if(!reader)throw Error();
 const chunks=[];let bytes=0;
 while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.length;if(bytes>limit){await reader.cancel();throw Error()}chunks.push(value)}
 const buffer=new Uint8Array(bytes);let i=0;for(const x of chunks){buffer.set(x,i);i+=x.length}
 return JSON.parse(new TextDecoder().decode(buffer));
}
export async function contact(request,env,requestFetch=fetch){
 const url=new URL(request.url);
 if(request.method==='GET')return response({enabled:ready(env),siteKey:ready(env)?env.TURNSTILE_SITE_KEY:null});
 if(request.method!=='POST')return failure('Méthode non autorisée.',405);
 if(request.headers.get('origin')!==url.origin)return failure('Origine non autorisée.',403);
 if(!ready(env))return failure('L’envoi direct est indisponible. Contactez-nous par e-mail.',503);
 if(!request.headers.get('content-type')?.startsWith('application/json'))return failure('Format de demande incorrect.',415);
 let raw;
 try{raw=await readBounded(request)}catch{return failure('Demande invalide ou trop longue.')}
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||raw.website||raw.consentement!=='oui')return failure('Vérifiez les champs et le consentement.');
 const data={};
 for(const [key,max] of Object.entries({nom:100,entreprise:150,email:254,besoin:20,message:2000,token:2048})){
  if(typeof raw[key]!=='string')return failure('Complétez tous les champs.');
  const value=raw[key].trim();if(!value||value.length>max)return failure('Un champ est incomplet ou trop long.');
  data[key]=value;
 }
 if(!Object.hasOwn(choices,data.besoin)||!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(data.email))return failure('Adresse e-mail ou besoin invalide.');
 try{
  const verify=await requestFetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body:new URLSearchParams({secret:env.TURNSTILE_SECRET_KEY,response:data.token}),signal:AbortSignal.timeout(6500)});
  const result=await verify.json();
  if(!verify.ok||!result.success||result.hostname!==url.hostname)return failure('La vérification antispam a expiré. Réessayez.',403);
  const send=await requestFetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+env.RESEND_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({
   from:env.CONTACT_FROM,to:[recipient],reply_to:data.email,subject:'Demande CINÉLIEU — '+choices[data.besoin],
   text:['Nom : '+data.nom,'Entreprise : '+data.entreprise,'E-mail : '+data.email,'Besoin : '+choices[data.besoin],'',data.message].join('\n')
  }),signal:AbortSignal.timeout(8500)});
  if(!send.ok)return failure('Le service de messagerie ne répond pas. Réessayez.',502);
  return response({ok:true});
 }catch{return failure('Le service de messagerie est momentanément indisponible.',502)}
}
export default {fetch(request,env){return new URL(request.url).pathname==='/api/contact'?contact(request,env):env.ASSETS.fetch(request)}};
