import {expect,test,type Page} from '@playwright/test';
import {PDFDocument} from 'pdf-lib';

const id='G-TWCBV18PZ7';
const tag='https://www.googletagmanager.com/gtag/js?id='+id;
const collection='https://www.google-analytics.com/g/collect';
test.skip(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!==id,'Run against a build configured for the GA4 test stream.');

async function interceptAnalytics(page:Page,waitForTag?:Promise<void>){
  let loads=0;
  const requests:URL[]=[];
  await page.route('https://www.googletagmanager.com/**',async route=>{
    expect(route.request().url()).toBe(tag);
    loads++;
    await waitForTag;
    await route.fulfill({contentType:'application/javascript',body:`
      const originalPush = window.dataLayer.push.bind(window.dataLayer);
      window.dataLayer.push = function(command) {
        const result = originalPush(command);
        if(command[0] === 'event' && !window['ga-disable-${id}']) {
          const url = new URL('${collection}');
          url.search = new URLSearchParams({...command[2], en:command[1]});
          fetch(url).catch(()=>{});
        }
        return result;
      };
    `});
  });
  await page.route('https://www.google-analytics.com/**',async route=>{
    requests.push(new URL(route.request().url()));
    await route.fulfill({status:204,headers:{'access-control-allow-origin':'*'}});
  });
  return {
    loads:()=>loads,
    events:()=>requests.map(r=>r.searchParams.get('en')),
    views:()=>requests.filter(r=>r.searchParams.get('en')==='page_view').map(r=>new URL(r.searchParams.get('page_location')!).pathname),
    requests
  };
}

test('analytics is blocked by default and after a saved rejection',async({page})=>{
  const analytics=await interceptAnalytics(page);
  await page.goto('/?email=private@example.invalid');
  await expect(page.getByRole('heading',{name:'Your cookie choices'})).toBeVisible();
  await page.getByRole('button',{name:'Settings',exact:true}).click();
  await expect(page.getByRole('checkbox',{name:'Allow analytics cookies'})).not.toBeChecked();
  await page.getByRole('button',{name:'Cancel',exact:true}).click();
  await page.getByRole('button',{name:'Reject',exact:true}).click();
  await page.reload();
  await expect(page.getByRole('button',{name:'Cookie settings'})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Your cookie choices'})).toHaveCount(0);
  await page.getByRole('link',{name:'Privacy Policy',exact:true}).click();
  await expect(page).toHaveURL(/\/privacy$/);
  expect(analytics.loads()).toBe(0);
  expect(analytics.events()).toEqual([]);
});

test('acceptance and withdrawal gate deduplicated, sanitized navigation',async({page,context})=>{
  const analytics=await interceptAnalytics(page);
  await page.goto('/?email=private@example.invalid#private-fragment');
  await page.getByRole('button',{name:'Accept',exact:true}).click();
  await expect.poll(analytics.views).toEqual(['/']);
  const commands=await page.evaluate(()=>((window as unknown as {dataLayer:unknown[][]}).dataLayer).map(args=>Array.from(args)));
  expect(commands[0]).toEqual(['consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'}]);
  expect(commands[1]).toEqual(['consent','update',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'}]);
  expect(commands.find(args=>args[0]==='config')).toEqual(expect.arrayContaining([id,expect.objectContaining({send_page_view:false,allow_google_signals:false})]));
  await page.getByRole('link',{name:'Privacy Policy',exact:true}).click();
  await expect.poll(analytics.views).toEqual(['/','/privacy']);
  await page.goBack();
  await expect.poll(analytics.views).toEqual(['/','/privacy','/']);
  await page.evaluate(()=>history.pushState(null,'','/?private=query#private'));
  await expect(page).toHaveURL(/private=query/);
  expect(analytics.views()).toEqual(['/','/privacy','/']);
  expect(analytics.requests.map(url=>url.href).join(' ')).not.toMatch(/private|%40|fragment/);
  expect(analytics.loads()).toBe(1);
  await context.addCookies([{name:'_ga',value:'fixture',url:new URL(page.url()).origin}]);
  await page.getByRole('button',{name:'Cookie settings'}).click();
  const settings=page.getByRole('checkbox',{name:'Allow analytics cookies'});
  await expect(settings).toBeChecked();
  await settings.uncheck();
  await page.getByRole('button',{name:'Save settings'}).click();
  expect((await context.cookies()).some(x=>x.name==='_ga')).toBe(false);
  await page.getByRole('link',{name:'Terms and Conditions',exact:true}).click();
  await expect(page).toHaveURL(/\/terms$/);
  expect(analytics.views()).toEqual(['/','/privacy','/']);
  await page.getByRole('button',{name:'Cookie settings'}).click();
  await settings.check();
  await page.getByRole('button',{name:'Save settings'}).click();
  await expect.poll(analytics.views).toEqual(['/','/privacy','/','/terms']);
  expect(analytics.loads()).toBe(1);
});

test('withdrawing while the tag loads discards the pending configuration',async({page})=>{
  let release!:()=>void;
  const waitForTag=new Promise<void>(resolve=>{release=resolve;});
  const analytics=await interceptAnalytics(page,waitForTag);
  await page.goto('/');
  await page.getByRole('button',{name:'Accept',exact:true}).click();
  await expect.poll(analytics.loads).toBe(1);
  await page.getByRole('button',{name:'Cookie settings'}).click();
  await page.getByRole('checkbox',{name:'Allow analytics cookies'}).uncheck();
  await page.getByRole('button',{name:'Save settings'}).click();
  release();
  await expect.poll(()=>page.evaluate(key=>Boolean((window as unknown as Record<string,unknown>)[key]),'ga-disable-'+id)).toBe(true);
  const queued=await page.evaluate(()=>(window as unknown as {dataLayer:unknown[]}).dataLayer);
  expect(queued).toEqual([]);
  expect(analytics.events()).toEqual([]);
});

test('a consented tool reports start, failure and success with a fixed identifier',async({page})=>{
  const analytics=await interceptAnalytics(page);
  const pdf=await PDFDocument.create();
  pdf.addPage();
  const buffer=Buffer.from(await pdf.save());
  await page.goto('/tools/extract-pdf-pages?email=hidden@example.invalid');
  await page.getByRole('button',{name:'Accept',exact:true}).click();
  await page.locator('input[type=file]').setInputFiles({name:'private-name.pdf',mimeType:'application/pdf',buffer});
  const range=page.getByRole('textbox',{name:/^Pages/});
  await range.fill('9999');
  await page.getByRole('button',{name:/Process (1 )?file/i}).click();
  await expect.poll(analytics.events).toEqual(['page_view','tool_started','tool_failed']);
  await range.fill('1');
  await page.getByRole('button',{name:/Process (1 )?file|Try again/i}).click();
  await expect.poll(analytics.events).toEqual(['page_view','tool_started','tool_failed','tool_started','tool_completed']);
  for(const request of analytics.requests.slice(1)){
    expect(request.searchParams.get('tool_id')).toBe('extract-pdf-pages');
    expect([...request.searchParams.keys()].sort()).toEqual(['en','page_location','page_referrer','page_title','send_to','tool_id']);
    expect(request.href).not.toMatch(/private-name|hidden|9999/);
  }
});
