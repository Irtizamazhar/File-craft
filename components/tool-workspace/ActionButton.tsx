'use client';
import {ArrowRight,Download,Loader2,RotateCcw} from 'lucide-react';
import styles from './workspace.module.css';

export type ActionMode={kind:'idle';label:string;unavailable?:boolean}|{kind:'busy';label:string}|{kind:'retry';label:string}|{kind:'download';href:string;filename:string;label?:string};

/**
 * The single main button of a tool, always in the same place: Process → Processing… → green Download.
 * "unavailable" keeps it clickable (to show a hint) while telling assistive technology it is not ready yet.
 */
export default function ActionButton({mode,onAction}:{mode:ActionMode;onAction?:()=>void}){
  if(mode.kind==='download')return <a className={styles.action+' '+styles.download} href={mode.href} download={mode.filename}>
    <Download size={19} aria-hidden="true"/>{mode.label??'Download'}<span className={styles.srOnly}> {mode.filename}</span>
  </a>;
  if(mode.kind==='busy')return <button type="button" className={styles.action} disabled><Loader2 className={styles.spin} size={19} aria-hidden="true"/>{mode.label}</button>;
  return <button type="button" className={styles.action} aria-disabled={mode.kind==='idle'&&mode.unavailable?true:undefined} onClick={onAction}>
    {mode.kind==='retry'&&<RotateCcw size={18} aria-hidden="true"/>}{mode.label}{mode.kind==='idle'&&<ArrowRight size={18} aria-hidden="true"/>}
  </button>;
}
