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
 method.style.setProperty('--method-cursor',stepLayout[currentStep].center+'px');
}
function measureMethod(){
 const top=method.getBoundingClientRect().top;
 stepLayout=steps.map((step,i)=>{
  const box=step.getBoundingClientRect(),link=stepLinks[i].getBoundingClientRect();
  return {start:box.top-top,center:link.top-top+link.height/2};
 });
 method.style.setProperty('--method-start',stepLayout[0].center+'px');
 method.style.setProperty('--method-length',stepLayout.at(-1).center-stepLayout[0].center+'px');
 moveMethodCursor();
 queue();
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
 highlightService(height);
 if(rect.top>=height||rect.bottom<=0)return;
 const line=height*.57-rect.top;
 let next=0;
 for(let i=1;i<stepLayout.length;i++)if(line>=stepLayout[i].start)next=i;
 selectMethodStep(next);
}
function queue(){if(!tick)tick=requestAnimationFrame(scrollEffects)}
addEventListener('scroll',queue,{passive:true});addEventListener('resize',measureMethod,{passive:true});
if('ResizeObserver'in window){const sizes=new ResizeObserver(measureMethod);steps.forEach(step=>sizes.observe(step));}
measureMethod();

const services=$('[data-service-sequence]'),serviceCards=$$('.service',services);
let currentService=null;
function highlightService(height){
 const section=services.getBoundingClientRect();
 const line=height*.6;
 let next=null;
 if(!reduced.matches&&section.top<line&&section.bottom>line){
  let rowTop=-Infinity,rowOffset=0;
  for(const card of serviceCards){
   const box=card.getBoundingClientRect();
   if(box.top>rowTop+4){rowTop=box.top;rowOffset=0}
   if(line>=rowTop+rowOffset)next=card;
   rowOffset+=Math.min(58,box.height*.23);
  }
 }
 if(next===currentService)return;
 currentService?.classList.remove('is-lit');
 next?.classList.add('is-lit');
 currentService=next;
}
reduced.addEventListener('change',queue);

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
 if(video.dataset.playbackRate){
  const rate=Number(video.dataset.playbackRate);
  video.defaultPlaybackRate=rate;
  video.playbackRate=rate;
 }
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
 const journey=new IntersectionObserver(entries=>{
  for(const {target,intersectionRatio} of entries){
   if(intersectionRatio>=.46)target.classList.add('is-illustrated');
   else if(intersectionRatio<=.08)target.classList.remove('is-illustrated');
  }
 },{threshold:[.08,.46]});
 $$('[data-journey-step]').forEach(step=>journey.observe(step));
}
document.addEventListener('visibilitychange',syncVideos);
reduced.addEventListener('change',()=>{refreshMediaToggles();syncVideos()});

if('IntersectionObserver'in window&&!reduced.matches){
 const stats=new IntersectionObserver(entries=>{
  for(const {target:card,isIntersecting} of entries){
   if(!isIntersecting)continue;
   stats.unobserve(card);
   if(reduced.matches)continue;
   const value=$('[data-scenario-value]',card),label=value.textContent;
   const target=parseInt(label,10),start=performance.now();
   const delay=Number(card.dataset.statDelay);
   function count(time){
    const progress=clamp((time-start-delay)/640,0,1);
    value.textContent=label.replace(/\d+/,String(Math.round(target*(1-(1-progress)**3))));
    if(progress<1&&!reduced.matches)requestAnimationFrame(count);
    else value.textContent=label;
   }
   count(start);
  }
 },{threshold:.55});
 $$('[data-stat-delay]').forEach(card=>stats.observe(card));
}

const form=$('#devis'),status=$('#form-status'),formMode=$('#form-mode'),submit=$('button[type=submit]',form);
$$('[data-need]').forEach(a=>a.addEventListener('click',()=>{form.elements.besoin.value=a.dataset.need}));
let widget=null,direct=false;
function showStatus(msg,error=false){status.textContent=msg;status.toggleAttribute('data-error',error)}
function mailto(data){
 const type=form.elements.besoin.selectedOptions[0].textContent;
 const body=['Bonjour Marc,','','Je souhaite discuter de ce projet vidéo :','',data.message,'','Nom : '+data.nom,'Entreprise : '+data.entreprise,'E-mail : '+data.email,'Besoin : '+type].join('\r\n');
 return $('.contact-mail').getAttribute('href').split('?')[0]+'?subject='+encodeURIComponent('Demande CINÉLIEU — '+type)+'&body='+encodeURIComponent(body);
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
