import {chromium} from '@playwright/test';
import {execFileSync} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import '../dist/vendor/pako.min.js';
import {encode,calendars} from '../dist/core.js';

// Synthetic family only. Capture historical and current designs with identical data.
const [label='after',revision]=process.argv.slice(2);
const dir=new URL('../design-review/assets/',import.meta.url);
await mkdir(dir,{recursive:true});
const browser=await chromium.launch();
const context=await browser.newContext({viewport:{width:1440,height:1100},locale:'en-US',timezoneId:'Asia/Riyadh',serviceWorkers:'block'});
if(revision)await context.route('**/kin/**',async route=>{
 const path=new URL(route.request().url()).pathname.slice('/kin/'.length)||'index.html';
 if(!/\.(html|css|js)$/.test(path))return route.continue();
 try{const body=execFileSync('git',['show',`${revision}:dist/${path}`]);await route.fulfill({body,contentType:path.endsWith('.css')?'text/css':path.endsWith('.js')?'text/javascript':'text/html'})}catch{await route.abort()}
});
const page=await context.newPage();
await page.clock.install({time:new Date('2026-10-13T09:00:00+03:00')});
const family=[['cDAwMDAx','Amina Hassan',1989,4,18],['cDAwMDAy','Yusuf Hassan',2018,10,16],['cDAwMDAz','Layla Hassan',2022,2,14],['cDAwMDA0','Omar Hassan',1962,11,8]].map(([id,name,y,m,d])=>({id,name,day:calendars.g.toDay(y,m,d),calendar:'g'}));
await page.goto('http://127.0.0.1:4173/kin/'+encode(family));
await page.locator('.person-card').first().waitFor();
await page.screenshot({path:new URL(`${label}-desktop.png`,dir).pathname.replace(/^\/(\w:)/,'$1'),fullPage:true});
const measure=()=>page.locator('.person-card').first().evaluate(el=>({top:Math.round(el.getBoundingClientRect().top),height:Math.round(el.getBoundingClientRect().height),viewport:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth+1}));
const measurements={desktop:await measure()};
await page.setViewportSize({width:393,height:851});
await page.screenshot({path:new URL(`${label}-mobile.png`,dir).pathname.replace(/^\/(\w:)/,'$1'),fullPage:true});
measurements.mobile=await measure();
await page.locator('#language-button').click();
await page.screenshot({path:new URL(`${label}-arabic.png`,dir).pathname.replace(/^\/(\w:)/,'$1'),fullPage:true});
measurements.arabic=await measure();
await page.locator('#add-button').click();
await page.screenshot({path:new URL(`${label}-form.png`,dir).pathname.replace(/^\/(\w:)/,'$1')});
await writeFile(new URL(`${label}-metrics.json`,dir),JSON.stringify(measurements,null,2)+'\n');
console.log(label,measurements);
await browser.close();
