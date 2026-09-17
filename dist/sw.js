const CACHE='kin-shell-v7';
const FILES=['./','./index.html','./style.css','./app.js','./i18n.js','./help.js','./core.js','./backup.js','./birthdays.js','./hijri-data.js','./vendor/pako.min.js','./vendor/qr.js','./icon.svg','./icon-192.png','./icon-512.png','./manifest.webmanifest'];
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(CACHE);
 // Reload from the network for a complete release, rather than copying stale HTTP-cache entries.
 await cache.addAll(FILES.map(path=>new Request(new URL(path,self.location.href),{cache:'reload'})));
 // First installs activate normally; updates wait for the user to finish editing.
})()));
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')event.waitUntil(self.skipWaiting())});
self.addEventListener('activate',event=>event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith('kin-shell-')&&k!==CACHE).map(k=>caches.delete(k)));await self.clients.claim()})()));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin)return;
 event.respondWith((async()=>{const cache=await caches.open(CACHE);const hit=await cache.match(event.request.mode==='navigate'?new URL('./index.html',self.location.href).href:event.request,{ignoreSearch:true});return hit||fetch(event.request)})());
});
