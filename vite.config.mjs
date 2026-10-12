import {defineConfig} from 'vite';
export default defineConfig({
 root:'dist',
 server:{host:'127.0.0.1',allowedHosts:['terminal.local']},
 plugins:[{
  name:'retire-development-worker',
  apply:'serve',
  transformIndexHtml(html){
   // Vite injects development styles and a websocket client. The checked-in
   // production HTML retains its strict policy when served as static files.
   return html.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/,'');
  },
  configureServer(server){
   // Old development visits may have installed a release worker, which caches
   // Vite's transformed CSS as JavaScript. Retire it without reloading drafts.
   server.middlewares.use((request,response,next)=>{
    if(request.url?.split('?')[0]!=='/sw.js')return next();
    response.setHeader('Content-Type','text/javascript');
    response.setHeader('Cache-Control','no-store');
    response.end("self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));self.addEventListener('activate',event=>event.waitUntil((async()=>{await self.clients.claim();await self.registration.unregister()})()));");
   });
  }
 }]
});
