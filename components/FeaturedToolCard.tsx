import {ArrowRight, FileArchive, FilePenLine, Files, Image as ImageIcon, ScanLine} from 'lucide-react';
import Link from 'next/link';
import type {DirectoryTool} from '@/lib/directory';

export function ToolArtwork({variant}:{variant:string}) {
  const Icon=variant==='remove-background'?ImageIcon:variant==='edit-pdf'?FilePenLine:variant==='merge-pdf'?Files:FileArchive;
  return <span className={'tool-art tool-art-'+variant} aria-hidden="true">
    <span className="tool-art-sheet tool-art-back"><Icon size={30}/></span>
    <span className="tool-art-sheet tool-art-front">
      {variant==='remove-background'?<span className="art-cutout"><ImageIcon size={29}/></span>:<><Icon size={29}/><i/><i/></>}
    </span>
    <span className="tool-art-mark"><ScanLine size={17}/></span>
  </span>;
}

export default function FeaturedToolCard({tool}:{tool:DirectoryTool}) {
  return <Link href={tool.path} className={'featured-directory-card feature-'+tool.slug}>
    <div className="feature-copy">
      <h3>{tool.name}</h3>
      <p>{tool.description}</p>
      <span className="feature-arrow" aria-hidden="true"><ArrowRight size={18}/></span>
    </div>
    <ToolArtwork variant={tool.slug}/>
  </Link>;
}
