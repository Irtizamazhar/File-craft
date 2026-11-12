'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowRight,ArrowUp,ArrowDown,CheckCircle2,CloudUpload,Download,File,Loader2,LockKeyhole,ShieldCheck,TriangleAlert,X} from 'lucide-react';
import {processFile,type ProcessedFile} from '@/lib/browser-engine';
import type {Tool} from '@/lib/tools';
type Result={name:string;size:number;url:string};
const niceSize=(n:number)=>n>=1024*1024?(n/1048576).toFixed(2)+' MB':(n/1024).toFixed(1)+' KB';
export default function ToolProcessor({tool}:{tool:Tool}){
 const input=useRef<HTMLInputElement>(null);
 const resultsRef=useRef<string[]>([]);
 const [files,setFiles]=useState<File[]>([]);
 const [options,setOptions]=useState<Record<string,string>>(()=>Object.fromEntries(tool.controls.map(c=>[c.key,c.default])));
 const [drag,setDrag]=useState(false),[busy,setBusy]=useState(false);
 const [results,setResults]=useState<Result[]>([]),[error,setError]=useState('');
 const resetResults=()=>{resultsRef.current.forEach(u=>URL.revokeObjectURL(u));resultsRef.current=[];setResults([])};
 useEffect(()=>()=>{resultsRef.current.forEach(u=>URL.revokeObjectURL(u))},[]);
 const selectFiles=(received:FileList|null)=>{
  if(!received||busy)return;
  const allowed=tool.accept.toLowerCase().split(',').map(s=>s.trim());
  const current=tool.multi?[...files,...Array.from(received)]:Array.from(received).slice(0,1);
  if(current.length>12)return setError('Select 12 files or fewer.');
  if(current.some(f=>!allowed.includes('.'+f.name.split('.').pop()?.toLowerCase())))return setError('Unsupported file extension. Please select one of the listed formats.');
  if(current.some(f=>!f.size||f.size>15*1048576))return setError('Each file must be nonempty and at most 15 MB.');
  if(current.reduce((sum,f)=>sum+f.size,0)>45*1048576)return setError('Combined file size must be 45 MB or less.');
  resetResults();setFiles(current);setError('');
 };
 const moveFile=(index:number,shift:number)=>setFiles(prev=>{const next=[...prev],target=index+shift;if(target<0||target>=next.length)return prev;[next[index],next[target]]=[next[target],next[index]];return next});
 async function process(){
  if(!files.length)return setError('Choose a file first.');
  if(['merge-pdf','merge-docx','compare-pdf'].includes(tool.slug)&&files.length<2)return setError('Select at least two files.');
  setBusy(true);setError('');resetResults();
  try{
   // Operations run in the current browser tab; source files are not transmitted to the website.
   const outputs:ProcessedFile[]=await processFile(tool.slug,files,options);
   if(!outputs.length)throw new Error('No result was produced.');
   const items=outputs.map(x=>({name:x.name,size:x.blob.size,url:URL.createObjectURL(x.blob)}));
   resultsRef.current=items.map(x=>x.url);setResults(items);
   // Optional metadata-only user history. Files and passwords are never sent.
   fetch('/api/activity',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({tool:tool.slug,status:'completed'})}).catch(()=>{});
  }catch(e){setError(e instanceof Error?e.message:'This file could not be processed.');}
  finally{setBusy(false)}
 }
 return <div className="processor-card">
  <div className="processor-header"><div><span className="processor-index">PRIVATE BROWSER WORKSPACE</span><h2>Ready when you are.</h2><p>Process your files on your device.</p></div><span className="processor-lock"><LockKeyhole size={18}/></span></div>
  <div className={'tool-drop '+(drag?'dragging':'')} onDragOver={e=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);selectFiles(e.dataTransfer.files)}}>
   <span className="tool-drop-icon"><CloudUpload size={30}/></span><strong>Drag & drop your {tool.multi?'files':'file'} here</strong><p>Or select files from your device</p>
   <button type="button" className="btn btn-primary" disabled={busy} onClick={()=>input.current?.click()}>Choose {tool.multi?'files':'file'} <ArrowRight size={16}/></button>
   <small>Maximum 15 MB per file, 45 MB per task, 12 files</small>
   <input ref={input} hidden type="file" accept={tool.accept} multiple={tool.multi} onChange={e=>{selectFiles(e.target.files);e.target.value=''}}/>
  </div>
  {files.length>0&&<div className="selected-files"><div className="panel-label"><span>SELECTED FILES ({files.length})</span><button type="button" disabled={busy} onClick={()=>{setFiles([]);resetResults()}}>Clear all</button></div>
   {files.map((file,i)=><div className="selected-file" key={`${i}-${file.name}`}><span className="selected-file-icon"><File size={19}/></span><div><strong>{file.name}</strong><small>{niceSize(file.size)}</small></div>{tool.multi&&files.length>1&&<div className="file-order-buttons"><button type="button" aria-label={'Move '+file.name+' up'} disabled={busy||i===0} onClick={()=>moveFile(i,-1)}><ArrowUp size={16}/></button><button type="button" aria-label={'Move '+file.name+' down'} disabled={busy||i===files.length-1} onClick={()=>moveFile(i,1)}><ArrowDown size={16}/></button></div>}<button type="button" aria-label={'Remove '+file.name} disabled={busy} onClick={()=>{setFiles(prev=>prev.filter((_,index)=>index!==i));resetResults()}}><X size={17}/></button></div>)}
  </div>}
  {tool.controls.length>0&&<div className="tool-options"><div className="panel-label">OPTIONS</div><div className="options-grid">{tool.controls.map(control=><label key={control.key} className="option-field"><span>{control.label}</span>{control.kind==='select'?<select value={options[control.key]||''} disabled={busy} onChange={e=>setOptions({...options,[control.key]:e.target.value})}>{control.values?.map(v=><option key={v} value={v}>{v}</option>)}</select>:<input type={control.kind==='number'?'number':control.kind==='password'?'password':'text'} autoComplete="off" value={options[control.key]||''} disabled={busy} onChange={e=>setOptions({...options,[control.key]:e.target.value})}/>}</label>)}</div></div>}
  {tool.notice&&<p className="tool-notice"><TriangleAlert size={16}/>{tool.notice}</p>}
  {error&&<div className="error-box" role="alert"><TriangleAlert size={18}/><span>{error}</span></div>}
  {results.length>0&&<div className="results-box" role="status"><div className="results-intro"><CheckCircle2 size={23}/><div><strong>{results.length===1?'Your file is ready':'Your files are ready'}</strong><p>Review the downloaded file before using it for important work.</p></div></div>{results.map(r=><a key={r.url} className="btn btn-primary" href={r.url} download={r.name}><Download size={17}/>{r.name} ({niceSize(r.size)})</a>)}</div>}
  <button type="button" className="btn btn-dark process-button" onClick={process} disabled={busy||!files.length}>{busy?<><Loader2 size={18} className="spin"/> Processing on your device...</>:<>Process {files.length||''} {files.length===1?'file':'files'} <ArrowRight size={18}/></>}</button>
  <div className="tool-safety"><ShieldCheck size={16}/> Your document contents stay in your browser. Closing this tab discards the generated download link.</div>
 </div>
}
