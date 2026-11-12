'use client';
import {useMemo,useState} from 'react';
import {Search,ArrowRight} from 'lucide-react';
import Link from 'next/link';
import {tools,categories,categoryCount} from '@/lib/tools';
import {ToolCard} from './ToolCard';
export default function ToolCatalog({limit=0,heading=true,initial='All'}:{limit?:number;heading?:boolean;initial?:string}){
 const [search,setSearch]=useState('');const [category,setCategory]=useState(initial);
 const filtered=useMemo(()=>tools.filter(t=>(category==='All'||(category==='Document'?['Word','Excel','PowerPoint','Convert'].includes(t.category):category==='PDF'?['PDF','Convert'].includes(t.category):t.category===category))&&`${t.name} ${t.description}`.toLowerCase().includes(search.toLowerCase())),[category,search]);
 return <section className="catalog-section" id="catalog"><div className="container">
  {heading&&<div className="section-heading"><div><span className="eyebrow">YOUR TOOLBOX, REIMAGINED</span><h2>One place. Every file solution.</h2><p>Pick your tool and turn a task into a done deal.</p></div><Link className="inline-link" href="/tools">Browse all tools <ArrowRight size={17}/></Link></div>}
  <div className="catalog-controls"><div className="category-tabs" role="group" aria-label="Filter tool category">{categories.map(c=><button type="button" key={c} onClick={()=>setCategory(c)} className={c===category?'active':''}>{c}<span>{categoryCount(c)}</span></button>)}</div><label className="tool-search"><Search size={18}/><input aria-label="Search tools" placeholder="Search tools..." value={search} onChange={e=>setSearch(e.target.value)}/></label></div>
  <div className="tool-grid">{filtered.slice(0,limit||undefined).map(tool=><ToolCard key={tool.slug} tool={tool}/>)}</div>
  {!filtered.length&&<div className="empty-state">No tools match your search. Try another keyword.</div>}
  {!!limit&&filtered.length>limit&&<div className="centered"><Link href="/tools" className="btn btn-outline">See all {tools.length} tools <ArrowRight size={17}/></Link></div>}
 </div></section>;
}
