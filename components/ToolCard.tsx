import Link from 'next/link';
import { ArrowUpRight,FileText,Layers2,Scissors,FileArchive,FileSpreadsheet,Presentation,Image as ImageIcon,LockKeyhole,RotateCw,FileType,FileImage,FilePlus2,FilePen,CheckCheck,WandSparkles } from 'lucide-react';
import type {Tool} from '@/lib/tools';
const icons:any={'merge-pdf':Layers2,'split-pdf':Scissors,'compress-pdf':FileArchive,'rotate-pdf':RotateCw,'protect-pdf':LockKeyhole,'pdf-to-word':FileType,'pdf-to-excel':FileSpreadsheet,'pdf-to-powerpoint':Presentation,'pdf-to-jpg':FileImage,'pdf-to-png':FileImage,'image-to-pdf':FileImage,'repair-pdf':WandSparkles,'add-page-numbers':FilePlus2,'fill-pdf-form':FilePen,'ocr-pdf':CheckCheck};
export function ToolCard({tool}: {tool:Tool}){
 const Icon=icons[tool.slug]||({PDF:FileText,Convert:FileType,Word:FileText,Excel:FileSpreadsheet,PowerPoint:Presentation,Image:ImageIcon} as any)[tool.category]||FileText;
 return <Link href={'/tools/'+tool.slug} className={'tool-card cat-'+tool.category.toLowerCase()}>
  <div className="tool-card-top"><span className="tool-icon"><Icon size={22} strokeWidth={1.8}/></span><ArrowUpRight className="tool-arrow" size={19}/></div>
  <div><h3>{tool.name}</h3><p>{tool.description}</p></div>
 </Link>;
}
