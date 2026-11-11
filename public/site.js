const $=(s,root=document)=>root.querySelector(s), $$=(s,root=document)=>[...root.querySelectorAll(s)];
const reduced=matchMedia('(prefers-reduced-motion: reduce)'), mouse=matchMedia('(hover:hover) and (pointer:fine)');
const films={
 villa:{title:'Villa provençale',format:'horizontal'},
 appartement:{title:'Appartement haussmannien',format:'vertical'},
 chalet:{title:'Chalet des Alpes',format:'horizontal'},
 location:{title:'Escale méditerranéenne',format:'vertical'}
};
const introFilm={title:'Un intérieur, deux regards',format:'horizontal',credit:'ArtHouse Studio'};
const comparisonFilms={
 'salon-verriere':{title:'Séjour sous verrière',format:'horizontal',credit:'ArtHouse Studio',source:'https://www.pexels.com/video/beautiful-living-area-interiors-5091093/'},
 'plan-appartement':{title:'Appartement lumineux',format:'vertical',credit:'Fernanda Neitzel',source:'https://www.pexels.com/video/modern-living-room-with-elegant-interior-design-36030658/'}
};
const media=(id,ext)=>'/assets/'+id+'.'+ext;
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
let tick=0;
const progress=$('.progress'),timeline=$('.timeline'),scene=$('.hero-scene');
const clamp=(x)=>Math.min(1,Math.max(0,x));
const stage=$('.motion-stage'),stageVideo=$('.motion-video');
let stageVisible=false,stageTimer=0;
function syncStage(){
 const active=stageVisible&&!reduced.matches&&!document.hidden&&!$('#film-dialog').open;
 if(active===stage.classList.contains('is-active'))return;
 stage.classList.toggle('is-active',active);
 clearTimeout(stageTimer);
 if(!active){
  stageVideo.pause();stage.classList.remove('has-video');stageVideo.classList.remove('ready');
  return;
 }
 stageTimer=setTimeout(()=>{
  prepare(stageVideo,stageVideo.dataset.src);
  if(stageVideo.readyState)stageVideo.currentTime=0;
  stageVideo.play().catch(()=>{});
 },585);
}
stageVideo.addEventListener('playing',()=>stage.classList.add('has-video'));
if('IntersectionObserver'in window){
 // Separate entry and exit thresholds prevent flicker at the viewport edge.
 new IntersectionObserver(([entry])=>{
  if(entry.intersectionRatio>=.48)stageVisible=true;
  else if(entry.intersectionRatio<=.12)stageVisible=false;
  syncStage();
 },{threshold:[.12,.48]}).observe(stage);
 const buttons=new IntersectionObserver(entries=>entries.forEach(({target,intersectionRatio})=>{
  if(intersectionRatio>=.68)target.classList.add('is-visible');
  else if(intersectionRatio<=.18)target.classList.remove('is-visible');
 }),{threshold:[.18,.68]});
 $$('[data-view-cta]').forEach(button=>buttons.observe(button));
}
document.addEventListener('visibilitychange',syncStage);
reduced.addEventListener('change',syncStage);
function scrollEffects(){
 tick=0;
 const doc=document.documentElement,ratio=clamp(scrollY/Math.max(1,doc.scrollHeight-innerHeight));
 const rect=reduced.matches?null:timeline.getBoundingClientRect();
 progress.style.transform='scaleX('+ratio+')';
 if(rect)timeline.style.setProperty('--timeline',clamp((innerHeight*.76-rect.top)/Math.max(1,rect.height)));
}
function queue(){if(!tick)tick=requestAnimationFrame(scrollEffects)}
addEventListener('scroll',queue,{passive:true});addEventListener('resize',queue,{passive:true});queue();
$$('.tilt,.magnetic').forEach(el=>{
 el.addEventListener('pointermove',e=>{
  if(!mouse.matches||reduced.matches||e.pointerType==='touch')return;
  const r=el.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
  if(el.classList.contains('tilt')){el.style.setProperty('--rx',-y*5+'deg');el.style.setProperty('--ry',x*6+'deg')}
  else{el.style.setProperty('--mx',x*8+'px');el.style.setProperty('--my',y*7+'px')}
 });
 el.addEventListener('pointerleave',()=>['--rx','--ry','--mx','--my'].forEach(v=>el.style.removeProperty(v)));
});
function prepare(video,src){
 if(!video.getAttribute('src'))video.src=src;
 if(!video.dataset.events){
  video.dataset.events='true';video.addEventListener('playing',()=>video.classList.add('ready'));video.addEventListener('error',()=>video.classList.remove('ready'));
 }
}
const hero=$('.hero-video');let heroVisible=false;
function heroPlayback(){
 if(heroVisible&&!reduced.matches&&!document.hidden&&!$('#film-dialog').open){
  prepare(hero,hero.dataset.src);hero.play().catch(()=>{});
 }else hero.pause();
}
if('IntersectionObserver'in window)new IntersectionObserver(([entry])=>{
 if(entry.intersectionRatio>=.45)heroVisible=true;else if(entry.intersectionRatio<=.12)heroVisible=false;
 heroPlayback();
},{threshold:[.12,.45]}).observe(scene);
document.addEventListener('visibilitychange',heroPlayback);reduced.addEventListener('change',()=>{heroPlayback();if(reduced.matches){hero.classList.remove('ready');$$('.gallery-card video').forEach(v=>{v.pause();v.classList.remove('ready')})}});
const compare=$('.compare'),range=$('.compare-range'),cv=$('#compare-video'),cp=$('.compare-play'),compareNote=$('#compare-status'),compareExpand=$('.compare-expand');
const compareChoices=$$('[data-compare]');
function showCut(){compare.style.setProperty('--cut',range.value+'%');range.setAttribute('aria-valuetext',range.value+' % photo, '+(100-range.value)+' % vidéo')}
range.addEventListener('input',showCut);
function compareLabel(playing){cp.setAttribute('aria-pressed',String(playing));cp.setAttribute('aria-label',playing?'Mettre la vidéo en pause':cv.currentTime?'Reprendre la vidéo':'Lire la vidéo');$('use',cp).setAttribute('href',playing?'#pause':'#play')}
cv.addEventListener('playing',()=>{compareLabel(true);compareNote.textContent=''});cv.addEventListener('pause',()=>compareLabel(false));
cv.addEventListener('error',()=>{if(cv.getAttribute('src'))compareNote.textContent='Le clip n’a pas pu être chargé. Réessayez ou ouvrez-le en grand.'});
compareChoices.forEach(button=>button.addEventListener('click',()=>{
 const id=button.dataset.compare,film=comparisonFilms[id];
 if(compareExpand.dataset.film===id)return;
 cv.pause();cv.classList.remove('ready');cv.removeAttribute('src');cv.load();cv.dataset.src=media(id,'mp4');
 cv.setAttribute('aria-label','Vidéo : '+film.title);
 const before=$('.compare-photo'),after=$('.compare-after img');
 before.src=media(id,'webp');before.alt='Image fixe extraite du plan : '+film.title;after.src=media(id+'-apres','webp');
 compare.dataset.format=film.format;compareExpand.dataset.film=id;
 const credit=$('#compare-description a');credit.href=film.source;credit.setAttribute('aria-label','Crédit du plan : '+film.credit+' sur Pexels');
 compareNote.textContent='';range.value='50';showCut();compareLabel(false);
 compareChoices.forEach(choice=>choice.setAttribute('aria-pressed',String(choice===button)));
}));
function playComparison(manual=false){
 if(!cv.paused)return;
 prepare(cv,cv.dataset.src);
 if(manual&&range.value==='100'){range.value='50';showCut()}
 cv.play().catch(error=>{
  if(manual&&error.name!=='AbortError')compareNote.textContent='Lecture indisponible. Essayez le lecteur agrandi.';
 });
}
cp.addEventListener('click',()=>{if(cv.paused)playComparison(true);else cv.pause()});

let gesture=null,cutFrame=0,pendingCut=50;
function positionCut(x,rect){return Math.round(clamp((x-rect.left)/Math.max(1,rect.width))*100)}
function flushCut(){cutFrame=0;if(range.value!==String(pendingCut)){range.value=String(pendingCut);showCut()}}
function queueCut(x,rect){pendingCut=positionCut(x,rect);if(!cutFrame)cutFrame=requestAnimationFrame(flushCut)}
function activateGesture(g){g.intent='horizontal';compare.classList.add('is-dragging')}
compare.addEventListener('pointerdown',e=>{
 if(!e.isPrimary||e.button!==0||gesture)return;
 const g={id:e.pointerId,x:e.clientX,y:e.clientY,rect:compare.getBoundingClientRect(),intent:null};
 gesture=g;
 compare.setPointerCapture(e.pointerId);
 if(e.pointerType==='mouse'){
  activateGesture(g);queueCut(e.clientX,g.rect);range.focus({preventScroll:true});
 }
});
compare.addEventListener('pointermove',e=>{
 const g=gesture;if(!g||e.pointerId!==g.id||g.intent==='vertical')return;
 const dx=Math.abs(e.clientX-g.x),dy=Math.abs(e.clientY-g.y);
 if(!g.intent){
  if(dy>8&&dy>=dx){g.intent='vertical';return}
  if(dx<8||dx<dy*1.15)return;
  activateGesture(g);
  if(!reduced.matches&&e.pointerType==='mouse')playComparison();
 }
 queueCut(e.clientX,g.rect);
});
function releaseGesture(e,completed){
 const g=gesture;if(!g||e.pointerId!==g.id)return;
 gesture=null;
 compare.classList.remove('is-dragging');
 if(completed&&g.intent!=='vertical'){
  if(cutFrame)cancelAnimationFrame(cutFrame);
  pendingCut=positionCut(e.clientX,g.rect);flushCut();
  if(!reduced.matches&&Number(range.value)<100)playComparison();
 }
}
compare.addEventListener('pointerup',e=>releaseGesture(e,true));
compare.addEventListener('pointercancel',e=>releaseGesture(e,false));
compare.addEventListener('lostpointercapture',e=>releaseGesture(e,false));
if('IntersectionObserver'in window)new IntersectionObserver(([entry])=>{if(!entry.isIntersecting)cv.pause()}).observe(compare);
const dialog=$('#film-dialog'),player=$('#film-player'),playerStatus=$('#player-status'),fullscreen=$('#native-fullscreen');
let returnFocus;
function stopPreviews(){$$('.gallery-card video').forEach(v=>{v.pause();v.classList.remove('ready')})}
function openFilm(id,trigger){
 const filmed=id==='film-interieurs'?introFilm:comparisonFilms[id],film=filmed||films[id];if(!film)return;
 returnFocus=trigger;dialog.dataset.format=film.format;$('#film-title').textContent=film.title;
 $('#film-kind').textContent=filmed?(id==='film-interieurs'?'Montage d’illustration · ':'Plan d’illustration · ')+film.credit+' / Pexels':'Animation numérique · Vidéo sans audio';
 playerStatus.textContent='';player.poster=media(id,'webp');player.src=media(id,'mp4');
 hero.pause();cv.pause();stopPreviews();dialog.showModal();syncStage();document.documentElement.classList.add('scroll-lock');
 player.play().catch(()=>{if(dialog.open)playerStatus.textContent='Utilisez la commande de lecture pour lancer le clip.'});
}
$$('[data-film]').forEach(el=>el.addEventListener('click',()=>openFilm(el.dataset.film,el)));
$('.dialog-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}});
dialog.addEventListener('close',()=>{player.pause();player.removeAttribute('src');player.load();document.documentElement.classList.remove('scroll-lock');returnFocus?.focus({preventScroll:true});heroPlayback();syncStage();queue()});
player.addEventListener('playing',()=>{playerStatus.textContent=''});
player.addEventListener('error',()=>{if(dialog.open)playerStatus.textContent='Ce clip n’a pas pu être chargé. Fermez la fenêtre et réessayez.'});
fullscreen.addEventListener('click',async()=>{
 try{
  if(player.webkitEnterFullscreen)player.webkitEnterFullscreen();
  else if(player.requestFullscreen)await player.requestFullscreen();
  else playerStatus.textContent='Le lecteur occupe déjà la fenêtre de démonstration.';
 }catch{playerStatus.textContent='Le plein écran n’est pas disponible sur ce navigateur.'}
});
$$('.gallery-card').forEach(card=>{
 const vid=$('video',card),btn=$('button',card);
 btn.addEventListener('pointerenter',e=>{if(mouse.matches&&!reduced.matches&&e.pointerType!=='touch'&&!dialog.open){prepare(vid,media(btn.dataset.film,'mp4'));vid.play().catch(()=>{})}});
 btn.addEventListener('pointerleave',()=>{vid.pause();vid.classList.remove('ready')});
});
$$('[data-filter]').forEach(btn=>btn.addEventListener('click',()=>{
 stopPreviews();$$('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===btn)));
 $$('.gallery-card').forEach(card=>{
  const show=btn.dataset.filter==='tout'||btn.dataset.filter===card.dataset.category;
  card.hidden=!show;if(show){card.classList.add('visible');if(!reduced.matches)card.animate([{opacity:.45,transform:'translateY(8px)'},{opacity:1,transform:'none'}],{duration:270,easing:'ease-out'})}
 });
}));
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
