import ndt7 from '@m-lab/ndt7';
import {sampleMbps,pingMs,type Direction,type MeasurementEvent} from './measurement';

const locate='https://locate.measurementlab.net/v2/nearest/ndt/ndt7';
const metadata={client_name:'editgoo-internet-speed-test',client_version:'1.0.0',client_library_name:'ndt7-js',client_library_version:'0.1.5'};

function target(url:string|undefined,direction:Direction){
  if(!url)return undefined;
  try{
    const endpoint=new URL(url);
    if(endpoint.protocol!=='wss:'||endpoint.pathname!=='/ndt/v7/'+direction||!endpoint.searchParams.get('access_token'))return undefined;
    for(const [key,value] of Object.entries(metadata))endpoint.searchParams.set(key,value);
    return endpoint.href;
  }catch{return undefined;}
}

async function discover(){
  const response=await fetch(locate+'?'+new URLSearchParams(metadata),{credentials:'omit',cache:'no-store'});
  if(response.status===429)return {limited:true} as const;
  if(!response.ok)throw new Error('Discovery failed');
  const payload=await response.json() as {results?:{urls?:Record<string,string>}[]};
  const urls=payload.results?.[0]?.urls;
  return {limited:false,download:target(urls?.['wss:///ndt/v7/download'],'download'),
    upload:target(urls?.['wss:///ndt/v7/upload'],'upload')} as const;
}

const emit=(event:MeasurementEvent)=>self.postMessage(event);
function finish(error?:string){
  emit({type:'finish',date:new Date().toISOString(),error});
}
type Failure='endpoint-unavailable'|'socket-error'|'sdk-error'|'timed-out'|'not-started'|'missing-summary'|'missing-sample';
const diagnostic=(direction:Direction,outcome:Failure|'server-sample'|'client-sample')=>{
  if(process.env.NODE_ENV==='development')console.info('[speed-test]',direction,outcome);
};
const phaseError=(direction:Direction,failure:Failure)=>{
  const label=direction==='download'?'Download':'Upload';
  return failure==='timed-out'?label+' test timed out. Try again.':
    failure==='endpoint-unavailable'?label+' test endpoint is unavailable. Try again.':
    failure==='socket-error'?label+' connection failed. Try again.':
    label+' test could not finish. Try again.';
};

async function measure(direction:Direction,endpoint:string,accepted:boolean):Promise<Failure|null>{
  let client:number|null=null;
  let server:number|null=null;
  let ping:number|null=null;
  let opened=false;
  let completed=false;
  let callbackFailure:Failure|null=null;
  let timer:ReturnType<typeof setTimeout>|undefined;
  let timeout!:()=>void;
  const limit=new Promise<'timed-out'>(resolve=>{timeout=()=>resolve('timed-out')});
  // The SDK resolves its connection and transfer watchdogs with code zero.
  // Stop earlier so a watchdog with stale samples cannot look like success.
  timer=setTimeout(timeout,9500);
  const onStart=()=>{
    opened=true;
    clearTimeout(timer);
    timer=setTimeout(timeout,11500);
    emit({type:'phase',direction});
  };
  const options={
    userAcceptedDataPolicy:accepted,
    downloadworkerfile:new URL('@m-lab/ndt7/src/ndt7-download-worker.js',import.meta.url).href,
    uploadworkerfile:new URL('@m-lab/ndt7/src/ndt7-upload-worker.js',import.meta.url).href
  };
  const onMeasurement=(sample:import('@m-lab/ndt7').Sample)=>{
    if(sample.Source==='client')client=sampleMbps(sample.Data,'client')??client;
    else if(direction==='upload')server=sampleMbps(sample.Data?.AppInfo,'server')??server;
    else{
      const rtt=pingMs(sample.Data?.TCPInfo?.MinRTT);
      if(rtt!==null)ping=Math.min(ping??Infinity,rtt);
      return;
    }
    const value=server??client;
    if(value!==null)emit({type:'live',direction,mbps:value});
  };
  const onComplete=(summary:import('@m-lab/ndt7').Summary)=>{
    completed=true;
    client=sampleMbps(summary.LastClientMeasurement,'client')??client;
    if(direction==='upload')server=sampleMbps(summary.LastServerMeasurement?.AppInfo,'server')??server;
  };
  const onError=(error:unknown)=>{callbackFailure=error==='error'?'socket-error':'sdk-error'};
  try{
    const urls=Promise.resolve({['///ndt/v7/'+direction]:endpoint});
    const job=direction==='download'
      ?ndt7.downloadTest(options,{downloadStart:onStart,downloadMeasurement:onMeasurement,downloadComplete:onComplete,error:onError},urls)
      :ndt7.uploadTest(options,{uploadStart:onStart,uploadMeasurement:onMeasurement,uploadComplete:onComplete,error:onError},urls);
    const status=await Promise.race([job,limit]);
    if(status==='timed-out')return status;
    if(callbackFailure)return callbackFailure;
    if(status!==0)return 'sdk-error';
    if(!opened)return 'not-started';
    if(!completed)return 'missing-summary';
    const value=server??client;
    if(value===null)return 'missing-sample';
    diagnostic(direction,server===null?'client-sample':'server-sample');
    emit({type:'result',direction,mbps:value,ping,source:server===null?'client':'server'});
    return null;
  }catch{return 'sdk-error';}
  finally{clearTimeout(timer);}
}

self.onmessage=async(event:MessageEvent<{consent:boolean}>)=>{
  if(event.data.consent!==true)return;
  self.onmessage=null;
  try{
    const urls=await discover();
    if(urls.limited){finish('M-Lab is limiting tests from this connection. Try again later.');return;}
    const errors:string[]=[];
    for(const direction of ['download','upload'] as const){
      const endpoint=urls[direction];
      const failure=endpoint?await measure(direction,endpoint,event.data.consent):'endpoint-unavailable';
      if(!failure)continue;
      diagnostic(direction,failure);
      errors.push(phaseError(direction,failure));
      // The page terminates the outer and nested workers on finish.
      if(failure==='timed-out'){finish(errors.at(-1));return;}
    }
    finish(errors.length===2?'The connection tests could not finish. Try again.':errors[0]);
  }catch{
    finish('Could not connect to a test server. Check your connection and try again.');
  }
};
