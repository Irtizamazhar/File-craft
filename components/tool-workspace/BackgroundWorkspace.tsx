'use client';
import {useEffect,useState,type ReactNode} from 'react';
import {Loader2} from 'lucide-react';
import ToolWorkspace,{OptionsPanel} from './ToolWorkspace';
import InlineDropzone from './InlineDropzone';
import ActionButton,{type ActionMode} from './ActionButton';
import styles from './workspace.module.css';

type Editor={originalPane:ReactNode;previewPane:ReactNode;refineTools:ReactNode;formatControls:ReactNode};

/**
 * One-step layout for Remove Background. It only arranges elements built by components/BackgroundRemover.tsx
 * (same state, handlers, worker and export code): the image and the editing canvas live in the box, the model choice
 * and refine tools in the right panel, and Remove background → Export → Download share the one action button.
 */
export default function BackgroundWorkspace(p:{
  state:{segmented?:boolean}|null;busy:boolean;result:string;format:string;formatLabel:string;
  mainInput:ReactNode;modelSelect:ReactNode;errorBox:ReactNode;cancelButton:ReactNode;historyButtons:ReactNode;zoomControls:ReactNode;status:ReactNode;
  editor:Editor|null|false;segment:()=>unknown;download:()=>unknown;select:(file?:File)=>unknown;browse:()=>void;
}){
  const [hint,setHint]=useState('');
  // An export belongs to the cutout it was made from: after any further edit the button offers Export again,
  // never a download of the older file.
  const [exported,setExported]=useState<{url:string;state:object|null}|null>(null);
  useEffect(()=>{setExported(p.result?{url:p.result,state:p.state}:null)},[p.result]);// eslint-disable-line react-hooks/exhaustive-deps
  const fresh=!!p.result&&exported?.url===p.result&&exported.state===p.state;
  const loaded=!!p.state,done=!!p.state?.segmented;
  useEffect(()=>{if(loaded)setHint('')},[loaded]);
  const mode:ActionMode=p.busy?{kind:'busy',label:'Working...'}
    :!loaded?{kind:'idle',label:'Remove background',unavailable:true}
    :!done?{kind:'idle',label:'Remove background'}
    :fresh?{kind:'download',href:p.result,filename:'editgoo-cutout.'+p.format,label:'Download '+p.formatLabel,announceFilename:false}
    :{kind:'idle',label:'Export '+p.formatLabel};
  function act(){
    if(!loaded){setHint('Add an image first.');return}
    setHint('');
    if(!done)void p.segment();else void p.download();
  }
  const box=<InlineDropzone label="Remove Background image" loaded={loaded} disabled={p.busy} acceptPaste={false} className={styles.editorBox}
    onFiles={files=>void p.select(files[0])} onBrowse={p.browse}
    header={<><strong>{done?'Cutout':'Your image'}</strong><span className={styles.links}><span className={'editor-toolbar '+styles.bgToolbar}>{p.historyButtons}{p.zoomControls}</span><button type="button" className={styles.linkButton} disabled={p.busy} onClick={p.browse}>Choose another image</button></span></>}
    message={p.errorBox}
    overlay={p.busy&&<div className={styles.overlay} aria-hidden="true"><Loader2 size={26} className={styles.spin}/>Removing the background…<span className={styles.progress}><i/></span></div>}
    empty={{title:'Make room for your subject.',types:'JPG, PNG or WebP · up to 15 MB',button:'Select image',limits:'Drag an image here, or paste with Ctrl+V'}}>
    {p.editor&&<div className={styles.bgPanes+(done?' '+styles.bgDone:'')}>{p.editor.originalPane}{p.editor.previewPane}</div>}
  </InlineDropzone>;
  const panel=<OptionsPanel title={done?'Edit your cutout':'Settings'}>
    <div className={styles.panelStatus+(done&&!p.busy?' '+styles.statusQuiet:'')}>{p.status}</div>
    {!done&&loaded&&<div className={'editor-properties '+styles.panelStack}>{p.modelSelect}</div>}
    {done&&p.editor&&<div className={'editor-properties '+styles.panelStack}>{p.editor.refineTools}{p.editor.formatControls}</div>}
  </OptionsPanel>;
  const action=<>
    <ActionButton mode={mode} onAction={act}/>
    {p.busy&&<div className={styles.actionLinks}>{p.cancelButton}</div>}
    {done&&fresh&&<>
      <p className={styles.actionMeta}><b>editgoo-cutout.{p.format}</b> is ready.</p>
      <div className={styles.actionLinks}><button type="button" className={styles.linkButton} disabled={p.busy} onClick={()=>void p.download()}>Export {p.formatLabel}</button></div>
    </>}
    <p className={styles.hint} aria-live="polite">{hint}</p>
  </>;
  return <>{p.mainInput}<ToolWorkspace box={box} panel={panel} action={action}/></>;
}
