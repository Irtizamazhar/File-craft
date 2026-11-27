'use client';
import {beginToolAnalytics} from '@/lib/analytics';
import {useEffect,useRef,useState} from 'react';
import {CheckCircle2,Loader2,Plus,TriangleAlert} from 'lucide-react';
import {processFile,validateInput,type ProcessedFile} from '@/lib/browser-engine';
import {takeFiles} from '@/lib/file-handoff';
import type {Tool} from '@/lib/tools';
import ToolWorkspace,{OptionsPanel} from './ToolWorkspace';
import InlineDropzone from './InlineDropzone';
import FileCard from './FileCard';
import ActionButton,{type ActionMode} from './ActionButton';
import ResultPreview,{type ResultFile} from './ResultPreview';
import {niceSize} from './FileThumbnail';
import styles from './workspace.module.css';

const TWO_FILES=['merge-pdf','merge-docx','compare-pdf'];
const LIMITS='15 MB per file · 45 MB per task · up to 12 files';
const SLOT_LABELS=['Original PDF','Changed PDF'];

/**
 * One-step workspace for the catalog tools (catalog/tools.json). The selection rules, error messages, processing
 * call, output naming and activity record are the same as components/ToolProcessor.tsx (the previous layout, kept as
 * the fallback); only where things appear has changed: files, progress and the result stay inside the upload box.
 */
export default function CatalogWorkspace({tool}:{tool:Tool}){
  const input=useRef<HTMLInputElement>(null),chooseButton=useRef<HTMLButtonElement>(null),urls=useRef<string[]>([]),running=useRef(false),selection=useRef(0),slotTarget=useRef<number|null>(null),focusChoose=useRef(false);
  const compare=tool.slug==='compare-pdf',ordered=tool.multi&&!compare;
  // Compare PDFs keeps two fixed slots (original, changed); every other tool keeps an ordered list.
  const [list,setList]=useState<File[]>([]),[slots,setSlots]=useState<(File|null)[]>([null,null]);
  const files=compare?slots.filter((f):f is File=>!!f):list;
  const [options,setOptions]=useState<Record<string,string>>(()=>Object.fromEntries(tool.controls.map(c=>[c.key,c.default]))),[outputName,setOutputName]=useState('');
  const [busy,setBusy]=useState(false),[checking,setChecking]=useState(false),[results,setResults]=useState<ResultFile[]>([]),[error,setError]=useState(''),[hint,setHint]=useState('');

  const resetResults=()=>{urls.current.forEach(u=>URL.revokeObjectURL(u));urls.current=[];setResults([])};
  useEffect(()=>{
    const incoming=takeFiles(tool.slug);
    if(incoming.length){if(compare)setSlots([incoming[0]??null,incoming[1]??null]);else setList(incoming)}
    return ()=>{urls.current.forEach(u=>URL.revokeObjectURL(u))};
  },[tool.slug,compare]);
  useEffect(()=>{if(focusChoose.current&&!files.length){focusChoose.current=false;chooseButton.current?.focus()}},[files.length]);

  async function select(received:File[]){
    if(!received.length||running.current)return;
    const id=++selection.current,slot=slotTarget.current;slotTarget.current=null;
    setChecking(true);setError('');setHint('');
    try{
      let nextSlots=slots,current:File[],added:File[];
      if(compare){
        nextSlots=[...slots];
        if(slot!==null)nextSlots[slot]=received[0];
        else for(const file of received){const free=nextSlots.findIndex(f=>!f);if(free<0)break;nextSlots[free]=file}
        added=nextSlots.filter((f):f is File=>!!f&&!slots.includes(f));
        if(!added.length)throw Error('Compare PDFs uses two files. Remove one before adding another.');
        current=nextSlots.filter((f):f is File=>!!f);
      }else{current=tool.multi?[...list,...received]:received.slice(0,1);added=received}
      const allowed=tool.accept.split(',');
      if(current.length>12)throw Error('Select 12 files or fewer.');
      if(current.some(f=>!allowed.includes('.'+f.name.split('.').pop()?.toLowerCase())))throw Error('Choose a supported format: '+tool.accept);
      if(current.some(f=>!f.size||f.size>15*1048576)||current.reduce((n,f)=>n+f.size,0)>45*1048576)throw Error('Use nonempty files up to 15 MB each and 45 MB in total.');
      for(const file of added.slice(0,tool.multi?undefined:1))await validateInput(file);
      if(id===selection.current){resetResults();if(compare)setSlots(nextSlots);else setList(current)}
    }catch(e){if(id===selection.current)setError((e as Error).message)}finally{if(id===selection.current)setChecking(false)}
  }
  function browse(slot:number|null=null){if(busy||checking)return;slotTarget.current=slot;input.current?.click()}
  function move(from:number,to:number){if(to<0||to>=list.length||from===to)return;resetResults();setError('');setList(prev=>{const next=[...prev];const [item]=next.splice(from,1);next.splice(to,0,item);return next})}
  function remove(index:number){resetResults();setError('');if(compare)setSlots(prev=>prev.map((f,n)=>n===index?null:f));else setList(prev=>prev.filter((_,n)=>n!==index))}
  function reset(){selection.current++;setChecking(false);setList([]);setSlots([null,null]);setError('');setHint('');setOutputName('');resetResults();focusChoose.current=true}
  function again(){resetResults();setError('')}
  async function process(){
    if(running.current||checking)return;
    if(!files.length){setHint('Add a file first.');return}
    if(TWO_FILES.includes(tool.slug)&&files.length<2){setError('Select at least two files.');return}
    const measure=beginToolAnalytics(tool.slug);running.current=true;setBusy(true);setError('');setHint('');resetResults();
    try{
      const outputs:ProcessedFile[]=await processFile(tool.slug,files,options);
      if(!outputs.length||outputs.some(x=>!x.blob.size))throw Error('No usable output was produced.');
      const cleaned=outputName.trim().replace(/[^a-zA-Z0-9_.-]/g,'_').replace(/\.[^.]+$/,'').slice(0,75);
      const items=outputs.map(x=>({name:cleaned&&outputs.length===1?cleaned+'.'+x.name.split('.').pop():x.name,size:x.blob.size,url:URL.createObjectURL(x.blob),blob:x.blob}));
      urls.current=items.map(x=>x.url);setResults(items);measure('completed');
      void fetch('/api/activity',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({tool:tool.slug,status:'completed'})}).catch(()=>{});
    }catch(e){measure('failed');setError(e instanceof Error?e.message:'This file could not be processed.')}finally{running.current=false;setBusy(false)}
  }
  // Adjusting the options (or the files) answers an error, so the button goes back to "Process N files".
  const changeOption=(key:string,value:string)=>{resetResults();setError('');setOptions(prev=>({...prev,[key]:value}))};

  const disabled=busy||checking,done=results.length>0,count=files.length,noun=tool.multi?'files':'file';
  const mode:ActionMode=busy?{kind:'busy',label:'Processing…'}
    :done?{kind:'download',href:results[0].url,filename:results[0].name,label:results[0].name.endsWith('.zip')?'Download ZIP':'Download'}
    :checking?{kind:'busy',label:'Checking files…'}
    :error&&count?{kind:'retry',label:'Try again'}
    :{kind:'idle',label:count?`Process ${count} ${count===1?'file':'files'}`:'Process files',unavailable:!count};

  const header=done
    ?<><strong><CheckCircle2 size={16} color="#15803d" aria-hidden="true" style={{verticalAlign:'-3px',marginRight:6}}/>Result</strong><span className={styles.links}><button type="button" className={styles.linkButton} onClick={again}>Change options</button><button type="button" className={styles.linkButton} onClick={reset}>Start over</button></span></>
    :<><strong>{compare?'Files to compare':'Your files'} ({count})</strong><span className={styles.links}>{!tool.multi&&<button type="button" className={styles.linkButton} disabled={disabled} onClick={()=>browse()}>Replace file</button>}<button type="button" className={styles.linkButton} disabled={disabled||!count} onClick={reset}>Clear all</button></span></>;

  const message=<>
    {checking&&<p role="status" className={styles.checking}><Loader2 size={16} className={styles.spin} aria-hidden="true"/> Checking file contents…</p>}
    {error&&<div role="alert" className={styles.alert}><TriangleAlert size={17} aria-hidden="true"/><span>{error} Adjust the input or options and try again.</span></div>}
  </>;

  const filesView=compare
    ?<div className={styles.slots}>{SLOT_LABELS.map((label,slot)=>{const file=slots[slot];return <div className={styles.slot} key={label}><span>{label}</span>
      {file
        ?<ul className={styles.grid} style={{gridTemplateColumns:'minmax(0,1fr)'}}><FileCard file={file} index={slot} total={count} ordered={false} disabled={disabled} onRemove={()=>remove(slot)} onMove={move}/></ul>
        :<div className={styles.slotEmpty}><p style={{margin:0}}>Add the {label.toLowerCase()}</p><button type="button" className={styles.primaryButton} disabled={disabled} onClick={()=>browse(slot)}>Choose {label.toLowerCase()}</button></div>}
    </div>})}</div>
    :<ul className={styles.grid} aria-label="Selected files">
      {list.map((file,i)=><FileCard key={i+'-'+file.name+'-'+file.lastModified+'-'+file.size} file={file} index={i} total={count} ordered={ordered} disabled={disabled} onRemove={()=>remove(i)} onMove={move}/>)}
      {tool.multi&&<li style={{listStyle:'none'}}><button type="button" className={styles.addTile} disabled={disabled} onClick={()=>browse()}><Plus size={26} aria-hidden="true"/>Add files</button></li>}
    </ul>;

  const box=<InlineDropzone label={tool.name+' files'} loaded={compare||count>0} disabled={disabled} onFiles={received=>void select(received)} onBrowse={()=>browse()}
    header={header} message={message}
    overlay={busy&&<div className={styles.overlay}><Loader2 size={26} className={styles.spin} aria-hidden="true"/>Processing on your device…<span className={styles.progress} aria-hidden="true"><i/></span></div>}
    empty={{title:`Drop your ${noun} here`,types:tool.accept.replaceAll(',',', '),limits:LIMITS,button:'Choose '+noun,buttonRef:chooseButton}}>
    {done?<ResultPreview slug={tool.slug} inputs={files} results={results}/>:filesView}
  </InlineDropzone>;

  const panel=<OptionsPanel title="Options">
    {tool.controls.map(c=><label key={c.key} className={styles.field}><span>{c.label}</span>
      {c.kind==='select'
        ?<select disabled={disabled} value={options[c.key]} onChange={e=>changeOption(c.key,e.target.value)}>{c.values?.map(v=><option key={v}>{v}</option>)}</select>
        :<input type={c.kind==='number'?'number':c.kind==='password'?'password':'text'} autoComplete="off" disabled={disabled} value={options[c.key]} onChange={e=>changeOption(c.key,e.target.value)}/>}
    </label>)}
    <label className={styles.field}><span>Output filename (optional)</span><input maxLength={75} disabled={disabled} placeholder="Let Editgoo name it" value={outputName} onChange={e=>{resetResults();setError('');setOutputName(e.target.value)}}/></label>
  </OptionsPanel>;

  const action=done
    ?<div className={'results-box '+styles.done} role="status">
      <ActionButton mode={mode}/>
      <p className={styles.ready}><CheckCircle2 size={17} aria-hidden="true"/>Your {results.length===1?'file is':'files are'} ready.</p>
      <p className={styles.actionMeta}><b>{results[0].name}</b> · {niceSize(results[0].size)}</p>
      {results.slice(1).map(r=><a key={r.url} className={styles.linkButton} href={r.url} download={r.name}>Download {r.name} ({niceSize(r.size)})</a>)}
      <div className={styles.actionLinks}><button type="button" className={styles.linkButton} onClick={again}>Process again</button><button type="button" className={styles.linkButton} onClick={reset}>Process another file</button></div>
    </div>
    :<><ActionButton mode={mode} onAction={process}/><p className={styles.hint} aria-live="polite">{hint}</p></>;

  return <>
    <input ref={input} hidden type="file" accept={tool.accept} multiple={tool.multi} onChange={e=>{void select(Array.from(e.target.files??[]));e.target.value=''}}/>
    <ToolWorkspace box={box} panel={panel} action={action}/>
  </>;
}
