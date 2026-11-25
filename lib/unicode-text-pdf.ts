// Text → PDF for text the basic Helvetica exporter in lib/browser-engine.ts cannot write: Urdu/Arabic script, tabs,
// typographic quotes and other Latin characters outside plain ASCII.
// - Latin text keeps the standard Helvetica font (WinAnsi characters such as é “ ” — € are fine).
// - Urdu/Arabic words use the bundled Noto Naskh Arabic font (SIL Open Font License 1.1, see
//   public/licenses/NotoNaskhArabic-OFL.txt). fontkit shapes each word (joining forms, dots and marks) and every glyph
//   is placed exactly where fontkit puts it, so letters join and dots/vowel marks sit in the right place.
// - Each line is ordered with a simplified Unicode bidi algorithm: Urdu runs read right to left, English words and
//   numbers inside them keep left-to-right order, and a paragraph that starts with Urdu is right-aligned.
// Everything runs in the browser. The font is fetched from this site; the text itself never leaves the device.
import type {PDFDocument as PdfDocument,PDFFont,PDFPage,PDFName} from 'pdf-lib';
import type {Font as ShapingFont,Glyph,GlyphPosition} from '@pdf-lib/fontkit';
type Fontkit=typeof import('@pdf-lib/fontkit');

const FONT_URL='/fonts/NotoNaskhArabic-Regular.ttf';
const PAGE:[number,number]=[595,842],LEFT=45,MAX_WIDTH=505,TOP=790,BOTTOM=45;
const LATIN_SIZE=10,ARABIC_SIZE=11,LATIN_LINE=15,ARABIC_LINE=20;

let fontBytes:Promise<Uint8Array>|null=null;
function loadArabicFont(){
  fontBytes??=fetch(FONT_URL)
    .then(r=>{if(!r.ok)throw Error('The Urdu/Arabic font could not be loaded. Check your connection and try again.');return r.arrayBuffer()})
    .then(b=>new Uint8Array(b))
    .catch(e=>{fontBytes=null;throw e});
  return fontBytes;
}

type Kind='R'|'AN'|'L'|'EN'|'WS'|'ON';
type Run={glyphs:Glyph[];positions:GlyphPosition[]};
type Token={text:string;kind:Kind;width:number;run?:Run};

const isArabic=(cp:number)=>(cp>=0x600&&cp<=0x6ff)||(cp>=0x750&&cp<=0x77f)||(cp>=0x8a0&&cp<=0x8ff)||(cp>=0xfb50&&cp<=0xfdff)||(cp>=0xfe70&&cp<=0xfefe);
const isArabicDigit=(cp:number)=>(cp>=0x660&&cp<=0x669)||(cp>=0x6f0&&cp<=0x6f9);
const isJoiner=(cp:number)=>cp===0x200c||cp===0x200d;// ZWNJ / ZWJ stay inside Urdu words
function kindOf(ch:string):Kind{
  const cp=ch.codePointAt(0)!;
  if(isArabicDigit(cp))return 'AN';
  if(isArabic(cp)||isJoiner(cp))return 'R';
  if(ch===' ')return 'WS';
  if(cp>=0x30&&cp<=0x39)return 'EN';
  if(/[\p{L}\p{M}]/u.test(ch))return 'L';
  return 'ON';
}
const MIRROR:Record<string,string>={'(':')',')':'(','[':']',']':'[','{':'}','}':'{','<':'>','>':'<','«':'»','»':'«'};

/** Builds the PDF document; the caller saves it exactly like the basic exporter's output. */
export async function unicodeTextPdf(text:string):Promise<PdfDocument>{
  const lib=await import('pdf-lib');
  const {PDFDocument,StandardFonts,rgb,PDFHexString,PDFName,PDFOperator,PDFOperatorNames,pushGraphicsState,popGraphicsState,beginText,endText,setFontAndSize,setTextMatrix,showText,setFillingColor,endMarkedContent}=lib;
  const color=rgb(.13,.17,.23);
  const clean=text
    .replace(/[‎‏‪-‮⁦-⁩﻿]/g,'')// direction marks and BOM: the layout below decides direction
    .replace(/\t/g,'    ')
    .replace(/[\x00-\x08\x0b-\x1f\x7f]/g,' ');
  const doc=await PDFDocument.create();
  const latin=await doc.embedFont(StandardFonts.Helvetica);
  const needsArabic=[...clean].some(ch=>{const k=kindOf(ch);return k==='R'||k==='AN'});
  let arabic:PDFFont|null=null,shaper:ShapingFont|null=null;
  if(needsArabic){
    // The package's browser build has only a default export while its typings declare named ones: accept both.
    const mod=await import('@pdf-lib/fontkit') as unknown as Fontkit&{default?:Fontkit};
    const fontkit=mod.default??mod;
    const bytes=await loadArabicFont();
    doc.registerFontkit(fontkit);
    arabic=await doc.embedFont(bytes,{subset:false});// whole font: glyph ids are used directly as PDF character codes
    shaper=fontkit.create(bytes);
  }

  // Every character must be writable by one of the two fonts; otherwise say which ones are not.
  const latinOk=new Map<string,boolean>();
  const canLatin=(ch:string)=>{let ok=latinOk.get(ch);if(ok===undefined){try{latin.widthOfTextAtSize(ch,LATIN_SIZE);ok=true}catch{ok=false}latinOk.set(ch,ok)}return ok};
  const missing=new Set<string>();
  for(const ch of clean){
    if(ch==='\n')continue;
    const k=kindOf(ch),cp=ch.codePointAt(0)!;
    const ok=k==='R'||k==='AN'?isJoiner(cp)||shaper!.hasGlyphForCodePoint(cp):canLatin(ch);
    if(!ok)missing.add(ch);
  }
  if(missing.size){
    const list=[...missing].slice(0,6).map(ch=>`"${ch}" (U+${ch.codePointAt(0)!.toString(16).toUpperCase().padStart(4,'0')})`).join(', ');
    throw Error(`This PDF exporter writes English (Latin) and Urdu/Arabic text, but not these characters yet: ${list}${missing.size>6?' and more':''}.`);
  }

  const scale=shaper?ARABIC_SIZE/shaper.unitsPerEm:0;
  const shape=(text:string,kind:Kind):Run=>{
    // Arabic-Indic digits are a number: shaped left to right. Words are shaped right to left (fontkit reverses them).
    const layout=(shaper as unknown as {layout(s:string,f?:unknown,script?:string,lang?:string,dir?:string):Run}).layout;
    const run=kind==='AN'?layout.call(shaper,text,undefined,'arab',undefined,'ltr'):layout.call(shaper,text);
    return {glyphs:run.glyphs,positions:run.positions};
  };
  const token=(text:string,kind:Kind):Token=>{
    if(kind==='R'||kind==='AN'){const run=shape(text,kind);return {text,kind,run,width:run.positions.reduce((n,p)=>n+p.xAdvance,0)*scale}}
    return {text,kind,width:latin.widthOfTextAtSize(text,LATIN_SIZE)};
  };
  const tokenize=(line:string):Token[]=>{
    const out:Token[]=[];let text='',kind:Kind|null=null;
    for(const ch of line){const k=kindOf(ch);if(k!==kind&&text){out.push(token(text,kind!));text=''}kind=k;text+=ch}
    if(text)out.push(token(text,kind!));
    return out;
  };

  // Word wrap in logical order, breaking at spaces; a word longer than a line is split.
  const wrap=(tokens:Token[]):Token[][]=>{
    const lines:Token[][]=[];let cur:Token[]=[],width=0;
    const flush=()=>{while(cur.length&&cur[cur.length-1].kind==='WS')width-=cur.pop()!.width;if(cur.length)lines.push(cur);cur=[];width=0};
    const words:Token[][]=[];for(const t of tokens){const last=words[words.length-1];if(last&&(last[0].kind==='WS')===(t.kind==='WS'))last.push(t);else words.push([t])}
    for(const word of words){
      const ww=word.reduce((n,t)=>n+t.width,0);
      if(word[0].kind==='WS'){if(cur.length){cur.push(...word);width+=ww}continue}
      if(width+ww>MAX_WIDTH&&cur.length)flush();
      if(ww<=MAX_WIDTH){cur.push(...word);width+=ww;continue}
      for(const t of word){// very long word: fill the line token by token, characters as the last resort
        if(width+t.width>MAX_WIDTH&&cur.length)flush();
        if(t.width<=MAX_WIDTH){cur.push(t);width+=t.width;continue}
        let part='';for(const ch of t.text){const next=token(part+ch,t.kind);if(next.width>MAX_WIDTH&&part){cur.push(token(part,t.kind));flush();part=''}part+=ch}
        if(part){const last=token(part,t.kind);cur.push(last);width+=last.width}
      }
    }
    flush();
    return lines.length?lines:[[]];
  };

  // Simplified Unicode bidi algorithm on tokens (rules W7, N1/N2, I1/I2 and L2).
  const visual=(tokens:Token[],rtl:boolean):{token:Token;odd:boolean}[]=>{
    type Dir='L'|'R'|'NUM'|'N';
    let strong:'L'|'R'=rtl?'R':'L';
    const types:Dir[]=tokens.map(t=>{
      if(t.kind==='R'){strong='R';return 'R'}
      if(t.kind==='L'){strong='L';return 'L'}
      if(t.kind==='EN')return strong==='L'?'L':'NUM';
      if(t.kind==='AN')return 'NUM';
      return 'N';
    });
    const side=(d:Dir|undefined)=>d===undefined?(rtl?'R':'L'):d==='L'?'L':'R';
    for(let i=0;i<types.length;i++){
      if(types[i]!=='N')continue;
      let j=i;while(j<types.length&&types[j]==='N')j++;
      const before=side(types[i-1]),after=side(types[j]);
      const dir:Dir=before===after?before:(rtl?'R':'L');
      for(let k=i;k<j;k++)types[k]=dir;
      i=j-1;
    }
    const levels=types.map(t=>rtl?(t==='R'?1:2):(t==='R'?1:t==='NUM'?2:0));
    const order=tokens.map((token,i)=>({token,level:levels[i]}));
    for(let level=Math.max(0,...levels);level>=1;level--){
      for(let i=0;i<order.length;i++){
        if(order[i].level<level)continue;
        let j=i;while(j<order.length&&order[j].level>=level)j++;
        const run=order.slice(i,j).reverse();order.splice(i,j-i,...run);i=j-1;
      }
    }
    return order.map(o=>({token:o.token,odd:o.level%2===1}));
  };

  const fontKeys=new WeakMap<PDFPage,PDFName>();
  // Copy/search: shaped glyphs placed one by one don't spell the word for a PDF reader, so each word carries its real
  // text as /ActualText (UTF-16BE), which Acrobat, Chrome and other PDFium-based viewers use when copying or searching.
  const actualText=(text:string)=>{
    let hex='FEFF';for(let i=0;i<text.length;i++)hex+=text.charCodeAt(i).toString(16).padStart(4,'0').toUpperCase();
    // BDC takes an inline property dictionary; pdf-lib serialises it fine but its operator-argument type omits PDFDict.
    const properties=doc.context.obj({ActualText:PDFHexString.of(hex)}) as unknown as ReturnType<typeof PDFName.of>;
    return PDFOperator.of(PDFOperatorNames.BeginMarkedContentSequence,[PDFName.of('Span'),properties]);
  };
  const drawRun=(page:PDFPage,run:Run,text:string,x:number,y:number)=>{
    let key=fontKeys.get(page);
    if(!key){key=page.node.newFontDictionary(arabic!.name,arabic!.ref);fontKeys.set(page,key)}
    const ops=[actualText(text),pushGraphicsState(),beginText(),setFillingColor(color),setFontAndSize(key,ARABIC_SIZE)];
    // Glyphs come from fontkit in visual (left-to-right) order; each one is placed exactly where fontkit puts it.
    let pen=x;
    run.glyphs.forEach((glyph,i)=>{
      const p=run.positions[i];
      ops.push(setTextMatrix(1,0,0,1,pen+p.xOffset*scale,y+p.yOffset*scale),showText(PDFHexString.of(glyph.id.toString(16).padStart(4,'0'))));
      pen+=p.xAdvance*scale;
    });
    ops.push(endText(),popGraphicsState(),endMarkedContent());
    page.pushOperators(...ops);
  };

  let page=doc.addPage(PAGE),y=TOP;
  for(const paragraph of clean.split('\n')){
    const tokens=tokenize(paragraph);
    const first=tokens.find(t=>t.kind==='R'||t.kind==='L');
    const rtl=first?.kind==='R';
    for(const line of wrap(tokens)){
      const hasArabic=line.some(t=>t.kind==='R'||t.kind==='AN');
      if(y<BOTTOM){page=doc.addPage(PAGE);y=TOP}
      const items=visual(line,rtl);
      const total=items.reduce((n,i)=>n+i.token.width,0);
      let x=rtl?LEFT+MAX_WIDTH-total:LEFT;
      for(const {token:t,odd} of items){
        if(t.run)drawRun(page,t.run,t.text,x,y);
        else if(t.kind!=='WS'){
          const text=odd&&t.kind==='ON'?[...t.text].map(ch=>MIRROR[ch]??ch).join(''):t.text;
          page.drawText(text,{x,y,size:LATIN_SIZE,font:latin,color});
        }
        x+=t.width;
      }
      y-=hasArabic?ARABIC_LINE:LATIN_LINE;
    }
  }
  return doc;
}
