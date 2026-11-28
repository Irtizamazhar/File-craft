import {expect,test} from '@playwright/test';

const widths=[320,360,375,390,414,768,1024,1440];
for(const path of ['/privacy','/cookies','/terms','/about','/contact','/']){
  test(`public page ${path} fits all readiness widths`,async({page})=>{
    await page.setViewportSize({width:320,height:900});
    await page.goto(path);
    await page.evaluate(()=>document.fonts.ready);
    await expect(page.getByRole('heading',{level:1})).toBeVisible();
    for(const width of widths){
      await page.setViewportSize({width,height:900});
      const layout=await page.evaluate(()=>({
        viewport:document.documentElement.clientWidth,
        document:document.documentElement.scrollWidth
      }));
      expect(layout.document,`${path} at ${width}px`).toBeLessThanOrEqual(layout.viewport);
    }
    if(path==='/privacy'){
      const link=page.getByRole('link',{name:'How Google uses data from partner sites'});
      await expect(link).toHaveAttribute('href','https://policies.google.com/technologies/partner-sites');
      await expect(page.getByRole('link',{name:'M-Lab Privacy Policy'})).toHaveAttribute('href','https://www.measurementlab.net/privacy/');
      expect(await link.evaluate(anchor=>getComputedStyle(anchor).whiteSpace)).toBe('nowrap');
      await page.setViewportSize({width:320,height:900});
      expect(await link.evaluate(anchor=>[...anchor.getClientRects()].every(rect=>rect.right<=innerWidth))).toBe(true);
      expect(await link.evaluate(anchor=>getComputedStyle(anchor).whiteSpace)).toBe('normal');
    }
  });
}

test('contact validates input and handles rejected, failed and accepted responses',async({page})=>{
  const responses=[
    {status:400,json:{error:'Please check all form fields.'}},
    {status:429,json:{error:'Too many messages. Try again later.'}},
    {status:500,json:{error:'Request could not be completed.'}},
    {status:200,json:{ok:true}}
  ];
  let attempts=0;
  let release!:()=>void;
  const pending=new Promise<void>(resolve=>{release=resolve;});
  await page.route('**/api/contact',async route=>{
    expect(route.request().method()).toBe('POST');
    expect(route.request().postDataJSON()).toMatchObject({
      name:'Local test visitor',email:'fixture@example.invalid',message:'This request is intercepted by Playwright.'
    });
    const response=responses[attempts++];
    if(response.status===200)await pending;
    await route.fulfill(response);
  });
  await page.goto('/contact');
  const submit=page.getByRole('button',{name:'Send message'});
  const name=page.getByLabel('Your name',{exact:true});
  const email=page.getByLabel('Email address',{exact:true});
  const message=page.getByLabel('Your message',{exact:true});
  await submit.click();
  expect(await name.evaluate(input=>(input as HTMLInputElement).validity.valueMissing)).toBe(true);
  await name.fill('Local test visitor');
  await email.fill('not-an-email');
  await message.fill('This request is intercepted by Playwright.');
  await submit.click();
  expect(await email.evaluate(input=>(input as HTMLInputElement).validity.typeMismatch)).toBe(true);
  expect(attempts).toBe(0);
  await email.fill('fixture@example.invalid');
  for(const response of responses.slice(0,3)){
    await submit.click();
    await expect(page.locator('.contact-box').getByRole('alert')).toHaveText(response.json.error!);
    await expect(message).toHaveValue('This request is intercepted by Playwright.');
  }
  await submit.click();
  try{await expect(page.getByRole('button',{name:'Sending...'})).toBeDisabled();}
  finally{release();}
  await expect(page.getByRole('heading',{name:'Message received.'})).toBeVisible();
  await expect(page.getByText('Your message has been saved for the Editgoo team.')).toBeVisible();
  expect(attempts).toBe(4);
});
