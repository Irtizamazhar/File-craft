// Small display helpers for the dashboard: a file-type badge per tool and a short phrase for an activity entry.
import {directoryTools} from './directory';

export type Tone='red'|'violet'|'green'|'blue'|'amber'|'grey';
export type Badge={label:string;tone:Tone};

const find=(slug:string)=>directoryTools.find(t=>t.slug===slug);
export const toolName=(slug:string)=>find(slug)?.name??slug.replaceAll('-',' ');
export const toolPath=(slug:string)=>find(slug)?.path??'/tools/'+slug;
export const toolSummary=(slug:string)=>find(slug)?.description??'';

/** What the tool produces, as a short label + colour (PDF red, Word blue, images violet, archives green …). */
export function toolBadge(slug:string):Badge{
  const target=slug.includes('-to-')?slug.split('-to-').pop()!:slug;
  if(/compress|zip|split/.test(slug)&&!/-to-/.test(slug))return {label:'ZIP',tone:'green'};
  if(/docx|word/.test(target))return {label:'DOC',tone:'blue'};
  if(/xlsx|excel|csv/.test(target))return {label:'XLS',tone:'green'};
  if(/pptx|powerpoint|slides/.test(target))return {label:'PPT',tone:'amber'};
  if(/^(txt|text|html)$/.test(target))return {label:target==='html'?'HTML':'TXT',tone:'grey'};
  if(/jpg|png|webp|image|background/.test(target))return {label:'IMG',tone:'violet'};
  return {label:'PDF',tone:'red'};
}

const OUT:Record<string,string>={pdf:'PDF',word:'Word',docx:'Word',txt:'text',text:'text',jpg:'JPG',png:'PNG',webp:'WebP',excel:'Excel',xlsx:'Excel',csv:'CSV',html:'HTML',powerpoint:'PowerPoint',pptx:'PowerPoint'};
/** "Merged files", "Converted to Word", … (activity records only hold the tool, not file counts). */
export function activityLabel(slug:string){
  if(slug.includes('-to-')){const to=slug.split('-to-').pop()!;return 'Converted to '+(OUT[to]??to.toUpperCase())}
  if(slug.startsWith('merge'))return 'Merged files';
  if(slug.startsWith('split'))return 'Split a PDF';
  if(slug.includes('compress'))return 'Compressed a file';
  if(slug.startsWith('rotate'))return slug.endsWith('image')?'Rotated an image':'Rotated pages';
  if(slug==='resize-image')return 'Resized an image';
  if(slug==='remove-background')return 'Removed a background';
  if(slug==='edit-pdf')return 'Edited a PDF';
  return 'Used '+toolName(slug);
}

/** "Just now", "10 min ago", "2 hours ago", "Yesterday", "Nov 22". */
export function relativeTime(value:string|Date,now=new Date()){
  const date=new Date(value),seconds=(now.getTime()-date.getTime())/1000;
  if(seconds<60)return 'Just now';
  if(seconds<3600)return Math.floor(seconds/60)+' min ago';
  const startOfToday=new Date(now.getFullYear(),now.getMonth(),now.getDate()).getTime();
  if(date.getTime()>=startOfToday)return Math.floor(seconds/3600)===1?'1 hour ago':Math.floor(seconds/3600)+' hours ago';
  if(date.getTime()>=startOfToday-86400000)return 'Yesterday';
  return date.toLocaleDateString('en-US',{month:'short',day:'numeric',...(date.getFullYear()!==now.getFullYear()?{year:'numeric'}:{})});
}
