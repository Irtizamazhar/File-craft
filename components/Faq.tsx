import {ChevronDown} from 'lucide-react';
export const commonQuestions=[['Do I need an account?','No. The tools work without an account. Sign in if you want to see your recent tool activity and manage your profile.'],['Do my files leave my device?','Most tools process files in your browser, so file contents are not uploaded. The background remover may use the Editgoo server when that engine is enabled, and it tells you when it does. Accounts, contact messages and activity records are stored on our server.'],['Will my formatting stay the same?','PDF page operations generally keep page contents as they are. Office and text conversions have limitations, which each tool lists. Always check the result.'],['How large can my files be?','Standard tools accept up to 15 MB per file, 45 MB per task and 12 files at a time. Some tools also limit page counts or image dimensions.']];
export const siteQuestions=[
  ...commonQuestions,
  ['Is Editgoo free?','Yes. The available tools are free. Paid plans are not offered yet, and Editgoo never asks for payment details.'],
  ['Which tools are available?','PDF tools, a PDF editor, image tools including background removal, document conversions and a file compressor. Video, QR code, barcode and AI writing tools are planned but not available yet.'],
  ['Can I recover a download later?','No. Results are created in your browser tab and are not stored on our servers. Download them before you close or reload the page.'],
  ['Does PDF to Word keep the exact layout?','No. It extracts the text into an editable DOCX file. Images, columns and exact positioning are not preserved.'],
  ['Why was my file rejected?','Editgoo checks that the file content matches its type and is within the size limits. Password-protected, signed or damaged files may also be refused. The error message explains the reason.'],
  ['Which browsers are supported?','Current versions of Chrome, Edge, Firefox and Safari. Large files and AI background removal work best on a desktop computer with plenty of memory.'],
  ['How do I delete my account?','Contact us through the contact form from the email address on your account, and we will delete your account and its activity records.'],
];
export default function Faq({items=commonQuestions,title='Frequently asked questions'}:{items?:string[][];title?:string}){return <section className="faq-section"><div className="container faq-inner"><h2>{title}</h2>{items.map(([q,a])=><details className="faq-item" key={q}><summary>{q}<ChevronDown size={21}/></summary><p>{a}</p></details>)}</div></section>}
