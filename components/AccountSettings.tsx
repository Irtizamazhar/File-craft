'use client';
import {useEffect,useState,type FormEvent} from 'react';
import {request} from '@/lib/api';
import {announceSession} from '@/lib/session-client';
export default function AccountSettings({name}:{name:string}){
 const [plan,setPlan]=useState('Loading...'),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{request<{currentPlan:string}>('/plans').then(data=>setPlan(data.currentPlan)).catch(()=>setPlan('Unavailable'))},[]);
 async function save(e:FormEvent<HTMLFormElement>,password=false){e.preventDefault();const form=e.currentTarget;setBusy(true);setMessage('');try{const data=Object.fromEntries(new FormData(form));await request('/account',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});if(password){location.href='/login';return}setMessage('Profile saved.');announceSession();}catch(error){setMessage((error as Error).message)}finally{setBusy(false)}}
 return <section className="account-settings dash-card" id="account-settings"><h2>Account settings</h2><p>Current plan: <strong>{plan}</strong>. Paid upgrades and billing are unavailable.</p><div className="options-grid"><form method="post" onSubmit={e=>save(e)}><label className="auth-field">Full name<input name="name" defaultValue={name} minLength={2} maxLength={120} required autoComplete="name"/></label><button className="btn btn-outline" disabled={busy}>Save profile</button></form><form method="post" onSubmit={e=>save(e,true)}><label className="auth-field">Current password<input name="currentPassword" type="password" required maxLength={128} autoComplete="current-password"/></label><label className="auth-field">New password<input name="newPassword" type="password" minLength={10} maxLength={128} required autoComplete="new-password"/></label><button className="btn btn-outline" disabled={busy}>Change password</button><p>Changing your password signs out all sessions.</p></form></div>{message&&<p role="status">{message}</p>}</section>
}
