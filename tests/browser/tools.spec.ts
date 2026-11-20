import {test,expect} from '@playwright/test';
import {PDFDocument,StandardFonts,rgb} from 'pdf-lib';
import {Document,Paragraph,Packer} from 'docx';
import ExcelJS from 'exceljs';
import PptxGenJS from 'pptxgenjs';
import JSZip from 'jszip';
import fs from 'node:fs/promises';
import tools from '../../catalog/tools.json';
async function pdfSample(){const doc=await PDFDocument.create();const font=await doc.embedFont(StandardFonts.Helvetica);for(let n=0;n<2;n++){const p=doc.addPage([400,500]);p.drawText('Hello FileCraft page '+(n+1),{x:35,y:400,size:16,font,color:rgb(0,0,0)});}const field=doc.getForm().createTextField('Name');field.setText('Sample user');field.addToPage(doc.getPage(0),{x:35,y:330,width:180,height:25});return Buffer.from(await doc.save({useObjectStreams:false}))}
for(const tool of tools)test(tool.slug+' real file workflow',async({page})=>{
 await page.goto('/tools/'+tool.slug);let ext=tool.accept.split(',')[0].slice(1),buffer:Buffer;
 if(ext==='pdf')buffer=await pdfSample();
 else if(['jpg','jpeg','png','webp'].includes(ext)){const mime=ext==='jpg'||ext==='jpeg'?'image/jpeg':'image/'+ext;const bytes=await page.evaluate(mime=>{const c=document.createElement('canvas');c.width=120;c.height=80;const ctx=c.getContext('2d')!;ctx.fillStyle='#ee4455';ctx.fillRect(0,0,120,80);ctx.fillStyle='#11182e';ctx.fillRect(15,15,60,35);return Array.from(Uint8Array.from(atob(c.toDataURL(mime).split(',')[1]),x=>x.charCodeAt(0)))},mime);buffer=Buffer.from(bytes)}
 else if(ext==='docx')buffer=await Packer.toBuffer(new Document({sections:[{children:[new Paragraph('Hello FileCraft document')]}]}));
 else if(ext==='xlsx'){const b=new ExcelJS.Workbook();b.addWorksheet('Sample').addRows([['Name','Value'],['FileCraft',42]]);buffer=Buffer.from(await b.xlsx.writeBuffer())}
 else if(ext==='pptx'){const b=new PptxGenJS();b.addSlide().addText('Hello FileCraft slide',{x:1,y:1,w:8,h:1});buffer=await b.write({outputType:'nodebuffer'}) as Buffer}
 else buffer=Buffer.from(ext==='csv'?'Name,Value\nFileCraft,42':ext==='html'?'<h1>Hello FileCraft HTML</h1>':'Hello FileCraft text');
 const count=['merge-pdf','merge-docx','compare-pdf'].includes(tool.slug)?2:1;
 await page.locator('input[type=file]').setInputFiles(Array.from({length:count},(_,i)=>({name:'sample-'+i+'.'+ext,mimeType:'application/octet-stream',buffer})));
 await expect(page.getByRole('button',{name:/^Process [12] file/})).toBeEnabled();
 for(const c of tool.controls){if(c.key==='pages')await page.getByLabel(c.label,{exact:true}).fill('2');if(c.key==='field')await page.getByLabel(c.label,{exact:true}).fill('Name')}
 await page.getByRole('button',{name:/^Process [12] file/}).click();
 await expect(page.getByText(/Your file is ready|Your files are ready/)).toBeVisible();
 const link=page.locator('.results-box a[download]').first();const event=page.waitForEvent('download');await link.click();const download=await event;const path=await download.path();expect(path).toBeTruthy();const bytes=await fs.readFile(path!);expect(bytes.length).toBeGreaterThan(0);const output=download.suggestedFilename();
 if(output.endsWith('.pdf')){const parsed=await PDFDocument.load(bytes);expect(parsed.getPageCount()).toBeGreaterThan(0);if(tool.slug==='grayscale-pdf'){expect(parsed.getPage(0).getWidth()).toBe(400);expect(parsed.getPage(0).getHeight()).toBe(500)}if(tool.slug==='merge-pdf')expect(parsed.getPageCount()).toBe(4);if(tool.slug==='rotate-pdf')expect(parsed.getPage(0).getRotation().angle).toBe(90)}
 else if(/\.(zip|docx|xlsx|pptx)$/.test(output)){const zip=await JSZip.loadAsync(bytes);expect(Object.keys(zip.files).length).toBeGreaterThan(0);if(output.endsWith('.docx'))expect(await zip.file('word/document.xml')!.async('string')).toContain('FileCraft');if(output.endsWith('.xlsx')){expect(zip.file('xl/workbook.xml')).toBeTruthy();const book=new ExcelJS.Workbook();await book.xlsx.load(bytes as never);const values:string[]=[];book.eachSheet(sheet=>sheet.eachRow(row=>values.push(JSON.stringify(row.values))));expect(values.join(' ')).toContain('FileCraft')}if(output.endsWith('.pptx'))expect(zip.file('ppt/presentation.xml')).toBeTruthy()}
 else if(output.endsWith('.png'))expect([...bytes.subarray(0,4)]).toEqual([137,80,78,71]);
 else if(output.endsWith('.jpg'))expect([...bytes.subarray(0,3)]).toEqual([255,216,255]);
 else if(output.endsWith('.webp')){expect(bytes.subarray(0,4).toString()).toBe('RIFF');expect(bytes.subarray(8,12).toString()).toBe('WEBP')}
 else if(tool.slug!=='compare-pdf')expect(bytes.toString()).toContain('FileCraft');
 if(/\.(png|jpg|webp)$/.test(output)){const dimensions=await page.evaluate(async raw=>{const image=await createImageBitmap(new Blob([new Uint8Array(raw)]));const size=[image.width,image.height];image.close();return size},Array.from(bytes));expect(dimensions[0]).toBeGreaterThan(0);expect(dimensions[1]).toBeGreaterThan(0)}
 if(tool.slug==='compress-pdf')expect(bytes.length).toBeLessThan(buffer.length);
});
