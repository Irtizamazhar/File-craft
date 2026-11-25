/**
 * Returns a URL that the browser will accept as a JavaScript module, for dynamic import() or
 * `new Worker(url, {type:'module'})`.
 *
 * Browsers only run module scripts served with a JavaScript MIME type. Some hosts label .mjs files as
 * text/plain (Hostinger's static file server does), which breaks the PDF.js worker and the ONNX Runtime
 * loader with "Failed to fetch dynamically imported module". Fetching the file as data has no MIME
 * requirement, so the text is re-wrapped in a Blob typed text/javascript. This works on any host, and
 * each file is downloaded once per page or worker.
 *
 * Note for a future Content-Security-Policy: script-src and worker-src must allow blob:.
 */
const urls=new Map<string,Promise<string>>();

export function moduleUrl(path:string):Promise<string>{
  const href=new URL(path,self.location.href).href;
  let url=urls.get(href);
  if(!url){
    url=fetch(href).then(async response=>{
      if(!response.ok)throw new Error(`A required engine file could not be loaded (HTTP ${response.status} for ${new URL(href).pathname}).`);
      return URL.createObjectURL(new Blob([await response.text()],{type:'text/javascript'}));
    });
    url.catch(()=>urls.delete(href));
    urls.set(href,url);
  }
  return url;
}
