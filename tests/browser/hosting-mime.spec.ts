import {test,expect} from '@playwright/test';
import {PDFDocument,StandardFonts} from 'pdf-lib';
import fs from 'node:fs/promises';

// Hostinger's static file server labels .mjs and .wasm files as text/plain, and browsers refuse to run
// module scripts with that type. These tests serve the engine files the same way so the PDF.js worker and the
// ONNX Runtime loader must keep working regardless of the host's MIME types (see lib/module-url.ts).
test.beforeEach(async({context})=>{
  await context.route(/\/(engines\/[^?]*|pdf\.worker\.min\.mjs)(\?.*)?$/,async route=>{
    const response=await route.fetch();
    await route.fulfill({response,headers:{...response.headers(),'content-type':'text/plain'}});
  });
});

async function textPdf(text:string){const doc=await PDFDocument.create();const font=await doc.embedFont(StandardFonts.Helvetica);doc.addPage([400,300]).drawText(text,{x:40,y:200,size:20,font});return Buffer.from(await doc.save())}

test('PDF to text works when the PDF.js worker is served as text/plain',async({page})=>{
  await page.goto('/tools/pdf-to-text');
  await page.locator('input[type=file]').setInputFiles({name:'sample.pdf',mimeType:'application/pdf',buffer:await textPdf('Hello Editgoo')});
  await page.getByRole('button',{name:/^Process 1 file/}).click();
  await expect(page.getByText('Your file is ready.')).toBeVisible();
  const download=page.waitForEvent('download');
  await page.locator('.results-box a[download]').click();
  expect(await fs.readFile((await (await download).path())!,'utf8')).toContain('Hello Editgoo');
});

test('PDF to JPG renders pages when the worker is served as text/plain',async({page})=>{
  await page.goto('/tools/pdf-to-jpg');
  await page.locator('input[type=file]').setInputFiles({name:'sample.pdf',mimeType:'application/pdf',buffer:await textPdf('Render me')});
  await page.getByRole('button',{name:/^Process 1 file/}).click();
  await expect(page.getByText('Your file is ready.')).toBeVisible();
  await expect(page.locator('main [role=alert]')).toHaveCount(0);
});

test('PDF first-page preview works when the worker is served as text/plain',async({page})=>{
  await page.goto('/tools/merge-pdf');
  await page.locator('input[type=file]').setInputFiles({name:'preview.pdf',mimeType:'application/pdf',buffer:await textPdf('Preview')});
  await expect(page.getByRole('img',{name:'First page of preview.pdf'})).toBeVisible();
});

test('Edit PDF renders its preview when the worker is served as text/plain',async({page})=>{
  await page.goto('/edit-pdf');
  await page.locator('input[type=file][accept=".pdf"]').setInputFiles({name:'edit.pdf',mimeType:'application/pdf',buffer:await textPdf('REMOVE ME')});
  await expect(page.getByRole('button',{name:/^Select text: REMOVE ME/})).toBeVisible();
  await expect(page.getByRole('button',{name:'Export edited PDF',exact:true})).toBeEnabled();
  await expect(page.locator('main [role=alert]')).toHaveCount(0);
});

test('background removal works when ONNX Runtime files are served as text/plain',async({page})=>{
  test.setTimeout(300000);
  await page.goto('/remove-background');
  await page.locator('input[type=file]').first().setInputFiles('tests/fixtures/objects/watch.jpg');
  await expect(page.getByRole('status')).toContainText('Image loaded');
  await page.getByRole('button',{name:'Remove background',exact:true}).click();
  await expect(page.getByRole('status')).toContainText('Foreground estimated.',{timeout:240000});
  await expect(page.locator('main [role=alert]')).toHaveCount(0);
});
