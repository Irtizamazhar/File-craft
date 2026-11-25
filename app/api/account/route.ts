import {NextRequest,NextResponse} from 'next/server';
import type {RowDataPacket} from 'mysql2';
import {database} from '@/lib/db';
import {currentUser,validOrigin,passwordVerify,passwordHash,COOKIE,cookieOpts} from '@/lib/auth';
import {failJson,handleError,readJson} from '@/lib/http';
import {throttle} from '@/lib/rate';
export const dynamic='force-dynamic';
export async function PATCH(req:NextRequest){
 if(!validOrigin(req))return failJson('Invalid request origin.',403);
 try{const user=await currentUser(req);if(!user)return failJson('Sign in required.',401);
 if(throttle('account:'+user.id,10,15*60000))return failJson('Too many attempts. Try again later.',429);
 const body=await readJson(req);
 if(body.newPassword!==undefined){
 const password=String(body.newPassword);const current=String(body.currentPassword||'');
 if(password.length<10||password.length>128||current.length>128)return failJson('Password must contain 10 to 128 characters.');
 const conn=await database().getConnection();
 try{await conn.beginTransaction();const [rows]=await conn.execute<RowDataPacket[]>('SELECT password_hash,password_salt FROM users WHERE id=? FOR UPDATE',[user.id]);
 if(!rows[0]||!await passwordVerify(current,rows[0].password_salt,rows[0].password_hash)){await conn.rollback();return failJson('Current password is incorrect.',400)}
 const pass=await passwordHash(password);await conn.execute('UPDATE users SET password_hash=?,password_salt=? WHERE id=?',[pass.hash,pass.salt,user.id]);
 await conn.execute('DELETE FROM sessions WHERE user_id=?',[user.id]);await conn.commit();
 }catch(e){await conn.rollback();throw e}finally{conn.release()}
 const res=NextResponse.json({ok:true,signInRequired:true});res.cookies.set(COOKIE,'',{...cookieOpts,maxAge:0});return res;
 }
 const name=String(body.name||'').trim();if(name.length<2||name.length>120)return failJson('Name must contain 2 to 120 characters.');
 await database().execute('UPDATE users SET name=? WHERE id=?',[name,user.id]);return NextResponse.json({user:{...user,name}});
 }catch(e){return handleError(e)}
}
