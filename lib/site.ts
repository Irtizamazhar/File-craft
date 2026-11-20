const raw = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
export const siteUrl = /^https?:\/\/[^/]+/.test(raw) ? raw.replace(/\/+$/, '') : 'http://localhost:3000';
export const businessName = (process.env.NEXT_PUBLIC_BUSINESS_NAME || '').trim();
export const publicContact = (process.env.NEXT_PUBLIC_CONTACT_EMAIL || '').trim();
export const operatorConfigured = businessName.length >= 3 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(publicContact);
export const sitePublic = operatorConfigured && /^https:\/\//.test(siteUrl) && !/example\.(com|org)|localhost|127\.0\.0\.1/.test(siteUrl) && process.env.NEXT_PUBLIC_INDEXABLE === 'true';
export const adsensePublisher = /^ca-pub-\d{16}$/.test(process.env.NEXT_PUBLIC_ADSENSE_CLIENT || '') ? process.env.NEXT_PUBLIC_ADSENSE_CLIENT! : '';
// Publisher ID alone is not authorization to serve advertising.
export const adsEnabled = sitePublic && !!adsensePublisher && process.env.NEXT_PUBLIC_ADSENSE_APPROVED==='true' && process.env.NEXT_PUBLIC_CMP_READY==='true';
export const googleVerification = /^[a-zA-Z0-9_-]{15,120}$/.test(process.env.GOOGLE_SITE_VERIFICATION || '') ? process.env.GOOGLE_SITE_VERIFICATION : '';
