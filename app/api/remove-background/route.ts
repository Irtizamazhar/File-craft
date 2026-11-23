import {NextRequest,NextResponse} from 'next/server';
import {validOrigin} from '@/lib/auth';
import {failJson} from '@/lib/http';
import {throttle} from '@/lib/rate';

// Proxy to the Python background-removal service (services/background-removal, BiRefNet 1024).
// Images are streamed through memory only: nothing is written to disk, logged or cached.
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=300;

const MAX_BYTES=15*1024*1024;
const SIGNATURES:Record<string,(b:Uint8Array)=>boolean>={
  'image/jpeg':b=>b[0]===0xff&&b[1]===0xd8&&b[2]===0xff,
  'image/png':b=>b[0]===0x89&&b[1]===0x50&&b[2]===0x4e&&b[3]===0x47,
  'image/webp':b=>String.fromCharCode(...b.subarray(0,4))==='RIFF'&&String.fromCharCode(...b.subarray(8,12))==='WEBP',
};
const noStore={'Cache-Control':'no-store'};

function serviceUrl(){return (process.env.BG_REMOVAL_SERVICE_URL||'').trim().replace(/\/+$/,'')}
function serviceHeaders():Record<string,string>{const token=process.env.BG_REMOVAL_SERVICE_TOKEN;return token?{Authorization:'Bearer '+token}:{}}

let health:{at:number;ok:boolean;model?:string;device?:string}|undefined;

/** Tells the browser whether the server engine can be used (otherwise it uses the in-browser model). */
export async function GET(){
  const url=serviceUrl();
  if(!url)return NextResponse.json({available:false,reason:'not-configured'},{headers:noStore});
  if(!health||Date.now()-health.at>15000){
    try{
      const response=await fetch(url+'/health',{headers:serviceHeaders(),cache:'no-store',signal:AbortSignal.timeout(3000)});
      const info=response.ok?await response.json() as {model?:string;device?:string}:{};
      health={at:Date.now(),ok:response.ok,model:info.model,device:info.device};
    }catch{health={at:Date.now(),ok:false}}
  }
  return NextResponse.json(health.ok?{available:true,model:health.model,device:health.device}:{available:false,reason:'unreachable'},{headers:noStore});
}

async function readCapped(req:NextRequest){
  const reader=req.body?.getReader();if(!reader)return new Uint8Array();
  const chunks:Uint8Array[]=[];let size=0;
  for(;;){
    const {done,value}=await reader.read();if(done)break;
    size+=value.length;
    if(size>MAX_BYTES){await reader.cancel();return null}
    chunks.push(value);
  }
  const body=new Uint8Array(size);let offset=0;for(const chunk of chunks){body.set(chunk,offset);offset+=chunk.length}
  return body;
}

export async function POST(req:NextRequest){
  if(!validOrigin(req))return failJson('Invalid origin.',403);
  const url=serviceUrl();
  if(!url)return failJson('Server background removal is not configured.',503);
  const ip=req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown';
  if(throttle('remove-background:'+ip,30,10*60000))return failJson('Too many background removals. Try again in a few minutes.',429);
  const type=(req.headers.get('content-type')||'').split(';')[0].trim().toLowerCase();
  const matches=SIGNATURES[type];
  if(!matches)return failJson('Upload a JPG, PNG or WebP image.',415);
  if(Number(req.headers.get('content-length')||0)>MAX_BYTES)return failJson('The image is larger than 15 MB.',413);
  const body=await readCapped(req);
  if(body===null)return failJson('The image is larger than 15 MB.',413);
  if(body.length<12||!matches(body))return failJson('The file content does not match a JPG, PNG or WebP image.',415);
  try{
    const response=await fetch(url+'/v1/matte',{method:'POST',headers:{'Content-Type':type,...serviceHeaders()},body,cache:'no-store',signal:AbortSignal.timeout(Number(process.env.BG_REMOVAL_TIMEOUT_MS)||180000)});
    if(!response.ok){
      if(response.status===413||response.status===415||response.status===422)return failJson('The server engine cannot process this image.',response.status);
      health=undefined;return failJson('Server background removal failed.',502);
    }
    const png=await response.arrayBuffer();
    return new NextResponse(png,{headers:{...noStore,'Content-Type':'image/png','X-Model':response.headers.get('x-model')||'','X-Device':response.headers.get('x-device')||'','X-Inference-Ms':response.headers.get('x-inference-ms')||''}});
  }catch{
    health=undefined;
    return failJson('Server background removal is unavailable.',502);
  }
}
