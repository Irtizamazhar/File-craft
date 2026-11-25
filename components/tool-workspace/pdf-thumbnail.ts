'use client';
import {moduleUrl} from '@/lib/module-url';

export type PdfThumbnail={src:string;width:number;height:number;pages:number};

// One render at a time keeps memory flat when many PDFs are added; results are cached per file object.
const cache=new WeakMap<Blob,Promise<PdfThumbnail>>();
let queue:Promise<unknown>=Promise.resolve();

/** First-page thumbnail and page count of a PDF, rendered with the site's existing PDF.js setup. */
export function pdfThumbnail(file:Blob,maxSide=320):Promise<PdfThumbnail>{
  let job=cache.get(file);
  if(!job){
    job=queue.then(()=>render(file,maxSide));
    queue=job.catch(()=>undefined);
    cache.set(file,job);
  }
  return job;
}

async function render(file:Blob,maxSide:number):Promise<PdfThumbnail>{
  const pdfjs=await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc=await moduleUrl('/pdf.worker.min.mjs');
  const doc=await pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer()),useSystemFonts:true}).promise;
  try{
    const page=await doc.getPage(1);
    const base=page.getViewport({scale:1});
    const viewport=page.getViewport({scale:Math.min(2,maxSide/Math.max(base.width,base.height))});
    const canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.ceil(viewport.width));canvas.height=Math.max(1,Math.ceil(viewport.height));
    const context=canvas.getContext('2d');
    if(!context)throw new Error('Canvas is unavailable.');
    await page.render({canvasContext:context,viewport,background:'rgb(255,255,255)'}).promise;
    return {src:canvas.toDataURL('image/png'),width:canvas.width,height:canvas.height,pages:doc.numPages};
  }finally{await doc.destroy()}
}
