'use client';
import {useEffect,useRef,useState,type KeyboardEvent as ReactKeyboardEvent} from 'react';
import {createPortal} from 'react-dom';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {Bookmark,ChevronDown,CreditCard,History,LayoutGrid,LifeBuoy,LogOut,Settings,UserRound,Zap} from 'lucide-react';
import Avatar from './Avatar';
import {firstName,isPaid,signOut,type SessionUser} from '@/lib/session-client';

const PHONE='(max-width: 760px)';
const ITEMS:[string,string,typeof LayoutGrid][]=[
  ['Dashboard','/dashboard',LayoutGrid],
  ['My profile','/dashboard#profile',UserRound],
  ['Saved shortcuts','/dashboard#saved-tools',Bookmark],
  ['Activity history','/dashboard#recent-activity',History],
  ['Account settings','/dashboard#account-settings',Settings],
];

/**
 * Profile button + dropdown. Desktop: 300px panel aligned right. Phones: full-width panel under the header with a dark
 * overlay behind it (rendered in <body>, below the header's z-index, because the header's backdrop-filter would trap a
 * fixed overlay inside the header) and the page does not scroll while it is open.
 */
export default function AccountMenu({user,onOpen}:{user:SessionUser;onOpen?:()=>void}){
  const [open,setOpen]=useState(false),[phone,setPhone]=useState(false),[leaving,setLeaving]=useState(false);
  const wrap=useRef<HTMLDivElement>(null),trigger=useRef<HTMLButtonElement>(null),menu=useRef<HTMLDivElement>(null);
  const focusOnOpen=useRef<'first'|'last'|null>(null);
  const pathname=usePathname();
  const paid=isPaid(user),plan=user.planName||'Free';
  const items=()=>Array.from(menu.current?.querySelectorAll<HTMLElement>('[role="menuitem"]')??[]);

  useEffect(()=>{setOpen(false)},[pathname]);
  useEffect(()=>{const mq=window.matchMedia(PHONE);const update=()=>setPhone(mq.matches);update();mq.addEventListener('change',update);return ()=>mq.removeEventListener('change',update)},[]);
  useEffect(()=>{
    if(!open)return;
    if(focusOnOpen.current){const list=items();(focusOnOpen.current==='first'?list[0]:list[list.length-1])?.focus();focusOnOpen.current=null}
    const down=(e:PointerEvent)=>{if(!wrap.current?.contains(e.target as Node))setOpen(false)};
    const key=(e:KeyboardEvent)=>{if(e.key==='Escape'&&!e.defaultPrevented){e.preventDefault();setOpen(false);trigger.current?.focus()}};
    document.addEventListener('pointerdown',down);document.addEventListener('keydown',key);
    return ()=>{document.removeEventListener('pointerdown',down);document.removeEventListener('keydown',key)};
  },[open]);
  useEffect(()=>{// no page scrolling behind the phone panel
    if(!open||!phone)return;
    const body=document.body,previous=body.style.overflow;body.style.overflow='hidden';
    return ()=>{body.style.overflow=previous};
  },[open,phone]);

  function show(focus:'first'|'last'|null){onOpen?.();focusOnOpen.current=focus;setOpen(true)}
  function menuKeys(e:ReactKeyboardEvent){
    const list=items(),at=list.indexOf(document.activeElement as HTMLElement);
    const move=(i:number)=>{e.preventDefault();list[(i+list.length)%list.length]?.focus()};
    if(e.key==='ArrowDown')move(at+1);
    else if(e.key==='ArrowUp')move(at-1);
    else if(e.key==='Home')move(0);
    else if(e.key==='End')move(list.length-1);
    else if(e.key==='Tab')setOpen(false);
  }
  async function leave(){if(leaving)return;setLeaving(true);await signOut()}

  return <div className={'acct-menu'+(open?' is-open':'')} ref={wrap}>
    <button ref={trigger} type="button" className="acct-trigger" aria-haspopup="menu" aria-expanded={open} aria-controls="account-menu"
      onClick={e=>{if(open)setOpen(false);else show(e.detail===0?'first':null)}}
      onKeyDown={e=>{if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();const where=e.key==='ArrowDown'?'first':'last';if(open){const list=items();(where==='first'?list[0]:list[list.length-1])?.focus()}else show(where)}}}>
      <Avatar name={user.name} online/>
      <span className="acct-trigger-text"><b>{firstName(user.name)}</b><small>{plan} plan</small></span>
      <span className="acct-sr"> account menu</span>
      <ChevronDown className="acct-chevron" size={16} aria-hidden="true"/>
    </button>
    {open&&<div className="acct-panel">
      <div className="acct-panel-head">
        <Avatar name={user.name} size="lg"/>
        <div><b>{user.name}</b><span>{user.email}</span><em className="acct-pill">{plan} plan</em></div>
      </div>
      {!paid&&<Link className="acct-upgrade-wide" href="/pricing" onClick={()=>setOpen(false)}><Zap size={17} aria-hidden="true"/>Upgrade to Pro</Link>}
      <div id="account-menu" ref={menu} role="menu" aria-label="Account" className="acct-items" onKeyDown={menuKeys}>
        {ITEMS.map(([label,href,Icon])=><Link key={label} role="menuitem" href={href} className={pathname==='/dashboard'&&href==='/dashboard'?'is-current':''} onClick={()=>setOpen(false)}>
          <Icon size={18} aria-hidden="true"/>{label}</Link>)}
        <Link role="menuitem" href="/pricing" onClick={()=>setOpen(false)}><CreditCard size={18} aria-hidden="true"/>Plan &amp; billing{!paid&&<span className="acct-tag">Go Pro</span>}</Link>
        <div className="acct-divider" role="separator"/>
        <Link role="menuitem" href="/contact" onClick={()=>setOpen(false)}><LifeBuoy size={18} aria-hidden="true"/>Help &amp; support</Link>
        <button role="menuitem" type="button" className="acct-signout" disabled={leaving} onClick={()=>void leave()}><LogOut size={18} aria-hidden="true"/>{leaving?'Signing out…':'Sign out'}</button>
      </div>
    </div>}
    {open&&phone&&createPortal(<div className="acct-overlay" aria-hidden="true" onClick={()=>setOpen(false)}/>,document.body)}
  </div>;
}
