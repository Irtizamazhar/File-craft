'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useEffect,useRef,useState} from 'react';
import {analyticsId,analyticsPreference,applyAnalyticsChoice,readAnalyticsChoice,saveAnalyticsChoice,setAnalyticsPath,type AnalyticsChoice} from '@/lib/analytics';
import styles from './analytics-consent.module.css';

export default function AnalyticsConsent({paths}:{paths:string[]}){
  const path=usePathname();
  const [choice,setChoice]=useState<AnalyticsChoice|null>(null);
  const [loaded,setLoaded]=useState(false);
  const [settings,setSettings]=useState(false);
  const [enabled,setEnabled]=useState(false);
  const trigger=useRef<HTMLButtonElement>(null);
  const toggle=useRef<HTMLInputElement>(null);
  const restoreFocus=useRef(false);
  const opener=useRef<HTMLElement|null>(null);

  useEffect(()=>{
    function refresh(){
      const saved=readAnalyticsChoice();
      applyAnalyticsChoice(saved??'denied');
      setChoice(saved);
      setLoaded(true);
    }
    function storageChanged(event:StorageEvent){
      if(event.key===analyticsPreference||event.key===null)refresh();
    }
    refresh();
    window.addEventListener('storage',storageChanged);
    window.addEventListener('pageshow',refresh);
    return()=>{
      window.removeEventListener('storage',storageChanged);
      window.removeEventListener('pageshow',refresh);
    };
  },[]);

  useEffect(()=>{
    if(path)setAnalyticsPath(path,paths);
  },[path,paths]);

  useEffect(()=>{
    if(settings)toggle.current?.focus();
    else if(restoreFocus.current){
      restoreFocus.current=false;
      (opener.current?.isConnected?opener.current:trigger.current)?.focus();
    }
  },[settings,choice]);

  function choose(value:AnalyticsChoice){
    if(settings)restoreFocus.current=true;
    applyAnalyticsChoice(value);
    saveAnalyticsChoice(value);
    setChoice(value);
    setSettings(false);
  }

  function openSettings(){
    opener.current=document.activeElement instanceof HTMLElement?document.activeElement:null;
    setEnabled(choice==='granted');
    setSettings(true);
  }

  if(!analyticsId||!loaded)return null;
  return <>
    {(choice===null||settings)&&<section className={styles.panel} aria-labelledby="analytics-consent-title">
      <h2 id="analytics-consent-title">{settings?'Cookie settings':'Your cookie choices'}</h2>
      <p>Optional Google Analytics helps us understand which pages and tools people use. <Link href="/cookies#analytics-cookies">Cookie Policy</Link></p>
      {settings&&<label className={styles.toggle}>
        <input ref={toggle} type="checkbox" checked={enabled} onChange={event=>setEnabled(event.target.checked)}/>
        Allow analytics cookies
      </label>}
      <div className={styles.actions}>
        {settings?<>
          <button type="button" onClick={()=>{restoreFocus.current=true;setSettings(false);}}>Cancel</button>
          <button type="button" className={styles.primary} onClick={()=>choose(enabled?'granted':'denied')}>Save settings</button>
        </>:<>
          <button type="button" onClick={openSettings}>Settings</button>
          <button type="button" onClick={()=>choose('denied')}>Reject</button>
          <button type="button" className={styles.primary} onClick={()=>choose('granted')}>Accept</button>
        </>}
      </div>
    </section>}
    <button type="button" className={styles.manage} ref={trigger} aria-expanded={settings} onClick={openSettings}>Cookie settings</button>
  </>;
}
