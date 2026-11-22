import {useEffect,useState} from 'react';
import Image from 'next/image';
import {previewPdf} from '@/lib/browser-engine';

export default function PdfInputPreview({file}:{file:File}){
  const [open,setOpen]=useState(false);
  const [preview,setPreview]=useState<{src:string;width:number;height:number}>();
  const [failed,setFailed]=useState(false);

  useEffect(()=>{
    if(!open||preview||failed)return;
    let active=true;
    previewPdf(file).then(image=>{if(active)setPreview(image)}).catch(()=>{if(active)setFailed(true)});
    return ()=>{active=false};
  },[file,open,preview,failed]);

  return <details className="pdf-input-preview" onToggle={event=>setOpen(event.currentTarget.open)}>
    <summary>Preview first page of {file.name}</summary>
    {open&&(preview?<Image unoptimized {...preview} alt={'First page of '+file.name}/>:<p role="status">{failed?'A preview is unavailable for this PDF.':'Preparing preview…'}</p>)}
  </details>;
}
