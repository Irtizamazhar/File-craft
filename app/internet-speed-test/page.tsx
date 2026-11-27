import type {Metadata} from 'next';
import Link from 'next/link';
import {Gauge} from 'lucide-react';
import Faq from '@/components/Faq';
import {pageMetadata} from '@/lib/seo';
import {siteUrl} from '@/lib/site';
import InternetSpeedTest from './InternetSpeedTest';
import './speed-test.css';

const path='/internet-speed-test';
const url=siteUrl+path;
const title='Internet Speed Test - Check Download, Upload & Ping Online';
const description="Test your internet connection with Editgoo's free online speed test. Measure real download speed, upload speed and available latency metrics using trusted testing infrastructure.";
const base=pageMetadata({title,description,path});
export const metadata:Metadata={...base,title:{absolute:title+' | Editgoo'}};

const faqs=[
  ['What does this test measure?','The NDT7 download and upload tests measure application-level throughput in Mbps over a single connection to an M-Lab server. Results reflect the network path and conditions at the time of testing.'],
  ['Where do ping and jitter come from?','Ping is the minimum TCP round-trip time reported by the M-Lab download server, in milliseconds. Jitter is unavailable because this integration does not provide an independent series of round-trip samples suitable for measuring jitter.'],
  ['How long does the test take?','Each transfer typically runs for about ten seconds. Discovery and connection setup can add time, and the test may use a substantial amount of data on fast connections.']
];

export default function InternetSpeedTestPage(){
  const schema=[
    {'@context':'https://schema.org','@type':'SoftwareApplication',name:'Editgoo Internet Speed Test',url,description,
      applicationCategory:'UtilitiesApplication',operatingSystem:'Any operating system with a modern web browser',
      offers:{'@type':'Offer',price:'0',priceCurrency:'USD'}},
    {'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[
      {'@type':'ListItem',position:1,name:'Home',item:siteUrl},
      {'@type':'ListItem',position:2,name:'Utilities',item:siteUrl+'/tools?category=Utilities'},
      {'@type':'ListItem',position:3,name:'Internet Speed Test',item:url}
    ]}
  ];
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema).replace(/</g,'\\u003c')}}/>
    <section className="container internet-page">
      <nav aria-label="Breadcrumb" className="breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">›</span><Link href="/tools?category=Utilities">Utilities</Link><span aria-hidden="true">›</span><span aria-current="page">Internet Speed Test</span></nav>
      <h1><span className="internet-heading-icon" aria-hidden="true"><Gauge/></span>Internet Speed Test</h1>
      <InternetSpeedTest url={url}/>
      <div className="internet-instructions"><h2>How to test your connection</h2><p>Review the data notice, agree to the test and select Start Test. Keep this tab open while Editgoo measures download and then upload. Pause other large transfers if you want to measure an idle connection.</p></div>
    </section>
    <Faq items={faqs}/>
  </>;
}
