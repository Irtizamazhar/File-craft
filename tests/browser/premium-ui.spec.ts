import {expect,test} from '@playwright/test';
import {PDFDocument} from 'pdf-lib';

test('homepage category links open the matching directory collection',async({page})=>{
  await page.goto('/');
  await page.locator('.home-category-grid').getByRole('link',{name:/Optimize Files/}).click();
  await expect(page).toHaveURL(/group=Optimize/);
  await expect(page.getByRole('heading',{name:'Optimize PDF',exact:true})).toBeVisible();
  const results=page.locator('.directory-grid');
  await expect(results.getByRole('heading',{name:'Compress PDF'})).toBeVisible();
  await expect(results.getByRole('heading',{name:'Merge PDF'})).toHaveCount(0);
  await page.getByRole('textbox',{name:'Search tools'}).fill('repair');
  await expect(results.locator('a')).toHaveCount(1);
  await results.getByRole('link',{name:/Repair PDF/}).click();
  await expect(page).toHaveURL(/\/tools\/repair-pdf$/);
});

test('directory filters fit 320 px and the sheet returns keyboard focus',async({page})=>{
  await page.setViewportSize({width:320,height:720});
  await page.goto('/tools?category=Images');
  await expect(page.locator('.directory-grid .directory-tool-card')).toHaveCount(12);
  const trigger=page.getByRole('button',{name:'Categories',exact:true});
  await trigger.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.getByRole('radio',{name:'Convert to PDF',exact:true}).check();
  await page.getByRole('button',{name:'Show tools'}).click();
  await expect(page.getByRole('heading',{name:'Convert to PDF',exact:true})).toBeVisible();
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth)).toBe(320);
});

test('a selected PDF has an on-demand first-page preview',async({page})=>{
  const pdf=await PDFDocument.create();
  pdf.addPage([600,800]);
  const buffer=Buffer.from(await pdf.save());
  await page.goto('/tools/merge-pdf');
  await page.locator('input[type=file]').setInputFiles({name:'preview.pdf',mimeType:'application/pdf',buffer});
  await page.getByText('Preview first page of preview.pdf',{exact:true}).click();
  const image=page.getByRole('img',{name:'First page of preview.pdf'});
  await expect(image).toBeVisible();
  expect(await image.evaluate((element:HTMLImageElement)=>element.naturalHeight)).toBe(420);
  await page.getByRole('button',{name:'Clear all'}).click();
  await expect(page.getByRole('button',{name:'Choose files'})).toBeFocused();
  await expect(image).toHaveCount(0);
});
