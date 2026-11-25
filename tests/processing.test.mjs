import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,unlinkSync} from 'node:fs';
import ts from 'typescript';
import {PDFDocument} from 'pdf-lib';
import JSZip from 'jszip';
const target=new URL('../lib/.engine-test.mjs',import.meta.url);
const unicodeTarget=new URL('../lib/.unicode-test.mjs',import.meta.url);
const transpile=file=>ts.transpileModule(readFileSync(new URL(file,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
writeFileSync(unicodeTarget,transpile('../lib/unicode-text-pdf.ts'));
writeFileSync(target,transpile('../lib/browser-engine.ts').replace("import('./unicode-text-pdf')","import('./.unicode-test.mjs')"));
// The Unicode exporter fetches its font from the site (/fonts/...); serve the bundled file in tests.
const siteFetch=globalThis.fetch;
globalThis.fetch=async(url,init)=>String(url).startsWith('/fonts/')?new Response(readFileSync(new URL('../public'+String(url),import.meta.url))):siteFetch(url,init);
const {processFile,validateInput}=await import(target.href);
after(()=>{unlinkSync(target);unlinkSync(unicodeTarget);globalThis.fetch=siteFetch});
async function sample(){const pdf=await PDFDocument.create();pdf.addPage([300,400]);pdf.addPage([400,500]);return new File([await pdf.save()],'sample.pdf')}
const output=async(slug,options={})=>(await processFile(slug,[await sample()],options))[0];
test('real merge preserves four pages',async()=>{const file=await sample();const [out]=await processFile('merge-pdf',[file,file],{});assert.equal((await PDFDocument.load(await out.blob.arrayBuffer())).getPageCount(),4)});
test('real split archive contains readable single-page PDFs',async()=>{const out=await output('split-pdf');const zip=await JSZip.loadAsync(await out.blob.arrayBuffer());assert.equal(Object.keys(zip.files).length,2);for(const f of Object.values(zip.files))assert.equal((await PDFDocument.load(await f.async('uint8array'))).getPageCount(),1)});
for(const [slug,options,check] of [
 ['rotate-pdf',{angle:'90'},doc=>assert.equal(doc.getPage(0).getRotation().angle,90)],
 ['extract-pdf-pages',{pages:'2'},doc=>assert.equal(doc.getPageCount(),1)],
 ['delete-pdf-pages',{pages:'1'},doc=>assert.equal(doc.getPage(0).getWidth(),400)],
 ['crop-pdf',{margin:'18'},doc=>assert.equal(doc.getPage(0).getCropBox().width,264)],
 ['pdf-metadata',{title:'Verified title',author:'Test'},doc=>assert.equal(doc.getTitle(),'Verified title')],
 ['add-blank-pages',{},doc=>assert.equal(doc.getPageCount(),3)],
 ['add-page-numbers',{},doc=>assert.equal(doc.getPageCount(),2)],
 ['watermark-pdf',{text:'DRAFT'},doc=>assert.equal(doc.getPageCount(),2)]
])test('real PDF output: '+slug,async()=>{const out=await output(slug,options);assert.ok(out.blob.size);check(await PDFDocument.load(await out.blob.arrayBuffer()))});
test('text to PDF produces parseable output',async()=>{const [out]=await processFile('text-to-pdf',[new File(['Hello FileCraft'],'sample.txt')],{});assert.equal((await PDFDocument.load(await out.blob.arrayBuffer())).getPageCount(),1)});
test('forged formats and binary text are rejected',async()=>{for(const name of ['fake.pdf','fake.png','fake.jpg','fake.webp','fake.docx','fake.xlsx','fake.pptx'])await assert.rejects(validateInput(new File(['not a valid file'],name)));await assert.rejects(validateInput(new File([new Uint8Array([0,1,2])],'fake.txt')))});
test('page ranges fail usefully; Urdu text exports and unsupported scripts are named',async()=>{await assert.rejects(output('extract-pdf-pages',{pages:'999'}),/outside/);const [urdu]=await processFile('text-to-pdf',[new File(['\u0627\u0631\u062f\u0648 \u0645\u062a\u0646\nEnglish 25'],'sample.txt')],{});assert.equal(urdu.name,'sample.pdf');assert.equal((await PDFDocument.load(await urdu.blob.arrayBuffer())).getPageCount(),1);await assert.rejects(processFile('text-to-pdf',[new File(['\u0928\u092e\u0938\u094d\u0924\u0947'],'sample.txt')],{}),/not these characters yet/)});
