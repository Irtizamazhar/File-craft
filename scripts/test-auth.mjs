import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import nextEnv from '@next/env';
import mysql from 'mysql2/promise';
nextEnv.loadEnvConfig(process.cwd());
const base=process.env.TEST_BASE_URL||'http://localhost:3100';
const email='filecraft-test-'+randomUUID()+'@example.invalid';const password='Test-'+randomUUID();let userId;
const conn=await mysql.createConnection({uri:process.env.DATABASE_URL,connectTimeout:10000});
const origin=new URL(process.env.NEXT_PUBLIC_SITE_URL||base).origin;
async function call(path,method='GET',body,cookie,extra={}){const res=await fetch(base+'/api'+path,{method,headers:{origin,'Content-Type':'application/json',...(cookie?{cookie}:{}),...extra},...(body?{body:JSON.stringify(body)}:{})});const text=await res.text();let json;try{json=JSON.parse(text)}catch{throw Error(path+' returned HTTP '+res.status+' instead of JSON')}return {res,json,cookie:res.headers.get('set-cookie')?.split(';')[0]}}
try{
 assert.equal((await call('/health')).res.status,200);
 assert.equal((await call('/auth/register','POST',{name:'Test User',email,password,confirmPassword:password,consent:'on'},undefined,{origin:'https://attacker.invalid'})).res.status,403);
 const signup=await call('/auth/register','POST',{name:'Test User',email,password,confirmPassword:password,consent:'on'});
 assert.equal(signup.res.status,201,JSON.stringify(signup.json));userId=signup.json.user.id;assert.ok(signup.cookie);
 assert.match(signup.res.headers.get('set-cookie'),/HttpOnly/i);
 assert.equal((await call('/auth/me','GET',undefined,signup.cookie)).json.user.id,userId);
 assert.equal((await call('/auth/register','POST',{name:'Test User',email,password,confirmPassword:password,consent:'on'})).res.status,409);
 const [[stored]]=await conn.execute('SELECT password_hash FROM users WHERE id=?',[userId]);assert.notEqual(stored.password_hash,password);assert.equal(stored.password_hash.length,128);
 const [[plan]]=await conn.execute('SELECT plan_id FROM subscriptions WHERE user_id=?',[userId]);assert.equal(plan.plan_id,'free');
 assert.equal((await call('/plans','GET',undefined,signup.cookie)).json.currentPlan,'free');
 assert.equal((await call('/admin/stats','GET',undefined,signup.cookie)).res.status,403);
 assert.equal((await call('/auth/login','POST',{email,password:'incorrect'})).res.status,401);
 assert.equal((await call('/account','PATCH',{name:'Updated Test'},signup.cookie)).json.user.name,'Updated Test');
 assert.equal((await call('/activity','POST',{tool:'merge-pdf',status:'completed'},signup.cookie)).res.status,200);
 assert.equal((await call('/activity','GET',undefined,signup.cookie)).json.jobs.length,1);
 const nextPassword='Next-'+randomUUID();
 assert.equal((await call('/account','PATCH',{currentPassword:password,newPassword:nextPassword},signup.cookie)).res.status,200);
 assert.equal((await call('/auth/me','GET',undefined,signup.cookie)).json.user,null);
 assert.equal((await call('/auth/login','POST',{email,password})).res.status,401);
 const login=await call('/auth/login','POST',{email,password:nextPassword});assert.equal(login.res.status,200);
 await conn.execute('UPDATE sessions SET expires_at=DATE_SUB(UTC_TIMESTAMP(),INTERVAL 1 SECOND) WHERE user_id=?',[userId]);
 assert.equal((await call('/auth/me','GET',undefined,login.cookie)).json.user,null);
 const fresh=await call('/auth/login','POST',{email,password:nextPassword});assert.equal(fresh.res.status,200);
 assert.equal((await call('/auth/logout','POST',undefined,fresh.cookie)).res.status,200);
 assert.equal((await call('/auth/me','GET',undefined,fresh.cookie)).json.user,null);
 assert.equal((await call('/auth/me','GET',undefined,login.cookie)).json.user,null);
 console.log('PASS: health, signup, hashed password, Free plan persistence, session, CSRF, admin denial, invalid login, profile, activity, password change/session revocation, login and logout.');
}finally{
 if(userId)console.log('Verification account retained under the no-deletion policy.');
 await conn.end();console.log('Database connection closed. No records deleted.');
}
