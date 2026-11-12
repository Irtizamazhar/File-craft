import type {Metadata} from 'next';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {getGuide,guides} from '@/lib/guides';
import {getTool} from '@/lib/tools';
import {siteUrl} from '@/lib/site';
export function generateStaticParams(){return guides.map(g=>({slug:g.slug}))}
export function generateMetadata({params}:{params:{slug:string}}):Metadata {
 const guide=getGuide(params.slug);return guide?{title:guide.title,description:guide.description,alternates:{canonical:`/guides/${guide.slug}`},openGraph:{title:guide.title,description:guide.description,url:`${siteUrl}/guides/${guide.slug}`,type:'article'}}:{title:'Guide not found'};
}
export default function GuidePage({params}:{params:{slug:string}}){
 const guide=getGuide(params.slug);if(!guide)notFound();
 const data={'@context':'https://schema.org','@type':'Article',headline:guide.title,dateModified:guide.updated,datePublished:guide.updated,author:{'@type':'Organization',name:'FileCraft'},publisher:{'@type':'Organization',name:'FileCraft'},mainEntityOfPage:`${siteUrl}/guides/${guide.slug}`};
 return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(data).replace(/</g,'\\u003c')}}/>
 <section className="subpage-hero"><div className="container"><span className="eyebrow">FILECRAFT GUIDES / {guide.category.toUpperCase()}</span><h1>{guide.title}</h1><p>{guide.description}</p></div></section>
 <section className="simple-section"><div className="container guide-layout"><article className="guide-article"><p className="guide-updated">Updated {guide.updated} · Original FileCraft guide</p>{guide.sections.map(s=><section key={s.heading}><h2>{s.heading}</h2>{s.paragraphs.map((p,i)=><p key={i}>{p}</p>)}{s.steps&&<ol>{s.steps.map(step=><li key={step}>{step}</li>)}</ol>}</section>)}</article><aside className="guide-aside"><h2>Related tools</h2>{guide.related.map(slug=>{const t=getTool(slug);return t?<Link href={'/tools/'+slug} key={slug}>{t.name} →</Link>:null})}<Link href="/blog">All guides →</Link><p>Always review converted documents before relying on important output.</p></aside></div></section></>
}
