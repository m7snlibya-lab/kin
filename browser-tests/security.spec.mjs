import {test,expect} from '@playwright/test';
import '../dist/vendor/pako.min.js';
import {encode,calendars} from '../dist/core.js';
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
