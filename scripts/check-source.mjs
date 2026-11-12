import {readFileSync,existsSync} from 'node:fs';
const tools=JSON.parse(readFileSync('catalog/tools.json','utf8'));
const deferred=JSON.parse(readFileSync('catalog/deferred-tools.json','utf8'));
const processor=readFileSync('lib/browser-engine.ts','utf8');
const found=[];
for(const t of tools){if(!processor.includes(`'${t.slug}'`)){found.push(t.slug)}}
if(found.length){console.error('Tool slug missing from engine:',found.join(', '));process.exit(1)}
if(new Set(tools.map(x=>x.slug)).size!==tools.length)throw Error('Duplicate tool slug');
const checks=['app/api/auth/register/route.ts','app/api/auth/login/route.ts','app/api/contact/route.ts','app/api/activity/route.ts','app/api/admin/stats/route.ts','sql/schema.sql','app/sitemap.ts','app/robots.ts','app/ads.txt/route.ts'];
for(const f of checks)if(!existsSync(f))throw Error('Missing '+f);
console.log(`Source inventory: ${tools.length} engine-routed tools, ${deferred.length} deferred, ${checks.length} routes/documents present.`);
console.log('This is a static inventory check; it does NOT prove browser processing or deployment success.');
