'use client';
import {useRef,useState,DragEvent} from 'react';
import Link from 'next/link';
import {CloudUpload,File,ArrowRight,Check,FolderOpen,ShieldCheck} from 'lucide-react';
export default function HeroUpload(){
 const input=useRef<HTMLInputElement>(null);const [name,setName]=useState('');const [isDrag,setDrag]=useState(false);
 const onFile=(f?:File)=>{if(f)setName(f.name)};
 const extension=name.split('.').pop()?.toLowerCase();
 const choices=extension==='pdf'?[['Merge PDF','merge-pdf'],['Compress PDF','compress-pdf'],['PDF to Word','pdf-to-word']]:['docx'].includes(extension||'')?[['Word to PDF','docx-to-pdf']]:['xlsx'].includes(extension||'')?[['Excel to PDF','xlsx-to-pdf']]:['jpg','jpeg','png','webp'].includes(extension||'')?[['Image to PDF','image-to-pdf'],['Resize image','resize-image']]:[['Browse tools','']];
 return <div className={'hero-drop '+(isDrag?'dragging':'')} onDragOver={(e:DragEvent)=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)} onDrop={(e:DragEvent)=>{e.preventDefault();setDrag(false);onFile(e.dataTransfer.files[0])}}>
 <div className="drop-symbol"><CloudUpload size={30}/></div>
 {name?<><strong className="upload-selected"><File size={17}/>{name}</strong><span className="drop-subtitle">Choose a tool below, then upload your file to process it.</span><div className="file-suggestions">{choices.map(([text,slug])=><Link key={text} className="suggestion-chip" href={slug?'/tools/'+slug:'/tools'}>{text}<ArrowRight size={14}/></Link>)}</div></>:<><strong>Drop your files here</strong><span className="drop-subtitle">or click to explore your files</span><button type="button" className="btn btn-primary big-upload" onClick={()=>input.current?.click()}>Select a file <ArrowRight size={16}/></button><small>PDF, DOCX, XLSX, PPTX & images</small></>}
 <input type="file" ref={input} hidden accept=".pdf,.docx,.xlsx,.pptx,.jpg,.jpeg,.png,.webp" onChange={e=>onFile(e.target.files?.[0])}/>
 <div className="drop-footer"><span><ShieldCheck size={14}/> On-device processing</span><span><Check size={14}/> No account required for basic tools</span></div>
 </div>;
}
