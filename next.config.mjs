import {PHASE_DEVELOPMENT_SERVER} from 'next/constants.js';
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode:true,
  poweredByHeader:false,
  async headers(){return [{source:'/(.*)',headers:[
    {key:'X-Content-Type-Options',value:'nosniff'},
    {key:'Referrer-Policy',value:'strict-origin-when-cross-origin'},
    {key:'X-Frame-Options',value:'DENY'},
    {key:'Permissions-Policy',value:'camera=(), microphone=(), geolocation=()'},
    {key:'Content-Security-Policy',value:"frame-ancestors 'none'; base-uri 'self'; object-src 'none'"}
  ]}]}
};
// Keep live development from overwriting production route manifests.
export default phase=>({...nextConfig,distDir:phase===PHASE_DEVELOPMENT_SERVER?'.next-development':'.next-production'});
