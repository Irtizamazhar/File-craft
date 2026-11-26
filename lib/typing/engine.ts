/**
 * Typing Speed Test scoring engine. Pure logic with no imports, so unit tests can load it directly.
 *
 * Scoring standard (documented on /typing-test):
 *  - One standardized word = 5 characters, spaces and punctuation included.
 *  - Accepted characters = the characters standing in your typed text (correct + uncorrected wrong).
 *    Characters you erased with Backspace are not accepted characters.
 *  - Gross (raw) WPM = accepted characters / 5 / elapsed minutes.
 *  - Net WPM = max(0, gross WPM - uncorrected errors / elapsed minutes).
 *  - Accuracy = correct characters / accepted characters (corrected mistakes no longer count against it).
 *  - Keystroke accuracy = correct keystrokes / all character keystrokes (every mistake counts, even if corrected).
 *  - Backspace, navigation and modifier keys are never counted as typed characters.
 * All maths uses unrounded values; rounding happens only for display.
 */

export const CHARS_PER_WORD=5;
export const MS_PER_MINUTE=60000;
/** Results faster than this gross speed are shown but never saved (no human sustains it). */
export const MAX_PLAUSIBLE_WPM=350;
/** Live WPM is hidden until this much time has passed, to avoid meaningless spikes after one keystroke. */
export const LIVE_WPM_MIN_MS=1000;
export const MIN_SCORED_MS=2000;
export const MIN_SCORED_KEYSTROKES=5;
/** Consistency needs at least this many full one-second samples. */
export const MIN_CONSISTENCY_SAMPLES=5;

const finite=(value:number)=>Number.isFinite(value)?value:0;

export function grossWpm(chars:number,elapsedMs:number):number{
  if(!(elapsedMs>0)||!(chars>0))return 0;
  return finite(chars/CHARS_PER_WORD/(elapsedMs/MS_PER_MINUTE));
}

export function netWpm(chars:number,uncorrected:number,elapsedMs:number):number{
  if(!(elapsedMs>0)||!(chars>0))return 0;
  const value=grossWpm(chars,elapsedMs)-Math.max(0,uncorrected||0)/(elapsedMs/MS_PER_MINUTE);
  return value>0&&Number.isFinite(value)?value:0;
}

/** part/total as a percentage, or null when there is nothing to measure yet. Always within 0..100. */
export function percentage(part:number,total:number):number|null{
  if(!(total>0))return null;
  return Math.min(100,Math.max(0,finite(part/total*100)));
}

/** Typographic quotes from smart-punctuation keyboards count as the straight quotes shown in the text. */
export function charsMatch(expected:string,typed:string){
  if(expected===typed)return true;
  if(expected==="'")return /^[‘’ʼ′]$/.test(typed);
  if(expected==='"')return /^[“”″]$/.test(typed);
  if(expected===' ')return typed===' ';
  return false;
}

export type CompletionRule={kind:'time';durationMs:number}|{kind:'text'};
export type EndReason='time'|'complete';
/** One logged edit: t = ms since the first keystroke, d = +1 typed / -1 erased, ok = the character was correct. */
export type LogEvent={t:number;d:1|-1;ok:boolean};

export type Stats={
  elapsedMs:number;
  gross:number;net:number;
  accuracy:number|null;keystrokeAccuracy:number|null;
  correct:number;incorrect:number;uncorrected:number;corrected:number;
  keystrokes:number;accepted:number;
  progress:number;
};

export class TypingSession{
  target:string;
  readonly rule:CompletionRule;
  typed='';
  private flags:boolean[]=[];
  correct=0;wrong=0;keystrokes=0;wrongKeystrokes=0;
  startedAt:number|null=null;
  endedAt:number|null=null;
  endReason:EndReason|null=null;
  hiddenDuringTest=false;
  log:LogEvent[]=[];

  constructor(target:string,rule:CompletionRule){this.target=target;this.rule=rule}

  get position(){return this.typed.length}
  get started(){return this.startedAt!==null}
  get ended(){return this.endedAt!==null}
  get running(){return this.started&&!this.ended}

  /** True once a timed test has reached its limit (call finishIfExpired to record it). */
  isExpired(now:number){
    return this.rule.kind==='time'&&this.startedAt!==null&&now-this.startedAt>=this.rule.durationMs;
  }

  finishIfExpired(now:number){
    if(this.running&&this.isExpired(now)){this.finish('time',now);return true}
    return false;
  }

  private finish(reason:EndReason,now:number){
    if(this.ended||this.startedAt===null)return;
    this.endReason=reason;
    this.endedAt=reason==='time'&&this.rule.kind==='time'?this.startedAt+this.rule.durationMs:now;
  }

  /** Type one character. Returns false when the keystroke is not accepted (finished, expired or past the end). */
  type(char:string,now:number):boolean{
    if(this.ended||char.length!==1)return false;
    if(this.finishIfExpired(now))return false;
    const index=this.typed.length;
    if(index>=this.target.length)return false;
    if(this.startedAt===null)this.startedAt=now;
    const ok=charsMatch(this.target[index],char);
    this.typed+=char;
    this.flags.push(ok);
    this.keystrokes++;
    if(ok)this.correct++;else{this.wrong++;this.wrongKeystrokes++}
    this.log.push({t:now-this.startedAt,d:1,ok});
    if(this.rule.kind==='text'&&this.typed.length===this.target.length)this.finish('complete',now);
    return true;
  }

  /** Erase up to `count` characters (Backspace, Ctrl+Backspace). Erasing is not a typed character. */
  erase(count:number,now:number):number{
    if(this.ended||this.startedAt===null||!(count>0))return 0;
    if(this.finishIfExpired(now))return 0;
    const n=Math.min(Math.floor(count),this.typed.length);
    for(let i=0;i<n;i++){
      const ok=this.flags.pop()!;
      if(ok)this.correct--;else this.wrong--;
      this.log.push({t:now-this.startedAt,d:-1,ok});
    }
    this.typed=this.typed.slice(0,this.typed.length-n);
    return n;
  }

  /** Append more prompt text (timed tests never run out of text). */
  extend(text:string){if(this.rule.kind==='time'&&!this.ended)this.target+=text}

  elapsed(now:number){
    if(this.startedAt===null)return 0;
    const end=this.endedAt??now;
    const ms=Math.max(0,end-this.startedAt);
    return this.rule.kind==='time'?Math.min(ms,this.rule.durationMs):ms;
  }

  stats(now:number):Stats{
    const elapsedMs=this.elapsed(now);
    const accepted=this.typed.length;
    const progress=this.rule.kind==='time'
      ?Math.min(100,elapsedMs/this.rule.durationMs*100)
      :this.target.length?Math.min(100,accepted/this.target.length*100):0;
    return {
      elapsedMs,
      gross:grossWpm(accepted,elapsedMs),
      net:netWpm(accepted,this.wrong,elapsedMs),
      accuracy:percentage(this.correct,accepted),
      keystrokeAccuracy:percentage(this.keystrokes-this.wrongKeystrokes,this.keystrokes),
      correct:this.correct,
      incorrect:this.wrongKeystrokes,
      uncorrected:this.wrong,
      corrected:this.wrongKeystrokes-this.wrong,
      keystrokes:this.keystrokes,
      accepted,
      progress
    };
  }
}

export type Sample={
  /** End of the sample window, ms since the first keystroke. */
  t:number;
  /** Net WPM of everything typed up to t (converges to the final result). */
  wpm:number;
  /** Raw speed of the keystrokes typed inside this window; null for a final window shorter than 0.5 s. */
  raw:number|null;
  /** Wrong keystrokes inside this window. */
  errors:number;
  full:boolean;
};

/** One sample per second of the test (plus the final partial second), replayed from the real keystroke log. */
export function buildSamples(log:readonly LogEvent[],endMs:number):Sample[]{
  if(!(endMs>0))return [];
  const fullCount=Math.floor(endMs/1000);
  const partial=endMs-fullCount*1000>0;
  const count=fullCount+(partial?1:0);
  const typedIn=new Array(count).fill(0),errorsIn=new Array(count).fill(0),lenDelta=new Array(count).fill(0),wrongDelta=new Array(count).fill(0);
  for(const event of log){
    const index=Math.min(count-1,Math.max(0,Math.floor(event.t/1000)));
    lenDelta[index]+=event.d;
    if(!event.ok)wrongDelta[index]+=event.d;
    if(event.d===1){typedIn[index]++;if(!event.ok)errorsIn[index]++}
  }
  const samples:Sample[]=[];
  let length=0,wrong=0;
  for(let i=0;i<count;i++){
    length+=lenDelta[i];wrong+=wrongDelta[i];
    const end=i<fullCount?(i+1)*1000:endMs;
    const windowMs=end-i*1000;
    samples.push({
      t:end,
      wpm:netWpm(length,wrong,end),
      raw:windowMs>=500?grossWpm(typedIn[i],windowMs):null,
      errors:errorsIn[i],
      full:i<fullCount
    });
  }
  return samples;
}

/**
 * Consistency = 100 - coefficient of variation (stdev / mean x 100) of the per-second raw speed, clamped to 0..100.
 * Returns null when there are fewer than MIN_CONSISTENCY_SAMPLES full seconds or no typing at all.
 */
export function consistency(samples:readonly Sample[]):number|null{
  const values=samples.filter(s=>s.full&&s.raw!==null).map(s=>s.raw as number);
  if(values.length<MIN_CONSISTENCY_SAMPLES)return null;
  const mean=values.reduce((a,b)=>a+b,0)/values.length;
  if(!(mean>0))return null;
  const variance=values.reduce((a,b)=>a+(b-mean)**2,0)/values.length;
  const cv=Math.sqrt(variance)/mean*100;
  return Math.min(100,Math.max(0,finite(100-cv)));
}

/** Why a finished result is not saved, or null when it is a valid result. */
export function invalidReason(stats:Stats,hiddenDuringTest:boolean):string|null{
  if(hiddenDuringTest)return 'The browser tab was hidden during the test, so this result was not saved.';
  if(stats.keystrokes<MIN_SCORED_KEYSTROKES||stats.correct<1)return 'Too little typing to score, so this result was not saved.';
  if(stats.elapsedMs<MIN_SCORED_MS)return 'The test lasted under 2 seconds, so this result was not saved.';
  if(stats.gross>MAX_PLAUSIBLE_WPM)return 'The input was faster than a person can type, so this result was not saved.';
  return null;
}

export const round=(value:number,digits=0)=>{const f=10**digits;return Math.round(value*f)/f};

export function formatDuration(ms:number){
  const total=Math.max(0,ms)/1000;
  if(total<60)return (Math.round(total*10)/10).toFixed(1)+' s';
  const minutes=Math.floor(total/60),seconds=Math.round(total-minutes*60);
  return seconds===60?`${minutes+1} min 0 s`:`${minutes} min ${seconds} s`;
}
