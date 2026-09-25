const CACHE='kanji-kori-v4';
const ASSETS=['./','./index.html','./manifest.webmanifest','./css/app.css','./js/app.js','./js/db.js','./js/router.js','./js/data.js','./js/kanji-catalog.js','./js/lesson.js','./js/stroke.js','./data/curriculum.json','./data/kana.json','./data/kanji.json','./assets/icon.svg'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(caches.match(e.request).then(cached=>cached||fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r}).catch(()=>caches.match('./index.html'))))});
