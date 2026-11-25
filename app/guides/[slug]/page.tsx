import type {Metadata} from 'next';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {getGuide,guides} from '@/lib/guides';
import {getTool} from '@/lib/tools';
import {siteUrl} from '@/lib/site';
import {pageMetadata} from '@/lib/seo';
// Unknown slugs render on demand and resolve to the 404 page (dynamicParams=false threw NoFallbackError).
export const dynamicParams=true;
export function generateStaticParams(){return guides.map(g=>({slug:g.slug}))}
export async function generateMetadata({params:pendingParams}:{params:Promise<{slug:string}>}):Promise<Metadata> {const params=await pendingParams;
 const guide=getGuide(params.slug);if(!guide)notFound();return pageMetadata({title:guide.title,description:guide.description,path:`/guides/${guide.slug}`,type:'article'});
}
export default async function GuidePage({params:pendingParams}:{params:Promise<{slug:string}>}){const params=await pendingParams;
 const guide=getGuide(params.slug);if(!guide)notFound();
 const data={'@context':'https://schema.org','@type':'Article',headline:guide.title,dateModified:guide.updated,datePublished:guide.updated,author:{'@type':'Organization',name:'Editgoo'},publisher:{'@type':'Organization',name:'Editgoo'},mainEntityOfPage:`${siteUrl}/guides/${guide.slug}`};
 return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(data).replace(/</g,'\\u003c')}}/>
 <section className="subpage-hero"><div className="container"><span className="eyebrow">EDITGOO GUIDES / {guide.category.toUpperCase()}</span><h1>{guide.title}</h1><p>{guide.description}</p></div></section>
 <section className="simple-section"><div className="container guide-layout"><article className="guide-article"><p className="guide-updated">Updated {guide.updated} · Original Editgoo guide</p>{guide.sections.map(s=><section key={s.heading}><h2>{s.heading}</h2>{s.paragraphs.map((p,i)=><p key={i}>{p}</p>)}{s.steps&&<ol>{s.steps.map(step=><li key={step}>{step}</li>)}</ol>}</section>)}</article><aside className="guide-aside"><h2>Related tools</h2>{guide.related.map(slug=>{const t=getTool(slug);return t?<Link href={'/tools/'+slug} key={slug}>{t.name} →</Link>:null})}<Link href="/blog">All guides →</Link><p>Always review converted documents before relying on important output.</p></aside></div></section></>
}
