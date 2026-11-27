export type Direction='download'|'upload';
export type Results={download:number|null;upload:number|null;ping:number|null};
export type MeasurementEvent=
  | {type:'phase';direction:Direction}
  | {type:'live';direction:Direction;mbps:number}
  | {type:'result';direction:Direction;mbps:number;ping:number|null}
  | {type:'finish';date:string;error?:string};
export type State={
  phase:'idle'|'discovering'|'downloading'|'uploading'|'completed'|'failed'|'cancelled';
  live:number|null; results:Results; date:string|null; error?:string;
};
export const initial:State={phase:'idle',live:null,results:{download:null,upload:null,ping:null},date:null};
export const active=(state:State)=>['discovering','downloading','uploading'].includes(state.phase);

export function reduce(state:State,event:MeasurementEvent|{type:'start'|'cancel'}):State {
  if(event.type==='start')return active(state)?state:{...initial,phase:'discovering'};
  if(!active(state))return state;
  if(event.type==='cancel')return {...state,phase:'cancelled',live:null};
  if(event.type==='finish')return {...state,phase:event.error?'failed':'completed',live:null,date:event.date,error:event.error};
  if(event.type==='phase')return {...state,phase:event.direction==='download'?'downloading':'uploading',live:null};
  if(event.type==='live')return {...state,live:event.mbps};
  if(event.type==='result')return {...state,results:{...state.results,[event.direction]:event.mbps,ping:state.results.ping??event.ping}};
  return state;
}

export function mbps(bytes:unknown,seconds:unknown):number|null {
  if(typeof bytes!=='number'||!Number.isSafeInteger(bytes)||bytes<=0||
     typeof seconds!=='number'||!Number.isFinite(seconds)||seconds<=0)return null;
  const speed=bytes/seconds*0.000008;
  return Number.isFinite(speed)&&speed>0?speed:null;
}
export function pingMs(microseconds:unknown){
  return typeof microseconds==='number'&&Number.isFinite(microseconds)&&microseconds>0?microseconds/1000:null;
}
export function format(value:number|null,precision=2,missing='—'){
  if(value===null||!Number.isFinite(value)||value<0)return missing;
  return value>0&&value<10**-precision?'<'+(10**-precision).toFixed(precision):value.toFixed(precision);
}
