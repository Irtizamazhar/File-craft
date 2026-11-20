import Link from 'next/link';
import Brand from './Brand';
export default function Footer(){return <footer className="footer"><div className="container footer-grid">
<div className="footer-intro"><Brand/><p>Everything your documents need. Simple tools, thoughtful design, and on-device file processing.</p><div className="footer-tag">Built for better workflows</div></div>
<div><h4>Tools</h4><Link href="/tools">Explore all tools</Link><Link href="/pdf-tools">PDF tools</Link><Link href="/document-tools">Document tools</Link><Link href="/image-tools">Image tools</Link></div>
<div><h4>Company</h4><Link href="/about">About FileCraft</Link><Link href="/pricing">Pricing</Link><Link href="/features">Features</Link><Link href="/faq">FAQ</Link><Link href="/contact">Contact</Link><Link href="/blog">Helpful guides</Link></div>
<div><h4>Legal</h4><Link href="/security">Security</Link><Link href="/cookies">Cookie information</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div>
</div><div className="container footer-bottom"><span>© {new Date().getFullYear()} FileCraft. All rights reserved.</span><span>Made to make work easier.</span></div></footer>}
