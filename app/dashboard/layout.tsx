import type {Metadata} from 'next';
import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {currentUser} from '@/lib/auth';
export const metadata:Metadata={robots:{index:false,follow:false}};
// Signed-in users only: anyone else goes to /login (the mirror of GuestAuthLayout on /login and /register).
export default async function PrivateLayout({children}:{children:React.ReactNode}){
  const user=await currentUser({cookies:await cookies()}).catch(()=>null);
  if(!user)redirect('/login');
  return <>{children}</>;
}
