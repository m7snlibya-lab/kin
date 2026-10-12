import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const code=fs.readFileSync('dist/sw.js','utf8');
const cacheName='kin-shell-/family/-'+code.match(/const VERSION='([^']+)'/)[1];
function environment({failInstall=false,failCacheRead=false,networkAvailable=false}={}){
 const handlers={},stores=new Map([['kin-shell-/family/-old',new Map()],['kin-shell-/other/-old',new Map()],['unrelated-cache',new Map()]]);let skips=0,claims=0,networkCalls=0;
 const key=request=>{const u=new URL(typeof request==='string'?request:request.url);u.search='';u.hash='';return u.href};
 const caches={async open(name){if(!stores.has(name))stores.set(name,new Map());const entries=stores.get(name);return {async addAll(requests){if(failInstall)throw Error('Network failure');for(const r of requests){assert.equal(r.cache,'reload');const path=new URL(r.url).pathname.replace('/family/','');assert.ok(!path||fs.existsSync('dist/'+path),path)}for(const r of requests)entries.set(key(r),new Response('cached '+new URL(r.url).pathname))},async match(request){if(failCacheRead)throw Error('Cache unavailable');return entries.get(key(request))?.clone()}}},async keys(){return [...stores.keys()]},async delete(name){return stores.delete(name)}};
 const self={location:new URL('https://kin.test/family/sw.js'),addEventListener(name,handler){handlers[name]=handler},async skipWaiting(){skips++},clients:{async claim(){claims++}}};
 vm.runInNewContext(code,{self,caches,URL,Request,fetch:async()=>{networkCalls++;if(networkAvailable)return new Response('network recovery');throw Error('Offline')}});
 return {stores,get skips(){return skips},get claims(){return claims},get networkCalls(){return networkCalls},async dispatch(type,extra={}){let result,handled=false;handlers[type]({...extra,waitUntil(p){result=p},respondWith(p){handled=true;result=p}});return {handled,result:await result}}};
}
const e=environment();await e.dispatch('install');assert.equal(e.skips,0,'An update must not replace an open editor automatically');assert.equal(e.claims,0);assert.equal(e.stores.get(cacheName).size,16);
let r=await e.dispatch('fetch',{request:{method:'GET',url:'https://kin.test/family/#k1rDATA',mode:'navigate'}});assert.equal(await r.result.text(),'cached /family/index.html');
for(const path of ['app.js','birthdays.js','backup.js','i18n.js','help.js','core.js','vendor/pako.min.js','vendor/qr.js','manifest.webmanifest','icon-192.png','style.css']){r=await e.dispatch('fetch',{request:{method:'GET',url:'https://kin.test/family/'+path+'?v=3',mode:'cors'}});assert.equal(await r.result.text(),'cached /family/'+path)}assert.equal(e.networkCalls,0,'Offline shell must not contact network');
assert.equal((await e.dispatch('fetch',{request:{method:'POST',url:'https://kin.test/family/'}})).handled,false);assert.equal((await e.dispatch('fetch',{request:{method:'GET',url:'https://external.test/a'}})).handled,false);
await e.dispatch('message',{data:{type:'UNKNOWN'}});assert.equal(e.skips,0);await e.dispatch('message',{data:{type:'SKIP_WAITING'}});assert.equal(e.skips,1);await e.dispatch('activate');assert.equal(e.claims,1);assert.ok(!e.stores.has('kin-shell-/family/-old'));assert.ok(e.stores.has('unrelated-cache'));assert.ok(e.stores.has('kin-shell-/other/-old'),'Do not evict another installation');
const failed=environment({failInstall:true});await assert.rejects(failed.dispatch('install'),/Network failure/);assert.equal(failed.skips,0);assert.equal(failed.claims,0);
assert.equal((await e.dispatch('fetch',{request:{method:'GET',url:'https://kin.test/other/index.html',mode:'navigate'}})).handled,false,'Ignore navigation outside this app');
const recovery=environment({failCacheRead:true,networkAvailable:true});await recovery.dispatch('install');const recovered=await recovery.dispatch('fetch',{request:{method:'GET',url:'https://kin.test/family/style.css',mode:'cors'}});assert.equal(await recovered.result.text(),'network recovery');
console.log('PASS: offline navigation and assets, query handling, non-GET/external isolation, atomic install failure, explicit update activation, cache cleanup. This is a service-worker simulation, not a device/browser installation test.');
