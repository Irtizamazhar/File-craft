'use client';
import {useEffect,useState} from 'react';
import Image from 'next/image';
import {File as FileIcon,FileArchive,FileCode2,FileSpreadsheet,FileText,Presentation,type LucideIcon} from 'lucide-react';
import {pdfThumbnail} from './pdf-thumbnail';
import styles from './workspace.module.css';

export const extensionOf=(name:string)=>name.split('.').pop()?.toLowerCase()||'';
export const isImageName=(name:string)=>/^(jpe?g|png|webp|gif|bmp)$/.test(extensionOf(name));
export const niceSize=(n:number)=>n>=1048576?(n/1048576).toFixed(2)+' MB':(n/1024).toFixed(1)+' KB';

const ICONS:Record<string,{icon:LucideIcon;color:string}>={
  doc:{icon:FileText,color:'#2b579a'},docx:{icon:FileText,color:'#2b579a'},
  xls:{icon:FileSpreadsheet,color:'#217346'},xlsx:{icon:FileSpreadsheet,color:'#217346'},csv:{icon:FileSpreadsheet,color:'#217346'},
  ppt:{icon:Presentation,color:'#c4462a'},pptx:{icon:Presentation,color:'#c4462a'},
  txt:{icon:FileText,color:'#4b5563'},html:{icon:FileCode2,color:'#9a3412'},htm:{icon:FileCode2,color:'#9a3412'},
  zip:{icon:FileArchive,color:'#6d28d9'},pdf:{icon:FileText,color:'#c81e45'},
};

/** Type icon with extension badge: the fallback for every file that has no visual preview. */
export function TypeIcon({name,size=42}:{name:string;size?:number}){
  const ext=extensionOf(name),entry=ICONS[ext]??{icon:FileIcon,color:'#6b7280'},Icon=entry.icon;
  return <><Icon size={size} color={entry.color} strokeWidth={1.6} aria-hidden="true"/><span className={styles.ext}>{ext||'file'}</span></>;
}

type Preview={src:string;width:number;height:number;badge:string};

/** Thumbnail by type: PDF → first page (+ page count), image → the image (+ pixel size), anything else → type icon. */
export default function FileThumbnail({file,name}:{file:Blob;name:string}){
  const ext=extensionOf(name),image=isImageName(name);
  const [preview,setPreview]=useState<Preview|null>(null);
  useEffect(()=>{
    let active=true,url='';
    setPreview(null);
    if(ext==='pdf'){
      pdfThumbnail(file).then(t=>{if(active)setPreview({src:t.src,width:t.width,height:t.height,badge:t.pages===1?'1 page':t.pages+' pages'})}).catch(()=>{});
    }else if(image){
      url=URL.createObjectURL(file);
      const probe=new window.Image();
      probe.onload=()=>{if(active)setPreview({src:url,width:probe.naturalWidth,height:probe.naturalHeight,badge:probe.naturalWidth+' × '+probe.naturalHeight})};
      probe.src=url;
    }
    return ()=>{active=false;if(url)URL.revokeObjectURL(url)};
  },[file,ext,image]);
  return <div className={styles.thumb}>
    {preview
      ?<><Image unoptimized src={preview.src} width={preview.width} height={preview.height} alt={(ext==='pdf'?'First page of ':'Preview of ')+name}/><span className={styles.badge}>{preview.badge}</span></>
      :<TypeIcon name={name}/>}
  </div>;
}
