import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {currentUser} from '@/lib/auth';

export default async function GuestAuthLayout({children}:{children:React.ReactNode}){
  const user=await currentUser({cookies:await cookies()}).catch(()=>null);
  if(user)redirect('/dashboard');
  return children;
}
