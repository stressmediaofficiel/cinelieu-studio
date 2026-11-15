import assert from 'node:assert/strict';
import {test} from 'node:test';
import worker, {contact} from './contact.mjs';
const env={HOSTINGER_MAIL_TOKEN:'test',HOSTINGER_MAILBOX_ID:'test-box',TURNSTILE_SITE_KEY:'site',TURNSTILE_SECRET_KEY:'secret'};
const good={nom:'Camille',entreprise:'Agence',email:'camille@example.test',formule:'essentiel',message:'Une vidéo pour une villa.',consentement:'oui',token:'token'};
function post(payload,origin='https://example.test'){return new Request('https://example.test/api/contact',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(payload)})}
test('aucune simulation de réussite sans configuration',async()=>{
 assert.deepEqual(await (await contact(new Request('https://example.test/api/contact'),{})).json(),{enabled:false,siteKey:null});
 assert.equal((await contact(post(good),{})).status,503);
});
test('origine tierce, robot et demande invalide refusés sans appel externe',async()=>{
 const never=()=>assert.fail('appel externe inattendu');
 assert.equal((await contact(post(good,'https://other.test'),env,never)).status,403);
 assert.equal((await contact(post({...good,website:'spam'}),env,never)).status,400);
 assert.equal((await contact(post({...good,email:'incorrect'}),env,never)).status,400);
});
test('un jeton d’un autre site ne permet pas l’envoi',async()=>{
 const r=await contact(post(good),env,async()=>Response.json({success:true,hostname:'other.test'}));assert.equal(r.status,403);
});
test('le fournisseur reçoit le destinataire fixe et les données validées',async()=>{
 const sent=[];
 const r=await contact(post({...good,formule:'signature',telephone:'+33 6 01 02 03 04',annonce:'example.test/chalet',to:'not-allowed@example.test'}),env,async(url,init)=>{
  if(url.includes('turnstile'))return Response.json({success:true,hostname:'example.test',action:'contact'});
  sent.push(JSON.parse(init.body));return new Response(null,{status:204});
 });
 assert.equal(r.status,200);
 const {ok,reference,confirmationSent}=await r.json();
 assert.ok(ok&&confirmationSent);
 assert.match(reference,/^CNL-[0-9A-F]{12}$/);
 for(const message of sent){
  assert.ok(message.subject.includes(reference));
  assert.ok(message.text.includes('Numéro de demande : '+reference));
 }
 assert.deepEqual(sent[0].to,['contact@cinelieu.com']);assert.match(sent[0].text,/E-mail : camille@example\.test/);assert.match(sent[0].text,/Signature \(99 €\)/);assert.match(sent[0].text,/https:\/\/example\.test\/chalet/);assert.match(sent[0].text,/\+33 6/);
 assert.deepEqual(sent[1].to,[good.email]);assert.match(sent[1].text,/Votre demande a bien été reçue/);assert.match(sent[1].text,/Formule : Signature \(99 €\)/);assert(!sent[1].text.includes(good.message));assert(!sent[1].html.includes(good.message));
});
test('une demande sans description déclenche les deux e-mails',async()=>{
 const {message,...payload}=good;
 const sent=[];
 const r=await contact(post(payload),env,async(url,init)=>{
  if(url.includes('turnstile'))return Response.json({success:true,hostname:'example.test',action:'contact'});
  sent.push(JSON.parse(init.body));
  return new Response(null,{status:204});
 });
 assert.equal(r.status,200);
 const {reference,confirmationSent}=await r.json();
 assert.equal(confirmationSent,true);
 assert.equal(sent.length,2);
 assert.match(sent[0].text,/Formule : Essentiel \(69 €\)$/);
 assert.ok(sent[1].text.includes(reference));
 assert.ok(sent[1].html.includes(reference));
 assert.match(sent[1].html,/Essentiel \(69 €\)/);
 assert.match(sent[1].html,/logo-cinelieu-email\.png/);
});
test('un rejet du fournisseur est rapporté comme une erreur sans envoyer de confirmation',async()=>{
 let attempts=0;
 const r=await contact(post(good),env,async(url)=>{
  if(url.includes('turnstile'))return Response.json({success:true,hostname:'example.test',action:'contact'});
  attempts++;
  return new Response('',{status:503});
 });
 assert.equal(r.status,502);assert.equal((await r.json()).ok,false);
 assert.equal(attempts,1);
});
test('un échec de confirmation conserve le succès de la demande transmise',async()=>{
 const r=await contact(post(good),env,async(url,init)=>{
  if(url.includes('turnstile'))return Response.json({success:true,hostname:'example.test',action:'contact'});
  if(JSON.parse(init.body).to[0]===good.email)throw Error('timeout');
  return new Response(null,{status:204});
 });
 const {ok,reference,confirmationSent}=await r.json();
 assert.equal(ok,true);
 assert.equal(confirmationSent,false);
 assert.match(reference,/^CNL-[0-9A-F]{12}$/);
});
test('le besoin personnalisé est requis uniquement pour Autre',async()=>{
 const never=()=>assert.fail('appel externe inattendu');
 assert.equal((await contact(post({...good,formule:'autre'}),env,never)).status,400);
 let sent;
 const provider=async(url,init)=>{
  if(url.includes('turnstile'))return Response.json({success:true,hostname:'example.test',action:'contact'});
  const payload=JSON.parse(init.body);
  if(payload.to[0]==='contact@cinelieu.com')sent=payload;
  return new Response(null,{status:204});
 };
 assert.equal((await contact(post({...good,formule:'autre',besoin:'pack'}),env,provider)).status,200);
 assert.match(sent.text,/Besoin : Des vidéos pour plusieurs biens/);
 assert.match(sent.text,/Formule : Autre/);
 assert.equal((await contact(post({...good,besoin:'pack'}),env,provider)).status,200);
 assert.doesNotMatch(sent.text,/Besoin :/);
});
test('l’ancienne adresse redirige vers le domaine public en conservant le chemin et la requête',async()=>{
 const redirect=await worker.fetch(new Request('https://cinelieu-studio.pages.dev/mentions-legales?ref=email'),{});
 assert.equal(redirect.status,301);
 assert.equal(redirect.headers.get('Location'),'https://cinelieu.com/mentions-legales?ref=email');
 const assets={fetch:request=>new Response(request.url)};
 const current=await worker.fetch(new Request('https://cinelieu.com/'),{ASSETS:assets});
 assert.equal(await current.text(),'https://cinelieu.com/');
});
