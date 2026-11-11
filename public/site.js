const $=(s,root=document)=>root.querySelector(s), $$=(s,root=document)=>[...root.querySelectorAll(s)];
const reduced=matchMedia('(prefers-reduced-motion: reduce)'), mouse=matchMedia('(hover:hover) and (pointer:fine)');
const nav=$('.nav-links'),toggle=$('.menu-toggle');
function menu(open){nav.classList.toggle('open',open);toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Fermer le menu':'Ouvrir le menu');$('use',toggle).setAttribute('href',open?'#close':'#menu')}
toggle.addEventListener('click',()=>menu(!nav.classList.contains('open')));
nav.addEventListener('click',e=>{if(e.target.closest('a'))menu(false)});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav.classList.contains('open')){menu(false);toggle.focus()}});
document.addEventListener('pointerdown',e=>{if(nav.classList.contains('open')&&!e.target.closest('.nav'))menu(false)});
if('IntersectionObserver'in window){
 const io=new IntersectionObserver(entries=>entries.forEach(({target,isIntersecting})=>{if(isIntersecting){target.classList.add('visible');io.unobserve(target)}}),{threshold:.1,rootMargin:'0px 0px -14px'});
 if(!reduced.matches){
  $$('[data-words]').forEach(h=>{
   let i=0;
   [...h.childNodes].filter(n=>n.nodeType===Node.TEXT_NODE).forEach(n=>{
    const f=document.createDocumentFragment();
    n.textContent.split(/(\s+)/u).forEach(word=>{
     if(!word.trim())f.append(word);
     else{const span=document.createElement('span');span.className='word';span.style.setProperty('--word',i++);span.textContent=word;f.append(span)}
    });n.replaceWith(f);
   });
  });
  document.documentElement.classList.add('motion');
  $$('[data-reveal]').forEach(el=>io.observe(el));
 }
}
const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
let tick=0;
const progress=$('.progress'),timeline=$('.timeline');
function scrollEffects(){
 tick=0;
 const doc=document.documentElement,ratio=clamp(scrollY/Math.max(1,doc.scrollHeight-innerHeight),0,1);
 const rect=reduced.matches?null:timeline.getBoundingClientRect();
 progress.style.transform='scaleX('+ratio+')';
 if(rect)timeline.style.setProperty('--timeline',clamp((innerHeight*.76-rect.top)/Math.max(1,rect.height),0,1));
}
function queue(){if(!tick)tick=requestAnimationFrame(scrollEffects)}
addEventListener('scroll',queue,{passive:true});addEventListener('resize',queue,{passive:true});queue();

const mediaFrames=new Map($$('[data-film-frame]').map(frame=>{
 const video=$('[data-flow-video]',frame),state={video,visible:false,active:false};
 video.addEventListener('playing',()=>{
  if(state.active)frame.classList.add('is-playing');
  else video.pause();
 });
 video.addEventListener('error',()=>frame.classList.remove('is-playing'));
 return [frame,state];
}));
function syncVideo(frame,state){
 const {video}=state,active=state.visible&&!reduced.matches&&!document.hidden;
 if(state.active===active)return;
 state.active=active;
 if(!active){video.pause();frame.classList.remove('is-playing');return}
 if(!video.getAttribute('src'))video.src=video.dataset.src;
 else if(video.readyState)video.currentTime=0;
 video.play().catch(()=>{});
}
function syncVideos(){for(const [frame,state] of mediaFrames)syncVideo(frame,state)}
if('IntersectionObserver'in window){
 const films=new IntersectionObserver(entries=>entries.forEach(({target,intersectionRatio})=>{
  const state=mediaFrames.get(target);
  if(intersectionRatio>=.5)state.visible=true;
  else if(intersectionRatio<=.15)state.visible=false;
  syncVideo(target,state);
 }),{threshold:[.15,.5]});
 for(const frame of mediaFrames.keys())films.observe(frame);
 const buttons=new IntersectionObserver(entries=>entries.forEach(({target,intersectionRatio})=>{
  if(intersectionRatio>=.68)target.classList.add('is-visible');
  else if(intersectionRatio<=.18)target.classList.remove('is-visible');
 }),{threshold:[.18,.68]});
 $$('[data-view-cta]').forEach(button=>buttons.observe(button));
}
document.addEventListener('visibilitychange',syncVideos);
reduced.addEventListener('change',syncVideos);

const visits=$('#estimate-visits'),rate=$('#estimate-rate'),increase=$('#estimate-increase');
const gain=$('#estimate-gain'),before=$('#estimate-before'),after=$('#estimate-after'),announcement=$('#estimate-announcement');
const number=new Intl.NumberFormat('fr-FR');
function estimate(traffic,current,lift){
 const base=Math.round(traffic*current/100);
 const total=Math.round(traffic*Math.min(100,current+lift)/100);
 return [base,total,total-base];
}
function estimateValues(){
 return estimate(...[visits,rate,increase].map(field=>clamp(field.valueAsNumber||0,0,Number(field.max))));
}
let estimateAnimation=0;
function paintEstimate(values){
 const [base,total,extra]=values;
 before.textContent=number.format(base);after.textContent=number.format(total);
 gain.textContent=(extra>0?'+':'')+number.format(extra);
}
function updateEstimate(){
 cancelAnimationFrame(estimateAnimation);
 const values=estimateValues();
 paintEstimate(values);
 const [base,total,extra]=values;
 announcement.textContent=number.format(base)+' demandes aujourd’hui, '+number.format(total)+' dans ce scénario. '+number.format(extra)+' de plus par mois.';
}
for(const field of [visits,rate,increase]){
 field.addEventListener('input',updateEstimate);
 field.addEventListener('change',()=>{
  if(Number.isFinite(field.valueAsNumber)&&!field.validity.valid){
   field.value=String(clamp(field===visits?Math.round(field.valueAsNumber):field.valueAsNumber,0,Number(field.max)));
   updateEstimate();
  }
 });
}
if('IntersectionObserver'in window&&!reduced.matches){
 const counts=new IntersectionObserver(([entry])=>{
  if(!entry.isIntersecting)return;
  counts.disconnect();
  if(reduced.matches)return;
  const values=estimateValues(),start=performance.now();
  function count(time){
   if(reduced.matches){paintEstimate(values);return}
   const t=clamp((time-start)/680,0,1),eased=1-(1-t)**3;
   paintEstimate(values.map(value=>Math.round(value*eased)));
   if(t<1)estimateAnimation=requestAnimationFrame(count);
  }
  estimateAnimation=requestAnimationFrame(count);
 },{threshold:.35});
 counts.observe($('.conversion-results'));
}

const form=$('#devis'),status=$('#form-status'),formMode=$('#form-mode'),submit=$('button[type=submit]',form);
$$('[data-need]').forEach(a=>a.addEventListener('click',()=>{form.elements.besoin.value=a.dataset.need}));
let widget=null,direct=false;
function showStatus(msg,error=false){status.textContent=msg;status.toggleAttribute('data-error',error)}
function mailto(data){
 const type=form.elements.besoin.selectedOptions[0].textContent;
 const body=['Bonjour Marc,','','Je souhaite discuter de ce projet vidéo :','',data.message,'','Nom : '+data.nom,'Entreprise : '+data.entreprise,'E-mail : '+data.email,'Besoin : '+type].join('\r\n');
 return 'mailto:marcbrioche.agence@gmail.com?subject='+encodeURIComponent('Demande CINÉLIEU — '+type)+'&body='+encodeURIComponent(body);
}
async function configContact(){
 try{
  const r=await fetch('/api/contact',{headers:{Accept:'application/json'}});
  if(!r.ok||!r.headers.get('content-type')?.includes('application/json'))return;
  const cfg=await r.json();if(!cfg.enabled||!cfg.siteKey)return;
  const s=document.createElement('script');s.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';s.async=true;
  s.onload=()=>{try{$('#antispam').hidden=false;widget=window.turnstile.render('#antispam',{sitekey:cfg.siteKey,language:'fr'});direct=true;formMode.textContent='Votre demande est transmise à Marc Brioche.'}catch{$('#antispam').hidden=true}};
  document.head.append(s);
 }catch{/* Le brouillon e-mail reste disponible. */}
}
if('IntersectionObserver'in window){const o=new IntersectionObserver(([entry])=>{if(entry.isIntersecting){o.disconnect();configContact()}},{rootMargin:'300px'});o.observe(form)}
else configContact();
form.addEventListener('submit',async e=>{
 e.preventDefault();if(!form.reportValidity())return;
 const data=Object.fromEntries(new FormData(form));
 for(const key of ['nom','entreprise','email','message'])data[key]=data[key].trim();
 if(!data.nom||!data.entreprise||!data.message){showStatus('Complétez le nom, l’entreprise et le message.',true);return}
 if(data.website){showStatus('La demande n’a pas été envoyée. Utilisez le lien e-mail.',true);return}
 if(!direct){
  showStatus('Votre brouillon est prêt. Validez l’envoi dans votre application de messagerie.');
  location.href=mailto(data);return;
 }
 data.token=window.turnstile.getResponse(widget);
 if(!data.token){showStatus('Terminez la vérification antispam avant d’envoyer.',true);return}
 submit.disabled=true;showStatus('Transmission en cours…');
 try{
  const r=await fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
  const result=await r.json();if(!r.ok||!result.ok)throw Error(result.error||'L’envoi a échoué.');
  showStatus('Votre demande a été transmise. Merci.');form.reset();
 }catch(err){showStatus((err.message||'Impossible de transmettre la demande.')+' Vous pouvez aussi utiliser le lien e-mail.',true)}
 finally{submit.disabled=false;window.turnstile.reset(widget)}
});
