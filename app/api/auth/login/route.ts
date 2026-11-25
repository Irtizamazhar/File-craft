import {NextRequest,NextResponse} from 'next/server';
import type {RowDataPacket} from 'mysql2';
import {database} from '@/lib/db';
import {passwordVerify,startSession,COOKIE,cookieOpts,validOrigin} from '@/lib/auth';
import {failJson,handleError,readJson} from '@/lib/http';
import {throttle} from '@/lib/rate';
export const runtime='nodejs';
export async function POST(req:NextRequest){
 if(!validOrigin(req))return failJson('Invalid request origin.',403);
 const ip=req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown';if(throttle('login:'+ip,12,15*60000))return failJson('Too many sign-in attempts. Try again later.',429);
 try{const body=await readJson(req),email=String(body.email||'').trim().toLowerCase(),password=String(body.password||'');
 if(email.length>190||password.length>128)return failJson('Invalid email or password.',401);
 // Per-account limit as well as per-IP: forwarded IPs can be rotated, the target email cannot.
 if(throttle('login-email:'+email,10,15*60000))return failJson('Too many sign-in attempts. Try again later.',429);
 const [rows]=await database().execute<RowDataPacket[]>('SELECT id,name,email,role,active,password_hash,password_salt FROM users WHERE email=? LIMIT 1',[email]);const user=rows[0];
 if(!user||!user.active||!(await passwordVerify(password,user.password_salt,user.password_hash)))return failJson('Invalid email or password.',401);
 const token=await startSession(user.id);const res=NextResponse.json({user:{id:user.id,name:user.name,email:user.email,role:user.role}});res.cookies.set(COOKIE,token,cookieOpts);return res;
 }catch(e){return handleError(e)}
}
