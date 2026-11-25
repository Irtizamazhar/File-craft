/** Real client-side file operations. Input document bytes stay in the browser. */
export type ProcessedFile = {name:string; blob:Blob};
type Opt = Record<string,string>;
const LIMIT_PDF_PAGES=30;
const asBlob=(bytes:Uint8Array|ArrayBuffer,type:string)=>new Blob([bytes as BlobPart],{type});
const textOut=(name:string,text:string):ProcessedFile=>({name,blob:new Blob([text],{type:'text/plain;charset=utf-8'})});
const stem=(name:string)=>name.replace(/\.[^.]+$/,'').replace(/[^a-zA-Z0-9_.-]/g,'_').slice(0,75)||'document';
const bytesOf=async(file:File)=>new Uint8Array(await file.arrayBuffer());
const int=(n:string|undefined,fallback:number)=>{const i=Number(n);return Number.isFinite(i)?Math.trunc(i):fallback};
function fail(message:string):never {throw new Error(message)}
function ensure(cond:unknown,message:string):asserts cond {if(!cond)fail(message)}
function parsePages(raw:string|undefined,total:number):number[]{
  ensure(!!raw?.trim(),'Provide the page numbers (for example: 1,3-5).');
  const selected:number[]=[];
  for(const token of raw!.split(',')){
    const match=/^\s*(\d+)(?:\s*-\s*(\d+))?\s*$/.exec(token);
    ensure(match,'Use page numbers such as 1,3-5.');
    const a=Number(match![1]),b=match![2]?Number(match![2]):a;
    ensure(a>=1&&b<=total&&b>=a&&b-a<500,'Page range is outside this PDF.');
    for(let p=a;p<=b;p++)if(!selected.includes(p-1))selected.push(p-1);
  }
  ensure(selected.length>0,'No pages selected.');return selected;
}
async function pdfLib(){return import('pdf-lib')}
async function loadPdf(file:File){const {PDFDocument}=await pdfLib();let doc;try{doc=await PDFDocument.load(await bytesOf(file))}catch{fail('Could not open this PDF. It may be encrypted, damaged, or unsupported.')}ensure(doc.getPageCount()<=500,'Page editing supports up to 500 pages per PDF. Split larger documents first.');return doc}
async function pdfOut(doc:any,name:string):Promise<ProcessedFile>{return {name,blob:asBlob(await doc.save({useObjectStreams:true}),'application/pdf')}}
async function fileZip(items:ProcessedFile[],name:string):Promise<ProcessedFile>{const {default:JSZip}=await import('jszip');const zip=new JSZip();for(const [i,x] of items.entries())zip.file(String(i+1).padStart(2,'0')+'-'+x.name,await x.blob.arrayBuffer());return {name,blob:await zip.generateAsync({type:'blob',compression:'DEFLATE'})}}
// The PDF.js worker loads through a JavaScript-typed Blob URL because some hosts serve .mjs as text/plain
// (see lib/module-url.ts). Imported dynamically so the Node unit tests can load this file on its own.
async function pdfJs(file:File){const [pdfjs,{moduleUrl}]=await Promise.all([import('pdfjs-dist'),import('./module-url')]);pdfjs.GlobalWorkerOptions.workerSrc=await moduleUrl('/pdf.worker.min.mjs');const doc=await pdfjs.getDocument({data:await bytesOf(file),useSystemFonts:true}).promise;if(doc.numPages>250){await doc.destroy();fail('For large PDFs, split into smaller files first (maximum 250 pages).')}return doc}
async function pageText(doc:any,pageNo:number):Promise<string>{const page=await doc.getPage(pageNo);const content=await page.getTextContent();const byLine=new Map<number,{x:number;s:string}[]>();for(const item of content.items as any[]){if(typeof item.str!=='string')continue;const y=Math.round(item.transform?.[5]||0);const arr=byLine.get(y)||[];arr.push({x:item.transform?.[4]||0,s:item.str});byLine.set(y,arr)}return [...byLine.entries()].sort((a,b)=>b[0]-a[0]).map(([,line])=>line.sort((a,b)=>a.x-b.x).map(t=>t.s).join(' ')).join('\n')}
async function allText(file:File):Promise<string>{const doc=await pdfJs(file);try{const out:string[]=[];for(let i=1;i<=doc.numPages;i++)out.push(await pageText(doc,i));return out.join('\n\n')}finally{await doc.destroy()}}
async function render(doc:any,pageNo:number,scale=1.4):Promise<HTMLCanvasElement>{const page=await doc.getPage(pageNo);const viewport=page.getViewport({scale});ensure(viewport.width*viewport.height<=14_000_000,'This page is too large to render safely.');const canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);const ctx=canvas.getContext('2d',{willReadFrequently:true});ensure(ctx,'Unable to create image canvas.');await page.render({canvasContext:ctx,canvas,viewport,background:'rgb(255,255,255)'} as any).promise;return canvas}
export async function previewPdf(file:File){
  const doc=await pdfJs(file);
  try {
    const page=await doc.getPage(1);
    const {width,height}=page.getViewport({scale:1});
    const canvas=await render(doc,1,Math.min(1,420/Math.max(width,height)));
    return {src:canvas.toDataURL(),width:canvas.width,height:canvas.height};
  } finally {
    await doc.destroy();
  }
}
const canvasBlob=(canvas:HTMLCanvasElement,mime:string,quality=0.86)=>new Promise<Blob>((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Image export failed.')),mime,quality));
async function fileCanvas(file:File):Promise<HTMLCanvasElement>{const image=await createImageBitmap(file);try{ensure(image.width*image.height<25_000_000,'Image dimensions exceed the safe limit.');const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const ctx=canvas.getContext('2d');ensure(ctx,'Canvas unavailable');ctx.drawImage(image,0,0);return canvas}finally{image.close()}}
async function pngData(file:File):Promise<Uint8Array>{if(/\.(png)$/i.test(file.name))return bytesOf(file);const c=await fileCanvas(file);return new Uint8Array(await (await canvasBlob(c,'image/png')).arrayBuffer())}
async function toDataURL(file:File):Promise<string>{return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result));r.onerror=()=>reject(new Error('Could not read image.'));r.readAsDataURL(file)})}
async function rasterImagesToPdf(files:File[]):Promise<ProcessedFile>{const {PDFDocument}=await pdfLib();const doc=await PDFDocument.create();for(const file of files){let image:any;if(/\.(jpe?g)$/i.test(file.name))image=await doc.embedJpg(await bytesOf(file));else image=await doc.embedPng(await pngData(file));const scale=Math.min(1,595/image.width,842/image.height);const w=image.width*scale,h=image.height*scale;const page=doc.addPage([w,h]);page.drawImage(image,{x:0,y:0,width:w,height:h})}return pdfOut(doc,'images-converted.pdf')}
async function drawTextPdf(text:string,filename:string):Promise<ProcessedFile>{const {PDFDocument,StandardFonts,rgb}=await pdfLib();const doc=await PDFDocument.create();const font=await doc.embedFont(StandardFonts.Helvetica);const maxWidth=505,lineH=15,fontSize=10;let page=doc.addPage([595,842]),y=790;ensure(!/[^\x09\x0A\x20-\x7E]/.test(text),'This basic PDF exporter supports Latin/ASCII text only. Use another exporter for Urdu and other Unicode scripts.');const normalized=text.replace(/\r/g,'');for(const raw of normalized.split('\n')){let line='';const words=raw.split(/(\s+)/);const wraps:string[]=[];for(const word of words){if(font.widthOfTextAtSize(line+word,fontSize)>maxWidth&&line){wraps.push(line);line=''};if(font.widthOfTextAtSize(word,fontSize)>maxWidth){for(const ch of word){if(font.widthOfTextAtSize(line+ch,fontSize)>maxWidth){wraps.push(line);line=''}line+=ch}}else line+=word}wraps.push(line);for(const wrap of wraps){if(y<45){page=doc.addPage([595,842]);y=790}page.drawText(wrap.trimEnd(),{x:45,y,size:fontSize,font,color:rgb(.13,.17,.23)});y-=lineH}}return pdfOut(doc,filename)}
async function createDocx(text:string,name:string):Promise<ProcessedFile>{const d=await import('docx');const lines=text.replace(/\r/g,'').split('\n');ensure(lines.length<=20000,'Document is too long for browser conversion.');const paras=lines.map(line=>new d.Paragraph({children:[new d.TextRun(line||' ')]}));const document=new d.Document({sections:[{properties:{},children:paras}]});const blob=await d.Packer.toBlob(document);return {name,blob}}
async function mammothAPI(){const mod:any=await import('mammoth/mammoth.browser');return mod.default||mod}
async function docxText(file:File){const mammoth=await mammothAPI();const result=await mammoth.extractRawText({arrayBuffer:await file.arrayBuffer()});return String(result.value||'')}
function safeExportHtml(html:string):string{
 const doc=new DOMParser().parseFromString(html,'text/html');
 doc.querySelectorAll('script,style,iframe,object,embed,form,input,button,svg,math,link,meta,base').forEach(node=>node.remove());
 for(const el of Array.from(doc.body.querySelectorAll('*'))){
  for(const attr of Array.from(el.attributes)){
   if(attr.name==='href'&&el.tagName==='A'){if(!/^(https?:|mailto:|#)/i.test(attr.value.trim()))el.removeAttribute(attr.name)}
   else if(attr.name==='src'&&el.tagName==='IMG'){if(!/^data:image\/(png|jpeg|gif|webp);base64,/i.test(attr.value))el.removeAttribute(attr.name)}
   else if(!['alt','colspan','rowspan'].includes(attr.name))el.removeAttribute(attr.name);
  }
 }
 return doc.body.innerHTML;
}
async function docxHtml(file:File){const mammoth=await mammothAPI();const result=await mammoth.convertToHtml({arrayBuffer:await file.arrayBuffer()});return safeExportHtml(String(result.value||''))}
async function Excel(){const mod:any=await import('exceljs/dist/exceljs.min.js');return mod.default||mod}
async function workbook():Promise<any>{const X=await Excel();return new X.Workbook()}
async function writeWorkbook(book:any,name:string):Promise<ProcessedFile>{const bytes=await book.xlsx.writeBuffer();return {name,blob:asBlob(bytes,'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}}
async function readWorkbook(file:File):Promise<any>{const book=await workbook();try{await book.xlsx.load(await file.arrayBuffer())}catch{fail('This Excel workbook could not be opened. Use a valid .xlsx file.')}return book}
function parseCSV(raw:string):string[][]{const rows:string[][]=[];let row:string[]=[],cell='',quoted=false;for(let i=0;i<raw.length;i++){const ch=raw[i];if(ch==='"'){if(quoted&&raw[i+1]==='"'){cell+='"';i++}else quoted=!quoted}else if(ch===','&&!quoted){row.push(cell);cell=''}else if((ch==='\n'||ch==='\r')&&!quoted){if(ch==='\r'&&raw[i+1]==='\n')i++;row.push(cell);rows.push(row);row=[];cell=''}else cell+=ch}if(cell||row.length){row.push(cell);rows.push(row)}ensure(!quoted,'Malformed CSV: unclosed quote.');ensure(rows.length<50000,'CSV has too many rows.');return rows}
const csvCell=(v:any)=>{const text=String(v===undefined||v===null?'':v);return /[",\n\r]/.test(text)?'"'+text.replace(/"/g,'""')+'"':text};
function excelValue(cell:any):string{const v=cell?.value;if(v==null)return '';if(v instanceof Date)return v.toISOString();if(typeof v==='object'){if('text' in v)return String(v.text);if('result' in v)return String(v.result??'');if('richText' in v)return v.richText.map((x:any)=>x.text).join('')}return String(v)}
function escapeHtml(s:string){return s.replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]||ch))}
function htmlText(html:string):string{const d=new DOMParser().parseFromString(html,'text/html');d.querySelectorAll('script,style,iframe,object').forEach(el=>el.remove());d.querySelectorAll('br').forEach(el=>el.replaceWith('\n'));d.querySelectorAll('p,div,li,h1,h2,h3,tr').forEach(el=>el.append('\n'));return d.body.textContent||''}
async function pptxText(file:File){const {default:JSZip}=await import('jszip');const zip=await JSZip.loadAsync(await file.arrayBuffer());const names=Object.keys(zip.files).filter(n=>/^ppt\/slides\/slide\d+\.xml$/.test(n)).sort((a,b)=>Number(a.match(/slide(\d+)/)?.[1])-Number(b.match(/slide(\d+)/)?.[1]));ensure(names.length>0,'PowerPoint slides not found.');const blocks:string[]=[];for(const n of names){const xml=await zip.files[n].async('string');const doc=new DOMParser().parseFromString(xml,'application/xml');const texts=Array.from(doc.getElementsByTagName('a:t')).map(x=>x.textContent||'');blocks.push(`--- Slide ${blocks.length+1} ---\n${texts.join('\n')}`)}return blocks.join('\n\n')}
async function createPptx(files:Array<{name:string;data:string;width:number;height:number}>):Promise<ProcessedFile>{const mod:any=await import('pptxgenjs');const Pptx=mod.default||mod;const pptx=new Pptx();pptx.layout='LAYOUT_WIDE';for(const item of files){const slide=pptx.addSlide();slide.background={color:'FFFFFF'};const r=Math.min(13.33/item.width,7.5/item.height),w=item.width*r,h=item.height*r;slide.addImage({data:item.data,x:(13.33-w)/2,y:(7.5-h)/2,w,h})}const blob:any=await pptx.write({outputType:'blob'});return {name:'slides-converted.pptx',blob:blob instanceof Blob?blob:asBlob(blob as ArrayBuffer,'application/vnd.openxmlformats-officedocument.presentationml.presentation')}}
async function comparePdf(files:File[]):Promise<ProcessedFile>{const a=(await allText(files[0])).split('\n'),b=(await allText(files[1])).split('\n');const lines:string[]=[`Text comparison of ${files[0].name} and ${files[1].name}`,'Note: compares selectable text by line, not visual appearance.',''];const total=Math.max(a.length,b.length);for(let i=0;i<total;i++){if(a[i]!==b[i]){lines.push('Line '+(i+1));lines.push('- '+(a[i]||'[missing]'));lines.push('+ '+(b[i]||'[missing]'));lines.push('')}}if(lines.length===3)lines.push('No text differences were found.');return textOut('comparison-report.txt',lines.join('\n'))}
export async function validateInput(file:File):Promise<void>{
 const ext=file.name.split('.').pop()?.toLowerCase();
 const head=new Uint8Array(await file.slice(0,1024).arrayBuffer());
 const prefix=(values:number[])=>values.every((v,i)=>head[i]===v);
 if(ext==='pdf')ensure(new TextDecoder().decode(head).includes('%PDF-'),'The selected file does not contain a PDF header.');
 else if(ext==='png')ensure(prefix([137,80,78,71,13,10,26,10]),'Invalid PNG signature.');
 else if(ext==='jpg'||ext==='jpeg')ensure(prefix([255,216,255]),'Invalid JPEG signature.');
 else if(ext==='webp')ensure(new TextDecoder().decode(head.slice(0,4))==='RIFF'&&new TextDecoder().decode(head.slice(8,12))==='WEBP','Invalid WEBP signature.');
 else if(['docx','xlsx','pptx'].includes(ext||'')){
  ensure(prefix([80,75,3,4]),'This Office file is not a valid ZIP-based document.');
  const {default:JSZip}=await import('jszip');const zip=await JSZip.loadAsync(await file.arrayBuffer());
  const entries=Object.values(zip.files);let expanded=0;
  ensure(entries.length<=5000,'Office archive contains too many entries.');
  for(const entry of entries){expanded+=(entry as any)._data?.uncompressedSize||0;ensure(expanded<=80*1048576,'Office archive expands beyond the 80 MB safety limit.');}
  const required=ext==='docx'?'word/document.xml':ext==='xlsx'?'xl/workbook.xml':'ppt/presentation.xml';
  ensure(!!zip.file(required)&&!!zip.file('[Content_Types].xml'),'Office document contents do not match the selected format.');
 }else if(['txt','csv','html','htm'].includes(ext||''))ensure(!head.includes(0),'Binary data is not accepted as text.');
 else fail('Unsupported input format.');
}
export async function processFile(slug:string,files:File[],options:Opt):Promise<ProcessedFile[]>{
 ensure(files.length>0,'Choose at least one file.');
 ensure(files.every(f=>f.size>0&&f.size<=15*1024*1024),'Each file must be between 1 byte and 15 MB.');
 ensure(files.reduce((n,f)=>n+f.size,0)<=45*1024*1024,'Files exceed the 45 MB combined limit.');
 ensure(files.length<=12,'Select 12 files or fewer.');
 for(const file of files)await validateInput(file);
 const first=files[0],name=stem(first.name);
 // PDF pages are handled using pdf-lib for page-level operations.
 if(['merge-pdf','split-pdf','compress-pdf','rotate-pdf','extract-pdf-pages','delete-pdf-pages','add-page-numbers','watermark-pdf','crop-pdf','repair-pdf','flatten-pdf','pdf-metadata','add-blank-pages','fill-pdf-form'].includes(slug)){
  const {PDFDocument,degrees,rgb,StandardFonts}=await pdfLib();
  if(slug==='merge-pdf'){ensure(files.length>=2,'Choose at least two PDFs.');const out=await PDFDocument.create();for(const f of files){const src=await loadPdf(f);const pages=await out.copyPages(src,src.getPageIndices());pages.forEach(p=>out.addPage(p))}return [await pdfOut(out,'merged.pdf')]}
  const doc=await loadPdf(first);const total=doc.getPageCount();ensure(total>0,'PDF has no pages.');
  if(slug==='split-pdf'){ensure(total<=100,'Split PDFs with at most 100 pages in one operation.');const out:ProcessedFile[]=[];for(let i=0;i<total;i++){const p=await PDFDocument.create();p.addPage((await p.copyPages(doc,[i]))[0]);out.push(await pdfOut(p,`${name}-page-${i+1}.pdf`))}return [await fileZip(out,`${name}-split.zip`)]}
  if(slug==='compress-pdf'){
   // Try structural optimization first, then raster JPEG reduction when it is actually smaller.
   const structural=await pdfOut(doc,`${name}-optimized.pdf`);
   if(structural.blob.size<first.size*.96)return [structural];
   const source=await pdfJs(first);try{ensure(source.numPages<=LIMIT_PDF_PAGES,'Compress PDF supports up to 30 pages per operation. Split large files first.');
   const mode=options.quality||'ebook';const factor=mode==='screen'?.75:mode==='printer'?1.4:1.0;
   const quality=mode==='screen'?.5:mode==='printer'?.85:.68;
   const optimized=await PDFDocument.create();
   for(let i=1;i<=source.numPages;i++){
     const original=await source.getPage(i),size=original.getViewport({scale:1});
     const canvas=await render(source,i,factor);
     const jpg=new Uint8Array(await (await canvasBlob(canvas,'image/jpeg',quality)).arrayBuffer());
     const embedded=await optimized.embedJpg(jpg),page=optimized.addPage([size.width,size.height]);
     page.drawImage(embedded,{x:0,y:0,width:size.width,height:size.height});
   }
   const reduced=await pdfOut(optimized,`${name}-compressed.pdf`);
   if(reduced.blob.size>=first.size)return fail('This file is already compact. No meaningful size reduction was possible without increasing its size.');
   return [reduced];}finally{await source.destroy()}
  }
  if(slug==='rotate-pdf'){const angle=int(options.angle,90);ensure([90,180,270].includes(angle),'Choose a valid rotation angle.');doc.getPages().forEach(p=>p.setRotation(degrees((p.getRotation().angle+angle)%360)))}
  if(slug==='extract-pdf-pages'||slug==='delete-pdf-pages'){const selection=parsePages(options.pages,total);const keep=slug==='extract-pdf-pages'?selection:doc.getPageIndices().filter(i=>!selection.includes(i));ensure(keep.length>0,'Cannot output a PDF without any pages.');const output=await PDFDocument.create();(await output.copyPages(doc,keep)).forEach(p=>output.addPage(p));return [await pdfOut(output,`${name}-${slug==='extract-pdf-pages'?'extracted':'filtered'}.pdf`)]}
  if(slug==='add-page-numbers'){const font=await doc.embedFont(StandardFonts.Helvetica);doc.getPages().forEach((p,i)=>p.drawText(`${i+1} / ${total}`,{x:Math.max(25,p.getWidth()/2-15),y:22,size:10,font,color:rgb(.1,.15,.25)}))}
  if(slug==='watermark-pdf'){const font=await doc.embedFont(StandardFonts.HelveticaBold);const text=(options.text||'DRAFT').replace(/[^\x20-\x7e]/g,'').slice(0,64);ensure(text.length>0,'Enter a watermark.');doc.getPages().forEach(p=>p.drawText(text,{x:p.getWidth()*.12,y:p.getHeight()*.5,size:Math.min(42,p.getWidth()/12),font,rotate:degrees(30),opacity:.22,color:rgb(.8,.14,.2)}))}
  if(slug==='crop-pdf'){const m=int(options.margin,18);ensure(m>=0&&m<=150,'Margin must be between 0 and 150 points.');doc.getPages().forEach(p=>{const {width,height}=p.getSize();ensure(width>2*m+10&&height>2*m+10,'Crop margin is too large.');p.setCropBox(m,m,width-2*m,height-2*m)})}
  if(slug==='flatten-pdf'){try{doc.getForm().flatten()}catch{fail('This PDF form could not be flattened.')} }
  if(slug==='pdf-metadata'){doc.setTitle((options.title||'').slice(0,250));doc.setAuthor((options.author||'').slice(0,250))}
  if(slug==='add-blank-pages'){const last=doc.getPage(total-1);doc.addPage([last.getWidth(),last.getHeight()])}
  if(slug==='fill-pdf-form'){const field=(options.field||'').trim();ensure(field,'Enter an existing form field name.');const form=doc.getForm();try{form.getTextField(field).setText((options.value||'').slice(0,2000));form.updateFieldAppearances()}catch{fail('Text form field not found. Check the exact field name.')}}
  return [await pdfOut(doc,`${name}-${slug}.pdf`)];
 }
 if(['pdf-to-text','pdf-to-word','pdf-to-excel','pdf-to-powerpoint','pdf-to-jpg','pdf-to-png','grayscale-pdf','remove-blank-pages','compare-pdf'].includes(slug)){
  if(slug==='compare-pdf'){ensure(files.length===2,'Choose exactly two PDFs to compare.');return [await comparePdf(files)]}
  if(slug==='pdf-to-text')return [textOut(`${name}.txt`,await allText(first))];
  if(slug==='pdf-to-word'){const text=await allText(first);ensure(text.trim(),'This PDF has no selectable text. Scanned images require OCR.');return [await createDocx(text,`${name}.docx`)]}
  if(slug==='pdf-to-excel'){const text=await allText(first);ensure(text.trim(),'No selectable text was found in the PDF.');const book=await workbook(),sheet=book.addWorksheet('Extracted text');for(const line of text.split('\n').slice(0,30000)){const cells=line.split(/\s{2,}|\t+/);sheet.addRow(cells)}return [await writeWorkbook(book,`${name}-extracted.xlsx`)]}
  const doc=await pdfJs(first);try{ensure(doc.numPages<=LIMIT_PDF_PAGES,'For image-based PDF tools, split the PDF to 30 pages or fewer.');
  if(slug==='pdf-to-jpg'||slug==='pdf-to-png'){const mime=slug==='pdf-to-jpg'?'image/jpeg':'image/png',ext=slug==='pdf-to-jpg'?'jpg':'png';const results:ProcessedFile[]=[];for(let i=1;i<=doc.numPages;i++){const c=await render(doc,i);results.push({name:`${name}-${String(i).padStart(3,'0')}.${ext}`,blob:await canvasBlob(c,mime)})}return results.length===1?results:[await fileZip(results,`${name}-${ext}.zip`)]}
  if(slug==='pdf-to-powerpoint'){const images:Array<{name:string;data:string;width:number;height:number}>=[];for(let i=1;i<=doc.numPages;i++){const c=await render(doc,i,1.1);images.push({name:`Page ${i}`,data:c.toDataURL('image/png'),width:c.width,height:c.height})}return [await createPptx(images)]}
  const {PDFDocument}=await pdfLib();const out=await PDFDocument.create();let retained=0;
  const original=slug==='remove-blank-pages'?await loadPdf(first):null;
  for(let i=1;i<=doc.numPages;i++){
   const c=await render(doc,i,slug==='remove-blank-pages'?.3:.9);
   const ctx=c.getContext('2d',{willReadFrequently:true})!;const pixels=ctx.getImageData(0,0,c.width,c.height);let hasInk=false;
   for(let p=0;p<pixels.data.length;p+=48){if(pixels.data[p]<245||pixels.data[p+1]<245||pixels.data[p+2]<245){hasInk=true;break}}
   if(slug==='remove-blank-pages'){
     if(!hasInk)continue;
     const copied=await out.copyPages(original!,[i-1]);out.addPage(copied[0]);retained++;continue;
   }
   for(let p=0;p<pixels.data.length;p+=4){const gray=Math.round(pixels.data[p]*.299+pixels.data[p+1]*.587+pixels.data[p+2]*.114);pixels.data[p]=pixels.data[p+1]=pixels.data[p+2]=gray}ctx.putImageData(pixels,0,0);
   const image=await out.embedPng(new Uint8Array(await (await canvasBlob(c,'image/png')).arrayBuffer()));const sourcePage=await doc.getPage(i),dimensions=sourcePage.getViewport({scale:1});const page=out.addPage([dimensions.width,dimensions.height]);page.drawImage(image,{x:0,y:0,width:dimensions.width,height:dimensions.height});retained++;
  }ensure(retained>0,'All pages appeared blank; no output was generated.');return [await pdfOut(out,`${name}-${slug}.pdf`)];}finally{await doc.destroy()}
 }
 if(slug==='text-to-pdf')return [await drawTextPdf(await first.text(),`${name}.pdf`)];
 if(['jpg-to-pdf','png-to-pdf','image-to-pdf'].includes(slug))return [await rasterImagesToPdf(files)];
 if(slug==='docx-to-txt')return [textOut(`${name}.txt`,await docxText(first))];
 if(slug==='docx-to-html')return [{name:`${name}.html`,blob:new Blob([`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${escapeHtml(name)}</title></head><body>${await docxHtml(first)}</body></html>`],{type:'text/html'})}];
 if(slug==='txt-to-docx')return [await createDocx(await first.text(),`${name}.docx`)];
 if(slug==='html-to-docx')return [await createDocx(htmlText(await first.text()),`${name}.docx`)];
 if(slug==='merge-docx'){ensure(files.length>=2,'Choose two or more DOCX files.');const texts=await Promise.all(files.map(docxText));return [await createDocx(texts.join('\n\n-------- Document --------\n\n'),'merged-document.docx')]}
 if(slug==='docx-to-pdf')return [await drawTextPdf(await docxText(first),`${name}.pdf`)];
 if(slug==='csv-to-xlsx'){const csv=parseCSV(await first.text());const book=await workbook(),sheet=book.addWorksheet('Imported CSV');csv.forEach(row=>sheet.addRow(row));return [await writeWorkbook(book,`${name}.xlsx`)]}
 if(['xlsx-to-csv','xlsx-to-html','xlsx-to-pdf'].includes(slug)){
  const book=await readWorkbook(first);const sheets:any[]=[];book.eachSheet((sheet:any)=>sheets.push(sheet));ensure(sheets.length>0,'Workbook contains no sheets.');
  if(slug==='xlsx-to-csv'){const outputs:ProcessedFile[]=sheets.map(s=>{const rows:string[]=[];s.eachRow({includeEmpty:true},(r:any)=>{const vals:string[]=[];for(let i=1;i<=s.columnCount;i++)vals.push(csvCell(excelValue(r.getCell(i))));rows.push(vals.join(','))});return textOut(`${name}-${stem(s.name)}.csv`,rows.join('\r\n'))});return outputs.length===1?outputs:[await fileZip(outputs,`${name}-sheets.zip`)]}
  if(slug==='xlsx-to-html'){const html=sheets.map(s=>{const rows:string[]=[];s.eachRow({includeEmpty:true},(r:any)=>{const vals:string[]=[];for(let i=1;i<=Math.min(s.columnCount,100);i++)vals.push(`<td>${escapeHtml(excelValue(r.getCell(i)))}</td>`);rows.push('<tr>'+vals.join('')+'</tr>')});return `<h2>${escapeHtml(s.name)}</h2><table border="1" cellpadding="6">${rows.join('')}</table>`}).join('\n');return [{name:`${name}.html`,blob:new Blob([`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(name)}</title></head><body>${html}</body></html>`],{type:'text/html'})}]}
  const text=sheets.map(s=>{const rows:string[]=[`SHEET: ${s.name}`];s.eachRow({includeEmpty:false},(r:any)=>{const vals:string[]=[];for(let i=1;i<=Math.min(s.columnCount,20);i++)vals.push(excelValue(r.getCell(i)));rows.push(vals.join('   |   '))});return rows.join('\n')}).join('\n\n');return [await drawTextPdf(text,`${name}.pdf`)];
 }
 if(slug==='pptx-to-txt')return [textOut(`${name}.txt`,await pptxText(first))];
 if(slug==='images-to-pptx'){const images=[];for(const f of files){const c=await fileCanvas(f);images.push({name:f.name,data:c.toDataURL('image/png'),width:c.width,height:c.height})}return [await createPptx(images)]}
 if(['jpg-to-png','png-to-jpg','webp-to-jpg','jpg-to-webp','png-to-webp','resize-image','rotate-image','compress-image','strip-image-metadata'].includes(slug)){
  const c=await fileCanvas(first);let target=c;
  if(slug==='resize-image'){const width=int(options.width,1200);ensure(width>=16&&width<=8000,'Width must be 16–8000 pixels.');const factor=Math.min(1,width/c.width);target=document.createElement('canvas');target.width=Math.round(c.width*factor);target.height=Math.round(c.height*factor);target.getContext('2d')!.drawImage(c,0,0,target.width,target.height)}
  if(slug==='rotate-image'){const deg=int(options.angle,90);ensure([90,180,270].includes(deg),'Choose a valid rotation.');target=document.createElement('canvas');target.width=deg===180?c.width:c.height;target.height=deg===180?c.height:c.width;const ctx=target.getContext('2d')!;ctx.translate(target.width/2,target.height/2);ctx.rotate(deg*Math.PI/180);ctx.drawImage(c,-c.width/2,-c.height/2)}
  const type=slug.endsWith('-to-png')?'image/png':slug.endsWith('-to-webp')?'image/webp':slug==='compress-image'?'image/jpeg':slug==='strip-image-metadata'&&/\.png$/i.test(first.name)?'image/png':slug==='strip-image-metadata'&&/\.webp$/i.test(first.name)?'image/webp':slug==='resize-image'&&/\.png$/i.test(first.name)?'image/png':slug==='rotate-image'&&/\.png$/i.test(first.name)?'image/png':'image/jpeg';
  const q=slug==='compress-image'?Math.min(.95,Math.max(.05,int(options.quality,75)/100)):.87;
  if(type==='image/jpeg'){const ctx=target.getContext('2d')!;ctx.globalCompositeOperation='destination-over';ctx.fillStyle='#fff';ctx.fillRect(0,0,target.width,target.height)}
  const ext=type.split('/')[1].replace('jpeg','jpg');return [{name:`${name}-${slug}.${ext}`,blob:await canvasBlob(target,type,q)}];
 }
 return fail('This operation is not available in this edition.');
}
