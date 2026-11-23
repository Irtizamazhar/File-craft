/// <reference lib="webworker" />
import type * as Ort from 'onnxruntime-web/wasm';
import {OBJECT_MODEL,normalizedPixels,probabilities,type SegmentationKind} from '../lib/advanced/segmentation';
import {finishMatte,resizeMatte,type Box} from '../lib/advanced/matte';

type OrtModule=typeof Ort;
type Backend='webgpu'|'wasm';
type GpuAdapter={isFallbackAdapter?:boolean;info?:{isFallbackAdapter?:boolean;vendor?:string;architecture?:string}};
type GpuNavigator={gpu?:{requestAdapter():Promise<GpuAdapter|null>}};

let session:Ort.InferenceSession|undefined,sessionKind:SegmentationKind|undefined,sessionBackend:Backend|undefined;
let runtime:Promise<{ort:OrtModule;webgpu:boolean}>|undefined;

// WebGPU is much faster when the browser exposes an adapter; otherwise load the
// smaller WASM-only runtime so devices without WebGPU do not download the larger build.
async function loadRuntime(origin:string){
  let webgpu=false;
  try{
    const adapter=await (navigator as GpuNavigator).gpu?.requestAdapter();
    const info=adapter?.info;
    // Software (fallback) adapters such as SwiftShader are slower than the WASM backend.
    const software=!!(info?.isFallbackAdapter??adapter?.isFallbackAdapter);
    // Measured on Intel UHD (gen-9): WebGPU ran this model ~1.4x slower than WASM, so
    // older Intel integrated GPUs (gen-7/8/9) use the CPU path. Xe, Arc and others keep WebGPU.
    const slowIntegrated=info?.vendor==='intel'&&/^gen-\d$/.test(info.architecture??'');
    webgpu=!!adapter&&!software&&!slowIntegrated;
  }catch{webgpu=false}
  let ort:OrtModule;
  if(webgpu){
    try{ort=await import('onnxruntime-web/webgpu') as unknown as OrtModule}
    catch{webgpu=false;ort=await import('onnxruntime-web/wasm')}
  }else ort=await import('onnxruntime-web/wasm');
  // No cross-origin isolation on this site, so SharedArrayBuffer threads are unavailable.
  ort.env.wasm.numThreads=1;
  ort.env.wasm.wasmPaths=origin+'/engines/';
  return {ort,webgpu};
}

async function modelBytes(origin:string,kind:SegmentationKind,id:number){
  const path=kind==='object'?OBJECT_MODEL.path:'/models/modnet-portrait.onnx';
  const url=origin+path+'?v='+(kind==='object'?OBJECT_MODEL.sha256.slice(0,12):'portrait-v1');
  let cache:Cache|undefined;
  try{
    cache=await caches.open('filecraft-segmentation-v1');
    const stored=await cache.match(url);
    if(stored){self.postMessage({id,stage:'Loading cached model...',progress:100});return new Uint8Array(await stored.arrayBuffer())}
  }catch{/* Storage disabled/quota: inference can still run. */}
  const response=await fetch(url);
  if(!response.ok)throw Error('The AI model file is unavailable (HTTP '+response.status+' for '+path+'). Run "npm run setup:object-model" on the server.');
  const total=Number(response.headers.get('Content-Length'))||(kind==='object'?OBJECT_MODEL.bytes:6632188);
  const reader=response.body?.getReader();
  if(!reader)throw Error('Streaming model loading is unsupported in this browser.');
  const chunks:Uint8Array[]=[];let loaded=0,lastProgress=-1;
  while(true){
    const {done,value}=await reader.read();
    if(done)break;
    chunks.push(value);loaded+=value.length;
    const progress=Math.min(99,Math.round(loaded/total*100));
    if(progress!==lastProgress){lastProgress=progress;self.postMessage({id,stage:'Loading local model...',progress})}
  }
  const bytes=new Uint8Array(loaded);let offset=0;
  for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length}
  if(kind==='object'){
    if(bytes.length!==OBJECT_MODEL.bytes)throw Error('Incomplete object model download.');
    const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(v=>v.toString(16).padStart(2,'0')).join('');
    if(hash!==OBJECT_MODEL.sha256)throw Error('Object model checksum mismatch.');
  }
  try{await cache?.put(url,new Response(bytes,{headers:{'Content-Type':'application/octet-stream'}}))}catch{/* Quota exhaustion does not change the mask or send images elsewhere. */}
  return bytes;
}

async function createSession(ort:OrtModule,bytes:Uint8Array,backend:Backend){
  return ort.InferenceSession.create(bytes,{executionProviders:[backend],graphOptimizationLevel:'all'});
}

async function releaseSession(){await session?.release().catch(()=>{});session=undefined;sessionKind=undefined;sessionBackend=undefined}

async function ensureSession(origin:string,kind:SegmentationKind,id:number){
  if(session&&sessionKind===kind)return;
  await releaseSession();
  runtime??=loadRuntime(origin);
  const {ort,webgpu}=await runtime;
  const bytes=await modelBytes(origin,kind,id);
  self.postMessage({id,stage:'Initializing on-device model...',progress:100});
  if(webgpu){
    try{session=await createSession(ort,bytes,'webgpu');sessionBackend='webgpu'}
    catch{session=undefined}
  }
  if(!session){session=await createSession(ort,bytes,'wasm');sessionBackend='wasm'}
  sessionKind=kind;
}

async function infer(pixels:Uint8ClampedArray,kind:SegmentationKind){
  const {ort}=await runtime!;
  const input=new ort.Tensor('float32',normalizedPixels(pixels,kind),[1,3,512,512]);
  let outputs:Record<string,Ort.Tensor>|undefined;
  try{
    outputs=await session!.run({[session!.inputNames[0]]:input});
    const output=outputs[session!.outputNames[0]];
    if(output.type!=='float32')throw Error('Unsupported model output type.');
    return probabilities(await output.getData() as Float32Array,kind);
  }finally{input.dispose();if(outputs)for(const tensor of Object.values(outputs))tensor.dispose()}
}

/** In-browser model on the 512×512 letterboxed input; returns the probability map (512×512). */
async function localMatte(pixels:Uint8ClampedArray,origin:string,kind:SegmentationKind,id:number){
  await ensureSession(origin,kind,id);
  self.postMessage({id,stage:kind==='object'?'Removing background...':'Removing portrait background...'});
  try{return await infer(pixels,kind)}
  catch(error){
    // GPU out-of-memory or driver errors: retry the same image on the CPU (WASM) backend.
    if(sessionBackend!=='webgpu')throw error;
    const {ort}=await runtime!;
    await releaseSession();
    self.postMessage({id,stage:'WebGPU failed, retrying on CPU...'});
    session=await createSession(ort,await modelBytes(origin,kind,id),'wasm');sessionBackend='wasm';sessionKind=kind;
    return infer(pixels,kind);
  }
}

export type WorkerRequest={
  id:number;origin:string;kind:SegmentationKind;width:number;height:number;
  /** Full-resolution source pixels (RGBA): guide for edge refinement and colour decontamination. */
  rgba:Uint8ClampedArray;
  /** 8-bit matte at full resolution from the server engine; when present no local model runs. */
  serverMatte?:Uint8Array;
  /** 512×512 letterboxed model input and where the image sits inside it (in-browser engine). */
  local?:{pixels:Uint8ClampedArray;box:Box};
};

self.onmessage=async(event:MessageEvent<WorkerRequest>)=>{
  const {id,origin,kind,width,height,rgba,serverMatte,local}=event.data;const start=performance.now();
  try{
    let raw:Float32Array,modelSize:number,inferenceMs:number;
    if(serverMatte){
      if(serverMatte.length!==width*height)throw Error('The server returned a mask with the wrong size.');
      raw=new Float32Array(serverMatte.length);for(let i=0;i<raw.length;i++)raw[i]=serverMatte[i]/255;
      modelSize=1024;inferenceMs=0;
    }else if(local){
      const inferenceStart=performance.now();
      const probability=await localMatte(local.pixels,origin,kind,id);
      inferenceMs=Math.round(performance.now()-inferenceStart);
      // Crop the letterbox padding and scale back to the original resolution (no aspect squashing).
      raw=resizeMatte(probability,512,512,local.box,width,height);modelSize=512;
    }else throw Error('No segmentation input was provided.');
    self.postMessage({id,stage:'Refining edges...'});
    const {alpha,foreground,removed}=finishMatte(rgba,raw,width,height,modelSize);
    self.postMessage({id,mask:alpha,foreground,removed,backend:serverMatte?'server':sessionBackend,elapsedMs:Math.round(performance.now()-start),inferenceMs},[alpha.buffer,foreground.buffer]);
  }catch(error){
    if(!serverMatte)await releaseSession();
    const message=error instanceof Error?error.message:'Segmentation failed.';
    self.postMessage({id,error:/HTTP \d+/.test(message)?message:message+' Try a smaller image or manual refinement if your device has insufficient memory.'});
  }
};
