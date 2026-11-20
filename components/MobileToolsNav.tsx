'use client';
import {usePathname} from 'next/navigation';
import Link from 'next/link';
import {Home,LayoutGrid,Clock,User} from 'lucide-react';
export default function MobileToolsNav(){const path=usePathname();if(!path.startsWith('/tools')&&!['/edit-pdf','/remove-background','/file-compressor'].includes(path))return null;return <><div className="mobile-tool-nav-space"/><nav className="mobile-tool-nav" aria-label="Workspace navigation">{[[Home,'Home','/'],[LayoutGrid,'Tools','/tools'],[Clock,'Recent','/dashboard#recent-activity'],[User,'Account','/dashboard']].map(([Icon,label,href])=>{const I=Icon as typeof Home;return <Link key={String(label)} href={String(href)} className={href==='/tools'?'active':''}><I size={21}/>{String(label)}</Link>})}</nav></>}
