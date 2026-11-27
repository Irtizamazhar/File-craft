/* Keep the installed SDK's upload loop and report abnormal closes before its completion callback. */
const nativeWebSocket=self.WebSocket;
self.WebSocket=class extends nativeWebSocket {
  constructor(url,protocol) {
    super(url,protocol);
    this.addEventListener('close',event=>{
      if(!event.wasClean||(event.code!==1000&&event.code!==1005)){
        self.postMessage({MsgType:'error',Error:'abnormal-close'});
      }
    });
    this.addEventListener('message',event=>{
      // The SDK parses every message as JSON without guarding the parse.
      try{
        if(typeof event.data==='string')JSON.parse(event.data);
        else event.stopImmediatePropagation();
      }catch{
        event.stopImmediatePropagation();
      }
    });
  }
};

const sdkPath=new URL(self.location.href).searchParams.get('sdk');
try{
  if(!sdkPath||!/^\/_next\/static\/media\/ndt7-upload-worker\.[\w.-]+\.js$/.test(sdkPath))throw new Error('Invalid SDK asset');
  self.importScripts(sdkPath);
}catch{
  self.onmessage=()=>self.postMessage({MsgType:'error',Error:'sdk-startup'});
}
