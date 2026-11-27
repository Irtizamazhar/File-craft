import {test,expect,type Page} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const input=(page:Page)=>page.getByRole('textbox',{name:/Typing input/});
const stat=(page:Page,name:string)=>page.locator(`[data-stat="${name}"]`);
const result=(page:Page,name:string)=>page.locator(`[data-result="${name}"]`);
const prompt=(page:Page)=>page.locator('[data-testid="prompt"]').evaluate(el=>el.textContent??'');
const char=(page:Page,i:number)=>page.locator('[data-testid="prompt"] > span').nth(i);
const modeButton=(page:Page,name:string)=>page.getByRole('group',{name:'Test mode'}).getByRole('button',{name,exact:true});

async function open(page:Page){
  await page.goto('/typing-test');
  await expect(page.locator('[data-testid="prompt"] > span').first()).toBeAttached();
  await expect(input(page)).toBeEnabled();
}
async function useCustom(page:Page,text:string){
  await modeButton(page,'Custom text').click();
  await page.getByLabel('Your practice text').fill(text);
  await page.getByRole('button',{name:'Use this text'}).click();
  await expect.poll(()=>prompt(page)).toBe(text);
}
const isMobile=(name:string)=>name.startsWith('mobile');

test.describe('typing test',()=>{
  for(const [label,seconds,duration] of [['15s',15,'15.0 s'],['30s',30,'30.0 s'],['1 min',60,'1 min 0 s'],['2 min',120,'2 min 0 s'],['5 min',300,'5 min 0 s']] as const){
    test(`${label} time mode ends at the limit and scores exactly`,async({page})=>{
      await page.clock.install();
      await open(page);
      await page.getByRole('group',{name:'Test duration'}).getByRole('button',{name:label,exact:true}).click();
      await expect(stat(page,'time')).toHaveText(String(seconds)+'s');
      const text=await prompt(page);
      await input(page).focus();
      await page.keyboard.type(text.slice(0,10));
      await page.clock.fastForward(seconds*1000+500);
      await expect(page.getByTestId('results')).toBeVisible();
      await expect(result(page,'duration')).toHaveText(duration);
      // 10 correct characters: 10 / 5 / minutes.
      await expect(result(page,'net')).toHaveText(String(Math.round(10/5/(seconds/60))));
      await expect(result(page,'accuracy')).toHaveText('100%');
      await expect(page.getByText('Test completed',{exact:true})).toBeVisible();
      // The graph has one real sample per second; its last value equals the result.
      await expect(page.getByText('Show graph data as a table')).toBeHidden();
      await page.getByText('Detailed Stats',{exact:true}).click();
      await page.getByText('Show graph data as a table').click();
      const rows=page.getByTestId('results').locator('table tbody tr');
      await expect(rows).toHaveCount(seconds);
      await expect(rows.last().locator('td').nth(1)).toHaveText(String(Math.round(10/5/(seconds/60))));
    });
  }

  test('timer starts on the first typed character, not on click',async({page})=>{
    await page.clock.install();
    await open(page);
    await input(page).click();
    await expect(input(page)).toBeFocused();
    await page.clock.fastForward(5000);
    await expect(stat(page,'time')).toHaveText('60s');
    await expect(stat(page,'wpm')).toHaveText('–');
    const text=await prompt(page);
    await page.keyboard.type(text[0]);
    await page.clock.fastForward(3000);
    await expect(stat(page,'time')).toHaveText('57s');
  });

  test('correct, incorrect and backspace correction are tracked separately',async({page})=>{
    await open(page);
    await useCustom(page,'abcd efgh ijkl mnop qrst');
    await input(page).focus();
    await page.keyboard.type('abx');
    await expect(char(page,0)).toHaveAttribute('data-s','c');
    await expect(char(page,2)).toHaveAttribute('data-s','x');
    await expect(stat(page,'uncorrected')).toHaveText('1');
    await page.keyboard.press('Backspace');
    await expect(char(page,2)).not.toHaveAttribute('data-s');
    await expect(stat(page,'uncorrected')).toHaveText('0');
    await expect(stat(page,'corrected')).toHaveText('1');
    await expect(stat(page,'incorrect')).toHaveText('1');
    await page.keyboard.type('cd');
    await expect(stat(page,'correct')).toHaveText('4');
    await expect(stat(page,'typed')).toHaveText('5');
    await expect(stat(page,'accuracy')).toHaveText('100%');
  });

  test('word mode completes after the target words, including repeated and very fast keys',async({page})=>{
    await open(page);
    await modeButton(page,'Words').click();
    await page.getByRole('button',{name:'10 words',exact:true}).click();
    const text=await prompt(page);
    expect(text.split(' ')).toHaveLength(10);
    await input(page).focus();
    await page.keyboard.type(text,{delay:0});
    await expect(page.getByTestId('results')).toBeVisible();
    await expect(page.getByText('Test completed',{exact:true})).toBeVisible();
    await expect(result(page,'correct')).toHaveText(String(text.length));
    await expect(result(page,'uncorrected')).toHaveText('0');
    await expect(result(page,'incorrect')).toHaveText('0');
    for(const n of ['25 words','50 words','100 words']){
      await modeButton(page,'Words').click();
      await page.getByRole('button',{name:n,exact:true}).click();
      expect((await prompt(page)).split(' ')).toHaveLength(parseInt(n));
    }
  });

  test('repeated identical keys are each scored',async({page})=>{
    await open(page);
    await useCustom(page,'aaaa aaaa bbbb bbbb cccc');
    await input(page).focus();
    await page.keyboard.type('aaaa aaaa bbbb bbbb cccc',{delay:0});
    await expect(result(page,'correct')).toHaveText('24');
    await expect(result(page,'typed')).toHaveText('24');
  });

  test('quote mode types a full original passage',async({page})=>{
    await open(page);
    await modeButton(page,'Quote').click();
    await page.getByRole('button',{name:'Short',exact:true}).click();
    const text=await prompt(page);
    expect(text.length).toBeGreaterThan(40);
    await input(page).focus();
    await page.keyboard.type(text,{delay:0});
    await expect(page.getByTestId('results')).toBeVisible();
    await expect(page.getByRole('button',{name:'Short',exact:true})).toHaveAttribute('aria-pressed','true');
    await page.getByText('Detailed Stats',{exact:true}).click();
    await expect(page.getByTestId('results').getByText('Quote',{exact:true})).toBeVisible();
  });

  test('custom text is validated and labelled as practice',async({page})=>{
    await open(page);
    await modeButton(page,'Custom text').click();
    await expect(input(page)).toBeDisabled();
    await page.getByLabel('Your practice text').fill('too short');
    await page.getByRole('button',{name:'Use this text'}).click();
    await expect(page.locator('#typing-custom-error')).toContainText('at least 20');
    const text='Practice makes progress when you type every day.';
    await page.getByLabel('Your practice text').fill(text);
    await page.getByRole('button',{name:'Use this text'}).click();
    await expect.poll(()=>prompt(page)).toBe(text);
    await input(page).focus();
    await page.keyboard.type(text,{delay:5});
    await expect(page.getByText(/Practice result[.] Excluded/)).toBeVisible();
    await expect(page.getByTestId('results').getByText('Personal best',{exact:true})).toHaveCount(0);
  });

  test('practice drills produce matching text',async({page})=>{
    await open(page);
    await modeButton(page,'Practice').click();
    const drill=page.getByLabel('Practice');
    await drill.selectOption('numbers');
    await expect.poll(()=>prompt(page)).toMatch(/\d/);
    await drill.selectOption('capitals');
    await expect.poll(()=>prompt(page)).toMatch(/[A-Z]/);
    await drill.selectOption('punctuation');
    await expect.poll(()=>prompt(page)).toMatch(/[.,;:?!]/);
  });

  test('pasting, dropping, bulk insertion and synthetic input are not scored',async({page,context,browserName})=>{
    test.skip(browserName!=='chromium','clipboard permissions are Chromium-specific');
    await context.grantPermissions(['clipboard-read','clipboard-write']);
    await open(page);
    const text=await prompt(page);
    await page.evaluate(t=>navigator.clipboard.writeText(t),text.slice(0,30));
    await input(page).focus();
    await page.keyboard.press('ControlOrMeta+V');
    await expect(page.getByText('Pasting is turned off',{exact:false})).toBeVisible();
    await expect(input(page)).toHaveValue('');
    await page.keyboard.insertText(text.slice(0,12));
    await expect(page.getByText('Only one character at a time',{exact:false})).toBeVisible();
    await expect(input(page)).toHaveValue('');
    await input(page).evaluate(el=>{
      const data=new DataTransfer();data.setData('text/plain','dropped words');
      const event=new DragEvent('drop',{dataTransfer:data,bubbles:true,cancelable:true});
      el.dispatchEvent(event);(window as any).__dropPrevented=event.defaultPrevented;
    });
    expect(await page.evaluate(()=>(window as any).__dropPrevented)).toBe(true);
    await expect(page.getByText('Dropping text into the test is turned off',{exact:false})).toBeVisible();
    await input(page).evaluate(el=>{(el as HTMLInputElement).value='x';el.dispatchEvent(new Event('input',{bubbles:true}))});
    await expect(input(page)).toHaveValue('');
    await expect(stat(page,'typed')).toHaveText('0');
    await expect(stat(page,'time')).toHaveText('60s');
  });

  test('restart and mode changes clear the whole session',async({page})=>{
    await open(page);
    const text=await prompt(page);
    await input(page).focus();
    await page.keyboard.type(text.slice(0,5)+'##');
    await expect(stat(page,'typed')).toHaveText('7');
    await page.keyboard.press('Escape');
    await expect(stat(page,'typed')).toHaveText('0');
    await expect(stat(page,'time')).toHaveText('60s');
    expect(await prompt(page)).toBe(text);
    await expect(page.locator('[data-testid="prompt"] [data-s]')).toHaveCount(0);
    await expect(input(page)).toHaveValue('');
    await page.keyboard.type(text.slice(0,4));
    await modeButton(page,'Words').click();
    await expect(stat(page,'typed')).toHaveText('0');
    await expect(stat(page,'time')).toHaveText('0:00');
    await expect(page.locator('[data-testid="prompt"] [data-s]')).toHaveCount(0);
    const before=await prompt(page);
    await input(page).focus();
    await page.keyboard.press('Control+Enter');
    await expect.poll(()=>prompt(page)).not.toBe(before);
  });

  test('timed prompts extend automatically before they run out',async({page})=>{
    await open(page);
    const text=await prompt(page);
    await input(page).focus();
    await page.keyboard.type(text.slice(0,text.length-250),{delay:0});
    await expect.poll(async()=>(await prompt(page)).length).toBeGreaterThan(text.length);
    expect((await prompt(page)).startsWith(text+' ')).toBe(true);
  });

  test('results: copy summary, personal best, history and clear',async({page,context,browserName})=>{
    test.skip(browserName!=='chromium','clipboard permissions are Chromium-specific');
    await context.grantPermissions(['clipboard-read','clipboard-write']);
    await page.clock.install();
    await open(page);
    await page.getByRole('group',{name:'Test duration'}).getByRole('button',{name:'15s',exact:true}).click();
    const text=await prompt(page);
    await input(page).focus();
    await page.keyboard.type(text.slice(0,20));
    await page.clock.fastForward(16000);
    await expect(result(page,'net')).toHaveText('16');
    await expect(page.getByText('Personal best',{exact:true})).toBeVisible();
    await page.getByRole('button',{name:'Copy results'}).click();
    await expect(page.getByText('Result summary copied to the clipboard.')).toBeVisible();
    const copied=await page.evaluate(()=>navigator.clipboard.readText());
    expect(copied).toContain('Editgoo Typing Speed Test result');
    expect(copied).toContain('Net speed: 16 WPM');
    expect(copied).toContain('Not an independently verified');
    await expect(page.locator('[data-progress="best"]')).toHaveText('16 WPM');
    await expect(page.locator('[data-progress="sessions"]')).toHaveText('1');
    // A slower second test keeps the personal best.
    await page.getByRole('button',{name:'Try again'}).click();
    await page.keyboard.type(text.slice(0,10));
    await page.clock.fastForward(16000);
    await expect(page.getByText('Personal best',{exact:true})).toHaveCount(0);
    await expect(page.locator('[data-progress="best"]')).toHaveText('16 WPM');
    await expect(page.locator('[data-progress="sessions"]')).toHaveText('2');
    await expect(page.locator('[data-progress="average"]')).toHaveText('12');
    await page.reload();
    await expect(page.locator('[data-progress="sessions"]')).toHaveText('2');
    await expect(page.getByRole('button',{name:'Clear history'})).toBeHidden();
    await page.getByText('History',{exact:true}).click();
    await expect(page.getByRole('table',{name:'Recent completed tests, newest first'})).toBeVisible();
    await page.getByRole('button',{name:'Clear history'}).click();
    await page.getByRole('button',{name:'Select again to clear history'}).click();
    await expect(page.locator('[data-progress="sessions"]')).toHaveText('0');
    await expect(page.locator('[data-progress="best"]')).toHaveText('16 WPM');
    await page.getByRole('button',{name:'Reset personal best'}).click();
    await page.getByRole('button',{name:'Select again to reset'}).click();
    await expect(page.getByRole('heading',{name:'Progress',exact:true})).toHaveCount(0);
  });

  test('works when local storage is blocked',async({page})=>{
    await page.addInitScript(()=>{Object.defineProperty(window,'localStorage',{configurable:true,get(){throw new DOMException('blocked','SecurityError')}})});
    await open(page);
    await expect(page.getByText('Saving is unavailable because this browser is blocking local storage',{exact:false})).toBeVisible();
    await useCustom(page,'Storage can be blocked and the test still works.');
    await input(page).focus();
    await page.keyboard.type('Storage can be blocked and the test still works.',{delay:60});
    await expect(page.getByTestId('results')).toBeVisible();
    await expect(page.getByText('Not saved: local storage is unavailable.')).toBeVisible();
  });

  test('a test hidden in a background tab is marked and not saved',async({page})=>{
    await open(page);
    await useCustom(page,'Switching tabs keeps the clock running for this test.');
    await input(page).focus();
    await page.keyboard.type('Switching');
    await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'))});
    await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.dispatchEvent(new Event('visibilitychange'))});
    await page.keyboard.type(' tabs keeps the clock running for this test.',{delay:5});
    await expect(page.getByText('The browser tab was hidden during the test, so this result was not saved.')).toBeVisible();
    await expect(page.getByRole('heading',{name:'Progress',exact:true})).toHaveCount(0);
  });

  test('IME composition text is scored once and replacements are rejected',async({page,browserName})=>{
    test.skip(browserName!=='chromium','uses the Chromium DevTools protocol');
    await open(page);
    await useCustom(page,'the quick brown fox jumps over the lazy dog');
    await input(page).focus();
    const cdp=await page.context().newCDPSession(page);
    for(const t of ['t','th','the'])await cdp.send('Input.imeSetComposition',{text:t,selectionStart:t.length,selectionEnd:t.length});
    await cdp.send('Input.insertText',{text:'the'});
    await expect(input(page)).toHaveValue('the');
    await expect(stat(page,'correct')).toHaveText('3');
    await expect(stat(page,'typed')).toHaveText('3');
    // A composition that rewrites text already typed (like an IME conversion or autocorrect) is ignored.
    await page.keyboard.type(' q');
    await cdp.send('Input.imeSetComposition',{text:'k',selectionStart:1,selectionEnd:1});
    await cdp.send('Input.imeSetComposition',{text:'か',selectionStart:1,selectionEnd:1});
    await cdp.send('Input.insertText',{text:'か'});
    await expect(page.getByText('Your keyboard tried to change text',{exact:false})).toBeVisible();
    // The rewrite of "k" was undone; the committed character is then scored as a normal (wrong) keystroke.
    await expect(input(page)).toHaveValue('the qkか');
    await expect(stat(page,'typed')).toHaveText('7');
    await expect(stat(page,'uncorrected')).toHaveText('2');
  });

  test('desktop keyboard: type without clicking, shortcuts and focus order',async({page},testInfo)=>{
    test.skip(isMobile(testInfo.project.name),'desktop keyboard flow');
    await open(page);
    const text=await prompt(page);
    await page.locator('body').click({position:{x:5,y:5}});
    await page.keyboard.type(text.slice(0,3));
    await expect(input(page)).toBeFocused();
    await expect(stat(page,'typed')).toHaveText('3');
    await page.keyboard.press('Escape');
    await expect(stat(page,'typed')).toHaveText('0');
    // Space and Enter keep working on focused buttons.
    await modeButton(page,'Words').focus();
    await page.keyboard.press('Enter');
    await expect(modeButton(page,'Words')).toHaveAttribute('aria-pressed','true');
    await modeButton(page,'Quote').focus();
    await page.keyboard.press('Space');
    await expect(modeButton(page,'Quote')).toHaveAttribute('aria-pressed','true');
    await expect(input(page)).not.toBeFocused();
    // Tab moves from the input to the next control instead of being typed.
    await input(page).focus();
    await page.keyboard.press('Tab');
    await expect(input(page)).not.toBeFocused();
    await expect(stat(page,'typed')).toHaveText('0');
  });

  test('mobile: tapping opens the input, typing works and nothing overflows',async({page},testInfo)=>{
    test.skip(!isMobile(testInfo.project.name),'touch emulation project only');
    await open(page);
    // The text area must be reachable near the top of a phone screen.
    const top=await input(page).evaluate(el=>el.getBoundingClientRect().top+window.scrollY);
    expect(top).toBeLessThan(page.viewportSize()!.height*0.75);
    await input(page).tap();
    await expect(input(page)).toBeFocused();
    const text=await prompt(page);
    await page.keyboard.type(text.slice(0,8));
    await expect(stat(page,'typed')).toHaveText('8');
    await expect(stat(page,'correct')).toHaveText('8');
    const fontSize=await input(page).evaluate(el=>parseFloat(getComputedStyle(el).fontSize));
    expect(fontSize).toBeGreaterThanOrEqual(16);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);
    await page.getByRole('button',{name:/^Restart/}).tap();
    await expect(stat(page,'typed')).toHaveText('0');
  });

  test('focus mode hides distractions and can be exited',async({page})=>{
    await open(page);
    await expect(page.getByRole('button',{name:'Focus mode'})).toBeHidden();
    await page.getByText('Options',{exact:true}).click();
    await page.getByRole('button',{name:'Focus mode'}).click();
    await expect(page.locator('.site-header')).toBeHidden();
    await expect(page.getByRole('group',{name:'Test mode'})).toBeHidden();
    await expect(page.getByRole('heading',{name:'What is a typing speed test?'})).toBeHidden();
    await page.getByRole('button',{name:'Exit focus mode'}).click();
    await expect(page.locator('.site-header')).toBeVisible();
  });

  test('accessibility scan passes on the typing test and results',async({page})=>{
    await page.clock.install();
    await open(page);
    const tags=['wcag2a','wcag2aa','wcag21aa','wcag22aa'];
    let scan=await new AxeBuilder({page}).withTags(tags).analyze();
    expect(scan.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))).toEqual([]);
    await page.getByRole('group',{name:'Test duration'}).getByRole('button',{name:'15s',exact:true}).click();
    const text=await prompt(page);
    await input(page).focus();
    await page.keyboard.type(text.slice(0,20));
    await page.clock.fastForward(16000);
    await expect(page.getByTestId('results')).toBeVisible();
    await expect(page.getByTestId('results').getByRole('heading',{level:2})).toBeFocused();
    scan=await new AxeBuilder({page}).withTags(tags).analyze();
    expect(scan.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))).toEqual([]);
  });

  test('SEO metadata, canonical and structured data',async({page})=>{
    await page.goto('/typing-test');
    await expect(page).toHaveTitle('Free Typing Speed Test Online - WPM & Accuracy Checker | Editgoo');
    await expect(page.locator('h1')).toHaveText('Typing Speed Test.');
    expect(await page.locator('link[rel="canonical"]').getAttribute('href')).toMatch(/\/typing-test$/);
    expect(await page.locator('meta[name="description"]').getAttribute('content')).toContain('typing speed test');
    expect(await page.locator('meta[property="og:image"]').getAttribute('content')).toContain('/og-typing-test.png');
    expect(await page.locator('meta[name="twitter:image"]').getAttribute('content')).toContain('/og-typing-test.png');
    expect(await page.locator('meta[name="robots"]').getAttribute('content')).toContain('noindex');
    const ld=await page.locator('script[type="application/ld+json"]').allTextContents();
    const types=ld.flatMap(t=>[JSON.parse(t)].flat()).map((x:any)=>x['@type']);
    expect(types).toEqual(expect.arrayContaining(['WebApplication','BreadcrumbList']));
    expect(ld.join(' ')).not.toMatch(/aggregateRating|review/i);
    await page.getByText('How scoring works',{exact:true}).click();
    for(const heading of ['How WPM is calculated','Gross vs net WPM'])await expect(page.getByRole('heading',{level:3,name:heading})).toBeVisible();
    for(const heading of ['What is a typing speed test?','How It Works','1-minute typing test','Frequently asked questions'])
      await expect(page.getByRole('heading',{level:2,name:heading})).toBeVisible();
    const image=await page.request.get('/og-typing-test.png');
    expect(image.status()).toBe(200);
  });

  test('listed in the directory, Utilities category, search and navigation',async({page},testInfo)=>{
    await page.goto('/tools');
    await page.getByRole('textbox',{name:'Search tools'}).fill('typing');
    const cards=page.locator('.directory-grid .directory-tool-card');
    await expect(cards).toHaveCount(1);
    await expect(cards.first()).toHaveAttribute('href','/typing-test');
    await page.getByRole('textbox',{name:'Search tools'}).fill('wpm');
    await expect(cards).toHaveCount(1);
    await page.getByRole('textbox',{name:'Search tools'}).fill('');
    if(!isMobile(testInfo.project.name)){
      await page.locator('.directory-chips').getByRole('button',{name:/^Utilities/}).click();
      await expect(cards.filter({hasText:'Typing Speed Test'})).toHaveCount(1);
      await page.locator('.directory-chips').getByRole('button',{name:/^PDF/}).click();
      await expect(cards.filter({hasText:'Typing Speed Test'})).toHaveCount(0);
    }
    await page.goto('/tools');
    await page.getByRole('textbox',{name:'Search tools'}).fill('typing speed');
    await cards.first().click();
    await expect(page).toHaveURL(/\/typing-test$/);
  });
});

test('compact disclosures and result cards stay within eight viewport widths',async({page})=>{
  await page.clock.install();
  await page.setViewportSize({width:390,height:844});
  await open(page);
  const fit=async()=>{
    for(const width of [320,360,375,390,430,768,1024,1440]){
      await page.setViewportSize({width,height:900});
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),String(width)).toBe(true);
    }
  };
  await fit();
  await page.getByText('Options',{exact:true}).click();
  await expect(page.getByLabel('Difficulty')).toBeVisible();
  await expect(page.getByLabel('Text size')).toBeVisible();
  await fit();
  await page.getByText('Options',{exact:true}).click();
  await page.getByRole('button',{name:'15s',exact:true}).click();
  await input(page).focus();
  await page.keyboard.type((await prompt(page)).slice(0,20));
  await page.clock.fastForward(16000);
  await expect(page.getByTestId('results')).toBeVisible();
  await expect(page.getByText('Show graph data as a table')).toBeHidden();
  await page.getByText('Detailed Stats',{exact:true}).click();
  await page.getByText('History',{exact:true}).click();
  await fit();
  await page.setViewportSize({width:390,height:844});
  const history=page.getByRole('region',{name:'Recent tests'});
  expect(await history.evaluate(node=>node.scrollWidth<=node.clientWidth)).toBe(true);
});
