import {createHash,randomBytes,scrypt as scryptCallback,timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';
import type {NextRequest} from 'next/server';
import type {RowDataPacket} from 'mysql2';
import type {PoolConnection} from 'mysql2/promise';
import {database} from './db';
const scrypt=promisify(scryptCallback);
export const COOKIE='fc_session';
export type AuthUser={id:string;name:string;email:string;role:'user'|'admin'};
const hash=(value:string)=>createHash('sha256').update(value).digest('hex');
export async function passwordHash(password:string){const salt=randomBytes(16).toString('hex');const derived=(await scrypt(password,salt,64)) as Buffer;return {hash:derived.toString('hex'),salt}}
export async function passwordVerify(password:string,salt:string,expected:string){const a=(await scrypt(password,salt,64)) as Buffer;const b=Buffer.from(expected,'hex');return a.length===b.length&&timingSafeEqual(a,b)}
export async function startSession(userId:string,connection?:PoolConnection){const token=randomBytes(32).toString('hex');await (connection||database()).execute('INSERT INTO sessions (token_hash,user_id,expires_at) VALUES (?,?,DATE_ADD(UTC_TIMESTAMP(), INTERVAL 14 DAY))',[hash(token),userId]);return token}
export const cookieOpts={httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax' as const,path:'/',maxAge:60*60*24*14};
export async function currentUser(req:{cookies:{get(name:string):{value:string}|undefined}}):Promise<AuthUser|null>{const token=req.cookies.get(COOKIE)?.value;if(!token||!/^[a-f0-9]{64}$/.test(token))return null;const [rows]=await database().execute<RowDataPacket[]>('SELECT u.id,u.name,u.email,u.role FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>UTC_TIMESTAMP() AND u.active=1 LIMIT 1',[hash(token)]);return rows.length?rows[0] as AuthUser:null}
export async function endSession(token:string){if(/^[a-f0-9]{64}$/.test(token))await database().execute('DELETE FROM sessions WHERE token_hash=?',[hash(token)])}
export function validOrigin(req:NextRequest){
 const origin=req.headers.get('origin');
 if(!origin)return req.headers.get('sec-fetch-site')!=='cross-site';
 try{const expected=process.env.NEXT_PUBLIC_SITE_URL;return new URL(origin).origin===(expected?new URL(expected).origin:req.nextUrl.origin)}catch{return false}
}
