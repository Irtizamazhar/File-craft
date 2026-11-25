import {test,expect,type Page} from '@playwright/test';
import sharp from 'sharp';

// Photos above 4 MP are no longer rejected. They open at full size up to the device budget (16 MP on computers;
// see editorPixelBudget in lib/advanced/image-editor.ts) and larger photos are scaled down automatically.
async function budget(page:Page){
  return page.evaluate(()=>{
    const memory=(navigator as Navigator&{deviceMemory?:number}).deviceMemory;
    if(memory!==undefined)return memory>=8?16_000_000:memory>=4?12_600_000:8_000_000;
    return matchMedia('(pointer: coarse)').matches?8_000_000:16_000_000;
  });
}
async function photo(width:number,height:number){
  return sharp('tests/fixtures/objects/watch.jpg').resize(width,height,{fit:'fill'}).jpeg({quality:85}).toBuffer();
}
const imageSize=(page:Page)=>page.locator('.original-image-frame canvas').evaluate((c:HTMLCanvasElement)=>[c.width,c.height]);

test('a 24 MP photo opens, is scaled to the device budget and its background is removed',async({page,isMobile})=>{
  test.skip(isMobile,'Uses the desktop memory budget');
  test.setTimeout(420000);
  await page.goto('/remove-background');
  const limit=await budget(page);
  await page.locator('input[type=file]').first().setInputFiles({name:'large.jpg',mimeType:'image/jpeg',buffer:await photo(6000,4000)});
  await expect(page.getByRole('status')).toContainText('Image loaded');
  await expect(page.getByRole('status')).toContainText('This photo is 6000 × 4000 pixels, so it was scaled to');
  const [width,height]=await imageSize(page);
  expect(width*height).toBeLessThanOrEqual(limit);
  expect(width*height).toBeGreaterThan(limit*.98);
  expect(Math.abs(width/height-1.5)).toBeLessThan(.01);
  await page.getByRole('button',{name:'Remove background',exact:true}).click();
  await expect(page.getByRole('status')).toContainText('Foreground estimated.',{timeout:360000});
  await expect(page.locator('main [role=alert]')).toHaveCount(0);
});

test('a 12 MP phone-size photo opens at full resolution',async({page,isMobile})=>{
  test.skip(isMobile,'Uses the desktop memory budget');
  await page.goto('/remove-background');
  test.skip(await budget(page)<4032*3024,'This device budget is below 12 MP');
  await page.locator('input[type=file]').first().setInputFiles({name:'phone.jpg',mimeType:'image/jpeg',buffer:await photo(4032,3024)});
  await expect(page.getByRole('status')).toContainText('Image loaded');
  await expect(page.getByRole('status')).not.toContainText('scaled to');
  expect(await imageSize(page)).toEqual([4032,3024]);
});
