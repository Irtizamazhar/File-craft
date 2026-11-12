'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useState} from 'react';
import { Menu, X, ChevronDown, ArrowUpRight } from 'lucide-react';
import Brand from './Brand';
export default function Header(){
 const [open,setOpen]=useState(false);const pathname=usePathname();
 return <header className="site-header"><div className="container header-inner">
  <Brand/>
  <nav className={'site-nav '+(open?'open':'')} aria-label="Main navigation">
    <Link onClick={()=>setOpen(false)} className={pathname.startsWith('/tools')?'current':''} href="/tools">All tools</Link>
    <Link onClick={()=>setOpen(false)} href="/pdf-tools">PDF tools</Link>
    <Link onClick={()=>setOpen(false)} href="/document-tools">Document tools</Link>
    <Link onClick={()=>setOpen(false)} href="/blog">Guides</Link><Link onClick={()=>setOpen(false)} href="/pricing">Pricing</Link>
    <Link onClick={()=>setOpen(false)} href="/security">Security</Link>
    <div className="mobile-auth"><Link href="/login">Log in</Link><Link href="/register" className="btn btn-primary">Get started <ArrowUpRight size={16}/></Link></div>
  </nav>
  <div className="nav-actions"><Link href="/login" className="nav-login">Log in</Link><Link href="/dashboard" className="btn btn-primary btn-nav">My workspace <ArrowUpRight size={15}/></Link></div>
  <button className="mobile-menu" type="button" aria-label="Toggle menu" aria-expanded={open} onClick={()=>setOpen(!open)}>{open?<X size={22}/>:<Menu size={22}/>}</button>
 </div></header>
}
