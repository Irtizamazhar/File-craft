import Link from 'next/link';
import {ChevronRight,Clock3,FileText,LockKeyhole,ShieldCheck} from 'lucide-react';
import styles from './workspace.module.css';

/** Compact tool header (breadcrumb, H1, one-line description) so the workspace is visible straight away. */
export default function WorkspaceHeader({title,description}:{title:string;description:string}){
  return <section className={styles.pageHeader}><div className="container">
    <nav aria-label="Breadcrumb"><Link href="/">Home</Link><ChevronRight size={12} aria-hidden="true"/><Link href="/tools">All tools</Link><ChevronRight size={12} aria-hidden="true"/><span aria-current="page">{title}</span></nav>
    <h1>{title}<span>.</span></h1>
    <p>{description}</p>
  </div></section>;
}

/** The "Why Editgoo" benefits that sat in the old tool sidebar, now shown below the workspace (same text). */
export function WorkspaceWhy(){
  return <div className={styles.why} aria-label="Why Editgoo">
    <div><ShieldCheck size={18} aria-hidden="true"/><span><b>Private by design</b>Your document files are processed on your device, not uploaded to our website.</span></div>
    <div><Clock3 size={18} aria-hidden="true"/><span><b>Get time back</b>Simple tools that take care of the tedious bits.</span></div>
    <div><FileText size={18} aria-hidden="true"/><span><b>Actual file outputs</b>The browser generates downloadable outputs from actual document operations.</span></div>
    <div><LockKeyhole size={18} aria-hidden="true"/><span><b>Safe processing</b>Document contents remain in your browser; however, use only trusted devices for confidential work.</span></div>
  </div>;
}
