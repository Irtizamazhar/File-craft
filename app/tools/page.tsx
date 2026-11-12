import { Metadata } from 'next';
import ToolCatalog from '@/components/ToolCatalog';
export const metadata:Metadata={title:'All file tools',description:'Browse all PDF, document, spreadsheet, presentation and image tools.'};
export default function Tools(){return <><section className="subpage-hero"><div className="container"><span className="eyebrow">THE FULL TOOLBOX</span><h1>There's a tool for <em>that.</em></h1><p>Find exactly what you need, without the clutter.</p></div></section><ToolCatalog heading={false}/></>}
