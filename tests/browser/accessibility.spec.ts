import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
for(const path of ['/','/pricing','/tools','/tools/merge-pdf','/login','/register','/features','/contact'])test('automated accessibility '+path,async({page})=>{await page.goto(path);await page.locator('h1').waitFor();const scan=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();expect(scan.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>n.target)}))).toEqual([])});
