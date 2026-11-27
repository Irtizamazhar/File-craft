import {chromium} from 'playwright';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import http from 'node:http';

const base=process.env.TEST_BASE_URL||'http://localhost:3198';
const canonical='https://www.editgoo.com';
const artifact='artifacts/typing-seo';
const manifest=JSON.parse(await readFile('.next-production/prerender-manifest.json','utf8'));
const denied=/^\/(?:_|api\b|admin\b|dashboard\b|login\b|register\b|forgot-password\b)|\.(?:xml|txt)$/;
const routes=[...new Set(['/tools',...Object.keys(manifest.routes).filter(path=>!denied.test(path))])].sort();
const sitemapSource=await readFile('app/sitemap.ts','utf8');
const declared=[...sitemapSource.match(/const staticPages=\[([^\]]*)\]/)[1].matchAll(/'([^']*)'/g)].map(([,path])=>path||'/');
const sitemapInventory=new Set([...declared,...routes.filter(path=>path.startsWith('/tools/')||path.startsWith('/guides/'))]);
const browser=await chromium.launch();
const page=await browser.newPage();
const findings=[];
const pages=[];
const links=new Set();
try{
  for(const path of routes){
    const response=await fetch(base+path,{redirect:'manual'});
    const html=await response.text();
    const data=await page.evaluate(html=>{
      const doc=new DOMParser().parseFromString(html,'text/html');
      const meta=(key,attribute='name')=>doc.querySelector('meta['+attribute+'="'+key+'"]')?.getAttribute('content')||'';
      const headings=[...doc.querySelectorAll('main h1,main h2,main h3')].map(node=>[node.tagName,node.textContent?.trim()]);
      const schema=[...doc.querySelectorAll('script[type="application/ld+json"]')].flatMap(node=>{
        try{return [JSON.parse(node.textContent)].flat()}catch{return [{invalid:true}]}
      });
      return {
        title:doc.title,description:meta('description'),robots:meta('robots'),
        canonical:doc.querySelector('link[rel="canonical"]')?.getAttribute('href')||'',
        ogUrl:meta('og:url','property'),ogTitle:meta('og:title','property'),ogDescription:meta('og:description','property'),
        ogImage:meta('og:image','property'),twitterImage:meta('twitter:image'),
        headings,schema,links:[...doc.querySelectorAll('a[href]')].map(node=>node.getAttribute('href')),
        missingAlt:[...doc.images].filter(image=>!image.hasAttribute('alt')).map(image=>image.getAttribute('src')),
        htmlBytes:new TextEncoder().encode(html).length
      };
    },html);
    pages.push({path,status:response.status,...data});
    const expected=canonical+(path==='/'?'':path);
    const issue=(test,message)=>{if(test)findings.push({path,message})};
    issue(response.status!==200,'HTTP '+response.status);
    issue(!data.title||!data.description,'Missing title or description');
    issue(data.canonical.replace(/\/$/,'')!==expected,'Canonical mismatch: '+data.canonical);
    issue(!data.ogTitle||!data.ogDescription||data.ogUrl.replace(/\/$/,'')!==expected,'Incomplete or mismatched Open Graph');
    issue(!data.ogImage||!data.twitterImage,'Missing social preview image');
    issue(!data.robots.includes('noindex'),'Missing staging noindex');
    issue(data.headings.filter(([level])=>level==='H1').length!==1,'Expected one server-rendered H1');
    issue(data.missingAlt.length>0,'Image without alt');
    issue(data.headings.some(([level],i)=>i>0&&Number(level[1])-Number(data.headings[i-1][0][1])>1),'Heading hierarchy skips a level');
    for(const schema of data.schema.filter(node=>node['@type']==='BreadcrumbList')){
      const items=schema.itemListElement;
      issue(!Array.isArray(items)||items.length<2||items.some((item,i)=>item.position!==i+1||!item.name||typeof item.item!=='string'||!item.item.startsWith(canonical)),'Invalid breadcrumb item or position');
      issue(Array.isArray(items)&&items.at(-1)?.item!==expected,'Breadcrumb target differs from canonical');
    }
    issue(data.schema.some(node=>node.invalid||node.aggregateRating||node.review||node['@type']==='FAQPage'),'Unexpected or invalid JSON-LD');
    issue(!sitemapInventory.has(path),'Missing from sitemap inventory');
    for(const link of [...data.links,data.ogImage,data.twitterImage]){
      if(!link||link.startsWith('#'))continue;
      const url=new URL(link,canonical+path);
      if(url.origin===canonical)links.add(url.pathname+url.search);
    }
  }
  for(const field of ['title','description']){
    const seen=new Map();
    for(const item of pages){
      if(seen.has(item[field]))findings.push({path:item.path,message:'Duplicate '+field+' on '+seen.get(item[field])});
      seen.set(item[field],item.path);
    }
  }
  for(const link of links){
    const response=await fetch(base+link,{redirect:'manual'});
    if(response.status>=400)findings.push({path:link,message:'Internal destination HTTP '+response.status});
    await response.body?.cancel();
  }
  const status={};
  for(const path of ['/audit-missing-page','/tools/audit-missing-tool','/guides/audit-missing-guide','/robots.txt','/sitemap.xml','/login','/register','/dashboard','/admin','/forgot-password','/tools?category=Utilities']){
    const response=await fetch(base+path,{redirect:'manual'});
    const body=await response.text();
    status[path]={http:response.status,noindex:/noindex/.test(body),canonical:body.match(/rel="canonical" href="([^"]+)"/)?.[1],
      ...(path.endsWith('.txt')||path.endsWith('.xml')?{body}:{})};
  }
  const apex=await new Promise((resolve,reject)=>{
    const request=http.get(base+'/tools?audit=1',{headers:{host:'editgoo.com'}},response=>{
      response.resume();resolve({http:response.statusCode,location:response.headers.location});
    });
    request.on('error',reject);
  });
  await mkdir(artifact,{recursive:true});
  await writeFile(artifact+'/seo-audit.json',JSON.stringify({pages,links:[...links],findings,status,apex},null,2));
  console.log(JSON.stringify({routes:routes.length,links:links.size,findings,status,apex},null,2));
  if(findings.length)process.exitCode=1;
}finally{await browser.close()}
