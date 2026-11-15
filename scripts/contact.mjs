const recipient='contact@cinelieu.com';
export const confirmationMessage={
 displayName:'CINÉLIEU Studio',
 subject:'Votre demande a bien été reçue — CINÉLIEU Studio',
 text:[
  'Bonjour,',
  '',
  'Merci pour votre message. Votre demande a bien été reçue par CINÉLIEU Studio.',
  'Notre équipe reviendra vers vous dans les meilleurs délais pour échanger sur votre projet.',
  '',
  'Si vous souhaitez ajouter une précision, vous pouvez répondre directement à cet e-mail.',
  '',
  'À bientôt,',
  'L’équipe CINÉLIEU Studio',
  'https://cinelieu.com/'
 ].join('\n')
};
const choices={pack:'Des vidéos pour plusieurs biens','sur-mesure':'Un projet sur mesure',autre:'Une question / autre demande'};
const plans={essentiel:'Essentiel (69 €)',signature:'Signature (99 €)',prestige:'Prestige (149 €)'};
const response=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const failure=(error,status=400)=>response({ok:false,error},status);
const ready=env=>!!(env.HOSTINGER_MAIL_TOKEN&&env.HOSTINGER_MAILBOX_ID&&env.TURNSTILE_SECRET_KEY&&env.TURNSTILE_SITE_KEY);
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
 const required={email:254,formule:20,message:2000,token:2048};
 const optional={besoin:20,telephone:32,annonce:1000,nom:100,entreprise:150};
 for(const [key,max] of Object.entries({...required,...optional})){
  const value=raw[key]??'';
  if(typeof value!=='string')return failure('Vérifiez les champs de votre demande.');
  data[key]=value.trim();
  if(data[key].length>max||(!data[key]&&Object.hasOwn(required,key)))return failure('Un champ est incomplet ou trop long.');
 }
 if(!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(data.email))return failure('Vérifiez votre adresse e-mail.');
 const custom=data.formule==='autre';
 if(!custom&&!Object.hasOwn(plans,data.formule))return failure('Choisissez une formule proposée ou Autre.');
 if(custom&&!['pack','sur-mesure','autre'].includes(data.besoin))return failure('Sélectionnez votre besoin.');
 const topic=custom?choices[data.besoin]:plans[data.formule];
 if(data.telephone&&(!/^\+?[0-9(). -]+$/.test(data.telephone)||data.telephone.replace(/\D/g,'').length<6))return failure('Vérifiez le numéro de téléphone.');
 if(data.annonce){
  try{
   const address=new URL(/^[a-z][a-z0-9+.-]*:/i.test(data.annonce)?data.annonce:'https://'+data.annonce);
   if(!['http:','https:'].includes(address.protocol)||!address.hostname.includes('.')||address.username||address.password)throw Error();
   data.annonce=address.href;
  }catch{return failure('Vérifiez le lien de l’annonce.')}
 }
 try{
  const verify=await requestFetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body:new URLSearchParams({secret:env.TURNSTILE_SECRET_KEY,response:data.token}),signal:AbortSignal.timeout(6500)});
  const result=await verify.json();
  if(!verify.ok||!result.success||result.hostname!==url.hostname||result.action!=='contact')return failure('La vérification antispam a expiré. Réessayez.',403);
  const fields=[
   ['E-mail',data.email],['Téléphone',data.telephone],['Nom',data.nom],['Entreprise',data.entreprise],
   ['Besoin',custom?topic:null],['Formule',custom?'Autre':topic],['Annonce',data.annonce]
  ];
  const text=fields.filter(([,value])=>value).map(([label,value])=>label+' : '+value)
   .concat('',data.message).join('\n');
  const sendMail=payload=>requestFetch('https://api.mail.hostinger.com/api/v1/mailboxes/'+encodeURIComponent(env.HOSTINGER_MAILBOX_ID)+'/send',{
   method:'POST',headers:{Authorization:'Bearer '+env.HOSTINGER_MAIL_TOKEN,'Content-Type':'application/json'},
   body:JSON.stringify(payload),
   signal:AbortSignal.timeout(8500)
  });
  const send=await sendMail({to:[recipient],displayName:'CINÉLIEU Studio – Formulaire',subject:'Demande CINÉLIEU — '+topic,text});
  if(!send.ok)return failure('Le service de messagerie ne répond pas. Réessayez.',502);
  const confirmationSent=await sendMail({...confirmationMessage,to:[data.email]})
   .then(result=>result.ok,()=>false);
  return response({ok:true,confirmationSent});
 }catch{return failure('Le service de messagerie est momentanément indisponible.',502)}
}
export default {
 fetch(request,env){
  const url=new URL(request.url);
  if(url.hostname==='cinelieu-studio.pages.dev'){
   url.protocol='https:';
   url.host='cinelieu.com';
   url.port='';
   return Response.redirect(url,301);
  }
  return url.pathname==='/api/contact'?contact(request,env):env.ASSETS.fetch(request);
 }
};
