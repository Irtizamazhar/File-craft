import {test,expect,type Page} from '@playwright/test';

// Signed-in header, profile menu and dashboard. Creates a throwaway QA account like journeys.spec.ts.
async function signUp(page:Page,name:string){
  const email='editgoo-account-ui-'+Date.now()+'-'+Math.random().toString(16).slice(2)+'@example.invalid';
  const password='Editgoo-test-'+Math.random().toString(36).slice(2);
  await page.goto('/register');
  await page.getByLabel('Full name',{exact:true}).fill(name);
  await page.getByLabel('Email address',{exact:true}).fill(email);
  await page.getByLabel('Password',{exact:true}).fill(password);
  await page.getByLabel('Confirm password',{exact:true}).fill(password);
  await page.getByRole('checkbox').check();
  await page.getByRole('button',{name:'Create account'}).click();
  await expect(page).toHaveURL(/dashboard/);
  return email;
}

test('signed-out visitors are sent from the dashboard to log in',async({page})=>{
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login$/);
  // signed-out header (on phones "Get started" sits in the closed menu panel, so look it up by href)
  await expect(page.locator('.site-header a[href="/register"]').first()).toBeAttached();
  await expect(page.getByRole('button',{name:/account menu/})).toHaveCount(0);
});

test('signed-in header, profile menu and dashboard',async({page,isMobile})=>{
  const email=await signUp(page,'Account Tester');
  await expect(page.getByRole('heading',{level:1,name:/^Good (morning|afternoon|evening), Account/})).toBeVisible();
  const profile=page.getByRole('button',{name:/account menu/});
  await expect(profile).toBeVisible();
  await expect(page.locator('.nav-actions')).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Notifications'})).toBeVisible();
  if(!isMobile){
    await expect(page.getByRole('link',{name:'Upgrade',exact:true})).toBeVisible();
    // signed-in nav: the same menus, Features and Pricing as before; no Dashboard link or search box
    const nav=page.getByRole('navigation',{name:'Main navigation'});
    await expect(nav.getByRole('button',{name:'All tools'})).toBeVisible();
    await expect(nav.getByRole('link',{name:'Dashboard',exact:true})).toHaveCount(0);
    await expect(nav.getByRole('link',{name:'Features',exact:true})).toBeVisible();
    await expect(nav.getByRole('link',{name:'Pricing',exact:true})).toBeVisible();
    await expect(page.locator('.site-header input[type=search]')).toHaveCount(0);
  }
  // menu: open, keyboard, Esc returns focus
  await profile.click();
  await expect(profile).toHaveAttribute('aria-expanded','true');
  const menu=page.getByRole('menu',{name:'Account'});
  await expect(menu.getByRole('menuitem')).toHaveCount(8);
  await expect(page.locator('.acct-panel')).toContainText(email);
  if(isMobile){
    await expect(page.getByRole('link',{name:'Upgrade to Pro'})).toBeVisible();
    await expect(page.locator('.acct-overlay')).toBeVisible();
    expect(await page.evaluate(()=>getComputedStyle(document.body).overflow)).toBe('hidden');
  }
  await page.keyboard.press('Escape');
  await expect(menu).toHaveCount(0);
  await expect(profile).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(menu.getByRole('menuitem',{name:'Dashboard'})).toBeFocused();
  await page.keyboard.press('End');
  await expect(menu.getByRole('menuitem',{name:'Sign out'})).toBeFocused();
  await page.keyboard.press('Escape');
  // dashboard data
  await expect(page.locator('#profile')).toContainText(email);
  await expect(page.getByText('Files processed')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  // sign out from the menu
  await profile.click();
  await menu.getByRole('menuitem',{name:'Sign out'}).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('button',{name:/account menu/})).toHaveCount(0);
});
