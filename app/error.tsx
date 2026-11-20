'use client';
import Link from 'next/link';
export default function ErrorPage({reset}:{error:Error & {digest?:string};reset:()=>void}){return <section className="system-state container"><span className="eyebrow">A SMALL INTERRUPTION</span><h1>Let’s give that another try.</h1><p>This page could not be loaded. Your document files remain on your device.</p><div><button className="btn btn-primary" onClick={reset}>Try again</button><Link href="/tools" className="btn btn-outline">Browse tools</Link></div></section>}
