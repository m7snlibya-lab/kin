import {chromium} from '@playwright/test';
import {fileURLToPath} from 'node:url';
const browser=await chromium.launch();
const page=await browser.newPage({viewport:{width:1440,height:1050}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(new URL('../design-review/report.html',import.meta.url).href);
for(const option of ['before','original','after']){
 await page.selectOption('#version',option);
 await page.locator('#comparison').evaluate(async img=>{await img.decode()});
}
const missing=await page.locator('img').evaluateAll(imgs=>imgs.filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src));
if(missing.length||errors.length)throw Error(JSON.stringify({missing,errors}));
await page.screenshot({path:fileURLToPath(new URL('../design-review/report-preview.png',import.meta.url)),fullPage:true});
await page.setViewportSize({width:393,height:851});
if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))throw Error('Report overflows phone');
await page.screenshot({path:fileURLToPath(new URL('../design-review/report-mobile-preview.png',import.meta.url)),fullPage:true});
console.log('Report images, comparison control and mobile reflow passed.');
await browser.close();
