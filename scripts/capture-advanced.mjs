import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';
import {PDFDocument,StandardFonts} from 'pdf-lib';
const base=process.env.TEST_BASE_URL||'http://localhost:3100';
await mkdir('artifacts/advanced-upgrade',{recursive:true});
const browser=await chromium.launch({headless:true});
async function capture(page,path,fullPage=true){await page.evaluate(()=>{document.activeElement?.blur();window.scrollTo(0,0)});await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await page.screenshot({path,fullPage})}
try{
 for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:1000}});
  await page.goto(base+'/tools');await page.locator('.directory-tool-card').first().waitFor();
  await capture(page,`artifacts/advanced-upgrade/tools-${width}.png`);
  if(width===390){await page.getByRole('button',{name:'Categories',exact:true}).click();await page.screenshot({path:'artifacts/advanced-upgrade/categories-390.png'});await page.getByRole('button',{name:'Show tools',exact:true}).click()}
  await page.goto(base+'/remove-background');await page.locator('input[type=file]').first().setInputFiles('tests/fixtures/astronaut.png');await page.getByLabel('Segmentation model',{exact:true}).selectOption('portrait');await page.getByRole('button',{name:'Remove background with AI'}).click();await page.getByRole('status').filter({hasText:'Portrait background removed'}).waitFor({timeout:150000});await page.locator('.image-editor-grid').scrollIntoViewIfNeeded();
  await capture(page,`artifacts/advanced-upgrade/portrait-${width}.png`);
  await page.goto(base+'/edit-pdf');const doc=await PDFDocument.create(),font=await doc.embedFont(StandardFonts.Helvetica);const p=doc.addPage([400,500]);p.drawText('A better document workflow',{x:35,y:425,size:23,font});p.drawText('Select real text to edit this PDF.',{x:35,y:375,size:15,font});p.drawText('Your original content stays editable.',{x:35,y:340,size:15,font});await page.locator('input[type=file][accept=".pdf"]').setInputFiles({name:'workspace.pdf',mimeType:'application/pdf',buffer:Buffer.from(await doc.save())});await page.getByRole('button',{name:'Export edited PDF',exact:true}).waitFor();await page.getByRole('button',{name:/^Select text: A better/}).click();await page.locator('.pdf-editor-grid').scrollIntoViewIfNeeded();await capture(page,`artifacts/advanced-upgrade/pdf-editor-${width}.png`);
  await page.goto(base+'/file-compressor');await page.locator('input[type=file]').setInputFiles({name:'document.pdf',mimeType:'application/pdf',buffer:Buffer.from(await doc.save({useObjectStreams:false}))});await page.getByRole('button',{name:'Compress files',exact:true}).click();await page.locator('.compressor-item a[download]').waitFor();await capture(page,`artifacts/advanced-upgrade/compressor-${width}.png`);
  await page.close();console.log(`Advanced screenshots captured at ${width}px`);
 }
}finally{await browser.close()}
