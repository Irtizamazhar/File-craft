// Soft-matte post-processing shared by both engines (server BiRefNet 1024 and the in-browser
// BiRefNet Lite 512 fallback). Pure functions on full-resolution typed arrays; alpha is 0..1.

export type Box={x:number;y:number;w:number;h:number};

/** Where a width×height image lands inside a size×size letterbox: aspect ratio kept, centred. */
export function letterbox(width:number,height:number,size:number):Box{
  const scale=size/Math.max(width,height);
  const w=Math.max(1,Math.round(width*scale)),h=Math.max(1,Math.round(height*scale));
  return {x:Math.floor((size-w)/2),y:Math.floor((size-h)/2),w,h};
}

/**
 * Per-axis resampling weights from source range [start, start+len) to `out` samples: linear interpolation
 * when enlarging, area averaging when shrinking (point sampling would alias edges into jagged steps).
 */
function axisWeights(start:number,len:number,out:number){
  const taps:{index:Int32Array;weight:Float32Array}[]=[];const scale=len/out,last=start+len-1;
  for(let o=0;o<out;o++){
    if(scale<=1){
      const s=Math.min(last,Math.max(start,start+(o+.5)*scale-.5)),i0=Math.floor(s),i1=Math.min(last,i0+1),f=s-i0;
      taps.push({index:Int32Array.from([i0,i1]),weight:Float32Array.from([1-f,f])});
    }else{
      const a=start+o*scale,b=a+scale,index:number[]=[],weight:number[]=[];
      for(let i=Math.floor(a);i<Math.ceil(b);i++){const w=Math.min(b,i+1)-Math.max(a,i);if(w>0){index.push(Math.min(last,i));weight.push(w/scale)}}
      taps.push({index:Int32Array.from(index),weight:Float32Array.from(weight)});
    }
  }
  return taps;
}

/** Resamples the `box` region of a sw×sh matte to outW×outH (crops the letterbox padding, no aliasing). */
export function resizeMatte(src:Float32Array,sw:number,sh:number,box:Box,outW:number,outH:number){
  if(src.length!==sw*sh)throw Error('Matte dimensions do not match.');
  const xs=axisWeights(box.x,box.w,outW),ys=axisWeights(box.y,box.h,outH);
  const rows=new Float32Array(sh*outW);
  for(let y=box.y;y<box.y+box.h;y++){const r=y*sw,o=y*outW;for(let x=0;x<outW;x++){const t=xs[x];let v=0;for(let k=0;k<t.index.length;k++)v+=src[r+t.index[k]]*t.weight[k];rows[o+x]=v}}
  const out=new Float32Array(outW*outH);
  for(let y=0;y<outH;y++){const t=ys[y],o=y*outW;for(let k=0;k<t.index.length;k++){const r=t.index[k]*outW,w=t.weight[k];for(let x=0;x<outW;x++)out[o+x]+=rows[r+x]*w}}
  return out;
}

/** Mean over a (2r+1)² window, normalised by the number of in-image samples. O(n) for any radius. */
export function boxMean(src:Float32Array,w:number,h:number,r:number,out=new Float32Array(src.length)){
  if(r<1){out.set(src);return out}
  const tmp=new Float32Array(src.length);
  for(let y=0;y<h;y++){
    const row=y*w;let sum=0,lo=0,hi=-1;
    for(let x=0;x<w;x++){
      const nh=Math.min(w-1,x+r),nl=Math.max(0,x-r);
      while(hi<nh)sum+=src[row+ ++hi];
      while(lo<nl)sum-=src[row+lo++];
      tmp[row+x]=sum/(hi-lo+1);
    }
  }
  const col=new Float64Array(w);let lo=0,hi=-1;
  for(let y=0;y<h;y++){
    const nh=Math.min(h-1,y+r),nl=Math.max(0,y-r);
    while(hi<nh){const o=++hi*w;for(let x=0;x<w;x++)col[x]+=tmp[o+x]}
    while(lo<nl){const o=lo++*w;for(let x=0;x<w;x++)col[x]-=tmp[o+x]}
    const inv=1/(hi-lo+1),o=y*w;for(let x=0;x<w;x++)out[o+x]=col[x]*inv;
  }
  return out;
}

/** Block-average downsample of RGB guide (0..1) and alpha by an integer factor s. */
function downsample(rgba:Uint8ClampedArray,alpha:Float32Array,w:number,h:number,s:number){
  const lw=Math.ceil(w/s),lh=Math.ceil(h/s),n=lw*lh;
  const R=new Float32Array(n),G=new Float32Array(n),B=new Float32Array(n),P=new Float32Array(n),count=new Float32Array(n);
  for(let y=0;y<h;y++){const ly=Math.floor(y/s)*lw;for(let x=0;x<w;x++){const i=y*w+x,j=ly+Math.floor(x/s);R[j]+=rgba[i*4];G[j]+=rgba[i*4+1];B[j]+=rgba[i*4+2];P[j]+=alpha[i];count[j]++}}
  for(let j=0;j<n;j++){const c=count[j];R[j]/=255*c;G[j]/=255*c;B[j]/=255*c;P[j]/=c}
  return {lw,lh,R,G,B,P};
}

/**
 * Edge-aware refinement: a colour guided filter (He et al.) fitted at ~model resolution and applied
 * with the full-resolution image ("fast guided filter"), so mask edges follow the real object edges
 * instead of a blurry upscale. It only changes a narrow band around the subject boundary; confident
 * foreground/background, holes and see-through areas keep the model's prediction.
 */
export function guidedRefine(alpha:Float32Array,rgba:Uint8ClampedArray,w:number,h:number,options:{scale:number;radius:number;eps:number;band?:number}){
  const s=Math.max(1,Math.round(options.scale)),r=Math.max(1,Math.round(options.radius)),eps=options.eps;
  const {lw,lh,R,G,B,P}=downsample(rgba,alpha,w,h,s),n=lw*lh;
  const mean=(a:Float32Array)=>boxMean(a,lw,lh,r);
  const product=(a:Float32Array,b:Float32Array)=>{const o=new Float32Array(n);for(let i=0;i<n;i++)o[i]=a[i]*b[i];return o};
  const mR=mean(R),mG=mean(G),mB=mean(B),mP=mean(P);
  const cRP=mean(product(R,P)),cGP=mean(product(G,P)),cBP=mean(product(B,P));
  const vRR=mean(product(R,R)),vRG=mean(product(R,G)),vRB=mean(product(R,B)),vGG=mean(product(G,G)),vGB=mean(product(G,B)),vBB=mean(product(B,B));
  const aR=new Float32Array(n),aG=new Float32Array(n),aB=new Float32Array(n),b=new Float32Array(n);
  for(let i=0;i<n;i++){
    const rr=vRR[i]-mR[i]*mR[i]+eps,rg=vRG[i]-mR[i]*mG[i],rb=vRB[i]-mR[i]*mB[i],gg=vGG[i]-mG[i]*mG[i]+eps,gb=vGB[i]-mG[i]*mB[i],bb=vBB[i]-mB[i]*mB[i]+eps;
    const pr=cRP[i]-mR[i]*mP[i],pg=cGP[i]-mG[i]*mP[i],pb=cBP[i]-mB[i]*mP[i];
    // Inverse of the symmetric 3×3 covariance (+eps·I) via cofactors.
    const c00=gg*bb-gb*gb,c01=rb*gb-rg*bb,c02=rg*gb-rb*gg,c11=rr*bb-rb*rb,c12=rb*rg-rr*gb,c22=rr*gg-rg*rg;
    const det=rr*c00+rg*c01+rb*c02,inv=Math.abs(det)>1e-12?1/det:0;
    aR[i]=(c00*pr+c01*pg+c02*pb)*inv;aG[i]=(c01*pr+c11*pg+c12*pb)*inv;aB[i]=(c02*pr+c12*pg+c22*pb)*inv;
    b[i]=mP[i]-aR[i]*mR[i]-aG[i]*mG[i]-aB[i]*mB[i];
  }
  const AR=mean(aR),AG=mean(aG),AB=mean(aB),BB=mean(b);
  // Band weight: 0 where the neighbourhood is purely foreground or background, 1 around boundaries.
  // Contrast weight: where the guide has little colour variation (a dark tyre on a dark road) the filter
  // degenerates into a blur, so the model's own edge is kept there; the image is followed only where
  // foreground and background colours actually differ (hair against sky, car against road).
  const neighbourhood=boxMean(P,lw,lh,Math.max(1,Math.round(options.band??r*2)));
  const weight=new Float32Array(n);
  for(let i=0;i<n;i++){
    const m=neighbourhood[i],band=Math.min(1,Math.min(m,1-m)/.04);
    const trace=vRR[i]-mR[i]*mR[i]+vGG[i]-mG[i]*mG[i]+vBB[i]-mB[i]*mB[i];
    weight[i]=band*Math.min(1,Math.max(0,(trace-.002)/.008));
  }
  const out=new Float32Array(w*h);
  const x0=new Int32Array(w),x1=new Int32Array(w),fx=new Float32Array(w);
  for(let x=0;x<w;x++){const sx=Math.min(lw-1,Math.max(0,(x+.5)/s-.5));x0[x]=Math.floor(sx);x1[x]=Math.min(lw-1,x0[x]+1);fx[x]=sx-x0[x]}
  const lerp=(m:Float32Array,r0:number,r1:number,x:number,fy:number)=>{const t=m[r0+x0[x]]+(m[r0+x1[x]]-m[r0+x0[x]])*fx[x],u=m[r1+x0[x]]+(m[r1+x1[x]]-m[r1+x0[x]])*fx[x];return t+(u-t)*fy};
  for(let y=0;y<h;y++){
    const sy=Math.min(lh-1,Math.max(0,(y+.5)/s-.5)),y0=Math.floor(sy),r0=y0*lw,r1=Math.min(lh-1,y0+1)*lw,fy=sy-y0;
    for(let x=0;x<w;x++){
      const i=y*w+x,a=alpha[i],wt=lerp(weight,r0,r1,x,fy);
      if(wt<=0){out[i]=a;continue}
      const q=lerp(AR,r0,r1,x,fy)*rgba[i*4]/255+lerp(AG,r0,r1,x,fy)*rgba[i*4+1]/255+lerp(AB,r0,r1,x,fy)*rgba[i*4+2]/255+lerp(BB,r0,r1,x,fy);
      out[i]=a+wt*(Math.min(1,Math.max(0,q))-a);
    }
  }
  return out;
}

function label(mask:Uint8Array,w:number,h:number){
  const labels=new Int32Array(mask.length).fill(-1),queue=new Int32Array(mask.length);
  const areas:number[]=[],boxes:[number,number,number,number][]=[];
  for(let seed=0;seed<mask.length;seed++){
    if(!mask[seed]||labels[seed]>=0)continue;
    const id=areas.length;let head=0,tail=1,x0=w,y0=h,x1=0,y1=0;queue[0]=seed;labels[seed]=id;
    while(head<tail){
      const i=queue[head++],x=i%w,y=(i-x)/w;
      if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
        const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=w||yy>=h)continue;
        const j=yy*w+xx;if(mask[j]&&labels[j]<0){labels[j]=id;queue[tail++]=j}
      }
    }
    areas.push(tail);boxes.push([x0,y0,x1,y1]);
  }
  return {labels,areas,boxes};
}

const gap=(a:[number,number,number,number],b:[number,number,number,number])=>Math.max(0,a[0]-b[2],b[0]-a[2],a[1]-b[3],b[1]-a[3]);

/**
 * Removes stray blobs that are small AND far from every large subject region. Large secondary
 * subjects and small parts near the subject (mirrors, wheels, hands, straps) are kept; holes are
 * never filled. Works in place and returns the number of cleared pixels.
 */
export function removeStrayRegions(alpha:Float32Array,w:number,h:number,options:{largeRatio?:number;gapRatio?:number}={}){
  const core=new Uint8Array(alpha.length);for(let i=0;i<alpha.length;i++)core[i]=alpha[i]>=.5?1:0;
  const cores=label(core,w,h);if(!cores.areas.length)return 0;
  const main=cores.areas.reduce((a,b)=>a>b?a:b,0),limit=main*(options.largeRatio??.1),maxGap=Math.hypot(w,h)*(options.gapRatio??.02);
  const large=cores.boxes.filter((_,id)=>cores.areas[id]>=limit);
  const near=(box:[number,number,number,number])=>large.some(l=>gap(box,l)<=maxGap);
  const keepCore=cores.areas.map((area,id)=>area>=limit||near(cores.boxes[id]));
  // Soft halos belong to the core they surround: decide per low-threshold support region.
  const support=new Uint8Array(alpha.length);for(let i=0;i<alpha.length;i++)support[i]=alpha[i]>.02?1:0;
  const regions=label(support,w,h);const keepRegion=new Uint8Array(regions.areas.length);const hasCore=new Uint8Array(regions.areas.length);
  for(let i=0;i<alpha.length;i++){const c=cores.labels[i];if(c<0)continue;const r=regions.labels[i];hasCore[r]=1;if(keepCore[c])keepRegion[r]=1}
  for(let r=0;r<regions.areas.length;r++)if(!hasCore[r]&&near(regions.boxes[r]))keepRegion[r]=1;
  let removed=0;
  for(let i=0;i<alpha.length;i++){const r=regions.labels[i];if(r>=0&&!keepRegion[r]){alpha[i]=0;removed++}}
  return removed;
}

/**
 * Edge colour decontamination ("Approximate Fast Foreground Colour Estimation", Forte & Pitié 2021):
 * estimates the true foreground colour of semi-transparent pixels so the old background does not
 * bleed into hair and edges. Returns RGBA; pixels that are fully opaque or transparent keep their
 * original colours (so the Restore brush still shows the original image there).
 */
export function estimateForeground(rgba:Uint8ClampedArray,alpha:Float32Array,w:number,h:number){
  const out=new Uint8ClampedArray(rgba);
  let x0=w,y0=h,x1=-1,y1=-1;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const a=alpha[y*w+x];if(a>.002&&a<.998){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}}
  if(x1<0)return out;
  const r1=Math.max(8,Math.round(Math.max(w,h)/40)),r2=3,m=r1*2;
  x0=Math.max(0,x0-m);y0=Math.max(0,y0-m);x1=Math.min(w-1,x1+m);y1=Math.min(h-1,y1+m);
  const cw=x1-x0+1,ch=y1-y0+1,n=cw*ch;
  const a=new Float32Array(n),inv=new Float32Array(n);
  for(let y=0;y<ch;y++)for(let x=0;x<cw;x++){const v=alpha[(y+y0)*w+x+x0];a[y*cw+x]=v;inv[y*cw+x]=1-v}
  const a1=boxMean(a,cw,ch,r1),a2=boxMean(a,cw,ch,r2);
  const I=new Float32Array(n),tmp=new Float32Array(n),fb=new Float32Array(n),bb=new Float32Array(n),f1=new Float32Array(n);
  for(let c=0;c<3;c++){
    for(let y=0;y<ch;y++)for(let x=0;x<cw;x++)I[y*cw+x]=rgba[((y+y0)*w+x+x0)*4+c]/255;
    // Pass 1 (large radius): F = B = I.
    for(let i=0;i<n;i++)tmp[i]=I[i]*a[i];boxMean(tmp,cw,ch,r1,fb);
    for(let i=0;i<n;i++)tmp[i]=I[i]*inv[i];boxMean(tmp,cw,ch,r1,bb);
    for(let i=0;i<n;i++){const F=fb[i]/(a1[i]+1e-5),Bv=bb[i]/(1-a1[i]+1e-5);bb[i]=Bv;f1[i]=Math.min(1,Math.max(0,F+a[i]*(I[i]-a[i]*F-inv[i]*Bv)))}
    // Pass 2 (small radius) refines using the pass-1 estimates.
    for(let i=0;i<n;i++)tmp[i]=f1[i]*a[i];boxMean(tmp,cw,ch,r2,fb);
    for(let i=0;i<n;i++)tmp[i]=bb[i]*inv[i];boxMean(tmp,cw,ch,r2,f1);
    for(let y=0;y<ch;y++)for(let x=0;x<cw;x++){
      const i=y*cw+x,v=a[i];if(v<=.002||v>=.998)continue;
      const F=fb[i]/(a2[i]+1e-5),Bv=f1[i]/(1-a2[i]+1e-5);
      out[((y+y0)*w+x+x0)*4+c]=Math.round(255*Math.min(1,Math.max(0,F+v*(I[i]-v*F-(1-v)*Bv))));
    }
  }
  return out;
}

/**
 * Final matte clean-up against the faint light haze ("white shade") around cut-out subjects.
 * 1. The guided filter can follow background texture (clouds, gradients) and add faint alpha where the model was
 *    confident it saw background. Refinement may still sharpen real edges, but it may not raise alpha where the
 *    model's value is below `backgroundMax`.
 * 2. Levels: alpha at or below `low` becomes fully transparent and at or above `high` fully opaque; values in
 *    between are stretched linearly around 0.5, so hair and soft edges keep their gradient.
 * Works in place on the refined matte; `model` is the model's matte at the same resolution.
 */
export function cleanMatte(alpha:Float32Array,model:Float32Array,options:{backgroundMax?:number;low?:number;high?:number}={}){
  if(alpha.length!==model.length)throw Error('Matte dimensions do not match.');
  const backgroundMax=options.backgroundMax??.05,low=options.low??.04,high=options.high??.96,span=high-low;
  for(let i=0;i<alpha.length;i++){
    let a=alpha[i];
    if(model[i]<backgroundMax&&a>model[i])a=model[i];
    alpha[i]=Math.min(1,Math.max(0,(a-low)/span));
  }
  return alpha;
}

/** Full pipeline after the model: edge-aware refinement, haze clean-up, stray-blob cleanup, colour decontamination. */
export function finishMatte(rgba:Uint8ClampedArray,raw:Float32Array,w:number,h:number,modelSize:number){
  const scale=Math.max(1,Math.round(Math.max(w,h)/modelSize));
  const refined=guidedRefine(raw,rgba,w,h,{scale,radius:2,eps:1e-3});
  cleanMatte(refined,raw);
  const removed=removeStrayRegions(refined,w,h);
  const foreground=estimateForeground(rgba,refined,w,h);
  const alpha=new Uint8ClampedArray(w*h);for(let i=0;i<alpha.length;i++)alpha[i]=Math.round(refined[i]*255);
  return {alpha,foreground,removed};
}
