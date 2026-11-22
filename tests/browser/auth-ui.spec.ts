import {expect,test} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('signup displays validation and exposes both password controls',async({page})=>{
  await page.goto('/register');
  await page.getByLabel('Password',{exact:true}).fill('short');
  await page.getByLabel('Confirm password',{exact:true}).fill('different');
  await page.getByRole('heading',{level:1}).click();
  await expect(page.locator('#password-error')).toBeVisible();
  await expect(page.locator('#confirmPassword-error')).toBeVisible();
  await page.getByRole('button',{name:'Show password',exact:true}).click();
  await expect(page.getByLabel('Password',{exact:true})).toHaveAttribute('type','text');
  await page.getByRole('button',{name:'Hide password',exact:true}).click();
  await expect(page.getByLabel('Password',{exact:true})).toHaveAttribute('type','password');
  await page.getByRole('button',{name:'Show password confirmation'}).click();
  await expect(page.getByLabel('Confirm password',{exact:true})).toHaveAttribute('type','text');
  await expect(page.getByRole('link',{name:'Terms',exact:true}).first()).toHaveAttribute('href','/terms');
  await expect(page.getByRole('link',{name:'Privacy',exact:true}).first()).toHaveAttribute('href','/privacy');
});

test('Get started opens signup and recovery points to real help',async({page,isMobile})=>{
  await page.goto('/');
  if(isMobile)await page.getByRole('button',{name:'Open navigation'}).click();
  await page.getByRole('link',{name:'Get started',exact:true}).filter({visible:true}).click();
  await expect(page).toHaveURL(/\/register$/);
  await page.locator('.entry-switch').getByRole('link',{name:'Log in'}).click();
  await page.getByRole('link',{name:'Forgot password?'}).click();
  await expect(page.getByRole('heading',{name:'Forgot your password?'})).toBeVisible();
  await expect(page.getByText('Password reset emails are currently unavailable.')).toBeVisible();
  await expect(page.getByRole('link',{name:'Contact FileCraft'})).toHaveAttribute('href','/contact');
  expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations.map(v=>v.id)).toEqual([]);
  await page.getByRole('link',{name:'Back to log in'}).click();
  await expect(page).toHaveURL(/\/login$/);
});
