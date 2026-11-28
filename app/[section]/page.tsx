import type {Metadata} from 'next';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import ToolCatalog from '@/components/ToolCatalog';
import Pricing from '@/components/Pricing';
import Faq, {siteQuestions} from '@/components/Faq';
import ContactForm from '@/components/ContactForm';
import {guides} from '@/lib/guides';
import {catalogSections,contentPages,sectionIds,isSection} from '@/lib/site-pages';
import {pageMetadata} from '@/lib/seo';

// Unknown sections render on demand and resolve to the 404 page through notFound().
// (dynamicParams=false made unknown paths throw NoFallbackError during ISR revalidation.)
export const dynamicParams=true;

type Props={params:Promise<{section:string}>};

const componentMeta:Record<string,{title:string;description:string}>={
  pricing:{title:'Pricing',description:'Editgoo plans: the free plan and its limits. Paid plans are not available yet.'},
  contact:{title:'Contact us',description:'Send the Editgoo team a question, suggestion or problem report.'},
  faq:{title:'Frequently asked questions',description:'Answers about Editgoo tools, file privacy, limits, accounts and output quality.'},
  blog:{title:'Guides',description:'Original Editgoo guides for working with PDFs, documents and images.'},
};

export function generateStaticParams(){
  // Always a non-empty, static list; nothing here depends on a network or database call.
  return sectionIds.map(section=>({section}));
}

export async function generateMetadata({params}:Props):Promise<Metadata>{
  const {section}=await params;
  if(!isSection(section))notFound();
  const canonical='/'+section;
  const catalog=catalogSections[section],page=contentPages[section],component=componentMeta[section];
  const title=catalog?.metaTitle||page?.metaTitle||component.title;
  const description=catalog?.subtitle||page?.description||component.description;
  return pageMetadata({title,description,path:canonical});
}

export default async function Section({params}:Props){
  const {section:id}=await params;
  if(!isSection(id))notFound();

  const catalog=catalogSections[id];
  if(catalog)return <><section className="subpage-hero"><div className="container"><span className="eyebrow">{catalog.eyebrow}</span><h1>{catalog.title}</h1><p>{catalog.subtitle}</p></div></section><ToolCatalog heading={false} initial={catalog.category}/></>;
  if(id==='pricing')return <Pricing/>;
  if(id==='faq')return <><section className="subpage-hero"><div className="container"><span className="eyebrow">FAQ</span><h1>Good questions. Clear answers.</h1><p>The essentials about Editgoo tools, your files and your account. For step-by-step help, see the <Link href="/help">help centre</Link>.</p></div></section><Faq items={siteQuestions}/></>;
  if(id==='blog')return <><section className="subpage-hero"><div className="container"><span className="eyebrow">EDITGOO GUIDES</span><h1>Practical file guides.</h1><p>Original walkthroughs, format choices and simple checks to make your file work easier.</p></div></section><section className="simple-section"><div className="container guide-index">{guides.map(g=><Link key={g.slug} href={'/guides/'+g.slug}><span className="eyebrow">{g.category}</span><h2>{g.title}</h2><p>{g.description}</p><span className="inline-link">Read guide →</span></Link>)}</div></section></>;
  if(id==='contact')return <><section className="subpage-hero"><div className="container"><span className="eyebrow">CONTACT US</span><h1>Let’s talk files.</h1><p>Questions, suggestions or a problem with a tool? Send us a message. Please do not include passwords or confidential documents.</p></div></section><div className="container simple-section narrow"><ContactForm/></div></>;

  const page=contentPages[id];
  if(!page)notFound();
  return <><section className="subpage-hero"><div className="container"><span className="eyebrow">{page.eyebrow}</span><h1>{page.title}</h1><p>{page.subtitle}</p>{page.updated&&<p className="page-updated">Last updated: {page.updated}</p>}</div></section>
  <section className={id==='privacy'?'simple-section privacy-policy':'simple-section'}><div className="container article-list">{page.blocks.map((block,i)=><article key={block.heading} id={block.id}><span className="article-number">{String(i+1).padStart(2,'0')}</span><div><h2>{block.heading}</h2>{block.paragraphs.map(text=><p key={text}>{text}</p>)}{block.link&&<p><a className="inline-link" href={block.link.href}>{block.link.label}</a></p>}{block.list&&<ul>{block.list.map(item=><li key={item}>{item}</li>)}</ul>}</div></article>)}</div></section></>;
}
