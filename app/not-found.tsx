import Link from 'next/link';
import {ArrowRight} from 'lucide-react';
export default function NotFound(){return <div className="container not-found"><div className="eyebrow">404 / NOT FOUND</div><h1>That page has flown away.</h1><p>We couldn't find the file tool you're looking for.</p><Link href="/tools" className="btn btn-primary">Browse the tools <ArrowRight size={17}/></Link></div>}
