const $=(s,root=document)=>root.querySelector(s), $$=(s,root=document)=>[...root.querySelectorAll(s)];
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
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
const progress=$('.progress'),method=$('.method-flow');
const steps=$$('.method-step',method),stepLinks=$$('.method-index',method);
let stepLayout=[],currentStep=0;
function moveMethodCursor(){
 const first=stepLayout[0].center,last=stepLayout.at(-1).center;
 const distance=stepLayout[currentStep].center-first;
 method.style.setProperty('--method-cursor',first+distance+'px');
 method.style.setProperty('--method-progress',distance/Math.max(1,last-first));
}
function measureMethod(){
 const top=method.getBoundingClientRect().top;
 stepLayout=steps.map((step,i)=>{
  const box=step.getBoundingClientRect(),link=stepLinks[i].getBoundingClientRect();
  return {start:box.top-top+Math.min(box.height*.2,27),center:link.top-top+link.height/2};
 });
 method.style.setProperty('--method-start',stepLayout[0].center+'px');
 method.style.setProperty('--method-length',stepLayout.at(-1).center-stepLayout[0].center+'px');
 moveMethodCursor();queue();
}
function selectMethodStep(index){
 if(index===currentStep)return;
 steps[currentStep].classList.remove('is-current');
 stepLinks[currentStep].removeAttribute('aria-current');
 currentStep=index;
 steps[index].classList.add('is-current');
 stepLinks[index].setAttribute('aria-current','step');
 moveMethodCursor();
}
function scrollEffects(){
 tick=0;
 const height=innerHeight,doc=document.documentElement,ratio=clamp(scrollY/Math.max(1,doc.scrollHeight-height),0,1);
 const rect=method.getBoundingClientRect();
 progress.style.transform='scaleX('+ratio+')';
 if(rect.top>=height||rect.bottom<=0)return;
 const line=height*.55-rect.top;
 let next=0;
 for(let i=1;i<stepLayout.length;i++)if(line>=stepLayout[i].start+(i<=currentStep?-6:6))next=i;
 selectMethodStep(next);
}
function queue(){if(!tick)tick=requestAnimationFrame(scrollEffects)}
addEventListener('scroll',queue,{passive:true});addEventListener('resize',measureMethod,{passive:true});
if('ResizeObserver'in window){const sizes=new ResizeObserver(measureMethod);steps.forEach(step=>sizes.observe(step));}
measureMethod();

const serviceCards=$$('[data-service-sequence] .service'),serviceVisible=new Set(),serviceVisited=new Set();
let currentService=null,serviceTimer=0;
function illuminateService(card){
 if(card===currentService)return;
 currentService?.classList.remove('is-lit');
 currentService=card;
 if(card){card.classList.add('is-lit');serviceVisited.add(card)}
}
function queueServices(){
 if(reduced.matches||document.hidden||!serviceVisible.size){
  clearTimeout(serviceTimer);serviceTimer=0;illuminateService(null);serviceVisited.clear();return;
 }
 if(!serviceVisible.has(currentService)){
  clearTimeout(serviceTimer);serviceTimer=0;
  illuminateService(serviceCards.find(card=>serviceVisible.has(card)&&!serviceVisited.has(card))||serviceCards.find(card=>serviceVisible.has(card)));
 }
 if(!serviceTimer&&serviceCards.some(card=>serviceVisible.has(card)&&!serviceVisited.has(card))){
  serviceTimer=setTimeout(()=>{
   serviceTimer=0;
   const next=serviceCards.find(card=>serviceVisible.has(card)&&!serviceVisited.has(card));
   if(next)illuminateService(next);
   queueServices();
  },780);
 }
}
if('IntersectionObserver'in window){
 const cards=new IntersectionObserver(entries=>{
  for(const {target,intersectionRatio} of entries){
   if(intersectionRatio>=.46)serviceVisible.add(target);
   else if(intersectionRatio<=.2)serviceVisible.delete(target);
  }
  queueServices();
 },{threshold:[.2,.46],rootMargin:'-8% 0px -10%'});
 serviceCards.forEach(card=>cards.observe(card));
}
reduced.addEventListener('change',queueServices);
document.addEventListener('visibilitychange',queueServices);

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
const results=$('.conversion-results');
const number=new Intl.NumberFormat('fr-FR');
function estimate(traffic,current,lift){
 const base=Math.round(traffic*current/100);
 const total=Math.round(traffic*Math.min(100,current+lift)/100);
 return [base,total,total-base];
}
function estimateValues(){
 return estimate(...[visits,rate,increase].map(field=>clamp(field.valueAsNumber||0,0,Number(field.max))));
}
let estimateAnimation=0,estimateTimer=0,estimateVisible=false,displayed=estimateValues();
function paintEstimate(values){
 displayed=values;
 const [base,total,extra]=values;
 for(const [node,value] of [[before,number.format(base)],[after,number.format(total)],[gain,(extra>0?'+':'')+number.format(extra)]]){
  if(node.textContent!==value)node.textContent=value;
 }
}
function stopEstimate(){
 cancelAnimationFrame(estimateAnimation);clearTimeout(estimateTimer);
 delete results.dataset.countFocus;
}
function animateEstimate(from,to,entrance){
 stopEstimate();
 if(reduced.matches||!estimateVisible){paintEstimate(to);return}
 let last=performance.now(),elapsed=0;
 const duration=entrance?570:390,delays=entrance?[0,180,380]:[0,60,120];
 paintEstimate(from);
 function count(time){
  elapsed+=clamp(time-last,0,48);last=time;
  const phase=elapsed>=delays[2]?3:elapsed>=delays[1]?2:1;
  if(results.dataset.countFocus!==String(phase))results.dataset.countFocus=phase;
  paintEstimate(to.map((value,i)=>{
   const t=clamp((elapsed-delays[i])/duration,0,1);
   return Math.round(from[i]+(value-from[i])*(1-(1-t)**3));
  }));
  if(elapsed<duration+delays[2])estimateAnimation=requestAnimationFrame(count);
  else delete results.dataset.countFocus;
 }
 estimateAnimation=requestAnimationFrame(count);
}
function updateEstimate(){
 stopEstimate();
 const values=estimateValues();
 if(reduced.matches||!estimateVisible)paintEstimate(values);
 else estimateTimer=setTimeout(()=>animateEstimate(displayed,values,false),150);
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
if('IntersectionObserver'in window){
 const counts=new IntersectionObserver(([entry])=>{
  if(entry.intersectionRatio>=.48&&!estimateVisible){
   estimateVisible=true;animateEstimate([0,0,0],estimateValues(),true);
  }else if(entry.intersectionRatio<=.14&&estimateVisible){
   estimateVisible=false;stopEstimate();paintEstimate(estimateValues());
  }
 },{threshold:[.14,.48]});
 counts.observe(results);
}
reduced.addEventListener('change',()=>{stopEstimate();paintEstimate(estimateValues())});

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
