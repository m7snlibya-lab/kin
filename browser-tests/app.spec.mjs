import {test, expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';

async function addPerson(page, name = 'Release Test', {day='18', month='4', year='1991'} = {}) {
  await page.locator('#add-button').click();
  await page.locator('#person-name').fill(name);
  await page.locator('#birth-day').fill(day);
  await page.locator('#birth-month').selectOption(month);
  await page.locator('#birth-year').fill(year);
  await page.locator('#save-person').click();
  await expect(page.locator('#modal')).not.toBeVisible();
  await expect(page.locator('.person-card h3', {hasText:name})).toBeVisible();
}

const pageErrors=new WeakMap();
test.beforeEach(async ({page}) => {
  pageErrors.set(page,[]);page.on('pageerror',error=>pageErrors.get(page).push(error.message));
  await page.goto('./');
  await expect(page.locator('#today-g')).not.toBeEmpty();
  expect(await page.locator('.site-header').evaluate(el=>getComputedStyle(el).display)).toBe('flex');
});

test.afterEach(async({page})=>{expect(pageErrors.get(page)).toEqual([])});

test('adds, edits, searches and removes a person with undo', async ({page}) => {
  const errors=[];
  page.on('pageerror', error=>errors.push(error.message));
  await addPerson(page);
  const originalURL=page.url();
  expect(originalURL).toMatch(/\/kin\/#k1[rz]/);
  await page.reload();
  await expect(page.locator('.person-card')).toHaveCount(1);
  await page.getByRole('button', {name:'Edit Release Test', exact:true}).click();
  await page.locator('[data-calendar="h"]').click();
  await expect(page.locator('#date-preview')).toBeVisible();
  await page.locator('[data-calendar="g"]').click();
  await expect(page.locator('#birth-year')).toHaveValue('1991');
  await expect(page.locator('#birth-day')).toHaveValue('18');
  await page.locator('#person-name').fill('Updated Test');
  await page.locator('#save-person').click();
  await expect(page.locator('#modal')).not.toBeVisible();
  await page.locator('#family-search').fill('missing');
  await expect(page.getByText('No people match these filters', {exact:true})).toBeVisible();
  await page.locator('#clear-search').click();
  await page.getByRole('button', {name:'Edit Updated Test', exact:true}).click();
  await page.locator('#remove-person').click();
  await page.locator('#confirm-remove').click();
  await expect(page.locator('.person-card')).toHaveCount(0);
  await page.locator('#toast-action').click();
  await expect(page.locator('.person-card h3')).toHaveText('Updated Test');
  expect(errors).toEqual([]);
});

test('Arabic digits, RTL and phone layout preserve the family link', async ({page}) => {
  await page.locator('#language-button').click();
  await expect(page.locator('html')).toHaveAttribute('dir','rtl');
  await addPerson(page, 'آمنة تجريبية', {day:'١٨', month:'4', year:'١٩٩١'});
  const arabicURL=page.url();
  await expect(page.locator('#member-count')).toHaveText('١');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.locator('#language-button').click();
  await expect(page.locator('html')).toHaveAttribute('dir','ltr');
  expect(page.url()).toBe(arabicURL);
  await expect(page.locator('.person-card h3')).toHaveText('آمنة تجريبية');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('selected sharing, QR and backup restore work in a fresh browser', async ({page, browser, baseURL}) => {
  await addPerson(page, 'Selected Test');
  await addPerson(page, 'Excluded Test');
  await page.locator('#share-button').click();
  await page.locator('.check-row', {hasText:'Excluded Test'}).locator('input').uncheck();
  const sharedURL=await page.locator('#share-url').inputValue();
  await expect(page.locator('.qr-options summary')).toHaveCount(0);await page.locator('#share-qr-format').click();await expect(page.locator('#qr')).toBeVisible();
  const downloadPromise=page.waitForEvent('download');
  await page.locator('#close-modal').click();await page.locator('#tools-tab').click();await page.locator('#backup-button').click();await page.locator('#backup-selection .check-row',{hasText:'Excluded Test'}).locator('input').uncheck();await page.locator('#download-backup').click();
  const download=await downloadPromise;
  const backupPath=await download.path();
  const backup=JSON.parse(await readFile(backupPath,'utf8'));
  expect(backup.format).toBe('kin-family');
  expect(backup.data).toBe(new URL(sharedURL).hash);
  const fresh=await browser.newContext({locale:'en-US'});
  try {
    const recipient=await fresh.newPage();
    await recipient.goto(sharedURL);await recipient.locator('#view-link').click();
    await expect(recipient.locator('.person-card h3')).toHaveText('Selected Test');
    // Restore in a separate clean context so import cannot rely on local data.
    const restoreContext=await browser.newContext({locale:'en-US'});
    try {
      const restore=await restoreContext.newPage();
      await restore.goto(baseURL);
      await restore.locator('#tools-tab').click();await restore.locator('#import-button').click();
      await restore.locator('#backup-file').setInputFiles(backupPath);
      await expect(restore.locator('.merge-person')).toHaveCount(1);
      await restore.locator('#confirm-merge').click();
      await expect(restore.locator('.person-card h3')).toHaveText('Selected Test');
    } finally {await restoreContext.close()}
  } finally {await fresh.close()}
});

test('birthday agenda downloads recurring and one-time calendar files', async ({page}) => {
  await addPerson(page);
  await page.locator('#birthdays-tab').click();
  await page.locator('#birthday-range').selectOption('365');
  await page.locator('#birthday-calendar').selectOption('g');
  await expect(page.locator('.agenda-event')).toHaveCount(1);
  await page.locator('#tools-tab').click();await page.locator('#exports-button').click();await page.locator('#ics-open').click();
  await expect(page.locator('#repeat-gregorian')).toBeChecked();
  let downloadPromise=page.waitForEvent('download');
  await page.locator('#download-calendar').click();
  let content=await readFile(await (await downloadPromise).path(), 'utf8');
  expect(content).toContain('BEGIN:VCALENDAR\r\n');
  expect(content).toContain('RRULE:FREQ=YEARLY');
  await page.locator('#tools-tab').click();await page.locator('#exports-button').click();await page.locator('#ics-open').click();
  await page.locator('#repeat-gregorian').uncheck();
  downloadPromise=page.waitForEvent('download');
  await page.locator('#download-calendar').click();
  content=await readFile(await (await downloadPromise).path(), 'utf8');
  expect(content).not.toContain('RRULE:');
});

test('invalid dates and unsaved form dismissal are guarded', async ({page}) => {
  await page.locator('#add-button').click();
  await page.locator('#person-name').fill('Draft Test');
  await page.locator('#birth-day').fill('31');
  await page.locator('#birth-month').selectOption('2');
  await page.locator('#birth-year').fill('2001');
  await page.locator('#save-person').click();
  await expect(page.locator('#form-error')).not.toBeEmpty();
  await expect(page.locator('.person-card')).toHaveCount(0);
  page.once('dialog',dialog=>dialog.dismiss());
  await page.locator('#cancel-person').click();
  await expect(page.locator('#modal')).toBeVisible();
  await expect(page.locator('#person-name')).toHaveValue('Draft Test');
  page.once('dialog',dialog=>dialog.accept());
  await page.locator('#cancel-person').click();
  await expect(page.locator('#modal')).not.toBeVisible();
});

test('release works offline after service worker installation at /kin/', async ({page, context}) => {
  await addPerson(page, 'Offline Test');
  await expect(page.locator('#offline-label')).toHaveText('Ready for offline', {timeout:30000});
  await page.evaluate(async()=>{
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));
    }
  });
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('.person-card h3')).toHaveText('Offline Test');
  await expect(page.locator('#offline-label')).toHaveText('Ready for offline');
  await addPerson(page, 'Saved Offline');
  await page.reload();
  await expect(page.locator('.person-card')).toHaveCount(2);
});

test('simultaneous saves are serialized and the stale draft is preserved', async ({page, context, baseURL}) => {
  await addPerson(page, 'Original Person');
  const other=await context.newPage();
  await other.goto(baseURL);
  await expect(other.locator('.person-card')).toHaveCount(1);
  for(const [tab,name] of [[page,'First Draft'],[other,'Second Draft']]){
    await tab.locator('#add-button').click();
    await tab.locator('#person-name').fill(name);
    await tab.locator('#birth-day').fill('18');
    await tab.locator('#birth-month').selectOption('4');
    await tab.locator('#birth-year').fill('1991');
  }
  await page.evaluate(()=>{
    window.testLock=navigator.locks.request('kin.family.v1:'+location.pathname,()=>new Promise(resolve=>{window.releaseTestLock=resolve}));
  });
  await expect.poll(()=>page.evaluate(()=>typeof window.releaseTestLock)).toBe('function');
  await Promise.all([page.locator('#save-person').click(),other.locator('#save-person').click()]);
  await expect(page.locator('#save-person')).toBeDisabled();
  await expect(other.locator('#save-person')).toBeDisabled();
  await expect(page.locator('#save-person')).toHaveText('Saving…');await expect(page.locator('#save-person')).toHaveAttribute('aria-busy','true');
  await page.evaluate(()=>window.releaseTestLock());
  await expect.poll(async()=>Number(await page.locator('#modal').isVisible())+Number(await other.locator('#modal').isVisible())).toBe(1);
  const loser=await page.locator('#modal').isVisible()?page:other;
  await expect(loser.locator('#person-name')).toHaveValue(/Draft$/);
  await expect(loser.locator('#notice')).toContainText('changed in another tab');
  const fresh=await context.newPage();
  await fresh.goto(baseURL);
  await expect(fresh.locator('.person-card')).toHaveCount(2);
  await expect(fresh.locator('.person-card h3', {hasText:'Original Person'})).toBeVisible();
  // Review combines the winner with the loser's existing snapshot, without
  // discarding the winner or silently writing the unsaved editor draft.
  loser.once('dialog',dialog=>dialog.accept());
  await loser.locator('#close-modal').click();
  await loser.locator('#notice button').click();
  await loser.locator('#confirm-merge').click();
  await expect(loser.locator('.person-card')).toHaveCount(2);
});

test('unavailable browser storage leaves a recoverable family URL', async ({page, context}) => {
  await context.addInitScript(()=>{
    Storage.prototype.getItem=()=>{throw new DOMException('Blocked','SecurityError')};
    Storage.prototype.setItem=()=>{throw new DOMException('Blocked','SecurityError')};
    Object.defineProperty(navigator,'locks',{value:{request:()=>Promise.reject(new DOMException('Blocked','SecurityError'))}});
  });
  await page.reload();
  await addPerson(page, 'URL Recovery');
  expect(page.url()).toContain('#k1');
  await expect(page.locator('#notice')).toContainText('Browser storage is unavailable');await expect(page.locator('#family-mode')).toHaveText('Only in this link');
  await page.reload();await page.locator('#view-link').click();
  await expect(page.locator('.person-card h3')).toHaveText('URL Recovery');
});

test('damaged incoming links cannot replace a saved family', async ({page, baseURL}) => {
  await addPerson(page, 'Preserved Person');
  await page.goto(baseURL+'#k1rBROKEN');
  await expect(page.locator('#notice')).toContainText('Your local family has not been replaced');
  await expect(page.locator('.person-card h3')).toHaveText('Preserved Person');
  await page.locator('#notice button').click();
  expect(page.url()).not.toContain('BROKEN');
});

test('untrusted names display as text and first install has no update banner', async ({page}) => {
  await expect(page.locator('#offline-label')).toHaveText('Ready for offline', {timeout:30000});
  await expect(page.locator('#update-notice')).not.toBeVisible();
  const name='<img src=x onerror=alert(1)>';
  await addPerson(page,name);
  await expect(page.locator('.person-card img')).toHaveCount(0);
  await page.locator('#share-button').click();
  await expect(page.locator('.check-row bdi')).toHaveText(name);
  await expect(page.locator('#modal img')).toHaveCount(0);
});

test('invalid year identifies and focuses the year field', async ({page}) => {
  await page.locator('#add-button').click();
  await page.locator('#person-name').fill('Invalid Year');
  await page.locator('#birth-day').fill('1');
  await page.locator('#birth-month').selectOption('1');
  await page.locator('#birth-year').fill('9999');
  await page.locator('#save-person').click();
  await expect(page.locator('#birth-year')).toBeFocused();
  await expect(page.locator('#birth-year')).toHaveAttribute('aria-invalid','true');
});

test('keyboard skip control keeps the saved family URL intact', async ({page}) => {
  await addPerson(page);
  const url=page.url();
  await page.reload();
  await page.keyboard.press('Tab');
  await expect(page.locator('#skip-content')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();
  expect(page.url()).toBe(url);
});

test('a stalled save times out safely and the editor can retry',async({page})=>{
 await page.locator('#add-button').click();
 await page.locator('#person-name').fill('Retry Draft');
 await page.locator('#birth-day').fill('18');
 await page.locator('#birth-month').selectOption('4');
 await page.locator('#birth-year').fill('1991');
 await page.evaluate(()=>{
  window.testLock=navigator.locks.request('kin.family.v1:'+location.pathname,()=>new Promise(resolve=>{window.releaseTestLock=resolve}));
 });
 await expect.poll(()=>page.evaluate(()=>typeof window.releaseTestLock)).toBe('function');
 await page.clock.install();
 await page.locator('#save-person').click();
 await expect(page.locator('#close-modal')).toBeDisabled();
 await page.clock.fastForward(10001);
 await expect(page.locator('#save-person')).toBeEnabled();
 await expect(page.locator('#person-name')).toHaveValue('Retry Draft');
 await expect(page.locator('#save-person')).toHaveText('Add to my circle');await expect(page.locator('#save-person')).not.toHaveAttribute('aria-busy','true');await expect(page.locator('#dialog-feedback')).toBeVisible();
 await expect(page.locator('.person-card')).toHaveCount(0);
 await page.evaluate(()=>window.releaseTestLock());
 await page.clock.resume();
 await page.locator('#save-person').click();
 await expect(page.locator('#modal')).not.toBeVisible();
 await expect(page.locator('.person-card h3')).toHaveText('Retry Draft');
});
