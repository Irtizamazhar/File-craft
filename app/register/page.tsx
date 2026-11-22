import AuthForm from '@/components/AuthForm';
import AuthShell from '@/components/AuthShell';

export const metadata={title:'Create account'};

export default function Register(){
  return <AuthShell title="Create your free FileCraft account" description="Your documents, tools and workspace in one place."><AuthForm type="register"/></AuthShell>;
}
