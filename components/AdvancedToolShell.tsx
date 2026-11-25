import Link from 'next/link';
import {ChevronRight} from 'lucide-react';
import Faq from './Faq';
import WorkspaceHeader from './tool-workspace/WorkspaceHeader';
import workspaceStyles from './tool-workspace/workspace.module.css';
// workspace: compact header and the one-step workspace section (lib/tool-workspace.ts); otherwise the previous layout.
export default function AdvancedToolShell({title,description,children,faqs,workspace=false}:{title:string;description:string;children:React.ReactNode;faqs:string[][];workspace?:boolean}){return <>{workspace?<><WorkspaceHeader title={title} description={description}/><section className={workspaceStyles.section}><div className="container">{children}</div></section></>:<><section className="advanced-hero"><div className="container"><nav className="breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><ChevronRight size={14}/><Link href="/tools">All tools</Link><ChevronRight size={14}/><span>{title}</span></nav><h1>{title}<span>.</span></h1><p>{description}</p></div></section><section className="advanced-workspace container">{children}</section></>}<Faq items={faqs}/><section className="container advanced-related"><h2>Keep your workflow moving.</h2><Link href="/tools">Explore all tools</Link><Link href="/tools/resize-image">Resize an image</Link><Link href="/tools/merge-pdf">Merge PDF</Link></section></>}
