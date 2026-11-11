const $=(s,root=document)=>root.querySelector(s), $$=(s,root=document)=>[...root.querySelectorAll(s)];
const reduced=matchMedia('(prefers-reduced-motion: reduce)'), mouse=matchMedia('(hover:hover) and (pointer:fine)');
const films={
 villa:{title:'Villa provençale',format:'horizontal'},
 appartement:{title:'Appartement haussmannien',format:'vertical'},
 chalet:{title:'Chalet des Alpes',format:'horizontal'},
 location:{title:'Escale méditerranéenne',format:'vertical'}
};
const comparisonFilms={
 'plan-salon':{title:'Salon panoramique',format:'horizontal',credit:'Hamza Awan',source:'https://www.pexels.com/video/amazing-shot-of-living-room-17211925/'},
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
const mix=(a,b,t)=>a+(b-a)*t;
function ease(from,to,value){const t=clamp((value-from)/(to-from));return t*t*(3-2*t)}
const track=$('.motion-track'),stage=$('.motion-stage'),stageVideo=$('.motion-video');
let stageNear=false,stageTop=0,stageTravel=1,stagePlaying=false,stageProgress=-1;
function measureStage(){
 stageTop=parseFloat(getComputedStyle(stage).top)||0;
 stageTravel=Math.max(1,track.offsetHeight-stage.offsetHeight);
 stageProgress=-1;queue();
}
function stagePlayback(playing){
 if(playing===stagePlaying)return;
 stagePlaying=playing;
 if(playing){prepare(stageVideo,stageVideo.dataset.src);if(stageVideo.ended)stageVideo.currentTime=0;stageVideo.play().catch(()=>{})}
 else stageVideo.pause();
}
function paintStage(){
 if(!stageNear||reduced.matches||!track.offsetHeight){stagePlayback(false);return}
 const p=clamp((stageTop-track.getBoundingClientRect().top)/stageTravel);
 stagePlayback(p>=.285&&p<.89&&!document.hidden&&!$('#film-dialog').open);
 if(p===stageProgress)return;
 stageProgress=p;
 const start=ease(.02,.22,p),expand=ease(.65,.79,p),out=ease(.85,1,p);
 const dark=ease(.26,.50,p)*(1-out);
 const playClick=ease(.28,.35,p),wideClick=ease(.63,.70,p);
 const second=p>=.53,click=second?wideClick:playClick;
 const cursorMove=second?ease(.54,.63,p):ease(.095,.27,p);
 const cursorAlpha=second?ease(.53,.58,p)*(1-ease(.69,.76,p)):ease(.065,.13,p)*(1-ease(.34,.41,p));
 const wipe=ease(.305,.50,p)*(1-ease(.90,1,p));
 const color=(a,b,t)=>'rgb('+a.map((v,i)=>Math.round(mix(v,b[i],t))).join(',')+')';
 const props={
  '--stage-progress':p,'--darken':dark,'--stage-y':mix(24,0,start)+out*13+'px',
  '--stage-scale':mix(.77,.96,start)+.19*expand-.32*out,'--stage-opacity':1-.22*out,
  '--stage-ink':color([41,70,56],[228,246,235],dark),'--stage-accent':color([45,111,74],[158,242,191],dark),
  '--stage-bg':color([238,245,238],[248,249,247],out),'--stage-grid':.68*(1-out),
  '--stage-wipe':(1-wipe)*100+'%','--scan-opacity':ease(.305,.34,p)*(1-ease(.45,.50,p)),
  '--pointer-x':(second?mix(82,92,cursorMove):mix(75,50,cursorMove))+'%',
  '--pointer-y':(second?mix(38,14,cursorMove):mix(79,50,cursorMove))+'%',
  '--pointer-opacity':cursorAlpha,'--pointer-scale':1-.18*Math.sin(click*Math.PI),
  '--pulse-opacity':Math.sin(click*Math.PI)*cursorAlpha,'--pulse-scale':.42+click*1.62,
  '--play-opacity':1-ease(.28,.345,p),'--play-scale':1-.2*playClick,
  '--expand-opacity':ease(.50,.59,p)*(1-ease(.655,.72,p)),
  '--record-opacity':ease(.37,.49,p)*(1-out),'--guide-opacity':1-.82*expand
 };
 for(const [name,value] of Object.entries(props))stage.style.setProperty(name,value);
 stage.dataset.phase=p<.32?'still':p<.665?'playing':'wide';
}
if('IntersectionObserver'in window){
 new IntersectionObserver(([entry])=>{stageNear=entry.isIntersecting;measureStage()},{rootMargin:'160px'}).observe(track);
 if('ResizeObserver'in window)new ResizeObserver(measureStage).observe(stage);
}
document.addEventListener('visibilitychange',queue);
reduced.addEventListener('change',measureStage);
function scrollEffects(){
 tick=0;progress.style.transform='scaleX('+clamp(scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight))+')';
 if(!reduced.matches){
  const rect=timeline.getBoundingClientRect();timeline.style.setProperty('--timeline',clamp((innerHeight*.76-rect.top)/Math.max(1,rect.height)));
  if(scene.getBoundingClientRect().bottom>0)scene.style.setProperty('--hero-zoom',1.015+Math.min(.055,scrollY/12000));
 }
 paintStage();
}
function queue(){if(!tick)tick=requestAnimationFrame(scrollEffects)}
addEventListener('scroll',queue,{passive:true});addEventListener('resize',measureStage,{passive:true});queue();
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
if('IntersectionObserver'in window)new IntersectionObserver(([entry])=>{heroVisible=entry.isIntersecting;heroPlayback()},{threshold:.15}).observe(scene);
document.addEventListener('visibilitychange',heroPlayback);reduced.addEventListener('change',()=>{heroPlayback();if(reduced.matches){hero.classList.remove('ready');$$('.gallery-card video').forEach(v=>{v.pause();v.classList.remove('ready')})}});
const compare=$('.compare'),range=$('.compare-range'),cv=$('#compare-video'),cp=$('.compare-play'),compareNote=$('#compare-status'),compareExpand=$('.compare-expand');
const compareChoices=$$('[data-compare]');
function showCut(){compare.style.setProperty('--cut',range.value+'%');range.setAttribute('aria-valuetext',range.value+' % image fixe, '+(100-range.value)+' % vidéo')}
range.addEventListener('input',showCut);
function compareLabel(playing){cp.setAttribute('aria-pressed',String(playing));$('span',cp).textContent=playing?'Mettre en pause':cv.currentTime?'Reprendre la vidéo':'Lancer la vidéo';$('use',cp).setAttribute('href',playing?'#pause':'#play')}
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
 $('#compare-name').textContent=film.title;
 const credit=$('#compare-description a');credit.href=film.source;credit.textContent='Plan filmé : '+film.credit+' / Pexels';
 compareNote.textContent='';range.value='50';showCut();compareLabel(false);
 compareChoices.forEach(choice=>choice.setAttribute('aria-pressed',String(choice===button)));
}));
cp.addEventListener('click',()=>{
 if(!cv.paused){cv.pause();return}
 prepare(cv,cv.dataset.src);
 if(range.value==='100'){range.value='50';showCut()}
 cv.play().catch(()=>{compareNote.textContent='La vidéo n’a pas pu démarrer. Réessayez ou ouvrez la démonstration en grand.'});
});
if('IntersectionObserver'in window)new IntersectionObserver(([entry])=>{if(!entry.isIntersecting)cv.pause()}).observe(compare);
const dialog=$('#film-dialog'),player=$('#film-player'),playerStatus=$('#player-status'),fullscreen=$('#native-fullscreen');
let returnFocus;
function stopPreviews(){$$('.gallery-card video').forEach(v=>{v.pause();v.classList.remove('ready')})}
function openFilm(id,trigger){
 const filmed=comparisonFilms[id],film=filmed||films[id];if(!film)return;
 returnFocus=trigger;dialog.dataset.format=film.format;$('#film-title').textContent=film.title;
 $('#film-kind').textContent=filmed?'Plan filmé · '+film.credit+' / Pexels':'Animation numérique · Vidéo sans audio';
 playerStatus.textContent='';player.poster=media(id,'webp');player.src=media(id,'mp4');
 hero.pause();cv.pause();stagePlayback(false);stopPreviews();dialog.showModal();document.documentElement.classList.add('scroll-lock');
 player.play().catch(()=>{if(dialog.open)playerStatus.textContent='Utilisez la commande de lecture pour lancer le clip.'});
}
$$('[data-film]').forEach(el=>el.addEventListener('click',()=>openFilm(el.dataset.film,el)));
$('.dialog-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}});
dialog.addEventListener('close',()=>{player.pause();player.removeAttribute('src');player.load();document.documentElement.classList.remove('scroll-lock');returnFocus?.focus({preventScroll:true});heroPlayback();queue()});
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
