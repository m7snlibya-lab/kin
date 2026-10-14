import {test,expect} from '@playwright/test';
import '../dist/vendor/pako.min.js';
import {encode,calendars,age,today} from '../dist/core.js';
import {quantity,date,months} from '../dist/i18n.js';
import {listBirthdays} from '../dist/birthdays.js';
import {nextEvent} from '../dist/domain.js';
const records=[
 {id:'cDAwMDAx',name:'Amina أحمد',calendar:'g',day:calendars.g.toDay(1990,4,18)},
 {id:'cDAwMDAy',name:'Omar',calendar:'h',day:calendars.g.toDay(2010,9,22)}
];
const errors=new WeakMap();
test.beforeEach(async({page})=>{errors.set(page,[]);page.on('pageerror',e=>errors.get(page).push(e.message));await page.goto('./'+encode(records));await page.locator('#confirm-merge').click();await expect(page.locator('#modal')).toBeHidden();await expect(page.locator('.person-card')).toHaveCount(2)});
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
 await expect(card.locator('details,summary')).toHaveCount(0);await expect(card.locator('.birth-weekday')).toBeVisible();await expect(card.locator('.person-lifetime')).toBeVisible();
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

test('sorting and result counts are visible without opening filters',async({page})=>{
 const original=page.url();
 await expect(page.locator('#sort')).toBeVisible();await expect(page.locator('#results-summary')).toHaveText('Showing 2 of 2 people');
 await page.locator('#sort').selectOption('name');await expect(page.locator('.person-card h3').first()).toHaveText('Amina أحمد');
 await page.locator('#family-search').fill('Omar');await expect(page.locator('#results-summary')).toHaveText('Showing 1 of 2 people');
 await page.locator('#people-layout').selectOption('table');await page.locator('#clear-filters').click();
 await page.reload();await expect(page.locator('#people-layout')).toHaveValue('table');await expect(page.locator('#sort')).toHaveValue('name');
 expect(page.url()).toBe(original);
});

test('individual filter chips preserve other filters and keyboard focus',async({page})=>{
 const original=page.url();await page.locator('#family-search').fill('Amina');
 await page.locator('#family-options>summary').click();await page.locator('#month-filter').selectOption('9');
 await page.locator('#family-options>summary').click();
 await expect(page.locator('#results-summary')).toHaveText('Showing 0 of 2 people');
 await page.locator('[data-remove-filter="month"]').focus();await page.keyboard.press('Enter');
 await expect(page.locator('.person-card')).toHaveCount(1);await expect(page.locator('#family-search')).toHaveValue('Amina');
 await expect(page.locator('[data-remove-filter="search"]')).toBeFocused();
 await page.keyboard.press('Enter');await expect(page.locator('.person-card')).toHaveCount(2);await expect(page.locator('#family-search')).toBeFocused();
 await expect(page.locator('#filter-status')).toBeHidden();expect(page.url()).toBe(original);
});

test('empty list recovery clears month filters as well as search',async({page})=>{
 await page.locator('#family-options>summary').click();await page.locator('#month-filter').selectOption('1');
 await page.locator('#family-search').fill('Omar');
 await expect(page.locator('.search-empty')).toBeVisible();await page.locator('#clear-search').click();
 await expect(page.locator('.person-card')).toHaveCount(2);await expect(page.locator('#month-filter')).toHaveValue('');
 await expect(page.locator('#family-search')).toHaveValue('');await expect(page.locator('#family-search')).toBeFocused();
});

test('long Arabic filter chips stay readable with larger text and localize their reset',async({page})=>{
 await page.setViewportSize({width:320,height:850});await page.locator('#language-button').click();await page.evaluate(()=>document.documentElement.style.fontSize='125%');
 await page.locator('#family-options>summary').click();await page.locator('#month-filter').selectOption('4');await page.locator('#family-options>summary').click();
 await page.locator('#family-search').fill('عبد الرحمن محمد الحسن <اختبار> '.repeat(5));
 const search=page.locator('[data-remove-filter="search"]'),month=page.locator('[data-remove-filter="month"]');
 expect((await search.boundingBox()).width).toBeGreaterThan(200);expect((await month.boundingBox()).width).toBeGreaterThan(150);
 expect((await search.boundingBox()).height).toBeLessThan(110);await expect(page.locator('#clear-filters')).toHaveText('إلغاء التصفية');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await page.locator('#clear-filters').click();await expect(page.locator('.person-card')).toHaveCount(2);
});

test('mobile views come before tools and tool explanations are clickable',async({page})=>{
 await page.setViewportSize({width:393,height:851});
 for(const lang of ['en','ar']){
  if(lang==='ar')await page.locator('#language-button').click();
  const tabs=await page.locator('.view-tabs').boundingBox();expect(tabs.y+tabs.height).toBeLessThanOrEqual(852);await expect(page.locator('#tools-panel')).toBeHidden();
  expect(await page.locator('.view-tabs').evaluate(el=>!!(el.compareDocumentPosition(document.querySelector('.section-toolbar'))&Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
  await page.locator('#tools-tab').click();await page.locator('#tools-button').click();await page.locator('#compare-open .tool-copy>span').click();
  await expect(page.locator('#comparison-result')).toBeVisible();await page.locator('#close-modal').click();await page.locator('#people-tab').click();
 }
});

test('comparison identifies the older person in either selection order',async({page})=>{
 const original=page.url();await page.locator('#tools-tab').click();await page.locator('#tools-button').click();await page.locator('#compare-open').click();
 const before=await page.locator('#comparison-result').textContent();
 await expect(page.locator('.comparison-age')).toHaveCount(2);await expect(page.locator('#comparison-result')).not.toContainText('Not born yet');
 await expect(page.locator('.comparison-summary')).toHaveText('When Omar was born, Amina أحمد was:');
 for(const c of ['g','h'])await expect(page.locator('.comparison-age').nth(c==='g'?0:1)).toContainText(quantity(age(records[0].day,records[1].day,c).years,'year'));
 await expect(page.locator('#compare-b option[value="'+records[0].id+'"]')).toHaveCount(0);
 await page.locator('#compare-a').selectOption(records[1].id);await expect(page.locator('#compare-b')).toHaveValue(records[0].id);
 await expect(page.locator('#comparison-result')).toHaveText(before);expect(page.url()).toBe(original);
});

test('comparison handles same-day births without calling either person older',async({page})=>{
 const same=records.map(p=>({...p,day:records[0].day}));await page.evaluate(()=>localStorage.clear());await page.goto('about:blank');await page.goto('./'+encode(same));await page.locator('#confirm-merge').click();
 const original=page.url();await page.locator('#tools-tab').click();await page.locator('#tools-button').click();await page.locator('#compare-open').click();
 await expect(page.locator('.comparison-summary')).toHaveText('Amina أحمد and Omar were born on the same day.');
 await expect(page.locator('.comparison-age')).toHaveCount(0);await expect(page.locator('#comparison-result')).not.toContainText('Not born yet');
 expect(page.url()).toBe(original);
 await page.locator('#close-modal').click();await page.locator('#people-tab').click();await page.locator('#language-button').click();await page.locator('#tools-tab').click();await page.locator('#tools-button').click();await page.locator('#compare-open').click();
 await expect(page.locator('.comparison-summary')).toContainText('في اليوم نفسه');
});

test('comparison can use the family without resetting restrictive filters',async({page})=>{
 const original=page.url();await page.locator('#family-search').fill('Omar');await page.locator('#tools-tab').click();await page.locator('#tools-button').click();await page.locator('#compare-open').click();
 await expect(page.locator('.comparison-scope')).toBeVisible();await expect(page.locator('#compare-a option')).toHaveCount(2);
 await expect(page.locator('.comparison-age')).toHaveCount(2);await page.locator('#close-modal').click();await page.locator('#people-tab').click();
 await expect(page.locator('#family-search')).toHaveValue('Omar');await expect(page.locator('.person-card')).toHaveCount(1);expect(page.url()).toBe(original);
 await page.evaluate(()=>localStorage.clear());await page.goto('about:blank');await page.goto('./'+encode(records.slice(0,1)));await page.locator('#confirm-merge').click();await expect(page.locator('#sort')).toBeHidden();await page.locator('#tools-tab').click();await page.locator('#tools-button').click();
 await expect(page.locator('#compare-open')).toHaveCount(0);await expect(page.locator('#reference-open')).toBeVisible();
});

test('group controls appear only after the first group and return to direct creation after deletion',async({page})=>{
 const original=page.url();await page.locator('#family-options>summary').click();
 await expect(page.locator('#group-filter')).toBeHidden();await expect(page.locator('#manage-groups')).toHaveText('Create group');
 await page.locator('#manage-groups').click();await expect(page.locator('#group-name')).toBeFocused();await expect(page.locator('#new-group')).toHaveCount(0);
 await page.locator('#group-name').fill('Family');await page.locator('#save-group').click();
 await expect(page.locator('#group-filter')).toBeVisible();await expect(page.locator('#manage-groups')).toHaveText('Manage groups');
 await page.locator('#group-filter').selectOption({label:'Family'});await page.locator('#manage-groups').click();await page.locator('[data-group]').click();
 page.once('dialog',d=>d.accept());await page.locator('#delete-group').click();
 await expect(page.locator('#group-filter')).toBeHidden();await expect(page.locator('#manage-groups')).toHaveText('Create group');
 await expect(page.locator('#manage-groups')).toBeFocused();await expect(page.locator('[data-remove-filter="group"]')).toHaveCount(0);
 await expect(page.locator('.person-card')).toHaveCount(2);expect(page.url()).toBe(original);
 await page.locator('#language-button').click();await expect(page.locator('#manage-groups')).toHaveText('إنشاء مجموعة');
 await page.reload();await page.locator('#family-options>summary').click();await expect(page.locator('#group-filter')).toBeHidden();
});

test('personal facts stay embedded in cards and the table without expanders',async({page})=>{
 const original=page.url();for(const p of records){
  const card=page.locator('.person-card').filter({hasText:p.name});await expect(card.locator('.birth-weekday')).toBeVisible();
  await expect(card.locator('.person-lifetime strong')).toHaveText(new Intl.NumberFormat('en').format(today()-p.day));
  await expect(card.locator('summary')).toHaveCount(0);
 }
 await page.locator('#people-layout').selectOption('table');
 for(const p of records){const row=page.locator('.family-table tr').filter({hasText:p.name});await expect(row.locator('.table-fact')).toHaveCount(2);await expect(row.locator('.table-fact').first()).toContainText(new Intl.NumberFormat('en').format(today()-p.day))}
 expect(page.url()).toBe(original);
});

test('today and offline installation are embedded while long guidance remains in Help',async({page})=>{
 const original=page.url();for(const lang of ['en','ar']){
  if(lang==='ar')await page.locator('#language-button').click();
  await expect(page.locator('#today-g')).toBeVisible();await expect(page.locator('#today-h')).toBeVisible();
  await expect(page.locator('#family-overview summary,.saving-guide,.link-note')).toHaveCount(0);
  await expect(page.locator('#install-button')).toBeVisible();await expect(page.locator('#offline-label')).toBeVisible();
 }
 await page.locator('#tools-tab').click();await page.locator('#about-button').click();await expect(page.locator('#modal .prose')).toContainText('الرابط مضغوط');
 expect(page.url()).toBe(original);
});

test('embedded sharing keeps action labels readable with Arabic larger text',async({page})=>{
 await page.setViewportSize({width:320,height:850});await page.locator('#language-button').click();await page.evaluate(()=>document.documentElement.style.fontSize='125%');await page.locator('#share-button').click();
 await expect(page.locator('#share-url')).toHaveAttribute('type','url');await expect(page.locator('#modal summary')).toHaveCount(0);
 for(const button of await page.locator('.share-controls .button:visible').all())expect(await button.evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
 expect(await page.locator('#modal').evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
 await expect(page.locator('#qr')).toBeHidden();await page.locator('#share-qr-format').click();await expect(page.locator('#qr')).toBeVisible();await expect(page.locator('#download-qr')).toBeVisible();
});

test('native text sizing replaces the app toggle and ignores legacy preferences',async({page})=>{
 const url=page.url(),size=await page.locator('.calendar-label').first().evaluate(el=>parseFloat(getComputedStyle(el).fontSize));
 await page.evaluate(()=>localStorage.setItem('kin.device.v1:'+location.pathname,JSON.stringify({version:1,groups:[],preferences:{largeText:true,sort:'name'}})));
 await page.reload();await expect(page.locator('#text-size-button')).toHaveCount(0);
 expect(await page.locator('.calendar-label').first().evaluate(el=>parseFloat(getComputedStyle(el).fontSize))).toBe(size);
 await page.evaluate(()=>document.documentElement.style.fontSize='200%');
 expect(await page.locator('.calendar-label').first().evaluate(el=>parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(size*2);
 expect(page.url()).toBe(url);await expect(page.locator('#sort')).toHaveValue('name');
});

test('mobile viewport requests app-like no zoom while retaining native text scaling',async({page})=>{
 await expect(page.locator('meta[name=viewport]')).toHaveAttribute('content',/maximum-scale=1,user-scalable=no/);
 expect(await page.evaluate(()=>getComputedStyle(document.documentElement).webkitTextSizeAdjust||getComputedStyle(document.documentElement).textSizeAdjust)).not.toBe('none');
 // Real OS accessibility settings are not exposed by Playwright; check the opt-in
 // on touch WebKit and use root-font enlargement below as a reflow approximation.
 expect(await page.evaluate(()=>[...document.styleSheets].flatMap(s=>[...s.cssRules]).some(r=>r.cssText.includes('-apple-system-body')))).toBe(true);
});

test('key controls have large targets and dialogs restore keyboard focus',async({page})=>{
 for(const selector of ['#add-button','#share-button','#tools-tab','.edit-button','#family-options>summary']){
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
  await page.evaluate(()=>document.documentElement.style.fontSize='125%');
  const layout=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('body *')].filter(el=>{const r=el.getBoundingClientRect();return r.width>0&&(r.right>innerWidth+1||r.left< -1)&&!el.classList.contains('sr-only')}).map(el=>({tag:el.tagName,id:el.id,classes:el.className,text:el.textContent.slice(0,80),x:el.getBoundingClientRect().x,width:el.getBoundingClientRect().width}))}));
  await page.screenshot({path:info.outputPath('readable-'+lang+'.png'),fullPage:true});
  expect(layout.scroll,JSON.stringify({lang,...layout})).toBeLessThanOrEqual(layout.width+1);
  for(const card of await page.locator('.person-card').all())expect(await card.evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
  await page.evaluate(()=>document.documentElement.style.fontSize='125%');
 }
 await page.setViewportSize({width:640,height:900});
 await page.evaluate(()=>document.documentElement.style.fontSize='200%');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await page.locator('#tools-tab').click();await page.locator('#tools-button').click();await page.locator('#compare-open').click();
 expect(await page.locator('#modal').evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
});

test('native enlarged text reflows on phones without page zoom',async({page},info)=>{
 test.setTimeout(60000);const original=page.url();
 const fits=async selector=>{const result=await page.locator(selector).first().evaluate(el=>({fits:el.scrollWidth<=el.clientWidth+1,size:getComputedStyle(document.documentElement).fontSize,details:[...el.querySelectorAll('*')].filter(n=>n.scrollWidth>n.clientWidth+2&&!['INPUT','SELECT','TEXTAREA'].includes(n.tagName)).slice(0,12).map(n=>({tag:n.tagName,id:n.id,class:n.className,width:n.clientWidth,scroll:n.scrollWidth}))}));expect(result.fits,selector+JSON.stringify(result)).toBe(true)};
 for(const lang of ['en','ar']){
  if(lang==='ar')await page.locator('#language-button').click();
  for(const size of ['100%','150%','200%']){
   await page.setViewportSize({width:320,height:850});
   await page.evaluate(size=>document.documentElement.style.fontSize=size,size);
   await fits('html');
   for(const card of await page.locator('.person-card').all())expect(await card.evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
   await expect(page.locator('.calendar-age')).toHaveCount(4);
   if(size==='100%')await page.screenshot({path:info.outputPath('native-text-'+lang+'-100.png'),fullPage:true});
   await page.locator('#add-button').click();await fits('#modal');await fits('.date-fields');await page.locator('#close-modal').click();await page.locator('#people-tab').click();
   await page.locator('#share-button').click();await fits('#modal');
   for(const button of await page.locator('.share-controls .button:visible').all())expect(await button.evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
   await page.locator('#close-modal').click();await page.locator('#people-tab').click();
  }
  await page.screenshot({path:info.outputPath('native-text-'+lang+'-200.png'),fullPage:true});
  await page.locator('#tools-tab').click();await page.locator('#exports-button').click();await page.locator('#print-open').click();await expect(page.locator('#download-pdf')).toBeEnabled();await fits('#modal');await fits('.document-settings');
  await page.locator('#close-modal').click();await page.locator('#people-tab').click();
  await page.setViewportSize({width:851,height:393});await fits('html');await fits('.person-card');
  await page.locator('#tools-tab').click();await page.locator('#tools-button').click();await page.locator('#compare-open').click();await fits('#modal');await fits('.comparison-ages');await page.locator('#close-modal').click();await page.locator('#people-tab').click();
 }
 expect(page.url()).toBe(original);
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

test('empty birthday recovery is actionable and calendar export explains an empty selection',async({page})=>{
 const original=page.url();await page.locator('#family-search').fill('Amina');await page.locator('#birthdays-tab').click();
 await page.locator('#birthday-range').selectOption('30');await page.locator('#milestones-button').click();
 await page.locator('.milestone-options input').last().check();await page.locator('#apply-milestones').click();
 await expect(page.locator('#milestones-button')).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('#agenda-summary')).toContainText('Milestone ages:');await expect(page.locator('#broaden-birthdays')).toBeVisible();
 await page.locator('#tools-tab').click();await page.locator('#exports-button').click();await page.locator('#ics-open').click();
 await expect(page.locator('#toast-text')).toHaveText('No birthdays to export. Adjust the birthday range or family filters.');
 await expect(page.locator('#birthday-range')).toBeFocused();await page.locator('#broaden-birthdays').click();
 await expect(page.locator('#birthday-range')).toHaveValue('365');await expect(page.locator('#birthday-calendar')).toHaveValue('both');
 await expect(page.locator('#milestones-button')).toHaveAttribute('aria-pressed','false');await expect(page.locator('#family-search')).toHaveValue('Amina');
 await expect(page.locator('.agenda-event').first()).toBeVisible();expect(page.url()).toBe(original);
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
   await expect(page.locator(selector+' span[data-i18n]').first()).not.toBeEmpty();
   await expect(page.locator(selector+' .ui-icon')).toHaveAttribute('aria-hidden','true');
  }
 }
 await page.locator('#people-layout').selectOption('table');await expect(page.locator('.family-table thead .icon-sun')).toBeVisible();
 await page.locator('#people-layout').selectOption('cards');await expect(page.locator('.calendar-label .icon-moon')).toHaveCount(2);
});

test('saved language is resolved before delayed app code can reveal another language',async({browser,baseURL})=>{
 for(const [saved,locale,dir,heading] of [['ar','en-US','rtl','أفراد العائلة'],['en','ar-SA','ltr','Your people']]){
 const context=await browser.newContext({locale,serviceWorkers:'block',reducedMotion:'reduce'});const page=await context.newPage();
 let release;const gate=new Promise(resolve=>release=resolve);
 try{
  await context.addInitScript(value=>localStorage.setItem('kin.language',value),saved);
  await page.route('**/app.js',async route=>{await gate;await route.continue()});
  await page.goto(baseURL,{waitUntil:'commit'});
  await expect(page.locator('html')).toHaveAttribute('lang',saved);
  await expect(page.locator('html')).toHaveAttribute('dir',dir);
  await expect(page.locator('html')).toHaveAttribute('data-booting','true');
  await expect(page.locator('h1')).toBeAttached();await expect(page.locator('h1')).not.toBeVisible();
  await expect(page.locator('#startup-status')).toBeVisible();await expect(page.locator('#startup-status')).toHaveAttribute('role','status');
  await expect(page.locator('#startup-status')).toHaveText(saved==='ar'?'جارٍ التحميل…':'Loading…');
  await expect(page.locator('#startup-status .loading-spinner')).toBeVisible();expect(await page.locator('#startup-status .loading-spinner').evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
  release();await expect(page.locator('html')).not.toHaveAttribute('data-booting','true');await expect(page.locator('#startup-status')).toHaveCount(0);
  await expect(page.locator('h1')).toHaveText(heading);
  await page.reload();await expect(page.locator('html')).toHaveAttribute('lang',saved);
  await expect(page.locator('h1')).toBeVisible();
 }finally{release();await context.close()}
 }
});

test('failed startup offers a localized retry without exposing the English shell',async({browser,baseURL})=>{
 const context=await browser.newContext({locale:'en-US',serviceWorkers:'block'});const page=await context.newPage();
 try{
  await context.addInitScript(()=>localStorage.setItem('kin.language','ar'));
  await page.clock.install();await page.route('**/app.js',route=>route.abort());
  await page.goto(baseURL);await page.clock.fastForward(10001);
  await expect(page.locator('#startup-recovery')).toBeVisible();await expect(page.locator('#startup-status')).toHaveCount(0);
  await expect(page.locator('#startup-recovery button')).toHaveText('إعادة المحاولة');
  await expect(page.locator('h1')).not.toBeVisible();
 }finally{await context.close()}
});

test('today dates have equal typography and localized labels in both directions',async({page},info)=>{
 for(const lang of ['en','ar']){
  if(lang==='ar')await page.locator('#language-button').click();
  for(const width of [1100,393,320]){
   await page.setViewportSize({width,height:850});
   const styles=await page.locator('.today-value').evaluateAll(els=>els.map(el=>{const s=getComputedStyle(el);return [s.fontSize,s.fontWeight,s.color,s.lineHeight]}));expect(styles[0]).toEqual(styles[1]);
   await expect(page.locator('[data-calendar-label=g]')).toHaveText(lang==='ar'?'الميلادي':'Gregorian');
   await expect(page.locator('[data-calendar-label=h]')).toHaveText(lang==='ar'?'الهجري':'Hijri');
   expect(await page.locator('#family-overview').evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
  }
  await page.locator('#family-overview').screenshot({path:info.outputPath('equal-calendars-'+lang+'.png')});
 }
});

test('RTL tab arrows follow the visual direction',async({page})=>{
 await page.locator('#people-tab').focus();await page.keyboard.press('ArrowRight');await expect(page.locator('#birthdays-tab')).toBeFocused();
 await page.locator('#language-button').click();await page.locator('#people-tab').click();await page.keyboard.press('ArrowLeft');await expect(page.locator('#birthdays-tab')).toBeFocused();
 await page.keyboard.press('ArrowRight');await expect(page.locator('#people-tab')).toBeFocused();
 await page.keyboard.press('End');await expect(page.locator('#tools-tab')).toBeFocused();await page.keyboard.press('Home');await expect(page.locator('#people-tab')).toBeFocused();
});

test('Arabic editor values and selection counts use local digits without changing links',async({page})=>{
 const original=page.url();await page.locator('#language-button').click();await page.locator('[data-edit="cDAwMDAx"]').click();
 await expect(page.locator('#birth-day')).toHaveValue('١٨');await expect(page.locator('#birth-year')).toHaveValue('١٩٩٠');await page.locator('#close-modal').click();await page.locator('#people-tab').click();
 await page.locator('#share-button').click();await expect(page.locator('#share-count')).toHaveText('تم تحديد ٢ من أصل ٢');
 await expect(page.locator('.selection-search')).toHaveAttribute('dir','auto');await page.locator('.selection-search').fill('اسم غير موجود');await expect(page.locator('.selection-empty')).toBeVisible();await expect(page.locator('.selection-empty')).toHaveText('لا توجد أسماء مطابقة');await page.locator('.selection-search').fill('');await expect(page.locator('.selection-empty')).toBeHidden();await page.locator('#close-modal').click();await page.locator('#people-tab').click();
 await page.locator('#tools-tab').click();await page.locator('#exports-button').click();await page.locator('#print-open').click();await expect(page.locator('#download-pdf')).toBeEnabled();
 await expect(page.locator('#document-selection .selection-count')).toHaveText('تم تحديد ٢ من أصل ٢');await expect(page.locator('#doc-year')).toHaveValue(/^[٠-٩]+$/);
 await page.locator('#doc-language').selectOption('ar');await expect(page.locator('#download-pdf')).toBeEnabled();await expect(page.locator('#document-text')).toHaveAttribute('dir','rtl');
 await expect(page.locator('#document-preview canvas')).toHaveAttribute('aria-label',/معاينة الصفحة/);expect(page.url()).toBe(original);
});

test('copy feedback is shown inside its dialog rather than only behind it',async({page})=>{
 await page.locator('#language-button').click();await page.locator('#share-button').click();
 await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{}}}));
 await page.locator('#copy-share').click();await expect(page.locator('#modal #dialog-feedback')).toBeVisible();await expect(page.locator('#dialog-feedback')).toContainText('تم نسخ الرابط');await expect(page.locator('#dialog-feedback')).toHaveAttribute('role','status');
});

test('calendar symbols are identical in cards, the editor and birthday agenda',async({page})=>{
 const symbols={};for(const type of ['sun','moon'])symbols[type]=await page.locator('.calendar-label .icon-'+type).first().innerHTML();
 await page.locator('#add-button').click();
 for(const type of ['sun','moon'])expect(await page.locator('.segmented .icon-'+type).innerHTML()).toBe(symbols[type]);
 await page.locator('#close-modal').click();await page.locator('#people-tab').click();await page.locator('#birthdays-tab').click();await page.locator('#birthday-range').selectOption('365');
 for(const type of ['sun','moon'])expect(await page.locator('.agenda-person .icon-'+type).first().innerHTML()).toBe(symbols[type]);
});

test('menus have one home for groups, backups and calendar outputs',async({page})=>{
 await page.locator('#tools-tab').click();await page.locator('#tools-button').click();
 await expect(page.locator('#compare-open')).toBeVisible();await expect(page.locator('#reference-open')).toBeVisible();await expect(page.locator('#groups-open')).toHaveCount(0);
 await page.locator('#close-modal').click();await page.locator('#people-tab').click();await page.locator('#tools-tab').click();await page.locator('#exports-button').click();
 await expect(page.locator('#print-open')).toBeVisible();await expect(page.locator('#ics-open')).toBeVisible();
 await expect(page.locator('#card-open')).toHaveCount(0);await expect(page.locator('#backup-open')).toHaveCount(0);
 await page.locator('#close-modal').click();await page.locator('#people-tab').click();await page.locator('#share-button').click();
 await expect(page.locator('#download-backup')).toHaveCount(0);await expect(page.locator('#copy-share')).toBeVisible();
 await expect(page.getByText('2 of 2 people',{exact:true})).toHaveCount(1);
 await page.locator('.share-person').first().uncheck();await expect(page.getByText('1 of 2 people',{exact:true})).toHaveCount(1);
 await expect(page.locator('.qr-options summary')).toHaveCount(0);await page.locator('#share-qr-format').click();await expect(page.locator('#qr')).toBeVisible();await expect(page.locator('#download-qr')).toBeVisible();
 await page.locator('#close-modal').click();await page.locator('#people-tab').click();await page.locator('#family-options>summary').click();await expect(page.locator('#manage-groups')).toBeVisible();
 for(const selector of ['#save-button','#calendar-help','#empty-add','#export-calendar','#mobile-add'])await expect(page.locator(selector)).toHaveCount(0);
});

test('visible card text has readable sizes and high text contrast',async({page})=>{
 const results=await page.locator('.person-card').first().evaluate(card=>{
  const rgb=s=>s.match(/[\d.]+/g)?.map(Number)||[];
  const luminance=c=>c.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
  return [...card.querySelectorAll('.calendar-label,.age-rest,.birth-date,.birthday-type,.birthday-date,.birthday-row strong,.birth-weekday,.person-lifetime,.person-lifetime strong')].map(el=>{
   let parent=el,bg='rgba(0, 0, 0, 0)';while(parent&&(!rgb(bg).length||rgb(bg)[3]===0)){bg=getComputedStyle(parent).backgroundColor;parent=parent.parentElement}
   const style=getComputedStyle(el),a=luminance(rgb(style.color)),b=luminance(rgb(bg));
   return {text:el.textContent,size:parseFloat(style.fontSize),contrast:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};
  });
 });
 for(const result of results){expect(result.size,result.text).toBeGreaterThanOrEqual(15);expect(result.contrast,result.text).toBeGreaterThanOrEqual(4.5)}
});

test('compact list preserves both complete ages, details and the saved view',async({page},info)=>{
 const url=page.url();await page.setViewportSize({width:393,height:851});
 await page.locator('#people-layout').selectOption('list');
 await expect(page.locator('.person-row')).toHaveCount(2);await expect(page.locator('.row-age')).toHaveCount(4);
 for(const c of ['g','h'])await expect(page.locator('.person-row').filter({hasText:'Omar'}).locator('.age-'+c)).toContainText(quantity(age(records[1].day,today(),c).years,'year'));
 await page.locator('[data-person="cDAwMDAy"]').click();await expect(page.locator('#modal .calendar-age')).toHaveCount(2);
 await page.locator('#close-modal').click();await expect(page.locator('[data-person="cDAwMDAy"]')).toBeFocused();
 await page.reload();await expect(page.locator('#people-layout')).toHaveValue('list');expect(page.url()).toBe(url);
 await page.locator('#language-button').click();await page.screenshot({path:info.outputPath('app-list-ar.png'),fullPage:true});
 await page.locator('[data-person="cDAwMDAy"]').click();await page.locator('#modal [data-edit]').click();await page.locator('#person-name').fill('عمر Updated');await page.locator('#save-person').click();await expect(page.locator('#modal')).toBeHidden();await expect(page.locator('[data-person="cDAwMDAy"]')).toBeFocused();
});

test('phone family starts within the first screen and tools stay out of its way',async({page},info)=>{
 await page.setViewportSize({width:393,height:851});
 for(const lang of ['en','ar']){
  if(lang==='ar')await page.locator('#language-button').click();
  await expect(page.locator('#tools-button')).toBeHidden();await expect(page.locator('#exports-button')).toBeHidden();
  const card=await page.locator('.person-card').first().boundingBox();expect(card.y).toBeLessThan(550);
  await page.screenshot({path:info.outputPath('app-people-'+lang+'.png'),fullPage:true});
  await page.locator('#tools-tab').click();await expect(page.locator('#tools-panel')).toBeVisible();await expect(page.locator('#family-search')).toBeHidden();
  await page.locator('#people-tab').click();
 }
});

test('opening a shared link never silently saves it and demo cannot leak into it',async({page,context})=>{
 await page.evaluate(()=>localStorage.clear());await page.goto('about:blank');await page.goto('./');
 await page.locator('#demo-button').click();
 await page.evaluate(hash=>{location.hash=hash},encode(records));
 await expect(page.locator('#confirm-merge')).toHaveText('Keep this family');
 await expect(page.locator('.merge-person')).toHaveCount(2);
 await page.locator('#view-link').click();
 await expect(page.locator('#family-mode')).toHaveText('Shared family · view only');
 await expect(page.locator('#add-button')).toBeHidden();await expect(page.locator('.edit-button:visible')).toHaveCount(0);
 expect(await page.evaluate(()=>localStorage.getItem('kin.family.v1:'+location.pathname))).toBeNull();
 await page.locator('#tools-tab').click();await expect(page.locator('#backup-button')).toBeHidden();
 await page.locator('#exports-button').click();await page.locator('#print-open').click();
 await expect(page.locator('#download-pdf')).toBeEnabled();
 await page.locator('#close-modal').click();await page.locator('#notice button').filter({hasText:'Keep this family'}).click();await page.locator('#confirm-merge').click();
 await expect(page.locator('#family-mode')).toHaveText('Saved on this device');await expect(page.locator('#add-button')).toBeVisible();
 expect(await page.evaluate(()=>localStorage.getItem('kin.family.v1:'+location.pathname))).toBe(encode(records));
});

test('print opens on a preview rather than a wall of settings',async({page},info)=>{
 await page.setViewportSize({width:393,height:851});
 await page.locator('#tools-tab').click();await page.locator('#exports-button').click();await page.locator('#print-open').click();
 await expect(page.locator('#download-pdf')).toBeEnabled();await expect(page.locator('#doc-birthdays')).toHaveValue('both');
 const canvas=await page.locator('#document-preview canvas').boundingBox(),settings=await page.locator('.document-settings').boundingBox();
 expect(canvas.y).toBeLessThan(550);expect(canvas.y).toBeLessThan(settings.y);
 await expect(page.locator('#document-status')).toHaveText(/Pages: 1 · Birthdays: /);
 await page.screenshot({path:info.outputPath('app-print-preview.png')});
});

test('QR is a sharing choice and backups have a separate home',async({page})=>{
 await page.locator('#share-button').click();await expect(page.locator('#qr')).toBeHidden();await expect(page.locator('#download-backup')).toHaveCount(0);
 await page.locator('.share-person').first().uncheck();const link=await page.locator('#share-url').inputValue();
 await page.locator('#share-qr-format').click();await expect(page.locator('#qr')).toBeVisible();await expect(page.locator('#copy-share')).toBeHidden();
 await page.locator('#share-link-format').click();await expect(page.locator('#share-url')).toHaveValue(link);await expect(page.locator('.share-person:checked')).toHaveCount(1);
 await page.locator('#close-modal').click();await page.locator('#tools-tab').click();await page.locator('#backup-button').click();
 await expect(page.locator('#download-backup')).toBeVisible();await expect(page.locator('#copy-share')).toHaveCount(0);await expect(page.locator('#backup-selection .selection-person')).toHaveCount(2);
});

test('failed save feedback stays visible until dismissed or retried',async({page})=>{
 await page.clock.install();await page.locator('#add-button').click();await page.locator('#person-name').fill('Draft Test');await page.locator('#birth-day').fill('1');await page.locator('#birth-month').selectOption('1');await page.locator('#birth-year').fill('2000');
 await page.evaluate(()=>Object.defineProperty(navigator,'locks',{configurable:true,value:{request:()=>Promise.reject(new Error('Unavailable'))}}));
 await page.locator('#save-person').click();await expect(page.locator('#dialog-feedback')).toHaveAttribute('role','alert');
 await page.clock.fastForward(20000);await expect(page.locator('#dialog-feedback')).toBeVisible();await expect(page.locator('#person-name')).toHaveValue('Draft Test');
 await page.evaluate(()=>Object.defineProperty(navigator,'locks',{configurable:true,value:undefined}));
 await page.locator('#save-person').click();await expect(page.locator('#modal')).toBeHidden();await expect(page.locator('.person-card')).toHaveCount(3);
});

test('Arabic typography is self-hosted and applied consistently to app controls',async({page},info)=>{
 await page.locator('#language-button').click();await page.evaluate(()=>document.fonts.ready);
 const fonts=await page.evaluate(()=>({loaded:document.fonts.check('400 16px "Kin Plex"','عائلتي'),faces:[...document.fonts].filter(f=>f.family.replaceAll('"','')==='Kin Plex').map(f=>f.status)}));
 expect(fonts.loaded).toBe(true);expect(fonts.faces).toContain('loaded');
 for(const selector of ['body','h1','.person-card h3','.calendar-label','#add-button','#family-search'])expect(await page.locator(selector).first().evaluate(el=>getComputedStyle(el).fontFamily),selector).toContain('Kin Plex');
 await page.screenshot({path:info.outputPath('arabic-people.png'),fullPage:true});
 await page.locator('#add-button').click();
 for(const selector of ['#modal-title','#person-name','#birth-month','#save-person'])expect(await page.locator(selector).evaluate(el=>getComputedStyle(el).fontFamily),selector).toContain('Kin Plex');
 await page.locator('#close-modal').click();await page.evaluate(()=>document.documentElement.style.fontSize='150%');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await page.screenshot({path:info.outputPath('arabic-large-text.png')});
});

test('birthday agenda uses the selected calendar for months and shows both event dates',async({page},info)=>{
 const original=page.url(),first=listBirthdays(records,{from:today(),days:365,calendar:'h'})[0];
 await page.locator('#birthdays-tab').click();await page.locator('#birthday-range').selectOption('365');await page.locator('#birthday-calendar').selectOption('h');
 const [y,m,d]=calendars.h.parts(first.day);
 await expect(page.locator('.agenda-month').first()).toHaveText(months('h')[m-1]+' '+y+' AH');
 await expect(page.locator('.agenda-day strong').first()).toHaveText(String(d));
 await expect(page.locator('#agenda-summary')).toContainText(date(today(),'h'));
 for(const c of ['g','h'])await expect(page.locator('.agenda-event').first().locator('[data-event-date='+c+'] bdi')).toHaveText(date(first.day,c));
 await page.locator('#language-button').click();await expect(page.locator('.agenda-month').first()).toContainText('هـ');
 await expect(page.locator('.agenda-occurrence').first()).not.toContainText('Turning');
 await page.screenshot({path:info.outputPath('arabic-hijri-agenda.png'),fullPage:true});expect(page.url()).toBe(original);
});

test('table next dates and date exploration honor the preferred calendar',async({page})=>{
 const original=page.url();await page.locator('#family-options>summary').click();await page.locator('#primary-calendar').selectOption('h');await page.locator('#family-options>summary').click();await page.locator('#people-layout').selectOption('table');
 const row=page.locator('.family-table tbody tr').filter({hasText:'Omar'});
 await expect(row.locator('td').nth(3)).toContainText(date(nextEvent(records[1],today(),'h').day,'h'));
 await expect(row.locator('td').first().locator('.icon-sun')).toBeVisible();await expect(row.locator('td').first().locator('.icon-moon')).toBeVisible();
 await page.locator('#tools-tab').click();await page.locator('#tools-button').click();await page.locator('#reference-open').click();
 await expect(page.locator('#reference-calendar')).toHaveValue('h');await expect(page.locator('#reference-year')).toHaveValue(String(calendars.h.parts(today())[0]));
 await page.locator('#reference-apply').click();await expect(page.locator('#reference-banner')).toBeVisible();expect(page.url()).toBe(original);
});

test('successful birth entry remembers its calendar without changing existing records',async({page})=>{
 await page.locator('#add-button').click();await page.locator('[data-calendar=h]').click();await page.locator('#person-name').fill('Hijri Entry');
 await page.locator('#birth-day').fill('1');await page.locator('#birth-month').selectOption('9');await page.locator('#birth-year').fill('1420');await page.locator('#save-person').click();await expect(page.locator('#modal')).toBeHidden();
 await page.reload();await page.locator('#add-button').click();await expect(page.locator('[data-calendar=h]')).toHaveAttribute('aria-pressed','true');await expect(page.locator('#birth-year')).toBeEmpty();await page.locator('#close-modal').click();
 await page.locator('[data-edit=cDAwMDAx]').click();await expect(page.locator('[data-calendar=g]')).toHaveAttribute('aria-pressed','true');await expect(page.locator('#birth-year')).toHaveValue('1990');
});

test('view-only families have a safe return and no empty edit column',async({page})=>{
 const original=page.url(),shared=[{id:'c2hhcmVk',name:'Shared Person',calendar:'h',day:calendars.g.toDay(2001,2,3)}];
 await page.locator('#family-search').fill('Omar');await page.evaluate(hash=>{location.hash=hash},encode(shared));await page.locator('#view-link').click();await expect(page.locator('#modal')).toBeHidden();
 await expect(page.locator('#family-search')).toBeEmpty();await page.locator('#people-layout').selectOption('table');await expect(page.locator('.family-table thead th')).toHaveCount(5);await expect(page.locator('.family-table tbody td')).toHaveCount(4);
 await page.locator('#notice button').filter({hasText:'Merge with my family'}).click();await page.locator('#cancel-merge').click();await expect(page.locator('#family-mode')).toHaveText('Shared family · view only');
 const sharedURL=page.url();await page.evaluate(()=>{window.kinOriginalGet=Storage.prototype.getItem;Storage.prototype.getItem=function(key){if(key.startsWith('kin.family.'))throw new DOMException('Blocked','SecurityError');return window.kinOriginalGet.call(this,key)}});await page.locator('#return-family').click();
 await expect(page.locator('#family-mode')).toHaveText('Shared family · view only');await expect(page.locator('#toast')).toHaveAttribute('role','alert');expect(page.url()).toBe(sharedURL);
 await page.evaluate(()=>{Storage.prototype.getItem=window.kinOriginalGet;delete window.kinOriginalGet});await page.locator('#return-family').click();await expect(page.locator('#family-search')).toHaveValue('Omar');await expect(page.locator('.table-name')).toHaveText('Omar');await expect(page.locator('#people-tab')).toBeFocused();
 expect(page.url()).toBe(original);expect(await page.evaluate(()=>localStorage.getItem('kin.family.v1:'+location.pathname))).toBe(encode(records));
});

test('a first shared family offers plain choices and can return to an empty device',async({page})=>{
 await page.evaluate(()=>localStorage.clear());await page.goto('about:blank');await page.goto('./'+encode(records));
 await expect(page.locator('#modal-title')).toHaveText('Open a shared family');await expect(page.locator('#modal-body')).not.toContainText('conflicts');await expect(page.locator('.form-preview')).toHaveCount(0);
 for(const input of await page.locator('.merge-person').all())await input.uncheck();await expect(page.locator('#confirm-merge')).toBeDisabled();await page.locator('.merge-person').first().check();await expect(page.locator('#confirm-merge')).toBeEnabled();
 await page.locator('#view-link').click();await expect(page.locator('#modal')).toBeHidden();await expect(page.locator('#notice button').filter({hasText:'Keep this family'})).toBeVisible();await page.locator('#return-family').click();
 await expect(page.locator('#demo-button')).toBeVisible();await expect(page.locator('#share-button')).toBeHidden();await expect(page.locator('#add-button')).toBeVisible();expect(new URL(page.url()).hash).toBe('');expect(await page.evaluate(()=>localStorage.getItem('kin.family.v1:'+location.pathname))).toBeNull();
});

test('unavailable web fonts do not block Arabic entry or readable fallback',async({browser,baseURL})=>{
 const context=await browser.newContext({serviceWorkers:'block',locale:'ar',viewport:{width:320,height:850}});const page=await context.newPage();
 try{
  await page.route('**/*.woff2',route=>route.abort());await page.goto(baseURL);await expect(page.locator('#startup-status')).toBeHidden();await page.evaluate(()=>document.fonts.ready);
  expect(await page.evaluate(()=>document.fonts.check('400 16px "Kin Plex"','عائلتي'))).toBe(false);await expect(page.locator('h1')).toHaveText('أفراد العائلة');
  await page.locator('#add-button').click();await page.locator('#person-name').fill('اختبار الخط البديل');await page.locator('#birth-day').fill('١');await page.locator('#birth-month').selectOption('1');await page.locator('#birth-year').fill('٢٠٠٠');await page.locator('#save-person').click();await expect(page.locator('#modal')).toBeHidden();await expect(page.locator('.person-card h3')).toHaveText('اختبار الخط البديل');
  await page.evaluate(()=>document.documentElement.style.fontSize='150%');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 }finally{await context.close()}
});
