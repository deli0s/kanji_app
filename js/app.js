import {DB} from './db.js';
import {loadData} from './data.js';
import {router,go} from './router.js';
import {schedule,progress} from './lesson.js';
import {mountTrace,clearTrace,showStrokeOrder} from './stroke.js';

let D, app=document.querySelector('#app');
let state={lang:'es',route:router(),tab:'hiragana',lesson:null,reviewId:null,menu:false};

const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

async function init(){
  try{
    D=await loadData();
    const lang=await DB.get('settings','lang');
    if(lang)state.lang=lang.value;
    installErrorHandlers();
    render();
    window.addEventListener('hashchange',()=>{state.route=router();state.menu=false;render()});
    if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>toast('No se pudo activar el modo offline. Puedes seguir usando la app.','warn'));
  }catch(e){
    console.error(e);
    document.querySelector('#app').innerHTML='<div class="fatal"><h1>Kanji Kōri</h1><p>No se ha podido cargar el contenido local.</p><button class="btn primary" onclick="location.reload()">Reintentar</button></div>';
  }
}

function installErrorHandlers(){
  window.addEventListener('error',e=>{console.error(e.error||e.message);toast('Ha ocurrido un problema inesperado. La app sigue funcionando.','error')});
  window.addEventListener('unhandledrejection',e=>{console.error(e.reason);toast('No se ha podido completar esa acción.','error')});
}

async function stats(){
  const ps=await DB.all('progress'),rs=await DB.all('reviews');
  return {seen:ps.reduce((a,x)=>a+(x.seen||0),0),correct:ps.reduce((a,x)=>a+(x.correct||0),0),reviews:rs.filter(x=>x.due<=Date.now()).length};
}

const routes=[
 ['home','Inicio','⌂'],['learn','Aprender','＋'],['review','Repasar','↻'],['kanji','Kanji','漢'],['vocab','Vocabulario','語'],['grammar','Gramática','文'],['kana','Kana','あ'],['reading','Lectura','読'],['culture','Cultura','和'],['settings','Ajustes','⚙']
];
function nav(){return `<aside class="sidebar"><div class="brand"><div class="brand-mark">漢</div><div><strong>Kanji Kōri</strong><small>japonés offline</small></div></div><nav>${routes.map(([r,t,i])=>navBtn(r,t,i)).join('')}</nav></aside>`}
function navBtn(r,t,i){return `<button class="${state.route===r?'active':''}" data-go="${r}"><span>${i}</span>${t}</button>`}
function mobile(){return `<div class="mobilebar"><div class="mobile-primary">${routes.slice(0,4).map(([r,t,i])=>`<button class="${state.route===r?'active':''}" data-go="${r}"><span>${i}</span>${t}</button>`).join('')}<button class="${state.menu?'active':''}" data-menu><span>☰</span>Más</button></div>${state.menu?`<div class="mobile-menu"><div class="mobile-menu-head"><b>Secciones</b><button class="icon-btn" data-menu-close>×</button></div>${routes.slice(4).map(([r,t,i])=>navBtn(r,t,i)).join('')}</div>`:''}</div>`}
async function render(){const s=await stats();app.innerHTML=`<div class="shell">${nav()}<main class="main">${view(s)}</main>${mobile()}</div>`;bind()}
function header(kicker,title,sub=''){return `<div class="top"><div><div class="eyebrow">${kicker}</div><div class="h1">${title}</div>${sub?`<div class="muted">${sub}</div>`:''}</div></div>`}
function view(s){switch(state.route){case'home':return home(s);case'learn':return learn();case'review':return review(s);case'kanji':return kanji();case'vocab':return vocab();case'grammar':return grammar();case'kana':return kana();case'reading':return reading();case'culture':return culture();case'settings':return settings();default:return home(s)}}
function home(s){return `${header('Tu recorrido','Japonés, conectado.','El kanji es el eje, no una isla.') }<div class="grid"><section class="card span-8"><div class="eyebrow">Sesión de hoy</div><h2>Construye conexiones, no listas.</h2><p class="muted">Aprende un carácter y úsalo en palabras, frases y ejercicios. El sistema guarda tu progreso en este dispositivo.</p><div class="actions"><button class="btn primary" data-go="learn">Empezar sesión</button><button class="btn" data-go="review">Repasar ahora</button></div></section><section class="card span-4"><div class="stats"><div class="stat"><b>${s.seen}</b><span class="muted">respuestas</span></div><div class="stat"><b>${s.correct}</b><span class="muted">aciertos</span></div><div class="stat"><b>${s.reviews}</b><span class="muted">pendientes</span></div></div></section><section class="card span-6"><h3>Ruta inicial</h3><p class="muted">Kana → kanji → vocabulario → gramática → lectura.</p><div class="progress"><i style="width:${Math.min(100,s.seen/20*100)}%"></i></div><p class="muted">${Math.min(20,s.seen)} / 20 interacciones</p></section><section class="card span-6"><h3>Tu biblioteca</h3><div class="list"><div class="item"><span>漢字</span><span class="pill">${D.kanji.length} disponibles</span></div><div class="item"><span>語彙</span><span class="pill">${D.vocab.length} disponibles</span></div><div class="item"><span>文法</span><span class="pill">${D.grammar.length} disponibles</span></div></div></section></div>`}

function choices(correct, pool){
  const values=[correct,...pool.filter(x=>x&&x!==correct)];
  return [...new Set(values)].slice(0,4).sort(()=>Math.random()-.5);
}
function kanjiChoices(k){return choices(k.meanings[0],D.kanji.filter(x=>x.available!==false).flatMap(x=>x.meanings||[]))}
function vocabChoices(v){return choices(v.meaning.es,D.vocab.map(x=>x.meaning.es))}

function learn(){
  if(!state.lesson)state.lesson={i:0,phase:'kanji'};
  const available=D.kanji.filter(k=>k.available!==false); const k=available[state.lesson.i%available.length],q=state.lesson.phase;
  let body='';
  if(q==='kanji'){
    const cs=kanjiChoices(k);body=`<div class="exercise"><div><div class="big-jp">${k.char}</div><h2>¿Qué significa principalmente?</h2><div class="choice-grid">${cs.map(m=>`<button class="btn choice" data-kanswer="${esc(m)}" data-correct="${esc(k.meanings[0])}">${esc(m)}</button>`).join('')}</div></div></div>`;
  }else if(q==='vocab'){
    const vs=D.vocab.filter(v=>v.kanji.includes(k.id));const v=vs[0]||D.vocab[0];const cs=vocabChoices(v);body=`<div class="exercise"><div><div class="big-jp">${v.word}</div><p class="muted">${v.reading}</p><h2>¿Qué significa?</h2><div class="choice-grid">${cs.map(m=>`<button class="btn choice" data-vanswer="${esc(m)}" data-correct="${esc(v.meaning.es)}">${esc(m)}</button>`).join('')}</div></div></div>`;
  }else if(q==='trace'){
    body=`<div><div class="exercise"><div><h2>Escribe ${k.char}</h2><p class="muted">Sigue el modelo y practica el gesto.</p><div class="canvas-wrap" id="trace"><div class="trace-guide">${k.char}</div><canvas></canvas></div><div class="actions"><button class="btn" data-stroke>Ver trazos</button><button class="btn" data-clear>Limpiar</button><button class="btn primary" data-tracedone>Continuar</button></div></div></div></div>`;
  }else{
    const g=D.grammar[state.lesson.i%D.grammar.length];body=`<div class="exercise"><div><div class="eyebrow">Gramática conectada</div><h2>${g.title}</h2><p>${g.explanation.es}</p><p class="big-jp">${g.example}</p><p class="muted">${g.translation}</p><button class="btn primary" data-gdone>Continuar</button></div></div>`;
  }
  return `<div class="lesson">${header('Sesión guiada',`${state.lesson.i+1}. ${q==='kanji'?'Kanji':q==='vocab'?'Vocabulario':q==='trace'?'Escritura':'Gramática'}`,'La siguiente actividad depende de la anterior.')}<div class="card">${body}</div></div>`;
}
function next(){const phases=['kanji','vocab','trace','grammar'];const n=phases.indexOf(state.lesson.phase);if(n<3)state.lesson.phase=phases[n+1];else{state.lesson.i++;state.lesson.phase='kanji'}render()}

async function review(s){
  let due=await DB.all('reviews');due=due.filter(x=>x.due<=Date.now());
  const items=due.map(x=>D.kanji.find(k=>k.id===x.id)).filter(Boolean).slice(0,8);
  if(state.reviewId){const k=D.kanji.find(x=>x.id===state.reviewId && x.available!==false);if(k)return reviewCard(k)}
  return `${header('Memoria','Repaso','La prioridad sale de tu historial local.') }<div class="card"><div class="review-head"><div><b>${items.length||0}</b><span class="muted"> pendientes ahora</span></div><button class="btn primary" data-review-start="${items[0]?.id||''}" ${items.length?'':'disabled'}>Practicar</button></div><div class="list">${items.length?items.map(k=>`<div class="item"><span><span class="kanji-sm">${k.char}</span> ${esc(k.meanings[0])}</span><button class="btn" data-review="${k.id}">Practicar</button></div>`).join(''):'<div class="empty">No tienes repasos pendientes. Aprende algo nuevo y volverán a aparecer aquí.</div>'}</div></div>`;
}
function reviewCard(k){const cs=kanjiChoices(k);return `${header('Repaso',`¿Qué significa ${k.char}?`,'Elige una respuesta y el intervalo se ajustará automáticamente.') }<section class="card lesson-review"><div class="big-jp">${k.char}</div><div class="choice-grid">${cs.map(m=>`<button class="btn choice" data-review-answer="${esc(m)}" data-correct="${esc(k.meanings[0])}" data-review-id="${k.id}">${esc(m)}</button>`).join('')}</div><button class="btn" data-review-back>Volver</button></section>`}

function kanji(){return `${header('Biblioteca','Kanji','Busca por carácter, significado o lectura. Nivel 5 = inicio, nivel 1 = más avanzado.') }<input class="search" id="kanjiSearch" placeholder="Buscar por kanji, significado o lectura..."><div class="grid kanji-grid" id="kanjiList">${D.kanji.map(k=>`<section class="card span-4 kanji-card"><div class="kanji">${k.char}</div><h3>${esc(k.meanings.join(' / '))}</h3><p class="muted">${k.onyomi?.length?'音 '+k.onyomi.join(' · '):'Lecturas disponibles al ampliar este registro'}${k.kunyomi?.length?`<br>訓 ${k.kunyomi.join(' · ')}`:''}</p><span class="pill">Nivel ${k.level}</span>${k.available===false?'<span class="pill basic">Ficha básica</span>':''}</section>`).join('')}</div>`}
function vocab(){return `${header('Biblioteca','Vocabulario','Palabras conectadas a los kanji del recorrido.') }<div class="list">${D.vocab.map(v=>`<div class="item"><div><b class="big-jp" style="font-size:28px">${v.word}</b><div class="muted">${v.reading} · ${v.meaning.es}</div></div><button class="btn" data-speak="${encodeURIComponent(v.word)}">🔊</button></div>`).join('')}</div>`}
function grammar(){return `${header('Biblioteca','Gramática','Explicaciones pensadas para hablantes de español.') }<div class="list">${D.grammar.map(g=>`<section class="card"><div class="eyebrow">Nivel ${g.level}</div><h2>${g.title}</h2><p>${g.explanation.es}</p><p class="big-jp" style="font-size:30px">${g.example}</p><p class="muted">${g.translation}</p></section>`).join('')}</div>`}
function kana(){const a=D.kana[state.tab];return `${header('Base','Kana','No desaparece al llegar al kanji. Mantén la lectura activa.') }<div class="tabs"><button class="btn ${state.tab==='hiragana'?'primary':''}" data-kana="hiragana">ひらがな</button><button class="btn ${state.tab==='katakana'?'primary':''}" data-kana="katakana">カタカナ</button></div><div class="grid">${a.map(([c,r])=>`<section class="card span-4"><div class="kanji-sm">${c}</div><b>${r}</b><button class="btn" data-speak="${encodeURIComponent(c)}">🔊</button></section>`).join('')}</div>`}
function reading(){const v=D.vocab[Math.min(4,D.vocab.length-1)];return `${header('Práctica','Lectura','Textos cortos construidos con el vocabulario local.') }<section class="card"><div class="big-jp" style="font-size:32px">${v.sentence}</div><p>${v.sentenceEs}</p><hr style="border-color:var(--line)"><p class="muted">Palabra foco: ${v.word} · ${v.reading}</p><button class="btn" data-speak="${encodeURIComponent(v.sentence)}">🔊 Escuchar</button></section>`}
function culture(){return `${header('Contexto','Cultura','Contexto que ayuda a entender el idioma, no una colección de curiosidades.') }<div class="list">${D.culture.map(x=>`<section class="card"><h2>${x.title}</h2><p>${x.body}</p></section>`).join('')}</div>`}
function settings(){return `${header('Sistema','Ajustes','Todo el progreso permanece en este dispositivo.') }<section class="card"><h3>Idioma de interfaz</h3><div class="actions"><button class="btn ${state.lang==='es'?'primary':''}" data-lang="es">Español</button><button class="btn ${state.lang==='en'?'primary':''}" data-lang="en">English</button></div><h3 style="margin-top:25px">Privacidad</h3><p class="muted">Sin cuenta, sin servidor y sin telemetría en esta versión. Los datos de aprendizaje viven en IndexedDB.</p><h3>IA local</h3><p class="muted">La arquitectura reserva un adaptador para modelos WebGPU/WASM. No se necesita ningún modelo para usar el currículo.</p></section>`}

function bind(){
  document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{state.menu=false;go(b.dataset.go)});
  document.querySelector('[data-menu]')?.addEventListener('click',()=>{state.menu=!state.menu;render()});
  document.querySelector('[data-menu-close]')?.addEventListener('click',()=>{state.menu=false;render()});
  document.querySelectorAll('[data-kanswer]').forEach(b=>b.onclick=async()=>{const available=D.kanji.filter(k=>k.available!==false),k=available[state.lesson.i%available.length],ok=b.dataset.kanswer===b.dataset.correct;await progress(k.id,ok?'correct':'wrong');await schedule(k.id,ok?4:1);markChoice(b,ok);setTimeout(next,300)});
  document.querySelectorAll('[data-vanswer]').forEach(b=>b.onclick=async()=>{const ok=b.dataset.vanswer===b.dataset.correct;await progress('vocab-'+state.lesson.i,ok?'correct':'wrong');markChoice(b,ok);setTimeout(next,300)});
  document.querySelector('[data-tracedone]')?.addEventListener('click',async()=>{await progress('trace-'+state.lesson.i,'correct');next()});
  document.querySelector('[data-gdone]')?.addEventListener('click',next);
  const tr=document.querySelector('#trace');if(tr){const available=D.kanji.filter(k=>k.available!==false),k=available[state.lesson.i%available.length];mountTrace(tr,k)}
  document.querySelector('[data-stroke]')?.addEventListener('click',()=>{const available=D.kanji.filter(k=>k.available!==false),k=available[state.lesson.i%available.length];showStrokeOrder(document.querySelector('#trace canvas'),k.strokes||[])});
  document.querySelector('[data-clear]')?.addEventListener('click',()=>clearTrace(document.querySelector('#trace canvas')));
  document.querySelectorAll('[data-kana]').forEach(b=>b.onclick=()=>{state.tab=b.dataset.kana;render()});
  document.querySelectorAll('[data-speak]').forEach(b=>b.onclick=()=>speak(decodeURIComponent(b.dataset.speak)));
  document.querySelectorAll('[data-lang]').forEach(b=>b.onclick=async()=>{state.lang=b.dataset.lang;await DB.put('settings',{id:'lang',value:state.lang});render()});
  const input=document.querySelector('#kanjiSearch');input?.addEventListener('input',()=>{const q=input.value.toLowerCase().trim();document.querySelectorAll('#kanjiList .kanji-card').forEach(el=>{const hay=el.dataset.search||el.textContent.toLowerCase();el.style.display=hay.includes(q)?'':'none'})});
  document.querySelectorAll('.kanji-card').forEach((el,i)=>{const k=D.kanji[i];el.dataset.search=[k.char,...(k.meanings||[]),...(k.onyomi||[]),...(k.kunyomi||[])].join(' ').toLowerCase()});
  document.querySelectorAll('[data-review]').forEach(b=>b.onclick=()=>{state.reviewId=b.dataset.review;render()});
  document.querySelector('[data-review-start]')?.addEventListener('click',()=>{if(document.querySelector('[data-review-start]').dataset.reviewStart){state.reviewId=document.querySelector('[data-review-start]').dataset.reviewStart;render()}});
  document.querySelector('[data-review-back]')?.addEventListener('click',()=>{state.reviewId=null;render()});
  document.querySelectorAll('[data-review-answer]').forEach(b=>b.onclick=async()=>{const ok=b.dataset.reviewAnswer===b.dataset.correct;await progress(b.dataset.reviewId,ok?'correct':'wrong');await schedule(b.dataset.reviewId,ok?4:1);markChoice(b,ok);setTimeout(()=>{state.reviewId=null;render()},350)});
}
function markChoice(b,ok){b.classList.add(ok?'correct':'wrong');document.querySelectorAll('.choice').forEach(x=>x.disabled=true);if(!ok){const correct=document.querySelector('.choice[data-correct="'+CSS.escape(b.dataset.correct)+'"]');correct?.classList.add('correct')}}
function speak(t){if('speechSynthesis'in window){speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang='ja-JP';u.rate=.85;speechSynthesis.speak(u)}else toast('Tu navegador no ofrece síntesis de voz.','warn')}
function toast(t,type='info'){const x=document.createElement('div');x.className=`toast ${type}`;x.innerHTML=`<span class="toast-dot"></span><span>${esc(t)}</span>`;document.body.appendChild(x);setTimeout(()=>x.remove(),3200)}
init();
