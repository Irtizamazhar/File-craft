# Google Search Console launch checklist

This checklist is for a separate, explicitly approved launch. Current staging keeps indexing, ads and CMP activation disabled.

## Before changing the indexing flag

- Confirm the real legal operator name and a monitored public contact email. Configure the existing `NEXT_PUBLIC_BUSINESS_NAME` and `NEXT_PUBLIC_CONTACT_EMAIL` settings with verified values and check their display on the contact and legal pages. Editgoo's `operatorConfigured` and `sitePublic` gates must evaluate as intended.
- Confirm production `NEXT_PUBLIC_SITE_URL=https://www.editgoo.com`, HTTPS on both hosts and the existing apex-to-www 308 with paths and query values. Verify the deployed canonical and Open Graph URLs on representative pages.
- Verify the deployed candidate against the route audit. Check user-facing 404s, public page success responses, query canonicalization, social assets, navigation and every page family. Confirm anonymous sessions cannot access private account or admin data.
- Verify live tool and contact behavior with authorized test accounts and fixtures. For the Internet Speed Test, obtain explicit consent before a real M-Lab run.
- Measure mobile lab performance and record any field Core Web Vitals already available. Verify that public pages and required asset URLs are reachable.
- Keep `NEXT_PUBLIC_ADSENSE_APPROVED=false` and `NEXT_PUBLIC_CMP_READY=false` for the SEO launch. Ads and analytics decisions are separate.

## Only after launch authorization

1. Use a verified Search Console property for Editgoo. Complete only the ownership mechanism agreed with the operator. [Google Search Console guidance](https://developers.google.com/search/docs/monitor-debug/search-console-start)
2. Enable `NEXT_PUBLIC_INDEXABLE=true` in the authorized production release and rebuild. Check that the public pages allow indexing, `robots.txt` permits their crawl and lists the sitemap, and private pages retain their intended protections.
3. Inspect `https://www.editgoo.com/sitemap.xml` before submission. It should list only preferred public, successful, indexable URLs. Check both utility routes, representative tool and guide routes, and the absence of login, admin, dashboard and filtered URLs. [Google sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
4. Inspect representative live URLs in Search Console. Submit the canonical sitemap and monitor Page Indexing, Crawl Stats and Core Web Vitals. Search Console submission requests discovery. Indexing remains Google's decision. [Google URL inspection and recrawl guidance](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl)
