import type {Metadata} from 'next';

export const ogImage={url:'/og-image.png',width:1200,height:630,alt:'Editgoo — online tools for PDFs, images and documents'};

/**
 * Page metadata with a canonical URL and a complete Open Graph block.
 * A page-level openGraph object replaces the root one entirely, so it must repeat siteName, locale and image.
 * Twitter cards fall back to these og: tags; the root layout only sets the card type and image.
 */
export function pageMetadata({title,description,path,type='website'}:{title:string;description:string;path:string;type?:'website'|'article'}):Metadata{
  return {title,description,alternates:{canonical:path},openGraph:{title,description,url:path,type,siteName:'Editgoo',locale:'en_US',images:[ogImage]}};
}
