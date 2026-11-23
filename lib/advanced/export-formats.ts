// Cutout export in several file formats, at the image's own resolution.
import {composeCutout,type Cutout} from '@/lib/advanced/image-editor';

export type ExportFormat='png'|'webp'|'jpg'|'jpeg'|'bmp'|'pdf';
export const EXPORT_FORMATS:{id:ExportFormat;label:string;transparent:boolean;mime:string}[]=[
  {id:'png',label:'PNG',transparent:true,mime:'image/png'},
  {id:'webp',label:'WebP',transparent:true,mime:'image/webp'},
  {id:'jpg',label:'JPG',transparent:false,mime:'image/jpeg'},
  {id:'jpeg',label:'JPEG',transparent:false,mime:'image/jpeg'},
  {id:'bmp',label:'BMP',transparent:false,mime:'image/bmp'},
  {id:'pdf',label:'PDF',transparent:true,mime:'application/pdf'},
];

function toBlob(canvas:HTMLCanvasElement,type:string,quality?:number){
  return new Promise<Blob>((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('Export failed. Try PNG or a smaller image.')),type,quality));
}

/** Formats without transparency: paint the chosen background colour (white by default) behind the cutout. */
function flatten(rendered:HTMLCanvasElement,color:string){
  const canvas=document.createElement('canvas');canvas.width=rendered.width;canvas.height=rendered.height;
  const ctx=canvas.getContext('2d')!;ctx.fillStyle=color||'#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(rendered,0,0);
  return canvas;
}

/** Uncompressed 24-bit BMP (browsers cannot encode BMP themselves). */
export function encodeBmp(rgba:Uint8ClampedArray,width:number,height:number){
  const row=Math.ceil(width*3/4)*4,size=54+row*height,buffer=new ArrayBuffer(size),view=new DataView(buffer),bytes=new Uint8Array(buffer);
  bytes[0]=0x42;bytes[1]=0x4d;view.setUint32(2,size,true);view.setUint32(10,54,true);view.setUint32(14,40,true);
  view.setInt32(18,width,true);view.setInt32(22,height,true);view.setUint16(26,1,true);view.setUint16(28,24,true);
  view.setUint32(34,row*height,true);view.setInt32(38,2835,true);view.setInt32(42,2835,true); // 72 dpi
  for(let y=0;y<height;y++){
    const o=54+(height-1-y)*row; // BMP rows are stored bottom-up, as BGR
    for(let x=0;x<width;x++){const i=(y*width+x)*4;bytes[o+x*3]=rgba[i+2];bytes[o+x*3+1]=rgba[i+1];bytes[o+x*3+2]=rgba[i]}
  }
  return new Blob([buffer],{type:'image/bmp'});
}

export async function exportCutout(state:Cutout,format:ExportFormat):Promise<Blob>{
  const rendered=composeCutout(state);
  switch(format){
    case 'png':return toBlob(rendered,'image/png');
    case 'webp':{
      const blob=await toBlob(rendered,'image/webp',.95);
      if(blob.type!=='image/webp')throw Error('This browser cannot create WebP files. Choose PNG instead.');
      return blob;
    }
    case 'jpg':case 'jpeg':return toBlob(flatten(rendered,state.color),'image/jpeg',.92);
    case 'bmp':{const flat=flatten(rendered,state.color);return encodeBmp(flat.getContext('2d')!.getImageData(0,0,flat.width,flat.height).data,flat.width,flat.height)}
    case 'pdf':{
      // One page at the image size (96 px = 1 inch); the PNG keeps its transparency inside the PDF.
      const {PDFDocument}=await import('pdf-lib');
      const doc=await PDFDocument.create();
      const png=await doc.embedPng(new Uint8Array(await (await toBlob(rendered,'image/png')).arrayBuffer()));
      const width=rendered.width*.75,height=rendered.height*.75;
      doc.addPage([width,height]).drawImage(png,{x:0,y:0,width,height});
      return new Blob([new Uint8Array(await doc.save())],{type:'application/pdf'});
    }
  }
}
