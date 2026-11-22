import Link from 'next/link';
import {
  ArrowRight, ArrowLeftRight, Download, FileCheck2, Files, FileText, Gauge, Image as ImageIcon,
  Laptop, LayoutGrid, MousePointer2, Shield, ShieldCheck, Monitor, Smartphone, Sparkles, Upload, Zap
} from 'lucide-react';
import HeroUpload from '@/components/HeroUpload';
import HeroArtwork from '@/components/HeroArtwork';
import FeaturedToolCard, {ToolArtwork} from '@/components/FeaturedToolCard';
import {ToolCard} from '@/components/ToolCard';
import Faq from '@/components/Faq';
import Pricing from '@/components/Pricing';
import {directoryTools, popularSlugs} from '@/lib/directory';
import {guides} from '@/lib/guides';

export const metadata={
  description:'Edit and organize PDFs, remove image backgrounds, compress files and convert documents with FileCraft’s browser-based tools.',
  alternates:{canonical:'/'}
};

const featured=['remove-background','edit-pdf','compress-pdf','merge-pdf'];
const homeCategories=[
  {title:'PDF Tools', filter:'PDF', description:'Organize and edit PDFs', icon:Files},
  {title:'Image Tools', filter:'Images', description:'Clean up and convert images', icon:ImageIcon},
  {title:'Convert Files', filter:'Convert', description:'Move between file formats', icon:ArrowLeftRight},
  {title:'Word & Office', filter:'Office', description:'Work with documents and slides', icon:FileText},
  {title:'Optimize Files', group:'Optimize PDF', description:'Compress, repair and flatten PDFs', icon:Gauge},
  {title:'Security Tools', filter:'Security', description:'Review PDF and image metadata', icon:Shield},
];
const steps=[
  {title:'Choose your tool', description:'Pick the tool that matches what you want to do with your file.', icon:MousePointer2},
  {title:'Upload and process', description:'Select your files and adjust the settings offered by your tool.', icon:Upload},
  {title:'Download your result', description:'Save the output to your device and review it before sharing.', icon:Download},
];
const benefits=[
  {title:'One place for everyday files', description:'Work with PDFs, Office documents and images from one directory.', icon:LayoutGrid},
  {title:'Settings for the task at hand', description:'See the relevant options alongside the files you selected.', icon:Zap},
  {title:'Fits your screen', description:'Browse and run tools on a phone, tablet or desktop.', icon:Smartphone},
  {title:'Processing in your browser', description:'Supported file operations run on your device.', icon:Laptop},
  {title:'Clear download actions', description:'See when a result is ready and save it directly to your device.', icon:FileCheck2},
];
const homeGuides=guides.filter(guide=>['how-to-compress-pdf-without-losing-readability','merge-pdf-files-in-the-right-order','how-to-remove-an-image-background'].includes(guide.slug));

export default function Home(){
  return <>
    <div className="announcement"><Sparkles size={17}/> Your documents, simplified</div>
    <section className="hero reference-hero">
      <div className="container hero-grid">
        <div className="hero-content">
          <span className="hero-eyebrow">YOUR ALL-IN-ONE FILE WORKSPACE</span>
          <h1>Every file. One <em>simple</em> place.</h1>
          <p className="hero-lede">An easier way to work with your PDFs and documents. Convert, compress, merge, split and more — all in one place.</p>
          <HeroUpload/>
        </div>
        <HeroArtwork/>
      </div>
      <div className="container trust-strip">
        <div><Zap/><span><strong>Less effort. More done.</strong><small>A clear, focused workflow</small></span></div>
        <div><ShieldCheck/><span><strong>Private by design</strong><small>Document processing on your device</small></span></div>
        <div><Monitor/><span><strong>One familiar workspace</strong><small>For desktop, tablet and mobile</small></span></div>
      </div>
    </section>

    <div className="premium-home">
      <section className="home-section container">
        <div className="section-heading"><h2>Featured tools</h2><Link className="inline-link" href="/tools">All tools <ArrowRight size={17}/></Link></div>
        <div className="home-feature-grid">
          {featured.map(slug=><FeaturedToolCard key={slug} tool={directoryTools.find(tool=>tool.slug===slug)!}/>)}
        </div>
      </section>

      <section className="home-section home-popular">
        <div className="container">
          <div className="section-heading"><h2>Most popular tools</h2></div>
          <div className="popular-grid home-popular-grid">
            {popularSlugs.map(slug=>{
              const tool=directoryTools.find(item=>item.slug===slug)!;
              return <ToolCard key={slug} tool={tool} href={tool.path}/>;
            })}
          </div>
        </div>
      </section>

      <section className="home-section container">
        <div className="section-heading"><h2>Explore by category</h2></div>
        <div className="home-category-grid">
          {homeCategories.map(({title,filter,group,description,icon:Icon})=>
            <Link key={title} href={{pathname:'/tools',query:filter?{category:filter}:{group}}}>
              <span className="home-category-icon"><Icon size={27}/></span>
              <div><h3>{title}</h3><p>{description}</p></div><ArrowRight className="home-category-arrow" size={18}/>
            </Link>
          )}
        </div>
      </section>

      <section id="how-it-works" className="home-section home-workflow">
        <div className="container">
          <div className="section-heading"><h2>How FileCraft works</h2></div>
          <ol className="home-steps">
            {steps.map(({title,description,icon:Icon},index)=><li key={title}>
              <div className="home-step-illustration" aria-hidden="true"><Icon size={29}/><span>{index+1}</span></div><h3>{title}</h3><p>{description}</p>
            </li>)}
          </ol>
        </div>
      </section>

      <section className="home-section container home-benefits">
        <div><h2>Why choose FileCraft?</h2><Link className="inline-link" href="/features">Explore features <ArrowRight size={17}/></Link></div>
        <div className="home-benefit-list">{benefits.map(({title,description,icon:Icon})=><article key={title}><span><Icon size={22}/></span><div><h3>{title}</h3><p>{description}</p></div></article>)}</div>
      </section>

      <section className="container home-workspace">
        <div className="home-workspace-art" aria-hidden="true"><ToolArtwork variant="edit-pdf"/><ToolArtwork variant="remove-background"/><ToolArtwork variant="file-compressor"/></div>
        <div className="home-workspace-copy">
          <h2>A workspace for your everyday files</h2>
          <p>Edit supported text objects and pages, remove image backgrounds, or reduce the size of supported PDFs, images and Office files.</p>
          <div className="workspace-links"><Link className="btn btn-primary" href="/edit-pdf">Edit PDF</Link><Link className="btn btn-outline" href="/remove-background">Remove Background</Link><Link className="inline-link" href="/file-compressor">File Compressor <ArrowRight size={17}/></Link></div>
        </div>
      </section>

      <Pricing preview/>

      <section className="home-section home-guides">
        <div className="container">
          <div className="section-heading"><h2>Helpful guides</h2><Link href="/blog" className="inline-link">All guides <ArrowRight size={17}/></Link></div>
          <div className="guide-index">{homeGuides.map(guide=><Link href={'/guides/'+guide.slug} key={guide.slug}>
            <span className="guide-art" aria-hidden="true">{guide.category.includes('Image')?<ImageIcon size={32}/>:<FileText size={32}/>}</span>
            <span className="eyebrow">{guide.category}</span><h3>{guide.title}</h3><p>{guide.description}</p><span className="inline-link">Read the guide <ArrowRight size={16}/></span>
          </Link>)}</div>
        </div>
      </section>
      <Faq/>
    </div>
  </>;
}
