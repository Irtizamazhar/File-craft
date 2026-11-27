'use client';
import {beginToolAnalytics} from '@/lib/analytics';
import {useEffect,useReducer,useRef,useState} from 'react';
import Link from 'next/link';
import {ArrowDown,ArrowUp,Activity,Wifi,Share2,Play,RotateCcw} from 'lucide-react';
import {active,format,initial,reduce,type MeasurementEvent} from '@/lib/speed-test/measurement';

const statuses={
  idle:'Ready',discovering:'Connecting...',downloading:'Testing download...',
  uploading:'Testing upload...',completed:'Test complete',failed:'Test incomplete',cancelled:'Test cancelled'
};
const metrics=[
  ['download','Download','Mbps',ArrowDown],['upload','Upload','Mbps',ArrowUp],
  ['ping','Ping','ms',Wifi],['jitter','Jitter','ms',Activity]
] as const;

function Gauge({value}:{value:number|null}){
  const maximum=Math.max(100,10**Math.ceil(Math.log10(value??1)));
  return <div className="internet-gauge">
    <svg viewBox="0 0 280 158" aria-hidden="true">
      <defs><linearGradient id="speed-red"><stop stopColor="#ff4943"/><stop offset="1" stopColor="#d70025"/></linearGradient></defs>
      <path d="M24 140 A116 116 0 0 1 256 140" pathLength="100" className="internet-track"/>
      <path d="M24 140 A116 116 0 0 1 256 140" pathLength="100" className="internet-fill"
        strokeDasharray={String(value===null?0:value/maximum*100)+' 100'}/>
      <g className="internet-pointer" style={{transform: 'rotate('+(value===null?-90:-90+value/maximum*180)+'deg)'}}>
        <path className="internet-needle" d="M135 140 L140 43 L145 140 Z"/>
      </g>
      <circle cx="140" cy="140" r="9" fill="#e70028"/>
      <text x="24" y="157" textAnchor="middle">0</text>
      <text x="254" y="157" textAnchor="middle">{new Intl.NumberFormat('en',{notation:'compact'}).format(maximum)}</text>
    </svg>
  </div>;
}

export default function InternetSpeedTest({url}:{url:string}){
  const [state,dispatch]=useReducer(reduce,initial);
  const [shareInfo,setShareInfo]=useState('');
  const [manualShare,setManualShare]=useState('');
  const current=useRef<Worker|null>(null);
  const deadline=useRef<number|undefined>(undefined);
  const measurement=useRef<ReturnType<typeof beginToolAnalytics>|null>(null);
  const busy=active(state);
  const hasResults=state.results.download!==null||state.results.upload!==null;
  const settled=state.phase!=='idle'&&!busy;

  useEffect(()=>{
    function disconnected(){
      if(!current.current)return;
      current.current.terminate();
      current.current=null;
      window.clearTimeout(deadline.current);
      measurement.current?.('failed');
      dispatch({type:'finish',date:new Date().toISOString(),error:'Your connection went offline during the test. Reconnect to try again.'});
    }
    window.addEventListener('offline',disconnected);
    return ()=>{
      window.removeEventListener('offline',disconnected);
      current.current?.terminate();
      current.current=null;
      window.clearTimeout(deadline.current);
    };
  },[]);

  function stop(){
    current.current?.terminate();
    current.current=null;
    window.clearTimeout(deadline.current);
  }

  function start(){
    if(current.current)return;
    setShareInfo('');
    setManualShare('');
    measurement.current=beginToolAnalytics('internet-speed-test');
    const measured=new Set<string>();
    dispatch({type:'start'});
    function fail(error:string){
      stop();
      measurement.current?.('failed');
      dispatch({type:'finish',date:new Date().toISOString(),error});
    }
    if(!navigator.onLine){fail('You appear to be offline. Reconnect and try again.');return;}
    if(!window.isSecureContext||typeof Worker==='undefined'||typeof WebSocket==='undefined'){
      fail('Use an up-to-date browser and a secure HTTPS connection to run this test.');
      return;
    }
    try{
      const worker=new Worker(new URL('../../lib/speed-test/ndt.worker.ts',import.meta.url));
      current.current=worker;
      deadline.current=window.setTimeout(()=>{
        if(current.current===worker)fail('The test timed out. Check your connection and try again.');
      },60000);
      worker.onmessage=(event:MessageEvent<MeasurementEvent>)=>{
        if(current.current!==worker)return;
        dispatch(event.data);
        if(event.data.type==='result'&&Number.isFinite(event.data.mbps)&&event.data.mbps>0)measured.add(event.data.direction);
        if(event.data.type==='finish'){
          measurement.current?.(!event.data.error&&measured.size===2?'completed':'failed');
          stop();
        }
      };
      worker.onerror=()=>{
        if(current.current===worker)fail('The test worker could not run. Try again or use another browser.');
      };
      worker.postMessage({consent:true});
    }catch{
      fail('The test could not start in this browser.');
    }
  }

  async function share(){
    const {download,upload,ping}=state.results;
    const result=[
      'Editgoo Internet Speed Test',
      download===null?null:'Download: '+format(download)+' Mbps',
      upload===null?null:'Upload: '+format(upload)+' Mbps'+(state.uploadSource==='client'?' (browser measured)':''),
      ping===null?null:'Ping (M-Lab TCP minimum RTT): '+format(ping,1)+' ms',
      'Tested: '+new Date(state.date!).toISOString(),
      url
    ].filter(Boolean).join('\n');
    setShareInfo('');
    if(typeof navigator.share==='function'){
      try{await navigator.share({text:result});return;}
      catch(error){if(error instanceof DOMException&&error.name==='AbortError')return;}
    }
    try{await navigator.clipboard.writeText(result);setShareInfo('Results copied.');}
    catch{setManualShare(result);setShareInfo('Select and copy the results below.');}
  }

  const reading=busy?state.live:state.results.download??state.results.upload;
  const readingLabel=(busy?state.phase==='uploading':state.results.download===null)?'Upload':'Download';
  const disclosure=<p id="speed-privacy" className="internet-disclosure">
    By starting, you agree to use internet data and let M-Lab collect and publish test data, including your public IP. <Link href="/privacy#internet-speed-test" prefetch={false}>Privacy details</Link>
  </p>;

  return <div className="internet-tool">
    <div className="internet-panel">
    <div className="internet-measurement">
      <Gauge value={reading}/>
      <div className="internet-reading" data-testid="speed-live">
        {reading!==null?<><span>{readingLabel}</span><strong>{format(reading)}</strong><span>Mbps</span></>:busy?
          <progress aria-label="Waiting for a measurement"/>:<strong aria-hidden="true">&mdash;</strong>}
      </div>
      <p role="status" className="internet-status">{statuses[state.phase]}</p>
      {state.phase==='idle'&&disclosure}
      <div className="internet-actions">{(!settled||busy)&&(
        busy?<button type="button" className="btn btn-outline" onClick={()=>{stop();dispatch({type:'cancel'})}}>Cancel test</button>:
          <button type="button" className="btn btn-primary" aria-describedby="speed-privacy" onClick={start}>
            <Play size={19} aria-hidden="true"/> Start Test
          </button>)}
      </div>
    </div>
    </div>
    <div className="internet-results">
      <dl className="internet-metrics">{metrics.map(([key,label,unit,Icon])=>{
        const reading=key==='jitter'?null:state.results[key];
        return <div key={key} className="internet-metric">
          <dt><Icon size={19} aria-hidden="true"/>{label}</dt>
          <dd><strong data-testid={'speed-'+key}>{format(reading,key==='ping'?1:2,settled?'N/A':'—')}</strong>
            {reading!==null&&<span>{unit}</span>}</dd>
        </div>;
      })}</dl>
      {state.uploadSource==='client'&&<p className="internet-reading-source">Upload measured by your browser.</p>}
      {state.error&&<p role="alert" className="internet-error">{state.error}</p>}
      {settled&&disclosure}
      {settled&&<div className="internet-result-actions"><button type="button" className="btn btn-primary" aria-describedby="speed-privacy" onClick={start}><RotateCcw size={18} aria-hidden="true"/>Test Again</button>{hasResults&&state.date&&<button type="button" className="btn btn-outline internet-share" onClick={share}>
        <Share2 size={17} aria-hidden="true"/>{typeof navigator!=='undefined'&&typeof navigator.share==='function'?'Share Result':'Copy Results'}
      </button>}</div>}
      {shareInfo&&<p role="status">{shareInfo}</p>}
      {manualShare&&<textarea aria-label="Results to copy" readOnly value={manualShare} onFocus={event=>event.target.select()}/>}
    </div>
  </div>;
}
