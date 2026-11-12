import {NextRequest,NextResponse} from 'next/server';
import {randomUUID} from 'node:crypto';
import {database} from '@/lib/db';
import {passwordHash,startSession,COOKIE,cookieOpts,validOrigin} from '@/lib/auth';
import {failJson,unexpected} from '@/lib/http';
import {throttle} from '@/lib/rate';
export const runtime='nodejs';
export async function POST(req:NextRequest){
 if(!validOrigin(req))return failJson('Invalid request origin.',403);
 const ip=req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown';if(throttle('register:'+ip,5,3600000))return failJson('Too many attempts. Try again later.',429);
 try{const body=await req.json();const email=String(body.email||'').trim().toLowerCase();const name=String(body.name||'').trim();const password=String(body.password||'');
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>190||name.length<2||name.length>120||password.length<10||password.length>128)return failJson('Provide a valid name, email and password of 10–128 characters.');
 const pass=await passwordHash(password),id=randomUUID();
 try{await database().execute('INSERT INTO users (id,name,email,password_hash,password_salt,role) VALUES (?,?,?,?,?,?)',[id,name,email,pass.hash,pass.salt,'user'])}catch(e:any){if(e?.code==='ER_DUP_ENTRY')return failJson('This email is already registered.',409);throw e}
 const token=await startSession(id);const res=NextResponse.json({user:{id,name,email,role:'user'}},{status:201});res.cookies.set(COOKIE,token,cookieOpts);return res;
 }catch(e){return unexpected(e)}
}
