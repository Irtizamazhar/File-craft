'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {BookmarkPlus,Plus,Star,X} from 'lucide-react';
import {tools} from '@/lib/tools';
import {toolBadge} from '@/lib/tool-meta';

// Shortcuts are stored in this browser only (localStorage "filecraft-saved-tools"), exactly as before.
export default function SavedTools(){
  const [saved,setSaved]=useState<string[]>([]),[choice,setChoice]=useState(tools[0].slug),[error,setError]=useState(''),[adding,setAdding]=useState(false);
  useEffect(()=>{try{const value=JSON.parse(localStorage.getItem('filecraft-saved-tools')||'[]');if(Array.isArray(value))setSaved(value.filter(id=>tools.some(t=>t.slug===id)))}catch{}},[]);
  function update(next:string[]){try{localStorage.setItem('filecraft-saved-tools',JSON.stringify(next));setSaved(next)}catch{setError('Your browser blocked saving preferences. You can still open every tool.')}}
  const available=tools.filter(t=>!saved.includes(t.slug));
  useEffect(()=>{if(saved.includes(choice)&&available[0])setChoice(available[0].slug)},[saved]);// eslint-disable-line react-hooks/exhaustive-deps
  return <section className="dash-card dash-tools" id="saved-tools" aria-labelledby="saved-tools-title">
    <div className="dash-card-head"><h2 id="saved-tools-title">Your go-to tools</h2><button type="button" className="dash-link" aria-expanded={adding} aria-controls="shortcut-picker" onClick={()=>setAdding(a=>!a)}>Manage shortcuts</button></div>
    <ul className="dash-shortcuts">
      {saved.map(id=>{const t=tools.find(t=>t.slug===id)!,badge=toolBadge(id);return <li key={id} className="dash-shortcut">
        <Link href={'/tools/'+id}><span className={'dash-badge dash-tone-'+badge.tone} aria-hidden="true">{badge.label}</span><b>{t.name}</b><small>{t.description}</small></Link>
        <button type="button" className="dash-star" aria-label={'Remove saved '+t.name} title="Remove shortcut" onClick={()=>update(saved.filter(s=>s!==id))}><Star size={16} aria-hidden="true"/></button>
      </li>})}
      <li><button type="button" className="dash-add" aria-expanded={adding} aria-controls="shortcut-picker" onClick={()=>setAdding(a=>!a)}><span aria-hidden="true"><Plus size={18}/></span>Add shortcut</button></li>
    </ul>
    {!saved.length&&<p className="dash-muted">No shortcuts yet. Add the tools you use most; they are saved in this browser only.</p>}
    {adding&&<div className="dash-picker" id="shortcut-picker">
      <label className="option-field"><span>Choose a tool</span><select value={choice} onChange={e=>setChoice(e.target.value)}>{tools.map(t=><option value={t.slug} key={t.slug}>{t.name}</option>)}</select></label>
      <button type="button" className="btn btn-outline" disabled={saved.includes(choice)} onClick={()=>update([...saved,choice])}><BookmarkPlus size={17} aria-hidden="true"/> Save shortcut</button>
      <button type="button" className="dash-icon-close" aria-label="Close shortcut picker" onClick={()=>setAdding(false)}><X size={17} aria-hidden="true"/></button>
    </div>}
    {error&&<p role="alert" className="form-error">{error}</p>}
  </section>;
}
