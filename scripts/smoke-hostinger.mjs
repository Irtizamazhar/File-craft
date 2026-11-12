const base=(process.env.SITE_URL||process.argv[2]||'http://localhost:3000').replace(/\/$/,'');
const routes=['/','/tools','/tools/merge-pdf','/tools/csv-to-xlsx','/pdf-tools','/image-tools','/blog','/privacy','/terms','/contact','/sitemap.xml','/robots.txt','/ads.txt','/api/health'];
let failed=0;
for(const path of routes){try{const r=await fetch(base+path,{redirect:'follow',signal:AbortSignal.timeout(15000)});const c=r.headers.get('content-type')||'';console.log(String(r.status).padEnd(5),path,c.slice(0,35));if(!r.ok)failed++}catch(e){console.error('FAILED',path,String(e));failed++}}
if(failed){console.error(`${failed} site checks failed.`);process.exit(1)}
console.log('HTTP route smoke checks passed. Browser conversions and MySQL accounts still require separate functional tests.');
