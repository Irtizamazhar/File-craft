import raw from '../catalog/tools.json';
export type Control={key:string;label:string;kind:'select'|'text'|'number'|'password';values?:string[];default:string};
export type Tool={slug:string;name:string;category:string;description:string;accept:string;multi:boolean;controls:Control[];notice:string|null;engine:'browser'};
export const tools=raw as Tool[];
export const categories=['All','PDF','Convert','Word','Excel','PowerPoint','Image','Document'] as const;
export function getTool(slug:string){return tools.find(t=>t.slug===slug)}
export function categoryCount(name:string){return name==='All'?tools.length:tools.filter(t=>name==='Document'?['Word','Excel','PowerPoint','Convert'].includes(t.category):name==='PDF'?['PDF','Convert'].includes(t.category):t.category===name).length}
