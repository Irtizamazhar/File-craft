'use client';
import {useState,type ReactNode} from 'react';
import {ChevronDown,ChevronUp} from 'lucide-react';
import styles from './workspace.module.css';

/** Right-hand column content: tool options, notes and the compact privacy line. Scrolls on its own when long. */
export function OptionsPanel({title,children}:{title:string;children:ReactNode}){
  const [open,setOpen]=useState(true);
  return <div className={styles.panel} aria-label={title} role="group">
    <div className={styles.panelHead}>
      <h2>{title}</h2>
      <button type="button" className={styles.panelToggle} aria-expanded={open} onClick={()=>setOpen(!open)}>{open?<>Hide<ChevronUp size={16} aria-hidden="true"/></>:<>Show<ChevronDown size={16} aria-hidden="true"/></>}</button>
    </div>
    <div className={styles.panelBody+(open?'':' '+styles.collapsed)}>{children}</div>
  </div>;
}

/**
 * Two-column shell shared by every tool: the box (upload → files → result) on the left, options on the right and
 * the main action pinned under the options. On phones it stacks and the action bar sticks to the bottom of the screen.
 */
export default function ToolWorkspace({box,panel,action}:{box:ReactNode;panel:ReactNode;action:ReactNode}){
  return <div className={styles.workspace}>
    {box}
    {panel}
    <div className={styles.actionBar}>{action}</div>
  </div>;
}
