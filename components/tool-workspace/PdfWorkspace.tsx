'use client';
import {useEffect,useState,type ReactNode} from 'react';
import {Loader2,TriangleAlert} from 'lucide-react';
import ToolWorkspace,{OptionsPanel} from './ToolWorkspace';
import InlineDropzone from './InlineDropzone';
import ActionButton,{type ActionMode} from './ActionButton';
import styles from './workspace.module.css';

/**
 * One-step layout for Edit PDF. It only arranges elements built by components/PdfEditor.tsx (same state, handlers,
 * PDFium/PDF.js rendering and export code): the page strip and the editable page live in the box with the editing
 * tools in its header, the object properties in the right panel, and Export edited PDF → Download edited PDF share the
 * one action button. Any further edit clears the export, so the button offers Export again.
 */
export default function PdfWorkspace(p:{
  loaded:boolean;busy:boolean;previewBusy:boolean;error:string;result:string;exportReady:boolean;
  mainInput:ReactNode;imagePicker:ReactNode;notice:ReactNode;toolButtons:ReactNode;status:ReactNode;pageList:ReactNode;pageTools:ReactNode;pageView:ReactNode;
  noTextNotice:ReactNode;reviewButton:ReactNode;reviewText:ReactNode;propertyFields:ReactNode;
  upload:(file?:File)=>unknown;exportFile:()=>void;browse:()=>void;
}){
  const [hint,setHint]=useState('');
  useEffect(()=>{if(p.loaded)setHint('')},[p.loaded]);
  const mode:ActionMode=p.busy?{kind:'busy',label:'Reading PDF...'}
    :!p.loaded?{kind:'idle',label:'Export edited PDF',unavailable:true}
    :p.result?{kind:'download',href:p.result,filename:'editgoo-edited.pdf',label:'Download edited PDF',announceFilename:false}
    :{kind:'idle',label:'Export edited PDF',disabled:!p.exportReady};
  function act(){
    if(!p.loaded){setHint('Add a PDF first.');return}
    setHint('');
    p.exportFile();
  }

  // Ctrl+V opens a pasted PDF while the box is empty; once a document is open, pasting never replaces it.
  const box=<InlineDropzone label="Edit PDF document" loaded={p.loaded} disabled={p.busy} acceptPaste={!p.loaded} className={styles.editorBox}
    onFiles={files=>void p.upload(files[0])} onBrowse={p.browse}
    header={<><span className={'editor-toolbar '+styles.pdfToolbar}>{p.toolButtons}</span><span className={styles.links+' '+styles.onlyPhone}><button type="button" className={styles.linkButton} disabled={p.busy||p.previewBusy} onClick={p.browse}>Choose another PDF</button></span></>}
    message={p.error&&<div role="alert" className={styles.alert}><TriangleAlert size={17} aria-hidden="true"/><span>{p.error}</span></div>}
    overlay={p.busy&&<div className={styles.overlay} aria-hidden="true"><Loader2 size={26} className={styles.spin}/>Reading your PDF…<span className={styles.progress}><i/></span></div>}
    empty={{title:'Make your PDF work for you.',types:'Select supported original text/image objects, or add something new.',button:'Select PDF',limits:'PDF · 15 MB · up to 40 pages · signed/encrypted PDFs are not supported'}}>
    <div className={styles.pdfPanes}>{p.pageList}<div className={'pdf-viewport '+styles.pdfView}>{p.pageTools}{p.pageView}</div></div>
  </InlineDropzone>;

  const status=p.status||(p.loaded&&p.noTextNotice);
  const panel=<OptionsPanel title="Object properties">
    <div className={styles.pdfPanel}>
      {status&&<div className={styles.panelStatus}>{p.status}{p.loaded&&p.noTextNotice}</div>}
      {p.loaded
        ?<div className={'editor-properties '+styles.panelStack}>{p.propertyFields}</div>
        :<p className={styles.help}>Open a PDF, then choose a text or image object on the page, or add a new item from the toolbar.</p>}
      {p.loaded&&<div className={styles.panelStack}>{p.reviewButton}{p.reviewText}</div>}
      <div className={styles.panelStack}>{p.notice}</div>
    </div>
  </OptionsPanel>;

  const action=<>
    <ActionButton mode={mode} onAction={act}/>
    {p.result&&<p className={styles.actionMeta}><b>editgoo-edited.pdf</b> is ready.</p>}
    {p.loaded&&<div className={styles.actionLinks+' '+styles.notPhone}><button type="button" className={styles.linkButton} disabled={p.busy||p.previewBusy} onClick={p.browse}>Choose another PDF</button></div>}
    <p className={styles.hint} aria-live="polite">{hint}</p>
  </>;

  return <>{p.mainInput}{p.loaded&&p.imagePicker}<ToolWorkspace box={box} panel={panel} action={action}/></>;
}
