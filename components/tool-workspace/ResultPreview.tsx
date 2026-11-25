'use client';
import {useEffect,useState} from 'react';
import Image from 'next/image';
import {CheckCircle2} from 'lucide-react';
import {extensionOf,isImageName,niceSize,TypeIcon} from './FileThumbnail';
import {pdfThumbnail} from './pdf-thumbnail';
import styles from './workspace.module.css';

export type ResultFile={name:string;size:number;url:string;blob:Blob};

/** Tools whose purpose is a smaller file: their result leads with the before → after size. */
const SIZE_TOOLS=new Set(['compress-pdf','compress-image']);

function useObjectUrl(blob:Blob|undefined){
  const [url,setUrl]=useState('');
  useEffect(()=>{if(!blob)return;const value=URL.createObjectURL(blob);setUrl(value);return ()=>{URL.revokeObjectURL(value);setUrl('')}},[blob]);
  return url;
}

function ImageFrame({title,blob,checker}:{title:string;blob:Blob;checker?:boolean}){
  const url=useObjectUrl(blob);const [size,setSize]=useState<[number,number]|null>(null);
  return <div className={styles.frame}><span>{title}{size?` · ${size[0]} × ${size[1]} px`:''}</span>
    <div className={styles.view+(checker?' '+styles.checker:'')}>{url&&<Image unoptimized src={url} width={size?.[0]??400} height={size?.[1]??300} alt={title+' image'} onLoad={e=>{const img=e.currentTarget;setSize([img.naturalWidth,img.naturalHeight])}}/>}</div>
  </div>;
}

function PdfFrame({title,blob,name,onPages}:{title:string;blob:Blob;name:string;onPages?:(pages:number)=>void}){
  const [thumb,setThumb]=useState<{src:string;width:number;height:number;pages:number}|null>(null);
  useEffect(()=>{let active=true;pdfThumbnail(blob,560).then(t=>{if(active){setThumb(t);onPages?.(t.pages)}}).catch(()=>{});return ()=>{active=false}},[blob,onPages]);
  return <div className={styles.frame}><span>{title}{thumb?` · ${thumb.pages===1?'1 page':thumb.pages+' pages'}`:''}</span>
    <div className={styles.view}>{thumb?<Image unoptimized src={thumb.src} width={thumb.width} height={thumb.height} alt={'First page of '+name}/>:<TypeIcon name={name} size={56}/>}</div>
  </div>;
}

type ZipEntry={name:string;url?:string;pdf?:Blob};
function ZipContents({blob}:{blob:Blob}){
  const [entries,setEntries]=useState<{items:ZipEntry[];total:number}|null>(null);
  useEffect(()=>{
    let active=true;const urls:string[]=[];
    (async()=>{
      const {default:JSZip}=await import('jszip');
      const zip=await JSZip.loadAsync(blob);
      const files=Object.values(zip.files).filter(f=>!f.dir);
      const items:ZipEntry[]=[];
      for(const file of files.slice(0,12)){
        if(isImageName(file.name)){const url=URL.createObjectURL(await file.async('blob'));urls.push(url);items.push({name:file.name,url})}
        else if(extensionOf(file.name)==='pdf')items.push({name:file.name,pdf:new Blob([await file.async('arraybuffer')],{type:'application/pdf'})});
        else items.push({name:file.name});
      }
      if(active)setEntries({items,total:files.length});
    })().catch(()=>{if(active)setEntries({items:[],total:0})});
    return ()=>{active=false;urls.forEach(u=>URL.revokeObjectURL(u))};
  },[blob]);
  if(!entries)return <p className={styles.facts}>Reading the ZIP contents…</p>;
  return <div className={styles.zipGrid} aria-label="Files inside the ZIP">
    {entries.items.map(item=><div className={styles.zipItem} key={item.name}>
      <div className={styles.thumb}>{item.url?<Image unoptimized src={item.url} width={160} height={120} alt={item.name}/>:item.pdf?<ZipPdf blob={item.pdf} name={item.name}/>:<TypeIcon name={item.name} size={34}/>}</div>
      <small title={item.name}>{item.name}</small>
    </div>)}
    {entries.total>entries.items.length&&<div className={styles.more}>+{entries.total-entries.items.length} more</div>}
  </div>;
}
function ZipPdf({blob,name}:{blob:Blob;name:string}){
  const [src,setSrc]=useState<{src:string;width:number;height:number}|null>(null);
  useEffect(()=>{let active=true;pdfThumbnail(blob,200).then(t=>{if(active)setSrc(t)}).catch(()=>{});return ()=>{active=false}},[blob]);
  return src?<Image unoptimized src={src.src} width={src.width} height={src.height} alt={'First page of '+name}/>:<TypeIcon name={name} size={34}/>;
}

function TextSnippet({blob}:{blob:Blob}){
  const [text,setText]=useState('');
  useEffect(()=>{let active=true;blob.slice(0,20000).text().then(t=>{if(active)setText(t)}).catch(()=>{});return ()=>{active=false}},[blob]);
  return <pre className={styles.snippet} tabIndex={0} aria-label="Result text preview">{text}{blob.size>20000?'\n…':''}</pre>;
}

/** The result, shown inside the same box the files were dropped into. */
export default function ResultPreview({slug,inputs,results}:{slug:string;inputs:File[];results:ResultFile[]}){
  const main=results[0],ext=extensionOf(main.name);
  const inputSize=inputs.reduce((n,f)=>n+f.size,0),outputSize=results.reduce((n,r)=>n+r.size,0);
  const saving=SIZE_TOOLS.has(slug)
    ?(outputSize<inputSize
      ?<p className={styles.saving}><CheckCircle2 size={18} aria-hidden="true"/>Before {niceSize(inputSize)} → After {niceSize(outputSize)} (−{Math.round((1-outputSize/inputSize)*100)}%)</p>
      :<p className={styles.saving+' '+styles.none}>Before {niceSize(inputSize)} → After {niceSize(outputSize)}: this file could not be made smaller.</p>)
    :null;
  const facts=<p className={styles.facts}><span>Input <b>{niceSize(inputSize)}</b></span><span>Output <b>{niceSize(outputSize)}</b></span>{results.length>1&&<span><b>{results.length}</b> files</span>}</p>;
  const firstImage=inputs.find(f=>isImageName(f.name));
  let stage;
  if(ext==='pdf')stage=<div className={styles.resultStage}><PdfFrame title="Result" blob={main.blob} name={main.name}/></div>;
  else if(isImageName(main.name))stage=<div className={styles.resultStage+(firstImage?' '+styles.pair:'')}>
    {firstImage&&<ImageFrame title="Before" blob={firstImage}/>}<ImageFrame title="After" blob={main.blob} checker/>
  </div>;
  else if(ext==='zip')stage=<ZipContents blob={main.blob}/>;
  else if(['txt','csv','html','htm'].includes(ext))stage=<TextSnippet blob={main.blob}/>;
  else stage=<div className={styles.docCard}><TypeIcon name={main.name} size={46}/><div><strong>{main.name}</strong><small>{niceSize(main.size)} · open it in Word, Excel or PowerPoint to review.</small></div></div>;
  return <div className={styles.result}>{saving}{stage}{facts}</div>;
}
