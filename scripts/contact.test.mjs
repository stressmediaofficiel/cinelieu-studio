import assert from 'node:assert/strict';
import {test} from 'node:test';
import worker, {contact} from './contact.mjs';
const env={CONTACT_FROM:'Studio <test@example.test>',RESEND_API_KEY:'test',TURNSTILE_SITE_KEY:'site',TURNSTILE_SECRET_KEY:'secret'};
const good={nom:'Camille',entreprise:'Agence',email:'camille@example.test',besoin:'unité',message:'Une vidéo pour une villa.',consentement:'oui',token:'token'};
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
 let sent;
 const r=await contact(post({...good,to:'not-allowed@example.test'}),env,async(url,init)=>{
  if(url.includes('turnstile'))return Response.json({success:true,hostname:'example.test'});
  sent=JSON.parse(init.body);return Response.json({id:'fake-for-test'});
 });
 assert.equal(r.status,200);assert.deepEqual(sent.to,['cinelieupro@gmail.com']);assert.equal(sent.reply_to,good.email);
});
test('un rejet du fournisseur est rapporté comme une erreur',async()=>{
 const r=await contact(post(good),env,async(url)=>url.includes('turnstile')?Response.json({success:true,hostname:'example.test'}):new Response('',{status:503}));
 assert.equal(r.status,502);assert.equal((await r.json()).ok,false);
});
test('l’ancienne adresse redirige vers le domaine public en conservant le chemin et la requête',async()=>{
 const redirect=await worker.fetch(new Request('https://cinelieu-studio.pages.dev/mentions-legales?ref=email'),{});
 assert.equal(redirect.status,301);
 assert.equal(redirect.headers.get('Location'),'https://cinelieu.com/mentions-legales?ref=email');
 const assets={fetch:request=>new Response(request.url)};
 const current=await worker.fetch(new Request('https://cinelieu.com/'),{ASSETS:assets});
 assert.equal(await current.text(),'https://cinelieu.com/');
});
