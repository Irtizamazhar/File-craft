import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
async function source(path){const code=ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;return import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'))}
const engine=await source('lib/typing/engine.ts');
const content=await source('lib/typing/content.ts');
const history=await source('lib/typing/history.ts');
const {TypingSession,grossWpm,netWpm,percentage,charsMatch,buildSamples,consistency,invalidReason}=engine;

const close=(a,b,eps=1e-9)=>assert.ok(Math.abs(a-b)<=eps,`${a} != ${b}`);
const allFinite=stats=>{for(const [k,v] of Object.entries(stats))if(typeof v==='number')assert.ok(Number.isFinite(v)&&v>=0,`${k}=${v}`)};
function typeAll(session,text,start,step){let t=start;for(const ch of text){session.type(ch,t);t+=step}return t-step}

test('documented WPM examples: 300 chars in 60 s = 60 gross, 10 uncorrected errors = 50 net',()=>{
  assert.equal(grossWpm(300,60000),60);
  assert.equal(netWpm(300,10,60000),50);
  assert.equal(grossWpm(150,30000),60);
  assert.equal(netWpm(150,5,30000),50);
  close(grossWpm(1,60000),0.2);
});

test('WPM is never negative, NaN or Infinity',()=>{
  for(const [c,e,ms] of [[0,0,0],[10,0,0],[10,5,-5],[NaN,0,1000],[10,NaN,1000],[10,0,NaN],[5,100,60000],[Infinity,0,1000]]){
    const g=grossWpm(c,ms),n=netWpm(c,e,ms);
    assert.ok(Number.isFinite(g)&&g>=0,`gross ${c},${ms}`);
    assert.ok(Number.isFinite(n)&&n>=0,`net ${c},${e},${ms}`);
  }
  assert.equal(netWpm(10,50,60000),0);
});

test('accuracy formulas with exact inputs',()=>{
  assert.equal(percentage(95,100),95);
  assert.equal(percentage(0,0),null);
  assert.equal(percentage(3,4),75);
  assert.equal(percentage(5,4),100);
  // Session: prompt "abcd", type a b x, Backspace, c d.
  const s=new TypingSession('abcd',{kind:'text'});
  s.type('a',0);s.type('b',100);s.type('x',200);
  let st=s.stats(200);
  assert.equal(st.correct,2);assert.equal(st.uncorrected,1);assert.equal(st.incorrect,1);
  close(st.accuracy,200/3);close(st.keystrokeAccuracy,200/3);
  s.erase(1,300);
  st=s.stats(300);
  assert.equal(st.uncorrected,0);assert.equal(st.corrected,1);assert.equal(st.accuracy,100);
  s.type('c',400);s.type('d',500);
  st=s.stats(900);
  assert.ok(s.ended);assert.equal(s.endReason,'complete');
  assert.equal(st.keystrokes,5);assert.equal(st.accepted,4);assert.equal(st.correct,4);
  assert.equal(st.accuracy,100);assert.equal(st.keystrokeAccuracy,80);
  assert.equal(st.elapsedMs,500);
  close(st.gross,4/5/(500/60000));
});

test('correct, incorrect and repeated keystrokes are each counted once',()=>{
  const s=new TypingSession('aaaa bbbb',{kind:'text'});
  typeAll(s,'aaaa',0,50);
  assert.equal(s.stats(150).correct,4);
  s.type('x',200);s.type('x',250);
  const st=s.stats(250);
  assert.equal(st.correct,4);assert.equal(st.uncorrected,2);assert.equal(st.incorrect,2);assert.equal(st.keystrokes,6);
  // Ctrl+Backspace style multi-character erase.
  assert.equal(s.erase(3,300),3);
  const after=s.stats(300);
  assert.equal(after.correct,3);assert.equal(after.uncorrected,0);assert.equal(after.corrected,2);assert.equal(after.keystrokes,6);
  assert.equal(s.erase(99,350),3);
  assert.equal(s.position,0);
  allFinite(s.stats(400));
});

test('smart-punctuation quotes match straight quotes; other characters do not',()=>{
  assert.ok(charsMatch("'",'’'));assert.ok(charsMatch('"','“'));assert.ok(charsMatch(' ',' '));
  assert.ok(!charsMatch('a','A'));assert.ok(!charsMatch("'",'`'));
});

test('timer starts on the first typed character, not before',()=>{
  const s=new TypingSession('hello world',{kind:'time',durationMs:15000});
  assert.equal(s.elapsed(99999),0);
  assert.equal(s.started,false);
  allFinite(s.stats(5000));
  assert.equal(s.erase(1,5000),0,'Backspace before typing does not start the timer');
  assert.equal(s.started,false);
  s.type('h',10000);
  assert.equal(s.startedAt,10000);
  assert.equal(s.elapsed(12500),2500);
});

for(const seconds of [15,30,60,120,300]){
  test(`${seconds}-second mode ends exactly at the limit with a fake clock`,()=>{
    const duration=seconds*1000,start=1234.5,step=200;
    const prompt='a'.repeat(seconds*10);
    const s=new TypingSession(prompt,{kind:'time',durationMs:duration});
    let accepted=0;
    for(let t=start;t<start+duration+5000;t+=step){if(s.type('a',t))accepted++}
    assert.ok(s.ended);assert.equal(s.endReason,'time');
    assert.equal(accepted,duration/step);
    assert.equal(s.elapsed(start+duration*10),duration,'elapsed is clamped to the duration');
    const st=s.stats(start+duration*10);
    assert.equal(st.elapsedMs,duration);
    close(st.gross,accepted/5/(duration/60000));
    assert.equal(st.progress,100);
    assert.equal(s.type('a',start+duration+99999),false,'no input after completion');
  });
}

test('a keystroke at the deadline is rejected and the test ends at the deadline',()=>{
  const s=new TypingSession('abcdef',{kind:'time',durationMs:1000});
  s.type('a',0);
  assert.equal(s.type('b',999.9),true);
  assert.equal(s.type('c',1000),false);
  assert.equal(s.endedAt,1000);
  assert.equal(s.finishIfExpired(5000),false);
});

test('a timed test with a deadline passing while idle (hidden tab) still ends at the deadline',()=>{
  const s=new TypingSession('abcdef',{kind:'time',durationMs:30000});
  s.type('a',0);s.hiddenDuringTest=true;
  assert.equal(s.finishIfExpired(90000),true);
  assert.equal(s.elapsed(90000),30000);
  const st=s.stats(90000);
  assert.match(invalidReason(st,s.hiddenDuringTest),/hidden/);
});

test('word and quote tests complete when the final character is typed, mistakes included',()=>{
  const text='one two three four five six seven eight nine ten';
  const s=new TypingSession(text,{kind:'text'});
  const wrong='onx'+text.slice(3);
  const end=typeAll(s,wrong,0,100);
  assert.ok(s.ended);assert.equal(s.endReason,'complete');
  const st=s.stats(end+5000);
  assert.equal(st.elapsedMs,end);assert.equal(st.uncorrected,1);assert.equal(st.progress,100);
  close(st.net,Math.max(0,text.length/5/(end/60000)-1/(end/60000)));
});

test('extend() lets timed prompts continue seamlessly',()=>{
  const s=new TypingSession('ab',{kind:'time',durationMs:60000});
  s.type('a',0);s.type('b',10);
  assert.equal(s.type(' ',20),false,'cannot type past the current end');
  s.extend(' cd');
  assert.equal(s.type(' ',30),true);
  assert.equal(s.target,'ab cd');
  const text=new TypingSession('ab',{kind:'text'});text.extend('zz');assert.equal(text.target,'ab');
});

test('very fast input is scored exactly and flagged as implausible',()=>{
  const s=new TypingSession('x'.repeat(2000),{kind:'time',durationMs:15000});
  for(let i=0;i<1000;i++)s.type('x',i);
  const st=s.stats(1000);
  assert.equal(st.keystrokes,1000);
  close(st.gross,1000/5/(1000/60000));
  allFinite(st);
  assert.match(invalidReason({...st,elapsedMs:15000},false),/faster/);
});

test('validity rules for saving results',()=>{
  const ok={keystrokes:100,correct:90,elapsedMs:60000,gross:60};
  assert.equal(invalidReason(ok,false),null);
  assert.match(invalidReason({...ok,keystrokes:3},false),/Too little/);
  assert.match(invalidReason({...ok,elapsedMs:1500},false),/under 2 seconds/);
  assert.match(invalidReason(ok,true),/hidden/);
});

test('graph samples are replayed from the real keystroke log',()=>{
  const log=[
    {t:0,d:1,ok:true},{t:200,d:1,ok:true},{t:400,d:1,ok:false},{t:600,d:-1,ok:false},{t:800,d:1,ok:true}, // second 1: 4 typed, 1 erased
    {t:1100,d:1,ok:true},{t:1500,d:1,ok:false},                                                         // second 2: 2 typed
    {t:2100,d:1,ok:true}                                                                                // partial 2.0-2.4 s
  ];
  const samples=buildSamples(log,2400);
  assert.equal(samples.length,3);
  assert.deepEqual(samples.map(s=>s.t),[1000,2000,2400]);
  close(samples[0].wpm,netWpm(3,0,1000));
  close(samples[0].raw,grossWpm(4,1000));
  assert.equal(samples[0].errors,1);
  close(samples[1].wpm,netWpm(5,1,2000));
  close(samples[1].raw,grossWpm(2,1000));
  assert.equal(samples[1].errors,1);
  assert.equal(samples[2].raw,null,'a final window under 0.5 s has no raw speed');
  close(samples[2].wpm,netWpm(6,1,2400));
  assert.equal(samples[2].full,false);
  assert.deepEqual(buildSamples([],0),[]);
  // The last sample always equals the final result.
  const s=new TypingSession('abcdefghij'.repeat(10),{kind:'text'});
  const end=typeAll(s,'abcdefghij'.repeat(10),0,73);
  const last=buildSamples(s.log,s.elapsed(end)).at(-1);
  close(last.wpm,s.stats(end).net);
});

test('consistency needs 5 full seconds and is 100 for a perfectly even pace',()=>{
  const even=[1,2,3,4,5].map(i=>({t:i*1000,wpm:60,raw:60,errors:0,full:true}));
  assert.equal(consistency(even),100);
  assert.equal(consistency(even.slice(0,4)),null);
  const varied=[40,60,80,60,60].map((raw,i)=>({t:(i+1)*1000,wpm:60,raw,errors:0,full:true}));
  const sd=Math.sqrt((400+0+400+0+0)/5);
  close(consistency(varied),100-sd/60*100);
  assert.equal(consistency([1,2,3,4,5].map(i=>({t:i*1000,wpm:0,raw:0,errors:0,full:true}))),null);
});

test('word streams are deterministic, continue seamlessly and never run out',()=>{
  const opts={difficulty:'easy',punctuation:false,numbers:false};
  const a=content.createWordStream(42,opts),b=content.createWordStream(42,opts);
  assert.deepEqual(a.next(50),b.next(50));
  const more=a.next(3000);
  assert.equal(more.length,3000);
  assert.ok(more.join(' ').length>10000,'enough text for a 5-minute test at any speed');
  for(const word of more)assert.match(word,/^[a-z]+$/);
  const punct=content.createWordStream(7,{difficulty:'medium',punctuation:true,numbers:true}).next(400).join(' ');
  assert.match(punct,/[.,?!]/);assert.match(punct,/\d/);assert.match(punct,/^[A-Z]/);
  assert.match(punct,/^[\x20-\x7e]+$/);
  for(const drill of ['common','sentences','numbers','punctuation','capitals','mixed']){
    const words=content.createDrillStream(3,drill,'medium').next(500);
    assert.equal(words.length,500,drill);
    assert.match(words.join(' '),/^[\x20-\x7e]+$/,drill);
  }
  assert.match(content.createDrillStream(3,'numbers','easy').next(100).join(' '),/\d/);
  assert.match(content.createDrillStream(3,'capitals','easy').next(100).join(' '),/[A-Z]/);
});

test('original passages: unique, typable, all lengths available and repeat-avoiding',()=>{
  const en=content.getLanguage('en');
  const ids=en.passages.map(p=>p.id),texts=en.passages.map(p=>p.text);
  assert.equal(new Set(ids).size,ids.length);assert.equal(new Set(texts).size,texts.length);
  for(const p of en.passages)assert.match(p.text,/^[\x20-\x7e]+$/,p.id);
  for(const length of ['short','medium','long'])assert.ok(en.passages.filter(p=>p.length===length).length>=5,length);
  assert.ok(en.sentences.length>=50);
  for(let seed=0;seed<50;seed++)assert.notEqual(content.pickPassage(seed,'short','s1').id,'s1');
  assert.equal(content.getLanguage('xx').code,'en');
});

test('custom text validation',()=>{
  assert.equal(content.prepareCustomText('').ok,false);
  assert.match(content.prepareCustomText('too short').error,/at least 20/);
  assert.match(content.prepareCustomText('aaaa aaaa aaaa aaaa aaaa aaaa').error,/repeats/);
  assert.match(content.prepareCustomText('one two three four five six ✓ done').error,/standard English keyboard/);
  assert.match(content.prepareCustomText('x'.repeat(3001)).error,/at most/);
  assert.match(content.prepareCustomText('!!!! ???? .... ,,,, ;;;; :::: ----').error,/./);
  const ok=content.prepareCustomText('  It’s a “good” day—really.\r\n\tNew   line here… ');
  assert.equal(ok.ok,true);
  assert.equal(ok.text,'It\'s a "good" day-really. New line here...');
});

function memoryStorage(){const m=new Map();return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>{m.set(k,String(v))},removeItem:k=>{m.delete(k)},map:m}}
const entry=(over={})=>({id:Math.random().toString(36),at:new Date().toISOString(),mode:'time',label:'Time 60s',wpm:50,raw:55,accuracy:96,keystrokeAccuracy:93,durationMs:60000,practice:false,...over});

test('personal best and local history save, cap and clear',()=>{
  const store=memoryStorage();
  let r=history.saveResult(store,entry({wpm:50}));
  assert.ok(r.saved&&r.newBest);assert.equal(r.best.wpm,50);
  r=history.saveResult(store,entry({wpm:45}));
  assert.equal(r.newBest,false);assert.equal(r.best.wpm,50);
  r=history.saveResult(store,entry({wpm:90,practice:true,mode:'custom'}));
  assert.equal(r.newBest,false,'practice results never set the personal best');
  r=history.saveResult(store,entry({wpm:62.5}));
  assert.ok(r.newBest);assert.equal(r.previousBest.wpm,50);assert.equal(history.readBest(store).wpm,62.5);
  assert.equal(history.readHistory(store).length,4);
  const sum=history.summarize(history.readHistory(store));
  assert.equal(sum.sessions,4);close(sum.averageWpm,(50+45+90+62.5)/4);close(sum.averageAccuracy,96);
  for(let i=0;i<80;i++)history.saveResult(store,entry({wpm:10}));
  assert.equal(history.readHistory(store).length,history.MAX_HISTORY);
  assert.ok(history.clearHistory(store));
  assert.deepEqual(history.readHistory(store),[]);
  assert.equal(history.readBest(store).wpm,62.5,'clearing history keeps the personal best');
  assert.ok(history.resetBest(store));
  assert.equal(history.readBest(store),null);
  assert.deepEqual(history.summarize([]),{sessions:0,averageWpm:null,averageAccuracy:null});
});

test('corrupt or tampered history entries are ignored',()=>{
  const store=memoryStorage();
  store.setItem(history.HISTORY_KEY,JSON.stringify([entry(),{id:'x',wpm:'fast'},entry({wpm:9999}),entry({accuracy:-1}),null]));
  assert.equal(history.readHistory(store).length,1);
  store.setItem(history.HISTORY_KEY,'{not json');
  assert.deepEqual(history.readHistory(store),[]);
  store.setItem(history.BEST_KEY,JSON.stringify({wpm:Infinity}));
  assert.equal(history.readBest(store),null);
});

test('storage disabled or full never throws',()=>{
  const broken={getItem(){throw new Error('denied')},setItem(){throw new Error('quota')},removeItem(){throw new Error('denied')}};
  assert.deepEqual(history.readHistory(broken),[]);
  assert.equal(history.readBest(broken),null);
  const r=history.saveResult(broken,entry());
  assert.equal(r.saved,false);assert.equal(r.newBest,false);
  assert.equal(history.clearHistory(broken),false);
  assert.equal(history.resetBest(broken),false);
  assert.deepEqual(history.readHistory(null),[]);
  assert.equal(history.saveResult(null,entry()).saved,false);
  const descriptor=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
  Object.defineProperty(globalThis,'localStorage',{configurable:true,get(){throw new Error('SecurityError')}});
  try{assert.equal(history.getStorage(),null)}finally{if(descriptor)Object.defineProperty(globalThis,'localStorage',descriptor);else delete globalThis.localStorage}
});

test('typing test is registered as a utility, not as a file tool',()=>{
  const catalog=JSON.parse(fs.readFileSync('catalog/tools.json','utf8'));
  assert.ok(!catalog.some(t=>t.slug==='typing-test'),'not in the file-processing catalog');
  const registry=fs.readFileSync('lib/utility-tools.ts','utf8');
  assert.match(registry,/path:'\/typing-test'/);
  assert.match(fs.readFileSync('app/sitemap.ts','utf8'),/'\/typing-test'/);
  assert.ok(fs.existsSync('app/typing-test/page.tsx'));
  assert.ok(fs.existsSync('public/og-typing-test.png'));
});
