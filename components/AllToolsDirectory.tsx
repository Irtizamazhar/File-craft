'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import Link from 'next/link';
import {
  Search, ArrowRight, ChevronRight, SlidersHorizontal, X, LayoutGrid, FileText,
  ArrowLeftRight, Image, Layers, Shield, Flame, Scissors, Gauge, FilePen, FileArchive
} from 'lucide-react';
import {
  directoryTools,directoryCategories,directoryGroups,inDirectoryCategory,popularSlugs,
  type DirectoryCategory,type DirectoryGroup,type DirectoryTool
} from '@/lib/directory';
import HeroArtwork from './HeroArtwork';
import FeaturedToolCard from './FeaturedToolCard';

const categoryIcons=[LayoutGrid,FileText,ArrowLeftRight,Image,Layers,Shield];
const categoryTitles:Record<DirectoryCategory,string>={
  'All Tools':'Browse all tools',PDF:'PDF tools',Convert:'File conversion',Images:'Image tools',Office:'Office tools',Security:'Security tools'
};
const groupIcons=[LayoutGrid,Flame,Layers,Gauge,ArrowLeftRight,ArrowLeftRight,Image,FileText,Shield];
const sheetGroups=directoryGroups.slice(1,6);
const categoryCounts=Object.fromEntries(directoryCategories.map(category=>[
  category,directoryTools.filter(tool=>inDirectoryCategory(tool,category)).length
]));
const popularOrder=new Map(popularSlugs.map((slug,index)=>[slug,index]));
const orderedTools=[...directoryTools].sort((a,b)=>(popularOrder.get(a.slug)??Infinity)-(popularOrder.get(b.slug)??Infinity));

function ToolIcon({tool}:{tool:DirectoryTool}){
  const Icon=tool.slug==='edit-pdf'?FilePen:tool.slug.includes('compress')?FileArchive:
    tool.slug==='split-pdf'?Scissors:tool.slug.includes('merge')?Layers:tool.category==='Image'?Image:
    tool.category==='Convert'?ArrowLeftRight:FileText;
  return <span className={'directory-icon icon-'+tool.category.toLowerCase()} aria-hidden="true"><Icon size={25}/></span>;
}

export default function AllToolsDirectory({initialCategory,initialGroup}:{initialCategory:DirectoryCategory;initialGroup:DirectoryGroup}){
  const [search,setSearch]=useState('');
  const [category,setCategory]=useState(initialCategory);
  const [group,setGroup]=useState(initialGroup);
  const [draft,setDraft]=useState(initialCategory);
  const [draftGroup,setDraftGroup]=useState(initialGroup);
  const field=useRef<HTMLInputElement>(null);
  const sheet=useRef<HTMLDialogElement>(null);
  const trigger=useRef<HTMLButtonElement>(null);
  const query=search.trim().toLowerCase();
  const hasFilters=category!=='All Tools'||group!=='All tools';
  const filtered=useMemo(()=>{
    const words=query.split(/\s+/);
    return orderedTools.filter(tool=>{
      const matchesGroup=group==='All tools'||(group==='Popular tools'?popularOrder.has(tool.slug):inDirectoryCategory(tool,group));
      const content=[tool.name,tool.description,tool.keywords].join(' ').toLowerCase();
      return matchesGroup&&inDirectoryCategory(tool,category)&&words.every(word=>content.includes(word));
    });
  },[query,category,group]);

  useEffect(()=>{
    const focusSearch=(event:KeyboardEvent)=>{
      if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'&&!sheet.current?.open){
        event.preventDefault();
        field.current?.focus();
      }
    };
    window.addEventListener('keydown',focusSearch);
    return ()=>window.removeEventListener('keydown',focusSearch);
  },[]);

  function choose(next:DirectoryCategory){
    setCategory(next);
    setGroup('All tools');
  }

  function reset(){
    setSearch('');
    choose('All Tools');
    field.current?.focus();
  }

  const resultTitle=query?'Search results':group==='All tools'?categoryTitles[category]:group;
  return <div className="tools-directory">
    <section className="directory-hero container">
      <div>
        <nav className="breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><ChevronRight size={14}/><span aria-current="page">All tools</span></nav>
        <h1>Everything you need for your <em>files.</em></h1>
        <p>Powerful PDF, document and image tools in one easy workspace.</p>
        <div className="directory-search" role="search">
          <Search size={23} aria-hidden="true"/>
          <input ref={field} aria-label="Search tools" placeholder="Search tools like Merge PDF, Remove Background..." value={search} onChange={event=>setSearch(event.target.value)}/>
          {search?<button type="button" aria-label="Clear search" onClick={()=>{setSearch('');field.current?.focus()}}><X size={20}/></button>:<kbd aria-hidden="true">Ctrl K</kbd>}
        </div>
      </div>
      <HeroArtwork/>
    </section>

    <div className="container directory-toolbar">
      <div className="directory-chips" role="group" aria-label="Tool categories">
        {directoryCategories.map((item,index)=>{
          const Icon=categoryIcons[index];
          return <button key={item} type="button" aria-pressed={category===item&&group==='All tools'} className={category===item&&group==='All tools'?'active':''} onClick={()=>choose(item)}><Icon size={18}/>{item}<small>{categoryCounts[item]}</small></button>;
        })}
      </div>
      <span className="directory-count">{filtered.length} {filtered.length===1?'tool':'tools'}</span>
      <button type="button" className="category-sheet-trigger" ref={trigger} onClick={()=>{setDraft(category);setDraftGroup(group);sheet.current?.showModal()}}><SlidersHorizontal size={18}/> Categories</button>
    </div>

    {!query&&!hasFilters&&<section className="container featured-directory">
      <div className="section-heading"><h2>Featured tools</h2><a href="#complete-directory" className="inline-link">Browse directory <ArrowRight size={18}/></a></div>
      <div className="featured-directory-grid">{directoryTools.filter(tool=>tool.featured).map(tool=><FeaturedToolCard key={tool.slug} tool={tool}/>)}</div>
    </section>}

    <section id="complete-directory" className="container complete-directory" aria-labelledby="directory-title">
      <aside className="directory-sidebar" aria-label="Browse tools">
        <h2>Collections</h2>
        {directoryGroups.map((item,index)=>{
          const Icon=groupIcons[index];
          const active=group===item&&category==='All Tools';
          return <button key={item} type="button" aria-pressed={active} className={active?'active':''} onClick={()=>{setGroup(item);setCategory('All Tools')}}><Icon size={19}/>{item}</button>;
        })}
      </aside>
      <div className="directory-results">
        <div className="directory-result-heading">
          <h2 id="directory-title">{resultTitle}</h2>
          <span role="status">{filtered.length} {filtered.length===1?'tool':'tools'}</span>
          {filtered.length>0&&(query||hasFilters)&&<button type="button" className="directory-reset" onClick={reset}>Clear filters</button>}
        </div>
        {(category==='Security'||group==='Security')&&<p className="directory-help">Review PDF metadata or remove embedded metadata from images.</p>}
        <div className="directory-grid">
          {filtered.map(tool=><Link className="directory-tool-card" href={tool.path} key={tool.slug}>
            <ToolIcon tool={tool}/><div><h3>{tool.name}</h3><p>{tool.description}</p></div><ChevronRight className="directory-card-arrow" size={19} aria-hidden="true"/>
          </Link>)}
        </div>
        {!filtered.length&&<div className="empty-state"><Search size={28}/><h3>No matching tools</h3><p>Try a different word or reset your filters.</p><button type="button" className="btn btn-primary" onClick={reset}>Clear search and filters</button></div>}
      </div>
    </section>
    <dialog ref={sheet} className="category-sheet" aria-labelledby="category-sheet-title" onClose={()=>trigger.current?.focus()} onClick={event=>{if(event.target===event.currentTarget)sheet.current?.close()}}>
      <div className="sheet-handle"/>
      <div className="sheet-title"><h2 id="category-sheet-title">Browse categories</h2><button type="button" aria-label="Close categories" onClick={()=>sheet.current?.close()}><X/></button></div>
      <div className="sheet-options">
        {directoryCategories.map((item,index)=>{
          const Icon=categoryIcons[index];
          return <label key={item}><Icon size={22}/><span>{item}<small>{categoryCounts[item]} tools</small></span><input type="radio" name="category" value={item} checked={draft===item&&draftGroup==='All tools'} onChange={()=>{setDraft(item);setDraftGroup('All tools')}}/></label>;
        })}
        <h3>PDF and popular collections</h3>
        {sheetGroups.map((item,index)=>{
          const Icon=groupIcons[index+1];
          return <label key={item}><Icon size={22}/><span>{item}</span><input type="radio" name="category" value={item} checked={draftGroup===item} onChange={()=>{setDraft('All Tools');setDraftGroup(item)}}/></label>;
        })}
      </div>
      <button type="button" className="btn btn-primary" onClick={()=>{setCategory(draft);setGroup(draftGroup);sheet.current?.close()}}>Show tools</button>
    </dialog>
  </div>;
}
