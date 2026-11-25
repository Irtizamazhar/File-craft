import type {Metadata} from 'next';
import AllToolsDirectory from '@/components/AllToolsDirectory';
import {directoryCategories,directoryGroups} from '@/lib/directory';
import {pageMetadata} from '@/lib/seo';

export const metadata:Metadata=pageMetadata({
  title:'All tools for PDF, documents and images',
  description:'Find Editgoo tools to edit PDFs, remove image backgrounds, optimize files and convert documents. Browse by category or search by task.',
  path:'/tools'
});

export default async function Tools({searchParams}:{searchParams:Promise<{category?:string|string[];group?:string|string[]}>}) {
  const query=await searchParams;
  const category=directoryCategories.find(value=>value===query.category)??'All Tools';
  const group=directoryGroups.find(value=>value===query.group)??'All tools';
  return <AllToolsDirectory key={category+' '+group} initialCategory={category} initialGroup={group}/>;
}
