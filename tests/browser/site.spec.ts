import {test,expect} from '@playwright/test';
import {PDFDocument} from 'pdf-lib';
import fs from 'node:fs/promises';
for(const width of [320,360,390,430,768,1024,1280,1440,1920])test('homepage fits '+width+'px',async({page})=>{await page.setViewportSize({width,height:900});await page.goto('/');await expect(page.getByRole('heading',{level:1})).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)});
test('actual merge download contains four pages',async({page})=>{
 const doc=await PDFDocument.create();doc.addPage();doc.addPage();const buffer=Buffer.from(await doc.save());
 await page.goto('/tools/merge-pdf');await page.locator('input[type=file]').setInputFiles([{name:'a.pdf',mimeType:'application/pdf',buffer},{name:'b.pdf',mimeType:'application/pdf',buffer}]);
 await page.getByRole('button',{name:/Process 2 files/}).click();const downloadEvent=page.waitForEvent('download');await page.getByRole('link',{name:/merged.pdf/}).click();const path=await(await downloadEvent).path();expect(path).toBeTruthy();expect((await PDFDocument.load(await fs.readFile(path!))).getPageCount()).toBe(4);
});
