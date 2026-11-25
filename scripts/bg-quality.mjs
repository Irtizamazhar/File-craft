// Background-removal quality harness.
//   node scripts/bg-quality.mjs run <label>   run every case in tests/fixtures/quality/cases.json through
//                                            /remove-background and save the downloaded PNGs to artifacts/bg-quality/<label>/
//   node scripts/bg-quality.mjs report       build artifacts/bg-quality/index.html (+ grid.png) comparing all labels
// Env: BASE_URL (default http://localhost:3100), PW_CHANNEL (e.g. "chrome" to use the installed browser).
import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const [mode='run',label='after']=process.argv.slice(2);
const base=process.env.BASE_URL||'http://localhost:3100';
const outRoot='artifacts/bg-quality';
const {cases}=JSON.parse(await fs.readFile('tests/fixtures/quality/cases.json','utf8'));
const launch=()=>chromium.launch({headless:true,...(process.env.PW_CHANNEL?{channel:process.env.PW_CHANNEL}:{})});

async function run(){
  const dir=path.join(outRoot,label);await fs.mkdir(dir,{recursive:true});
  const browser=await launch();const results=[];
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1000}});
    let current='';
    // Keep the raw server matte (before edge refinement) next to the cutout, for debugging.
    page.on('response',async response=>{if(current&&response.request().method()==='POST'&&response.url().endsWith('/api/remove-background')&&response.ok())await fs.writeFile(path.join(dir,current+'.server-mask.png'),await response.body()).catch(()=>{})});
    await page.goto(base+'/remove-background',{waitUntil:'networkidle',timeout:180000});
    for(const c of cases){
      current=c.name;
      const started=Date.now();
      await page.locator('input[type=file]').first().setInputFiles(c.file);
      // Older builds need a click; newer ones start automatically after upload.
      await page.waitForTimeout(1500);
      const status=await page.locator('[role=status]').textContent().catch(()=>'');
      if(/Image loaded/.test(status||''))await page.getByRole('button',{name:'Remove background',exact:true}).click();
      const done=await page.waitForFunction(()=>{const s=document.querySelector('[role=status]')?.textContent||'';const alert=document.querySelector('main [role=alert]')?.textContent||'';return s.includes('Foreground estimated.')||s.includes('background removed')?{s}:alert?{alert}:false},{},{timeout:600000,polling:500}).then(h=>h.jsonValue());
      const seconds=+((Date.now()-started)/1000).toFixed(1);
      if(done.alert){results.push({name:c.name,error:done.alert,seconds});console.log(c.name,'ERROR',done.alert);continue}
      await page.getByRole('button',{name:'Export PNG',exact:true}).click();
      const download=page.waitForEvent('download');
      await page.getByRole('link',{name:'Download PNG',exact:true}).click();
      await (await download).saveAs(path.join(dir,c.name+'.png'));
      results.push({name:c.name,stage:done.s,seconds});
      console.log(c.name,seconds+' s',done.s);
    }
  }finally{await browser.close()}
  await fs.writeFile(path.join(dir,'results.json'),JSON.stringify(results,null,2));
}

async function report(){
  const labels=[];
  for(const entry of await fs.readdir(outRoot,{withFileTypes:true}))if(entry.isDirectory())labels.push(entry.name);
  labels.sort((a,b)=>a==='before'?-1:b==='before'?1:a.localeCompare(b));
  const timing={};
  for(const l of labels){try{timing[l]=Object.fromEntries(JSON.parse(await fs.readFile(path.join(outRoot,l,'results.json'),'utf8')).map(r=>[r.name,r]))}catch{timing[l]={}}}
  const esc=s=>String(s).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
  const rows=cases.map(c=>`<tr><th><b>${esc(c.name)}</b><br><small>${esc(c.category)}</small></th><td><img src="${esc(path.relative(outRoot,c.file).split(path.sep).join('/'))}"><small>original</small></td>${labels.map(l=>{const r=timing[l][c.name]||{};return `<td class="cut"><img src="${esc(l)}/${esc(c.name)}.png" alt="${r.error?'failed':''}"><small>${esc(l)}${r.seconds?` · ${r.seconds} s`:''}${r.error?' · ERROR '+esc(r.error):''}</small></td>`}).join('')}</tr>`).join('');
  const html=`<!doctype html><meta charset="utf-8"><title>Background removal comparison</title><style>body{font:14px system-ui,sans-serif;margin:16px;background:#fff;color:#111}table{border-collapse:collapse}th{text-align:left;width:170px;vertical-align:top;padding:8px}td{padding:6px;vertical-align:top}img{display:block;width:300px;height:300px;object-fit:contain}td.cut img{background:repeating-conic-gradient(#ccc 0 25%,#fff 0 50%) 0 0/16px 16px}small{display:block;color:#555;margin-top:2px}.bar{margin-bottom:12px}</style><div class="bar">Checkerboard = transparent. Columns: original, ${labels.map(esc).join(', ')}. Switch the cutout background: <button onclick="document.querySelectorAll('td.cut img').forEach(i=>i.style.background='#00a651')">green</button> <button onclick="document.querySelectorAll('td.cut img').forEach(i=>i.style.background='#000')">black</button> <button onclick="document.querySelectorAll('td.cut img').forEach(i=>i.style.background='')">checkerboard</button></div><table>${rows}</table>`;
  await fs.writeFile(path.join(outRoot,'index.html'),html);
  const browser=await launch();
  try{const page=await browser.newPage({viewport:{width:500+320*labels.length,height:900}});await page.goto('file:///'+path.resolve(outRoot,'index.html').split(path.sep).join('/'));await page.waitForTimeout(800);await page.screenshot({path:path.join(outRoot,'grid.png'),fullPage:true})}finally{await browser.close()}
  console.log('Wrote',path.join(outRoot,'index.html'),'and grid.png');
}

if(mode==='report')await report();else await run();
