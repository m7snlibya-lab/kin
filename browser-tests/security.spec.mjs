import {test,expect} from '@playwright/test';
import '../dist/vendor/pako.min.js';
import {encode,calendars} from '../dist/core.js';
import {createBackup} from '../dist/backup.js';
const name='<img src=x onerror=alert(1)>',records=[{id:'cDAwMDAx',name,calendar:'g',day:calendars.g.toDay(2000,1,1)}];
const hash=encode(records);
async function keep(page){await page.goto('./'+hash);await page.locator('#confirm-merge').click();await expect(page.locator('#modal')).toBeHidden()}

test('release server sends anti-framing and privacy headers',async({request,baseURL})=>{
 // GitHub Pages does not support custom response headers. Its fallback is tested below.
 test.skip(new URL(baseURL).hostname!=='127.0.0.1','Header configuration belongs to the local/static server');
 const response=await request.get('./');expect(response.headers()['x-frame-options']).toBe('DENY');expect(response.headers()['referrer-policy']).toBe('no-referrer');expect(response.headers()['content-security-policy']).toContain("frame-ancestors 'none'");
});

test('embedded Pages fallback never loads app code or reads device storage',async({page,baseURL})=>{
 const target=new URL('./',baseURL).href,parent=new URL(baseURL).protocol+'//embedding.test/',requests=[];
 await page.addInitScript(()=>{
  window.securityStorageReads=0;const original=Storage.prototype.getItem;
  Storage.prototype.getItem=function(...args){window.securityStorageReads++;return original.apply(this,args)};
 });
 // Simulate the public host, which has meta CSP but no framing response headers.
 await page.route(target,async route=>{const response=await route.fetch(),headers={...response.headers()};delete headers['x-frame-options'];delete headers['content-security-policy'];await route.fulfill({response,headers})});
 page.on('request',request=>requests.push(new URL(request.url()).pathname));
 await page.route(parent,route=>route.fulfill({contentType:'text/html',body:`<!doctype html><iframe src="${target}"></iframe><iframe sandbox="allow-scripts" src="${target}"></iframe>`}));
 await page.goto(parent,{waitUntil:'domcontentloaded'});
 const ordinary=page.frameLocator('iframe').nth(0),sandboxed=page.frameLocator('iframe').nth(1);
 await expect(ordinary.locator('#embedded-notice')).toBeVisible();await expect(ordinary.locator('#add-button')).toHaveCount(0);
 await expect(ordinary.getByRole('link',{name:'Open Kin'})).toHaveAttribute('rel','noopener noreferrer');
 // Chromium blocks ALL 'self' scripts/styles in an opaque-origin sandbox;
 // Firefox can run the safe notice. Both paths must expose no family data.
 expect((await sandboxed.locator('#today-g').allTextContents()).join('')).toBe('');await expect(sandboxed.locator('.person-card')).toHaveCount(0);
 for(const frame of page.frames().slice(1))expect(await frame.evaluate(()=>window.securityStorageReads)).toBe(0);
 expect(requests.some(path=>path.endsWith('/app.js')||path.endsWith('/sw.js'))).toBe(false);
});

test('untrusted names stay literal in import review, cards, list, table and months',async({page})=>{
 const dialogs=[],errors=[];page.on('dialog',async dialog=>{dialogs.push(dialog.message());await dialog.dismiss()});page.on('pageerror',error=>errors.push(error.message));
 await page.goto('./'+hash);await expect(page.locator('#modal-body')).toContainText(name);expect(await page.locator('#modal-body img').count()).toBe(0);
 await page.locator('#confirm-merge').click();await expect(page.locator('.person-card h3')).toHaveText(name);
 for(const layout of ['list','table','cards']){await page.locator(`[data-layout="${layout}"]`).click();await expect(page.locator('#people')).toContainText(name);expect(await page.locator('#people img').count()).toBe(0)}
 await page.locator('#birthdays-tab').click();await page.locator('#month-view').click();await expect(page.locator('#birthday-month-view')).toContainText(name);expect(await page.locator('#birthday-month-view img').count()).toBe(0);
 expect(dialogs).toEqual([]);expect(errors).toEqual([]);
});

test('family data never leaves in HTTP requests or referrers',async({page,baseURL})=>{
 const requests=[];page.on('request',request=>requests.push({url:request.url(),referrer:request.headers().referer||'',method:request.method(),body:request.postData()}));
 await keep(page);await page.locator('#share-button').click();await expect(page.locator('#share-url')).toHaveValue(new URL('./',baseURL).href+hash);
 expect(requests.length).toBeGreaterThan(0);
 const publicReferrers=['',...['readable.css','style.css'].map(path=>new URL(path,baseURL).href)];
 for(const request of requests){
  expect(new URL(request.url).origin).toBe(new URL(baseURL).origin);
  expect(decodeURIComponent(request.url)).not.toContain('#k1');expect(request.referrer).not.toContain('#k1');
  expect(['GET','HEAD']).toContain(request.method);expect(request.body).toBeNull();
  // A CSS-initiated font request can name its public stylesheet on Pages,
  // where only the document (not the CSS response) has no-referrer policy.
  expect(publicReferrers).toContain(request.referrer);
 }
});

test('corrupted settings cannot break initial rendering or cross-tab saves',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.addInitScript(()=>localStorage.setItem('kin.device.v1:'+location.pathname,'{"version":1,"groups":[{"id":"bad","name":"Broken","members":null}],"preferences":{"__proto__":{"polluted":true}}}'));
 await keep(page);
 await page.evaluate(()=>localStorage.setItem('kin.device.v1:'+location.pathname,'{"version":1,"groups":[{"id":"bad","name":12}],"preferences":{"constructor":{},"layout":"list"}}'));
 await page.locator('[data-layout="table"]').click();await expect(page.locator('#people')).toContainText(name);
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('kin.device.v1:'+location.pathname)));
 expect(saved.groups).toEqual([]);expect(saved.preferences.layout).toBe('table');expect(Object.hasOwn(saved.preferences,'constructor')).toBe(false);expect(errors).toEqual([]);
});

// These tests deliberately bypass CSP ONLY in isolated test contexts. Escaping
// must hold on its own; a blocked inline handler is not proof of safe rendering.
test.describe('XSS defenses independently of CSP',()=>{
 test.use({bypassCSP:true,serviceWorkers:'block'});
 const payloads=[
  '<img src=x onerror=globalThis.__kinXss++>',
  '"><svg onload=globalThis.__kinXss++>',
  '</option><img src=x onerror=globalThis.__kinXss++>',
  '</textarea><svg onload=globalThis.__kinXss++>',
  '<a href="javascript:globalThis.__kinXss++">tap</a>',
  '&lt;img src=x onerror=globalThis.__kinXss++&gt;',
  '<math><mtext><img src=x onerror=globalThis.__kinXss++>',
  '" autofocus onfocus="globalThis.__kinXss++',
  '</script><script>globalThis.__kinXss++</script>',
  '<iframe srcdoc="<script>parent.__kinXss++</script>">',
  '<form id=modal><input name=close>',
  '${globalThis.__kinXss++}',
  '{{constructor.constructor("globalThis.__kinXss++")()}}'
 ];
 const hostile=payloads.map((name,i)=>({id:Buffer.from('x'+String(i).padStart(5,'0')).toString('base64url'),name,calendar:i%2?'h':'g',day:calendars.g.toDay(1980+i,1+i%12,1)}));
 const errors=new WeakMap();
 async function safe(page){
  expect(await page.evaluate(()=>({
   executions:globalThis.__kinXss,
   handlers:[...document.querySelectorAll('*')].flatMap(el=>[...el.attributes].filter(a=>/^on/i.test(a.name)).map(a=>a.name)),
   injected:document.querySelectorAll('iframe,object,embed,script:not([src]),main img,#modal-body img,a[href^="javascript:"]').length,
   dialogs:document.querySelectorAll('#modal').length
  }))).toEqual({executions:0,handlers:[],injected:0,dialogs:1});
 }
 async function namesAt(page,selector){
  const text=await page.locator(selector).textContent();for(const name of payloads)expect(text).toContain(name);await safe(page);
 }
 async function locale(page,value){await page.evaluate(value=>localStorage.setItem('kin.language',value),value)}
 test.beforeEach(async({page})=>{
  errors.set(page,[]);page.on('pageerror',error=>errors.get(page).push(error.message));
  await page.addInitScript(()=>{globalThis.__kinXss=0});
  await page.goto('./');await expect(page.locator('#today-g')).not.toBeEmpty();
  // Positive control: prove an unescaped handler really executes in this context.
  expect(await page.evaluate(()=>new Promise(resolve=>{
   const img=document.createElement('img');img.setAttribute('onerror','globalThis.__kinXss++');
   img.addEventListener('error',()=>queueMicrotask(()=>{img.remove();resolve(globalThis.__kinXss);globalThis.__kinXss=0}),{once:true});
   img.src='data:,';document.body.append(img);
  }))).toBe(1);
 });
 test.afterEach(async({page})=>{await safe(page);expect(errors.get(page)).toEqual([])});

 test('shared and stored payloads remain text in all views and text/attribute contexts',async({page})=>{
  test.setTimeout(120000);
  for(const language of ['en','ar']){
   await locale(page,language);await page.goto('./'+encode(hostile));await page.reload();await expect(page.locator('#today-g')).not.toBeEmpty();
   if(await page.locator('#confirm-merge').isVisible()){await namesAt(page,'#modal-body');await page.locator('#confirm-merge').click()}
   await page.locator('#people-tab').click();await page.locator('[data-layout="cards"]').click();await namesAt(page,'#people');
   await page.locator('[data-edit="'+hostile[0].id+'"]').click();await expect(page.locator('#person-name')).toHaveValue(payloads[0]);await safe(page);await page.locator('#cancel-person').click();
   for(const layout of ['list','table','cards']){await page.locator(`[data-layout="${layout}"]`).click();await namesAt(page,'#people')}
   await page.locator('#compare-open').click();await namesAt(page,'#compare-a');await safe(page);await page.locator('#close-modal').click();
   await page.locator('#timeline-tab').click();await page.locator('#timeline-mode').selectOption('births');await namesAt(page,'#timeline-content');
   await page.locator('#people-tab').click();await page.locator('#share-button').click();await namesAt(page,'#share-selection');await page.locator('#close-modal').click();
   await page.locator('#birthdays-tab').click();await page.locator('#upcoming-view').click();await page.locator('#birthday-range').selectOption('365');await page.locator('#birthday-calendar').selectOption('both');await namesAt(page,'#birthday-list');
   await page.locator('#ics-open').click();await namesAt(page,'#modal-body');await page.locator('#cancel-export').click();
   await page.locator('#month-view').click();for(const calendar of ['g','h']){await page.locator(`[data-month-calendar="${calendar}"]`).click();await namesAt(page,'#birthday-month-view')}
   await page.locator('#print-open').click();await expect(page.locator('#download-pdf')).toBeEnabled({timeout:20000});await namesAt(page,'#document-selection');await safe(page);await page.locator('#close-modal').click();
   await page.reload();await expect(page.locator('#today-g')).not.toBeEmpty();await safe(page);
  }
 });

 test('backup conflicts, persisted group labels and search cannot inject markup or clobber controls',async({page})=>{
  test.setTimeout(120000);
  const groupId='"><svg onload=globalThis.__kinXss++>';
  for(const language of ['en','ar']){
   await locale(page,language);
   await page.evaluate(({groupId,people,names})=>{
    localStorage.setItem('kin.device.v1:'+location.pathname,JSON.stringify({version:1,groups:names.map((name,i)=>({id:i?'group'+i:groupId,name,members:people.map(p=>p.id)})),preferences:{view:'people',layout:'cards'}}));
   },{groupId,people:hostile,names:payloads});
   const original=hostile.map(p=>({...p,name:'Safe '+p.id}));await page.goto('./'+encode(original));await page.reload();
   await expect(page.locator('#confirm-merge')).toBeVisible();
   await page.locator('.resolve-conflict').evaluateAll(inputs=>inputs.forEach(input=>{input.checked=true}));
   await page.locator('#confirm-merge').click();await expect(page.locator('#modal')).toBeHidden();
   await page.locator('#people-tab').click();await expect(page.getByRole('heading',{name:original[0].name,exact:true})).toBeVisible();
   await page.locator('#tools-tab').click();await page.locator('#import-button').click();
   await page.locator('#backup-file').setInputFiles({name:'synthetic-xss.json',mimeType:'application/json',buffer:Buffer.from(createBackup(hostile))});
   await expect(page.locator('.conflict')).toHaveCount(hostile.length);await namesAt(page,'#modal-body');
   await page.locator('.resolve-conflict').evaluateAll(inputs=>inputs.forEach(input=>{input.checked=true}));
   await page.locator('#confirm-merge').click();await page.locator('#people-tab').click();await namesAt(page,'#people');await namesAt(page,'#family-groups');
   const group=page.locator('#family-groups [data-browse-group]').nth(1);await expect(group).toHaveAttribute('data-browse-group',groupId);await group.click();await safe(page);
   await page.locator('#tools-tab').click();await page.locator('#manage-groups').click();await namesAt(page,'#modal-body');
   await page.locator('[data-group]').first().click();await expect(page.locator('#group-name')).toHaveValue(payloads[0]);await safe(page);await page.locator('#close-modal').click();
   await page.locator('#people-tab').click();if(await page.locator('.search-field').isHidden())await page.locator('#search-toggle').click();
   for(const query of payloads){await page.locator('#family-search').fill(query);await expect(page.locator('.filter-chip')).toContainText(query);await safe(page)}
   await page.locator('#family-search').fill('');await page.reload();await expect(page.locator('#today-g')).not.toBeEmpty();await namesAt(page,'#people');await namesAt(page,'#family-groups');
  }
 });
});
