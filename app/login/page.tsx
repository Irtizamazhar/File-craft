import AuthForm from '@/components/AuthForm';
import AuthShell from '@/components/AuthShell';

export const metadata={title:'Log in'};

export default function Login(){
  return <AuthShell title="Welcome back" description="Log in to your FileCraft workspace."><AuthForm type="login"/></AuthShell>;
}
