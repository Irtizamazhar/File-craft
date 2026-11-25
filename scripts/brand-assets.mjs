// Regenerates every Editgoo logo asset from the supplied logo image (docs/brand/editgoo-logo-source.png).
// Usage: node scripts/brand-assets.mjs [source.png]
// The source is the stacked logo on a white background: ribbon/document icon on top, "editgoo" wordmark below.
import sharp from 'sharp';
import {mkdirSync} from 'node:fs';
import {dirname,join} from 'node:path';

const SRC=process.argv[2]||'docs/brand/editgoo-logo-source.png';
const OUT='public';
const SPLIT_Y=576;                 // icon above this source row, wordmark below it
const RED={r:226,g:39,b:45};       // logo red, used for the social preview accents
const PNG={compressionLevel:9,adaptiveFiltering:true};
const out=rel=>{const p=join(OUT,rel);mkdirSync(dirname(p),{recursive:true});return p};
const raw=(buf,w,h)=>sharp(buf,{raw:{width:w,height:h,channels:4}});

const {data:S,info}=await sharp(SRC).removeAlpha().raw().toBuffer({resolveWithObject:true});
const W=info.width,H=info.height;

// 1. White background to transparency. Near-white pixels become transparent; pixels on the anti-aliased rim
//    take alpha from how far they moved from white towards the solid colour just inside the shape.
const isBg=i=>Math.min(S[i],S[i+1],S[i+2])>=248;
const bg=new Uint8Array(W*H);for(let k=0;k<W*H;k++)bg[k]=isBg(k*3)?1:0;
const nearBg=new Uint8Array(W*H);
for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(bg[y*W+x])continue;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const xx=x+dx,yy=y+dy;if(xx>=0&&yy>=0&&xx<W&&yy<H&&bg[yy*W+xx]){nearBg[y*W+x]=1;dy=3;break}}}
const A=Buffer.alloc(W*H*4);
for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  const k=y*W+x,s=k*3,d=k*4;
  if(bg[k]){A[d+3]=0;continue}
  if(!nearBg[k]){A[d]=S[s];A[d+1]=S[s+1];A[d+2]=S[s+2];A[d+3]=255;continue}
  // Interior colour: mean of nearby core (not rim, not background) pixels.
  let r=0,g=0,b=0,n=0;
  for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++){const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=W||yy>=H)continue;const kk=yy*W+xx;if(bg[kk]||nearBg[kk])continue;const ss=kk*3;r+=S[ss];g+=S[ss+1];b+=S[ss+2];n++}
  const c=n?[r/n,g/n,b/n]:[S[s],S[s+1],S[s+2]];
  let ch=0;for(let q=1;q<3;q++)if(255-c[q]>255-c[ch])ch=q;
  const a=255-c[ch]<8?1:Math.min(1,Math.max(0,(255-S[s+ch])/(255-c[ch])));
  if(a<.03){A[d+3]=0;continue}
  A[d]=Math.round(c[0]);A[d+1]=Math.round(c[1]);A[d+2]=Math.round(c[2]);A[d+3]=Math.round(a*255);
}

const bbox=(y0,y1,keep=()=>true)=>{let a=W,b=H,c=-1,e=-1;for(let y=y0;y<=y1;y++)for(let x=0;x<W;x++)if(A[(y*W+x)*4+3]>8&&keep(x,y)){a=Math.min(a,x);b=Math.min(b,y);c=Math.max(c,x);e=Math.max(e,y)}return {x:a,y:b,w:c-a+1,h:e-b+1}};
const crop=async(box,pad=0)=>{const buf=Buffer.alloc((box.w+2*pad)*(box.h+2*pad)*4);for(let y=0;y<box.h;y++)A.copy(buf,((y+pad)*(box.w+2*pad)+pad)*4,((box.y+y)*W+box.x)*4,((box.y+y)*W+box.x+box.w)*4);return raw(buf,box.w+2*pad,box.h+2*pad).png().toBuffer()};

// 2. Pieces: icon (with sparkles), wordmark, and the icon's main shape alone (largest connected component).
const iconBox=bbox(0,SPLIT_Y),wordBox=bbox(SPLIT_Y,H-1),fullBox=bbox(0,H-1);
const icon=await crop(iconBox),word=await crop(wordBox);
const label=new Int32Array(W*H).fill(-1),sizes=[];
for(let y=0;y<=SPLIT_Y;y++)for(let x=0;x<W;x++){const k=y*W+x;if(label[k]>=0||A[k*4+3]<=8)continue;const id=sizes.length,stack=[k];label[k]=id;let n=0;
  while(stack.length){const q=stack.pop();n++;const qx=q%W,qy=(q/W)|0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=qx+dx,yy=qy+dy;if(xx<0||yy<0||xx>=W||yy>SPLIT_Y)continue;const nk=yy*W+xx;if(label[nk]<0&&A[nk*4+3]>8){label[nk]=id;stack.push(nk)}}}
  sizes.push(n)}
const main=sizes.indexOf(Math.max(...sizes));
const shapeBox=bbox(0,SPLIT_Y,(x,y)=>label[y*W+x]===main);
const shapeOnly=Buffer.alloc(shapeBox.w*shapeBox.h*4);
for(let y=0;y<shapeBox.h;y++)for(let x=0;x<shapeBox.w;x++){const k=(shapeBox.y+y)*W+shapeBox.x+x;if(label[k]===main)A.copy(shapeOnly,(y*shapeBox.w+x)*4,k*4,k*4+4)}
const shape=await raw(shapeOnly,shapeBox.w,shapeBox.h).png().toBuffer();
console.log('icon',iconBox,'wordmark',wordBox,'main shape',shapeBox,'components',sizes.length);

// 3. Header/footer pieces and full logos.
await sharp(icon).resize({height:256,kernel:'lanczos3'}).png(PNG).toFile(out('brand/editgoo-icon.png'));
await sharp(word).resize({height:180,kernel:'lanczos3'}).png(PNG).toFile(out('brand/editgoo-wordmark.png'));
await sharp(await crop(fullBox,24)).png(PNG).toFile(out('brand/editgoo-logo-square.png'));
const iconH=200,iconW=Math.round(iconBox.w*iconH/iconBox.h),wordH=Math.round(iconH*.64),wordW=Math.round(wordBox.w*wordH/wordBox.h),gap=30;
const hW=iconW+gap+wordW,hH=iconH;
const horizontal=await sharp({create:{width:hW,height:hH,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([
  {input:await sharp(icon).resize({height:iconH}).png().toBuffer(),left:0,top:0},
  {input:await sharp(word).resize({height:wordH}).png().toBuffer(),left:iconW+gap,top:Math.round((hH-wordH)/2)},
]).png().toBuffer();
await sharp(horizontal).png(PNG).toFile(out('brand/editgoo-logo-horizontal.png'));

// 4. Square app icons from the main shape (sparkles are noise at 16-32 px).
const square=async(size,padRatio,background)=>{const inner=Math.round(size*(1-2*padRatio));const art=await sharp(shape).resize(inner,inner,{fit:'contain',background:{r:0,g:0,b:0,alpha:0},kernel:'lanczos3'}).png().toBuffer();return sharp({create:{width:size,height:size,channels:4,background}}).composite([{input:art,left:Math.round((size-inner)/2),top:Math.round((size-inner)/2)}]).png(PNG)};
const clear={r:0,g:0,b:0,alpha:0},white={r:255,g:255,b:255,alpha:1};
await (await square(32,.03,clear)).toFile(out('favicon-32.png'));
await (await square(192,.06,clear)).toFile(out('icon-192.png'));
await (await square(180,.14,white)).flatten({background:'#ffffff'}).toFile(out('apple-touch-icon.png'));

// 5. Social preview (Open Graph / Twitter), 1200x630.
const logoW=720,logoH=Math.round(hH*logoW/hW),top=150;
const backdrop=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
<defs><radialGradient id="g" cx="92%" cy="8%" r="70%"><stop offset="0" stop-color="#ffe6e6"/><stop offset="1" stop-color="#ffffff"/></radialGradient></defs>
<rect width="1200" height="630" fill="url(#g)"/><rect y="618" width="1200" height="12" fill="rgb(${RED.r},${RED.g},${RED.b})"/>
<text x="600" y="${top+logoH+92}" text-anchor="middle" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="44" font-weight="600" fill="#151a2d">Online tools for PDFs, images and documents</text>
<text x="600" y="${top+logoH+150}" text-anchor="middle" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="30" font-weight="600" fill="rgb(${RED.r},${RED.g},${RED.b})">www.editgoo.com</text></svg>`);
await sharp(backdrop).composite([{input:await sharp(horizontal).resize(logoW).png().toBuffer(),left:Math.round((1200-logoW)/2),top}]).flatten({background:'#ffffff'}).png(PNG).toFile(out('og-image.png'));
console.log('Brand assets written to public/: brand/editgoo-{icon,wordmark,logo-horizontal,logo-square}.png, favicon-32.png, icon-192.png, apple-touch-icon.png, og-image.png');
