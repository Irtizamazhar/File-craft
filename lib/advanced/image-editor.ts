import {validateInput} from '@/lib/browser-engine';
// foreground: optional RGBA with background colour removed from semi-transparent edge pixels
// (same size as source); other pixels equal the source, so Restore still shows the original.
// segmented: true once the background has been removed (kept through later edits; false for a freshly loaded image).
export type Cutout={source:ImageData;alpha:Uint8ClampedArray;color:string;background?:HTMLCanvasElement;foreground?:Uint8ClampedArray;segmented?:boolean};
export function canvasFrom(data:ImageData){const canvas=document.createElement('canvas');canvas.width=data.width;canvas.height=data.height;canvas.getContext('2d')!.putImageData(data,0,0);return canvas}
/**
 * Largest image, in pixels, the editor processes at full resolution. Bigger photos are not rejected: they are
 * scaled down to this size when opened. Edge refinement needs roughly 60-80 bytes per pixel across the page and
 * its worker, so the budget follows the device: computers 16 MP (a 12 MP phone photo stays full size), phones
 * and low-memory devices less. iOS Safari also refuses canvases above 16.7 MP.
 */
export function editorPixelBudget(){
  const memory=(navigator as Navigator&{deviceMemory?:number}).deviceMemory; // GB; Chromium only, reports at most 8
  if(memory!==undefined)return memory>=8?16_000_000:memory>=4?12_600_000:8_000_000;
  return matchMedia('(pointer: coarse)').matches?8_000_000:16_000_000;
}
export type EditorImage={image:ImageData;original:{width:number;height:number}};
/** Decodes a JPG/PNG/WebP for the editor, scaling it down only when it is larger than editorPixelBudget(). */
export async function readEditorImage(file:File):Promise<EditorImage>{
  if(!/\.(jpe?g|png|webp)$/i.test(file.name)||!file.size||file.size>15*1048576)throw Error('Choose a valid JPG, PNG or WebP up to 15 MB.');
  await validateInput(file);
  const bitmap=await createImageBitmap(file);
  try{
    const original={width:bitmap.width,height:bitmap.height},scale=Math.min(1,Math.sqrt(editorPixelBudget()/(original.width*original.height)));
    const width=Math.max(1,Math.floor(original.width*scale)),height=Math.max(1,Math.floor(original.height*scale));
    const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
    const ctx=canvas.getContext('2d')!;ctx.imageSmoothingQuality='high';ctx.drawImage(bitmap,0,0,width,height);
    return {image:ctx.getImageData(0,0,width,height),original};
  }finally{bitmap.close()}
}
export function composeCutout(state:Cutout,comparison=0){const {source,alpha,color,background,foreground}=state;const data=new ImageData(new Uint8ClampedArray(foreground&&foreground.length===source.data.length?foreground:source.data),source.width,source.height);for(let i=0;i<alpha.length;i++)data.data[i*4+3]=Math.round(source.data[i*4+3]*alpha[i]/255);const canvas=canvasFrom(data),ctx=canvas.getContext('2d')!;ctx.globalCompositeOperation='destination-over';if(background){const factor=Math.max(canvas.width/background.width,canvas.height/background.height);ctx.drawImage(background,(canvas.width-background.width*factor)/2,(canvas.height-background.height*factor)/2,background.width*factor,background.height*factor)}else if(color){ctx.fillStyle=color;ctx.fillRect(0,0,canvas.width,canvas.height)}ctx.globalCompositeOperation='source-over';if(comparison>0){ctx.save();ctx.beginPath();ctx.rect(0,0,canvas.width*comparison/100,canvas.height);ctx.clip();ctx.drawImage(canvasFrom(source),0,0);ctx.restore();ctx.fillStyle='#f04457';ctx.fillRect(canvas.width*comparison/100-1,0,2,canvas.height)}return canvas}
export function transformCutout(state:Cutout,kind:'crop'|'resize'|'rotate',values:number[]):Cutout{const {source,alpha}=state;const [a,b,c,d]=values;const width=kind==='crop'?c:kind==='resize'?a:source.height,height=kind==='crop'?d:kind==='resize'?b:source.width;const budget=editorPixelBudget();if(![width,height].every(n=>Number.isInteger(n)&&n>0)||width*height>budget)throw Error(`Use positive integer dimensions up to ${Math.floor(budget/1e6)} megapixels on this device.`);if(kind==='crop'&&(a<0||b<0||a+c>source.width||b+d>source.height))throw Error('The crop must stay inside the current image.');const matte=new ImageData(source.width,source.height);for(let i=0;i<alpha.length;i++){matte.data[i*4]=matte.data[i*4+1]=matte.data[i*4+2]=255;matte.data[i*4+3]=alpha[i]}const result:ImageData[]=[];const images=[source,matte];if(state.foreground&&state.foreground.length===source.data.length)images.push(new ImageData(new Uint8ClampedArray(state.foreground),source.width,source.height));for(const image of images){const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d')!;if(kind==='crop')ctx.drawImage(canvasFrom(image),a,b,c,d,0,0,width,height);else if(kind==='resize')ctx.drawImage(canvasFrom(image),0,0,width,height);else{ctx.translate(width,0);ctx.rotate(Math.PI/2);ctx.drawImage(canvasFrom(image),0,0)}result.push(ctx.getImageData(0,0,width,height))}const next=new Uint8ClampedArray(width*height);for(let i=0;i<next.length;i++)next[i]=result[1].data[i*4+3];return {...state,source:result[0],alpha:next,foreground:result[2]?.data}}
