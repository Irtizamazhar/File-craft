import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';

const output='artifacts/premium-ui';
const base=process.env.TEST_BASE_URL||'http://localhost:3100';
const routes=[
  ['home','/'],['all-tools','/tools'],['tool','/tools/merge-pdf'],['pricing','/pricing'],
  ['login','/login'],['signup','/register']
];

await mkdir(output,{recursive:true});
const browser=await chromium.launch();
try {
  for(const width of [320,360,390,430,768,1024,1440,1920]){
    const page=await browser.newPage({viewport:{width,height:1000},reducedMotion:'reduce'});
    for(const [name,path] of routes){
      const response=await page.goto(base+path);
      if(!response?.ok())throw new Error(path+' returned '+response?.status());
      await page.locator('h1').waitFor();
      await page.evaluate(()=>document.fonts.ready);
      if(name==='pricing'||name==='home'){
        await page.waitForFunction(()=>document.querySelector('.pricing-page .error-box')||
          document.querySelector('.reference-pricing')?.textContent.includes('MB per file'));
      }
      if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)){
        throw new Error(path+' overflows at '+width+' px');
      }
      if(width===1440||width===390){
        await page.screenshot({path:output+'/'+name+'-'+width+'.png',fullPage:true});
      }
    }
    await page.close();
    console.log('Homepage, tools, merge, pricing, login and signup fit '+width+' px');
  }
} finally {
  await browser.close();
}
