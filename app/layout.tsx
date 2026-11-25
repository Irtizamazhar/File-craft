import type { Metadata } from 'next';
import './globals.css';
import './design-system.css';
import './advanced.css';
import './premium.css';
import './account-entry.css';
import './account-ui.css';
import Header from '@/components/Header';
import ContentAds from '@/components/ContentAds';
import Footer from '@/components/Footer';
import MobileToolsNav from '@/components/MobileToolsNav';
import {adsEnabled, adsensePublisher, googleVerification, sitePublic, siteUrl} from '@/lib/site';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: 'Editgoo',
  title: { default: 'Editgoo — Free Online PDF, Image & Document Tools', template: '%s | Editgoo' },
  description: 'Free online tools to edit, merge, split, compress and convert PDFs, images and Office documents. Most tools run in your browser, with clear limits and real downloadable results.',
  robots: sitePublic ? {index:true,follow:true} : {index:false,follow:false},
  openGraph: {title:'Editgoo — Online tools for PDFs, images and documents',description:'Edit, convert and compress PDFs, images and Office files. Most tools run right in your browser.',url:siteUrl,type:'website',siteName:'Editgoo',locale:'en_US',images:[{url:'/og-image.png',width:1200,height:630,alt:'Editgoo — online tools for PDFs, images and documents'}]},
  // No twitter title/description here: they would override every page; X/Twitter falls back to each page's og: tags.
  twitter: {card:'summary_large_image',images:['/og-image.png']},
  icons: {icon:[{url:'/favicon-32.png',sizes:'32x32',type:'image/png'},{url:'/icon-192.png',sizes:'192x192',type:'image/png'}],apple:'/apple-touch-icon.png'},
  ...(googleVerification ? { verification: {google:googleVerification} } : {})
};
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en"><head>

    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify({'@context':'https://schema.org','@type':'WebSite',name:'Editgoo',url:siteUrl,description:'Online tools for PDFs, images and documents'}).replace(/</g,'\\u003c')}}/>
  </head><body><ContentAds enabled={adsEnabled} publisher={adsensePublisher}/><Header/><a className="skip-link" href="#main-content">Skip to content</a><main id="main-content">{children}</main><Footer/><MobileToolsNav/></body></html>
}
