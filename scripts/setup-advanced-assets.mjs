import {mkdir,writeFile,readFile,copyFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const modelURL='https://huggingface.co/Xenova/modnet/resolve/7e0f55f28727b43369531f75e0539ecc4912af82/onnx/model_quantized.onnx';
await mkdir('public/models',{recursive:true});await mkdir('public/licenses',{recursive:true});await mkdir('tests/fixtures',{recursive:true});
async function get(url,path,hash){try{const old=await readFile(path);if(!hash||createHash('sha256').update(old).digest('hex')===hash){console.log(path+' already present');return}}catch{}const response=await fetch(url,{signal:AbortSignal.timeout(120000)});if(!response.ok)throw Error('Download HTTP '+response.status+' for '+path);const bytes=Buffer.from(await response.arrayBuffer());if(hash&&createHash('sha256').update(bytes).digest('hex')!==hash)throw Error('Checksum mismatch: '+path);await writeFile(path,bytes);console.log(path+': '+bytes.length+' bytes')}
await get(modelURL,'public/models/modnet-portrait.onnx','92e49898c3e05a6d7a944fc67a8cb87c4aad754ffb6ebd949528c7d1105fee3a');
await get('https://raw.githubusercontent.com/ZHKKKe/MODNet/master/LICENSE','public/licenses/MODNet-APACHE-2.0.txt');
await get('https://raw.githubusercontent.com/scikit-image/scikit-image/v0.22.0/skimage/data/astronaut.png','tests/fixtures/astronaut.png');
await mkdir('public/engines',{recursive:true});
await copyFile('node_modules/@embedpdf/pdfium/dist/pdfium.wasm','public/engines/pdfium.wasm');
for(const name of ['ort-wasm-simd-threaded.wasm','ort-wasm-simd-threaded.mjs'])await copyFile('node_modules/onnxruntime-web/dist/'+name,'public/engines/'+name);
for(const [source,target]of [['node_modules/@embedpdf/pdfium/LICENSE.pdfium','public/licenses/PDFium-LICENSE.txt'],['node_modules/@embedpdf/pdfium/LICENSE','public/licenses/EmbedPDF-MIT.txt']]){try{await copyFile(source,target)}catch{console.log('Review upstream license path: '+source)}}

await get('https://raw.githubusercontent.com/microsoft/onnxruntime/main/LICENSE','public/licenses/ONNX-Runtime-MIT.txt');
