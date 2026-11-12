const attempts=new Map<string,{count:number;reset:number}>();
/** Best effort per-process throttle. Host-level limits must supplement it in production. */
export function throttle(key:string,max:number,windowMs:number){const now=Date.now();if(attempts.size>5000){for(const [id,v] of attempts){if(v.reset<now)attempts.delete(id)}}const prev=attempts.get(key);if(!prev||now>prev.reset){attempts.set(key,{count:1,reset:now+windowMs});return false}prev.count++;return prev.count>max}
