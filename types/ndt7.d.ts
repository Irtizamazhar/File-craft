declare module '@m-lab/ndt7' {
  type ClientSample={ElapsedTime?:number;NumBytes?:number};
  type ServerSample={AppInfo?:{ElapsedTime?:number;NumBytes?:number};TCPInfo?:{MinRTT?:number}};
  type Sample={Source:'client';Data:ClientSample}|{Source:'server';Data:ServerSample};
  type Summary={LastClientMeasurement?:ClientSample;LastServerMeasurement?:ServerSample};
  type Options={downloadworkerfile:string;uploadworkerfile:string;userAcceptedDataPolicy:boolean};
  type URLs={'///ndt/v7/download':string;'///ndt/v7/upload':string};
  const ndt7:{
    downloadTest(options:Options,callbacks:{downloadStart:()=>void;downloadMeasurement:(value:Sample)=>void;
      downloadComplete:(value:Summary)=>void;error:()=>void},urls:Promise<URLs>):Promise<number>;
    uploadTest(options:Options,callbacks:{uploadStart:()=>void;uploadMeasurement:(value:Sample)=>void;
      uploadComplete:(value:Summary)=>void;error:()=>void},urls:Promise<URLs>):Promise<number>;
  };
  export default ndt7;
}
