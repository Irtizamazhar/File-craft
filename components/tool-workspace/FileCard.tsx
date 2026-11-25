'use client';
import {useState,type DragEvent} from 'react';
import {ArrowLeft,ArrowRight,X} from 'lucide-react';
import FileThumbnail,{niceSize} from './FileThumbnail';
import styles from './workspace.module.css';

const ORDER_TYPE='application/x-editgoo-order';

/** One file inside the box: thumbnail, name, size, remove, and (for ordered tools) position, move and drag-to-reorder. */
export default function FileCard({file,index,total,ordered,disabled,onRemove,onMove}:{
  file:File;index:number;total:number;ordered:boolean;disabled:boolean;onRemove:()=>void;onMove:(from:number,to:number)=>void;
}){
  const [over,setOver]=useState(false);
  const reorder=ordered&&total>1&&!disabled;
  const drag=reorder?{
    draggable:true,
    onDragStart:(e:DragEvent)=>{e.dataTransfer.setData(ORDER_TYPE,String(index));e.dataTransfer.effectAllowed='move'},
    onDragOver:(e:DragEvent)=>{if(e.dataTransfer.types.includes(ORDER_TYPE)){e.preventDefault();e.stopPropagation();setOver(true)}},
    onDragLeave:()=>setOver(false),
    onDrop:(e:DragEvent)=>{const from=e.dataTransfer.getData(ORDER_TYPE);setOver(false);if(from===''){return}e.preventDefault();e.stopPropagation();onMove(Number(from),index)},
  }:{};
  return <li className={styles.card+(over?' '+styles.dragOver:'')} {...drag}>
    {ordered&&total>1&&<span className={styles.order} aria-hidden="true">{index+1}</span>}
    <div className={styles.cardActions}>
      {ordered&&total>1&&<>
        <button type="button" className={styles.iconButton} aria-label={`Move ${file.name} earlier`} disabled={disabled||index===0} onClick={()=>onMove(index,index-1)}><ArrowLeft size={15}/></button>
        <button type="button" className={styles.iconButton} aria-label={`Move ${file.name} later`} disabled={disabled||index===total-1} onClick={()=>onMove(index,index+1)}><ArrowRight size={15}/></button>
      </>}
      <button type="button" className={styles.iconButton} aria-label={`Remove file ${file.name}`} disabled={disabled} onClick={onRemove}><X size={16}/></button>
    </div>
    <FileThumbnail file={file} name={file.name}/>
    <div className={styles.cardInfo}>
      {ordered&&total>1&&<span className={styles.srOnly}>File {index+1}: </span>}
      <span className={styles.cardName} title={file.name}>{file.name}</span>
      <span className={styles.cardMeta}>{niceSize(file.size)}</span>
    </div>
  </li>;
}
