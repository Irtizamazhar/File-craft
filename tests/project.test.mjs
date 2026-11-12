import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync,existsSync} from 'node:fs';
const read=(path)=>readFileSync(path,'utf8');const catalog=JSON.parse(read('catalog/tools.json'));
test('tool slugs are unique and valid',()=>{assert.equal(new Set(catalog.map(t=>t.slug)).size,catalog.length);assert.ok(catalog.every(t=>/^[a-z0-9-]+$/.test(t.slug)))});
test('all public tools have a named engine route',()=>{const code=read('lib/browser-engine.ts');for(const t of catalog)assert.ok(code.includes(`'${t.slug}'`),t.slug)});
test('web app uses Next.js route handlers and MySQL schema',()=>{for(const f of ['app/api/auth/login/route.ts','app/api/auth/register/route.ts','app/api/activity/route.ts','app/api/contact/route.ts','sql/schema.sql'])assert.ok(existsSync(f),f)});
test('SEO and AdSense configuration is present',()=>{for(const f of ['app/sitemap.ts','app/robots.ts','app/ads.txt/route.ts','app/layout.tsx','lib/site.ts'])assert.ok(existsSync(f),f)});
test('deferred tools are not advertised in active catalog',()=>{const other=JSON.parse(read('catalog/deferred-tools.json'));const active=new Set(catalog.map(t=>t.slug));assert.equal(other.filter(t=>active.has(t.slug)).length,0)});
test('no legacy API proxy required',()=>{assert.ok(!read('next.config.mjs').includes('/api/v1'));});
