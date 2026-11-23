// Browser side of the server engine: /api/remove-background proxies to the Python BiRefNet service.
import {canvasFrom} from '@/lib/advanced/image-editor';

export type ServerEngineInfo={available:boolean;model?:string;device?:string;reason?:string};
export type ServerMatte={matte:Uint8Array;model:string;device:string;inferenceMs:number};

// Neutral fill for transparent pixels; the same ImageNet-mean colour the models use for padding.
export const PAD_FILL='rgb(124,116,104)';

let cached:{at:number;info:ServerEngineInfo}|undefined;

export async function serverEngine():Promise<ServerEngineInfo>{
  if(cached&&Date.now()-cached.at<60000)return cached.info;
  let info:ServerEngineInfo;
  try{
    const response=await fetch('/api/remove-background',{cache:'no-store',signal:AbortSignal.timeout(6000)});
    info=response.ok?await response.json() as ServerEngineInfo:{available:false,reason:'HTTP '+response.status};
  }catch{info={available:false,reason:'unreachable'}}
  cached={at:Date.now(),info};
  return info;
}

export function forgetServerEngine(){cached=undefined}

/** Uploads the current image (JPEG) and returns the soft 8-bit matte at the image's own resolution. */
export async function serverMatte(source:ImageData,signal:AbortSignal):Promise<ServerMatte>{
  const canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;
  const ctx=canvas.getContext('2d')!;ctx.fillStyle=PAD_FILL;ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(canvasFrom(source),0,0);
  const body=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('Could not prepare the image for upload.')),'image/jpeg',.95));
  const response=await fetch('/api/remove-background',{method:'POST',headers:{'Content-Type':'image/jpeg'},body,signal,cache:'no-store'});
  if(!response.ok){
    let message='HTTP '+response.status;
    try{message=((await response.json()) as {error?:string}).error||message}catch{/* non-JSON error body */}
    throw Error(message);
  }
  const bitmap=await createImageBitmap(await response.blob(),{colorSpaceConversion:'none',premultiplyAlpha:'none'});
  try{
    if(bitmap.width!==source.width||bitmap.height!==source.height)throw Error('The server returned a mask with the wrong size.');
    const read=document.createElement('canvas');read.width=bitmap.width;read.height=bitmap.height;
    const rctx=read.getContext('2d',{willReadFrequently:true})!;rctx.drawImage(bitmap,0,0);
    const pixels=rctx.getImageData(0,0,read.width,read.height).data;
    const matte=new Uint8Array(read.width*read.height);for(let i=0;i<matte.length;i++)matte[i]=pixels[i*4];
    return {matte,model:response.headers.get('x-model')||'BiRefNet',device:response.headers.get('x-device')||'cpu',inferenceMs:Number(response.headers.get('x-inference-ms'))||0};
  }finally{bitmap.close()}
}
