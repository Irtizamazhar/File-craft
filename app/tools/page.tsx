import type {Metadata} from 'next';
import AllToolsDirectory from '@/components/AllToolsDirectory';
export const metadata:Metadata={title:'All tools for PDF, documents and images',description:'Search FileCraft tools for PDF editing, portrait background removal, file compression and document conversion.',alternates:{canonical:'/tools'}};
export default function Tools(){return <AllToolsDirectory/>}
