import {test,expect} from '@playwright/test';
import vm from 'node:vm';

test('development reloads retain styling without caching Vite resources',async({page})=>{
 await page.goto('/');
 for(let visit=0;visit<2;visit++){
  await expect(page.locator('#today-g')).not.toBeEmpty();
  await expect(page.locator('#offline-label')).toHaveText('Online mode');
  expect(await page.locator('.site-header').evaluate(el=>getComputedStyle(el).display)).toBe('flex');
  expect(await page.evaluate(async()=>(await navigator.serviceWorker.getRegistrations()).length)).toBe(0);
  await page.reload();
 }
});

test('legacy development worker retires without forcing a draft reload',async({request})=>{
 const response=await request.get('/sw.js');expect(response.ok()).toBe(true);
 expect(response.headers()['cache-control']).toBe('no-store');
 const events={};let skipped=0,claimed=0,unregistered=0;
 const self={addEventListener:(event,handler)=>{events[event]=handler},skipWaiting:async()=>{skipped++},clients:{claim:async()=>{claimed++}},registration:{unregister:async()=>{unregistered++}}};
 vm.runInNewContext(await response.text(),{self});
 for(const event of ['install','activate']){let finished;events[event]({waitUntil:promise=>{finished=promise}});await finished}
 expect([skipped,claimed,unregistered]).toEqual([1,1,1]);
 expect(events.fetch).toBeUndefined();
});
