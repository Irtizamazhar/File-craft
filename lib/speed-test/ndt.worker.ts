import ndt7 from '@m-lab/ndt7';
import {mbps,pingMs,type Direction,type MeasurementEvent} from './measurement';

const locate='https://locate.measurementlab.net/v2/nearest/ndt/ndt7';
const metadata={client_name:'editgoo-internet-speed-test',client_version:'1.0.0',client_library_name:'ndt7-js',client_library_version:'0.1.5'};

function target(url:string|undefined,direction:Direction){
  if(!url)throw new Error('M-Lab returned no available test server. Try again later.');
  const endpoint=new URL(url);
  if(endpoint.protocol!=='wss:'||endpoint.pathname!=='/ndt/v7/'+direction||!endpoint.searchParams.get('access_token')){
    throw new Error('M-Lab returned an invalid test endpoint.');
  }
  for(const [key,value] of Object.entries(metadata))endpoint.searchParams.set(key,value);
  return endpoint.href;
}

async function discover(){
  const response=await fetch(locate+'?'+new URLSearchParams(metadata),{credentials:'omit',cache:'no-store'});
  if(response.status===429)throw new Error('M-Lab is limiting tests from this connection. Try again later.');
  if(!response.ok)throw new Error('M-Lab server discovery is unavailable. Try again later.');
  const payload=await response.json() as {results?:{urls?:Record<string,string>}[]};
  const urls=payload.results?.[0]?.urls;
  return {'///ndt/v7/download':target(urls?.['wss:///ndt/v7/download'],'download'),
    '///ndt/v7/upload':target(urls?.['wss:///ndt/v7/upload'],'upload')};
}

const emit=(event:MeasurementEvent)=>self.postMessage(event);

self.onmessage=async(event:MessageEvent<{consent:boolean}>)=>{
  if(event.data.consent!==true)return;
  self.onmessage=null;
  let downloaded=false;
  let uploaded=false;
  try{
    const urls=Promise.resolve(await discover());
    const options={
      userAcceptedDataPolicy:true,
      downloadworkerfile:new URL('@m-lab/ndt7/src/ndt7-download-worker.js',import.meta.url).href,
      uploadworkerfile:new URL('@m-lab/ndt7/src/ndt7-upload-worker.js',import.meta.url).href
    };
    let download:number|null=null;
    let upload:number|null=null;
    let ping:number|null=null;
    let downloadError=false;
    const downloadStatus=await ndt7.downloadTest(options,{
      downloadStart:()=>emit({type:'phase',direction:'download'}),
      downloadMeasurement:({Source,Data})=>{
        if(Source==='client'){
          const speed=mbps(Data.NumBytes,Data.ElapsedTime);
          if(speed!==null)emit({type:'live',direction:'download',mbps:speed});
        }else{
          const rtt=pingMs(Data.TCPInfo?.MinRTT);
          if(rtt!==null)ping=Math.min(ping??Infinity,rtt);
        }
      },
      downloadComplete:({LastClientMeasurement})=>{
        download=mbps(LastClientMeasurement?.NumBytes,LastClientMeasurement?.ElapsedTime);
      },
      error:()=>{downloadError=true}
    },urls);
    if(downloadStatus===0&&!downloadError&&download!==null){
      downloaded=true;
      emit({type:'result',direction:'download',mbps:download,ping});
    }
    let uploadError=false;
    const uploadStatus=await ndt7.uploadTest(options,{
      uploadStart:()=>emit({type:'phase',direction:'upload'}),
      uploadMeasurement:({Source,Data})=>{
        if(Source==='server'&&Data.AppInfo){
          const speed=mbps(Data.AppInfo.NumBytes,(Data.AppInfo.ElapsedTime??0)/1e6);
          if(speed!==null)emit({type:'live',direction:'upload',mbps:speed});
        }
      },
      uploadComplete:({LastServerMeasurement})=>{
        const info=LastServerMeasurement?.AppInfo;
        upload=mbps(info?.NumBytes,(info?.ElapsedTime??0)/1e6);
      },
      error:()=>{uploadError=true}
    },urls);
    if(uploadStatus===0&&!uploadError&&upload!==null){
      uploaded=true;
      emit({type:'result',direction:'upload',mbps:upload,ping:null});
    }
    emit({type:'finish',date:new Date().toISOString(),error:downloaded&&uploaded?undefined:
      downloaded||uploaded?'One measurement did not finish. Available results are shown below.':
      'M-Lab could not complete the connection tests. Check your connection and try again.'});
  }catch(error){
    const message=error instanceof Error&&error.message.startsWith('M-Lab')?error.message:
      'Could not reach or run the M-Lab test. Check your connection and try again.';
    emit({type:'finish',date:new Date().toISOString(),error:message});
  }
};
