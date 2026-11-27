declare module '@m-lab/ndt7' {
  type ClientSample={ElapsedTime?:number;NumBytes?:number};
  type ServerSample={AppInfo?:{ElapsedTime?:number;NumBytes?:number};TCPInfo?:{MinRTT?:number}};
  export type Sample={Source:'client';Data:ClientSample}|{Source:'server';Data:ServerSample};
  export type Summary={LastClientMeasurement?:ClientSample;LastServerMeasurement?:ServerSample};
  type Options={downloadworkerfile?:string;uploadworkerfile:string;userAcceptedDataPolicy:boolean};
  type URLs=Partial<Record<'///ndt/v7/download'|'///ndt/v7/upload',string>>;
  const ndt7:{
    downloadTest(options:Options,callbacks:{downloadStart:()=>void;downloadMeasurement:(value:Sample)=>void;
      downloadComplete:(value:Summary)=>void;error:(error:unknown)=>void},urls:Promise<URLs>):Promise<number>;
    uploadTest(options:Options,callbacks:{uploadStart:()=>void;uploadMeasurement:(value:Sample)=>void;
      uploadComplete:(value:Summary)=>void;error:(error:unknown)=>void},urls:Promise<URLs>):Promise<number>;
  };
  export default ndt7;
}
