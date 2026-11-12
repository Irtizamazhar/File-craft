import {existsSync,copyFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
const file=resolve('node_modules/pdfjs-dist/build/pdf.worker.min.mjs');
if(!existsSync(file)){console.warn('PDF.js worker not present yet. It will be required for PDF tools.');process.exit(0)}
mkdirSync('public',{recursive:true});copyFileSync(file,resolve('public/pdf.worker.min.mjs'));
console.log('Local PDF.js worker copied to public assets.');
