import raw from '../catalog/tools.json';
export type Control={key:string;label:string;kind:'select'|'text'|'number'|'password';values?:string[];default:string};
export type Tool={slug:string;name:string;category:string;description:string;accept:string;multi:boolean;controls:Control[];notice:string|null;engine:'browser'};
export const tools=raw as Tool[];
export const categories=['All','Organize PDF','Optimize PDF','Convert to PDF','Convert from PDF','Edit PDF','Word','Excel','PowerPoint','Image','Document'] as const;
export function matchesCategory(t:Tool,name:string){if(name==='All')return true;if(name==='Document')return ['Word','Excel','PowerPoint','Convert'].includes(t.category);if(name==='PDF')return ['PDF','Convert'].includes(t.category);if(name==='Organize PDF')return ['merge-pdf','split-pdf','rotate-pdf','extract-pdf-pages','delete-pdf-pages','add-blank-pages','remove-blank-pages'].includes(t.slug);if(name==='Optimize PDF')return ['compress-pdf','repair-pdf','flatten-pdf'].includes(t.slug);if(name==='Convert to PDF')return t.slug.endsWith('-to-pdf');if(name==='Convert from PDF')return t.slug.startsWith('pdf-to-');if(name==='Edit PDF')return ['watermark-pdf','add-page-numbers','crop-pdf','fill-pdf-form','pdf-metadata','rotate-pdf'].includes(t.slug);return t.category===name}
export function getTool(slug:string){return tools.find(t=>t.slug===slug)}
export function categoryCount(name:string){return tools.filter(t=>matchesCategory(t,name)).length}
