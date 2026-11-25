'use client';

import {useEffect,useState,type FormEvent} from 'react';
import {useRouter} from 'next/navigation';
import Link from 'next/link';
import {Eye,EyeOff,LoaderCircle,TriangleAlert} from 'lucide-react';
import {request} from '@/lib/api';
import {announceSession} from '@/lib/session-client';

type Field='name'|'email'|'password'|'confirmPassword'|'consent';
type Values=Record<Field,string>;
const empty:Values={name:'',email:'',password:'',confirmPassword:'',consent:''};

function validate(values:Values,register:boolean){
  const errors:Partial<Record<Field,string>>={};
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())||values.email.trim().length>190){
    errors.email='Enter a valid email address.';
  }
  if(!register){
    if(!values.password)errors.password='Enter your password.';
    return errors;
  }
  if(values.name.trim().length<2||values.name.trim().length>120)errors.name='Enter a name between 2 and 120 characters.';
  if(values.password.length<10||values.password.length>128)errors.password='Use 10 to 128 characters.';
  if(!values.confirmPassword||values.confirmPassword!==values.password)errors.confirmPassword='Enter the same password in both fields.';
  if(values.consent!=='on')errors.consent='Accept the terms and privacy policy to continue.';
  return errors;
}

function PasswordField({name,label,value,error,showHint,autoComplete,onChange,onBlur}:{
  name:'password'|'confirmPassword';label:string;value:string;error?:string;showHint?:boolean;
  autoComplete:string;onChange:(value:string)=>void;onBlur:()=>void;
}){
  const [visible,setVisible]=useState(false);
  const Icon=visible?EyeOff:Eye;
  const description=[showHint?'password-requirements':null,error?name+'-error':null].filter(Boolean).join(' ');
  return <div className="entry-field">
    <label htmlFor={name}>{label}</label>
    <div className="entry-password">
      <input id={name} name={name} type={visible?'text':'password'} autoComplete={autoComplete}
        value={value} onChange={event=>onChange(event.target.value)} onBlur={onBlur}
        required aria-invalid={!!error} aria-describedby={description||undefined}/>
      <button type="button" aria-label={(visible?'Hide ':'Show ')+(name==='password'?'password':'password confirmation')}
        onClick={()=>setVisible(!visible)}><Icon size={20} aria-hidden="true"/></button>
    </div>
    {showHint&&<p id="password-requirements">Use 10 to 128 characters.</p>}
    {error&&<p className="entry-error" id={name+'-error'}>{error}</p>}
  </div>;
}

export default function AuthForm({type}:{type:'login'|'register'}){
  const router=useRouter();
  const register=type==='register';
  const [values,setValues]=useState(empty);
  const [visited,setVisited]=useState<Partial<Record<Field,boolean>>>({});
  const [submitted,setSubmitted]=useState(false);
  const [ready,setReady]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  useEffect(()=>setReady(true),[]);

  const errors=validate(values,register);
  const fieldError=(name:Field)=>visited[name]||submitted?errors[name]:undefined;
  const visit=(name:Field)=>setVisited(previous=>({...previous,[name]:true}));
  const change=(name:Field,value:string)=>{
    setValues(previous=>({...previous,[name]:value}));
    setError('');
  };

  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(!ready||busy)return;
    const form=event.currentTarget;
    const data=Object.fromEntries(new FormData(form)) as Values;
    const invalid=Object.keys(validate(data,register))[0];
    setValues({...empty,...data});
    setSubmitted(true);
    if(invalid){form.querySelector<HTMLInputElement>('[name="'+invalid+'"]')?.focus();return;}
    setBusy(true);
    setError('');
    try{
      await request('/auth/'+type,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
      announceSession();// the header switches to the signed-in view without a reload
      router.replace('/dashboard');
      router.refresh();
    }catch(failure){
      setError(failure instanceof Error?failure.message:'Try again in a moment.');
      setBusy(false);
    }
  }

  return <>
    <form className="entry-form" method="post" noValidate onSubmit={submit}>
      {register&&<div className="entry-field">
        <label htmlFor="name">Full name</label>
        <input id="name" name="name" autoComplete="name" value={values.name}
          onChange={event=>change('name',event.target.value)} onBlur={()=>visit('name')}
          required maxLength={120} aria-invalid={!!fieldError('name')} aria-describedby={fieldError('name')?'name-error':undefined}/>
        {fieldError('name')&&<p className="entry-error" id="name-error">{fieldError('name')}</p>}
      </div>}
      <div className="entry-field">
        <label htmlFor="email">Email address</label>
        <input id="email" type="email" name="email" autoComplete={register?'email':'username'} value={values.email}
          onChange={event=>change('email',event.target.value)} onBlur={()=>visit('email')}
          placeholder="you@example.com" required maxLength={190} aria-invalid={!!fieldError('email')} aria-describedby={fieldError('email')?'email-error':undefined}/>
        {fieldError('email')&&<p className="entry-error" id="email-error">{fieldError('email')}</p>}
      </div>
      <PasswordField name="password" label="Password" value={values.password} error={fieldError('password')}
        showHint={register} autoComplete={register?'new-password':'current-password'}
        onChange={value=>change('password',value)} onBlur={()=>visit('password')}/>
      {register?<>
        <PasswordField name="confirmPassword" label="Confirm password" value={values.confirmPassword} error={fieldError('confirmPassword')}
          autoComplete="new-password" onChange={value=>change('confirmPassword',value)} onBlur={()=>visit('confirmPassword')}/>
        <div className="entry-consent">
          <input type="checkbox" name="consent" id="consent" required checked={values.consent==='on'}
            onChange={event=>change('consent',event.target.checked?'on':'')}
            aria-invalid={!!fieldError('consent')} aria-describedby={fieldError('consent')?'consent-error':undefined}/>
          <div><label htmlFor="consent">I accept the terms and privacy policy.</label> <Link href="/terms">Terms</Link> · <Link href="/privacy">Privacy</Link>
            {fieldError('consent')&&<p className="entry-error" id="consent-error">{fieldError('consent')}</p>}
          </div>
        </div>
      </>:<Link className="entry-forgot" href="/forgot-password">Forgot password?</Link>}
      {error&&<div className="entry-feedback" role="alert"><TriangleAlert size={19} aria-hidden="true"/>{error}</div>}
      <button className="btn btn-primary entry-submit" type="submit" disabled={!ready||busy}>
        {busy?<><LoaderCircle size={19} className="spin" aria-hidden="true"/>{register?'Creating account…':'Logging in…'}</>:register?'Create account':'Log in'}
      </button>
    </form>
    <p className="entry-switch">{register?<>Already have an account? <Link href="/login">Log in</Link></>:<>New to Editgoo? <Link href="/register">Create an account</Link></>}</p>
  </>;
}
