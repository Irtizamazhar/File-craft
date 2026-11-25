'use client';
import {usePathname} from 'next/navigation';
import Script from 'next/script';
export default function ContentAds({enabled,publisher}:{enabled:boolean;publisher:string}){const path=usePathname();// Ads may only ever load on editorial pages: never on tools, uploads, downloads, accounts or policies.
const allowed=['/about','/blog','/faq','/features','/help'].includes(path)||path.startsWith('/guides/');return enabled&&allowed?<Script id="editgoo-adsense" strategy="afterInteractive" src={'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client='+publisher} crossOrigin="anonymous"/>:null}
