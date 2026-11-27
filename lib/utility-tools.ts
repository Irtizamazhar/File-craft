/**
 * Browser utilities: tools that run entirely in the page and do not take uploaded files
 * (typing tests today; calculators or device tests could be added here later).
 * They are listed in the All Tools directory under "Utilities" with their own route,
 * and never pass through the file-processing engine (lib/browser-engine.ts).
 */
export type UtilityTool={slug:string;name:string;description:string;path:string;keywords:string;featured?:boolean};

export const UTILITY_CATEGORY='Utilities';

export const utilityTools:readonly UtilityTool[]=[
  {
    slug:'typing-test',
    name:'Typing Speed Test',
    description:'Check your typing speed in WPM and your accuracy with timed, word, quote and practice tests.',
    path:'/typing-test',
    keywords:'typing test speed wpm words per minute accuracy keyboard practice 1 minute 60 second online free'
  },
  {slug:'internet-speed-test',name:'Internet Speed Test',description:'Measure your download and upload speeds and available latency with Measurement Lab.',path:'/internet-speed-test',keywords:'network connection bandwidth broadband wifi Mbps latency ping jitter M-Lab'}
];
