'use client';
import {useEffect,useState,type ReactNode} from 'react';
import {CheckCircle2,Download,Loader2,Plus,TriangleAlert,X} from 'lucide-react';
import ToolWorkspace,{OptionsPanel} from './ToolWorkspace';
import InlineDropzone from './InlineDropzone';
import FileThumbnail from './FileThumbnail';
import ActionButton,{type ActionMode} from './ActionButton';
import styles from './workspace.module.css';

type CompressItem={id:string;file:File;status:'ready'|'working'|'done'|'error';error?:string;url?:string;name?:string;size?:number;blob?:Blob};

/**
 * One-step layout for File Compressor. It only arranges state and elements from components/FileCompressor.tsx (same
 * selection rules, compression calls, per-file modes and batch ZIP): each file and its result is a card inside the box,
 * the per-file modes sit in the right panel, and Compress files → Processing files... → Download (several files:
 * Prepare batch ZIP → Download batch ZIP) share the one action button. Every card keeps its own download link.
 */
export default function CompressorWorkspace<T extends CompressItem>(p:{
  items:T[];busy:boolean;error:string;batch:string;
  mainInput:ReactNode;notice:ReactNode;footnote:ReactNode;
  modeSelect:(item:T,className:string)=>ReactNode;formatSize:(n:number)=>string;
  select:(files:File[])=>void;run:()=>unknown;zip:()=>unknown;removeItem:(item:T)=>void;clearFiles:()=>void;browse:()=>void;
}){
  const [hint,setHint]=useState('');
  const {items,busy}=p,count=items.length;
  useEffect(()=>{if(count)setHint('')},[count]);
  const allDone=count>0&&items.every(i=>i.status==='done'),withResult=items.filter(i=>i.blob).length;
  const single=allDone&&count===1?items[0]:null;
  const mode:ActionMode=busy?{kind:'busy',label:'Processing files...'}
    :single?{kind:'download',href:single.url!,filename:single.name!,label:'Download'}
    :allDone&&p.batch?{kind:'download',href:p.batch,filename:'editgoo-compressed.zip',label:'Download batch ZIP',announceFilename:false}
    :allDone?{kind:'idle',label:'Prepare batch ZIP'}
    :{kind:'idle',label:'Compress files',unavailable:!count};
  function act(){
    if(!count){setHint('Add a file first.');return}
    setHint('');
    if(allDone)void p.zip();else void p.run();
  }

  const box=<InlineDropzone label="File Compressor files" loaded={count>0} disabled={busy} onFiles={files=>p.select(files)} onBrowse={p.browse}
    header={<><strong>Your files ({count})</strong><span className={styles.links}><button type="button" className={styles.linkButton} disabled={busy} onClick={p.clearFiles}>Clear files</button></span></>}
    message={p.error&&<div role="alert" className={styles.alert}><TriangleAlert size={17} aria-hidden="true"/><span>{p.error}</span></div>}
    empty={{title:'Smaller files. Clear choices.',types:'PDF, JPG, PNG, WebP, DOCX, XLSX, PPTX and ZIP',button:'Select files',limits:'15 MB per file · 45 MB per task · up to 12 files'}}>
    <ul className={styles.grid} aria-label="Selected files">
      {items.map(item=><li key={item.id} className={'compressor-item '+styles.card+' '+styles.compressCard}>
        <FileThumbnail file={item.file} name={item.file.name}/>
        <div className={styles.cardActions}><button type="button" className={styles.iconButton} aria-label={'Remove '+item.file.name} disabled={busy} onClick={()=>p.removeItem(item)}><X size={15} aria-hidden="true"/></button></div>
        <div className={styles.cardInfo}>
          <span className={styles.cardName} title={item.file.name}>{item.file.name}</span>
          <span className={styles.cardMeta}>{p.formatSize(item.file.size)}{item.size!==undefined&&<> → <b>{p.formatSize(item.size)}</b></>}</span>
          {item.size!==undefined&&<span className={styles.cardSaving}><CheckCircle2 size={14} aria-hidden="true"/>{((1-item.size/item.file.size)*100).toFixed(1)}% smaller</span>}
          {item.status==='working'&&<p role="status" className={styles.cardStatus}><Loader2 size={14} className={styles.spin} aria-hidden="true"/> Processing this file on your device...</p>}
          {item.error&&<p role="alert" className={styles.cardError}>{item.error}</p>}
          {item.url&&<a className={styles.cardDownload} href={item.url} download={item.name}><Download size={14} aria-hidden="true"/>Download<span className={styles.srOnly}> {item.name}</span></a>}
        </div>
      </li>)}
      <li style={{listStyle:'none'}}><button type="button" className={styles.addTile} disabled={busy} onClick={p.browse}><Plus size={26} aria-hidden="true"/>Add files</button></li>
    </ul>
  </InlineDropzone>;

  const panel=<OptionsPanel title="Options">
    {count?items.map(item=><div key={item.id}>{p.modeSelect(item,styles.field)}</div>):<p className={styles.help}>Add files to choose how each one is compressed.</p>}
    <div className={styles.panelStack}>{p.notice}{p.footnote}</div>
  </OptionsPanel>;

  const action=<>
    <ActionButton mode={mode} onAction={act}/>
    {allDone&&<p className={styles.ready} role="status"><CheckCircle2 size={17} aria-hidden="true"/>{count===1?'Your file is ready.':'Your files are ready.'}</p>}
    {single&&<p className={styles.actionMeta}><b>{single.name}</b> · {p.formatSize(single.size!)}</p>}
    {!allDone&&(withResult>1||!!p.batch)&&<div className={styles.actionLinks}>
      {withResult>1&&<button type="button" className={styles.linkButton} disabled={busy} onClick={()=>void p.zip()}>Prepare batch ZIP</button>}
      {p.batch&&<a className={styles.linkButton} href={p.batch} download="editgoo-compressed.zip">Download batch ZIP</a>}
    </div>}
    <p className={styles.hint} aria-live="polite">{hint}</p>
  </>;

  return <>{p.mainInput}<ToolWorkspace box={box} panel={panel} action={action}/></>;
}
