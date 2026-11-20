import {mkdir,copyFile,access,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
await mkdir('public/engines',{recursive:true});await mkdir('public/licenses',{recursive:true});
for(const name of ['ort-wasm-simd-threaded.wasm','ort-wasm-simd-threaded.mjs'])await copyFile('node_modules/onnxruntime-web/dist/'+name,'public/engines/'+name);
await copyFile('node_modules/@embedpdf/pdfium/dist/pdfium.wasm','public/engines/pdfium.wasm');
await copyFile('node_modules/@embedpdf/pdfium/LICENSE','public/licenses/EmbedPDF-MIT.txt');
await copyFile('node_modules/@embedpdf/pdfium/LICENSE.pdfium','public/licenses/PDFium-LICENSE.txt');
const bytes=await readFile('public/models/modnet-portrait.onnx');if(createHash('sha256').update(bytes).digest('hex')!=='92e49898c3e05a6d7a944fc67a8cb87c4aad754ffb6ebd949528c7d1105fee3a')throw Error('The portrait model checksum is invalid. Run the reviewed setup-advanced-assets script.');
await access('public/licenses/MODNet-APACHE-2.0.txt');await access('public/licenses/ONNX-Runtime-MIT.txt');
console.log('Local PDFium and ONNX runtime assets ready; model checksum verified.');

const objectBytes=await readFile('public/models/birefnet-lite-512.onnx').catch(()=>{throw Error('General-object model is missing. Run node scripts/setup-object-model.mjs before building.');});if(createHash('sha256').update(objectBytes).digest('hex')!=='1cb0fb360dadd15af77c639085d77a9df67db0c64315560c3de005f676345ac2')throw Error('General-object model checksum invalid. Run the reviewed setup-object-model script.');await access('public/licenses/BiRefNet-Lite-MIT.txt');console.log('General-object model checksum and license verified.');
