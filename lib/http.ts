import {NextResponse} from 'next/server';
export function failJson(message:string,status=400){return NextResponse.json({error:message},{status})}
export function unexpected(error:unknown){console.error('Editgoo request failed:',error instanceof Error?error.message:'Unknown error');return failJson('Service temporarily unavailable. Please try again later.',503)}

export class BodyError extends Error{constructor(message:string,public status:number){super(message)}}
/** Reads a JSON object body, refusing oversized or malformed payloads before they are buffered in full. */
export async function readJson(req:Request,maxBytes=16*1024):Promise<Record<string,unknown>>{
  if(Number(req.headers.get('content-length')||0)>maxBytes)throw new BodyError('Request is too large.',413);
  const reader=req.body?.getReader();if(!reader)throw new BodyError('Request body is missing.',400);
  const chunks:Uint8Array[]=[];let size=0;
  for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>maxBytes){await reader.cancel();throw new BodyError('Request is too large.',413)}chunks.push(value)}
  let data:unknown;
  try{data=JSON.parse(new TextDecoder().decode(Buffer.concat(chunks)))}catch{throw new BodyError('Request body must be valid JSON.',400)}
  if(!data||typeof data!=='object'||Array.isArray(data))throw new BodyError('Request body must be a JSON object.',400);
  return data as Record<string,unknown>;
}
/** Maps body errors to their status; anything else is an unexpected server error. */
export function handleError(error:unknown){return error instanceof BodyError?failJson(error.message,error.status):unexpected(error)}
