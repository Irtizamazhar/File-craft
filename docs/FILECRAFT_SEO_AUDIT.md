# FileCraft SEO audit
Preserved established /tools/[slug] and /guides/[slug] URLs. Dynamic params now use the Next.js 15 async API. Unsupported dynamic routes are restricted to registered paths. Root loading was moved to a scoped dashboard loading screen after browser tests found streamed unknown paths returning 200. The corrected unknown route returns 404 in a browser test.

Added homepage and directory canonical metadata, a visible edit-PDF category, conversion/features/cookie pages, and BreadcrumbList alongside existing SoftwareApplication schema. Tool pages now have distinct output explanations and limitations from lib/tool-details.ts plus visible FAQs. No review/rating claims are generated. Existing useful guides remain linked.

Sitemap now contains no localhost or staging entries when sitePublic is false. The public sitemap includes new legitimate pages, tools and guides. Private/admin/auth layouts retain noindex. Public indexing still requires operator details, real HTTPS NEXT_PUBLIC_SITE_URL and NEXT_PUBLIC_INDEXABLE=true. Local environment remains non-indexable.

Staging prevention is verified by configuration and local browser/HTTP tests, not by crawling a deployed domain. Production canonical/domain verification and Search Console submission remain operator tasks. Configure GOOGLE_SITE_VERIFICATION and submit /sitemap.xml only on the real public domain.

Official guidance reviewed: https://developers.google.com/search/docs/essentials and https://developers.google.com/search/docs/fundamentals/creating-helpful-content . The implementation favors visible useful content, established URLs, accurate metadata and mobile parity, without ranking guarantees.
