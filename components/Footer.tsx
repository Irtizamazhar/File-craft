import Link from 'next/link';
import Brand from './Brand';

const navigation=[
  {title:'Tools',links:[['All tools','/tools'],['PDF tools','/pdf-tools'],['Document tools','/document-tools'],['Image tools','/image-tools']]},
  {title:'Product',links:[['Features','/features'],['Pricing','/pricing'],['Edit PDF','/edit-pdf'],['Remove Background','/remove-background']]},
  {title:'Resources',links:[['Helpful guides','/blog'],['Frequently asked questions','/faq']]},
  {title:'Company',links:[['About FileCraft','/about'],['Contact','/contact']]},
  {title:'Legal',links:[['Security','/security'],['Cookie information','/cookies'],['Privacy','/privacy'],['Terms','/terms']]},
];

export default function Footer(){
  return <footer className="footer">
    <nav className="container footer-grid" aria-label="Footer">
      <div className="footer-intro"><Brand/><p>Browser-based tools for PDFs, documents and images.</p></div>
      {navigation.map(({title,links})=><div key={title}><h2>{title}</h2>{links.map(([label,href])=><Link href={href} key={href}>{label}</Link>)}</div>)}
    </nav>
    <div className="container footer-bottom"><span>© {new Date().getFullYear()} FileCraft. All rights reserved.</span></div>
  </footer>;
}
