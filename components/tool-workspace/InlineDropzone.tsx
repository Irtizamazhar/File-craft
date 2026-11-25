'use client';
import {useEffect,useRef,useState,type ReactNode,type Ref} from 'react';
import {CloudUpload} from 'lucide-react';
import styles from './workspace.module.css';

/**
 * The left box of the workspace. Empty: a drop target with a "Choose" button. Loaded: whatever the tool shows
 * (file cards, an editor canvas or the result) inside the same box. Drag-and-drop works on the whole box in every
 * state, and Ctrl+V pastes files while the workspace is on screen. The tool owns the single hidden file input.
 */
export default function InlineDropzone({label,loaded,disabled,onFiles,onBrowse,header,children,message,overlay,empty,acceptPaste=true}:{
  label:string;loaded:boolean;disabled:boolean;onFiles:(files:File[])=>void;onBrowse:()=>void;
  header?:ReactNode;children?:ReactNode;message?:ReactNode;overlay?:ReactNode;acceptPaste?:boolean;
  empty:{title:string;types:string;limits?:string;button:string;buttonRef?:Ref<HTMLButtonElement>;extra?:ReactNode};
}){
  const [dragging,setDragging]=useState(false);
  const box=useRef<HTMLElement>(null);
  const latest=useRef({onFiles,disabled});
  latest.current={onFiles,disabled};

  useEffect(()=>{
    if(!acceptPaste)return;
    function paste(event:ClipboardEvent){
      const files=Array.from(event.clipboardData?.files??[]);
      if(!files.length||latest.current.disabled)return;
      event.preventDefault();
      latest.current.onFiles(files);
    }
    document.addEventListener('paste',paste);
    return ()=>document.removeEventListener('paste',paste);
  },[acceptPaste]);

  const hasFiles=(types:readonly string[])=>types.includes('Files');
  return <section ref={box} aria-label={label} className={styles.box+(loaded?' '+styles.loaded:'')+(dragging?' '+styles.dragging:'')}
    onDragEnter={e=>{if(hasFiles(e.dataTransfer.types)&&!disabled){e.preventDefault();setDragging(true)}}}
    onDragOver={e=>{if(hasFiles(e.dataTransfer.types)&&!disabled){e.preventDefault();e.dataTransfer.dropEffect='copy'}}}
    onDragLeave={e=>{if(!box.current?.contains(e.relatedTarget as Node|null))setDragging(false)}}
    onDrop={e=>{if(!hasFiles(e.dataTransfer.types))return;e.preventDefault();setDragging(false);if(!disabled&&e.dataTransfer.files.length)onFiles(Array.from(e.dataTransfer.files))}}>
    {loaded&&header&&<div className={styles.boxHeader}>{header}</div>}
    {message}
    {loaded
      ?<div className={styles.boxBody}>{children}</div>
      :<div className={styles.empty} onClick={e=>{if(!disabled&&!(e.target as HTMLElement).closest('button,a,input,label,select'))onBrowse()}}>
        <CloudUpload className={styles.uploadIcon} size={46} aria-hidden="true"/>
        <h2>{empty.title}</h2>
        <p className={styles.types}>{empty.types}</p>
        <button type="button" ref={empty.buttonRef} className={styles.primaryButton} disabled={disabled} onClick={onBrowse}>{empty.button}</button>
        {empty.limits&&<p className={styles.limits}>{empty.limits}</p>}
        {acceptPaste&&<p className={styles.limits}>Drag files here, or paste with Ctrl+V</p>}
        {empty.extra}
      </div>}
    {overlay}
  </section>;
}
