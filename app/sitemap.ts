import type {MetadataRoute} from 'next';
import {tools} from '@/lib/tools';
import {guides} from '@/lib/guides';
import {siteUrl} from '@/lib/site';
const updated=new Date('2026-11-12');
export default function sitemap():MetadataRoute.Sitemap {
  const staticPages=['','/tools','/pdf-tools','/document-tools','/image-tools','/blog','/about','/pricing','/security','/contact','/faq','/privacy','/terms'];
  return [
    ...staticPages.map(p=>({url:siteUrl+p,lastModified:updated,changeFrequency:'monthly' as const})),
    ...tools.map(t=>({url:siteUrl+'/tools/'+t.slug,lastModified:updated,changeFrequency:'monthly' as const})),
    ...guides.map(g=>({url:siteUrl+'/guides/'+g.slug,lastModified:new Date(g.updated),changeFrequency:'monthly' as const}))
  ];
}
