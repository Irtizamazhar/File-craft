'use client';
// Signed-in state for the header and dashboard, read from the existing cookie session (/api/auth/me).
// One request is shared by every component on the page; login, logout and profile changes announce
// SESSION_EVENT so the header updates without a full reload.
import {useEffect,useState} from 'react';

export type SessionUser={id:string;name:string;email:string;role:string;plan:string;planName:string;memberSince:string|null};
export type Session={status:'loading'}|{status:'guest'}|{status:'user';user:SessionUser};
export const SESSION_EVENT='editgoo:session';

let pending:Promise<Session>|null=null;
let last:Session={status:'loading'};

async function load():Promise<Session>{
  const res=await fetch('/api/auth/me',{credentials:'same-origin',cache:'no-store'});
  if(!res.ok)throw Error('session '+res.status);
  const data=await res.json() as {user:{id:string;name:string;email:string;role:string}|null;account?:{plan:string;planName:string;memberSince:string|null}|null};
  if(!data.user)return {status:'guest'};
  const account=data.account??{plan:'free',planName:'Free',memberSince:null};
  return {status:'user',user:{...data.user,...account}};
}
function fetchSession(force=false){
  if(force||!pending)pending=load().then(s=>(last=s),()=>(last={status:'guest'}));
  return pending;
}
/** Tell every mounted useSession() to read the session again (after login, logout or a name change). */
export function announceSession(){pending=null;window.dispatchEvent(new Event(SESSION_EVENT))}

export function useSession():Session{
  const [session,setSession]=useState<Session>(last);
  useEffect(()=>{
    let alive=true;
    const read=(force:boolean)=>fetchSession(force).then(s=>{if(alive)setSession(s)});
    void read(false);
    const refresh=()=>void read(true);
    window.addEventListener(SESSION_EVENT,refresh);
    return ()=>{alive=false;window.removeEventListener(SESSION_EVENT,refresh)};
  },[]);
  return session;
}

export const firstName=(name:string)=>name.trim().split(/\s+/)[0]||name;
export const initialOf=(name:string)=>(name.trim()[0]||'?').toUpperCase();
export const isPaid=(user:SessionUser)=>user.plan!=='free';

export async function signOut(){
  try{await fetch('/api/auth/logout',{method:'POST',credentials:'same-origin'})}finally{location.href='/login'}
}
