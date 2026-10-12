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

test.beforeEach(async ({page}) => {
  await page.goto('./');
  await expect(page.locator('#today-g')).not.toBeEmpty();
});

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
  await page.locator('#family-search').fill('missing');
  await expect(page.getByText('No matching names', {exact:true})).toBeVisible();
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
  await expect(page.locator('#qr')).toBeVisible();
  const downloadPromise=page.waitForEvent('download');
  await page.locator('#download-backup').click();
  const download=await downloadPromise;
  const backupPath=await download.path();
  const backup=JSON.parse(await readFile(backupPath,'utf8'));
  expect(backup.format).toBe('kin-family');
  expect(backup.data).toBe(new URL(sharedURL).hash);
  const fresh=await browser.newContext({locale:'en-US'});
  try {
    const recipient=await fresh.newPage();
    await recipient.goto(sharedURL);
    await expect(recipient.locator('.person-card h3')).toHaveText('Selected Test');
    // Restore in a separate clean context so import cannot rely on local data.
    const restoreContext=await browser.newContext({locale:'en-US'});
    try {
      const restore=await restoreContext.newPage();
      await restore.goto(baseURL);
      await restore.locator('#import-button').click();
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
  await page.locator('#export-calendar').click();
  await expect(page.locator('#repeat-gregorian')).toBeChecked();
  let downloadPromise=page.waitForEvent('download');
  await page.locator('#download-calendar').click();
  let content=await readFile(await (await downloadPromise).path(), 'utf8');
  expect(content).toContain('BEGIN:VCALENDAR\r\n');
  expect(content).toContain('RRULE:FREQ=YEARLY');
  await page.locator('#export-calendar').click();
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
