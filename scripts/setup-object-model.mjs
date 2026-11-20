import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const revision='962e67969ec6acec9c19fab76acee4f5e22e990c';
const base=`https://huggingface.co/studioludens/birefnet-lite-512/resolve/${revision}/`;
await mkdir('public/models',{recursive:true});await mkdir('public/licenses',{recursive:true});
const model='public/models/birefnet-lite-512.onnx',sha='1cb0fb360dadd15af77c639085d77a9df67db0c64315560c3de005f676345ac2';
async function get(url,path,hash){try{const old=await readFile(path);if(!hash||createHash('sha256').update(old).digest('hex')===hash){console.log(path+' verified');return}}catch{}const res=await fetch(url,{signal:AbortSignal.timeout(hash?900000:30000)});if(!res.ok)throw Error('HTTP '+res.status);const bytes=Buffer.from(await res.arrayBuffer());if(hash&&createHash('sha256').update(bytes).digest('hex')!==hash)throw Error('Checksum mismatch');await writeFile(path,bytes);console.log(path+': '+bytes.length+' bytes')}
await get(base+'LICENSE','public/licenses/BiRefNet-Lite-MIT.txt');
await get(base+'README.md','public/licenses/BiRefNet-Lite-model-card.md');
await get(base+'onnx/model.onnx',model,sha);
