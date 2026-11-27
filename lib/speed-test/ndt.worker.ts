import ndt7 from '@m-lab/ndt7';
import {mbps,sampleMbps,pingMs,type Direction,type MeasurementEvent} from './measurement';

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
  const results=Array.isArray(payload?.results)?payload.results:[];
  const endpoints=(direction:Direction)=>[...new Set(results.flatMap(result=>{
    const endpoint=target(result?.urls?.['wss:///ndt/v7/'+direction],direction);
    return endpoint?[endpoint]:[];
  }))];
  return {limited:false,download:endpoints('download').slice(0,2),upload:endpoints('upload')[0]} as const;
}

const emit=(event:MeasurementEvent)=>self.postMessage(event);
function finish(error?:string){
  emit({type:'finish',date:new Date().toISOString(),error});
}
type Failure='endpoint-unavailable'|'socket-error'|'interrupted'|'sdk-error'|'timed-out'|'not-started'|'missing-summary'|'missing-sample';
const diagnostic=(stage:Direction|'discovery',details:Record<string,boolean|number|string|null>)=>{
  if(process.env.NODE_ENV==='development')console.info('[speed-test]',stage,details);
};
const phaseError=(direction:Direction,failure:Failure)=>{
  const label=direction==='download'?'Download':'Upload';
  return failure==='timed-out'?label+' test timed out. Try again.':
    failure==='endpoint-unavailable'?label+' test endpoint is unavailable. Try again.':
    failure==='socket-error'?label+' connection failed. Try again.':
    failure==='interrupted'?label+' test was interrupted. Try again.':
    label+' test could not finish. Try again.';
};

function measureDownload(endpoint:string):Promise<Failure|null>{
  return new Promise(resolve=>{
    let socket:WebSocket;
    try{
      socket=new WebSocket(endpoint,'net.measurementlab.ndt.v7');
    }catch{
      diagnostic('download',{outcome:'socket-error',opened:false,sampled:false,completed:false});
      resolve('socket-error');
      return;
    }
    socket.binaryType='arraybuffer';
    let started:number|null=null;
    let bytes=0;
    let elapsed=0;
    let published=0;
    let ping:number|null=null;
    let timer=setTimeout(()=>settle('timed-out'),9500);

    function settle(failure:Failure|null,completed=false){
      clearTimeout(timer);
      socket.onopen=socket.onmessage=socket.onerror=socket.onclose=null;
      if(socket.readyState<WebSocket.CLOSING)socket.close();
      const value=mbps(bytes,elapsed/1000);
      const outcome=failure??(value===null?'missing-sample':null);
      diagnostic('download',{outcome:outcome??'client-sample',opened:started!==null,transferred:bytes>0,sampled:value!==null,completed});
      if(!outcome&&value!==null)emit({type:'result',direction:'download',mbps:value,ping,source:'client'});
      resolve(outcome);
    }

    socket.onopen=()=>{
      started=performance.now();
      clearTimeout(timer);
      timer=setTimeout(()=>settle('timed-out'),11500);
      emit({type:'phase',direction:'download'});
    };
    socket.onmessage=({data})=>{
      if(started===null)return;
      if(typeof data==='string'){
        try{
          const rtt=pingMs(JSON.parse(data)?.TCPInfo?.MinRTT);
          if(rtt!==null)ping=Math.min(ping??Infinity,rtt);
        }catch{/* Ignore unusable optional control messages. */}
        return;
      }
      if(!(data instanceof ArrayBuffer)||data.byteLength===0)return;
      bytes+=data.byteLength;
      elapsed=performance.now()-started;
      if(elapsed-published<250)return;
      published=elapsed;
      const value=mbps(bytes,elapsed/1000);
      if(value!==null)emit({type:'live',direction:'download',mbps:value});
    };
    socket.onerror=()=>settle(started===null?'socket-error':'interrupted');
    socket.onclose=event=>{
      const completed=started!==null&&event.wasClean&&(event.code===1000||event.code===1005);
      settle(completed?null:started===null?'socket-error':'interrupted',completed);
    };
  });
}

async function measureUpload(endpoint:string,accepted:boolean):Promise<Failure|null>{
  let client:number|null=null;
  let server:number|null=null;
  let opened=false;
  let completed=false;
  let callbackFailure:Failure|null=null;
  let status:number|'timed-out'|null=null;
  const direction='upload';
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
  const adapterAsset=new URL('./upload-socket.worker.js',import.meta.url);
  const adapter=new URL(adapterAsset.href,self.location.href);
  const sdkWorker=new URL('@m-lab/ndt7/src/ndt7-upload-worker.js',import.meta.url);
  adapter.searchParams.set('sdk',sdkWorker.pathname);
  const options={userAcceptedDataPolicy:accepted,uploadworkerfile:adapter.href};
  const onMeasurement=(sample:import('@m-lab/ndt7').Sample)=>{
    if(sample.Source==='client')client=sampleMbps(sample.Data,'client')??client;
    else server=sampleMbps(sample.Data?.AppInfo,'server')??server;
    const value=server??client;
    if(value!==null)emit({type:'live',direction,mbps:value});
  };
  const onComplete=(summary:import('@m-lab/ndt7').Summary)=>{
    completed=true;
    client=sampleMbps(summary.LastClientMeasurement,'client')??client;
    server=sampleMbps(summary.LastServerMeasurement?.AppInfo,'server')??server;
  };
  const onError=(error:unknown)=>{
    callbackFailure=error==='error'||error==='abnormal-close'?(opened?'interrupted':'socket-error'):'sdk-error';
  };
  try{
    const urls=Promise.resolve({['///ndt/v7/'+direction]:endpoint});
    const job=ndt7.uploadTest(options,{uploadStart:onStart,uploadMeasurement:onMeasurement,uploadComplete:onComplete,error:onError},urls);
    status=await Promise.race([job,limit]);
    if(status==='timed-out')return status;
    if(callbackFailure)return callbackFailure;
    if(status!==0)return 'sdk-error';
    if(!opened)return 'not-started';
    if(!completed)return 'missing-summary';
    const value=server??client;
    if(value===null)return 'missing-sample';
    emit({type:'result',direction,mbps:value,ping:null,source:server===null?'client':'server'});
    return null;
  }catch{return 'sdk-error';}
  finally{
    clearTimeout(timer);
    diagnostic(direction,{opened,transferred:client!==null||server!==null,sampled:client!==null||server!==null,
      completed,status,error:callbackFailure??'none',timedOut:status==='timed-out'});
  }
}

self.onmessage=async(event:MessageEvent<{consent:boolean}>)=>{
  if(event.data.consent!==true)return;
  self.onmessage=null;
  try{
    const urls=await discover();
    if(urls.limited){
      diagnostic('discovery',{outcome:'rate-limited'});
      finish('M-Lab is limiting tests from this connection. Try again later.');
      return;
    }
    diagnostic('discovery',{outcome:'located',downloadEndpoints:urls.download.length,uploadEndpoint:!!urls.upload});
    let downloadFailure:Failure|null='endpoint-unavailable';
    for(const endpoint of urls.download){
      downloadFailure=await measureDownload(endpoint);
      if(downloadFailure!=='socket-error')break;
    }
    const uploadFailure=urls.upload?await measureUpload(urls.upload,event.data.consent):'endpoint-unavailable';
    const errors=[downloadFailure&&phaseError('download',downloadFailure),uploadFailure&&phaseError('upload',uploadFailure)];
    finish(errors.filter(Boolean).join(' ')||undefined);
  }catch{
    diagnostic('discovery',{outcome:'failed'});
    finish('Could not connect to a test server. Check your connection and try again.');
  }
};
