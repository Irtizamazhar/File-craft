import {expect,test} from '@playwright/test';

const labels=['All tools','PDF tools','Convert'];

test('desktop mouse switches disclosures, crosses into the panel and follows a link',async({page,isMobile})=>{
  test.skip(isMobile,'Mouse behavior requires a desktop mouse profile');
  await page.setViewportSize({width:1440,height:900});
  await page.goto('/');
  const nav=page.getByRole('navigation',{name:'Main navigation'});
  const button=(name:string)=>nav.getByRole('button',{name,exact:true});
  const select=async(name:string)=>{
    await button(name).hover();
    await expect(button(name)).toHaveAttribute('aria-expanded','true');
    await expect(nav.locator('.nav-dropdown-panel:visible')).toHaveCount(1);
  };
  await select(labels[0]);
  const panel=nav.locator('.nav-dropdown-panel:visible');
  await panel.getByRole('link',{name:'Remove Background'}).hover();
  await expect(panel).toBeVisible();
  await select(labels[1]);
  await select(labels[2]);
  await page.getByRole('heading',{level:1}).hover();
  await expect(button(labels[2])).toHaveAttribute('aria-expanded','false');
  await select(labels[0]);
  await page.keyboard.press('Escape');
  await expect(panel).toHaveCount(0);
  await button(labels[0]).click();
  await expect(panel).toBeVisible();
  await panel.getByRole('link',{name:'Remove Background'}).click();
  await expect(page).toHaveURL(/\/remove-background$/);
  await expect(panel).toHaveCount(0);
});

test('keyboard keeps focus in disclosures and Escape restores it',async({page,isMobile})=>{
  test.skip(isMobile,'Uses keyboard navigation in the desktop layout');
  await page.setViewportSize({width:1024,height:900});
  await page.goto('/');
  const trigger=page.getByRole('button',{name:'All tools',exact:true});
  await page.locator('header .brand').focus();
  await page.keyboard.press('Tab');
  await expect(trigger).toBeFocused();
  await page.keyboard.press('Space');
  await page.keyboard.press('Tab');
  const firstLink=page.locator('#menu-All-tools').getByRole('link',{name:'All tools',exact:true});
  await expect(firstLink).toBeFocused();
  await page.getByRole('button',{name:'PDF tools',exact:true}).hover();
  await expect(firstLink).toBeFocused();
  await expect(trigger).toHaveAttribute('aria-expanded','true');
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute('aria-expanded','false');
  await page.keyboard.press('Enter');
  await expect(trigger).toHaveAttribute('aria-expanded','true');
  await page.keyboard.press('Shift+Tab');
  await expect(trigger).toHaveAttribute('aria-expanded','false');
});

test('touch expands and collapses categories without hovering',async({page,hasTouch})=>{
  test.skip(!hasTouch,'Uses a touchscreen browser profile');
  await page.goto('/');
  await page.getByRole('button',{name:'Open navigation'}).tap();
  const pdf=page.getByRole('button',{name:'PDF tools',exact:true});
  const convert=page.getByRole('button',{name:'Convert',exact:true});
  await pdf.tap();
  await expect(pdf).toHaveAttribute('aria-expanded','true');
  await pdf.tap();
  await expect(pdf).toHaveAttribute('aria-expanded','false');
  await pdf.tap();
  await expect(pdf).toHaveAttribute('aria-expanded','true');
  await convert.tap();
  await expect(pdf).toHaveAttribute('aria-expanded','false');
  await expect(convert).toHaveAttribute('aria-expanded','true');
  await page.getByRole('link',{name:'Word to PDF',exact:true}).tap();
  await expect(page).toHaveURL(/\/tools\/docx-to-pdf$/);
  await expect(page.getByRole('button',{name:'Open navigation'})).toHaveAttribute('aria-expanded','false');
});

test('menu bounds and existing destinations at all requested widths',async({page,isMobile})=>{
  test.skip(isMobile,'Exercises both viewport layouts in one desktop profile');
  await page.goto('/');
  const nav=page.getByRole('navigation',{name:'Main navigation'});
  for(const width of [360,390,768,1024,1440,1920]){
    await page.setViewportSize({width,height:900});
    if(width<=900)await page.getByRole('button',{name:'Open navigation'}).click();
    for(const label of labels){
      const trigger=nav.getByRole('button',{name:label,exact:true});
      if(width<=900)await trigger.click();
      else await trigger.hover();
      const panel=nav.locator('.nav-dropdown-panel:visible');
      await expect(panel).toHaveCount(1);
      const bounds=await panel.boundingBox();
      expect(bounds?.x).toBeGreaterThanOrEqual(0);
      expect(bounds!.x+bounds!.width).toBeLessThanOrEqual(width);
      expect(bounds!.y+bounds!.height).toBeLessThanOrEqual(900);
      expect(await panel.evaluate(element=>{
        const bounds=element.getBoundingClientRect();
        return element.contains(document.elementFromPoint(bounds.x+15,bounds.y+15));
      })).toBe(true);
    }
    if(width<=900)await page.getByRole('button',{name:'Close navigation'}).click();
  }
  for(const href of await nav.locator('.nav-dropdown-panel a').evaluateAll(links=>[...new Set(links.map(a=>a.getAttribute('href')))])){
    expect((await page.request.get(href!)).ok(),href!).toBe(true);
  }
});

test.describe('touch at desktop width',()=>{
  test.use({hasTouch:true,isMobile:false,viewport:{width:1024,height:900}});
  test('desktop disclosures still toggle with taps',async({page})=>{
    await page.goto('/');
    const trigger=page.getByRole('button',{name:'PDF tools',exact:true});
    await trigger.tap();
    await expect(trigger).toHaveAttribute('aria-expanded','true');
    await trigger.tap();
    await expect(trigger).toHaveAttribute('aria-expanded','false');
  });
});
