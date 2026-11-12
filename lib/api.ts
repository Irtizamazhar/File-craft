export async function request<T=any>(path:string,init:RequestInit={}):Promise<T>{
 const res=await fetch('/api'+path,{credentials:'same-origin',...init});
 let json:any;try{json=await res.json()}catch{throw new Error('Server returned an unreadable response.');}
 if(!res.ok)throw new Error(json?.error||`Request failed (${res.status})`);
 return json as T;
}
