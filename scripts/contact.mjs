const recipient='contact@cinelieu.com';
function confirmationMessage(reference,selection){
 const heading='Votre demande a bien été reçue';
 const nextStep='Notre équipe va examiner votre demande et vous répondra par e-mail.';
 const reply='Vous pouvez répondre à cet e-mail pour ajouter une précision.';
 const details=[['Numéro de demande',reference],...selection];
 const rows=details.map(([label,value])=>`
  <tr>
   <td style="padding:0 0 13px;font-size:13px;line-height:1.5;color:#42604c" class="receipt-muted">${label}<br>
    <strong style="font-size:16px;color:#172b1e" class="receipt-value">${value}</strong>
   </td>
  </tr>`).join('');
 return {
  displayName:'CINÉLIEU Studio',
  subject:'Demande reçue · '+reference+' — CINÉLIEU Studio',
  text:[
   heading,
   '',
   ...details.map(([label,value])=>label+' : '+value),
   '',
   nextStep,
   reply,
   '',
   'L’équipe CINÉLIEU Studio',
   'https://cinelieu.com/'
  ].join('\n'),
  html:`<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<style>
 @media (prefers-color-scheme:dark) {
  .receipt-bg{background:#111713!important}
  .receipt-card{background:#1b241e!important;color:#f6fbf7!important;border-color:#344b3b!important}
  .receipt-panel{background:#243529!important;border-color:#4c6b55!important}
  .receipt-muted,.receipt-link{color:#b9d7c2!important}
  .receipt-value{color:#f1faf3!important}
 }
</style>
</head>
<body class="receipt-bg" style="margin:0;background:#f2f5f2">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="receipt-bg" style="background:#f2f5f2">
 <tr><td align="center" style="padding:24px 12px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="receipt-card" style="width:100%;max-width:520px;background:#fff;color:#171717;border:1px solid #dce5de;border-radius:18px;font-family:Arial,sans-serif">
   <tr><td bgcolor="#1b1b1b" style="padding:19px 24px;border-top:3px solid #28cf66;border-radius:17px 17px 0 0;color:#ffffff">
    <table role="presentation" cellpadding="0" cellspacing="0">
     <tr>
      <td width="46" style="padding-right:12px"><img src="https://cinelieu.com/assets/logo-cinelieu-email.png" width="40" height="40" alt="" style="display:block;border:0;border-radius:10px"></td>
      <td style="font-size:19px;font-weight:bold;letter-spacing:-.4px;color:#fff">CINÉLIEU <span style="font-size:11px;font-weight:normal;letter-spacing:1.8px">STUDIO</span></td>
     </tr>
    </table>
   </td></tr>
   <tr><td style="padding:27px 24px 28px">
    <h1 style="margin:0 0 12px;font-size:29px;line-height:1.12;font-weight:700;letter-spacing:-.7px">${heading}.</h1>
    <p class="receipt-muted" style="margin:0 0 20px;font-size:16px;line-height:1.55;color:#414e45">${nextStep}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="receipt-panel" style="margin:0 0 19px;background:#edf8ef;border:1px solid #c9e4d1;border-left:4px solid #28cf66;border-radius:10px">
     <tr><td style="padding:14px 14px 1px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
     </td></tr>
    </table>
    <p class="receipt-muted" style="margin:0;font-size:14px;line-height:1.55;color:#414e45">${reply}</p>
   </td></tr>
   <tr><td style="padding:15px 24px 17px;border-top:1px solid #dce5de;font-size:13px;line-height:1.6">
    <a href="https://cinelieu.com/" class="receipt-link" style="color:#225739;text-decoration:underline;font-weight:bold">cinelieu.com</a>
   </td></tr>
  </table>
 </td></tr>
</table>
</body>
</html>`
 };
}
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
 const required={email:254,formule:20,token:2048};
 const optional={message:2000,besoin:20,telephone:32,annonce:1000,nom:100,entreprise:150};
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
  const reference='CNL-'+crypto.randomUUID().replaceAll('-','').slice(0,12).toUpperCase();
  const fields=[
   ['Numéro de demande',reference],
   ['E-mail',data.email],['Téléphone',data.telephone],['Nom',data.nom],['Entreprise',data.entreprise],
   ['Besoin',custom?topic:null],['Formule',custom?'Autre':topic],['Annonce',data.annonce]
  ];
  const summary=fields.filter(([,value])=>value).map(([label,value])=>label+' : '+value).join('\n');
  const text=data.message?summary+'\n\n'+data.message:summary;
  const sendMail=payload=>requestFetch('https://api.mail.hostinger.com/api/v1/mailboxes/'+encodeURIComponent(env.HOSTINGER_MAILBOX_ID)+'/send',{
   method:'POST',headers:{Authorization:'Bearer '+env.HOSTINGER_MAIL_TOKEN,'Content-Type':'application/json'},
   body:JSON.stringify(payload),
   signal:AbortSignal.timeout(8500)
  });
  const send=await sendMail({to:[recipient],displayName:'CINÉLIEU Studio – Formulaire',subject:'Demande '+reference+' — '+topic,text});
  if(!send.ok)return failure('Le service de messagerie ne répond pas. Réessayez.',502);
  const selection=custom?[['Formule','Autre'],['Besoin',topic]]:[['Formule',topic]];
  const confirmationSent=await sendMail({...confirmationMessage(reference,selection),to:[data.email]})
   .then(result=>result.ok,()=>false);
  return response({ok:true,reference,confirmationSent});
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
