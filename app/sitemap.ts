import type {MetadataRoute} from 'next';
import {tools} from '@/lib/tools';
import {guides} from '@/lib/guides';
import {siteUrl,sitePublic} from '@/lib/site';
const updated=new Date('2026-11-12');
export default function sitemap():MetadataRoute.Sitemap {
  if(!sitePublic)return [];
  const staticPages=['','/tools','/pdf-tools','/document-tools','/image-tools','/blog','/about','/pricing','/security','/contact','/faq','/privacy','/terms','/cookies','/features','/convert-tools','/edit-pdf','/remove-background','/file-compressor'];
  return [
    ...staticPages.map(p=>({url:siteUrl+p,lastModified:['','/tools','/edit-pdf','/remove-background','/file-compressor'].includes(p)?new Date('2026-11-21'):updated,changeFrequency:'monthly' as const})),
    ...tools.map(t=>({url:siteUrl+'/tools/'+t.slug,lastModified:updated,changeFrequency:'monthly' as const})),
    ...guides.map(g=>({url:siteUrl+'/guides/'+g.slug,lastModified:new Date(g.updated),changeFrequency:'monthly' as const}))
  ];
}
