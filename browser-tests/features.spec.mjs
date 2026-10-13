import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {PDFDocument} from 'pdf-lib';
import '../dist/vendor/pako.min.js';
import {encode,calendars,today} from '../dist/core.js';
const records=[
 {id:'cDAwMDAx',name:'Parent Test',calendar:'g',day:calendars.g.toDay(1990,1,1)},
 {id:'cDAwMDAy',name:'Child Test',calendar:'g',day:calendars.g.toDay(2000,1,1)},
 {id:'cDAwMDAz',name:'آمنة Family',calendar:'h',day:calendars.g.toDay(2010,3,12)}
];
const errors=new WeakMap();
test.beforeEach(async({page})=>{errors.set(page,[]);page.on('pageerror',e=>errors.get(page).push(e.message));await page.goto('./'+encode(records));await expect(page.locator('.person-card')).toHaveCount(3)});
test('backup reminder and temporary device groups do not imply cloud sync',async({page})=>{
 await expect(page.locator('#backup-reminder')).toBeVisible();await page.locator('#dismiss-reminder').click();await page.reload();await expect(page.locator('#backup-reminder')).toBeHidden();
 await page.evaluate(()=>{const get=Storage.prototype.getItem,set=Storage.prototype.setItem;Storage.prototype.getItem=function(key){if(key.startsWith('kin.device.'))throw new DOMException('Blocked','SecurityError');return get.call(this,key)};Storage.prototype.setItem=function(key,value){if(key.startsWith('kin.device.'))throw new DOMException('Blocked','SecurityError');return set.call(this,key,value)}});
 await expect(page.locator('#family-options')).not.toHaveAttribute('open','');await expect(page.locator('#sort')).toBeVisible();await page.locator('#sort').scrollIntoViewIfNeeded();await page.locator('#sort').selectOption('oldest');await expect(page.locator('#device-note')).toBeVisible();await tools(page,'#groups-open');await page.locator('#new-group').click();await page.locator('#group-name').fill('Temporary');await page.locator('#save-group').click();await page.locator('#group-filter').selectOption({label:'Temporary'});await expect(page.locator('.person-card')).toHaveCount(3);
});
test('dense Arabic exports preserve all names and cancellation permits retry',async({page},info)=>{
 test.setTimeout(60000);
 const dense=Array.from({length:150},(_,i)=>({id:Buffer.from('d'+String(i).padStart(5,'0')).toString('base64url'),name:'آمنة عبد الرحمن '+i+' Long family name',calendar:'g',day:calendars.g.toDay(1990,1,1)}));
 await page.goto('./'+encode(dense));await page.locator('#view-link').click();await expect(page.locator('#modal')).toBeHidden();
 await print(page);await page.locator('#doc-language').selectOption('ar');await page.locator('#doc-birthdays').selectOption('both');await expect(page.locator('#download-pdf')).toBeEnabled();
 const model=await page.evaluate(async()=>{const {state}=await import('./state.js');const {createCalendarDocument,createMeasure,loadExportFonts}=await import('./documents.js');await loadExportFonts();return createCalendarDocument(state.people,{year:new Date().getFullYear(),layoutCalendar:'g',birthdayCalendar:'both',locale:'ar'},createMeasure())});
 expect(model.events.length).toBeGreaterThanOrEqual(300);expect(model.pages.flatMap(p=>p.events)).toHaveLength(model.events.length);expect(model.pages.length).toBeGreaterThan(1);
 let pending=page.waitForEvent('download');await page.locator('#download-image').click();await (await pending).saveAs(info.outputPath('dense-arabic.png'));
 await page.locator('#download-pdf').click();await page.locator('#cancel-document').click();await expect(page.locator('#download-pdf')).toBeEnabled({timeout:30000});await expect(page.locator('#modal')).toBeVisible();
 await page.locator('#document-selection').evaluate(el=>{el.closest('details').open=true});await page.locator('#document-selection .selection-all').uncheck();await page.locator('#document-selection .selection-person').first().check();await expect(page.locator('#download-pdf')).toBeEnabled();
 pending=page.waitForEvent('download');await page.locator('#download-pdf').click();await (await pending).saveAs(info.outputPath('arabic-calendar.pdf'));
});

test.afterEach(async({page})=>expect(errors.get(page)).toEqual([]));
async function tools(page,id){if(id==='#groups-open'){const filters=page.locator('#family-options');if(!await filters.evaluate(el=>el.open))await filters.locator('summary').click();await page.locator('#manage-groups').click()}else{await page.locator('#tools-button').click();await page.locator(id).click()}}
async function print(page){await page.locator('#exports-button').click();await page.locator('#print-open').click();await expect(page.locator('#download-pdf')).toBeEnabled({timeout:20000})}
test('groups remain device-only and filter sharing and exports',async({page})=>{
 const original=page.url();await tools(page,'#groups-open');await page.locator('#new-group').click();await page.locator('#group-name').fill('Parents');
 await page.locator('#group-selection .selection-all').uncheck();await page.locator('#group-selection [value="cDAwMDAx"]').check();await page.locator('#save-group').click();
 if(!await page.locator('#family-options').evaluate(el=>el.open))await page.locator('#family-options > summary').click();await page.locator('#group-filter').selectOption({label:'Parents'});await expect(page.locator('.person-card')).toHaveCount(1);expect(page.url()).toBe(original);
 await page.locator('#share-button').click();await expect(page.locator('.share-person:checked')).toHaveCount(1);await page.locator('#close-modal').click();
 await print(page);await expect(page.locator('.selection-person:checked')).toHaveCount(1);await page.locator('#close-modal').click();
 await page.reload();await page.locator('#family-options > summary').click();await page.locator('#group-filter').selectOption({label:'Parents'});await expect(page.locator('.person-card h3')).toHaveText('Parent Test');
 await tools(page,'#groups-open');await page.locator('[data-group]').click();await page.locator('#group-name').fill('Family elders');await page.locator('#save-group').click();
 await tools(page,'#groups-open');await page.locator('[data-group]').click();page.once('dialog',d=>d.accept());await page.locator('#delete-group').click();await expect(page.locator('.person-card')).toHaveCount(3);expect(page.url()).toBe(original);
});
test('comparison and past/future dates do not mutate family links',async({page})=>{
 const original=page.url();await tools(page,'#compare-open');await expect(page.locator('#comparison-result')).toContainText('10 years');await expect(page.locator('#comparison-result')).toContainText('Not born yet');
 await page.locator('#compare-b').selectOption('cDAwMDAx');await expect(page.locator('#comparison-result')).toHaveText('Choose two different people.');await page.locator('#close-modal').click();
 await tools(page,'#reference-open');await page.locator('#reference-year').fill('1995');await page.locator('#reference-month').selectOption('1');await page.locator('#reference-day').fill('1');await page.locator('#reference-apply').click();
 await expect(page.locator('#reference-banner')).toContainText('1995');await expect(page.locator('.person-card').filter({hasText:'Child Test'})).toContainText('Not born yet');expect(page.url()).toBe(original);
 await page.locator('#back-today').click();await expect(page.locator('#reference-banner')).toBeHidden();
 await tools(page,'#reference-open');await page.locator('#reference-year').fill('2030');await page.locator('#reference-apply').click();await expect(page.locator('#reference-banner')).toContainText('2030');expect(page.url()).toBe(original);
});
test('table, timeline, preferences and RTL remain usable',async({page})=>{
 const original=page.url();await page.locator('#people-layout').selectOption('table');await expect(page.locator('.family-table tbody tr')).toHaveCount(3);await page.reload();await expect(page.locator('#people-layout')).toHaveValue('table');
 await page.locator('#timeline-tab').click();await expect(page.locator('.family-timeline li')).toHaveCount(3);await page.locator('#timeline-mode').selectOption('birthdays');await expect(page.locator('.family-timeline li').first()).toBeVisible();
 await page.locator('#language-button').click();await expect(page.locator('html')).toHaveAttribute('dir','rtl');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(page.url()).toBe(original);
});
test('calendar exports valid PDF and print-resolution PNG from one preview',async({page},info)=>{
 await print(page);await expect(page.locator('#doc-ages')).not.toBeChecked();await expect(page.locator('#doc-qr')).not.toBeChecked();
 let pending=page.waitForEvent('download');await page.locator('#download-image').click();const png=await pending,bytes=await readFile(await png.path());expect(bytes.subarray(1,4).toString()).toBe('PNG');expect(bytes.readUInt32BE(16)).toBe(3508);expect(bytes.readUInt32BE(20)).toBe(2480);
 pending=page.waitForEvent('download');await page.locator('#download-pdf').click();const pdf=await pending;await pdf.saveAs(info.outputPath('calendar.pdf'));const document=await PDFDocument.load(await readFile(await pdf.path()));expect(document.getPageCount()).toBe(1);expect(document.getPage(0).getWidth()).toBeCloseTo(841.89,1);
 await page.locator('#document-preview').screenshot({path:info.outputPath('calendar-preview.png')});
 await page.locator('#doc-layout-calendar').selectOption('h');await page.locator('#doc-language').selectOption('ar');await page.locator('#doc-layout').selectOption('monthly');await expect(page.locator('#download-pdf')).toBeEnabled();
 await expect(page.locator('#page-count')).toContainText('12');await page.locator('#document-preview').screenshot({path:info.outputPath('arabic-month-preview.png')});
});
test('export selection, invalid year, QR and overflow are explicit',async({page})=>{
 await print(page);await page.getByText('Choose people',{exact:true}).click();await page.locator('#document-selection .selection-all').uncheck();await expect(page.locator('#download-pdf')).toBeDisabled();await expect(page.locator('#document-status')).toContainText('Select at least one person');
 await page.locator('#document-selection [value="cDAwMDAx"]').check();await expect(page.locator('#download-pdf')).toBeEnabled();await page.locator('#doc-year').fill('9999');await expect(page.locator('#download-pdf')).toBeDisabled();await expect(page.locator('#document-status')).toContainText('Invalid reference date');
 await page.locator('#doc-year').fill(String(calendars.g.parts(today())[0]));await page.locator('#doc-qr').check();await expect(page.locator('#download-pdf')).toBeEnabled();await expect(page.locator('#page-count')).toContainText('2');
});
test('birthday cards and milestone filtering share actual event ages',async({page},info)=>{
 await page.locator('#birthdays-tab').click();await page.locator('#birthday-range').selectOption('365');await page.locator('#birthday-calendar').selectOption('g');await page.locator('[data-agenda-card]').first().click();await expect(page.locator('#download-image')).toBeEnabled({timeout:20000});
 await expect(page.locator('#doc-ages')).not.toBeChecked();await page.locator('#doc-shape').selectOption('portrait');await page.locator('#doc-language').selectOption('ar');await expect(page.locator('#download-image')).toBeEnabled();
 const pending=page.waitForEvent('download');await page.locator('#download-image').click();const bytes=await readFile(await (await pending).path());expect(bytes.readUInt32BE(16)).toBe(1080);expect(bytes.readUInt32BE(20)).toBe(1350);
 await page.locator('#document-preview').screenshot({path:info.outputPath('birthday-card.png')});await page.locator('#close-modal').click();
 await page.locator('#milestones-button').click();await page.locator('.milestone-options input[value="100"]').check();await page.locator('#apply-milestones').click();await expect(page.locator('.agenda-event')).toHaveCount(0);await page.locator('#milestones-button').click();await page.locator('#clear-milestones').click();await expect(page.locator('.agenda-event').first()).toBeVisible();
});
test('offline export includes bundled fonts and PDF runtime',async({page,context})=>{
 await expect(page.locator('#offline-label')).toHaveText('Ready for offline',{timeout:30000});await page.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}))});await context.setOffline(true);await page.reload();await print(page);
 const pending=page.waitForEvent('download');await page.locator('#download-pdf').click();const pdf=await PDFDocument.load(await readFile(await (await pending).path()));expect(pdf.getPageCount()).toBeGreaterThan(0);
});
