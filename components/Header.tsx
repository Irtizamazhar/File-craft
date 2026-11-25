'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useCallback,useEffect,useRef,useState,type PointerEvent} from 'react';
import {Menu,X,ChevronDown,ArrowRight,Zap} from 'lucide-react';
import Brand from './Brand';
import AccountMenu from './header/AccountMenu';
import NotificationBell from './header/NotificationBell';
import {isPaid,useSession} from '@/lib/session-client';

const menus=[
  {label:'All tools',links:[['All tools','/tools'],['Remove Background','/remove-background'],['File Compressor','/file-compressor'],['Word & documents','/document-tools'],['Images','/image-tools']]},
  {label:'PDF tools',links:[['Merge PDF','/tools/merge-pdf'],['Compress PDF','/tools/compress-pdf'],['Split PDF','/tools/split-pdf'],['Edit PDF','/edit-pdf'],['File Compressor','/file-compressor'],['All PDF tools','/pdf-tools']]},
  {label:'Convert',links:[['PDF to Word','/tools/pdf-to-word'],['Images to PDF','/tools/image-to-pdf'],['Word to PDF','/tools/docx-to-pdf'],['All conversions','/convert-tools']]}
];
const hoverQuery='(min-width: 901px) and (any-hover: hover) and (any-pointer: fine)';
const panelId=(label:string)=>'menu-'+label.replaceAll(' ','-');
type Disclosure={label:string;source:'hover'|'click'|'keyboard'};

function canHover(event:PointerEvent){
  return event.pointerType==='mouse'&&window.matchMedia(hoverQuery).matches;
}

export default function Header(){
  const [open,setOpen]=useState(false);
  const [menu,setMenu]=useState<Disclosure|null>(null);
  const pathname=usePathname();
  const root=useRef<HTMLElement>(null);
  const closeTimer=useRef<number|undefined>(undefined);
  const pressedTrigger=useRef<Element|null>(null);
  const session=useSession();
  const user=session.status==='user'?session.user:null;

  const cancelClose=useCallback(()=>{
    window.clearTimeout(closeTimer.current);
    closeTimer.current=undefined;
  },[]);
  const dismiss=useCallback(()=>{
    cancelClose();
    pressedTrigger.current=null;
    setMenu(null);
    setOpen(false);
  },[cancelClose]);

  useEffect(()=>{dismiss()},[pathname,dismiss]);
  useEffect(()=>{
    const outside=(event:globalThis.PointerEvent)=>{
      if(!root.current?.contains(event.target as Node))dismiss();
    };
    const desktop=window.matchMedia('(min-width: 901px)');
    document.addEventListener('pointerdown',outside);
    desktop.addEventListener('change',dismiss);
    return ()=>{
      document.removeEventListener('pointerdown',outside);
      desktop.removeEventListener('change',dismiss);
      cancelClose();
    };
  },[cancelClose,dismiss]);

  useEffect(()=>{
    if(!menu&&!open)return;
    function escape(event:KeyboardEvent){
      if(event.key!=='Escape'||event.defaultPrevented)return;
      const focusInHeader=root.current?.contains(document.activeElement);
      if(!menu&&!focusInHeader)return;
      event.preventDefault();
      if(menu){
        cancelClose();
        setMenu(null);
        if(focusInHeader||menu.source!=='hover')document.getElementById(panelId(menu.label)+'-trigger')?.focus();
      }else{
        dismiss();
        root.current?.querySelector<HTMLButtonElement>('.mobile-menu')?.focus();
      }
    }
    document.addEventListener('keydown',escape);
    return ()=>document.removeEventListener('keydown',escape);
  },[menu,open,cancelClose,dismiss]);

  function hoverMenu(event:PointerEvent,label:string){
    if(!canHover(event))return;
    cancelClose();
    setMenu(current=>{
      if(current?.label===label)return current;
      const focusedPanel=document.activeElement?.closest('.nav-dropdown-panel');
      if(current&&focusedPanel?.id===panelId(current.label))return current;
      return {label,source:'hover'};
    });
  }

  function leaveMenu(event:PointerEvent,label:string){
    if(!canHover(event)||menu?.label!==label||menu.source==='keyboard')return;
    cancelClose();
    closeTimer.current=window.setTimeout(()=>{
      closeTimer.current=undefined;
      setMenu(current=>current?.label===label&&current.source!=='keyboard'&&
        !document.getElementById(panelId(label))?.contains(document.activeElement)?null:current);
    },200);
  }

  const menuButton=<button className="mobile-menu" type="button" aria-label={open?'Close navigation':'Open navigation'}
    aria-expanded={open} aria-controls="main-navigation" onClick={()=>open?dismiss():setOpen(true)}>
    {open?<X aria-hidden="true"/>:<Menu aria-hidden="true"/>}
  </button>;
  return <header className={'site-header'+(user?' is-signed-in':'')} ref={root}
    onMouseDownCapture={event=>{pressedTrigger.current=(event.target as Element).closest('.nav-dropdown > button')}}
    onMouseUpCapture={()=>{pressedTrigger.current=null}}
    onPointerCancel={()=>{pressedTrigger.current=null}}
    onClick={event=>{
    if((event.target as Element).closest('a[href]'))dismiss();
  }}>
    <div className="container header-inner">
      <Brand/>
      {!user&&menuButton}
      <nav id="main-navigation" className={'site-nav '+(open?'open':'')} aria-label="Main navigation">
        {menus.map(item=>{
          const id=panelId(item.label);
          const expanded=menu?.label===item.label;
          return <div className="nav-dropdown" key={id}
            onPointerEnter={event=>hoverMenu(event,item.label)}
            onPointerLeave={event=>leaveMenu(event,item.label)}
            onBlur={event=>{
              // Keep stacked triggers in place until the pointer click can complete.
              if(expanded&&(!pressedTrigger.current||event.relatedTarget!==pressedTrigger.current)&&
                !event.currentTarget.contains(event.relatedTarget)){
                cancelClose();
                setMenu(current=>current?.label===item.label?null:current);
              }
            }}>
            <button id={id+'-trigger'} type="button" aria-expanded={expanded} aria-controls={id}
              onClick={event=>{
                cancelClose();
                const keyboard=event.detail===0;
                setMenu(current=>{
                  if(current?.label===item.label&&current.source!=='hover')return null;
                  return {label:item.label,source:keyboard?'keyboard':'click'};
                });
              }}
              onKeyDown={event=>{
                if(event.key==='Tab'&&expanded){
                  cancelClose();
                  setMenu({label:item.label,source:'keyboard'});
                }
              }}>
              {item.label}<ChevronDown size={15} aria-hidden="true"/>
            </button>
            <div id={id} className="nav-dropdown-panel" hidden={!expanded}>
              {item.links.map(([label,href])=><Link key={href} href={href}>{label}<ArrowRight size={14} aria-hidden="true"/></Link>)}
            </div>
          </div>;
        })}
        <Link className={pathname==='/features'?'current':''} href="/features">Features</Link>
        <Link className={pathname==='/pricing'?'current':''} href="/pricing">Pricing</Link>
        {session.status==='guest'&&<div className="mobile-auth"><Link href="/login">Log in</Link><Link href="/register" className="btn btn-primary">Get started</Link></div>}
      </nav>
      {/* While the session is read, a small placeholder instead of a flash of "Log in / Get started". */}
      {session.status==='loading'&&<div className="acct-skeleton" aria-hidden="true"><span/><span/></div>}
      {session.status==='guest'&&<div className="nav-actions"><Link href="/login" className="nav-login">Log in</Link><Link href="/register" className="btn btn-primary btn-nav">Get started</Link></div>}
      {user&&<div className="acct-actions">
        {!isPaid(user)&&<Link href="/pricing" className="acct-upgrade"><Zap size={15} aria-hidden="true"/><span className="acct-upgrade-label">Upgrade</span></Link>}
        <NotificationBell/>
        {menuButton}
        <AccountMenu user={user} onOpen={dismiss}/>
      </div>}
    </div>
  </header>;
}
