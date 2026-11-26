import Link from 'next/link';
import Brand from './Brand';

const navigation=[
  {title:'Tools',links:[['All tools','/tools'],['PDF tools','/pdf-tools'],['Document tools','/document-tools'],['Image tools','/image-tools'],['Typing Speed Test','/typing-test']]},
  {title:'Product',links:[['Features','/features'],['Pricing','/pricing'],['Edit PDF','/edit-pdf'],['Remove Background','/remove-background']]},
  {title:'Resources',links:[['Help and how it works','/help'],['Helpful guides','/blog'],['Frequently asked questions','/faq']]},
  {title:'Company',links:[['About Editgoo','/about'],['Contact us','/contact'],['Security','/security']]},
  {title:'Legal',links:[['Privacy Policy','/privacy'],['Terms and Conditions','/terms'],['Cookie Policy','/cookies']]},
];

export default function Footer(){
  return <footer className="footer">
    <nav className="container footer-grid" aria-label="Footer">
      <div className="footer-intro"><Brand/><p>Online tools for PDFs, images and documents. Most tools run right in your browser.</p></div>
      {navigation.map(({title,links})=><div key={title}><h2>{title}</h2>{links.map(([label,href])=><Link href={href} key={href}>{label}</Link>)}</div>)}
    </nav>
    <div className="container footer-bottom"><span>© {new Date().getFullYear()} Editgoo. All rights reserved.</span></div>
  </footer>;
}
