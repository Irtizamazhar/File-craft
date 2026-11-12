import type {MetadataRoute} from 'next';
import {sitePublic,siteUrl} from '@/lib/site';
export default function robots():MetadataRoute.Robots {
  if(!sitePublic)return {rules:{userAgent:'*',disallow:'/'} };
  return {rules:{userAgent:'*',allow:'/',disallow:['/dashboard/','/admin/','/api/','/login','/register']},sitemap:`${siteUrl}/sitemap.xml`};
}
