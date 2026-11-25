'use client';
import {useEffect,useRef,useState} from 'react';
import {usePathname} from 'next/navigation';
import {Bell} from 'lucide-react';

// TODO(notifications): there is no notification feed yet. Connect one here; the red dot shows when unread > 0.
const unread=0;

export default function NotificationBell(){
  const [open,setOpen]=useState(false);
  const wrap=useRef<HTMLDivElement>(null),button=useRef<HTMLButtonElement>(null);
  const pathname=usePathname();
  useEffect(()=>{setOpen(false)},[pathname]);
  useEffect(()=>{
    if(!open)return;
    const down=(e:PointerEvent)=>{if(!wrap.current?.contains(e.target as Node))setOpen(false)};
    const key=(e:KeyboardEvent)=>{if(e.key==='Escape'&&!e.defaultPrevented){e.preventDefault();setOpen(false);button.current?.focus()}};
    document.addEventListener('pointerdown',down);document.addEventListener('keydown',key);
    return ()=>{document.removeEventListener('pointerdown',down);document.removeEventListener('keydown',key)};
  },[open]);
  return <div className="acct-bell" ref={wrap}>
    <button ref={button} type="button" className="acct-icon-button" aria-label={unread?`Notifications, ${unread} unread`:'Notifications'}
      aria-expanded={open} aria-controls="notification-panel" onClick={()=>setOpen(o=>!o)}>
      <Bell size={19} aria-hidden="true"/>{unread>0&&<i className="acct-dot"/>}
    </button>
    {open&&<div id="notification-panel" className="acct-popover" role="region" aria-label="Notifications">
      <b>Notifications</b>
      <p>You’re all caught up. Updates about your account will appear here.</p>
    </div>}
  </div>;
}
