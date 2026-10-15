const VERSION='1.12.0';
// CacheStorage is shared by every application on this origin. Keep releases
// and cleanup isolated to this installation's path.
const SCOPE=new URL('./',self.location.href);
const PREFIX='kin-shell-'+SCOPE.pathname+'-';
const CACHE=PREFIX+VERSION;
const FILES=['./','./index.html','./startup.js','./style.css','./readable.css','./comfort.js','./icons.js','./vendor/lucide-LICENSE.txt','./app.js','./i18n.js','./help.js','./core.js','./backup.js','./birthdays.js','./domain.js','./device.js','./family-store.js','./state.js','./ui.js','./views.js','./workbench.js','./documents.js','./document-ui.js','./features-i18n.js','./vendor/pdf-lib.min.js','./fonts/IBMPlexSansArabic-Regular.woff2','./fonts/IBMPlexSansArabic-Medium.woff2','./fonts/IBMPlexSansArabic-SemiBold.woff2','./fonts/OFL-Plex.txt','./fonts/NotoSans.ttf','./fonts/NotoSansArabic.ttf','./hijri-data.js','./vendor/pako.min.js','./vendor/qr.js','./icon.svg','./icon-192.png','./icon-512.png','./manifest.webmanifest'];
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(CACHE);
 // Reload from the network for a complete release, rather than copying stale HTTP-cache entries.
 await cache.addAll(FILES.map(path=>new Request(new URL(path,self.location.href),{cache:'reload'})));
 // First installs activate normally; updates wait for the user to finish editing.
})()));
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')event.waitUntil(self.skipWaiting())});
self.addEventListener('activate',event=>event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)));await self.clients.claim()})()));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==SCOPE.origin||!url.pathname.startsWith(SCOPE.pathname))return;
 event.respondWith((async()=>{try{const cache=await caches.open(CACHE);const hit=await cache.match(event.request.mode==='navigate'?new URL('./index.html',self.location.href).href:event.request,{ignoreSearch:true});if(hit)return hit}catch{/* Evicted or inaccessible cache: allow online recovery. */}return fetch(event.request)})());
});
