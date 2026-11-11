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
 const layer=readGalleryLayer(height);
 progress.style.transform='scaleX('+ratio+')';
 showGalleryLayer(layer);
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

const gallery=$('[data-gallery-stack]'),galleryMarks=$$('.stack-mark',gallery),galleryCards=$$('.stack-card',gallery);
let galleryLayer=-1,mediaPaused=false;
let galleryPin=parseFloat(getComputedStyle(galleryCards[0]).top);
addEventListener('resize',()=>{galleryPin=parseFloat(getComputedStyle(galleryCards[0]).top);queue()},{passive:true});
function readGalleryLayer(height){
 const rect=gallery.getBoundingClientRect(),line=height*.59;
 if(rect.top>line||rect.bottom<Math.min(155,height*.3))return -1;
 const handoff=Number.isFinite(galleryPin)?Math.min(line,galleryPin+36):line;
 let layer=0;
 for(let i=1;i<galleryMarks.length;i++)if(galleryMarks[i].getBoundingClientRect().top<=handoff)layer=i;
 return layer;
}
function showGalleryLayer(layer){
 if(layer===galleryLayer)return;
 galleryLayer=layer;
 gallery.dataset.activeLayer=layer;
 galleryCards.forEach((card,i)=>{
  card.classList.toggle('is-covered',layer>=0&&i<layer);
  syncVideo(card,mediaFrames.get(card));
 });
}
const mediaFrames=new Map($$('[data-film-frame]').map(frame=>{
 const video=$('[data-flow-video]',frame),state={video,visible:false,active:false,timer:0,layer:galleryCards.indexOf(frame)};
 video.addEventListener('playing',()=>{
  if(state.active)frame.classList.add('is-playing');
  else video.pause();
 });
 video.addEventListener('error',()=>frame.classList.remove('is-playing'));
 return [frame,state];
}));
function syncVideo(frame,state){
 const {video,layer}=state,active=state.visible&&(layer<0||layer===galleryLayer)&&!mediaPaused&&!reduced.matches&&!document.hidden;
 if(state.active===active)return;
 state.active=active;
 clearTimeout(state.timer);
 if(!active){video.pause();frame.classList.remove('is-playing');return}
 if(!video.getAttribute('src'))video.src=video.dataset.src;
 else if(video.readyState)video.currentTime=0;
 if(frame.classList.contains('scan-frame'))state.timer=setTimeout(()=>video.play().catch(()=>{}),220);
 else video.play().catch(()=>{});
}
function syncVideos(){for(const [frame,state] of mediaFrames)syncVideo(frame,state)}
const mediaToggles=$$('[data-media-toggle]');
function refreshMediaToggles(){
 for(const button of mediaToggles){
  button.hidden=reduced.matches||!('IntersectionObserver'in window);
  button.textContent=mediaPaused?'Reprendre les vidéos':'Mettre les vidéos en pause';
 }
}
for(const button of mediaToggles)button.addEventListener('click',()=>{
 mediaPaused=!mediaPaused;refreshMediaToggles();syncVideos();
});
refreshMediaToggles();
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
reduced.addEventListener('change',()=>{refreshMediaToggles();syncVideos()});

const scenarioStats=$('[data-scenario-stats]');
const scenarioValues=$$('[data-scenario-value]',scenarioStats).map(node=>({
 node, label:node.textContent, target:parseInt(node.textContent,10)
}));
let scenarioFrame=0;
function finishScenario(){
 cancelAnimationFrame(scenarioFrame);
 delete scenarioStats.dataset.countFocus;
 for(const {node,label} of scenarioValues)node.textContent=label;
}
if('IntersectionObserver'in window&&!reduced.matches){
 const observer=new IntersectionObserver(([entry])=>{
  if(!entry.isIntersecting)return;
  observer.disconnect();
  if(reduced.matches)return;
  const start=performance.now(),duration=550,delay=180;
  function count(time){
   const elapsed=time-start;
   scenarioStats.dataset.countFocus=Math.min(3,1+Math.floor(elapsed/delay));
   scenarioValues.forEach(({node,label,target},i)=>{
    const progress=clamp((elapsed-i*delay)/duration,0,1);
    node.textContent=label.replace(/\d+/,String(Math.round(target*(1-(1-progress)**3))));
   });
   if(elapsed<duration+delay*(scenarioValues.length-1))scenarioFrame=requestAnimationFrame(count);
   else finishScenario();
  }
  count(start);
 },{threshold:.3});
 observer.observe(scenarioStats);
}
reduced.addEventListener('change',finishScenario);

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
