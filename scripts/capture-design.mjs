import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';
await mkdir('artifacts/ui-screenshots',{recursive:true});
const browser=await chromium.launch({headless:true});
try{for(const width of [390,1440]){const page=await browser.newPage({viewport:{width,height:1000}});for(const [name,path] of [['home','/'],['pricing','/pricing'],['tool','/tools/merge-pdf'],['login','/login']]){await page.goto((process.env.TEST_BASE_URL||'http://localhost:3100')+path);await page.locator('h1').waitFor();if(name==='pricing')await page.getByText('15 MB per file',{exact:true}).waitFor();await page.screenshot({path:'artifacts/ui-screenshots/'+name+'-'+width+'.png',fullPage:true});console.log(name+' '+width+' captured')}await page.close()}}finally{await browser.close()}
