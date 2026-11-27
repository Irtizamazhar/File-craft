import {test,expect,type Page} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {createServer} from 'node:https';
import {readFileSync} from 'node:fs';
import type {AddressInfo} from 'node:net';

// Reuse the WebSocket server bundled with Next.js in this test fixture.
const {WebSocketServer}=require('next/dist/compiled/ws');
test.use({ignoreHTTPSErrors:true});

const route='/internet-speed-test';
const locate='https://locate.measurementlab.net/v2/nearest/ndt/ndt7';
const delay=(ms:number)=>new Promise<void>(resolve=>setTimeout(resolve,ms));

// Test-only fixture. Discovery is intercepted; real workers connect to local TLS WebSockets.
async function fixture(page:Page,{failFirst=false,partial=false,stall=false}={}){
  let requests=0;
  let connections=0;
  let closed=0;
  const local=createServer({
    key:readFileSync('tests/fixtures/internet-speed-test/localhost-test-key.pem'),
    cert:readFileSync('tests/fixtures/internet-speed-test/localhost-test-cert.pem')
  });
  const wss=new WebSocketServer({server:local,handleProtocols:(protocols:Set<string>)=>protocols.has('net.measurementlab.ndt.v7')?'net.measurementlab.ndt.v7':false});
  await new Promise<void>(resolve=>local.listen(0,'127.0.0.1',resolve));
  const server='wss://127.0.0.1:'+(local.address() as AddressInfo).port+'/ndt/v7/';
  wss.on('connection',async (socket:{readyState:number;send(data:string|Buffer):void;close():void;once(event:'close',listener:()=>void):void},request:{url:string})=>{
    connections++;
    socket.once('close',()=>{closed++});
    const send=(data:string|Buffer)=>{if(socket.readyState===1)socket.send(data)};
    if(stall)return;
    await delay(350);
    if(request.url.startsWith('/ndt/v7/download')){
      send(JSON.stringify({TCPInfo:{MinRTT:12000}}));
      send(Buffer.alloc(16384));
      await delay(350);
      send(Buffer.alloc(32768));
    }else if(!partial){
      send(JSON.stringify({AppInfo:{NumBytes:12500000,ElapsedTime:1000000}}));
    }
    await delay(350);
    if(socket.readyState===1)socket.close();
  });
  page.once('close',()=>{
    for(const socket of wss.clients)socket.terminate();
    wss.close();
    local.close();
  });
  await page.route(locate+'**',async request=>{
    requests++;
    await delay(340);
    if(failFirst&&requests===1){await request.fulfill({status:429,body:'{}'});return;}
    await request.fulfill({json:{results:[{urls:{
      'wss:///ndt/v7/download':server+'download?access_token=test-only',
      'wss:///ndt/v7/upload':server+'upload?access_token=test-only'
    }}]}});
  });
  return {requests:()=>requests,connections:()=>connections,closed:()=>closed};
}

async function consent(page:Page){
  await page.getByRole('checkbox',{name:/I agree/}).check();
  await page.getByRole('button',{name:'Start Test'}).press('Enter');
}

test('consent, discovery, both phases, real worker results and sharing',async({page})=>{
  const {requests,connections}=await fixture(page);
  await page.addInitScript(()=>{
    Object.defineProperty(navigator,'share',{value:undefined,configurable:true});
    Object.defineProperty(navigator,'clipboard',{value:{writeText:async(text:string)=>{document.documentElement.dataset.copied=text}}});
  });
  await page.goto(route);
  await expect(page.getByRole('button',{name:'Start Test'})).toBeDisabled();
  for(const metric of ['download','upload','ping','jitter'])await expect(page.getByTestId('speed-'+metric)).toHaveText('—');
  expect(requests()).toBe(0);
  await consent(page);
  await expect(page.getByText('Finding an M-Lab server…',{exact:true})).toBeVisible();
  await expect(page.getByText('Measuring download…',{exact:true})).toBeVisible();
  await expect(page.getByText('Measuring upload…',{exact:true})).toBeVisible();
  await expect(page.getByText('Test completed',{exact:true})).toBeVisible();
  expect(Number(await page.getByTestId('speed-download').innerText())).toBeGreaterThan(0);
  await expect(page.getByTestId('speed-upload')).toHaveText('100.00');
  await expect(page.getByTestId('speed-ping')).toHaveText('12.0');
  await expect(page.getByTestId('speed-jitter')).toHaveText('N/A');
  await expect(page.getByRole('button',{name:'Test Again'})).toBeVisible();
  await page.getByRole('button',{name:'Copy Results'}).click();
  await expect(page.getByText('Results copied.')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-copied',/Upload: 100\.00 Mbps[\s\S]*internet-speed-test/);
  expect(requests()).toBe(1);
  expect(connections()).toBe(2);
});

test('provider limit, retry and partial results',async({page})=>{
  const {requests}=await fixture(page,{failFirst:true,partial:true});
  await page.goto(route);
  await consent(page);
  await expect(page.locator('.internet-tool').getByRole('alert')).toContainText('limiting tests');
  await page.getByRole('button',{name:'Test Again'}).click();
  await expect(page.locator('.internet-tool').getByRole('alert')).toContainText('One measurement did not finish');
  await expect(page.getByTestId('speed-download')).not.toHaveText('N/A');
  await expect(page.getByTestId('speed-upload')).toHaveText('N/A');
  expect(requests()).toBe(2);
});

test('cancel and offline interruption stop the active session',async({page,context})=>{
  const sockets=await fixture(page,{stall:true});
  await page.goto(route);
  await consent(page);
  await expect(page.getByText('Measuring download…',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Cancel test'}).click();
  await expect(page.getByText('Test cancelled',{exact:true})).toBeVisible();
  await expect.poll(sockets.closed).toBe(1);
  await page.getByRole('button',{name:'Test Again'}).click();
  await expect(page.getByText('Measuring download…',{exact:true})).toBeVisible();
  await context.setOffline(true);
  await expect(page.locator('.internet-tool').getByRole('alert')).toContainText('went offline');
  await context.setOffline(false);
  await expect.poll(sockets.closed).toBe(2);
});

test('uses the native share action when available',async({page})=>{
  await fixture(page);
  await page.addInitScript(()=>{
    Object.defineProperty(navigator,'share',{value:async({text}:{text:string})=>{
      document.documentElement.dataset.shared=text;
    },configurable:true});
  });
  await page.goto(route);
  await consent(page);
  await page.getByRole('button',{name:'Share Result'}).click();
  await expect(page.locator('html')).toHaveAttribute('data-shared',/Ping \(M-Lab TCP minimum RTT\): 12\.0 ms/);
});

test('responsive widths, keyboard consent, accessibility and Utilities search',async({page})=>{
  await page.goto(route);
  for(const width of [320,375,390,430,768,1024,1440]){
    await page.setViewportSize({width,height:900});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),String(width)).toBe(true);
  }
  const checkbox=page.getByRole('checkbox',{name:/I agree/});
  await checkbox.focus();
  await page.keyboard.press('Space');
  await expect(page.getByRole('button',{name:'Start Test'})).toBeEnabled();
  expect((await new AxeBuilder({page}).include('.internet-page').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations.map(v=>v.id)).toEqual([]);
  await page.goto('/tools?category=Utilities');
  await expect(page.locator('.directory-grid').getByRole('link',{name:/Internet Speed Test/})).toBeVisible();
  await page.getByRole('textbox',{name:'Search tools'}).fill('bandwidth');
  await expect(page.locator('.directory-grid a')).toHaveCount(1);
  await page.locator('.directory-grid a').first().click();
  await expect(page).toHaveURL(/\/internet-speed-test$/);
});
