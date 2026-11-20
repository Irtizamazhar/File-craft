# SEO audit
Existing unique tool routes, metadata, canonical paths, robots, sitemap, article pages and JSON-LD are preserved. Staging indexing remains controlled by NEXT_PUBLIC_INDEXABLE and operator configuration.

BLOCKED: production domain/operator configuration and deployed-site checks. Configure the real HTTPS URL; do not publish localhost or example URLs. Local NEXT_PUBLIC_SITE_URL is http://localhost:3000 for development; replace it with the real public HTTPS domain before production and rebuild. Existing sitemap still emits configured URLs on staging, while robots disallows crawling. Verify canonical/OG URLs after rebuilding.

Google verification uses GOOGLE_SITE_VERIFICATION. Submit the production /sitemap.xml in Search Console after verifying domain ownership. No rankings, ratings or performance scores are claimed.
