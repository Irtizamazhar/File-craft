import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {adsensePublisher, googleVerification, sitePublic, siteUrl} from '@/lib/site';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'FileCraft — Free PDF, Word & Image Tools', template: '%s | FileCraft' },
  description: 'Free tools to merge, split, compress and convert PDF, Word, Excel, presentation and image files. Check format limits and download actual processed outputs.',
  robots: sitePublic ? {index:true,follow:true} : {index:false,follow:false},
  openGraph: {title:'FileCraft — Online Document Tools',description:'Practical file conversion and editing tools for PDF, Office and images.',url:siteUrl,type:'website',siteName:'FileCraft',locale:'en_US'},
  twitter: {card:'summary',title:'FileCraft — Free PDF & Document Tools'},
  icons: {icon:'/favicon.svg'},
  ...(googleVerification ? { verification: {google:googleVerification} } : {})
};
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en"><head>
    {adsensePublisher ? <script async src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsensePublisher}`} crossOrigin="anonymous"/> : null}
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify({'@context':'https://schema.org','@type':'WebSite',name:'FileCraft',url:siteUrl,description:'Online file conversion and document tools'}).replace(/</g,'\\u003c')}}/>
  </head><body><Header/><main>{children}</main><Footer/></body></html>
}
