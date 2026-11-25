import type {MetadataRoute} from 'next';
import {tools} from '@/lib/tools';
import {guides} from '@/lib/guides';
import {siteUrl,sitePublic} from '@/lib/site';
const updated=new Date('2026-11-12');
const advancedUpdated=new Date('2026-11-21');
const contentUpdated=new Date('2026-11-25');
export default function sitemap():MetadataRoute.Sitemap {
  // Stays empty until the operator explicitly enables indexing (see sitePublic in lib/site.ts).
  if(!sitePublic)return [];
  const staticPages=['','/tools','/pdf-tools','/document-tools','/image-tools','/blog','/about','/help','/pricing','/security','/contact','/faq','/privacy','/terms','/cookies','/features','/convert-tools','/edit-pdf','/remove-background','/file-compressor'];
  const recentlyRevised=['','/about','/help','/faq','/privacy','/terms','/cookies','/security','/features'];
  return [
    ...staticPages.map(p=>({url:siteUrl+p,lastModified:recentlyRevised.includes(p)?contentUpdated:['/tools','/edit-pdf','/remove-background','/file-compressor'].includes(p)?advancedUpdated:updated,changeFrequency:'monthly' as const})),
    ...tools.map(t=>({url:siteUrl+'/tools/'+t.slug,lastModified:contentUpdated,changeFrequency:'monthly' as const})),
    ...guides.map(g=>({url:siteUrl+'/guides/'+g.slug,lastModified:new Date(g.updated),changeFrequency:'monthly' as const}))
  ];
}
