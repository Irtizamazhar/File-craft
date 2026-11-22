import {FileText, Images, Layers3} from 'lucide-react';
import Brand from './Brand';

export default function AuthShell({title,description,children}:{
  title:string;description:string;children:React.ReactNode;
}){
  return <section className="account-entry">
    <div className="account-entry-card">
      <div className="account-entry-form">
        <Brand/>
        <h1>{title}</h1>
        <p className="account-entry-intro">{description}</p>
        {children}
      </div>
      <aside className="account-entry-aside">
        <div className="account-illustration" aria-hidden="true">
          <div className="account-art-image"><Images size={43}/></div>
          <div className="account-art-doc"><FileText size={38}/><i/><i/></div>
          <div className="account-art-pdf"><b>PDF</b><span><Layers3 size={33}/></span><i/><i/></div>
        </div>
        <p>Pick up where you left off.</p>
        <span>Return to your saved tools and recent activity from your dashboard.</span>
      </aside>
    </div>
  </section>;
}
