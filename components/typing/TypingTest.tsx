'use client';
import {memo,useCallback,useEffect,useLayoutEffect,useRef,useState,type MutableRefObject} from 'react';
import {flushSync} from 'react-dom';
import dynamic from 'next/dynamic';
import {Check,Copy,Keyboard,Maximize2,Minimize2,RotateCcw,Shuffle,SlidersHorizontal,Trash2,Trophy,Volume2,VolumeX} from 'lucide-react';
import {
  TypingSession,buildSamples,consistency,invalidReason,formatDuration,LIVE_WPM_MIN_MS,
  type CompletionRule,type EndReason,type Sample,type Stats
} from '@/lib/typing/engine';
import {
  createDrillStream,createWordStream,pickPassage,prepareCustomText,randomSeed,CUSTOM_MAX_CHARS,
  type Difficulty,type Drill,type QuoteLength
} from '@/lib/typing/content';
import {
  getStorage,readHistory,readBest,saveResult,clearHistory,resetBest,summarize,readPrefs,writePrefs,
  type HistoryEntry,type PersonalBest,type StorageLike
} from '@/lib/typing/history';
import styles from './typing.module.css';

const WpmChart=dynamic(()=>import('./WpmChart'),{ssr:false,loading:()=><div className={styles.chartPlaceholder}/>});
const useIsoLayoutEffect=typeof window==='undefined'?useEffect:useLayoutEffect;

type Mode='time'|'words'|'quote'|'practice'|'custom';
type TextSize='s'|'m'|'l'|'xl';
type Settings={mode:Mode;duration:number;wordCount:number;quoteLength:QuoteLength;drill:Drill;difficulty:Difficulty;punctuation:boolean;numbers:boolean};
type Prefs={settings:Settings;textSize:TextSize;sound:boolean;customText:string};
type Stream={next(count:number):string[]};
type Prepared={text:string;rule:CompletionRule;stream:Stream|null;label:string;practice:boolean;passageId?:string;wordTotal?:number};
type Test={seed:number;settings:Settings;custom:string;avoid?:string;prepared:Prepared};
type Result={
  stats:Stats;samples:Sample[];consistency:number|null;endReason:EndReason;label:string;mode:Mode;practice:boolean;
  invalid:string|null;saved:boolean;storage:boolean;newBest:boolean;previousBest:PersonalBest|null;
};

const MODES:{id:Mode;label:string}[]=[{id:'time',label:'Time'},{id:'words',label:'Words'},{id:'quote',label:'Quote'},{id:'practice',label:'Practice'},{id:'custom',label:'Custom text'}];
const DURATIONS=[15,30,60,120,300];
const WORD_COUNTS=[10,25,50,100];
const QUOTE_LENGTHS:{id:QuoteLength;label:string}[]=[{id:'short',label:'Short'},{id:'medium',label:'Medium'},{id:'long',label:'Long'}];
const DRILLS:{id:Drill;label:string}[]=[{id:'common',label:'Common words'},{id:'sentences',label:'Full sentences'},{id:'numbers',label:'Numbers'},{id:'punctuation',label:'Punctuation'},{id:'capitals',label:'Capital letters'},{id:'mixed',label:'Mixed difficulty'}];
const DIFFICULTIES:{id:Difficulty;label:string}[]=[{id:'easy',label:'Easy'},{id:'medium',label:'Medium'},{id:'hard',label:'Hard'}];
const TEXT_SIZES:{id:TextSize;label:string}[]=[{id:'s',label:'Small'},{id:'m',label:'Medium'},{id:'l',label:'Large'},{id:'xl',label:'Extra large'}];
const DEFAULT_SETTINGS:Settings={mode:'time',duration:60,wordCount:25,quoteLength:'medium',drill:'common',difficulty:'easy',punctuation:false,numbers:false};
const INITIAL_WORDS=100,EXTEND_WORDS=50,EXTEND_WHEN_REMAINING=300;
// Edits that are never typing: paste, drop, autocorrect/suggestion replacement, undo/redo, line breaks, cut.
const BLOCKED_INPUT=new Set(['insertFromPaste','insertFromPasteAsQuotation','insertFromDrop','insertFromYank','insertReplacementText','insertLineBreak','insertParagraph','insertTranspose','insertLink','historyUndo','historyRedo','deleteByCut','deleteByDrag','deleteContentForward','deleteWordForward','deleteSoftLineForward','deleteHardLineForward']);
const NAV_KEYS=new Set(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End']);
const NOTICES={
  paste:'Pasting is turned off in the test. Type the text yourself to get a real result.',
  drop:'Dropping text into the test is turned off. Type the text yourself.',
  bulk:'Only one character at a time is accepted, so inserted words or suggestions were ignored.',
  replace:'Your keyboard tried to change text you had already typed (autocorrect or a suggestion). The change was ignored; for best results turn off autocorrect.',
  synthetic:'Automated input is not scored.'
};
type NoticeKind=keyof typeof NOTICES;

function sanitizeSettings(raw:unknown):Settings{
  const s:Settings={...DEFAULT_SETTINGS};
  if(!raw||typeof raw!=='object')return s;
  const r=raw as Record<string,unknown>;
  if(MODES.some(m=>m.id===r.mode))s.mode=r.mode as Mode;
  if(DURATIONS.includes(r.duration as number))s.duration=r.duration as number;
  if(WORD_COUNTS.includes(r.wordCount as number))s.wordCount=r.wordCount as number;
  if(QUOTE_LENGTHS.some(q=>q.id===r.quoteLength))s.quoteLength=r.quoteLength as QuoteLength;
  if(DRILLS.some(d=>d.id===r.drill))s.drill=r.drill as Drill;
  if(DIFFICULTIES.some(d=>d.id===r.difficulty))s.difficulty=r.difficulty as Difficulty;
  s.punctuation=r.punctuation===true;s.numbers=r.numbers===true;
  return s;
}

function extras(s:Settings){return (s.punctuation?' + punctuation':'')+(s.numbers?' + numbers':'')}
const difficultyLabel=(d:Difficulty)=>DIFFICULTIES.find(x=>x.id===d)!.label;

function prepare(settings:Settings,seed:number,customText:string,avoid?:string):Prepared|null{
  const options={difficulty:settings.difficulty,punctuation:settings.punctuation,numbers:settings.numbers};
  switch(settings.mode){
    case 'time':{
      const stream=createWordStream(seed,options);
      return {text:stream.next(INITIAL_WORDS).join(' '),rule:{kind:'time',durationMs:settings.duration*1000},stream,practice:false,
        label:`Time ${settings.duration}s · ${difficultyLabel(settings.difficulty)}${extras(settings)}`};
    }
    case 'words':{
      const stream=createWordStream(seed,options);
      return {text:stream.next(settings.wordCount).join(' '),rule:{kind:'text'},stream:null,practice:false,wordTotal:settings.wordCount,
        label:`${settings.wordCount} words · ${difficultyLabel(settings.difficulty)}${extras(settings)}`};
    }
    case 'quote':{
      const passage=pickPassage(seed,settings.quoteLength,avoid);
      return {text:passage.text,rule:{kind:'text'},stream:null,practice:false,passageId:passage.id,label:`Quote · ${settings.quoteLength}`};
    }
    case 'practice':{
      const stream=createDrillStream(seed,settings.drill,settings.difficulty);
      return {text:stream.next(INITIAL_WORDS).join(' '),rule:{kind:'time',durationMs:settings.duration*1000},stream,practice:true,
        label:`Practice: ${DRILLS.find(d=>d.id===settings.drill)!.label} · ${settings.duration}s`};
    }
    case 'custom':
      return customText?{text:customText,rule:{kind:'text'},stream:null,practice:true,label:'Custom text (practice)'}:null;
  }
}

const fmtWpm=(v:number)=>String(Math.round(v));
const fmtPct=(v:number|null)=>v===null?'–':(v>=99.95?'100':v.toFixed(1))+'%';
const clock=(ms:number)=>{const s=Math.floor(Math.max(0,ms)/1000);return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};

function nextWords(text:string,from:number,count=8){
  return text.slice(from).split(' ').filter(Boolean).slice(0,count).join(' ');
}

function wordsDone(target:string,position:number){
  let n=0;for(let i=0;i<position;i++)if(target[i]===' ')n++;
  return position>=target.length&&target.length?n+1:n;
}

/** One prompt chunk: plain character spans. Typed state is painted with data-s attributes outside React. */
const Chunk=memo(function Chunk({text}:{text:string}){
  return <>{Array.from(text,(char,i)=><span key={i} className={styles.ch}>{char}</span>)}</>;
});

/** Live numbers, read from the session ten times a second. Only this component re-renders while typing. */
function useLiveStats(session:MutableRefObject<TypingSession|null>,runKey:number,phase:string){
  const [stats,setStats]=useState<Stats|null>(null);
  useEffect(()=>{
    const read=()=>{const s=session.current;setStats(s?s.stats(performance.now()):null)};
    read();
    if(phase!=='running')return;
    const id=window.setInterval(read,100);
    return ()=>window.clearInterval(id);
  },[session,runKey,phase]);
  return stats;
}

const LiveStats=memo(function LiveStats({session,runKey,phase,wordTotal}:{session:MutableRefObject<TypingSession|null>;runKey:number;phase:string;wordTotal?:number}){
  const stats=useLiveStats(session,runKey,phase);
  const s=session.current;
  const timed=s?.rule.kind==='time';
  const elapsed=stats?.elapsedMs??0;
  const showSpeed=elapsed>=LIVE_WPM_MIN_MS;
  const time=timed&&s?.rule.kind==='time'?String(Math.ceil((s.rule.durationMs-elapsed)/1000)):clock(elapsed);
  const progress=stats?.progress??0;
  return <div className={styles.live} data-testid="live-stats">
    <dl className={styles.primaryStats}>
      <div><dt>WPM</dt><dd data-stat="wpm">{showSpeed&&stats?fmtWpm(stats.net):'–'}</dd></div>
      <div><dt>Accuracy</dt><dd data-stat="accuracy">{fmtPct(stats?.accuracy??null)}</dd></div>
      <div><dt>Time</dt><dd data-stat="time">{time}{timed?<small>s</small>:null}</dd></div>
    </dl>
    {wordTotal&&s?<p className={styles.wordCount}>{wordsDone(s.target,s.position)} of {wordTotal} words</p>:null}
    <div className={styles.progressTrack} aria-hidden="true"><span style={{transform:`scaleX(${progress/100})`}}/></div>
  </div>;
});

const DetailStats=memo(function DetailStats({session,runKey,phase}:{session:MutableRefObject<TypingSession|null>;runKey:number;phase:string}){
  const stats=useLiveStats(session,runKey,phase);
  return <dl className={styles.detailStats} data-hide-in-focus="">
    <div><dt>Raw WPM</dt><dd data-stat="raw">{stats&&stats.elapsedMs>=LIVE_WPM_MIN_MS?fmtWpm(stats.gross):'–'}</dd></div>
    <div><dt>Progress</dt><dd data-stat="progress">{Math.floor(stats?.progress??0)}%</dd></div>
    <div><dt>Correct characters</dt><dd data-stat="correct">{stats?.correct??0}</dd></div>
    <div><dt>Incorrect characters</dt><dd data-stat="incorrect">{stats?.incorrect??0}</dd></div>
    <div><dt>Uncorrected mistakes</dt><dd data-stat="uncorrected">{stats?.uncorrected??0}</dd></div>
    <div><dt>Corrected mistakes</dt><dd data-stat="corrected">{stats?.corrected??0}</dd></div>
    <div><dt>Total typed characters</dt><dd data-stat="typed">{stats?.keystrokes??0}</dd></div>
  </dl>;
});

function resultSummary(r:Result){
  const s=r.stats;
  return [
    'Editgoo Typing Speed Test result',
    `Test: ${r.label}${r.practice?' (practice result, not a standard score)':''}`,
    `Net speed: ${fmtWpm(s.net)} WPM`,
    `Raw speed: ${fmtWpm(s.gross)} WPM`,
    `Accuracy: ${fmtPct(s.accuracy)} (keystroke accuracy ${fmtPct(s.keystrokeAccuracy)})`,
    `Duration: ${formatDuration(s.elapsedMs)}`,
    `Characters: ${s.correct} correct, ${s.incorrect} incorrect (${s.corrected} corrected, ${s.uncorrected} uncorrected), ${s.keystrokes} typed`,
    `Consistency: ${r.consistency===null?'not enough data':Math.round(r.consistency)+'%'}`,
    'Scored in the browser by editgoo.com/typing-test. Not an independently verified or certified result.'
  ].join('\n');
}

async function copyText(text:string){
  try{await navigator.clipboard.writeText(text);return true}catch{}
  try{
    const area=document.createElement('textarea');area.value=text;area.setAttribute('readonly','');
    area.style.position='fixed';area.style.opacity='0';document.body.appendChild(area);area.select();
    const ok=document.execCommand('copy');area.remove();return ok;
  }catch{return false}
}

function ConfirmButton({label,confirm,onConfirm,disabled}:{label:string;confirm:string;onConfirm:()=>void;disabled?:boolean}){
  const [armed,setArmed]=useState(false);
  useEffect(()=>{if(!armed)return;const id=window.setTimeout(()=>setArmed(false),4000);return ()=>window.clearTimeout(id)},[armed]);
  return <button type="button" className={styles.ghostButton+(armed?' '+styles.danger:'')} disabled={disabled}
    onClick={()=>{if(armed){setArmed(false);onConfirm()}else setArmed(true)}}><Trash2 size={16} aria-hidden="true"/>{armed?confirm:label}</button>;
}

export default function TypingTest(){
  const [settings,setSettings]=useState<Settings>(DEFAULT_SETTINGS);
  const [textSize,setTextSize]=useState<TextSize>('m');
  const [sound,setSound]=useState(false);
  const [focusMode,setFocusMode]=useState(false);
  const [customText,setCustomText]=useState('');
  const [customDraft,setCustomDraft]=useState('');
  const [customError,setCustomError]=useState('');
  const [ready,setReady]=useState(false);
  const [chunks,setChunks]=useState<string[]>([]);
  const [runKey,setRunKey]=useState(0);
  const [phase,setPhase]=useState<'ready'|'running'|'finished'>('ready');
  const [result,setResult]=useState<Result|null>(null);
  const [notice,setNotice]=useState('');
  const [announcement,setAnnouncement]=useState('');
  const [focused,setFocused]=useState(false);
  const [copied,setCopied]=useState<'idle'|'done'|'failed'>('idle');
  const [storageOk,setStorageOk]=useState(true);
  const [history,setHistory]=useState<HistoryEntry[]>([]);
  const [best,setBest]=useState<PersonalBest|null>(null);

  const storageRef=useRef<StorageLike|null>(null);
  const sessionRef=useRef<TypingSession|null>(null);
  const testRef=useRef<Test|null>(null);
  const phaseRef=useRef(phase);
  const finalizedRef=useRef(false);
  const composingRef=useRef(false);
  const offsetRef=useRef(0);
  const warnedRef=useRef(false);
  const audioRef=useRef<AudioContext|null>(null);
  const soundRef=useRef(sound);
  const inputRef=useRef<HTMLInputElement>(null);
  const linesRef=useRef<HTMLDivElement>(null);
  const viewportRef=useRef<HTMLDivElement>(null);
  const caretRef=useRef<HTMLSpanElement>(null);
  const spansRef=useRef<HTMLCollectionOf<Element>|null>(null);
  const upcomingRef=useRef<HTMLSpanElement>(null);
  const panelRef=useRef<HTMLDivElement>(null);
  const resultsHeadingRef=useRef<HTMLHeadingElement>(null);
  const modeGroupRef=useRef<HTMLDivElement>(null);
  const noticeTimer=useRef<number|undefined>(undefined);
  phaseRef.current=phase;
  soundRef.current=sound;

  const notify=useCallback((kind:NoticeKind)=>{
    window.clearTimeout(noticeTimer.current);
    setNotice(NOTICES[kind]);
    noticeTimer.current=window.setTimeout(()=>setNotice(''),6000);
  },[]);

  // ----- painting (outside React, so typing never re-renders the prompt) -----
  const lineHeight=useCallback(()=>{
    const lines=linesRef.current;if(!lines)return 38;
    const value=parseFloat(getComputedStyle(lines).lineHeight);
    return Number.isFinite(value)&&value>0?value:38;
  },[]);

  const moveCaret=useCallback(()=>{
    const s=sessionRef.current,spans=spansRef.current,caret=caretRef.current,lines=linesRef.current;
    if(!s||!spans||!caret||!lines)return;
    const pos=s.position;
    let x=0,y=0,h=0;
    const current=spans[pos] as HTMLElement|undefined;
    if(current){x=current.offsetLeft;y=current.offsetTop;h=current.offsetHeight}
    else if(pos>0&&spans[pos-1]){const prev=spans[pos-1] as HTMLElement;x=prev.offsetLeft+prev.offsetWidth;y=prev.offsetTop;h=prev.offsetHeight}
    caret.style.transform=`translate(${x}px,${y}px)`;
    if(h)caret.style.height=h+'px';
    const lh=lineHeight();
    const offset=Math.max(0,Math.round(y/lh)-1)*lh;
    if(offset!==offsetRef.current){offsetRef.current=offset;lines.style.transform=`translateY(${-offset}px)`}
  },[lineHeight]);

  const updateUpcoming=useCallback(()=>{
    const s=sessionRef.current;
    if(upcomingRef.current&&s)upcomingRef.current.textContent=nextWords(s.target,s.position)||'End of text.';
  },[]);

  const playSound=useCallback((ok:boolean)=>{
    if(!soundRef.current)return;
    try{
      const ctx=audioRef.current??(audioRef.current=new AudioContext());
      if(ctx.state==='suspended')void ctx.resume();
      const osc=ctx.createOscillator(),gain=ctx.createGain(),t=ctx.currentTime;
      osc.type=ok?'triangle':'square';osc.frequency.value=ok?880:196;
      gain.gain.setValueAtTime(ok?0.035:0.05,t);gain.gain.exponentialRampToValueAtTime(0.0001,t+0.05);
      osc.connect(gain).connect(ctx.destination);osc.start(t);osc.stop(t+0.06);
    }catch{}
  },[]);

  // ----- session lifecycle -----
  /** Start a fresh session for `test` (re-preparing it resets the seeded text stream). One session at a time. */
  const load=useCallback((test:Test|null,focusInput:boolean,flush=true)=>{
    const prepared=test?prepare(test.settings,test.seed,test.custom,test.avoid):null;
    if(test&&prepared)test.prepared=prepared;
    testRef.current=test&&prepared?test:null;
    finalizedRef.current=false;warnedRef.current=false;offsetRef.current=0;composingRef.current=false;
    sessionRef.current=prepared?new TypingSession(prepared.text,prepared.rule):null;
    if(inputRef.current)inputRef.current.value='';
    if(linesRef.current)linesRef.current.style.transform='';
    const update=()=>{
      setChunks(prepared?[prepared.text]:[]);
      setRunKey(k=>k+1);
      setPhase('ready');
      setResult(null);
      setCopied('idle');
    };
    if(flush)flushSync(update);else update();
    phaseRef.current='ready';
    if(focusInput&&prepared)inputRef.current?.focus({preventScroll:true});
  },[]);

  const makeTest=useCallback((next:Settings,custom:string,avoid?:string):Test|null=>{
    const seed=randomSeed();
    const prepared=prepare(next,seed,custom,avoid);
    return prepared?{seed,settings:next,custom,avoid,prepared}:null;
  },[]);

  const restart=useCallback((focusInput=true)=>{
    load(testRef.current,focusInput);
    setAnnouncement('Test restarted with the same text.');
  },[load]);

  const newTest=useCallback((focusInput=true)=>{
    const current=testRef.current;
    load(makeTest(settings,customText,current?.prepared.passageId),focusInput);
    setAnnouncement('New test ready.');
  },[load,makeTest,settings,customText]);

  const applySettings=useCallback((patch:Partial<Settings>)=>{
    const next={...settings,...patch};
    setSettings(next);
    writePrefs(storageRef.current,{settings:next,textSize,sound,customText} satisfies Prefs);
    load(makeTest(next,customText),false);
  },[settings,textSize,sound,customText,load,makeTest]);

  const finalize=useCallback(()=>{
    const s=sessionRef.current,test=testRef.current;
    if(!s||!test||finalizedRef.current||!s.ended)return;
    finalizedRef.current=true;
    const stats=s.stats(performance.now());
    const samples=buildSamples(s.log,stats.elapsedMs);
    const invalid=invalidReason(stats,s.hiddenDuringTest);
    const storage=storageRef.current;
    let saved=false,newBest=false,previousBest=best;
    if(!invalid&&storage){
      const entry:HistoryEntry={id:Date.now().toString(36)+'-'+test.seed.toString(36),at:new Date().toISOString(),mode:test.settings.mode,
        label:test.prepared.label,wpm:Math.round(stats.net*100)/100,raw:Math.round(stats.gross*100)/100,accuracy:Math.round((stats.accuracy??0)*100)/100,
        keystrokeAccuracy:Math.round((stats.keystrokeAccuracy??0)*100)/100,durationMs:Math.round(stats.elapsedMs),practice:test.prepared.practice};
      const outcome=saveResult(storage,entry);
      saved=outcome.saved;newBest=outcome.newBest;previousBest=outcome.previousBest;
      setHistory(outcome.history);setBest(outcome.best);
      if(!outcome.saved)setStorageOk(false);
    }
    const res:Result={stats,samples,consistency:consistency(samples),endReason:s.endReason!,label:test.prepared.label,mode:test.settings.mode,
      practice:test.prepared.practice,invalid,saved,storage:!!storage,newBest,previousBest};
    flushSync(()=>{setResult(res);setPhase('finished')});
    phaseRef.current='finished';
    inputRef.current?.blur();
    setAnnouncement(`Test complete. ${fmtWpm(stats.net)} words per minute, ${fmtPct(stats.accuracy)} accuracy.`);
    resultsHeadingRef.current?.focus({preventScroll:true});
  },[best]);

  const handleValue=useCallback((value:string)=>{
    const s=sessionRef.current,input=inputRef.current;
    if(!s||!input)return;
    const revert=()=>{input.value=s.typed;const n=s.typed.length;try{input.setSelectionRange(n,n)}catch{}};
    const now=performance.now();
    if(s.ended||s.finishIfExpired(now)){revert();finalize();return}
    const old=s.typed;
    if(value===old)return;
    const spans=spansRef.current;
    if(value.length>old.length&&value.startsWith(old)){
      const added=value.slice(old.length);
      if(added.length!==1){revert();notify('bulk');return}
      const index=s.position,wasStarted=s.started;
      if(!s.type(added,now)){revert();if(s.ended)finalize();return}
      const ok=s.log[s.log.length-1].ok;
      spans?.[index]?.setAttribute('data-s',ok?'c':'x');
      playSound(ok);
      if(!wasStarted){flushSync(()=>setPhase('running'));phaseRef.current='running';setAnnouncement('Test started.')}
      if(s.ended){moveCaret();finalize();return}
      const test=testRef.current;
      if(test?.prepared.stream&&s.target.length-s.position<EXTEND_WHEN_REMAINING){
        const more=' '+test.prepared.stream.next(EXTEND_WORDS).join(' ');
        s.extend(more);
        setChunks(c=>[...c,more]);
      }
      if(added===' ')updateUpcoming();
    }else if(value.length<old.length&&old.startsWith(value)){
      const from=s.position;
      s.erase(old.length-value.length,now);
      if(s.ended){revert();finalize();return}
      if(s.position!==value.length)revert();
      for(let i=s.position;i<from;i++)spans?.[i]?.removeAttribute('data-s');
      updateUpcoming();
    }else{
      revert();notify('replace');return;
    }
    moveCaret();
  },[finalize,moveCaret,notify,playSound,updateUpcoming]);

  // Latest callbacks for the native listeners attached once below.
  const api=useRef({handleValue,restart,newTest,notify,finalize});
  api.current={handleValue,restart,newTest,notify,finalize};

  // ----- first load: preferences, history and the first test -----
  useEffect(()=>{
    const storage=getStorage();
    storageRef.current=storage;
    setStorageOk(!!storage);
    const prefs=readPrefs<Partial<Prefs>>(storage,{});
    const loaded=sanitizeSettings(prefs.settings);
    const size=TEXT_SIZES.some(t=>t.id===prefs.textSize)?prefs.textSize as TextSize:'m';
    const custom=typeof prefs.customText==='string'?prepareCustomText(prefs.customText):null;
    const customValue=custom&&custom.ok?custom.text:'';
    setSettings(loaded);setTextSize(size);setSound(prefs.sound===true);
    setCustomText(customValue);setCustomDraft(customValue);
    setHistory(readHistory(storage));setBest(readBest(storage));
    setReady(true);
    load(makeTest(loaded,customValue),false,false);
    return ()=>{window.clearTimeout(noticeTimer.current);void audioRef.current?.close().catch(()=>{})};
  },[load,makeTest]);

  // Re-collect the character spans and repaint the caret after every prompt render or text-size change.
  useIsoLayoutEffect(()=>{
    spansRef.current=linesRef.current?.getElementsByClassName(styles.ch)??null;
    moveCaret();
    updateUpcoming();
  },[chunks,runKey,textSize,moveCaret,updateUpcoming]);

  useEffect(()=>{
    const viewport=viewportRef.current;if(!viewport)return;
    const observer=new ResizeObserver(()=>moveCaret());
    observer.observe(viewport);
    return ()=>observer.disconnect();
  },[moveCaret]);

  // ----- native input listeners (beforeinput/paste/drop need the real events) -----
  useEffect(()=>{
    const input=inputRef.current;if(!input)return;
    const revert=()=>{const s=sessionRef.current;input.value=s?s.typed:'';const n=input.value.length;try{input.setSelectionRange(n,n)}catch{}};
    const beforeInput=(event:InputEvent)=>{
      const s=sessionRef.current;
      if(!event.isTrusted){event.preventDefault();api.current.notify('synthetic');return}
      if(!s||s.ended||phaseRef.current==='finished'){event.preventDefault();return}
      if(BLOCKED_INPUT.has(event.inputType)){
        event.preventDefault();
        api.current.notify(event.inputType==='insertFromDrop'?'drop':event.inputType.startsWith('insertFromPaste')||event.inputType==='insertFromYank'?'paste':event.inputType==='insertReplacementText'?'replace':'bulk');
        return;
      }
      if(event.inputType==='insertText'&&event.data&&event.data.length>1){event.preventDefault();api.current.notify('bulk')}
    };
    const onInput=(event:Event)=>{
      if(!event.isTrusted){revert();api.current.notify('synthetic');return}
      api.current.handleValue(input.value);
    };
    const onPaste=(event:ClipboardEvent)=>{event.preventDefault();api.current.notify('paste')};
    const onDrop=(event:DragEvent)=>{event.preventDefault();api.current.notify('drop')};
    const onDragOver=(event:DragEvent)=>{event.preventDefault();if(event.dataTransfer)event.dataTransfer.dropEffect='none'};
    const compositionStart=()=>{composingRef.current=true};
    const compositionEnd=()=>{composingRef.current=false;api.current.handleValue(input.value)};
    const keyDown=(event:KeyboardEvent)=>{
      if(event.key==='Escape'){event.preventDefault();api.current.restart();return}
      if(event.key==='Enter'&&(event.ctrlKey||event.metaKey)){event.preventDefault();api.current.newTest();return}
      if(NAV_KEYS.has(event.key)){event.preventDefault();return}
      if((event.ctrlKey||event.metaKey)&&!event.altKey&&['a','z','y'].includes(event.key.toLowerCase()))event.preventDefault();
    };
    const keepCaretAtEnd=()=>{
      if(document.activeElement!==input||composingRef.current)return;
      const n=input.value.length;
      if(input.selectionStart!==n||input.selectionEnd!==n){try{input.setSelectionRange(n,n)}catch{}}
    };
    input.addEventListener('beforeinput',beforeInput);
    input.addEventListener('input',onInput);
    input.addEventListener('paste',onPaste);
    input.addEventListener('drop',onDrop);
    input.addEventListener('dragover',onDragOver);
    input.addEventListener('compositionstart',compositionStart);
    input.addEventListener('compositionend',compositionEnd);
    input.addEventListener('keydown',keyDown);
    document.addEventListener('selectionchange',keepCaretAtEnd);
    return ()=>{
      input.removeEventListener('beforeinput',beforeInput);
      input.removeEventListener('input',onInput);
      input.removeEventListener('paste',onPaste);
      input.removeEventListener('drop',onDrop);
      input.removeEventListener('dragover',onDragOver);
      input.removeEventListener('compositionstart',compositionStart);
      input.removeEventListener('compositionend',compositionEnd);
      input.removeEventListener('keydown',keyDown);
      document.removeEventListener('selectionchange',keepCaretAtEnd);
    };
  },[]);

  // Page-level shortcuts: Esc restarts, Ctrl/Cmd+Enter starts a new test, and a printable key typed while
  // nothing editable has focus moves focus to the test (that key is then typed). Space and Enter keep
  // activating buttons, so keyboard navigation is not affected.
  useEffect(()=>{
    const onKey=(event:KeyboardEvent)=>{
      const input=inputRef.current;
      if(event.defaultPrevented||!input||event.target===input)return;
      const target=event.target as HTMLElement|null;
      if(target?.closest('input,textarea,select,[contenteditable="true"],dialog'))return;
      const inPanel=!target||target===document.body||!!panelRef.current?.contains(target);
      if(!inPanel)return;
      if(event.key==='Escape'){event.preventDefault();api.current.restart();return}
      if(event.key==='Enter'&&(event.ctrlKey||event.metaKey)){event.preventDefault();api.current.newTest();return}
      if(phaseRef.current!=='finished'&&sessionRef.current&&event.key.length===1&&event.key!==' '&&!event.ctrlKey&&!event.metaKey&&!event.altKey)
        input.focus({preventScroll:true});
    };
    window.addEventListener('keydown',onKey);
    return ()=>window.removeEventListener('keydown',onKey);
  },[]);

  // Timer: the clock is performance.now() based; this interval only notices the deadline.
  // Hidden tabs never pause the clock, and a test that was hidden is marked and not saved.
  useEffect(()=>{
    if(phase!=='running')return;
    const check=()=>{
      const s=sessionRef.current;if(!s)return;
      const now=performance.now();
      if(s.finishIfExpired(now)){api.current.finalize();return}
      if(s.rule.kind==='time'&&s.rule.durationMs>=30000&&!warnedRef.current&&s.rule.durationMs-s.elapsed(now)<=10000){
        warnedRef.current=true;setAnnouncement('10 seconds left.');
      }
    };
    const visibility=()=>{
      const s=sessionRef.current;
      if(document.hidden){if(s?.running)s.hiddenDuringTest=true}else check();
    };
    const id=window.setInterval(check,100);
    document.addEventListener('visibilitychange',visibility);
    return ()=>{window.clearInterval(id);document.removeEventListener('visibilitychange',visibility)};
  },[phase]);

  // Focus mode hides the site chrome and settings; it is never stored.
  useEffect(()=>{
    document.documentElement.classList.toggle('typing-focus-mode',focusMode);
    return ()=>document.documentElement.classList.remove('typing-focus-mode');
  },[focusMode]);

  // Keep the typing line visible when a mobile keyboard shrinks the viewport.
  useEffect(()=>{
    const vv=window.visualViewport;if(!vv)return;
    const onResize=()=>{
      const input=inputRef.current,view=viewportRef.current;
      if(!input||!view||document.activeElement!==input)return;
      const rect=view.getBoundingClientRect();
      if(rect.bottom>vv.height||rect.top<0)view.scrollIntoView({block:'center'});
    };
    vv.addEventListener('resize',onResize);
    return ()=>vv.removeEventListener('resize',onResize);
  },[]);

  function savePrefs(patch:Partial<Prefs>){
    writePrefs(storageRef.current,{settings,textSize,sound,customText,...patch} satisfies Prefs);
  }

  function applyCustomText(){
    const outcome=prepareCustomText(customDraft);
    if(!outcome.ok){setCustomError(outcome.error);return}
    setCustomError('');setCustomText(outcome.text);setCustomDraft(outcome.text);
    savePrefs({customText:outcome.text});
    load(makeTest(settings,outcome.text),true);
    setAnnouncement('Custom text ready. Start typing.');
  }

  async function copyResults(){
    if(!result)return;
    setCopied(await copyText(resultSummary(result))?'done':'failed');
  }

  function changeMode(){
    setFocusMode(false);
    newTest(false);
    requestAnimationFrame(()=>{
      const active=modeGroupRef.current?.querySelector<HTMLButtonElement>('[aria-pressed="true"]');
      modeGroupRef.current?.scrollIntoView({block:'nearest'});
      active?.focus({preventScroll:true});
    });
  }

  const test=testRef.current;
  const mode=settings.mode;
  const summary=summarize(history);
  const needsCustom=mode==='custom'&&!customText;
  const r=result;

  return <div className={styles.app} data-size={textSize} data-focus={focusMode?'on':'off'} ref={panelRef}>
    <div className={styles.toolbar} data-hide-in-focus="">
      <div className={styles.modeGroup} role="group" aria-label="Test mode" ref={modeGroupRef}>
        {MODES.map(m=><button key={m.id} type="button" aria-pressed={mode===m.id} className={mode===m.id?styles.active:''} onClick={()=>applySettings({mode:m.id})}>{m.label}</button>)}
      </div>
      <div className={styles.options}>
        {(mode==='time'||mode==='practice')&&<div className={styles.chips} role="group" aria-label="Test duration">
          {DURATIONS.map(d=><button key={d} type="button" aria-pressed={settings.duration===d} className={settings.duration===d?styles.active:''} onClick={()=>applySettings({duration:d})}>{d<60?d+'s':d===60?'1 min':d/60+' min'}</button>)}
        </div>}
        {mode==='words'&&<div className={styles.chips} role="group" aria-label="Number of words">
          {WORD_COUNTS.map(n=><button key={n} type="button" aria-pressed={settings.wordCount===n} className={settings.wordCount===n?styles.active:''} onClick={()=>applySettings({wordCount:n})}>{n} words</button>)}
        </div>}
        {mode==='quote'&&<div className={styles.chips} role="group" aria-label="Passage length">
          {QUOTE_LENGTHS.map(q=><button key={q.id} type="button" aria-pressed={settings.quoteLength===q.id} className={settings.quoteLength===q.id?styles.active:''} onClick={()=>applySettings({quoteLength:q.id})}>{q.label}</button>)}
        </div>}
        {mode==='practice'&&<label className={styles.select}><span>Practice</span>
          <select value={settings.drill} onChange={e=>applySettings({drill:e.target.value as Drill})}>{DRILLS.map(d=><option key={d.id} value={d.id}>{d.label}</option>)}</select></label>}
      </div>
      <details className={styles.optionDisclosure}>
        <summary>Options</summary>
        <div className={styles.advancedOptions}>
        {(mode==='time'||mode==='words')&&<>
          <label className={styles.select}><span>Difficulty</span>
            <select value={settings.difficulty} onChange={e=>applySettings({difficulty:e.target.value as Difficulty})}>{DIFFICULTIES.map(d=><option key={d.id} value={d.id}>{d.label}</option>)}</select></label>
          <label className={styles.toggle}><input type="checkbox" checked={settings.punctuation} onChange={e=>applySettings({punctuation:e.target.checked})}/><span>Punctuation</span></label>
          <label className={styles.toggle}><input type="checkbox" checked={settings.numbers} onChange={e=>applySettings({numbers:e.target.checked})}/><span>Numbers</span></label>
        </>}
      <div className={styles.prefs}>
        <label className={styles.select}><span>Text size</span>
          <select value={textSize} onChange={e=>{const v=e.target.value as TextSize;setTextSize(v);savePrefs({textSize:v})}}>{TEXT_SIZES.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}</select></label>
        <button type="button" className={styles.iconToggle} aria-pressed={sound} onClick={()=>{const v=!sound;setSound(v);savePrefs({sound:v});if(v){try{audioRef.current??=new AudioContext();void audioRef.current.resume()}catch{}}}}>
          {sound?<Volume2 size={17} aria-hidden="true"/>:<VolumeX size={17} aria-hidden="true"/>}Sound {sound?'on':'off'}</button>
        <button type="button" className={styles.iconToggle} aria-pressed={focusMode} onClick={()=>setFocusMode(true)}><Maximize2 size={17} aria-hidden="true"/>Focus mode</button>
      </div>
        </div>
      </details>
    </div>

    {mode==='custom'&&<div className={styles.customPanel} data-hide-in-focus="">
      <label htmlFor="typing-custom-text">Your practice text</label>
      <p id="typing-custom-help">Paste or write {`20–${CUSTOM_MAX_CHARS.toLocaleString('en-US')}`} characters of English text. Line breaks become spaces and curly quotes become straight quotes. Custom-text results are practice results, not standard scores.</p>
      <textarea id="typing-custom-text" value={customDraft} maxLength={CUSTOM_MAX_CHARS*2} rows={4} aria-describedby={'typing-custom-help'+(customError?' typing-custom-error':'')} aria-invalid={!!customError}
        onChange={e=>{setCustomDraft(e.target.value);if(customError)setCustomError('')}} spellCheck/>
      <div className={styles.customActions}>
        <span>{customDraft.length.toLocaleString('en-US')} / {CUSTOM_MAX_CHARS.toLocaleString('en-US')}</span>
        {customError&&<p id="typing-custom-error" role="alert" className={styles.customError}>{customError}</p>}
        <button type="button" className={styles.primaryButton} onClick={applyCustomText}>Use this text</button>
      </div>
    </div>}

    {focusMode&&<div className={styles.focusBar}>
      <span><Keyboard size={17} aria-hidden="true"/>Focus mode</span>
      <button type="button" className={styles.ghostButton} onClick={()=>restart()}><RotateCcw size={16} aria-hidden="true"/>Restart</button>
      <button type="button" className={styles.ghostButton} onClick={()=>setFocusMode(false)}><Minimize2 size={16} aria-hidden="true"/>Exit focus mode</button>
    </div>}

    <section className={styles.testCard} aria-label="Typing test">
      <div hidden={phase==='finished'}>
        <LiveStats session={sessionRef} runKey={runKey} phase={phase} wordTotal={test?.prepared.wordTotal}/>
        <div className={styles.stage} data-focused={focused?'yes':'no'} data-phase={phase}>
          <div className={styles.viewport} ref={viewportRef} aria-hidden="true">
            <div className={styles.lines} ref={linesRef} key={runKey} data-testid="prompt">
              {chunks.map((chunk,i)=><Chunk key={i} text={chunk}/>)}
              <span className={styles.caret} ref={caretRef} data-idle={phase==='running'?'no':'yes'}/>
            </div>
            {!chunks.length&&<p className={styles.placeholder}>{!ready?'Preparing your test…':needsCustom?'Add your own text above, then select “Use this text”.':''}</p>}
          </div>
          <input ref={inputRef} className={styles.input} type="text" aria-label="Typing input. Type the text shown; the timer starts with your first character."
            aria-describedby="typing-instructions typing-upcoming" autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false}
            inputMode="text" enterKeyHint="done" data-gramm="false" data-lpignore="true" data-1p-ignore="" disabled={!chunks.length}
            onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}/>
          {!focused&&chunks.length>0&&phase!=='finished'&&<div className={styles.focusHint} aria-hidden="true">
            {phase==='running'?'Timer running. Select here to keep typing.':<><span className={styles.mouseHint}>Click here and start typing</span><span className={styles.touchHint}>Tap here and start typing</span></>}
          </div>}
        </div>
        <p className={styles.srOnly}>Upcoming words: <span id="typing-upcoming" ref={upcomingRef}/></p>
        <p className={styles.notice} role="status" aria-live="polite">{notice}</p>
        <details className={styles.liveDetails} data-hide-in-focus=""><summary>Live details</summary><DetailStats session={sessionRef} runKey={runKey} phase={phase}/></details>
        <div className={styles.actions} data-hide-in-focus="">
          <button type="button" className={styles.ghostButton} onClick={()=>restart()} disabled={!chunks.length}><RotateCcw size={16} aria-hidden="true"/>Restart <kbd>Esc</kbd></button>
          <button type="button" className={styles.ghostButton} onClick={()=>newTest()} disabled={needsCustom}><Shuffle size={16} aria-hidden="true"/>New test <kbd>Ctrl</kbd><kbd>Enter</kbd></button>
          <p id="typing-instructions" className={styles.srOnly}>Type the text exactly as shown, including capitals, spaces and punctuation. Mistakes stay red until you fix them with Backspace. The clock never pauses once you start.</p>
        </div>
      </div>

      {r&&phase==='finished'&&<div className={styles.results} key={runKey} data-testid="results">
        <div className={styles.resultsHead}>
          <div>
            <h2 ref={resultsHeadingRef} tabIndex={-1}><span data-result="net">{fmtWpm(r.stats.net)}</span> <small>WPM</small></h2>
            <p className={styles.resultStatus}>
              Test completed
            </p>
            {r.invalid&&<p className={styles.practiceNote}>{r.invalid}</p>}
            {!r.saved&&!r.invalid&&<p className={styles.practiceNote}>{r.storage?'Not saved.':'Not saved: local storage is unavailable.'}</p>}
            {r.practice&&<p className={styles.practiceNote}>Practice result. Excluded from personal best.</p>}
            <p className={styles.smallNote}>Raw WPM <strong>{fmtWpm(r.stats.gross)}</strong></p>
          </div>
          {r.newBest&&<span className={styles.bestBadge}><Trophy size={18} aria-hidden="true"/>Personal best</span>}
        </div>
        <dl className={styles.resultPrimary}>
          <div><dt>Accuracy</dt><dd data-result="accuracy">{fmtPct(r.stats.accuracy)}</dd></div>
          <div><dt>Errors</dt><dd>{r.stats.uncorrected}<small>Uncorrected</small></dd></div>
          <div><dt>Duration</dt><dd data-result="duration">{formatDuration(r.stats.elapsedMs)}</dd></div>
        </dl>
        <div className={styles.resultActions}>
          <button type="button" className={styles.primaryButton} onClick={()=>restart()}><RotateCcw size={17} aria-hidden="true"/>Try Again</button>
          <button type="button" className={styles.ghostButton} onClick={()=>newTest()}><Shuffle size={16} aria-hidden="true"/>New Test</button>
        </div>
        <div className={styles.secondaryActions}>
          <button type="button" onClick={changeMode}><SlidersHorizontal size={16} aria-hidden="true"/>Change Mode</button>
          <button type="button" onClick={copyResults}>{copied==='done'?<Check size={16} aria-hidden="true"/>:<Copy size={16} aria-hidden="true"/>}{copied==='done'?'Copied':'Copy Results'}</button>
          <span role="status" className={styles.copyStatus}>{copied==='done'?'Result summary copied to the clipboard.':copied==='failed'?'Copy failed. Select the summary below and copy it manually.':''}</span>
        </div>
        {copied==='failed'&&<textarea className={styles.copyFallback} readOnly value={resultSummary(r)} aria-label="Result summary" rows={8}/>}
        <details className={styles.disclosure}>
          <summary>Detailed Stats</summary>
        <dl className={styles.resultSecondary}>
          <div><dt>Raw WPM</dt><dd data-result="raw">{fmtWpm(r.stats.gross)}</dd></div>
          <div><dt>Correct characters</dt><dd data-result="correct">{r.stats.correct}</dd></div>
          <div><dt>Incorrect characters</dt><dd data-result="incorrect">{r.stats.incorrect}</dd></div>
          <div><dt>Keystroke accuracy</dt><dd data-result="keystroke-accuracy">{fmtPct(r.stats.keystrokeAccuracy)}</dd></div>
          <div><dt>Consistency</dt><dd data-result="consistency">{r.consistency===null?'Not enough data':Math.round(r.consistency)+'%'}</dd></div>
          <div><dt>Corrected mistakes</dt><dd data-result="corrected">{r.stats.corrected}</dd></div>
          <div><dt>Uncorrected mistakes</dt><dd data-result="uncorrected">{r.stats.uncorrected}</dd></div>
          <div><dt>Total typed characters</dt><dd data-result="typed">{r.stats.keystrokes}</dd></div>
          <div><dt>Mode</dt><dd>{MODES.find(m=>m.id===r.mode)!.label}</dd></div>
        </dl>
        {r.consistency===null&&<p className={styles.smallNote}>Consistency needs at least 5 full seconds of typing, so it is not shown for this test.</p>}
        <h3 className={styles.chartTitle}>Speed over time</h3>
        <WpmChart samples={r.samples}/>
        </details>
      </div>}
    </section>

    <p className={styles.srOnly} role="status" aria-live="polite">{announcement}</p>

    {!storageOk&&<p className={styles.storageWarning} role="note" data-hide-in-focus="">Saving is unavailable because this browser is blocking local storage. Your results still appear after each test.</p>}
    {(history.length>0||best)&&<section className={styles.progress} aria-labelledby="typing-progress-title" data-hide-in-focus="">
      <div className={styles.progressHead}>
        <h2 id="typing-progress-title">Progress</h2>
      </div>
      <dl className={styles.progressStats}>
        <div><dt>Best WPM</dt><dd><span data-progress="best">{best?fmtWpm(best.wpm)+' WPM':'–'}</span>{best&&<small>{best.label}</small>}</dd></div>
        <div><dt>Average WPM</dt><dd data-progress="average">{summary.averageWpm===null?'–':fmtWpm(summary.averageWpm)}</dd></div>
        <div><dt>Average accuracy</dt><dd data-progress="accuracy">{fmtPct(summary.averageAccuracy)}</dd></div>
        <div><dt>Sessions</dt><dd data-progress="sessions">{summary.sessions}</dd></div>
      </dl>
      <details className={styles.disclosure}>
      <summary>History</summary>
      {history.length>0?<div className={styles.tableScroll} tabIndex={0} role="region" aria-label="Recent tests"><table className={styles.historyTable}>
        <caption className={styles.srOnly}>Recent completed tests, newest first</caption>
        <thead><tr><th scope="col">Date</th><th scope="col">Test</th><th scope="col">WPM</th><th scope="col">Raw</th><th scope="col">Accuracy</th></tr></thead>
        <tbody>{history.slice(0,10).map(e=><tr key={e.id}>
          <td><span className={styles.mobileCell}>Date</span>{new Date(e.at).toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}</td>
          <td><span className={styles.mobileCell}>Test</span>{e.label}</td><td><span className={styles.mobileCell}>WPM</span>{fmtWpm(e.wpm)}</td><td><span className={styles.mobileCell}>Raw WPM</span>{fmtWpm(e.raw)}</td><td><span className={styles.mobileCell}>Accuracy</span>{fmtPct(e.accuracy)}</td>
        </tr>)}</tbody>
      </table></div>:<p className={styles.smallNote}>No saved sessions.</p>}
      <div className={styles.progressActions}>
        <ConfirmButton label="Clear history" confirm="Select again to clear history" disabled={!history.length||!storageOk}
          onConfirm={()=>{if(clearHistory(storageRef.current)){setHistory([]);setAnnouncement('History cleared.')}}}/>
        <ConfirmButton label="Reset personal best" confirm="Select again to reset" disabled={!best||!storageOk}
          onConfirm={()=>{if(resetBest(storageRef.current)){setBest(null);setAnnouncement('Personal best reset.')}}}/>
      </div>
      </details>
    </section>}
  </div>;
}
