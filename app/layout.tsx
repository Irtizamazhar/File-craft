import type { Metadata } from 'next';
import './globals.css';
import './design-system.css';
import './advanced.css';
import './premium.css';
import './account-entry.css';
import Header from '@/components/Header';
import ContentAds from '@/components/ContentAds';
import Footer from '@/components/Footer';
import MobileToolsNav from '@/components/MobileToolsNav';
import {adsEnabled, adsensePublisher, googleVerification, sitePublic, siteUrl} from '@/lib/site';

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

    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify({'@context':'https://schema.org','@type':'WebSite',name:'FileCraft',url:siteUrl,description:'Online file conversion and document tools'}).replace(/</g,'\\u003c')}}/>
  </head><body><ContentAds enabled={adsEnabled} publisher={adsensePublisher}/><Header/><a className="skip-link" href="#main-content">Skip to content</a><main id="main-content">{children}</main><Footer/><MobileToolsNav/></body></html>
}
