import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';

const source=await readFile(new URL('../lib/speed-test/measurement.ts',import.meta.url),'utf8');
const code=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const {mbps,sampleMbps,pingMs,format,reduce,initial,active}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));

test('application bytes and elapsed seconds yield Mbps; TCP RTT converts microseconds to ms',()=>{
  assert.equal(mbps(12_500_000,1),100);
  assert.equal(mbps(100_000_000,2),400);
  assert.equal(pingMs(12_500),12.5);
  for(const value of [0,-1,NaN,Infinity,undefined,'10'])assert.equal(mbps(100,value),null);
  for(const value of [0,-1,NaN,Infinity,undefined,'10'])assert.equal(mbps(value,1),null);
  assert.equal(pingMs(0),null);
});
test('format preserves slow positive measurements and distinguishes unavailable data',()=>{
  assert.equal(format(null),'—');
  assert.equal(format(null,2,'N/A'),'N/A');
  assert.equal(format(0.001),'<0.01');
  assert.equal(format(1250.125),'1250.13');
});
test('state machine prevents duplicate starts, preserves partial results and resets for retry',()=>{
  let state=reduce(initial,{type:'start'});
  assert.equal(active(state),true);
  assert.equal(reduce(state,{type:'start'}),state);
  state=reduce(state,{type:'phase',direction:'download'});
  assert.equal(state.phase,'downloading');
  state=reduce(state,{type:'live',direction:'download',mbps:8});
  assert.equal(state.live,8);
  state=reduce(state,{type:'result',direction:'download',mbps:25,ping:12});
  state=reduce(state,{type:'phase',direction:'upload'});
  assert.equal(state.phase,'uploading');
  assert.equal(state.live,null);
  state=reduce(state,{type:'finish',error:'Interrupted',date:'2026-11-27'});
  assert.equal(state.phase,'failed');
  assert.deepEqual(state.results,{download:25,upload:null,ping:12});
  state=reduce(state,{type:'start'});
  assert.deepEqual(state.results,initial.results);
  assert.equal(reduce(state,{type:'cancel'}).phase,'cancelled');
  assert.equal(reduce(state,{type:'finish',date:'2026-11-27'}).phase,'failed');
});

test('completion requires positive measurements from both active directions',()=>{
  let state=reduce(initial,{type:'start'});
  state=reduce(state,{type:'phase',direction:'download'});
  assert.equal(reduce(state,{type:'live',direction:'upload',mbps:10}),state);
  assert.equal(reduce(state,{type:'result',direction:'download',mbps:Infinity,ping:null}),state);
  state=reduce(state,{type:'result',direction:'download',mbps:1,ping:null});
  assert.match(reduce(state,{type:'finish',date:''}).error,/Upload/);
  state=reduce(state,{type:'phase',direction:'upload'});
  state=reduce(state,{type:'result',direction:'upload',mbps:2,ping:null});
  assert.equal(reduce(state,{type:'finish',date:''}).phase,'completed');
});

test('NDT7 server microseconds and SDK client seconds remain distinct',()=>{
  assert.equal(sampleMbps({NumBytes:12500000,ElapsedTime:1000000},'server'),100);
  assert.equal(sampleMbps({NumBytes:12500000,ElapsedTime:1},'client'),100);
  assert.equal(sampleMbps(undefined,'server'),null);
  assert.equal(sampleMbps({NumBytes:12500000,ElapsedTime:0},'client'),null);
});
