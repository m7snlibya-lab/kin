import {test,expect} from '@playwright/test';
import '../dist/vendor/pako.min.js';
import {encode,calendars,age,today} from '../dist/core.js';
import {quantity} from '../dist/i18n.js';
const records=[
 {id:'cDAwMDAx',name:'Amina أحمد',calendar:'g',day:calendars.g.toDay(1990,4,18)},
 {id:'cDAwMDAy',name:'Omar',calendar:'h',day:calendars.g.toDay(2010,9,22)}
];
const errors=new WeakMap();
test.beforeEach(async({page})=>{errors.set(page,[]);page.on('pageerror',e=>errors.get(page).push(e.message));await page.goto('./'+encode(records));await expect(page.locator('.person-card')).toHaveCount(2)});
test.afterEach(async({page})=>expect(errors.get(page)).toEqual([]));

test('both ages, birth dates and next birthdays are visible without expanding details',async({page})=>{
 await expect(page.locator('#mobile-add')).toBeHidden();
 const card=page.locator('.person-card').filter({hasText:'Omar'});
 await expect(card.locator('.calendar-age')).toHaveCount(2);
 for(const c of ['g','h']){
  await expect(card.locator('.age-'+c)).toBeVisible();
  await expect(card.locator('.age-'+c+' .age-num')).toHaveText(quantity(age(records[1].day,today(),c).years,'year'));
  await expect(card.locator('.age-'+c+' .age-rest')).toBeVisible();
  await expect(card.locator('.age-'+c+' .birth-date')).toBeVisible();
 }
 await expect(card.locator('.birthday-preview .birthday-row')).toHaveCount(2);
 await expect(card.locator('.person-details')).not.toHaveAttribute('open','');
 await page.locator('#family-options > summary').click();await page.locator('#primary-calendar').selectOption('h');
 await expect(card.locator('.calendar-age')).toHaveCount(2);
});

test('advanced filters are optional and active filters have a clear reset',async({page})=>{
 await expect(page.locator('#family-options')).not.toHaveAttribute('open','');
 await expect(page.locator('#month-filter')).toBeHidden();
 await expect(page.locator('#people-layout')).toBeVisible();
 await page.locator('#family-options > summary').click();await page.locator('#month-filter').selectOption('4');
 await page.locator('#family-options > summary').click();
 await expect(page.locator('.person-card')).toHaveCount(1);await expect(page.locator('#filter-status')).toBeVisible();
 await expect(page.locator('#filter-description')).toContainText('April');
 await page.locator('#clear-filters').click();await expect(page.locator('.person-card')).toHaveCount(2);
 await expect(page.locator('#family-search')).toBeFocused();await expect(page.locator('#filter-status')).toBeHidden();
});

test('larger text is remembered without changing family links',async({page})=>{
 const url=page.url();await page.locator('#text-size-button').click();await expect(page.locator('#text-size-button')).toHaveAttribute('aria-pressed','true');
 expect(await page.locator('.calendar-label').first().evaluate(el=>parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(20);
 await page.reload();await expect(page.locator('#text-size-button')).toHaveAttribute('aria-pressed','true');
 expect(page.url()).toBe(url);await page.locator('#text-size-button').click();await expect(page.locator('#text-size-button')).toHaveAttribute('aria-pressed','false');
});

test('key controls have large targets and dialogs restore keyboard focus',async({page})=>{
 for(const selector of ['#add-button','#share-button','#text-size-button','#tools-button','#exports-button','.edit-button','#family-options>summary']){
  const box=await page.locator(selector).first().boundingBox();expect(Math.round(box.height)).toBeGreaterThanOrEqual(48);expect(Math.round(box.width)).toBeGreaterThanOrEqual(48);
 }
 await page.locator('#add-button').click();await expect(page.locator('#person-name')).toBeFocused();
 await page.keyboard.press('Escape');await expect(page.locator('#add-button')).toBeFocused();
 const edit=page.locator('[data-edit="cDAwMDAx"]');await edit.click();await page.locator('#person-name').fill('Amina Updated');await page.locator('#save-person').click();await expect(page.locator('#modal')).toBeHidden();await expect(page.locator('[data-edit="cDAwMDAx"]')).toBeFocused();
});

test('small screens and doubled text reflow in English and Arabic',async({page},info)=>{
 await page.setViewportSize({width:393,height:851});
 expect(await page.locator('.person-card').first().evaluate(el=>el.getBoundingClientRect().top)).toBeLessThan(800);
 await page.setViewportSize({width:320,height:850});
 for(const lang of ['en','ar']){
  if(lang==='ar')await page.locator('#language-button').click();
  await page.locator('#text-size-button').click();
  const layout=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('body *')].filter(el=>{const r=el.getBoundingClientRect();return r.width>0&&(r.right>innerWidth+1||r.left< -1)&&!el.classList.contains('sr-only')}).map(el=>({tag:el.tagName,id:el.id,classes:el.className,text:el.textContent.slice(0,80),x:el.getBoundingClientRect().x,width:el.getBoundingClientRect().width}))}));
  await page.screenshot({path:info.outputPath('readable-'+lang+'.png'),fullPage:true});
  expect(layout.scroll,JSON.stringify({lang,...layout})).toBeLessThanOrEqual(layout.width+1);
  for(const card of await page.locator('.person-card').all())expect(await card.evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
  await page.locator('#text-size-button').click();
 }
 await page.setViewportSize({width:640,height:900});
 await page.evaluate(()=>document.documentElement.style.fontSize='200%');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await page.locator('#tools-button').click();await page.locator('#compare-open').click();
 expect(await page.locator('#modal').evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
});

test('birthday shortcut reveals the event even after restrictive agenda settings',async({page})=>{
 const url=page.url();
 await page.locator('#birthdays-tab').click();
 await page.locator('#birthday-calendar').selectOption('h');
 await page.locator('#birthday-range').selectOption('30');
 await page.locator('#milestones-button').click();
 await page.locator('.milestone-options input').last().check();
 await page.locator('#apply-milestones').click();
 await page.locator('#people-tab').click();
 await page.locator('#see-birthdays').click();
 await expect(page.locator('#birthdays-tab')).toBeFocused();
 await expect(page.locator('#birthday-calendar')).toHaveValue('both');
 await expect(page.locator('#birthday-range')).toHaveValue('365');
 await expect(page.locator('.agenda-event').first()).toBeVisible();
 expect(page.url()).toBe(url);
 await page.locator('#family-search').fill('nobody-by-this-name');
 await expect(page.locator('#next-event')).toHaveText('No birthdays in this view');
 await expect(page.locator('#see-birthdays')).toBeHidden();
 await page.locator('#clear-filters').click();
 await expect(page.locator('#see-birthdays')).toBeVisible();
});

test('long names stay intact in a keyboard-accessible, contained table',async({page})=>{
 const names=['AlexandertheGreat'.repeat(5).slice(0,80),'عبد الرحمن محمد الحسن'];
 for(let i=0;i<records.length;i++){
  await page.locator('[data-edit="'+records[i].id+'"]').click();
  await page.locator('#person-name').fill(names[i]);await page.locator('#save-person').click();
  await expect(page.locator('#modal')).toBeHidden();
 }
 const url=page.url();await page.locator('#people-layout').selectOption('table');
 await page.setViewportSize({width:320,height:850});
 for(const lang of ['en','ar']){
  if(lang==='ar')await page.locator('#language-button').click();
  await expect(page.locator('#table-scroll-hint')).toBeVisible();
  for(const name of names){
   const cell=page.locator('.table-name').filter({hasText:name});await expect(cell).toHaveText(name);
   const size=await cell.evaluate(el=>{const r=document.createRange();r.selectNodeContents(el);return {height:r.getBoundingClientRect().height,line:parseFloat(getComputedStyle(el).lineHeight)}});
   expect(size.height).toBeLessThanOrEqual(size.line+1);
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await page.locator('.table-scroll').focus();await expect(page.locator('.table-scroll')).toBeFocused();
 }
 expect(page.url()).toBe(url);
});

test('labeled calendar icons survive language changes and view switching',async({page})=>{
 await expect(page.locator('.calendar-label .icon-sun')).toHaveCount(2);
 await expect(page.locator('.calendar-label .icon-moon')).toHaveCount(2);
 for(const lang of ['en','ar','en']){
  if(await page.locator('html').getAttribute('lang')!==lang)await page.locator('#language-button').click();
  await expect(page.locator('#next-event bdi')).toHaveCount(2);
  for(const selector of ['#add-button','#share-button','#tools-button','#exports-button','#people-tab','#birthdays-tab','#timeline-tab']){
   await expect(page.locator(selector+' .ui-icon')).toHaveCount(1);
   await expect(page.locator(selector+' span')).not.toBeEmpty();
   await expect(page.locator(selector+' .ui-icon')).toHaveAttribute('aria-hidden','true');
  }
 }
 await page.locator('#people-layout').selectOption('table');await expect(page.locator('.family-table thead .icon-sun')).toBeVisible();
 await page.locator('#people-layout').selectOption('cards');await expect(page.locator('.calendar-label .icon-moon')).toHaveCount(2);
});

test('visible card text has readable sizes and high text contrast',async({page})=>{
 const results=await page.locator('.person-card').first().evaluate(card=>{
  const rgb=s=>s.match(/[\d.]+/g)?.map(Number)||[];
  const luminance=c=>c.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
  return [...card.querySelectorAll('.calendar-label,.age-rest,.birth-date,.birthday-type,.birthday-date,.birthday-row strong')].map(el=>{
   let parent=el,bg='rgba(0, 0, 0, 0)';while(parent&&(!rgb(bg).length||rgb(bg)[3]===0)){bg=getComputedStyle(parent).backgroundColor;parent=parent.parentElement}
   const style=getComputedStyle(el),a=luminance(rgb(style.color)),b=luminance(rgb(bg));
   return {text:el.textContent,size:parseFloat(style.fontSize),contrast:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};
  });
 });
 for(const result of results){expect(result.size,result.text).toBeGreaterThanOrEqual(15);expect(result.contrast,result.text).toBeGreaterThanOrEqual(4.5)}
});
