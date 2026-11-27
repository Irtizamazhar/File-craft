import {businessName, publicContact} from './site';

/** Content for the single-segment routes served by app/[section]/page.tsx. */

export type CatalogSection={eyebrow:string;title:string;metaTitle:string;subtitle:string;category:string};
export type PageBlock={heading:string;paragraphs:string[];list?:string[];id?:string;link?:{href:string;label:string}};
export type ContentPage={eyebrow:string;title:string;subtitle:string;metaTitle:string;description:string;updated?:string;blocks:PageBlock[]};

const POLICY_UPDATED='25 November 2026';
// The legal operator name comes from NEXT_PUBLIC_BUSINESS_NAME; until it is set, no entity name is invented.
const operatedBy=businessName?`Editgoo (www.editgoo.com) is operated by ${businessName}.`:'Editgoo (www.editgoo.com) is the online tools service described here.';
const contactRoute=publicContact?`email ${publicContact} or use the contact form at www.editgoo.com/contact`:'use the contact form at www.editgoo.com/contact';

export const catalogSections:Record<string,CatalogSection>={
  'convert-tools':{eyebrow:'EDITGOO / CONVERT',title:'A fresh format. A simpler task.',metaTitle:'File Converters for PDF, Documents and Images',category:'Convert',subtitle:'Convert supported PDF, document and image formats. Each tool lists its limitations before you start.'},
  'pdf-tools':{eyebrow:'EDITGOO / PDF',title:'Every PDF task, simplified.',metaTitle:'Online PDF Tools to Merge, Split and Compress',category:'PDF',subtitle:'Merge, split, rotate, compress and arrange PDF files in your browser.'},
  'document-tools':{eyebrow:'EDITGOO / DOCUMENTS',title:'Documents, your way.',metaTitle:'Document Tools for Word, Spreadsheets and Slides',category:'Document',subtitle:'Convert Word documents, spreadsheets, slides and text files.'},
  'image-tools':{eyebrow:'EDITGOO / IMAGES',title:'Images that fit the job.',metaTitle:'Online Image Tools to Resize, Compress and Convert',category:'Image',subtitle:'Convert, resize, compress and clean up images in your browser.'},
};

/** Sections with their own component rather than a content page. */
export const componentSections=['pricing','contact','faq','blog'] as const;

export const contentPages:Record<string,ContentPage>={
  about:{
    eyebrow:'ABOUT EDITGOO',title:'File work, made lighter.',metaTitle:'About Editgoo',
    subtitle:'Editgoo is a collection of practical online tools for everyday files.',
    description:'What Editgoo is, which tools are available today, how files are processed and what we plan to add next.',
    blocks:[
      {heading:'What Editgoo is',paragraphs:['Editgoo brings file tools together in one place: you pick a task, add your files, adjust the settings that matter and download the result. The aim is simple, honest tools that do the job and explain their limits.']},
      {heading:'What you can do today',paragraphs:['The tools that are available now cover:'],list:['PDF tools: merge, split, rotate, compress, crop, watermark, page numbers, metadata, forms and more.','A PDF editor for supported text, images, shapes and pages.','Image tools: format conversion, resizing, rotation, compression, metadata removal and background removal.','Document conversions between PDF, Word, Excel, PowerPoint, HTML, CSV and plain text, where the format allows it.','A file compressor for supported PDFs, images and Office files.']},
      {heading:'How your files are processed',paragraphs:['Most Editgoo tools run inside your web browser, so the file you choose is read and processed on your own device. The background remover can optionally use an Editgoo server when the site operator enables it; the tool tells you which engine it uses. The Privacy Policy explains this in detail.']},
      {heading:'How we build',paragraphs:['Every tool listed in the directory produces a real output file. When a conversion cannot keep something (for example the exact layout of a PDF converted to Word), the tool page says so. If a file cannot be processed, you get an error message rather than a misleading result.']},
      {heading:'What comes next',paragraphs:['We plan to add more categories over time, such as video, text, QR code, barcode and AI-assisted tools. These are plans, not current features: a tool only appears in the directory once it works.']},
    ]},
  help:{
    eyebrow:'HELP CENTRE',title:'How Editgoo works.',metaTitle:'Help and how it works',
    subtitle:'Step-by-step help, file limits, browser requirements and fixes for common problems.',
    description:'Learn how to use Editgoo tools, which files and browsers are supported, the file size limits and what to do when a file will not process.',
    blocks:[
      {heading:'Using a tool',paragraphs:['Every tool follows the same steps:'],list:['Open the tool from the menu, the tools directory or the search box.','Drag your files onto the upload area, or select them from your device.','Check the file list and any options the tool offers, such as quality, page range or output format.','Select the process button and wait for the result.','Download the result and open it to check it before you share it.']},
      {heading:'Where processing happens',paragraphs:['Most tools work entirely in your browser: your file is not uploaded to Editgoo. The background remover may send your image to the Editgoo server when the site operator has enabled the server engine; the tool shows which engine it will use. Signing in is optional, and an account never stores copies of your files.']},
      {heading:'File limits',paragraphs:['To keep your browser responsive, standard tools accept files up to 15 MB each, up to 45 MB per task and up to 12 files at a time. Some tools also limit the number of pages or the image dimensions. The tool tells you when a file is over a limit.']},
      {heading:'Supported browsers',paragraphs:['Use a current version of Chrome, Edge, Firefox or Safari on desktop or mobile. The tools need JavaScript and WebAssembly. Large PDFs and AI background removal need more memory, so a desktop computer works best for big files.']},
      {heading:'If a file will not process',paragraphs:['Common reasons and fixes:'],list:['"Unsupported" or "does not match" errors: the file content does not match its extension. Re-export the file from the program that created it.','Password-protected or digitally signed files: some tools cannot change these. Remove the protection in the original program first, if you are allowed to.','Very large or complex files: try fewer pages or files at a time, or close other browser tabs.','No download: check whether your browser blocked the download, then select the download button again.']},
      {heading:'Your downloads',paragraphs:['Results are created in your browser tab and are not saved on our servers. Download them before you close or reload the page, because they cannot be recovered afterwards.']},
      {heading:'Still need help?',paragraphs:['Use the contact form and describe the tool, the file type and the error message. Please do not send passwords or confidential documents.']},
    ]},
  features:{
    eyebrow:'FEATURES',title:'Less file work. More possibilities.',metaTitle:'Features',
    subtitle:'A practical workspace for the files in your day.',
    description:'Editgoo features: a searchable tool directory, in-browser processing, clear limitations and an optional account workspace.',
    blocks:[
      {heading:'Everything has its place',paragraphs:['Search the tool directory, filter by category and open the tool that fits your task.']},
      {heading:'Your files stay on your device',paragraphs:['Most tools process files in your browser, so file contents are not uploaded to Editgoo. The background remover can optionally use an Editgoo server engine, and it tells you when it does.']},
      {heading:'A workflow that makes sense',paragraphs:['Select files, arrange them where order matters, adjust the relevant options and download the result. Each tool explains its limitations up front.']},
      {heading:'Help when you need it',paragraphs:['Original guides and tool instructions help you choose formats and check your outputs.']},
      {heading:'An optional account',paragraphs:['Sign in to see your recent tool activity, save tool shortcuts on your device and manage your profile and password. Your account never stores your documents.']},
    ]},
  security:{
    eyebrow:'SECURITY',title:'Your files deserve care.',metaTitle:'Security',
    subtitle:'How Editgoo protects your files and your account.',
    description:'How Editgoo handles file processing, account passwords, sessions and security reports.',
    blocks:[
      {heading:'Processing on your device',paragraphs:['Most tools never upload your file: it is processed by your browser and the result is created in your browser tab.']},
      {heading:'Optional server processing',paragraphs:['When the server engine for background removal is enabled, your image is sent over an encrypted connection to the Editgoo server, processed in memory and not stored. Uploads are limited to JPG, PNG and WebP images up to 15 MB and are checked before processing.']},
      {heading:'Account protection',paragraphs:['Passwords are stored as salted scrypt hashes, never as plain text. Sign-in uses an HttpOnly session cookie, and only a hash of the session token is stored. Changing your password ends every session, so you sign in again with the new password. Sign-in, registration and contact requests are rate limited.']},
      {heading:'Be honest about limits',paragraphs:['Editgoo has not had an independent security audit. For highly confidential files, use a trusted device, keep your original and check every output before you share it.']},
      {heading:'Report a problem',paragraphs:['If you believe you have found a security issue, please report it through the contact form without including any personal data or confidential files.']},
    ]},
  cookies:{
    eyebrow:'COOKIE POLICY',title:'Cookies and browser storage.',metaTitle:'Cookie Policy',updated:POLICY_UPDATED,
    subtitle:'Which cookies and browser storage Editgoo uses, and why.',
    description:'The Editgoo cookie policy: the essential sign-in cookie, browser storage for saved tools and AI models, and future advertising consent.',
    blocks:[
      {heading:'Essential sign-in cookie',paragraphs:['When you sign in, Editgoo sets one essential cookie named fc_session. It is HttpOnly (scripts cannot read it), is sent only to this website and keeps you signed in for up to 14 days. Signing out deletes it and ends the session on the server. The site works without it, but you cannot use account features.']},
      {heading:'Saved tool shortcuts',paragraphs:['If you save tools in your dashboard, the tool identifiers are kept in your browser\'s local storage on that device. They contain no file contents and are not sent to our servers.']},
      {heading:'Cached AI models',paragraphs:['The background remover downloads its AI model from Editgoo and may store it in your browser\'s cache storage so it does not have to download again. You can remove it by clearing site data in your browser.']},
      {heading:'Files you select',paragraphs:['Files you choose on the homepage are kept in browser memory only to pass them to the tool you open. They are not written to cookies or local storage.']},
      {heading:'Analytics and advertising',paragraphs:['Editgoo does not currently use analytics or advertising cookies. If we add advertising in future (for example Google AdSense), Google and its partners may use cookies to serve and measure ads. Before that happens we will update this policy and, where the law requires it, ask for your consent.']},
      {heading:'Managing cookies',paragraphs:['You can delete cookies and site data at any time in your browser settings. Blocking the essential cookie stops you from signing in, but the tools still work.']},
    ]},
  privacy:{
    eyebrow:'PRIVACY POLICY',title:'Privacy Policy.',metaTitle:'Privacy Policy',updated:'2026-11-27',
    subtitle:'What information Editgoo handles, where your files are processed and the choices you have.',
    description:'The Editgoo privacy policy: in-browser file processing, the optional background removal server, account data, contact messages, cookies and your rights.',
    blocks:[
      {heading:'Who we are',paragraphs:[`${operatedBy} For privacy questions or requests, ${contactRoute}.`]},
      {heading:'Files processed in your browser',paragraphs:['Most Editgoo tools, including the PDF, document, image and file compression tools and the PDF editor, read and process your files inside your web browser. The file contents are not uploaded to Editgoo, and the results are created in your browser tab. We cannot see or recover these files.']},
      {heading:'Images sent to our server for background removal',paragraphs:['The background remover can use a server engine when the site operator enables it. In that case the image you choose is sent over an encrypted connection to the Editgoo server, processed in memory to create the cutout mask and returned to your browser. It is not stored, logged or shared with third-party AI services. When the server engine is not available, the background remover runs entirely in your browser. The tool shows which engine it uses.']},
      {id:'internet-speed-test',heading:'Internet Speed Test',paragraphs:[
        'When you agree and start the Internet Speed Test, your browser connects directly to Measurement Lab (M-Lab) and runs its NDT7 test. Download and upload traffic uses internet bandwidth and can count toward your mobile data allowance.',
        'M-Lab collects your public IP address, test measurements and related information such as when the test ran. M-Lab publishes measurement data that can include your public IP address for research and retains measurement data indefinitely under its privacy policy.',
        'Editgoo displays the results in your browser. The speed test does not send your measurements or the IP address reported by M-Lab to Editgoo for storage.'
      ],link:{href:'https://www.measurementlab.net/privacy/',label:'M-Lab Privacy Policy'}},
      {heading:'Account information',paragraphs:['Accounts are optional. If you register, we store the following in our MySQL database:'],list:['Your name and email address.','Your password as a salted scrypt hash, never as plain text.','A hashed session token and its expiry date while you are signed in.','Your plan (currently the free plan).','While signed in, a record of completed tools: the tool name, a status and a timestamp. File names and file contents are never recorded.']},
      {heading:'Contact messages',paragraphs:['When you use the contact form, we store your name, email address and message in our database so we can reply.']},
      {heading:'Technical and security information',paragraphs:['To limit abuse, our server briefly keeps your IP address in memory when you sign in, register, send a message or use server background removal. Like most websites, our hosting infrastructure may also record standard request logs, such as IP address, browser type, requested page and time, for security and troubleshooting.']},
      {heading:'Cookies and browser storage',paragraphs:['We use one essential sign-in cookie, plus local storage and cache storage on your device for saved tools and AI models. The Cookie Policy has the details.']},
      {heading:'How we use information',paragraphs:['We use this information only to provide and secure your account, show your activity, reply to messages, prevent abuse and keep the service running. We do not sell your personal information.']},
      {heading:'Advertising and analytics',paragraphs:['Editgoo does not currently show ads or use analytics tools. If we introduce advertising such as Google AdSense, Google and its partners may use cookies or similar technologies to serve ads based on your visits to this and other websites. We will update this policy and provide consent choices where required before that starts. You can learn more at policies.google.com/technologies/ads.']},
      {heading:'How long we keep information',paragraphs:['Account details and activity records are kept until you ask us to delete your account. Sessions expire after 14 days or when you sign out. Contact messages are kept until we delete them after handling your request.']},
      {heading:'Your choices and rights',paragraphs:[`You can update your name and password in your dashboard. To ask for a copy, correction or deletion of your personal information, or to delete your account, ${contactRoute}. Depending on where you live, you may have additional rights under local privacy law.`]},
      {heading:'Children',paragraphs:['Editgoo is not directed at children under 13, and we do not knowingly collect their personal information.']},
      {heading:'Changes to this policy',paragraphs:['If we change how we handle information, we will update this page and the date at the top.']},
    ]},
  terms:{
    eyebrow:'TERMS AND CONDITIONS',title:'Terms and Conditions.',metaTitle:'Terms and Conditions',updated:POLICY_UPDATED,
    subtitle:'The rules for using Editgoo and its online tools.',
    description:'The terms and conditions for using Editgoo, including acceptable use, your files, accounts, output accuracy and limitations.',
    blocks:[
      {heading:'About these terms',paragraphs:[`${operatedBy} By using the website you agree to these terms. If you do not agree, please do not use Editgoo.`]},
      {heading:'Using the tools',paragraphs:['Editgoo tools are currently free to use. Paid plans are not available, and no payment is taken. We may add, change or remove tools and features, and the service may sometimes be unavailable.']},
      {heading:'Your files',paragraphs:['You keep all rights to your files. Only process files that you own or have permission to use. Most tools process files in your browser; when the background remover uses our server, we process your image only to return the result to you.']},
      {heading:'Acceptable use',paragraphs:['You must not:'],list:['Use Editgoo for anything illegal, or to process content you have no right to use.','Try to disrupt, overload or gain unauthorised access to the service or other users\' accounts.','Use automated means to scrape the website or use the tools at a volume that harms the service.']},
      {heading:'Accounts',paragraphs:['Give accurate information when you register and keep your password secure. You are responsible for activity on your account. We may suspend or close accounts that break these terms.']},
      {heading:'Check your results',paragraphs:['File conversion and editing can change formatting, fonts, images, metadata or structure, and each tool lists its known limitations. Always review results before relying on them, and keep your original files.']},
      {heading:'No warranty',paragraphs:['Editgoo is provided "as is" and "as available", without warranties of any kind, to the extent permitted by law. We do not guarantee that every tool will work with every file or that the service will be uninterrupted.']},
      {heading:'Limitation of liability',paragraphs:['To the extent permitted by law, the operator of Editgoo is not liable for indirect or consequential losses, or for loss of data or files, arising from your use of the service. Nothing in these terms limits liability that cannot be limited by law.']},
      {heading:'Changes and contact',paragraphs:[`We may update these terms; the date at the top shows the latest version. For questions, ${contactRoute}.`]},
    ]},
};

export const sectionIds=[...Object.keys(catalogSections),...componentSections,...Object.keys(contentPages)];
export function isSection(id:string){return sectionIds.includes(id)}
