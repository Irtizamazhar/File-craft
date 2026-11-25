import Link from 'next/link';
import AuthShell from '@/components/AuthShell';

export const metadata={title:'Password help',robots:{index:false,follow:false}};

export default function ForgotPassword(){
  return <AuthShell title="Forgot your password?" description="Password reset emails are currently unavailable.">
    <div className="entry-recovery">
      <p>If you’re still signed in on another device and know your current password, you can change it from your account settings.</p>
      <Link className="entry-recovery-link" href="/dashboard#account-settings">Open account settings</Link>
      <p>If you can’t sign in, contact Editgoo for help. Include your account email and keep your password private.</p>
      <Link className="btn btn-primary entry-submit" href="/contact">Contact Editgoo</Link>
      <Link className="entry-back" href="/login">Back to log in</Link>
    </div>
  </AuthShell>;
}
