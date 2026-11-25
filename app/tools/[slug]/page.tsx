import type {Metadata} from 'next';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {ArrowLeft,ArrowRight,Check,LockKeyhole,FileText,ShieldCheck,Clock3} from 'lucide-react';
import {tools,getTool} from '@/lib/tools';
import {siteUrl} from '@/lib/site';
import {pageMetadata} from '@/lib/seo';
import {guides} from '@/lib/guides';
import ToolProcessor from '@/components/ToolProcessor';
import Faq from '@/components/Faq';
import {toolDetails} from '@/lib/tool-details';
import {ToolCard} from '@/components/ToolCard';
import CatalogWorkspace from '@/components/tool-workspace/CatalogWorkspace';
import WorkspaceHeader,{WorkspaceWhy} from '@/components/tool-workspace/WorkspaceHeader';
import workspaceStyles from '@/components/tool-workspace/workspace.module.css';
import {usesWorkspace} from '@/lib/tool-workspace';
// Unknown slugs render on demand and resolve to the 404 page (dynamicParams=false threw NoFallbackError).
export const dynamicParams=true;
export function generateStaticParams(){return tools.map(tool=>({slug:tool.slug}))}
export async function generateMetadata({params:pendingParams}:{params:Promise<{slug:string}>}):Promise<Metadata>{const params=await pendingParams;const tool=getTool(params.slug);if(!tool)notFound();return pageMetadata({title:tool.name,description:tool.description,path:`/tools/${tool.slug}`})}
export default async function ToolPage({params:pendingParams}:{params:Promise<{slug:string}>}){const params=await pendingParams;
 const tool=getTool(params.slug);if(!tool)notFound();
 const detail=toolDetails[tool.slug];
 const related=tools.filter(t=>t.category===tool.category&&t.slug!==tool.slug).slice(0,3);
 const relatedGuides=guides.filter(g=>g.related.includes(tool.slug)).slice(0,2);
 const howTo=[`Choose ${tool.name} and select ${tool.multi?'your source files':'a source file'} from your device.`,`Check the selected names, format and processing options.`,`Select Process and let your browser complete the operation.`,`Download the result, open it and review important details before sharing.`];
 const breadcrumbSchema={'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Home',item:siteUrl},{'@type':'ListItem',position:2,name:'All tools',item:siteUrl+'/tools'},{'@type':'ListItem',position:3,name:tool.name,item:siteUrl+'/tools/'+tool.slug}]};
 const structured={'@context':'https://schema.org','@type':'SoftwareApplication',name:`Editgoo ${tool.name}`,applicationCategory:'UtilitiesApplication',operatingSystem:'Web browser',description:tool.description,url:`${siteUrl}/tools/${tool.slug}`,offers:{'@type':'Offer',price:'0',priceCurrency:'USD'}};
 // One-step workspace (lib/tool-workspace.ts) or the previous layout, kept unchanged as the fallback.
 const workspace=usesWorkspace(tool.slug);
 return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify([structured,breadcrumbSchema]).replace(/</g,'\\u003c')}}/>
 {workspace?<><WorkspaceHeader title={tool.name} description={tool.description}/><section className={workspaceStyles.section}><div className="container"><CatalogWorkspace tool={tool}/><WorkspaceWhy/></div></section></>:<><section className="tool-page-hero"><div className="container"><div className="breadcrumb"><Link href="/">Home</Link><ArrowRight size={13}/><Link href="/tools">All tools</Link><ArrowRight size={13}/><span>{tool.name}</span></div><span className="eyebrow">EDITGOO / {tool.category.toUpperCase()}</span><h1>{tool.name}<span className="heading-period">.</span></h1><p>{tool.description}</p></div></section>
 <section className="tool-workspace"><div className="container tool-layout"><ToolProcessor tool={tool}/><aside className="tool-sidebar"><div className="sidebar-card"><span className="sidebar-pill">WHY EDITGOO</span><h3>A little less effort.</h3><div className="sidebar-benefit"><span><ShieldCheck size={18}/></span><div><b>Private by design</b><p>Your document files are processed on your device, not uploaded to our website.</p></div></div><div className="sidebar-benefit"><span><Clock3 size={18}/></span><div><b>Get time back</b><p>Simple tools that take care of the tedious bits.</p></div></div><div className="sidebar-benefit"><span><FileText size={18}/></span><div><b>Actual file outputs</b><p>The browser generates downloadable outputs from actual document operations.</p></div></div></div><div className="sidebar-mini"><LockKeyhole size={19}/><div><b>Safe processing</b><p>Document contents remain in your browser; however, use only trusted devices for confidential work.</p></div></div></aside></div></section></>}
 <section className="simple-section"><div className="container guide-layout"><article className="guide-article"><h2>How to use {tool.name}</h2><p>{tool.description} This tool processes files on your own device. File contents are not uploaded to our servers.</p><ol>{howTo.map(step=><li key={step}>{step}</li>)}</ol><h2>Supported files and limits</h2><p>Accepted file types: <strong>{tool.accept.replaceAll(',',', ')}</strong>. {tool.multi?'You can add up to 12 files at once. ':'This tool works on one file at a time. '}Each file can be up to 15 MB, with 45 MB per task. Files are checked before processing, so a file whose content does not match its type is rejected with an explanation. For confidential files, use a device you trust and keep your original.</p><h2>What this tool produces</h2><p><strong>Output: {detail.output}.</strong> {detail.purpose}</p><h2>What to expect</h2><p>{detail.limitation}</p><p>Files are processed locally within your browser. Generated download links disappear when the page is closed. Always check important outputs before relying on them.</p></article><aside className="guide-aside"><h2>Learn more</h2>{relatedGuides.map(g=><Link key={g.slug} href={'/guides/'+g.slug}>{g.title} →</Link>)}<Link href="/blog">More document guides →</Link><Link href="/help">Help and file limits →</Link></aside></div></section>
 <Faq items={[[`What can I expect from ${tool.name}?`,detail.purpose],['What should I check before sharing?',detail.limitation],['Where does the file processing happen?','This tool runs in your browser. File contents are not uploaded to Editgoo. Save your download before leaving the page.'],['Is it free?','Yes. '+tool.name+' is free to use, with or without an account.']]}/><section className="related-section"><div className="container"><div className="section-heading"><div><span className="eyebrow">KEEP GOING</span><h2>More tools you might like.</h2></div><Link href="/tools" className="inline-link">View all tools <ArrowRight size={17}/></Link></div><div className="tool-grid">{related.map(t=><ToolCard key={t.slug} tool={t}/>)}</div></div></section></>;
}
