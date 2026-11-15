const $=(s,root=document)=>root.querySelector(s), $$=(s,root=document)=>[...root.querySelectorAll(s)];
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const platforms=$('[data-platforms]');
if(platforms){
 const track=$('.platform-track',platforms);
 const copy=$('.platform-list',track).cloneNode(true);
 copy.setAttribute('aria-hidden','true');
 track.append(copy);
 const pause=$('.platform-pause',platforms);
 platforms.classList.add('is-looping');
 const syncMotion=()=>{pause.hidden=reduced.matches};
 pause.addEventListener('click',()=>{
  const paused=pause.getAttribute('aria-pressed')!=='true';
  pause.setAttribute('aria-pressed',String(paused));
  platforms.classList.toggle('is-paused',paused);
 });
 reduced.addEventListener('change',syncMotion);
 syncMotion();
}

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
const sectionLabels=$$('.section-label');
function updateSectionLabels(height){
 if(reduced.matches)return;
 const positions=sectionLabels.map(label=>label.getBoundingClientRect().top/height);
 const ease=value=>{
  const t=clamp(value,0,1);
  return t*t*(3-2*t);
 };
 sectionLabels.forEach((label,i)=>{
  const position=positions[i];
  if(position>1.05||position<-.1)return;
  const arrive=ease((.96-position)/.24);
  const settle=ease((.52-position)/.26);
  label.style.setProperty('--label-scale',(.96+.25*arrive-.25*settle).toFixed(3));
  label.style.setProperty('--label-offset',(4*(1-arrive)).toFixed(2)+'px');
  label.style.setProperty('--label-muted',(settle*100).toFixed(1)+'%');
 });
}

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
 updateGalleryIrises(height);
 updateSectionLabels(height);
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
const galleryIrises=galleryCards.map(card=>{
 const canvas=document.createElement('canvas');
 const context=canvas.getContext('2d');
 if(!context)return null;
 canvas.className='gallery-iris';
 canvas.setAttribute('aria-hidden','true');
 canvas.hidden=true;
 card.append(canvas);
 return {canvas,context,width:0,height:0,opening:-1};
});

function drawGalleryIris(iris,opening){
 const {canvas,context:ctx}=iris;
 const width=canvas.clientWidth,height=canvas.clientHeight;
 if(!width||!height||(iris.width===width&&iris.height===height&&iris.opening===opening))return;
 Object.assign(iris,{width,height,opening});
 const scale=Math.min(devicePixelRatio||1,1.5);
 const pixelWidth=Math.round(width*scale),pixelHeight=Math.round(height*scale);
 if(canvas.width!==pixelWidth)canvas.width=pixelWidth;
 if(canvas.height!==pixelHeight)canvas.height=pixelHeight;
 ctx.setTransform(pixelWidth/width,0,0,pixelHeight/height,0,0);
 ctx.clearRect(0,0,width,height);
 ctx.save();
 ctx.translate(width/2,height/2);

 const limit=Math.hypot(width,height)/2;
 const radius=Math.min(width,height)*(.43+.12*opening);
 const hole=limit*1.15*opening;
 const shell=ctx.createRadialGradient(0,-radius*.28,radius*.15,0,0,limit);
 shell.addColorStop(0,'#2d3032');
 shell.addColorStop(.58,'#191b1d');
 shell.addColorStop(1,'#0c0e10');
 ctx.fillStyle=shell;
 ctx.fillRect(-width/2,-height/2,width,height);

 // Trace the same seven curved edges for the blades and the opening.
 const step=Math.PI*2/7,rotation=-Math.PI/2-opening*.62;
 const outer=Math.max(radius*.91,hole+radius*.64);
 const point=(r,angle)=>[r*Math.cos(angle),r*Math.sin(angle)];
 const inner=Array.from({length:7},(_,i)=>point(hole,rotation+i*step));
 const roots=inner.map((_,i)=>point(outer,rotation+i*step-1.02));
 const curves=inner.map((_,i)=>point((outer+hole)*.54,rotation+i*step-.27));
 const lip=inner.map((_,i)=>point(hole*.94,rotation+(i+.5)*step));
 for(let i=0;i<7;i++){
  const next=(i+1)%7;
  ctx.beginPath();
  ctx.moveTo(...inner[i]);
  ctx.quadraticCurveTo(...curves[i],...roots[i]);
  ctx.arc(0,0,outer,rotation+i*step-1.02,rotation+(i+1)*step-1.02);
  ctx.quadraticCurveTo(...curves[next],...inner[next]);
  ctx.quadraticCurveTo(...lip[i],...inner[i]);
  ctx.closePath();
  const blade=ctx.createLinearGradient(...roots[i],...roots[next]);
  blade.addColorStop(0,'#24272a');
  blade.addColorStop(.55,'#3b3e41');
  blade.addColorStop(1,'#2b2e30');
  ctx.fillStyle=blade;
  ctx.fill();
  ctx.strokeStyle='#121416';
  ctx.lineWidth=1.2;
  ctx.stroke();
 }

 const ringRadius=radius*(1-.32*opening);
 const steel=ctx.createLinearGradient(0,-ringRadius,0,ringRadius);
 steel.addColorStop(0,'#686d71');
 steel.addColorStop(.4,'#303438');
 steel.addColorStop(.82,'#16191c');
 steel.addColorStop(1,'#454a4f');
 ctx.globalAlpha=1-opening;
 for(const [offset,color,lineWidth] of [[0,'#111315',radius*.14],[0,steel,radius*.085],[.067,'#80858a',.8],[-.073,'#101214',1.2]]){
  ctx.beginPath();
  ctx.arc(0,0,ringRadius+radius*offset,0,Math.PI*2);
  ctx.strokeStyle=color;
  ctx.lineWidth=lineWidth;
  ctx.stroke();
 }
 ctx.globalAlpha=1;
 if(hole>0){
  ctx.globalCompositeOperation='destination-out';
  ctx.beginPath();
  ctx.moveTo(...inner[0]);
  for(let i=0;i<7;i++)ctx.quadraticCurveTo(...lip[i],...inner[(i+1)%7]);
  ctx.fill();
 }
 ctx.restore();
}

function updateGalleryIrises(height){
 if(reduced.matches){
  for(const iris of galleryIrises)if(iris)iris.canvas.hidden=true;
  return;
 }
 const top=gallery.getBoundingClientRect().top;
 // The markers retain their document positions while the cards are sticky.
 const positions=galleryMarks.map(mark=>top+mark.offsetTop);
 const travel=clamp(height*.52,150,490);
 for(let i=0;i<galleryIrises.length;i++){
  const iris=galleryIrises[i];
  if(!iris)continue;
  const position=positions[i];
  const progress=clamp((height+22-position)/travel,0,1);
  iris.canvas.hidden=progress===1||position>height+100;
  if(!iris.canvas.hidden)drawGalleryIris(iris,progress*progress*(3-2*progress));
 }
}

let galleryLayer=-1,mediaPaused=false;
let galleryPin=parseFloat(getComputedStyle(galleryCards[0]).top);
addEventListener('resize',()=>{galleryPin=parseFloat(getComputedStyle(galleryCards[0]).top);queue()},{passive:true});
function readGalleryLayer(height){
 const rect=gallery.getBoundingClientRect(),line=height*.59;
 if(rect.top>=height||rect.bottom<Math.min(155,height*.3))return -1;
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
 const {video,layer}=state;
 const available=layer<0||(galleryLayer>=0&&layer>=galleryLayer);
 const active=state.visible&&available&&!mediaPaused&&!reduced.matches&&!document.hidden;
 if(state.active===active)return;
 state.active=active;
 clearTimeout(state.timer);
 if(!active){video.pause();frame.classList.remove('is-playing');return}
 if(!video.getAttribute('src'))video.src=video.dataset.src;
 else if(layer<0&&video.readyState)video.currentTime=0;
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
  const galleryFilm=state.layer>=0;
  if(intersectionRatio>=(galleryFilm ? .12 : .5))state.visible=true;
  else if(intersectionRatio<=(galleryFilm ? .03 : .15))state.visible=false;
  syncVideo(target,state);
 }),{threshold:[.03,.12,.15,.5]});
 for(const frame of mediaFrames.keys())films.observe(frame);
 const preloadGallery=new IntersectionObserver(entries=>{
  if(mediaPaused||reduced.matches)return;
  for(const {target,isIntersecting} of entries){
   if(!isIntersecting)continue;
   const {video}=mediaFrames.get(target);
   if(!video.hasAttribute('src')){
    video.preload='auto';
    video.src=video.dataset.src;
   }
   preloadGallery.unobserve(target);
  }
 },{rootMargin:'420px 0px'});
 galleryCards.forEach(frame=>preloadGallery.observe(frame));
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
const emailField=form.elements.email,emailShortcuts=$('.email-shortcuts',form);
$$('[data-need]').forEach(link=>link.addEventListener('click',()=>{
 form.elements.besoin.value=link.dataset.need;
 if(link.dataset.plan)form.elements.formule.value=link.dataset.plan;
}));
emailShortcuts.hidden=false;
for(const button of $$('[data-email-domain]',emailShortcuts)){
 button.addEventListener('click',()=>{
  const local=emailField.value.trim().split('@')[0];
  emailField.focus();
  if(!local)return;
  emailField.value=local+'@'+button.dataset.emailDomain;
 });
}
let widget=null;
function showStatus(message,error=false){
 status.textContent=message;
 status.toggleAttribute('data-error',error);
}
function contactUnavailable(){
 formMode.textContent='L’envoi depuis le site est indisponible pour le moment. Vous pouvez nous joindre par e-mail.';
 submit.disabled=true;
}
async function configContact(){
 try{
  const response=await fetch('/api/contact',{headers:{Accept:'application/json'},signal:AbortSignal.timeout(8000)});
  if(!response.ok)throw Error();
  const config=await response.json();
  if(!config.enabled||!config.siteKey){contactUnavailable();return}
  const script=document.createElement('script');
  script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
  script.async=true;
  script.onerror=contactUnavailable;
  script.onload=()=>{
   try{
    $('#antispam').hidden=false;
    widget=window.turnstile.render('#antispam',{
     sitekey:config.siteKey,language:'fr',appearance:'interaction-only',action:'contact',
     'error-callback':()=>showStatus('La vérification antispam est momentanément indisponible.',true)
    });
    submit.disabled=false;
    formMode.textContent='Vous recevrez notre réponse à l’adresse indiquée.';
   }catch{contactUnavailable()}
  };
  document.head.append(script);
 }catch{contactUnavailable()}
}
if('IntersectionObserver'in window){
 const observer=new IntersectionObserver(([entry])=>{
  if(entry.isIntersecting){observer.disconnect();configContact()}
 },{rootMargin:'300px'});
 observer.observe(form);
}else configContact();
form.addEventListener('submit',async event=>{
 event.preventDefault();
 if(widget===null||submit.disabled||!form.reportValidity())return;
 const data=Object.fromEntries(new FormData(form));
 data.message=data.message.trim();
 if(!data.message){showStatus('Décrivez votre projet en quelques mots.',true);return}
 data.token=window.turnstile.getResponse(widget);
 if(!data.token){showStatus('Patientez un instant ou terminez la vérification antispam.',true);return}
 submit.disabled=true;
 showStatus('Envoi en cours…');
 try{
  const response=await fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),signal:AbortSignal.timeout(22000)});
  const result=await response.json();
  if(!response.ok||!result.ok)throw Error(result.error||'L’envoi a échoué.');
  form.reset();
  showStatus('Merci ! Votre demande a bien été envoyée.');
 }catch(error){showStatus(error.name==='TimeoutError'?'L’envoi n’a pas pu être confirmé. Vous pouvez nous écrire par e-mail.':error.message,true)}
 finally{submit.disabled=false;window.turnstile.reset(widget)}
});
