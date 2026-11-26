/**
 * Device-local typing history and personal best (browser localStorage only; nothing is uploaded).
 * Every function takes the storage object so it can be tested without a browser, and every access
 * is wrapped so blocked or full storage never breaks the test itself. No imports.
 */

export type HistoryEntry={
  id:string;at:string;
  mode:'time'|'words'|'quote'|'practice'|'custom';
  label:string;
  wpm:number;raw:number;accuracy:number;keystrokeAccuracy:number;
  durationMs:number;
  practice:boolean;
};
export type PersonalBest={wpm:number;accuracy:number;at:string;label:string};
export type StorageLike=Pick<Storage,'getItem'|'setItem'|'removeItem'>;

export const HISTORY_KEY='editgoo.typing.history.v1';
export const BEST_KEY='editgoo.typing.best.v1';
export const PREFS_KEY='editgoo.typing.prefs.v1';
export const MAX_HISTORY=50;

/** localStorage if it can actually be written, otherwise null (private mode, blocked cookies, quota). */
export function getStorage():StorageLike|null{
  try{
    const storage=globalThis.localStorage;
    if(!storage)return null;
    const probe='editgoo.typing.probe';
    storage.setItem(probe,'1');storage.removeItem(probe);
    return storage;
  }catch{return null}
}

const MODES=new Set(['time','words','quote','practice','custom']);
const num=(v:unknown,min:number,max:number)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;

function validEntry(e:any):e is HistoryEntry{
  return !!e&&typeof e.id==='string'&&typeof e.at==='string'&&!Number.isNaN(Date.parse(e.at))&&MODES.has(e.mode)&&
    typeof e.label==='string'&&e.label.length<=80&&num(e.wpm,0,400)&&num(e.raw,0,400)&&num(e.accuracy,0,100)&&
    num(e.keystrokeAccuracy,0,100)&&num(e.durationMs,0,3_600_000)&&typeof e.practice==='boolean';
}

function readJson(storage:StorageLike|null,key:string):unknown{
  if(!storage)return null;
  try{const raw=storage.getItem(key);return raw?JSON.parse(raw):null}catch{return null}
}
function writeJson(storage:StorageLike|null,key:string,value:unknown){
  if(!storage)return false;
  try{storage.setItem(key,JSON.stringify(value));return true}catch{return false}
}

export function readHistory(storage:StorageLike|null):HistoryEntry[]{
  const data=readJson(storage,HISTORY_KEY);
  return Array.isArray(data)?data.filter(validEntry).slice(0,MAX_HISTORY):[];
}

export function readBest(storage:StorageLike|null):PersonalBest|null{
  const b=readJson(storage,BEST_KEY) as any;
  return b&&num(b.wpm,0,400)&&num(b.accuracy,0,100)&&typeof b.at==='string'&&typeof b.label==='string'?b:null;
}

/** Practice and custom-text results are kept in history but never become the personal best. */
export function beatsBest(entry:HistoryEntry,best:PersonalBest|null){
  return !entry.practice&&entry.wpm>0&&(!best||entry.wpm>best.wpm);
}

/** Save a completed, valid result (newest first, capped at MAX_HISTORY) and update the personal best. */
export function saveResult(storage:StorageLike|null,entry:HistoryEntry){
  const history=[entry,...readHistory(storage).filter(e=>e.id!==entry.id)].slice(0,MAX_HISTORY);
  const previous=readBest(storage);
  const newBest=beatsBest(entry,previous);
  const best=newBest?{wpm:entry.wpm,accuracy:entry.accuracy,at:entry.at,label:entry.label}:previous;
  const saved=writeJson(storage,HISTORY_KEY,history)&&(!newBest||writeJson(storage,BEST_KEY,best));
  return {saved,history:saved?history:readHistory(storage),best:saved?best:previous,newBest:saved&&newBest,previousBest:previous};
}

export function clearHistory(storage:StorageLike|null){
  if(!storage)return false;
  try{storage.removeItem(HISTORY_KEY);return true}catch{return false}
}
export function resetBest(storage:StorageLike|null){
  if(!storage)return false;
  try{storage.removeItem(BEST_KEY);return true}catch{return false}
}

export function summarize(history:readonly HistoryEntry[]){
  if(!history.length)return {sessions:0,averageWpm:null as number|null,averageAccuracy:null as number|null};
  const sum=(pick:(e:HistoryEntry)=>number)=>history.reduce((a,e)=>a+pick(e),0);
  return {sessions:history.length,averageWpm:sum(e=>e.wpm)/history.length,averageAccuracy:sum(e=>e.accuracy)/history.length};
}

export function readPrefs<T extends object>(storage:StorageLike|null,fallback:T):T{
  const data=readJson(storage,PREFS_KEY);
  return data&&typeof data==='object'&&!Array.isArray(data)?{...fallback,...data as Partial<T>}:fallback;
}
export function writePrefs(storage:StorageLike|null,prefs:object){return writeJson(storage,PREFS_KEY,prefs)}
