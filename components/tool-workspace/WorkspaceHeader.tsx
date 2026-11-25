import Link from 'next/link';
import {ChevronRight} from 'lucide-react';
import styles from './workspace.module.css';

/** Compact tool header (breadcrumb and H1) so the workspace is visible straight away. */
export default function WorkspaceHeader({title}:{title:string}){
  return <section className={styles.pageHeader}><div className="container">
    <nav aria-label="Breadcrumb"><Link href="/">Home</Link><ChevronRight size={12} aria-hidden="true"/><Link href="/tools">All tools</Link><ChevronRight size={12} aria-hidden="true"/><span aria-current="page">{title}</span></nav>
    <h1>{title}<span>.</span></h1>
  </div></section>;
}
