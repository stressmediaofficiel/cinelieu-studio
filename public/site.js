const $=(s,root=document)=>root.querySelector(s), $$=(s,root=document)=>[...root.querySelectorAll(s)];
const reduced=matchMedia('(prefers-reduced-motion: reduce)'), mouse=matchMedia('(hover:hover) and (pointer:fine)');
const films={
 villa:{title:'Villa provençale',format:'horizontal'},
 appartement:{title:'Appartement haussmannien',format:'vertical'},
 chalet:{title:'Chalet des Alpes',format:'horizontal'},
 location:{title:'Escale méditerranéenne',format:'vertical'}
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
function scrollEffects(){
 tick=0;progress.style.transform='scaleX('+clamp(scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight))+')';
 if(!reduced.matches){
  const rect=timeline.getBoundingClientRect();timeline.style.setProperty('--timeline',clamp((innerHeight*.76-rect.top)/Math.max(1,rect.height)));
  if(scene.getBoundingClientRect().bottom>0)scene.style.setProperty('--hero-zoom',1.015+Math.min(.055,scrollY/12000));
 }
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
if('IntersectionObserver'in window)new IntersectionObserver(([entry])=>{heroVisible=entry.isIntersecting;heroPlayback()},{threshold:.15}).observe(scene);
document.addEventListener('visibilitychange',heroPlayback);reduced.addEventListener('change',()=>{heroPlayback();if(reduced.matches){hero.classList.remove('ready');$$('.gallery-card video').forEach(v=>{v.pause();v.classList.remove('ready')})}});
const compare=$('.compare'),range=$('.compare-range'),cv=$('#compare-video'),cp=$('.compare-play'),compareNote=$('.compare-footer > div > span');
range.addEventListener('input',()=>{compare.style.setProperty('--cut',range.value+'%');range.setAttribute('aria-valuetext',range.value+' % photo, '+(100-range.value)+' % animation')});
function compareLabel(playing){cp.setAttribute('aria-pressed',String(playing));$('span',cp).textContent=playing?'Mettre en pause':cv.currentTime?'Reprendre la vidéo':'Lancer la vidéo';$('use',cp).setAttribute('href',playing?'#pause':'#play')}
cv.addEventListener('playing',()=>compareLabel(true));cv.addEventListener('pause',()=>compareLabel(false));
cp.addEventListener('click',()=>{
 if(!cv.paused){cv.pause();return}
 prepare(cv,cv.dataset.src);
 if(range.value==='100'){range.value='50';range.dispatchEvent(new Event('input'))}
 cv.play().catch(()=>{compareNote.textContent='La vidéo n’a pas pu démarrer. Réessayez ou ouvrez la démonstration en grand.'});
});
if('IntersectionObserver'in window)new IntersectionObserver(([entry])=>{if(!entry.isIntersecting)cv.pause()}).observe(compare);
const dialog=$('#film-dialog'),player=$('#film-player'),playerStatus=$('#player-status'),fullscreen=$('#native-fullscreen');
let returnFocus;
function stopPreviews(){$$('.gallery-card video').forEach(v=>{v.pause();v.classList.remove('ready')})}
function openFilm(id,trigger){
 const film=films[id];if(!film)return;
 returnFocus=trigger;dialog.dataset.format=film.format;$('#film-title').textContent=film.title;
 playerStatus.textContent='';player.poster=media(id,'webp');player.src=media(id,'mp4');
 hero.pause();cv.pause();stopPreviews();dialog.showModal();document.documentElement.classList.add('scroll-lock');
 player.play().catch(()=>{if(dialog.open)playerStatus.textContent='Utilisez la commande de lecture pour lancer le clip.'});
}
$$('[data-film]').forEach(el=>el.addEventListener('click',()=>openFilm(el.dataset.film,el)));
$('.dialog-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}});
dialog.addEventListener('close',()=>{player.pause();player.removeAttribute('src');player.load();document.documentElement.classList.remove('scroll-lock');returnFocus?.focus({preventScroll:true});heroPlayback()});
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
