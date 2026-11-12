'use client';
import {useState,FormEvent} from 'react';
import {useRouter} from 'next/navigation';
import Link from 'next/link';
import {ArrowRight,LockKeyhole,TriangleAlert} from 'lucide-react';
import {request} from '@/lib/api';
export default function AuthForm({type}:{type:'login'|'register'}){
 const router=useRouter();const[busy,setBusy]=useState(false);const[error,setError]=useState('');
 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();const data=Object.fromEntries(new FormData(e.currentTarget));setBusy(true);setError('');try{await request('/auth/'+type,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});router.push('/dashboard');router.refresh()}catch(err){setError((err as Error).message)}finally{setBusy(false)}}
 return <section className="auth-wrap"><div className="container"><div className="auth-panel"><div className="auth-brand"><span className="auth-symbol"><LockKeyhole size={24}/></span><span className="eyebrow">YOUR FILECRAFT ACCOUNT</span></div><h1>{type==='login'?'Welcome back.':'Your workspace awaits.'}</h1><p>{type==='login'?'Sign in to continue where you left off.':'Create an account to keep track of your file tasks.'}</p><form onSubmit={submit}>
 {type==='register'&&<label className="auth-field">Full name<input type="text" name="name" required minLength={2} maxLength={120} placeholder="Your name" autoComplete="name"/></label>}
 <label className="auth-field">Email address<input type="email" name="email" required placeholder="you@example.com" autoComplete="email"/></label><label className="auth-field">Password<input type="password" name="password" required minLength={type==='register'?10:1} placeholder={type==='register'?'At least 10 characters':'Your password'} autoComplete={type==='register'?'new-password':'current-password'}/></label>
 {error&&<div className="error-box"><TriangleAlert size={17}/>{error}</div>}
 <button className="btn btn-primary auth-submit" type="submit" disabled={busy}>{busy?'Please wait...':type==='login'?'Sign in':'Create account'} <ArrowRight size={18}/></button></form><div className="auth-footer">{type==='login'?<>New to FileCraft? <Link href="/register">Create an account</Link></>:<>Already have an account? <Link href="/login">Sign in</Link></>}</div></div></div></section>
}
