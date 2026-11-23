import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
async function source(path){const code=ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;return import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'))}
const matte=await source('lib/advanced/matte.ts');

test('letterbox keeps the aspect ratio and centres the image',()=>{
  assert.deepEqual(matte.letterbox(1200,800,512),{x:0,y:85,w:512,h:341});
  assert.deepEqual(matte.letterbox(600,1200,1024),{x:256,y:0,w:512,h:1024});
});

test('resizeMatte crops the letterbox padding instead of stretching it into the image',()=>{
  const size=8,src=new Float32Array(size*size);
  for(let y=2;y<6;y++)for(let x=0;x<size;x++)src[y*size+x]=1; // content rows 2..5, padding 0 elsewhere
  const out=matte.resizeMatte(src,size,size,{x:0,y:2,w:8,h:4},16,8);
  assert.equal(out.length,16*8);
  assert.ok(out.every(v=>Math.abs(v-1)<1e-6),'no padding value leaks into the result');
});

test('resizeMatte averages when shrinking (no jagged aliasing) and interpolates when enlarging',()=>{
  const sw=20,sh=4,stripes=new Float32Array(sw*sh);for(let y=0;y<sh;y++)for(let x=0;x<sw;x++)stripes[y*sw+x]=x%2; // 1-px stripes
  const half=matte.resizeMatte(stripes,sw,sh,{x:0,y:0,w:sw,h:sh},10,2);
  assert.ok(half.every(v=>Math.abs(v-.5)<1e-6),'2× reduction of 1-px stripes is uniform 0.5, not aliased 0/1: '+half.slice(0,10));
  const edge=new Float32Array(30*1);for(let x=16;x<30;x++)edge[x]=1; // hard edge inside a 3-px block, reduced 3×
  const third=matte.resizeMatte(edge,30,1,{x:0,y:0,w:30,h:1},10,1);
  assert.deepEqual(Array.from(third,v=>+v.toFixed(3)),[0,0,0,0,0,.667,1,1,1,1],'the mixed block gets partial coverage');
  const up=matte.resizeMatte(Float32Array.from([0,1]),2,1,{x:0,y:0,w:2,h:1},4,1);
  assert.deepEqual(Array.from(up,v=>+v.toFixed(3)),[0,.25,.75,1]);
});

test('boxMean preserves constants and averages within the clipped window',()=>{
  const flat=new Float32Array(30).fill(.25);assert.ok(matte.boxMean(flat,6,5,2).every(v=>Math.abs(v-.25)<1e-6));
  const line=Float32Array.from([0,0,3,0,0]);const m=matte.boxMean(line,5,1,1);
  assert.ok(Math.abs(m[2]-1)<1e-6);assert.ok(Math.abs(m[0])<1e-6);assert.ok(Math.abs(m[1]-1)<1e-6);
});

test('guidedRefine sharpens a blurry edge to the colour edge and leaves pure regions alone',()=>{
  const w=64,h=16,rgba=new Uint8ClampedArray(w*h*4),alpha=new Float32Array(w*h);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=y*w+x,fg=x<32;rgba.set(fg?[220,40,40,255]:[40,200,60,255],i*4);
    alpha[i]=Math.min(1,Math.max(0,(40-x)/16)); // soft ramp from x=24 to x=40, true edge at x=32
  }
  // Real use: the filter is fitted at ~model resolution (scale = upscale factor), here a 4× upscale.
  const out=matte.guidedRefine(alpha,rgba,w,h,{scale:4,radius:2,eps:1e-3});
  assert.ok(out[8*w+30]>alpha[8*w+30]+.1,'inside the object becomes more opaque');
  assert.ok(out[8*w+34]<alpha[8*w+34]-.1,'outside the object becomes more transparent');
  assert.equal(out[8*w+2],1);assert.equal(out[8*w+62],0);
});

test('removeStrayRegions drops small far specks, keeps near parts, second subjects and holes',()=>{
  const w=200,h=100,a=new Float32Array(w*h);
  const rect=(x0,y0,x1,y1,v=1)=>{for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)a[y*w+x]=v};
  rect(20,20,80,80);rect(45,45,55,55,0);   // main subject with a hole
  rect(82,40,85,43);                       // small part next to it (e.g. a mirror)
  rect(120,20,170,70);                      // second large subject
  rect(190,92,193,95);                     // far stray speck
  rect(186,5,190,9,.3);                    // far faint haze without a core
  const removed=matte.removeStrayRegions(a,w,h);
  assert.ok(removed>0);
  assert.equal(a[93*w+191],0,'far speck removed');assert.equal(a[7*w+188],0,'far haze removed');
  assert.equal(a[41*w+83],1,'nearby small part kept');assert.equal(a[40*w+140],1,'second subject kept');
  assert.equal(a[50*w+50],0,'hole is not filled');assert.equal(a[30*w+30],1);
});

test('estimateForeground removes background colour from semi-transparent edge pixels',()=>{
  // A narrow edge (6 px) between pure regions, as at real object/hair boundaries.
  const w=400,h=20,rgba=new Uint8ClampedArray(w*h*4),alpha=new Float32Array(w*h);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=y*w+x,a=Math.min(1,Math.max(0,(203-x)/6));alpha[i]=a; // red foreground over green background
    rgba.set([Math.round(255*a),Math.round(255*(1-a)),0,255],i*4);
  }
  const fg=matte.estimateForeground(rgba,alpha,w,h),i=(10*w+200)*4; // alpha 0.5: observed colour is olive
  assert.ok(fg[i]>200&&fg[i+1]<60,'estimated colour is close to the red foreground: '+fg.slice(i,i+3));
  assert.deepEqual([...fg.slice((10*w+50)*4,(10*w+50)*4+4)],[...rgba.slice((10*w+50)*4,(10*w+50)*4+4)],'opaque pixels unchanged');
  assert.deepEqual([...fg.slice((10*w+350)*4,(10*w+350)*4+4)],[...rgba.slice((10*w+350)*4,(10*w+350)*4+4)],'transparent pixels unchanged');
});

test('finishMatte returns full-size 8-bit alpha and foreground',()=>{
  const w=40,h=30,rgba=new Uint8ClampedArray(w*h*4).fill(128),raw=new Float32Array(w*h);
  for(let y=5;y<25;y++)for(let x=5;x<35;x++)raw[y*w+x]=1;
  const {alpha,foreground}=matte.finishMatte(rgba,raw,w,h,512);
  assert.equal(alpha.length,w*h);assert.equal(foreground.length,w*h*4);assert.equal(alpha[15*w+20],255);assert.equal(alpha[0],0);
});
