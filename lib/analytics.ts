import catalog from '../catalog/tools.json';
import {utilityTools} from './utility-tools';

const configuredId=process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID??'';
export const analyticsId=/^G-[A-Z0-9]+$/.test(configuredId)?configuredId:'';
export const analyticsPreference='editgoo.analytics-consent.v1';
export type AnalyticsChoice='granted'|'denied';
const toolPaths=new Map([
  ...catalog.map(({slug})=>[slug,'/tools/'+slug] as const),
  ...utilityTools.map(({slug,path})=>[slug,path] as const),
  ...['edit-pdf','remove-background','file-compressor'].map(slug=>[slug,'/'+slug] as const)
]);
const denied={analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'} as const;
type GoogleWindow=Window & {dataLayer?:unknown[];gtag?:(...args:unknown[])=>void} & Partial<Record<`ga-disable-${string}`,boolean>>;
type ToolEvent='tool_started'|'tool_completed'|'tool_failed';
let choice:AnalyticsChoice='denied';
let consentVersion=0;
let pathname:string|null=null;
let lastView:string|null=null;
let pageReferrer:string|null=null;
let loading=false;
let ready=false;
let initialized=false;
const setupEntries:unknown[]=[];
const pending:{event:ToolEvent;tool:string}[]=[];

function google(){return window as unknown as GoogleWindow}

export function readAnalyticsChoice():AnalyticsChoice|null{
  try{
    const value=localStorage.getItem(analyticsPreference);
    return value==='granted'||value==='denied'?value:null;
  }catch{return null;}
}

export function saveAnalyticsChoice(value:AnalyticsChoice){
  try{localStorage.setItem(analyticsPreference,value);}catch{/* Apply in this tab when storage is unavailable. */}
}

function removeAnalyticsCookies(){
  for(const cookie of document.cookie.split(';')){
    const name=cookie.trim().split('=')[0];
    if(!/^_ga(?:_[A-Z0-9]+)?$/i.test(name))continue;
    document.cookie=name+'=; Max-Age=0; Path=/';
    if(location.hostname==='editgoo.com'||location.hostname.endsWith('.editgoo.com')){
      document.cookie=name+'=; Max-Age=0; Path=/; Domain='+location.hostname;
      document.cookie=name+'=; Max-Age=0; Path=/; Domain=editgoo.com';
    }
  }
}

function pageFields(path:string){
  return {page_location:location.origin+path,page_referrer:pageReferrer??location.origin+'/',page_title:path};
}

function sendTool(event:ToolEvent,tool:string){
  if(!pathname)return;
  google().gtag?.('event',event,{...pageFields(pathname),send_to:analyticsId,tool_id:tool});
}

function configure(path:string){
  if(initialized)return;
  const w=google();
  const start=w.dataLayer!.length;
  const fields=pageFields(path);
  w.gtag?.('consent','default',denied);
  w.gtag?.('consent','update',{...denied,analytics_storage:'granted'});
  w.gtag?.('set',{...fields,send_page_view:false});
  w.gtag?.('js',new Date());
  w.gtag?.('config',analyticsId,{
    ...fields,send_page_view:false,allow_google_signals:false,
    allow_ad_personalization_signals:false,cookie_expires:15_552_000,cookie_update:false
  });
  if(!ready)setupEntries.push(...w.dataLayer!.slice(start));
  initialized=true;
}

function discardPendingConfiguration(){
  if(ready||!initialized)return;
  const layer=google().dataLayer!;
  for(const entry of setupEntries.splice(0)){
    const index=layer.indexOf(entry);
    if(index!==-1)layer.splice(index,1);
  }
  initialized=false;
}

function activate(){
  if(choice!=='granted'||!pathname||!ready)return;
  const w=google();
  w[`ga-disable-${analyticsId}`]=false;
  configure(pathname);
  if(lastView!==pathname){
    pageReferrer=lastView?location.origin+lastView:null;
    const fields=pageFields(pathname);
    w.gtag?.('set',fields);
    w.gtag?.('event','page_view',{...fields,send_to:analyticsId});
    lastView=pathname;
  }
  for(const {event,tool} of pending.splice(0))sendTool(event,tool);
}

function syncAnalytics(){
  if(!analyticsId)return;
  const w=google();
  w[`ga-disable-${analyticsId}`]=choice!=='granted'||!pathname;
  if(choice!=='granted'||!pathname){discardPendingConfiguration();return;}
  if(ready){activate();return;}
  w.dataLayer??=[];
  w.gtag??=function(){w.dataLayer!.push(arguments)};
  configure(pathname);
  if(loading)return;
  loading=true;
  const script=document.createElement('script');
  script.async=true;
  script.referrerPolicy='no-referrer';
  script.src='https://www.googletagmanager.com/gtag/js?id='+analyticsId;
  script.onload=()=>{loading=false;ready=true;setupEntries.length=0;activate();};
  script.onerror=()=>{loading=false;discardPendingConfiguration();pending.length=0;script.remove();};
  document.head.append(script);
}

export function applyAnalyticsChoice(value:AnalyticsChoice){
  if(!analyticsId)return;
  if(value!==choice){
    choice=value;
    consentVersion++;
    lastView=null;
    pageReferrer=null;
    pending.length=0;
    google()[`ga-disable-${analyticsId}`]=choice!=='granted'||!pathname;
    if(initialized&&ready)google().gtag?.('consent','update',{...denied,analytics_storage:value});
  }
  if(value==='denied')removeAnalyticsCookies();
  syncAnalytics();
}

export function setAnalyticsPath(path:string,extraPaths:readonly string[]){
  const next=path==='/'||path==='/tools'||[...toolPaths.values()].includes(path)||extraPaths.includes(path)?path:null;
  if(next!==pathname){
    pending.length=0;
    if(!next){lastView=null;pageReferrer=null;}
    pathname=next;
  }
  syncAnalytics();
}

export function beginToolAnalytics(tool:string){
  const path=toolPaths.get(tool);
  if(choice!=='granted'||!path||path!==pathname||path!==window.location.pathname)return ()=>{};
  const version=consentVersion;
  const emit=(event:ToolEvent)=>{
    if(ready)sendTool(event,tool);
    else if(pending.length<50)pending.push({event,tool});
  };
  emit('tool_started');
  let settled=false;
  return (outcome:'completed'|'failed')=>{
    if(settled)return;
    settled=true;
    if(version===consentVersion&&path===pathname&&path===window.location.pathname)emit(outcome==='completed'?'tool_completed':'tool_failed');
  };
}
